import {preC2WaistHistoricalTest} from '../../../../scripts/lib/c2WaistHistoricalTest.mjs';
const c2HistoricalTest=preC2WaistHistoricalTest(import.meta.url);
import process from 'node:process';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {SPECIFIED_ACTION_CONCRETE_OPTIONS,SPECIFIED_ACTION_OPTIONS} from './specifiedActions.js';
import {POSE_COMPOSER_ANCHOR_OPTIONS} from './poseComposerOptions.js';
import {SINGLE_POSE_CONTROL_KEYS} from '../../features/page1/page1Schema.js';
import {RETIRED_POSE_COMPOSER_KEYS,retirePage1PoseComposerLocks} from '../../features/page1/retiredPoseLocks.js';
import {preparePreC3PoseFiles,preC3PoseSource} from '../../../../scripts/lib/c3PoseReplay.mjs';
import review from '../../../../scripts/lib/c3PoseReview.json' with {type:'json'};
const root=fileURLToPath(new URL('../../../../',import.meta.url));
function validateDescriptions(options){
 assert.ok(options.length>0);
 assert.equal(new Set(options.map(o=>o.id)).size,options.length);
 for(const o of options)assert.ok(typeof o.descriptionZh==='string'&&o.descriptionZh.trim(),`missing description: ${o.id}`);
}
test('C3 concrete actions and random/any have descriptions; none is supplied by picker',()=>{
 assert.equal(SPECIFIED_ACTION_CONCRETE_OPTIONS.length,54);
 validateDescriptions(SPECIFIED_ACTION_CONCRETE_OPTIONS);
 validateDescriptions(SPECIFIED_ACTION_OPTIONS.filter(o=>o.id!=='none'));
 const picker=readFileSync(join(root,'webapp/src/components/SpecifiedActionPicker.jsx'),'utf8');
 assert.match(picker,/descriptionZh: '不寫任何姿勢。'/);
 assert.match(picker,/shown\.descriptionZh/);
 assert.throws(()=>validateDescriptions([{id:'bad',descriptionZh:'  '}]),/missing description/);
});
test('C3 product source changes exactly six uiHidden flags and no other bytes',()=>{
 let source=readFileSync(join(root,review.path),'utf8');
 for(const id of review.ids){const start=source.indexOf(`id: '${id}'`);const at=source.indexOf('meta: {\n      uiHidden: true,',start);assert.ok(at>start);source=source.slice(0,at)+source.slice(at).replace('meta: {\n      uiHidden: true,','meta: {');}
 assert.equal(source,review.beforeSource);
 for(const a of POSE_COMPOSER_ANCHOR_OPTIONS){const bases=a.bases||[a.base].filter(Boolean);if(bases.length&&bases.every(b=>a.meta?.hiddenForBases?.includes(b)))assert.equal(a.meta.uiHidden,true,`all-base-hidden anchor needs explicit marker: ${a.id}`);}
 for(const id of review.ids){const a=POSE_COMPOSER_ANCHOR_OPTIONS.find(o=>o.id===id);assert.equal(a.meta.uiHidden,true);assert.notEqual(a.meta.deprecated,true);for(const b of a.bases||[a.base]){assert.ok(a.meta.hiddenForBases.includes(b));assert.equal(a.meta.randomEligibleForBases[b],false);}}
});
test('C3 retired controls remain retired and their workspace transition policy is unchanged',()=>{
 for(const key of RETIRED_POSE_COMPOSER_KEYS)assert.ok(!SINGLE_POSE_CONTROL_KEYS.includes(key));
 for(const id of review.ids){const locks=retirePage1PoseComposerLocks({poseAnchorId:id});assert.equal(locks.poseAnchorId,'none');}
});
test('C3 inverse restores exact pre-change source and rejects live/unknown copies',()=>{
 assert.throws(()=>preparePreC3PoseFiles(root),/isolated/);
 assert.throws(()=>preC3PoseSource('unknown'),/unknown/);
 const dir=mkdtempSync(join(tmpdir(),'c3-negative-'));
 try{const p=join(dir,review.path);mkdirSync(dirname(p),{recursive:true});writeFileSync(p,readFileSync(join(root,review.path)));preparePreC3PoseFiles(dir).apply();assert.equal(readFileSync(p,'utf8'),review.beforeSource);writeFileSync(p,'unknown');assert.throws(()=>preparePreC3PoseFiles(dir),/unknown/);}finally{rmSync(dir,{recursive:true,force:true});}
});
c2HistoricalTest('C3 fixed before matrix preserves outputs, choices, RNG and saved public text',()=>{
 execFileSync(process.execPath,[join(root,'scripts/c3_pose_acceptance.mjs')],{stdio:'pipe'});
});
