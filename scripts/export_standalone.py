"""Create an external-hosting source export with all pointer-backed media local."""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import re
import shutil
import time
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {'.git', '.lovable', '.workspace', '.site-import', 'node_modules',
            '.tanstack', '.nitro', '.output', '.vinxi', '.wrangler', 'dist',
            'dist-ssr', '__pycache__', '.pytest_cache'}
TEXT_EXTENSIONS = {'.tsx', '.ts', '.js', '.jsx', '.css', '.json', '.html',
                   '.webmanifest', '.md', '.svg', '.txt', '.xml'}
ASSET_PATH = re.compile(r'(?:https?://[^/\s"\'<>]+)?(/__l5e/assets-v1/[a-zA-Z0-9-]+/[^\s"\'<>?)\\;]+)')


def excluded(name: str) -> bool:
    return (name in EXCLUDED or name.startswith('.env') or name == '.dev.vars'
            or name.endswith(('.tsbuildinfo', '.log', '.pem', '.key', '.local')))


def rewrite_media(text: str, mapping: dict[str, str]) -> str:
    def replace(match: re.Match[str]) -> str:
        path = match.group(1)
        if path not in mapping:
            raise ValueError(f'Media has no project pointer: {path}')
        return mapping[path]
    return ASSET_PATH.sub(replace, text)


def export_project(source: Path, destination: Path, origin: str) -> dict:
    source, destination = source.resolve(), destination.resolve()
    if destination == source or source in destination.parents:
        raise ValueError('Export destination must be outside the project.')
    if destination.exists():
        raise ValueError('Use a new empty export destination.')
    pointers = [p for folder in ('src', 'public')
                for p in (source / folder).rglob('*.asset.json')]
    records = {json.loads(p.read_text())['url']: json.loads(p.read_text()) for p in pointers}
    if not records:
        raise ValueError('No media pointers found.')
    mapping = {url: '/local-media/' + data['asset_id'] + '/' + data['original_filename']
               for url, data in records.items()}
    shutil.copytree(source, destination,
                    ignore=lambda directory, names: [name for name in names if excluded(name)])

    def download(item: tuple[str, dict]) -> dict:
        url, record = item
        target = destination / 'public' / mapping[url].lstrip('/')
        target.parent.mkdir(parents=True, exist_ok=True)
        for attempt in range(3):
            try:
                request = Request(origin.rstrip('/') + url, headers={'User-Agent': 'curl/8.0'})
                with urlopen(request, timeout=60) as response:
                    payload = response.read()
                    content_type = response.headers.get('Content-Type', '')
                if not payload or ('text/html' in content_type and record['content_type'] != 'text/html'):
                    raise ValueError('Media request returned an empty file or a sign-in page.')
                if len(payload) != record['size']:
                    raise ValueError(f'Media size differs from its pointer: {url}')
                target.write_bytes(payload)
                return {'path': mapping[url], 'bytes': len(payload), 'type': record['content_type']}
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(attempt + 1)
        raise RuntimeError('Download failed.')

    with ThreadPoolExecutor(max_workers=8) as pool:
        media = list(pool.map(download, records.items()))
    rewritten = 0
    for path in destination.rglob('*'):
        if not path.is_file() or path.suffix not in TEXT_EXTENSIONS:
            continue
        text = path.read_text()
        updated = rewrite_media(text, mapping)
        if text != updated:
            path.write_text(updated)
            rewritten += 1
    # Pointer imports retain their existing shape; exported pointers become local descriptors.
    for pointer in pointers:
        target = destination / pointer.relative_to(source)
        data = json.loads(target.read_text())
        target.write_text(json.dumps({key: data[key] for key in
                                     ('url', 'original_filename', 'size', 'content_type')}, indent=2) + '\n')
    report = {'media_files': len(media), 'total_bytes': sum(row['bytes'] for row in media),
              'rewritten_files': rewritten, 'files': sorted(media, key=lambda row: row['path'])}
    (destination / 'standalone-media.json').write_text(json.dumps(report, indent=2) + '\n')
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--origin', default='https://id-preview--a2ec37fb-cb14-465c-8d0e-f4289476ddc6.lovable.app')
    args = parser.parse_args()
    report = export_project(ROOT, args.output, args.origin)
    print(f"Exported {report['media_files']} local media files ({report['total_bytes']} bytes).")
    print('External documents and third-party services still require internet access.')


if __name__ == '__main__':
    main()