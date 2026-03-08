import React, { useState } from 'react';
import { Copy, Heart, Download, ChevronDown, ChevronUp } from 'lucide-react';

export default function PromptCard({ data, onFavorite, isFavorite }) {
    const [showDetails, setShowDetails] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const markdownContent = `# Generated Prompt - ${new Date(data.date).toLocaleString()}
**💡 抽卡重點摘要：** ${data.summary}

## 🎙️ Natural Language Prompt (For Midjourney / SD)
### Positive Prompt
\`\`\`text
${data.positivePrompt}
\`\`\`

### Negative Prompt
\`\`\`text
${data.negativePrompt}
\`\`\`

---

## 🧩 The Scheme (Structured Format)
${Object.entries(data.structured).map(([key, items]) => {
            const text = items.map(item => item && item.en ? `${item.en} (${item.zh})` : '').filter(Boolean).join(', ');
            return `* **${key}:** ${text}`;
        }).join('\n')}
`;
        // Create blob and download
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prompt_${data.id}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const structuredText = Object.entries(data.structured).map(([key, items]) => {
        const text = items.map(item => item && item.en ? item.en : '').filter(Boolean).join(', ');
        return `* **${key}:** ${text || '-'}`;
    }).join('\n');

    return (
        <div className="prompt-card">
            <div className="card-header">
                <div className="summary-badge" dangerouslySetInnerHTML={{ __html: data.summary }} />
                <div className="card-actions">
                    <button className={`icon-btn ${isFavorite ? 'active' : ''}`} onClick={() => onFavorite(data.id)}>
                        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button className="icon-btn" onClick={handleDownload} title="Download MD">
                        <Download size={18} />
                    </button>
                </div>
            </div>

            <div className="prompt-section">
                <div className="prompt-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Natural Language (Optimized for Midjourney / SD)</span>
                    <button className="icon-btn" onClick={() => handleCopy(data.positivePrompt)} title="Copy All">
                        <Copy size={14} />
                    </button>
                </div>
                <div className="prompt-box">
                    <div className="prompt-text">{data.positivePrompt}</div>
                </div>
            </div>

            <div className="prompt-section">
                <div className="prompt-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Structured Scheme (Optimized for Grok Imagine)</span>
                    <button className="icon-btn" onClick={() => handleCopy(structuredText)} title="Copy All">
                        <Copy size={14} />
                    </button>
                </div>
                <div className="prompt-box" style={{ whiteSpace: 'pre-wrap' }}>
                    <div className="prompt-text structured-text">{structuredText}</div>
                </div>
            </div>

            <div className="prompt-section">
                <div className="prompt-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Negative Prompt</span>
                    <button className="icon-btn" onClick={() => handleCopy(data.negativePrompt)} title="Copy All">
                        <Copy size={14} />
                    </button>
                </div>
                <div className="prompt-box">
                    <div className="prompt-text">{data.negativePrompt}</div>
                </div>
            </div>

            {copied && <div className="toast">Copied to clipboard!</div>}
        </div>
    );
}
