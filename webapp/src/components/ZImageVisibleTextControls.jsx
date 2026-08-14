import {
  Z_IMAGE_VISIBLE_TEXT_LANGUAGES,
  Z_IMAGE_VISIBLE_TEXT_MAX_CHARACTERS,
  Z_IMAGE_VISIBLE_TEXT_PLACEMENTS,
  buildZImageVisibleTextSentence,
  normalizeZImageVisibleTextContent,
  normalizeZImageVisibleTextSettings,
} from '../lib/engine/zImageVisibleText.js';

export default function ZImageVisibleTextControls({ settings, onChange }) {
  const normalized = normalizeZImageVisibleTextSettings(settings);
  const characterCount = Array.from(normalized.zImageVisibleTextContent).length;
  const previewSentence = buildZImageVisibleTextSentence(normalized);
  const updateSetting = (key, value) => {
    onChange((previous) => ({
      ...previous,
      ...normalizeZImageVisibleTextSettings({
        ...previous,
        [key]: value,
      }),
    }));
  };

  return (
    <div className="control-section z-image-visible-text-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Z-Image Exact Visible Text</div>
          <p className="workspace-panel-copy">
            只有在畫面必須出現指定字樣時啟用。英文指令負責空間關係，輸入內容則以原文保留給 Z-Image。
          </p>
        </div>
        <button
          type="button"
          className={`secondary z-image-visible-text-toggle ${normalized.zImageVisibleTextEnabled ? 'z-image-visible-text-toggle-active' : ''}`}
          aria-pressed={normalized.zImageVisibleTextEnabled}
          onClick={() => updateSetting('zImageVisibleTextEnabled', !normalized.zImageVisibleTextEnabled)}
        >
          {normalized.zImageVisibleTextEnabled ? '已啟用' : '未啟用'}
        </button>
      </div>

      <div className="context-note">
        此設定只寫入 Z-Image Prompt，不影響 Gpt、AI 或三組固定景別輸出；也不參與「全部隨機」與「清空」。沒有輸入文字時不會產生任何額外句子。
      </div>

      <div className={`z-image-visible-text-fields ${normalized.zImageVisibleTextEnabled ? '' : 'z-image-visible-text-fields-disabled'}`}>
        <label className="field field-full">
          <span className="field-heading-row">
            <span>精確文字內容</span>
            <span className="z-image-visible-text-count">{characterCount}/{Z_IMAGE_VISIBLE_TEXT_MAX_CHARACTERS}</span>
          </span>
          <input
            className="text-input"
            type="text"
            value={normalized.zImageVisibleTextContent}
            disabled={!normalized.zImageVisibleTextEnabled}
            onChange={(event) => updateSetting(
              'zImageVisibleTextContent',
              normalizeZImageVisibleTextContent(event.target.value),
            )}
            placeholder="例如：美華冰室"
            aria-describedby="z-image-visible-text-help"
          />
        </label>

        <label className="field">
          <span>文字語言</span>
          <select
            value={normalized.zImageVisibleTextLanguage}
            disabled={!normalized.zImageVisibleTextEnabled}
            onChange={(event) => updateSetting('zImageVisibleTextLanguage', event.target.value)}
          >
            {Z_IMAGE_VISIBLE_TEXT_LANGUAGES.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>承載位置</span>
          <select
            value={normalized.zImageVisibleTextPlacement}
            disabled={!normalized.zImageVisibleTextEnabled}
            onChange={(event) => updateSetting('zImageVisibleTextPlacement', event.target.value)}
          >
            {Z_IMAGE_VISIBLE_TEXT_PLACEMENTS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div id="z-image-visible-text-help" className="z-image-visible-text-preview" aria-live="polite">
        <strong>Z-Image 句子預覽</strong>
        <code>{previewSentence || '啟用並輸入文字後，這裡會顯示實際加入場景段落的句子。'}</code>
      </div>
    </div>
  );
}
