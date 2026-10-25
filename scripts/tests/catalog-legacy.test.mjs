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

const cloneEngine = controls => ({ ...engine, getLockControls: () => structuredClone(controls) });
const current = key => engine.getLockControls().find(c => c.key === key).options.filter(o => !['none', 'random'].includes(o.id));
const collision = result => result.issues.some(i => i.code === 'LEGACY_CURRENT_ID_COLLISION');

test('all 22 tables have explicit ownership policy; legacy text is not mistaken for an ID', async () => {
 const result = await validateLegacyReferences(root, read(), engine);
 assert.deepEqual(Object.keys(result.identityCoverage), Object.keys(read().tables));
 assert.equal(Object.keys(result.identityCoverage).length, 22);
 assert(result.checkedMigrationIds > 100);
 assert(result.preservedMigrationOwners > 0);
 for (const name of ['WARDROBE_LEGACY_PROMPT_ALIASES','LOCATION_LEGACY_PROMPT_ALIASES']) assert.match(result.identityCoverage[name], /^prompt-text:/);
 const doc=read(), snapshot=engine.getLegacyMappingsForTesting();
 doc.tables.UNKNOWN_MIGRATION={shape:'pairs',fields:{},source:[]};snapshot.tables.UNKNOWN_MIGRATION=[];
 await assert.rejects(validateLegacyReferences(root,doc,engine,snapshot),/Undeclared legacy ID ownership/);
});

test('each option alias family rejects another current ID and preserves its own target ID', async () => {
 const initial=engine.getLegacyMappingsForTesting();
 const names=[...new Set(initial.optionAliases.map(r=>r.table))];assert.equal(names.length,9);
 for(const name of names){
  const snapshot=structuredClone(initial), row=snapshot.optionAliases.find(r=>r.table===name);
  const options=engine.getCompiledCatalogForTesting().catalog[row.group][row.category];
  row.ids=[options.find(o=>o.zh!==row.targetZh).id];
  assert(collision(await validateLegacyReferences(root,read(),engine,snapshot)),name);
  row.ids=[options.find(o=>o.zh===row.targetZh).id];
  assert(!collision(await validateLegacyReferences(root,read(),engine,snapshot)),name+' self');
 }
});

test('standalone raw and computed migration keys cannot shadow current source IDs',async()=>{
 const cases=[
  ['CAMERA_PROFILE_RENDERING_MIGRATIONS','filmId','dictionary'],
  ['LEGACY_POSE_HAND_TO_PROP_ID','poseHandId','pair'],
  ['POSE_COMPOSER_ARRANGEMENT_TO_ANCHOR_MIGRATIONS','poseArrangementId','arrangementId'],
  ['CHARACTER_EXPRESSION_POSE_LEGACY_SOCIAL_POSE_MIGRATIONS','poseId','legacyId'],
  ['CHARACTER_LEGACY_SELFIE_SPECIAL_ACTION_MIGRATIONS','specialActionId','legacyId'],
  ['WARDROBE_OUTFIT_TO_DRESS_LEGACY_LOCK_MIGRATIONS','outfitPresetId','legacyIds'],
  ['LEGACY_EYEWEAR_LOCK_MIGRATIONS','eyewearId','legacyIds'],
  ['LEGACY_OUTERWEAR_OPENING_LOCK_MIGRATIONS','outerwearId','legacyIds'],
  ['LEGACY_HAIR_STYLING_STATE_MIGRATIONS','hairstyleId','hair'],
 ];
 for(const [name,key,kind] of cases){
  const doc=read(), snapshot=engine.getLegacyMappingsForTesting();
  const id=current(key).find(o=>o.zh!==snapshot.tables[name][0]?.frameZh && o.zh!=='復古微對比銳利感' && !snapshot.hairLegacyIds.includes(o.id)).id;
  const row=snapshot.tables[name][0];
  if(kind==='dictionary'){
   const [old,target]=Object.entries(snapshot.tables[name])[0];delete snapshot.tables[name][old];snapshot.tables[name][id]=target;
   doc.tables[name].source=structuredClone(snapshot.tables[name]);
  }else if(kind==='pair'){row[0]=id;doc.tables[name].source[0][0]=id;}
  else if(kind==='hair')snapshot.hairLegacyIds[0]=id;
  else {row[kind]=kind==='legacyIds'?[id]:id;if(kind==='arrangementId')doc.tables[name].source[0][kind]=id;}
  assert(collision(await validateLegacyReferences(root,doc,engine,snapshot)),name);
 }
});

