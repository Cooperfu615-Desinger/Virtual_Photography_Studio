import contextlib
import copy
import hashlib
import io
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock
from scripts import sync_to_json as sync
from scripts.catalog_prepare import read_catalog_bundle
from scripts.catalog_history import PRE_C_COMMIT, validate_history
from scripts.catalog_ci_history import select_history

ROOT = Path(sync.BASE_DIR)


class FormalSourceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name); self.kb = self.root/'knowledge_base'
        shutil.copytree(ROOT/'knowledge_base/catalog', self.kb/'catalog')
        shutil.copyfile(ROOT/'knowledge_base/wardrobe_reference_manifest.json', self.kb/'wardrobe_reference_manifest.json')
        self.output = self.root/'database.json'
        for key, value in {'BASE_DIR': str(self.root), 'KB_DIR': str(self.kb), 'OUTPUT_FILE': str(self.output), 'WARDROBE_REFERENCE_MANIFEST_FILE': str(self.kb/'wardrobe_reference_manifest.json')}.items():
            patch = mock.patch.object(sync, key, value); patch.start(); self.addCleanup(patch.stop)
        def git(*args):
            return subprocess.check_output(['git', '-C', str(self.root), *args], stderr=subprocess.DEVNULL, text=True).strip()
        git('init'); git('config', 'user.email', 'fixture@example.invalid'); git('config', 'user.name', 'Fixture')
        git('add', 'knowledge_base/catalog/id_registry.json'); git('commit', '-m', 'trusted fixture registry')
        self.base = git('rev-parse', 'HEAD')
        env = dict(os.environ, REGISTRY_BASE_COMMIT=self.base)
        env.pop('REGISTRY_CANDIDATE_COMMIT', None)
        patch = mock.patch.dict(os.environ, env, clear=True); patch.start(); self.addCleanup(patch.stop)
        # Production history is explicitly tested below; fixture builds use the fixed initial inventory.
        self.records, self.index = self.read()

    def read(self):
        return read_catalog_bundle(self.kb/'catalog', json.loads((self.kb/'catalog/schema.json').read_text()))

    def write(self, relative, value):
        (self.kb/'catalog'/relative).write_text(json.dumps(value, ensure_ascii=False))

    def snapshot(self):
        return {str(p.relative_to(self.root)): hashlib.sha256(p.read_bytes()).hexdigest() for p in self.root.rglob('*') if p.is_file()}

    def test_real_source_metadata_management_files_and_order(self):
        self.assertEqual(sum(len(rs) for cs in self.records.values() for rs in cs.values()), 1050)
        outputs, proof = sync.build_outputs(self.base)
        self.assertEqual(len(outputs), 8); self.assertEqual(proof['historicalIds'], 1050)
        self.assertEqual(list(self.records), list(sync.FILES_TO_SYNC.values()))
        self.assertTrue(any(row.get('outerwearFastenerRequirement') == '' for cs in self.records.values() for rs in cs.values() for row in rs))

    def test_check_readonly_idempotent_and_all_eight_outputs(self):
        outputs, _ = sync.build_outputs(self.base); sync.publish_outputs(outputs)
        before = self.snapshot()
        with contextlib.redirect_stdout(io.StringIO()): self.assertEqual(sync.main(['--check']), 0)
        self.assertEqual(before, self.snapshot())
        sync.publish_outputs(sync.build_outputs(self.base)[0]); self.assertEqual(before, self.snapshot())
        for path in outputs:
            original=path.read_bytes(); path.write_bytes(original+b' stale')
            before=self.snapshot()
            with contextlib.redirect_stderr(io.StringIO()): self.assertEqual(sync.main(['--check']), 1)
            self.assertEqual(before,self.snapshot());path.write_bytes(original)

    def test_last_source_failure_leaves_all_outputs_unchanged(self):
        sync.publish_outputs(sync.build_outputs(self.base)[0]); before=self.snapshot()
        relative=self.index['sections'][-1]['categories'][-1]['path']
        data=json.loads((self.kb/'catalog'/relative).read_text());data['entries'][-1]['en']=''
        self.write(relative,data)
        with contextlib.redirect_stderr(io.StringIO()): self.assertEqual(sync.main([]),1)
        after=self.snapshot();before.pop('knowledge_base/catalog/'+relative);after.pop('knowledge_base/catalog/'+relative)
        self.assertEqual(before,after)

    def test_legacy_source_failure_leaves_all_eight_outputs_unchanged(self):
        sync.publish_outputs(sync.build_outputs(self.base)[0]); before=self.snapshot()
        relative='legacy_mappings.json'
        data=json.loads((self.kb/'catalog'/relative).read_text())
        data['tables']['REGIONAL_STYLE_LEGACY_OPTION_MAP']['fields']['targetZh']['fieldKind']='legacy-key'
        self.write(relative,data)
        with contextlib.redirect_stderr(io.StringIO()): self.assertEqual(sync.main([]),1)
        after=self.snapshot();before.pop('knowledge_base/catalog/'+relative);after.pop('knowledge_base/catalog/'+relative)
        self.assertEqual(before,after)

    def test_replace_failure_rolls_back_every_output(self):
        outputs={self.root/f'{n}.txt':'new' for n in range(8)}
        for p in outputs:p.write_text('old')
        original=os.replace;calls=[]
        def fail_fourth(a,b):
            calls.append(b)
            if len(calls)==4: raise OSError('injected replacement failure')
            original(a,b)
        with mock.patch.object(sync.os,'replace',side_effect=fail_fourth):
            with self.assertRaises(OSError):sync.publish_outputs(outputs)
        self.assertTrue(all(p.read_text()=='old' for p in outputs));self.assertFalse(list(self.root.glob('.catalog-sync-*')))

    def test_missing_extra_duplicate_and_traversal_paths_rejected(self):
        original=copy.deepcopy(self.index)
        for mutate in [lambda i:i['sections'][0]['categories'].append(i['sections'][0]['categories'][0]), lambda i:i['sections'][0]['categories'][0].update(path='../escape.json'), lambda i:i['sections'][0]['categories'][0].update(path='schema.json')]:
            idx=copy.deepcopy(original);mutate(idx);self.write('index.json',idx)
            with self.assertRaises((ValueError,FileNotFoundError)):self.read()
        self.write('index.json',original);self.write('unexpected.json',{})
        with self.assertRaises(ValueError):self.read()
        (self.kb/'catalog/unexpected.json').unlink()
        (self.kb/'catalog'/original['sections'][0]['categories'][0]['path']).unlink()
        with self.assertRaises(FileNotFoundError):self.read()

    def test_overview_missing_duplicate_wrong_order_and_unsafe_output_rejected(self):
        for kind in ['missing','duplicate','reorder','path','column']:
            idx=copy.deepcopy(self.index); lines=idx['markdown'][0]['lines'];positions=[i for i,x in enumerate(lines) if isinstance(x,dict)]
            if kind=='missing':lines.pop(positions[0])
            elif kind=='duplicate':lines.append(lines[positions[0]])
            elif kind=='reorder':lines[positions[0]],lines[positions[1]]=lines[positions[1]],lines[positions[0]]
            elif kind=='path':idx['markdown'][0]['file']='../../escape.md'
            else:lines[positions[0]]['columns']['0']='en'
            self.write('index.json',idx)
            with self.assertRaises(ValueError):self.read()

    def test_registry_and_record_deletion_together_fails(self):
        flat=[r for cs in self.records.values() for rows in cs.values() for r in rows]
        registry=json.loads((self.kb/'catalog/id_registry.json').read_text());ident=flat.pop()['id']
        registry['entries']=[r for r in registry['entries'] if r['id']!=ident]
        with self.assertRaises(ValueError):validate_history(self.root,flat,registry,self.base)

    def test_manifest_stale_name_fails_before_outputs(self):
        p=self.kb/'wardrobe_reference_manifest.json';manifest=json.loads(p.read_text());next(iter(manifest['categories'].values()))['items'][0]['name']='unknown';p.write_text(json.dumps(manifest))
        with self.assertRaises((ValueError, sync.SyncValidationError)):sync.build_outputs(self.base)
        self.assertFalse(self.output.exists())


