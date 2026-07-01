import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Page1Workspace from './components/Page1Workspace';
import Page2Workspace from './components/Page2Workspace';
import Page3Workspace from './components/Page3Workspace';
import PageSunoWorkspace from './components/PageSunoWorkspace';
import SavedCardsWorkspace from './components/SavedCardsWorkspace';
import {
  createEmptyLocks,
  generatePrompts,
  getCloseupAllowedKeys,
  getSceneDependentOptions,
  getLockControls,
  hasEffectiveWardrobeLocks,
  isCloseupModeFramingId,
  isWardrobeIncompatibleCloseupFramingId,
  isWormEyeAngleId,
  normalizeLocks,
  sanitizeLocksForCloseupMode
} from './lib/engine';
import {
  buildRandomSunoProfile,
  buildSunoSavedCard,
  buildSunoPromptBundle,
  buildSunoStylesPrompt,
  buildSunoSummary,
  coerceSunoProfile,
  createEmptySunoProfile,
} from './lib/suno';
import {
  PAGE3_WORLD_SCENE_FIELD_CONFIG,
  PAGE3_WORLD_SCENE_FIELD_OPTIONS,
  buildPage3WorldSceneAnchor,
  buildPage3WorldSceneCinematicPrompt,
  buildPage1WorldSceneArchitecture,
  buildPage3WorldScenePrompt,
  buildPage3WorldSceneSummary,
  buildPage3WorldSceneWorldPrompt,
  createEmptyPage3WorldSceneProfile,
} from './lib/page3WorldScene';
import {
  buildCharacterCardPromptBundle,
  buildCharacterCardSavedCard,
  buildPage1LocksFromCharacterCardVariant,
  createEmptyCharacterCardVariant,
  getCharacterCardOptions,
  normalizeCharacterCardVariant,
} from './lib/characterCardLab';
import { SCENE_CAMERA_CONTROL_ORDER } from './lib/page1ControlOrders';
import './index.css';

const PROMPTS_KEY = 'vps.prompts';
const FAVORITES_KEY = 'vps.favorites';
const LOCKS_KEY = 'vps.locks';
const VIEW_MODE_KEY = 'vps.viewMode';
const PAGE_MODE_KEY = 'vps.pageMode';
const PAGE2_PROFILE_KEY = 'vps.page2Profile';
const PAGE3_PROFILE_KEY = 'vps.page3Profile';
const PAGE5_PROFILE_KEY = 'vps.page5Profile';
const FAVORITES_STORAGE_VERSION = 2;
let favoriteCloudRepositoryPromise = null;
const STORAGE_BUDGETS = {
  [PROMPTS_KEY]: 2_250_000,
  [FAVORITES_KEY]: 2_250_000,
};
const STORAGE_PERSIST_DELAY_MS = 300;
const STORAGE_IDLE_TIMEOUT_MS = 1000;
const FAVORITES_CLOUD_SYNC_DELAY_MS = 900;
const FAVORITES_CLOUD_BATCH_SYNC_THRESHOLD = 25;
const PAGE_MODE_COPY = {
  page1: {
    title: 'Prompt Control Deck',
    subtitle: '一個為個人創作流程設計的虛擬攝影 Prompt 生成工具，支援快速組合、批次生成與風格探索。',
  },
  page2: {
    title: 'Character Card Lab',
    subtitle: '選擇內建角色卡，整理髮型變化、預設服裝 layer 與可複製的角色 reference prompt。',
  },
  page3: {
    title: 'World Street Scene Builder',
    subtitle: '建立全球經典街景、城市空景與高視角地景 prompt，專注真實地點錨點與攝影語言。',
  },
  page4: {
    title: 'Saved Cards',
    subtitle: '集中查看已加入最愛的 Prompt 版本，保留三種輸出內容與一鍵複製流程。',
  },
  page5: {
    title: 'SUNO Styles Builder',
    subtitle: '用結構化欄位快速組裝 SUNO 專用 music styles prompt，集中測試曲風、樂器、律動與人聲方向。',
  },
};

function loadFavoriteCloudRepository() {
  favoriteCloudRepositoryPromise ||= import('./lib/favoritesRepository');
  return favoriteCloudRepositoryPromise;
}

function createEmptyPage3Profile() {
  return createEmptyPage3WorldSceneProfile();
}
const CHARACTER_CONTROL_ORDER = [
  'subjectCount',
  'specialSubjectId',
  'characterProfileId',
  'bodyTypeId',
  'bodyTypeAId',
  'bodyTypeBId',
  'facialFeaturesId',
  'facialFeaturesAId',
  'facialFeaturesBId',
  'skinDetailsId',
  'skinDetailsAId',
  'skinDetailsBId',
  'hairstyleId',
  'hairstyleAId',
  'hairstyleBId',
  'hairColorId',
  'hairColorAId',
  'hairColorBId',
  'duoPoseId',
  'duoPoseBaseId',
  'duoExpressionId',
  'expressionId',
  'poseId',
  'specialActionId',
  'poseBaseId',
  'poseArrangementId',
  'poseHandId',
  'poseHeadId',
  'poseAnchorId',
];
const POSE_COMPOSER_KEYS = ['poseBaseId', 'poseArrangementId', 'poseHandId', 'poseHeadId', 'poseAnchorId'];
const STYLE_WARDROBE_CONTROL_ORDER = [
  'specialOutfitId',
  'specialOutfitAId',
  'specialOutfitBId',
  'completeLookPaletteId',
  'completeLookPaletteAId',
  'completeLookPaletteBId',
  'outfitPresetId',
  'outfitPresetPrimaryColorId',
  'outfitPresetContrastColorId',
  'outfitPresetLockedPaletteId',
  'outfitPresetAId',
  'outfitPresetAPrimaryColorId',
  'outfitPresetAContrastColorId',
  'outfitPresetALockedPaletteId',
  'outfitPresetBId',
  'outfitPresetBPrimaryColorId',
  'outfitPresetBContrastColorId',
  'outfitPresetBLockedPaletteId',
  'topId',
  'topAId',
  'topBId',
  'topFitId',
  'topFitAId',
  'topFitBId',
  'topStylingId',
  'topStylingAId',
  'topStylingBId',
  'dressId',
  'dressAId',
  'dressBId',
  'dressColorId',
  'dressAColorId',
  'dressBColorId',
  'pantsId',
  'pantsAId',
  'pantsBId',
  'skirtId',
  'skirtAId',
  'skirtBId',
  'bottomFitId',
  'bottomFitAId',
  'bottomFitBId',
  'bottomRiseId',
  'bottomRiseAId',
  'bottomRiseBId',
  'topBottomPaletteId',
  'topBottomPaletteAId',
  'topBottomPaletteBId',
  'topColorId',
  'topAColorId',
  'topBColorId',
  'topPatternId',
  'topAPatternId',
  'topBPatternId',
  'bottomColorId',
  'bottomAColorId',
  'bottomBColorId',
  'bottomPatternId',
  'bottomAPatternId',
  'bottomBPatternId',
  'outerwearId',
  'outerwearFitId',
  'outerwearColorId',
  'outerwearPatternId',
  'outerwearOpeningId',
  'outerwearStylingId',
  'legwearId',
  'legwearColorId',
  'shoesId',
  'shoesColorId',
  'outerwearAId',
  'outerwearAFitId',
  'outerwearAColorId',
  'outerwearAPatternId',
  'outerwearAOpeningId',
  'outerwearAStylingId',
  'legwearAId',
  'legwearAColorId',
  'shoesAId',
  'shoesAColorId',
  'outerwearBId',
  'outerwearBFitId',
  'outerwearBColorId',
  'outerwearBPatternId',
  'outerwearBOpeningId',
  'outerwearBStylingId',
  'legwearBId',
  'legwearBColorId',
  'shoesBId',
  'shoesBColorId',
  'headAccessoryId',
  'eyewearId',
  'earringsId',
  'neckAccessoryId',
  'headAccessoryAId',
  'eyewearAId',
  'earringsAId',
  'neckAccessoryAId',
  'headAccessoryBId',
  'eyewearBId',
  'earringsBId',
  'neckAccessoryBId',
  'wristAccessoryId',
  'ringId',
  'waistAccessoryId',
];

function sortControls(controls, order) {
  const orderMap = new Map(order.map((key, index) => [key, index]));
  return [...controls].sort((a, b) => (orderMap.get(a.key) ?? 999) - (orderMap.get(b.key) ?? 999));
}

function isNoneSelected(controlKey, value, controls) {
  if (!value) return false;
  const control = controls.find((item) => item.key === controlKey);
  if (!control) return true;
  const selected = control?.options.find((option) => option.id === value);
  if (!selected) return true;
  return selected.zh === '全無';
}

function buildMarkdownExport(data) {
  const labels = {
    midjourney: data.promptLabels?.midjourney || 'AI Prompt',
    grok: data.promptLabels?.grok || 'Gpt',
    zImage: data.promptLabels?.zImage || 'Grok/Z-Image',
  };
  const structured = data.structured && typeof data.structured === 'object' ? data.structured : {};
  const promptEntries = [
    { label: labels.midjourney, text: data.midjourneyPrompt },
    { label: labels.grok, text: data.grokPrompt },
    { label: labels.zImage, text: data.zImagePrompt },
  ].filter((entry) => entry.text);

  return `# Generated Prompt - ${new Date(data.date).toLocaleString()}
**Source:** ${data.sourceLabel || 'Prompt 工作台'}
**Summary:** ${data.summary}

${promptEntries.map((entry) => `## ${entry.label}
\`\`\`text
${entry.text}
\`\`\``).join('\n\n')}

