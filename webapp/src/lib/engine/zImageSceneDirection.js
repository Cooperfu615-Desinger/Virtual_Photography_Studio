// Z-only, post-crop source reduction. These are reviewed source clauses, NOT
// keyword guesses over final prompts. Unknown/imported prose stays unchanged.
// Keep this separate from the database and shared canonical scene/pose model.
export const Z_IMAGE_SCENE_DIRECTION_VERSION = '1.0.0';
export const LOW_CAMERA_LABELS = Object.freeze([
  '腰部高度鏡頭', '膝蓋高度鏡頭', '地面高度鏡頭', '蟲眼視角鏡頭',
]);
export const DOWNWARD_CAMERA_LABELS = Object.freeze([
  '高位俯視鏡頭', '鳥瞰視角', '正上方俯視鏡頭',
]);

// Exact comma-delimited catalog fragments. Identity (first location clause)
// is protected by the caller even if it names a ground-led place.
const GROUND_DETAILS = Object.freeze([
  'carpet or wood floor', 'checker or tiled floor', 'worn floor surface',
  'worn carpet', 'wood floor', 'tiled or stone floor', 'worn wood floor',
  'taped floor marks', 'tatami flooring', 'floor cushion', 'woven mat texture',
  'tiled floor', 'tiled floor detail', 'tiled floor edge', 'open-grate steps',
  'stacked landings', 'quiet curbside asphalt', 'clean paving', 'curbside detail',
  'commuter path fragment offset to one side', 'raised wooden deck edge',
  'stone step', 'garden greenery below', 'asymmetric threshold composition',
  'marble or carpeted floor', 'side aisle edge', 'gravel piles', 'cement dust on the floor',
  'dusty concrete floor', 'shallow water on the floor', 'dark drainage channel edge',
  'wet concrete floor', 'grated drain channel', 'damp concrete threshold',
  'grated floor panel', 'cracked floor tiles', 'worn floor tiles', 'cracked tile floor',
  'dusty schoolroom floor', 'dust on the wooden floor', 'chipped floor tiles',
  'stacked gym mats', 'dusty floor', 'concrete floor', 'dusty wooden floor',
  'wall-side debris', 'stopped escalator steps', 'dusty floor tiles',
  'broken glass on the floor', 'cracked tile walkway', 'tile floor reflections',
  'floor debris around the desk', 'cracked pavement textures',
  'weeds pushing through concrete', 'uneven outdoor ground', 'gravel track bed',
  'rail switch hardware', 'weeds along the rails', 'construction debris',
  'concrete floor edge', 'scattered dust', 'concrete lip', 'scattered rebar', 'floor dust',
  'loose fasteners on the floor', 'platform edge markings', 'warning strip',
  'floor edge markings', 'broad pedestrian paving', 'curb and railing fragments',
  'recognizable public-plaza ground plane without focusing on a single monument',
  'modest stone pedestal', 'station-front plaza paving', 'canal water visible below',
  'sidewalk edge near the bridge', 'tiled pavement', 'entrance threshold',
  'stone floor', 'column base', 'wall-side walkway', 'clipped grass border',
  'stone curb', 'walkway edge', 'curbside paving', 'broad boulevard curb',
  'asphalt edge', 'glossy pavement patches', 'pavement texture', 'curbside standing space',
  'reflective pavement patches', 'curb detail', 'glossy ground texture', 'narrow threshold',
  'shop threshold', 'display-window base', 'glossy ground patches', 'curb edge',
  'storefront base detail', 'pavement edge', 'pavement curb', 'stone steps',
  'doorway threshold', 'sidewalk edge', 'cobblestone ground', 'wall base',
  'cafe threshold', 'cobblestone pavement', 'worn step', 'weathered dock planks',
  'timber pier decking', 'wet stone deck', 'swimming pool edge', 'broad river below',
  'thin transparent receding wave line across wet sand', 'clean waterline',
  'open seaside ground plane', 'smooth beach surface', 'uneven lawn texture',
  'low shrubs', 'ground-level natural surface', 'low meadow grasses and wild plants',
  'soil path fragment on one side', 'uneven ground', 'mossy roots', 'leaf litter',
  'partial trail curve', 'campfire pit', 'leaf-litter ground', 'weathered planks',
  'calm water surface beside the deck', 'reeds or shoreline plants on one side',
  'natural bank detail', 'wind-shaped sand ripples', 'uneven dune ridge',
  'sparse dry grass tufts', 'open sandy ground plane', 'off-center crest line',
  'cracked salt crust ground', 'pale polygon surface texture', 'open dry basin',
  'dense green lawn texture', 'short grass blades', 'simple natural surface filling the frame',
  'near-ground scene base', 'woven mat texture filling the floor', 'low domestic detail',
  'small personal items near a corner', 'tatami seam geometry', 'visible grass blade texture',
  'tree roots breaking through the grass', 'tree trunk base near one side',
  'natural ground scene base', 'clean fine sand surface', 'shallow clear seawater at the edge',
  'thin transparent wave line across wet sand', 'calm shoreline scene base',
  'wet surfaces', 'freshly damp surfaces', 'reflective snowy distance',
]);

