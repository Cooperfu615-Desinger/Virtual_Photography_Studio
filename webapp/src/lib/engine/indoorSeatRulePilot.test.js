// Additive pilot: independent reviewed rules, never a replacement for old seals.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { getLockControls, getSceneDependentOptions } from '../engine.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import { indoorSeatingModel, applyIndoorSeat } from './indoorSeating.js';
import { seatFixture, seatFramings } from './indoorSeatFixtures.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt, buildRestoreLocks } from '../../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const actions = SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(a => a.family === 'sitting');
const locations = getSceneDependentOptions([], {subjectCount:'1',sceneAttributeId:'indoor'}).locationOptions.filter(o => o.zh !== '全無');
const readDoc = name => readFileSync(new URL('../../../../Docs/specs/' + name,import.meta.url),'utf8');
const rows = text => text.split('\n').filter(s => s.startsWith('| ')).map(s => s.split('|').slice(1,-1).map(c => c.trim()));
const names = {椅子:'chair',凳子:'stool',長椅:'bench',沙發:'sofa',床邊:'bed-edge',床上:'bed-top',桌子:'table',檯面:'counter',講台:'platform',台階:'step',箱子:'box',坐墊:'cushion',墊子:'mat',地板:'floor'};
const phrases = {chair:'on a chair',stool:'on a stool',bench:'on a bench',sofa:'on a sofa','bed-edge':'on the edge of the bed','bed-top':'on the bed',table:'on a table',counter:'on a counter',platform:'on a platform',step:'on a step',box:'on a box',cushion:'on a cushion',mat:'on a mat',floor:'on the floor'};
const reviewedScenes = new Map(rows(readDoc('indoor-seating-scenes-v1.md')).filter(([name]) => /^(室內：|其他：)/.test(name)));
const reviewedRules = rows(readDoc('indoor-seating-v1.md')).filter(([name]) => name.split('、').some(n => actions.some(a => a.zh === n)));
const location = zh => { const value=locations.find(p => p.zh===zh);assert.ok(value,zh);return value; };
const action = zh => { const value=actions.find(a=>a.zh===zh);assert.ok(value,zh);return value; };
function offered(place) {
  // Separately approved later addition; do not infer expectations from runtime maps.
  if (place.zh === '室內：日本 Lawson 便利商店內') return ['凳子','地板'];
  assert.ok(reviewedScenes.has(place.zh), 'unreviewed scene: '+place.zh);
  return reviewedScenes.get(place.zh).split('、').flatMap(n => n==='床'?['床邊','床上']:[n]);
}
function rule(a) {
  const name=a.id==='specified-sitting-low-aloof-cats-adjustable-angle'?'低坐貓群冷淡氛圍':a.zh;
  const row=reviewedRules.find(([names]) => names.split('、').includes(name));assert.ok(row,name);return row[1];
}
const model = (p,a,id) => indoorSeatingModel({subjectCount:'1',locationId:p.id,specifiedActionId:a.id,indoorSeatId:id},p,controls);

test('seat pilot: all 84 current scenes and 15 actions match independent reviewed rules, including every offered value', () => {
  assert.equal(locations.length,84);assert.equal(actions.length,15);assert.equal(reviewedScenes.size,83);
  let checked=0;
  for(const p of locations)for(const a of actions){
    const seats=offered(p),r=rule(a),empty=model(p,a,''),invalid=model(p,a,'unknown');
    if(r.startsWith('固定地面')){
      assert.equal(empty.mode,'ground');
      const bedOnly=seats.every(n=>n==='床邊'||n==='床上');
      const expected=bedOnly?'':p.lyingSurface?.type==='tatami'?'on the tatami floor':'on the floor';
      assert.equal(empty.phrase,expected);assert.equal(invalid.phrase,expected);
      assert.equal(applyIndoorSeat(a.en,empty),expected?a.en.replaceAll('on the ground',expected):a.en);
    }else{
      const allowed=r.startsWith('允許')?seats:r.replace('。','').split('、');
      const expected=seats.filter(n=>allowed.includes(n)).map(n=>names[n]);
      assert.deepEqual(empty.options.map(o=>o.id),expected,p.zh+'/'+a.zh);
      assert.equal(empty.selectedId,'');assert.equal(invalid.selectedId,'');assert.equal(applyIndoorSeat(a.en,empty),a.en);
      for(const id of expected){const picked=model(p,a,id);assert.equal(picked.selectedId,id);assert.equal(picked.phrase,id==='floor'&&p.lyingSurface?.type==='tatami'?'on the tatami floor':phrases[id]);}
    }
    checked++;
  }
  assert.equal(checked,1260);
});

