// Materialize once against the unmodified source commit; replay never resolves labels again.
export async function createCorpus(repo) {
  const { pathToFileURL } = await import('node:url');
  const load = file => import(pathToFileURL(`${repo}/${file}`).href);
  const E = await load('webapp/src/lib/engine.js');
  const { REPRESENTATIVE_PROMPT_FIXTURES: fixtures } = await load('webapp/src/lib/engine/representativePromptFixtures.js');
  const { SPECIFIED_ACTION_CONCRETE_OPTIONS: actions } = await load('webapp/src/lib/engine/specifiedActions.js');
  const { createPromptAuditPlan } = await load('scripts/validate_prompt_logic.mjs');
  const { randomizeLockKeys } = await load('webapp/src/lib/page1SectionRandom.js');
  const { resolveCapture, CAPTURE_GROUPS } = await load('webapp/src/lib/observationCaptureMode.js');
  const controls = E.getLockControls();
  const control = key => { const c = controls.find(c => c.key === key); if (!c) throw new Error(`missing control ${key}`); return c; };
  const allNone = historical => {
    const locks = E.createEmptyLocks();
    for (const c of controls) {
      if (historical && /^(bodyType|hairStylingState)[AB]?Id$|^outerwear[AB]?OpeningId$|^eyewear[AB]?PlacementId$|^sceneAttributeId$/.test(c.key)) continue;
      const none = c.options.find(o => o.zh === '全無' || o.zh === '無額外表情');
      if (none) locks[c.key] = none.id;
    }
    return locks;
  };
  const cases = [], ids = new Set();
  const add = (id, locks, seed = id, mode = 'single', stream = id) => {
    if (ids.has(id)) throw new Error(`duplicate case ${id}`);
    ids.add(id); cases.push({ id, seed, mode, stream, locks: structuredClone(locks) });
  };
  for (const fixture of fixtures) {
    const locks = allNone(true);
    for (const [key, selector] of Object.entries(fixture.locks)) {
      if (typeof selector === 'string' || Array.isArray(selector)) locks[key] = selector;
      else {
        const matches = control(key).options.filter(o => o.zh === selector?.byZh);
        if (matches.length === 0) throw new Error(`UNRESOLVED ${fixture.id}.${key}: ${JSON.stringify(selector)}`);
        locks[key] = matches[0].id;
      }
    }
    add(`fixture:${fixture.id}`, locks, fixture.seed, fixture.mode);
  }
  for (const scenario of createPromptAuditPlan(200, 'prompt-quality-baseline')) {
    for (let i = 0; i < scenario.count; i++) add(`audit:${scenario.id}:${i}`, { ...E.createEmptyLocks(), ...scenario.locks }, scenario.seed, scenario.mode, `audit:${scenario.id}`);
  }
  for (const action of actions) for (const frame of control('framingId').options.filter(o => o.zh !== '隨機')) {
    for (const seed of [0, 1]) add(`action:${action.id}:${frame.id}:${seed}`, { ...E.createEmptyLocks(), subjectCount: '1', specifiedActionId: action.id, framingId: frame.id });
  }
  const allRandom = randomizeLockKeys({ ...E.createEmptyLocks(), subjectCount: '1' }, controls.map(c => c.key), E.createEmptyLocks(), controls);
  for (let i = 0; i < 150; i++) add(`all-random:${i}`, allRandom, `p4-allrandom-${i}`);
  add('all-none', { ...allNone(), subjectCount: '1' });
  // Exhaust each listed dimension, retaining all existing sentinels and retired values.
  const dimensions = ['bodyTypeId', 'outfitPresetId', 'outerwearId', 'outerwearOpeningId', 'outerwearStylingId',
    'headAccessoryId', 'eyewearId', 'neckAccessoryId', 'lightingId', 'lightDirectionId', 'angleId', 'orbitId',
    'headPostureId', 'gazeId', 'poseBaseId', 'poseArrangementId', 'poseAnchorId', 'poseHandId', 'posePropId',
    'propId', 'specialSubjectId', 'characterProfileId', 'fixedCompositionSetId'];
  for (const key of dimensions) for (const option of control(key).options) {
    const locks = { ...E.createEmptyLocks(), subjectCount: '1', [key]: option.id };
    if (key === 'poseArrangementId' || key === 'poseAnchorId') locks.poseBaseId = /lying|supine|prone|recline/.test(option.id) ? 'lying' : 'sitting';
    add(`dimension:${key}:${option.id}`, locks, `dimension:${key}:${option.id}`, key === 'fixedCompositionSetId' ? 'fixed-composition' : 'single');
  }
  const card = control('characterProfileId').options.find(o => o.specialSubject === 'character-profile');
  if (!card) throw new Error('missing observation character');
  for (const group of CAPTURE_GROUPS) for (const option of group.options) {
    const capture = resolveCapture({ seed: 1234, selected: { [group.key]: option.id }, fixed: { [group.key]: true } });
    if (capture.error) throw new Error(capture.error);
    add(`observation:${group.key}:${option.id}`, { ...E.createEmptyLocks(), subjectCount: '1', characterProfileId: card.id, captureMode: 'observation', observationCapture: capture.profile }, undefined, 'observation');
  }
  for (const section of new Set(controls.map(c => c.section))) {
    const keys = controls.filter(c => c.section === section).map(c => c.key);
    add(`section-random:${section}`, randomizeLockKeys({ ...allNone(), subjectCount: '1' }, keys, E.createEmptyLocks(), controls));
  }
  for (const alias of ['shoulder-lean', 'leaning-shoulders']) add(`legacy:duo:${alias}`, { ...E.createEmptyLocks(), subjectCount: '2', duoPoseId: alias }, undefined, 'duo');
  const database = E.getKnowledgeBaseSnapshot();
  for (const [category, entries] of Object.entries(database.Locations)) for (const item of entries.filter(x => x.lyingSurface)) {
    const option = control('locationId').options.find(o => o.en === item.en && o.zh === item.zh);
    if (!option) throw new Error(`missing lying surface ${category}/${item.zh}`);
    for (const orientation of ['lying-side', 'lying-prone', 'lying-supine']) add(`surface:${option.id}:${orientation}`, { ...E.createEmptyLocks(), subjectCount: '1', locationId: option.id, poseBaseId: 'lying', poseArrangementId: orientation });
  }
  for (const text of ['花樣年華', 'Cafe 42!']) add(`visible-text:${text}`, { ...E.createEmptyLocks(), subjectCount: '1', zImageVisibleTextEnabled: true, zImageVisibleTextContent: text, zImageVisibleTextLanguage: text === '花樣年華' ? 'traditional-chinese' : 'english', zImageVisibleTextPlacement: 'background-storefront-sign' });
  const lab = await load('webapp/src/lib/characterCardLab.js');
  const cards = lab.getCharacterCardOptions(controls);
  for (const card of cards) {
    const variant = { ...lab.createEmptyCharacterCardVariant(cards), characterProfileId: card.id };
    add(`character-apply:${card.id}`, lab.buildPage1LocksFromCharacterCardVariant(E.createEmptyLocks(), variant, cards));
  }
  const scene = await load('webapp/src/lib/page3WorldScene.js');
  for (const location of scene.WORLD_SCENE_LOCATIONS) {
    const profile = { ...scene.createEmptyPage3WorldSceneProfile(), worldLocation: location.id };
    const architecture = scene.buildPage1WorldSceneArchitecture(profile);
    if (!architecture.text) throw new Error(`missing scene architecture ${location.id}`);
    add(`scene-apply:${location.id}`, { ...E.createEmptyLocks(), subjectCount: '1', locationId: '', fixedCompositionSetId: 'none', fixedSetPositionId: 'none', fixedSetCaptureModeId: 'photographer-shot', fixedSetPerformanceStateId: 'model-natural', importedWorldSceneMode: 'architecture', importedWorldSceneLabel: architecture.label, importedWorldSceneArchitectureText: architecture.text });
  }
  const codec = await load('webapp/src/features/saved-cards/cardCodec.js');
  const sample = E.generatePrompts(1, cases[0].locks, [], { random: E.createSeededRandom('saved-baseline') })[0];
  sample.id = 'catalog-baseline-saved'; sample.date = '2026-10-24T00:00:00.000Z';
  const legacy = { ...sample, id: 'catalog-baseline-legacy', selection: { ...sample.selection, duoPoseId: 'shoulder-lean', subjectCount: '2' }, extraPrompts: [...sample.extraPrompts, { id: 'chest-up-mj-portrait', label: '歷史 MJ 胸上', text: '  Historical MJ chest.\nDo not rewrite.  ' }] };
  const savedPayloads = { raw: legacy, compactV3: codec.serializeFavoritePrompt(sample), compactV2: { ...codec.serializeFavoritePrompt(legacy), v: 2 }, markdown: codec.buildMarkdownExport(sample), legacyMarkdown: codec.buildMarkdownExport(legacy).replace('## Gpt', '## Grok Structured Prompt').replace('## Z-Image', '## Grok/Z-Image') };
  return { format: 'catalog-corpus-v1', savedPayloads, audit: { count: 200, seed: 'prompt-quality-baseline' }, cases };
}
