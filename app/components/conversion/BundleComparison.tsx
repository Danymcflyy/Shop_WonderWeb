import {Link} from 'react-router';
import type {CatalogIndex, ProductSummary} from '~/lib/catalog/types';
import {getBundleValue} from '~/lib/offer-engine';
import {formatMoney} from '~/lib/money';
import {AddToCartButton} from '~/components/conversion/AddToCartButton';
import {Icon} from '~/components/ui/Icon';

const BUSINESS_LABEL: Record<string, string> = {
  artisans: 'Artisans',
  freelancers: 'Indépendants',
  agencies: 'Agences',
  ecommerce: 'E-commerce',
  'local-shops': 'Commerces locaux',
};

/** Side-by-side bundle comparison. Savings = real standalone prices − bundle price. */
export function BundleComparison({
  bundles,
  index,
  highlight,
}: {
  bundles: ProductSummary[];
  index: CatalogIndex;
  highlight?: string;
}) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {bundles.map((bundle) => {
        const value = getBundleValue(bundle, index);
        const isHighlight = bundle.handle === highlight;
        return (
          <article
            key={bundle.handle}
            data-universe={bundle.universe}
            className={`relative flex w-[82%] shrink-0 snap-start flex-col rounded-(--radius-card) bg-surface p-4 sm:w-auto ${isHighlight ? 'border-[1.5px] border-ink shadow-card' : 'border border-line'}`}
          >
            {isHighlight ? (
              <span className="absolute -top-2.5 left-4 rounded-[5px] bg-ink px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-surface uppercase">
                Le plus complet
              </span>
            ) : null}
            <p className="text-xs font-bold text-muted">
              {bundle.businessTags.length
                ? `Pour ${bundle.businessTags.map((t) => BUSINESS_LABEL[t]).join(', ')}`
                : `WonderWeb ${bundle.universe === 'lifestyle' ? 'Lifestyle' : 'Pro'}`}
            </p>
            <h3 className="mt-1 text-lg leading-tight font-black">
              <Link to={`/products/${bundle.handle}`} className="hover:underline">
                {bundle.title}
              </Link>
            </h3>

            <div className="mt-3 border-y border-dashed border-line py-3">
              <div className="flex items-baseline justify-between">
                <span className="price text-3xl">{formatMoney(bundle.priceCents)}</span>
                <span className="rounded-[5px] bg-sale px-1.5 py-0.5 text-xs font-extrabold text-surface">
                  −{value.savingsPercent}%
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {value.items.length} outils · <s>{formatMoney(value.separateCents)}</s> séparément · économisez{' '}
                <strong className="text-ink">{formatMoney(value.savingsCents)}</strong>
              </p>
            </div>

            <ul className="mt-3 flex-1 space-y-1.5 text-[13px]">
              {value.items.map((item) => (
                <li key={item.handle} className="flex items-start justify-between gap-2">
                  <span className="flex gap-1.5">
                    <Icon name="check" className="mt-0.5 size-3.5 shrink-0 text-success" strokeWidth={3} />
                    {item.title}
                  </span>
                  <span className="shrink-0 text-muted tabular-nums">{formatMoney(item.priceCents)}</span>
                </li>
              ))}
            </ul>

            <AddToCartButton handle={bundle.handle} placement="homepage_bundle" className="btn-cta mt-4 w-full py-2.5 text-sm">
              Choisir le pack
            </AddToCartButton>
            <Link to={`/products/${bundle.handle}`} className="btn-ghost mt-2 self-center text-xs">
              Voir le contenu
            </Link>
          </article>
        );
      })}
    </div>
  );
}
