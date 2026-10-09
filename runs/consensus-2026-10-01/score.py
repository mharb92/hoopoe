"""Score the consensus run (chat 34) per src/scoring.md, including its chat 34 section.

Inputs (all in this folder): answer-key.json, control-ids.json, results/<runner>/<model>/batch-*.json.
Outputs: scored/. Nothing is written to the database.

    python3 score.py      controls first; stops with exit 2 if the 70% gate fails
"""
import csv, json, re, sys, unicodedata
from pathlib import Path

RUN = Path(__file__).resolve().parent
OUT = RUN / 'scored'
SCORED = ['omar/opus-5.5', 'marwan/gpt-6.1-sol', 'omar/gemini-3.8-flash']   # newest per maker
EVIDENCE = ['omar/opus-5', 'omar/opus-4.8', 'marwan/sonnet-5.5', 'omar/gpt-5.6-sol', 'omar/gpt-5.6-terra']
FIELDS = ['romanization', 'vowelled_arabic', 'pronunciation_confidence', 'meaning_ok', 'meaning_fix',
          'dialect', 'palestinian_alternative', 'reasoning']
GATE_AB = 0.70
GATE_C = 0.95

MARKS = re.compile(r'[\u064B-\u0650\u0652\u0653-\u065F]')   # vowels, tanween, sukun, other marks; not shadda
NOT_ARABIC = re.compile(r'[^\u0621-\u064A\u0651\u064B-\u0652 ]')   # punctuation and anything else
REGIONAL = re.compile(r'galilee|gaza|hebron|khalil|nablus|jenin|jaffa|haifa|village|rural|fellah|bedouin|regional|northern|southern',
                      re.I)
OK_DIALECT = {'palestinian', 'pan_levantine'}


def norm(s):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFC', s or '')).strip()


def _arabic(s):
    s = norm(s).replace('\u0649\u0670', '\u0649').replace('\u0670', '\u0627')
    return re.sub(r'\s+', ' ', NOT_ARABIC.sub('', s.replace('\u0652', '').replace('\u0640', ''))).strip()


def letters(s):
    """Letters and shadda only: the vowelled-Arabic match key."""
    return MARKS.sub('', _arabic(s))


def _marks_key(s):
    s = _arabic(s)
    s = re.sub('\u064E(?=\u064A(?![\u064B-\u0651]))', '\u0650', s)   # fatha+ya (ee) equals kasra+ya
    s = re.sub('\u064E(?=\u0648(?![\u064B-\u0651]))', '\u064F', s)   # fatha+waw (oo) equals damma+waw
    # one cluster per letter, its marks sorted, so shadda+vowel order does not matter
    return [c[0] + ''.join(sorted(c[1:])) for c in re.findall(r'.[\u064B-\u0651]*', s)]


def marks_differ(a, b):
    return _marks_key(a) != _marks_key(b)


def rom_lvq(a, b):
    """True when a and b differ only in long-vowel quality (ee/ii, oo/uu)."""
    a, b = norm(a), norm(b)
    q = lambda s: s.replace('ee', 'ii').replace('oo', 'uu')
    return a != b and q(a) == q(b)


def msa_labelled(english):
    return bool(re.search(r'\bMSA\b|formal', english, re.I))


def flags(key, runs):
    out = []
    for n, r in enumerate(runs):
        if r['meaning_ok'] != 'yes':
            out.append(f'{n}:meaning {r["meaning_ok"]}')
        d = r['dialect']
        if d == 'other_levantine' or (d == 'msa' and not msa_labelled(key['english'])):
            out.append(f'{n}:dialect {d}')
        if norm(r['palestinian_alternative']):
            out.append(f'{n}:alternative')
    return out


