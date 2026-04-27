import React, { memo, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';

function buildMarkdownExport(data) {
  const labels = {
    midjourney: data.promptLabels?.midjourney || 'AI Prompt',
    grok: data.promptLabels?.grok || 'Grok Structured Prompt',
    zImage: data.promptLabels?.zImage || 'Z-Image Prompt',
  };

  return `# Generated Prompt - ${new Date(data.date).toLocaleString()}
**Source:** ${data.sourceLabel || 'Prompt 工作台'}
**Summary:** ${data.summary}

## ${labels.midjourney}
\`\`\`text
${data.midjourneyPrompt}
\`\`\`

## ${labels.grok}
\`\`\`text
${data.grokPrompt}
\`\`\`

## ${labels.zImage}
\`\`\`text
${data.zImagePrompt || ''}
\`\`\`
`;
}

function PromptCard({ data, onDelete }) {
  const [copiedLabel, setCopiedLabel] = useState('');
  const [expanded, setExpanded] = useState(false);
  const labels = {
    midjourney: data.promptLabels?.midjourney || 'AI',
    grok: data.promptLabels?.grok || 'Grok',
    zImage: data.promptLabels?.zImage || 'Z-Image',
  };

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

  const shortId = `#${String(data.id).slice(-6).toUpperCase()}`;
  const sourceLabel = data.sourceLabel || 'Prompt 工作台';

  return (
    <article className="prompt-card prompt-card-summary">
      <div className="card-header card-header-compact">
        <div className="card-meta">
          <span className="card-id">{sourceLabel} · {shortId}</span>
          <div className="card-lineage">
            <span>{new Date(data.date).toLocaleString()}</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="icon-btn" onClick={handleDownload} title="Download Markdown">
            <Download size={18} />
          </button>
          <button className="icon-btn icon-btn-danger" onClick={() => onDelete(data)} title="Delete Card">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <section className="summary-panel">
        <div className="summary-panel-header">摘要</div>
        <div className="summary-grid">
          <div className="summary-row">
            <div className="summary-row-label">Summary</div>
            <div className="summary-row-content">
              <div className="summary-row-main">
                <div className="summary-row-value">{data.summary || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="primary-action-row">
        <button className="primary-copy-btn primary-copy-grok" onClick={() => handleCopy(`${labels.grok} copied`, data.grokPrompt)}>
          {labels.grok}
        </button>
        <button className="primary-copy-btn primary-copy-midjourney" onClick={() => handleCopy(`${labels.midjourney} copied`, data.midjourneyPrompt)}>
          {labels.midjourney}
        </button>
        <button className="primary-copy-btn primary-copy-zimage" onClick={() => handleCopy(`${labels.zImage} copied`, data.zImagePrompt)} disabled={!data.zImagePrompt}>
          {labels.zImage}
        </button>
        <button className="secondary primary-copy-btn" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </section>

      {expanded ? (
        <div className="card-details">
          <section className="prompt-section">
            <div className="prompt-label">
              <span>{labels.grok}</span>
            </div>
            <div className="prompt-box">
              <div className="prompt-text prompt-text-full">{data.grokPrompt}</div>
            </div>
          </section>

          <section className="prompt-section">
            <div className="prompt-label">
              <span>{labels.midjourney}</span>
            </div>
            <div className="prompt-box">
              <div className="prompt-text prompt-text-full">{data.midjourneyPrompt}</div>
            </div>
          </section>

          {data.zImagePrompt ? (
            <section className="prompt-section">
              <div className="prompt-label">
                <span>{labels.zImage}</span>
              </div>
              <div className="prompt-box">
                <div className="prompt-text prompt-text-full">{data.zImagePrompt}</div>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {copiedLabel ? <div className="toast">{copiedLabel}</div> : null}
    </article>
  );
}

export default memo(PromptCard);
