// Offline suite for the CLI transport (D249). No network, no CLI spawn: the
// child process is stubbed, so what is under test is the argument list, the
// child's environment, and — mostly — the envelope assertions that decide
// whether a response is trusted at all.

import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { callClaudeCli, cliArgs, childEnv, readEnvelope, describeFailure, CLI_BIN } from '../judge-cli.mjs';
import { JudgeError, JUDGE_MODEL } from '../judge.mjs';
import { TRANSPORTS } from '../config.mjs';

const okEnvelope = (over = {}) => ({
  subtype: 'success',
  is_error: false,
  stop_reason: 'end_turn',
  session_id: 'sess-1',
  total_cost_usd: 0.7123,
  result: '{"id":1,"level":2}',
  modelUsage: { [JUDGE_MODEL]: { costUSD: 0.7123 } },
  usage: { output_tokens: 24000, output_tokens_details: { thinking_tokens: 17000 } },
  ...over,
});

// A spawn stand-in: emits the given stdout, then closes with the given code.
function stubSpawn(stdout, { code = 0, stderr = '', capture = {} } = {}) {
  return (bin, args, opts) => {
    capture.bin = bin; capture.args = args; capture.opts = opts;
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.stdin = { end: (data) => { capture.stdin = data; } };
    child.kill = () => { capture.killed = true; };
    setImmediate(() => {
      if (stdout) child.stdout.emit('data', stdout);
      if (stderr) child.stderr.emit('data', stderr);
      child.emit('close', code);
    });
    return child;
  };
}

test('judge-cli: transport is registered so config accepts it', () => {
  assert.ok(TRANSPORTS.includes('judge-cli'));
});

test('cliArgs: pins the model, the effort, one turn and JSON output', () => {
  const a = cliArgs({ model: 'claude-opus-5', effort: 'high', system: 'SYS' });
  const pair = (flag) => a[a.indexOf(flag) + 1];
  assert.ok(a.includes('-p'));
  assert.equal(pair('--model'), 'claude-opus-5');
  assert.equal(pair('--effort'), 'high');
  assert.equal(pair('--output-format'), 'json');
  assert.equal(pair('--max-turns'), '1');
  assert.equal(pair('--system-prompt'), 'SYS');
});

test('cliArgs: settings and MCP are off, so no project context reaches the child', () => {
  const a = cliArgs({ system: 'SYS' });
  assert.equal(a[a.indexOf('--setting-sources') + 1], '');
  assert.equal(a[a.indexOf('--mcp-config') + 1], '{"mcpServers":{}}');
  assert.ok(a.includes('--strict-mcp-config'));
});

test('childEnv: strips the vars that would inject repo context', () => {
  const e = childEnv({
    PATH: '/bin',
    CLAUDE_ADDITIONAL_DIRECTORIES: '/mnt/x',
    CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD: '1',
    CLAUDE_EFFORT: 'low',
  });
  assert.equal(e.PATH, '/bin');
  assert.equal(e.CLAUDE_ADDITIONAL_DIRECTORIES, undefined);
  assert.equal(e.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD, undefined);
  assert.equal(e.CLAUDE_EFFORT, undefined);
});

test('readEnvelope: accepts a clean, model-pinned success', () => {
  const env = readEnvelope(JSON.stringify(okEnvelope()));
  assert.equal(env.total_cost_usd, 0.7123);
  assert.equal(env.result, '{"id":1,"level":2}');
});

test('readEnvelope: rejects a CLI-reported failure', () => {
  assert.throws(() => readEnvelope(JSON.stringify(okEnvelope({ is_error: true }))), JudgeError);
  assert.throws(() => readEnvelope(JSON.stringify(okEnvelope({ subtype: 'error_max_turns' }))), JudgeError);
});

test('readEnvelope: rejects a response with no CLI envelope — the positive proof', () => {
  // A bare Messages-API body would parse as JSON and carry text; without
  // total_cost_usd and session_id it did not come back through Claude Code.
  assert.throws(
    () => readEnvelope(JSON.stringify({ subtype: 'success', is_error: false, result: '{}',
      modelUsage: { [JUDGE_MODEL]: {} } })),
    /no total_cost_usd\/session_id/,
  );
});