def outcome(key, runs):
    """Outcome A-E for one word from the three scored runs (src/scoring.md)."""
    ours_r, ours_l = norm(key['our_romanization']), letters(key['our_vowelled'])
    rom = [norm(r['romanization']) for r in runs]
    let = [letters(r['vowelled_arabic']) for r in runs]
    exact = sum(x == ours_r for x in rom)
    lvq = sum(rom_lvq(x, ours_r) for x in rom)
    vow_ok = all(x == ours_l for x in let)
    unanimous = len(set(rom)) == 1 and len(set(let)) == 1
    fl = flags(key, runs)
    clean = not fl and all(r['dialect'] in OK_DIALECT or (r['dialect'] == 'msa' and msa_labelled(key['english']))
                           for r in runs) and all(r['pronunciation_confidence'] != 'low' for r in runs)
    if vow_ok and clean and exact == 3:
        o = 'A'
    elif vow_ok and clean and exact == 2 and lvq == 1:
        o = 'B'
    elif fl:
        o = 'D'
    elif any(r['pronunciation_confidence'] == 'low' for r in runs):
        o = 'E'
    elif unanimous and (rom[0] != ours_r or let[0] != ours_l):
        o = 'C'
    else:
        o = 'E'
    return {'outcome': o, 'exact': exact, 'lvq': lvq, 'vow_match': sum(x == ours_l for x in let),
            'unanimous': unanimous, 'unanimous_matches_ours': unanimous and rom[0] == ours_r and let[0] == ours_l,
            'short_vowel_diffs': sum(marks_differ(r['vowelled_arabic'], key['our_vowelled']) for r in runs),
            'flags': fl}


def control_rates(rows):
    n = len(rows)
    un = [r for r in rows if r['unanimous']]
    return {'n': n, 'ab': sum(r['outcome'] in 'AB' for r in rows) / n,
            'unanimous': len(un), 'unanimous_match': (sum(r['unanimous_matches_ours'] for r in un) / len(un)) if un else 0.0}


def load_run(name, ids):
    got = {}
    for f in sorted((RUN / 'results' / name).glob('batch-*.json')):
        for e in json.loads(f.read_text(encoding='utf-8')):
            got[str(e['id'])] = e
    missing = ids - got.keys()
    if missing:
        sys.exit(f'{name}: {len(missing)} ids missing, e.g. {sorted(missing)[:5]}')
    return got


def why(res, names):
    parts = [f'romanization {res["exact"]}/3 exact' + (f', {res["lvq"]} ee/ii-oo/uu only' if res['lvq'] else ''),
             f'vowelled letters {res["vow_match"]}/3']
    if res['short_vowel_diffs']:
        parts.append(f'short vowels differ in {res["short_vowel_diffs"]}/3')
    if res['flags']:
        parts.append('flags: ' + '; '.join(f'{names[int(f[0])]} {f[2:]}' for f in res['flags']))
    if res['unanimous'] and not res['unanimous_matches_ours']:
        parts.append('the three agree with each other, not with us')
    return '. '.join(parts)


def write_csv(path, rows, cols):
    with open(path, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction='ignore')
        w.writeheader()
        w.writerows(rows)


