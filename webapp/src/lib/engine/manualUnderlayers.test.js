import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeLocks, getLockControls } from '../engine.js';
import { seatFixture, seatFramings } from './indoorSeatFixtures.js';
import { buildMarkdownExport, parseExportedMarkdownPrompt } from '../../features/saved-cards/cardCodec.js';
import { withGrokImagineForSave } from '../grokImagineResult.js';

const controls = getLockControls();
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const base = { topId: option('topId','落肩 T 恤'), pantsId: option('pantsId','工裝長褲'),
  bottomRiseId: 'ultra-low-rise', gestureId: 'gesture-lift-hem-both' };
const chosen = { topUnderlayerId: option('topId','蕾絲胸罩'), topUnderlayerColorId: 'white',
  bottomUnderlayerId: option('pantsId','比基尼下身'), bottomUnderlayerColorId: 'black' };
const run = (locks, frame = seatFramings.at(-1)) => seatFixture('室內：日本學校教室','自然坐姿',frame,{...base,...locks});

test('both manual gestures, underwear colors and waist setting survive generation and Markdown', () => {
  for (const gestureId of ['gesture-lift-hem-both','gesture-hold-hem-teeth']) {
    for (const frame of seatFramings) {
      const {prompt,cards} = run({...chosen,gestureId},frame);
      for (const [key,id] of Object.entries(chosen)) assert.equal(prompt.selection[key],id,key);
      const grok = cards.find(c=>c.id==='grok-imagine') ?? cards.at(-1);
      assert.match(grok.value,/white lace bra top/);
      assert.match(grok.value,/black low-rise side-tie bikini bottoms/);
      if (gestureId === 'gesture-lift-hem-both') assert.match(grok.value, /base of her neck/);
      assert.match(grok.value, /collarbones/);
      assert.match(grok.value, gestureId.endsWith('teeth')
        ? /She holds the center of the front hem of her top between her teeth\. The lifted front panel fans out from her mouth in one continuous triangular fold, with the fabric gathered high across her collarbones\. The lace bra top underneath is fully visible\. Both hands rest behind her back\./
        : /both hands gripping opposite sides/);
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

test('all eleven catalog IDs and both waist settings keep effective selections and the seven output contracts', async () => {
  const upperNames=['比基尼上身','運動型內衣','蕾絲胸罩','小三角細繩比基尼上身','X形胸貼','創可貼造型胸貼'];
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
      if (gestureId === 'gesture-hold-hem-teeth') {
        const noun = midjourneyItemName(innerTop);
        const verb = ['X形胸貼', '創可貼造型胸貼'].includes(name) ? 'are' : 'is';
        assert.ok(cards.find(c => c.id === 'grok-imagine').value.includes(
          `The ${noun} underneath ${verb} fully visible. Both hands rest behind her back.`));
      }
      assert.equal(innerTop.id,topUnderlayerId);
      assert.equal(innerBottom.id,bottomUnderlayerId);
      for(const card of cards) {
        if (card.id==='ai') {
          assert.ok(card.value.includes(midjourneyItemName(innerTop)),card.id);
          assert.ok(card.value.includes(midjourneyItemName(innerBottom)),card.id);
        } else if (['gpt','grok-imagine','full-body-character','chest-up-portrait'].includes(card.id)) {
          assert.ok(card.value.toLowerCase().includes(innerTop.en.toLowerCase()),card.id+' '+name);
          assert.ok(card.value.toLowerCase().includes(innerBottom.en.toLowerCase()),card.id);
        } else {
          assert.ok(card.value.toLowerCase().includes(innerTop.en.split(',')[0].toLowerCase()),card.id);
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
  assert.match(under.cards.at(-1).value, /high across her collarbones\. Both hands rest behind her back\./);
  assert.doesNotMatch(under.cards.at(-1).value, /underneath (is|are) fully visible/);
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