export const GROUND_SOURCE_REDUCTIONS = Object.freeze({
  ...Object.fromEntries(GROUND_DETAILS.map((source) => [source, ''])),
  'mirrored floor and mirrored ceiling': 'mirrored ceiling',
  'curb and railing fragments': 'railing fragments',
  'balcony floor edge and wall corner': 'wall corner',
  'narrow curb and doorway edges': 'doorway edges',
  'sidewalk and park trees outside': 'park trees outside',
  'reflective stone and wall textures': 'reflective wall textures',
  'bed edge desk corner crt tv setup vinyl-record wall poster cluster window area or floor rug':
    'bed edge desk corner CRT TV setup vinyl-record wall poster cluster window area',
  'seamless desaturated blue-grey floor and backdrop': 'seamless desaturated blue-grey backdrop',
  ...Object.fromEntries([
    ['white', 'solid white void'], ['black', 'solid black void'],
    ['neutral-grey', 'solid grey void'], ['vivid blue', 'solid blue void'],
    ['vivid orange', 'solid orange void'], ['vivid red', 'solid red void'],
    ['vivid yellow', 'solid yellow void'], ['vivid purple', 'solid purple void'],
    ['vivid green', 'solid green void'], ['saturated', 'solid graphic color void'],
  ].map(([color, voidText]) => [
    `continuous ${color} ground-and-background plane blending into a ${voidText}`,
    `continuous ${color} background blending into a ${voidText}`,
  ])),
  'continuous gradient ground-and-background plane with no visible boundary':
    'continuous gradient background with no visible boundary',
});

const SKY_DETAILS = Object.freeze([
  'bright daytime sky', 'saturated azure sky', 'brilliant white cloud shapes',
  'towering luminous white cumulus clouds', 'crisp cloud-edge detail',
  'layered dark storm clouds', 'dense gray-black cloud mass', 'low cloud ceiling',
  'preserved cloud detail before rainfall', 'overhead summer sun position',
  'glaring bright sky', 'cloud-covered sky', 'neutral grey-white sky cover',
  'pale cool sky', 'early golden morning sky', 'soft warm horizon glow',
  'warm orange-pink sky gradient', 'low sun near the horizon', 'deep blue dusk sky',
  'dark blue-black sky if visible', 'natural blue-black night sky', 'dark night sky',
  'heavy dark cloud cover', 'dense low cloud ceiling', 'grey-blue rain sky',
  'leftover cloud cover', 'cold pale sky', 'pale grey sky',
  'daytime exterior sky if visible', 'muted exterior sky if visible',
  'flat horizon line', 'expansive open sky', 'wide blue-sky desert horizon',
]);

export const SKY_SOURCE_REDUCTIONS = Object.freeze({
  ...Object.fromEntries(SKY_DETAILS.map((source) => [source, ''])),
  // Preserve existing time/season/tonality when a first source clause mixes
  // that condition with visible sky. "Atmosphere" is connective, not new light.
  'clear blue-sky daylight': 'clear daylight',
  'deep azure summer sky': 'deep azure summer atmosphere',
  'charcoal-gray pre-rain sky': 'charcoal-gray pre-rain atmosphere',
  'sky and treetop fragments outside': 'treetop fragments outside',
});

export function projectZImageDirectionalSource(value, angle, { preserveIdentity = false } = {}) {
  const source = String(value || '').trim();
  const low = LOW_CAMERA_LABELS.includes(angle?.zh);
  const downward = DOWNWARD_CAMERA_LABELS.includes(angle?.zh);
  if (!source || (!low && !downward)) return source;
  const reductions = low ? GROUND_SOURCE_REDUCTIONS : SKY_SOURCE_REDUCTIONS;
  return source.replace(/[.!?]+$/, '').split(/\s*,\s*/).map((clause, index) => {
    const clean = clause.trim();
    if (preserveIdentity && index === 0) return clean;
    const key = clean.toLowerCase();
    return Object.hasOwn(reductions, key) ? reductions[key] : clean;
  }).filter(Boolean).join(', ');
}
