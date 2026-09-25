import {useEffect} from 'react';
import {Form, Link, useNavigation, useSubmit} from 'react-router';
import type {BusinessTypeId, CollectionDefinition, ProductSummary} from '~/lib/catalog/types';
import {SORT_OPTIONS, type SortKey} from '~/lib/catalog';
import {getBundleValue} from '~/lib/offer-engine';
import {formatMoney} from '~/lib/money';
import {track} from '~/lib/analytics';
import {recordInterest} from '~/lib/personalization';
import {getUniverse, UNIVERSES} from '~/lib/site';
import {useCart} from '~/components/cart/CartProvider';
import {ProductCard} from '~/components/conversion/ProductCard';
import {AddToCartButton} from '~/components/conversion/AddToCartButton';
import {ProductPreview} from '~/components/product/ProductPreview';
import {Icon} from '~/components/ui/Icon';

const BUSINESS_FILTERS: Array<{id: BusinessTypeId; label: string}> = [
  {id: 'artisans', label: 'Trades'},
  {id: 'freelancers', label: 'Freelancers'},
  {id: 'agencies', label: 'Agencies'},
  {id: 'ecommerce', label: 'E-commerce'},
  {id: 'local-shops', label: 'Local shops'},
];

const KIND_LABEL: Record<CollectionDefinition['kind'], string> = {
  problem: 'Shop by problem',
  business: 'Shop by business type',
  bundles: 'Bundles',
  all: 'Catalogue',
};

export type CollectionViewData = {
  collection: CollectionDefinition;
  products: ProductSummary[];
  sort: SortKey;
  business: BusinessTypeId | null;
};

