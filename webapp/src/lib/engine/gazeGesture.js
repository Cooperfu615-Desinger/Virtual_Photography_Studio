// expression-pose-v2 P4 (Cooper 2026-10-20): the new B panel keeps 姿勢, 手勢, 表情
// and 視線. Gaze reuses the reviewed English of existing head options; gestures
// come from Docs/specs/expression-pose-v2.md §6 and pose-library-lying-v1.md §5.
// 拍攝方式 maps onto the existing selfie hand and prop options so their camera,
// orbit and Z-Image capture behavior stays unchanged.
import { joinSpecifiedActionClauses } from './specifiedActions.js';

const freeze = value => Object.freeze(value);
const choice = (id, zh) => freeze({ id, zh, en: '', meta: freeze({ tags: freeze([id]) }) });

export const GAZE_OPTIONS = freeze([
  choice('none', '全無'),
  choice('random', '隨機'),
  freeze({ id: 'gaze-camera', zh: '看鏡頭', en: '' }),
  freeze({ id: 'gaze-distance', zh: '看向遠方', en: '' }),
  freeze({ id: 'gaze-down', zh: '低頭', en: '' }),
  freeze({ id: 'gaze-back', zh: '回眸', en: '' }),
]);

// Head option per gaze: lying orientations use their lying head variants; a
// missing entry means the gaze is not available for that orientation.
const GAZE_HEADS = freeze({
  'gaze-camera': { default: 'head-camera-natural', 'lying-side': 'lying-side-head-toward-camera', 'lying-prone': 'lying-prone-head-toward-camera', 'lying-supine': 'head-camera-natural' },
  'gaze-distance': { default: 'head-away-profile', 'lying-side': 'lying-side-head-away', 'lying-prone': 'lying-prone-head-turned-side', 'lying-supine': 'lying-supine-head-turned-side' },
  'gaze-down': { default: 'head-down-three-quarter' },
  'gaze-back': { default: 'head-turned-back-camera' },
});

const CONCRETE_GAZES = GAZE_OPTIONS.filter(option => GAZE_HEADS[option.id]);
const isLyingOrientation = id => typeof id === 'string' && id.startsWith('lying-');
const isBackView = orbit => Boolean(orbit?.meta?.tags?.includes('back_view'));
export const isBackViewOrbit = isBackView;

/** Cooper 2026-10-20 (option B): an explicit gaze other than 回眸 keeps a random
 * orbit away from back views, so the chosen gaze is not dropped. */
export const gazeAvoidsBackView = gazeId => Boolean(GAZE_HEADS[gazeId]) && gazeId !== 'gaze-back';

/** The head option for a gaze, or '' when the gaze cannot apply (back view keeps only 回眸). */
export function gazeHeadId(gazeId, { orientationId = '', orbit = null } = {}) {
  const heads = GAZE_HEADS[gazeId];
  if (!heads) return '';
  if (isBackView(orbit) && gazeId !== 'gaze-back') return '';
  return isLyingOrientation(orientationId) ? heads[orientationId] || '' : heads.default;
}

export function availableGazeOptions(context = {}) {
  return CONCRETE_GAZES.filter(option => gazeHeadId(option.id, context));
}

/** null when gaze is unused (legacy head locks stay in charge); otherwise the
 * resolved gaze and its head id ('' writes no head). 隨機 uses one random() call. */
export function resolveGaze(gazeId, context = {}, random = Math.random) {
  if (!gazeId || gazeId === 'none') return null;
  if (gazeId === 'random') {
    const pool = availableGazeOptions(context);
    if (!pool.length) return { id: 'none', headId: '' };
    const option = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
    return { id: option.id, headId: gazeHeadId(option.id, context) };
  }
  if (!GAZE_HEADS[gazeId]) return null;
  return { id: gazeId, headId: gazeHeadId(gazeId, context) };
}

const gesture = (id, zh, en, scope, extra = {}) => freeze({ id, zh, en, scope, meta: freeze({ tags: freeze(['gesture']), ...extra }) });

export const GESTURE_OPTIONS = freeze([
  choice('none', '全無'),
  choice('random', '隨機'),
  gesture('gesture-hands-clasped-hips', '雙手輕握於髖前', 'both hands loosely clasped in front of her hips', 'general'),
  gesture('gesture-collarbone', '一手放鎖骨', 'one hand resting on her collarbone and the other relaxed at her side', 'general'),
  gesture('gesture-tuck-hair', '撥頭髮到耳後', 'one hand lightly tucking a strand of hair behind her ear', 'general'),
  gesture('gesture-front-pockets', '雙手插前口袋', 'both hands slipped into her front pockets', 'general', { requiresWardrobeRole: 'pants' }),
  // Standing library v1 §7 (Cooper 2026-10-20): selectable now, out of 隨機 until the image round.
  gesture('gesture-hand-on-head', '一手扶頭', 'one hand resting on top of her head', 'general', { randomEligible: false }),
  gesture('gesture-hands-behind-head', '雙手抱頭後', 'both hands raised to the back of her head, elbows spread out', 'general', { randomEligible: false }),
  gesture('gesture-hands-behind-back', '雙手背後', 'both hands clasped behind her back', 'general', { randomEligible: false }),
  gesture('gesture-arms-overhead', '雙臂上舉', 'both arms raised overhead', 'general', { randomEligible: false }),
  gesture('gesture-prone-chin-hands', '下巴靠在交疊的雙手上', 'her chin resting on her stacked hands', 'lying-prone'),
  gesture('gesture-prone-cheeks-cupped', '雙手托腮', 'her cheeks cupped in both hands', 'lying-prone'),
  gesture('gesture-prone-tuck-hair', '一手撥頭髮', 'one hand lightly tucking her hair behind her ear', 'lying-prone'),
  gesture('gesture-prone-hands-front', '雙手輕放在前方', 'her hands resting loosely in front of her', 'lying-prone'),
  gesture('gesture-supine-arms-overhead', '雙臂舉過頭頂', 'both arms stretched loosely above her head', 'lying-supine'),
  gesture('gesture-supine-hand-stomach', '一手放腹部、一手在身側', 'one hand resting on her stomach and the other at her side', 'lying-supine'),
  gesture('gesture-supine-forearm-forehead', '一手放在額頭', 'one forearm resting across her forehead', 'lying-supine'),
  gesture('gesture-side-head-on-arm', '頭枕在彎曲的手臂上', 'her head resting on her bent lower arm', 'lying-side'),
  gesture('gesture-side-hand-hip', '上手放在腰側', 'her upper hand resting on her hip', 'lying-side'),
]);

