import { useMemo, useState } from 'react';
import PromptCard from './PromptCard';

const SOURCE_FILTERS = [
  { id: 'all', label: '全部來源' },
  { id: 'page1', label: 'Prompt 工作台' },
  { id: 'page2', label: '角色建模' },
  { id: 'actionPose', label: '動作姿勢' },
  { id: 'page3', label: '場景建模' },
];

const INITIAL_VISIBLE_CARDS = 40;
const VISIBLE_CARD_INCREMENT = 40;

export default function SavedCardsWorkspace({
  favoritePrompts,
  displayPrompts,
  handleDownloadAll,
  handleClearFavorites,
  importSavedCardsInputRef,
  handleOpenImportSavedCards,
  handleImportSavedCards,
  handleDeletePrompt,
  handleApplySavedCardSelection,
}) {
  const [sourceFilter, setSourceFilter] = useState('all');
  const [cardDensity, setCardDensity] = useState('compact');
  const visibleKey = sourceFilter;
  const [visibleState, setVisibleState] = useState({ key: visibleKey, count: INITIAL_VISIBLE_CARDS });
  const visibleCount = visibleState.key === visibleKey ? visibleState.count : INITIAL_VISIBLE_CARDS;
  const sourceCounts = useMemo(() => {
    const counts = { all: displayPrompts.length, page1: 0, page2: 0, actionPose: 0, page3: 0 };
    displayPrompts.forEach((prompt) => {
      const source = prompt.source || 'page1';
      if (counts[source] !== undefined) counts[source] += 1;
    });
    return counts;
  }, [displayPrompts]);
  const filteredPrompts = useMemo(
    () => displayPrompts.filter((prompt) => sourceFilter === 'all' || (prompt.source || 'page1') === sourceFilter),
    [displayPrompts, sourceFilter]
  );
  const visiblePrompts = useMemo(
    () => filteredPrompts.slice(0, visibleCount),
    [filteredPrompts, visibleCount]
  );
  const hasMoreCards = visiblePrompts.length < filteredPrompts.length;

  return (
    <section className="saved-cards-shell">
      <section className="saved-cards-hero lock-panel">
        <div>
          <div className="lock-title">Saved Cards Library</div>
          <p className="lock-subtitle">
            集中查看你保留下來的 Prompt。這裡只保留卡片內容與三種版本的複製操作，讓閱讀更乾淨。
          </p>
        </div>

        <div className="saved-cards-stats" aria-label="Saved card counts">
          <div className="saved-cards-stat">
            <span>Favorites</span>
            <strong>{favoritePrompts.length}</strong>
          </div>
          <div className="saved-cards-stat">
            <span>Current View</span>
            <strong>{filteredPrompts.length}</strong>
          </div>
        </div>
      </section>

      <section className="saved-cards-panel lock-panel">
        <div className="saved-cards-toolbar">
          <div className="tab-row saved-cards-actions">
            <button className="secondary" onClick={() => handleDownloadAll(filteredPrompts)} disabled={filteredPrompts.length === 0}>
              Download
            </button>
            <button className="secondary danger" onClick={handleClearFavorites} disabled={favoritePrompts.length === 0}>
              Clear Favorites
            </button>
            <button className="secondary" onClick={handleOpenImportSavedCards}>
              Import
            </button>
          </div>
          <input
            ref={importSavedCardsInputRef}
            type="file"
            accept=".zip,application/zip"
            style={{ display: 'none' }}
            onChange={handleImportSavedCards}
          />
        </div>

        <div className="tab-row saved-cards-source-tabs" aria-label="Saved card source filter">
          {SOURCE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={sourceFilter === filter.id ? 'tab-primary-active' : 'secondary'}
              onClick={() => setSourceFilter(filter.id)}
            >
              {filter.label} ({sourceCounts[filter.id] || 0})
            </button>
          ))}
        </div>

        <div className="saved-cards-library-bar">
          <div className="saved-cards-results-meta">
            Favorites currently showing {visiblePrompts.length} of {filteredPrompts.length} cards.
          </div>
          <div className="segmented-control saved-cards-density-control" role="group" aria-label="Card density">
            <button
              type="button"
              className={cardDensity === 'compact' ? 'segmented-control-active' : 'secondary'}
              onClick={() => setCardDensity('compact')}
            >
              Compact
            </button>
            <button
              type="button"
              className={cardDensity === 'detail' ? 'segmented-control-active' : 'secondary'}
              onClick={() => setCardDensity('detail')}
            >
              Detail
            </button>
          </div>
        </div>

        <div className={`saved-cards-list saved-cards-list-${cardDensity}`}>
          {filteredPrompts.length === 0 ? (
            <div className="empty-state">
              目前還沒有收藏卡片。回到任一工作區儲存卡片後，這裡會集中顯示。
            </div>
          ) : (
            visiblePrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                data={prompt}
                density={cardDensity}
                onDelete={handleDeletePrompt}
                onApplySelection={handleApplySavedCardSelection}
              />
            ))
          )}
        </div>

        {hasMoreCards ? (
          <div className="saved-cards-load-more">
            <button
              type="button"
              className="secondary"
              onClick={() => setVisibleState({ key: visibleKey, count: visibleCount + VISIBLE_CARD_INCREMENT })}
            >
              Load More ({filteredPrompts.length - visiblePrompts.length})
            </button>
          </div>
        ) : null}
      </section>
    </section>
  );
}
