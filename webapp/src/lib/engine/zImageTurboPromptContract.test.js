import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  Z_IMAGE_TURBO_PROMPT_CONTRACT,
  Z_IMAGE_TURBO_PROMPT_CONTRACT_VERSION,
  createZImageTurboPromptSectionModel,
  estimateZImagePromptTokens,
} from './zImageTurboPromptContract.js';
import {
  PROMPT_OUTPUT_CONTRACTS,
  validatePromptOutputContract,
} from './promptOutputContracts.js';

test('Z-Image Turbo contract preserves the historical field and records the Magnific profile', () => {
  assert.equal(Z_IMAGE_TURBO_PROMPT_CONTRACT_VERSION, '1.5.0');
  assert.equal(Z_IMAGE_TURBO_PROMPT_CONTRACT.field, 'zImagePrompt');
  assert.equal(Z_IMAGE_TURBO_PROMPT_CONTRACT.uiLabel, 'Z-Image');
  assert.equal(Z_IMAGE_TURBO_PROMPT_CONTRACT.compatibility.historicalField, 'zImagePrompt');
  assert.match(Z_IMAGE_TURBO_PROMPT_CONTRACT.profile, /Z-Image Turbo/);
  assert.equal(Z_IMAGE_TURBO_PROMPT_CONTRACT.measurement.encoderSequenceLimit, 512);
  assert.equal(Z_IMAGE_TURBO_PROMPT_CONTRACT.measurement.estimateIsExactTokenizerCount, false);
  assert.equal(Z_IMAGE_TURBO_PROMPT_CONTRACT.composition.preserveSharedCanonicalPose, true);
  assert.match(Z_IMAGE_TURBO_PROMPT_CONTRACT.composition.strictSideProfileGeometry, /image-edge facing[\s\S]*near-far occlusion/i);
  assert.deepEqual(Z_IMAGE_TURBO_PROMPT_CONTRACT.composition.framingDescriptorPrecedence, ['cowboy', 'medium']);
  assert.deepEqual(Z_IMAGE_TURBO_PROMPT_CONTRACT.composition.geometryAppliesToOutputs, ['zImagePrompt']);
  assert.match(Z_IMAGE_TURBO_PROMPT_CONTRACT.composition.explicitCameraAngleGeometry, /camera position/i);
  assert.deepEqual(Z_IMAGE_TURBO_PROMPT_CONTRACT.composition.sidePoseDepthProjection, ['hands-grip-waistband']);
  assert.ok(Object.isFrozen(Z_IMAGE_TURBO_PROMPT_CONTRACT));
});

test('Z-Image Turbo keeps UI Chinese metadata outside the English public prompt', () => {
  const language = Z_IMAGE_TURBO_PROMPT_CONTRACT.language;
  const outputLanguage = PROMPT_OUTPUT_CONTRACTS.zImagePrompt.language;

  assert.equal(language.publicPrompt, outputLanguage.primary);
  assert.deepEqual(language.uiOnlyFields, ['zh', 'desc']);
  assert.equal(language.includeUiMetadataInPrompt, false);
  assert.equal(language.automaticTranslation, false);
  assert.equal(language.bilingualDuplication, false);
  assert.equal(language.exactVisibleText.supported, true);
  assert.equal(language.exactVisibleText.status, 'active-opt-in');
  assert.equal(language.exactVisibleText.defaultEnabled, false);
  assert.equal(language.exactVisibleText.instructionLanguage, 'en');
  assert.equal(language.exactVisibleText.sourceField, 'selection.zImageVisibleTextContent');
  assert.deepEqual(language.exactVisibleText.outputs, ['zImagePrompt']);
  assert.equal(language.exactVisibleText.unspecifiedBehavior, 'do not invent copy');
  assert.deepEqual(outputLanguage.forbiddenUnicodeBlocks, ['CJK_UNIFIED_IDEOGRAPHS']);
  assert.deepEqual(outputLanguage.allowedSourceLiterals, ['selection.zImageVisibleTextContent']);

  const englishPrompt = 'Photorealistic editorial portrait.\n\nOne adult woman in a neutral studio.';
  assert.deepEqual(
    validatePromptOutputContract('zImagePrompt', englishPrompt, { mode: 'single' }),
    []
  );

  const leakedUiMetadata = `${englishPrompt}\n\n中文選項說明。`;
  assert.equal(
    validatePromptOutputContract('zImagePrompt', leakedUiMetadata, { mode: 'single' })
      .some((issue) => issue.code === 'language-range'),
    true
  );

  const exactVisibleTextPrompt = `${englishPrompt}\n\nA background storefront sign clearly displays the exact Traditional Chinese text "美華冰室".`;
  assert.deepEqual(
    validatePromptOutputContract('zImagePrompt', exactVisibleTextPrompt, {
      mode: 'single',
      allowedLanguageLiterals: ['美華冰室'],
    }),
    [],
  );
  assert.equal(
    validatePromptOutputContract('zImagePrompt', `${exactVisibleTextPrompt} 中文說明。`, {
      mode: 'single',
      allowedLanguageLiterals: ['美華冰室'],
    }).some((issue) => issue.code === 'language-range'),
    true,
  );
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
