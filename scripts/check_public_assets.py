import json
import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_ROOT = BASE_DIR / 'webapp' / 'public'
WARDROBE_PREVIEW_ROOT = PUBLIC_ROOT / 'reference' / 'wardrobe'
CHARACTER_PREVIEW_ROOT = PUBLIC_ROOT / 'character-cards'
MAX_PUBLIC_BYTES = 15 * 1024 * 1024
MAX_SINGLE_FILE_BYTES = 512 * 1024


def load_json(path):
    with path.open('r', encoding='utf-8') as file_handle:
        return json.load(file_handle)


def expected_preview_paths():
    paths = set()
    wardrobe_manifest = load_json(BASE_DIR / 'knowledge_base' / 'wardrobe_reference_manifest.json')
    for category in wardrobe_manifest.get('categories', {}).values():
        for item in category.get('items', []):
            paths.add(WARDROBE_PREVIEW_ROOT / category['directory'] / item['preview'])

    character_manifest = load_json(BASE_DIR / 'knowledge_base' / 'character_reference_manifest.json')
    for item in character_manifest.get('items', []):
        paths.add(CHARACTER_PREVIEW_ROOT / item['directory'] / item['preview'])
    return paths


def main():
    files = [path for path in PUBLIC_ROOT.rglob('*') if path.is_file() and not path.name.startswith('.')]
    total_bytes = sum(path.stat().st_size for path in files)
    errors = []

    if total_bytes > MAX_PUBLIC_BYTES:
        errors.append(f'public assets total {total_bytes} bytes exceeds {MAX_PUBLIC_BYTES}')

    oversized = [path for path in files if path.stat().st_size > MAX_SINGLE_FILE_BYTES]
    if oversized:
        errors.append('oversized public files: ' + ', '.join(str(path.relative_to(BASE_DIR)) for path in oversized))

    actual_reference_previews = {
        path
        for root in (WARDROBE_PREVIEW_ROOT, CHARACTER_PREVIEW_ROOT)
        if root.exists()
        for path in root.rglob('*')
        if path.is_file() and not path.name.startswith('.')
    }
    expected_previews = expected_preview_paths()
    if actual_reference_previews != expected_previews:
        errors.append(
            'reference preview manifest mismatch; '
            f'missing={sorted(str(path.relative_to(BASE_DIR)) for path in expected_previews - actual_reference_previews)}, '
            f'unexpected={sorted(str(path.relative_to(BASE_DIR)) for path in actual_reference_previews - expected_previews)}'
        )

    non_avif = sorted(path for path in actual_reference_previews if path.suffix.lower() != '.avif')
    if non_avif:
        errors.append('non-AVIF reference previews: ' + ', '.join(str(path.relative_to(BASE_DIR)) for path in non_avif))

    if errors:
        for error in errors:
            print(f'ERROR: {error}', file=sys.stderr)
        return 1

    print(f'Public asset check passed: {len(files)} files, {total_bytes} bytes total.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
