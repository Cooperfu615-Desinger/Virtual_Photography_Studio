import { getFixedScenePosition } from './fixedScenePose.js';
import { getActionPoseCardById } from '../../data/actionPoseCards.js';

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

export const SPECIFIED_ACTION_REGIONS = Object.freeze(['core', 'upper', 'lower', 'support']);
export const SPECIFIED_ACTION_VALIDATION_STATUSES = Object.freeze(['pending', 'accepted', 'rejected']);

const clause = (region, join, en) => Object.freeze({ region, join, en });

/** v2 tagged clauses: each keeps the separator before it; the full sentence is
 * their verbatim concatenation (expression-pose-v2 §4–§5). */
export function joinSpecifiedActionClauses(clauses, regions = SPECIFIED_ACTION_REGIONS) {
  const kept = clauses.filter(item => regions.includes(item.region));
  if (!kept.length) return '';
  return `${kept.map((item, index) => (index ? item.join : '') + item.en).join('')}.`;
}

function createAction({ id, zh, baseId, orientationId = 'none', clauses, upperBodyEn,
  descriptionZh, referenceNumber, supineGroundOnly = false, legacyCardId = '', ownsExpression = false, ownsHead = false, expressionLabel = '', headLabel = '', faceEn = '', supportSurface = 'ground',
  family = baseId && baseId !== 'none' ? baseId : 'free', handsMode = 'fixed', validation = { status: 'accepted', evidence: '' } }) {
  const en = joinSpecifiedActionClauses(clauses);
  return deepFreeze({ id, zh, baseId, orientationId, en, upperBodyEn, descriptionZh, referenceNumber, legacyCardId, ownsExpression, ownsHead, expressionLabel, headLabel, faceEn,
    family, clauses, hands: { mode: handsMode }, scene: { support: supportSurface || 'none' }, validation,
    meta: {
      tags: ['specified_action'],
      supportSurface,
      randomEligible: false,
      supineGroundOnly,
      projectionByBucket: {
        unconstrained: { mode: 'visible' },
        fixedComposition: { mode: 'visible' },
        fullBody: { mode: 'visible' },
        cowboyKnee: { mode: 'visible' },
        chestUp: { mode: 'projected', en: upperBodyEn },
        mediumWaist: { mode: 'projected', en: upperBodyEn },
        headShoulders: { mode: 'omit' },
        faceDetail: { mode: 'omit' },
      },
    },
  });
}

/** Reviewed sources only. The three legacy cards explicitly own mood/gaze;
 * no additional furniture, lower-body geometry or camera setting is inferred. */
