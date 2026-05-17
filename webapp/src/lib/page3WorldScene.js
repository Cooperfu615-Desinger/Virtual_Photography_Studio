import { WORLD_SCENE_LOCATIONS } from '../data/page3WorldScenes.js';

const SCENE_MODE_OPTIONS = [
  { id: '', zh: '未指定', en: '' },
  {
    id: 'street-only',
    zh: '街拍：單純場景',
    en: 'documentary street photograph',
    anchor: 'street-only documentary scene',
    promptLead: 'documentary street photograph of',
    cinematicLead: 'cinematic documentary street scene of',
    worldLead: 'street-level urban environment study of',
    positionKey: 'streetPositions',
    modeNotes: ['incidental pedestrians and traffic allowed as street life', 'no deliberate portrait subject', 'storefront clutter, road texture, signs, and public movement visible'],
  },
  {
    id: 'cityscape',
    zh: '空景城市攝影',
    en: 'realistic city and landmark photography',
    anchor: 'clean cityscape scene',
    promptLead: 'realistic travel editorial photograph of',
    cinematicLead: 'cinematic city establishing shot of',
    worldLead: 'grounded city-world environment study of',
    positionKey: 'cityscapePositions',
    modeNotes: ['city, architecture, street, or landmark is the subject', 'no deliberate human subject', 'composed travel-photography realism'],
  },
  {
    id: 'aerial-high-view',
    zh: '空拍 / 高視角地景',
    en: 'drone-like elevated cityscape',
    anchor: 'elevated high-view city scene',
    promptLead: 'drone-like elevated cityscape over',
    cinematicLead: 'ultra wide elevated cinematic cityscape over',
    worldLead: 'high-view spatial geography study of',
    positionKey: 'aerialPositions',
    modeNotes: ['spatial layout and geography are dominant', 'bridges, roads, waterways, rooftops, and skyline relationships visible', 'use a grounded overlook when that is more realistic than a true drone view'],
  },
];

const CAMERA_SYSTEM_OPTIONS = [
  { id: '', zh: '未指定', en: '' },
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
  { id: '', zh: '未指定', en: '' },
  { id: '24mm-wide', zh: '24mm 廣角街景', en: '24mm wide street view' },
  { id: '28mm-documentary', zh: '28mm 紀實街拍', en: '28mm documentary street view' },
  { id: '35mm-classic', zh: '35mm 經典街拍', en: '35mm classic street photography view' },
  { id: '50mm-natural', zh: '50mm 自然視角', en: '50mm natural perspective' },
  { id: '85mm-compressed', zh: '85mm 壓縮街景細節', en: '85mm compressed street detail' },
  { id: '135mm-telephoto', zh: '135mm 遠攝壓縮', en: '135mm telephoto compression' },
  { id: 'elevated-wide', zh: '高處廣角城市視角', en: 'elevated wide city view' },
  { id: 'drone-overhead', zh: '空拍俯視視角', en: 'drone-like overhead view' },
];

