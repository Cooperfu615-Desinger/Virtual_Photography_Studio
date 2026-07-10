import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
WARDROBE_MANIFEST = BASE_DIR / 'knowledge_base' / 'wardrobe_reference_manifest.json'
CHARACTER_MANIFEST = BASE_DIR / 'knowledge_base' / 'character_reference_manifest.json'
WARDROBE_SOURCE_ROOT = BASE_DIR / 'source-assets' / 'wardrobe'
WARDROBE_PREVIEW_ROOT = BASE_DIR / 'webapp' / 'public' / 'reference' / 'wardrobe'
CHARACTER_SOURCE_ROOT = BASE_DIR / 'source-assets' / 'character-cards'
CHARACTER_PREVIEW_ROOT = BASE_DIR / 'webapp' / 'public' / 'character-cards'


def load_json(path):
    with path.open('r', encoding='utf-8') as file_handle:
        return json.load(file_handle)


def collect_preview_jobs():
    jobs = []
    wardrobe_manifest = load_json(WARDROBE_MANIFEST)
    for category in wardrobe_manifest.get('categories', {}).values():
        directory = category['directory']
        for item in category['items']:
            jobs.append((
                WARDROBE_SOURCE_ROOT / directory / item['source'],
                WARDROBE_PREVIEW_ROOT / directory / item['preview'],
            ))

    character_manifest = load_json(CHARACTER_MANIFEST)
    for item in character_manifest.get('items', []):
        jobs.append((
            CHARACTER_SOURCE_ROOT / item['directory'] / item['source'],
            CHARACTER_PREVIEW_ROOT / item['directory'] / item['preview'],
        ))
    return jobs


def build_preview(ffmpeg, source, output, size, crf, force):
    if not source.is_file():
        raise FileNotFoundError(f'Missing source image: {source}')
    if not force and output.is_file() and output.stat().st_mtime >= source.stat().st_mtime:
        return False

    output.parent.mkdir(parents=True, exist_ok=True)
    temporary_output = output.with_name(f'{output.stem}.tmp{output.suffix}')
    command = [
        ffmpeg,
        '-y',
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        str(source),
        '-vf',
        f'scale=min({size}\\,iw):-2',
        '-frames:v',
        '1',
        '-c:v',
        'libsvtav1',
        '-crf',
        str(crf),
        '-preset',
        '8',
        str(temporary_output),
    ]
    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
        os.replace(temporary_output, output)
    finally:
        if temporary_output.exists():
            temporary_output.unlink()
    return True


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description='Build deployment-safe AVIF image previews')
    parser.add_argument('--force', action='store_true', help='rebuild previews even when they are current')
    parser.add_argument('--size', type=int, default=640, help='maximum preview width in pixels')
    parser.add_argument('--crf', type=int, default=36, help='SVT-AV1 constant quality value')
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        print('ERROR: ffmpeg is required to build image previews', file=sys.stderr)
        return 1

    jobs = collect_preview_jobs()
    rebuilt = 0
    try:
        for source, output in jobs:
            rebuilt += build_preview(ffmpeg, source, output, args.size, args.crf, args.force)
    except (FileNotFoundError, subprocess.CalledProcessError) as error:
        print(f'ERROR: {error}', file=sys.stderr)
        return 1

    print(f'Image previews ready: {len(jobs)} total, {rebuilt} rebuilt.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
