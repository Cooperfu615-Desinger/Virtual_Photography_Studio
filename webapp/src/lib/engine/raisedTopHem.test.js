import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLockControls, normalizeLocks } from '../engine.js';
import { seatFixture } from './indoorSeatFixtures.js';
import { buildMarkdownExport, buildRestoreLocks, parseExportedMarkdownPrompt } from '../../features/saved-cards/cardCodec.js';
import { withGrokImagineForSave } from '../grokImagineResult.js';
import { buildPage1GenerationSummary } from '../page1WorkspaceSummary.js';

const controls = getLockControls();
const option = (key, zh) => controls.find(control => control.key === key).options.find(item => item.zh === zh).id;
const framing = option('framingId', '頭部主導近景');
const topId = option('topId', '一字領上衣');
const innerId = option('topId', '比基尼上身');
const colors = { topColorId: 'black', topUnderlayerColorId: 'white' };
const run = locks => seatFixture('室內：日本學校教室', '單腳重心', framing, {
  topId, topUnderlayerId: innerId, ...colors, ...locks,
});
const gestures = ['gesture-hold-hem-teeth', 'gesture-lift-hem-both'];
const activeCards = cards => cards.filter(card => card.id !== 'full-body-character');

test('both raised hems describe the colored outer fabric and visible cup fronts without the selected top construction', () => {
  for (const gestureId of gestures) {
    const { prompt, cards } = run({ gestureId });
    for (const card of activeCards(cards)) {
      assert.match(card.value, /black top/i, card.id);
      assert.match(card.value, /white triangular bikini cups/i, card.id);
      assert.match(card.value, gestureId.endsWith('teeth') ? /front teeth.*behind her back/is : /one hand on each side/i, card.id);
      assert.doesNotMatch(card.value, /off-shoulder top|halter strings|triangular fold/i, card.id);
    }
    assert.match(cards.find(card => card.id === 'full-body-character').value, /off-shoulder top/i);
    assert.equal(prompt.selection.topId, topId);
    const summary = buildPage1GenerationSummary({}, prompt, controls);
    assert.match(summary, /衣襬配色：黑色.*上身內搭：白色｜比基尼上身/);
    assert.doesNotMatch(summary, /一字領上衣/);
  }
});

test('a raised hem and both colors work with no selected top and round-trip through Markdown', () => {
  const noTop = option('topId', '全無');
  const { prompt, cards } = run({ topId: noTop, gestureId: gestures[0] });
  for (const card of activeCards(cards)) assert.match(card.value, /black top.*white triangular bikini cups/is, card.id);
  const saved = withGrokImagineForSave({ ...prompt, source: 'page1' });
  const imported = parseExportedMarkdownPrompt(buildMarkdownExport(saved), controls);
  const restored = normalizeLocks(buildRestoreLocks(imported.selection, controls), controls);
  assert.equal(restored.topId, noTop);
  assert.equal(restored.topUnderlayerId, innerId);
  assert.equal(restored.gestureId, gestures[0]);
  for (const [key, value] of Object.entries(colors)) assert.equal(restored[key], value);
});

test('an empty inner layer adds no garment and disabling the gesture restores normal top text', () => {
  for (const gestureId of gestures) {
    const { cards } = run({ gestureId, topUnderlayerId: 'none' });
    for (const card of activeCards(cards)) assert.doesNotMatch(card.value, /bikini cups|off-shoulder top/i, card.id);
  }
  const { prompt, cards } = run({ gestureId: 'none' });
  for (const card of activeCards(cards)) assert.match(card.value, /off-shoulder top/i, card.id);
  assert.equal(prompt.selection.topUnderlayerId, undefined);
});
