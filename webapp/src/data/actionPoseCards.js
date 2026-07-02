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
    category: '情緒動作 / 踢擊 / 撒氣',
    actionPrompt: 'She is visibly annoyed and fed up, leaning forward with a pouty defiant mood as she kicks one foot into a nearby object or toward the lower edge of the frame. The kick should feel impulsive and bratty, like a small emotional outburst rather than a martial arts move. Her body tilts naturally into the action, one knee lifted or bent forward, with the rest of her posture slightly tense and off-balance. Keep it candid, playful, street-fashion, and emotionally driven.',
    expressionPrompt: 'pouty, annoyed, bratty defiant expression, unhappy eyes, tightened brows',
    negativePoseGuard: 'not violent, not martial arts, not a dance stretch, not a yoga pose, not a high-leg flexibility display, not a polished fashion pose',
    framingHint: 'works best with medium, full-body, low-angle, or dynamic close perspective; needs lower body visible',
    meta: {
      tags: ['action_pose', 'single_action_pose', 'full_body_action', 'leg_focus_action', 'direct_gaze'],
      minVisibility: 'full',
    },
  },
  {
    id: 'defiant-middle-finger-lens-jab',
    title: '頂鏡頭挑釁手勢',
    mode: 'single',
    category: '情緒動作 / 挑釁 / 手勢',
    actionPrompt: 'She leans aggressively close toward the camera with a cold, irritated, defiant stare, thrusting one hand forward into the lens with a rude confrontational gesture. The hand should be close to camera, slightly foreshortened and motion-blurred, while her upper body bends forward as if stepping into the viewer’s personal space. The mood is bratty, rebellious, and street-candid rather than genuinely threatening.',
    expressionPrompt: 'cold defiant stare, irritated eyes, serious mouth, bratty confrontational mood',
    negativePoseGuard: 'not violent, not threatening, not a punch, not a dance move, not a static portrait pose, not cute peace sign, not friendly pointing',
    framingHint: 'works best with close-up, medium close-up, wide-angle, or dynamic lens-perspective framing; face and forward hand should dominate',
    meta: {
      tags: ['action_pose', 'single_action_pose', 'face_action', 'hand_focus_action', 'direct_gaze'],
      minVisibility: 'upper',
    },
  },
  {
    id: 'low-seated-aloof-cats-street-mood',
    title: '低坐貓群冷淡氛圍',
    mode: 'single',
    category: '氛圍動作 / 低坐 / 小貓',
    actionPrompt: 'She sits low on the ground in a relaxed but guarded street-candid posture, surrounded by several small cats resting or lingering close around her. Her legs are loosely arranged, her torso slightly tilted, and her arms rest naturally near her lap or around one leg. She looks upward toward the camera with an aloof, distant, slightly moody expression, as if quietly observing without inviting attention. The cats should feel naturally present and calm, adding a quiet intimate street mood rather than becoming the main subject.',
    expressionPrompt: 'aloof, distant, slightly moody expression, soft guarded eyes, relaxed unsmiling mouth',
    negativePoseGuard: 'not yoga, not stretching, not a dance pose, not glamour posing, not seductive floor pose, not symmetrical studio sitting pose, do not make the cats aggressive or surreal',
    framingHint: 'works best with medium, three-quarter, seated full-body, or slightly high/close street-candid framing',
    meta: {
      tags: ['action_pose', 'single_action_pose', 'seated_pose', 'atmosphere_pose', 'small_cats', 'direct_gaze'],
      minVisibility: 'seated_full',
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
