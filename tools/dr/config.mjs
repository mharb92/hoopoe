// Run configuration for the DR batch runner (dr-runner-spec.md §2, §4-§5).
// Offline: builds and validates the shape, does not read env or network itself.

import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// tools/dr -> tools -> repo root, so these resolve correctly regardless of caller cwd.
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.join(MODULE_DIR, '..', '..');

export const TOTAL_ROWS = 2728;
export const DEFAULT_BATCH_SIZE = 60; // dr-scoped-pass.md §6: scoped default, not the frozen 120.
export const TRANSPORTS = ['anthropic-direct', 'edge-function'];

// The only two places in tools/dr that name a doc file. prompt.mjs's loaders
// take a path parameter; callers (run.mjs, tests) get the path from here.
export const PROMPT_DOC_PATH = path.join(REPO_ROOT, 'docs', 'dr', 'dr-prompt-scoped.md');
export const ROMANIZATION_MAP_PATH = path.join(REPO_ROOT, 'docs', 'dr', 'romanization-map.md');
// Run artefacts. Repo root, not tools/dr/runs/: §7.7 commits the manifest and the
// report, and .gitignore excludes tools/dr/runs/. Raw model output never lands here.
export const RUNS_DIR = path.join(REPO_ROOT, 'runs');

// Deterministic 32-bit seed from a string, so a run id maps to one plan (mulberry32-compatible).
export function seedFromString(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0) || 1; // never 0
}

// spendCapUsd has no default: the dollar figure is Marwan's call (dr-build-brief.md B4),
// not something this runner may invent. Callers must pass it explicitly.
export function buildConfig(overrides = {}) {
  const runId = overrides.runId ?? `dr-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
  const seed = overrides.seed ?? seedFromString(runId);
  const batchSize = overrides.batchSize ?? DEFAULT_BATCH_SIZE;
  const transport = overrides.transport ?? 'anthropic-direct';
  const spendCapUsd = overrides.spendCapUsd; // required by callers that spend money (B3), not validated here.

  if (!Number.isInteger(seed) || seed <= 0) {
    throw new Error(`config: seed must be a positive integer, got ${seed}`);
  }
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error(`config: batchSize must be a positive integer, got ${batchSize}`);
  }
  if (!TRANSPORTS.includes(transport)) {
    throw new Error(`config: transport must be one of ${TRANSPORTS.join(', ')}, got ${transport}`);
  }

  return Object.freeze({ runId, seed, batchSize, transport, spendCapUsd, totalRows: TOTAL_ROWS });
}
