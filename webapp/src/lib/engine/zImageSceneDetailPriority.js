import { LOW_CAMERA_LABELS } from './zImageSceneDirection.js';

// Approved selection exception for seven existing catalog sources, not new
// scenery. The caller owns ordinary-single-main eligibility. Shared projection,
// other renderers and the eighteen authored upper-scene additions stay intact.
export const Z_IMAGE_SCENE_DETAIL_PRIORITY_VERSION = '1.0.0';
const record = (identity, previous, preferred) => Object.freeze({
  identity, previous: Object.freeze(previous),
  preferred: Object.freeze(preferred.map(clause => Object.freeze(
    typeof clause === 'string' ? { source: clause, text: clause } : clause))),
});
export const Z_IMAGE_SCENE_DETAIL_PRIORITIES = Object.freeze({
  'locations:生活感室內-indoor-lifestyle:室內-倫敦老咖啡館角落:17': record(
    'old London cafe corner', ['dark wood table', 'fogged window glass'],
    ['fogged window glass', { source: 'pendant lamp fixture as a visible object', text: 'pendant lamp fixture' }]),
  'locations:生活感室內-indoor-lifestyle:室內-辦公室茶水間:27': record(
    'Japanese office pantry corner', ['small sink counter', 'compact coffee machine'],
    ['compact coffee machine', 'upper wall cabinets']),
  'locations:生活感室內-indoor-lifestyle:室內-宮廷音樂廳-歌劇院:37': record(
    'opulent opera house interior', ['chandelier fixtures', 'velvet seat rows cropped from one side'],
    ['chandelier fixtures', 'ornate balcony rail']),
  'locations:地下與廢墟風格-abandoned-underground:室內-廢棄手術室:7': record(
    'abandoned operating room', ['broken surgical table', 'metal tray stand'],
    ['peeling tiled walls', 'ceiling rail']),
  'locations:城市與社群感-urban-social-snapshots:室內-九龍城寨內部狹窄走道:0': record(
    'Kowloon Walled City interior passage', ['narrow wall-to-wall corridor', 'water-stained concrete walls'],
    ['narrow wall-to-wall corridor', 'overhead pipes']),
  'locations:城市與社群感-urban-social-snapshots:室內-電車車廂正面長椅視角:8': record(
    'Japanese commuter train car interior', ['slight offset view toward a blue fabric bench seat', 'window and sliding door panels behind the subject'],
    ['slight offset view toward a blue fabric bench seat', 'overhead hand straps']),
  'locations:城市與社群感-urban-social-snapshots:室內-電車車廂坐滿與站滿乘客:10': record(
    'crowded Japanese commuter train car', ['seated passengers on bench seats', 'standing commuters around vertical grab poles'],
    ['seated passengers on bench seats', 'standing commuters around vertical grab poles', 'overhead hand straps in use']),
});

export function selectZImageSceneDetails(value, location, angle) {
  const source = String(value || '');
  const rule = Z_IMAGE_SCENE_DETAIL_PRIORITIES[location?.id];
  if (!rule || !source || !LOW_CAMERA_LABELS.includes(angle?.zh)) return source;
  const split = text => text.split(/\s*,\s*/).map(part => part.trim());
  const catalog = split(String(location.en || ''));
  const current = split(source);
  const prefix = [rule.identity, ...rule.previous];
  // Fail closed on catalog drift, missing approved fragments, overridden scene
  // identity or a changed projection. Never resurrect an empty scene or infer
  // a replacement from an unknown/imported source.
  if (catalog[0] !== rule.identity || !prefix.every((part, i) => current[i] === part)
    || !rule.preferred.every(part => catalog.includes(part.source))) return source;
  const preferred = rule.preferred.map(part => part.text);
  const selected = new Set([rule.identity, ...preferred]);
  // Preserve surviving trailing conditions, but do not duplicate selected text.
  const tail = current.slice(prefix.length).filter(part => !selected.has(part));
  return [rule.identity, ...preferred, ...tail].join(', ');
}
