import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import * as engine from '../../webapp/src/lib/engine.js';
import {SOURCE,PRE_E,parseSource,validateLegacyReferences} from '../lib/catalogLegacy.mjs';
import {materialize} from '../migrations/materialize_legacy_mappings.mjs';
const root=resolve(import.meta.dirname,'../..');
const read=()=>JSON.parse(readFileSync(join(root,SOURCE)));
test('all declared targets resolve; own-current aliases and ambiguous first matches stay legal',async()=>{
 const before=JSON.stringify(engine.getLockControls());
 const result=await validateLegacyReferences(root,read(),engine);
 assert.deepEqual(result.issues,[]);assert.equal(result.references,437);assert.equal(result.selfAliases,9);
 assert.deepEqual(result.ambiguous.map(x=>x.orderedMatches),Array(2).fill(['sitting-hug-knees','lying-body-legs-bent']));
 assert.equal(JSON.stringify(engine.getLockControls()),before);
});
test('catalog, embedded, attribute and category failures are blocking',async()=>{
 for(const [table,field]of [['WARDROBE_LEGACY_OPTION_MAP','targetZh'],['CHARACTER_SPECIAL_ACTION_TO_POSE_COMPOSER_MIGRATIONS','baseZh'],['LEGACY_EYEWEAR_LOCK_MIGRATIONS','frameZh'],['REGIONAL_STYLE_LEGACY_OPTION_MAP','category']]) {
  const doc=read();doc.tables[table].source[0][field]='missing-target';
  assert((await validateLegacyReferences(root,doc,engine)).issues.some(i=>i.code==='LEGACY_TARGET'),field);
 }
 const doc=read();doc.tables.LEGACY_POSE_HAND_TO_PROP_ID.source[0][1]='missing-id';assert((await validateLegacyReferences(root,doc,engine)).issues.length);
 const dictionary=read();dictionary.tables.CAMERA_PROFILE_RENDERING_MIGRATIONS.source[Object.keys(dictionary.tables.CAMERA_PROFILE_RENDERING_MIGRATIONS.source)[0]]='missing-film';assert((await validateLegacyReferences(root,dictionary,engine)).issues.length);
});
test('duplicate historical tuples, labels, prompt text and Map keys fail in their own namespace',async()=>{
 for(const table of ['WARDROBE_LEGACY_OPTION_MAP','CHARACTER_SPECIAL_ACTION_TO_POSE_COMPOSER_MIGRATIONS','WARDROBE_LEGACY_PROMPT_ALIASES','LEGACY_POSE_HAND_TO_PROP_ID']) {
  const doc=read();doc.tables[table].source.push(structuredClone(doc.tables[table].source[0]));
  assert((await validateLegacyReferences(root,doc,engine)).issues.some(i=>i.code==='LEGACY_KEY_DUPLICATE'),table);
 }
});
test('derived legacy ID cannot shadow another current entry',async()=>{
 const snapshot=engine.getLegacyMappingsForTesting(),row=snapshot.optionAliases[0];
 const other=engine.getCompiledCatalogForTesting().catalog[row.group][row.category].find(o=>o.zh!==row.targetZh);
 row.ids=[other.id];assert((await validateLegacyReferences(root,read(),engine,snapshot)).issues.some(i=>i.code==='LEGACY_CURRENT_ID_COLLISION'));
});
test('source extraction rejects expressions instead of executing arbitrary code',()=>{
 assert.throws(()=>parseSource(root,'const LEGACY_CHARACTER_EXPRESSION_CATEGORY = process.exit();'));
});
test('rehearsal refuses wrong SHA, existing/internal output and already relocated engine',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'catalog-e-negative-'));
 try {
  await assert.rejects(materialize({sourceSha:'0'.repeat(40),output:join(dir,'bad-sha')}));
  await assert.rejects(materialize({sourceSha:PRE_E,output:dir}));
  await assert.rejects(materialize({sourceSha:PRE_E,output:join(root,'knowledge_base/forbidden')}));
  const target=join(dir,'candidate');await assert.rejects(materialize({sourceSha:PRE_E,output:target}),/already relocated/);assert(!existsSync(target));
 } finally {rmSync(dir,{recursive:true,force:true});}
});
