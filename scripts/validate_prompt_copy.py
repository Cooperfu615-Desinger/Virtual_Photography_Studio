"""Verify scoped copy against isolated committed snapshots, then run focused contracts."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import time

if __package__ in (None, ''):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.ci_docs import Repository, load_policy
from scripts.ci_prompt_copy import classify, require

ROOT = Path(__file__).resolve().parents[1]
FOCUSED = [
    'src/lib/enginePromptPipeline.test.js',
    'src/lib/engine/bodyTypeCatalog.test.js',
    'src/lib/engine/promptOutputContracts.test.js',
    'src/lib/engine/framingWardrobeRetention.test.js',
    'src/lib/engine/denimOveralls.test.js',
    'src/lib/page1PromptOutputs.test.js',
    'src/lib/promptAppendices.test.js',
    'src/features/saved-cards/cardCodec.test.js',
]


def extract_snapshot(repo, ref, directory):
    directory.mkdir()
    # These contracts do not read image archives; avoid unpacking historical media.
    archive = subprocess.Popen(['git', '-C', str(repo.root), 'archive', ref, 'webapp/src',
        'webapp/package.json', 'webapp/package-lock.json', 'scripts', 'knowledge_base'], stdout=subprocess.PIPE)
    with tarfile.open(fileobj=archive.stdout, mode='r|') as tar:
        # Git repository content is untrusted: do not materialize archive links.
        for member in tar:
            path = Path(member.name)
            require(not path.is_absolute() and '..' not in path.parts, 'Unsafe archive path')
            if member.isdir() or member.isfile():
                tar.extract(member, directory)
    require(archive.wait() == 0, 'Cannot read Git snapshot')
    (directory / 'webapp/node_modules').symlink_to(repo.root / 'webapp/node_modules', target_is_directory=True)
    # Historical tests read Git objects without an index or working-tree mutation.
    return directory


def owns_item(value, item):
    identifier = value.get('id', value.get('stableId'))
    if identifier == item:
        return True
    meta = value.get('meta', {})
    role = meta.get('wardrobeRole')
    return role in ['a', 'b'] and meta.get('layerSlot') == 'pants' and identifier == item + ':' + role


def normalize(value, reviews):
    """Allow only recorded source fields, exact old tail aliases and comma clauses.

    Everything else (including selections, metadata, RNG and absent source) is exact.
    """
    if isinstance(value, list):
        return [normalize(v, reviews) for v in value]
    if isinstance(value, dict):
        value = dict(value)
        for review in reversed(reviews):
            if not owns_item(value, review['profile']['item']):
                continue
            for field in ['en', 'desc']:
                if value.get(field) == review['after'][field]:
                    value[field] = review['before'][field]
            if 'legacyPromptAliases' in value and value['legacyPromptAliases'] == review['after'].get('legacyPromptAliases'):
                if 'legacyPromptAliases' in review['before']:
                    value['legacyPromptAliases'] = review['before']['legacyPromptAliases']
                else:
                    value.pop('legacyPromptAliases')
            if 'meta' in value and value['meta'].get('legacyPromptAliases') == review['after'].get('legacyPromptAliases'):
                value['meta'] = dict(value['meta'])
                aliases = review['before'].get('legacyPromptAliases')
                if aliases is None:
                    value['meta'].pop('legacyPromptAliases', None)
                else:
                    value['meta']['legacyPromptAliases'] = aliases
        return {k: normalize(v, reviews) for k, v in value.items()}
    if isinstance(value, str):
        for review in reversed(reviews):
            for before, after in zip(review['before']['en'].split(', '), review['after']['en'].split(', ')):
                if before != after:
                    value = value.replace(after, before)
        return value
    return value


def first_difference(a, b, path=''):
    if type(a) is not type(b):
        return path + ': type'
    if isinstance(a, dict):
        if a.keys() != b.keys():
            return path + ': keys ' + str(a.keys() ^ b.keys())
        for key in a:
            diff = first_difference(a[key], b[key], path + '.' + key)
            if diff:
                return diff
    elif isinstance(a, list):
        if len(a) != len(b):
            return path + ': length'
        for i, (x, y) in enumerate(zip(a, b)):
            diff = first_difference(x, y, path + '[' + str(i) + ']')
            if diff:
                return diff
    elif a != b:
        return path + ': ' + repr(a)[:200] + ' != ' + repr(b)[:200]
    return None


def compare(before, after, reviews):
    require(len(before) == len(after) and len(before) > 0, 'Missing probe cases')
    changed, unchanged = 0, 0
    for old, new in zip(before, after):
        require(old['id'] == new['id'], 'Changed fixture ordering')
        for key in ['calls', 'nextRandom', 'restoreLocks', 'sourceRestoreLocks']:
            require(old.get(key) == new.get(key), 'Changed deterministic state: ' + key)
        require(old['prompt'].get('selection') == new['prompt'].get('selection'), 'Changed selection')
        # A text allowance is possible only where the resolved structured source owns the item.
        ids = {r['profile']['item'] for r in reviews}
        def owns(value):
            if isinstance(value, dict):
                return any(owns_item(value, item) for item in ids) or any(owns(v) for v in value.values())
            return isinstance(value, list) and any(owns(v) for v in value)
        eligible = owns(old['prompt']['structured']) or any(
            old['prompt'].get('selection', {}).get(key) in ids for key in ['pantsId', 'pantsAId', 'pantsBId'])
        result = normalize(new, reviews) if eligible else new
        difference = first_difference(old, result)
        require(not difference, old['id'] + ' unapproved difference: ' + str(difference))
        changed += old != new
        unchanged += old == new
    require(unchanged > 0, 'No unaffected controls')
    if any(r['before']['en'] != r['after']['en'] for r in reviews):
        require(changed > 0, 'English copy never reached outputs')
    return {'cases': len(before), 'changed': changed, 'unchanged': unchanged}


def run(repo, base, head, focused=True):
    started = time.monotonic()
    reviews = classify(repo, base, head, load_policy(repo, head)['documents'])
    node = os.environ.get('COPY_NODE', 'node')
    with tempfile.TemporaryDirectory(prefix='vps-copy-check-') as temp:
        temp = Path(temp)
        review_path = temp / 'reviews.json'
        review_path.write_text(json.dumps(reviews, ensure_ascii=False))
        results = []
        directories = []
        for phase, ref in [('before', base), ('after', head)]:
            print('[copy] preparing ' + phase + ' ' + ref, flush=True)
            directory = extract_snapshot(repo, ref, temp / phase)
            directories.append(directory)
            output = temp / (phase + '.json')
            command = [node, str(ROOT / 'scripts/prompt_copy_probe.mjs'), str(directory), str(review_path), str(output), phase]
            if phase == 'after':
                command.append(str(temp / 'before.json'))
            subprocess.run(command, check=True)
            results.append(json.loads(output.read_text()))
        report = compare(*results, reviews)
        print('[copy] all-output/selection/RNG/restore comparison: ' + json.dumps(report), flush=True)
        if focused:
            env = {**os.environ, 'CI': 'true', 'GIT_DIR': repo.git('rev-parse', '--absolute-git-dir').decode().strip()}
            subprocess.run([node, '--test', *FOCUSED], cwd=directories[1] / 'webapp', env=env, check=True)
        report['seconds'] = round(time.monotonic() - started, 3)
        print('[copy] PASS ' + json.dumps(report), flush=True)
        return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', required=True)
    parser.add_argument('--head', required=True)
    args = parser.parse_args()
    run(Repository(ROOT), args.base, args.head)
