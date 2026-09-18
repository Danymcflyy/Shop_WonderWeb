import {useLoaderData} from 'react-router';
import type {Route} from './+types/collections.all';
import {loadCollection} from '~/lib/collection-loader.server';
import {CollectionView} from '~/components/collection/CollectionView';
import {SITE} from '~/lib/site';

export const meta: Route.MetaFunction = () => [
  {title: `All tools | ${SITE.name}`},
  {name: 'description', content: 'Every calculator, template, checklist and bundle. One payment, no subscription.'},
];

export async function loader({request, context}: Route.LoaderArgs) {
  return loadCollection('all', request, context.env);
}

export default function AllTools() {
  return <CollectionView {...useLoaderData<typeof loader>()} />;
}
