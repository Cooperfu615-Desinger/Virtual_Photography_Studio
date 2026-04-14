import PromptCard from './PromptCard';
import SelectControlField from './SelectControlField';

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
  genCount,
  setGenCount,
  handleGenerate,
  prompts,
  setPrompts,
  createEmptyLocks,
  buildAllNoneLocks,
  lockControls,
  viewMode,
  setViewMode,
  favoritePrompts,
  libraryDraft,
  libraryDraftChangeCount,
  handleGenerateLibraryTest,
  handleCopyLibraryDraftSummary,
  libraryDraftSummary,
  handleResetLibraryDraft,
  displayPrompts,
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
  knowledgeBaseOptions,
  effectiveLibraryGroup,
  handleLibraryGroupChange,
  libraryCategories,
  effectiveLibraryCategory,
  handleLibraryCategoryChange,
  librarySearch,
  setLibrarySearch,
  libraryEntries,
  selectedLibraryEntry,
  editorMode,
  handleSelectLibraryEntry,
  editorDraft,
  setEditorDraft,
  handleCreateNewEntry,
  handleSaveLibraryEntry,
  favoriteIds,
  toggleFavorite,
  handleDeletePrompt,
  handleRemixPrompt,
  handleRestorePromptToConsole,
  summarySectionInfo,
  advancedRemixGroupInfo,
}) {
  return (
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
                  disabled={isCloseupMode && !closeupAllowedKeys.has(control.key)}
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
                    ||
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
                    (isCloseupMode && !closeupAllowedKeys.has(control.key))
                    ||
                    (['topColorId', 'bottomColorId'].includes(control.key) && Boolean(locks.topBottomPaletteId) && !isNoneSelected('topBottomPaletteId', locks.topBottomPaletteId, wardrobeLockControls))
                    ||
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
              <button className="secondary" onClick={() => updateLocks(createEmptyLocks())}>
                All Random
              </button>
              <button className="secondary subtle-action" onClick={() => updateLocks(buildAllNoneLocks(lockControls, locks))}>
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
          <button className="secondary" onClick={() => setIsImportPromptOpen(true)}>
            回填 Prompt
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
            <div className="results-meta">{displayPrompts.length} results</div>
          </div>
        )}

        {viewMode !== 'library' ? (
          <div className="tab-row">
            <button className="secondary" onClick={handleDownloadAll} disabled={displayPrompts.length === 0}>
              Download Feed
            </button>
            {viewMode === 'favorites' ? (
              <button className="secondary danger" onClick={handleClearFavorites} disabled={favoritePrompts.length === 0}>
                Clear Favorites {favoritePrompts.length > 0 ? `(${favoritePrompts.length})` : ''}
              </button>
            ) : null}
            <button className="secondary" onClick={handleOpenImportFeed}>
              Import Feed
            </button>
            <input
              ref={importFeedInputRef}
              type="file"
              accept=".zip,application/zip"
              style={{ display: 'none' }}
              onChange={handleImportFeed}
            />
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
            <div className="empty-state">先設定條件，再開始批次生成。</div>
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
      )}

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
