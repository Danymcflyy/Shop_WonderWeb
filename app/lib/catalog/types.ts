/**
 * Catalogue model used by every page and by the offer engine.
 *
 * The mock source fills these types from local data. When Shopify is linked,
 * a Storefront API source fills the same types from products + metafields
 * (see storefront/README.md → "Shopify data mapping"), so page components
 * never change.
 */

export type Tier = 'impulse' | 'core' | 'bundle' | 'vault';

/** `best-seller` is only valid when backed by `salesRank` (real sales data). */
export type Badge = 'new' | 'featured' | 'best-seller';

/** Top-level store sections. Each has its own homepage, navigation and accent. */
export type UniverseId = 'pro' | 'lifestyle';

export type ProblemId =
  // Pro
  | 'find-clients'
  | 'profit'
  | 'organize'
  | 'marketing'
  | 'local'
  // Lifestyle
  | 'money'
  | 'home'
  | 'wellbeing';

export type BusinessTypeId =
  | 'artisans'
  | 'freelancers'
  | 'agencies'
  | 'ecommerce'
  | 'local-shops';

export type FileFormat = 'xlsx' | 'sheets' | 'docx' | 'pdf' | 'notion' | 'canva';

export type PreviewKind =
  | 'sheet'
  | 'dashboard'
  | 'doc'
  | 'checklist'
  | 'scripts'
  | 'planner'
  | 'bundle';

export type OfferDefinition = {
  tier: Tier;
  problemTags: ProblemId[];
  businessTags: BusinessTypeId[];
  crossSells: Array<{handle: string; priority: number; reason: string}>;
  bundleUpgrade?: {handle: string; headline: string};
  progressOffer?: {campaignId: string};
  /** Editorial badges only. `new` is computed from publishedAt, `best-seller` from salesRank. */
  badges?: Array<'featured'>;
};

export type Product = {
  handle: string;
  universe: UniverseId;
  factoryId: string;
  /** Real Shopify variant ID, required for cart mutations. */
  variantId?: string;
  title: string;
  /** One-line outcome shown under the title and on cards. */
  tagline: string;
  priceCents: number;
  /** Human format label, e.g. "Spreadsheet calculator". */
  format: string;
  formats: FileFormat[];
  timeToValue: string;
  publishedAt: string;
  /** Rank from real sales data. Undefined until the store has orders. */
  salesRank?: number;
  problem: {headline: string; points: string[]};
  outcome: {headline: string; points: string[]};
  included: Array<{name: string; format: FileFormat; detail: string}>;
  howItWorks: string[];
  example?: {title: string; setup: string; result: string; note: string};
  faq: Array<{q: string; a: string}>;
  preview: {kind: PreviewKind; imageUrl?: string; alt?: string};
  offer: OfferDefinition;
  /** Bundles only: handles of the tools included. */
  bundleItems?: string[];
};

/** Slim product shape sent to the client for the cart and the offer engine. */
export type ProductSummary = Pick<
  Product,
  | 'handle'
  | 'universe'
  | 'factoryId'
  | 'variantId'
  | 'title'
  | 'tagline'
  | 'priceCents'
  | 'format'
  | 'formats'
  | 'publishedAt'
  | 'salesRank'
  | 'preview'
  | 'bundleItems'
> & {
  tier: Tier;
  problemTags: ProblemId[];
  businessTags: BusinessTypeId[];
  crossSells: OfferDefinition['crossSells'];
  bundleUpgrade?: OfferDefinition['bundleUpgrade'];
  badges: Array<'featured'>;
};

export type CatalogIndex = Record<string, ProductSummary>;

export type CollectionDefinition = {
  handle: string;
  /** Undefined for store-wide collections (all universes). */
  universe?: UniverseId;
  kind: 'problem' | 'business' | 'bundles' | 'all';
  title: string;
  /** The pain, in the customer's words. Shown first on the collection page. */
  problem: string;
  /** What the tools in this collection get you. */
  outcome: string;
  filter: {universe?: UniverseId; problem?: ProblemId; business?: BusinessTypeId; tiers?: Tier[]};
  /** Bundle surfaced at the top of the collection. */
  bundleHandle?: string;
};

export type Campaign = {
  id: string;
  type: 'cart_threshold';
  headline: string;
  eligibleTiers: Tier[];
  thresholdQuantity: number;
  discountPercent: number;
  enabled: boolean;
  /** ISO dates. `null` endsAt = evergreen offer, never shown with a countdown. */
  startsAt: string | null;
  endsAt: string | null;
  /**
   * Where the discount is actually applied. The UI must never advertise a
   * discount that checkout will not honour, so `mock` campaigns are only
   * shown while the catalogue itself is mock data.
   */
  discountSource: 'shopify-automatic' | 'shopify-code' | 'mock';
  discountCode?: string;
};
