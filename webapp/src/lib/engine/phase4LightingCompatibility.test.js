import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLockControls, getSceneDependentOptions, createEmptyLocks, generatePrompts, createSeededRandom } from '../engine.js';
import { buildAllNoneLocks } from '../../features/page1/page1Selectors.js';
const controls=getLockControls(),options=k=>controls.find(x=>x.key===k).options;
const active=k=>options(k).filter(x=>x.id&&x.zh!=='全無');
const full=active('framingId').find(x=>x.zh.includes('全身鏡頭')).id;
const locks=()=>({...buildAllNoneLocks(controls,createEmptyLocks()),subjectCount:'1',framingId:full});
const isolated=loc=>loc.zh!=='全無'&&loc.meta.tags.includes('indoor')&&loc.meta.tags.some(t=>['studio','subterranean','underground'].includes(t));
test('A6 enclosed studios and underground exclude scene-bound natural ambient and subject lights',()=>{
 const locations=active('locationId').filter(isolated);assert.equal(locations.length,20);
 for(const loc of locations){const list=getSceneDependentOptions([],{...locks(),locationId:loc.id});
  for(const item of list.lightingOptions)assert.equal(item.meta.tags.some(t=>['natural_light','window_light','sunlight'].includes(t)),false,loc.zh+item.zh);
  for(const item of list.lightDirectionOptions)if(!item.meta.subjectLight?.independentKey)assert.equal(item.meta.tags.some(t=>['natural_light','window_light','sunlight'].includes(t)),false,loc.zh+item.zh);
 }
 for(const zh of ['室內：漸層打光背景','室內：多色塊撞色背景']){
  const loc=active('locationId').find(x=>x.zh===zh),list=getSceneDependentOptions([],{...locks(),locationId:loc.id});
  assert.ok(loc.meta.tags.includes('studio_lighting_scene'));for(const name of ['高調純白攝影棚','柔霧美妝攝影棚','舞台演出燈光'])assert.ok(list.lightingOptions.some(x=>x.zh===name),zh+name);
 }
});
test('A6 non-transit fixed-set UI ambient choices survive actual resolution despite stale ordinary scene locks',()=>{
 for(const set of active('fixedCompositionSetId').filter(x=>!x.meta.tags.some(t=>['station_set','carriage_set'].includes(t)))){
  const l={...locks(),fixedCompositionSetId:set.id,sceneAttributeId:'outdoor',locationId:active('locationId').find(x=>x.zh==='室內：純潔白幕').id};
  for(const light of getSceneDependentOptions([],l).lightingOptions){const p=generatePrompts(1,{...l,lightingId:light.id},[],{random:createSeededRandom('a6-fixed')})[0];assert.equal(p.selection.lightingId,light.id,set.zh+light.zh);}
 }
});
test('A6 direct explicit ordinary locks and transit manual lighting keep legacy precedence',()=>{
 const light=active('lightingId').find(x=>x.zh==='室內窗邊日光'),loc=active('locationId').find(x=>x.zh==='室內：純潔白幕');
 const p=generatePrompts(1,{...locks(),locationId:loc.id,lightingId:light.id},[],{random:createSeededRandom('a6-old-lock')})[0];assert.equal(p.selection.lightingId,light.id);
 for(const set of active('fixedCompositionSetId').filter(x=>x.meta.tags.some(t=>['station_set','carriage_set'].includes(t))))assert.deepEqual(getSceneDependentOptions([],{...locks(),fixedCompositionSetId:set.id}).lightingOptions.map(x=>x.id),options('lightingId').map(x=>x.id));
});
