import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {ROOT,selectionMeasures,contentOption,histogram,uniqueOptions,visibleWardrobeOptions,lexicalMatches,assertReviewedUI,inventory,scenarios,sampleScenario,productFingerprint} from '../lib/c6Distribution.mjs';
import policy from '../lib/c6DistributionPolicy.json' with {type:'json'};
test('counts distinguish sentinels, duplicate IDs, retired data and actual picker filters',()=>{
 const rows=[{id:'none',zh:'全無'},{id:'random',zh:'隨機'},{id:'a',zh:'套裝：甲'},{id:'b',zh:'連身：乙'},{id:'c',zh:'上衣'},{id:'old',zh:'舊外套',meta:{outerwear:{retired:true}}}];
 assert.equal(rows.filter(contentOption).length,4);
 assert.deepEqual(visibleWardrobeOptions('outfitPresetId',rows).map(x=>x.id),['a']);
 assert.deepEqual(visibleWardrobeOptions('dressId',rows).map(x=>x.id),['b']);
 assert.deepEqual(visibleWardrobeOptions('topId',[rows[4]]).map(x=>x.id),['c'],'text-only items remain visible');
 assert.equal(visibleWardrobeOptions('outerwearId',rows).length,3);
 assert.equal(uniqueOptions([rows[2],rows[2],rows[3]]).length,2);
 assert.deepEqual(histogram(['none','none',undefined]),{none:2,unset:1});
});
test('reviewed live inventory separates current action/UI/legacy counts and overlapping diagnostics',()=>{
 const x=inventory();assert.equal(x.actions.concrete,54);assert.deepEqual(x.actions.validation,{accepted:42,pending:12});
 assert.equal(x.actions.randomPool.length,38);assert.equal(x.actions.conditionalLyingPool.length,4);
 assert.equal(x.ui.locationMenus.none.length,154);assert.equal(x.ui.lighting.length,36);assert.equal(x.characters.total,33);
 assert.equal(x.characters.explicitEastAsian,32);assert.equal(x.characters.skinWords.fairPalePorcelain,30);
 const row=k=>x.ui.wardrobe.find(x=>x.key===k);assert.equal(row('outfitPresetId').content,83);assert.equal(row('outfitPresetId').visibleContent,59);assert.equal(row('dressId').visibleContent,24);assert.equal(row('outerwearId').visibleContent,18);assert.equal(row('topId').visibleContent,45);
 assert.equal(x.lexical.wardrobeBags.matches.length,48);assert.equal(x.lexical.wardrobeKorean.matches.length,0);
 assert.equal(x.categories.filter(x=>x.section==='Wardrobe').reduce((n,x)=>n+x.content,0),516);
});
test('lexical findings retain IDs and never infer a whole style or absent item from zero matches',()=>{
 const rows=[{id:'one',zh:'一',en:'a wool coat and shoulder bag'},{id:'two',zh:'二',en:'casual clothing'}];
 assert.deepEqual(lexicalMatches(rows,'wool|shoulder bag'),[{id:'one',zh:'一'}]);assert.deepEqual(lexicalMatches(rows,'korean'),[]);
});
test('UI rule drift is refused rather than silently reusing old filters',()=>{
 const dir=mkdtempSync(join(tmpdir(),'c6-stale-ui-'));try{
  for(const path of Object.keys(policy.reviewedUi)){mkdirSync(dirname(join(dir,path)),{recursive:true});writeFileSync(join(dir,path),'changed');}
  assert.throws(()=>assertReviewedUI(dir),/stale/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('scenarios preserve mode boundaries, deterministic output digests and immutable input/product data',()=>{
 for(const n of [0,-1,1.5,10001])assert.throws(()=>scenarios(n));
 const set=scenarios(3),before=productFingerprint();assert.equal(set.length,8);assert.equal(set.find(x=>x.name==='default').locks.specifiedActionId,'none');
 assert.equal(set.find(x=>x.name==='special-outfit').locks.specialOutfitId,'random');assert.equal(set.find(x=>x.name==='indoor').locks.sceneAttributeId,'indoor');
 for(const row of set){const input=structuredClone(row),a=sampleScenario(row),b=sampleScenario(row);assert.deepEqual(a,b);assert.deepEqual(row,input);assert.equal(Object.values(a.measured.location.counts).reduce((a,b)=>a+b,0),row.count);assert.match(a.unseenMeaning,/does not prove unreachable/);}
 assert.deepEqual(productFingerprint(),before);
});
test('CLI emits JSON and rejects malformed counts/unknown write flags without writing product files',()=>{
 const before=productFingerprint();const result=JSON.parse(execFileSync(process.execPath,['scripts/c6_distribution.mjs','--inventory-only'],{cwd:ROOT,encoding:'utf8',maxBuffer:8*1024*1024}));assert.deepEqual(result.sampling,[]);
 for(const args of [['--count','oops'],['--count','0'],['--output','report.json']])assert.notEqual(spawnSync(process.execPath,['scripts/c6_distribution.mjs',...args],{cwd:ROOT}).status,0);
 assert.deepEqual(productFingerprint(),before);
});

test('measurement follows resolved action and migrated dress, not empty legacy compatibility fields',()=>{
 const x=selectionMeasures({specifiedActionId:'specified-kneeling-side-sit',poseBaseId:'none',outfitPresetId:'',dressId:'a-dress'});
 assert.equal(x.actionBase,'kneeling');assert.equal(x.legacyPoseBase,'none');assert.equal(x.outfit,'a-dress');assert.equal(x.outfitPreset,'unset');
 assert.equal(selectionMeasures({specifiedActionId:'specified-defiant-middle-finger-lens-jab'}).actionBase,'none');
 assert.equal(selectionMeasures({specifiedActionId:'none'}).actionBase,'unset');
 const a=sampleScenario({...scenarios(12)[0]});assert.ok(a.measured.actionBase.unique>1);assert.ok(Object.keys(a.measured.dress.counts).some(k=>k.startsWith('wardrobe:')));
});
