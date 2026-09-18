import {describe, expect, it} from 'vitest';
import {MOCK_PRODUCTS} from '~/lib/catalog/mock-data';
import {toSummary} from '~/lib/catalog';
import type {Campaign, CatalogIndex} from '~/lib/catalog/types';
import {
  addToCartLines,
  getBadges,
  getBestBundleUpgrade,
  getBundleValue,
  getCartTotals,
  getDisplayableCampaigns,
  isCampaignLive,
  rankCrossSells,
} from '~/lib/offer-engine';

const index: CatalogIndex = Object.fromEntries(
  MOCK_PRODUCTS.map((p) => [p.handle, toSummary(p)]),
);

const campaign: Campaign = {
  id: '3-tools-20',
  type: 'cart_threshold',
  headline: 'Buy any 3 tools, get 20% off',
  eligibleTiers: ['impulse', 'core'],
  thresholdQuantity: 3,
  discountPercent: 20,
  enabled: true,
  startsAt: null,
  endsAt: null,
  discountSource: 'shopify-automatic',
};

const NOW = new Date('2026-09-18T12:00:00Z');

describe('catalogue integrity', () => {
  it('every cross-sell and bundle reference points to a real product', () => {
    for (const product of Object.values(index)) {
      for (const rel of product.crossSells) expect(index[rel.handle], rel.handle).toBeDefined();
      if (product.bundleUpgrade) {
        const bundle = index[product.bundleUpgrade.handle];
        expect(bundle?.bundleItems).toContain(product.handle);
      }
      for (const item of product.bundleItems ?? []) expect(index[item], item).toBeDefined();
    }
  });

  it('every bundle is genuinely cheaper than its tools bought separately', () => {
    for (const bundle of Object.values(index).filter((p) => p.bundleItems)) {
      expect(getBundleValue(bundle, index).savingsCents).toBeGreaterThan(0);
    }
  });
});

describe('campaigns', () => {
  it('respects start and end dates', () => {
    const dated = {...campaign, startsAt: '2026-09-01T00:00:00Z', endsAt: '2026-09-10T00:00:00Z'};
    expect(isCampaignLive(dated, new Date('2026-09-05'))).toBe(true);
    expect(isCampaignLive(dated, NOW)).toBe(false);
    expect(isCampaignLive({...campaign, enabled: false}, NOW)).toBe(false);
  });

  it('never shows a mock discount on a live Shopify catalogue', () => {
    const mock = {...campaign, discountSource: 'mock' as const};
    expect(getDisplayableCampaigns([mock], {now: NOW, catalogSource: 'shopify'})).toEqual([]);
    expect(getDisplayableCampaigns([mock], {now: NOW, catalogSource: 'mock'})).toHaveLength(1);
  });
});

describe('badges', () => {
  it('never marks best-seller without sales data', () => {
    for (const product of Object.values(index)) {
      expect(getBadges(product, NOW)).not.toContain('best-seller');
    }
    expect(getBadges({...index['job-margin-calculator'], salesRank: 1}, NOW)).toContain('best-seller');
  });

  it('marks new only within the window', () => {
    expect(getBadges(index['follow-up-script-pack'], NOW)).toContain('new'); // 2026-09-08
    expect(getBadges(index['cash-flow-dashboard'], NOW)).not.toContain('new'); // 2026-02-10
  });
});

describe('cart lines', () => {
  it('does not duplicate a tool', () => {
    const r = addToCartLines(['job-margin-calculator'], 'job-margin-calculator', index);
    expect(r.status).toBe('already-in-cart');
  });

  it('refuses a tool already covered by a bundle in the cart', () => {
    const r = addToCartLines(['artisan-business-toolkit'], 'job-margin-calculator', index);
    expect(r.status).toBe('covered-by-bundle');
    expect(r.lines).toEqual(['artisan-business-toolkit']);
  });

  it('adding a bundle replaces the tools it includes', () => {
    const r = addToCartLines(
      ['job-margin-calculator', 'ecommerce-profit-calculator'],
      'artisan-business-toolkit',
      index,
    );
    expect(r.status).toBe('added');
    expect(r.replaced).toEqual(['job-margin-calculator']);
    expect(r.lines).toEqual(['ecommerce-profit-calculator', 'artisan-business-toolkit']);
  });
});

describe('totals and progress offer', () => {
  it('shows progress below the threshold without discount', () => {
    const t = getCartTotals(['job-margin-calculator', 'intervention-rate-calculator'], index, campaign);
    expect(t.subtotalCents).toBe(2100);
    expect(t.discountCents).toBe(0);
    expect(t.progress).toMatchObject({remaining: 1, unlocked: false});
  });

  it('applies the discount to eligible tools only, and bundles do not count', () => {
    const t = getCartTotals(
      ['job-margin-calculator', 'intervention-rate-calculator', 'quote-invoice-kit', 'local-visibility-bundle'],
      index,
      campaign,
    );
    expect(t.progress).toMatchObject({eligibleCount: 3, unlocked: true});
    expect(t.discountCents).toBe(Math.round(4000 * 0.2));
    expect(t.totalCents).toBe(4000 + 4500 - 800);
  });
});

describe('bundle upgrade', () => {
  it('prices the upgrade from the real cart totals', () => {
    const offer = getBestBundleUpgrade(['job-margin-calculator', 'intervention-rate-calculator'], index, campaign);
    // Both tools are in the Artisan toolkit (€59) and the Profit bundle (€49);
    // the toolkit wins on overlap tie → more net value.
    expect(offer?.bundle.handle).toBe('artisan-business-toolkit');
    expect(offer?.deltaCents).toBe(5900 - 2100);
    expect(offer?.gains).toHaveLength(4);
  });

  it('accounts for the progress discount lost by swapping', () => {
    const lines = ['job-margin-calculator', 'intervention-rate-calculator', 'quote-invoice-kit'];
    const offer = getBestBundleUpgrade(lines, index, campaign);
    expect(offer?.bundle.handle).toBe('artisan-business-toolkit');
    expect(offer?.deltaCents).toBe(5900 - Math.round(4000 * 0.8));
  });

  it('offers nothing when no bundle overlaps', () => {
    expect(getBestBundleUpgrade(['product-page-checklist'], index, campaign)).toBeNull();
  });
});

describe('cross-sells', () => {
  it('excludes cart items and bundle-covered tools, max 2', () => {
    const offers = rankCrossSells(['job-margin-calculator'], ['job-margin-calculator'], index);
    expect(offers.map((o) => o.product.handle)).toEqual([
      'intervention-rate-calculator',
      'quote-invoice-kit',
    ]);
    const covered = rankCrossSells(
      ['artisan-business-toolkit'],
      ['artisan-business-toolkit'],
      index,
    );
    expect(covered.every((o) => !index['artisan-business-toolkit'].bundleItems!.includes(o.product.handle))).toBe(true);
  });

  it('uses session interests only to break close priorities', () => {
    const offers = rankCrossSells(['cash-flow-dashboard'], [], index, {
      interests: {ecommerce: 10},
      limit: 3,
    });
    expect(offers[0].product.handle).toBe('job-margin-calculator'); // 70 + 0
    expect(offers.map((o) => o.product.handle)).toContain('ecommerce-profit-calculator');
  });
});
