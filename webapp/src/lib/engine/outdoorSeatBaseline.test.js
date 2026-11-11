import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import baseline from './outdoorSeatBaseline.json' with {type:'json'};
import indoor from './outdoorSeatIndoorBaseline.json' with {type:'json'};
import { indoorSeatingRegressionRows } from './outdoorSeatFixtures.js';

test('all 1,686 existing six-output fixtures, selections and summaries remain byte-identical',()=>{
  const temp=mkdtempSync(join(tmpdir(),'outdoor-baseline-'));
  try {
    const output=join(temp,'outputs.json');
    execFileSync(process.execPath,['../scripts/dump_pre_lawson_outputs.mjs',output],{
      cwd:fileURLToPath(new URL('../../../',import.meta.url)),stdio:'pipe',timeout:120000,
    });
    const current=JSON.parse(readFileSync(output,'utf8'));
    assert.deepEqual(Object.keys(current),Object.keys(baseline.rows));assert.equal(Object.keys(current).length,1686);
    for(const [key,hash] of Object.entries(baseline.rows)) assert.equal(createHash('sha256').update(JSON.stringify(current[key])).digest('hex'),hash,key);
  } finally {rmSync(temp,{recursive:true,force:true});}
});

test('83 indoor scenes × 14 poses × ten framings retain unspecified/effective seats and all seven outputs',()=>{
  assert.equal(Object.keys(indoor.rows).length,1162);
  assert.equal(Object.values(indoor.rows).reduce((sum,row)=>sum+row.samples,0),18480);
  assert.deepEqual(indoorSeatingRegressionRows(),indoor.rows);
});
