export const DUO_INTERACTION_OPTIONS = [
  {
    id: 'none',
    zh: '全無',
    en: '',
    desc: 'Do not specify duo interaction, letting the model decide the shared action and chemistry.',
    meta: { tags: ['none'] },
  },
  {
    id: 'strangers',
    zh: '陌生',
    en: 'both women sharing the same frame with unfamiliar detached chemistry, no obvious intimacy, reserved social distance',
  },
  {
    id: 'distance',
    zh: '有距離',
    en: 'both women maintaining a noticeable emotional and physical distance, restrained interaction, cool composed shared atmosphere',
  },
  {
    id: 'shoulder-lean',
    zh: '靠肩',
    en: 'both women leaning shoulder to shoulder, soft physical closeness, relaxed affectionate interaction in the same frame',
  },
  {
    id: 'intimate',
    zh: '親密',
    en: 'both women sharing intimate natural closeness, comfortable emotional connection, warm shared body language, restrained romantic chemistry',
  },
  {
    id: 'sensual-embrace',
    zh: '性感擁抱',
    en: 'both women in a sensual embracing interaction, close body contact, confident seductive chemistry, fashion-forward intimate tension',
  },
];

export const DUO_POSE_OPTIONS = [
  {
    id: 'none',
    zh: '全無',
    en: '',
    desc: 'Do not specify a duo action scenario.',
    meta: { tags: ['none'] },
  },
  {
    id: 'model-natural',
    zh: '模型自然決定',
    en: 'two women in a model-decided natural two-person moment, spontaneous relationship energy, varied believable body language, the image model chooses the exact action and interaction',
  },
  {
    id: 'fashion-editorial-models',
    zh: '時尚雜誌雙人模特兒',
    en: 'two women posing like fashion magazine models, polished editorial body language, confident coordinated presence, model-decided interaction and posture variety',
    legacyIds: [
      'light-shoulder-touch',
      'side-by-side-standing',
      'side-by-side-walking',
      'side-by-side-squat',
      'side-by-side-kneeling',
      'side-by-side-seated',
      'split-wall-lean',
      'shoulder-lean',
      'leaning-shoulders',
    ],
  },
  {
    id: 'strangers-passing',
    zh: '相互不認識的兩人擦肩而過',
    en: 'two women captured as strangers passing each other, detached everyday timing, brief near-crossing body language, no obvious intimacy, model-decided movement and spacing',
    legacyIds: [
      'front-back-layering',
      'distance',
    ],
  },
  {
    id: 'best-friends-selfie',
    zh: '好朋友之間的親密自拍',
    en: 'two women captured in an intimate best-friends selfie moment, casual affectionate body language, close social warmth, playful candid interaction, model-decided hand placement and crop',
    legacyIds: [
      'leaning-together',
      'leaning-on-each-other',
      'shoulder-lean',
      'leaning-shoulders',
    ],
  },
  {
    id: 'shopping-day',
    zh: '購物逛街',
    en: 'two women captured during a casual shopping-day outing, relaxed street-life energy, small spontaneous gestures, browsing-and-walking companionship, model-decided interaction',
  },
  {
    id: 'daily-life-documentary',
    zh: '日常生活紀錄拍照',
    en: 'two women captured like a candid everyday life documentary photo, unforced realistic timing, natural imperfect body language, model-decided interaction and spacing',
    legacyIds: [
      'high-low-layering',
      'front-back-standing',
      'front-back-walking',
      'stand-and-squat',
      'kneel-and-squat',
      'sit-and-squat',
      'side-lying-and-seated',
      'lying-on-back-and-side',
    ],
  },
  {
    id: 'party-corner-candid',
    zh: '派對角落即興合照',
    en: 'two women captured in an improvised party-corner snapshot, relaxed nightlife closeness, casual social energy, candid off-guard body language, model-decided interaction',
  },
  {
    id: 'behind-the-scenes',
    zh: '片場花絮感',
    en: 'two women captured in a behind-the-scenes editorial outtake, between-poses spontaneity, relaxed production-day body language, model-decided interaction and posture',
  },
  {
    id: 'lazy-sensual-photo',
    zh: '慵懶性感寫真',
    en: 'two women captured in a lazy sensual photobook moment, languid relaxed chemistry, soft intimate body language, model-decided natural contact and posture',
  },
  {
    id: 'intimate-sensual-interaction',
    zh: '親密性感互動',
    en: 'two women in an intimate sensual editorial interaction, close body spacing, teasing hand contact and flirtatious gestures, one woman may lightly touch the other\'s shoulder, waist, arm, chin, hair, thigh, hip, lower back, or leg, seductive near-contact tension, magnetic eye-line chemistry',
    legacyIds: [
      'intimate-close',
      'intimate',
      'arm-around-close',
      'whispering-close',
      'intimate-eye-contact',
      'lying-on-back-together',
      'side-lying',
      'lying-on-back',
      'prone',
    ],
  },
  {
    id: 'erotic-fashion-photo',
    zh: '充滿情慾的時尚寫真',
    en: 'two women captured in an erotic high-fashion photo-story, intertwined silhouettes, tactile provocative chemistry, teasing hand contact tracing the waist, hips, thighs, lower back, legs, arms, hair, or chin, seductive push-pull tension, adult magazine-style erotic fashion energy, magnetic eye-line chemistry, photorealistic polished editorial tone',
    legacyIds: [
      'sensual-interaction',
      'sensual-embrace',
    ],
  },
];