export const SPECIFIED_ACTION_CONCRETE_OPTIONS = Object.freeze([
  createAction({
    id: 'specified-sitting-side-fold-back-support',
    zh: '折腿低坐・雙掌後撐', baseId: 'sitting', referenceNumber: 25,
    descriptionZh: '臀部直接坐在地面，雙膝彎曲，兩條小腿折向人物左側，雙腳靠近左臀，折疊腿部與腳側貼地。上身略向後傾，雙掌分別放在左右臀部偏後的地面，手指分開，手肘微彎。臀部與折疊雙腿承托下半身，雙掌分攤上身重量。',
    clauses: [
      clause('core', '', 'She sits with her hips directly on the ground'),
      clause('lower', ', ', 'both knees bent and both lower legs folded toward her left side, her feet near her left hip and the folded legs and sides of her feet resting on the ground'),
      clause('core', '. ', 'Her torso leans slightly backward'),
      clause('upper', ', ', 'both palms planted just behind either side of her hips with fingers spread and elbows softly bent'),
      clause('support', '; ', 'her hips and folded legs support her lower body while both palms share the upper-body weight'),
    ],
    upperBodyEn: 'She is seated with her torso leaning slightly backward, both arms extending down behind her torso and her elbows softly bent.',
  }),
  createAction({
    id: 'specified-sitting-raised-right-knee',
    zh: '單腿屈起・單掌後撐', baseId: 'sitting', referenceNumber: 10,
    descriptionZh: '臀部坐在地面，右膝高起，右腳掌平放在身前地面。左膝向人物左側放低，左小腿折向身前，左腳靠近右腿內側，左腿外側貼地。上身略向後傾，右手放在右膝上方的大腿，左掌放在左臀偏後的地面。臀部、左腿、右腳與左掌共同形成支撐。',
    clauses: [
      clause('core', '', 'She sits with her hips on the ground'),
      clause('lower', ', ', 'her right knee raised and her right foot flat on the ground in front of her'),
      clause('lower', '. ', 'Her left knee opens low toward her left side, the left lower leg folds across the space in front of her with its foot near the inside of her right leg, and the outside of her left leg rests on the ground'),
      clause('core', '. ', 'Her torso leans slightly backward'),
      clause('upper', ', ', 'her right hand resting on her right thigh just above the knee and her left palm planted behind her left hip'),
      clause('support', '; ', 'her hips, left leg, right foot and left palm support her body'),
    ],
    upperBodyEn: 'She is seated with her torso leaning slightly backward, her right arm reaching forward and her left arm extending down behind her torso.',
  }),
  createAction({
    id: 'specified-sitting-hug-knees',
    zh: '低坐抱膝', baseId: 'sitting', referenceNumber: 20,
    descriptionZh: '臀部坐在地面，雙腿在身前彎曲，雙膝靠近並收向胸前，雙腳掌平放地面。上身從髖部略向前傾、靠近雙腿；雙臂由兩側環抱小腿，前臂位於小腿前方，雙手各握住另一側前臂。臀部與雙腳承重，雙臂收攏雙腿。',
    clauses: [
      clause('core', '', 'She sits with her hips on the ground'),
      clause('lower', ', ', 'both legs bent in front of her, both knees close together and drawn toward her chest, and both feet flat on the ground'),
      clause('core', '. ', 'Her torso leans slightly forward from the hips toward her legs'),
      clause('upper', ', ', 'both arms wrapping around her shins from either side with the forearms across the front of her shins and each hand holding the opposite forearm'),
      clause('support', '; ', 'her hips and feet bear her weight while her arms gather her legs inward'),
    ],
    upperBodyEn: 'She is seated with her torso leaning slightly forward and both arms curled inward in front of her torso.',
  }),
  createAction({
    id: 'specified-kneeling-wide-hands-front',
    zh: '分腿跪坐・雙掌前置', baseId: 'kneeling', referenceNumber: 23,
    descriptionZh: '雙膝向外分開著地，小腿向後折在臀部兩側，腳背貼地，臀部落在兩腿之間的地面。上身略向前傾，雙臂向前下方伸出，雙掌並列放在兩膝之間偏前方的地面，手肘微彎。臀部與折疊雙腿承托身體，雙掌協助穩定。',
    clauses: [
      clause('core', '', 'She sits in a low kneeling position'),
      clause('lower', ' ', 'with her knees spread on the ground, her lower legs folded backward on either side of her hips, the tops of her feet on the ground and her hips on the ground between her folded legs'),
      clause('core', '. ', 'Her torso leans slightly forward'),
      clause('upper', ', ', 'both arms reaching forward and down with both palms side by side on the ground just ahead of the space between her knees and her elbows softly bent'),
      clause('support', '; ', 'her hips and folded legs support her body while her palms steady her'),
    ],
    upperBodyEn: 'She is kneeling with her torso leaning slightly forward, both arms extending forward and down and her elbows softly bent.',
  }),
  createAction({
    id: 'specified-kneeling-all-fours-palms',
    zh: '四足跪姿・雙掌撐地', baseId: 'kneeling', referenceNumber: 8,
    descriptionZh: '雙膝分開著地、位於髖部下方，小腿向後延伸，腳背貼地。雙掌分開放在肩膀下方的地面，手指張開，手臂伸展，手肘保留自然彈性。臀部在膝蓋上方抬起，肩胸保持較高，軀幹大致平行地面，腹部離地。雙膝與雙掌承重，小腿前側與腳背接地。',
    clauses: [
      clause('core', '', 'She kneels on all fours'),
      clause('lower', ' ', 'with both knees spaced beneath her hips, her lower legs extending backward and the tops of her feet on the ground'),
      clause('upper', '. ', 'Both palms beneath her shoulders are planted apart with fingers spread, her arms extended and her elbows naturally soft'),
      clause('core', '. ', 'Her hips remain raised above her knees, her shoulders and chest held high and her torso nearly parallel to the ground with her abdomen clear of it'),
      clause('support', '; ', 'her knees and palms bear her weight while the fronts of her lower legs and the tops of her feet touch the ground'),
    ],
    upperBodyEn: 'She is kneeling with her shoulders and chest held high, both arms extended downward with naturally soft elbows and her torso nearly horizontal.',
  }),
  createAction({
    id: 'specified-kneeling-all-fours-forearms',
    zh: '四足跪姿・雙前臂撐地', baseId: 'kneeling', referenceNumber: 19,
    descriptionZh: '雙膝分開著地、位於髖部下方，小腿向後延伸，腳背貼地。雙肘位於肩膀下方，雙前臂向前平貼地面，雙手分開、掌心向下。臀部保持抬高，肩胸降低，軀幹從髖部向前下方傾斜，胸口低於臀部，腹部離地。雙膝、雙肘與前臂承重。',
    clauses: [
      clause('core', '', 'She kneels'),
      clause('lower', ' ', 'with both knees spaced beneath her hips, her lower legs extending backward and the tops of her feet on the ground'),
      clause('upper', '. ', 'Her elbows are beneath her shoulders, both forearms flat on the ground extending forward and her hands separated with palms down'),
      clause('core', '. ', 'Her hips stay raised, her shoulders and chest lowered and her torso sloping forward and down from her hips with her chest lower than her hips and her abdomen clear of the ground'),
      clause('support', '; ', 'her knees, elbows and forearms bear her weight'),
    ],
    upperBodyEn: 'She is kneeling with her shoulders and chest held low, her torso sloping forward and downward, both upper arms descending to the elbows and both forearms extending forward.',
  }),
  createAction({
    id: 'specified-lying-left-side-forearm',
    zh: '側躺・單前臂撐起上身', baseId: 'lying', orientationId: 'lying-side', referenceNumber: 6,
    descriptionZh: '身體左側躺臥，左髖與左腿外側貼地，雙腿沿身體長軸微彎，右腿疊放在左腿上。左肘位於左肩下方，左前臂向身前平放地面，左掌接地，撐起左側腰胸使其離地，軀幹斜向上抬起。右手放在右大腿外側；髖部與雙腿維持側躺，左髖腿與左前臂共同支撐身體。',
    clauses: [
      clause('core', '', 'She lies on her left side'),
      clause('lower', ' ', 'with her left hip and the outside of her left leg on the ground, both legs slightly bent along her body and her right leg stacked over the left'),
      clause('upper', '. ', 'Her left elbow is beneath her left shoulder, her left forearm flat on the ground in front of her and her left palm grounded, supporting her left waist and chest clear of the ground with her torso raised diagonally'),
      clause('upper', '. ', 'Her right hand rests on the outside of her right thigh'),
      clause('support', '; ', 'her hips and legs remain side-lying, supported by her left hip and leg and her left forearm'),
    ],
    upperBodyEn: 'She lies on her left side with her torso raised diagonally, her left elbow beneath her left shoulder and her left forearm extending forward, her right arm resting along her side.',
  }),
  createAction({
    id: 'specified-lying-supine-raised-crossed-legs',
    zh: '仰躺屈腿交疊・雙臂沿身側', baseId: 'lying', orientationId: 'lying-supine', referenceNumber: 24,
    descriptionZh: '背部與骨盆貼住地面，雙腿從髖部抬起，大腿收近腹部，雙膝彎曲。右大腿斜跨左大腿，在大腿至膝蓋上方交疊；小腿隨彎曲自然延伸，雙腳保持離地。雙臂沿身側略向外展，手肘微彎，雙掌接地。背部與骨盆承重，雙臂與手掌協助穩定。',
    clauses: [
      clause('core', '', 'She lies on her back with her back and pelvis resting on the ground'),
      clause('lower', ', ', 'both legs lifted from the hips with the thighs drawn toward her abdomen and both knees bent'),
      clause('lower', '. ', 'Her right thigh crosses diagonally over her left thigh above the knees, her lower legs extending naturally from the bent knees while both feet remain off the ground'),
      clause('upper', '. ', 'Both arms lie along her sides slightly spread outward, her elbows softly bent and her palms on the ground'),
      clause('support', '; ', 'her back and pelvis bear her weight while her arms and palms steady her'),
    ],
    upperBodyEn: 'She lies on her back on the ground with both arms along her sides and slightly spread outward, her elbows softly bent.',
    supineGroundOnly: true,
  }),
  ...[
    { legacyCardId: 'bratty-frustration-mock-kick', baseId: 'standing', ownsHead: false,
      expressionLabel: '不悅、噘嘴、倔強', supportSurface: '',
      descriptionZh: '情緒化地向附近物件或畫面下緣踢出一腳，上身自然前傾、身體略失衡。接管不悅噘嘴的神情；頭部方向可調。不指定物件種類、另一隻手或額外支撐。',
      upperBodyEn: 'She is visibly annoyed and fed up, leaning forward with a pouty defiant mood, her upper body slightly tense and off-balance in a candid, playful, emotionally driven moment.' },
    { legacyCardId: 'defiant-middle-finger-lens-jab', baseId: 'none', ownsHead: true,
      expressionLabel: '冷淡、不耐、挑釁', headLabel: '冷淡直視鏡頭', supportSurface: '',
      descriptionZh: '上身向鏡頭前傾，以冷淡挑釁的目光直視鏡頭，一隻手前伸形成近距離透視與輕微動態模糊。不限定站、坐、跪或其他下半身姿態，也不補另一隻手。',
      upperBodyEn: 'She leans close toward the camera with a cold, irritated, defiant stare, thrusting one hand forward into the lens with a rude confrontational gesture. The hand is close to camera, slightly foreshortened and motion-blurred, while her upper body bends forward. Her mood is bratty, rebellious, and street-candid.' },
    { legacyCardId: 'low-seated-aloof-cats-street-mood', baseId: 'sitting', ownsHead: true,
      expressionLabel: '疏離、冷淡、微微低落', headLabel: '抬眼望向上方鏡頭', supportSurface: 'ground',
      descriptionZh: '低坐地面，雙腿放鬆、軀幹微傾，手臂自然靠近腿部；抬眼望向上方鏡頭，神情疏離冷淡。保留身邊安靜停留的小貓，場景地點沿用 D 區設定。',
      upperBodyEn: 'She is seated low with her torso slightly tilted and her arms resting naturally downward. She looks upward toward the camera with an aloof, distant, slightly moody expression, as if quietly observing without inviting attention.' },
  ].map(({ legacyCardId, ...definition }) => {
    const card = getActionPoseCardById(legacyCardId);
    // Legacy cards own mood and gaze and have no region structure yet: one core
    // clause holds the card prompt verbatim (its final period is restored on join).
    return createAction({ ...definition, id: `specified-${legacyCardId}`, legacyCardId,
      zh: card.title, clauses: [clause('core', '', card.actionPrompt.replace(/\.$/, ''))], ownsExpression: true,
      faceEn: definition.ownsHead
        ? (definition.baseId === 'sitting' ? 'She looks upward toward the camera with an aloof, distant, slightly moody expression.' : 'She looks toward the camera with a cold, irritated, defiant stare.')
        : 'She has a pouty, annoyed, defiant expression, unhappy eyes and tightened brows.' });
  }),
  // Lying library v1 (Docs/specs/pose-library-lying-v1.md §4). Accepted by
  // Cooper's visual review 2026-10-19; 4.3 stays pending until rewritten.
  createAction({
    id: 'specified-lying-side-pillow-hand',
    zh: '側躺・臉靠枕頭・上手輕握枕邊', baseId: 'lying', orientationId: 'lying-side', supportSurface: 'bed',
    descriptionZh: '側躺在床上，頭側靠在枕頭上；上方那隻手彎曲，手指輕輕抓著臉旁的枕頭邊，肩膀微微往前收；雙腿上下疊放，膝蓋微彎。',
    clauses: [
      clause('core', '', 'She lies on her side with the side of her head resting on the pillow'),
      clause('upper', ', ', 'her upper arm bent and her hand loosely gripping the edge of the pillow beside her face, her shoulders gently rounded forward'),
      clause('lower', '. ', 'Her legs rest stacked with her knees softly bent'),
    ],
    upperBodyEn: 'She lies on her side with the side of her head resting on the pillow, her upper arm bent and her hand loosely gripping the edge of the pillow beside her face, her shoulders gently rounded forward.',
    validation: { status: 'accepted', evidence: 'Docs/reports/pose-library-lying-2026-10-19/results.md' },
  }),
  createAction({
    id: 'specified-lying-prone-forearms-crossed-ankles',
    zh: '趴躺・前臂撐起・雙腳交叉翹起', baseId: 'lying', orientationId: 'lying-prone',
    descriptionZh: '趴著，前臂平放在身體前方撐起上身，胸口離開表面、背部微拱；骨盆貼著表面；膝蓋彎曲，小腿往上翹起，兩腳腳踝交叉。',
    clauses: [
      clause('core', '', 'She lies on her stomach with her chest lifted and her back gently arched'),
      clause('upper', ', ', 'propped on her forearms resting flat in front of her'),
      clause('lower', '. ', 'Her hips rest on the surface, her knees are bent and her lower legs are raised, crossed at the ankles'),
      clause('support', '; ', 'her forearms and hips carry her weight'),
    ],
    upperBodyEn: 'She lies on her stomach with her chest lifted and her back gently arched, propped on her forearms resting flat in front of her.',
    handsMode: 'free',
    validation: { status: 'accepted', evidence: 'Docs/reports/pose-library-lying-2026-10-19/results.md' },
  }),
  createAction({
    id: 'specified-lying-prone-forearms-one-knee-up',
    zh: '趴躺・前臂撐起・單腿屈起', baseId: 'lying', orientationId: 'lying-prone',
    descriptionZh: '趴著，前臂撐起上身，雙手放在前方表面；一腿伸直貼著表面，另一腿膝蓋彎曲、小腿往上抬到接近垂直。',
    clauses: [
      clause('core', '', 'She lies on her stomach with her upper body raised'),
      clause('upper', ', ', 'propped on her forearms with her hands resting on the surface in front of her'),
      clause('lower', '. ', 'One leg stretches straight along the surface while the other knee bends and lifts its lower leg nearly upright'),
      clause('support', '; ', 'her forearms, hips and straight leg carry her weight'),
    ],
    upperBodyEn: 'She lies on her stomach with her upper body raised, propped on her forearms with her hands resting on the surface in front of her.',
    handsMode: 'free',
    validation: { status: 'pending', evidence: 'Z-Image drew a supine raised knee; rewrite pending (results.md §4)' },
  }),

]);