export function CollectionView({collection, products, sort, business}: CollectionViewData) {
  const {index, campaign} = useCart();
  const submit = useSubmit();
  const navigation = useNavigation();
  const loading = navigation.state === 'loading' && navigation.location?.pathname === `/collections/${collection.handle}`;

  const bundle = collection.bundleHandle ? index[collection.bundleHandle] : undefined;
  const tools = products.filter((p) => !p.bundleItems);
  const fromCents = tools.length ? Math.min(...tools.map((p) => p.priceCents)) : null;
  const showBusinessFilter =
    collection.universe === 'pro' && (collection.kind === 'problem' || collection.kind === 'all');

  useEffect(() => {
    track('view_collection', {
      collection_handle: collection.handle,
      universe: collection.filter.problem ? [collection.filter.problem] : undefined,
      business_type: collection.filter.business ? [collection.filter.business] : undefined,
      item_count: products.length,
    });
    const tags = [collection.filter.problem, collection.filter.business].filter(Boolean) as string[];
    if (tags.length) recordInterest(tags, 3);
    // Track on collection change only, not on re-sort.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.handle]);

  // Sibling problems inside the same universe; on store-wide collections,
  // point to the universes themselves.
  const universe = getUniverse(collection.universe);
  const related = universe
    ? universe.nav.filter((item) => !item.children && item.to !== `/collections/${collection.handle}`)
    : UNIVERSES.map((u) => ({label: `WonderWeb ${u.label}`, to: u.path}));

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="container-page py-6 sm:py-8">
          <nav aria-label="Breadcrumb" className="text-xs font-semibold text-muted">
            <ol className="flex gap-1.5">
              <li><Link to="/" className="hover:text-ink hover:underline">Home</Link></li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-ink">{collection.title}</li>
            </ol>
          </nav>

          <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <p className="kicker">{KIND_LABEL[collection.kind]}</p>
              <h1 className="mt-2 text-[32px] leading-[1.05] font-black tracking-[-0.025em] sm:text-[42px]">
                {collection.title}
              </h1>
              <p className="mt-3 text-lg font-bold text-balance">
                <span className="marker">{collection.problem}</span>
              </p>
              <p className="mt-2 max-w-xl text-ink/70">{collection.outcome}</p>
            </div>
            <dl className="grid grid-cols-3 divide-x divide-line rounded-(--radius-control) border border-line text-center">
              <Stat label="Tools" value={String(tools.length)} />
              <Stat label="From" value={fromCents !== null ? formatMoney(fromCents) : '—'} />
              <Stat label="Payment" value="Once" />
            </dl>
          </div>
        </div>
      </header>

      <div className="container-page py-6">
        {bundle && collection.kind !== 'bundles' ? <CollectionBundleBanner bundle={bundle} /> : null}

        <Form
          key={`${collection.handle}:${business}:${sort}`}
          method="get"
          className="mt-6 flex flex-wrap items-center justify-between gap-3"
          onChange={(e) => void submit(e.currentTarget, {preventScrollReset: true, replace: true})}
        >
          {showBusinessFilter ? (
            <fieldset className="flex flex-wrap items-center gap-2">
              <legend className="sr-only">Filter by business type</legend>
              <FilterChip name="for" value="" label="All businesses" checked={!business} />
              {BUSINESS_FILTERS.map((f) => (
                <FilterChip key={f.id} name="for" value={f.id} label={f.label} checked={business === f.id} />
              ))}
            </fieldset>
          ) : (
            <span />
          )}
          <label className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-muted">Sort</span>
            <select
              name="sort"
              defaultValue={sort}
              className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm font-bold focus:border-ink"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </label>
          <noscript>
            <button type="submit" className="btn-secondary">Apply</button>
          </noscript>
        </Form>

        <p className="mt-4 text-sm text-muted" aria-live="polite">
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </p>

        {products.length ? (
          <ul className={`mt-3 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4 ${loading ? 'opacity-60 transition-opacity' : ''}`}>
            {products.map((product, i) => (
              <ProductGridItem key={product.handle} product={product} insertOffer={i === 3 && !!campaign && collection.kind !== 'bundles'} />
            ))}
          </ul>
        ) : (
          <div className="card mt-3 p-8 text-center">
            <p className="font-extrabold">No tools match this filter yet.</p>
            <Link to={`/collections/${collection.handle}`} className="btn-ghost mt-2">Clear the filter</Link>
          </div>
        )}

        <section className="mt-12">
          <h2 className="text-xs font-extrabold tracking-[0.08em] uppercase">
            {universe ? 'Other problems we solve' : 'Browse by universe'}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {related.map((item) => (
              <li key={item.to}>
                <Link to={item.to} prefetch="intent" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-bold hover:border-ink">
                  {item.label} <Icon name="arrow" className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function ProductGridItem({product, insertOffer}: {product: ProductSummary; insertOffer: boolean}) {
  const {campaign} = useCart();
  return (
    <>
      <li className="flex"><ProductCard product={product} /></li>
      {insertOffer && campaign ? (
        <li className="flex min-[480px]:col-span-2 lg:col-span-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-(--radius-card) border-[1.5px] border-dashed border-ink bg-highlight/60 px-5 py-4">
            <p className="flex items-center gap-2 font-extrabold">
              <Icon name="tag" className="size-5" /> {campaign.headline}
            </p>
            <p className="text-sm text-ink/75">
              Mix any tools from any category. Bundles excluded. Applied automatically at checkout.
            </p>
          </div>
        </li>
      ) : null}
    </>
  );
}

function CollectionBundleBanner({bundle}: {bundle: ProductSummary}) {
  const {index} = useCart();
  const value = getBundleValue(bundle, index);
  return (
    <section aria-label="Bundle for this collection" className="card grid items-center gap-4 border-[1.5px] border-ink p-3 sm:grid-cols-[140px_1fr_auto] sm:p-4">
      <Link to={`/products/${bundle.handle}`} className="hidden sm:block" tabIndex={-1} aria-hidden>
        <ProductPreview product={bundle} size="thumb" />
      </Link>
      <div>
        <p className="text-[11px] font-extrabold tracking-[0.08em] text-sale uppercase">
          Save {formatMoney(value.savingsCents)} with the bundle
        </p>
        <h2 className="mt-1 text-lg leading-tight font-black">
          <Link to={`/products/${bundle.handle}`} className="hover:underline">{bundle.title}</Link>
        </h2>
        <p className="mt-1 text-sm text-ink/70">
          {value.items.length} tools: {value.items.map((i) => i.title).join(', ')}.
        </p>
      </div>
      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
        <div className="sm:text-right">
          <span className="price text-2xl">{formatMoney(bundle.priceCents)}</span>
          <p className="text-xs text-muted"><s>{formatMoney(value.separateCents)}</s> separately</p>
        </div>
        <AddToCartButton handle={bundle.handle} placement="card" className="btn-cta px-4 py-2.5 text-sm">
          Get the bundle
        </AddToCartButton>
      </div>
    </section>
  );
}

function FilterChip({name, value, label, checked}: {name: string; value: string; label: string; checked: boolean}) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name={name} value={value} defaultChecked={checked} className="peer sr-only" />
      <span className="block rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-bold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-surface peer-focus-visible:outline-2 peer-focus-visible:outline-blue hover:border-ink">
        {label}
      </span>
    </label>
  );
}

function Stat({label, value}: {label: string; value: string}) {
  return (
    <div className="px-3 py-3">
      <dt className="text-[11px] font-bold tracking-wide text-muted uppercase">{label}</dt>
      <dd className="price mt-0.5 text-xl">{value}</dd>
    </div>
  );
}
