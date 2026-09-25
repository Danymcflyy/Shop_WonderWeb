# Storefront (Hydrogen)

Scaffolded from the official Hydrogen skeleton (Hydrogen 2026.4, React Router 7, Tailwind v4), then adapted to the Golden Path described in the root strategy docs.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # offer-engine unit tests (Vitest)
npm run typecheck
npm run lint
```

## Where things live

| Path | What |
| --- | --- |
| `app/lib/catalog/` | Catalogue types, the `getCatalog()` data interface, mock data |
| `app/lib/offer-engine.ts` | Pure commercial rules: bundles, upgrade pricing, progress offer, cross-sells, badges. Tested. |
| `app/lib/site.ts` | Navigation, problem selector, trust copy, store FAQ |
| `app/lib/analytics.ts` | `track()` → `window.dataLayer` + `storefront:analytics` DOM event |
| `app/lib/personalization.ts` | Session interest scoring (sessionStorage only) |
| `app/components/conversion/` | Conversion primitives (ProductCard, BundleComparison, CartProgress, BundleUpgrade, StickyPurchaseBar…) |
| `app/components/cart/` | Cart provider + drawer |
| `app/styles/tailwind.css` | Design tokens — change the brand here only |

## Catalogue and publication gate

With Storefront credentials, `getCatalog()` reads Shopify products carrying
`custom.factory_id` and `custom.factory_data`. Products without nine Shopify
images, an available EUR variant, or these metafields are omitted. The server
renders a prelaunch state while that catalogue is empty. Checkout remains
closed until `PUBLIC_CHECKOUT_ENABLED=true` is set after payment and digital
delivery QA; the cart uses Shopify's `/cart` action and its `checkoutUrl`.

Prepare a private, read-only import plan and a visual review from the factory:

```bash
python3 scripts/plan_shopify_import.py \
  --factory /path/to/digital-product-factory \
  --manifest publication/shopify-publication-manifest.json
```

The generated `publication/preview/` is ignored by Git. Its CSV records the
120 correspondences and verification status. Without a current Admin snapshot,
every row is `needs_admin_lookup`; no creation is assumed. Passing
`--snapshot admin-products.json` classifies draft creates, updates and
conflicts by `custom.factory_id` and handle.

The ZIP archives must be attached through a protected post-payment delivery
solution. Shopify's free Digital Products app supports ZIP assets and automatic
delivery after payment. This attachment and the real purchase test are still
required before enabling checkout or publishing any draft.

## Mock mode (without Storefront credentials)

Products, bundles and the "3 tools → 20%" campaign come from `app/lib/catalog/mock-data.ts`.
Because mock products have no Shopify variant IDs, the cart is client-side (localStorage) and checkout shows a development notice.
Product visuals are placeholder sketches visibly tagged **Placeholder preview**, which is replaced automatically once `preview.imageUrl` is set.

Guard: a campaign with `discountSource: 'mock'` is never displayed once the catalogue source is Shopify.

## Shopify data mapping

The Storefront API adapter in `app/lib/catalog/` reads Shopify price, image,
variant ID, handle and factory metafields:

| `Product` field | Shopify source |
| --- | --- |
| handle, title, price, images | product / first variant / media |
| factoryId | metafield `custom.factory_id` |
| tagline, format, timeToValue, formats | metafields `custom.*` |
| problem, outcome, included, howItWorks, example, faq | metafields (JSON) or metaobjects |
| offer.tier / problemTags / businessTags | metafields (list) |
| offer.crossSells | metafield list of product references + reason metaobject |
| offer.bundleUpgrade, bundleItems | product reference / list of product references |
| salesRank | computed from real orders (never editorial) |

The "3 tools → 20%" rule must exist as a verified Shopify automatic discount
before its `discountSource` is switched to `shopify-automatic`.
