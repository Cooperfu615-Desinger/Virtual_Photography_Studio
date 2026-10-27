import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { getLockControls, createEmptyLocks, generatePrompts, createSeededRandom } from '../../lib/engine.js';
import { parseLocksFromStandardPrompt, parseExportedMarkdownPrompt, buildMarkdownExport, buildRestoreLocks } from './cardCodec.js';
const controls = getLockControls();
const option = (key, term) => controls.find(c => c.key === key).options.find(o => o.zh.includes(term));
const parse = text => buildRestoreLocks(parseLocksFromStandardPrompt(text, controls).locks, controls);
const empty = () => {
  const locks = createEmptyLocks();
  for (const c of controls) { const none = c.options.find(o => o.zh === '全無' || o.id === 'none'); if (none) locks[c.key] = none.id; }
  return { ...locks, subjectCount: '1', framingId: option('framingId', '全身鏡頭').id };
};
const generate = locks => generatePrompts(1, { ...empty(), ...locks }, [], { random: createSeededRandom('a2-recovery') })[0];
const saved = JSON.parse(gunzipSync(readFileSync(new URL('../../../../Docs/reports/wardrobe-control-a2-outfits-2026-10-27/acceptance/baseline-and-saved.json.gz', import.meta.url)))).saved;

test('A2 recovery: all 40 archived no-color outfits keep main and contrast unspecified and public text intact', () => {
  for (const s of saved) {
    const p = parseExportedMarkdownPrompt(s.markdown, controls, 'recovery');
    assert.equal(p.selection.outfitPresetPrimaryColorId, 'none', s.id);
    assert.equal(p.selection.outfitPresetContrastColorId, 'none', s.id);
    assert.equal(p.selection.outfitPresetId, s.id, s.id);
    assert.equal(p.grokPrompt, s.raw.g);
    assert.equal(p.zImagePrompt, s.raw.z);
    assert.equal(p.midjourneyPrompt, s.raw.m);
  }
});

test('A2 recovery: non-color substrings and unrelated body/scene colors cannot recolor garments', () => {
  for (const text of ['tailored blazer, layered skirt, embroidered trim', 'Subject: red hair and blue eyes. Scene: green trees. Wardrobe: tailored blazer.']) {
    const p = parse(text);
    for (const key of ['topColorId','bottomColorId','outfitPresetPrimaryColorId','outfitPresetContrastColorId','shoesColorId']) assert.equal(p[key], 'none', text + ':' + key);
  }
});

test('A2 recovery: structured outfit bindings distinguish primary contrast and fixed gold', () => {
  const locks = { outfitPresetId: option('outfitPresetId','粉紅哥德').id, outfitPresetPrimaryColorId:'light-blue', outfitPresetContrastColorId:'white', outfitPresetLockedPaletteId:'metallic-gold' };
  const p=generate(locks), s=parseExportedMarkdownPrompt(buildMarkdownExport(p),controls,'colored').selection;
  for (const [key,value] of Object.entries(locks)) assert.equal(s[key],value,key);
});

test('A2 recovery: generic outfit channels and genuine red are retained', () => {
  const locks = { outfitPresetId:option('outfitPresetId','鏈條緞面').id, outfitPresetPrimaryColorId:'red', outfitPresetContrastColorId:'black' };
  const s=parse(generate(locks).grokPrompt);
  for(const [key,value] of Object.entries(locks)) assert.equal(s[key],value,key);
});

test('A2 recovery: duo garment ownership and four independent colors stay with each woman', () => {
  const locks={subjectCount:'2',outfitPresetAId:option('outfitPresetAId','粉紅哥德').id,outfitPresetBId:option('outfitPresetBId','鏈條緞面').id,outfitPresetAPrimaryColorId:'light-blue',outfitPresetAContrastColorId:'white',outfitPresetBPrimaryColorId:'red',outfitPresetBContrastColorId:'black'};
  const p=generate(locks),s=parseExportedMarkdownPrompt(buildMarkdownExport(p),controls,'duo').selection;
  for(const [key,value] of Object.entries(locks)) assert.equal(s[key],value,key);
  for(const key of ['outfitPresetPrimaryColorId','outfitPresetContrastColorId']) assert.equal(s[key],'none',key);
});

test('A2 recovery: unlabelled duo prose and contradictory channel evidence are conservative', () => {
  const p=parse('Two adult women. She wears red silk. She wears blue silk.');
  for(const key of ['outfitPresetAPrimaryColorId','outfitPresetBPrimaryColorId','topAColorId','topBColorId']) assert.equal(p[key],'none',key);
  const s=parse('Wardrobe: '+option('outfitPresetId','鏈條緞面').en+', primary garment color red, primary garment color blue.');
  assert.equal(s.outfitPresetPrimaryColorId,'none');
});



