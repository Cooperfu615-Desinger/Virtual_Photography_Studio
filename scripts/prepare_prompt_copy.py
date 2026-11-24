"""Print an append-only copy revision ledger after a reviewed catalog edit and sync.

Writes stdout only. The caller reviews the result before saving it as the ledger.
"""
import argparse
import json
from pathlib import Path
import sys

if __package__ in (None, ''):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.ci_docs import Repository
from scripts.ci_prompt_copy import POLICY, LEDGER, DATABASE, MARKDOWN, load, make_file_record, verify_revision, require

ROOT = Path(__file__).resolve().parents[1]


def prepare(repo, base, profile_id, semantic_review):
    policy = load(repo, base, POLICY)
    require((repo.root / POLICY).read_text() == repo.read(base, POLICY), 'Policy must be reviewed separately')
    profile = next(p for p in policy['profiles'] if p['id'] == profile_id)
    files = []
    for path in [profile['source'], DATABASE, MARKDOWN]:
        before, after = repo.read(base, path), (repo.root / path).read_text()
        if before != after:
            files.append(make_file_record(path, before, after))
    record = {'base': base, 'profile': profile_id, 'semanticReview': semantic_review, 'files': files}
    verify_revision(repo, record, profile)
    ledger = load(repo, base, LEDGER)
    require((repo.root / LEDGER).read_text() == repo.read(base, LEDGER), 'Ledger already differs; do not overwrite parallel revisions')
    ledger['revisions'].append(record)
    return ledger


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', required=True)
    parser.add_argument('--profile', default='straight-leg-jeans-v1')
    parser.add_argument('--semantic-review', required=True)
    args = parser.parse_args()
    print(json.dumps(prepare(Repository(ROOT), args.base, args.profile, args.semantic_review), ensure_ascii=False, indent=2))
