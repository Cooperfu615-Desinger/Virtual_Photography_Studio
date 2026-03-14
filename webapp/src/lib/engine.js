import database from '../data/database.json' with { type: 'json' };

const SUBJECT_COUNT_OPTIONS = [
  { id: '1', zh: '1 位', en: 'a seductive stunning Japanese or Korean woman', count: 1 },
  { id: '2', zh: '2 位', en: 'two seductive stunning Japanese or Korean women', count: 2 },
];

const ASPECT_RATIO_OPTIONS = [
  { id: '1:1', zh: '1:1', en: '1:1' },
  { id: '3:4', zh: '3:4', en: '3:4' },
  { id: '4:5', zh: '4:5', en: '4:5' },
  { id: '2:3', zh: '2:3', en: '2:3' },
  { id: '9:16', zh: '9:16', en: '9:16' },
  { id: '16:9', zh: '16:9', en: '16:9' },
];

const DUO_INTERACTION_OPTIONS = [
  {
    id: 'natural',
    zh: '互動自然',
    en: 'natural interaction, relaxed shared presence, candid chemistry, effortless duo connection',
  },
  {
    id: 'intimate',
    zh: '互動親密',
    en: 'intimate interaction, close body language, emotional closeness, warm romantic chemistry',
  },
  {
    id: 'independent',
    zh: '各自為立',
    en: 'independent presence, minimal interaction, distinct personal space, separate confident attitudes',
  },
];

const DUO_STYLING_OPTIONS = [
  {
    id: 'coordinated',
    zh: '呼應穿搭',
    en: 'coordinated styling, visually connected outfits, similar fashion language with subtle differences',
  },
  {
    id: 'contrast',
    zh: '對比穿搭',
    en: 'contrasting styling, different silhouettes and wardrobe details, clearly distinct fashion presence',
  },
  {
    id: 'independent',
    zh: '各自獨立',
    en: 'independent styling, distinct outfit choices, clearly separate personal fashion identity',
  },
];

const GARMENT_COLOR_OPTIONS = [
  { id: 'black', zh: '黑色', en: 'black' },
  { id: 'white', zh: '白色', en: 'white' },
  { id: 'dark-grey', zh: '深灰色', en: 'dark grey' },
  { id: 'light-grey', zh: '淺灰色', en: 'light grey' },
  { id: 'off-white', zh: '米白色', en: 'off-white' },
  { id: 'dark-brown', zh: '深棕色', en: 'dark brown' },
  { id: 'light-brown', zh: '淺棕色', en: 'light brown' },
  { id: 'red', zh: '紅色', en: 'red' },
  { id: 'bright-red', zh: '亮紅色', en: 'bright red' },
  { id: 'pink', zh: '粉紅色', en: 'pink' },
  { id: 'light-blue', zh: '淡藍色', en: 'light blue' },
  { id: 'dark-blue', zh: '深藍色', en: 'dark blue' },
  { id: 'royal-blue', zh: '寶藍色', en: 'royal blue' },
  { id: 'light-green', zh: '淺綠色', en: 'light green' },
  { id: 'dark-green', zh: '深綠色', en: 'dark green' },
  { id: 'olive-green', zh: '軍綠色', en: 'olive green' },
  { id: 'neon-green', zh: '螢光綠色', en: 'neon green' },
  { id: 'goose-yellow', zh: '鵝黃色', en: 'soft yellow' },
  { id: 'neon-yellow', zh: '螢光黃色', en: 'neon yellow' },
  { id: 'silver', zh: '銀色', en: 'silver' },
  { id: 'gold', zh: '金色', en: 'gold' },
];

const OUTFIT_PRESET_NONE_OPTION = {
  id: 'outfit-preset-none',
  zh: '全無',
  en: 'none',
  desc: 'Explicitly disable outfit presets so granular wardrobe selections remain active.',
  meta: { tags: ['none', 'no_outfit_preset'] },
};

