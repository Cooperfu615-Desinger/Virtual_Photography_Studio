import { useEffect, useMemo, useState } from 'react';
import PromptCard from './PromptCard';
import SelectControlField from './SelectControlField';
import LightingReferenceModal from './LightingReferenceModal';

const OUTFIT_PRESET_COVERED_KEYS = new Set([
  'topId',
  'topBottomPaletteId',
  'topColorId',
  'topPatternId',
  'dressId',
  'dressColorId',
  'pantsId',
  'skirtId',
  'bottomColorId',
  'bottomPatternId',
]);

const WORKSPACE_SECTIONS = [
  { id: 'character', label: 'A 人物設定', summaryKey: 'characterDna', metaKey: 'expressionPose' },
  { id: 'wardrobe', label: 'B 穿搭設定', summaryKey: 'wardrobe', metaKey: null },
  { id: 'scene', label: 'C 場景與鏡頭', summaryKey: 'sceneLook', metaKey: null },
];

const SECTION_SUBPANELS = {
  character: [
    {
      id: 'identity',
      label: '身份基底',
      description: '先確立人物數量、體態與臉髮基礎，讓角色 DNA 先穩定下來。',
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
      ],
    },
    {
      id: 'expression',
      label: '神情姿態',
      description: '再補上表情、雙人互動與動作，讓人物狀態更完整。',
      keys: [
        'duoInteractionId',
        'expressionId',
        'expressionAId',
        'expressionBId',
        'poseId',
        'specialActionId',
      ],
    },
  ],
  wardrobe: [
    {
      id: 'overall',
      label: '整體穿搭',
      description: '優先決定套裝或整體搭配方向，這會直接影響後續單件欄位。',
      keys: [
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
        'duoStylingId',
      ],
    },
    {
      id: 'garments',
      label: '上下身單件',
      description: '當你不走整套 preset 時，這裡決定連身或上下身的主體輪廓。',
      keys: [
        'topId',
        'topBottomPaletteId',
        'topColorId',
        'topPatternId',
        'dressId',
        'dressColorId',
        'pantsId',
        'skirtId',
        'bottomColorId',
        'bottomPatternId',
      ],
    },
    {
      id: 'layers',
      label: '鞋襪與外層',
      description: '補上襪類、鞋款與外套，建立完整造型層次。',
      keys: [
        'legwearId',
        'legwearColorId',
        'outerwearId',
        'outerwearColorId',
        'outerwearPatternId',
        'outerwearStylingId',
        'shoesId',
        'shoesColorId',
      ],
    },
    {
      id: 'accessories',
      label: '配件細節',
      description: '最後才加配件，避免太早被細節打散主造型方向。',
      keys: [
        'headAccessoryId',
        'eyewearId',
        'earringsId',
        'neckAccessoryId',
        'wristAccessoryId',
        'ringId',
        'waistAccessoryId',
      ],
    },
  ],
  scene: [
    {
      id: 'space',
      label: '場景基底',
      description: '先定義世界、場景屬性與畫面比例，決定整體敘事容器。',
      keys: ['styleId', 'sceneAttributeId', 'locationId', 'aspectRatio'],
    },
    {
      id: 'camera',
      label: '鏡頭構圖',
      description: '再調整景別、角度與光學效果，讓畫面語言成型。',
      keys: ['framingId', 'angleId', 'orbitId', 'lensId', 'opticalEffectId'],
    },
    {
      id: 'light',
      label: '光線成像',
      description: '最後補上光線與成像風格，決定氣氛與最後的攝影質感。',
      keys: ['lightingId', 'lightDirectionId', 'filmId'],
    },
  ],
};

function getControlOptionLabel(controls, key, value) {
  if (!value) return '';
  const control = controls.find((item) => item.key === key);
  const option = control?.options?.find((item) => item.id === value);
  if (!option || option.zh === '全無' || option.zh === '隨機') return '';
  return option.zh || '';
}

