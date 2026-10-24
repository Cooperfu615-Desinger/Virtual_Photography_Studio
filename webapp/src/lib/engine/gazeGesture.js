// expression-pose-v2 P4 (Cooper 2026-10-20): the new B panel keeps 姿勢, 手勢, 表情
// and 視線. Gaze reuses the reviewed English of existing head options; gestures
// come from Docs/specs/expression-pose-v2.md §6 and pose-library-lying-v1.md §5.
// 拍攝方式 maps onto the existing selfie hand and prop options so their camera,
// orbit and Z-Image capture behavior stays unchanged.
import { joinSpecifiedActionClauses } from './specifiedActions.js';
import { POSE_COMPOSER_PROP_OPTIONS } from './poseComposerOptions.js';

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
  // Legacy hand gestures restored (Cooper 2026-10-22, stage 1; wording rewrite is stage 2): the
  // reviewed English of the old free-composer hands, with the camera wording removed from the
  // two camera-facing ones. Wardrobe roles gate 隨機 (needs 'present') and skip a manual pick
  // whose item the resolved wardrobe lacks ('absent'). Waist-level hands drop out of chest-up.
  ...[
    ['adjust-top', '拉下上身服裝整理', 'one hand gently tugging the front of her clothing downward to adjust how it sits',
      { requiresWardrobeRole: 'upperGarment' }],
    ['lift-top-underbust', '雙手上拉上衣露出胸下緣', 'both hands lifting the front hem of her top to the lower ribcage, revealing the lower edge of the bust',
      { requiresWardrobeRole: 'topHem', randomEligible: false, omitInChestUp: true }],
    ['lift-waistband', '雙手把褲頭往上拉', 'both hands lightly gripping her waistband at both sides and giving it a small upward tug, elbows relaxed outward',
      { requiresWardrobeRole: 'bottom', omitInChestUp: true }],
    ['pull-open-outerwear', '雙手拉開外套（雙肩滑落）', 'both hands pulling the front edges of her open jacket wide apart, the jacket slipping off both shoulders and resting around her upper arms',
      { requiresWardrobeRole: 'outerwear', randomEligible: false }],
    ['cover-breasts', '雙手遮住胸部', 'both palms covering her bare chest, one palm over each breast, fingers naturally relaxed',
      { randomEligible: false }],
    ['arm-cover-chest', '單臂橫擋遮胸', 'one arm held across her bare chest, covering both breasts, the other arm relaxed at her side',
      { randomEligible: false }],
    ['outerwear-pockets', '雙手插外套口袋', 'both hands tucked into the side pockets of her outerwear, elbows relaxed and angled slightly outward',
      { requiresWardrobeRole: 'outerwear', omitInChestUp: true }],
    ['rock-horns', '雙手比 ROCK 手勢', 'both hands raised beside the shoulders, each making a rock-horns sign with the index and little fingers extended and the other fingers folded under the thumbs',
      { randomEligible: false }],
    ['heart-near-face', '雙手比愛心', 'both hands forming one heart shape beside the lower face near one side of the chin, thumb tips meeting below and curved index fingers meeting above, elbows naturally bent',
      { randomEligible: false, requiresFaceVisibility: true }],
    ['finger-heart', '手指愛心', 'one hand making a finger heart, thumb and index finger crossed near their tips, the other hand resting naturally',
      { randomEligible: false }],
    ['open-palm', '單手向前張開手掌', 'one arm extended forward with the open palm facing outward, fingers naturally spread',
      { randomEligible: false }],
    ['support-chin', '單手托下巴', 'one hand lightly supporting the chin with the fingertips under the jaw, the other hand relaxed',
      { requiresFaceVisibility: true }],
    ['bite-finger', '單手輕咬食指', 'one hand lightly biting the index finger at the first knuckle, the other fingers softly curled and the hand not covering the face',
      { requiresFaceVisibility: true }],
    ['sweep-bangs', '單手把頭髮往後撥', 'one hand brushing her hair back from the forehead, fingers combing through',
      {}],
    ['gather-hair', '雙手抓著整束頭髮與髮尾整理', 'both hands gathering her hair together behind and above the head, one hand holding it near the base while the other smooths it toward the ends',
      {}],
  ].map(([key, zh, en, extra]) => gesture(`gesture-legacy-${key}`, zh, en, 'general', extra)),
  // The two glasses hands also work with squats and every lying orientation (Cooper 2026-10-22);
  // 單手拿著眼鏡 moved to the 道具 control.
  ...[
    ['pull-down-glasses', '單手把眼鏡拉下', 'one hand pushing the glasses slightly down the nose, the eyes visible above the frames'],
    ['bite-glasses-temple', '咬著眼鏡腳', 'the glasses taken off and one temple held lightly between her teeth, the frames hanging beside the cheek'],
  ].map(([key, zh, en]) => gesture(`gesture-legacy-${key}`, zh, en, 'general',
    { requiresWardrobeRole: 'eyewear', randomEligible: false, requiresFaceVisibility: true, alsoScopes: freeze(['squatting', 'lying-supine', 'lying-side', 'lying-prone']) })),
  gesture('gesture-legacy-supine-palms-cheek', '仰躺雙手合掌靠在臉側', 'both palms together beside one cheek with relaxed elbows', 'lying-supine',
    { requiresFaceVisibility: true }),
  gesture('gesture-prone-chin-hands', '下巴靠在交疊的雙手上', 'her chin resting on her stacked hands', 'lying-prone'),
  gesture('gesture-prone-cheeks-cupped', '雙手托腮', 'her cheeks cupped in both hands', 'lying-prone'),
  gesture('gesture-prone-tuck-hair', '一手撥頭髮', 'one hand lightly tucking her hair behind her ear', 'lying-prone'),
  gesture('gesture-prone-hands-front', '雙手輕放在前方', 'her hands resting loosely in front of her', 'lying-prone'),
  gesture('gesture-supine-arms-overhead', '雙臂舉過頭頂', 'both arms stretched loosely above her head', 'lying-supine'),
  gesture('gesture-supine-hand-stomach', '一手放腹部、一手在身側', 'one hand resting on her stomach and the other at her side', 'lying-supine'),
  gesture('gesture-supine-forearm-forehead', '一手放在額頭', 'one forearm resting across her forehead', 'lying-supine'),
  gesture('gesture-side-head-on-arm', '頭枕在彎曲的手臂上', 'her head resting on her bent lower arm', 'lying-side'),
  gesture('gesture-side-hand-hip', '上手放在腰側', 'her upper hand resting on her hip', 'lying-side'),
  // Squatting library v1 (Docs/specs/pose-library-squatting-v1.md §3–§4, Cooper 2026-10-21):
  // the seven reviewed squat hands, shoulder wording left to the body (O2) and plainer
  // wording (O3, O4). Medium crops use the reviewed upper-body fragment; chest-up omits them.
  ...[
    ['elbows-forward', '雙肘靠膝自然垂手', 'both elbows resting lightly on her thighs near the knees, forearms falling naturally forward and downward beyond the knees, with loose wrists and relaxed fingers',
      'both forearms angled naturally downward with relaxed hands'],
    ['hands-outer-legs', '雙手沿腿側自然下垂', 'both arms hanging naturally along the outer sides of the legs with softly bent elbows, hands relaxed beside the lower shins or outer ankles, with loose wrists and fingers',
      'both arms relaxed along the sides of the body with softly bent elbows'],
    ['one-hand-cheek', '單手托腮一手自然垂落', 'one elbow resting lightly on her thigh near the knee with the raised palm gently cradling the cheek, the other elbow resting near the opposite knee with that forearm falling forward and downward, its wrist and fingers relaxed',
      'one raised palm gently cradling the cheek, the other forearm angled downward with a relaxed hand', true],
    ['both-hands-cheeks', '雙手托腮', 'both elbows resting lightly on her thighs near the knees, forearms raised with both palms gently cradling the cheeks, fingers relaxed along the cheeks and jaw',
      'both palms gently cradling the cheeks with fingers relaxed along the cheeks and jaw', true],
    ['one-hand-v-sign', '單手在臉旁比 V', 'one elbow resting lightly on her thigh near the knee with the raised hand forming a relaxed V sign beside the cheek and clear of the eyes, the other elbow resting near the opposite knee with that forearm falling forward and downward, its wrist and fingers relaxed',
      'one raised hand forming a relaxed V sign beside the cheek and clear of the eyes, the other forearm angled downward with a relaxed hand', true],
    ['forearms-outward', '雙臂搭膝外展垂手', 'both arms spreading naturally to the sides with softly bent elbows, each forearm near the wrist resting lightly across the knee on that side, hands hanging beyond the outer knee edges with loose wrists and fingers',
      'both arms spreading naturally to the sides with softly bent elbows, loose wrists and fingers'],
    ['elbows-center', '雙肘靠膝中央垂手', 'both elbows resting lightly on her thighs near the knees, forearms slanting inward and downward between the knees, hands hanging loosely near each other at the center in front of the body with fingers pointing down',
      'both forearms slanting inward and downward, hands relaxed near each other in front of the body'],
  ].map(([key, zh, en, upperBodyEn, requiresFaceVisibility = false]) => gesture(`gesture-squat-${key}`, zh, en, 'squatting',
    { upperBodyEn, omitInChestUp: true, ...(requiresFaceVisibility ? { requiresFaceVisibility } : {}) })),
]);

