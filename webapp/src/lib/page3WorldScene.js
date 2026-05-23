import { SPECIAL_SCENE_LOCATIONS, WORLD_SCENE_LOCATIONS } from '../data/page3WorldScenes.js';
import { buildPhotographyStylePrompt, getPhotographyStyleOptions } from './engine.js';

const UNSPECIFIED_OPTION = { id: '', zh: '未指定', en: '' };
const NONE_OPTION = { id: 'none', zh: '全無', en: '', meta: { tags: ['none'] } };

const SCENE_MODE_OPTIONS = [
  UNSPECIFIED_OPTION,
  NONE_OPTION,
  {
    id: 'street-only',
    zh: '街拍：單純場景',
    en: 'documentary street photograph',
    anchor: 'street-only documentary scene',
    photoType: 'This is a documentary street photography work',
    photographer: 'It is made by a photographer who is good at catching unscripted city moments from ordinary pedestrian distance',
    cinematicPhotoType: 'This is a cinematic documentary street photograph',
    worldPhotoType: 'This is a street-level urban environment photograph',
    positionKey: 'streetPositions',
    modeNotes: ['incidental pedestrians and traffic may appear only as traces of street life', 'no deliberate portrait subject', 'avoid a postcard-like establishing shot or complete landmark panorama'],
  },
  {
    id: 'cityscape',
    zh: '空景城市攝影',
    en: 'realistic city and landmark photography',
    anchor: 'clean cityscape scene',
    photoType: 'This is a realistic city photography work',
    photographer: 'It is made by a travel and architecture photographer observing the city as a lived place rather than a generic skyline',
    cinematicPhotoType: 'This is a cinematic city photography still',
    worldPhotoType: 'This is a grounded city-world environment photograph',
    positionKey: 'cityscapePositions',
    modeNotes: ['city, architecture, street, or landmark is the subject', 'no deliberate human subject', 'keep the place specific instead of turning it into a generic city view'],
  },
  {
    id: 'aerial-high-view',
    zh: '空拍 / 高視角地景',
    en: 'drone-like elevated cityscape',
    anchor: 'elevated high-view city scene',
    photoType: 'This is an aerial or high-view cityscape photograph',
    photographer: 'It is made from a drone or grounded overlook by a photographer focused on spatial layout and city geography',
    cinematicPhotoType: 'This is an elevated cinematic cityscape photograph',
    worldPhotoType: 'This is a high-view spatial geography photograph',
    positionKey: 'aerialPositions',
    modeNotes: ['spatial layout and geography are dominant', 'bridges, roads, waterways, rooftops, and skyline relationships visible', 'use a grounded overlook when that is more realistic than a true drone view'],
  },
];

const CAMERA_SYSTEM_OPTIONS = [
  UNSPECIFIED_OPTION,
  NONE_OPTION,
  { id: 'leica-m', zh: 'Leica M 街拍旁軸', en: 'Leica M street rangefinder camera' },
  { id: 'ricoh-gr', zh: 'Ricoh GR 隨身街拍機', en: 'Ricoh GR compact street camera' },
  { id: 'fujifilm-x100', zh: 'Fujifilm X100 系列', en: 'Fujifilm X100 series camera' },
  { id: 'sony-full-frame', zh: 'Sony 全片幅無反', en: 'Sony full-frame mirrorless camera' },
  { id: 'canon-nikon-dslr', zh: 'Canon / Nikon DSLR 編輯攝影', en: 'Canon or Nikon DSLR editorial camera' },
  { id: 'medium-format', zh: '中片幅數位相機', en: 'medium-format digital camera' },
  { id: 'drone-camera', zh: '空拍機相機', en: 'drone camera' },
  { id: 'smartphone-doc', zh: '手機紀實攝影', en: 'smartphone documentary camera' },
];

