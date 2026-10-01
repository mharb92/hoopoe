"""Check one model's results before sending them back.

Usage:
    python3 check_output.py results-claude.json
    python3 check_output.py results-claude.csv
    python3 check_output.py results-claude/          (a folder of per-batch .json files)

Run it from the package folder (it reads input.csv from there). Python 3.8+, no installs.
Prints every problem, writes them to <name>-problems.csv, and ends with OK or FAILED.
"""
import csv, json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
KEYS = ['id', 'romanization', 'vowelled_arabic', 'pronunciation_confidence', 'meaning_ok',
        'meaning_fix', 'dialect', 'palestinian_alternative', 'reasoning']
ENUMS = {
    'pronunciation_confidence': {'high', 'medium', 'low'},
    'meaning_ok': {'yes', 'partly', 'no'},
    'dialect': {'palestinian', 'pan_levantine', 'other_levantine', 'msa', 'unsure'},
}
TOKEN = r"(?:[a-z37'\-]|TH|D|S|T)+"
ROMANIZATION = re.compile(rf"^{TOKEN}(?: {TOKEN})*$")
HARAKAT = re.compile(r'[ً-ْٰ]')
NOT_ARABIC = re.compile(r'[A-Za-z֐-׿]')   # Latin or Hebrew letters
ARABIC_LETTER = re.compile(r'[ء-ي]')


def load(path):
    p = Path(path)
    if p.is_dir():
        rows = []
        for f in sorted(p.glob('*.json')):
            rows += parse_json(f.read_text(encoding='utf-8'), f.name)
        return rows
    text = p.read_text(encoding='utf-8-sig')
    if p.suffix.lower() == '.csv':
        return list(csv.DictReader(text.splitlines()))
    return parse_json(text, p.name)


def parse_json(text, name):
    text = text.strip()
    if text.startswith('```'):
        text = re.sub(r'^```\w*\n|\n```$', '', text)
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        try:   # one JSON object per line
            data = [json.loads(line) for line in text.splitlines() if line.strip()]
        except json.JSONDecodeError as e:
            sys.exit(f'{name}: not valid JSON ({e}). Re-run that batch.')
    if isinstance(data, dict):
        data = [data]
    flat = []
    for d in data:   # tolerate an array of per-batch arrays
        flat += d if isinstance(d, list) else [d]
    return flat


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    target = sys.argv[1]
    inputs = {int(r['id']): r for r in csv.DictReader(open(HERE / 'input.csv', encoding='utf-8'))}
    rows = load(target)
    problems, seen = [], {}

    def bad(rid, field, msg):
        problems.append({'id': rid, 'field': field, 'problem': msg})

    for r in rows:
        try:
            rid = int(str(r.get('id', '')).strip())
        except ValueError:
            bad(r.get('id'), 'id', 'missing or not a number')
            continue
        if rid not in inputs:
            bad(rid, 'id', 'not in input.csv')
            continue
        if rid in seen:
            bad(rid, 'id', 'answered more than once')
        seen[rid] = r
        for k in KEYS:
            if k not in r:
                bad(rid, k, 'missing key')
        for k, allowed in ENUMS.items():
            v = str(r.get(k, '')).strip()
            if v not in allowed:
                bad(rid, k, f'"{v}" is not one of {sorted(allowed)}')
        rom = str(r.get('romanization', ''))
        if not ROMANIZATION.match(rom):
            bad(rid, 'romanization', f'"{rom}" uses characters or spacing outside the scheme')
        voc = str(r.get('vowelled_arabic', ''))
        if NOT_ARABIC.search(voc):
            bad(rid, 'vowelled_arabic', f'contains Latin or Hebrew letters: "{voc}"')
        elif not ARABIC_LETTER.search(voc):
            bad(rid, 'vowelled_arabic', 'empty or has no Arabic letters')
        elif not HARAKAT.search(voc):
            bad(rid, 'vowelled_arabic', f'no vowel marks at all: "{voc}"')
        if str(r.get('meaning_ok', '')).strip() in {'partly', 'no'} and not str(r.get('meaning_fix', '')).strip():
            bad(rid, 'meaning_fix', 'meaning_ok is partly/no but meaning_fix is empty')
        if not str(r.get('reasoning', '')).strip():
            bad(rid, 'reasoning', 'empty')

    for rid in inputs:
        if rid not in seen:
            bad(rid, 'id', 'no answer for this entry')

    for p in problems:
        print(f"{p['id']}\t{p['field']}\t{p['problem']}")
    out = Path(target.rstrip('/')).with_name(Path(target.rstrip('/')).stem + '-problems.csv')
    with open(out, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['id', 'field', 'problem'])
        w.writeheader()
        w.writerows(problems)
    print(f'\n{len(seen)} of {len(inputs)} entries answered, {len(problems)} problems '
          f'(listed in {out.name}).')
    print('OK' if not problems else 'FAILED: re-run the batches containing these ids, then check again.')
    sys.exit(1 if problems else 0)


if __name__ == '__main__':
    main()
