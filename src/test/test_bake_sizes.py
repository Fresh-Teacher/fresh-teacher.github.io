import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('bake', Path(__file__).resolve().parents[2] / 'scripts/bake_page_items.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class BakeSizesTest(unittest.TestCase):
    def test_sizes_are_preserved_in_shards_and_baked_pages(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'documents').mkdir()
            url = 'https://fresh-teacher.github.io/a.pdf'
            (root / 'documents/ab.json').write_text(json.dumps({'abcd': {'pdfUrl': url}}))
            for kind in ('legacy', 'resources', 'repositories'):
                (root / 'pages' / kind).mkdir(parents=True)
            (root / 'pages/legacy/a.json').write_text(json.dumps({'documentIds': ['abcd']}))
            self.assertEqual(module.bake(root, {url: 123456}), 1)
            self.assertEqual(json.loads((root / 'page-items/legacy/a.json').read_text())[0]['sizeBytes'], 123456)
            self.assertEqual(json.loads((root / 'documents/ab.json').read_text())['abcd']['sizeBytes'], 123456)

    def test_invalid_sizes_are_rejected(self):
        with self.assertRaises(ValueError):
            module.bake(Path('/not-used'), {'a': -1})

if __name__ == '__main__':
    unittest.main()