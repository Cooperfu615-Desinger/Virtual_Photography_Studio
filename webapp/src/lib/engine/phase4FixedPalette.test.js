import assert from 'node:assert/strict';import test from 'node:test';
import {createEmptyLocks,createSeededRandom,generatePrompts,getLockControls,getSceneDependentOptions} from '../engine.js';
import {buildAllNoneLocks,buildPage1ControlGroups} from '../../features/page1/page1Selectors.js';
const ids=["wardrobe:套裝-outfit-presets:套裝-白蕾絲泡袖七分褲:39", "wardrobe:套裝-outfit-presets:套裝-粉針織罩衫寬牛仔:40", "wardrobe:套裝-outfit-presets:套裝-深灰短背心氣球寬褲:41", "wardrobe:套裝-outfit-presets:套裝-白襯衫緞面背心寬牛仔:42", "wardrobe:套裝-outfit-presets:套裝-西裝外套蕾絲迷你洋裝:43", "wardrobe:套裝-outfit-presets:套裝-球衣荷葉迷你裙:44", "wardrobe:套裝-outfit-presets:套裝-綁帶針織寬牛仔:45", "wardrobe:套裝-outfit-presets:套裝-運動外套荷葉七分褲:46", "wardrobe:套裝-outfit-presets:套裝-白蕾絲長罩衫牛仔褲:47", "wardrobe:套裝-outfit-presets:套裝-spider-man-cosplay-緊身衣:56", "wardrobe:套裝-outfit-presets:套裝-venom-cosplay-緊身衣:57", "wardrobe:套裝-outfit-presets:套裝-spider-gwen-cosplay-緊身衣:58"];
const c=getLockControls(),opts=k=>c.find(x=>x.key===k).options;
const empty=()=>({...buildAllNoneLocks(c,createEmptyLocks()),subjectCount:'1',framingId:opts('framingId').find(x=>x.zh.includes('全身鏡頭')).id});
const gen=l=>generatePrompts(1,{...empty(),...l},[],{random:createSeededRandom('phase4-a4')})[0];
const texts=p=>[p.grokPrompt,p.zImagePrompt,p.midjourneyPrompt,p.nanoBananaPrompt,...p.extraPrompts.map(x=>x.text)].join('\n');
test('twelve authored fixed palettes ignore extra primary and complete-look colors without losing source',()=>{
 for(const id of ids){const item=opts('outfitPresetId').find(x=>x.id===id);assert.equal(item.meta.colorMode,'fixed');
 const p=gen({outfitPresetId:id,outfitPresetPrimaryColorId:'neon-green',completeLookPaletteId:opts('completeLookPaletteId').find(x=>x.id && x.id !== 'none' && x.id !== 'random').id});
 assert.doesNotMatch(texts(p),/neon green|outfit palette:/i);assert.ok(p.extraPrompts.find(x=>x.id==='full-body-character').text.toLowerCase().includes(item.en.toLowerCase()));
 assert.doesNotMatch(p.summaryFields.wardrobe,/螢光綠/);
 }
});
test('fixed palette UI controls remain isolated by role and become available for editable presets',()=>{
 const editable=opts('outfitPresetId').find(x=>x.meta?.colorMode==='primary_contrast');
 const keys=locks=>buildPage1ControlGroups({lockControls:c,locks,sceneDependentOptions:getSceneDependentOptions([],locks)}).wardrobeLockControls.map(x=>x.key);
 let l={...empty(),outfitPresetId:ids[0]};assert.ok(!keys(l).includes('outfitPresetPrimaryColorId'));assert.ok(!keys(l).includes('completeLookPaletteId'));
 l={...empty(),outfitPresetId:editable.id};assert.ok(keys(l).includes('outfitPresetPrimaryColorId'));assert.ok(keys(l).includes('completeLookPaletteId'));
 l={...empty(),subjectCount:'2',outfitPresetAId:ids[0],outfitPresetBId:editable.id};assert.ok(!keys(l).includes('outfitPresetAPrimaryColorId'));assert.ok(keys(l).includes('outfitPresetBPrimaryColorId'));assert.ok(keys(l).includes('completeLookPaletteBId'));
});
