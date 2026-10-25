"""Catalog source reader/rendering; legacy conversion is explicitly rehearsal-only."""
import argparse
import copy
import json
import re
import sys
from pathlib import Path

# Direct CLI and unittest import both supported, without changing production imports.
if __package__ in (None, ''):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from scripts import sync_to_json as sync
from scripts import prompt_generator
from scripts.catalog_registry import validate_registry

GROUPS = {'Regional': 'regional', 'Wardrobe': 'wardrobe', 'CameraLighting': 'camera', 'Locations': 'locations', 'Character': 'character', 'Negative': 'negative'}
IMAGE_KEYS = {'referenceImageId', 'referenceImage', 'referenceImageFormat'}
HEADERS = {'維度', '類型', '特徵維度 (Category)', '特徵維度', '類別 (Category)', '維度分類 (Dimension)', '地區風格 (Region Style)', '攝影風格 (Photography Style)'}


def prepare_records(database, compiled, schema):
    result = {}
    for section, categories in database.items():
        result[section] = {}
        for category, rows in categories.items():
            entries = compiled[GROUPS[section]][category]
            if len(rows) != len(entries):
                raise ValueError(f'{section}/{category}: source/compiled length differs')
            records = []
            for raw, entry in zip(rows, entries):
                if raw['en'] != entry['en']:
                    raise ValueError(f'{entry["id"]}: source/compiled English differs')
                record = {'id': entry['id'], 'legacyIds': copy.deepcopy(entry['legacyIds'])}
                for key, value in raw.items():
                    if key in ('stableId', 'legacyIds'):
                        continue
                    if key == 'meta':
                        value = {k: copy.deepcopy(v) for k, v in value.items() if k not in IMAGE_KEYS}
                        if not value:
                            continue
                    if key == 'desc' and section == 'Regional':
                        if value.count(' | ') != 1:
                            raise ValueError(f'{entry["id"]}: Regional description is not losslessly splittable')
                        record['inspiration'], value = value.split(' | ', 1)
                    record[key] = copy.deepcopy(value)
                records.append(record)
            sync.validate_catalog_records(schema, section, category, records, f'{section}/{category}')
            result[section][category] = records
    if set(schema['sections']) != set(result) or any(set(schema['sections'][s]['categories']) != set(cs) for s, cs in result.items()):
        raise ValueError('schema/source category sets differ')
    return result


def generated_database(records, manifest):
    database = {}
    for section, categories in records.items():
        database[section] = {}
        for category, rows in categories.items():
            database[section][category] = []
            for record in rows:
                desc = record['inspiration']+' | '+record['desc'] if section == 'Regional' else record['desc']
                raw = {'zh': record['zh'], 'en': record['en'], 'desc': desc}
                # Production sync puts preset meta, then manifest fields, before explicit metadata.
                if 'meta' in record:
                    raw['meta'] = copy.deepcopy(record['meta'])
                if section == 'Wardrobe' and category in manifest['categories'] and record['zh'] != '全無':
                    group = manifest['categories'][category]
                    matches = [x for x in group['items'] if x['name'] == record['zh']]
                    if len(matches) != 1:
                        raise ValueError(f'{record["id"]}: manifest must resolve exactly once')
                    image = matches[0]
                    raw.setdefault('meta', {}).update({'referenceImageId': image['id'], 'referenceImage': f'reference/wardrobe/{group["directory"]}/{image["preview"]}', 'referenceImageFormat': Path(image['preview']).suffix[1:].lower()})
                for key, value in record.items():
                    if key not in {'id', 'legacyIds', 'zh', 'en', 'desc', 'inspiration', 'meta'}:
                        raw[key] = copy.deepcopy(value)
                raw['stableId'] = record['id']
                raw['legacyIds'] = copy.deepcopy(record['legacyIds'])
                database[section][category].append(raw)
    sync.validate_unique_item_names(database)
    return database


def strip_ids(database):
    return {s: {c: [{k: v for k, v in row.items() if k not in ('stableId', 'legacyIds')} for row in rows] for c, rows in cs.items()} for s, cs in database.items()}