function buildSummaryText(parts) {
  const filtered = parts.filter(Boolean);
  return filtered.length > 0 ? filtered.join(' / ') : '尚未形成明確選項';
}

function buildWorkspaceSummary(locks, controls) {
  const characterSummary = buildSummaryText([
    getControlOptionLabel(controls, 'facialFeaturesId', locks.facialFeaturesId),
    getControlOptionLabel(controls, 'facialFeaturesAId', locks.facialFeaturesAId),
    getControlOptionLabel(controls, 'facialFeaturesBId', locks.facialFeaturesBId),
    getControlOptionLabel(controls, 'bodyTypeId', locks.bodyTypeId),
    getControlOptionLabel(controls, 'hairstyleId', locks.hairstyleId),
    getControlOptionLabel(controls, 'hairstyleAId', locks.hairstyleAId),
    getControlOptionLabel(controls, 'hairstyleBId', locks.hairstyleBId),
    getControlOptionLabel(controls, 'hairColorId', locks.hairColorId),
    getControlOptionLabel(controls, 'hairColorAId', locks.hairColorAId),
    getControlOptionLabel(controls, 'hairColorBId', locks.hairColorBId),
  ]);
  const characterMeta = buildSummaryText([
    getControlOptionLabel(controls, 'expressionId', locks.expressionId),
    getControlOptionLabel(controls, 'expressionAId', locks.expressionAId),
    getControlOptionLabel(controls, 'expressionBId', locks.expressionBId),
    getControlOptionLabel(controls, 'poseId', locks.poseId),
    getControlOptionLabel(controls, 'specialActionId', locks.specialActionId),
    getControlOptionLabel(controls, 'duoInteractionId', locks.duoInteractionId),
  ]);
  const wardrobeSummary = buildSummaryText([
    getControlOptionLabel(controls, 'outfitPresetId', locks.outfitPresetId),
    getControlOptionLabel(controls, 'outfitPresetAId', locks.outfitPresetAId),
    getControlOptionLabel(controls, 'outfitPresetBId', locks.outfitPresetBId),
    getControlOptionLabel(controls, 'dressId', locks.dressId),
    getControlOptionLabel(controls, 'topId', locks.topId),
    getControlOptionLabel(controls, 'pantsId', locks.pantsId),
    getControlOptionLabel(controls, 'skirtId', locks.skirtId),
    getControlOptionLabel(controls, 'legwearId', locks.legwearId),
    getControlOptionLabel(controls, 'shoesId', locks.shoesId),
  ]);
  const sceneSummary = buildSummaryText([
    getControlOptionLabel(controls, 'styleId', locks.styleId),
    getControlOptionLabel(controls, 'locationId', locks.locationId),
    getControlOptionLabel(controls, 'framingId', locks.framingId),
    getControlOptionLabel(controls, 'angleId', locks.angleId),
    getControlOptionLabel(controls, 'lensId', locks.lensId),
    getControlOptionLabel(controls, 'lightingId', locks.lightingId),
  ]);

  return {
    character: {
      summary: characterSummary,
      meta: characterMeta === '尚未形成明確選項' ? '' : characterMeta,
    },
    wardrobe: {
      summary: wardrobeSummary,
      meta: '',
    },
    scene: {
      summary: sceneSummary,
      meta: '',
    },
  };
}

function filterControlsByKeys(controls, keys) {
  const keySet = new Set(keys);
  return controls.filter((control) => keySet.has(control.key));
}

