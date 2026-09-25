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
import {useFetcher} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
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

type ShopifyCart = {
  checkoutUrl: string;
  lines: {nodes: Array<{id: string; merchandise?: {product?: {handle: string}}}>};
  cost?: {subtotalAmount?: {amount: string}; totalAmount?: {amount: string}};
};

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
  busy: boolean;
  checkoutUrl: string | null;
  index: CatalogIndex;
  campaign: Campaign | null;
  catalogSource: 'mock' | 'shopify';
  checkoutEnabled: boolean;
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
  checkoutEnabled,
}: {
  children: ReactNode;
  index: CatalogIndex;
  campaign: Campaign | null;
  catalogSource: 'mock' | 'shopify';
  checkoutEnabled: boolean;
}) {
  const [lines, setLines] = useState<CartLines>([]);
  const [ready, setReady] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [lineIds, setLineIds] = useState<Record<string, string>>({});
  const fetcher = useFetcher<{cart?: ShopifyCart | null; errors?: unknown} | ShopifyCart | null>();
  const busy = catalogSource === 'shopify' && fetcher.state !== 'idle';
  const loadCart = fetcher.load;
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState<CartNotice>(null);
  const linesRef = useRef(lines);
  linesRef.current = lines;

  useEffect(() => {
    if (catalogSource === 'shopify') {
      void loadCart('/cart');
    } else {
      setLines(readStoredLines(index));
      setReady(true);
    }
  }, [catalogSource, index, loadCart]);

  useEffect(() => {
    if (catalogSource !== 'shopify' || fetcher.data === undefined) return;
    if (fetcher.data && 'errors' in fetcher.data && (Array.isArray(fetcher.data.errors) ? fetcher.data.errors.length > 0 : Boolean(fetcher.data.errors))) {
      setNotice({tone: 'info', message: 'Le panier Shopify est indisponible. Réessayez.'});
      setReady(false);
      return;
    }
    const cart = fetcher.data && 'lines' in fetcher.data ? fetcher.data as ShopifyCart : fetcher.data?.cart;
    const nodes = cart?.lines?.nodes ?? [];
    setLines(nodes.map(node => node.merchandise?.product?.handle).filter((handle): handle is string => !!handle && !!index[handle]));
    setLineIds(Object.fromEntries(nodes.map(node => [node.merchandise?.product?.handle, node.id]).filter((pair): pair is [string, string] => !!pair[0])));
    setCheckoutUrl(cart?.checkoutUrl || null);
    setReady(true);
  }, [catalogSource, fetcher.data, index]);

  useEffect(() => {
    if (!ready || catalogSource === 'shopify') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage unavailable: cart still works for this page view.
    }
  }, [lines, ready, catalogSource]);

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
      if (!ready || busy) return {status: 'unknown', lines: linesRef.current, replaced: []} as AddResult;
      const result = addToCartLines(linesRef.current, handle, index);
      const product = index[handle];

      if (result.status === 'added' && catalogSource === 'shopify') {
        if (!product.variantId) {
          setNotice({tone: 'info', message: 'Cette fiche ne peut pas encore être ajoutée au panier Shopify.'});
          return {status: 'unknown', lines: linesRef.current, replaced: []} as AddResult;
        }
        void fetcher.submit(
          {cartFormInput: JSON.stringify({
            action: 'CustomFactoryReplace',
            inputs: {
              removeLineIds: result.replaced.map(h => lineIds[h]).filter(Boolean),
              lines: [{merchandiseId: product.variantId, quantity: 1}],
            },
          })},
          {method: 'POST', action: '/cart'},
        );
      }

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
    [index, ready, busy, catalogSource, fetcher, lineIds],
  );

  const remove = useCallback(
    (handle: string) => {
      if (!ready || busy) return;
      if (catalogSource === 'shopify' && lineIds[handle]) {
        void fetcher.submit(
          {cartFormInput: JSON.stringify({action: CartForm.ACTIONS.LinesRemove, inputs: {lineIds: [lineIds[handle]]}})},
          {method: 'POST', action: '/cart'},
        );
      }
      setLines((current) => removeFromCartLines(current, handle));
      setNotice(null);
      const product = index[handle];
      if (product) track('remove_from_cart', productDimensions(product));
    },
    [index, ready, busy, catalogSource, lineIds, fetcher],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      busy,
      checkoutUrl,
      index,
      campaign,
      catalogSource,
      checkoutEnabled,
      totals,
      upgrade,
      notice,
      isOpen,
      add,
      remove,
      open,
      close,
    }),
    [lines, ready, busy, checkoutUrl, index, campaign, catalogSource, checkoutEnabled, totals, upgrade, notice, isOpen, add, remove, open, close],
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
