import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, getLockControls } from './engine.js';
import { buildWardrobeLayerInsights, buildWorkspaceSummary } from './page1WorkspaceSummary.js';

const controls = getLockControls();

const optionId = (key, zh) => {
  const control = controls.find((item) => item.key === key);
  const option = control?.options?.find((item) => item.zh === zh);
  assert.ok(option, `Missing ${zh} for ${key}`);
  return option.id;
};

test('workspace wardrobe summary hides granular top and bottom selections when an outfit preset is active', () => {
  const locks = {
    ...createEmptyLocks(),
    outfitPresetId: optionId('outfitPresetId', '套裝：空服員制服'),
    topId: optionId('topId', '比基尼上身'),
    pantsId: optionId('pantsId', '比基尼下身'),
    topFitId: optionId('topFitId', '緊身'),
    bottomFitId: optionId('bottomFitId', '緊身'),
    bottomRiseId: optionId('bottomRiseId', '超低腰'),
  };

  const summary = buildWorkspaceSummary(locks, controls);
  const insights = buildWardrobeLayerInsights(locks, controls, false, true);

  assert.match(summary.wardrobe.summary, /套裝：空服員制服/);
  assert.doesNotMatch(summary.wardrobe.summary, /比基尼上身|比基尼下身|緊身|超低腰/);
  assert.deepEqual(insights.main, ['套裝：空服員制服']);
});
