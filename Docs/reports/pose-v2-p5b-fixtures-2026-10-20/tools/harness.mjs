// P5b fixture triage harness (read-only against repo). Run with cwd = repo webapp/.
import { writeFileSync } from 'node:fs';
const ROOT = process.env.REPO || '/Users/cooperfu/Projects/Virtual_Photography_Studio/.worktrees/pose-v2-p5b/webapp/src/lib/';
const E = ROOT + 'engine/';
const imp = p => import(p);
const eng = await imp(ROOT + 'engine.js');
const { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } = eng;
const S = await imp(E + 'sceneIntegratedAssemblyTestSupport.js');
const { PROMPT_OUTPUT_CONTRACTS } = await imp(E + 'promptOutputContracts.js');
const { SCENE_INTEGRATED_ASSEMBLY_FIXTURES } = await imp(E + 'sceneIntegratedAssemblyFixtures.js');
const { Z_IMAGE_ON_LOCATION_FIXTURES } = await imp(E + 'zImageOnLocationFixtures.js');
const UP = await imp(E + 'zImageUpperSceneFixtures.js');
const { FULL_CAMERA_REGRESSION } = await imp(E + 'zImageFullBodyCameraFixtures.js');
const { UPPER_SCENE_EXTENSION_REGRESSION } = await imp(E + 'zImageUpperSceneExtensionFixtures.js');
const { SCENE_DETAIL_PRIORITY_REGRESSION } = await imp(E + 'zImageSceneDetailPriorityFixtures.js');
const { AMBIENT_MATRIX, AMBIENT_EXCLUDED } = await imp(E + 'ambientLightFixtures.js');
const { GPT_VISIBILITY_ALL } = await imp(E + 'gptSceneVisibilityFixtures.js');
const { GPT_CAMERA_SPATIAL_FIXTURES } = await imp(E + 'gptCameraSpatialFixtures.js');
const { CLOSE_WORM_CASES, CLOSE_WORM_EXCLUDED } = await imp(E + 'closeWormEyeFixtures.js');
const { REPRESENTATIVE_PROMPT_FIXTURES } = await imp(E + 'representativePromptFixtures.js');
const { midjourneyNaturalFixtures, naturalFixtureLocks } = await imp(E + 'midjourneyNaturalFixtures.js');
const { nanoBananaFixtures } = await imp(E + 'nanoBananaFixtures.js');
const { nanoBananaFacialFeaturesFixtures } = await imp(E + 'nanoBananaFacialFeaturesFixtures.js');
const { COMPOSITION_VISIBILITY_REGRESSION_FIXTURES } = await imp(E + 'compositionVisibilityFixtures.js');
const FFD = await imp(E + 'fixedFramingDerivedPromptFixtures.js');
const FFI = await imp(E + 'fixedFramingPromptIntegrationFixtures.js');
const { AI_PROMPT_LENGTH_FIXTURES } = await imp(E + 'aiPromptLengthFixtures.js');
const { BODY_TYPE_CATALOG_V2 } = await imp(E + 'bodyTypeCatalogFixtures.js');

const controls = getLockControls();
const ctl = k => controls.find(c => c.key === k);
const LEGACY = ['poseBaseId', 'poseOrientationId', 'poseArrangementId', 'poseHandId', 'posePropId', 'poseHeadId', 'poseAnchorId', 'poseId', 'specialActionId'];
const OUT = Object.keys(PROMPT_OUTPUT_CONTRACTS);
const OUT_ZH = { grokPrompt: 'GPT', zImagePrompt: 'Z', midjourneyPrompt: 'MJ', nanoBananaPrompt: 'Nano', chestUpPortraitPrompt: '胸上', fullBodyCharacterPrompt: '全身角色圖' };

