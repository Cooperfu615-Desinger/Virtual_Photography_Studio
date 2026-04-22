import { useMemo, useState } from 'react';
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

function buildSectionSnapshot(previewPrompt, summaryKey, metaKey) {
  const summary = previewPrompt?.summaryFields?.[summaryKey] || '尚未形成明確選項';
  const meta = metaKey ? (previewPrompt?.summaryFields?.[metaKey] || '') : '';
  return { summary, meta };
}

function buildWorkspaceSummary(previewPrompt) {
  return {
    character: buildSectionSnapshot(previewPrompt, 'characterDna', 'expressionPose'),
    wardrobe: buildSectionSnapshot(previewPrompt, 'wardrobe', null),
    scene: buildSectionSnapshot(previewPrompt, 'sceneLook', null),
  };
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

  const workspaceSummary = useMemo(() => buildWorkspaceSummary(previewPrompt), [previewPrompt]);

  const renderSceneControls = () => (
    <div className="control-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Scene & Camera Language</div>
          <p className="workspace-panel-copy">先決定構圖、場景與光線，右側會同步反映成目前可直接使用的 Grok prompt。</p>
        </div>
        <button className="secondary reference-trigger-btn" type="button" onClick={() => setIsLightingReferenceOpen(true)}>
          查看光線定位對照
        </button>
      </div>
      <div className="lock-grid detail-lock-grid">
        {coreLockControls.map((control) => (
          <SelectControlField
            key={control.key}
            control={control}
            value={locks[control.key]}
            disabled={isCloseupMode && !closeupAllowedKeys.has(control.key)}
            onChange={(value) => updateLocks((prev) => ({ ...prev, [control.key]: value }))}
            onCopy={(text) => handleCopyText(`${control.label} copied`, text)}
          />
        ))}
      </div>
    </div>
  );

  const renderCharacterControls = () => (
    <div className="control-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Character Setup</div>
          <p className="workspace-panel-copy">把人物身份、臉部與姿態先固定下來，後面換穿搭與場景會更穩定。</p>
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
      <div className="lock-grid">
        {characterLockControls.map((control) => (
          <SelectControlField
            key={control.key}
            control={control}
            value={locks[control.key]}
            disabled={
              (isCloseupMode && !closeupAllowedKeys.has(control.key))
              || (control.key === 'poseId' && Boolean(locks.specialActionId) && !isNoneSelected('specialActionId', locks.specialActionId, characterLockControls))
              || (control.key === 'specialActionId' && Boolean(locks.poseId) && !isNoneSelected('poseId', locks.poseId, characterLockControls))
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
  );

  const renderWardrobeControls = () => (
    <div className="control-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Style & Wardrobe</div>
          <p className="workspace-panel-copy">目前 Phase 1 先保留完整欄位深度，下一階段再拆成更明確的穿搭子分類。</p>
        </div>
      </div>
      {isOutfitPresetActive ? (
        <div className="context-note">
          套裝預設已接管主要服裝輪廓，和它重疊的上身、下身單件欄位會自動停用，避免 prompt 互相打架。
        </div>
      ) : null}
      <div className="lock-grid detail-lock-grid">
        {wardrobeLockControls.map((control) => (
          <SelectControlField
            key={control.key}
            control={control}
            value={locks[control.key]}
            disabled={
              (isCloseupMode && !closeupAllowedKeys.has(control.key))
              || (['topColorId', 'bottomColorId'].includes(control.key) && Boolean(locks.topBottomPaletteId) && !isNoneSelected('topBottomPaletteId', locks.topBottomPaletteId, wardrobeLockControls))
              || (isOutfitPresetActive && OUTFIT_PRESET_COVERED_KEYS.has(control.key))
            }
            onChange={(value) => updateLocks((prev) => ({ ...prev, [control.key]: value }))}
            onCopy={(text) => handleCopyText(`${control.label} copied`, text)}
          />
        ))}
      </div>
    </div>
  );

  const renderEditorPanel = () => {
    if (activeSection === 'scene') return renderSceneControls();
    if (activeSection === 'wardrobe') return renderWardrobeControls();
    return renderCharacterControls();
  };

  return (
    <>
      <section className="page1-workspace-shell">
        <aside className="page1-sidebar lock-panel">
          <div className="page1-sidebar-header">
            <div className="lock-title">Prompt Workspace</div>
            <p className="lock-subtitle">目前鎖定 {activeLockCount} 個條件，右側會即時更新成可複製的版本。</p>
          </div>

          <div className="page1-section-nav">
            {WORKSPACE_SECTIONS.map((section) => {
              const snapshot = workspaceSummary[section.id];
              return (
                <button
                  key={section.id}
                  type="button"
                  className={`page1-section-card ${activeSection === section.id ? 'page1-section-card-active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
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
              <div className="lock-title">
                {WORKSPACE_SECTIONS.find((section) => section.id === activeSection)?.label || 'PAGE1'}
              </div>
              <p className="lock-subtitle">這裡只顯示目前正在編輯的區域，讓選項更聚焦。</p>
            </div>
          </div>

          {renderEditorPanel()}
        </section>

        <aside className="page1-preview-column">
          <section className="page1-preview-panel lock-panel">
            <div className="control-section-header">
              <div>
                <div className="control-section-title">Live Prompt Preview</div>
                <p className="workspace-panel-copy">右欄只顯示 Grok 全文，另外兩種格式保留為快速複製。</p>
              </div>
            </div>

            <div className="page1-preview-summary">
              <div className="page1-preview-summary-label">目前卡片摘要</div>
              <div className="page1-preview-summary-value">{previewPrompt?.summary || '請先選擇條件來建立預覽 prompt。'}</div>
            </div>

            <div className="primary-action-row page1-preview-actions">
              <button className="primary-copy-btn primary-copy-grok" onClick={() => handleCopyText('Grok copied', previewPrompt?.grokPrompt)} disabled={!previewPrompt?.grokPrompt}>
                Copy Grok
              </button>
              <button className="primary-copy-btn primary-copy-midjourney" onClick={() => handleCopyText('Midjourney copied', previewPrompt?.midjourneyPrompt)} disabled={!previewPrompt?.midjourneyPrompt}>
                Copy Midjourney
              </button>
              <button className="primary-copy-btn primary-copy-zimage" onClick={() => handleCopyText('Z-Image copied', previewPrompt?.zImagePrompt)} disabled={!previewPrompt?.zImagePrompt}>
                Copy Z-Image
              </button>
            </div>

            <div className="prompt-box page1-live-prompt-box">
              <div className="prompt-text prompt-text-full">{previewPrompt?.grokPrompt || '目前尚無可顯示的 Grok Prompt。'}</div>
            </div>
          </section>

          <section className="page1-feed-panel lock-panel">
            <div className="control-section-header">
              <div>
                <div className="control-section-title">Saved Cards</div>
                <p className="workspace-panel-copy">Phase 1 先保留 Feed 與 Favorites 的卡片工作流，方便你邊調整邊存版本。</p>
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
