#!/usr/bin/env python3
"""Idempotently create factory products as Shopify drafts; never publish them.

Shopify CLI owns authentication. All command outputs and upload URLs stay in the
ignored private preview directory. Run the planner with a fresh Admin snapshot first.
"""

import argparse
import json
import os
import re
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRIVATE = ROOT / 'publication/preview'
VERSION = '2026-07'


def execute(query_file, variables=None, mutation=False, *, store):
    with tempfile.TemporaryDirectory(dir=PRIVATE) as temporary:
        output = Path(temporary) / 'result.json'
        cmd = ['shopify', 'store', 'execute', '--store', store, '--version', VERSION,
               '--query-file', str(ROOT / 'scripts' / query_file), '--json',
               '--output-file', str(output)]
        if variables is not None:
            variable_file = Path(temporary) / 'variables.json'
            variable_file.write_text(json.dumps(variables, ensure_ascii=False))
            cmd += ['--variable-file', str(variable_file)]
        if mutation:
            cmd.append('--allow-mutations')
        env = {**os.environ, 'OPT_OUT_INSTRUMENTATION': 'true'}
        run = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, env=env)
        if run.returncode or not output.exists():
            raise RuntimeError(f'CLI query failed: {query_file}: {run.stderr[-500:]}')
        result = json.loads(output.read_text())
        if 'errors' in result:
            raise RuntimeError(f'GraphQL errors for {query_file}: {result["errors"]}')
        return result


def snapshot(store):
    rows = []
    cursor = None
    while True:
        data = execute('admin-products-snapshot.graphql', {'cursor': cursor}, store=store)['products']
        for node in data['nodes']:
            rows.append({
                'id': node['id'], 'handle': node['handle'], 'status': node['status'],
                'factoryId': (node.get('factoryId') or {}).get('value'),
                'variantId': (node['variants']['nodes'][0]['id'] if node['variants']['nodes'] else None),
            })
        if not data['pageInfo']['hasNextPage']:
            return rows
        cursor = data['pageInfo']['endCursor']


