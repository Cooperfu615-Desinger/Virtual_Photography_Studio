import database from '../data/database.json' with { type: 'json' };
import { getActionPoseCardById } from '../data/actionPoseCards.js';
import {
  CHARACTER_CARD_LAYER_KEYS,
  getEffectiveCharacterCardWardrobeLayers,
  getCharacterCardOptions,
  getCompatibleHairVariants,
  normalizeCharacterCardVariant,
} from './characterCardLab.js';
import { normalizeRandom } from './engineRandom.js';
import { getCameraControlDisplayLabel } from './page1CameraLabels.js';
import {
  COMPOSITION_VISIBILITY_BUCKETS,
  createCompositionVisibilityProjection,
  shouldProjectPosePart,
  shouldProjectWardrobeRole,
} from './engine/compositionVisibilityContract.js';
import {
  dedupeRepeatedCommaFragments,
  materializeOutfitColorControls,
} from './engine/promptTextDeduplication.js';
import { CHARACTER_PROFILE_OPTIONS } from './engine/characterProfiles.js';
import {
  DUO_EXPRESSION_OPTIONS,
  DUO_INTERACTION_OPTIONS,
  DUO_POSE_BASE_OPTIONS,
  DUO_POSE_OPTIONS,
} from './engine/duoOptions.js';
import {
  FIXED_COMPOSITION_SHARED_STRUCTURE_EN,
  FIXED_COMPOSITION_SET_OPTIONS,
  FIXED_SET_BACKGROUND_STATE_OPTIONS,
  FIXED_SET_CAPTURE_MODE_OPTIONS,
  FIXED_SET_PERFORMANCE_STATE_OPTIONS,
  FIXED_SET_POSITION_OPTIONS,
  OUTDOOR_FIXED_SET_GROUP_ID,
} from './engine/fixedCompositionOptions.js';
import {
  POSE_COMPOSER_ANCHOR_OPTIONS,
  POSE_COMPOSER_ARRANGEMENT_OPTIONS,
  POSE_COMPOSER_BASE_OPTIONS,
  POSE_COMPOSER_HAND_OPTIONS,
  POSE_COMPOSER_HEAD_OPTIONS,
  POSE_COMPOSER_PROP_OPTIONS,
} from './engine/poseComposerOptions.js';
import { createPromptSectionModel } from './engine/promptModel.js';
import { createEngineRuntimeResolver, deepFreezeRuntime } from './engine/runtimeCache.js';
import { createSelectionSnapshot } from './engine/selectionSchema.js';

export { createSeededRandom } from './engineRandom.js';

const SUBJECT_COUNT_OPTIONS = [
  { id: '1', zh: '1 位', en: 'one 20-year-old Japanese or Korean female portrait subject', count: 1 },
  { id: '2', zh: '2 位', en: 'two 20-year-old Japanese or Korean female portrait subjects', count: 2 },
];

const FIXED_SINGLE_NORMAL_SUBJECT_SENTENCE = 'A 20s seductive stunning Japanese or Korean woman.';

const IMAGE_TYPE_PRESET_OPTIONS = [
  {
    id: 'photorealistic-photo',
    zh: '寫實攝影',
    en: 'Create a photorealistic editorial portrait',
    gptDuo: 'Create a photorealistic editorial portrait of two women in a real-world photography style',
    zImageLead: 'Create a photorealistic editorial portrait of',
    zImageDuo: 'Create a photorealistic editorial portrait of two women in a real-world photography style',
    aiLead: '',
    aiDuo: 'Create a photorealistic editorial portrait in a real-world photography style. The main characters are two stunning seductive 20-year-old Japanese or Korean women.',
  },
  {
    id: 'fashion-advertising',
    zh: '時尚廣告',
    en: 'Create a premium fashion advertising image with modern luxury art direction, refined styling presence, and polished commercial fashion finish',
    gptDuo: 'Create a premium fashion advertising image of two women with modern luxury art direction, refined styling presence, and polished commercial fashion finish',
    zImageLead: 'Create a premium fashion advertising image of',
    zImageDuo: 'Create a premium fashion advertising image of two women with modern luxury art direction and polished commercial fashion finish',
    aiLead: 'premium fashion advertising image',
    aiDuo: 'Create a premium fashion advertising image in a polished commercial fashion style. The main characters are two stunning seductive 20-year-old Japanese or Korean women.',
  },
  {
    id: 'watercolor-illustration',
    zh: '水彩插畫',
    en: 'Create a watercolor portrait illustration with soft hand-painted washes, delicate pigment texture, refined editorial character styling, and finished illustration direction',
    gptDuo: 'Create a watercolor portrait illustration of two women with soft hand-painted washes, delicate pigment texture, refined editorial character styling, and finished illustration direction',
    zImageLead: 'Create a watercolor portrait illustration of',
    zImageDuo: 'Create a watercolor portrait illustration of two women with soft hand-painted washes and refined editorial character styling',
    aiLead: 'watercolor portrait illustration',
    aiDuo: 'Create a watercolor portrait illustration with soft hand-painted washes. The main characters are two stunning seductive 20-year-old Japanese or Korean women.',
  },
  {
    id: 'oil-painting',
    zh: '油畫肖像',
    en: 'Create an oil painting portrait with layered brushwork, tactile painted surface, refined portrait styling, and gallery-quality finished image direction',
    gptDuo: 'Create an oil painting portrait of two women with layered brushwork, tactile painted surface, refined portrait styling, and gallery-quality finished image direction',
    zImageLead: 'Create an oil painting portrait of',
    zImageDuo: 'Create an oil painting portrait of two women with layered brushwork and gallery-quality finished image direction',
    aiLead: 'oil painting portrait',
    aiDuo: 'Create an oil painting portrait with layered brushwork and tactile painted surface. The main characters are two stunning seductive 20-year-old Japanese or Korean women.',
  },
  {
    id: 'fashion-illustration',
    zh: '時尚插畫',
    en: 'Create a fashion illustration with elegant drawn lines, stylized editorial proportions, refined clothing presentation, and polished magazine illustration direction',
    gptDuo: 'Create a fashion illustration of two women with elegant drawn lines, stylized editorial proportions, refined clothing presentation, and polished magazine illustration direction',
    zImageLead: 'Create a fashion illustration of',
    zImageDuo: 'Create a fashion illustration of two women with elegant drawn lines and refined clothing presentation',
    aiLead: 'fashion illustration',
    aiDuo: 'Create a fashion illustration with elegant drawn lines and refined clothing presentation. The main characters are two stunning seductive 20-year-old Japanese or Korean women.',
  },
  {
    id: 'pastel-illustration',
    zh: '粉彩插畫',
    en: 'Create a pastel illustration portrait with soft powdery color texture, gentle blended edges, delicate hand-rendered surface, and refined romantic character styling',
    gptDuo: 'Create a pastel illustration portrait of two women with soft powdery color texture, gentle blended edges, delicate hand-rendered surface, and refined romantic character styling',
    zImageLead: 'Create a pastel illustration portrait of',
    zImageDuo: 'Create a pastel illustration portrait of two women with soft powdery color texture and refined romantic character styling',
    aiLead: 'pastel illustration portrait',
    aiDuo: 'Create a pastel illustration portrait with soft powdery color texture. The main characters are two stunning seductive 20-year-old Japanese or Korean women.',
  },
];

const SPECIAL_SUBJECT_OPTIONS = [
  {
    id: 'none',
    zh: '全無',
    en: '',
    desc: 'Use the normal character setup instead of a dedicated special subject.',
    meta: { tags: ['none'] },
  },
  {
    id: 'skeleton',
    zh: '黑骷髏',
    en: 'a full-body unknown skeletal figure, complete human skeleton with realistic anatomical proportions, visible skull ribcage spine pelvis hands and feet, articulated joints, realistic joint spacing, dark blue-black bone tone, subtle cool blue highlights, dry matte porous bone surface, human-scale physical photographic presence, surreal but grounded live-action realism',
    count: 1,
    specialSubject: 'skeleton',
    skeletonToneZh: '深藍黑骨色',
  },
  {
    id: 'white-skeleton',
    zh: '白骷髏',
    en: 'a full-body unknown skeletal figure, complete human skeleton with realistic anatomical proportions, visible skull ribcage spine pelvis hands and feet, articulated joints, realistic joint spacing, warm ivory bone tone, aged off-white bone surface, subtle beige porous texture, dry matte material finish, quiet anomalous physical photographic presence',
    count: 1,
    specialSubject: 'skeleton',
    skeletonToneZh: '米白骨色',
  },
  {
    id: 'sengoku-samurai',
    zh: '日本戰國武士',
    en: 'a refined female Japanese Sengoku-era samurai warrior from a noble aristocratic house as the single main subject, well-groomed noble bearing, clean polished layered lamellar armor reshaped for a feminine bust-waist-hip silhouette, one model-decided vivid main armor color chosen from brilliant red, royal blue, pure white, emerald green, or glossy reflective lacquer black, glossy lacquered plates with fine cord lacing, sculpted cuirass, narrowed waist plates, hip-aware kusazuri armor skirt, shoulder guards, armored sleeves, pristine silk lacing, elegant period waist sash, kabuto helmet either worn on the head or held in one hand, let the image model decide the helmet placement, sheathed katana and wakizashi, ornate clan-quality metal fittings, meticulously maintained materials, practical physical construction, documentary-real armor detail, live-action photographic realism, a noble historical warrior standing naturally in the present-day world',
    count: 1,
    specialSubject: 'historical-warrior',
    specialToneZh: '名門戰國女武士甲冑',
  },
  {
    id: 'european-knight',
    zh: '歐洲騎士',
    en: 'a realistic female medieval European knight as the single main subject, articulated polished plate armor over chainmail reshaped for a feminine bust-waist-hip silhouette, sculpted breastplate with clear torso contour, narrowed armored waist, curved hip faulds, fitted armored sleeves, worn steel surfaces, leather straps, padded gambeson edges, simple cloak, longsword at the side, practical plate construction, documentary-real material detail, live-action photographic realism, a medieval knight standing naturally in the present-day world',
    count: 1,
    specialSubject: 'historical-warrior',
    specialToneZh: '中世紀女騎士板甲',
  },
  {
    id: 'female-android',
    zh: '女性人形機器人',
    en: 'a near-human female android as the single main subject, realistic human female head and face, natural facial proportions with subtle facial panel lines and small embedded mechanical seams across the cheeks and temples, elegant feminine body proportions with sculpted bust-waist-hip contours, smooth pale synthetic skin-like shell mixed with glossy white and champagne-gold mechanical plates, elegant mechanical linework and block-like armor structures across the body, black precision mechanical joint structures at the neck shoulders elbows wrists waist hips knees and ankles, fine actuator seams and micro-panel divisions following the torso arms and legs, refined luminous circuit accents in selected seams, realistic robotics and synthetic material construction, sensual high-fashion cyborg presence, human-scale physical realism',
    count: 1,
    specialSubject: 'android',
    specialToneZh: '近真人機械女性',
  },
];


const CHARACTER_PROFILE_CONTROL_ORDER = [
  'character-rika',
  'character-48g',
  'character-philippa',
  'character-lily',
  'character-hinata',
  'character-rin',
  'character-sakura',
  'character-sui',
  'character-yuri',
  'character-hina',
  'character-yuna',
  'character-eleanor',
  'character-olivia',
  'character-jiwoo',
  'character-chihiro',
  'character-koto',
  'character-mei',
  'character-rei',
  'character-amy',
  'character-jiyoo',
  'character-yui',
  'character-nana',
  'character-emily',
  'character-shiori',
  'character-natsuki',
  'character-minji',
  'character-manami',
];

const CHARACTER_PROFILE_CONTROL_OPTIONS = [
  CHARACTER_PROFILE_OPTIONS.find((option) => option.id === 'none'),
  ...CHARACTER_PROFILE_CONTROL_ORDER
    .map((id) => CHARACTER_PROFILE_OPTIONS.find((option) => option.id === id))
    .filter(Boolean),
].filter(Boolean);

const ALL_DEDICATED_SUBJECT_OPTIONS = [
  ...SPECIAL_SUBJECT_OPTIONS,
  ...CHARACTER_PROFILE_OPTIONS.filter((option) => option.id !== 'none'),
];

const ASPECT_RATIO_POOL = [
  { id: '1:1', zh: '1:1 正方形', en: '1:1' },
  { id: '4:5', zh: '4:5 社群貼文', en: '4:5' },
  { id: '3:4', zh: '3:4 直向人像', en: '3:4', legacyIds: ['2:3'] },
  { id: '9:16', zh: '9:16 手機直式', en: '9:16' },
  { id: '4:3', zh: '4:3 Classic', en: '4:3' },
  { id: '16:9', zh: '16:9 寬螢幕', en: '16:9' },
];
const DEFAULT_ASPECT_RATIO = ASPECT_RATIO_POOL[1];
const ASPECT_RATIO_OPTIONS = [
  { id: 'random', zh: '隨機', en: 'random aspect ratio', random: true },
  { id: 'none', zh: '全無', en: '', meta: { tags: ['none'] } },
  ...ASPECT_RATIO_POOL,
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
  { id: 'neon-red', zh: '螢光紅色', en: 'neon red' },
  { id: 'pink', zh: '粉紅色', en: 'pink' },
  { id: 'light-blue', zh: '淡藍色', en: 'light blue' },
  { id: 'dark-blue', zh: '深藍色', en: 'dark blue' },
  { id: 'royal-blue', zh: '寶藍色', en: 'royal blue' },
  { id: 'neon-blue', zh: '螢光藍色', en: 'neon blue' },
  { id: 'light-green', zh: '淺綠色', en: 'light green' },
  { id: 'dark-green', zh: '深綠色', en: 'dark green' },
  { id: 'olive-green', zh: '軍綠色', en: 'olive green' },
  { id: 'neon-green', zh: '螢光綠色', en: 'neon green' },
  { id: 'goose-yellow', zh: '鵝黃色', en: 'soft yellow' },
  { id: 'neon-yellow', zh: '螢光黃色', en: 'neon yellow' },
  { id: 'multicolor-horizontal-stripes', zh: '彩色橫條紋', en: 'bold multicolored horizontal stripes, wide stripe bands, clearly separated random colors' },
  { id: 'silver', zh: '銀色', en: 'silver' },
  { id: 'mirror-chrome-silver', zh: '鏡面鉻銀', en: 'mirror-chrome silver, highly polished scene-reflective surface with crisp environment reflections' },
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
  { id: 'bright-blue', zh: '亮藍色', en: 'bright blue' },
  { id: 'burgundy', zh: '酒紅色', en: 'burgundy' },
  { id: 'red', zh: '紅色', en: 'red' },
  { id: 'bright-red', zh: '亮紅色', en: 'bright red' },
  { id: 'neon-red', zh: '螢光紅色', en: 'neon red' },
  { id: 'tiffany-aqua', zh: '蒂芬妮綠', en: 'tiffany aqua' },
  { id: 'neon-green', zh: '螢光綠色', en: 'neon green' },
  { id: 'neon-pink', zh: '螢光粉紅色', en: 'neon pink' },
  { id: 'neon-blue', zh: '螢光藍色', en: 'neon blue' },
  { id: 'neon-yellow', zh: '螢光黃色', en: 'neon yellow' },
  { id: 'silver', zh: '銀色', en: 'silver' },
  { id: 'gold', zh: '金色', en: 'gold' },
];

const TOP_FIT_OPTIONS = [
  { id: 'none', zh: '全無', en: '', meta: { tags: ['none'] } },
  { id: 'standard', zh: '正常', en: 'standard upper-body cut' },
  { id: 'fitted', zh: '合身', en: 'fitted upper-body cut following the garment shape' },
  { id: 'tight', zh: '緊身', en: 'tight body-skimming upper-body fit' },
  { id: 'oversized', zh: 'oversize', en: 'oversized upper-body proportion with roomy shoulders and body' },
];

const TOP_STYLING_OPTIONS = [
  { id: 'none', zh: '全無', en: '', meta: { tags: ['none'] } },
  { id: 'standard', zh: '正常穿著', en: 'top worn in a standard natural position' },
  { id: 'tucked', zh: '紮入下身', en: 'top hem tucked neatly into the bottoms' },
  { id: 'half-tucked', zh: '半紮', en: 'front hem half-tucked into the bottoms' },
  { id: 'untucked', zh: '自然放出', en: 'top hem worn naturally loose over the waistband' },
  { id: 'knot-tied', zh: '下擺打結', en: 'front hem tied into a compact knot below the waist' },
];

const BOTTOM_FIT_OPTIONS = [
  { id: 'none', zh: '全無', en: '', meta: { tags: ['none'] } },
  { id: 'standard', zh: '正常', en: 'standard lower-body proportion' },
  { id: 'fitted', zh: '合身', en: 'fitted lower-body line following the garment shape' },
  { id: 'tight', zh: '緊身', en: 'tight body-skimming lower-body fit' },
  { id: 'wide', zh: '寬版', en: 'wide-leg volume with a broad lower-body opening' },
];

const BOTTOM_RISE_OPTIONS = [
  { id: 'none', zh: '全無', en: '', meta: { tags: ['none'] } },
  { id: 'high-rise', zh: '高腰', en: 'high-rise waistband sitting above the natural waist' },
  { id: 'mid-rise', zh: '正常腰線', en: 'mid-rise waistband sitting at the natural waist' },
  { id: 'low-rise', zh: '低腰', en: 'low-rise waistband sitting on the hips' },
  { id: 'ultra-low-rise', zh: '超低腰', en: 'ultra-low-rise waistband sitting very low on the hips' },
  { id: 'unbuttoned-slightly-unzipped', zh: '扣子解開拉鏈微開', en: 'pants waist button undone and front zipper slightly lowered, relaxed loosened waistband styling, still worn securely on the hips' },
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

const OUTFIT_PRESET_EXTRA_COLOR_OPTIONS = [
  { id: 'blue', zh: '藍色', en: 'blue' },
  { id: 'green', zh: '綠色', en: 'green' },
  { id: 'yellow', zh: '黃色', en: 'yellow' },
  { id: 'black-white', zh: '黑白', en: 'black and white' },
  { id: 'black-red', zh: '黑紅', en: 'black and red' },
  { id: 'white-red', zh: '白紅', en: 'white and red' },
];

const OUTFIT_PRESET_COLOR_OPTIONS = [
  ...GARMENT_COLOR_OPTIONS,
  ...OUTFIT_PRESET_EXTRA_COLOR_OPTIONS,
];

const OUTFIT_PRESET_LOCKED_PALETTE_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none' },
  { id: 'metallic-gold', zh: '金屬金', en: 'metallic gold' },
  { id: 'metallic-silver', zh: '金屬銀', en: 'metallic silver' },
  { id: 'classic-black-trim', zh: '經典黑色細節', en: 'classic black trim' },
  { id: 'classic-white-apron', zh: '經典白圍裙', en: 'classic white apron' },
  { id: 'classic-white-cuff-collar', zh: '經典白領圈袖口', en: 'classic white cuffs and collar' },
  { id: 'classic-school-navy-trim', zh: '經典制服深藍飾線', en: 'classic school navy trim' },
];

const COMPLETE_LOOK_PALETTE_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none' },
  { id: 'black-white-cool', zh: '黑白灰冷調', en: 'black, white, and cool gray color family' },
  { id: 'black-red-street', zh: '黑紅街頭', en: 'black-and-red street color family' },
  { id: 'deep-denim', zh: '深藍丹寧', en: 'deep indigo denim color family' },
  { id: 'cream-neutral', zh: '奶油米白', en: 'cream, ivory, and soft neutral color family' },
  { id: 'pink-sweet-cool', zh: '粉色甜酷', en: 'soft pink sweet-cool color family with dark accent balance' },
  { id: 'brown-vintage', zh: '棕色復古', en: 'brown, camel, and vintage tan color family' },
  { id: 'silver-metallic', zh: '銀灰金屬', en: 'silver, graphite, and metallic gray color family' },
  { id: 'green-utility', zh: '綠灰工裝', en: 'olive green, sage, and utility gray color family' },
  { id: 'yellow-orange-bright', zh: '黃橘亮色', en: 'yellow, orange, and bright warm color family' },
];

const TOP_BOTTOM_PALETTE_SWATCH_HEX = {
  'arctic knight': '#f1f0e8',
  'berry red': '#b7133f',
  black: '#000000',
  'black noir': '#151217',
  'black wave': '#18141d',
  'blackwater core': '#111719',
  blush: '#f4a9ad',
  'blue grey': '#8a9aac',
  brown: '#7a4f2f',
  burgundy: '#800020',
  champagne: '#ead7b7',
  chartreuse: '#b9d624',
  'cherry blossom pink': '#f7b7c8',
  claret: '#7f1734',
  'coffee bean': '#34231d',
  'cosmic harbor': '#244f8f',
  'cotton rose': '#f2c0c8',
  cream: '#fff0d0',
  'cream yellow': '#f6e3a1',
  'crystal lagoon': '#63c6cf',
  'dark graphite': '#2f3236',
  'dark purple': '#382348',
  'darkstar empress': '#4a173d',
  'deep mocha': '#4a2e25',
  'dragon fire': '#e56b2f',
  'dune pearl': '#e6d6bd',
  'eclipse violet': '#4d3167',
  'electric rose': '#f0298f',
  'espresso': '#3b261e',
  'ethereal dawn': '#f0dfc6',
  'fresh cabbage': '#8fbf5a',
  'frosted mint': '#bfe5d1',
  green: '#4b9a45',
  gunmetal: '#4d555c',
  'hot chocolate': '#5a3528',
  'hot fuchsia': '#e31c79',
  'hunter green': '#315c3b',
  'icy blue': '#b8dceb',
  indigo: '#394b83',
  'jasmine yellow': '#f2d66d',
  'lemon chiffon': '#f9e89a',
  'light blue': '#9ed6ff',
  lilac: '#c7a6d9',
  'lime cream': '#dce989',
  'lime whisper': '#d7ef8f',
  'matcha cream': '#a8b875',
  'midnight lavender': '#4c416f',
  'midnight tide': '#1e3f5b',
  'milky honey': '#f1dfb4',
  'mocha berry': '#70435a',
  'morning butter': '#f4d77a',
  'moon knight silver': '#c9c5bd',
  'moonveil sand': '#d7c3a1',
  navy: '#173d78',
  peony: '#e59bae',
  pink: '#f6a7c8',
  'phoenix core': '#c96a32',
  'pikachu yellow': '#f6d51b',
  'raspberry red': '#b91f45',
  'regal navy': '#1b2f68',
  'sand dune': '#d8c19a',
  'sandy clay': '#b98b6d',
  'shadow grey': '#5b5b5f',
  'shadow wood': '#5d4635',
  'sky blue': '#8fc8ee',
  'soft linen': '#d9c8a8',
  'soft vanilla': '#f3e3bd',
  'softlight halo': '#f3e7d0',
  'solar veil': '#f6e7b8',
  thistle: '#c8a8c8',
  'turquoise green': '#40bfb0',
  'vintage grape': '#6e4b7e',
  'void current': '#202332',
  white: '#ffffff',
  xanthous: '#f1c94a',
  'xanthous yellow': '#f1c94a',
  yellow: '#f6d547',
};

function withTopBottomPaletteSwatches(option) {
  if (!option.topColor || !option.bottomColor) return option;
  return {
    ...option,
    topColor: {
      ...option.topColor,
      hex: TOP_BOTTOM_PALETTE_SWATCH_HEX[option.topColor.en],
    },
    bottomColor: {
      ...option.bottomColor,
      hex: TOP_BOTTOM_PALETTE_SWATCH_HEX[option.bottomColor.en],
    },
  };
}

const TOP_BOTTOM_PALETTE_OPTIONS = [
  { id: 'random', zh: '隨機', en: 'random top and bottom palette', random: true },
  { id: 'none', zh: '全無', en: 'none', meta: { tags: ['none'] } },
  {
    id: 'cherry-blossom-cream',
    zh: '櫻花粉 × 奶油黃',
    en: 'cherry blossom pink top with cream yellow bottom',
    topColor: { zh: '櫻花粉', en: 'cherry blossom pink' },
    bottomColor: { zh: '奶油黃', en: 'cream yellow' },
  },
  {
    id: 'regal-navy-lemon-chiffon',
    zh: '皇家海軍藍 × 檸檬雪紡',
    en: 'regal navy top with lemon chiffon bottom',
    topColor: { zh: '皇家海軍藍', en: 'regal navy' },
    bottomColor: { zh: '檸檬雪紡', en: 'lemon chiffon' },
  },
  {
    id: 'shadow-grey-sandy-clay',
    zh: '暗影灰 × 沙陶棕',
    en: 'shadow grey top with sandy clay bottom',
    topColor: { zh: '暗影灰', en: 'shadow grey' },
    bottomColor: { zh: '沙陶棕', en: 'sandy clay' },
  },
  {
    id: 'soft-linen-cherry-blossom',
    zh: '柔亞麻 × 櫻花粉',
    en: 'soft linen top with cherry blossom pink bottom',
    topColor: { zh: '柔亞麻', en: 'soft linen' },
    bottomColor: { zh: '櫻花粉', en: 'cherry blossom pink' },
  },
  {
    id: 'blue-grey-morning-butter',
    zh: '藍灰 × 晨光奶油黃',
    en: 'blue grey top with morning butter bottom',
    topColor: { zh: '藍灰', en: 'blue grey' },
    bottomColor: { zh: '晨光奶油黃', en: 'morning butter' },
  },
  {
    id: 'midnight-tide-dune-pearl',
    zh: '午夜潮汐藍 × 沙丘珍珠',
    en: 'midnight tide top with dune pearl bottom',
    topColor: { zh: '午夜潮汐藍', en: 'midnight tide' },
    bottomColor: { zh: '沙丘珍珠', en: 'dune pearl' },
  },
  {
    id: 'solar-veil-phoenix-core',
    zh: '日光薄紗 × 鳳凰陶橘',
    en: 'solar veil top with phoenix core bottom',
    topColor: { zh: '日光薄紗', en: 'solar veil' },
    bottomColor: { zh: '鳳凰陶橘', en: 'phoenix core' },
  },
  {
    id: 'moon-knight-silver-black-noir',
    zh: '月騎士銀 × 黑色夜幕',
    en: 'moon knight silver top with black noir bottom',
    topColor: { zh: '月騎士銀', en: 'moon knight silver' },
    bottomColor: { zh: '黑色夜幕', en: 'black noir' },
  },
  {
    id: 'burgundy-champagne',
    zh: '酒紅 × 香檳米',
    en: 'burgundy top with champagne bottom',
    topColor: { zh: '酒紅', en: 'burgundy' },
    bottomColor: { zh: '香檳米', en: 'champagne' },
  },
  {
    id: 'thistle-deep-mocha',
    zh: '薊花淡紫 × 深摩卡',
    en: 'thistle top with deep mocha bottom',
    topColor: { zh: '薊花淡紫', en: 'thistle' },
    bottomColor: { zh: '深摩卡', en: 'deep mocha' },
  },
  {
    id: 'hunter-green-sand-dune',
    zh: '獵人綠 × 沙丘米',
    en: 'hunter green top with sand dune bottom',
    topColor: { zh: '獵人綠', en: 'hunter green' },
    bottomColor: { zh: '沙丘米', en: 'sand dune' },
  },
  {
    id: 'lime-cream-vintage-grape',
    zh: '萊姆奶油 × 復古葡萄紫',
    en: 'lime cream top with vintage grape bottom',
    topColor: { zh: '萊姆奶油', en: 'lime cream' },
    bottomColor: { zh: '復古葡萄紫', en: 'vintage grape' },
  },
  {
    id: 'electric-rose-chartreuse',
    zh: '電光玫瑰 × 查特酒綠',
    en: 'electric rose top with chartreuse bottom',
    topColor: { zh: '電光玫瑰', en: 'electric rose' },
    bottomColor: { zh: '查特酒綠', en: 'chartreuse' },
  },
  {
    id: 'hot-fuchsia-cotton-rose',
    zh: '熱情桃紅 × 棉花玫瑰',
    en: 'hot fuchsia top with cotton rose bottom',
    topColor: { zh: '熱情桃紅', en: 'hot fuchsia' },
    bottomColor: { zh: '棉花玫瑰', en: 'cotton rose' },
  },
  {
    id: 'coffee-bean-raspberry-red',
    zh: '咖啡豆棕黑 × 覆盆莓紅',
    en: 'coffee bean top with raspberry red bottom',
    topColor: { zh: '咖啡豆棕黑', en: 'coffee bean' },
    bottomColor: { zh: '覆盆莓紅', en: 'raspberry red' },
  },
  {
    id: 'lilac-cream',
    zh: '丁香紫 × 奶油白',
    en: 'lilac top with cream bottom',
    topColor: { zh: '丁香紫', en: 'lilac' },
    bottomColor: { zh: '奶油白', en: 'cream' },
  },
  {
    id: 'icy-blue-gunmetal',
    zh: '冰藍 × 鎗灰',
    en: 'icy blue top with gunmetal bottom',
    topColor: { zh: '冰藍', en: 'icy blue' },
    bottomColor: { zh: '鎗灰', en: 'gunmetal' },
  },
  {
    id: 'blush-morning-butter',
    zh: '腮紅粉 × 晨光奶油黃',
    en: 'blush top with morning butter bottom',
    topColor: { zh: '腮紅粉', en: 'blush' },
    bottomColor: { zh: '晨光奶油黃', en: 'morning butter' },
  },
  {
    id: 'espresso-peony',
    zh: '濃縮咖啡棕 × 牡丹粉',
    en: 'espresso top with peony bottom',
    topColor: { zh: '濃縮咖啡棕', en: 'espresso' },
    bottomColor: { zh: '牡丹粉', en: 'peony' },
  },
  {
    id: 'softlight-halo-dragon-fire',
    zh: '柔光光暈 × 龍焰橘',
    en: 'softlight halo top with dragon fire bottom',
    topColor: { zh: '柔光光暈', en: 'softlight halo' },
    bottomColor: { zh: '龍焰橘', en: 'dragon fire' },
  },
  {
    id: 'eclipse-violet-lime-whisper',
    zh: '日蝕紫 × 萊姆低語',
    en: 'eclipse violet top with lime whisper bottom',
    topColor: { zh: '日蝕紫', en: 'eclipse violet' },
    bottomColor: { zh: '萊姆低語', en: 'lime whisper' },
  },
  {
    id: 'shadow-wood-moonveil-sand',
    zh: '暗影木棕 × 月紗沙色',
    en: 'shadow wood top with moonveil sand bottom',
    topColor: { zh: '暗影木棕', en: 'shadow wood' },
    bottomColor: { zh: '月紗沙色', en: 'moonveil sand' },
  },
  {
    id: 'icy-blue-berry-red',
    zh: '冰藍 × 莓果紅',
    en: 'icy blue top with berry red bottom',
    topColor: { zh: '冰藍', en: 'icy blue' },
    bottomColor: { zh: '莓果紅', en: 'berry red' },
  },
  {
    id: 'midnight-lavender-black-wave',
    zh: '午夜薰衣草紫 × 黑浪',
    en: 'midnight lavender top with black wave bottom',
    topColor: { zh: '午夜薰衣草紫', en: 'midnight lavender' },
    bottomColor: { zh: '黑浪', en: 'black wave' },
  },
  {
    id: 'arctic-knight-darkstar-empress',
    zh: '北極騎士白 × 暗星莓紫',
    en: 'arctic knight top with darkstar empress bottom',
    topColor: { zh: '北極騎士白', en: 'arctic knight' },
    bottomColor: { zh: '暗星莓紫', en: 'darkstar empress' },
  },
  {
    id: 'crystal-lagoon-ethereal-dawn',
    zh: '水晶潟湖藍 × 空靈晨曦',
    en: 'crystal lagoon top with ethereal dawn bottom',
    topColor: { zh: '水晶潟湖藍', en: 'crystal lagoon' },
    bottomColor: { zh: '空靈晨曦', en: 'ethereal dawn' },
  },
  {
    id: 'cosmic-harbor-cherry-blossom',
    zh: '宇宙港灣藍 × 櫻花粉',
    en: 'cosmic harbor top with cherry blossom pink bottom',
    topColor: { zh: '宇宙港灣藍', en: 'cosmic harbor' },
    bottomColor: { zh: '櫻花粉', en: 'cherry blossom pink' },
  },
  {
    id: 'void-current-pikachu-yellow',
    zh: '虛空暗流 × 皮卡丘黃',
    en: 'void current top with pikachu yellow bottom',
    topColor: { zh: '虛空暗流', en: 'void current' },
    bottomColor: { zh: '皮卡丘黃', en: 'pikachu yellow' },
  },
  {
    id: 'frosted-mint-blackwater-core',
    zh: '霜薄荷 × 黑水核心',
    en: 'frosted mint top with blackwater core bottom',
    topColor: { zh: '霜薄荷', en: 'frosted mint' },
    bottomColor: { zh: '黑水核心', en: 'blackwater core' },
  },
  {
    id: 'mocha-berry-soft-vanilla',
    zh: '摩卡莓果 × 柔香草',
    en: 'mocha berry top with soft vanilla bottom',
    topColor: { zh: '摩卡莓果', en: 'mocha berry' },
    bottomColor: { zh: '柔香草', en: 'soft vanilla' },
  },
  {
    id: 'jasmine-dark-graphite',
    zh: '茉莉黃 × 暗石墨',
    en: 'jasmine yellow top with dark graphite bottom',
    topColor: { zh: '茉莉黃', en: 'jasmine yellow' },
    bottomColor: { zh: '暗石墨', en: 'dark graphite' },
  },
  {
    id: 'matcha-cream-milky-honey',
    zh: '抹茶奶霜 × 蜜乳白',
    en: 'matcha cream top with milky honey bottom',
    topColor: { zh: '抹茶奶霜', en: 'matcha cream' },
    bottomColor: { zh: '蜜乳白', en: 'milky honey' },
  },
  {
    id: 'hot-chocolate-fresh-cabbage',
    zh: '熱巧克力 × 新鮮高麗菜',
    en: 'hot chocolate top with fresh cabbage bottom',
    topColor: { zh: '熱巧克力', en: 'hot chocolate' },
    bottomColor: { zh: '新鮮高麗菜', en: 'fresh cabbage' },
  },
  {
    id: 'sky-blue-navy',
    zh: '天藍 × 海軍藍',
    en: 'sky blue top with navy bottom',
    topColor: { zh: '天藍', en: 'sky blue' },
    bottomColor: { zh: '海軍藍', en: 'navy' },
  },
  {
    id: 'white-indigo',
    zh: '白色 × 靛藍',
    en: 'white top with indigo bottom',
    topColor: { zh: '白色', en: 'white' },
    bottomColor: { zh: '靛藍', en: 'indigo' },
  },
  {
    id: 'white-black',
    zh: '白色 × 黑色',
    en: 'white top with black bottom',
    topColor: { zh: '白色', en: 'white' },
    bottomColor: { zh: '黑色', en: 'black' },
  },
  {
    id: 'light-blue-white',
    zh: '淡藍 × 白色',
    en: 'light blue top with white bottom',
    topColor: { zh: '淡藍', en: 'light blue' },
    bottomColor: { zh: '白色', en: 'white' },
  },
  {
    id: 'green-brown',
    zh: '綠色 × 棕色',
    en: 'green top with brown bottom',
    topColor: { zh: '綠色', en: 'green' },
    bottomColor: { zh: '棕色', en: 'brown' },
  },
  {
    id: 'yellow-turquoise-green',
    zh: '黃色 × 藍綠',
    en: 'yellow top with turquoise green bottom',
    topColor: { zh: '黃色', en: 'yellow' },
    bottomColor: { zh: '藍綠', en: 'turquoise green' },
  },
  {
    id: 'pink-brown',
    zh: '粉紅 × 棕色',
    en: 'pink top with brown bottom',
    topColor: { zh: '粉紅', en: 'pink' },
    bottomColor: { zh: '棕色', en: 'brown' },
  },
  {
    id: 'xanthous-burgundy',
    zh: '藤黃 × 勃艮第紅',
    en: 'xanthous yellow top with burgundy bottom',
    topColor: { zh: '藤黃', en: 'xanthous yellow' },
    bottomColor: { zh: '勃艮第紅', en: 'burgundy' },
  },
  {
    id: 'claret-dark-purple',
    zh: '深紅酒 × 暗紫',
    en: 'claret top with dark purple bottom',
    topColor: { zh: '深紅酒', en: 'claret' },
    bottomColor: { zh: '暗紫', en: 'dark purple' },
  },
].map(withTopBottomPaletteSwatches);
const TOP_BOTTOM_PALETTE_POOL = TOP_BOTTOM_PALETTE_OPTIONS.filter((option) => option.topColor && option.bottomColor);

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

const AMBIENT_LIGHT_CONDITIONS_CATEGORY = '環境光條件 (Ambient Light Conditions)';
const LEGACY_ENVIRONMENT_MOOD_CATEGORY = '環境光氛 (Environment Mood)';
const ENVIRONMENT_LIGHT_CATEGORIES = [AMBIENT_LIGHT_CONDITIONS_CATEGORY, LEGACY_ENVIRONMENT_MOOD_CATEGORY];
const LIGHT_STYLE_CATEGORY = '光線表現 (Light Style)';
const FOCAL_LENGTH_CATEGORY = '鏡頭焦段 (Focal Length)';
const APERTURE_CATEGORY = '光圈 / 景深 (Aperture & Depth of Field)';
const SHUTTER_CATEGORY = '快門 / 動態殘影 (Shutter & Motion Blur)';
const OPTICAL_EFFECTS_CATEGORY = '光學效果 (Optical Effects)';
const CAMERA_SYSTEM_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不指定相機系統，讓模型自行決定。', meta: { tags: ['none'] } },
  { id: 'leica-m-rangefinder', zh: '相機｜Leica M 旁軸', en: 'Leica M rangefinder camera profile, compact manual-focus body, 35mm or 50mm prime-lens pairing, crisp microcontrast, discreet optical immediacy', desc: '以旁軸相機的緊湊手動對焦、35mm 或 50mm 定焦搭配、清楚微對比與低干擾拍攝反應為核心。', meta: { tags: ['rangefinder', 'compact_camera', 'micro_contrast'] } },
  { id: 'ricoh-gr-snapshot', zh: '相機｜Ricoh GR 快拍', en: 'Ricoh GR compact APS-C camera profile, 28mm-equivalent snap perspective, fast street-snapshot response, high-acutance detail, pocket-camera immediacy', desc: '強調 Ricoh GR 的小型 APS-C 機身、28mm 等效快拍視角、snap 反應、高銳利細節與隨身相機即時感。', meta: { tags: ['compact', 'snapshot', 'high_acutance'] } },
  { id: 'fujifilm-x100', zh: '相機｜Fujifilm X100', en: 'Fujifilm X100 fixed-lens camera profile, 35mm-equivalent prime perspective, hybrid-viewfinder shooting feel, compact leaf-shutter clarity, refined Fuji response', desc: '以 X100 系列固定鏡頭機身、35mm 等效視角、混合觀景器拍攝感、葉片快門與富士反應為核心。', meta: { tags: ['fixed_lens', 'fuji_color', 'compact_camera'] } },
  { id: 'sony-full-frame-mirrorless', zh: '相機｜Sony 全片幅無反', en: 'Sony full-frame mirrorless camera profile, interchangeable-lens flexibility, precise autofocus response, clean high-resolution capture, broad dynamic range', desc: '強調現代全片幅無反的鏡頭彈性、準確自動對焦、高解析捕捉與寬動態範圍。', meta: { tags: ['full_frame', 'mirrorless', 'clean_digital'] } },
  { id: 'canon-nikon-dslr', zh: '相機｜Canon / Nikon DSLR', en: 'Canon or Nikon DSLR camera profile, optical-viewfinder shooting feel, classic full-frame lens behavior, reliable autofocus, firm digital capture', desc: '保留傳統 DSLR 的光學觀景器拍攝感、全片幅鏡頭反應、可靠對焦與穩定數位捕捉。', meta: { tags: ['dslr', 'classic_digital'] } },
  { id: 'digital-medium-format', zh: '相機｜中片幅數位', en: 'digital medium-format camera profile, large-sensor perspective, high-resolution capture, broad tonal latitude, smooth depth and detail rendering', desc: '以中片幅數位的大感光元件、高解析捕捉、寬階調容忍度與更平滑的空間細節為核心。', meta: { tags: ['medium_format', 'detail_heavy', 'editorial'] } },
  { id: 'drone-camera', zh: '相機｜空拍機小型感光元件', en: 'drone-camera profile, stabilized small-sensor capture, high-view perspective, deep-focus distant detail, crisp aerial digital response', desc: '保留空拍機小型感光元件的穩定、高視角、深焦遠距細節與偏數位銳利的捕捉反應。', meta: { tags: ['drone', 'aerial', 'deep_focus'] } },
  { id: 'smartphone-documentary', zh: '相機｜手機紀實直出', en: 'smartphone camera profile, computational capture response, automatic exposure behavior, wide everyday lens feel, casual handheld immediacy', desc: '強調手機運算攝影、自動曝光、日常廣角視覺與隨手拍的即時反應。', meta: { tags: ['smartphone', 'documentary', 'computational'] } },
];
const CAMERA_PROFILE_OPTION_IDS = new Set(CAMERA_SYSTEM_OPTIONS.filter((option) => option.id !== 'none').map((option) => option.id));
const SCENE_ATTRIBUTE_OPTIONS = [
  { id: '', zh: '未指定', en: '' },
  { id: 'indoor', zh: '室內', en: 'indoor setting' },
  { id: 'outdoor', zh: '戶外', en: 'outdoor setting' },
  { id: 'other', zh: '其他', en: 'other dedicated setting' },
];


const LOCK_DEFINITIONS = [
  { key: 'subjectCount', label: '人物數量', options: SUBJECT_COUNT_OPTIONS, required: true, defaultValue: '1', section: 'core' },
  { key: 'specialSubjectId', label: '特殊角色', options: SPECIAL_SUBJECT_OPTIONS, defaultValue: 'none', section: 'character' },
  { key: 'characterProfileId', label: '角色卡', options: CHARACTER_PROFILE_CONTROL_OPTIONS, defaultValue: 'none', section: 'character' },
  { key: 'characterCardHairVariantId', label: '角色卡髮型變化', defaultValue: 'default', section: 'hidden' },
  { key: 'characterCardEyewearMode', label: '角色卡眼鏡模式', defaultValue: 'default', section: 'hidden' },
  { key: 'characterCardWardrobeMode', label: '角色卡服裝模式', defaultValue: 'full-default', section: 'hidden' },
  { key: 'characterCardWardrobeLayerIds', label: '角色卡服裝層', defaultValue: [], multi: true, section: 'hidden' },
  { key: 'characterCardPromptOverride', label: '角色卡臨時覆寫', defaultValue: '', section: 'hidden' },
  { key: 'aspectRatio', label: '畫面比例', options: ASPECT_RATIO_OPTIONS, required: true, defaultValue: 'random', section: 'core' },
  { key: 'imageTypePresetId', label: '成品類型', options: IMAGE_TYPE_PRESET_OPTIONS, defaultValue: 'photorealistic-photo', suppressDefaultRandomOption: true, section: 'core' },
  { key: 'styleId', label: '攝影風格', category: '攝影風格', section: 'core' },
  { key: 'cameraSystemId', label: '舊相機', options: CAMERA_SYSTEM_OPTIONS, section: 'hidden' },
  { key: 'sceneAttributeId', label: '場景屬性', options: SCENE_ATTRIBUTE_OPTIONS, section: 'core' },
  { key: 'locationId', label: '場景', category: null, section: 'core' },
  { key: 'importedWorldSceneMode', label: '匯入世界場景模式', defaultValue: 'none', section: 'hidden' },
  { key: 'importedWorldSceneLabel', label: '匯入世界場景標籤', section: 'hidden' },
  { key: 'importedWorldSceneArchitectureText', label: '匯入世界場景架構', section: 'hidden' },
  { key: 'fixedCompositionSetId', label: '固定構圖場景', options: FIXED_COMPOSITION_SET_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'core' },
  { key: 'fixedSetPositionId', label: '固定場景人物位置', options: FIXED_SET_POSITION_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'core' },
  { key: 'fixedSetBackgroundStateId', label: '固定場景背景狀態', options: FIXED_SET_BACKGROUND_STATE_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'core' },
  { key: 'fixedSetCaptureModeId', label: '固定場景拍攝型態', options: FIXED_SET_CAPTURE_MODE_OPTIONS, defaultValue: 'photographer-shot', suppressDefaultRandomOption: true, section: 'core' },
  { key: 'fixedSetPerformanceStateId', label: '固定場景演出狀態', options: FIXED_SET_PERFORMANCE_STATE_OPTIONS, defaultValue: 'model-natural', suppressDefaultRandomOption: true, section: 'core' },
  { key: 'framingId', label: '構圖景別', category: '景別構圖 (Framing)', section: 'core' },
  { key: 'angleId', label: '俯仰角度', category: '相機視角 (Angle)', section: 'core' },
  { key: 'orbitId', label: '環繞角度', category: '拍攝方位 (Orbit Angle)', section: 'core' },
  { key: 'lensId', label: '鏡頭焦段', category: FOCAL_LENGTH_CATEGORY, section: 'core' },
  { key: 'apertureId', label: '光圈 / 景深', category: APERTURE_CATEGORY, section: 'core' },
  { key: 'shutterId', label: '快門 / 動態殘影', category: SHUTTER_CATEGORY, section: 'core' },
  { key: 'opticalEffectId', label: '光學效果', category: OPTICAL_EFFECTS_CATEGORY, section: 'core' },
  { key: 'lightingId', label: '環境光條件', category: AMBIENT_LIGHT_CONDITIONS_CATEGORY, section: 'core' },
  { key: 'lightDirectionId', label: '光線表現', category: LIGHT_STYLE_CATEGORY, section: 'core' },
  { key: 'filmId', label: '成像模擬 / 調色', category: '底片與相機模擬 (Camera & Film Simulation)', section: 'core' },
  { key: 'bodyTypeId', label: '體態', category: '體態 (Body Type)', section: 'character' },
  { key: 'bodyTypeAId', label: '人物 1 體態', category: '體態 (Body Type)', section: 'character' },
  { key: 'bodyTypeBId', label: '人物 2 體態', category: '體態 (Body Type)', section: 'character' },
  { key: 'facialFeaturesId', label: '五官特徵', category: '五官特徵 (Facial Features)', section: 'character' },
  { key: 'facialFeaturesAId', label: '人物 1 五官', category: '五官特徵 (Facial Features)', section: 'character' },
  { key: 'facialFeaturesBId', label: '人物 2 五官', category: '五官特徵 (Facial Features)', section: 'character' },
  { key: 'skinDetailsId', label: '膚質特徵', category: '膚質特徵 (Skin Details)', section: 'character' },
  { key: 'skinDetailsAId', label: '人物 1 膚質', category: '膚質特徵 (Skin Details)', section: 'character' },
  { key: 'skinDetailsBId', label: '人物 2 膚質', category: '膚質特徵 (Skin Details)', section: 'character' },
  { key: 'hairstyleId', label: '髮型', category: '髮型 (Hairstyle)', section: 'character' },
  { key: 'hairstyleAId', label: '人物 1 髮型', category: '髮型 (Hairstyle)', section: 'character' },
  { key: 'hairstyleBId', label: '人物 2 髮型', category: '髮型 (Hairstyle)', section: 'character' },
  { key: 'hairColorId', label: '髮色', category: '髮色 (Hair Color)', section: 'character' },
  { key: 'hairColorAId', label: '人物 1 髮色', category: '髮色 (Hair Color)', section: 'character' },
  { key: 'hairColorBId', label: '人物 2 髮色', category: '髮色 (Hair Color)', section: 'character' },
  { key: 'duoInteractionId', label: '雙人互動', options: DUO_INTERACTION_OPTIONS, section: 'hidden' },
  { key: 'duoPoseId', label: '雙人動作情境', options: DUO_POSE_OPTIONS, section: 'character' },
  { key: 'duoPoseBaseId', label: '雙人姿態基底', options: DUO_POSE_BASE_OPTIONS, section: 'character' },
  { key: 'duoExpressionId', label: '雙人神情眼神', options: DUO_EXPRESSION_OPTIONS, section: 'character' },
  { key: 'expressionId', label: '神情眼神', category: '神情與眼神 (Expression & Gaze)', section: 'character' },
  { key: 'expressionAId', label: '人物 1 神情眼神', category: '神情與眼神 (Expression & Gaze)', section: 'hidden' },
  { key: 'expressionBId', label: '人物 2 神情眼神', category: '神情與眼神 (Expression & Gaze)', section: 'hidden' },
  { key: 'poseId', label: '姿勢動作', category: '姿勢與肢體語言 (Pose & Body Language)', section: 'character' },
  { key: 'specialActionId', label: '特殊動作', category: '特殊動作 (Special Actions)', section: 'character' },
  { key: 'actionPoseCardId', label: '動作姿勢卡', section: 'hidden' },
  { key: 'poseBaseId', label: '姿勢基底', options: POSE_COMPOSER_BASE_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'character' },
  { key: 'poseArrangementId', label: '肢體變化', options: POSE_COMPOSER_ARRANGEMENT_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'character' },
  { key: 'poseHandId', label: '手部動作', options: POSE_COMPOSER_HAND_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'character' },
  { key: 'posePropId', label: '道具動作', options: POSE_COMPOSER_PROP_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'character' },
  { key: 'poseHeadId', label: '頭部方向', options: POSE_COMPOSER_HEAD_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'character' },
  { key: 'poseAnchorId', label: '接觸 / 支撐', options: POSE_COMPOSER_ANCHOR_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'character' },
  { key: 'specialOutfitId', label: '特殊穿搭', category: '特殊穿搭 (Special Outfits)', section: 'wardrobe' },
  { key: 'specialOutfitAId', label: '人物 1 特殊穿搭', category: '特殊穿搭 (Special Outfits)', section: 'wardrobe' },
  { key: 'specialOutfitBId', label: '人物 2 特殊穿搭', category: '特殊穿搭 (Special Outfits)', section: 'wardrobe' },
  { key: 'completeLookPaletteId', label: '完整造型色系', options: COMPLETE_LOOK_PALETTE_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'wardrobe' },
  { key: 'completeLookPaletteAId', label: '人物 1 完整造型色系', options: COMPLETE_LOOK_PALETTE_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'wardrobe' },
  { key: 'completeLookPaletteBId', label: '人物 2 完整造型色系', options: COMPLETE_LOOK_PALETTE_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'wardrobe' },
  { key: 'outfitPresetId', label: '套裝', category: '套裝 (Outfit Presets)', section: 'wardrobe' },
  { key: 'outfitPresetColorId', label: '套裝配色', options: OUTFIT_PRESET_COLOR_OPTIONS, section: 'hidden' },
  { key: 'outfitPresetAId', label: '人物 1 套裝', category: '套裝 (Outfit Presets)', section: 'wardrobe' },
  { key: 'outfitPresetAColorId', label: '人物 1 套裝配色', options: OUTFIT_PRESET_COLOR_OPTIONS, section: 'hidden' },
  { key: 'outfitPresetBId', label: '人物 2 套裝', category: '套裝 (Outfit Presets)', section: 'wardrobe' },
  { key: 'outfitPresetBColorId', label: '人物 2 套裝配色', options: OUTFIT_PRESET_COLOR_OPTIONS, section: 'hidden' },
  { key: 'outfitPresetPrimaryColorId', label: '套裝主色', options: OUTFIT_PRESET_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outfitPresetContrastColorId', label: '套裝對比色', options: OUTFIT_PRESET_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outfitPresetLockedPaletteId', label: '套裝鎖定色方案', options: OUTFIT_PRESET_LOCKED_PALETTE_OPTIONS, section: 'wardrobe' },
  { key: 'outfitPresetAPrimaryColorId', label: '人物 1 套裝主色', options: OUTFIT_PRESET_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outfitPresetAContrastColorId', label: '人物 1 套裝對比色', options: OUTFIT_PRESET_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outfitPresetALockedPaletteId', label: '人物 1 套裝鎖定色方案', options: OUTFIT_PRESET_LOCKED_PALETTE_OPTIONS, section: 'wardrobe' },
  { key: 'outfitPresetBPrimaryColorId', label: '人物 2 套裝主色', options: OUTFIT_PRESET_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outfitPresetBContrastColorId', label: '人物 2 套裝對比色', options: OUTFIT_PRESET_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outfitPresetBLockedPaletteId', label: '人物 2 套裝鎖定色方案', options: OUTFIT_PRESET_LOCKED_PALETTE_OPTIONS, section: 'wardrobe' },
  { key: 'topId', label: '上身', category: '上身 (Tops)', section: 'wardrobe' },
  { key: 'topAId', label: '人物 1 上身', category: '上身 (Tops)', section: 'wardrobe' },
  { key: 'topBId', label: '人物 2 上身', category: '上身 (Tops)', section: 'wardrobe' },
  { key: 'topFitId', label: '上身版型', options: TOP_FIT_OPTIONS, section: 'wardrobe' },
  { key: 'topFitAId', label: '人物 1 上身版型', options: TOP_FIT_OPTIONS, section: 'wardrobe' },
  { key: 'topFitBId', label: '人物 2 上身版型', options: TOP_FIT_OPTIONS, section: 'wardrobe' },
  { key: 'topStylingId', label: '上身穿法', options: TOP_STYLING_OPTIONS, section: 'wardrobe' },
  { key: 'topStylingAId', label: '人物 1 上身穿法', options: TOP_STYLING_OPTIONS, section: 'wardrobe' },
  { key: 'topStylingBId', label: '人物 2 上身穿法', options: TOP_STYLING_OPTIONS, section: 'wardrobe' },
  { key: 'topBottomPaletteId', label: '特殊上下身配色', options: TOP_BOTTOM_PALETTE_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'wardrobe' },
  { key: 'topBottomPaletteAId', label: '人物 1 特殊上下身配色', options: TOP_BOTTOM_PALETTE_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'wardrobe' },
  { key: 'topBottomPaletteBId', label: '人物 2 特殊上下身配色', options: TOP_BOTTOM_PALETTE_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'wardrobe' },
  { key: 'topColorId', label: '上身配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'topAColorId', label: '人物 1 上身配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'topBColorId', label: '人物 2 上身配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'topPatternId', label: '上身圖案', category: '上身圖案 (Top Surface Design)', section: 'wardrobe' },
  { key: 'topAPatternId', label: '人物 1 上身圖案', category: '上身圖案 (Top Surface Design)', section: 'wardrobe' },
  { key: 'topBPatternId', label: '人物 2 上身圖案', category: '上身圖案 (Top Surface Design)', section: 'wardrobe' },
  { key: 'dressId', label: '連身', category: '連身 (Dresses)', section: 'wardrobe' },
  { key: 'dressAId', label: '人物 1 連身', category: '連身 (Dresses)', section: 'wardrobe' },
  { key: 'dressBId', label: '人物 2 連身', category: '連身 (Dresses)', section: 'wardrobe' },
  { key: 'dressColorId', label: '連身配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'dressAColorId', label: '人物 1 連身配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'dressBColorId', label: '人物 2 連身配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'pantsId', label: '褲裝', category: '褲裝 (Pants)', section: 'wardrobe' },
  { key: 'pantsAId', label: '人物 1 褲裝', category: '褲裝 (Pants)', section: 'wardrobe' },
  { key: 'pantsBId', label: '人物 2 褲裝', category: '褲裝 (Pants)', section: 'wardrobe' },
  { key: 'skirtId', label: '裙裝', category: '裙裝 (Skirts)', section: 'wardrobe' },
  { key: 'skirtAId', label: '人物 1 裙裝', category: '裙裝 (Skirts)', section: 'wardrobe' },
  { key: 'skirtBId', label: '人物 2 裙裝', category: '裙裝 (Skirts)', section: 'wardrobe' },
  { key: 'bottomFitId', label: '下身版型', options: BOTTOM_FIT_OPTIONS, section: 'wardrobe' },
  { key: 'bottomFitAId', label: '人物 1 下身版型', options: BOTTOM_FIT_OPTIONS, section: 'wardrobe' },
  { key: 'bottomFitBId', label: '人物 2 下身版型', options: BOTTOM_FIT_OPTIONS, section: 'wardrobe' },
  { key: 'bottomRiseId', label: '下身腰線', options: BOTTOM_RISE_OPTIONS, section: 'wardrobe' },
  { key: 'bottomRiseAId', label: '人物 1 下身腰線', options: BOTTOM_RISE_OPTIONS, section: 'wardrobe' },
  { key: 'bottomRiseBId', label: '人物 2 下身腰線', options: BOTTOM_RISE_OPTIONS, section: 'wardrobe' },
  { key: 'bottomColorId', label: '下身配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'bottomAColorId', label: '人物 1 下身配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'bottomBColorId', label: '人物 2 下身配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'bottomPatternId', label: '下身圖案', category: '下身圖案 (Bottom Surface Design)', section: 'wardrobe' },
  { key: 'bottomAPatternId', label: '人物 1 下身圖案', category: '下身圖案 (Bottom Surface Design)', section: 'wardrobe' },
  { key: 'bottomBPatternId', label: '人物 2 下身圖案', category: '下身圖案 (Bottom Surface Design)', section: 'wardrobe' },
  { key: 'outerwearId', label: '外套', category: '外套 (Outerwear)', section: 'wardrobe' },
  { key: 'outerwearFitId', label: '外套版型', category: '外套版型 (Outerwear Fit)', section: 'wardrobe' },
  { key: 'outerwearColorId', label: '外套配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outerwearPatternId', label: '外套圖案', category: '外套圖案 (Outerwear Surface Design)', section: 'wardrobe' },
  { key: 'outerwearOpeningId', label: '外套開合', category: '外套開合 (Outerwear Opening)', section: 'wardrobe' },
  { key: 'outerwearStylingId', label: '外套穿法', category: '外套穿法 (Outerwear Styling)', section: 'wardrobe' },
  { key: 'legwearId', label: '襪類', category: '襪類 (Legwear)', section: 'wardrobe' },
  { key: 'legwearColorId', label: '襪類配色', options: LEGWEAR_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'shoesId', label: '鞋款', category: '鞋款 (Shoes)', section: 'wardrobe' },
  { key: 'shoesColorId', label: '鞋款配色', options: LAYER_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outerwearAId', label: '人物 1 外套', category: '外套 (Outerwear)', section: 'wardrobe' },
  { key: 'outerwearAFitId', label: '人物 1 外套版型', category: '外套版型 (Outerwear Fit)', section: 'wardrobe' },
  { key: 'outerwearAColorId', label: '人物 1 外套配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outerwearAPatternId', label: '人物 1 外套圖案', category: '外套圖案 (Outerwear Surface Design)', section: 'wardrobe' },
  { key: 'outerwearAOpeningId', label: '人物 1 外套開合', category: '外套開合 (Outerwear Opening)', section: 'wardrobe' },
  { key: 'outerwearAStylingId', label: '人物 1 外套穿法', category: '外套穿法 (Outerwear Styling)', section: 'wardrobe' },
  { key: 'legwearAId', label: '人物 1 襪類', category: '襪類 (Legwear)', section: 'wardrobe' },
  { key: 'legwearAColorId', label: '人物 1 襪類配色', options: LEGWEAR_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'shoesAId', label: '人物 1 鞋款', category: '鞋款 (Shoes)', section: 'wardrobe' },
  { key: 'shoesAColorId', label: '人物 1 鞋款配色', options: LAYER_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outerwearBId', label: '人物 2 外套', category: '外套 (Outerwear)', section: 'wardrobe' },
  { key: 'outerwearBFitId', label: '人物 2 外套版型', category: '外套版型 (Outerwear Fit)', section: 'wardrobe' },
  { key: 'outerwearBColorId', label: '人物 2 外套配色', options: GARMENT_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outerwearBPatternId', label: '人物 2 外套圖案', category: '外套圖案 (Outerwear Surface Design)', section: 'wardrobe' },
  { key: 'outerwearBOpeningId', label: '人物 2 外套開合', category: '外套開合 (Outerwear Opening)', section: 'wardrobe' },
  { key: 'outerwearBStylingId', label: '人物 2 外套穿法', category: '外套穿法 (Outerwear Styling)', section: 'wardrobe' },
  { key: 'legwearBId', label: '人物 2 襪類', category: '襪類 (Legwear)', section: 'wardrobe' },
  { key: 'legwearBColorId', label: '人物 2 襪類配色', options: LEGWEAR_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'shoesBId', label: '人物 2 鞋款', category: '鞋款 (Shoes)', section: 'wardrobe' },
  { key: 'shoesBColorId', label: '人物 2 鞋款配色', options: LAYER_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'headAccessoryId', label: '頭部配件', category: '頭部配件 (Head Accessories)', section: 'wardrobe' },
  { key: 'eyewearId', label: '眼鏡本體', category: '眼鏡 (Eyewear)', section: 'wardrobe' },
  { key: 'eyewearColorId', label: '眼鏡配色', category: '眼鏡配色 (Eyewear Color)', section: 'wardrobe' },
  { key: 'eyewearPlacementId', label: '眼鏡配戴方式', category: '眼鏡配戴方式 (Eyewear Placement)', section: 'wardrobe' },
  { key: 'earringsId', label: '耳環', category: '耳環 (Earrings)', section: 'wardrobe' },
  { key: 'neckAccessoryId', label: '頸部', category: '頸部 (Neck Accessories)', section: 'wardrobe' },
  { key: 'headAccessoryAId', label: '人物 1 頭部配件', category: '頭部配件 (Head Accessories)', section: 'wardrobe' },
  { key: 'eyewearAId', label: '人物 1 眼鏡本體', category: '眼鏡 (Eyewear)', section: 'wardrobe' },
  { key: 'eyewearAColorId', label: '人物 1 眼鏡配色', category: '眼鏡配色 (Eyewear Color)', section: 'wardrobe' },
  { key: 'eyewearAPlacementId', label: '人物 1 眼鏡配戴方式', category: '眼鏡配戴方式 (Eyewear Placement)', section: 'wardrobe' },
  { key: 'earringsAId', label: '人物 1 耳環', category: '耳環 (Earrings)', section: 'wardrobe' },
  { key: 'neckAccessoryAId', label: '人物 1 頸部', category: '頸部 (Neck Accessories)', section: 'wardrobe' },
  { key: 'headAccessoryBId', label: '人物 2 頭部配件', category: '頭部配件 (Head Accessories)', section: 'wardrobe' },
  { key: 'eyewearBId', label: '人物 2 眼鏡本體', category: '眼鏡 (Eyewear)', section: 'wardrobe' },
  { key: 'eyewearBColorId', label: '人物 2 眼鏡配色', category: '眼鏡配色 (Eyewear Color)', section: 'wardrobe' },
  { key: 'eyewearBPlacementId', label: '人物 2 眼鏡配戴方式', category: '眼鏡配戴方式 (Eyewear Placement)', section: 'wardrobe' },
  { key: 'earringsBId', label: '人物 2 耳環', category: '耳環 (Earrings)', section: 'wardrobe' },
  { key: 'neckAccessoryBId', label: '人物 2 頸部', category: '頸部 (Neck Accessories)', section: 'wardrobe' },
];

const REQUIRED_LOCK_KEYS = LOCK_DEFINITIONS.filter((definition) => definition.required).map((definition) => definition.key);
const LOCK_KEYS = new Set(LOCK_DEFINITIONS.map((definition) => definition.key));

const PARTIAL_REROLL_OPTIONS = [
  { key: 'styleId', label: 'Style' },
  { key: 'sceneAttributeId', label: 'Scene Attribute' },
  { key: 'locationId', label: 'Location' },
  { key: 'fixedCompositionSetId', label: 'Fixed Composition Set' },
  { key: 'fixedSetPositionId', label: 'Fixed Set Position' },
  { key: 'fixedSetBackgroundStateId', label: 'Fixed Set Background State' },
  { key: 'fixedSetCaptureModeId', label: 'Fixed Set Capture Mode' },
  { key: 'fixedSetPerformanceStateId', label: 'Fixed Set Performance State' },
  { key: 'framingId', label: 'Framing' },
  { key: 'angleId', label: 'Angle' },
  { key: 'orbitId', label: 'Orbit' },
  { key: 'lensId', label: 'Lens' },
  { key: 'apertureId', label: 'Aperture / Depth of Field' },
  { key: 'shutterId', label: 'Shutter / Motion Blur' },
  { key: 'opticalEffectId', label: 'Optical Effect' },
  { key: 'lightingId', label: 'Ambient Light Conditions' },
  { key: 'lightDirectionId', label: 'Subject Light Style' },
  { key: 'filmId', label: 'Rendering / Color Grade' },
  { key: 'outfitPresetId', label: 'Outfit Preset' },
  { key: 'specialSubjectId', label: 'Special Subject' },
  { key: 'characterProfileId', label: 'Character Profile Card' },
  { key: 'bodyTypeId', label: 'Body Type' },
  { key: 'bodyTypeAId', label: 'Woman 1 Body Type' },
  { key: 'bodyTypeBId', label: 'Woman 2 Body Type' },
  { key: 'facialFeaturesId', label: 'Face' },
  { key: 'facialFeaturesAId', label: 'Woman 1 Facial Features' },
  { key: 'facialFeaturesBId', label: 'Woman 2 Facial Features' },
  { key: 'skinDetailsId', label: 'Skin' },
  { key: 'skinDetailsAId', label: 'Woman 1 Skin' },
  { key: 'skinDetailsBId', label: 'Woman 2 Skin' },
  { key: 'hairstyleId', label: 'Hair Style' },
  { key: 'hairstyleAId', label: 'Woman 1 Hairstyle' },
  { key: 'hairstyleBId', label: 'Woman 2 Hairstyle' },
  { key: 'hairColorId', label: 'Hair Color' },
  { key: 'hairColorAId', label: 'Woman 1 Hair Color' },
  { key: 'hairColorBId', label: 'Woman 2 Hair Color' },
  { key: 'duoPoseId', label: 'Duo Action Scenario' },
  { key: 'duoPoseBaseId', label: 'Duo Posture Base' },
  { key: 'duoExpressionId', label: 'Duo Expression' },
  { key: 'expressionId', label: 'Expression' },
  { key: 'poseId', label: 'Pose' },
  { key: 'specialActionId', label: 'Special Action' },
  { key: 'specialOutfitId', label: 'Special Outfit' },
  { key: 'completeLookPaletteId', label: 'Complete Look Palette' },
  { key: 'outfitPresetId', label: 'Outfit Preset' },
  { key: 'outfitPresetColorId', label: 'Outfit Preset Color' },
  { key: 'outfitPresetPrimaryColorId', label: 'Outfit Preset Primary Color' },
  { key: 'outfitPresetContrastColorId', label: 'Outfit Preset Contrast Color' },
  { key: 'outfitPresetLockedPaletteId', label: 'Outfit Preset Locked Palette' },
  { key: 'specialOutfitAId', label: 'Woman 1 Special Outfit' },
  { key: 'completeLookPaletteAId', label: 'Woman 1 Complete Look Palette' },
  { key: 'outfitPresetAId', label: 'Woman 1 Outfit Preset' },
  { key: 'outfitPresetAColorId', label: 'Woman 1 Outfit Preset Color' },
  { key: 'outfitPresetAPrimaryColorId', label: 'Woman 1 Outfit Preset Primary Color' },
  { key: 'outfitPresetAContrastColorId', label: 'Woman 1 Outfit Preset Contrast Color' },
  { key: 'outfitPresetALockedPaletteId', label: 'Woman 1 Outfit Preset Locked Palette' },
  { key: 'specialOutfitBId', label: 'Woman 2 Special Outfit' },
  { key: 'completeLookPaletteBId', label: 'Woman 2 Complete Look Palette' },
  { key: 'outfitPresetBId', label: 'Woman 2 Outfit Preset' },
  { key: 'outfitPresetBColorId', label: 'Woman 2 Outfit Preset Color' },
  { key: 'outfitPresetBPrimaryColorId', label: 'Woman 2 Outfit Preset Primary Color' },
  { key: 'outfitPresetBContrastColorId', label: 'Woman 2 Outfit Preset Contrast Color' },
  { key: 'outfitPresetBLockedPaletteId', label: 'Woman 2 Outfit Preset Locked Palette' },
  { key: 'topId', label: 'Top' },
  { key: 'topAId', label: 'Woman 1 Top' },
  { key: 'topBId', label: 'Woman 2 Top' },
  { key: 'topFitId', label: 'Top Fit' },
  { key: 'topFitAId', label: 'Woman 1 Top Fit' },
  { key: 'topFitBId', label: 'Woman 2 Top Fit' },
  { key: 'topStylingId', label: 'Top Styling' },
  { key: 'topStylingAId', label: 'Woman 1 Top Styling' },
  { key: 'topStylingBId', label: 'Woman 2 Top Styling' },
  { key: 'topBottomPaletteId', label: 'Special Top/Bottom Palette' },
  { key: 'topBottomPaletteAId', label: 'Woman 1 Special Top/Bottom Palette' },
  { key: 'topBottomPaletteBId', label: 'Woman 2 Special Top/Bottom Palette' },
  { key: 'topColorId', label: 'Top Color' },
  { key: 'topAColorId', label: 'Woman 1 Top Color' },
  { key: 'topBColorId', label: 'Woman 2 Top Color' },
  { key: 'topPatternId', label: 'Top Surface Design' },
  { key: 'topAPatternId', label: 'Woman 1 Top Surface Design' },
  { key: 'topBPatternId', label: 'Woman 2 Top Surface Design' },
  { key: 'dressId', label: 'Dress' },
  { key: 'dressAId', label: 'Woman 1 Dress' },
  { key: 'dressBId', label: 'Woman 2 Dress' },
  { key: 'dressColorId', label: 'Dress Color' },
  { key: 'dressAColorId', label: 'Woman 1 Dress Color' },
  { key: 'dressBColorId', label: 'Woman 2 Dress Color' },
  { key: 'pantsId', label: 'Pants' },
  { key: 'pantsAId', label: 'Woman 1 Pants' },
  { key: 'pantsBId', label: 'Woman 2 Pants' },
  { key: 'skirtId', label: 'Skirt' },
  { key: 'skirtAId', label: 'Woman 1 Skirt' },
  { key: 'skirtBId', label: 'Woman 2 Skirt' },
  { key: 'bottomFitId', label: 'Bottom Fit' },
  { key: 'bottomFitAId', label: 'Woman 1 Bottom Fit' },
  { key: 'bottomFitBId', label: 'Woman 2 Bottom Fit' },
  { key: 'bottomRiseId', label: 'Bottom Rise' },
  { key: 'bottomRiseAId', label: 'Woman 1 Bottom Rise' },
  { key: 'bottomRiseBId', label: 'Woman 2 Bottom Rise' },
  { key: 'bottomColorId', label: 'Bottom Color' },
  { key: 'bottomAColorId', label: 'Woman 1 Bottom Color' },
  { key: 'bottomBColorId', label: 'Woman 2 Bottom Color' },
  { key: 'bottomPatternId', label: 'Bottom Surface Design' },
  { key: 'bottomAPatternId', label: 'Woman 1 Bottom Surface Design' },
  { key: 'bottomBPatternId', label: 'Woman 2 Bottom Surface Design' },
  { key: 'outerwearId', label: 'Outerwear' },
  { key: 'outerwearFitId', label: 'Outerwear Fit' },
  { key: 'outerwearColorId', label: 'Outerwear Color' },
  { key: 'outerwearPatternId', label: 'Outerwear Surface Design' },
  { key: 'outerwearOpeningId', label: 'Outerwear Opening' },
  { key: 'outerwearStylingId', label: 'Outerwear Styling' },
  { key: 'legwearId', label: 'Legwear' },
  { key: 'legwearColorId', label: 'Legwear Color' },
  { key: 'shoesId', label: 'Shoes' },
  { key: 'shoesColorId', label: 'Shoes Color' },
  { key: 'outerwearAId', label: 'Woman 1 Outerwear' },
  { key: 'outerwearAFitId', label: 'Woman 1 Outerwear Fit' },
  { key: 'outerwearAColorId', label: 'Woman 1 Outerwear Color' },
  { key: 'outerwearAPatternId', label: 'Woman 1 Outerwear Surface Design' },
  { key: 'outerwearAOpeningId', label: 'Woman 1 Outerwear Opening' },
  { key: 'outerwearAStylingId', label: 'Woman 1 Outerwear Styling' },
  { key: 'legwearAId', label: 'Woman 1 Legwear' },
  { key: 'legwearAColorId', label: 'Woman 1 Legwear Color' },
  { key: 'shoesAId', label: 'Woman 1 Shoes' },
  { key: 'shoesAColorId', label: 'Woman 1 Shoes Color' },
  { key: 'outerwearBId', label: 'Woman 2 Outerwear' },
  { key: 'outerwearBFitId', label: 'Woman 2 Outerwear Fit' },
  { key: 'outerwearBColorId', label: 'Woman 2 Outerwear Color' },
  { key: 'outerwearBPatternId', label: 'Woman 2 Outerwear Surface Design' },
  { key: 'outerwearBOpeningId', label: 'Woman 2 Outerwear Opening' },
  { key: 'outerwearBStylingId', label: 'Woman 2 Outerwear Styling' },
  { key: 'legwearBId', label: 'Woman 2 Legwear' },
  { key: 'legwearBColorId', label: 'Woman 2 Legwear Color' },
  { key: 'shoesBId', label: 'Woman 2 Shoes' },
  { key: 'shoesBColorId', label: 'Woman 2 Shoes Color' },
  { key: 'headAccessoryId', label: 'Head Accessory' },
  { key: 'eyewearId', label: 'Eyewear Frame' },
  { key: 'eyewearColorId', label: 'Eyewear Color' },
  { key: 'eyewearPlacementId', label: 'Eyewear Placement' },
  { key: 'earringsId', label: 'Earrings' },
  { key: 'neckAccessoryId', label: 'Neck Accessory' },
  { key: 'headAccessoryAId', label: 'Woman 1 Head Accessory' },
  { key: 'eyewearAId', label: 'Woman 1 Eyewear Frame' },
  { key: 'eyewearAColorId', label: 'Woman 1 Eyewear Color' },
  { key: 'eyewearAPlacementId', label: 'Woman 1 Eyewear Placement' },
  { key: 'earringsAId', label: 'Woman 1 Earrings' },
  { key: 'neckAccessoryAId', label: 'Woman 1 Neck Accessory' },
  { key: 'headAccessoryBId', label: 'Woman 2 Head Accessory' },
  { key: 'eyewearBId', label: 'Woman 2 Eyewear Frame' },
  { key: 'eyewearBColorId', label: 'Woman 2 Eyewear Color' },
  { key: 'eyewearBPlacementId', label: 'Woman 2 Eyewear Placement' },
  { key: 'earringsBId', label: 'Woman 2 Earrings' },
  { key: 'neckAccessoryBId', label: 'Woman 2 Neck Accessory' },
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

const sample = (arr, random = Math.random) => arr[Math.floor(random() * arr.length)];
const sampleNonNone = (arr, random = Math.random) => {
  const nonNone = arr.filter((item) => !isNoneLikeItem(item));
  return sample(nonNone.length > 0 ? nonNone : arr, random);
};
const isRandomOption = (item) => item?.id === 'random';
const isRandomLockValue = (value) => value === 'random';

function normalizePreviewExclusionId(value) {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().replace(/:[ab]$/g, '');
  if (!normalized || normalized === 'none' || normalized === 'random') return '';
  return normalized;
}

function buildPreviewRerollExclusions(selection = null) {
  const idByKey = new Map();

  Object.entries(selection || {}).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    const ids = values.map(normalizePreviewExclusionId).filter(Boolean);
    if (ids.length > 0) idByKey.set(key, new Set(ids));
  });

  const getIds = (keys = []) => {
    const ids = new Set();
    keys.forEach((key) => {
      idByKey.get(key)?.forEach((id) => ids.add(id));
    });
    return ids;
  };

  const excludes = (keys = [], itemOrId = null) => {
    const ids = getIds(keys);
    if (ids.size === 0) return false;
    const normalizedId = normalizePreviewExclusionId(typeof itemOrId === 'string' ? itemOrId : itemOrId?.id);
    if (normalizedId && ids.has(normalizedId)) return true;
    const baseId = typeof itemOrId === 'string'
      ? normalizePreviewExclusionId(itemOrId)
      : normalizePreviewExclusionId(getBaseWardrobeItemId(itemOrId));
    return Boolean(baseId && ids.has(baseId));
  };

  const filterCandidates = (candidates = [], keys = []) => {
    const filtered = candidates.filter((item) => !excludes(keys, item));
    return filtered.length > 0 ? filtered : candidates;
  };

  return { excludes, filterCandidates, getIds };
}

const EMPTY_PREVIEW_REROLL_EXCLUSIONS = buildPreviewRerollExclusions();

const WARDROBE_RANDOM_OPTIONS = {
  specialOutfit: {
    id: 'random',
    zh: '隨機',
    en: 'random special outfit',
    desc: 'Randomly select one non-empty special outfit when generating.',
    random: true,
    meta: { tags: ['random'] },
  },
  outfitPreset: {
    id: 'random',
    zh: '隨機',
    en: 'random outfit preset',
    desc: 'Randomly select one non-empty outfit preset when generating.',
    random: true,
    meta: { tags: ['random'] },
  },
  dress: {
    id: 'random',
    zh: '隨機',
    en: 'random dress',
    desc: 'Randomly select one non-empty dress when generating.',
    random: true,
    meta: { tags: ['random'] },
  },
};

const prependRandomOption = (options, randomOption) => {
  const withoutRandom = (options || []).filter((option) => option.id !== randomOption.id);
  return [randomOption, ...withoutRandom];
};

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

const DUO_WARDROBE_DIFFERENTIATION_PROMPT = 'coordinated but clearly distinct outfits, avoid identical garment colors, avoid matching top colors, keep each woman styling visually separate';

function getDuoWardrobeColorFamily(color) {
  if (!color || isNoneLikeItem(color)) return '';
  const haystack = toHaystack(color.id, color.zh, color.en);

  if (hasAny(haystack, ['multicolor', 'colorful', 'stripe', '彩色'])) return 'multi';
  if (hasAny(haystack, ['black', 'noir', 'void', 'graphite', 'blackwater', '黑'])) return 'black';
  if (hasAny(haystack, ['white', 'off-white', 'cream', 'ivory', 'vanilla', 'arctic', 'ethereal dawn', '白', '米白', '奶油'])) return 'light-neutral';
  if (hasAny(haystack, ['grey', 'gray', 'silver', 'chrome', 'gunmetal', '灰', '銀'])) return 'grey-metal';
  if (hasAny(haystack, ['brown', 'mocha', 'espresso', 'chocolate', 'coffee', 'clay', 'wood', 'dune', 'sand', '棕', '咖啡', '陶', '沙'])) return 'brown';
  if (hasAny(haystack, ['blue', 'navy', 'indigo', 'lagoon', 'harbor', 'tide', '藍', '靛'])) return 'blue';
  if (hasAny(haystack, ['red', 'raspberry', 'berry', 'burgundy', 'claret', '紅', '莓', '酒'])) return 'red';
  if (hasAny(haystack, ['pink', 'rose', 'fuchsia', 'blush', 'peony', 'cherry blossom', '粉', '玫瑰', '櫻花'])) return 'pink';
  if (hasAny(haystack, ['green', 'lime', 'chartreuse', 'mint', 'matcha', 'hunter', 'cabbage', 'turquoise', '綠', '萊姆', '薄荷', '抹茶'])) return 'green';
  if (hasAny(haystack, ['yellow', 'butter', 'lemon', 'pikachu', 'jasmine', 'xanthous', 'goose', '黃'])) return 'yellow';
  if (hasAny(haystack, ['purple', 'violet', 'lilac', 'lavender', 'grape', 'thistle', 'empress', '紫', '丁香', '薰衣草'])) return 'purple';
  if (hasAny(haystack, ['orange', 'phoenix', 'dragon fire', '橘', '橙'])) return 'orange';
  if (hasAny(haystack, ['gold', '金'])) return 'gold';

  return haystack;
}

function duoWardrobeColorsConflict(color, compareColor) {
  if (!color || !compareColor || isNoneLikeItem(color) || isNoneLikeItem(compareColor)) return false;
  if (color.id && compareColor.id && color.id === compareColor.id) return true;
  const colorLabel = stripMarkdown(color.en || color.zh || '').toLowerCase();
  const compareLabel = stripMarkdown(compareColor.en || compareColor.zh || '').toLowerCase();
  if (colorLabel && compareLabel && colorLabel === compareLabel) return true;

  const family = getDuoWardrobeColorFamily(color);
  const compareFamily = getDuoWardrobeColorFamily(compareColor);
  return Boolean(family && compareFamily && family === compareFamily);
}

function sampleColorAvoiding(options, avoidColors = [], colorGetter = (item) => item, random = Math.random) {
  const nonNone = options.filter((item) => !isNoneLikeItem(item));
  const safeCandidates = nonNone.filter((item) => !avoidColors.some((color) => duoWardrobeColorsConflict(colorGetter(item), color)));
  return sample(safeCandidates.length > 0 ? safeCandidates : nonNone.length > 0 ? nonNone : options, random);
}

function getBaseWardrobeItemId(item) {
  return item?.id?.replace(/:[ab]$/g, '') || '';
}

function hasDuoRoleMainWardrobe(wardrobeSlots) {
  return Boolean(
    wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB ||
    wardrobeSlots.dressA || wardrobeSlots.dressB ||
    wardrobeSlots.topA || wardrobeSlots.topB ||
    wardrobeSlots.pantsA || wardrobeSlots.pantsB ||
    wardrobeSlots.skirtA || wardrobeSlots.skirtB
  );
}

function shouldAddDuoWardrobeDifferentiationPrompt(context, wardrobeSlots) {
  if (context?.subject?.count !== 2 || !hasDuoRoleMainWardrobe(wardrobeSlots)) return false;
  const locks = context.locks || {};
  const explicitSameTopColor = Boolean(locks.topAColorId && locks.topBColorId && locks.topAColorId === locks.topBColorId);
  const explicitSamePalette = Boolean(
    locks.topBottomPaletteAId &&
    locks.topBottomPaletteBId &&
    locks.topBottomPaletteAId === locks.topBottomPaletteBId &&
    !['none', 'random'].includes(locks.topBottomPaletteAId)
  );

  return !explicitSameTopColor && !explicitSamePalette;
}

const getByKey = (obj, key) => obj[key] || [];
const getByKeys = (obj, keys) => keys.flatMap((key) => getByKey(obj, key));

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

  if (hasAny(haystack, ['mika ninagawa', '蜷川實花', 'hyper-saturated theatrical'])) tags.push('high_saturation', 'dreamlike', 'artificial_light', 'controlled');
  if (hasAny(haystack, ['yoshihiko ueda', '上田義彥', 'low-key tonal calm'])) tags.push('moody', 'cool_grade', 'dramatic', 'natural_light_bias', 'low_key_bias');
  if (hasAny(haystack, ['osamu yokonami', '橫浪修', 'structured spacing'])) tags.push('minimal', 'structured', 'conceptual', 'soft_grade');
  if (hasAny(haystack, ['rinko kawauchi', '川內倫子', 'fragile quiet details'])) tags.push('soft_grade', 'natural_light_bias', 'high_key');
  if (hasAny(haystack, ['masumi ishida', '石田真澄', 'summer-color brightness'])) tags.push('soft_grade', 'natural_light_bias', 'film', 'lively');
  if (hasAny(haystack, ['orie ichihashi', '市橋織江', 'transparent natural-light quality'])) tags.push('soft_grade', 'natural_light_bias', 'film', 'cool_grade');
  if (hasAny(haystack, ['yoko takahashi', '高橋ヨーコ', 'sun-bleached portraiture'])) tags.push('soft_grade', 'natural_light_bias', 'bright_grade');
  if (hasAny(haystack, ['paolo roversi', '保羅・羅韋爾西', 'soft haze couture'])) tags.push('soft_grade', 'moody', 'elegant', 'controlled');
  if (hasAny(haystack, ['ellen von unwerth', '艾倫・馮・昂沃斯', 'playful editorial'])) tags.push('artificial_light', 'flash_bias', 'lively', 'editorial');
  if (hasAny(haystack, ['nan goldin', '南・戈爾丁', 'intimate diaristic'])) tags.push('film', 'warm_grade', 'raw', 'intimate');
  if (hasAny(haystack, ['juergen teller', '尤爾根・特勒', 'raw direct-flash'])) tags.push('artificial_light', 'flash_bias', 'raw', 'editorial');
  if (hasAny(haystack, ['richard avedon', '理察・阿維頓', 'clean negative space'])) tags.push('minimal', 'controlled', 'editorial', 'clean_grade');
  if (hasAny(haystack, ['alec soth', '亞歷克・索斯', 'spacious documentary'])) tags.push('natural_light_bias', 'documentary', 'soft_grade', 'minimal');
  if (hasAny(haystack, ['sally mann', '莎莉・曼', 'wet-plate portraiture'])) tags.push('monochrome', 'moody', 'heritage_style', 'low_frequency_style');
  if (hasAny(haystack, ['wolfgang tillmans', '沃夫岡・提爾曼斯', 'informal framing'])) tags.push('natural_light_bias', 'documentary', 'lively', 'raw');
  if (hasAny(haystack, ['daido moriyama', '森山大道', 'high-contrast monochrome'])) tags.push('monochrome', 'high_contrast', 'raw', 'low_frequency_style');
  if (hasAny(haystack, ['nobuyoshi araki', '荒木經惟', 'raw intimate diaristic'])) tags.push('film', 'flash_bias', 'raw', 'intimate');
  if (hasAny(haystack, ['kishin shinoyama', '篠山紀信', 'polished japanese gravure'])) tags.push('clean_grade', 'beauty', 'controlled', 'editorial');
  if (hasAny(haystack, ['chikashi suzuki', '鈴木親', 'relaxed fashion editorial'])) tags.push('natural_light_bias', 'film', 'soft_grade', 'editorial');
  if (hasAny(haystack, ['yuki aoyama', '青山裕企', 'simple subject distance'])) tags.push('natural_light_bias', 'lively', 'clean_grade');
  if (hasAny(haystack, ['yuhki toyama', '奧山由之', 'coming-of-age atmosphere'])) tags.push('natural_light_bias', 'soft_grade', 'cinematic');
  if (hasAny(haystack, ['leslie kee', 'レスリー・キー', 'star portrait photography'])) tags.push('clean_grade', 'beauty', 'controlled', 'editorial');
  if (hasAny(haystack, ['eikoh hosoe', '細江英公', 'dramatic monochrome art'])) tags.push('monochrome', 'dramatic', 'controlled', 'low_frequency_style');
  if (hasAny(haystack, ['guy bourdin', '蓋・布爾丁', 'bold narrative fashion'])) tags.push('dramatic', 'high_saturation', 'editorial', 'controlled');
  if (hasAny(haystack, ['miles aldridge', '邁爾斯・奧爾德里奇', 'hyper-stylized fashion'])) tags.push('high_saturation', 'artificial_light', 'controlled', 'editorial');
  if (hasAny(haystack, ['elsa bleda', '艾爾莎·布萊達', 'nocturnal neon'])) tags.push('neon', 'artificial_light', 'night_bias', 'moody');

  return { tags: withTags(tags) };
}

function inferLocationMeta(category, item) {
  const haystack = toHaystack(category, item.zh, item.en, item.desc);
  const itemHaystack = toHaystack(item.zh, item.en, item.desc);
  const itemPromptHaystack = toHaystack(item.zh, item.en);
  const tags = [];

  if (hasAny(haystack, ['studio sets', '攝影棚與背景'])) tags.push('indoor', 'set', 'controlled', 'studio');
  if (hasAny(haystack, ['urban & social snapshots', '城市與社群感'])) tags.push('urban');
  if (hasAny(haystack, ['indoor & lifestyle', '生活感室內'])) tags.push('indoor');
  if (hasAny(haystack, ['nature & outdoors', '自然與戶外'])) tags.push('outdoor', 'natural');
  if (hasAny(haystack, ['abandoned & underground', '地下與廢墟風格'])) tags.push('ruin');
  if (hasAny(haystack, ['other dedicated scenes', '其他專屬場景'])) tags.push('other_scene');

  if (hasAny(haystack, ['hotel', 'boutique hotel', '旅館', '飯店'])) tags.push('hospitality', 'indoor');
  if (hasAny(haystack, ['apartment', 'bedroom', 'living room', 'home kitchen', 'domestic kitchen', '臥室', '公寓', '客廳', '住宅廚房'])) tags.push('residential', 'indoor');
  if (hasAny(haystack, ['interior', 'inside', 'room', 'hallway', 'corridor', 'stairwell', 'stairwell shaft', 'seating', 'dining aisle', 'bathroom', 'vanity', 'mirror', 'store interior', 'kitchen', '店內', '室內', '房間', '浴室', '鏡前', '樓梯井', '長椅區', '廚房'])) {
    tags.push('indoor');
  }
  if (hasAny(haystack, ['ryokan', 'engawa', 'wooden deck', 'veranda', '緣側', '木廊'])) tags.push('outdoor');
  if (hasAny(haystack, ['plaza', 'pedestrian', 'crosswalk', 'sidewalk', 'street', 'streetfront', 'square', 'lawn edge', 'outdoor', 'shoreline', 'beach', 'park', 'deck', 'avenue', 'station front', '廣場', '行人區', '人行道', '街頭', '街角', '穿越口', '草地邊', '海灘', '岩岸', '公園', '木棧道', '戶外'])) {
    tags.push('outdoor');
  }
  if (hasAny(haystack, ['café', 'bar entrance', 'storefront', 'shopfront', 'night market', 'mall', 'laundromat', '咖啡', '夜市', '商場'])) {
    tags.push('commercial');
  }
  if (hasAny(haystack, ['bookstore', 'bookshop', 'used-book', 'used book shop', 'antique book', '古書', '二手書店', '書店'])) {
    tags.push('commercial', 'heritage', 'indoor');
  }
  if (hasAny(haystack, ['subway', 'platform', 'station', 'train car', 'commuter train', 'carriage', 'railway carriage', 'grab poles', 'hand straps', '地鐵', '月台', '電車', '車廂', '吊環', '扶手柱'])) tags.push('transit', 'urban');
  if (hasAny(haystack, ['factory', 'control room', 'train yard', 'scaffolding', 'construction', '工廠', '工地', '機房'])) tags.push('industrial');
  if (hasAny(haystack, ['hospital', 'operating room', 'ward', 'classroom', 'music room', 'school', '病房', '診療室', '教室'])) {
    tags.push('institutional', 'indoor');
  }
  if (hasAny(haystack, ['opera house', 'mansion', 'library', 'old town', 'townhouse', '洋房', '歌劇院', '大宅', '老城'])) {
    tags.push('heritage');
  }
  if (hasAny(haystack, ['british vintage', 'sash window', 'framed paintings', 'porcelain trinkets', '英倫復古', '古董鐘'])) {
    tags.push('heritage', 'indoor');
  }
  if (hasAny(haystack, ['ryokan', 'engawa', 'traditional japanese', 'washitsu', '緣側', '和室', '日式旅館'])) {
    tags.push('heritage');
  }
  if (hasAny(haystack, ['beach', 'shoreline', 'coastline', 'lake', 'lakeside', 'marina', 'harbor', 'waterfront', 'dockside', 'yacht', 'sailboat', 'pier', 'sand dune', '沙丘', '海灘', '湖邊', '岩岸', '碼頭', '港灣', '水岸', '遊艇', '帆船'])) {
    tags.push('waterfront', 'outdoor', 'natural');
  }
  if (hasAny(haystack, ['poolside', 'swimming pool', 'resort pool', '泳池'])) {
    tags.push('waterfront', 'outdoor');
  }
  if (hasAny(haystack, ['river-view', 'riverside', 'river channel', 'river below', 'riverbank', 'canal water', '河流', '河景', '河道'])) {
    tags.push('waterfront', 'outdoor');
  }
  if (hasAny(haystack, ['forest', 'grass', 'sunflower', 'park', 'garden greenery', '庭院', '樹影', '森林', '草地', '花田', '公園'])) {
    tags.push('green_space');
  }
  if (hasAny(itemHaystack, ['bunker', 'drainage', 'tunnel', '地下', '排洪道'])) tags.push('subterranean');
  if (hasAny(itemPromptHaystack, ['white background', 'grey seamless', 'paper roll', 'backdrop', '白幕', '黑幕', '背景'])) tags.push('studio');
  if (hasAny(haystack, ['鏡面地板攝影棚', 'five-sided mirror chamber studio'])) {
    tags.push('mirror_studio', 'studio_lighting_scene');
  }
  if (hasAny(haystack, [
    '純潔白幕',
    '深邃黑幕',
    '莫蘭迪灰背景',
    '純藍背景',
    '純橘背景',
    '純紅背景',
    '純黃背景',
    '純紫背景',
    '純綠背景',
    '鮮豔撞色背景',
    'infinite white background',
    'infinite black background',
    'infinite muted grey background',
    'infinite solid blue background',
    'infinite solid orange background',
    'infinite solid red background',
    'infinite solid yellow background',
    'infinite solid purple background',
    'infinite solid green background',
    'infinite vibrant solid-color background',
  ])) {
    tags.push('solid_color_studio', 'studio_lighting_scene');
  }
  if (hasAny(haystack, ['CRT 電視牆攝影棚', 'retro cathode-ray display wall', 'seamless desaturated blue-grey floor and backdrop'])) {
    tags.push('studio_lighting_scene');
  }

  return { tags: withTags(tags) };
}

function inferFramingMeta(_category, item) {
  const haystack = toHaystack(item.zh, item.en, item.desc);

  if (hasAny(haystack, ['partial facial features', '局部五官特寫'])) return { visibility: 'close', tags: ['face_detail', 'partial_face'] };
  if (hasAny(haystack, ['only one half of the face', '半臉傾斜特寫'])) return { visibility: 'close', tags: ['face_detail', 'partial_face', 'dutch_bias'] };
  if (hasAny(haystack, ['entire face filling almost the whole frame', '臉部特寫'])) return { visibility: 'close', tags: ['face_detail', 'full_face_tight'] };
  if (hasAny(haystack, ['tight bust-up portrait', '胸上特寫'])) return { visibility: 'portrait', tags: ['eye_contact_ok', 'face_detail', 'upper_body_focus'] };
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

  if (hasAny(haystack, ['high camera position', '高位俯視'])) return { tags: ['high_angle'] };
  if (hasAny(haystack, ['bird', 'top-down', 'zenith', 'overhead', '正上方俯視', '鳥瞰'])) return { tags: ['aerial', 'no_eye_contact', 'low_frequency_angle'] };
  if (hasAny(haystack, ['worm', '蟲眼視角'])) return { tags: ['low_angle', 'low_camera_height', 'near_foreground_perspective', 'low_frequency_angle'] };
  if (hasAny(haystack, ['floor-level', 'ground-level', '地面高度'])) return { tags: ['low_angle', 'low_camera_height', 'low_frequency_angle'] };
  if (hasAny(haystack, ['knee-level', '膝蓋高度'])) return { tags: ['low_camera_height', 'low_frequency_angle'] };
  if (hasAny(haystack, ['waist-level', 'hip-level', '腰部高度'])) return { tags: ['low_camera_height'] };
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

function getOutfitPresetLockedPaletteOption(id) {
  return OUTFIT_PRESET_LOCKED_PALETTE_OPTIONS.find((option) => option.id === id) || null;
}

function getCompleteLookPaletteOption(id) {
  const option = COMPLETE_LOOK_PALETTE_OPTIONS.find((item) => item.id === id) || null;
  return option && option.id !== 'none' ? option : null;
}

function buildCompleteLookPaletteDirection(palette) {
  if (!palette || isNoneLikeItem(palette)) return '';
  const paletteText = stripMarkdown(palette.en || '').replace(/\s+/g, ' ').trim();
  if (!paletteText || paletteText === 'none') return '';
  return `complete outfit palette direction: shift the complete outfit palette toward a ${paletteText}, preserving garment structure, accessory separation, material contrast, and multi-piece color variation`;
}

function appendCompleteLookPaletteDirection(text, palette) {
  const base = stripMarkdown(text || '').replace(/\s+/g, ' ').trim();
  const paletteText = buildCompleteLookPaletteDirection(palette);
  if (!base) return paletteText;
  return paletteText ? `${base}, ${paletteText}` : base;
}

function normalizeLegacyOutfitPresetColors(locks = {}) {
  const next = { ...locks };
  const mappings = [
    ['outfitPresetColorId', 'outfitPresetPrimaryColorId'],
    ['outfitPresetAColorId', 'outfitPresetAPrimaryColorId'],
    ['outfitPresetBColorId', 'outfitPresetBPrimaryColorId'],
  ];

  mappings.forEach(([legacyKey, primaryKey]) => {
    const legacyValue = next[legacyKey] || '';
    const primaryValue = next[primaryKey] || '';

    if (!primaryValue && legacyValue) {
      next[primaryKey] = legacyValue;
    }
    if (!legacyValue && primaryValue) {
      next[legacyKey] = primaryValue;
    }
  });

  return next;
}

function getTopBottomPaletteOption(id, avoid = {}, random = Math.random) {
  const option = TOP_BOTTOM_PALETTE_OPTIONS.find((item) => item.id === id) || null;
  if (!option || option.id === 'none') return null;
  if (option.random) {
    const topColors = avoid.topColors || [];
    const bottomColors = avoid.bottomColors || [];
    const safeCandidates = TOP_BOTTOM_PALETTE_POOL.filter((palette) => (
      !topColors.some((color) => duoWardrobeColorsConflict(palette.topColor, color)) &&
      !bottomColors.some((color) => duoWardrobeColorsConflict(palette.bottomColor, color))
    ));
    return sample(safeCandidates.length > 0 ? safeCandidates : TOP_BOTTOM_PALETTE_POOL, random);
  }
  return option.topColor && option.bottomColor ? option : null;
}

function inferLightingMeta(category, item) {
  const haystack = toHaystack(category, item.zh, item.en, item.desc);
  const tags = [];
  const isLightStyleCategory = category === LIGHT_STYLE_CATEGORY;
  const isEnvironmentCategory = ENVIRONMENT_LIGHT_CATEGORIES.includes(category);

  if (isEnvironmentCategory) {
    if (hasAny(haystack, ['晴朗白日', 'clear daylight'])) {
      tags.push('natural_light', 'sunlight', 'day', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['藍天白雲', 'clear blue sky'])) {
      tags.push('natural_light', 'sunlight', 'day', 'clean_sky', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['夏日深藍積雲', 'deep azure summer sky', 'towering luminous white cumulus'])) {
      tags.push('natural_light', 'sunlight', 'day', 'clean_sky', 'summer_sky', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['雨前灰黑天空', 'charcoal-gray pre-rain sky', 'gray-black cloud mass'])) {
      tags.push('natural_light', 'cloudy', 'dark', 'dramatic', 'pre_rain_sky', 'supports_outdoor', 'supports_urban', 'supports_natural');
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
    if (hasAny(haystack, ['晨光日出', 'sunrise conditions'])) {
      tags.push('natural_light', 'sunlight', 'day', 'warm', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['黃昏夕陽', 'golden sunset'])) {
      tags.push('natural_light', 'sunlight', 'warm', 'dusk', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['藍調傍晚', 'blue hour'])) {
      tags.push('natural_light', 'dusk', 'cool', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['城市夜間混合光', '夜晚街燈', 'urban night ambience', 'warm-cool mixed city glow'])) {
      tags.push('artificial_light', 'dark', 'night_ambient', 'supports_outdoor', 'supports_urban', 'supports_commercial', 'supports_subterranean');
    }
    if (hasAny(haystack, ['月光夜色', 'moonlit night'])) {
      tags.push('natural_light', 'dark', 'cool', 'night_ambient', 'supports_outdoor', 'supports_natural', 'supports_urban');
    }
    if (item.zh === '城市高彩度夜色' || item.zh === '霓虹夜色' || hasAny(haystack, ['saturated-color urban night ambience', 'neon night conditions'])) {
      tags.push('artificial_light', 'neon', 'dark', 'supports_outdoor', 'supports_urban', 'supports_commercial', 'supports_subterranean');
    }
    if (hasAny(haystack, ['陰雨將至', 'storm-brewing conditions'])) {
      tags.push('natural_light', 'cloudy', 'dark', 'dramatic', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['雨天陰濕', 'rainy conditions'])) {
      tags.push('natural_light', 'rain', 'diffused', 'dark', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['雨後反光', 'post-rain'])) {
      tags.push('natural_light', 'rain', 'reflective', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['雪地冷光', 'snow-bright'])) {
      tags.push('natural_light', 'snow', 'cool', 'reflective', 'supports_outdoor', 'supports_natural', 'supports_urban');
    }
    if (hasAny(haystack, ['冬季灰冷', 'cold winter overcast conditions'])) {
      tags.push('natural_light', 'cloudy', 'cool', 'supports_outdoor', 'supports_natural', 'supports_urban');
    }
    if (hasAny(haystack, ['室內窗邊日光', 'indoor daylight by the window'])) {
      tags.push('window_light', 'natural_light', 'indoor', 'day', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內清晨冷白日光', 'indoor early-morning daylight'])) {
      tags.push('window_light', 'natural_light', 'indoor', 'day', 'cool', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內午後柔亮日光', 'indoor late-afternoon daylight'])) {
      tags.push('window_light', 'natural_light', 'indoor', 'day', 'soft_light', 'warm', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內陰影日光', 'indoor dim daylight'])) {
      tags.push('window_light', 'natural_light', 'indoor', 'diffused', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內陰雨昏暗天光', 'indoor rainy-day daylight'])) {
      tags.push('window_light', 'natural_light', 'indoor', 'rain', 'cloudy', 'diffused', 'dark', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內黃昏微暖餘光', 'indoor dusk afterglow'])) {
      tags.push('window_light', 'natural_light', 'indoor', 'dusk', 'warm', 'dark', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內暖色夜景', '室內暖光夜景', 'indoor warm night'])) {
      tags.push('artificial_light', 'indoor', 'warm', 'dark', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_commercial', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內低照度暖色夜景', '室內夜晚低照度暖光', 'indoor low-light warm night ambience'])) {
      tags.push('artificial_light', 'indoor', 'warm', 'dark', 'soft_light', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內社交暖色夜景', '室內派對暖光夜景', 'warm low-light social interior ambience'])) {
      tags.push('artificial_light', 'indoor', 'warm', 'dark', 'soft_light', 'supports_indoor', 'supports_residential');
    }
    if (hasAny(haystack, ['室內極暖低照度', '室內燭光', 'very warm low-light interior ambience'])) {
      tags.push('artificial_light', 'indoor', 'warm', 'dark', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內冷白環境光', '室內冷色人造光', 'indoor cool artificial'])) {
      tags.push('artificial_light', 'indoor', 'cool', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_commercial', 'supports_heritage', 'supports_subterranean');
    }
    if (hasAny(haystack, ['室內冷白高亮日常', '室內冷白螢光日常', 'cool-white everyday interior ambience'])) {
      tags.push('artificial_light', 'indoor', 'cool', 'controlled', 'supports_indoor', 'supports_residential', 'supports_commercial', 'supports_hospitality', 'supports_subterranean');
    }
    if (hasAny(haystack, ['室內外光滲入微暗空間', 'dim interior lit mostly by exterior spill light'])) {
      tags.push('window_light', 'natural_light', 'indoor', 'dark', 'diffused', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內深夜冷暗微光', 'very dark late-night interior'])) {
      tags.push('window_light', 'natural_light', 'indoor', 'dark', 'cool', 'night_ambient', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage', 'supports_subterranean');
    }
    if (hasAny(haystack, ['室內高彩度色光夜景', '室內霓虹夜色', 'indoor saturated-color night ambience'])) {
      tags.push('artificial_light', 'indoor', 'neon', 'dark', 'supports_indoor', 'supports_commercial', 'supports_hospitality', 'supports_subterranean');
    }
    if (hasAny(haystack, ['高調純白攝影棚', 'high-key white studio lighting'])) {
      tags.push('artificial_light', 'indoor', 'studio_light', 'studio_scene_only', 'controlled', 'soft_light', 'supports_indoor', 'supports_studio', 'supports_commercial');
    }
    if (hasAny(haystack, ['柔霧美妝攝影棚', 'soft beauty studio lighting'])) {
      tags.push('artificial_light', 'indoor', 'studio_light', 'studio_scene_only', 'controlled', 'soft_light', 'portrait_light', 'supports_indoor', 'supports_studio', 'supports_commercial');
    }
    if (hasAny(haystack, ['舞台演出燈光', 'stage-inspired studio lighting'])) {
      tags.push('artificial_light', 'stage_light', 'studio_scene_only', 'dramatic', 'supports_indoor', 'supports_commercial', 'supports_studio');
    }
  }

  if (isEnvironmentCategory && !isNoneLikeItem(item)) {
    if (/(攝影棚|舞台)/.test(item.zh || '')) {
      tags.push('ambient_studio', 'ambient_indoor');
    } else if (String(item.zh || '').startsWith('室內')) {
      tags.push('ambient_indoor');
    } else {
      tags.push('ambient_outdoor');
    }
  }

  if (isLightStyleCategory) {
    if (hasAny(haystack, ['柔和順光', 'soft frontal key light'])) {
      tags.push('soft_light', 'portrait_light', 'supports_indoor', 'supports_outdoor', 'supports_studio', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['均勻平光', 'flat even subject lighting'])) {
      tags.push('soft_light', 'controlled', 'supports_indoor', 'supports_outdoor', 'supports_studio', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['側向柔光', 'soft side key light'])) {
      tags.push('soft_light', 'portrait_light', 'supports_indoor', 'supports_outdoor', 'supports_studio');
    }
    if (hasAny(haystack, ['側向硬光', 'hard side key light'])) {
      tags.push('portrait_light', 'harsh', 'supports_indoor', 'supports_outdoor', 'supports_studio');
    }
    if (hasAny(haystack, ['側逆光', 'diagonal rear-side light'])) {
      tags.push('backlight', 'supports_indoor', 'supports_outdoor', 'supports_studio');
    }
    if (hasAny(haystack, ['逆光輪廓光', 'strong back rim light'])) {
      tags.push('backlight', 'supports_indoor', 'supports_outdoor', 'supports_studio');
    }
    if (hasAny(haystack, ['頂部照明', 'overhead top light'])) {
      tags.push('overhead', 'supports_indoor', 'supports_outdoor', 'supports_studio');
    }
    if (hasAny(haystack, ['下方反射光', 'upward bounce fill'])) {
      tags.push('soft_light', 'portrait_light', 'reflective', 'supports_indoor', 'supports_outdoor');
    }
    if (hasAny(haystack, ['漫射霧光', 'diffused light wrapping around the subject'])) {
      tags.push('soft_light', 'diffused', 'mist', 'supports_indoor', 'supports_outdoor');
    }
    if (hasAny(haystack, ['硬質晴光', 'hard direct sunlight'])) {
      tags.push('sunlight', 'harsh', 'hard_direct_sun', 'supports_outdoor', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['低光高反差', 'low-key subject lighting'])) {
      tags.push('dark', 'dramatic', 'artificial_light', 'low_key_subject', 'supports_indoor', 'supports_outdoor', 'supports_studio');
    }
    if (hasAny(haystack, ['高調亮光', 'high-key subject lighting'])) {
      tags.push('soft_light', 'studio_light', 'controlled', 'high_key_subject', 'supports_indoor', 'supports_outdoor', 'supports_studio');
    }
    if (hasAny(haystack, ['暖金黃昏色溫', 'warm golden-amber subject light color'])) {
      tags.push('soft_light', 'warm', 'color_temperature', 'supports_indoor', 'supports_outdoor', 'supports_studio', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['冷白日光色溫', 'cool clean daylight color cast on the subject'])) {
      tags.push('soft_light', 'cool', 'color_temperature', 'supports_indoor', 'supports_outdoor', 'supports_studio', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['室內暖白燈色溫', 'warm-white practical-lamp color cast on the subject'])) {
      tags.push('soft_light', 'warm', 'color_temperature', 'indoor', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_commercial', 'supports_studio');
    }
    if (hasAny(haystack, ['冷藍夜色光', 'cool blue night-toned subject light'])) {
      tags.push('cool', 'dark', 'color_temperature', 'night_subject', 'supports_indoor', 'supports_outdoor', 'supports_studio', 'supports_urban', 'supports_subterranean');
    }
    if (hasAny(haystack, ['混合色溫光', 'mixed warm and cool subject lighting'])) {
      tags.push('artificial_light', 'mixed_color', 'supports_indoor', 'supports_outdoor', 'supports_commercial', 'supports_urban', 'supports_subterranean');
    }
    if (hasAny(haystack, ['霓虹染色光', 'neon color spill'])) {
      tags.push('artificial_light', 'neon', 'neon_subject', 'supports_indoor', 'supports_outdoor', 'supports_commercial', 'supports_urban', 'supports_subterranean');
    }
    if (hasAny(haystack, ['窗格投影光', 'window-frame pattern light'])) {
      tags.push('window_light', 'window_projection', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['百葉窗條紋投影光', 'window-blind stripe light'])) {
      tags.push('window_light', 'portrait_light', 'window_projection', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['冷調窗邊輪廓光', 'cool window-side rim light'])) {
      tags.push('backlight', 'portrait_light', 'cool', 'indoor', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['斑駁樹影光', 'dappled leaf-shadow light'])) {
      tags.push('natural_light', 'sunlight', 'dappled_subject_light', 'supports_outdoor', 'supports_natural', 'supports_urban');
    }
    if (hasAny(haystack, ['潮濕反射光', 'wet-surface reflected fill light'])) {
      tags.push('reflective', 'wet_surface', 'outdoor_only', 'supports_outdoor', 'supports_urban');
    }
    if (hasAny(haystack, ['局部暖光', 'local warm practical-light pool'])) {
      tags.push('artificial_light', 'warm', 'supports_indoor', 'supports_hospitality', 'supports_residential', 'supports_commercial');
    }
    if (hasAny(haystack, ['深夜邊緣微光', 'minimal nocturnal rim light'])) {
      tags.push('backlight', 'dark', 'cool', 'night_subject', 'supports_indoor', 'supports_outdoor', 'supports_studio', 'supports_urban', 'supports_subterranean');
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
  if (hasAny(haystack, ['into the distance', 'gazing into distance', 'distant sideward gaze', '望向遠方', '望向遠處', '離鏡'])) tags.push('distance_gaze');
  if (hasAny(haystack, ['looking off to the side', 'sideward gaze', 'sideward attention', '側望', '側看', 'look to the side'])) tags.push('side_gaze');
  if (hasAny(haystack, ['lowered gaze', '低頭', '向下'])) tags.push('downward_gaze');
  if (hasAny(haystack, ['top-down', 'aerial view', '俯拍'])) tags.push('requires_aerial');
  if (category.includes('Special Actions')) {
    tags.push('special_action');
    if (hasAny(haystack, ['social-media self-portrait', 'self-portrait energy', 'mirror selfie', 'boyfriend-perspective', 'best-friend-perspective', '自然自拍', '鏡子自拍', '男友視角', '閨蜜視角'])) {
      minVisibility = 'medium';
      tags.push('social_shooting_action');
    }
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
  if (category.includes('連身') || category.includes('Dresses')) tags.push('dress');
  if (category.includes('褲裝') || category.includes('Pants')) tags.push('pants');
  if (category.includes('裙裝') || category.includes('Skirts')) tags.push('skirt');
  if (category.includes('襪類') || category.includes('Legwear')) tags.push('legwear');
  if (
    category.includes('眼鏡')
    || category.includes('耳環')
    || category.includes('頸部')
    || category.includes('Eyewear')
    || category.includes('Earrings')
    || category.includes('Neck Accessories')
  ) tags.push('accessory_small');
  if (hasAny(haystack, ['no head accessories', 'no eyewear', 'no earrings', 'no neck accessories', '全無'])) tags.push('no_accessory');
  if (hasAny(haystack, ['choker', '頸圈', '頸鍊', '扣環頸鏈'])) tags.push('edgy_accessory');
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

const FACE_ONLY_CLOSEUP_ZH_LABELS = new Set(['臉部特寫', '局部五官特寫', '半臉傾斜特寫']);
const WORM_EYE_ANGLE_LABEL = '蟲眼視角鏡頭';
const WORM_EYE_FORCED_NONE_KEYS = ['styleId', 'lensId', 'opticalEffectId'];
const EFFECTIVE_WARDROBE_LOCK_KEYS = new Set([
  'specialOutfitId',
  'specialOutfitAId',
  'specialOutfitBId',
  'outfitPresetId',
  'outfitPresetAId',
  'outfitPresetBId',
  'dressId',
  'dressAId',
  'dressBId',
  'topId',
  'topAId',
  'topBId',
  'pantsId',
  'pantsAId',
  'pantsBId',
  'skirtId',
  'skirtAId',
  'skirtBId',
  'legwearId',
  'legwearAId',
  'legwearBId',
  'outerwearId',
  'outerwearFitId',
  'outerwearOpeningId',
  'outerwearAId',
  'outerwearAFitId',
  'outerwearAOpeningId',
  'outerwearBId',
  'outerwearBFitId',
  'outerwearBOpeningId',
  'shoesId',
  'shoesAId',
  'shoesBId',
  'headAccessoryId',
  'headAccessoryAId',
  'headAccessoryBId',
  'eyewearId',
  'eyewearColorId',
  'eyewearPlacementId',
  'eyewearAId',
  'eyewearAColorId',
  'eyewearAPlacementId',
  'eyewearBId',
  'eyewearBColorId',
  'eyewearBPlacementId',
  'earringsId',
  'earringsAId',
  'earringsBId',
  'neckAccessoryId',
  'neckAccessoryAId',
  'neckAccessoryBId',
]);
const CLOSEUP_ALWAYS_ALLOWED_KEYS = new Set([
  'subjectCount',
  'aspectRatio',
  'imageTypePresetId',
  'styleId',
  'cameraSystemId',
  'framingId',
  'angleId',
  'orbitId',
  'lensId',
  'apertureId',
  'shutterId',
  'opticalEffectId',
  'lightingId',
  'lightDirectionId',
  'filmId',
  'facialFeaturesId',
  'facialFeaturesAId',
  'facialFeaturesBId',
  'skinDetailsId',
  'skinDetailsAId',
  'skinDetailsBId',
  'hairstyleId',
  'hairstyleAId',
  'hairstyleBId',
  'hairColorId',
  'hairColorAId',
  'hairColorBId',
  'duoExpressionId',
  'expressionId',
  'expressionAId',
  'expressionBId',
  'duoPoseId',
  'duoPoseBaseId',
  'duoInteractionId',
  'poseBaseId',
  'poseArrangementId',
  'poseHandId',
  'posePropId',
  'poseHeadId',
  'poseAnchorId',
  'headAccessoryId',
  'eyewearId',
  'eyewearColorId',
  'eyewearPlacementId',
  'earringsId',
  'headAccessoryAId',
  'eyewearAId',
  'eyewearAColorId',
  'eyewearAPlacementId',
  'earringsAId',
  'headAccessoryBId',
  'eyewearBId',
  'eyewearBColorId',
  'eyewearBPlacementId',
  'earringsBId',
]);
const FACE_ONLY_CLOSEUP_ALLOWED_KEYS = new Set([
  'locationId',
  'specialOutfitId',
  'specialOutfitAId',
  'specialOutfitBId',
  'completeLookPaletteId',
  'completeLookPaletteAId',
  'completeLookPaletteBId',
  'outfitPresetId',
  'outfitPresetColorId',
  'outfitPresetPrimaryColorId',
  'outfitPresetContrastColorId',
  'outfitPresetLockedPaletteId',
  'outfitPresetAId',
  'outfitPresetAColorId',
  'outfitPresetAPrimaryColorId',
  'outfitPresetAContrastColorId',
  'outfitPresetALockedPaletteId',
  'outfitPresetBId',
  'outfitPresetBColorId',
  'outfitPresetBPrimaryColorId',
  'outfitPresetBContrastColorId',
  'outfitPresetBLockedPaletteId',
]);

function isCloseupModeFramingItem(framing) {
  return Boolean(framing?.zh && FACE_ONLY_CLOSEUP_ZH_LABELS.has(framing.zh));
}

function isFaceOnlyCloseupFramingItem(framing) {
  return Boolean(framing?.zh && FACE_ONLY_CLOSEUP_ZH_LABELS.has(framing.zh));
}

function isWormEyeAngleItem(angle) {
  return angle?.zh === WORM_EYE_ANGLE_LABEL;
}

function isWardrobeIncompatibleCloseupFramingItem() {
  return false;
}

function resolveLockControls(controlsOrCustomLibrary = []) {
  const looksLikeControls = Array.isArray(controlsOrCustomLibrary)
    && controlsOrCustomLibrary.length > 0
    && controlsOrCustomLibrary.every((control) => control && typeof control.key === 'string' && Array.isArray(control.options));
  return looksLikeControls ? controlsOrCustomLibrary : getLockControls(controlsOrCustomLibrary);
}

export function isWardrobeIncompatibleCloseupFramingId(framingId, controlsOrCustomLibrary = []) {
  if (!framingId) return false;
  const controls = resolveLockControls(controlsOrCustomLibrary);
  const framingControl = controls.find((control) => control.key === 'framingId');
  const framing = findById(framingControl?.options || [], framingId);
  return isWardrobeIncompatibleCloseupFramingItem(framing);
}

function hasEffectiveWardrobeLockValues(locks, controls) {
  return [...EFFECTIVE_WARDROBE_LOCK_KEYS].some((key) => {
    const value = locks[key];
    if (Array.isArray(value)) {
      return value.some((item) => {
        const control = controls.find((entry) => entry.key === key);
        const selected = control?.options?.find((option) => option.id === item);
        return Boolean(selected && !isNoneLikeItem(selected));
      });
    }
    if (!value) return false;
    const control = controls.find((entry) => entry.key === key);
    const selected = control?.options?.find((option) => option.id === value);
    return Boolean(selected && !isNoneLikeItem(selected));
  });
}

export function hasEffectiveWardrobeLocks(rawLocks = {}, controlsOrCustomLibrary = []) {
  const controls = resolveLockControls(controlsOrCustomLibrary);
  return hasEffectiveWardrobeLockValues(normalizeLocks(rawLocks, controls), controls);
}

export function isCloseupModeFramingId(framingId, controlsOrCustomLibrary = []) {
  if (!framingId) return false;
  const controls = resolveLockControls(controlsOrCustomLibrary);
  const framingControl = controls.find((control) => control.key === 'framingId');
  const framing = findById(framingControl?.options || [], framingId);
  return isCloseupModeFramingItem(framing);
}

export function isWormEyeAngleId(angleId, controlsOrCustomLibrary = []) {
  if (!angleId) return false;
  const controls = resolveLockControls(controlsOrCustomLibrary);
  const angleControl = controls.find((control) => control.key === 'angleId');
  const angle = findById(angleControl?.options || [], angleId);
  return isWormEyeAngleItem(angle);
}

export function getCloseupAllowedKeys(framingId, controlsOrCustomLibrary = []) {
  const controls = resolveLockControls(controlsOrCustomLibrary);
  const framingControl = controls.find((control) => control.key === 'framingId');
  const framing = findById(framingControl?.options || [], framingId);
  const allowed = new Set(CLOSEUP_ALWAYS_ALLOWED_KEYS);
  if (isFaceOnlyCloseupFramingItem(framing)) {
    FACE_ONLY_CLOSEUP_ALLOWED_KEYS.forEach((key) => allowed.add(key));
  }
  return allowed;
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

  if (hasAny(haystack, ['swirly bokeh', 'cat-eye bokeh', 'soap-bubble bokeh', '重散景光斑', '旋渦散景', '貓眼散景', '肥皂泡散景'])) tags.push('bokeh');
  if (hasAny(haystack, ['foreground occlusion', 'foreground obstruction', 'near-field bokeh', '前景遮擋'])) tags.push('foreground_occlusion', 'depth_layering');
  if (hasAny(haystack, ['glass refraction', 'prism refraction', 'split-image', 'refracted', '玻璃前景折射', '稜鏡折射'])) tags.push('refraction_artifact');
  if (hasAny(haystack, ['starburst', 'diffraction spikes', 'highlight stars', '星芒光圈'])) tags.push('light_artifact', 'starburst');
  if (hasAny(haystack, ['lens flare', 'veiling flare', 'ghosting', 'internal lens reflections', '鏡頭光斑'])) tags.push('light_artifact', 'flare_artifact');
  if (hasAny(haystack, ['anamorphic lens flare', 'cylindrical lens', 'horizontal flare', '變形鏡頭光斑'])) tags.push('light_artifact', 'anamorphic_artifact');
  if (hasAny(haystack, ['localized veiling flare', 'matte glare bloom', '局部炫光霧面反差'])) tags.push('light_artifact', 'flare_artifact', 'optical_haze');
  if (hasAny(haystack, ['light leak', 'film-gate leaks', 'exposure burns', '漏光'])) tags.push('analog_artifact', 'light_leak');
  if (hasAny(haystack, ['soft focus', 'diffusion filter', 'lowered microcontrast', '柔焦'])) tags.push('soft_focus', 'diffusion_filter');
  if (hasAny(haystack, ['highlight bloom', 'halation', 'luminance bleeding', '霧化高光'])) tags.push('bloom', 'halation');
  if (hasAny(haystack, ['vignette', 'vignetting', 'frame corners', '暗角'])) tags.push('vignette');
  if (hasAny(haystack, ['chromatic aberration', 'rgb edge fringing', 'color separation', '色差'])) tags.push('chromatic_aberration');
  if (hasAny(haystack, ['edge blur', 'peripheral edge blur', 'field curvature', '邊緣模糊', 'smeared frame edges', 'radial edge stretching', '中央清晰邊緣拉抹'])) tags.push('edge_blur');
  if (hasAny(haystack, ['optical haze', 'lens mist', 'veiling glare', '光學朦朧'])) tags.push('optical_haze', 'diffusion_filter');
  if (hasAny(haystack, ['motion blur', 'light trails'])) tags.push('motion');
  if (hasAny(haystack, ['double exposure'])) tags.push('surreal');
  if (hasAny(haystack, ['bokeh', 'blur circles', 'out-of-focus highlight'])) tags.push('bokeh');

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
  if (category === APERTURE_CATEGORY || category === SHUTTER_CATEGORY) return inferEffectMeta(category, item);
  if (ENVIRONMENT_LIGHT_CATEGORIES.includes(category) || category === LIGHT_STYLE_CATEGORY) {
    return inferLightingMeta(category, item);
  }
  if (category === CAMERA_FILM_CATEGORY) return inferFilmMeta(category, item);
  if (category === OPTICAL_EFFECTS_CATEGORY || category === '特殊效果 (Special Effects)') return inferEffectMeta(category, item);
  return { tags: [] };
}

function stripLeadingColorWords(text = '') {
  return String(text).replace(/^(象牙白|玫瑰粉|酒紅|全黑|黑色|銀色|紅色|棕色|白色|粉色|青綠色|深色|亮面玫瑰粉)/, '');
}

function formatWardrobeOptionDisplayName(category, rawZh) {
  if (!rawZh || rawZh === '全無') return rawZh || '';

  if (category === '套裝 (Outfit Presets)') {
    const name = stripLeadingColorWords(rawZh)
      .replace(/套裝$/g, '')
      .replace(/造型$/g, '')
      .trim();
    return `套裝：${name}`;
  }

  if (category === '連身 (Dresses)') {
    const name = stripLeadingColorWords(rawZh)
      .replace(/連身洋裝/g, '洋裝')
      .replace(/連身造型/g, '造型')
      .trim();
    return `連身：${name}`;
  }

  return rawZh;
}

const WARDROBE_OUTFIT_PRESET_CATEGORY = '套裝 (Outfit Presets)';
const WARDROBE_DRESS_CATEGORY = '連身 (Dresses)';
const WARDROBE_TOP_CATEGORY = '上身 (Tops)';
const WARDROBE_OUTERWEAR_CATEGORY = '外套 (Outerwear)';
const WARDROBE_OUTERWEAR_FIT_CATEGORY = '外套版型 (Outerwear Fit)';
const WARDROBE_OUTERWEAR_OPENING_CATEGORY = '外套開合 (Outerwear Opening)';
const WARDROBE_EYEWEAR_CATEGORY = '眼鏡 (Eyewear)';
const WARDROBE_EYEWEAR_COLOR_CATEGORY = '眼鏡配色 (Eyewear Color)';
const WARDROBE_EYEWEAR_PLACEMENT_CATEGORY = '眼鏡配戴方式 (Eyewear Placement)';
const REGIONAL_STYLE_CATEGORY = '攝影風格';
const CAMERA_FRAMING_CATEGORY = '景別構圖 (Framing)';
const CAMERA_ANGLE_CATEGORY = '相機視角 (Angle)';
const CAMERA_ORBIT_CATEGORY = '拍攝方位 (Orbit Angle)';
const CAMERA_FILM_CATEGORY = '底片與相機模擬 (Camera & Film Simulation)';

const REGIONAL_STYLE_LEGACY_OPTION_MAP = [
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '蜷川實花｜濃烈色彩戲劇感', legacy: [['Mika Ninagawa（蜷川實花）', 0]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '上田義彥｜靜默自然暗調', legacy: [['Yoshihiko Ueda（上田義彥）', 1]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '橫浪修｜群像留白秩序', legacy: [['Osamu Yokonami（橫浪修）', 2]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '川內倫子｜輕盈日常微光', legacy: [['Rinko Kawauchi（川內倫子）', 3]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '石田真澄｜柔亮底片空氣感', legacy: [['Masumi Ishida（石田真澄）', 4]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '市橋織江｜透明自然低飽和', legacy: [['Orie Ichihashi（市橋織江）', 5]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '高橋洋子｜乾爽日光褪色', legacy: [['Yoko Takahashi（高橋ヨーコ）', 6]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '保羅・羅韋爾西｜柔霧高級時裝', legacy: [['Paolo Roversi（保羅・羅韋爾西）', 7]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '艾倫・馮・昂沃斯｜俏皮抓拍雜誌', legacy: [['Ellen von Unwerth（艾倫・馮・昂沃斯）', 8]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '南・戈爾丁｜私人相簿粗粒子', legacy: [['Nan Goldin（南・戈爾丁）', 9]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '尤爾根・特勒｜直閃反精緻', legacy: [['Juergen Teller（尤爾根・特勒）', 10]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '理察・阿維頓｜極簡留白肖像', legacy: [['Richard Avedon（理察・阿維頓）', 11]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '亞歷克・索斯｜寬鬆紀實敘事', legacy: [['Alec Soth（亞歷克・索斯）', 12]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '莎莉・曼｜古典濕版記憶感', legacy: [['Sally Mann（莎莉・曼）', 13]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '沃夫岡・提爾曼斯｜生活切片隨拍', legacy: [['Wolfgang Tillmans（沃夫岡・提爾曼斯）', 14]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '森山大道｜噪訊黑白暗調', legacy: [['Daido Moriyama（森山大道）', 15]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '荒木經惟｜私寫真親密', legacy: [['Nobuyoshi Araki（荒木經惟）', 16]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '篠山紀信｜經典寫真名人肖像', legacy: [['Kishin Shinoyama（篠山紀信）', 17]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '鈴木親｜年輕時尚生活感', legacy: [['Chikashi Suzuki（鈴木親）', 18]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '青山裕企｜青春寫真直接人像', legacy: [['Yuki Aoyama（青山裕企）', 19]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '奧山由之｜青春電影透明敘事', legacy: [['Yuhki Toyama（奧山由之）', 20]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '萊斯利・基｜華麗明星商業感', legacy: [['Leslie Kee（レスリー・キー）', 21]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '細江英公｜戲劇黑白藝術張力', legacy: [['Eikoh Hosoe（細江英公）', 22]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '蓋・布爾丁｜鮮豔敘事時裝', legacy: [['Guy Bourdin（蓋・布爾丁）', 23]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '邁爾斯・奧爾德里奇｜復古濃彩高製作', legacy: [['Miles Aldridge（邁爾斯・奧爾德里奇）', 24]] },
  { category: REGIONAL_STYLE_CATEGORY, targetZh: '艾爾莎・布萊達｜霓虹低光孤寂', legacy: [['Elsa Bleda（艾爾莎·布萊達）', 25]] },
];

const CAMERA_FRAMING_LEGACY_OPTION_MAP = [
  { category: CAMERA_FRAMING_CATEGORY, targetZh: '特寫鏡頭 (Close-Up)', legacy: [['特寫鏡頭 (Close-Up)', 1]] },
  { category: CAMERA_FRAMING_CATEGORY, targetZh: '臉部特寫', legacy: [['臉部特寫', 2]] },
  { category: CAMERA_FRAMING_CATEGORY, targetZh: '胸上特寫', legacy: [['胸上特寫', 3]] },
  { category: CAMERA_FRAMING_CATEGORY, targetZh: '局部五官特寫', legacy: [['局部五官特寫', 4]] },
  { category: CAMERA_FRAMING_CATEGORY, targetZh: '半臉傾斜特寫', legacy: [['半臉傾斜特寫', 5]] },
];

const CAMERA_ANGLE_LEGACY_OPTION_MAP = [
  { category: CAMERA_ANGLE_CATEGORY, targetZh: '平視高度鏡頭', legacy: [['平視角 (Eye-Level Angle)', 1]] },
  { category: CAMERA_ANGLE_CATEGORY, targetZh: '肩部高度鏡頭', legacy: [['肩部高度鏡頭', 2]] },
  { category: CAMERA_ANGLE_CATEGORY, targetZh: '腰部高度鏡頭', legacy: [['腰部高度鏡頭', 3]] },
  { category: CAMERA_ANGLE_CATEGORY, targetZh: '膝蓋高度鏡頭', legacy: [['膝蓋高度鏡頭', 4]] },
  { category: CAMERA_ANGLE_CATEGORY, targetZh: '地面高度鏡頭', legacy: [['地面高度鏡頭', 5], ['仰角 (Low Angle)', 6]] },
  { category: CAMERA_ANGLE_CATEGORY, targetZh: '高位俯視鏡頭', legacy: [['俯角 (High Angle)', 7]] },
];

const CAMERA_ORBIT_LEGACY_OPTION_MAP = [
  { category: CAMERA_ORBIT_CATEGORY, targetZh: '正面 0 度', legacy: [['正面', 1]] },
  { category: CAMERA_ORBIT_CATEGORY, targetZh: '左前 45 度', legacy: [['左前斜側', 2]] },
  { category: CAMERA_ORBIT_CATEGORY, targetZh: '左側 90 度', legacy: [['左側', 3]] },
  { category: CAMERA_ORBIT_CATEGORY, targetZh: '左後 135 度', legacy: [['左後斜側', 4]] },
  { category: CAMERA_ORBIT_CATEGORY, targetZh: '背面 180 度', legacy: [['背面', 5]] },
  { category: CAMERA_ORBIT_CATEGORY, targetZh: '右後 225 度', legacy: [['右後斜側', 6]] },
  { category: CAMERA_ORBIT_CATEGORY, targetZh: '右側 270 度', legacy: [['右側', 7]] },
  { category: CAMERA_ORBIT_CATEGORY, targetZh: '右前 315 度', legacy: [['右前斜側', 8]] },
];

const CAMERA_AMBIENT_LIGHT_RENAME_LEGACY_OPTION_MAP = [
  { category: AMBIENT_LIGHT_CONDITIONS_CATEGORY, targetZh: '城市夜間混合光', legacy: [['夜晚街燈', 11]] },
  { category: AMBIENT_LIGHT_CONDITIONS_CATEGORY, targetZh: '城市高彩度夜色', legacy: [['霓虹夜色', 13]] },
  { category: AMBIENT_LIGHT_CONDITIONS_CATEGORY, targetZh: '室內暖色夜景', legacy: [['室內暖光夜景', 25]] },
  { category: AMBIENT_LIGHT_CONDITIONS_CATEGORY, targetZh: '室內低照度暖色夜景', legacy: [['室內夜晚低照度暖光', 26]] },
  { category: AMBIENT_LIGHT_CONDITIONS_CATEGORY, targetZh: '室內社交暖色夜景', legacy: [['室內派對暖光夜景', 27]] },
  { category: AMBIENT_LIGHT_CONDITIONS_CATEGORY, targetZh: '室內極暖低照度', legacy: [['室內燭光', 28]] },
  { category: AMBIENT_LIGHT_CONDITIONS_CATEGORY, targetZh: '室內冷白環境光', legacy: [['室內冷色人造光', 29]] },
  { category: AMBIENT_LIGHT_CONDITIONS_CATEGORY, targetZh: '室內冷白高亮日常', legacy: [['室內冷白螢光日常', 30]] },
  { category: AMBIENT_LIGHT_CONDITIONS_CATEGORY, targetZh: '室內高彩度色光夜景', legacy: [['室內霓虹夜色', 31]] },
];

const CAMERA_FILM_LEGACY_OPTION_MAP = [
  { category: CAMERA_FILM_CATEGORY, targetZh: '拍立得柔淡即時成像', legacy: [['拍立得效果 (Polaroid Style)', 1]] },
  { category: CAMERA_FILM_CATEGORY, targetZh: '柯達 Portra 暖膚底片', legacy: [['柯達 Portra 400 底片', 2]] },
  { category: CAMERA_FILM_CATEGORY, targetZh: '富士 Superia 青綠陰影底片', legacy: [['富士 Superia 400 底片', 3]] },
  { category: CAMERA_FILM_CATEGORY, targetZh: '復古微對比銳利感', legacy: [['數位微對比紀實感', 4], ['Leica 數位紀實感', 4], ['復古微對比銳利感', 8], ['Contax Zeiss 復古銳利感', 8]] },
  { category: CAMERA_FILM_CATEGORY, targetZh: '富士 Classic Chrome 低彩編輯感', legacy: [['富士 Classic Chrome 電影感', 5]] },
  { category: CAMERA_FILM_CATEGORY, targetZh: '富士 Provia 清透明亮', legacy: [['富士 Provia 清透明亮感', 6]] },
  { category: CAMERA_FILM_CATEGORY, targetZh: '高階黑白灰階', legacy: [['高階黑白灰階', 7]] },
  { category: CAMERA_FILM_CATEGORY, targetZh: 'Leica 風格鹽粒黑白', legacy: [['Leica Monochrom 黑白灰階', 7]] },
  { category: CAMERA_FILM_CATEGORY, targetZh: '暖膚數位人像', legacy: [['暖膚數位人像', 9], ['Canon 暖膚人像感', 9]] },
  { category: CAMERA_FILM_CATEGORY, targetZh: '暖白 JPEG 直出', legacy: [['暖白 JPEG 直出', 10], ['Canon 直出生活感', 10]] },
  { category: CAMERA_FILM_CATEGORY, targetZh: '冷調清晰寫實', legacy: [['冷調清晰寫實', 11], ['Nikon 冷調寫實感', 11]] },
  { category: CAMERA_FILM_CATEGORY, targetZh: '高動態通透明亮', legacy: [['高動態通透明亮', 12], ['Nikon 通透明亮外景感', 12]] },
  { category: CAMERA_FILM_CATEGORY, targetZh: '高銳利快照黑位', legacy: [['高銳利快照黑位', 13], ['Ricoh GR 街頭快照感', 13]] },
  { category: CAMERA_FILM_CATEGORY, targetZh: '中片幅數位色深', legacy: [['中片幅數位色深', 14], ['中片幅數位單眼 (Medium Format DSLR)', 14]] },
  { category: CAMERA_FILM_CATEGORY, targetZh: 'VHS 錄影帶低畫質', legacy: [['VHS 錄影帶低畫質', 15]] },
  { category: CAMERA_FILM_CATEGORY, targetZh: '日系高曝光奶油膚色', legacy: [['韓系冷白亮膚濾鏡', 23]] },
];

const CAMERA_PROFILE_RENDERING_MIGRATIONS = {
  'leica-m-rangefinder': '復古微對比銳利感',
  'ricoh-gr-snapshot': '高銳利快照黑位',
  'fujifilm-x100': '富士 Provia 清透明亮',
  'sony-full-frame-mirrorless': '冷調清晰寫實',
  'canon-nikon-dslr': '暖白 JPEG 直出',
  'digital-medium-format': '中片幅數位色深',
  'drone-camera': '高動態通透明亮',
  'smartphone-documentary': '手機 HDR 直出',
};

const CHARACTER_IDENTITY_LEGACY_OPTION_MAP = [
  { category: '體態 (Body Type)', targetZh: '高挑時裝模特', legacy: [['模特兒', 0]] },
  { category: '體態 (Body Type)', targetZh: '一般基本體型', legacy: [['優雅曲線模特', 1], ['優雅曲線模特兒', 1]] },
  { category: '體態 (Body Type)', targetZh: '柔和沙漏身形', legacy: [['柔和沙漏身形', 2]] },
  { category: '五官特徵 (Facial Features)', targetZh: '韓系偶像臉', legacy: [['KPOP', 1]] },
  { category: '五官特徵 (Facial Features)', targetZh: '日系清透臉', legacy: [['日系透明', 2]] },
  { category: '五官特徵 (Facial Features)', targetZh: '成熟性感臉', legacy: [['性感', 3]] },
  { category: '五官特徵 (Facial Features)', targetZh: '混血立體臉', legacy: [['歐美', 4]] },
  { category: '髮型 (Hairstyle)', targetZh: '帥氣濕亮油頭', legacy: [['短髮｜帥氣濕亮油頭', 1], ['短髮｜精靈短髮', 2]] },
  { category: '髮型 (Hairstyle)', targetZh: '乾淨短鮑伯', legacy: [['短髮｜齊耳法式短鮑伯', 3], ['短髮｜A 字線條鮑伯', 4], ['短髮｜服貼光澤短鮑伯', 5]] },
  { category: '髮型 (Hairstyle)', targetZh: '齊瀏海圓弧鮑伯', legacy: [['短髮｜齊瀏海圓弧鮑伯', 6]] },
  { category: '髮型 (Hairstyle)', targetZh: '不對稱濕感短鮑伯', legacy: [['短髮｜不對稱濕感短鮑伯', 7]] },
  { category: '髮型 (Hairstyle)', targetZh: '復古外翹短髮', legacy: [['短髮｜復古外翹短髮', 8]] },
  { category: '髮型 (Hairstyle)', targetZh: '自然層次鎖骨髮', legacy: [['中長髮｜自然蓬鬆鎖骨髮', 9], ['中長髮｜輕盈層次剪', 13]] },
  { category: '髮型 (Hairstyle)', targetZh: '韓系柔順中長髮', legacy: [['中長髮｜韓系柔順中長髮', 10], ['中長髮｜及肩內彎鮑伯', 11]] },
  { category: '髮型 (Hairstyle)', targetZh: '側分柔波中長髮', legacy: [['中長髮｜側分鎖骨波浪髮', 12]] },
  { category: '髮型 (Hairstyle)', targetZh: '半濕感中長髮', legacy: [['中長髮｜半濕感中長髮', 14]] },
  { category: '髮型 (Hairstyle)', targetZh: '直髮：中分', legacy: [['長髮（放髮）｜中分長直髮', 15]] },
  { category: '髮型 (Hairstyle)', targetZh: '直髮：日式瀏海', legacy: [['長髮（放髮）｜日系厚瀏海長直髮', 16], ['長髮（放髮）｜姬髮式長直髮', 17]] },
  { category: '髮型 (Hairstyle)', targetZh: '柔波：深側分', legacy: [['長髮（放髮）｜韓系深側分柔波長髮', 18]] },
  { category: '髮型 (Hairstyle)', targetZh: '柔波：中分', legacy: [['長髮（放髮）｜中分柔波長髮', 19]] },
  { category: '髮型 (Hairstyle)', targetZh: '濕潤感長波浪', legacy: [['長髮（放髮）｜濕潤感長波浪', 20]] },
  { category: '髮型 (Hairstyle)', targetZh: '柔波：瀏海', legacy: [['長髮（放髮）｜空氣瀏海長捲髮', 21]] },
  { category: '髮型 (Hairstyle)', targetZh: '高位雙馬尾', legacy: [['長髮（綁髮）｜高位雙馬尾', 22]] },
  { category: '髮型 (Hairstyle)', targetZh: '蓬鬆高馬尾', legacy: [['長髮（綁髮）｜蓬鬆高馬尾', 23]] },
  { category: '髮型 (Hairstyle)', targetZh: '低馬尾', legacy: [['長髮（綁髮）｜極簡低馬尾', 24]] },
  { category: '髮型 (Hairstyle)', targetZh: '低包頭盤髮', legacy: [['長髮（綁髮）｜韓系低包頭', 25], ['長髮（綁髮）｜高級感低盤髮', 26]] },
  { category: '髮型 (Hairstyle)', targetZh: '半綁公主頭', legacy: [['長髮（綁髮）｜半綁公主頭長髮', 27]] },
  { category: '髮型 (Hairstyle)', targetZh: '柔和編髮造型', legacy: [['長髮（編髮）｜瀑布編髮', 28], ['長髮（編髮）｜魚骨辮', 29]] },
  { category: '髮色 (Hair Color)', targetZh: '亞麻米棕', legacy: [['亞麻米棕', 7], ['霧灰棕', 10]] },
  { category: '髮色 (Hair Color)', targetZh: '蜂蜜焦糖棕', legacy: [['蜂蜜焦糖棕', 11]] },
  { category: '髮色 (Hair Color)', targetZh: '玫瑰可可棕', legacy: [['玫瑰可可棕', 9], ['銅紅髮', 19]] },
  { category: '髮色 (Hair Color)', targetZh: '淺金髮', legacy: [['黑底金色挑染', 6], ['亮黃色', 15], ['淺金髮', 18]] },
  { category: '髮色 (Hair Color)', targetZh: '銀灰白', legacy: [['灰白色', 17]] },
  { category: '髮色 (Hair Color)', targetZh: '亮桃粉', legacy: [['桃紅色', 13], ['亮紫色', 16]] },
  { category: '髮色 (Hair Color)', targetZh: '寶石藍', legacy: [['寶藍色', 14]] },
  { category: '髮色 (Hair Color)', targetZh: '深森林綠', legacy: [['霧感橄欖棕', 8], ['亮綠色', 12], ['深綠色', 20]] },
];

const CHARACTER_EXPRESSION_POSE_LEGACY_OPTION_MAP = [
  { category: '神情與眼神 (Expression & Gaze)', targetZh: '直視鏡頭｜柔和微笑', legacy: [['直視鏡頭｜清透微笑', 1], ['直視鏡頭｜自信淡笑', 3], ['直視鏡頭｜若有似無微笑', 5]] },
  { category: '神情與眼神 (Expression & Gaze)', targetZh: '直視鏡頭｜平靜淡然', legacy: [['直視鏡頭｜平靜凝視', 2], ['直視鏡頭｜慵懶淡然', 4]] },
  { category: '神情與眼神 (Expression & Gaze)', targetZh: '直視鏡頭｜無辜清透', legacy: [['直視鏡頭｜無辜清透眼神', 6]] },
  { category: '神情與眼神 (Expression & Gaze)', targetZh: '抿唇忍笑｜俏皮', legacy: [['抿唇忍笑｜俏皮輕鬆', 7]] },
  { category: '神情與眼神 (Expression & Gaze)', targetZh: '離鏡凝視｜若有所思', legacy: [['望向遠方｜若有所思', 8], ['側望｜安靜出神', 9]] },
  { category: '神情與眼神 (Expression & Gaze)', targetZh: '低頭垂眼｜內斂', legacy: [['低頭不看鏡頭｜內斂情緒', 10]] },
  { category: '神情與眼神 (Expression & Gaze)', targetZh: '回眸側看｜輕柔注意', legacy: [['回眸側看｜輕柔注意', 11]] },
  { category: '神情與眼神 (Expression & Gaze)', targetZh: '閉眼沉浸', legacy: [['閉眼感受光線｜安靜沉浸', 12]] },
  { category: '神情與眼神 (Expression & Gaze)', targetZh: '大笑｜自然喜悅', legacy: [['大笑｜自然喜悅', 13]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '站姿｜單腳重心', legacy: [['站姿｜單腳重心放鬆站姿', 2]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '站姿｜雙手自然垂放', legacy: [['站姿｜雙手自然垂放站姿', 5]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '站姿｜雙臂交疊', legacy: [['站姿｜雙臂交疊放鬆站姿', 8]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '站姿｜自然站姿', legacy: [['站姿｜低頭側望站姿', 6], ['站姿｜自然自拍姿勢', 9], ['站姿｜鏡子自拍姿勢', 10]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '坐姿｜自然坐姿', legacy: [['坐姿｜自然坐姿', 11], ['坐姿｜低頭坐姿', 18], ['坐姿｜自然自拍姿勢', 21], ['坐姿｜鏡子自拍姿勢', 22]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '坐姿｜微微前傾', legacy: [['坐姿｜微微前傾坐姿', 12]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '坐姿｜雙手後撐', legacy: [['坐姿｜雙手向後支撐坐姿', 13]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '坐姿｜單腿放鬆', legacy: [['坐姿｜單腿放鬆坐姿', 14]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '坐姿｜雙腿自然伸展', legacy: [['坐姿｜雙腿自然伸展坐姿', 15]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '坐姿｜盤腿坐姿', legacy: [['坐姿｜盤腿坐姿', 16]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '坐姿｜側身坐姿', legacy: [['坐姿｜側身坐姿', 17], ['坐姿｜坐姿回頭看鏡頭', 19]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '坐姿｜抱膝坐姿', legacy: [['坐姿｜抱膝坐姿', 20]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '半躺低姿態｜側身半躺', legacy: [['半躺低姿態｜側身半躺姿勢', 23], ['半躺低姿態｜側身半躺回頭看鏡頭', 25], ['半躺低姿態｜半躺低頭姿勢', 26], ['半躺低姿態｜自然自拍姿勢', 32], ['半躺低姿態｜鏡子自拍姿勢', 33]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '半躺低姿態｜正面仰躺', legacy: [['半躺低姿態｜舒適正面仰躺姿勢', 24]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '半躺低姿態｜手撐半躺', legacy: [['半躺低姿態｜手撐上半身半躺姿勢', 27]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '半躺低姿態｜微蜷放鬆', legacy: [['半躺低姿態｜微蜷放鬆姿勢', 28]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '半躺低姿態｜趴姿', legacy: [['半躺低姿態｜趴姿回頭看鏡頭', 29], ['半躺低姿態｜趴姿低頭放鬆', 30]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '半躺低姿態｜側躺延伸', legacy: [['半躺低姿態｜側躺延伸姿勢', 31]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '蹲姿｜自然蹲姿', legacy: [['蹲姿｜自然蹲姿', 35], ['蹲姿｜蹲姿回頭看鏡頭', 38]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '蹲姿｜單膝蹲姿', legacy: [['蹲姿｜單膝蹲姿', 36]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '蹲姿｜手扶膝蓋蹲姿', legacy: [['蹲姿｜手扶膝蓋蹲姿', 37]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '動態｜輕步移動', legacy: [['動態互動｜輕步移動姿勢', 39], ['動態互動｜低頭行進姿勢', 45], ['動態互動｜自然自拍姿勢', 46], ['動態互動｜鏡子自拍姿勢', 47]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '動態｜整理頭髮', legacy: [['站姿｜一手撥髮站姿', 3], ['站姿｜一手撥髮低頭站姿', 4], ['動態互動｜整理頭髮動作', 40]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '動態｜整理衣襬', legacy: [['動態互動｜低頭整理衣襬', 41]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '動態｜抬手整理肩頸', legacy: [['動態互動｜抬手整理肩頸姿勢', 42]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '動態｜回身動作', legacy: [['站姿｜回頭站姿', 7], ['動態互動｜行走中回頭', 34], ['動態互動｜回身側望姿勢', 43]] },
  { category: '姿勢與肢體語言 (Pose & Body Language)', targetZh: '動態｜停步姿勢', legacy: [['動態互動｜停步凝視姿勢', 44]] },
];

const CHARACTER_EXPRESSION_POSE_LEGACY_SOCIAL_POSE_MIGRATIONS = [
  { legacy: ['站姿｜自然自拍姿勢', 9], baseZh: '站姿', arrangementZh: '自然站姿', handZh: '自然自拍' },
  { legacy: ['站姿｜鏡子自拍姿勢', 10], baseZh: '站姿', arrangementZh: '自然站姿', handZh: '鏡子自拍' },
  { legacy: ['坐姿｜自然自拍姿勢', 21], baseZh: '坐姿', arrangementZh: '自然坐姿', handZh: '自然自拍' },
  { legacy: ['坐姿｜鏡子自拍姿勢', 22], baseZh: '坐姿', arrangementZh: '自然坐姿', handZh: '鏡子自拍' },
  { legacy: ['半躺低姿態｜自然自拍姿勢', 32], baseZh: '躺姿', arrangementZh: '側躺', handZh: '自然自拍' },
  { legacy: ['半躺低姿態｜鏡子自拍姿勢', 33], baseZh: '躺姿', arrangementZh: '側躺', handZh: '鏡子自拍' },
  { legacy: ['動態互動｜自然自拍姿勢', 46], baseZh: '站姿', arrangementZh: '自然站姿', handZh: '自然自拍' },
  { legacy: ['動態互動｜鏡子自拍姿勢', 47], baseZh: '站姿', arrangementZh: '自然站姿', handZh: '鏡子自拍' },
].map((entry) => ({
  ...entry,
  legacyId: `character:${slugify('姿勢與肢體語言 (Pose & Body Language)')}:${slugify(entry.legacy[0])}:${entry.legacy[1]}`,
}));

const CHARACTER_LEGACY_SELFIE_SPECIAL_ACTION_MIGRATIONS = [
  { label: '自然自拍感', handZh: '自然自拍' },
  { label: '鏡子自拍', handZh: '鏡子自拍' },
  { label: '男友視角拍攝', handZh: '男友/閨蜜自拍' },
  { label: '閨蜜視角拍攝', handZh: '男友/閨蜜自拍' },
].map((entry, index) => ({
  ...entry,
  legacyId: `character:${slugify('特殊動作 (Special Actions)')}:${slugify(entry.label)}:${index + 24}`,
}));

const CHARACTER_SPECIAL_ACTION_TO_POSE_COMPOSER_MIGRATIONS = [
  { label: '塗口紅', baseZh: '站姿', propZh: '塗口紅｜自由妝感' },
  { label: '塗歪口紅', baseZh: '站姿', propZh: '塗口紅｜自由妝感' },
  { label: '喝冰咖啡', baseZh: '站姿', propZh: '手持冰咖啡' },
  { label: '咬著波板糖', baseZh: '站姿', propZh: '手持波板糖' },
  { label: '抽煙', baseZh: '站姿', propZh: '手持香菸' },
  { label: '整理絲襪', baseZh: '站姿', handZh: '整理下身' },
  { label: '前傾抓住褲腰', baseZh: '站姿', arrangementZh: '上身大幅度前傾', handZh: '雙手抓住褲腰' },
  { label: '側坐單手後撐', baseZh: '坐姿', arrangementZh: '雙腿側放坐姿', handZh: '一手撐地一手放腿上' },
  { label: '抱膝托腮坐姿', baseZh: '坐姿', arrangementZh: '抱膝坐姿', handZh: '雙手扶臉頰' },
  { label: '仰躺雙手微抬', baseZh: '躺姿', arrangementZh: '仰躺', handZh: '雙手放在頭後' },
  { label: '跪坐回眸撩髮', baseZh: '跪姿', arrangementZh: '跪坐', handZh: '單手撩髮', headZh: '越肩回望' },
  { label: '半脫上衣整理肩線', baseZh: '站姿', handZh: '拉下肩線整理上衣' },
  { label: '隨性癱坐在雕花單人絨布沙發上', baseZh: '坐姿', arrangementZh: '隨性癱坐', anchorZh: '坐在單人雕花絨布椅' },
  { label: '趴臥滑手機', baseZh: '躺姿', arrangementZh: '趴臥手肘撐起', propZh: '滑手機' },
  { label: '靠牆站立', baseZh: '站姿', anchorZh: '靠牆' },
  { label: '靠牆坐姿', baseZh: '坐姿', arrangementZh: '雙腿自然伸展', anchorZh: '背靠牆坐在地面' },
  { label: '靠牆後仰站姿', baseZh: '站姿', arrangementZh: '身體微後仰', anchorZh: '靠牆' },
  { label: '靠牆仰躺抬腿', baseZh: '躺姿', arrangementZh: '靠牆仰躺抬腿' },
  { label: '側身斜躺伸腿', baseZh: '躺姿', arrangementZh: '側躺' },
  { label: '跪姿前傾倚靠高背', baseZh: '跪姿', arrangementZh: '前傾跪姿', anchorZh: '倚靠高背椅' },
  { label: '四足跪姿前傾', baseZh: '跪姿', arrangementZh: '四足跪姿' },
  { label: '抱枕俯臥回眸', baseZh: '躺姿', arrangementZh: '抱枕俯臥回眸' },
  { label: '分腿跪坐仰視', baseZh: '跪姿', arrangementZh: '分腿跪坐', handZh: '一手撐地一手放腿上', headZh: '下巴微抬' },
];

const LEGACY_POSE_HAND_TO_PROP_ID = new Map([
  ['hand-apply-lipstick', 'hand-apply-lipstick'],
  ['hand-messy-lipstick', 'hand-apply-lipstick'],
  ['hand-hold-iced-coffee', 'hand-hold-iced-coffee'],
  ['hand-hold-whirly-lollipop', 'hand-hold-whirly-lollipop'],
  ['hand-hold-cigarette', 'hand-hold-cigarette'],
  ['hand-use-phone', 'hand-use-phone'],
]);

const CHARACTER_POSE_TO_POSE_COMPOSER_MIGRATIONS = [
  { label: '站姿｜自然站姿', baseZh: '站姿', arrangementZh: '自然站姿' },
  { label: '站姿｜單腳重心', baseZh: '站姿', arrangementZh: '單腳重心' },
  { label: '站姿｜雙手自然垂放', baseZh: '站姿', arrangementZh: '自然站姿', handZh: '雙手自然垂放' },
  { label: '站姿｜雙臂交疊', baseZh: '站姿', arrangementZh: '自然站姿', handZh: '雙臂交疊' },
  { label: '坐姿｜自然坐姿', baseZh: '坐姿', arrangementZh: '自然坐姿' },
  { label: '坐姿｜微微前傾', baseZh: '坐姿', arrangementZh: '微微前傾' },
  { label: '坐姿｜雙手後撐', baseZh: '坐姿', arrangementZh: '雙手後撐' },
  { label: '坐姿｜單腿放鬆', baseZh: '坐姿', arrangementZh: '單腿放鬆' },
  { label: '坐姿｜雙腿自然伸展', baseZh: '坐姿', arrangementZh: '雙腿自然伸展' },
  { label: '坐姿｜盤腿坐姿', baseZh: '坐姿', arrangementZh: '盤腿坐姿' },
  { label: '坐姿｜側身坐姿', baseZh: '坐姿', arrangementZh: '雙腿側放坐姿' },
  { label: '坐姿｜抱膝坐姿', baseZh: '坐姿', arrangementZh: '抱膝坐姿' },
  { label: '半躺低姿態｜側身半躺', baseZh: '躺姿', arrangementZh: '側躺' },
  { label: '半躺低姿態｜正面仰躺', baseZh: '躺姿', arrangementZh: '仰躺' },
  { label: '半躺低姿態｜手撐半躺', baseZh: '躺姿', arrangementZh: '半躺倚靠', handZh: '一手撐地一手放腿上' },
  { label: '半躺低姿態｜微蜷放鬆', baseZh: '躺姿', arrangementZh: '側躺屈膝' },
  { label: '半躺低姿態｜趴姿', baseZh: '躺姿', arrangementZh: '趴臥' },
  { label: '半躺低姿態｜側躺延伸', baseZh: '躺姿', arrangementZh: '側躺' },
  { label: '蹲姿｜自然蹲姿', baseZh: '蹲姿', arrangementZh: '自然蹲姿' },
  { label: '蹲姿｜單膝蹲姿', baseZh: '蹲姿', arrangementZh: '單膝蹲姿' },
  { label: '蹲姿｜手扶膝蓋蹲姿', baseZh: '蹲姿', arrangementZh: '手扶膝蓋蹲姿' },
  { label: '動態｜輕步移動', baseZh: '站姿', arrangementZh: '一腳向前點地' },
  { label: '動態｜整理頭髮', baseZh: '站姿', arrangementZh: '自然站姿', handZh: '單手撩髮' },
  { label: '動態｜整理衣襬', baseZh: '站姿', arrangementZh: '自然站姿', handZh: '整理下身', headZh: '低頭看向手部' },
  { label: '動態｜抬手整理肩頸', baseZh: '站姿', arrangementZh: '自然站姿', handZh: '單手搭肩', headZh: '頭部微微側傾' },
  { label: '動態｜回身動作', baseZh: '站姿', arrangementZh: '回身轉向', headZh: '回頭朝向鏡頭' },
  { label: '動態｜停步姿勢', baseZh: '站姿', arrangementZh: '膝蓋微彎站姿' },
];

const POSE_COMPOSER_ARRANGEMENT_TO_ANCHOR_MIGRATIONS = [
  { arrangementId: 'sitting-edge-poised', baseZh: '坐姿', anchorZh: '坐在椅緣' },
  { arrangementId: 'sitting-wall-lean', baseZh: '坐姿', arrangementZh: '雙腿自然伸展', anchorZh: '背靠牆坐在地面' },
];

const WARDROBE_LEGACY_OPTION_MAP = [
  { category: WARDROBE_EYEWEAR_CATEGORY, targetZh: '粗框眼鏡', legacy: [['黑框眼鏡', 1], ['白色鏡框眼鏡', 2]] },
  { category: WARDROBE_EYEWEAR_CATEGORY, targetZh: '細框眼鏡', legacy: [['細框眼鏡', 4], ['眼鏡戴在頭頂', 7]] },
  { category: WARDROBE_EYEWEAR_CATEGORY, targetZh: '復古圓框眼鏡', legacy: [['復古圓框眼鏡', 5]] },
  { category: WARDROBE_EYEWEAR_CATEGORY, targetZh: '太陽眼鏡', legacy: [['太陽眼鏡', 6]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '長版襯衫', legacy: [['長版襯衫', 10]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '領帶襯衫', legacy: [['領帶襯衫', 12], ['鬆領帶襯衫', 13]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '落肩 T 恤', legacy: [['落肩 T 恤', 14], ['長版落肩 T 恤', 15]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '短版 T 恤', legacy: [['短版 T 恤', 16]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '棉質細肩背心', legacy: [['棉質細肩背心', 2], ['細肩帶上衣', 6]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '絲質細肩帶上衣', legacy: [['絲質細肩帶上衣', 5]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '削肩針織上衣', legacy: [['削肩針織上衣', 3]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '坦克背心', legacy: [['坦克背心', 31]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '高領針織上衣', legacy: [['高領針織上衣', 7]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '高領連身上衣', legacy: [['高領連身上衣', 8], ['羅紋高領連身上衣', 9]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '長版寬鬆麻花針織毛衣', legacy: [['長版寬鬆麻花針織毛衣', 11]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '短版針織背心', legacy: [['短版針織背心', 17]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '短版蕾絲背心', legacy: [['短版蕾絲背心', 18]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '平口上衣', legacy: [['平口上衣', 19], ['削肩平口連身上衣', 21]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '一字領上衣', legacy: [['一字領上衣', 20]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '絲綢緞面襯衫', legacy: [['絲綢緞面襯衫', 22], ['荷葉袖絲綢襯衫', 23]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '透膚刺繡襯衫', legacy: [['透膚刺繡襯衫', 24], ['柔垂透膚刺繡襯衫', 25]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '網紗透視上衣', legacy: [['網紗透視上衣', 26], ['裝飾網紗上衣', 27], ['透膚蕾絲連身上衣', 40]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '短版吊帶背心', legacy: [['短版吊帶背心', 28]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '短版帽T', legacy: [['短版帽T', 29]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '球衣 / 運動 jersey', legacy: [['球衣 / 運動 jersey', 30]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '維多利亞高領蕾絲襯衫', legacy: [['維多利亞高領蕾絲襯衫', 32]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '雪紡荷葉蝴蝶結襯衫', legacy: [['雪紡荷葉高領蝴蝶結襯衫', 33]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '素色緞面旗袍上衣', legacy: [['素色緞面旗袍上衣', 34]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '精緻刺繡旗袍上衣', legacy: [['精緻刺繡旗袍上衣', 35]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '和服式上衣', legacy: [['和服式上衣', 36]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '浴衣式上衣', legacy: [['浴衣式上衣', 37]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '比基尼上身', legacy: [['比基尼', 41]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '蕾絲胸罩', legacy: [['細肩帶蕾絲胸罩', 42], ['無肩帶蕾絲胸罩', 47]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '運動型內衣', legacy: [['運動型內衣', 43]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '蕾絲睡衣上身', legacy: [['蕾絲緊身睡衣', 44], ['蕾絲寬鬆睡衣', 45]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '波西米亞風上衣', legacy: [['波西米亞風上衣', 46]] },
  { category: WARDROBE_TOP_CATEGORY, targetZh: '全無', legacy: [['漢服式上衣', 38], ['改良漢服式上衣', 39]] },
  { category: WARDROBE_OUTERWEAR_CATEGORY, targetZh: '西裝外套', legacy: [['西裝外套（不扣扣子）', 1]] },
  { category: WARDROBE_OUTERWEAR_CATEGORY, targetZh: '飛行夾克', legacy: [['飛行夾克（敞開穿）', 6]] },
  { category: WARDROBE_OUTERWEAR_CATEGORY, targetZh: '短版皮外套', legacy: [['短版皮外套（不扣）', 7]] },
  { category: WARDROBE_OUTERWEAR_CATEGORY, targetZh: '丹寧外套', legacy: [['丹寧外套（敞開穿）', 8]] },
  { category: WARDROBE_OUTERWEAR_CATEGORY, targetZh: '連帽拉鍊外套', legacy: [['連帽拉鍊外套（不拉拉鍊）', 9]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：鏈條緞面內衣', legacy: [['酒紅鏈條緞面內衣套裝', 1]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：春日巴黎亞麻長褲', legacy: [['象牙白春日巴黎套裝', 4]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：長版襯衫百褶長裙', legacy: [['全黑長版襯衫百褶長裙套裝', 9]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：BDSM 束縛', legacy: [['BDSM 束縛套裝', 17]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：維多利亞古典', legacy: [['維多利亞古典套裝', 18]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：蘿莉塔', legacy: [['蘿莉塔套裝', 19]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：內衣寫真', legacy: [['內衣寫真套裝', 20]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：泳裝度假', legacy: [['泳裝度假套裝', 21]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：素色緞面旗袍', legacy: [['素色緞面旗袍套裝', 22]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：精緻刺繡旗袍', legacy: [['精緻刺繡旗袍套裝', 23]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：經典和服', legacy: [['經典和服套裝', 24]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：輕盈浴衣', legacy: [['輕盈浴衣套裝', 25]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：兔女郎', legacy: [['兔女郎套裝', 28]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：女僕', legacy: [['女僕套裝', 29]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：女僕風荷葉比基尼', legacy: [['女僕風荷葉比基尼套裝', 30]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：短袖女高生水手服', legacy: [['短袖女高生水手服', 31]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：長袖女高生水手服', legacy: [['長袖女高生水手服', 32]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：玫瑰哥德蘿莉塔洋裝', legacy: [['玫瑰哥德蘿莉塔洋裝套裝', 34]] },
  { category: WARDROBE_OUTFIT_PRESET_CATEGORY, targetZh: '套裝：哥德休閒針織荷葉短裙', legacy: [['哥德休閒針織荷葉短裙套裝', 35]] },
  { category: WARDROBE_DRESS_CATEGORY, targetZh: '連身：短版｜無袖迷你洋裝', legacy: [['無袖連身洋裝', 1]] },
  { category: WARDROBE_DRESS_CATEGORY, targetZh: '連身：短版｜細肩帶迷你洋裝', legacy: [['細肩帶連身洋裝', 2]] },
  { category: WARDROBE_DRESS_CATEGORY, targetZh: '連身：長版｜波希米亞罩衫洋裝', legacy: [['波希米亞刺繡蕾絲寬鬆罩衫洋裝', 4]] },
];

const WARDROBE_OUTFIT_TO_DRESS_LEGACY_LOCK_MIGRATIONS = [
  { legacy: ['玫瑰粉乳膠迷你洋裝套裝', 3], dressZh: '連身：短版｜亮面乳膠迷你洋裝' },
  { legacy: ['黑色細節一字領哥德洋裝套裝', 15], dressZh: '連身：短版｜一字領哥德迷你洋裝' },
  { legacy: ['銀色亮面深V掛脖迷你洋裝套裝', 16], dressZh: '連身：短版｜亮面深V掛脖迷你洋裝' },
  { legacy: ['復古雙排釦洋裝套裝', 33], dressZh: '連身：短版｜復古雙排釦迷你洋裝' },
].map((entry) => ({
  ...entry,
  legacyIds: buildWardrobeLegacyIds(WARDROBE_OUTFIT_PRESET_CATEGORY, [entry.legacy]),
}));

function buildWardrobeLegacyIds(category, legacy) {
  return Array.from(new Set(
    legacy.flatMap(([label, index]) => {
      const rawId = `wardrobe:${slugify(category)}:${slugify(label)}:${index}`;
      const displayId = `wardrobe:${slugify(category)}:${slugify(formatWardrobeOptionDisplayName(category, label))}:${index}`;
      return [rawId, displayId];
    })
  ));
}

function buildRegionalLegacyIds(category, legacy) {
  return legacy.map(([label, index]) => `regional:${slugify(category)}:${slugify(label)}:${index}`);
}

function buildCharacterLegacyIds(category, legacy) {
  return legacy.map(([label, index]) => `character:${slugify(category)}:${slugify(label)}:${index}`);
}

function buildCameraLegacyIds(category, legacy) {
  return legacy.map(([label, index]) => `camera:${slugify(category)}:${slugify(label)}:${index}`);
}

function applyWardrobeLegacyOptionIds(catalog) {
  WARDROBE_LEGACY_OPTION_MAP.forEach(({ category, targetZh, legacy }) => {
    const target = getByKey(catalog.wardrobe, category).find((item) => item.zh === targetZh);
    if (!target) return;

    target.legacyIds = Array.from(new Set([
      ...(target.legacyIds || []),
      ...buildWardrobeLegacyIds(category, legacy),
    ]));
  });
}

function applyRegionalLegacyOptionIds(catalog) {
  REGIONAL_STYLE_LEGACY_OPTION_MAP.forEach(({ category, targetZh, legacy }) => {
    const target = getByKey(catalog.regional, category).find((item) => item.zh === targetZh);
    if (!target) return;

    target.legacyIds = Array.from(new Set([...(target.legacyIds || []), ...buildRegionalLegacyIds(category, legacy)]));
  });
}

function applyCharacterLegacyOptionIds(catalog, legacyMap) {
  legacyMap.forEach(({ category, targetZh, legacy }) => {
    const target = getByKey(catalog.character, category).find((item) => item.zh === targetZh);
    if (!target) return;

    target.legacyIds = Array.from(new Set([...(target.legacyIds || []), ...buildCharacterLegacyIds(category, legacy)]));
  });
}

function applyCameraLegacyOptionIds(catalog) {
  [
    ...CAMERA_FRAMING_LEGACY_OPTION_MAP,
    ...CAMERA_ANGLE_LEGACY_OPTION_MAP,
    ...CAMERA_ORBIT_LEGACY_OPTION_MAP,
    ...CAMERA_AMBIENT_LIGHT_RENAME_LEGACY_OPTION_MAP,
  ].forEach(({ category, targetZh, legacy }) => {
    const target = getByKey(catalog.camera, category).find((item) => item.zh === targetZh);
    if (!target) return;

    target.legacyIds = Array.from(new Set([...(target.legacyIds || []), ...buildCameraLegacyIds(category, legacy)]));
  });

  CAMERA_FILM_LEGACY_OPTION_MAP.forEach(({ category, targetZh, legacy }) => {
    const target = getByKey(catalog.camera, category).find((item) => item.zh === targetZh);
    if (!target) return;

    target.legacyIds = Array.from(new Set([...(target.legacyIds || []), ...buildCameraLegacyIds(category, legacy)]));
  });
}

function applyCharacterIdentityLegacyOptionIds(catalog) {
  applyCharacterLegacyOptionIds(catalog, CHARACTER_IDENTITY_LEGACY_OPTION_MAP);
}

function applyCharacterExpressionPoseLegacyOptionIds(catalog) {
  applyCharacterLegacyOptionIds(catalog, CHARACTER_EXPRESSION_POSE_LEGACY_OPTION_MAP);
}

function buildEntries(groupName, groupedData, inferMeta) {
  return Object.entries(groupedData).reduce((acc, [category, items]) => {
    acc[category] = items.map((item, index) => {
      const rawZh = stripMarkdown(item.zh);
      const displayZh = formatWardrobeOptionDisplayName(category, rawZh);
      const legacyId = `${groupName}:${slugify(category)}:${slugify(rawZh || item.en || String(index))}:${index}`;
      const ambientLightLegacyIds = groupName === 'camera' && category === AMBIENT_LIGHT_CONDITIONS_CATEGORY
        ? [`${groupName}:${slugify(LEGACY_ENVIRONMENT_MOOD_CATEGORY)}:${slugify(rawZh || item.en || String(index))}:${index}`]
        : [];
      const normalized = {
        id: `${groupName}:${slugify(category)}:${slugify(displayZh || item.en || String(index))}:${index}`,
        zh: displayZh,
        en: stripMarkdown(item.en),
        desc: stripMarkdown(item.desc),
        legacyIds: Array.from(new Set([
          ...(Array.isArray(item.legacyIds) ? item.legacyIds : []),
          ...ambientLightLegacyIds,
          legacyId,
        ])),
      };

      const inferredMeta = inferMeta(category, normalized);
      const sourceMeta = item.meta && typeof item.meta === 'object' && !Array.isArray(item.meta)
        ? item.meta
        : {};
      const sourceTags = Array.isArray(sourceMeta.tags) ? sourceMeta.tags : [];
      const inferredTags = Array.isArray(inferredMeta.tags) ? inferredMeta.tags : [];

      return {
        ...normalized,
        meta: {
          ...inferredMeta,
          ...sourceMeta,
          tags: withTags([...inferredTags, ...sourceTags]),
        },
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
  applyRegionalLegacyOptionIds(catalog);
  applyWardrobeLegacyOptionIds(catalog);
  applyCharacterIdentityLegacyOptionIds(catalog);
  applyCharacterExpressionPoseLegacyOptionIds(catalog);
  applyCameraLegacyOptionIds(catalog);

  const flatten = (group) => Object.values(group).flat();

  return {
    catalog,
    flatCatalog: {
      regional: [STYLE_NONE_OPTION, ...flatten(catalog.regional)],
      locations: flatten(catalog.locations),
      framing: getByKey(catalog.camera, CAMERA_FRAMING_CATEGORY),
      angle: getByKey(catalog.camera, '相機視角 (Angle)'),
      orbit: getByKey(catalog.camera, '拍攝方位 (Orbit Angle)'),
      lens: getByKey(catalog.camera, FOCAL_LENGTH_CATEGORY),
      aperture: getByKey(catalog.camera, APERTURE_CATEGORY),
      shutter: getByKey(catalog.camera, SHUTTER_CATEGORY),
      lighting: getByKeys(catalog.camera, ENVIRONMENT_LIGHT_CATEGORIES),
      lightDirection: getByKey(catalog.camera, LIGHT_STYLE_CATEGORY),
      film: buildImagingSimulationOptions(getByKey(catalog.camera, CAMERA_FILM_CATEGORY)),
      effects: getByKey(catalog.camera, OPTICAL_EFFECTS_CATEGORY).length > 0 ? getByKey(catalog.camera, OPTICAL_EFFECTS_CATEGORY) : getByKey(catalog.camera, '特殊效果 (Special Effects)'),
      specialOutfits: getByKey(catalog.wardrobe, '特殊穿搭 (Special Outfits)'),
      outfitPresets: [
        OUTFIT_PRESET_NONE_OPTION,
        ...getByKey(catalog.wardrobe, '套裝 (Outfit Presets)'),
        ...getByKey(catalog.wardrobe, '連身 (Dresses)').filter((item) => !isNoneLikeItem(item)),
      ],
    },
    mergedDatabase,
  };
}

function compileEngineRuntime(customLibrary = []) {
  const catalogRuntime = buildCatalog(customLibrary);
  return deepFreezeRuntime({
    ...catalogRuntime,
    controls: buildLockControls(catalogRuntime),
  });
}

const getEngineRuntime = createEngineRuntimeResolver(compileEngineRuntime);

export function getKnowledgeBaseOptions(customLibrary = []) {
  const { mergedDatabase } = getEngineRuntime(customLibrary);

  return CUSTOM_GROUP_OPTIONS.map((groupOption) => ({
    ...groupOption,
    categories: Object.keys(mergedDatabase[groupOption.value] || {}).sort(),
  }));
}

export function getKnowledgeBaseSnapshot(customLibrary = []) {
  const { mergedDatabase } = getEngineRuntime(customLibrary);
  return cloneDatabase(mergedDatabase);
}

export function createEmptyLocks() {
  return Object.fromEntries(
    LOCK_DEFINITIONS.map((definition) => [definition.key, definition.defaultValue ?? (definition.multi ? [] : '')])
  );
}

function getControlOptionByZh(controls, key, zh) {
  return controls.find((control) => control.key === key)?.options?.find((option) => option.zh === zh) || null;
}

function getControlOptionById(controls, key, id) {
  if (!id) return null;
  return controls.find((control) => control.key === key)?.options?.find((option) => option.id === id) || null;
}

function setControlOptionByZhIfInactive(normalizedLocks, controls, key, zh) {
  const option = getControlOptionByZh(controls, key, zh);
  if (!option) return;

  const current = getControlOptionById(controls, key, normalizedLocks[key]);
  if (!normalizedLocks[key] || isNoneLikeItem(current)) {
    normalizedLocks[key] = option.id;
  }
}

function setControlToNone(normalizedLocks, controls, key) {
  const noneOption = getControlOptionByZh(controls, key, '全無');
  normalizedLocks[key] = noneOption?.id || '';
}

function applyDuoInteractionLegacyLockMigration(normalizedLocks, rawLocks, controls) {
  if (normalizedLocks.subjectCount !== '2') return;

  const currentDuoLayout = getControlOptionById(controls, 'duoPoseId', normalizedLocks.duoPoseId);
  if (currentDuoLayout && !isNoneLikeItem(currentDuoLayout)) return;

  const legacyInteractionToLayout = {
    editorial: '時尚雜誌雙人模特兒',
    natural: '日常生活紀錄拍照',
    distance: '相互不認識的兩人擦肩而過',
    'shoulder-lean': '好朋友之間的親密自拍',
    intimate: '親密性感互動',
    'sensual-embrace': '充滿情慾的時尚寫真',
    'leaning-shoulders': '好朋友之間的親密自拍',
    'arm-around-close': '親密性感互動',
    'whispering-close': '親密性感互動',
    'intimate-eye-contact': '親密性感互動',
    'lying-on-back-together': '親密性感互動',
  };
  const targetZh = legacyInteractionToLayout[rawLocks?.duoInteractionId];
  if (!targetZh) return;

  const targetLayout = getControlOptionByZh(controls, 'duoPoseId', targetZh);
  if (targetLayout) normalizedLocks.duoPoseId = targetLayout.id;
}

function applyDuoExpressionLegacyLockMigration(normalizedLocks, rawLocks, controls) {
  if (normalizedLocks.subjectCount !== '2') return;

  const currentDuoExpression = getControlOptionById(controls, 'duoExpressionId', normalizedLocks.duoExpressionId);
  if (currentDuoExpression && !isNoneLikeItem(currentDuoExpression)) return;

  const oldExpressions = [
    getControlOptionById(controls, 'expressionAId', rawLocks?.expressionAId),
    getControlOptionById(controls, 'expressionBId', rawLocks?.expressionBId),
    getControlOptionById(controls, 'expressionId', rawLocks?.expressionId),
  ].filter((item) => item && !isNoneLikeItem(item));
  if (oldExpressions.length === 0) return;

  const oldLabels = oldExpressions.map((item) => item.zh).join(' ');
  const directCount = oldExpressions.filter((item) => item.zh.includes('直視鏡頭')).length;
  let targetZh = '兩人同向離鏡｜沉浸感';

  if (/大笑/.test(oldLabels)) {
    targetZh = '彼此大笑｜自然開心';
  } else if (/微笑|抿唇忍笑|俏皮/.test(oldLabels)) {
    targetZh = '彼此微笑｜柔和默契';
  } else if (/低頭|閉眼/.test(oldLabels)) {
    targetZh = '低眼神互動｜慵懶性感';
  } else if (directCount === oldExpressions.length) {
    targetZh = '兩人直視鏡頭｜平靜自然';
  } else if (directCount > 0) {
    targetZh = '一人看鏡頭｜一人隨性離鏡';
  }

  const targetExpression = getControlOptionByZh(controls, 'duoExpressionId', targetZh);
  if (targetExpression) normalizedLocks.duoExpressionId = targetExpression.id;
}

function applyExpressionPoseLegacySocialLockMigration(normalizedLocks, rawLocks, controls) {
  const migration = CHARACTER_EXPRESSION_POSE_LEGACY_SOCIAL_POSE_MIGRATIONS.find((entry) => entry.legacyId === rawLocks?.poseId);
  if (!migration) return;

  setControlToNone(normalizedLocks, controls, 'poseId');
  setControlToNone(normalizedLocks, controls, 'specialActionId');
  setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseBaseId', migration.baseZh);
  setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseArrangementId', migration.arrangementZh);
  setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseHandId', migration.handZh);
}

function inferPoseComposerBaseZhFromLegacyPose(normalizedLocks, rawLocks, controls) {
  const pose = getControlOptionById(controls, 'poseId', normalizedLocks.poseId)
    || getControlOptionById(controls, 'poseId', rawLocks?.poseId);
  const label = pose?.zh || '';

  if (label.includes('坐姿')) return '坐姿';
  if (label.includes('半躺') || label.includes('躺')) return '躺姿';
  if (label.includes('蹲姿')) return '蹲姿';
  if (label.includes('跪')) return '跪姿';
  return '站姿';
}

function applyLegacySelfieSpecialActionMigration(normalizedLocks, rawLocks, controls) {
  const rawSpecialActionId = rawLocks?.specialActionId || '';
  const migration = CHARACTER_LEGACY_SELFIE_SPECIAL_ACTION_MIGRATIONS.find((entry) => (
    entry.legacyId === rawSpecialActionId || rawSpecialActionId.includes(entry.label)
  ));
  if (!migration) return;

  setControlToNone(normalizedLocks, controls, 'specialActionId');
  setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseBaseId', inferPoseComposerBaseZhFromLegacyPose(normalizedLocks, rawLocks, controls));
  setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseHandId', migration.handZh);
}

function applyPoseArrangementAnchorMigration(normalizedLocks, rawLocks, controls) {
  const migration = POSE_COMPOSER_ARRANGEMENT_TO_ANCHOR_MIGRATIONS.find((entry) => entry.arrangementId === rawLocks?.poseArrangementId);
  if (!migration) return;

  setControlToNone(normalizedLocks, controls, 'poseArrangementId');
  if (migration.baseZh) setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseBaseId', migration.baseZh);
  if (migration.arrangementZh) setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseArrangementId', migration.arrangementZh);
  if (migration.anchorZh) setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseAnchorId', migration.anchorZh);
}

function applySpecialActionPoseComposerMigration(normalizedLocks, rawLocks, controls) {
  const specialAction = getControlOptionById(controls, 'specialActionId', normalizedLocks.specialActionId)
    || getControlOptionById(controls, 'specialActionId', rawLocks?.specialActionId);
  if (!specialAction || isNoneLikeItem(specialAction)) return;

  const migration = CHARACTER_SPECIAL_ACTION_TO_POSE_COMPOSER_MIGRATIONS.find((entry) => entry.label === specialAction.zh);
  setControlToNone(normalizedLocks, controls, 'specialActionId');
  setControlToNone(normalizedLocks, controls, 'poseId');

  if (!migration) return;
  const poseComposerAlreadyActive = [
    'poseArrangementId',
    'poseHandId',
    'posePropId',
    'poseHeadId',
    'poseAnchorId',
  ].some((key) => isActivePoseComposerOption(getControlOptionById(controls, key, normalizedLocks[key])));
  if (poseComposerAlreadyActive) return;

  if (migration.baseZh) setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseBaseId', migration.baseZh);
  if (migration.arrangementZh) setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseArrangementId', migration.arrangementZh);
  if (migration.handZh) setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseHandId', migration.handZh);
  if (migration.propZh) setControlOptionByZhIfInactive(normalizedLocks, controls, 'posePropId', migration.propZh);
  if (migration.headZh) setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseHeadId', migration.headZh);
  if (migration.anchorZh) setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseAnchorId', migration.anchorZh);
}

function applyLegacyPoseHandPropMigration(normalizedLocks, rawLocks, controls) {
  const targetPropId = LEGACY_POSE_HAND_TO_PROP_ID.get(rawLocks?.poseHandId);
  if (!targetPropId) return;

  const selectedProp = getControlOptionById(controls, 'posePropId', normalizedLocks.posePropId);
  if (!isActivePoseComposerOption(selectedProp)) {
    const targetProp = getControlOptionById(controls, 'posePropId', targetPropId);
    if (targetProp) normalizedLocks.posePropId = targetProp.id;
  }
  setControlToNone(normalizedLocks, controls, 'poseHandId');
}

function applyPosePropHandExclusivity(normalizedLocks, controls) {
  const selectedProp = getControlOptionById(controls, 'posePropId', normalizedLocks.posePropId);
  if (!isActivePoseComposerOption(selectedProp)) return;
  setControlToNone(normalizedLocks, controls, 'poseHandId');
}

function applyPoseIdPoseComposerMigration(normalizedLocks, rawLocks, controls) {
  const pose = getControlOptionById(controls, 'poseId', normalizedLocks.poseId)
    || getControlOptionById(controls, 'poseId', rawLocks?.poseId);
  if (!pose || isNoneLikeItem(pose)) return;

  setControlToNone(normalizedLocks, controls, 'poseId');

  if (normalizedLocks.subjectCount !== '1') return;

  const migration = CHARACTER_POSE_TO_POSE_COMPOSER_MIGRATIONS.find((entry) => entry.label === pose.zh);
  if (!migration) return;

  if (migration.baseZh) setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseBaseId', migration.baseZh);
  if (migration.arrangementZh) setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseArrangementId', migration.arrangementZh);
  if (migration.handZh) setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseHandId', migration.handZh);
  if (migration.headZh) setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseHeadId', migration.headZh);
  if (migration.anchorZh) setControlOptionByZhIfInactive(normalizedLocks, controls, 'poseAnchorId', migration.anchorZh);
}

function isSelfiePoseHandOption(option) {
  return Boolean(option?.meta?.tags?.includes('selfie_hand_pose'));
}

function applySelfiePoseHandOrbitLock(normalizedLocks, controls) {
  const poseHand = getControlOptionById(controls, 'poseHandId', normalizedLocks.poseHandId);
  if (!isSelfiePoseHandOption(poseHand)) return;

  setControlToNone(normalizedLocks, controls, 'orbitId');
}

function characterUsesResolvedSelfiePoseHand(character = []) {
  const poseComposer = character.find((item) => item?.meta?.tags?.includes('pose_composer'));
  const poseHand = getPoseComposerOption(POSE_COMPOSER_HAND_OPTIONS, poseComposer?.meta?.poseHandId);
  return isSelfiePoseHandOption(poseHand);
}

function applyOutfitPresetToDressLegacyLockMigration(normalizedLocks, rawLocks, controls) {
  const mappings = [
    { outfitKey: 'outfitPresetId', dressKey: 'dressId' },
    { outfitKey: 'outfitPresetAId', dressKey: 'dressAId' },
    { outfitKey: 'outfitPresetBId', dressKey: 'dressBId' },
  ];

  mappings.forEach(({ outfitKey, dressKey }) => {
    const rawValue = rawLocks?.[outfitKey];
    const migration = WARDROBE_OUTFIT_TO_DRESS_LEGACY_LOCK_MIGRATIONS.find((entry) => entry.legacyIds.includes(rawValue));
    if (!migration) return;

    const outfitNone = getControlOptionByZh(controls, outfitKey, '全無');
    if (outfitNone) normalizedLocks[outfitKey] = outfitNone.id;

    const targetDress = getControlOptionByZh(controls, dressKey, migration.dressZh);
    const currentDress = getControlOptionById(controls, dressKey, normalizedLocks[dressKey]);
    if (targetDress && (!normalizedLocks[dressKey] || isNoneLikeItem(currentDress))) {
      normalizedLocks[dressKey] = targetDress.id;
    }
  });
}

const LEGACY_EYEWEAR_LOCK_MIGRATIONS = [
  { legacy: ['黑框眼鏡', 1], frameZh: '粗框眼鏡', colorZh: '黑色', placementZh: '正常戴在臉上' },
  { legacy: ['白色鏡框眼鏡', 2], frameZh: '粗框眼鏡', colorZh: '白色', placementZh: '正常戴在臉上' },
  { legacy: ['玳瑁色鏡框眼鏡', 3], frameZh: '粗框眼鏡', colorZh: '玳瑁色', placementZh: '正常戴在臉上' },
  { legacy: ['細框眼鏡', 4], frameZh: '細框眼鏡', placementZh: '正常戴在臉上' },
  { legacy: ['復古圓框眼鏡', 5], frameZh: '復古圓框眼鏡', placementZh: '正常戴在臉上' },
  { legacy: ['太陽眼鏡', 6], frameZh: '太陽眼鏡', colorZh: '黑色', placementZh: '正常戴在臉上' },
  { legacy: ['眼鏡戴在頭頂', 7], frameZh: '細框眼鏡', placementZh: '戴在頭頂' },
].map((entry) => ({
  ...entry,
  legacyIds: buildWardrobeLegacyIds(WARDROBE_EYEWEAR_CATEGORY, [entry.legacy]),
}));

function applyEyewearLegacyLockMigration(normalizedLocks, rawLocks, controls) {
  const mappings = [
    { frameKey: 'eyewearId', colorKey: 'eyewearColorId', placementKey: 'eyewearPlacementId' },
    { frameKey: 'eyewearAId', colorKey: 'eyewearAColorId', placementKey: 'eyewearAPlacementId' },
    { frameKey: 'eyewearBId', colorKey: 'eyewearBColorId', placementKey: 'eyewearBPlacementId' },
  ];

  mappings.forEach(({ frameKey, colorKey, placementKey }) => {
    const rawValue = rawLocks?.[frameKey];
    const migration = LEGACY_EYEWEAR_LOCK_MIGRATIONS.find((entry) => entry.legacyIds.includes(rawValue));
    if (!migration) return;

    const frame = getControlOptionByZh(controls, frameKey, migration.frameZh);
    if (frame) normalizedLocks[frameKey] = frame.id;

    const color = migration.colorZh ? getControlOptionByZh(controls, colorKey, migration.colorZh) : null;
    if (color) normalizedLocks[colorKey] = color.id;

    const placement = getControlOptionByZh(controls, placementKey, migration.placementZh);
    if (placement) normalizedLocks[placementKey] = placement.id;
  });
}

const LEGACY_OUTERWEAR_OPENING_LOCK_MIGRATIONS = [
  { legacy: ['西裝外套（不扣扣子）', 1], openingZh: '不扣扣子' },
  { legacy: ['飛行夾克（敞開穿）', 6], openingZh: '敞開穿' },
  { legacy: ['短版皮外套（不扣）', 7], openingZh: '不扣扣子' },
  { legacy: ['丹寧外套（敞開穿）', 8], openingZh: '敞開穿' },
  { legacy: ['連帽拉鍊外套（不拉拉鍊）', 9], openingZh: '不拉拉鍊' },
].map((entry) => ({
  ...entry,
  legacyIds: buildWardrobeLegacyIds(WARDROBE_OUTERWEAR_CATEGORY, [entry.legacy]),
}));

function applyOuterwearOpeningLegacyLockMigration(normalizedLocks, rawLocks, controls) {
  const mappings = [
    { outerwearKey: 'outerwearId', openingKey: 'outerwearOpeningId' },
    { outerwearKey: 'outerwearAId', openingKey: 'outerwearAOpeningId' },
    { outerwearKey: 'outerwearBId', openingKey: 'outerwearBOpeningId' },
  ];

  mappings.forEach(({ outerwearKey, openingKey }) => {
    const rawValue = rawLocks?.[outerwearKey];
    const migration = LEGACY_OUTERWEAR_OPENING_LOCK_MIGRATIONS.find((entry) => entry.legacyIds.includes(rawValue));
    if (!migration) return;

    const opening = getControlOptionByZh(controls, openingKey, migration.openingZh);
    const currentOpening = getControlOptionById(controls, openingKey, normalizedLocks[openingKey]);
    if (opening && (!normalizedLocks[openingKey] || isNoneLikeItem(currentOpening))) {
      normalizedLocks[openingKey] = opening.id;
    }
  });
}

export function normalizeLocks(rawLocks = {}, controls = getLockControls()) {
  const normalized = createEmptyLocks();

  Object.entries(rawLocks || {}).forEach(([key, value]) => {
    if (!LOCK_KEYS.has(key)) return;
    normalized[key] = value;
  });

  const legacyDedicatedSubject = ALL_DEDICATED_SUBJECT_OPTIONS.find((option) => option.id === rawLocks?.subjectCount && !isNoneLikeItem(option));
  if (legacyDedicatedSubject) {
    if (legacyDedicatedSubject.specialSubject === 'character-profile') {
      normalized.characterProfileId = legacyDedicatedSubject.id;
      normalized.specialSubjectId = 'none';
    } else {
      normalized.specialSubjectId = legacyDedicatedSubject.id;
      normalized.characterProfileId = 'none';
    }
    normalized.subjectCount = '1';
  }

  const legacyCharacterProfile = getCharacterProfileOption(rawLocks?.specialSubjectId);
  if (legacyCharacterProfile) {
    normalized.characterProfileId = legacyCharacterProfile.id;
    normalized.specialSubjectId = 'none';
    normalized.subjectCount = '1';
  }

  if (!normalized.filmId && normalized.cameraSystemId && CAMERA_PROFILE_OPTION_IDS.has(normalized.cameraSystemId)) {
    normalized.filmId = normalized.cameraSystemId;
  }

  const migrateCameraProfileToRendering = (profileId) => {
    const targetZh = CAMERA_PROFILE_RENDERING_MIGRATIONS[profileId];
    return targetZh ? getControlOptionByZh(controls, 'filmId', targetZh) : null;
  };
  const migratedRendering = migrateCameraProfileToRendering(normalized.filmId);
  if (migratedRendering) {
    normalized.filmId = migratedRendering.id;
    normalized.cameraSystemId = '';
  }

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
      '耳罩式耳機（戴在頭上）': 'headAccessoryId',
      '耳罩式耳機（掛在脖子上）': 'headAccessoryId',
      '有線耳機': 'headAccessoryId',
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
    };
    const { catalog } = getEngineRuntime();
    legacyJewelry.forEach((legacyId) => {
      const legacyItem = Object.values(catalog.wardrobe).flat().find((item) => item.id === legacyId);
      const targetKey = legacyMap[legacyItem?.zh];
      if (!targetKey || normalized[targetKey]) return;
      normalized[targetKey] = legacyId;
    });
  }

  const normalizedWithLegacyColors = normalizeLegacyOutfitPresetColors(normalized);
  controls.forEach((control) => {
    if (!Array.isArray(control.options) || control.options.length === 0) return;
    const optionIds = new Set(control.options.map((option) => option.id));
    const currentValue = normalizedWithLegacyColors[control.key];

    if (control.multi) {
      normalizedWithLegacyColors[control.key] = Array.isArray(currentValue)
        ? currentValue.filter((item) => optionIds.has(item))
        : [];
      return;
    }

    if (!currentValue || optionIds.has(currentValue)) return;

    const legacyMatchedOption = control.options.find((option) => Array.isArray(option.legacyIds) && option.legacyIds.includes(currentValue));
    if (legacyMatchedOption) {
      normalizedWithLegacyColors[control.key] = legacyMatchedOption.id;
      return;
    }

    const noneOption = control.options.find((option) => option.zh === '全無');
    normalizedWithLegacyColors[control.key] = noneOption
      ? noneOption.id
      : (control.defaultValue ?? '');
  });

  applyDuoInteractionLegacyLockMigration(normalizedWithLegacyColors, rawLocks, controls);
  applyDuoExpressionLegacyLockMigration(normalizedWithLegacyColors, rawLocks, controls);
  applyExpressionPoseLegacySocialLockMigration(normalizedWithLegacyColors, rawLocks, controls);
  applyLegacySelfieSpecialActionMigration(normalizedWithLegacyColors, rawLocks, controls);
  applyPoseArrangementAnchorMigration(normalizedWithLegacyColors, rawLocks, controls);
  applySpecialActionPoseComposerMigration(normalizedWithLegacyColors, rawLocks, controls);
  applyPoseIdPoseComposerMigration(normalizedWithLegacyColors, rawLocks, controls);
  applyLegacyPoseHandPropMigration(normalizedWithLegacyColors, rawLocks, controls);
  applyPosePropHandExclusivity(normalizedWithLegacyColors, controls);
  applyOutfitPresetToDressLegacyLockMigration(normalizedWithLegacyColors, rawLocks, controls);
  applyEyewearLegacyLockMigration(normalizedWithLegacyColors, rawLocks, controls);
  applyOuterwearOpeningLegacyLockMigration(normalizedWithLegacyColors, rawLocks, controls);
  applySelfiePoseHandOrbitLock(normalizedWithLegacyColors, controls);

  return normalizedWithLegacyColors;
}

export function sanitizeLocksForCloseupMode(rawLocks = {}, controls = []) {
  const activeControls = controls.length > 0 ? controls : getLockControls();
  // Compatibility export: close-up controls may be disabled in the UI, but
  // their normalized source values must remain available to storage, restore,
  // selection snapshots, and the uncropped full-body reference renderer.
  const nextLocks = normalizeLocks(rawLocks, activeControls);
  const angle = nextLocks.angleId ? findById(activeControls.find((control) => control.key === 'angleId')?.options || [], nextLocks.angleId) : null;
  if (isWormEyeAngleItem(angle)) {
    WORM_EYE_FORCED_NONE_KEYS.forEach((key) => {
      const noneOption = activeControls.find((control) => control.key === key)?.options?.find((option) => option.zh === '全無');
      nextLocks[key] = noneOption ? noneOption.id : '';
    });
  }
  return nextLocks;
}

function buildLockControls({ flatCatalog, catalog }) {
  return LOCK_DEFINITIONS.map((definition) => {
    let options = definition.options || [];

    if (!definition.options) {
      if (definition.key === 'styleId') options = flatCatalog.regional;
      if (definition.key === 'locationId') options = flatCatalog.locations;
      if (definition.key === 'framingId') options = flatCatalog.framing;
      if (definition.key === 'angleId') options = flatCatalog.angle;
      if (definition.key === 'orbitId') options = flatCatalog.orbit;
      if (definition.key === 'lensId') options = flatCatalog.lens;
      if (definition.key === 'apertureId') options = flatCatalog.aperture;
      if (definition.key === 'shutterId') options = flatCatalog.shutter;
      if (definition.key === 'opticalEffectId') options = flatCatalog.effects;
      if (definition.key === 'lightingId') options = flatCatalog.lighting;
      if (definition.key === 'lightDirectionId') options = flatCatalog.lightDirection;
      if (definition.key === 'filmId') options = flatCatalog.film;
      if (definition.key === 'specialOutfitId') options = prependRandomOption(flatCatalog.specialOutfits, WARDROBE_RANDOM_OPTIONS.specialOutfit);
      if (definition.key === 'specialOutfitAId') options = prependRandomOption(flatCatalog.specialOutfits, WARDROBE_RANDOM_OPTIONS.specialOutfit);
      if (definition.key === 'specialOutfitBId') options = prependRandomOption(flatCatalog.specialOutfits, WARDROBE_RANDOM_OPTIONS.specialOutfit);
      if (definition.key === 'outfitPresetId') options = prependRandomOption(flatCatalog.outfitPresets, WARDROBE_RANDOM_OPTIONS.outfitPreset);
      if (definition.key === 'outfitPresetAId') options = prependRandomOption(flatCatalog.outfitPresets, WARDROBE_RANDOM_OPTIONS.outfitPreset);
      if (definition.key === 'outfitPresetBId') options = prependRandomOption(flatCatalog.outfitPresets, WARDROBE_RANDOM_OPTIONS.outfitPreset);
      if (['bodyTypeId', 'bodyTypeAId', 'bodyTypeBId'].includes(definition.key)) options = getByKey(catalog.character, '體態 (Body Type)');
      if (definition.key === 'facialFeaturesId') options = getByKey(catalog.character, '五官特徵 (Facial Features)');
      if (definition.key === 'facialFeaturesAId') options = getByKey(catalog.character, '五官特徵 (Facial Features)');
      if (definition.key === 'facialFeaturesBId') options = getByKey(catalog.character, '五官特徵 (Facial Features)');
      if (['skinDetailsId', 'skinDetailsAId', 'skinDetailsBId'].includes(definition.key)) options = getByKey(catalog.character, '膚質特徵 (Skin Details)');
      if (definition.key === 'hairstyleId') options = getByKey(catalog.character, '髮型 (Hairstyle)');
      if (definition.key === 'hairstyleAId') options = getByKey(catalog.character, '髮型 (Hairstyle)');
      if (definition.key === 'hairstyleBId') options = getByKey(catalog.character, '髮型 (Hairstyle)');
      if (definition.key === 'hairColorId') options = getByKey(catalog.character, '髮色 (Hair Color)');
      if (definition.key === 'hairColorAId') options = getByKey(catalog.character, '髮色 (Hair Color)');
      if (definition.key === 'hairColorBId') options = getByKey(catalog.character, '髮色 (Hair Color)');
      if (definition.key === 'expressionId') options = getByKey(catalog.character, '神情與眼神 (Expression & Gaze)');
      if (definition.key === 'expressionAId') options = getByKey(catalog.character, '神情與眼神 (Expression & Gaze)');
      if (definition.key === 'expressionBId') options = getByKey(catalog.character, '神情與眼神 (Expression & Gaze)');
      if (definition.key === 'poseId') options = getByKey(catalog.character, '姿勢與肢體語言 (Pose & Body Language)');
      if (definition.key === 'specialActionId') options = getByKey(catalog.character, '特殊動作 (Special Actions)');
      if (['topId', 'topAId', 'topBId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '上身 (Tops)');
      if (['topPatternId', 'topAPatternId', 'topBPatternId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '上身圖案 (Top Surface Design)');
      if (['dressId', 'dressAId', 'dressBId'].includes(definition.key)) options = prependRandomOption(getByKey(catalog.wardrobe, '連身 (Dresses)'), WARDROBE_RANDOM_OPTIONS.dress);
      if (['pantsId', 'pantsAId', 'pantsBId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '褲裝 (Pants)');
      if (['skirtId', 'skirtAId', 'skirtBId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '裙裝 (Skirts)');
      if (['bottomPatternId', 'bottomAPatternId', 'bottomBPatternId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '下身圖案 (Bottom Surface Design)');
      if (['legwearId', 'legwearAId', 'legwearBId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '襪類 (Legwear)');
      if (['outerwearId', 'outerwearAId', 'outerwearBId'].includes(definition.key)) options = getByKey(catalog.wardrobe, WARDROBE_OUTERWEAR_CATEGORY);
      if (['outerwearFitId', 'outerwearAFitId', 'outerwearBFitId'].includes(definition.key)) options = getByKey(catalog.wardrobe, WARDROBE_OUTERWEAR_FIT_CATEGORY);
      if (['outerwearPatternId', 'outerwearAPatternId', 'outerwearBPatternId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '外套圖案 (Outerwear Surface Design)');
      if (['outerwearOpeningId', 'outerwearAOpeningId', 'outerwearBOpeningId'].includes(definition.key)) options = getByKey(catalog.wardrobe, WARDROBE_OUTERWEAR_OPENING_CATEGORY);
      if (['outerwearStylingId', 'outerwearAStylingId', 'outerwearBStylingId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '外套穿法 (Outerwear Styling)');
      if (['shoesId', 'shoesAId', 'shoesBId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '鞋款 (Shoes)');
      if (['headAccessoryId', 'headAccessoryAId', 'headAccessoryBId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '頭部配件 (Head Accessories)');
      if (['eyewearId', 'eyewearAId', 'eyewearBId'].includes(definition.key)) options = getByKey(catalog.wardrobe, WARDROBE_EYEWEAR_CATEGORY);
      if (['eyewearColorId', 'eyewearAColorId', 'eyewearBColorId'].includes(definition.key)) options = getByKey(catalog.wardrobe, WARDROBE_EYEWEAR_COLOR_CATEGORY);
      if (['eyewearPlacementId', 'eyewearAPlacementId', 'eyewearBPlacementId'].includes(definition.key)) options = getByKey(catalog.wardrobe, WARDROBE_EYEWEAR_PLACEMENT_CATEGORY);
      if (['earringsId', 'earringsAId', 'earringsBId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '耳環 (Earrings)');
      if (['neckAccessoryId', 'neckAccessoryAId', 'neckAccessoryBId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '頸部 (Neck Accessories)');
    }

    return { ...definition, options };
  });
}

export function getLockControls(customLibrary = []) {
  return getEngineRuntime(customLibrary).controls;
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
  const label = location?.zh || '';
  if (label.startsWith('室內')) return { indoor: true, outdoor: false };
  if (label.startsWith('戶外')) return { indoor: false, outdoor: true };

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

function getSceneAttributeOption(id) {
  return SCENE_ATTRIBUTE_OPTIONS.find((option) => option.id === id) || null;
}

function getTopFitOption(id) {
  return TOP_FIT_OPTIONS.find((option) => option.id === id) || null;
}

function getTopStylingOption(id) {
  return TOP_STYLING_OPTIONS.find((option) => option.id === id) || null;
}

function getBottomFitOption(id) {
  return BOTTOM_FIT_OPTIONS.find((option) => option.id === id) || null;
}

function getBottomRiseOption(id) {
  return BOTTOM_RISE_OPTIONS.find((option) => option.id === id) || null;
}

function createSyntheticWardrobeModifier(token, option) {
  if (!option) return null;
  return {
    ...option,
    id: `wardrobe:${token}:${option.id}`,
    meta: { ...(option.meta || {}), syntheticWardrobeModifier: true },
  };
}

function normalizeWardrobePromptText(value) {
  return stripMarkdown(value || '').replace(/\s+/g, ' ').trim();
}

function appendWardrobePromptSearchAlias(item, text) {
  if (!text) return '';
  const aliases = [];
  if (item?.zh === '牛仔短裙' && !/denim short skirt/i.test(text)) aliases.push('denim short skirt');
  if (item?.zh === '高跟鞋' && !/high heels/i.test(text)) aliases.push('high heels');
  return aliases.length > 0 ? `${text}, ${aliases.join(', ')}` : text;
}

function buildTopColoredPrompt(topItem, color = null, { pattern = null, fit = null, styling = null } = {}) {
  if (!topItem || isNoneLikeItem(topItem)) return '';
  const base = normalizeWardrobePromptText(topItem.en);
  if (!base) return '';

  const fitText = fit && !isNoneLikeItem(fit) ? normalizeWardrobePromptText(fit.en) : '';
  const stylingText = styling && !isNoneLikeItem(styling) ? normalizeWardrobePromptText(styling.en) : '';
  const patternText = pattern && !isNoneLikeItem(pattern) ? normalizeWardrobePromptText(pattern.en) : '';
  const coloredBase = color && !isNoneLikeItem(color) ? `${color.en} ${base}` : base;

  return [fitText, stylingText, coloredBase, patternText].filter(Boolean).join(', ');
}

function buildOuterwearColoredPrompt(outerwearItem, color = null, { fit = null, pattern = null, opening = null, styling = null, minimalStyling = false } = {}) {
  if (!outerwearItem || isNoneLikeItem(outerwearItem)) return '';
  const base = normalizeWardrobePromptText(outerwearItem.en);
  if (!base) return '';

  const fitText = fit && !isNoneLikeItem(fit) ? normalizeWardrobePromptText(fit.en) : '';
  const stylingText = buildOuterwearStylingLeadText(styling, { minimal: minimalStyling });
  const patternText = pattern && !isNoneLikeItem(pattern) ? normalizeWardrobePromptText(pattern.en) : '';
  const openingText = opening && !isNoneLikeItem(opening) ? normalizeWardrobePromptText(opening.en) : '';
  const coloredBase = color && !isNoneLikeItem(color) ? `${color.en} ${base}` : base;

  return [fitText, coloredBase, patternText, openingText, stylingText].filter(Boolean).join(', ');
}

function buildTopWardrobePrompt(wardrobeSlots, wardrobeColors) {
  return buildTopColoredPrompt(wardrobeSlots.top, wardrobeColors.topColor, {
    pattern: wardrobeSlots.topPattern,
    fit: wardrobeSlots.topFit,
    styling: wardrobeSlots.topStyling,
  });
}

function buildOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors) {
  return buildOuterwearColoredPrompt(wardrobeSlots.outerwear, wardrobeColors.outerwearColor, {
    fit: wardrobeSlots.outerwearFit,
    pattern: wardrobeSlots.outerwearPattern,
    opening: wardrobeSlots.outerwearOpening,
    styling: wardrobeSlots.outerwearStyling,
  });
}

function buildRoleTopWardrobePrompt(wardrobeSlots, wardrobeColors, role) {
  const suffix = role === 'a' ? 'A' : 'B';
  return buildTopColoredPrompt(wardrobeSlots[`top${suffix}`], wardrobeColors[`top${suffix}Color`], {
    pattern: wardrobeSlots[`top${suffix}Pattern`],
    fit: wardrobeSlots[`topFit${suffix}`],
    styling: wardrobeSlots[`topStyling${suffix}`],
  });
}

function buildRoleOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors, role) {
  const suffix = role === 'a' ? 'A' : 'B';
  return buildOuterwearColoredPrompt(wardrobeSlots[`outerwear${suffix}`], wardrobeColors[`outerwear${suffix}Color`], {
    fit: wardrobeSlots[`outerwear${suffix}Fit`],
    pattern: wardrobeSlots[`outerwear${suffix}Pattern`],
    opening: wardrobeSlots[`outerwear${suffix}Opening`],
    styling: wardrobeSlots[`outerwear${suffix}Styling`],
  });
}

function isPantsWardrobeItem(item) {
  return item?.id?.includes('wardrobe:褲裝-pants:');
}

function getApplicableBottomRise(bottomItem, rise) {
  if (!rise || isNoneLikeItem(rise)) return null;
  if (rise.id?.includes('unbuttoned-slightly-unzipped') && !isPantsWardrobeItem(bottomItem)) return null;
  return rise;
}

function buildBottomColoredPrompt(bottomItem, color = null, { pattern = null, fit = null, rise = null } = {}) {
  if (!bottomItem || isNoneLikeItem(bottomItem)) return '';
  const base = appendWardrobePromptSearchAlias(bottomItem, normalizeWardrobePromptText(bottomItem.en));
  if (!base) return '';

  const riseText = normalizeWardrobePromptText(getApplicableBottomRise(bottomItem, rise)?.en);
  const fitText = fit && !isNoneLikeItem(fit) ? normalizeWardrobePromptText(fit.en) : '';
  const patternText = pattern && !isNoneLikeItem(pattern) ? normalizeWardrobePromptText(pattern.en) : '';
  const coloredBase = color && !isNoneLikeItem(color) ? `${color.en} ${base}` : base;

  return [riseText, fitText, coloredBase, patternText].filter(Boolean).join(', ');
}

function buildBottomWardrobePrompt(bottomItem, wardrobeSlots, wardrobeColors) {
  return buildBottomColoredPrompt(bottomItem, wardrobeColors.bottomColor, {
    pattern: wardrobeSlots.bottomPattern,
    fit: wardrobeSlots.bottomFit,
    rise: wardrobeSlots.bottomRise,
  });
}

function buildRoleBottomWardrobePrompt(bottomItem, wardrobeSlots, wardrobeColors, role) {
  const suffix = role === 'a' ? 'A' : 'B';
  return buildBottomColoredPrompt(bottomItem, wardrobeColors[`bottom${suffix}Color`], {
    pattern: wardrobeSlots[`bottom${suffix}Pattern`],
    fit: wardrobeSlots[`bottomFit${suffix}`],
    rise: wardrobeSlots[`bottomRise${suffix}`],
  });
}

function locationMatchesSceneAttribute(location, sceneAttribute) {
  if (!sceneAttribute?.id) return true;

  const flags = getLocationEnvironmentFlags(location);

  if (sceneAttribute.id === 'indoor') return flags.indoor;
  if (sceneAttribute.id === 'outdoor') return flags.outdoor;
  if (sceneAttribute.id === 'other') return location.meta.tags.includes('other_scene');

  return true;
}

function getFixedCompositionSetOption(id) {
  return FIXED_COMPOSITION_SET_OPTIONS.find((option) => option.id === id) || FIXED_COMPOSITION_SET_OPTIONS[0];
}

function isFixedCompositionSetActive(item) {
  return Boolean(item && !isNoneLikeItem(item));
}

function fixedCompositionSetAllowsCameraVariation(item) {
  return isFixedCompositionSetActive(item) && item.allowsCameraVariation !== false;
}

function fixedSetScopedOptionMatchesSet(option, fixedSetRef) {
  if (!fixedSetRef || option.id === 'none') return true;
  const fixedSet = typeof fixedSetRef === 'string' ? getFixedCompositionSetOption(fixedSetRef) : fixedSetRef;
  const fixedSetId = fixedSet?.id || (typeof fixedSetRef === 'string' ? fixedSetRef : '');
  if (!fixedSetId || option.setId === fixedSetId) return true;
  if (Array.isArray(option.setIds) && option.setIds.includes(fixedSetId)) return true;
  return Boolean(option.setGroupId && fixedSet?.setGroupId && option.setGroupId === fixedSet.setGroupId);
}

function fixedSetPositionMatchesSet(position, fixedSetRef) {
  return fixedSetScopedOptionMatchesSet(position, fixedSetRef);
}

function getFixedSetPositionOption(id, fixedSetRef) {
  const item = FIXED_SET_POSITION_OPTIONS.find((option) => option.id === id) || FIXED_SET_POSITION_OPTIONS[0];
  return fixedSetPositionMatchesSet(item, fixedSetRef) ? item : FIXED_SET_POSITION_OPTIONS[0];
}

function getFixedSetBackgroundStateOption(id, fixedSetRef) {
  const item = FIXED_SET_BACKGROUND_STATE_OPTIONS.find((option) => option.id === id) || FIXED_SET_BACKGROUND_STATE_OPTIONS[0];
  return fixedSetScopedOptionMatchesSet(item, fixedSetRef) ? item : FIXED_SET_BACKGROUND_STATE_OPTIONS[0];
}

function getFixedSetCaptureModeOption(id) {
  return FIXED_SET_CAPTURE_MODE_OPTIONS.find((option) => option.id === id) || FIXED_SET_CAPTURE_MODE_OPTIONS[0];
}

function getFixedSetPerformanceStateOption(id) {
  return FIXED_SET_PERFORMANCE_STATE_OPTIONS.find((option) => option.id === id) || FIXED_SET_PERFORMANCE_STATE_OPTIONS[0];
}

function isFixedSetSelfShotMode(captureMode) {
  return Boolean(captureMode?.meta?.tags?.includes('fixed_set_self_shot'));
}

function buildFixedSetIntegrityText(fixedSet, captureMode) {
  if (!fixedSet || isNoneLikeItem(fixedSet)) return '';
  const sharedStructureText = fixedSet.sharedStructureEn || FIXED_COMPOSITION_SHARED_STRUCTURE_EN;
  const integrityText = fixedSet.integrityEn || '';
  const scaleGuardText = fixedSet.scaleGuardEn || '';
  const replacementGuardText = fixedSet.replacementGuardEn || 'avoid unrelated scene';
  const readabilityText = isFixedSetSelfShotMode(captureMode)
    ? 'self-shot crops may hide set parts, but at least one selected anchor must remain readable'
    : 'keep selected anchors readable as stable scene architecture';

  return [sharedStructureText, integrityText, scaleGuardText, readabilityText, replacementGuardText].filter(Boolean).join('; ');
}

function getLightingEnvironmentFlags(lighting) {
  const tags = new Set(lighting?.meta?.tags || []);
  if (tags.has('ambient_outdoor')) return { indoor: false, outdoor: true, studio: false };
  if (tags.has('ambient_studio')) return { indoor: true, outdoor: false, studio: true };
  if (tags.has('ambient_indoor')) return { indoor: true, outdoor: false, studio: false };

  const explicitlyIndoor = hasAnyTag(tags, [
    'indoor',
    'supports_indoor',
    'supports_studio',
    'supports_residential',
    'supports_hospitality',
    'supports_heritage',
    'supports_commercial',
    'supports_subterranean',
    'window_light',
    'studio_light',
  ]);
  const explicitlyOutdoor = hasAnyTag(tags, [
    'supports_outdoor',
    'supports_urban',
    'supports_natural',
  ]);

  const indoor = explicitlyIndoor;
  const outdoor = explicitlyOutdoor || (!explicitlyIndoor && hasAnyTag(tags, [
    'sunlight',
    'rain',
    'dusk',
    'mist',
    'night_ambient',
  ]));

  return { indoor, outdoor, studio: tags.has('studio_light') || tags.has('stage_light') };
}

function getLightDirectionEnvironmentFlags(lightDirection) {
  const tags = new Set(lightDirection?.meta?.tags || []);
  const explicitlyIndoor = hasAnyTag(tags, [
    'indoor',
    'supports_indoor',
    'window_light',
    'supports_residential',
    'supports_hospitality',
    'supports_heritage',
    'supports_studio',
    'supports_commercial',
  ]);
  const explicitlyOutdoor = hasAnyTag(tags, [
    'supports_outdoor',
    'supports_urban',
    'supports_natural',
  ]);

  const indoor = explicitlyIndoor || (!explicitlyOutdoor && hasAnyTag(tags, ['portrait_light', 'overhead', 'backlight']));
  const outdoor = explicitlyOutdoor || (!explicitlyIndoor && hasAnyTag(tags, ['backlight', 'overhead']));

  return { indoor, outdoor };
}

function lightingMatchesSceneAttribute(lighting, sceneAttribute) {
  if (!sceneAttribute?.id || !lighting || lighting.zh === '全無') return true;
  const flags = getLightingEnvironmentFlags(lighting);

  if (sceneAttribute.id === 'indoor') return flags.indoor;
  if (sceneAttribute.id === 'outdoor') return flags.outdoor;
  return true;
}

function lightDirectionMatchesSceneAttribute(lightDirection, sceneAttribute) {
  if (!sceneAttribute?.id || !lightDirection || lightDirection.zh === '全無') return true;
  const flags = getLightDirectionEnvironmentFlags(lightDirection);

  if (sceneAttribute.id === 'indoor') return flags.indoor;
  if (sceneAttribute.id === 'outdoor') return flags.outdoor;
  return true;
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
  if (lightTags.has('studio_scene_only') && !locTags.has('studio_lighting_scene')) {
    return false;
  }
  if ((locTags.has('underground') || locTags.has('subterranean')) && !lightTags.has('indoor') && (lightTags.has('day') || lightTags.has('sunlight') || lightTags.has('clean_sky') || lightTags.has('cloudy') || lightTags.has('dusk') || lightTags.has('night_ambient'))) {
    return false;
  }
  if (lightTags.has('ambient_outdoor') && locationEnvironment.indoor && !locationEnvironment.outdoor) {
    return false;
  }
  if ((lightTags.has('ambient_indoor') || lightTags.has('ambient_studio')) && locationEnvironment.outdoor && !locationEnvironment.indoor) {
    return false;
  }
  if (locationEnvironment.indoor && !locationEnvironment.outdoor && !lightTags.has('indoor') && (lightTags.has('day') || lightTags.has('sunlight') || lightTags.has('clean_sky') || lightTags.has('cloudy') || lightTags.has('dusk') || lightTags.has('night_ambient'))) {
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

function lightDirectionSupportsAmbientLight(lightDirection, lighting) {
  if (!lighting || isNoneLikeItem(lighting) || !lightDirection || isNoneLikeItem(lightDirection)) return true;

  const directionTags = new Set(lightDirection.meta.tags);
  const lightingTags = new Set(lighting?.meta?.tags || []);
  const ambientIsOutdoor = lightingTags.has('ambient_outdoor');
  const ambientIsIndoor = lightingTags.has('ambient_indoor');
  const ambientIsStudio = lightingTags.has('ambient_studio') || lightingTags.has('studio_light') || lightingTags.has('stage_light');
  const ambientIsWetOrCloudy = hasAnyTag(lightingTags, ['rain', 'cloudy', 'mist', 'pre_rain_sky']);
  const ambientIsDarkOrNight = hasAnyTag(lightingTags, ['dark', 'night_ambient']);
  const ambientIsDaySun = hasAnyTag(lightingTags, ['day', 'sunlight', 'clean_sky', 'summer_sky']);

  if (ambientIsWetOrCloudy && directionTags.has('sunlight')) return false;
  if (ambientIsDarkOrNight && directionTags.has('hard_direct_sun')) return false;
  if (ambientIsDarkOrNight && directionTags.has('high_key_subject') && !ambientIsStudio) return false;
  if (ambientIsDarkOrNight && directionTags.has('window_projection')) return false;
  if (ambientIsDaySun && ambientIsOutdoor && directionTags.has('night_subject')) return false;

  if (ambientIsStudio && (
    directionTags.has('natural_light') ||
    directionTags.has('sunlight') ||
    directionTags.has('window_light') ||
    directionTags.has('outdoor_only') ||
    directionTags.has('wet_surface') ||
    directionTags.has('dappled_subject_light')
  )) {
    return false;
  }

  if (ambientIsOutdoor && directionTags.has('window_light')) return false;
  if (ambientIsIndoor && !ambientIsStudio && directionTags.has('outdoor_only')) return false;
  if (lightingTags.has('window_light') && directionTags.has('sunlight')) return false;
  if (lightingTags.has('window_light') && directionTags.has('neon_subject')) return false;
  if (lightingTags.has('neon') && directionTags.has('window_light')) return false;
  if (lightingTags.has('stage_light') && !directionTags.has('artificial_light') && !directionTags.has('dark') && !directionTags.has('overhead') && !directionTags.has('backlight')) return false;

  return true;
}

function lightDirectionSupportsScene(lightDirection, framing, location, lighting) {
  const directionTags = new Set(lightDirection.meta.tags);
  const locationTags = new Set(location?.meta?.tags || []);
  const lightingTags = new Set(lighting?.meta?.tags || []);
  const locationEnvironment = location ? getLocationEnvironmentFlags(location) : { indoor: false, outdoor: false };
  const directionEnvironment = getLightDirectionEnvironmentFlags(lightDirection);

  if (!lightDirectionSupportsAmbientLight(lightDirection, lighting)) return false;
  if (!location) return true;

  if (directionTags.has('portrait_light') && !visibilityAtLeast(framing.meta.visibility, 'medium')) return false;
  if (directionTags.has('outdoor_only') && locationEnvironment.indoor && !locationEnvironment.outdoor) return false;
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

function getWaterPoseSceneType(location) {
  if (!location || isNoneLikeItem(location)) return '';

  const tags = new Set(location.meta?.tags || []);
  const haystack = toHaystack(location.zh || '', location.en || '', location.desc || '');
  const hasWaterfrontContext = tags.has('waterfront') || hasAny(haystack, [
    'poolside',
    'swimming pool',
    'beach',
    'shoreline',
    'waterline',
    'seawater',
    'cove',
    '泳池',
    '海灘',
    '海岸線',
    '海灣',
    '淺灘',
    '水線',
  ]);
  if (!hasWaterfrontContext) return '';

  if (hasAny(haystack, ['poolside', 'swimming pool', 'resort pool', 'pool edge', '泳池'])) return 'pool';
  if (hasAny(haystack, ['rocky', 'cove', 'rock ledge', 'rock wall', 'cliff', 'coastal rock', '岩岸', '岩洞', '海灣', '淺灘'])) return 'cove';
  if (hasAny(haystack, ['beach', 'sandy', 'wet sand', 'wave line', 'receding wave', '海灘', '沙灘', '浪線'])) return 'beach';
  return '';
}

function isWaterPoseLocation(location) {
  return Boolean(getWaterPoseSceneType(location));
}

function poseComposerAnchorAllowedByScene(option, location, lockedLocationId = '') {
  if (!option?.meta?.requiresWaterScene) return true;
  if (!lockedLocationId) return false;
  return isWaterPoseLocation(location);
}

function getScenePoseAnchorOptions(location, lockedLocationId = '') {
  return POSE_COMPOSER_ANCHOR_OPTIONS.filter((option) => poseComposerAnchorAllowedByScene(option, location, lockedLocationId));
}

export function getSceneDependentOptions(customLibrary = [], rawLocks = {}) {
  const runtime = getEngineRuntime(customLibrary);
  const locks = normalizeLocks(rawLocks);
  const fallbackFraming = runtime.flatCatalog.framing.find((item) => item.en.includes('medium shot')) || runtime.flatCatalog.framing[0];
  const sceneAttribute = getSceneAttributeOption(locks.sceneAttributeId);
  const locationOptions = runtime.flatCatalog.locations.filter((item) => locationMatchesSceneAttribute(item, sceneAttribute));
  const location = findById(locationOptions, locks.locationId);
  const selectedLighting = findById(runtime.flatCatalog.lighting, locks.lightingId);
  const framing = findById(runtime.flatCatalog.framing, locks.framingId) || fallbackFraming;

  const lightingOptions = runtime.flatCatalog.lighting.filter((item) => {
    if (item.zh === '全無') return true;
    if (!lightingMatchesSceneAttribute(item, sceneAttribute)) return false;
    return location ? locationSupportsLighting(location, item) : true;
  });

  const lightingForDirection = selectedLighting && lightingOptions.some((item) => item.id === selectedLighting.id) ? selectedLighting : null;

  const lightDirectionOptions = runtime.flatCatalog.lightDirection.filter((item) => {
    if (item.zh === '全無') return true;
    if (!lightDirectionMatchesSceneAttribute(item, sceneAttribute)) return false;
    return lightDirectionSupportsScene(item, framing, location, lightingForDirection);
  });

  const poseAnchorOptions = getScenePoseAnchorOptions(location, locks.locationId);

  return { locationOptions, lightingOptions, lightDirectionOptions, poseAnchorOptions };
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
  const framingTags = new Set(framing.meta.tags || []);

  if (angleTags.has('aerial') && VISIBILITY_ORDER[framing.meta.visibility] >= VISIBILITY_ORDER.medium) return false;
  if ((framingTags.has('partial_face') || framingTags.has('full_face_tight')) && (angleTags.has('low_angle') || angleTags.has('low_camera_height') || angleTags.has('high_angle') || angleTags.has('aerial'))) return false;

  return true;
}

function framingSupportsOrbit(framing, orbit) {
  const framingTags = new Set(framing.meta.tags || []);
  const orbitTags = new Set(orbit.meta.tags || []);

  if (framingTags.has('partial_face')) {
    if (orbitTags.has('back_view') || orbitTags.has('rear_three_quarter') || orbitTags.has('front_view')) return false;
  }

  if (framingTags.has('full_face_tight') && (orbitTags.has('back_view') || orbitTags.has('rear_three_quarter'))) return false;

  return true;
}

function expressionSupportsComposition(item, context) {
  const expressionTags = item.meta?.tags || [];
  if (!visibilityAtLeast(context.framing.meta.visibility, item.meta?.minVisibility || 'medium')) return false;
  if (expressionTags.includes('direct_gaze') && context.angle.meta.tags.includes('aerial')) return false;
  if (expressionTags.includes('requires_aerial') && !context.angle.meta.tags.includes('aerial')) return false;
  if (expressionTags.includes('direct_gaze') && context.orbit && !orbitSupportsExpression(context.orbit, item)) return false;
  if (context.orbit?.meta.tags.includes('back_view') && (expressionTags.includes('side_gaze') || expressionTags.includes('distance_gaze'))) return false;
  return true;
}

function angleSupportsExpression(angle, expression) {
  if (!expression) return true;
  const expressionTags = expression.meta?.tags || [];
  if (expressionTags.includes('direct_gaze') && angle.meta.tags.includes('aerial')) return false;
  if (expressionTags.includes('requires_aerial') && !angle.meta.tags.includes('aerial')) return false;
  return true;
}

function orbitSupportsExpression(orbit, expression) {
  if (!expression) return true;
  const orbitTags = new Set(orbit.meta?.tags || []);
  const expressionTags = new Set(expression.meta?.tags || []);

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

  if (actionTags.has('social_shooting_action')) return true;

  if (actionTags.has('face_action')) {
    if (orbitTags.has('back_view') || orbitTags.has('rear_three_quarter')) return false;
  }

  if (actionTags.has('full_body_action') || actionTags.has('leg_focus_action')) {
    if (orbitTags.has('back_view')) return false;
  }

  return true;
}

function getActiveActionPoseCard(context) {
  if (!context?.locks?.actionPoseCardId) return null;
  if (context.subject?.count !== 1 || isDedicatedSpecialSubject(context.subject)) return null;

  const card = getActionPoseCardById(context.locks.actionPoseCardId);
  return card?.mode === 'single' ? card : null;
}

function buildActionPoseItem(context) {
  const card = getActiveActionPoseCard(context);
  if (!card) return null;

  return {
    id: `character:動作姿勢-action-pose:${card.id}`,
    zh: card.title,
    en: card.actionPrompt,
    meta: {
      ...(card.meta || {}),
      tags: withTags(card.meta?.tags || ['action_pose', 'full_body_action']),
      actionPoseCardId: card.id,
      expressionPrompt: card.expressionPrompt,
      negativePoseGuard: card.negativePoseGuard,
      framingHint: card.framingHint,
      minVisibility: card.meta?.minVisibility || 'full',
    },
  };
}

function getPoseComposerActionConstraint(locks = {}) {
  const options = [
    getPoseComposerOption(POSE_COMPOSER_ARRANGEMENT_OPTIONS, locks.poseArrangementId),
    getPoseComposerOption(POSE_COMPOSER_HAND_OPTIONS, locks.poseHandId),
    getPoseComposerOption(POSE_COMPOSER_PROP_OPTIONS, locks.posePropId),
    getPoseComposerOption(POSE_COMPOSER_ANCHOR_OPTIONS, locks.poseAnchorId),
  ].filter((option) => option && isActivePoseComposerOption(option) && !isRandomOption(option));
  const tags = withTags(options.flatMap((option) => option.meta?.tags || []));
  const actionTags = tags.filter((tag) => (
    tag === 'prop_action'
    || tag === 'face_action'
    || tag === 'leg_focus_action'
    || tag === 'large_prop_action'
    || tag === 'wardrobe_action'
    || tag === 'full_body_action'
    || tag === 'social_shooting_action'
  ));

  if (actionTags.length === 0) return null;

  return {
    zh: options.map((option) => option.zh).join(' + '),
    en: options.map((option) => option.en).join(', '),
    meta: { tags: actionTags },
  };
}

function mergeActionConstraints(...actions) {
  const activeActions = actions.filter((action) => action && !isNoneLikeItem(action));
  if (activeActions.length === 0) return null;

  return {
    zh: activeActions.map((action) => action.zh).join(' + '),
    en: activeActions.map((action) => action.en).join(', '),
    meta: { tags: withTags(activeActions.flatMap((action) => action.meta?.tags || [])) },
  };
}

function isSocialShootingAction(action) {
  return Boolean(action?.meta?.tags?.includes('social_shooting_action'));
}

function detailAllowed(item, framing) {
  return visibilityAtLeast(framing.meta.visibility, item.meta.minVisibility);
}

function isOutdoorLocationContext(context) {
  if (context.sceneAttribute?.id === 'outdoor') return true;
  const locationTags = new Set(context.location?.meta?.tags || []);
  return locationTags.has('outdoor') || locationTags.has('natural') || locationTags.has('waterfront') || locationTags.has('green_space');
}

function poseSupportsLocationContext(item, context) {
  if (!item || isNoneLikeItem(item)) return true;
  if (!isOutdoorLocationContext(context)) return true;

  const poseText = toHaystack(item.zh, item.en, item.desc);
  return !hasAny(poseText, ['mirror selfie', '鏡子自拍']);
}

function getSubjectOption(id) {
  return SUBJECT_COUNT_OPTIONS.find((option) => option.id === id) || SUBJECT_COUNT_OPTIONS[0];
}

function getSpecialSubjectOption(id) {
  const option = SPECIAL_SUBJECT_OPTIONS.find((entry) => entry.id === id);
  return option && !isNoneLikeItem(option) ? option : null;
}

function getCharacterProfileOption(id) {
  const option = CHARACTER_PROFILE_OPTIONS.find((entry) => entry.id === id);
  return option && !isNoneLikeItem(option) ? option : null;
}

function getRuntimeCharacterCards() {
  return getCharacterCardOptions(getLockControls());
}

function normalizeCharacterCardWardrobeMode(value) {
  return value === 'selected-layers' ? 'selected-layers' : 'full-default';
}

function getCharacterCardWardrobeMode(locks = {}) {
  return normalizeCharacterCardWardrobeMode(locks?.characterCardWardrobeMode);
}

function shouldImportCharacterCardWardrobeLayers(locks = {}) {
  return getCharacterCardWardrobeMode(locks) !== 'full-default';
}

function getCharacterCardVariantFromLocks(locks) {
  const runtimeCards = getRuntimeCharacterCards();
  const card = runtimeCards.find((entry) => entry.id === locks.characterProfileId);
  const fullDefaultLayers = card ? Object.keys(card.defaultWardrobeLayers) : [];
  const wardrobeMode = getCharacterCardWardrobeMode(locks);
  return normalizeCharacterCardVariant({
    characterProfileId: locks.characterProfileId,
    hairVariantId: locks.characterCardHairVariantId,
    eyewearMode: locks.characterCardEyewearMode,
    includedWardrobeLayers: wardrobeMode === 'full-default' ? fullDefaultLayers : locks.characterCardWardrobeLayerIds,
    promptOverrideText: String(locks.characterCardPromptOverride || '').trim(),
    outputMode: wardrobeMode === 'full-default' || (Array.isArray(locks.characterCardWardrobeLayerIds) && locks.characterCardWardrobeLayerIds.length > 0)
      ? 'included-wardrobe'
      : 'pure-character',
  }, runtimeCards);
}

function buildCharacterCardHairVariantText(subject, locks) {
  if (!isCharacterProfileSubject(subject)) return '';
  const card = getRuntimeCharacterCards().find((entry) => entry.id === subject.id);
  const variant = getCharacterCardVariantFromLocks({ ...(locks || {}), characterProfileId: subject.id });
  const hairVariant = getCompatibleHairVariants(card).find((entry) => entry.id === variant.hairVariantId);
  const promptOverride = String(variant.promptOverrideText || '').trim();
  const hairText = !hairVariant || hairVariant.id === 'default' ? '' : hairVariant.prompt;
  return [hairText, promptOverride].filter(Boolean).join(', ');
}

function getCharacterCardImportedLayers(subject, locks) {
  if (!isCharacterProfileSubject(subject)) return [];
  if (!shouldImportCharacterCardWardrobeLayers(locks)) return [];
  const card = getRuntimeCharacterCards().find((entry) => entry.id === subject.id);
  if (!card) return [];
  const variant = getCharacterCardVariantFromLocks(locks || {});
  const layerMap = getEffectiveCharacterCardWardrobeLayers(card, variant);
  const included = new Set(variant.includedWardrobeLayers || []);
  return CHARACTER_CARD_LAYER_KEYS
    .filter((key) => included.has(key) && layerMap[key])
    .map((key) => {
      const layer = layerMap[key];
      return {
        id: `character-card-layer:${subject.id}:${key}`,
        zh: `來自角色卡｜${layer.label}`,
        en: layer.prompt,
        desc: layer.prompt,
        meta: { characterCardLayer: key },
      };
    });
}

function buildCharacterCardSubjectPrompt(subject, locks = {}, context = null, wardrobe = null) {
  if (!isCharacterProfileSubject(subject)) return subject?.en || '';
  const hairVariantText = buildCharacterCardHairVariantText(subject, locks);
  const groups = buildCharacterCardProfileGroups(subject, locks, wardrobe);
  const identityAnchors = groups.distinctiveFeatures
    ? `permanent identity anchors: ${groups.distinctiveFeatures}`
    : '';
  const projectedOutfit = filterCompleteLookPromptForFraming(groups.outfit, context);
  const projectedAccessories = filterCompleteLookPromptForFraming(groups.accessories, context);
  if (!shouldImportCharacterCardWardrobeLayers(locks)) {
    if (isCompleteWardrobeProjection(getCompositionVisibilityProjection(context))) {
      return [subject.en, identityAnchors, hairVariantText].filter(Boolean).join(', ');
    }
    return [
      groups.identityAndBody,
      identityAnchors,
      groups.hair,
      hairVariantText,
      projectedOutfit ? `signature outfit locked as a ${projectedOutfit}` : '',
      projectedAccessories,
      groups.photographicDirection,
    ].filter(Boolean).join(', ');
  }

  const hairText = [groups.hair, hairVariantText].filter(Boolean).join(', ');
  const outfitText = projectedOutfit ? `selected character-card outfit layer: ${projectedOutfit}` : '';
  return [
    groups.identityAndBody,
    identityAnchors,
    hairText,
    outfitText,
    projectedAccessories,
    groups.photographicDirection,
  ].filter(Boolean).join(', ');
}

const CHARACTER_CARD_WARDROBE_CONFLICT_TOKENS = {
  top: [
    'wardrobe:上身-tops:',
    'wardrobe:上身版型-top-fit:',
    'wardrobe:上身穿法-top-styling:',
    'wardrobe:上身圖案-top-surface-design:',
  ],
  bottom: [
    'wardrobe:褲裝-pants:',
    'wardrobe:裙裝-skirts:',
    'wardrobe:下身版型-bottom-fit:',
    'wardrobe:下身腰線-bottom-rise:',
    'wardrobe:下身圖案-bottom-surface-design:',
  ],
  dress: [
    'wardrobe:連身-dresses:',
    'wardrobe:上身-tops:',
    'wardrobe:上身版型-top-fit:',
    'wardrobe:上身穿法-top-styling:',
    'wardrobe:上身圖案-top-surface-design:',
    'wardrobe:褲裝-pants:',
    'wardrobe:裙裝-skirts:',
    'wardrobe:下身版型-bottom-fit:',
    'wardrobe:下身腰線-bottom-rise:',
    'wardrobe:下身圖案-bottom-surface-design:',
  ],
  outerwear: [
    'wardrobe:外套-outerwear:',
    'wardrobe:外套版型-outerwear-fit:',
    'wardrobe:外套圖案-outerwear-surface-design:',
    'wardrobe:外套開合-outerwear-opening:',
    'wardrobe:外套穿法-outerwear-styling:',
  ],
  shoes: ['wardrobe:鞋款-shoes:'],
  headAccessory: ['wardrobe:頭部配件-head-accessories:'],
  eyewear: [
    'wardrobe:眼鏡-eyewear:',
    'wardrobe:眼鏡配色-eyewear-color:',
    'wardrobe:眼鏡配戴方式-eyewear-placement:',
  ],
  earrings: ['wardrobe:耳環-earrings:'],
  neckAccessory: ['wardrobe:頸部-neck-accessories:'],
  wristAccessory: ['wardrobe:手部配件-wrist-accessories:'],
  ring: ['wardrobe:戒指-rings:'],
  waistAccessory: ['wardrobe:腰部配件-waist-accessories:'],
};

function filterPage1WardrobeForCharacterCardLayers(page1Wardrobe, cardLayers) {
  if (!Array.isArray(page1Wardrobe) || !Array.isArray(cardLayers) || cardLayers.length === 0) return page1Wardrobe;
  const conflictTokens = new Set(
    cardLayers.flatMap((layer) => CHARACTER_CARD_WARDROBE_CONFLICT_TOKENS[layer.meta?.characterCardLayer] || [])
  );
  if (conflictTokens.size === 0) return page1Wardrobe;
  return page1Wardrobe.filter((item) => ![...conflictTokens].some((token) => item.id?.includes(token)));
}

const CHARACTER_CARD_PAGE1_FILLER_LOCKS = [
  { layer: 'headAccessory', key: 'headAccessoryId' },
  { layer: 'eyewear', key: 'eyewearId' },
  { layer: 'earrings', key: 'earringsId' },
  { layer: 'neckAccessory', key: 'neckAccessoryId' },
];

function appendLockedPage1FillersForCharacterCardLayers(page1Wardrobe, cardLayers, locks, lockControls) {
  if (!Array.isArray(page1Wardrobe) || !Array.isArray(cardLayers) || cardLayers.length === 0) return page1Wardrobe;
  const importedLayers = new Set(cardLayers.map((layer) => layer.meta?.characterCardLayer).filter(Boolean));
  const existingIds = new Set(page1Wardrobe.map((item) => item.id).filter(Boolean));
  const fillers = CHARACTER_CARD_PAGE1_FILLER_LOCKS
    .filter(({ layer }) => !importedLayers.has(layer))
    .map(({ key }) => getControlOptionById(lockControls, key, locks?.[key]))
    .filter((item) => item && !isNoneLikeItem(item) && !existingIds.has(item.id));

  return fillers.length > 0 ? [...page1Wardrobe, ...fillers] : page1Wardrobe;
}

function getCharacterCardSelectionFields(subject, locks = {}) {
  const mode = getCharacterCardWardrobeMode(locks);
  if (!isCharacterProfileSubject(subject)) {
    return {
      characterCardHairVariantId: 'default',
      characterCardEyewearMode: 'default',
      characterCardWardrobeMode: 'full-default',
      characterCardWardrobeLayerIds: [],
      characterCardPromptOverride: '',
    };
  }

  const variant = getCharacterCardVariantFromLocks({ ...locks, characterProfileId: subject.id });
  return {
    characterCardHairVariantId: variant.hairVariantId,
    characterCardEyewearMode: variant.eyewearMode,
    characterCardWardrobeMode: mode,
    characterCardWardrobeLayerIds: mode === 'selected-layers' ? variant.includedWardrobeLayers : [],
    characterCardPromptOverride: String(variant.promptOverrideText || '').trim(),
  };
}

function isSpecialSubject(subject) {
  return Boolean(subject?.specialSubject);
}

function isSkeletonSubject(subject) {
  return subject?.specialSubject === 'skeleton';
}

function isAndroidSubject(subject) {
  return subject?.specialSubject === 'android';
}

function isCharacterProfileSubject(subject) {
  return subject?.specialSubject === 'character-profile';
}

function isDedicatedSpecialSubject(subject) {
  return isSpecialSubject(subject) && !isCharacterProfileSubject(subject);
}

function buildSpecialSubjectIntegrationPrompt(subject) {
  if (!isSpecialSubject(subject)) return '';
  if (isCharacterProfileSubject(subject)) return '';
  const text = 'an unknown anomalous figure appearing naturally inside a real contemporary environment, photographed as if genuinely present in the same physical space, grounded by realistic scale, contact shadows, ambient light, and ordinary surroundings';
  return isSkeletonSubject(subject) ? sanitizeSkeletonPromptText(text) : text;
}

function getAspectRatioOption(id, random = Math.random, exclusions = EMPTY_PREVIEW_REROLL_EXCLUSIONS) {
  const option = ASPECT_RATIO_OPTIONS.find((entry) => entry.id === id);
  if (option?.random) {
    return sample(exclusions.filterCandidates(ASPECT_RATIO_POOL, ['aspectRatio']), random);
  }
  return option || DEFAULT_ASPECT_RATIO;
}

function getDuoExpressionOption(id) {
  return DUO_EXPRESSION_OPTIONS.find((option) => option.id === id) || null;
}

function getPoseComposerOption(options, id) {
  return id ? options.find((option) => option.id === id) || null : null;
}

function isActivePoseComposerOption(option) {
  return Boolean(option && !isNoneLikeItem(option));
}

function resolvePoseComposerOption(options, id, predicate = () => true, exclusions = EMPTY_PREVIEW_REROLL_EXCLUSIONS, exclusionKeys = [], random = Math.random) {
  const option = getPoseComposerOption(options, id);
  if (!isActivePoseComposerOption(option)) return null;

  const candidates = options.filter((item) => (
    isActivePoseComposerOption(item)
    && !isRandomOption(item)
    && !isModelNaturalPoseComposerOption(item)
    && item.meta?.randomEligible !== false
    && predicate(item)
  ));
  if (isRandomOption(option)) return sample(exclusions.filterCandidates(candidates, exclusionKeys), random);
  return predicate(option) ? option : null;
}

const POSE_ANCHOR_RANDOM_NONE_RATE = 1 / 3;

function resolvePoseComposerAnchorOption(id, predicate, exclusions, random = Math.random) {
  const option = getPoseComposerOption(POSE_COMPOSER_ANCHOR_OPTIONS, id);
  if (!isActivePoseComposerOption(option)) return null;
  if (!isRandomOption(option)) return predicate(option) ? option : null;

  const candidates = POSE_COMPOSER_ANCHOR_OPTIONS.filter((item) => (
    isActivePoseComposerOption(item)
    && !isRandomOption(item)
    && !isModelNaturalPoseComposerOption(item)
    && item.meta?.randomEligible !== false
    && predicate(item)
  ));
  const filteredCandidates = exclusions.filterCandidates(candidates, ['poseAnchorId']);
  if (filteredCandidates.length === 0) return null;

  const roll = random();
  if (roll < POSE_ANCHOR_RANDOM_NONE_RATE) return null;
  const concreteRoll = (roll - POSE_ANCHOR_RANDOM_NONE_RATE) / (1 - POSE_ANCHOR_RANDOM_NONE_RATE);
  return filteredCandidates[Math.min(
    filteredCandidates.length - 1,
    Math.floor(concreteRoll * filteredCandidates.length),
  )];
}

function poseComposerOptionMatchesBase(option, baseId) {
  if (!option) return false;
  if (option.base) return option.base === baseId;
  if (Array.isArray(option.bases)) return option.bases.includes(baseId);
  return false;
}

function getWaterPoseBody(location) {
  const sceneType = getWaterPoseSceneType(location);
  if (sceneType === 'pool') return 'clear pool water';
  if (sceneType === 'cove') return 'clear shallow cove water';
  if (sceneType === 'beach') return 'clear shallow seawater';
  return 'clear shallow water';
}

function getWaterPoseEdge(location) {
  const sceneType = getWaterPoseSceneType(location);
  if (sceneType === 'pool') return 'tiled pool edge';
  if (sceneType === 'cove') return 'wet rock ledge at the cove shoreline';
  if (sceneType === 'beach') return 'wet sand shoreline at the waterline';
  return 'scene-appropriate water edge';
}

function getWaterImmersedAnchorPhrase(base, location) {
  const waterBody = getWaterPoseBody(location);
  const immersionDetail = 'with the whole lower body submerged and only the upper body above the water surface';
  const phrases = {
    standing: `standing waist-deep in ${waterBody} ${immersionDetail}`,
    sitting: `sitting low in ${waterBody} ${immersionDetail}`,
    kneeling: `kneeling in ${waterBody} ${immersionDetail}`,
    squatting: `squatting low in ${waterBody} ${immersionDetail}`,
    lying: `floating or half-floating on the ${waterBody} surface ${immersionDetail}`,
  };
  return phrases[base?.id] || `in ${waterBody} ${immersionDetail}`;
}

function getWaterEdgeSupportAnchorPhrase(base, location) {
  const waterEdge = getWaterPoseEdge(location);
  const immersionDetail = 'with the whole lower body submerged and only the upper body above the water surface';
  const phrases = {
    standing: `standing in shallow water beside the ${waterEdge} ${immersionDetail} and forearms or hands supported on that edge`,
    sitting: `sitting at the ${waterEdge} ${immersionDetail} and hands or forearms supported on that edge`,
    kneeling: `kneeling at the ${waterEdge} ${immersionDetail} and forearms or hands supported on that edge`,
    squatting: `squatting low at the ${waterEdge} ${immersionDetail} and one or both hands supported on that edge`,
    lying: `half-reclining at the ${waterEdge} ${immersionDetail} and forearms supported on that edge`,
  };
  return phrases[base?.id] || `supported at the ${waterEdge} ${immersionDetail}`;
}

function getPoseComposerAnchorPhrase(anchor, base, location) {
  if (!anchor || !base) return '';
  if (anchor.id === 'water-immersed') return getWaterImmersedAnchorPhrase(base, location);
  if (anchor.id === 'water-edge-support') return getWaterEdgeSupportAnchorPhrase(base, location);
  return anchor.phraseByBase?.[base.id] || anchor.en || '';
}

function getPoseComposerBasePhrase(base) {
  const phrases = {
    standing: 'standing pose',
    sitting: 'sitting pose',
    kneeling: 'kneeling pose',
    squatting: 'squatting pose',
    lying: 'lying pose',
  };
  return phrases[base?.id] || base?.en || '';
}

function getPoseComposerAnchorEffect(anchor, base) {
  if (!anchor || !base) return '';

  if (anchor.id === 'water-immersed' || anchor.id === 'water-edge-support') {
    return 'water-contact realism with the whole lower body submerged and only the upper body above the water surface, visible waterline across the body, natural ripples around the torso and limbs, wet skin and damp fabric edges, clothing remains complete and non-transparent';
  }

  if (anchor.id !== 'shared-bathtub') return '';

  const waterContactEffects = {
    sitting: 'water-contact realism on the lower body and garment edges where they meet the bath water, clothing remains complete and non-transparent, visible water sheen and droplets, darker damp fabric tones, heavier wet folds',
    squatting: 'the outfit and exposed skin are soaked by bath water, clothing remains complete and non-transparent, visible water sheen and droplets, darker damp fabric tones, heavier wet folds',
    lying: 'the outfit and exposed skin are soaked by bath water, clothing remains complete and non-transparent, visible water sheen and droplets, darker damp fabric tones, heavier wet folds',
  };

  return waterContactEffects[base.id] || '';
}

function isModelNaturalPoseComposerOption(option) {
  return Boolean(
    option?.id?.startsWith('model-natural-')
    || option?.meta?.tags?.includes('any')
  );
}

function normalizePoseComposerArrangementPhrase(arrangement) {
  return stripTerminalPromptPunctuation(arrangement?.en || '')
    .replace(/\barrangement\b/gi, 'pose')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePoseComposerHeadPhrase(head) {
  const text = stripTerminalPromptPunctuation(head?.en || '');
  if (!text) return '';
  if (/^(?:head|chin)\b/i.test(text)) return `her ${text}`;
  return text;
}

function normalizePoseComposerHandPhrase(handPose) {
  const text = stripTerminalPromptPunctuation(handPose?.en || '');
  if (!text) return '';
  if (/^front-camera\b/i.test(text)) return `a ${text}`;
  return text;
}

function normalizePoseComposerPropPhrase(propAction) {
  return stripTerminalPromptPunctuation(propAction?.en || '');
}

function withIndefiniteArticle(phrase) {
  const text = stripTerminalPromptPunctuation(phrase || '');
  if (!text || /^(?:a|an)\b/i.test(text)) return text;

  const consonantSoundException = /^(?:one(?:\b|-)|euro\b|ufo\b|uniform\b|unique\b|unit\b|university\b|use\b|user\b|usual\b)/i;
  const article = /^[aeiou]/i.test(text) && !consonantSoundException.test(text)
    ? 'an'
    : 'a';
  return `${article} ${text}`;
}

function buildPoseComposerResultPhrase({ base, arrangement, anchor, location }) {
  const arrangementPhrase = arrangement && !isModelNaturalPoseComposerOption(arrangement)
    ? normalizePoseComposerArrangementPhrase(arrangement)
    : getPoseComposerBasePhrase(base);
  const anchorPhrase = stripTerminalPromptPunctuation(getPoseComposerAnchorPhrase(anchor, base, location));

  if (!arrangementPhrase) return anchorPhrase;
  if (!anchorPhrase) return arrangementPhrase;

  const anchorTail = anchorPhrase
    .replace(/^(?:standing|sitting|kneeling|squatting|lying(?: down)?|reclining)\s+/i, '')
    .trim();
  if (anchorTail && anchorTail !== anchorPhrase) return `${arrangementPhrase} ${anchorTail}`;
  if (/^(?:leaning|reclining|on|in|at|beside|by|against|near|with)\b/i.test(anchorPhrase)) {
    return `${arrangementPhrase} ${anchorPhrase}`;
  }
  return `${arrangementPhrase} with ${anchorPhrase}`;
}

function buildPoseComposerSentence({ base, arrangement, handPose, propAction, anchor, head, location }) {
  const anchorEffect = getPoseComposerAnchorEffect(anchor, base);
  const naturalChoiceSelected = [arrangement, handPose, head].some(isModelNaturalPoseComposerOption);
  const headPhrase = head && !isModelNaturalPoseComposerOption(head)
    ? normalizePoseComposerHeadPhrase(head)
    : '';
  const handPhrase = handPose && !isModelNaturalPoseComposerOption(handPose)
    ? normalizePoseComposerHandPhrase(handPose)
    : '';
  const propPhrase = propAction
    ? normalizePoseComposerPropPhrase(propAction)
    : '';
  const poseResult = buildPoseComposerResultPhrase({ base, arrangement, anchor, location })
    || (naturalChoiceSelected ? 'natural posture' : '');
  const poseResultWithAnchorEffect = [poseResult, anchorEffect]
    .filter(Boolean)
    .join(', ');
  const posturePhrase = poseResultWithAnchorEffect
    ? (naturalChoiceSelected
      ? `a casual, relaxed, and natural ${poseResultWithAnchorEffect}`
      : withIndefiniteArticle(poseResultWithAnchorEffect))
    : '';
  const details = [headPhrase, propPhrase || handPhrase].filter(Boolean);

  if (!posturePhrase) {
    return details.length > 0 ? `She has ${details.join(', ')}.` : '';
  }

  if (details.length === 0) return `She presents ${posturePhrase}.`;
  return `She has ${details.join(', ')}, and presents ${posturePhrase}.`;
}

function buildPoseComposerItem(context) {
  if (context.subject.count !== 1) return null;

  const exclusions = context.previewRerollExclusions || EMPTY_PREVIEW_REROLL_EXCLUSIONS;
  const random = context.random || Math.random;
  const base = resolvePoseComposerOption(POSE_COMPOSER_BASE_OPTIONS, context.locks?.poseBaseId, () => true, exclusions, ['poseBaseId'], random);

  if (!base) {
    const handPose = resolvePoseComposerOption(POSE_COMPOSER_HAND_OPTIONS, context.locks?.poseHandId, () => true, exclusions, ['poseHandId'], random);
    const head = resolvePoseComposerOption(POSE_COMPOSER_HEAD_OPTIONS, context.locks?.poseHeadId, () => true, exclusions, ['poseHeadId'], random);
    const propAction = resolvePoseComposerOption(POSE_COMPOSER_PROP_OPTIONS, context.locks?.posePropId, () => true, exclusions, ['posePropId'], random);
    const standaloneParts = [handPose, propAction, head].filter(isActivePoseComposerOption);
    if (standaloneParts.length === 0) return null;

    return {
      id: `character:姿勢組合器-pose-composer:${standaloneParts.map((part) => part.id).join(':')}`,
      zh: standaloneParts.map((part) => part.zh).join(' + '),
      en: buildPoseComposerSentence({ handPose, propAction, head, location: context.location }),
      desc: '由姿勢組合器生成的組合姿勢。',
      meta: {
        tags: ['pose_composer'],
        minVisibility: 'medium',
        poseBaseId: 'none',
        poseArrangementId: 'none',
        poseHandId: handPose?.id || 'none',
        posePropId: propAction?.id || 'none',
        poseHeadId: head?.id || 'none',
        poseAnchorId: 'none',
      },
    };
  }

  const matchesBase = (option) => poseComposerOptionMatchesBase(option, base.id);
  const matchesAnchor = (option) => (
    matchesBase(option)
    && poseComposerAnchorAllowedByScene(option, context.location, context.locks?.locationId)
  );
  const arrangement = resolvePoseComposerOption(POSE_COMPOSER_ARRANGEMENT_OPTIONS, context.locks?.poseArrangementId, matchesBase, exclusions, ['poseArrangementId'], random);
  const handPose = resolvePoseComposerOption(POSE_COMPOSER_HAND_OPTIONS, context.locks?.poseHandId, () => true, exclusions, ['poseHandId'], random);
  const head = resolvePoseComposerOption(POSE_COMPOSER_HEAD_OPTIONS, context.locks?.poseHeadId, () => true, exclusions, ['poseHeadId'], random);
  const anchor = resolvePoseComposerAnchorOption(context.locks?.poseAnchorId, matchesAnchor, exclusions, random);
  const propAction = resolvePoseComposerOption(POSE_COMPOSER_PROP_OPTIONS, context.locks?.posePropId, () => true, exclusions, ['posePropId'], random);
  const parts = [base, arrangement, handPose, propAction, head, anchor].filter(Boolean);

  return {
    id: `character:姿勢組合器-pose-composer:${parts.map((part) => part.id).join(':')}`,
    zh: parts.map((part) => part.zh).join(' + '),
    en: buildPoseComposerSentence({ base, arrangement, handPose, propAction, anchor, head, location: context.location }),
    desc: '由姿勢組合器生成的組合姿勢。',
    meta: {
      tags: ['pose_composer'],
      minVisibility: 'full',
      poseBaseId: base.id,
      poseArrangementId: arrangement?.id || 'none',
      poseHandId: handPose?.id || 'none',
      posePropId: propAction?.id || 'none',
      poseHeadId: head?.id || 'none',
      poseAnchorId: anchor?.id || 'none',
    },
  };
}

const CHEST_VISIBLE_HAND_IDS = new Set([
  'selfie-natural-right-arm',
  'selfie-mirror-phone-visible',
  'selfie-companion-camera-interaction',
  'hand-adjust-off-shoulder-top',
  'arms-crossed',
  'one-hand-chin',
  'one-hand-forehead',
  'one-hand-hair',
  'hands-on-cheeks',
  'one-hand-chin-other-down',
  'one-hand-adjust-glasses',
  'one-hand-pull-down-glasses',
  'one-hand-mouth-corner',
  'one-hand-half-face-cover',
  'both-hands-arrange-hair',
  'one-hand-nape-hair-lift',
  'one-hand-collarbone',
  'one-hand-shoulder',
  'both-hands-overhead',
  'hands-behind-head',
]);

const MEDIUM_HIDDEN_HAND_IDS = new Set([
  'hands-on-thighs',
  'one-hand-ground-one-leg',
  'one-hand-knee-one-down',
  'one-hand-ankle',
  'hands-gathered-lower-abdomen',
]);

const COWBOY_HIDDEN_HAND_IDS = new Set([
  'one-hand-ground-one-leg',
  'one-hand-ankle',
]);

const PROJECTED_HAND_PHRASES = Object.freeze({
  'one-hand-chin-other-down': 'one hand supporting the chin',
  'one-hand-waist-one-down': 'one hand on the waist or hip line',
  'hand-adjust-lower-body-garment': 'one hand adjusting the lower-body garment at the waistband',
});

const UPPER_BODY_ARRANGEMENT_PHRASES = Object.freeze({
  'standing-forward-lean': 'a slight forward lean',
  'standing-deep-forward-lean': 'a deep forward lean from the waist, shoulders angled forward',
  'standing-back-lean': 'a slight backward lean',
  'standing-turn-back': 'the torso subtly rotated',
  'standing-contrapposto': 'the upper body leaning to one side',
  'standing-back-facing-turn': 'the torso rotated back toward the camera',
  'sitting-forward-lean': 'the upper body leaning slightly forward',
  'sitting-grounded-forward-lean': 'the upper body angled forward',
  'sitting-open-confident': 'the torso upright',
  'kneeling-forward-lean': 'the upper body leaning forward',
  'kneeling-puppy-crossed-hands-chin': 'the torso folded forward, forearms crossed under the chin, and hands tucked below the jaw',
  'kneeling-upright-poised': 'the torso vertical',
  'kneeling-elbow-support': 'the elbows or forearms supporting the upper body on a nearby surface',
  'kneeling-back-arched': 'the torso leaning slightly backward',
  'squatting-forward-lean': 'the upper body angled forward',
  'lying-half-reclined': 'the upper body softly supported',
  'lying-on-back-one-arm-overhead': 'one arm extended overhead',
  'lying-prone-elbow-prop': 'the elbows propping up the upper body',
  'lying-wall-raised-legs': 'the upper body leaning against a wall',
  'lying-prone-pillow-lookback': 'the torso propped on a large pillow with the head turned over one shoulder',
});

const COWBOY_HIDDEN_ARRANGEMENT_IDS = new Set([
  'standing-raised-foot',
  'standing-forward-toe-point',
  'squatting-one-hand-ground',
  'squatting-raised-heels',
]);

const COWBOY_PROJECTED_ARRANGEMENT_PHRASES = Object.freeze({
  'squatting-knees-together-low': 'low compact squat with both knees pressed together, thighs close and parallel forming a compact front-facing lower-body shape',
});

const FULL_ONLY_ANCHOR_IDS = new Set([
  'shared-ground-support',
  'water-immersed',
  'water-edge-support',
]);

function cloneProjectedPoseOption(option, en) {
  if (!option || !en) return null;
  return { ...option, en };
}

function projectPoseComposerHand(handPose, bucket) {
  if (!handPose) return null;
  if (isModelNaturalPoseComposerOption(handPose)) return handPose;
  if (bucket === COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP && !CHEST_VISIBLE_HAND_IDS.has(handPose.id)) return null;
  if (bucket === COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST && MEDIUM_HIDDEN_HAND_IDS.has(handPose.id)) return null;
  if (bucket === COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE && COWBOY_HIDDEN_HAND_IDS.has(handPose.id)) return null;
  const projectedPhrase = PROJECTED_HAND_PHRASES[handPose.id];
  return projectedPhrase ? cloneProjectedPoseOption(handPose, projectedPhrase) : handPose;
}

function projectPoseComposerArrangement(arrangement, bucket) {
  if (!arrangement || isModelNaturalPoseComposerOption(arrangement)) return arrangement;
  if (bucket === COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST) {
    return UPPER_BODY_ARRANGEMENT_PHRASES[arrangement.id] ? arrangement : null;
  }
  if (bucket === COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE) {
    if (COWBOY_HIDDEN_ARRANGEMENT_IDS.has(arrangement.id)) return null;
    const projectedPhrase = COWBOY_PROJECTED_ARRANGEMENT_PHRASES[arrangement.id];
    return projectedPhrase ? cloneProjectedPoseOption(arrangement, projectedPhrase) : arrangement;
  }
  return arrangement;
}

function isChestVisibleAnchor(anchor, base) {
  if (!anchor || !base) return false;
  if (anchor.id === 'shared-vertical-surface-support') return true;
  if (anchor.id === 'shared-mirrored-steel-cube' || anchor.id === 'shared-clear-acrylic-cube') {
    return base.id === 'kneeling' || base.id === 'squatting';
  }
  return false;
}

function buildChestVisibleAnchorFragment(anchor, base) {
  if (!isChestVisibleAnchor(anchor, base)) return '';
  if (anchor.id === 'shared-vertical-surface-support') {
    return base.id === 'standing' || base.id === 'kneeling'
      ? 'one shoulder and the upper back resting against an existing vertical surface in the scene, with clear shoulder-to-surface contact'
      : 'the upper back resting against an existing vertical surface in the scene, with clear back-to-surface contact';
  }

  const support = anchor.id === 'shared-mirrored-steel-cube'
    ? 'a mirrored stainless-steel cube plinth'
    : 'a transparent acrylic cube plinth';
  const material = anchor.id === 'shared-mirrored-steel-cube' ? 'metal' : 'acrylic';
  return base.id === 'kneeling'
    ? `one shoulder resting against the upper edge of ${support}, with clear shoulder-to-${material} contact`
    : `the upper back resting against one side of ${support}, with clear back-to-${material} contact`;
}

function projectPoseComposerAnchor(anchor, base, bucket) {
  if (!anchor || !base || FULL_ONLY_ANCHOR_IDS.has(anchor.id)) return null;
  if (bucket === COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST) {
    return isChestVisibleAnchor(anchor, base) ? anchor : null;
  }
  if (bucket === COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE) {
    const phrase = getPoseComposerAnchorPhrase(anchor, base, null);
    if (/\b(?:on the ground|on the floor|ground plane|low step)\b/i.test(phrase)) return null;
    return anchor;
  }
  return anchor;
}

function joinProjectedPoseFragments(fragments) {
  const values = fragments.filter(Boolean);
  if (values.length <= 1) return values[0] || '';
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
}

function buildChestUpPoseComposerSentence({ arrangement, handPose, propAction, anchor, head, base, location }) {
  const naturalChoiceSelected = [arrangement, handPose, head].some(isModelNaturalPoseComposerOption);
  const projectedHead = head && !isModelNaturalPoseComposerOption(head) ? head : null;
  const projectedHand = handPose && !isModelNaturalPoseComposerOption(handPose)
    ? projectPoseComposerHand(handPose, COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP)
    : null;
  const upperBodyFragment = arrangement && !isModelNaturalPoseComposerOption(arrangement)
    ? UPPER_BODY_ARRANGEMENT_PHRASES[arrangement.id] || ''
    : '';
  const anchorFragment = buildChestVisibleAnchorFragment(anchor, base);
  const visibleBodyFragments = joinProjectedPoseFragments([upperBodyFragment, anchorFragment]);
  const projectedArrangementPhrase = naturalChoiceSelected
    ? `casual, relaxed, and natural upper-body pose${visibleBodyFragments ? ` with ${visibleBodyFragments}` : ''}`
    : visibleBodyFragments
      ? `upper-body pose with ${visibleBodyFragments}`
      : '';
  const projectedArrangement = projectedArrangementPhrase
    ? cloneProjectedPoseOption(arrangement || base || { id: 'projected-upper-body' }, projectedArrangementPhrase)
    : null;

  return buildPoseComposerSentence({
    arrangement: projectedArrangement,
    handPose: projectedHand,
    propAction,
    head: projectedHead,
    location,
  });
}

function buildProjectedCanonicalPoseText(context, poseComposer) {
  if (!poseComposer || isNoneLikeItem(poseComposer)) return '';
  const projection = getCompositionVisibilityProjection(context);
  if (projection.pose?.mode === 'omit') return '';
  if (projection.pose?.mode === 'fullCanonical') return poseComposer.en || '';

  const activeOption = (options, id) => {
    const option = getPoseComposerOption(options, id);
    return isActivePoseComposerOption(option) ? option : null;
  };
  const base = activeOption(POSE_COMPOSER_BASE_OPTIONS, poseComposer.meta?.poseBaseId);
  const arrangement = activeOption(POSE_COMPOSER_ARRANGEMENT_OPTIONS, poseComposer.meta?.poseArrangementId);
  const handPose = activeOption(POSE_COMPOSER_HAND_OPTIONS, poseComposer.meta?.poseHandId);
  const propAction = activeOption(POSE_COMPOSER_PROP_OPTIONS, poseComposer.meta?.posePropId);
  const head = activeOption(POSE_COMPOSER_HEAD_OPTIONS, poseComposer.meta?.poseHeadId);
  const anchor = activeOption(POSE_COMPOSER_ANCHOR_OPTIONS, poseComposer.meta?.poseAnchorId);
  const bucket = projection.bucket;

  if (bucket === COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP) {
    return buildChestUpPoseComposerSentence({
      arrangement,
      handPose: shouldProjectPosePart(projection, 'hand', { conditional: true }) ? handPose : null,
      propAction: shouldProjectPosePart(projection, 'prop', { conditional: true }) ? propAction : null,
      anchor: shouldProjectPosePart(projection, 'anchor', { conditional: true }) ? anchor : null,
      head: shouldProjectPosePart(projection, 'head') ? head : null,
      base,
      location: context.location,
    });
  }

  return buildPoseComposerSentence({
    base: shouldProjectPosePart(projection, 'postureBase') ? base : null,
    arrangement: projectPoseComposerArrangement(arrangement, bucket),
    handPose: shouldProjectPosePart(projection, 'hand') ? projectPoseComposerHand(handPose, bucket) : null,
    propAction: shouldProjectPosePart(projection, 'prop') ? propAction : null,
    anchor: shouldProjectPosePart(projection, 'anchor', { conditional: true })
      ? projectPoseComposerAnchor(anchor, base, bucket)
      : null,
    head: shouldProjectPosePart(projection, 'head') ? head : null,
    location: context.location,
  });
}

const SCENE_SOURCE_CLAUSE_LIMITS = Object.freeze({
  compactSource: 3,
  conciseSource: 5,
});

const NON_VISUAL_SCENE_CONTROL_PATTERN = /^(?:keep|avoid|do not|don't|render|scene priority|no\b|not\b)/i;

function projectSceneSourceText(value, mode) {
  const source = stripMarkdown(value || '').replace(/\s+/g, ' ').trim();
  if (!source) return '';
  if (mode === 'fullSource') return source;

  const limit = SCENE_SOURCE_CLAUSE_LIMITS[mode] || SCENE_SOURCE_CLAUSE_LIMITS.compactSource;
  return splitPromptClauses(source)
    .filter((clause) => !NON_VISUAL_SCENE_CONTROL_PATTERN.test(clause))
    .slice(0, limit)
    .join(', ');
}

function buildProjectedScene(context) {
  const projection = getCompositionVisibilityProjection(context);
  const mode = projection.scene?.mode || 'fullSource';
  const locationSource = context?.location && !isNoneLikeItem(context.location) ? context.location.en : '';
  const worldSceneSource = getImportedWorldSceneArchitectureText(context);
  const sceneAccentSource = buildContextualSceneAccent(context);

  return Object.freeze({
    mode,
    locationText: projectSceneSourceText(locationSource, mode),
    worldSceneText: projectSceneSourceText(worldSceneSource, mode),
    sceneAccentText: mode === 'compactSource'
      ? ''
      : projectSceneSourceText(sceneAccentSource, mode === 'fullSource' ? 'fullSource' : 'compactSource'),
  });
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

  if (actionTags.has('social_shooting_action')) return true;

  if (actionTags.has('leg_focus_action') || actionTags.has('large_prop_action') || actionTags.has('full_body_action')) {
    return visibility === 'full' || visibility === 'wide';
  }

  if (actionTags.has('prop_action') || actionTags.has('wardrobe_action')) {
    return visibility !== 'close';
  }

  return visibility !== 'close';
}

function buildSubjectBase(subject) {
  if (isSpecialSubject(subject)) {
    return {
      zh: subject.zh || '一具完整人類骷髏',
      en: subject.en,
      id: `base-character-${subject.id}`,
      meta: { tags: [subject.specialSubject, 'solo', 'special_subject'] },
    };
  }

  return {
    zh: subject.reference ? '一位以附圖人物五官為主的女性' : subject.count === 2 ? '兩位性感驚豔的東亞女性' : '一位性感驚豔的東亞女性',
    en: subject.en,
    id: `base-character-${subject.id}`,
    meta: { tags: ['female', subject.count === 2 ? 'duo' : 'solo'] },
  };
}

function pickWithLock(list, lockedId, predicate = () => true, picker = sample, random = Math.random) {
  if (lockedId) {
    const locked = findById(list, lockedId);
    if (locked) return locked;
  }

  const matches = list.filter(predicate);
  const nonNoneMatches = matches.filter((item) => !isNoneLikeItem(item));
  if (nonNoneMatches.length > 0) return picker(nonNoneMatches, random);
  if (matches.length > 0) return picker(matches, random);

  const noneOption = list.find((item) => isNoneLikeItem(item));
  return noneOption || null;
}

function pickWithCompatibleLock(list, lockedId, predicate = () => true, picker = sample, random = Math.random) {
  if (lockedId) {
    const locked = findById(list, lockedId);
    if (locked && isNoneLikeItem(locked)) return locked;
    if (locked && predicate(locked)) return locked;
  }

  const matches = list.filter(predicate);
  const nonNoneMatches = matches.filter((item) => !isNoneLikeItem(item));
  if (nonNoneMatches.length > 0) return picker(nonNoneMatches, random);
  if (matches.length > 0) return picker(matches, random);

  const noneOption = list.find((item) => isNoneLikeItem(item));
  return noneOption || null;
}

function specialOutfitHasHairstyle(item) {
  if (!item || isNoneLikeItem(item)) return false;
  const text = stripMarkdown(item.en || '')
    .replace(/\bhair\s+(?:clips?|claw clips?|pins?|barrettes?|accessories?)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return /\b(hair|bangs|braids?|side braid|twin-bun|pigtails?|ponytail|bob|shag|chignon|bun)\b/i.test(text);
}

function stripSpecialOutfitHairstyleDescription(text) {
  if (!text) return '';
  let next = text
    .replace(
      /\b[^,.]*\b(?:hair|braid)\s+under\s+((?:a|an|the)\s+[^,.]*(?:headscarf|beanie|cap|hat)\b[^,.]*)/gi,
      '$1',
    )
    .replace(/\bshort blonde bob with full bangs and (small pink bow hair clips)\b/gi, '$1');

  for (let index = 0; index < 3; index += 1) {
    const stripped = next.replace(
      /(\.\s*)[^,.]*\b(?:hair|bangs|braids?|side braid|twin-bun|pigtails?|ponytail|bob|shag|chignon|bun|updo|waves?)\b[^,]*(,\s*)/i,
      '$1',
    );
    if (stripped === next) break;
    next = stripped;
  }

  const hairDescription = /\b(hair|bangs|braids?|side braid|twin-bun|pigtails?|ponytail|bob|shag|chignon|bun|updo|waves?)\b/i;
  const hairAccessory = /\b(headscarf|beanie|cap|hat|beret|headband|scrunchie|hair clips?|claw clip|barrettes?)\b/i;
  return next
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && (!hairDescription.test(part) || hairAccessory.test(part)))
    .join(', ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasExplicitHairstyleLock(context, catalog, role = null) {
  if (isSpecialSubject(context.subject)) return false;
  const sourceCatalog = catalog.catalog || catalog;
  const hairstyleItems = getByKey(sourceCatalog.character, '髮型 (Hairstyle)');
  const hasLock = (lockKey) => {
    const lockedId = context.locks?.[lockKey];
    const locked = lockedId ? findById(hairstyleItems, lockedId) : null;
    return Boolean(locked && !isNoneLikeItem(locked));
  };

  if (context.subject.count === 2) {
    if (role === 'a') return hasLock('hairstyleAId');
    if (role === 'b') return hasLock('hairstyleBId');
    return hasLock('hairstyleAId') || hasLock('hairstyleBId');
  }

  return hasLock('hairstyleId');
}

function selectedSpecialOutfitHasHairstyle(context, catalog, role = null) {
  if (isSpecialSubject(context.subject)) return false;
  const specialOutfits = getByKey(catalog.wardrobe, '特殊穿搭 (Special Outfits)');
  const shared = context.locks?.specialOutfitId ? findById(specialOutfits, context.locks.specialOutfitId) : null;
  if (shared && specialOutfitHasHairstyle(shared)) return true;

  if (context.subject.count !== 2 || !role) return false;
  const roleKey = role === 'a' ? 'specialOutfitAId' : 'specialOutfitBId';
  const roleOutfit = context.locks?.[roleKey] ? findById(specialOutfits, context.locks[roleKey]) : null;
  return specialOutfitHasHairstyle(roleOutfit);
}

function buildCharacter(context, catalog) {
  const character = [buildSubjectBase(context.subject)];
  const previewExclusions = context.previewRerollExclusions || EMPTY_PREVIEW_REROLL_EXCLUSIONS;
  const random = context.random || Math.random;
  const sampleItem = (items) => sample(items, random);
  const actionPose = buildActionPoseItem(context);
  if (isSpecialSubject(context.subject)) {
    const hairstyleItems = getByKey(catalog.character, '髮型 (Hairstyle)');
    const hairColorItems = getByKey(catalog.character, '髮色 (Hair Color)');
    const expressionItems = getByKey(catalog.character, '神情與眼神 (Expression & Gaze)');
    const poseItems = getByKey(catalog.character, '姿勢與肢體語言 (Pose & Body Language)');
    const specialActionItems = getByKey(catalog.character, '特殊動作 (Special Actions)');

    if (isAndroidSubject(context.subject)) {
      const hairstyle = context.locks?.hairstyleId ? findById(hairstyleItems, context.locks.hairstyleId) : null;
      if (hairstyle && !isNoneLikeItem(hairstyle)) character.push(hairstyle);

      const hairColor = context.locks?.hairColorId ? findById(hairColorItems, context.locks.hairColorId) : null;
      if (hairColor && !isNoneLikeItem(hairColor)) character.push(hairColor);
    }

    if (actionPose && !isNoneLikeItem(actionPose)) {
      character.push(actionPose);
      return character;
    }

    if (context.locks?.expressionId) {
      const expression = findById(expressionItems, context.locks.expressionId);
      if (expression && !isNoneLikeItem(expression)) character.push(expression);
    }

    const poseComposer = buildPoseComposerItem(context);
    if (poseComposer && !isNoneLikeItem(poseComposer)) {
      character.push(poseComposer);
      return character;
    }

    if (context.locks?.specialActionId) {
      const specialAction = findById(specialActionItems, context.locks.specialActionId);
      if (specialAction && !isNoneLikeItem(specialAction)) {
        character.push(specialAction);
        if (!isSocialShootingAction(specialAction)) return character;
      }
    }

    if (context.locks?.poseId) {
      const pose = findById(poseItems, context.locks.poseId);
      if (pose && !isNoneLikeItem(pose)) {
        character.push(pose);
        return character;
      }
    }

    return character;
  }
  const visibility = context.framing.meta.visibility;
  const isReferenceSubject = Boolean(context.subject.reference);
  let lockedArchetype = null;
  const buildDuoPoseItem = (option) => {
    if (!option) return null;
    return {
      id: `character:雙人構圖姿態-duo-pose:${option.id}`,
      zh: option.zh,
      en: option.en,
      desc: option.desc || '',
      meta: { ...(option.meta || {}), minVisibility: 'medium', tags: withTags(option.meta?.tags || []) },
    };
  };
  const buildDuoPoseBaseItem = (option) => {
    if (!option) return null;
    return {
      id: `character:雙人姿態基底-duo-pose-base:${option.id}`,
      zh: option.zh,
      en: option.en,
      desc: option.desc || '',
      meta: { ...(option.meta || {}), minVisibility: 'medium', tags: withTags(option.meta?.tags || []) },
    };
  };
  const buildDuoExpressionItem = (option) => {
    if (!option) return null;
    return {
      id: `character:雙人神情眼神-duo-expression:${option.id}`,
      zh: option.zh,
      en: option.en,
      desc: option.desc || '',
      meta: { ...(option.meta || {}), minVisibility: 'medium', tags: withTags(option.meta?.tags || []) },
    };
  };

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
  const previewExclusionKeysByCategory = {
    '體態 (Body Type)': ['bodyTypeId'],
    '五官特徵 (Facial Features)': ['facialFeaturesId'],
    '膚質特徵 (Skin Details)': ['skinDetailsId'],
    '髮型 (Hairstyle)': ['hairstyleId'],
    '髮色 (Hair Color)': ['hairColorId'],
    '神情與眼神 (Expression & Gaze)': ['expressionId'],
    '姿勢與肢體語言 (Pose & Body Language)': ['poseId'],
    '特殊動作 (Special Actions)': ['specialActionId'],
  };

  const pickCategory = (categoryKey, locks, customPredicate = () => true, picker = sampleItem, respectVisibility = true) => {
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
    const shouldExcludePrevious = !lockedId || isRandomLockValue(lockedId);
    const sampleCandidates = shouldExcludePrevious
      ? previewExclusions.filterCandidates(candidates, previewExclusionKeysByCategory[categoryKey] || [])
      : candidates;
    const picked = lockedId ? findById(candidates, lockedId) || picker(sampleCandidates) : picker(sampleCandidates);
    if (picked.meta.archetype && !lockedArchetype) lockedArchetype = picked.meta.archetype;
    character.push(picked);
    return picked;
  };

  const pickPreviewAwareOption = (options, lockedId, exclusionKeys) => {
    const lockedOption = lockedId && !isRandomLockValue(lockedId)
      ? options.find((option) => option.id === lockedId) || null
      : null;
    if (lockedOption) return lockedOption;
    const candidates = options.filter((option) => !isNoneLikeItem(option));
    return sampleItem(previewExclusions.filterCandidates(candidates, exclusionKeys));
  };

  const pickHairColor = (candidates) => {
    const mainstream = candidates.filter((item) => item.meta.tags.includes('mainstream_hair_color'));
    const special = candidates.filter((item) => item.meta.tags.includes('special_hair_color'));

    if (mainstream.length > 0 && (special.length === 0 || random() < 0.88)) {
      return sampleItem(mainstream);
    }

    return sampleItem(special.length > 0 ? special : candidates);
  };

  const cloneCharacterRole = (item, role) => ({
    ...item,
    id: `${item.id}:${role}`,
    meta: { ...(item.meta || {}), characterRole: role },
  });

  const pickDistinctForRole = (categoryKey, role, lockedId, currentItems = [], picker = sampleItem, predicate = () => true) => {
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

  if (context.subject.count === 2) {
    const sharedBodyTypeId = context.locks?.bodyTypeId;
    const bodyA = pickDistinctForRole('體態 (Body Type)', 'a', context.locks?.bodyTypeAId || sharedBodyTypeId, [], sampleItem, () => true);
    const bodyB = pickDistinctForRole('體態 (Body Type)', 'b', context.locks?.bodyTypeBId || sharedBodyTypeId, sharedBodyTypeId ? [] : [bodyA], sampleItem, () => true);
    if (bodyA) character.push(bodyA);
    if (bodyB) character.push(bodyB);
  } else if (!isReferenceSubject || context.locks?.bodyTypeId) {
    pickCategory('體態 (Body Type)', context.locks, () => true, sampleItem, false);
  }

  if (context.subject.count === 1 && (context.locks?.facialFeaturesId || (!isReferenceSubject && visibilityAtLeast(visibility, 'medium')))) {
    pickCategory('五官特徵 (Facial Features)', context.locks, (item) => !lockedArchetype || !item.meta.archetype || item.meta.archetype === lockedArchetype);
  }

  if (context.subject.count === 1 && (context.locks?.skinDetailsId || (!isReferenceSubject && visibilityAtLeast(visibility, 'medium') && random() < 0.55))) {
    pickCategory('膚質特徵 (Skin Details)', context.locks);
  }

  if (context.subject.count === 2 && (visibilityAtLeast(visibility, 'medium') || context.locks?.facialFeaturesAId || context.locks?.facialFeaturesBId)) {
    const faceA = pickDistinctForRole('五官特徵 (Facial Features)', 'a', context.locks?.facialFeaturesAId, [], sampleItem);
    const faceB = pickDistinctForRole('五官特徵 (Facial Features)', 'b', context.locks?.facialFeaturesBId, [faceA], sampleItem);
    if (faceA) character.push(faceA);
    if (faceB) character.push(faceB);
  }

  if (context.subject.count === 2) {
    const sharedSkinDetailsId = context.locks?.skinDetailsId;
    const hasDuoSkinLock = Boolean(context.locks?.skinDetailsAId || context.locks?.skinDetailsBId || sharedSkinDetailsId);
    const shouldRandomizeDuoSkin = !hasDuoSkinLock && visibilityAtLeast(visibility, 'portrait') && random() < 0.45;
    const pickDuoSkin = (role, lockedId, currentItems = []) => {
      if (!lockedId && !shouldRandomizeDuoSkin) return null;
      return pickDistinctForRole('膚質特徵 (Skin Details)', role, lockedId, currentItems, sampleItem);
    };
    const skinA = pickDuoSkin('a', context.locks?.skinDetailsAId || sharedSkinDetailsId, []);
    const skinB = pickDuoSkin('b', context.locks?.skinDetailsBId || sharedSkinDetailsId, sharedSkinDetailsId ? [] : [skinA]);
    if (skinA) character.push(skinA);
    if (skinB) character.push(skinB);
  }

  const suppressSingleHair = context.subject.count === 1
    && selectedSpecialOutfitHasHairstyle(context, catalog)
    && !hasExplicitHairstyleLock(context, catalog);
  if (!suppressSingleHair && context.subject.count === 1 && (context.locks?.hairstyleId || context.locks?.hairColorId || (!isReferenceSubject && visibilityAtLeast(visibility, 'medium')))) {
    pickCategory('髮型 (Hairstyle)', context.locks);
    pickCategory('髮色 (Hair Color)', context.locks, () => true, pickHairColor);
  }

  if (context.subject.count === 2 && (visibilityAtLeast(visibility, 'medium') || context.locks?.hairstyleAId || context.locks?.hairstyleBId || context.locks?.hairColorAId || context.locks?.hairColorBId)) {
    const suppressHairA = selectedSpecialOutfitHasHairstyle(context, catalog, 'a')
      && !hasExplicitHairstyleLock(context, catalog, 'a');
    const suppressHairB = selectedSpecialOutfitHasHairstyle(context, catalog, 'b')
      && !hasExplicitHairstyleLock(context, catalog, 'b');
    const hairA = suppressHairA ? null : pickDistinctForRole('髮型 (Hairstyle)', 'a', context.locks?.hairstyleAId, [], sampleItem);
    const hairB = suppressHairB ? null : pickDistinctForRole('髮型 (Hairstyle)', 'b', context.locks?.hairstyleBId, [hairA], sampleItem);
    if (hairA) character.push(hairA);
    if (hairB) character.push(hairB);

    const hairColorA = suppressHairA ? null : pickDistinctForRole('髮色 (Hair Color)', 'a', context.locks?.hairColorAId, [], pickHairColor);
    const hairColorB = suppressHairB ? null : pickDistinctForRole('髮色 (Hair Color)', 'b', context.locks?.hairColorBId, [hairColorA], pickHairColor);
    if (hairColorA) character.push(hairColorA);
    if (hairColorB) character.push(hairColorB);
  }

  let expression = null;
  if (context.subject.count === 2) {
    const duoExpressionOption = context.locks?.duoExpressionId
      ? getDuoExpressionOption(context.locks.duoExpressionId)
      : sampleNonNone(DUO_EXPRESSION_OPTIONS, random);
    const duoExpressionItem = buildDuoExpressionItem(duoExpressionOption);
    if (duoExpressionItem && !isNoneLikeItem(duoExpressionItem)) {
      character.push(duoExpressionItem);
    }
  } else if (actionPose && !isNoneLikeItem(actionPose)) {
    character.push(actionPose);
  } else {
    expression = pickCategory('神情與眼神 (Expression & Gaze)', context.locks, (item) => expressionSupportsComposition(item, context));
  }

  if (context.subject.count > 1) {
    const duoPoseOption = pickPreviewAwareOption(DUO_POSE_OPTIONS, context.locks?.duoPoseId, ['duoPoseId']);
    const duoPoseBaseOption = pickPreviewAwareOption(DUO_POSE_BASE_OPTIONS, context.locks?.duoPoseBaseId, ['duoPoseBaseId']);
    const duoPoseItem = buildDuoPoseItem(duoPoseOption);
    if (duoPoseItem && !isNoneLikeItem(duoPoseItem)) {
      character.push(duoPoseItem);
    } else {
      character.push(buildDuoPoseItem(DUO_POSE_OPTIONS[0]));
    }
    const duoPoseBaseItem = buildDuoPoseBaseItem(duoPoseBaseOption);
    if (duoPoseBaseItem && !isNoneLikeItem(duoPoseBaseItem)) {
      character.push(duoPoseBaseItem);
    }
    return character;
  }

  if (actionPose && !isNoneLikeItem(actionPose)) return character;

  const poseComposer = buildPoseComposerItem(context);
  if (poseComposer && !isNoneLikeItem(poseComposer)) {
    character.push(poseComposer);
    return character;
  }

  const specialAction = context.locks?.specialActionId
    ? pickCategory('特殊動作 (Special Actions)', context.locks, () => true, sampleItem, false)
    : null;
  if (specialAction && !isNoneLikeItem(specialAction) && !isSocialShootingAction(specialAction)) return character;

  if (context.locks?.poseId) {
    pickCategory('姿勢與肢體語言 (Pose & Body Language)', context.locks, () => true, sampleItem, false);
  } else if (visibility === 'close') {
    return character;
  } else if (visibilityAtLeast(visibility, 'full')) {
    pickCategory('姿勢與肢體語言 (Pose & Body Language)', context.locks, (item) => poseSupportsLocationContext(item, context));
  } else if (!expression) {
    pickCategory(
      '姿勢與肢體語言 (Pose & Body Language)',
      context.locks,
      (item) => detailAllowed(item, context.framing) && poseSupportsLocationContext(item, context),
      sampleItem,
      false
    );
  }

  return character;
}

function buildWardrobe(context, locks, catalog) {
  const previewExclusions = context.previewRerollExclusions || EMPTY_PREVIEW_REROLL_EXCLUSIONS;
  const random = context.random || Math.random;
  const sampleItem = (items) => sample(items, random);
  const prepareSpecialOutfit = (item, role = null) => {
    const meta = { ...(item.meta || {}) };
    if (role) meta.specialOutfitRole = role;
    if (hasExplicitHairstyleLock(context, catalog, role)) {
      meta.suppressSpecialOutfitHairstyle = true;
    }
    return {
      ...item,
      id: role ? `${item.id}:${role}` : item.id,
      meta,
    };
  };
  const clonePresetForRole = (item, role) => ({
    ...item,
    id: `${item.id}:${role}`,
    meta: { ...(item.meta || {}), outfitRole: role },
  });
  const cloneWardrobePieceForRole = (item, role, layerSlot) => ({
    ...item,
    id: `${item.id}:${role}`,
    meta: { ...(item.meta || {}), wardrobeRole: role, layerSlot },
  });
  const presetPieces = [];
  const specialOutfitPieces = [];
  const pickResolvedLockItem = (items, lockedValue, { excludeIds = [], previousSelectionKeys = [] } = {}) => {
    if (!lockedValue) return null;
    if (isRandomLockValue(lockedValue)) {
      const excluded = new Set(excludeIds.filter(Boolean));
      previewExclusions.getIds(previousSelectionKeys).forEach((id) => excluded.add(id));
      const candidates = items.filter((item) => !isNoneLikeItem(item) && !excluded.has(item.id) && wardrobeFitsLocation(item, context.location));
      const fallbackCandidates = items.filter((item) => !isNoneLikeItem(item) && wardrobeFitsLocation(item, context.location));
      return sampleItem(candidates.length > 0 ? candidates : fallbackCandidates);
    }
    return findById(items, lockedValue);
  };

  if (context.subject.count === 2 && (locks.specialOutfitAId || locks.specialOutfitBId)) {
    const specialOutfits = catalog.flatCatalog.specialOutfits;
    const explicitSpecialB = locks.specialOutfitBId && !isRandomLockValue(locks.specialOutfitBId)
      ? findById(specialOutfits, locks.specialOutfitBId)
      : null;
    const specialA = pickResolvedLockItem(specialOutfits, locks.specialOutfitAId, {
      excludeIds: explicitSpecialB && !isNoneLikeItem(explicitSpecialB) ? [explicitSpecialB.id] : [],
      previousSelectionKeys: ['specialOutfitAId'],
    });
    const specialB = pickResolvedLockItem(specialOutfits, locks.specialOutfitBId, {
      excludeIds: specialA && !isNoneLikeItem(specialA) ? [specialA.id] : [],
      previousSelectionKeys: ['specialOutfitBId'],
    });
    if (specialA && !isNoneLikeItem(specialA)) specialOutfitPieces.push(prepareSpecialOutfit(specialA, 'a'));
    if (specialB && !isNoneLikeItem(specialB)) specialOutfitPieces.push(prepareSpecialOutfit(specialB, 'b'));
  } else {
    const specialOutfit = pickResolvedLockItem(catalog.flatCatalog.specialOutfits, locks.specialOutfitId, {
      previousSelectionKeys: ['specialOutfitId'],
    });
    if (specialOutfit && !isNoneLikeItem(specialOutfit)) specialOutfitPieces.push(prepareSpecialOutfit(specialOutfit));
  }

  if (specialOutfitPieces.length > 0) return specialOutfitPieces;

  if (context.subject.count === 2 && (locks.outfitPresetAId || locks.outfitPresetBId)) {
    const presets = catalog.flatCatalog.outfitPresets;
    const explicitPresetB = locks.outfitPresetBId && !isRandomLockValue(locks.outfitPresetBId)
      ? findById(presets, locks.outfitPresetBId)
      : null;
    const presetA = pickResolvedLockItem(presets, locks.outfitPresetAId, {
      excludeIds: explicitPresetB && !isNoneLikeItem(explicitPresetB) ? [explicitPresetB.id] : [],
      previousSelectionKeys: ['outfitPresetAId'],
    });
    const presetB = pickResolvedLockItem(presets, locks.outfitPresetBId, {
      excludeIds: presetA && !isNoneLikeItem(presetA) ? [presetA.id] : [],
      previousSelectionKeys: ['outfitPresetBId'],
    });
    const presetAIsNone = isNoneLikeItem(presetA);
    const presetBIsNone = isNoneLikeItem(presetB);
    const hasRolePreset = (presetA && !presetAIsNone) || (presetB && !presetBIsNone);

    if (hasRolePreset) {
      const randomDistinctPreset = (excludeId, previousSelectionKeys = []) => {
        const candidates = presets.filter((item) => !isNoneLikeItem(item) && item.id !== excludeId);
        const previewCandidates = previewExclusions.filterCandidates(candidates, previousSelectionKeys);
        return sampleItem(previewCandidates.length > 0 ? previewCandidates : candidates.length > 0 ? candidates : presets);
      };

      const resolvedA = presetAIsNone ? null : presetA || (!locks.outfitPresetAId && presetB && !presetBIsNone ? randomDistinctPreset(presetB.id, ['outfitPresetAId']) : null);
      const resolvedB = presetBIsNone ? null : presetB || (!locks.outfitPresetBId && resolvedA ? randomDistinctPreset(resolvedA.id, ['outfitPresetBId']) : null);

      presetPieces.push(...[resolvedA ? clonePresetForRole(resolvedA, 'a') : null, resolvedB ? clonePresetForRole(resolvedB, 'b') : null].filter(Boolean));
    }
  }

  const outfitPreset = pickResolvedLockItem(catalog.flatCatalog.outfitPresets, locks.outfitPresetId, {
    previousSelectionKeys: ['outfitPresetId'],
  });
  if (outfitPreset && !isNoneLikeItem(outfitPreset)) {
    presetPieces.push(outfitPreset);
  }

  const pieces = [];
  const visibility = context.framing.meta.visibility;
  const categoryLockMap = {
    '上身 (Tops)': 'topId',
    '上身圖案 (Top Surface Design)': 'topPatternId',
    '連身 (Dresses)': 'dressId',
    '褲裝 (Pants)': 'pantsId',
    '裙裝 (Skirts)': 'skirtId',
    '下身圖案 (Bottom Surface Design)': 'bottomPatternId',
    '襪類 (Legwear)': 'legwearId',
    [WARDROBE_OUTERWEAR_CATEGORY]: 'outerwearId',
    [WARDROBE_OUTERWEAR_FIT_CATEGORY]: 'outerwearFitId',
    '外套圖案 (Outerwear Surface Design)': 'outerwearPatternId',
    [WARDROBE_OUTERWEAR_OPENING_CATEGORY]: 'outerwearOpeningId',
    '外套穿法 (Outerwear Styling)': 'outerwearStylingId',
    '鞋款 (Shoes)': 'shoesId',
    '頭部配件 (Head Accessories)': 'headAccessoryId',
    [WARDROBE_EYEWEAR_CATEGORY]: 'eyewearId',
    [WARDROBE_EYEWEAR_COLOR_CATEGORY]: 'eyewearColorId',
    [WARDROBE_EYEWEAR_PLACEMENT_CATEGORY]: 'eyewearPlacementId',
    '耳環 (Earrings)': 'earringsId',
    '頸部 (Neck Accessories)': 'neckAccessoryId',
  };

  const addPiece = (item) => {
    if (!item || pieces.some((piece) => piece.id === item.id)) return;
    pieces.push(item);
  };
  presetPieces.forEach(addPiece);
  const hasOutfitPresetPiece = presetPieces.length > 0;
  const hasDuoLayerLock = context.subject.count === 2 && [
    'legwearAId',
    'outerwearAId',
    'outerwearAFitId',
    'outerwearAPatternId',
    'outerwearAOpeningId',
    'outerwearAStylingId',
    'shoesAId',
    'legwearBId',
    'outerwearBId',
    'outerwearBFitId',
    'outerwearBPatternId',
    'outerwearBOpeningId',
    'outerwearBStylingId',
    'shoesBId',
  ].some((key) => Boolean(locks?.[key]));
  const hasDuoAccessoryLock = context.subject.count === 2 && [
    'headAccessoryAId',
    'eyewearAId',
    'eyewearAColorId',
    'eyewearAPlacementId',
    'earringsAId',
    'neckAccessoryAId',
    'headAccessoryBId',
    'eyewearBId',
    'eyewearBColorId',
    'eyewearBPlacementId',
    'earringsBId',
    'neckAccessoryBId',
  ].some((key) => Boolean(locks?.[key]));

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

    if (random() > probability) return null;

    const candidates = categoryItems.filter(
      (item) =>
        (allowNoneWhenUnlocked || !isNoneLikeItem(item)) &&
        wardrobeFitsLocation(item, context.location) &&
        extraPredicate(item)
    );
    if (candidates.length === 0) return null;
    const picked = sampleItem(candidates);
    addPiece(picked);
    return picked;
  };
  const addRoleLockedPiece = (categoryKey, lockKey, role, layerSlot) => {
    const categoryItems = getByKey(catalog.catalog.wardrobe, categoryKey);
    const lockedValue = locks?.[lockKey];
    if (!lockedValue) return null;
    const lockedItem = findById(categoryItems, lockedValue);
    if (!lockedItem) return null;
    const clonedItem = cloneWardrobePieceForRole(lockedItem, role, layerSlot);
    addPiece(clonedItem);
    return clonedItem;
  };

  const dressItems = getByKey(catalog.catalog.wardrobe, '連身 (Dresses)');
  const topItems = getByKey(catalog.catalog.wardrobe, '上身 (Tops)');
  const pantsItems = getByKey(catalog.catalog.wardrobe, '褲裝 (Pants)');
  const skirtItems = getByKey(catalog.catalog.wardrobe, '裙裝 (Skirts)');
  const resolveLockState = (items, lockedValue) => {
    const isExplicitRandom = isRandomLockValue(lockedValue);
    const lockedItem = Array.isArray(lockedValue)
      ? lockedValue.map((id) => findById(items, id)).find(Boolean)
      : (lockedValue && !isExplicitRandom ? findById(items, lockedValue) : null);
    return {
      lockedItem,
      isExplicitRandom,
      isExplicitNone: Boolean(lockedItem && isNoneLikeItem(lockedItem)),
      specifiedItem: lockedItem && !isNoneLikeItem(lockedItem) ? lockedItem : null,
    };
  };
  const outfitPresetState = resolveLockState(catalog.flatCatalog.outfitPresets, locks?.outfitPresetId);
  const dressState = resolveLockState(dressItems, locks?.dressId);
  const topState = resolveLockState(topItems, locks?.topId);
  const pantsState = resolveLockState(pantsItems, locks?.pantsId);
  const skirtState = resolveLockState(skirtItems, locks?.skirtId);
  const duoRoleWardrobeKeys = [
    'topAId',
    'topBId',
    'topFitAId',
    'topFitBId',
    'topStylingAId',
    'topStylingBId',
    'topBottomPaletteAId',
    'topBottomPaletteBId',
    'topAColorId',
    'topBColorId',
    'topAPatternId',
    'topBPatternId',
    'dressAId',
    'dressBId',
    'dressAColorId',
    'dressBColorId',
    'pantsAId',
    'pantsBId',
    'skirtAId',
    'skirtBId',
    'bottomFitAId',
    'bottomFitBId',
    'bottomRiseAId',
    'bottomRiseBId',
    'bottomAColorId',
    'bottomBColorId',
    'bottomAPatternId',
    'bottomBPatternId',
  ];
  const sharedMainWardrobeKeys = [
    'topId',
    'topFitId',
    'topStylingId',
    'topBottomPaletteId',
    'topColorId',
    'topPatternId',
    'dressId',
    'dressColorId',
    'pantsId',
    'skirtId',
    'bottomFitId',
    'bottomRiseId',
    'bottomColorId',
    'bottomPatternId',
  ];
  const hasDuoRoleWardrobeLock = context.subject.count === 2 && duoRoleWardrobeKeys.some((key) => Boolean(locks?.[key]));
  const hasSharedMainWardrobeLock = sharedMainWardrobeKeys.some((key) => Boolean(locks?.[key]));
  const useDuoRoleWardrobe = context.subject.count === 2 && (hasDuoRoleWardrobeLock || !hasSharedMainWardrobeLock);
  const pickRandomWardrobeItem = (items, { allowNone = false, predicate = () => true, previousSelectionKeys = [] } = {}) => {
    const candidates = items.filter(
      (item) => (allowNone || !isNoneLikeItem(item)) && wardrobeFitsLocation(item, context.location) && predicate(item)
    );
    if (candidates.length === 0) return null;
    const picked = sampleItem(previewExclusions.filterCandidates(candidates, previousSelectionKeys));
    addPiece(picked);
    return picked;
  };

  let topPiece = null;
  let dressPiece = null;
  let hasBottomPiece = false;

  const firstSpecifiedMainLayer = (outfitPresetState.specifiedItem || outfitPresetState.isExplicitRandom)
    ? 'outfit'
    : (dressState.specifiedItem || dressState.isExplicitRandom)
      ? 'dress'
      : topState.specifiedItem
        ? 'top'
        : pantsState.specifiedItem
          ? 'pants'
          : skirtState.specifiedItem
            ? 'skirt'
            : null;

  const ensureTopPiece = () => {
    if (topPiece && !isNoneLikeItem(topPiece)) return topPiece;
    if (topState.isExplicitNone) {
      topPiece = null;
      return null;
    }
    if (topState.specifiedItem) {
      topPiece = topState.specifiedItem;
      addPiece(topPiece);
      return topPiece;
    }
    topPiece = pickRandomWardrobeItem(topItems, { previousSelectionKeys: ['topId'] });
    return topPiece;
  };

  const ensureBottomPiece = () => {
    if (hasBottomPiece) return true;

    if (pantsState.specifiedItem) {
      addPiece(pantsState.specifiedItem);
      hasBottomPiece = true;
      return true;
    }

    if (skirtState.specifiedItem) {
      addPiece(skirtState.specifiedItem);
      hasBottomPiece = true;
      return true;
    }

    const randomPants = pantsState.isExplicitNone
      ? null
      : pickRandomWardrobeItem(pantsItems, { allowNone: true, previousSelectionKeys: ['pantsId'] });
    if (randomPants && !isNoneLikeItem(randomPants)) {
      hasBottomPiece = true;
      return true;
    }

    if (skirtState.isExplicitNone) {
      hasBottomPiece = false;
      return false;
    }

    const forcedSkirt = pickRandomWardrobeItem(skirtItems, { previousSelectionKeys: ['skirtId'] });
    hasBottomPiece = Boolean(forcedSkirt && !isNoneLikeItem(forcedSkirt));
    return hasBottomPiece;
  };

  const resolveWardrobeModifier = (lockedValue, options, getOption, token, { allowNoneWhenUnlocked = true } = {}) => {
    const lockedOption = lockedValue ? getOption(lockedValue) : null;
    if (lockedOption) {
      return isNoneLikeItem(lockedOption) ? null : createSyntheticWardrobeModifier(token, lockedOption);
    }

    const candidates = options.filter((option) => allowNoneWhenUnlocked || !isNoneLikeItem(option));
    if (candidates.length === 0) return null;
    const pickedOption = sampleItem(candidates);
    return pickedOption && !isNoneLikeItem(pickedOption)
      ? createSyntheticWardrobeModifier(token, pickedOption)
      : null;
  };

  const addRoleModifier = (lockedValue, options, getOption, token, role, layerSlot) => {
    const modifier = resolveWardrobeModifier(lockedValue, options, getOption, token);
    if (!modifier) return null;
    const clonedModifier = cloneWardrobePieceForRole(modifier, role, layerSlot);
    addPiece(clonedModifier);
    return clonedModifier;
  };

  const duoRoleMainPickedIds = {
    dress: new Set(),
    top: new Set(),
    pants: new Set(),
    skirt: new Set(),
  };
  const rememberRoleMainWardrobeItem = (item, layerSlot) => {
    if (!duoRoleMainPickedIds[layerSlot] || !item || isNoneLikeItem(item)) return;
    const baseId = getBaseWardrobeItemId(item);
    if (baseId) duoRoleMainPickedIds[layerSlot].add(baseId);
  };
  const roleMainWardrobeSelectionKeys = {
    a: {
      dress: 'dressAId',
      top: 'topAId',
      pants: 'pantsAId',
      skirt: 'skirtAId',
    },
    b: {
      dress: 'dressBId',
      top: 'topBId',
      pants: 'pantsBId',
      skirt: 'skirtBId',
    },
  };

  const pickRoleWardrobeItem = (items, role, layerSlot, { allowNone = false, excludeBaseIds = duoRoleMainPickedIds[layerSlot] } = {}) => {
    const candidates = items.filter((item) => (allowNone || !isNoneLikeItem(item)) && wardrobeFitsLocation(item, context.location));
    if (candidates.length === 0) return null;
    const previousSelectionKeys = [roleMainWardrobeSelectionKeys[role]?.[layerSlot]].filter(Boolean);
    const previousSelectionIds = previewExclusions.getIds(previousSelectionKeys);
    const distinctCandidates = candidates.filter((item) => {
      if (isNoneLikeItem(item)) return true;
      const baseId = getBaseWardrobeItemId(item);
      return !excludeBaseIds?.has(baseId) && !previousSelectionIds.has(baseId);
    });
    const picked = sampleItem(distinctCandidates.length > 0 ? distinctCandidates : candidates);
    const clonedItem = cloneWardrobePieceForRole(picked, role, layerSlot);
    addPiece(clonedItem);
    rememberRoleMainWardrobeItem(clonedItem, layerSlot);
    return clonedItem;
  };

  const addLockedRoleWardrobeItem = (items, lockedValue, role, layerSlot) => {
    const lockedItem = lockedValue ? findById(items, lockedValue) : null;
    if (!lockedItem) return null;
    const clonedItem = cloneWardrobePieceForRole(lockedItem, role, layerSlot);
    addPiece(clonedItem);
    rememberRoleMainWardrobeItem(clonedItem, layerSlot);
    return clonedItem;
  };

  const addRolePattern = (items, lockedValue, role, layerSlot, probability) => {
    const lockedItem = lockedValue ? findById(items, lockedValue) : null;
    if (lockedItem) {
      if (isNoneLikeItem(lockedItem)) return null;
      const clonedItem = cloneWardrobePieceForRole(lockedItem, role, layerSlot);
      addPiece(clonedItem);
      return clonedItem;
    }
    if (random() > probability) return null;
    return pickRoleWardrobeItem(items, role, layerSlot, { allowNone: false });
  };

  if (useDuoRoleWardrobe) {
    const topPatternItems = getByKey(catalog.catalog.wardrobe, '上身圖案 (Top Surface Design)');
    const bottomPatternItems = getByKey(catalog.catalog.wardrobe, '下身圖案 (Bottom Surface Design)');
    const roleConfigs = [
      {
        role: 'a',
        presetId: locks?.outfitPresetAId,
        dressId: locks?.dressAId,
        topId: locks?.topAId,
        pantsId: locks?.pantsAId,
        skirtId: locks?.skirtAId,
        topFitId: locks?.topFitAId,
        topStylingId: locks?.topStylingAId,
        topPatternId: locks?.topAPatternId,
        bottomFitId: locks?.bottomFitAId,
        bottomRiseId: locks?.bottomRiseAId,
        bottomPatternId: locks?.bottomAPatternId,
      },
      {
        role: 'b',
        presetId: locks?.outfitPresetBId,
        dressId: locks?.dressBId,
        topId: locks?.topBId,
        pantsId: locks?.pantsBId,
        skirtId: locks?.skirtBId,
        topFitId: locks?.topFitBId,
        topStylingId: locks?.topStylingBId,
        topPatternId: locks?.topBPatternId,
        bottomFitId: locks?.bottomFitBId,
        bottomRiseId: locks?.bottomRiseBId,
        bottomPatternId: locks?.bottomBPatternId,
      },
    ];

    roleConfigs.forEach((config) => {
      [
        [dressItems, config.dressId, 'dress'],
        [topItems, config.topId, 'top'],
        [pantsItems, config.pantsId, 'pants'],
        [skirtItems, config.skirtId, 'skirt'],
      ].forEach(([items, lockedValue, layerSlot]) => {
        const lockedItem = lockedValue ? findById(items, lockedValue) : null;
        rememberRoleMainWardrobeItem(lockedItem, layerSlot);
      });
    });

    roleConfigs.forEach((config) => {
      const presetRoleState = resolveLockState(catalog.flatCatalog.outfitPresets, config.presetId);
      if (presetRoleState.specifiedItem || presetRoleState.isExplicitRandom) return;

      const dressRoleState = resolveLockState(dressItems, config.dressId);
      const topRoleState = resolveLockState(topItems, config.topId);
      const pantsRoleState = resolveLockState(pantsItems, config.pantsId);
      const skirtRoleState = resolveLockState(skirtItems, config.skirtId);
      const firstSpecifiedRoleLayer = (dressRoleState.specifiedItem || dressRoleState.isExplicitRandom)
        ? 'dress'
        : topRoleState.specifiedItem
          ? 'top'
          : pantsRoleState.specifiedItem
            ? 'pants'
            : skirtRoleState.specifiedItem
              ? 'skirt'
              : null;

      let roleHasTop = false;
      let roleHasDress = false;
      let roleHasBottom = false;

      const ensureRoleTop = () => {
        if (roleHasTop) return true;
        if (topRoleState.specifiedItem) {
          addLockedRoleWardrobeItem(topItems, config.topId, config.role, 'top');
          roleHasTop = true;
          return true;
        }
        const randomTop = topRoleState.isExplicitNone ? null : pickRoleWardrobeItem(topItems, config.role, 'top');
        roleHasTop = Boolean(randomTop && !isNoneLikeItem(randomTop));
        return roleHasTop;
      };

      const ensureRoleBottom = () => {
        if (roleHasBottom) return true;
        if (pantsRoleState.specifiedItem) {
          addLockedRoleWardrobeItem(pantsItems, config.pantsId, config.role, 'pants');
          roleHasBottom = true;
          return true;
        }

        if (skirtRoleState.specifiedItem) {
          addLockedRoleWardrobeItem(skirtItems, config.skirtId, config.role, 'skirt');
          roleHasBottom = true;
          return true;
        }

        const randomPants = pantsRoleState.isExplicitNone
          ? null
          : pickRoleWardrobeItem(pantsItems, config.role, 'pants', { allowNone: true });
        if (randomPants && !isNoneLikeItem(randomPants)) {
          roleHasBottom = true;
          return true;
        }

        if (skirtRoleState.isExplicitNone) {
          roleHasBottom = false;
          return false;
        }

        const forcedSkirt = pickRoleWardrobeItem(skirtItems, config.role, 'skirt');
        roleHasBottom = Boolean(forcedSkirt && !isNoneLikeItem(forcedSkirt));
        return roleHasBottom;
      };

      if (firstSpecifiedRoleLayer === 'dress') {
        if (dressRoleState.isExplicitRandom) {
          pickRoleWardrobeItem(dressItems, config.role, 'dress');
        } else {
          addLockedRoleWardrobeItem(dressItems, config.dressId, config.role, 'dress');
        }
        roleHasDress = true;
      } else if (firstSpecifiedRoleLayer === 'top') {
        ensureRoleTop();
        ensureRoleBottom();
      } else if (firstSpecifiedRoleLayer === 'pants') {
        ensureRoleTop();
        addLockedRoleWardrobeItem(pantsItems, config.pantsId, config.role, 'pants');
        roleHasBottom = true;
      } else if (firstSpecifiedRoleLayer === 'skirt') {
        ensureRoleTop();
        addLockedRoleWardrobeItem(skirtItems, config.skirtId, config.role, 'skirt');
        roleHasBottom = true;
      } else {
        const randomDress = dressRoleState.isExplicitNone ? null : pickRoleWardrobeItem(dressItems, config.role, 'dress');
        if (randomDress && !isNoneLikeItem(randomDress)) {
          roleHasDress = true;
        } else {
          ensureRoleTop();
          ensureRoleBottom();
        }
      }

      if (!roleHasDress && roleHasTop) {
        addRoleModifier(config.topFitId, TOP_FIT_OPTIONS, getTopFitOption, '上身版型-top-fit', config.role, 'topFit');
        addRoleModifier(config.topStylingId, TOP_STYLING_OPTIONS, getTopStylingOption, '上身穿法-top-styling', config.role, 'topStyling');
        addRolePattern(topPatternItems, config.topPatternId, config.role, 'topPattern', 0.35);
      }

      if (!roleHasDress && roleHasBottom) {
        addRoleModifier(config.bottomFitId, BOTTOM_FIT_OPTIONS, getBottomFitOption, '下身版型-bottom-fit', config.role, 'bottomFit');
        addRoleModifier(config.bottomRiseId, BOTTOM_RISE_OPTIONS, getBottomRiseOption, '下身腰線-bottom-rise', config.role, 'bottomRise');
        addRolePattern(bottomPatternItems, config.bottomPatternId, config.role, 'bottomPattern', 0.3);
      }
    });
  } else if (hasOutfitPresetPiece) {
    // Duo preset pieces already define the main body styling.
  } else if (firstSpecifiedMainLayer === 'outfit') {
    if (outfitPresetState.isExplicitRandom) {
      pickRandomWardrobeItem(catalog.flatCatalog.outfitPresets, { previousSelectionKeys: ['outfitPresetId'] });
    } else {
      addPiece(outfitPresetState.specifiedItem);
    }
  } else if (firstSpecifiedMainLayer === 'dress') {
    dressPiece = dressState.isExplicitRandom
      ? pickRandomWardrobeItem(dressItems, { previousSelectionKeys: ['dressId'] })
      : dressState.specifiedItem;
    addPiece(dressPiece);
  } else if (firstSpecifiedMainLayer === 'top') {
    ensureTopPiece();
    ensureBottomPiece();
  } else if (firstSpecifiedMainLayer === 'pants') {
    ensureTopPiece();
    addPiece(pantsState.specifiedItem);
    hasBottomPiece = true;
  } else if (firstSpecifiedMainLayer === 'skirt') {
    ensureTopPiece();
    addPiece(skirtState.specifiedItem);
    hasBottomPiece = true;
  } else {
    const randomPreset = outfitPresetState.isExplicitNone
      ? null
      : pickRandomWardrobeItem(catalog.flatCatalog.outfitPresets, { allowNone: true, previousSelectionKeys: ['outfitPresetId'] });
    if (randomPreset && !isNoneLikeItem(randomPreset)) {
      // Main outfit resolved at the preset layer.
    } else {
      const randomDress = dressState.isExplicitNone ? null : pickRandomWardrobeItem(dressItems, { previousSelectionKeys: ['dressId'] });
      if (randomDress && !isNoneLikeItem(randomDress)) {
        dressPiece = randomDress;
      } else {
        ensureTopPiece();
        ensureBottomPiece();
      }
    }
  }

  const hasRoleTopPiece = pieces.some((piece) => piece.meta?.wardrobeRole && piece.meta?.layerSlot === 'top' && !isNoneLikeItem(piece));
  const hasRoleDressPiece = pieces.some((piece) => piece.meta?.wardrobeRole && piece.meta?.layerSlot === 'dress' && !isNoneLikeItem(piece));
  const hasRoleBottomPiece = pieces.some((piece) => piece.meta?.wardrobeRole && ['pants', 'skirt'].includes(piece.meta?.layerSlot) && !isNoneLikeItem(piece));
  const hasTopPiece = useDuoRoleWardrobe
    ? hasRoleTopPiece
    : (Array.isArray(topPiece)
        ? topPiece.some((item) => item && !isNoneLikeItem(item))
        : Boolean(topPiece && !isNoneLikeItem(topPiece)));
  const hasDressPiece = useDuoRoleWardrobe
    ? hasRoleDressPiece
    : (Array.isArray(dressPiece)
        ? dressPiece.some((item) => item && !isNoneLikeItem(item))
        : Boolean(dressPiece && !isNoneLikeItem(dressPiece)));
  hasBottomPiece = useDuoRoleWardrobe ? hasRoleBottomPiece : hasBottomPiece;

  if (visibility === 'close') {
    const matchesCloseupItem = (item, targetId) => {
      if (!item || !targetId) return false;
      return item.id === targetId || item.id.startsWith(`${targetId}:`);
    };
    const matchesSyntheticCloseupModifier = (item, token, targetId) => {
      if (!item || !targetId) return false;
      return item.id === `wardrobe:${token}:${targetId}` || item.id.startsWith(`wardrobe:${token}:${targetId}:`);
    };
    const keepExplicitCloseupWardrobeItem = (item) => {
      if (!item || isNoneLikeItem(item)) return false;
      if (item.meta?.tags?.includes('accessory_small')) return true;
      if (specialOutfitPieces.some((piece) => matchesCloseupItem(item, piece.id))) return true;
      if (outfitPresetState.specifiedItem && matchesCloseupItem(item, outfitPresetState.specifiedItem.id)) return true;
      if (dressState.specifiedItem && matchesCloseupItem(item, dressState.specifiedItem.id)) return true;
      if (topState.specifiedItem && matchesCloseupItem(item, topState.specifiedItem.id)) return true;
      if (pantsState.specifiedItem && matchesCloseupItem(item, pantsState.specifiedItem.id)) return true;
      if (skirtState.specifiedItem && matchesCloseupItem(item, skirtState.specifiedItem.id)) return true;
      if (locks?.topPatternId && matchesCloseupItem(item, locks.topPatternId)) return true;
      if (locks?.outerwearId && matchesCloseupItem(item, locks.outerwearId)) return true;
      if (locks?.outerwearFitId && matchesCloseupItem(item, locks.outerwearFitId)) return true;
      if (locks?.outerwearPatternId && matchesCloseupItem(item, locks.outerwearPatternId)) return true;
      if (locks?.outerwearOpeningId && matchesCloseupItem(item, locks.outerwearOpeningId)) return true;
      if (locks?.outerwearStylingId && matchesCloseupItem(item, locks.outerwearStylingId)) return true;
      if (locks?.legwearId && matchesCloseupItem(item, locks.legwearId)) return true;
      if (locks?.shoesId && matchesCloseupItem(item, locks.shoesId)) return true;
      if (locks?.neckAccessoryId && matchesCloseupItem(item, locks.neckAccessoryId)) return true;
      if (locks?.topFitId && matchesSyntheticCloseupModifier(item, '上身版型-top-fit', locks.topFitId)) return true;
      if (locks?.topStylingId && matchesSyntheticCloseupModifier(item, '上身穿法-top-styling', locks.topStylingId)) return true;
      return false;
    };

    if (context.subject.count === 2) {
      addRoleLockedPiece('頭部配件 (Head Accessories)', 'headAccessoryAId', 'a', 'headAccessory');
      addRoleLockedPiece(WARDROBE_EYEWEAR_CATEGORY, 'eyewearAId', 'a', 'eyewear');
      addRoleLockedPiece(WARDROBE_EYEWEAR_COLOR_CATEGORY, 'eyewearAColorId', 'a', 'eyewearColor');
      addRoleLockedPiece(WARDROBE_EYEWEAR_PLACEMENT_CATEGORY, 'eyewearAPlacementId', 'a', 'eyewearPlacement');
      addRoleLockedPiece('耳環 (Earrings)', 'earringsAId', 'a', 'earrings');
      addRoleLockedPiece('頭部配件 (Head Accessories)', 'headAccessoryBId', 'b', 'headAccessory');
      addRoleLockedPiece(WARDROBE_EYEWEAR_CATEGORY, 'eyewearBId', 'b', 'eyewear');
      addRoleLockedPiece(WARDROBE_EYEWEAR_COLOR_CATEGORY, 'eyewearBColorId', 'b', 'eyewearColor');
      addRoleLockedPiece(WARDROBE_EYEWEAR_PLACEMENT_CATEGORY, 'eyewearBPlacementId', 'b', 'eyewearPlacement');
      addRoleLockedPiece('耳環 (Earrings)', 'earringsBId', 'b', 'earrings');
    }
    if (!hasDuoAccessoryLock) {
      maybePick('頭部配件 (Head Accessories)', 0.28, () => true, { allowNoneWhenUnlocked: true });
      const eyewearPiece = maybePick(WARDROBE_EYEWEAR_CATEGORY, 0.35, () => true, { allowNoneWhenUnlocked: true });
      const hasEyewearPiece = Array.isArray(eyewearPiece)
        ? eyewearPiece.some((item) => item && !isNoneLikeItem(item))
        : Boolean(eyewearPiece && !isNoneLikeItem(eyewearPiece));
      if (hasEyewearPiece) {
        maybePick(WARDROBE_EYEWEAR_COLOR_CATEGORY, locks?.eyewearColorId ? 1 : 0.85, () => true, { allowNoneWhenUnlocked: true });
        maybePick(WARDROBE_EYEWEAR_PLACEMENT_CATEGORY, locks?.eyewearPlacementId ? 1 : 1, () => true, { allowNoneWhenUnlocked: false });
      }
      maybePick('耳環 (Earrings)', 0.45, () => true, { allowNoneWhenUnlocked: true });
    }
    if (!useDuoRoleWardrobe) {
      const hasCloseupOuterwearLock = Boolean(locks?.outerwearId || locks?.outerwearFitId || locks?.outerwearPatternId || locks?.outerwearOpeningId || locks?.outerwearStylingId);
      const closeupOuterwearPiece = hasCloseupOuterwearLock
        ? maybePick('外套 (Outerwear)', 1, () => true, { allowNoneWhenUnlocked: true })
        : null;
      const hasCloseupOuterwearPiece = Array.isArray(closeupOuterwearPiece)
        ? closeupOuterwearPiece.some((item) => item && !isNoneLikeItem(item))
        : Boolean(closeupOuterwearPiece && !isNoneLikeItem(closeupOuterwearPiece));
      if (hasCloseupOuterwearPiece) {
        if (locks?.outerwearFitId) maybePick('外套版型 (Outerwear Fit)', 1, () => true, { allowNoneWhenUnlocked: true });
        if (locks?.outerwearPatternId) maybePick('外套圖案 (Outerwear Surface Design)', 1, () => true, { allowNoneWhenUnlocked: true });
        if (locks?.outerwearOpeningId) maybePick('外套開合 (Outerwear Opening)', 1, () => true, { allowNoneWhenUnlocked: true });
        if (locks?.outerwearStylingId) maybePick('外套穿法 (Outerwear Styling)', 1, () => true, { allowNoneWhenUnlocked: true });
      }
      if (locks?.legwearId) maybePick('襪類 (Legwear)', 1, () => true, { allowNoneWhenUnlocked: true });
      if (locks?.shoesId) maybePick('鞋款 (Shoes)', 1, () => true, { allowNoneWhenUnlocked: true });
      if (locks?.neckAccessoryId) maybePick('頸部 (Neck Accessories)', 1, () => true, { allowNoneWhenUnlocked: true });
    }
    return pieces.filter(keepExplicitCloseupWardrobeItem);
  }

  const hasOutfitPresetPieceResolved = pieces.some((piece) => piece.id?.includes('wardrobe:套裝-outfit-presets:') && !isNoneLikeItem(piece));

  if (!useDuoRoleWardrobe && !hasOutfitPresetPieceResolved && !hasTopPiece && !hasDressPiece && !topState.isExplicitNone) {
    const fallbackTop = getByKey(catalog.catalog.wardrobe, '上身 (Tops)').find(
      (item) => !isNoneLikeItem(item) && wardrobeFitsLocation(item, context.location)
    );
    topPiece = fallbackTop;
    addPiece(fallbackTop);
  }

  const hasResolvedTopPiece = Boolean(topPiece && !isNoneLikeItem(topPiece));
  const bottomPiece = pieces.find(
    (piece) => !isNoneLikeItem(piece) && (piece.id?.includes('wardrobe:褲裝-pants:') || piece.id?.includes('wardrobe:裙裝-skirts:'))
  );
  const hasResolvedBottomPiece = useDuoRoleWardrobe ? hasRoleBottomPiece : Boolean(bottomPiece);

  if (!useDuoRoleWardrobe && !hasOutfitPresetPieceResolved && !hasDressPiece && hasResolvedTopPiece) {
    addPiece(resolveWardrobeModifier(locks?.topFitId, TOP_FIT_OPTIONS, getTopFitOption, '上身版型-top-fit'));
    addPiece(resolveWardrobeModifier(locks?.topStylingId, TOP_STYLING_OPTIONS, getTopStylingOption, '上身穿法-top-styling'));
  }

  if (!useDuoRoleWardrobe && !hasOutfitPresetPieceResolved && !hasDressPiece && hasResolvedBottomPiece) {
    addPiece(resolveWardrobeModifier(locks?.bottomFitId, BOTTOM_FIT_OPTIONS, getBottomFitOption, '下身版型-bottom-fit'));
    addPiece(resolveWardrobeModifier(locks?.bottomRiseId, BOTTOM_RISE_OPTIONS, getBottomRiseOption, '下身腰線-bottom-rise'));
  }

  if (!useDuoRoleWardrobe && !hasOutfitPresetPieceResolved && ((hasResolvedTopPiece && !hasDressPiece) || locks?.topPatternId)) {
    maybePick('上身圖案 (Top Surface Design)', 0.35, () => true, { allowNoneWhenUnlocked: false });
  }

  if (!useDuoRoleWardrobe && !hasOutfitPresetPieceResolved && hasBottomPiece) {
    maybePick('下身圖案 (Bottom Surface Design)', 0.3, () => true, { allowNoneWhenUnlocked: false });
  }

  const hasSingleOuterwearLock = Boolean(
    locks?.outerwearId ||
    locks?.outerwearFitId ||
    locks?.outerwearPatternId ||
    locks?.outerwearOpeningId ||
    locks?.outerwearStylingId
  );

  if (!useDuoRoleWardrobe && ((hasOutfitPresetPieceResolved && !hasDuoLayerLock) || hasDressPiece || hasBottomPiece || hasSingleOuterwearLock)) {
    const outerwearProbability = locks?.outerwearId
      ? 1
      : context.location.meta.tags.includes('outdoor')
        ? (hasOutfitPresetPieceResolved ? 0.55 : 0.6)
        : (hasOutfitPresetPieceResolved ? 0.3 : 0.35);
    const outerwearPiece = maybePick('外套 (Outerwear)', hasSingleOuterwearLock ? 1 : outerwearProbability, () => true, { allowNoneWhenUnlocked: true });
    const hasOuterwearPiece = Array.isArray(outerwearPiece)
      ? outerwearPiece.some((item) => item && !isNoneLikeItem(item))
      : Boolean(outerwearPiece && !isNoneLikeItem(outerwearPiece));

    if (hasOuterwearPiece) {
      maybePick('外套版型 (Outerwear Fit)', locks?.outerwearFitId ? 1 : 0.55, () => true, { allowNoneWhenUnlocked: true });
      maybePick('外套圖案 (Outerwear Surface Design)', locks?.outerwearPatternId ? 1 : 0.3, () => true, { allowNoneWhenUnlocked: true });
      maybePick('外套開合 (Outerwear Opening)', locks?.outerwearOpeningId ? 1 : 0.55, () => true, { allowNoneWhenUnlocked: true });
      maybePick('外套穿法 (Outerwear Styling)', locks?.outerwearStylingId ? 1 : 0.55, () => true, { allowNoneWhenUnlocked: true });
    }
  }

  if (!useDuoRoleWardrobe && (hasOutfitPresetPieceResolved || hasBottomPiece || hasDressPiece || locks?.legwearId) && !hasDuoLayerLock) {
    maybePick('襪類 (Legwear)', frameShowsAtLeast(visibility, 'medium') ? 0.35 : 0.15, (item) => {
      if (item.meta.tags.includes('legwear') && item.en.includes('bare legs')) return true;
      return true;
    }, { allowNoneWhenUnlocked: true });
  }

  if (!useDuoRoleWardrobe && !frameShowsAtLeast(visibility, 'medium') && locks?.legwearId) {
    maybePick('襪類 (Legwear)', 1, (item) => {
      if (item.meta.tags.includes('legwear') && item.en.includes('bare legs')) return true;
      if (pieces.some((piece) => piece.meta.tags.includes('pants'))) return item.en.includes('bare legs');
      return true;
    }, { allowNoneWhenUnlocked: true });
  }

  if (!useDuoRoleWardrobe && !frameShowsAtLeast(visibility, 'medium') && hasSingleOuterwearLock) {
    const outerwearPiece = maybePick('外套 (Outerwear)', 1, () => true, { allowNoneWhenUnlocked: true });
    const hasOuterwearPiece = Array.isArray(outerwearPiece)
      ? outerwearPiece.some((item) => item && !isNoneLikeItem(item))
      : Boolean(outerwearPiece && !isNoneLikeItem(outerwearPiece));
    if (hasOuterwearPiece) {
      maybePick('外套版型 (Outerwear Fit)', 1, () => true, { allowNoneWhenUnlocked: true });
      maybePick('外套圖案 (Outerwear Surface Design)', 1, () => true, { allowNoneWhenUnlocked: true });
      maybePick('外套開合 (Outerwear Opening)', 1, () => true, { allowNoneWhenUnlocked: true });
      maybePick('外套穿法 (Outerwear Styling)', 1, () => true, { allowNoneWhenUnlocked: true });
    }
  }

  if (!useDuoRoleWardrobe && ((frameShowsAtLeast(visibility, 'full') && !hasDuoLayerLock) || locks?.shoesId)) {
    maybePick('鞋款 (Shoes)', 1, () => true, { allowNoneWhenUnlocked: true });
  }

  if (context.subject.count === 2) {
    addRoleLockedPiece('襪類 (Legwear)', 'legwearAId', 'a', 'legwear');
    addRoleLockedPiece('外套 (Outerwear)', 'outerwearAId', 'a', 'outerwear');
    addRoleLockedPiece('外套版型 (Outerwear Fit)', 'outerwearAFitId', 'a', 'outerwearFit');
    addRoleLockedPiece('外套圖案 (Outerwear Surface Design)', 'outerwearAPatternId', 'a', 'outerwearPattern');
    addRoleLockedPiece('外套開合 (Outerwear Opening)', 'outerwearAOpeningId', 'a', 'outerwearOpening');
    addRoleLockedPiece('外套穿法 (Outerwear Styling)', 'outerwearAStylingId', 'a', 'outerwearStyling');
    addRoleLockedPiece('鞋款 (Shoes)', 'shoesAId', 'a', 'shoes');
    addRoleLockedPiece('襪類 (Legwear)', 'legwearBId', 'b', 'legwear');
    addRoleLockedPiece('外套 (Outerwear)', 'outerwearBId', 'b', 'outerwear');
    addRoleLockedPiece('外套版型 (Outerwear Fit)', 'outerwearBFitId', 'b', 'outerwearFit');
    addRoleLockedPiece('外套圖案 (Outerwear Surface Design)', 'outerwearBPatternId', 'b', 'outerwearPattern');
    addRoleLockedPiece('外套開合 (Outerwear Opening)', 'outerwearBOpeningId', 'b', 'outerwearOpening');
    addRoleLockedPiece('外套穿法 (Outerwear Styling)', 'outerwearBStylingId', 'b', 'outerwearStyling');
    addRoleLockedPiece('鞋款 (Shoes)', 'shoesBId', 'b', 'shoes');
    addRoleLockedPiece('頭部配件 (Head Accessories)', 'headAccessoryAId', 'a', 'headAccessory');
    addRoleLockedPiece(WARDROBE_EYEWEAR_CATEGORY, 'eyewearAId', 'a', 'eyewear');
    addRoleLockedPiece(WARDROBE_EYEWEAR_COLOR_CATEGORY, 'eyewearAColorId', 'a', 'eyewearColor');
    addRoleLockedPiece(WARDROBE_EYEWEAR_PLACEMENT_CATEGORY, 'eyewearAPlacementId', 'a', 'eyewearPlacement');
    addRoleLockedPiece('耳環 (Earrings)', 'earringsAId', 'a', 'earrings');
    addRoleLockedPiece('頸部 (Neck Accessories)', 'neckAccessoryAId', 'a', 'neckAccessory');
    addRoleLockedPiece('頭部配件 (Head Accessories)', 'headAccessoryBId', 'b', 'headAccessory');
    addRoleLockedPiece(WARDROBE_EYEWEAR_CATEGORY, 'eyewearBId', 'b', 'eyewear');
    addRoleLockedPiece(WARDROBE_EYEWEAR_COLOR_CATEGORY, 'eyewearBColorId', 'b', 'eyewearColor');
    addRoleLockedPiece(WARDROBE_EYEWEAR_PLACEMENT_CATEGORY, 'eyewearBPlacementId', 'b', 'eyewearPlacement');
    addRoleLockedPiece('耳環 (Earrings)', 'earringsBId', 'b', 'earrings');
    addRoleLockedPiece('頸部 (Neck Accessories)', 'neckAccessoryBId', 'b', 'neckAccessory');
  }

  if (!hasDuoAccessoryLock) {
    maybePick('頭部配件 (Head Accessories)', visibilityAtLeast(visibility, 'portrait') ? 0.28 : 0.12, () => true, { allowNoneWhenUnlocked: true });
    const eyewearPiece = maybePick(WARDROBE_EYEWEAR_CATEGORY, visibilityAtLeast(visibility, 'portrait') ? 0.35 : 0.15, () => true, { allowNoneWhenUnlocked: true });
    const hasEyewearPiece = Array.isArray(eyewearPiece)
      ? eyewearPiece.some((item) => item && !isNoneLikeItem(item))
      : Boolean(eyewearPiece && !isNoneLikeItem(eyewearPiece));
    if (hasEyewearPiece || locks?.eyewearColorId || locks?.eyewearPlacementId) {
      if (!hasEyewearPiece && (locks?.eyewearColorId || locks?.eyewearPlacementId)) {
        maybePick(WARDROBE_EYEWEAR_CATEGORY, 1, () => true, { allowNoneWhenUnlocked: false });
      }
      maybePick(WARDROBE_EYEWEAR_COLOR_CATEGORY, locks?.eyewearColorId ? 1 : 0.85, () => true, { allowNoneWhenUnlocked: true });
      maybePick(WARDROBE_EYEWEAR_PLACEMENT_CATEGORY, locks?.eyewearPlacementId ? 1 : 1, () => true, { allowNoneWhenUnlocked: false });
    }
    maybePick('耳環 (Earrings)', visibilityAtLeast(visibility, 'portrait') ? 0.45 : 0.2, () => true, { allowNoneWhenUnlocked: true });
    maybePick('頸部 (Neck Accessories)', visibilityAtLeast(visibility, 'portrait') ? 0.4 : 0.2, () => true, { allowNoneWhenUnlocked: true });
  }

  return pieces;
}

function buildSummaryFields(context, wardrobe, character, wardrobeColors) {
  const joinSummaryParts = (...parts) => {
    const filtered = parts.filter((part) => part && part !== '-');
    return filtered.length > 0 ? filtered.join(' / ') : '-';
  };
  const subjectLabel = isSpecialSubject(context.subject)
    ? context.subject.zh || '一具完整人類骷髏'
    : context.subject.reference
    ? '一位以附圖人物五官為主的女性'
    : context.subject.count === 2
      ? '兩位性感驚豔的日系或韓系女性'
      : '一位性感驚豔的日系或韓系女性';
  const characterSlots = extractCharacterSlots(character);
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
  const imageTypeLabel = context.imageTypePreset?.zh || IMAGE_TYPE_PRESET_OPTIONS[0].zh;
  const styleLabel = joinSummaryParts(
    imageTypeLabel,
    context.style && !isNoneLikeItem(context.style) ? context.style.zh : ''
  );
  const importedWorldSceneLabel = context.locks?.importedWorldSceneMode === 'architecture'
    ? String(context.locks.importedWorldSceneLabel || '').trim()
    : '';
  const fixedSetSummaryLabel = context.fixedCompositionSet && !isNoneLikeItem(context.fixedCompositionSet)
    ? joinSummaryParts(
        context.fixedCompositionSet.zh,
        context.fixedSetPosition && !isNoneLikeItem(context.fixedSetPosition) ? context.fixedSetPosition.zh : '',
        context.fixedSetBackgroundState && !isNoneLikeItem(context.fixedSetBackgroundState) ? context.fixedSetBackgroundState.zh : '',
        context.fixedSetCaptureMode && !isNoneLikeItem(context.fixedSetCaptureMode) ? context.fixedSetCaptureMode.zh : '',
        context.fixedSetPerformanceState && !isNoneLikeItem(context.fixedSetPerformanceState) ? context.fixedSetPerformanceState.zh : ''
      )
    : '';
  const locationLabel = fixedSetSummaryLabel && fixedSetSummaryLabel !== '-'
    ? fixedSetSummaryLabel
    : importedWorldSceneLabel
    ? `PAGE3：${importedWorldSceneLabel}`
    : context.location && !isNoneLikeItem(context.location) ? context.location.zh : '-';
  const framingLabel = context.framing && !isNoneLikeItem(context.framing) ? context.framing.zh : '-';
  const angleLabel = context.angle && !isNoneLikeItem(context.angle) ? context.angle.zh : '-';
  const orbitLabel = context.orbit && !isNoneLikeItem(context.orbit)
    ? getCameraControlDisplayLabel('orbitId', context.orbit)
    : '-';
  const lensLabel = context.lens && !isNoneLikeItem(context.lens) ? context.lens.zh : '-';
  const apertureLabel = context.aperture && !isNoneLikeItem(context.aperture) ? context.aperture.zh : '-';
  const shutterLabel = context.shutter && !isNoneLikeItem(context.shutter) ? context.shutter.zh : '-';
  const filmLabel = context.film && !isNoneLikeItem(context.film) ? context.film.zh : '-';
  const lightingLabel = context.lighting && !isNoneLikeItem(context.lighting) ? context.lighting.zh : '-';
  const lightDirectionLabel = context.lightDirection && !isNoneLikeItem(context.lightDirection) ? context.lightDirection.zh : '-';
  const opticalEffectLabel = context.opticalEffect && !isNoneLikeItem(context.opticalEffect) ? context.opticalEffect.zh : '-';
  const formatPresetSummary = (preset, primaryColor) => {
    if (!preset) return '';
    return primaryColor?.zh ? `${primaryColor.zh}｜${preset.zh}` : preset.zh;
  };
  const summarizeSingleCharacter = () => {
    if (isSpecialSubject(context.subject)) {
      return joinSummaryParts(
        subjectLabel,
        context.subject.skeletonToneZh || context.subject.specialToneZh || '',
        isSkeletonSubject(context.subject) ? '乾淨標本質感' : '',
        isSkeletonSubject(context.subject) ? '超現實攝影裝置感' : '',
        isAndroidSubject(context.subject) && characterSlots.hairstyle?.zh && !isNoneLikeItem(characterSlots.hairstyle) ? characterSlots.hairstyle.zh : '',
        isAndroidSubject(context.subject) && characterSlots.hairColor?.zh && !isNoneLikeItem(characterSlots.hairColor) ? characterSlots.hairColor.zh : '',
        characterSlots.actionPose?.zh && !isNoneLikeItem(characterSlots.actionPose) ? characterSlots.actionPose.zh : '',
        characterSlots.expression?.zh && !isNoneLikeItem(characterSlots.expression) ? characterSlots.expression.zh : '',
        characterSlots.pose?.zh && !isNoneLikeItem(characterSlots.pose) ? characterSlots.pose.zh : ''
      );
    }

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
      characterSlots.actionPose?.zh && !isNoneLikeItem(characterSlots.actionPose) ? characterSlots.actionPose.zh : '',
      characterSlots.specialAction?.zh && !isNoneLikeItem(characterSlots.specialAction) ? characterSlots.specialAction.zh : '',
      characterSlots.poseComposer?.zh && !isNoneLikeItem(characterSlots.poseComposer) ? characterSlots.poseComposer.zh : '',
      characterSlots.pose?.zh && !isNoneLikeItem(characterSlots.pose) ? characterSlots.pose.zh : ''
    );
  };
  const summarizeDuoRole = (body, face, skin, hair, color) => {
    const hairSummary = joinSummaryParts(
      hair?.zh && !isNoneLikeItem(hair) ? hair.zh : '',
      color?.zh && !isNoneLikeItem(color) ? color.zh : ''
    );
    const summary = joinSummaryParts(
      body?.zh && !isNoneLikeItem(body) ? body.zh : '',
      face?.zh && !isNoneLikeItem(face) ? face.zh : '',
      skin?.zh && !isNoneLikeItem(skin) ? skin.zh : '',
      hairSummary !== '-' ? hairSummary : ''
    );
    return summary === '-' ? '' : summary;
  };
  const summarizeWardrobe = () => {
    if (wardrobeSlots.specialOutfitA || wardrobeSlots.specialOutfitB) {
      return [
        wardrobeSlots.specialOutfitA?.zh && !isNoneLikeItem(wardrobeSlots.specialOutfitA) ? `人物 1：${wardrobeSlots.specialOutfitA.zh}` : '',
        wardrobeSlots.specialOutfitB?.zh && !isNoneLikeItem(wardrobeSlots.specialOutfitB) ? `人物 2：${wardrobeSlots.specialOutfitB.zh}` : '',
      ].filter(Boolean).join(' / ') || '-';
    }

    if (wardrobeSlots.specialOutfit) {
      return wardrobeSlots.specialOutfit.zh || '-';
    }

    if (wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB) {
      return [
        formatPresetSummary(wardrobeSlots.outfitPresetA, wardrobeColors.outfitPresetAPrimaryColor || wardrobeColors.outfitPresetAColor),
        formatPresetSummary(wardrobeSlots.outfitPresetB, wardrobeColors.outfitPresetBPrimaryColor || wardrobeColors.outfitPresetBColor),
      ].filter(Boolean).join(' / ') || '-';
    }

    if (
      wardrobeSlots.dressA || wardrobeSlots.dressB ||
      wardrobeSlots.topA || wardrobeSlots.topB ||
      wardrobeSlots.pantsA || wardrobeSlots.pantsB ||
      wardrobeSlots.skirtA || wardrobeSlots.skirtB
    ) {
      const summarizeRoleWardrobe = (role) => {
        const suffix = role === 'a' ? 'A' : 'B';
        const dressLabel = wardrobeSlots[`dress${suffix}`]?.zh && !isNoneLikeItem(wardrobeSlots[`dress${suffix}`])
          ? wardrobeSlots[`dress${suffix}`].zh
          : '';
        if (dressLabel) return dressLabel;

        const topLabel = wardrobeSlots[`top${suffix}`]?.zh && !isNoneLikeItem(wardrobeSlots[`top${suffix}`])
          ? joinSummaryParts(
              wardrobeSlots[`top${suffix}`].zh,
              wardrobeSlots[`topPattern${suffix}`]?.zh && !isNoneLikeItem(wardrobeSlots[`topPattern${suffix}`]) ? wardrobeSlots[`topPattern${suffix}`].zh : ''
            )
          : '';
        const bottomLabel = wardrobeSlots[`pants${suffix}`]?.zh && !isNoneLikeItem(wardrobeSlots[`pants${suffix}`])
          ? joinSummaryParts(
              wardrobeSlots[`pants${suffix}`].zh,
              wardrobeSlots[`bottomPattern${suffix}`]?.zh && !isNoneLikeItem(wardrobeSlots[`bottomPattern${suffix}`]) ? wardrobeSlots[`bottomPattern${suffix}`].zh : ''
            )
          : wardrobeSlots[`skirt${suffix}`]?.zh && !isNoneLikeItem(wardrobeSlots[`skirt${suffix}`])
            ? joinSummaryParts(
                wardrobeSlots[`skirt${suffix}`].zh,
                wardrobeSlots[`bottomPattern${suffix}`]?.zh && !isNoneLikeItem(wardrobeSlots[`bottomPattern${suffix}`]) ? wardrobeSlots[`bottomPattern${suffix}`].zh : ''
              )
            : '';
        return joinSummaryParts(topLabel, bottomLabel);
      };

      return [
        summarizeRoleWardrobe('a') ? `人物 1：${summarizeRoleWardrobe('a')}` : '',
        summarizeRoleWardrobe('b') ? `人物 2：${summarizeRoleWardrobe('b')}` : '',
      ].filter(Boolean).join(' / ') || '-';
    }

    if (wardrobeSlots.outfitPreset) {
      return formatPresetSummary(wardrobeSlots.outfitPreset, wardrobeColors.outfitPresetPrimaryColor || wardrobeColors.outfitPresetColor) || '-';
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
    const headAccessoryLabel = wardrobeSlots.headAccessory?.zh && !isNoneLikeItem(wardrobeSlots.headAccessory) ? wardrobeSlots.headAccessory.zh : '';
    const outerwearLabel = wardrobeSlots.outerwear?.zh && !isNoneLikeItem(wardrobeSlots.outerwear)
      ? joinSummaryParts(
          wardrobeSlots.outerwear.zh,
          wardrobeSlots.outerwearFit?.zh && !isNoneLikeItem(wardrobeSlots.outerwearFit) ? wardrobeSlots.outerwearFit.zh : '',
          wardrobeSlots.outerwearPattern?.zh && !isNoneLikeItem(wardrobeSlots.outerwearPattern) ? wardrobeSlots.outerwearPattern.zh : '',
          wardrobeSlots.outerwearOpening?.zh && !isNoneLikeItem(wardrobeSlots.outerwearOpening) ? wardrobeSlots.outerwearOpening.zh : '',
          wardrobeSlots.outerwearStyling?.zh && !isNoneLikeItem(wardrobeSlots.outerwearStyling) ? wardrobeSlots.outerwearStyling.zh : ''
        )
      : '';
    return joinSummaryParts(
      topLabel,
      bottomLabel,
      outerwearLabel,
      shoeLabel,
      headAccessoryLabel
    );
  };

  return {
    style: styleLabel,
    character: context.subject.count === 2
      ? joinSummaryParts(
          subjectLabel,
          summarizeDuoRole(characterSlots.bodyTypeA, characterSlots.facialFeaturesA, characterSlots.skinDetailsA, characterSlots.hairstyleA, characterSlots.hairColorA)
            ? `人物 1：${summarizeDuoRole(characterSlots.bodyTypeA, characterSlots.facialFeaturesA, characterSlots.skinDetailsA, characterSlots.hairstyleA, characterSlots.hairColorA)}`
            : '',
          summarizeDuoRole(characterSlots.bodyTypeB, characterSlots.facialFeaturesB, characterSlots.skinDetailsB, characterSlots.hairstyleB, characterSlots.hairColorB)
            ? `人物 2：${summarizeDuoRole(characterSlots.bodyTypeB, characterSlots.facialFeaturesB, characterSlots.skinDetailsB, characterSlots.hairstyleB, characterSlots.hairColorB)}`
            : '',
          characterSlots.duoPose?.zh && !isNoneLikeItem(characterSlots.duoPose) ? characterSlots.duoPose.zh : '',
          characterSlots.duoPoseBase?.zh && !isNoneLikeItem(characterSlots.duoPoseBase) ? characterSlots.duoPoseBase.zh : ''
        )
      : summarizeSingleCharacter(),
    wardrobe: summarizeWardrobe(),
    location: locationLabel,
    camera: joinSummaryParts(framingLabel, angleLabel, orbitLabel, lensLabel, apertureLabel, shutterLabel, opticalEffectLabel, filmLabel),
    lighting: joinSummaryParts(lightingLabel, lightDirectionLabel),
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

function isNoneLikePromptText(value) {
  const text = stripMarkdown(value || '')
    .replace(/[.!?]+$/g, '')
    .trim()
    .toLowerCase();

  return text === 'none' || text === '全無';
}

function buildImagingSimulationOptions(filmOptions = []) {
  const noneOption = filmOptions.find((item) => isNoneLikeItem(item)) || CAMERA_SYSTEM_OPTIONS.find((item) => isNoneLikeItem(item));
  const renderingProfiles = filmOptions.filter((item) => !isNoneLikeItem(item));

  return [noneOption, ...renderingProfiles].filter(Boolean);
}

function getLegacyCameraSystemFromImaging(imagingSimulation) {
  if (!imagingSimulation || !CAMERA_PROFILE_OPTION_IDS.has(imagingSimulation.id)) return null;
  return CAMERA_SYSTEM_OPTIONS.find((item) => item.id === imagingSimulation.id) || null;
}

const STYLE_PROMPT_INTROS = {
  '蜷川實花｜濃烈色彩戲劇感': 'Inspired by Mika Ninagawa, explosive vivid complex color image language',
  '上田義彥｜靜默自然暗調': 'Inspired by Yoshihiko Ueda, quiet natural image language',
  '橫浪修｜群像留白秩序': 'Inspired by Osamu Yokonami, high-key minimalist image language',
  '川內倫子｜輕盈日常微光': 'Inspired by Rinko Kawauchi, airy high-key image language',
  '石田真澄｜柔亮底片空氣感': 'Inspired by Masumi Ishida, luminous summer film image language',
  '市橋織江｜透明自然低飽和': 'Inspired by Orie Ichihashi, transparent natural-light image language',
  '高橋洋子｜乾爽日光褪色': 'Inspired by Yoko Takahashi, breezy sun-bleached image language',
  '保羅・羅韋爾西｜柔霧高級時裝': 'Inspired by Paolo Roversi, soft haze editorial image language',
  '艾倫・馮・昂沃斯｜俏皮抓拍雜誌': 'Inspired by Ellen von Unwerth, playful editorial image language',
  '南・戈爾丁｜私人相簿粗粒子': 'Inspired by Nan Goldin, intimate diaristic image language',
  '尤爾根・特勒｜直閃反精緻': 'Inspired by Juergen Teller, raw direct-flash image language',
  '理察・阿維頓｜極簡留白肖像': 'Inspired by Richard Avedon, stripped-down editorial image language',
  '亞歷克・索斯｜寬鬆紀實敘事': 'Inspired by Alec Soth, spacious documentary image language',
  '莎莉・曼｜古典濕版記憶感': 'Inspired by Sally Mann, antique wet-plate image language',
  '沃夫岡・提爾曼斯｜生活切片隨拍': 'Inspired by Wolfgang Tillmans, casual everyday image language',
  '森山大道｜噪訊黑白暗調': 'Inspired by Daido Moriyama, gritty high-contrast monochrome image language',
  '荒木經惟｜私寫真親密': 'Inspired by Nobuyoshi Araki, raw intimate diaristic image language',
  '篠山紀信｜經典寫真名人肖像': 'Inspired by Kishin Shinoyama, polished Japanese portrait image language',
  '鈴木親｜年輕時尚生活感': 'Inspired by Chikashi Suzuki, relaxed film-editorial image language',
  '青山裕企｜青春寫真直接人像': 'Inspired by Yuki Aoyama, Japanese photobook image language',
  '奧山由之｜青春電影透明敘事': 'Inspired by Yuhki Toyama, tender cinematic image language',
  '萊斯利・基｜華麗明星商業感': 'Inspired by Leslie Kee, polished commercial portrait image language',
  '細江英公｜戲劇黑白藝術張力': 'Inspired by Eikoh Hosoe, dramatic monochrome art image language',
  '蓋・布爾丁｜鮮豔敘事時裝': 'Inspired by Guy Bourdin, bold narrative fashion image language',
  '邁爾斯・奧爾德里奇｜復古濃彩高製作': 'Inspired by Miles Aldridge, hyper-stylized fashion image language',
  '艾爾莎・布萊達｜霓虹低光孤寂': 'Inspired by Elsa Bleda, nocturnal neon image language',
};

export function buildPhotographyStylePrompt(style) {
  if (!style || isNoneLikeItem(style)) return '';

  const intro = STYLE_PROMPT_INTROS[style.zh] || 'editorial photography mood';
  const styleText = stripMarkdown(style.en).replace(/\s+/g, ' ').trim();
  if (!styleText) return intro;

  const dedupedStyleText = styleText.replace(/^Inspired by [^,]+,\s*/i, '');
  if (!dedupedStyleText) return intro;
  if (dedupedStyleText === styleText) return `${intro}. ${styleText}`;
  return `${intro}. ${dedupedStyleText}`;
}

export function getPhotographyStyleOptions(customLibrary = []) {
  return getEngineRuntime(customLibrary).flatCatalog.regional;
}

const DUO_PROMPT_OVERRIDES = {
  framing: {
    '特寫鏡頭 (Close-Up)': 'tight two-subject framing, both women clearly visible, shoulder-up composition, intimate close composition',
    '中景鏡頭 (Medium Shot)': 'medium shot, waist-up two-subject framing, both women clearly visible, balanced composition',
    '牛仔中景 (Cowboy Shot)': 'cowboy shot, knee-up two-subject framing, balanced spacing between both women, both subjects clearly visible',
    '全身鏡頭 (Full Body Shot)': 'full body shot, full-length two-subject framing, both women fully visible, balanced side-by-side composition',
  },
  angle: {
    '高位俯視鏡頭': 'high camera position, downward two-subject view, both women in frame',
    '平視高度鏡頭': 'eye-height camera, level duo perspective, both women readable',
    '肩部高度鏡頭': 'shoulder-level camera, level lens axis, upper-body duo viewpoint',
    '腰部高度鏡頭': 'waist-level camera, level lens axis, grounded duo perspective',
    '膝蓋高度鏡頭': 'knee-level camera, level lens axis, legs emphasized when visible',
    '地面高度鏡頭': 'floor-level camera, upward view toward both women, elongated duo perspective',
    '蟲眼視角鏡頭': "worm's-eye view, ultra-low upward camera, strong near-far scale distortion",
    '鳥瞰視角': "elevated bird's-eye duo view, both women small within surrounding space",
    '正上方俯視鏡頭': 'vertical top-down duo view, camera directly above, flattened graphic composition',
    '荷蘭角/傾斜 (Dutch Angle)': 'dutch angle, diagonal horizon, tilted two-subject frame',
  },
  orbit: {
    '正面 0 度': '0-degree front duo view, both torsos face camera',
    '左前 45 度': '45-degree front-left duo view, both torsos angled forward',
    '左側 90 度': '90-degree left-profile duo view, lateral torso orientation',
    '左後 135 度': '135-degree rear-left duo view, torsos stay rear-facing',
    '背面 180 度': '180-degree rear duo view, backs to camera, torsos rear-facing',
    '右後 225 度': '225-degree rear-right duo view, torsos stay rear-facing',
    '右側 270 度': '270-degree right-profile duo view, lateral torso orientation',
    '右前 315 度': '315-degree front-right duo view, both torsos angled forward',
  },
  lightDirection: {
    '柔和順光': 'soft frontal light across both women, even luminous facial clarity, balanced duo portrait lighting',
    '均勻平光': 'flat even light across both women, clean readable facial information, balanced duo exposure',
    '側向柔光': 'soft side light across both women, gentle dimensional contour, balanced duo editorial lighting',
    '逆光輪廓光': 'backlit two-subject image, glowing edge light on both silhouettes, gentle separation from the background',
    '窗格投影光': 'window-pattern light cast across both women, geometric shadow bands visible on faces, bodies, and clothing',
    '百葉窗條紋投影光': 'window-blind stripe light across both women, slatted daylight bands falling on faces, bodies, and clothing',
    '頂部照明': 'overhead top light across both women, downward facial shadows, clear vertical falloff across faces and torsos',
  },
  expression: {
    '直視鏡頭｜清透微笑': 'both women looking toward the camera, subtle shared smile, calm confident duo presence',
    '直視鏡頭｜平靜凝視': 'both women holding a calm direct gaze, composed neutral expression, quiet shared presence',
    '直視鏡頭｜自信淡笑': 'both women looking toward the camera with poised confident smiles, composed stylish duo presence',
    '直視鏡頭｜慵懶淡然': 'both women with relaxed half-lidded eyes, effortless calm expression, soft editorial duo mood',
    '直視鏡頭｜若有似無微笑': 'both women looking toward the camera with faint restrained smiles, subtle charming shared chemistry',
    '直視鏡頭｜無辜清透眼神': 'both women looking toward the camera with clear innocent eyes, delicate soft expression, pure shared mood',
    '抿唇忍笑｜俏皮輕鬆': 'both women holding back a small laugh, playful relaxed chemistry, light teasing shared mood',
    '望向遠方｜若有所思': 'both women gazing away or slightly off-camera, thoughtful mood, quiet shared atmosphere',
    '側望｜安靜出神': 'both women looking off to the side, understated absent-minded mood, soft distant shared focus',
    '低頭不看鏡頭｜內斂情緒': 'both women lowering their gaze away from camera, restrained inward emotion, quiet introspective duo mood',
    '回眸側看｜輕柔注意': 'both women glancing back with soft sideward attention, gentle alertness, light narrative duo energy',
    '閉眼感受光線｜安靜沉浸': 'both women with eyes gently closed, calm absorbed expression, quiet immersive duo atmosphere',
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

function buildRoleHasPrompt(item, label) {
  if (!item || isNoneLikeItem(item)) return '';
  return `${label} has ${item.en}`;
}

function extractCharacterSlots(character) {
  const findSlot = (token) => character.find((item) => item.id?.includes(token) && !item.meta?.characterRole);
  const findRoleSlot = (token, role) => character.find((item) => item.id?.includes(token) && item.meta?.characterRole === role);
  return {
    bodyType: findSlot('character:體態-body-type:'),
    bodyTypeA: findRoleSlot('character:體態-body-type:', 'a'),
    bodyTypeB: findRoleSlot('character:體態-body-type:', 'b'),
    facialFeatures: findSlot('character:五官特徵-facial-features:'),
    facialFeaturesA: findRoleSlot('character:五官特徵-facial-features:', 'a'),
    facialFeaturesB: findRoleSlot('character:五官特徵-facial-features:', 'b'),
    skinDetails: findSlot('character:膚質特徵-skin-details:'),
    skinDetailsA: findRoleSlot('character:膚質特徵-skin-details:', 'a'),
    skinDetailsB: findRoleSlot('character:膚質特徵-skin-details:', 'b'),
    hairstyle: findSlot('character:髮型-hairstyle:'),
    hairstyleA: findRoleSlot('character:髮型-hairstyle:', 'a'),
    hairstyleB: findRoleSlot('character:髮型-hairstyle:', 'b'),
    hairColor: findSlot('character:髮色-hair-color:'),
    hairColorA: findRoleSlot('character:髮色-hair-color:', 'a'),
    hairColorB: findRoleSlot('character:髮色-hair-color:', 'b'),
    expression: findSlot('character:神情與眼神-expression-gaze:'),
    duoExpression: findSlot('character:雙人神情眼神-duo-expression:'),
    expressionA: findRoleSlot('character:神情與眼神-expression-gaze:', 'a'),
    expressionB: findRoleSlot('character:神情與眼神-expression-gaze:', 'b'),
    duoPose: findSlot('character:雙人構圖姿態-duo-pose:'),
    duoPoseBase: findSlot('character:雙人姿態基底-duo-pose-base:'),
    actionPose: findSlot('character:動作姿勢-action-pose:'),
    poseComposer: findSlot('character:姿勢組合器-pose-composer:'),
    pose: findSlot('character:姿勢與肢體語言-pose-body-language:'),
    specialAction: findSlot('character:特殊動作-special-actions:'),
  };
}

function extractWardrobeSlots(wardrobe) {
  const findSlot = (token) => wardrobe.find((item) => item.id?.includes(token) && !item.meta?.wardrobeRole);
  const findRoleSlot = (token, role, layerSlot) => wardrobe.find((item) => item.id?.includes(token) && item.meta?.wardrobeRole === role && item.meta?.layerSlot === layerSlot);
  const specialOutfits = wardrobe.filter((item) => item.id?.includes('wardrobe:特殊穿搭-special-outfits:'));
  const outfitPresets = wardrobe.filter((item) => item.id?.includes('wardrobe:套裝-outfit-presets:'));
  const characterCardLayers = wardrobe.filter((item) => item.meta?.characterCardLayer);
  const findCharacterCardLayer = (key) => characterCardLayers.find((item) => item.meta?.characterCardLayer === key) || null;
  return {
    specialOutfit: specialOutfits.find((item) => !item.meta?.specialOutfitRole) || null,
    specialOutfitA: specialOutfits.find((item) => item.meta?.specialOutfitRole === 'a') || null,
    specialOutfitB: specialOutfits.find((item) => item.meta?.specialOutfitRole === 'b') || null,
    outfitPreset: outfitPresets.find((item) => !item.meta?.outfitRole) || null,
    outfitPresetA: outfitPresets.find((item) => item.meta?.outfitRole === 'a') || null,
    outfitPresetB: outfitPresets.find((item) => item.meta?.outfitRole === 'b') || null,
    top: findCharacterCardLayer('top') || findSlot('wardrobe:上身-tops:'),
    topA: findRoleSlot('wardrobe:上身-tops:', 'a', 'top'),
    topB: findRoleSlot('wardrobe:上身-tops:', 'b', 'top'),
    topFit: findSlot('wardrobe:上身版型-top-fit:'),
    topFitA: findRoleSlot('wardrobe:上身版型-top-fit:', 'a', 'topFit'),
    topFitB: findRoleSlot('wardrobe:上身版型-top-fit:', 'b', 'topFit'),
    topStyling: findSlot('wardrobe:上身穿法-top-styling:'),
    topStylingA: findRoleSlot('wardrobe:上身穿法-top-styling:', 'a', 'topStyling'),
    topStylingB: findRoleSlot('wardrobe:上身穿法-top-styling:', 'b', 'topStyling'),
    topPattern: findSlot('wardrobe:上身圖案-top-surface-design:'),
    topPatternA: findRoleSlot('wardrobe:上身圖案-top-surface-design:', 'a', 'topPattern'),
    topPatternB: findRoleSlot('wardrobe:上身圖案-top-surface-design:', 'b', 'topPattern'),
    dress: findCharacterCardLayer('dress') || findSlot('wardrobe:連身-dresses:'),
    dressA: findRoleSlot('wardrobe:連身-dresses:', 'a', 'dress'),
    dressB: findRoleSlot('wardrobe:連身-dresses:', 'b', 'dress'),
    pants: findCharacterCardLayer('bottom') || findSlot('wardrobe:褲裝-pants:'),
    pantsA: findRoleSlot('wardrobe:褲裝-pants:', 'a', 'pants'),
    pantsB: findRoleSlot('wardrobe:褲裝-pants:', 'b', 'pants'),
    skirt: findSlot('wardrobe:裙裝-skirts:'),
    skirtA: findRoleSlot('wardrobe:裙裝-skirts:', 'a', 'skirt'),
    skirtB: findRoleSlot('wardrobe:裙裝-skirts:', 'b', 'skirt'),
    bottomFit: findSlot('wardrobe:下身版型-bottom-fit:'),
    bottomFitA: findRoleSlot('wardrobe:下身版型-bottom-fit:', 'a', 'bottomFit'),
    bottomFitB: findRoleSlot('wardrobe:下身版型-bottom-fit:', 'b', 'bottomFit'),
    bottomRise: findSlot('wardrobe:下身腰線-bottom-rise:'),
    bottomRiseA: findRoleSlot('wardrobe:下身腰線-bottom-rise:', 'a', 'bottomRise'),
    bottomRiseB: findRoleSlot('wardrobe:下身腰線-bottom-rise:', 'b', 'bottomRise'),
    bottomPattern: findSlot('wardrobe:下身圖案-bottom-surface-design:'),
    bottomPatternA: findRoleSlot('wardrobe:下身圖案-bottom-surface-design:', 'a', 'bottomPattern'),
    bottomPatternB: findRoleSlot('wardrobe:下身圖案-bottom-surface-design:', 'b', 'bottomPattern'),
    legwear: findSlot('wardrobe:襪類-legwear:'),
    outerwear: findCharacterCardLayer('outerwear') || findSlot('wardrobe:外套-outerwear:'),
    outerwearFit: findSlot('wardrobe:外套版型-outerwear-fit:'),
    outerwearPattern: findSlot('wardrobe:外套圖案-outerwear-surface-design:'),
    outerwearOpening: findSlot('wardrobe:外套開合-outerwear-opening:'),
    outerwearStyling: findSlot('wardrobe:外套穿法-outerwear-styling:'),
    shoes: findCharacterCardLayer('shoes') || findSlot('wardrobe:鞋款-shoes:'),
    legwearA: findRoleSlot('wardrobe:襪類-legwear:', 'a', 'legwear'),
    outerwearA: findRoleSlot('wardrobe:外套-outerwear:', 'a', 'outerwear'),
    outerwearAFit: findRoleSlot('wardrobe:外套版型-outerwear-fit:', 'a', 'outerwearFit'),
    outerwearAPattern: findRoleSlot('wardrobe:外套圖案-outerwear-surface-design:', 'a', 'outerwearPattern'),
    outerwearAOpening: findRoleSlot('wardrobe:外套開合-outerwear-opening:', 'a', 'outerwearOpening'),
    outerwearAStyling: findRoleSlot('wardrobe:外套穿法-outerwear-styling:', 'a', 'outerwearStyling'),
    shoesA: findRoleSlot('wardrobe:鞋款-shoes:', 'a', 'shoes'),
    legwearB: findRoleSlot('wardrobe:襪類-legwear:', 'b', 'legwear'),
    outerwearB: findRoleSlot('wardrobe:外套-outerwear:', 'b', 'outerwear'),
    outerwearBFit: findRoleSlot('wardrobe:外套版型-outerwear-fit:', 'b', 'outerwearFit'),
    outerwearBPattern: findRoleSlot('wardrobe:外套圖案-outerwear-surface-design:', 'b', 'outerwearPattern'),
    outerwearBOpening: findRoleSlot('wardrobe:外套開合-outerwear-opening:', 'b', 'outerwearOpening'),
    outerwearBStyling: findRoleSlot('wardrobe:外套穿法-outerwear-styling:', 'b', 'outerwearStyling'),
    shoesB: findRoleSlot('wardrobe:鞋款-shoes:', 'b', 'shoes'),
    headAccessory: findCharacterCardLayer('headAccessory') || findSlot('wardrobe:頭部配件-head-accessories:'),
    eyewear: findCharacterCardLayer('eyewear') || findSlot('wardrobe:眼鏡-eyewear:'),
    eyewearColor: findSlot('wardrobe:眼鏡配色-eyewear-color:'),
    eyewearPlacement: findSlot('wardrobe:眼鏡配戴方式-eyewear-placement:'),
    earrings: findCharacterCardLayer('earrings') || findSlot('wardrobe:耳環-earrings:'),
    neckAccessory: findCharacterCardLayer('neckAccessory') || findSlot('wardrobe:頸部-neck-accessories:'),
    headAccessoryA: findRoleSlot('wardrobe:頭部配件-head-accessories:', 'a', 'headAccessory'),
    eyewearA: findRoleSlot('wardrobe:眼鏡-eyewear:', 'a', 'eyewear'),
    eyewearAColor: findRoleSlot('wardrobe:眼鏡配色-eyewear-color:', 'a', 'eyewearColor'),
    eyewearAPlacement: findRoleSlot('wardrobe:眼鏡配戴方式-eyewear-placement:', 'a', 'eyewearPlacement'),
    earringsA: findRoleSlot('wardrobe:耳環-earrings:', 'a', 'earrings'),
    neckAccessoryA: findRoleSlot('wardrobe:頸部-neck-accessories:', 'a', 'neckAccessory'),
    headAccessoryB: findRoleSlot('wardrobe:頭部配件-head-accessories:', 'b', 'headAccessory'),
    eyewearB: findRoleSlot('wardrobe:眼鏡-eyewear:', 'b', 'eyewear'),
    eyewearBColor: findRoleSlot('wardrobe:眼鏡配色-eyewear-color:', 'b', 'eyewearColor'),
    eyewearBPlacement: findRoleSlot('wardrobe:眼鏡配戴方式-eyewear-placement:', 'b', 'eyewearPlacement'),
    earringsB: findRoleSlot('wardrobe:耳環-earrings:', 'b', 'earrings'),
    neckAccessoryB: findRoleSlot('wardrobe:頸部-neck-accessories:', 'b', 'neckAccessory'),
  };
}

function isCharacterCardLayerSlot(item, key = '') {
  if (!item?.meta?.characterCardLayer) return false;
  return key ? item.meta.characterCardLayer === key : true;
}

function buildWardrobeColors(wardrobeSlots, locks, random = Math.random) {
  const hasOutfitPreset = Boolean(
    (wardrobeSlots.outfitPreset && !isNoneLikeItem(wardrobeSlots.outfitPreset)) ||
    (wardrobeSlots.outfitPresetA && !isNoneLikeItem(wardrobeSlots.outfitPresetA)) ||
    (wardrobeSlots.outfitPresetB && !isNoneLikeItem(wardrobeSlots.outfitPresetB))
  );
  const hasCompleteLook = Boolean(
    (wardrobeSlots.specialOutfit && !isNoneLikeItem(wardrobeSlots.specialOutfit)) ||
    (wardrobeSlots.outfitPreset && !isNoneLikeItem(wardrobeSlots.outfitPreset)) ||
    (wardrobeSlots.dress && !isNoneLikeItem(wardrobeSlots.dress) && !isCharacterCardLayerSlot(wardrobeSlots.dress))
  );
  const hasCompleteLookA = Boolean(
    (wardrobeSlots.specialOutfitA && !isNoneLikeItem(wardrobeSlots.specialOutfitA)) ||
    (wardrobeSlots.outfitPresetA && !isNoneLikeItem(wardrobeSlots.outfitPresetA)) ||
    (wardrobeSlots.dressA && !isNoneLikeItem(wardrobeSlots.dressA))
  );
  const hasCompleteLookB = Boolean(
    (wardrobeSlots.specialOutfitB && !isNoneLikeItem(wardrobeSlots.specialOutfitB)) ||
    (wardrobeSlots.outfitPresetB && !isNoneLikeItem(wardrobeSlots.outfitPresetB)) ||
    (wardrobeSlots.dressB && !isNoneLikeItem(wardrobeSlots.dressB))
  );
  const normalizedLocks = normalizeLegacyOutfitPresetColors(locks || {});
  const completeLookPalette = hasCompleteLook ? getCompleteLookPaletteOption(normalizedLocks.completeLookPaletteId) : null;
  const completeLookPaletteA = hasCompleteLookA ? getCompleteLookPaletteOption(normalizedLocks.completeLookPaletteAId) : null;
  const completeLookPaletteB = hasCompleteLookB ? getCompleteLookPaletteOption(normalizedLocks.completeLookPaletteBId) : null;
  const topBottomPalette = getTopBottomPaletteOption(normalizedLocks.topBottomPaletteId, {}, random);
  const topBottomPaletteA = getTopBottomPaletteOption(normalizedLocks.topBottomPaletteAId, {}, random);
  const topBottomPaletteB = getTopBottomPaletteOption(normalizedLocks.topBottomPaletteBId, {
    topColors: [topBottomPaletteA?.topColor].filter(Boolean),
    bottomColors: [topBottomPaletteA?.bottomColor].filter(Boolean),
  }, random);
  const pickGarmentColor = (lockedId, avoidColors = []) => {
    const lockedColor = getGarmentColorOption(lockedId);
    return lockedColor || sampleColorAvoiding(GARMENT_COLOR_OPTIONS, avoidColors.filter(Boolean), (item) => item, random);
  };
  const lockedTopAColor = getGarmentColorOption(normalizedLocks.topAColorId);
  const lockedTopBColor = getGarmentColorOption(normalizedLocks.topBColorId);
  const lockedDressAColor = getGarmentColorOption(normalizedLocks.dressAColorId);
  const lockedDressBColor = getGarmentColorOption(normalizedLocks.dressBColorId);
  const lockedBottomAColor = getGarmentColorOption(normalizedLocks.bottomAColorId);
  const lockedBottomBColor = getGarmentColorOption(normalizedLocks.bottomBColorId);
  const outfitPresetColor = wardrobeSlots.outfitPreset && !isNoneLikeItem(wardrobeSlots.outfitPreset)
    ? topBottomPalette?.topColor || getOutfitPresetColorOption(normalizedLocks.outfitPresetColorId) || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS, random)
    : null;
  const outfitPresetAColor = wardrobeSlots.outfitPresetA && !isNoneLikeItem(wardrobeSlots.outfitPresetA)
    ? topBottomPaletteA?.topColor || getOutfitPresetColorOption(normalizedLocks.outfitPresetAColorId) || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS, random)
    : null;
  const outfitPresetBColor = wardrobeSlots.outfitPresetB && !isNoneLikeItem(wardrobeSlots.outfitPresetB)
    ? topBottomPaletteB?.topColor || getOutfitPresetColorOption(normalizedLocks.outfitPresetBColorId) || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS, random)
    : null;
  const outfitPresetPrimaryColor = wardrobeSlots.outfitPreset && !isNoneLikeItem(wardrobeSlots.outfitPreset)
    ? topBottomPalette?.topColor
      || getOutfitPresetColorOption(normalizedLocks.outfitPresetPrimaryColorId)
      || getOutfitPresetColorOption(normalizedLocks.outfitPresetColorId)
      || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS, random)
    : null;
  const outfitPresetContrastColor = wardrobeSlots.outfitPreset && !isNoneLikeItem(wardrobeSlots.outfitPreset)
    ? topBottomPalette?.bottomColor || getOutfitPresetColorOption(normalizedLocks.outfitPresetContrastColorId)
    : null;
  const outfitPresetLockedPalette = wardrobeSlots.outfitPreset && !isNoneLikeItem(wardrobeSlots.outfitPreset)
    ? getOutfitPresetLockedPaletteOption(normalizedLocks.outfitPresetLockedPaletteId)
    : null;
  const outfitPresetAPrimaryColor = wardrobeSlots.outfitPresetA && !isNoneLikeItem(wardrobeSlots.outfitPresetA)
    ? topBottomPaletteA?.topColor
      || getOutfitPresetColorOption(normalizedLocks.outfitPresetAPrimaryColorId)
      || getOutfitPresetColorOption(normalizedLocks.outfitPresetAColorId)
      || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS, random)
    : null;
  const outfitPresetAContrastColor = wardrobeSlots.outfitPresetA && !isNoneLikeItem(wardrobeSlots.outfitPresetA)
    ? topBottomPaletteA?.bottomColor || getOutfitPresetColorOption(normalizedLocks.outfitPresetAContrastColorId)
    : null;
  const outfitPresetALockedPalette = wardrobeSlots.outfitPresetA && !isNoneLikeItem(wardrobeSlots.outfitPresetA)
    ? getOutfitPresetLockedPaletteOption(normalizedLocks.outfitPresetALockedPaletteId)
    : null;
  const outfitPresetBPrimaryColor = wardrobeSlots.outfitPresetB && !isNoneLikeItem(wardrobeSlots.outfitPresetB)
    ? topBottomPaletteB?.topColor
      || getOutfitPresetColorOption(normalizedLocks.outfitPresetBPrimaryColorId)
      || getOutfitPresetColorOption(normalizedLocks.outfitPresetBColorId)
      || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS, random)
    : null;
  const outfitPresetBContrastColor = wardrobeSlots.outfitPresetB && !isNoneLikeItem(wardrobeSlots.outfitPresetB)
    ? topBottomPaletteB?.bottomColor || getOutfitPresetColorOption(normalizedLocks.outfitPresetBContrastColorId)
    : null;
  const outfitPresetBLockedPalette = wardrobeSlots.outfitPresetB && !isNoneLikeItem(wardrobeSlots.outfitPresetB)
    ? getOutfitPresetLockedPaletteOption(normalizedLocks.outfitPresetBLockedPaletteId)
    : null;
  const hasBottom = (wardrobeSlots.pants && !isNoneLikeItem(wardrobeSlots.pants) && !isCharacterCardLayerSlot(wardrobeSlots.pants)) || (wardrobeSlots.skirt && !isNoneLikeItem(wardrobeSlots.skirt) && !isCharacterCardLayerSlot(wardrobeSlots.skirt));
  const hasBottomA = (wardrobeSlots.pantsA && !isNoneLikeItem(wardrobeSlots.pantsA)) || (wardrobeSlots.skirtA && !isNoneLikeItem(wardrobeSlots.skirtA));
  const hasBottomB = (wardrobeSlots.pantsB && !isNoneLikeItem(wardrobeSlots.pantsB)) || (wardrobeSlots.skirtB && !isNoneLikeItem(wardrobeSlots.skirtB));
  const topColor = !hasOutfitPreset && wardrobeSlots.top && !isNoneLikeItem(wardrobeSlots.top) && !isCharacterCardLayerSlot(wardrobeSlots.top)
    ? topBottomPalette?.topColor || pickGarmentColor(normalizedLocks.topColorId)
    : null;
  const topAColor = !hasOutfitPreset && wardrobeSlots.topA && !isNoneLikeItem(wardrobeSlots.topA)
    ? topBottomPaletteA?.topColor || lockedTopAColor || pickGarmentColor('', [topBottomPaletteB?.topColor, lockedTopBColor])
    : null;
  const topBColor = !hasOutfitPreset && wardrobeSlots.topB && !isNoneLikeItem(wardrobeSlots.topB)
    ? topBottomPaletteB?.topColor || lockedTopBColor || pickGarmentColor('', [topAColor])
    : null;
  const dressColor = !hasOutfitPreset && wardrobeSlots.dress && !isNoneLikeItem(wardrobeSlots.dress) && !isCharacterCardLayerSlot(wardrobeSlots.dress) ? topBottomPalette?.topColor || pickGarmentColor(normalizedLocks.dressColorId) : null;
  const dressAColor = !hasOutfitPreset && wardrobeSlots.dressA && !isNoneLikeItem(wardrobeSlots.dressA) ? topBottomPaletteA?.topColor || lockedDressAColor || pickGarmentColor('', [topBottomPaletteB?.topColor, lockedDressBColor]) : null;
  const dressBColor = !hasOutfitPreset && wardrobeSlots.dressB && !isNoneLikeItem(wardrobeSlots.dressB) ? topBottomPaletteB?.topColor || lockedDressBColor || pickGarmentColor('', [dressAColor]) : null;
  const bottomColor = !hasOutfitPreset && hasBottom ? topBottomPalette?.bottomColor || pickGarmentColor(normalizedLocks.bottomColorId) : null;
  const bottomAColor = !hasOutfitPreset && hasBottomA ? topBottomPaletteA?.bottomColor || lockedBottomAColor || pickGarmentColor('', [topBottomPaletteB?.bottomColor, lockedBottomBColor]) : null;
  const bottomBColor = !hasOutfitPreset && hasBottomB ? topBottomPaletteB?.bottomColor || lockedBottomBColor || pickGarmentColor('', [bottomAColor]) : null;
  const legwearColor = wardrobeSlots.legwear && !isNoneLikeItem(wardrobeSlots.legwear) ? getLegwearColorOption(normalizedLocks.legwearColorId) || sampleNonNone(LEGWEAR_COLOR_OPTIONS, random) : null;
  const outerwearColor = wardrobeSlots.outerwear && !isNoneLikeItem(wardrobeSlots.outerwear) && !isCharacterCardLayerSlot(wardrobeSlots.outerwear) ? getGarmentColorOption(normalizedLocks.outerwearColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS, random) : null;
  const shoesColor = wardrobeSlots.shoes && !isNoneLikeItem(wardrobeSlots.shoes) && !isCharacterCardLayerSlot(wardrobeSlots.shoes) ? getLayerColorOption(normalizedLocks.shoesColorId) || sampleNonNone(LAYER_COLOR_OPTIONS, random) : null;
  const legwearAColor = wardrobeSlots.legwearA && !isNoneLikeItem(wardrobeSlots.legwearA) ? getLegwearColorOption(normalizedLocks.legwearAColorId) || sampleNonNone(LEGWEAR_COLOR_OPTIONS, random) : null;
  const outerwearAColor = wardrobeSlots.outerwearA && !isNoneLikeItem(wardrobeSlots.outerwearA) ? getGarmentColorOption(normalizedLocks.outerwearAColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS, random) : null;
  const shoesAColor = wardrobeSlots.shoesA && !isNoneLikeItem(wardrobeSlots.shoesA) ? getLayerColorOption(normalizedLocks.shoesAColorId) || sampleNonNone(LAYER_COLOR_OPTIONS, random) : null;
  const legwearBColor = wardrobeSlots.legwearB && !isNoneLikeItem(wardrobeSlots.legwearB) ? getLegwearColorOption(normalizedLocks.legwearBColorId) || sampleNonNone(LEGWEAR_COLOR_OPTIONS, random) : null;
  const outerwearBColor = wardrobeSlots.outerwearB && !isNoneLikeItem(wardrobeSlots.outerwearB) ? getGarmentColorOption(normalizedLocks.outerwearBColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS, random) : null;
  const shoesBColor = wardrobeSlots.shoesB && !isNoneLikeItem(wardrobeSlots.shoesB) ? getLayerColorOption(normalizedLocks.shoesBColorId) || sampleNonNone(LAYER_COLOR_OPTIONS, random) : null;
  return {
    completeLookPalette,
    completeLookPaletteA,
    completeLookPaletteB,
    outfitPresetColor,
    outfitPresetAColor,
    outfitPresetBColor,
    outfitPresetPrimaryColor,
    outfitPresetContrastColor,
    outfitPresetLockedPalette,
    outfitPresetAPrimaryColor,
    outfitPresetAContrastColor,
    outfitPresetALockedPalette,
    outfitPresetBPrimaryColor,
    outfitPresetBContrastColor,
    outfitPresetBLockedPalette,
    topBottomPalette,
    topBottomPaletteA,
    topBottomPaletteB,
    topColor,
    topAColor,
    topBColor,
    dressColor,
    dressAColor,
    dressBColor,
    bottomColor,
    bottomAColor,
    bottomBColor,
    legwearColor,
    outerwearColor,
    shoesColor,
    legwearAColor,
    outerwearAColor,
    shoesAColor,
    legwearBColor,
    outerwearBColor,
    shoesBColor,
  };
}

function buildColoredGrokPrompt(item, color = null, { preset = false, pattern = null, styling = null, fit = null, rise = null, secondaryColor = null } = {}) {
  if (!item || isNoneLikeItem(item)) return '';
  const base = appendWardrobePromptSearchAlias(item, stripMarkdown(item.en).replace(/\s+/g, ' ').trim());
  if (!base) return '';
  if (item.zh === '赤腳' || /bare feet|visible toes/i.test(base)) return base;
  const isOuterwear = item.id?.includes('wardrobe:外套-outerwear:');
  const patternText = pattern && !isNoneLikeItem(pattern)
    ? stripMarkdown(pattern.en).replace(/\s+/g, ' ').trim()
    : '';
  const fitText = fit && !isNoneLikeItem(fit)
    ? stripMarkdown(fit.en).replace(/\s+/g, ' ').trim()
    : '';
  const riseText = rise && !isNoneLikeItem(rise)
    ? stripMarkdown(rise.en).replace(/\s+/g, ' ').trim()
    : '';
  const secondaryColorText = secondaryColor && color && !isNoneLikeItem(secondaryColor) && !isNoneLikeItem(color)
    ? `coordinated top-to-bottom palette: upper/main dress area in ${color.en}, lower hem or skirt area in ${secondaryColor.en}`
    : '';
  let stylingText = styling && !isNoneLikeItem(styling)
    ? stripMarkdown(styling.en).replace(/\s+/g, ' ').trim()
    : '';
  if (isOuterwear && styling?.zh === '正常穿著') {
    stylingText = 'outerwear worn normally on both shoulders in a standard outer-layer position';
  }
  const detailText = [riseText, fitText, patternText, stylingText, secondaryColorText].filter(Boolean).join(', ');
  if (!color || isNoneLikeItem(color)) return detailText ? `${base}, ${detailText}` : base;

  if (preset) {
    return `${color.en} ${base.replace(/^wearing\s+/i, '')}`;
  }

  const coloredBase = `${color.en} ${base}`;
  return detailText ? `${coloredBase}, ${detailText}` : coloredBase;
}

function buildCompleteLookDressPrompt(item, color = null, palette = null, options = {}) {
  return appendCompleteLookPaletteDirection(buildColoredGrokPrompt(item, color, options), palette);
}

function joinNaturalList(parts = []) {
  const filtered = parts.filter(Boolean);
  if (filtered.length === 0) return '';
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(', ')}, and ${filtered[filtered.length - 1]}`;
}

function describeOutfitColorTargets(targets = []) {
  const phraseMap = {
    latex_bodysuit: 'the latex bodysuit',
    integrated_choker: 'the integrated choker',
    opera_gloves: 'the opera-length gloves',
    hip_straps: 'the hip straps',
    thigh_harness_straps: 'the thigh harness straps',
    zip_front_trim: 'the zip-front trim',
    corset_bodice: 'the corset bodice',
    main_leather_panels: 'the main leather panels',
    lower_half_base_panels: 'the lower-half base panels',
    lace_trims: 'the lace trims',
    embroidery: 'the embroidery',
    mesh_panel_accents: 'the mesh panel accents',
    ribbon_lacing: 'the ribbon lacing',
    latex_mini_dress: 'the latex mini dress',
    minor_trim_accents: 'the minor trim accents',
    panel_edges: 'the panel edges',
    linen_shirt: 'the linen shirt',
    overall_tonal_palette: 'the overall tonal palette',
    silk_camisole: 'the silk camisole',
    wide_leg_trousers: 'the wide-leg trousers',
    main_outfit_body: 'the main outfit body',
    inner_layer: 'the inner layer',
    subtle_structural_accents: 'the subtle structural accents',
    outer_layer: 'the outer layer',
    largest_garment_block: 'the largest garment block',
    bottoms: 'the bottom layer',
    graphic_accents: 'the graphic accents',
    main_loungewear_body: 'the main loungewear body',
    pants: 'the pants',
    soft_trim_accents: 'the soft trim accents',
    main_top_or_dress_layer: 'the main top or dress layer',
    long_shirt: 'the long shirt',
    pleated_skirt: 'the pleated skirt',
    secondary_tonal_accents: 'the secondary tonal accents',
    main_sportswear_pieces: 'the main sportswear pieces',
    stripes: 'the stripe details',
    paneling: 'the paneling',
    shorts_or_inner_layer: 'the shorts or inner layer',
    accent_trims: 'the accent trims',
    tailored_outer_layer: 'the tailored outer layer',
    main_suit_body: 'the main suit body',
    shirt_layer: 'the shirt layer',
    skirt_or_trousers: 'the skirt or trousers',
    trim_accents: 'the trim accents',
    main_resortwear_body: 'the main resortwear body',
    cover_up: 'the cover-up layer',
    belt: 'the belt',
    main_nightlife_garment: 'the main nightlife garment',
    panel_accents: 'the panel accents',
    dress_body: 'the dress body',
    optional_secondary_trim_areas: 'the secondary trim areas',
    halter_mini_dress: 'the halter mini dress',
    minor_edge_accents: 'the edge accents',
    bondage_straps: 'the bondage straps',
    latex_accent_areas: 'the latex accent areas',
    main_dress_body: 'the main dress body',
    lace: 'the lace details',
    collar: 'the collar',
    corset_lines: 'the corset lines',
    ruffle_accents: 'the ruffle accents',
    dress_main_fabric: 'the main dress fabric',
    frills: 'the frills',
    bows: 'the bows',
    hem_trim: 'the hem trim',
    lingerie_base_fabric: 'the lingerie base fabric',
    lace_panels: 'the lace panels',
    ribbons: 'the ribbons',
    scalloped_trim: 'the scalloped trim',
    swimwear_body: 'the swimwear body',
    tie_details: 'the tie details',
    trim: 'the trim',
    cheongsam_body: 'the cheongsam body',
    cheongsam_base_fabric: 'the cheongsam base fabric',
    kimono_robe: 'the kimono robe',
    obi_sash: 'the obi sash',
    collar_layers: 'the collar layers',
    yukata_body: 'the yukata body',
    outer_robe: 'the outer robe',
    inner_collar: 'the inner collar',
    waist_sash: 'the waist sash',
    main_hanfu_body: 'the main hanfu body',
    sleeve_edge: 'the sleeve edges',
    waist_line: 'the waist line',
    bodysuit_body: 'the bodysuit body',
    cuffs: 'the cuffs',
    apron: 'the apron',
    ruffles: 'the ruffles',
    headpiece: 'the headpiece',
    bikini_base_fabric: 'the bikini base fabric',
    neck_collar: 'the neck collar',
    uniform_body: 'the uniform body',
    skirt: 'the skirt',
    scarf: 'the scarf',
    sailor_trim_lines: 'the sailor-style trim lines',
    neck_bow: 'the neck bow',
    inner_accent_line: 'the inner accent line',
    lace_underskirt_accents: 'the lace underskirt accents',
    main_dress_fabric: 'the main dress fabric',
    contrast_trim: 'the contrast trim',
    lace_up_ribbon: 'the lace-up ribbon',
    underskirt: 'the underskirt',
    knit_top: 'the knit top',
    main_skirt_fabric: 'the main skirt fabric',
    striped_bow: 'the striped bow',
    ruffle_panels: 'the ruffle panels',
    lace_inner_layer: 'the lace inner layer',
  };

  return joinNaturalList(targets.map((target) => phraseMap[target] || target.replace(/_/g, ' ')));
}

function describeLockedPalette(lockedPalette, targets = [], lockedOptional = false) {
  const targetText = describeOutfitColorTargets(targets);
  const paletteId = lockedPalette?.id || '';
  const paletteText = lockedPalette?.en || '';

  if (!targetText) return '';

  const paletteMap = {
    'metallic-gold': `${targetText} kept in fixed metallic gold`,
    'metallic-silver': `${targetText} kept in fixed metallic silver`,
    'classic-black-trim': `${targetText} kept in crisp classic black`,
    'classic-white-apron': `${targetText} kept in classic clean white`,
    'classic-white-cuff-collar': `${targetText} kept in classic clean white`,
    'classic-school-navy-trim': `${targetText} kept in a classic navy uniform trim scheme`,
  };

  if (paletteId && paletteMap[paletteId]) return paletteMap[paletteId];
  if (paletteText && paletteId !== 'none') return `${targetText} kept in ${paletteText}`;

  if (targets.some((target) => /metal|grommet|buckle|ring|hardware|button/.test(target))) {
    return `${targetText} kept in fixed metallic tones`;
  }

  if (lockedOptional) {
    return `${targetText} can retain a classic signature color scheme`;
  }

  return `${targetText} kept in fixed signature colors`;
}

function buildOutfitPresetPrompt(item, colorState = {}) {
  if (!item || isNoneLikeItem(item)) return '';

  const base = stripMarkdown(item.en).replace(/\s+/g, ' ').trim().replace(/^wearing\s+/i, '');
  if (!base) return '';

  const meta = item.meta || {};
  const colorTargets = meta.colorTargets || {};
  const colorMode = meta.colorMode || 'primary';
  const lockedOptional = Boolean(meta.lockedOptional);

  const primaryColor = colorState.primary || colorState.legacy || null;
  const contrastColor = colorState.contrast || null;
  const lockedPalette = colorState.lockedPalette || null;
  const completeLookPalette = colorState.completeLookPalette || null;

  if (!meta.colorMode || !colorTargets || Object.keys(colorTargets).length === 0) {
    if (primaryColor && contrastColor && !isNoneLikeItem(primaryColor) && !isNoneLikeItem(contrastColor)) {
      return appendCompleteLookPaletteDirection(`${base}, coordinated top-to-bottom palette: upper/main garment area in ${primaryColor.en}, lower or secondary garment area in ${contrastColor.en}`, completeLookPalette);
    }
    return appendCompleteLookPaletteDirection(primaryColor && !isNoneLikeItem(primaryColor) ? `${primaryColor.en} ${base}` : base, completeLookPalette);
  }

  const materializedBase = materializeOutfitColorControls(base, {
    primaryColorText: primaryColor && !isNoneLikeItem(primaryColor) ? primaryColor.en : '',
    contrastColorText: contrastColor && !isNoneLikeItem(contrastColor) ? contrastColor.en : '',
  });
  const details = [];
  const primaryTargets = colorTargets.primary || [];
  const contrastTargets = colorTargets.contrast || [];
  const lockedTargets = colorTargets.locked || [];

  if (primaryColor && !isNoneLikeItem(primaryColor) && !materializedBase.consumedPrimary) {
    const targetText = describeOutfitColorTargets(primaryTargets);
    details.push(targetText ? `${targetText} in ${primaryColor.en}` : `main outfit color in ${primaryColor.en}`);
  }

  if (colorMode !== 'primary' && contrastColor && !isNoneLikeItem(contrastColor) && contrastTargets.length > 0 && !materializedBase.consumedContrast) {
    const contrastText = describeOutfitColorTargets(contrastTargets);
    if (contrastText) details.push(`${contrastText} in ${contrastColor.en}`);
  }

  if (colorMode === 'primary_contrast_locked' && lockedTargets.length > 0) {
    const lockedText = describeLockedPalette(lockedPalette, lockedTargets, lockedOptional);
    if (lockedText) details.push(lockedText);
  }

  const coloredBase = materializedBase.text || base;
  return appendCompleteLookPaletteDirection(details.length > 0 ? `${coloredBase}, ${details.join(', ')}` : coloredBase, completeLookPalette);
}

function buildSpecialOutfitPrompt(item, palette = null) {
  if (!item || isNoneLikeItem(item)) return '';
  const base = stripMarkdown(item.en || '')
    .replace(/\s+/g, ' ')
    .replace(/^complete outfit:\s*/i, '')
    .trim();
  const outfitText = item.meta?.suppressSpecialOutfitHairstyle
    ? stripSpecialOutfitHairstyleDescription(base)
    : base;
  return appendCompleteLookPaletteDirection(outfitText, palette);
}

function getCompositionVisibilityProjection(context) {
  return context?.compositionVisibility || createCompositionVisibilityProjection(context?.framing, {
    fixedCompositionActive: isFixedCompositionSetActive(context?.fixedCompositionSet),
  });
}

function isCompleteWardrobeProjection(projection) {
  return projection?.bucket === COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED
    || projection?.bucket === COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION
    || projection?.bucket === COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY;
}

function classifyCompleteLookWardrobeFragment(fragment) {
  const text = stripMarkdown(fragment || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';

  if (/\b(?:bag|handbag|shoulder bag|crossbody|tote|backpack|purse|clutch|satchel|pouch|kinchaku|wallet)\b/i.test(text)) return 'bag';
  if (/\b(?:headband|headscarf|bandana|cap|hat|beret|beanie|hood|hair clips?|claw clips?|barrettes?)\b/i.test(text)) return 'headAccessory';
  if (/\b(?:sunglasses|eyeglasses|glasses)\b/i.test(text)) return 'eyewear';
  if (/\b(?:earrings?|ear studs?)\b/i.test(text)) return 'earrings';
  if (/\b(?:scarf tie|necktie|neck tie|lanyard|necklace|choker|pendant|collarbone chain|neck chain)\b/i.test(text)) return 'neckAccessory';
  if (/\b(?:bracelets?|bangles?|wristwatch|watch)\b/i.test(text)) return 'wristAccessory';
  if (/\b(?:rings?)\b/i.test(text)) return 'ring';
  if (/\b(?:waist belt|hip belt|waist chain)\b/i.test(text)) return 'waistAccessory';
  if (/\b(?:stockings?|socks?|tights|pantyhose|leg warmers?|hosiery|garter straps?)\b/i.test(text)) return 'legwear';
  if (/\b(?:skirts?|shorts|hot pants|pants|trousers|jeans|leggings|bottoms?|panties|briefs|culottes|skorts?|sweatpants|chaps)\b/i.test(text)) return 'bottom';
  if (/\b(?:boots?|shoes?|sandals?|sneakers?|heels?|pumps?|loafers?|mary janes?|slippers?|mules?|clogs?|footwear|bare feet|barefoot)\b/i.test(text)) return 'shoes';
  if (/\b(?:jacket|coat|cardigan|blazer|cape|cloak|shawl|bolero|windbreaker|cover-up|outerwear|robe|haori|hooded zip-front layer|layered over)\b/i.test(text)) return 'outerwear';
  if (/\b(?:dress|gown|qipao|cheongsam|kimono|yukata)\b/i.test(text)) return 'dress';
  if (/\b(?:tops?|shirt|tee|t-shirt|blouse|camisole|tank|bra|bralette|corset|bodice|bustier|sweater|pullover|hoodie|vest|halter|bikini top|tube top|crop(?:ped)?|bodysuit|romper|uniform|sailor blouse)\b/i.test(text)) return 'top';
  return '';
}

function shouldKeepWardrobeRoleForContext(role, context, text = '') {
  return shouldProjectWardrobeRole(getCompositionVisibilityProjection(context), role, text);
}

function isCompleteLookLowerTorsoFragment(fragment) {
  return /\b(?:navel|abdomen|midriff|belly|stomach|lower torso|waistline|hipbones?|hips?)\b/i.test(fragment || '');
}

function splitMixedCompleteLookWardrobeFragment(fragment) {
  const tuckedMatch = String(fragment || '').match(/^(.+?\b(?:top|shirt|tee|t-shirt|blouse|camisole|tank|bra|bralette|corset|bodice|bustier))\s+tucked(?:\s+\w+){0,3}\s+into\s+(.+)$/i);
  return tuckedMatch ? [tuckedMatch[1], tuckedMatch[2]] : [fragment];
}

function isHemLengthOnlyFragment(fragment) {
  return /\b(?:short|mini|micro|midi|long|ankle-length|floor-length)\s+hem\b/i.test(fragment || '');
}

function projectDressIdentityFragment(fragment, projection) {
  if (!fragment || !/\b(?:dress|gown)\b/i.test(fragment)) return fragment;
  if (projection?.wardrobe?.detailZones?.includes('thigh')) return fragment;
  return fragment
    .replace(/\b(?:micro|mini|midi|maxi|short|long|ankle-length|floor-length)\s+(?=(?:dress|gown)\b)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function filterCompleteLookPromptForFraming(value, context) {
  const projection = getCompositionVisibilityProjection(context);
  const text = stripMarkdown(value || '').replace(/\s+/g, ' ').trim();
  if (!text || isCompleteWardrobeProjection(projection)) return text;

  const buckets = {
    style: [],
    top: [],
    dress: [],
    bottom: [],
    outerwear: [],
    legwear: [],
    shoes: [],
    bag: [],
    headAccessory: [],
    eyewear: [],
    earrings: [],
    neckAccessory: [],
    wristAccessory: [],
    ring: [],
    waistAccessory: [],
    passthrough: [],
  };

  for (const sourceFragment of splitGptSpecialOutfitFragments(text)) {
    for (const fragment of splitMixedCompleteLookWardrobeFragment(sourceFragment)) {
      const role = classifyCompleteLookWardrobeFragment(fragment);
      if (!role) {
        if (!projection.wardrobe.detailZones.includes('waist') && isCompleteLookLowerTorsoFragment(fragment)) continue;
        if (!projection.wardrobe.detailZones.includes('thigh') && isHemLengthOnlyFragment(fragment)) continue;
        buckets.passthrough.push(fragment);
        continue;
      }
      if (!shouldProjectWardrobeRole(projection, role, fragment)) continue;
      buckets[role].push(role === 'dress' ? projectDressIdentityFragment(fragment, projection) : fragment);
    }
  }

  buckets.passthrough = buckets.passthrough.filter((fragment) => {
    if (/\b(?:controlled by|color selection|palette|coordinated top-to-bottom|selected\s+(?:main\s+)?(?:fabric|uniform|satin|dress|latex|swim fabric|tonal palette|color))\b/i.test(fragment)) return true;
    if (!/\b(?:look|styling|outfit)\b/i.test(fragment)) return true;
    buckets.style.push(fragment);
    return false;
  });

  const orderedFragments = [
    ...buckets.style,
    ...buckets.top,
    ...buckets.dress,
    ...buckets.bottom,
    ...buckets.outerwear,
    ...buckets.legwear,
    ...buckets.shoes,
    ...buckets.bag,
    ...buckets.headAccessory,
    ...buckets.eyewear,
    ...buckets.earrings,
    ...buckets.neckAccessory,
    ...buckets.wristAccessory,
    ...buckets.ring,
    ...buckets.waistAccessory,
    ...buckets.passthrough,
  ];

  return orderedFragments.join(', ');
}

function buildVisibleSpecialOutfitPrompt(item, palette = null, context = null) {
  return filterCompleteLookPromptForFraming(buildSpecialOutfitPrompt(item, palette), context);
}

function buildVisibleOutfitPresetPrompt(item, colorState = {}, context = null) {
  return filterCompleteLookPromptForFraming(buildOutfitPresetPrompt(item, colorState), context);
}

function isUpperCropVisibilityBucket(bucket) {
  return bucket === COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL
    || bucket === COMPOSITION_VISIBILITY_BUCKETS.HEAD_SHOULDERS
    || bucket === COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP;
}

function filterZImageWardrobeAddonForFraming(value, context, roleOverride = '') {
  const text = stripMarkdown(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const role = roleOverride || classifyCompleteLookWardrobeFragment(text);
  return shouldKeepWardrobeRoleForContext(role, context, text) ? text : '';
}

function cleanVisibilityFilteredText(value) {
  return stripMarkdown(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*;\s*/g, '; ')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/,\s*;/g, ';')
    .replace(/;\s*,/g, ';')
    .replace(/,\s*\./g, '.')
    .replace(/;\s*\./g, '.')
    .replace(/\.\s*,/g, ',')
    .trim();
}

function filterFaceOnlyTorsoAngleText(value, context) {
  if (!isFaceOnlyCloseupFramingItem(context?.framing)) return value;
  return stripMarkdown(value || '')
    .replace(/\bfront three-quarter torso angle\b/gi, 'front three-quarter face angle')
    .replace(/\bfrontal torso toward camera\b/gi, 'frontal face toward camera')
    .trim();
}

function filterZImagePoseForFraming(value, context) {
  const bucket = getCompositionVisibilityProjection(context).bucket;
  let text = stripMarkdown(value || '').replace(/\s+/g, ' ').trim();
  if (
    !text
    || bucket === COMPOSITION_VISIBILITY_BUCKETS.UNCONSTRAINED
    || bucket === COMPOSITION_VISIBILITY_BUCKETS.FIXED_COMPOSITION
    || bucket === COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY
  ) return text;

  if (isUpperCropVisibilityBucket(bucket)) {
    text = text
      .replace(/\bShe is sitting with grounded forward-leaning seated arrangement,\s*upper body angled forward with stable seated weight\b/gi, 'She holds a low seated posture with the upper body leaning forward')
      .replace(/\bgrounded forward-leaning seated arrangement,\s*upper body angled forward with stable seated weight\b/gi, 'low seated posture with the upper body leaning forward')
      .replace(/\bsitting on the floor with grounded forward-leaning seated arrangement\b/gi, 'low seated posture with the upper body leaning forward')
      .replace(/\bhead turned into a clean side profile with the face oriented away from the camera\b/gi, 'head turned into a readable three-quarter profile with facial features still visible');
  }

  const lowerBodyPoseClause = (part) => {
    if (isUpperCropVisibilityBucket(bucket)) {
      return /\b(?:supporting on floor|supporting on the floor|resting on the leg|hands? on thighs?|upper-leg|hand holding the knee|near knees?|knees?|thighs?|ankles?|shoe|feet|foot|toes?|heels?|floor-seated|sitting on the floor|kneeling on floor|lying on floor|lower abdomen|one knee raised|legs? naturally|legs? extended|cross-legged|leg-cross|feet grounded)\b/i.test(part);
    }
    if (
      bucket === COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST
      || bucket === COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE
    ) {
      return /\b(?:shoe|feet|foot|toes?|heels?|ankles?)\b/i.test(part);
    }
    return false;
  };

  const parts = text
    .split(/\s*;\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !lowerBodyPoseClause(part));

  return cleanVisibilityFilteredText(parts.join('; '));
}

function buildOuterwearStylingLeadText(styling, { minimal = false } = {}) {
  if (!styling || isNoneLikeItem(styling)) return '';
  if (styling.zh === '正常穿著') {
    return minimal ? '' : 'outerwear worn normally on both shoulders';
  }
  if (styling.zh === '滑落肩部') {
    return 'outerwear slipped below the shoulder line, sleeves loosely on the arms, jacket body still readable as an outer layer';
  }
  return stripMarkdown(styling.en || '').replace(/\s+/g, ' ').trim();
}

function buildOuterwearFirstPrompt(baseLayerText, outerwearItem, outerwearColor, outerwearFit, outerwearPattern, outerwearOpening, outerwearStyling, { minimal = false } = {}) {
  if (!baseLayerText || !outerwearItem || isNoneLikeItem(outerwearItem)) return '';
  const outerwearText = buildOuterwearColoredPrompt(outerwearItem, outerwearColor, {
    fit: outerwearFit,
    pattern: outerwearPattern,
    opening: outerwearOpening,
    styling: outerwearStyling,
    minimalStyling: minimal,
  });
  if (!outerwearText) return baseLayerText;
  const joined = [
    outerwearText,
    `layered over ${baseLayerText}`,
  ].filter(Boolean).join(', ');
  return joined;
}

function buildDuoWardrobeText(wardrobeSlots, wardrobeColors, context = null) {
  const normalizeWearable = (value) => stripMarkdown(value || '')
    .replace(/\s+/g, ' ')
    .replace(/^wearing\s+/i, '')
    .trim();
  const joinParts = (parts) => parts.map(normalizeWearable).filter(Boolean).join(', ');
  const differentiationText = shouldAddDuoWardrobeDifferentiationPrompt(context, wardrobeSlots)
    ? DUO_WARDROBE_DIFFERENTIATION_PROMPT
    : '';
  const specialAText = normalizeWearable(buildVisibleSpecialOutfitPrompt(wardrobeSlots.specialOutfitA, wardrobeColors.completeLookPaletteA, context));
  const specialBText = normalizeWearable(buildVisibleSpecialOutfitPrompt(wardrobeSlots.specialOutfitB, wardrobeColors.completeLookPaletteB, context));
  const specialSharedText = normalizeWearable(buildVisibleSpecialOutfitPrompt(wardrobeSlots.specialOutfit, wardrobeColors.completeLookPalette, context));
  if (specialAText || specialBText) {
    const roleParts = [
      specialAText ? `woman 1 wears complete special outfit: ${specialAText}` : '',
      specialBText ? `woman 2 wears complete special outfit: ${specialBText}` : '',
    ].filter(Boolean);
    return {
      mode: 'role-special-outfits',
      clothingText: roleParts.join(', '),
      stylingText: `${roleParts.join(', ')}, complete wardrobe visible on both women, no additional clothing or accessory overrides`,
    };
  }
  if (specialSharedText) {
    return {
      mode: 'shared-special-outfit',
      clothingText: `both wearing complete special outfit: ${specialSharedText}`,
      stylingText: `both women share the complete special outfit: ${specialSharedText}, no additional clothing or accessory overrides`,
    };
  }
  const buildSharedAddonText = () => joinParts([
    buildOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors),
    buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor),
    buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor),
  ]);
  const buildRoleAddonText = (role) => {
    const suffix = role === 'a' ? 'A' : 'B';
    return joinParts([
      buildRoleOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors, role),
      buildColoredGrokPrompt(wardrobeSlots[`legwear${suffix}`], wardrobeColors[`legwear${suffix}Color`]),
      buildColoredGrokPrompt(wardrobeSlots[`shoes${suffix}`], wardrobeColors[`shoes${suffix}Color`]),
    ]);
  };
  const buildSharedMainText = () => {
    const dressText = normalizeWearable(buildCompleteLookDressPrompt(wardrobeSlots.dress, wardrobeColors.dressColor, wardrobeColors.completeLookPalette, { secondaryColor: wardrobeColors.topBottomPalette?.bottomColor }));
    const topText = normalizeWearable(buildTopWardrobePrompt(wardrobeSlots, wardrobeColors));
    const pantsText = normalizeWearable(buildBottomWardrobePrompt(wardrobeSlots.pants, wardrobeSlots, wardrobeColors));
    const skirtText = normalizeWearable(buildBottomWardrobePrompt(wardrobeSlots.skirt, wardrobeSlots, wardrobeColors));
    return joinParts(dressText ? [dressText] : [topText, pantsText, skirtText]);
  };
  const buildRoleMainText = (role) => {
    const suffix = role === 'a' ? 'A' : 'B';
    const preset = wardrobeSlots[`outfitPreset${suffix}`];
    if (preset && !isNoneLikeItem(preset)) {
      return normalizeWearable(buildVisibleOutfitPresetPrompt(preset, {
        legacy: wardrobeColors[`outfitPreset${suffix}Color`],
        primary: wardrobeColors[`outfitPreset${suffix}PrimaryColor`],
        contrast: wardrobeColors[`outfitPreset${suffix}ContrastColor`],
        lockedPalette: wardrobeColors[`outfitPreset${suffix}LockedPalette`],
        completeLookPalette: wardrobeColors[`completeLookPalette${suffix}`],
      }, context));
    }

    const dressText = normalizeWearable(buildCompleteLookDressPrompt(wardrobeSlots[`dress${suffix}`], wardrobeColors[`dress${suffix}Color`], wardrobeColors[`completeLookPalette${suffix}`], { secondaryColor: wardrobeColors[`topBottomPalette${suffix}`]?.bottomColor }));
    if (dressText) return dressText;

    const topText = normalizeWearable(buildRoleTopWardrobePrompt(wardrobeSlots, wardrobeColors, role));
    const pantsText = normalizeWearable(buildRoleBottomWardrobePrompt(wardrobeSlots[`pants${suffix}`], wardrobeSlots, wardrobeColors, role));
    const skirtText = normalizeWearable(buildRoleBottomWardrobePrompt(wardrobeSlots[`skirt${suffix}`], wardrobeSlots, wardrobeColors, role));
    return joinParts([topText, pantsText, skirtText]);
  };
  const hasRoleMainWardrobe = Boolean(
    wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB ||
    wardrobeSlots.dressA || wardrobeSlots.dressB ||
    wardrobeSlots.topA || wardrobeSlots.topB ||
    wardrobeSlots.pantsA || wardrobeSlots.pantsB ||
    wardrobeSlots.skirtA || wardrobeSlots.skirtB
  );

  if (hasRoleMainWardrobe) {
    const sharedAddonText = buildSharedAddonText();
    const sharedMainText = buildSharedMainText();
    const roleAAddonText = buildRoleAddonText('a');
    const roleBAddonText = buildRoleAddonText('b');
    const roleAMainText = buildRoleMainText('a') || sharedMainText;
    const roleBMainText = buildRoleMainText('b') || sharedMainText;
    const roleLooks = [
      roleAMainText ? `woman 1 wears ${roleAMainText}${roleAAddonText ? `, styled with ${roleAAddonText}` : ''}` : '',
      roleBMainText ? `woman 2 wears ${roleBMainText}${roleBAddonText ? `, styled with ${roleBAddonText}` : ''}` : '',
    ].filter(Boolean);

    return {
      mode: 'role-garments',
      clothingText: `${roleLooks.join(', ')}${sharedAddonText ? `, both styled with ${sharedAddonText}` : ''}`,
      stylingText: [
        ...roleLooks,
        sharedAddonText ? `both styled with ${sharedAddonText}` : '',
        differentiationText,
        'distinct outfit-visible editorial duo composition, complete wardrobe visible on both women, visible torso and wardrobe details, no headshot-only crop',
      ].filter(Boolean).join(', '),
    };
  }

  const presetAText = normalizeWearable(
    buildVisibleOutfitPresetPrompt(wardrobeSlots.outfitPresetA, {
      legacy: wardrobeColors.outfitPresetAColor,
      primary: wardrobeColors.outfitPresetAPrimaryColor,
      contrast: wardrobeColors.outfitPresetAContrastColor,
      lockedPalette: wardrobeColors.outfitPresetALockedPalette,
      completeLookPalette: wardrobeColors.completeLookPaletteA,
    }, context)
  );
  const presetBText = normalizeWearable(
    buildVisibleOutfitPresetPrompt(wardrobeSlots.outfitPresetB, {
      legacy: wardrobeColors.outfitPresetBColor,
      primary: wardrobeColors.outfitPresetBPrimaryColor,
      contrast: wardrobeColors.outfitPresetBContrastColor,
      lockedPalette: wardrobeColors.outfitPresetBLockedPalette,
      completeLookPalette: wardrobeColors.completeLookPaletteB,
    }, context)
  );
  if (presetAText || presetBText) {
    const sharedAddonText = buildSharedAddonText();
    const roleAAddonText = buildRoleAddonText('a');
    const roleBAddonText = buildRoleAddonText('b');
    const rolePresetParts = [
      presetAText ? `woman 1 in ${presetAText}${roleAAddonText ? `, ${roleAAddonText}` : ''}` : '',
      presetBText ? `woman 2 in ${presetBText}${roleBAddonText ? `, ${roleBAddonText}` : ''}` : '',
    ].filter(Boolean);
    const separateStylingText = `dressed separately: ${rolePresetParts.join(', ')}`;
    return {
      mode: 'role-presets',
      clothingText: `${separateStylingText}${sharedAddonText ? `, both styled with ${sharedAddonText}` : ''}`,
      stylingText: [
        separateStylingText,
        sharedAddonText ? `both styled with ${sharedAddonText}` : '',
        differentiationText,
        'distinct outfit-visible editorial styling, complete wardrobe visible on both women, visible torso and wardrobe details, no headshot-only crop',
      ].filter(Boolean).join(', '),
    };
  }

  const presetText = normalizeWearable(
    buildVisibleOutfitPresetPrompt(wardrobeSlots.outfitPreset, {
      legacy: wardrobeColors.outfitPresetColor,
      primary: wardrobeColors.outfitPresetPrimaryColor,
      contrast: wardrobeColors.outfitPresetContrastColor,
      lockedPalette: wardrobeColors.outfitPresetLockedPalette,
      completeLookPalette: wardrobeColors.completeLookPalette,
    }, context)
  );
  if (presetText) {
    const sharedAddonText = buildSharedAddonText();
    const roleAAddonText = buildRoleAddonText('a');
    const roleBAddonText = buildRoleAddonText('b');
    const roleAddonText = [
      roleAAddonText ? `woman 1 styled with ${roleAAddonText}` : '',
      roleBAddonText ? `woman 2 styled with ${roleBAddonText}` : '',
    ].filter(Boolean).join(', ');
    return {
      mode: 'shared-preset',
      clothingText: `both wearing ${presetText}${sharedAddonText ? `, styled with ${sharedAddonText}` : ''}${roleAddonText ? `, ${roleAddonText}` : ''}`,
      stylingText: `both women share the specified outfit preset, both wearing ${presetText}${sharedAddonText ? `, styled with ${sharedAddonText}` : ''}${roleAddonText ? `, ${roleAddonText}` : ''}, coordinated outfit-visible editorial duo composition, visible torso and wardrobe details, no headshot-only crop`,
    };
  }

  const dressText = normalizeWearable(buildCompleteLookDressPrompt(wardrobeSlots.dress, wardrobeColors.dressColor, wardrobeColors.completeLookPalette, { secondaryColor: wardrobeColors.topBottomPalette?.bottomColor }));
  const topText = normalizeWearable(buildTopWardrobePrompt(wardrobeSlots, wardrobeColors));
  const pantsText = normalizeWearable(
    buildBottomWardrobePrompt(wardrobeSlots.pants, wardrobeSlots, wardrobeColors)
  );
  const skirtText = normalizeWearable(
    buildBottomWardrobePrompt(wardrobeSlots.skirt, wardrobeSlots, wardrobeColors)
  );
  const outerwearText = normalizeWearable(buildOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors));
  const legwearText = normalizeWearable(buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor));
  const shoesText = normalizeWearable(buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor));
  const sharedParts = dressText
    ? [outerwearText, dressText, legwearText, shoesText]
    : [outerwearText, topText, pantsText, skirtText, legwearText, shoesText];
  const sharedText = joinParts(sharedParts);
  const roleAAddonText = buildRoleAddonText('a');
  const roleBAddonText = buildRoleAddonText('b');
  const roleAddonText = [
    roleAAddonText ? `woman 1 styled with ${roleAAddonText}` : '',
    roleBAddonText ? `woman 2 styled with ${roleBAddonText}` : '',
  ].filter(Boolean).join(', ');

  if (!sharedText && !roleAddonText) return { mode: 'none', clothingText: '', stylingText: '' };
  return {
    mode: 'shared-pieces',
    clothingText: [sharedText ? `both wearing ${sharedText}` : '', roleAddonText].filter(Boolean).join(', '),
    stylingText: `both women share the specified wardrobe styling${sharedText ? `, both wearing ${sharedText}` : ''}${roleAddonText ? `, ${roleAddonText}` : ''}, coordinated outfit-visible editorial duo composition, matching wardrobe structure with subtle individual fit differences, visible torso and wardrobe details, no headshot-only crop, no split wardrobe interpretation`,
  };
}

function buildDuoSceneAnchorText(context, wardrobeSlots, wardrobeColors) {
  if (context.subject.count !== 2) return '';
  const duoWardrobeText = buildDuoWardrobeText(wardrobeSlots, wardrobeColors, context);
  if (!duoWardrobeText.clothingText) return '';
  const differentiationText = shouldAddDuoWardrobeDifferentiationPrompt(context, wardrobeSlots)
    ? DUO_WARDROBE_DIFFERENTIATION_PROMPT
    : '';
  const subjectBaseText = stripMarkdown(context.subject.en || 'two women').replace(/\s+/g, ' ').trim();
  const roleAccessoryText = [
    buildRoleSubjectAccessoryPrompt(wardrobeSlots, 'a'),
    buildRoleSubjectAccessoryPrompt(wardrobeSlots, 'b'),
  ].filter(Boolean).join(', ');
  const subjectText = roleAccessoryText ? `${subjectBaseText}, ${roleAccessoryText}` : subjectBaseText;
  const projectedScene = context.projectedScene || buildProjectedScene(context);
  const sceneAccentText = projectedScene.sceneAccentText;
  const locationText = projectedScene.locationText;
  const locationDetail = [locationText, sceneAccentText].filter(Boolean).join(', ');
  const locationClause = locationDetail ? ` in ${locationDetail}` : '';
  return `an editorial film still of ${subjectText} ${duoWardrobeText.clothingText}${locationClause}, ${[
    differentiationText,
    'outfit-visible editorial duo composition, visible torso and wardrobe details, both women shown within the same continuous frame, avoid headshot-only crop',
  ].filter(Boolean).join(', ')}`;
}

function getTopBottomHaystack(item) {
  return toHaystack(item?.zh || '', item?.en || '', item?.desc || '');
}

function isLowRiseBottomItem(item) {
  if (!item || isNoneLikeItem(item)) return false;
  return hasAny(getTopBottomHaystack(item), ['low-rise', 'ultra low-rise', '低腰', '露腰', 'exposed hip line']);
}

function isCroppedTopItem(item) {
  if (!item || isNoneLikeItem(item)) return false;
  return hasAny(getTopBottomHaystack(item), ['cropped', 'crop top', '短版', '露臍', '露腰', 'exposed waist']);
}

function isUntuckedTopItem(item) {
  if (!item || isNoneLikeItem(item)) return false;
  return hasAny(getTopBottomHaystack(item), [
    'untucked',
    'worn untucked',
    'hanging hem',
    'relaxed hemline',
    'flowing hemline',
    'over the bottoms',
    'over the waistline',
    '放出衣襬',
    '衣襬自然放出',
  ]);
}

function isTuckedTopItem(item) {
  if (!item || isNoneLikeItem(item)) return false;
  return hasAny(getTopBottomHaystack(item), ['tucked into the bottoms', '紮入下身']);
}

function buildWaistlineCompatibilityPrompt(wardrobeSlots) {
  const bottom = wardrobeSlots.pants && !isNoneLikeItem(wardrobeSlots.pants)
    ? wardrobeSlots.pants
    : wardrobeSlots.skirt && !isNoneLikeItem(wardrobeSlots.skirt)
      ? wardrobeSlots.skirt
      : null;
  const top = wardrobeSlots.top && !isNoneLikeItem(wardrobeSlots.top) ? wardrobeSlots.top : null;
  const bottomRise = wardrobeSlots.bottomRise && !isNoneLikeItem(wardrobeSlots.bottomRise) ? wardrobeSlots.bottomRise : null;
  const topStyling = wardrobeSlots.topStyling && !isNoneLikeItem(wardrobeSlots.topStyling) ? wardrobeSlots.topStyling : null;
  const isLowRiseBottom = Boolean(
    (bottomRise && ['低腰', '超低腰'].includes(bottomRise.zh)) || isLowRiseBottomItem(bottom)
  );

  if (!bottom || !top || !isLowRiseBottom || isCroppedTopItem(top)) return '';

  if (topStyling?.zh === '自然放出' || isUntuckedTopItem(top)) {
    return 'top hem overlaps the low-rise waistband, long untucked length covering the abdomen';
  }

  if (['紮入下身', '半紮'].includes(topStyling?.zh) || isTuckedTopItem(top)) {
    return 'top hem tucks into the low-rise waistband with a natural low-rise proportion';
  }

  return 'top length meets or slightly overlaps the low-rise waistband';
}

function hasWardrobeText(item, patterns = []) {
  if (!item || isNoneLikeItem(item)) return false;
  const haystack = getTopBottomHaystack(item);
  return hasAny(haystack, patterns);
}

function isShortBottomLayer(item) {
  return hasWardrobeText(item, [
    '短褲',
    'shorts',
    'mini shorts',
    'hot pants',
  ]);
}

function isLongBottomLayer(item) {
  if (isShortBottomLayer(item)) return false;
  return hasWardrobeText(item, [
    '褲',
    '牛仔褲',
    '長褲',
    '寬褲',
    'leggings',
    '長裙',
    'jeans',
    'pants',
    'long pants',
    'wide-leg',
    'trousers',
    'long skirt',
    'maxi',
  ]);
}

function buildWardrobeLayeringLogicPrompt() {
  return '';
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
  if (typeof item === 'string') return item.replace(/\s+/g, ' ').trim();
  if (!item || isNoneLikeItem(item)) return '';
  return stripMarkdown(item.en).replace(/\s+/g, ' ').trim();
}

function buildEyewearPrompt(eyewear, color = null, placement = null) {
  if (!eyewear || isNoneLikeItem(eyewear)) return '';
  const base = buildAccessoryPrompt(eyewear);
  const colorText = color && !isNoneLikeItem(color) ? buildAccessoryPrompt(color) : '';
  const placementText = placement && !isNoneLikeItem(placement)
    ? buildAccessoryPrompt(placement)
    : 'worn normally on the face, lenses aligned over the eyes';

  return [colorText, base, placementText].filter(Boolean).join(', ');
}

function cleanSubjectAccessoryPrompt(item) {
  return buildAccessoryPrompt(item)
    .replace(/^wearing\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSubjectAccessoryPrompt({ eyewear, eyewearColor, eyewearPlacement, earrings, neckAccessory } = {}) {
  const parts = [
    buildEyewearPrompt(eyewear, eyewearColor, eyewearPlacement),
    cleanSubjectAccessoryPrompt(earrings),
    cleanSubjectAccessoryPrompt(neckAccessory),
  ].filter(Boolean);

  const dedupedParts = dedupeRepeatedCommaFragments(parts);
  return dedupedParts.length > 0 ? `with ${joinNaturalList(dedupedParts)}` : '';
}

function appendSubjectAccessories(subjectText, accessoryText) {
  const cleanedSubject = stripMarkdown(subjectText || '').replace(/\s+/g, ' ').trim();
  if (!cleanedSubject) return accessoryText || '';
  if (!accessoryText) return cleanedSubject;
  const separator = /^woman\s+\d\b/i.test(accessoryText) ? ', ' : ' ';
  return `${cleanedSubject}${separator}${accessoryText}`;
}

function buildRoleSubjectAccessoryPrompt(wardrobeSlots, role) {
  const suffix = role === 'a' ? 'A' : 'B';
  const accessoryText = buildSubjectAccessoryPrompt({
    eyewear: wardrobeSlots[`eyewear${suffix}`],
    eyewearColor: wardrobeSlots[`eyewear${suffix}Color`],
    eyewearPlacement: wardrobeSlots[`eyewear${suffix}Placement`],
    earrings: wardrobeSlots[`earrings${suffix}`],
    neckAccessory: wardrobeSlots[`neckAccessory${suffix}`],
  });

  return accessoryText ? `woman ${role === 'a' ? '1' : '2'} ${accessoryText}` : '';
}

function buildFacialFeaturesPrompt(faceItem, { eyewear, earrings } = {}) {
  const baseFace = faceItem && !isNoneLikeItem(faceItem)
    ? stripMarkdown(faceItem.en).replace(/\s+/g, ' ').trim()
    : '';
  const normalizeFaceAccessory = (value) => value.replace(/^wearing\s+/i, '').trim();
  const faceAccessories = [buildAccessoryPrompt(eyewear), buildAccessoryPrompt(earrings)]
    .filter(Boolean)
    .map(normalizeFaceAccessory);
  const accessoryText = faceAccessories.length > 0 ? `wearing ${faceAccessories.join(' and ')}` : '';

  if (!baseFace && !accessoryText) return '';
  if (!baseFace) return accessoryText;
  if (!accessoryText) return baseFace;
  return `${baseFace}. ${accessoryText}`;
}

function ensureTerminalPeriod(value) {
  const cleaned = stripMarkdown(value).trim();
  if (!cleaned) return '';
  if (/[.!?]$/.test(cleaned)) return cleaned;
  return `${cleaned}.`;
}

function sanitizeSkeletonPromptText(value) {
  return stripMarkdown(value || '')
    .replace(/extreme face close-up/gi, 'extreme skull close-up')
    .replace(/the entire face filling almost the whole frame/gi, 'the cranial structure filling almost the whole frame')
    .replace(/full facial features clearly visible/gi, 'full cranial structure clearly visible')
    .replace(/detailed facial features/gi, 'detailed cranial structure')
    .replace(/facial features/gi, 'cranial structure')
    .replace(/\bfacial\b/gi, 'cranial')
    .replace(/\bface\b/gi, 'skull')
    .replace(/moody facial shadow/gi, 'moody cranial shadow')
    .replace(/clean facial profile/gi, 'clean cranial profile')
    .replace(/commercial portrait glow/gi, 'clean commercial studio glow')
    .replace(/portrait composition/gi, 'specimen composition')
    .replace(/portrait viewpoint/gi, 'specimen viewpoint')
    .replace(/portrait softness/gi, 'specimen softness')
    .replace(/portrait glow/gi, 'specimen glow')
    .replace(/\bportrait\b/gi, 'specimen study')
    .replace(/\bportraiture\b/gi, 'studio stillness')
    .replace(/transparent skin tones/gi, 'clean tonal separation')
    .replace(/warm skin tones/gi, 'warm tonal rendering')
    .replace(/pleasing skin tones/gi, 'pleasing tonal rendering')
    .replace(/flattering skin tones/gi, 'flattering tonal rendering')
    .replace(/realistic skin detail/gi, 'realistic surface detail')
    .replace(/skin-edge tinting/gi, 'edge tinting')
    .replace(/skin separation/gi, 'tonal separation')
    .replace(/skin warmth/gi, 'warm tonal presence')
    .replace(/skin rendering/gi, 'surface rendering')
    .replace(/\bskin tones\b/gi, 'tonal rendering')
    .replace(/\bskin\b/gi, 'surface')
    .replace(/glowing hair edges/gi, 'glowing skeletal edges')
    .replace(/hair edges/gi, 'skeletal edges')
    .replace(/touching hair/gi, 'touching the skull')
    .replace(/\bhair\b/gi, 'skull')
    .replace(/elongated legs/gi, 'elongated skeletal stance')
    .replace(/full-length figure framing/gi, 'full-length skeletal figure framing')
    .replace(/complete lower-body visibility/gi, 'complete lower skeletal visibility')
    .replace(/lower-body/gi, 'lower skeletal')
    .replace(/upper-body/gi, 'upper skeletal')
    .replace(/bust-up/gi, 'upper-skeleton')
    .replace(/\bchest\b/gi, 'ribcage')
    .replace(/upper torso/gi, 'upper ribcage')
    .replace(/\btorso\b/gi, 'ribcage')
    .replace(/\bbody outline\b/gi, 'skeletal outline')
    .replace(/\bbody language\b/gi, 'skeletal gesture')
    .replace(/\bbody\b/gi, 'skeletal figure')
    .replace(/beauty lighting/gi, 'clean studio lighting')
    .replace(/beauty photography/gi, 'specimen photography')
    .replace(/beauty body language/gi, 'specimen gesture')
    .replace(/beauty skeletal gesture/gi, 'specimen gesture')
    .replace(/beauty studio lighting/gi, 'clean specimen studio lighting')
    .replace(/\bbeauty\b/gi, 'specimen')
    .replace(/fashion portrait/gi, 'specimen study')
    .replace(/fashion perspective/gi, 'gallery perspective')
    .replace(/fashion finish/gi, 'gallery finish')
    .replace(/fashion attitude/gi, 'gallery attitude')
    .replace(/\bfashion\b/gi, 'gallery')
    .replace(/coherent fabric construction/gi, 'coherent anatomical structure')
    .replace(/clear facial readability/gi, 'clear skeletal structure readability')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSceneAccentMoodType(lighting) {
  if (!lighting || isNoneLikeItem(lighting)) return '';

  const haystack = toHaystack(lighting.zh || '', lighting.en || '', lighting.desc || '');
  if (hasAny(haystack, ['月光夜色', 'moonlit night'])) return 'moonlit_night';
  if (hasAny(haystack, ['藍調傍晚', 'blue hour'])) return 'blue_hour';
  if (hasAny(haystack, ['城市夜間混合光', '夜晚街燈', 'streetlit night', 'urban night ambience'])) return 'streetlit_night';
  return '';
}

function getSceneAccentProfile(location) {
  if (!location || isNoneLikeItem(location)) return '';

  const tags = new Set(location.meta?.tags || []);
  const haystack = toHaystack(location.zh || '', location.en || '', location.desc || '');
  const isIndoor = location.zh?.startsWith('室內') || (tags.has('indoor') && !tags.has('outdoor'));
  const isNaturalBeachLike = hasAny(haystack, [
    'beach',
    'shoreline',
    'coastline',
    'cove',
    'rocky coast',
    'sand dune',
    'grassland',
    'plains',
    'meadow',
    'tatami',
    'tree shade',
    '樹下',
    '草地',
    '草原',
    '海灘',
    '海岸線',
    '海灣',
    '榻榻米',
  ]);

  if (isIndoor || isNaturalBeachLike) return '';

  const isWaterfrontUrban = tags.has('waterfront') && hasAny(haystack, [
    'marina',
    'harbor',
    'dock',
    'pier',
    'poolside',
    'swimming pool',
    'resort pool',
    'yacht',
    'promenade',
    'city skyline',
    'resort',
    'river-view',
    'river below',
    'river channel',
    'riverside',
    'rooftop',
    'canal',
    'bridge',
    '泳池',
    '度假村',
    '河流',
    '河景',
    '河道',
    '遊艇',
    '碼頭',
    '港灣',
    '天際線',
    '頂樓',
    '屋頂',
    '河道',
    '橋',
  ]);

  if (isWaterfrontUrban) return 'urban_waterfront';

  const isUrbanBuiltScene = hasAny(haystack, [
    'residential neighborhood',
    'local lane',
    'vending machine',
    'street',
    'sidewalk',
    'alley',
    'pedestrian',
    'storefront',
    'shopfront',
    'café',
    'bar entrance',
    'road',
    'apartment',
    'houses',
    'station front',
    'crossing',
    'plaza',
    'rooftop',
    'skyline',
    'townhouse',
    'window seat',
    'iron railing',
    'stone wall',
    'residence entrance',
    '路邊',
    '住宅區',
    '巷弄',
    '自動販賣機',
    '街頭',
    '人行道',
    '咖啡館',
    '酒吧門口',
    '道路',
    '公寓',
    '民宅',
    '廣場',
    '頂樓',
    '天際線',
    '洋房',
    '欄杆',
    '石牆',
  ]);

  if (isUrbanBuiltScene || tags.has('urban') || tags.has('commercial') || tags.has('residential')) {
    return 'urban_street';
  }

  return '';
}

function buildContextualSceneAccent(context, { short = false } = {}) {
  const moodType = getSceneAccentMoodType(context?.lighting);
  const profile = getSceneAccentProfile(context?.location);

  if (!moodType || !profile) return '';

  const variants = {
    urban_street: {
      moonlit_night: {
        full: 'a few softly lit windows, vending machine panels glowing softly in the dark, sparse street lamps, faint distant building lights',
        short: 'softly lit windows, glowing vending machines, and sparse street lamps',
      },
      blue_hour: {
        full: 'early evening practical lights beginning to appear, a few dim interior windows, vending machine glow becoming visible, soft street lighting starting to punctuate the street',
        short: 'early evening practical lights starting to appear',
      },
      streetlit_night: {
        full: 'lit windows, glowing vending machine panels, street lamps casting soft pools of light, scattered building lights along the street',
        short: 'lit windows, glowing vending machines, and street lamps',
      },
    },
    urban_waterfront: {
      moonlit_night: {
        full: 'sparse illuminated windows across the skyline, distant harbor or city lights, faint reflections from practical light sources on surrounding surfaces',
        short: 'sparse skyline lights and faint harbor glow',
      },
      blue_hour: {
        full: 'city lights beginning to emerge, a few illuminated windows across the skyline, subtle harbor and building lights appearing in the distance',
        short: 'early city lights appearing across the skyline',
      },
      streetlit_night: {
        full: 'layered building lights, brighter harbor and city light points, subtle reflections from surrounding artificial lights',
        short: 'layered city lights and harbor reflections',
      },
    },
  };

  return variants[profile]?.[moodType]?.[short ? 'short' : 'full'] || '';
}

function isSolidColorStudioLocation(location) {
  const tags = new Set(location?.meta?.tags || []);
  return tags.has('solid_color_studio');
}

function getImportedWorldSceneArchitectureText(context) {
  if (context?.locks?.importedWorldSceneMode !== 'architecture') return '';
  return stripMarkdown(context?.locks?.importedWorldSceneArchitectureText || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildStructuredPromptSections(context, character, wardrobe, wardrobeColors, lightDirection, film) {
  const characterSlots = extractCharacterSlots(character);
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
  const specialSubjectMode = isDedicatedSpecialSubject(context.subject);
  const characterProfileMode = isCharacterProfileSubject(context.subject);
  const skeletonMode = isSkeletonSubject(context.subject);
  const fixedCompositionSetActive = isFixedCompositionSetActive(context.fixedCompositionSet);
  const fixedSetSelfShotMode = fixedCompositionSetActive && isFixedSetSelfShotMode(context.fixedSetCaptureMode);
  const duoWardrobeText = buildDuoWardrobeText(wardrobeSlots, wardrobeColors, context);
  const duoSceneAnchorText = buildDuoSceneAnchorText(context, wardrobeSlots, wardrobeColors);
  const hasDuoSceneAnchor = Boolean(duoSceneAnchorText);
  const waistlineCompatibilityText = buildWaistlineCompatibilityPrompt(wardrobeSlots);
  const wardrobeLayeringLogicText = buildWardrobeLayeringLogicPrompt(wardrobeSlots);
  const useCharacterIdentityAnchor = Boolean(context.characterProfilePrompt) && context.subject.count === 1 && !specialSubjectMode;
  const expressionText = characterSlots.expression ? resolvePromptVariant(characterSlots.expression, 'expression', context.subject.count) : '';
  const duoExpressionText = characterSlots.duoExpression && !isNoneLikeItem(characterSlots.duoExpression) ? characterSlots.duoExpression.en : '';
  const actionPoseText = characterSlots.actionPose && !isNoneLikeItem(characterSlots.actionPose)
    ? characterSlots.actionPose.en
    : '';
  const poseText = context.subject.count === 2
    ? (characterSlots.duoPose && !isNoneLikeItem(characterSlots.duoPose) ? characterSlots.duoPose.en : '')
    : actionPoseText
    ? ''
    : characterSlots.poseComposer && !isNoneLikeItem(characterSlots.poseComposer)
      ? characterSlots.poseComposer.en
      : characterSlots.pose && !isNoneLikeItem(characterSlots.pose)
      ? resolvePromptVariant(characterSlots.pose, 'pose', context.subject.count)
      : '';
  const specialActionText = characterSlots.specialAction && !isNoneLikeItem(characterSlots.specialAction)
    ? characterSlots.specialAction.en
    : '';
  const duoPoseBaseText = characterSlots.duoPoseBase && !isNoneLikeItem(characterSlots.duoPoseBase)
    ? characterSlots.duoPoseBase.en
    : '';
  const projectedScene = context.projectedScene || buildProjectedScene(context);
  const sceneAccentText = projectedScene.sceneAccentText;
  const importedWorldSceneArchitectureText = projectedScene.worldSceneText;
  const compositionVisibilityProjection = getCompositionVisibilityProjection(context);
  const hideWardrobeForFaceDetail = compositionVisibilityProjection.bucket === COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL;
  const usesPartialWardrobeProjection = !isCompleteWardrobeProjection(compositionVisibilityProjection);
  const projectWardrobeRole = (role, value) => (
    value && shouldProjectWardrobeRole(compositionVisibilityProjection, role, value) ? value : ''
  );
  const sceneProtectedWardrobeMode = !specialSubjectMode
    && !hasDuoSceneAnchor
    && Boolean(
      wardrobeSlots.specialOutfit
      || wardrobeSlots.specialOutfitA
      || wardrobeSlots.specialOutfitB
      || wardrobeSlots.outfitPreset
      || wardrobeSlots.outfitPresetA
      || wardrobeSlots.outfitPresetB
    );
  const buildGrokSubjectText = () => {
    const subjectText = buildCharacterCardSubjectPrompt(context.subject, context.locks, context, wardrobe);
    const baseSubjectText = useCharacterIdentityAnchor ? `${subjectText} ${context.characterProfilePrompt}` : subjectText;
    if (specialSubjectMode) return [baseSubjectText, buildSpecialSubjectIntegrationPrompt(context.subject)].filter(Boolean).join(', ');

    if (context.subject.count === 2) {
      const roleAccessoryText = [
        buildRoleSubjectAccessoryPrompt(wardrobeSlots, 'a'),
        buildRoleSubjectAccessoryPrompt(wardrobeSlots, 'b'),
      ].filter(Boolean).join(', ');

      return roleAccessoryText ? `${baseSubjectText}, ${roleAccessoryText}` : baseSubjectText;
    }

    return appendSubjectAccessories(baseSubjectText, buildSubjectAccessoryPrompt({
      eyewear: wardrobeSlots.eyewear,
      eyewearColor: wardrobeSlots.eyewearColor,
      eyewearPlacement: wardrobeSlots.eyewearPlacement,
      earrings: wardrobeSlots.earrings,
      neckAccessory: wardrobeSlots.neckAccessory,
    }));
  };
  const sectionModel = createPromptSectionModel({
    normalizeValue: ensureTerminalPeriod,
    shouldInclude: (value) => Boolean(value) && !isNoneLikePromptText(value),
  });
  const addLine = sectionModel.addSection;
  const addItemLine = (label, item) => {
    if (!item || isNoneLikeItem(item)) return;
    addLine(label, item.en);
  };
  const addContextLine = (label, item, formatter = (entry) => entry.en) => {
    if (!item || isNoneLikeItem(item)) return;
    addLine(label, formatter(item));
  };
  const skeletonText = (value) => (skeletonMode ? sanitizeSkeletonPromptText(value) : value);
  const addFixedCompositionSetLines = () => {
    if (!fixedCompositionSetActive) return;
    const allowCameraVariation = fixedCompositionSetAllowsCameraVariation(context.fixedCompositionSet);
    addContextLine('Fixed Composition Set', context.fixedCompositionSet, (item) => skeletonText(item.en));
    addContextLine('Fixed Set Position', context.fixedSetPosition, (item) => skeletonText(item.en));
    addContextLine('Fixed Set Background State', context.fixedSetBackgroundState, (item) => skeletonText(item.en));
    addContextLine('Fixed Set Capture Mode', context.fixedSetCaptureMode, (item) => skeletonText(item.en));
    addContextLine('Fixed Set Performance State', context.fixedSetPerformanceState, (item) => skeletonText(item.en));
    if (allowCameraVariation) {
      addContextLine('Angle', context.angle, (item) => skeletonText(resolvePromptVariant(item, 'angle', context.subject.count)));
      addContextLine('Orbit Angle', context.orbit, (item) => skeletonText(resolvePromptVariant(item, 'orbit', context.subject.count)));
    }
    addLine('Fixed Set Integrity', skeletonText(buildFixedSetIntegrityText(context.fixedCompositionSet, context.fixedSetCaptureMode)));
    addContextLine('Ambient Light Conditions', context.lighting, (item) => skeletonText(item.en));
    addContextLine('Subject Light Style', lightDirection, (item) => skeletonText(resolvePromptVariant(item, 'lightDirection', context.subject.count)));
  };
  const addGrokSceneLines = () => {
    addLine('World Scene Architecture', skeletonText(importedWorldSceneArchitectureText));
    addLine('Location', skeletonText(projectedScene.locationText));
    addLine('Scene Accent', skeletonText(sceneAccentText));
    addContextLine('Ambient Light Conditions', context.lighting, (item) => skeletonText(item.en));
    addContextLine('Subject Light Style', lightDirection, (item) => skeletonText(resolvePromptVariant(item, 'lightDirection', context.subject.count)));
  };
  const buildGrokFramingText = () => {
    const base = context.framing ? resolvePromptVariant(context.framing, 'framing', context.subject.count) : '';
    if (!base || context.framing?.zh !== '全身鏡頭 (Full Body Shot)') return skeletonText(base);

    const hasLegwear = wardrobeSlots.legwear && !isNoneLikeItem(wardrobeSlots.legwear);
    const hasShoes = wardrobeSlots.shoes && !isNoneLikeItem(wardrobeSlots.shoes);
    const longBottom = (wardrobeSlots.pants && !isNoneLikeItem(wardrobeSlots.pants) && isLongBottomLayer(wardrobeSlots.pants))
      || (wardrobeSlots.skirt && !isNoneLikeItem(wardrobeSlots.skirt) && isLongBottomLayer(wardrobeSlots.skirt));
    const isBarefoot = wardrobeSlots.shoes?.zh === '赤腳';

    if (skeletonMode) return skeletonText(`${base}, complete skeletal feet clearly visible`);
    if (isBarefoot) return `${base}, bare feet clearly shown`;
    if (hasLegwear && hasShoes && !longBottom) return `${base}, legwear and shoes clearly visible`;
    if (hasShoes) return `${base}, shoes clearly visible`;
    return `${base}, full lower legs and feet clearly visible`;
  };
  const buildGrokCompositionPriorityText = () => {
    if (context.subject.count === 2 && duoWardrobeText.clothingText) {
      return 'let the two-person moment feel natural and candid; partial crop, overlapping bodies, wardrobe occlusion, and imperfect framing are acceptable when they support a believable photograph';
    }
    const visibility = context.framing?.meta?.visibility || '';
    if (sceneProtectedWardrobeMode) return '';
    if (!context.characterProfilePrompt || context.subject.count !== 1) return '';
    if (visibility === 'portrait') return '';
    if (visibility === 'full') {
      return 'preserve a full-body composition with the full outfit and environment clearly visible, avoid collapsing into a face-only crop';
    }
    if (visibility === 'wide') {
      return 'preserve a wide environmental composition with the full figure and surrounding setting clearly visible, avoid collapsing into a face-only crop';
    }
    return 'preserve the intended composition with the outfit and surrounding setting visible, avoid an overly tight face crop';
  };
  const buildGrokWardrobeIntegrityText = () => (
    fixedSetSelfShotMode
      ? 'preserve selected wardrobe identity through visible clothing fragments, fabric color, neckline, shoulder, torso, or local detail when the self-shot crop allows'
      : 'preserve the selected wardrobe as complete, realistic clothing with natural fabric texture, folds, and construction'
  );

  addLine('Duo Scene Anchor', duoSceneAnchorText);
  if (!hasDuoSceneAnchor) {
    addLine('Subject Count', buildGrokSubjectText());
  }
  if (context.subject.reference) {
    addLine('Reference Guidance', 'use the attached reference image as the primary facial identity guide, keep the facial features and overall likeness consistent with the image');
  }
  if (!hasDuoSceneAnchor && !specialSubjectMode && !characterProfileMode && context.subject.count !== 2) addItemLine('Body Type', characterSlots.bodyType);
  if (!specialSubjectMode && context.subject.count === 2) {
    addLine('Woman 1 Body Type', buildRoleHasPrompt(characterSlots.bodyTypeA, 'woman 1'));
    addLine('Woman 2 Body Type', buildRoleHasPrompt(characterSlots.bodyTypeB, 'woman 2'));
  }
  if (!specialSubjectMode && context.subject.count === 2) {
    addLine('Woman 1 Head Accessory', buildAccessoryPrompt(wardrobeSlots.headAccessoryA));
    addLine('Woman 2 Head Accessory', buildAccessoryPrompt(wardrobeSlots.headAccessoryB));
  } else if (!specialSubjectMode) {
    addLine('Head Accessory', buildAccessoryPrompt(wardrobeSlots.headAccessory));
  }
  if (fixedCompositionSetActive) {
    addFixedCompositionSetLines();
  } else if (sceneProtectedWardrobeMode) {
    addGrokSceneLines();
  }
  if (context.subject.count === 2 && !hasDuoSceneAnchor && (wardrobeSlots.specialOutfitA || wardrobeSlots.specialOutfitB)) {
    if (!hideWardrobeForFaceDetail) {
      addLine('Outerwear', projectWardrobeRole('outerwear', buildOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors)));
      addLine('Woman 1 Special Outfit', buildVisibleSpecialOutfitPrompt(wardrobeSlots.specialOutfitA, wardrobeColors.completeLookPaletteA, context));
      addLine('Woman 2 Special Outfit', buildVisibleSpecialOutfitPrompt(wardrobeSlots.specialOutfitB, wardrobeColors.completeLookPaletteB, context));
    }
  } else if (wardrobeSlots.specialOutfit && !hasDuoSceneAnchor) {
    if (!hideWardrobeForFaceDetail) {
      addLine('Outerwear', projectWardrobeRole('outerwear', buildOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors)));
      addLine('Special Outfit', buildVisibleSpecialOutfitPrompt(wardrobeSlots.specialOutfit, wardrobeColors.completeLookPalette, context));
    }
  }
  if (context.subject.count === 2 && !hasDuoSceneAnchor && (wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB)) {
    if (!hideWardrobeForFaceDetail) {
      addLine('Outerwear', projectWardrobeRole('outerwear', buildOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors)));
      addLine('Woman 1 Outfit Preset', buildVisibleOutfitPresetPrompt(wardrobeSlots.outfitPresetA, {
        legacy: wardrobeColors.outfitPresetAColor,
        primary: wardrobeColors.outfitPresetAPrimaryColor,
        contrast: wardrobeColors.outfitPresetAContrastColor,
        lockedPalette: wardrobeColors.outfitPresetALockedPalette,
        completeLookPalette: wardrobeColors.completeLookPaletteA,
      }, context));
      addLine('Woman 2 Outfit Preset', buildVisibleOutfitPresetPrompt(wardrobeSlots.outfitPresetB, {
        legacy: wardrobeColors.outfitPresetBColor,
        primary: wardrobeColors.outfitPresetBPrimaryColor,
        contrast: wardrobeColors.outfitPresetBContrastColor,
        lockedPalette: wardrobeColors.outfitPresetBLockedPalette,
        completeLookPalette: wardrobeColors.completeLookPaletteB,
      }, context));
    }
  } else if (wardrobeSlots.outfitPreset && !hasDuoSceneAnchor) {
    if (!hideWardrobeForFaceDetail) {
      addLine('Outerwear', projectWardrobeRole('outerwear', buildOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors)));
      addLine('Outfit Preset', buildVisibleOutfitPresetPrompt(wardrobeSlots.outfitPreset, {
        legacy: wardrobeColors.outfitPresetColor,
        primary: wardrobeColors.outfitPresetPrimaryColor,
        contrast: wardrobeColors.outfitPresetContrastColor,
        lockedPalette: wardrobeColors.outfitPresetLockedPalette,
        completeLookPalette: wardrobeColors.completeLookPalette,
      }, context));
    }
  }
  if (!specialSubjectMode && !wardrobeSlots.specialOutfit && !wardrobeSlots.specialOutfitA && !wardrobeSlots.specialOutfitB && !wardrobeSlots.outfitPreset && !wardrobeSlots.outfitPresetA && !wardrobeSlots.outfitPresetB && !(context.subject.count === 2 && duoWardrobeText.clothingText)) {
    const topText = buildTopWardrobePrompt(wardrobeSlots, wardrobeColors);
    const completeDressText = buildCompleteLookDressPrompt(wardrobeSlots.dress, wardrobeColors.dressColor, wardrobeColors.completeLookPalette, { secondaryColor: wardrobeColors.topBottomPalette?.bottomColor });
    const dressText = filterCompleteLookPromptForFraming(completeDressText, context);
    const pantsText = buildBottomWardrobePrompt(wardrobeSlots.pants, wardrobeSlots, wardrobeColors);
    const skirtText = buildBottomWardrobePrompt(wardrobeSlots.skirt, wardrobeSlots, wardrobeColors);
    const outerwearFirstDressText = buildOuterwearFirstPrompt(
      completeDressText,
      wardrobeSlots.outerwear,
      wardrobeColors.outerwearColor,
      wardrobeSlots.outerwearFit,
      wardrobeSlots.outerwearPattern,
      wardrobeSlots.outerwearOpening,
      wardrobeSlots.outerwearStyling,
    );
    const outerwearFirstTopText = buildOuterwearFirstPrompt(
      topText,
      wardrobeSlots.outerwear,
      wardrobeColors.outerwearColor,
      wardrobeSlots.outerwearFit,
      wardrobeSlots.outerwearPattern,
      wardrobeSlots.outerwearOpening,
      wardrobeSlots.outerwearStyling,
    );
    const usedOuterwearInMain = Boolean(
      (completeDressText && outerwearFirstDressText) ||
      (!completeDressText && outerwearFirstTopText)
    );
    if (!hideWardrobeForFaceDetail) {
      const outerwearText = buildOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors);
      if (usesPartialWardrobeProjection) {
        addLine('Outerwear', projectWardrobeRole('outerwear', outerwearText));
        addLine('Dress', projectWardrobeRole('dress', dressText));
        addLine('Top', completeDressText ? '' : projectWardrobeRole('top', topText));
      } else {
        if (!usedOuterwearInMain) addLine('Outerwear', outerwearText);
        addLine('Dress', outerwearFirstDressText || dressText);
        addLine('Top', completeDressText ? '' : (outerwearFirstTopText || topText));
      }
      addLine('Pants', completeDressText ? '' : projectWardrobeRole('bottom', pantsText));
      addLine('Skirt', completeDressText ? '' : projectWardrobeRole('bottom', skirtText));
      const legwearText = buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor);
      addLine('Legwear', projectWardrobeRole('legwear', legwearText));
      addLine('Shoes', projectWardrobeRole('shoes', buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor)));
    }
  }
  if (!specialSubjectMode && !hasDuoSceneAnchor && !wardrobeSlots.specialOutfit && !wardrobeSlots.specialOutfitA && !wardrobeSlots.specialOutfitB && (wardrobeSlots.outfitPreset || wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB)) {
    if (!hideWardrobeForFaceDetail) {
      const legwearText = buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor);
      addLine('Legwear', projectWardrobeRole('legwear', legwearText));
      addLine('Shoes', projectWardrobeRole('shoes', buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor)));
    }
  }
  if (!specialSubjectMode && !hasDuoSceneAnchor) {
    if (!hideWardrobeForFaceDetail) {
      if (!usesPartialWardrobeProjection) {
        addLine('Waistline Coordination', waistlineCompatibilityText);
        addLine('Wardrobe Layering Logic', wardrobeLayeringLogicText);
        addLine('Wardrobe Integrity', buildGrokWardrobeIntegrityText());
      }
    }
  }
  if (context.subject.count === 2 && !hasDuoSceneAnchor && !hideWardrobeForFaceDetail) addLine('Duo Wardrobe', duoWardrobeText.stylingText);
  if (actionPoseText) {
    addLine('Action Pose', skeletonText(actionPoseText));
  } else {
    addLine('Special Action', skeletonText(specialActionText));
    addLine(context.subject.count === 2 ? 'Duo Layout' : 'Pose', skeletonText(poseText));
  }
  if (context.subject.count === 2) addLine('Duo Pose Base', skeletonText(duoPoseBaseText));
  if (isAndroidSubject(context.subject)) {
    addItemLine('Hairstyle', characterSlots.hairstyle);
    addLine('Hair Color', buildHairColorPrompt(characterSlots.hairColor));
  }
  if (specialSubjectMode) addLine('Expression', skeletonText(expressionText));
  if (!specialSubjectMode && context.subject.count === 2) {
    addItemLine('Woman 1 Facial Features', characterSlots.facialFeaturesA);
    addItemLine('Woman 2 Facial Features', characterSlots.facialFeaturesB);
  } else if (!specialSubjectMode && !characterProfileMode && !useCharacterIdentityAnchor) {
    addLine('Facial Features', buildFacialFeaturesPrompt(characterSlots.facialFeatures));
  }
  if (!specialSubjectMode && context.subject.count === 2) {
    addItemLine('Woman 1 Hairstyle', characterSlots.hairstyleA);
    addItemLine('Woman 2 Hairstyle', characterSlots.hairstyleB);
    addLine('Woman 1 Hair Color', buildHairColorPrompt(characterSlots.hairColorA));
    addLine('Woman 2 Hair Color', buildHairColorPrompt(characterSlots.hairColorB));
  } else if (!specialSubjectMode && !characterProfileMode) {
    addItemLine('Hairstyle', characterSlots.hairstyle);
    addLine('Hair Color', buildHairColorPrompt(characterSlots.hairColor));
  }
  if (!specialSubjectMode && context.subject.count === 2) {
    addLine('Woman 1 Skin Details', buildRoleHasPrompt(characterSlots.skinDetailsA, 'woman 1'));
    addLine('Woman 2 Skin Details', buildRoleHasPrompt(characterSlots.skinDetailsB, 'woman 2'));
  } else if (!specialSubjectMode && !characterProfileMode && !useCharacterIdentityAnchor) {
    addItemLine('Skin Details', characterSlots.skinDetails);
  }
  if (!specialSubjectMode && context.subject.count === 2) {
    addLine('Duo Expression', duoExpressionText);
  } else if (!specialSubjectMode) {
    addLine('Expression', expressionText);
  }
  if (!fixedCompositionSetActive && !sceneProtectedWardrobeMode) {
    addGrokSceneLines();
  }
  if (context.style && !isNoneLikeItem(context.style)) {
    addLine('Photography Style', skeletonText(buildPhotographyStylePrompt(context.style)));
  }
  if (!fixedCompositionSetActive) {
    addLine('Framing', buildGrokFramingText());
    addLine('Composition Priority', buildGrokCompositionPriorityText());
    addContextLine('Angle', context.angle, (item) => skeletonText(resolvePromptVariant(item, 'angle', context.subject.count)));
    addContextLine('Orbit Angle', context.orbit, (item) => skeletonText(resolvePromptVariant(item, 'orbit', context.subject.count)));
    addContextLine('Lens', context.lens);
    addContextLine('Aperture / Depth of Field', context.aperture);
    addContextLine('Shutter / Motion Blur', context.shutter);
    addContextLine('Optical Effect', context.opticalEffect, (item) => skeletonText(item.en));
  } else if (fixedSetSelfShotMode) {
    addLine('Composition Priority', 'allow imperfect self-shot framing, partial subject crop, close-lens body proximity, and incomplete set visibility when it makes the social snapshot feel real');
  }
  if (fixedCompositionSetActive) {
    addContextLine('Aperture / Depth of Field', context.aperture);
    addContextLine('Shutter / Motion Blur', context.shutter);
  }
  addContextLine('Camera / Film', film, (item) => skeletonText(item.en));
  if (!specialSubjectMode && !characterProfileMode && !useCharacterIdentityAnchor) addLine('Character Identity', context.characterProfilePrompt);

  return sectionModel.toModel();
}

function getStructuredValues(valuesByLabel, labels) {
  return labels.flatMap((label) => valuesByLabel.get(label) || []).filter(Boolean);
}

function getStructuredLabeledValues(valuesByLabel, labels) {
  return labels.flatMap((label) => (
    valuesByLabel.get(label) || []
  ).map((value) => `${label}: ${value}`)).filter(Boolean);
}

function joinNaturalPromptValues(values) {
  return values
    .map((value) => stripMarkdown(value || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(', ');
}

function joinScenePromptValues(values) {
  return values
    .map((value) => stripTerminalPromptPunctuation(value))
    .filter(Boolean)
    .join(', ');
}

function splitPromptSentences(value) {
  return stripMarkdown(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function extractFixedSetAnchorText(fixedSet) {
  return (fixedSet?.integrityEn || '').match(/\bpreserve anchors:\s*([^;]+)/i)?.[1]?.trim() || '';
}

function cleanFixedSetOpeningSentence(fixedSet) {
  const firstSentence = splitPromptSentences(fixedSet?.en || '')[0] || '';
  return firstSentence
    .replace(/,\s*not a flat backdrop and not a tight subject portrait\b/i, '')
    .replace(/,\s*not a generic beach scene and not a tight subject portrait\b/i, '')
    .replace(/\s+and not a tight subject portrait\b/i, '')
    .replace(/[.!?]+$/g, '')
    .trim();
}

const Z_IMAGE_FIXED_SET_OPENING_PARAGRAPHS = {
  'concrete-wall-chesterfield-sofa': 'The portrait takes place inside a real-scale compact living-room editorial set anchored by a raw concrete wall, a large brown vintage Chesterfield leather sofa, dry branches, and a low coffee table. The sofa reads as adult-scale worn leather furniture, and the coffee table carries a few readable props such as art books, cushions, a cup, and a small lamp.',
  'limewash-black-velvet-industrial-sofa': 'The portrait takes place inside a real-scale compact editorial lounge set anchored by a warm ivory limewash plaster wall, a large matte black velvet sofa, and a low industrial coffee table. The wall has subtle hand-troweled texture, the sofa reads as adult-scale matte velvet furniture, and the coffee table carries a few readable props such as art books, a cup, and glassware.',
  'luxury-hotel-window-nyc': 'The portrait takes place inside a real-scale luxury hotel room editorial set anchored by a broad panoramic floor-to-ceiling glass wall, a New York-style high-rise skyline, and a soft white hotel bed. The glass reads as one mostly uninterrupted, lightly reflective plane, with bedding, pillows, bedside table, lamp, curtain edges, wine glass, and open book as readable room props.',
  'luxury-hotel-window-mount-fuji-spring': 'The portrait takes place inside a real-scale luxury hotel room editorial set anchored by a broad panoramic floor-to-ceiling glass wall, a spring Mount Fuji landscape, and a soft white hotel bed. Outside the glass, Mount Fuji remains the dominant distant anchor with residual summit snow, clean blue spring sky, fresh green foothills, small lakeside or town rooftops, and subtle cherry blossoms or spring foliage.',
  'luxury-hotel-window-mount-fuji-winter': 'The portrait takes place inside a real-scale luxury hotel room editorial set anchored by a broad panoramic floor-to-ceiling glass wall, a snow-covered Mount Fuji winter landscape, and a soft white hotel bed. Outside the glass, Mount Fuji remains the dominant distant anchor with cold clear air, blue-white winter daylight, snowy foothills or village rooftops, and quiet pale sky depth.',
  'retro-tile-bathtub': 'The portrait takes place inside a real-scale vintage bathroom editorial set anchored by a freestanding clawfoot bathtub, visible wet tile floor, aged tile wall, and porcelain sink or vanity with mirror above the sink. Keep the full bathtub body, tub feet, wet floor plane, sink or vanity, and mirror readable where possible, with chrome hardware, folded towels, bath bottles, a small wooden stool, foam or water surface, and subtle wet reflections as props. The subject reads fully soaked from head to toe with wet hair, damp skin, and water-clinging wardrobe or bare skin.',
  'seaside-slope-railway-crossing': 'The portrait takes place within a real-scale outdoor coastal downhill-road fixed composition set anchored by a downhill road plane, railway crossing gate, roadside poles and overhead wires, seaside town edges, and ocean horizon. The camera is positioned near the upper slope, looking downhill along the road plane toward the ocean horizon. A railway crossing gate cuts across the lower-middle frame while sloped asphalt, lane marks, overhead wires, distant shoreline, and open sky remain readable.',
  'seaside-stair-alley': 'The portrait takes place within a real-scale outdoor descending seaside stair-alley fixed composition set anchored by descending pale stairs, light side walls, handrails, plants or hydrangeas, overhead wires, and ocean horizon. The camera is positioned near the upper stairs, looking down the stair alley toward the ocean horizon. Descending pale stairs form the foreground and midground path toward the sea while side walls, rails, plants, distant shoreline, and open sky remain readable.',
};

const AI_FIXED_SET_SCENE_PHRASES = {
  'concrete-wall-chesterfield-sofa': 'The central scene is a raw concrete wall, a large brown Chesterfield leather sofa, dry branches, and a low coffee table with a few readable props.',
  'limewash-black-velvet-industrial-sofa': 'The central scene is a warm ivory limewash wall, a large matte black velvet sofa, and a low industrial coffee table with a few readable props.',
  'luxury-hotel-window-nyc': 'The central scene is a broad panoramic floor-to-ceiling glass wall, New York skyline, and soft white hotel bed with bedside props.',
  'luxury-hotel-window-mount-fuji-spring': 'The central scene is a broad panoramic floor-to-ceiling glass wall, spring Mount Fuji view, and soft white hotel bed with bedside props.',
  'luxury-hotel-window-mount-fuji-winter': 'The central scene is a broad panoramic floor-to-ceiling glass wall, snow-covered Mount Fuji winter view, and soft white hotel bed with bedside props.',
  'retro-tile-bathtub': 'The central scene is a freestanding clawfoot bathtub, visible wet tile floor, aged tile wall, and sink or vanity with mirror.',
  'seaside-slope-railway-crossing': 'The central scene is a coastal downhill road, railway crossing gate, roadside poles and wires, seaside town edges, and ocean horizon.',
  'seaside-stair-alley': 'The central scene is a descending seaside stair alley, light side walls, handrails, plants, overhead wires, and ocean horizon.',
};

function getFixedSetFreeInteractionZones(fixedSet) {
  const tags = new Set(fixedSet?.meta?.tags || []);
  if (fixedSet?.setGroupId === 'sofa-lounge') return 'the sofa seat, floor, coffee table, sofa armrests, wall-side space, or side decor';
  if (fixedSet?.setGroupId === 'hotel-window') return 'the bed, bed edge, window-side floor, bedside table, curtain edge, or pillow foreground';
  if (tags.has('bathtub_set')) return 'the bathtub, bathtub rim, wet floor, sink and mirror area, chrome faucet hardware, or stool-side foreground';
  if (fixedSet?.id === 'seaside-slope-railway-crossing') return 'the road foreground, crossing-gate side, slope midground, roadside edge, building-side margin, or utility-pole side';
  if (fixedSet?.id === 'seaside-stair-alley') return 'the stairs, side walls, handrails, plants, building edges, or stair foreground';
  return 'the fixed set anchors, floor plane, foreground, side area, or background architecture';
}

function isFreeInteractionFixedSetPosition(position) {
  return /^subject placement can vary\b/i.test(stripTerminalPromptPunctuation(position?.en || ''));
}

function buildZImageFixedSetPositionText(context) {
  const position = context.fixedSetPosition;
  if (!position || isNoneLikeItem(position)) return '';

  if (isFreeInteractionFixedSetPosition(position)) {
    return `The subject can interact with ${getFixedSetFreeInteractionZones(context.fixedCompositionSet)} in any way.`;
  }

  return ensureTerminalPeriod(capitalizePromptLead(
    stripTerminalPromptPunctuation(position.en)
      .replace(/\bcan be model-decided\b/gi, 'can remain flexible')
  ));
}

function buildZImageFixedSetCaptureText(captureMode) {
  if (!captureMode || isNoneLikeItem(captureMode)) return '';

  if (isFixedSetSelfShotMode(captureMode)) {
    if (captureMode.meta?.tags?.includes('fixed_set_imperfect_focus')) {
      return 'For imperfect self-shot capture, allow background-object focus, slight subject blur, off-center crop, and incomplete set visibility.';
    }
    return 'For self-shot capture, allow close-lens proximity, off-center crop, and incomplete set visibility.';
  }

  return 'Use photographer-shot fixed-set framing with clear face and wardrobe where framing allows.';
}

function buildZImageFixedSetPerformanceText(performanceState) {
  if (!performanceState || isNoneLikeItem(performanceState) || performanceState.id === 'model-natural') return '';

  return ensureTerminalPeriod(capitalizePromptLead(
    stripTerminalPromptPunctuation(performanceState.en)
      .replace(/\s+without specifying exact limb placement\b/i, '')
  ));
}

function buildZImageFixedSetViewText(context) {
  if (!fixedCompositionSetAllowsCameraVariation(context.fixedCompositionSet)) return '';

  const angle = context.angle && !isNoneLikeItem(context.angle)
    ? compactCameraDescriptor(context.angle, 'angle')
    : '';
  const orbit = context.orbit && !isNoneLikeItem(context.orbit)
    ? compactCameraDescriptor(context.orbit, 'orbit')
    : '';
  const viewText = [angle, orbit].filter(Boolean).join(' and ');

  return viewText ? `Use ${viewText} within the fixed set.` : '';
}

function buildZImageFixedSetInteractionParagraph(context) {
  return [
    buildZImageFixedSetPositionText(context),
    context.fixedSetBackgroundState && !isNoneLikeItem(context.fixedSetBackgroundState)
      ? ensureTerminalPeriod(capitalizePromptLead(stripTerminalPromptPunctuation(context.fixedSetBackgroundState.en)))
      : '',
    buildZImageFixedSetCaptureText(context.fixedSetCaptureMode),
    buildZImageFixedSetViewText(context),
    buildZImageFixedSetPerformanceText(context.fixedSetPerformanceState),
  ].filter(Boolean).join(' ');
}

function buildZImageFixedSetStabilityParagraph(context) {
  const fixedSet = context.fixedCompositionSet;
  if (!fixedSet || isNoneLikeItem(fixedSet)) return '';

  if (fixedSet.setGroupId === OUTDOOR_FIXED_SET_GROUP_ID) {
    return `Keep the ${getGptFixedSetArchitectureName(fixedSet)} stable. Vary only subject placement, pose, crop, lighting, mood, and selected background life state.`;
  }

  return `Keep the ${getGptFixedSetArchitectureName(fixedSet)} stable. Vary only subject placement, pose, crop, lighting, and mood.`;
}

function buildAiFixedSetInteractionSentence(context) {
  const position = context.fixedSetPosition;
  const fixedSet = context.fixedCompositionSet;
  if (!fixedSet || isNoneLikeItem(fixedSet)) return '';

  const positionText = position && !isNoneLikeItem(position)
    ? (isFreeInteractionFixedSetPosition(position)
        ? `The subject can interact with ${getFixedSetFreeInteractionZones(fixedSet)} in any way`
        : capitalizePromptLead(stripTerminalPromptPunctuation(position.en)
          .replace(/\bcan be model-decided\b/gi, 'can remain flexible')))
    : '';
  const selfShotText = context.fixedSetCaptureMode && isFixedSetSelfShotMode(context.fixedSetCaptureMode)
    ? 'close-lens self-shot framing'
    : '';
  const aiAngleText = context.angle && !isNoneLikeItem(context.angle)
    ? compactCameraDescriptor(context.angle, 'angle')
      .replace(/\b(shoulder|waist)-level camera\b/i, '$1-level')
    : '';
  const aiOrbitText = context.orbit && !isNoneLikeItem(context.orbit)
    ? compactCameraDescriptor(context.orbit, 'orbit')
    : '';
  const viewText = fixedCompositionSetAllowsCameraVariation(fixedSet)
    ? [aiAngleText, aiOrbitText].filter(Boolean).join(' ')
    : '';
  const modifiers = [selfShotText, viewText ? `a ${viewText}` : ''].filter(Boolean).join(' and ');

  if (positionText && modifiers) return `${positionText}, with ${modifiers} inside the fixed set`;
  if (positionText) return stripTerminalPromptPunctuation(positionText);
  if (modifiers) return `Use ${modifiers} inside the fixed set`;
  return '';
}

function buildAiFixedCompositionSceneClause(context) {
  const scenePhrase = AI_FIXED_SET_SCENE_PHRASES[context.fixedCompositionSet?.id];
  if (!scenePhrase) return '';

  return [scenePhrase, buildAiFixedSetInteractionSentence(context)].filter(Boolean).join(' ');
}

function buildGptFixedSetOpeningParagraph(fixedSet) {
  if (!fixedSet || isNoneLikeItem(fixedSet)) return '';

  if (fixedSet.en) {
    return ensureTerminalPeriod(stripTerminalPromptPunctuation(fixedSet.en));
  }

  const sentences = splitPromptSentences(fixedSet.en);
  const opening = cleanFixedSetOpeningSentence(fixedSet);
  const anchors = extractFixedSetAnchorText(fixedSet);
  const setupSentence = sentences
    .find((sentence) => /^Use a medium-wide editorial camera position\b/i.test(sentence) || /\bcamera is positioned\b/i.test(sentence))
    ?.replace(/^Treat the fixed set as the primary composition:\s*/i, '')
    .trim() || '';

  return [
    ensureTerminalPeriod(opening),
    anchors ? ensureTerminalPeriod(`Use ${anchors} as fixed anchors`) : '',
    setupSentence ? ensureTerminalPeriod(capitalizePromptLead(setupSentence)) : '',
  ].filter(Boolean).join(' ');
}

function naturalizeGptFixedSetSourceText(value) {
  return stripTerminalPromptPunctuation(value || '')
    .replace(/\bcan be model-decided\b/gi, 'can remain flexible')
    .replace(/\bleft to the image model\b/gi, 'kept flexible')
    .replace(/\blet the image model choose\b/gi, 'let natural variation shape')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildGptFixedSetPositionText(position) {
  if (!position || isNoneLikeItem(position)) return '';

  return ensureTerminalPeriod(capitalizePromptLead(naturalizeGptFixedSetSourceText(position.en)));
}

function buildGptFixedSetCaptureText(captureMode) {
  if (!captureMode || isNoneLikeItem(captureMode)) return '';

  return ensureTerminalPeriod(capitalizePromptLead(
    naturalizeGptFixedSetSourceText(captureMode.en)
      .replace(/^photographer-shot fixed set portrait\b/i, 'photographer-shot fixed-set portrait')
      .replace(/\bfixed composition remains readable\b/i, 'fixed set remains readable')
  ));
}

function buildGptFixedSetPerformanceText(performanceState) {
  if (!performanceState || isNoneLikeItem(performanceState)) return '';

  if (performanceState.id === 'model-natural') {
    return 'Natural body attitude and expression should align with the selected set position and capture mode.';
  }

  return ensureTerminalPeriod(capitalizePromptLead(
    stripTerminalPromptPunctuation(performanceState.en)
      .replace(/\s+without specifying exact limb placement\b/i, '')
  ));
}

function buildGptFixedSetViewText(context) {
  if (!fixedCompositionSetAllowsCameraVariation(context.fixedCompositionSet)) return '';

  const angle = context.angle && !isNoneLikeItem(context.angle)
    ? compactCameraDescriptor(context.angle, 'angle')
    : '';
  const orbit = context.orbit && !isNoneLikeItem(context.orbit)
    ? compactCameraDescriptor(context.orbit, 'orbit')
    : '';
  const viewText = [angle, orbit].filter(Boolean).join(' and ');

  return viewText ? `Use ${viewText} within the fixed set.` : '';
}

function buildGptFixedSetInteractionParagraph(context) {
  return [
    buildGptFixedSetPositionText(context.fixedSetPosition),
    context.fixedSetBackgroundState && !isNoneLikeItem(context.fixedSetBackgroundState)
      ? ensureTerminalPeriod(capitalizePromptLead(stripTerminalPromptPunctuation(context.fixedSetBackgroundState.en)))
      : '',
    buildGptFixedSetCaptureText(context.fixedSetCaptureMode),
    buildGptFixedSetViewText(context),
    buildGptFixedSetPerformanceText(context.fixedSetPerformanceState),
  ].filter(Boolean).join(' ');
}

function getGptFixedSetArchitectureName(fixedSet) {
  const tags = new Set(fixedSet?.meta?.tags || []);
  if (fixedSet?.setGroupId === 'sofa-lounge') return 'fixed lounge architecture';
  if (fixedSet?.setGroupId === 'hotel-window') return 'fixed hotel-window architecture';
  if (tags.has('bathtub_set')) return 'fixed bathroom architecture';
  if (fixedSet?.setGroupId === OUTDOOR_FIXED_SET_GROUP_ID) return 'fixed outdoor architecture';
  return 'fixed set architecture';
}

function naturalizeGptFixedSetSharedStructureText(value) {
  const text = stripTerminalPromptPunctuation(value || '')
    .replace(/^fixed-set rule:\s*/i, '')
    .replace(/^stable selected room architecture\b/i, 'Keep the selected room architecture stable')
    .replace(/^stable selected outdoor architecture\b/i, 'Keep the selected outdoor architecture stable')
    .trim();

  return text ? ensureTerminalPeriod(capitalizePromptLead(text)) : '';
}

function naturalizeGptFixedSetAnchorText(value) {
  const text = stripTerminalPromptPunctuation(value || '').trim();
  if (!text) return '';

  const anchorMatch = text.match(/^preserve anchors:\s*([^;]+)(;?\s*(.*))?$/i);
  if (!anchorMatch) return ensureTerminalPeriod(capitalizePromptLead(text.replace(/^preserve anchors:\s*/i, '')));

  const anchors = anchorMatch[1]?.trim() || '';
  const remainder = anchorMatch[3]?.trim() || '';
  if (!anchors) return '';

  return ensureTerminalPeriod([
    `Preserve ${anchors} as fixed anchors`,
    remainder,
  ].filter(Boolean).join('; '));
}

function naturalizeGptFixedSetReplacementGuardText(value) {
  const text = stripTerminalPromptPunctuation(value || '').trim();
  if (!text) return '';

  return ensureTerminalPeriod(capitalizePromptLead(
    text.replace(/^avoid\b/i, 'Do not shift into')
  ));
}

function buildGptFixedSetIntegrityParagraph(context) {
  const fixedSet = context.fixedCompositionSet;
  if (!fixedSet || isNoneLikeItem(fixedSet)) return '';

  return [
    naturalizeGptFixedSetSharedStructureText(fixedSet.sharedStructureEn || FIXED_COMPOSITION_SHARED_STRUCTURE_EN),
    naturalizeGptFixedSetAnchorText(fixedSet.integrityEn),
    naturalizeGptFixedSetReplacementGuardText(fixedSet.replacementGuardEn),
  ].filter(Boolean).join(' ');
}

function buildGptFixedCompositionSceneText(context) {
  if (!isFixedCompositionSetActive(context.fixedCompositionSet)) return '';

  return [
    buildGptFixedSetOpeningParagraph(context.fixedCompositionSet),
    buildGptFixedSetInteractionParagraph(context),
    buildGptFixedSetIntegrityParagraph(context),
  ].filter(Boolean).join('\n\n');
}

function getImageTypePresetOption(id) {
  return findById(IMAGE_TYPE_PRESET_OPTIONS, id) || IMAGE_TYPE_PRESET_OPTIONS[0];
}

function resolveImageTypePreset(context) {
  return context.imageTypePreset || getImageTypePresetOption(context.locks?.imageTypePresetId);
}

function buildImageTypeText(context) {
  const preset = resolveImageTypePreset(context);
  return context.subject?.count === 2 ? preset.gptDuo : preset.en;
}

function buildZImageTypeText(context) {
  const preset = resolveImageTypePreset(context);
  return context.subject?.count === 2 ? preset.zImageDuo : preset.en;
}

function buildZImageSubjectLead(context) {
  return resolveImageTypePreset(context).zImageLead || 'Create a photorealistic editorial portrait of';
}

function buildAiImageTypeLead(context) {
  return resolveImageTypePreset(context).aiLead || '';
}

function buildImageTypePromptLine(context) {
  const preset = resolveImageTypePreset(context);
  const source = preset.aiLead ? `Create a ${preset.aiLead}` : preset.en;
  return ensureTerminalPeriod(stripTerminalPromptPunctuation(source || ''));
}

function compactCameraDescriptor(item, kind) {
  if (!item || isNoneLikeItem(item)) return '';

  const label = String(item.zh || '').toLowerCase();
  if (kind === 'framing') {
    if (label.includes('半臉')) return 'half-face close-up, tilted crop';
    if (label.includes('局部五官')) return 'facial-detail close-up';
    if (label.includes('臉部特寫')) return 'tight face close-up';
    if (label.includes('特寫')) return label.includes('胸上') ? 'chest-up portrait' : 'head-and-shoulders portrait';
    if (label.includes('中景')) return 'waist-up portrait';
    if (label.includes('牛仔')) return 'knee-up cowboy shot';
    if (label.includes('全身')) return 'full-body portrait';
  }

  if (kind === 'angle') {
    if (label.includes('高位') || label.includes('鳥瞰') || label.includes('正上方')) {
      if (label.includes('鳥瞰')) return "bird's-eye view";
      if (label.includes('正上方')) return 'top-down view';
      return 'high angle, looking down';
    }
    if (label.includes('蟲眼')) return "worm's-eye view";
    if (label.includes('地面')) return 'low angle from floor level';
    if (label.includes('膝蓋')) return 'knee-level view';
    if (label.includes('腰部')) return 'waist-level view';
    if (label.includes('肩部')) return 'shoulder-level view';
    if (label.includes('平視')) return 'eye-level view';
    if (label.includes('荷蘭') || label.includes('傾斜')) return 'tilted frame';
  }

  if (kind === 'orbit') {
    if (label.startsWith('正面')) return 'front view';
    if (label.startsWith('左前')) return 'front-left three-quarter view';
    if (label.startsWith('左側')) return 'left profile view';
    if (label.startsWith('左後')) return 'rear-left three-quarter view';
    if (label.startsWith('背面')) return 'back view';
    if (label.startsWith('右後')) return 'rear-right three-quarter view';
    if (label.startsWith('右側')) return 'right profile view';
    if (label.startsWith('右前')) return 'front-right three-quarter view';
  }

  return compactPromptClauses(item.en, 1)
    .replace(/\b(?:camera|view|shot|portrait)\b/gi, (match) => match.toLowerCase())
    .trim();
}

function buildCompositionPromptLine(context) {
  const parts = [
    compactCameraDescriptor(context?.framing, 'framing'),
    compactCameraDescriptor(context?.angle, 'angle'),
    compactCameraDescriptor(context?.orbit, 'orbit'),
  ].filter(Boolean);
  if (parts.length === 0) return '';
  parts[0] = `${parts[0].charAt(0).toUpperCase()}${parts[0].slice(1)}`;
  return parts.join(', ');
}

function buildPromptSectionSources(valuesByLabel, context) {
  const fixedCompositionSetActive = isFixedCompositionSetActive(context.fixedCompositionSet);
  const subjectValues = getStructuredValues(valuesByLabel, [
    'Duo Scene Anchor',
    'Subject Count',
    'Reference Guidance',
    'Body Type',
    'Woman 1 Body Type',
    'Woman 2 Body Type',
    'Facial Features',
    'Woman 1 Facial Features',
    'Woman 2 Facial Features',
    'Hairstyle',
    'Woman 1 Hairstyle',
    'Woman 2 Hairstyle',
    'Hair Color',
    'Woman 1 Hair Color',
    'Woman 2 Hair Color',
    'Skin Details',
    'Woman 1 Skin Details',
    'Woman 2 Skin Details',
    'Expression',
    'Duo Expression',
    'Woman 1 Expression',
    'Woman 2 Expression',
    'Character Identity',
    'Head Accessory',
    'Woman 1 Head Accessory',
    'Woman 2 Head Accessory',
  ]);
  const fixedSetSceneLabels = [
    'Fixed Composition Set',
    'Fixed Set Position',
    'Fixed Set Background State',
    'Fixed Set Capture Mode',
    'Fixed Set Performance State',
  ];
  const fixedSetIntegrityLabels = ['Fixed Set Integrity'];
  const fixedSetCameraLabels = ['Angle', 'Orbit Angle'];
  const sceneValues = [
    ...(fixedCompositionSetActive
      ? getStructuredValues(valuesByLabel, fixedSetSceneLabels)
      : getStructuredLabeledValues(valuesByLabel, [...fixedSetSceneLabels, ...fixedSetIntegrityLabels])),
    ...(fixedCompositionSetActive ? getStructuredValues(valuesByLabel, fixedSetCameraLabels) : []),
    ...(fixedCompositionSetActive ? getStructuredValues(valuesByLabel, fixedSetIntegrityLabels) : []),
    ...getStructuredValues(valuesByLabel, [
      'World Scene Architecture',
      'Location',
      'Scene Accent',
    ]),
  ];
  const wardrobeValues = getStructuredValues(valuesByLabel, [
    'Outerwear',
    'Special Outfit',
    'Woman 1 Special Outfit',
    'Woman 2 Special Outfit',
    'Outfit Preset',
    'Woman 1 Outfit Preset',
    'Woman 2 Outfit Preset',
    'Dress',
    'Top',
    'Pants',
    'Skirt',
    'Legwear',
    'Shoes',
    'Duo Wardrobe',
    'Waistline Coordination',
    'Wardrobe Layering Logic',
  ]);
  const poseValues = getStructuredValues(valuesByLabel, [
    'Action Pose',
    'Special Action',
    'Pose',
    'Duo Layout',
    'Duo Pose Base',
    'Composition Priority',
  ]);
  const lightingValues = getStructuredValues(valuesByLabel, [
    'Ambient Light Conditions',
    'Subject Light Style',
  ]);
  const cameraValues = getStructuredValues(valuesByLabel, [
    'Photography Style',
    'Lens',
    'Aperture / Depth of Field',
    'Shutter / Motion Blur',
    'Optical Effect',
    'Camera / Film',
  ]);
  const imageType = buildImageTypeText(context);
  const subjectLead = context.subject?.count === 2 ? 'The subjects are' : 'The subject is';
  const wardrobeLead = context.subject?.count === 2 ? 'They wear' : 'She wears';
  const sceneUsesDirectSentence = fixedCompositionSetActive;

  return {
    imageType,
    sceneText: fixedCompositionSetActive ? buildGptFixedCompositionSceneText(context) : joinScenePromptValues(sceneValues),
    subjectText: joinNaturalPromptValues(subjectValues),
    wardrobeText: joinNaturalPromptValues(wardrobeValues),
    poseText: joinNaturalPromptValues(poseValues),
    lightingText: joinNaturalPromptValues(lightingValues),
    cameraText: joinNaturalPromptValues(cameraValues),
    subjectLead,
    wardrobeLead,
    sceneUsesDirectSentence,
  };
}

function capitalizePromptLead(value) {
  const text = stripMarkdown(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function stripTerminalPromptPunctuation(value) {
  return stripMarkdown(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?]+$/, '')
    .trim();
}

function splitPromptClauses(value) {
  return stripMarkdown(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?]+$/g, '')
    .split(/\s*,\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function compactPromptClauses(value, limitOrIndexes = 2) {
  const clauses = splitPromptClauses(value);
  const picked = Array.isArray(limitOrIndexes)
    ? limitOrIndexes.map((index) => clauses[index]).filter(Boolean)
    : clauses.slice(0, limitOrIndexes);
  return picked.join(', ');
}

function compactZImageAmbientLightText(value) {
  return compactZImageSourceText(compactPromptClauses(value, 2));
}

function compactZImageSubjectLightText(value) {
  return compactZImageSourceText(compactPromptClauses(value, 2));
}

function compactZImagePhotographyStyleText(styleOrText) {
  if (!styleOrText || isNoneLikeItem(styleOrText)) return '';
  if (typeof styleOrText === 'object') {
    return STYLE_PROMPT_INTROS[styleOrText.zh] || compactPromptClauses(buildPhotographyStylePrompt(styleOrText), 1);
  }
  const text = stripMarkdown(styleOrText || '').replace(/\s+/g, ' ').trim();
  return text.match(/Inspired by [^.]+? image language/i)?.[0] || text.split(/\.\s*/)[0] || '';
}

function compactZImageLensText(value) {
  return compactZImageCameraText(compactPromptClauses(value, 3));
}

function compactZImageOpticalEffectText(value) {
  const text = stripMarkdown(value || '');
  if (/blurred foreground occlusion near the lens/i.test(text)) {
    return compactZImageCameraText(compactPromptClauses(text, [0, 1, 3, 4]));
  }
  return compactZImageCameraText(compactPromptClauses(text, 3));
}

function compactZImageFilmText(value) {
  return compactZImageSourceText(compactPromptClauses(value, 5));
}

function compactZImageCameraControlText(value) {
  return compactZImageCameraText(compactPromptClauses(value, 2));
}

function compactAiAmbientLightText(value) {
  return compactPromptClauses(value, 1);
}

function compactAiSubjectLightText(value) {
  const text = stripMarkdown(value || '');
  if (/warm golden-amber subject light color/i.test(text)) return 'warm honey-amber subject light';
  return compactPromptClauses(text, 1);
}

function compactAiLightingText(ambientText, subjectLightText) {
  const ambient = compactAiAmbientLightText(ambientText);
  const subjectLight = compactAiSubjectLightText(subjectLightText);
  if (ambient && subjectLight) return `${ambient} with ${subjectLight}`;
  return ambient || subjectLight;
}

function compactAiStyleText(value) {
  const text = stripMarkdown(value || '').replace(/\s+/g, ' ').trim();
  return text.match(/Inspired by [^.]+? image language/i)?.[0] || compactPromptClauses(text, 1);
}

function compactAiLensText(value) {
  const text = stripMarkdown(value || '');
  const focal = text.match(/\b(\d+mm)\b/i)?.[1] || '';
  if (focal && /telephoto|compression|long/i.test(text)) return `${focal} telephoto compression`;
  if (focal && /wide/i.test(text)) return `${focal} wide-angle perspective`;
  if (focal && /standard|neutral/i.test(text)) return `${focal} standard-lens perspective`;
  if (/macro/i.test(text)) return 'macro close-focus detail';
  if (/fisheye/i.test(text)) return 'fisheye distortion';
  if (/tilt-shift/i.test(text)) return 'tilt-shift perspective control';
  if (/anamorphic/i.test(text)) return 'anamorphic widescreen optics';
  return compactPromptClauses(text, 1);
}

function compactAiOpticalEffectText(value) {
  const text = stripMarkdown(value || '');
  if (/blurred foreground occlusion near the lens/i.test(text)) return 'soft foreground occlusion';
  if (/heavy bokeh/i.test(text)) return 'heavy bokeh rendering';
  if (/soft focus/i.test(text)) return 'soft focus diffusion';
  if (/edge blur|peripheral/i.test(text)) return 'soft edge blur';
  return compactPromptClauses(text, 1);
}

function compactAiFilmText(value) {
  const text = stripMarkdown(value || '');
  if (/glossy Japanese portrait color grade/i.test(text)) {
    return 'glossy Japanese color grade with creamy highlights, warm peach skin, and cyan-green shadows';
  }
  if (/high-acutance snapshot rendering/i.test(text)) {
    return 'high-acutance snapshot rendering, snap-focus clarity, contrasty black levels';
  }
  return compactPromptClauses(text, 2);
}

function cleanGptDuoRoleSubjectPart(value, roleNumber) {
  return stripTerminalPromptPunctuation(value)
    .replace(new RegExp(`^woman ${roleNumber}\\s+has\\s+`, 'i'), '')
    .replace(new RegExp(`^woman ${roleNumber}\\s+`, 'i'), '')
    .trim();
}

function cleanGptDuoFullWardrobePart(value) {
  return cleanGptSinglePromptText(value)
    .replace(/^She wears\s+/i, '')
    .replace(/^wearing\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function joinGptDuoFullWardrobeParts(parts) {
  return parts
    .map(cleanGptDuoFullWardrobePart)
    .filter(Boolean)
    .join(', ');
}

function buildGptDuoSpecialOutfitText(item, palette, context = null) {
  return cleanGptDuoFullWardrobePart(buildVisibleSpecialOutfitPrompt(item, palette, context));
}

function buildGptDuoSharedAddonText(wardrobeSlots, wardrobeColors, context = null) {
  const outerwearText = buildOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors);
  const legwearText = buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor);
  const shoesText = buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor);
  return joinGptDuoFullWardrobeParts([
    shouldKeepWardrobeRoleForContext('outerwear', context, outerwearText) ? outerwearText : '',
    shouldKeepWardrobeRoleForContext('legwear', context, legwearText) ? legwearText : '',
    shouldKeepWardrobeRoleForContext('shoes', context, shoesText) ? shoesText : '',
  ]);
}

function buildGptDuoRoleAddonText(wardrobeSlots, wardrobeColors, role, context = null) {
  const suffix = role === 'a' ? 'A' : 'B';
  const outerwearText = buildRoleOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors, role);
  const legwearText = buildColoredGrokPrompt(wardrobeSlots[`legwear${suffix}`], wardrobeColors[`legwear${suffix}Color`]);
  const shoesText = buildColoredGrokPrompt(wardrobeSlots[`shoes${suffix}`], wardrobeColors[`shoes${suffix}Color`]);
  return joinGptDuoFullWardrobeParts([
    shouldKeepWardrobeRoleForContext('outerwear', context, outerwearText) ? outerwearText : '',
    shouldKeepWardrobeRoleForContext('legwear', context, legwearText) ? legwearText : '',
    shouldKeepWardrobeRoleForContext('shoes', context, shoesText) ? shoesText : '',
  ]);
}

function buildGptDuoSharedMainWardrobeText(wardrobeSlots, wardrobeColors, context = null) {
  const specialText = buildGptDuoSpecialOutfitText(wardrobeSlots.specialOutfit, wardrobeColors.completeLookPalette, context);
  if (specialText) return specialText;

  const presetText = cleanGptDuoFullWardrobePart(buildVisibleOutfitPresetPrompt(wardrobeSlots.outfitPreset, {
    legacy: wardrobeColors.outfitPresetColor,
    primary: wardrobeColors.outfitPresetPrimaryColor,
    contrast: wardrobeColors.outfitPresetContrastColor,
    lockedPalette: wardrobeColors.outfitPresetLockedPalette,
    completeLookPalette: wardrobeColors.completeLookPalette,
  }, context));
  if (presetText) return presetText;

  const dressText = cleanGptDuoFullWardrobePart(
    filterCompleteLookPromptForFraming(buildCompleteLookDressPrompt(
      wardrobeSlots.dress,
      wardrobeColors.dressColor,
      wardrobeColors.completeLookPalette,
      { secondaryColor: wardrobeColors.topBottomPalette?.bottomColor }
    ), context)
  );
  if (dressText) return dressText;

  const topText = buildTopWardrobePrompt(wardrobeSlots, wardrobeColors);
  const pantsText = buildBottomWardrobePrompt(wardrobeSlots.pants, wardrobeSlots, wardrobeColors);
  const skirtText = buildBottomWardrobePrompt(wardrobeSlots.skirt, wardrobeSlots, wardrobeColors);
  return joinGptDuoFullWardrobeParts([
    shouldKeepWardrobeRoleForContext('top', context, topText) ? topText : '',
    shouldKeepWardrobeRoleForContext('bottom', context, pantsText) ? pantsText : '',
    shouldKeepWardrobeRoleForContext('bottom', context, skirtText) ? skirtText : '',
  ]);
}

function buildGptDuoRoleMainWardrobeText(wardrobeSlots, wardrobeColors, role, context = null) {
  const suffix = role === 'a' ? 'A' : 'B';
  const specialText = buildGptDuoSpecialOutfitText(
    wardrobeSlots[`specialOutfit${suffix}`],
    wardrobeColors[`completeLookPalette${suffix}`],
    context
  );
  if (specialText) return specialText;

  const presetText = cleanGptDuoFullWardrobePart(buildVisibleOutfitPresetPrompt(wardrobeSlots[`outfitPreset${suffix}`], {
    legacy: wardrobeColors[`outfitPreset${suffix}Color`],
    primary: wardrobeColors[`outfitPreset${suffix}PrimaryColor`],
    contrast: wardrobeColors[`outfitPreset${suffix}ContrastColor`],
    lockedPalette: wardrobeColors[`outfitPreset${suffix}LockedPalette`],
    completeLookPalette: wardrobeColors[`completeLookPalette${suffix}`],
  }, context));
  if (presetText) return presetText;

  const dressText = cleanGptDuoFullWardrobePart(
    filterCompleteLookPromptForFraming(buildCompleteLookDressPrompt(
      wardrobeSlots[`dress${suffix}`],
      wardrobeColors[`dress${suffix}Color`],
      wardrobeColors[`completeLookPalette${suffix}`],
      { secondaryColor: wardrobeColors[`topBottomPalette${suffix}`]?.bottomColor }
    ), context)
  );
  if (dressText) return dressText;

  const topText = buildRoleTopWardrobePrompt(wardrobeSlots, wardrobeColors, role);
  const pantsText = buildRoleBottomWardrobePrompt(wardrobeSlots[`pants${suffix}`], wardrobeSlots, wardrobeColors, role);
  const skirtText = buildRoleBottomWardrobePrompt(wardrobeSlots[`skirt${suffix}`], wardrobeSlots, wardrobeColors, role);
  return joinGptDuoFullWardrobeParts([
    shouldKeepWardrobeRoleForContext('top', context, topText) ? topText : '',
    shouldKeepWardrobeRoleForContext('bottom', context, pantsText) ? pantsText : '',
    shouldKeepWardrobeRoleForContext('bottom', context, skirtText) ? skirtText : '',
  ]);
}

function buildGptDuoFullWardrobeRoleText(role, wardrobeSlots, wardrobeColors, context = null) {
  const roleSpecialText = buildGptDuoSpecialOutfitText(
    wardrobeSlots[`specialOutfit${role === 'a' ? 'A' : 'B'}`],
    wardrobeColors[`completeLookPalette${role === 'a' ? 'A' : 'B'}`],
    context
  );
  const sharedSpecialText = buildGptDuoSpecialOutfitText(
    wardrobeSlots.specialOutfit,
    wardrobeColors.completeLookPalette,
    context
  );
  if (roleSpecialText || sharedSpecialText) return roleSpecialText || sharedSpecialText;

  const mainText = buildGptDuoRoleMainWardrobeText(wardrobeSlots, wardrobeColors, role, context)
    || buildGptDuoSharedMainWardrobeText(wardrobeSlots, wardrobeColors, context);
  const roleAddonText = buildGptDuoRoleAddonText(wardrobeSlots, wardrobeColors, role, context);
  const sharedAddonText = buildGptDuoSharedAddonText(wardrobeSlots, wardrobeColors, context);

  if (!mainText) return joinGptDuoFullWardrobeParts([roleAddonText, sharedAddonText]);

  return [
    mainText,
    roleAddonText ? `styled with ${roleAddonText}` : '',
    sharedAddonText ? `styled with ${sharedAddonText}` : '',
  ].filter(Boolean).join(', ');
}

function buildGptDuoFullWardrobeRoleTexts(wardrobeSlots, wardrobeColors, context = null) {
  return {
    woman1: buildGptDuoFullWardrobeRoleText('a', wardrobeSlots, wardrobeColors, context),
    woman2: buildGptDuoFullWardrobeRoleText('b', wardrobeSlots, wardrobeColors, context),
  };
}

function buildGptDuoRoleSubjectText(role, characterSlots, wardrobeSlots, wardrobeRoleTexts) {
  const suffix = role === 'a' ? 'A' : 'B';
  const roleNumber = role === 'a' ? '1' : '2';
  const parts = [
    buildRoleHasPrompt(characterSlots[`bodyType${suffix}`], `woman ${roleNumber}`),
    characterSlots[`facialFeatures${suffix}`] && !isNoneLikeItem(characterSlots[`facialFeatures${suffix}`])
      ? characterSlots[`facialFeatures${suffix}`].en
      : '',
    buildRoleHasPrompt(characterSlots[`skinDetails${suffix}`], `woman ${roleNumber}`),
    characterSlots[`hairstyle${suffix}`] && !isNoneLikeItem(characterSlots[`hairstyle${suffix}`])
      ? characterSlots[`hairstyle${suffix}`].en
      : '',
    buildHairColorPrompt(characterSlots[`hairColor${suffix}`]),
    buildRoleSubjectAccessoryPrompt(wardrobeSlots, role),
  ].map((part) => cleanGptDuoRoleSubjectPart(part, roleNumber)).filter(Boolean);
  const identityText = parts.join(', ');
  const wardrobeText = role === 'a' ? wardrobeRoleTexts.woman1 : wardrobeRoleTexts.woman2;
  const sentences = [
    identityText ? `Has ${ensureTerminalPeriod(identityText)}` : '',
    wardrobeText ? `Wears ${ensureTerminalPeriod(wardrobeText)}` : '',
  ].filter(Boolean);

  return sentences.length > 0 ? `Woman ${roleNumber}:\n${sentences.join(' ')}` : '';
}

function buildGptDuoSharedExpressionText(characterSlots) {
  return characterSlots.duoExpression && !isNoneLikeItem(characterSlots.duoExpression)
    ? characterSlots.duoExpression.en
    : '';
}

function buildGptDuoSubjectText(context, characterSlots, wardrobeSlots, wardrobeColors) {
  const baseSubject = capitalizePromptLead(context.subject?.en || 'two women');
  const wardrobeRoleTexts = buildGptDuoFullWardrobeRoleTexts(wardrobeSlots, wardrobeColors, context);
  const roleTexts = [
    buildGptDuoRoleSubjectText('a', characterSlots, wardrobeSlots, wardrobeRoleTexts),
    buildGptDuoRoleSubjectText('b', characterSlots, wardrobeSlots, wardrobeRoleTexts),
  ].filter(Boolean);

  return [
    ensureTerminalPeriod(baseSubject),
    ...roleTexts,
  ].filter(Boolean).join('\n\n');
}

function buildGptDuoFlexibleFramingText(context) {
  const visibility = context.framing?.meta?.visibility || '';
  if (visibility === 'wide') return 'a loose wide environmental two-person composition';
  if (visibility === 'full') return 'a loose full-body or wider two-person composition';
  if (visibility === 'medium') return 'a natural medium two-person composition';
  if (visibility === 'portrait') return 'a natural portrait-oriented two-person composition';
  if (visibility === 'close') return 'a close two-person portrait crop';
  return 'the selected two-person framing';
}

function buildGptDuoPoseAndCompositionText(valuesByLabel, context) {
  const scenario = stripTerminalPromptPunctuation(firstStructuredValue(valuesByLabel, ['Duo Layout']));
  const postureBase = stripTerminalPromptPunctuation(firstStructuredValue(valuesByLabel, ['Duo Pose Base']));
  const angle = stripTerminalPromptPunctuation(firstStructuredValue(valuesByLabel, ['Angle']));
  const orbit = stripTerminalPromptPunctuation(firstStructuredValue(valuesByLabel, ['Orbit Angle']));
  const viewpoint = [angle, orbit].filter(Boolean).join(', ');
  const framingText = buildGptDuoFlexibleFramingText(context);

  return [
    scenario ? ensureTerminalPeriod(capitalizePromptLead(scenario)) : '',
    postureBase ? `Their body posture is ${ensureTerminalPeriod(postureBase)}` : '',
    `Use ${framingText}${viewpoint ? ` with ${viewpoint}` : ''} as a loose photographic guide, allowing natural crop, overlap, body blocking, and partial occlusion when it makes the moment feel candid and real.`,
  ].filter(Boolean).join(' ');
}

function cleanGptSinglePromptText(value) {
  return stripMarkdown(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\.\s*,/g, '.')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*\./g, '.')
    .trim();
}

function buildGptSingleFullFidelityText(value) {
  return cleanGptSinglePromptText(value);
}

function buildGptSingleFullFidelityWardrobeText(value) {
  return cleanGptSinglePromptText(value);
}

function splitGptSpecialOutfitFragments(value) {
  const compressed = cleanGptSinglePromptText(value)
    .replace(/^She wears\s+(?:complete special outfit:\s*)?/i, '')
    .replace(/^complete special outfit:\s*/i, '')
    .split(/\s*(?:\.\s+|,\s*)/)
    .map((part) => part.replace(/[.!?]+$/g, '').trim())
    .filter(Boolean);
  return compressed;
}

function isGptSpecialOutfitHairOrBodyFragment(fragment) {
  if (/\btattoos?\b/i.test(fragment)) return true;

  const hairAccessoryOnly = /\bhair\s+(?:clips?|claw clips?|pins?|barrettes?|accessories?)\b/i.test(fragment)
    && !/\b(?:bangs?|braids?|side braid|twin-bun|pigtails?|ponytail|bob|shag|chignon|bun|updo|waves?|wavy|straight|pixie)\b/i.test(fragment);
  if (hairAccessoryOnly) return false;

  return /\b(?:hair|bangs?|braids?|side braid|twin-bun|pigtails?|ponytail|bob|shag|chignon|bun|updo|waves?|wavy|pixie)\b/i.test(fragment);
}

function isGptSpecialOutfitHeadwearEyewearBagFragment(fragment) {
  return /\b(?:sunglasses|glasses|eyeglasses|bag|handbag|shoulder bag|tote|backpack|purse|clutch|cap|hat|beret|beanie|headscarf|bandana|headband|hair clips?|claw clip|barrettes?)\b/i.test(fragment);
}

function joinGptSpecialOutfitGroupFragments(fragments, { lead = '' } = {}) {
  const text = fragments
    .map((fragment) => fragment.trim())
    .filter(Boolean)
    .join(', ');
  return text ? ensureTerminalPeriod(`${lead}${text}`) : '';
}

function buildGptSingleSpecialOutfitGroups(specialOutfitText, additionalFullTexts = []) {
  const fragments = [
    ...splitGptSpecialOutfitFragments(specialOutfitText),
    ...additionalFullTexts.flatMap((value) => splitGptSpecialOutfitFragments(value)),
  ];
  if (fragments.length === 0) return '';

  const hairAndBodyFragments = [];
  const fullOutfitFragments = [];
  const headwearEyewearBagFragments = [];

  for (const fragment of fragments) {
    if (isGptSpecialOutfitHairOrBodyFragment(fragment)) {
      hairAndBodyFragments.push(fragment);
    } else if (isGptSpecialOutfitHeadwearEyewearBagFragment(fragment)) {
      headwearEyewearBagFragments.push(fragment);
    } else {
      fullOutfitFragments.push(fragment);
    }
  }

  const wardrobeSections = [
    fullOutfitFragments.length > 0
      ? `Full outfit:\n${joinGptSpecialOutfitGroupFragments(fullOutfitFragments, { lead: 'She wears ' })}`
      : '',
    headwearEyewearBagFragments.length > 0
      ? `Headwear, eyewear, and bag:\n${joinGptSpecialOutfitGroupFragments(headwearEyewearBagFragments)}`
      : '',
  ].filter(Boolean);

  return {
    hairAndBodyText: hairAndBodyFragments.length > 0
      ? joinGptSpecialOutfitGroupFragments(hairAndBodyFragments)
      : '',
    wardrobeText: wardrobeSections.join('\n\n'),
  };
}

function cleanCharacterProfileGroupText(value) {
  return stripMarkdown(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*\./g, '.')
    .trim()
    .replace(/[.!?]+$/g, '');
}

function splitCharacterProfileFragments(value) {
  return cleanCharacterProfileGroupText(value)
    .split(/\s*,\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isCharacterProfileAccessoryFragment(fragment) {
  return /\b(?:eyeglasses|glasses|sunglasses|earrings?|necklaces?|choker|bangles?|bracelets?|rings?|pendant|shoulder bag|bag|handbag|keychain|earphones?|headphones?)\b/i.test(fragment);
}

function isCharacterProfileHairFragment(fragment) {
  return /\b(?:hair|haircut|bob|lob|bangs?|waves?|wavy|curly|curls?|S-curls|streaks?|roots|flyaway|side strands|face-framing|nape|crown)\b/i.test(fragment);
}

function isCharacterProfileBodyFragment(fragment) {
  return /\b(?:body proportions?|silhouette|waist|legs?|limbs?|hips?|bust|collarbones?|neck|arms?|petite|slim|tall|hourglass|fashion-model|casual body)\b/i.test(fragment);
}

function extractCharacterProfilePhotoDirection(value) {
  const text = cleanCharacterProfileGroupText(value);
  const match = text.match(/,\s*([^,]*photographic realism)$/i);
  return {
    text: match ? text.slice(0, match.index).trim() : text,
    photographicDirection: match?.[1]?.trim() || '',
  };
}

function buildFallbackCharacterProfileGroups(subject) {
  const raw = cleanCharacterProfileGroupText(subject?.en || '');
  const signatureMatch = raw.match(/\bsignature outfit locked as\s+/i);
  const identityHairText = signatureMatch ? raw.slice(0, signatureMatch.index).replace(/,\s*$/g, '') : raw;
  const signatureText = signatureMatch ? raw.slice(signatureMatch.index + signatureMatch[0].length) : '';
  const { text: outfitText, photographicDirection } = extractCharacterProfilePhotoDirection(signatureText);

  const identityHairFragments = splitCharacterProfileFragments(identityHairText);
  const hairStart = identityHairFragments.findIndex((fragment) => isCharacterProfileHairFragment(fragment));
  const identityFragments = (hairStart === -1 ? identityHairFragments : identityHairFragments.slice(0, hairStart))
    .filter((fragment) => !isCharacterProfileAccessoryFragment(fragment));
  const hairFragments = [];
  if (hairStart !== -1) {
    for (const fragment of identityHairFragments.slice(hairStart)) {
      if (isCharacterProfileBodyFragment(fragment)) {
        identityFragments.push(fragment);
      } else {
        hairFragments.push(fragment);
      }
    }
  }

  const outfitFragments = [];
  const accessoryFragments = [];
  for (const fragment of splitCharacterProfileFragments(outfitText)) {
    if (isCharacterProfileAccessoryFragment(fragment)) {
      accessoryFragments.push(fragment);
    } else {
      outfitFragments.push(fragment);
    }
  }

  return {
    identityAndBody: identityFragments.join(', '),
    facialGeometry: '',
    eyeSignature: '',
    noseSignature: '',
    mouthSignature: '',
    skinSignature: '',
    makeup: '',
    body: '',
    distinctiveFeatures: '',
    hair: hairFragments.join(', '),
    outfit: outfitFragments.join(', '),
    accessories: accessoryFragments.join(', '),
    photographicDirection,
  };
}

function buildCharacterCardProfileGroups(subject, locks = {}, wardrobe = null) {
  const baseGroups = subject.profile || buildFallbackCharacterProfileGroups(subject);
  if (!shouldImportCharacterCardWardrobeLayers(locks)) return baseGroups;

  const importedLayers = getCharacterCardImportedLayers(subject, locks);
  const wardrobeSlots = Array.isArray(wardrobe) ? extractWardrobeSlots(wardrobe) : null;
  const accessoryLayerKeys = new Set(['headAccessory', 'eyewear', 'earrings', 'neckAccessory', 'wristAccessory', 'ring', 'waistAccessory']);
  const outfitText = importedLayers
    .filter((layer) => !accessoryLayerKeys.has(layer.meta?.characterCardLayer))
    .map((layer) => layer.en)
    .filter(Boolean)
    .join(', ');
  const accessoryText = importedLayers
    .filter((layer) => accessoryLayerKeys.has(layer.meta?.characterCardLayer))
    .map((layer) => layer.en)
    .filter(Boolean)
    .join(', ');
  const page1AccessoryText = wardrobeSlots
    ? buildSubjectAccessoryPrompt({
        eyewear: isCharacterCardLayerSlot(wardrobeSlots.eyewear) ? null : wardrobeSlots.eyewear,
        eyewearColor: wardrobeSlots.eyewearColor,
        eyewearPlacement: wardrobeSlots.eyewearPlacement,
        earrings: isCharacterCardLayerSlot(wardrobeSlots.earrings) ? null : wardrobeSlots.earrings,
        neckAccessory: isCharacterCardLayerSlot(wardrobeSlots.neckAccessory) ? null : wardrobeSlots.neckAccessory,
      })
    : '';

  return {
    ...baseGroups,
    outfit: outfitText,
    accessories: [accessoryText, page1AccessoryText].filter(Boolean).join(', '),
  };
}

function buildGptCharacterProfileSubjectBlock(subject, locks = {}, wardrobe = null, context = null) {
  if (!isCharacterProfileSubject(subject)) return '';
  const groups = buildCharacterCardProfileGroups(subject, locks, wardrobe);
  const groupLine = (label, value) => {
    const cleaned = ensureTerminalPeriod(cleanCharacterProfileGroupText(value));
    return cleaned ? `${label}:\n${cleaned}` : '';
  };

  const structuredIdentityLines = [
    groupLine('Facial geometry', groups.facialGeometry),
    groupLine('Eye signature', groups.eyeSignature),
    groupLine('Nose signature', groups.noseSignature),
    groupLine('Mouth signature', groups.mouthSignature),
    groupLine('Skin signature', groups.skinSignature),
    groupLine('Makeup', groups.makeup),
    groupLine('Body', groups.body),
    groupLine('Permanent identity anchors', groups.distinctiveFeatures),
  ].filter(Boolean);

  return [
    groupLine('Character Profile Card', subject.zh || subject.specialToneZh || 'Character Profile'),
    ...(structuredIdentityLines.length > 0
      ? structuredIdentityLines
      : [groupLine('Identity and body', groups.identityAndBody)]),
    groupLine('Hair', [groups.hair, buildCharacterCardHairVariantText(subject, locks)].filter(Boolean).join(', ')),
    groupLine('Outfit', filterCompleteLookPromptForFraming(groups.outfit, context)),
    groupLine('Accessories', filterCompleteLookPromptForFraming(groups.accessories, context)),
    groupLine('Photographic direction', groups.photographicDirection || 'photorealistic editorial portrait, coherent facial identity, natural photographic detail'),
  ].filter(Boolean).join('\n\n');
}

function buildGptFullBodyCharacterProfileSubjectBlock(subject, locks = {}, wardrobe = null) {
  if (!isCharacterProfileSubject(subject)) return '';
  const groups = buildCharacterCardProfileGroups(subject, locks, wardrobe);
  const groupLine = (label, value) => {
    const cleaned = ensureTerminalPeriod(cleanCharacterProfileGroupText(value));
    return cleaned ? `${label}:\n${cleaned}` : '';
  };

  const structuredIdentityLines = [
    groupLine('Facial geometry', groups.facialGeometry),
    groupLine('Eye signature', groups.eyeSignature),
    groupLine('Nose signature', groups.noseSignature),
    groupLine('Mouth signature', groups.mouthSignature),
    groupLine('Skin signature', groups.skinSignature),
    groupLine('Makeup', groups.makeup),
    groupLine('Body', groups.body),
    groupLine('Permanent identity anchors', groups.distinctiveFeatures),
  ].filter(Boolean);

  return [
    groupLine('Character Profile Card', subject.zh || subject.specialToneZh || 'Character Profile'),
    ...(structuredIdentityLines.length > 0
      ? structuredIdentityLines
      : [groupLine('Identity and body', groups.identityAndBody)]),
    groupLine('Hair', [groups.hair, buildCharacterCardHairVariantText(subject, locks)].filter(Boolean).join(', ')),
    groupLine('Accessories', groups.accessories),
  ].filter(Boolean).join('\n\n');
}

const GPT_SINGLE_HAIR_COLOR_MERGE_RULES = [
  { phrase: 'natural black hair', modifier: 'natural black' },
  { phrase: 'soft black-tea brown hair', modifier: 'soft black-tea brown' },
  { phrase: 'deep coffee-brown hair', modifier: 'deep coffee-brown' },
  { phrase: 'chestnut-brown hair', modifier: 'chestnut-brown' },
  { phrase: 'milk-tea brown hair', modifier: 'milk-tea brown' },
  { phrase: 'ashy beige-brown hair', modifier: 'ashy beige-brown' },
  { phrase: 'honey caramel-brown hair', modifier: 'honey caramel-brown' },
  { phrase: 'rose cocoa-brown hair', modifier: 'rose cocoa-brown' },
  { phrase: 'light blonde hair, golden-beige tone, realistic dyed texture, natural eyebrows', modifier: 'light blonde', suffix: ', golden-beige tone, realistic dyed texture, natural eyebrows' },
  { phrase: 'silver-gray white hair, cool pale tone, realistic dyed texture, natural eyebrows', modifier: 'silver-gray white', suffix: ', cool pale tone, realistic dyed texture, natural eyebrows' },
  { phrase: 'hot-pink fashion hair', modifier: 'hot-pink fashion' },
  { phrase: 'cobalt-blue fashion hair', modifier: 'cobalt-blue fashion' },
  { phrase: 'deep forest-green hair', modifier: 'deep forest-green' },
];

const SINGLE_BODY_TYPE_ANCHOR_RULES = [
  {
    pattern: /sexy tall slim-curvy silhouette,\s*about 168-173 cm visual height and 53-58 kg lean visual weight,\s*94-58-92 body proportion anchor,\s*long legs with about 3\.8:6\.2 torso-to-leg balance,\s*full F-to-G-cup-scale bust,\s*narrow defined waist,\s*rounded hips,\s*flat abdomen,\s*dramatic but lean bust-waist-hip curve/i,
    aiText: 'Sexy tall slim-curvy silhouette, 94-58-92 body proportion anchor, narrow defined waist, rounded hips, flat abdomen.',
  },
  {
    pattern: /tall slim fashion body,\s*about 170-175 cm visual height,\s*80-58-88 body proportion anchor,\s*long legs with about 3\.5:6\.5 torso-to-leg balance,\s*shorter upper torso,\s*high waistline,\s*narrow ribcage,\s*gently wider hips,\s*clean editorial silhouette/i,
    aiText: 'Tall slim fashion body, 80-58-88 body proportion anchor, long legs, high waistline, narrow ribcage, clean editorial silhouette.',
  },
  {
    pattern: /soft natural hourglass body,\s*about 165-170 cm visual height,\s*90-62-94 body proportion anchor,\s*balanced torso-to-leg ratio around 4:6,\s*longer upper torso,\s*lower waistline,\s*fuller bust,\s*wider hips,\s*elongated abdomen with subtle contour lines/i,
    aiText: 'Soft natural hourglass body, 90-62-94 body proportion anchor, fuller bust, wider hips, elongated abdomen with subtle contour lines.',
  },
  {
    pattern: /natural basic body,\s*about 160-165 cm visual height,\s*83-62-88 body proportion anchor,\s*balanced torso-to-leg ratio around 4:6,\s*low-contrast waist curve,\s*modest bust and hips,\s*smooth natural silhouette/i,
    aiText: 'Natural basic body, 83-62-88 body proportion anchor, low-contrast waist curve, modest bust and hips, smooth natural silhouette.',
  },
  {
    pattern: /fit toned athletic female body,\s*healthy firm silhouette,\s*subtle muscle definition,\s*energetic balanced proportions/i,
    aiText: 'Fit toned athletic body, firm silhouette, subtle muscle definition, energetic balanced proportions.',
  },
  {
    pattern: /petite polished female body,\s*compact refined proportions,\s*delicate idol-like silhouette,\s*graceful small-frame presence/i,
    aiText: 'Petite polished body, compact refined proportions, delicate idol-like silhouette, graceful small-frame presence.',
  },
];

function escapeRegExpPattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mergeGptSingleHairColorIntoHairstyle(text) {
  let output = text;
  for (const rule of GPT_SINGLE_HAIR_COLOR_MERGE_RULES) {
    const phrase = escapeRegExpPattern(rule.phrase);
    const hairStylePattern = '[^.!?]*(?:hair|waves|bob|ponytail|pigtails|bun|chignon|hairstyle)[^.!?]*';
    output = output.replace(new RegExp(`\\b(${hairStylePattern})\\.\\s+${phrase}`, 'gi'), (_, hairstyle) => {
      const cleanedHairstyle = hairstyle.trim();
      if (!cleanedHairstyle) return rule.phrase;
      return `${rule.modifier} ${cleanedHairstyle}${rule.suffix || ''}`;
    });
  }
  return output;
}

function buildGptCompletePaletteModifier(value) {
  return String(value || '')
    .replace(/\s+color family(?:\s+with\s+dark accent balance)?/i, '')
    .replace(/\bblack, white, and cool gray\b/i, 'black white cool-gray')
    .replace(/\bblack-and-red street\b/i, 'black-and-red street')
    .replace(/\bdeep indigo denim\b/i, 'deep indigo denim')
    .replace(/\bcream, ivory, and soft neutral\b/i, 'cream ivory soft-neutral')
    .replace(/\bsoft pink sweet-cool\b/i, 'soft pink sweet-cool')
    .replace(/\bbrown, camel, and vintage tan\b/i, 'brown camel vintage-tan')
    .replace(/\bsilver, graphite, and metallic gray\b/i, 'silver graphite metallic')
    .replace(/\bolive green, sage, and utility gray\b/i, 'olive sage utility-gray')
    .replace(/\byellow, orange, and bright warm\b/i, 'yellow orange bright-warm')
    .replace(/\s*,\s*/g, ' ')
    .replace(/\s+and\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanGptPaletteWardrobeBase(value) {
  return cleanGptSinglePromptText(value)
    .replace(/,\s*(?:dominant|main|secondary|contrast|tonal)\s+[^,.]*?\s+controlled by\s+[^,.]+/gi, '')
    .replace(/,\s*color controlled by\s+[^,.]+/gi, '')
    .replace(/,\s*[^,.]*?\bcontrolled by\s+(?:the\s+)?(?:outfit|dress|contrast)[^,.]*/gi, '')
    .replace(/,\s*[^,.]*?\bkept in fixed [^,.]*/gi, '')
    .replace(/,\s*optional [^,.]*?\bcan retain a classic signature color scheme/gi, '')
    .replace(/,\s*selected\s+(?:main\s+)?(?:fabric|uniform|satin|dress|latex|swim fabric|tonal palette|main fabric|main latex|main satin|main swim fabric)\s+color/gi, '')
    .replace(/,\s*selected\s+(?:apron and ruffle contrast|contrast details|contrast trim|ruffle contrast|contrast panels|tonal palette)/gi, '')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/,\s*\./g, '.')
    .trim();
}

function naturalizeGptSingleWardrobePaletteText(text) {
  return cleanGptPaletteWardrobeBase(text)
    .replace(
      /(She wears\s+)?([^.]+?),\s*complete outfit palette direction:\s*shift the complete outfit palette toward a\s+(.+?),\s*preserving garment structure,\s*accessory separation,\s*material contrast,\s*and multi-piece color variation\.?/gi,
      (_, lead = '', outfit, palette) => {
        const modifier = buildGptCompletePaletteModifier(palette);
        const darkAccent = /with\s+dark accent balance/i.test(palette) ? ', dark accent balance' : '';
        const base = cleanGptPaletteWardrobeBase(outfit);
        return base ? `${lead}${[modifier, base].filter(Boolean).join(' ')}${darkAccent}.` : '';
      }
    )
    .replace(
      /,\s*coordinated top-to-bottom palette:\s*upper\/main dress area in\s+([^,]+),\s*lower hem or skirt area in\s+([^,.]+)\.?/gi,
      (_, _primary, secondary) => `, ${secondary.trim()} lower hem or skirt accent.`
    )
    .replace(
      /,\s*coordinated top-to-bottom palette:\s*upper\/main garment area in\s+([^,]+),\s*lower or secondary garment area in\s+([^,.]+)\.?/gi,
      (_, primary, secondary) => `, ${primary.trim()} upper/main garment color, ${secondary.trim()} lower or secondary garment color.`
    );
}

// Kept temporarily as a migration reference for existing prompt-data maintenance.
// The Grok/Z-Image renderer must not call this semantic rewrite path.
function DEPRECATED_GPT_SINGLE_SUBJECT_COMPACTOR(value, context) {
  if (context.subject?.count !== 1 || isSpecialSubject(context.subject) || context.characterProfilePrompt) {
    return value;
  }

  const compressed = cleanGptSinglePromptText(value)
    .replace(/\b(black|white|tortoiseshell|silver metal|gold metal|clear transparent) frame,\s+(bold thick-frame glasses|thin-frame glasses|retro round-frame glasses|narrow oval glasses|sunglasses with tinted lenses)\b/gi, '$1 $2')
    .replace(/,\s*worn normally on the face,\s*lenses aligned over the eyes/gi, '')
    .replace(
      /sexy tall slim-curvy silhouette,\s*about 168-173 cm visual height and 53-58 kg lean visual weight,\s*94-58-92 body proportion anchor,\s*long legs with about 3\.8:6\.2 torso-to-leg balance,\s*full F-to-G-cup-scale bust,\s*narrow defined waist,\s*rounded hips,\s*flat abdomen,\s*dramatic but lean bust-waist-hip curve/gi,
      'sexy tall slim-curvy silhouette, long legs, narrow defined waist, rounded hips, lean hourglass curve'
    )
    .replace(
      /tall slim fashion body,\s*about 170-175 cm visual height,\s*80-58-88 body proportion anchor,\s*long legs with about 3\.5:6\.5 torso-to-leg balance,\s*shorter upper torso,\s*high waistline,\s*narrow ribcage,\s*gently wider hips,\s*clean editorial silhouette/gi,
      'tall slim fashion body, long legs, high waistline, clean editorial silhouette'
    )
    .replace(
      /soft natural hourglass body,\s*about 165-170 cm visual height,\s*90-62-94 body proportion anchor,\s*balanced torso-to-leg ratio around 4:6,\s*longer upper torso,\s*lower waistline,\s*fuller bust,\s*wider hips,\s*elongated abdomen with subtle contour lines/gi,
      'soft natural hourglass body, fuller bust, wider hips, longer torso, subtle abdomen contour'
    )
    .replace(
      /natural basic body,\s*about 160-165 cm visual height,\s*83-62-88 body proportion anchor,\s*balanced torso-to-leg ratio around 4:6,\s*low-contrast waist curve,\s*modest bust and hips,\s*smooth natural silhouette/gi,
      'natural basic body, balanced proportions, soft natural silhouette'
    )
    .replace(
      /fit toned athletic female body,\s*healthy firm silhouette,\s*subtle muscle definition,\s*energetic balanced proportions/gi,
      'fit toned athletic body, firm silhouette, subtle muscle definition'
    )
    .replace(
      /petite polished female body,\s*compact refined proportions,\s*delicate idol-like silhouette,\s*graceful small-frame presence/gi,
      'petite polished body, compact refined proportions, small-frame presence'
    )
    .replace(
      /young beautiful Korean idol face,\s*refined small face,\s*clear bright eyes,\s*polished youthful beauty,\s*photogenic K-pop portrait balance/gi,
      'Korean idol face, refined small face, clear bright eyes, polished K-pop portrait balance'
    )
    .replace(
      /young beautiful Japanese transparent face,\s*soft natural features,\s*clean gentle eyes,\s*airy fresh beauty,\s*subtle innocent portrait presence/gi,
      'Japanese transparent face, soft natural features, clean gentle eyes, airy fresh presence'
    )
    .replace(
      /young sweet pretty face,\s*soft rounded charm,\s*bright friendly eyes,\s*gentle cute beauty,\s*approachable youthful portrait look/gi,
      'sweet pretty face, soft rounded charm, bright friendly eyes, approachable portrait look'
    )
    .replace(
      /young seductive alluring beauty face,\s*magnetic feminine facial balance,\s*defined eyes and lips,\s*sensual captivating portrait presence/gi,
      'seductive mature face, magnetic facial balance, defined eyes and lips'
    )
    .replace(
      /young cool editorial beauty face,\s*refined sharp facial balance,\s*calm distant gaze-ready features,\s*high-fashion understated presence/gi,
      'cool editorial face, sharp facial balance, calm high-fashion presence'
    )
    .replace(
      /young mixed editorial face,\s*dimensional facial structure,\s*defined nose bridge and deep-set eyes,\s*international high-fashion beauty/gi,
      'mixed editorial face, dimensional facial structure, defined nose bridge and deep-set eyes'
    )
    .replace(/\bsexy tall slim-curvy silhouette,\s*long legs,\s*narrow defined waist,\s*rounded hips,\s*lean hourglass curve\b/gi, 'tall slim-curvy hourglass body, long legs, narrow waist, rounded hips')
    .replace(/\btall slim fashion body,\s*long legs,\s*high waistline,\s*clean editorial silhouette\b/gi, 'tall slim fashion body, long legs, high waistline')
    .replace(/\bsoft natural hourglass body,\s*fuller bust,\s*wider hips,\s*longer torso,\s*subtle abdomen contour\b/gi, 'soft hourglass body, fuller bust, wider hips')
    .replace(/\bnatural basic body,\s*balanced proportions,\s*soft natural silhouette\b/gi, 'natural balanced body proportions')
    .replace(/\bfit toned athletic body,\s*firm silhouette,\s*subtle muscle definition\b/gi, 'toned athletic body, subtle muscle definition')
    .replace(/\bpetite polished body,\s*compact refined proportions,\s*small-frame presence\b/gi, 'petite polished body, compact proportions')
    .replace(/\bKorean idol face,\s*refined small face,\s*clear bright eyes,\s*polished K-pop portrait balance\b/gi, 'Korean idol face, small refined face, clear bright eyes')
    .replace(/\bJapanese transparent face,\s*soft natural features,\s*clean gentle eyes,\s*airy fresh presence\b/gi, 'Japanese transparent face, soft features, gentle eyes')
    .replace(/\bsweet pretty face,\s*soft rounded charm,\s*bright friendly eyes,\s*approachable portrait look\b/gi, 'sweet rounded face, bright friendly eyes')
    .replace(/\bseductive mature face,\s*magnetic facial balance,\s*defined eyes and lips\b/gi, 'seductive mature face, defined eyes and lips')
    .replace(/\bcool editorial face,\s*sharp facial balance,\s*calm high-fashion presence\b/gi, 'cool editorial face, sharp features, calm high-fashion presence')
    .replace(/\bmixed editorial face,\s*dimensional facial structure,\s*defined nose bridge and deep-set eyes\b/gi, 'mixed editorial face, defined nose bridge, deep-set eyes')
    .replace(/\blooking directly at the camera,\s*direct eye contact,\s*soft natural smile,\s*gentle confidence,\s*bright approachable expression\b/gi, 'direct eye contact, soft natural smile, gentle confident expression')
    .replace(/\blooking directly at the camera,\s*direct eye contact,\s*calm neutral expression,\s*relaxed half-lidded ease,\s*quiet composed presence\b/gi, 'direct eye contact, calm neutral expression, relaxed half-lidded eyes')
    .replace(/\blooking directly at the camera,\s*direct eye contact,\s*innocent clear eyes,\s*delicate soft expression,\s*pure transparent mood\b/gi, 'direct eye contact, innocent clear eyes, delicate soft expression')
    .replace(/\blooking toward the camera,\s*lips gently pressed with a barely contained smile,\s*playful relaxed expression\b/gi, 'lips gently pressed in a barely contained smile, playful expression')
    .replace(/\blooking away from the camera,\s*distant sideward gaze,\s*thoughtful quiet expression,\s*reflective mood\b/gi, 'distant sideward gaze, thoughtful quiet expression')
    .replace(/\beyes cast downward away from camera,\s*lowered gaze,\s*inward quiet expression,\s*restrained emotion\b/gi, 'downward gaze, quiet inward expression')
    .replace(/\bglancing back over the shoulder,\s*soft sideward attention,\s*gentle alert expression\b/gi, 'glancing back over the shoulder, soft sideward attention')
    .replace(/\beyes gently closed,\s*calm absorbed expression,\s*quiet immersive mood\b/gi, 'eyes gently closed, calm absorbed expression')
    .replace(/\blooking toward the camera,\s*genuine laughing expression,\s*natural teeth smile,\s*candid joy\b/gi, 'genuine laugh, natural teeth smile')
    .replace(/\bglass skin,\s*dewy luminous skin texture,\s*hydrated reflective complexion\b/gi, 'dewy glass skin')
    .replace(/\bsoft matte skin texture,\s*refined pores,\s*velvety smooth finish\b/gi, 'soft matte skin, refined pores')
    .replace(/\bnatural freckles across nose and cheeks,\s*sun-kissed freckles,\s*authentic skin detail\b/gi, 'natural freckles across nose and cheeks')
    .replace(/\bsmall beauty mark under eye or near lips,\s*delicate facial mole detail\b/gi, 'small beauty mark under eye or near lips')
    .replace(/\bslightly sun-kissed skin texture,\s*subtle warm flush,\s*healthy outdoor glow\b/gi, 'sun-kissed skin, subtle warm flush')
    .replace(/\bchin-length inward-curved bob,\s*airy straight bangs,\s*smooth face-framing rounded ends,\s*clean salon shape\b/gi, 'chin-length inward-curved bob, airy straight bangs, rounded face-framing ends')
    .replace(/\bstraight medium-to-long hair with a sleek wet texture,\s*clean straight lengths,\s*separated damp strands,\s*minimal wave\b/gi, 'sleek wet straight medium-to-long hair, separated damp strands')
    .replace(/\blong naturally slightly wavy hair with airy see-through bangs,\s*soft side-draped face-framing strands\b/gi, 'long slightly wavy hair, airy see-through bangs, side-draped face-framing strands')
    .replace(/\bsoft braided hairstyle,\s*delicate woven detail,\s*romantic natural texture\b/gi, 'soft braided hairstyle, delicate woven detail')
    .replace(/\bminimal low ponytail,\s*fine face-framing strands,\s*clean understated elegance\b/gi, 'minimal low ponytail, fine face-framing strands')
    .replace(/\bsoft black-tea brown hair,\s*muted brown-black salon tone\b/gi, 'soft black-tea brown hair')
    .replace(/\bashy beige-brown hair,\s*muted cool-beige tone,\s*airy soft color\b/gi, 'ashy beige-brown hair')
    .replace(/\bhoney caramel-brown hair,\s*warm golden brown salon color\b/gi, 'honey caramel-brown hair')
    .replace(/\brose cocoa-brown hair,\s*soft rosy brunette tone\b/gi, 'rose cocoa-brown hair')
    .replace(/\bpolished Korean-style face-framing flow\b/gi, 'face-framing flow')
    .replace(/\bsleek clean vertical flow\b/gi, 'sleek vertical flow')
    .replace(/\bsmooth clean silhouette\b/gi, 'smooth silhouette')
    .replace(/\bnatural black hair,\s*soft realistic shine,\s*clean dark depth/gi, 'natural black hair')
    .replace(/\bdeep coffee-brown hair,\s*rich brunette depth,\s*soft warm reflection/gi, 'deep coffee-brown hair')
    .replace(/\bmilk-tea brown hair,\s*soft beige-brown muted salon color/gi, 'milk-tea brown hair')
    .replace(/\bchestnut-brown hair,\s*warm natural brown salon color/gi, 'chestnut-brown hair')
    .replace(/\brealistic dyed hair texture\b/gi, 'realistic dyed texture')
    .replace(/,\s*hair color applies only to the scalp hair,\s*eyebrows remain natural and realistic,\s*not dyed to match the hair/gi, ', natural eyebrows')
    .replace(/\bdeep side-parted long soft waves,\s*face-framing flow\b/gi, 'deep side-parted long soft waves')
    .replace(/\bsilver-gray white hair,\s*cool pale fashion color,\s*realistic dyed texture\b/gi, 'silver-gray white hair, cool pale tone, realistic dyed texture')
    .replace(/\blight blonde hair,\s*soft golden-beige tone,\s*realistic dyed texture\b/gi, 'light blonde hair, golden-beige tone, realistic dyed texture')
    .replace(/\bhot-pink fashion hair color,\s*vivid pink tone with realistic dyed texture\b/gi, 'hot-pink fashion hair')
    .replace(/\bjewel cobalt-blue fashion hair color,\s*rich blue tone with realistic dyed texture\b/gi, 'cobalt-blue fashion hair')
    .replace(/\bdeep forest-green fashion hair color,\s*dark moody green tone with realistic dyed texture\b/gi, 'deep forest-green hair')
    .replace(/\.\s*,/g, ',')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/,\s*\./g, '.')
    .trim();

  return mergeGptSingleHairColorIntoHairstyle(compressed);
}

function DEPRECATED_GPT_SINGLE_POSE_COMPACTOR(value, context) {
  if (context.subject?.count !== 1) return value;

  return cleanGptSinglePromptText(value)
    .replace(/\bnatural standing pose,\s*relaxed balanced posture,\s*everyday body language,\s*unforced presence\b/gi, 'natural standing pose, relaxed balanced posture')
    .replace(/\bweight-on-one-leg standing pose,\s*relaxed asymmetrical stance,\s*casual natural posture\b/gi, 'weight-on-one-leg standing pose, relaxed asymmetrical stance')
    .replace(/\bstanding pose with arms naturally at sides,\s*simple clean posture,\s*unforced body line\b/gi, 'standing pose with arms naturally at sides, clean posture')
    .replace(/\bstanding pose with loosely crossed arms,\s*relaxed closed posture,\s*cool composed body language\b/gi, 'standing pose with loosely crossed arms, relaxed composed posture')
    .replace(/\bnatural seated pose,\s*relaxed upright sitting posture,\s*everyday calm body language\b/gi, 'natural seated pose, relaxed upright posture')
    .replace(/\bseated pose leaning slightly forward,\s*engaged natural posture,\s*subtle interactive body language\b/gi, 'seated pose leaning slightly forward, engaged natural posture')
    .replace(/\bseated pose with both hands placed behind for support,\s*open chest,\s*relaxed stretched posture\b/gi, 'seated pose with both hands behind for support, open chest')
    .replace(/\basymmetrical seated pose with one leg relaxed,\s*casual uneven body rhythm,\s*natural sitting line\b/gi, 'asymmetrical seated pose with one leg relaxed')
    .replace(/\bside reclined pose,\s*body gently extended,\s*relaxed low posture,\s*soft flowing body line\b/gi, 'side reclined pose, gently extended body, relaxed low posture')
    .replace(/\brelaxed supine pose,\s*lying on her back facing upward,\s*one arm raised loosely above the head,\s*the other resting casually beside the body,\s*legs bent naturally in a soft asymmetrical way,\s*upright non-inverted body orientation\b/gi, 'relaxed supine pose, lying on her back, one arm above the head, other arm resting beside the body, legs softly bent, upright non-inverted orientation')
    .replace(/\bslightly curled relaxed low pose,\s*soft compact body line,\s*intimate restful posture\b/gi, 'slightly curled low pose, compact body line')
    .replace(/\blight stepping motion,\s*subtle body movement,\s*natural transitional pose,\s*candid rhythm\b/gi, 'light stepping motion, subtle body movement')
    .replace(/\bjust-stopped movement pose,\s*stillness after motion,\s*balanced transitional body language\b/gi, 'just-stopped movement pose, balanced transitional posture')
    .replace(/\bleaning against any suitable existing object within the current scene,\s*body weight lightly supported by that existing scene object,\s*using only a naturally available scene object for support\b/gi, 'leaning against a suitable existing scene object, body lightly supported')
    .replace(/\bsitting on a chair that naturally fits the current scene with the chair style material and scale chosen to match the environment\b/gi, 'sitting on a scene-appropriate chair')
    .replace(/\bopen confident seated arrangement,\s*knees set wider with grounded posture,\s*torso upright,\s*strong spatial presence\b/gi, 'open confident seated arrangement, wider grounded knees, upright torso, strong presence')
    .replace(/\byoga extended puppy pose kneeling arrangement,\s*knees grounded,\s*torso folded forward,\s*forearms crossed under the chin,\s*hands tucked below the jaw\b/gi, 'extended puppy kneeling pose, knees grounded, torso folded forward, forearms crossed under chin')
    .replace(/\blow compact squat with both knees pressed together and feet grounded close under the body with thighs close and parallel forming a compact front-facing lower-body shape\b/gi, 'low compact knees-together squat, feet grounded close, front-facing lower-body shape')
    .replace(/\bcasually languid lying arrangement,\s*relaxed uneven limbs,\s*soft body weight settled into the surface\b/gi, 'languid lying arrangement, relaxed uneven limbs, soft settled weight')
    .replace(/\bwater-contact realism with the whole lower body submerged and only the upper body above the water surface,\s*visible waterline across the body,\s*natural ripples around the torso and limbs,\s*wet skin and damp fabric edges,\s*clothing remains complete and non-transparent\b/gi, 'water-contact realism, whole lower body submerged, only the upper body above the water surface, visible waterline, natural ripples, wet skin and damp fabric edges, clothing complete and non-transparent')
    .replace(/\bwater-contact realism with a visible waterline across the body,\s*natural ripples around the torso and limbs,\s*wet skin and damp fabric edges,\s*clothing remains complete and non-transparent\b/gi, 'water-contact realism, visible waterline, natural ripples, wet skin and damp fabric edges, clothing complete and non-transparent')
    .replace(/\bwater-contact realism on the lower body and garment edges where they meet the bath water,\s*clothing remains complete and non-transparent,\s*visible water sheen and droplets,\s*darker damp fabric tones,\s*heavier wet folds\b/gi, 'wet bath-water contact, clothing complete and non-transparent, wet sheen, droplets, darker damp folds')
    .replace(/\bthe outfit and exposed skin are soaked by bath water,\s*clothing remains complete and non-transparent,\s*visible water sheen and droplets,\s*darker damp fabric tones,\s*heavier wet folds\b/gi, 'wet bath-water contact, clothing complete and non-transparent, wet sheen, droplets, darker damp folds')
    .replace(/\bone hand brushing hair back from the side of the face,\s*fingers visibly touching the hair near the temple or ear\b/gi, 'one hand brushing hair back, fingers touching hair near temple or ear')
    .replace(/\bboth hands placed on the waist or hip line with elbows naturally adapted to the pose\b/gi, 'both hands on waist or hips, elbows naturally adapted')
    .replace(/\bone hand supporting on the floor or nearby surface with the other hand resting on the leg\b/gi, 'one hand supporting on floor or nearby surface, other hand resting on the leg')
    .replace(/\bone hand supporting the chin with the other hand relaxed along the body or support surface\b/gi, 'one hand supporting the chin, other hand relaxed')
    .replace(/\bboth hands gathered close in front of the lower abdomen with wrists and fingers softly folded together and elbows tucked inward near the knees in a compact low pose\b/gi, 'both hands gathered at lower abdomen, wrists softly folded, elbows tucked inward')
    .replace(/\bboth hands resting on the thighs or nearest upper-leg surface\b/gi, 'both hands resting on thighs or nearest upper-leg surface')
    .replace(/\bhead turned slightly off-axis near the lens with the face plane angled diagonally instead of flat to camera\b/gi, 'head slightly off-axis near lens, face angled diagonally')
    .replace(/\bhead angled close to a support surface or shoulder line with the cheek plane following the selected support contact\b/gi, 'head close to support surface or shoulder line')
    .replace(/\bhead angled low near a rim or support edge with cheek and jawline close to the supporting surface\b/gi, 'head low near rim or support edge, cheek and jawline close to the surface')
    .replace(/\bchin tucked toward one shoulder line with the neck softly folded by the selected pose\b/gi, 'chin tucked toward one shoulder line')
    .replace(/\bapplying lipstick with the lipstick bullet pressed to the lips,\s*visible hand-to-mouth contact,\s*slight lip pressure,\s*polished beauty touch-up portrait moment\b/gi, 'applying lipstick with the lipstick bullet pressed to the lips, visible hand-to-mouth contact, slight lip pressure')
    .replace(/\bholding a clear plastic takeaway cup of iced coffee near the lips mid-sip,\s*visible straw or cup rim,\s*relaxed everyday cafe portrait moment\b/gi, 'holding a clear plastic iced coffee cup near the lips mid-sip, visible straw or cup rim')
    .replace(/\bbiting a colorful whirly pop swirl lollipop at the lips,\s*candy prop clearly visible,\s*playful portrait interaction with crisp mouth contact\b/gi, 'biting a colorful whirly pop lollipop at the lips, candy prop visible, crisp mouth contact')
    .replace(/\bcontrolled cinematic portrait gesture\b/gi, 'controlled cinematic gesture')
    .replace(/\bpolished beauty touch-up portrait moment\b/gi, 'beauty touch-up gesture')
    .replace(/\bportrait action\b/gi, 'action')
    .replace(/\bportrait interaction\b/gi, 'interaction')
    .replace(/\bbody language\b/gi, 'posture')
    .replace(/\.\s*,/g, ',')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/,\s*\./g, '.')
    .trim();
}

function DEPRECATED_GPT_SINGLE_WARDROBE_COMPACTOR(value, context) {
  if (context.subject?.count !== 1) return value;

  const compressed = cleanGptSinglePromptText(value)
    .replace(/\bgothic bunny corset outfit,\s*bunny-ear headband with lace inner panels,\s*one bunny ear standing upright and the other half-drooping,\s*bow accents placed clearly on both the left and right sides of the headband,\s*fitted corset bodysuit with shaped cup seams and vertical boning lines,\s*lace neckline,\s*cross appliques,\s*ribbon and garter straps,\s*matching main-color garter lace thigh-high stockings,\s*leather neck choker with metal cross pendant/gi, 'gothic bunny corset, bunny-ear headband with one upright ear and one half-drooping ear, side bow accents, fitted corset bodysuit, shaped cup seams, vertical boning, lace neckline, cross appliques, ribbon and garter straps, matching garter lace thigh-high stockings, leather choker with metal cross pendant')
    .replace(/\btight long-sleeve button-up shirt outfit,\s*opaque stretch cotton shirting fabric,\s*structured collar and long fitted sleeves,\s*upper buttons left open,\s*remaining front buttons fastened under tension,\s*visible button placket pulling at the chest and waist,\s*horizontal fabric wrinkles across the bust and midriff,\s*tight bodycon mini skirt,\s*smooth hip-hugging skirt silhouette/gi, 'tight long-sleeve button-up shirt, opaque stretch cotton, structured collar and fitted sleeves, upper buttons open, front buttons under tension, placket pulling at chest and waist, bust and midriff wrinkles, tight bodycon mini skirt, smooth hip-hugging silhouette')
    .replace(/\btight short-sleeve button-up shirt outfit,\s*opaque stretch cotton shirting fabric,\s*structured collar and short sleeves,\s*upper buttons left open,\s*remaining front buttons fastened under tension,\s*visible button placket pulling at the chest and waist,\s*horizontal fabric wrinkles across the bust and midriff,\s*skin-tight ultra-short hot pants/gi, 'tight short-sleeve button-up shirt, opaque stretch cotton, structured collar and short sleeves, upper buttons open, front buttons under tension, placket pulling at chest and waist, bust and midriff wrinkles, skin-tight hot pants')
    .replace(/\bhigh-neck extreme front cut-out monokini swimsuit,\s*bikini-like one-piece construction,\s*separate high-neck chest panel and high-cut bikini bottom connected only by thin side straps,\s*oversized open front torso gap exposing most of the abdomen and navel,\s*smooth stretch swim fabric/gi, 'high-neck extreme front cut-out monokini swimsuit, separate high-neck chest panel and high-cut bikini bottom connected by thin side straps, large open front torso gap exposing abdomen and navel, smooth stretch swim fabric')
    .replace(/tight body-skimming upper-body fit,\s*([^,]+?) cotton camisole top,\s*slim shoulder straps,\s*soft ribbed knit,\s*clean compact upper-body line/gi, 'tight $1 ribbed cotton camisole with slim straps')
    .replace(/high-rise waistband sitting above the natural waist,\s*fitted lower-body line following the garment shape,\s*([^,]+?) straight-leg jeans,\s*clean denim texture,\s*balanced leg line,\s*classic five-pocket construction/gi, 'high-rise fitted $1 straight-leg jeans')
    .replace(/([^,]+?) denim jacket,\s*washed denim texture,\s*chest pockets,\s*metal buttons,\s*casual structured outerwear/gi, '$1 washed denim jacket with chest pockets and metal buttons')
    .replace(/outerwear intentionally slipped below one or both shoulders,\s*sleeves still loosely on the arms,\s*jacket body hanging as an intact outer layer/gi, 'outerwear slipped below the shoulder line, sleeves loosely on the arms, jacket body still readable as an outer layer')
    .replace(/,\s*one-piece silhouette(?=,|\.)/gi, '')
    .replace(/\bone-piece body-skimming silhouette\b/gi, 'body-skimming silhouette')
    .replace(/\bone-piece fitted silhouette\b/gi, 'fitted silhouette')
    .replace(/\bone-piece bodycon silhouette\b/gi, 'bodycon silhouette')
    .replace(/\bone-piece elongated silhouette\b/gi, 'elongated silhouette')
    .replace(/\bone-piece flowing silhouette\b/gi, 'flowing silhouette')
    .replace(/\bone-piece loose silhouette\b/gi, 'loose silhouette')
    .replace(/\bone-piece tailored silhouette\b/gi, 'tailored silhouette')
    .replace(/\bone-piece asymmetric silhouette\b/gi, 'asymmetric silhouette')
    .replace(/\bcompact short hem\b/gi, 'short hem')
    .replace(/,\s*main fabric color controlled by outfit primary color/gi, ', selected main fabric color')
    .replace(/,\s*lace ribbons garter straps and trims controlled by outfit contrast color/gi, ', selected lace, ribbon, garter strap, and trim contrast')
    .replace(/,\s*cross decorations controlled by contrast palette/gi, '')
    .replace(/,\s*cross appliques,\s*metal cross pendant,\s*and leather choker hardware kept in fixed metallic tones/gi, '')
    .replace(/,\s*satin base controlled by outfit primary color/gi, ', selected satin base color')
    .replace(/,\s*dress base controlled by outfit primary color/gi, ', selected dress base color')
    .replace(/,\s*lace cord eyelet and bow details controlled by outfit contrast color/gi, ', selected lace cord, eyelet, and bow contrast')
    .replace(/,\s*lace trims and gothic hand-drawn graphics controlled by outfit contrast color/gi, ', selected lace trim and graphic contrast')
    .replace(/,\s*(?:dominant )?(fabric|uniform|textile|leather) color controlled by the outfit color selection/gi, ', selected $1 color')
    .replace(/,\s*main (fabric|silk|satin|latex|knit|tulle|swim fabric) color controlled by dress color selection/gi, ', selected main $1 color')
    .replace(/,\s*tonal palette controlled by the outfit color selection/gi, ', selected tonal palette')
    .replace(/,\s*main jersey color controlled by the outfit color selection/gi, ', selected main jersey color')
    .replace(/,\s*main fabric color controlled by the outfit color selection/gi, ', selected main fabric color')
    .replace(/,\s*contrast trim controlled by contrast palette/gi, ', selected contrast trim')
    .replace(/,\s*contrast details controlled by contrast palette/gi, ', selected contrast details')
    .replace(/,\s*apron and ruffle contrast controlled by contrast palette/gi, ', selected apron and ruffle contrast')
    .replace(/,\s*ruffle contrast controlled by contrast palette/gi, ', selected ruffle contrast')
    .replace(/,\s*contrast panels controlled by contrast palette/gi, ', selected contrast panels')
    .replace(/,\s*metal hardware kept in fixed metallic tones/gi, ', metal hardware in fixed metallic tones')
    .replace(/,\s*grommets,\s*buckles,\s*and ring hardware kept in fixed metallic tones/gi, ', grommets, buckles, and rings in fixed metallic tones')
    .replace(/,\s*decorative metal ring and optional preserved rose print palette kept in fixed metallic tones/gi, ', metal ring in fixed metallic tones, rose print palette preserved')
    .replace(/,\s*optional (?:classic white cuff collar|fixed school trim colors|classic white apron) scheme can retain a classic signature color scheme/gi, ', classic signature accents optional')
    .replace(/,\s*properly worn on both shoulders(?=,|\.)/gi, '')
    .replace(/,\s*soft cotton texture(?=,|\.)/gi, '')
    .replace(/,\s*terrace football styling(?=,|\.)/gi, '')
    .replace(/realistic outer-to-inner dressing order:\s*outerwear is the complete outer layer,\s*properly worn with intact shoulders,\s*sleeves,\s*lapels and hem;\s*inner garment remains visible only where naturally exposed at the neckline,\s*front opening or hem/gi, 'outerwear remains a coherent outer layer; inner garment appears at natural openings')
    .replace(/realistic outer-to-inner dressing order:\s*outerwear remains a coherent outer layer;\s*inner garment appears at natural openings/gi, 'outerwear remains a coherent outer layer; inner garment appears at natural openings')
    .replace(/[,.]\s*realistic outer-to-inner dressing order:\s*long bottom layer keeps its natural full length and drape;\s*shoes can remain normally visible without distorting the pants or skirt\.?/gi, '')
    .replace(/[,.]\s*realistic outer-to-inner dressing order:\s*long bottom keeps its natural drape while footwear remains normally readable\.?/gi, '')
    .replace(/\brealistic outer-to-inner dressing order:\s*/gi, '')
    .replace(/\bclean compact upper-body line\b/gi, '')
    .replace(/\bbalanced leg line\b/gi, '')
    .replace(/\bclassic five-pocket construction\b/gi, '')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/,\s*\./g, '.')
    .replace(/\.\s*,/g, ',')
    .trim();

  return naturalizeGptSingleWardrobePaletteText(compressed);
}

function cleanZImageSinglePromptText(value) {
  return cleanGptSinglePromptText(value)
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/,\s*\./g, '.')
    .replace(/\.\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

const Z_IMAGE_REDUNDANT_SOURCE_FRAGMENTS = [
  /top worn in a standard natural position/gi,
  /bottom worn in a standard natural position/gi,
  /top hem worn naturally loose over the waistband/gi,
  /top length meets or slightly overlaps the low-rise waistband/gi,
  /top hem tucks into the low-rise waistband with a natural low-rise proportion/gi,
  /top hem overlaps the low-rise waistband,\s*long untucked length covering the abdomen/gi,
  /tight body-skimming upper-body fit/gi,
  /low-rise waistband sitting on the hips/gi,
  /tight body-skimming lower-body fit/gi,
  /compact fitted seat/gi,
  /sharp short-bottom silhouette/gi,
  /jacket body still readable as an outer layer/gi,
  /polished(?:\s+[^,.]+)? silhouette/gi,
  /neat collar line/gi,
  /clean front placket/gi,
  /uniform-inspired shirt structure/gi,
  /clean compact upper-body line/gi,
  /balanced leg line/gi,
  /classic five-pocket construction/gi,
  /properly worn on both shoulders/gi,
  /worn normally on the face/gi,
  /lenses aligned over the eyes/gi,
  /graceful small-frame presence/gi,
  /smooth natural silhouette/gi,
  /clean editorial silhouette/gi,
  /subtle innocent portrait presence/gi,
  /high-fashion understated presence/gi,
  /international high-fashion beauty/gi,
  /polished youthful beauty/gi,
  /photogenic K-pop portrait balance/gi,
  /moody glossy texture/gi,
  /soft realistic shine/gi,
  /clean dark depth/gi,
  /gentle confident expression/gi,
  /bright approachable expression/gi,
  /magnetic feminine facial balance/gi,
  /defined eyes and lips/gi,
  /sensual captivating portrait presence/gi,
  /polished Korean-style face-framing flow/gi,
  /hydrated reflective complexion/gi,
  /clean salon shape/gi,
  /approachable youthful portrait look/gi,
  /authentic skin detail/gi,
  /bikini-like one-piece construction/gi,
  /looking directly at the camera/gi,
  /casual structured outerwear/gi,
  /soft cotton texture/gi,
  /bow accents placed clearly on both the left and right sides of the headband/gi,
  /remaining front buttons fastened under tension/gi,
  /one-piece silhouette/gi,
  /balanced feminine silhouette/gi,
  /coordinated(?:\s+[^,.]+)?\s+styling/gi,
  /balanced look/gi,
  /fashionable presence/gi,
];

function compactZImageSourceText(value) {
  let output = cleanZImageSinglePromptText(value);
  for (const pattern of Z_IMAGE_REDUNDANT_SOURCE_FRAGMENTS) {
    output = output.replace(pattern, '');
  }
  return output
    .replace(/\b(short|long|soft) necktie fastened at the collar\b/gi, '$1 necktie')
    .replace(/\bouterwear remains a coherent outer layer;\s*inner garment appears at natural openings\b/gi, '')
    .replace(/\blegwear stays secondary,\s*appearing near hems or openings when naturally visible\b/gi, '')
    .replace(/\blong bottom keeps its natural drape while footwear remains normally readable\b/gi, '')
    .replace(/\b(?:dominant|main|secondary|contrast|tonal)\s+[^,.]*?\s+controlled by\s+[^,.]*/gi, '')
    .replace(/\bcolor controlled by\s+[^,.]*/gi, '')
    .replace(/\boptional [^,.]*? can retain a classic signature color scheme\b/gi, '')
    .replace(/\bselected\s+(?:main\s+)?(?:fabric|uniform|satin|dress|latex|swim fabric|tonal palette|main fabric|main latex|main satin|main swim fabric)\s+color/gi, '')
    .replace(/\b(woman|women)\.\s+with\b/gi, '$1 with')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/\s*,\s*\./g, '.')
    .replace(/\.\s*,/g, ',')
    .replace(/,\s*$/g, '')
    .trim();
}

function compactZImageLocationText(value) {
  const clauses = splitPromptClauses(value);
  const condition = /\b(?:rain|snow|storm|fog|mist|wind|night|dusk|dawn|sunset|sunrise|daylight|overcast|cloudy|golden hour|post-rain|winter|summer|spring|autumn|late-afternoon|early-morning)\b/i;
  const selected = [];

  for (const clause of clauses) {
    if (selected.length < 3 || condition.test(clause)) selected.push(clause);
    if (selected.length >= 4) break;
  }

  return compactZImageSourceText(selected.join(', '));
}

function compactZImageCameraText(value) {
  return compactZImageSourceText(value)
    .replace(/,\s*environmental scale/gi, '')
    .replace(/,\s*upper-body portrait height/gi, '')
    .replace(/,\s*level lens axis/gi, '')
    .replace(/,\s*neutral perspective/gi, '')
    .replace(/,\s*minimal geometric distortion/gi, '')
    .replace(/\s*,\s*,+/g, ', ')
    .trim();
}

function splitZImageSpecialOutfitContent(value) {
  const personFragments = [];
  const wardrobeFragments = [];

  for (const fragment of splitGptSpecialOutfitFragments(value)) {
    if (isGptSpecialOutfitHairOrBodyFragment(fragment)) {
      personFragments.push(fragment);
    } else {
      wardrobeFragments.push(fragment);
    }
  }

  return {
    personText: compactZImageSourceText(personFragments.join(', ')),
    wardrobeText: compactZImageSourceText(wardrobeFragments.join(', ')),
  };
}

function protectSingleBodyTypeAnchors(value) {
  const anchors = [];
  let output = value;

  for (const rule of SINGLE_BODY_TYPE_ANCHOR_RULES) {
    output = output.replace(new RegExp(rule.pattern.source, 'gi'), (match) => {
      const token = `ZIMAGEBODYANCHOR${anchors.length}`;
      anchors.push({ token, text: match });
      return token;
    });
  }

  return {
    text: output,
    restore(restoredValue) {
      return anchors.reduce((result, anchor) => {
        return result.replace(new RegExp(anchor.token, 'g'), anchor.text);
      }, restoredValue);
    },
  };
}

function compressZImageSingleSubjectText(value, context) {
  if (context.subject?.count !== 1 || isSpecialSubject(context.subject)) return value;

  const protectedBody = protectSingleBodyTypeAnchors(value);
  const compressed = compactZImageSourceText(protectedBody.text);

  const restored = compactZImageSourceText(protectedBody.restore(compressed));
  const faceCloseupCleaned = isFaceOnlyCloseupFramingItem(context?.framing)
    ? restored.replace(/\b(woman|women)\.\s+with\b/gi, '$1 with')
    : restored;

  return faceCloseupCleaned
    .replace(/\bwet-look long wavy hair, damp separated strands,\s*natural black hair\b/gi, 'natural black wet-look long wavy hair, damp separated strands')
    .replace(/\bdeep side-parted long soft waves(?:, polished Korean-style face-framing flow)?,\s*silver-gray white hair\b/gi, 'silver-gray white deep side-parted long soft waves')
    .replace(/\bsleek wet straight medium-to-long hair, separated damp strands,\s*honey caramel-brown hair\b/gi, 'honey caramel-brown sleek wet straight medium-to-long hair, separated damp strands')
    .replace(/\bstraight medium-to-long hair with a sleek wet texture, clean straight lengths, separated damp strands, minimal wave,\s*honey caramel-brown hair\b/gi, 'honey caramel-brown sleek wet straight medium-to-long hair, separated damp strands')
    .replace(/\blong naturally slightly wavy hair with airy see-through bangs, soft side-draped face-framing strands,\s*jewel cobalt-blue fashion hair color\b/gi, 'cobalt-blue fashion long slightly wavy hair')
    .replace(/\bvoluminous high ponytail, loose natural strands, lifted active movement,\s*soft black-tea brown hair\b/gi, 'soft black-tea brown voluminous high ponytail')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/,\s*\./g, '.')
    .trim();
}

function compressZImageSingleWardrobeText(value, context) {
  if (context.subject?.count !== 1) return value;

  let output = compactZImageSourceText(value)
    .replace(/\bone-piece bodycon silhouette\b/gi, 'bodycon silhouette')
    .replace(/\bone-piece fitted silhouette\b/gi, 'fitted silhouette')
    .replace(/\bone-piece body-skimming silhouette\b/gi, 'body-skimming silhouette')
    .replace(/,\s*clean beachwear styling/gi, '')
    .replace(/,\s*clean beachwear silhouette/gi, '')
    .replace(/,\s*top length extending below the low-rise waistband,\s*abdomen covered,\s*not cropped into an unintended midriff reveal/gi, '')
    .replace(/,\s*top properly tucked into the low-rise waistband with a natural low-rise proportion,\s*clean waist styling,\s*not cropped/gi, '')
    .replace(/[,.]\s*realistic outer-to-inner dressing order:\s*long bottom layer keeps its natural full length and drape;\s*shoes can remain normally visible without distorting the pants or skirt\.?/gi, '')
    .replace(/[,.]\s*realistic outer-to-inner dressing order:\s*long bottom keeps its natural drape while footwear remains normally readable\.?/gi, '')
    .replace(/,\s*selected\s+(?:main\s+)?(?:fabric|uniform|satin|dress|latex|swim fabric|tonal palette|main fabric|main latex|main satin|main swim fabric)\s+color/gi, '')
    .replace(/,\s*selected\s+(?:apron and ruffle contrast|contrast details|contrast trim|ruffle contrast|contrast panels|tonal palette)/gi, '')
    .replace(/,\s*selected\s+lace,\s*ribbon,\s*garter strap,\s*and trim contrast/gi, '')
    .replace(/,\s*selected\s+lace cord,\s*eyelet,\s*and bow contrast/gi, '')
    .replace(/,\s*selected\s+lace trim and graphic contrast/gi, '')
    .replace(/,\s*selected\s+main jersey color/gi, '')
    .replace(/,\s*selected\s+main fabric color/gi, '')
    .replace(/,\s*classic signature accents optional/gi, '')
    .replace(/,\s*metal hardware in fixed metallic tones/gi, '')
    .replace(/,\s*grommets,\s*buckles,\s*and rings in fixed metallic tones/gi, '')
    .replace(/,\s*metal ring in fixed metallic tones,\s*rose print palette preserved/gi, '')
    .replace(
      /[,.]\s*complete outfit palette direction:\s*shift the complete outfit palette toward a\s+(.+?)\s+color family(?:\s+with\s+dark accent balance)?\s*,\s*preserving garment structure,\s*accessory separation,\s*material contrast,\s*and multi-piece color variation\.?/gi,
      (_, palette) => {
        const modifier = buildGptCompletePaletteModifier(palette);
        return modifier ? `, ${modifier} palette` : '';
      }
    );

  if (!/^She wears\b/i.test(output) && output) {
    output = `She wears ${output}`;
  }

  output = output
    .replace(
      /^(She wears\s+[^.]*?\btriangle bikini top),\s+(slim halter strings,\s*minimal sliding triangle cups,\s*smooth stretch swim fabric),\s+([^.]*(?:bottoms)[^.]*)$/i,
      '$1 with $2, paired with $3'
    )
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/,\s*\./g, '.')
    .replace(/\.\s*,/g, ',')
    .trim();

  return compactZImageSourceText(output);
}

function compressZImageSinglePoseText(value, context) {
  if (context.subject?.count !== 1) return value;

  return compactZImageSourceText(value)
    .replace(/\bShe is standing with natural relaxed standing arrangement;\s*arms crossed loosely in front of the body\b/gi, 'She is standing with arms crossed loosely in front of the body')
    .replace(/^She is sitting with natural seated arrangement;\s*head naturally facing the camera\.?$/i, 'She is sitting naturally with her head facing the camera')
    .replace(/\blooking directly at the camera,\s*/gi, '')
    .replace(/\bcool composed body language\b/gi, 'relaxed composed posture')
    .replace(/\bpolished beauty touch-up portrait moment\b/gi, 'beauty touch-up gesture')
    .replace(/\brelaxed everyday cafe portrait moment\b/gi, 'relaxed cafe gesture')
    .replace(/\busing only a naturally available scene object for support\b/gi, 'using an existing scene object for support')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/,\s*\./g, '.')
    .trim();
}

function renderGptPrompt(promptModel) {
  const {
    valuesByLabel,
    context,
    character,
    wardrobe,
    wardrobeColors,
  } = promptModel;
  const section = (title, sentence) => {
    const cleaned = ensureTerminalPeriod(cleanGptSinglePromptText(sentence || ''));
    return cleaned ? `${title}:\n${cleaned}` : '';
  };
  const blockSection = (title, value) => {
    const cleaned = String(value || '')
      .replace(/[`*]/g, '')
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return cleaned ? `${title}:\n${cleaned}` : '';
  };
  const {
    imageType,
    sceneText,
    subjectText,
    wardrobeText,
    poseText,
    lightingText,
    cameraText,
    subjectLead,
    wardrobeLead,
    sceneUsesDirectSentence,
  } = buildPromptSectionSources(valuesByLabel, context);
  const imageTypeLine = buildImageTypePromptLine(context) || imageType;
  const compositionLine = buildCompositionPromptLine(context);
  const useRoleOrderedDuo = context.subject?.count === 2 && character && wardrobe && wardrobeColors;
  const characterSlots = character ? extractCharacterSlots(character) : {};
  const duoCharacterSlots = useRoleOrderedDuo ? extractCharacterSlots(character) : null;
  const duoWardrobeSlots = useRoleOrderedDuo ? extractWardrobeSlots(wardrobe) : null;
  const singleCharacterProfileSubjectBlock = !useRoleOrderedDuo && isCharacterProfileSubject(context.subject)
    ? buildGptCharacterProfileSubjectBlock(context.subject, context.locks, wardrobe, context)
    : '';
  const singleSpecialOutfitText = !useRoleOrderedDuo && context.subject?.count === 1
    ? firstStructuredValue(valuesByLabel, ['Special Outfit'])
    : '';
  const singleSpecialOutfitGroups = singleSpecialOutfitText
    ? buildGptSingleSpecialOutfitGroups(
        singleSpecialOutfitText,
        getStructuredValues(valuesByLabel, ['Outerwear'])
      )
    : { hairAndBodyText: '', wardrobeText: '' };
  let resolvedSubjectText = useRoleOrderedDuo
    ? buildGptDuoSubjectText(context, duoCharacterSlots, duoWardrobeSlots, wardrobeColors)
    : singleCharacterProfileSubjectBlock
    ? singleCharacterProfileSubjectBlock
    : buildGptSingleFullFidelityText(subjectText);
  if (singleSpecialOutfitGroups.hairAndBodyText) {
    const baseSubjectText = singleCharacterProfileSubjectBlock
      ? resolvedSubjectText
      : `${subjectLead} ${resolvedSubjectText}`.trim();
    resolvedSubjectText = [
      baseSubjectText,
      `Hair and body details:\n${singleSpecialOutfitGroups.hairAndBodyText}`,
    ].filter(Boolean).join('\n\n');
  }
  const singleSpecialOutfitWardrobeBlock = singleSpecialOutfitGroups.wardrobeText;
  const resolvedWardrobeText = useRoleOrderedDuo
    ? wardrobeText
    : singleSpecialOutfitWardrobeBlock
    ? singleSpecialOutfitWardrobeBlock
    : buildGptSingleFullFidelityWardrobeText(wardrobeText);
  const resolvedSharedExpressionText = useRoleOrderedDuo ? buildGptDuoSharedExpressionText(duoCharacterSlots) : '';
  const hasCanonicalPose = !useRoleOrderedDuo
    && characterSlots.poseComposer
    && !isNoneLikeItem(characterSlots.poseComposer);
  const canonicalPoseText = hasCanonicalPose ? context.projectedCanonicalPoseText || '' : '';
  const resolvedPoseText = useRoleOrderedDuo
    ? buildGptDuoPoseAndCompositionText(valuesByLabel, context)
    : hasCanonicalPose
      ? canonicalPoseText
      : context.compositionVisibility?.pose?.mode === 'omit'
        ? ''
        : filterFaceOnlyTorsoAngleText(buildGptSingleFullFidelityText(poseText), context);
  const resolvedWardrobeUsesBlock = Boolean(singleSpecialOutfitWardrobeBlock);
  const resolvedSubjectUsesBlock = Boolean(singleCharacterProfileSubjectBlock || singleSpecialOutfitGroups.hairAndBodyText);
  const sceneSection = sceneText
    ? sceneText.includes('\n')
      ? blockSection('Scene', sceneText)
      : section('Scene', sceneUsesDirectSentence ? sceneText : `The portrait takes place in ${sceneText}`)
    : '';

  if (useRoleOrderedDuo) {
    return [
      section('Image Type', imageTypeLine),
      compositionLine,
      resolvedSubjectText ? blockSection('Subject', resolvedSubjectText) : '',
      resolvedSharedExpressionText ? section('Shared Expression', resolvedSharedExpressionText) : '',
      section('Pose and Composition', resolvedPoseText),
      sceneSection,
      section('Lighting', lightingText),
      section('Camera Look', cameraText),
      'multi-cut sequence n=2',
    ].filter(Boolean).join('\n\n');
  }

  return [
    section('Image Type', imageTypeLine),
    compositionLine,
    resolvedSubjectText
      ? resolvedSubjectUsesBlock
        ? blockSection('Subject', resolvedSubjectText)
        : section('Subject', useRoleOrderedDuo ? resolvedSubjectText : `${subjectLead} ${resolvedSubjectText}`)
      : '',
    resolvedWardrobeText
      ? resolvedWardrobeUsesBlock
        ? blockSection('Wardrobe', resolvedWardrobeText)
        : section('Wardrobe', `${wardrobeLead} ${resolvedWardrobeText}`)
      : '',
    section('Pose and Composition', resolvedPoseText),
    sceneSection,
    section('Lighting', lightingText),
    section('Camera Look', cameraText),
    'multi-cut sequence n=2',
  ].filter(Boolean).join('\n\n');
}

const FULL_BODY_CHARACTER_REFERENCE_FRAMING = Object.freeze({
  id: 'full-body-character-reference',
  zh: '全身鏡頭 (Full Body Shot)',
  en: 'full body shot, full figure visible from head to toe',
  meta: Object.freeze({ visibility: 'full' }),
});

const FULL_BODY_CHARACTER_IMAGE_TYPE = 'Create a photorealistic character reference portrait in a single 9:16 vertical image';
const FULL_BODY_CHARACTER_LIGHTING = 'Clean even lighting with clear facial, body, fabric, and footwear readability';
const FULL_BODY_CHARACTER_CAMERA_LOOK = 'Full-body view of the subject standing naturally, centered vertical framing, complete figure visible from head to toe, both hands and both feet completely visible, comfortable space above the hair and below the shoes, natural body proportions, no crop, no hidden limbs, clean realistic character-reference photography, clear facial and garment detail, no visible text';

function renderFullBodyCharacterPrompt(promptModel) {
  const {
    valuesByLabel,
    context,
    wardrobe,
  } = promptModel;
  if (context.subject?.count !== 1) return '';

  const section = (title, value) => {
    const cleaned = ensureTerminalPeriod(cleanGptSinglePromptText(value || ''));
    return cleaned ? `${title}:\n${cleaned}` : '';
  };
  const blockSection = (title, value) => {
    const cleaned = String(value || '')
      .replace(/[`*]/g, '')
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return cleaned ? `${title}:\n${cleaned}` : '';
  };
  const {
    subjectText,
    wardrobeText,
    subjectLead,
    wardrobeLead,
  } = buildPromptSectionSources(valuesByLabel, context);
  const characterProfileSubjectBlock = isCharacterProfileSubject(context.subject)
    ? buildGptFullBodyCharacterProfileSubjectBlock(context.subject, context.locks, wardrobe)
    : '';
  const characterProfileGroups = isCharacterProfileSubject(context.subject)
    ? buildCharacterCardProfileGroups(context.subject, context.locks, wardrobe)
    : null;
  const specialOutfitText = firstStructuredValue(valuesByLabel, ['Special Outfit']);
  const specialOutfitGroups = specialOutfitText
    ? buildGptSingleSpecialOutfitGroups(
        specialOutfitText,
        getStructuredValues(valuesByLabel, ['Outerwear'])
      )
    : { hairAndBodyText: '', wardrobeText: '' };
  let resolvedSubjectText = characterProfileSubjectBlock
    || buildGptSingleFullFidelityText(subjectText);
  if (specialOutfitGroups.hairAndBodyText) {
    const baseSubjectText = characterProfileSubjectBlock
      ? resolvedSubjectText
      : `${subjectLead} ${resolvedSubjectText}`.trim();
    resolvedSubjectText = [
      baseSubjectText,
      `Hair and body details:\n${specialOutfitGroups.hairAndBodyText}`,
    ].filter(Boolean).join('\n\n');
  }
  const specialOutfitWardrobeBlock = specialOutfitGroups.wardrobeText;
  const resolvedWardrobeText = specialOutfitWardrobeBlock
    || buildGptSingleFullFidelityWardrobeText(wardrobeText)
    || characterProfileGroups?.outfit
    || '';

  return [
    section('Image Type', FULL_BODY_CHARACTER_IMAGE_TYPE),
    resolvedSubjectText
      ? characterProfileSubjectBlock || specialOutfitGroups.hairAndBodyText
        ? blockSection('Subject', resolvedSubjectText)
        : section('Subject', `${subjectLead} ${resolvedSubjectText}`)
      : '',
    resolvedWardrobeText
      ? specialOutfitWardrobeBlock
        ? blockSection('Wardrobe', resolvedWardrobeText)
        : section('Wardrobe', `${wardrobeLead} ${resolvedWardrobeText}`)
      : '',
    section('Lighting', FULL_BODY_CHARACTER_LIGHTING),
    section('Camera Look', FULL_BODY_CHARACTER_CAMERA_LOOK),
  ].filter(Boolean).join('\n\n');
}

function renderZImagePrompt(promptModel) {
  const {
    context,
    character,
    wardrobe,
    wardrobeColors,
    lightDirection,
    film,
    opticalEffect,
  } = promptModel;
  const characterSlots = extractCharacterSlots(character);
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
  const waistlineCompatibilityText = buildWaistlineCompatibilityPrompt(wardrobeSlots);
  const wardrobeLayeringLogicText = buildWardrobeLayeringLogicPrompt(wardrobeSlots);
  const specialSubjectMode = isDedicatedSpecialSubject(context.subject);
  const characterProfileMode = isCharacterProfileSubject(context.subject);
  const useCharacterIdentityAnchor = Boolean(context.characterProfilePrompt) && context.subject.count === 1 && !specialSubjectMode;
  const projectedScene = context.projectedScene || buildProjectedScene(context);
  const sceneAccentText = projectedScene.sceneAccentText;
  const importedWorldSceneArchitectureText = projectedScene.worldSceneText;
  const singleSpecialOutfitText = context.subject.count === 1 && wardrobeSlots.specialOutfit
    ? buildVisibleSpecialOutfitPrompt(wardrobeSlots.specialOutfit, wardrobeColors.completeLookPalette, context)
    : '';
  const singleSpecialOutfitContent = singleSpecialOutfitText
    ? splitZImageSpecialOutfitContent(singleSpecialOutfitText)
    : { personText: '', wardrobeText: '' };
  const compositionVisibilityProjection = getCompositionVisibilityProjection(context);
  const hideWardrobeForFaceDetail = compositionVisibilityProjection.bucket === COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL;
  const duoWardrobeDifferentiationText = shouldAddDuoWardrobeDifferentiationPrompt(context, wardrobeSlots)
    ? DUO_WARDROBE_DIFFERENTIATION_PROMPT
    : '';
  const sentence = (value) => ensureTerminalPeriod(stripMarkdown(value || '').replace(/\s+/g, ' ').trim());
  const joinSentenceParts = (parts) => sentence(parts.filter(Boolean).join(', '));
  const leadSentence = (lead, parts) => {
    const detail = parts.filter(Boolean).join(', ');
    return detail ? sentence(`${lead} ${detail}`) : '';
  };
  const skeletonMode = isSkeletonSubject(context.subject);
  const fixedCompositionSetActive = isFixedCompositionSetActive(context.fixedCompositionSet);
  const buildZImageLocationText = () => {
    if (!context.location || isNoneLikeItem(context.location)) return '';

    const locationText = skeletonMode
      ? sanitizeSkeletonPromptText(projectedScene.locationText)
      : projectedScene.locationText;
    if (!isSolidColorStudioLocation(context.location)) return locationText;

    return stripMarkdown(locationText)
      .split(/\s*,\s*/)
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => !/^no\b/i.test(part))
      .join(', ');
  };
  const buildCharacterText = () => {
    if (characterProfileMode) {
      const subjectAccessoryText = buildSubjectAccessoryPrompt({
        eyewear: wardrobeSlots.eyewear,
        eyewearColor: wardrobeSlots.eyewearColor,
        eyewearPlacement: wardrobeSlots.eyewearPlacement,
        earrings: wardrobeSlots.earrings,
        neckAccessory: wardrobeSlots.neckAccessory,
      });
      const baseSubjectText = buildCharacterCardSubjectPrompt(context.subject, context.locks, context, wardrobe);
      const specialActionText = characterSlots.specialAction && !isNoneLikeItem(characterSlots.specialAction)
        ? characterSlots.specialAction.en
        : '';
      const actionPoseText = characterSlots.actionPose && !isNoneLikeItem(characterSlots.actionPose)
        ? characterSlots.actionPose.en
        : '';
      const parts = [
        appendSubjectAccessories(
          useCharacterIdentityAnchor ? `${baseSubjectText} ${context.characterProfilePrompt}` : baseSubjectText,
          subjectAccessoryText
        ),
        cleanSubjectAccessoryPrompt(wardrobeSlots.headAccessory),
        characterSlots.expression && !isNoneLikeItem(characterSlots.expression) ? resolvePromptVariant(characterSlots.expression, 'expression', context.subject.count) : '',
        actionPoseText,
        specialActionText,
        characterSlots.pose && !isNoneLikeItem(characterSlots.pose) ? resolvePromptVariant(characterSlots.pose, 'pose', context.subject.count) : '',
      ].filter(Boolean);
      return leadSentence('The image shows', parts);
    }

    if (specialSubjectMode) {
      const specialActionText = characterSlots.specialAction && !isNoneLikeItem(characterSlots.specialAction)
        ? (skeletonMode ? sanitizeSkeletonPromptText(characterSlots.specialAction.en) : characterSlots.specialAction.en)
        : '';
      const actionPoseText = characterSlots.actionPose && !isNoneLikeItem(characterSlots.actionPose)
        ? (skeletonMode ? sanitizeSkeletonPromptText(characterSlots.actionPose.en) : characterSlots.actionPose.en)
        : '';
      const parts = [
        skeletonMode ? sanitizeSkeletonPromptText(context.subject.en) : context.subject.en,
        buildSpecialSubjectIntegrationPrompt(context.subject),
        isAndroidSubject(context.subject) && characterSlots.hairstyle && !isNoneLikeItem(characterSlots.hairstyle) ? characterSlots.hairstyle.en : '',
        isAndroidSubject(context.subject) && characterSlots.hairColor && !isNoneLikeItem(characterSlots.hairColor) ? characterSlots.hairColor.en : '',
        characterSlots.expression && !isNoneLikeItem(characterSlots.expression) ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(characterSlots.expression, 'expression', context.subject.count)) : resolvePromptVariant(characterSlots.expression, 'expression', context.subject.count)) : '',
        actionPoseText,
        specialActionText,
        characterSlots.pose && !isNoneLikeItem(characterSlots.pose) ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(characterSlots.pose, 'pose', context.subject.count)) : resolvePromptVariant(characterSlots.pose, 'pose', context.subject.count)) : '',
      ].filter(Boolean);
      return leadSentence('The image shows', parts);
    }

    const subjectAccessoryText = context.subject.count === 2
      ? [
          buildRoleSubjectAccessoryPrompt(wardrobeSlots, 'a'),
          buildRoleSubjectAccessoryPrompt(wardrobeSlots, 'b'),
        ].filter(Boolean).join(', ')
      : buildSubjectAccessoryPrompt({
          eyewear: wardrobeSlots.eyewear,
          eyewearColor: wardrobeSlots.eyewearColor,
          eyewearPlacement: wardrobeSlots.eyewearPlacement,
          earrings: wardrobeSlots.earrings,
          neckAccessory: wardrobeSlots.neckAccessory,
        });
    const headAccessoryText = context.subject.count === 2
      ? [
          buildAccessoryPrompt(wardrobeSlots.headAccessoryA) ? `woman 1 wearing ${cleanSubjectAccessoryPrompt(wardrobeSlots.headAccessoryA)}` : '',
          buildAccessoryPrompt(wardrobeSlots.headAccessoryB) ? `woman 2 wearing ${cleanSubjectAccessoryPrompt(wardrobeSlots.headAccessoryB)}` : '',
        ].filter(Boolean).join(', ')
      : cleanSubjectAccessoryPrompt(wardrobeSlots.headAccessory);
    const usesFixedSingleSubjectLead = context.subject.count === 1 && shouldUseFixedNormalSingleSubjectLead(context);
    const subjectBaseText = usesFixedSingleSubjectLead
      ? FIXED_SINGLE_NORMAL_SUBJECT_SENTENCE
      : useCharacterIdentityAnchor
        ? `${context.subject.en} ${context.characterProfilePrompt}`
        : context.subject.en;
    const parts = [
      appendSubjectAccessories(
        subjectBaseText,
        subjectAccessoryText
      ),
      context.subject.count === 2
        ? [buildRoleHasPrompt(characterSlots.bodyTypeA, 'woman 1'), buildRoleHasPrompt(characterSlots.bodyTypeB, 'woman 2')].filter(Boolean).join(', ')
        : (characterSlots.bodyType && !isNoneLikeItem(characterSlots.bodyType) ? characterSlots.bodyType.en : ''),
      context.subject.count === 2
        ? [
            characterSlots.facialFeaturesA && !isNoneLikeItem(characterSlots.facialFeaturesA)
              ? `woman 1 has ${characterSlots.facialFeaturesA.en}`
              : '',
            characterSlots.facialFeaturesB && !isNoneLikeItem(characterSlots.facialFeaturesB)
              ? `woman 2 has ${characterSlots.facialFeaturesB.en}`
              : '',
          ].filter(Boolean).join(', ')
        : (!useCharacterIdentityAnchor && characterSlots.facialFeatures && !isNoneLikeItem(characterSlots.facialFeatures) ? characterSlots.facialFeatures.en : ''),
      context.subject.count === 2
        ? [
            characterSlots.hairstyleA && !isNoneLikeItem(characterSlots.hairstyleA) ? characterSlots.hairstyleA.en : '',
            characterSlots.hairColorA && !isNoneLikeItem(characterSlots.hairColorA) ? characterSlots.hairColorA.en : '',
            characterSlots.hairstyleB && !isNoneLikeItem(characterSlots.hairstyleB) ? characterSlots.hairstyleB.en : '',
            characterSlots.hairColorB && !isNoneLikeItem(characterSlots.hairColorB) ? characterSlots.hairColorB.en : '',
          ].filter(Boolean).join(', ')
        : [
            characterSlots.hairstyle && !isNoneLikeItem(characterSlots.hairstyle) ? characterSlots.hairstyle.en : '',
            characterSlots.hairColor && !isNoneLikeItem(characterSlots.hairColor) ? characterSlots.hairColor.en : '',
          ].filter(Boolean).join(', '),
      context.subject.count === 1 ? singleSpecialOutfitContent.personText : '',
      headAccessoryText,
      context.subject.count === 2
        ? [buildRoleHasPrompt(characterSlots.skinDetailsA, 'woman 1'), buildRoleHasPrompt(characterSlots.skinDetailsB, 'woman 2')].filter(Boolean).join(', ')
        : (!useCharacterIdentityAnchor && characterSlots.skinDetails && !isNoneLikeItem(characterSlots.skinDetails) ? characterSlots.skinDetails.en : ''),
      context.subject.count === 2
        ? (characterSlots.duoExpression && !isNoneLikeItem(characterSlots.duoExpression) ? characterSlots.duoExpression.en : '')
        : (characterSlots.expression && !isNoneLikeItem(characterSlots.expression) ? resolvePromptVariant(characterSlots.expression, 'expression', context.subject.count) : ''),
      context.subject.count === 2 && characterSlots.specialAction && !isNoneLikeItem(characterSlots.specialAction) ? characterSlots.specialAction.en : '',
      context.subject.count === 2
        ? (characterSlots.duoPose && !isNoneLikeItem(characterSlots.duoPose) ? characterSlots.duoPose.en : '')
        : '',
    ].filter(Boolean);

    const text = context.subject.count === 1
      ? sentence(parts.join(', '))
      : leadSentence(buildZImageSubjectLead(context), parts);
    return context.subject.count === 1 ? compressZImageSingleSubjectText(text, context) : text;
  };
  const buildSinglePoseText = () => {
    if (context.subject.count !== 1) return '';

    const hasPoseComposer = characterSlots.poseComposer && !isNoneLikeItem(characterSlots.poseComposer);
    if (hasPoseComposer) return context.projectedCanonicalPoseText || '';
    if (specialSubjectMode || characterProfileMode || context.compositionVisibility?.pose?.mode === 'omit') return '';

    const poseText = characterSlots.actionPose && !isNoneLikeItem(characterSlots.actionPose)
      ? characterSlots.actionPose.en
      : (characterSlots.pose && !isNoneLikeItem(characterSlots.pose) ? resolvePromptVariant(characterSlots.pose, 'pose', context.subject.count) : '');
    const parts = [
      characterSlots.actionPose && !isNoneLikeItem(characterSlots.actionPose) ? '' : characterSlots.specialAction && !isNoneLikeItem(characterSlots.specialAction) ? characterSlots.specialAction.en : '',
      poseText,
    ].filter(Boolean);

    if (parts.length === 0) return '';
    return filterZImagePoseForFraming(compressZImageSinglePoseText(parts.join(', '), context), context);
  };
  const buildWardrobeText = () => {
    const parts = [];
    const add = (value) => {
      if (value) parts.push(value);
    };
    const finish = (value) => {
      const text = context.subject.count === 1 && !hideWardrobeForFaceDetail
        ? compressZImageSingleWardrobeText(value, context)
        : value;
      return sentence(text);
    };
    if (hideWardrobeForFaceDetail) return '';
    const buildSingleOutfitPresetText = () => buildVisibleOutfitPresetPrompt(wardrobeSlots.outfitPreset, {
      legacy: wardrobeColors.outfitPresetColor,
      primary: wardrobeColors.outfitPresetPrimaryColor,
      contrast: wardrobeColors.outfitPresetContrastColor,
      lockedPalette: wardrobeColors.outfitPresetLockedPalette,
      completeLookPalette: wardrobeColors.completeLookPalette,
    }, context);
    const buildSingleOuterwearText = ({ minimalStyling = false } = {}) => buildOuterwearColoredPrompt(wardrobeSlots.outerwear, wardrobeColors.outerwearColor, {
      fit: wardrobeSlots.outerwearFit,
      pattern: wardrobeSlots.outerwearPattern,
      opening: wardrobeSlots.outerwearOpening,
      styling: wardrobeSlots.outerwearStyling,
      minimalStyling,
    });
    if (wardrobeSlots.specialOutfitA || wardrobeSlots.specialOutfitB) {
      const specialAText = buildVisibleSpecialOutfitPrompt(wardrobeSlots.specialOutfitA, wardrobeColors.completeLookPaletteA, context);
      const specialBText = buildVisibleSpecialOutfitPrompt(wardrobeSlots.specialOutfitB, wardrobeColors.completeLookPaletteB, context);
      add(specialAText ? `woman 1 wears complete special outfit: ${specialAText}` : '');
      add(specialBText ? `woman 2 wears complete special outfit: ${specialBText}` : '');
      return parts.length > 0 ? finish(parts.join(', ')) : '';
    }
    if (wardrobeSlots.specialOutfit) {
      add(singleSpecialOutfitContent.wardrobeText ? `She wears ${singleSpecialOutfitContent.wardrobeText}` : '');
      return parts.length > 0 ? finish(parts.join(', ')) : '';
    }
    const buildRoleLayerText = (role) => {
      const suffix = role === 'a' ? 'A' : 'B';
      return [
        buildRoleOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors, role),
        filterZImageWardrobeAddonForFraming(buildColoredGrokPrompt(wardrobeSlots[`legwear${suffix}`], wardrobeColors[`legwear${suffix}Color`]), context, 'legwear'),
        filterZImageWardrobeAddonForFraming(buildColoredGrokPrompt(wardrobeSlots[`shoes${suffix}`], wardrobeColors[`shoes${suffix}Color`]), context, 'shoes'),
      ].filter(Boolean).join(', ');
    };
    const buildRoleMainText = (role) => {
      const suffix = role === 'a' ? 'A' : 'B';
      const preset = wardrobeSlots[`outfitPreset${suffix}`];
      if (preset && !isNoneLikeItem(preset)) {
        return buildVisibleOutfitPresetPrompt(preset, {
          legacy: wardrobeColors[`outfitPreset${suffix}Color`],
          primary: wardrobeColors[`outfitPreset${suffix}PrimaryColor`],
          contrast: wardrobeColors[`outfitPreset${suffix}ContrastColor`],
          lockedPalette: wardrobeColors[`outfitPreset${suffix}LockedPalette`],
          completeLookPalette: wardrobeColors[`completeLookPalette${suffix}`],
        }, context);
      }

      const dressText = filterCompleteLookPromptForFraming(
        buildCompleteLookDressPrompt(wardrobeSlots[`dress${suffix}`], wardrobeColors[`dress${suffix}Color`], wardrobeColors[`completeLookPalette${suffix}`], { secondaryColor: wardrobeColors[`topBottomPalette${suffix}`]?.bottomColor }),
        context
      );
      const outerwearFirstDressText = buildOuterwearFirstPrompt(
        dressText,
        wardrobeSlots[`outerwear${suffix}`],
        wardrobeColors[`outerwear${suffix}Color`],
        wardrobeSlots[`outerwear${suffix}Fit`],
        wardrobeSlots[`outerwear${suffix}Pattern`],
        wardrobeSlots[`outerwear${suffix}Opening`],
        wardrobeSlots[`outerwear${suffix}Styling`]
      );
      if (dressText) return outerwearFirstDressText || dressText;

      const topText = buildRoleTopWardrobePrompt(wardrobeSlots, wardrobeColors, role);
      const outerwearFirstTopText = buildOuterwearFirstPrompt(
        topText,
        wardrobeSlots[`outerwear${suffix}`],
        wardrobeColors[`outerwear${suffix}Color`],
        wardrobeSlots[`outerwear${suffix}Fit`],
        wardrobeSlots[`outerwear${suffix}Pattern`],
        wardrobeSlots[`outerwear${suffix}Opening`],
        wardrobeSlots[`outerwear${suffix}Styling`]
      );

      const fallbackOuterwearText = buildRoleOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors, role);

      return [
        outerwearFirstTopText || topText || fallbackOuterwearText,
        filterZImageWardrobeAddonForFraming(buildRoleBottomWardrobePrompt(wardrobeSlots[`pants${suffix}`], wardrobeSlots, wardrobeColors, role), context, 'bottom'),
        filterZImageWardrobeAddonForFraming(buildRoleBottomWardrobePrompt(wardrobeSlots[`skirt${suffix}`], wardrobeSlots, wardrobeColors, role), context, 'bottom'),
      ].filter(Boolean).join(', ');
    };

    if (
      context.subject.count === 2 && (
        wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB ||
        wardrobeSlots.dressA || wardrobeSlots.dressB ||
        wardrobeSlots.topA || wardrobeSlots.topB ||
        wardrobeSlots.pantsA || wardrobeSlots.pantsB ||
        wardrobeSlots.skirtA || wardrobeSlots.skirtB
      )
    ) {
      add(buildRoleMainText('a') ? `woman 1 wears ${buildRoleMainText('a')}` : '');
      add(buildRoleMainText('b') ? `woman 2 wears ${buildRoleMainText('b')}` : '');
      add(buildRoleLayerText('a') ? `woman 1 additional styling includes ${buildRoleLayerText('a')}` : '');
      add(buildRoleLayerText('b') ? `woman 2 additional styling includes ${buildRoleLayerText('b')}` : '');
      add(buildSingleOuterwearText());
      add(filterZImageWardrobeAddonForFraming(buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor), context, 'legwear'));
      add(filterZImageWardrobeAddonForFraming(buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor), context, 'shoes'));
      add(duoWardrobeDifferentiationText);
    } else if (wardrobeSlots.outfitPreset) {
      const outfitPresetText = buildSingleOutfitPresetText();
      const outerwearText = buildSingleOuterwearText({ minimalStyling: true });
      const legwearText = filterZImageWardrobeAddonForFraming(buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor), context, 'legwear');
      const shoesText = filterZImageWardrobeAddonForFraming(buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor), context, 'shoes');

      if (outerwearText) {
        add(`She wears ${outerwearText}, layered over ${outfitPresetText}`);
      } else {
        add(`She wears ${outfitPresetText}`);
      }
      if (legwearText) add(legwearText);
      if (shoesText) add(shoesText);
    } else {
      const dressText = filterCompleteLookPromptForFraming(
        buildCompleteLookDressPrompt(wardrobeSlots.dress, wardrobeColors.dressColor, wardrobeColors.completeLookPalette, { secondaryColor: wardrobeColors.topBottomPalette?.bottomColor }),
        context
      );
      const topText = buildTopWardrobePrompt(wardrobeSlots, wardrobeColors);
      const outerwearFirstDressText = buildOuterwearFirstPrompt(
        dressText,
        wardrobeSlots.outerwear,
        wardrobeColors.outerwearColor,
        wardrobeSlots.outerwearFit,
        wardrobeSlots.outerwearPattern,
        wardrobeSlots.outerwearOpening,
        wardrobeSlots.outerwearStyling
      );
      const outerwearFirstTopText = buildOuterwearFirstPrompt(
        topText,
        wardrobeSlots.outerwear,
        wardrobeColors.outerwearColor,
        wardrobeSlots.outerwearFit,
        wardrobeSlots.outerwearPattern,
        wardrobeSlots.outerwearOpening,
        wardrobeSlots.outerwearStyling
      );
      const fallbackOuterwearText = buildSingleOuterwearText();
      const mainWardrobeText = dressText
        ? (outerwearFirstDressText || dressText)
        : (outerwearFirstTopText || topText || fallbackOuterwearText);
      const usedOuterwearInMain = Boolean(
        (dressText && outerwearFirstDressText) ||
        (!dressText && (outerwearFirstTopText || (!topText && fallbackOuterwearText)))
      );
      if (!usedOuterwearInMain) {
        add(buildSingleOuterwearText());
      }
      add(mainWardrobeText);
      if (!dressText) {
        add(filterZImageWardrobeAddonForFraming(buildBottomWardrobePrompt(wardrobeSlots.pants, wardrobeSlots, wardrobeColors), context, 'bottom'));
        add(filterZImageWardrobeAddonForFraming(buildBottomWardrobePrompt(wardrobeSlots.skirt, wardrobeSlots, wardrobeColors), context, 'bottom'));
      }
      add(filterZImageWardrobeAddonForFraming(buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor), context, 'legwear'));
      add(filterZImageWardrobeAddonForFraming(buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor), context, 'shoes'));
      add(waistlineCompatibilityText);
      add(wardrobeLayeringLogicText);
    }
    if (context.subject.count === 2 && !(wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB)) {
      add(buildRoleLayerText('a') ? `woman 1 additional styling includes ${buildRoleLayerText('a')}` : '');
      add(buildRoleLayerText('b') ? `woman 2 additional styling includes ${buildRoleLayerText('b')}` : '');
    }

    return parts.length > 0 ? finish(parts.join(', ')) : '';
  };
  const buildFixedSceneParagraphs = () => {
    if (!fixedCompositionSetActive) return [];

    const clean = (value) => skeletonMode ? sanitizeSkeletonPromptText(value) : value;
    const ambientText = context.lighting && !isNoneLikeItem(context.lighting)
      ? compactZImageAmbientLightText(skeletonMode ? sanitizeSkeletonPromptText(context.lighting.en) : context.lighting.en)
      : '';
    const subjectLightText = lightDirection && !isNoneLikeItem(lightDirection)
      ? compactZImageSubjectLightText(skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count)) : resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count))
      : '';
    const lightingText = joinSentenceParts([ambientText, subjectLightText]);

    return [
      clean(Z_IMAGE_FIXED_SET_OPENING_PARAGRAPHS[context.fixedCompositionSet.id] || buildGptFixedSetOpeningParagraph(context.fixedCompositionSet)),
      clean(buildZImageFixedSetInteractionParagraph(context)),
      clean(buildZImageFixedSetStabilityParagraph(context)),
      clean(lightingText),
    ].filter(Boolean);
  };
  const buildSceneText = () => {
    if (fixedCompositionSetActive) return joinSentenceParts(buildFixedSceneParagraphs());
    const sceneParts = [
      skeletonMode ? sanitizeSkeletonPromptText(importedWorldSceneArchitectureText) : compactZImageLocationText(importedWorldSceneArchitectureText),
      compactZImageLocationText(buildZImageLocationText()),
      skeletonMode ? sanitizeSkeletonPromptText(sceneAccentText) : compactZImageSourceText(sceneAccentText),
      context.lighting && !isNoneLikeItem(context.lighting) ? compactZImageAmbientLightText(skeletonMode ? sanitizeSkeletonPromptText(context.lighting.en) : context.lighting.en) : '',
      lightDirection && !isNoneLikeItem(lightDirection) ? compactZImageSubjectLightText(skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count)) : resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count)) : '',
    ].filter(Boolean);

    return leadSentence('Scene: The portrait takes place in', sceneParts);
  };
  const buildCameraText = () => {
    if (fixedCompositionSetActive) {
      return leadSentence('The camera treatment uses', [
        context.aperture && !isNoneLikeItem(context.aperture) ? context.aperture.en : '',
        context.shutter && !isNoneLikeItem(context.shutter) ? context.shutter.en : '',
      ]);
    }

    return leadSentence('The camera treatment uses', [
      context.lens && !isNoneLikeItem(context.lens) ? compactZImageLensText(context.lens.en) : '',
      context.aperture && !isNoneLikeItem(context.aperture) ? compactZImageCameraControlText(context.aperture.en) : '',
      context.shutter && !isNoneLikeItem(context.shutter) ? compactZImageCameraControlText(context.shutter.en) : '',
      opticalEffect && !isNoneLikeItem(opticalEffect) ? compactZImageOpticalEffectText(skeletonMode ? sanitizeSkeletonPromptText(opticalEffect.en) : opticalEffect.en) : '',
    ]);
  };
  const buildPhotographyStyleText = () => joinSentenceParts([
    context.style && !isNoneLikeItem(context.style) ? compactZImagePhotographyStyleText(skeletonMode ? sanitizeSkeletonPromptText(buildPhotographyStylePrompt(context.style)) : context.style) : '',
  ]);
  const buildRenderingText = () => joinSentenceParts([
    film && !isNoneLikeItem(film) ? compactZImageFilmText(skeletonMode ? sanitizeSkeletonPromptText(film.en) : film.en) : '',
  ]);
  const imageTypeLine = buildImageTypePromptLine(context);
  const compositionLine = buildCompositionPromptLine(context);
  const buildZImageDuoSection = (title, value) => {
    const cleaned = ensureTerminalPeriod(stripMarkdown(value || '').replace(/\s+/g, ' ').trim());
    return cleaned ? `${title}:\n${cleaned}` : '';
  };
  const buildZImageDuoSubjectText = () => 'Two stunning seductive 20-year-old Japanese or Korean women';
  const buildZImageDuoRoleWardrobeText = (role) => {
    const roleTexts = buildGptDuoFullWardrobeRoleTexts(wardrobeSlots, wardrobeColors, context);
    const wardrobeText = role === 'a' ? roleTexts.woman1 : roleTexts.woman2;
    const roleNumber = role === 'a' ? '1' : '2';
    const accessoryText = cleanGptDuoRoleSubjectPart(buildRoleSubjectAccessoryPrompt(wardrobeSlots, role), roleNumber)
      .replace(/^with\s+/i, '');
    const parts = [compactZImageSourceText(wardrobeText), compactZImageSourceText(accessoryText)].filter(Boolean);
    return parts.length > 0 ? `Wears ${parts.join(', ')}` : '';
  };
  const buildZImageDuoPoseText = () => joinSentenceParts([
    characterSlots.duoPose && !isNoneLikeItem(characterSlots.duoPose) ? compactZImageSourceText(characterSlots.duoPose.en) : '',
    characterSlots.duoPoseBase && !isNoneLikeItem(characterSlots.duoPoseBase)
      ? `body posture base: ${compactZImageSourceText(characterSlots.duoPoseBase.en)}`
      : '',
  ]);
  const buildZImageDuoSceneText = () => joinSentenceParts([
    skeletonMode ? sanitizeSkeletonPromptText(importedWorldSceneArchitectureText) : compactZImageLocationText(importedWorldSceneArchitectureText),
    projectedScene.locationText
      ? (skeletonMode ? sanitizeSkeletonPromptText(projectedScene.locationText) : compactZImageLocationText(projectedScene.locationText))
      : '',
    skeletonMode ? sanitizeSkeletonPromptText(sceneAccentText) : compactZImageSourceText(sceneAccentText),
  ]);
  const buildZImageDuoLightingText = () => joinSentenceParts([
    context.lighting && !isNoneLikeItem(context.lighting) ? compactZImageAmbientLightText(skeletonMode ? sanitizeSkeletonPromptText(context.lighting.en) : context.lighting.en) : '',
    lightDirection && !isNoneLikeItem(lightDirection)
      ? compactZImageSubjectLightText(skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count)) : resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count))
      : '',
  ]);
  const buildZImageDuoCameraLookText = () => joinSentenceParts([
    context.style && !isNoneLikeItem(context.style) ? compactZImagePhotographyStyleText(skeletonMode ? sanitizeSkeletonPromptText(buildPhotographyStylePrompt(context.style)) : context.style) : '',
    context.lens && !isNoneLikeItem(context.lens) ? compactZImageLensText(context.lens.en) : '',
    context.aperture && !isNoneLikeItem(context.aperture) ? compactZImageCameraControlText(context.aperture.en) : '',
    context.shutter && !isNoneLikeItem(context.shutter) ? compactZImageCameraControlText(context.shutter.en) : '',
    opticalEffect && !isNoneLikeItem(opticalEffect) ? compactZImageOpticalEffectText(skeletonMode ? sanitizeSkeletonPromptText(opticalEffect.en) : opticalEffect.en) : '',
    film && !isNoneLikeItem(film) ? compactZImageFilmText(skeletonMode ? sanitizeSkeletonPromptText(film.en) : film.en) : '',
  ]);
  const joinZImageParagraphs = (parts) => parts
    .map((value) => {
      const cleaned = stripMarkdown(value || '').replace(/\s+/g, ' ').trim();
      return cleaned === compositionLine ? cleaned : ensureTerminalPeriod(cleaned);
    })
    .filter(Boolean)
    .join('\n\n');

  if (context.subject.count === 2 && !specialSubjectMode) {
    return [
      buildZImageDuoSection('Image Type', imageTypeLine || buildZImageTypeText(context)),
      compositionLine,
      buildZImageDuoSection('Subject', buildZImageDuoSubjectText()),
      buildZImageDuoSection('Woman 1', buildZImageDuoRoleWardrobeText('a')),
      buildZImageDuoSection('Woman 2', buildZImageDuoRoleWardrobeText('b')),
      buildZImageDuoSection('Shared Expression', buildGptDuoSharedExpressionText(characterSlots)),
      buildZImageDuoSection('Pose and Composition', buildZImageDuoPoseText()),
      buildZImageDuoSection('Scene', buildZImageDuoSceneText()),
      buildZImageDuoSection('Lighting', buildZImageDuoLightingText()),
      buildZImageDuoSection('Camera Look', buildZImageDuoCameraLookText()),
    ].filter(Boolean).join('\n\n');
  }

  if (fixedCompositionSetActive) {
    return joinZImageParagraphs([
      imageTypeLine,
      compositionLine,
      ...buildFixedSceneParagraphs(),
      buildCharacterText(),
      buildWardrobeText(),
      buildSinglePoseText(),
      buildPhotographyStyleText(),
      buildRenderingText(),
    ]);
  }

  return joinZImageParagraphs([
    imageTypeLine,
    compositionLine,
    buildCharacterText(),
    buildWardrobeText(),
    buildSinglePoseText(),
    buildSceneText(),
    buildPhotographyStyleText(),
    buildCameraText(),
    buildRenderingText(),
  ]);
}

function cleanAiMinimalFragment(value) {
  return stripMarkdown(value || '')
    .replace(/\s+/g, ' ')
    .replace(/^The portrait takes place\s+(?:in|inside)\s+/i, '')
    .replace(/^Treat the fixed set as the primary composition:\s*/i, '')
    .replace(/^She is\s+/i, '')
    .replace(/^world-scene architecture for the portrait:\s*/i, '')
    .replace(/^complete outfit:\s*/i, '')
    .replace(/Inspired by [^.]+,\s*/gi, '')
    .replace(/\b(?:dominant|main|secondary|contrast)\s+[^,.]*?\s+controlled by\s+[^,.]+/gi, '')
    .replace(/\bcolor controlled by\s+[^,.]+/gi, '')
    .replace(/\bpreserve selected wardrobe identity through\s+[^,.]+/gi, '')
    .replace(/\bcoordinated\s+[^,.]*?\s+styling\b/gi, '')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/\s+\./g, '.')
    .replace(/,\s*\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/,\s*$/g, '');
}

function compactAiMinimalFragment(value, limit = 4) {
  return cleanAiMinimalFragment(value)
    .replace(/[.!?]+$/g, '')
    .split(/\s*,\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, limit)
    .join(', ');
}

function buildAiSingleBodyTypeAnchorText(valuesByLabel, context) {
  if (!shouldUseFixedAiSingleSubjectLead(context)) return '';
  const bodyTypeText = cleanAiMinimalFragment(firstStructuredValue(valuesByLabel, ['Body Type']));
  if (!bodyTypeText || /^none$/i.test(bodyTypeText)) return '';

  const rule = SINGLE_BODY_TYPE_ANCHOR_RULES.find((entry) => {
    return new RegExp(entry.pattern.source, 'i').test(bodyTypeText);
  });

  return rule ? rule.aiText : ensureTerminalPeriod(compactAiMinimalFragment(bodyTypeText, 4));
}

function buildAiSingleHairAnchorText(valuesByLabel, context) {
  if (!shouldUseFixedAiSingleSubjectLead(context)) return '';
  const hairstyleText = firstStructuredValue(valuesByLabel, ['Hairstyle']);
  const hairColorText = firstStructuredValue(valuesByLabel, ['Hair Color']);
  const combinedHairText = [hairstyleText, hairColorText]
    .filter((value) => value && !/^none$/i.test(value.trim()))
    .map((value) => stripTerminalPromptPunctuation(value))
    .join(', ');

  if (!combinedHairText) return '';
  const compactHairText = compactAiMinimalFragment(
    compressZImageSingleSubjectText(combinedHairText, context),
    3
  );
  return compactHairText ? ensureTerminalPeriod(compactHairText) : '';
}

function splitAiMinimalFragments(value) {
  return cleanAiMinimalFragment(value)
    .replace(/\.\s+/g, ', ')
    .split(/\s*,\s*/)
    .map((part) => part.trim().replace(/[.!?]+$/g, '').trim())
    .filter(Boolean);
}

function removeAiModelNaturalPoseDirectives(value) {
  return stripMarkdown(value || '')
    .replace(/\bLet the image model choose a clearly varied non-default physically believable body arrangement within the selected pose base with distinct weight shift limb angles torso orientation and asymmetry compatible with the wardrobe camera framing and environment\.?/gi, '')
    .replace(/\bLet the image model choose natural varied hand placement fitted to the selected body pose support contact wardrobe and camera crop without defaulting to stiff arms at the sides\.?/gi, '')
    .replace(/\bLet the image model choose a natural head angle and orientation compatible with the camera angle body orientation and selected pose\.?/gi, '')
    .replace(/\s+\./g, '.')
    .replace(/\.\s*\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitAiWardrobeFragments(value) {
  return splitAiMinimalFragments(value);
}

function withAiArticle(phrase) {
  const cleaned = cleanAiMinimalFragment(phrase);
  if (!cleaned || /^(?:a|an|the)\s+/i.test(cleaned)) return cleaned;
  return /^[aeiou]/i.test(cleaned) ? `an ${cleaned}` : `a ${cleaned}`;
}

function buildAiMappedWardrobePhrase(value) {
  const text = cleanAiMinimalFragment(value);
  if (!text) return '';

  if (/spaghetti-strap lace cotton mini dress/i.test(text)) {
    const color = text.match(/(?:^|,\s*)([a-z][a-z -]*?)\s+spaghetti-strap lace cotton mini dress\b/i)?.[1] || '';
    return withAiArticle(`${color} spaghetti-strap lace cotton mini dress`.trim());
  }

  if (/button-up shirt outfit/i.test(text) && /hot pants/i.test(text)) {
    const sleeve = /long-sleeve/i.test(text) ? 'long-sleeve' : 'short-sleeve';
    return withAiArticle(`tight ${sleeve} button-up shirt and hot pants`);
  }

  if (/button-up shirt outfit/i.test(text) && /bodycon mini skirt/i.test(text)) {
    const sleeve = /long-sleeve/i.test(text) ? 'long-sleeve' : 'short-sleeve';
    return withAiArticle(`tight ${sleeve} button-up shirt and bodycon mini skirt`);
  }

  if (/cheongsam/i.test(text)) {
    return withAiArticle([
      /embroidered|embroidery/i.test(text) ? 'embroidered' : '',
      /satin/i.test(text) ? 'satin' : '',
      /sleeveless/i.test(text) ? 'sleeveless' : '',
      'cheongsam',
      /mini/i.test(text) ? 'mini' : '',
      'outfit',
    ].filter(Boolean).join(' '));
  }

  const patterns = [
    [/BDSM|bondage|leather harness/i, 'a BDSM-inspired leather harness outfit'],
    [/nurse uniform/i, 'a nurse uniform'],
    [/flight attendant uniform/i, 'a flight attendant uniform'],
    [/doctor|medical coat|diagnosis coat/i, 'a doctor coat outfit'],
    [/secretary/i, 'a secretary skirt suit'],
    [/tailored suit|suit set|blazer.*trousers|suit trousers/i, 'a tailored suit set'],
    [/maid-inspired ruffled bikini/i, 'a maid-inspired ruffled bikini outfit'],
    [/\bmaid\b/i, 'a maid outfit'],
    [/bunny/i, 'a bunny suit'],
    [/triangle bikini|bikini swimwear|swimwear set|monokini swimsuit/i, 'bikini swimwear'],
    [/Victorian|baroque/i, 'a Victorian baroque outfit'],
    [/lolita/i, 'a lolita dress'],
    [/qipao/i, /embroidered/i.test(text) ? 'an embroidered qipao dress' : 'a qipao dress'],
    [/kimono/i, 'a kimono outfit'],
    [/yukata/i, 'a lightweight yukata'],
    [/glossy latex.*mini dress|latex mini dress|latex.*mini dress/i, 'a glossy latex mini dress'],
    [/satin.*mini dress|spaghetti-strap satin|satin slip/i, 'a satin slip mini dress'],
    [/cut-out monokini|monokini/i, 'a cut-out monokini swimsuit'],
    [/mini dress/i, 'a mini dress'],
    [/maxi dress|long dress/i, 'a long dress'],
    [/schoolgirl|sailor uniform/i, 'a schoolgirl sailor uniform'],
    [/lingerie/i, 'a lingerie outfit'],
  ];

  return patterns.find(([pattern]) => pattern.test(text))?.[1] || '';
}

function buildAiFallbackWearablePhrase(value) {
  const fallback = compactAiMinimalFragment(value, 1);
  return fallback ? withAiArticle(fallback) : '';
}

function cleanAiDressFirstPhrase(value) {
  return cleanAiMinimalFragment(value)
    .replace(/\bone-piece\s+(?=(?:bodycon|short|long|mini|maxi|fitted|flowing|tailored|dress|gown|swimsuit|monokini)\b)/gi, '')
    .replace(/\bshort mini\b/gi, 'mini')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildAiDressPhrase(value) {
  const firstDressFragment = splitAiWardrobeFragments(value)
    .map((part) => cleanAiDressFirstPhrase(part))
    .find((part) => part && getAiGarmentRole(part) === 'dress');

  return firstDressFragment || '';
}

function isAiAccessoryFragment(fragment) {
  return /\b(?:bag|clutch|tote|sunglasses|glasses|eyeglasses|earrings?|necklace|bracelets?|rings?|choker|watch|headscarf|bandana|cap|hat|beret|hair clip|tattoo|earphones?|headphones?|pendant|wallet chain|shoulder strap|belt)\b/i.test(fragment);
}

function isAiClothingCoreFragment(fragment) {
  return /\b(?:top|shirt|tee|t-shirt|camisole|blouse|jacket|coat|cardigan|dress|skirt|shorts|pants|sweatpants|jeans|trousers|leggings|panties|bottoms|boots|shoes|sandals|loafers|sneakers|socks|tights|stockings|pantyhose|leg warmers|bikini|swimsuit|corset|bra|harness|bodysuit|hood|hoodie|sweater|vest|blazer|uniform|yukata|qipao|cheongsam|kimono|cape|cloak|gown)\b/i.test(fragment);
}

function getAiGarmentRole(fragment) {
  if (/\b(?:jacket|coat|cardigan|blazer|cape|cloak)\b/i.test(fragment)) return 'outerwear';
  if (/\b(?:dress|gown|yukata|qipao|cheongsam|kimono|swimsuit|monokini|bodysuit)\b/i.test(fragment)) return 'dress';
  if (/\b(?:shorts|hot pants|pants|sweatpants|jeans|trousers|skirt|leggings|panties|bottoms)\b/i.test(fragment)) return 'bottom';
  if (/\b(?:socks|tights|stockings|leg warmers|pantyhose)\b/i.test(fragment)) return 'legwear';
  if (/\b(?:boots|shoes|sandals|loafers|sneakers|heels|pumps|mary jane)\b/i.test(fragment)) return 'shoes';
  if (/\b(?:top|shirt|tee|t-shirt|camisole|blouse|bikini|corset|bra|harness|hoodie|sweater|vest|jersey|uniform)\b/i.test(fragment)) return 'top';
  return '';
}

function isAiGarmentControlFragment(fragment) {
  return /^(?:top hem|top length|top worn|outerwear worn|front panels|low-rise waistband|high-rise waistband|tight body-skimming|fitted lower-body|loose lower-body|legwear stays|long bottom)\b/i.test(fragment);
}

function selectAiDistinctGarmentFragments(value, limit = 3) {
  const picked = [];
  const pickedRoles = new Set();

  for (const fragment of splitAiWardrobeFragments(value)) {
    if (!isAiClothingCoreFragment(fragment) || isAiAccessoryFragment(fragment) || isAiGarmentControlFragment(fragment)) continue;
    const role = getAiGarmentRole(fragment);
    if (!role || pickedRoles.has(role)) continue;
    picked.push(fragment);
    pickedRoles.add(role);
    if (picked.length >= limit) break;
  }

  return picked;
}

function buildAiCompleteLookGarmentPhrase(value) {
  const fragments = selectAiDistinctGarmentFragments(value, 4);
  return fragments.length > 0 ? withAiArticle(joinNaturalList(fragments)) : '';
}

function buildAiSpecialOutfitPhrase(value) {
  const fragments = splitAiWardrobeFragments(value);
  if (fragments.length === 0) return '';

  const styleFragment = fragments.find((part) => /\b(?:look|styling|outfit)\b/i.test(part) && !isAiClothingCoreFragment(part)) || fragments[0];
  const stylePhrase = withAiArticle(
    styleFragment
      .replace(/\b(?:look|styling)\b/gi, 'outfit')
      .replace(/\boutfit outfit\b/gi, 'outfit')
  );
  const clothingFragments = fragments
    .filter((part) => part !== styleFragment)
    .filter((part) => isAiClothingCoreFragment(part) && !isAiAccessoryFragment(part))
    .slice(0, 4);

  if (clothingFragments.length === 0) return stylePhrase;
  return `${stylePhrase} with ${joinNaturalList(clothingFragments)}`;
}

function buildAiSeparateStylePhrase(value) {
  const text = cleanAiMinimalFragment(value);
  if (!text) return '';
  const coreFragments = selectAiDistinctGarmentFragments(value, 3);
  const withCoreGarments = (stylePhrase) => (
    coreFragments.length > 0 ? `${stylePhrase} with ${joinNaturalList(coreFragments)}` : stylePhrase
  );

  if (/bikini|swimwear/i.test(text) && /denim shorts|denim micro shorts|denim mini skirt|denim skirt/i.test(text)) {
    return 'a summer bikini-and-denim look';
  }
  if (/triangle bikini top/i.test(text) && /side-tie bikini bottoms/i.test(text)) {
    const topColor = text.match(/(?:^|,\s*)([a-z][a-z -]*?)\s+triangle bikini top\b/i)?.[1] || '';
    const bottomColor = text.match(/(?:^|,\s*)([a-z][a-z -]*?)\s+low-rise side-tie bikini bottoms\b/i)?.[1] || '';
    const topPhrase = `${topColor} triangle bikini top`.trim();
    const bottomPhrase = `${bottomColor ? `low-rise ${bottomColor} ` : 'low-rise '}side-tie bikini bottoms`;
    return `${withAiArticle(topPhrase)} and ${bottomPhrase}`;
  }
  if (/punk|tartan|graffiti|leather jacket|fishnet|stud/i.test(text)) return withCoreGarments('a punk streetwear look');
  if (/gothic|corset|black sheer/i.test(text) || (/lace/i.test(text) && /\b(?:street|punk|jacket|boots|fishnet|slouchy)\b/i.test(text))) return withCoreGarments('a gothic lace street look');
  if (/jersey|sport|athletic|track jacket|sneakers|running/i.test(text)) return withCoreGarments('a sporty athleisure look');
  if (/blazer|suit|button-down shirt|blouse/i.test(text) && /trousers|pants|skirt/i.test(text)) return withCoreGarments('office casual separates');
  if (/denim|jeans/i.test(text) && /camisole|tank top|cropped|tee|t-shirt/i.test(text)) return withCoreGarments('a Y2K denim casual look');

  return coreFragments.length > 0 ? joinNaturalList(coreFragments) : '';
}

function buildAiCharacterProfileWardrobePhrase(subject, locks = {}) {
  if (!isCharacterProfileSubject(subject)) return '';
  if (shouldImportCharacterCardWardrobeLayers(locks)) return '';

  const text = cleanAiMinimalFragment(subject?.en || '');
  const signatureMatch = text.match(/\bsignature outfit locked as\s+(.+?)(?:,\s*contemporary street-fashion photographic realism|$)/i);
  const signatureText = signatureMatch?.[1] || '';
  const fragments = splitAiWardrobeFragments(signatureText)
    .filter((part) => isAiClothingCoreFragment(part) || /shoulder bag|bare feet|barefoot/i.test(part))
    .slice(0, 5);

  return fragments.length > 0 ? `wearing ${joinNaturalList(fragments)}` : '';
}

const AI_CHARACTER_CARD_SELECTED_WARDROBE_LABELS = [
  'Outerwear',
  'Dress',
  'Top',
  'Pants',
  'Skirt',
  'Legwear',
  'Shoes',
  'Head Accessory',
];

const AI_CHARACTER_CARD_DIRECT_ACCESSORY_LAYERS = new Set([
  'wristAccessory',
  'ring',
  'waistAccessory',
]);

function uniqueAiWardrobeValues(values) {
  const seen = new Set();
  return values
    .map((value) => cleanAiMinimalFragment(value))
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function getAiCharacterCardDirectAccessoryValues(wardrobe) {
  if (!Array.isArray(wardrobe)) return [];
  return wardrobe
    .filter((item) => AI_CHARACTER_CARD_DIRECT_ACCESSORY_LAYERS.has(item?.meta?.characterCardLayer))
    .map((item) => buildAccessoryPrompt(item));
}

function firstStructuredValue(valuesByLabel, labels) {
  return getStructuredValues(valuesByLabel, labels)[0] || '';
}

function shouldUseFixedNormalSingleSubjectLead(context) {
  return context.subject?.count === 1
    && !isSpecialSubject(context.subject)
    && !isCharacterProfileSubject(context.subject)
    && !context.subject?.reference;
}

function shouldUseFixedAiSingleSubjectLead(context) {
  return shouldUseFixedNormalSingleSubjectLead(context);
}

function buildAiSingleSubjectLead(context) {
  return shouldUseFixedAiSingleSubjectLead(context) ? FIXED_SINGLE_NORMAL_SUBJECT_SENTENCE : '';
}

function compactAiEyewearAccessoryText(eyewear, color = null, placement = null) {
  const frameText = cleanAiMinimalFragment(buildAccessoryPrompt(eyewear))
    .replace(/\bbold thick-frame glasses\b/gi, 'bold-frame glasses');
  if (!frameText || /^no eyewear\b/i.test(frameText)) return '';

  const colorText = cleanAiMinimalFragment(buildAccessoryPrompt(color))
    .replace(/^no specified eyewear frame color$/i, '')
    .replace(/\s+frame$/i, '')
    .trim();
  const placementText = /resting on top of the head/i.test(buildAccessoryPrompt(placement))
    ? 'resting on top of the head'
    : '';

  return [colorText, frameText, placementText].filter(Boolean).join(' ');
}

function compactAiHeadAudioAccessoryText(headAccessory) {
  const text = cleanAiMinimalFragment(buildAccessoryPrompt(headAccessory));
  if (!/\b(?:headphones?|earphones?)\b/i.test(text)) return '';
  return text.split(/\s*,\s*/)[0] || '';
}

function buildAiSingleSubjectAccessoryParts(context, wardrobe) {
  if (!shouldUseFixedAiSingleSubjectLead(context) || !Array.isArray(wardrobe)) {
    return { eyewearText: '', headAudioText: '' };
  }

  const wardrobeSlots = extractWardrobeSlots(wardrobe);

  return {
    eyewearText: compactAiEyewearAccessoryText(
      wardrobeSlots.eyewear,
      wardrobeSlots.eyewearColor,
      wardrobeSlots.eyewearPlacement
    ),
    headAudioText: compactAiHeadAudioAccessoryText(wardrobeSlots.headAccessory),
  };
}

function buildAiSingleSubjectPromptText({
  imageTypeLead = '',
  subjectPart,
  eyewearText,
  headAudioText,
  wardrobePart,
  posePart,
  scenePart,
  lightingPart,
  moodTail,
}) {
  const subjectOpening = imageTypeLead
    ? `${capitalizePromptLead(imageTypeLead)} of ${subjectPart.replace(/^A\b/, 'a')}`
    : subjectPart;
  const openingText = [
    subjectOpening,
    eyewearText ? `with ${eyewearText}.` : '',
  ].filter(Boolean).join(' ');
  const wardrobeLead = headAudioText
    ? wardrobePart
      ? `${headAudioText}, ${wardrobePart}`
      : headAudioText
    : wardrobePart;
  const bodyText = [wardrobeLead, posePart, scenePart, lightingPart].filter(Boolean).join(', ');
  const coreText = [openingText, bodyText].filter(Boolean).join(bodyText ? ' ' : '');
  const fullText = moodTail ? `${coreText}${bodyText ? ', ' : ' '}${moodTail}` : coreText;

  return ensureTerminalPeriod(fullText);
}

function buildAiMinimalSubjectLead(valuesByLabel, context, wardrobe = null) {
  const subjectText = firstStructuredValue(valuesByLabel, ['Subject Count', 'Reference Guidance']);
  if (isCharacterProfileSubject(context.subject)) {
    const wardrobeSlots = wardrobe ? extractWardrobeSlots(wardrobe) : null;
    const profileGroups = buildCharacterCardProfileGroups(context.subject, context.locks, wardrobe);
    const variantText = buildCharacterCardHairVariantText(context.subject, context.locks);
    const subjectAccessoryText = wardrobeSlots
      ? buildSubjectAccessoryPrompt({
          eyewear: wardrobeSlots.eyewear,
          eyewearColor: wardrobeSlots.eyewearColor,
          eyewearPlacement: wardrobeSlots.eyewearPlacement,
          earrings: wardrobeSlots.earrings,
          neckAccessory: wardrobeSlots.neckAccessory,
        })
      : '';
    const baseText = compactAiMinimalFragment(
      subjectText || profileGroups.identityAndBody || buildCharacterCardSubjectPrompt(context.subject, context.locks, context, wardrobe),
      5
    );
    const distinctiveFeatureText = compactAiMinimalFragment(profileGroups.distinctiveFeatures, 4);
    const baseHairText = compactAiMinimalFragment(profileGroups.hair, 3);
    const parts = [
      baseText,
      distinctiveFeatureText,
      baseHairText,
      variantText,
      subjectAccessoryText,
    ].filter(Boolean);
    return parts.length > 0 ? `A moody film still of ${parts.join(', ')}` : 'A moody film still';
  }

  if (isSpecialSubject(context.subject)) {
    const cleaned = compactAiMinimalFragment(subjectText || context.subject?.en, 3);
    return cleaned ? `A moody film still of ${cleaned}` : 'A moody film still';
  }

  if (context.subject?.reference) {
    return 'A seductive stunning woman matching the attached reference person';
  }

  const singleSubjectLead = buildAiSingleSubjectLead(context);
  if (singleSubjectLead) {
    return [
      singleSubjectLead,
      buildAiSingleBodyTypeAnchorText(valuesByLabel, context),
      buildAiSingleHairAnchorText(valuesByLabel, context),
    ]
      .filter(Boolean)
      .join(' ');
  }

  return context.subject?.count === 2
    ? 'Two seductive stunning 20-year-old Japanese or Korean women'
    : 'A seductive stunning 20-year-old Japanese or Korean woman';
}

function buildAiMinimalWardrobeClause(valuesByLabel, context, wardrobe = null) {
  const characterProfileWardrobe = buildAiCharacterProfileWardrobePhrase(context.subject, context.locks);
  if (characterProfileWardrobe) return characterProfileWardrobe;

  if (isCharacterProfileSubject(context.subject) && shouldImportCharacterCardWardrobeLayers(context.locks)) {
    const wardrobeText = uniqueAiWardrobeValues([
      ...getStructuredValues(valuesByLabel, AI_CHARACTER_CARD_SELECTED_WARDROBE_LABELS),
      ...getAiCharacterCardDirectAccessoryValues(wardrobe),
    ]).join(', ');
    return wardrobeText ? `wearing ${wardrobeText}` : '';
  }

  const roleSpecialA = firstStructuredValue(valuesByLabel, ['Woman 1 Special Outfit']);
  const roleSpecialB = firstStructuredValue(valuesByLabel, ['Woman 2 Special Outfit']);
  const rolePresetA = firstStructuredValue(valuesByLabel, ['Woman 1 Outfit Preset']);
  const rolePresetB = firstStructuredValue(valuesByLabel, ['Woman 2 Outfit Preset']);
  const roleAPhrase = buildAiSpecialOutfitPhrase(roleSpecialA) || buildAiMappedWardrobePhrase(rolePresetA) || compactAiMinimalFragment(rolePresetA, 2);
  const roleBPhrase = buildAiSpecialOutfitPhrase(roleSpecialB) || buildAiMappedWardrobePhrase(rolePresetB) || compactAiMinimalFragment(rolePresetB, 2);

  if (roleAPhrase || roleBPhrase) {
    const duoParts = [
      roleAPhrase ? `one wearing ${roleAPhrase}` : '',
      roleBPhrase ? `the other wearing ${roleBPhrase}` : '',
    ].filter(Boolean);
    return `with ${duoParts.join(' and ')}`;
  }

  const duoSceneAnchor = firstStructuredValue(valuesByLabel, ['Duo Scene Anchor']);
  if (duoSceneAnchor) {
    const sceneAnchor = compactAiMinimalFragment(firstStructuredValue(valuesByLabel, ['Location']), 1);
    const woman1Token = 'woman 1 wears ';
    const woman2Token = 'woman 2 wears ';
    const woman1Start = duoSceneAnchor.toLowerCase().indexOf(woman1Token);
    const woman2Start = duoSceneAnchor.toLowerCase().indexOf(woman2Token);
    const roleAWear = woman1Start !== -1 && woman2Start !== -1
      ? duoSceneAnchor.slice(woman1Start + woman1Token.length, woman2Start).replace(/,\s*$/g, '')
      : '';
    let roleBWear = woman2Start !== -1
      ? duoSceneAnchor.slice(woman2Start + woman2Token.length)
      : '';
    if (roleBWear && sceneAnchor) {
      const sceneIndex = roleBWear.toLowerCase().indexOf(` in ${sceneAnchor.toLowerCase()}`);
      if (sceneIndex !== -1) roleBWear = roleBWear.slice(0, sceneIndex);
    }
    roleBWear = roleBWear.replace(/,\s*outfit-visible editorial duo composition.*$/i, '');
    const anchorRoleAPhrase = buildAiMappedWardrobePhrase(roleAWear) || buildAiSeparateStylePhrase(roleAWear) || compactAiMinimalFragment(roleAWear, 2);
    const anchorRoleBPhrase = buildAiMappedWardrobePhrase(roleBWear) || buildAiSeparateStylePhrase(roleBWear) || compactAiMinimalFragment(roleBWear, 2);
    const anchorParts = [
      anchorRoleAPhrase ? `one wearing ${anchorRoleAPhrase}` : '',
      anchorRoleBPhrase ? `the other wearing ${anchorRoleBPhrase}` : '',
    ].filter(Boolean);
    if (anchorParts.length > 0) return `with ${anchorParts.join(' and ')}`;
  }

  const specialOutfitPhrase = buildAiSpecialOutfitPhrase(firstStructuredValue(valuesByLabel, ['Special Outfit']));
  if (specialOutfitPhrase) return `wearing ${specialOutfitPhrase}`;

  const outfitPresetValue = firstStructuredValue(valuesByLabel, ['Outfit Preset']);
  const outfitPresetPhrase = buildAiMappedWardrobePhrase(outfitPresetValue)
    || buildAiCompleteLookGarmentPhrase(outfitPresetValue)
    || buildAiFallbackWearablePhrase(outfitPresetValue);
  if (outfitPresetPhrase) return `wearing ${outfitPresetPhrase}`;

  const dressValue = firstStructuredValue(valuesByLabel, ['Dress']);
  const dressPhrase = buildAiDressPhrase(dressValue) || buildAiMappedWardrobePhrase(dressValue) || buildAiFallbackWearablePhrase(dressValue);
  if (dressPhrase) return `wearing ${dressPhrase}`;

  const wardrobeValues = getStructuredValues(valuesByLabel, [
    'Outerwear',
    'Top',
    'Pants',
    'Skirt',
    'Legwear',
    'Shoes',
    'Duo Wardrobe',
  ]);
  const separateStylePhrase = buildAiSeparateStylePhrase(wardrobeValues.join(', '));
  if (separateStylePhrase) return `wearing ${separateStylePhrase}`;

  const wardrobePhrase = compactAiMinimalFragment(wardrobeValues.join(', '), context.subject?.count === 2 ? 6 : 5);

  return wardrobePhrase ? `wearing ${wardrobePhrase}` : '';
}

function buildAiMinimalPoseClause(valuesByLabel, context) {
  const faceCloseupPhrase = isFaceOnlyCloseupFramingItem(context?.framing)
    ? 'tight face close-up, face fills the frame'
    : '';
  const joinAiPoseParts = (...parts) => parts.filter(Boolean).join(', ');
  const actionPoseText = firstStructuredValue(valuesByLabel, ['Action Pose']);
  if (actionPoseText) {
    const cleanedActionPoseText = stripTerminalPromptPunctuation(actionPoseText);
    const actionPoseCard = getActiveActionPoseCard(context);
    const guardSourceText = [cleanedActionPoseText, actionPoseCard?.negativePoseGuard].filter(Boolean).join(', ');
    const guardText = [
      /not violent/i.test(guardSourceText) ? 'not violent' : '',
      /not martial arts/i.test(guardSourceText) ? 'not martial arts' : '',
      /not threatening/i.test(guardSourceText) ? 'not threatening' : '',
      /not a punch/i.test(guardSourceText) ? 'not a punch' : '',
      /not a dance stretch/i.test(guardSourceText) ? 'not a dance stretch' : '',
      /not a dance pose|not a dance move/i.test(guardSourceText) ? 'not a dance pose' : '',
      /not a yoga pose|not yoga/i.test(guardSourceText) ? 'not a yoga pose' : '',
      /not a high-leg flexibility display/i.test(guardSourceText) ? 'not a high-leg flexibility display' : '',
      /not glamour posing/i.test(guardSourceText) ? 'not glamour posing' : '',
      /not seductive floor pose/i.test(guardSourceText) ? 'not seductive floor pose' : '',
      /not symmetrical studio sitting pose/i.test(guardSourceText) ? 'not symmetrical studio sitting pose' : '',
      /do not make the cats aggressive or surreal/i.test(guardSourceText) ? 'do not make the cats aggressive or surreal' : '',
    ].filter(Boolean).join(', ');
    const coreAction = (cleanedActionPoseText.match(/[^.!?]+[.!?]?/g) || [cleanedActionPoseText])
      .map((sentence) => sentence.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(' ')
      .replace(/^She\s+is\s+/i, '')
      .replace(/^She\s+/i, '')
      .trim();
    return joinAiPoseParts(faceCloseupPhrase, guardText ? `${coreAction}, ${guardText}` : coreAction);
  }

  const rawPoseText = firstStructuredValue(valuesByLabel, [
    'Special Action',
    context.subject?.count === 2 ? 'Duo Layout' : 'Pose',
  ]);
  const poseText = removeAiModelNaturalPoseDirectives(rawPoseText);
  const posePhrase = compactAiMinimalFragment(poseText, context.subject?.count === 2 ? 3 : 8)
    .replace(/^two women\s+(?:in\s+)?/i, '')
    .replace(/^both women\s+(?:in\s+)?/i, '')
    .trim();
  const naturalSinglePosePhrase = context.subject?.count === 1
    ? posePhrase
      .replace(/^sitting with natural seated arrangement;\s*head naturally facing the camera$/i, 'sitting naturally and facing the camera')
      .replace(/^sitting with natural seated arrangement\b/i, 'sitting naturally')
      .replace(/;\s*head naturally facing the camera\b/i, ' and facing the camera')
      .replace(/^standing pose with\b/i, 'standing with')
      .trim()
    : posePhrase;

  if (!posePhrase) return faceCloseupPhrase || (context.subject?.count === 2 ? 'pose for a photoshoot' : 'poses for a photoshoot');
  if (context.subject?.count !== 2 && /^She is\b/i.test(stripMarkdown(poseText || '').trim())) {
    return joinAiPoseParts(faceCloseupPhrase, naturalSinglePosePhrase);
  }
  if (/^(standing|sitting|kneeling|squatting|lying|walking|holding|leaning|crouching|adjusting|looking|gazing)\b/i.test(naturalSinglePosePhrase)) {
    return joinAiPoseParts(faceCloseupPhrase, naturalSinglePosePhrase);
  }

  return joinAiPoseParts(faceCloseupPhrase, `posing with ${naturalSinglePosePhrase}`);
}

function buildAiMinimalSceneClause(valuesByLabel, context = {}) {
  if (isFixedCompositionSetActive(context.fixedCompositionSet)) {
    return buildAiFixedCompositionSceneClause(context);
  }

  const fixedSetValues = [
    compactAiMinimalFragment(firstStructuredValue(valuesByLabel, ['Fixed Composition Set']), 5),
    compactAiMinimalFragment(firstStructuredValue(valuesByLabel, ['Fixed Set Position']), 2),
    compactAiMinimalFragment(firstStructuredValue(valuesByLabel, ['Fixed Set Background State']), 2),
    compactAiMinimalFragment(firstStructuredValue(valuesByLabel, ['Fixed Set Capture Mode']), 3),
    compactAiMinimalFragment(firstStructuredValue(valuesByLabel, ['Fixed Set Performance State']), 2),
    compactAiMinimalFragment(firstStructuredValue(valuesByLabel, ['Fixed Set Integrity']), 3),
  ].filter(Boolean);
  const sceneText = fixedSetValues.length > 0
    ? fixedSetValues.join(', ')
    : firstStructuredValue(valuesByLabel, [
        'World Scene Architecture',
        'Location',
      ]);
  const sceneLimit = isSolidColorStudioLocation(context.location) ? 1 : 2;
  const scenePhrase = fixedSetValues.length > 0 ? sceneText : compactAiMinimalFragment(sceneText, sceneLimit);
  return scenePhrase ? `in ${scenePhrase}` : '';
}

function buildAiMinimalLightingClause(valuesByLabel) {
  const ambientText = firstStructuredValue(valuesByLabel, ['Ambient Light Conditions']);
  const subjectLightText = firstStructuredValue(valuesByLabel, ['Subject Light Style']);
  const lightingText = compactAiLightingText(ambientText, subjectLightText);
  return lightingText ? `under ${lightingText}` : '';
}

function buildAiMinimalMoodTail(valuesByLabel) {
  const styleText = getStructuredValues(valuesByLabel, ['Photography Style']).join(', ');
  const lensText = getStructuredValues(valuesByLabel, ['Lens']).join(', ');
  const apertureText = getStructuredValues(valuesByLabel, ['Aperture / Depth of Field']).join(', ');
  const shutterText = getStructuredValues(valuesByLabel, ['Shutter / Motion Blur']).join(', ');
  const imagingText = firstStructuredValue(valuesByLabel, ['Camera / Film']);
  const opticalText = getStructuredValues(valuesByLabel, ['Optical Effect']).join(', ');
  const cameraText = [styleText, lensText, apertureText, shutterText, imagingText, opticalText].filter(Boolean).join(', ');
  const artifactSourceText = [apertureText, shutterText, imagingText, opticalText].filter(Boolean).join(', ');
  const cleanedCameraText = cleanAiMinimalFragment(cameraText);
  const cleanedArtifactSourceText = cleanAiMinimalFragment(artifactSourceText);
  const cleanedApertureText = cleanAiMinimalFragment(apertureText);
  const cleanedShutterText = cleanAiMinimalFragment(shutterText);
  const artifacts = [];
  const addArtifact = (value) => {
    if (value && !artifacts.includes(value)) artifacts.push(value);
  };
  const details = [];
  const addDetail = (value) => {
    const cleaned = stripMarkdown(value || '').replace(/\s+/g, ' ').trim().replace(/[.!?]+$/g, '');
    if (!cleaned) return;
    const lowerCleaned = cleaned.toLowerCase();
    if (details.some((detail) => detail.toLowerCase() === lowerCleaned || detail.toLowerCase().includes(lowerCleaned))) return;
    details.push(cleaned);
  };

  if (/vhs|tape/i.test(cleanedArtifactSourceText)) {
    addArtifact('analog tape noise');
    addArtifact('scanlines');
    addArtifact('color bleeding');
    addArtifact('tracking glitches');
  }
  if (/grain/i.test(cleanedArtifactSourceText)) addArtifact(/heavy grain/i.test(cleanedArtifactSourceText) ? 'heavy film grain' : 'film grain');
  if (/noise/i.test(cleanedArtifactSourceText) && !/vhs|tape/i.test(cleanedArtifactSourceText)) addArtifact('visible image noise');
  if (/scratch/i.test(cleanedArtifactSourceText)) addArtifact('simulated scratches');
  if (/dust/i.test(cleanedArtifactSourceText)) addArtifact('dust specs');
  if (/light leak|film-gate leak|exposure burn/i.test(cleanedArtifactSourceText)) addArtifact('prominent light leaks');
  if (/vignette/i.test(cleanedArtifactSourceText)) addArtifact('corner vignetting');
  if (/chromatic aberration|color bleeding/i.test(cleanedArtifactSourceText)) addArtifact('color fringing');

  const moody = /moody|dark|nocturnal|melancholic|introspective|raw|diaristic|moriyama|nan goldin|araki|vhs|tape/i.test(cleanedCameraText);
  const filmLike = /film|analog|kodak|fujifilm|leica|polaroid|ccd|vhs|grain/i.test(cleanedCameraText);
  const base = moody
    ? 'captured as a moody film still'
    : filmLike
      ? 'captured in film photography style'
      : 'captured as an editorial film still';

  addDetail(compactAiStyleText(styleText));
  addDetail(compactAiLensText(lensText));
  addDetail(compactAiMinimalFragment(cleanedApertureText, 1));
  addDetail(compactAiMinimalFragment(cleanedShutterText, 1));
  addDetail(compactAiOpticalEffectText(opticalText));
  addDetail(compactAiFilmText(imagingText));
  artifacts.forEach(addDetail);
  if (details.length > 0) return `${base} with ${details.join(', ')}`;

  const moodDetail = compactAiMinimalFragment(cleanedCameraText, 2);
  return moodDetail ? `${base} with ${moodDetail}` : base;
}

function cleanAiDuoCompactText(value) {
  return cleanAiMinimalFragment(value)
    .replace(/\bcomplete outfit palette direction:\s*shift the complete outfit palette toward [^.]+?(?:multi-piece color variation|$)/gi, '')
    .replace(/\b(?:dominant|main|secondary|contrast|tonal)\s+[^,.]*?\s+controlled by\s+[^,.]+/gi, '')
    .replace(/\bcolor controlled by\s+[^,.]+/gi, '')
    .replace(/\bcoordinated but clearly distinct outfits\b/gi, '')
    .replace(/\bavoid identical garment colors\b/gi, '')
    .replace(/\bavoid matching top colors\b/gi, '')
    .replace(/\bkeep each woman styling visually separate\b/gi, '')
    .replace(/\b(?:neon|bright|deep|dark|light|pale|muted)?\s*(?:red|blue|green|yellow|orange|pink|purple|gold|silver|brown|grey|gray|black|white)\s+and\s+(?=(?:long white|navy|white|black|light blue|brown|burgundy|silver|gold|cream|ivory|beige|denim|dark grey|dark gray|light grey|light gray)\b)/gi, '')
    .replace(/\b(?:neon|bright|deep|dark|light|pale|muted)?\s*(?:red|blue|green|yellow|orange|pink|purple|gold|silver|brown|grey|gray|black|white)\s+(?=(?:long white|navy|white|black|light blue|brown|burgundy|silver|gold|cream|ivory|beige|denim|dark grey|dark gray|light grey|light gray)\b)/gi, '')
    .replace(/\b(?:red|blue|green|yellow|orange|pink|purple|gold|silver|brown|grey|gray|black|white)\s+and(?=(?:long white|navy|white|black|light blue|brown|burgundy|silver|gold|cream|ivory|beige|denim|dark grey|dark gray|light grey|light gray)\b)/gi, '')
    .replace(/\.\s*,/g, ',')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/^,\s*/, '')
    .replace(/,\s*$/g, '')
    .trim();
}

function splitAiDuoCompactFragments(value) {
  return cleanAiDuoCompactText(value)
    .replace(/\.\s+/g, ', ')
    .split(/\s*,\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^(?:preserving garment structure|accessory separation|material contrast|multi-piece color variation)$/i.test(part));
}

function buildAiDuoRoleWardrobeText(context, wardrobe, wardrobeColors, role) {
  const wardrobeSlots = wardrobe ? extractWardrobeSlots(wardrobe) : null;
  if (!wardrobeSlots || !wardrobeColors) return '';

  const roleTexts = buildGptDuoFullWardrobeRoleTexts(wardrobeSlots, wardrobeColors, context);
  const roleText = role === 'a' ? roleTexts.woman1 : roleTexts.woman2;
  const fragments = isCompleteWardrobeProjection(getCompositionVisibilityProjection(context))
    ? splitAiDuoCompactFragments(roleText).slice(0, 7)
    : splitAiDuoCompactFragments(buildAiCompleteLookCoreText(roleText, context));

  return fragments.length > 0 ? `Wears ${fragments.join(', ')}` : '';
}

function buildAiDuoPoseText(valuesByLabel) {
  const scenarioFragments = splitAiDuoCompactFragments(removeAiModelNaturalPoseDirectives(firstStructuredValue(valuesByLabel, ['Duo Layout'])))
    .filter((part) => !/^model-decided\b/i.test(part))
    .slice(0, 4);
  const postureFragment = splitAiDuoCompactFragments(firstStructuredValue(valuesByLabel, ['Duo Pose Base']))[0] || '';
  return [...scenarioFragments, postureFragment].filter(Boolean).join(', ');
}

function buildAiDuoSceneText(valuesByLabel) {
  return splitAiDuoCompactFragments(firstStructuredValue(valuesByLabel, [
    'World Scene Architecture',
    'Location',
  ])).slice(0, 5).join(', ');
}

function buildAiDuoLightingText(valuesByLabel) {
  const ambientText = getStructuredValues(valuesByLabel, ['Ambient Light Conditions']).join(', ');
  const subjectLightText = getStructuredValues(valuesByLabel, ['Subject Light Style']).join(', ');
  return [
    compactPromptClauses(ambientText, 2),
    compactPromptClauses(subjectLightText, 2),
  ].filter(Boolean).join(', ');
}

function buildAiDuoCameraLookText(valuesByLabel, context) {
  const styleText = context.style && !isNoneLikeItem(context.style)
    ? compactZImagePhotographyStyleText(context.style)
    : compactAiStyleText(getStructuredValues(valuesByLabel, ['Photography Style']).join(', '));
  const duoStyleText = styleText.replace(/^Inspired by [^,]+,\s*/i, '');
  const lensText = compactAiLensText(getStructuredValues(valuesByLabel, ['Lens']).join(', '));
  const apertureText = compactPromptClauses(getStructuredValues(valuesByLabel, ['Aperture / Depth of Field']).join(', '), 1);
  const shutterText = compactPromptClauses(getStructuredValues(valuesByLabel, ['Shutter / Motion Blur']).join(', '), 1);
  const opticalText = compactAiOpticalEffectText(getStructuredValues(valuesByLabel, ['Optical Effect']).join(', '));
  const filmText = compactAiFilmText(getStructuredValues(valuesByLabel, ['Camera / Film']).join(', '));

  return [duoStyleText, lensText, apertureText, shutterText, opticalText, filmText].filter(Boolean).join(', ');
}

function buildAiDuoSection(label, value) {
  const cleaned = ensureTerminalPeriod(cleanAiDuoCompactText(value));
  return cleaned ? `${label}: ${cleaned}` : '';
}

function renderAiDuoPrompt(valuesByLabel, context, wardrobe, wardrobeColors) {
  return [
    buildImageTypePromptLine(context),
    buildCompositionPromptLine(context),
    buildAiDuoSection('Woman 1', buildAiDuoRoleWardrobeText(context, wardrobe, wardrobeColors, 'a')),
    buildAiDuoSection('Woman 2', buildAiDuoRoleWardrobeText(context, wardrobe, wardrobeColors, 'b')),
    buildAiDuoSection('Pose', buildAiDuoPoseText(valuesByLabel)),
    buildAiDuoSection('Scene', buildAiDuoSceneText(valuesByLabel)),
    buildAiDuoSection('Lighting', buildAiDuoLightingText(valuesByLabel)),
    buildAiDuoSection('Camera Look', buildAiDuoCameraLookText(valuesByLabel, context)),
  ].filter(Boolean).join('\n\n');
}

function compactAiSourceText(value) {
  return compactZImageSourceText(value)
    .replace(/\bcomplete outfit:\s*/gi, '')
    .replace(/\bcomplete special outfit:\s*/gi, '')
    .replace(/\btop hem overlaps the low-rise waistband,\s*long untucked length covering the abdomen\b/gi, '')
    .replace(/\btop properly tucked into the low-rise waistband with a natural low-rise proportion,\s*clean waist styling,\s*not cropped\b/gi, '')
    .replace(/\brealistic outer-to-inner dressing order:[^.]*/gi, '')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/,\s*\./g, '.')
    .replace(/^\s*,\s*/g, '')
    .replace(/\s*,\s*$/g, '')
    .replace(/[.!?]+$/g, '')
    .trim();
}

function splitAiSourceFragments(value) {
  return splitGptSpecialOutfitFragments(value)
    .map((fragment) => compactAiSourceText(fragment))
    .filter(Boolean);
}

function isAiSpecialPersonFragment(fragment) {
  return isGptSpecialOutfitHairOrBodyFragment(fragment)
    && !classifyCompleteLookWardrobeFragment(fragment);
}

function extractAiSpecialPersonFragments(value) {
  const personFragments = [];
  for (const fragment of splitAiSourceFragments(value)) {
    if (/\btattoos?\b/i.test(fragment) && !classifyCompleteLookWardrobeFragment(fragment)) {
      personFragments.push(fragment);
      continue;
    }
    if (isAiSpecialPersonFragment(fragment)) {
      personFragments.push(fragment);
      continue;
    }
    const embeddedHair = fragment.match(/\b(?:long|short|medium(?:-to-long)?|chin-length|shoulder-length|voluminous|sleek|straight|wavy|curly|braided|half-up|high|low)?[^,.]*?\b(?:hair|waves?|bob|ponytail|pigtails?|bun|chignon|braids?)\b/i)?.[0];
    if (embeddedHair) personFragments.push(embeddedHair);
  }
  return personFragments;
}

function compactAiGarmentValue(value, preferredRole = '') {
  const fragments = splitAiSourceFragments(value);
  const roleFragments = fragments.filter((fragment) => classifyCompleteLookWardrobeFragment(fragment) === preferredRole);
  const primary = roleFragments.find((fragment) => /\b(?:shorts?|pants|skirts?|jeans|leggings|trousers|bottoms?|tops?|shirt|tee|camisole|jacket|coat|blazer|shoes?|boots?|heels?|pumps?|sandals?|sneakers?|loafers?)\b/i.test(fragment)
      && !/\b(?:waist|hem|fit|tucked|button|zipper|surface|pattern|texture|silhouette|line|cuffs?|sleeves?)\b/i.test(fragment))
    || roleFragments[0]
    || fragments.find((fragment) => classifyCompleteLookWardrobeFragment(fragment))
    || fragments[0]
    || '';
  const structuralDetail = fragments.find((fragment) => /\b(?:neckline|flare|pleated|ruffled|slit|hem|boning|lace trim|garter|cut-out|open shoulder|high-cut|wide-leg|straight-leg)\b/i.test(fragment) && fragment !== primary) || '';
  return [primary, structuralDetail].filter(Boolean).join(', ');
}

function buildAiCompleteLookCoreText(value, context = null) {
  let styleFragment = '';
  const roleFragments = new Map();
  const includeVisibleAccessoryRoles = !isCompleteWardrobeProjection(getCompositionVisibilityProjection(context));

  for (const fragment of splitAiSourceFragments(value)) {
    if (isAiSpecialPersonFragment(fragment)) continue;
    if (/\b(?:controlled by|color selection|palette direction|coordinated top-to-bottom palette|upper\/main garment|lower or secondary garment|preserving garment structure|accessory separation|material contrast|multi-piece color variation)\b/i.test(fragment)) continue;
    if (/\b(?:the\s+)?(?:\w+\s+)?(?:body|fabric|main color|primary color)\s+in\s+[a-z -]+$/i.test(fragment)) continue;

    const role = classifyCompleteLookWardrobeFragment(fragment);
    if (/\b(?:look|styling|outfit)\b/i.test(fragment) && !styleFragment) {
      styleFragment = fragment;
      continue;
    }
    if (role && !shouldKeepWardrobeRoleForContext(role, context, fragment)) continue;
    if (role) roleFragments.set(role, [...(roleFragments.get(role) || []), fragment]);
  }

  return [
    styleFragment,
    ...(roleFragments.get('top') || []),
    ...(roleFragments.get('dress') || []),
    ...(roleFragments.get('bottom') || []),
    ...(roleFragments.get('outerwear') || []),
    ...(roleFragments.get('legwear') || []),
    ...(roleFragments.get('shoes') || []),
    ...(roleFragments.get('bag') || []),
    ...(includeVisibleAccessoryRoles ? (roleFragments.get('headAccessory') || []) : []),
    ...(includeVisibleAccessoryRoles ? (roleFragments.get('eyewear') || []) : []),
    ...(includeVisibleAccessoryRoles ? (roleFragments.get('earrings') || []) : []),
    ...(includeVisibleAccessoryRoles ? (roleFragments.get('neckAccessory') || []) : []),
    ...(includeVisibleAccessoryRoles ? (roleFragments.get('wristAccessory') || []) : []),
    ...(includeVisibleAccessoryRoles ? (roleFragments.get('ring') || []) : []),
    ...(includeVisibleAccessoryRoles ? (roleFragments.get('waistAccessory') || []) : []),
  ].filter(Boolean).join(', ');
}

function buildAiCharacterCardAccessoryText(value, context) {
  const projection = getCompositionVisibilityProjection(context);
  return splitAiSourceFragments(value)
    .filter((fragment) => {
      const role = classifyCompleteLookWardrobeFragment(fragment);
      return role
        ? shouldProjectWardrobeRole(projection, role, fragment)
        : isCompleteWardrobeProjection(projection);
    })
    .join(', ');
}

function buildAiNormalWardrobeText(valuesByLabel, context) {
  const specialOutfit = firstStructuredValue(valuesByLabel, ['Special Outfit']);
  if (specialOutfit) return buildAiCompleteLookCoreText(specialOutfit, context);

  const outfitPreset = firstStructuredValue(valuesByLabel, ['Outfit Preset']);
  if (outfitPreset) return buildAiCompleteLookCoreText(outfitPreset, context);

  const dress = firstStructuredValue(valuesByLabel, ['Dress']);
  if (dress) return buildAiCompleteLookCoreText(dress, context);

  const roleByLabel = {
    Outerwear: 'outerwear',
    Top: 'top',
    Pants: 'bottom',
    Skirt: 'bottom',
    Legwear: 'legwear',
    Shoes: 'shoes',
  };
  return Object.entries(roleByLabel)
    .map(([label, role]) => {
      const value = firstStructuredValue(valuesByLabel, [label]);
      return shouldKeepWardrobeRoleForContext(role, context, value)
        ? compactAiGarmentValue(value, role)
        : '';
    })
    .filter(Boolean)
    .join(', ');
}

function buildAiCharacterCardIdentityText(context, wardrobe) {
  const groups = buildCharacterCardProfileGroups(context.subject, context.locks, wardrobe);
  const detailedIdentity = [
    groups.facialGeometry,
    groups.eyeSignature,
    groups.noseSignature,
    groups.mouthSignature,
    groups.skinSignature,
    groups.makeup,
    groups.body,
  ].filter(Boolean);
  const structuredIdentity = [
    ...detailedIdentity,
    groups.distinctiveFeatures,
  ].filter(Boolean);
  const identityText = structuredIdentity.length > 0
    ? structuredIdentity.join(', ')
    : groups.identityAndBody;
  const hairText = [groups.hair, buildCharacterCardHairVariantText(context.subject, context.locks)].filter(Boolean).join(', ');
  const eyewearText = splitAiSourceFragments(groups.accessories)
    .filter((fragment) => /\b(?:glasses|eyeglasses|sunglasses|headphones?|earphones?)\b/i.test(fragment))
    .join(', ');

  return [
    'A 20-year-old adult East Asian woman',
    compactAiSourceText(identityText),
    compactAiSourceText(hairText),
    eyewearText,
  ].filter(Boolean).join(', ');
}

function buildAiFreedomSubjectSentence(valuesByLabel, context, wardrobe) {
  if (isCharacterProfileSubject(context.subject)) {
    return ensureTerminalPeriod(buildAiCharacterCardIdentityText(context, wardrobe));
  }

  const wardrobeSlots = Array.isArray(wardrobe) ? extractWardrobeSlots(wardrobe) : null;
  const specialOutfitText = firstStructuredValue(valuesByLabel, ['Special Outfit']);
  const specialPersonText = specialOutfitText
    ? extractAiSpecialPersonFragments(specialOutfitText).join(', ')
    : '';
  const eyewearText = wardrobeSlots
    ? compactAiEyewearAccessoryText(wardrobeSlots.eyewear, wardrobeSlots.eyewearColor, wardrobeSlots.eyewearPlacement)
    : '';
  const headphoneText = wardrobeSlots ? compactAiHeadAudioAccessoryText(wardrobeSlots.headAccessory) : '';
  const subjectLead = shouldUseFixedAiSingleSubjectLead(context)
    ? FIXED_SINGLE_NORMAL_SUBJECT_SENTENCE
    : context.subject?.en || 'A 20-year-old adult East Asian woman';

  const bodyText = shouldUseFixedAiSingleSubjectLead(context)
    ? buildAiSingleBodyTypeAnchorText(valuesByLabel, context)
    : compactAiSourceText(firstStructuredValue(valuesByLabel, ['Body Type']));
  const hairText = shouldUseFixedAiSingleSubjectLead(context)
    ? buildAiSingleHairAnchorText(valuesByLabel, context)
    : compactAiSourceText([
        firstStructuredValue(valuesByLabel, ['Hairstyle']),
        firstStructuredValue(valuesByLabel, ['Hair Color']),
      ].filter(Boolean).join(', '));

  const subjectText = [
    stripTerminalPromptPunctuation(subjectLead),
    bodyText,
    hairText,
    specialPersonText,
    eyewearText,
    headphoneText,
  ].filter(Boolean).join(', ')
    .replace(/\.\s*,/g, ',')
    .replace(/,\s*\./g, '.')
    .replace(/\s*,\s*,+/g, ', ');
  return ensureTerminalPeriod(subjectText);
}

function buildAiFreedomWardrobeSentence(valuesByLabel, context, wardrobe) {
  const characterCardMode = isCharacterProfileSubject(context.subject);
  const characterCardGroups = characterCardMode
    ? buildCharacterCardProfileGroups(context.subject, context.locks, wardrobe)
    : null;
  const selectedCardFillers = characterCardMode && shouldImportCharacterCardWardrobeLayers(context.locks)
    ? buildAiNormalWardrobeText(valuesByLabel, context)
    : '';
  const characterCardAccessories = characterCardMode
    ? buildAiCharacterCardAccessoryText(
        splitAiSourceFragments(characterCardGroups.accessories)
          .filter((fragment) => !/\b(?:glasses|eyeglasses|sunglasses|headphones?|earphones?)\b/i.test(fragment))
          .join(', '),
        context
      )
    : '';
  const wardrobeParts = characterCardMode
    ? [
        characterCardGroups.outfit ? buildAiCompleteLookCoreText(characterCardGroups.outfit, context) : '',
        selectedCardFillers,
        characterCardAccessories,
      ]
    : [buildAiNormalWardrobeText(valuesByLabel, context)];
  const wardrobeText = uniqueAiWardrobeValues(wardrobeParts.join(', ').split(/,\s*/)).join(', ');
  return wardrobeText ? ensureTerminalPeriod(`Wearing ${compactAiSourceText(wardrobeText)}`) : '';
}

function buildAiFreedomPoseSentence(context, character) {
  if (context.subject?.count !== 1) return '';
  const characterSlots = extractCharacterSlots(character);
  const poseComposer = characterSlots.poseComposer;
  if (!poseComposer || isNoneLikeItem(poseComposer)) return '';
  return ensureTerminalPeriod(stripMarkdown(context.projectedCanonicalPoseText || '').replace(/\s+/g, ' ').trim());
}

function buildAiFreedomSceneSentence(valuesByLabel, context) {
  if (isFixedCompositionSetActive(context?.fixedCompositionSet)) {
    const fixedScene = AI_FIXED_SET_SCENE_PHRASES[context.fixedCompositionSet?.id] || '';
    return fixedScene ? ensureTerminalPeriod(`In ${compactAiSourceText(fixedScene)}`) : '';
  }

  const sceneSource = context.projectedScene?.worldSceneText
    || context.projectedScene?.locationText
    || firstStructuredValue(valuesByLabel, ['World Scene Architecture'])
    || firstStructuredValue(valuesByLabel, ['Location']);
  const clauses = splitAiSourceFragments(sceneSource);
  const conditionPattern = /\b(?:rain|snow|storm|fog|mist|wind|night|dusk|dawn|sunset|sunrise|daylight|overcast|cloudy|golden hour|post-rain|winter|summer|spring|autumn|late-afternoon|early-morning)\b/i;
  const selected = [];
  const maxClauses = 4;

  for (const clause of clauses) {
    if (selected.length < 3 || conditionPattern.test(clause)) selected.push(clause);
    if (selected.length >= maxClauses) break;
  }

  const sceneText = selected.join(', ')
    .replace(/\bThe portrait takes place (?:inside|within) a real-scale [^,]+? set\b/gi, '')
    .replace(/,?\s*not a flat backdrop and not a tight subject portrait/gi, '')
    .replace(/,?\s*not a generic beach scene/gi, '')
    .replace(/,?\s*Treat the fixed set as the primary composition:?/gi, '')
    .replace(/,?\s*the camera is positioned[^,]*(?:,|$)/gi, '')
    .replace(/,?\s*Scene priority:[^,]*/gi, '')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/,\s*\./g, '.')
    .trim();
  return sceneText ? ensureTerminalPeriod(`In ${sceneText}`) : '';
}

function buildAiFreedomImagingSentence(valuesByLabel) {
  const styleText = firstStructuredValue(valuesByLabel, ['Photography Style']);
  const style = styleText.match(/Inspired by [^.]+? image language/i)?.[0] || compactPromptClauses(styleText, 1);
  const parts = [
    style,
    compactPromptClauses(firstStructuredValue(valuesByLabel, ['Lens']), 2),
    compactPromptClauses(firstStructuredValue(valuesByLabel, ['Optical Effect']), 1),
    compactPromptClauses(firstStructuredValue(valuesByLabel, ['Camera / Film']), 2),
  ].map((value) => compactAiSourceText(value)).filter(Boolean);
  return parts.length > 0 ? ensureTerminalPeriod(parts.join(', ')) : '';
}

const AI_LEGACY_SINGLE_RENDERER_HELPERS = [
  buildAiImageTypeLead,
  buildAiSingleSubjectAccessoryParts,
  buildAiSingleSubjectPromptText,
  buildAiMinimalSubjectLead,
  buildAiMinimalWardrobeClause,
  buildAiMinimalPoseClause,
  buildAiMinimalSceneClause,
  buildAiMinimalLightingClause,
  buildAiMinimalMoodTail,
];

function renderAiPrompt(promptModel) {
  const {
    valuesByLabel,
    context,
    character,
    wardrobe,
    wardrobeColors,
  } = promptModel;

  if (context.subject?.count === 2 && !isSpecialSubject(context.subject)) {
    return renderAiDuoPrompt(valuesByLabel, context, wardrobe, wardrobeColors);
  }

  return [
    buildImageTypePromptLine(context),
    buildCompositionPromptLine(context),
    buildAiFreedomSubjectSentence(valuesByLabel, context, wardrobe),
    buildAiFreedomWardrobeSentence(valuesByLabel, context, wardrobe),
    buildAiFreedomPoseSentence(context, character),
    buildAiFreedomSceneSentence(valuesByLabel, context),
    buildAiFreedomImagingSentence(valuesByLabel),
  ].filter(Boolean).join('\n\n');
}

function buildPrompts(context, character, wardrobe, wardrobeColors, lightDirection, film, opticalEffect) {
  const compositionVisibility = getCompositionVisibilityProjection(context);
  const poseComposer = extractCharacterSlots(character).poseComposer;
  const projectionContext = {
    ...context,
    compositionVisibility,
  };
  const mainContext = {
    ...projectionContext,
    projectedCanonicalPoseText: buildProjectedCanonicalPoseText(projectionContext, poseComposer),
    projectedScene: buildProjectedScene(projectionContext),
  };
  const promptModel = {
    ...buildStructuredPromptSections(mainContext, character, wardrobe, wardrobeColors, lightDirection, film),
    context: mainContext,
    character,
    wardrobe,
    wardrobeColors,
    lightDirection,
    film,
    opticalEffect,
  };
  const fullBodyCharacterContext = {
    ...context,
    framing: FULL_BODY_CHARACTER_REFERENCE_FRAMING,
    fixedCompositionSet: null,
    compositionVisibility: createCompositionVisibilityProjection(FULL_BODY_CHARACTER_REFERENCE_FRAMING),
  };
  const fullBodyCharacterPromptModel = {
    ...promptModel,
    ...buildStructuredPromptSections(fullBodyCharacterContext, character, wardrobe, wardrobeColors, lightDirection, film),
    context: fullBodyCharacterContext,
  };
  const grokPrompt = renderGptPrompt(promptModel);
  const zImagePrompt = renderZImagePrompt(promptModel);
  const midjourneyPrompt = renderAiPrompt(promptModel);
  const fullBodyCharacterPrompt = renderFullBodyCharacterPrompt(fullBodyCharacterPromptModel);

  return { midjourneyPrompt, grokPrompt, zImagePrompt, fullBodyCharacterPrompt };
}

function buildSelectionSnapshot(context, wardrobe, wardrobeColors, character, lightDirection, film) {
  const characterSlots = extractCharacterSlots(character);
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
  const characterCardSelection = getCharacterCardSelectionFields(context.subject, context.locks);
  const normalizedSelection = normalizeLegacyOutfitPresetColors({
    outfitPresetColorId: wardrobeColors.outfitPresetColor?.id || wardrobeColors.outfitPresetPrimaryColor?.id || '',
    outfitPresetAColorId: wardrobeColors.outfitPresetAColor?.id || wardrobeColors.outfitPresetAPrimaryColor?.id || '',
    outfitPresetBColorId: wardrobeColors.outfitPresetBColor?.id || wardrobeColors.outfitPresetBPrimaryColor?.id || '',
    outfitPresetPrimaryColorId: wardrobeColors.outfitPresetPrimaryColor?.id || wardrobeColors.outfitPresetColor?.id || '',
    outfitPresetContrastColorId: wardrobeColors.outfitPresetContrastColor?.id || '',
    outfitPresetLockedPaletteId: wardrobeColors.outfitPresetLockedPalette?.id || '',
    outfitPresetAPrimaryColorId: wardrobeColors.outfitPresetAPrimaryColor?.id || wardrobeColors.outfitPresetAColor?.id || '',
    outfitPresetAContrastColorId: wardrobeColors.outfitPresetAContrastColor?.id || '',
    outfitPresetALockedPaletteId: wardrobeColors.outfitPresetALockedPalette?.id || '',
    outfitPresetBPrimaryColorId: wardrobeColors.outfitPresetBPrimaryColor?.id || wardrobeColors.outfitPresetBColor?.id || '',
    outfitPresetBContrastColorId: wardrobeColors.outfitPresetBContrastColor?.id || '',
    outfitPresetBLockedPaletteId: wardrobeColors.outfitPresetBLockedPalette?.id || '',
  });
  const resolvedSelection = {
    subjectCount: isSpecialSubject(context.subject) ? '1' : context.subject.id,
    specialSubjectId: isSpecialSubject(context.subject) && !isCharacterProfileSubject(context.subject) ? context.subject.id : 'none',
    characterProfileId: isCharacterProfileSubject(context.subject) ? context.subject.id : 'none',
    characterCardHairVariantId: characterCardSelection.characterCardHairVariantId,
    characterCardEyewearMode: characterCardSelection.characterCardEyewearMode,
    characterCardWardrobeMode: characterCardSelection.characterCardWardrobeMode,
    characterCardWardrobeLayerIds: characterCardSelection.characterCardWardrobeLayerIds,
    characterCardPromptOverride: characterCardSelection.characterCardPromptOverride,
    aspectRatio: context.aspectRatio.id,
    imageTypePresetId: context.imageTypePreset?.id || 'photorealistic-photo',
    styleId: context.style?.id || '',
    cameraSystemId: context.cameraSystem?.id || '',
    sceneAttributeId: context.sceneAttribute?.id || '',
    locationId: context.location?.id || '',
    importedWorldSceneMode: context.locks?.importedWorldSceneMode || 'none',
    importedWorldSceneLabel: context.locks?.importedWorldSceneLabel || '',
    importedWorldSceneArchitectureText: context.locks?.importedWorldSceneArchitectureText || '',
    fixedCompositionSetId: context.fixedCompositionSet?.id || 'none',
    fixedSetPositionId: context.fixedSetPosition?.id || 'none',
    fixedSetBackgroundStateId: context.fixedSetBackgroundState?.id || 'none',
    fixedSetCaptureModeId: context.fixedSetCaptureMode?.id || 'photographer-shot',
    fixedSetPerformanceStateId: context.fixedSetPerformanceState?.id || 'model-natural',
    framingId: context.framing?.id || '',
    angleId: context.angle?.id || '',
    orbitId: context.orbit?.id || '',
    lensId: context.lens?.id || '',
    apertureId: context.aperture?.id || '',
    shutterId: context.shutter?.id || '',
    opticalEffectId: context.opticalEffect?.id || '',
    lightingId: context.lighting?.id || '',
    lightDirectionId: lightDirection?.id || '',
    filmId: film?.id || '',
    specialOutfitId: wardrobeSlots.specialOutfit?.id || '',
    specialOutfitAId: wardrobeSlots.specialOutfitA?.id?.replace(/:a$/, '') || '',
    specialOutfitBId: wardrobeSlots.specialOutfitB?.id?.replace(/:b$/, '') || '',
    completeLookPaletteId: wardrobeColors.completeLookPalette?.id || '',
    completeLookPaletteAId: wardrobeColors.completeLookPaletteA?.id || '',
    completeLookPaletteBId: wardrobeColors.completeLookPaletteB?.id || '',
    outfitPresetId: wardrobeSlots.outfitPreset?.id || '',
    outfitPresetColorId: normalizedSelection.outfitPresetColorId,
    outfitPresetPrimaryColorId: normalizedSelection.outfitPresetPrimaryColorId,
    outfitPresetContrastColorId: normalizedSelection.outfitPresetContrastColorId,
    outfitPresetLockedPaletteId: normalizedSelection.outfitPresetLockedPaletteId,
    outfitPresetAId: wardrobeSlots.outfitPresetA?.id?.replace(/:a$/, '') || '',
    outfitPresetAColorId: normalizedSelection.outfitPresetAColorId,
    outfitPresetAPrimaryColorId: normalizedSelection.outfitPresetAPrimaryColorId,
    outfitPresetAContrastColorId: normalizedSelection.outfitPresetAContrastColorId,
    outfitPresetALockedPaletteId: normalizedSelection.outfitPresetALockedPaletteId,
    outfitPresetBId: wardrobeSlots.outfitPresetB?.id?.replace(/:b$/, '') || '',
    outfitPresetBColorId: normalizedSelection.outfitPresetBColorId,
    outfitPresetBPrimaryColorId: normalizedSelection.outfitPresetBPrimaryColorId,
    outfitPresetBContrastColorId: normalizedSelection.outfitPresetBContrastColorId,
    outfitPresetBLockedPaletteId: normalizedSelection.outfitPresetBLockedPaletteId,
    bodyTypeId: characterSlots.bodyType?.id || '',
    bodyTypeAId: characterSlots.bodyTypeA?.id?.replace(/:a$/, '') || '',
    bodyTypeBId: characterSlots.bodyTypeB?.id?.replace(/:b$/, '') || '',
    facialFeaturesId: characterSlots.facialFeatures?.id || '',
    facialFeaturesAId: characterSlots.facialFeaturesA?.id?.replace(/:a$/, '') || '',
    facialFeaturesBId: characterSlots.facialFeaturesB?.id?.replace(/:b$/, '') || '',
    skinDetailsId: characterSlots.skinDetails?.id || '',
    skinDetailsAId: characterSlots.skinDetailsA?.id?.replace(/:a$/, '') || '',
    skinDetailsBId: characterSlots.skinDetailsB?.id?.replace(/:b$/, '') || '',
    hairstyleId: characterSlots.hairstyle?.id || '',
    hairstyleAId: characterSlots.hairstyleA?.id?.replace(/:a$/, '') || '',
    hairstyleBId: characterSlots.hairstyleB?.id?.replace(/:b$/, '') || '',
    hairColorId: characterSlots.hairColor?.id || '',
    hairColorAId: characterSlots.hairColorA?.id?.replace(/:a$/, '') || '',
    hairColorBId: characterSlots.hairColorB?.id?.replace(/:b$/, '') || '',
    duoInteractionId: '',
    duoPoseId: characterSlots.duoPose?.id?.split(':').pop() || '',
    duoPoseBaseId: characterSlots.duoPoseBase?.id?.split(':').pop() || '',
    duoExpressionId: characterSlots.duoExpression?.id?.split(':').pop() || '',
    expressionId: characterSlots.expression?.id || '',
    expressionAId: '',
    expressionBId: '',
    actionPoseCardId: characterSlots.actionPose?.meta?.actionPoseCardId || '',
    poseId: characterSlots.pose?.id || '',
    specialActionId: characterSlots.specialAction?.id || '',
    poseBaseId: characterSlots.poseComposer?.meta?.poseBaseId || 'none',
    poseArrangementId: characterSlots.poseComposer?.meta?.poseArrangementId || 'none',
    poseHandId: characterSlots.poseComposer?.meta?.poseHandId || 'none',
    posePropId: characterSlots.poseComposer?.meta?.posePropId || 'none',
    poseHeadId: characterSlots.poseComposer?.meta?.poseHeadId || 'none',
    poseAnchorId: characterSlots.poseComposer?.meta?.poseAnchorId || 'none',
    topId: wardrobeSlots.top?.id || '',
    topAId: wardrobeSlots.topA?.id?.replace(/:a$/, '') || '',
    topBId: wardrobeSlots.topB?.id?.replace(/:b$/, '') || '',
    topFitId: wardrobeSlots.topFit?.id?.split(':').pop() || '',
    topFitAId: wardrobeSlots.topFitA?.id?.replace(/:a$/, '')?.split(':').pop() || '',
    topFitBId: wardrobeSlots.topFitB?.id?.replace(/:b$/, '')?.split(':').pop() || '',
    topStylingId: wardrobeSlots.topStyling?.id?.split(':').pop() || '',
    topStylingAId: wardrobeSlots.topStylingA?.id?.replace(/:a$/, '')?.split(':').pop() || '',
    topStylingBId: wardrobeSlots.topStylingB?.id?.replace(/:b$/, '')?.split(':').pop() || '',
    topBottomPaletteId: wardrobeColors.topBottomPalette?.id || '',
    topBottomPaletteAId: wardrobeColors.topBottomPaletteA?.id || '',
    topBottomPaletteBId: wardrobeColors.topBottomPaletteB?.id || '',
    topColorId: wardrobeColors.topColor?.id || '',
    topAColorId: wardrobeColors.topAColor?.id || '',
    topBColorId: wardrobeColors.topBColor?.id || '',
    topPatternId: wardrobeSlots.topPattern?.id || '',
    topAPatternId: wardrobeSlots.topPatternA?.id?.replace(/:a$/, '') || '',
    topBPatternId: wardrobeSlots.topPatternB?.id?.replace(/:b$/, '') || '',
    dressId: wardrobeSlots.dress?.id || '',
    dressAId: wardrobeSlots.dressA?.id?.replace(/:a$/, '') || '',
    dressBId: wardrobeSlots.dressB?.id?.replace(/:b$/, '') || '',
    dressColorId: wardrobeColors.dressColor?.id || '',
    dressAColorId: wardrobeColors.dressAColor?.id || '',
    dressBColorId: wardrobeColors.dressBColor?.id || '',
    pantsId: wardrobeSlots.pants?.id || '',
    pantsAId: wardrobeSlots.pantsA?.id?.replace(/:a$/, '') || '',
    pantsBId: wardrobeSlots.pantsB?.id?.replace(/:b$/, '') || '',
    skirtId: wardrobeSlots.skirt?.id || '',
    skirtAId: wardrobeSlots.skirtA?.id?.replace(/:a$/, '') || '',
    skirtBId: wardrobeSlots.skirtB?.id?.replace(/:b$/, '') || '',
    bottomFitId: wardrobeSlots.bottomFit?.id?.split(':').pop() || '',
    bottomFitAId: wardrobeSlots.bottomFitA?.id?.replace(/:a$/, '')?.split(':').pop() || '',
    bottomFitBId: wardrobeSlots.bottomFitB?.id?.replace(/:b$/, '')?.split(':').pop() || '',
    bottomRiseId: wardrobeSlots.bottomRise?.id?.split(':').pop() || '',
    bottomRiseAId: wardrobeSlots.bottomRiseA?.id?.replace(/:a$/, '')?.split(':').pop() || '',
    bottomRiseBId: wardrobeSlots.bottomRiseB?.id?.replace(/:b$/, '')?.split(':').pop() || '',
    bottomColorId: wardrobeColors.bottomColor?.id || '',
    bottomAColorId: wardrobeColors.bottomAColor?.id || '',
    bottomBColorId: wardrobeColors.bottomBColor?.id || '',
    bottomPatternId: wardrobeSlots.bottomPattern?.id || '',
    bottomAPatternId: wardrobeSlots.bottomPatternA?.id?.replace(/:a$/, '') || '',
    bottomBPatternId: wardrobeSlots.bottomPatternB?.id?.replace(/:b$/, '') || '',
    legwearId: wardrobeSlots.legwear?.id || '',
    legwearColorId: wardrobeColors.legwearColor?.id || '',
    outerwearId: wardrobeSlots.outerwear?.id || '',
    outerwearFitId: wardrobeSlots.outerwearFit?.id || '',
    outerwearColorId: wardrobeColors.outerwearColor?.id || '',
    outerwearPatternId: wardrobeSlots.outerwearPattern?.id || '',
    outerwearOpeningId: wardrobeSlots.outerwearOpening?.id || '',
    outerwearStylingId: wardrobeSlots.outerwearStyling?.id || '',
    shoesId: wardrobeSlots.shoes?.id || '',
    shoesColorId: wardrobeColors.shoesColor?.id || '',
    legwearAId: wardrobeSlots.legwearA?.id?.replace(/:a$/, '') || '',
    legwearAColorId: wardrobeColors.legwearAColor?.id || '',
    outerwearAId: wardrobeSlots.outerwearA?.id?.replace(/:a$/, '') || '',
    outerwearAFitId: wardrobeSlots.outerwearAFit?.id?.replace(/:a$/, '') || '',
    outerwearAColorId: wardrobeColors.outerwearAColor?.id || '',
    outerwearAPatternId: wardrobeSlots.outerwearAPattern?.id?.replace(/:a$/, '') || '',
    outerwearAOpeningId: wardrobeSlots.outerwearAOpening?.id?.replace(/:a$/, '') || '',
    outerwearAStylingId: wardrobeSlots.outerwearAStyling?.id?.replace(/:a$/, '') || '',
    shoesAId: wardrobeSlots.shoesA?.id?.replace(/:a$/, '') || '',
    shoesAColorId: wardrobeColors.shoesAColor?.id || '',
    legwearBId: wardrobeSlots.legwearB?.id?.replace(/:b$/, '') || '',
    legwearBColorId: wardrobeColors.legwearBColor?.id || '',
    outerwearBId: wardrobeSlots.outerwearB?.id?.replace(/:b$/, '') || '',
    outerwearBFitId: wardrobeSlots.outerwearBFit?.id?.replace(/:b$/, '') || '',
    outerwearBColorId: wardrobeColors.outerwearBColor?.id || '',
    outerwearBPatternId: wardrobeSlots.outerwearBPattern?.id?.replace(/:b$/, '') || '',
    outerwearBOpeningId: wardrobeSlots.outerwearBOpening?.id?.replace(/:b$/, '') || '',
    outerwearBStylingId: wardrobeSlots.outerwearBStyling?.id?.replace(/:b$/, '') || '',
    shoesBId: wardrobeSlots.shoesB?.id?.replace(/:b$/, '') || '',
    shoesBColorId: wardrobeColors.shoesBColor?.id || '',
    headAccessoryId: wardrobeSlots.headAccessory?.id || '',
    eyewearId: wardrobeSlots.eyewear?.id || '',
    eyewearColorId: wardrobeSlots.eyewearColor?.id || '',
    eyewearPlacementId: wardrobeSlots.eyewearPlacement?.id || '',
    earringsId: wardrobeSlots.earrings?.id || '',
    neckAccessoryId: wardrobeSlots.neckAccessory?.id || '',
    headAccessoryAId: wardrobeSlots.headAccessoryA?.id?.replace(/:a$/, '') || '',
    eyewearAId: wardrobeSlots.eyewearA?.id?.replace(/:a$/, '') || '',
    eyewearAColorId: wardrobeSlots.eyewearAColor?.id?.replace(/:a$/, '') || '',
    eyewearAPlacementId: wardrobeSlots.eyewearAPlacement?.id?.replace(/:a$/, '') || '',
    earringsAId: wardrobeSlots.earringsA?.id?.replace(/:a$/, '') || '',
    neckAccessoryAId: wardrobeSlots.neckAccessoryA?.id?.replace(/:a$/, '') || '',
    headAccessoryBId: wardrobeSlots.headAccessoryB?.id?.replace(/:b$/, '') || '',
    eyewearBId: wardrobeSlots.eyewearB?.id?.replace(/:b$/, '') || '',
    eyewearBColorId: wardrobeSlots.eyewearBColor?.id?.replace(/:b$/, '') || '',
    eyewearBPlacementId: wardrobeSlots.eyewearBPlacement?.id?.replace(/:b$/, '') || '',
    earringsBId: wardrobeSlots.earringsB?.id?.replace(/:b$/, '') || '',
    neckAccessoryBId: wardrobeSlots.neckAccessoryB?.id?.replace(/:b$/, '') || '',
  };
  return createSelectionSnapshot(LOCK_DEFINITIONS, resolvedSelection);
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

function generateSinglePrompt(index, locks, runtime, runtimeOptions = {}) {
  const lockControls = runtime.controls;
  const random = normalizeRandom(runtimeOptions.random);
  const previewRerollExclusions = buildPreviewRerollExclusions(runtimeOptions.excludePreviousSelection);
  const withPreviewExclusions = (picker, lockedId, exclusionKeys) => (candidates, pickerRandom) => {
    const shouldExcludePrevious = !lockedId || isRandomLockValue(lockedId);
    const eligibleCandidates = shouldExcludePrevious
      ? previewRerollExclusions.filterCandidates(candidates, exclusionKeys)
      : candidates;
    return picker(eligibleCandidates, pickerRandom);
  };
  const pickLocked = (list, lockedId, predicate = () => true, picker = sample, exclusionKeys = []) => (
    pickWithLock(
      list,
      lockedId,
      predicate,
      withPreviewExclusions(picker, lockedId, exclusionKeys),
      random,
    )
  );
  const pickCompatible = (list, lockedId, predicate = () => true, picker = sample, exclusionKeys = []) => (
    pickWithCompatibleLock(
      list,
      lockedId,
      predicate,
      withPreviewExclusions(picker, lockedId, exclusionKeys),
      random,
    )
  );
  const effectiveLocks = sanitizeLocksForCloseupMode(locks, lockControls);
  const selectedFixedCompositionSet = getFixedCompositionSetOption(effectiveLocks.fixedCompositionSetId);
  const fixedCompositionSetActive = isFixedCompositionSetActive(selectedFixedCompositionSet) && effectiveLocks.subjectCount !== '2';
  const fixedSetCameraVariationActive = fixedCompositionSetActive && fixedCompositionSetAllowsCameraVariation(selectedFixedCompositionSet);
  if (fixedCompositionSetActive) {
    effectiveLocks.sceneAttributeId = '';
    effectiveLocks.importedWorldSceneMode = 'none';
    effectiveLocks.importedWorldSceneLabel = '';
    effectiveLocks.importedWorldSceneArchitectureText = '';

    ['locationId', 'framingId', 'lensId', 'opticalEffectId'].forEach((key) => {
      const noneOption = getControlOptionByZh(lockControls, key, '全無');
      effectiveLocks[key] = noneOption?.id || '';
    });
    if (!fixedSetCameraVariationActive) {
      ['angleId', 'orbitId'].forEach((key) => {
        const noneOption = getControlOptionByZh(lockControls, key, '全無');
        effectiveLocks[key] = noneOption?.id || '';
      });
    }

    const requestedStyle = getControlOptionById(lockControls, 'styleId', locks.styleId);
    if (requestedStyle) effectiveLocks.styleId = requestedStyle.id;
  } else {
    effectiveLocks.fixedCompositionSetId = 'none';
    effectiveLocks.fixedSetPositionId = 'none';
    effectiveLocks.fixedSetBackgroundStateId = 'none';
    effectiveLocks.fixedSetCaptureModeId = 'photographer-shot';
    effectiveLocks.fixedSetPerformanceStateId = 'model-natural';
  }
  const hasImportedWorldSceneArchitecture = effectiveLocks.importedWorldSceneMode === 'architecture'
    && Boolean(effectiveLocks.importedWorldSceneArchitectureText);
  if (hasImportedWorldSceneArchitecture) {
    const noneLocation = getControlOptionByZh(lockControls, 'locationId', '全無');
    effectiveLocks.locationId = noneLocation?.id || '';
    effectiveLocks.sceneAttributeId = '';
  }
  const specialSubject = getSpecialSubjectOption(effectiveLocks.specialSubjectId);
  const characterProfile = getCharacterProfileOption(effectiveLocks.characterProfileId);
  const dedicatedSubject = characterProfile || specialSubject;
  const subject = dedicatedSubject || getSubjectOption(effectiveLocks.subjectCount);
  const imageTypePreset = getImageTypePresetOption(effectiveLocks.imageTypePresetId);
  const hasWardrobeLocks = !dedicatedSubject && hasEffectiveWardrobeLockValues(effectiveLocks, lockControls);
  const hasSceneLocks = Boolean(effectiveLocks.locationId || effectiveLocks.sceneAttributeId);
  const aspectRatio = getAspectRatioOption(effectiveLocks.aspectRatio, random, previewRerollExclusions);
  const sceneAttribute = getSceneAttributeOption(effectiveLocks.sceneAttributeId);
  const lowFrequencyPicker = (tag) => (candidates) => {
    const regular = candidates.filter((item) => !item.meta.tags?.includes(tag));
    const lowFrequency = candidates.filter((item) => item.meta.tags?.includes(tag));

    if (regular.length > 0 && (lowFrequency.length === 0 || random() < 0.88)) {
      return sample(regular, random);
    }

    return sample(lowFrequency.length > 0 ? lowFrequency : candidates, random);
  };
  const location = pickLocked(
    runtime.flatCatalog.locations,
    effectiveLocks.locationId,
    (item) => locationMatchesSceneAttribute(item, sceneAttribute),
    sample,
    ['locationId'],
  );
  let style = pickLocked(
    runtime.flatCatalog.regional,
    effectiveLocks.styleId,
    (item) => styleFitsLocation(item, location),
    sample,
    ['styleId'],
  );
  const lockedSpecialAction = effectiveLocks.specialActionId
    ? findById(getByKey(runtime.catalog.character, '特殊動作 (Special Actions)'), effectiveLocks.specialActionId)
    : null;
  const lockedPoseComposerAction = getPoseComposerActionConstraint(effectiveLocks);
  const lockedActionPoseCard = effectiveLocks.actionPoseCardId && subject.count === 1 && !isDedicatedSpecialSubject(subject)
    ? getActionPoseCardById(effectiveLocks.actionPoseCardId)
    : null;
  const lockedActionPose = lockedActionPoseCard?.mode === 'single'
    ? {
        zh: lockedActionPoseCard.title,
        en: lockedActionPoseCard.actionPrompt,
        meta: {
          ...(lockedActionPoseCard.meta || {}),
          tags: withTags(lockedActionPoseCard.meta?.tags || ['action_pose', 'full_body_action']),
        },
      }
    : null;
  const lockedActionConstraint = mergeActionConstraints(lockedSpecialAction, lockedPoseComposerAction, lockedActionPose);
  const framing = pickLocked(
    runtime.flatCatalog.framing,
    effectiveLocks.framingId,
    (item) => (
      (!lockedActionConstraint || item.zh !== '全無')
      &&
      !(location.meta.tags.includes('club') && item.meta.visibility === 'close')
      && (effectiveLocks.framingId || (!hasWardrobeLocks && !hasSceneLocks) || item.meta.visibility !== 'close')
      && framingSupportsSubject(item, subject, aspectRatio)
      && specialActionSupportsFraming(lockedActionConstraint, item)
    ),
    sample,
    ['framingId'],
  );
  const expressionOptions = getByKey(runtime.catalog.character, '神情與眼神 (Expression & Gaze)');
  const lockedDuoExpression = subject.count === 2 && effectiveLocks.duoExpressionId
    ? getDuoExpressionOption(effectiveLocks.duoExpressionId)
    : null;
  const lockedExpressions = [
    lockedDuoExpression,
    !lockedDuoExpression && subject.count === 2 && effectiveLocks.expressionAId ? findById(expressionOptions, effectiveLocks.expressionAId) : null,
    !lockedDuoExpression && subject.count === 2 && effectiveLocks.expressionBId ? findById(expressionOptions, effectiveLocks.expressionBId) : null,
    effectiveLocks.expressionId ? findById(expressionOptions, effectiveLocks.expressionId) : null,
  ].filter(Boolean);
  const pickCameraWithExpressionLock = lockedExpressions.length > 0 ? pickCompatible : pickLocked;
  const angle = pickCameraWithExpressionLock(
    runtime.flatCatalog.angle,
    effectiveLocks.angleId,
    (item) => framingSupportsAngle(framing, item) && lockedExpressions.every((expression) => angleSupportsExpression(item, expression)),
    lowFrequencyPicker('low_frequency_angle'),
    ['angleId'],
  );
  if (isWormEyeAngleItem(angle)) {
    const noneStyle = getControlOptionByZh(lockControls, 'styleId', '全無');
    const noneLens = getControlOptionByZh(lockControls, 'lensId', '全無');
    const noneOpticalEffect = getControlOptionByZh(lockControls, 'opticalEffectId', '全無');
    style = noneStyle || null;
    effectiveLocks.styleId = noneStyle?.id || '';
    effectiveLocks.lensId = noneLens?.id || '';
    effectiveLocks.opticalEffectId = noneOpticalEffect?.id || '';
  }
  let orbit = pickCameraWithExpressionLock(
    runtime.flatCatalog.orbit,
    effectiveLocks.orbitId,
    (item) => framingSupportsOrbit(framing, item) && lockedExpressions.every((expression) => orbitSupportsExpression(item, expression)) && specialActionSupportsOrbit(item, lockedActionConstraint),
    sample,
    ['orbitId'],
  );
  const lens = pickLocked(runtime.flatCatalog.lens, effectiveLocks.lensId, () => true, sample, ['lensId']);
  const apertureLockId = effectiveLocks.apertureId || getControlOptionByZh(lockControls, 'apertureId', '全無')?.id || '';
  const shutterLockId = effectiveLocks.shutterId || getControlOptionByZh(lockControls, 'shutterId', '全無')?.id || '';
  const aperture = pickLocked(runtime.flatCatalog.aperture, apertureLockId, () => true, sample, ['apertureId']);
  const shutter = pickLocked(runtime.flatCatalog.shutter, shutterLockId, () => true, sample, ['shutterId']);
  const fixedSetLightingCompatibilityAnchor = fixedCompositionSetActive
    && selectedFixedCompositionSet?.meta?.tags?.includes('outdoor')
    ? selectedFixedCompositionSet
    : null;
  const locationForLightingCompatibility = fixedSetLightingCompatibilityAnchor || (hasImportedWorldSceneArchitecture ? null : location);
  const lighting = pickCompatible(
    runtime.flatCatalog.lighting,
    effectiveLocks.lightingId,
    (item) => (locationForLightingCompatibility ? locationSupportsLighting(locationForLightingCompatibility, item) : true),
    sample,
    ['lightingId'],
  );
  const lightDirection = !lighting
    ? null
    : pickCompatible(
      runtime.flatCatalog.lightDirection,
      effectiveLocks.lightDirectionId,
      (item) => lightDirectionSupportsScene(item, framing, locationForLightingCompatibility, lighting),
      sample,
      ['lightDirectionId'],
    );
  const imagingLockId = effectiveLocks.filmId || (CAMERA_PROFILE_OPTION_IDS.has(effectiveLocks.cameraSystemId) ? effectiveLocks.cameraSystemId : '');
  const film = pickLocked(
    runtime.flatCatalog.film,
    imagingLockId,
    () => true,
    lowFrequencyPicker('low_frequency_film'),
    ['filmId', 'cameraSystemId'],
  );
  const cameraSystem = getLegacyCameraSystemFromImaging(film);
  const opticalEffect = pickLocked(
    runtime.flatCatalog.effects,
    effectiveLocks.opticalEffectId,
    () => true,
    sample,
    ['opticalEffectId'],
  );
  const fixedCompositionSet = fixedCompositionSetActive ? selectedFixedCompositionSet : null;
  const fixedSetPosition = fixedCompositionSet
    ? getFixedSetPositionOption(effectiveLocks.fixedSetPositionId, fixedCompositionSet)
    : getFixedSetPositionOption('none');
  const fixedSetBackgroundState = fixedCompositionSet
    ? getFixedSetBackgroundStateOption(effectiveLocks.fixedSetBackgroundStateId, fixedCompositionSet)
    : getFixedSetBackgroundStateOption('none');
  const fixedSetCaptureMode = fixedCompositionSet
    ? getFixedSetCaptureModeOption(effectiveLocks.fixedSetCaptureModeId)
    : getFixedSetCaptureModeOption('photographer-shot');
  const fixedSetPerformanceState = fixedCompositionSet
    ? getFixedSetPerformanceStateOption(effectiveLocks.fixedSetPerformanceStateId)
    : getFixedSetPerformanceStateOption('model-natural');
  const compositionVisibility = createCompositionVisibilityProjection(framing, {
    fixedCompositionActive: Boolean(fixedCompositionSet),
  });
  const context = {
    subject,
    imageTypePreset,
    aspectRatio,
    sceneAttribute,
    style,
    cameraSystem,
    location,
    framing,
    angle,
    orbit,
    lens,
    aperture,
    shutter,
    opticalEffect,
    fixedCompositionSet,
    fixedSetPosition,
    fixedSetBackgroundState,
    fixedSetCaptureMode,
    fixedSetPerformanceState,
    compositionVisibility,
    film,
    lighting,
    lightDirection,
    locks: effectiveLocks,
    random,
    previewRerollExclusions,
    characterProfilePrompt: String(runtimeOptions.characterProfilePrompt || '').trim(),
  };
  const character = buildCharacter(context, runtime.catalog);
  if (characterUsesResolvedSelfiePoseHand(character)) {
    const noneOrbit = getControlOptionByZh(lockControls, 'orbitId', '全無');
    orbit = noneOrbit || null;
    context.orbit = orbit;
    effectiveLocks.orbitId = noneOrbit?.id || '';
  }
  const cardLayers = getCharacterCardImportedLayers(subject, effectiveLocks);
  const cardWardrobeMode = getCharacterCardWardrobeMode(effectiveLocks);
  const rawPage1Wardrobe = isDedicatedSpecialSubject(subject) || (isCharacterProfileSubject(subject) && cardWardrobeMode === 'full-default')
    ? []
    : buildWardrobe({ ...context }, effectiveLocks, runtime);
  const filteredPage1Wardrobe = filterPage1WardrobeForCharacterCardLayers(rawPage1Wardrobe, cardLayers);
  const page1Wardrobe = appendLockedPage1FillersForCharacterCardLayers(filteredPage1Wardrobe, cardLayers, effectiveLocks, lockControls);
  const wardrobe = [...cardLayers, ...page1Wardrobe];
  context.wardrobe = wardrobe;
  const wardrobeColors = buildWardrobeColors(extractWardrobeSlots(wardrobe), effectiveLocks, random);

  const {
    midjourneyPrompt,
    grokPrompt,
    zImagePrompt,
    fullBodyCharacterPrompt,
  } = buildPrompts(context, character, wardrobe, wardrobeColors, lightDirection, film, opticalEffect);
  const summaryFields = buildSummaryFields(context, wardrobe, character, wardrobeColors);

  return {
    id: `${Date.now()}-${index}-${random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    summary: buildSummary(summaryFields),
    summaryFields,
    midjourneyPrompt,
    grokPrompt,
    zImagePrompt,
    extraPrompts: fullBodyCharacterPrompt
      ? [{ id: 'full-body-character', label: '全身角色照', text: fullBodyCharacterPrompt }]
      : [],
    selection: buildSelectionSnapshot(context, wardrobe, wardrobeColors, character, lightDirection, film),
    structured: {
      Style: [imageTypePreset, style].filter(Boolean),
      Character: character,
      Wardrobe: wardrobe,
      Location: [location],
      Framing: [framing, angle, orbit].filter(Boolean),
      Lighting: [lighting, lightDirection].filter(Boolean),
      'Lens & Imaging': [lens, aperture, shutter, opticalEffect, film].filter(Boolean),
    },
  };
}

export function generatePrompts(count = 1, locks = createEmptyLocks(), customLibrary = [], runtimeOptions = {}) {
  const runtime = getEngineRuntime(customLibrary);
  return Array.from({ length: count }, (_, index) => generateSinglePrompt(index, locks, runtime, runtimeOptions));
}
