import copy
import json
import unittest

from scripts import ci_prompt_copy as cc
from scripts import validate_current_copy as current
from scripts.tests import test_ci_prompt_copy as fixtures


class CurrentCopyTests(unittest.TestCase):
    def setUp(self):
        self.f = fixtures.CopyTests('test_copy_route_with_full_deployment_and_generated_proof')
        self.f.setUp()
        self.addCleanup(self.f.doCleanups)

    def test_empty_ledger_has_no_probe_work(self):
        self.assertEqual(current.current_reviews(self.f.repo, self.f.base), ([], {}))

    def test_exact_inverse_after_unrelated_runtime_change(self):
        self.f.revision()
        self.f.commit()
        self.f.write('runtime.js', 'export const updated = true;\n')
        head = self.f.commit()
        reviews, originals = current.current_reviews(self.f.repo, head)
        self.assertEqual(len(reviews), 1)
        self.assertNotIn('runtime.js', originals)
        self.assertEqual(originals[self.f.path], self.f.repo.read(self.f.base, self.f.path))
        self.assertEqual(originals[cc.DATABASE], self.f.repo.read(self.f.base, cc.DATABASE))

    def test_two_revisions_restore_original_source_in_order(self):
        self.f.revision()
        middle = self.f.commit()
        self.f.revision(base=middle)
        reviews, originals = current.current_reviews(self.f.repo, self.f.commit())
        self.assertEqual(len(reviews), 2)
        self.assertEqual(originals[self.f.path], self.f.repo.read(self.f.base, self.f.path))

    def test_unrecorded_current_source_and_generated_output_fail(self):
        self.f.revision()
        head = self.f.commit()
        for path in (self.f.path, cc.DATABASE):
            self.f.git('reset', '--hard', head)
            self.f.write(path, self.f.repo.read(head, path) + ' ')
            with self.assertRaises(cc.CopyIneligible):
                current.current_reviews(self.f.repo, self.f.commit())

    def test_invented_missing_or_nonancestor_revision_base_fails(self):
        self.f.revision()
        head = self.f.commit()
        ledger = cc.load(self.f.repo, head, cc.LEDGER)
        for base in ('0' * 40, head, 'f' * 40):
            broken = copy.deepcopy(ledger)
            broken['revisions'][0]['base'] = base
            self.f.write(cc.LEDGER, broken)
            with self.assertRaises(cc.CopyIneligible):
                current.current_reviews(self.f.repo, self.f.commit())

    def test_removed_prior_revision_is_not_accepted(self):
        self.f.revision()
        middle = self.f.commit()
        second = self.f.revision(base=middle)
        self.f.write(cc.LEDGER, {'version': 1, 'revisions': [second]})
        with self.assertRaises(cc.CopyIneligible):
            current.current_reviews(self.f.repo, self.f.commit())

    def test_unknown_ledger_fields_are_not_accepted(self):
        self.f.write(cc.LEDGER, {'version': 1, 'revisions': [], 'skip': True})
        with self.assertRaises(cc.CopyIneligible):
            current.current_reviews(self.f.repo, self.f.commit())


if __name__ == '__main__':
    unittest.main()