---

## Structured Scheme
${Object.entries(structured)
  .map(([key, items]) => {
    const text = items.map((item) => `${item.en} (${item.zh})`).join(', ');
    return `* **${key}:** ${text || '-'}`;
  })
  .join('\n')}
`;
}

function parseSummaryFields(summary) {
  const text = String(summary || '');
  const labels = {
    style: '風格',
    character: '人物',
    wardrobe: '服裝',
    location: '場景',
    camera: '鏡頭',
    lighting: '光影',
  };

  return Object.fromEntries(
    Object.entries(labels).map(([key, label]) => {
      const match = text.match(new RegExp(`${label}：([^|]+)`));
      return [key, match ? match[1].trim() : '-'];
    })
  );
}

function buildImportedStructured(locks, controls) {
  const controlMap = new Map(controls.map((control) => [control.key, control]));
  const getOption = (key) => {
    const value = locks[key];
    if (!value) return null;
    const control = controlMap.get(key);
    return control?.options?.find((option) => option.id === value) || null;
  };
  const buildSection = (keys) => keys.map(getOption).filter(Boolean);

  return {
    Style: buildSection(['styleId']),
    Character: buildSection([
      'subjectCount',
      'specialSubjectId',
      'characterProfileId',
      'bodyTypeId',
      'bodyTypeAId',
      'bodyTypeBId',
      'facialFeaturesId',
      'facialFeaturesAId',
      'facialFeaturesBId',
      'skinDetailsId',
      'skinDetailsAId',
      'skinDetailsBId',
      'hairstyleId',
      'hairstyleAId',
      'hairstyleBId',
      'hairColorId',
      'hairColorAId',
      'hairColorBId',
      'duoPoseId',
      'duoPoseBaseId',
      'duoExpressionId',
      'expressionId',
      'poseId',
      'specialActionId',
      'poseBaseId',
      'poseArrangementId',
      'poseHandId',
      'poseHeadId',
      'poseAnchorId',
    ]),
    Wardrobe: buildSection([
      'outfitPresetId',
      'outfitPresetColorId',
      'outfitPresetAId',
      'outfitPresetAColorId',
      'outfitPresetBId',
      'outfitPresetBColorId',
      'topId',
      'topAId',
      'topBId',
      'topFitId',
      'topFitAId',
      'topFitBId',
      'topStylingId',
      'topStylingAId',
      'topStylingBId',
      'topBottomPaletteId',
      'topBottomPaletteAId',
      'topBottomPaletteBId',
      'topColorId',
      'topAColorId',
      'topBColorId',
      'topPatternId',
      'topAPatternId',
      'topBPatternId',
      'dressId',
      'dressAId',
      'dressBId',
      'dressColorId',
      'dressAColorId',
      'dressBColorId',
      'pantsId',
      'pantsAId',
      'pantsBId',
      'skirtId',
      'skirtAId',
      'skirtBId',
      'bottomFitId',
      'bottomFitAId',
      'bottomFitBId',
      'bottomRiseId',
      'bottomRiseAId',
      'bottomRiseBId',
      'bottomColorId',
      'bottomAColorId',
      'bottomBColorId',
      'bottomPatternId',
      'bottomAPatternId',
      'bottomBPatternId',
      'outerwearId',
      'outerwearFitId',
      'outerwearColorId',
      'outerwearPatternId',
      'outerwearOpeningId',
      'outerwearStylingId',
      'legwearId',
      'legwearColorId',
      'shoesId',
      'shoesColorId',
      'headAccessoryId',
      'eyewearId',
      'earringsId',
      'neckAccessoryId',
      'headAccessoryAId',
      'eyewearAId',
      'earringsAId',
      'neckAccessoryAId',
      'headAccessoryBId',
      'eyewearBId',
      'earringsBId',
      'neckAccessoryBId',
      'wristAccessoryId',
      'ringId',
      'waistAccessoryId',
    ]),
    Location: buildSection([
      'sceneAttributeId',
      'fixedCompositionSetId',
      'fixedSetPositionId',
      'fixedSetCaptureModeId',
      'fixedSetPerformanceStateId',
      'locationId',
    ]),
    Framing: buildSection(['framingId', 'angleId', 'orbitId', 'lensId']),
    Lighting: buildSection(['lightingId', 'lightDirectionId']),
    'Camera & Film': buildSection(['cameraSystemId', 'filmId', 'opticalEffectId']),
  };
}

function parseExportedMarkdownPrompt(markdownText, controls, fallbackId) {
  const text = String(markdownText || '').replace(/\r\n/g, '\n');
  const summaryMatch = text.match(/\*\*Summary:\*\*\s*(.+)/);
  const midjourneyMatch = text.match(/## (?:AI Prompt|Midjourney Prompt)\n```text\n([\s\S]*?)\n```/);
  const grokMatch = text.match(/## (?:Gpt|Grok Structured Prompt)\n```text\n([\s\S]*?)\n```/);
  const zImageMatch = text.match(/## (?:Grok\/Z-Image|Z-Image Prompt)\n```text\n([\s\S]*?)\n```/);

  if (!summaryMatch || !midjourneyMatch || !grokMatch) {
    throw new Error('missing required markdown sections');
  }

  const summary = summaryMatch[1].trim();
  const midjourneyPrompt = midjourneyMatch[1].trim();
  const grokPrompt = grokMatch[1].trim();
  const zImagePrompt = zImageMatch?.[1]?.trim() || '';
  const { locks: parsedLocks, matchedControls } = parseLocksFromStandardPrompt(`${midjourneyPrompt}\n${grokPrompt}\n${zImagePrompt}`, controls);

  if (matchedControls.length === 0) {
    throw new Error('no recoverable controls found in prompt');
  }

  const selection = buildRestoreLocks(parsedLocks, controls);
  const prompt = {
    id: fallbackId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    summary,
    summaryFields: parseSummaryFields(summary),
    midjourneyPrompt,
    grokPrompt,
    zImagePrompt,
    selection,
    structured: buildImportedStructured(selection, controls),
  };

  return {
    ...prompt,
    lineage: createLineage(prompt),
  };
}

function mergeFavoritePrompts(existingPrompts, importedPrompts) {
  const importedIds = new Set(importedPrompts.map((item) => item.id));
  const preservedExisting = existingPrompts.filter((item) => !importedIds.has(item.id));
  return [...importedPrompts, ...preservedExisting];
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

function buildAllNoneLocks(controls, currentLocks) {
  const nextLocks = createEmptyLocks();
  nextLocks.subjectCount = currentLocks.subjectCount || nextLocks.subjectCount;

  controls.forEach((control) => {
    if (control.key === 'subjectCount') return;
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

function compactPromptSelection(selection) {
  if (!selection || typeof selection !== 'object') return null;

  const normalized = normalizeLocks({ ...createEmptyLocks(), ...selection });
  return Object.fromEntries(
    Object.entries(normalized).filter(([key, value]) => {
      if (key === 'subjectCount' || key === 'aspectRatio') return true;
      if (key === 'specialSubjectId' && value === 'none') return false;
      if (key === 'characterProfileId' && value === 'none') return false;
      if (key === 'importedWorldSceneMode' && value === 'none') return false;
      if (key === 'topBottomPaletteId' && value === 'none') return false;
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    })
  );
}

function sanitizeStoredPrompt(prompt, controls = getLockControls()) {
  if (!prompt || typeof prompt !== 'object' || !prompt.id) return null;

  const source = String(prompt.source || 'page1');
  const rawSelection = prompt.selection && typeof prompt.selection === 'object'
    ? prompt.selection
    : null;
  const selection = source === 'page1' && rawSelection
    ? normalizeLocks({ ...createEmptyLocks(), ...rawSelection })
    : null;
  const summaryFields = prompt.summaryFields && typeof prompt.summaryFields === 'object'
    ? prompt.summaryFields
    : parseSummaryFields(prompt.summary);
  const structured = prompt.structured && typeof prompt.structured === 'object'
    ? prompt.structured
    : (selection ? buildImportedStructured(selection, controls) : {});

  return {
    id: prompt.id,
    source,
    sourceLabel: String(prompt.sourceLabel || ''),
    date: prompt.date || new Date().toISOString(),
    summary: String(prompt.summary || ''),
    summaryFields,
    midjourneyPrompt: String(prompt.midjourneyPrompt || ''),
    grokPrompt: String(prompt.grokPrompt || ''),
    zImagePrompt: String(prompt.zImagePrompt || ''),
    promptLabels: prompt.promptLabels && typeof prompt.promptLabels === 'object' ? prompt.promptLabels : null,
    selection,
    structured,
    profile: prompt.profile && typeof prompt.profile === 'object' ? prompt.profile : null,
    lineage: prompt.lineage && typeof prompt.lineage === 'object' ? prompt.lineage : null,
    remixMeta: prompt.remixMeta && typeof prompt.remixMeta === 'object' ? prompt.remixMeta : null,
  };
}

function sanitizeStoredPromptCollection(items) {
  if (!Array.isArray(items)) return [];
  return items.map(sanitizeStoredPrompt).filter(Boolean);
}

function serializeFavoritePrompt(prompt) {
  const sanitized = sanitizeStoredPrompt(prompt);
  if (!sanitized) return null;

  return {
    v: FAVORITES_STORAGE_VERSION,
    i: sanitized.id,
    o: sanitized.source,
    b: sanitized.sourceLabel,
    d: sanitized.date,
    s: sanitized.summary,
    m: sanitized.midjourneyPrompt,
    g: sanitized.grokPrompt,
    z: sanitized.zImagePrompt,
    y: sanitized.promptLabels,
    l: compactPromptSelection(sanitized.selection),
    p: sanitized.profile,
    n: sanitized.lineage,
    r: sanitized.remixMeta,
  };
}

function deserializeFavoritePrompt(record) {
  if (!record || typeof record !== 'object') return null;

  if (record.v === FAVORITES_STORAGE_VERSION && record.i) {
    return sanitizeStoredPrompt({
      id: record.i,
      source: record.o,
      sourceLabel: record.b,
      date: record.d,
      summary: record.s,
      midjourneyPrompt: record.m,
      grokPrompt: record.g,
      zImagePrompt: record.z,
      promptLabels: record.y,
      selection: record.l,
      profile: record.p,
      lineage: record.n,
      remixMeta: record.r,
    });
  }

  return sanitizeStoredPrompt(record);
}

function deserializeFavoritePromptCollection(items) {
  if (!Array.isArray(items)) return [];
  return items.map(deserializeFavoritePrompt).filter(Boolean);
}

function estimateStorageBytes(text) {
  return new Blob([text]).size;
}

function fitPromptsToStorageBudget(prompts, budget) {
  if (!budget) return prompts;

  const fitted = [];
  let bytesUsed = 2;

  for (const prompt of prompts) {
    const serializedPrompt = JSON.stringify(prompt);
    const nextBytes = estimateStorageBytes(serializedPrompt) + (fitted.length > 0 ? 1 : 0);
    if (bytesUsed + nextBytes > budget) break;
    fitted.push(prompt);
    bytesUsed += nextBytes;
  }

  return fitted;
}

function persistPromptCollection(key, prompts, serializer = sanitizeStoredPromptCollection) {
  if (typeof window === 'undefined') {
    return { truncatedCount: 0, failed: false };
  }

  const sanitized = serializer(prompts).filter(Boolean);
  let fitted = fitPromptsToStorageBudget(sanitized, STORAGE_BUDGETS[key]);

  while (fitted.length >= 0) {
    try {
      window.localStorage.setItem(key, JSON.stringify(fitted));
      return {
        truncatedCount: sanitized.length - fitted.length,
        failed: false,
      };
    } catch (error) {
      const isQuotaExceeded = error instanceof DOMException
        && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');

      if (!isQuotaExceeded || fitted.length === 0) {
        return {
          truncatedCount: sanitized.length,
          failed: true,
        };
      }

      fitted = fitted.slice(0, -1);
    }
  }

  return { truncatedCount: sanitized.length, failed: true };
}

function schedulePromptCollectionPersist(key, prompts, serializer, onResult) {
  if (typeof window === 'undefined') return () => {};

  let idleHandle = null;
  const timeoutId = window.setTimeout(() => {
    const persist = () => {
      idleHandle = null;
      onResult(persistPromptCollection(key, prompts, serializer));
    };

    if ('requestIdleCallback' in window) {
      idleHandle = window.requestIdleCallback(persist, { timeout: STORAGE_IDLE_TIMEOUT_MS });
      return;
    }

    idleHandle = window.setTimeout(persist, 0);
  }, STORAGE_PERSIST_DELAY_MS);

  return () => {
    window.clearTimeout(timeoutId);
    if (idleHandle === null) return;
    if ('cancelIdleCallback' in window) {
      window.cancelIdleCallback(idleHandle);
      return;
    }
    window.clearTimeout(idleHandle);
  };
}

function buildPage3SavedCard(profile, summary, anchor, prompt, cinematicPrompt, worldPrompt) {
  const safeSummary = summary || '尚未選擇場景條件';

  return {
    id: `page3-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: 'page3',
    sourceLabel: '場景建模',
    date: new Date().toISOString(),
    summary: `場景建模｜${safeSummary}`,
    summaryFields: {
      characterDna: '-',
      expressionPose: '-',
      wardrobe: '-',
      sceneLook: safeSummary,
    },
    midjourneyPrompt: prompt,
    grokPrompt: cinematicPrompt,
    zImagePrompt: worldPrompt,
    promptLabels: {
      midjourney: 'Scene Prompt',
      grok: 'Cinematic',
      zImage: 'World',
    },
    selection: null,
    structured: {
      'Page3 Scene': [
        {
          zh: safeSummary,
          en: anchor || 'scene profile anchor',
        },
      ],
    },
    profile: { ...profile },
  };
}

