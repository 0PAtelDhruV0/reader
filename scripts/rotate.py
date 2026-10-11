#!/usr/bin/env python3
"""Replace the ONE live French essay. Standard library only; no external service."""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIBRARY = ROOT / 'content' / 'essays.json'
CURRENT = ROOT / 'current.json'


def build(when: datetime, library: dict):
    if when.tzinfo is None:
        raise ValueError('Timestamp must specify a timezone')
    hour = int(when.timestamp()) // 3600
    topics = library['topics']
    count = len(topics)
    topic_index = hour % count
    cycle = hour // count
    topic = topics[topic_index]
    scene_index = cycle % len(topic['scenes'])
    cycle //= len(topic['scenes'])
    reflection_index = cycle % len(topic['reflections'])
    cycle //= len(topic['reflections'])
    ending_index = cycle % len(topic['endings'])
    paragraphs = [
        topic['intro'],
        topic['scenes'][scene_index],
        topic['scenes'][(scene_index + 1) % len(topic['scenes'])],
        topic['reflections'][reflection_index],
        topic['reflections'][(reflection_index + 1) % len(topic['reflections'])],
        topic['endings'][ending_index],
    ]
    duration = count * len(topic['scenes']) * len(topic['reflections']) * len(topic['endings'])
    hour_start = datetime.fromtimestamp(hour * 3600, timezone.utc)
    french = ' '.join(p['fr'] for p in paragraphs)
    return {
        'id': f'{hour}',
        'hour_utc': hour_start.isoformat(timespec='seconds').replace('+00:00', 'Z'),
        'title': topic['title'],
        'title_en': topic['en_title'],
        'level': library['level'],
        'paragraphs': paragraphs,
        'word_count': len(french.split()),
        'unique_hours_before_repeat': duration,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--at', help='Timestamp with timezone (for testing), otherwise now UTC')
    args = parser.parse_args()
    now = datetime.fromisoformat(args.at.replace('Z', '+00:00')) if args.at else datetime.now(timezone.utc)
    library = json.loads(LIBRARY.read_text(encoding='utf-8'))
    passage = build(now, library)
    payload = json.dumps(passage, ensure_ascii=False, indent=2) + '\n'
    if CURRENT.exists() and CURRENT.read_text(encoding='utf-8') == payload:
        print('Already current:', passage['title'], passage['hour_utc'])
        return
    CURRENT.write_text(payload, encoding='utf-8')
    print('Published:', passage['title'], passage['hour_utc'], '|', passage['word_count'], 'words')


if __name__ == '__main__':
    main()