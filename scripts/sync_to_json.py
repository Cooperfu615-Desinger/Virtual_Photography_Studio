import argparse
import json
import os
import re
import sys


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB_DIR = os.path.join(BASE_DIR, 'knowledge_base')
OUTPUT_DIR = os.path.join(BASE_DIR, 'webapp', 'src', 'data')
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'database.json')
OUTFIT_PRESET_METADATA_FILE = os.path.join(KB_DIR, 'outfit_preset_metadata.json')
ITEM_METADATA_FILE = os.path.join(KB_DIR, 'item_metadata.json')
WARDROBE_REFERENCE_MANIFEST_FILE = os.path.join(KB_DIR, 'wardrobe_reference_manifest.json')
WARDROBE_SOURCE_IMAGE_ROOT = os.path.join(BASE_DIR, 'source-assets', 'wardrobe')
WARDROBE_PREVIEW_IMAGE_ROOT = os.path.join(BASE_DIR, 'webapp', 'public', 'reference', 'wardrobe')
IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp', '.avif')
EXPECTED_WARDROBE_REFERENCE_CATEGORIES = {
    '特殊穿搭 (Special Outfits)': 'special-outfits',
    '套裝 (Outfit Presets)': 'outfit-presets',
    '連身 (Dresses)': 'dresses',
}
FILES_TO_SYNC = {
    'regional_portrait_styles.md': 'Regional',
    'wardrobe_and_styling.md': 'Wardrobe',
    'camera_and_lighting.md': 'CameraLighting',
    'locations_and_sets.md': 'Locations',
    'character_design.md': 'Character',
    'negative_prompts.md': 'Negative',
}


class SyncValidationError(RuntimeError):
    pass


def clean_cell(text):
    return re.sub(r'\s+', ' ', text.replace('`', '').replace('*', '')).strip()


def parse_markdown_table(file_path):
    """Parse a knowledge-base Markdown table into the frontend grouped shape."""
    if not os.path.exists(file_path):
        raise SyncValidationError(f'Missing knowledge-base file: {file_path}')

    data = {}
    with open(file_path, 'r', encoding='utf-8') as file_handle:
        lines = file_handle.readlines()

    for line in lines:
        line = line.strip()
        if not line or not line.startswith('|') or '---' in line:
            continue

        parts = [part.strip() for part in line.split('|')[1:-1]]
        if len(parts) < 4 or parts[0] in (
            '維度',
            '類型',
            '特徵維度 (Category)',
            '特徵維度',
            '類別 (Category)',
            '維度分類 (Dimension)',
            '地區風格 (Region Style)',
            '攝影風格 (Photography Style)',
        ):
            continue

        if 'regional_portrait_styles' in file_path:
            category = '攝影風格'
            name_zh = clean_cell(parts[0])
            inspiration = clean_cell(parts[1]) if len(parts) > 1 else ''
            prompt_en = clean_cell(parts[2]) if len(parts) > 2 else ''
            desc = clean_cell(parts[3]) if len(parts) > 3 else ''
            if inspiration and inspiration not in ('—', '-'):
                desc = f'{inspiration} | {desc}' if desc else inspiration
        elif len(parts) >= 5:
            category = clean_cell(parts[1])
            name_zh = clean_cell(parts[2])
            prompt_en = clean_cell(parts[3])
            desc = parts[4] if len(parts) > 4 else ''
        else:
            category = clean_cell(parts[0])
            name_zh = clean_cell(parts[1])
            prompt_en = clean_cell(parts[2])
            desc = parts[3] if len(parts) > 3 else ''

        data.setdefault(category, []).append({
            'zh': name_zh,
            'en': prompt_en,
            'desc': clean_cell(desc),
        })

    return data


def count_entries(grouped_data):
    return sum(len(items) for items in grouped_data.values())


def load_json_file(file_path, required=False):
    if not os.path.exists(file_path):
        if required:
            raise SyncValidationError(f'Missing metadata file: {file_path}')
        return {}
    with open(file_path, 'r', encoding='utf-8') as file_handle:
        return json.load(file_handle)


