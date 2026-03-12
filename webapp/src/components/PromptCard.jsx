import React, { useState } from 'react';
import { Download, Heart, RefreshCcw } from 'lucide-react';

function buildMarkdownExport(data) {
  return `# Generated Prompt - ${new Date(data.date).toLocaleString()}
**Summary:** ${data.summary}

## Midjourney Prompt
\`\`\`text
${data.midjourneyPrompt}
\`\`\`

## Grok Structured Prompt
\`\`\`text
${data.grokPrompt}
\`\`\`

## Negative Prompt
\`\`\`text
${data.negativePrompt}
\`\`\`

---

## Structured Scheme
${Object.entries(data.structured)
  .map(([key, items]) => {
    const text = items.map((item) => `${item.en} (${item.zh})`).join(', ');
    return `* **${key}:** ${text || '-'}`;
  })
  .join('\n')}
`;
}

const SUMMARY_LABELS = [
  ['style', '風格'],
  ['character', '人物'],
  ['wardrobe', '服裝'],
  ['location', '場景'],
  ['camera', '鏡頭'],
  ['lighting', '光影'],
];

export default function PromptCard({ data, onFavorite, isFavorite, onRemix }) {
  const [copiedLabel, setCopiedLabel] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [lockedSummaryKeys, setLockedSummaryKeys] = useState([]);

  const handleCopy = async (label, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLabel(label);
      window.setTimeout(() => setCopiedLabel(''), 1800);
    } catch {
      setCopiedLabel('Copy failed');
      window.setTimeout(() => setCopiedLabel(''), 1800);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([buildMarkdownExport(data)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `prompt_${data.id}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const toggleSummaryLock = (key) => {
    setLockedSummaryKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };

  const structuredText = Object.entries(data.structured)
    .map(([key, items]) => {
      const text = items.map((item) => `${item.en} (${item.zh})`).join(', ');
      return `* **${key}:** ${text || '-'}`;
    })
    .join('\n');

  const shortId = `#${String(data.id).slice(-6).toUpperCase()}`;

  return (
    <article className="prompt-card prompt-card-summary">
      <div className="card-header card-header-compact">
        <div className="card-meta">
          <span className="card-id">{shortId}</span>
        </div>
        <div className="card-actions">
          <button className="icon-btn" onClick={() => onRemix(data, lockedSummaryKeys)} title="Random with selected summary locks">
            <RefreshCcw size={18} />
          </button>
          <button className={`icon-btn ${isFavorite ? 'active' : ''}`} onClick={() => onFavorite(data)} title="Favorite">
            <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button className="icon-btn" onClick={handleDownload} title="Download Markdown">
            <Download size={18} />
          </button>
        </div>
      </div>

      <section className="summary-panel">
        <div className="summary-panel-header">摘要</div>
        <div className="summary-grid">
          {SUMMARY_LABELS.map(([key, label]) => (
            <div key={key} className="summary-row">
              <button
                type="button"
                className={`summary-row-label summary-lock-btn ${lockedSummaryKeys.includes(key) ? 'summary-lock-active' : ''}`}
                onClick={() => toggleSummaryLock(key)}
                title="Click to lock this section during random remix"
              >
                {label}
              </button>
              <div className="summary-row-value">{data.summaryFields?.[key] || '-'}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="primary-action-row">
        <button className="primary-copy-btn primary-copy-midjourney" onClick={() => handleCopy('Midjourney copied', data.midjourneyPrompt)}>
          Midjourney
        </button>
        <button className="primary-copy-btn primary-copy-grok" onClick={() => handleCopy('Grok copied', data.grokPrompt)}>
          Grok
        </button>
        <button className="primary-copy-btn primary-copy-negative" onClick={() => handleCopy('Negative copied', data.negativePrompt)}>
          Negative
        </button>
        <button className="secondary primary-copy-btn" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </section>

      {expanded ? (
        <div className="card-details">
          <section className="prompt-section">
            <div className="prompt-label">
              <span>Midjourney Prompt</span>
            </div>
            <div className="prompt-box">
              <div className="prompt-text prompt-text-full">{data.midjourneyPrompt}</div>
            </div>
          </section>

          <section className="prompt-section">
            <div className="prompt-label">
              <span>Grok Structured Prompt</span>
            </div>
            <div className="prompt-box">
              <div className="prompt-text prompt-text-full">{data.grokPrompt}</div>
            </div>
          </section>

          <section className="prompt-section">
            <div className="prompt-label">
              <span>Negative Prompt</span>
            </div>
            <div className="prompt-box">
              <div className="prompt-text prompt-text-full">{data.negativePrompt}</div>
            </div>
          </section>

          <section className="prompt-section">
            <div className="prompt-label">
              <span>Structured Scheme</span>
            </div>
            <div className="prompt-box">
              <div className="prompt-text structured-text">{structuredText}</div>
            </div>
          </section>
        </div>
      ) : null}

      {copiedLabel ? <div className="toast">{copiedLabel}</div> : null}
    </article>
  );
}
