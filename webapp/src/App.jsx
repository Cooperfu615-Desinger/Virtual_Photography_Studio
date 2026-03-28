import React, { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Copy } from 'lucide-react';
import PromptCard from './components/PromptCard';
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

function createEmptyPage2Profile() {
  return Object.fromEntries(PAGE2_FIELD_CONFIG.map((field) => [field.key, '']));
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

function isMutedSelectValue(control, value) {
  if (Array.isArray(value)) return value.length === 0;
  if (!value) return true;
  const selected = control.options.find((option) => option.id === value);
  return selected?.zh === '全無';
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

function getSelectedPromptText(control, value) {
  if (Array.isArray(value)) {
    const selectedOptions = control.options.filter((option) => value.includes(option.id) && option.zh !== '全無');
    return selectedOptions.map((option) => option.en).filter(Boolean).join(', ');
  }

  if (!value) return '';
  const selectedOption = control.options.find((option) => option.id === value);
  if (!selectedOption || selectedOption.zh === '全無') return '';
  return selectedOption.en || '';
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

function SelectControlField({ control, value, onChange, onCopy, disabled = false }) {
  const copyText = getSelectedPromptText(control, value);
  const isCopyDisabled = disabled || !copyText;

  return (
    <label className={`field ${disabled ? 'field-disabled' : ''}`}>
      <div className="field-heading-row">
        <span>{control.label}</span>
        <button
          type="button"
          className="icon-btn control-copy-icon-btn"
          disabled={isCopyDisabled}
          onClick={() => onCopy(copyText)}
          title={`Copy ${control.label} prompt`}
          aria-label={`Copy ${control.label} prompt`}
        >
          <Copy size={14} />
        </button>
      </div>
      <div className="field-control-row">
        <select
          disabled={disabled}
          className={isMutedSelectValue(control, value) ? 'select-muted' : ''}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {!control.required ? <option value="">Random</option> : null}
          {control.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.zh}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
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
          </div>
          <p className="eyebrow">Virtual Photography Studio</p>
          <h1>{pageMode === 'page1' ? 'Prompt Control Deck' : 'Character Builder'}</h1>
          <p className="subtitle">
            {pageMode === 'page1'
              ? '一個為個人創作流程設計的虛擬攝影 Prompt 生成工具，支援快速組合、批次生成與風格探索。'
              : '建立固定角色的臉部與妝容設定，整理成可搬回 PAGE1 使用的角色 Prompt。'}
          </p>
        </div>
      </header>

      {pageMode === 'page1' ? (
      <>
      <section className="control-shell">
        <div className="lock-panel control-panel">
          <div className="lock-panel-header">
            <div>
              <div className="lock-title">
                主控台
              </div>
              <p className="lock-subtitle">目前鎖定 {activeLockCount} 個條件。</p>
            </div>
          </div>

          <div className="control-section">
            <div className="control-section-header">
              <div className="control-section-title">Scene & Camera Language</div>
            </div>
            <div className="lock-grid detail-lock-grid">
              {coreLockControls.map((control) => (
                <SelectControlField
                  key={control.key}
                  control={control}
                  value={locks[control.key]}
                  onChange={(value) => updateLocks((prev) => ({ ...prev, [control.key]: value }))}
                  onCopy={(text) => handleCopyText(`${control.label} copied`, text)}
                />
              ))}
            </div>
          </div>

          <div className="control-section control-section-secondary">
            <div className="control-section-header">
              <div className="control-section-title">Character Setup</div>
            </div>
            {locks.subjectCount === 'reference' ? (
              <div className="context-note">
                此模式不在 app 內上傳圖片；生成後請把同一張人物參考圖直接附給 Midjourney、Grok 或 Gemini，prompt 會以附圖人物五官與身份為主。
              </div>
            ) : null}
            <div className="lock-grid">
              {characterLockControls.map((control) => (
                <SelectControlField
                  key={control.key}
                  control={control}
                  value={locks[control.key]}
                  disabled={
                    (control.key === 'poseId' && Boolean(locks.specialActionId) && !isNoneSelected('specialActionId', locks.specialActionId, characterLockControls)) ||
                    (control.key === 'specialActionId' && Boolean(locks.poseId) && !isNoneSelected('poseId', locks.poseId, characterLockControls))
                  }
                  onChange={(value) => updateLocks((prev) => {
                    const next = { ...prev, [control.key]: value };
                    if (control.key === 'poseId' && value && !isNoneSelected('poseId', value, characterLockControls)) {
                      next.specialActionId = '';
                    }
                    if (control.key === 'specialActionId' && value && !isNoneSelected('specialActionId', value, characterLockControls)) {
                      next.poseId = '';
                    }
                    return next;
                  })}
                  onCopy={(text) => handleCopyText(`${control.label} copied`, text)}
                />
              ))}
            </div>
          </div>

          <div className="control-section control-section-secondary">
            <div className="control-section-header">
            <div className="control-section-title">Style & Wardrobe</div>
            </div>
            <div className="lock-grid detail-lock-grid">
              {wardrobeLockControls.map((control) => (
                <SelectControlField
                  key={control.key}
                  control={control}
                  value={locks[control.key]}
                  disabled={
                    isOutfitPresetActive &&
                    !['outfitPresetId', 'outfitPresetColorId', 'outfitPresetAId', 'outfitPresetAColorId', 'outfitPresetBId', 'outfitPresetBColorId'].includes(control.key)
                  }
                  onChange={(value) => updateLocks((prev) => ({ ...prev, [control.key]: value }))}
                  onCopy={(text) => handleCopyText(`${control.label} copied`, text)}
                />
              ))}
            </div>
          </div>

          <div className="control-actions">
            <div className="control-actions-main">
              <label className="field compact-field">
                <span>卡片張數</span>
                <select value={genCount} onChange={(event) => setGenCount(Number(event.target.value))}>
                  <option value={1}>1</option>
                  <option value={3}>3</option>
                </select>
              </label>

              <button className="primary-cta" onClick={handleGenerate}>
                Generate
              </button>
              <button className="secondary danger" onClick={() => setPrompts([])} disabled={prompts.length === 0}>
                Clear Feed {prompts.length > 0 ? `(${prompts.length})` : ''}
              </button>
              <button className="secondary" onClick={() => setLocks(createEmptyLocks())}>
                All Random
              </button>
              <button className="secondary subtle-action" onClick={() => setLocks(buildAllNoneLocks(lockControls, locks))}>
                All None
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="toolbar toolbar-streamlined">
        <div className="tab-row">
          <button className={viewMode === 'feed' ? 'tab-primary-active' : 'secondary'} onClick={() => setViewMode('feed')}>
            Feed ({prompts.length})
          </button>
          <button className={viewMode === 'favorites' ? 'tab-primary-active' : 'secondary'} onClick={() => setViewMode('favorites')}>
            Favorites ({favoritePrompts.length})
          </button>
          <button className={viewMode === 'library' ? 'tab-primary-active' : 'secondary'} onClick={() => setViewMode('library')}>
            Library Editor
          </button>
        </div>

        {viewMode === 'library' ? (
          <div className="filter-bar">
            <div className="results-meta">
              {libraryDraft ? `目前使用瀏覽器草稿資料庫，${libraryDraftChangeCount} 項變更` : '目前使用內建資料庫'}
            </div>
            <div className="tab-row">
              <button className="secondary" onClick={handleGenerateLibraryTest}>
                用目前鎖定條件測試 1 張
              </button>
              <button className="secondary" onClick={handleCopyLibraryDraftSummary} disabled={!libraryDraftSummary}>
                複製草稿摘要
              </button>
              <button className="secondary" onClick={handleResetLibraryDraft} disabled={!libraryDraft}>
                還原內建資料
              </button>
            </div>
          </div>
        ) : (
          <div className="filter-bar">
            <div className="search-shell">
              <input className="text-input search-input" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by style, scene, wardrobe, character..." />
            </div>
            <div className="results-meta">{displayPrompts.length} results</div>
          </div>
        )}

        {viewMode !== 'library' ? (
          <div className="tab-row">
            <button className="secondary" onClick={handleDownloadAll} disabled={displayPrompts.length === 0}>
              Download Feed
            </button>
          </div>
        ) : null}
      </section>

      {viewMode === 'library' ? (
        <section className="library-editor-shell">
          <aside className="library-sidebar lock-panel">
            <div className="control-section-header">
              <div className="control-section-title">Library Browser</div>
            </div>
            <div className="field">
              <span>資料群組</span>
              <select value={effectiveLibraryGroup} onChange={(event) => handleLibraryGroupChange(event.target.value)}>
                {knowledgeBaseOptions.map((group) => (
                  <option key={group.value} value={group.value}>{group.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <span>分類</span>
              <select value={effectiveLibraryCategory} onChange={(event) => handleLibraryCategoryChange(event.target.value)}>
                {libraryCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <span>搜尋條目</span>
              <input
                className="text-input"
                value={librarySearch}
                onChange={(event) => setLibrarySearch(event.target.value)}
                placeholder="Search zh / en / desc"
              />
            </div>
            <div className="library-entry-list">
              {libraryEntries.map((entry) => (
                <button
                  key={entry.entryKey}
                  type="button"
                  className={`library-entry-item ${selectedLibraryEntry?.entryKey === entry.entryKey && editorMode === 'edit' ? 'library-entry-item-active' : ''}`}
                  onClick={() => handleSelectLibraryEntry(entry)}
                >
                  <strong>{entry.zh || entry.en}</strong>
                </button>
              ))}
            </div>
          </aside>

          <section className="library-editor-panel lock-panel">
            <div className="control-section-header">
              <div className="control-section-title">Entry Editor</div>
              <div className="tab-row">
                <button className="secondary" onClick={handleCreateNewEntry}>新增條目</button>
                <button className="primary-cta" onClick={handleSaveLibraryEntry}>儲存草稿</button>
              </div>
            </div>
            <p className="context-note">
              這個版本會把修改存在瀏覽器草稿中，主頁生成會立即套用。你可以改完 wording 後，直接按上方的「用目前鎖定條件測試 1 張」回 Feed 實測。
            </p>
            <div className="library-editor-form">
              <label className="field">
                <span>中文名稱</span>
                <input
                  className="text-input"
                  value={editorDraft.zh}
                  onChange={(event) => setEditorDraft((prev) => ({ ...prev, zh: event.target.value }))}
                  placeholder="例如：雪紡荷葉高領蝴蝶結襯衫"
                />
              </label>
              <label className="field">
                <span>英文 Prompt</span>
                <textarea
                  className="text-input library-textarea"
                  value={editorDraft.en}
                  onChange={(event) => setEditorDraft((prev) => ({ ...prev, en: event.target.value }))}
                  placeholder="輸入主要 prompt wording"
                />
              </label>
              <label className="field">
                <span>描述</span>
                <textarea
                  className="text-input library-textarea"
                  value={editorDraft.desc}
                  onChange={(event) => setEditorDraft((prev) => ({ ...prev, desc: event.target.value }))}
                  placeholder="中文說明，可選"
                />
              </label>
            </div>
          </section>
        </section>
      ) : (
        <div className="feed">
          {displayPrompts.length === 0 ? (
            <div className="empty-state">{searchQuery ? '沒有符合搜尋條件的 prompt。' : '先設定條件，再開始批次生成。'}</div>
          ) : (
            displayPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                data={prompt}
                isFavorite={favoriteIds.has(prompt.id)}
                onFavorite={toggleFavorite}
                onDelete={handleDeletePrompt}
                onRemix={handleRemixPrompt}
                summarySectionInfo={SUMMARY_SECTION_INFO}
                advancedRemixGroupInfo={ADVANCED_REMIX_GROUP_INFO}
              />
            ))
          )}
        </div>
      )}
      </>
      ) : (
        <section className="page2-shell">
          <section className="lock-panel page2-panel">
            <div className="lock-panel-header">
              <div>
                <div className="lock-title">Page2 Character Profile</div>
                <p className="lock-subtitle">用簡潔的五官與妝容選項，先建立穩定可重複使用的角色。</p>
              </div>
            </div>

            <div className="control-section">
              <div className="control-section-header">
                <div className="control-section-title">Face Builder</div>
              </div>
              <div className="lock-grid detail-lock-grid">
                {PAGE2_FIELD_CONFIG.map((field) => (
                  <label key={field.key} className="field">
                    <span>{field.label}</span>
                    <select
                      className={!page2Profile[field.key] ? 'select-muted' : ''}
                      value={page2Profile[field.key]}
                      onChange={(event) => setPage2Profile((prev) => ({ ...prev, [field.key]: event.target.value }))}
                    >
                      {PAGE2_FIELD_OPTIONS[field.key].map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.zh}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>

            <div className="control-actions">
              <div className="control-actions-main">
                <button className="secondary" onClick={() => handleCopyText('Face anchor copied', page2ProfileAnchor)} disabled={!page2ProfileAnchor}>
                  複製 Face Anchor
                </button>
                <button className="secondary" onClick={() => setPage2Profile(createEmptyPage2Profile())}>
                  清空選項
                </button>
              </div>
            </div>
          </section>

          <section className="lock-panel page2-output-panel">
            <div className="control-section">
              <div className="control-section-header">
                <div className="control-section-title">角色摘要</div>
              </div>
              <div className="page2-output-card">
                {page2ProfileSummary || '尚未選擇角色特徵。'}
              </div>
            </div>

            <div className="control-section">
              <div className="control-section-header">
                <div className="control-section-title">Face Anchor</div>
              </div>
              <textarea
                className="text-input page2-prompt-textarea"
                value={page2ProfileAnchor}
                readOnly
                placeholder="選擇五官與妝容後，這裡會生成角色鎖臉用的短錨點。"
              />
              <p className="context-note">
                Page2 目前不會再直接干擾 PAGE1。這裡專門生成多視角鎖臉參考圖 prompt，方便你先做角色 reference。
              </p>
            </div>

            <div className="control-section">
              <div className="control-section-header">
                <div className="control-section-title">Reference Views</div>
              </div>
              <div className="library-editor-form">
                {page2ViewPrompts.map((item) => (
                  <label key={item.key} className="field">
                    <span>{item.label}</span>
                    <textarea
                      className="text-input page2-prompt-textarea"
                      value={item.prompt}
                      readOnly
                    />
                    <div className="inline-actions">
                      <button className="secondary" onClick={() => handleCopyText(`${item.label} 參考 prompt 已複製`, item.prompt)}>
                        複製 {item.label}
                      </button>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </section>
        </section>
      )}

      {copiedLabel ? <div className="toast">{copiedLabel}</div> : null}
    </div>
  );
}
const SUMMARY_REROLL_MAP = Object.fromEntries(
  Object.entries(REMIX_GROUP_INFO).map(([sectionKey, section]) => [sectionKey, section.keys])
);
