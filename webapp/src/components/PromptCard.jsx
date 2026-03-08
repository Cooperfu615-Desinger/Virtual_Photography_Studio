import React, { useState } from 'react';
import { Copy, Download, Heart, RefreshCcw } from 'lucide-react';

function buildMarkdownExport(data) {
  return `# Generated Prompt - ${new Date(data.date).toLocaleString()}
**Summary:** ${data.summary}

## Midjourney Prompt
\`\`\`text
${data.midjourneyPrompt}
\`\`\`

## Grok Imagine Prompt
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

export default function PromptCard({ data, onFavorite, isFavorite, onRemix }) {
  const [copiedLabel, setCopiedLabel] = useState('');

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

  const structuredText = Object.entries(data.structured)
    .map(([key, items]) => {
      const text = items.map((item) => `${item.en} (${item.zh})`).join(', ');
      return `* **${key}:** ${text || '-'}`;
    })
    .join('\n');

  return (
    <article className="prompt-card">
      <div className="card-header">
        <div className="summary-badge">{data.summary}</div>
        <div className="card-actions">
          <button className="icon-btn" onClick={() => onRemix(data)} title="Remix with current reroll settings">
            <RefreshCcw size={18} />
          </button>
          <button className={`icon-btn ${isFavorite ? 'active' : ''}`} onClick={() => onFavorite(data.id)} title="Favorite">
            <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button className="icon-btn" onClick={handleDownload} title="Download Markdown">
            <Download size={18} />
          </button>
        </div>
      </div>

      <section className="prompt-section">
        <div className="prompt-label">
          <span>Midjourney Prompt</span>
          <button className="icon-btn" onClick={() => handleCopy('Midjourney copied', data.midjourneyPrompt)} title="Copy Midjourney Prompt">
            <Copy size={14} />
          </button>
        </div>
        <div className="prompt-box">
          <div className="prompt-text prompt-text-full">{data.midjourneyPrompt}</div>
        </div>
      </section>

      <section className="prompt-section">
        <div className="prompt-label">
          <span>Grok Imagine Prompt</span>
          <button className="icon-btn" onClick={() => handleCopy('Grok copied', data.grokPrompt)} title="Copy Grok Prompt">
            <Copy size={14} />
          </button>
        </div>
        <div className="prompt-box">
          <div className="prompt-text prompt-text-full">{data.grokPrompt}</div>
        </div>
      </section>

      <section className="prompt-section">
        <div className="prompt-label">
          <span>Structured Scheme</span>
          <button className="icon-btn" onClick={() => handleCopy('Scheme copied', structuredText)} title="Copy Structured Scheme">
            <Copy size={14} />
          </button>
        </div>
        <div className="prompt-box">
          <div className="prompt-text structured-text">{structuredText}</div>
        </div>
      </section>

      <section className="prompt-section">
        <div className="prompt-label">
          <span>Negative Prompt</span>
          <button className="icon-btn" onClick={() => handleCopy('Negative copied', data.negativePrompt)} title="Copy Negative Prompt">
            <Copy size={14} />
          </button>
        </div>
        <div className="prompt-box">
          <div className="prompt-text prompt-text-full">{data.negativePrompt}</div>
        </div>
      </section>

      {copiedLabel ? <div className="toast">{copiedLabel}</div> : null}
    </article>
  );
}
