import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getKnowledgeBaseSnapshot } from '../engine.js';
const review=JSON.parse(readFileSync(new URL('../../../../Docs/reports/phase4-completion-2026-10-28/a5/review.json',import.meta.url)));
test('Phase 4 A5 resolves eleven primary positions without changing other source fields',()=>{
 const rows=Object.values(getKnowledgeBaseSnapshot().Locations).flat();
 for(const r of review.rows){
  const source=JSON.parse(readFileSync(new URL('../../../../'+r.source,import.meta.url))).entries.find(x=>x.id===r.id);
  const expected=structuredClone(r.before);expected.meta.semantic.tags=r.afterTags;
  assert.deepEqual(source,expected);assert.deepEqual(rows.find(x=>x.stableId===r.id).meta.semantic.tags,r.afterTags);
 }
 assert.equal(rows.filter(x=>x.meta.semantic.tags.includes('indoor')&&x.meta.semantic.tags.includes('outdoor')).length,0);
});
