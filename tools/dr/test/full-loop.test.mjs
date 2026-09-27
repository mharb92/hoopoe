// The only place a node:test case spawns the shell driver. What is under test is
// the guard that replaced the run-id default (chat 27): a bare invocation used to
// resume `dr-full-2026-09-13`, which is superseded by D262, and did it with the
// D246 checkpoint skipped because the stored verdict is already `fail`.
//
// Every invocation below sets DR_ANTHROPIC_KEY, so the pre-flight at
// full-loop.sh:95 refuses before any batch could run even if the run-id guard
// were removed outright. A regression here cannot spend.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SCRIPT = path.resolve(HERE, '../full-loop.sh');
const REPO_ROOT = path.resolve(HERE, '../../..');

const run = (args) => spawnSync('bash', [SCRIPT, ...args], {
  env: { ...process.env, DR_ANTHROPIC_KEY: 'sentinel-never-used' },
  encoding: 'utf8',
});

test('full-loop.sh refuses a bare invocation instead of defaulting to a run id', () => {
  const r = run([]);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /run id required/);
  // The guard has to fire before the key pre-flight, which is the backstop and
  // not the thing being tested: reaching it means no run-id guard ran.
  assert.doesNotMatch(r.stderr, /DR_ANTHROPIC_KEY is present/);
});

test('full-loop.sh names no run id of its own — the default is gone, not renamed', () => {
  // A default pointing at a live run id is the defect, whichever id it is.
  const r = run([]);
  assert.doesNotMatch(r.stderr ?? '', /dr-full-2026-09-13/);
});

test('full-loop.sh takes an explicit run id and moves on to the key pre-flight', () => {
  // Proves the guard refuses absence, not use.
  const runId = 'test-full-loop-guard';
  try {
    const r = run([runId]);
    assert.equal(r.status, 6);
    assert.match(r.stderr, /DR_ANTHROPIC_KEY is present/);
  } finally {
    rmSync(path.join(REPO_ROOT, 'runs', runId), { recursive: true, force: true });
  }
});
