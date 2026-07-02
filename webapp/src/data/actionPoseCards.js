export const DEFAULT_ACTION_POSE_CARD_ID = 'bratty-frustration-mock-kick';

export const ACTION_POSE_MODES = [
  { id: 'single', label: '單人動作', enabled: true },
  { id: 'duo', label: '雙人動作', enabled: false },
];

export const ACTION_POSE_CARDS = [
  {
    id: DEFAULT_ACTION_POSE_CARD_ID,
    title: '不爽發洩踢擊',
    mode: 'single',
    category: '情緒動作 / 踢擊',
    summary: '女子心情極差，瞪著讓她不爽的人，帶著嘟嘴不滿與任性挑釁感，用力踢出一腳作為情緒發洩。',
    actionPrompt: 'She is in a terrible mood, visibly annoyed and fed up, staring toward the person who upset her as if confronting the camera. She vents her frustration with a forceful bratty mock-kick toward the camera, using the kick as an emotional outburst rather than a polished pose. Her expression is pouty, irritated, and defiant, with tightened brows and unhappy eyes. The body should react naturally to the force of the kick, impulsive and tense, with one leg driving forward as the main action. Keep it playful and street-fashion candid, not violent, not a dance stretch, not a yoga pose, not a high-leg flexibility display.',
    expressionPrompt: 'pouty, irritated, defiant expression, tightened brows, unhappy eyes',
    negativePoseGuard: 'not violent, not a dance stretch, not a yoga pose, not a high-leg flexibility display',
    framingHint: 'works best with medium, full-body, low-angle, or dynamic close perspective; not suitable for face-only close-up',
    meta: {
      tags: ['action_pose', 'single_action_pose', 'full_body_action', 'leg_focus_action', 'direct_gaze'],
      minVisibility: 'full',
    },
  },
];

export function getActionPoseCardById(cardId) {
  if (!cardId) return null;
  return ACTION_POSE_CARDS.find((card) => card.id === cardId) || null;
}

export function isActionPoseCardId(cardId) {
  return Boolean(getActionPoseCardById(cardId));
}

export function getActionPoseCardsByMode(mode = 'single') {
  return ACTION_POSE_CARDS.filter((card) => card.mode === mode);
}
