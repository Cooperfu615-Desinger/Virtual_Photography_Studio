import copy
import json
import unittest
from pathlib import Path
from scripts import sync_to_json as s

ROOT = Path(s.BASE_DIR)

class OutfitColorBindingSchemaTests(unittest.TestCase):
    def test_reviewed_bindings_roundtrip_and_reject_malformed_roles(self):
        schema = json.loads((ROOT / 'knowledge_base/catalog/schema.json').read_text())
        review = json.loads((ROOT / 'scripts/lib/a2OutfitControlReview.json').read_text())
        row = next(x['after'] for x in review['rows'] if x['path'] == 'structured')
        def validate(value):
            s.validate_catalog_records(schema, 'Wardrobe', review['category'], [value], 'fixture.json')
        original = copy.deepcopy(row)
        validate(row)
        self.assertEqual(row, original)
        for value in [None, {}, ['text'], [{}], [{'channel': 'locked', 'target': 'trim', 'omitForPrimaryMaterial': False}],
                      [{'channel': 'primary', 'target': '', 'omitForPrimaryMaterial': False}],
                      [{'channel': 'primary', 'target': ' ', 'omitForPrimaryMaterial': False}],
                      [{'channel': 'primary', 'target': 'trim controlled by palette', 'omitForPrimaryMaterial': False}],
                      [{'channel': 'primary', 'target': 'trim', 'omitForPrimaryMaterial': 'false'}],
                      [{'channel': 'primary', 'target': 'trim', 'omitForPrimaryMaterial': False, 'extra': 1}]]:
            bad = copy.deepcopy(row); bad['meta']['colorTextBindings'] = value
            with self.subTest(value=value), self.assertRaises(s.SyncValidationError): validate(bad)

    def test_binding_is_not_admitted_into_other_categories(self):
        schema = json.loads((ROOT / 'knowledge_base/catalog/schema.json').read_text())
        doc = json.loads((ROOT / 'knowledge_base/catalog/Wardrobe/連身-dresses.json').read_text())
        row = doc['entries'][1]
        row['meta']['colorTextBindings'] = [{'channel': 'primary', 'target': 'fabric', 'omitForPrimaryMaterial': False}]
        with self.assertRaises(s.SyncValidationError):
            s.validate_catalog_records(schema, doc['section'], doc['category'], [row], 'fixture.json')