function allNone(start = createEmptyLocks()) {
  const locks = { ...start };
  for (const c of controls) {
    const none = c.options?.find(o => o.zh === '全無' || o.zh === '無額外表情');
    if (none) locks[c.key] = none.id;
  }
  return locks;
}
function resolveSel(key, sel) {
  const c = ctl(key);
  if (sel && typeof sel === 'object' && !Array.isArray(sel) && typeof sel.byZh === 'string') {
    const o = c?.options?.find(x => x.zh === sel.byZh); if (!o) throw new Error(`${key}:${sel.byZh}`); return o.id;
  }
  if (typeof sel === 'string' && c?.options?.length && !c.options.some(o => o.id === sel)) {
    const o = c.options.find(x => x.zh === sel); if (o) return o.id;
  }
  return sel;
}
function materializeGeneric(locksSel, base) {
  const locks = { ...base };
  for (const [k, v] of Object.entries(locksSel)) locks[k] = resolveSel(k, v);
  return locks;
}
const noneVal = (k) => ctl(k)?.options?.find(o => o.zh === '全無')?.id ?? 'none';
function isActiveLegacy(k, v) {
  if (v === undefined || v === null || v === '' || v === 'none') return false;
  const o = ctl(k)?.options?.find(x => x.id === v);
  if (o && o.zh === '全無') return false;
  return true;
}
const activeLegacy = locks => Object.fromEntries(LEGACY.filter(k => isActiveLegacy(k, locks[k])).map(k => [k, locks[k]]));

const GAZE_FROM_HEAD = { 'head-camera-natural': 'gaze-camera', 'head-away-profile': 'gaze-distance', 'head-down-three-quarter': 'gaze-down', 'head-turned-back-camera': 'gaze-back' };
const CAPTURE_FROM_HAND = { 'selfie-natural-right-arm': 'selfie', 'selfie-companion-camera-interaction': 'companion', 'selfie-mirror-phone-visible': 'mirror' };
const CAPTURE_FROM_PROP = { 'selfie-mirror-phone-visible': 'mirror' };
function stripLegacy(locks) {
  const r = { ...locks };
  for (const k of LEGACY) r[k] = (k === 'poseId' || k === 'specialActionId') ? (locks[k] === '' ? '' : noneVal(k)) : 'none';
  return r;
}
function mapped(locks) {
  const r = stripLegacy(locks); const map = {};
  if (GAZE_FROM_HEAD[locks.poseHeadId]) { r.gazeId = GAZE_FROM_HEAD[locks.poseHeadId]; map.gazeId = r.gazeId; }
  const cs = CAPTURE_FROM_PROP[locks.posePropId] || CAPTURE_FROM_HAND[locks.poseHandId];
  if (cs) { r.captureStyleId = cs; map.captureStyleId = cs; }
  return { locks: r, map };
}

const memo = new Map();
function run(locks, seed, runtimeOptions, library = []) {
  const key = JSON.stringify([locks, seed, runtimeOptions || null, library === S.PRE_HOURGLASS_BODY_CATALOG]);
  if (memo.has(key)) return memo.get(key);
  let res;
  try {
    const p = generatePrompts(1, locks, library, { ...(runtimeOptions || {}), random: createSeededRandom(seed) })[0];
    if (!p) res = { error: 'null prompt' };
    else res = { outputs: Object.fromEntries(OUT.map(f => { const s = PROMPT_OUTPUT_CONTRACTS[f].source; return [f, (s.kind === 'field' ? p[s.key] : p.extraPrompts?.find(e => e.id === s.id)?.text) || '']; })), selection: p.selection };
  } catch (e) { res = { error: String(e?.message || e) }; }
  memo.set(key, res); return res;
}
function diffOutputs(a, b) {
  if (a.error || b.error) return ['ERROR:' + (a.error || b.error)];
  return OUT.filter(f => a.outputs[f] !== b.outputs[f]).map(f => OUT_ZH[f]);
}
function diffSelection(a, b) {
  if (a.error || b.error) return [];
  const keys = new Set([...Object.keys(a.selection || {}), ...Object.keys(b.selection || {})]);
  return [...keys].filter(k => JSON.stringify(a.selection?.[k]) !== JSON.stringify(b.selection?.[k])).sort();
}

