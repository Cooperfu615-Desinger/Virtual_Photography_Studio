# 用法：在 repo 根目錄執行 python3 Docs/reports/pose-library-lying-2026-10-19/scene-surfaces/tools/export_metadata.py
# 將 surfaces.json 中可躺的場景寫進 knowledge_base/item_metadata.json 的 Locations.<分類>.<場景>.lyingSurface，
# 其他欄位不動；之後執行 python3 scripts/sync_to_json.py 產生 database.json。
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..', '..'))
surfaces = json.load(open(os.path.join(HERE, '..', 'surfaces.json'), encoding='utf-8'))
database = json.load(open(os.path.join(ROOT, 'webapp/src/data/database.json'), encoding='utf-8'))['Locations']
meta_path = os.path.join(ROOT, 'knowledge_base/item_metadata.json')
original = open(meta_path, encoding='utf-8').read()
category_of = {item['zh']: category for category, items in database.items() for item in items}
block = {}
for row in surfaces:
    if row['lyingAllowed']:
        block.setdefault(category_of[row['zh']], {})[row['zh']] = {'lyingSurface': {'type': row['surfaceType'], 'en': row['surfaceEn']}}

def find_block(text, key):
    """Return (start, end) of '"key": {...}' at top level, or None. Only this span is ever rewritten."""
    marker = '\n  "%s": {' % key
    at = text.find(marker)
    if at < 0:
        return None
    depth, i = 0, text.index('{', at)
    for j in range(i, len(text)):
        if text[j] == '{': depth += 1
        elif text[j] == '}':
            depth -= 1
            if depth == 0:
                return at, j + 1
    raise ValueError('unbalanced Locations block')

rendered = json.dumps(block, ensure_ascii=False, indent=2).replace('\n', '\n  ')
span = find_block(original, 'Locations')
if span:
    if any(k != 'lyingSurface' for cat in json.loads('{' + original[span[0]+1:span[1]] + '}')['Locations'].values() for item in cat.values() for k in item):
        raise SystemExit('Locations block has fields other than lyingSurface; merge by hand')
    updated = original[:span[0]] + '\n  "Locations": ' + rendered + original[span[1]:]
else:
    end = original.rstrip().rfind('}')
    body = original[:end].rstrip()
    updated = body + ',\n  "Locations": ' + rendered + '\n}' + original[end+1:]
json.loads(updated)
open(meta_path, 'w', encoding='utf-8').write(updated)
print('lyingSurface written:', sum(len(v) for v in block.values()))
