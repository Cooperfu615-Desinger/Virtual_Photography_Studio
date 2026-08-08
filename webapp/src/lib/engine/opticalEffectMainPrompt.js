/**
 * PAGE1 optical-effect visibility policy.
 *
 * Refraction effects remain in the engine catalog so legacy locks, Saved Cards,
 * and imported prompts can still resolve them. They are restore-only options:
 * new UI selections and unlocked random generation must not use them.
 */

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export const OPTICAL_EFFECT_MAIN_OPTION_POLICY = deepFreeze({
  visible: [
    { id: 'camera:光學效果-optical-effects:全無:0', zh: '全無', randomCandidate: false },
    { id: 'camera:光學效果-optical-effects:重散景光斑:1', zh: '重散景光斑', randomCandidate: true },
    { id: 'camera:光學效果-optical-effects:旋渦散景-swirly-bokeh:2', zh: '旋渦散景 Swirly Bokeh', randomCandidate: true },
    { id: 'camera:光學效果-optical-effects:貓眼散景-cat-eye-bokeh:3', zh: '貓眼散景 Cat-eye Bokeh', randomCandidate: true },
    { id: 'camera:光學效果-optical-effects:肥皂泡散景-soap-bubble-bokeh:4', zh: '肥皂泡散景 Soap-bubble Bokeh', randomCandidate: true },
    { id: 'camera:光學效果-optical-effects:前景遮擋散景:5', zh: '前景遮擋散景', randomCandidate: true },
    { id: 'camera:光學效果-optical-effects:星芒光圈-starburst:8', zh: '星芒光圈 Starburst', randomCandidate: true },
    { id: 'camera:光學效果-optical-effects:鏡頭光斑-lens-flare:9', zh: '鏡頭光斑 Lens Flare', randomCandidate: true },
    { id: 'camera:光學效果-optical-effects:變形鏡頭光斑-anamorphic-flare:10', zh: '變形鏡頭光斑 Anamorphic Flare', randomCandidate: true },
    { id: 'camera:光學效果-optical-effects:局部炫光霧面反差:11', zh: '局部炫光霧面反差', randomCandidate: true },
    { id: 'camera:光學效果-optical-effects:漏光效果-light-leaks:12', zh: '漏光效果 Light Leaks', randomCandidate: true },
    { id: 'camera:光學效果-optical-effects:柔焦濾鏡-soft-focus:13', zh: '柔焦濾鏡 Soft Focus', randomCandidate: true },
    { id: 'camera:光學效果-optical-effects:霧化高光-bloom:14', zh: '霧化高光 Bloom', randomCandidate: true },
    { id: 'camera:光學效果-optical-effects:暗角-vignette:15', zh: '暗角 Vignette', randomCandidate: true },
    { id: 'camera:光學效果-optical-effects:色差-chromatic-aberration:16', zh: '色差 Chromatic Aberration', randomCandidate: true },
    { id: 'camera:光學效果-optical-effects:邊緣模糊:17', zh: '邊緣模糊', randomCandidate: true },
    { id: 'camera:光學效果-optical-effects:中央清晰邊緣拉抹:18', zh: '中央清晰邊緣拉抹', randomCandidate: true },
    { id: 'camera:光學效果-optical-effects:光學朦朧薄霧:19', zh: '光學朦朧薄霧', randomCandidate: true },
  ],
  legacyHidden: [
    { id: 'camera:光學效果-optical-effects:玻璃前景折射:6', zh: '玻璃前景折射' },
    { id: 'camera:光學效果-optical-effects:稜鏡折射-prism-refraction:7', zh: '稜鏡折射 Prism Refraction' },
  ],
  legacyRestore: {
    preserveIds: true,
    remainResolvable: true,
    preserveStoredSelection: true,
    participateInNewRandomSelection: false,
  },
});

const VISIBLE_OPTION_IDS = new Set(
  OPTICAL_EFFECT_MAIN_OPTION_POLICY.visible.map((option) => option.id),
);
const LEGACY_OPTION_IDS = new Set(
  OPTICAL_EFFECT_MAIN_OPTION_POLICY.legacyHidden.map((option) => option.id),
);
const RANDOM_CANDIDATE_IDS = new Set(
  OPTICAL_EFFECT_MAIN_OPTION_POLICY.visible
    .filter((option) => option.randomCandidate)
    .map((option) => option.id),
);

export function buildPage1OpticalEffectControl(control, selectedId = '') {
  if (!control || control.key !== 'opticalEffectId') return control;

  return {
    ...control,
    options: control.options
      .filter((option) => VISIBLE_OPTION_IDS.has(option.id) || option.id === selectedId)
      .map((option) => (
        LEGACY_OPTION_IDS.has(option.id)
          ? { ...option, disabled: true }
          : option
      )),
  };
}

export function getRandomOpticalEffectOptions(options = []) {
  return options.filter((option) => RANDOM_CANDIDATE_IDS.has(option.id));
}
