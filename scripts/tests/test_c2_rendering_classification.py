import copy
import hashlib
import json
import subprocess
import unittest
from scripts import check_authoring_lengths as c
from scripts.lib.c2_rendering_history import historical_policy_context

BASE = '2fa8fe65226903141597ab74b044a0102a6f8ca7'
CATEGORY = 'CameraLighting/底片與相機模擬 (Camera & Film Simulation)'


class RenderingClassificationTests(unittest.TestCase):
    def test_only_one_rule_and_all_38_exceptions_unchanged(self):
        old = json.loads(subprocess.check_output(['git','show',BASE+':scripts/lib/authoringLengthPolicy.json'],cwd=c.ROOT))
        now = json.loads((c.ROOT/'scripts/lib/authoringLengthPolicy.json').read_text())
        self.assertEqual(now['rules'].pop(CATEGORY),{'min':10,'max':24,'spec':'Docs/specs/photography-section-d-authoring-guide.md'})
        self.assertEqual(now,old)

    def test_exact_25_row_delta_and_no_source_writes(self):
        paths=list((c.ROOT/'knowledge_base/catalog').rglob('*.json'))+[c.ROOT/'webapp/src/data/database.json']
        before={p:hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
        old=json.loads((c.ROOT/'Docs/reports/c2-rendering-classification-2026-10-30/before.json').read_text())
        expected=copy.deepcopy(old);changed=[]
        for row in expected['rows']:
            if row['category']==CATEGORY:
                changed.append(row['id']);self.assertEqual(row['status'],'unclassified')
                self.assertTrue(15<=row['words']<=24)
                row.update(status='within',range=[10,24])
        expected['summary'].update(within=685,unclassified=81)
        self.assertEqual(len(changed),25);self.assertEqual(c.inspect(),expected)
        self.assertEqual(before,{p:hashlib.sha256(p.read_bytes()).hexdigest() for p in paths})

    def test_historical_assertion_bodies_and_policy_are_preserved(self):
        for path,method in [('scripts/tests/test_authoring_lengths.py','test_waist_specific_range_and_reviewed_retentions'),('scripts/tests/test_c2_scene_optics.py','test_review_set_matches_fixed_prechange_diagnostics_and_28_new_exceptions')]:
            old=subprocess.check_output(['git','show',BASE+':'+path],cwd=c.ROOT,text=True)
            now=(c.ROOT/path).read_text().replace('from scripts.lib.c2_rendering_history import historical_policy_test\n','').replace('    @historical_policy_test\n','')
            self.assertEqual(now,old)
        root=c.ROOT;inspect=c.inspect
        with historical_policy_context():
            self.assertNotEqual(c.ROOT,root)
            self.assertEqual(c.inspect()['summary'],{'under':22,'over':70,'within':660,'unclassified':106})
        self.assertIs(c.ROOT,root);self.assertIs(c.inspect,inspect)

    def test_ledger_covers_every_remaining_diagnostic(self):
        ledger=json.loads((c.ROOT/'scripts/lib/c2ClosureInventory.json').read_text())
        result=c.inspect();self.assertEqual(ledger['base'],BASE)
        expected={r['id'] for r in result['rows'] if r['status'] in ['under','over','unclassified']}
        self.assertEqual({r['id'] for r in ledger['rows']},expected)
        self.assertEqual(len(ledger['rows']),len(expected))
        rows={r['id']:r for r in result['rows']}
        for item in ledger['rows']:
            self.assertTrue(item['reason'].strip());self.assertEqual(item['sourceSha256'],rows[item['id']]['sourceSha256'])
            self.assertEqual(item['status'],rows[item['id']]['status'])
        self.assertEqual(sum(r['decision']=='diagnostic-followup' for r in ledger['rows']),50)