def validate_unique_item_names(database):
    for db_key, grouped_data in database.items():
        for category, items in grouped_data.items():
            names = [item.get('zh') for item in items]
            duplicates = sorted({name for name in names if names.count(name) > 1})
            if duplicates:
                raise SyncValidationError(
                    f'Duplicate item names in {db_key}/{category}: {", ".join(duplicates)}'
                )


def merge_outfit_preset_metadata(grouped_data, metadata_by_name):
    category = '套裝 (Outfit Presets)'
    items = [item for item in grouped_data.get(category, []) if item.get('zh') != '全無']
    item_names = {item['zh'] for item in items}
    metadata_names = set(metadata_by_name)
    if item_names != metadata_names:
        missing = sorted(item_names - metadata_names)
        unexpected = sorted(metadata_names - item_names)
        raise SyncValidationError(
            f'Outfit preset metadata mismatch; missing={missing}, unexpected={unexpected}'
        )

    for item in items:
        item['meta'] = metadata_by_name[item['zh']]
    return len(items)


def list_image_files(directory_path):
    if not os.path.isdir(directory_path):
        raise SyncValidationError(f'Missing image directory: {directory_path}')
    return {
        file_name
        for file_name in os.listdir(directory_path)
        if file_name.lower().endswith(IMAGE_EXTENSIONS)
    }


def validate_unique_manifest_values(entries, key, category):
    values = [entry.get(key) for entry in entries]
    missing_count = sum(not value for value in values)
    duplicates = sorted({value for value in values if value and values.count(value) > 1})
    if missing_count or duplicates:
        raise SyncValidationError(
            f'Invalid wardrobe reference manifest {key} values in {category}; '
            f'missing={missing_count}, duplicates={duplicates}'
        )


def merge_wardrobe_reference_images(grouped_data, manifest):
    categories = manifest.get('categories') if manifest.get('version') == 1 else None
    if not isinstance(categories, dict) or not categories:
        raise SyncValidationError('Wardrobe reference manifest must use version 1 with categories')
    if set(categories) != set(EXPECTED_WARDROBE_REFERENCE_CATEGORIES):
        raise SyncValidationError(
            'Wardrobe reference manifest categories mismatch; '
            f'missing={sorted(set(EXPECTED_WARDROBE_REFERENCE_CATEGORIES) - set(categories))}, '
            f'unexpected={sorted(set(categories) - set(EXPECTED_WARDROBE_REFERENCE_CATEGORIES))}'
        )

    merged_count = 0
    all_reference_ids = set()

    for category, category_manifest in categories.items():
        directory_name = category_manifest.get('directory')
        entries = category_manifest.get('items')
        if not directory_name or not isinstance(entries, list):
            raise SyncValidationError(f'Invalid wardrobe reference manifest category: {category}')
        if directory_name != EXPECTED_WARDROBE_REFERENCE_CATEGORIES[category]:
            raise SyncValidationError(
                f'Unexpected wardrobe reference directory for {category}: {directory_name}'
            )

        for key in ('id', 'name', 'source', 'preview'):
            validate_unique_manifest_values(entries, key, category)

        reference_ids = {entry['id'] for entry in entries}
        duplicate_ids = sorted(reference_ids & all_reference_ids)
        if duplicate_ids:
            raise SyncValidationError(f'Duplicate wardrobe reference ids: {duplicate_ids}')
        all_reference_ids.update(reference_ids)

        items = [item for item in grouped_data.get(category, []) if item.get('zh') != '全無']
        items_by_name = {item['zh']: item for item in items}
        manifest_names = {entry['name'] for entry in entries}
        item_names = set(items_by_name)
        if item_names != manifest_names:
            missing = sorted(item_names - manifest_names)
            unexpected = sorted(manifest_names - item_names)
            raise SyncValidationError(
                f'Wardrobe reference manifest mismatch for {category}; '
                f'missing={missing}, unexpected={unexpected}'
            )

        source_dir = os.path.join(WARDROBE_SOURCE_IMAGE_ROOT, directory_name)
        preview_dir = os.path.join(WARDROBE_PREVIEW_IMAGE_ROOT, directory_name)
        source_files = list_image_files(source_dir)
        preview_files = list_image_files(preview_dir)
        manifest_source_files = {entry['source'] for entry in entries}
        manifest_preview_files = {entry['preview'] for entry in entries}
        if source_files != manifest_source_files:
            raise SyncValidationError(
                f'Source image files do not match manifest for {category}; '
                f'missing={sorted(manifest_source_files - source_files)}, '
                f'unexpected={sorted(source_files - manifest_source_files)}'
            )
        if preview_files != manifest_preview_files:
            raise SyncValidationError(
                f'Preview image files do not match manifest for {category}; '
                f'missing={sorted(manifest_preview_files - preview_files)}, '
                f'unexpected={sorted(preview_files - manifest_preview_files)}'
            )

        for entry in entries:
            preview_file = entry['preview']
            meta = items_by_name[entry['name']].setdefault('meta', {})
            meta['referenceImageId'] = entry['id']
            meta['referenceImage'] = f'reference/wardrobe/{directory_name}/{preview_file}'
            meta['referenceImageFormat'] = os.path.splitext(preview_file)[1].lstrip('.').lower()
            merged_count += 1

    return merged_count


