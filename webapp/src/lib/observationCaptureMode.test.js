import { test } from 'node:test';
import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import { CAPTURE_GROUPS, resolveCapture, rerollCapture, captureConflict, captureOptionReason } from './observationCaptureMode.js';
import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';
import { buildRestoreLocks } from '../features/saved-cards/cardCodec.js';
const fixed = selected => ({ selected, fixed: Object.fromEntries(Object.keys(selected).map(k => [k, true])) });
test('capture solver respects fixed fields regardless of dependency order and randomizes only unlocked items', () => {
  const p = resolveCapture(fixed({ action: 'browsing-shelf', lens: 'long-telephoto-135mm' }));
  assert.equal(p.error, '');
  assert.ok(['bookstore-aisle', 'convenience-store', 'library-reading-table'].includes(p.selections.scene.id));
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

test('approved expansion exposes twelve scenes and thirty-three single-moment actions', () => {
  assert.equal(CAPTURE_GROUPS.find(g => g.key === 'scene').options.length, 20);
  assert.equal(CAPTURE_GROUPS.find(g => g.key === 'action').options.length, 42);
  for (const group of CAPTURE_GROUPS) assert.equal(new Set(group.options.map(o => o.id)).size, group.options.length);
});

test('new scene fixtures reject implausible actions, lights and foregrounds without replacing locks', () => {
  const valid = [
    ['laundromat-washer', 'loading-laundry'], ['laundromat-folding', 'folding-laundry'],
    ['office-pantry', 'pouring-water'], ['library-reading-table', 'seated-reading'],
    ['neighborhood-vending', 'retrieving-vending-drink'], ['retro-diner', 'seated-reading-menu'],
    ['platform-signboard', 'checking-arrival-board'], ['train-side-aisle', 'holding-train-strap'],
    ['train-bench', 'seated-checking-phone'], ['hachiko-waiting-area', 'looking-for-someone'],
    ['lakeside-deck', 'looking-down-over-railing'], ['ryokan-engawa', 'seated-holding-teacup'],
  ];
  for (const [scene, action] of valid) {
    const p = fixed({ scene, action });
    const result = resolveCapture(p);
    assert.equal(result.error, '', `${scene}/${action}`);
    assert.equal(result.profile.selected.scene, scene);
    assert.equal(result.profile.selected.action, action);
    assert.equal(rerollCapture(result.profile).profile.selected.action, action);
  }
  for (const selected of [
    {scene:'retro-diner',action:'loading-laundry'}, {scene:'cafe-corner',action:'loading-laundry'},
    {scene:'train-side-aisle',action:'walking-through'}, {scene:'library-reading-table',action:'holding-drink'},
    {scene:'office-pantry',lighting:'warm-cafe-light'}, {scene:'train-bench',position:'through-storefront-glass'},
    {scene:'lakeside-deck',foreground:'pillar-edge'}, {scene:'neighborhood-vending',foreground:'shelf-edge'},
    {scene:'laundromat-washer',foreground:'glass-reflection'},
    {scene:'retro-diner',action:'seated-reading-menu',discovery:'quietly-aware'},
  ]) {
    const result=resolveCapture(fixed(selected));
    assert.ok(result.error, JSON.stringify(selected));
    assert.deepEqual(result.profile.selected, {...result.profile.selected,...selected});
    assert.equal(result.selections, null);
  }
});

test('old resolved captures and ordinary six-output prompts retain pre-expansion hashes', async () => {
  const { readFileSync } = await import('node:fs');
  const { createHash } = await import('node:crypto');
  const { createSeededRandom } = await import('./engineRandom.js');
  const baseline=JSON.parse(readFileSync(new URL('./observationCaptureExpansion.baseline.json',import.meta.url),'utf8'));
  for(const c of baseline.cases) {
    const [p]=generatePrompts(1,{...baseline.baseLocks,...c.locks},[],{random:createSeededRandom(baseline.seed)});
    for(const [key,expected] of Object.entries(c.hashes)) {
      const text=p[key] ?? p.extraPrompts.find(x=>x.id===key).text;
      assert.equal(createHash('sha256').update(text).digest('hex'),expected,`${c.id}/${key}`);
    }
  }
});

test('each approved new-scene menu resolves while every unapproved pairing is disabled', async () => {
  const { CAPTURE_EXPANSION_SCENES } = await import('../data/observationCaptureExpansion.js');
  for (const scene of CAPTURE_EXPANSION_SCENES) {
    for (const [key, allowed] of [['action',scene.actions],['position',scene.positions],['foreground',scene.foregrounds],['lighting',scene.lighting]]) {
      for (const option of CAPTURE_GROUPS.find(g=>g.key===key).options) {
        const reason=captureOptionReason(fixed({scene:scene.id}),key,option.id);
        assert.equal(Boolean(reason),!allowed.includes(option.id),`${scene.id}/${key}/${option.id}: ${reason}`);
      }
    }
    for(let seed=1;seed<=30;seed++) {
      const result=resolveCapture({...fixed({scene:scene.id}),seed});
      assert.equal(result.error,'');
      assert.equal(captureConflict(result.selections),'');
      assert.equal(rerollCapture(result.profile).profile.selected.scene,scene.id);
    }
  }
});

test('new scenes retain reviewed D sources and chest framing does not add the old park to lake actions', async () => {
  const { CAPTURE_EXPANSION_SCENES } = await import('../data/observationCaptureExpansion.js');
  const { captureContext, captureChestScene } = await import('./observationCaptureMode.js');
  const locations=controls.find(c=>c.key==='locationId').options;
  for(const scene of CAPTURE_EXPANSION_SCENES) {
    const source=locations.find(o=>o.id===scene.sourceLocationId);
    assert.ok(source,scene.id);
    assert.equal(scene.en,source.en);
    const result=resolveCapture(fixed({scene:scene.id}));
    assert.equal(captureContext(result.selections).location.en,source.en);
    assert.equal(captureChestScene(result.selections),scene.chestEn);
  }
  const lake=resolveCapture(fixed({scene:'lakeside-deck',action:'leaning-on-rail'}));
  assert.doesNotMatch(captureContext(lake.selections).location.en,/park path/);
});

test('all new actions project to chest and supported crops, preserve imported person and round-trip saved outputs', async () => {
  const { CAPTURE_EXPANSION_ACTIONS }=await import('../data/observationCaptureExpansion.js');
  const { getFullBodyImportSource, prepareCaptureEntry, importCapturePerson }=await import('./observationCaptureImport.js');
  const { getGrokImagineResult, withGrokImagineForSave }=await import('./grokImagineResult.js');
  const { createSeededRandom }=await import('./engineRandom.js');
  const { serializeFavoritePrompt,deserializeFavoritePrompt,buildMarkdownExport,parseExportedMarkdownPrompt }=await import('../features/saved-cards/cardCodec.js');
  const { PROMPT_OUTPUT_CONTRACTS, validatePromptOutputContract }=await import('./engine/promptOutputContracts.js');
  const sourceLocks={...createEmptyLocks(),subjectCount:'1',characterProfileId:'none',specialSubjectId:'none',fixedCompositionSetId:'none',framingId:locksForCapture().framingId};
  const [source]=generatePrompts(1,sourceLocks,[],{random:createSeededRandom('capture-expansion-import')});
  const original=getFullBodyImportSource(source);
  const framings=controls.find(c=>c.key==='framingId').options.filter(o=>/全身鏡頭|中景鏡頭|牛仔/.test(o.zh));
  assert.equal(framings.length,3);
  for(const action of CAPTURE_EXPANSION_ACTIONS) for(const framing of framings) {
    const profile=resolveCapture(fixed({action:action.id})).profile;
    const imported=importCapturePerson(prepareCaptureEntry(profile,source));
    const locks={...sourceLocks,captureMode:'observation',framingId:framing.id,observationCapture:imported};
    const [p]=generatePrompts(1,locks);
    assert.ok(p,`${action.id}/${framing.zh}`);
    assert.deepEqual(p.structured.Wardrobe,source.structured.Wardrobe);
    const full=p.extraPrompts.find(x=>x.id==='full-body-character').text;
    assert.equal(full,original.fullBodyPrompt);
    const chest=p.extraPrompts.find(x=>x.id==='chest-up-portrait').text;
    assert.ok(chest.toLowerCase().includes(action.chestEn.toLowerCase()),action.id);
    assert.doesNotMatch(chest,/undefined|legs hanging/i);
    for(const [field,contract] of Object.entries(PROMPT_OUTPUT_CONTRACTS)) {
      const text=contract.source.kind==='field'?p[contract.source.key]:p.extraPrompts.find(x=>x.id===contract.source.id)?.text;
      assert.deepEqual(validatePromptOutputContract(field,text||'',{mode:'single'}),[],`${action.id}/${framing.zh}/${field}`);
    }
    const seventh=getGrokImagineResult(p);
    assert.ok(seventh.toLowerCase().includes(action.en.toLowerCase()),`${action.id}/Grok Imagine`);
    const persisted=withGrokImagineForSave(p);
    const saved=deserializeFavoritePrompt(serializeFavoritePrompt(persisted));
    const markdown=parseExportedMarkdownPrompt(buildMarkdownExport(persisted),controls,'expansion-test');
    for(const restored of [saved,markdown]) {
      assert.deepEqual(restored.selection.observationCapture,p.selection.observationCapture);
      const [again]=generatePrompts(1,normalizeLocks(buildRestoreLocks(restored.selection,controls)));
      for(const field of ['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt'])assert.equal(again[field],p[field]);
      assert.deepEqual(again.extraPrompts,p.extraPrompts);
      assert.equal(getGrokImagineResult(restored),seventh);
      assert.equal(getGrokImagineResult(again),seventh);
    }
  }
});

test('capture expansion history reconstructs trusted source and rejects unknown bytes without changing seals', async () => {
  const { readFileSync }=await import('node:fs');
  const { createHash }=await import('node:crypto');
  const { execFileSync }=await import('node:child_process');
  const { preObservationCaptureExpansionSource, preGestureExpressionGazeSource, gestureExpressionGazeHistoricalPaths }=await import('../../../scripts/lib/gestureExpressionGazeHistoricalReplay.mjs');
  const review=JSON.parse(readFileSync(new URL('../../../scripts/lib/observationCaptureExpansionHistory.json',import.meta.url),'utf8'));
  for(const file of review.files) {
    const current=readFileSync(new URL(`../../../${file.path}`,import.meta.url));
    assert.equal(createHash('sha256').update(current).digest('hex'),file.afterHash);
    const expected=execFileSync('git',['show',`${review.baseCommit}:${file.path}`],{cwd:new URL('../../../',import.meta.url)});
    const previous=preObservationCaptureExpansionSource(file.path,current);
    assert.deepEqual(previous,expected);
    assert.deepEqual(preGestureExpressionGazeSource(file.path,current),expected);
    assert.equal(preObservationCaptureExpansionSource(file.path,previous),previous);
    const unknown=Buffer.concat([current,Buffer.from('\n// unreviewed\n')]);
    assert.equal(preObservationCaptureExpansionSource(file.path,unknown),unknown);
    assert.ok(gestureExpressionGazeHistoricalPaths.includes(file.path));
  }
});
