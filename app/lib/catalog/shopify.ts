import {MOCK_COLLECTIONS} from './mock-data';
import {matchesFilter, sortProducts, type Catalog, type SortKey, toSummary} from './index';
import type {BusinessTypeId, Product} from './types';

// Only products carrying both factory metafields enter the public catalogue.
// The import creates these metafields on a DRAFT product first; Shopify makes
// the product visible to the Storefront API only after the final approval.
export const SHOPIFY_CATALOG_QUERY = `#graphql
  query FactoryCatalogue($cursor: String) {
    products(first: 250, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id handle title description createdAt
        factoryId: metafield(namespace: "custom", key: "factory_id") { value }
        factoryData: metafield(namespace: "custom", key: "factory_data") { value }
        images(first: 9) { nodes { url altText } }
        variants(first: 1) { nodes { id availableForSale price { amount currencyCode } } }
      }
    }
  }
`;

type ShopifyNode = {
  handle: string;
  title: string;
  description: string;
  createdAt: string;
  factoryId: {value: string} | null;
  factoryData: {value: string} | null;
  images: {nodes: Array<{url: string; altText: string | null}>};
  variants: {nodes: Array<{id: string; availableForSale: boolean; price: {amount: string; currencyCode: string}}>};
};

function mapProduct(node: ShopifyNode): Product | null {
  const variant = node.variants.nodes[0];
  if (!variant?.availableForSale || variant.price.currencyCode !== 'EUR' || !node.factoryId?.value || !node.factoryData?.value || node.images.nodes.length !== 9) return null;
  let data: Partial<Product>;
  try {
    data = JSON.parse(node.factoryData.value) as Partial<Product>;
  } catch {
    return null;
  }
  if (!data.offer || !data.problem || !data.outcome || !data.included || !data.howItWorks || !data.faq) return null;
  const cents = Math.round(Number(variant.price.amount) * 100);
  if (!Number.isSafeInteger(cents) || cents < 0) return null;
  const image = node.images.nodes[0];
  return {
    ...data,
    handle: node.handle,
    factoryId: node.factoryId.value,
    variantId: variant.id,
    title: node.title,
    tagline: data.tagline || node.description,
    priceCents: cents,
    publishedAt: node.createdAt,
    preview: {kind: data.preview?.kind || 'doc', imageUrl: image?.url, alt: image?.altText || node.title},
    // These required values are checked above and supplied by the draft import.
    offer: data.offer,
    problem: data.problem,
    outcome: data.outcome,
    included: data.included,
    howItWorks: data.howItWorks,
    faq: data.faq,
    universe: data.universe || 'pro',
    format: data.format || 'Outil numérique',
    formats: data.formats || ['pdf'],
    timeToValue: data.timeToValue || '',
  } as Product;
}

export function createShopifyCatalog(env: Env): Catalog {
  const domain = env.PUBLIC_STORE_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '');
  let pending: Promise<Product[]> | undefined;
  const load = () => pending ??= (async () => {
    const products: Product[] = [];
    let cursor: string | null = null;
    do {
      const response = await fetch(`https://${domain}/api/2026-07/graphql.json`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-shopify-storefront-access-token': env.PUBLIC_STOREFRONT_API_TOKEN,
        },
        body: JSON.stringify({query: SHOPIFY_CATALOG_QUERY, variables: {cursor}}),
      });
      if (!response.ok) throw new Error(`Shopify catalogue request failed: ${response.status}`);
      const result = await response.json() as {
        data?: {products: {nodes: ShopifyNode[]; pageInfo: {hasNextPage: boolean; endCursor: string | null}}};
        errors?: Array<{message: string}>;
      };
      if (result.errors?.length || !result.data) throw new Error('Shopify catalogue response is invalid');
      for (const node of result.data.products.nodes) {
        const product = mapProduct(node);
        if (product) products.push(product);
      }
      cursor = result.data.products.pageInfo.hasNextPage ? result.data.products.pageInfo.endCursor : null;
    } while (cursor);
    return products;
  })();

  return {
    source: 'shopify',
    async getProduct(handle) { return (await load()).find(p => p.handle === handle) ?? null; },
    async getIndex() { return Object.fromEntries((await load()).map(p => [p.handle, toSummary(p)])); },
    async getCollection(handle, {sort = 'recommended', business = null}: {sort?: SortKey; business?: BusinessTypeId | null} = {}) {
      const collection = MOCK_COLLECTIONS.find(c => c.handle === handle);
      if (!collection) return null;
      const summaries = (await load()).map(toSummary).filter(p => matchesFilter(p, collection.filter) && (!business || p.businessTags.includes(business)));
      return {collection, products: sortProducts(summaries, sort)};
    },
    async listCollections(kind) { return kind ? MOCK_COLLECTIONS.filter(c => c.kind === kind) : MOCK_COLLECTIONS; },
    async getCampaigns() { return []; },
  };
}