export default function Page1Workspace({
  activeLockCount,
  coreLockControls,
  characterLockControls,
  wardrobeLockControls,
  locks,
  isCloseupMode,
  closeupAllowedKeys,
  isNoneSelected,
  updateLocks,
  handleCopyText,
  isOutfitPresetActive,
  handleGenerate,
  prompts,
  setPrompts,
  createEmptyLocks,
  buildAllNoneLocks,
  lockControls,
  viewMode,
  setViewMode,
  favoritePrompts,
  displayPrompts,
  previewPrompt,
  handleDownloadAll,
  handleClearFavorites,
  importFeedInputRef,
  handleOpenImportFeed,
  handleImportFeed,
  isImportPromptOpen,
  setIsImportPromptOpen,
  importPromptText,
  setImportPromptText,
  handleApplyImportedPrompt,
  favoriteIds,
  toggleFavorite,
  handleDeletePrompt,
  handleRemixPrompt,
  handleRestorePromptToConsole,
  summarySectionInfo,
  advancedRemixGroupInfo,
}) {
  const [isLightingReferenceOpen, setIsLightingReferenceOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('character');
  const [activeSubpanels, setActiveSubpanels] = useState({
    character: 'identity',
    wardrobe: 'overall',
    scene: 'space',
  });
  const [isMobileFavoritesMode, setIsMobileFavoritesMode] = useState(false);

  const workspaceSummary = useMemo(() => buildWorkspaceSummary(locks, lockControls), [locks, lockControls]);
  const activeSectionConfig = WORKSPACE_SECTIONS.find((section) => section.id === activeSection) || WORKSPACE_SECTIONS[0];
  const sectionSubpanels = SECTION_SUBPANELS[activeSection] || [];
  const activeSubpanelId = activeSubpanels[activeSection] || sectionSubpanels[0]?.id || '';
  const activeSubpanel = sectionSubpanels.find((panel) => panel.id === activeSubpanelId) || sectionSubpanels[0] || null;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia('(max-width: 820px)');
    const syncMode = (event) => {
      const matches = typeof event?.matches === 'boolean' ? event.matches : mediaQuery.matches;
      setIsMobileFavoritesMode(matches);
      if (matches) {
        setViewMode('favorites');
      }
    };
    syncMode();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncMode);
      return () => mediaQuery.removeEventListener('change', syncMode);
    }

    mediaQuery.addListener(syncMode);
    return () => mediaQuery.removeListener(syncMode);
  }, [setViewMode]);

  const renderControlGrid = (controls) => (
    <div className="lock-grid detail-lock-grid">
      {controls.map((control) => (
        <SelectControlField
          key={control.key}
          control={control}
          value={locks[control.key]}
          disabled={
            (isCloseupMode && !closeupAllowedKeys.has(control.key))
            || (control.key === 'poseId' && Boolean(locks.specialActionId) && !isNoneSelected('specialActionId', locks.specialActionId, characterLockControls))
            || (control.key === 'specialActionId' && Boolean(locks.poseId) && !isNoneSelected('poseId', locks.poseId, characterLockControls))
            || (['topColorId', 'bottomColorId'].includes(control.key) && Boolean(locks.topBottomPaletteId) && !isNoneSelected('topBottomPaletteId', locks.topBottomPaletteId, wardrobeLockControls))
            || (isOutfitPresetActive && OUTFIT_PRESET_COVERED_KEYS.has(control.key))
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
  );

  const renderSceneControls = () => (
    <div className="control-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Scene & Camera Language</div>
          <p className="workspace-panel-copy">{activeSubpanel?.description || '先決定構圖、場景與光線，右側會同步反映成目前可直接使用的 Grok prompt。'}</p>
        </div>
        <button className="secondary reference-trigger-btn" type="button" onClick={() => setIsLightingReferenceOpen(true)}>
          查看光線定位對照
        </button>
      </div>
      {renderControlGrid(filterControlsByKeys(coreLockControls, activeSubpanel?.keys || []))}
    </div>
  );

  const renderCharacterControls = () => (
    <div className="control-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Character Setup</div>
          <p className="workspace-panel-copy">{activeSubpanel?.description || '把人物身份、臉部與姿態先固定下來，後面換穿搭與場景會更穩定。'}</p>
        </div>
      </div>
      {locks.subjectCount === 'reference' ? (
        <div className="context-note">
          此模式不在 app 內上傳圖片；生成後請把同一張人物參考圖直接附給 Midjourney、Grok 或 Gemini，prompt 會以附圖人物五官與身份為主。
        </div>
      ) : null}
      {isCloseupMode ? (
        <div className="context-note">
          目前為特寫模式，系統已自動停用與臉部無關的服裝、下身、姿勢與場景欄位，讓 prompt 專心描述人物臉孔。
        </div>
      ) : null}
      {renderControlGrid(filterControlsByKeys(characterLockControls, activeSubpanel?.keys || []))}
    </div>
  );

  const renderWardrobeControls = () => (
    <div className="control-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Style & Wardrobe</div>
          <p className="workspace-panel-copy">{activeSubpanel?.description || '在這裡分段處理整體造型、單件、鞋襪與配件。'}</p>
        </div>
      </div>
      {isOutfitPresetActive ? (
        <div className="context-note">
          套裝預設已接管主要服裝輪廓，和它重疊的上身、下身單件欄位會自動停用，避免 prompt 互相打架。
        </div>
      ) : null}
      {renderControlGrid(filterControlsByKeys(wardrobeLockControls, activeSubpanel?.keys || []))}
    </div>
  );

  const renderEditorPanel = () => {
    if (activeSection === 'scene') return renderSceneControls();
    if (activeSection === 'wardrobe') return renderWardrobeControls();
    return renderCharacterControls();
  };

  if (isMobileFavoritesMode) {
    return (
      <>
        <section className="page1-mobile-shell">
          <div className="page1-mobile-header lock-panel">
            <div className="lock-title">PAGE1 Favorites</div>
            <p className="lock-subtitle">手機版先保留最愛卡片瀏覽與複製，完整編輯工作台請使用桌機開啟。</p>
          </div>

          <section className="page1-mobile-favorites lock-panel">
            <div className="control-section-header">
              <div>
                <div className="control-section-title">Favorites Library</div>
                <p className="workspace-panel-copy">你可以在手機上快速查看、複製與回填最常用的 prompt 卡片。</p>
              </div>
            </div>

            <div className="filter-bar">
              <div className="results-meta">{favoritePrompts.length} favorites</div>
              <div className="tab-row">
                <button className="secondary" onClick={handleDownloadAll} disabled={favoritePrompts.length === 0}>
                  Download
                </button>
                <button className="secondary danger" onClick={handleClearFavorites} disabled={favoritePrompts.length === 0}>
                  Clear Favorites
                </button>
              </div>
            </div>

            <div className="page1-mobile-card-list">
              {favoritePrompts.length === 0 ? (
                <div className="empty-state">目前還沒有最愛卡片。桌機版保存後，手機這裡就會直接看到。</div>
              ) : (
                favoritePrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    data={prompt}
                    isFavorite={favoriteIds.has(prompt.id)}
                    canRestore={favoriteIds.has(prompt.id)}
                    onFavorite={toggleFavorite}
                    onDelete={handleDeletePrompt}
                    onRemix={handleRemixPrompt}
                    onRestore={handleRestorePromptToConsole}
                    summarySectionInfo={summarySectionInfo}
                    advancedRemixGroupInfo={advancedRemixGroupInfo}
                  />
                ))
              )}
            </div>
          </section>
        </section>

        {isImportPromptOpen ? (
          <div className="modal-backdrop" onClick={() => setIsImportPromptOpen(false)}>
            <div className="modal-panel prompt-import-modal" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div className="lock-title">標準格式回填</div>
                  <p className="lock-subtitle">貼上本工具輸出的標準 Prompt，系統會盡可能回填到 PAGE1 主控台。</p>
                </div>
              </div>

              <label className="field">
                <span>Prompt 內容</span>
                <textarea
                  className="text-input prompt-import-textarea"
                  value={importPromptText}
                  onChange={(event) => setImportPromptText(event.target.value)}
                  placeholder="貼上 Midjourney、Grok Structured Prompt，或本工具匯出的標準格式內容"
                />
              </label>

              <div className="modal-actions">
                <button className="secondary" onClick={() => setIsImportPromptOpen(false)}>
                  取消
                </button>
                <button className="primary-cta" onClick={handleApplyImportedPrompt} disabled={!importPromptText.trim()}>
                  確認回填
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      <section className="page1-workspace-shell">
        <aside className="page1-sidebar lock-panel">
          <div className="page1-sidebar-header">
            <div className="lock-title">Prompt Workspace</div>
            <p className="lock-subtitle">目前鎖定 {activeLockCount} 個條件。左邊看階段、中間編輯、右邊直接校對 prompt。</p>
          </div>

          <div className="page1-section-nav">
            {WORKSPACE_SECTIONS.map((section) => {
              const snapshot = workspaceSummary[section.id];
              return (
                <button
                  key={section.id}
                  type="button"
                  className={`page1-section-card ${activeSection === section.id ? 'page1-section-card-active' : ''}`}
                  onClick={() => {
                    setActiveSection(section.id);
                    setActiveSubpanels((prev) => ({
                      ...prev,
                      [section.id]: prev[section.id] || SECTION_SUBPANELS[section.id]?.[0]?.id || '',
                    }));
                  }}
                >
                  <span className="page1-section-label">{section.label}</span>
                  <strong className="page1-section-value">{snapshot.summary}</strong>
                  {snapshot.meta ? <span className="page1-section-meta">{snapshot.meta}</span> : null}
                </button>
              );
            })}
          </div>

          <div className="page1-sidebar-actions">
            <button className="primary-cta" onClick={handleGenerate} disabled={!previewPrompt}>
              Save Current Card
            </button>
            <button className="secondary" onClick={() => updateLocks(createEmptyLocks())}>
              全部隨機
            </button>
            <button className="secondary subtle-action" onClick={() => updateLocks(buildAllNoneLocks(lockControls, locks))}>
              全部全無
            </button>
            <button className="secondary" onClick={() => setIsImportPromptOpen(true)}>
              回填 Prompt
            </button>
          </div>
        </aside>

        <section className="page1-editor lock-panel">
          <div className="page1-editor-header">
            <div>
              <div className="lock-title">{activeSectionConfig.label}</div>
              <p className="lock-subtitle">一次只處理一小段，避免 prompt 在太多欄位之間互相干擾。</p>
            </div>
          </div>

          <div className="page1-subpanel-tabs">
            {sectionSubpanels.map((panel) => (
              <button
                key={panel.id}
                type="button"
                className={`page1-subpanel-tab ${activeSubpanel?.id === panel.id ? 'page1-subpanel-tab-active' : ''}`}
                onClick={() => setActiveSubpanels((prev) => ({ ...prev, [activeSection]: panel.id }))}
              >
                <span className="page1-subpanel-label">{panel.label}</span>
              </button>
            ))}
          </div>

          {activeSubpanel ? (
            <div className="page1-subpanel-summary">
              <div className="page1-subpanel-summary-title">{activeSubpanel.label}</div>
              <div className="page1-subpanel-summary-copy">{activeSubpanel.description}</div>
            </div>
          ) : null}

          {renderEditorPanel()}
        </section>

        <aside className="page1-preview-column">
          <section className="page1-preview-panel lock-panel">
            <div className="control-section-header">
              <div>
                <div className="control-section-title">Live Prompt Preview</div>
                <p className="workspace-panel-copy">右側只保留 prompt 本體與複製操作，選項摘要請直接看左側工作台。</p>
              </div>
            </div>

            <div className="primary-action-row page1-preview-actions">
              <button className="primary-copy-btn primary-copy-grok" onClick={() => handleCopyText('Grok copied', previewPrompt?.grokPrompt)} disabled={!previewPrompt?.grokPrompt}>
                Grok
              </button>
              <button className="primary-copy-btn primary-copy-zimage" onClick={() => handleCopyText('Z-Image copied', previewPrompt?.zImagePrompt)} disabled={!previewPrompt?.zImagePrompt}>
                Z-Image
              </button>
              <button className="primary-copy-btn primary-copy-midjourney" onClick={() => handleCopyText('Midjourney copied', previewPrompt?.midjourneyPrompt)} disabled={!previewPrompt?.midjourneyPrompt}>
                AI
              </button>
            </div>

            <div className="prompt-box page1-live-prompt-box">
              <div className="prompt-text prompt-text-full">{previewPrompt?.grokPrompt || '目前尚無可顯示的 Grok Prompt。'}</div>
            </div>
          </section>

          <section className="page1-feed-panel lock-panel page1-feed-panel-muted">
            <div className="control-section-header">
              <div>
                <div className="control-section-title">Saved Cards</div>
                <p className="workspace-panel-copy">這裡是版本庫，不是主編輯區。需要時再回頭比對、收藏或 remix 即可。</p>
              </div>
            </div>

            <div className="tab-row">
              <button className={viewMode === 'feed' ? 'tab-primary-active' : 'secondary'} onClick={() => setViewMode('feed')}>
                Feed ({prompts.length})
              </button>
              <button className={viewMode === 'favorites' ? 'tab-primary-active' : 'secondary'} onClick={() => setViewMode('favorites')}>
                Favorites ({favoritePrompts.length})
              </button>
            </div>

            <div className="filter-bar">
              <div className="results-meta">{displayPrompts.length} results</div>
              <div className="tab-row">
                <button className="secondary" onClick={handleDownloadAll} disabled={displayPrompts.length === 0}>
                  Download
                </button>
                {viewMode === 'favorites' ? (
                  <button className="secondary danger" onClick={handleClearFavorites} disabled={favoritePrompts.length === 0}>
                    Clear Favorites
                  </button>
                ) : (
                  <button className="secondary danger" onClick={() => setPrompts([])} disabled={prompts.length === 0}>
                    Clear Feed
                  </button>
                )}
                <button className="secondary" onClick={handleOpenImportFeed}>
                  Import
                </button>
              </div>
              <input
                ref={importFeedInputRef}
                type="file"
                accept=".zip,application/zip"
                style={{ display: 'none' }}
                onChange={handleImportFeed}
              />
            </div>

            <div className="page1-feed-list">
              {displayPrompts.length === 0 ? (
                <div className="empty-state">先在左側調整條件，然後用 Save Current Card 保存你要的版本。</div>
              ) : (
                displayPrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    data={prompt}
                    isFavorite={favoriteIds.has(prompt.id)}
                    canRestore={favoriteIds.has(prompt.id)}
                    onFavorite={toggleFavorite}
                    onDelete={handleDeletePrompt}
                    onRemix={handleRemixPrompt}
                    onRestore={handleRestorePromptToConsole}
                    summarySectionInfo={summarySectionInfo}
                    advancedRemixGroupInfo={advancedRemixGroupInfo}
                  />
                ))
              )}
            </div>
          </section>
        </aside>
      </section>

      {isImportPromptOpen ? (
        <div className="modal-backdrop" onClick={() => setIsImportPromptOpen(false)}>
          <div className="modal-panel prompt-import-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="lock-title">標準格式回填</div>
                <p className="lock-subtitle">貼上本工具輸出的標準 Prompt，系統會盡可能回填到 PAGE1 主控台。</p>
              </div>
            </div>

            <label className="field">
              <span>Prompt 內容</span>
              <textarea
                className="text-input prompt-import-textarea"
                value={importPromptText}
                onChange={(event) => setImportPromptText(event.target.value)}
                placeholder="貼上 Midjourney、Grok Structured Prompt，或本工具匯出的標準格式內容"
              />
            </label>

            <div className="modal-actions">
              <button className="secondary" onClick={() => setIsImportPromptOpen(false)}>
                取消
              </button>
              <button className="primary-cta" onClick={handleApplyImportedPrompt} disabled={!importPromptText.trim()}>
                確認回填
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <LightingReferenceModal open={isLightingReferenceOpen} onClose={() => setIsLightingReferenceOpen(false)} />
    </>
  );
}
