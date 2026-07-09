import { useMemo, useState } from 'react';
import DllPicProPanel from './DllPicProPanel';
import {
  CHARACTER_CARD_LAYER_KEYS,
  EYEWEAR_MODE_OPTIONS,
  getCompatibleHairVariants,
  getEffectiveCharacterCardWardrobeLayers,
  normalizeCharacterCardVariant,
  resolveCharacterCard,
} from '../lib/characterCardLab';
import { copyTextToClipboard } from '../lib/clipboard';

const CHARACTER_CARDS_PER_PAGE = 10;

const OUTPUT_COPY_LABELS = {
  gpt: 'COPY GPT',
  'grok-z-image': 'COPY Grok/Z-Image',
  ai: 'COPY AI',
  headshot: 'COPY 大頭照',
  'four-view': 'COPY 四視圖',
  'full-body-reference': 'COPY 全身 Reference',
};

function getLayerEntries(card, eyewearMode = 'default') {
  const layerMap = getEffectiveCharacterCardWardrobeLayers(card, { eyewearMode });
  return CHARACTER_CARD_LAYER_KEYS
    .map((key) => layerMap[key])
    .filter(Boolean);
}

export default function Page2Workspace({
  characterCards,
  profile,
  setProfile,
  promptBundle,
  onSaveCard,
  onApplyToPage1,
}) {
  const [cardPage, setCardPage] = useState(0);
  const [copyStatus, setCopyStatus] = useState('');
  const activeCard = resolveCharacterCard(characterCards, profile.characterProfileId);
  const hairVariants = useMemo(() => getCompatibleHairVariants(activeCard), [activeCard]);
  const layerEntries = useMemo(
    () => getLayerEntries(activeCard, profile.eyewearMode),
    [activeCard, profile.eyewearMode]
  );
  const includedLayers = new Set(profile.includedWardrobeLayers || []);
  const outputs = promptBundle.outputs || [];
  const promptGroups = [
    { id: 'primary', title: '基本 Prompt', outputs: outputs.slice(0, 3) },
    { id: 'reference', title: 'Reference Prompt', outputs: outputs.slice(3) },
  ].filter((group) => group.outputs.length > 0);
  const totalPages = Math.max(1, Math.ceil(characterCards.length / CHARACTER_CARDS_PER_PAGE));
  const safeCardPage = Math.min(cardPage, totalPages - 1);
  const visibleCards = characterCards.slice(
    safeCardPage * CHARACTER_CARDS_PER_PAGE,
    safeCardPage * CHARACTER_CARDS_PER_PAGE + CHARACTER_CARDS_PER_PAGE
  );
  const visibleStart = characterCards.length === 0 ? 0 : safeCardPage * CHARACTER_CARDS_PER_PAGE + 1;
  const visibleEnd = safeCardPage * CHARACTER_CARDS_PER_PAGE + visibleCards.length;

  const updateProfile = (patch) => {
    setProfile((prev) => normalizeCharacterCardVariant({ ...prev, ...patch }, characterCards));
  };

  const selectCharacterCard = (card) => {
    const nextLayers = getLayerEntries(card, 'default').map((layer) => layer.key);
    updateProfile({
      characterProfileId: card.id,
      hairVariantId: 'default',
      eyewearMode: 'default',
      includedWardrobeLayers: nextLayers,
      outputMode: nextLayers.length > 0 ? 'included-wardrobe' : 'pure-character',
    });
  };

  const toggleLayer = (layerKey) => {
    if (layerKey === 'eyewear' && profile.eyewearMode === 'glasses-on') return;
    const validLayerKeys = new Set(layerEntries.map((layer) => layer.key));
    const next = includedLayers.has(layerKey)
      ? (profile.includedWardrobeLayers || []).filter((key) => key !== layerKey)
      : [...(profile.includedWardrobeLayers || []), layerKey];
    const normalizedLayers = CHARACTER_CARD_LAYER_KEYS.filter((key) => validLayerKeys.has(key) && next.includes(key));
    updateProfile({
      includedWardrobeLayers: normalizedLayers,
      outputMode: normalizedLayers.length > 0 ? 'included-wardrobe' : 'pure-character',
    });
  };

  const changeEyewearMode = (eyewearMode) => {
    const validLayerKeys = new Set(getLayerEntries(activeCard, eyewearMode).map((layer) => layer.key));
    const nextLayerSet = new Set(profile.includedWardrobeLayers || []);

    if (eyewearMode === 'glasses-on') nextLayerSet.add('eyewear');
    if (eyewearMode === 'glasses-off') nextLayerSet.delete('eyewear');
    if (eyewearMode === 'default' && activeCard?.defaultWardrobeLayers?.eyewear) nextLayerSet.add('eyewear');

    const nextLayers = CHARACTER_CARD_LAYER_KEYS.filter((key) => validLayerKeys.has(key) && nextLayerSet.has(key));
    updateProfile({
      eyewearMode,
      includedWardrobeLayers: nextLayers,
      outputMode: nextLayers.length > 0 ? 'included-wardrobe' : 'pure-character',
    });
  };

  const copyOutput = (output) => {
    if (!output.value) return;
    const status = `${output.label} copied`;

    setCopyStatus('Copying...');
    window.setTimeout(async () => {
      try {
        await Promise.race([
          copyTextToClipboard(output.value),
          new Promise((_, reject) => window.setTimeout(() => reject(new Error('Copy timeout')), 1400)),
        ]);
        setCopyStatus(status);
      } catch {
        setCopyStatus('Copy failed');
      }
      window.setTimeout(() => setCopyStatus(''), 1800);
    }, 0);
  };

  return (
    <section className="page2-shell character-card-lab-shell">
      <section className="lock-panel page2-panel character-card-lab-editor character-card-lab-top">
        <div className="lock-panel-header">
          <div>
            <div className="lock-title">Character Card Lab</div>
            <p className="lock-subtitle">角色卡設定與 PAGE1 匯入控制</p>
          </div>
        </div>

        <div className="character-card-lab-top-grid">
          <div className="character-card-picker-panel">
            <div className="character-card-toolbar">
              <div className="control-section-title">選擇角色卡</div>
              <div className="character-card-page-controls" aria-label="角色卡分頁">
                <span>{visibleStart}-{visibleEnd} / {characterCards.length}</span>
                <button
                  type="button"
                  className="secondary character-card-page-btn"
                  onClick={() => setCardPage((page) => Math.max(0, page - 1))}
                  disabled={safeCardPage === 0}
                >
                  上一頁
                </button>
                <button
                  type="button"
                  className="secondary character-card-page-btn"
                  onClick={() => setCardPage((page) => Math.min(totalPages - 1, page + 1))}
                  disabled={safeCardPage >= totalPages - 1}
                >
                  下一頁
                </button>
              </div>
            </div>

            <div className="character-card-grid character-card-grid-large">
              {visibleCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={profile.characterProfileId === card.id ? 'character-card-option active' : 'character-card-option'}
                  onClick={() => selectCharacterCard(card)}
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
            <aside className="character-card-config-panel">
              <div className="character-card-selected-preview">
                {activeCard.primaryReferenceImage ? (
                  <img src={`${import.meta.env.BASE_URL}${activeCard.primaryReferenceImage}`} alt={activeCard.label} />
                ) : null}
                <strong>{activeCard.label}</strong>
              </div>

              <div className="character-card-control-group">
                <div className="control-section-title">髮型變化</div>
                <div className="character-card-chip-grid character-card-hair-grid">
                  {hairVariants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      className={profile.hairVariantId === variant.id ? 'character-card-chip active' : 'character-card-chip'}
                      onClick={() => updateProfile({ hairVariantId: variant.id })}
                    >
                      {variant.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="character-card-control-group">
                <div className="control-section-title">眼鏡</div>
                <div className="character-card-segmented">
                  {EYEWEAR_MODE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={profile.eyewearMode === option.id ? 'character-card-chip active' : 'character-card-chip'}
                      onClick={() => changeEyewearMode(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="character-card-control-group">
                <div className="control-section-title">服裝帶入 PAGE1</div>
                <div className="character-card-layer-list character-card-layer-chip-list">
                  {layerEntries.map((layer) => {
                    const lockedByEyewearMode = layer.key === 'eyewear' && profile.eyewearMode === 'glasses-on';
                    return (
                      <button
                        key={layer.key}
                        type="button"
                        className={includedLayers.has(layer.key) ? 'character-card-layer active' : 'character-card-layer'}
                        onClick={() => toggleLayer(layer.key)}
                        disabled={lockedByEyewearMode}
                      >
                        <span>{layer.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <details className="character-card-advanced">
                <summary>進階 Override</summary>
                <label className="field">
                  <span>臨時角色描述</span>
                  <textarea
                    className="text-input page2-prompt-textarea"
                    rows={4}
                    value={profile.promptOverrideText}
                    onChange={(event) => updateProfile({ promptOverrideText: event.target.value })}
                    placeholder="本次角色卡變體的臨時補充描述"
                  />
                </label>
              </details>

              <div className="control-actions character-card-import-actions">
                <div className="control-actions-main">
                  <button className="primary-cta" onClick={onApplyToPage1} disabled={!activeCard}>
                    匯回 PAGE1
                  </button>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </section>

      <section className="lock-panel page2-output-panel reference-output-panel">
        <div className="reference-output-header">
          <div>
            <div className="control-section-title">Character Card Outputs</div>
            <p className="workspace-panel-copy">六組 Prompt 與 DLL_PIC Pro</p>
          </div>
          <span className="reference-output-count">{outputs.length} outputs</span>
        </div>

        <div className="character-card-output-layout">
          <div className="character-card-copy-board">
            {promptGroups.map((group) => (
              <div className="character-card-output-group" key={group.id}>
                <div className="control-section-title">{group.title}</div>
                <div className="character-card-output-actions">
                  {group.outputs.map((output) => (
                    <button
                      key={output.id}
                      type="button"
                      className="primary-copy-btn character-card-copy-button"
                      onClick={() => copyOutput(output)}
                      disabled={!output.value}
                    >
                      {OUTPUT_COPY_LABELS[output.id] || `COPY ${output.label}`}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {copyStatus ? <div className="character-card-copy-status">{copyStatus}</div> : null}

            <button className="secondary character-card-save-button" type="button" onClick={onSaveCard} disabled={!outputs.length}>
              加入 Saved Cards
            </button>
          </div>

          <DllPicProPanel
            title="DLL_PIC Pro"
            description="選擇 Prompt 來源後生成角色 reference"
            promptSources={outputs.map((output) => ({ id: output.id, label: output.label, value: output.value }))}
            defaultSourceId="full-body-reference"
            compact
          />
        </div>
      </section>
    </section>
  );
}
