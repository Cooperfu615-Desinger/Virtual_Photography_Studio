import React from 'react';
import { BookPlus, Download, FolderUp, X, Trash2 } from 'lucide-react';

export default function CustomLibraryModal({
  isOpen,
  onClose,
  customLibraryInputRef,
  onImportClick,
  onExport,
  knowledgeBaseOptions,
  customForm,
  updateCustomGroup,
  setCustomForm,
  selectedCategories,
  onAddCustomEntry,
  customLibrary,
  onDeleteEntry,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="lock-title">
              <BookPlus size={18} />
              Custom Library
            </div>
            <p className="lock-subtitle">把低頻管理功能收進這裡，主畫面只保留高頻生成操作。</p>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <input ref={customLibraryInputRef} className="hidden-input" type="file" accept="application/json" onChange={onImportClick} />

        <div className="inline-actions modal-actions">
          <button className="secondary" onClick={() => customLibraryInputRef.current?.click()}>
            <FolderUp size={16} />
            Import JSON
          </button>
          <button className="secondary" onClick={onExport} disabled={customLibrary.length === 0}>
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

        <div className="inline-actions">
          <button onClick={onAddCustomEntry}>
            <BookPlus size={16} />
            Add to Library
          </button>
        </div>

        <div className="custom-list modal-list">
          {customLibrary.length === 0 ? (
            <div className="empty-inline">還沒有自訂詞條。新增後會自動納入生成器。</div>
          ) : (
            customLibrary.map((entry) => (
              <div key={entry.id} className="custom-item">
                <div>
                  <strong>{entry.zh}</strong>
                  <p>
                    {entry.group} / {entry.category}
                  </p>
                  <code>{entry.en}</code>
                </div>
                <button className="icon-btn" onClick={() => onDeleteEntry(entry.id)} title="Delete custom entry">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