export const DUO_POSE_BASE_OPTIONS = [
  {
    id: 'none',
    zh: '全無',
    en: '',
    desc: 'Do not specify a broad body posture base.',
    meta: { tags: ['none'] },
  },
  {
    id: 'model-natural',
    zh: '模型自然決定',
    en: 'model-decided, choosing the most natural body arrangement for the selected scenario',
  },
  {
    id: 'standing',
    zh: '站姿',
    en: 'standing or naturally arranged around standing body language',
  },
  {
    id: 'seated',
    zh: '坐姿',
    en: 'seated or naturally arranged around a seated position',
  },
  {
    id: 'low-crouching',
    zh: '蹲姿 / 低姿態',
    en: 'low crouching, squatting, or grounded low body language',
  },
  {
    id: 'reclining',
    zh: '躺姿 / 半躺',
    en: 'lying, reclining, or half-reclining with relaxed body weight',
  },
  {
    id: 'walking',
    zh: '行走中',
    en: 'walking or mid-step with natural in-between motion',
  },
  {
    id: 'leaning',
    zh: '靠牆 / 倚靠物件',
    en: 'leaning against a wall or existing scene object with relaxed support',
  },
  {
    id: 'close-selfie',
    zh: '近鏡頭自拍感',
    en: 'clustered close to the camera with selfie-like body proximity',
  },
];

export const DUO_EXPRESSION_OPTIONS = [
  {
    id: 'none',
    zh: '全無',
    en: '',
    desc: 'Do not specify duo expression or shared gaze relationship.',
    meta: { tags: ['none'] },
  },
  {
    id: 'direct-cool-detached',
    zh: '兩人直視鏡頭｜冷淡疏離',
    en: 'both women look directly at the camera with cool detached expressions, restrained editorial distance, fashion magazine aloofness',
    meta: { tags: ['direct_gaze'] },
  },
  {
    id: 'direct-calm-natural',
    zh: '兩人直視鏡頭｜平靜自然',
    en: 'both women look directly at the camera with calm relaxed expressions, natural shared presence, understated chemistry',
    meta: { tags: ['direct_gaze'] },
  },
  {
    id: 'one-camera-one-away',
    zh: '一人看鏡頭｜一人隨性離鏡',
    en: 'one woman looks directly at the camera while the other casually looks away, asymmetrical gaze relationship, natural editorial spontaneity',
    meta: { tags: ['direct_gaze'] },
  },
  {
    id: 'same-direction-away',
    zh: '兩人同向離鏡｜沉浸感',
    en: 'both women look away in the same or similar direction, absorbed shared attention, cinematic off-camera mood',
  },
  {
    id: 'mutual-gaze-intimate',
    zh: '兩人相互凝視｜安靜親密',
    en: 'both women quietly gaze at each other, intimate eye contact, soft emotional connection, calm private chemistry',
  },
  {
    id: 'mutual-soft-smile',
    zh: '彼此微笑｜柔和默契',
    en: 'both women smile gently toward each other, warm mutual ease, soft shared rapport, relaxed closeness',
  },
  {
    id: 'mutual-laughing',
    zh: '彼此大笑｜自然開心',
    en: 'both women laugh naturally with each other, candid joyful interaction, lively shared energy, spontaneous real emotion',
  },
  {
    id: 'ambiguous-sensual-gaze',
    zh: '曖昧對視｜性感張力',
    en: 'both women share a flirtatious ambiguous gaze, seductive eye-line tension, magnetic attraction, confident sensual chemistry',
  },
  {
    id: 'triangle-gaze',
    zh: '一人凝視對方｜一人看鏡頭',
    en: 'one woman gazes at the other while the other looks toward the camera, triangular gaze tension, editorial relationship drama',
    meta: { tags: ['direct_gaze'] },
  },
  {
    id: 'lowered-lazy-sensual',
    zh: '低眼神互動｜慵懶性感',
    en: 'both women use lowered or half-lidded gazes near each other, lazy sensual mood, private close-range eye-line tension',
  },
];
