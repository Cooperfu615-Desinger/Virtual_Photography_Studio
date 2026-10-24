import { OBSERVATION_CAPTURE_OPTION_GROUPS } from '../data/observationCapturePromptOptions.js';
import { activeImportedPerson, importedPersonLocks, normalizeImportedPerson } from './observationCaptureImport.js';

const optional = { id: 'none', zh: '不額外添加', en: '' };
export const CAPTURE_GROUPS = [
  { key: 'scene', label: '場景', options: OBSERVATION_CAPTURE_OPTION_GROUPS.scenes },
  { key: 'action', label: '生活動作', options: OBSERVATION_CAPTURE_OPTION_GROUPS.actions },
  { key: 'discovery', label: '察覺鏡頭', options: OBSERVATION_CAPTURE_OPTION_GROUPS.discoveryStates },
  { key: 'position', label: '觀察位置', options: OBSERVATION_CAPTURE_OPTION_GROUPS.positions },
  { key: 'foreground', label: '前景遮擋', options: [...OBSERVATION_CAPTURE_OPTION_GROUPS.foregrounds, optional] },
  { key: 'lens', label: '鏡頭', options: OBSERVATION_CAPTURE_OPTION_GROUPS.lenses },
  { key: 'lighting', label: '環境光線', options: OBSERVATION_CAPTURE_OPTION_GROUPS.lighting },
  { key: 'texture', label: '成像質感', options: [...OBSERVATION_CAPTURE_OPTION_GROUPS.textures, optional] },
];
export const CAPTURE_OWNED_KEYS = [
  'specifiedActionId', 'actionPoseCardId', 'expressionId', 'poseId', 'specialActionId',
  'poseBaseId', 'poseOrientationId', 'poseArrangementId', 'poseHandId', 'posePropId', 'poseHeadId', 'poseAnchorId',
  'sceneAttributeId', 'locationId', 'lightingId', 'lightDirectionId',
  'importedWorldSceneMode', 'importedWorldSceneLabel', 'importedWorldSceneArchitectureText',
  'imageTypePresetId', 'styleId', 'angleId', 'orbitId', 'lensId', 'apertureId', 'shutterId', 'opticalEffectId', 'filmId', 'cameraSystemId',
];
export function normalizeCaptureProfile(raw = {}) {
  const value = raw && typeof raw === 'object' ? raw : {};
  return { version: 1, seed: Number.isSafeInteger(value.seed) && value.seed > 0 ? value.seed : 1,
    selected: Object.fromEntries(CAPTURE_GROUPS.map(({ key }) => [key, typeof value.selected?.[key] === 'string' ? value.selected[key] : ''])),
    fixed: Object.fromEntries(CAPTURE_GROUPS.map(({ key }) => [key, value.fixed?.[key] === true])),
    ...(value.personSource === 'full-body' ? { personSource: 'full-body', importedPerson: normalizeImportedPerson(value.importedPerson) }
      : value.importedPerson ? { importedPerson: normalizeImportedPerson(value.importedPerson) } : {}),
    ...('availablePerson' in value ? { availablePerson: normalizeImportedPerson(value.availablePerson) } : {}),
  };
}
const present = value => Boolean(value && !['none', 'random'].includes(value));
export function captureEligibility(locks, controls) {
  if (locks.subjectCount !== '1') return '觀察式抓拍僅支援單人，請先切回單人。';
  if (present(locks.specialSubjectId)) return '請先解除特殊主體，再選擇角色卡。';
  if (present(locks.fixedCompositionSetId)) return '請先解除固定構圖場景。';
  const card = controls.find(c => c.key === 'characterProfileId')?.options?.find(o => o.id === locks.characterProfileId);
  if (locks.observationCapture?.personSource === 'full-body') {
    if (!activeImportedPerson(locks)) return '請先在一般拍攝產生單人全身角色照，再匯入人物與穿搭。';
  } else if (card?.specialSubject !== 'character-profile') return '請選擇角色卡，或匯入全身角色照。';
  if (present(locks.framingId)) {
    const framing = controls.find(c => c.key === 'framingId')?.options?.find(o => o.id === locks.framingId);
    if (!framing || !/full_body|medium_shot|cowboy/i.test((framing.meta?.tags || []).join(' ')) && !/全身鏡頭|中景鏡頭|牛仔/.test(framing.zh)) return '請在 E 區選擇全身、膝上或腰上景別。';
  }
  return '';
}
// Pairwise constraints are evaluated for partial candidates too. A backtracking
// search respects ALL fixed fields, including ones later in the display order.
export function captureConflict(s) {
  const { scene, action, discovery, position, foreground, lens, lighting, texture } = s;
  const shelves = scene && ['bookstore-aisle', 'convenience-store'].includes(scene.id);
  const glass = scene && ['cafe-corner', 'shopping-mall', 'convenience-store', 'street-corner', 'commercial-street'].includes(scene.id);
  if (scene && action?.id === 'browsing-shelf' && !shelves) return '瀏覽貨架需要書店或便利商店場景。';
  if (scene && action?.id === 'leaning-on-rail' && scene.id !== 'park-path') return '靠欄杆僅搭配公園步道的欄杆區。';
  if (scene && position?.id === 'through-shelf-gap' && !shelves) return '貨架間隙需要書店或便利商店場景。';
  if (scene && position?.id === 'through-storefront-glass' && !glass) return '此場景沒有可用的店面玻璃。';
  if (scene && position?.id === 'below-railing' && !['park-path', 'cafe-corner'].includes(scene.id)) return '低位觀察需要公園座椅或咖啡廳桌面。';
  if (scene && foreground?.id === 'shelf-edge' && !shelves) return '貨架前景需要書店或便利商店。';
  if (scene && foreground?.id === 'glass-reflection' && !glass) return '玻璃反射需要場景中的玻璃。';
  if (scene && foreground?.id === 'railing-edge' && !['park-path', 'cafe-corner'].includes(scene.id)) return '此場景沒有適用的座椅／欄杆前景。';
  if (scene && foreground?.kinds && !foreground.kinds.includes(scene.kind)) return '前景與室內／室外場景不相容。';
  const lightScenes = {
    'cloudy-daylight': ['street-corner', 'park-path'], 'cool-mall-light': ['shopping-mall', 'train-station', 'bookstore-aisle'],
    'warm-cafe-light': ['cafe-corner'], 'fluorescent-store-light': ['convenience-store'],
    'dusk-practical-light': ['commercial-street', 'street-corner'], 'park-filtered-light': ['park-path'],
  };
  if (scene && lighting && !lightScenes[lighting.id]?.includes(scene.id)) return '光線與場景或時段不相容。';
  if (position?.id === 'distant-telephoto' && lens && !['short-telephoto-85mm', 'long-telephoto-135mm'].includes(lens.id)) return '遠距長焦需要 85mm 或 135mm。';
  if (position?.id === 'casual-phone-angle' && lens && lens.id !== 'phone-wide') return '手機隨手角度需要手機廣角鏡頭。';
  if (position?.id === 'through-storefront-glass' && foreground && !['glass-reflection', 'none'].includes(foreground.id)) return '隔玻璃觀察搭配玻璃反射或不額外添加前景。';
  if (position?.id === 'through-shelf-gap' && foreground && !['shelf-edge', 'none'].includes(foreground.id)) return '貨架間隙搭配貨架前景或不額外添加前景。';
  if (action && discovery && ['checking-phone', 'browsing-shelf', 'leaning-on-rail'].includes(action.id) && discovery.id !== 'unaware') return '此動作的專注／視線描述需搭配沒有察覺鏡頭。';
  if (texture?.id === 'phone-processing' && lens && lens.id !== 'phone-wide') return '手機運算直出需使用手機鏡頭。';
  if (texture?.id === 'compact-camera-grain' && lens?.id === 'phone-wide') return '小型相機顆粒與手機直出分開使用。';
  if (texture?.id === 'minor-motion-blur' && action && !['walking-through', 'turning-back', 'adjusting-hair', 'adjusting-clothing'].includes(action.id)) return '動態模糊需要走動、回頭或整理動作。';
  if (texture?.id === 'reflection-interference' && position && foreground && position.id !== 'through-storefront-glass' && foreground.id !== 'glass-reflection') return '反射質感需要玻璃觀察位置或反射前景。';
  return '';
}
export function resolveCapture(raw, { reroll = false } = {}) {
  const profile = normalizeCaptureProfile(raw);
  let seed = profile.seed >>> 0;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const chosen = {};
  for (const group of CAPTURE_GROUPS) {
    if (!profile.fixed[group.key]) continue;
    const option = group.options.find(o => o.id === profile.selected[group.key]);
    if (!option) return { profile, error: `${group.label}的固定選項已不可用，請重新選擇。`, selections: null };
    chosen[group.key] = option;
  }
  const error = captureConflict(chosen);
  if (error) return { profile, error, selections: null };
  const order = ['scene', 'position', 'action', 'discovery', 'lens', 'foreground', 'lighting', 'texture'];
  const search = index => {
    if (index === order.length) return { ...chosen };
    const key = order[index];
    if (chosen[key]) return search(index + 1);
    const group = CAPTURE_GROUPS.find(g => g.key === key);
    const candidates = group.options.map(option => ({ option, rank: random() })).sort((a, b) => a.rank - b.rank).map(x => x.option);
    const prior = group.options.find(o => o.id === profile.selected[key]);
    if (!reroll && prior) candidates.unshift(prior);
    if (reroll && prior) candidates.sort((a,b) => Number(a.id === prior.id) - Number(b.id === prior.id));
    for (const option of candidates) {
      chosen[key] = option;
      if (!captureConflict(chosen)) { const result = search(index + 1); if (result) return result; }
      delete chosen[key];
    }
    return null;
  };
  const selections = search(0);
  return { profile: selections ? { ...profile, selected: Object.fromEntries(CAPTURE_GROUPS.map(g => [g.key, selections[g.key].id])) } : profile,
    selections, error: selections ? '' : '固定項目無法組成相容組合，請調整或解除固定。' };
}
export function rerollCapture(raw) {
  const p = normalizeCaptureProfile(raw);
  return resolveCapture({ ...p, seed: p.seed + 1 }, { reroll: true });
}
export function captureOptionReason(raw, key, id) {
  const p = normalizeCaptureProfile(raw);
  return resolveCapture({ ...p, selected: { ...p.selected, [key]: id }, fixed: { ...p.fixed, [key]: true } }).error;
}
export function captureEffectiveLocks(locks) {
  const person = activeImportedPerson(locks);
  return { ...locks, ...(person ? importedPersonLocks(person) : {}), ...Object.fromEntries(CAPTURE_OWNED_KEYS.map(key => [key, 'none'])),
    actionPoseCardId: '', importedWorldSceneMode: 'none', importedWorldSceneLabel: '', importedWorldSceneArchitectureText: '',
    imageTypePresetId: 'photography', specifiedActionSceneRestore: null,
  };
}
const item = (option, en = option.en) => ({ ...option, en, meta: { tags: [], minVisibility: 'full' } });
export function captureContext(selections) {
  const s = selections;
  const sceneText = s.scene.en + (s.action.id === 'leaning-on-rail' ? ', with a railing beside the park path' : '');
  // Camera location supplies its own glass once; a matching foreground only
  // adds the visible reflection fragment, never a second camera statement.
  const position = s.position.en;
  const foreground = s.foreground.en;
  return {
    observationCapture: s,
    imageTypePreset: { id: 'observation-photography', zh: '舞台化觀察式抓拍', en: 'Photorealistic staged candid observation photograph of an adult fictional woman', meta: { tags: [] } },
    location: item(s.scene, sceneText), lighting: item(s.lighting), lightDirection: null,
    sceneAttribute: null, style: null, film: item(s.texture), opticalEffect: null,
    angle: item(s.position, `${position}. The composition is off-center and naturally imperfect${foreground ? `. ${foreground}` : ''}`),
    orbit: null, lens: item(s.lens), aperture: null, shutter: null,
  };
}
const chestActions = {
  'checking-phone': 'She looks downward, absorbed in checking her phone; her hands and phone are below the chest-up frame.',
  'adjusting-hair': 'She is casually adjusting her hair with an unfinished everyday grooming gesture.',
  'holding-drink': 'She pauses naturally with relaxed shoulders; the takeaway drink is below the chest-up frame.',
  'browsing-shelf': 'She focuses on a nearby shelf, with her reaching hand outside the chest-up frame.',
  'waiting-in-place': 'She is waiting in place with relaxed shoulders and an unplanned posture.',
  'walking-through': 'She is walking, with natural movement in her hair and visible upper clothing.',
  'adjusting-clothing': 'She briefly adjusts her clothing, with the hand action below the chest-up frame.',
  'leaning-on-rail': 'She is leaning casually against a railing and looking away; the railing contact is below the chest-up frame.',
  'turning-back': 'She turns her head back while moving, as if responding to something outside the frame.',
};
export function capturePoseText(s, chest = false, waist = false) {
  const actionText = chest ? chestActions[s.action.id] : waist && s.action.id === 'waiting-in-place' ? 'She is waiting in place with an unplanned posture.' : s.action.en;
  return [actionText, s.discovery.en].join('. ').replace(/\.\./g, '.');
}
export function capturePoseItem(s) {
  return { id: `character:姿勢組合器-pose-composer:observation-${s.action.id}`, zh: s.action.zh, en: capturePoseText(s),
    meta: { tags: ['pose_composer'], minVisibility: 'full', observationCapture: s } };
}

export function captureChestScene(s) {
  return s.scene.en
    .replace('with storefronts, polished floor reflections, and everyday foot traffic', 'with storefronts and everyday foot traffic')
    .replace('with storefronts, curb edges, passing bicycles, and layered urban background detail', 'with storefronts and layered urban background detail')
    .replace('with trees, benches, a paved walkway, and ordinary visitors in the middle distance', 'with trees and ordinary visitors in the middle distance')
    .replace('with practical shop lights, signs, wet pavement, and people moving through the scene', 'with practical shop lights, signs, and people moving through the scene');
}