test('hand-to-prop rejects the original counterexample, but unrelated control IDs do not collide',async()=>{
 const doc=read(), snapshot=engine.getLegacyMappingsForTesting();
 snapshot.tables.LEGACY_POSE_HAND_TO_PROP_ID[0][0]='lying-supine-hands-by-sides';
 doc.tables.LEGACY_POSE_HAND_TO_PROP_ID.source[0][0]='lying-supine-hands-by-sides';
 assert(collision(await validateLegacyReferences(root,doc,engine,snapshot)));
 const controls=structuredClone(engine.getLockControls());
 controls.find(c=>c.key==='poseBaseId').options.push({id:'hand-apply-lipstick',zh:'unrelated fixture'});
 assert.deepEqual((await validateLegacyReferences(root,read(),cloneEngine(controls))).issues,[]);
});

test('new embedded source ID cannot claim a historical migration key',async()=>{
 const controls=structuredClone(engine.getLockControls());
 controls.find(c=>c.key==='poseHandId').options.push({id:'hand-apply-lipstick',zh:'new conflicting hand'});
 assert(collision(await validateLegacyReferences(root,read(),cloneEngine(controls))));
});

test('label-based migrations check source owners and cannot hide another primary ID in aliases',async()=>{
 for(const [name,key]of [['CHARACTER_SPECIAL_ACTION_TO_POSE_COMPOSER_MIGRATIONS','specialActionId'],['CHARACTER_POSE_TO_POSE_COMPOSER_MIGRATIONS','poseId']]){
  const doc=read(),snapshot=engine.getLegacyMappingsForTesting();
  const controls=structuredClone(engine.getLockControls()),options=controls.find(c=>c.key===key).options;
  const owner=options.find(o=>o.zh===snapshot.tables[name][0].label);
  owner.legacyIds.push(options.find(o=>o.id!==owner.id&&!['none','random'].includes(o.id)).id);
  assert(collision(await validateLegacyReferences(root,doc,cloneEngine(controls),snapshot)),name);
  doc.tables[name].source[0].label='missing source label';snapshot.tables[name][0].label='missing source label';
  assert((await validateLegacyReferences(root,doc,engine,snapshot)).issues.some(i=>i.code==='LEGACY_SOURCE'),name);
 }
});

test('computed eye-wear keys are checked in single and both duo role namespaces',async()=>{
 for(const key of ['eyewearId','eyewearAId','eyewearBId']){
  const controls=structuredClone(engine.getLockControls()),snapshot=engine.getLegacyMappingsForTesting();
  controls.find(c=>c.key===key).options.push({id:'fixture-role-collision',zh:'new frame'});
  snapshot.tables.LEGACY_EYEWEAR_LOCK_MIGRATIONS[0].legacyIds=['fixture-role-collision'];
  assert((await validateLegacyReferences(root,read(),cloneEngine(controls),snapshot)).issues.some(i=>i.itemKey.includes(key)),key);
 }
});

test('selfie substring matching and source/computed drift fail closed',async()=>{
 const doc=read(),snapshot=engine.getLegacyMappingsForTesting();
 doc.tables.CHARACTER_LEGACY_SELFIE_SPECIAL_ACTION_MIGRATIONS.source[0].label='塗口紅';
 snapshot.tables.CHARACTER_LEGACY_SELFIE_SPECIAL_ACTION_MIGRATIONS[0].label='塗口紅';
 assert(collision(await validateLegacyReferences(root,doc,engine,snapshot)));
 const drift=read();drift.tables.LEGACY_POSE_HAND_TO_PROP_ID.source[0][0]='unsynced-key';
 assert((await validateLegacyReferences(root,drift,engine)).issues.some(i=>i.code==='LEGACY_SNAPSHOT_SOURCE'));
});


test('historical ownership cannot authorize a different migration target',async()=>{
 const doc=read(),snapshot=engine.getLegacyMappingsForTesting();
 const row=snapshot.tables.LEGACY_POSE_HAND_TO_PROP_ID.find(r=>r[0]==='selfie-mirror-phone-visible');
 row[1]='hand-apply-lipstick';
 doc.tables.LEGACY_POSE_HAND_TO_PROP_ID.source=structuredClone(snapshot.tables.LEGACY_POSE_HAND_TO_PROP_ID);
 assert(collision(await validateLegacyReferences(root,doc,engine,snapshot)));
 const hairDoc=read(),hair=engine.getLegacyMappingsForTesting();
 const state=engine.getCompiledCatalogForTesting().entries.character['髮絲整理狀態 (Hair Styling State)'].find(o=>o.zh!==hair.tables.LEGACY_HAIR_STYLING_STATE_MIGRATIONS[0].stateZh).zh;
 hair.tables.LEGACY_HAIR_STYLING_STATE_MIGRATIONS[0].stateZh=state;
 hairDoc.tables.LEGACY_HAIR_STYLING_STATE_MIGRATIONS.source[0].stateZh=state;
 assert(collision(await validateLegacyReferences(root,hairDoc,engine,hair)));
});
