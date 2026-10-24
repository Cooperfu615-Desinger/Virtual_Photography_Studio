// Pose UI v2 part 2 (Cooper 2026-10-21): 頭部 is its own group next to 視線. It keeps only
// the five reviewed head options that do not depend on the action, the body direction or a
// support surface; their English is reused from the free-composer head list. It is a new
// key (headPostureId) so the legacy poseHeadId 隨機 (a 26-option draw) stays untouched.
import { POSE_COMPOSER_HEAD_OPTIONS } from './poseComposerOptions.js';

const freeze = value => Object.freeze(value);
const choice = (id, zh) => freeze({ id, zh, en: '', meta: freeze({ tags: freeze([id]) }) });

export const HEAD_POSTURE_IDS = freeze([
  'head-slight-tilt', 'chin-slightly-raised', 'chin-slightly-lowered', 'head-near-shoulder', 'head-slightly-back',
]);

const postureOption = id => {
  const source = POSE_COMPOSER_HEAD_OPTIONS.find(option => option.id === id);
  if (!source) throw new Error(`head posture source missing: ${id}`);
  return freeze({ id: source.id, zh: source.zh, en: source.en, meta: freeze({ tags: freeze(['head_posture']) }) });
};

const POSTURES = HEAD_POSTURE_IDS.map(postureOption);
export const HEAD_POSTURE_OPTIONS = freeze([choice('none', '全無'), choice('random', '隨機'), ...POSTURES]);

// A lowered gaze (低頭) already tips the head down; these two lift it and contradict it.
const LOWERED_GAZE_CONFLICTS = new Set(['chin-slightly-raised', 'head-slightly-back']);
export const postureConflictsWithGaze = (postureId, gazeId) => gazeId === 'gaze-down' && LOWERED_GAZE_CONFLICTS.has(postureId);

/** null when unused; 隨機 makes one random() call and skips postures the resolved gaze contradicts. */
export function resolveHeadPosture(id, gaze = null, random = Math.random) {
  if (!id || id === 'none') return null;
  const usable = POSTURES.filter(option => !postureConflictsWithGaze(option.id, gaze?.id));
  if (id === 'random') return usable[Math.min(usable.length - 1, Math.floor(random() * usable.length))] || null;
  return usable.find(option => option.id === id) || null;
}

const herPhrase = en => (/^(?:head|chin)\b/i.test(en) ? `her ${en}` : en);

/** Joins a head option (gaze or legacy head) with a posture into one option: "head turned
 * toward the camera, her chin slightly raised". A posture alone keeps its own wording and
 * is flagged so the selection snapshot records it under headPostureId, not poseHeadId. */
export function mergeHeadPosture(head, posture) {
  if (!posture) return head;
  const active = head && head.id !== 'none' && head.id !== 'random';
  if (!active) return { ...posture, meta: { ...posture.meta, headPostureId: posture.id, headPostureOnly: true } };
  return { ...head, en: `${head.en}, ${herPhrase(posture.en)}`, meta: { ...head.meta, headPostureId: posture.id } };
}

export const headPostureById = id => POSTURES.find(option => option.id === id) || null;
