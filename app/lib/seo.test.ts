import {describe, expect, it} from 'vitest';
import {getStoreJsonLd, serializeJsonLd} from '~/lib/seo';

describe('SEO helpers', () => {
  it('normalizes the public domain into an HTTPS origin', () => {
    const graph = getStoreJsonLd('https://shop.example.com/')['@graph'];
    expect(graph[0]).toMatchObject({url: 'https://shop.example.com'});
    expect(graph[1]).toMatchObject({url: 'https://shop.example.com'});
  });

  it('escapes markup in JSON-LD script content', () => {
    expect(serializeJsonLd({value: '</script><script>alert(1)</script>'})).not.toContain('<');
  });
});
