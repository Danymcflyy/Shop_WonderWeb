import {useMatches} from 'react-router';
import {getUniverse, type UniverseConfig} from '~/lib/site';

/**
 * The universe of the current page, read from the deepest route loader that
 * returns a `universe` field (universe home, collection, product). Null on
 * store-wide pages (hub, cart, global collections).
 */
export function useCurrentUniverse(): UniverseConfig | null {
  const matches = useMatches();
  for (let i = matches.length - 1; i >= 0; i--) {
    const data = matches[i].data as {universe?: unknown} | undefined;
    if (data && typeof data === 'object' && typeof data.universe === 'string') {
      return getUniverse(data.universe);
    }
  }
  return null;
}
