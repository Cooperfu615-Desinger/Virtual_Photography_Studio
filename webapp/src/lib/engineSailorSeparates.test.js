import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

const option = (key, label) => {
  const found = getLockControls().find((control) => control.key === key)?.options.find((item) => item.zh === label);
  assert.ok(found, `${key}: ${label}`);
  return found.id;
};

const render = ({ top, skirt, fit = '正常', bottomFit = '正常', topStyling = '全無', framing = '全身鏡頭 (Full Body Shot)' }) => {
  const result = generatePrompts(1, {
    ...createEmptyLocks(),
    framingId: option('framingId', framing),
    topId: option('topId', top),
    skirtId: option('skirtId', skirt),
    pantsId: option('pantsId', '全無'),
    topFitId: option('topFitId', fit),
    topStylingId: option('topStylingId', topStyling),
    bottomFitId: option('bottomFitId', bottomFit),
    topColorId: option('topColorId', '白色'),
    bottomColorId: option('bottomColorId', '深藍色'),
  })[0];
  return {
    ...result,
    chestUpPortraitPrompt: result.extraPrompts.find((entry) => entry.id === 'chest-up-portrait')?.text || '',
    fullBodyCharacterPrompt: result.extraPrompts.find((entry) => entry.id === 'full-body-character')?.text || '',
  };
};

test('sailor separates retain their own sleeve and hem lengths across main and derivative outputs', () => {
  for (const [top, skirt, sleeve, hem] of [
    ['短袖水手服', '水手服短裙', 'short-sleeve', 'above-knee'],
    ['長袖水手服', '水手服長裙', 'long-sleeve', 'near-floor'],
  ]) {
    const result = render({ top, skirt });
    for (const key of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt', 'fullBodyCharacterPrompt']) {
      assert.match(result[key], new RegExp(sleeve), key);
      assert.match(result[key], /near-black navy sailor collar|navy sailor collar/, key);
      assert.match(result[key], /white parallel trim|white trim/, key);
      assert.match(result[key], /navy scarf tie/, key);
      assert.match(result[key], new RegExp(hem), key);
      assert.match(result[key], /pleat/i, key);
    }
    assert.match(result.chestUpPortraitPrompt, new RegExp(sleeve));
    assert.doesNotMatch(result.chestUpPortraitPrompt, new RegExp(hem));
  }
});

test('a tight sailor blouse reads as undersized and midriff-baring without relaxed wording', () => {
  for (const top of ['短袖水手服', '長袖水手服']) {
    const normal = render({ top, skirt: '水手服短裙' });
    const tight = render({ top, skirt: '水手服短裙', fit: '緊身', bottomFit: '緊身' });
    assert.match(normal.grokPrompt, /relaxed straight-cut body/);
    assert.doesNotMatch(normal.grokPrompt, /exposing the midriff/);
    for (const key of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt', 'fullBodyCharacterPrompt']) {
      assert.match(tight[key], /undersized|one-size-too-small/i, key);
      assert.match(tight[key], /midriff/i, key);
      assert.doesNotMatch(tight[key], /relaxed straight-cut body/, key);
      assert.doesNotMatch(tight[key], /tight body-skimming lower-body fit/, key);
      assert.match(tight[key], /pleat/i, key);
    }
  }
});

test('sailor fit resolves tucked hems and wide skirt modifiers without conflicting geometry', () => {
  const result = render({
    top: '長袖水手服', skirt: '水手服長裙', fit: '緊身',
    topStyling: '紮入下身', bottomFit: '寬版',
  });
  for (const key of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt']) {
    assert.match(result[key], /midriff/i, key);
    assert.match(result[key], /near-floor maxi hem/, key);
    assert.doesNotMatch(result[key], /tucked neatly into the bottoms|wide-leg volume/, key);
  }
});
