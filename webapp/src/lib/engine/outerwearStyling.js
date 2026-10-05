import { resolveOuterwearBase } from './outerwearModel.js';

export const outerwearStylingKind = item => item?.meta?.outerwearStyling?.kind || '';
export const isNewOuterwearStyling = item => Boolean(outerwearStylingKind(item));
export const isDrapedOuterwearStyling = item => ['drape-both', 'drape-one'].includes(outerwearStylingKind(item));
export const outerwearStylingAllowsClosed = item => ['hem-overlap', 'rolled-sleeves'].includes(outerwearStylingKind(item));

export function outerwearStylingControlContext(controls, locks, suffix = '') {
  const selected = key => controls.find(control => control.key === key)?.options.find(item => item.id === locks[key]);
  const pants = selected(`pants${suffix}Id`);
  const skirt = selected(`skirt${suffix}Id`);
  return { outerwear: selected(`outerwear${suffix}Id`), fit: selected(`outerwear${suffix}FitId`),
    opening: selected(`outerwear${suffix}OpeningId`),
    hasBottom: !(pants?.zh === '全無' && skirt?.zh === '全無'),
    handId: suffix ? '' : locks.poseHandId };
}

// Return a shared incompatibility reason; neither sources nor stored locks mutate.
// Undefined garments are unresolved random UI selections, not explicit absence.
export function outerwearStylingConflict(styling, { outerwear, fit, opening, fullyClosed = false, hasBottom = true, handId = '' } = {}) {
  const kind = outerwearStylingKind(styling);
  if (!kind) return '';
  if (fullyClosed && !outerwearStylingAllowsClosed(styling)) return '完全閉合時不適用此披肩穿法。';
  if (isDrapedOuterwearStyling(styling)) {
    if (opening?.meta?.outerwearFastenerRequirement) return '披肩穿法不適用半扣或半拉鏈。';
    if (handId === 'hands-pull-open-off-shoulder-outerwear') return '此手部動作要求雙臂留在袖內。';
  }
  if (outerwear === undefined) return '';
  if (!outerwear || outerwear.zh === '全無') return '請先選擇外套。';
  if (kind === 'hem-overlap') {
    if (!hasBottom) return '需要同一人物的獨立褲裝或裙裝。';
    const source = resolveOuterwearBase(outerwear, fit) || outerwear.en;
    if (/\b(?:cropped|underbust)\b/i.test(source)) return '短版外套衣襬無法覆到下身。';
  }
  if (kind === 'rolled-sleeves' && !outerwear.meta?.outerwear?.rollableSleeves) return '此款外套未列入可捲袖款式。';
  return '';
}

export function resolveOuterwearStylingSource(styling, options) {
  if (!isNewOuterwearStyling(styling)) return styling;
  if (outerwearStylingConflict(styling, options)) return { ...styling, en: '' };
  const throughFabric = options.outerwear?.meta?.outerwear?.closedInnerLayerVisibility === 'through-fabric';
  const source = outerwearStylingKind(styling) === 'hem-overlap' && throughFabric
    ? styling.meta.outerwearStyling.throughFabricEn : styling.en;
  return { ...styling, en: source };
}

// New sources are atomic: retain them verbatim or omit the whole crop-invisible
// instruction, rather than deriving renderer-specific short phrases.
export function projectOuterwearStyling(pieces, projection) {
  const zones = projection?.wardrobe?.detailZones || [];
  return pieces.map(item => {
    const kind = outerwearStylingKind(item);
    if ((kind === 'hem-overlap' || kind === 'rolled-sleeves') && !zones.includes('waist')) return { ...item, en: '' };
    return item;
  });
}
