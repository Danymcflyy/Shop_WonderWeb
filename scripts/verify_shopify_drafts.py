#!/usr/bin/env python3
"""Verify all Shopify factory drafts against the private import plan."""

import csv
import argparse
import json
from pathlib import Path

from import_shopify_drafts import PRIVATE, execute


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--store', required=True)
    parser.add_argument('--factory', required=True, type=Path)
    args = parser.parse_args()
    factory = args.factory.resolve()
    expected = {p['factoryId']: p for p in json.loads((PRIVATE / 'draft-payloads.json').read_text())}
    manifest = {p['factoryId']: p for p in json.loads((PRIVATE.parent / 'shopify-publication-manifest.json').read_text())['products']}
    current = []
    cursor = None
    while True:
        page = execute('admin-products-verify.graphql', {'cursor': cursor}, store=args.store)['products']
        current += page['nodes']
        if not page['pageInfo']['hasNextPage']:
            break
        cursor = page['pageInfo']['endCursor']
    issues = []
    found = {}
    delivery = []
    for item in current:
        fid = (item.get('factoryId') or {}).get('value')
        if fid not in expected:
            issues.append(f'Unexpected product: {item["handle"]} ({fid})')
            continue
        if fid in found:
            issues.append(f'Duplicate factory ID: {fid}')
            continue
        found[fid] = item
        exp = expected[fid]
        media = item['media']['nodes']
        variants = item['variants']['nodes']
        checks = {
            'handle': item['handle'] == exp['handle'],
            'title': item['title'] == exp['title'],
            'draft': item['status'] == 'DRAFT',
            'seo': item['seo'] == exp['seo'],
            'vendor': item['vendor'] == 'WonderWeb',
            'variant_count': len(variants) == 1,
            'media_count': len(media) == 9,
            'media_ready': all(m['status'] == 'READY' and m['mediaContentType'] == 'IMAGE' for m in media),
            'media_alt_order': [m['alt'] for m in media] == exp['imageAlt'],
            'factory_data': (json.loads((item.get('factoryData') or {}).get('value') or '{}') == exp['metafields']['custom.factory_data']),
        }
        if variants:
            variant = variants[0]
            checks.update({
                'price_eur_ttc': variant['price'] == exp['priceTtcEur'],
                'sku': variant['sku'] == f'WW-{fid}',
                'taxable': variant['taxable'] is True,
                'no_shipping': variant['inventoryItem']['requiresShipping'] is False,
                'untracked': variant['inventoryItem']['tracked'] is False,
            })
            delivery.append({
                'factory_id': fid, 'shopify_product_id': item['id'],
                'shopify_variant_id': variant['id'], 'zip_path': str(factory / manifest[fid]['archive']['path']),
                'zip_sha256': manifest[fid]['archive']['sha256'],
                'delivery_status': 'not_attached_or_tested',
            })
        issues += [f'{fid}: {name}' for name, passed in checks.items() if not passed]
    issues += [f'{fid}: missing in Shopify' for fid in expected.keys() - found.keys()]
    report = {
        'expected': len(expected), 'shopify_products': len(current),
        'matched': len(found), 'drafts': sum(p['status'] == 'DRAFT' for p in found.values()),
        'ready_galleries': sum(len(p['media']['nodes']) == 9 and all(m['status'] == 'READY' for m in p['media']['nodes']) for p in found.values()),
        'issues': issues,
    }
    (PRIVATE / 'admin-verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    with (PRIVATE / 'delivery-attachments.csv').open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(delivery[0]) if delivery else ['factory_id'])
        writer.writeheader()
        writer.writerows(delivery)
    print(json.dumps(report, ensure_ascii=False))
    if issues:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
