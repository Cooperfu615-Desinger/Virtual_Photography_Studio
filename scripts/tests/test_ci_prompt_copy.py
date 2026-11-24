import copy
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from scripts import ci_docs as ci
from scripts import ci_prompt_copy as cc
from scripts.validate_prompt_copy import compare

ROOT = Path(__file__).resolve().parents[2]


class CopyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.git('init', '-q', '-b', 'main')
        self.git('config', 'user.name', 'Copy fixture')
        self.git('config', 'user.email', 'fixture@example.invalid')
        self.git('config', 'gc.auto', '0')
        self.git('config', 'maintenance.auto', 'false')
        self.git('config', 'core.fsmonitor', 'false')
        self.profile = json.loads((ROOT / cc.POLICY).read_text())['profiles'][0]
        self.path = self.profile['source']
        self.item = {'id': self.profile['item'], 'zh': '直筒牛仔褲', 'en': 'straight-leg jeans, clean denim texture',
                     'desc': '基本版型。', 'legacyIds': ['legacy-jeans'], 'meta': {'semantic': {'family': 'neutral', 'tags': ['pants']}}}
        self.write(self.path, {'section': 'Wardrobe', 'category': self.profile['category'], 'entries': [self.item]})
        self.write(cc.POLICY, {'version': 1, 'profiles': [self.profile]})
        self.write(cc.LEDGER, {'version': 1, 'revisions': []})
        self.policy = {'version': 1, 'documents': ['README.md']}
        self.write(ci.POLICY_PATH, self.policy)
        self.write('README.md', '# Fixture\n')
        self.write('knowledge_base/catalog/index.json', {'sections': [{'name': 'Wardrobe', 'categories': [
            {'name': self.profile['category'], 'path': 'Wardrobe/褲裝-pants.json'}]}],
            'markdown': [{'file': 'wardrobe_and_styling.md', 'lines': ['# Wardrobe\n', {
                'id': self.item['id'], 'cells': ['', '', ''], 'columns': {'0': 'zh', '1': 'en', '2': 'desc'},
                'affixes': {'0': ['', ''], '1': ['`', '`'], '2': ['', '']}}]}]})
        self.write('knowledge_base/wardrobe_reference_manifest.json', {'categories': {}})
        self.write('knowledge_base/catalog/legacy_mappings.json', {})
        self.repo = ci.Repository(self.root)
        seed = self.commit()
        for path, source in cc.generated(self.repo, seed).items():
            self.write(path, source)
        self.base = self.commit()

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.root), *args], stderr=subprocess.PIPE).decode().strip()

    def write(self, path, value):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(value if isinstance(value, str) else json.dumps(value, ensure_ascii=False, indent=2) + '\n')

    def commit(self):
        # Disposable fixture repo only, never the user's index.
        self.git('add', '.')
        self.git('commit', '-qm', 'fixture')
        return self.git('rev-parse', 'HEAD')

    def revision(self, mutate=None, base=None):
        base = base or self.base
        category = cc.load(self.repo, base, self.path)
        before = copy.deepcopy(category['entries'][0])
        row = category['entries'][0]
        row['en'] = row['en'].replace('clean', 'subtle') if 'clean' in row['en'] else row['en'].replace('subtle', 'soft')
        row.setdefault('legacyPromptAliases', []).append(before['en'])
        if mutate:
            mutate(category, row)
        source = json.dumps(category, ensure_ascii=False, indent=2) + '\n'
        values = {self.path: source, **cc.generated(self.repo, base, {self.path: source})}
        files = [cc.make_file_record(path, self.repo.read(base, path), value) for path, value in values.items()
                 if self.repo.read(base, path) != value]
        record = {'base': base, 'profile': self.profile['id'], 'semanticReview': 'Texture wording only; family and all effective semantic values remain unchanged.', 'files': files}
        ledger = cc.load(self.repo, base, cc.LEDGER)
        ledger['revisions'].append(record)
        for path, value in values.items():
            self.write(path, value)
        self.write(cc.LEDGER, ledger)
        return record

    def classified(self, head):
        return cc.classify(self.repo, self.base, head, self.policy['documents'])

    def test_copy_route_with_full_deployment_and_generated_proof(self):
        self.revision()
        head = self.commit()
        self.assertEqual(len(self.classified(head)), 1)
        result = ci.make_plan(self.repo, self.policy, 'push', self.base, head, {'sha': self.base})
        self.assertEqual(result['mode'], 'copy')
        self.assertTrue(result['deploy'])
        self.assertEqual(result['copy_base'], self.base)
        self.assertEqual(ci.make_plan(self.repo, self.policy, 'push', self.base, head)['mode'], 'full')
        self.assertEqual(ci.make_plan(self.repo, self.policy, 'workflow_dispatch', self.base, head, {'sha': self.base})['mode'], 'full')

    def test_alias_exception_is_exact_and_ordered(self):
        before = copy.deepcopy(self.item)
        before['legacyPromptAliases'] = ['first', 'second']
        after = copy.deepcopy(before)
        after['en'] = after['en'].replace('clean', 'soft')
        for aliases in [[], ['first', 'second'], ['second', 'first', before['en']],
                        ['first', 'second', 'clean denim texture'], ['first', 'second', before['en'], 'arbitrary']]:
            with self.subTest(aliases=aliases):
                after['legacyPromptAliases'] = aliases
                with self.assertRaises(cc.CopyIneligible):
                    cc.text_pairs(before, after, self.profile)
        after['legacyPromptAliases'] = ['first', 'second', before['en']]
        cc.text_pairs(before, after, self.profile)

    def test_semantics_and_membership_escalate(self):
        for mutation in [lambda c, r: r['meta']['semantic'].update(family='formal'),
                         lambda c, r: r.update(zh='new label'),
                         lambda c, r: c['entries'].append({**r, 'id': 'added', 'zh': 'added'}),
                         lambda c, r: r.update(en='wide-leg jeans, subtle denim texture')]:
            with self.subTest(mutation=mutation):
                record = self.revision(mutation)
                with self.assertRaises(cc.CopyIneligible):
                    cc.verify_revision(self.repo, record, self.profile)
        changed = {**self.item, 'id': 'new-id'}
        with self.assertRaises(cc.CopyIneligible):
            cc.text_pairs(self.item, changed, self.profile)

    def test_generated_tampering_is_not_whitelisted(self):
        self.revision()
        self.write(cc.DATABASE, (self.root / cc.DATABASE).read_text() + ' ')
        with self.assertRaises(cc.CopyIneligible):
            self.classified(self.commit())

    def test_unrecorded_mixed_code_and_policy_changes_escalate(self):
        self.revision()
        self.write('webapp/src/renderer.js', 'changed code\n')
        head = self.commit()
        self.assertEqual(ci.make_plan(self.repo, self.policy, 'push', self.base, head, {'sha': self.base})['mode'], 'full')
        self.write(cc.POLICY, {'version': 1, 'profiles': []})
        with self.assertRaises(cc.CopyIneligible):
            self.classified(self.commit())

    def test_missing_revision_and_unknown_hash_rejected(self):
        record = self.revision()
        record['files'][0]['afterHash'] = '0' * 64
        with self.assertRaises(cc.CopyIneligible):
            cc.verify_revision(self.repo, record, self.profile)
        self.write(cc.LEDGER, {'version': 1, 'revisions': []})
        with self.assertRaises(cc.CopyIneligible):
            self.classified(self.commit())

    def test_cumulative_copy_chain_and_later_document(self):
        self.revision()
        first = self.commit()
        self.revision(base=first)
        second = self.commit()
        self.assertEqual(len(self.classified(second)), 2)
        evidence = {'sha': first, 'mode': 'copy', 'full_base': self.base}
        self.assertEqual(ci.make_plan(self.repo, self.policy, 'push', first, second, evidence)['mode'], 'copy')
        self.write('README.md', '# Later docs\n')
        docs = self.commit()
        self.assertEqual(ci.make_plan(self.repo, self.policy, 'push', second, docs, {'sha': second, 'mode': 'copy', 'full_base': self.base})['mode'], 'docs')
        self.assertEqual(ci.make_plan(self.repo, self.policy, 'push', second, docs, evidence)['mode'], 'full')

    def test_existing_ledger_entries_cannot_be_rewritten(self):
        self.revision()
        first = self.commit()
        self.revision(base=first)
        ledger = json.loads((self.root / cc.LEDGER).read_text())
        ledger['revisions'][0]['semanticReview'] = 'tampered previous review'
        self.write(cc.LEDGER, ledger)
        head = self.commit()
        with self.assertRaises(cc.CopyIneligible):
            cc.classify(self.repo, first, head, self.policy['documents'])

    def test_cumulative_document_checks_cannot_be_hidden_by_later_copy(self):
        self.write('README.md', '# Invalid old document  \n')
        docs = self.commit()
        self.revision(base=docs)
        head = self.commit()
        with self.assertRaises(ci.ValidationError):
            ci.make_plan(self.repo, self.policy, 'push', docs, head, {'sha': self.base})

    def test_duplicate_json_keys_rejected(self):
        with self.assertRaises(cc.CopyIneligible):
            cc.strict_json('{"version":1,"version":1}')

    def test_copy_cannot_collide_with_another_existing_item(self):
        category = cc.load(self.repo, self.base, self.path)
        category['entries'].append({**self.item, 'id': 'other-jeans', 'zh': '其他牛仔褲',
            'en': self.item['en'].replace('clean', 'subtle')})
        source = json.dumps(category, ensure_ascii=False, indent=2) + '\n'
        for path, value in {self.path: source, **cc.generated(self.repo, self.base, {self.path: source})}.items():
            self.write(path, value)
        self.base = self.commit()
        record = self.revision()
        with self.assertRaisesRegex(cc.CopyIneligible, 'collides'):
            cc.verify_revision(self.repo, record, self.profile)

    def test_results_never_accept_missing_scoped_gates(self):
        needs = {'scope': {'result': 'success', 'outputs': {'mode': 'copy'}},
                 **{name: {'result': 'success'} for name in ci.REQUIRED_PRODUCT_STEPS}}
        self.assertTrue(ci.result_ok(needs, 'push'))
        for name in ci.REQUIRED_PRODUCT_STEPS:
            for status in ['skipped', 'failure', 'cancelled']:
                bad = copy.deepcopy(needs)
                bad[name]['result'] = status
                self.assertFalse(ci.result_ok(bad, 'push'))
        self.assertFalse(ci.result_ok(needs, 'workflow_dispatch'))

    def test_copy_deployment_requires_successful_scoped_steps_and_full_ancestor(self):
        self.revision()
        head = self.commit()
        def job(name, steps):
            return {'name': name, 'status': 'completed', 'conclusion': 'success',
                    'steps': [{'name': s, 'conclusion': 'success'} for s in steps]}
        full = [job(n, s) for n, s in ci.REQUIRED_PRODUCT_STEPS.items()]
        scoped = copy.deepcopy(full)
        scoped[0] = job('webapp-quality', ['Test scoped Prompt copy', 'Lint', 'Test data sync validation',
            'Validate generated database', 'Validate catalog integrity', 'Test catalog preparation tools',
            'Verify formal catalog history and all generated outputs'])
        scoped += [job('scope', ['Test CI routing', 'Classify changes and validate documentation']),
                   job('ci-result', ['Summarize required results'])]
        run = {'head_sha': head, 'head_branch': 'main', 'event': 'push', 'path': '.github/workflows/deploy.yml',
               'status': 'completed', 'conclusion': 'success', 'id': 10}
        data = {
            'repos/owner/project/deployments?environment=github-pages&per_page=1': [{'id': 20, 'sha': head, 'environment': 'github-pages'}],
            'repos/owner/project/deployments/20/statuses?per_page=1': [{'state': 'success', 'log_url': 'https://github.com/owner/project/actions/runs/10'}],
            'repos/owner/project/actions/runs/10': run,
            'repos/owner/project/actions/runs/10/jobs?filter=latest&per_page=100': {'total_count': len(scoped), 'jobs': scoped},
            'repos/owner/project/actions/workflows/deploy.yml/runs?branch=main&status=success&per_page=30':
                {'workflow_runs': [{**run, 'head_sha': self.base, 'id': 9}]},
            'repos/owner/project/actions/runs/9/jobs?filter=latest&per_page=100': {'total_count': len(full), 'jobs': full},
        }
        proof = lambda: ci.deployment_evidence('owner/project', data.__getitem__, self.repo, self.policy)
        self.assertEqual(proof()['mode'], 'copy')
        self.assertEqual(proof()['full_base'], self.base)
        for status in ['skipped', 'failure', 'cancelled']:
            scoped[0]['steps'][0]['conclusion'] = status
            self.assertIsNone(proof())
        scoped[0]['steps'][0]['conclusion'] = 'success'
        full[0]['steps'][0]['conclusion'] = 'skipped'
        self.assertIsNone(proof())
        full[0]['steps'][0]['conclusion'] = 'success'
        data['repos/owner/project/deployments/20/statuses?per_page=1'][0]['state'] = 'pending'
        self.assertIsNone(proof())

    def test_output_comparison_rejects_rng_selection_and_sibling_drift(self):
        before = [{'id': 'target', 'prompt': {'structured': [self.item], 'grokPrompt': self.item['en']}, 'calls': 2},
                  {'id': 'sibling', 'prompt': {'structured': []}, 'calls': 2}]
        updated = copy.deepcopy(self.item)
        updated['en'] = updated['en'].replace('clean', 'soft')
        updated['legacyPromptAliases'] = [self.item['en']]
        review = {'profile': self.profile, 'before': self.item, 'after': updated}
        after = copy.deepcopy(before)
        after[0]['prompt'].update(structured=[updated], grokPrompt=updated['en'])
        self.assertEqual(compare(before, after, [review])['changed'], 1)
        for index, field, value in [(0, 'calls', 3), (0, 'selection', 'different'), (1, 'calls', 3)]:
            bad = copy.deepcopy(after)
            bad[index][field] = value
            with self.assertRaises(cc.CopyIneligible):
                compare(before, bad, [review])


if __name__ == '__main__':
    unittest.main()
