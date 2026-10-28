import { projectCharacterPhotographicDirection } from './characterPhotographicDirection.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { CHARACTER_PROFILE_OPTIONS } from './characterProfiles.js';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { buildAllNoneLocks } from '../../features/page1/page1Selectors.js';
const review=JSON.parse(readFileSync(new URL('../../../../Docs/reports/phase4-completion-2026-10-28/a7/review.json',import.meta.url)));
test('A7 public photographic direction is scene-independent while all 33 original cards remain intact',()=>{
 const controls=getLockControls(),full=controls.find(x=>x.key==='framingId').options.find(x=>x.zh.includes('全身鏡頭')).id;
 assert.equal(review.rows.length,33);assert.equal(review.rows.filter(x=>x.before!==x.after).length,21);
 for(const row of review.rows){const source=CHARACTER_PROFILE_OPTIONS.find(x=>x.id===row.id);assert.equal(source.profile.photographicDirection,row.before);
  const p=generatePrompts(1,{...buildAllNoneLocks(controls,createEmptyLocks()),subjectCount:'1',framingId:full,characterProfileId:row.id},[],{random:createSeededRandom('a7')})[0];
  assert.ok(p.grokPrompt.toLowerCase().includes(row.after.toLowerCase()+'.'),row.zh);if(row.before!==row.after)assert.equal(p.grokPrompt.toLowerCase().includes(row.before.toLowerCase()),false,row.zh);assert.match(p.grokPrompt,/20-year-old adult/);
  assert.equal(p.selection.characterProfileId,row.id);assert.doesNotMatch(p.extraPrompts.find(x=>x.id==='full-body-character').text,/Photographic direction:/);
 }
});

test('A7 exact source projection refuses unknown IDs or edited source without mutating compatibility data',()=>{
 for(const row of review.rows){assert.equal(projectCharacterPhotographicDirection(row.id,row.before),row.after);assert.equal(projectCharacterPhotographicDirection('unknown',row.before),row.before);assert.equal(projectCharacterPhotographicDirection(row.id,row.before+' edited'),row.before+' edited');}
});
