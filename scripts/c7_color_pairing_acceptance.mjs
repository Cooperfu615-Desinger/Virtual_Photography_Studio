import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,cpSync,symlinkSync,rmSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import * as engine from '../webapp/src/lib/engine.js';
import {serializeFavoritePrompt,deserializeFavoritePrompt,buildMarkdownExport,parseExportedMarkdownPrompt} from '../webapp/src/features/saved-cards/cardCodec.js';
import {BASE,REPORT,fixtures,runCase,referenceAllows} from './lib/c7ColorFixtures.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),record=process.argv.includes('--record'),file=join(root,REPORT,'before.json.gz');
const matrix=fixtures(engine),{controls,cases,db,review}=matrix,hash=v=>createHash('sha256').update(v).digest('hex');
let oracle=engine,dir;
if(record){
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),BASE);
 const original=readFileSync(join(root,'webapp/src/lib/engine.js'),'utf8');assert.equal(original,execFileSync('git',['show',BASE+':webapp/src/lib/engine.js'],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}));
 dir=mkdtempSync(join(tmpdir(),'c7-color-oracle-'));mkdirSync(join(dir,'webapp'));cpSync(join(root,'webapp/src'),join(dir,'webapp/src'),{recursive:true});cpSync(join(root,'webapp/package.json'),join(dir,'webapp/package.json'));symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
 let source=original;const replace=(a,b)=>{assert.equal(source.split(a).length,2,a);source=source.replace(a,b);};
 replace('const lowFrequencyPicker = (tag) => (candidates) => {','const lowFrequencyPicker = (tag) => (candidates, pickerRandom = random) => {');
 replace("lowFrequency.length === 0 || random() < 0.88", "lowFrequency.length === 0 || pickerRandom() < 0.88");
 replace('return sample(regular, random);','return sample(regular, pickerRandom);');
 replace('return sample(lowFrequency.length > 0 ? lowFrequency : candidates, random);','return sample(lowFrequency.length > 0 ? lowFrequency : candidates, pickerRandom);');
 replace("(item) => styleFitsLocation(item, location),\n    sample,\n    ['styleId'],", "(item) => styleFitsLocation(item, location),\n    (candidates,rng) => runtimeOptions.c7Reference ? runtimeOptions.c7Reference('style',candidates,rng,sample,findById(runtime.flatCatalog.film,effectiveLocks.filmId)) : sample(candidates,rng),\n    ['styleId'],");
 replace("lowFrequencyPicker('low_frequency_film'),\n    ['filmId', 'cameraSystemId'],", "(candidates,rng) => runtimeOptions.c7Reference ? runtimeOptions.c7Reference('film',candidates,rng,lowFrequencyPicker('low_frequency_film'),style) : lowFrequencyPicker('low_frequency_film')(candidates,rng),\n    ['filmId', 'cameraSystemId'],");
 writeFileSync(join(dir,'webapp/src/lib/engine.js'),source);oracle=await import(pathToFileURL(join(dir,'webapp/src/lib/engine.js')));
 mkdirSync(join(root,REPORT),{recursive:true});writeFileSync(join(root,REPORT,'oracle-transform.json'),JSON.stringify({base:BASE,beforeHash:hash(original),oracleHash:hash(source),method:'Original picker consumes original random tape; independent reviewed-pool index uses final draw; renderer unchanged.'},null,2),{flag:'wx'});
}
try{
 const old=record?null:JSON.parse(gunzipSync(readFileSync(file))),rows=[];let changed=0,eligible=0;
 if(old){assert.equal(old.base,BASE);assert.equal(JSON.stringify(controls),JSON.stringify(old.controls));assert.deepEqual(review,old.review);assert.deepEqual(cases,old.rows.map(r=>r.case));}
 for(const [i,row]of cases.entries()){
  const actual=runCase(engine,row,row.custom?db:[]),expected=record?runCase(oracle,row,row.custom?db:[],true):old.rows[i].expected;
  const before=record?actual:old.rows[i].before;
  assert.equal(expected.calls,before.calls,'random budget: '+row.name);
  const differences=Object.keys(before.prompt.selection).filter(k=>JSON.stringify(before.prompt.selection[k])!==JSON.stringify(expected.prompt.selection[k]));
  assert.ok(differences.every(k=>['styleId','filmId','opticalEffectId'].includes(k)),row.name+': '+differences);
  assert.deepEqual(expected.prompt.extraPrompts.find(p=>p.id==='full-body-character'),before.prompt.extraPrompts.find(p=>p.id==='full-body-character'),'full-body: '+row.name);
  if(row.eligible)eligible++;else assert.deepEqual(expected,before,row.name);
  if(JSON.stringify(before)!==JSON.stringify(expected))changed++;
  if(!record)assert.deepEqual(actual,expected,row.name);
  const style=controls.find(c=>c.key==='styleId').options.find(o=>o.id===expected.prompt.selection.styleId),film=controls.find(c=>c.key==='filmId').options.find(o=>o.id===expected.prompt.selection.filmId);
  if(row.eligible&&(!row.input.styleId||row.input.styleId==='random'||!row.input.filmId||row.input.filmId==='random'))assert.ok(referenceAllows(style,film),row.name);
  if(record)rows.push({case:row,before,expected});
 }
 const source=record?rows:old.rows;
 const manual=source.find(r=>r.case.name.includes('manual:蜷川實花')&&r.case.input.filmId===matrix.monoFilm).before.prompt;
 const saved=record?serializeFavoritePrompt({...manual,id:'c7-color-old-conflict',date:'2026-10-31'}):old.saved,restored=deserializeFavoritePrompt(saved),roundtrip=serializeFavoritePrompt(restored);
 assert.deepEqual({...roundtrip,l:null},{...saved,l:null});for(const[k,v]of Object.entries(saved.l))assert.deepEqual(roundtrip.l[k],v);
 const markdown=buildMarkdownExport(restored),imported=parseExportedMarkdownPrompt(markdown,controls,'c7-color-import');
 for(const k of ['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt'])assert.equal(imported[k],restored[k]);
 assert.equal(imported.selection.styleId,manual.selection.styleId);assert.equal(imported.selection.filmId,manual.selection.filmId);
 if(record)writeFileSync(file,gzipSync(JSON.stringify({base:BASE,controls,review,rows,saved,roundtrip})),{flag:'wx'});else assert.deepEqual(roundtrip,old.roundtrip);
 console.log(JSON.stringify({base:BASE,record,cases:cases.length,eligible,changed,manualPairs:702,randomBudgetPreserved:true,fullBodyPreserved:true,savedAndMarkdownPreserved:true}));
}finally{if(dir)rmSync(dir,{recursive:true,force:true});}
