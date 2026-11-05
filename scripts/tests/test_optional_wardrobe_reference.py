import tempfile
import unittest
from pathlib import Path
from unittest import mock

from scripts import sync_to_json


class OptionalWardrobeReferenceTests(unittest.TestCase):
    def test_only_explicitly_optional_items_may_lack_manifest_entries(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'source'
            preview = Path(directory) / 'preview'
            (source / 'looks').mkdir(parents=True)
            (preview / 'looks').mkdir(parents=True)
            (source / 'looks' / '01.png').touch()
            (preview / 'looks' / '01.avif').touch()
            manifest = {'version': 1, 'categories': {'Looks': {'directory': 'looks', 'items': [
                {'id': 'look-001', 'name': '有圖', 'source': '01.png', 'preview': '01.avif'},
            ]}}}
            items = {'Looks': [{'zh': '有圖'}, {'zh': '無圖', 'meta': {'referenceImageOptional': True}}]}
            with (mock.patch.object(sync_to_json, 'WARDROBE_SOURCE_IMAGE_ROOT', str(source)),
                  mock.patch.object(sync_to_json, 'WARDROBE_PREVIEW_IMAGE_ROOT', str(preview)),
                  mock.patch.object(sync_to_json, 'EXPECTED_WARDROBE_REFERENCE_CATEGORIES', {'Looks': 'looks'})):
                self.assertEqual(sync_to_json.merge_wardrobe_reference_images(items, manifest), 1)
                self.assertNotIn('referenceImage', items['Looks'][1]['meta'])
                items['Looks'][1]['meta'] = {}
                with self.assertRaises(sync_to_json.SyncValidationError):
                    sync_to_json.merge_wardrobe_reference_images(items, manifest)
