import tempfile
import unittest
from pathlib import Path
from unittest import mock

from scripts import sync_to_json


class WardrobeReferenceManifestTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        self.source_root = Path(self.temp_dir.name) / 'source'
        self.preview_root = Path(self.temp_dir.name) / 'preview'
        (self.source_root / 'looks').mkdir(parents=True)
        (self.preview_root / 'looks').mkdir(parents=True)

    def write_image_placeholders(self, source_files, preview_files):
        for file_name in source_files:
            (self.source_root / 'looks' / file_name).touch()
        for file_name in preview_files:
            (self.preview_root / 'looks' / file_name).touch()

    def test_manifest_matches_items_by_name_instead_of_row_order(self):
        self.write_image_placeholders(['01.png', '02.png'], ['01.avif', '02.avif'])
        grouped_data = {
            'Looks': [
                {'zh': '第二套', 'en': '', 'desc': ''},
                {'zh': '第一套', 'en': '', 'desc': ''},
            ],
        }
        manifest = {
            'version': 1,
            'categories': {
                'Looks': {
                    'directory': 'looks',
                    'items': [
                        {'id': 'look-001', 'name': '第一套', 'source': '01.png', 'preview': '01.avif'},
                        {'id': 'look-002', 'name': '第二套', 'source': '02.png', 'preview': '02.avif'},
                    ],
                },
            },
        }

        with (
            mock.patch.object(sync_to_json, 'WARDROBE_SOURCE_IMAGE_ROOT', str(self.source_root)),
            mock.patch.object(sync_to_json, 'WARDROBE_PREVIEW_IMAGE_ROOT', str(self.preview_root)),
            mock.patch.object(sync_to_json, 'EXPECTED_WARDROBE_REFERENCE_CATEGORIES', {'Looks': 'looks'}),
        ):
            merged_count = sync_to_json.merge_wardrobe_reference_images(grouped_data, manifest)

        self.assertEqual(merged_count, 2)
        self.assertEqual(grouped_data['Looks'][0]['meta']['referenceImageId'], 'look-002')
        self.assertEqual(grouped_data['Looks'][1]['meta']['referenceImageId'], 'look-001')

    def test_missing_preview_fails_instead_of_shifting_later_images(self):
        self.write_image_placeholders(['01.png'], [])
        grouped_data = {'Looks': [{'zh': '第一套', 'en': '', 'desc': ''}]}
        manifest = {
            'version': 1,
            'categories': {
                'Looks': {
                    'directory': 'looks',
                    'items': [
                        {'id': 'look-001', 'name': '第一套', 'source': '01.png', 'preview': '01.avif'},
                    ],
                },
            },
        }

        with (
            mock.patch.object(sync_to_json, 'WARDROBE_SOURCE_IMAGE_ROOT', str(self.source_root)),
            mock.patch.object(sync_to_json, 'WARDROBE_PREVIEW_IMAGE_ROOT', str(self.preview_root)),
            mock.patch.object(sync_to_json, 'EXPECTED_WARDROBE_REFERENCE_CATEGORIES', {'Looks': 'looks'}),
            self.assertRaises(sync_to_json.SyncValidationError),
        ):
            sync_to_json.merge_wardrobe_reference_images(grouped_data, manifest)


if __name__ == '__main__':
    unittest.main()
