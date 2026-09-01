import assert from 'node:assert/strict';
import test from 'node:test';

import { createEmptyLocks, getLockControls } from '../../lib/engine.js';
import { transitionPage1Locks } from '../page1/lockTransitions.js';
import {
  createLineage,
  buildMarkdownExport,
  buildRestoreLocks,
  buildSavedCardManifestItem,
  collectSourceTags,
  deserializeFavoritePrompt,
  normalizeManifestSummaryFields,
  parseExportedMarkdownPrompt,
  parseLocksFromStandardPrompt,
  serializeFavoritePrompt,
} from './cardCodec.js';

test('Markdown import accepts historical and current Z-Image section headings', () => {
  const controls = getLockControls();
  const top = controls
    .find((control) => control.key === 'topId')
    .options.find((option) => option.zh === '棉質細肩背心');

  for (const heading of ['Grok/Z-Image', 'Z-Image Prompt', 'Z-Image']) {
    const imported = parseExportedMarkdownPrompt([
      '**Summary:** 相容性測試',
      '',
      '## Gpt',
      '```text',
      top.en,
      '```',
      '',
      `## ${heading}`,
      '```text',
      `z output for ${heading}`,
      '```',
      '',
      '## AI Prompt',
      '```text',
      'AI output',
      '```',
    ].join('\n'), controls, `import-${heading}`);

    assert.equal(imported.zImagePrompt, `z output for ${heading}`);
    assert.equal(imported.selection.topId, top.id);
  }
});

test('favorite codec preserves card identity, prompts, selection, and lineage', () => {
  const locks = createEmptyLocks();
  locks.subjectCount = '1';
  locks.posePropId = getLockControls()
    .find((control) => control.key === 'posePropId')
    .options.find((option) => option.zh === '手持冰咖啡').id;
  const prompt = {
    id: 'prompt-123456',
    source: 'page1',
    date: '2026-07-10T00:00:00.000Z',
    summary: '人物：單人 | 場景：街道',
    midjourneyPrompt: 'primary prompt',
    grokPrompt: 'structured prompt',
    zImagePrompt: 'z-image prompt',
    selection: locks,
  };
  prompt.lineage = createLineage(prompt);

  const restored = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
  assert.equal(restored.id, prompt.id);
  assert.equal(restored.midjourneyPrompt, prompt.midjourneyPrompt);
  assert.equal(restored.selection.subjectCount, '1');
  assert.equal(restored.selection.posePropId, locks.posePropId);
  assert.equal(restored.lineage.rootShortId, '#123456');
});

test('favorite codec preserves single and duo head accessory color controls', () => {
  const prompt = {
    id: 'prompt-head-accessory-colors',
    source: 'page1',
    date: '2026-08-19T00:00:00.000Z',
    summary: '頭部配件配色',
    midjourneyPrompt: 'primary prompt',
    grokPrompt: 'structured prompt',
    zImagePrompt: 'z-image prompt',
    selection: {
      ...createEmptyLocks(),
      headAccessoryColorId: 'red',
      headAccessoryAColorId: 'bright-red',
      headAccessoryBColorId: 'royal-blue',
    },
  };

  const restored = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
  assert.equal(restored.selection.headAccessoryColorId, 'red');
  assert.equal(restored.selection.headAccessoryAColorId, 'bright-red');
  assert.equal(restored.selection.headAccessoryBColorId, 'royal-blue');
});

test('favorite codec and Markdown import preserve Z-Image exact visible text settings', () => {
  const locks = {
    ...createEmptyLocks(),
    zImageVisibleTextEnabled: true,
    zImageVisibleTextContent: '美華冰室',
    zImageVisibleTextLanguage: 'traditional-chinese',
    zImageVisibleTextPlacement: 'background-storefront-sign',
  };
  const exactSentence = 'A background storefront sign clearly displays the exact Traditional Chinese text "美華冰室".';
  const prompt = {
    id: 'prompt-visible-text',
    source: 'page1',
    sourceLabel: 'Prompt 工作台',
    date: '2026-08-14T00:00:00.000Z',
    summary: '場景：街道',
    midjourneyPrompt: 'Photorealistic editorial portrait.',
    grokPrompt: 'Image Type:\nPhotorealistic editorial portrait.\n\nSubject:\nOne woman.\n\nmulti-cut sequence n=2',
    zImagePrompt: `Photorealistic editorial portrait.\n\n${exactSentence}`,
    selection: locks,
  };

  const restored = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
  assert.equal(restored.selection.zImageVisibleTextEnabled, true);
  assert.equal(restored.selection.zImageVisibleTextContent, '美華冰室');
  assert.equal(restored.selection.zImageVisibleTextLanguage, 'traditional-chinese');
  assert.equal(restored.selection.zImageVisibleTextPlacement, 'background-storefront-sign');

  const markdown = buildMarkdownExport(prompt);
  const imported = parseExportedMarkdownPrompt(markdown, getLockControls(), 'import-visible-text');
  assert.equal(imported.selection.zImageVisibleTextEnabled, true);
  assert.equal(imported.selection.zImageVisibleTextContent, '美華冰室');
  assert.equal(imported.selection.zImageVisibleTextLanguage, 'traditional-chinese');
  assert.equal(imported.selection.zImageVisibleTextPlacement, 'background-storefront-sign');
});

