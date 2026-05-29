import { useMemo, useState } from 'react';
import ImagePromptAnalyzerPanel from './ImagePromptAnalyzerPanel';
import PromptPreviewCard from './PromptPreviewCard';
import {
  SUNO_LIMITS,
  SUNO_SECTION_CONFIG,
  getSunoFieldOptions,
  getSunoFieldsForSection,
} from '../lib/suno';

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

function countSectionSelections(sectionId, profile) {
  return getSunoFieldsForSection(sectionId).reduce((count, field) => {
    const value = profile[field.key];
    if (Array.isArray(value)) return count + value.length;
    return value ? count + 1 : count;
  }, 0);
}

export default function PageSunoWorkspace({
  profile,
  setProfile,
  summary,
  stylesPrompt,
  promptBundle,
  onCopyText,
  onSaveCard,
  onRandomize,
  onNotice,
  createEmptyProfile,
}) {
  const [activeSection, setActiveSection] = useState('base');
  const activeSectionConfig = SUNO_SECTION_CONFIG.find((section) => section.id === activeSection) || SUNO_SECTION_CONFIG[0];
  const activeFields = getSunoFieldsForSection(activeSectionConfig.id);
  const sectionStatus = useMemo(
    () => Object.fromEntries(SUNO_SECTION_CONFIG.map((section) => [section.id, countSectionSelections(section.id, profile)])),
    [profile]
  );
  const outputs = promptBundle || {
    stylePrompt: stylesPrompt,
    lyricsDirection: '',
    fullPrompt: stylesPrompt,
    avoidPrompt: '',
  };
  const outputCards = [
    {
      title: 'STYLE PROMPT',
      value: outputs.stylePrompt,
      placeholder: '尚未形成 SUNO style prompt。',
      description: '貼到 SUNO Style 欄，集中描述曲風、速度、人聲、樂器與聲音質感。',
      copyLabel: 'SUNO style prompt copied',
    },
    {
      title: 'LYRICS DIRECTION',
      value: outputs.lyricsDirection,
      placeholder: '尚未形成歌詞方向。',
      description: '給歌詞主題、敘事視角、語言、密度與 hook 方向使用。',
      copyLabel: 'SUNO lyrics direction copied',
    },
    {
      title: 'FULL SUNO PROMPT',
      value: outputs.fullPrompt,
      placeholder: '尚未形成完整 SUNO prompt。',
      description: '整合 style、lyrics 與 avoid 的完整自然語言版本。',
      copyLabel: 'SUNO full prompt copied',
      fullWidth: true,
    },
    {
      title: 'AVOID PROMPT',
      value: outputs.avoidPrompt,
      placeholder: '尚未設定避免項目。',
      description: '用來提醒模型避開不想要的音樂方向。',
      copyLabel: 'SUNO avoid prompt copied',
      fullWidth: true,
    },
  ];

  const handleToggleMulti = (fieldKey, optionId) => {
    const limit = SUNO_LIMITS[fieldKey] || 99;
    setProfile((prev) => {
      const current = Array.isArray(prev[fieldKey]) ? prev[fieldKey] : [];
      const exists = current.includes(optionId);
      if (exists) {
        return { ...prev, [fieldKey]: current.filter((item) => item !== optionId) };
      }
      if (current.length >= limit) {
        onNotice?.(`${activeFields.find((field) => field.key === fieldKey)?.label || '此欄位'} 最多選擇 ${limit} 個`);
        return prev;
      }
      return { ...prev, [fieldKey]: [...current, optionId] };
    });
  };

  const handleSingleChange = (fieldKey, value) => {
    setProfile((prev) => ({ ...prev, [fieldKey]: value }));
  };

  return (
    <section className="page5-shell page5-builder-shell">
      <aside className="page5-sidebar lock-panel">
        <div className="page1-sidebar-header">
          <div>
            <div className="lock-title">SUNO Music Builder</div>
            <p className="lock-subtitle">用音樂選項組合出 SUNO 可用的 style、lyrics、full prompt 與 avoid prompt。</p>
          </div>
        </div>

        <div className="page1-section-nav">
          {SUNO_SECTION_CONFIG.map((section) => {
            const count = sectionStatus[section.id] || 0;
            return (
              <button
                key={section.id}
                type="button"
                className={`page1-section-card ${activeSection === section.id ? 'page1-section-card-active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="page1-section-heading">
                  <span className="page1-section-label">{section.label}</span>
                  <span className="page1-section-status">{count > 0 ? `已選 ${count}` : '未設定'}</span>
                </span>
                <strong className="page1-section-value">{section.description}</strong>
              </button>
            );
          })}
        </div>

        <div className="page1-sidebar-actions">
          <button className="secondary" onClick={onRandomize}>
            隨機生成
          </button>
          <button className="secondary danger" onClick={() => setProfile(createEmptyProfile())}>
            清空選項
          </button>
          <button className="primary-copy-btn" onClick={onSaveCard} disabled={!outputs.fullPrompt && !outputs.stylePrompt}>
            加入 Saved Cards
          </button>
        </div>
      </aside>

      <section className="page5-editor lock-panel">
        <div className="page1-editor-header">
          <div>
            <div className="lock-title">{activeSectionConfig.label}</div>
            <p className="workspace-panel-copy">{activeSectionConfig.description}</p>
          </div>
        </div>

        <div className="suno-field-stack">
          {activeFields.map((field) => (
            field.type === 'multi' ? (
              <MultiSelectField
                key={field.key}
                label={field.label}
                fieldKey={field.key}
                value={profile[field.key]}
                limit={field.limit}
                onToggle={handleToggleMulti}
              />
            ) : (
              <SingleSelectField
                key={field.key}
                label={field.label}
                fieldKey={field.key}
                value={profile[field.key]}
                onChange={handleSingleChange}
              />
            )
          ))}
        </div>
      </section>

      <aside className="page5-output-panel lock-panel reference-output-panel">
        <div className="reference-output-header">
          <div>
            <div className="control-section-title">SUNO Outputs</div>
            <p className="workspace-panel-copy">右側集中整理目前可複製與保存的音樂 prompt。</p>
          </div>
          <span className="reference-output-count">4 outputs</span>
        </div>

        <div className="prompt-preview-grid page5-output-grid">
          <PromptPreviewCard
            title="音樂摘要"
            value={summary}
            placeholder="尚未選擇音樂條件。"
            variant="summary"
            description=""
            onCopy={(text) => onCopyText('SUNO summary copied', text)}
          />
          {outputCards.map((card) => (
            <PromptPreviewCard
              key={card.title}
              {...card}
              onCopy={(text) => onCopyText(card.copyLabel, text)}
            />
          ))}
        </div>
        <ImagePromptAnalyzerPanel onCopyText={onCopyText} />
      </aside>
    </section>
  );
}
