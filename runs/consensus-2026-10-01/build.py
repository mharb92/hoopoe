"""Build the multi-model consensus handoff package (chat 32).

Inputs (all in the repo, nothing live):
  runs/ext-compare-2026-09-29/review-queue.csv  the 1,291-row review queue
  runs/ext-compare-2026-09-29/ours.json         our current staged values, all 3,241 ids
  docs/dr/romanization-map.md                   the D262 scheme, copied verbatim

Outputs:
  package/            what goes to the reviewer (no answers in it)
  answer-key.json     our values + queue reasons for every id sent; never shipped
  control-ids.json    the 60 trusted rows mixed in as a control group; never shipped
"""
import csv, json, random, re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RUN = Path(__file__).resolve().parent
PKG = RUN / 'package'
SEED = 20261001
BATCH = 25
EXCLUDED = {2127, 2175}          # the two known errors: fixed separately, not re-judged
EXAMPLE_IDS = [22, 69, 76, 211, 503, 180, 130, 4]
N_CONTROLS = 60

ours = {r['id']: r for r in json.load(open(ROOT / 'runs/ext-compare-2026-09-29/ours.json'))}
queue = list(csv.DictReader(open(ROOT / 'runs/ext-compare-2026-09-29/review-queue.csv')))
queue_ids = [int(r['our_id']) for r in queue if int(r['our_id']) not in EXCLUDED]
queue_by_id = {int(r['our_id']): r for r in queue}

rng = random.Random(SEED)
pool = sorted(i for i, r in ours.items()
              if r['confidence'] == 3 and i not in queue_by_id and i not in EXAMPLE_IDS)
controls = sorted(rng.sample(pool, N_CONTROLS))

ids = queue_ids + controls
rng.shuffle(ids)

HARAKAT = re.compile(r'[\u064B-\u0652\u0670]')   # tanween, short vowels, shadda, sukun, dagger alif

def bare(arabic):
    """Arabic with every vowel mark and shadda removed, so the vowelling is the model's own."""
    return HARAKAT.sub('', arabic)

def model_input(i):
    r = ours[i]
    return {'id': i, 'arabic': bare(r['arabic']), 'english': r['english'], 'pos': r['pos']}

if PKG.exists():
    shutil.rmtree(PKG)
(PKG / 'batches').mkdir(parents=True)