test('favorite codec round-trips a normalized dress selection without stale separates', () => {
  const controls = getLockControls();
  const activeOptionId = (key) => controls
    .find((control) => control.key === key)
    ?.options.find((option) => option.zh !== '全無' && option.zh !== '隨機' && option.en !== 'none')?.id;
  const emptyLocks = createEmptyLocks();
  const locks = transitionPage1Locks({
    previousLocks: emptyLocks,
    candidateLocks: {
      ...emptyLocks,
      dressId: activeOptionId('dressId'),
      topId: activeOptionId('topId'),
      topFitId: activeOptionId('topFitId'),
      pantsId: activeOptionId('pantsId'),
      outerwearId: activeOptionId('outerwearId'),
    },
    lockControls: controls,
  });
  const prompt = {
    id: 'prompt-wardrobe-exclusive',
    source: 'page1',
    date: '2026-08-13T00:00:00.000Z',
    summary: '連身完整造型',
    midjourneyPrompt: 'primary prompt',
    grokPrompt: 'structured prompt',
    zImagePrompt: 'z-image prompt',
    selection: locks,
  };

  const restored = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));

  assert.equal(restored.selection.dressId, locks.dressId);
  assert.equal(restored.selection.topId, locks.topId);
  assert.equal(restored.selection.topFitId, locks.topFitId);
  assert.equal(restored.selection.pantsId, locks.pantsId);
  assert.equal(restored.selection.outerwearId, locks.outerwearId);
  assert.notEqual(restored.selection.topId, activeOptionId('topId'));
  assert.notEqual(restored.selection.pantsId, activeOptionId('pantsId'));
});

test('favorite restore normalizes legacy wardrobe conflicts with complete-look priority', () => {
  const controls = getLockControls();
  const activeOptionId = (key) => controls
    .find((control) => control.key === key)
    ?.options.find((option) => option.zh !== '全無' && option.zh !== '隨機' && option.en !== 'none')?.id;
  const outfitPresetId = activeOptionId('outfitPresetId');
  const outerwearId = activeOptionId('outerwearId');

  const restored = buildRestoreLocks({
    ...createEmptyLocks(),
    outfitPresetId,
    dressId: activeOptionId('dressId'),
    topId: activeOptionId('topId'),
    pantsId: activeOptionId('pantsId'),
    outerwearId,
  }, controls);

  assert.equal(restored.outfitPresetId, outfitPresetId);
  assert.notEqual(restored.dressId, activeOptionId('dressId'));
  assert.notEqual(restored.topId, activeOptionId('topId'));
  assert.notEqual(restored.pantsId, activeOptionId('pantsId'));
  assert.equal(restored.outerwearId, outerwearId);
});

test('standard prompt parser restores prop actions only into posePropId', () => {
  const controls = getLockControls();
  const prop = controls
    .find((control) => control.key === 'posePropId')
    .options.find((option) => option.zh === '手持冰咖啡');
  const parsed = parseLocksFromStandardPrompt(`portrait, ${prop.en}`, controls);

  assert.equal(parsed.locks.posePropId, prop.id);
  assert.equal(parsed.locks.poseHandId, 'none');
});

test('standard prompt parser restores both pocket hand actions and the retired generic wording', () => {
  const controls = getLockControls();
  const handControl = controls.find((control) => control.key === 'poseHandId');
  const pantsPockets = handControl.options.find((option) => option.zh === '雙手插褲子口袋');
  const outerwearPockets = handControl.options.find((option) => option.zh === '雙手插外套口袋');

  assert.ok(pantsPockets);
  assert.ok(outerwearPockets);
  assert.ok(pantsPockets.meta?.legacyPromptAliases?.includes('both hands tucked into pockets'));

  for (const [promptText, expectedId] of [
    [pantsPockets.en, pantsPockets.id],
    ['both hands tucked into pockets', pantsPockets.id],
    [outerwearPockets.en, outerwearPockets.id],
  ]) {
    const parsed = parseLocksFromStandardPrompt(`portrait, ${promptText}`, controls);
    assert.equal(parsed.locks.poseHandId, expectedId, promptText);
  }
});

