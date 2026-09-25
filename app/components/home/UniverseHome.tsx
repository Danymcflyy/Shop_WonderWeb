import {Link} from 'react-router';
import type {UniverseHomeData} from '~/lib/universe-home.server';
import {getBundleValue} from '~/lib/offer-engine';
import {GENERAL_FAQ, getUniverse} from '~/lib/site';
import {formatMoney} from '~/lib/money';
import {ProblemSelector} from '~/components/conversion/ProblemSelector';
import {ProductCard} from '~/components/conversion/ProductCard';
import {BundleComparison} from '~/components/conversion/BundleComparison';
import {AddToCartButton} from '~/components/conversion/AddToCartButton';
import {TrustStrip} from '~/components/conversion/TrustStrip';
import {FAQ} from '~/components/conversion/FAQ';
import {ProductPreview} from '~/components/product/ProductPreview';
import {SectionHeading} from '~/components/ui/SectionHeading';
import {Icon} from '~/components/ui/Icon';
import {HowItWorks} from '~/components/home/HowItWorks';

/** Homepage of one universe (/pro, /lifestyle). Same sales structure, universe-scoped data. */
export function UniverseHome({data}: {data: UniverseHomeData}) {
  const universe = getUniverse(data.universe)!;
  const {index, heroBundle, spotlight} = data;
  const heroValue = getBundleValue(heroBundle, index);
  const spotlightValue = spotlight ? getBundleValue(spotlight, index) : null;

  return (
    <>
      {/* 1–2. Hero with problem selector */}
      <section className="border-b border-line bg-surface">
        <div className="container-page grid gap-8 py-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12 lg:py-12">
          <div>
            <p className="kicker">WonderWeb {universe.label} · {universe.audience}</p>
            <h1 className="mt-3 text-[36px] leading-[1.02] font-black tracking-[-0.03em] text-balance sm:text-[52px]">
              {universe.hero.title} <span className="marker">{universe.hero.highlight}</span>
            </h1>
            <p className="mt-3 text-[15px] font-semibold text-ink/70">
              {data.stats.tools} tools · {data.stats.bundles} bundles · from {formatMoney(data.stats.fromCents)}
            </p>

            <h2 className="mt-8 mb-3 text-sm font-extrabold">What do you want to fix?</h2>
            <ProblemSelector options={data.problems} />

            <div className="mt-6">
              <TrustStrip compact />
            </div>
          </div>

          <aside aria-label="Featured bundle" className="card self-start border-[1.5px] border-ink p-4 shadow-card sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="kicker">Best-value bundle</p>
            </div>
            <Link to={`/products/${heroBundle.handle}`} className="mt-3 block">
              <ProductPreview product={heroBundle} size="hero" />
            </Link>
            <h2 className="mt-4 text-xl leading-tight font-black">{heroBundle.title}</h2>
            <p className="mt-1 text-sm text-ink/70">{heroBundle.tagline}</p>
            <ul className="mt-3 grid grid-cols-1 gap-1 text-[13px] sm:grid-cols-2">
              {heroValue.items.map((item) => (
                <li key={item.handle} className="flex gap-1.5">
                  <Icon name="check" className="mt-0.5 size-3.5 shrink-0 text-success" strokeWidth={3} />
                  {item.title}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-4">
              <div>
                <span className="price text-3xl">{formatMoney(heroBundle.priceCents)}</span>
                <p className="text-xs text-muted">
                  <s>{formatMoney(heroValue.separateCents)}</s> separately · save {formatMoney(heroValue.savingsCents)}
                </p>
              </div>
              <AddToCartButton handle={heroBundle.handle} placement="homepage_bundle" className="btn-cta">
                Get the bundle
              </AddToCartButton>
            </div>
          </aside>
        </div>
      </section>

      {/* 3. Outcomes → 4. Featured tools */}
      <section className="container-page py-12">
        <SectionHeading
          kicker="Start here"
          title="Where we’d start: the quickest wins"
          intro="Staff picks. Each tool solves one clear problem, and its page shows how long setup takes."
          action={
            <Link to={universe.allPath} className="btn-ghost">
              All {data.stats.tools} tools <Icon name="arrow" />
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {data.featured.map((product) => (
            <ProductCard key={product.handle} product={product} />
          ))}
        </div>
      </section>

      {/* 5. Bundle comparison */}
      <section className="border-y border-line bg-surface py-12">
        <div className="container-page">
          <SectionHeading
            kicker="Bundles"
            title="Need more than one tool? Bundles cost less."
            intro="Every bundle is priced below its tools bought separately. The savings shown are calculated from current prices."
          />
          <BundleComparison bundles={data.bundles} index={index} highlight={spotlight?.handle} />
        </div>
      </section>

      {/* 6. By business type */}
      {data.businessTypes.length ? (
      <section className="container-page py-12">
        <SectionHeading kicker="By business type" title="Tools picked for how you work" />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {data.businessTypes.map((type) => (
            <li key={type.handle}>
              <Link
                to={`/collections/${type.handle}`}
                prefetch="intent"
                className="card group flex h-full flex-col p-4 transition-colors hover:border-ink"
              >
                <span className="text-lg leading-tight font-black">{type.title}</span>
                <span className="mt-1.5 text-sm text-ink/70">{type.problem}</span>
                <span className="mt-auto pt-4 text-xs font-bold text-muted">
                  {type.toolCount} tools{type.bundleTitle ? ` · ${type.bundleTitle}` : ''}
                </span>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-extrabold group-hover:underline">
                  See the tools <Icon name="arrow" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      ) : null}

      {/* 7. How it works */}
      <HowItWorks />

      {/* 8. High-value bundle spotlight */}
      {spotlight && spotlightValue ? (
      <section className="bg-ink py-12 text-surface">
        <div className="container-page grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="kicker text-surface">Most complete bundle</p>
            <h2 className="h-section mt-2">{spotlight.title}</h2>
            <p className="mt-3 max-w-lg text-surface/75">{spotlight.tagline}</p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <span className="price text-[40px] leading-none">{formatMoney(spotlight.priceCents)}</span>
              <span className="text-sm text-surface/70">
                <s>{formatMoney(spotlightValue.separateCents)}</s> separately ·{' '}
                <strong className="text-highlight">save {formatMoney(spotlightValue.savingsCents)}</strong>
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <AddToCartButton handle={spotlight.handle} placement="homepage_bundle" className="btn-cta">
                Get all {spotlightValue.items.length} tools
              </AddToCartButton>
              <Link to={`/products/${spotlight.handle}`} className="btn-secondary border-surface bg-transparent text-surface hover:bg-surface hover:text-ink">
                See what’s inside
              </Link>
            </div>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {spotlightValue.items.map((item) => (
              <li key={item.handle} className="flex items-center justify-between gap-3 rounded-(--radius-control) border border-surface/15 px-3.5 py-3">
                <span className="text-sm font-bold">{item.title}</span>
                <span className="text-xs text-surface/60 tabular-nums">{formatMoney(item.priceCents)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      ) : null}

      {/* 9. FAQ */}
      <section id="faq" className="container-page grid gap-8 py-12 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="kicker">Questions</p>
          <h2 className="h-section mt-2">Everything you need to know before buying.</h2>
        </div>
        <FAQ items={GENERAL_FAQ} />
      </section>

      {/* 10. Final CTA */}
      <section className="container-page">
        <div className="card flex flex-col items-start justify-between gap-5 border-[1.5px] border-ink p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Pick the problem. Get the tool. Fix it this week.</h2>
            <p className="mt-1 text-ink/70">{data.stats.tools} tools from {formatMoney(data.stats.fromCents)} · Instant download · No subscription</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={universe.allPath} className="btn-cta">
              Browse all tools <Icon name="arrow" />
            </Link>
            <Link to={universe.bundlesPath} className="btn-secondary">
              Compare bundles
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
