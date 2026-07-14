import {
  ACTION_POSE_CARDS,
  ACTION_POSE_MODES,
  DEFAULT_ACTION_POSE_CARD_ID,
  getActionPoseCardById,
  getActionPoseCardsByMode,
  isActionPoseCardId,
} from '../data/actionPoseCards.js';

export {
  ACTION_POSE_CARDS,
  ACTION_POSE_MODES,
  DEFAULT_ACTION_POSE_CARD_ID,
  getActionPoseCardById,
  getActionPoseCardsByMode,
  isActionPoseCardId,
};

export function createEmptyActionPoseProfile() {
  return {
    mode: 'single',
    selectedCardId: DEFAULT_ACTION_POSE_CARD_ID,
  };
}

export function normalizeActionPoseProfile(rawProfile = {}) {
  const mode = ACTION_POSE_MODES.some((entry) => entry.id === rawProfile?.mode)
    ? rawProfile.mode
    : 'single';
  const selectedCard = getActionPoseCardById(rawProfile?.selectedCardId);
  const fallbackCard = getActionPoseCardById(DEFAULT_ACTION_POSE_CARD_ID);
  const compatibleCard = selectedCard?.mode === 'single' ? selectedCard : fallbackCard;

  return {
    mode,
    selectedCardId: compatibleCard?.id || DEFAULT_ACTION_POSE_CARD_ID,
  };
}

export function getActionPoseProfileCard(profile) {
  const normalizedProfile = normalizeActionPoseProfile(profile);
  return getActionPoseCardById(normalizedProfile.selectedCardId) || getActionPoseCardById(DEFAULT_ACTION_POSE_CARD_ID);
}

export function buildActionPosePromptBundle(profile) {
  const card = getActionPoseProfileCard(profile);
  if (!card) {
    return {
      card: null,
      actionPrompt: '',
      expressionPrompt: '',
      negativePoseGuard: '',
      framingHint: '',
      outputs: [],
    };
  }

  const outputs = [
    {
      id: 'action-prompt',
      label: 'Action Prompt',
      value: card.actionPrompt,
    },
    {
      id: 'expression',
      label: 'Expression',
      value: card.expressionPrompt,
    },
    {
      id: 'negative-guard',
      label: 'Negative Guard',
      value: card.negativePoseGuard,
    },
    {
      id: 'framing-hint',
      label: 'Framing Hint',
      value: card.framingHint,
    },
  ];

  return {
    card,
    actionPrompt: card.actionPrompt,
    expressionPrompt: card.expressionPrompt,
    negativePoseGuard: card.negativePoseGuard,
    framingHint: card.framingHint,
    outputs,
  };
}

export function buildActionPoseSavedCard(profile, options = {}) {
  const normalizedProfile = normalizeActionPoseProfile(profile);
  const bundle = buildActionPosePromptBundle(normalizedProfile);
  const card = bundle.card;
  const now = typeof options.now === 'function' ? options.now() : new Date().toISOString();

  if (!card) return null;

  return {
    id: `actionPose-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: 'actionPose',
    sourceLabel: '動作姿勢',
    date: now,
    summary: `動作姿勢｜${card.title}`,
    summaryFields: {
      characterDna: '-',
      expressionPose: card.title,
      wardrobe: '-',
      sceneLook: card.framingHint,
    },
    midjourneyPrompt: card.expressionPrompt,
    grokPrompt: card.actionPrompt,
    zImagePrompt: card.negativePoseGuard,
    extraPrompts: [
      {
        id: 'framing-hint',
        label: 'Framing Hint',
        text: card.framingHint,
      },
    ],
    promptLabels: {
      midjourney: 'Expression',
      grok: 'Action Prompt',
      zImage: 'Negative Guard',
    },
    selection: {
      actionPoseCardId: card.id,
    },
    structured: {
      'Action Pose': [
        {
          zh: card.title,
          en: card.actionPrompt,
        },
      ],
      'Negative Pose Guard': [
        {
          zh: '動作限制',
          en: card.negativePoseGuard,
        },
      ],
      'Framing Hint': [
        {
          zh: '景別建議',
          en: card.framingHint,
        },
      ],
    },
    profile: normalizedProfile,
    sourceTags: Array.isArray(card.meta?.tags) ? card.meta.tags : [],
  };
}

export function buildPage1LocksFromActionPoseCard(prevLocks, cardId) {
  const card = getActionPoseCardById(cardId);
  return {
    ...prevLocks,
    actionPoseCardId: card?.mode === 'single' ? card.id : '',
  };
}
