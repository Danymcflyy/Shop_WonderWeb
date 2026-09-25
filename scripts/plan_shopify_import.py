#!/usr/bin/env python3
"""Validate factory assets and produce a private, read-only Shopify draft plan.

An optional Admin snapshot is a JSON array of {id, handle, factoryId, variantId,
status}. The planner never guesses that a product is new when no snapshot exists.
"""

import argparse
import csv
import hashlib
import html
import json
import re
import shutil
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FACTORY = Path('/Users/perso/Desktop/digital-product-factory')
MANIFEST = ROOT / 'publication/shopify-publication-manifest.json'
OUTPUT = ROOT / 'publication/preview'


def checked_path(relative):
    path = (FACTORY / relative).resolve()
    if not path.is_relative_to(FACTORY.resolve()) or not path.is_file():
        raise ValueError(f'Missing or invalid factory asset: {relative}')
    return path


def clean_markdown(value):
    return re.sub(r'\s+', ' ', re.sub(r'[#*_>`\[\]]', '', value)).strip()


def listing_html(markdown):
    def inline(value):
        escaped = html.escape(value)
        escaped = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', escaped)
        return re.sub(r'`(.+?)`', r'<code>\1</code>', escaped)

    chunks, in_list = [], False
    for raw in markdown.splitlines():
        line = raw.strip()
        if not line:
            if in_list:
                chunks.append('</ul>')
                in_list = False
            continue
        if line.startswith('## '):
            if in_list:
                chunks.append('</ul>')
                in_list = False
            chunks.append(f'<h2>{inline(line[3:])}</h2>')
        elif re.match(r'^(?:- |\d+\. )', line):
            if not in_list:
                chunks.append('<ul>')
                in_list = True
            chunks.append(f'<li>{inline(re.sub(r"^(?:- |\d+\. )", "", line))}</li>')
        else:
            if in_list:
                chunks.append('</ul>')
                in_list = False
            chunks.append(f'<p>{inline(line)}</p>')
    if in_list:
        chunks.append('</ul>')
    return ''.join(chunks)


