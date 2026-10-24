// Test-only exact phrase bridge for immutable pre-catalog snapshots. The focused
// catalog tests assert the new phrases; no whole wardrobe/section is discarded.
export function normalizeOuterwearCatalogForLegacy(text, field) {
  const preCatalog = 'slipped down around both upper arms, with the neckline resting below both shoulders and both arms still in the sleeves';
  // Both the 2026-10-23 wording and the wording legacy-order baselines still render map back.
  let result = text.replaceAll(
    'slid down off both shoulders and hanging around both upper arms, both arms still in the sleeves', preCatalog,
  ).replaceAll(
    'halfway taken off, hanging around both upper arms with both shoulders fully uncovered and both arms still in the sleeves', preCatalog,
  );
  const mj = field === 'midjourneyPrompt';
  result = result.replaceAll('longline cotton-poplin button-up shirt', mj
    ? 'longline button-up shirt in cotton poplin, curved shirttail hem'
    : 'longline button-up shirt in cotton poplin, pointed collar, long sleeves with buttoned cuffs, curved shirttail hem');
  result = result.replaceAll('washed denim jacket', 'denim jacket, washed denim texture, chest pockets, metal buttons, casual structured outerwear');
  if (mj) return result.replaceAll('blazer in suiting fabric', 'blazer')
    .replaceAll(', front panels resting naturally', '')
    .replaceAll(', partially buttoned at the front', '');
  return result.replaceAll('front panels resting naturally', 'outerwear worn with its front closure in the normal default position, front panels aligned naturally')
    .replaceAll('partially buttoned at the front', 'button-front outerwear partially buttoned, with some buttons fastened and the remaining front panels naturally open')
    .replaceAll('zipped halfway up, open above the zipper', 'zip-front outerwear partially zipped, zipper closed to the mid-front while the upper front remains naturally open');
}