function loadFavoritePrompts() {
  if (typeof window === 'undefined') return [];

  const rawFavorites = loadJsonStorage(FAVORITES_KEY, []);
  if (!Array.isArray(rawFavorites) || rawFavorites.length === 0) return [];

  // New format: store full prompt objects directly.
  if (typeof rawFavorites[0] === 'object' && rawFavorites[0] !== null) {
    return deserializeFavoritePromptCollection(rawFavorites);
  }

  // Legacy format: store only ids, recover from prompt cache if possible.
  const promptCache = sanitizeStoredPromptCollection(loadJsonStorage(PROMPTS_KEY, []));
  if (!Array.isArray(promptCache)) return [];

  const idSet = new Set(rawFavorites.filter(Boolean));
  return promptCache.filter((item) => item?.id && idSet.has(item.id));
}

function normalizePromptText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function findBestOptionMatch(options, normalizedPrompt) {
  const candidates = [...(options || [])]
    .filter((option) => option?.id && option?.en && option.zh !== '全無')
    .sort((a, b) => b.en.length - a.en.length);

  return candidates.find((option) => normalizedPrompt.includes(normalizePromptText(option.en))) || null;
}

function parseLocksFromStandardPrompt(promptText, controls) {
  const normalizedPrompt = normalizePromptText(promptText);
  const nextLocks = createEmptyLocks();
  const matchedControls = [];

  if (!normalizedPrompt) {
    return { locks: nextLocks, matchedControls };
  }

  controls.forEach((control) => {
    const matchedOption = findBestOptionMatch(control.options, normalizedPrompt);
    if (!matchedOption) return;
    nextLocks[control.key] = matchedOption.id;
    matchedControls.push({
      key: control.key,
      label: control.label,
      option: matchedOption,
    });
  });

  return { locks: nextLocks, matchedControls };
}

function buildRestoreLocks(nextLocks, controls) {
  const restoredLocks = { ...createEmptyLocks(), ...nextLocks };

  controls.forEach((control) => {
    if (restoredLocks[control.key]) return;
    const noneOption = control.options?.find((option) => option.zh === '全無');
    if (noneOption) {
      restoredLocks[control.key] = noneOption.id;
    }
  });

  return restoredLocks;
}

