import copy
import json
import tempfile
import unittest
from unittest import mock
from pathlib import Path
from scripts import sync_to_json as s
from scripts import catalog_prepare as p


class CatalogSchemaTests(unittest.TestCase):
    def check(self, value, schema):
        s.validate_catalog_value(value, schema, 'fixture.json', 'item-id', '$.value')

    def test_supported_primitives_and_false_values(self):
        for value, kind in [('text','string'), (0,'number'), (0,'integer'), (False,'boolean'), (None,'null')]:
            self.check(value, {'type':kind})
        self.check('', {'type':'string'})
        self.check(None, {'type':['string','null']})
        with self.assertRaises(s.SyncValidationError):self.check(False, {'type':'integer'})
        with self.assertRaises(s.SyncValidationError):self.check(1, {'type':'boolean'})

    def test_enum_is_type_sensitive(self):
        self.check(False, {'type':'boolean','enum':[False]})
        with self.assertRaises(s.SyncValidationError):self.check(False, {'type':'boolean','enum':[0]})

    def test_nested_required_items_and_unknown_fields(self):
        schema={'type':'object','properties':{'xs':{'type':'array','items':{'type':'object','required':['name'],'properties':{'name':{'type':'string','minLength':1}},'additionalProperties':False}}},'required':['xs'],'additionalProperties':False}
        self.check({'xs':[{'name':'ok'}]},schema)
        for value in [{}, {'xs':[{}]}, {'xs':[{'name':'','extra':True}]}, {'xs':[{'name':'ok','extra':True}]}, {'xs':[7]}, {'xs':[],'extra':0}]:
            with self.subTest(value=value), self.assertRaises(s.SyncValidationError):self.check(value,schema)

    def test_pattern_and_length_diagnostics(self):
        for value in ['', '  ', 'Wrong', 'a']:
            with self.subTest(value=value),self.assertRaisesRegex(s.SyncValidationError,r'fixture.json: id=item-id field=\$.value'):
                self.check(value,{'type':'string','minLength':2,'pattern':'^[a-z]+$'})
        self.check('okay',{'type':'string','minLength':2,'pattern':'^[a-z]+$'})

    def test_reject_schema_typos_even_on_absent_optional_fields(self):
        for schema in [{'type':{}}, {'type':[[]]}, {'type':'string','maxLength':2},{'type':'object','properties':{'optional':{'type':'string','unsupported':True}}}, {'type':'array'}, {'type':'string','pattern':'['}, {'type':'string','minLength':False}, {'type':'object','additionalProperties':{}}, {'type':'object','required':['missing']}, {'type':'array','items':{}}, {'type':'object','items':{'type':'string'}}]:
            with self.subTest(schema=schema), self.assertRaises(s.SyncValidationError):s.validate_schema_definition(schema)

    def test_three_layers_merge_required_and_reject_conflicting_definition(self):
        string={'type':'string','minLength':1}
        wrapper={'common':{'properties':{'id':string},'required':['id']},'sections':{'S':{'properties':{'label':string},'required':['id','label'],'categories':{'C':{'properties':{'note':string},'required':['note']}}}}}
        merged=s.merged_catalog_schema(wrapper,'S','C')
        self.assertEqual(merged['required'],['id','label','note'])
        self.check({'id':'a','label':'b','note':'c'},merged)
        wrapper['sections']['S']['categories']['C']['properties']['id']=string
        s.merged_catalog_schema(wrapper,'S','C')
        wrapper['sections']['S']['categories']['C']['properties']['id']={'type':'integer'}
        with self.assertRaisesRegex(s.SyncValidationError,'Conflicting'):s.merged_catalog_schema(wrapper,'S','C')
        with self.assertRaises(s.SyncValidationError):s.merged_catalog_schema(wrapper,'S','missing')

    def test_current_schema_definitions_and_unknown_keyword_in_wrapper(self):
        schema=json.loads((Path(s.BASE_DIR)/'knowledge_base/catalog/schema.json').read_text())
        for section,scope in schema['sections'].items():
            for category in scope['categories']:s.merged_catalog_schema(schema,section,category)
        schema['common']['unsupported']=True
        with self.assertRaises(s.SyncValidationError):s.merged_catalog_schema(schema,'Regional','攝影風格')

    def test_record_markdown_safety_and_false_retention(self):
        schema={'common':{'properties':{'id':{'type':'string','minLength':1},'zh':{'type':'string','minLength':1},'flag':{'type':'boolean'},'empty':{'type':'string'}},'required':['id','zh']},'sections':{'S':{'categories':{'C':{'properties':{}}}}}}
        row={'id':'x','zh':'字','flag':False,'empty':''};before=copy.deepcopy(row)
        s.validate_catalog_records(schema,'S','C',[row]);self.assertEqual(row,before)
        for bad in ['a|b','a\nb','a\rb']:
            with self.assertRaises(s.SyncValidationError):s.validate_catalog_records(schema,'S','C',[dict(row,zh=bad)])