// ---------- fixture collection ----------
const rows = [];
const scene = (f) => ({ locks: S.materializeSceneFixture(f), seed: f.seed });
function addList(source, list, mat, baselines, idOf = f => f.id) {
  for (const f of list) rows.push({ source, id: idOf(f), fixture: f, mat: () => mat(f), baselines });
}
addList('sceneIntegratedAssemblyFixtures.js#SCENE_INTEGRATED_ASSEMBLY_FIXTURES', SCENE_INTEGRATED_ASSEMBLY_FIXTURES, scene,
  ['sceneIntegratedAssemblyBaseline.json', 'sceneDirectionalZImageExpected.json*', 'sceneIntegratedMidjourneyExpected.json*', 'midjourneyNaturalHistoricalProtected.json[scene:<id>]']);
addList('zImageOnLocationFixtures.js#Z_IMAGE_ON_LOCATION_FIXTURES', Z_IMAGE_ON_LOCATION_FIXTURES, scene, ['zImageOnLocationBaseline.json']);
addList('zImageUpperSceneFixtures.js#UPPER_SCENE_MATRIX+EXCLUDED+CONTROLS', [...UP.UPPER_SCENE_MATRIX, ...UP.UPPER_SCENE_EXCLUDED, ...UP.UPPER_SCENE_CONTROLS], scene, ['zImageUpperSceneBaseline.json', 'midjourneyNaturalHistoricalProtected.json[upperScene]']);
addList('zImageFullBodyCameraFixtures.js#FULL_CAMERA_REGRESSION', FULL_CAMERA_REGRESSION, scene, ['zImageFullBodyCameraBaseline.json', 'midjourneyNaturalHistoricalProtected.json[fullCamera]']);
addList('zImageUpperSceneExtensionFixtures.js#UPPER_SCENE_EXTENSION_REGRESSION', UPPER_SCENE_EXTENSION_REGRESSION, scene, ['zImageUpperSceneExtensionBaseline.json', 'midjourneyNaturalHistoricalProtected.json[upperExtension]']);
addList('zImageSceneDetailPriorityFixtures.js#SCENE_DETAIL_PRIORITY_REGRESSION', SCENE_DETAIL_PRIORITY_REGRESSION, scene, ['zImageSceneDetailPriorityBaseline.json', 'midjourneyNaturalHistoricalProtected.json[sceneDetail]']);
addList('ambientLightFixtures.js#AMBIENT_MATRIX', AMBIENT_MATRIX, scene, ['ambientLightBaseline.json', 'midjourneyNaturalHistoricalProtected.json[ambient]']);
addList('ambientLightFixtures.js#AMBIENT_EXCLUDED', AMBIENT_EXCLUDED, scene, ['ambientLightBaseline.json(excluded)', 'midjourneyNaturalHistoricalProtected.json[ambient-excluded:<id>]']);
addList('gptSceneVisibilityFixtures.js#GPT_VISIBILITY_ALL', GPT_VISIBILITY_ALL, scene, ['gptSceneVisibilityBaseline.json', 'midjourneyNaturalHistoricalProtected.json[visibility]']);
addList('gptCameraSpatialFixtures.js#GPT_CAMERA_SPATIAL_FIXTURES', GPT_CAMERA_SPATIAL_FIXTURES, scene, ['gptCameraSpatialBaseline.json', 'midjourneyNaturalHistoricalProtected.json[camera]']);
addList('closeWormEyeFixtures.js#[GPT_CAMERA_SPATIAL+CLOSE_WORM_CASES+CLOSE_WORM_EXCLUDED]', [...GPT_CAMERA_SPATIAL_FIXTURES, ...CLOSE_WORM_CASES, ...CLOSE_WORM_EXCLUDED], scene, ['closeWormEyeBaseline.json', 'midjourneyNaturalHistoricalProtected.json[worm]']);
addList('representativePromptFixtures.js#REPRESENTATIVE_PROMPT_FIXTURES', REPRESENTATIVE_PROMPT_FIXTURES, f => ({ locks: naturalFixtureLocks(f.locks), seed: f.seed }),
  ['promptOutputContracts.test.js(斷言)', 'midjourneyNaturalProtectedBaseline.json[representative:<id>]', 'midjourneyBodyPreservationBaseline.json[representative:<id>]']);
