import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAPTURE_GROUPS, resolveCapture, rerollCapture, captureConflict, captureOptionReason } from './observationCaptureMode.js';
import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';
import { buildRestoreLocks } from '../features/saved-cards/cardCodec.js';
const fixed = selected => ({ selected, fixed: Object.fromEntries(Object.keys(selected).map(k => [k, true])) });
test('capture solver respects fixed fields regardless of dependency order and randomizes only unlocked items', () => {
  const p = resolveCapture(fixed({ action: 'browsing-shelf', lens: 'long-telephoto-135mm' }));
  assert.equal(p.error, '');
  assert.ok(['bookstore-aisle', 'convenience-store'].includes(p.selections.scene.id));
  const next = rerollCapture(p.profile);
  assert.equal(next.profile.selected.action, p.profile.selected.action);
  assert.equal(next.profile.selected.lens, p.profile.selected.lens);
  assert.deepEqual(resolveCapture(next.profile).profile, next.profile);
});
test('all sources remain reachable and hundreds of seeds satisfy the constraints', () => {
  for (const group of CAPTURE_GROUPS) for (const option of group.options) assert.equal(resolveCapture(fixed({ [group.key]: option.id })).error, '', `${group.key}/${option.id}`);
  for (let seed = 1; seed <= 200; seed++) {
    const result = resolveCapture({ seed });
    assert.equal(result.error, ''); assert.equal(captureConflict(result.selections), '');
  }
});
test('invalid fixed selections and incompatible pairs block instead of silently replacing', () => {
  assert.match(resolveCapture(fixed({ action: 'browsing-shelf', scene: 'park-path' })).error, /貨架/);
  assert.match(resolveCapture(fixed({ texture: 'missing' })).error, /不可用/);
  assert.match(captureOptionReason(fixed({ position: 'distant-telephoto' }), 'lens', 'phone-wide'), /85mm/);
});
const controls = getLockControls();
const card = controls.find(c => c.key === 'characterProfileId').options.find(o => o.specialSubject === 'character-profile');
function locksForCapture() {
  const locks = createEmptyLocks();
  for (const c of controls) { const none = c.options?.find(o => o.zh === '全無'); if (none && !c.required) locks[c.key] = none.id; }
  return { ...locks, subjectCount: '1', characterProfileId: card.id, captureMode: 'observation',
    observationCapture: resolveCapture(fixed({ scene: 'cafe-corner', action: 'holding-drink', lens: 'human-scale-35mm', position: 'through-storefront-glass' })).profile,
    framingId: controls.find(c => c.key === 'framingId').options.find(o => o.zh === '全身鏡頭 (Full Body Shot)').id,
  };
}
test('capture uses one source in four main outputs and chest, preserves raw locks and normal standing full body', () => {
  const locks = { ...locksForCapture(), specifiedActionId: 'specified-low-seat-folded', poseBaseId: 'sitting' };
  const [prompt] = generatePrompts(1, locks);
  assert.ok(prompt);
  for (const field of ['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt']) {
    assert.match(prompt[field], /takeaway drink/i, field);
    assert.match(prompt[field], /cafe/i, field);
    assert.match(prompt[field], /35mm/i, field);
  }
  assert.match(prompt.extraPrompts.find(x => x.id === 'chest-up-portrait').text, /relaxed shoulders/i);
  assert.doesNotMatch(prompt.extraPrompts.find(x => x.id === 'full-body-character').text, /takeaway drink|cafe|observation/i);
  assert.equal(prompt.selection.poseBaseId, 'sitting');
  assert.deepEqual(prompt.selection.observationCapture, locks.observationCapture);
  const restored = normalizeLocks(buildRestoreLocks(JSON.parse(JSON.stringify(prompt.selection)), controls));
  const [again] = generatePrompts(1, restored);
  for (const field of ['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt']) assert.equal(again[field], prompt[field], field);
});
test('capture blocks unavailable identity, duo, fixed scene and invalid saved combinations', () => {
  const locks = locksForCapture();
  for (const patch of [{characterProfileId:'none'}, {subjectCount:'2'}, { fixedCompositionSetId:'unknown' }, { observationCapture: fixed({ scene:'park-path', action:'browsing-shelf' }) }]) {
    assert.deepEqual(generatePrompts(1, { ...locks, ...patch }), []);
  }
});
test('ordinary selections keep their historic shape', () => {
  const [prompt] = generatePrompts(1, { ...locksForCapture(), captureMode: 'standard' });
  assert.equal('captureMode' in prompt.selection, false);
  assert.equal('observationCapture' in prompt.selection, false);
});