const FOCAL_VIEWPOINT_OPTIONS = [
  UNSPECIFIED_OPTION,
  NONE_OPTION,
  { id: '24mm-wide', zh: '24mm 廣角街景', en: '24mm wide street view at human eye level, close enough to feel inside the street' },
  { id: '28mm-documentary', zh: '28mm 紀實街拍', en: '28mm documentary street view at pedestrian height' },
  { id: '35mm-classic', zh: '35mm 經典街拍', en: '35mm classic street photography view from a passerby perspective' },
  { id: '50mm-natural', zh: '50mm 自然視角', en: '50mm natural perspective with casual human-scale distance' },
  { id: '85mm-compressed', zh: '85mm 壓縮街景細節', en: '85mm compressed street detail, isolating a fragment of the place instead of the whole skyline' },
  { id: '135mm-telephoto', zh: '135mm 遠攝壓縮', en: '135mm telephoto compression focused on layered urban details' },
  { id: 'elevated-wide', zh: '高處廣角城市視角', en: 'elevated wide city view from a building, bridge, or overlook' },
  { id: 'drone-overhead', zh: '空拍俯視視角', en: 'drone-like overhead view looking down at the spatial layout' },
];

const SHOOTING_METHOD_OPTIONS = [
  UNSPECIFIED_OPTION,
  NONE_OPTION,
  { id: 'walk-by-snapshot', zh: '邊走邊拍快照', en: 'shot while walking, slightly imperfect and spontaneous, with a casual snapshot rhythm' },
  { id: 'slight-hand-shake', zh: '輕微手震', en: 'shot with subtle hand shake, tiny motion blur, and imperfect handheld timing' },
  { id: 'overexposed-phone', zh: '手機些微過曝', en: 'shot with a phone-like slightly overexposed look, clipped highlights, and quick automatic exposure' },
  { id: 'through-window', zh: '隔窗拍攝', en: 'shot through glass with reflections, glare, and layered interior-exterior depth' },
  { id: 'direct-flash', zh: '直閃快照', en: 'shot with direct flash, hard highlights, and raw street snapshot energy' },
  { id: 'quiet-tripod', zh: '安靜穩定構圖', en: 'shot with a steady composed camera, controlled framing, and quiet observational timing' },
  { id: 'drone-survey', zh: '空拍巡航', en: 'shot from a drone in a slow survey pass, keeping the geography readable' },
];

const IMAGING_STYLE_OPTIONS = [
  UNSPECIFIED_OPTION,
  NONE_OPTION,
  { id: 'documentary-street', zh: '寫實紀實街拍', en: 'realistic documentary street photography' },
  { id: 'travel-editorial', zh: '旅遊編輯攝影', en: 'travel editorial photography' },
  { id: 'japanese-photobook', zh: '日系寫真書街景', en: 'Japanese photobook street realism' },
  { id: 'cinematic-city-still', zh: '電影城市劇照', en: 'cinematic city still' },
  { id: 'commercial-cityscape', zh: '高解析商業城市攝影', en: 'high-resolution commercial cityscape' },
  { id: 'snapshot-flash', zh: '直閃街拍快照', en: 'snapshot flash street photography' },
  { id: 'color-negative-film', zh: '彩色負片顆粒', en: 'color negative film grain' },
  { id: 'clean-digital', zh: '乾淨數位寫實', en: 'clean digital realism' },
];

const AMBIENT_LIGHT_OPTIONS = [
  UNSPECIFIED_OPTION,
  NONE_OPTION,
  { id: 'overcast-daylight', zh: '陰天自然光', en: 'overcast daylight' },
  { id: 'clear-morning', zh: '晴朗早晨日光', en: 'clear morning daylight' },
  { id: 'harsh-midday', zh: '正午硬光', en: 'harsh midday sun' },
  { id: 'golden-hour', zh: '黃金時刻側光', en: 'golden hour side light' },
  { id: 'blue-hour-city-glow', zh: '藍調城市光', en: 'blue hour city glow' },
  { id: 'humid-night-reflections', zh: '潮濕夜景反光', en: 'humid night reflections' },
  { id: 'neon-mixed-light', zh: '霓虹混合光', en: 'neon mixed light' },
  { id: 'rainy-reflections', zh: '雨中街面反光', en: 'rainy street reflections' },
  { id: 'soft-winter-daylight', zh: '冬季柔和日光', en: 'soft winter daylight' },
  { id: 'hazy-summer-heat', zh: '夏季霧熱空氣', en: 'hazy summer heat' },
];

