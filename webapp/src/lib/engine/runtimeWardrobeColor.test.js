import { preLegacyDressSource } from '../../../../scripts/lib/a2LegacyDressReplay.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';
const controls = getLockControls();
const options = k => controls.find(c => c.key === k).options;
const option = (k, label) => { const o = options(k).find(o => o.zh.includes(label)); assert.ok(o, k + label); return o; };
const empty = () => { const l = createEmptyLocks(); for (const c of controls) { const n = c.options.find(o => o.zh === '全無' || o.id === 'none'); if (n) l[c.key] = n.id; } return { ...l, subjectCount:'1', framingId:option('framingId', '全身鏡頭').id }; };
const generate = l => generatePrompts(1, { ...empty(), ...l }, [], { random:createSeededRandom('a2-runtime-color') })[0];
const full = p => p.extraPrompts.find(x => x.id === 'full-body-character').text;

test('A2 runtime complete-look palettes describe the exact selected family without instructions', () => {
  for (const [key, label] of [['specialOutfitId','紅色亮面膠帶'], ['outfitPresetId','鏈條緞面'], ['dressId','無袖迷你']]) {
    for (const palette of options('completeLookPaletteId')) {
      const p = generate({ [key]: option(key,label).id, completeLookPaletteId:palette.id });
      assert.doesNotMatch(full(p), /complete outfit palette direction|shift the complete outfit palette|preserving garment structure/);
      if (palette.id !== 'none') assert.ok(full(p).includes('outfit palette: ' + palette.en));
      else assert.doesNotMatch(full(p), /outfit palette:/);
    }
  }
});

test('A2 runtime generic color roles preserve every color and material description', () => {
  const outfitPresetId=option('outfitPresetId','鏈條緞面').id;
  for (const c of options('outfitPresetPrimaryColorId').filter(o=>o.id!=='none')) {
    const p=generate({outfitPresetId, outfitPresetPrimaryColorId:c.id, outfitPresetContrastColorId:'white'});
    assert.doesNotMatch(full(p), /primary garment color|secondary garment color|expressed as/);
    assert.equal(p.selection.outfitPresetPrimaryColorId,c.id);
    assert.match(full(p), /secondary garment in white/);
  }
  const p=generate({outfitPresetId,outfitPresetPrimaryColorId:'light-blue',outfitPresetContrastColorId:'multicolor-horizontal-stripes'});
  assert.match(full(p), /primary garment in light blue/);
  assert.match(full(p), /secondary garment with bold multicolored horizontal stripes/);
});

test('A2 runtime new and historical role clauses restore colors without cross-role inference', () => {
  const outfit=option('outfitPresetId','鏈條緞面');
  for (const [a,b] of [['primary garment color red','secondary garment color white'],['primary garment in red','secondary garment in white']]) {
    const locks=parseLocksFromStandardPrompt('Wardrobe: '+outfit.en+', '+a+', '+b+'.',controls).locks;
    assert.equal(locks.outfitPresetPrimaryColorId,'red'); assert.equal(locks.outfitPresetContrastColorId,'white');
  }
  for(const palette of options('completeLookPaletteId').filter(x=>x.id!=='none')) {
    const p=generate({outfitPresetId:outfit.id,completeLookPaletteId:palette.id});
    assert.equal(parseLocksFromStandardPrompt(p.grokPrompt,controls).locks.completeLookPaletteId,palette.id);
  }
});

test('A2 runtime dress palette retains upper and lower ownership', () => {
  const palette=options('topBottomPaletteId').find(x=>x.id!=='none'&&x.id!=='random');
  const p=generate({dressId:option('dressId','無袖迷你').id,topBottomPaletteId:palette.id});
  assert.match(full(p), /dress palette from top to bottom: upper\/main dress area/);
  assert.match(full(p), /lower hem or skirt area/);
  assert.doesNotMatch(full(p), /coordinated top-to-bottom palette/);
});

