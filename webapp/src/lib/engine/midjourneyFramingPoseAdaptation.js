import { COMPOSITION_VISIBILITY_BUCKETS } from './compositionVisibilityContract.js';

const VALID_ASPECT_RATIO = /^\d+:\d+$/;

const WIDE_CANVAS_RATIOS = Object.freeze(new Set(['4:3', '16:9', '21:9']));
const NON_FULL_BODY_BUCKETS = Object.freeze(new Set([
  COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
  COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS,
  COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
  COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
]));

const CROP_ANCHOR_BY_BUCKET = Object.freeze({
  [COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL]: 'face and upper head',
  [COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS]: 'head and shoulders',
  [COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP]: 'head through upper chest',
  [COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST]: 'head through waist',
  [COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE]: 'head through below the knees',
  [COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY]: 'head to footwear',
});

const LENS_BEHAVIOR_BY_FOCAL_LENGTH = Object.freeze({
  '20mm': 'wide_expansion',
  '24mm': 'wide_expansion',
  '28mm': 'natural_wide',
  '35mm': 'natural_wide',
  '50mm': 'neutral_perspective',
  '85mm': 'telephoto_compression',
  '105mm': 'telephoto_compression',
  '135mm': 'telephoto_compression',
});

const LENS_BEHAVIOR_BY_TOKEN = Object.freeze([
  ['macro', 'close_focus_detail'],
  ['fisheye', 'barrel_distortion'],
  ['tilt-shift', 'plane_control'],
  ['anamorphic', 'anamorphic_optics'],
]);

function freezeList(values = []) {
  return Object.freeze([...values]);
}

function lensSourceText(lens) {
  return [lens?.zh, lens?.en, lens?.desc].filter(Boolean).join(' ');
}

function normalizeAspectRatio(value) {
  const normalized = String(value || '').trim();
  return VALID_ASPECT_RATIO.test(normalized) ? normalized : '';
}

/**
 * Resolve the ratio that the Midjourney parameter tail will use. MJ-specific
 * overrides take precedence over the PAGE1 ratio, without changing selection.
 */
export function resolveMidjourneyAspectRatio(context = {}) {
  const override = context.locks?.mjAspectRatio;
  if (override && override !== 'page1') return normalizeAspectRatio(override);
  return normalizeAspectRatio(context.aspectRatio?.id || context.aspectRatio?.en);
}

/**
 * Classify only the optical behavior of the selected lens. The original lens
 * option remains the source of truth and is never replaced by this value.
 */
export function classifyMidjourneyLens(lens = null) {
  const text = lensSourceText(lens).toLowerCase();
  const focal = text.match(/\b(?:20|24|28|35|50|85|105|135)mm\b/)?.[0] || '';
  if (focal && LENS_BEHAVIOR_BY_FOCAL_LENGTH[focal]) {
    return LENS_BEHAVIOR_BY_FOCAL_LENGTH[focal];
  }
  return LENS_BEHAVIOR_BY_TOKEN.find(([token]) => text.includes(token))?.[1] || '';
}

function resolveFramingBucket(context) {
  return context.compositionVisibility?.bucket
    || COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED;
}

function buildCompositionAdditions({ aspectRatio, bucket, lensBehavior, framingOpening = '' }) {
  const additions = [];
  const wideCanvas = WIDE_CANVAS_RATIOS.has(aspectRatio);
  const hasExplicitEdgeComposition = /off-center|frame edge|negative space|flush against/i.test(framingOpening);

  if (wideCanvas && NON_FULL_BODY_BUCKETS.has(bucket) && !hasExplicitEdgeComposition) {
    additions.push('natural horizontal crop');
  }

  if (
    (
      lensBehavior === 'wide_expansion'
      || lensBehavior === 'barrel_distortion'
      || (lensBehavior === 'anamorphic_optics' && wideCanvas)
    )
    && !hasExplicitEdgeComposition
  ) {
    additions.push('subject kept near the center of the frame');
  }

  return freezeList(additions);
}

function buildImagingAdditions(lens) {
  const source = lensSourceText(lens);
  const behavior = classifyMidjourneyLens(lens);
  const additions = [];

  if (
    behavior === 'telephoto_compression'
    && /narrow(?:ed)? field of view/i.test(source)
  ) {
    additions.push('narrow field of view');
  }
  if (behavior === 'telephoto_compression' && /distant working distance/i.test(source)) {
    additions.push('distant working distance');
  }
  if (behavior === 'plane_control' && /corrected vertical lines/i.test(source)) {
    additions.push('corrected vertical lines');
  }
  if (behavior === 'plane_control' && /tilted focus plane/i.test(source)) {
    additions.push('tilted focus plane');
  }

  return freezeList(additions);
}

/**
 * Build non-persistent Midjourney-only framing/lens context. Pose text is
 * intentionally carried through unchanged; exact canonical pose reuse remains
 * a shared-output contract rather than an AI-only rewrite opportunity.
 */
export function buildMidjourneyFramingPoseAdaptation(context = {}) {
  const aspectRatio = resolveMidjourneyAspectRatio(context);
  const bucket = resolveFramingBucket(context);
  const lensBehavior = classifyMidjourneyLens(context.lens);
  const poseText = String(context.projectedCanonicalPoseText || '').trim();

  return Object.freeze({
    aspectRatio,
    ratioClass: WIDE_CANVAS_RATIOS.has(aspectRatio) ? 'wide_canvas' : 'other',
    framingBucket: bucket,
    framingIntent: bucket === COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY
      ? 'full_body'
      : bucket === COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED
        ? 'unconstrained'
        : 'natural_crop',
    cropAnchor: CROP_ANCHOR_BY_BUCKET[bucket] || '',
    lensBehavior,
    poseSource: poseText ? 'projected_canonical_pose' : 'none',
    poseText,
    imagingAdditions: buildImagingAdditions(context.lens),
    compositionAdditions: buildCompositionAdditions({
      aspectRatio,
      bucket,
      lensBehavior,
      framingOpening: context.fixedFramingCompositionOpening,
    }),
  });
}
