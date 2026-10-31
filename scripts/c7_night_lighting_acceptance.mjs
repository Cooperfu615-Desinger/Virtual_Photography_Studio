import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import * as engine from '../webapp/src/lib/engine.js';
import {serializeFavoritePrompt,deserializeFavoritePrompt,buildMarkdownExport,parseExportedMarkdownPrompt} from '../webapp/src/features/saved-cards/cardCodec.js';
import {BASE,NIGHT_SCENE,DAY_LIGHTS,fixtures,runCase} from './lib/c7NightLightingFixtures.mjs';
const record=process.argv.includes('--record'),file=new URL('../Docs/reports/c7-night-lighting-2026-10-31/before.json.gz',import.meta.url);
const matrix=fixtures(engine),{controls,cases,db,filtered,menu}=matrix;
if(record){
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),BASE);
 for(const path of ['webapp/src/lib/engine.js','webapp/src/data/database.json'])assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),execFileSync('git',['show',BASE+':'+path],{encoding:'utf8'}));
}
const old=record?null:JSON.parse(gunzipSync(readFileSync(file))),rows=[];
if(old){assert.equal(old.base,BASE);assert.equal(JSON.stringify(controls),JSON.stringify(old.controls));assert.equal(JSON.stringify(menu),JSON.stringify(old.menu));assert.deepEqual(cases,old.rows.map(r=>r.case));}
for(const [i,row]of cases.entries()){
 const actual=runCase(engine,row,row.library==='custom'?db:[]);
 // Before implementation, a separate complete database removes exactly the six
 // reviewed sources. This seals the allowed change independently of the new rule.
 const expected=record?(row.eligible?runCase(engine,row,filtered):actual):old.rows[i].expected;
 if(!record){assert.deepEqual(actual,expected,row.name);if(row.eligible){assert.equal(actual.prompt.selection.locationId,NIGHT_SCENE);assert.equal(DAY_LIGHTS.includes(actual.prompt.selection.lightingId),false);}}
 rows.push(record?{case:row,before:actual,expected}:actual);
}
const saved=record?serializeFavoritePrompt({...rows.find(r=>r.case.name.includes('manual:全身鏡頭')&&r.case.input.lightingId===DAY_LIGHTS[0]).before.prompt,id:'c7-old-night-daylight',date:'2026-10-31'}):old.saved;
const restored=deserializeFavoritePrompt(saved),roundtrip=serializeFavoritePrompt(restored);
assert.deepEqual({...roundtrip,l:null},{...saved,l:null});
for(const [key,value]of Object.entries(saved.l))assert.deepEqual(roundtrip.l[key],value);
if(old)assert.deepEqual(roundtrip,old.roundtrip);
assert.equal(restored.selection.lightingId,DAY_LIGHTS[0]);
const markdown=buildMarkdownExport(restored),imported=parseExportedMarkdownPrompt(markdown,controls,'c7-restored');
assert.equal(imported.grokPrompt,restored.grokPrompt);assert.equal(imported.selection.lightingId,DAY_LIGHTS[0]);
if(record)writeFileSync(file,gzipSync(JSON.stringify({base:BASE,controls,menu,rows,saved,roundtrip})),{flag:'wx'});
const source=record?rows:old.rows;
console.log(JSON.stringify({base:BASE,record,cases:cases.length,eligible:cases.filter(r=>r.eligible).length,changed:source.filter(r=>JSON.stringify(r.before)!==JSON.stringify(r.expected)).length,manualMenu:menu.lightingOptions.length,savedAndMarkdownPreserved:true}));
