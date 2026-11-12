import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import baseline from './outdoorLeanBaseline.json' with {type:'json'};
import protectedBaseline from './outdoorLeanProtectedBaseline.json' with {type:'json'};
import { outdoorLeanProtectedRows } from './outdoorLeanFixtures.js';
import { assertUpperBodyStateBaselineRevision } from './upperBodyStateBaselineRevisionTestSupport.js';

test('all 1686 pre-outdoor-lean fixtures keep the six existing outputs, selections and summaries',()=>{
  const temp=mkdtempSync(join(tmpdir(),'outdoor-lean-baseline-'));
  try{
    const output=join(temp,'outputs.json');
    execFileSync(process.execPath,['../scripts/dump_pre_lawson_outputs.mjs',output],{cwd:fileURLToPath(new URL('../../../',import.meta.url)),stdio:'pipe',timeout:120000});
    const current=JSON.parse(readFileSync(output,'utf8'));
    assert.equal(Object.keys(current).length,1686);assert.deepEqual(Object.keys(current),Object.keys(baseline.rows));
    for(const [key,hash] of Object.entries(baseline.rows))assert.equal(createHash('sha256').update(JSON.stringify(current[key])).digest('hex'),hash,key);
  }finally{rmSync(temp,{recursive:true,force:true});}
});

test('every indoor leaning choice and all outdoor sitting scenes/poses retain seven outputs and RNG at ten framings',()=>{
  assert.equal(Object.keys(protectedBaseline.rows).length,1160);
  assert.equal(Object.values(protectedBaseline.rows).reduce((sum,row)=>sum+row.samples,0),14310);
  assertUpperBodyStateBaselineRevision('outdoorLean', outdoorLeanProtectedRows(), protectedBaseline.rows);
});
