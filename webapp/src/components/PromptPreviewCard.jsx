import { Copy } from 'lucide-react';

export default function PromptPreviewCard({
  title,
  description = '',
  value = '',
  placeholder = '',
  onCopy,
  fullWidth = false,
  variant = 'prompt',
}) {
  const hasValue = Boolean(value);
  const cardClass = ['prompt-preview-card', fullWidth ? 'prompt-preview-card-wide' : ''].filter(Boolean).join(' ');

  return (
    <article className={cardClass}>
      <div className="prompt-preview-card-header">
        <div className="prompt-preview-card-title-stack">
          <h3>{title}</h3>
        </div>
        <button
          className="icon-btn prompt-preview-copy-btn"
          type="button"
          disabled={!hasValue}
          onClick={() => onCopy?.(value)}
          title={`Copy ${title}`}
          aria-label={`Copy ${title}`}
        >
          <Copy size={18} strokeWidth={1.8} />
        </button>
      </div>

      {variant === 'summary' ? (
        <div className="prompt-preview-summary-box">
          {value || placeholder}
        </div>
      ) : (
        <textarea
          className="text-input page2-prompt-textarea prompt-preview-textarea"
          value={value}
          readOnly
          placeholder={placeholder}
        />
      )}

      {description ? <p className="prompt-preview-description">{description}</p> : null}
    </article>
  );
}
