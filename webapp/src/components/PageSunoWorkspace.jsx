import { SUNO_FIELD_CONFIG, SUNO_LIMITS, getSunoFieldOptions } from '../lib/suno';

function MultiSelectField({ label, fieldKey, value, limit, onToggle }) {
  const selected = Array.isArray(value) ? value : [];
  const options = getSunoFieldOptions(fieldKey);

  return (
    <div className="field suno-multi-field">
      <div className="suno-field-header">
        <span>{label}</span>
        <span className="suno-field-meta">已選 {selected.length} / {limit}</span>
      </div>
      <div className="suno-option-grid">
        {options.map((option) => {
          const isActive = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              className={`suno-chip ${isActive ? 'suno-chip-active' : 'secondary'}`}
              onClick={() => onToggle(fieldKey, option.id)}
            >
              {option.zh}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SingleSelectField({ label, fieldKey, value, onChange }) {
  const options = getSunoFieldOptions(fieldKey);

  return (
    <label className="field">
      <span>{label}</span>
      <select
        className={!value ? 'select-muted' : ''}
        value={value}
        onChange={(event) => onChange(fieldKey, event.target.value)}
      >
        <option value="">未指定</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.zh}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function PageSunoWorkspace({
  profile,
  setProfile,
  summary,
  stylesPrompt,
  onCopyText,
  onSaveCard,
  onRandomize,
  onNotice,
  createEmptyProfile,
}) {
  const handleToggleMulti = (fieldKey, optionId) => {
    const limit = SUNO_LIMITS[fieldKey] || 99;
    setProfile((prev) => {
      const current = Array.isArray(prev[fieldKey]) ? prev[fieldKey] : [];
      const exists = current.includes(optionId);
      if (exists) {
        return { ...prev, [fieldKey]: current.filter((item) => item !== optionId) };
      }
      if (current.length >= limit) {
        onNotice?.(`${SUNO_FIELD_CONFIG.find((field) => field.key === fieldKey)?.label || '此欄位'} 最多選擇 ${limit} 個`);
        return prev;
      }
      return { ...prev, [fieldKey]: [...current, optionId] };
    });
  };

  const handleSingleChange = (fieldKey, value) => {
    setProfile((prev) => ({ ...prev, [fieldKey]: value }));
  };

  return (
    <section className="page5-shell">
      <section className="lock-panel page5-panel">
        <div className="lock-panel-header">
          <div>
            <div className="lock-title">SUNO Styles Builder</div>
            <p className="lock-subtitle">用結構化欄位快速組出 SUNO 專用的音樂 styles prompt，方便反覆測試風格方向。</p>
          </div>
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div className="control-section-title">Style Inputs</div>
          </div>
          <div className="suno-field-stack">
            <MultiSelectField
              label="音樂風格"
              fieldKey="genres"
              value={profile.genres}
              limit={SUNO_LIMITS.genres}
              onToggle={handleToggleMulti}
            />
            <MultiSelectField
              label="主要樂器"
              fieldKey="instruments"
              value={profile.instruments}
              limit={SUNO_LIMITS.instruments}
              onToggle={handleToggleMulti}
            />
            <SingleSelectField label="節奏速度" fieldKey="bpm" value={profile.bpm} onChange={handleSingleChange} />
            <SingleSelectField label="律動" fieldKey="groove" value={profile.groove} onChange={handleSingleChange} />
            <MultiSelectField
              label="人聲特色"
              fieldKey="vocals"
              value={profile.vocals}
              limit={SUNO_LIMITS.vocals}
              onToggle={handleToggleMulti}
            />
            <MultiSelectField
              label="質感氛圍"
              fieldKey="textures"
              value={profile.textures}
              limit={SUNO_LIMITS.textures}
              onToggle={handleToggleMulti}
            />
          </div>
        </div>

        <div className="control-actions">
          <div className="control-actions-main">
            <button className="secondary" onClick={() => onCopyText('SUNO styles prompt copied', stylesPrompt)} disabled={!stylesPrompt}>
              複製 Styles Prompt
            </button>
            <button className="secondary" onClick={onRandomize}>
              隨機生成
            </button>
            <button className="primary-cta" onClick={onSaveCard} disabled={!stylesPrompt}>
              加入 Saved Cards
            </button>
            <button className="secondary" onClick={() => setProfile(createEmptyProfile())}>
              清空選項
            </button>
          </div>
        </div>
      </section>

      <section className="lock-panel page5-output-panel">
        <div className="control-section">
          <div className="control-section-header">
            <div className="control-section-title">風格摘要</div>
          </div>
          <div className="page2-output-card">
            {summary || '尚未選擇音樂風格條件。'}
          </div>
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div className="control-section-title">Styles Prompt</div>
          </div>
          <textarea
            className="text-input page2-prompt-textarea suno-prompt-textarea"
            value={stylesPrompt}
            readOnly
            placeholder="選擇風格、樂器與質感後，這裡會生成 SUNO 的主要 styles prompt。"
          />
        </div>

      </section>
    </section>
  );
}
