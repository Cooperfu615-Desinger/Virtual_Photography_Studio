export const CONDITIONAL_GARTER_BELT_SUMMARY_LABEL = '蕾絲吊襪帶腰封（自動搭配）';

const CONDITIONAL_BOTTOM_LABELS = new Set([
  '蕾絲內褲',
  '蕾絲丁字褲',
  '比基尼下身',
]);

const CONDITIONAL_BOTTOM_ID_PREFIX = 'wardrobe:褲裝-pants:';
const THIGH_HIGH_LEGWEAR_ID_PREFIX = 'wardrobe:襪類-legwear:';
const THIGH_HIGH_LEGWEAR_LABEL = '膝上蕾絲吊帶襪';
const GARTER_BELT_PROMPT_FRAGMENT = 'a separate lace garter belt worn over the bottoms at the hips, with slim straps connecting to the stocking tops';

export function hasConditionalGarterBeltLabels(bottomLabel, legwearLabel) {
  return CONDITIONAL_BOTTOM_LABELS.has(String(bottomLabel || '').trim())
    && String(legwearLabel || '').trim() === THIGH_HIGH_LEGWEAR_LABEL;
}

function isEligibleIndependentBottom(item) {
  return item?.id?.startsWith(CONDITIONAL_BOTTOM_ID_PREFIX)
    && CONDITIONAL_BOTTOM_LABELS.has(String(item.zh || '').trim());
}

function isSelectedThighHighLegwear(item) {
  return item?.id?.startsWith(THIGH_HIGH_LEGWEAR_ID_PREFIX)
    && String(item.zh || '').trim() === THIGH_HIGH_LEGWEAR_LABEL;
}

function getWardrobeRole(item) {
  return item?.meta?.wardrobeRole || null;
}

function withConditionalGarterBelt(legwear) {
  if (String(legwear.en || '').toLowerCase().includes(GARTER_BELT_PROMPT_FRAGMENT)) return legwear;

  const baseDescription = String(legwear.en || '')
    .replace(/\bgarter stockings\b/i, 'stockings')
    .replace(/,\s*visible garter straps\b/i, '')
    .replace(/\s*,\s*,/g, ',')
    .replace(/[\s,.]+$/, '');

  return {
    ...legwear,
    zh: `${legwear.zh}、${CONDITIONAL_GARTER_BELT_SUMMARY_LABEL}`,
    en: `${baseDescription}, ${GARTER_BELT_PROMPT_FRAGMENT}`,
    meta: {
      ...(legwear.meta || {}),
      conditionalGarterBeltLayer: true,
    },
  };
}

/**
 * Add the waist-level garter-belt layer only when the same person has one of
 * the reviewed independent bottoms and the selected thigh-high lace stockings.
 * The underlying option ids and saved selection schema are left untouched.
 */
export function addConditionalGarterBeltLayer(pieces) {
  if (!Array.isArray(pieces) || pieces.length === 0) return pieces;

  const eligibleRoles = new Set(
    pieces
      .filter(isEligibleIndependentBottom)
      .map(getWardrobeRole),
  );
  if (eligibleRoles.size === 0) return pieces;

  return pieces.map((piece) => (
    isSelectedThighHighLegwear(piece) && eligibleRoles.has(getWardrobeRole(piece))
      ? withConditionalGarterBelt(piece)
      : piece
  ));
}
