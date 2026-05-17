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
            <p className="lock-subtitle">以真實城市錨點建立街拍空景、城市攝影與高視角地景 prompt。</p>
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
            <div className="control-section-title">Scene Prompt</div>
          </div>
          <textarea
            className="text-input page2-prompt-textarea"
            value={prompt}
            readOnly
            placeholder="這裡會生成世界街景攝影 prompt。"
          />
          <p className="context-note">
            PAGE3 目前獨立於 PAGE1，專注街拍空景、城市地標攝影與高視角地景；街拍模式允許路人與交通作為城市生活痕跡，但不設定明確人物主體。
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
            placeholder="這裡會生成更強調電影感構圖與空間層次的城市場景 prompt。"
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
            placeholder="這裡會生成更偏城市地理、街區文化與環境邏輯的 prompt。"
          />
          <p className="context-note">
            World Prompt 會比一般 Scene Prompt 更強調地點關係、街區文化與城市空間邏輯，適合做城市 reference 或空景系列。
          </p>
        </div>
      </section>
    </section>
  );
}
