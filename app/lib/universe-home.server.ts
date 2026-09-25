import {getCatalog, matchesFilter, sortProducts} from '~/lib/catalog';
import type {UniverseConfig} from '~/lib/site';

/** Data for a universe homepage (/pro, /lifestyle): everything filtered to that universe. */
export async function loadUniverseHome(universe: UniverseConfig, env: Env) {
  const catalog = getCatalog(env);
  const [index, problemCollections, businessCollections] = await Promise.all([
    catalog.getIndex(),
    catalog.listCollections('problem'),
    catalog.listCollections('business'),
  ]);
  const products = Object.values(index).filter((p) => p.universe === universe.id);
  const tools = products.filter((p) => !p.bundleItems);
  const bundles = sortProducts(products.filter((p) => p.bundleItems), 'price-asc');

  const problems = universe.problems.map((entry) => {
    const collection = problemCollections.find((c) => c.handle === entry.collection);
    const matching = tools.filter((t) => collection && matchesFilter(t, collection.filter));
    return {...entry, toolCount: matching.length, fromCents: Math.min(...matching.map((t) => t.priceCents))};
  });

  const bundleEntry = {
    collection: universe.bundlesPath.replace('/collections/', ''),
    label: 'Not sure? Compare the bundles',
    hint: '',
    toolCount: bundles.length,
    fromCents: Math.min(...bundles.map((p) => p.priceCents)),
  };

  const businessTypes = universe.businessTypes
    ? businessCollections
        .filter((c) => c.universe === universe.id)
        .map((collection) => {
          const bundle = collection.bundleHandle ? index[collection.bundleHandle] : undefined;
          return {
            handle: collection.handle,
            title: collection.title,
            problem: collection.problem,
            toolCount: tools.filter((t) => matchesFilter(t, collection.filter)).length,
            bundleTitle: bundle?.title,
          };
        })
    : [];

  return {
    universe: universe.id,
    featured: sortProducts(tools, 'recommended').slice(0, 8),
    bundles,
    problems: bundles.length ? [...problems, bundleEntry] : problems,
    businessTypes,
    heroBundle: index[universe.heroBundle],
    spotlight: universe.spotlightBundle ? index[universe.spotlightBundle] : null,
    stats: {
      tools: tools.length,
      bundles: bundles.length,
      fromCents: Math.min(...tools.map((t) => t.priceCents)),
    },
    index,
  };
}

export type UniverseHomeData = Awaited<ReturnType<typeof loadUniverseHome>>;
