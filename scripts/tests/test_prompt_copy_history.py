import json
import os
from pathlib import Path
import unittest
from scripts.ci_docs import Repository
from scripts.ci_prompt_copy import LEDGER, POLICY, strict_json, verify_revision, reverse_file, make_file_record

ROOT = Path(__file__).resolve().parents[2]


class HistoryTests(unittest.TestCase):
    def test_recorded_copy_history_is_valid_and_append_only(self):
        repo = Repository(ROOT)
        current = strict_json((ROOT / LEDGER).read_text())
        self.assertEqual(set(current), {'version', 'revisions'})
        self.assertEqual(current['version'], 1)
        base = os.environ.get('REGISTRY_BASE_COMMIT') or repo.git('rev-parse', 'HEAD').decode().strip()
        self.assertTrue(repo.valid_commit(base))
        if LEDGER in repo.tree(base):
            previous = strict_json(repo.read(base, LEDGER))['revisions']
            self.assertEqual(current['revisions'][:len(previous)], previous)
        profiles = {p['id']: p for p in strict_json((ROOT / POLICY).read_text())['profiles']}
        for revision in current['revisions']:
            verify_revision(repo, revision, profiles[revision['profile']])

    def test_infrastructure_preserves_the_original_test_source(self):
        repo = Repository(ROOT)
        manifest = json.loads((ROOT / 'scripts/lib/ciPromptCopyInfrastructureHistory.json').read_text())
        self.assertEqual(manifest['base'], '782a4516dcb813c55e35c8e76f99d6a640a09122')
        for record in manifest['files']:
            self.assertEqual(reverse_file(record, (ROOT / record['path']).read_text()), repo.read(manifest['base'], record['path']))

    def test_exact_inverse_rejects_unknown_bytes_and_round_trips_multiple_edits(self):
        before, after = 'one\ntwo\nthree\nfour\n', 'one\nnew two\nthree\nfour\nappended\n'
        record = make_file_record('fixture', before, after)
        self.assertEqual(reverse_file(record, after), before)
        with self.assertRaises(ValueError):
            reverse_file(record, after + 'unknown\n')


if __name__ == '__main__':
    unittest.main()
