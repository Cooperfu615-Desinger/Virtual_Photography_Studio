"""Read-only C2 source-English diagnostics; length never edits or blocks content."""
import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOKEN = re.compile(r"[A-Za-z0-9]+(?:['’./&-][A-Za-z0-9]+)*")


def word_count(text):
    if not isinstance(text, str):
        raise ValueError('English source must be a string')
    return len(TOKEN.findall(text))


def digest(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def local_file(root, relative):
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()) or not path.is_file():
        raise ValueError('Missing or unsafe reference: ' + relative)
    return path


def inspect(root=ROOT):
    root = Path(root)
    policy = json.loads(local_file(root, 'scripts/lib/authoringLengthPolicy.json').read_text())
    if policy.get('version') != 1:
        raise ValueError('Unsupported policy version')
    index = json.loads(local_file(root, 'knowledge_base/catalog/index.json').read_text())
    entries, categories = {}, set()
    for section in index['sections']:
        if section['name'] not in policy['sections']:
            continue
        for category in section['categories']:
            key = section['name'] + '/' + category['name']
            categories.add(key)
            data = json.loads(local_file(root, 'knowledge_base/catalog/' + category['path']).read_text())
            for item in data['entries']:
                if item['id'] in entries:
                    raise ValueError('Duplicate ID: ' + item['id'])
                entries[item['id']] = (key, item)
    for key, rule in policy['rules'].items():
        if key not in categories or not isinstance(rule['min'], int) or not isinstance(rule['max'], int) or not 0 <= rule['min'] <= rule['max']:
            raise ValueError('Invalid category/range: ' + key)
        local_file(root, rule['spec'])
    exceptions = {}
    for item in policy['exceptions']:
        key = item['id']
        if key in exceptions or key not in entries:
            raise ValueError('Duplicate or missing exception ID: ' + key)
        if item['kind'] not in ['specific_contract', 'necessary_structure'] or not item['reason'].strip():
            raise ValueError('Invalid exception reason/kind: ' + key)
        if not re.fullmatch(r'[0-9a-f]{40}', item['reviewedCommit']):
            raise ValueError('Invalid reviewed commit: ' + key)
        if digest(entries[key][1]['en']) != item['sourceSha256']:
            raise ValueError('Stale exception source: ' + key)
        local_file(root, item['spec'])
        exceptions[key] = item
    rows = []
    for key, (category, item) in entries.items():
        if item['zh'] == '全無' or item['en'].strip().lower() == 'none':
            continue
        count = word_count(item['en'])
        rule = policy['rules'].get(category)
        status = 'unclassified' if rule is None else ('under' if count < rule['min'] else 'over' if count > rule['max'] else 'within')
        rows.append({'id': key, 'zh': item['zh'], 'category': category, 'words': count,
                     'status': status, 'range': [rule['min'], rule['max']] if rule else None,
                     'review': exceptions.get(key), 'sourceSha256': digest(item['en'])})
    summary = {k: sum(r['status'] == k for r in rows) for k in ['under', 'over', 'within', 'unclassified']}
    return {'policyVersion': 1, 'field': 'catalog.en only', 'summary': summary, 'reviewedExceptions': len(exceptions), 'rows': rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    args = parser.parse_args()
    try:
        print(json.dumps(inspect(args.root), ensure_ascii=False, indent=2))
    except (ValueError, KeyError, TypeError, OSError) as error:
        parser.exit(1, f'C2 policy/source error: {error}\n')


if __name__ == '__main__':
    main()
