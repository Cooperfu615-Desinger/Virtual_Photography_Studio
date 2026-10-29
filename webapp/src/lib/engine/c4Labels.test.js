import process from 'node:process';
import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {POSE_COMPOSER_HAND_OPTIONS as hands, POSE_COMPOSER_PROP_OPTIONS as props} from './poseComposerOptions.js';
import patches from '../../../../scripts/lib/c4LabelsPatches.json' with {type:'json'};
import {preC4LabelsSource} from '../../../../scripts/lib/c4LabelsReplay.mjs';
test('C4 distinguishes active and legacy chin labels without reactivating old selection',()=>{
 const active=hands.find(x=>x.id==='one-hand-support-chin'),old=hands.find(x=>x.id==='one-hand-chin-other-down');
 assert.equal(active.zh,'單手托下巴');assert.match(active.desc,/指尖/);assert.equal(Boolean(active.meta.uiHidden),false);
 assert.equal(old.zh,'單手托下巴（舊版）');assert.equal(old.meta.uiHidden,true);assert.equal(old.meta.deprecated,true);
 assert.equal(props.find(x=>x.id==='hand-hold-fuji-x100v').zh,'手持 FUJIFILM X100V 相機');
});
test('C4 source inverse restores exactly approved pre-change bytes',()=>{
 for(const f of patches.files){const bytes=readFileSync(new URL('../../../../'+f.path,import.meta.url));assert.equal(preC4LabelsSource(f.path,bytes).toString(),f.beforeSource);}
});
test('C4 90 frozen cases preserve English outputs, selections, RNG and saved text',()=>{
 execFileSync(process.execPath,[new URL('../../../../scripts/c4_labels_acceptance.mjs',import.meta.url).pathname],{stdio:'pipe'});
});
