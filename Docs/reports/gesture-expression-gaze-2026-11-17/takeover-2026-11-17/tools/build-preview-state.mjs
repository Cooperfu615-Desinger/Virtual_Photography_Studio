// Synthetic browser fixtures only; never reads or writes real browser storage.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {upperBodyStateLocks, upperBodyStateOption, runUpperBodyStateCase} from '../../../../../webapp/src/lib/engine/specifiedActionUpperBodyStateFixtures.js';
import {serializeFavoritePrompt} from '../../../../../webapp/src/features/saved-cards/cardCodec.js';
import {withGrokImagineForSave} from '../../../../../webapp/src/lib/grokImagineResult.js';

const expression = key => 'character:表情-facial-expression:' + key;
const cases = [
  ['A1', '單手比中指', {gestureId:'gesture-middle-finger-single'}],
  ['A2', '雙手比中指', {gestureId:'gesture-middle-finger-both'}],
  ['B1', '閉眼享受', {expressionId:expression('eyes-closed-enjoyment'), gazeId:'gaze-sideways-camera', headPostureId:'head-slight-tilt'}],
  ['B2', 'wink微笑', {expressionId:expression('wink-toothy-smile'), gazeId:'gaze-camera'}],
  ['B3', '瞇眼微笑', {expressionId:expression('squinting-toothy-smile'), gazeId:'gaze-camera'}],
  ['C1', '斜眼看鏡頭', {gazeId:'gaze-sideways-camera'}],
  ['C2', '低頭抬眼看鏡頭', {gazeId:'gaze-chin-down-eyes-up'}],
];
const locksFor = (patch, frame) => upperBodyStateLocks({subjectCount:'1',specifiedActionId:'specified-standing-natural',
  locationId:upperBodyStateOption('locationId','室內：日本學校教室'),
  angleId:upperBodyStateOption('angleId','平視高度鏡頭'),
  framingId:upperBodyStateOption('framingId',frame),...patch});
const cards = [];
const expected = [];
for (const [code,label,patch] of cases) for (const [frameName,frame] of [['full','全身鏡頭 (Full Body Shot)'],['medium','中景鏡頭 (Medium Shot)']]) {
  const locks=locksFor(patch,frame);
  const result=runUpperBodyStateCase({key:code+'/'+frameName,seed:'gesture-takeover/'+code+'/'+frameName,locks});
  assert.equal(result.cards.length,7);
  const prompt=withGrokImagineForSave({...result.prompt,id:'gesture-qa-'+code+'-'+frameName,
    date:'2026-11-17T04:00:00.000Z',summary:'Gesture QA '+code+' '+label+' '+frameName});
  cards.push(serializeFavoritePrompt(prompt));
  expected.push({code,label,frame:frameName,summary:prompt.summary,outputs:result.cards.map(card=>({id:card.id,value:card.value}))});
}
const old=JSON.parse(readFileSync(new URL('../../../pose-upper-body-state-batch3-2026-11-12/tools/preview-state.json',import.meta.url)));
writeFileSync(new URL('./preview-state.json',import.meta.url),JSON.stringify({
  'vps.locks':JSON.stringify(locksFor(cases[0][2],'中景鏡頭 (Medium Shot)')),
  'vps.pageMode':'page1','vps.favorites':JSON.stringify(cards),'vps.page3Profile':old['vps.page3Profile'],
},null,2)+'\n');
writeFileSync(new URL('./preview-expectations.json',import.meta.url),JSON.stringify(expected,null,2)+'\n');
console.log(JSON.stringify({cards:cards.length,options:cases.length,sevenOutputs:true}));
