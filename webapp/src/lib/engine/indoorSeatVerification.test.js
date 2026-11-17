import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { getLockControls, getSceneDependentOptions } from '../engine.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import baseline from './outdoorSeatIndoorBaseline.json' with { type: 'json' };
import ledger from './indoorSeatVerificationLedger.json' with { type: 'json' };
import { expectations, golden, assertSeatRule, assertExcludedOwners, witnessRecords, assertWitness,
  historicalCoverageLedger, approvedLegacyRows, legacyRow, sceneFor, actionFor, assertRestoredWitnesses } from './indoorSeatVerificationSupport.js';

test('seat phase 3A: every original case has an ordered validation mapping and remains mandatory', t => {
  const rows=historicalCoverageLedger(),records=rows.flatMap(r=>r.records);
  assert.deepEqual(Object.keys(baseline.rows),rows.map(r=>r.key));
  assert.equal(rows.length,ledger.historical.rows);assert.equal(records.length,ledger.historical.cases);
  assert.equal(new Set(records.map(r=>r.id)).size,18480);
  assert.equal(records.filter(r=>JSON.parse(r.id)[3]==='').length,11620);
  assert.equal(records.filter(r=>JSON.parse(r.id)[3]!=='').length,6860);
  const rules=new Set(ledger.rules.map(r=>r.id));
  for(const row of rows){assert.equal(row.records.length,baseline.rows[row.key].samples,row.key);
    for(const record of row.records){assert.equal(record.replacement,'legacy-required');assert.ok(record.seed);assert.ok(record.rules.every(id=>rules.has(id)));}}
  assert.equal(expectations.scenes.filter(p=>p.historical).length,83);
  assert.equal(expectations.actions.filter(a=>a.historical).length,14);
  t.diagnostic(`18480 retained cases, ${records.filter(r=>r.witness).length} also have direct pinned witnesses; no replacement authorized`);
});

test('seat phase 3A: current scenes, actions, frames and all seat choices use independent frozen expectations',()=>{
  const locations=getSceneDependentOptions([],{subjectCount:'1',sceneAttributeId:'indoor'}).locationOptions.filter(p=>p.zh!=='全無');
  const actions=SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(a=>a.family==='sitting');
  const frames=getLockControls().find(c=>c.key==='framingId').options.filter(o=>o.en&&o.en!=='none'&&o.id!=='random');
  assert.deepEqual(locations.map(p=>p.id),expectations.scenes.map(p=>p.id));
  assert.deepEqual(actions.map(a=>a.id),expectations.actions.map(a=>a.id));
  assert.deepEqual(frames.map(f=>f.id),expectations.frames.map(f=>f.id));
  assert.equal(locations.length*actions.length,1260);
  for(const p of expectations.scenes)for(const a of expectations.actions)assertSeatRule(p,a);
});

test('seat phase 3A: excluded owners retain separate independent guards',()=>assertExcludedOwners());

test('seat phase 3A: 380 fixed witnesses pin absolute RNG, seven full outputs and all stable data',()=>{
  const records=witnessRecords();assert.equal(records.length,380);
  assert.deepEqual(records.map(r=>r.key),Object.keys(golden.records));
  for(const record of records)assertWitness(record);
});

test('seat phase 3A: witness provenance matches immutable history and all nineteen targeted old rows',()=>{
  assert.equal(golden.base,'fd3f3bb14e15ec556021791bdda71b8fe8d8731f');
  assert.equal(expectations.base,golden.base);assert.equal(ledger.base,golden.base);
  for(const [path,hash] of Object.entries(golden.sourceHashes))assert.equal(createHash('sha256').update(readFileSync(new URL('../../../../'+path,import.meta.url))).digest('hex'),hash,path);
  const expected=approvedLegacyRows();assert.equal(Object.keys(golden.legacyAnchors).length,19);
  for(const w of expectations.witnesses){const scene=sceneFor(w.sceneId),action=actionFor(w.actionId);if(!scene.historical||!action.historical)continue;
    const key=scene.id+'/'+action.id;assert.deepEqual(golden.legacyAnchors[key],expected[key],key);assert.deepEqual(legacyRow(scene,action),expected[key],key);}
});

test('seat phase 3A: bed edge, bed top, tatami and cushion restore and regenerate without losing selection or text',()=>assertRestoredWitnesses());
