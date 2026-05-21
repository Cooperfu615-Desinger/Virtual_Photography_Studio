import PromptPreviewCard from './PromptPreviewCard';

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
}) {
  const handleFieldChange = (key, value) => {
    setProfile((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'worldLocation' && value) next.specialLocation = '';
      if (key === 'specialLocation' && value) next.worldLocation = '';
      return next;
    });
  };

  const promptCards = [
    {
      title: '場景摘要',
      value: summary,
      placeholder: '尚未選擇場景條件。',
      variant: 'summary',
      description: '',
      copyLabel: 'Scene summary copied',
    },
    {
      title: 'Scene Anchor',
      value: anchor,
      placeholder: '選擇場景條件後，這裡會生成短版場景錨點。',
      description: '',
      copyLabel: 'Scene anchor copied',
    },
    {
      title: 'Scene Prompt',
      value: prompt,
      placeholder: '這裡會生成世界街景攝影 prompt。',
      description: '以街頭攝影、器材痕跡與自然取景為主，適合生成日常感、隨手感或旅行紀實場景。',
      copyLabel: 'Scene prompt copied',
    },
    {
      title: 'Cinematic Prompt',
      value: cinematicPrompt,
      placeholder: '這裡會生成更強調電影感構圖與空間層次的城市場景 prompt。',
      description: '在同一地點基礎上加強電影感、空間層次與前中後景關係，適合更有敘事張力的城市畫面。',
      copyLabel: 'Cinematic prompt copied',
    },
    {
      title: 'World Prompt',
      value: worldPrompt,
      placeholder: '這裡會生成更偏城市地理、街區文化與環境邏輯的 prompt。',
      description: '強調城市地理、街區文化與環境邏輯，適合建立地點 reference、空景系列或世界觀場景。',
      copyLabel: 'World prompt copied',
    },
  ];

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
                  value={profile[field.key] || ''}
                  onChange={(event) => handleFieldChange(field.key, event.target.value)}
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
            <button className="primary-cta" onClick={onSaveCard} disabled={!prompt}>
              加入 Saved Cards
            </button>
          </div>
        </div>
      </section>

      <section className="lock-panel page3-output-panel">
        <div className="prompt-preview-grid">
          {promptCards.map((card, index) => (
            <PromptPreviewCard
              key={card.title}
              {...card}
              fullWidth={promptCards.length % 2 === 1 && index === promptCards.length - 1}
              onCopy={(text) => onCopyText(card.copyLabel, text)}
            />
          ))}
        </div>
      </section>
    </section>
  );
}
