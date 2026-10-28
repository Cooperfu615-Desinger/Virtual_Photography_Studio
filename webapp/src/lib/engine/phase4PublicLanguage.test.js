import assert from 'node:assert/strict';
import test from 'node:test';
import {createEmptyLocks,createSeededRandom,generatePrompts,getLockControls} from '../engine.js';
import {buildAllNoneLocks} from '../../features/page1/page1Selectors.js';
import {buildPage1WorldSceneArchitecture,WORLD_SCENE_LOCATIONS} from '../page3WorldScene.js';
const controls=getLockControls(),opts=k=>controls.find(c=>c.key===k).options;
const empty=()=>({...buildAllNoneLocks(controls,createEmptyLocks()),subjectCount:'1',framingId:opts('framingId').find(x=>x.zh.includes('全身鏡頭')).id});
const gen=locks=>generatePrompts(1,{...empty(),...locks},[],{random:createSeededRandom('phase4-a3')})[0];
const texts=p=>[p.grokPrompt,p.zImagePrompt,p.midjourneyPrompt,p.nanoBananaPrompt,...p.extraPrompts.map(x=>x.text)].join('\n');
const forbidden=/no background structure specified|without generating a stage venue|PAGE3 camera and environment layer|real-place guards adapted for the background|as the locked footwear state/i;
test('studio ambient and transport fixed sets expose visible light without control clauses',()=>{
 const lights=opts('lightingId').filter(x=>['高調純白攝影棚','柔霧美妝攝影棚','舞台演出燈光'].includes(x.zh));assert.equal(lights.length,3);
 for(const light of lights){assert.doesNotMatch(light.en,forbidden);for(const set of opts('fixedCompositionSetId').filter(x=>/車廂|車內|車窗/.test(x.zh)))assert.doesNotMatch(texts(gen({lightingId:light.id,fixedCompositionSetId:set.id})),forbidden);}
});
test('PAGE3 imported architecture retains location and camera without internal layer labels',()=>{
 for(const l of WORLD_SCENE_LOCATIONS){const architecture=buildPage1WorldSceneArchitecture({sceneMode:'street-only',worldLocation:l.id,cameraSystem:'ricoh-gr'});assert.doesNotMatch(architecture.text,forbidden);assert.match(architecture.text,/Ricoh GR/);const p=gen({importedWorldSceneMode:'architecture',importedWorldSceneArchitectureText:architecture.text});assert.doesNotMatch(texts(p),forbidden);}
});
test('bare feet remain visible while original character data and old imported text stay intact',()=>{
 const p=gen({characterProfileId:'character-hina'});assert.match(p.grokPrompt,/bare feet/i);assert.match(p.zImagePrompt,/bare feet/i);assert.doesNotMatch(texts(p),forbidden);
 const old='PAGE3 camera and environment layer: Ricoh GR compact street camera; real-place guards adapted for the background: preserve local storefront rhythm';const imported=gen({importedWorldSceneMode:'architecture',importedWorldSceneArchitectureText:old});assert.doesNotMatch(texts(imported),forbidden);assert.equal(imported.selection.importedWorldSceneArchitectureText,old);
});
