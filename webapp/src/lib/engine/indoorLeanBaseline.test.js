import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import baseline from './indoorLeanBaseline.json' with {type:'json'};

test('all 1,642 sealed pre-lean cases retain six original outputs, selections and summaries byte for byte',()=>{
  const temp=mkdtempSync(join(tmpdir(),'lean-baseline-'));
  try {
    const output=join(temp,'outputs.json');
    execFileSync(process.execPath,['../scripts/dump_pre_lawson_outputs.mjs',output],{
      cwd:fileURLToPath(new URL('../../../',import.meta.url)),stdio:'pipe',timeout:120000,
    });
    const current=JSON.parse(readFileSync(output,'utf8'));
    assert.equal(Object.keys(baseline.rows).length,1642);
    for(const [key,hash] of Object.entries(baseline.rows)) {
      assert.ok(Object.hasOwn(current,key),key);
      assert.equal(createHash('sha256').update(JSON.stringify(current[key])).digest('hex'),hash,key);
    }
    const added=Object.keys(current).filter(key=>!Object.hasOwn(baseline.rows,key));
    assert.equal(added.length,44); // 2 actions × 11 framings (including none) × 2 seeds.
    assert.ok(added.every(key=>/^act:specified-standing-(back|shoulder)-lean:/.test(key)));
  } finally { rmSync(temp,{recursive:true,force:true}); }
});
