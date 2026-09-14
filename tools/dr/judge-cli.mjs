// Third transport behind the model seam: the Claude Code CLI (D249).
//
// Why it exists: D247 reasoned that the run "stays under the roughly $40
// promotional balance". That balance is on the Claude Code account, not the
// Anthropic API console, so every dollar through DR_ANTHROPIC_KEY billed a card
// while the credits it was meant to spend sat unused. This route spends the
// credits. Chat 25 measured and rejected `claude -p` on the opposite premise —
// that it bills an allowance the build needs while the API was free — and that
// premise is what was wrong, not the measurement.
//
// Nothing above `judge(rows, cfg)` knows which transport ran, with one forced
// exception named in D249: spend comes from the CLI's own `total_cost_usd`, not
// from D243's price table, because the CLI's usage blob counts harness preamble
// tokens and pricing those would mis-meter the run.
//
// The child is deliberately starved of context. It runs in an empty working
// directory with settings and MCP off, so no CLAUDE.md, skill or project
// instruction reaches the judging model: this pass judges Arabic rows against
// the frozen prompt, and repo context in the system turn would be contamination,
// not help.

import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { JudgeError, JUDGE_MODEL, DEFAULT_EFFORT } from './judge.mjs';

export const CLI_BIN = 'claude';
// A 60-row batch runs to tens of thousands of output tokens with thinking on.
// Generous, and a halt rather than a hang if the CLI wedges.
export const CLI_TIMEOUT_MS = 45 * 60 * 1000;

// Empty, repo-free cwd for the child (see the header note on contamination).
export function judgeCwd() {
  const dir = path.join(tmpdir(), 'dr-judge-cwd');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function cliArgs({ model = JUDGE_MODEL, effort = DEFAULT_EFFORT, system }) {
  return [
    '-p',
    '--model', model,
    '--effort', effort,
    '--output-format', 'json',
    '--max-turns', '1',
    // Trim what can be trimmed. The ~30k of tool definitions cannot be, and that
    // is accepted: it caches, and the warm figure is measured, not assumed.
    '--setting-sources', '',
    '--strict-mcp-config',
    '--mcp-config', '{"mcpServers":{}}',
    // Replaces the CLI's preset system prompt rather than appending to it, so the
    // judging instructions are exactly what prompt.mjs built. Chat 25 flagged the
    // preset as changing between CLI versions; this removes that variable.
    '--system-prompt', system,
  ];
}

// Anything that inherits repo or session context into the child.
const STRIPPED_ENV = [
  'CLAUDE_ADDITIONAL_DIRECTORIES',
  'CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD',
  'CLAUDE_EFFORT',
];

export function childEnv(env = process.env) {
  const out = { ...env };
  for (const k of STRIPPED_ENV) delete out[k];
  return out;
}

/**
 * Fails closed on anything that is not a clean, model-pinned success.
 * `modelUsage` naming the pinned model is positive proof the run went through
 * Claude Code on the model we asked for — an assertion, not a log line.
 */
export function readEnvelope(stdout, { model = JUDGE_MODEL } = {}) {
  let env;
  try {
    env = JSON.parse(stdout);
  } catch {
    throw new JudgeError(`judge-cli: stdout is not JSON (${stdout.slice(0, 200)})`);
  }
  if (env.is_error === true || env.subtype !== 'success') {
    throw new JudgeError(`judge-cli: CLI reported failure subtype=${env.subtype} ` +
      `api_error_status=${env.api_error_status ?? 'none'}`, { body: env });
  }
  if (typeof env.total_cost_usd !== 'number' || !env.session_id) {
    throw new JudgeError('judge-cli: envelope carries no total_cost_usd/session_id — ' +
      'this did not come back through the Claude Code CLI', { body: env });
  }
  const usedModels = Object.keys(env.modelUsage ?? {});
  if (!usedModels.includes(model)) {
    throw new JudgeError(`judge-cli: model pin did not hold — asked ${model}, ` +
      `modelUsage names ${usedModels.join(', ') || 'nothing'}`, { body: env.modelUsage });
  }
  if (typeof env.result !== 'string' || env.result.length === 0) {
    throw new JudgeError('judge-cli: envelope carries no result text', { body: env });
  }
  return env;
}

/**
 * Builds a legible reason from a failed CLI invocation. stdout first, because
 * that is where `--output-format json` puts the error; stderr is the fallback
 * for a failure that happened before the CLI got that far.
 */
export function describeFailure(stdout = '', stderr = '') {
  const out = stdout.trim();
  if (out) {
    try {
      const env = JSON.parse(out);
      const bits = [
        env.subtype && `subtype=${env.subtype}`,
        env.api_error_status && `api_error_status=${env.api_error_status}`,
        env.terminal_reason && `terminal_reason=${env.terminal_reason}`,
        env.stop_reason && `stop_reason=${env.stop_reason}`,
        typeof env.result === 'string' && env.result && `result=${env.result.slice(0, 400)}`,
      ].filter(Boolean);
      if (bits.length) return bits.join(' ');
    } catch { /* not an envelope; fall through to the raw text */ }
    return `stdout=${out.slice(0, 400)}`;
  }
  const e = stderr.trim();
  return e ? `stderr=${e.slice(0, 400)}` : 'no stdout and no stderr — the CLI died silently';
}

function runCli(args, stdin, { env, cwd, timeoutMs, spawnImpl = spawn }) {
  return new Promise((resolve, reject) => {
    const child = spawnImpl(CLI_BIN, args, { env, cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new JudgeError(`judge-cli: no response within ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => { clearTimeout(timer); reject(new JudgeError(`judge-cli: spawn failed — ${e.message}`)); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        // `--output-format json` reports failure as an envelope on STDOUT and
        // exits non-zero, so stderr is routinely empty on a real error. Reading
        // only stderr here produced "exited 1 — " with the cause discarded.
        reject(new JudgeError(`judge-cli: exited ${code} — ${describeFailure(out, err)}`,
          { body: out.slice(0, 4000) }));
        return;
      }
      resolve(out);
    });
    child.stdin.end(stdin);
  });
}

/** Transport entry point. Same return contract as callAnthropic, plus `usd`. */
export async function callClaudeCli(cfg) {
  const {
    message, model = JUDGE_MODEL, effort = DEFAULT_EFFORT,
    env = process.env, spawnImpl = spawn, timeoutMs = CLI_TIMEOUT_MS,
  } = cfg;

  const stdout = await runCli(
    cliArgs({ model, effort, system: message.system }),
    message.user,
    { env: childEnv(env), cwd: judgeCwd(), timeoutMs, spawnImpl },
  );
  const envelope = readEnvelope(stdout, { model });

  return {
    model,
    effort,
    raw: envelope.result,
    usage: envelope.usage,
    // The CLI reports end_turn / max_tokens in the same vocabulary judge() checks.
    stopReason: envelope.stop_reason ?? null,
    // Taken directly, never re-priced (D249). D243's table would count the
    // harness preamble sitting in `usage` and over-report the run.
    usd: envelope.total_cost_usd,
    sessionId: envelope.session_id,
  };
}