def main():
    global FACTORY
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--factory', type=Path, default=FACTORY)
    parser.add_argument('--manifest', type=Path, default=MANIFEST)
    parser.add_argument('--snapshot', type=Path, help='Admin product snapshot JSON')
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    FACTORY = args.factory.resolve()
    source = json.loads(args.manifest.read_text())
    products = source['products']
    if source['productCount'] != 120 or len(products) != 120:
        raise ValueError('Expected exactly 120 products')
    ids = [p['factoryId'] for p in products]
    if len(set(ids)) != 120:
        raise ValueError('Duplicate factory IDs')
    registry = {p['id']: p for p in json.loads((FACTORY / '01_PRODUCT-REGISTRY/products.json').read_text())}
    if set(registry) != set(ids):
        raise ValueError('Registry IDs differ from publication manifest')
    handles = {p['factoryId']: p['proposedHandle'] for p in products}
    snapshot = json.loads(args.snapshot.read_text()) if args.snapshot else None
    if snapshot is not None and not isinstance(snapshot, list):
        raise ValueError('Snapshot must be a JSON array')
    by_id, by_handle = {}, {}
    for item in snapshot or []:
        fid, handle = item.get('factoryId'), item.get('handle')
        if fid:
            by_id.setdefault(fid, []).append(item)
        if handle:
            by_handle.setdefault(handle, []).append(item)

    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    images = output / 'covers'
    images.mkdir(exist_ok=True)
    galleries = output / 'galleries'
    galleries.mkdir(exist_ok=True)
    # Every universe, every format and every bundle gets a nine-image review.
    selected = {p['factoryId'] for p in products if p['productType'] == 'bundle'}
    for field in ('universe', 'format'):
        for value in {p[field] for p in products}:
            selected.add(next(p['factoryId'] for p in products if p[field] == value))
    rows = []
    payloads = []
    for product in products:
        fid = product['factoryId']
        archive = checked_path(product['archive']['path'])
        if archive.stat().st_size != product['archive']['bytes']:
            raise ValueError(f'{fid}: ZIP size differs from manifest')
        if hashlib.sha256(archive.read_bytes()).hexdigest() != product['archive']['sha256']:
            raise ValueError(f'{fid}: ZIP checksum differs from manifest')
        with zipfile.ZipFile(archive) as zf:
            if zf.testzip():
                raise ValueError(f'{fid}: ZIP integrity failed')
        if len(product['images']) != 9:
            raise ValueError(f'{fid}: expected nine real images')
        for image in product['images']:
            checked_path(image)
        for listing in product['listing'].values():
            checked_path(listing)
        if any(component not in ids for component in product['bundleProductIds']):
            raise ValueError(f'{fid}: unknown bundle component')
        if product['productType'] == 'bundle' and not product['bundleProductIds']:
            raise ValueError(f'{fid}: empty bundle')

        matches = by_id.get(fid, [])
        handle_matches = by_handle.get(product['proposedHandle'], [])
        if snapshot is None:
            action = 'needs_admin_lookup'
        elif len(matches) > 1 or len(handle_matches) > 1:
            action = 'conflict_duplicate'
        elif matches and handle_matches and matches[0]['id'] != handle_matches[0]['id']:
            action = 'conflict_handle_owned_by_other_product'
        elif matches:
            action = 'update_draft' if matches[0].get('status') == 'DRAFT' else 'conflict_not_draft'
        elif handle_matches:
            action = 'conflict_handle_without_factory_id'
        else:
            action = 'create_draft'
        existing = matches[0] if len(matches) == 1 else {}
        title = checked_path(product['listing']['title.txt']).read_text().strip()
        subtitle = checked_path(product['listing']['subtitle.txt']).read_text().strip()
        description = checked_path(product['listing']['short-description.txt']).read_text().strip()
        seo_title = checked_path(product['listing']['seo-title.txt']).read_text().strip()
        seo_description = checked_path(product['listing']['seo-description.txt']).read_text().strip()
        long_description = checked_path(product['listing']['long-description.md']).read_text().strip()
        included = [
            {'name': Path(path).name, 'format': Path(path).suffix.lower().lstrip('.'), 'detail': ''}
            for path in product['customerFiles']
        ]
        steps = [clean_markdown(line) for line in checked_path(product['listing']['how-it-works.md']).read_text().splitlines() if re.match(r'^\s*\d+\.', line)]
        faq_text = checked_path(product['listing']['faq.md']).read_text()
        faq = [{'q': clean_markdown(q), 'a': clean_markdown(a)} for q, a in re.findall(r'\*\*(.+?)\*\*\s*\n(.+?)(?=\n\s*\n|\Z)', faq_text, re.S)]
        benefits = [clean_markdown(line) for line in checked_path(product['listing']['benefits.md']).read_text().splitlines() if line.strip().startswith(('-', '*', '1.', '2.', '3.'))]
        problem_tags = {
            'Prospecting & Customer Acquisition': 'find-clients',
            'Profitability, Pricing & Margins': 'profit',
            'SME Organization & Operations': 'organize',
            'Social Media & Content': 'marketing',
            'Google Business Profile & Customer Reviews': 'local',
            'Freelancers': 'organize',
            'Artisans & Service Businesses': 'profit',
            'Agencies': 'organize',
            'E-commerce': 'profit',
            'Creators, Coaches & Consultants': 'marketing',
        }
        business_tags = {
            'Freelancers': ['freelancers'], 'Artisans & Service Businesses': ['artisans'],
            'Agencies': ['agencies'], 'E-commerce': ['ecommerce'],
            'Google Business Profile & Customer Reviews': ['local-shops'],
        }
        tier = 'bundle' if product['productType'] == 'bundle' else ('impulse' if registry[fid]['pricing_tier'] == 'micro' else 'core')
        factory_data = {
            'universe': 'pro', 'tagline': subtitle, 'format': product['format'],
            'formats': sorted({item['format'] for item in included}),
            'timeToValue': registry[fid]['estimated_time_to_value'],
            'problem': {'headline': registry[fid]['problem'], 'points': [description]},
            'outcome': {'headline': registry[fid]['expected_outcome'], 'points': benefits[:5] or [subtitle]},
            'included': included, 'howItWorks': steps, 'faq': faq,
            'preview': {'kind': 'bundle' if product['productType'] == 'bundle' else 'sheet' if 'xlsx' in {item['format'] for item in included} else 'doc'},
            'offer': {'tier': tier, 'problemTags': [problem_tags[product['universe']]],
                      'businessTags': business_tags.get(product['universe'], []), 'crossSells': []},
            'bundleItems': [handles[part] for part in product['bundleProductIds']] or None,
        }
        payloads.append({
            'factoryId': fid, 'handle': product['proposedHandle'], 'status': 'DRAFT',
            'title': title, 'descriptionHtml': listing_html(long_description),
            'seo': {'title': seo_title, 'description': seo_description},
            'priceTtcEur': product['recommendedPriceTtcEur'],
            'metafields': {'custom.factory_id': fid, 'custom.factory_data': factory_data},
            'images': product['images'], 'imageAlt': [f'{title} — visuel réel {i}/9' for i in range(1, 10)],
            'archivePath': product['archive']['path'], 'archiveSha256': product['archive']['sha256'],
        })
        cover = images / f'{fid}.png'
        shutil.copyfile(checked_path(product['images'][0]), cover)
        if fid in selected:
            gallery = galleries / fid
            gallery.mkdir(exist_ok=True)
            for position, image in enumerate(product['images'], 1):
                shutil.copyfile(checked_path(image), gallery / f'{position:02d}.png')
        rows.append({
            'factory_id': fid, 'shopify_product_id': existing.get('id', ''),
            'shopify_variant_id': existing.get('variantId', ''),
            'handle': product['proposedHandle'], 'title': title,
            'subtitle': subtitle, 'description': description,
            'seo_title': seo_title, 'seo_description': seo_description,
            'universe': product['universe'], 'format': product['format'],
            'product_type': product['productType'],
            'price_ttc_eur': product['recommendedPriceTtcEur'],
            'image_count': 9, 'zip_sha256': product['archive']['sha256'],
            'zip_bytes': product['archive']['bytes'],
            'bundle_product_ids': ';'.join(product['bundleProductIds']),
            'delivery_status': 'not_configured_or_unverified',
            'online_status': 'not_verified', 'plan_action': action,
            'cover': f'covers/{fid}.png',
        })
    counts = Counter(row['plan_action'] for row in rows)
    with (output / 'catalogue-120.csv').open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=[key for key in rows[0] if key != 'cover'])
        writer.writeheader()
        writer.writerows({key: value for key, value in row.items() if key != 'cover'} for row in rows)
    (output / 'plan.json').write_text(json.dumps({'counts': counts, 'products': rows}, ensure_ascii=False, indent=2))
    (output / 'draft-payloads.json').write_text(json.dumps(payloads, ensure_ascii=False, indent=2))
    cards = []
    for row in rows:
        esc = lambda key: html.escape(str(row[key]), quote=True)
        components = f"<p>Contient : {esc('bundle_product_ids')}</p>" if row['bundle_product_ids'] else ''
        gallery_link = f'<p><a href="#gallery-{esc("factory_id")}">Voir les neuf images</a></p>' if row['factory_id'] in selected else ''
        cards.append(f'''<article class="card" id="{esc('factory_id')}"><img src="{esc('cover')}" alt="Aperçu réel de {esc('title')}" loading="lazy"><div class="body"><small>{esc('universe')} · {esc('format')} · {esc('factory_id')}</small><h2>{esc('title')}</h2><p>{esc('subtitle')}</p><p>{esc('description')}</p>{components}<strong>{esc('price_ttc_eur')} € TTC</strong>{gallery_link}<p class="state">{esc('plan_action')} · Livraison non vérifiée</p></div></article>''')
    sample_rows = [r for r in rows if r['factory_id'] in selected]
    gallery_sections = ''.join(f'''<section class="gallery" id="gallery-{html.escape(row['factory_id'])}"><h2>{html.escape(row['factory_id'])} · {html.escape(row['title'])}</h2><div class="gallery-grid">{''.join(f'<img src="galleries/{row["factory_id"]}/{i:02d}.png" alt="Image réelle {i} de {html.escape(row["title"])}" loading="lazy">' for i in range(1,10))}</div></section>''' for row in sample_rows)
    page = '''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prévisualisation privée WonderWeb — 120 produits</title><style>body{margin:0;background:#f6f3ec;color:#111;font:16px system-ui}header{padding:2rem max(1rem,4vw);background:#111;color:white}h1{margin:0 0 .5rem}main,.gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.25rem;padding:2rem max(1rem,4vw)}.card{background:white;border:1px solid #ddd9cf;border-radius:12px;overflow:hidden}.card img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}.body{padding:1rem}.body h2{font-size:1.2rem}.body p{line-height:1.45}.state{font-size:.85rem;color:#6b6b6b}strong{color:#d64211}.gallery{padding:2rem max(1rem,4vw);border-top:1px solid #ddd9cf}.gallery-grid{padding:0}.gallery-grid img{width:100%;background:white;border:1px solid #ddd9cf}</style><header><h1>WonderWeb · prévisualisation privée du catalogue</h1><p>120 fiches issues de la fabrique. Prix recommandés TTC ; les prix Shopify publics, le paiement et la livraison doivent encore être vérifiés. Aucune fiche n’est annoncée publiée.</p></header><main>''' + ''.join(cards) + '</main><div id="galleries"><h2 style="padding:1rem 4vw">Galeries de contrôle · chaque univers, format et bundle</h2>' + gallery_sections + '</div></html>'
    (output / 'index.html').write_text(page)
    (output / 'README.md').write_text(
        '# Prévisualisation privée WonderWeb\n\n'
        '- `index.html` : 120 fiches avec leurs couvertures réelles et 30 galeries complètes couvrant les dix univers, les douze formats et les dix bundles.\n'
        '- `catalogue-120.csv` : correspondances Shopify à compléter, prix TTC, neuf images, empreinte ZIP, livraison et vérification en ligne.\n'
        '- `draft-payloads.json` : données préparées pour un import Admin en statut DRAFT ; aucun ZIP ni secret inclus.\n'
        '- `plan.json` : décisions idempotentes. Sans snapshot Admin, les 120 lignes restent `needs_admin_lookup` ; aucune création ne peut être présumée.\n\n'
        'Aucun produit ne doit être déclaré publié avant contrôle Admin, paiement, livraison du ZIP et vérification en ligne.\n'
    )
    print(json.dumps({'output': str(output), 'counts': counts, 'images_checked': 1080, 'archives_checked': 120, 'full_galleries': len(selected)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
