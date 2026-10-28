import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import { getLockControls, createEmptyLocks, generatePrompts, createSeededRandom } from '../../lib/engine.js';
import { buildAllNoneLocks } from '../page1/page1Selectors.js';
import { parseLocksFromStandardPrompt, buildRestoreLocks, parseExportedMarkdownPrompt, buildMarkdownExport, serializeFavoritePrompt, deserializeFavoritePrompt } from './cardCodec.js';
import { parseSavedCardsArchive } from './savedCardArchive.js';
const controls=getLockControls(), options=k=>controls.find(c=>c.key===k).options;
const active=k=>options(k).filter(o=>o.id&&!['none','random'].includes(o.id)&&o.zh!=='全無');
const none=k=>options(k).find(o=>o.zh==='全無').id;
const dresses=active('dressId'),palettes=active('topBottomPaletteId');
const empty=()=>({...buildAllNoneLocks(controls,createEmptyLocks()),subjectCount:'1',framingId:options('framingId').find(o=>o.zh.includes('全身鏡頭')).id});
const gen=patch=>generatePrompts(1,{...empty(),...patch},[],{random:createSeededRandom('legacy-dress-prose')})[0];
const parse=text=>buildRestoreLocks(parseLocksFromStandardPrompt(text,controls).locks,controls);
const oldMd=p=>buildMarkdownExport(p).replace(/^<!-- VPStudio PAGE1 Snapshot:.* -->\n/,'');
const wardrobe=p=>p.grokPrompt.match(/Wardrobe:[\s\S]*/)?.[0];
const clause=(p,old=false)=>`${old?'coordinated top-to-bottom palette':'dress palette from top to bottom'}: upper/main dress area in ${p.topColor.en}, lower hem or skirt area in ${p.bottomColor.en}`;