test('every action preserves canonical source in all main outputs; chest projects feet and full-body stays independent', () => {
  for (const action of CAPTURE_GROUPS.find(g => g.key === 'action').options) {
    const locks = { ...locksForCapture(), observationCapture: resolveCapture(fixed({ action: action.id })).profile };
    const [prompt] = generatePrompts(1, locks);
    for (const field of ['grokPrompt', 'zImagePrompt', 'midjourneyPrompt', 'nanoBananaPrompt']) {
      assert.ok(prompt[field].toLowerCase().includes(action.en.toLowerCase()), `${action.id}/${field}`);
      assert.match(prompt[field], /staged candid observation/i);
    }
    assert.doesNotMatch(prompt.extraPrompts[0].text, /shifting her weight naturally between her feet/);
    assert.doesNotMatch(prompt.extraPrompts[1].text, /staged candid|takeaway drink|checking her phone|rail|shelf/i);
  }
});
test('GPT retains complete effective capture sources without the character card photographic direction', () => {
  for (let seed=1; seed<=20; seed++) {
    const result = resolveCapture({seed});
    const [prompt] = generatePrompts(1,{...locksForCapture(),observationCapture:result.profile});
    for (const key of ['position','foreground','lens','action','discovery','lighting','texture']) {
      assert.ok(prompt.grokPrompt.toLowerCase().includes(result.selections[key].en.toLowerCase()), `${seed}/${key}`);
    }
    assert.doesNotMatch(prompt.grokPrompt, /Photographic direction:/);
  }
});
test('capture reroll preserves resolved character and current wardrobe; changing modes preserves dormant selections', async () => {
  const { transitionPage1Locks } = await import('../features/page1/lockTransitions.js');
  const { CAPTURE_OWNED_KEYS } = await import('./observationCaptureMode.js');
  const initial = {...locksForCapture(), poseBaseId:'sitting', poseHandId:'none', characterCardWardrobeMode:'layered', characterCardWardrobeLayerIds:['top','bottom']};
  const [first] = generatePrompts(1,initial);
  const next = transitionPage1Locks({previousLocks:initial,candidateLocks:{...initial,observationCapture:rerollCapture(initial.observationCapture).profile},lockControls:controls});
  for (const key of CAPTURE_OWNED_KEYS) assert.deepEqual(next[key],initial[key],key);
  const [second]=generatePrompts(1,next);
  assert.deepEqual(second.structured.Wardrobe,first.structured.Wardrobe);
  assert.equal(second.extraPrompts[1].text,first.extraPrompts[1].text);
  const exit=transitionPage1Locks({previousLocks:next,candidateLocks:{...next,captureMode:'standard'},lockControls:controls});
  for (const key of CAPTURE_OWNED_KEYS) assert.deepEqual(exit[key],initial[key],key);
});
test('saved and exported capture survives the existing codec without rewriting historical prompt text', async () => {
  const { serializeFavoritePrompt,deserializeFavoritePrompt,buildMarkdownExport,parseExportedMarkdownPrompt }=await import('../features/saved-cards/cardCodec.js');
  const [prompt]=generatePrompts(1,locksForCapture());
  const restored=deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
  assert.equal(restored.grokPrompt,prompt.grokPrompt);
  assert.deepEqual(restored.selection.observationCapture,prompt.selection.observationCapture);
  const markdown=buildMarkdownExport(prompt);
  const imported=parseExportedMarkdownPrompt(markdown,controls,'capture-import');
  assert.deepEqual(imported.selection.observationCapture,prompt.selection.observationCapture);
});

test('capture fixture matrix passes all six public output contracts', async () => {
  const { PROMPT_OUTPUT_CONTRACTS, validatePromptOutputContract } = await import('./engine/promptOutputContracts.js');
  for (const scene of CAPTURE_GROUPS[0].options) {
    const [prompt] = generatePrompts(1, { ...locksForCapture(), observationCapture: resolveCapture(fixed({ scene: scene.id })).profile });
    for (const [field, contract] of Object.entries(PROMPT_OUTPUT_CONTRACTS)) {
      const text = contract.source.kind === 'field' ? prompt[contract.source.key] : prompt.extraPrompts.find(p => p.id === contract.source.id)?.text;
      assert.deepEqual(validatePromptOutputContract(field, text || '', { mode: 'single' }), [], `${scene.id}/${field}`);
    }
  }
});
