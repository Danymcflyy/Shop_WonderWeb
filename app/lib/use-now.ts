import {useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';

/**
 * Server "now", shared with the client so date-based UI (new badges,
 * campaign windows) renders identically on server and after hydration.
 */
export function useNow() {
  const data = useRouteLoaderData<RootLoader>('root');
  return new Date(data?.now ?? Date.now());
}