const LOCK_DEFINITIONS = [
  { key: 'subjectCount', label: '人物數量', options: SUBJECT_COUNT_OPTIONS, required: true, defaultValue: '1', section: 'core' },
  { key: 'aspectRatio', label: '畫面比例', options: ASPECT_RATIO_OPTIONS, required: true, defaultValue: '4:5', section: 'core' },
  { key: 'styleId', label: '攝影風格', category: '攝影風格', section: 'core' },
  { key: 'locationId', label: '場景', category: null, section: 'core' },
  { key: 'framingId', label: '構圖景別', category: '景別構圖 (Framing)', section: 'core' },
  { key: 'angleId', label: '俯仰角度', category: '相機視角 (Angle)', section: 'core' },
  { key: 'orbitId', label: '環繞角度', category: '拍攝方位 (Orbit Angle)', section: 'core' },
  { key: 'lightingId', label: '光線類型', category: '光線類型 (Lighting Type)', section: 'core' },
  { key: 'lightDirectionId', label: '光線方向', category: '光線方向與質感 (Light Direction & Quality)', section: 'core' },
  { key: 'filmId', label: '成像風格', category: '底片與相機模擬 (Camera & Film Simulation)', section: 'core' },
  { key: 'bodyTypeId', label: '體態', category: '體態 (Body Type)', section: 'character' },
  { key: 'facialFeaturesId', label: '五官特徵', category: '五官特徵 (Facial Features)', section: 'character' },
  { key: 'facialFeaturesAId', label: '人物 A 五官', category: '五官特徵 (Facial Features)', section: 'character' },
  { key: 'facialFeaturesBId', label: '人物 B 五官', category: '五官特徵 (Facial Features)', section: 'character' },
  { key: 'skinDetailsId', label: '膚質特徵', category: '膚質特徵 (Skin Details)', section: 'character' },
  { key: 'hairstyleId', label: '髮型', category: '髮型 (Hairstyle)', section: 'character' },
  { key: 'hairstyleAId', label: '人物 A 髮型', category: '髮型 (Hairstyle)', section: 'character' },
  { key: 'hairstyleBId', label: '人物 B 髮型', category: '髮型 (Hairstyle)', section: 'character' },
  { key: 'hairColorId', label: '髮色', category: '髮色 (Hair Color)', section: 'character' },
  { key: 'hairColorAId', label: '人物 A 髮色', category: '髮色 (Hair Color)', section: 'character' },
  { key: 'hairColorBId', label: '人物 B 髮色', category: '髮色 (Hair Color)', section: 'character' },
  { key: 'duoInteractionId', label: '雙人互動', options: DUO_INTERACTION_OPTIONS, section: 'character' },
  { key: 'expressionId', label: '神情眼神', category: '神情與眼神 (Expression & Gaze)', section: 'character' },
  { key: 'poseId', label: '姿勢動作', category: '姿勢與肢體語言 (Pose & Body Language)', section: 'character' },
  { key: 'outfitPresetId', label: '套裝', category: '套裝 (Outfit Presets)', section: 'wardrobe' },
  { key: 'outfitPresetAId', label: '人物 A 套裝', category: '套裝 (Outfit Presets)', section: 'wardrobe' },
  { key: 'outfitPresetBId', label: '人物 B 套裝', category: '套裝 (Outfit Presets)', section: 'wardrobe' },
  { key: 'topId', label: '上身', category: '上身 (Tops)', section: 'wardrobe' },
  { key: 'topColorId', label: '上身配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'duoStylingId', label: '雙人穿搭', options: DUO_STYLING_OPTIONS, section: 'wardrobe' },
  { key: 'pantsId', label: '褲裝', category: '褲裝 (Pants)', section: 'wardrobe' },
  { key: 'skirtId', label: '裙裝', category: '裙裝 (Skirts)', section: 'wardrobe' },
  { key: 'bottomColorId', label: '下身配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'legwearId', label: '襪類', category: '襪類 (Legwear)', section: 'wardrobe' },
  { key: 'outerwearId', label: '外套', category: '外套 (Outerwear)', section: 'wardrobe' },
  { key: 'shoesId', label: '鞋款', category: '鞋款 (Shoes)', section: 'wardrobe' },
  { key: 'jewelryIds', label: '飾品點綴', category: '飾品點綴 (Jewelry & Piercings)', section: 'wardrobe', multi: true, defaultValue: [] },
];

const REQUIRED_LOCK_KEYS = LOCK_DEFINITIONS.filter((definition) => definition.required).map((definition) => definition.key);
const LOCK_KEYS = new Set(LOCK_DEFINITIONS.map((definition) => definition.key));

const PARTIAL_REROLL_OPTIONS = [
  { key: 'styleId', label: 'Style' },
  { key: 'locationId', label: 'Location' },
  { key: 'framingId', label: 'Framing' },
  { key: 'angleId', label: 'Angle' },
  { key: 'orbitId', label: 'Orbit' },
  { key: 'lightingId', label: 'Lighting' },
  { key: 'lightDirectionId', label: 'Light Direction' },
  { key: 'filmId', label: 'Film' },
  { key: 'outfitPresetId', label: 'Outfit Preset' },
  { key: 'bodyTypeId', label: 'Body Type' },
  { key: 'facialFeaturesId', label: 'Face' },
  { key: 'facialFeaturesAId', label: 'Face A' },
  { key: 'facialFeaturesBId', label: 'Face B' },
  { key: 'skinDetailsId', label: 'Skin' },
  { key: 'hairstyleId', label: 'Hair Style' },
  { key: 'hairstyleAId', label: 'Hair Style A' },
  { key: 'hairstyleBId', label: 'Hair Style B' },
  { key: 'hairColorId', label: 'Hair Color' },
  { key: 'hairColorAId', label: 'Hair Color A' },
  { key: 'hairColorBId', label: 'Hair Color B' },
  { key: 'duoInteractionId', label: 'Duo Interaction' },
  { key: 'expressionId', label: 'Expression' },
  { key: 'poseId', label: 'Pose' },
  { key: 'outfitPresetId', label: 'Outfit Preset' },
  { key: 'outfitPresetAId', label: 'Outfit Preset A' },
  { key: 'outfitPresetBId', label: 'Outfit Preset B' },
  { key: 'topId', label: 'Top' },
  { key: 'topColorId', label: 'Top Color' },
  { key: 'duoStylingId', label: 'Duo Styling' },
  { key: 'pantsId', label: 'Pants' },
  { key: 'skirtId', label: 'Skirt' },
  { key: 'bottomColorId', label: 'Bottom Color' },
  { key: 'legwearId', label: 'Legwear' },
  { key: 'outerwearId', label: 'Outerwear' },
  { key: 'shoesId', label: 'Shoes' },
  { key: 'jewelryIds', label: 'Jewelry' },
];

const CUSTOM_GROUP_OPTIONS = [
  { value: 'Regional', label: 'Photography Style' },
  { value: 'Locations', label: 'Location' },
  { value: 'Wardrobe', label: 'Wardrobe' },
  { value: 'Character', label: 'Character' },
  { value: 'CameraLighting', label: 'Camera & Lighting' },
  { value: 'Negative', label: 'Negative Prompt' },
];

const VISIBILITY_ORDER = {
  wide: 0,
  full: 1,
  medium: 2,
  portrait: 3,
  close: 4,
};

const stripMarkdown = (text = '') => text.replace(/[`*]/g, '').replace(/\s+/g, ' ').trim();

const slugify = (text = '') =>
  stripMarkdown(text)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '');

const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

const withTags = (...parts) =>
  Array.from(
    new Set(
      parts
        .flat()
        .filter(Boolean)
        .map((tag) => String(tag))
    )
  );

const toHaystack = (...parts) => stripMarkdown(parts.filter(Boolean).join(' | ')).toLowerCase();

const hasAny = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const getByKey = (obj, key) => obj[key] || [];

function inferFamily(category, item) {
  const haystack = toHaystack(category, item.zh, item.en, item.desc);

  if (hasAny(haystack, ['cyberpunk', '賽博'])) return 'cyberpunk';
  if (hasAny(haystack, ['techwear', '機能'])) return 'techwear';
  if (hasAny(haystack, ['streetwear', 'harajuku', '日系街頭'])) return 'streetwear';
  if (hasAny(haystack, ['y2k', '千禧'])) return 'y2k';
  if (hasAny(haystack, ['quiet luxury', 'minimalist', '極簡高級'])) return 'minimal';
  if (hasAny(haystack, ['parisian', '法式'])) return 'parisian';
  if (hasAny(haystack, ['punk', '龐克'])) return 'punk';
  if (hasAny(haystack, ['bohemian', 'ethnic', '民俗'])) return 'bohemian';
  if (hasAny(haystack, ['bdsm', 'bondage', '乳膠', 'latex', '束縛'])) return 'bdsm';
  if (hasAny(haystack, ['baroque', '巴洛克'])) return 'baroque';
  if (hasAny(haystack, ['victorian', '維多利亞'])) return 'victorian';
  if (hasAny(haystack, ['lolita', '蘿莉塔'])) return 'lolita';
  if (hasAny(haystack, ['jk uniform', 'schoolgirl', '水手服', '高校'])) return 'schoolgirl';
  if (hasAny(haystack, ['lingerie', '內衣', 'boudoir'])) return 'lingerie';
  if (hasAny(haystack, ['swimwear', '泳裝', 'bikini'])) return 'swimwear';
  if (hasAny(haystack, ['military', '軍裝', 'camouflage'])) return 'military';
  if (hasAny(haystack, ['industrial', '工業'])) return 'industrial';
  if (hasAny(haystack, ['vintage', 'retro', '復古'])) return 'retro';

  return 'neutral';
}

function inferStyleMeta(_category, item) {
  const haystack = toHaystack(item.zh, item.en, item.desc);
  const tags = [];

  if (hasAny(haystack, ['airy', 'translucent', 'gentle mood', '清透寫真'])) tags.push('soft_grade', 'natural_light_bias', 'indoor_bias');
  if (hasAny(haystack, ['clean studio', 'beauty lighting', '棚拍'])) tags.push('clean_grade', 'beauty', 'studio_bias', 'controlled');
  if (hasAny(haystack, ['neon cinematic', 'urban night', '霓虹電影'])) tags.push('neon', 'urban_bias', 'artificial_light', 'night_bias');
  if (hasAny(haystack, ['forest-like shadows', 'low-key', '靜謐森林'])) tags.push('moody', 'cool_grade', 'dramatic', 'natural_bias', 'low_key_bias');
  if (hasAny(haystack, ['hyper-saturated', 'floral', '花卉夢境'])) tags.push('high_saturation', 'dreamlike', 'set_bias', 'studio_bias');
  if (hasAny(haystack, ['symmetrical', 'negative space', '留白疏離'])) tags.push('minimal', 'structured', 'conceptual', 'indoor_bias');
  if (hasAny(haystack, ['poetic everyday', 'lyrical realism', '日常微光'])) tags.push('soft_grade', 'natural_light_bias', 'natural_bias', 'indoor_bias');
  if (hasAny(haystack, ['soft haze', 'painterly softness', '柔霧古典'])) tags.push('studio_bias', 'moody', 'elegant', 'controlled');
  if (hasAny(haystack, ['minimal studio', 'sculptural pose', '極簡雕塑'])) tags.push('studio_bias', 'minimal', 'structured', 'controlled');
  if (hasAny(haystack, ['cold glamorous', 'assertive pose', '權力性感'])) tags.push('dramatic', 'urban_bias', 'elegant', 'night_bias');
  if (hasAny(haystack, ['playful sensual', 'flirtatious', '俏皮性感'])) tags.push('artificial_light', 'lively', 'indoor_bias');
  if (hasAny(haystack, ['intimate documentary', 'private room ambience', '私密生活'])) tags.push('film', 'indoor_bias', 'warm_grade');
  if (hasAny(haystack, ['direct flash fashion', 'flat flash lighting', '直閃時尚'])) tags.push('artificial_light', 'urban_bias', 'flash_bias', 'raw');
  if (hasAny(haystack, ['black and white supermodel', '黑白真實超模'])) tags.push('monochrome', 'dramatic', 'outdoor_bias', 'editorial');
  if (hasAny(haystack, ['clean backdrop image', '純背景凝視'])) tags.push('studio_bias', 'minimal', 'controlled', 'editorial');
  if (hasAny(haystack, ['quiet documentary image', 'american road atmosphere', '空曠美式'])) tags.push('natural_bias', 'outdoor_bias', 'documentary', 'soft_grade');
  if (hasAny(haystack, ['wet plate inspired', '古典濕版'])) tags.push('monochrome', 'moody', 'natural_bias', 'heritage_bias', 'low_frequency_style');
  if (hasAny(haystack, ['casual youthful image', '青春日常隨拍'])) tags.push('natural_light_bias', 'urban_bias', 'lively', 'indoor_bias');
  if (hasAny(haystack, ['high contrast black and white', '高反差黑白街頭'])) tags.push('monochrome', 'urban_bias', 'night_bias', 'raw', 'low_frequency_style');
  if (hasAny(haystack, ['bold narrative fashion', '危險敘事'])) tags.push('dramatic', 'set_bias', 'studio_bias', 'high_saturation');
  if (hasAny(haystack, ['hyper-stylized fashion image', '濃彩復古電影棚拍'])) tags.push('studio_bias', 'set_bias', 'high_saturation', 'artificial_light');

  return { tags: withTags(tags) };
}

function inferLocationMeta(category, item) {
  const haystack = toHaystack(category, item.zh, item.en, item.desc);
  const tags = [];

  if (hasAny(haystack, ['studio sets', '攝影棚與背景'])) tags.push('indoor', 'set', 'controlled', 'studio');
  if (hasAny(haystack, ['urban & social snapshots', '城市與社群感'])) tags.push('urban');
  if (hasAny(haystack, ['indoor & lifestyle', '生活感室內'])) tags.push('indoor');
  if (hasAny(haystack, ['nature & outdoors', '自然與戶外'])) tags.push('outdoor', 'natural');
  if (hasAny(haystack, ['abandoned & underground', '地下與廢墟風格'])) tags.push('underground', 'dark', 'artificial_light');

  if (hasAny(haystack, ['night', 'neon', '霓虹', '夜市', 'rave', 'club', '2am'])) tags.push('night');
  if (hasAny(haystack, ['golden hour', 'sunny', 'sunflower', 'desert', 'beach'])) tags.push('day', 'sunlight');
  if (hasAny(haystack, ['fog', '霧', 'twilight'])) tags.push('foggy');
  if (hasAny(haystack, ['window', 'sunbeams', 'daylight'])) tags.push('window_light');
  if (hasAny(haystack, ['laser', 'led', 'mirror selfie', 'shopping mall', 'elevator'])) tags.push('artificial_light');
  if (hasAny(haystack, ['club', 'laser', 'smoke'])) tags.push('club', 'smoke');
  if (hasAny(haystack, ['mansion', 'victorian', 'opera house', 'library', 'old town', '照相館'])) tags.push('heritage');
  if (hasAny(haystack, ['white background', 'grey seamless', 'paper roll', 'backdrop'])) tags.push('studio');
  if (hasAny(haystack, ['beach', 'coastline', 'shoreline', 'sand dunes', 'lakeside'])) tags.push('outdoor');
  if (hasAny(haystack, ['abandoned', 'ruin', 'derelict', '廢棄', '破敗'])) tags.push('ruin');

  return { tags: withTags(tags) };
}

function inferFramingMeta(_category, item) {
  const haystack = toHaystack(item.zh, item.en, item.desc);

  if (hasAny(haystack, ['extreme close-up', 'macro'])) return { visibility: 'close', tags: ['face_detail'] };
  if (hasAny(haystack, ['close-up', 'head and shoulders'])) return { visibility: 'portrait', tags: ['eye_contact_ok', 'face_detail'] };
  if (hasAny(haystack, ['medium shot', 'waist up'])) return { visibility: 'medium', tags: ['eye_contact_ok'] };
  if (hasAny(haystack, ['cowboy shot', 'knee up'])) return { visibility: 'medium', tags: ['pose_focus'] };
  if (hasAny(haystack, ['full body', 'full length'])) return { visibility: 'full', tags: ['outfit_focus'] };
  if (hasAny(haystack, ['wide shot', 'small figure', 'environmental portrait'])) return { visibility: 'wide', tags: ['environment_focus'] };

  return { visibility: 'medium', tags: [] };
}

function inferAngleMeta(_category, item) {
  const haystack = toHaystack(item.zh, item.en, item.desc);

  if (hasAny(haystack, ['bird', 'top-down', 'zenith'])) return { tags: ['aerial', 'no_eye_contact'] };
  if (hasAny(haystack, ['high angle'])) return { tags: ['high_angle'] };
  if (hasAny(haystack, ['low angle'])) return { tags: ['low_angle'] };
  if (hasAny(haystack, ['dutch angle'])) return { tags: ['dynamic', 'low_frequency_angle'] };

  return { tags: ['eye_contact_ok'] };
}

function inferOrbitMeta(_category, item) {
  const haystack = toHaystack(item.zh, item.en, item.desc);
  const tags = [];

  if (hasAny(haystack, ['front-facing', 'straight-on', '正面'])) tags.push('front_view', 'eye_contact_ok');
  if (hasAny(haystack, ['three-quarter', '45-degree', '315', '135', '225'])) tags.push('three_quarter');
  if (hasAny(haystack, ['profile', '90-degree', '270'])) tags.push('profile_view');
  if (hasAny(haystack, ['back view', 'facing away', 'rear'])) tags.push('back_view', 'no_eye_contact');

  return { tags: withTags(tags) };
}

function getGarmentColorOption(id) {
  return GARMENT_COLOR_OPTIONS.find((option) => option.id === id) || null;
}

function inferLightingMeta(category, item) {
  const haystack = toHaystack(category, item.zh, item.en, item.desc);
  const tags = [];

  if (hasAny(haystack, ['warm sunset', 'golden evening', 'warm sunlight'])) tags.push('natural_light', 'sunlight', 'outdoor', 'warm');
  if (hasAny(haystack, ['blue twilight', 'twilight'])) tags.push('natural_light', 'outdoor', 'dusk', 'cool');
  if (hasAny(haystack, ['blue sky daylight', 'white clouds'])) tags.push('natural_light', 'sunlight', 'outdoor', 'day', 'clean_sky');
  if (hasAny(haystack, ['overcast', 'cloudy'])) tags.push('natural_light', 'outdoor', 'diffused');
  if (hasAny(haystack, ['harsh direct sunlight', 'midday sun'])) tags.push('natural_light', 'sunlight', 'outdoor', 'harsh');
  if (hasAny(haystack, ['neon', 'cyberpunk', 'bi-color'])) tags.push('artificial_light', 'neon', 'night');
  if (hasAny(haystack, ['high key studio', 'softbox'])) tags.push('studio_light', 'artificial_light', 'controlled');
  if (hasAny(haystack, ['low key', 'chiaroscuro'])) tags.push('artificial_light', 'dark', 'dramatic');
  if (hasAny(haystack, ['ring flash'])) tags.push('studio_light', 'artificial_light', 'flash');
  if (hasAny(haystack, ['window', 'venetian'])) tags.push('window_light', 'natural_light', 'indoor');
  if (hasAny(haystack, ['rim light', 'backlit'])) tags.push('backlight');
  if (hasAny(haystack, ['butterfly', 'rembrandt', 'split lighting'])) tags.push('portrait_light', 'artificial_light');
  if (hasAny(haystack, ['top lighting'])) tags.push('overhead', 'artificial_light');

  return { tags: withTags(tags) };
}

function inferCharacterMeta(category, item) {
  const haystack = toHaystack(category, item.zh, item.en, item.desc);
  let minVisibility = 'full';
  const tags = [];
  let archetype = null;

  if (category.includes('Body Type')) minVisibility = 'full';
  if (category.includes('Facial Features')) minVisibility = 'portrait';
  if (category.includes('Skin Details')) minVisibility = 'portrait';
  if (category.includes('Hairstyle')) minVisibility = 'medium';
  if (category.includes('Hair Color')) minVisibility = 'medium';
  if (category.includes('Expression')) minVisibility = 'medium';
  if (category.includes('Pose')) minVisibility = 'full';

  if (hasAny(haystack, ['freckles', '雀斑', 'eyelashes', 'lip', 'nose', '瞳', 'gaze', 'eye contact'])) {
    minVisibility = 'portrait';
    tags.push('fine_detail');
  }

  if (category.includes('Skin Details')) tags.push('skin_detail');

  if (category.includes('Hair Color')) {
    if (hasAny(haystack, ['內層染', '挑染', '分色', '漸層', '耳圈染', 'highlights', 'split dye', 'gradient', 'inner layer', 'face-framing'])) {
      tags.push('special_hair_color');
    } else {
      tags.push('mainstream_hair_color');
    }
  }

  if (hasAny(haystack, ['direct gaze', '直視', 'eye contact'])) tags.push('direct_gaze');
  if (hasAny(haystack, ['top-down', 'aerial view', '俯拍'])) tags.push('requires_aerial');
  if (hasAny(haystack, ['korean', 'idol'])) archetype = 'korean';
  if (hasAny(haystack, ['nordic', 'scandinavian'])) archetype = 'nordic';
  if (hasAny(haystack, ['east asian', 'asian'])) archetype = 'east_asian';
  if (hasAny(haystack, ['western', 'hollywood', 'american'])) archetype = 'western';
  if (hasAny(haystack, ['french'])) archetype = 'french';

  return { minVisibility, tags: withTags(tags), archetype };
}

function inferWardrobeMeta(category, item) {
  const family = inferFamily(category, item);
  const haystack = toHaystack(category, item.zh, item.en, item.desc);
  const tags = [];

  if (hasAny(haystack, ['latex', 'glossy', 'sheer', 'lingerie', 'bikini'])) tags.push('revealing');
  if (hasAny(haystack, ['utility', 'tactical', 'combat'])) tags.push('utilitarian');
  if (hasAny(haystack, ['lace', 'corset', 'victorian'])) tags.push('ornate');
  if (hasAny(haystack, ['oversized', 'streetwear'])) tags.push('streetwear');
  if (hasAny(haystack, ['swimwear', 'beach'])) tags.push('outdoor_bias');
  if (category.includes('褲裝') || category.includes('Pants')) tags.push('pants');
  if (category.includes('裙裝') || category.includes('Skirts')) tags.push('skirt');
  if (category.includes('襪類') || category.includes('Legwear')) tags.push('legwear');
  if (category.includes('飾品點綴') || category.includes('Jewelry')) tags.push('accessory_small');
  if (hasAny(haystack, ['no jewelry', '全無'])) tags.push('no_accessory');
  if (hasAny(haystack, ['nose ring', 'lip ring', 'choker', '鼻環', '唇環', '頸鍊'])) tags.push('edgy_accessory');
  if (hasAny(haystack, ['tailored', 'blazer', 'loafers', 'pencil skirt', 'silk maxi skirt', '細帶高跟', '西裝'])) tags.push('elegant');
  if (hasAny(haystack, ['pleated', 'sailor', 'over-knee socks', 'jk', 'mary jane', '百褶', '膝上襪'])) tags.push('uniform');
  if (hasAny(haystack, ['lolita', 'ruffled', 'lace', 'bell-shaped', '鐘形'])) tags.push('romantic');
  if (hasAny(haystack, ['combat boots', 'cargo', 'biker', 'punk', 'fishnet', '軍靴', '工裝'])) tags.push('edgy');
  if (hasAny(haystack, ['sneakers', 't-shirt', 'jeans', 'ankle socks', '球鞋', '牛仔', '短襪'])) tags.push('casual');
  if (hasAny(haystack, ['metallic', 'techwear', 'reflective', 'cyber', '金屬', '反光'])) tags.push('futuristic');
  if (hasAny(haystack, ['victorian', 'baroque', 'cape', 'brocade', '花呢', '蕾絲'])) tags.push('heritage');

  return { family, tags: withTags(tags) };
}

function inferFilmMeta(_category, item) {
  const haystack = toHaystack(item.zh, item.en, item.desc);
  const tags = [];

  if (hasAny(haystack, ['polaroid', 'vhs'])) tags.push('retro');
  if (hasAny(haystack, ['kodak', 'portra', 'superia'])) tags.push('film');
  if (hasAny(haystack, ['black and white', 'ilford'])) tags.push('monochrome');
  if (hasAny(haystack, ['medium format'])) tags.push('detail_heavy');
  if (hasAny(haystack, ['vhs'])) tags.push('low_frequency_film');

  return { tags: withTags(tags) };
}

function inferEffectMeta(_category, item) {
  const haystack = toHaystack(item.zh, item.en, item.desc);
  const tags = [];

  if (hasAny(haystack, ['motion blur', 'light trails'])) tags.push('motion');
  if (hasAny(haystack, ['light leaks', 'lens flare'])) tags.push('light_artifact');
  if (hasAny(haystack, ['double exposure'])) tags.push('surreal');
  if (hasAny(haystack, ['bokeh', 'optical blur'])) tags.push('dreamy');

  return { tags: withTags(tags) };
}

function inferNegativeMeta(_category, item) {
  const haystack = toHaystack(item.zh, item.en, item.desc);
  const conflictTags = [];
  const useTags = [];

  if (hasAny(haystack, ['artificial light', 'studio light', 'flash'])) conflictTags.push('artificial_light');
  if (hasAny(haystack, ['unnatural colors', 'oversaturated'])) conflictTags.push('neon');
  if (hasAny(haystack, ['modern technology', 'smartphone', 'led lights'])) useTags.push('period_piece');
  if (hasAny(haystack, ['horror', 'gore', 'zombie'])) useTags.push('avoid_horror');
  if (hasAny(haystack, ['nsfw', 'explicit', 'nude'])) useTags.push('avoid_nsfw');
  if (hasAny(haystack, ['messy background', 'cluttered'])) useTags.push('clean_background');

  return { conflictTags: withTags(conflictTags), useTags: withTags(useTags) };
}

function inferCameraMeta(category, item) {
  if (category === '景別構圖 (Framing)') return inferFramingMeta(category, item);
  if (category === '相機視角 (Angle)') return inferAngleMeta(category, item);
  if (category === '拍攝方位 (Orbit Angle)') return inferOrbitMeta(category, item);
  if (category === '光線類型 (Lighting Type)' || category === '光線方向與質感 (Light Direction & Quality)') {
    return inferLightingMeta(category, item);
  }
  if (category === '底片與相機模擬 (Camera & Film Simulation)') return inferFilmMeta(category, item);
  if (category === '特殊效果 (Special Effects)') return inferEffectMeta(category, item);
  return { tags: [] };
}

function buildEntries(groupName, groupedData, inferMeta) {
  return Object.entries(groupedData).reduce((acc, [category, items]) => {
    acc[category] = items.map((item, index) => {
      const normalized = {
        id: `${groupName}:${slugify(category)}:${slugify(item.zh || item.en || String(index))}:${index}`,
        zh: stripMarkdown(item.zh),
        en: stripMarkdown(item.en),
        desc: stripMarkdown(item.desc),
      };

      return {
        ...normalized,
        meta: inferMeta(category, normalized),
      };
    });
    return acc;
  }, {});
}

function cloneDatabase(rawDatabase) {
  return JSON.parse(JSON.stringify(rawDatabase));
}

function mergeCustomLibrary(customLibrary = []) {
  const merged = cloneDatabase(database);

  customLibrary.forEach((entry) => {
    const group = entry.group;
    const category = stripMarkdown(entry.category);

    if (!group || !merged[group] || !category) return;

    if (!Array.isArray(merged[group][category])) {
      merged[group][category] = [];
    }

    merged[group][category].push({
      zh: stripMarkdown(entry.zh),
      en: stripMarkdown(entry.en),
      desc: stripMarkdown(entry.desc),
    });
  });

  return merged;
}

function buildCatalog(customLibrary = []) {
  const mergedDatabase = mergeCustomLibrary(customLibrary);

  const catalog = {
    regional: buildEntries('regional', mergedDatabase.Regional || {}, inferStyleMeta),
    wardrobe: buildEntries('wardrobe', mergedDatabase.Wardrobe || {}, inferWardrobeMeta),
    camera: buildEntries('camera', mergedDatabase.CameraLighting || {}, inferCameraMeta),
    locations: buildEntries('locations', mergedDatabase.Locations || {}, inferLocationMeta),
    character: buildEntries('character', mergedDatabase.Character || {}, inferCharacterMeta),
    negative: buildEntries('negative', mergedDatabase.Negative || {}, inferNegativeMeta),
  };

  const flatten = (group) => Object.values(group).flat();

  return {
    catalog,
    flatCatalog: {
      regional: flatten(catalog.regional),
      locations: flatten(catalog.locations),
      framing: getByKey(catalog.camera, '景別構圖 (Framing)'),
      angle: getByKey(catalog.camera, '相機視角 (Angle)'),
      orbit: getByKey(catalog.camera, '拍攝方位 (Orbit Angle)'),
      lighting: getByKey(catalog.camera, '光線類型 (Lighting Type)'),
      lightDirection: getByKey(catalog.camera, '光線方向與質感 (Light Direction & Quality)'),
      film: getByKey(catalog.camera, '底片與相機模擬 (Camera & Film Simulation)'),
      effects: getByKey(catalog.camera, '特殊效果 (Special Effects)'),
      outfitPresets: [OUTFIT_PRESET_NONE_OPTION, ...getByKey(catalog.wardrobe, '套裝 (Outfit Presets)')],
    },
    mergedDatabase,
  };
}

export function getKnowledgeBaseOptions(customLibrary = []) {
  const { mergedDatabase } = buildCatalog(customLibrary);

  return CUSTOM_GROUP_OPTIONS.map((groupOption) => ({
    ...groupOption,
    categories: Object.keys(mergedDatabase[groupOption.value] || {}).sort(),
  }));
}

export function createEmptyLocks() {
  return Object.fromEntries(
    LOCK_DEFINITIONS.map((definition) => [definition.key, definition.defaultValue ?? (definition.multi ? [] : '')])
  );
}

export function normalizeLocks(rawLocks = {}) {
  const normalized = createEmptyLocks();

  Object.entries(rawLocks || {}).forEach(([key, value]) => {
    if (!LOCK_KEYS.has(key)) return;
    normalized[key] = value;
  });

  const legacyJewelry = rawLocks?.jewelryId;
  if (Array.isArray(rawLocks?.jewelryIds)) {
    normalized.jewelryIds = rawLocks.jewelryIds.filter(Boolean);
  } else if (legacyJewelry) {
    normalized.jewelryIds = [legacyJewelry];
  } else {
    normalized.jewelryIds = [];
  }

  return normalized;
}

export function getLockControls(customLibrary = []) {
  const { flatCatalog, catalog } = buildCatalog(customLibrary);

  return LOCK_DEFINITIONS.map((definition) => {
    let options = definition.options || [];

    if (!definition.options) {
      if (definition.key === 'styleId') options = flatCatalog.regional;
      if (definition.key === 'locationId') options = flatCatalog.locations;
      if (definition.key === 'framingId') options = flatCatalog.framing;
      if (definition.key === 'angleId') options = flatCatalog.angle;
      if (definition.key === 'orbitId') options = flatCatalog.orbit;
      if (definition.key === 'lightingId') options = flatCatalog.lighting;
      if (definition.key === 'lightDirectionId') options = flatCatalog.lightDirection;
      if (definition.key === 'filmId') options = flatCatalog.film;
      if (definition.key === 'outfitPresetId') options = flatCatalog.outfitPresets;
      if (definition.key === 'outfitPresetAId') options = flatCatalog.outfitPresets;
      if (definition.key === 'outfitPresetBId') options = flatCatalog.outfitPresets;
      if (definition.key === 'bodyTypeId') options = getByKey(catalog.character, '體態 (Body Type)');
      if (definition.key === 'facialFeaturesId') options = getByKey(catalog.character, '五官特徵 (Facial Features)');
      if (definition.key === 'facialFeaturesAId') options = getByKey(catalog.character, '五官特徵 (Facial Features)');
      if (definition.key === 'facialFeaturesBId') options = getByKey(catalog.character, '五官特徵 (Facial Features)');
      if (definition.key === 'skinDetailsId') options = getByKey(catalog.character, '膚質特徵 (Skin Details)');
      if (definition.key === 'hairstyleId') options = getByKey(catalog.character, '髮型 (Hairstyle)');
      if (definition.key === 'hairstyleAId') options = getByKey(catalog.character, '髮型 (Hairstyle)');
      if (definition.key === 'hairstyleBId') options = getByKey(catalog.character, '髮型 (Hairstyle)');
      if (definition.key === 'hairColorId') options = getByKey(catalog.character, '髮色 (Hair Color)');
      if (definition.key === 'hairColorAId') options = getByKey(catalog.character, '髮色 (Hair Color)');
      if (definition.key === 'hairColorBId') options = getByKey(catalog.character, '髮色 (Hair Color)');
      if (definition.key === 'expressionId') options = getByKey(catalog.character, '神情與眼神 (Expression & Gaze)');
      if (definition.key === 'poseId') options = getByKey(catalog.character, '姿勢與肢體語言 (Pose & Body Language)');
      if (definition.key === 'topId') options = getByKey(catalog.wardrobe, '上身 (Tops)');
      if (definition.key === 'pantsId') options = getByKey(catalog.wardrobe, '褲裝 (Pants)');
      if (definition.key === 'skirtId') options = getByKey(catalog.wardrobe, '裙裝 (Skirts)');
      if (definition.key === 'legwearId') options = getByKey(catalog.wardrobe, '襪類 (Legwear)');
      if (definition.key === 'outerwearId') options = getByKey(catalog.wardrobe, '外套 (Outerwear)');
      if (definition.key === 'shoesId') options = getByKey(catalog.wardrobe, '鞋款 (Shoes)');
      if (definition.key === 'jewelryIds') options = getByKey(catalog.wardrobe, '飾品點綴 (Jewelry & Piercings)');
    }

    return { ...definition, options };
  });
}

export function getPartialRerollOptions() {
  return PARTIAL_REROLL_OPTIONS;
}

function findById(list, id) {
  return list.find((item) => item.id === id) || null;
}

function visibilityAtLeast(current, minimum) {
  return VISIBILITY_ORDER[current] >= VISIBILITY_ORDER[minimum];
}

function frameShowsAtLeast(current, target) {
  return VISIBILITY_ORDER[current] <= VISIBILITY_ORDER[target];
}

function locationSupportsLighting(location, lighting) {
  const locTags = new Set(location.meta.tags);
  const lightTags = new Set(lighting.meta.tags);

  if (locTags.has('controlled') || locTags.has('set') || locTags.has('studio')) {
    if (lightTags.has('outdoor') || lightTags.has('sunlight') || lightTags.has('dusk')) return false;
  }

  if (locTags.has('underground') || locTags.has('club')) {
    if (lightTags.has('sunlight') || lightTags.has('outdoor')) return false;
  }

  if (locTags.has('indoor') && !locTags.has('window_light')) {
    if (lightTags.has('sunlight') && !lightTags.has('studio_light')) return false;
  }

  if (locTags.has('outdoor')) {
    if (lightTags.has('studio_light') && !lightTags.has('flash')) return false;
    if (lightTags.has('dark') && !locTags.has('night') && !locTags.has('underground')) return false;
  }

  if (locTags.has('night') && lightTags.has('sunlight')) return false;
  if (locTags.has('day') && lightTags.has('dusk')) return false;
  if (locTags.has('day') && lightTags.has('dark')) return false;
  if (locTags.has('scifi') && lightTags.has('sunlight')) return false;
  if ((locTags.has('heritage') || locTags.has('urban') || locTags.has('natural')) && lightTags.has('studio_light')) return false;
  if (locTags.has('ruin') && lightTags.has('studio_light')) return false;
  if ((locTags.has('natural') || locTags.has('outdoor')) && lightTags.has('artificial_light') && !locTags.has('night') && !locTags.has('club')) return false;

  return true;
}

function lightDirectionSupportsScene(lightDirection, framing, location, lighting) {
  const directionTags = new Set(lightDirection.meta.tags);
  const locationTags = new Set(location.meta.tags);
  const lightingTags = new Set(lighting.meta.tags);

  if (directionTags.has('portrait_light') && !visibilityAtLeast(framing.meta.visibility, 'medium')) return false;
  if (directionTags.has('window_light') && !locationTags.has('window_light') && !locationTags.has('indoor')) return false;
  if (directionTags.has('portrait_light') && lightingTags.has('outdoor')) return false;
  if (locationTags.has('outdoor') && (directionTags.has('window_light') || directionTags.has('overhead'))) return false;
  if (lightingTags.has('outdoor') && directionTags.has('artificial_light')) return false;
  if (locationTags.has('urban') && directionTags.has('window_light')) return false;
  if (locationTags.has('natural') && directionTags.has('window_light')) return false;
  if (lightingTags.has('dark') && directionTags.has('window_light')) return false;
  if (locationTags.has('ruin') && directionTags.has('window_light')) return false;

  return true;
}

function styleFitsLocation(style, location) {
  const styleTags = new Set(style.meta.tags);
  const locationTags = new Set(location.meta.tags);

  if (styleTags.has('studio_bias') && !locationTags.has('studio') && !locationTags.has('set') && !locationTags.has('controlled')) return false;
  if (styleTags.has('set_bias') && !locationTags.has('studio') && !locationTags.has('set') && !locationTags.has('controlled')) return false;
  if ((styleTags.has('studio_bias') || styleTags.has('set_bias')) && (locationTags.has('outdoor') || locationTags.has('natural') || locationTags.has('ruin') || locationTags.has('urban'))) return false;
  if ((styleTags.has('minimal') || styleTags.has('clean_grade')) && locationTags.has('heritage')) return false;
  if (styleTags.has('indoor_bias') && !locationTags.has('indoor') && !locationTags.has('studio') && !locationTags.has('set') && !locationTags.has('controlled')) return false;
  if (styleTags.has('urban_bias') && !locationTags.has('urban') && !locationTags.has('night') && !locationTags.has('underground')) return false;
  if (styleTags.has('natural_bias') && !locationTags.has('outdoor') && !locationTags.has('natural') && !locationTags.has('window_light')) return false;
  if (styleTags.has('night_bias') && !locationTags.has('night') && !locationTags.has('underground') && !locationTags.has('club')) return false;
  if (styleTags.has('heritage_bias') && !locationTags.has('heritage') && !locationTags.has('natural')) return false;
  if (styleTags.has('outdoor_bias') && !locationTags.has('outdoor') && !locationTags.has('urban') && !locationTags.has('natural')) return false;
  if (styleTags.has('neon') && locationTags.has('natural') && !locationTags.has('night')) return false;

  return true;
}

function wardrobeFitsLocation(item, location) {
  const family = item.meta.family;
  const locationTags = new Set(location.meta.tags);

  if (family === 'swimwear') return locationTags.has('outdoor') || locationTags.has('beach');
  if (family === 'lingerie') return !locationTags.has('natural') && !locationTags.has('urban');
  if (['baroque', 'victorian', 'lolita'].includes(family)) return locationTags.has('heritage') || locationTags.has('studio') || locationTags.has('set');
  if (['cyberpunk', 'techwear', 'industrial'].includes(family)) return locationTags.has('urban') || locationTags.has('underground') || locationTags.has('scifi');
  if (family === 'bohemian') return locationTags.has('outdoor') || locationTags.has('natural');

  return true;
}

function framingSupportsAngle(framing, angle) {
  const angleTags = new Set(angle.meta.tags);

  if (angleTags.has('aerial') && VISIBILITY_ORDER[framing.meta.visibility] >= VISIBILITY_ORDER.medium) return false;

  return true;
}

function expressionSupportsComposition(item, context) {
  if (!visibilityAtLeast(context.framing.meta.visibility, item.meta.minVisibility)) return false;
  if (item.meta.tags.includes('direct_gaze') && context.angle.meta.tags.includes('aerial')) return false;
  if (item.meta.tags.includes('requires_aerial') && !context.angle.meta.tags.includes('aerial')) return false;
  if (item.meta.tags.includes('direct_gaze') && context.orbit?.meta.tags.includes('back_view')) return false;
  if (context.subject.count > 1 && (item.meta.tags.includes('direct_gaze') || item.meta.tags.includes('fine_detail'))) return false;
  return true;
}

function detailAllowed(item, framing) {
  return visibilityAtLeast(framing.meta.visibility, item.meta.minVisibility);
}

function getSubjectOption(id) {
  return SUBJECT_COUNT_OPTIONS.find((option) => option.id === id) || SUBJECT_COUNT_OPTIONS[0];
}

function getAspectRatioOption(id) {
  return ASPECT_RATIO_OPTIONS.find((option) => option.id === id) || ASPECT_RATIO_OPTIONS[2];
}

function getDuoInteractionOption(id) {
  return DUO_INTERACTION_OPTIONS.find((option) => option.id === id) || null;
}

function getDuoStylingOption(id) {
  return DUO_STYLING_OPTIONS.find((option) => option.id === id) || null;
}

function framingSupportsSubject(framing, subject, aspectRatio) {
  const visibility = framing.meta.visibility;

  if (subject.count > 1) {
    if (visibility === 'close' || visibility === 'portrait') return false;
    if (aspectRatio.id === '9:16' && visibility === 'wide') return false;
  }

  if (subject.count === 1 && aspectRatio.id === '16:9' && visibility === 'close') return false;

  return true;
}

function buildSubjectBase(subject) {
  return {
    zh: subject.count === 2 ? '兩位性感驚豔的東亞女性' : '一位性感驚豔的東亞女性',
    en: subject.en,
    id: `base-character-${subject.id}`,
    meta: { tags: ['female', subject.count === 2 ? 'duo' : 'solo'] },
  };
}

function buildCompositionHint(subject, aspectRatio, framing) {
  if (subject.count === 2) {
    const duoHint = aspectRatio.id === '16:9' ? 'balanced duo composition with clear spacing between both women' : 'balanced two-subject composition';
    if (framing.meta.visibility === 'wide') return `${duoHint}, both women fully readable in frame`;
    if (framing.meta.visibility === 'full') return `${duoHint}, both women standing naturally in frame`;
    return `${duoHint}, both women clearly visible`;
  }

  if (aspectRatio.id === '9:16') return 'single-subject vertical composition';
  if (aspectRatio.id === '16:9') return 'single-subject cinematic wide composition';
  return 'single-subject composition';
}

function pickWithLock(list, lockedId, predicate = () => true, picker = sample) {
  if (lockedId) {
    const locked = findById(list, lockedId);
    if (locked) return locked;
  }

  const matches = list.filter(predicate);
  return matches.length > 0 ? picker(matches) : picker(list);
}

function collectPositiveTags(...items) {
  return withTags(items.filter(Boolean).flatMap((item) => item.meta?.tags || []));
}

function buildCharacter(context, catalog) {
  const character = [buildSubjectBase(context.subject)];
  const visibility = context.framing.meta.visibility;
  let lockedArchetype = null;

  const lockKeyByCategory = {
    '體態 (Body Type)': 'bodyTypeId',
    '五官特徵 (Facial Features)': 'facialFeaturesId',
    '膚質特徵 (Skin Details)': 'skinDetailsId',
    '髮型 (Hairstyle)': 'hairstyleId',
    '髮色 (Hair Color)': 'hairColorId',
    '神情與眼神 (Expression & Gaze)': 'expressionId',
    '姿勢與肢體語言 (Pose & Body Language)': 'poseId',
  };

  const pickCategory = (categoryKey, locks, customPredicate = () => true, picker = sample, respectVisibility = true) => {
    const candidates = getByKey(catalog.character, categoryKey).filter(
      (item) => (!respectVisibility || detailAllowed(item, context.framing)) && customPredicate(item)
    );
    if (candidates.length === 0) return null;
    const lockedId = locks?.[lockKeyByCategory[categoryKey]];
    const picked = lockedId ? findById(candidates, lockedId) || picker(candidates) : picker(candidates);
    if (picked.meta.archetype && !lockedArchetype) lockedArchetype = picked.meta.archetype;
    character.push(picked);
    return picked;
  };

  const pickHairColor = (candidates) => {
    const mainstream = candidates.filter((item) => item.meta.tags.includes('mainstream_hair_color'));
    const special = candidates.filter((item) => item.meta.tags.includes('special_hair_color'));

    if (mainstream.length > 0 && (special.length === 0 || Math.random() < 0.88)) {
      return sample(mainstream);
    }

    return sample(special.length > 0 ? special : candidates);
  };

  const cloneCharacterRole = (item, role) => ({
    ...item,
    id: `${item.id}:${role}`,
    meta: { ...(item.meta || {}), characterRole: role },
  });

  const pickDistinctForRole = (categoryKey, role, lockedId, currentItems = [], picker = sample, predicate = () => true) => {
    const candidates = getByKey(catalog.character, categoryKey).filter(
      (item) => detailAllowed(item, context.framing) && predicate(item)
    );
    if (candidates.length === 0) return null;

    const locked = lockedId ? findById(candidates, lockedId) : null;
      if (locked) return cloneCharacterRole(locked, role);

    const usedIds = new Set(currentItems.map((item) => item?.id?.split(':')[0]).filter(Boolean));
    const distinct = candidates.filter((item) => !usedIds.has(item.id));
    const picked = picker(distinct.length > 0 ? distinct : candidates);
    return picked ? cloneCharacterRole(picked, role) : null;
  };

  pickCategory('體態 (Body Type)', context.locks, () => true, sample, false);

  if (context.subject.count === 1 && visibilityAtLeast(visibility, 'portrait')) {
    pickCategory('五官特徵 (Facial Features)', context.locks, (item) => !lockedArchetype || !item.meta.archetype || item.meta.archetype === lockedArchetype);
    if (context.locks?.skinDetailsId || Math.random() < 0.55) pickCategory('膚質特徵 (Skin Details)', context.locks);
  }

  if (context.subject.count === 2 && visibilityAtLeast(visibility, 'portrait')) {
    const faceA = pickDistinctForRole('五官特徵 (Facial Features)', 'a', context.locks?.facialFeaturesAId, [], sample);
    const faceB = pickDistinctForRole('五官特徵 (Facial Features)', 'b', context.locks?.facialFeaturesBId, [faceA], sample);
    if (faceA) character.push(faceA);
    if (faceB) character.push(faceB);
  }

  if (context.subject.count === 2 && visibilityAtLeast(visibility, 'portrait') && (context.locks?.skinDetailsId || Math.random() < 0.45)) {
    pickCategory('膚質特徵 (Skin Details)', context.locks);
  }

  if (visibilityAtLeast(visibility, 'medium') && context.subject.count === 1) {
    pickCategory('髮型 (Hairstyle)', context.locks);
    pickCategory('髮色 (Hair Color)', context.locks, () => true, pickHairColor);
  }

  if (visibilityAtLeast(visibility, 'medium') && context.subject.count === 2) {
    const hairA = pickDistinctForRole('髮型 (Hairstyle)', 'a', context.locks?.hairstyleAId, [], sample);
    const hairB = pickDistinctForRole('髮型 (Hairstyle)', 'b', context.locks?.hairstyleBId, [hairA], sample);
    if (hairA) character.push(hairA);
    if (hairB) character.push(hairB);

    const hairColorA = pickDistinctForRole('髮色 (Hair Color)', 'a', context.locks?.hairColorAId, [], pickHairColor);
    const hairColorB = pickDistinctForRole('髮色 (Hair Color)', 'b', context.locks?.hairColorBId, [hairColorA], pickHairColor);
    if (hairColorA) character.push(hairColorA);
    if (hairColorB) character.push(hairColorB);
  }

  const expression = pickCategory('神情與眼神 (Expression & Gaze)', context.locks, (item) => expressionSupportsComposition(item, context));

  if (context.subject.count > 1) return character;

  if (visibilityAtLeast(visibility, 'full')) {
    pickCategory('姿勢與肢體語言 (Pose & Body Language)', context.locks);
  } else if (!expression) {
    pickCategory('姿勢與肢體語言 (Pose & Body Language)', context.locks, (item) => detailAllowed(item, context.framing));
  }

  return character;
}

function buildWardrobe(context, locks, catalog) {
  const clonePresetForRole = (item, role) => ({
    ...item,
    id: `${item.id}:${role}`,
    meta: { ...(item.meta || {}), outfitRole: role },
  });

  if (context.subject.count === 2 && (locks.outfitPresetAId || locks.outfitPresetBId)) {
    const presets = catalog.flatCatalog.outfitPresets;
    const presetA = locks.outfitPresetAId ? findById(presets, locks.outfitPresetAId) : null;
    const presetB = locks.outfitPresetBId ? findById(presets, locks.outfitPresetBId) : null;
    const presetAIsNone = isNoneLikeItem(presetA);
    const presetBIsNone = isNoneLikeItem(presetB);

    const randomDistinctPreset = (excludeId) => {
      const candidates = presets.filter((item) => !isNoneLikeItem(item) && item.id !== excludeId);
      return sample(candidates.length > 0 ? candidates : presets);
    };

    const resolvedA = presetAIsNone ? null : presetA || (!locks.outfitPresetAId && presetB && !presetBIsNone ? randomDistinctPreset(presetB.id) : null);
    const resolvedB = presetBIsNone ? null : presetB || (!locks.outfitPresetBId && resolvedA ? randomDistinctPreset(resolvedA.id) : null);

    return [resolvedA ? clonePresetForRole(resolvedA, 'a') : null, resolvedB ? clonePresetForRole(resolvedB, 'b') : null].filter(Boolean);
  }

  const outfitPreset = locks.outfitPresetId ? findById(catalog.flatCatalog.outfitPresets, locks.outfitPresetId) : null;
  if (outfitPreset && !isNoneLikeItem(outfitPreset)) {
    return [outfitPreset];
  }

  const pieces = [];
  const visibility = context.framing.meta.visibility;
  const categoryLockMap = {
    '上身 (Tops)': 'topId',
    '褲裝 (Pants)': 'pantsId',
    '裙裝 (Skirts)': 'skirtId',
    '襪類 (Legwear)': 'legwearId',
    '外套 (Outerwear)': 'outerwearId',
    '鞋款 (Shoes)': 'shoesId',
    '飾品點綴 (Jewelry & Piercings)': 'jewelryIds',
  };

  const addPiece = (item) => {
    if (!item || pieces.some((piece) => piece.id === item.id)) return;
    pieces.push(item);
  };

  const maybePick = (categoryKey, probability = 1, extraPredicate = () => true) => {
    const lockKey = categoryLockMap[categoryKey];
    const categoryItems = getByKey(catalog.catalog.wardrobe, categoryKey);
    const lockedValue = locks?.[lockKey];

    if (Array.isArray(lockedValue) && lockedValue.length > 0) {
      const lockedItems = lockedValue.map((id) => findById(categoryItems, id)).filter(Boolean);
      const noneItem = lockedItems.find((item) => isNoneLikeItem(item));
      if (noneItem) {
        addPiece(noneItem);
        return [noneItem];
      }
      lockedItems.forEach(addPiece);
      return lockedItems;
    }

    const lockedItem = lockedValue ? findById(categoryItems, lockedValue) : null;

    if (lockedItem) {
      addPiece(lockedItem);
      return lockedItem;
    }

    if (Math.random() > probability) return null;

    const candidates = categoryItems.filter(
      (item) =>
        wardrobeFitsLocation(item, context.location) &&
        extraPredicate(item)
    );
    if (candidates.length === 0) return null;
    const picked = sample(candidates);
    addPiece(picked);
    return picked;
  };

  maybePick('上身 (Tops)');

  const hasLockedPants = Boolean(locks?.pantsId);
  const hasLockedSkirt = Boolean(locks?.skirtId);
  const hasLockedBottom = hasLockedPants || hasLockedSkirt;

  if (frameShowsAtLeast(visibility, 'medium') || hasLockedBottom) {
    if (hasLockedPants && hasLockedSkirt) {
      maybePick('褲裝 (Pants)');
      maybePick('裙裝 (Skirts)');
    } else if (hasLockedPants) {
      maybePick('褲裝 (Pants)');
    } else if (hasLockedSkirt) {
      maybePick('裙裝 (Skirts)');
    } else if (Math.random() < 0.5) {
      maybePick('褲裝 (Pants)');
    } else {
      maybePick('裙裝 (Skirts)');
    }
    maybePick('襪類 (Legwear)', 0.45, (item) => {
      if (item.meta.tags.includes('legwear') && item.en.includes('bare legs')) return true;
      if (pieces.some((piece) => piece.meta.tags.includes('pants'))) return item.en.includes('bare legs');
      return true;
    });
    maybePick('外套 (Outerwear)', context.location.meta.tags.includes('outdoor') ? 0.6 : 0.35);
  }

  if (frameShowsAtLeast(visibility, 'full') || locks?.shoesId) {
    maybePick('鞋款 (Shoes)');
  }

  maybePick('飾品點綴 (Jewelry & Piercings)', visibilityAtLeast(visibility, 'portrait') ? 0.65 : 0.45);

  return pieces;
}

function buildNegativePrompt(context, positiveTags, catalog) {
  const segments = [];

  const pushRandom = (categoryKey, predicate = () => true) => {
    const pool = getByKey(catalog.catalog.negative, categoryKey).filter((item) => !item.meta.conflictTags.some((tag) => positiveTags.includes(tag)) && predicate(item));
    if (pool.length > 0) segments.push(sample(pool).en);
  };

  pushRandom('通用人體防護');
  pushRandom('畫質與渲染防護');
  pushRandom('風格與寫實度防護');
  pushRandom('場景與物理防護');
  pushRandom('服裝與材質防護');

  if (context.location.meta.tags.includes('outdoor') && context.location.meta.tags.includes('natural')) {
    pushRandom('特定主題防護 (依需求加入)', (item) => item.meta.useTags.includes('avoid_horror') || item.en.includes('artificial light'));
  } else if (context.location.meta.tags.includes('heritage') || context.wardrobe.some((item) => ['victorian', 'baroque'].includes(item.meta.family))) {
    pushRandom('特定主題防護 (依需求加入)', (item) => item.meta.useTags.includes('period_piece'));
  } else {
    pushRandom(
      '特定主題防護 (依需求加入)',
      (item) => item.meta.useTags.includes('avoid_horror') || item.meta.useTags.includes('avoid_nsfw') || item.meta.useTags.includes('clean_background')
    );
  }

  return segments.join(', ');
}

function buildSummaryFields(context, wardrobe, character) {
  const characterBits = character.slice(1).filter((item) => item && item.zh && !isNoneLikeItem(item)).slice(0, 3).map((item) => item.zh);
  const subjectLabel = context.subject.count === 2 ? '兩位性感驚豔的日系或韓系女性' : '一位性感驚豔的日系或韓系女性';
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
  const styleLabel = context.style && !isNoneLikeItem(context.style) ? context.style.zh : '-';
  const locationLabel = context.location && !isNoneLikeItem(context.location) ? context.location.zh : '-';
  const framingLabel = context.framing && !isNoneLikeItem(context.framing) ? context.framing.zh : '-';
  const angleLabel = context.angle && !isNoneLikeItem(context.angle) ? context.angle.zh : '-';
  const orbitLabel = context.orbit && !isNoneLikeItem(context.orbit) ? context.orbit.zh : '-';
  const aspectRatioLabel = context.aspectRatio?.zh || '-';
  const lightingLabel = !context.styleDrivenCamera && context.lighting && !isNoneLikeItem(context.lighting) ? context.lighting.zh : '-';

  return {
    style: styleLabel,
    character: characterBits.length > 0 ? `${subjectLabel}, ${characterBits.join(', ')}` : subjectLabel,
    wardrobe: wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB
      ? [wardrobeSlots.outfitPresetA?.zh, wardrobeSlots.outfitPresetB?.zh].filter(Boolean).join(' / ')
      : wardrobeSlots.outfitPreset?.zh || wardrobe[0]?.zh || '-',
    location: locationLabel,
    camera: `${framingLabel} / ${angleLabel} / ${orbitLabel} / ${aspectRatioLabel}`,
    lighting: context.styleDrivenCamera ? '由攝影風格決定' : lightingLabel,
  };
}

function buildSummary(summaryFields) {
  return [
    `風格：${summaryFields.style}`,
    `人物：${summaryFields.character}`,
    `服裝：${summaryFields.wardrobe}`,
    `場景：${summaryFields.location}`,
    `鏡頭：${summaryFields.camera}`,
    `光影：${summaryFields.lighting}`,
  ].join(' | ');
}

function isNoneLikeItem(item) {
  if (!item) return true;
  const zh = stripMarkdown(item.zh || '');
  const en = stripMarkdown(item.en || '').toLowerCase();

  return (
    zh === '全無' ||
    en.startsWith('no ') ||
    en.includes(' no ') ||
    en.includes('bare legs') ||
    en.includes('barefoot styling') ||
    en === 'none'
  );
}

const STYLE_PROMPT_INTROS = {
  'Mika Ninagawa（蜷川實花）': 'Inspired by Mika Ninagawa, explosive hyper-saturated image language',
  'Yoshihiko Ueda（上田義彥）': 'Inspired by Yoshihiko Ueda, quiet natural image language',
  'Osamu Yokonami（橫浪修）': 'Inspired by Osamu Yokonami, high-key minimalist image language',
  'Rinko Kawauchi（川內倫子）': 'Inspired by Rinko Kawauchi, airy high-key image language',
  'Paolo Roversi（保羅・羅韋爾西）': 'Inspired by Paolo Roversi, soft haze editorial image language',
  'Ellen von Unwerth（艾倫・馮・昂沃斯）': 'Inspired by Ellen von Unwerth, playful sensual editorial image language',
  'Nan Goldin（南・戈爾丁）': 'Inspired by Nan Goldin, intimate lived-in image language',
  'Juergen Teller（尤爾根・特勒）': 'Inspired by Juergen Teller, raw direct-flash image language',
  'Richard Avedon（理察・阿維頓）': 'Inspired by Richard Avedon, stripped-down studio image language',
  'Alec Soth（亞歷克・索斯）': 'Inspired by Alec Soth, spacious documentary image language',
  'Sally Mann（莎莉・曼）': 'Inspired by Sally Mann, antique wet-plate image language',
  'Wolfgang Tillmans（沃夫岡・提爾曼斯）': 'Inspired by Wolfgang Tillmans, casual everyday image language',
  'Daido Moriyama（森山大道）': 'Inspired by Daido Moriyama, gritty high-contrast street image language',
  'Guy Bourdin（蓋・布爾丁）': 'Inspired by Guy Bourdin, bold narrative fashion image language',
  'Miles Aldridge（邁爾斯・奧爾德里奇）': 'Inspired by Miles Aldridge, hyper-stylized studio image language',
  'Elsa Bleda（艾爾莎·布萊達）': 'Inspired by Elsa Bleda, nocturnal neon image language',
};

const DUO_PROMPT_OVERRIDES = {
  framing: {
    '特寫鏡頭 (Close-Up)': 'tight two-subject framing, both women clearly visible, shoulder-up composition, intimate close composition',
    '中景鏡頭 (Medium Shot)': 'medium shot, waist-up two-subject framing, both women clearly visible, balanced composition',
    '牛仔中景 (Cowboy Shot)': 'cowboy shot, knee-up two-subject framing, balanced spacing between both women, both subjects clearly visible',
    '全身鏡頭 (Full Body Shot)': 'full body shot, full-length two-subject framing, both women fully visible, balanced side-by-side composition',
  },
  angle: {
    '平視角 (Eye-Level Angle)': 'eye-level angle, neutral two-subject perspective, both women equally readable',
    '仰角 (Low Angle)': 'low angle, looking slightly up at both women, shared dominant presence, elongated duo silhouette',
    '俯角 (High Angle)': 'high angle, looking down on both women, balanced two-subject framing, gentle foreshortening',
    '荷蘭角/傾斜 (Dutch Angle)': 'dutch angle, tilted two-subject framing, dynamic cinematic tension, both women held in frame',
  },
  orbit: {
    '正面 (Front View)': 'front-facing duo view, both women facing camera, balanced front composition',
    '正面 45 度 (Front Three-Quarter Left)': 'front three-quarter duo view, both women slightly angled toward camera, dimensional shared composition',
    '側面 90 度 (Left Profile)': 'side-by-side lateral duo view, both women readable in profile, balanced side composition',
    '背側 135 度 (Rear Three-Quarter Left)': 'rear three-quarter duo view, both women turned partly away, shared shoulder-line composition',
    '背面 180 度 (Back View)': 'back-facing duo view, both women turned away, shared silhouette composition from behind',
    '背側 225 度 (Rear Three-Quarter Right)': 'rear three-quarter duo view from the opposite side, both women partly turned away, balanced shared framing',
    '側面 270 度 (Right Profile)': 'side-by-side lateral duo view from the opposite side, both women readable in profile',
    '正面 315 度 (Front Three-Quarter Right)': 'front three-quarter duo view from the opposite side, both women slightly angled toward camera, balanced dimensional composition',
  },
  lightDirection: {
    '倫勃朗光/三角光 (Rembrandt Lighting)': 'soft directional light across both women, gentle sculpted contrast, balanced duo editorial lighting',
    '蝴蝶光/派拉蒙光 (Butterfly Lighting)': 'soft frontal beauty lighting across both women, even luminous facial highlights, balanced duo light',
    '輪廓光/背光 (Rim Light / Backlight)': 'backlit two-subject image, glowing edge light on both silhouettes, gentle separation from the background',
    '側光/陰陽光 (Split Lighting)': 'soft side light across both women, clean facial contrast, balanced duo editorial lighting',
    '窗縫光/百葉窗光 (Window / Blind Slits Light)': 'directional window light across both women, gentle layered indoor contrast, cinematic two-subject atmosphere',
    '頂光 (Top Lighting)': 'overhead top light across both women, moody duo cinematic contrast, tense cinematic atmosphere',
  },
  expression: {
    '直視鏡頭微笑': 'both women looking toward the camera, subtle shared smile, calm confident duo presence',
    '慵懶挑逗眼神': 'both women with relaxed seductive expressions, languid gaze, shared editorial chemistry',
    '淡漠高冷': 'both women with distant cool expressions, restrained emotion, composed duo presence',
    '望向遠方/若有所思': 'both women gazing away or slightly off-camera, thoughtful mood, quiet shared atmosphere',
    '大笑/自然喜悅': 'both women laughing naturally, candid joyful chemistry, lively duo energy',
    '慵懶出神/唇微開': 'both women with dreamy relaxed expressions, lips slightly parted, soft editorial mood',
  },
  pose: {
    '側身慵懶倚靠': 'two women leaning with relaxed asymmetry, effortless cool, natural shared balance',
    '坐姿/蜷縮 (脆弱感)': 'two women seated closely, curled relaxed posture, intimate introspective duo mood',
    '動態走路/動作殘影': 'two women walking together, dynamic movement, candid action shot',
    '高挑站姿': 'two women standing upright, confident posture, strong shared presence',
    '蹲姿前傾 (親近感)': 'two women crouching in a relaxed forward-leaning pose, approachable duo body language',
    '打開肩線微轉站姿': 'two women with open shoulders and slight body turns, balanced confident standing pose',
    '坐姿交叉腿': 'two women seated with composed crossed-leg posture, elegant shared body line',
    '抬手整理頭髮': 'two women adjusting their hair naturally, candid beauty gesture, soft shared movement',
    '托腮近距離姿勢': 'two women resting their faces lightly on their hands, intimate close duo pose',
    '放鬆坐姿': 'two women in a relaxed seated pose, soft natural posture, calm shared body language',
    '低頭垂視隨拍感': 'two women glancing downward in a candid off-guard posture, natural snapshot duo mood',
  },
};

function resolvePromptVariant(item, kind, subjectCount) {
  if (!item) return '';
  if (subjectCount !== 2) return item.en;
  return DUO_PROMPT_OVERRIDES[kind]?.[item.zh] || item.en;
}

function extractCharacterSlots(character) {
  const findSlot = (token) => character.find((item) => item.id?.includes(token));
  const findRoleSlot = (token, role) => character.find((item) => item.id?.includes(token) && item.meta?.characterRole === role);
  return {
    bodyType: findSlot('character:體態-body-type:'),
    facialFeatures: findSlot('character:五官特徵-facial-features:'),
    facialFeaturesA: findRoleSlot('character:五官特徵-facial-features:', 'a'),
    facialFeaturesB: findRoleSlot('character:五官特徵-facial-features:', 'b'),
    skinDetails: findSlot('character:膚質特徵-skin-details:'),
    hairstyle: findSlot('character:髮型-hairstyle:'),
    hairstyleA: findRoleSlot('character:髮型-hairstyle:', 'a'),
    hairstyleB: findRoleSlot('character:髮型-hairstyle:', 'b'),
    hairColor: findSlot('character:髮色-hair-color:'),
    hairColorA: findRoleSlot('character:髮色-hair-color:', 'a'),
    hairColorB: findRoleSlot('character:髮色-hair-color:', 'b'),
    expression: findSlot('character:神情與眼神-expression-gaze:'),
    pose: findSlot('character:姿勢與肢體語言-pose-body-language:'),
  };
}

function extractWardrobeSlots(wardrobe) {
  const findSlot = (token) => wardrobe.find((item) => item.id?.includes(token));
  const findSlots = (token) => wardrobe.filter((item) => item.id?.includes(token));
  const outfitPresets = findSlots('wardrobe:套裝-outfit-presets:');
  return {
    outfitPreset: outfitPresets.find((item) => !item.meta?.outfitRole) || null,
    outfitPresetA: outfitPresets.find((item) => item.meta?.outfitRole === 'a') || null,
    outfitPresetB: outfitPresets.find((item) => item.meta?.outfitRole === 'b') || null,
    top: findSlot('wardrobe:上身-tops:'),
    pants: findSlot('wardrobe:褲裝-pants:'),
    skirt: findSlot('wardrobe:裙裝-skirts:'),
    legwear: findSlot('wardrobe:襪類-legwear:'),
    outerwear: findSlot('wardrobe:外套-outerwear:'),
    shoes: findSlot('wardrobe:鞋款-shoes:'),
    jewelry: findSlots('wardrobe:飾品點綴-jewelry-piercings:'),
  };
}

function buildWardrobeColors(wardrobeSlots, locks) {
  if (wardrobeSlots.outfitPreset || wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB) {
    return { topColor: null, bottomColor: null };
  }
  const topColor = wardrobeSlots.top && !isNoneLikeItem(wardrobeSlots.top) ? getGarmentColorOption(locks?.topColorId) || sample(GARMENT_COLOR_OPTIONS) : null;
  const hasBottom = (wardrobeSlots.pants && !isNoneLikeItem(wardrobeSlots.pants)) || (wardrobeSlots.skirt && !isNoneLikeItem(wardrobeSlots.skirt));
  const bottomColor = hasBottom ? getGarmentColorOption(locks?.bottomColorId) || sample(GARMENT_COLOR_OPTIONS) : null;
  return { topColor, bottomColor };
}

function buildOutfitPresetPrompt(item) {
  if (!item || isNoneLikeItem(item)) return '';
  return item.en;
}

function compactClause(text, maxParts = 2) {
  if (!text) return '';
  return text
    .split(',')
    .map((part) => stripMarkdown(part))
    .filter(Boolean)
    .slice(0, maxParts)
    .join(', ');
}

function pushUniqueSegment(segments, value) {
  const cleaned = stripMarkdown(value);
  if (!cleaned) return;

  const normalized = cleaned.toLowerCase();
  if (segments.some((existing) => existing.toLowerCase() === normalized)) return;
  segments.push(cleaned);
}

function buildMidjourneyCharacterSegments(context, characterSlots, duoInteraction, duoStyling) {
  const segments = [context.subject.en];

  if (characterSlots.bodyType?.en && !isNoneLikeItem(characterSlots.bodyType)) pushUniqueSegment(segments, compactClause(characterSlots.bodyType.en, 2));
  if (context.subject.count === 2) {
    const womanA = [
      characterSlots.facialFeaturesA?.en && !isNoneLikeItem(characterSlots.facialFeaturesA) ? compactClause(characterSlots.facialFeaturesA.en, 1) : '',
      characterSlots.hairstyleA?.en && !isNoneLikeItem(characterSlots.hairstyleA) ? compactClause(characterSlots.hairstyleA.en, 1) : '',
      characterSlots.hairColorA?.en && !isNoneLikeItem(characterSlots.hairColorA) ? compactClause(characterSlots.hairColorA.en, 1) : '',
    ]
      .filter(Boolean)
      .join(', ');
    const womanB = [
      characterSlots.facialFeaturesB?.en && !isNoneLikeItem(characterSlots.facialFeaturesB) ? compactClause(characterSlots.facialFeaturesB.en, 1) : '',
      characterSlots.hairstyleB?.en && !isNoneLikeItem(characterSlots.hairstyleB) ? compactClause(characterSlots.hairstyleB.en, 1) : '',
      characterSlots.hairColorB?.en && !isNoneLikeItem(characterSlots.hairColorB) ? compactClause(characterSlots.hairColorB.en, 1) : '',
    ]
      .filter(Boolean)
      .join(', ');
    if (womanA) pushUniqueSegment(segments, `woman A, ${womanA}`);
    if (womanB) pushUniqueSegment(segments, `woman B, ${womanB}`);
  } else {
    if (characterSlots.facialFeatures?.en && !isNoneLikeItem(characterSlots.facialFeatures)) pushUniqueSegment(segments, compactClause(characterSlots.facialFeatures.en, 2));
    if (characterSlots.hairstyle?.en && !isNoneLikeItem(characterSlots.hairstyle)) pushUniqueSegment(segments, compactClause(characterSlots.hairstyle.en, 1));
    if (characterSlots.hairColor?.en && !isNoneLikeItem(characterSlots.hairColor)) pushUniqueSegment(segments, compactClause(characterSlots.hairColor.en, 1));
  }

  if (context.framing.meta.visibility !== 'full' && characterSlots.expression?.en && !isNoneLikeItem(characterSlots.expression)) {
    pushUniqueSegment(segments, compactClause(resolvePromptVariant(characterSlots.expression, 'expression', context.subject.count), 1));
  }

  if (characterSlots.pose?.en && !isNoneLikeItem(characterSlots.pose) && context.framing.meta.visibility !== 'portrait') {
    pushUniqueSegment(segments, compactClause(resolvePromptVariant(characterSlots.pose, 'pose', context.subject.count), 1));
  }

  if (context.subject.count === 2 && duoInteraction?.en) {
    pushUniqueSegment(segments, compactClause(duoInteraction.en, 1));
  }

  if (context.subject.count === 2) {
    pushUniqueSegment(segments, 'clearly distinct women, not identical twins, individual facial character');
    if (duoStyling?.en) pushUniqueSegment(segments, compactClause(duoStyling.en, 1));
  }

  return segments;
}

function buildMidjourneyCameraSegments(context, lightDirection, film) {
  const segments = [];

  if (context.style && !isNoneLikeItem(context.style)) {
    pushUniqueSegment(segments, compactClause(STYLE_PROMPT_INTROS[context.style.zh] || context.style.en, 1));
  }
  if (context.location && !isNoneLikeItem(context.location)) {
    pushUniqueSegment(segments, compactClause(context.location.en, 2));
  }
  if (context.framing && !isNoneLikeItem(context.framing)) {
    pushUniqueSegment(segments, compactClause(resolvePromptVariant(context.framing, 'framing', context.subject.count), 1));
  }

  const angleText = context.angle && !isNoneLikeItem(context.angle) ? compactClause(resolvePromptVariant(context.angle, 'angle', context.subject.count), 1) : '';
  const orbitText = context.orbit && !isNoneLikeItem(context.orbit) ? compactClause(resolvePromptVariant(context.orbit, 'orbit', context.subject.count), 1) : '';
  if (orbitText && !orbitText.toLowerCase().includes('front-facing')) {
    pushUniqueSegment(segments, orbitText);
  }
  if (angleText && !(orbitText && orbitText.toLowerCase().includes('back view') && angleText.toLowerCase().includes('direct eye contact'))) {
    pushUniqueSegment(segments, angleText);
  }

  if (context.subject.count > 1) {
    pushUniqueSegment(segments, compactClause(buildCompositionHint(context.subject, context.aspectRatio, context.framing), 1));
  }

  if (!context.styleDrivenCamera && context.lighting?.en && !isNoneLikeItem(context.lighting)) {
    pushUniqueSegment(segments, compactClause(context.lighting.en, 2));
  }
  if (!context.styleDrivenCamera && lightDirection?.en && !isNoneLikeItem(lightDirection)) {
    pushUniqueSegment(segments, compactClause(resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count), 2));
  }
  if (!context.styleDrivenCamera && film?.en && !isNoneLikeItem(film)) {
    pushUniqueSegment(segments, compactClause(film.en, 1));
  }

  return segments;
}

function applyColorToGarment(item, color) {
  if (!item?.en) return '';
  const garment = compactClause(item.en, 1);
  if (!garment) return '';
  return color?.en ? `${color.en} ${garment}` : garment;
}

function buildMidjourneyWardrobeSegments(wardrobe, wardrobeColors) {
  const slots = extractWardrobeSlots(wardrobe);
  const segments = [];

  if (slots.outfitPresetA?.en || slots.outfitPresetB?.en) {
    if (slots.outfitPresetA?.en) pushUniqueSegment(segments, `woman A ${compactClause(slots.outfitPresetA.en, 1)}`);
    if (slots.outfitPresetB?.en) pushUniqueSegment(segments, `woman B ${compactClause(slots.outfitPresetB.en, 1)}`);
    return segments;
  }

  if (slots.outfitPreset?.en) {
    pushUniqueSegment(segments, compactClause(slots.outfitPreset.en, 1));
    return segments;
  }

  pushUniqueSegment(segments, applyColorToGarment(slots.top, wardrobeColors.topColor));
  pushUniqueSegment(segments, applyColorToGarment(slots.pants, wardrobeColors.bottomColor));
  pushUniqueSegment(segments, applyColorToGarment(slots.skirt, wardrobeColors.bottomColor));
  [slots.legwear, slots.outerwear, slots.shoes].forEach((item) => pushUniqueSegment(segments, compactClause(item?.en, 1)));
  slots.jewelry.filter((item) => !isNoneLikeItem(item)).forEach((item) => pushUniqueSegment(segments, compactClause(item?.en, 1)));

  return segments;
}

function buildStructuredGrokPrompt(context, character, wardrobe, wardrobeColors, lightDirection, film, duoInteraction, duoStyling) {
  const styleIntro = STYLE_PROMPT_INTROS[context.style.zh] || 'editorial photography mood';
  const characterSlots = extractCharacterSlots(character);
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
  const expressionAndPose = [
    characterSlots.expression ? resolvePromptVariant(characterSlots.expression, 'expression', context.subject.count) : '',
    characterSlots.pose ? resolvePromptVariant(characterSlots.pose, 'pose', context.subject.count) : '',
  ]
    .filter(Boolean)
    .join(', ');
  const lines = [];
  const addLine = (label, value) => {
    if (!value) return;
    lines.push(`${label}: ${value}`);
  };
  const addItemLine = (label, item) => {
    if (!item || isNoneLikeItem(item)) return;
    addLine(label, item.en);
  };
  const addContextLine = (label, item, formatter = (entry) => entry.en) => {
    if (!item || isNoneLikeItem(item)) return;
    addLine(label, formatter(item));
  };

  addLine('Subject Count', context.subject.en);
  addLine('Aspect Ratio', context.aspectRatio.en);
  if (context.style && !isNoneLikeItem(context.style)) {
    addLine('Photography Style', `${styleIntro}. ${context.style.en}`);
  }
  addContextLine('Location', context.location);
  if (wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB) {
    addLine('Outfit Preset A', buildOutfitPresetPrompt(wardrobeSlots.outfitPresetA));
    addLine('Outfit Preset B', buildOutfitPresetPrompt(wardrobeSlots.outfitPresetB));
  } else if (wardrobeSlots.outfitPreset) {
    addLine('Outfit Preset', buildOutfitPresetPrompt(wardrobeSlots.outfitPreset));
  }
  if (context.subject.count === 2) addLine('Duo Styling', duoStyling?.en);
  addContextLine('Framing', context.framing, (item) => resolvePromptVariant(item, 'framing', context.subject.count));
  addContextLine('Angle', context.angle, (item) => resolvePromptVariant(item, 'angle', context.subject.count));
  addContextLine('Orbit Angle', context.orbit, (item) => resolvePromptVariant(item, 'orbit', context.subject.count));
  if (!context.styleDrivenCamera) {
    addContextLine('Lighting', context.lighting);
    addContextLine('Light Direction', lightDirection, (item) => resolvePromptVariant(item, 'lightDirection', context.subject.count));
    addContextLine('Film', film);
  }
  addItemLine('Body Type', characterSlots.bodyType);
  if (context.subject.count === 2) {
    addItemLine('Facial Features A', characterSlots.facialFeaturesA);
    addItemLine('Facial Features B', characterSlots.facialFeaturesB);
  } else {
    addItemLine('Facial Features', characterSlots.facialFeatures);
  }
  addItemLine('Skin Details', characterSlots.skinDetails);
  if (context.subject.count === 2) {
    addItemLine('Hairstyle A', characterSlots.hairstyleA);
    addItemLine('Hairstyle B', characterSlots.hairstyleB);
    addItemLine('Hair Color A', characterSlots.hairColorA);
    addItemLine('Hair Color B', characterSlots.hairColorB);
  } else {
    addItemLine('Hairstyle', characterSlots.hairstyle);
    addItemLine('Hair Color', characterSlots.hairColor);
  }
  if (context.subject.count === 2) addLine('Duo Interaction', duoInteraction?.en);
  addLine('Expression and Pose', expressionAndPose);
  if (!wardrobeSlots.outfitPreset && !wardrobeSlots.outfitPresetA && !wardrobeSlots.outfitPresetB) {
    addItemLine('Top', wardrobeSlots.top);
    addLine('Top Color', wardrobeColors.topColor?.en);
    addItemLine('Pants', wardrobeSlots.pants);
    addItemLine('Skirt', wardrobeSlots.skirt);
    addLine('Bottom Color', wardrobeColors.bottomColor?.en);
    addItemLine('Legwear', wardrobeSlots.legwear);
    addItemLine('Outerwear', wardrobeSlots.outerwear);
    addItemLine('Shoes', wardrobeSlots.shoes);
    addLine(
      'Jewelry and Piercings',
      wardrobeSlots.jewelry.filter((item) => !isNoneLikeItem(item)).length > 0
        ? wardrobeSlots.jewelry.filter((item) => !isNoneLikeItem(item)).map((item) => item.en).join(', ')
        : ''
    );
  }

  return lines.join('\n');
}

function buildPrompts(context, character, wardrobe, wardrobeColors, lightDirection, film, effect, duoInteraction, duoStyling) {
  const characterSlots = extractCharacterSlots(character);
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
  const midjourneySegments = [];
  const hasOutfitPreset = Boolean(wardrobeSlots.outfitPreset || wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB);
  const cameraSegments = buildMidjourneyCameraSegments(context, lightDirection, film);

  if (hasOutfitPreset) {
    cameraSegments.slice(0, 3).forEach((segment) => pushUniqueSegment(midjourneySegments, segment));
    buildMidjourneyWardrobeSegments(wardrobe, wardrobeColors).forEach((segment) => pushUniqueSegment(midjourneySegments, segment));
    buildMidjourneyCharacterSegments(context, characterSlots, duoInteraction, duoStyling).forEach((segment) => pushUniqueSegment(midjourneySegments, segment));
    cameraSegments.slice(3).forEach((segment) => pushUniqueSegment(midjourneySegments, segment));
  } else {
    cameraSegments.forEach((segment) => pushUniqueSegment(midjourneySegments, segment));
    buildMidjourneyCharacterSegments(context, characterSlots, duoInteraction, duoStyling).forEach((segment) => pushUniqueSegment(midjourneySegments, segment));
    buildMidjourneyWardrobeSegments(wardrobe, wardrobeColors).forEach((segment) => pushUniqueSegment(midjourneySegments, segment));
  }
  if (effect?.en) pushUniqueSegment(midjourneySegments, compactClause(effect.en, 1));

  let midjourneyPrompt = '';
  for (const segment of midjourneySegments) {
    const next = midjourneyPrompt ? `${midjourneyPrompt}, ${segment}` : segment;
    if (next.length > 650) break;
    midjourneyPrompt = next;
  }
  midjourneyPrompt = `${midjourneyPrompt} --ar ${context.aspectRatio.en}`;

  const grokPrompt = buildStructuredGrokPrompt(context, character, wardrobe, wardrobeColors, lightDirection, film, duoInteraction, duoStyling);

  return { midjourneyPrompt, grokPrompt };
}

function buildSelectionSnapshot(context, wardrobe, wardrobeColors, character, lightDirection, film, duoInteraction, duoStyling) {
  const characterSlots = extractCharacterSlots(character);
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
  return {
    subjectCount: context.subject.id,
    aspectRatio: context.aspectRatio.id,
    styleId: context.style.id,
    locationId: context.location.id,
    framingId: context.framing.id,
    angleId: context.angle.id,
    orbitId: context.orbit.id,
    lightingId: context.styleDrivenCamera ? '' : context.lighting?.id || '',
    lightDirectionId: context.styleDrivenCamera ? '' : lightDirection?.id || '',
    filmId: context.styleDrivenCamera ? '' : film?.id || '',
    outfitPresetId: wardrobeSlots.outfitPreset?.id || '',
    outfitPresetAId: wardrobeSlots.outfitPresetA?.id?.replace(/:a$/, '') || '',
    outfitPresetBId: wardrobeSlots.outfitPresetB?.id?.replace(/:b$/, '') || '',
    bodyTypeId: characterSlots.bodyType?.id || '',
    facialFeaturesId: characterSlots.facialFeatures?.id || '',
    facialFeaturesAId: characterSlots.facialFeaturesA?.id?.replace(/:a$/, '') || '',
    facialFeaturesBId: characterSlots.facialFeaturesB?.id?.replace(/:b$/, '') || '',
    skinDetailsId: characterSlots.skinDetails?.id || '',
    hairstyleId: characterSlots.hairstyle?.id || '',
    hairstyleAId: characterSlots.hairstyleA?.id?.replace(/:a$/, '') || '',
    hairstyleBId: characterSlots.hairstyleB?.id?.replace(/:b$/, '') || '',
    hairColorId: characterSlots.hairColor?.id || '',
    hairColorAId: characterSlots.hairColorA?.id?.replace(/:a$/, '') || '',
    hairColorBId: characterSlots.hairColorB?.id?.replace(/:b$/, '') || '',
    duoInteractionId: duoInteraction?.id || '',
    expressionId: characterSlots.expression?.id || '',
    poseId: characterSlots.pose?.id || '',
    topId: wardrobeSlots.top?.id || '',
    topColorId: wardrobeColors.topColor?.id || '',
    duoStylingId: duoStyling?.id || '',
    pantsId: wardrobeSlots.pants?.id || '',
    skirtId: wardrobeSlots.skirt?.id || '',
    bottomColorId: wardrobeColors.bottomColor?.id || '',
    legwearId: wardrobeSlots.legwear?.id || '',
    outerwearId: wardrobeSlots.outerwear?.id || '',
    shoesId: wardrobeSlots.shoes?.id || '',
    jewelryIds: wardrobeSlots.jewelry.map((item) => item.id),
  };
}

export function buildLocksFromPrompt(prompt, keepKeys = []) {
  const base = createEmptyLocks();
  REQUIRED_LOCK_KEYS.forEach((key) => {
    base[key] = prompt.selection?.[key] || base[key];
  });
  keepKeys.forEach((key) => {
    if (key === 'jewelryIds') {
      base[key] = Array.isArray(prompt.selection?.[key]) ? prompt.selection[key] : [];
    } else {
      base[key] = prompt.selection?.[key] || '';
    }
  });
  return base;
}

function generateSinglePrompt(index, locks, customLibrary) {
  const runtime = buildCatalog(customLibrary);
  const lockedStyle = locks.styleId ? findById(runtime.flatCatalog.regional, locks.styleId) : null;
  const styleDrivenCamera = Boolean(lockedStyle && !isNoneLikeItem(lockedStyle));
  const effectiveLocks = styleDrivenCamera
    ? {
        ...locks,
        lightingId: '',
        lightDirectionId: '',
        filmId: '',
      }
    : locks;
  const subject = getSubjectOption(effectiveLocks.subjectCount);
  const aspectRatio = getAspectRatioOption(effectiveLocks.aspectRatio);
  const lowFrequencyPicker = (tag) => (candidates) => {
    const regular = candidates.filter((item) => !item.meta.tags?.includes(tag));
    const lowFrequency = candidates.filter((item) => item.meta.tags?.includes(tag));

    if (regular.length > 0 && (lowFrequency.length === 0 || Math.random() < 0.88)) {
      return sample(regular);
    }

    return sample(lowFrequency.length > 0 ? lowFrequency : candidates);
  };
  const location = pickWithLock(runtime.flatCatalog.locations, effectiveLocks.locationId);
  const style = pickWithLock(runtime.flatCatalog.regional, effectiveLocks.styleId, (item) => styleFitsLocation(item, location));
  const framing = pickWithLock(
    runtime.flatCatalog.framing,
    effectiveLocks.framingId,
    (item) => !(location.meta.tags.includes('club') && item.meta.visibility === 'close') && framingSupportsSubject(item, subject, aspectRatio)
  );
  const angle = pickWithLock(runtime.flatCatalog.angle, effectiveLocks.angleId, (item) => framingSupportsAngle(framing, item), lowFrequencyPicker('low_frequency_angle'));
  const orbit = pickWithLock(runtime.flatCatalog.orbit, effectiveLocks.orbitId);
  const lighting = styleDrivenCamera
    ? null
    : pickWithLock(runtime.flatCatalog.lighting, effectiveLocks.lightingId, (item) => locationSupportsLighting(location, item));
  const lightDirection = styleDrivenCamera || !lighting
    ? null
    : pickWithLock(runtime.flatCatalog.lightDirection, effectiveLocks.lightDirectionId, (item) => lightDirectionSupportsScene(item, framing, location, lighting));
  const film = styleDrivenCamera ? null : pickWithLock(runtime.flatCatalog.film, effectiveLocks.filmId, () => true, lowFrequencyPicker('low_frequency_film'));
  const effect = Math.random() > 0.65 ? sample(runtime.flatCatalog.effects) : null;
  const duoInteraction = subject.count === 2 ? getDuoInteractionOption(effectiveLocks.duoInteractionId) || sample(DUO_INTERACTION_OPTIONS) : null;
  const duoStyling = subject.count === 2 ? getDuoStylingOption(effectiveLocks.duoStylingId) || sample(DUO_STYLING_OPTIONS) : null;

  const context = { subject, aspectRatio, style, location, framing, angle, orbit, lighting, locks: effectiveLocks, styleDrivenCamera };
  const character = buildCharacter(context, runtime.catalog);
  const wardrobe = buildWardrobe({ ...context }, effectiveLocks, runtime);
  context.wardrobe = wardrobe;
  const wardrobeColors = buildWardrobeColors(extractWardrobeSlots(wardrobe), effectiveLocks);

  const positiveTags = collectPositiveTags(style, location, framing, angle, lighting, lightDirection, film, effect, wardrobe, character);
  const negativePrompt = buildNegativePrompt(context, positiveTags, runtime);
  const { midjourneyPrompt, grokPrompt } = buildPrompts(context, character, wardrobe, wardrobeColors, lightDirection, film, effect, duoInteraction, duoStyling);
  const summaryFields = buildSummaryFields(context, wardrobe, character);

  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    summary: buildSummary(summaryFields),
    summaryFields,
    midjourneyPrompt,
    grokPrompt,
    negativePrompt,
    selection: buildSelectionSnapshot(context, wardrobe, wardrobeColors, character, lightDirection, film, duoInteraction, duoStyling),
    structured: {
      Style: [style],
      Character: character,
      Wardrobe: wardrobe,
      Location: [location],
      Framing: [framing, angle, orbit],
      Lighting: [lighting, lightDirection].filter(Boolean),
      'Camera & Film': [film, effect].filter(Boolean),
    },
  };
}

export function generatePrompts(count = 1, locks = createEmptyLocks(), customLibrary = []) {
  return Array.from({ length: count }, (_, index) => generateSinglePrompt(index, locks, customLibrary));
}
