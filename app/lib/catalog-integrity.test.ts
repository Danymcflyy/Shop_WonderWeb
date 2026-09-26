import {describe, expect, it} from 'vitest';
import {MOCK_CAMPAIGNS, MOCK_COLLECTIONS, MOCK_PRODUCTS} from '~/lib/catalog/mock-data';
import {matchesFilter, toSummary} from '~/lib/catalog';

const handles = MOCK_PRODUCTS.map((product) => product.handle);
const known = new Set(handles);

describe('mock catalogue integrity', () => {
  it('has unique stable handles and factory IDs', () => {
    expect(new Set(handles).size).toBe(handles.length);
    expect(new Set(MOCK_PRODUCTS.map((product) => product.factoryId)).size).toBe(MOCK_PRODUCTS.length);
  });

  it('contains valid prices, dates and complete merchandising copy', () => {
    for (const product of MOCK_PRODUCTS) {
      expect(product.priceCents).toBeGreaterThan(0);
      expect(Number.isFinite(new Date(product.publishedAt).getTime())).toBe(true);
      expect(product.title.trim()).not.toBe('');
      expect(product.tagline.trim()).not.toBe('');
      expect(product.included.length > 0 || (product.bundleItems?.length ?? 0) > 0).toBe(true);
      expect(product.howItWorks.length).toBeGreaterThan(0);
      expect(product.formats.length).toBeGreaterThan(0);
    }
  });

  it('never points offers or bundles at missing products', () => {
    for (const product of MOCK_PRODUCTS) {
      for (const relation of product.offer.crossSells) expect(known.has(relation.handle)).toBe(true);
      if (product.offer.bundleUpgrade) expect(known.has(product.offer.bundleUpgrade.handle)).toBe(true);
      for (const item of product.bundleItems ?? []) expect(known.has(item)).toBe(true);
    }
  });

  it('keeps bundle prices below their standalone value', () => {
    const index = Object.fromEntries(MOCK_PRODUCTS.map((product) => [product.handle, product]));
    for (const bundle of MOCK_PRODUCTS.filter((product) => product.bundleItems?.length)) {
      const standalone = bundle.bundleItems!.reduce((sum, handle) => sum + index[handle].priceCents, 0);
      expect(bundle.priceCents).toBeLessThan(standalone);
    }
  });

  it('keeps every collection populated', () => {
    const summaries = MOCK_PRODUCTS.map(toSummary);
    for (const collection of MOCK_COLLECTIONS) {
      expect(summaries.some((product) => matchesFilter(product, collection.filter))).toBe(true);
    }
  });

  it('defines deterministic, bounded campaigns', () => {
    for (const campaign of MOCK_CAMPAIGNS) {
      expect(campaign.id.trim()).not.toBe('');
      expect(campaign.thresholdQuantity).toBeGreaterThan(1);
      expect(campaign.discountPercent).toBeGreaterThan(0);
      expect(campaign.discountPercent).toBeLessThan(100);
      expect(campaign.discountSource).toBe('mock');
    }
  });
});
