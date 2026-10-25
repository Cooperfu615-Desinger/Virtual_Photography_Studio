import copy
import json
import unittest
from pathlib import Path
from scripts import sync_to_json as s

ROOT = Path(s.BASE_DIR) / 'knowledge_base/catalog'

class CatalogSemanticSchemaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = json.loads((ROOT / 'schema.json').read_text())
        index = json.loads((ROOT / 'index.json').read_text())
        cls.documents = [json.loads((ROOT / c['path']).read_text()) for section in index['sections'] for c in section['categories']]

    def validate(self, doc, row):
        s.validate_catalog_records(self.schema, doc['section'], doc['category'], [row], 'fixture.json')

    def test_every_category_requires_semantic_object_and_closed_keys(self):
        for doc in self.documents:
            original = doc['entries'][0]
            self.validate(doc, original)
            for value in [None, [], 'text', {'unknown': True}]:
                row = copy.deepcopy(original);row['meta']['semantic'] = value
                with self.subTest(category=doc['category'], value=value), self.assertRaises(s.SyncValidationError):self.validate(doc, row)
            row = copy.deepcopy(original);del row['meta']['semantic']
            with self.assertRaises(s.SyncValidationError):self.validate(doc, row)
            del row['meta']
            with self.assertRaises(s.SyncValidationError):self.validate(doc, row)

    def test_section_enum_and_negative_no_tags_contract(self):
        for doc in self.documents:
            row = copy.deepcopy(doc['entries'][0]);semantic = row['meta']['semantic']
            if doc['section'] == 'Negative':
                self.assertNotIn('tags', semantic)
                for field in ['conflictTags', 'useTags']:
                    bad = copy.deepcopy(row);del bad['meta']['semantic'][field]
                    with self.assertRaises(s.SyncValidationError):self.validate(doc, bad)
                semantic['tags'] = []
            else:
                semantic['tags'] = ['unknown-tag']
            with self.assertRaises(s.SyncValidationError):self.validate(doc, row)

    def test_nullable_archetype_and_original_preset_meta_survive_validation(self):
        found_null = False;found_preset = False
        for doc in self.documents:
            for row in doc['entries']:
                if 'archetype' in row['meta']['semantic'] and row['meta']['semantic']['archetype'] is None:found_null = True
                if doc['category'] == '套裝 (Outfit Presets)' and len(row['meta']) > 1:found_preset = True
                original = copy.deepcopy(row);self.validate(doc, row);self.assertEqual(row, original)
        self.assertTrue(found_null);self.assertTrue(found_preset)
