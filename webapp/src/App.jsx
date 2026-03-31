import React, { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Page1Workspace from './components/Page1Workspace';
import Page2Workspace from './components/Page2Workspace';
import Page3Workspace from './components/Page3Workspace';
import SelectControlField from './components/SelectControlField';
import {
  buildLocksFromPrompt,
  createEmptyLocks,
  generatePrompts,
  getKnowledgeBaseOptions,
  getKnowledgeBaseSnapshot,
  getSceneDependentOptions,
  getLockControls,
  normalizeLocks
} from './lib/engine';
import './index.css';

const PROMPTS_KEY = 'vps.prompts';
const FAVORITES_KEY = 'vps.favorites';
const LOCKS_KEY = 'vps.locks';
const GEN_COUNT_KEY = 'vps.genCount';
const VIEW_MODE_KEY = 'vps.viewMode';
const SEARCH_QUERY_KEY = 'vps.searchQuery';
const LIBRARY_DRAFT_KEY = 'vps.libraryDraft';
const PAGE_MODE_KEY = 'vps.pageMode';
const PAGE2_PROFILE_KEY = 'vps.page2Profile';
const PAGE3_PROFILE_KEY = 'vps.page3Profile';
const MAX_STORED_PROMPTS = 120;
const PAGE2_FIELD_OPTIONS = {
  eyes: [
    { id: '', zh: '未指定', en: '' },
    { id: 'round-clear', zh: '圓眼清透感', en: 'clear round eyes with bright open gaze' },
    { id: 'almond-soft', zh: '杏眼柔和感', en: 'soft almond-shaped eyes with gentle feminine balance' },
    { id: 'phoenix-mono', zh: '單眼皮鳳眼', en: 'sleek monolid phoenix eyes with elegant lifted shape' },
    { id: 'siren-mole', zh: '右眼角有痣的媚眼', en: 'siren-like eyes with a small beauty mark near the outer corner of the right eye' },
    { id: 'cat-upturned', zh: '貓系上挑眼', en: 'slightly upturned cat-like eyes with sharp alluring definition' },
  ],
  brows: [
    { id: '', zh: '未指定', en: '' },
    { id: 'straight-soft', zh: '平直自然眉', en: 'soft straight brows with natural density' },
    { id: 'arched-gentle', zh: '柔和微挑眉', en: 'gently arched brows with refined feminine lift' },
    { id: 'cool-thin', zh: '細長冷感眉', en: 'long slim brows with cool composed sharpness' },
    { id: 'dense-bold', zh: '濃密英氣眉', en: 'defined dense brows with quietly confident strength' },
  ],
  nose: [
    { id: '', zh: '未指定', en: '' },
    { id: 'small-straight', zh: '小巧直鼻', en: 'small straight nose with clean refined bridge' },
    { id: 'upturned', zh: '精緻微翹鼻', en: 'delicate slightly upturned nose with refined tip' },
    { id: 'high-bridge', zh: '細長高挺鼻', en: 'slender high-bridge nose with elegant definition' },
    { id: 'soft-tip', zh: '柔和圓鼻尖', en: 'soft rounded nose tip with natural feminine shape' },
  ],
  lips: [
    { id: '', zh: '未指定', en: '' },
    { id: 'petal', zh: '小巧花瓣唇', en: 'small petal-shaped lips with delicate cupid bow' },
    { id: 'full-soft', zh: '柔軟飽滿唇', en: 'soft full lips with smooth natural volume' },
    { id: 'thin-cool', zh: '薄唇冷感型', en: 'slim lips with cool understated definition' },
    { id: 'defined-cupid', zh: '唇峰明顯的精緻唇', en: 'refined lips with pronounced cupid bow and sculpted shape' },
  ],
  faceShape: [
    { id: '', zh: '未指定', en: '' },
    { id: 'oval-small', zh: '小巧鵝蛋臉', en: 'small oval face with smooth balanced proportions' },
    { id: 'round-soft', zh: '柔和圓臉', en: 'soft round face with gentle youthful fullness' },
    { id: 'long-narrow', zh: '窄長臉', en: 'narrow long face with elegant vertical balance' },
    { id: 'heart', zh: '心形臉', en: 'heart-shaped face with softly tapered chin' },
    { id: 'defined-small', zh: '線條分明的巴掌臉', en: 'small face with crisp contour lines and defined jaw balance' },
  ],
  skin: [
    { id: '', zh: '未指定', en: '' },
    { id: 'cool-matte', zh: '冷白霧面肌', en: 'cool fair matte skin with clean refined surface' },
    { id: 'clear-natural', zh: '清透自然肌', en: 'clear natural skin with soft realistic translucency' },
    { id: 'cream', zh: '細膩奶油肌', en: 'fine creamy skin with smooth soft-focus finish' },
    { id: 'dewy', zh: '微光澤裸肌', en: 'subtle dewy bare skin with natural healthy sheen' },
    { id: 'freckles', zh: '帶雀斑清新肌', en: 'fresh skin with soft natural freckles across the cheeks' },
  ],
  makeup: [
    { id: '', zh: '未指定', en: '' },
    { id: 'almost-none', zh: '幾乎無妝感', en: 'almost no-makeup look with understated enhancement' },
    { id: 'korean-nude', zh: '清透韓系裸妝', en: 'clear Korean nude makeup with polished natural glow' },
    { id: 'japanese-sweet', zh: '日系甜感眼妝', en: 'sweet Japanese eye makeup with soft feminine warmth' },
    { id: 'rose-mature', zh: '成熟玫瑰調妝容', en: 'mature rose-toned makeup with elegant romantic depth' },
    { id: 'cool-smoky', zh: '微煙燻冷感妝', en: 'subtle cool smoky makeup with restrained sharpness' },
  ],
};
const PAGE2_FIELD_CONFIG = [
  { key: 'eyes', label: '眼睛' },
  { key: 'brows', label: '眉型' },
  { key: 'nose', label: '鼻子' },
  { key: 'lips', label: '嘴唇' },
  { key: 'faceShape', label: '臉型' },
  { key: 'skin', label: '皮膚' },
  { key: 'makeup', label: '妝容' },
];
const PAGE3_FIELD_OPTIONS = {
  scale: [
    { id: '', zh: '未指定', en: '' },
    { id: 'small-corner', zh: '小場景特寫', en: 'intimate small-scale scene' },
    { id: 'interior-space', zh: '室內空間', en: 'full interior space' },
    { id: 'street-block', zh: '街區尺度', en: 'street-block scale environment' },
    { id: 'city-scale', zh: '城市尺度', en: 'large city-scale environment' },
    { id: 'mountain-landscape', zh: '山脈地景', en: 'vast mountain landscape scale' },
    { id: 'ultra-wide-panorama', zh: '超廣域全景', en: 'ultra wide panoramic scale' },
    { id: 'epic-world', zh: '史詩級世界景觀', en: 'epic world-scale environment' },
  ],
  subject: [
    { id: '', zh: '未指定', en: '' },
    { id: 'cafe-corner', zh: '咖啡館角落', en: 'vintage cafe corner interior' },
    { id: 'hotel-room', zh: '旅館房間', en: 'lived-in hotel room interior' },
    { id: 'conservatory', zh: '溫室', en: 'glass conservatory interior' },
    { id: 'vinyl-listening-room', zh: '黑膠唱片聆聽角', en: 'vinyl listening room' },
    { id: 'piano-room', zh: '老式鋼琴房', en: 'old piano room' },
    { id: 'livehouse-backstage', zh: '地下 live house 後台', en: 'underground live house backstage area' },
    { id: 'alley-street', zh: '巷弄街道', en: 'narrow urban alley street' },
    { id: 'city-skyline', zh: '城市天際線', en: 'expansive city skyline' },
    { id: 'industrial-harbor', zh: '港口工業區', en: 'industrial harbor district' },
    { id: 'mountain-ridge', zh: '山脈稜線', en: 'towering mountain ridgeline' },
    { id: 'canyon', zh: '峽谷地形', en: 'vast canyon terrain' },
    { id: 'coastal-cliff', zh: '海岸懸崖', en: 'dramatic coastal cliff landscape' },
    { id: 'future-megacity', zh: '巨型未來都市', en: 'colossal futuristic megacity' },
    { id: 'floating-city', zh: '浮空城市', en: 'floating city suspended in the sky' },
    { id: 'ancient-temple-ruin', zh: '古老神殿遺跡', en: 'ancient monumental temple ruins' },
    { id: 'otherworld-forest', zh: '異世界森林', en: 'otherworldly forest environment' },
    { id: 'dreamlike-space', zh: '超現實夢境空間', en: 'surreal dreamlike spatial environment' },
  ],
  world: [
    { id: '', zh: '未指定', en: '' },
    { id: 'realistic', zh: '寫實', en: 'grounded realistic worldbuilding' },
    { id: 'nostalgic', zh: '懷舊', en: 'nostalgic atmosphere' },
    { id: 'british', zh: '英倫', en: 'British environmental character' },
    { id: 'punk', zh: '龐克', en: 'punk-influenced visual identity' },
    { id: 'industrial', zh: '工業', en: 'industrial environmental tone' },
    { id: 'fantasy', zh: '奇幻', en: 'fantasy world atmosphere' },
    { id: 'dark-fantasy', zh: '黑暗奇幻', en: 'dark fantasy mood' },
    { id: 'future-sci-fi', zh: '高科幻未來', en: 'high science-fiction future setting' },
    { id: 'cyberpunk', zh: '賽博龐克', en: 'cyberpunk urban world' },
    { id: 'surreal', zh: '超現實', en: 'surreal unreal atmosphere' },
    { id: 'dreamlike', zh: '夢境感', en: 'dreamlike environmental tone' },
    { id: 'mythic-unreal', zh: '非現實神話感', en: 'mythic unreal world presence' },
  ],
  timeWeather: [
    { id: '', zh: '未指定', en: '' },
    { id: 'clear-day', zh: '晴朗白天', en: 'clear daytime conditions' },
    { id: 'overcast-day', zh: '陰天白天', en: 'overcast daytime sky' },
    { id: 'sunset', zh: '黃昏', en: 'sunset hour atmosphere' },
    { id: 'blue-hour', zh: '藍調時刻', en: 'blue-hour atmosphere' },
    { id: 'deep-night', zh: '深夜', en: 'deep night setting' },
    { id: 'after-rain', zh: '雨後', en: 'fresh after-rain atmosphere' },
    { id: 'light-mist', zh: '薄霧', en: 'light mist in the air' },
    { id: 'dense-fog', zh: '濃霧', en: 'dense fog-filled atmosphere' },
    { id: 'storm-coming', zh: '暴風前壓迫天氣', en: 'heavy pre-storm pressure in the sky' },
    { id: 'after-snow', zh: '雪後冷冽空氣', en: 'cold post-snow atmosphere' },
  ],
  lighting: [
    { id: '', zh: '未指定', en: '' },
    { id: 'soft-natural', zh: '柔和自然光', en: 'soft natural ambient light' },
    { id: 'cool-overcast', zh: '冷色陰天光', en: 'cool diffused overcast light' },
    { id: 'warm-tungsten', zh: '暖色鎢絲燈', en: 'warm tungsten practical lighting' },
    { id: 'neon-mixed', zh: '霓虹混光', en: 'mixed neon lighting' },
    { id: 'moonlight', zh: '月光', en: 'cold moonlit illumination' },
    { id: 'strong-backlight', zh: '強烈逆光', en: 'strong backlit atmosphere' },
    { id: 'glowing-mist', zh: '神秘發光霧氣', en: 'mysterious glowing mist illumination' },
    { id: 'celestial-light', zh: '巨型天體照明', en: 'dramatic celestial body lighting' },
    { id: 'cloud-diffusion', zh: '漫射雲層天光', en: 'broad diffused skylight through cloud cover' },
    { id: 'spot-source', zh: '局部聚焦光源', en: 'localized focused light sources' },
  ],
  composition: [
    { id: '', zh: '未指定', en: '' },
    { id: 'neutral-view', zh: '中性環境視角', en: 'neutral environmental point of view' },
    { id: 'wide-establishing', zh: 'wide establishing shot', en: 'wide establishing shot' },
    { id: 'ultra-wide-pano', zh: 'ultra wide panoramic view', en: 'ultra wide panoramic view' },
    { id: 'elevated-overlook', zh: 'elevated overlook', en: 'elevated overlook composition' },
    { id: 'low-angle-monumental', zh: 'low-angle monumental framing', en: 'low-angle monumental framing' },
    { id: 'symmetrical', zh: 'symmetrical composition', en: 'symmetrical composition' },
    { id: 'layered-depth', zh: 'layered depth composition', en: 'layered depth composition' },
    { id: 'foreground-occlusion', zh: 'cinematic foreground occlusion', en: 'cinematic foreground occlusion' },
    { id: 'horizon-emphasis', zh: 'distant horizon emphasis', en: 'distant horizon emphasis' },
  ],
  details: [
    { id: '', zh: '未指定', en: '' },
    { id: 'wood-furniture', zh: '木質家具與舊物件', en: 'aged wood furniture and lived-in objects' },
    { id: 'brick-walls', zh: '紅磚與舊牆面', en: 'weathered brick and aged wall surfaces' },
    { id: 'wet-ground', zh: '潮濕反光地面', en: 'wet reflective ground surfaces' },
    { id: 'metal-pipes', zh: '金屬結構與管線', en: 'exposed metal structures and pipework' },
    { id: 'neon-signage', zh: '發光招牌與霓虹', en: 'glowing signage and neon accents' },
    { id: 'stone-ruins', zh: '石材遺跡', en: 'monumental stone ruins and carved surfaces' },
    { id: 'glowing-plants', zh: '發光植被', en: 'subtly glowing vegetation' },
    { id: 'floating-fragments', zh: '漂浮碎片', en: 'floating fragments suspended in space' },
    { id: 'layered-mountains', zh: '遠景層疊山巒', en: 'layered distant mountain forms' },
    { id: 'cloud-sea', zh: '厚重雲海', en: 'heavy rolling sea of clouds' },
    { id: 'massive-architecture', zh: '巨型建築輪廓', en: 'massive architectural silhouettes' },
    { id: 'weathered-ground', zh: '風化地表紋理', en: 'weathered ground texture and erosion patterns' },
  ],
};
const PAGE3_FIELD_CONFIG = [
  { key: 'scale', label: '場景尺度' },
  { key: 'subject', label: '場景主體' },
  { key: 'world', label: '世界觀方向' },
  { key: 'timeWeather', label: '時間與天氣' },
  { key: 'lighting', label: '光線氛圍' },
  { key: 'composition', label: '構圖與鏡頭' },
  { key: 'details', label: '材質與環境細節' },
];

function createEmptyPage2Profile() {
  return Object.fromEntries(PAGE2_FIELD_CONFIG.map((field) => [field.key, '']));
}

function createEmptyPage3Profile() {
  return Object.fromEntries(PAGE3_FIELD_CONFIG.map((field) => [field.key, '']));
}
const SUMMARY_SECTION_INFO = {
  style: {
    label: '風格',
    lockLabels: ['攝影風格'],
    keys: ['styleId'],
  },
  character: {
    label: '人物',
    lockLabels: ['人數', '體態', '五官', '膚質', '髮型', '髮色', '雙人互動', '表情', '姿勢', '特殊動作'],
    keys: [
      'subjectCount',
      'bodyTypeId',
      'facialFeaturesId',
      'facialFeaturesAId',
      'facialFeaturesBId',
      'skinDetailsId',
      'hairstyleId',
      'hairstyleAId',
      'hairstyleBId',
      'hairColorId',
      'hairColorAId',
      'hairColorBId',
      'duoInteractionId',
      'expressionId',
      'poseId',
      'specialActionId',
    ],
  },
  wardrobe: {
    label: '服裝',
    lockLabels: ['套裝', '上身', '上身圖案', '下身', '下身圖案', '襪類', '襪類配色', '外套', '外套圖案', '鞋款', '配件'],
    keys: [
      'outfitPresetId',
      'outfitPresetColorId',
      'outfitPresetAId',
      'outfitPresetAColorId',
      'outfitPresetBId',
      'outfitPresetBColorId',
      'topId',
      'topColorId',
      'topPatternId',
      'duoStylingId',
      'pantsId',
      'skirtId',
      'bottomColorId',
      'bottomPatternId',
      'legwearId',
      'legwearColorId',
      'outerwearId',
      'outerwearColorId',
      'outerwearPatternId',
      'shoesId',
      'shoesColorId',
      'eyewearId',
      'earringsId',
      'neckAccessoryId',
      'wristAccessoryId',
      'ringId',
      'waistAccessoryId',
    ],
  },
  location: {
    label: '場景',
    lockLabels: ['場景'],
    keys: ['locationId'],
  },
  camera: {
    label: '鏡頭',
    lockLabels: ['畫面比例', '景別', '角度', '方位', '焦段', '光學效果', '成像風格'],
    keys: ['aspectRatio', 'framingId', 'angleId', 'orbitId', 'lensId', 'opticalEffectId', 'filmId'],
  },
  lighting: {
    label: '光影',
    lockLabels: ['環境光氛', '光線表現'],
    keys: ['lightingId', 'lightDirectionId'],
  },
};
const ADVANCED_REMIX_GROUP_INFO = {
  characterDna: {
    label: '角色 DNA',
    lockLabels: ['人數', '體態', '五官', '膚質', '髮型', '髮色', '雙人互動'],
    keys: [
      'subjectCount',
      'bodyTypeId',
      'facialFeaturesId',
      'facialFeaturesAId',
      'facialFeaturesBId',
      'skinDetailsId',
      'hairstyleId',
      'hairstyleAId',
      'hairstyleBId',
      'hairColorId',
      'hairColorAId',
      'hairColorBId',
      'duoInteractionId',
    ],
  },
  expressionPose: {
    label: '表情姿勢',
    lockLabels: ['表情', '姿勢', '特殊動作'],
    keys: ['expressionId', 'poseId', 'specialActionId'],
  },
  wardrobeCore: {
    label: '服裝主體',
    lockLabels: ['套裝', '上身', '上身圖案', '下身', '下身圖案', '外套', '外套圖案', '襪類', '鞋款'],
    keys: [
      'outfitPresetId',
      'outfitPresetColorId',
      'outfitPresetAId',
      'outfitPresetAColorId',
      'outfitPresetBId',
      'outfitPresetBColorId',
      'topId',
      'topColorId',
      'topPatternId',
      'duoStylingId',
      'pantsId',
      'skirtId',
      'bottomColorId',
      'bottomPatternId',
      'legwearId',
      'legwearColorId',
      'outerwearId',
      'outerwearColorId',
      'outerwearPatternId',
      'shoesId',
      'shoesColorId',
    ],
  },
  sceneLook: {
    label: '場景鏡頭',
    lockLabels: ['場景', '鏡頭', '光影'],
    keys: ['locationId', 'aspectRatio', 'framingId', 'angleId', 'orbitId', 'lensId', 'opticalEffectId', 'filmId', 'lightingId', 'lightDirectionId'],
  },
};
const REMIX_GROUP_INFO = { ...SUMMARY_SECTION_INFO, ...ADVANCED_REMIX_GROUP_INFO };
const CHARACTER_CONTROL_ORDER = [
  'subjectCount',
  'bodyTypeId',
  'facialFeaturesId',
  'facialFeaturesAId',
  'facialFeaturesBId',
  'hairstyleId',
  'hairstyleAId',
  'hairstyleBId',
  'hairColorId',
  'hairColorAId',
  'hairColorBId',
  'skinDetailsId',
  'duoInteractionId',
  'expressionId',
  'poseId',
  'specialActionId',
];
const SCENE_CAMERA_CONTROL_ORDER = ['styleId', 'locationId', 'lightingId', 'lightDirectionId', 'angleId', 'orbitId', 'framingId', 'lensId', 'opticalEffectId', 'filmId', 'aspectRatio'];
const SCENE_CAMERA_SIMPLIFIED_ORDER = ['styleId', 'locationId', 'angleId', 'orbitId', 'framingId', 'lensId', 'opticalEffectId', 'aspectRatio'];
const STYLE_WARDROBE_CONTROL_ORDER = ['outfitPresetId', 'outfitPresetColorId', 'outfitPresetAId', 'outfitPresetAColorId', 'outfitPresetBId', 'outfitPresetBColorId', 'topId', 'topColorId', 'topPatternId', 'duoStylingId', 'pantsId', 'skirtId', 'bottomColorId', 'bottomPatternId', 'legwearId', 'legwearColorId', 'outerwearId', 'outerwearColorId', 'outerwearPatternId', 'shoesId', 'shoesColorId', 'eyewearId', 'earringsId', 'neckAccessoryId', 'wristAccessoryId', 'ringId', 'waistAccessoryId'];

function sortControls(controls, order) {
  const orderMap = new Map(order.map((key, index) => [key, index]));
  return [...controls].sort((a, b) => (orderMap.get(a.key) ?? 999) - (orderMap.get(b.key) ?? 999));
}

function isNoneSelected(controlKey, value, controls) {
  if (!value) return false;
  const control = controls.find((item) => item.key === controlKey);
  const selected = control?.options.find((option) => option.id === value);
  return selected?.zh === '全無';
}

function buildMarkdownExport(data) {
  return `# Generated Prompt - ${new Date(data.date).toLocaleString()}
**Summary:** ${data.summary}

## Midjourney Prompt
\`\`\`text
${data.midjourneyPrompt}
\`\`\`

## Grok Structured Prompt
\`\`\`text
${data.grokPrompt}
\`\`\`

---

## Structured Scheme
${Object.entries(data.structured)
  .map(([key, items]) => {
    const text = items.map((item) => `${item.en} (${item.zh})`).join(', ');
    return `* **${key}:** ${text || '-'}`;
  })
  .join('\n')}
`;
}

function toShortPromptId(id) {
  return `#${String(id).slice(-6).toUpperCase()}`;
}

function createLineage(prompt) {
  return {
    rootId: prompt.id,
    rootShortId: toShortPromptId(prompt.id),
    parentId: null,
    parentShortId: '',
    version: 1,
    remixCount: 0,
    lastMode: 'original',
    lastLocked: [],
  };
}

function buildNextLineage(previousPrompt, nextPrompt, summaryKeys, { branch = false } = {}) {
  const previousLineage = previousPrompt.lineage || createLineage(previousPrompt);
  return {
    rootId: previousLineage.rootId || previousPrompt.id,
    rootShortId: previousLineage.rootShortId || toShortPromptId(previousLineage.rootId || previousPrompt.id),
    parentId: previousPrompt.id,
    parentShortId: toShortPromptId(previousPrompt.id),
    version: (previousLineage.version || 1) + 1,
    remixCount: (previousLineage.remixCount || 0) + 1,
    lastMode: branch ? 'branch' : 'replace',
    lastLocked: summaryKeys.map((key) => REMIX_GROUP_INFO[key]?.label).filter(Boolean),
  };
}

function selectionKeysEqual(previous, next, keys) {
  return keys.every((key) => (previous?.selection?.[key] || '') === (next?.selection?.[key] || ''));
}

function buildRemixMeta(previousPrompt, nextPrompt, lockedSections) {
  const kept = [];
  const changed = [];
  const adjusted = [];
  const sectionStates = {};

  Object.entries(SUMMARY_SECTION_INFO).forEach(([sectionKey, section]) => {
    const isLocked = lockedSections.includes(sectionKey);
    const isSame = selectionKeysEqual(previousPrompt, nextPrompt, section.keys);

    if (isLocked && isSame) kept.push(section.label);
    if (isLocked && !isSame) adjusted.push(section.label);
    if (!isLocked && !isSame) changed.push(section.label);

    sectionStates[sectionKey] = isLocked
      ? (isSame ? 'kept' : 'adjusted')
      : (isSame ? 'unchanged' : 'changed');
  });

  return {
    locked: lockedSections.map((key) => REMIX_GROUP_INFO[key]?.label).filter(Boolean),
    kept,
    changed,
    adjusted,
    sectionStates,
    previousSummaryFields: previousPrompt.summaryFields || {},
    nextSummaryFields: nextPrompt.summaryFields || {},
    sourceShortId: toShortPromptId(previousPrompt.id),
  };
}

function buildAllNoneLocks(controls, currentLocks) {
  const nextLocks = createEmptyLocks();
  nextLocks.subjectCount = currentLocks.subjectCount || nextLocks.subjectCount;
  nextLocks.aspectRatio = currentLocks.aspectRatio || nextLocks.aspectRatio;

  controls.forEach((control) => {
    if (['subjectCount', 'aspectRatio'].includes(control.key)) return;
    const noneOption = control.options?.find((option) => option.zh === '全無');
    if (noneOption) {
      nextLocks[control.key] = noneOption.id;
      return;
    }
    nextLocks[control.key] = Array.isArray(nextLocks[control.key]) ? [] : '';
  });

  return nextLocks;
}

function loadJsonStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function loadStringStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

function createEntryKey(group, category, index) {
  return `${group}::${category}::${index}`;
}

function buildLibraryDraftSummary(baseSnapshot, draftSnapshot) {
  if (!draftSnapshot) return '';

  const lines = [];
  const groupMap = {
    Regional: 'Photography Style',
    Locations: 'Location',
    Wardrobe: 'Wardrobe',
    Character: 'Character',
    CameraLighting: 'Camera & Lighting',
    Negative: 'Negative',
  };

  Object.entries(draftSnapshot).forEach(([groupKey, categories]) => {
    Object.entries(categories || {}).forEach(([categoryKey, items]) => {
      const baseItems = baseSnapshot?.[groupKey]?.[categoryKey] || [];
      items.forEach((item, index) => {
        const baseItem = baseItems[index];
        const normalizedItem = {
          zh: item?.zh || '',
          en: item?.en || '',
          desc: item?.desc || '',
        };
        const normalizedBase = {
          zh: baseItem?.zh || '',
          en: baseItem?.en || '',
          desc: baseItem?.desc || '',
        };

        if (!baseItem) {
          lines.push(`[新增] ${groupMap[groupKey] || groupKey} / ${categoryKey} / ${normalizedItem.zh || normalizedItem.en}`);
          lines.push(`en: ${normalizedItem.en}`);
          if (normalizedItem.desc) lines.push(`desc: ${normalizedItem.desc}`);
          lines.push('');
          return;
        }

        if (
          normalizedItem.zh !== normalizedBase.zh
          || normalizedItem.en !== normalizedBase.en
          || normalizedItem.desc !== normalizedBase.desc
        ) {
          lines.push(`[修改] ${groupMap[groupKey] || groupKey} / ${categoryKey} / ${normalizedBase.zh || normalizedBase.en}`);
          if (normalizedItem.zh !== normalizedBase.zh) lines.push(`zh: ${normalizedBase.zh} -> ${normalizedItem.zh}`);
          if (normalizedItem.en !== normalizedBase.en) lines.push(`en: ${normalizedBase.en} -> ${normalizedItem.en}`);
          if (normalizedItem.desc !== normalizedBase.desc) lines.push(`desc: ${normalizedBase.desc} -> ${normalizedItem.desc}`);
          lines.push('');
        }
      });
    });
  });

  return lines.join('\n').trim();
}

function getPage2OptionLabel(fieldKey, optionId) {
  return PAGE2_FIELD_OPTIONS[fieldKey]?.find((option) => option.id === optionId)?.zh || '';
}

function getPage2OptionPrompt(fieldKey, optionId) {
  return PAGE2_FIELD_OPTIONS[fieldKey]?.find((option) => option.id === optionId)?.en || '';
}

function buildPage2ProfileSummary(profile) {
  return PAGE2_FIELD_CONFIG
    .map((field) => getPage2OptionLabel(field.key, profile[field.key]))
    .filter(Boolean)
    .join(' / ');
}

function buildPage2ProfileAnchor(profile) {
  const anchorPriority = ['eyes', 'faceShape', 'makeup', 'skin', 'lips', 'brows', 'nose'];
  const promptParts = anchorPriority
    .map((fieldKey) => getPage2OptionPrompt(fieldKey, profile[fieldKey]))
    .filter(Boolean)
    .slice(0, 4);

  if (promptParts.length === 0) return '';

  return `distinct face anchor, ${promptParts.join(', ')}`;
}

function buildPage2ViewPrompts(profile) {
  const anchor = buildPage2ProfileAnchor(profile);
  if (!anchor) return [];

  const base =
    'clean studio character reference headshot, neutral seamless background, even studio lighting, clear facial structure visibility, natural realistic skin rendering';

  return [
    {
      key: 'four-angle-sheet',
      label: '四角度合成一張',
      prompt: `${base}, one image containing four consistent headshot angles arranged as a clean reference sheet: front-facing portrait, left three-quarter portrait, right three-quarter portrait, and clean side profile portrait, same person in every panel, matched lighting and facial proportions, clear facial structure comparison across all four views, ${anchor}`,
    },
    {
      key: 'front',
      label: '正面',
      prompt: `${base}, front-facing portrait, direct symmetrical face view, ${anchor}`,
    },
    {
      key: 'left-three-quarter',
      label: '左前 45 度',
      prompt: `${base}, left three-quarter portrait view, partial side angle with both facial planes visible, ${anchor}`,
    },
    {
      key: 'right-three-quarter',
      label: '右前 45 度',
      prompt: `${base}, right three-quarter portrait view, partial side angle with both facial planes visible, ${anchor}`,
    },
    {
      key: 'profile',
      label: '側面',
      prompt: `${base}, clean side profile portrait, clear nose bridge, brow line, lips, and jaw silhouette visibility, ${anchor}`,
    },
    {
      key: 'back',
      label: '背面',
      prompt: 'clean studio character reference back view, neutral seamless background, even studio lighting, back-facing portrait showing head shape, hairstyle silhouette, and hair length clearly',
    },
  ];
}

function getPage3OptionLabel(fieldKey, optionId) {
  return PAGE3_FIELD_OPTIONS[fieldKey]?.find((option) => option.id === optionId)?.zh || '';
}

function getPage3OptionPrompt(fieldKey, optionId) {
  return PAGE3_FIELD_OPTIONS[fieldKey]?.find((option) => option.id === optionId)?.en || '';
}

function buildPage3Summary(profile) {
  return PAGE3_FIELD_CONFIG
    .map((field) => getPage3OptionLabel(field.key, profile[field.key]))
    .filter(Boolean)
    .join(' / ');
}

function buildPage3Anchor(profile) {
  const priority = ['subject', 'scale', 'world', 'timeWeather', 'lighting', 'composition'];
  const promptParts = priority
    .map((fieldKey) => getPage3OptionPrompt(fieldKey, profile[fieldKey]))
    .filter(Boolean)
    .slice(0, 6);

  if (promptParts.length === 0) return '';
  return promptParts.join(', ');
}

function buildPage3Prompt(profile) {
  const subject = getPage3OptionPrompt('subject', profile.subject);
  const scale = getPage3OptionPrompt('scale', profile.scale);
  const world = getPage3OptionPrompt('world', profile.world);
  const timeWeather = getPage3OptionPrompt('timeWeather', profile.timeWeather);
  const lighting = getPage3OptionPrompt('lighting', profile.lighting);
  const composition = getPage3OptionPrompt('composition', profile.composition);
  const details = getPage3OptionPrompt('details', profile.details);

  const qualifiers = ['empty scene', 'no people', 'no human subject'];
  const interiorSubjects = new Set([
    'cafe-corner', 'hotel-room', 'conservatory', 'vinyl-listening-room', 'piano-room', 'livehouse-backstage'
  ]);
  const streetSubjects = new Set(['alley-street']);

  if (interiorSubjects.has(profile.subject)) qualifiers.push('unoccupied interior');
  if (streetSubjects.has(profile.subject)) qualifiers.push('empty street scene');

  const parts = [
    ...qualifiers,
    subject,
    scale,
    world,
    timeWeather,
    lighting,
    composition,
    details,
    'strong environmental storytelling',
  ].filter(Boolean);

  return parts.join(', ');
}

function buildPage3CinematicPrompt(profile) {
  const subject = getPage3OptionPrompt('subject', profile.subject);
  const scale = getPage3OptionPrompt('scale', profile.scale);
  const world = getPage3OptionPrompt('world', profile.world);
  const timeWeather = getPage3OptionPrompt('timeWeather', profile.timeWeather);
  const lighting = getPage3OptionPrompt('lighting', profile.lighting);
  const composition = getPage3OptionPrompt('composition', profile.composition);
  const details = getPage3OptionPrompt('details', profile.details);
  const monumentalScales = new Set(['city-scale', 'mountain-landscape', 'ultra-wide-panorama', 'epic-world']);
  const sizeEnhancers = monumentalScales.has(profile.scale)
    ? ['colossal scale', 'monumental presence', 'vast atmospheric depth', 'epic environmental storytelling']
    : ['cinematic environmental storytelling'];

  const parts = [
    'ultra cinematic environment shot',
    'no people',
    'no human subject',
    subject,
    scale,
    world,
    timeWeather,
    lighting,
    composition,
    details,
    ...sizeEnhancers,
  ].filter(Boolean);

  return parts.join(', ');
}

function loadFavoritePrompts() {
  if (typeof window === 'undefined') return [];

  const rawFavorites = loadJsonStorage(FAVORITES_KEY, []);
  if (!Array.isArray(rawFavorites) || rawFavorites.length === 0) return [];

  // New format: store full prompt objects directly.
  if (typeof rawFavorites[0] === 'object' && rawFavorites[0] !== null) {
    return rawFavorites.filter((item) => item?.id);
  }

  // Legacy format: store only ids, recover from prompt cache if possible.
  const promptCache = loadJsonStorage(PROMPTS_KEY, []);
  if (!Array.isArray(promptCache)) return [];

  const idSet = new Set(rawFavorites.filter(Boolean));
  return promptCache.filter((item) => item?.id && idSet.has(item.id));
}

export default function App() {
  const [prompts, setPrompts] = useState(() => loadJsonStorage(PROMPTS_KEY, []));
  const [favoritePrompts, setFavoritePrompts] = useState(() => loadFavoritePrompts());
  const [genCount, setGenCount] = useState(() => loadJsonStorage(GEN_COUNT_KEY, 3));
  const [pageMode, setPageMode] = useState(() => loadStringStorage(PAGE_MODE_KEY, 'page1'));
  const [viewMode, setViewMode] = useState(() => loadStringStorage(VIEW_MODE_KEY, 'feed'));
  const [locks, setLocks] = useState(() => normalizeLocks(loadJsonStorage(LOCKS_KEY, createEmptyLocks())));
  const [searchQuery, setSearchQuery] = useState(() => loadStringStorage(SEARCH_QUERY_KEY, ''));
  const [libraryDraft, setLibraryDraft] = useState(() => loadJsonStorage(LIBRARY_DRAFT_KEY, null));
  const [page2Profile, setPage2Profile] = useState(() => loadJsonStorage(PAGE2_PROFILE_KEY, createEmptyPage2Profile()));
  const [page3Profile, setPage3Profile] = useState(() => loadJsonStorage(PAGE3_PROFILE_KEY, createEmptyPage3Profile()));
  const [libraryGroup, setLibraryGroup] = useState('Character');
  const [libraryCategory, setLibraryCategory] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  const [selectedEntryKey, setSelectedEntryKey] = useState('');
  const [editorDraft, setEditorDraft] = useState({ zh: '', en: '', desc: '' });
  const [editorMode, setEditorMode] = useState('edit');
  const [copiedLabel, setCopiedLabel] = useState('');

  useEffect(() => {
    window.localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts.slice(0, MAX_STORED_PROMPTS)));
  }, [prompts]);

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritePrompts));
  }, [favoritePrompts]);

  useEffect(() => {
    window.localStorage.setItem(LOCKS_KEY, JSON.stringify(locks));
  }, [locks]);

  useEffect(() => {
    window.localStorage.setItem(GEN_COUNT_KEY, JSON.stringify(genCount));
  }, [genCount]);

  useEffect(() => {
    window.localStorage.setItem(PAGE_MODE_KEY, pageMode);
  }, [pageMode]);

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    window.localStorage.setItem(SEARCH_QUERY_KEY, searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (libraryDraft) {
      window.localStorage.setItem(LIBRARY_DRAFT_KEY, JSON.stringify(libraryDraft));
      return;
    }
    window.localStorage.removeItem(LIBRARY_DRAFT_KEY);
  }, [libraryDraft]);

  useEffect(() => {
    window.localStorage.setItem(PAGE2_PROFILE_KEY, JSON.stringify(page2Profile));
  }, [page2Profile]);

  useEffect(() => {
    window.localStorage.setItem(PAGE3_PROFILE_KEY, JSON.stringify(page3Profile));
  }, [page3Profile]);

  const favoriteIds = useMemo(() => new Set(favoritePrompts.map((prompt) => prompt.id)), [favoritePrompts]);
  const activeLibrary = useMemo(() => libraryDraft || [], [libraryDraft]);
  const baseKnowledgeBaseSnapshot = useMemo(() => getKnowledgeBaseSnapshot(), []);
  const knowledgeBaseOptions = useMemo(() => getKnowledgeBaseOptions(activeLibrary), [activeLibrary]);
  const knowledgeBaseSnapshot = useMemo(() => getKnowledgeBaseSnapshot(activeLibrary), [activeLibrary]);
  const lockControls = useMemo(() => getLockControls(activeLibrary), [activeLibrary]);
  const sceneDependentOptions = useMemo(() => getSceneDependentOptions(activeLibrary, locks), [activeLibrary, locks]);
  const isPhotographyStyleLocked = Boolean(locks.styleId) && !isNoneSelected('styleId', locks.styleId, lockControls);
  const coreLockControls = useMemo(
    () => {
      const activeOrder = isPhotographyStyleLocked ? SCENE_CAMERA_SIMPLIFIED_ORDER : SCENE_CAMERA_CONTROL_ORDER;
      const controlsWithSceneFiltering = lockControls.map((control) => {
        if (control.key === 'lightingId') {
          return { ...control, options: sceneDependentOptions.lightingOptions };
        }
        if (control.key === 'lightDirectionId') {
          return { ...control, options: sceneDependentOptions.lightDirectionOptions };
        }
        return control;
      });

      return sortControls(
        controlsWithSceneFiltering.filter((control) => activeOrder.includes(control.key)),
        activeOrder
      );
    },
    [isPhotographyStyleLocked, lockControls, sceneDependentOptions]
  );
  const characterLockControls = useMemo(
    () =>
      sortControls(
        lockControls.filter((control) => {
          if (!(control.section === 'character' || control.key === 'subjectCount')) return false;
          if (control.key === 'duoInteractionId' && locks.subjectCount !== '2') return false;
          if (control.key === 'specialActionId' && locks.subjectCount !== '1') return false;
          if (['facialFeaturesId', 'hairstyleId', 'hairColorId'].includes(control.key) && locks.subjectCount === '2') return false;
          if (['facialFeaturesAId', 'facialFeaturesBId', 'hairstyleAId', 'hairstyleBId', 'hairColorAId', 'hairColorBId'].includes(control.key) && locks.subjectCount !== '2') return false;
          return true;
        }),
        CHARACTER_CONTROL_ORDER
      ),
    [lockControls, locks.subjectCount]
  );
  const wardrobeLockControls = useMemo(
    () =>
      sortControls(
        lockControls.filter((control) => {
          if (control.section !== 'wardrobe') return false;
          if (['outfitPresetId', 'outfitPresetColorId'].includes(control.key) && locks.subjectCount === '2') return false;
          if (['outfitPresetAId', 'outfitPresetAColorId', 'outfitPresetBId', 'outfitPresetBColorId'].includes(control.key) && locks.subjectCount !== '2') return false;
          if (control.key === 'duoStylingId' && locks.subjectCount !== '2') return false;
          return true;
        }),
        STYLE_WARDROBE_CONTROL_ORDER
      ),
    [lockControls, locks.subjectCount]
  );

  const activeLockCount = Object.entries(locks).filter(([key, value]) => {
    if (['subjectCount', 'aspectRatio'].includes(key)) return false;
    if (isPhotographyStyleLocked && ['lightingId', 'lightDirectionId', 'filmId'].includes(key)) return false;
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }).length;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const isOutfitPresetActive = locks.subjectCount === '2'
    ? (
        (Boolean(locks.outfitPresetAId) && !isNoneSelected('outfitPresetAId', locks.outfitPresetAId, wardrobeLockControls)) ||
        (Boolean(locks.outfitPresetBId) && !isNoneSelected('outfitPresetBId', locks.outfitPresetBId, wardrobeLockControls))
      )
    : Boolean(locks.outfitPresetId) && !isNoneSelected('outfitPresetId', locks.outfitPresetId, wardrobeLockControls);

  const displayPrompts = useMemo(() => {
    const baseList = viewMode === 'favorites' ? favoritePrompts : prompts;

    if (!normalizedSearch) return baseList;

    return baseList.filter((prompt) => {
      const haystack = [
        prompt.summary,
        prompt.summaryFields?.style,
        prompt.summaryFields?.character,
        prompt.summaryFields?.wardrobe,
        prompt.summaryFields?.location,
        prompt.summaryFields?.camera,
        prompt.summaryFields?.lighting,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [favoritePrompts, normalizedSearch, prompts, viewMode]);

  const activeGroupOption = useMemo(
    () => knowledgeBaseOptions.find((group) => group.value === libraryGroup) || knowledgeBaseOptions[0] || null,
    [knowledgeBaseOptions, libraryGroup]
  );
  const libraryCategories = useMemo(() => activeGroupOption?.categories || [], [activeGroupOption]);
  const effectiveLibraryGroup = activeGroupOption?.value || '';
  const effectiveLibraryCategory = libraryCategory && libraryCategories.includes(libraryCategory)
    ? libraryCategory
    : (libraryCategories[0] || '');
  const libraryEntries = useMemo(() => {
    if (!effectiveLibraryGroup || !effectiveLibraryCategory) return [];
    const entries = knowledgeBaseSnapshot?.[effectiveLibraryGroup]?.[effectiveLibraryCategory] || [];
    const normalized = librarySearch.trim().toLowerCase();
    return entries
      .map((entry, index) => ({
        ...entry,
        entryKey: createEntryKey(effectiveLibraryGroup, effectiveLibraryCategory, index),
        index,
      }))
      .filter((entry) => {
        if (!normalized) return true;
        return [entry.zh, entry.en, entry.desc].join(' ').toLowerCase().includes(normalized);
      });
  }, [knowledgeBaseSnapshot, effectiveLibraryGroup, effectiveLibraryCategory, librarySearch]);
  const selectedLibraryEntry = useMemo(() => {
    if (editorMode === 'new') return null;
    return libraryEntries.find((entry) => entry.entryKey === selectedEntryKey) || libraryEntries[0] || null;
  }, [editorMode, libraryEntries, selectedEntryKey]);
  const libraryDraftSummary = useMemo(
    () => buildLibraryDraftSummary(baseKnowledgeBaseSnapshot, libraryDraft),
    [baseKnowledgeBaseSnapshot, libraryDraft]
  );
  const libraryDraftChangeCount = useMemo(
    () => (libraryDraftSummary ? libraryDraftSummary.split('\n\n').filter(Boolean).length : 0),
    [libraryDraftSummary]
  );
  const page2ProfileSummary = useMemo(() => buildPage2ProfileSummary(page2Profile), [page2Profile]);
  const page2ProfileAnchor = useMemo(() => buildPage2ProfileAnchor(page2Profile), [page2Profile]);
  const page2ViewPrompts = useMemo(() => buildPage2ViewPrompts(page2Profile), [page2Profile]);
  const page3Summary = useMemo(() => buildPage3Summary(page3Profile), [page3Profile]);
  const page3Anchor = useMemo(() => buildPage3Anchor(page3Profile), [page3Profile]);
  const page3Prompt = useMemo(() => buildPage3Prompt(page3Profile), [page3Profile]);
  const page3CinematicPrompt = useMemo(() => buildPage3CinematicPrompt(page3Profile), [page3Profile]);

  const updateLocks = (updater) => {
    setLocks((prev) => {
      const candidate = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      const next = { ...candidate };
      const nextSceneDependentOptions = getSceneDependentOptions(activeLibrary, next);
      const allowedLightingIds = new Set(nextSceneDependentOptions.lightingOptions.map((option) => option.id));
      const allowedDirectionIds = new Set(nextSceneDependentOptions.lightDirectionOptions.map((option) => option.id));

      if (next.lightingId && !allowedLightingIds.has(next.lightingId)) {
        next.lightingId = '';
      }

      if (next.lightDirectionId && !allowedDirectionIds.has(next.lightDirectionId)) {
        next.lightDirectionId = '';
      }

      const poseIsActive = Boolean(next.poseId) && !isNoneSelected('poseId', next.poseId, lockControls);
      const specialActionIsActive = Boolean(next.specialActionId) && !isNoneSelected('specialActionId', next.specialActionId, lockControls);
      if (poseIsActive && specialActionIsActive) {
        next.specialActionId = '';
      }

      if (next.subjectCount !== '1') {
        next.specialActionId = '';
      }

      return next;
    });
  };

  const handleGenerate = () => {
    const newPrompts = generatePrompts(genCount, locks, activeLibrary).map((prompt) => ({
      ...prompt,
      lineage: createLineage(prompt),
    }));
    setPrompts((prev) => [...newPrompts, ...prev].slice(0, MAX_STORED_PROMPTS));
    setViewMode('feed');
  };

  const handleRemixPrompt = (prompt, summaryKeys = [], options = {}) => {
    const { branch = false } = options;
    const keepKeys = Array.from(new Set(summaryKeys.flatMap((key) => SUMMARY_REROLL_MAP[key] || [])));
    const remixLocks = buildLocksFromPrompt(prompt, keepKeys);
    const [generatedPrompt] = generatePrompts(1, remixLocks, activeLibrary);
    const nextPrompt = {
      ...generatedPrompt,
      id: branch ? generatedPrompt.id : prompt.id,
      remixMeta: buildRemixMeta(prompt, generatedPrompt, summaryKeys),
      lineage: buildNextLineage(prompt, generatedPrompt, summaryKeys, { branch }),
    };
    if (branch) {
      setPrompts((prev) => [nextPrompt, ...prev].slice(0, MAX_STORED_PROMPTS));
      setViewMode('feed');
      return;
    }

    setPrompts((prev) => prev.map((item) => (item.id === prompt.id ? nextPrompt : item)));
    setFavoritePrompts((prev) => prev.map((item) => (item.id === prompt.id ? nextPrompt : item)));
  };

  const toggleFavorite = (prompt) => {
    setFavoritePrompts((prev) => {
      if (prev.some((item) => item.id === prompt.id)) {
        return prev.filter((item) => item.id !== prompt.id);
      }
      return [prompt, ...prev].slice(0, MAX_STORED_PROMPTS);
    });
  };

  const handleDeletePrompt = (prompt) => {
    setPrompts((prev) => prev.filter((item) => item.id !== prompt.id));
    setFavoritePrompts((prev) => prev.filter((item) => item.id !== prompt.id));
  };

  const handleDownloadAll = () => {
    if (displayPrompts.length === 0) return;
    const zip = new JSZip();
    displayPrompts.forEach((data) => {
      zip.file(`prompt_${data.id}.md`, buildMarkdownExport(data));
    });
    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, `virtual_photography_prompts_${Date.now()}.zip`);
    });
  };

  const handleCopyText = async (label, text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLabel(label);
      window.setTimeout(() => setCopiedLabel(''), 1800);
    } catch {
      setCopiedLabel('Copy failed');
      window.setTimeout(() => setCopiedLabel(''), 1800);
    }
  };

  const handleLibraryGroupChange = (nextGroup) => {
    const nextGroupOption = knowledgeBaseOptions.find((group) => group.value === nextGroup) || null;
    const nextCategory = nextGroupOption?.categories?.[0] || '';
    const nextEntry = nextCategory ? (knowledgeBaseSnapshot?.[nextGroup]?.[nextCategory]?.[0] || null) : null;
    setLibraryGroup(nextGroup);
    setLibraryCategory(nextCategory);
    setLibrarySearch('');
    if (nextEntry) {
      setSelectedEntryKey(createEntryKey(nextGroup, nextCategory, 0));
      setEditorMode('edit');
      setEditorDraft({ zh: nextEntry.zh || '', en: nextEntry.en || '', desc: nextEntry.desc || '' });
      return;
    }
    setSelectedEntryKey('');
    setEditorMode('new');
    setEditorDraft({ zh: '', en: '', desc: '' });
  };

  const handleLibraryCategoryChange = (nextCategory) => {
    const nextEntry = nextCategory ? (knowledgeBaseSnapshot?.[effectiveLibraryGroup]?.[nextCategory]?.[0] || null) : null;
    setLibraryCategory(nextCategory);
    setLibrarySearch('');
    if (nextEntry) {
      setSelectedEntryKey(createEntryKey(effectiveLibraryGroup, nextCategory, 0));
      setEditorMode('edit');
      setEditorDraft({ zh: nextEntry.zh || '', en: nextEntry.en || '', desc: nextEntry.desc || '' });
      return;
    }
    setSelectedEntryKey('');
    setEditorMode('new');
    setEditorDraft({ zh: '', en: '', desc: '' });
  };

  const handleSelectLibraryEntry = (entry) => {
    setSelectedEntryKey(entry.entryKey);
    setEditorMode('edit');
    setEditorDraft({ zh: entry.zh || '', en: entry.en || '', desc: entry.desc || '' });
  };

  const handleCreateNewEntry = () => {
    setSelectedEntryKey('');
    setEditorMode('new');
    setEditorDraft({ zh: '', en: '', desc: '' });
  };

  const handleSaveLibraryEntry = () => {
    if (!effectiveLibraryGroup || !effectiveLibraryCategory) return;
    if (!editorDraft.zh.trim() || !editorDraft.en.trim()) return;

    const nextDatabase = structuredClone(knowledgeBaseSnapshot);
    const groupBucket = nextDatabase[effectiveLibraryGroup] || {};
    const categoryItems = Array.isArray(groupBucket[effectiveLibraryCategory]) ? [...groupBucket[effectiveLibraryCategory]] : [];

    if (editorMode === 'edit' && selectedEntryKey) {
      const target = selectedLibraryEntry;
      if (!target) return;
      categoryItems[target.index] = {
        zh: editorDraft.zh.trim(),
        en: editorDraft.en.trim(),
        desc: editorDraft.desc.trim(),
      };
    } else {
      categoryItems.push({
        zh: editorDraft.zh.trim(),
        en: editorDraft.en.trim(),
        desc: editorDraft.desc.trim(),
      });
    }

    nextDatabase[effectiveLibraryGroup] = {
      ...groupBucket,
      [effectiveLibraryCategory]: categoryItems,
    };
    setLibraryDraft(nextDatabase);
    if (editorMode === 'new') {
      const nextKey = createEntryKey(effectiveLibraryGroup, effectiveLibraryCategory, categoryItems.length - 1);
      setSelectedEntryKey(nextKey);
      setEditorMode('edit');
    }
  };

  const handleResetLibraryDraft = () => {
    setLibraryDraft(null);
    setLibrarySearch('');
  };

  const handleGenerateLibraryTest = () => {
    const newPrompts = generatePrompts(1, locks, activeLibrary).map((prompt) => ({
      ...prompt,
      lineage: createLineage(prompt),
    }));
    setPrompts((prev) => [...newPrompts, ...prev].slice(0, MAX_STORED_PROMPTS));
    setViewMode('feed');
  };

  const handleCopyLibraryDraftSummary = () => {
    if (!libraryDraftSummary) return;
    handleCopyText('Library draft summary copied', libraryDraftSummary);
  };

  return (
    <div className="container">
      <header className="page-header">
        <div className="page-header-content">
          <div className="page-mode-switch" role="tablist" aria-label="Page mode switch">
            <button
              type="button"
              className={pageMode === 'page1' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
              onClick={() => setPageMode('page1')}
            >
              PAGE1
            </button>
            <button
              type="button"
              className={pageMode === 'page2' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
              onClick={() => setPageMode('page2')}
            >
              PAGE2
            </button>
            <button
              type="button"
              className={pageMode === 'page3' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
              onClick={() => setPageMode('page3')}
            >
              PAGE3
            </button>
          </div>
          <p className="eyebrow">Virtual Photography Studio</p>
          <h1>{pageMode === 'page1' ? 'Prompt Control Deck' : pageMode === 'page2' ? 'Character Builder' : 'Scene Builder'}</h1>
          <p className="subtitle">
            {pageMode === 'page1'
              ? '一個為個人創作流程設計的虛擬攝影 Prompt 生成工具，支援快速組合、批次生成與風格探索。'
              : pageMode === 'page2'
                ? '建立固定角色的臉部與妝容設定，整理成可搬回 PAGE1 使用的角色 Prompt。'
                : '建立無人物的純場景與世界觀 prompt，從小空間到超大景都可獨立生成。'}
          </p>
        </div>
      </header>

      {pageMode === 'page1' ? (
        <Page1Workspace
          activeLockCount={activeLockCount}
          coreLockControls={coreLockControls}
          characterLockControls={characterLockControls}
          wardrobeLockControls={wardrobeLockControls}
          locks={locks}
          isNoneSelected={isNoneSelected}
          updateLocks={updateLocks}
          handleCopyText={handleCopyText}
          isOutfitPresetActive={isOutfitPresetActive}
          genCount={genCount}
          setGenCount={setGenCount}
          handleGenerate={handleGenerate}
          prompts={prompts}
          setPrompts={setPrompts}
          createEmptyLocks={createEmptyLocks}
          buildAllNoneLocks={buildAllNoneLocks}
          lockControls={lockControls}
          viewMode={viewMode}
          setViewMode={setViewMode}
          favoritePrompts={favoritePrompts}
          libraryDraft={libraryDraft}
          libraryDraftChangeCount={libraryDraftChangeCount}
          handleGenerateLibraryTest={handleGenerateLibraryTest}
          handleCopyLibraryDraftSummary={handleCopyLibraryDraftSummary}
          libraryDraftSummary={libraryDraftSummary}
          handleResetLibraryDraft={handleResetLibraryDraft}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          displayPrompts={displayPrompts}
          handleDownloadAll={handleDownloadAll}
          knowledgeBaseOptions={knowledgeBaseOptions}
          effectiveLibraryGroup={effectiveLibraryGroup}
          handleLibraryGroupChange={handleLibraryGroupChange}
          libraryCategories={libraryCategories}
          effectiveLibraryCategory={effectiveLibraryCategory}
          handleLibraryCategoryChange={handleLibraryCategoryChange}
          librarySearch={librarySearch}
          setLibrarySearch={setLibrarySearch}
          libraryEntries={libraryEntries}
          selectedLibraryEntry={selectedLibraryEntry}
          editorMode={editorMode}
          handleSelectLibraryEntry={handleSelectLibraryEntry}
          editorDraft={editorDraft}
          setEditorDraft={setEditorDraft}
          handleCreateNewEntry={handleCreateNewEntry}
          handleSaveLibraryEntry={handleSaveLibraryEntry}
          favoriteIds={favoriteIds}
          toggleFavorite={toggleFavorite}
          handleDeletePrompt={handleDeletePrompt}
          handleRemixPrompt={handleRemixPrompt}
          summarySectionInfo={SUMMARY_SECTION_INFO}
          advancedRemixGroupInfo={ADVANCED_REMIX_GROUP_INFO}
          SelectControlField={SelectControlField}
        />
      ) : pageMode === 'page2' ? (
        <Page2Workspace
          fieldConfig={PAGE2_FIELD_CONFIG}
          fieldOptions={PAGE2_FIELD_OPTIONS}
          profile={page2Profile}
          setProfile={setPage2Profile}
          profileSummary={page2ProfileSummary}
          profileAnchor={page2ProfileAnchor}
          viewPrompts={page2ViewPrompts}
          onCopyText={handleCopyText}
          createEmptyProfile={createEmptyPage2Profile}
        />
      ) : (
        <Page3Workspace
          fieldConfig={PAGE3_FIELD_CONFIG}
          fieldOptions={PAGE3_FIELD_OPTIONS}
          profile={page3Profile}
          setProfile={setPage3Profile}
          summary={page3Summary}
          anchor={page3Anchor}
          prompt={page3Prompt}
          cinematicPrompt={page3CinematicPrompt}
          onCopyText={handleCopyText}
          createEmptyProfile={createEmptyPage3Profile}
        />
      )}

      {copiedLabel ? <div className="toast">{copiedLabel}</div> : null}
    </div>
  );
}
const SUMMARY_REROLL_MAP = Object.fromEntries(
  Object.entries(REMIX_GROUP_INFO).map(([sectionKey, section]) => [sectionKey, section.keys])
);