const CONCRETE_GESTURES = GESTURE_OPTIONS.filter(option => option.scope);

/** Gestures need a library action whose hands are free; 任意 already leaves the hands to the model. */
export function actionAcceptsGesture(action) {
  return Boolean(action?.clauses) && action.hands?.mode === 'free' && !action.meta?.tags?.includes('menu_choice');
}

export function gestureFitsAction(option, action) {
  if (!actionAcceptsGesture(action) || !option?.scope) return false;
  const scopes = [option.scope, ...(option.meta?.alsoScopes || [])];
  if (isLyingOrientation(action.orientationId)) return scopes.includes(action.orientationId);
  // Squats use their own reviewed hands; the general list was written for standing.
  return scopes.includes(action.family === 'squatting' ? 'squatting' : 'general');
}

export function applicableGestureOptions(action) {
  return CONCRETE_GESTURES.filter(option => gestureFitsAction(option, action));
}

/** A concrete choice is honored when it fits the action; 隨機 draws (one random()
 * call) only gestures whose wardrobe requirement is positively present, and no
 * face-touching gesture under a back-view orbit. */
export function resolveGesture(gestureId, action, { wardrobeSignals = {}, orbit = null } = {}, random = Math.random) {
  if (!gestureId || gestureId === 'none' || !actionAcceptsGesture(action)) return null;
  if (gestureId === 'random') {
    const pool = applicableGestureOptions(action)
      .filter(option => option.meta.randomEligible !== false)
      .filter(option => !(option.meta.requiresFaceVisibility && isBackView(orbit)))
      .filter(option => !option.meta.requiresWardrobeRole || wardrobeSignals[option.meta.requiresWardrobeRole] === 'present');
    return pool.length ? pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))] : null;
  }
  const option = CONCRETE_GESTURES.find(item => item.id === gestureId);
  if (!gestureFitsAction(option, action)) return null;
  // A chosen gesture is skipped silently when the resolved wardrobe positively lacks its item.
  const role = option.meta.requiresWardrobeRole;
  return role && wardrobeSignals[role] === 'absent' ? null : option;
}

