import { Copy } from 'lucide-react';
import { LOCAL_DETAIL_TARGETS } from '../lib/page1PromptOutputs.js';

export default function LocalDetailPromptCard({
  value = '',
  placeholder = '',
  description = '',
  target = 'eyes',
  onTargetChange,
  onCopy,
}) {
  const hasValue = Boolean(value);
  return (
    <article className="prompt-preview-card local-detail-prompt-card">
      <div className="prompt-preview-card-header">
        <div className="prompt-preview-card-title-stack">
          <h3>局部超特寫</h3>
          <label className="local-detail-target-field">
            <span className="sr-only">拍攝部位</span>
            <select
              aria-label="拍攝部位"
              value={target}
              onChange={(event) => onTargetChange?.(event.target.value)}
            >
              {LOCAL_DETAIL_TARGETS.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
        <button
          className="icon-btn prompt-preview-copy-btn"
          type="button"
          disabled={!hasValue}
          onClick={() => onCopy?.(value)}
          title="Copy 局部超特寫"
          aria-label="Copy 局部超特寫"
        >
          <Copy size={18} strokeWidth={1.8} />
        </button>
      </div>
      <textarea
        className="text-input page2-prompt-textarea prompt-preview-textarea"
        value={value}
        readOnly
        placeholder={placeholder}
        aria-label="局部超特寫 Prompt"
      />
      {description ? <p className="prompt-preview-description">{description}</p> : null}
    </article>
  );
}
