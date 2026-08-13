import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  Z_IMAGE_TURBO_PROMPT_CONTRACT,
  Z_IMAGE_TURBO_PROMPT_CONTRACT_VERSION,
  createZImageTurboPromptSectionModel,
  estimateZImagePromptTokens,
} from './zImageTurboPromptContract.js';

test('Z-Image Turbo contract preserves the historical field and records the Magnific profile', () => {
  assert.equal(Z_IMAGE_TURBO_PROMPT_CONTRACT_VERSION, '1.1.0');
  assert.equal(Z_IMAGE_TURBO_PROMPT_CONTRACT.field, 'zImagePrompt');
  assert.equal(Z_IMAGE_TURBO_PROMPT_CONTRACT.uiLabel, 'Z-Image');
  assert.equal(Z_IMAGE_TURBO_PROMPT_CONTRACT.compatibility.historicalField, 'zImagePrompt');
  assert.match(Z_IMAGE_TURBO_PROMPT_CONTRACT.profile, /Z-Image Turbo/);
  assert.equal(Z_IMAGE_TURBO_PROMPT_CONTRACT.measurement.encoderSequenceLimit, 512);
  assert.equal(Z_IMAGE_TURBO_PROMPT_CONTRACT.measurement.estimateIsExactTokenizerCount, false);
  assert.equal(Z_IMAGE_TURBO_PROMPT_CONTRACT.composition.preserveSharedCanonicalPose, true);
  assert.deepEqual(Z_IMAGE_TURBO_PROMPT_CONTRACT.composition.geometryAppliesToOutputs, ['zImagePrompt']);
  assert.ok(Object.isFrozen(Z_IMAGE_TURBO_PROMPT_CONTRACT));
});

test('Z-Image Turbo section model orders primary content before secondary imaging and measures length', () => {
  const model = createZImageTurboPromptSectionModel({
    sections: [
      { id: 'rendering', text: 'Kodak Portra film rendering.' },
      { id: 'subject', text: 'One adult portrait subject.' },
      { id: 'imageType', text: 'Photorealistic editorial portrait.' },
      { id: 'scene', text: 'The scene is a concrete factory interior.' },
    ],
  });

  assert.equal(
    model.text,
    'Photorealistic editorial portrait.\n\nOne adult portrait subject.\n\nThe scene is a concrete factory interior.\n\nKodak Portra film rendering.'
  );
  assert.equal(model.sections.find((section) => section.id === 'subject')?.priority, 'primary');
  assert.equal(model.sections.find((section) => section.id === 'rendering')?.priority, 'secondary');
  assert.equal(model.measurement.estimatedTokens, estimateZImagePromptTokens(model.text));
  assert.equal(model.measurement.withinSoftMax, true);
});
