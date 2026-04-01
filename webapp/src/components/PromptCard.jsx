import React, { useState } from 'react';
import { Download, Heart, RefreshCcw, Trash2, Undo2 } from 'lucide-react';

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

const QUICK_REMIX_PRESETS = [
  { key: 'characterDna', label: '保角色 DNA' },
  { key: 'expressionPose', label: '保表情姿勢' },
  { key: 'wardrobe', label: '保整體服裝' },
  { key: 'sceneLook', label: '保場景鏡頭' },
];

export default function PromptCard({ data, onFavorite, onDelete, isFavorite, canRestore, onRemix, onRestore, summarySectionInfo, advancedRemixGroupInfo }) {
  const [copiedLabel, setCopiedLabel] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [lockedSummaryKeys, setLockedSummaryKeys] = useState([]);
  const summarySections = Object.entries(summarySectionInfo);
  const lockedSectionDetails = lockedSummaryKeys.map((key) => summarySectionInfo[key]).filter(Boolean);
  const quickPresetDetails = QUICK_REMIX_PRESETS.map((preset) => ({
    ...preset,
    info: advancedRemixGroupInfo[preset.key] || summarySectionInfo[preset.key],
  })).filter((preset) => preset.info);

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
  const lineageLabel = data.lineage?.version > 1 ? `v${data.lineage.version}` : 'v1';
  const lineageDetail = data.lineage?.lastMode === 'branch' && data.lineage?.parentShortId
    ? `分支自 ${data.lineage.parentShortId}`
    : data.lineage?.remixCount > 0
      ? `已 remix ${data.lineage.remixCount} 次`
      : `Root ${data.lineage?.rootShortId || shortId}`;

  return (
    <article className="prompt-card prompt-card-summary">
      <div className="card-header card-header-compact">
        <div className="card-meta">
          <span className="card-id">{shortId}</span>
          <div className="card-lineage">
            <span>{lineageLabel}</span>
            <span>{lineageDetail}</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="icon-btn" onClick={() => onRemix(data, lockedSummaryKeys)} title="Random with selected summary locks">
            <RefreshCcw size={18} />
          </button>
          {canRestore ? (
            <button className="icon-btn" onClick={() => onRestore(data)} title="回填到主控台">
              <Undo2 size={18} />
            </button>
          ) : null}
          <button className={`icon-btn ${isFavorite ? 'active' : ''}`} onClick={() => onFavorite(data)} title="Favorite">
            <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
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
        <div className="quick-remix-panel">
          <div className="summary-insight-title">快速保留</div>
          <div className="quick-remix-grid">
            {quickPresetDetails.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className="quick-remix-btn"
                title={`直接 remix，保留${preset.info.lockLabels.join('、')}`}
                onClick={() => onRemix(data, [preset.key])}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="quick-remix-branch-btn"
            title="保留原卡，另外建立一張新的 remix 分支"
            onClick={() => onRemix(data, lockedSummaryKeys, { branch: true })}
          >
            分支 Remix，保留原卡
          </button>
        </div>
        <div className="summary-grid">
          {summarySections.map(([key, section]) => (
            <div key={key} className={`summary-row ${data.remixMeta?.sectionStates?.[key] ? `summary-row-${data.remixMeta.sectionStates[key]}` : ''}`}>
              <button
                type="button"
                className={`summary-row-label summary-lock-btn ${lockedSummaryKeys.includes(key) ? 'summary-lock-active' : ''}`}
                onClick={() => toggleSummaryLock(key)}
                title="Click to lock this section during random remix"
              >
                {section.label}
              </button>
              <div className="summary-row-content">
                <div className="summary-row-main">
                  <div className="summary-row-value">{data.summaryFields?.[key] || '-'}</div>
                  {data.remixMeta?.sectionStates?.[key] && data.remixMeta.sectionStates[key] !== 'unchanged' ? (
                    <span className={`summary-row-badge summary-row-badge-${data.remixMeta.sectionStates[key]}`}>
                      {data.remixMeta.sectionStates[key] === 'kept' ? '保留' : data.remixMeta.sectionStates[key] === 'changed' ? '變更' : '調整'}
                    </span>
                  ) : null}
                </div>
                {['changed', 'adjusted'].includes(data.remixMeta?.sectionStates?.[key]) ? (
                  <div className="summary-row-previous">
                    前一版：{data.remixMeta?.previousSummaryFields?.[key] || '-'}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {lockedSectionDetails.length > 0 ? (
          <div className="summary-insight-box">
            <div className="summary-insight-title">本次 remix 將保留</div>
            {lockedSectionDetails.map((section) => (
              <div key={section.label} className="summary-insight-line">
                <strong>{section.label}</strong>
                <span>{section.lockLabels.join('、')}</span>
              </div>
            ))}
          </div>
        ) : null}
        {data.remixMeta ? (
          <div className="summary-insight-box summary-insight-box-muted">
            <div className="summary-insight-title">上次 Remix 結果</div>
            <div className="summary-insight-line"><strong>來源</strong><span>{data.remixMeta.sourceShortId}</span></div>
            {data.remixMeta.locked?.length > 0 ? <div className="summary-insight-line"><strong>鎖定</strong><span>{data.remixMeta.locked.join('、')}</span></div> : null}
            {data.remixMeta.kept?.length > 0 ? <div className="summary-insight-line"><strong>保留</strong><span>{data.remixMeta.kept.join('、')}</span></div> : null}
            {data.remixMeta.changed?.length > 0 ? <div className="summary-insight-line"><strong>變更</strong><span>{data.remixMeta.changed.join('、')}</span></div> : null}
            {data.remixMeta.adjusted?.length > 0 ? <div className="summary-insight-line summary-insight-warning"><strong>已鎖定但調整</strong><span>{data.remixMeta.adjusted.join('、')}</span></div> : null}
          </div>
        ) : null}
      </section>

      <section className="primary-action-row">
        <button className="primary-copy-btn primary-copy-midjourney" onClick={() => handleCopy('Midjourney copied', data.midjourneyPrompt)}>
          Midjourney
        </button>
        <button className="primary-copy-btn primary-copy-grok" onClick={() => handleCopy('Grok copied', data.grokPrompt)}>
          Grok
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