class CatalogPreparationTests(unittest.TestCase):
    def setUp(self):
        self.schema={'common':{'properties':{k:{'type':'string','minLength':1} for k in ['id','zh','en','desc']},'required':['id','zh','en','desc']},'sections':{'Regional':{'properties':{'legacyIds':{'type':'array','items':{'type':'string'}},'inspiration':{'type':'string','minLength':1}},'required':['inspiration'],'categories':{'風格':{'properties':{}}}}}}
        self.raw={'Regional':{'風格':[{'zh':'風格','en':'a style','desc':'source | detail'}]}}
        self.comp={'regional':{'風格':[{'id':'regional:風格:style:0','en':'a style','legacyIds':['regional:風格:style:0']}]}}

    def test_regional_round_trip_and_alias_freeze(self):
        records=p.prepare_records(self.raw,self.comp,self.schema)
        self.assertEqual(records['Regional']['風格'][0]['inspiration'],'source')
        generated=p.generated_database(records,{'categories':{}})
        self.assertEqual(p.strip_ids(generated),self.raw)
        self.assertEqual(generated['Regional']['風格'][0]['legacyIds'],self.comp['regional']['風格'][0]['legacyIds'])
        with self.assertRaises(ValueError):p.prepare_records({'Regional':{'風格':[dict(self.raw['Regional']['風格'][0],desc='no separator')]}},self.comp,self.schema)
        bad=copy.deepcopy(self.comp);bad['regional']['風格'][0]['en']='different'
        with self.assertRaises(ValueError):p.prepare_records(self.raw,bad,self.schema)

    @mock.patch.dict(s.FILES_TO_SYNC, {'regional_portrait_styles.md': 'Regional'}, clear=True)
    def test_index_missing_extra_duplicate_and_traversal_rejected(self):
        records=p.prepare_records(self.raw,self.comp,self.schema)
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);(root/'Regional').mkdir()
            f=root/'Regional/style.json';f.write_text(json.dumps({'section':'Regional','category':'風格','entries':records['Regional']['風格']}))
            index={'version':1,'sections':[{'name':'Regional','categories':[{'name':'風格','path':'Regional/style.json'}]}],'markdown':[{'file':'regional_portrait_styles.md','lines':['# Fixture\n',{'id':'regional:風格:style:0','cells':['','','',''],'columns':{'0':'zh','1':'inspiration','2':'en','3':'desc'},'affixes':{str(i):['',''] for i in range(4)}}]}]}
            def save(x): (root/'index.json').write_text(json.dumps(x))
            save(index);p.read_catalog_bundle(root,self.schema)
            for changed in ['../outside.json','/tmp/outside.json','Regional/missing.json']:
                bad=copy.deepcopy(index);bad['sections'][0]['categories'][0]['path']=changed;save(bad)
                with self.subTest(path=changed),self.assertRaises((ValueError,FileNotFoundError)):p.read_catalog_bundle(root,self.schema)
            bad=copy.deepcopy(index);bad['sections'][0]['categories']*=2;save(bad)
            with self.assertRaises(ValueError):p.read_catalog_bundle(root,self.schema)
            save(index);(root/'unexpected.json').write_text('{}')
            with self.assertRaises(ValueError):p.read_catalog_bundle(root,self.schema)

    def test_manifest_keys_remain_generated_only(self):
        row={'id':'wardrobe:x:one','legacyIds':[],'zh':'衣','en':'shirt','desc':'description','meta':{'enabled':False},'outerwearFastenerRequirement':''}
        manifest={'categories':{'套裝':{'directory':'outfits','items':[{'name':'衣','id':'img','preview':'01.avif'}]}}}
        result=p.generated_database({'Wardrobe':{'套裝':[row]}},manifest)['Wardrobe']['套裝'][0]
        self.assertEqual(result['meta']['referenceImage'],'reference/wardrobe/outfits/01.avif')
        self.assertIs(result['meta']['enabled'],False);self.assertEqual(result['outerwearFastenerRequirement'],'')
        self.assertNotIn('referenceImage',row['meta'])


if __name__=='__main__':unittest.main()
