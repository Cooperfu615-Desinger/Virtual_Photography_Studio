import {
  createEmptyLocks,
  getLockControls,
  normalizeLocks,
} from '../../lib/engine.js';
import { ACTION_POSE_CARDS, buildActionPoseSavedCard } from '../../lib/actionPoseLab.js';

export const FAVORITES_STORAGE_VERSION = 3;

const STRUCTURED_CONTROL_KEYS = {
  Style: ['imageTypePresetId', 'styleId'],
  Character: [
    'subjectCount', 'specialSubjectId', 'characterProfileId',
    'bodyTypeId', 'bodyTypeAId', 'bodyTypeBId',
    'facialFeaturesId', 'facialFeaturesAId', 'facialFeaturesBId',
    'skinDetailsId', 'skinDetailsAId', 'skinDetailsBId',
    'hairstyleId', 'hairstyleAId', 'hairstyleBId',
    'hairColorId', 'hairColorAId', 'hairColorBId',
    'duoPoseId', 'duoPoseBaseId', 'duoExpressionId', 'expressionId',
    'poseBaseId', 'poseArrangementId', 'poseHandId', 'poseHeadId', 'poseAnchorId',
  ],
  Wardrobe: [
    'outfitPresetId', 'outfitPresetColorId',
    'outfitPresetAId', 'outfitPresetAColorId',
    'outfitPresetBId', 'outfitPresetBColorId',
    'topId', 'topAId', 'topBId',
    'topFitId', 'topFitAId', 'topFitBId',
    'topStylingId', 'topStylingAId', 'topStylingBId',
    'topBottomPaletteId', 'topBottomPaletteAId', 'topBottomPaletteBId',
    'topColorId', 'topAColorId', 'topBColorId',
    'topPatternId', 'topAPatternId', 'topBPatternId',
    'dressId', 'dressAId', 'dressBId',
    'dressColorId', 'dressAColorId', 'dressBColorId',
    'pantsId', 'pantsAId', 'pantsBId',
    'skirtId', 'skirtAId', 'skirtBId',
    'bottomFitId', 'bottomFitAId', 'bottomFitBId',
    'bottomRiseId', 'bottomRiseAId', 'bottomRiseBId',
    'bottomColorId', 'bottomAColorId', 'bottomBColorId',
    'bottomPatternId', 'bottomAPatternId', 'bottomBPatternId',
    'outerwearId', 'outerwearFitId', 'outerwearColorId', 'outerwearPatternId',
    'outerwearOpeningId', 'outerwearStylingId', 'legwearId', 'legwearColorId',
    'shoesId', 'shoesColorId',
    'headAccessoryId', 'eyewearId', 'earringsId', 'neckAccessoryId',
    'headAccessoryAId', 'eyewearAId', 'earringsAId', 'neckAccessoryAId',
    'headAccessoryBId', 'eyewearBId', 'earringsBId', 'neckAccessoryBId',
    'wristAccessoryId', 'ringId', 'waistAccessoryId',
  ],
  Location: [
    'sceneAttributeId', 'fixedCompositionSetId', 'fixedSetPositionId',
    'fixedSetCaptureModeId', 'fixedSetPerformanceStateId', 'locationId',
  ],
  Framing: ['framingId', 'angleId', 'orbitId', 'lensId'],
  Lighting: ['lightingId', 'lightDirectionId'],
  'Camera & Film': ['cameraSystemId', 'filmId', 'opticalEffectId'],
};

