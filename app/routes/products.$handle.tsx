import {useEffect, useRef, useState} from 'react';
import {data, Link, useLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {getCatalog, toSummary} from '~/lib/catalog';
import type {ProductSummary} from '~/lib/catalog/types';
import {getBundleValue, getProductBundleOffer, isEligibleForCampaign, rankCrossSells} from '~/lib/offer-engine';
import {formatMoney} from '~/lib/money';
import {productDimensions, track, useTrackOnView} from '~/lib/analytics';
import {recordInterest} from '~/lib/personalization';
import {FORMAT_LABELS, GENERAL_FAQ, MAIN_NAV, SITE} from '~/lib/site';
import {useNow} from '~/lib/use-now';
import {useCart} from '~/components/cart/CartProvider';
import {ProductPreview, FormatChip} from '~/components/product/ProductPreview';
import {AddToCartButton} from '~/components/conversion/AddToCartButton';
import {Badges} from '~/components/conversion/Badges';
import {PriceAnchor} from '~/components/conversion/PriceAnchor';
import {TrustStrip} from '~/components/conversion/TrustStrip';
import {ProductCard} from '~/components/conversion/ProductCard';
import {StickyPurchaseBar} from '~/components/conversion/StickyPurchaseBar';
import {FAQ} from '~/components/conversion/FAQ';
import {Icon} from '~/components/ui/Icon';

export const meta: Route.MetaFunction = ({data}) => [
  {title: `${data?.product.title ?? 'Product'} — ${data ? formatMoney(data.product.priceCents) : ''} | ${SITE.name}`},
  {name: 'description', content: data?.product.tagline ?? ''},
];

const PROBLEM_COLLECTION: Record<string, {label: string; to: string}> = {
  'find-clients': {label: 'Find clients', to: '/collections/find-clients'},
  profit: {label: 'Make more profit', to: '/collections/make-more-profit'},
  organize: {label: 'Get organized', to: '/collections/get-organized'},
  marketing: {label: 'Marketing', to: '/collections/marketing'},
  local: {label: 'Local business', to: '/collections/local-business'},
};

export async function loader({params, context}: Route.LoaderArgs) {
  const catalog = getCatalog(context.env);
  const [product, index] = await Promise.all([catalog.getProduct(params.handle), catalog.getIndex()]);
  if (!product) throw data({message: 'Product not found'}, {status: 404});

  const summary = toSummary(product);
  return {
    product,
    summary,
    // Related tools come from the offer definition, not from JSX.
    related: rankCrossSells([product.handle], [], index, {limit: 3}).map((o) => ({
      product: o.product,
      reason: o.reason,
    })),
  };
}

export default function ProductPage() {
  const {product, summary, related} = useLoaderData<typeof loader>();
  const {index, campaign} = useCart();
  const now = useNow();
  const heroRef = useRef<HTMLDivElement>(null);
  const finalRef = useRef<HTMLElement>(null);

  const isBundle = !!product.bundleItems?.length;
  const bundleValue = isBundle ? getBundleValue(summary, index) : null;
  const bundleOffer = isBundle ? null : getProductBundleOffer(summary, index);
  const countsTowardCampaign = campaign && isEligibleForCampaign(summary, campaign);
  const breadcrumb = PROBLEM_COLLECTION[product.offer.problemTags[0]] ?? MAIN_NAV[MAIN_NAV.length - 1];
  const faq = [...product.faq, ...GENERAL_FAQ];

  useEffect(() => {
    track('view_product', productDimensions(summary));
    recordInterest([...summary.problemTags, ...summary.businessTags], 2);
  }, [summary]);

  return (
    <>
      {/* 1. Breadcrumb */}
      <nav aria-label="Breadcrumb" className="container-page pt-4 text-xs font-semibold text-muted">
        <ol className="flex flex-wrap gap-1.5">
          <li><Link to="/" className="hover:text-ink hover:underline">Home</Link></li>
          <li aria-hidden>/</li>
          <li>
            <Link to={isBundle ? '/collections/bundles' : breadcrumb.to} className="hover:text-ink hover:underline">
              {isBundle ? 'Bundles' : breadcrumb.label}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-ink">{product.title}</li>
        </ol>
      </nav>

      {/* 2–4. Hero: preview + price, CTA, reassurance */}
      <section className="container-page grid gap-6 py-5 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:py-8">
        <div className="order-2 lg:sticky lg:top-32 lg:order-1 lg:self-start">
          <ProductPreview product={summary} size="hero" />
          <IncludedFilesCompact product={product} summary={summary} />
        </div>

        <div className="order-1 lg:order-2">
          <Badges
            product={summary}
            now={now}
            extra={bundleValue ? [{label: `Save ${bundleValue.savingsPercent}%`, className: 'bg-sale text-surface'}] : undefined}
          />
          <h1 className="mt-2 text-[30px] leading-[1.05] font-black tracking-[-0.025em] text-balance sm:text-[40px]">
            {product.title}
          </h1>
          <p className="mt-3 text-lg text-ink/80">{product.tagline}</p>

          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-(--radius-control) border border-line bg-line text-sm">
            <Fact icon="file" label="Format" value={product.format} />
            <Fact icon="clock" label="Time to first result" value={product.timeToValue} />
            <div className="col-span-2 flex flex-wrap items-center gap-1.5 bg-surface px-3 py-2.5">
              <span className="mr-1 text-xs font-bold text-muted">Opens in</span>
              {product.formats.map((f) => (
                <span key={f} className="flex items-center gap-1 text-xs font-semibold">
                  <FormatChip format={f} />
                  <span className="sr-only">{FORMAT_LABELS[f]}</span>
                </span>
              ))}
            </div>
          </dl>

          <div ref={heroRef} className="mt-5">
            {bundleOffer ? (
              <PurchaseOptions product={summary} bundleOffer={bundleOffer} />
            ) : (
              <div className="card p-4">
                <PriceAnchor
                  priceCents={product.priceCents}
                  separateCents={bundleValue?.separateCents}
                  savingsCents={bundleValue?.savingsCents}
                />
                <AddToCartButton handle={product.handle} placement="pdp_hero" className="btn-cta mt-4 w-full py-3.5 text-base">
                  Add to cart — {formatMoney(product.priceCents)}
                </AddToCartButton>
              </div>
            )}
          </div>

          {countsTowardCampaign ? (
            <p className="mt-3 flex items-start gap-2 rounded-md bg-highlight/70 px-3 py-2 text-sm">
              <Icon name="tag" className="mt-0.5 size-4 shrink-0" />
              <span>
                <strong>Counts toward “{campaign.headline}”.</strong> Mix with any other tools; the discount is applied at checkout.
              </span>
            </p>
          ) : null}

          <div className="mt-4">
            <TrustStrip compact />
          </div>
        </div>
      </section>

      {/* 5. Problem → outcome */}
      <section className="container-page py-8">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="card p-5 sm:p-6">
            <p className="kicker">The problem</p>
            <h2 className="mt-2 text-xl leading-tight font-black">{product.problem.headline}</h2>
            <ul className="mt-4 space-y-2.5">
              {product.problem.points.map((point) => (
                <li key={point} className="flex gap-2.5 text-[15px]">
                  <Icon name="close" className="mt-1 size-3.5 shrink-0 text-sale" strokeWidth={3} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="card border-[1.5px] border-ink p-5 sm:p-6">
            <p className="kicker">What changes</p>
            <h2 className="mt-2 text-xl leading-tight font-black">{product.outcome.headline}</h2>
            <ul className="mt-4 space-y-2.5">
              {product.outcome.points.map((point) => (
                <li key={point} className="flex gap-2.5 text-[15px]">
                  <Icon name="check" className="mt-1 size-3.5 shrink-0 text-success" strokeWidth={3} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 6. What you get */}
      <section className="container-page py-8">
        <p className="kicker">What you get</p>
        <h2 className="h-section mt-2">
          {isBundle ? `${bundleValue!.items.length} complete tools in one download` : 'Everything in the download'}
        </h2>
        {isBundle ? (
          <BundleContents bundle={summary} />
        ) : (
          <ul className="card mt-5 divide-y divide-line">
            {product.included.map((file) => (
              <li key={file.name} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 sm:px-5">
                <FormatChip format={file.format} />
                <span className="font-bold">{file.name}</span>
                <span className="text-sm text-muted sm:ml-auto">{file.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 7. How it works */}
      <section className="container-page py-8">
        <p className="kicker">How it works</p>
        <h2 className="h-section mt-2">Three steps to your first result</h2>
        <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-ink/70">
          <Icon name="clock" /> {product.timeToValue}
        </p>
        <ol className="mt-5 grid gap-3 md:grid-cols-3">
          {product.howItWorks.map((step, i) => (
            <li key={step} className="card flex gap-3 p-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-ink text-sm font-black text-surface tabular-nums">{i + 1}</span>
              <p className="text-[15px] font-semibold">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 8. Example / result */}
      {product.example ? (
        <section className="container-page py-8">
          <div className="grid overflow-hidden rounded-(--radius-card) border border-line bg-surface md:grid-cols-[1fr_1fr]">
            <div className="p-5 sm:p-6">
              <p className="kicker">Worked example</p>
              <h2 className="mt-2 text-xl font-black">{product.example.title}</h2>
              <p className="mt-3 text-[15px] text-ink/75">{product.example.setup}</p>
            </div>
            <div className="flex flex-col justify-center bg-highlight p-5 sm:p-6">
              <p className="text-xs font-extrabold tracking-[0.08em] uppercase">Result</p>
              <p className="mt-2 text-2xl leading-tight font-black tracking-tight">{product.example.result}</p>
              <p className="mt-3 text-xs text-ink/70">{product.example.note}</p>
            </div>
          </div>
        </section>
      ) : null}

      {/* 9. Bundle upgrade */}
      {bundleOffer ? <PdpBundleUpgrade product={summary} bundleOffer={bundleOffer} /> : null}

      {/* 10. Related tools */}
      {related.length ? (
        <section className="container-page py-8">
          <p className="kicker">Works well with</p>
          <h2 className="h-section mt-2">Tools that complete this one</h2>
          <ul className="mt-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
            {related.map(({product: item, reason}) => (
              <li key={item.handle} className="flex flex-col">
                <p className="mb-2 flex items-start gap-1.5 text-sm font-semibold text-ink/80">
                  <Icon name="plus" className="mt-0.5 size-4 shrink-0 text-cta" strokeWidth={3} />
                  {reason}
                </p>
                <div className="flex flex-1"><ProductCard product={item} /></div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 11. FAQ */}
      <section className="container-page grid gap-6 py-8 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="kicker">Questions</p>
          <h2 className="h-section mt-2">Before you buy</h2>
        </div>
        <FAQ items={faq} />
      </section>

      {/* 13. Final CTA */}
      <section ref={finalRef} className="container-page pt-4">
        <div className="card flex flex-col gap-5 border-[1.5px] border-ink p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-center gap-4">
            <div className="hidden w-20 shrink-0 sm:block"><ProductPreview product={summary} size="thumb" /></div>
            <div>
              <h2 className="text-xl leading-tight font-black">{product.title}</h2>
              <p className="mt-1 text-sm text-ink/70">{product.tagline}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span className="price text-3xl">{formatMoney(product.priceCents)}</span>
            <AddToCartButton handle={product.handle} placement="pdp_final" className="btn-cta">
              Add to cart
            </AddToCartButton>
          </div>
        </div>
      </section>

      {/* 12. Sticky CTA */}
      <StickyPurchaseBar
        handle={product.handle}
        title={product.title}
        priceCents={product.priceCents}
        watchRef={heroRef}
        hideNearRef={finalRef}
      />
    </>
  );
}

type BundleOffer = NonNullable<ReturnType<typeof getProductBundleOffer>>;

/**
 * Tool-or-bundle choice. The single tool is preselected: the bundle is
 * offered clearly but never chosen for the customer (ETHICAL_SALES_RULES.md).
 */
function PurchaseOptions({product, bundleOffer}: {product: ProductSummary; bundleOffer: BundleOffer}) {
  const [choice, setChoice] = useState<'single' | 'bundle'>('single');
  const {bundle, items, separateCents, savingsCents} = bundleOffer;
  const others = items.length - 1;
  const selected = choice === 'single' ? product : bundle;

  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-extrabold">Choose your option</legend>
      <Option
        checked={choice === 'single'}
        onSelect={() => setChoice('single')}
        title="This tool"
        detail={`${product.format} · instant download`}
        price={formatMoney(product.priceCents)}
      />
      <Option
        checked={choice === 'bundle'}
        onSelect={() => {
          setChoice('bundle');
          track('view_bundle_upgrade', {...productDimensions(bundle), bundle_id: bundle.factoryId, placement: 'pdp_option'});
        }}
        title={bundle.title}
        detail={`This tool + ${others} more · ${formatMoney(separateCents)} separately`}
        price={formatMoney(bundle.priceCents)}
        tag={`Save ${formatMoney(savingsCents)}`}
      />
      <AddToCartButton
        key={selected.handle}
        handle={selected.handle}
        placement={choice === 'single' ? 'pdp_hero' : 'pdp_bundle'}
        className="btn-cta mt-2 w-full py-3.5 text-base"
      >
        {choice === 'single'
          ? `Add to cart — ${formatMoney(product.priceCents)}`
          : `Add the ${items.length}-tool bundle — ${formatMoney(bundle.priceCents)}`}
      </AddToCartButton>
    </fieldset>
  );
}

function Option({
  checked,
  onSelect,
  title,
  detail,
  price,
  tag,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
  price: string;
  tag?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-(--radius-control) border bg-surface p-3.5 transition-colors ${checked ? 'border-[1.5px] border-ink' : 'border-line hover:border-ink/50'}`}
    >
      <input type="radio" name="purchase-option" checked={checked} onChange={onSelect} className="size-4 accent-ink" />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold">{title}</span>
          {tag ? <span className="rounded-[5px] bg-sale px-1.5 py-0.5 text-[11px] font-extrabold text-surface">{tag}</span> : null}
        </span>
        <span className="mt-0.5 block text-xs text-muted">{detail}</span>
      </span>
      <span className="price text-xl">{price}</span>
    </label>
  );
}

function PdpBundleUpgrade({product, bundleOffer}: {product: ProductSummary; bundleOffer: BundleOffer}) {
  const {bundle, headline, items, separateCents, savingsCents, savingsPercent} = bundleOffer;
  const ref = useTrackOnView<HTMLElement>('view_bundle_upgrade', {
    ...productDimensions(bundle),
    bundle_id: bundle.factoryId,
    placement: 'pdp_section',
  });

  return (
    <section ref={ref} className="container-page py-8">
      <div className="grid gap-6 rounded-(--radius-card) border-[1.5px] border-ink bg-highlight/50 p-5 sm:p-7 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="kicker">Better value</p>
          <h2 className="h-section mt-2">{headline}</h2>
          <p className="mt-3 text-ink/75">
            {product.title} is one of {items.length} tools in the {bundle.title}. {bundle.tagline}
          </p>
          <div className="mt-5">
            <PriceAnchor priceCents={bundle.priceCents} separateCents={separateCents} savingsCents={savingsCents} />
            <p className="mt-1 text-sm text-muted">{savingsPercent}% less than buying the tools one by one.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <AddToCartButton handle={bundle.handle} placement="pdp_bundle" className="btn-cta">
              Get all {items.length} tools — {formatMoney(bundle.priceCents)}
            </AddToCartButton>
            <Link to={`/products/${bundle.handle}`} className="btn-secondary">See the bundle</Link>
          </div>
        </div>
        <ul className="card divide-y divide-line self-start">
          {items.map((item) => (
            <li key={item.handle} className={`flex items-center justify-between gap-3 px-4 py-3 ${item.handle === product.handle ? 'bg-paper' : ''}`}>
              <span className="flex items-center gap-2 text-sm font-bold">
                <Icon name="check" className="size-4 shrink-0 text-success" strokeWidth={3} />
                {item.title}
                {item.handle === product.handle ? <span className="text-xs font-semibold text-muted">(this tool)</span> : null}
              </span>
              <span className="text-sm text-muted tabular-nums">{formatMoney(item.priceCents)}</span>
            </li>
          ))}
          <li className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="font-bold">Bought separately</span>
            <s className="text-muted tabular-nums">{formatMoney(separateCents)}</s>
          </li>
          <li className="flex items-center justify-between px-4 py-3">
            <span className="font-extrabold">Bundle price</span>
            <span className="price text-xl">{formatMoney(bundle.priceCents)}</span>
          </li>
        </ul>
      </div>
    </section>
  );
}

function BundleContents({bundle}: {bundle: ProductSummary}) {
  const {index} = useCart();
  const {items, separateCents, savingsCents} = getBundleValue(bundle, index);
  return (
    <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.handle} className="card flex gap-3 p-3">
          <div className="w-16 shrink-0"><ProductPreview product={item} size="thumb" /></div>
          <div className="min-w-0">
            <Link to={`/products/${item.handle}`} className="text-sm leading-tight font-extrabold hover:underline">{item.title}</Link>
            <p className="mt-0.5 line-clamp-2 text-xs text-ink/70">{item.tagline}</p>
            <p className="mt-1 text-xs text-muted">
              {item.format} · <span className="tabular-nums">{formatMoney(item.priceCents)}</span> alone
            </p>
          </div>
        </li>
      ))}
      <li className="flex flex-col justify-center rounded-(--radius-card) border-[1.5px] border-dashed border-ink bg-highlight/60 p-4">
        <p className="text-sm">Bought separately: <s className="tabular-nums">{formatMoney(separateCents)}</s></p>
        <p className="mt-1 text-lg font-black">
          Bundle: {formatMoney(bundle.priceCents)} — you save {formatMoney(savingsCents)}
        </p>
      </li>
    </ul>
  );
}

function IncludedFilesCompact({product, summary}: {product: {included: Array<{name: string}>}; summary: ProductSummary}) {
  const count = summary.bundleItems?.length ?? product.included.length;
  return (
    <p className="mt-3 flex items-center gap-2 text-sm text-ink/70">
      <Icon name="download" className="size-4 shrink-0" />
      {summary.bundleItems ? `${count} tools` : `${count} ${count === 1 ? 'file' : 'files'}`} delivered instantly after payment
    </p>
  );
}

function Fact({icon, label, value}: {icon: 'file' | 'clock'; label: string; value: string}) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-xs font-bold text-muted">
        <Icon name={icon} className="size-3.5" /> {label}
      </dt>
      <dd className="mt-0.5 font-bold">{value}</dd>
    </div>
  );
}