def stage_images(product, factory, store):
    paths = []
    for index, relative in enumerate(product['images'], 1):
        path = (factory / relative).resolve()
        if not path.is_relative_to(factory) or not path.is_file() or path.suffix.lower() != '.png':
            raise RuntimeError(f'{product["factoryId"]}: invalid image {index}')
        paths.append(path)
    inputs = [{'filename': f'{product["factoryId"]}-{index:02d}.png',
               'mimeType': 'image/png', 'resource': 'PRODUCT_IMAGE', 'httpMethod': 'POST'}
              for index in range(1, 10)]
    response = execute('admin-staged-uploads-create.graphql', {'input': inputs}, True, store=store)['stagedUploadsCreate']
    if response['userErrors'] or len(response['stagedTargets'] or []) != 9:
        raise RuntimeError(f'{product["factoryId"]}: staged upload rejected: {response["userErrors"]}')
    def upload(entry):
        index, path, target = entry
        command = ['curl', '--silent', '--show-error', '--fail-with-body', '--request', 'POST',
                   '--url', target['url']]
        for parameter in target['parameters']:
            command += ['--form', f'{parameter["name"]}={parameter["value"]}']
        command += ['--form', f'file=@{path};type=image/png']
        run = subprocess.run(command, capture_output=True, env=os.environ)
        if run.returncode:
            raise RuntimeError(f'{product["factoryId"]}: image upload {index} failed (HTTP/curl {run.returncode})')
        return {'originalSource': target['resourceUrl'], 'contentType': 'IMAGE',
                'filename': f'{product["factoryId"]}-{index:02d}.png',
                'alt': product['imageAlt'][index - 1]}
    with ThreadPoolExecutor(max_workers=9) as pool:
        return list(pool.map(upload, ((i, p, t) for i, (p, t) in enumerate(zip(paths, response['stagedTargets']), 1))))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--limit', type=int, default=120)
    parser.add_argument('--store', required=True, help='Exact myshopify.com domain')
    parser.add_argument('--factory', required=True, type=Path, help='Local verified factory root')
    args = parser.parse_args()
    store = args.store
    factory = args.factory.resolve()
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]*\.myshopify\.com', store):
        parser.error('--store must be a myshopify.com domain')
    if not factory.is_dir():
        parser.error('--factory must be a directory')
    if not 1 <= args.limit <= 120:
        parser.error('limit must be between 1 and 120')
    preflight = execute('admin-import-preflight.graphql', store=store)
    shop = preflight['shop']
    if shop['myshopifyDomain'] != store or shop['currencyCode'] != 'EUR' or not shop['taxesIncluded']:
        raise RuntimeError('Shop/domain/currency/tax settings differ from reviewed preview')
    definitions = {d['key']: d for d in preflight['metafieldDefinitions']['nodes']}
    for key, kind in (('factory_id', 'single_line_text_field'), ('factory_data', 'json')):
        definition = definitions.get(key)
        if not definition or definition['type']['name'] != kind or definition['access']['storefront'] != 'PUBLIC_READ':
            raise RuntimeError(f'Missing Storefront-readable custom.{key} definition')
    source = json.loads((PRIVATE / 'draft-payloads.json').read_text())
    if len(source) != 120 or len({p['factoryId'] for p in source}) != 120:
        raise RuntimeError('Expected exactly 120 unique factory payloads')
    current = snapshot(store)
    (PRIVATE / 'admin-snapshot.json').write_text(json.dumps(current, indent=2))
    by_id, by_handle = {}, {}
    for item in current:
        if item['factoryId']:
            if item['factoryId'] in by_id:
                raise RuntimeError(f'Duplicate factory ID: {item["factoryId"]}')
            by_id[item['factoryId']] = item
        if item['handle'] in by_handle:
            raise RuntimeError(f'Duplicate Shopify handle: {item["handle"]}')
        by_handle[item['handle']] = item
    # Refuse all conflicts before uploading the first image or changing a product.
    for product in source:
        fid, handle = product['factoryId'], product['handle']
        match, holder = by_id.get(fid), by_handle.get(handle)
        if match and holder and match['id'] != holder['id']:
            raise RuntimeError(f'{fid}: handle belongs to another product')
        if holder and not match:
            raise RuntimeError(f'{fid}: handle exists without matching factory ID')
        if match and (match['status'] != 'DRAFT' or match['handle'] != handle):
            raise RuntimeError(f'{fid}: existing product is not the expected draft')
    results = []
    for product in source[:args.limit]:
        fid = product['factoryId']
        existing = by_id.get(fid)
        if existing:
            print(f'{fid}: draft already exists; skip', flush=True)
            results.append(existing)
            continue
        print(f'{fid}: upload nine images and create draft', flush=True)
        files = stage_images(product, factory, store)
        fields = product['metafields']
        payload = {
            'title': product['title'], 'handle': product['handle'],
            'descriptionHtml': product['descriptionHtml'], 'status': 'DRAFT',
            'seo': product['seo'], 'vendor': 'WonderWeb', 'productType': 'Produit numérique',
            'tags': ['WonderWeb Factory', 'Produit numérique', fid],
            'metafields': [
                {'namespace': 'custom', 'key': 'factory_id', 'type': 'single_line_text_field', 'value': fid},
                {'namespace': 'custom', 'key': 'factory_data', 'type': 'json',
                 'value': json.dumps(fields['custom.factory_data'], ensure_ascii=False, separators=(',', ':'))},
            ],
            'productOptions': [{'name': 'Title', 'position': 1,
                                'values': [{'name': 'Default Title'}]}],
            'variants': [{'optionValues': [{'optionName': 'Title', 'name': 'Default Title'}],
                          'price': product['priceTtcEur'],
                          'sku': f'WW-{fid}', 'taxable': True,
                          'inventoryItem': {'requiresShipping': False, 'tracked': False}}],
            'files': files,
        }
        response = execute('admin-product-set.graphql', {'input': payload}, True, store=store)['productSet']
        if response['userErrors'] or not response['product']:
            raise RuntimeError(f'{fid}: productSet failed: {response["userErrors"]}')
        created = response['product']
        if created['status'] != 'DRAFT' or created['handle'] != product['handle'] or (created.get('factoryId') or {}).get('value') != fid:
            raise RuntimeError(f'{fid}: returned product does not match draft identity')
        row = {'id': created['id'], 'handle': created['handle'], 'status': created['status'],
               'factoryId': fid, 'variantId': created['variants']['nodes'][0]['id']}
        results.append(row)
        by_id[fid] = row
        by_handle[product['handle']] = row
        (PRIVATE / 'admin-snapshot.json').write_text(json.dumps(list(by_handle.values()), indent=2))
        print(f'{fid}: draft created {created["id"]}', flush=True)
    print(json.dumps({'processed': len(results), 'created': sum(r['factoryId'] not in {x['factoryId'] for x in current} for r in results)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
