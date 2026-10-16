import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyLocks, getLockControls, generatePrompts, createSeededRandom } from '../engine.js';
import { POSE_COMPOSER_HAND_OPTIONS } from './poseComposerOptions.js';
import { buildRestoreLocks, parseLocksFromStandardPrompt, serializeFavoritePrompt, deserializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';
const controls=getLockControls();
const ids=['squatting-hands-forward','squatting-hands-outer-legs','squatting-one-hand-cheek-one-knee','squatting-both-hands-cheeks','squatting-one-hand-v-sign','squatting-forearms-outward-drape','squatting-elbows-center-drape'];
const source=id=>POSE_COMPOSER_HAND_OPTIONS.find(o=>o.id===id);
const bases=['squatting-natural','squatting-side','squatting-forward-lean','squatting-gangster-wide-knee'];
function locks(hand, arrangement=bases[0], frame='全身鏡頭 (Full Body Shot)') {
 const l=createEmptyLocks();for(const c of controls){const n=c.options.find(o=>o.zh==='全無'||o.zh==='無額外表情');if(n)l[c.key]=n.id;}
 return {...l,subjectCount:'1',poseBaseId:'squatting',poseArrangementId:arrangement,poseHandId:hand,framingId:controls.find(c=>c.key==='framingId').options.find(o=>o.zh===frame).id};
}
const generate=l=>generatePrompts(1,l,[],{random:createSeededRandom('squat-hands-v2')})[0];
const main=p=>[p.grokPrompt,p.zImagePrompt,p.midjourneyPrompt,p.nanoBananaPrompt];
test('seven public squat hands merge cheeks and retain historical mouth restore',()=>{
 assert.deepEqual(POSE_COMPOSER_HAND_OPTIONS.filter(o=>o.meta?.tags?.includes('squatting_hand_pose')&&!o.meta?.uiHidden).map(o=>o.id),ids);
 assert.equal(source(ids[0]).zh,'雙肘靠膝自然垂手');assert.equal(source(ids[3]).zh,'雙手托腮');
 const old=source('squatting-one-hand-mouth-one-down');assert.equal(old.meta.uiHidden,true);assert.equal(old.meta.randomEligible,false);
 const p=generate(buildRestoreLocks(locks(old.id),controls));assert.equal(p.selection.poseHandId,old.id);assert.ok(p.grokPrompt.includes(old.en));
});
test('all 28 combinations share exact hand sources without overriding squat, head or support',()=>{
 for(const id of ids)for(const base of bases){const l=locks(id,base),p=generate(l);assert.equal(p.selection.poseHandId,id);assert.equal(p.selection.poseArrangementId,base);assert.equal(p.selection.poseAnchorId,'none');assert.equal(p.selection.poseHeadId,'none');for(const t of main(p))assert.ok(t.includes(source(id).en),id);}
 assert.match(source(ids[5]).en,/distal forearm near the wrist/);assert.match(source(ids[6]).en,/inward and downward between the knees/);
});
test('upper crops omit off-frame support and full-body reference stays independent',()=>{
 const ref=generate(locks('none')).extraPrompts.find(p=>p.id==='full-body-character').text;
 for(const id of ids)for(const frame of ['胸上特寫','中景鏡頭 (Medium Shot)','半臉傾斜特寫']){const p=generate(locks(id,bases[0],frame));assert.equal(p.selection.poseHandId,id);for(const t of [...main(p),p.extraPrompts.find(e=>e.id==='chest-up-portrait').text])assert.doesNotMatch(t,/same-side thighs|opposite knee|outer ankles|lower shins|outer knee edges|between the knees/);assert.equal(p.extraPrompts.find(e=>e.id==='full-body-character').text,ref);}
});
test('old English and Saved Cards retain IDs and original stored prose',()=>{
 for(const id of ids){const p=generate(locks(id));const saved=deserializeFavoritePrompt(serializeFavoritePrompt(p));assert.equal(saved.selection.poseHandId,id);assert.equal(saved.grokPrompt,p.grokPrompt);assert.equal(parseLocksFromStandardPrompt(p.grokPrompt,controls).locks.poseHandId,id);for(const alias of source(id).meta.legacyPromptAliases||[]){assert.equal(parseLocksFromStandardPrompt(`She has ${alias}.`,controls).locks.poseHandId,id);}}
});
test('seeded random uses the seven dedicated hands, never retired mouth',()=>{
 const seen=new Set();for(const p of generatePrompts(128,locks('random'),[],{random:createSeededRandom('squat-hands-pool')})){assert.ok(ids.includes(p.selection.poseHandId),p.selection.poseHandId);seen.add(p.selection.poseHandId);}assert.equal(seen.size,7);
});
