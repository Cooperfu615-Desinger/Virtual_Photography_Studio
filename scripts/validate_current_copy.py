"""Check reviewed copy against its exact inverse using the CURRENT runtime on both sides.

Historical tests retain their original assertions. This companion check ensures
their inverse cannot hide regressions in today's public text, selections or RNG.
No commits, index, working files or historical seals are written.
"""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time

if __package__ in (None, ''):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.ci_docs import Repository
from scripts.ci_prompt_copy import LEDGER, POLICY, load, require, reverse_file, verify_revision
from scripts.validate_prompt_copy import compare, extract_snapshot

ROOT = Path(__file__).resolve().parents[1]


def current_reviews(repo, head):
    ledger = load(repo, head, LEDGER)
    require(set(ledger) == {'version', 'revisions'} and ledger['version'] == 1,
            'Invalid current copy ledger')
    policy = load(repo, head, POLICY)
    require(policy['version'] == 1, 'Unknown copy policy')
    profiles = {p['id']: p for p in policy['profiles']}
    reviews, originals = [], {}
    previous = []
    for revision in ledger['revisions']:
        base = revision['base']
        require(base != head and repo.ancestor(base, head), 'Revision base is not a strict ancestor')
        require(load(repo, base, LEDGER)['revisions'] == previous, 'Broken append-only revision ancestry')
        profile = profiles[revision['profile']]
        require(profile in load(repo, base, POLICY)['profiles'], 'Unreviewed current profile')
        reviews.append(verify_revision(repo, revision, profile))
        previous.append(revision)
    require(len({r['profile']['item'] for r in reviews}) <= 1,
            'Current probe supports only the reviewed single-item pilot')
    for revision in reversed(ledger['revisions']):
        for record in revision['files']:
            path = record['path']
            originals[path] = reverse_file(record, originals.get(path, repo.read(head, path)))
            require(originals[path] == repo.read(revision['base'], path), 'Inverse differs from committed base')
    return reviews, originals


def run(repo, head):
    started = time.monotonic()
    reviews, originals = current_reviews(repo, head)
    if not reviews:
        result = {'revisions': 0, 'cases': 0, 'reason': 'no_copy_revisions'}
    else:
        node = os.environ.get('COPY_NODE', 'node')
        with tempfile.TemporaryDirectory(prefix='vps-current-copy-') as temp:
            temp = Path(temp)
            review_file = temp / 'reviews.json'
            review_file.write_text(json.dumps(reviews, ensure_ascii=False))
            results = []
            for phase in ('before', 'after'):
                directory = extract_snapshot(repo, head, temp / phase)
                if phase == 'before':
                    for path, source in originals.items():
                        (directory / path).write_text(source)
                output = temp / (phase + '.json')
                print('[current-copy] ' + phase + ' using current runtime ' + head, flush=True)
                command = [node, str(ROOT / 'scripts/prompt_copy_probe.mjs'), str(directory),
                           str(review_file), str(output), phase]
                if phase == 'after':
                    command.append(str(temp / 'before.json'))
                subprocess.run(command, check=True)
                results.append(json.loads(output.read_text()))
            result = {**compare(*results, reviews), 'revisions': len(reviews)}
    result['seconds'] = round(time.monotonic() - started, 3)
    print('[current-copy] PASS ' + json.dumps(result), flush=True)
    return result


if __name__ == '__main__':
    repository = Repository(ROOT)
    candidate = repository.git('rev-parse', 'HEAD').decode().strip()
    require(candidate == os.environ.get('GITHUB_SHA', candidate), 'Checkout does not match candidate')
    run(repository, candidate)
