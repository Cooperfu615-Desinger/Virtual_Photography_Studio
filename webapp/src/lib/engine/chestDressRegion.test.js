import assert from 'node:assert/strict';
import test from 'node:test';
import {createEmptyLocks,createSeededRandom,generatePrompts,getLockControls} from '../engine.js';
import {buildAllNoneLocks} from '../../features/page1/page1Selectors.js';
const controls=getLockControls();
const options=key=>controls.find(c=>c.key===key).options;
const active=key=>options(key).filter(o=>o.id&&!['none','random'].includes(o.id)&&o.zh!=='全無');
const dresses=active('dressId'),palettes=active('topBottomPaletteId');
const base=()=>({...buildAllNoneLocks(controls,createEmptyLocks()),subjectCount:'1',framingId:options('framingId').find(o=>o.zh.includes('全身鏡頭')).id,dressId:dresses[0].id,topBottomPaletteId:palettes[0].id});
const generate=overrides=>generatePrompts(1,{...base(),...overrides},[],{random:createSeededRandom('chest-dress-region-a2')})[0];
const chest=p=>p.extraPrompts.find(e=>e.id==='chest-up-portrait')?.text||'';
const wardrobe=p=>chest(p).split('Wardrobe:\n')[1]?.split('\n\n')[0]||'';
test('A2 chest dress retains visible upper regional ownership for all 24 dresses',()=>{
 assert.equal(dresses.length,24);
 for(const dress of dresses){const p=generate({dressId:dress.id});assert.match(wardrobe(p),/upper\/main dress area in cherry blossom pink/i,dress.id);assert.doesNotMatch(wardrobe(p),/lower hem or skirt area|cream yellow|dress palette from top to bottom/i);assert.equal(p.selection.topBottomPaletteId,palettes[0].id);}
});
test('A2 chest regional projection is independent of all parent crops and keeps full-body paired areas',()=>{
 for(const framing of active('framingId')){const p=generate({framingId:framing.id});assert.match(wardrobe(p),/upper\/main dress area in cherry blossom pink/i);assert.match(p.extraPrompts.find(e=>e.id==='full-body-character').text,/lower hem or skirt area in cream yellow/i);}
});
test('A2 opaque fully closed outerwear hides the upper area, while through-fabric closure retains it',()=>{
 const coats=active('outerwearId');
 for(const [name,visible]of [['西裝外套',false],['透膚薄紗罩衫',true]]){
  const coat=coats.find(o=>o.zh===name)||coats.find(o=>visible?o.meta?.outerwear?.closedInnerLayerVisibility==='through-fabric':o.en?.includes('blazer'));
  assert.ok(coat,name);
  const p=generate({outerwearId:coat.id,outerwearOpeningId:'wardrobe:外套開合-outerwear-opening:fully-closed:5'});
  assert.equal(/upper\/main dress area/i.test(wardrobe(p)),visible,name);
 }
});
test('A2 mono color and duo stay outside the chest regional contract',()=>{
 const p=generate({topBottomPaletteId:'none',dressColorId:'red'});assert.doesNotMatch(wardrobe(p),/upper\/main dress area/);assert.match(wardrobe(p),/red/);
 const duo=generate({subjectCount:'2',dressAId:dresses[0].id,dressBId:dresses[1].id,topBottomPaletteAId:palettes[0].id,topBottomPaletteBId:palettes[1].id});assert.equal(chest(duo),'');
});
