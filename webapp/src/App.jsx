import React, { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import CustomLibraryModal from './components/CustomLibraryModal';
import PromptCard from './components/PromptCard';
import {
  buildLocksFromPrompt,
  createEmptyLocks,
  generatePrompts,
  getKnowledgeBaseOptions,
  getLockControls,
  normalizeLocks,
} from './lib/engine';
import './index.css';

const CUSTOM_LIBRARY_KEY = 'vps.customLibrary';
const PRESETS_KEY = 'vps.presets';
const PROMPTS_KEY = 'vps.prompts';
const FAVORITES_KEY = 'vps.favorites';
const LOCKS_KEY = 'vps.locks';
const GEN_COUNT_KEY = 'vps.genCount';
const VIEW_MODE_KEY = 'vps.viewMode';
const SEARCH_QUERY_KEY = 'vps.searchQuery';
const MAX_STORED_PROMPTS = 120;
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
const SCENE_CAMERA_CONTROL_ORDER = ['styleId', 'aspectRatio', 'locationId', 'framingId', 'angleId', 'orbitId', 'lightingId', 'lightDirectionId', 'filmId'];
const SCENE_CAMERA_SIMPLIFIED_ORDER = ['styleId', 'aspectRatio', 'locationId', 'framingId', 'angleId', 'orbitId'];
const STYLE_WARDROBE_CONTROL_ORDER = ['outfitPresetId', 'outfitPresetAId', 'outfitPresetBId', 'topId', 'topColorId', 'duoStylingId', 'pantsId', 'skirtId', 'bottomColorId', 'legwearId', 'outerwearId', 'shoesId', 'jewelryIds'];

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

function isNoneOption(option) {
  return option?.zh === '全無';
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

function normalizeImportedEntries(data) {
  if (!Array.isArray(data)) return [];

  return data
    .filter((entry) => entry && entry.group && entry.category && entry.zh && entry.en)
    .map((entry, index) => ({
      id: entry.id || `imported-${Date.now()}-${index}`,
      group: entry.group,
      category: entry.category,
      zh: entry.zh,
      en: entry.en,
      desc: entry.desc || '',
    }));
}

function normalizeImportedPresets(data) {
  if (!Array.isArray(data)) return [];

  return data
    .filter((entry) => entry && entry.name && entry.locks)
    .map((entry, index) => ({
      id: entry.id || `preset-import-${Date.now()}-${index}`,
      name: entry.name,
      locks: normalizeLocks(entry.locks),
    }));
}

export default function App() {
  const customLibraryInputRef = useRef(null);
  const presetInputRef = useRef(null);

  const [prompts, setPrompts] = useState(() => loadJsonStorage(PROMPTS_KEY, []));
  const [favoritePrompts, setFavoritePrompts] = useState(() => loadFavoritePrompts());
  const [genCount, setGenCount] = useState(() => loadJsonStorage(GEN_COUNT_KEY, 3));
  const [viewMode, setViewMode] = useState(() => loadStringStorage(VIEW_MODE_KEY, 'feed'));
  const [locks, setLocks] = useState(() => normalizeLocks(loadJsonStorage(LOCKS_KEY, createEmptyLocks())));
  const [customLibrary, setCustomLibrary] = useState(() => loadJsonStorage(CUSTOM_LIBRARY_KEY, []));
  const [presets, setPresets] = useState(() => loadJsonStorage(PRESETS_KEY, []));
  const [presetName, setPresetName] = useState('');
  const [searchQuery, setSearchQuery] = useState(() => loadStringStorage(SEARCH_QUERY_KEY, ''));
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [customForm, setCustomForm] = useState({
    group: 'Locations',
    category: '',
    zh: '',
    en: '',
    desc: '',
  });

  useEffect(() => {
    window.localStorage.setItem(CUSTOM_LIBRARY_KEY, JSON.stringify(customLibrary));
  }, [customLibrary]);

  useEffect(() => {
    window.localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  }, [presets]);

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
  const isPhotographyStyleLocked = Boolean(locks.styleId);

  const knowledgeBaseOptions = useMemo(() => getKnowledgeBaseOptions(customLibrary), [customLibrary]);
  const lockControls = useMemo(() => getLockControls(customLibrary), [customLibrary]);
  const coreLockControls = useMemo(
    () =>
      sortControls(
        lockControls.filter((control) =>
          (isPhotographyStyleLocked ? SCENE_CAMERA_SIMPLIFIED_ORDER : SCENE_CAMERA_CONTROL_ORDER).includes(control.key)
        ),
        isPhotographyStyleLocked ? SCENE_CAMERA_SIMPLIFIED_ORDER : SCENE_CAMERA_CONTROL_ORDER
      ),
    [isPhotographyStyleLocked, lockControls]
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
          if (control.key === 'outfitPresetId' && locks.subjectCount === '2') return false;
          if ((control.key === 'outfitPresetAId' || control.key === 'outfitPresetBId') && locks.subjectCount !== '2') return false;
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
  const isOutfitPresetActive = locks.subjectCount === '2' ? Boolean(locks.outfitPresetAId || locks.outfitPresetBId) : Boolean(locks.outfitPresetId);

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

  const handleGenerate = () => {
    const newPrompts = generatePrompts(genCount, locks, customLibrary);
    setPrompts((prev) => [...newPrompts, ...prev].slice(0, MAX_STORED_PROMPTS));
    setViewMode('feed');
  };

  const handleRemixPrompt = (prompt, summaryKeys = []) => {
    const keepKeys = Array.from(new Set(summaryKeys.flatMap((key) => SUMMARY_REROLL_MAP[key] || [])));
    const remixLocks = buildLocksFromPrompt(prompt, keepKeys);
    const [generatedPrompt] = generatePrompts(1, remixLocks, customLibrary);
    const nextPrompt = { ...generatedPrompt, id: prompt.id };
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

  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const snapshot = { id: `preset-${Date.now()}`, name, locks: normalizeLocks(locks) };
    setPresets((prev) => [snapshot, ...prev.filter((item) => item.name !== name)].slice(0, 24));
    setPresetName('');
  };

  const handleAddCustomEntry = () => {
    if (!customForm.category || !customForm.zh.trim() || !customForm.en.trim()) return;
    const entry = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      group: customForm.group,
      category: customForm.category,
      zh: customForm.zh.trim(),
      en: customForm.en.trim(),
      desc: customForm.desc.trim(),
    };
    setCustomLibrary((prev) => [entry, ...prev]);
    setCustomForm((prev) => ({ ...prev, zh: '', en: '', desc: '' }));
  };

  const exportCustomLibrary = () => {
    const blob = new Blob([JSON.stringify(customLibrary, null, 2)], { type: 'application/json' });
    saveAs(blob, `vps_custom_library_${Date.now()}.json`);
  };

  const exportPresets = () => {
    const blob = new Blob([JSON.stringify(presets, null, 2)], { type: 'application/json' });
    saveAs(blob, `vps_presets_${Date.now()}.json`);
  };

  const readJsonFile = async (file) => JSON.parse(await file.text());

  const handleImportCustomLibrary = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = normalizeImportedEntries(await readJsonFile(file));
      if (imported.length > 0) setCustomLibrary((prev) => [...imported, ...prev].slice(0, 400));
    } catch {
      window.alert('Custom library import failed. Please use a valid JSON export.');
    } finally {
      event.target.value = '';
    }
  };

  const handleImportPresets = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = normalizeImportedPresets(await readJsonFile(file));
      if (imported.length > 0) setPresets((prev) => [...imported, ...prev].slice(0, 24));
    } catch {
      window.alert('Preset import failed. Please use a valid JSON export.');
    } finally {
      event.target.value = '';
    }
  };

  const selectedGroup = knowledgeBaseOptions.find((group) => group.value === customForm.group);
  const selectedCategories = selectedGroup?.categories || [];

  const toggleJewelrySelection = (option) => {
    setLocks((prev) => {
      const current = Array.isArray(prev.jewelryIds) ? prev.jewelryIds : [];
      const alreadySelected = current.includes(option.id);

      if (isNoneOption(option)) {
        return { ...prev, jewelryIds: alreadySelected ? [] : [option.id] };
      }

      const noneOption = wardrobeLockControls
        .find((control) => control.key === 'jewelryIds')
        ?.options.find((item) => isNoneOption(item));
      const next = current.filter((id) => id !== noneOption?.id);

      if (alreadySelected) {
        return { ...prev, jewelryIds: next.filter((id) => id !== option.id) };
      }

      if (next.length >= 3) return prev;

      return { ...prev, jewelryIds: [...next, option.id] };
    });
  };

  const updateCustomGroup = (group) => {
    const nextGroup = knowledgeBaseOptions.find((item) => item.value === group);
    setCustomForm((prev) => ({
      ...prev,
      group,
      category: nextGroup?.categories.includes(prev.category) ? prev.category : nextGroup?.categories[0] || '',
    }));
  };

  return (
    <div className="container">
      <input ref={presetInputRef} className="hidden-input" type="file" accept="application/json" onChange={handleImportPresets} />

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
                <label key={control.key} className="field">
                  <span>{control.label}</span>
                  <select
                    className={isMutedSelectValue(control, locks[control.key]) ? 'select-muted' : ''}
                    value={locks[control.key]}
                    onChange={(event) =>
                      setLocks((prev) => ({
                        ...prev,
                        [control.key]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Random</option>
                    {control.options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.zh}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="control-section control-section-secondary">
            <div className="control-section-header">
              <div className="control-section-title">Character Setup</div>
            </div>
            <div className="lock-grid">
              {characterLockControls.map((control) => (
                <label key={control.key} className="field">
                  <span>{control.label}</span>
                  <select
                    className={isMutedSelectValue(control, locks[control.key]) ? 'select-muted' : ''}
                    value={locks[control.key]}
                    onChange={(event) =>
                      setLocks((prev) => ({
                        ...prev,
                        [control.key]: event.target.value,
                      }))
                    }
                  >
                    {!control.required ? <option value="">Random</option> : null}
                    {control.options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.zh}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="control-section control-section-secondary">
            <div className="control-section-header">
              <div className="control-section-title">Style & Wardrobe</div>
            </div>
            <div className="lock-grid detail-lock-grid">
              {wardrobeLockControls.map((control) =>
                control.key === 'jewelryIds' ? (
                  <div key={control.key} className={`field field-full ${isOutfitPresetActive ? 'field-disabled' : ''}`}>
                    <span>{control.label}</span>
                    <div className="chip-list chip-list-inline">
                      {control.options.map((option) => {
                        const active = Array.isArray(locks.jewelryIds) && locks.jewelryIds.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            className={`chip ${active ? 'chip-active' : ''}`}
                            disabled={isOutfitPresetActive}
                            onClick={() => toggleJewelrySelection(option)}
                          >
                            {option.zh}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <label
                    key={control.key}
                    className={`field ${
                      isOutfitPresetActive &&
                      !['outfitPresetId', 'outfitPresetAId', 'outfitPresetBId'].includes(control.key)
                        ? 'field-disabled'
                        : ''
                    }`}
                  >
                    <span>{control.label}</span>
                    <select
                      disabled={
                        isOutfitPresetActive &&
                        !['outfitPresetId', 'outfitPresetAId', 'outfitPresetBId'].includes(control.key)
                      }
                      className={isMutedSelectValue(control, locks[control.key]) ? 'select-muted' : ''}
                      value={locks[control.key]}
                      onChange={(event) =>
                        setLocks((prev) => ({
                          ...prev,
                          [control.key]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Random</option>
                      {control.options.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.zh}
                        </option>
                      ))}
                    </select>
                  </label>
                )
              )}
            </div>
          </div>

          <div className="preset-row">
            <input className="text-input" value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="Preset name" />
            <button className="secondary" onClick={handleSavePreset}>
              Save
            </button>
            <button className="secondary" onClick={() => presetInputRef.current?.click()}>
              Import
            </button>
            <button className="secondary" onClick={exportPresets} disabled={presets.length === 0}>
              Export
            </button>
            <button className="secondary subtle-action" onClick={() => setLocks(createEmptyLocks())}>
              Reset Controls
            </button>
          </div>

          {presets.length > 0 ? (
            <div className="chip-list">
              {presets.map((preset) => (
                <button key={preset.id} className="chip" onClick={() => setLocks(preset.locks)}>
                  {preset.name}
                </button>
              ))}
            </div>
          ) : null}

          <div className="control-actions">
            <div className="control-actions-main">
              <label className="field compact-field">
                <span>卡片張數</span>
                <select value={genCount} onChange={(event) => setGenCount(Number(event.target.value))}>
                  <option value={1}>1</option>
                  <option value={3}>3</option>
                  <option value={6}>6</option>
                  <option value={10}>10</option>
                </select>
              </label>

              <button className="primary-cta" onClick={handleGenerate}>
                Generate
              </button>
              <button className="secondary danger" onClick={() => setPrompts([])} disabled={prompts.length === 0}>
                Clear Feed {prompts.length > 0 ? `(${prompts.length})` : ''}
              </button>
            </div>
            <button className="library-cta" onClick={() => setIsLibraryOpen(true)}>
              Custom Library
            </button>
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
            <PromptCard key={prompt.id} data={prompt} isFavorite={favoriteIds.has(prompt.id)} onFavorite={toggleFavorite} onRemix={handleRemixPrompt} />
          ))
        )}
      </div>

      <CustomLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        customLibraryInputRef={customLibraryInputRef}
        onImportClick={handleImportCustomLibrary}
        onExport={exportCustomLibrary}
        knowledgeBaseOptions={knowledgeBaseOptions}
        customForm={customForm}
        updateCustomGroup={updateCustomGroup}
        setCustomForm={setCustomForm}
        selectedCategories={selectedCategories}
        onAddCustomEntry={handleAddCustomEntry}
        customLibrary={customLibrary}
        onDeleteEntry={(id) => setCustomLibrary((prev) => prev.filter((item) => item.id !== id))}
      />
    </div>
  );
}
const SUMMARY_REROLL_MAP = {
  style: ['styleId'],
  character: [
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
  wardrobe: [
    'outfitPresetId',
    'outfitPresetAId',
    'outfitPresetBId',
    'topId',
    'topColorId',
    'duoStylingId',
    'pantsId',
    'skirtId',
    'bottomColorId',
    'legwearId',
    'outerwearId',
    'shoesId',
    'jewelryIds',
  ],
  location: ['locationId'],
  camera: ['aspectRatio', 'framingId', 'angleId', 'orbitId', 'filmId'],
  lighting: ['lightingId', 'lightDirectionId'],
};
