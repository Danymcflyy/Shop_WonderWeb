import {MOCK_CAMPAIGNS, MOCK_COLLECTIONS, MOCK_PRODUCTS} from './mock-data';
import type {
  BusinessTypeId,
  Campaign,
  CatalogIndex,
  CollectionDefinition,
  Product,
  ProductSummary,
} from './types';

export type * from './types';

export type SortKey = 'recommended' | 'price-asc' | 'price-desc' | 'newest';

export const SORT_OPTIONS: Array<{key: SortKey; label: string}> = [
  {key: 'recommended', label: 'Recommended'},
  {key: 'price-asc', label: 'Price: low to high'},
  {key: 'price-desc', label: 'Price: high to low'},
  {key: 'newest', label: 'Newest'},
];

/**
 * Every page loads data through this interface. The mock implementation is
 * used until Shopify is linked; a Storefront API implementation will return
 * the same shapes (products + metafields → Product).
 */
export type Catalog = {
  source: 'mock' | 'shopify';
  getProduct(handle: string): Promise<Product | null>;
  getCollection(
    handle: string,
    options?: {sort?: SortKey; business?: BusinessTypeId | null},
  ): Promise<{collection: CollectionDefinition; products: ProductSummary[]} | null>;
  listCollections(kind?: CollectionDefinition['kind']): Promise<CollectionDefinition[]>;
  getIndex(): Promise<CatalogIndex>;
  getCampaigns(): Promise<Campaign[]>;
};

export function toSummary(product: Product): ProductSummary {
  const {offer} = product;
  return {
    handle: product.handle,
    factoryId: product.factoryId,
    title: product.title,
    tagline: product.tagline,
    priceCents: product.priceCents,
    format: product.format,
    formats: product.formats,
    publishedAt: product.publishedAt,
    salesRank: product.salesRank,
    preview: product.preview,
    bundleItems: product.bundleItems,
    tier: offer.tier,
    problemTags: offer.problemTags,
    businessTags: offer.businessTags,
    crossSells: offer.crossSells,
    bundleUpgrade: offer.bundleUpgrade,
    badges: offer.badges ?? [],
  };
}

export function matchesFilter(
  product: ProductSummary,
  filter: CollectionDefinition['filter'],
) {
  if (filter.problem && !product.problemTags.includes(filter.problem)) return false;
  if (filter.business && !product.businessTags.includes(filter.business)) return false;
  if (filter.tiers && !filter.tiers.includes(product.tier)) return false;
  return true;
}

export function sortProducts(products: ProductSummary[], sort: SortKey) {
  const list = [...products];
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => a.priceCents - b.priceCents);
    case 'price-desc':
      return list.sort((a, b) => b.priceCents - a.priceCents);
    case 'newest':
      return list.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    case 'recommended':
    default:
      // Editorial "featured" first, then real sales rank when it exists,
      // then newest. Never invents popularity.
      return list.sort((a, b) => {
        const featured =
          Number(b.badges.includes('featured')) - Number(a.badges.includes('featured'));
        if (featured) return featured;
        const rank = (a.salesRank ?? Infinity) - (b.salesRank ?? Infinity);
        if (rank && Number.isFinite(rank)) return rank;
        return b.publishedAt.localeCompare(a.publishedAt);
      });
  }
}

const mockIndex: CatalogIndex = Object.fromEntries(
  MOCK_PRODUCTS.map((product) => [product.handle, toSummary(product)]),
);

const mockCatalog: Catalog = {
  source: 'mock',
  async getProduct(handle) {
    return MOCK_PRODUCTS.find((product) => product.handle === handle) ?? null;
  },
  async getCollection(handle, {sort = 'recommended', business = null} = {}) {
    const collection = MOCK_COLLECTIONS.find((c) => c.handle === handle);
    if (!collection) return null;
    const products = Object.values(mockIndex).filter(
      (product) =>
        matchesFilter(product, collection.filter) &&
        (!business || product.businessTags.includes(business)),
    );
    return {collection, products: sortProducts(products, sort)};
  },
  async listCollections(kind) {
    return kind ? MOCK_COLLECTIONS.filter((c) => c.kind === kind) : MOCK_COLLECTIONS;
  },
  async getIndex() {
    return mockIndex;
  },
  async getCampaigns() {
    return MOCK_CAMPAIGNS;
  },
};

export function getCatalog(_env?: Env): Catalog {
  // TODO(shopify): return a Storefront API catalogue once products and
  // metafields exist. See storefront/README.md → "Shopify data mapping".
  return mockCatalog;
}