def capture_markdown_layout(repo, records):
    layouts = []
    for filename, section in sync.FILES_TO_SYNC.items():
        lines = (repo/'knowledge_base'/filename).read_text().splitlines(keepends=True)
        counts, layout = {}, []
        for line in lines:
            stripped = line.strip()
            cells = [x.strip() for x in stripped.split('|')[1:-1]]
            if not stripped.startswith('|') or '---' in stripped or len(cells) < 4 or cells[0] in HEADERS:
                layout.append(line)
                continue
            if section == 'Regional':
                category = '攝影風格'; columns = {0: 'zh', 1: 'inspiration', 2: 'en', 3: 'desc'}
            elif len(cells) >= 5:
                category = sync.clean_cell(cells[1]); columns = {2: 'zh', 3: 'en', 4: 'desc'}
            else:
                category = sync.clean_cell(cells[0]); columns = {1: 'zh', 2: 'en', 3: 'desc'}
            index = counts.get(category, 0);counts[category] = index+1
            row = records[section][category][index]
            if any(sync.clean_cell(cells[i]) != row[key] for i, key in columns.items()):
                raise ValueError(f'{filename}:{index}: Markdown cell mapping mismatch')
            affixes = {}
            for i in columns:
                prefix = re.match(r'^[`*]*', cells[i]).group()
                suffix = re.search(r'[`*]*$', cells[i]).group()
                affixes[str(i)] = [prefix, suffix]
            layout.append({'id': row['id'], 'cells': cells, 'columns': {str(i): k for i, k in columns.items()}, 'affixes': affixes})
        if counts != {c: len(rows) for c, rows in records[section].items()}:
            raise ValueError(f'{filename}: incomplete Markdown coverage')
        layouts.append({'file': filename, 'lines': layout})
    return layouts


def render_markdown(layout, by_id):
    out = []
    warning = '\n> AUTO-GENERATED from `knowledge_base/catalog/`. Do not edit. Run `python3 scripts/sync_to_json.py`.\n'
    warned = False
    for line in layout['lines']:
        if isinstance(line, str):
            out.append(line)
            if not warned and line.startswith('# '):
                out.append(warning);warned = True
            continue
        row = by_id[line['id']];cells = list(line['cells'])
        for index, key in line['columns'].items():
            value = row[key]
            if not isinstance(value, str) or not value.strip() or any(c in value for c in '|\r\n'):
                raise ValueError(f'{row["id"]}:{key}: invalid Markdown cell')
            prefix, suffix = line['affixes'][index]
            cells[int(index)] = prefix+value+suffix
        out.append('| '+' | '.join(cells)+' |\n')
    if not warned:
        raise ValueError('Markdown overview has no title')
    return ''.join(out)


def read_catalog_bundle(directory, schema):
    directory = Path(directory).resolve()
    index = json.loads((directory/'index.json').read_text())
    if set(index) != {'version', 'sections', 'markdown'} or index['version'] != 1:
        raise ValueError('invalid index envelope')
    records, paths = {}, set()
    for section in index['sections']:
        if set(section) != {'name', 'categories'} or section['name'] in records:
            raise ValueError('duplicate/invalid section')
        records[section['name']] = {}
        for item in section['categories']:
            if set(item) != {'name', 'path'} or item['name'] in records[section['name']]:
                raise ValueError('duplicate/invalid category')
            path = (directory/item['path']).resolve()
            if Path(item['path']).is_absolute() or '..' in Path(item['path']).parts or not path.is_relative_to(directory) or path in paths or path.suffix != '.json':
                raise ValueError('unsafe/duplicate category path')
            paths.add(path)
            data = json.loads(path.read_text())
            if set(data) != {'section', 'category', 'entries'} or data['section'] != section['name'] or data['category'] != item['name']:
                raise ValueError('category identity mismatch')
            sync.validate_catalog_records(schema, data['section'], data['category'], data['entries'], str(path))
            records[data['section']][data['category']] = data['entries']
    actual = {p.resolve() for p in directory.rglob('*.json')} - {directory/name for name in ('index.json', 'id_registry.json', 'schema.json', 'field_mapping.json', 'legacy_mappings.json')}
    if actual != paths:
        raise ValueError('missing or unexpected category files')
    if set(records) != set(schema['sections']) or any(set(cs) != set(schema['sections'][s]['categories']) for s, cs in records.items()):
        raise ValueError('index does not cover all schema categories')
    expected_files = list(sync.FILES_TO_SYNC)
    if [layout.get('file') for layout in index['markdown']] != expected_files:
        raise ValueError('Markdown layouts must cover the six known paths in order')
    for layout in index['markdown']:
        section = sync.FILES_TO_SYNC[layout['file']]
        expected = {c: [r['id'] for r in rows] for c, rows in records[section].items()}
        owners = {r['id']: c for c, rows in records[section].items() for r in rows}
        seen = {c: [] for c in expected}
        for line in layout['lines']:
            if isinstance(line, str):
                if line.strip().startswith('|') and '---' not in line and sync.clean_cell(line.split('|')[1]) not in HEADERS:
                    raise ValueError('Unmapped data row in Markdown layout')
                continue
            if set(line) != {'id', 'cells', 'columns', 'affixes'} or line['id'] not in owners:
                raise ValueError('Unknown or malformed Markdown row')
            category = owners[line['id']]
            columns = {'0': 'zh', '1': 'inspiration', '2': 'en', '3': 'desc'} if section == 'Regional' else ({'2': 'zh', '3': 'en', '4': 'desc'} if len(line['cells']) == 5 else {'1': 'zh', '2': 'en', '3': 'desc'})
            if line['columns'] != columns or set(line['affixes']) != set(columns):
                raise ValueError('Invalid Markdown column mapping')
            if section != 'Regional' and sync.clean_cell(line['cells'][1 if len(line['cells']) == 5 else 0]) != category:
                raise ValueError('Markdown category label differs from source')
            if any(not isinstance(pair, list) or len(pair) != 2 or any(not isinstance(v, str) or not re.fullmatch(r'[`*]*', v) for v in pair) for pair in line['affixes'].values()):
                raise ValueError('Invalid Markdown affixes')
            seen[category].append(line['id'])
        if seen != expected:
            raise ValueError('Markdown layout must cover every source ID once in category order')
    return records, index