def merge_explicit_item_metadata(database, metadata):
    merged_count = 0
    for db_key, categories in metadata.items():
        if db_key not in database or not isinstance(categories, dict):
            raise SyncValidationError(f'Unknown item metadata database: {db_key}')
        for category, items_by_name in categories.items():
            database_items = database[db_key].get(category)
            if not isinstance(database_items, list) or not isinstance(items_by_name, dict):
                raise SyncValidationError(f'Unknown item metadata category: {db_key}/{category}')
            database_by_name = {item['zh']: item for item in database_items}
            for item_name, item_metadata in items_by_name.items():
                item = database_by_name.get(item_name)
                if not item or not isinstance(item_metadata, dict):
                    raise SyncValidationError(f'Unknown item metadata target: {db_key}/{category}/{item_name}')
                reserved_keys = {'zh', 'en', 'desc', 'meta'} & set(item_metadata)
                if reserved_keys:
                    raise SyncValidationError(
                        f'Item metadata cannot override reserved keys for {item_name}: {sorted(reserved_keys)}'
                    )
                item.update(item_metadata)
                merged_count += len(item_metadata)
    return merged_count


# Catalog architecture B: dormant validators. build_database still reads Markdown.
CATALOG_SCHEMA_KEYWORDS = {'type', 'enum', 'required', 'properties', 'items', 'additionalProperties', 'pattern', 'minLength'}
CATALOG_TYPES = {'object', 'array', 'string', 'boolean', 'number', 'integer', 'null'}


def catalog_error(file, entry_id, path, expected, actual):
    raise SyncValidationError(f'{file}: id={entry_id} field={path}: expected {expected}; actual {actual!r}')


