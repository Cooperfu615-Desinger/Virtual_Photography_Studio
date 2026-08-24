import { COMPOSITION_VISIBILITY_BUCKETS } from './compositionVisibilityContract.js';

/**
 * Crop-aware Pose Composer projection metadata.
 *
 * `visible` keeps the option's canonical description, `projected` reserves a
 * crop-specific fragment (added by the content layer), and `omit` suppresses
 * the option because the selected crop cannot show it without inventing
 * off-frame geometry.
 */
export const POSE_COMPOSER_PROJECTION_MODES = Object.freeze({
  VISIBLE: 'visible',
  PROJECTED: 'projected',
  OMIT: 'omit',
});

const VALID_MODES = new Set(Object.values(POSE_COMPOSER_PROJECTION_MODES));
const VALID_BUCKETS = new Set(Object.values(COMPOSITION_VISIBILITY_BUCKETS));

function assertBucket(bucket) {
  if (!VALID_BUCKETS.has(bucket)) {
    throw new Error(`Unknown composition visibility bucket: ${bucket}`);
  }
}

function setProjectionMode(map, bucket, mode) {
  assertBucket(bucket);
  if (!VALID_MODES.has(mode)) {
    throw new Error(`Unknown Pose Composer projection mode: ${mode}`);
  }
  map[bucket] = Object.freeze({ mode });
}

/**
 * Build an immutable per-bucket projection map for option metadata.
 * Later groups override earlier groups, so callers can describe the map in
 * the natural order: visible, projected, then omitted exceptions.
 */
export function createPoseComposerProjectionMap({ visible = [], projected = [], omit = [] } = {}) {
  const map = {};
  visible.forEach((bucket) => setProjectionMode(map, bucket, POSE_COMPOSER_PROJECTION_MODES.VISIBLE));
  projected.forEach((bucket) => setProjectionMode(map, bucket, POSE_COMPOSER_PROJECTION_MODES.PROJECTED));
  omit.forEach((bucket) => setProjectionMode(map, bucket, POSE_COMPOSER_PROJECTION_MODES.OMIT));
  return Object.freeze(map);
}

/**
 * Read and normalize one option's projection instruction. String metadata is
 * accepted for forward/backward compatibility; object metadata may add an
 * `en` fragment in the later content layer.
 */
export function getPoseComposerProjection(option, bucket) {
  assertBucket(bucket);
  const raw = option?.meta?.projectionByBucket?.[bucket];
  if (!raw) return null;

  const mode = typeof raw === 'string' ? raw : raw.mode;
  if (!VALID_MODES.has(mode)) return null;

  const projectedEnglish = typeof raw === 'object' && typeof raw.en === 'string'
    ? raw.en.trim()
    : '';
  return Object.freeze({
    mode,
    ...(projectedEnglish ? { en: projectedEnglish } : {}),
  });
}
