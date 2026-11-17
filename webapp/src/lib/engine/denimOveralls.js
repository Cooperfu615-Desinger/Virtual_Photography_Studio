// Only the two reviewed catalog sources opt in. Historical/custom libraries
// with the former wording retain their original rendering and rise behavior.
const SOURCES = Object.freeze({
  'wardrobe:褲裝-pants:丹寧吊帶長褲:25': 'denim overalls worn low on the hips, one strap unfastened',
  'wardrobe:褲裝-pants:丹寧吊帶短褲:26': 'denim short overalls worn low on the hips, one strap unfastened',
});

export function isLowSlungDenimOveralls(item) {
  const source = SOURCES[String(item?.id || '').replace(/:[ab]$/, '')];
  return Boolean(source && item?.en === source);
}

export const LOW_SLUNG_OVERALLS_WEARING = 'worn low on the hips, one strap unfastened';
export const LOW_SLUNG_OVERALLS_END = /\bdenim (?:short )?overalls(?: (?:finished in|patterned with) [^,]+)? worn low on the hips, one strap unfastened$/;