export function buildMarkdownExport(data) {
  const labels = {
    midjourney: data.promptLabels?.midjourney || 'AI Prompt',
    grok: data.promptLabels?.grok || 'Gpt',
    zImage: data.promptLabels?.zImage || 'Grok/Z-Image',
  };
  const structured = data.structured && typeof data.structured === 'object' ? data.structured : {};
  const extraPromptEntries = Array.isArray(data.extraPrompts)
    ? data.extraPrompts.map((entry) => ({ label: entry.label, text: entry.text }))
    : [];
  const promptEntries = [
    { label: labels.midjourney, text: data.midjourneyPrompt },
    { label: labels.grok, text: data.grokPrompt },
    { label: labels.zImage, text: data.zImagePrompt },
    ...extraPromptEntries,
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

const STRUCTURED_TAG_CATEGORIES = {
  Style: '風格',
  Character: '主體',
  Wardrobe: '服裝',
  Location: '場景',
  Framing: '構圖',
  Lighting: '光影',
  'Lens & Imaging': '鏡頭',
  'Camera & Film': '鏡頭',
  'Action Pose': '動作',
  'Negative Pose Guard': '動作',
  'Framing Hint': '構圖',
  'Page3 Scene': '場景',
};

const SOURCE_TAG_CATEGORIES = {
  page1: '來源',
  page2: '角色',
  page3: '場景',
  actionPose: '動作',
};

const MANIFEST_SUMMARY_KEYS = ['style', 'character', 'wardrobe', 'location', 'camera', 'lighting'];

const MANIFEST_SUMMARY_ALIASES = {
  style: ['style'],
  character: ['character', 'characterDna'],
  wardrobe: ['wardrobe'],
  location: ['location', 'sceneLook'],
  camera: ['camera'],
  lighting: ['lighting'],
};

function humanizeTagId(tagId) {
  const text = String(tagId || '').trim();
  if (!text) return '';
  if (/[^a-z0-9_-]/i.test(text)) return text;
  return text
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : '')
    .join(' ');
}

function normalizeManifestValue(value) {
  const text = String(value ?? '').trim();
  return text === '-' || text === '全無' ? '' : text;
}

function getSourceTagCategory(source) {
  return SOURCE_TAG_CATEGORIES[source] || '來源';
}

function normalizeSourceTag(tag, category = '來源') {
  if (typeof tag === 'string') {
    const id = tag.trim();
    return id ? { id, category, label: humanizeTagId(id) || id } : null;
  }
  if (!tag || typeof tag !== 'object') return null;

  const id = String(tag.id || tag.key || tag.label || tag.zh || '').trim();
  if (!id) return null;
  return {
    id,
    category: String(tag.category || category || '來源').trim() || '來源',
    label: String(tag.label || tag.zh || humanizeTagId(id) || id).trim() || id,
  };
}

export function collectSourceTags(data) {
  const tags = [];
  const seenTagIds = new Set();
  const sourceCategory = getSourceTagCategory(data?.source);
  const addTag = (tag, category) => {
    const normalized = normalizeSourceTag(tag, category);
    if (!normalized || ['none', 'random'].includes(normalized.id)) return;
    if (seenTagIds.has(normalized.id)) return;
    seenTagIds.add(normalized.id);
    tags.push(normalized);
  };

  (Array.isArray(data?.sourceTags) ? data.sourceTags : []).forEach((tag) => addTag(tag, tag?.category || sourceCategory));
  (Array.isArray(data?.tags) ? data.tags : []).forEach((tag) => addTag(tag, tag?.category || sourceCategory));

  Object.entries(data?.structured || {}).forEach(([section, items]) => {
    const category = STRUCTURED_TAG_CATEGORIES[section] || section;
    (Array.isArray(items) ? items : []).forEach((item) => {
      (Array.isArray(item?.meta?.tags) ? item.meta.tags : []).forEach((tag) => addTag(tag, category));
    });
  });

  return tags;
}

export function normalizeManifestSummaryFields(data) {
  const sourceFields = data?.summaryFields && typeof data.summaryFields === 'object'
    ? data.summaryFields
    : {};
  const parsedFields = parseSummaryFields(data?.summary);

  return Object.fromEntries(MANIFEST_SUMMARY_KEYS.map((key) => {
    const value = MANIFEST_SUMMARY_ALIASES[key]
      .map((alias) => sourceFields[alias])
      .concat(parsedFields[key])
      .map(normalizeManifestValue)
      .find(Boolean) || '';
    return [key, value];
  }));
}

export function buildSavedCardManifestItem(data, file) {
  return {
    sourceId: String(data?.id || ''),
    file: String(file || ''),
    title: String(data?.title || data?.summary || data?.sourceLabel || '').trim(),
    source: String(data?.source || 'page1'),
    sourceLabel: String(data?.sourceLabel || 'Prompt 工作台'),
    summary: String(data?.summary || ''),
    summaryFields: normalizeManifestSummaryFields(data),
    tags: collectSourceTags(data),
  };
}

export function parseSummaryFields(summary) {
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

export function buildImportedStructured(locks, controls) {
  const controlMap = new Map(controls.map((control) => [control.key, control]));
  const getOption = (key) => {
    const value = locks[key];
    if (!value) return null;
    return controlMap.get(key)?.options?.find((option) => option.id === value) || null;
  };

  return Object.fromEntries(
    Object.entries(STRUCTURED_CONTROL_KEYS).map(([section, keys]) => [
      section,
      keys.map(getOption).filter(Boolean),
    ])
  );
}

export function normalizePromptText(text) {
  return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function findBestOptionMatch(options, normalizedPrompt) {
  return [...(options || [])]
    .filter((option) => option?.id && option?.en && option.zh !== '全無')
    .sort((a, b) => b.en.length - a.en.length)
    .find((option) => normalizedPrompt.includes(normalizePromptText(option.en))) || null;
}

export function parseLocksFromStandardPrompt(promptText, controls) {
  const normalizedPrompt = normalizePromptText(promptText);
  const locks = createEmptyLocks();
  const matchedControls = [];

  if (!normalizedPrompt) return { locks, matchedControls };

  controls.forEach((control) => {
    const option = findBestOptionMatch(control.options, normalizedPrompt);
    if (!option) return;
    locks[control.key] = option.id;
    matchedControls.push({ key: control.key, label: control.label, option });
  });

  return { locks, matchedControls };
}

export function buildRestoreLocks(nextLocks, controls) {
  const restoredLocks = { ...createEmptyLocks(), ...nextLocks };

  controls.forEach((control) => {
    if (restoredLocks[control.key]) return;
    const noneOption = control.options?.find((option) => option.zh === '全無');
    if (noneOption) restoredLocks[control.key] = noneOption.id;
  });

  return restoredLocks;
}

export function mergeFavoritePrompts(existingPrompts, importedPrompts) {
  const importedIds = new Set(importedPrompts.map((item) => item.id));
  return [
    ...importedPrompts,
    ...existingPrompts.filter((item) => !importedIds.has(item.id)),
  ];
}

export function toShortPromptId(id) {
  return `#${String(id).slice(-6).toUpperCase()}`;
}

export function createLineage(prompt) {
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

export function parseExportedMarkdownPrompt(markdownText, controls, fallbackId) {
  const text = String(markdownText || '').replace(/\r\n/g, '\n');
  const sourceMatch = text.match(/\*\*Source:\*\*\s*(.+)/);
  const summaryMatch = text.match(/\*\*Summary:\*\*\s*(.+)/);
  const actionPromptMatch = text.match(/## Action Prompt\n```text\n([\s\S]*?)\n```/);

  if (actionPromptMatch && /動作姿勢|Action Pose/i.test(sourceMatch?.[1] || text)) {
    const actionPrompt = actionPromptMatch[1].trim();
    const matchedCard = ACTION_POSE_CARDS.find((card) => (
      normalizePromptText(card.actionPrompt) === normalizePromptText(actionPrompt)
    ));
    if (!matchedCard) throw new Error('unknown action pose card');

    const prompt = buildActionPoseSavedCard({ mode: matchedCard.mode, selectedCardId: matchedCard.id });
    if (!prompt) throw new Error('invalid action pose card');
    const importedPrompt = {
      ...prompt,
      id: fallbackId || prompt.id,
      date: new Date().toISOString(),
      summary: summaryMatch?.[1]?.trim() || prompt.summary,
    };
    return { ...importedPrompt, lineage: createLineage(importedPrompt) };
  }

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
  const parsed = parseLocksFromStandardPrompt(
    `${midjourneyPrompt}\n${grokPrompt}\n${zImagePrompt}`,
    controls,
  );
  if (parsed.matchedControls.length === 0) {
    throw new Error('no recoverable controls found in prompt');
  }

  const selection = buildRestoreLocks(parsed.locks, controls);
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
  return { ...prompt, lineage: createLineage(prompt) };
}

export function compactPromptSelection(selection) {
  if (!selection || typeof selection !== 'object') return null;

  const normalized = normalizeLocks({ ...createEmptyLocks(), ...selection });
  return Object.fromEntries(
    Object.entries(normalized).filter(([key, value]) => {
      if (key === 'subjectCount' || key === 'aspectRatio') return true;
      if (['specialSubjectId', 'characterProfileId', 'importedWorldSceneMode', 'topBottomPaletteId'].includes(key) && value === 'none') return false;
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    })
  );
}

export function sanitizeStoredPrompt(prompt, controls = getLockControls()) {
  if (!prompt || typeof prompt !== 'object' || !prompt.id) return null;

  const source = String(prompt.source || 'page1');
  const rawSelection = prompt.selection && typeof prompt.selection === 'object' ? prompt.selection : null;
  const selection = ['page1', 'actionPose'].includes(source) && rawSelection
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
    extraPrompts: Array.isArray(prompt.extraPrompts)
      ? prompt.extraPrompts
        .filter((entry) => entry?.id && entry?.label && entry?.text)
        .map((entry) => ({ id: String(entry.id), label: String(entry.label), text: String(entry.text) }))
      : [],
    promptLabels: prompt.promptLabels && typeof prompt.promptLabels === 'object' ? prompt.promptLabels : null,
    selection,
    structured,
    profile: prompt.profile && typeof prompt.profile === 'object' ? prompt.profile : null,
    lineage: prompt.lineage && typeof prompt.lineage === 'object' ? prompt.lineage : null,
    remixMeta: prompt.remixMeta && typeof prompt.remixMeta === 'object' ? prompt.remixMeta : null,
    sourceProject: String(prompt.sourceProject || ''),
    sourceId: String(prompt.sourceId || ''),
    sourceFileName: String(prompt.sourceFileName || ''),
    sourceTags: Array.isArray(prompt.sourceTags)
      ? prompt.sourceTags
        .map((tag) => normalizeSourceTag(tag, tag?.category || getSourceTagCategory(source)))
        .filter(Boolean)
      : [],
  };
}

export function sanitizeStoredPromptCollection(items) {
  return Array.isArray(items) ? items.map((item) => sanitizeStoredPrompt(item)).filter(Boolean) : [];
}

export function serializeFavoritePrompt(prompt) {
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
    e: sanitized.extraPrompts,
    y: sanitized.promptLabels,
    l: compactPromptSelection(sanitized.selection),
    p: sanitized.profile,
    n: sanitized.lineage,
    r: sanitized.remixMeta,
    q: sanitized.sourceProject,
    u: sanitized.sourceId,
    f: sanitized.sourceFileName,
    t: sanitized.sourceTags,
  };
}

export function deserializeFavoritePrompt(record) {
  if (!record || typeof record !== 'object') return null;

  if ([2, FAVORITES_STORAGE_VERSION].includes(record.v) && record.i) {
    return sanitizeStoredPrompt({
      id: record.i,
      source: record.o,
      sourceLabel: record.b,
      date: record.d,
      summary: record.s,
      midjourneyPrompt: record.m,
      grokPrompt: record.g,
      zImagePrompt: record.z,
      extraPrompts: record.e,
      promptLabels: record.y,
      selection: record.l,
      profile: record.p,
      lineage: record.n,
      remixMeta: record.r,
      sourceProject: record.q,
      sourceId: record.u,
      sourceFileName: record.f,
      sourceTags: record.t,
    });
  }

  return sanitizeStoredPrompt(record);
}

export function deserializeFavoritePromptCollection(items) {
  return Array.isArray(items) ? items.map(deserializeFavoritePrompt).filter(Boolean) : [];
}
