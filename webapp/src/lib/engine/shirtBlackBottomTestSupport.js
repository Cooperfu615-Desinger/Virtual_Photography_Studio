// Node-only historical input fixture. Keep old hashes intact while testing the
// current two-preset behavior separately in shirtBlackBottom.test.js.
import { getKnowledgeBaseSnapshot } from '../engine.js';
import { prepareImmutableRuntimeLibrary } from './runtimeCache.js';
import legacy from './shirtBlackBottomLegacy.json' with { type: 'json' };

export const PRE_BLACK_BOTTOM_CATALOG = getKnowledgeBaseSnapshot();
const entries = PRE_BLACK_BOTTOM_CATALOG.Wardrobe['套裝 (Outfit Presets)'];
for (const item of legacy) {
  const index = entries.findIndex(entry => entry.zh === item.zh);
  if (index < 0) throw new Error(`Missing historical shirt preset: ${item.zh}`);
  entries[index] = item;
}
prepareImmutableRuntimeLibrary(PRE_BLACK_BOTTOM_CATALOG);

export function usesBlackBottomPreset(prompt) {
  return ['outfitPresetId', 'outfitPresetAId', 'outfitPresetBId'].some(key =>
    /套裝-開扣(?:短袖襯衫熱褲|長袖襯衫包臀裙):/.test(prompt.selection[key] || ''));
}
