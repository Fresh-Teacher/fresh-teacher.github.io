import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('repair', Path(__file__).resolve().parents[2] / 'scripts/repair_document_links.py')
repair = importlib.util.module_from_spec(spec)
spec.loader.exec_module(repair)


class LinkRepairTest(unittest.TestCase):
    def test_missing_class_repository_is_tried(self):
        self.assertIn('https://raw.githubusercontent.com/Fresh-Teacher/p1/HEAD/test.pdf', repair.candidates('https://fresh-teacher.github.io/test.pdf', {}, 'p1'))

    def test_retired_six_domain_tries_notes_and_past_papers(self):
        options = repair.candidates('https://s6-fresh-teacher.vercel.app/test.pdf', {})
        self.assertIn('https://raw.githubusercontent.com/Fresh-Teacher/s6-notes/HEAD/test.pdf', options)
        self.assertIn('https://raw.githubusercontent.com/Fresh-Teacher/s6-past-papers/HEAD/test.pdf', options)

    def test_hash_and_spaces_are_encoded_without_losing_filename(self):
        self.assertEqual(repair.safe_url('https://example.com/a #1.pdf'), 'https://example.com/a%20%231.pdf')

    def test_only_verified_pdf_is_accepted(self):
        with patch.object(repair, 'verify_pdf', side_effect=[{'status': 'not_pdf'}, {'status': 'verified'}]):
            self.assertEqual(repair.resolve('old', ['html', 'pdf'], {})['resolvedUrl'], 'pdf')

    def test_temporary_failure_is_not_called_missing(self):
        with patch.object(repair, 'verify_pdf', return_value={'status': 'retry'}):
            self.assertEqual(repair.resolve('old', ['candidate'], {})['status'], 'retry')


if __name__ == '__main__':
    unittest.main()