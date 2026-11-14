import importlib.util
from pathlib import Path
import tempfile
import unittest
import json

spec = importlib.util.spec_from_file_location('pages', Path(__file__).resolve().parents[2] / 'scripts/prepare_github_pages.py')
if spec is None or spec.loader is None:
    raise RuntimeError('Pages script unavailable')
pages = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pages)


class PagesTests(unittest.TestCase):
    def test_legacy_html_address_is_a_file_not_a_redirect_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / 'dist'
            for path in ['p1.html', '_shell', 'local-media']:
                (output / path).mkdir(parents=True)
            (output / 'index.html').write_text('homepage')
            (output / 'ads.txt').write_text('google.com, pub-8782637659456848, DIRECT, f08c47fec0942fa0')
            (output / 'p1.html/index.html').write_text('class resources')
            (output / '_shell/index.html').write_text('app shell')
            (root / 'src/data/legacy').mkdir(parents=True)
            (root / 'src/data/resource-manifest.json').write_text(json.dumps({'p1.html': {}}))
            (root / 'src/data/legacy/manifest.json').write_text('{}')
            (output / 'sitemap.xml').write_text('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://fresh-teacher.github.io/</loc></url><url><loc>https://fresh-teacher.github.io/p1.html</loc></url></urlset>')
            (output / 'robots.txt').write_text('User-agent: Googlebot\nAllow: /\n\nUser-agent: *\nAllow: /\n\nSitemap: https://fresh-roots-reading-garden.lovable.app/sitemap.xml\n')
            pages.prepare(output, root)
            self.assertEqual((output / 'p1.html').read_text(), 'class resources')
            self.assertEqual((output / '404.html').read_text(), 'app shell')
            self.assertTrue((output / '.nojekyll').is_file())
            self.assertIn('Sitemap: https://fresh-teacher.github.io/sitemap.xml', (output / 'robots.txt').read_text())
            self.assertIn('User-agent: Googlebot\nAllow: /', (output / 'robots.txt').read_text())

    def test_sitemap_missing_output_blocks_deployment(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            (output / 'sitemap.xml').write_text('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://fresh-teacher.github.io/doc/missing</loc></url></urlset>')
            with self.assertRaisesRegex(ValueError, 'Missing generated sitemap page'):
                pages.verify_sitemap(output)

    def test_sitemap_wrong_origin_blocks_deployment(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            (output / 'sitemap.xml').write_text('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://fresh-roots-reading-garden.lovable.app/</loc></url></urlset>')
            with self.assertRaisesRegex(ValueError, 'production origin'):
                pages.verify_sitemap(output)

    def test_sitemap_directory_is_materialized_as_xml(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            (output / 'sitemap.xml').mkdir()
            xml = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://fresh-teacher.github.io/</loc></url></urlset>'
            (output / 'sitemap.xml/index.html').write_text(xml)
            (output / 'index.html').write_text('public homepage')
            (output / 'robots.txt').write_text('User-agent: *\nAllow: /')
            self.assertEqual(pages.verify_sitemap(output), 1)
            self.assertEqual((output / 'sitemap.xml').read_text(), xml)

    def test_missing_media_blocks_deployment(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            (output / 'index.html').write_text('homepage')
            (output / 'ads.txt').write_text('publisher')
            with self.assertRaisesRegex(ValueError, 'standalone export'):
                pages.prepare(output)