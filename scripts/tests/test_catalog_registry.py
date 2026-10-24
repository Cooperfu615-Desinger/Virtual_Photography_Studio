import copy
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from scripts.catalog_registry import validate_registry, load_registry_history, RegistryError


class RegistryTests(unittest.TestCase):
    def setUp(self):
        self.id='wardrobe:tops:old:0'
        self.row={'id':self.id,'initialGroup':'wardrobe','initialCategory':'Tops','createdFrom':'A-source','status':'frozen'}
        self.history={'version':1,'entries':[self.row]}
        self.records=[{'id':self.id,'legacyIds':[self.id,'old-alias'] }]

    def test_initial_inventory_and_self_alias(self):
        frozen=[{k:v for k,v in self.row.items() if k!='status'}]
        validate_registry(self.records,self.history,initial_frozen=frozen)
        with self.assertRaises(RegistryError):validate_registry([],{'version':1,'entries':[]},initial_frozen=frozen)
        with self.assertRaises(RegistryError):validate_registry(self.records,self.history)

    def test_simultaneous_delete_and_retired_history_delete(self):
        with self.assertRaises(RegistryError):validate_registry([],{'version':1,'entries':[]},self.history)
        retired=dict(self.row,status='retired',reason='decision',decisionRef='spec',replacedBy=None,restorePolicy='retained original card prompt')
        with self.assertRaises(RegistryError):validate_registry([],{'version':1,'entries':[]},{'version':1,'entries':[retired]})

    def test_immutable_provenance_and_illegal_transitions(self):
        for key,value in [('initialGroup','camera'),('initialCategory','different'),('createdFrom','new'),('status','active'),('status','retired')]:
            candidate=copy.deepcopy(self.history);candidate['entries'][0][key]=value
            with self.subTest(key=key),self.assertRaises(RegistryError):validate_registry(self.records,candidate,self.history)
        retired=dict(self.row,status='retired',reason='r',decisionRef='d',replacedBy=None,restorePolicy='p')
        with self.assertRaises(RegistryError):validate_registry(self.records,self.history,{'version':1,'entries':[retired]})

    def test_new_ids_and_bidirectional_membership(self):
        new={'id':'wardrobe:tops:new-shirt','initialGroup':'wardrobe','initialCategory':'Tops','createdFrom':'new-decision','status':'active'}
        candidate={'version':1,'entries':[self.row,new]};data=self.records+[{'id':new['id'],'legacyIds':[]}]
        validate_registry(data,candidate,self.history)
        for identifier,status in [('wardrobe:tops:shirt:1','active'),('wardrobe:tops:new-shirt','frozen')]:
            bad=copy.deepcopy(candidate);bad['entries'][1].update(id=identifier,status=status)
            with self.assertRaises(RegistryError):validate_registry(data,bad,self.history)
        with self.assertRaises(RegistryError):validate_registry(self.records,candidate,self.history)
        with self.assertRaises(RegistryError):validate_registry(data,self.history,self.history)

    def test_duplicate_primary_alias_conflicts_and_registry_shape(self):
        with self.assertRaises(RegistryError):validate_registry(self.records*2,self.history,self.history)
        new=dict(self.row,id='wardrobe:tops:new-shirt',status='active')
        for token in [self.id,'old-alias']:
            with self.assertRaises(RegistryError):validate_registry(self.records+[{'id':new['id'],'legacyIds':[token]}],{'version':1,'entries':[self.row,new]},self.history)
        with self.assertRaises(RegistryError):validate_registry(self.records,dict(self.history,registryBaseCommit='invented'),self.history)

    def test_retirement_graph_and_explicit_policy_fixture_only(self):
        other=dict(self.row,id='wardrobe:tops:target',status='active')
        history={'version':1,'entries':[self.row,other]}
        retired=dict(self.row,status='retired',reason='approved fixture',decisionRef='fixture',restorePolicy='fixture explicit replacement',replacedBy=other['id'])
        records=[{'id':other['id'],'legacyIds':[]}]
        candidate={'version':1,'entries':[retired,other]}
        validate_registry(records,candidate,history,allow_retirement=True)
        for target in [self.id,'missing']:
            bad=copy.deepcopy(candidate);bad['entries'][0]['replacedBy']=target
            with self.assertRaises(RegistryError):validate_registry(records,bad,history,allow_retirement=True)
        bad=copy.deepcopy(candidate);bad['entries'][1]=dict(retired,id=other['id'],replacedBy=self.id)
        with self.assertRaises(RegistryError):validate_registry([],bad,history,allow_retirement=True)
        for key in ['reason','decisionRef','restorePolicy','replacedBy']:
            bad=copy.deepcopy(candidate);del bad['entries'][0][key]
            with self.assertRaises(RegistryError):validate_registry(records,bad,history,allow_retirement=True)

    def test_retired_issued_id_cannot_be_reused_as_alias(self):
        retired=dict(self.row,status='retired',reason='reviewed fixture',decisionRef='fixture',replacedBy=None,restorePolicy='preserve historical content')
        live=dict(self.row,id='wardrobe:tops:current-shirt',status='active')
        history={'version':1,'entries':[retired,live]}
        records=[{'id':live['id'],'legacyIds':[]}]
        validate_registry(records,history,history)
        records[0]['legacyIds']=[self.id]
        with self.assertRaises(RegistryError):validate_registry(records,history,history)
        with self.assertRaises(RegistryError):validate_registry(self.records,dict(self.history,version=True),self.history)
        candidate=copy.deepcopy(history);candidate['entries'][1]['status']='frozen'
        with self.assertRaises(RegistryError):validate_registry(records,candidate,history)

    def test_real_git_history_missing_candidate_and_nonancestor(self):
        # All Git commits below are disposable test fixtures, never the project repository.
        with tempfile.TemporaryDirectory() as temp:
            repo=Path(temp)
            def git(*args):return subprocess.check_output(['git','-C',temp,*args],stderr=subprocess.PIPE).decode().strip()
            git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid')
            path=repo/'knowledge_base/catalog/id_registry.json';path.parent.mkdir(parents=True);path.write_text(json.dumps(self.history))
            git('add','.');git('commit','-qm','fixture baseline');base=git('rev-parse','HEAD')
            (repo/'marker').write_text('candidate');git('add','.');git('commit','-qm','fixture candidate');candidate=git('rev-parse','HEAD')
            loaded,proof=load_registry_history(repo,base,candidate)
            self.assertEqual(loaded,self.history);self.assertEqual(len(proof['registrySha256']),64)
            for sha,head,patharg in [('0'*40,candidate,'knowledge_base/catalog/id_registry.json'),(candidate,candidate,'knowledge_base/catalog/id_registry.json'),(candidate,base,'knowledge_base/catalog/id_registry.json'),(base,candidate,'missing.json'),(base,candidate,'../outside')]:
                with self.subTest(sha=sha,path=patharg),self.assertRaises(RegistryError):load_registry_history(repo,sha,head,patharg)


if __name__=='__main__':unittest.main()
