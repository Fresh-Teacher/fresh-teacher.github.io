import importlib.util
from pathlib import Path
import unittest

script = Path(__file__).resolve().parents[2] / 'scripts' / 'export_standalone.py'
spec = importlib.util.spec_from_file_location('standalone_export', script)
if spec is None or spec.loader is None:
    raise RuntimeError('Export script unavailable')
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)


class StandaloneExportTests(unittest.TestCase):
    def test_relative_and_absolute_media_become_local(self):
        path = '/__l5e/assets-v1/123/cover.webp'
        mapping = {path: '/local-media/123/cover.webp'}
        self.assertEqual(exporter.rewrite_media(f'url("{path}")', mapping),
                         'url("/local-media/123/cover.webp")')
        self.assertEqual(exporter.rewrite_media(f'https://example.com{path}', mapping),
                         '/local-media/123/cover.webp')

    def test_missing_media_cannot_silently_ship(self):
        with self.assertRaises(ValueError):
            exporter.rewrite_media('/__l5e/assets-v1/123/missing.png', {})

    def test_documents_are_not_rewritten(self):
        url = 'https://github.com/Fresh-Teacher/Notes/raw/main/notes.pdf'
        self.assertEqual(exporter.rewrite_media(url, {}), url)

    def test_source_export_excludes_credentials_metadata_and_dependencies(self):
        for name in ('.git', '.env', '.env.production', 'node_modules', '.output',
                     '.workspace', 'secret.pem', '.dev.vars'):
            self.assertTrue(exporter.excluded(name), name)
        self.assertFalse(exporter.excluded('src'))


if __name__ == '__main__':
    unittest.main()