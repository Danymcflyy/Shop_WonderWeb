import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import type {Route} from './+types/root';
import favicon from '~/assets/favicon.svg';
import tailwindCss from './styles/tailwind.css?url';
import {SiteShell} from '~/components/layout/SiteShell';
import {getCatalog} from '~/lib/catalog';
import {getDisplayableCampaigns} from '~/lib/offer-engine';
import {SITE} from '~/lib/site';
import {getStoreJsonLd, serializeJsonLd} from '~/lib/seo';

export type RootLoader = typeof loader;

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  // Defaulting to no revalidation for root loader data to improve performance.
  // When using this feature, you risk your UI getting out of sync with your server.
  // Use with caution. If you are uncomfortable with this optimization, update the
  // line below to `return defaultShouldRevalidate` instead.
  // For more details see: https://remix.run/docs/en/main/route/should-revalidate
  return false;
};

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  return [
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const {storefront, env} = args.context;

  return {
    ...deferredData,
    ...criticalData,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      // Falls back to the store domain until PUBLIC_CHECKOUT_DOMAIN is set in
      // the Hydrogen storefront's environment variables (Shopify admin).
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN ?? env.PUBLIC_STORE_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      // localize the privacy banner
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  };
}

/**
 * Critical data: the slim catalogue index (cart + offer engine need it on
 * every page) and the campaign the UI may advertise.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const catalog = getCatalog(context.env);
  const now = new Date();
  const [index, campaigns] = await Promise.all([catalog.getIndex(), catalog.getCampaigns()]);
  const [campaign = null] = getDisplayableCampaigns(campaigns, {now, catalogSource: catalog.source});

  const checkoutEnabled = catalog.source === 'shopify' && (context.env as Env & {PUBLIC_CHECKOUT_ENABLED?: string}).PUBLIC_CHECKOUT_ENABLED === 'true';
  return {index, campaign, catalogSource: catalog.source, checkoutEnabled, now: now.toISOString()};
}

/**
 * Non-critical data. Must not throw, so the page still renders.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {cart: context.cart.get()};
}

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();
  const rootData = useRouteLoaderData<RootLoader>('root');

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={tailwindCss}></link>
        <Meta />
        <Links />
        {!rootData?.checkoutEnabled ? (
          <meta name="robots" content="noindex,nofollow,noarchive" />
        ) : null}
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(getStoreJsonLd(rootData?.publicStoreDomain)),
          }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');

  if (!data) {
    return <Outlet />;
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <SiteShell index={data.index} campaign={data.campaign} catalogSource={data.catalogSource} checkoutEnabled={data.checkoutEnabled}>
        {data.catalogSource === 'shopify' && Object.keys(data.index).length === 0 ? (
          <section className="container-page py-20" aria-labelledby="prelaunch-title">
            <p className="kicker">Prévisualisation privée</p>
            <h1 id="prelaunch-title" className="h-section mt-2">Le catalogue est en préparation.</h1>
            <p className="mt-4 max-w-2xl text-muted">Les fiches, le paiement et la livraison numérique seront disponibles après vérification des produits Shopify et validation finale.</p>
          </section>
        ) : <Outlet />}
      </SiteShell>
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="container-page py-20">
      <p className="kicker">Error {errorStatus}</p>
      <h1 className="h-section mt-2">
        {errorStatus === 404 ? 'This page doesn’t exist.' : 'Something went wrong.'}
      </h1>
      {errorMessage && errorStatus !== 404 ? (
        <pre className="mt-4 text-sm whitespace-pre-wrap text-muted">{errorMessage}</pre>
      ) : null}
      <a href="/collections/all" className="btn-cta mt-6">
        Browse all {SITE.name} tools
      </a>
    </div>
  );
}
