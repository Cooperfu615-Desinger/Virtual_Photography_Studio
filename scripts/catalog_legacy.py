"""Closed structural contract for E management data; no catalog ID minting."""
import json
from pathlib import Path

CONTRACT = Path(__file__).parent/'lib/legacyMappingContract.json'


def validate_legacy_document(document):
    contract = json.loads(CONTRACT.read_text(encoding='utf-8'))
    def require(ok, path, message):
        if not ok:
            raise ValueError(f'legacy_mappings.json:{path}: {message}')
    def text(value):
        return isinstance(value, str) and bool(value.strip())
    def pair(value):
        return isinstance(value, list) and len(value) == 2 and text(value[0]) and type(value[1]) is int and value[1] >= 0
    require(isinstance(document, dict) and set(document) == {'version', 'constants', 'tables'}, '$', 'unknown/missing envelope fields')
    require(type(document['version']) is int and document['version'] == 1, 'version', 'expected 1')
    for kind in ('constants', 'tables'):
        require(isinstance(document[kind], dict) and list(document[kind]) == list(contract[kind]), kind, 'approved names and order required')
    for name, definition in contract['constants'].items():
        item = document['constants'][name]
        require(isinstance(item, dict) and set(item) == {'fieldKind', 'value'}, name, 'invalid constant')
        require(item['fieldKind'] == definition['fieldKind'] and text(item['value']), name, 'invalid legacy category')
    for name, definition in contract['tables'].items():
        table = document['tables'][name]
        require(isinstance(table, dict) and set(table) == {'shape', 'fields', 'source'}, name, 'invalid table envelope')
        require(table['shape'] == definition['shape'] and table['fields'] == definition['fields'], name, 'field declarations must match reviewed contract')
        source = table['source']; shape = table['shape']; fields = table['fields']
        if shape == 'dictionary':
            require(isinstance(source, dict) and bool(source) and all(text(k) and text(v) for k, v in source.items()), name, 'nonempty string dictionary required')
            continue
        require(isinstance(source, list) and bool(source), name, 'nonempty ordered list required')
        if shape == 'pairs':
            require(all(isinstance(p, list) and len(p) == 2 and all(text(v) for v in p) for p in source), name, 'ordered string pairs required')
            continue
        for index, row in enumerate(source):
            path = f'{name}[{index}]'
            require(isinstance(row, dict) and set(row) <= set(fields), path, 'unknown field')
            require(all(k in row for k, d in fields.items() if d.get('required')), path, 'required field missing')
            for key, value in row.items():
                form = fields[key].get('format')
                valid = pair(value) if form == 'pair' else (isinstance(value, list) and all(pair(p) for p in value)) if form == 'pairs' else (isinstance(value, list) and bool(value) and all(text(p) for p in value)) if form == 'strings' else text(value)
                require(valid, path+'.'+key, 'invalid value, legacy tuple or index')
    return document


def read_legacy_source(path):
    # Reject duplicate JSON keys before json.loads could silently overwrite one.
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f'legacy_mappings.json: duplicate JSON key {key}')
            result[key] = value
        return result
    raw = Path(path).read_bytes().decode('utf-8')
    validate_legacy_document(json.loads(raw, object_pairs_hook=unique))
    return raw
