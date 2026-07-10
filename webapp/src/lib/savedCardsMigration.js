export const LEGACY_FEED_STORAGE_KEY = 'vps.prompts';
export const LEGACY_VIEW_MODE_STORAGE_KEY = 'vps.viewMode';
export const SAVED_CARDS_MIGRATION_KEY = 'vps.savedCardsMigration';
export const SAVED_CARDS_MIGRATION_VERSION = 'feed-to-favorites-v1';

export function mergeLegacyFeedPrompts(favorites, legacyFeed) {
  const merged = [];
  const seenIds = new Set();

  [...(favorites || []), ...(legacyFeed || [])].forEach((prompt) => {
    if (!prompt?.id || seenIds.has(prompt.id)) return;
    seenIds.add(prompt.id);
    merged.push(prompt);
  });

  return merged;
}

export function finalizeLegacyFeedMigration(storage, migrationResult) {
  if (!storage || migrationResult?.failed || migrationResult?.truncatedCount > 0) return false;

  storage.removeItem(LEGACY_FEED_STORAGE_KEY);
  storage.removeItem(LEGACY_VIEW_MODE_STORAGE_KEY);
  storage.setItem(SAVED_CARDS_MIGRATION_KEY, SAVED_CARDS_MIGRATION_VERSION);
  return true;
}