def main():
    key = json.loads((RUN / 'answer-key.json').read_text(encoding='utf-8'))
    controls = {str(i) for i in json.loads((RUN / 'control-ids.json').read_text())}
    ids = set(key)
    runs = {n: load_run(n, ids) for n in SCORED + EVIDENCE}
    short = {n: n.split('/')[1] for n in runs}
    OUT.mkdir(exist_ok=True)

    rows = []
    for i in sorted(ids, key=int):
        k = key[i]
        res = outcome(k, [runs[n][i] for n in SCORED])
        all_rom = {norm(runs[n][i]['romanization']) for n in runs} | {norm(k['our_romanization'])}
        regional = any(REGIONAL.search(runs[n][i]['reasoning'] or '') for n in runs) and bool(res['flags'])
        row = {'id': int(i), 'control': i in controls, 'level': k['level'], 'outcome': res['outcome'],
               'why': why(res, [short[n] for n in SCORED]), 'disagreement': len(all_rom),
               'possible_regional': 'yes' if regional else '', 'arabic': k['arabic'], 'english': k['english'],
               'pos': k['pos'], 'our_romanization': k['our_romanization'], 'our_vowelled': k['our_vowelled'],
               'confidence_now': k['confidence_now'], 'hold_reasons': k['hold_reasons'], **res}
        for n in SCORED + EVIDENCE:
            tag = short[n] + ('*' if n in SCORED else '')
            for fld in FIELDS:
                row[f'{tag} {fld}'] = runs[n][i].get(fld, '')
        rows.append(row)

    base = ['id', 'level', 'outcome', 'why', 'disagreement', 'possible_regional', 'arabic', 'english', 'pos',
            'our_romanization', 'our_vowelled', 'confidence_now', 'hold_reasons']
    run_cols = [f'{short[n]}{"*" if n in SCORED else ""} {fld}' for n in SCORED + EVIDENCE for fld in FIELDS]
    ctrl = [r for r in rows if r['control']]
    queue = [r for r in rows if not r['control']]
    rates = control_rates(ctrl)
    count = lambda rs: {o: sum(r['outcome'] == o for r in rs) for o in 'ABCDE'}
    write_csv(OUT / 'controls.csv', ctrl, base + run_cols)

    report = [f'# Consensus scoring\n',
              f'Scored runs: {", ".join(short[n] for n in SCORED)}. Evidence only: {", ".join(short[n] for n in EVIDENCE)}.\n',
              f'## Controls ({rates["n"]} trusted words)\n',
              f'Outcomes: {count(ctrl)}. **A or B: {rates["ab"]:.1%}** (gate {GATE_AB:.0%}). '
              f'Three runs unanimous on {rates["unanimous"]}; of those, {rates["unanimous_match"]:.1%} match ours '
              f'(automatic adoption needs {GATE_C:.0%}).\n']
    unan_wrong = [r for r in ctrl if r['unanimous'] and not r['unanimous_matches_ours']]
    if unan_wrong:
        report.append('Controls the three runs unanimously disagree with (each needs a look):\n')
        report += [f'- {r["id"]} {r["arabic"]} "{r["english"]}": ours `{r["our_romanization"]}` {r["our_vowelled"]}, '
                   f'runs `{norm(runs[SCORED[0]][str(r["id"])]["romanization"])}` '
                   f'{runs[SCORED[0]][str(r["id"])]["vowelled_arabic"]}' for r in unan_wrong]
        report.append('')
    if rates['ab'] < GATE_AB:
        report.append(f'**Gate failed: {rates["ab"]:.1%} of controls reach A or B, under {GATE_AB:.0%}. '
                      f'The queue is not scored until the thresholds are revisited (src/scoring.md).**\n')
        report += _diagnostics(ctrl)
        (OUT / 'report.md').write_text('\n'.join(report), encoding='utf-8')
        print('\n'.join(report))
        sys.exit(2)

    c_auto = rates['unanimous_match'] >= GATE_C
    for r in queue:
        r['result'] = {'A': 'raise to 3', 'B': 'raise to 3', 'C': 'adopt alternative' if c_auto else 'human',
                       'D': 'human', 'E': 'human'}[r['outcome']]
    raised = [r for r in queue if r['outcome'] in 'AB']
    review = sorted([r for r in queue if r['result'] == 'human'], key=lambda r: (r['level'], -r['disagreement'], r['id']))
    adopted = [r for r in queue if r['result'] == 'adopt alternative']
    write_csv(OUT / 'raised.csv', raised, ['id', 'level', 'outcome', 'arabic', 'english', 'our_romanization', 'our_vowelled', 'why'])
    write_csv(OUT / 'review.csv', [dict(r, decision='', notes='') for r in review], base + run_cols + ['decision', 'notes'])
    if adopted:
        write_csv(OUT / 'adopted.csv', adopted, base + run_cols[:2])
    report += [f'## Queue ({len(queue)} words)\n', f'Outcomes: {count(queue)}.\n',
               f'- Raised to 3: {len(raised)}', f'- Alternatives adopted automatically: {len(adopted)}',
               f'- To a person: {len(review)} (`review.csv`), of which levels 1-2: '
               f'{sum(r["level"] in (1, 2) for r in review)}; marked possible regional form: '
               f'{sum(bool(r["possible_regional"]) for r in review)}\n']
    report += _diagnostics(queue)
    (OUT / 'report.md').write_text('\n'.join(report), encoding='utf-8')
    print('\n'.join(report))


def _diagnostics(rows):
    """Why words miss A: helps any threshold revisit. Counts, not decisions."""
    miss = [r for r in rows if r['outcome'] not in 'AB']
    c = lambda f: sum(1 for r in miss if f(r))
    return ['### Why words miss A or B\n',
            f'- Romanization: fewer than 2 of 3 exact: {c(lambda r: r["exact"] < 2)}; '
            f'2 exact, third differs beyond ee/ii-oo/uu: {c(lambda r: r["exact"] == 2 and r["lvq"] == 0)}',
            f'- Vowelled letters not matched by all 3: {c(lambda r: r["vow_match"] < 3)}',
            f'- Any flag (meaning, dialect, alternative): {c(lambda r: bool(r["flags"]))}',
            f'- Romanization 3/3 and letters 3/3 but blocked by a flag, low confidence or `unsure`: '
            f'{c(lambda r: r["exact"] == 3 and r["vow_match"] == 3)}\n']


if __name__ == '__main__':
    main()
