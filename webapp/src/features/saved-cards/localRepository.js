import {
  LEGACY_FEED_STORAGE_KEY,
  SAVED_CARDS_MIGRATION_KEY,
  SAVED_CARDS_MIGRATION_VERSION,
  finalizeLegacyFeedMigration,
  mergeLegacyFeedPrompts,
} from '../../lib/savedCardsMigration.js';
import { loadJsonStorage, loadStringStorage } from '../storage/browserStorage.js';
import {
  deserializeFavoritePromptCollection,
  sanitizeStoredPromptCollection,
  serializeFavoritePrompt,
} from './cardCodec.js';

export const FAVORITES_STORAGE_KEY = 'vps.favorites';
export const FAVORITES_STORAGE_BUDGET = 2_250_000;
export const STORAGE_PERSIST_DELAY_MS = 300;
export const STORAGE_IDLE_TIMEOUT_MS = 1000;

function getStorage() {
  return globalThis.window?.localStorage;
}

export function estimateStorageBytes(text) {
  return new TextEncoder().encode(String(text)).byteLength;
}

export function fitPromptsToStorageBudget(prompts, budget = FAVORITES_STORAGE_BUDGET) {
  if (!budget) return prompts;

  const fitted = [];
  let bytesUsed = 2;
  for (const prompt of prompts) {
    const serializedPrompt = JSON.stringify(prompt);
    const nextBytes = estimateStorageBytes(serializedPrompt) + (fitted.length > 0 ? 1 : 0);
    if (bytesUsed + nextBytes > budget) break;
    fitted.push(prompt);
    bytesUsed += nextBytes;
  }
  return fitted;
}

export function serializeFavoriteCollection(prompts) {
  return prompts.map(serializeFavoritePrompt).filter(Boolean);
}

export function persistFavoriteCollection(
  prompts,
  { storage = getStorage(), budget = FAVORITES_STORAGE_BUDGET } = {},
) {
  if (!storage) return { truncatedCount: 0, failed: false };

  const sanitized = serializeFavoriteCollection(prompts);
  let fitted = fitPromptsToStorageBudget(sanitized, budget);

  while (fitted.length >= 0) {
    try {
      storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(fitted));
      return { truncatedCount: sanitized.length - fitted.length, failed: false };
    } catch (error) {
      const isQuotaExceeded = error instanceof DOMException
        && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
      if (!isQuotaExceeded || fitted.length === 0) {
        return { truncatedCount: sanitized.length, failed: true };
      }
      fitted = fitted.slice(0, -1);
    }
  }

  return { truncatedCount: sanitized.length, failed: true };
}

export function scheduleFavoriteCollectionPersist(prompts, onResult) {
  const browser = globalThis.window;
  if (!browser) return () => {};

  let idleHandle = null;
  const timeoutId = browser.setTimeout(() => {
    const persist = () => {
      idleHandle = null;
      onResult(persistFavoriteCollection(prompts));
    };

    if ('requestIdleCallback' in browser) {
      idleHandle = browser.requestIdleCallback(persist, { timeout: STORAGE_IDLE_TIMEOUT_MS });
    } else {
      idleHandle = browser.setTimeout(persist, 0);
    }
  }, STORAGE_PERSIST_DELAY_MS);

  return () => {
    browser.clearTimeout(timeoutId);
    if (idleHandle === null) return;
    if ('cancelIdleCallback' in browser) browser.cancelIdleCallback(idleHandle);
    else browser.clearTimeout(idleHandle);
  };
}

export function loadFavoritePrompts(storage = getStorage()) {
  if (!storage) return [];

  const rawFavorites = loadJsonStorage(FAVORITES_STORAGE_KEY, [], storage);
  if (!Array.isArray(rawFavorites) || rawFavorites.length === 0) return [];
  if (typeof rawFavorites[0] === 'object' && rawFavorites[0] !== null) {
    return deserializeFavoritePromptCollection(rawFavorites);
  }

  const promptCache = sanitizeStoredPromptCollection(
    loadJsonStorage(LEGACY_FEED_STORAGE_KEY, [], storage),
  );
  const idSet = new Set(rawFavorites.filter(Boolean));
  return promptCache.filter((item) => item?.id && idSet.has(item.id));
}

export function loadAndMigrateFavoritePrompts(storage = getStorage()) {
  const favorites = loadFavoritePrompts(storage);
  if (!storage) return favorites;

  const legacyFeed = sanitizeStoredPromptCollection(
    loadJsonStorage(LEGACY_FEED_STORAGE_KEY, [], storage),
  );
  const completedMigration = loadStringStorage(SAVED_CARDS_MIGRATION_KEY, '', storage)
    === SAVED_CARDS_MIGRATION_VERSION;
  if (completedMigration && legacyFeed.length === 0) return favorites;

  const mergedFavorites = mergeLegacyFeedPrompts(favorites, legacyFeed);
  const migrationResult = persistFavoriteCollection(mergedFavorites, { storage });
  finalizeLegacyFeedMigration(storage, migrationResult);
  return mergedFavorites;
}
