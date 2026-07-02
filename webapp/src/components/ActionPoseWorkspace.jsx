import DllPicProPanel from './DllPicProPanel';
import PromptPreviewCard from './PromptPreviewCard';
import {
  ACTION_POSE_MODES,
  getActionPoseCardsByMode,
  normalizeActionPoseProfile,
} from '../lib/actionPoseLab';

export default function ActionPoseWorkspace({
  profile,
  setProfile,
  promptBundle,
  onCopyText,
  onSaveCard,
  onApplyToPage1,
  canApplyToPage1 = true,
}) {
  const normalizedProfile = normalizeActionPoseProfile(profile);
  const selectedCard = promptBundle.card;
  const actionCards = getActionPoseCardsByMode('single');
  const outputs = [
    {
      title: 'Action Prompt',
      eyebrow: 'Action',
      value: promptBundle.actionPrompt,
      placeholder: '尚未選擇動作卡。',
      description: '',
      copyLabel: 'Action Prompt copied',
      variant: 'prompt',
    },
    {
      title: 'Expression',
      eyebrow: 'Expression',
      value: promptBundle.expressionPrompt,
      placeholder: '尚未選擇動作卡。',
      description: '',
      copyLabel: 'Expression copied',
      variant: 'prompt',
    },
    {
      title: 'Negative Guard',
      eyebrow: 'Guard',
      value: promptBundle.negativePoseGuard,
      placeholder: '尚未選擇動作卡。',
      description: '',
      copyLabel: 'Negative Guard copied',
      variant: 'prompt',
    },
    {
      title: 'Framing Hint',
      eyebrow: 'Framing',
      value: promptBundle.framingHint,
      placeholder: '尚未選擇動作卡。',
      description: '',
      copyLabel: 'Framing Hint copied',
      variant: 'prompt',
    },
  ];

  const updateProfile = (patch) => {
    setProfile((prev) => normalizeActionPoseProfile({ ...prev, ...patch }));
  };

  return (
    <section className="action-pose-shell">
      <section className="lock-panel action-pose-panel">
        <div className="lock-panel-header">
          <div>
            <div className="lock-title">Action Pose Lab</div>
            <p className="lock-subtitle">情緒情境驅動的動作姿勢卡。</p>
          </div>
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div className="control-section-title">模式</div>
          </div>
          <div className="segmented-control action-pose-mode-control" role="group" aria-label="Action pose mode">
            {ACTION_POSE_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={normalizedProfile.mode === mode.id ? 'segmented-control-active' : 'secondary'}
                disabled={!mode.enabled}
                onClick={() => updateProfile({ mode: mode.id })}
                title={mode.enabled ? mode.label : 'Coming soon'}
              >
                {mode.label}{mode.enabled ? '' : ' · Coming soon'}
              </button>
            ))}
          </div>
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div>
              <div className="control-section-title">動作卡</div>
              <p className="workspace-panel-copy">單人動作卡</p>
            </div>
          </div>
          <div className="action-pose-card-list">
            {actionCards.map((card) => (
              <button
                key={card.id}
                type="button"
                className={normalizedProfile.selectedCardId === card.id ? 'action-pose-card active' : 'action-pose-card'}
                onClick={() => updateProfile({ selectedCardId: card.id })}
              >
                <span className="action-pose-card-category">{card.category}</span>
                <strong>{card.title}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="control-actions">
          <div className="control-actions-main">
            <button
              className="primary-cta"
              onClick={onApplyToPage1}
              disabled={!selectedCard || normalizedProfile.mode !== 'single' || !canApplyToPage1}
              title={canApplyToPage1 ? '匯回 PAGE1' : 'PAGE1 目前是雙人模式'}
            >
              匯回 PAGE1
            </button>
            <button className="secondary" onClick={onSaveCard} disabled={!selectedCard}>
              加入 Saved Cards
            </button>
          </div>
        </div>
      </section>

      <section className="lock-panel action-pose-output-panel reference-output-panel">
        <div className="reference-output-header">
          <div>
            <div className="control-section-title">Action Pose Outputs</div>
            <p className="workspace-panel-copy">Action Prompt / Expression / Negative Guard / Framing Hint</p>
          </div>
          <span className="reference-output-count">{outputs.length} outputs</span>
        </div>
        <div className="prompt-preview-grid">
          {outputs.map((card) => (
            <PromptPreviewCard
              key={card.title}
              {...card}
              onCopy={(text) => onCopyText(card.copyLabel, text)}
            />
          ))}
        </div>
        <DllPicProPanel
          title="DLL_PIC Pro"
          description="動作參考圖 prompt。"
          promptSources={outputs
            .filter((card) => card.value)
            .map((card) => ({ id: card.title, label: card.title, value: card.value }))}
          defaultSourceId="Action Prompt"
        />
      </section>
    </section>
  );
}
