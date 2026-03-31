export default function Page2Workspace({
  fieldConfig,
  fieldOptions,
  profile,
  setProfile,
  profileSummary,
  profileAnchor,
  viewPrompts,
  masterPrompt,
  promptBundle,
  onCopyText,
  createEmptyProfile,
}) {
  return (
    <section className="page2-shell">
      <section className="lock-panel page2-panel">
        <div className="lock-panel-header">
          <div>
            <div className="lock-title">Page2 Character Profile</div>
            <p className="lock-subtitle">用簡潔的五官與妝容選項，先建立穩定可重複使用的角色。</p>
          </div>
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div className="control-section-title">Face Builder</div>
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
            <button className="secondary" onClick={() => onCopyText('Face anchor copied', profileAnchor)} disabled={!profileAnchor}>
              複製 Face Anchor
            </button>
            <button className="secondary" onClick={() => onCopyText('Master sheet prompt copied', masterPrompt)} disabled={!masterPrompt}>
              複製 Master Sheet
            </button>
            <button className="secondary" onClick={() => onCopyText('All Page2 prompts copied', promptBundle)} disabled={!promptBundle}>
              複製全部 Prompt
            </button>
            <button className="secondary" onClick={() => setProfile(createEmptyProfile())}>
              清空選項
            </button>
          </div>
        </div>
      </section>

      <section className="lock-panel page2-output-panel">
        <div className="control-section">
          <div className="control-section-header">
            <div className="control-section-title">角色摘要</div>
          </div>
          <div className="page2-output-card">
            {profileSummary || '尚未選擇角色特徵。'}
          </div>
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div className="control-section-title">Face Anchor</div>
          </div>
          <textarea
            className="text-input page2-prompt-textarea"
            value={profileAnchor}
            readOnly
            placeholder="選擇五官與妝容後，這裡會生成角色鎖臉用的短錨點。"
          />
          <p className="context-note">
            Page2 目前不會再直接干擾 PAGE1。這裡專門生成多視角鎖臉參考圖 prompt，方便你先做角色 reference。
          </p>
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div className="control-section-title">Reference Views</div>
          </div>
          <div className="library-editor-form">
            <label className="field">
              <span>Master Sheet</span>
              <textarea
                className="text-input page2-prompt-textarea"
                value={masterPrompt}
                readOnly
                placeholder="這裡會生成一張包含多視角的主 reference sheet prompt。"
              />
            </label>
            {viewPrompts.map((item) => (
              <label key={item.key} className="field">
                <span>{item.label}</span>
                <textarea
                  className="text-input page2-prompt-textarea"
                  value={item.prompt}
                  readOnly
                />
                <div className="inline-actions">
                  <button className="secondary" onClick={() => onCopyText(`${item.label} 參考 prompt 已複製`, item.prompt)}>
                    複製 {item.label}
                  </button>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div className="control-section-title">Prompt Bundle</div>
          </div>
          <textarea
            className="text-input page2-prompt-textarea"
            value={promptBundle}
            readOnly
            placeholder="這裡會整理 Face Anchor、Master Sheet 與所有視角 prompt，方便一次複製。"
          />
        </div>
      </section>
    </section>
  );
}
