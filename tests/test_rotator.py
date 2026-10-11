import json
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from rotate import build

class TestHourlyRotation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.library = json.loads((ROOT / 'content' / 'essays.json').read_text(encoding='utf-8'))

    def test_all_passages_have_french_and_english(self):
        for topic in self.library['topics']:
            for entry in [topic['intro'], *topic['scenes'], *topic['reflections'], *topic['endings']]:
                self.assertGreater(len(entry['fr']), 25)
                self.assertGreater(len(entry['en']), 25)

    def test_216_unique_consecutive_hours(self):
        start = datetime(2026, 10, 11, 12, tzinfo=timezone.utc)
        signatures = []
        for hour in range(216):
            p = build(start + timedelta(hours=hour), self.library)
            self.assertEqual(len(p['paragraphs']), 6)
            self.assertGreater(p['word_count'], 150)
            signatures.append((p['title'], tuple(x['fr'] for x in p['paragraphs'])))
        self.assertEqual(len(signatures), len(set(signatures)))
        self.assertEqual(signatures[0], (build(start + timedelta(hours=216), self.library)['title'], tuple(x['fr'] for x in build(start + timedelta(hours=216), self.library)['paragraphs'])))

    def test_same_utc_hour_is_stable(self):
        a = datetime(2026, 10, 11, 18, 2, tzinfo=timezone.utc)
        b = datetime(2026, 10, 11, 18, 59, tzinfo=timezone.utc)
        self.assertEqual(build(a, self.library), build(b, self.library))

    def test_published_json_matches_structure(self):
        obj = json.loads((ROOT / 'current.json').read_text(encoding='utf-8'))
        self.assertEqual(len(obj['paragraphs']), 6)
        self.assertIn('hour_utc', obj)

if __name__ == '__main__': unittest.main()