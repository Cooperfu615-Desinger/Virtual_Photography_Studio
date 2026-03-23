import React, { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Copy } from 'lucide-react';
import PromptCard from './components/PromptCard';
import {
  buildLocksFromPrompt,
  createEmptyLocks,
  generatePrompts,
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
const MAX_STORED_PROMPTS = 120;
const SUMMARY_SECTION_INFO = {
  style: {
    label: '風格',
    lockLabels: ['攝影風格'],
    keys: ['styleId'],
  },
  character: {
    label: '人物',
    lockLabels: ['人數', '體態', '五官', '膚質', '髮型', '髮色', '雙人互動', '表情', '姿勢'],
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
    ],
  },
  wardrobe: {
    label: '服裝',
    lockLabels: ['套裝', '上身', '下身', '襪類', '襪類配色', '外套', '鞋款', '配件'],
    keys: [
      'outfitPresetId',
      'outfitPresetColorId',
      'outfitPresetAId',
      'outfitPresetAColorId',
      'outfitPresetBId',
      'outfitPresetBColorId',
      'topId',
      'topColorId',
      'duoStylingId',
      'pantsId',
      'skirtId',
      'bottomColorId',
      'legwearId',
      'legwearColorId',
      'outerwearId',
      'outerwearColorId',
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
    lockLabels: ['表情', '姿勢'],
    keys: ['expressionId', 'poseId'],
  },
  wardrobeCore: {
    label: '服裝主體',
    lockLabels: ['套裝', '上身', '下身', '外套', '襪類', '鞋款'],
    keys: [
      'outfitPresetId',
      'outfitPresetColorId',
      'outfitPresetAId',
      'outfitPresetAColorId',
      'outfitPresetBId',
      'outfitPresetBColorId',
      'topId',
      'topColorId',
      'duoStylingId',
      'pantsId',
      'skirtId',
      'bottomColorId',
      'legwearId',
      'legwearColorId',
      'outerwearId',
      'outerwearColorId',
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
];
const SCENE_CAMERA_CONTROL_ORDER = ['styleId', 'locationId', 'lightingId', 'lightDirectionId', 'angleId', 'orbitId', 'framingId', 'lensId', 'opticalEffectId', 'filmId', 'aspectRatio'];
const SCENE_CAMERA_SIMPLIFIED_ORDER = ['styleId', 'locationId', 'angleId', 'orbitId', 'framingId', 'lensId', 'opticalEffectId', 'aspectRatio'];
const STYLE_WARDROBE_CONTROL_ORDER = ['outfitPresetId', 'outfitPresetColorId', 'outfitPresetAId', 'outfitPresetAColorId', 'outfitPresetBId', 'outfitPresetBColorId', 'topId', 'topColorId', 'duoStylingId', 'pantsId', 'skirtId', 'bottomColorId', 'legwearId', 'legwearColorId', 'outerwearId', 'outerwearColorId', 'shoesId', 'shoesColorId', 'eyewearId', 'earringsId', 'neckAccessoryId', 'wristAccessoryId', 'ringId', 'waistAccessoryId'];

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

## Negative Prompt
\`\`\`text
${data.negativePrompt}
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

function selectionKeysEqual(previous, next, keys) {
  return keys.every((key) => (previous?.selection?.[key] || '') === (next?.selection?.[key] || ''));
}

function buildRemixMeta(previousPrompt, nextPrompt, lockedSections) {
  const kept = [];
  const changed = [];
  const adjusted = [];

  Object.entries(SUMMARY_SECTION_INFO).forEach(([sectionKey, section]) => {
    const isLocked = lockedSections.includes(sectionKey);
    const isSame = selectionKeysEqual(previousPrompt, nextPrompt, section.keys);

    if (isLocked && isSame) kept.push(section.label);
    if (isLocked && !isSame) adjusted.push(section.label);
    if (!isLocked && !isSame) changed.push(section.label);
  });

  return {
    locked: lockedSections.map((key) => REMIX_GROUP_INFO[key]?.label).filter(Boolean),
    kept,
    changed,
    adjusted,
  };
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
  const [viewMode, setViewMode] = useState(() => loadStringStorage(VIEW_MODE_KEY, 'feed'));
  const [locks, setLocks] = useState(() => normalizeLocks(loadJsonStorage(LOCKS_KEY, createEmptyLocks())));
  const [searchQuery, setSearchQuery] = useState(() => loadStringStorage(SEARCH_QUERY_KEY, ''));
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
    window.localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    window.localStorage.setItem(SEARCH_QUERY_KEY, searchQuery);
  }, [searchQuery]);

  const favoriteIds = useMemo(() => new Set(favoritePrompts.map((prompt) => prompt.id)), [favoritePrompts]);

  const lockControls = useMemo(() => getLockControls(), []);
  const sceneDependentOptions = useMemo(() => getSceneDependentOptions([], locks), [locks]);
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

  const updateLocks = (updater) => {
    setLocks((prev) => {
      const candidate = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      const next = { ...candidate };
      const nextSceneDependentOptions = getSceneDependentOptions([], next);
      const allowedLightingIds = new Set(nextSceneDependentOptions.lightingOptions.map((option) => option.id));
      const allowedDirectionIds = new Set(nextSceneDependentOptions.lightDirectionOptions.map((option) => option.id));

      if (next.lightingId && !allowedLightingIds.has(next.lightingId)) {
        next.lightingId = '';
      }

      if (next.lightDirectionId && !allowedDirectionIds.has(next.lightDirectionId)) {
        next.lightDirectionId = '';
      }

      return next;
    });
  };

  const handleGenerate = () => {
    const newPrompts = generatePrompts(genCount, locks);
    setPrompts((prev) => [...newPrompts, ...prev].slice(0, MAX_STORED_PROMPTS));
    setViewMode('feed');
  };

  const handleRemixPrompt = (prompt, summaryKeys = []) => {
    const keepKeys = Array.from(new Set(summaryKeys.flatMap((key) => SUMMARY_REROLL_MAP[key] || [])));
    const remixLocks = buildLocksFromPrompt(prompt, keepKeys);
    const [generatedPrompt] = generatePrompts(1, remixLocks);
    const nextPrompt = {
      ...generatedPrompt,
      id: prompt.id,
      remixMeta: buildRemixMeta(prompt, generatedPrompt, summaryKeys),
    };
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

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <p className="eyebrow">Virtual Photography Studio</p>
          <h1>Prompt Control Deck</h1>
          <p className="subtitle">一個為個人創作流程設計的虛擬攝影 Prompt 生成工具，支援快速組合、批次生成與風格探索。</p>
        </div>
      </header>

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
            <div className="lock-grid">
              {characterLockControls.map((control) => (
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
              <button className="secondary subtle-action" onClick={() => setLocks(createEmptyLocks())}>
                Reset Controls
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
        </div>

        <div className="filter-bar">
          <div className="search-shell">
            <input className="text-input search-input" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by style, scene, wardrobe, character..." />
          </div>
          <div className="results-meta">{displayPrompts.length} results</div>
        </div>

        <div className="tab-row">
          <button className="secondary" onClick={handleDownloadAll} disabled={displayPrompts.length === 0}>
            Download Feed
          </button>
        </div>
      </section>

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
              onRemix={handleRemixPrompt}
              summarySectionInfo={SUMMARY_SECTION_INFO}
              advancedRemixGroupInfo={ADVANCED_REMIX_GROUP_INFO}
            />
          ))
        )}
      </div>

      {copiedLabel ? <div className="toast">{copiedLabel}</div> : null}
    </div>
  );
}
const SUMMARY_REROLL_MAP = Object.fromEntries(
  Object.entries(REMIX_GROUP_INFO).map(([sectionKey, section]) => [sectionKey, section.keys])
);