for (const [label,key] of [['鏈條緞面','outfitPresetPrimaryColorId'],['粉紅哥德','outfitPresetPrimaryColorId'],['粉紅哥德','outfitPresetContrastColorId'],['素色緞面旗袍','outfitPresetPrimaryColorId'],['高領挖腰','dressColorId']]) {
  test(`A2 recovery: every supported swatch with an explicit visible target, ${label}/${key}`, () => {
    for (const color of controls.find(c=>c.key===key).options.filter(o=>o.id!=='random'&&o.zh!=='全無')) {
      const garmentKey=key.startsWith('dress')?'dressId':'outfitPresetId';
      const locks={ [garmentKey]:option(garmentKey,label).id, [key]:color.id };
      const p=generate(locks),s=parse(p.grokPrompt);
      assert.equal(s[key === 'dressColorId' ? 'outfitPresetPrimaryColorId' : key],color.id,`${label}/${color.id}: ${p.grokPrompt}`);
    }
  });
}

test('A2 recovery: independent dress and footwear keep separate colors',()=>{
  const locks={dressId:option('dressId','高領挖腰').id,dressColorId:'red',shoesId:option('shoesId','高跟鞋').id,shoesColorId:'white'};
  const p=generate(locks),s=parse(p.grokPrompt);
  assert.equal(s.outfitPresetPrimaryColorId,'red');assert.equal(s.shoesColorId,'white');
});

test('A2 recovery: color-word overlap does not hide a separate contradictory assertion',()=>{
  const source=option('outfitPresetId','鏈條緞面').en;
  assert.equal(parse(`Wardrobe: ${source}, primary garment color red, primary garment color black and red.`).outfitPresetPrimaryColorId,'none');
});

test('A2 recovery: old alias bindings and role labels remain readable without data rewrites',()=>{
  const pink=option('outfitPresetAId','粉紅哥德'),chain=option('outfitPresetBId','鏈條緞面');
  const text=`Woman 1: ${pink.en}, main fabric color set to red, lace ribbons garter straps and trims set to white. Woman 2: ${chain.en}, primary garment color light blue, secondary garment color black. Scene: red walls.`;
  const s=parse(text);
  assert.equal(s.outfitPresetAPrimaryColorId,'red');assert.equal(s.outfitPresetAContrastColorId,'white');assert.equal(s.outfitPresetBPrimaryColorId,'light-blue');assert.equal(s.outfitPresetBContrastColorId,'black');
});

test('A2 recovery: all 40 reviewed outfits retain explicit primary and eligible contrast colors',()=>{
  const review=JSON.parse(readFileSync(new URL('../../../../scripts/lib/a2OutfitControlReview.json',import.meta.url)));
  for(const row of review.rows){
    const p=generate({outfitPresetId:row.id,outfitPresetPrimaryColorId:'red',outfitPresetContrastColorId:'white'}),s=parse(p.grokPrompt);
    assert.equal(s.outfitPresetPrimaryColorId,'red',row.id);
    const mode=row.after.meta.colorMode;
    assert.equal(s.outfitPresetContrastColorId,!mode||mode!=='primary'?'white':'none',row.id);
  }
});

test('A2 recovery: separate garments in explicit duo sections do not inherit the other role colors',()=>{
  const locks={subjectCount:'2',topAId:option('topAId','棉質細肩背心').id,topBId:option('topBId','領帶襯衫').id,topAColorId:'red',topBColorId:'white',pantsAId:option('pantsAId','牛仔').id,pantsBId:option('pantsBId','牛仔').id,bottomAColorId:'light-blue',bottomBColorId:'black'};
  const p=generate(locks),s=parse(p.grokPrompt);
  for(const key of ['topAColorId','topBColorId','bottomAColorId','bottomBColorId'])assert.equal(s[key],locks[key],key+' '+p.grokPrompt);
});


test('A2 recovery: resolved outerwear fallback stays within each explicit role',()=>{
  const locks={subjectCount:'2',outerwearAId:option('outerwearAId','西裝外套').id,outerwearBId:option('outerwearBId','連帽外套').id,outerwearAColorId:'red',outerwearBColorId:'white'};
  const p=generate(locks),s=parse(p.grokPrompt);
  for(const [key,value] of Object.entries(locks))assert.equal(s[key],value,key);
});

test('A2 recovery: authored fixed-detail silence remains explicit in raw parsing',()=>{
  const p=generate({topId:option('topId','領帶襯衫').id});
  const raw=parseLocksFromStandardPrompt(p.grokPrompt,controls).locks;
  assert.equal(raw.topColorId,controls.find(c=>c.key==='topColorId').options.find(o=>o.zh==='全無').id);
});
