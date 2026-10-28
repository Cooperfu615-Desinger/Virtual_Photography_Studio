import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const sha = x => createHash('sha256').update(x).digest('hex');
const keys = x => Object.keys(x).sort();
// Exact reviewed ownership, never a search across other cards or legacy full en.
export function validateCharacterWardrobeSources(sources, options, cards, review) {
  assert.equal(review.baseCommit, '887b149a42047bbc3bc1adbb45aa0f68c9e5487e');
  const profiles = options.filter(x => x.specialSubject === 'character-profile');
  const ids = profiles.map(x => x.id).sort();
  assert.equal(new Set(ids).size, 33);
  assert.deepEqual(keys(sources), ids);
  assert.deepEqual(cards.map(c => c.id).sort(), ids);
  assert.equal(review.rows.length, 134);
  assert.equal(new Set(review.rows.map(x => x.characterId + ':' + x.layer)).size, 134);
  let total = 0, shared = 0;
  for (const p of profiles) {
    const s = sources[p.id], card = cards.find(c => c.id === p.id);
    assert.deepEqual(keys(s), ['layers', 'profile']);
    assert.deepEqual(keys(s.layers), keys(card.defaultWardrobeLayers));
    assert.deepEqual(keys(s.profile), ['outfit', 'accessories'].filter(k => Object.hasOwn(p.profile, k)).sort());
    for (const [field, parts] of Object.entries(s.profile)) {
      assert.ok(Array.isArray(parts) && parts.length, 'Empty profile recipe');
      for (const part of parts) {
        if (typeof part === 'string') { assert.ok(part.length); continue; }
        assert.ok(part && typeof part === 'object');
        assert.deepEqual(keys(part), ['layer'], 'Only same-character layer references are supported');
        assert.ok(Object.hasOwn(s.layers, part.layer), 'Missing layer reference');
      }
      assert.equal(parts.map(x => typeof x === 'string' ? x : s.layers[x.layer]).join(''), p.profile[field], p.id + ':' + field);
    }
    const expected = review.rows.filter(x => x.characterId === p.id);
    assert.deepEqual(expected.map(x => x.layer).sort(), keys(s.layers));
    for (const [layer, text] of Object.entries(s.layers)) {
      const row = expected.find(x => x.layer === layer); total++;
      assert.equal(typeof text, 'string'); assert.ok(text.length);
      assert.equal(sha(text), row.layerSha256, 'Reviewed layer text changed: ' + p.id + ':' + layer);
      assert.equal(text, row.layerText);
      assert.equal(card.defaultWardrobeLayers[layer].prompt, text);
      assert.equal(p.profile.outfit, row.profileOutfit);
      assert.equal(p.profile.accessories ?? null, row.profileAccessories);
      const fields = ['outfit', 'accessories'].filter(f => p.profile[f]?.includes(text));
      assert.deepEqual(fields, row.sourceFields);
      if (row.kind === 'shared') {
        shared++; assert.ok(fields.length);
        assert.ok(fields.some(f => s.profile[f].some(x => typeof x === 'object' && x.layer === layer)), 'Shared text must be referenced, not copied');
      } else {
        assert.equal(fields.length, 0); assert.ok(['joining', 'word-order', 'state-wording', 'extra-detail'].includes(row.kind)); assert.ok(row.reason);
      }
    }
  }
  assert.equal(total, 134); assert.equal(shared, 118);
  return { cards: 33, layers: total, shared, reviewedDifferences: total - shared };
}
