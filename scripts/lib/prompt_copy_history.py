"""Exact source-aware projection for the unchanged C2 historical report oracle."""
import copy
from functools import lru_cache
from pathlib import Path
from scripts.ci_docs import Repository
from scripts.ci_prompt_copy import LEDGER, POLICY, strict_json, verify_revision, digest, require
from scripts import check_authoring_lengths as diagnostic


@lru_cache(maxsize=8)
def reviewed_rows(root, ledger_text):
    repo = Repository(root)
    policy = strict_json((Path(root) / POLICY).read_text())
    profiles = {p['id']: p for p in policy['profiles']}
    return [verify_revision(repo, r, profiles[r['profile']]) for r in strict_json(ledger_text)['revisions']]


def pre_copy_report(report, root):
    path = Path(root) / LEDGER
    if not path.exists():
        return report
    reviews = reviewed_rows(str(root), path.read_text())
    if not reviews:
        return report
    result = copy.deepcopy(report)
    for review in reversed(reviews):
        for row in result['rows']:
            if row['id'] != review['profile']['item']:
                continue
            before, after = review['before']['en'], review['after']['en']
            require(row['sourceSha256'] in [digest(before), digest(after)], 'Unknown historical copy report')
            if row['sourceSha256'] == digest(before):
                continue
            require(row['words'] == diagnostic.word_count(after), 'Copy report word count drift')
            result['summary'][row['status']] -= 1
            words = diagnostic.word_count(before)
            bounds = row.get('range')
            status = ('under' if words < bounds[0] else 'over' if words > bounds[1] else 'within') if bounds else 'unclassified'
            row.update(sourceSha256=digest(before), words=words, status=status)
            result['summary'][status] += 1
    return result