// 道具 control (Cooper 2026-10-22): the earlier prop actions plus the glasses hand and a book,
// reusing the free-composer catalog so the standalone (no action) path shares one source.
// Props sit beside every action unfiltered; only 隨機 skips face-touching props under a back-view
// orbit and the glasses when the resolved wardrobe has none.
const propEntry = option => freeze({ id: option.id, zh: option.zh, en: option.en, meta: freeze({ ...option.meta,
  requiresFaceVisibility: option.meta?.tags?.includes('face_action') === true }) });
export const PROP_OPTIONS = freeze([
  choice('none', '全無'),
  choice('random', '隨機'),
  ...POSE_COMPOSER_PROP_OPTIONS.filter(option => option.meta?.tags?.includes('prop_action') && !option.meta.tags.includes('selfie_hand_pose')).map(propEntry),
]);
const CONCRETE_PROPS = PROP_OPTIONS.filter(option => option.en);

export function resolveProp(propId, { wardrobeSignals = {}, orbit = null } = {}, random = Math.random) {
  if (!propId || propId === 'none') return null;
  if (propId === 'random') {
    const pool = CONCRETE_PROPS
      .filter(option => !(option.meta.requiresFaceVisibility && isBackView(orbit)))
      .filter(option => !option.meta.requiresWardrobeRole || wardrobeSignals[option.meta.requiresWardrobeRole] === 'present');
    return pool.length ? pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))] : null;
  }
  const option = CONCRETE_PROPS.find(item => item.id === propId);
  const role = option?.meta.requiresWardrobeRole;
  return role && wardrobeSignals[role] === 'absent' ? null : option || null;
}

