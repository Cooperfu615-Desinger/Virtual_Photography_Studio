import { createEmptyLocks, getLockControls } from '../engine.js';
import { REPRESENTATIVE_PROMPT_FIXTURES } from './representativePromptFixtures.js';

export function protectedNaturalOutputs(prompt) {
  return { grokPrompt: prompt.grokPrompt, zImagePrompt: prompt.zImagePrompt,
    extraPrompts: prompt.extraPrompts, selection: prompt.selection, structured: prompt.structured,
    summary: prompt.summary, summaryFields: prompt.summaryFields };
}

export const CRT_MIDJOURNEY_SELECTIONS = Object.freeze({
  subjectCount: '1', bodyTypeId: { byZh: '豐胸纖腰沙漏身形' },
  facialFeaturesId: { byZh: '甜美可愛臉' }, skinDetailsId: { byZh: '自然雀斑' },
  hairstyleId: { byZh: '柔波：瀏海' }, hairStylingStateId: { byZh: '柔順自然' },
  hairColorId: { byZh: '自然黑' }, expressionId: { byZh: '柔和微笑' },
  topId: { byZh: '比基尼上身' }, topFitId: { byZh: '緊身' },
  pantsId: { byZh: '窄前片細繩比基尼下身' }, bottomRiseId: { byZh: '超低腰' },
  legwearId: { byZh: '蕾絲大腿絲襪' }, shoesId: { byZh: 'Dr. Martens 1460 Round Toe Lace-Up Boots' },
  sceneAttributeId: { byZh: '室內' }, locationId: { byZh: '室內：CRT 電視牆攝影棚' },
  lightingId: { byZh: '高調純白攝影棚' }, lightDirectionId: { byZh: '柔和順光' },
  imageTypePresetId: 'fashion-advertising', framingId: { byZh: '牛仔中景 (Cowboy Shot)' },
  styleId: { byZh: '蜷川實花｜濃烈色彩戲劇感' }, filmId: { byZh: '跨沖霓虹剪影濾鏡' },
});

export function naturalFixtureLocks(selections = {}) {
  const controls = getLockControls();
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    const none = control.options?.find(option => option.id === 'none' || option.zh === '全無');
    if (none) locks[control.key] = none.id;
  }
  for (const [key, selector] of Object.entries(selections)) {
    if (selector && typeof selector === 'object' && !Array.isArray(selector)) {
      const option = controls.find(control => control.key === key)?.options.find(option => option.zh === selector.byZh);
      if (!option) throw new Error(`Unknown fixture selection ${key}: ${selector.byZh}`);
      locks[key] = option.id;
    } else locks[key] = selector;
  }
  return locks;
}

export function midjourneyNaturalFixtures() {
  const fixtures = [
    { id: 'crt-cowboy', locks: naturalFixtureLocks(CRT_MIDJOURNEY_SELECTIONS), seed: 'mj-natural-crt' },
    ...REPRESENTATIVE_PROMPT_FIXTURES.map(fixture => ({
      id: `representative:${fixture.id}`, locks: naturalFixtureLocks(fixture.locks), seed: fixture.seed,
    })),
  ];
  const controls = getLockControls();
  for (const key of ['characterProfileId', 'specialSubjectId', 'specialOutfitId', 'outfitPresetId', 'fixedCompositionSetId']) {
    for (const option of controls.find(control => control.key === key).options) {
      if (['none', 'random'].includes(option.id) || option.zh === '隨機') continue;
      for (const framing of ['全身鏡頭 (Full Body Shot)', '牛仔中景 (Cowboy Shot)', '胸上特寫 (Chest-Up Shot)']) {
        // Resolve the actual catalog spelling for the chest crop.
        const framingOption = framing.startsWith('胸上')
          ? controls.find(control => control.key === 'framingId').options.find(option => option.zh === '胸上特寫')
          : controls.find(control => control.key === 'framingId').options.find(option => option.zh === framing);
        fixtures.push({ id: `${key}:${option.id}:${framingOption.id}`,
          locks: naturalFixtureLocks({ subjectCount: '1', [key]: option.id, framingId: framingOption.id }),
          seed: `mj-natural:${key}:${option.id}` });
      }
    }
  }
  for (let index = 0; index < 200; index += 1) fixtures.push({
    id: `random:${index}`, locks: { ...createEmptyLocks(), subjectCount: index % 2 ? '2' : '1' }, seed: `mj-natural:${index}`,
  });
  return fixtures;
}
