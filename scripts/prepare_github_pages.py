"""Validate static output and preserve literal legacy .html addresses for Pages."""
from pathlib import Path
import argparse
import json
import shutil
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ORIGIN = 'https://fresh-teacher.github.io'
SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9'


def verify_sitemap(output: Path):
    sitemap = output / 'sitemap.xml'
    if sitemap.is_dir():
        xml = (sitemap / 'index.html').read_bytes()
        shutil.rmtree(sitemap)
        sitemap.write_bytes(xml)
    if not sitemap.is_file():
        raise ValueError('Missing prerendered sitemap.xml; deployment refused.')
    if sitemap.stat().st_size > 50 * 1024 * 1024:
        raise ValueError('Sitemap exceeds the XML size limit.')
    tree = ET.fromstring(sitemap.read_bytes())
    if tree.tag != f'{{{SITEMAP_NAMESPACE}}}urlset':
        raise ValueError('Invalid sitemap XML namespace.')
    urls = tree.findall(f'{{{SITEMAP_NAMESPACE}}}url')
    if not urls or len(urls) > 50000:
        raise ValueError('Invalid sitemap URL count.')
    seen = set()
    for entry in urls:
        loc = entry.findtext(f'{{{SITEMAP_NAMESPACE}}}loc') or ''
        url = urlsplit(loc)
        if f'{url.scheme}://{url.netloc}' != PUBLIC_ORIGIN or url.query or url.fragment:
            raise ValueError(f'Sitemap must use the production origin without query strings: {loc}')
        if loc in seen:
            raise ValueError(f'Duplicate sitemap URL: {loc}')
        seen.add(loc)
        path = unquote(url.path).lstrip('/')
        target = (output / path).resolve()
        if not target.is_relative_to(output.resolve()):
            raise ValueError('Unsafe sitemap path.')
        if target.is_dir():
            target = target / 'index.html'
        if not target.is_file():
            raise ValueError(f'Missing generated sitemap page: {url.path}')
        if 'noindex' in target.read_text().lower():
            raise ValueError(f'Sitemap includes a noindex page: {url.path}')
    robots = output / 'robots.txt'
    if not robots.is_file():
        raise ValueError('Missing robots.txt; deployment refused.')
    # Preserve every crawler block; only the build-specific Sitemap directive changes.
    lines = [line for line in robots.read_text().splitlines() if not line.strip().lower().startswith('sitemap:')]
    robots.write_text('\n'.join(lines).rstrip() + f'\n\nSitemap: {PUBLIC_ORIGIN}/sitemap.xml\n')
    return len(urls)


def prepare(output: Path, source: Path = ROOT):
    if not (output / 'index.html').is_file():
        raise ValueError('Missing prerendered homepage; deployment refused.')
    if not (output / 'ads.txt').is_file():
        raise ValueError('Missing ads.txt; deployment refused.')
    if not (output / 'local-media').is_dir():
        raise ValueError('Use the standalone export with local media before deploying.')
    for path in output.rglob('*'):
        if path.is_file() and path.suffix in {'.html', '.js', '.css', '.json', '.webmanifest'}:
            if '/__l5e/assets-v1/' in path.read_text():
                raise ValueError(f'Unresolved Lovable media in {path}; deployment refused.')
    paths = set()
    for name in ('resource-manifest.json', 'legacy/manifest.json'):
        paths.update(json.loads((source / 'src/data' / name).read_text()))
    for path in sorted(paths):
        if not path.endswith('.html') or path == 'index.html':
            continue
        target = output / path
        if target.is_dir():
            html = (target / 'index.html').read_bytes()
            shutil.rmtree(target)
            target.write_bytes(html)
        elif not target.is_file():
            raise ValueError(f'Missing legacy page: {path}')
    # GitHub Pages serves this for unenumerated client routes (HTTP 404, not 200).
    # TanStack writes the shell as _shell.html; older layouts used _shell/index.html.
    shell = output / '_shell' / 'index.html'
    if not shell.is_file():
        flat = output / '_shell.html'
        if flat.is_file():
            shell = flat
        else:
            raise ValueError('Missing TanStack SPA shell; deployment refused.')
    shutil.copyfile(shell, output / '404.html')
    (output / '.nojekyll').touch()
    count = verify_sitemap(output)
    print(f'Verified sitemap.xml: {count} generated public pages and production robots.txt link.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path('dist/client'))
    args = parser.parse_args()
    prepare(args.output)
    print('Validated local media, ads.txt, legacy HTML pages, and client-route fallback.')