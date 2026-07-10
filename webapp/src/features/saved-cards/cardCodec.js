import {
  createEmptyLocks,
  getLockControls,
  normalizeLocks,
} from '../../lib/engine.js';
import { ACTION_POSE_CARDS, buildActionPoseSavedCard } from '../../lib/actionPoseLab.js';

export const FAVORITES_STORAGE_VERSION = 2;

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
  };
}

export function deserializeFavoritePrompt(record) {
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
      extraPrompts: record.e,
      promptLabels: record.y,
      selection: record.l,
      profile: record.p,
      lineage: record.n,
      remixMeta: record.r,
    });
  }

  return sanitizeStoredPrompt(record);
}

export function deserializeFavoritePromptCollection(items) {
  return Array.isArray(items) ? items.map(deserializeFavoritePrompt).filter(Boolean) : [];
}