const SCENE_FOCUS_OPTIONS = [
  UNSPECIFIED_OPTION,
  NONE_OPTION,
  {
    id: 'free-framing',
    zh: '自由取景',
    en: 'Within the chosen place, the composition may naturally choose one believable focus: a street corner, storefront entrance, window reflection, sign fragment, wet pavement, narrow slice of sky, alley depth, wall texture, or sidewalk detail.',
  },
  {
    id: 'signs-storefronts',
    zh: '招牌與店面',
    en: 'Let signs, storefronts, doorways, menus, awnings, and shop lights become the main visual focus without needing to show the whole landmark.',
  },
  {
    id: 'windows-reflections',
    zh: '櫥窗與反光',
    en: 'Focus on window glass, display reflections, interior light leaking outward, layered reflections, and partial street fragments.',
  },
  {
    id: 'alley-corner-depth',
    zh: '街角與巷弄深處',
    en: 'Focus on a corner, alley mouth, receding narrow passage, side street depth, stacked signs, and compressed pedestrian-scale space.',
  },
  {
    id: 'ground-rain-texture',
    zh: '路面與濕地反光',
    en: 'Focus on pavement texture, rain reflections, curb edges, road markings, puddles, and light reflected from the ground.',
  },
  {
    id: 'sky-building-slice',
    zh: '天空縫隙與建築切片',
    en: 'Focus on the slice of sky between buildings, cropped facades, utility lines, balconies, and vertical urban layers.',
  },
  {
    id: 'landmark-fragment',
    zh: '地標局部',
    en: 'Focus on a recognizable fragment of the landmark or district rather than a complete frontal postcard view.',
  },
];

const PHOTOGRAPHER_STYLE_OPTIONS = [
  UNSPECIFIED_OPTION,
  ...getPhotographyStyleOptions(),
];

export const PAGE3_WORLD_SCENE_FIELD_CONFIG = [
  { key: 'sceneMode', label: '場景模式' },
  { key: 'photographerStyle', label: '攝影師風格' },
  { key: 'cameraSystem', label: '相機系統' },
  { key: 'shootingMethod', label: '拍攝手法' },
  { key: 'focalViewpoint', label: '焦段 / 視角' },
  { key: 'worldLocation', label: '世界地點' },
  { key: 'specialLocation', label: '特殊地點' },
  { key: 'sceneFocus', label: '場景取景方式' },
  { key: 'imagingStyle', label: '成像風格' },
  { key: 'ambientLight', label: '環境光氛' },
];

export const PAGE3_WORLD_SCENE_FIELD_OPTIONS = {
  sceneMode: SCENE_MODE_OPTIONS,
  photographerStyle: PHOTOGRAPHER_STYLE_OPTIONS,
  worldLocation: [
    UNSPECIFIED_OPTION,
    NONE_OPTION,
    ...WORLD_SCENE_LOCATIONS.map((location) => ({
      id: location.id,
      zh: location.labelZh,
      en: `${location.city}, ${location.district}, ${location.locationName}`,
    })),
  ],
  specialLocation: [
    UNSPECIFIED_OPTION,
    NONE_OPTION,
    ...SPECIAL_SCENE_LOCATIONS.map((location) => ({
      id: location.id,
      zh: location.labelZh,
      en: `${location.district}, ${location.locationName}`,
    })),
  ],
  cameraSystem: CAMERA_SYSTEM_OPTIONS,
  shootingMethod: SHOOTING_METHOD_OPTIONS,
  focalViewpoint: FOCAL_VIEWPOINT_OPTIONS,
  sceneFocus: SCENE_FOCUS_OPTIONS,
  imagingStyle: IMAGING_STYLE_OPTIONS,
  ambientLight: AMBIENT_LIGHT_OPTIONS,
};

