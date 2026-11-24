"""Fail-closed, committed-object classification for the reviewed pants copy pilot.

No product source is written. Revision records are data, never executable selectors.
"""
import copy
import difflib
import hashlib
import json
import re

POLICY = 'scripts/lib/ciPromptCopyPolicy.json'
LEDGER = 'scripts/lib/promptCopyRevisions.json'
DATABASE = 'webapp/src/data/database.json'
MARKDOWN = 'knowledge_base/wardrobe_and_styling.md'
SHA = re.compile(r'^[0-9a-f]{40}$')


class CopyIneligible(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise CopyIneligible(message)


def digest(text):
    return hashlib.sha256(text.encode()).hexdigest()


def strict_json(text):
    def pairs(values):
        result = {}
        for key, value in values:
            require(key not in result, 'Duplicate JSON key: ' + key)
            result[key] = value
        return result
    return json.loads(text, object_pairs_hook=pairs)


def load(repo, ref, path):
    return strict_json(repo.read(ref, path))


def text_pairs(before, after, profile):
    """Only existing fields and the exact old English tail alias may change."""
    require(before['id'] == after['id'] == profile['item'], 'Changed item identity')
    old, new = copy.deepcopy(before), copy.deepcopy(after)
    pairs = []
    for key in profile['fields']:
        a, b = old[key], new[key]
        require(isinstance(b, str) and b.strip() == b and 0 < len(b) <= 800 and
                not any(c in b for c in '\n\r\t|`\x00'), 'Invalid copy field')
        if a != b:
            pairs.append({'field': key, 'before': a, 'after': b})
        new[key] = a
    # Preserve the item-name clause and clause boundaries used by compact renderers.
    a, b = before['en'].split(', '), after['en'].split(', ')
    require(a[0] == b[0] == profile['name'] and len(a) == len(b), 'Changed name/projection boundary')
    aliases = old.get('legacyPromptAliases', [])
    updated = after.get('legacyPromptAliases', [])
    expected = aliases + ([before['en']] if before['en'] != after['en'] and before['en'] not in aliases else [])
    require(updated == expected, 'Aliases must retain order and append exactly the old full English')
    if 'legacyPromptAliases' in old:
        new['legacyPromptAliases'] = aliases
    else:
        new.pop('legacyPromptAliases', None)
    require(new == old, 'Changed IDs, metadata, ordering or non-copy fields')
    require(pairs, 'Revision contains no copy change')
    return pairs


def generated(repo, ref, overrides=None):
    """Use the formal generator, with sources read only from the chosen Git tree."""
    from scripts.catalog_prepare import generated_database, render_markdown
    from scripts.sync_to_json import render_database
    overrides = overrides or {}
    index = load(repo, ref, 'knowledge_base/catalog/index.json')
    records, by_id = {}, {}
    for section in index['sections']:
        records[section['name']] = {}
        for category in section['categories']:
            path = 'knowledge_base/catalog/' + category['path']
            source = strict_json(overrides[path]) if path in overrides else load(repo, ref, path)
            records[section['name']][category['name']] = source['entries']
            for row in source['entries']:
                require(row['id'] not in by_id, 'Duplicate catalog ID')
                by_id[row['id']] = row
    manifest = load(repo, ref, 'knowledge_base/wardrobe_reference_manifest.json')
    outputs = {DATABASE: render_database(generated_database(records, manifest))}
    outputs.update({'knowledge_base/' + layout['file']: render_markdown(layout, by_id) for layout in index['markdown']})
    outputs['webapp/src/data/legacyMappings.json'] = repo.read(ref, 'knowledge_base/catalog/legacy_mappings.json')
    return outputs


def make_file_record(path, before, after):
    a, b = before.splitlines(keepends=True), after.splitlines(keepends=True)
    edits = [{'line': j, 'before': a[i:k], 'after': b[j:l]}
             for op, i, k, j, l in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes() if op != 'equal']
    return {'path': path, 'beforeHash': digest(before), 'afterHash': digest(after), 'edits': edits}


def reverse_file(record, source):
    require(digest(source) == record['afterHash'], 'Unknown revision source: ' + record['path'])
    lines = source.splitlines(keepends=True)
    previous = len(lines) + 1
    for edit in reversed(record['edits']):
        start, after = edit['line'], edit['after']
        require(type(start) is int and 0 <= start < previous and start + len(after) <= len(lines), 'Invalid patch position')
        require(lines[start:start + len(after)] == after, 'Revision fragment mismatch')
        lines[start:start + len(after)] = edit['before']
        previous = start
    original = ''.join(lines)
    require(digest(original) == record['beforeHash'], 'Invalid inverse hash')
    return original


def forward_file(record, source):
    require(digest(source) == record['beforeHash'], 'Revision base differs from Git')
    lines = source.splitlines(keepends=True)
    for edit in record['edits']:
        start = edit['line']
        # After-line coordinates already account for earlier applied edits.
        require(type(start) is int and 0 <= start <= len(lines), 'Invalid patch position')
        require(lines[start:start + len(edit['before'])] == edit['before'], 'Invalid forward fragment')
        lines[start:start + len(edit['before'])] = edit['after']
    result = ''.join(lines)
    require(digest(result) == record['afterHash'], 'Invalid after hash')
    require(reverse_file(record, result) == source, 'Inverse is not exact')
    return result


def verify_revision(repo, revision, profile):
    require(set(revision) == {'base', 'profile', 'semanticReview', 'files'}, 'Invalid revision fields')
    base = revision['base']
    require(SHA.fullmatch(base or '') and repo.valid_commit(base), 'Unavailable revision base')
    require(revision['profile'] == profile['id'], 'Unknown profile')
    require(isinstance(revision['semanticReview'], str) and 20 <= len(revision['semanticReview'].strip()) <= 2000,
            'Missing semantic review')
    files = revision['files']
    for file in files:
        require(set(file) == {'path', 'beforeHash', 'afterHash', 'edits'}, 'Unknown inverse fields')
        require(file['edits'] and all(set(e) == {'line', 'before', 'after'} for e in file['edits']), 'Invalid inverse edits')
    require(len(files) == len({f['path'] for f in files}), 'Duplicate revision path')
    require({f['path'] for f in files} <= {profile['source'], DATABASE, MARKDOWN} and
            profile['source'] in {f['path'] for f in files}, 'Unapproved historical inverse')
    outputs = {f['path']: forward_file(f, repo.read(base, f['path'])) for f in files}
    source_before = load(repo, base, profile['source'])
    source_after = strict_json(outputs[profile['source']])
    expected = copy.deepcopy(source_before)
    indices = [i for i, row in enumerate(expected['entries']) if row['id'] == profile['item']]
    require(len(indices) == 1 and len(source_after['entries']) == len(expected['entries']), 'Changed catalog membership')
    index = indices[0]
    before, after = expected['entries'][index], source_after['entries'][index]
    pairs = text_pairs(before, after, profile)
    expected['entries'][index] = after
    require(expected == source_after, 'Non-target catalog changes')
    before_generated = generated(repo, base)
    after_generated = generated(repo, base, {profile['source']: outputs[profile['source']]})
    database = strict_json(after_generated[DATABASE])
    normalize = lambda value: ' '.join(value.lower().split())
    target_text = {normalize(before['en']), normalize(after['en'])}
    for section in database.values():
        for rows in section.values():
            for row in rows:
                if row.get('stableId') == profile['item']:
                    continue
                candidates = [row['en'], *row.get('legacyPromptAliases', []), *row.get('meta', {}).get('legacyPromptAliases', [])]
                require(not target_text.intersection(normalize(t) for t in candidates), 'Old/new English collides with another catalog item')
    for path, text in before_generated.items():
        require(repo.read(base, path) == text, 'Base generated output is stale: ' + path)
    changed_outputs = {p: text for p, text in after_generated.items() if text != before_generated[p]}
    require({p: text for p, text in outputs.items() if p != profile['source']} == changed_outputs,
            'Generated files differ from formal catalog projection')
    return {'profile': profile, 'before': before, 'after': after, 'pairs': pairs, 'sources': outputs}


def classify(repo, base, head, documents):
    """The policy and all executable files must already exist unchanged at base."""
    policy = load(repo, base, POLICY)
    require(policy == load(repo, head, POLICY) and policy['version'] == 1, 'Changed copy policy')
    previous, current = load(repo, base, LEDGER), load(repo, head, LEDGER)
    require(set(current) == {'version', 'revisions'} and previous['version'] == current['version'] == 1, 'Invalid ledger')
    old, new = previous['revisions'], current['revisions']
    require(len(new) > len(old) and new[:len(old)] == old, 'Revisions must be append-only')
    expected, reviews = {}, []
    profiles = {p['id']: p for p in policy['profiles']}
    for revision in new[len(old):]:
        require(repo.ancestor(base, revision['base']) and repo.ancestor(revision['base'], head), 'Revision is outside comparison ancestry')
        require(revision['profile'] in profiles, 'Unreviewed profile')
        review = verify_revision(repo, revision, profiles[revision['profile']])
        for file in revision['files']:
            path = file['path']
            require(digest(expected.get(path, repo.read(base, path))) == file['beforeHash'], 'Broken cumulative revision chain')
        expected.update(review['sources'])
        reviews.append(review)
    allowed = set(expected) | {LEDGER}
    for change in repo.changes(base, head):
        path = change['path']
        require(change['after'] is not None and change['after'][:2] == ('100644', 'blob'), 'Removed/nonregular file')
        if path in documents:
            continue
        require(path in allowed and change['before'] is not None and change['before'][:2] == ('100644', 'blob'),
                'Unknown or mixed changes: ' + path)
    for path, source in expected.items():
        require(repo.read(head, path) == source, 'Unrecorded source difference: ' + path)
    return reviews
