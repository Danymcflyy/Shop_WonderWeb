import {useLoaderData} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {loadCollection} from '~/lib/collection-loader.server';
import {CollectionView} from '~/components/collection/CollectionView';
import {SITE} from '~/lib/site';

export const meta: Route.MetaFunction = ({data}) => [
  {title: `${data?.collection.title ?? 'Collection'} | ${SITE.name}`},
  {name: 'description', content: data?.collection.outcome ?? ''},
];

export async function loader({params, request, context}: Route.LoaderArgs) {
  return loadCollection(params.handle, request, context.env);
}

export default function Collection() {
  return <CollectionView {...useLoaderData<typeof loader>()} />;
}
