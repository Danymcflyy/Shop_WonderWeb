import {SITE} from '~/lib/site';

/** JSON safe to place inside a script element (prevents an HTML closing-tag escape). */
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function getStoreJsonLd(storeDomain?: string) {
  const origin = storeDomain
    ? `https://${storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')}`
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: SITE.name,
        ...(origin ? {url: origin} : {}),
      },
      {
        '@type': 'WebSite',
        name: SITE.name,
        ...(origin ? {url: origin} : {}),
      },
    ],
  };
}