rows = [model_input(i) for i in ids]
with open(PKG / 'input.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=['id', 'arabic', 'english', 'pos'])
    w.writeheader(); w.writerows(rows)
for n in range(0, len(rows), BATCH):
    b = rows[n:n + BATCH]
    (PKG / 'batches' / f'batch-{n // BATCH + 1:03d}.json').write_text(
        json.dumps(b, ensure_ascii=False, indent=1), encoding='utf-8')

shutil.copy(ROOT / 'docs/dr/romanization-map.md', PKG / 'romanization-rules.md')

key = {}
for i in ids:
    r, q = ours[i], queue_by_id.get(i, {})
    key[i] = {
        'control': i in controls, 'level': r['level'],
        'arabic': r['arabic'], 'english': r['english'], 'pos': r['pos'],
        'our_romanization': r['romanization'], 'our_vowelled': r['vocalised'],
        'confidence_now': r['confidence'],
        'hold_reasons': q.get('reasons', ''), 'issues': q.get('issues', ''),
        'external_verdict': q.get('external_verdict', ''), 'external_fix': q.get('external_fix', ''),
        'their_word': q.get('their_word', ''), 'their_meaning': q.get('their_meaning', ''),
    }
(RUN / 'answer-key.json').write_text(json.dumps(key, ensure_ascii=False, indent=1), encoding='utf-8')
(RUN / 'control-ids.json').write_text(json.dumps(controls), encoding='utf-8')

ex = [ours[i] for i in EXAMPLE_IDS]
(RUN / 'examples-source.json').write_text(json.dumps(ex, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'queue {len(queue_ids)} + controls {len(controls)} = {len(ids)} rows, '
      f'{(len(ids) + BATCH - 1) // BATCH} batches of {BATCH}')

# ---- prompt and reference files -------------------------------------------
SRC = RUN / 'src'
rom = (ROOT / 'docs/dr/romanization-map.md').read_text(encoding='utf-8')
rom_1_to_4 = rom.split('\n## 5.')[0].strip()        # §5 is about grading learners; not needed here
dialect = (SRC / 'dialect-rules.md').read_text(encoding='utf-8').strip()
examples = json.loads((SRC / 'examples.json').read_text(encoding='utf-8'))

TRIMS = [  # internal references and history the models do not need; meaning unchanged
    ("Target variety: urban Palestinian. Rows that are themselves rural or Hebron variants romanize their own pronunciation, not the urban one.\n\n",
     "Target variety: urban Palestinian, as spoken in Ramallah.\n\n"),
    (" — the Arabic script is on screen at every `script_stage` (§C4.8), so the romanization",
     " — the Arabic script is always shown beside it, so the romanization"),
    (" The validator rejects anything else — see `tools/dr/validate.mjs`.", ""),
    (" Leading, trailing and doubled spaces are rejected too; `rulefix.mjs` collapses those first. The space had been missing from this list since D47 because the section was written about single words, and 879 of 2,728 rows are phrases.",
     " No leading, trailing or doubled spaces."),
    ("Note what left the set: `2`, `6` and `9` are gone. `2` is not a glottal stop and not a [q]; the emphatics are capitals rather than digit-plus-modifier. The digit set is now `3` and `7` only.",
     "Do not use `2`, `6` or `9`: the only digits are `3` and `7`, and the emphatics are capitals."),
    ("**[q] is not restricted to rural variants.** A rural or Hebron row writes what that variant says — `q`, `k` or `g` — with the variety named in `notes`, and that has always been true. What §1.1 previously got wrong is that urban Palestinian *also* keeps [q] in the MSA-borrowed, religious and proper-noun stratum. `qur'aan` is urban and is not a variant.",
     "Urban Palestinian keeps [q] in MSA-borrowed, religious and proper-noun words: `qur'aan`."),
]

def rom_for_models(text):
    """§1-§3 of the map verbatim (minus its internal source line), then a plain-language §4 for the models."""
    body = text.split('\n', 1)[1]
    body = re.sub(r'^Spec source:.*?\n\n', '', body.strip(), flags=re.S)
    head = body.split('\n## 4.')[0].strip()
    for a, b in TRIMS:
        assert a in head, a[:60]
        head = head.replace(a, b)
    return head + '\n\n' + (SRC / 'judgement-calls.md').read_text(encoding='utf-8').strip()

ex_md = []
for e in examples:
    note = f"*{e['illustration']}*\n\n" if 'illustration' in e else ''
    ex_md.append(note + 'Input:\n```json\n' + json.dumps(e['input'], ensure_ascii=False)
                 + '\n```\nOutput:\n```json\n' + json.dumps(e['output'], ensure_ascii=False) + '\n```')

system = '\n\n'.join([
    (SRC / 'prompt-header.md').read_text(encoding='utf-8').strip(),
    '# Romanization scheme (binding)\n\n' + rom_for_models(rom_1_to_4),
    dialect.replace('# Dialect rules', '# Dialect rules (binding)', 1),
    '# Worked examples\n\n' + '\n\n'.join(ex_md),
])
user = (SRC / 'user-template.md').read_text(encoding='utf-8').strip()

(PKG / 'prompt.md').write_text(
    '# Prompt\n\nUse the **system prompt** below unchanged, for every batch and every model. '
    'Then send one batch per request using the **user message**, with `{{N}}` replaced by the number '
    'of entries and `{{BATCH_JSON}}` by the contents of one file from `batches/`.\n\n'
    '## System prompt\n\n````text\n' + system + '\n````\n\n'
    '## User message\n\n````text\n' + user + '\n````\n', encoding='utf-8')
(PKG / 'system-prompt.txt').write_text(system + '\n', encoding='utf-8')
(PKG / 'user-message-template.txt').write_text(user + '\n', encoding='utf-8')
shutil.copy(SRC / 'dialect-rules.md', PKG / 'dialect-rules.md')

with open(PKG / 'examples.csv', 'w', newline='', encoding='utf-8') as f:
    cols = ['id', 'arabic', 'english', 'pos', 'romanization', 'vowelled_arabic',
            'pronunciation_confidence', 'meaning_ok', 'meaning_fix', 'dialect',
            'palestinian_alternative', 'reasoning']
    w = csv.DictWriter(f, fieldnames=cols)
    w.writeheader()
    for e in examples:
        w.writerow({**e['input'], **e['output']})
print('prompt', len(system), 'chars')
for name in ['README.md', 'scoring.md', 'check_output.py']:
    shutil.copy(SRC / name, PKG / name)
