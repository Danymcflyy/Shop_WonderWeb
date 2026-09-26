import {data} from 'react-router';
import {getCatalog, SORT_OPTIONS, type SortKey} from '~/lib/catalog';
import type {BusinessTypeId} from '~/lib/catalog/types';

const BUSINESS_IDS: BusinessTypeId[] = ['artisans', 'freelancers', 'agencies', 'ecommerce', 'local-shops'];

export async function loadCollection(handle: string, request: Request, env: Env) {
  const url = new URL(request.url);
  const sortParam = url.searchParams.get('sort');
  const sort: SortKey = SORT_OPTIONS.some((o) => o.key === sortParam) ? (sortParam as SortKey) : 'recommended';
  const forParam = url.searchParams.get('for');
  const business = BUSINESS_IDS.includes(forParam as BusinessTypeId) ? (forParam as BusinessTypeId) : null;

  const result = await getCatalog(env).getCollection(handle, {sort, business});
  if (!result) throw data({message: `Collection ${handle} not found`}, {status: 404});
  return {...result, sort, business, universe: result.collection.universe ?? null};
}
