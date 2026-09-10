import PromptPreviewCard from './PromptPreviewCard';
import '../styles/workspaceLabs.css';
import {
  normalizeObservationCaptureProfile,
} from '../lib/observationCaptureLab.js';

export default function ObservationCaptureWorkspace({
  characterCards,
  profile,
  setProfile,
  result,
  onCopyText,
  onRegenerate,
}) {
  const normalizedProfile = normalizeObservationCaptureProfile(profile, characterCards);
  const selectedCard = result.card;

  const updateProfile = (patch) => {
    setProfile((previous) => ({
      ...previous,
      ...patch,
    }));
  };

  return (
    <section className="observation-capture-shell">
      <section className="lock-panel observation-capture-panel">
        <div className="lock-panel-header">
          <div>
            <div className="lock-title">Observation Capture Lab</div>
            <p className="lock-subtitle">導入角色卡後，隨機組合一組舞台化觀察式抓拍 Prompt。</p>
          </div>
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div>
              <div className="control-section-title">角色卡</div>
              <p className="workspace-panel-copy">只讀取現有角色卡的人物身份、外觀與預設服裝，不修改 PAGE2 或 PAGE1。</p>
            </div>
          </div>
          <label className="field">
            <span>導入角色卡</span>
            <select
              value={normalizedProfile.characterProfileId}
              onChange={(event) => updateProfile({ characterProfileId: event.target.value })}
              disabled={characterCards.length === 0}
            >
              {characterCards.length === 0 ? <option value="">目前沒有可用角色卡</option> : null}
              {characterCards.map((card) => (
                <option key={card.id} value={card.id}>{card.label}</option>
              ))}
            </select>
          </label>
        </div>

        {selectedCard ? (
          <div className="observation-capture-card-preview">
            {selectedCard.primaryReferenceImage ? (
              <img
                src={`${import.meta.env.BASE_URL}${selectedCard.primaryReferenceImage}`}
                alt={selectedCard.label}
                width="320"
                height="480"
                loading="lazy"
                decoding="async"
              />
            ) : null}
            <div>
              <strong>{selectedCard.label}</strong>
              <p>{selectedCard.identityAndBody || '使用角色卡的既有人物身份描述。'}</p>
              <span>人物與服裝來源：Character Card · 只讀</span>
            </div>
          </div>
        ) : (
          <div className="observation-capture-empty-state">請先建立或選擇角色卡。</div>
        )}

        <div className="observation-capture-rule-list" aria-label="觀察式抓拍規則">
          <span>公共／半公共場景</span>
          <span>前景遮擋或反射</span>
          <span>自然生活動作</span>
          <span>手機或長焦觀察</span>
        </div>

        <div className="control-actions">
          <div className="control-actions-main">
            <button
              type="button"
              className="primary-cta"
              onClick={onRegenerate}
              disabled={!selectedCard}
            >
              隨機產生 Prompt
            </button>
          </div>
        </div>
      </section>

      <section className="lock-panel observation-capture-output-panel reference-output-panel">
        <div className="reference-output-header">
          <div>
            <div className="control-section-title">Observation Capture Prompt</div>
            <p className="workspace-panel-copy">單一專屬版本；每次重新產生會更換場景、鏡位、動作、遮擋與成像組合。</p>
          </div>
          <span className="reference-output-count">1 output</span>
        </div>

        <div className="observation-capture-summary">
          <span>本次組合</span>
          <strong>{result.summary || '尚未產生 Prompt。'}</strong>
        </div>

        <PromptPreviewCard
          title="舞台化觀察式抓拍 Prompt"
          value={result.prompt}
          placeholder="選擇角色卡後，按下「隨機產生 Prompt」。"
          description="這是獨立實驗輸出，不會改動 PAGE1 的六種 Prompt 或 Saved Cards。"
          copyLabel="Observation Capture Prompt copied"
          onCopy={(text) => onCopyText('Observation Capture Prompt copied', text)}
        />
      </section>
    </section>
  );
}
