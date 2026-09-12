import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  extractFencedBlock, buildSystemPrompt, buildUserPrompt, buildBatchMessage, loadRomanizationMap,
} from '../prompt.mjs';
import { ENUMS_TEXT, LEVEL_RUBRIC_TEXT } from '../prompt-content.mjs';
import { PROMPT_DOC_PATH, ROMANIZATION_MAP_PATH } from '../config.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const emptyMapPath = path.join(here, '..', 'fixtures', 'empty-romanization-map.md');
const missingMapPath = path.join(here, '..', 'fixtures', 'does-not-exist.md');
const realDoc = readFileSync(PROMPT_DOC_PATH, 'utf8');

const stubDoc = `
## System

\`\`\`
Header text.
<<ENUMS>>
<<LEVEL_RUBRIC>>
<<ROMANIZATION>>
\`\`\`

## User (per batch)

\`\`\`
Rows <<N>> of 2,728. Batch <<B>>.

<<TSV>>
\`\`\`
`;

test('extractFencedBlock pulls the fenced block after a heading', () => {
  const block = extractFencedBlock(stubDoc, /##\s*System\s*\n/);
  assert.ok(block.includes('Header text.'));
  assert.ok(block.includes('<<ENUMS>>'));
});

test('buildSystemPrompt fills all three placeholders', () => {
  const out = buildSystemPrompt(stubDoc, { enums: 'ENUM-CONTENT', levelRubric: 'RUBRIC-CONTENT', romanization: 'ROMAN-CONTENT' });
  assert.ok(out.includes('ENUM-CONTENT'));
  assert.ok(out.includes('RUBRIC-CONTENT'));
  assert.ok(out.includes('ROMAN-CONTENT'));
  assert.ok(!out.includes('<<'));
});

test('buildSystemPrompt throws if a placeholder has no content (romanization undefined)', () => {
  assert.throws(
    () => buildSystemPrompt(stubDoc, { enums: 'x', levelRubric: 'y', romanization: undefined }),
    /ROMANIZATION/,
  );
});

test('buildUserPrompt fills N, B and the TSV block with a header row', () => {
  const rows = [{ id: 1, arabic: 'أَنَا', romanization: 'ana', english: 'I', pos: 'pronoun', category: 'Pronouns', root: null, conjugation: null, gender: null, dialect_tag: 'S', notes: null, confidence: 5 }];
  const out = buildUserPrompt(stubDoc, { rowCount: 1, batchLabel: '1/46', rows });
  assert.ok(out.includes('Rows 1 of 2,728. Batch 1/46.'));
  assert.ok(out.includes('id, arabic, romanization'));
  assert.ok(out.includes('1\tأَنَا\tana\tI\tpronoun\tPronouns'));
});

test('buildBatchMessage assembles system+user when all content is supplied', () => {
  const rows = [{ id: 1, arabic: 'أَنَا', romanization: 'ana', english: 'I', pos: 'pronoun', category: 'Pronouns' }];
  const { system, user } = buildBatchMessage(stubDoc, rows, {
    batchIndex: 1, totalBatches: 46,
    enums: 'E', levelRubric: 'R', romanization: 'M',
  });
  assert.ok(system.includes('E') && system.includes('R') && system.includes('M'));
  assert.ok(user.includes('Batch 1/46'));
});

test('real dr-prompt-scoped.md + real romanization-map.md: buildSystemPrompt fills all three placeholders with real content', async () => {
  const romanization = await loadRomanizationMap(ROMANIZATION_MAP_PATH);
  const system = buildSystemPrompt(realDoc, { enums: ENUMS_TEXT, levelRubric: LEVEL_RUBRIC_TEXT, romanization });

  assert.ok(system.includes('form_origin'));
  assert.ok(system.includes('Hard rules'));
  // Distinctive text from docs/dr/romanization-map.md, confirming the real
  // file's content landed in <<ROMANIZATION>>, not a stub or a placeholder.
  assert.ok(system.includes('D47 Arabizi standard'));
  assert.ok(system.includes('Digraph breaker'));
  // Not asserting "no literal <<" here: romanization-map.md's own prose
  // mentions "<<ROMANIZATION>>" (describing itself), so that substring is
  // expected to survive substitution as injected content. The stub-based
  // test above already covers "placeholders are actually replaced".
});

test('loadRomanizationMap throws if the file is missing', async () => {
  await assert.rejects(() => loadRomanizationMap(missingMapPath), /romanization map not found/);
});

test('loadRomanizationMap throws if the file is empty', async () => {
  await assert.rejects(() => loadRomanizationMap(emptyMapPath), /romanization map at .* is empty/);
});
