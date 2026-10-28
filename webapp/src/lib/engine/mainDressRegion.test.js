import {createCompositionVisibilityProjection} from './compositionVisibilityContract.js';
import assert from 'node:assert/strict';
import test from 'node:test';
import {createEmptyLocks,createSeededRandom,generatePrompts,getLockControls} from '../engine.js';
import {buildAllNoneLocks} from '../../features/page1/page1Selectors.js';
const c=getLockControls(),opts=k=>c.find(x=>x.key===k).options,active=k=>opts(k).filter(x=>x.id&&!['none','random'].includes(x.id)&&x.zh!=='全無');
const dresses=active('dressId');
const locks=()=>({...buildAllNoneLocks(c,createEmptyLocks()),subjectCount:'1',dressId:dresses[0].id,topBottomPaletteId:'cherry-blossom-cream'});
const gen=x=>generatePrompts(1,{...locks(),...x},[],{random:createSeededRandom('a2-main-regions')})[0];
test('near main GPT/Z/Nano keep upper dress color in its visible region, never at the lower edge',()=>{
 for(const framing of active('framingId').filter(x=>['headShoulders','chestUp','mediumWaist'].includes(createCompositionVisibilityProjection(x).bucket)))for(const dress of dresses){
  const p=gen({framingId:framing.id,dressId:dress.id});for(const key of ['grokPrompt','zImagePrompt','nanoBananaPrompt']){assert.match(p[key],/upper\/main dress area in cherry blossom pink/i,key+framing.zh);assert.doesNotMatch(p[key],/lower hem or skirt area|cream yellow|dress palette from top to bottom/i);}
 }
});
test('duo near regional colors belong to A and B independently',()=>{
 const p=gen({subjectCount:'2',framingId:opts('framingId').find(x=>x.zh==='胸上特寫').id,dressAId:dresses[0].id,dressBId:dresses[1].id,topBottomPaletteAId:'cherry-blossom-cream',topBottomPaletteBId:'none',dressBColorId:'blue'});
 for(const key of ['grokPrompt','zImagePrompt']){const a=key==='zImagePrompt'?p[key].split(/She wears/i)[1]:p[key].split(/woman 1:?/i)[1]?.split(/woman 2:?/i)[0];const b=key==='zImagePrompt'?p[key].split(/She wears/i)[2]:p[key].split(/woman 2:?/i)[1];assert.match(a,/upper\/main dress area in cherry blossom pink/i);assert.doesNotMatch(b,/upper\/main dress area/i);assert.match(b,/blue/i);}
});
test('opaque closed coat and independent chest/full-body references keep their visibility contract',()=>{
 const near=gen({framingId:opts('framingId').find(x=>x.zh==='胸上特寫').id});assert.match(near.extraPrompts.find(x=>x.id==='chest-up-portrait').text,/upper\/main dress area/);assert.match(near.extraPrompts.find(x=>x.id==='full-body-character').text,/lower hem or skirt area in cream yellow/);
 const p=gen({framingId:near.selection.framingId,outerwearId:active('outerwearId').find(x=>x.en.includes('blazer')).id,outerwearOpeningId:'wardrobe:外套開合-outerwear-opening:fully-closed:5'});assert.doesNotMatch(p.grokPrompt,/upper\/main dress area/);
});