// Each physical relation is independently named. Preserve every framing, including
// legacy crops; the original 18,480-case regression continues to execute too.
const physicalCases = [
 ['室內：日本學校教室','自然坐姿','chair'],['室內：古書二手書店','自然坐姿','stool'],
 ['室內：英倫復古窗邊房間','自然坐姿','bench'],
 ['室內：現代高樓公寓客廳','自然坐姿','sofa'],['其他：白色床鋪','自然坐姿','bed-edge'],
 ['其他：白色床鋪','盤腿坐姿','bed-top'],['室內：日本學校教室','微微前傾','table'],
 ['室內：日本住宅使用感廚房','自然坐姿','counter'],['室內：日本學校教室','雙腿自然伸展','platform'],
 ['室內：夜間家庭派對','翹二郎腿','step'],['室內：地下 live house 後台','開闊自信坐姿','box'],
 ['室內：日式和室','雙腿屈起','cushion'],['室內：日本學校教室','單腿屈起坐姿','floor'],
 ['室內：廢棄校舍體育器材室','盤腿坐姿','mat'],
 ['室內：日式和室','雙腿側放坐姿','floor'],['室內：現代高樓公寓客廳','隨性癱坐','sofa'],
];
const byId = result => Object.fromEntries(result.cards.map(c=>[c.id,c.value]));
function checkRelation(before,after,canonical,expected,id,label){
  assert.equal(after.draws,before.draws,label+'/RNG');
  assert.deepEqual(after.prompt.selection,{...before.prompt.selection,indoorSeatId:id},label+'/selection');
  const old=byId(before),next=byId(after);
  assert.deepEqual(Object.keys(next),Object.keys(old));assert.equal(Object.keys(next).length,7);
  assert.ok(next['grok-imagine'].includes(expected),label+'/full canonical contact');
  for(const key of ['full-body-character','chest-up-portrait'])assert.equal(next[key],old[key],label+'/'+key);
  for(const key of ['gpt','grok','ai','nano-banana-2.1'])assert.equal(next[key],old[key].includes(canonical)?old[key].replaceAll(canonical,expected):old[key],label+'/'+key);
}

test('seat pilot: physical relations across every framing preserve seven outputs, selections and RNG', () => {
  const covered=new Set();
  for(const [room,pose,id] of physicalCases){
    const p=location(room),a=action(pose);covered.add(id);
    const phrase=id==='floor'&&p.lyingSurface?.type==='tatami'?'on the tatami floor':phrases[id];
    const expected=pose==='微微前傾'?a.en.replace(/^She sits leaning/,'She sits '+phrase+', leaning'):a.en.replace(/^She sits(?: cross-legged| casually slumped)?/,s=>s+' '+phrase);
    for(const frame of seatFramings){
      const before=seatFixture(room,pose,frame),after=seatFixture(room,pose,frame,{indoorSeatId:id});
      checkRelation(before,after,a.en,expected,id,room+'/'+pose+'/'+frame);
    }
  }
  assert.deepEqual([...covered].sort(),Object.keys(phrases).sort());
});

test('seat pilot: selected bed position survives saved-card restoration and actual regeneration', () => {
  const frame=seatFramings[0];
  for(const id of ['bed-edge','bed-top']){
    const original=seatFixture('其他：白色床鋪','自然坐姿',frame,{indoorSeatId:id});
    const saved=deserializeFavoritePrompt(serializeFavoritePrompt(original.prompt));
    const locks=buildRestoreLocks(saved.selection,controls);
    assert.equal(locks.indoorSeatId,id);
    const restored=seatFixture('其他：白色床鋪','自然坐姿',frame,locks);
    assert.deepEqual(byId(restored),byId(original));
  }
});
