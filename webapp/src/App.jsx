import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Sparkles, Download, Heart } from 'lucide-react';
import PromptCard from './components/PromptCard';
import { generatePrompts } from './lib/engine';
import './index.css';

function App() {
  const [prompts, setPrompts] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [genCount, setGenCount] = useState(1);
  const [viewMode, setViewMode] = useState('feed'); // 'feed' or 'favorites'

  const handleGenerate = () => {
    const newPrompts = generatePrompts(genCount);
    // Prepend new prompts
    setPrompts(prev => [...newPrompts, ...prev]);
    setViewMode('feed');
  };

  const toggleFavorite = (id) => {
    const newFavs = new Set(favorites);
    if (newFavs.has(id)) {
      newFavs.delete(id);
    } else {
      newFavs.add(id);
    }
    setFavorites(newFavs);
  };

  const handleDownloadAll = () => {
    const listToDownload = viewMode === 'favorites'
      ? prompts.filter(p => favorites.has(p.id))
      : prompts;

    if (listToDownload.length === 0) return;

    const zip = new JSZip();
    listToDownload.forEach(data => {
      const markdownContent = `# Generated Prompt - ${new Date(data.date).toLocaleString()}
**💡 抽卡重點摘要：** ${data.summary}

## 🎙️ Natural Language (Optimized for Midjourney / SD)
### Positive Prompt
\`\`\`text
${data.positivePrompt}
\`\`\`

### Negative Prompt
\`\`\`text
${data.negativePrompt}
\`\`\`

---

## 🧩 Structured Scheme (Optimized for Grok Imagine)
${Object.entries(data.structured).map(([key, items]) => {
        const text = items.map(item => item && item.en ? item.en : '').filter(Boolean).join(', ');
        return `* **${key}:** ${text || '-'}`;
      }).join('\n')}
`;
      zip.file(`prompt_${data.id}.md`, markdownContent);
    });

    zip.generateAsync({ type: 'blob' }).then(function (content) {
      saveAs(content, `vibe_quirk_prompts_${Date.now()}.zip`);
    });
  };

  const displayPrompts = viewMode === 'favorites'
    ? prompts.filter(p => favorites.has(p.id))
    : prompts;

  return (
    <div className="container">
      <header>
        <h1>Vibe Quirk Labs Studio</h1>
        <div className="controls">
          <select value={genCount} onChange={(e) => setGenCount(Number(e.target.value))}>
            <option value={1}>Draw 1 Card</option>
            <option value={3}>Draw 3 Cards</option>
            <option value={5}>Draw 5 Cards</option>
            <option value={10}>Draw 10 Cards</option>
          </select>
          <button onClick={handleGenerate}>
            <Sparkles size={18} />
            Generate
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className={viewMode === 'feed' ? '' : 'secondary'}
            onClick={() => setViewMode('feed')}
          >
            Feed ({prompts.length})
          </button>
          <button
            className={viewMode === 'favorites' ? '' : 'secondary'}
            onClick={() => setViewMode('favorites')}
          >
            <Heart size={16} fill={viewMode === 'favorites' ? '#fff' : 'none'} />
            Favorites ({favorites.size})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="secondary" onClick={handleDownloadAll} disabled={displayPrompts.length === 0}>
            <Download size={18} />
            {viewMode === 'favorites' ? 'Download Favorites ZIP' : 'Download All as ZIP'}
          </button>
          {viewMode === 'feed' && prompts.length > 0 && (
            <button className="secondary" onClick={() => setPrompts([])} style={{ color: '#ff6b6b', borderColor: '#4a2c2c', backgroundColor: '#2a1a1a' }}>
              Clear Feed
            </button>
          )}
        </div>
      </div>

      <div className="feed">
        {displayPrompts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 0' }}>
            {viewMode === 'favorites' ? 'No favorites yet.' : 'Click Generate to start drawing cards.'}
          </div>
        ) : (
          displayPrompts.map(prompt => (
            <PromptCard
              key={prompt.id}
              data={prompt}
              isFavorite={favorites.has(prompt.id)}
              onFavorite={toggleFavorite}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default App;
