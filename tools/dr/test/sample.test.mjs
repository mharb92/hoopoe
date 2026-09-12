import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildPlan } from '../sample.mjs';
import { buildConfig } from '../config.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const snapshotPath = path.join(here, '..', 'snapshots', 'dict-preDR.json');
const allRows = JSON.parse(readFileSync(snapshotPath, 'utf8')).map((r) => ({ id: r.id, category: r.category }));

test('same seed produces an identical plan twice', () => {
  const cfg = buildConfig({ seed: 42, batchSize: 60 });
  const planA = buildPlan(allRows, cfg);
  const planB = buildPlan(allRows, cfg);
  assert.deepEqual(planA.batches, planB.batches);
});

test('every id appears exactly once across the plan', () => {
  const cfg = buildConfig({ seed: 7, batchSize: 60 });
  const plan = buildPlan(allRows, cfg);
  const seen = plan.batches.flat();
  assert.equal(seen.length, allRows.length);
  assert.equal(new Set(seen).size, allRows.length);
  const expectedIds = new Set(allRows.map((r) => r.id));
  for (const id of seen) assert.ok(expectedIds.has(id), `unexpected id ${id}`);
});

test('a different seed produces a different plan', () => {
  const planA = buildPlan(allRows, buildConfig({ seed: 1, batchSize: 60 }));
  const planB = buildPlan(allRows, buildConfig({ seed: 2, batchSize: 60 }));
  assert.notDeepEqual(planA.batches, planB.batches);
});

test('batches respect the configured batch size (last batch may be smaller)', () => {
  const cfg = buildConfig({ seed: 3, batchSize: 60 });
  const plan = buildPlan(allRows, cfg);
  const full = plan.batches.slice(0, -1);
  const last = plan.batches.at(-1);
  for (const b of full) assert.equal(b.length, 60);
  assert.ok(last.length > 0 && last.length <= 60);
});

test('each batch is proportionally stratified by category (within 1 row of ideal)', () => {
  const cfg = buildConfig({ seed: 11, batchSize: 200 });
  const plan = buildPlan(allRows, cfg);
  const byId = new Map(allRows.map((r) => [r.id, r.category]));
  const totalByCategory = new Map();
  for (const r of allRows) totalByCategory.set(r.category, (totalByCategory.get(r.category) ?? 0) + 1);

  for (const batch of plan.batches) {
    const countInBatch = new Map();
    for (const id of batch) {
      const cat = byId.get(id);
      countInBatch.set(cat, (countInBatch.get(cat) ?? 0) + 1);
    }
    for (const [cat, total] of totalByCategory) {
      const ideal = (total / allRows.length) * batch.length;
      const actual = countInBatch.get(cat) ?? 0;
      assert.ok(Math.abs(actual - ideal) <= 2, `category ${cat}: ideal ${ideal}, actual ${actual}`);
    }
  }
});