addList('midjourneyNaturalFixtures.js#midjourneyNaturalFixtures()', midjourneyNaturalFixtures().filter(f => !f.id.startsWith('representative:')), f => ({ locks: f.locks, seed: f.seed }), ['midjourneyNaturalProtectedBaseline.json', 'midjourneyBodyPreservationBaseline.json']);
const nano = nanoBananaFixtures();
addList('nanoBananaFixtures.js#nanoBananaFixtures()', nano, f => ({ locks: f.locks, seed: f.seed, runtimeOptions: f.runtimeOptions }), ['nanoBananaProtectedBaseline.json', 'nanoBananaFacialFeaturesProtectedBaseline.json']);
addList('nanoBananaFacialFeaturesFixtures.js#facial:*', nanoBananaFacialFeaturesFixtures().slice(nano.length), f => ({ locks: f.locks, seed: f.seed, runtimeOptions: f.runtimeOptions }), ['nanoBananaFacialFeaturesProtectedBaseline.json']);
addList('compositionVisibilityFixtures.js#COMPOSITION_VISIBILITY_REGRESSION_FIXTURES', COMPOSITION_VISIBILITY_REGRESSION_FIXTURES, f => ({ locks: materializeGeneric(f.locks, createEmptyLocks()), seed: f.seed }), ['compositionVisibility*.test.js(斷言)']);
addList('fixedFramingDerivedPromptFixtures.js#FIXED_FRAMING_DERIVED_PROMPT_FIXTURES', FFD.FIXED_FRAMING_DERIVED_PROMPT_FIXTURES, f => ({ locks: materializeGeneric(f.locks, allNone()), seed: f.seed || f.id }), ['fixedFramingDerivedPromptContract/Runtime.test.js、chestUpSameState.test.js(斷言)']);
addList('fixedFramingDerivedPromptFixtures.js#HALF/FULL_FACE_COMPOSITION_REGRESSION', [...FFD.HALF_FACE_COMPOSITION_REGRESSION_FIXTURES, ...FFD.FULL_FACE_COMPOSITION_REGRESSION_FIXTURES], f => ({ locks: materializeGeneric(f.locks || {}, allNone()), seed: f.seed || f.id }), ['fixedFraming*.test.js(斷言)']);
addList('fixedFramingPromptIntegrationFixtures.js#FIXED_FRAMING_PHASE6_SINGLE_MATRIX', FFI.FIXED_FRAMING_PHASE6_SINGLE_MATRIX, f => ({ locks: materializeGeneric({ subjectCount: '1', ...f.locks, framingId: { byZh: f.framingZh } }, allNone()), seed: f.seed }), ['fixedFramingPromptIntegration.test.js(斷言)']);
addList('aiPromptLengthFixtures.js#AI_PROMPT_LENGTH_FIXTURES', AI_PROMPT_LENGTH_FIXTURES, f => ({ locks: materializeGeneric(f.locks, allNone()), seed: f.seed || f.id }), ['aiPromptLength*.test.js(斷言)']);
// Inline: engineMirrorSelfieProp.test.js PRE_MOVE_OUTPUT_HASHES -> midjourneyNaturalMirrorProtected.json
const opt = (k, zh) => ctl(k).options.find(o => o.zh === zh).id;
const MIRROR = [
  ['mirror:sitting:中景鏡頭 (Medium Shot)', { poseBaseId: 'sitting', poseArrangementId: 'sitting-natural', framing: '中景鏡頭 (Medium Shot)' }],
  ['mirror:standing:牛仔中景 (Cowboy Shot)', {}],
  ['mirror:lying-supine:none', { orientation: 'lying-supine', anchor: 'none' }],
  ['mirror:lying-supine:lying-bed-surface', { orientation: 'lying-supine', anchor: 'lying-bed-surface' }],
  ['mirror:lying-side:lying-bed-surface', { orientation: 'lying-side', anchor: 'lying-bed-surface' }],
  ['mirror:lying-prone:lying-bed-surface', { orientation: 'lying-prone', anchor: 'lying-bed-surface' }],
  ['untouched:selfie-natural-right-arm:牛仔中景 (Cowboy Shot)', { poseHandId: 'selfie-natural-right-arm', posePropId: 'none' }],
  ['untouched:scroll:牛仔中景 (Cowboy Shot)', { posePropId: 'hand-use-phone' }],
];
function mirrorLocks([id, { framing, orientation, anchor, ...overrides }]) {
  const base = { ...allNone(), subjectCount: '1', poseBaseId: 'standing', poseArrangementId: 'standing-natural', posePropId: 'selfie-mirror-phone-visible', poseHandId: 'none', framingId: opt('framingId', '牛仔中景 (Cowboy Shot)') };
  return { locks: { ...base, imageTypePresetId: 'photorealistic-photo', poseOrientationId: 'none', poseHeadId: 'chin-slightly-raised',
    topId: opt('topId', '落肩 T 恤'), pantsId: opt('pantsId', '皮革長褲'), locationId: opt('locationId', '室內：浴室鏡前 / 洗手台'),
    lightingId: opt('lightingId', '室內黃昏微暖餘光'), orbitId: opt('orbitId', '背面 180 度'), angleId: opt('angleId', '高位俯視鏡頭'),
    ...(framing ? { framingId: opt('framingId', framing) } : {}),
    ...(orientation ? { poseBaseId: 'lying', poseArrangementId: 'lying-natural', poseOrientationId: orientation, poseAnchorId: anchor, framingId: opt('framingId', '全身鏡頭 (Full Body Shot)') } : {}),
    ...overrides }, seed: `mirror-prop-v1:${id}` };
}
addList('engineMirrorSelfieProp.test.js#PRE_MOVE_OUTPUT_HASHES(內嵌)', MIRROR, mirrorLocks, ['midjourneyNaturalMirrorProtected.json'], f => f[0]);
// Inline: bodyTypeCatalog.test.js 60 body/framing -> midjourneyNaturalCatalogProtected.json.body
const catalogProtected = (await import(E + 'midjourneyNaturalCatalogProtected.json', { with: { type: 'json' } })).default;
addList('bodyTypeCatalog.test.js#catalogProtected.body(內嵌)', catalogProtected.body, (entry) => {
  const source = BODY_TYPE_CATALOG_V2.find(s => s.zh === entry.body);
  return { locks: { ...allNone(), subjectCount: '1', bodyTypeId: source.id, framingId: opt('framingId', entry.framing),
    topId: opt('topId', '棉質細肩背心'), pantsId: opt('pantsId', '直筒牛仔褲'), locationId: opt('locationId', '室內：英倫復古窗邊房間'),
    poseBaseId: 'standing', poseArrangementId: 'standing-natural' }, seed: 'body-catalog-v2' };
}, ['midjourneyNaturalCatalogProtected.json.body'], e => `${e.body}/${e.framing}`);