export const SPECIFIED_ACTION_OPTIONS = Object.freeze([
  deepFreeze({ id: 'none', zh: '全無', en: '', upperBodyEn: '', descriptionZh: '',
    baseId: '', orientationId: 'none', meta: { tags: ['none'], randomEligible: false } }),
  ...SPECIFIED_ACTION_CONCRETE_OPTIONS,
]);

const ACTIONS_BY_ID = new Map(SPECIFIED_ACTION_CONCRETE_OPTIONS.map((action) => [action.id, action]));

/** Owner checks use raw selections; they never clear a paused action. */
export function getSpecifiedAction(locks = {}, { ignoreOwners = false, cameraControls = [] } = {}) {
  if (locks.subjectCount !== '1') return null;
  const action = SPECIFIED_ACTION_CONCRETE_OPTIONS.find(item => item.legacyCardId && item.legacyCardId === locks.actionPoseCardId)
    || ACTIONS_BY_ID.get(locks.specifiedActionId);
  if (!action) return null;
  if (!ignoreOwners && (getFixedScenePosition(locks) || getSpecifiedActionCameraConflict(action, locks, cameraControls))) return null;
  return action;
}

/** Only effective generation inputs are masked; caller/storage values survive. */
export function getSpecifiedActionEffectiveLocks(locks = {}, options = {}) {
  const action = getSpecifiedAction(locks, options);
  if (!action) {
    const stored = getSpecifiedAction(locks, { ignoreOwners: true });
    return stored && (locks.actionPoseCardId || getSpecifiedActionCameraConflict(stored, locks, options.cameraControls))
      ? { ...locks, specifiedActionId: 'none', actionPoseCardId: '' } : locks;
  }
  return { ...locks,
    specifiedActionId: action.id,
    actionPoseCardId: '',
    poseBaseId: action.baseId,
    ...(action.ownsExpression ? { expressionId: 'none' } : {}),
    ...(action.ownsHead ? { poseHeadId: 'none' } : {}),
    poseOrientationId: action.orientationId,
    poseArrangementId: 'none',
    poseHandId: 'none',
    posePropId: 'none',
    poseAnchorId: 'none',
  };
}

