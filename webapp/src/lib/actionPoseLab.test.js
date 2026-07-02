import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_ACTION_POSE_CARD_ID,
  buildActionPosePromptBundle,
  buildActionPoseSavedCard,
  createEmptyActionPoseProfile,
  getActionPoseCardById,
  getActionPoseProfileCard,
  normalizeActionPoseProfile,
} from './actionPoseLab.js';

test('default action pose profile resolves the bratty frustration mock-kick card', () => {
  const profile = createEmptyActionPoseProfile();
  const card = getActionPoseProfileCard(profile);

  assert.equal(profile.mode, 'single');
  assert.equal(card.id, DEFAULT_ACTION_POSE_CARD_ID);
  assert.equal(card.mode, 'single');
  assert.equal(card.title, '不爽發洩踢擊');
  assert.match(card.actionPrompt, /forceful bratty mock-kick toward the camera/);
  assert.match(card.expressionPrompt, /pouty, irritated, defiant expression/);
  assert.match(card.negativePoseGuard, /not a yoga pose/);
  assert.match(card.framingHint, /not suitable for face-only close-up/);
});

test('action pose profile normalization falls back to the default single card', () => {
  const normalized = normalizeActionPoseProfile({
    mode: 'duo',
    selectedCardId: 'missing-card',
  });

  assert.equal(normalized.mode, 'duo');
  assert.equal(normalized.selectedCardId, DEFAULT_ACTION_POSE_CARD_ID);
  assert.equal(getActionPoseCardById(normalized.selectedCardId)?.mode, 'single');
});

test('action pose prompt bundle and saved card keep PAGE1 apply selection scoped to actionPoseCardId', () => {
  const profile = createEmptyActionPoseProfile();
  const bundle = buildActionPosePromptBundle(profile);
  const savedCard = buildActionPoseSavedCard(profile, { now: () => '2026-07-02T00:00:00.000Z' });

  assert.equal(bundle.card.id, DEFAULT_ACTION_POSE_CARD_ID);
  assert.match(bundle.actionPrompt, /emotional outburst rather than a polished pose/);
  assert.match(bundle.negativePoseGuard, /not a dance stretch/);
  assert.equal(savedCard.source, 'actionPose');
  assert.equal(savedCard.sourceLabel, '動作姿勢');
  assert.equal(savedCard.selection.actionPoseCardId, DEFAULT_ACTION_POSE_CARD_ID);
  assert.deepEqual(Object.keys(savedCard.selection), ['actionPoseCardId']);
  assert.equal(savedCard.profile.selectedCardId, DEFAULT_ACTION_POSE_CARD_ID);
  assert.match(savedCard.summary, /動作姿勢｜不爽發洩踢擊/);
  assert.match(savedCard.grokPrompt, /forceful bratty mock-kick/);
});
