import { useMemo } from 'react';
import DllPicProPanel from './DllPicProPanel';
import PromptPreviewCard from './PromptPreviewCard';
import {
  CHARACTER_CARD_LAYER_KEYS,
  getCompatibleHairVariants,
  normalizeCharacterCardVariant,
  resolveCharacterCard,
} from '../lib/characterCardLab';

export default function Page2Workspace({
  characterCards,
  profile,
  setProfile,
  promptBundle,
  onCopyText,
  onSaveCard,
  onApplyToPage1,
}) {
  const activeCard = resolveCharacterCard(characterCards, profile.characterProfileId);
  const hairVariants = useMemo(() => getCompatibleHairVariants(activeCard), [activeCard]);
  const layerEntries = CHARACTER_CARD_LAYER_KEYS
    .map((key) => activeCard?.defaultWardrobeLayers?.[key])
    .filter(Boolean);
  const includedLayers = new Set(profile.includedWardrobeLayers || []);
  const outputs = promptBundle.outputs || [];

  const updateProfile = (patch) => {
    setProfile((prev) => normalizeCharacterCardVariant({ ...prev, ...patch }, characterCards));
  };

  const toggleLayer = (layerKey) => {
    const next = includedLayers.has(layerKey)
      ? profile.includedWardrobeLayers.filter((key) => key !== layerKey)
      : [...profile.includedWardrobeLayers, layerKey];
    updateProfile({
      includedWardrobeLayers: next,
      outputMode: next.length > 0 ? 'included-wardrobe' : 'pure-character',
    });
  };

  return (
    <section className="page2-shell character-card-lab-shell">
      <section className="lock-panel page2-panel character-card-lab-editor">
        <div className="lock-panel-header">
          <div>
            <div className="lock-title">Character Card Lab</div>
            <p className="lock-subtitle">選擇內建角色卡，設定髮型變化與要匯回 PAGE1 的預設服裝 layer。</p>
          </div>
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div className="control-section-title">角色卡</div>
          </div>
          <div className="character-card-grid">
            {characterCards.map((card) => (
              <button
                key={card.id}
                type="button"
                className={profile.characterProfileId === card.id ? 'character-card-option active' : 'character-card-option'}
                onClick={() => updateProfile({
                  characterProfileId: card.id,
                  hairVariantId: 'default',
                  includedWardrobeLayers: Object.keys(card.defaultWardrobeLayers),
                  outputMode: 'included-wardrobe',
                })}
              >
                {card.primaryReferenceImage ? (
                  <img src={`${import.meta.env.BASE_URL}${card.primaryReferenceImage}`} alt={card.label} />
                ) : null}
                <span>{card.label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeCard ? (
          <>
            <div className="control-section">
              <div className="control-section-header">
                <div className="control-section-title">人物與髮型</div>
              </div>
              <div className="character-card-summary">
                <strong>{activeCard.label}</strong>
                <p>{activeCard.identityAndBody}</p>
                <p>{activeCard.baseHair}</p>
              </div>
              <label className="field">
                <span>髮型變化</span>
                <select value={profile.hairVariantId} onChange={(event) => updateProfile({ hairVariantId: event.target.value })}>
                  {hairVariants.map((variant) => (
                    <option key={variant.id} value={variant.id}>{variant.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="control-section">
              <div className="control-section-header">
                <div className="control-section-title">服裝帶入 PAGE1</div>
              </div>
              <div className="character-card-layer-list">
                {layerEntries.map((layer) => (
                  <button
                    key={layer.key}
                    type="button"
                    className={includedLayers.has(layer.key) ? 'character-card-layer active' : 'character-card-layer'}
                    onClick={() => toggleLayer(layer.key)}
                  >
                    <span>{layer.label}</span>
                    <small>{layer.prompt}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="control-section">
              <div className="control-section-header">
                <div className="control-section-title">進階 Prompt Override</div>
              </div>
              <label className="field">
                <span>臨時角色描述</span>
                <textarea
                  className="text-input page2-prompt-textarea"
                  rows={4}
                  value={profile.promptOverrideText}
                  onChange={(event) => updateProfile({ promptOverrideText: event.target.value })}
                  placeholder="可留空。填寫後會作為本次角色卡變體的臨時補充描述匯回 PAGE1。"
                />
              </label>
            </div>
          </>
        ) : null}

        <div className="control-actions">
          <div className="control-actions-main">
            <button className="primary-cta" onClick={onApplyToPage1} disabled={!activeCard}>
              匯回 PAGE1
            </button>
            <button className="secondary" onClick={onSaveCard} disabled={!outputs.length}>
              加入 Saved Cards
            </button>
          </div>
        </div>
      </section>

      <section className="lock-panel page2-output-panel reference-output-panel">
        <div className="reference-output-header">
          <div>
            <div className="control-section-title">Character Card Outputs</div>
            <p className="workspace-panel-copy">六組 prompt 可複製使用，也可交給 DLL PIC Pro 直接生成角色 reference。</p>
          </div>
          <span className="reference-output-count">{outputs.length} outputs</span>
        </div>
        <div className="prompt-preview-grid">
          {outputs.map((card, index) => (
            <PromptPreviewCard
              key={card.id}
              title={card.label}
              eyebrow="Character"
              value={card.value}
              placeholder={`${card.label} 尚未生成`}
              description=""
              copyLabel={`${card.label} copied`}
              fullWidth={outputs.length % 2 === 1 && index === outputs.length - 1}
              onCopy={(text) => onCopyText(`${card.label} copied`, text)}
            />
          ))}
        </div>
        <DllPicProPanel
          title="DLL_PIC Pro"
          description="用角色卡 prompt 直接生成大頭照、四視圖或全身 reference。"
          promptSources={outputs.map((output) => ({ id: output.id, label: output.label, value: output.value }))}
          defaultSourceId="full-body-reference"
        />
      </section>
    </section>
  );
}
