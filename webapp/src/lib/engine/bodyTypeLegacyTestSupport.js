// Node-only inverse for immutable pre-v2 feature snapshots. It replaces only
// an exact resolved body source, leaving every other byte and selection intact.
// Current full-source behavior is independently gated in bodyTypeCatalog.test.
import { generatePrompts, getLockControls } from '../engine.js';
import legacyBodies from './bodyTypeLegacyFixtures.json' with { type: 'json' };
import { createCompositionVisibilityProjection } from './compositionVisibilityContract.js';

export const LEGACY_BODY_CATALOG_ITEMS = legacyBodies.map(({ partial, ai, ...item }) => {
  void partial; void ai;
  return item;
});

function legacyBodyText(body, bucket, ai) {
  if (['faceDetail', 'headShoulders'].includes(bucket)) return '';
  if (body.partial[bucket]) return ai
    ? body.partial[bucket].split(/,\s*/).filter(p => !/body proportion anchor/.test(p)).slice(0, 4).join(', ')
    : body.partial[bucket];
  return ai ? body.ai : body.en;
}

function replaceBody(text, source, replacement) {
  if (!text.includes(source)) return text;
  if (replacement) return text.replaceAll(source, replacement);
  return text.replaceAll(`, ${source}.`, '.').replaceAll(`${source}, `, '').replaceAll(` ${source}.`, '').replaceAll(`${source}. `, '').replaceAll(source, '');
}

export function normalizeLegacyBodyPrompt(prompt, catalog) {
  const s = prompt.selection;
  if (s.characterProfileId && !['none', 'random'].includes(s.characterProfileId)) return prompt;
  const controls = getLockControls(catalog);
  const frames = controls.find(c => c.key === 'framingId').options;
  const sources = controls.find(c => c.key === 'bodyTypeId').options;
  const framing = frames.find(f => f.id === s.framingId);
  const fixedCompositionActive = Boolean(s.fixedCompositionSetId && !['none', 'random'].includes(s.fixedCompositionSetId));
  const bucket = createCompositionVisibilityProjection(framing, { fixedCompositionActive }).bucket;
  const bodies = [s.bodyTypeId, s.bodyTypeAId, s.bodyTypeBId].map(id => legacyBodies.find(b => b.stableId === id)).filter(Boolean);
  const rewrite = (text, outputBucket, ai, main, z = false) => bodies.reduce((value, body) => {
    // HEAD already had the narrow main-output I-cup exception.
    let replacement = main && body.zh === '豐胸纖腰沙漏身形' ? body.en : legacyBodyText(body, outputBucket, ai);
    if (z) replacement = replacement
      .replace(/, (?:smooth natural silhouette|clean editorial silhouette|graceful small-frame presence)/g, '');
    const source = sources.find(item => item.id === body.stableId)?.en || body.en;
    return replaceBody(value, source, replacement);
  }, text);
  return {
    ...prompt,
    grokPrompt: rewrite(prompt.grokPrompt, bucket, false, true),
    zImagePrompt: rewrite(prompt.zImagePrompt, bucket, false, true, true),
    midjourneyPrompt: rewrite(prompt.midjourneyPrompt, bucket, true, true),
    extraPrompts: prompt.extraPrompts.map(e => ({ ...e,
      text: rewrite(e.text, e.id === 'full-body-character' ? 'fullBody' : 'chestUp', e.id === 'chest-up-mj-portrait', false),
    })),
  };
}

export function generateLegacyBodyPrompts(count, locks, catalog, options) {
  return generatePrompts(count, locks, catalog, options).map(p => normalizeLegacyBodyPrompt(p, catalog));
}
