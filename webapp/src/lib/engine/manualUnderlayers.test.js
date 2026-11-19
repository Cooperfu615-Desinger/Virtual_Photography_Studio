import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeLocks, getLockControls } from '../engine.js';
import { seatFixture, seatFramings } from './indoorSeatFixtures.js';
import { buildMarkdownExport, buildRestoreLocks, parseExportedMarkdownPrompt } from '../../features/saved-cards/cardCodec.js';
import { withGrokImagineForSave } from '../grokImagineResult.js';
import { getReferencePersonPreview } from '../referencePersonPreview.js';
import { buildPage1GenerationPromptCards } from '../page1PromptOutputs.js';
import { upperUnderlayerFront } from './manualUnderlayers.js';

const controls = getLockControls();
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const base = { topId: option('topId','落肩 T 恤'), pantsId: option('pantsId','工裝長褲'),
  bottomRiseId: 'ultra-low-rise', gestureId: 'gesture-lift-hem-both' };
const chosen = { topUnderlayerId: option('topId','蕾絲胸罩'), topUnderlayerColorId: 'white',
  bottomUnderlayerId: option('pantsId','比基尼下身'), bottomUnderlayerColorId: 'black' };
const run = (locks, frame = seatFramings.at(-1)) => seatFixture('室內：日本學校教室','自然坐姿',frame,{...base,...locks});

const waistbandGestureId = 'gesture-legacy-lift-waistband';
const waistbandFixture = {
  gestureId: waistbandGestureId, topId: option('topId', '一字領上衣'), topColorId: 'white',
  pantsId: option('pantsId', '工裝長褲'), bottomFitId: 'loose', bottomRiseId: 'ultra-low-rise',
  bottomColorId: 'black', bottomUnderlayerId: option('pantsId', '蕾絲丁字褲'), bottomUnderlayerColorId: 'white',
  waistbandBottomColorId: 'red',
};
const fullBody = option('framingId', '全身鏡頭 (Full Body Shot)');
const waistbandRun = (overrides = {}, frame = fullBody) =>
  seatFixture('室內：日本學校教室', '單腳重心', frame, { ...waistbandFixture, ...overrides });

const adjustGestureId = 'gesture-legacy-adjust-top';
const adjustFixture = {
  gestureId: adjustGestureId, topId: option('topId', '一字領上衣'), topColorId: 'white',
  topFitId: 'tight', topStylingId: 'hem-overlap', pantsId: option('pantsId', '工裝長褲'),
  bottomColorId: 'black', bottomRiseId: 'ultra-low-rise',
  topUnderlayerId: option('topId', '蕾絲胸罩'), topUnderlayerColorId: 'black',
  adjustTopColorId: 'red',
};
const adjustRun = (overrides = {}, frame = fullBody) =>
  seatFixture('室內：日本學校教室', '單腳重心', frame, { ...adjustFixture, ...overrides });

test('adjust top binds each garment and its color to one dress-adjustment sentence', () => {
  for (const [label, name, action] of [
    ['比基尼上身', 'red triangle bikini top', 'She uses one hand to reposition a triangle cup of her'],
    ['運動型內衣', 'red sports bra', 'She uses one hand to adjust the fit over the cup area of her'],
    ['蕾絲胸罩', 'red lace bra', 'She slips one shoulder strap down with one hand while adjusting her'],
  ]) {
    const adjustTopId = option('topId', label);
    const { prompt, cards } = adjustRun({ adjustTopId });
    for (const { id, value } of cards) {
      if (id === 'full-body-character') {
        assert.match(value, /off-shoulder top/i, id);
        assert.doesNotMatch(value, new RegExp(name, 'i'), id);
      } else {
        assert.ok(value.includes(`${action} ${name}.`), id);
        assert.doesNotMatch(value, /off-shoulder top|top length meets|top hem overlaps|gently tugging/i, id);
        assert.equal(value.toLowerCase().split(name).length, 2, id);
      }
      if (id !== 'chest-up-portrait') assert.match(value, /cargo pants/i, id);
    }
    assert.equal(prompt.selection.adjustTopId, adjustTopId);
    assert.equal(prompt.selection.adjustTopColorId, 'red');
  }
});

test('adjust top keeps its colored garment in the tight portrait but leaves the hands out', () => {
  const { cards } = adjustRun({}, option('framingId', '半臉傾斜特寫'));
  for (const { id, value } of cards) {
    if (id === 'full-body-character') continue;
    assert.match(value, /red triangle bikini top/i, id);
    assert.equal(value.includes('reposition a triangle cup'), ['grok-imagine', 'chest-up-portrait'].includes(id), id);
    assert.doesNotMatch(value, /off-shoulder top/i, id);
  }
});

