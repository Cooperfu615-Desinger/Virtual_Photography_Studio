import React, { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  BookPlus,
  Download,
  Filter,
  FolderUp,
  Heart,
  RefreshCcw,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-react';
import PromptCard from './components/PromptCard';
import {
  buildLocksFromPrompt,
  createEmptyLocks,
  generatePrompts,
  getKnowledgeBaseOptions,
  getLockControls,
  getPartialRerollOptions,
} from './lib/engine';
import './index.css';

const CUSTOM_LIBRARY_KEY = 'vps.customLibrary';
const PRESETS_KEY = 'vps.presets';
const PROMPTS_KEY = 'vps.prompts';
const FAVORITES_KEY = 'vps.favorites';
const LOCKS_KEY = 'vps.locks';
const GEN_COUNT_KEY = 'vps.genCount';
const VIEW_MODE_KEY = 'vps.viewMode';
const REROLL_KEEP_KEY = 'vps.rerollKeep';
const SEARCH_QUERY_KEY = 'vps.searchQuery';
const REROLL_KEEP_DEFAULT = ['styleId', 'locationId'];
const MAX_STORED_PROMPTS = 120;

function buildMarkdownExport(data) {
  return `# Generated Prompt - ${new Date(data.date).toLocaleString()}
**Summary:** ${data.summary}

## Midjourney Prompt
\`\`\`text
${data.midjourneyPrompt}
\`\`\`

## Grok Imagine Prompt
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
      locks: entry.locks,
    }));
}

function App() {
  const customLibraryInputRef = useRef(null);
  const presetInputRef = useRef(null);

  const [prompts, setPrompts] = useState(() => loadJsonStorage(PROMPTS_KEY, []));
  const [favorites, setFavorites] = useState(() => new Set(loadJsonStorage(FAVORITES_KEY, [])));
  const [genCount, setGenCount] = useState(() => loadJsonStorage(GEN_COUNT_KEY, 3));
  const [viewMode, setViewMode] = useState(() => loadStringStorage(VIEW_MODE_KEY, 'feed'));
  const [locks, setLocks] = useState(() => loadJsonStorage(LOCKS_KEY, createEmptyLocks()));
  const [customLibrary, setCustomLibrary] = useState(() => loadJsonStorage(CUSTOM_LIBRARY_KEY, []));
  const [presets, setPresets] = useState(() => loadJsonStorage(PRESETS_KEY, []));
  const [presetName, setPresetName] = useState('');
  const [rerollKeep, setRerollKeep] = useState(() => loadJsonStorage(REROLL_KEEP_KEY, REROLL_KEEP_DEFAULT));
  const [searchQuery, setSearchQuery] = useState(() => loadStringStorage(SEARCH_QUERY_KEY, ''));
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
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  }, [favorites]);

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
    window.localStorage.setItem(REROLL_KEEP_KEY, JSON.stringify(rerollKeep));
  }, [rerollKeep]);

  useEffect(() => {
    window.localStorage.setItem(SEARCH_QUERY_KEY, searchQuery);
  }, [searchQuery]);

  const knowledgeBaseOptions = useMemo(() => getKnowledgeBaseOptions(customLibrary), [customLibrary]);
  const lockControls = useMemo(() => getLockControls(customLibrary), [customLibrary]);
  const rerollOptions = useMemo(() => getPartialRerollOptions(), []);

  const activeLockCount = Object.values(locks).filter(Boolean).length;
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const displayPrompts = useMemo(() => {
    const baseList = viewMode === 'favorites' ? prompts.filter((prompt) => favorites.has(prompt.id)) : prompts;

    if (!normalizedSearch) return baseList;

    return baseList.filter((prompt) => {
      const haystack = [
        prompt.summary,
        prompt.midjourneyPrompt,
        prompt.grokPrompt,
        prompt.negativePrompt,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [favorites, normalizedSearch, prompts, viewMode]);

  const handleGenerate = () => {
    const newPrompts = generatePrompts(genCount, locks, customLibrary);
    setPrompts((prev) => [...newPrompts, ...prev].slice(0, MAX_STORED_PROMPTS));
    setViewMode('feed');
  };

  const handleRemixPrompt = (prompt) => {
    const remixLocks = buildLocksFromPrompt(prompt, rerollKeep);
    const [nextPrompt] = generatePrompts(1, remixLocks, customLibrary);
    setPrompts((prev) => prev.map((item) => (item.id === prompt.id ? nextPrompt : item)));
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
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

  const exportWorkspace = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            prompts,
            favorites: Array.from(favorites),
            locks,
            genCount,
            viewMode,
            rerollKeep,
            presets,
            customLibrary,
          },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    );
    saveAs(blob, `vps_workspace_${Date.now()}.json`);
  };

  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) return;

    const snapshot = {
      id: `preset-${Date.now()}`,
      name,
      locks,
    };

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
    setCustomForm((prev) => ({
      ...prev,
      zh: '',
      en: '',
      desc: '',
    }));
  };

  const exportCustomLibrary = () => {
    const blob = new Blob([JSON.stringify(customLibrary, null, 2)], { type: 'application/json' });
    saveAs(blob, `vps_custom_library_${Date.now()}.json`);
  };

  const exportPresets = () => {
    const blob = new Blob([JSON.stringify(presets, null, 2)], { type: 'application/json' });
    saveAs(blob, `vps_presets_${Date.now()}.json`);
  };

  const readJsonFile = async (file) => {
    const text = await file.text();
    return JSON.parse(text);
  };

  const handleImportCustomLibrary = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await readJsonFile(file);
      const imported = normalizeImportedEntries(data);
      if (imported.length > 0) {
        setCustomLibrary((prev) => [...imported, ...prev].slice(0, 400));
      }
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
      const data = await readJsonFile(file);
      const imported = normalizeImportedPresets(data);
      if (imported.length > 0) {
        setPresets((prev) => [...imported, ...prev].slice(0, 24));
      }
    } catch {
      window.alert('Preset import failed. Please use a valid JSON export.');
    } finally {
      event.target.value = '';
    }
  };

  const selectedGroup = knowledgeBaseOptions.find((group) => group.value === customForm.group);
  const selectedCategories = selectedGroup?.categories || [];

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
      <input ref={customLibraryInputRef} className="hidden-input" type="file" accept="application/json" onChange={handleImportCustomLibrary} />
      <input ref={presetInputRef} className="hidden-input" type="file" accept="application/json" onChange={handleImportPresets} />

      <header className="page-header">
        <div>
          <p className="eyebrow">Virtual Photography Studio</p>
          <h1>Personal Prompt Operations Deck</h1>
          <p className="subtitle">
            第三階段補上工作區持久化、匯入匯出與搜尋篩選。現在關掉頁面再回來，工具會保留你的生成紀錄、收藏、preset 與自訂詞庫。
          </p>
        </div>

        <div className="controls">
          <select value={genCount} onChange={(event) => setGenCount(Number(event.target.value))}>
            <option value={1}>Generate 1</option>
            <option value={3}>Generate 3</option>
            <option value={6}>Generate 6</option>
            <option value={10}>Generate 10</option>
          </select>
          <button onClick={handleGenerate}>
            <Sparkles size={18} />
            Generate Batch
          </button>
        </div>
      </header>

      <section className="workspace-grid">
        <div className="left-column">
          <section className="lock-panel">
            <div className="lock-panel-header">
              <div>
                <div className="lock-title">
                  <SlidersHorizontal size={18} />
                  Locked Inputs
                </div>
                <p className="lock-subtitle">目前鎖定 {activeLockCount} 個條件，未鎖定欄位會交給規則引擎補齊。</p>
              </div>
              <button className="secondary" onClick={() => setLocks(createEmptyLocks())}>
                <RotateCcw size={16} />
                Reset Locks
              </button>
            </div>

            <div className="lock-grid">
              {lockControls.map((control) => (
                <label key={control.key} className="field">
                  <span>{control.label}</span>
                  <select
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

            <div className="preset-row">
              <input className="text-input" value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="Preset name" />
              <button className="secondary" onClick={handleSavePreset}>
                <Save size={16} />
                Save Preset
              </button>
            </div>

            <div className="inline-actions">
              <button className="secondary" onClick={() => presetInputRef.current?.click()}>
                <FolderUp size={16} />
                Import Presets
              </button>
              <button className="secondary" onClick={exportPresets} disabled={presets.length === 0}>
                <Download size={16} />
                Export Presets
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
          </section>

          <section className="lock-panel">
            <div className="lock-panel-header">
              <div>
                <div className="lock-title">
                  <RefreshCcw size={18} />
                  Partial Reroll
                </div>
                <p className="lock-subtitle">每張卡片點 Remix 時，會保留下面勾選的欄位，其餘重新生成。</p>
              </div>
            </div>

            <div className="chip-list">
              {rerollOptions.map((option) => {
                const active = rerollKeep.includes(option.key);
                return (
                  <button
                    key={option.key}
                    className={`chip ${active ? 'chip-active' : ''}`}
                    onClick={() =>
                      setRerollKeep((prev) =>
                        prev.includes(option.key) ? prev.filter((item) => item !== option.key) : [...prev, option.key]
                      )
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="inline-actions">
              <button className="secondary" onClick={exportWorkspace} disabled={prompts.length === 0 && customLibrary.length === 0 && presets.length === 0}>
                <Download size={16} />
                Export Workspace
              </button>
            </div>
          </section>
        </div>

        <div className="right-column">
          <section className="lock-panel">
            <div className="lock-panel-header">
              <div>
                <div className="lock-title">
                  <BookPlus size={18} />
                  Custom Library
                </div>
                <p className="lock-subtitle">新增你自己的場景、風格、服裝或負面詞，系統會把它們納入後續抽樣。</p>
              </div>
            </div>

            <div className="inline-actions">
              <button className="secondary" onClick={() => customLibraryInputRef.current?.click()}>
                <FolderUp size={16} />
                Import JSON
              </button>
              <button className="secondary" onClick={exportCustomLibrary} disabled={customLibrary.length === 0}>
                <Download size={16} />
                Export JSON
              </button>
            </div>

            <div className="lock-grid">
              <label className="field">
                <span>Group</span>
                <select value={customForm.group} onChange={(event) => updateCustomGroup(event.target.value)}>
                  {knowledgeBaseOptions.map((group) => (
                    <option key={group.value} value={group.value}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Category</span>
                <select value={customForm.category} onChange={(event) => setCustomForm((prev) => ({ ...prev, category: event.target.value }))}>
                  {selectedCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>中文名稱</span>
                <input className="text-input" value={customForm.zh} onChange={(event) => setCustomForm((prev) => ({ ...prev, zh: event.target.value }))} />
              </label>

              <label className="field">
                <span>English Prompt</span>
                <input className="text-input" value={customForm.en} onChange={(event) => setCustomForm((prev) => ({ ...prev, en: event.target.value }))} />
              </label>
            </div>

            <label className="field">
              <span>Description / Notes</span>
              <textarea className="text-area" rows={3} value={customForm.desc} onChange={(event) => setCustomForm((prev) => ({ ...prev, desc: event.target.value }))} />
            </label>

            <div className="tab-row">
              <button onClick={handleAddCustomEntry}>
                <BookPlus size={16} />
                Add to Library
              </button>
            </div>

            <div className="custom-list">
              {customLibrary.length === 0 ? (
                <div className="empty-inline">還沒有自訂詞條。新增後會自動進入後續生成邏輯。</div>
              ) : (
                customLibrary.slice(0, 12).map((entry) => (
                  <div key={entry.id} className="custom-item">
                    <div>
                      <strong>{entry.zh}</strong>
                      <p>
                        {entry.group} / {entry.category}
                      </p>
                      <code>{entry.en}</code>
                    </div>
                    <button className="icon-btn" onClick={() => setCustomLibrary((prev) => prev.filter((item) => item.id !== entry.id))} title="Delete custom entry">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>

      <section className="toolbar toolbar-stack">
        <div className="tab-row">
          <button className={viewMode === 'feed' ? '' : 'secondary'} onClick={() => setViewMode('feed')}>
            Feed ({prompts.length})
          </button>
          <button className={viewMode === 'favorites' ? '' : 'secondary'} onClick={() => setViewMode('favorites')}>
            <Heart size={16} fill={viewMode === 'favorites' ? 'currentColor' : 'none'} />
            Favorites ({favorites.size})
          </button>
        </div>

        <div className="filter-bar">
          <div className="search-shell">
            <Search size={16} />
            <input className="text-input search-input" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search prompt history, summary, scene, style..." />
          </div>
          <div className="results-meta">
            <Filter size={15} />
            {displayPrompts.length} results
          </div>
        </div>

        <div className="tab-row">
          <button className="secondary" onClick={handleDownloadAll} disabled={displayPrompts.length === 0}>
            <Download size={18} />
            {viewMode === 'favorites' ? 'Download Favorites' : 'Download Feed'}
          </button>
          {viewMode === 'feed' && prompts.length > 0 ? (
            <button className="secondary danger" onClick={() => setPrompts([])}>
              Clear Feed
            </button>
          ) : null}
        </div>
      </section>

      <div className="feed">
        {displayPrompts.length === 0 ? (
          <div className="empty-state">{searchQuery ? '沒有符合搜尋條件的 prompt。' : '先鎖定幾個條件，或新增幾筆自訂詞條，然後開始批次生成。'}</div>
        ) : (
          displayPrompts.map((prompt) => (
            <PromptCard key={prompt.id} data={prompt} isFavorite={favorites.has(prompt.id)} onFavorite={toggleFavorite} onRemix={handleRemixPrompt} />
          ))
        )}
      </div>
    </div>
  );
}

export default App;
