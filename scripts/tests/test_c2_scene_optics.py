from scripts.lib.c2_rendering_history import historical_policy_test
import copy
import hashlib
import json
import subprocess
import tempfile
import unittest
from scripts import check_authoring_lengths as c

class C2SceneOpticsTests(unittest.TestCase):
    @historical_policy_test
    def test_review_set_matches_fixed_prechange_diagnostics_and_28_new_exceptions(self):
        root=c.ROOT
        review=json.loads((root/'scripts/lib/c2SceneOpticsReview.json').read_text())
        old=json.loads(subprocess.check_output(['git','show',review['base']+':scripts/lib/authoringLengthPolicy.json'],cwd=root))
        policy=json.loads((root/'scripts/lib/authoringLengthPolicy.json').read_text())
        self.assertEqual({**policy,'exceptions':policy['exceptions'][:10]},old)
        self.assertEqual(len(review['retentions']),29)
        self.assertEqual(len({r['id'] for r in review['retentions']}),29)
        wanted=[]
        index=json.loads((root/'knowledge_base/catalog/index.json').read_text())
        for section in index['sections']:
            if section['name'] not in ['Locations','CameraLighting']:continue
            for category in section['categories']:
                key=section['name']+'/'+category['name'];rule=old['rules'].get(key)
                if not rule:continue
                path='knowledge_base/catalog/'+category['path']
                data=json.loads(subprocess.check_output(['git','show',review['base']+':'+path],cwd=root))
                wanted.extend(e['id'] for e in data['entries'] if c.word_count(e['en'])>rule['max'])
        self.assertEqual(set(wanted),{r['id'] for r in review['retentions']})
        retained={r['id']:r for r in review['retentions'] if r['decision']=='retain'}
        self.assertEqual(len(retained),28)
        self.assertEqual({x['id'] for x in policy['exceptions'][10:]},set(retained))
        for e in policy['exceptions'][10:]:
            row=retained[e['id']];self.assertEqual(e['sourceSha256'],c.digest(row['original']['en']));self.assertEqual(e['reason'],row['reason']);self.assertEqual(e['kind'],row['kind'])
        result=c.inspect();self.assertEqual(result['reviewedExceptions'],38)
        rows={r['id']:r for r in result['rows']}
        for key in retained:self.assertEqual(rows[key]['status'],'over')
        changed=next(r for r in review['changes'] if r['key']=='locationId');self.assertEqual(rows[changed['id']]['status'],'within');self.assertIsNone(rows[changed['id']]['review'])
        self.assertEqual(len([r for r in result['rows'] if 'Camera & Film Simulation' in r['category'] and r['status']=='unclassified']),25)

    def test_new_alias_schema_and_mapping_are_only_two_category_extensions(self):
        root=c.ROOT;review=json.loads((root/'scripts/lib/c2SceneOpticsReview.json').read_text())
        schema=json.loads((root/'knowledge_base/catalog/schema.json').read_text());mapping=json.loads((root/'knowledge_base/catalog/field_mapping.json').read_text())
        for section,category in [('CameraLighting','光學效果 (Optical Effects)'),('Locations','城市與社群感 (Urban & Social Snapshots)')]:
            self.assertEqual(schema['sections'][section]['categories'][category]['properties'].pop('legacyPromptAliases'),{'type':'array','items':{'type':'string'}})
            mapping['fields']['legacyPromptAliases']['categories'].remove(section+'/'+category)
            for key in ['legacyPromptAliases','legacyPromptAliases[]']:mapping['paths'][key]['categories'].remove(section+'/'+category)
        for name,value in [('schema',schema),('field_mapping',mapping)]:
            old=json.loads(subprocess.check_output(['git','show',review['base']+':knowledge_base/catalog/'+name+'.json'],cwd=root));self.assertEqual(value,old)

    def test_new_exception_source_drift_rejected(self):
        # Point inspection at an isolated policy; catalog/source directories are read-only links.
        root=c.ROOT
        with tempfile.TemporaryDirectory() as temp:
            from pathlib import Path
            p=Path(temp);(p/'scripts/lib').mkdir(parents=True);(p/'knowledge_base').symlink_to(root/'knowledge_base',target_is_directory=True);(p/'Docs').symlink_to(root/'Docs',target_is_directory=True)
            policy=json.loads((root/'scripts/lib/authoringLengthPolicy.json').read_text());policy['exceptions'][-1]['sourceSha256']='0'*64
            # local_file intentionally rejects references outside root; validate drift using a real isolated copy instead.
            import shutil
            (p/'knowledge_base').unlink();(p/'Docs').unlink();shutil.copytree(root/'knowledge_base',p/'knowledge_base');shutil.copytree(root/'Docs/specs',p/'Docs/specs')
            (p/'scripts/lib/authoringLengthPolicy.json').write_text(json.dumps(policy))
            with self.assertRaisesRegex(ValueError,'Stale exception source'):c.inspect(p)
