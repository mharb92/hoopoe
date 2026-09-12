import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { extractFencedBlock, buildSystemPrompt, buildUserPrompt, buildBatchMessage } from '../prompt.mjs';
import { ENUMS_TEXT, LEVEL_RUBRIC_TEXT, ROMANIZATION_TEXT } from '../prompt-content.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const realDocPath = path.join(here, '..', '..', '..', 'docs', 'dr', 'dr-prompt-scoped.md');
const realDoc = readFileSync(realDocPath, 'utf8');

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

test('real dr-prompt-scoped.md: ENUMS and LEVEL_RUBRIC are ready, ROMANIZATION is a known gap', () => {
  // ENUMS_TEXT and LEVEL_RUBRIC_TEXT are transcribed from dr-spec.md and work today.
  const system = buildSystemPrompt(realDoc, {
    enums: ENUMS_TEXT, levelRubric: LEVEL_RUBRIC_TEXT, romanization: 'placeholder-for-this-assertion',
  });
  assert.ok(system.includes('form_origin'));
  assert.ok(system.includes('Hard rules'));

  // The D47 Arabizi standard is not defined anywhere in this repo (see prompt-content.mjs
  // for why). This test documents the gap: it must keep failing until that content lands.
  assert.equal(ROMANIZATION_TEXT, undefined);
  assert.throws(
    () => buildSystemPrompt(realDoc, { enums: ENUMS_TEXT, levelRubric: LEVEL_RUBRIC_TEXT, romanization: ROMANIZATION_TEXT }),
    /ROMANIZATION/,
  );
});
