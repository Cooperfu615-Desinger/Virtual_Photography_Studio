import { LOW_CAMERA_LABELS } from './zImageSceneDirection.js';

// Four image-tested sources plus fourteen user-approved detail extensions.
// This is not a raw-catalog backfill or a generic ceiling/foliage inference rule.
// See Docs/specs/z-image-upper-scene-v2.md. Shared catalog and GPT/MJ stay intact.
export const Z_IMAGE_UPPER_SCENE_VERSION = '1.1.0';
const authored = (identity, clauses) => Object.freeze({ identity, clauses: Object.freeze(clauses) });
export const Z_IMAGE_UPPER_SCENE_SOURCES = Object.freeze({
  'locations:生活感室內-indoor-lifestyle:室內-精品飯店房間:0': authored(
    'boutique hotel room', ["an upper curtain track","the wall-to-ceiling junction"]),
  'locations:生活感室內-indoor-lifestyle:室內-現代高樓公寓客廳:1': authored(
    'modern high-rise apartment living room', ["the upper window frame","an adjacent ceiling edge"]),
  'locations:生活感室內-indoor-lifestyle:室內-臥室窗邊:6': authored(
    'bedroom window area', ["the curtain rail and top of the window frame"]),
  'locations:生活感室內-indoor-lifestyle:室內-更衣室-試衣間:10': authored(
    'fitting room interior', ["the curtain track overhead"]),
  'locations:生活感室內-indoor-lifestyle:室內-電梯內:11': authored(
    'elevator interior', ["the top of the elevator doors","the cabin ceiling edge"]),
  'locations:生活感室內-indoor-lifestyle:室內-木造圖書館閱讀桌旁:13': authored(
    'historic library reading table', ["the upper tiers of nearby wooden bookshelves"]),
  'locations:生活感室內-indoor-lifestyle:室內-木造圖書館書車旁:15': authored(
    'historic library book cart', ["the upper tiers of nearby wooden bookshelves"]),
  'locations:生活感室內-indoor-lifestyle:室內-木造圖書館借書台前:16': authored(
    'historic library check-out desk', ["the upper tiers of nearby wooden bookshelves"]),
  'locations:生活感室內-indoor-lifestyle:戶外-日本住宅外樓梯間:33': authored(
    'narrow exterior metal stairway on a Japanese apartment building', ["the underside of the landing above","steel supports"]),
  'locations:地下與廢墟風格-abandoned-underground:室內-廢棄水泥工廠生鏽控制室:1': authored(
    'rusted cement factory control room', ["cable bundles along the wall-to-ceiling junction"]),
  'locations:地下與廢墟風格-abandoned-underground:室內-廢棄水泥工廠機具堆放區:3': authored(
    'abandoned machinery storage corner', ["steel beams overhead"]),
  'locations:地下與廢墟風格-abandoned-underground:室內-地下排洪道積水牆角:4': authored(
    'flood-tunnel pooled-water corner', ["the concrete ceiling meeting the stained wall"]),
  'locations:自然與戶外-nature-outdoors:戶外-霧感森林步道:6': authored(
    'forest path edge', ["overlapping branches and foliage overhead"]),
  'locations:自然與戶外-nature-outdoors:戶外-森林營地帳篷營火:7': authored(
    'forest campsite clearing', ["branches and foliage above the tree trunks"]),
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