export { SPECIAL_SCENE_LOCATIONS, WORLD_SCENE_LOCATIONS };

export function createEmptyPage3WorldSceneProfile() {
  return Object.fromEntries(PAGE3_WORLD_SCENE_FIELD_CONFIG.map((field) => [field.key, '']));
}

function findOption(options, id) {
  return options.find((option) => option.id === id) || options[0] || null;
}

function isNoneOption(option) {
  return option?.id === 'none' || option?.id === 'style-none' || option?.zh === '全無' || option?.en === 'none';
}

function findWorldLocation(id) {
  return WORLD_SCENE_LOCATIONS.find((location) => location.id === id) || null;
}

function findSpecialLocation(id) {
  return SPECIAL_SCENE_LOCATIONS.find((location) => location.id === id) || null;
}

function getSelectedLocation(profile = {}) {
  return findSpecialLocation(profile.specialLocation) || findWorldLocation(profile.worldLocation);
}

function getProfileParts(profile = {}) {
  const mode = findOption(SCENE_MODE_OPTIONS, profile.sceneMode);
  const photographerStyle = findOption(PHOTOGRAPHER_STYLE_OPTIONS, profile.photographerStyle);
  const location = getSelectedLocation(profile);
  const cameraSystem = findOption(CAMERA_SYSTEM_OPTIONS, profile.cameraSystem);
  const shootingMethod = findOption(SHOOTING_METHOD_OPTIONS, profile.shootingMethod);
  const focalViewpoint = findOption(FOCAL_VIEWPOINT_OPTIONS, profile.focalViewpoint);
  const sceneFocus = findOption(SCENE_FOCUS_OPTIONS, profile.sceneFocus);
  const imagingStyle = findOption(IMAGING_STYLE_OPTIONS, profile.imagingStyle);
  const ambientLight = findOption(AMBIENT_LIGHT_OPTIONS, profile.ambientLight);

  return {
    mode,
    photographerStyle,
    location,
    cameraSystem,
    shootingMethod,
    focalViewpoint,
    sceneFocus,
    imagingStyle,
    ambientLight,
  };
}

function cleanJoin(parts) {
  return parts
    .flat()
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ');
}

function pickPosition(location, mode) {
  if (!location || !mode?.positionKey) return '';
  return location[mode.positionKey]?.[0] || '';
}

function formatLocationTitle(location) {
  if (!location) return '';
  if (location.generic) return location.locationName;
  return `${location.locationName} in ${location.city}, ${location.country}`;
}

function formatAnchorLocation(location) {
  if (!location) return '';
  if (location.generic) return `${location.district}, ${location.locationName}`;
  return `${location.city}, ${location.district}, ${location.locationName}`;
}

function formatLocationPhrase(location) {
  if (!location) return '';
  if (location.generic) {
    return `The scene is set in a non-specific photographic location: ${location.locationName}, using ${location.district} as the environment type`;
  }
  return `The scene is set around ${formatLocationTitle(location)}, within the ${location.district} district context`;
}

function sentenceJoin(parts) {
  return parts
    .flat()
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .map((part) => (/[.!?]$/.test(part) ? part : `${part}.`))
    .join(' ');
}

function getCameraPhrase(cameraSystem) {
  const camera = cameraSystem?.en || '';
  if (camera) return `The photographer uses a ${camera}`;
  return '';
}

function getPhotographerStylePhrase(photographerStyle) {
  const stylePrompt = buildPhotographyStylePrompt(photographerStyle);
  if (!stylePrompt) return '';
  return `The photographer's visual language follows ${stylePrompt}, shaping the light behavior, framing rhythm, color contrast, texture, subject distance, and image atmosphere`;
}

