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

## Mock mode (current)

Products, bundles and the "3 tools → 20%" campaign come from `app/lib/catalog/mock-data.ts`.
Because mock products have no Shopify variant IDs, the cart is client-side (localStorage) and checkout shows a development notice.
Product visuals are placeholder sketches visibly tagged **Placeholder preview**, which is replaced automatically once `preview.imageUrl` is set.

Guard: a campaign with `discountSource: 'mock'` is never displayed once the catalogue source is Shopify.

## Shopify data mapping (next step)

Implement a Storefront API `Catalog` in `app/lib/catalog/` and return it from `getCatalog()`:

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

Then swap `CartProvider` persistence to Hydrogen's `context.cart` (the `/cart` action is already in place) and redirect checkout to `cart.checkoutUrl`.
The "3 tools → 20%" rule must exist as a Shopify automatic discount before its `discountSource` is switched to `shopify-automatic`.
