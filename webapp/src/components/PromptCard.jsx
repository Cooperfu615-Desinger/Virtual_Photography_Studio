import React, { memo, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { copyTextToClipboard } from '../lib/clipboard';

function buildMarkdownExport(data) {
  const promptEntries = getPromptEntries(data, {
    midjourney: data.promptLabels?.midjourney || 'AI Prompt',
    grok: data.promptLabels?.grok || 'Gpt',
    zImage: data.promptLabels?.zImage || 'Grok/Z-Image',
  });

  return `# Generated Prompt - ${new Date(data.date).toLocaleString()}
**Source:** ${data.sourceLabel || 'Prompt 工作台'}
**Summary:** ${data.summary}

${promptEntries.map((entry) => `## ${entry.label}
\`\`\`text
${entry.text}
\`\`\``).join('\n\n')}
`;
}

function getPromptEntries(data, labels) {
  const primaryEntries = [
    { key: 'grok', label: labels.grok, text: data.grokPrompt },
    { key: 'midjourney', label: labels.midjourney, text: data.midjourneyPrompt },
    { key: 'zImage', label: labels.zImage, text: data.zImagePrompt },
  ];
  const extraEntries = Array.isArray(data.extraPrompts)
    ? data.extraPrompts.map((entry) => ({
      key: entry.id,
      label: entry.label,
      text: entry.text,
    }))
    : [];
  return [...primaryEntries, ...extraEntries].filter((entry) => entry.text);
}

const SUMMARY_FIELD_LABELS = {
  characterDna: '人物',
  expressionPose: '神情',
  wardrobe: '穿搭',
  sceneLook: '場景',
};

function buildMetadataChips(data, promptEntries) {
  const chips = [
    data.sourceLabel || 'Prompt 工作台',
    `${promptEntries.length} prompts`,
  ];

  Object.entries(data.summaryFields || {}).forEach(([key, value]) => {
    if (!value || value === '-') return;
    chips.push(SUMMARY_FIELD_LABELS[key] || key);
  });

  if (data.selection) chips.push('可回填');

  return [...new Set(chips)].slice(0, 6);
}

function PromptCard({ data, density = 'compact', onDelete, onApplySelection }) {
  const [copiedLabel, setCopiedLabel] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [activePromptKey, setActivePromptKey] = useState('');
  const labels = {
    midjourney: data.promptLabels?.midjourney || 'AI',
    grok: data.promptLabels?.grok || 'Gpt',
    zImage: data.promptLabels?.zImage || 'Grok/Z-Image',
  };
  const promptEntries = getPromptEntries(data, labels);
  const activePrompt = promptEntries.find((entry) => entry.key === activePromptKey) || promptEntries[0] || null;
  const metadataChips = buildMetadataChips(data, promptEntries);

  const handleCopy = async (label, text) => {
    try {
      await copyTextToClipboard(text);
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
  const cardClass = ['prompt-card', 'prompt-card-summary', `prompt-card-${density}`].join(' ');
  const applySelectionLabel = data.source === 'actionPose' ? '套用動作卡' : '套用目前預覽';
  const applySelectionTitle = data.source === 'actionPose'
    ? '套用這張動作姿勢卡到 PAGE1'
    : '套用這張卡片保存的選項設定';

  return (
    <article className={cardClass}>
      <div className="card-header card-header-compact">
        <div className="card-meta">
          <span className="card-id">{sourceLabel} · {shortId}</span>
          <div className="card-lineage">
            <span>{new Date(data.date).toLocaleString()}</span>
          </div>
          <div className="card-chip-row" aria-label="Card metadata">
            {metadataChips.map((chip) => (
              <span key={chip} className="card-meta-chip">{chip}</span>
            ))}
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
        {onApplySelection ? (
          <button
            className="secondary primary-copy-btn"
            onClick={() => onApplySelection(data)}
            disabled={!data.selection}
            title={data.selection ? applySelectionTitle : '這張卡片沒有可回填的選項設定'}
          >
            {applySelectionLabel}
          </button>
        ) : null}
        {promptEntries.map((entry) => (
          <button
            key={entry.key}
            className={`primary-copy-btn primary-copy-${entry.key === 'midjourney' ? 'midjourney' : entry.key.toLowerCase()}`}
            onClick={() => handleCopy(`${entry.label} copied`, entry.text)}
          >
            {entry.label}
          </button>
        ))}
        <button className="secondary primary-copy-btn" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? '收合' : 'Detail'}
        </button>
      </section>

      {expanded ? (
        <div className="card-details">
          <div className="prompt-detail-tabs" role="tablist" aria-label="Prompt versions">
            {promptEntries.map((entry) => (
              <button
                key={entry.key}
                type="button"
                className={activePrompt?.key === entry.key ? 'prompt-detail-tab-active' : 'secondary'}
                onClick={() => setActivePromptKey(entry.key)}
              >
                {entry.label}
              </button>
            ))}
          </div>
          {activePrompt ? (
            <section className="prompt-section">
              <div className="prompt-label">
                <span>{activePrompt.label}</span>
                <button className="icon-btn" type="button" onClick={() => handleCopy(`${activePrompt.label} copied`, activePrompt.text)}>
                  Copy
                </button>
              </div>
              <div className="prompt-box">
                <div className="prompt-text prompt-text-full">{activePrompt.text}</div>
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