def cli():
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', required=True)
    parser.add_argument('--output', help='existing isolated staging directory provided by migration orchestrator')
    args = parser.parse_args();repo = Path(args.repo).resolve()
    payload = json.load(sys.stdin)
    schema = json.loads((repo/'knowledge_base/catalog/schema.json').read_text())
    records = prepare_records(payload['database'], payload['entries'], schema)
    if not args.output:
        print(json.dumps({'schemaRecords': sum(len(r) for cs in records.values() for r in cs.values())}));return
    output = Path(args.output).resolve()
    if output.is_relative_to(repo):
        raise ValueError('B output must be outside repository')
    if not output.is_dir() or any(output.iterdir()):
        raise ValueError('internal staging output must be an existing empty directory')
    flat = [r for cs in records.values() for rows in cs.values() for r in rows]
    by_id = {r['id']: r for r in flat}
    if len(by_id) != len(flat):raise ValueError('duplicate source primary ID')
    frozen = payload['frozenA']
    registry = {'version': 1, 'entries': [dict(row, status='frozen') for row in frozen]}
    validate_registry(flat, registry, initial_frozen=frozen)
    catalog = output/'catalog';catalog.mkdir()
    index = {'version': 1, 'sections': [], 'markdown': capture_markdown_layout(repo, records)}
    for section, categories in records.items():
        group = {'name': section, 'categories': []};index['sections'].append(group)
        (catalog/section).mkdir()
        for category, rows in categories.items():
            slug = re.sub(r'[^a-z0-9一-鿿]+', '-', category.lower()).strip('-')
            rel = section+'/'+slug+'.json';path = catalog/rel
            if path.exists():raise ValueError('category slug collision')
            path.write_text(json.dumps({'section': section, 'category': category, 'entries': rows}, ensure_ascii=False, indent=2)+'\n')
            group['categories'].append({'name': category, 'path': rel})
    (catalog/'index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
    (catalog/'id_registry.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n')
    records, index = read_catalog_bundle(catalog,schema)
    generated = generated_database(records,json.loads((repo/'knowledge_base/wardrobe_reference_manifest.json').read_text()))
    if sync.render_database(strip_ids(generated)) != sync.render_database(strip_ids(payload['database'])):
        raise ValueError('generated database differs beyond stableId/legacyIds')
    (output/'database.json').write_text(sync.render_database(generated))
    md = output/'markdown';md.mkdir()
    for layout in index['markdown']:
        filename=layout['file'];(md/filename).write_text(render_markdown(layout,by_id))
        if sync.parse_markdown_table(str(md/filename)) != sync.parse_markdown_table(str(repo/'knowledge_base'/filename)):
            raise ValueError(f'{filename}: sync parser round-trip differs')
        previous=prompt_generator.KNOWLEDGE_BASE_DIR
        try:
            prompt_generator.KNOWLEDGE_BASE_DIR=str(md);new=prompt_generator.load_dictionary(filename)
            prompt_generator.KNOWLEDGE_BASE_DIR=str(repo/'knowledge_base');old=prompt_generator.load_dictionary(filename)
        finally:prompt_generator.KNOWLEDGE_BASE_DIR=previous
        if new!=old:raise ValueError(f'{filename}: legacy parser round-trip differs')
    print(json.dumps({'records':len(flat),'categories':sum(len(cs) for cs in records.values()),'markdownParsers':12,'registry':len(frozen),'databaseDifferences':0}))


if __name__ == '__main__':
    cli()
