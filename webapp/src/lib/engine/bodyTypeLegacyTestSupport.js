// Node-only inverse for immutable pre-v2 feature snapshots. It replaces only
// an exact resolved body source, leaving every other byte and selection intact.
// Current full-source behavior is independently gated in bodyTypeCatalog.test.
import { generatePrompts, getLockControls } from '../engine.js';
import legacyBodies from './bodyTypeLegacyFixtures.json' with { type: 'json' };
import { createCompositionVisibilityProjection } from './compositionVisibilityContract.js';
import { applyDefaultEthnicity } from './defaultEthnicity.js';

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

function replaceExactBody(text, source, replacement) {
  if (!text.includes(source)) return text;
  if (replacement) return text.replaceAll(source, replacement);
  return text.replaceAll(`, ${source}.`, '.').replaceAll(`${source}, `, '').replaceAll(` ${source}.`, '').replaceAll(`${source}. `, '').replaceAll(source, '');
}

// Public prompt polish capitalizes a body source that starts a sentence. Treat
// that exact capitalized source the same way and keep the replacement capitalized.
const capitalizeSource = (text) => text && text[0].toUpperCase() + text.slice(1);
function replaceBody(text, source, replacement) {
  const capitalized = capitalizeSource(source);
  if (capitalized !== source) text = replaceExactBody(text, capitalized, capitalizeSource(replacement));
  return replaceExactBody(text, source, replacement);
}

// Test-only inverse for pre-omission GPT snapshots. Use the selected catalog
// source and exact structured ordinary-subject lead; never infer a body from
// arbitrary prompt text or restore body text for none, cards or special subjects.
export function restoreGptIndependentBodySource(prompt, catalog) {
  const selection = prompt.selection || {};
  if (selection.characterProfileId && !['none', 'random'].includes(selection.characterProfileId)) return prompt;
  const base = prompt.structured?.Character?.find(item => ['base-character-1', 'base-character-2'].includes(item.id));
  if (!base?.en || base.meta?.tags?.includes('special_subject')) return prompt;
  // Since 2026-10-17 a none face renders "adult Japanese woman" while the stored
  // base item keeps the plain lead; accept either exact form of that one lead.
  const pickLead = (text, plain) => {
    const japanese = applyDefaultEthnicity(plain, { single: true });
    return !text.includes(plain) && text.includes(japanese) ? japanese : plain;
  };
  const controls = getLockControls(catalog);
  const selectedSource = key => controls.find(control => control.key === key)?.options
    .find(item => item.id === selection[key]);
  const valid = source => source?.en && !/^none$/i.test(source.en);
  if (base.id === 'base-character-2') {
    const sources = [selectedSource('bodyTypeAId'), selectedSource('bodyTypeBId')];
    if (!sources.some(valid)) return prompt;
    const lead = pickLead(prompt.grokPrompt, `Subject:\n${base.en[0].toUpperCase()}${base.en.slice(1)}.`);
    if (!prompt.grokPrompt.includes(lead)) return prompt;
    // The old duo renderer placed the selected body first in each Has sentence,
    // before facial/hair/accessory fragments and the unchanged Wears sentence.
    const blocks = prompt.grokPrompt.split('\n\n');
    const subjectIndex = blocks.findIndex(block => block.startsWith(lead));
    let insertAt = subjectIndex + 1;
    for (const [index, source] of sources.entries()) {
      const label = `Woman ${index + 1}:\n`;
      let roleIndex = blocks.findIndex((block, position) => position > subjectIndex && block.startsWith(label));
      if (roleIndex >= 0) insertAt = roleIndex;
      if (!valid(source)) {
        if (roleIndex >= 0) insertAt = roleIndex + 1;
        continue;
      }
      if (roleIndex >= 0) {
        const roleText = blocks[roleIndex].slice(label.length);
        if (!roleText.includes(source.en)) {
          blocks[roleIndex] = label + (roleText.startsWith('Has ')
            ? `Has ${source.en}, ${roleText.slice(4)}`
            : `Has ${source.en.replace(/[.!?]+$/, '')}. ${roleText}`);
        }
      } else {
        blocks.splice(insertAt, 0, `${label}Has ${source.en.replace(/[.!?]+$/, '')}.`);
        roleIndex = insertAt;
      }
      insertAt = roleIndex + 1;
    }
    return { ...prompt, grokPrompt: blocks.join('\n\n') };
  }
  const source = selectedSource('bodyTypeId');
  if (!valid(source)) return prompt;
  const plainLead = `Subject:\nThe subject is ${base.en}`;
  // The restored body starts a sentence, so emit it in the polished letter case
  // public prompts use (publicPromptPolish.js) and recognize either case.
  const restoredBody = capitalizeSource(source.en.replace(/[.!?]+$/, ''));
  const restore = text => {
    const lead = pickLead(text, plainLead);
    if (text.includes(source.en) || text.includes(restoredBody) || !text.includes(lead)) return text;
    const start = text.indexOf(lead) + lead.length;
    if (!['.', ' '].includes(text[start])) return text;
    // Subject Count may include a comma-joined accessory phrase. Its terminal
    // period is the first sentence boundary after the exact adult identity.
    // Decimal points inside a selected accessory are not sentence boundaries.
    const boundary = text.slice(start).search(/\.(?=\s|$)/);
    if (boundary < 0) return text;
    const end = start + boundary + 1;
    return `${text.slice(0, end)} ${restoredBody}.${text.slice(end)}`;
  };
  return {
    ...prompt,
    grokPrompt: restore(prompt.grokPrompt),
    // Since the approved 2026-10-14 full-body exception, full-body-character
    // already renders the selected body at its pre-omission position, so only
    // GPT chest-up still needs the restored source. Restoring full-body again
    // would duplicate the body sentence.
    extraPrompts: prompt.extraPrompts.map(item => item.id === 'chest-up-portrait'
      ? { ...item, text: restore(item.text) } : item),
  };
}

export function normalizeLegacyBodyPrompt(prompt, catalog) {
  prompt = restoreGptIndependentBodySource(prompt, catalog);
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
      text: rewrite(e.text, e.id === 'full-body-character' ? 'fullBody' : 'chestUp', false, false),
    })),
  };
}

export function generateLegacyBodyPrompts(count, locks, catalog, options) {
  return generatePrompts(count, locks, catalog, options).map(p => normalizeLegacyBodyPrompt(p, catalog));
}