test('adjust top stores the paused C-section settings and restores them when canceled after Markdown import', () => {
  const { prompt } = adjustRun({ adjustTopId: option('topId', '蕾絲胸罩') });
  const saved = withGrokImagineForSave({ ...prompt, source: 'page1' });
  const restored = normalizeLocks(buildRestoreLocks(parseExportedMarkdownPrompt(buildMarkdownExport(saved), controls).selection, controls), controls);
  for (const key of ['gestureId', 'adjustTopId', 'adjustTopColorId', 'topId', 'topFitId', 'topStylingId', 'topColorId',
    'topUnderlayerId', 'topUnderlayerColorId', 'pantsId']) assert.equal(restored[key], prompt.selection[key], key);
  assert.match(adjustRun(restored).prompt.grokPrompt, /red lace bra/i);
  assert.deepEqual(adjustRun({ ...restored, gestureId: 'none' }).cards, adjustRun({ gestureId: 'none' }).cards);
});

test('adjust top is independent of C-section tops but yields to selfies and opaque closed outerwear', () => {
  const empty = adjustRun({ topId: option('topId', '全無') });
  assert.match(empty.prompt.grokPrompt, /reposition a triangle cup of her red triangle bikini top/i);
  const reference = buildPage1GenerationPromptCards(getReferencePersonPreview(adjustRun().prompt));
  assert.ok(reference.length);
  for (const { id, value } of reference) assert.doesNotMatch(value, /red triangle bikini top|reposition a triangle cup/i, id);
  const closed = { outerwearId: option('outerwearId', '飛行夾克'), outerwearOpeningId: option('outerwearOpeningId', '全扣上／全拉上') };
  for (const overrides of [{ propId: 'selfie-natural-right-arm' }, closed]) {
    assert.deepEqual(adjustRun(overrides).cards, adjustRun({ ...overrides, gestureId: 'none' }).cards);
  }
});

test('waistband lift uses exactly the chosen bottom, color and two-handed lift in visible outputs', () => {
  for (const [label, fragment] of [
    ['比基尼下身', 'side ties'],
    ['蕾絲丁字褲', 'side straps'],
    ['棉質低腰三角褲', 'waistband'],
  ]) {
    const waistbandBottomId = option('pantsId', label);
    const { cards, prompt } = waistbandRun({ waistbandBottomId });
    for (const { id, value } of cards) {
      if (id === 'full-body-character') {
        assert.match(value, /cargo pants/i, id);
        assert.doesNotMatch(value, /as high as they will go/i, id);
      } else if (id === 'chest-up-portrait') {
        assert.doesNotMatch(value, /as high as they will go|cargo pants|red (?:bikini|lace thong|cotton briefs)/i, id);
      } else {
        assert.match(value, new RegExp(fragment + ' as high as they will go, one hand on each side of her red', 'i'), id);
        assert.doesNotMatch(value, /small upward tug|cargo pants|outer waistband/i, id);
      }
      assert.match(value, /off-shoulder top/i, id);
    }
    assert.equal(prompt.selection.waistbandBottomId, waistbandBottomId);
    assert.equal(prompt.selection.waistbandBottomColorId, 'red');
  }
});

test('waistband settings and the paused C-section bottom survive Markdown and cancel independently', () => {
  const { prompt } = waistbandRun({ waistbandBottomId: option('pantsId', '蕾絲丁字褲') });
  const saved = withGrokImagineForSave({ ...prompt, source: 'page1' });
  const restored = normalizeLocks(buildRestoreLocks(parseExportedMarkdownPrompt(buildMarkdownExport(saved), controls).selection, controls), controls);
  for (const key of ['gestureId', 'waistbandBottomId', 'waistbandBottomColorId', 'pantsId', 'bottomFitId', 'bottomRiseId',
    'bottomColorId', 'bottomUnderlayerId', 'bottomUnderlayerColorId']) assert.equal(restored[key], prompt.selection[key], key);
  assert.match(waistbandRun(restored).prompt.grokPrompt, /red lace thong bottoms/i);
  assert.deepEqual(waistbandRun({ ...restored, gestureId: 'none' }).cards, waistbandRun({ gestureId: 'none' }).cards);
});

test('waistband lift works with no C-section bottom and pauses while a phone uses the hands', () => {
  assert.match(waistbandRun({ pantsId: option('pantsId', '全無') }).prompt.grokPrompt, /side ties as high as they will go.*red bikini bottoms/i);
  const propId = 'selfie-natural-right-arm';
  assert.deepEqual(waistbandRun({ propId }).cards, waistbandRun({ propId, gestureId: 'none' }).cards);
});

