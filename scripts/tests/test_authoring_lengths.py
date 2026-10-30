import copy
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from scripts import check_authoring_lengths as c


class AuthoringLengthTests(unittest.TestCase):
    def fixture(self, root):
        (root/'scripts/lib').mkdir(parents=True)
        (root/'knowledge_base/catalog').mkdir(parents=True)
        (root/'spec.md').write_text('spec')
        self.policy = {'version':1,'sections':['Wardrobe'],'rules':{'Wardrobe/test':{'min':2,'max':3,'spec':'spec.md'}},'exceptions':[{'id':'x','sourceSha256':c.digest('one two three four'),'reviewedCommit':'a'*40,'spec':'spec.md','kind':'necessary_structure','reason':'structure'}]}
        (root/'knowledge_base/catalog/index.json').write_text(json.dumps({'sections':[{'name':'Wardrobe','categories':[{'name':'test','path':'test.json'}]}]}))
        (root/'knowledge_base/catalog/test.json').write_text(json.dumps({'entries':[{'id':'x','zh':'測試','en':'one two three four','desc':'中文不計詞','legacyPromptAliases':['not part of count']},{'id':'none','zh':'全無','en':''}]}))
        self.save(root)

    def save(self, root):
        (root/'scripts/lib/authoringLengthPolicy.json').write_text(json.dumps(self.policy))

    def test_count_contract(self):
        for text, n in [('',0),('  ',0),("high-waisted, A/B; 35mm f/1.8 user's",5),('中文說明 — ...',0),('one\ntwo\tthree',3),('3.5 4×1 C–D',5)]:
            self.assertEqual(c.word_count(text),n,text)
        with self.assertRaises(ValueError): c.word_count(None)

    def test_diagnostics_do_not_fail_or_write_and_aliases_excluded(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);self.fixture(root)
            before={str(p):p.read_bytes() for p in root.rglob('*') if p.is_file()}
            result=c.inspect(root)
            self.assertEqual(result['summary']['over'],1)
            self.assertEqual(result['rows'][0]['words'],4)
            self.assertEqual(result['reviewedExceptions'],1)
            run=subprocess.run([sys.executable,str(c.ROOT/'scripts/check_authoring_lengths.py'),'--root',str(root)],capture_output=True)
            self.assertEqual(run.returncode,0,run.stderr)
            self.assertEqual(before,{str(p):p.read_bytes() for p in root.rglob('*') if p.is_file()})

    def test_stale_missing_duplicate_exceptions_fail(self):
        for mutate in [lambda p:p['exceptions'][0].update(id='missing'),lambda p:p['exceptions'][0].update(sourceSha256='0'*64),lambda p:p['exceptions'].append(copy.deepcopy(p['exceptions'][0]))]:
            with tempfile.TemporaryDirectory() as temp:
                root=Path(temp);self.fixture(root);mutate(self.policy);self.save(root)
                with self.assertRaises(ValueError):c.inspect(root)

    def test_missing_reference_reason_and_commit_fail(self):
        for values in [{'spec':'missing.md'},{'spec':'../escape.md'},{'reason':' '},{'reviewedCommit':'main'},{'kind':'automatic'}]:
            with tempfile.TemporaryDirectory() as temp:
                root=Path(temp);self.fixture(root);self.policy['exceptions'][0].update(values);self.save(root)
                with self.assertRaises(ValueError):c.inspect(root)

    def test_unclassified_and_invalid_range(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);self.fixture(root);self.policy['rules']={};self.save(root)
            self.assertEqual(c.inspect(root)['summary']['unclassified'],1)
            self.policy['rules']={'Wardrobe/test':{'min':5,'max':2,'spec':'spec.md'}};self.save(root)
            with self.assertRaises(ValueError):c.inspect(root)

    def test_invalid_cli_has_nonzero_exit(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);self.fixture(root);self.policy['version']=99;self.save(root)
            run=subprocess.run([sys.executable,str(c.ROOT/'scripts/check_authoring_lengths.py'),'--root',str(root)],capture_output=True)
            self.assertNotEqual(run.returncode,0)
            self.assertIn(b'C2 policy/source error',run.stderr)

    def test_real_catalog_and_references_are_valid_and_readonly(self):
        paths=list((c.ROOT/'knowledge_base/catalog').rglob('*.json'))+[c.ROOT/'webapp/src/data/database.json']
        before={p:hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
        result=c.inspect()
        self.assertEqual(result['reviewedExceptions'],10)
        self.assertGreater(len(result['rows']),500)
        self.assertEqual(before,{p:hashlib.sha256(p.read_bytes()).hexdigest() for p in paths})

    def test_exception_commit_provenance(self):
        policy=json.loads((c.ROOT/'scripts/lib/authoringLengthPolicy.json').read_text())
        paths={}
        index=json.loads((c.ROOT/'knowledge_base/catalog/index.json').read_text())
        for section in index['sections']:
            for category in section['categories']:
                path='knowledge_base/catalog/'+category['path']
                for item in json.loads((c.ROOT/path).read_text())['entries']:
                    paths[item['id']]=path
        for exception in policy['exceptions']:
            raw=subprocess.check_output(['git','show',exception['reviewedCommit']+':'+paths[exception['id']]],cwd=c.ROOT)
            source=next(x for x in json.loads(raw)['entries'] if x['id']==exception['id'])
            self.assertEqual(c.digest(source['en']),exception['sourceSha256'])

    def test_waist_specific_range_and_reviewed_retentions(self):
        policy=json.loads((c.ROOT/'scripts/lib/authoringLengthPolicy.json').read_text())
        review=json.loads((c.ROOT/'scripts/lib/c2WaistReview.json').read_text())
        old=json.loads(subprocess.check_output(['git','show',review['base']+':scripts/lib/authoringLengthPolicy.json'],cwd=c.ROOT))
        self.assertEqual(policy['rules']['Wardrobe/腰部配件 (Waist Accessories)']['min'],6)
        restored=copy.deepcopy(policy);restored['rules']['Wardrobe/腰部配件 (Waist Accessories)']['min']=4
        restored['exceptions']=restored['exceptions'][:7]
        self.assertEqual(restored,old)
        rows={r['id']:r for r in c.inspect()['rows']}
        self.assertEqual([rows[r['id']]['words'] for r in review['entries']],[27,22,30,36,32])
        for r in review['entries'][2:]:
            self.assertEqual(rows[r['id']]['review']['kind'],'necessary_structure')
            self.assertEqual(rows[r['id']]['status'],'over')
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);self.fixture(root)
            self.policy['rules']['Wardrobe/test']={'min':6,'max':16,'spec':'spec.md'}
            self.save(root)
            self.assertEqual(c.inspect(root)['rows'][0]['status'],'under')
            self.policy['exceptions']=[];self.save(root)
            path=root/'knowledge_base/catalog/test.json'
            for words,status in [(5,'under'),(6,'within'),(16,'within'),(17,'over')]:
                data=json.loads(path.read_text());data['entries'][0]['en']=' '.join(['word']*words);path.write_text(json.dumps(data))
                self.assertEqual(c.inspect(root)['rows'][0]['status'],status)