test('standard prompt parser restores revised hand actions from current and legacy wording', () => {
  const controls = getLockControls();
  const handControl = controls.find((control) => control.key === 'poseHandId');
  const cases = [
    {
      id: 'one-hand-open-palm-camera',
      legacy: 'one hand raised toward the camera with an open palm and relaxed fingers, a natural expressive greeting gesture',
    },
    {
      id: 'hands-lift-waistband',
      legacy: 'both hands pulling the pants or skirt waistband slightly upward into place, fingers gripping the waistband or belt loops without lowering or removing the garment',
    },
    {
      id: 'selfie-companion-camera-interaction',
      legacy: 'casual, naturally relaxed hand placement in a close-companion social snapshot, with unforced candid body language',
    },
  ];

  for (const { id, legacy } of cases) {
    const hand = handControl.options.find((option) => option.id === id);
    assert.ok(hand, id);
    assert.ok(hand.meta?.legacyPromptAliases?.includes(legacy), id);
    for (const promptText of [hand.en, legacy]) {
      const parsed = parseLocksFromStandardPrompt(`portrait, ${promptText}`, controls);
      assert.equal(parsed.locks.poseHandId, id, promptText);
    }
  }
});

test('standard prompt parser restores only the strict Z-Image exact visible text wrapper', () => {
  const controls = getLockControls();
  const exactSentence = 'A wall poster within the scene clearly displays the exact English text "MIDNIGHT CAFE".';
  const parsed = parseLocksFromStandardPrompt(`Photorealistic editorial portrait.\n\n${exactSentence}`, controls);

  assert.equal(parsed.locks.zImageVisibleTextEnabled, true);
  assert.equal(parsed.locks.zImageVisibleTextContent, 'MIDNIGHT CAFE');
  assert.equal(parsed.locks.zImageVisibleTextLanguage, 'english');
  assert.equal(parsed.locks.zImageVisibleTextPlacement, 'wall-poster');
  assert.equal(
    parsed.matchedControls.filter(({ key }) => key.startsWith('zImageVisibleText')).length,
    4,
  );

  const unrelated = parseLocksFromStandardPrompt('A sign says MIDNIGHT CAFE.', controls);
  assert.equal(unrelated.locks.zImageVisibleTextEnabled, false);
  assert.equal(unrelated.locks.zImageVisibleTextContent, '');
});

test('standard prompt parser migrates both legacy lipstick descriptions into the merged prop action', () => {
  const controls = getLockControls();
  const legacyLipstickPrompts = [
    'one hand pressing a lipstick bullet to the lips, with visible hand-to-mouth contact and slight lip pressure',
    'one hand applying lipstick messily beyond the lip line, with visible hand-to-mouth contact',
  ];

  legacyLipstickPrompts.forEach((legacyPrompt) => {
    const parsed = parseLocksFromStandardPrompt(`portrait, ${legacyPrompt}`, controls);
    assert.equal(parsed.locks.posePropId, 'hand-apply-lipstick', legacyPrompt);
    assert.equal(parsed.locks.poseHandId, 'none', legacyPrompt);
  });
});

test('standard prompt parser prefers the longest matching option text', () => {
  const controls = getLockControls();
  const hairstyleControl = controls.find((control) => control.key === 'hairstyleId');
  const target = [...hairstyleControl.options]
    .filter((option) => option.zh !== '全無' && option.en)
    .sort((a, b) => b.en.length - a.en.length)[0];

  const parsed = parseLocksFromStandardPrompt(`portrait, ${target.en}`, controls);
  assert.equal(parsed.locks.hairstyleId, target.id);
  assert.ok(parsed.matchedControls.some((entry) => entry.key === 'hairstyleId'));
});

test('standard prompt parser restores current and legacy street gold necklace wording', () => {
  const controls = getLockControls();
  const neckControl = controls.find((entry) => entry.key === 'neckAccessoryId');
  const necklace = neckControl.options.find((entry) => entry.zh === '街頭風格金項鏈');
  const currentText = 'short gold curb-link necklace worn around the base of the neck at collarbone level, understated streetwear jewelry';
  const legacyText = 'street-style gold chain detail, subtle urban neck accent';

  assert.equal(necklace.en, currentText);
  assert.ok(necklace.meta?.legacyPromptAliases?.includes(legacyText));

  for (const promptText of [currentText, legacyText]) {
    const parsed = parseLocksFromStandardPrompt(promptText, controls);
    assert.equal(parsed.locks.neckAccessoryId, necklace.id);
  }
});

