/**
 * Offer Engine — pure, deterministic commercial logic.
 *
 * No React, no I/O. Components pass in the catalogue index, cart handles and
 * campaigns; this module decides what to show. Everything here is unit
 * tested in offer-engine.test.ts.
 */
import type {Campaign, CatalogIndex, ProductSummary} from '~/lib/catalog/types';
import type {InterestProfile} from '~/lib/personalization';

/** Digital products: a cart is a list of unique product handles (qty 1). */
export type CartLines = string[];

export const NEW_BADGE_WINDOW_DAYS = 30;

// ---------------------------------------------------------------- Campaigns

export function isCampaignLive(campaign: Campaign, now = new Date()) {
  if (!campaign.enabled) return false;
  if (campaign.startsAt) {
    const start = new Date(campaign.startsAt);
    if (!Number.isFinite(start.getTime()) || now < start) return false;
  }
  if (campaign.endsAt) {
    const end = new Date(campaign.endsAt);
    if (!Number.isFinite(end.getTime()) || now > end) return false;
  }
  return true;
}

/**
 * Campaigns the UI is allowed to advertise. A `mock` discount is only shown
 * against mock catalogue data, so a live store can never display a discount
 * that Shopify checkout won't apply.
 */
export function getDisplayableCampaigns(
  campaigns: Campaign[],
  {now = new Date(), catalogSource}: {now?: Date; catalogSource: 'mock' | 'shopify'},
) {
  return campaigns.filter(
    (campaign) =>
      isCampaignLive(campaign, now) &&
      (campaign.discountSource !== 'mock' || catalogSource === 'mock'),
  );
}

export function isEligibleForCampaign(product: ProductSummary, campaign: Campaign) {
  return campaign.eligibleTiers.includes(product.tier);
}

// ---------------------------------------------------------------- Badges

export function isNew(product: Pick<ProductSummary, 'publishedAt'>, now = new Date()) {
  const published = new Date(product.publishedAt);
  if (!Number.isFinite(published.getTime()) || published > now) return false;
  const ageDays = (now.getTime() - published.getTime()) / 86_400_000;
  return ageDays <= NEW_BADGE_WINDOW_DAYS;
}

export type DisplayBadge = 'new' | 'featured' | 'best-seller';

export function getBadges(product: ProductSummary, now = new Date()): DisplayBadge[] {
  const badges: DisplayBadge[] = [];
  // Only real sales data can make something a best-seller.
  if (product.salesRank !== undefined && product.salesRank <= 3) badges.push('best-seller');
  if (isNew(product, now)) badges.push('new');
  if (product.badges.includes('featured')) badges.push('featured');
  return badges;
}

// ---------------------------------------------------------------- Bundles

export function getBundleValue(bundle: ProductSummary, index: CatalogIndex) {
  const items = (bundle.bundleItems ?? [])
    .map((handle) => index[handle])
    .filter(Boolean);
  const separateCents = items.reduce((sum, item) => sum + item.priceCents, 0);
  const savingsCents = Math.max(0, separateCents - bundle.priceCents);
  const savingsPercent = separateCents
    ? Math.round((savingsCents / separateCents) * 100)
    : 0;
  return {items, separateCents, savingsCents, savingsPercent};
}

/** Primary bundle for a tool, with its real savings. */
export function getProductBundleOffer(product: ProductSummary, index: CatalogIndex) {
  const handle = product.bundleUpgrade?.handle;
  const bundle = handle ? index[handle] : undefined;
  if (!bundle || !bundle.bundleItems?.includes(product.handle)) return null;
  return {
    bundle,
    headline: product.bundleUpgrade!.headline,
    ...getBundleValue(bundle, index),
  };
}

/** Bundles in the cart that already include this product. */
export function coveringBundles(handle: string, lines: CartLines, index: CatalogIndex) {
  return lines
    .map((line) => index[line])
    .filter((item) => item?.bundleItems?.includes(handle));
}

// ---------------------------------------------------------------- Cart edits

export type AddResult =
  | {status: 'added'; lines: CartLines; replaced: string[]}
  | {status: 'already-in-cart' | 'covered-by-bundle' | 'unknown'; lines: CartLines; replaced: []};

/**
 * Adds a product without ever creating duplicates:
 * - a tool already covered by a bundle in the cart is refused;
 * - adding a bundle removes the tools it includes (they'd be paid twice).
 */
export function addToCartLines(
  lines: CartLines,
  handle: string,
  index: CatalogIndex,
): AddResult {
  const product = index[handle];
  if (!product) return {status: 'unknown', lines, replaced: []};
  if (lines.includes(handle)) return {status: 'already-in-cart', lines, replaced: []};
  if (coveringBundles(handle, lines, index).length) {
    return {status: 'covered-by-bundle', lines, replaced: []};
  }

  const included = new Set(product.bundleItems ?? []);
  const replaced = lines.filter((line) => included.has(line));
  const kept = lines.filter((line) => !included.has(line));
  return {status: 'added', lines: [...kept, handle], replaced};
}

