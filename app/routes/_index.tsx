import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {getCatalog, matchesFilter, sortProducts} from '~/lib/catalog';
import {getBundleValue} from '~/lib/offer-engine';
import {GENERAL_FAQ, SITE, UNIVERSES} from '~/lib/site';
import {formatMoney} from '~/lib/money';
import {track} from '~/lib/analytics';
import {BundleComparison} from '~/components/conversion/BundleComparison';
import {TrustStrip} from '~/components/conversion/TrustStrip';
import {FAQ} from '~/components/conversion/FAQ';
import {HowItWorks} from '~/components/home/HowItWorks';
import {SectionHeading} from '~/components/ui/SectionHeading';
import {Icon} from '~/components/ui/Icon';

export const meta: Route.MetaFunction = () => [
  {title: `${SITE.name} — ${SITE.promise}`},
  {
    name: 'description',
    content:
      'Calculateurs, modèles et packs pratiques pour votre activité. Fichiers modifiables, un seul paiement.',
  },
];

/**
 * Global hub: routes visitors to the right universe fast. Each universe card
 * is a mini storefront (problems + prices + flagship bundle), not a banner.
 */
export async function loader({context}: Route.LoaderArgs) {
  const catalog = getCatalog(context.env);
  const [index, problemCollections] = await Promise.all([
    catalog.getIndex(),
    catalog.listCollections('problem'),
  ]);
  const products = Object.values(index);
  const tools = products.filter((p) => !p.bundleItems);

  const universes = UNIVERSES.map((universe) => {
    const uTools = tools.filter((t) => t.universe === universe.id);
    const bundle = index[universe.heroBundle];
    return {
      id: universe.id,
      toolCount: uTools.length,
      bundleCount: products.filter((p) => p.bundleItems && p.universe === universe.id).length,
      fromCents: Math.min(...uTools.map((t) => t.priceCents)),
      problems: universe.problems.slice(0, 3).map((entry) => {
        const collection = problemCollections.find((c) => c.handle === entry.collection);
        const matching = uTools.filter((t) => collection && matchesFilter(t, collection.filter));
        return {...entry, fromCents: Math.min(...matching.map((t) => t.priceCents))};
      }),
      bundle: bundle ? {handle: bundle.handle, title: bundle.title, priceCents: bundle.priceCents, ...pickSavings(getBundleValue(bundle, index))} : null,
    };
  });

  return {
    universes,
    bundles: sortProducts(products.filter((p) => p.bundleItems), 'price-asc'),
    stats: {
      tools: tools.length,
      bundles: products.length - tools.length,
      fromCents: Math.min(...tools.map((t) => t.priceCents)),
    },
    index,
  };
}

function pickSavings(value: ReturnType<typeof getBundleValue>) {
  return {separateCents: value.separateCents, savingsCents: value.savingsCents, itemCount: value.items.length};
}

export default function Hub() {
  const data = useLoaderData<typeof loader>();

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="container-page py-8 lg:py-12">
          <p className="kicker">{SITE.name}</p>
          <h1 className="mt-3 max-w-3xl text-[36px] leading-[1.02] font-black tracking-[-0.03em] text-balance sm:text-[52px]">
            Des outils concrets pour votre activité. <span className="marker">Un seul paiement.</span>
          </h1>
          <p className="mt-3 text-[15px] font-semibold text-ink/70">
            {data.stats.tools} outils · {data.stats.bundles} packs · dès {formatMoney(data.stats.fromCents)}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {data.universes.map((u) => {
              const config = UNIVERSES.find((c) => c.id === u.id)!;
              return (
                <article
                  key={u.id}
                  data-universe={u.id}
                  className="card flex flex-col overflow-hidden border-[1.5px] border-ink shadow-card"
                >
                  <div className="h-2 bg-cta" aria-hidden />
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <p className="kicker">{config.audience}</p>
                    <h2 className="mt-2 text-[30px] leading-none font-black tracking-tight">
                      WonderWeb {config.label}
                    </h2>
                    <p className="mt-2 text-ink/75">{config.pitch}</p>

                    <ul className="mt-5 space-y-2">
                      {u.problems.map((problem) => (
                        <li key={problem.collection}>
                          <Link
                            to={`/collections/${problem.collection}`}
                            prefetch="intent"
                            onClick={() => track('select_problem', {universe: [problem.collection], placement: 'hub'})}
                            className="group flex items-center gap-3 rounded-(--radius-control) border border-line bg-surface px-3 py-2.5 hover:border-ink"
                          >
                            <span className="min-w-0 flex-1 text-[15px] leading-tight font-extrabold">{problem.label}</span>
                            <span className="shrink-0 text-xs text-muted">
                              dès <strong className="text-sm text-ink tabular-nums">{formatMoney(problem.fromCents)}</strong>
                            </span>
                            <Icon name="arrow" className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {u.bundle ? (
                      <Link
                        to={`/products/${u.bundle.handle}`}
                        className="mt-3 flex items-center gap-2 rounded-md bg-highlight/70 px-3 py-2 text-sm hover:bg-highlight"
                      >
                        <Icon name="layers" className="size-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">
                          <strong>{u.bundle.title}</strong> · {u.bundle.itemCount} outils
                        </span>
                        <span className="shrink-0 tabular-nums">
                          <strong>{formatMoney(u.bundle.priceCents)}</strong>{' '}
                          {u.bundle.savingsCents > 0 ? <s className="text-muted">{formatMoney(u.bundle.separateCents)}</s> : null}
                        </span>
                      </Link>
                    ) : null}

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                      <span className="text-sm font-semibold text-muted">
                        {u.toolCount} outils · {u.bundleCount} packs · dès {formatMoney(u.fromCents)}
                      </span>
                      <Link to={config.path} prefetch="intent" className="btn-cta">
                        Explorer {config.label} <Icon name="arrow" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-6">
            <TrustStrip compact />
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <SectionHeading
          kicker="Packs"
          title="Des outils complémentaires, réunis dans un pack."
          intro="Les économies éventuelles sont calculées avec les prix Shopify actuels."
          action={
            <Link to="/collections/bundles" className="btn-ghost">
              Tous les packs <Icon name="arrow" />
            </Link>
          }
        />
        <BundleComparison bundles={data.bundles} index={data.index} />
      </section>

      <HowItWorks />

      <section id="faq" className="container-page grid gap-8 py-12 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="kicker">Questions</p>
          <h2 className="h-section mt-2">Vos questions avant l’achat.</h2>
        </div>
        <FAQ items={GENERAL_FAQ} />
      </section>

      <section className="container-page">
        <div className="card flex flex-col items-start justify-between gap-5 border-[1.5px] border-ink p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Choisissez le problème à résoudre.</h2>
            <p className="mt-1 text-ink/70">Outils numériques · Un paiement · Sans abonnement</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {UNIVERSES.map((u) => (
              <Link key={u.id} to={u.path} data-universe={u.id} className="btn-cta">
                WonderWeb {u.label} <Icon name="arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