test('readEnvelope: rejects when the model pin did not hold', () => {
  assert.throws(
    () => readEnvelope(JSON.stringify(okEnvelope({ modelUsage: { 'claude-sonnet-5': {} } }))),
    /model pin did not hold/,
  );
});

test('readEnvelope: rejects empty result text and non-JSON stdout', () => {
  assert.throws(() => readEnvelope(JSON.stringify(okEnvelope({ result: '' }))), /no result text/);
  assert.throws(() => readEnvelope('not json at all'), /stdout is not JSON/);
});

test('callClaudeCli: sends the user turn on stdin and returns the metered cost', async () => {
  const capture = {};
  const out = await callClaudeCli({
    message: { system: 'SYS', user: 'ROWS' },
    spawnImpl: stubSpawn(JSON.stringify(okEnvelope()), { capture }),
    env: { PATH: '/bin' },
  });
  assert.equal(capture.bin, CLI_BIN);
  assert.equal(capture.stdin, 'ROWS');
  assert.equal(out.usd, 0.7123);           // taken from the envelope, never re-priced
  assert.equal(out.raw, '{"id":1,"level":2}');
  assert.equal(out.stopReason, 'end_turn');
  assert.equal(out.sessionId, 'sess-1');
  assert.equal(out.usage.output_tokens_details.thinking_tokens, 17000);
});

test('callClaudeCli: runs in an empty cwd, not the repo', async () => {
  const capture = {};
  await callClaudeCli({
    message: { system: 'SYS', user: 'ROWS' },
    spawnImpl: stubSpawn(JSON.stringify(okEnvelope()), { capture }),
    env: { PATH: '/bin' },
  });
  assert.notEqual(capture.opts.cwd, process.cwd());
  assert.match(capture.opts.cwd, /dr-judge-cwd$/);
});

test('callClaudeCli: a non-zero exit halts and carries the stderr tail', async () => {
  // stderr is the fallback path: reached only when the CLI died before writing
  // an envelope to stdout.
  await assert.rejects(
    callClaudeCli({
      message: { system: 'SYS', user: 'ROWS' },
      spawnImpl: stubSpawn('', { code: 1, stderr: 'boom' }),
      env: { PATH: '/bin' },
    }),
    /exited 1 — stderr=boom/,
  );
});

test('callClaudeCli: needs no DR_ANTHROPIC_KEY — the direct path is what requires one', async () => {
  const out = await callClaudeCli({
    message: { system: 'SYS', user: 'ROWS' },
    spawnImpl: stubSpawn(JSON.stringify(okEnvelope())),
    env: { PATH: '/bin' }, // no DR_ANTHROPIC_KEY anywhere
  });
  assert.equal(out.usd, 0.7123);
});

// Regression: a failed CLI run reported "exited 1 — " with the cause thrown
// away, because --output-format json writes its error envelope to stdout and
// leaves stderr empty. Two real jobs failed that way and said nothing.
test('describeFailure: reads the error envelope off stdout, not stderr', () => {
  const out = JSON.stringify({ subtype: 'error_during_execution', api_error_status: 429,
    result: 'rate limit' });
  const msg = describeFailure(out, '');
  assert.match(msg, /subtype=error_during_execution/);
  assert.match(msg, /api_error_status=429/);
  assert.match(msg, /result=rate limit/);
});

test('describeFailure: falls back to stderr, then says so when both are empty', () => {
  assert.match(describeFailure('', 'command not found'), /stderr=command not found/);
  assert.match(describeFailure('', ''), /died silently/);
  assert.match(describeFailure('plain text boom', ''), /stdout=plain text boom/);
});

test('callClaudeCli: a non-zero exit surfaces the stdout envelope in the message', async () => {
  await assert.rejects(
    callClaudeCli({
      message: { system: 'SYS', user: 'ROWS' },
      spawnImpl: stubSpawn(JSON.stringify({ subtype: 'error_max_turns', api_error_status: 500 }),
        { code: 1, stderr: '' }),
      env: { PATH: '/bin' },
    }),
    /exited 1 — subtype=error_max_turns api_error_status=500/,
  );
});