export default function App() {
  const importFeedInputRef = useRef(null);
  const storageWarningRef = useRef('');
  const [prompts, setPrompts] = useState(() => sanitizeStoredPromptCollection(loadJsonStorage(PROMPTS_KEY, [])));
  const [favoritePrompts, setFavoritePrompts] = useState(() => loadFavoritePrompts());
  const [pageMode, setPageMode] = useState(() => loadStringStorage(PAGE_MODE_KEY, 'page1'));
  const [viewMode, setViewMode] = useState(() => loadStringStorage(VIEW_MODE_KEY, 'feed'));
  const [locks, setLocks] = useState(() => normalizeLocks(loadJsonStorage(LOCKS_KEY, createEmptyLocks())));
  const [previewGenerationNonce, setPreviewGenerationNonce] = useState(0);
  const activeLibrary = useMemo(() => [], []);
  const rawLockControls = useMemo(() => getLockControls(activeLibrary), [activeLibrary]);
  const hasWardrobeLocks = useMemo(() => hasEffectiveWardrobeLocks(locks, rawLockControls), [locks, rawLockControls]);
  const lockControls = useMemo(
    () => rawLockControls.map((control) => {
      if (control.key !== 'framingId' || !hasWardrobeLocks) return control;
      return {
        ...control,
        options: control.options.map((option) => ({
          ...option,
          disabled: isWardrobeIncompatibleCloseupFramingId(option.id, activeLibrary),
        })),
      };
    }),
    [activeLibrary, hasWardrobeLocks, rawLockControls]
  );
  const characterCards = useMemo(() => getCharacterCardOptions(lockControls), [lockControls]);
  const [page2Profile, setPage2Profile] = useState(() => (
    normalizeCharacterCardVariant(loadJsonStorage(PAGE2_PROFILE_KEY, createEmptyCharacterCardVariant(characterCards)), characterCards)
  ));
  const normalizedPage2Profile = useMemo(() => normalizeCharacterCardVariant(page2Profile, characterCards), [page2Profile, characterCards]);
  const page2PromptBundle = useMemo(() => buildCharacterCardPromptBundle(characterCards, normalizedPage2Profile), [characterCards, normalizedPage2Profile]);
  const [page3Profile, setPage3Profile] = useState(() => loadJsonStorage(PAGE3_PROFILE_KEY, createEmptyPage3Profile()));
  const [page5Profile, setPage5Profile] = useState(() => coerceSunoProfile(loadJsonStorage(PAGE5_PROFILE_KEY, createEmptySunoProfile())));
  const [copiedLabel, setCopiedLabel] = useState('');
  const [isImportPromptOpen, setIsImportPromptOpen] = useState(false);
  const [importPromptText, setImportPromptText] = useState('');
  const [favoriteCloudAuth, setFavoriteCloudAuth] = useState({ status: 'loading', user: null, error: null });
  const [favoriteCloudSyncStatus, setFavoriteCloudSyncStatus] = useState('local-only');
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const promptsRef = useRef(prompts);
  const favoritePromptsRef = useRef(favoritePrompts);
  const favoriteCloudAuthRef = useRef(favoriteCloudAuth);
  const favoriteCloudSyncReadyRef = useRef(false);
  const favoriteCloudMutationTimerRef = useRef(null);
  const favoriteCloudPendingMutationsRef = useRef({
    clear: false,
    upserts: new Map(),
    deletes: new Set(),
  });

  const showToast = useCallback((label) => {
    setCopiedLabel(label);
    window.setTimeout(() => setCopiedLabel(''), 1800);
  }, []);

  const showStorageWarning = useCallback((label) => {
    if (storageWarningRef.current === label) return;
    storageWarningRef.current = label;
    showToast(label);
  }, [showToast]);

  const clearStorageWarning = useCallback((channel) => {
    if (channel === 'prompts' && storageWarningRef.current.includes('Feed')) {
      storageWarningRef.current = '';
    }
    if (channel === 'favorites' && storageWarningRef.current.includes('Favorites')) {
      storageWarningRef.current = '';
    }
  }, []);

  useEffect(() => {
    promptsRef.current = prompts;
  }, [prompts]);

  useEffect(() => {
    favoritePromptsRef.current = favoritePrompts;
  }, [favoritePrompts]);

  useEffect(() => {
    favoriteCloudAuthRef.current = favoriteCloudAuth;
  }, [favoriteCloudAuth]);

  useEffect(() => () => {
    if (favoriteCloudMutationTimerRef.current) {
      window.clearTimeout(favoriteCloudMutationTimerRef.current);
    }
  }, []);

  const scheduleFavoriteCloudMutationFlush = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (favoriteCloudMutationTimerRef.current) {
      window.clearTimeout(favoriteCloudMutationTimerRef.current);
    }

    favoriteCloudMutationTimerRef.current = window.setTimeout(async () => {
      favoriteCloudMutationTimerRef.current = null;
      const currentAuth = favoriteCloudAuthRef.current;

      if (currentAuth.status !== 'signed-in' || !currentAuth.user) {
        favoriteCloudPendingMutationsRef.current = {
          clear: false,
          upserts: new Map(),
          deletes: new Set(),
        };
        return;
      }

      if (!favoriteCloudSyncReadyRef.current) {
        return;
      }

      const pending = favoriteCloudPendingMutationsRef.current;
      favoriteCloudPendingMutationsRef.current = {
        clear: false,
        upserts: new Map(),
        deletes: new Set(),
      };

      const upserts = [...pending.upserts.values()];
      const deletes = [...pending.deletes].filter((id) => !pending.upserts.has(id));
      if (!pending.clear && upserts.length === 0 && deletes.length === 0) {
        return;
      }

      setFavoriteCloudSyncStatus('saving');
      try {
        const {
          clearCloudFavorites,
          deleteCloudFavorite,
          saveCloudFavorite,
          saveCloudFavorites,
        } = await loadFavoriteCloudRepository();

        if (pending.clear) {
          await clearCloudFavorites(currentAuth.user.uid);
        }

        if (deletes.length > 0) {
          await Promise.all(deletes.map((favoriteId) => deleteCloudFavorite(currentAuth.user.uid, favoriteId)));
        }

        if (upserts.length >= FAVORITES_CLOUD_BATCH_SYNC_THRESHOLD) {
          await saveCloudFavorites(currentAuth.user.uid, upserts);
        } else {
          await Promise.all(upserts.map((favorite) => saveCloudFavorite(currentAuth.user.uid, favorite)));
        }

        setFavoriteCloudSyncStatus('synced');
      } catch (error) {
        console.error('Failed to sync cloud favorite mutations:', error);
        setFavoriteCloudSyncStatus('error');
        favoriteCloudPendingMutationsRef.current = {
          clear: pending.clear || favoriteCloudPendingMutationsRef.current.clear,
          upserts: new Map([...pending.upserts, ...favoriteCloudPendingMutationsRef.current.upserts]),
          deletes: new Set([...pending.deletes, ...favoriteCloudPendingMutationsRef.current.deletes]),
        };
        showToast('Firebase Favorites 同步失敗，已保留本機資料');
      }
    }, FAVORITES_CLOUD_SYNC_DELAY_MS);
  }, [showToast]);

  const queueFavoriteCloudUpsert = useCallback((prompt) => {
    const serializedFavorite = serializeFavoritePrompt(prompt);
    if (!serializedFavorite?.i) return;
    const pending = favoriteCloudPendingMutationsRef.current;
    if (!pending.clear) pending.deletes.delete(serializedFavorite.i);
    pending.upserts.set(serializedFavorite.i, serializedFavorite);
    scheduleFavoriteCloudMutationFlush();
  }, [scheduleFavoriteCloudMutationFlush]);

  const queueFavoriteCloudUpserts = useCallback((promptsToSync) => {
    const pending = favoriteCloudPendingMutationsRef.current;
    promptsToSync.forEach((prompt) => {
      const serializedFavorite = serializeFavoritePrompt(prompt);
      if (!serializedFavorite?.i) return;
      if (!pending.clear) pending.deletes.delete(serializedFavorite.i);
      pending.upserts.set(serializedFavorite.i, serializedFavorite);
    });
    scheduleFavoriteCloudMutationFlush();
  }, [scheduleFavoriteCloudMutationFlush]);

  const queueFavoriteCloudDelete = useCallback((favoriteId) => {
    if (!favoriteId) return;
    const pending = favoriteCloudPendingMutationsRef.current;
    pending.upserts.delete(favoriteId);
    if (!pending.clear) pending.deletes.add(favoriteId);
    scheduleFavoriteCloudMutationFlush();
  }, [scheduleFavoriteCloudMutationFlush]);

  const queueFavoriteCloudClear = useCallback(() => {
    favoriteCloudPendingMutationsRef.current = {
      clear: true,
      upserts: new Map(),
      deletes: new Set(),
    };
    scheduleFavoriteCloudMutationFlush();
  }, [scheduleFavoriteCloudMutationFlush]);

  const addFavoritePrompt = useCallback((prompt) => {
    setFavoritePrompts((prev) => [prompt, ...prev]);
    queueFavoriteCloudUpsert(prompt);
  }, [queueFavoriteCloudUpsert]);

  useEffect(() => {
    let isCancelled = false;
    let unsubscribe = () => {};

    loadFavoriteCloudRepository()
      .then(({ loadCloudFavorites, subscribeToFavoriteAuth }) => {
        if (isCancelled) return;

        unsubscribe = subscribeToFavoriteAuth((nextAuthState) => {
          favoriteCloudSyncReadyRef.current = false;
          setFavoriteCloudAuth(nextAuthState);

          if (nextAuthState.status !== 'signed-in' || !nextAuthState.user) {
            setFavoriteCloudSyncStatus(nextAuthState.status === 'disabled' ? 'disabled' : 'local-only');
            return;
          }

          setFavoriteCloudSyncStatus('loading');
          loadCloudFavorites(nextAuthState.user.uid)
            .then((cloudFavorites) => {
              if (isCancelled) return;
              const hydratedCloudFavorites = deserializeFavoritePromptCollection(cloudFavorites);
              const mergedFavorites = mergeFavoritePrompts(hydratedCloudFavorites, favoritePromptsRef.current);
              setFavoritePrompts(mergedFavorites);
              favoriteCloudSyncReadyRef.current = true;
              setFavoriteCloudSyncStatus('synced');
              if (mergedFavorites.length > hydratedCloudFavorites.length) {
                favoriteCloudPendingMutationsRef.current = {
                  clear: false,
                  upserts: new Map(
                    mergedFavorites
                      .map(serializeFavoritePrompt)
                      .filter(Boolean)
                      .map((favorite) => [favorite.i, favorite])
                  ),
                  deletes: new Set(),
                };
                scheduleFavoriteCloudMutationFlush();
              }
              const pending = favoriteCloudPendingMutationsRef.current;
              if (!pending.clear && (pending.upserts.size > 0 || pending.deletes.size > 0)) {
                scheduleFavoriteCloudMutationFlush();
              }
            })
            .catch((error) => {
              if (isCancelled) return;
              favoriteCloudSyncReadyRef.current = false;
              console.error('Failed to load cloud favorites:', error);
              setFavoriteCloudSyncStatus('error');
              showToast('Firebase Favorites 載入失敗，暫時使用本機資料');
            });
        });
      })
      .catch((error) => {
        if (isCancelled) return;
        favoriteCloudSyncReadyRef.current = false;
        console.error('Failed to initialize Firebase Favorites:', error);
        setFavoriteCloudAuth({ status: 'disabled', user: null, error: 'Firebase Favorites 無法初始化' });
        setFavoriteCloudSyncStatus('disabled');
      });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [scheduleFavoriteCloudMutationFlush, showToast]);

  useEffect(() => {
    return schedulePromptCollectionPersist(PROMPTS_KEY, prompts, sanitizeStoredPromptCollection, (result) => {
      if (result.failed) {
        showStorageWarning('提示：本機儲存空間已滿，新的 Feed 卡片這次無法完整保存。');
        return;
      }
      if (result.truncatedCount > 0) {
        showStorageWarning(`提示：為避免瀏覽器儲存爆滿，只保留最新 ${prompts.length - result.truncatedCount} 張 Feed 卡片到本機。`);
        return;
      }
      clearStorageWarning('prompts');
    });
  }, [clearStorageWarning, prompts, showStorageWarning]);

  useEffect(() => {
    return schedulePromptCollectionPersist(
      FAVORITES_KEY,
      favoritePrompts,
      (items) => items.map(serializeFavoritePrompt).filter(Boolean),
      (result) => {
        if (result.failed) {
          showStorageWarning('提示：本機儲存空間已滿，這次最愛變更無法完整保存，但畫面不會再白掉。');
          return;
        }
        if (result.truncatedCount > 0) {
          showStorageWarning(`提示：為避免瀏覽器儲存爆滿，只保留最新 ${favoritePrompts.length - result.truncatedCount} 張 Favorites 到本機。`);
          return;
        }
        clearStorageWarning('favorites');
      }
    );
  }, [clearStorageWarning, favoritePrompts, showStorageWarning]);

  useEffect(() => {
    const flushPromptCollections = () => {
      persistPromptCollection(PROMPTS_KEY, promptsRef.current);
      persistPromptCollection(FAVORITES_KEY, favoritePromptsRef.current, (items) =>
        items.map(serializeFavoritePrompt).filter(Boolean)
      );
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPromptCollections();
      }
    };

    window.addEventListener('pagehide', flushPromptCollections);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', flushPromptCollections);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [favoriteCloudAuth]);

  useEffect(() => {
    window.localStorage.setItem(LOCKS_KEY, JSON.stringify(locks));
  }, [locks]);

  useEffect(() => {
    window.localStorage.setItem(PAGE_MODE_KEY, pageMode);
  }, [pageMode]);

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    window.localStorage.setItem(PAGE2_PROFILE_KEY, JSON.stringify(page2Profile));
  }, [page2Profile]);

  useEffect(() => {
    window.localStorage.setItem(PAGE3_PROFILE_KEY, JSON.stringify(page3Profile));
  }, [page3Profile]);

  useEffect(() => {
    window.localStorage.setItem(PAGE5_PROFILE_KEY, JSON.stringify(page5Profile));
  }, [page5Profile]);

  const sceneDependentOptions = useMemo(() => getSceneDependentOptions(activeLibrary, locks), [activeLibrary, locks]);
  const isCloseupMode = useMemo(() => isCloseupModeFramingId(locks.framingId, activeLibrary), [locks.framingId, activeLibrary]);
  const isWormEyeAngle = useMemo(() => isWormEyeAngleId(locks.angleId, activeLibrary), [locks.angleId, activeLibrary]);
  const closeupAllowedKeys = useMemo(() => getCloseupAllowedKeys(locks.framingId, activeLibrary), [locks.framingId, activeLibrary]);
  const outfitPresetControl = useMemo(() => lockControls.find((control) => control.key === 'outfitPresetId') || null, [lockControls]);
  const outfitPresetAControl = useMemo(() => lockControls.find((control) => control.key === 'outfitPresetAId') || null, [lockControls]);
  const outfitPresetBControl = useMemo(() => lockControls.find((control) => control.key === 'outfitPresetBId') || null, [lockControls]);
  const selectedOutfitPreset = useMemo(
    () => outfitPresetControl?.options?.find((option) => option.id === locks.outfitPresetId) || null,
    [outfitPresetControl, locks.outfitPresetId]
  );
  const selectedOutfitPresetA = useMemo(
    () => outfitPresetAControl?.options?.find((option) => option.id === locks.outfitPresetAId) || null,
    [outfitPresetAControl, locks.outfitPresetAId]
  );
  const selectedOutfitPresetB = useMemo(
    () => outfitPresetBControl?.options?.find((option) => option.id === locks.outfitPresetBId) || null,
    [outfitPresetBControl, locks.outfitPresetBId]
  );
  const isActivePreset = (preset) => Boolean(preset && preset.zh !== '全無' && preset.en !== 'none');

  const getPresetColorMode = (preset) => preset?.meta?.colorMode || '';
  const hasLockedTargets = (preset) => Array.isArray(preset?.meta?.colorTargets?.locked) && preset.meta.colorTargets.locked.length > 0;

  const shouldShowPresetColorControl = useCallback((controlKey) => {
    const singleMode = getPresetColorMode(selectedOutfitPreset);
    const duoModeA = getPresetColorMode(selectedOutfitPresetA);
    const duoModeB = getPresetColorMode(selectedOutfitPresetB);

    if (controlKey === 'outfitPresetPrimaryColorId') return isActivePreset(selectedOutfitPreset);
    if (controlKey === 'outfitPresetContrastColorId') return singleMode === 'primary_contrast' || singleMode === 'primary_contrast_locked';
    if (controlKey === 'outfitPresetLockedPaletteId') return singleMode === 'primary_contrast_locked' && hasLockedTargets(selectedOutfitPreset);

    if (controlKey === 'outfitPresetAPrimaryColorId') return isActivePreset(selectedOutfitPresetA);
    if (controlKey === 'outfitPresetAContrastColorId') return duoModeA === 'primary_contrast' || duoModeA === 'primary_contrast_locked';
    if (controlKey === 'outfitPresetALockedPaletteId') return duoModeA === 'primary_contrast_locked' && hasLockedTargets(selectedOutfitPresetA);

    if (controlKey === 'outfitPresetBPrimaryColorId') return isActivePreset(selectedOutfitPresetB);
    if (controlKey === 'outfitPresetBContrastColorId') return duoModeB === 'primary_contrast' || duoModeB === 'primary_contrast_locked';
    if (controlKey === 'outfitPresetBLockedPaletteId') return duoModeB === 'primary_contrast_locked' && hasLockedTargets(selectedOutfitPresetB);

    return true;
  }, [selectedOutfitPreset, selectedOutfitPresetA, selectedOutfitPresetB]);
  const coreLockControls = useMemo(
    () => {
      const controlsWithSceneFiltering = lockControls.map((control) => {
        if (control.key === 'locationId') {
          return { ...control, options: sceneDependentOptions.locationOptions };
        }
        if (control.key === 'lightingId') {
          return { ...control, options: sceneDependentOptions.lightingOptions };
        }
        if (control.key === 'lightDirectionId') {
          return { ...control, options: sceneDependentOptions.lightDirectionOptions };
        }
        return control;
      });

      return sortControls(
        controlsWithSceneFiltering.filter((control) => SCENE_CAMERA_CONTROL_ORDER.includes(control.key)),
        SCENE_CAMERA_CONTROL_ORDER
      );
    },
    [lockControls, sceneDependentOptions]
  );
  const characterLockControls = useMemo(
    () => {
      const sceneAwareLockControls = lockControls.map((control) => {
        if (control.key !== 'poseAnchorId') return control;
        return {
          ...control,
          options: sceneDependentOptions.poseAnchorOptions || control.options,
        };
      });
      const specialSubjectControl = sceneAwareLockControls.find((control) => control.key === 'specialSubjectId');
      const selectedSpecialSubject = specialSubjectControl?.options?.find((option) => option.id === locks.specialSubjectId);
      const characterProfileControl = sceneAwareLockControls.find((control) => control.key === 'characterProfileId');
      const selectedCharacterProfile = characterProfileControl?.options?.find((option) => option.id === locks.characterProfileId);
      const isSpecialSubject = Boolean(selectedSpecialSubject?.specialSubject);
      const isCharacterProfile = Boolean(selectedCharacterProfile?.specialSubject);
      const isDedicatedSubject = isSpecialSubject || isCharacterProfile;
      const isAndroidSubject = selectedSpecialSubject?.specialSubject === 'android';

      return sortControls(
        sceneAwareLockControls.filter((control) => {
          if (isDedicatedSubject) {
            return [
              'specialSubjectId',
              'characterProfileId',
              'expressionId',
              'poseId',
              'specialActionId',
              ...POSE_COMPOSER_KEYS,
              ...(isAndroidSubject ? ['hairstyleId', 'hairColorId'] : []),
            ].includes(control.key);
          }
          if (!(control.section === 'character' || control.key === 'subjectCount')) return false;
          if (['specialSubjectId', 'characterProfileId'].includes(control.key)) return true;
          if (['duoPoseId', 'duoPoseBaseId', 'duoExpressionId'].includes(control.key) && locks.subjectCount !== '2') return false;
          if (control.key === 'specialActionId' && locks.subjectCount !== '1') return false;
          if (POSE_COMPOSER_KEYS.includes(control.key) && locks.subjectCount !== '1') return false;
          if (['bodyTypeId', 'facialFeaturesId', 'skinDetailsId', 'hairstyleId', 'hairColorId', 'expressionId', 'poseId'].includes(control.key) && locks.subjectCount === '2') return false;
          if (['bodyTypeAId', 'bodyTypeBId', 'facialFeaturesAId', 'facialFeaturesBId', 'skinDetailsAId', 'skinDetailsBId', 'hairstyleAId', 'hairstyleBId', 'hairColorAId', 'hairColorBId', 'duoPoseId', 'duoPoseBaseId', 'duoExpressionId'].includes(control.key) && locks.subjectCount !== '2') return false;
          return true;
        }),
        CHARACTER_CONTROL_ORDER
      );
    },
    [lockControls, locks.characterProfileId, locks.specialSubjectId, locks.subjectCount, sceneDependentOptions.poseAnchorOptions]
  );
  const wardrobeLockControls = useMemo(
    () => {
      const specialSubjectControl = lockControls.find((control) => control.key === 'specialSubjectId');
      const selectedSpecialSubject = specialSubjectControl?.options?.find((option) => option.id === locks.specialSubjectId);
      const isSpecialSubject = Boolean(selectedSpecialSubject?.specialSubject);

      return sortControls(
        lockControls.filter((control) => {
          if (isSpecialSubject) return false;
          const sharedGarmentKeys = [
            'topId', 'topFitId', 'topStylingId', 'topBottomPaletteId', 'topColorId', 'topPatternId',
            'dressId', 'dressColorId', 'pantsId', 'skirtId', 'bottomFitId', 'bottomRiseId', 'bottomColorId', 'bottomPatternId',
          ];
          const duoGarmentKeys = [
            'topAId', 'topBId', 'topFitAId', 'topFitBId', 'topStylingAId', 'topStylingBId',
            'topBottomPaletteAId', 'topBottomPaletteBId', 'topAColorId', 'topBColorId', 'topAPatternId', 'topBPatternId',
            'dressAId', 'dressBId', 'dressAColorId', 'dressBColorId',
            'pantsAId', 'pantsBId', 'skirtAId', 'skirtBId',
            'bottomFitAId', 'bottomFitBId', 'bottomRiseAId', 'bottomRiseBId',
            'bottomAColorId', 'bottomBColorId', 'bottomAPatternId', 'bottomBPatternId',
          ];
          const sharedLayerKeys = ['outerwearId', 'outerwearFitId', 'outerwearColorId', 'outerwearPatternId', 'outerwearOpeningId', 'outerwearStylingId', 'legwearId', 'legwearColorId', 'shoesId', 'shoesColorId'];
          const duoLayerKeys = ['outerwearAId', 'outerwearAFitId', 'outerwearAColorId', 'outerwearAPatternId', 'outerwearAOpeningId', 'outerwearAStylingId', 'legwearAId', 'legwearAColorId', 'shoesAId', 'shoesAColorId', 'outerwearBId', 'outerwearBFitId', 'outerwearBColorId', 'outerwearBPatternId', 'outerwearBOpeningId', 'outerwearBStylingId', 'legwearBId', 'legwearBColorId', 'shoesBId', 'shoesBColorId'];
          const sharedAccessoryKeys = ['headAccessoryId', 'eyewearId', 'earringsId', 'neckAccessoryId'];
          const duoAccessoryKeys = ['headAccessoryAId', 'eyewearAId', 'earringsAId', 'neckAccessoryAId', 'headAccessoryBId', 'eyewearBId', 'earringsBId', 'neckAccessoryBId'];
          if (control.section !== 'wardrobe') return false;
          const specialOutfitActive = locks.subjectCount === '2'
            ? (
                (Boolean(locks.specialOutfitAId) && !isNoneSelected('specialOutfitAId', locks.specialOutfitAId, lockControls)) ||
                (Boolean(locks.specialOutfitBId) && !isNoneSelected('specialOutfitBId', locks.specialOutfitBId, lockControls))
              )
            : Boolean(locks.specialOutfitId) && !isNoneSelected('specialOutfitId', locks.specialOutfitId, lockControls);
          const hasCompleteLookSingle = ['specialOutfitId', 'outfitPresetId', 'dressId']
            .some((key) => Boolean(locks[key]) && !isNoneSelected(key, locks[key], lockControls));
          const hasCompleteLookA = ['specialOutfitAId', 'outfitPresetAId', 'dressAId']
            .some((key) => Boolean(locks[key]) && !isNoneSelected(key, locks[key], lockControls));
          const hasCompleteLookB = ['specialOutfitBId', 'outfitPresetBId', 'dressBId']
            .some((key) => Boolean(locks[key]) && !isNoneSelected(key, locks[key], lockControls));
          if (['specialOutfitId', 'completeLookPaletteId'].includes(control.key) && locks.subjectCount === '2') return false;
          if (['specialOutfitAId', 'specialOutfitBId', 'completeLookPaletteAId', 'completeLookPaletteBId'].includes(control.key) && locks.subjectCount !== '2') return false;
          if (specialOutfitActive && !['specialOutfitId', 'specialOutfitAId', 'specialOutfitBId', 'completeLookPaletteId', 'completeLookPaletteAId', 'completeLookPaletteBId'].includes(control.key)) return false;
          if (control.key === 'completeLookPaletteId' && !hasCompleteLookSingle) return false;
          if (control.key === 'completeLookPaletteAId' && !hasCompleteLookA) return false;
          if (control.key === 'completeLookPaletteBId' && !hasCompleteLookB) return false;
          if (['outfitPresetId', 'completeLookPaletteId', 'outfitPresetPrimaryColorId', 'outfitPresetContrastColorId', 'outfitPresetLockedPaletteId'].includes(control.key) && locks.subjectCount === '2') return false;
          if (['outfitPresetAId', 'completeLookPaletteAId', 'outfitPresetAPrimaryColorId', 'outfitPresetAContrastColorId', 'outfitPresetALockedPaletteId', 'outfitPresetBId', 'completeLookPaletteBId', 'outfitPresetBPrimaryColorId', 'outfitPresetBContrastColorId', 'outfitPresetBLockedPaletteId'].includes(control.key) && locks.subjectCount !== '2') return false;
          if (sharedGarmentKeys.includes(control.key) && locks.subjectCount === '2') return false;
          if (duoGarmentKeys.includes(control.key) && locks.subjectCount !== '2') return false;
          if (sharedLayerKeys.includes(control.key) && locks.subjectCount === '2') return false;
          if (duoLayerKeys.includes(control.key) && locks.subjectCount !== '2') return false;
          if (sharedAccessoryKeys.includes(control.key) && locks.subjectCount === '2') return false;
          if (duoAccessoryKeys.includes(control.key) && locks.subjectCount !== '2') return false;
          if (control.key.startsWith('outfitPreset') && !control.key.endsWith('Id') && !shouldShowPresetColorControl(control.key)) return false;
          if (['outfitPresetPrimaryColorId', 'outfitPresetContrastColorId', 'outfitPresetLockedPaletteId', 'outfitPresetAPrimaryColorId', 'outfitPresetAContrastColorId', 'outfitPresetALockedPaletteId', 'outfitPresetBPrimaryColorId', 'outfitPresetBContrastColorId', 'outfitPresetBLockedPaletteId'].includes(control.key) && !shouldShowPresetColorControl(control.key)) return false;
          return true;
        }),
        STYLE_WARDROBE_CONTROL_ORDER
      );
    },
    [lockControls, locks, shouldShowPresetColorControl]
  );

  const isOutfitPresetActive = locks.subjectCount === '2'
    ? (
        (Boolean(locks.outfitPresetAId) && !isNoneSelected('outfitPresetAId', locks.outfitPresetAId, wardrobeLockControls)) ||
        (Boolean(locks.outfitPresetBId) && !isNoneSelected('outfitPresetBId', locks.outfitPresetBId, wardrobeLockControls))
      )
    : Boolean(locks.outfitPresetId) && !isNoneSelected('outfitPresetId', locks.outfitPresetId, wardrobeLockControls);

  const displayPrompts = useMemo(() => {
    const baseList = viewMode === 'favorites' ? favoritePrompts : prompts;
    return baseList;
  }, [favoritePrompts, prompts, viewMode]);
  const previewPrompt = useMemo(() => {
    const [prompt] = generatePrompts(1, locks, activeLibrary, { previewGenerationNonce });
    return prompt || null;
  }, [activeLibrary, locks, previewGenerationNonce]);
  const favoriteCloudLabel = useMemo(() => {
    if (favoriteCloudAuth?.status === 'signed-in') {
      if (favoriteCloudSyncStatus === 'loading') return 'Firebase 載入中';
      if (favoriteCloudSyncStatus === 'saving') return 'Firebase 同步中';
      if (favoriteCloudSyncStatus === 'error') return 'Firebase 同步失敗';
      return `Firebase 已同步：${favoriteCloudAuth.user.email}`;
    }
    if (favoriteCloudAuth?.status === 'unauthorized') return favoriteCloudAuth.error || 'Firebase 權限不足';
    if (favoriteCloudAuth?.status === 'disabled') return 'Firebase 尚未設定';
    return 'Favorites 僅存本機';
  }, [favoriteCloudAuth, favoriteCloudSyncStatus]);

  const page3FieldOptions = PAGE3_WORLD_SCENE_FIELD_OPTIONS;
  const page3Summary = useMemo(() => buildPage3WorldSceneSummary(page3Profile), [page3Profile]);
  const page3Anchor = useMemo(() => buildPage3WorldSceneAnchor(page3Profile), [page3Profile]);
  const page3Prompt = useMemo(() => buildPage3WorldScenePrompt(page3Profile), [page3Profile]);
  const page3CinematicPrompt = useMemo(() => buildPage3WorldSceneCinematicPrompt(page3Profile), [page3Profile]);
  const page3WorldPrompt = useMemo(() => buildPage3WorldSceneWorldPrompt(page3Profile), [page3Profile]);
  const normalizedPage5Profile = useMemo(() => coerceSunoProfile(page5Profile), [page5Profile]);
  const page5Summary = useMemo(() => buildSunoSummary(normalizedPage5Profile), [normalizedPage5Profile]);
  const page5StylesPrompt = useMemo(() => buildSunoStylesPrompt(normalizedPage5Profile), [normalizedPage5Profile]);
  const page5PromptBundle = useMemo(() => buildSunoPromptBundle(normalizedPage5Profile), [normalizedPage5Profile]);

  useEffect(() => {
    setLocks((prev) => {
      const sanitized = sanitizeLocksForCloseupMode(prev, lockControls);
      return JSON.stringify(prev) === JSON.stringify(sanitized) ? prev : sanitized;
    });
  }, [lockControls]);

  const updateLocks = useCallback((updater) => {
    setLocks((prev) => {
      const candidate = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      const next = sanitizeLocksForCloseupMode({ ...candidate }, lockControls);
      const nextSceneDependentOptions = getSceneDependentOptions(activeLibrary, next);
      const allowedLocationIds = new Set(nextSceneDependentOptions.locationOptions.map((option) => option.id));
      const allowedLightingIds = new Set(nextSceneDependentOptions.lightingOptions.map((option) => option.id));
      const allowedDirectionIds = new Set(nextSceneDependentOptions.lightDirectionOptions.map((option) => option.id));
      const allowedPoseAnchorIds = new Set((nextSceneDependentOptions.poseAnchorOptions || []).map((option) => option.id));

      if (next.locationId && !allowedLocationIds.has(next.locationId)) {
        next.locationId = '';
      }

      if (next.lightingId && !allowedLightingIds.has(next.lightingId)) {
        next.lightingId = '';
      }

      if (next.lightDirectionId && !allowedDirectionIds.has(next.lightDirectionId)) {
        next.lightDirectionId = '';
      }

      if (next.poseAnchorId && !allowedPoseAnchorIds.has(next.poseAnchorId)) {
        next.poseAnchorId = 'none';
      }

      const poseIsActive = Boolean(next.poseId) && !isNoneSelected('poseId', next.poseId, lockControls);
      const specialActionIsActive = Boolean(next.specialActionId) && !isNoneSelected('specialActionId', next.specialActionId, lockControls);
      const poseComposerIsActive = POSE_COMPOSER_KEYS.some((key) => Boolean(next[key]) && !isNoneSelected(key, next[key], lockControls));
      const specialSubjectIsActive = Boolean(next.specialSubjectId) && !isNoneSelected('specialSubjectId', next.specialSubjectId, lockControls);
      const characterProfileIsActive = Boolean(next.characterProfileId) && !isNoneSelected('characterProfileId', next.characterProfileId, lockControls);
      if (specialSubjectIsActive && characterProfileIsActive) {
        if (next.specialSubjectId !== prev.specialSubjectId) {
          next.characterProfileId = 'none';
        } else {
          next.specialSubjectId = 'none';
        }
      }
      if (specialSubjectIsActive || characterProfileIsActive) {
        next.subjectCount = '1';
      }
      if (poseIsActive && specialActionIsActive) {
        next.specialActionId = '';
      }
      if (poseComposerIsActive) {
        next.poseId = '';
        next.specialActionId = '';
      }

      const specialTopBottomPaletteIsActive = next.topBottomPaletteId && !isNoneSelected('topBottomPaletteId', next.topBottomPaletteId, lockControls);
      const specialTopBottomPaletteAIsActive = next.topBottomPaletteAId && !isNoneSelected('topBottomPaletteAId', next.topBottomPaletteAId, lockControls);
      const specialTopBottomPaletteBIsActive = next.topBottomPaletteBId && !isNoneSelected('topBottomPaletteBId', next.topBottomPaletteBId, lockControls);
      if (specialTopBottomPaletteIsActive) {
        next.topColorId = 'none';
        next.bottomColorId = 'none';
      }
      if (specialTopBottomPaletteAIsActive) {
        next.topAColorId = 'none';
        next.bottomAColorId = 'none';
      }
      if (specialTopBottomPaletteBIsActive) {
        next.topBColorId = 'none';
        next.bottomBColorId = 'none';
      }

      const specialOutfitIsActive = next.subjectCount === '2'
        ? (
            (Boolean(next.specialOutfitAId) && !isNoneSelected('specialOutfitAId', next.specialOutfitAId, lockControls)) ||
            (Boolean(next.specialOutfitBId) && !isNoneSelected('specialOutfitBId', next.specialOutfitBId, lockControls))
          )
        : Boolean(next.specialOutfitId) && !isNoneSelected('specialOutfitId', next.specialOutfitId, lockControls);
      if (specialOutfitIsActive) {
        lockControls.forEach((control) => {
          if (control.section !== 'wardrobe') return;
          if (['specialOutfitId', 'specialOutfitAId', 'specialOutfitBId'].includes(control.key)) return;
          const noneOption = control.options?.find((option) => option.zh === '全無');
          next[control.key] = noneOption ? noneOption.id : '';
        });
      }

      if (next.subjectCount !== '1') {
        next.specialActionId = '';
        POSE_COMPOSER_KEYS.forEach((key) => {
          next[key] = 'none';
        });
      }

      return next;
    });
  }, [activeLibrary, lockControls]);

  const handleGenerate = useCallback(() => {
    if (!previewPrompt) return;
    const nextPrompt = {
      ...previewPrompt,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
    };
    nextPrompt.lineage = createLineage(nextPrompt);
    addFavoritePrompt(nextPrompt);
    showToast('目前 Prompt 已加入我的最愛');
  }, [addFavoritePrompt, previewPrompt, showToast]);

  const handleRerollPreview = useCallback(() => {
    setPreviewGenerationNonce((prev) => prev + 1);
    showToast('已依目前設定重新隨機生成');
  }, [showToast]);

  const handleApplyPage3WorldSceneArchitecture = useCallback(() => {
    const architecture = buildPage1WorldSceneArchitecture(page3Profile);
    if (!architecture.text) {
      showToast('PAGE3 目前沒有可匯入的世界場景');
      return;
    }

    updateLocks((prev) => ({
      ...prev,
      locationId: '',
      fixedCompositionSetId: 'none',
      fixedSetPositionId: 'none',
      fixedSetCaptureModeId: 'photographer-shot',
      fixedSetPerformanceStateId: 'model-natural',
      importedWorldSceneMode: 'architecture',
      importedWorldSceneLabel: architecture.label,
      importedWorldSceneArchitectureText: architecture.text,
    }));
    showToast(`已套用 PAGE3 空景架構：${architecture.label}`);
  }, [page3Profile, showToast, updateLocks]);

  const handleApplyPreviewSelection = useCallback(() => {
    if (!previewPrompt?.selection) {
      showToast('目前沒有可回填的預覽選項');
      return;
    }
    const restoredLocks = buildRestoreLocks(previewPrompt.selection, lockControls);
    updateLocks(() => normalizeLocks(restoredLocks));
    showToast('已將目前預覽回填到所有選項');
  }, [lockControls, previewPrompt, showToast, updateLocks]);

  const handleApplySavedCardSelection = useCallback((prompt) => {
    if (!prompt?.selection) {
      showToast('這張卡片沒有可回填的選項設定');
      return;
    }

    const restoredLocks = buildRestoreLocks(prompt.selection, lockControls);
    updateLocks(() => normalizeLocks(restoredLocks));
    setPageMode('page1');
    showToast('已套用收藏卡片的預覽選項');
  }, [lockControls, showToast, updateLocks]);

  const handleDeletePrompt = useCallback((prompt) => {
    setPrompts((prev) => prev.filter((item) => item.id !== prompt.id));
    setFavoritePrompts((prev) => prev.filter((item) => item.id !== prompt.id));
    queueFavoriteCloudDelete(prompt.id);
  }, [queueFavoriteCloudDelete]);

  const handleDownloadAll = (items = displayPrompts) => {
    if (items.length === 0) return;
    const zip = new JSZip();
    items.forEach((data) => {
      zip.file(`prompt_${data.id}.md`, buildMarkdownExport(data));
    });
    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, `virtual_photography_prompts_${Date.now()}.zip`);
    });
  };

  const handleClearFavorites = () => {
    setFavoritePrompts([]);
    queueFavoriteCloudClear();
    showToast('Favorites 已清空');
  };

  const handleSignInFavorites = useCallback(async () => {
    try {
      const { signInToFavorites } = await loadFavoriteCloudRepository();
      await signInToFavorites();
      setIsSettingsMenuOpen(false);
    } catch (error) {
      console.error('Firebase sign-in failed:', error);
      showToast('Firebase 登入失敗，請稍後再試');
    }
  }, [showToast]);

  const handleSignOutFavorites = useCallback(async () => {
    try {
      const { signOutFromFavorites } = await loadFavoriteCloudRepository();
      await signOutFromFavorites();
      setIsSettingsMenuOpen(false);
      showToast('Firebase 已登出，Favorites 改用本機保存');
    } catch (error) {
      console.error('Firebase sign-out failed:', error);
      showToast('Firebase 登出失敗，請稍後再試');
    }
  }, [showToast]);

  const handleOpenImportFeed = () => {
    importFeedInputRef.current?.click();
  };

  const handleImportFeed = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const zip = await JSZip.loadAsync(file);
      const markdownEntries = Object.values(zip.files)
        .filter((entry) => !entry.dir && entry.name.toLowerCase().endsWith('.md'))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (markdownEntries.length === 0) {
        throw new Error('zip does not contain exported markdown prompts');
      }

      const importedPrompts = [];
      for (const entry of markdownEntries) {
        const markdown = await entry.async('string');
        const idMatch = entry.name.match(/prompt_(.+)\.md$/i);
        const fallbackId = idMatch?.[1] || `${Date.now()}-${importedPrompts.length}`;
        importedPrompts.push(parseExportedMarkdownPrompt(markdown, lockControls, fallbackId));
      }

      setFavoritePrompts((prev) => mergeFavoritePrompts(prev, importedPrompts));
      queueFavoriteCloudUpserts(importedPrompts);
      setViewMode('favorites');
      showToast(`已匯入 ${importedPrompts.length} 張最愛卡片`);
    } catch {
      showToast('ZIP 格式錯誤，無法匯入 Favorites');
    }
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

  const applyLocksToConsole = useCallback((nextLocks, successLabel) => {
    const restoredLocks = buildRestoreLocks(nextLocks, lockControls);
    updateLocks(() => normalizeLocks(restoredLocks));
    setPageMode('page1');
    showToast(successLabel);
  }, [lockControls, showToast, updateLocks]);

  const handleApplyImportedPrompt = () => {
    const { locks: parsedLocks, matchedControls } = parseLocksFromStandardPrompt(importPromptText, lockControls);
    if (matchedControls.length === 0) {
      showToast('沒有解析到可回填的標準欄位');
      return;
    }
    applyLocksToConsole(parsedLocks, `已回填 ${matchedControls.length} 個欄位到主控台`);
    setIsImportPromptOpen(false);
    setImportPromptText('');
  };

  const handleApplyPage2CharacterCard = useCallback(() => {
    const nextLocks = buildPage1LocksFromCharacterCardVariant(locks, normalizedPage2Profile, characterCards);
    updateLocks(() => normalizeLocks(nextLocks));
    setPageMode('page1');
    showToast('角色卡設定已匯回 PAGE1');
  }, [characterCards, locks, normalizedPage2Profile, showToast, updateLocks]);

  const handleSavePage2Card = useCallback(() => {
    if (!page2PromptBundle.outputs.length) {
      showToast('請先選擇角色卡再加入 Saved Cards');
      return;
    }

    const nextCard = buildCharacterCardSavedCard(characterCards, normalizedPage2Profile, page2PromptBundle);
    addFavoritePrompt(nextCard);
    setViewMode('favorites');
    setPageMode('page4');
    showToast('角色卡 Prompt 已加入 Saved Cards');
  }, [addFavoritePrompt, characterCards, normalizedPage2Profile, page2PromptBundle, showToast]);

  const handleSavePage3Card = useCallback(() => {
    if (!page3Prompt) {
      showToast('請先完成場景設定再加入 Saved Cards');
      return;
    }

    const nextCard = buildPage3SavedCard(
      page3Profile,
      page3Summary,
      page3Anchor,
      page3Prompt,
      page3CinematicPrompt,
      page3WorldPrompt
    );
    addFavoritePrompt(nextCard);
    setViewMode('favorites');
    setPageMode('page4');
    showToast('場景建模 Prompt 已加入 Saved Cards');
  }, [addFavoritePrompt, page3Anchor, page3CinematicPrompt, page3Profile, page3Prompt, page3Summary, page3WorldPrompt, showToast]);

  const handleRandomizePage5Profile = useCallback(() => {
    setPage5Profile(buildRandomSunoProfile());
    showToast('已生成一組新的 SUNO 風格組合');
  }, [showToast]);

  const handleSavePage5Card = useCallback(() => {
    if (!page5StylesPrompt) {
      showToast('請先完成 SUNO 風格設定再加入 Saved Cards');
      return;
    }

    const nextCard = buildSunoSavedCard(normalizedPage5Profile);
    addFavoritePrompt(nextCard);
    setViewMode('favorites');
    setPageMode('page4');
    showToast('SUNO Styles Prompt 已加入 Saved Cards');
  }, [addFavoritePrompt, normalizedPage5Profile, page5StylesPrompt, showToast]);
  const pageHeaderCopy = PAGE_MODE_COPY[pageMode] || PAGE_MODE_COPY.page1;

  return (
    <div className="container">
      <header className="page-header">
        <div className="page-header-content">
          <p className="eyebrow">Virtual Photography Studio</p>
          <h1>{pageHeaderCopy.title}</h1>
          <p className="subtitle">{pageHeaderCopy.subtitle}</p>
          <div className="page-header-toolbar">
            <div className="page-mode-switch" role="tablist" aria-label="Page mode switch">
              <button
                type="button"
                className={pageMode === 'page1' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
                onClick={() => setPageMode('page1')}
              >
                Prompt 工作台
              </button>
              <button
                type="button"
                className={pageMode === 'page2' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
                onClick={() => setPageMode('page2')}
              >
                角色建模
              </button>
              <button
                type="button"
                className={pageMode === 'page3' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
                onClick={() => setPageMode('page3')}
              >
                場景建模
              </button>
              <button
                type="button"
                className={pageMode === 'page5' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
                onClick={() => setPageMode('page5')}
              >
                SUNO
              </button>
              <button
                type="button"
                className={pageMode === 'page4' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
                onClick={() => setPageMode('page4')}
              >
                Saved Cards
              </button>
            </div>

            <div className="site-settings">
              <button
                type="button"
                className="settings-trigger"
                aria-label="Open settings"
                aria-expanded={isSettingsMenuOpen}
                onClick={() => setIsSettingsMenuOpen((prev) => !prev)}
              >
                設置
              </button>
              {isSettingsMenuOpen ? (
                <div className="settings-menu">
                  <div className="settings-menu-title">Settings</div>
                  <div className={`settings-menu-status sync-status-${favoriteCloudSyncStatus}`}>
                    {favoriteCloudLabel}
                  </div>
                  {favoriteCloudAuth?.status === 'signed-in' ? (
                    <button className="secondary" onClick={handleSignOutFavorites}>
                      Sign Out Firebase
                    </button>
                  ) : (
                    <button className="secondary" onClick={handleSignInFavorites} disabled={favoriteCloudAuth?.status === 'disabled'}>
                      Sign In Firebase
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {pageMode === 'page1' ? (
        <Page1Workspace
          coreLockControls={coreLockControls}
          characterLockControls={characterLockControls}
          wardrobeLockControls={wardrobeLockControls}
          locks={locks}
          isCloseupMode={isCloseupMode}
          isWormEyeAngle={isWormEyeAngle}
          closeupAllowedKeys={closeupAllowedKeys}
          isNoneSelected={isNoneSelected}
          updateLocks={updateLocks}
          handleCopyText={handleCopyText}
          isOutfitPresetActive={isOutfitPresetActive}
          handleGenerate={handleGenerate}
          handleRerollPreview={handleRerollPreview}
          handleApplyPreviewSelection={handleApplyPreviewSelection}
          createEmptyLocks={createEmptyLocks}
          buildAllNoneLocks={buildAllNoneLocks}
          lockControls={lockControls}
          previewPrompt={previewPrompt}
          isImportPromptOpen={isImportPromptOpen}
          setIsImportPromptOpen={setIsImportPromptOpen}
          importPromptText={importPromptText}
          setImportPromptText={setImportPromptText}
          handleApplyImportedPrompt={handleApplyImportedPrompt}
          onApplyPage3WorldSceneArchitecture={handleApplyPage3WorldSceneArchitecture}
        />
      ) : pageMode === 'page2' ? (
        <Page2Workspace
          characterCards={characterCards}
          profile={normalizedPage2Profile}
          setProfile={setPage2Profile}
          promptBundle={page2PromptBundle}
          onCopyText={handleCopyText}
          onSaveCard={handleSavePage2Card}
          onApplyToPage1={handleApplyPage2CharacterCard}
        />
      ) : pageMode === 'page3' ? (
        <Page3Workspace
          fieldConfig={PAGE3_WORLD_SCENE_FIELD_CONFIG}
          fieldOptions={page3FieldOptions}
          profile={page3Profile}
          setProfile={setPage3Profile}
          summary={page3Summary}
          anchor={page3Anchor}
          prompt={page3Prompt}
          cinematicPrompt={page3CinematicPrompt}
          worldPrompt={page3WorldPrompt}
          onCopyText={handleCopyText}
          onSaveCard={handleSavePage3Card}
          createEmptyProfile={createEmptyPage3Profile}
        />
      ) : pageMode === 'page5' ? (
        <PageSunoWorkspace
          profile={normalizedPage5Profile}
          setProfile={setPage5Profile}
          summary={page5Summary}
          stylesPrompt={page5StylesPrompt}
          promptBundle={page5PromptBundle}
          onCopyText={handleCopyText}
          onSaveCard={handleSavePage5Card}
          onRandomize={handleRandomizePage5Profile}
          onNotice={showToast}
          createEmptyProfile={createEmptySunoProfile}
        />
      ) : (
        <SavedCardsWorkspace
          prompts={prompts}
          setPrompts={setPrompts}
          viewMode={viewMode}
          setViewMode={setViewMode}
          favoritePrompts={favoritePrompts}
          displayPrompts={displayPrompts}
          handleDownloadAll={handleDownloadAll}
          handleClearFavorites={handleClearFavorites}
          importFeedInputRef={importFeedInputRef}
          handleOpenImportFeed={handleOpenImportFeed}
          handleImportFeed={handleImportFeed}
          handleDeletePrompt={handleDeletePrompt}
          handleApplySavedCardSelection={handleApplySavedCardSelection}
        />
      )}

      {copiedLabel ? <div className="toast">{copiedLabel}</div> : null}
    </div>
  );
}
