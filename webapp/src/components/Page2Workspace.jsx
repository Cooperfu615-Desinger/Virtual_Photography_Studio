import PromptPreviewCard from './PromptPreviewCard';

export default function Page2Workspace({
  fieldConfig,
  fieldOptions,
  profile,
  setProfile,
  profileSummary,
  profileAnchor,
  viewPrompts,
  identityPrompt,
  masterPrompt,
  coreViewsBundle,
  promptBundle,
  onCopyText,
  onSaveCard,
}) {
  const promptCards = [
    {
      title: '角色摘要',
      eyebrow: 'Summary',
      value: profileSummary,
      placeholder: '尚未選擇角色特徵。',
      variant: 'summary',
      description: '',
      copyLabel: 'Character summary copied',
    },
    {
      title: 'Face Anchor',
      eyebrow: 'Anchor',
      value: profileAnchor,
      placeholder: '選擇五官與妝容後，這裡會生成角色鎖臉用的短錨點。',
      description: '短版角色錨點，適合快速貼入其他 prompt 中穩定臉部與人物辨識。',
      copyLabel: 'Face anchor copied',
    },
    {
      title: 'Identity Prompt',
      eyebrow: 'Reference',
      value: identityPrompt,
      placeholder: '這裡會生成強調同一人物身份一致性的 reference prompt。',
      description: '強調同一人物身份、臉部特徵與妝容一致性，適合建立角色 reference。',
      copyLabel: 'Identity prompt copied',
    },
    {
      title: 'Master Sheet',
      eyebrow: 'Sheet',
      value: masterPrompt,
      placeholder: '這裡會生成一張包含多視角的主 reference sheet prompt。',
      description: '用多視角參考表整理角色外觀，適合先建立穩定可重複使用的角色基底。',
      copyLabel: 'Master sheet prompt copied',
    },
    ...viewPrompts.map((item) => ({
      title: item.label,
      eyebrow: 'View',
      value: item.prompt,
      placeholder: `${item.label} reference prompt`,
      description: '單一角度 reference prompt，可用來補強角色在特定視角下的穩定性。',
      copyLabel: `${item.label} 參考 prompt 已複製`,
    })),
    {
      title: 'Core Views Bundle',
      eyebrow: 'Bundle',
      value: coreViewsBundle,
      placeholder: '這裡會整理正面、左右 45 度與正側面的核心角度 prompt。',
      description: '集中整理核心角度，適合一次生成角色基礎 reference 組。',
      copyLabel: 'Core views copied',
    },
    {
      title: 'Prompt Bundle',
      eyebrow: 'Complete',
      value: promptBundle,
      placeholder: '這裡會整理 Face Anchor、Master Sheet 與所有視角 prompt，方便一次複製。',
      description: '完整角色建模 prompt 組合，適合保存或一次複製到外部流程。',
      copyLabel: 'All Page2 prompts copied',
    },
  ];

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
            <button className="primary-cta" onClick={onSaveCard} disabled={!promptBundle}>
              加入 Saved Cards
            </button>
          </div>
        </div>
      </section>

      <section className="lock-panel page2-output-panel reference-output-panel">
        <div className="reference-output-header">
          <div>
            <div className="control-section-title">Reference Outputs</div>
            <p className="workspace-panel-copy">右側集中整理可複製、可保存的角色 reference prompt。</p>
          </div>
          <span className="reference-output-count">{promptCards.length} outputs</span>
        </div>
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
