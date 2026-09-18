/**
 * Cart state for the Golden Path.
 *
 * While the catalogue is mock data, the cart lives in localStorage: mock
 * products have no Shopify variant IDs, so Storefront API cart mutations
 * can't accept them. All commercial rules live in ~/lib/offer-engine, so
 * swapping persistence for Hydrogen's CartForm/`context.cart` later changes
 * this file only.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {Campaign, CatalogIndex} from '~/lib/catalog/types';
import {
  addToCartLines,
  getBestBundleUpgrade,
  getCartTotals,
  removeFromCartLines,
  type AddResult,
  type BundleUpgradeOffer,
  type CartLines,
  type CartTotals,
} from '~/lib/offer-engine';
import {productDimensions, track} from '~/lib/analytics';

const STORAGE_KEY = 'tb:cart:v1';

export type AddPlacement =
  | 'pdp_hero'
  | 'pdp_sticky'
  | 'pdp_final'
  | 'pdp_bundle'
  | 'card'
  | 'cart_cross_sell'
  | 'cart_bundle_upgrade'
  | 'homepage_bundle';

type CartNotice = {tone: 'success' | 'info'; message: string} | null;

type CartContextValue = {
  lines: CartLines;
  /** False until localStorage has been read, to avoid flashing an empty cart. */
  ready: boolean;
  index: CatalogIndex;
  campaign: Campaign | null;
  catalogSource: 'mock' | 'shopify';
  totals: CartTotals;
  upgrade: BundleUpgradeOffer | null;
  notice: CartNotice;
  isOpen: boolean;
  add: (handle: string, placement: AddPlacement) => AddResult;
  remove: (handle: string) => void;
  open: (source?: string) => void;
  close: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredLines(index: CatalogIndex): CartLines {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // Drop products that no longer exist and any duplicates.
    return [...new Set(parsed.filter((h): h is string => typeof h === 'string' && !!index[h]))];
  } catch {
    return [];
  }
}

export function CartProvider({
  children,
  index,
  campaign,
  catalogSource,
}: {
  children: ReactNode;
  index: CatalogIndex;
  campaign: Campaign | null;
  catalogSource: 'mock' | 'shopify';
}) {
  const [lines, setLines] = useState<CartLines>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState<CartNotice>(null);
  const linesRef = useRef(lines);
  linesRef.current = lines;

  useEffect(() => {
    setLines(readStoredLines(index));
    setReady(true);
  }, [index]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage unavailable: cart still works for this page view.
    }
  }, [lines, ready]);

  const totals = useMemo(() => getCartTotals(lines, index, campaign), [lines, index, campaign]);
  const upgrade = useMemo(
    () => getBestBundleUpgrade(lines, index, campaign),
    [lines, index, campaign],
  );

  // progress_offer_unlock fires on the transition, not on every render.
  const wasUnlocked = useRef<boolean | null>(null);
  useEffect(() => {
    if (!ready) return;
    const unlocked = totals.progress?.unlocked ?? false;
    if (wasUnlocked.current === false && unlocked) {
      track('progress_offer_unlock', {
        campaign_id: totals.progress!.campaign.id,
        value: totals.totalCents / 100,
        currency: 'EUR',
      });
    }
    wasUnlocked.current = unlocked;
  }, [ready, totals]);

  const open = useCallback((source = 'header') => {
    setIsOpen(true);
    track('cart_open', {placement: source, item_count: linesRef.current.length});
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setNotice(null);
  }, []);

  const add = useCallback(
    (handle: string, placement: AddPlacement) => {
      const result = addToCartLines(linesRef.current, handle, index);
      const product = index[handle];

      if (result.status === 'added') {
        setLines(result.lines);
        const replacedTitles = result.replaced.map((h) => index[h]?.title).filter(Boolean);
        setNotice({
          tone: 'success',
          message: replacedTitles.length
            ? `${product.title} added. It includes ${replacedTitles.join(' and ')}, so ${replacedTitles.length > 1 ? 'they were' : 'it was'} removed — you won’t pay twice.`
            : `${product.title} added to your cart.`,
        });

        const dims = {...productDimensions(product), placement};
        if (placement === 'cart_cross_sell') track('add_cross_sell', dims);
        else if (placement === 'cart_bundle_upgrade' || placement === 'pdp_bundle') {
          track('accept_bundle_upgrade', {...dims, bundle_id: product.factoryId, replaced: result.replaced});
        }
        track('add_to_cart', dims);
      } else if (result.status === 'covered-by-bundle') {
        setNotice({tone: 'info', message: `${product.title} is already included in a bundle in your cart.`});
      } else if (result.status === 'already-in-cart') {
        setNotice({tone: 'info', message: `${product.title} is already in your cart.`});
      }

      setIsOpen(true);
      return result;
    },
    [index],
  );

  const remove = useCallback(
    (handle: string) => {
      setLines((current) => removeFromCartLines(current, handle));
      setNotice(null);
      const product = index[handle];
      if (product) track('remove_from_cart', productDimensions(product));
    },
    [index],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      index,
      campaign,
      catalogSource,
      totals,
      upgrade,
      notice,
      isOpen,
      add,
      remove,
      open,
      close,
    }),
    [lines, ready, index, campaign, catalogSource, totals, upgrade, notice, isOpen, add, remove, open, close],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error('useCart must be used within a CartProvider');
  return cart;
}

/** Cart status of one product, for button labels. */
export function useCartStatus(handle: string): 'in-cart' | 'in-bundle' | 'available' {
  const {lines, index} = useCart();
  if (lines.includes(handle)) return 'in-cart';
  if (lines.some((line) => index[line]?.bundleItems?.includes(handle))) return 'in-bundle';
  return 'available';
}