def validate_schema_definition(schema, file='<schema>', path='$'):
    if not isinstance(schema, dict) or not schema:
        catalog_error(file, '<schema>', path, 'nonempty schema object', schema)
    unknown = set(schema) - CATALOG_SCHEMA_KEYWORDS
    if unknown:
        catalog_error(file, '<schema>', path, 'supported keywords', sorted(unknown))
    types = schema.get('type')
    types = types if isinstance(types, list) else [types]
    if not types or any(not isinstance(t, str) for t in types) or len(set(types)) != len(types) or any(t not in CATALOG_TYPES for t in types):
        catalog_error(file, '<schema>', path, 'explicit supported type(s)', types)
    if 'enum' in schema and (not isinstance(schema['enum'], list) or not schema['enum']):
        catalog_error(file, '<schema>', path, 'nonempty enum array', schema['enum'])
    for keyword in ('properties', 'required', 'additionalProperties'):
        if keyword in schema and 'object' not in types:
            catalog_error(file, '<schema>', path, 'object type for '+keyword, types)
    if 'properties' in schema:
        if not isinstance(schema['properties'], dict):
            catalog_error(file, '<schema>', path, 'properties object', schema['properties'])
        for key, value in schema['properties'].items():
            validate_schema_definition(value, file, path+'.'+key)
    required = schema.get('required', [])
    if not isinstance(required, list) or any(not isinstance(k, str) for k in required) or len(set(required)) != len(required):
        catalog_error(file, '<schema>', path, 'unique required names', required)
    if set(required) - set(schema.get('properties', {})):
        catalog_error(file, '<schema>', path, 'required names declared in properties', required)
    if 'additionalProperties' in schema and type(schema['additionalProperties']) is not bool:
        catalog_error(file, '<schema>', path, 'boolean additionalProperties', schema['additionalProperties'])
    if 'array' in types:
        if 'items' not in schema:
            catalog_error(file, '<schema>', path, 'explicit array items schema', schema)
        validate_schema_definition(schema['items'], file, path+'[]')
    elif 'items' in schema:
        catalog_error(file, '<schema>', path, 'array type for items', types)
    if 'minLength' in schema:
        if 'string' not in types or type(schema['minLength']) is not int or schema['minLength'] < 0:
            catalog_error(file, '<schema>', path, 'nonnegative integer minLength on string', schema['minLength'])
    if 'pattern' in schema:
        if 'string' not in types or not isinstance(schema['pattern'], str):
            catalog_error(file, '<schema>', path, 'string pattern on string', schema['pattern'])
        try:
            re.compile(schema['pattern'])
        except re.error as exc:
            catalog_error(file, '<schema>', path, 'valid regex', str(exc))


def validate_catalog_value(value, schema, file='<catalog>', entry_id='<unknown>', path='$', check_schema=True):
    if check_schema:
        validate_schema_definition(schema, file)
    types = schema['type'] if isinstance(schema['type'], list) else [schema['type']]
    matches = {'object': isinstance(value, dict), 'array': isinstance(value, list), 'string': isinstance(value, str),
               'boolean': type(value) is bool, 'integer': type(value) is int,
               'number': type(value) in (int, float), 'null': value is None}
    if not any(matches[t] for t in types):
        catalog_error(file, entry_id, path, types, value)
    # bool is an int subclass in Python; enum comparison must preserve JSON types.
    if 'enum' in schema and not any(type(value) is type(v) and value == v for v in schema['enum']):
        catalog_error(file, entry_id, path, schema['enum'], value)
    if isinstance(value, str):
        if len(value) < schema.get('minLength', 0) or (schema.get('minLength', 0) > 0 and not value.strip()):
            catalog_error(file, entry_id, path, 'nonempty string of required length', value)
        if 'pattern' in schema and not re.search(schema['pattern'], value):
            catalog_error(file, entry_id, path, schema['pattern'], value)
    if isinstance(value, dict):
        for key in schema.get('required', []):
            if key not in value:
                catalog_error(file, entry_id, path+'.'+key, 'required field', '<missing>')
        properties = schema.get('properties', {})
        for key, child in value.items():
            if key not in properties:
                if schema.get('additionalProperties', True) is False:
                    catalog_error(file, entry_id, path+'.'+key, 'known field', child)
            else:
                validate_catalog_value(child, properties[key], file, entry_id, path+'.'+key, False)
    if isinstance(value, list):
        for i, child in enumerate(value):
            validate_catalog_value(child, schema['items'], file, entry_id, f'{path}[{i}]', False)