const CONCRETE_GESTURES = GESTURE_OPTIONS.filter(option => option.scope);

/** Gestures need a library action whose hands are free; 任意 already leaves the hands to the model. */
export function actionAcceptsGesture(action) {
  return Boolean(action?.clauses) && action.hands?.mode === 'free' && !action.meta?.tags?.includes('menu_choice');
}

export function gestureFitsAction(option, action) {
  if (!actionAcceptsGesture(action) || !option?.scope) return false;
  return isLyingOrientation(action.orientationId) ? option.scope === action.orientationId : option.scope === 'general';
}

export function applicableGestureOptions(action) {
  return CONCRETE_GESTURES.filter(option => gestureFitsAction(option, action));
}

/** A concrete choice is honored when it fits the action; 隨機 draws (one random()
 * call) only gestures whose wardrobe requirement is positively present. */
export function resolveGesture(gestureId, action, { wardrobeSignals = {} } = {}, random = Math.random) {
  if (!gestureId || gestureId === 'none' || !actionAcceptsGesture(action)) return null;
  if (gestureId === 'random') {
    const pool = applicableGestureOptions(action)
      .filter(option => option.meta.randomEligible !== false)
      .filter(option => !option.meta.requiresWardrobeRole || wardrobeSignals[option.meta.requiresWardrobeRole] === 'present');
    return pool.length ? pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))] : null;
  }
  const option = CONCRETE_GESTURES.find(item => item.id === gestureId);
  return gestureFitsAction(option, action) ? option : null;
}

/** The action English with the gesture added as an upper-body clause after its
 * last upper clause, so full-body and upper-body crops both keep it. */
export function actionTextWithGesture(action, option) {
  if (!option) return { en: action.en, upperBodyEn: action.upperBodyEn };
  const clauses = [...action.clauses];
  const lastUpper = clauses.map(item => item.region).lastIndexOf('upper');
  const at = lastUpper >= 0 ? lastUpper + 1 : clauses.map(item => item.region).lastIndexOf('core') + 1;
  clauses.splice(at, 0, { region: 'upper', join: ', ', en: option.en });
  return { en: joinSpecifiedActionClauses(clauses), upperBodyEn: joinSpecifiedActionClauses(clauses, ['core', 'upper']) };
}

export const CAPTURE_STYLE_OPTIONS = freeze([
  freeze({ id: 'standard', zh: '一般拍攝', en: '', meta: freeze({ tags: freeze(['none']) }) }),
  freeze({ id: 'selfie', zh: '自拍', en: '', hand: 'selfie-natural-right-arm' }),
  freeze({ id: 'companion', zh: '男友／閨蜜視角', en: '', hand: 'selfie-companion-camera-interaction' }),
  freeze({ id: 'mirror', zh: '鏡子自拍', en: '', prop: 'selfie-mirror-phone-visible' }),
]);

const SELFIE_HAND_IDS = new Set(CAPTURE_STYLE_OPTIONS.map(option => option.hand).filter(Boolean));
const SELFIE_PROP_IDS = new Set(CAPTURE_STYLE_OPTIONS.map(option => option.prop).filter(Boolean));

export const isSelfieCaptureStyle = id => CAPTURE_STYLE_OPTIONS.some(option => option.id === id && (option.hand || option.prop));

/** Single-subject standard shooting only: a selfie style becomes the matching
 * hand or prop lock before generation. 一般拍攝 leaves the locks untouched. */
export function applyCaptureStyleLocks(locks = {}) {
  const option = CAPTURE_STYLE_OPTIONS.find(item => item.id === locks.captureStyleId);
  if (!option || (!option.hand && !option.prop) || locks.subjectCount !== '1' || locks.captureMode === 'observation') return locks;
  return { ...locks, poseHandId: option.hand || 'none', posePropId: option.prop || 'none' };
}

/** The 拍攝方式 an older selection implies through its selfie hand or prop. */
export function captureStyleFromLegacyLocks(locks = {}) {
  if (SELFIE_PROP_IDS.has(locks.posePropId)) return CAPTURE_STYLE_OPTIONS.find(option => option.prop === locks.posePropId).id;
  if (SELFIE_HAND_IDS.has(locks.poseHandId)) return CAPTURE_STYLE_OPTIONS.find(option => option.hand === locks.poseHandId).id;
  return 'standard';
}
