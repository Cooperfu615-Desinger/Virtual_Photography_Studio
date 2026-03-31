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
  createEmptyProfile,
}) {
  return (
    <section className="page3-shell">
      <section className="lock-panel page3-panel">
        <div className="lock-panel-header">
          <div>
            <div className="lock-title">Page3 Scene Profile</div>
            <p className="lock-subtitle">專門建立無人物的純場景與世界觀，從小空間到史詩級大景都能獨立生成。</p>
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
            <div className="control-section-title">Scene Prompt</div>
          </div>
          <textarea
            className="text-input page2-prompt-textarea"
            value={prompt}
            readOnly
            placeholder="這裡會生成通用型純場景 prompt。"
          />
          <p className="context-note">
            PAGE3 完全獨立於 PAGE1 與 PAGE2，預設會強調空景、無人物、無人類主體，適合做環境 reference、世界觀設定與純場景生成。
          </p>
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div className="control-section-title">Cinematic Prompt</div>
          </div>
          <textarea
            className="text-input page2-prompt-textarea"
            value={cinematicPrompt}
            readOnly
            placeholder="這裡會生成更強調大景、氣勢與電影感的場景 prompt。"
          />
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div className="control-section-title">World Prompt</div>
          </div>
          <textarea
            className="text-input page2-prompt-textarea"
            value={worldPrompt}
            readOnly
            placeholder="這裡會生成更偏世界觀概念設計與環境設定的 prompt。"
          />
          <p className="context-note">
            World Prompt 會比一般 Scene Prompt 更偏概念設計、文明尺度、空間邏輯與世界觀氣氛，適合大景、奇幻、未來與超現實方向。
          </p>
        </div>
      </section>
    </section>
  );
}
