export default function Page3Workspace({
  fieldConfig,
  fieldOptions,
  profile,
  setProfile,
  summary,
  anchor,
  prompt,
  cinematicPrompt,
  worldPrompt,
  onCopyText,
  onSaveCard,
  createEmptyProfile,
}) {
  return (
    <section className="page3-shell">
      <section className="lock-panel page3-panel">
        <div className="lock-panel-header">
          <div>
            <div className="lock-title">Page3 World Street Scene</div>
            <p className="lock-subtitle">以攝影作品、器材、拍攝手法、取景方式與真實城市錨點建立自然語言場景 prompt。</p>
          </div>
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div className="control-section-title">Scene Builder</div>
          </div>
          <div className="lock-grid detail-lock-grid">
            {fieldConfig.map((field) => (
              <label key={field.key} className="field">
                <span>{field.label}</span>
                <select
                  className={!profile[field.key] ? 'select-muted' : ''}
                  value={profile[field.key]}
                  onChange={(event) => setProfile((prev) => ({ ...prev, [field.key]: event.target.value }))}
                >
                  {fieldOptions[field.key].map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.zh}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        <div className="control-actions">
          <div className="control-actions-main">
            <button className="secondary" onClick={() => onCopyText('Scene anchor copied', anchor)} disabled={!anchor}>
              複製 Scene Anchor
            </button>
            <button className="secondary" onClick={() => onCopyText('Scene prompt copied', prompt)} disabled={!prompt}>
              複製 Scene Prompt
            </button>
            <button className="secondary" onClick={() => onCopyText('Cinematic prompt copied', cinematicPrompt)} disabled={!cinematicPrompt}>
              複製 Cinematic Prompt
            </button>
            <button className="secondary" onClick={() => onCopyText('World prompt copied', worldPrompt)} disabled={!worldPrompt}>
              複製 World Prompt
            </button>
            <button className="primary-cta" onClick={onSaveCard} disabled={!prompt}>
              加入 Saved Cards
            </button>
            <button className="secondary" onClick={() => setProfile(createEmptyProfile())}>
              清空選項
            </button>
          </div>
        </div>
      </section>

      <section className="lock-panel page3-output-panel">
        <div className="control-section">
          <div className="control-section-header">
            <div className="control-section-title">場景摘要</div>
          </div>
          <div className="page2-output-card">
            {summary || '尚未選擇場景條件。'}
          </div>
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div className="control-section-title">Scene Anchor</div>
          </div>
          <textarea
            className="text-input page2-prompt-textarea"
            value={anchor}
            readOnly
            placeholder="選擇場景條件後，這裡會生成短版場景錨點。"
          />
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div>
              <div className="control-section-title">Scene Prompt</div>
              <p className="workspace-panel-copy">以街頭攝影、器材痕跡與自然取景為主，適合生成日常感、隨手感或旅行紀實場景。</p>
            </div>
          </div>
          <textarea
            className="text-input page2-prompt-textarea"
            value={prompt}
            readOnly
            placeholder="這裡會生成世界街景攝影 prompt。"
          />
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div>
              <div className="control-section-title">Cinematic Prompt</div>
              <p className="workspace-panel-copy">在同一地點基礎上加強電影感、空間層次與前中後景關係，適合更有敘事張力的城市畫面。</p>
            </div>
          </div>
          <textarea
            className="text-input page2-prompt-textarea"
            value={cinematicPrompt}
            readOnly
            placeholder="這裡會生成更強調電影感構圖與空間層次的城市場景 prompt。"
          />
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div>
              <div className="control-section-title">World Prompt</div>
              <p className="workspace-panel-copy">強調城市地理、街區文化與環境邏輯，適合建立地點 reference、空景系列或世界觀場景。</p>
            </div>
          </div>
          <textarea
            className="text-input page2-prompt-textarea"
            value={worldPrompt}
            readOnly
            placeholder="這裡會生成更偏城市地理、街區文化與環境邏輯的 prompt。"
          />
        </div>
      </section>
    </section>
  );
}
