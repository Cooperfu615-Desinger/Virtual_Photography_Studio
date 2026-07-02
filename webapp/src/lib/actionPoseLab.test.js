import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ACTION_POSE_CARDS,
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
  assert.match(card.actionPrompt, /kicks one foot into a nearby object/);
  assert.match(card.actionPrompt, /small emotional outburst rather than a martial arts move/);
  assert.match(card.expressionPrompt, /pouty, annoyed, bratty defiant expression/);
  assert.match(card.negativePoseGuard, /not a yoga pose/);
  assert.match(card.framingHint, /needs lower body visible/);
  assert.equal(Object.hasOwn(card, 'summary'), false);
});

test('single action pose library includes the first three finalized image-derived cards without duplicate summaries', () => {
  const cards = ACTION_POSE_CARDS.filter((card) => card.mode === 'single');
  const cardIds = cards.map((card) => card.id);
  const lensJabCard = getActionPoseCardById('defiant-middle-finger-lens-jab');
  const catsMoodCard = getActionPoseCardById('low-seated-aloof-cats-street-mood');

  assert.deepEqual(cardIds, [
    DEFAULT_ACTION_POSE_CARD_ID,
    'defiant-middle-finger-lens-jab',
    'low-seated-aloof-cats-street-mood',
  ]);
  cards.forEach((card) => {
    assert.equal(Object.hasOwn(card, 'summary'), false);
  });
  assert.match(lensJabCard.actionPrompt, /thrusting one hand forward into the lens/);
  assert.match(catsMoodCard.category, /氛圍/);
  assert.match(catsMoodCard.actionPrompt, /surrounded by several small cats/);
  assert.match(catsMoodCard.negativePoseGuard, /do not make the cats aggressive or surreal/);
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
  assert.match(bundle.actionPrompt, /small emotional outburst rather than a martial arts move/);
  assert.match(bundle.negativePoseGuard, /not a dance stretch/);
  assert.equal(savedCard.source, 'actionPose');
  assert.equal(savedCard.sourceLabel, '動作姿勢');
  assert.equal(savedCard.selection.actionPoseCardId, DEFAULT_ACTION_POSE_CARD_ID);
  assert.deepEqual(Object.keys(savedCard.selection), ['actionPoseCardId']);
  assert.equal(savedCard.profile.selectedCardId, DEFAULT_ACTION_POSE_CARD_ID);
  assert.equal(savedCard.summary, '動作姿勢｜不爽發洩踢擊');
  assert.match(savedCard.grokPrompt, /kicks one foot into a nearby object/);
});
