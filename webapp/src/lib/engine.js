import database from '../data/database.json' with { type: 'json' };

const SUBJECT_COUNT_OPTIONS = [
  { id: '1', zh: '1 位', en: 'an elegant beautiful 20-year-old Japanese or Korean woman', count: 1 },
  { id: '2', zh: '2 位', en: 'two elegant beautiful 20-year-old Japanese or Korean women', count: 2 },
  {
    id: 'reference',
    zh: '上傳人物',
    en: 'a woman matching the attached reference person, preserve facial identity and overall likeness from the attached image',
    count: 1,
    reference: true,
  },
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
  { id: 'none', zh: '全無', en: 'none' },
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

const LAYER_COLOR_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none' },
  { id: 'black', zh: '黑色', en: 'black' },
  { id: 'white', zh: '白色', en: 'white' },
  { id: 'off-white', zh: '米白色', en: 'off-white' },
  { id: 'dark-grey', zh: '深灰色', en: 'dark grey' },
  { id: 'light-grey', zh: '淺灰色', en: 'light grey' },
  { id: 'dark-brown', zh: '深棕色', en: 'dark brown' },
  { id: 'light-brown', zh: '淺棕色', en: 'light brown' },
  { id: 'dark-blue', zh: '深藍色', en: 'dark blue' },
  { id: 'burgundy', zh: '酒紅色', en: 'burgundy' },
  { id: 'red', zh: '紅色', en: 'red' },
  { id: 'silver', zh: '銀色', en: 'silver' },
  { id: 'gold', zh: '金色', en: 'gold' },
];

const LEGWEAR_COLOR_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none' },
  { id: 'black', zh: '黑色', en: 'black' },
  { id: 'white', zh: '白色', en: 'white' },
  { id: 'off-white', zh: '米白色', en: 'off-white' },
  { id: 'dark-grey', zh: '深灰色', en: 'dark grey' },
  { id: 'light-grey', zh: '淺灰色', en: 'light grey' },
  { id: 'dark-brown', zh: '深棕色', en: 'dark brown' },
  { id: 'light-brown', zh: '淺棕色', en: 'light brown' },
  { id: 'dark-blue', zh: '深藍色', en: 'dark blue' },
  { id: 'red', zh: '紅色', en: 'red' },
  { id: 'pink', zh: '粉紅色', en: 'pink' },
  { id: 'colorful', zh: '彩色', en: 'colorful' },
];

const OUTFIT_PRESET_COLOR_OPTIONS = [
  { id: 'white', zh: '白色', en: 'white' },
  { id: 'black', zh: '黑色', en: 'black' },
  { id: 'red', zh: '紅色', en: 'red' },
  { id: 'blue', zh: '藍色', en: 'blue' },
  { id: 'green', zh: '綠色', en: 'green' },
  { id: 'yellow', zh: '黃色', en: 'yellow' },
  { id: 'black-white', zh: '黑白', en: 'black and white' },
  { id: 'black-red', zh: '黑紅', en: 'black and red' },
  { id: 'white-red', zh: '白紅', en: 'white and red' },
];

const STYLE_NONE_OPTION = {
  id: 'style-none',
  zh: '全無',
  en: 'none',
  desc: 'Explicitly disable photography style so no photographer-inspired style language is added.',
  meta: { tags: ['none', 'no_style'] },
};

const OUTFIT_PRESET_NONE_OPTION = {
  id: 'outfit-preset-none',
  zh: '全無',
  en: 'none',
  desc: 'Explicitly disable outfit presets so granular wardrobe selections remain active.',
  meta: { tags: ['none', 'no_outfit_preset'] },
};

const ENVIRONMENT_MOOD_CATEGORY = '環境光氛 (Environment Mood)';
const LIGHT_STYLE_CATEGORY = '光線表現 (Light Style)';
const FOCAL_LENGTH_CATEGORY = '鏡頭焦段 (Focal Length)';
const OPTICAL_EFFECTS_CATEGORY = '光學效果 (Optical Effects)';