test('tight framing omits the waistband lift and the chosen bottom except in Grok Imagine', () => {
  const { cards } = waistbandRun({}, option('framingId', '頭部主導近景'));
  for (const { id, value } of cards) {
    if (id === 'grok-imagine') assert.match(value, /side ties as high as they will go.*red bikini bottoms/i);
    else assert.doesNotMatch(value, /side ties as high as they will go|red bikini bottoms/i, id);
  }
});

test('the selected stockings follow the gesture bottom, independently of the paused C-section bottom', () => {
  const legwearId = option('legwearId', '膝上蕾絲吊帶襪');
  const withCargo = waistbandRun({ legwearId });
  const withBriefs = waistbandRun({ legwearId, pantsId: option('pantsId', '棉質低腰三角褲') });
  for (const { id, value } of withCargo.cards) {
    if (id === 'full-body-character') continue;
    assert.equal(value, withBriefs.cards.find(card => card.id === id).value, id);
  }
  assert.match(withCargo.prompt.grokPrompt, /separate lace garter belt/i);
});

test('both manual gestures, underwear colors and waist setting survive generation and Markdown', () => {
  for (const gestureId of ['gesture-lift-hem-both','gesture-hold-hem-teeth']) {
    for (const frame of seatFramings) {
      const {prompt,cards} = run({...chosen,gestureId},frame);
      for (const [key,id] of Object.entries(chosen)) assert.equal(prompt.selection[key],id,key);
      const grok = cards.find(c=>c.id==='grok-imagine') ?? cards.at(-1);
      assert.match(grok.value,/white lace bra cups/);
      assert.match(grok.value,/black low-rise side-tie bikini bottoms/);
      if (gestureId === 'gesture-lift-hem-both') assert.match(grok.value, /collarbone height/);
      assert.match(grok.value, /collarbones/);
      assert.match(grok.value, gestureId.endsWith('teeth')
        ? /between her front teeth.*white lace bra cups.*Both hands rest behind her back\./s
        : /one hand on each side/);
      const card=withGrokImagineForSave({...prompt,source:'page1'});
      const parsed=parseExportedMarkdownPrompt(buildMarkdownExport(card),controls,'layers');
      for (const [key,id] of Object.entries(chosen)) assert.equal(parsed.selection[key],id);
    }
  }
});

test('inactive manual choices survive editing without changing any of the seven generated outputs', () => {
  const closed={gestureId:'none',bottomRiseId:'high-rise'};
  const locks=normalizeLocks({...run({}).locks,...chosen,...closed},controls);
  assert.equal(locks.topUnderlayerId,chosen.topUnderlayerId);
  assert.equal(locks.bottomUnderlayerId,chosen.bottomUnderlayerId);
  assert.deepEqual(run({...closed,...chosen}).cards,run(closed).cards);
  assert.equal(run({...closed,...chosen}).prompt.selection.topUnderlayerId,undefined);
});

test('all supported inner garments and both waist settings keep effective selections and the seven output contracts', async () => {
  const upperNames=['比基尼上身','運動型內衣','蕾絲胸罩','小三角細繩比基尼上身','X形胸貼','創可貼造型胸貼','棉質細肩背心'];
  const lowerNames=['比基尼下身','蕾絲丁字褲','棉質低腰三角褲','窄前片細繩蕾絲丁字褲','窄前片細繩比基尼下身'];
  const full=seatFramings.find(f=>f.includes('full-body-shot'));
  const {midjourneyItemName}=await import('./midjourneyNaturalPrompt.js');
  for(const gestureId of ['gesture-lift-hem-both','gesture-hold-hem-teeth']) {
    for(const [i, name] of upperNames.entries()) for(const bottomRiseId of ['ultra-low-rise','unbuttoned-slightly-unzipped']) {
      const topUnderlayerId=option('topId',name),bottomUnderlayerId=option('pantsId',lowerNames[i%lowerNames.length]);
      const {cards,prompt}=run({gestureId,bottomRiseId,topUnderlayerId,bottomUnderlayerId},full);
      assert.equal(cards.length,7);
      const innerTop=prompt.structured.Wardrobe.find(i=>i.id===base.topId).meta.underlayer.item;
      const innerBottom=prompt.structured.Wardrobe.find(i=>i.id===base.pantsId).meta.underlayer.item;
      assert.equal(innerTop.id,topUnderlayerId);
      assert.equal(innerBottom.id,bottomUnderlayerId);
      for(const card of cards) {
        const expectedTop = card.id === 'full-body-character' ? innerTop.en : upperUnderlayerFront(innerTop).split(',')[0];
        assert.ok(card.value.toLowerCase().includes(expectedTop.toLowerCase()), card.id + ' ' + name);
        if (card.id==='ai') {
          assert.ok(card.value.includes(midjourneyItemName(innerBottom)),card.id);
        } else if (['gpt','grok-imagine','full-body-character','chest-up-portrait'].includes(card.id)) {
          assert.ok(card.value.toLowerCase().includes(innerBottom.en.toLowerCase()),card.id);
        } else {
          assert.ok(card.value.toLowerCase().includes(innerBottom.en.split(',')[0].toLowerCase()),card.id);
        }
      }
    }
  }
});