export function specifiedActionOwnsControl(action, key) {
  return Boolean(action) && (['poseBaseId', 'poseOrientationId', 'poseArrangementId', 'poseHandId', 'posePropId', 'poseAnchorId'].includes(key)
    || (key === 'expressionId' && action.ownsExpression) || (key === 'poseHeadId' && action.ownsHead));
}

/** Camera choices stay intact. Explicit conflicts pause the action; random
 * candidates use the same predicate before resolving the shared capture. */
export function specifiedActionSupportsCamera(action, key, option) {
  if (!action?.ownsHead || !option || option.zh === '全無' || option.id === 'none') return true;
  const tags = option.meta?.tags || [];
  if (key === 'orbitId') return !tags.some(tag => ['back_view', 'profile_view', 'no_eye_contact'].includes(tag));
  if (key === 'angleId' && action.baseId === 'sitting') {
    return tags.includes('high_angle') || tags.includes('aerial') || tags.includes('dynamic');
  }
  return key !== 'angleId' || !tags.includes('aerial');
}

export function getSpecifiedActionCameraConflict(action, locks, controls = []) {
  return ['orbitId', 'angleId'].map(key => {
    const option = controls.find(control => control.key === key)?.options?.find(option => option.id === locks[key]);
    return specifiedActionSupportsCamera(action, key, option) ? '' : `${option.zh}與動作的注視方向不相容`;
  }).filter(Boolean).join('；');
}