const LOCK_DEFINITIONS = [
  { key: 'subjectCount', label: '人物數量', options: SUBJECT_COUNT_OPTIONS, required: true, defaultValue: '1', section: 'core' },
  { key: 'aspectRatio', label: '畫面比例', options: ASPECT_RATIO_OPTIONS, required: true, defaultValue: '4:5', section: 'core' },
  { key: 'styleId', label: '攝影風格', category: '攝影風格', section: 'core' },
  { key: 'locationId', label: '場景', category: null, section: 'core' },
  { key: 'framingId', label: '構圖景別', category: '景別構圖 (Framing)', section: 'core' },
  { key: 'angleId', label: '俯仰角度', category: '相機視角 (Angle)', section: 'core' },
  { key: 'orbitId', label: '環繞角度', category: '拍攝方位 (Orbit Angle)', section: 'core' },
  { key: 'lensId', label: '鏡頭焦段', category: FOCAL_LENGTH_CATEGORY, section: 'core' },
  { key: 'opticalEffectId', label: '光學效果', category: OPTICAL_EFFECTS_CATEGORY, section: 'core' },
  { key: 'lightingId', label: '環境光氛', category: ENVIRONMENT_MOOD_CATEGORY, section: 'core' },
  { key: 'lightDirectionId', label: '光線表現', category: LIGHT_STYLE_CATEGORY, section: 'core' },
  { key: 'filmId', label: '成像風格', category: '底片與相機模擬 (Camera & Film Simulation)', section: 'core' },
  { key: 'bodyTypeId', label: '體態', category: '體態 (Body Type)', section: 'character' },
  { key: 'facialFeaturesId', label: '五官特徵', category: '五官特徵 (Facial Features)', section: 'character' },
  { key: 'facialFeaturesAId', label: '人物 1 五官', category: '五官特徵 (Facial Features)', section: 'character' },
  { key: 'facialFeaturesBId', label: '人物 2 五官', category: '五官特徵 (Facial Features)', section: 'character' },
  { key: 'skinDetailsId', label: '膚質特徵', category: '膚質特徵 (Skin Details)', section: 'character' },
  { key: 'hairstyleId', label: '髮型', category: '髮型 (Hairstyle)', section: 'character' },
  { key: 'hairstyleAId', label: '人物 1 髮型', category: '髮型 (Hairstyle)', section: 'character' },
  { key: 'hairstyleBId', label: '人物 2 髮型', category: '髮型 (Hairstyle)', section: 'character' },
  { key: 'hairColorId', label: '髮色', category: '髮色 (Hair Color)', section: 'character' },
  { key: 'hairColorAId', label: '人物 1 髮色', category: '髮色 (Hair Color)', section: 'character' },
  { key: 'hairColorBId', label: '人物 2 髮色', category: '髮色 (Hair Color)', section: 'character' },
  { key: 'duoInteractionId', label: '雙人互動', options: DUO_INTERACTION_OPTIONS, section: 'character' },
  { key: 'expressionId', label: '神情眼神', category: '神情與眼神 (Expression & Gaze)', section: 'character' },
  { key: 'poseId', label: '姿勢動作', category: '姿勢與肢體語言 (Pose & Body Language)', section: 'character' },
  { key: 'specialActionId', label: '特殊動作', category: '特殊動作 (Special Actions)', section: 'character' },
  { key: 'outfitPresetId', label: '套裝', category: '套裝 (Outfit Presets)', section: 'wardrobe' },
  { key: 'outfitPresetColorId', label: '套裝配色', options: OUTFIT_PRESET_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outfitPresetAId', label: '人物 1 套裝', category: '套裝 (Outfit Presets)', section: 'wardrobe' },
  { key: 'outfitPresetAColorId', label: '人物 1 套裝配色', options: OUTFIT_PRESET_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outfitPresetBId', label: '人物 2 套裝', category: '套裝 (Outfit Presets)', section: 'wardrobe' },
  { key: 'outfitPresetBColorId', label: '人物 2 套裝配色', options: OUTFIT_PRESET_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'topId', label: '上身', category: '上身 (Tops)', section: 'wardrobe' },
  { key: 'topColorId', label: '上身配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'topPatternId', label: '上身圖案', category: '上身圖案 (Top Surface Design)', section: 'wardrobe' },
  { key: 'duoStylingId', label: '雙人穿搭', options: DUO_STYLING_OPTIONS, section: 'wardrobe' },
  { key: 'pantsId', label: '褲裝', category: '褲裝 (Pants)', section: 'wardrobe' },
  { key: 'skirtId', label: '裙裝', category: '裙裝 (Skirts)', section: 'wardrobe' },
  { key: 'bottomColorId', label: '下身配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'bottomPatternId', label: '下身圖案', category: '下身圖案 (Bottom Surface Design)', section: 'wardrobe' },
  { key: 'legwearId', label: '襪類', category: '襪類 (Legwear)', section: 'wardrobe' },
  { key: 'legwearColorId', label: '襪類配色', options: LEGWEAR_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outerwearId', label: '外套', category: '外套 (Outerwear)', section: 'wardrobe' },
  { key: 'outerwearColorId', label: '外套配色', options: LAYER_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outerwearPatternId', label: '外套圖案', category: '外套圖案 (Outerwear Surface Design)', section: 'wardrobe' },
  { key: 'shoesId', label: '鞋款', category: '鞋款 (Shoes)', section: 'wardrobe' },
  { key: 'shoesColorId', label: '鞋款配色', options: LAYER_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'eyewearId', label: '眼鏡', category: '眼鏡 (Eyewear)', section: 'wardrobe' },
  { key: 'earringsId', label: '耳環', category: '耳環 (Earrings)', section: 'wardrobe' },
  { key: 'neckAccessoryId', label: '頸部', category: '頸部 (Neck Accessories)', section: 'wardrobe' },
  { key: 'wristAccessoryId', label: '腕部', category: '腕部 (Wrist Accessories)', section: 'wardrobe' },
  { key: 'ringId', label: '戒指', category: '戒指 (Rings)', section: 'wardrobe' },
  { key: 'waistAccessoryId', label: '腰部', category: '腰部 (Waist Accessories)', section: 'wardrobe' },
];

const REQUIRED_LOCK_KEYS = LOCK_DEFINITIONS.filter((definition) => definition.required).map((definition) => definition.key);
const LOCK_KEYS = new Set(LOCK_DEFINITIONS.map((definition) => definition.key));

const PARTIAL_REROLL_OPTIONS = [
  { key: 'styleId', label: 'Style' },
  { key: 'locationId', label: 'Location' },
  { key: 'framingId', label: 'Framing' },
  { key: 'angleId', label: 'Angle' },
  { key: 'orbitId', label: 'Orbit' },
  { key: 'lensId', label: 'Lens' },
  { key: 'opticalEffectId', label: 'Optical Effect' },
  { key: 'lightingId', label: 'Environment Mood' },
  { key: 'lightDirectionId', label: 'Light Style' },
  { key: 'filmId', label: 'Film' },
  { key: 'outfitPresetId', label: 'Outfit Preset' },
  { key: 'bodyTypeId', label: 'Body Type' },
  { key: 'facialFeaturesId', label: 'Face' },
  { key: 'facialFeaturesAId', label: 'Woman 1 Facial Features' },
  { key: 'facialFeaturesBId', label: 'Woman 2 Facial Features' },
  { key: 'skinDetailsId', label: 'Skin' },
  { key: 'hairstyleId', label: 'Hair Style' },
  { key: 'hairstyleAId', label: 'Woman 1 Hairstyle' },
  { key: 'hairstyleBId', label: 'Woman 2 Hairstyle' },
  { key: 'hairColorId', label: 'Hair Color' },
  { key: 'hairColorAId', label: 'Woman 1 Hair Color' },
  { key: 'hairColorBId', label: 'Woman 2 Hair Color' },
  { key: 'duoInteractionId', label: 'Duo Interaction' },
  { key: 'expressionId', label: 'Expression' },
  { key: 'poseId', label: 'Pose' },
  { key: 'specialActionId', label: 'Special Action' },
  { key: 'outfitPresetId', label: 'Outfit Preset' },
  { key: 'outfitPresetColorId', label: 'Outfit Preset Color' },
  { key: 'outfitPresetAId', label: 'Woman 1 Outfit Preset' },
  { key: 'outfitPresetAColorId', label: 'Woman 1 Outfit Preset Color' },
  { key: 'outfitPresetBId', label: 'Woman 2 Outfit Preset' },
  { key: 'outfitPresetBColorId', label: 'Woman 2 Outfit Preset Color' },
  { key: 'topId', label: 'Top' },
  { key: 'topColorId', label: 'Top Color' },
  { key: 'topPatternId', label: 'Top Surface Design' },
  { key: 'duoStylingId', label: 'Duo Styling' },
  { key: 'pantsId', label: 'Pants' },
  { key: 'skirtId', label: 'Skirt' },
  { key: 'bottomColorId', label: 'Bottom Color' },
  { key: 'bottomPatternId', label: 'Bottom Surface Design' },
  { key: 'legwearId', label: 'Legwear' },
  { key: 'legwearColorId', label: 'Legwear Color' },
  { key: 'outerwearId', label: 'Outerwear' },
  { key: 'outerwearColorId', label: 'Outerwear Color' },
  { key: 'outerwearPatternId', label: 'Outerwear Surface Design' },
  { key: 'shoesId', label: 'Shoes' },
  { key: 'shoesColorId', label: 'Shoes Color' },
  { key: 'eyewearId', label: 'Eyewear' },
  { key: 'earringsId', label: 'Earrings' },
  { key: 'neckAccessoryId', label: 'Neck Accessory' },
  { key: 'wristAccessoryId', label: 'Wrist Accessory' },
  { key: 'ringId', label: 'Ring' },
  { key: 'waistAccessoryId', label: 'Waist Accessory' },
];

const CUSTOM_GROUP_OPTIONS = [
  { value: 'Regional', label: 'Photography Style' },
  { value: 'Locations', label: 'Location' },
  { value: 'Wardrobe', label: 'Wardrobe' },
  { value: 'Character', label: 'Character' },
  { value: 'CameraLighting', label: 'Camera & Lighting' },
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
  if (hasAny(haystack, ['abandoned & underground', '地下與廢墟風格'])) tags.push('underground', 'ruin');

  if (hasAny(haystack, ['hotel', 'boutique hotel', '旅館', '飯店'])) tags.push('hospitality', 'indoor');
  if (hasAny(haystack, ['apartment', 'bedroom', 'living room', '臥室', '公寓', '客廳'])) tags.push('residential', 'indoor');
  if (hasAny(haystack, ['interior', 'inside', 'room', 'hallway', 'corridor', 'stairwell', 'stairwell shaft', 'seating', 'dining aisle', 'bathroom', 'vanity', 'mirror', 'store interior', '店內', '室內', '房間', '浴室', '鏡前', '樓梯井', '長椅區'])) {
    tags.push('indoor');
  }
  if (hasAny(haystack, ['plaza', 'pedestrian', 'crosswalk', 'sidewalk', 'street', 'streetfront', 'square', 'lawn edge', 'outdoor', 'shoreline', 'beach', 'park', 'deck', 'avenue', 'station front', '廣場', '行人區', '人行道', '街頭', '街角', '穿越口', '草地邊', '海灘', '岩岸', '公園', '木棧道', '戶外'])) {
    tags.push('outdoor');
  }
  if (hasAny(haystack, ['café', 'bar entrance', 'storefront', 'shopfront', 'night market', 'mall', 'laundromat', '咖啡', '夜市', '商場'])) {
    tags.push('commercial');
  }
  if (hasAny(haystack, ['subway', 'platform', 'station', '地鐵', '月台'])) tags.push('transit', 'urban');
  if (hasAny(haystack, ['factory', 'control room', 'train yard', 'scaffolding', 'construction', '工廠', '工地', '機房'])) tags.push('industrial');
  if (hasAny(haystack, ['hospital', 'operating room', 'ward', 'classroom', 'music room', 'school', '病房', '診療室', '教室'])) {
    tags.push('institutional', 'indoor');
  }
  if (hasAny(haystack, ['opera house', 'mansion', 'library', 'old town', 'townhouse', '洋房', '歌劇院', '大宅', '老城'])) {
    tags.push('heritage');
  }
  if (hasAny(haystack, ['beach', 'shoreline', 'coastline', 'lake', 'lakeside', 'sand dune', '沙丘', '海灘', '湖邊', '岩岸'])) {
    tags.push('waterfront', 'outdoor', 'natural');
  }
  if (hasAny(haystack, ['forest', 'grass', 'sunflower', 'park', '樹影', '森林', '草地', '花田', '公園'])) {
    tags.push('green_space');
  }
  if (hasAny(haystack, ['bunker', 'drainage', 'tunnel', '地下', '排洪道'])) tags.push('subterranean');
  if (hasAny(haystack, ['white background', 'grey seamless', 'paper roll', 'backdrop', '白幕', '黑幕', '背景'])) tags.push('studio');

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
  if (hasAny(haystack, ['front three-quarter', 'slightly angled toward camera', 'softly turned toward camera', '45-degree', '315'])) {
    tags.push('front_three_quarter', 'three_quarter', 'eye_contact_ok');
  }
  if (hasAny(haystack, ['profile', '90-degree', '270'])) tags.push('profile_view');
  if (hasAny(haystack, ['rear three-quarter', 'partially turned away', 'body turned away', 'partial shoulder reveal', '135', '225'])) {
    tags.push('rear_three_quarter', 'three_quarter');
  }
  if (hasAny(haystack, ['back view', 'facing away', 'rear'])) tags.push('back_view', 'no_eye_contact');

  return { tags: withTags(tags) };
}

function getGarmentColorOption(id) {
  return GARMENT_COLOR_OPTIONS.find((option) => option.id === id) || null;
}

function getLayerColorOption(id) {
  return LAYER_COLOR_OPTIONS.find((option) => option.id === id) || null;
}

function getLegwearColorOption(id) {
  return LEGWEAR_COLOR_OPTIONS.find((option) => option.id === id) || null;
}

function getOutfitPresetColorOption(id) {
  return OUTFIT_PRESET_COLOR_OPTIONS.find((option) => option.id === id) || null;
}

function inferLightingMeta(category, item) {
  const haystack = toHaystack(category, item.zh, item.en, item.desc);
  const tags = [];
  const isLightStyleCategory = category === LIGHT_STYLE_CATEGORY;
  const isEnvironmentCategory = category === ENVIRONMENT_MOOD_CATEGORY;

  if (isEnvironmentCategory) {
    if (hasAny(haystack, ['晴朗白日', 'clear daylight'])) {
      tags.push('natural_light', 'sunlight', 'day', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['藍天白雲', 'clear blue sky'])) {
      tags.push('natural_light', 'sunlight', 'day', 'clean_sky', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['正午烈日', 'harsh midday sun'])) {
      tags.push('natural_light', 'sunlight', 'day', 'harsh', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['陰天漫射', 'overcast sky'])) {
      tags.push('natural_light', 'diffused', 'cloudy', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['清晨薄霧', 'misty morning'])) {
      tags.push('natural_light', 'diffused', 'mist', 'cool', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['晨光日出', 'sunrise atmosphere'])) {
      tags.push('natural_light', 'sunlight', 'day', 'warm', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['黃昏夕陽', 'golden sunset'])) {
      tags.push('natural_light', 'sunlight', 'warm', 'dusk', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['藍調傍晚', 'blue hour'])) {
      tags.push('natural_light', 'dusk', 'cool', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['夜晚街燈', 'streetlit night'])) {
      tags.push('artificial_light', 'dark', 'night_ambient', 'supports_outdoor', 'supports_urban', 'supports_commercial', 'supports_subterranean');
    }
    if (hasAny(haystack, ['月光夜色', 'moonlit night'])) {
      tags.push('natural_light', 'dark', 'cool', 'night_ambient', 'supports_outdoor', 'supports_natural', 'supports_urban');
    }
    if (hasAny(haystack, ['霓虹夜色', 'neon night'])) {
      tags.push('artificial_light', 'neon', 'dark', 'supports_outdoor', 'supports_urban', 'supports_commercial', 'supports_subterranean');
    }
    if (hasAny(haystack, ['陰雨將至', 'storm-brewing atmosphere'])) {
      tags.push('natural_light', 'cloudy', 'dark', 'dramatic', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['雨天陰濕', 'rainy atmosphere'])) {
      tags.push('natural_light', 'rain', 'diffused', 'dark', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['雨後反光', 'post-rain'])) {
      tags.push('natural_light', 'rain', 'reflective', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['雪地冷光', 'snow-bright'])) {
      tags.push('natural_light', 'snow', 'cool', 'reflective', 'supports_outdoor', 'supports_natural', 'supports_urban');
    }
    if (hasAny(haystack, ['冬季灰冷', 'cold winter overcast atmosphere'])) {
      tags.push('natural_light', 'cloudy', 'cool', 'supports_outdoor', 'supports_natural', 'supports_urban');
    }
    if (hasAny(haystack, ['室內窗邊日光', 'indoor daylight by the window'])) {
      tags.push('window_light', 'natural_light', 'indoor', 'day', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內陰影日光', 'indoor dim daylight'])) {
      tags.push('window_light', 'natural_light', 'indoor', 'diffused', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內暖光夜景', 'indoor warm night'])) {
      tags.push('artificial_light', 'indoor', 'warm', 'dark', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_commercial', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內燭光', 'candlelit interior atmosphere'])) {
      tags.push('artificial_light', 'indoor', 'warm', 'dark', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內冷色人造光', 'indoor cool artificial'])) {
      tags.push('artificial_light', 'indoor', 'cool', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_commercial', 'supports_heritage', 'supports_subterranean');
    }
    if (hasAny(haystack, ['室內霓虹夜色', 'indoor neon-lit atmosphere'])) {
      tags.push('artificial_light', 'indoor', 'neon', 'dark', 'supports_indoor', 'supports_commercial', 'supports_hospitality', 'supports_subterranean');
    }
    if (hasAny(haystack, ['高調純白攝影棚', 'high-key white studio atmosphere'])) {
      tags.push('artificial_light', 'indoor', 'studio_light', 'controlled', 'soft_light', 'supports_indoor', 'supports_studio', 'supports_commercial');
    }
    if (hasAny(haystack, ['柔霧美妝攝影棚', 'soft beauty studio atmosphere'])) {
      tags.push('artificial_light', 'indoor', 'studio_light', 'controlled', 'soft_light', 'portrait_light', 'supports_indoor', 'supports_studio', 'supports_commercial');
    }
    if (hasAny(haystack, ['舞台演出燈光', 'stage-lit atmosphere'])) {
      tags.push('artificial_light', 'stage_light', 'dramatic', 'supports_indoor', 'supports_commercial', 'supports_studio', 'supports_subterranean');
    }
  }

  if (isLightStyleCategory) {
    if (hasAny(haystack, ['柔和順光', 'soft front light'])) {
      tags.push('soft_light', 'portrait_light', 'supports_indoor', 'supports_outdoor', 'supports_studio', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['均勻平光', 'flat even light'])) {
      tags.push('soft_light', 'controlled', 'supports_indoor', 'supports_outdoor', 'supports_studio', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['側向柔光', 'soft side light'])) {
      tags.push('soft_light', 'portrait_light', 'supports_indoor', 'supports_outdoor', 'supports_studio');
    }
    if (hasAny(haystack, ['側向硬光', 'hard side light'])) {
      tags.push('portrait_light', 'harsh', 'supports_indoor', 'supports_outdoor', 'supports_studio');
    }
    if (hasAny(haystack, ['側逆光', 'back-side light'])) {
      tags.push('backlight', 'supports_indoor', 'supports_outdoor', 'supports_studio');
    }
    if (hasAny(haystack, ['逆光輪廓光', 'strong rim light'])) {
      tags.push('backlight', 'supports_indoor', 'supports_outdoor', 'supports_studio');
    }
    if (hasAny(haystack, ['頂部照明', 'overhead top lighting'])) {
      tags.push('overhead', 'supports_indoor', 'supports_outdoor', 'supports_studio');
    }
    if (hasAny(haystack, ['下方反射光', 'bounce up light'])) {
      tags.push('soft_light', 'portrait_light', 'reflective', 'supports_indoor', 'supports_outdoor');
    }
    if (hasAny(haystack, ['漫射霧光', 'diffused mist light'])) {
      tags.push('soft_light', 'diffused', 'mist', 'supports_indoor', 'supports_outdoor');
    }
    if (hasAny(haystack, ['硬質晴光', 'hard sunlight'])) {
      tags.push('sunlight', 'harsh', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['低光高反差', 'low-key contrast'])) {
      tags.push('dark', 'dramatic', 'artificial_light', 'supports_indoor', 'supports_outdoor', 'supports_studio');
    }
    if (hasAny(haystack, ['高調亮光', 'high-key bright light'])) {
      tags.push('soft_light', 'studio_light', 'controlled', 'supports_indoor', 'supports_outdoor', 'supports_studio');
    }
    if (hasAny(haystack, ['混合色溫光', 'mixed color temperature'])) {
      tags.push('artificial_light', 'mixed_color', 'supports_indoor', 'supports_outdoor', 'supports_commercial', 'supports_urban', 'supports_subterranean');
    }
    if (hasAny(haystack, ['霓虹染色光', 'neon color spill'])) {
      tags.push('artificial_light', 'neon', 'supports_indoor', 'supports_outdoor', 'supports_commercial', 'supports_urban', 'supports_subterranean');
    }
    if (hasAny(haystack, ['窗格投影光', 'window pattern light'])) {
      tags.push('window_light', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['百葉窗條紋投影光', 'window-blind stripe light'])) {
      tags.push('window_light', 'portrait_light', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['斑駁樹影光', 'dappled light'])) {
      tags.push('natural_light', 'sunlight', 'supports_outdoor', 'supports_natural', 'supports_urban');
    }
    if (hasAny(haystack, ['潮濕反射光', 'wet reflective light'])) {
      tags.push('reflective', 'supports_outdoor', 'supports_urban', 'supports_indoor');
    }
    if (hasAny(haystack, ['局部暖光', 'local warm glow'])) {
      tags.push('artificial_light', 'warm', 'supports_indoor', 'supports_hospitality', 'supports_residential', 'supports_commercial');
    }
  }

  return { tags: withTags(tags) };
}

function inferCharacterMeta(category, item) {
  const haystack = toHaystack(category, item.zh, item.en, item.desc);
  let minVisibility = 'full';
  const tags = [];
  let archetype = null;

  if (category.includes('Body Type')) minVisibility = 'full';
  if (category.includes('Facial Features')) minVisibility = 'medium';
  if (category.includes('Skin Details')) minVisibility = 'portrait';
  if (category.includes('Hairstyle')) minVisibility = 'medium';
  if (category.includes('Hair Color')) minVisibility = 'medium';
  if (category.includes('Expression')) minVisibility = 'full';
  if (category.includes('Pose')) minVisibility = 'full';
  if (category.includes('Special Actions')) minVisibility = 'medium';

  if (hasAny(haystack, ['freckles', '雀斑', 'eyelashes', 'lip', 'nose', '瞳', 'gaze', 'eye contact'])) {
    if (!category.includes('Expression')) {
      minVisibility = 'portrait';
      tags.push('fine_detail');
    }
  }

  if (category.includes('Skin Details')) tags.push('skin_detail');

  if (category.includes('Hair Color')) {
    if (hasAny(haystack, [
      '內層染',
      '挑染',
      '分色',
      '漸層',
      '耳圈染',
      '亮綠',
      '深綠',
      '桃紅',
      '寶藍',
      '亮黃',
      '亮紫',
      'neon green',
      'forest green',
      'hot pink',
      'cobalt blue',
      'bright lemon yellow',
      'electric purple',
      'highlights',
      'split dye',
      'gradient',
      'inner layer',
      'face-framing',
      'statement color',
      'fashion color',
      'fantasy color',
      'solid dye',
    ])) {
      tags.push('special_hair_color');
    } else {
      tags.push('mainstream_hair_color');
    }
  }

  if (hasAny(haystack, ['direct gaze', '直視', 'eye contact'])) tags.push('direct_gaze');
  if (hasAny(haystack, ['into the distance', 'gazing into distance', '望向遠方', '望向遠處'])) tags.push('distance_gaze');
  if (hasAny(haystack, ['looking off to the side', '側望', 'look to the side'])) tags.push('side_gaze');
  if (hasAny(haystack, ['lowered gaze', '低頭', '向下'])) tags.push('downward_gaze');
  if (hasAny(haystack, ['top-down', 'aerial view', '俯拍'])) tags.push('requires_aerial');
  if (category.includes('Special Actions')) {
    tags.push('special_action');
    if (hasAny(haystack, ['lipstick', '口紅', 'coffee', '咖啡', 'lollipop', '棒棒糖', 'cigarette', '抽煙'])) {
      minVisibility = 'medium';
      tags.push('prop_action', 'face_action');
    }
    if (hasAny(haystack, ['stocking', '絲襪', 'hosiery'])) {
      minVisibility = 'full';
      tags.push('prop_action', 'leg_focus_action');
    }
    if (hasAny(haystack, ['armchair', '沙發', 'ornate carved'])) {
      minVisibility = 'full';
      tags.push('scene_override', 'large_prop_action');
    }
    if (hasAny(haystack, ['one shoulder', '肩線', 'pulling the top partially off'])) {
      minVisibility = 'medium';
      tags.push('wardrobe_action');
    }
    if (hasAny(haystack, ['stomach', '俯臥', '趴臥', 'reclining', '斜躺', 'all fours', '四足', 'knees on the ground', 'large pillow', '抱枕', 'kneeling', '跪姿', '跪坐', 'feet tucked under'])) {
      minVisibility = 'full';
      tags.push('full_body_action');
    }
  }
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
  if (
    category.includes('眼鏡')
    || category.includes('耳環')
    || category.includes('頸部')
    || category.includes('腕部')
    || category.includes('戒指')
    || category.includes('腰部')
    || category.includes('Eyewear')
    || category.includes('Earrings')
    || category.includes('Neck Accessories')
    || category.includes('Wrist Accessories')
    || category.includes('Rings')
    || category.includes('Waist Accessories')
  ) tags.push('accessory_small');
  if (hasAny(haystack, ['no eyewear', 'no earrings', 'no neck accessories', 'no wrist accessories', 'no rings', 'no waist accessories', '全無'])) tags.push('no_accessory');
  if (hasAny(haystack, ['choker', '頸圈', '頸鍊', '扣環頸鏈', '打孔腰帶', '皮革腕帶'])) tags.push('edgy_accessory');
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

function inferLensMeta(_category, item) {
  const haystack = toHaystack(item.zh, item.en, item.desc);
  const tags = [];

  if (hasAny(haystack, ['20mm', '24mm', '28mm', '35mm', 'wide-angle', 'ultra-wide'])) tags.push('wide_lens');
  if (hasAny(haystack, ['50mm', 'standard'])) tags.push('standard_lens');
  if (hasAny(haystack, ['85mm', '105mm', '135mm', 'telephoto', 'compression'])) tags.push('telephoto_lens');
  if (hasAny(haystack, ['macro'])) tags.push('macro_lens');
  if (hasAny(haystack, ['fisheye'])) tags.push('fisheye_lens');
  if (hasAny(haystack, ['tilt-shift'])) tags.push('tilt_shift_lens');
  if (hasAny(haystack, ['anamorphic'])) tags.push('anamorphic_lens');

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
  if (category === FOCAL_LENGTH_CATEGORY) return inferLensMeta(category, item);
  if (category === ENVIRONMENT_MOOD_CATEGORY || category === LIGHT_STYLE_CATEGORY) {
    return inferLightingMeta(category, item);
  }
  if (category === '底片與相機模擬 (Camera & Film Simulation)') return inferFilmMeta(category, item);
  if (category === OPTICAL_EFFECTS_CATEGORY || category === '特殊效果 (Special Effects)') return inferEffectMeta(category, item);
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
  if (customLibrary && !Array.isArray(customLibrary) && typeof customLibrary === 'object') {
    return cloneDatabase(customLibrary);
  }

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
      regional: [STYLE_NONE_OPTION, ...flatten(catalog.regional)],
      locations: flatten(catalog.locations),
      framing: getByKey(catalog.camera, '景別構圖 (Framing)'),
      angle: getByKey(catalog.camera, '相機視角 (Angle)'),
      orbit: getByKey(catalog.camera, '拍攝方位 (Orbit Angle)'),
      lens: getByKey(catalog.camera, FOCAL_LENGTH_CATEGORY),
      lighting: getByKey(catalog.camera, ENVIRONMENT_MOOD_CATEGORY),
      lightDirection: getByKey(catalog.camera, LIGHT_STYLE_CATEGORY),
      film: getByKey(catalog.camera, '底片與相機模擬 (Camera & Film Simulation)'),
      effects: getByKey(catalog.camera, OPTICAL_EFFECTS_CATEGORY).length > 0 ? getByKey(catalog.camera, OPTICAL_EFFECTS_CATEGORY) : getByKey(catalog.camera, '特殊效果 (Special Effects)'),
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

export function getKnowledgeBaseSnapshot(customLibrary = []) {
  const { mergedDatabase } = buildCatalog(customLibrary);
  return cloneDatabase(mergedDatabase);
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

  const legacyJewelry = Array.isArray(rawLocks?.jewelryIds)
    ? rawLocks.jewelryIds.filter(Boolean)
    : rawLocks?.jewelryId
      ? [rawLocks.jewelryId]
      : [];

  if (legacyJewelry.length > 0) {
    const legacyMap = {
      '黑框眼鏡': 'eyewearId',
      '細框眼鏡': 'eyewearId',
      '太陽眼鏡': 'eyewearId',
      '小型金屬耳環': 'earringsId',
      '金屬頸鍊': 'neckAccessoryId',
      '金屬細頸圈': 'neckAccessoryId',
      '多條層疊的金項鏈': 'neckAccessoryId',
      '多條層疊的水晶頸鏈與項鍊': 'neckAccessoryId',
      '多條層疊的水晶項鍊與頸鏈': 'neckAccessoryId',
      '皮質扣環頸鏈': 'neckAccessoryId',
      '緞帶頸圈': 'neckAccessoryId',
      '蕾絲緞帶頸圈': 'neckAccessoryId',
      '鎖骨細金屬鏈': 'neckAccessoryId',
      '刺繡絲巾': 'neckAccessoryId',
      '薄長圍巾': 'neckAccessoryId',
      '厚長圍巾': 'neckAccessoryId',
      '街頭風格金項鏈': 'neckAccessoryId',
      '細戒指': 'ringId',
      '打孔腰帶': 'waistAccessoryId',
      '單排打孔腰帶': 'waistAccessoryId',
      '胸下式短款精緻束腰帶': 'waistAccessoryId',
    };
    const { catalog } = buildCatalog();
    legacyJewelry.forEach((legacyId) => {
      const legacyItem = Object.values(catalog.wardrobe).flat().find((item) => item.id === legacyId);
      const targetKey = legacyMap[legacyItem?.zh];
      if (!targetKey || normalized[targetKey]) return;
      normalized[targetKey] = legacyId;
    });
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
      if (definition.key === 'lensId') options = flatCatalog.lens;
      if (definition.key === 'opticalEffectId') options = flatCatalog.effects;
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
      if (definition.key === 'specialActionId') options = getByKey(catalog.character, '特殊動作 (Special Actions)');
      if (definition.key === 'topId') options = getByKey(catalog.wardrobe, '上身 (Tops)');
      if (definition.key === 'topPatternId') options = getByKey(catalog.wardrobe, '上身圖案 (Top Surface Design)');
      if (definition.key === 'pantsId') options = getByKey(catalog.wardrobe, '褲裝 (Pants)');
      if (definition.key === 'skirtId') options = getByKey(catalog.wardrobe, '裙裝 (Skirts)');
      if (definition.key === 'bottomPatternId') options = getByKey(catalog.wardrobe, '下身圖案 (Bottom Surface Design)');
      if (definition.key === 'legwearId') options = getByKey(catalog.wardrobe, '襪類 (Legwear)');
      if (definition.key === 'outerwearId') options = getByKey(catalog.wardrobe, '外套 (Outerwear)');
      if (definition.key === 'outerwearPatternId') options = getByKey(catalog.wardrobe, '外套圖案 (Outerwear Surface Design)');
      if (definition.key === 'shoesId') options = getByKey(catalog.wardrobe, '鞋款 (Shoes)');
      if (definition.key === 'eyewearId') options = getByKey(catalog.wardrobe, '眼鏡 (Eyewear)');
      if (definition.key === 'earringsId') options = getByKey(catalog.wardrobe, '耳環 (Earrings)');
      if (definition.key === 'neckAccessoryId') options = getByKey(catalog.wardrobe, '頸部 (Neck Accessories)');
      if (definition.key === 'wristAccessoryId') options = getByKey(catalog.wardrobe, '腕部 (Wrist Accessories)');
      if (definition.key === 'ringId') options = getByKey(catalog.wardrobe, '戒指 (Rings)');
      if (definition.key === 'waistAccessoryId') options = getByKey(catalog.wardrobe, '腰部 (Waist Accessories)');
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

function hasAnyTag(tagSet, tags) {
  return tags.some((tag) => tagSet.has(tag));
}

function getLocationEnvironmentFlags(location) {
  const tags = new Set(location?.meta?.tags || []);
  const outdoor = hasAnyTag(tags, ['outdoor', 'natural', 'waterfront', 'green_space']);
  const indoor = hasAnyTag(tags, ['indoor', 'studio', 'set', 'controlled', 'residential', 'hospitality', 'institutional'])
    || (!outdoor && tags.has('subterranean'));

  if (!indoor && !outdoor) {
    if (tags.has('urban') || tags.has('commercial')) return { indoor: false, outdoor: true };
    if (tags.has('transit')) return { indoor: true, outdoor: false };
  }

  return { indoor, outdoor };
}

function getLightingEnvironmentFlags(lighting) {
  const tags = new Set(lighting?.meta?.tags || []);

  const indoor = hasAnyTag(tags, [
    'supports_indoor',
    'supports_studio',
    'supports_residential',
    'supports_hospitality',
    'supports_heritage',
    'supports_commercial',
    'supports_subterranean',
    'window_light',
    'studio_light',
    'soft_light',
  ]);
  const outdoor = hasAnyTag(tags, [
    'supports_outdoor',
    'supports_urban',
    'supports_natural',
    'sunlight',
    'rain',
    'dusk',
    'mist',
    'night_ambient',
  ]);

  return { indoor, outdoor };
}

function getLightDirectionEnvironmentFlags(lightDirection) {
  const tags = new Set(lightDirection?.meta?.tags || []);

  const indoor = hasAnyTag(tags, ['supports_indoor', 'window_light', 'portrait_light', 'overhead', 'backlight']);
  const outdoor = hasAnyTag(tags, ['supports_outdoor', 'backlight', 'overhead']);

  return { indoor, outdoor };
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
  const locationEnvironment = getLocationEnvironmentFlags(location);
  const lightingEnvironment = getLightingEnvironmentFlags(lighting);

  // Hard-stop obviously invalid combinations before the broader support matrix
  // has a chance to allow them through via generic indoor tags.
  if ((locTags.has('ruin') || locTags.has('underground') || locTags.has('subterranean')) && lightTags.has('studio_light')) {
    return false;
  }

  if (locationEnvironment.indoor && !locationEnvironment.outdoor && !lightingEnvironment.indoor) return false;
  if (locationEnvironment.outdoor && !locationEnvironment.indoor && !lightingEnvironment.outdoor) return false;

  const sceneSupportChecks = [
    ['studio', 'supports_studio'],
    ['indoor', 'supports_indoor'],
    ['outdoor', 'supports_outdoor'],
    ['urban', 'supports_urban'],
    ['natural', 'supports_natural'],
    ['heritage', 'supports_heritage'],
    ['hospitality', 'supports_hospitality'],
    ['residential', 'supports_residential'],
    ['commercial', 'supports_commercial'],
    ['subterranean', 'supports_subterranean'],
  ];

  const supportedByScene = sceneSupportChecks.some(([sceneTag, supportTag]) => locTags.has(sceneTag) && lightTags.has(supportTag));
  if (supportedByScene) return true;

  if (locTags.has('studio')) return lightTags.has('studio_light') || lightTags.has('flash') || lightTags.has('soft_light');
  if (locTags.has('subterranean') || locTags.has('underground')) return lightTags.has('artificial_light') || lightTags.has('window_light');
  if (locTags.has('indoor')) return !lightTags.has('sunlight') || lightTags.has('window_light') || lightTags.has('soft_light');
  if (locTags.has('outdoor') || locTags.has('natural')) return !lightTags.has('studio_light') || lightTags.has('flash') || lightTags.has('soft_light');

  return true;
}

function lightDirectionSupportsScene(lightDirection, framing, location, lighting) {
  const directionTags = new Set(lightDirection.meta.tags);
  const locationTags = new Set(location.meta.tags);
  const lightingTags = new Set(lighting?.meta?.tags || []);
  const locationEnvironment = getLocationEnvironmentFlags(location);
  const directionEnvironment = getLightDirectionEnvironmentFlags(lightDirection);

  if (directionTags.has('portrait_light') && !visibilityAtLeast(framing.meta.visibility, 'medium')) return false;
  if (locationEnvironment.indoor && !locationEnvironment.outdoor && !directionEnvironment.indoor) return false;
  if (locationEnvironment.outdoor && !locationEnvironment.indoor && !directionEnvironment.outdoor) return false;
  if (directionTags.has('window_light') && !(locationTags.has('indoor') || locationTags.has('residential') || locationTags.has('hospitality') || locationTags.has('heritage'))) return false;
  if (directionTags.has('portrait_light') && lightingTags.has('natural_light') && !lightingTags.has('window_light') && !lightingTags.has('soft_light')) return false;
  if ((locationTags.has('outdoor') || locationTags.has('natural')) && directionTags.has('window_light')) return false;
  if (lightingTags.has('sunlight') && directionTags.has('artificial_light')) return false;
  if (lightingTags.has('dark') && directionTags.has('window_light')) return false;
  if (locationTags.has('subterranean') && directionTags.has('window_light')) return false;
  if (lightingTags.has('indoor') && directionTags.has('sunlight')) return false;
  if (lightingTags.has('window_light') && directionTags.has('sunlight')) return false;
  if ((lightingTags.has('dark') || lightingTags.has('dusk') || lightingTags.has('neon')) && directionTags.has('sunlight')) return false;
  if ((lightingTags.has('mist') || lightingTags.has('cloudy') || lightingTags.has('rain')) && directionTags.has('sunlight')) return false;
  if (lightingTags.has('rain') && directionTags.has('sunlight') && !directionTags.has('reflective')) return false;
  if (lightingTags.has('neon') && directionTags.has('window_light')) return false;
  if (lightingTags.has('stage_light') && !directionTags.has('artificial_light') && !directionTags.has('dark') && !directionTags.has('overhead')) return false;

  return true;
}

export function getSceneDependentOptions(customLibrary = [], rawLocks = {}) {
  const runtime = buildCatalog(customLibrary);
  const locks = normalizeLocks(rawLocks);
  const fallbackFraming = runtime.flatCatalog.framing.find((item) => item.en.includes('medium shot')) || runtime.flatCatalog.framing[0];
  const location = findById(runtime.flatCatalog.locations, locks.locationId);
  const selectedLighting = findById(runtime.flatCatalog.lighting, locks.lightingId);
  const framing = findById(runtime.flatCatalog.framing, locks.framingId) || fallbackFraming;

  const lightingOptions = location
    ? runtime.flatCatalog.lighting.filter((item) => item.zh === '全無' || locationSupportsLighting(location, item))
    : runtime.flatCatalog.lighting;

  const lightingForDirection = selectedLighting && lightingOptions.some((item) => item.id === selectedLighting.id) ? selectedLighting : null;

  const lightDirectionOptions = location
    ? runtime.flatCatalog.lightDirection.filter(
        (item) => item.zh === '全無' || lightDirectionSupportsScene(item, framing, location, lightingForDirection)
      )
    : runtime.flatCatalog.lightDirection;

  return { lightingOptions, lightDirectionOptions };
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
  if (item.meta.tags.includes('direct_gaze') && context.orbit && !orbitSupportsExpression(context.orbit, item)) return false;
  if (context.orbit?.meta.tags.includes('back_view') && (item.meta.tags.includes('side_gaze') || item.meta.tags.includes('distance_gaze'))) return false;
  return true;
}

function angleSupportsExpression(angle, expression) {
  if (!expression) return true;
  if (expression.meta.tags.includes('direct_gaze') && angle.meta.tags.includes('aerial')) return false;
  if (expression.meta.tags.includes('requires_aerial') && !angle.meta.tags.includes('aerial')) return false;
  return true;
}

function orbitSupportsExpression(orbit, expression) {
  if (!expression) return true;
  const orbitTags = new Set(orbit.meta.tags || []);
  const expressionTags = new Set(expression.meta.tags || []);

  if (expressionTags.has('direct_gaze')) {
    if (orbitTags.has('back_view') || orbitTags.has('rear_three_quarter') || orbitTags.has('profile_view')) return false;
  }

  if ((expressionTags.has('distance_gaze') || expressionTags.has('side_gaze')) && orbitTags.has('back_view')) return false;

  return true;
}

function specialActionSupportsOrbit(orbit, action) {
  if (!action || isNoneLikeItem(action)) return true;
  const orbitTags = new Set(orbit.meta?.tags || []);
  const actionTags = new Set(action.meta?.tags || []);

  if (actionTags.has('face_action')) {
    if (orbitTags.has('back_view') || orbitTags.has('rear_three_quarter')) return false;
  }

  if (actionTags.has('full_body_action') || actionTags.has('leg_focus_action')) {
    if (orbitTags.has('back_view')) return false;
  }

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

function specialActionSupportsFraming(action, framing) {
  if (!action || isNoneLikeItem(action)) return true;

  const visibility = framing.meta.visibility;
  const actionTags = new Set(action.meta?.tags || []);

  if (actionTags.has('leg_focus_action') || actionTags.has('large_prop_action') || actionTags.has('full_body_action')) {
    return visibility === 'full' || visibility === 'wide';
  }

  if (actionTags.has('prop_action') || actionTags.has('wardrobe_action')) {
    return visibility !== 'close';
  }

  return visibility !== 'close';
}

function buildSubjectBase(subject) {
  return {
    zh: subject.reference ? '一位以附圖人物五官為主的女性' : subject.count === 2 ? '兩位性感驚豔的東亞女性' : '一位性感驚豔的東亞女性',
    en: subject.en,
    id: `base-character-${subject.id}`,
    meta: { tags: ['female', subject.count === 2 ? 'duo' : 'solo'] },
  };
}

function pickWithLock(list, lockedId, predicate = () => true, picker = sample) {
  if (lockedId) {
    const locked = findById(list, lockedId);
    if (locked) return locked;
  }

  const matches = list.filter(predicate);
  return matches.length > 0 ? picker(matches) : picker(list);
}

function buildCharacter(context, catalog) {
  const character = [buildSubjectBase(context.subject)];
  const visibility = context.framing.meta.visibility;
  const isReferenceSubject = Boolean(context.subject.reference);
  let lockedArchetype = null;

  const lockKeyByCategory = {
    '體態 (Body Type)': 'bodyTypeId',
    '五官特徵 (Facial Features)': 'facialFeaturesId',
    '膚質特徵 (Skin Details)': 'skinDetailsId',
    '髮型 (Hairstyle)': 'hairstyleId',
    '髮色 (Hair Color)': 'hairColorId',
    '神情與眼神 (Expression & Gaze)': 'expressionId',
    '姿勢與肢體語言 (Pose & Body Language)': 'poseId',
    '特殊動作 (Special Actions)': 'specialActionId',
  };

  const pickCategory = (categoryKey, locks, customPredicate = () => true, picker = sample, respectVisibility = true) => {
    const categoryItems = getByKey(catalog.character, categoryKey);
    const lockedId = locks?.[lockKeyByCategory[categoryKey]];
    const lockedItem = lockedId ? findById(categoryItems, lockedId) : null;

    if (lockedItem && customPredicate(lockedItem)) {
      if (lockedItem.meta.archetype && !lockedArchetype) lockedArchetype = lockedItem.meta.archetype;
      character.push(lockedItem);
      return lockedItem;
    }

    const candidates = categoryItems.filter(
      (item) => (!respectVisibility || detailAllowed(item, context.framing)) && customPredicate(item)
    );
    if (candidates.length === 0) return null;
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
    const categoryItems = getByKey(catalog.character, categoryKey);
    const locked = lockedId ? findById(categoryItems, lockedId) : null;
    if (locked && predicate(locked)) return cloneCharacterRole(locked, role);

    const candidates = categoryItems.filter(
      (item) => detailAllowed(item, context.framing) && predicate(item)
    );
    if (candidates.length === 0) return null;

    const usedIds = new Set(currentItems.map((item) => item?.id?.split(':')[0]).filter(Boolean));
    const distinct = candidates.filter((item) => !usedIds.has(item.id));
    const picked = picker(distinct.length > 0 ? distinct : candidates);
    return picked ? cloneCharacterRole(picked, role) : null;
  };

  if (!isReferenceSubject || context.locks?.bodyTypeId) {
    pickCategory('體態 (Body Type)', context.locks, () => true, sample, false);
  }

  if (context.subject.count === 1 && (context.locks?.facialFeaturesId || (!isReferenceSubject && visibilityAtLeast(visibility, 'medium')))) {
    pickCategory('五官特徵 (Facial Features)', context.locks, (item) => !lockedArchetype || !item.meta.archetype || item.meta.archetype === lockedArchetype);
  }

  if (context.subject.count === 1 && (context.locks?.skinDetailsId || (!isReferenceSubject && visibilityAtLeast(visibility, 'medium') && Math.random() < 0.55))) {
    pickCategory('膚質特徵 (Skin Details)', context.locks);
  }

  if (context.subject.count === 2 && (visibilityAtLeast(visibility, 'medium') || context.locks?.facialFeaturesAId || context.locks?.facialFeaturesBId)) {
    const faceA = pickDistinctForRole('五官特徵 (Facial Features)', 'a', context.locks?.facialFeaturesAId, [], sample);
    const faceB = pickDistinctForRole('五官特徵 (Facial Features)', 'b', context.locks?.facialFeaturesBId, [faceA], sample);
    if (faceA) character.push(faceA);
    if (faceB) character.push(faceB);
  }

  if (context.subject.count === 2 && (context.locks?.skinDetailsId || (visibilityAtLeast(visibility, 'portrait') && Math.random() < 0.45))) {
    pickCategory('膚質特徵 (Skin Details)', context.locks);
  }

  if (context.subject.count === 1 && (context.locks?.hairstyleId || context.locks?.hairColorId || (!isReferenceSubject && visibilityAtLeast(visibility, 'medium')))) {
    pickCategory('髮型 (Hairstyle)', context.locks);
    pickCategory('髮色 (Hair Color)', context.locks, () => true, pickHairColor);
  }

  if (context.subject.count === 2 && (visibilityAtLeast(visibility, 'medium') || context.locks?.hairstyleAId || context.locks?.hairstyleBId || context.locks?.hairColorAId || context.locks?.hairColorBId)) {
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

  const specialAction = context.locks?.specialActionId
    ? pickCategory('特殊動作 (Special Actions)', context.locks, () => true, sample, false)
    : null;
  if (specialAction && !isNoneLikeItem(specialAction)) return character;

  if (context.locks?.poseId) {
    pickCategory('姿勢與肢體語言 (Pose & Body Language)', context.locks, () => true, sample, false);
  } else if (visibilityAtLeast(visibility, 'full')) {
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
    '上身圖案 (Top Surface Design)': 'topPatternId',
    '褲裝 (Pants)': 'pantsId',
    '裙裝 (Skirts)': 'skirtId',
    '下身圖案 (Bottom Surface Design)': 'bottomPatternId',
    '襪類 (Legwear)': 'legwearId',
    '外套 (Outerwear)': 'outerwearId',
    '外套圖案 (Outerwear Surface Design)': 'outerwearPatternId',
    '鞋款 (Shoes)': 'shoesId',
    '眼鏡 (Eyewear)': 'eyewearId',
    '耳環 (Earrings)': 'earringsId',
    '頸部 (Neck Accessories)': 'neckAccessoryId',
    '腕部 (Wrist Accessories)': 'wristAccessoryId',
    '戒指 (Rings)': 'ringId',
    '腰部 (Waist Accessories)': 'waistAccessoryId',
  };

  const addPiece = (item) => {
    if (!item || pieces.some((piece) => piece.id === item.id)) return;
    pieces.push(item);
  };

  const maybePick = (categoryKey, probability = 1, extraPredicate = () => true, { allowNoneWhenUnlocked = false } = {}) => {
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
        (allowNoneWhenUnlocked || !isNoneLikeItem(item)) &&
        wardrobeFitsLocation(item, context.location) &&
        extraPredicate(item)
    );
    if (candidates.length === 0) return null;
    const picked = sample(candidates);
    addPiece(picked);
    return picked;
  };

  const topPiece = maybePick('上身 (Tops)');
  const hasTopPiece = Array.isArray(topPiece)
    ? topPiece.some((item) => item && !isNoneLikeItem(item))
    : Boolean(topPiece && !isNoneLikeItem(topPiece));

  if (!hasTopPiece && !locks?.topId) {
    const fallbackTop = getByKey(catalog.catalog.wardrobe, '上身 (Tops)').find(
      (item) => !isNoneLikeItem(item) && wardrobeFitsLocation(item, context.location)
    );
    addPiece(fallbackTop);
  }

  if (hasTopPiece || locks?.topPatternId) {
    maybePick('上身圖案 (Top Surface Design)', 0.35, () => true, { allowNoneWhenUnlocked: false });
  }

  const hasLockedPants = Boolean(locks?.pantsId);
  const hasLockedSkirt = Boolean(locks?.skirtId);
  const hasLockedBottom = hasLockedPants || hasLockedSkirt;
  let hasBottomPiece = false;

  if (frameShowsAtLeast(visibility, 'medium') || hasLockedBottom) {
    if (hasLockedPants && hasLockedSkirt) {
      const pickedPants = maybePick('褲裝 (Pants)');
      const pickedSkirt = maybePick('裙裝 (Skirts)');
      hasBottomPiece = Boolean(
        (Array.isArray(pickedPants) ? pickedPants : [pickedPants]).concat(Array.isArray(pickedSkirt) ? pickedSkirt : [pickedSkirt])
          .filter(Boolean)
          .some((item) => !isNoneLikeItem(item))
      );
    } else if (hasLockedPants) {
      const pickedPants = maybePick('褲裝 (Pants)');
      hasBottomPiece = Boolean((Array.isArray(pickedPants) ? pickedPants : [pickedPants]).filter(Boolean).some((item) => !isNoneLikeItem(item)));
    } else if (hasLockedSkirt) {
      const pickedSkirt = maybePick('裙裝 (Skirts)');
      hasBottomPiece = Boolean((Array.isArray(pickedSkirt) ? pickedSkirt : [pickedSkirt]).filter(Boolean).some((item) => !isNoneLikeItem(item)));
    } else if (Math.random() < 0.5) {
      const pickedPants = maybePick('褲裝 (Pants)');
      hasBottomPiece = Boolean((Array.isArray(pickedPants) ? pickedPants : [pickedPants]).filter(Boolean).some((item) => !isNoneLikeItem(item)));
    } else {
      const pickedSkirt = maybePick('裙裝 (Skirts)');
      hasBottomPiece = Boolean((Array.isArray(pickedSkirt) ? pickedSkirt : [pickedSkirt]).filter(Boolean).some((item) => !isNoneLikeItem(item)));
    }

    if (hasBottomPiece) {
      maybePick('下身圖案 (Bottom Surface Design)', 0.3, () => true, { allowNoneWhenUnlocked: false });
    }
    maybePick('襪類 (Legwear)', 0.45, (item) => {
      if (item.meta.tags.includes('legwear') && item.en.includes('bare legs')) return true;
      if (pieces.some((piece) => piece.meta.tags.includes('pants'))) return item.en.includes('bare legs');
      return true;
    });
    const outerwearPiece = maybePick('外套 (Outerwear)', context.location.meta.tags.includes('outdoor') ? 0.6 : 0.35);
    const hasOuterwearPiece = Array.isArray(outerwearPiece)
      ? outerwearPiece.some((item) => item && !isNoneLikeItem(item))
      : Boolean(outerwearPiece && !isNoneLikeItem(outerwearPiece));

    if (hasOuterwearPiece) {
      maybePick('外套圖案 (Outerwear Surface Design)', 0.3, () => true, { allowNoneWhenUnlocked: false });
    }
  }

  if (!frameShowsAtLeast(visibility, 'medium') && locks?.legwearId) {
    maybePick('襪類 (Legwear)', 1, (item) => {
      if (item.meta.tags.includes('legwear') && item.en.includes('bare legs')) return true;
      if (pieces.some((piece) => piece.meta.tags.includes('pants'))) return item.en.includes('bare legs');
      return true;
    });
  }

  if (!frameShowsAtLeast(visibility, 'medium') && locks?.outerwearId) {
    const outerwearPiece = maybePick('外套 (Outerwear)', 1);
    const hasOuterwearPiece = Array.isArray(outerwearPiece)
      ? outerwearPiece.some((item) => item && !isNoneLikeItem(item))
      : Boolean(outerwearPiece && !isNoneLikeItem(outerwearPiece));
    if (hasOuterwearPiece) {
      maybePick('外套圖案 (Outerwear Surface Design)', 1);
    }
  }

  if (frameShowsAtLeast(visibility, 'full') || locks?.shoesId) {
    maybePick('鞋款 (Shoes)');
  }

  maybePick('眼鏡 (Eyewear)', visibilityAtLeast(visibility, 'portrait') ? 0.35 : 0.15);
  maybePick('耳環 (Earrings)', visibilityAtLeast(visibility, 'portrait') ? 0.45 : 0.2);
  maybePick('頸部 (Neck Accessories)', visibilityAtLeast(visibility, 'portrait') ? 0.4 : 0.2);
  maybePick('腕部 (Wrist Accessories)', frameShowsAtLeast(visibility, 'medium') ? 0.3 : 0.15);
  maybePick('戒指 (Rings)', frameShowsAtLeast(visibility, 'medium') ? 0.25 : 0.1);
  maybePick('腰部 (Waist Accessories)', frameShowsAtLeast(visibility, 'medium') ? 0.35 : 0.15);

  return pieces;
}

function buildSummaryFields(context, wardrobe, character, wardrobeColors) {
  const joinSummaryParts = (...parts) => {
    const filtered = parts.filter((part) => part && part !== '-');
    return filtered.length > 0 ? filtered.join(' / ') : '-';
  };
  const subjectLabel = context.subject.reference
    ? '一位以附圖人物五官為主的女性'
    : context.subject.count === 2
      ? '兩位性感驚豔的日系或韓系女性'
      : '一位性感驚豔的日系或韓系女性';
  const characterSlots = extractCharacterSlots(character);
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
  const styleLabel = context.style && !isNoneLikeItem(context.style) ? context.style.zh : '-';
  const locationLabel = context.location && !isNoneLikeItem(context.location) ? context.location.zh : '-';
  const framingLabel = context.framing && !isNoneLikeItem(context.framing) ? context.framing.zh : '-';
  const angleLabel = context.angle && !isNoneLikeItem(context.angle) ? context.angle.zh : '-';
  const orbitLabel = context.orbit && !isNoneLikeItem(context.orbit) ? context.orbit.zh : '-';
  const lensLabel = context.lens && !isNoneLikeItem(context.lens) ? context.lens.zh : '-';
  const aspectRatioLabel = context.aspectRatio?.zh || '-';
  const lightingLabel = !context.styleDrivenCamera && context.lighting && !isNoneLikeItem(context.lighting) ? context.lighting.zh : '-';
  const opticalEffectLabel = context.opticalEffect && !isNoneLikeItem(context.opticalEffect) ? context.opticalEffect.zh : '-';
  const formatPresetSummary = (preset, color) => {
    if (!preset) return '';
    return color?.zh ? `${color.zh}｜${preset.zh}` : preset.zh;
  };
  const summarizeSingleCharacter = () => {
    const hairSummary = joinSummaryParts(
      characterSlots.hairstyle?.zh && !isNoneLikeItem(characterSlots.hairstyle) ? characterSlots.hairstyle.zh : '',
      characterSlots.hairColor?.zh && !isNoneLikeItem(characterSlots.hairColor) ? characterSlots.hairColor.zh : ''
    );

    return joinSummaryParts(
      subjectLabel,
      characterSlots.bodyType?.zh && !isNoneLikeItem(characterSlots.bodyType) ? characterSlots.bodyType.zh : '',
      characterSlots.facialFeatures?.zh && !isNoneLikeItem(characterSlots.facialFeatures) ? characterSlots.facialFeatures.zh : '',
      hairSummary !== '-' ? hairSummary : '',
      characterSlots.expression?.zh && !isNoneLikeItem(characterSlots.expression) ? characterSlots.expression.zh : '',
      characterSlots.specialAction?.zh && !isNoneLikeItem(characterSlots.specialAction) ? characterSlots.specialAction.zh : '',
      characterSlots.pose?.zh && !isNoneLikeItem(characterSlots.pose) ? characterSlots.pose.zh : ''
    );
  };
  const summarizeDuoRole = (face, hair, color) => {
    const hairSummary = joinSummaryParts(
      hair?.zh && !isNoneLikeItem(hair) ? hair.zh : '',
      color?.zh && !isNoneLikeItem(color) ? color.zh : ''
    );
    const summary = joinSummaryParts(
      face?.zh && !isNoneLikeItem(face) ? face.zh : '',
      hairSummary !== '-' ? hairSummary : ''
    );
    return summary === '-' ? '' : summary;
  };
  const summarizeWardrobe = () => {
    if (wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB) {
      return [
        formatPresetSummary(wardrobeSlots.outfitPresetA, wardrobeColors.outfitPresetAColor),
        formatPresetSummary(wardrobeSlots.outfitPresetB, wardrobeColors.outfitPresetBColor),
      ].filter(Boolean).join(' / ') || '-';
    }

    if (wardrobeSlots.outfitPreset) {
      return formatPresetSummary(wardrobeSlots.outfitPreset, wardrobeColors.outfitPresetColor) || '-';
    }

    const topLabel = wardrobeSlots.top?.zh && !isNoneLikeItem(wardrobeSlots.top)
      ? joinSummaryParts(
          wardrobeSlots.top.zh,
          wardrobeSlots.topPattern?.zh && !isNoneLikeItem(wardrobeSlots.topPattern) ? wardrobeSlots.topPattern.zh : ''
        )
      : '';
    const bottomLabel = wardrobeSlots.pants?.zh && !isNoneLikeItem(wardrobeSlots.pants)
      ? joinSummaryParts(
          wardrobeSlots.pants.zh,
          wardrobeSlots.bottomPattern?.zh && !isNoneLikeItem(wardrobeSlots.bottomPattern) ? wardrobeSlots.bottomPattern.zh : ''
        )
      : wardrobeSlots.skirt?.zh && !isNoneLikeItem(wardrobeSlots.skirt)
        ? joinSummaryParts(
            wardrobeSlots.skirt.zh,
            wardrobeSlots.bottomPattern?.zh && !isNoneLikeItem(wardrobeSlots.bottomPattern) ? wardrobeSlots.bottomPattern.zh : ''
          )
        : '';
    const shoeLabel = wardrobeSlots.shoes?.zh && !isNoneLikeItem(wardrobeSlots.shoes) ? wardrobeSlots.shoes.zh : '';
    const outerwearLabel = wardrobeSlots.outerwear?.zh && !isNoneLikeItem(wardrobeSlots.outerwear)
      ? joinSummaryParts(
          wardrobeSlots.outerwear.zh,
          wardrobeSlots.outerwearPattern?.zh && !isNoneLikeItem(wardrobeSlots.outerwearPattern) ? wardrobeSlots.outerwearPattern.zh : ''
        )
      : '';
    return joinSummaryParts(
      topLabel,
      bottomLabel,
      outerwearLabel,
      shoeLabel
    );
  };

  return {
    style: styleLabel,
    character: context.subject.count === 2
      ? joinSummaryParts(
          subjectLabel,
          summarizeDuoRole(characterSlots.facialFeaturesA, characterSlots.hairstyleA, characterSlots.hairColorA)
            ? `人物 1：${summarizeDuoRole(characterSlots.facialFeaturesA, characterSlots.hairstyleA, characterSlots.hairColorA)}`
            : '',
          summarizeDuoRole(characterSlots.facialFeaturesB, characterSlots.hairstyleB, characterSlots.hairColorB)
            ? `人物 2：${summarizeDuoRole(characterSlots.facialFeaturesB, characterSlots.hairstyleB, characterSlots.hairColorB)}`
            : '',
          characterSlots.expression?.zh && !isNoneLikeItem(characterSlots.expression) ? characterSlots.expression.zh : ''
        )
      : summarizeSingleCharacter(),
    wardrobe: summarizeWardrobe(),
    location: locationLabel,
    camera: joinSummaryParts(framingLabel, angleLabel, orbitLabel, lensLabel, aspectRatioLabel),
    lighting: context.styleDrivenCamera
      ? (opticalEffectLabel !== '-' ? `由攝影風格決定 / ${opticalEffectLabel}` : '由攝影風格決定')
      : joinSummaryParts(lightingLabel, opticalEffectLabel),
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
    en.includes('bare legs') ||
    en === 'none'
  );
}

const STYLE_PROMPT_INTROS = {
  'Mika Ninagawa（蜷川實花）': 'Inspired by Mika Ninagawa, explosive hyper-saturated image language',
  'Yoshihiko Ueda（上田義彥）': 'Inspired by Yoshihiko Ueda, quiet natural image language',
  'Osamu Yokonami（橫浪修）': 'Inspired by Osamu Yokonami, high-key minimalist image language',
  'Rinko Kawauchi（川內倫子）': 'Inspired by Rinko Kawauchi, airy high-key image language',
  'Masumi Ishida（石田真澄）': 'Inspired by Masumi Ishida, luminous summer film image language',
  'Orie Ichihashi（市橋織江）': 'Inspired by Orie Ichihashi, transparent natural-light image language',
  'Yoko Takahashi（高橋ヨーコ）': 'Inspired by Yoko Takahashi, breezy sun-bleached coastal image language',
  'Paolo Roversi（保羅・羅韋爾西）': 'Inspired by Paolo Roversi, soft haze editorial image language',
  'Ellen von Unwerth（艾倫・馮・昂沃斯）': 'Inspired by Ellen von Unwerth, playful sensual editorial image language',
  'Nan Goldin（南・戈爾丁）': 'Inspired by Nan Goldin, intimate lived-in image language',
  'Juergen Teller（尤爾根・特勒）': 'Inspired by Juergen Teller, raw direct-flash image language',
  'Richard Avedon（理察・阿維頓）': 'Inspired by Richard Avedon, stripped-down studio image language',
  'Alec Soth（亞歷克・索斯）': 'Inspired by Alec Soth, spacious documentary image language',
  'Sally Mann（莎莉・曼）': 'Inspired by Sally Mann, antique wet-plate image language',
  'Wolfgang Tillmans（沃夫岡・提爾曼斯）': 'Inspired by Wolfgang Tillmans, casual everyday image language',
  'Daido Moriyama（森山大道）': 'Inspired by Daido Moriyama, gritty high-contrast street image language',
  'Yuki Aoyama（青山裕企）': 'Inspired by Yuki Aoyama, youthful Japanese portrait image language',
  'Guy Bourdin（蓋・布爾丁）': 'Inspired by Guy Bourdin, bold narrative fashion image language',
  'Miles Aldridge（邁爾斯・奧爾德里奇）': 'Inspired by Miles Aldridge, hyper-stylized studio image language',
  'Elsa Bleda（艾爾莎·布萊達）': 'Inspired by Elsa Bleda, nocturnal neon image language',
};

function buildPhotographyStylePrompt(style) {
  if (!style || isNoneLikeItem(style)) return '';

  const intro = STYLE_PROMPT_INTROS[style.zh] || 'editorial photography mood';
  const styleText = stripMarkdown(style.en).replace(/\s+/g, ' ').trim();
  if (!styleText) return intro;

  const dedupedStyleText = styleText.replace(/^Inspired by [^,]+,\s*/i, '');
  if (!dedupedStyleText) return intro;
  if (dedupedStyleText === styleText) return `${intro}. ${styleText}`;
  return `${intro}. ${dedupedStyleText}`;
}

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
    '柔和順光': 'soft frontal light across both women, even luminous facial clarity, balanced duo portrait lighting',
    '均勻平光': 'flat even light across both women, clean readable facial information, balanced duo exposure',
    '側向柔光': 'soft side light across both women, gentle dimensional contour, balanced duo editorial lighting',
    '逆光輪廓光': 'backlit two-subject image, glowing edge light on both silhouettes, gentle separation from the background',
    '窗格投影光': 'window-pattern light across both women, subtle graphic interior contrast, cinematic duo atmosphere',
    '百葉窗條紋投影光': 'window-blind stripe light across both women, slatted daylight bands falling on faces, bodies, and clothing, intimate cinematic interior contrast',
    '頂部照明': 'overhead top light across both women, moody duo cinematic contrast, tense cinematic atmosphere',
  },
  expression: {
    '直視鏡頭｜清透微笑': 'both women looking toward the camera, subtle shared smile, calm confident duo presence',
    '直視鏡頭｜平靜凝視': 'both women holding a calm direct gaze, composed neutral expression, quiet shared presence',
    '直視鏡頭｜慵懶半瞇眼': 'both women with relaxed half-lidded eyes, languid gaze, shared editorial chemistry',
    '直視鏡頭｜唇微開凝視': 'both women looking toward the camera with lips slightly parted, intimate editorial tension, controlled sensual mood',
    '直視鏡頭｜挑釁凝視': 'both women with bold direct gaze, confident challenging expression, strong shared presence',
    '直視鏡頭｜無辜清透眼神': 'both women looking toward the camera with clear innocent eyes, delicate soft expression, pure shared mood',
    '望向遠方｜若有所思': 'both women gazing away or slightly off-camera, thoughtful mood, quiet shared atmosphere',
    '側望｜安靜出神': 'both women looking off to the side, understated absent-minded mood, soft distant shared focus',
    '低頭不看鏡頭｜內斂情緒': 'both women lowering their gaze away from camera, restrained inward emotion, quiet introspective duo mood',
    '大笑｜自然喜悅': 'both women laughing naturally, candid joyful chemistry, lively duo energy',
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
    specialAction: findSlot('character:特殊動作-special-actions:'),
  };
}

function extractWardrobeSlots(wardrobe) {
  const findSlot = (token) => wardrobe.find((item) => item.id?.includes(token));
  const outfitPresets = wardrobe.filter((item) => item.id?.includes('wardrobe:套裝-outfit-presets:'));
  return {
    outfitPreset: outfitPresets.find((item) => !item.meta?.outfitRole) || null,
    outfitPresetA: outfitPresets.find((item) => item.meta?.outfitRole === 'a') || null,
    outfitPresetB: outfitPresets.find((item) => item.meta?.outfitRole === 'b') || null,
    top: findSlot('wardrobe:上身-tops:'),
    topPattern: findSlot('wardrobe:上身圖案-top-surface-design:'),
    pants: findSlot('wardrobe:褲裝-pants:'),
    skirt: findSlot('wardrobe:裙裝-skirts:'),
    bottomPattern: findSlot('wardrobe:下身圖案-bottom-surface-design:'),
    legwear: findSlot('wardrobe:襪類-legwear:'),
    outerwear: findSlot('wardrobe:外套-outerwear:'),
    outerwearPattern: findSlot('wardrobe:外套圖案-outerwear-surface-design:'),
    shoes: findSlot('wardrobe:鞋款-shoes:'),
    eyewear: findSlot('wardrobe:眼鏡-eyewear:'),
    earrings: findSlot('wardrobe:耳環-earrings:'),
    neckAccessory: findSlot('wardrobe:頸部-neck-accessories:'),
    wristAccessory: findSlot('wardrobe:腕部-wrist-accessories:'),
    ring: findSlot('wardrobe:戒指-rings:'),
    waistAccessory: findSlot('wardrobe:腰部-waist-accessories:'),
  };
}

function buildWardrobeColors(wardrobeSlots, locks) {
  if (wardrobeSlots.outfitPreset || wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB) {
    const outfitPresetColor = wardrobeSlots.outfitPreset && !isNoneLikeItem(wardrobeSlots.outfitPreset)
      ? getOutfitPresetColorOption(locks?.outfitPresetColorId) || sample(OUTFIT_PRESET_COLOR_OPTIONS)
      : null;
    const outfitPresetAColor = wardrobeSlots.outfitPresetA && !isNoneLikeItem(wardrobeSlots.outfitPresetA)
      ? getOutfitPresetColorOption(locks?.outfitPresetAColorId) || sample(OUTFIT_PRESET_COLOR_OPTIONS)
      : null;
    const outfitPresetBColor = wardrobeSlots.outfitPresetB && !isNoneLikeItem(wardrobeSlots.outfitPresetB)
      ? getOutfitPresetColorOption(locks?.outfitPresetBColorId) || sample(OUTFIT_PRESET_COLOR_OPTIONS)
      : null;
    return {
      outfitPresetColor,
      outfitPresetAColor,
      outfitPresetBColor,
      topColor: null,
      bottomColor: null,
      legwearColor: null,
      outerwearColor: null,
      shoesColor: null,
    };
  }
  const topColor = wardrobeSlots.top && !isNoneLikeItem(wardrobeSlots.top) ? getGarmentColorOption(locks?.topColorId) || sample(GARMENT_COLOR_OPTIONS) : null;
  const hasBottom = (wardrobeSlots.pants && !isNoneLikeItem(wardrobeSlots.pants)) || (wardrobeSlots.skirt && !isNoneLikeItem(wardrobeSlots.skirt));
  const bottomColor = hasBottom ? getGarmentColorOption(locks?.bottomColorId) || sample(GARMENT_COLOR_OPTIONS) : null;
  const legwearColor = wardrobeSlots.legwear && !isNoneLikeItem(wardrobeSlots.legwear) ? getLegwearColorOption(locks?.legwearColorId) || sample(LEGWEAR_COLOR_OPTIONS) : null;
  const outerwearColor = wardrobeSlots.outerwear && !isNoneLikeItem(wardrobeSlots.outerwear) ? getLayerColorOption(locks?.outerwearColorId) || sample(LAYER_COLOR_OPTIONS) : null;
  const shoesColor = wardrobeSlots.shoes && !isNoneLikeItem(wardrobeSlots.shoes) ? getLayerColorOption(locks?.shoesColorId) || sample(LAYER_COLOR_OPTIONS) : null;
  return {
    outfitPresetColor: null,
    outfitPresetAColor: null,
    outfitPresetBColor: null,
    topColor,
    bottomColor,
    legwearColor,
    outerwearColor,
    shoesColor,
  };
}

function buildColoredGrokPrompt(item, color = null, { preset = false, pattern = null } = {}) {
  if (!item || isNoneLikeItem(item)) return '';
  const base = stripMarkdown(item.en).replace(/\s+/g, ' ').trim();
  if (!base) return '';
  if (item.zh === '赤腳' || /bare feet|visible toes/i.test(base)) return base;
  const patternText = pattern && !isNoneLikeItem(pattern)
    ? stripMarkdown(pattern.en).replace(/\s+/g, ' ').trim()
    : '';
  if (!color || isNoneLikeItem(color)) return patternText ? `${base}, ${patternText}` : base;

  if (preset) {
    return `${color.en} ${base.replace(/^wearing\s+/i, '')}`;
  }

  const coloredBase = `${color.en} ${base}`;
  return patternText ? `${coloredBase}, ${patternText}` : coloredBase;
}

function buildHairColorPrompt(item) {
  if (!item || isNoneLikeItem(item)) return '';
  const base = stripMarkdown(item.en).replace(/\s+/g, ' ').trim();
  if (!base) return '';

  const highRiskHairColorNames = new Set(['淺金髮', '銅紅髮', '灰白色']);
  const requiresEyebrowGuard = highRiskHairColorNames.has(item.zh) || item.meta?.tags?.includes('special_hair_color');

  if (!requiresEyebrowGuard) return base;

  return `${base}, hair color applies only to the scalp hair, eyebrows remain natural and realistic, not dyed to match the hair`;
}

function buildAccessoryPrompt(item) {
  if (!item || isNoneLikeItem(item)) return '';
  return stripMarkdown(item.en).replace(/\s+/g, ' ').trim();
}

function buildFacialFeaturesPrompt(faceItem, { eyewear, earrings } = {}) {
  const baseFace = faceItem && !isNoneLikeItem(faceItem)
    ? stripMarkdown(faceItem.en).replace(/\s+/g, ' ').trim()
    : '';
  const faceAccessories = [buildAccessoryPrompt(eyewear), buildAccessoryPrompt(earrings)].filter(Boolean);

  if (!baseFace && faceAccessories.length === 0) return '';
  if (!baseFace) return faceAccessories.join(', ');
  if (faceAccessories.length === 0) return baseFace;
  return `${baseFace}. ${faceAccessories.join(', ')}`;
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

function ensureTerminalPeriod(value) {
  const cleaned = stripMarkdown(value).trim();
  if (!cleaned) return '';
  if (/[.!?]$/.test(cleaned)) return cleaned;
  return `${cleaned}.`;
}

function sanitizeMidjourneyText(value) {
  let cleaned = stripMarkdown(value)
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  const replacements = [
    [/\ban elegant beautiful\b/gi, 'an elegant beautiful'],
    [/\btwo elegant beautiful\b/gi, 'two elegant beautiful'],
    [/\ba seductive stunning\b/gi, 'an elegant beautiful'],
    [/\btwo seductive stunning\b/gi, 'two elegant beautiful'],
    [/\bseductive\b/gi, 'elegant'],
    [/\bsexy\b/gi, 'feminine'],
    [/\blingerie\b/gi, 'fashion'],
    [/\bbdsm\b/gi, 'editorial'],
    [/\bbondage\b/gi, 'strap-detailed'],
    [/\bfetish\b/gi, 'avant-garde'],
    [/\bboudoir\b/gi, 'editorial'],
    [/\blatex\b/gi, 'coated fabric'],
    [/\bbikini top\b/gi, 'cropped top'],
    [/\bbikini\b/gi, 'swimwear'],
    [/\bbodysuit\b/gi, 'suit'],
    [/\bnightdress\b/gi, 'slip dress'],
    [/\bgarter\b/gi, 'stocking'],
    [/\bsee-through\b/gi, 'lightweight'],
    [/\bsheer\b/gi, 'lightweight'],
    [/\btransparent\b/gi, 'lightweight'],
    [/\bnude\b/gi, 'natural'],
  ];

  replacements.forEach(([pattern, next]) => {
    cleaned = cleaned.replace(pattern, next);
  });

  if (/\b(nsfw|sexual organ|explicit adult)\b/i.test(cleaned)) return '';

  return cleaned.replace(/\s+/g, ' ').trim();
}

function formatMidjourneySectionText(items, maxParts = null) {
  const cleaned = items
    .flat()
    .map((item) => sanitizeMidjourneyText(item))
    .filter((item) => item && item.toLowerCase() !== 'none');

  if (cleaned.length === 0) return '';
  const sliced = maxParts ? cleaned.slice(0, maxParts) : cleaned;
  return sliced.join(', ');
}

function buildCompositionGuardText(context) {
  if (!context.characterProfilePrompt || context.subject.count !== 1) return '';

  const visibility = context.framing?.meta?.visibility || '';
  if (visibility === 'portrait') return '';
  if (visibility === 'close') {
    return 'medium composition, keep the outfit and surrounding setting visible';
  }
  if (visibility === 'full') {
    return 'full-body composition, keep the full outfit and environment clearly visible';
  }
  if (visibility === 'wide') {
    return 'wide environmental composition, keep the full figure and surrounding setting clearly visible';
  }
  return 'clear composition, keep the outfit and surrounding setting visible';
}

function buildMidjourneyStructuredPrompt(context, characterSlots, wardrobeSlots, wardrobeColors, lightDirection, film, opticalEffect, duoInteraction, duoStyling) {
  const maxLength = 1000;
  const segments = [];
  const useCharacterIdentityAnchor = Boolean(context.characterProfilePrompt) && context.subject.count === 1;

  const pushSegment = (text) => {
    const cleaned = String(text || '')
      .split('\n')
      .map((line) => stripMarkdown(line).trim().replace(/\.\s+/g, ', ').replace(/[.]+$/g, ''))
      .filter(Boolean)
      .join(', ');
    if (!cleaned) return;
    segments.push(cleaned);
  };

  const describeLocation = () => {
    if (!context.location || isNoneLikeItem(context.location)) return '';
    return compactClause(context.location.en, 3);
  };

  let subjectText = '';
  let hairText = '';
  let expressionText = '';
  let poseText = '';
  const compositionGuardText = buildCompositionGuardText(context);
  const characterIdentityText = formatMidjourneySectionText([
    context.characterProfilePrompt || '',
  ], 4);

  if (context.subject.count === 2) {
    subjectText = formatMidjourneySectionText([
      context.subject.en,
      characterSlots.bodyType?.en && !isNoneLikeItem(characterSlots.bodyType) ? compactClause(characterSlots.bodyType.en, 1) : '',
      'distinct faces, different appearances, not twins, individual features',
    ]);
    hairText = formatMidjourneySectionText([
      characterSlots.hairstyleA?.en,
      characterSlots.hairColorA?.en,
      characterSlots.hairstyleB?.en,
      characterSlots.hairColorB?.en,
    ]);
    expressionText = formatMidjourneySectionText([
      characterSlots.expression ? resolvePromptVariant(characterSlots.expression, 'expression', context.subject.count) : '',
      duoInteraction?.en || '',
      duoStyling?.en || '',
    ], 3);
    poseText = formatMidjourneySectionText([
      characterSlots.pose ? resolvePromptVariant(characterSlots.pose, 'pose', context.subject.count) : '',
      'woman 1 on the left, woman 2 on the right',
    ], 2);
  } else {
    subjectText = formatMidjourneySectionText([
      context.subject.en,
      characterSlots.bodyType?.en && !isNoneLikeItem(characterSlots.bodyType) ? compactClause(characterSlots.bodyType.en, 1) : '',
      !useCharacterIdentityAnchor && characterSlots.facialFeatures?.en && !isNoneLikeItem(characterSlots.facialFeatures)
        ? compactClause(characterSlots.facialFeatures.en, 1)
        : '',
    ]);
    hairText = formatMidjourneySectionText([
      characterSlots.hairstyle?.en && !isNoneLikeItem(characterSlots.hairstyle) ? compactClause(characterSlots.hairstyle.en, 1) : '',
      characterSlots.hairColor?.en && !isNoneLikeItem(characterSlots.hairColor) ? compactClause(characterSlots.hairColor.en, 1) : '',
    ]);
    expressionText = formatMidjourneySectionText([
      characterSlots.expression ? resolvePromptVariant(characterSlots.expression, 'expression', context.subject.count) : '',
    ], 2);
    poseText = formatMidjourneySectionText([
      characterSlots.specialAction && !isNoneLikeItem(characterSlots.specialAction)
        ? characterSlots.specialAction.en
        : '',
      characterSlots.pose && !isNoneLikeItem(characterSlots.pose) && context.framing.meta.visibility !== 'portrait'
        ? resolvePromptVariant(characterSlots.pose, 'pose', context.subject.count)
        : '',
    ], 1);
  }

  const clothingParts = [];
  const accessoryParts = [];
  const addPromptPart = (target, value, maxParts = 4, prefix = '') => {
    const cleaned = compactClause(sanitizeMidjourneyText(value), maxParts);
    if (!cleaned) return;
    target.push(prefix ? `${prefix}${cleaned}` : cleaned);
  };
  const addClothingPart = (value, maxParts = 4, prefix = '') => addPromptPart(clothingParts, value, maxParts, prefix);
  const addAccessoryPart = (value, maxParts = 3, prefix = '') => addPromptPart(accessoryParts, value, maxParts, prefix);

  if (wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB) {
    addClothingPart(buildColoredGrokPrompt(wardrobeSlots.outfitPresetA, wardrobeColors.outfitPresetAColor, { preset: true }), 3, 'woman 1 wearing ');
    addClothingPart(buildColoredGrokPrompt(wardrobeSlots.outfitPresetB, wardrobeColors.outfitPresetBColor, { preset: true }), 3, 'woman 2 wearing ');
  } else if (wardrobeSlots.outfitPreset) {
    addClothingPart(buildColoredGrokPrompt(wardrobeSlots.outfitPreset, wardrobeColors.outfitPresetColor, { preset: true }), 3);
  } else {
    addClothingPart(buildColoredGrokPrompt(wardrobeSlots.top, wardrobeColors.topColor, { pattern: wardrobeSlots.topPattern }), 3);
    addClothingPart(
      buildColoredGrokPrompt(wardrobeSlots.pants, wardrobeColors.bottomColor, { pattern: wardrobeSlots.bottomPattern }) ||
        buildColoredGrokPrompt(wardrobeSlots.skirt, wardrobeColors.bottomColor, { pattern: wardrobeSlots.bottomPattern }),
      3
    );
    addClothingPart(buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor), 2);
    addClothingPart(buildColoredGrokPrompt(wardrobeSlots.outerwear, wardrobeColors.outerwearColor, { pattern: wardrobeSlots.outerwearPattern }), 3);
    addClothingPart(buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor), 2);
    addAccessoryPart(wardrobeSlots.eyewear?.en || '', 2);
    addAccessoryPart(wardrobeSlots.earrings?.en || '', 2);
    addAccessoryPart(wardrobeSlots.neckAccessory?.en || '', 3);
    addAccessoryPart(wardrobeSlots.wristAccessory?.en || '', 3);
    addAccessoryPart(wardrobeSlots.ring?.en || '', 2);
    addAccessoryPart(wardrobeSlots.waistAccessory?.en || '', 3);
  }

  const primaryClothingCount = clothingParts.length;
  const accessoriesText = primaryClothingCount >= 2 ? accessoryParts.join(', ') : '';
  const cameraText = formatMidjourneySectionText([
    context.framing ? resolvePromptVariant(context.framing, 'framing', context.subject.count) : '',
    context.angle ? resolvePromptVariant(context.angle, 'angle', context.subject.count) : '',
    context.orbit ? resolvePromptVariant(context.orbit, 'orbit', context.subject.count) : '',
    context.lens?.en || '',
    opticalEffect?.en || '',
  ], 4);
  const lightingText = formatMidjourneySectionText([
    !context.styleDrivenCamera ? context.lighting?.en || '' : '',
    !context.styleDrivenCamera ? lightDirection?.en || '' : '',
  ], 4);
  const styleText = formatMidjourneySectionText([
    context.style && !isNoneLikeItem(context.style) ? buildPhotographyStylePrompt(context.style) : '',
    film?.en || '',
  ], 3);

  pushSegment(compositionGuardText);
  pushSegment(subjectText);
  pushSegment(poseText);
  pushSegment(clothingParts.join(', '));
  pushSegment(describeLocation());
  pushSegment(cameraText);
  pushSegment(lightingText);
  pushSegment(styleText);
  pushSegment(expressionText);
  pushSegment(hairText);
  pushSegment(characterIdentityText);
  pushSegment(accessoriesText);

  let prompt = '';
  for (const segment of segments) {
    const next = prompt ? `${prompt}, ${segment}` : segment;
    if (next.length > maxLength) break;
    prompt = next;
  }

  return prompt;
}

function buildStructuredGrokPrompt(context, character, wardrobe, wardrobeColors, lightDirection, film, duoInteraction, duoStyling) {
  const characterSlots = extractCharacterSlots(character);
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
  const useCharacterIdentityAnchor = Boolean(context.characterProfilePrompt) && context.subject.count === 1;
  const expressionText = characterSlots.expression ? resolvePromptVariant(characterSlots.expression, 'expression', context.subject.count) : '';
  const poseText = characterSlots.pose ? resolvePromptVariant(characterSlots.pose, 'pose', context.subject.count) : '';
  const specialActionText = characterSlots.specialAction?.en || '';
  const lines = [];
  const addLine = (label, value) => {
    if (!value) return;
    lines.push(`${label}: ${ensureTerminalPeriod(value)}`);
  };
  const addItemLine = (label, item) => {
    if (!item || isNoneLikeItem(item)) return;
    addLine(label, item.en);
  };
  const addContextLine = (label, item, formatter = (entry) => entry.en) => {
    if (!item || isNoneLikeItem(item)) return;
    addLine(label, formatter(item));
  };
  const buildGrokFramingText = () => {
    const base = context.framing ? resolvePromptVariant(context.framing, 'framing', context.subject.count) : '';
    if (!base || context.framing?.zh !== '全身鏡頭 (Full Body Shot)') return base;

    const hasLegwear = wardrobeSlots.legwear && !isNoneLikeItem(wardrobeSlots.legwear);
    const hasShoes = wardrobeSlots.shoes && !isNoneLikeItem(wardrobeSlots.shoes);
    const isBarefoot = wardrobeSlots.shoes?.zh === '赤腳';

    if (isBarefoot) return `${base}, bare feet and visible toes clearly shown`;
    if (hasLegwear && hasShoes) return `${base}, legwear and shoes clearly visible`;
    if (hasShoes) return `${base}, shoes clearly visible`;
    return `${base}, full lower legs and feet clearly visible`;
  };
  const buildGrokCompositionPriorityText = () => {
    if (!context.characterProfilePrompt || context.subject.count !== 1) return '';
    const visibility = context.framing?.meta?.visibility || '';
    if (visibility === 'portrait') return '';
    if (visibility === 'close') {
      return 'preserve a medium composition with the outfit and surrounding setting visible, avoid an overly tight face crop';
    }
    if (visibility === 'full') {
      return 'preserve a full-body composition with the full outfit and environment clearly visible, avoid collapsing into a face-only crop';
    }
    if (visibility === 'wide') {
      return 'preserve a wide environmental composition with the full figure and surrounding setting clearly visible, avoid collapsing into a face-only crop';
    }
    return 'preserve the intended composition with the outfit and surrounding setting visible, avoid an overly tight face crop';
  };

  addLine('Subject Count', useCharacterIdentityAnchor ? `${context.subject.en} ${context.characterProfilePrompt}` : context.subject.en);
  if (context.subject.reference) {
    addLine('Reference Guidance', 'use the attached reference image as the primary facial identity guide, keep the facial features and overall likeness consistent with the image');
  }
  addItemLine('Body Type', characterSlots.bodyType);
  if (context.subject.count === 2) {
    addLine('Woman 1 Outfit Preset', buildColoredGrokPrompt(wardrobeSlots.outfitPresetA, wardrobeColors.outfitPresetAColor, { preset: true }));
    addLine('Woman 2 Outfit Preset', buildColoredGrokPrompt(wardrobeSlots.outfitPresetB, wardrobeColors.outfitPresetBColor, { preset: true }));
  } else if (wardrobeSlots.outfitPreset) {
    addLine('Outfit Preset', buildColoredGrokPrompt(wardrobeSlots.outfitPreset, wardrobeColors.outfitPresetColor, { preset: true }));
  }
  if (!wardrobeSlots.outfitPreset && !wardrobeSlots.outfitPresetA && !wardrobeSlots.outfitPresetB) {
    const topText = buildColoredGrokPrompt(wardrobeSlots.top, wardrobeColors.topColor, { pattern: wardrobeSlots.topPattern });
    const pantsText = buildColoredGrokPrompt(wardrobeSlots.pants, wardrobeColors.bottomColor, { pattern: wardrobeSlots.bottomPattern });
    const skirtText = buildColoredGrokPrompt(wardrobeSlots.skirt, wardrobeColors.bottomColor, { pattern: wardrobeSlots.bottomPattern });
    addLine('Top', topText);
    addLine('Pants', pantsText);
    addLine('Skirt', skirtText);
    addLine('Legwear', buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor));
    addLine('Outerwear', buildColoredGrokPrompt(wardrobeSlots.outerwear, wardrobeColors.outerwearColor, { pattern: wardrobeSlots.outerwearPattern }));
    addLine('Shoes', buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor));
  }
  if (context.subject.count === 2) addLine('Duo Styling', duoStyling?.en);
  addLine('Special Action', specialActionText);
  addLine('Pose', poseText);
  if (context.subject.count === 2) addLine('Duo Interaction', duoInteraction?.en);
  if (context.subject.count === 2) {
    addItemLine('Woman 1 Facial Features', characterSlots.facialFeaturesA);
    addItemLine('Woman 2 Facial Features', characterSlots.facialFeaturesB);
  } else if (!useCharacterIdentityAnchor) {
    addLine(
      'Facial Features',
      buildFacialFeaturesPrompt(characterSlots.facialFeatures, {
        eyewear: wardrobeSlots.eyewear,
        earrings: wardrobeSlots.earrings,
      })
    );
  }
  if (context.subject.count === 2) {
    addItemLine('Woman 1 Hairstyle', characterSlots.hairstyleA);
    addItemLine('Woman 2 Hairstyle', characterSlots.hairstyleB);
    addLine('Woman 1 Hair Color', buildHairColorPrompt(characterSlots.hairColorA));
    addLine('Woman 2 Hair Color', buildHairColorPrompt(characterSlots.hairColorB));
  } else {
    addItemLine('Hairstyle', characterSlots.hairstyle);
    addLine('Hair Color', buildHairColorPrompt(characterSlots.hairColor));
  }
  if (!useCharacterIdentityAnchor) addItemLine('Skin Details', characterSlots.skinDetails);
  addLine('Expression', expressionText);
  addContextLine('Location', context.location);
  if (!context.styleDrivenCamera) {
    addContextLine('Environment Mood', context.lighting);
    addContextLine('Light Style', lightDirection, (item) => resolvePromptVariant(item, 'lightDirection', context.subject.count));
  }
  addLine('Aspect Ratio', context.aspectRatio.en);
  if (!context.styleDrivenCamera) addContextLine('Film', film);
  addContextLine('Angle', context.angle, (item) => resolvePromptVariant(item, 'angle', context.subject.count));
  addContextLine('Orbit Angle', context.orbit, (item) => resolvePromptVariant(item, 'orbit', context.subject.count));
  addContextLine('Lens', context.lens);
  addContextLine('Optical Effect', context.opticalEffect);
  addLine('Framing', buildGrokFramingText());
  addLine('Composition Priority', buildGrokCompositionPriorityText());
  if (context.style && !isNoneLikeItem(context.style)) {
    addLine('Photography Style', buildPhotographyStylePrompt(context.style));
  }
  if (context.subject.count === 2 || useCharacterIdentityAnchor) {
    addLine('Eyewear', buildAccessoryPrompt(wardrobeSlots.eyewear));
    addLine('Earrings', buildAccessoryPrompt(wardrobeSlots.earrings));
  }
  addLine('Neck Accessory', buildAccessoryPrompt(wardrobeSlots.neckAccessory));
  addLine('Wrist Accessory', buildAccessoryPrompt(wardrobeSlots.wristAccessory));
  addLine('Ring', buildAccessoryPrompt(wardrobeSlots.ring));
  addLine('Waist Accessory', buildAccessoryPrompt(wardrobeSlots.waistAccessory));
  if (!useCharacterIdentityAnchor) addLine('Character Identity', context.characterProfilePrompt);

  return lines.join('\n');
}

function buildPrompts(context, character, wardrobe, wardrobeColors, lightDirection, film, opticalEffect, duoInteraction, duoStyling) {
  const characterSlots = extractCharacterSlots(character);
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
  const midjourneyPrompt = buildMidjourneyStructuredPrompt(
    context,
    characterSlots,
    wardrobeSlots,
    wardrobeColors,
    lightDirection,
    film,
    opticalEffect,
    duoInteraction,
    duoStyling
  );

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
    lensId: context.lens?.id || '',
    opticalEffectId: context.opticalEffect?.id || '',
    lightingId: context.styleDrivenCamera ? '' : context.lighting?.id || '',
    lightDirectionId: context.styleDrivenCamera ? '' : lightDirection?.id || '',
    filmId: context.styleDrivenCamera ? '' : film?.id || '',
    outfitPresetId: wardrobeSlots.outfitPreset?.id || '',
    outfitPresetColorId: wardrobeColors.outfitPresetColor?.id || '',
    outfitPresetAId: wardrobeSlots.outfitPresetA?.id?.replace(/:a$/, '') || '',
    outfitPresetAColorId: wardrobeColors.outfitPresetAColor?.id || '',
    outfitPresetBId: wardrobeSlots.outfitPresetB?.id?.replace(/:b$/, '') || '',
    outfitPresetBColorId: wardrobeColors.outfitPresetBColor?.id || '',
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
    specialActionId: characterSlots.specialAction?.id || '',
    topId: wardrobeSlots.top?.id || '',
    topColorId: wardrobeColors.topColor?.id || '',
    topPatternId: wardrobeSlots.topPattern?.id || '',
    duoStylingId: duoStyling?.id || '',
    pantsId: wardrobeSlots.pants?.id || '',
    skirtId: wardrobeSlots.skirt?.id || '',
    bottomColorId: wardrobeColors.bottomColor?.id || '',
    bottomPatternId: wardrobeSlots.bottomPattern?.id || '',
    legwearId: wardrobeSlots.legwear?.id || '',
    legwearColorId: wardrobeColors.legwearColor?.id || '',
    outerwearId: wardrobeSlots.outerwear?.id || '',
    outerwearColorId: wardrobeColors.outerwearColor?.id || '',
    outerwearPatternId: wardrobeSlots.outerwearPattern?.id || '',
    shoesId: wardrobeSlots.shoes?.id || '',
    shoesColorId: wardrobeColors.shoesColor?.id || '',
    eyewearId: wardrobeSlots.eyewear?.id || '',
    earringsId: wardrobeSlots.earrings?.id || '',
    neckAccessoryId: wardrobeSlots.neckAccessory?.id || '',
    wristAccessoryId: wardrobeSlots.wristAccessory?.id || '',
    ringId: wardrobeSlots.ring?.id || '',
    waistAccessoryId: wardrobeSlots.waistAccessory?.id || '',
  };
}

export function buildLocksFromPrompt(prompt, keepKeys = []) {
  const base = createEmptyLocks();
  REQUIRED_LOCK_KEYS.forEach((key) => {
    base[key] = prompt.selection?.[key] || base[key];
  });
  keepKeys.forEach((key) => {
    base[key] = prompt.selection?.[key] || '';
  });
  return base;
}

function generateSinglePrompt(index, locks, customLibrary, runtimeOptions = {}) {
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
  const lockedSpecialAction = effectiveLocks.specialActionId
    ? findById(getByKey(runtime.catalog.character, '特殊動作 (Special Actions)'), effectiveLocks.specialActionId)
    : null;
  const framing = pickWithLock(
    runtime.flatCatalog.framing,
    effectiveLocks.framingId,
    (item) => (
      (!lockedSpecialAction || item.zh !== '全無')
      &&
      !(location.meta.tags.includes('club') && item.meta.visibility === 'close')
      && framingSupportsSubject(item, subject, aspectRatio)
      && specialActionSupportsFraming(lockedSpecialAction, item)
    )
  );
  const lockedExpression = effectiveLocks.expressionId
    ? findById(getByKey(runtime.catalog.character, '神情與眼神 (Expression & Gaze)'), effectiveLocks.expressionId)
    : null;
  const angle = pickWithLock(
    runtime.flatCatalog.angle,
    effectiveLocks.angleId,
    (item) => framingSupportsAngle(framing, item) && angleSupportsExpression(item, lockedExpression),
    lowFrequencyPicker('low_frequency_angle')
  );
  const orbit = pickWithLock(
    runtime.flatCatalog.orbit,
    effectiveLocks.orbitId,
    (item) => orbitSupportsExpression(item, lockedExpression) && specialActionSupportsOrbit(item, lockedSpecialAction)
  );
  const lens = pickWithLock(runtime.flatCatalog.lens, effectiveLocks.lensId);
  const lighting = styleDrivenCamera
    ? null
    : pickWithLock(runtime.flatCatalog.lighting, effectiveLocks.lightingId, (item) => locationSupportsLighting(location, item));
  const lightDirection = styleDrivenCamera || !lighting
    ? null
    : pickWithLock(runtime.flatCatalog.lightDirection, effectiveLocks.lightDirectionId, (item) => lightDirectionSupportsScene(item, framing, location, lighting));
  const film = styleDrivenCamera ? null : pickWithLock(runtime.flatCatalog.film, effectiveLocks.filmId, () => true, lowFrequencyPicker('low_frequency_film'));
  const opticalEffect = pickWithLock(runtime.flatCatalog.effects, effectiveLocks.opticalEffectId);
  const duoInteraction = subject.count === 2 ? getDuoInteractionOption(effectiveLocks.duoInteractionId) || sample(DUO_INTERACTION_OPTIONS) : null;
  const duoStyling = subject.count === 2 ? getDuoStylingOption(effectiveLocks.duoStylingId) || sample(DUO_STYLING_OPTIONS) : null;

  const context = {
    subject,
    aspectRatio,
    style,
    location,
    framing,
    angle,
    orbit,
    lens,
    opticalEffect,
    lighting,
    locks: effectiveLocks,
    styleDrivenCamera,
    characterProfilePrompt: String(runtimeOptions.characterProfilePrompt || '').trim(),
  };
  const character = buildCharacter(context, runtime.catalog);
  const wardrobe = buildWardrobe({ ...context }, effectiveLocks, runtime);
  context.wardrobe = wardrobe;
  const wardrobeColors = buildWardrobeColors(extractWardrobeSlots(wardrobe), effectiveLocks);

  const { midjourneyPrompt, grokPrompt } = buildPrompts(context, character, wardrobe, wardrobeColors, lightDirection, film, opticalEffect, duoInteraction, duoStyling);
  const summaryFields = buildSummaryFields(context, wardrobe, character, wardrobeColors);

  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    summary: buildSummary(summaryFields),
    summaryFields,
    midjourneyPrompt,
    grokPrompt,
    selection: buildSelectionSnapshot(context, wardrobe, wardrobeColors, character, lightDirection, film, duoInteraction, duoStyling),
    structured: {
      Style: [style],
      Character: character,
      Wardrobe: wardrobe,
      Location: [location],
      Framing: [framing, angle, orbit, lens].filter(Boolean),
      Lighting: [lighting, lightDirection].filter(Boolean),
      'Camera & Film': [film, opticalEffect].filter(Boolean),
    },
  };
}

export function generatePrompts(count = 1, locks = createEmptyLocks(), customLibrary = [], runtimeOptions = {}) {
  return Array.from({ length: count }, (_, index) => generateSinglePrompt(index, locks, customLibrary, runtimeOptions));
}
