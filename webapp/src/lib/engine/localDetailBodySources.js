// Target-specific body contours are a small, source-backed subset of the
// canonical Body Type descriptions. They describe the visible local shape;
// they do not reintroduce full height, measurements, or whole-body balance.
const BODY_CONTOURS = Object.freeze({
  高挑時裝模特: Object.freeze({
    chest: 'narrow ribcage',
    abdomen: 'high waistline, narrow ribcage',
  }),
  一般基本體型: Object.freeze({
    chest: 'modest bust',
    abdomen: 'low-contrast waist curve',
  }),
  柔和沙漏身形: Object.freeze({
    chest: 'fuller bust',
    abdomen: 'elongated abdomen with subtle contour lines',
  }),
  性感曲線身形: Object.freeze({
    chest: 'full F-to-G-cup-scale bust',
    abdomen: 'narrow defined waist',
  }),
  運動緊實身形: Object.freeze({
    chest: 'fit toned athletic upper body, subtle muscle definition',
    abdomen: 'healthy firm silhouette, subtle muscle definition',
  }),
  小隻精緻身形: Object.freeze({
    chest: 'compact refined upper-body proportions, graceful small-frame presence',
    abdomen: 'compact refined proportions, graceful small-frame presence',
  }),
});

const active = (item) => Boolean(item && item.zh !== '全無' && item.id !== 'none'
  && typeof item.en === 'string' && item.en.trim() && item.en !== 'none');

/**
 * Return one source-traceable local contour, or a diagnostic when a selected
 * Body Type no longer contains its reviewed canonical phrase. A stale source
 * never blocks the whole local target; it simply contributes no contour.
 */
export function reviewedLocalBodyContour(bodyType, target) {
  if (!active(bodyType)) return null;
  const contour = BODY_CONTOURS[bodyType.zh]?.[target === 'collarbone-chest' ? 'chest' : 'abdomen'];
  if (!contour) return { diagnostic: 'unreviewed-body-contour' };
  if (!bodyType.en.includes(contour)) return { diagnostic: 'unreviewed-body-contour' };
  return {
    detail: {
      group: 'bodyContour',
      scope: 'target',
      ref: { key: 'character.bodyType', excerpt: contour },
    },
  };
}