const IMAGING_STYLE_OPTIONS = [
  { id: '', zh: '未指定', en: '' },
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
  { id: '', zh: '未指定', en: '' },
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

export const PAGE3_WORLD_SCENE_FIELD_CONFIG = [
  { key: 'sceneMode', label: '場景模式' },
  { key: 'worldLocation', label: '世界地點' },
  { key: 'cameraSystem', label: '相機系統' },
  { key: 'focalViewpoint', label: '焦段 / 視角' },
  { key: 'imagingStyle', label: '成像風格' },
  { key: 'ambientLight', label: '環境光氛' },
];

export const PAGE3_WORLD_SCENE_FIELD_OPTIONS = {
  sceneMode: SCENE_MODE_OPTIONS,
  worldLocation: [
    { id: '', zh: '未指定', en: '' },
    ...WORLD_SCENE_LOCATIONS.map((location) => ({
      id: location.id,
      zh: location.labelZh,
      en: `${location.city}, ${location.district}, ${location.locationName}`,
    })),
  ],
  cameraSystem: CAMERA_SYSTEM_OPTIONS,
  focalViewpoint: FOCAL_VIEWPOINT_OPTIONS,
  imagingStyle: IMAGING_STYLE_OPTIONS,
  ambientLight: AMBIENT_LIGHT_OPTIONS,
};

export { WORLD_SCENE_LOCATIONS };

export function createEmptyPage3WorldSceneProfile() {
  return Object.fromEntries(PAGE3_WORLD_SCENE_FIELD_CONFIG.map((field) => [field.key, '']));
}

function findOption(options, id) {
  return options.find((option) => option.id === id) || options[0] || null;
}

function findLocation(id) {
  return WORLD_SCENE_LOCATIONS.find((location) => location.id === id) || null;
}

function getProfileParts(profile = {}) {
  const mode = findOption(SCENE_MODE_OPTIONS, profile.sceneMode);
  const location = findLocation(profile.worldLocation);
  const cameraSystem = findOption(CAMERA_SYSTEM_OPTIONS, profile.cameraSystem);
  const focalViewpoint = findOption(FOCAL_VIEWPOINT_OPTIONS, profile.focalViewpoint);
  const imagingStyle = findOption(IMAGING_STYLE_OPTIONS, profile.imagingStyle);
  const ambientLight = findOption(AMBIENT_LIGHT_OPTIONS, profile.ambientLight);

  return {
    mode,
    location,
    cameraSystem,
    focalViewpoint,
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
  return `${location.locationName} in ${location.city}, ${location.country}`;
}

function getCameraPhrase(cameraSystem, focalViewpoint) {
  const camera = cameraSystem?.en || '';
  const focal = focalViewpoint?.en || '';
  if (camera && focal) return `shot on a ${camera} with a ${focal}`;
  if (camera) return `shot on a ${camera}`;
  if (focal) return focal;
  return '';
}

export function buildPage3WorldSceneSummary(profile = {}) {
  const { mode, location, cameraSystem, focalViewpoint, imagingStyle, ambientLight } = getProfileParts(profile);
  return [
    mode?.zh,
    location?.labelZh,
    cameraSystem?.zh,
    focalViewpoint?.zh,
    imagingStyle?.zh,
    ambientLight?.zh,
  ].filter(Boolean).join(' / ');
}

export function buildPage3WorldSceneAnchor(profile = {}) {
  const { mode, location } = getProfileParts(profile);
  if (!mode?.id && !location) return '';

  return cleanJoin([
    mode?.anchor,
    location ? `${location.city}, ${location.district}, ${location.locationName}` : '',
    location?.landmarkCues?.slice(0, 3),
  ]);
}

function buildWorldScenePrompt(profile = {}, { variant = 'scene' } = {}) {
  const { mode, location, cameraSystem, focalViewpoint, imagingStyle, ambientLight } = getProfileParts(profile);
  if (!mode?.id && !location) return '';

  const leadKey = variant === 'cinematic' ? 'cinematicLead' : variant === 'world' ? 'worldLead' : 'promptLead';
  const lead = mode?.[leadKey] || mode?.promptLead || 'realistic location photograph of';
  const locationTitle = formatLocationTitle(location);
  const position = pickPosition(location, mode);
  const cameraPhrase = getCameraPhrase(cameraSystem, focalViewpoint);
  const worldVariantNotes = variant === 'world'
    ? ['internally coherent urban geography', 'real-place environmental logic', 'street-scale cultural texture']
    : [];
  const cinematicVariantNotes = variant === 'cinematic'
    ? ['cinematic spatial depth', 'strong atmospheric composition', 'layered foreground-middle-background structure']
    : [];

  return cleanJoin([
    locationTitle ? `${lead} ${locationTitle}` : lead,
    location ? `${location.district} district context` : '',
    location?.landmarkCues,
    position,
    mode?.modeNotes,
    cameraPhrase,
    imagingStyle?.en,
    ambientLight?.en,
    cinematicVariantNotes,
    worldVariantNotes,
    location?.realismGuards,
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
