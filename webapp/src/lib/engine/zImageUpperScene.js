import { LOW_CAMERA_LABELS } from './zImageSceneDirection.js';

// Authored supplemental sources, approved through the V2-1..4 image comparison.
// This is not a raw-catalog backfill or a generic ceiling/foliage inference rule.
// See Docs/specs/z-image-upper-scene-v2.md. Shared catalog and GPT/MJ stay intact.
export const Z_IMAGE_UPPER_SCENE_VERSION = '1.0.0';
const authored = (identity, clauses) => Object.freeze({ identity, clauses: Object.freeze(clauses) });
export const Z_IMAGE_UPPER_SCENE_SOURCES = Object.freeze({
  'locations:生活感室內-indoor-lifestyle:戶外-日式旅館緣側木廊:36': authored(
    'traditional Japanese ryokan engawa veranda', ['the underside of wooden eaves', 'exposed rafters']),
  'locations:生活感室內-indoor-lifestyle:室內-日式和室:25': authored(
    'traditional Japanese washitsu room', ['a wooden lintel above the shoji doors']),
  'locations:地下與廢墟風格-abandoned-underground:室內-廢棄水泥工廠破碎輸送帶區:0': authored(
    'abandoned cement factory conveyor-belt corner', ['rusted steel beams overhead']),
  'locations:自然與戶外-nature-outdoors:戶外-草地與樹木:3': authored(
    'small grassy park patch', ['irregular branches and foliage overhead']),
});

// Caller owns ordinary-single-main eligibility. Require the effective location
// ID AND its surviving source identity; never replace an empty/overridden scene.
export function appendZImageUpperScene(value, location, angle) {
  const source = String(value || '');
  const record = Z_IMAGE_UPPER_SCENE_SOURCES[location?.id];
  if (!record || !source || !LOW_CAMERA_LABELS.includes(angle?.zh)) return source;
  const clauses = source.replace(/[.!?]+$/, '').split(/\s*,\s*/).map((c) => c.trim());
  if (clauses[0] !== record.identity) return source;
  const existing = new Set(clauses.map((c) => c.toLowerCase()));
  const added = record.clauses.filter((c) => !existing.has(c.toLowerCase()));
  return added.length ? [...clauses, ...added].join(', ') : source;
}