export function removeFromCartLines(lines: CartLines, handle: string) {
  return lines.filter((line) => line !== handle);
}

// ---------------------------------------------------------------- Totals

export type ProgressState = {
  campaign: Campaign;
  eligibleCount: number;
  remaining: number;
  unlocked: boolean;
};

export type CartTotals = {
  items: ProductSummary[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  progress: ProgressState | null;
};

export function getCartTotals(
  lines: CartLines,
  index: CatalogIndex,
  campaign: Campaign | null,
): CartTotals {
  const items = lines.map((handle) => index[handle]).filter(Boolean);
  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents, 0);

  if (!campaign) {
    return {items, subtotalCents, discountCents: 0, totalCents: subtotalCents, progress: null};
  }

  const eligible = items.filter((item) => isEligibleForCampaign(item, campaign));
  const unlocked = eligible.length >= campaign.thresholdQuantity;
  const eligibleCents = eligible.reduce((sum, item) => sum + item.priceCents, 0);
  const discountCents = unlocked
    ? Math.round((eligibleCents * campaign.discountPercent) / 100)
    : 0;

  return {
    items,
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
    progress: {
      campaign,
      eligibleCount: eligible.length,
      remaining: Math.max(0, campaign.thresholdQuantity - eligible.length),
      unlocked,
    },
  };
}

// ---------------------------------------------------------------- Upgrade

export type BundleUpgradeOffer = {
  bundle: ProductSummary;
  /** Tools already in the cart that the bundle replaces. */
  replaces: ProductSummary[];
  /** Tools the customer gains. */
  gains: ProductSummary[];
  /** What the cart total changes by, after all discounts. */
  deltaCents: number;
  /** Standalone value of the gained tools. */
  gainedValueCents: number;
};

/**
 * Best bundle to offer from the current cart. The price difference is
 * computed by simulating the swap with real totals (including any progress
 * discount the customer would lose), so the "only €X more" claim is exact.
 */
export function getBestBundleUpgrade(
  lines: CartLines,
  index: CatalogIndex,
  campaign: Campaign | null,
): BundleUpgradeOffer | null {
  const current = getCartTotals(lines, index, campaign).totalCents;
  const inCart = new Set(lines);

  const candidates = Object.values(index)
    .filter((product) => product.bundleItems?.length && !inCart.has(product.handle))
    .map((bundle) => {
      const replaces = bundle.bundleItems!.filter((h) => inCart.has(h)).map((h) => index[h]);
      if (!replaces.length) return null;
      const next = addToCartLines(lines, bundle.handle, index);
      if (next.status !== 'added') return null;
      const gains = bundle.bundleItems!.filter((h) => !inCart.has(h)).map((h) => index[h]).filter(Boolean);
      const deltaCents = getCartTotals(next.lines, index, campaign).totalCents - current;
      const gainedValueCents = gains.reduce((sum, item) => sum + item.priceCents, 0);
      return {bundle, replaces, gains, deltaCents, gainedValueCents};
    })
    .filter((offer): offer is BundleUpgradeOffer => offer !== null)
    // Only offer upgrades where the customer gets more value than they pay.
    .filter((offer) => offer.gains.length > 0 && offer.gainedValueCents > offer.deltaCents);

  candidates.sort(
    (a, b) =>
      b.replaces.length - a.replaces.length ||
      b.gainedValueCents - b.deltaCents - (a.gainedValueCents - a.deltaCents) ||
      a.bundle.handle.localeCompare(b.bundle.handle),
  );
  return candidates[0] ?? null;
}

// ---------------------------------------------------------------- Cross-sells

export type CrossSellOffer = {product: ProductSummary; reason: string; score: number};

/**
 * Cross-sells from the offer definitions of the given source products,
 * excluding anything already in the cart or covered by a bundle in it.
 * Session interests only break ties between comparable priorities.
 */
export function rankCrossSells(
  sources: string[],
  lines: CartLines,
  index: CatalogIndex,
  {interests = {}, limit = 2}: {interests?: InterestProfile; limit?: number} = {},
): CrossSellOffer[] {
  const best = new Map<string, CrossSellOffer>();

  for (const sourceHandle of sources) {
    for (const rel of index[sourceHandle]?.crossSells ?? []) {
      const product = index[rel.handle];
      if (!product) continue;
      if (lines.includes(rel.handle) || sources.includes(rel.handle)) continue;
      if (coveringBundles(rel.handle, lines, index).length) continue;

      const interestBoost = [...product.problemTags, ...product.businessTags].reduce(
        (sum, tag) => sum + Math.min(interests[tag] ?? 0, 10),
        0,
      );
      const score = rel.priority + interestBoost;
      const existing = best.get(rel.handle);
      if (!existing || existing.score < score) {
        best.set(rel.handle, {product, reason: rel.reason, score});
      }
    }
  }

  return [...best.values()]
    .sort((a, b) => b.score - a.score || a.product.handle.localeCompare(b.product.handle))
    .slice(0, limit);
}
