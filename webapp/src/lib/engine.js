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

const LOCK_DEFINITIONS = [
  { key: 'subjectCount', label: '人物數量', options: SUBJECT_COUNT_OPTIONS, required: true, defaultValue: '1', section: 'core' },
  { key: 'aspectRatio', label: '畫面比例', options: ASPECT_RATIO_OPTIONS, required: true, defaultValue: '4:5', section: 'core' },
  { key: 'styleId', label: '攝影風格', category: '攝影風格', section: 'core' },
  { key: 'locationId', label: '場景', category: null, section: 'core' },
  { key: 'wardrobeVibeId', label: '服裝基調', category: '風格基調 (Vibe)', section: 'core' },
  { key: 'framingId', label: '構圖景別', category: '景別構圖 (Framing)', section: 'core' },
  { key: 'angleId', label: '俯仰角度', category: '相機視角 (Angle)', section: 'core' },
  { key: 'orbitId', label: '環繞角度', category: '拍攝方位 (Orbit Angle)', section: 'core' },
  { key: 'lightingId', label: '光線類型', category: '光線類型 (Lighting Type)', section: 'core' },
  { key: 'lightDirectionId', label: '光線方向', category: '光線方向與質感 (Light Direction & Quality)', section: 'core' },
  { key: 'filmId', label: '成像風格', category: '底片與相機模擬 (Camera & Film Simulation)', section: 'core' },
  { key: 'bodyTypeId', label: '體態', category: '體態 (Body Type)', section: 'character' },
  { key: 'facialFeaturesId', label: '五官特徵', category: '五官特徵 (Facial Features)', section: 'character' },
  { key: 'skinDetailsId', label: '膚質特徵', category: '膚質特徵 (Skin Details)', section: 'character' },
  { key: 'hairstyleId', label: '髮型', category: '髮型 (Hairstyle)', section: 'character' },
  { key: 'hairColorId', label: '髮色', category: '髮色 (Hair Color)', section: 'character' },
  { key: 'expressionId', label: '神情眼神', category: '神情與眼神 (Expression & Gaze)', section: 'character' },
  { key: 'poseId', label: '姿勢動作', category: '姿勢與肢體語言 (Pose & Body Language)', section: 'character' },
  { key: 'topId', label: '上身', category: '上身 (Tops)', section: 'wardrobe' },
  { key: 'topColorId', label: '上身配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'pantsId', label: '褲裝', category: '褲裝 (Pants)', section: 'wardrobe' },
  { key: 'skirtId', label: '裙裝', category: '裙裝 (Skirts)', section: 'wardrobe' },
  { key: 'bottomColorId', label: '下身配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'legwearId', label: '襪類', category: '襪類 (Legwear)', section: 'wardrobe' },
  { key: 'outerwearId', label: '外套', category: '外套 (Outerwear)', section: 'wardrobe' },
  { key: 'shoesId', label: '鞋款', category: '鞋款 (Shoes)', section: 'wardrobe' },
  { key: 'jewelryIds', label: '飾品點綴', category: '飾品點綴 (Jewelry & Piercings)', section: 'wardrobe', multi: true, defaultValue: [] },
];

const REQUIRED_LOCK_KEYS = LOCK_DEFINITIONS.filter((definition) => definition.required).map((definition) => definition.key);

const PARTIAL_REROLL_OPTIONS = [
  { key: 'styleId', label: 'Style' },
  { key: 'locationId', label: 'Location' },
  { key: 'framingId', label: 'Framing' },
  { key: 'angleId', label: 'Angle' },
  { key: 'orbitId', label: 'Orbit' },
  { key: 'lightingId', label: 'Lighting' },
  { key: 'lightDirectionId', label: 'Light Direction' },
  { key: 'filmId', label: 'Film' },
  { key: 'wardrobeVibeId', label: 'Wardrobe' },
  { key: 'bodyTypeId', label: 'Body Type' },
  { key: 'facialFeaturesId', label: 'Face' },
  { key: 'skinDetailsId', label: 'Skin' },
  { key: 'hairstyleId', label: 'Hair Style' },
  { key: 'hairColorId', label: 'Hair Color' },
  { key: 'expressionId', label: 'Expression' },
  { key: 'poseId', label: 'Pose' },
  { key: 'topId', label: 'Top' },
  { key: 'topColorId', label: 'Top Color' },
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
  if (hasAny(haystack, ['clean backdrop portrait', '純背景凝視'])) tags.push('studio_bias', 'minimal', 'controlled', 'editorial');
  if (hasAny(haystack, ['quiet documentary portrait', 'american road atmosphere', '空曠美式'])) tags.push('natural_bias', 'outdoor_bias', 'documentary', 'soft_grade');
  if (hasAny(haystack, ['wet plate inspired', '古典濕版'])) tags.push('monochrome', 'moody', 'natural_bias', 'heritage_bias', 'low_frequency_style');
  if (hasAny(haystack, ['casual youthful portrait', '青春日常隨拍'])) tags.push('natural_light_bias', 'urban_bias', 'lively', 'indoor_bias');
  if (hasAny(haystack, ['high contrast black and white', '高反差黑白街頭'])) tags.push('monochrome', 'urban_bias', 'night_bias', 'raw', 'low_frequency_style');
  if (hasAny(haystack, ['bold narrative fashion', '危險敘事'])) tags.push('dramatic', 'set_bias', 'studio_bias', 'high_saturation');
  if (hasAny(haystack, ['hyper-stylized fashion portrait', '濃彩復古電影棚拍'])) tags.push('studio_bias', 'set_bias', 'high_saturation', 'artificial_light');

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
      wardrobeVibe: getByKey(catalog.wardrobe, '風格基調 (Vibe)'),
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
  const normalized = {
    ...createEmptyLocks(),
    ...(rawLocks || {}),
  };

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
      if (definition.key === 'wardrobeVibeId') options = flatCatalog.wardrobeVibe;
      if (definition.key === 'bodyTypeId') options = getByKey(catalog.character, '體態 (Body Type)');
      if (definition.key === 'facialFeaturesId') options = getByKey(catalog.character, '五官特徵 (Facial Features)');
      if (definition.key === 'skinDetailsId') options = getByKey(catalog.character, '膚質特徵 (Skin Details)');
      if (definition.key === 'hairstyleId') options = getByKey(catalog.character, '髮型 (Hairstyle)');
      if (definition.key === 'hairColorId') options = getByKey(catalog.character, '髮色 (Hair Color)');
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

function familyCompatible(primaryFamily, candidateFamily) {
  if (!primaryFamily || primaryFamily === 'neutral') return candidateFamily === 'neutral';
  return candidateFamily === 'neutral' || candidateFamily === primaryFamily;
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

function styleFitsWardrobeVibe(style, vibe) {
  const styleTags = new Set(style.meta.tags);
  const family = vibe.meta.family;

  if (styleTags.has('studio_bias') || styleTags.has('soft_grade')) {
    if (['industrial', 'military', 'cyberpunk', 'bdsm'].includes(family)) return false;
  }

  if (styleTags.has('neon') || styleTags.has('urban_bias') || styleTags.has('night_bias')) {
    if (['lolita', 'victorian', 'baroque', 'schoolgirl'].includes(family)) return false;
  }

  if (styleTags.has('heritage_bias')) {
    if (!['victorian', 'baroque', 'minimal', 'parisian'].includes(family)) return false;
  }

  if (styleTags.has('high_saturation') || styleTags.has('dreamlike')) {
    if (['military', 'industrial'].includes(family)) return false;
  }

  if (styleTags.has('documentary') || styleTags.has('natural_bias') || styleTags.has('outdoor_bias')) {
    if (['baroque', 'victorian', 'lolita', 'bdsm'].includes(family)) return false;
  }

  if (styleTags.has('minimal')) {
    if (['bdsm', 'cyberpunk', 'industrial', 'lolita'].includes(family)) return false;
  }

  return true;
}

function wardrobePieceFitsFamily(item, family, categoryKey, location) {
  const tags = new Set(item.meta.tags);
  const locationTags = new Set(location.meta.tags);

  if (family === 'swimwear') {
    if (!(locationTags.has('outdoor') || item.en.includes('bare legs'))) return false;
    if (categoryKey === '外套 (Outerwear)' || categoryKey === '襪類 (Legwear)') return item.en.includes('bare legs');
    if (categoryKey === '褲裝 (Pants)') return false;
    if (categoryKey === '裙裝 (Skirts)' && !item.en.includes('bare')) return false;
  }

  if (family === 'lingerie') {
    if (categoryKey === '上身 (Tops)' && !(item.meta.tags.includes('revealing') || item.meta.tags.includes('elegant'))) return false;
    if (categoryKey === '褲裝 (Pants)' && !tags.has('elegant')) return false;
    if (categoryKey === '外套 (Outerwear)' && !(tags.has('elegant') || item.en.includes('blazer'))) return false;
    if (categoryKey === '鞋款 (Shoes)' && !(tags.has('elegant') || item.en.includes('stilettos') || item.en.includes('heels') || item.en.includes('boots'))) return false;
  }

  if (family === 'lolita') {
    if (categoryKey === '上身 (Tops)' && !(tags.has('romantic') || tags.has('uniform') || tags.has('ornate'))) return false;
    if (categoryKey === '褲裝 (Pants)') return false;
    if (categoryKey === '裙裝 (Skirts)' && !tags.has('romantic')) return false;
    if (categoryKey === '鞋款 (Shoes)' && !item.en.includes('Mary Jane') && !item.zh.includes('瑪莉珍')) return false;
    if (categoryKey === '外套 (Outerwear)' && !tags.has('heritage')) return false;
  }

  if (family === 'schoolgirl') {
    if (categoryKey === '上身 (Tops)' && !(tags.has('uniform') || tags.has('casual'))) return false;
    if (categoryKey === '褲裝 (Pants)') return false;
    if (categoryKey === '裙裝 (Skirts)' && !tags.has('uniform')) return false;
    if (categoryKey === '襪類 (Legwear)' && !(tags.has('uniform') || item.en.includes('bare legs'))) return false;
    if (categoryKey === '鞋款 (Shoes)' && !(tags.has('uniform') || tags.has('casual') || item.zh.includes('樂福'))) return false;
  }

  if (['techwear', 'industrial', 'military'].includes(family)) {
    if (categoryKey === '上身 (Tops)' && !(tags.has('utilitarian') || tags.has('casual') || tags.has('futuristic') || tags.has('edgy'))) return false;
    if (categoryKey === '裙裝 (Skirts)' && !item.en.includes('bare')) return false;
    if (categoryKey === '鞋款 (Shoes)' && !(tags.has('edgy') || tags.has('futuristic') || item.zh.includes('老爹鞋'))) return false;
  }

  if (['baroque', 'victorian'].includes(family)) {
    if (categoryKey === '上身 (Tops)' && !(tags.has('heritage') || tags.has('ornate') || tags.has('romantic'))) return false;
    if (categoryKey === '褲裝 (Pants)' && !tags.has('elegant')) return false;
    if (categoryKey === '裙裝 (Skirts)' && !(tags.has('heritage') || tags.has('romantic') || tags.has('elegant'))) return false;
    if (categoryKey === '外套 (Outerwear)' && !tags.has('heritage')) return false;
  }

  if (family === 'minimal' || family === 'parisian') {
    if (categoryKey === '上身 (Tops)' && (tags.has('futuristic') || tags.has('edgy') || tags.has('uniform'))) return false;
    if (categoryKey === '外套 (Outerwear)' && tags.has('heritage')) return false;
    if (categoryKey === '飾品點綴 (Jewelry & Piercings)' && tags.has('edgy_accessory')) return false;
  }

  if (family === 'cyberpunk') {
    if (categoryKey === '上身 (Tops)' && !(tags.has('futuristic') || tags.has('edgy') || tags.has('utilitarian'))) return false;
    if (categoryKey === '鞋款 (Shoes)' && !(tags.has('futuristic') || tags.has('edgy'))) return false;
  }

  return true;
}

function shouldPreferSkirt(family) {
  return ['lolita', 'schoolgirl', 'lingerie', 'victorian', 'baroque'].includes(family);
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
    const duoHint = aspectRatio.id === '16:9' ? 'balanced duo composition with clear spacing between both women' : 'balanced two-subject portrait composition';
    if (framing.meta.visibility === 'wide') return `${duoHint}, both women fully readable in frame`;
    if (framing.meta.visibility === 'full') return `${duoHint}, both women standing naturally in frame`;
    return `${duoHint}, both women clearly visible`;
  }

  if (aspectRatio.id === '9:16') return 'single-subject vertical composition';
  if (aspectRatio.id === '16:9') return 'single-subject cinematic wide composition';
  return 'single-subject portrait composition';
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

  pickCategory('體態 (Body Type)', context.locks, () => true, sample, false);

  if (context.subject.count === 1 && visibilityAtLeast(visibility, 'portrait')) {
    pickCategory('五官特徵 (Facial Features)', context.locks, (item) => !lockedArchetype || !item.meta.archetype || item.meta.archetype === lockedArchetype);
    if (context.locks?.skinDetailsId || Math.random() < 0.55) pickCategory('膚質特徵 (Skin Details)', context.locks);
  }

  if (visibilityAtLeast(visibility, 'medium')) {
    pickCategory('髮型 (Hairstyle)', context.locks);
    pickCategory('髮色 (Hair Color)', context.locks, () => true, pickHairColor);
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
  const vibe = pickWithLock(
    catalog.flatCatalog.wardrobeVibe,
    locks.wardrobeVibeId,
    (item) => wardrobeFitsLocation(item, context.location) && styleFitsWardrobeVibe(context.style, item)
  );
  const family = vibe.meta.family;
  const pieces = [vibe];
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
        familyCompatible(family, item.meta.family) &&
        wardrobeFitsLocation(item, context.location) &&
        wardrobePieceFitsFamily(item, family, categoryKey, context.location) &&
        extraPredicate(item)
    );
    if (candidates.length === 0) return null;
    const picked = sample(candidates);
    addPiece(picked);
    return picked;
  };

  maybePick('上身 (Tops)');

  const hasLockedBottom = Boolean(locks?.pantsId || locks?.skirtId);

  if (frameShowsAtLeast(visibility, 'medium') || hasLockedBottom) {
    if (hasLockedBottom) {
      maybePick('褲裝 (Pants)');
      maybePick('裙裝 (Skirts)');
    } else if (shouldPreferSkirt(family)) {
      maybePick('裙裝 (Skirts)');
    } else if (Math.random() < 0.5) {
      maybePick('褲裝 (Pants)');
    } else {
      maybePick('裙裝 (Skirts)');
    }
    maybePick('襪類 (Legwear)', 0.45, (item) => {
      if (item.meta.tags.includes('legwear') && item.en.includes('bare legs')) return true;
      if (family === 'swimwear') return item.en.includes('bare legs');
      if (pieces.some((piece) => piece.meta.tags.includes('pants'))) return item.en.includes('bare legs');
      return true;
    });
    maybePick('外套 (Outerwear)', family === 'swimwear' ? 0.1 : context.location.meta.tags.includes('outdoor') ? 0.6 : 0.35);
  }

  if (frameShowsAtLeast(visibility, 'full') || locks?.shoesId) {
    maybePick('鞋款 (Shoes)');
  }

  maybePick('飾品點綴 (Jewelry & Piercings)', visibilityAtLeast(visibility, 'portrait') ? 0.65 : 0.45, (item) => {
    if (item.meta.tags.includes('edgy_accessory') && !['punk', 'y2k', 'streetwear', 'industrial', 'cyberpunk'].includes(family)) return false;
    return true;
  });

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
  const characterBits = character.slice(1).filter((item) => item && item.zh).slice(0, 3).map((item) => item.zh);
  const subjectLabel = context.subject.count === 2 ? '兩位性感驚豔的日系或韓系女性' : '一位性感驚豔的日系或韓系女性';

  return {
    style: context.style.zh || '-',
    character: characterBits.length > 0 ? `${subjectLabel}, ${characterBits.join(', ')}` : subjectLabel,
    wardrobe: wardrobe[0]?.zh || '-',
    location: context.location.zh || '-',
    camera: `${context.framing.zh || '-'} / ${context.angle.zh || '-'} / ${context.orbit.zh || '-'} / ${context.aspectRatio.zh || '-'}`,
    lighting: context.lighting.zh || '-',
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
  清透寫真感: 'airy photobook portrait mood',
  精緻棚拍感: 'polished studio beauty editorial mood',
  霓虹電影感: 'neon cinematic portrait mood',
  上田義彥: 'Yoshihiko Ueda-inspired quiet natural portrait language',
  靜謐森林低調電影感: 'Yoshihiko Ueda-inspired quiet natural portrait language',
  蜷川實花: 'Mika Ninagawa-inspired vivid color and floral theatricality',
  高飽和花卉夢境感: 'Mika Ninagawa-inspired vivid color and floral theatricality',
  橫浪修: 'Osamu Yokonami-inspired symmetrical distance and negative-space composition',
  對稱留白疏離感: 'Osamu Yokonami-inspired symmetrical distance and negative-space composition',
  川內倫子: 'Rinko Kawauchi-inspired lyrical everyday lightness',
  日常微光詩意感: 'Rinko Kawauchi-inspired lyrical everyday lightness',
  柔霧古典夢境感: 'Paolo Roversi-inspired soft haze and timeless dreamlike elegance',
  極簡雕塑棚拍感: 'Irving Penn-inspired minimal sculptural studio portraiture',
  冷冽權力性感: 'Helmut Newton-inspired cold glamorous authority and sensual power',
  俏皮性感雜誌感: 'Ellen von Unwerth-inspired playful sensual magazine energy',
  私密生活紀錄感: 'Nan Goldin-inspired intimate lived-in documentary emotion',
  粗糙直閃時尚感: 'Juergen Teller-inspired raw direct-flash fashion immediacy',
  純背景凝視肖像感: 'Richard Avedon-inspired clean backdrop and commanding gaze',
  空曠美式紀實感: 'Alec Soth-inspired spacious American documentary stillness',
  古典濕版記憶感: 'Sally Mann-inspired antique wet-plate memory atmosphere',
  青春日常隨拍感: 'Wolfgang Tillmans-inspired casual youthful snapshot realism',
  高反差黑白街頭感: 'Daido Moriyama-inspired gritty high-contrast street tension',
  危險敘事時尚感: 'Guy Bourdin-inspired provocative narrative fashion drama',
  濃彩復古電影棚拍感: 'Miles Aldridge-inspired saturated retro-cinematic studio glamour',
};

function extractCharacterSlots(character) {
  const findSlot = (token) => character.find((item) => item.id?.includes(token));
  return {
    bodyType: findSlot('character:體態-body-type:'),
    facialFeatures: findSlot('character:五官特徵-facial-features:'),
    skinDetails: findSlot('character:膚質特徵-skin-details:'),
    hairstyle: findSlot('character:髮型-hairstyle:'),
    hairColor: findSlot('character:髮色-hair-color:'),
    expression: findSlot('character:神情與眼神-expression-gaze:'),
    pose: findSlot('character:姿勢與肢體語言-pose-body-language:'),
  };
}

function extractWardrobeSlots(wardrobe) {
  const findSlot = (token) => wardrobe.find((item) => item.id?.includes(token));
  const findSlots = (token) => wardrobe.filter((item) => item.id?.includes(token));
  return {
    wardrobeCore: wardrobe[0] || null,
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
  const topColor = wardrobeSlots.top && !isNoneLikeItem(wardrobeSlots.top) ? getGarmentColorOption(locks?.topColorId) || sample(GARMENT_COLOR_OPTIONS) : null;
  const hasBottom = (wardrobeSlots.pants && !isNoneLikeItem(wardrobeSlots.pants)) || (wardrobeSlots.skirt && !isNoneLikeItem(wardrobeSlots.skirt));
  const bottomColor = hasBottom ? getGarmentColorOption(locks?.bottomColorId) || sample(GARMENT_COLOR_OPTIONS) : null;
  return { topColor, bottomColor };
}

function buildWardrobeCorePrompt(item) {
  if (!item || isNoneLikeItem(item)) return '';
  return `The outfit is dominated by ${item.en}. The overall outfit follows this fashion language from head to toe.`;
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

function normalizeMidjourneyWardrobeVibe(text) {
  if (!text) return '';
  return stripMarkdown(text)
    .replace(/^clothing with\s+/i, '')
    .replace(/^clothing featuring\s+/i, '')
    .replace(/^featuring\s+/i, '')
    .replace(/\.$/, '')
    .trim();
}

function pushUniqueSegment(segments, value) {
  const cleaned = stripMarkdown(value);
  if (!cleaned) return;

  const normalized = cleaned.toLowerCase();
  if (segments.some((existing) => existing.toLowerCase() === normalized)) return;
  segments.push(cleaned);
}

function buildMidjourneyCharacterSegments(context, characterSlots) {
  const segments = [context.subject.en];

  if (characterSlots.bodyType?.en) pushUniqueSegment(segments, compactClause(characterSlots.bodyType.en, 2));
  if (characterSlots.facialFeatures?.en) pushUniqueSegment(segments, compactClause(characterSlots.facialFeatures.en, 2));
  if (characterSlots.hairstyle?.en) pushUniqueSegment(segments, compactClause(characterSlots.hairstyle.en, 1));
  if (characterSlots.hairColor?.en) pushUniqueSegment(segments, compactClause(characterSlots.hairColor.en, 1));

  if (context.framing.meta.visibility !== 'full' && characterSlots.expression?.en) {
    pushUniqueSegment(segments, compactClause(characterSlots.expression.en, 1));
  }

  if (characterSlots.pose?.en && context.framing.meta.visibility !== 'portrait') {
    pushUniqueSegment(segments, compactClause(characterSlots.pose.en, 1));
  }

  return segments;
}

function buildMidjourneyCameraSegments(context, lightDirection, film) {
  const segments = [];

  pushUniqueSegment(segments, compactClause(STYLE_PROMPT_INTROS[context.style.zh] || context.style.en, 1));
  pushUniqueSegment(segments, compactClause(context.location.en, 2));
  pushUniqueSegment(segments, compactClause(context.framing.en, 1));

  const angleText = compactClause(context.angle.en, 1);
  const orbitText = compactClause(context.orbit.en, 1);
  if (orbitText && !orbitText.toLowerCase().includes('front-facing')) {
    pushUniqueSegment(segments, orbitText);
  }
  if (angleText && !(orbitText && orbitText.toLowerCase().includes('back view') && angleText.toLowerCase().includes('direct eye contact'))) {
    pushUniqueSegment(segments, angleText);
  }

  if (context.subject.count > 1) {
    pushUniqueSegment(segments, compactClause(buildCompositionHint(context.subject, context.aspectRatio, context.framing), 1));
  }

  pushUniqueSegment(segments, compactClause(context.lighting.en, 2));
  pushUniqueSegment(segments, compactClause(lightDirection.en, 2));
  pushUniqueSegment(segments, compactClause(film.en, 1));

  return segments;
}

function applyColorToGarment(item, color) {
  if (!item?.en) return '';
  const garment = compactClause(item.en, 1);
  if (!garment) return '';
  return color?.en ? `${color.en} ${garment}` : garment;
}

function buildMidjourneyWardrobeSegments(wardrobe, wardrobeColors) {
  const filtered = wardrobe.filter((item) => item && !isNoneLikeItem(item));
  const vibe = filtered[0];
  const slots = extractWardrobeSlots(wardrobe);
  const segments = [];

  if (vibe?.en) pushUniqueSegment(segments, compactClause(normalizeMidjourneyWardrobeVibe(vibe.en), 2));
  pushUniqueSegment(segments, applyColorToGarment(slots.top, wardrobeColors.topColor));
  pushUniqueSegment(segments, applyColorToGarment(slots.pants, wardrobeColors.bottomColor));
  pushUniqueSegment(segments, applyColorToGarment(slots.skirt, wardrobeColors.bottomColor));
  [slots.legwear, slots.outerwear, slots.shoes].forEach((item) => pushUniqueSegment(segments, compactClause(item?.en, 1)));
  slots.jewelry.filter((item) => !isNoneLikeItem(item)).forEach((item) => pushUniqueSegment(segments, compactClause(item?.en, 1)));

  return segments;
}

function buildStructuredGrokPrompt(context, character, wardrobe, wardrobeColors, lightDirection, film) {
  const styleIntro = STYLE_PROMPT_INTROS[context.style.zh] || 'editorial photography mood';
  const characterSlots = extractCharacterSlots(character);
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
  const expressionAndPose = [characterSlots.expression?.en, characterSlots.pose?.en].filter(Boolean).join(', ');
  const lines = [];
  const addLine = (label, value) => {
    if (!value) return;
    lines.push(`${label}: ${value}`);
  };
  const addItemLine = (label, item) => {
    if (!item || isNoneLikeItem(item)) return;
    addLine(label, item.en);
  };

  addLine('Subject Count', context.subject.en);
  addLine('Aspect Ratio', context.aspectRatio.en);
  addLine('Photography Style', `${styleIntro}. ${context.style.en}`);
  addLine('Location', context.location.en);
  addLine('Wardrobe Core', buildWardrobeCorePrompt(wardrobeSlots.wardrobeCore));
  addLine('Framing', context.framing.en);
  addLine('Angle', context.angle.en);
  addLine('Orbit Angle', context.orbit.en);
  addLine('Lighting', context.lighting.en);
  addLine('Light Direction', lightDirection.en);
  addLine('Film', film.en);
  addItemLine('Body Type', characterSlots.bodyType);
  addItemLine('Facial Features', characterSlots.facialFeatures);
  addItemLine('Skin Details', characterSlots.skinDetails);
  addItemLine('Hairstyle', characterSlots.hairstyle);
  addItemLine('Hair Color', characterSlots.hairColor);
  addLine('Expression and Pose', expressionAndPose);
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

  return lines.join('\n');
}

function buildPrompts(context, character, wardrobe, wardrobeColors, lightDirection, film, effect) {
  const characterSlots = extractCharacterSlots(character);
  const midjourneySegments = [];

  buildMidjourneyCameraSegments(context, lightDirection, film).forEach((segment) => pushUniqueSegment(midjourneySegments, segment));
  buildMidjourneyCharacterSegments(context, characterSlots).forEach((segment) => pushUniqueSegment(midjourneySegments, segment));
  buildMidjourneyWardrobeSegments(wardrobe, wardrobeColors).forEach((segment) => pushUniqueSegment(midjourneySegments, segment));
  if (effect?.en) pushUniqueSegment(midjourneySegments, compactClause(effect.en, 1));

  let midjourneyPrompt = '';
  for (const segment of midjourneySegments) {
    const next = midjourneyPrompt ? `${midjourneyPrompt}, ${segment}` : segment;
    if (next.length > 650) break;
    midjourneyPrompt = next;
  }
  midjourneyPrompt = `${midjourneyPrompt} --ar ${context.aspectRatio.en}`;

  const grokPrompt = buildStructuredGrokPrompt(context, character, wardrobe, wardrobeColors, lightDirection, film);

  return { midjourneyPrompt, grokPrompt };
}

function buildSelectionSnapshot(context, wardrobe, wardrobeColors, character, lightDirection, film) {
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
    lightingId: context.lighting.id,
    lightDirectionId: lightDirection.id,
    filmId: film.id,
    wardrobeVibeId: wardrobe[0]?.id || '',
    bodyTypeId: characterSlots.bodyType?.id || '',
    facialFeaturesId: characterSlots.facialFeatures?.id || '',
    skinDetailsId: characterSlots.skinDetails?.id || '',
    hairstyleId: characterSlots.hairstyle?.id || '',
    hairColorId: characterSlots.hairColor?.id || '',
    expressionId: characterSlots.expression?.id || '',
    poseId: characterSlots.pose?.id || '',
    topId: wardrobeSlots.top?.id || '',
    topColorId: wardrobeColors.topColor?.id || '',
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
  const subject = getSubjectOption(locks.subjectCount);
  const aspectRatio = getAspectRatioOption(locks.aspectRatio);
  const lowFrequencyPicker = (tag) => (candidates) => {
    const regular = candidates.filter((item) => !item.meta.tags?.includes(tag));
    const lowFrequency = candidates.filter((item) => item.meta.tags?.includes(tag));

    if (regular.length > 0 && (lowFrequency.length === 0 || Math.random() < 0.88)) {
      return sample(regular);
    }

    return sample(lowFrequency.length > 0 ? lowFrequency : candidates);
  };
  const location = pickWithLock(runtime.flatCatalog.locations, locks.locationId);
  const style = pickWithLock(runtime.flatCatalog.regional, locks.styleId, (item) => styleFitsLocation(item, location));
  const framing = pickWithLock(
    runtime.flatCatalog.framing,
    locks.framingId,
    (item) => !(location.meta.tags.includes('club') && item.meta.visibility === 'close') && framingSupportsSubject(item, subject, aspectRatio)
  );
  const angle = pickWithLock(runtime.flatCatalog.angle, locks.angleId, (item) => framingSupportsAngle(framing, item), lowFrequencyPicker('low_frequency_angle'));
  const orbit = pickWithLock(runtime.flatCatalog.orbit, locks.orbitId);
  const lighting = pickWithLock(runtime.flatCatalog.lighting, locks.lightingId, (item) => locationSupportsLighting(location, item));
  const lightDirection = pickWithLock(runtime.flatCatalog.lightDirection, locks.lightDirectionId, (item) => lightDirectionSupportsScene(item, framing, location, lighting));
  const film = pickWithLock(runtime.flatCatalog.film, locks.filmId, () => true, lowFrequencyPicker('low_frequency_film'));
  const effect = Math.random() > 0.65 ? sample(runtime.flatCatalog.effects) : null;

  const context = { subject, aspectRatio, style, location, framing, angle, orbit, lighting, locks };
  const character = buildCharacter(context, runtime.catalog);
  const wardrobe = buildWardrobe({ ...context }, locks, runtime);
  context.wardrobe = wardrobe;
  const wardrobeColors = buildWardrobeColors(extractWardrobeSlots(wardrobe), locks);

  const positiveTags = collectPositiveTags(style, location, framing, angle, lighting, lightDirection, film, effect, wardrobe, character);
  const negativePrompt = buildNegativePrompt(context, positiveTags, runtime);
  const { midjourneyPrompt, grokPrompt } = buildPrompts(context, character, wardrobe, wardrobeColors, lightDirection, film, effect);
  const summaryFields = buildSummaryFields(context, wardrobe, character);

  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    summary: buildSummary(summaryFields),
    summaryFields,
    midjourneyPrompt,
    grokPrompt,
    negativePrompt,
    selection: buildSelectionSnapshot(context, wardrobe, wardrobeColors, character, lightDirection, film),
    structured: {
      Style: [style],
      Character: character,
      Wardrobe: wardrobe,
      Location: [location],
      Framing: [framing, angle, orbit],
      Lighting: [lighting, lightDirection],
      'Camera & Film': [film, effect].filter(Boolean),
    },
  };
}

export function generatePrompts(count = 1, locks = createEmptyLocks(), customLibrary = []) {
  return Array.from({ length: count }, (_, index) => generateSinglePrompt(index, locks, customLibrary));
}
