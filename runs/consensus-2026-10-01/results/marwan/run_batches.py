"""Run the supplied dictionary batches through the authenticated Claude CLI.

Usage: python3 run_batches.py [--limit 1] [--models gpt claude] [--jobs-per-model 4]
Each model has up to four independent requests in flight by default.
No tools, MCP servers, skills, project context, or other model answers are supplied.
Valid existing answers are reused. Every attempt is saved without manual edits.
"""
import argparse
import concurrent.futures
import csv
import hashlib
import json
import os
import subprocess
import threading
import time
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import check_output as check

HERE = Path(__file__).resolve().parent
MODELS = {'gpt': 'gpt-6.1-sol[1m]', 'claude': 'claude-sonnet-5-5[1m]'}
PRINT_LOCK = threading.Lock()
TIMEOUT = 1200
MAX_ATTEMPTS = 3
EFFORT = 'xhigh'


def timestamp():
    return datetime.now(timezone.utc).isoformat()


def digest(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def log(message):
    with PRINT_LOCK:
        print(f'[{timestamp()}] {message}', flush=True)


def save_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def validate(text, entries):
    try:
        rows = json.loads(text)
    except json.JSONDecodeError as exc:
        return [f'Invalid JSON: {exc}']
    if not isinstance(rows, list) or not all(isinstance(r, dict) for r in rows):
        return ['Response must be an array of objects']
    problems = []
    if [r.get('id') for r in rows] != [r['id'] for r in entries]:
        problems.append('IDs do not match the batch exactly in input order')
    for row in rows:
        rid = row.get('id')
        if not isinstance(rid, int) or isinstance(rid, bool):
            problems.append(f'{rid}: id must be an integer')
        for key in check.KEYS:
            if key not in row:
                problems.append(f'{rid}: missing {key}')
            elif key != 'id' and not isinstance(row[key], str):
                problems.append(f'{rid}: {key} must be a string')
        for key, allowed in check.ENUMS.items():
            if str(row.get(key, '')) not in allowed:
                problems.append(f'{rid}: invalid {key}')
        romanization = str(row.get('romanization', ''))
        if not check.ROMANIZATION.fullmatch(romanization):
            problems.append(f'{rid}: romanization outside the scheme: {romanization!r}')
        arabic = str(row.get('vowelled_arabic', ''))
        if check.NOT_ARABIC.search(arabic):
            problems.append(f'{rid}: Arabic contains Latin or Hebrew letters')
        if not check.ARABIC_LETTER.search(arabic) or not check.HARAKAT.search(arabic):
            problems.append(f'{rid}: Arabic missing letters or vowel marks')
        if row.get('meaning_ok') in {'partly', 'no'} and not str(row.get('meaning_fix', '')).strip():
            problems.append(f'{rid}: missing meaning fix')
        if not str(row.get('reasoning', '')).strip():
            problems.append(f'{rid}: empty reasoning')
    return problems


def command(model, system_prompt):
    settings = json.dumps({'apiKeyHelper': 'ocm auth litellm --site llm.atko.ai',
                           'disableAllHooks': True})
    return ['claude', '--bare', '--setting-sources', '', '--settings', settings,
            '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--tools', '',
            '--disable-slash-commands', '--no-session-persistence', '--model', model,
            '--effort', EFFORT, '--system-prompt', system_prompt,
            '--output-format', 'stream-json', '--verbose', '--print']


def request(model, system_prompt, user_message, attempt_dir):
    env = os.environ.copy()
    for key in ['CLAUDECODE', 'CLAUDE_CODE_CHILD_SESSION', 'CLAUDE_CODE_SESSION_ID',
                'CLAUDE_CODE_MESSAGING_SOCKET', 'CLAUDE_CODE_MESSAGING_TOKEN']:
        env.pop(key, None)
    started = timestamp()
    timed_out = False
    try:
        proc = subprocess.run(command(model, system_prompt), input=user_message,
                              text=True, encoding='utf-8', capture_output=True,
                              cwd=HERE, env=env, timeout=TIMEOUT)
        stdout, stderr, exit_code = proc.stdout, proc.stderr, proc.returncode
    except subprocess.TimeoutExpired as exc:
        timed_out = True
        stdout, stderr, exit_code = exc.stdout or '', exc.stderr or '', -1
        if isinstance(stdout, bytes):
            stdout = stdout.decode('utf-8', errors='replace')
        if isinstance(stderr, bytes):
            stderr = stderr.decode('utf-8', errors='replace')
    (attempt_dir / 'cli-events.jsonl').write_text(stdout, encoding='utf-8')
    (attempt_dir / 'stderr.txt').write_text(stderr, encoding='utf-8')
    events = []
    for line in stdout.splitlines():
        try:
            events.append(json.loads(line))
        except json.JSONDecodeError:
            pass
    initial = next((e for e in events if e.get('type') == 'system' and
                    e.get('subtype') == 'init'), {})
    results = [e for e in events if e.get('type') == 'result']
    result = results[-1] if results else {}
    response_models = sorted({e.get('message', {}).get('model') for e in events
                              if e.get('type') == 'assistant' and e.get('message', {}).get('model')})
    text = result.get('result', '')
    if not isinstance(text, str):
        text = json.dumps(text, ensure_ascii=False)
    (attempt_dir / 'response.json').write_text(text, encoding='utf-8')
    failures = []
    if timed_out:
        failures.append(f'Request timed out after {TIMEOUT}s')
    if exit_code or not result or result.get('is_error') or result.get('subtype') != 'success':
        failures.append(f'CLI request failed: exit={exit_code}, result={result.get("subtype")}')
    if result.get('stop_reason') != 'end_turn':
        failures.append(f'Unexpected stop reason: {result.get("stop_reason")}')
    if initial.get('model') != model:
        failures.append(f'Requested model differs from initialized model: {initial.get("model")}')
    if response_models != [model.removesuffix('[1m]')]:
        failures.append(f'Unexpected response models: {response_models}')
    if initial.get('tools') != [] or initial.get('mcp_servers') != []:
        failures.append('Tools or MCP servers were not disabled')
    if any(block.get('type') == 'tool_use' for e in events if e.get('type') == 'assistant'
           for block in e.get('message', {}).get('content', [])):
        failures.append('Model attempted a tool call')
    server_tools = result.get('usage', {}).get('server_tool_use', {})
    if any(server_tools.get(key, 0) for key in ['web_search_requests', 'web_fetch_requests']):
        failures.append('Web tool usage was reported')
    metadata = {'requested_model': model, 'initialized_model': initial.get('model'),
                'response_models': response_models, 'started_at': started, 'finished_at': timestamp(),
                'system_prompt_sha256': digest(system_prompt), 'user_message_sha256': digest(user_message),
                'effort': EFFORT, 'temperature': 'not adjustable through this CLI',
                'tools': initial.get('tools'), 'mcp_servers': initial.get('mcp_servers'),
                'exit_code': exit_code, 'stop_reason': result.get('stop_reason'),
                'usage': result.get('usage'), 'model_usage': result.get('modelUsage'),
                'reported_cost_usd': result.get('total_cost_usd'), 'session_id': result.get('session_id'),
                'request_failures': failures}
    return text, metadata, failures


def run_model(name, batches, system_prompt, template):
    model = MODELS[name]
    output = HERE / f'results-{name}'
    artifacts = HERE / 'run-artifacts' / name
    output.mkdir(exist_ok=True)
    artifacts.mkdir(parents=True, exist_ok=True)
    failed = []
    for batch in batches:
        batch_text = batch.read_text(encoding='utf-8')
        entries = json.loads(batch_text)
        target = output / batch.name
        user_message = template.replace('{{N}}', str(len(entries))).replace('{{BATCH_JSON}}', batch_text)
        attempts_root = artifacts / batch.stem
        attempts_root.mkdir(exist_ok=True)
        if target.exists():
            provenance = []
            for path in attempts_root.glob('attempt-*/metadata.json'):
                metadata = json.loads(path.read_text(encoding='utf-8'))
                if (metadata.get('accepted') and metadata.get('requested_model') == model and
                        metadata.get('system_prompt_sha256') == digest(system_prompt) and
                        metadata.get('user_message_sha256') == digest(user_message) and
                        (path.parent / 'response.json').read_text(encoding='utf-8') == target.read_text(encoding='utf-8')):
                    provenance.append(path)
            if not validate(target.read_text(encoding='utf-8'), entries) and provenance:
                log(f'{name} {batch.name}: reuse verified existing answer')
                continue
            raise RuntimeError(f'{target} exists but is invalid or lacks matching provenance; refusing to overwrite')
        previous = [int(p.name.split('-')[-1]) for p in attempts_root.glob('attempt-*') if p.is_dir()]
        offset = max(previous, default=0)
        accepted = False
        for retry in range(1, MAX_ATTEMPTS + 1):
            attempt_dir = attempts_root / f'attempt-{offset + retry:03d}'
            attempt_dir.mkdir()
            log(f'{name} {batch.name}: request {retry}/{MAX_ATTEMPTS}, {len(entries)} entries')
            text, metadata, failures = request(model, system_prompt, user_message, attempt_dir)
            problems = failures or validate(text, entries)
            metadata['validation_problems'] = problems
            metadata['accepted'] = not problems
            save_json(attempt_dir / 'metadata.json', metadata)
            if not problems:
                with target.open('x', encoding='utf-8') as file:
                    file.write(text)
                accepted = True
                log(f'{name} {batch.name}: OK, {len(entries)} entries')
                break
            log(f'{name} {batch.name}: rejected: {"; ".join(problems[:8])}')
            if failures:
                raise RuntimeError(f'{name} {batch.name}: transport/model isolation failure; see {attempt_dir}')
            if retry < MAX_ATTEMPTS:
                time.sleep(2)
        if not accepted:
            failed.append(batch.name)
    return {'model': model, 'failed_batches': failed}


def write_notes():
    lines = ['Hoopoe dictionary check — two-model run', f'Updated: {timestamp()}',
             f'CLI version: {subprocess.check_output(["claude", "--version"], text=True).strip()}',
             'Provider: existing authenticated company gateway, https://llm.atko.ai',
             'Models requested by user: GPT 6.1 Sol [1m], Claude Sonnet 5.5 [1m]; no Gemini run.',
             'Every batch is a fresh CLI request with the supplied system prompt unchanged.',
             'User messages use user-message-template.txt and the original batch JSON unchanged.',
             'Models see only their own request, not other outputs or scoring.md.',
             'Settings: --bare, tools=[], MCP=[], skills disabled, hooks disabled, no project context.',
             f'Effort: {EFFORT}. Temperature is not adjustable through this CLI.',
             'Started with one request per model; user approved four concurrent requests per model.',
             'Concurrency changes scheduling only: batches, prompts, model IDs, and effort stay unchanged.',
             'In-flight requests interrupted during restart may be repeated; their spend is not reported.',
             'No model fallback. Validated against exact model IDs, input order, and output rules.',
             'Raw answers and failed attempts are retained; no hand corrections or JSON repair.',
             'Reported costs are CLI estimates; gateway costBasis may be unknown, not a confirmed bill.',
             'Connectivity checks: both exact IDs succeeded; one OK-only request per model.',
             'Connectivity estimates: GPT $0.001345, Claude $0.001795 (not included below).',
             'Oddity: CLI logs unrecognized_model warnings for these gateway IDs, but requests succeed.', '']
    for name, model in MODELS.items():
        paths = sorted((HERE / 'run-artifacts' / name).glob('batch-*/attempt-*/metadata.json'))
        records = [(p, json.loads(p.read_text(encoding='utf-8'))) for p in paths]
        reruns = sorted({p.parent.parent.name for p, _ in records if p.parent.name != 'attempt-001'})
        total_cost = sum(r.get('reported_cost_usd') or 0 for _, r in records)
        response_models = sorted({m for _, r in records for m in r.get('response_models', [])})
        lines += [f'{name}: requested {model}; response model(s): {response_models}',
                  f'  Saved batches: {len(list((HERE / f"results-{name}").glob("batch-*.json")))}/54',
                  f'  Attempts: {len(records)}; reported cost estimate: ${total_cost:.6f}',
                  f'  Re-run batches: {", ".join(reruns) or "none"}']
        for path, record in records:
            if not record.get('accepted'):
                lines.append(f'  Rejected {path.parent.parent.name}/{path.parent.name}: '
                             + '; '.join(record.get('validation_problems', [])))
        report = HERE / f'validation-{name}.txt'
        if report.exists():
            lines += [f'  Official validator: {report.read_text(encoding="utf-8").strip()}', '']
    (HERE / 'run-notes.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')


def package_results():
    inputs = list(csv.DictReader((HERE / 'input.csv').open(encoding='utf-8')))
    for name in MODELS:
        folder = HERE / f'results-{name}'
        proc = subprocess.run(['python3', str(HERE / 'check_output.py'), str(folder)],
                              text=True, capture_output=True, cwd=HERE)
        (HERE / f'validation-{name}.txt').write_text(proc.stdout + proc.stderr, encoding='utf-8')
        log(f'{name} official validator: {proc.stdout.strip()}')
        if proc.returncode:
            return False
        answers = {r['id']: r for path in sorted(folder.glob('batch-*.json'))
                   for r in json.loads(path.read_text(encoding='utf-8'))}
        fields = list(inputs[0]) + [key for key in check.KEYS if key != 'id']
        with (HERE / f'results-{name}.csv').open('w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=fields)
            writer.writeheader()
            for row in inputs:
                writer.writerow({**row, **answers[int(row['id'])]})
    write_notes()
    archive = HERE / 'hoopoe-dictionary-results-gpt-and-claude.zip'
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as zipped:
        for name in MODELS:
            for path in sorted((HERE / f'results-{name}').glob('batch-*.json')):
                zipped.write(path, path.relative_to(HERE))
            for filename in [f'results-{name}.csv', f'validation-{name}.txt', f'results-{name}-problems.csv']:
                zipped.write(HERE / filename, filename)
        zipped.write(HERE / 'run-notes.txt', 'run-notes.txt')
        for path in sorted((HERE / 'run-artifacts').glob('*/batch-*/attempt-*/metadata.json')):
            zipped.write(path, path.relative_to(HERE))
    log(f'Packaged {archive}')
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--limit', type=int)
    parser.add_argument('--models', choices=list(MODELS), nargs='+', default=list(MODELS))
    parser.add_argument('--jobs-per-model', type=int, default=4)
    args = parser.parse_args()
    if args.limit is not None and args.limit < 1:
        parser.error('--limit must be positive')
    if not 1 <= args.jobs_per_model <= 4:
        parser.error('--jobs-per-model must be between 1 and 4')
    if len(args.models) != len(set(args.models)):
        parser.error('--models must not contain duplicates')
    batches = sorted((HERE / 'batches').glob('batch-*.json'))
    if args.limit:
        batches = batches[:args.limit]
    system_prompt = (HERE / 'system-prompt.txt').read_text(encoding='utf-8')
    template = (HERE / 'user-message-template.txt').read_text(encoding='utf-8')
    errors = []
    write_notes()
    log(f'Scheduling up to {args.jobs_per_model} independent requests per model; effort={EFFORT}')
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(args.models) * args.jobs_per_model) as pool:
        futures = {pool.submit(run_model, name, batches[slot::args.jobs_per_model], system_prompt, template): name
                   for name in args.models for slot in range(args.jobs_per_model)}
        for future in concurrent.futures.as_completed(futures):
            name = futures[future]
            try:
                result = future.result()
                if result['failed_batches']:
                    errors.append(f'{name}: failed batches {result["failed_batches"]}')
            except Exception as exc:
                errors.append(f'{name}: {exc}')
                log(errors[-1])
    write_notes()
    if errors:
        raise SystemExit('\n'.join(errors))
    if not args.limit and set(args.models) == set(MODELS):
        if not package_results():
            write_notes()
            raise SystemExit('Official validation failed; see validation reports')
    log('Requested run completed')


if __name__ == '__main__':
    main()