// Validate the current behavior separately from exact frozen historical seals.
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { RUNTIME_ROOT, RUNTIME_PATCHES, restorePreA2RuntimeColorFiles } from '../../../../scripts/lib/a2RuntimeColorReplay.mjs';
import { createHash } from 'node:crypto';
test('A2 runtime historical inverse is exact, atomic, idempotent and isolated', () => {
  assert.throws(()=>restorePreA2RuntimeColorFiles(RUNTIME_ROOT),/isolated/);
  const dir=mkdtempSync(join(tmpdir(),'runtime-inverse-test-'));
  const paths=[...RUNTIME_PATCHES.files.map(f=>f.path),...Object.keys(RUNTIME_PATCHES.newTests)];
  const seed=()=>{for(const p of paths){mkdirSync(dirname(join(dir,p)),{recursive:true});writeFileSync(join(dir,p),preLegacyDressSource(p,readFileSync(join(RUNTIME_ROOT,p))));}};
  const snapshot=()=>paths.map(p=>readFileSync(join(dir,p)));
  try{
    seed();restorePreA2RuntimeColorFiles(dir);restorePreA2RuntimeColorFiles(dir);
    for(const f of RUNTIME_PATCHES.files)assert.equal(createHash('sha256').update(readFileSync(join(dir,f.path))).digest('hex'),f.beforeHash);
    for(const p of paths){seed();writeFileSync(join(dir,p),readFileSync(join(dir,p),'utf8')+'\n// unknown');const before=snapshot();assert.throws(()=>restorePreA2RuntimeColorFiles(dir),/Runtime inverse/);assert.deepEqual(snapshot(),before);}
    seed();const f=RUNTIME_PATCHES.files[0];let before=readFileSync(join(dir,f.path),'utf8');for(const p of f.patches)before=before.replace(p.after,p.before);writeFileSync(join(dir,f.path),before);const mixed=snapshot();assert.throws(()=>restorePreA2RuntimeColorFiles(dir),/mixed/);assert.deepEqual(snapshot(),mixed);
    seed();rmSync(join(dir,paths[1]));const preserved=readFileSync(join(dir,paths[0]));assert.throws(()=>restorePreA2RuntimeColorFiles(dir),/missing/);assert.deepEqual(readFileSync(join(dir,paths[0])),preserved);
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('A2 runtime prose recovers every new primary and secondary swatch, including material-only details', () => {
  const outfit=option('outfitPresetId','鏈條緞面');
  for(const channel of ['Primary','Contrast'])for(const color of options('outfitPreset'+channel+'ColorId').filter(x=>x.id!=='none')){
    const syntax=color.meta?.wearableColorSyntax;
    const phrase=syntax?[syntax.prefix?'in '+syntax.prefix:'',syntax.detail?'with '+syntax.detail:''].filter(Boolean).join(' '):'in '+color.en;
    const label=channel==='Primary'?'primary':'secondary';
    const recovered=parseLocksFromStandardPrompt('Wardrobe: '+outfit.en+', '+label+' garment '+phrase+'.',controls).locks;
    assert.equal(recovered['outfitPreset'+channel+'ColorId'],color.id,label+' '+color.id);
  }
});

test('A2 runtime new role evidence remains scoped and conflicts stay unresolved', () => {
  const outfit=option('outfitPresetId','鏈條緞面');
  const text=`Woman 1: ${outfit.en}, primary garment in red, secondary garment in white. Woman 2: ${outfit.en}, primary garment in light blue, secondary garment in black. Scene: green walls.`;
  const l=parseLocksFromStandardPrompt(text,controls).locks;
  assert.equal(l.outfitPresetAPrimaryColorId,'red');assert.equal(l.outfitPresetAContrastColorId,'white');
  assert.equal(l.outfitPresetBPrimaryColorId,'light-blue');assert.equal(l.outfitPresetBContrastColorId,'black');
  assert.equal(parseLocksFromStandardPrompt('Wardrobe: '+outfit.en+', primary garment in red, primary garment in blue.',controls).locks.outfitPresetPrimaryColorId,'');
  assert.equal(parseLocksFromStandardPrompt('Wardrobe: '+outfit.en+'. Scene: red walls.',controls).locks.outfitPresetPrimaryColorId,'');
});
