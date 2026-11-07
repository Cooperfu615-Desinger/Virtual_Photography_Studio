import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import process from 'node:process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import baseline from './indoorKneelBaseline.json' with {type:'json'};
import protectedBaseline from './indoorKneelProtectedBaseline.json' with {type:'json'};
import {indoorKneelProtectedRows} from './indoorKneelFixtures.js';
test('all 1686 pre-kneel fixtures keep existing six outputs, selections and summaries',()=>{
 const temp=mkdtempSync(join(tmpdir(),'indoor-kneel-baseline-'));
 try{const path=join(temp,'outputs.json');execFileSync(process.execPath,['../scripts/dump_prompt_outputs.mjs',path],{cwd:fileURLToPath(new URL('../../../',import.meta.url)),stdio:'pipe',timeout:120000});
  const current=JSON.parse(readFileSync(path,'utf8'));assert.equal(Object.keys(current).length,1686);assert.deepEqual(Object.keys(current),Object.keys(baseline.rows));
  for(const [id,hash] of Object.entries(baseline.rows))assert.equal(createHash('sha256').update(JSON.stringify(current[id])).digest('hex'),hash,id);
 }finally{rmSync(temp,{recursive:true,force:true})}
});
test('17220 protected samples keep unspecified indoor kneels, all fixed and outdoor kneels and every outdoor leaning choice',()=>{
 assert.equal(Object.keys(protectedBaseline.rows).length,1528);assert.equal(Object.values(protectedBaseline.rows).reduce((n,r)=>n+r.samples,0),17220);assert.deepEqual(indoorKneelProtectedRows(),protectedBaseline.rows);
});