class HistorySelectionTests(unittest.TestCase):
    def test_event_selection_and_invalid_inputs(self):
        a,b,c='a'*40,'b'*40,'c'*40
        self.assertEqual(select_history('push',a,None,None,b,None),(a,b))
        self.assertEqual(select_history('pull_request',None,a,b,c,None),(a,b))
        self.assertEqual(select_history('workflow_dispatch',None,None,None,b,a),(a,b))
        for event,base,head in [('push','0'*40,b),('push',a,a),('unknown',a,b)]:
            with self.assertRaises(ValueError):select_history(event,base,None,None,head,a)

    @mock.patch.dict(os.environ, {}, clear=True)
    def test_initial_bootstrap_is_sealed_and_limited_to_one_introduction(self):
        snapshot = (ROOT/'webapp/src/lib/engine/catalogSnapshot.catalog.json').read_bytes()
        frozen_blob = (ROOT/'scripts/fixtures/catalog_initial_frozen.json').read_bytes()
        frozen = json.loads(frozen_blob)
        registry = {'version': 1, 'entries': [dict(r, status='frozen') for r in frozen]}
        records = [{'id': r['id'], 'legacyIds': []} for r in frozen]
        candidate = 'c'*40
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); fixture = root/'scripts/fixtures/catalog_initial_frozen.json'
            fixture.parent.mkdir(parents=True); fixture.write_bytes(frozen_blob)
            def git(repo, *args):
                if args[0] == 'merge-base': return b''
                if args[0] == 'rev-list': return (candidate+'\n').encode()
                if args[0] == 'ls-tree': return b''
                if args[0] == 'show': return snapshot
                raise AssertionError(args)
            with mock.patch('scripts.catalog_history.git', side_effect=git):
                proof = validate_history(root, records, registry, PRE_C_COMMIT, candidate)
                self.assertEqual(proof['initialFrozen'], 1050)
                fixture.write_bytes(frozen_blob+b' ')
                with self.assertRaisesRegex(ValueError, 'seal differs'):
                    validate_history(root, records, registry, PRE_C_COMMIT, candidate)
                fixture.write_bytes(frozen_blob)
            def extra_commit(repo, *args):
                if args[0] == 'rev-list': return (candidate+'\n'+'b'*40+'\n').encode()
                return git(repo, *args)
            with mock.patch('scripts.catalog_history.git', side_effect=extra_commit):
                with self.assertRaisesRegex(ValueError, 'only allowed directly'):
                    validate_history(root, records, registry, PRE_C_COMMIT, candidate)

    def test_history_missing_and_local_bootstrap_reuse_fail(self):
        with mock.patch('scripts.catalog_history.git') as git:
            git.return_value=b'b'*40+b'\n'
            with self.assertRaises(ValueError):validate_history(ROOT,[],{},PRE_C_COMMIT)
        with self.assertRaises(ValueError):validate_history(ROOT,[],{},'f'*40)

    @mock.patch.dict(os.environ, {}, clear=True)
    def test_committed_registry_history_is_required_and_records_proof(self):
        with tempfile.TemporaryDirectory() as temp:
            r=Path(temp)
            def git(*args):return subprocess.check_output(['git','-C',temp,*args],stderr=subprocess.DEVNULL,text=True).strip()
            git('init');git('config','user.email','fixture@example.invalid');git('config','user.name','Fixture')
            p=r/'knowledge_base/catalog/id_registry.json';p.parent.mkdir(parents=True)
            entry={'id':'character:fixture:first','initialGroup':'character','initialCategory':'Fixture','createdFrom':'test decision','status':'active'}
            p.write_text(json.dumps({'version':1,'entries':[entry]}));git('add','.');git('commit','-m','trusted registry');base=git('rev-parse','HEAD')
            proof=validate_history(r,[{'id':entry['id'],'legacyIds':[]}],{'version':1,'entries':[entry]},base)
            self.assertEqual(proof['historicalIds'],1);self.assertIn('registrySha256',proof)
            with self.assertRaises(ValueError):validate_history(r,[],{'version':1,'entries':[]},base)
            with self.assertRaises(ValueError):validate_history(r,[],{'version':1,'entries':[]},base,base)
