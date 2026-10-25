import copy
import json
import tempfile
import unittest
from pathlib import Path
from scripts.catalog_legacy import validate_legacy_document, read_legacy_source

ROOT = Path(__file__).resolve().parents[2]


class LegacySourceTests(unittest.TestCase):
    def setUp(self):
        self.raw = (ROOT/'knowledge_base/catalog/legacy_mappings.json').read_bytes()
        self.document = json.loads(self.raw)

    def test_complete_source_and_generated_bytes(self):
        self.assertEqual(read_legacy_source(ROOT/'knowledge_base/catalog/legacy_mappings.json').encode(), self.raw)
        self.assertEqual(self.raw, (ROOT/'webapp/src/data/legacyMappings.json').read_bytes())
        validate_legacy_document(self.document)

    def test_unknown_missing_and_changed_contract_rejected(self):
        variants = []
        doc = copy.deepcopy(self.document); doc['extra'] = 1; variants.append(doc)
        doc = copy.deepcopy(self.document); doc['version'] = True; variants.append(doc)
        doc = copy.deepcopy(self.document); del doc['constants']['LEGACY_ENVIRONMENT_MOOD_CATEGORY']; variants.append(doc)
        doc = copy.deepcopy(self.document); del doc['tables']['LEGACY_HAIR_STYLING_STATE_MIGRATIONS']; variants.append(doc)
        doc = copy.deepcopy(self.document); doc['tables']['REGIONAL_STYLE_LEGACY_OPTION_MAP']['fields']['targetZh']['fieldKind'] = 'legacy-key'; variants.append(doc)
        for doc in variants:
            with self.assertRaises(ValueError): validate_legacy_document(doc)

    def test_tuple_indices_unknown_fields_and_missing_required_rejected(self):
        for change in (lambda r: r.update(extra='x'), lambda r: r.pop('targetZh'), lambda r: r.update(legacy=[['x', -1]]), lambda r: r.update(legacy=[['x', True]]), lambda r: r.update(legacy=[['x', '1']]), lambda r: r.update(legacy=[['x']])):
            doc = copy.deepcopy(self.document); change(doc['tables']['REGIONAL_STYLE_LEGACY_OPTION_MAP']['source'][0])
            with self.assertRaises(ValueError): validate_legacy_document(doc)
        # Two intentional empty legacy arrays remain valid.
        self.assertEqual(sum(not r['legacy'] for r in self.document['tables']['CHARACTER_IDENTITY_LEGACY_OPTION_MAP']['source']), 2)

    def test_duplicate_json_keys_are_not_silently_overwritten(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'legacy.json'; path.write_text('{"version":1,"version":1}')
            with self.assertRaisesRegex(ValueError, 'duplicate JSON key'): read_legacy_source(path)