def merged_catalog_schema(wrapper, section, category):
    if set(wrapper) != {'common', 'sections'} or not isinstance(wrapper['sections'], dict):
        raise SyncValidationError('schema wrapper must contain common and sections only')
    if section not in wrapper['sections']:
        raise SyncValidationError(f'Unknown schema section {section}')
    scope = wrapper['sections'][section]
    if set(scope) - {'properties', 'required', 'categories'} or category not in scope.get('categories', {}):
        raise SyncValidationError(f'Unknown schema category/keyword {section}/{category}')
    result = {'type': 'object', 'properties': {}, 'required': [], 'additionalProperties': False}
    for layer in (wrapper['common'], {k: v for k, v in scope.items() if k != 'categories'}, scope['categories'][category]):
        if not isinstance(layer, dict) or set(layer) - {'properties', 'required'}:
            raise SyncValidationError(f'Unknown wrapper keyword in {section}/{category}')
        if not isinstance(layer.get('properties', {}), dict) or not isinstance(layer.get('required', []), list):
            raise SyncValidationError(f'Invalid schema layer in {section}/{category}')
        for key, value in layer.get('properties', {}).items():
            if key in result['properties'] and result['properties'][key] != value:
                raise SyncValidationError(f'Conflicting schema definition {section}/{category}/{key}')
            result['properties'][key] = value
        for key in layer.get('required', []):
            if key not in result['required']:
                result['required'].append(key)
    validate_schema_definition(result)
    return result


def validate_catalog_records(wrapper, section, category, records, file='<catalog>'):
    schema = merged_catalog_schema(wrapper, section, category)
    if not isinstance(records, list) or not records:
        raise SyncValidationError(f'{file}: expected nonempty entries array')
    for row in records:
        entry_id = row.get('id', '<missing>') if isinstance(row, dict) else '<invalid>'
        validate_catalog_value(row, schema, file, entry_id, check_schema=False)
        for key in ('zh', 'en', 'desc', 'inspiration'):
            if key in row and ('|' in row[key] or '\n' in row[key] or '\r' in row[key]):
                catalog_error(file, entry_id, key, 'single Markdown cell without pipes/newlines', row[key])


def build_database():
    print('Starting sync from MD to JSON...')
    database = {}
    outfit_preset_metadata = load_json_file(OUTFIT_PRESET_METADATA_FILE, required=True)
    item_metadata = load_json_file(ITEM_METADATA_FILE, required=True)
    wardrobe_reference_manifest = load_json_file(WARDROBE_REFERENCE_MANIFEST_FILE, required=True)

    for filename, db_key in FILES_TO_SYNC.items():
        file_path = os.path.join(KB_DIR, filename)
        print(f'Parsing {filename}...')
        parsed_data = parse_markdown_table(file_path)
        if filename == 'wardrobe_and_styling.md':
            merged_count = merge_outfit_preset_metadata(parsed_data, outfit_preset_metadata)
            print(f'  Outfit preset metadata merged: {merged_count}')
            image_count = merge_wardrobe_reference_images(parsed_data, wardrobe_reference_manifest)
            print(f'  Wardrobe reference images merged: {image_count}')
        print(f'  Categories: {len(parsed_data)} | Entries: {count_entries(parsed_data)}')
        database[db_key] = parsed_data

    validate_unique_item_names(database)
    metadata_count = merge_explicit_item_metadata(database, item_metadata)
    print(f'Explicit item metadata fields merged: {metadata_count}')

    character_total = count_entries(database.get('Character', {}))
    if character_total < 10:
        raise SyncValidationError(f'Character database looks too small ({character_total} entries)')

    return database


def render_database(database):
    return json.dumps(database, ensure_ascii=False, indent=2) + '\n'


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description='Sync knowledge-base Markdown into database.json')
    parser.add_argument(
        '--check',
        action='store_true',
        help='validate all inputs and fail if database.json is not exactly up to date',
    )
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    try:
        rendered_database = render_database(build_database())
        if args.check:
            if not os.path.exists(OUTPUT_FILE):
                raise SyncValidationError(f'Missing generated database: {OUTPUT_FILE}')
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as file_handle:
                current_database = file_handle.read()
            if current_database != rendered_database:
                raise SyncValidationError(
                    'Generated database is stale. Run python3 scripts/sync_to_json.py and commit the result.'
                )
            print('Database check passed: generated output is up to date.')
            return 0

        os.makedirs(OUTPUT_DIR, exist_ok=True)
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as file_handle:
            file_handle.write(rendered_database)
        print(f'Successfully synced dictionaries to {OUTPUT_FILE}')
        return 0
    except (OSError, ValueError, SyncValidationError) as error:
        print(f'ERROR: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