/** The action English with the gesture added as an upper-body clause after its
 * last upper clause, so full-body and upper-body crops both keep it. A gesture may
 * carry its own medium-crop fragment and drop out of chest-up; an action may omit
 * its own upper-body text (squatting v1 O6), leaving only the gesture. */
export function actionTextWithGesture(action, option, { chestUp = false } = {}, prop = null) {
  const ownUpper = action.meta?.upperBodyOmitted ? '' : action.upperBodyEn;
  if (!option && !prop) return { en: action.en, upperBodyEn: ownUpper };
  const clauses = [...action.clauses];
  const lastUpper = clauses.map(item => item.region).lastIndexOf('upper');
  let at = lastUpper >= 0 ? lastUpper + 1 : clauses.map(item => item.region).lastIndexOf('core') + 1;
  const added = [option, prop].filter(Boolean);
  for (const extra of added) clauses.splice(at++, 0, { region: 'upper', join: ', ', en: extra.en });
  const en = joinSpecifiedActionClauses(clauses);
  // A gesture may carry its own medium-crop fragment and drop out of chest-up; a prop keeps its sentence.
  const fragments = added.map(extra => (chestUp && extra.meta?.omitInChestUp ? '' : extra.meta?.upperBodyEn || extra.en));
  const shown = fragments.filter(Boolean);
  if (!shown.length) return { en, upperBodyEn: ownUpper };
  if (!ownUpper) return { en, upperBodyEn: `She has ${shown.join(', ')}.` };
  if (added.every((extra, index) => fragments[index] === extra.en) && ownUpper === joinSpecifiedActionClauses(action.clauses, ['core', 'upper'])) {
    return { en, upperBodyEn: joinSpecifiedActionClauses(clauses, ['core', 'upper']) };
  }
  return { en, upperBodyEn: `${ownUpper.replace(/\.$/, '')}, ${shown.join(', ')}.` };
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
  // The mirror selfie owns the phone prop, so the 道具 control steps aside.
  return { ...locks, poseHandId: option.hand || 'none', posePropId: option.prop || 'none', ...(option.prop ? { propId: 'none' } : {}) };
}

/** The 拍攝方式 an older selection implies through its selfie hand or prop. */
export function captureStyleFromLegacyLocks(locks = {}) {
  if (SELFIE_PROP_IDS.has(locks.posePropId)) return CAPTURE_STYLE_OPTIONS.find(option => option.prop === locks.posePropId).id;
  if (SELFIE_HAND_IDS.has(locks.poseHandId)) return CAPTURE_STYLE_OPTIONS.find(option => option.hand === locks.poseHandId).id;
  return 'standard';
}