export function buildPage3WorldSceneSummary(profile = {}) {
  const { mode, photographerStyle, location, cameraSystem, shootingMethod, focalViewpoint, sceneFocus, imagingStyle, ambientLight } = getProfileParts(profile);
  return [
    mode?.zh,
    photographerStyle?.zh,
    cameraSystem?.zh,
    shootingMethod?.zh,
    focalViewpoint?.zh,
    location?.labelZh,
    sceneFocus?.zh,
    imagingStyle?.zh,
    ambientLight?.zh,
  ].filter(Boolean).join(' / ');
}

export function buildPage3WorldSceneAnchor(profile = {}) {
  const { mode, location } = getProfileParts(profile);
  const hasMode = Boolean(mode?.id && !isNoneOption(mode));
  if (!hasMode && !location) return '';

  return cleanJoin([
    hasMode ? mode?.anchor : '',
    formatAnchorLocation(location),
    location?.landmarkCues?.slice(0, 3),
  ]);
}

function buildWorldScenePrompt(profile = {}, { variant = 'scene' } = {}) {
  const { mode, photographerStyle, location, cameraSystem, shootingMethod, focalViewpoint, sceneFocus, imagingStyle, ambientLight } = getProfileParts(profile);
  const hasMode = Boolean(mode?.id && !isNoneOption(mode));
  const photographerStylePhrase = getPhotographerStylePhrase(photographerStyle);
  if (!hasMode && !location && !photographerStylePhrase) return '';

  const isSpecialRuinLocation = Boolean(location?.id?.startsWith('special-ruins-'));
  const leadKey = variant === 'cinematic' ? 'cinematicPhotoType' : variant === 'world' ? 'worldPhotoType' : 'photoType';
  const lead = hasMode ? (mode?.[leadKey] || mode?.photoType) : 'This is a realistic location photograph';
  const position = pickPosition(location, mode);
  const cameraPhrase = getCameraPhrase(cameraSystem);
  const shootingPhrase = shootingMethod?.en ? `The shooting method is ${shootingMethod.en}` : '';
  const focalPhrase = focalViewpoint?.en ? `The viewpoint is ${focalViewpoint.en}` : '';
  const locationPhrase = formatLocationPhrase(location);
  const landmarkPhrase = location?.landmarkCues?.length
    ? `Keep the local cues believable: ${location.landmarkCues.join(', ')}`
    : '';
  const positionPhrase = position ? `Use this as a possible spatial direction: ${position}` : '';
  const focusPhrase = sceneFocus?.en
    || (mode?.id === 'street-only'
      ? 'Within the chosen place, the composition may choose a small believable street detail instead of showing the whole landmark.'
      : '');
  const stylePhrase = cleanJoin([imagingStyle?.en, ambientLight?.en]);
  const worldVariantNotes = variant === 'world'
    ? 'Keep internally coherent urban geography, real-place environmental logic, and street-scale cultural texture'
    : '';
  const cinematicVariantNotes = variant === 'cinematic'
    ? 'Use cinematic spatial depth, strong atmospheric composition, and layered foreground-middle-background structure'
    : '';
  const modeNotes = isSpecialRuinLocation
    ? mode?.modeNotes?.filter((note) => !/pedestrians|traffic/i.test(note))
    : (hasMode ? mode?.modeNotes : null);

  return sentenceJoin([
    lead,
    hasMode ? mode?.photographer : '',
    photographerStylePhrase,
    cameraPhrase,
    shootingPhrase,
    focalPhrase,
    stylePhrase ? `The image rendering has ${stylePhrase}` : '',
    locationPhrase,
    focusPhrase,
    landmarkPhrase,
    positionPhrase,
    modeNotes?.join(', '),
    cinematicVariantNotes,
    worldVariantNotes,
    location?.realismGuards?.join(', '),
  ]);
}

export function buildPage3WorldScenePrompt(profile = {}) {
  return buildWorldScenePrompt(profile, { variant: 'scene' });
}

export function buildPage3WorldSceneCinematicPrompt(profile = {}) {
  return buildWorldScenePrompt(profile, { variant: 'cinematic' });
}

export function buildPage3WorldSceneWorldPrompt(profile = {}) {
  return buildWorldScenePrompt(profile, { variant: 'world' });
}