test('A2 dress prose: 24 single dresses use canonical dress fields and do not populate dormant roles',()=>{
 for(const d of dresses){const r=parse(gen({dressId:d.id,dressColorId:'red'}).grokPrompt);assert.equal(r.dressId,d.id);assert.equal(r.dressColorId,'red');assert.equal(r.outfitPresetId,none('outfitPresetId'));for(const role of ['A','B']){assert.equal(r[`dress${role}Id`],none(`dress${role}Id`));assert.equal(r[`outfitPreset${role}Id`],none(`outfitPreset${role}Id`));}}
});
test('A2 dress prose: all 40 swatches survive apply and regeneration, including material and pattern',()=>{
 for(const color of active('dressColorId')){const p=gen({dressId:dresses[0].id,dressColorId:color.id}),r=parse(p.grokPrompt);assert.equal(r.dressColorId,color.id);assert.equal(wardrobe(gen({dressId:r.dressId,dressColorId:r.dressColorId})),wardrobe(p));}
});
test('A2 dress prose: all 42 ordered palettes in both runtime grammars survive paste and old Markdown',()=>{
 for(const palette of palettes)for(const old of [false,true]){
  const p=gen({dressId:dresses[0].id,topBottomPaletteId:palette.id});if(old)for(const k of ['grokPrompt','zImagePrompt','midjourneyPrompt'])p[k]=p[k].replaceAll('dress palette from top to bottom:','coordinated top-to-bottom palette:');
  for(const r of [parse(p.grokPrompt),parseExportedMarkdownPrompt(oldMd(p),controls,'old').selection]){assert.equal(r.dressId,dresses[0].id);assert.equal(r.topBottomPaletteId,palette.id);assert.equal(r.dressColorId,'none');assert.equal(r.outfitPresetId,none('outfitPresetId'));}
 }
});
test('A2 dress prose: ordered targets do not borrow short color words or accept incomplete/conflicting regions',()=>{
 const d=dresses[0],p=palettes[0],q=palettes[1];
 for(const fragment of [clause(p).split(', lower')[0],clause(p).replace(p.bottomColor.en,'unknown yellow'),clause(p)+', '+clause(q),clause(p).replace(p.bottomColor.en,p.bottomColor.en+' or blue'),`upper/main dress area in ${p.topColor.en}`]){
  const r=parse(`Wardrobe: ${p.topColor.en} ${d.en}, ${fragment}.`);assert.equal(r.dressId,d.id);assert.equal(r.topBottomPaletteId,'none');assert.equal(r.dressColorId,'none');
 }
 const repeated=parse(`Wardrobe: ${d.en}, ${clause(p)}. ${clause(p,true)}.`);assert.equal(repeated.topBottomPaletteId,p.id);
});
test('A2 dress prose: A/B source sections preserve different dresses and colors without shared-field override',()=>{
 const p=gen({subjectCount:'2',dressAId:dresses[0].id,dressBId:dresses[1].id,dressAColorId:'red',dressBColorId:'blue'}),r=parse(p.grokPrompt);
 assert.equal(r.dressId,none('dressId'));assert.equal(r.outfitPresetId,none('outfitPresetId'));
 for(const [role,index,color]of [['A',0,'red'],['B',1,'blue']]){assert.equal(r[`dress${role}Id`],dresses[index].id);assert.equal(r[`dress${role}ColorId`],color);assert.equal(r[`outfitPreset${role}Id`],none(`outfitPreset${role}Id`));}
 const q=gen(r);assert.match(q.grokPrompt,/red sleeveless mini dress/);assert.match(q.grokPrompt,/blue spaghetti-strap mini dress/);
});
test('A2 dress prose: same dress with distinct role palettes and absent role markers never guesses ownership',()=>{
 const p=gen({subjectCount:'2',dressAId:dresses[0].id,dressBId:dresses[0].id,topBottomPaletteAId:palettes[0].id,topBottomPaletteBId:palettes[1].id}),r=parse(p.grokPrompt);
 assert.equal(r.topBottomPaletteAId,palettes[0].id);assert.equal(r.topBottomPaletteBId,palettes[1].id);
 const missing=parse(`Two adult women. ${dresses[0].en}, ${clause(palettes[0])}.`);for(const role of ['','A','B']){assert.equal(missing[`dress${role}Id`],none(`dress${role}Id`));assert.equal(missing[`topBottomPalette${role}Id`],'none');}
});
test('A2 dress prose: conflicting garments do not choose an arbitrary same-family winner',()=>{
 const r=parse(`Wardrobe: ${dresses[0].en}. ${dresses[1].en}, ${clause(palettes[0])}.`);assert.equal(r.dressId,none('dressId'));assert.equal(r.topBottomPaletteId,'none');
});
test('A2 dress prose: true outfits and special takeover keep their original ownership',()=>{
 for(const key of ['outfitPresetId','specialOutfitId']){const item=active(key).find(o=>!dresses.some(d=>d.id===o.id)),r=parse(`Wardrobe: ${item.en}.`);assert.equal(r[key],item.id);}
});
test('A2 dress prose: old Markdown uses full GPT rather than conflicting compact color evidence and keeps public text',()=>{
 const p=gen({dressId:dresses[0].id,topBottomPaletteId:palettes[0].id});p.zImagePrompt=`${dresses[1].en}, ${clause(palettes[1])}.`;const r=parseExportedMarkdownPrompt(oldMd(p),controls,'source');assert.equal(r.selection.dressId,dresses[0].id);assert.equal(r.selection.topBottomPaletteId,palettes[0].id);for(const k of ['grokPrompt','zImagePrompt','midjourneyPrompt'])assert.equal(r[k],p[k]);
});
test('A2 dress prose: old ZIP shares Markdown recovery and preserves source text',async()=>{
 const p=gen({dressId:dresses[0].id,topBottomPaletteId:palettes[0].id}),zip=new JSZip();zip.file('prompt_old.md',oldMd(p));const [r]=await parseSavedCardsArchive(await zip.generateAsync({type:'nodebuffer'}),controls);assert.equal(r.selection.topBottomPaletteId,palettes[0].id);assert.equal(r.selection.dressId,dresses[0].id);assert.equal(r.grokPrompt,p.grokPrompt);
});
test('A2 dress prose: structured JSON and PAGE1 snapshots remain authoritative over parseable public prose',()=>{
 const p=gen({outfitPresetId:active('outfitPresetId').find(o=>!dresses.some(d=>d.id===o.id)).id});p.grokPrompt=`Wardrobe: red ${dresses[0].en}, ${clause(palettes[0])}.`;
 for(const r of [deserializeFavoritePrompt(serializeFavoritePrompt(p)),parseExportedMarkdownPrompt(buildMarkdownExport(p),controls,'snapshot')]){assert.equal(r.selection.outfitPresetId,p.selection.outfitPresetId);assert.equal(r.selection.dressId,p.selection.dressId);assert.equal(r.grokPrompt,p.grokPrompt);}
});


test('A2 dress prose: mixed true outfit and dress preserve role selection without shared takeover',()=>{
 const outfit=active('outfitPresetId').find(o=>!dresses.some(d=>d.id===o.id));
 for(const swapped of [false,true]){
  const a=swapped?outfit:dresses[0],b=swapped?dresses[0]:outfit;
  const r=parse(`Two adult women. Woman 1: ${a.en}. Woman 2: ${b.en}. Scene: empty studio.`);
  const dressRole=swapped?'B':'A',outfitRole=swapped?'A':'B';
  assert.equal(r[`dress${dressRole}Id`],dresses[0].id);assert.equal(r[`outfitPreset${dressRole}Id`],none(`outfitPreset${dressRole}Id`));
  assert.equal(r[`outfitPreset${outfitRole}Id`],outfit.id);assert.equal(r.outfitPresetId,none('outfitPresetId'));assert.equal(r.dressId,none('dressId'));
 }
});
