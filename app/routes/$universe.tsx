import {data, useLoaderData} from 'react-router';
import type {Route} from './+types/$universe';
import {getUniverse, SITE} from '~/lib/site';
import {loadUniverseHome} from '~/lib/universe-home.server';
import {UniverseHome} from '~/components/home/UniverseHome';

export const meta: Route.MetaFunction = ({data}) => {
  const universe = getUniverse(data?.universe);
  return [
    {title: universe ? `${SITE.name} ${universe.label} — ${universe.pitch}` : SITE.name},
    {name: 'description', content: universe?.pitch ?? SITE.promise},
  ];
};

export async function loader({params, context}: Route.LoaderArgs) {
  const universe = getUniverse(params.universe);
  if (!universe) throw data({message: 'Page not found'}, {status: 404});
  return loadUniverseHome(universe, context.env);
}

export default function UniverseHomeRoute() {
  return <UniverseHome data={useLoaderData<typeof loader>()} />;
}
