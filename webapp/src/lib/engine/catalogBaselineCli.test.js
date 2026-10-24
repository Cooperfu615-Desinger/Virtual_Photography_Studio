import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { OUTPUTS } from '../../../../scripts/lib/catalogBaseline.mjs';

test('CLI exits nonzero for missing/corrupt files and every protected mutation, including both unresolved', () => {
  const directory = mkdtempSync(join(tmpdir(), 'catalog-cli-'));
  const script = fileURLToPath(new URL('../../../../scripts/catalog_baseline.mjs', import.meta.url));
  const beforeFile = join(directory, 'before.json'), afterFile = join(directory, 'after.json');
  const prompt = { grokPrompt: 'One.', zImagePrompt: 'Two.', midjourneyPrompt: 'Three.', nanoBananaPrompt: 'Four.', extraPrompts: [], selection: { id: 'protected' }, summaryFields: {}, structured: {} };
  const row = { id: 'a', status: 'resolved', rngCalls: 1, prompt, outputs: Object.fromEntries(OUTPUTS.map(key => [key, { status: prompt[key] ? 'effective' : 'not-applicable', text: prompt[key] || '' }])) };
  const base = { format: 'catalog-baseline-v1', cases: [row, { ...structuredClone(row), id: 'b' }] };
  const run = () => spawnSync(process.execPath, [script, 'compare', beforeFile, afterFile], { encoding: 'utf8' });
  const write = value => writeFileSync(afterFile, JSON.stringify(value));
  try {
    writeFileSync(beforeFile, JSON.stringify(base));
    assert.notEqual(run().status, 0, 'missing file');
    writeFileSync(afterFile, '{bad'); assert.notEqual(run().status, 0, 'invalid JSON');
    write(base); assert.equal(run().status, 0);
    const mutations = [
      x => { x.cases[0].prompt.grokPrompt = x.cases[0].outputs.grokPrompt.text = 'One!'; },
      x => { x.cases[0].prompt.grokPrompt = x.cases[0].outputs.grokPrompt.text = 'Two.'; },
      x => { x.cases.pop(); },
      x => { x.cases.push({ ...structuredClone(x.cases[0]), id: 'c' }); },
      x => { x.cases.push(structuredClone(x.cases[0])); },
      x => { x.cases[0].prompt.selection.id = 'changed'; },
      x => { x.cases[0].rngCalls++; },
      x => { delete x.cases[0].outputs['full-body-character']; },
      x => { x.cases[0].status = 'UNRESOLVED'; },
    ];
    for (const mutate of mutations) { const changed = structuredClone(base); mutate(changed); write(changed); assert.notEqual(run().status, 0, String(mutate)); }
    const volatile = structuredClone(base); volatile.cases[0].prompt.id = 'new'; volatile.cases[0].prompt.date = 'new'; write(volatile); assert.equal(run().status, 0);
    const unresolved = structuredClone(base); unresolved.cases[0].status = 'UNRESOLVED';
    writeFileSync(beforeFile, JSON.stringify(unresolved)); write(unresolved); assert.notEqual(run().status, 0);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('legacy dump comparator also rejects missing cases and unresolved values', () => {
  const directory = mkdtempSync(join(tmpdir(), 'catalog-legacy-cli-'));
  const script = fileURLToPath(new URL('../../../../scripts/dump_prompt_outputs.mjs', import.meta.url));
  const before = join(directory, 'before.json'), after = join(directory, 'after.json');
  const row = { gpt: 'A', z: 'B', mj: 'C', nano: 'D', sel: '{}', sum: '{}' };
  const run = () => spawnSync(process.execPath, [script, '--compare', before, after], { encoding: 'utf8' });
  try {
    writeFileSync(before, JSON.stringify({ a: row, b: row })); writeFileSync(after, JSON.stringify({ a: row }));
    assert.notEqual(run().status, 0);
    for (const file of [before, after]) writeFileSync(file, JSON.stringify({ a: 'UNRESOLVED' }));
    assert.notEqual(run().status, 0);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