// ---------- evaluate ----------
const t0 = Date.now();
for (const r of rows) {
  const m = r.mat();
  r.locks = m.locks; r.seed = m.seed; r.runtimeOptions = m.runtimeOptions;
  r.legacy = activeLegacy(m.locks);
  if (!Object.keys(r.legacy).length) { r.cls = 'D'; continue; }
  const orig = run(m.locks, m.seed, m.runtimeOptions);
  const { locks: rw, map } = mapped(m.locks);
  const after = run(rw, m.seed, m.runtimeOptions);
  r.mapping = map;
  r.aOutputDiff = diffOutputs(orig, after);
  r.aSelectionDiff = diffSelection(orig, after);
  r.origError = orig.error || null;
  r.cls = r.aOutputDiff.length === 0 ? 'A' : 'X';
}
console.error('evaluated', rows.length, 'rows in', Date.now() - t0, 'ms');
writeFileSync(process.argv[2], JSON.stringify(rows.map(({ fixture, mat, locks, ...r }) => ({ ...r, kind: fixture?.family || fixture?.kind || undefined, title: fixture?.title, excluded: fixture?.excluded })), null, 0));
// Expose for stage 2
globalThis.__rows = rows; globalThis.__run = run; globalThis.__mapped = mapped; globalThis.__diffOutputs = diffOutputs; globalThis.__diffSelection = diffSelection; globalThis.__stripLegacy = stripLegacy;
export { rows, run, mapped, diffOutputs, diffSelection, stripLegacy, activeLegacy };