test('standard prompt parser restores natural multi-phrase garment color syntax', () => {
  const controls = getLockControls();
  const control = (key) => controls.find((entry) => entry.key === key);
  const option = (key, zh) => control(key).options.find((entry) => entry.zh === zh);
  const dress = option('dressId', '連身：短版｜高領挖腰連身泳裝');
  const mirrorChrome = option('dressColorId', '鏡面鉻銀');
  const top = option('topId', '棉質細肩背心');
  const multicolorStripes = option('topColorId', '彩色橫條紋');

  const chromePrompt = `${dress.en}, finished in mirror-chrome silver with a highly polished scene-reflective surface and crisp environment reflections`;
  const stripedPrompt = `${top.en}, patterned with bold multicolored horizontal stripes, wide stripe bands, and clearly separated random colors`;
  const parsedChrome = parseLocksFromStandardPrompt(chromePrompt, controls);
  const parsedStripes = parseLocksFromStandardPrompt(stripedPrompt, controls);

  assert.equal(parsedChrome.locks.dressId, dress.id);
  assert.equal(parsedChrome.locks.dressColorId, mirrorChrome.id);
  assert.equal(parsedStripes.locks.topId, top.id);
  assert.equal(parsedStripes.locks.topColorId, multicolorStripes.id);
});

test('saved card manifest exports structured source tags without AI inference', () => {
  const prompt = {
    id: 'prompt-manifest-1',
    source: 'page1',
    sourceLabel: 'Prompt 工作台',
    summary: '人物：單人 | 場景：戶外',
    summaryFields: {
      style: '',
      character: '單人',
      wardrobe: '',
      location: '戶外',
      camera: '',
      lighting: '',
    },
    structured: {
      Style: [{ zh: '底片風格', meta: { tags: ['film', 'film', 'soft_grade'] } }],
      Location: [{ zh: '戶外', meta: { tags: ['outdoor'] } }],
    },
  };

  assert.deepEqual(collectSourceTags(prompt), [
    { id: 'film', category: '風格', label: 'Film' },
    { id: 'soft_grade', category: '風格', label: 'Soft Grade' },
    { id: 'outdoor', category: '場景', label: 'Outdoor' },
  ]);

  assert.deepEqual(buildSavedCardManifestItem(prompt, 'prompt_prompt-manifest-1.md'), {
    sourceId: 'prompt-manifest-1',
    file: 'prompt_prompt-manifest-1.md',
    title: '人物：單人 | 場景：戶外',
    source: 'page1',
    sourceLabel: 'Prompt 工作台',
    summary: '人物：單人 | 場景：戶外',
    summaryFields: {
      style: '',
      character: '單人',
      wardrobe: '',
      location: '戶外',
      camera: '',
      lighting: '',
    },
    tags: [
      { id: 'film', category: '風格', label: 'Film' },
      { id: 'soft_grade', category: '風格', label: 'Soft Grade' },
      { id: 'outdoor', category: '場景', label: 'Outdoor' },
    ],
  });
});

test('manifest summary fields normalize PAGE2 and PAGE3 aliases into the fixed schema', () => {
  assert.deepEqual(normalizeManifestSummaryFields({
    source: 'page2',
    summaryFields: {
      characterDna: '37_Hina',
      expressionPose: 'Headshot Prompt',
      wardrobe: '純人物',
      sceneLook: '-',
    },
  }), {
    style: '',
    character: '37_Hina',
    wardrobe: '純人物',
    location: '',
    camera: '',
    lighting: '',
  });

  assert.deepEqual(normalizeManifestSummaryFields({
    summary: '風格：底片 | 人物：單人 | 服裝：白襯衫 | 場景：街道 | 鏡頭：35mm | 光影：柔光',
  }), {
    style: '底片',
    character: '單人',
    wardrobe: '白襯衫',
    location: '街道',
    camera: '35mm',
    lighting: '柔光',
  });
});

test('source tags dedupe by stable id even when categories differ', () => {
  assert.deepEqual(collectSourceTags({
    source: 'page1',
    sourceTags: [{ id: 'film', category: '來源', label: 'Source Film' }],
    structured: {
      Style: [{ meta: { tags: ['film', 'editorial'] } }],
    },
  }), [
    { id: 'film', category: '來源', label: 'Source Film' },
    { id: 'editorial', category: '風格', label: 'Editorial' },
  ]);
});