test('ZIP import restores two independent manual layers and colors',async()=>{
  const {createSavedCardsArchive,parseSavedCardsArchive}=await import('../../features/saved-cards/savedCardArchive.js');
  const {buildRestoreLocks}=await import('../../features/saved-cards/cardCodec.js');
  const {prompt}=run(chosen);
  const saved=withGrokImagineForSave({...prompt,source:'page1'});
  const [read]=await parseSavedCardsArchive(await createSavedCardsArchive([saved],0,'uint8array'),controls);
  const restored=normalizeLocks(buildRestoreLocks(read.selection,controls),controls);
  for(const [key,id] of Object.entries(chosen)) assert.equal(restored[key],id);
});

test('gesture-only, ordinary and incompatible waist selections keep their respective actions and owners',()=>{
  const under=run({gestureId:'gesture-hold-hem-teeth'});
  assert.match(under.cards.at(-1).value, /along her collarbones\. Both hands rest behind her back\./);
  assert.doesNotMatch(under.cards.at(-1).value, /Below the raised hem/);
  for(const conflicts of [{bottomRiseId:'low-rise'},{bottomRiseId:'mid-rise'},{bottomRiseId:'random'},
    {bottomRiseId:'unbuttoned-slightly-unzipped',pantsId:option('pantsId','運動棉褲')}]){
    assert.deepEqual(run({...conflicts,bottomUnderlayerId:chosen.bottomUnderlayerId}).cards,run(conflicts).cards);
  }
  const old={gestureId:'gesture-legacy-lift-top-underbust'};
  assert.deepEqual(run({...old,topUnderlayerId:chosen.topUnderlayerId}).cards,run(old).cards);
});

test('outer waistband at the thighs keeps the selected inner bottom on the hips', () => {
  const bottomRiseId = option('bottomRiseId', '外褲褪至大腿');
  for (const name of ['比基尼下身','蕾絲丁字褲','棉質低腰三角褲','窄前片細繩蕾絲丁字褲','窄前片細繩比基尼下身']) {
    const bottomUnderlayerId = option('pantsId', name);
    for (const frame of seatFramings) {
      const { prompt, cards } = run({ pantsId: option('pantsId','直筒牛仔褲'), bottomRiseId,
        bottomUnderlayerId, bottomUnderlayerColorId: 'black' }, frame);
      const grok = cards.find(card => card.id === 'grok-imagine').value;
      assert.match(grok, /entire outer waistband resting at mid-thigh, halfway between her hips and knees/);
      assert.match(grok, /fully visible.*hips/);
      assert.doesNotMatch(grok, /through the open waistband|visible above the outer waistband/);
      assert.equal(prompt.selection.bottomUnderlayerId, bottomUnderlayerId);
      assert.equal(prompt.selection.bottomUnderlayerColorId, 'black');
      assert.equal(prompt.selection.bottomRiseId, bottomRiseId);
    }
  }
  const empty = run({ bottomRiseId }).cards.at(-1).value;
  assert.match(empty, /entire outer waistband resting at mid-thigh, halfway between her hips and knees/);
  assert.doesNotMatch(empty, /fully visible.*hips/);
  for (const name of ['比基尼下身','丹寧吊帶短褲','全無']) {
    const { cards } = run({ bottomRiseId, pantsId: option('pantsId',name), bottomUnderlayerId: chosen.bottomUnderlayerId });
    assert.doesNotMatch(cards.at(-1).value, /entire outer waistband resting at mid-thigh, halfway between her hips and knees/);
  }
  for (const roleKey of ['bottomRiseAId','bottomRiseBId']) {
    assert.ok(!controls.find(c => c.key === roleKey).options.some(o => o.id === bottomRiseId));
  }
});
