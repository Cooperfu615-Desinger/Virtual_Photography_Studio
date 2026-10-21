import { getFixedScenePosition } from './fixedScenePose.js';
import { getActionPoseCardById } from '../../data/actionPoseCards.js';
import { lyingActionFitsScene } from './lyingSurface.js';

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
  family = baseId && baseId !== 'none' ? baseId : 'free', handsMode = 'fixed', validation = { status: 'accepted', evidence: '' }, requiresWardrobeRole = '',
  upperBodyOmitted = false }) {
  const en = joinSpecifiedActionClauses(clauses);
  return deepFreeze({ id, zh, baseId, orientationId, en, upperBodyEn, descriptionZh, referenceNumber, legacyCardId, ownsExpression, ownsHead, expressionLabel, headLabel, faceEn,
    family, clauses, hands: { mode: handsMode }, scene: { support: supportSurface || 'none' }, validation,
    meta: {
      tags: ['specified_action'],
      supportSurface,
      ...(requiresWardrobeRole ? { requiresWardrobeRole } : {}),
      ...(upperBodyOmitted ? { upperBodyOmitted } : {}),
      randomEligible: false,
      supineGroundOnly,
      projectionByBucket: {
        unconstrained: { mode: 'visible' },
        fixedComposition: { mode: 'visible' },
        fullBody: { mode: 'visible' },
        cowboyKnee: { mode: 'visible' },
        chestUp: upperBodyOmitted ? { mode: 'omit' } : { mode: 'projected', en: upperBodyEn },
        mediumWaist: upperBodyOmitted ? { mode: 'omit' } : { mode: 'projected', en: upperBodyEn },
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

  // Standing library v1 (Docs/specs/pose-library-standing-v1.md). Batch 1 (§3) keeps the
  // reviewed free-composer standing wording and is accepted without an image round
  // (Cooper 2026-10-20: image tests wait until the expression-pose revision is done);
  // batch 2 (§6, reference images in Docs/站姿/) stays pending until that round.
  ...[
    ['natural', '自然站姿', '自然放鬆的中性站姿。', [clause('core', '', 'She stands in a relaxed neutral posture')]],
    ['one-leg-weight', '單腳重心', '放鬆站立，重心放在一腳，身體自然不對稱。', [clause('core', '', 'She stands in a relaxed posture with her weight shifted onto one leg and a natural asymmetrical balance')]],
    ['crossed-legs', '交叉腿站姿', '雙腿自然交叉，一側髖部微微偏移。', [clause('core', '', 'She stands with one hip subtly shifted'), clause('lower', ', ', 'her legs naturally crossed')]],
    ['narrow-side', '側身窄站姿', '側身站立，雙腳靠攏，身形修長。', [clause('core', '', 'She stands in a narrow side-facing posture with a clean elongated body line'), clause('lower', ', ', 'her feet close together')]],
    ['feet-together-soft-knees', '併腿微屈站姿', '雙腳靠攏、膝蓋微彎，髖部偏向一側，軀幹帶出柔和側彎。', [
      clause('core', '', 'She stands with her hips shifted slightly to one side and her torso following a gentle lateral curve'),
      clause('lower', '. ', 'Her feet are close together and her knees softly bent')]],
    ['wide-weight-shift', '開腿偏重心站姿', '雙腳打開、腳尖微微外開，重心放在一腳，另一腳向側邊伸出。', [
      clause('core', '', 'She stands with most of her weight settled onto one leg, her hips held at standing height'),
      clause('lower', '. ', 'Her feet are set apart with the toes angled slightly outward, the other leg extending to the side')]],
    ['bent-leg-lift', '單腳屈膝抬腿站姿', '單腳站立，另一腳屈膝抬起、在支撐腿前方微微交叉，小腿往後收、腳離地。', [
      clause('core', '', 'She stands on one leg'),
      clause('lower', ', ', 'the free leg lifted and bent at the knee, crossing slightly in front of the supporting leg, with the lower leg folded back and the foot raised off the ground')]],
    ['forward-lean', '上身前傾探身站姿', '上身從髖部明顯前傾，臉與肩膀位於腰臀之前。', [
      clause('core', '', 'She stands with her upper body leaning markedly forward from the hips'),
      clause('upper', ', ', 'her face and shoulders brought ahead of her waist and hips')]],
    ['pelvis-back-curve', '骨盆後推曲線站姿', '骨盆往後推、臀部位於軀幹後方，下背到臀部弧線明顯，上身只微微前傾。', [
      clause('core', '', 'She stands with her pelvis shifted distinctly backward, her hips projecting behind her torso and a smooth pronounced curve running through her lower back into her buttocks'),
      clause('upper', ', ', 'her upper torso only slightly inclined forward')]],
  ].map(([key, zh, descriptionZh, clauses]) => createAction({
    id: `specified-standing-${key}`, zh, baseId: 'standing', descriptionZh, clauses,
    upperBodyEn: joinSpecifiedActionClauses(clauses, ['core', 'upper']), handsMode: 'free',
    validation: { status: 'accepted', evidence: 'Cooper 2026-10-20: reviewed free-composer wording; image round deferred' },
  })),
  ...[
    ['hands-behind-knee-in', '雙手背後・單膝內扣', '單腳打直承重，雙手在背後交握；另一腳膝蓋微微內扣，腳輕放在支撐腳旁。', '010c1243cfa3389e3b108cf9c75fa8a8.jpg', [
      clause('core', '', 'She stands with her weight on one straight leg'), clause('upper', ', ', 'both hands clasped behind her back'),
      clause('lower', '. ', 'Her other knee bends softly inward, its foot resting lightly beside the supporting foot')]],
    ['hand-on-head-stride', '一手扶頭・跨步', '擺姿勢的跨步，一手放在頭頂，另一手自然垂下；前腳腳跟著地、腳尖翹起，後腳打直。', '1d7b9d0491d59db07fc80a23bc5be49a.jpg', [
      clause('core', '', 'She stands in a posed mid-stride'), clause('upper', ', ', 'one hand resting on top of her head and the other arm hanging loosely at her side'),
      clause('lower', '. ', 'Her front foot steps forward with the heel on the ground and the toes lifted, the back leg straight')]],
    ['hand-on-head-pocket', '一手扶頭・一手插口袋', '雙腳微開，一手舉到頭側，另一手插在前口袋；膝蓋微微內扣。需要有前口袋的穿搭。', '3e884f394a163fff1b6a3cf4e30bf5cd.jpg', [
      clause('core', '', 'She stands with her feet slightly apart'), clause('upper', ', ', 'one hand raised to the side of her head and the other hand tucked into her front pocket'),
      clause('lower', '. ', 'Her knees turn slightly inward')], 'pants'],
    ['lean-pockets-step', '上身前傾・雙手插口袋・一腳前踏', '上身從髖部前傾，雙手插在前口袋；一腳踏在前方，後腳腳跟微抬。需要有前口袋的穿搭。', '5ba40b62320ca0622169b21f5bcaabef.jpg', [
      clause('core', '', 'She stands with her upper body leaning forward from the hips'), clause('upper', ', ', 'both hands tucked into her front pockets'),
      clause('lower', '. ', 'One foot steps forward ahead of the other, the back heel slightly lifted')], 'pants'],
    ['side-kick-fists', '單腳站・側後抬腿・雙拳胸前', '活潑的單腳站姿，雙手握拳放在胸前；另一腳屈膝往側邊踢起、腳明顯離地。', '824cc953f4a58d4bcd9bd9fe84dde35b.jpg', [
      clause('core', '', 'She stands on one leg in a playful pose'), clause('upper', ', ', 'both hands curled into loose fists in front of her chest'),
      clause('lower', '. ', 'Her other leg kicks out to the side with the knee bent and the foot raised well off the ground')]],
    ['front-kick-hand-up', '單腳站・前踢抬腿・一手舉高', '活潑的單腳站姿，一手舉在頭側、食指朝上，另一手往後擺；另一腳往前上方踢到約髖部高度。', 'c4ca80214af80abd58b0ad30bb543f0a.jpg', [
      clause('core', '', 'She stands on one leg in a playful pose'), clause('upper', ', ', 'one hand raised beside her head with the index finger pointing up and the other arm swinging back'),
      clause('lower', '. ', 'Her other leg kicks forward and up, the foot raised to hip height')]],
    ['hands-behind-head-knees-in', '雙手抱頭後・併腿內扣', '雙腳靠攏，雙手舉到後腦、手肘向兩側張開；膝蓋微微內扣。', 'cd7fb25489834cf7b3d8a957aef72f28.jpg', [
      clause('core', '', 'She stands with her feet close together'), clause('upper', ', ', 'both hands raised to the back of her head, her elbows spread out to the sides'),
      clause('lower', '. ', 'Her knees turn slightly inward')]],
    ['arm-overhead-stretch', '單臂上舉・一手扶臂伸展', '雙腳與肩同寬，一手向上伸直，另一手彎曲、扶在上舉手臂的手肘附近。', 'f512ed9b7b53c9ebb4c2b0376782633d.jpg', [
      clause('core', '', 'She stands with her feet planted shoulder-width apart'),
      clause('upper', ', ', 'one arm stretched straight overhead and the other arm bent with its hand holding the raised arm near the elbow')]],
    ['wide-toes-out-hand-chest', '外八開腿・一手放胸前', '雙腳張開、腳尖外八，一手放在胸前，另一手垂直貼在身側。', 'images.jpeg', [
      clause('core', '', 'She stands with her feet set wide apart and her toes turned outward'),
      clause('upper', ', ', 'one hand resting on her chest and the other arm hanging straight at her side')]],
    ['one-leg-v-sign-hip', '單腳站・一手比耶・一手叉腰', '單腳站立，一手向上伸直比耶，另一手叉腰；另一腳屈膝抬在支撐腿前方、腳往後收。', 'v2-60d44e901558586d8b79ee02b7962376_1440w.jpg', [
      clause('core', '', 'She stands on one leg'), clause('upper', ', ', 'one arm raised straight overhead making a V sign and the other hand resting on her waist'),
      clause('lower', '. ', 'Her other leg bends at the knee, lifted in front of the supporting leg with the foot tucked back')]],
    ['arms-open-v', '雙手向上張開', '雙腿打直、一膝微彎，雙臂向上舉起並張開成 V 字，掌心打開。', 'v2-c5761de237bb95a4fc2f108b89902da3_1440w.jpg', [
      clause('core', '', 'She stands with her legs straight and one knee softly bent'),
      clause('upper', ', ', 'both arms raised overhead and spread wide in a V, palms open')]],
  ].map(([key, zh, descriptionZh, reference, clauses, requiresWardrobeRole = '']) => createAction({
    id: `specified-standing-${key}`, zh, baseId: 'standing', descriptionZh, clauses,
    upperBodyEn: joinSpecifiedActionClauses(clauses, ['core', 'upper']), requiresWardrobeRole,
    validation: { status: 'pending', evidence: `reference Docs/站姿/${reference}; image round deferred (Cooper 2026-10-20)` },
  })),
  // Squatting library v1 (Docs/specs/pose-library-squatting-v1.md §2, Cooper 2026-10-21): the
  // four reviewed squatting-catalog-v2 squats, wording kept and completed as sentences. Chest
  // and medium crops keep the reviewed upper-body fragments; the wide-knee squat omits them.
  ...[
    ['natural', '自然蹲姿', '雙膝舒適彎曲，臀部接近腳跟但離地，腳距自然，腳跟落地或輕抬；上身自然稍前傾、肩膀放鬆。', [
      clause('core', '', 'She holds a relaxed low squat with comfortably bent knees, her hips lowered near her heels and clear of the ground'),
      clause('lower', ', ', 'her feet comfortably spaced and her heels resting down or lightly lifted for balance'),
      clause('upper', '. ', 'Her torso inclines gently forward with relaxed shoulders')],
      'Her upper body leans gently forward with relaxed shoulders.'],
    ['compact', '收攏低蹲姿', '雙腿與雙腳靠攏，大腿接近小腿，臀部充分下沉但離地；上身靠近大腿、肩膀放鬆，腳跟落地或輕抬。', [
      clause('core', '', 'She holds a compact low squat with her knees and feet close together, her thighs folded close to her calves and her hips sunk near her heels, clear of the ground'),
      clause('lower', ', ', 'her heels resting down or lightly lifted for balance'),
      clause('upper', '. ', 'Her torso inclines gently toward her thighs with relaxed shoulders')],
      'Her upper body is softly gathered with a gentle forward lean and relaxed shoulders.'],
    ['forward-lean', '身體前傾蹲姿', '雙膝舒適分開、臀部低沉離地，上身從髖部輕微前傾，肩背與頸部放鬆，腳跟落地或輕抬。', [
      clause('core', '', 'She holds a relaxed forward-leaning low squat with her knees comfortably apart, her hips lowered near her heels and clear of the ground'),
      clause('lower', ', ', 'her heels resting down or lightly lifted for balance'),
      clause('upper', '. ', 'Her torso inclines gently from the hips toward her thighs, her shoulders and neck relaxed')],
      'Her upper body leans gently forward from the hips with relaxed shoulders and neck.'],
    ['wide-knee', '寬膝低蹲姿', '膝蓋向外，腳距適度加寬、腳尖順著膝蓋，臀部低沉在雙腿之間且離地，上身稍前傾，腳跟落地或輕抬。', [
      clause('core', '', 'She holds a relaxed wide-knee low squat with her knees opened outward and her hips sunk low between her legs, clear of the ground'),
      clause('lower', ', ', 'her feet moderately apart with the toes turned outward in line with the knees and her heels resting down or lightly lifted for balance'),
      clause('upper', '. ', 'Her torso inclines gently forward')],
      '', true],
  ].map(([key, zh, descriptionZh, clauses, upperBodyEn, upperBodyOmitted = false]) => createAction({
    id: `specified-squatting-${key}`, zh, baseId: 'squatting', descriptionZh, clauses, upperBodyEn, upperBodyOmitted, handsMode: 'free',
    validation: { status: 'accepted', evidence: 'Cooper 2026-10-21: reviewed squatting-catalog-v2 wording; image round deferred' },
  })),

  // Sitting and kneeling library v1 (Docs/specs/pose-library-sitting-kneeling-v1.md, Cooper
  // 2026-10-21): the reviewed free-composer sitting and kneeling wording, completed as
  // sentences; accepted with free hands. Crops keep the reviewed upper-body fragment, or omit
  // the action where the composer omitted it. No seat is named (seats come later from scenes).
  ...[
    ['sitting', 'natural', '自然坐姿', '自然放鬆的坐姿。', [clause('core', '', 'She sits in a relaxed, natural posture')],
      'Her upper body rests in a relaxed seated posture.'],
    ['sitting', 'forward-lean', '微微前傾', '坐著，上身微微往前傾。', [clause('core', '', 'She sits leaning slightly forward')],
      'Her upper body leans slightly forward.'],
    ['sitting', 'legs-extended', '雙腿自然伸展', '坐著，雙腿自然往前伸展。', [clause('core', '', 'She sits'), clause('lower', ' with ', 'both legs naturally extended')]],
    ['sitting', 'cross-legged', '盤腿坐姿', '盤腿而坐。', [clause('core', '', 'She sits cross-legged')]],
    ['sitting', 'knees-raised', '雙腿屈起', '坐著，雙腿彎曲、膝蓋抬起，雙腳自然放著。', [clause('core', '', 'She sits'),
      clause('lower', ' with ', 'both legs bent and her knees raised, her feet resting naturally')]],
    ['sitting', 'slouched', '隨性癱坐', '隨性地癱坐，身體放鬆沉重，肩膀垂下，軀幹自然陷進座位。', [
      clause('core', '', 'She sits casually slumped with a loose, heavy body'),
      clause('upper', ', ', 'her shoulders dropped and her torso settling naturally into the seat')],
      'Her upper body slouches loosely and heavily with dropped shoulders and a relaxed torso.'],
    ['sitting', 'leg-cross', '翹二郎腿', '坐著翹二郎腿。', [clause('core', '', 'She sits'), clause('lower', ' with ', 'one leg crossed over the other')]],
    ['sitting', 'one-knee-up', '單腿屈起坐姿', '坐著，一腳屈膝抬起，另一腳放鬆。', [clause('core', '', 'She sits'),
      clause('lower', ' with ', 'one knee drawn up and the other leg relaxed')]],
    ['sitting', 'legs-to-side', '雙腿側放坐姿', '坐著，雙腿往同一側斜放，下半身線條柔和不對稱。', [clause('core', '', 'She sits'),
      clause('lower', ' with ', 'both legs angled to one side in a soft asymmetrical line')]],
    ['sitting', 'open-confident', '開闊自信坐姿', '開闊穩定的坐姿，膝蓋舒適分開，重心落在髖部，上身放鬆挺直。', [
      clause('core', '', 'She sits in an open, grounded posture with her weight settled through her hips'),
      clause('lower', ', ', 'her knees comfortably apart'), clause('upper', '. ', 'Her torso is relaxed and upright')],
      'Her upper body is open and relaxed, her torso upright and her shoulders at ease.'],
    ['kneeling', 'seiza', '跪坐', '正座跪坐，臀部坐在腳跟上，雙膝併攏，上身挺直。', [
      clause('core', '', 'She kneels in a seiza posture with her hips resting on her heels'),
      clause('lower', ', ', 'her knees together'), clause('upper', ', ', 'her torso upright')]],
    ['kneeling', 'wide', '分腿跪坐', '雙膝著地、自然分開，小腿往兩側後折，臀部坐在雙腿之間的地面，上身挺直。', [
      clause('core', '', 'She kneels with both knees grounded and naturally apart, her hips resting on the ground between her legs'),
      clause('lower', ', ', 'her lower legs folded back on either side'), clause('upper', ', ', 'her torso upright')]],
    ['kneeling', 'forward-lean', '前傾跪姿', '雙膝著地的高跪姿，臀部離開腳跟，上身從髖部往前傾。', [
      clause('core', '', 'She kneels high with both knees grounded and her hips lifted clear of her heels'),
      clause('upper', ', ', 'her upper body inclined forward from the hips')],
      'Her torso leans forward from the hips.'],
    ['kneeling', 'upright-poised', '直立端正跪姿', '雙膝著地的直立高跪姿，大腿接近垂直，臀部離開腳跟、位於膝蓋上方，上身挺拔、肩膀放鬆。', [
      clause('core', '', 'She kneels upright with both knees grounded, her thighs nearly vertical and her hips lifted clear of her heels above her knees'),
      clause('upper', ', ', 'her torso tall with relaxed shoulders')],
      'Her upper body is tall and relaxed.'],
    ['kneeling', 'side-sit', '側坐跪姿', '從跪姿側坐，臀部落在折起雙腿的一側，上身放鬆挺直。', [
      clause('core', '', 'She kneels in a side-sitting posture with her hips lowered beside her folded legs'),
      clause('upper', ', ', 'her torso relaxed and upright')]],
    ['kneeling', 'one-knee-forward', '單膝前跨跪姿', '單膝著地，另一腳往前跨、前膝彎曲。', [
      clause('core', '', 'She half-kneels with one knee grounded'),
      clause('lower', ', ', 'the other leg stepped forward with the front knee bent')]],
  ].map(([baseId, key, zh, descriptionZh, clauses, upperBodyEn = '']) => createAction({
    id: `specified-${baseId}-${key}`, zh, baseId, descriptionZh, clauses, handsMode: 'free',
    upperBodyEn, upperBodyOmitted: !upperBodyEn,
    validation: { status: 'accepted', evidence: 'Cooper 2026-10-21: reviewed free-composer wording; image round deferred' },
  })),

]);

// expression-pose-v2 §3.1 menu choices (Cooper 2026-10-19): 隨機 draws an accepted
// action from the library at generation time; 任意 hands the pose to the model.
export const SPECIFIED_ACTION_RANDOM_ID = 'random';
export const SPECIFIED_ACTION_ANY_ID = 'any';
export const SPECIFIED_ACTION_ANY_EN = 'She is caught in a candid, natural mid-movement pose, her weight shifted onto one leg and both hands engaged.';

const menuChoice = definition => {
  const action = createAction({ baseId: 'none', supportSurface: '', ...definition });
  return deepFreeze({ ...action, meta: { ...action.meta, tags: ['specified_action', 'menu_choice'] } });
};

/** 隨機 is resolved before generation; the record only drives menus and takeover UI. */
export const SPECIFIED_ACTION_RANDOM = menuChoice({
  id: SPECIFIED_ACTION_RANDOM_ID, zh: '隨機', upperBodyEn: '',
  descriptionZh: '每次生成時，從已驗收的指定動作中隨機抽一個；躺姿只在鎖定的場景可以躺時才會抽到，未驗收的動作不會抽到。',
  clauses: [clause('core', '', 'A specified action is drawn at generation time')],
});

/** 任意: the third-round free-pose sentence (Docs/reports/pose-hand-experiment-2026-10-17/results.md §6). */
export const SPECIFIED_ACTION_ANY = menuChoice({
  id: SPECIFIED_ACTION_ANY_ID, zh: '任意', handsMode: 'free',
  descriptionZh: '交給模型自由決定姿勢：抓拍中的自然動態，重心放在一腳，雙手有動作。',
  clauses: [
    clause('core', '', 'She is caught in a candid, natural mid-movement pose'),
    clause('lower', ', ', 'her weight shifted onto one leg'),
    clause('upper', ' and ', 'both hands engaged'),
  ],
  upperBodyEn: 'She is caught in a candid, natural mid-movement pose with both hands engaged.',
});

export const SPECIFIED_ACTION_OPTIONS = Object.freeze([
  deepFreeze({ id: 'none', zh: '全無', en: '', upperBodyEn: '', descriptionZh: '',
    baseId: '', orientationId: 'none', meta: { tags: ['none'], randomEligible: false } }),
  SPECIFIED_ACTION_RANDOM,
  SPECIFIED_ACTION_ANY,
  ...SPECIFIED_ACTION_CONCRETE_OPTIONS,
]);

const ACTIONS_BY_ID = new Map([...SPECIFIED_ACTION_CONCRETE_OPTIONS, SPECIFIED_ACTION_RANDOM, SPECIFIED_ACTION_ANY]
  .map((action) => [action.id, action]));

/** Library actions 隨機 may always draw: accepted and not lying. Actions that need a
 * wardrobe item (front pockets) stay out because the random wardrobe is unresolved here. */
export const SPECIFIED_ACTION_RANDOM_POOL = Object.freeze(SPECIFIED_ACTION_CONCRETE_OPTIONS
  .filter(action => action.validation.status === 'accepted' && action.family !== 'lying' && !action.meta.requiresWardrobeRole));

/** Accepted lying actions join the draw only when the locked scene offers a lying
 * surface (P3); an unresolved random scene cannot be checked, so lying stays out. */
export const SPECIFIED_ACTION_LYING_POOL = Object.freeze(SPECIFIED_ACTION_CONCRETE_OPTIONS
  .filter(action => action.validation.status === 'accepted' && action.family === 'lying'));

export const isSpecifiedActionMenuChoice = action => Boolean(action?.meta?.tags?.includes('menu_choice'));

/** Replace 隨機 with one drawn library action (one random() call), or 全無 when
 * no single-subject action can apply. Camera conflicts use locked choices only. */
export function resolveRandomSpecifiedAction(locks = {}, random = Math.random, { cameraControls = [] } = {}) {
  if (locks.specifiedActionId !== SPECIFIED_ACTION_RANDOM_ID) return locks;
  const location = cameraControls.find(control => control.key === 'locationId')?.options?.find(option => option.id === locks.locationId);
  const candidates = [...SPECIFIED_ACTION_RANDOM_POOL, ...SPECIFIED_ACTION_LYING_POOL.filter(action => lyingActionFitsScene(action, location))];
  const pool = locks.subjectCount === '1' && !getFixedScenePosition(locks)
    ? candidates.filter(action => !getSpecifiedActionCameraConflict(action, locks, cameraControls))
    : [];
  const action = pool.length ? pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))] : null;
  return { ...locks, specifiedActionId: action?.id || 'none', actionPoseCardId: '' };
}

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
    || (key === 'expressionId' && action.ownsExpression) || (['poseHeadId', 'gazeId', 'headPostureId'].includes(key) && action.ownsHead));
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
