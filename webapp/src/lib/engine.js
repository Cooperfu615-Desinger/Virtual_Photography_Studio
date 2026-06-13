import database from '../data/database.json' with { type: 'json' };

const SUBJECT_COUNT_OPTIONS = [
  { id: '1', zh: '1 位', en: 'one 20-year-old Japanese or Korean female portrait subject', count: 1 },
  { id: '2', zh: '2 位', en: 'two 20-year-old Japanese or Korean female portrait subjects', count: 2 },
  {
    id: 'reference',
    zh: '上傳人物',
    en: 'a woman matching the attached reference person, preserve facial identity and overall likeness from the attached image',
    count: 1,
    reference: true,
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

const DUO_INTERACTION_OPTIONS = [
  {
    id: 'none',
    zh: '全無',
    en: '',
    desc: 'Do not specify duo interaction, letting the model decide the shared action and chemistry.',
    meta: { tags: ['none'] },
  },
  {
    id: 'strangers',
    zh: '陌生',
    en: 'both women sharing the same frame with unfamiliar detached chemistry, no obvious intimacy, reserved social distance',
  },
  {
    id: 'distance',
    zh: '有距離',
    en: 'both women maintaining a noticeable emotional and physical distance, restrained interaction, cool composed shared atmosphere',
  },
  {
    id: 'shoulder-lean',
    zh: '靠肩',
    en: 'both women leaning shoulder to shoulder, soft physical closeness, relaxed affectionate interaction in the same frame',
  },
  {
    id: 'intimate',
    zh: '親密',
    en: 'both women sharing intimate natural closeness, comfortable emotional connection, warm shared body language, restrained romantic chemistry',
  },
  {
    id: 'sensual-embrace',
    zh: '性感擁抱',
    en: 'both women in a sensual embracing interaction, close body contact, confident seductive chemistry, fashion-forward intimate tension',
  },
];

const DUO_POSE_OPTIONS = [
  {
    id: 'none',
    zh: '全無',
    en: '',
    desc: 'Do not specify duo composition pose, letting the model decide the shared staging.',
    meta: { tags: ['none'] },
  },
  {
    id: 'side-by-side-standing',
    zh: '並肩站立',
    en: 'two women standing side by side, balanced shared framing, straightforward duo composition',
  },
  {
    id: 'front-back-standing',
    zh: '前後站立',
    en: 'two women standing in a front-back arrangement, layered depth, staggered editorial duo composition',
  },
  {
    id: 'side-by-side-walking',
    zh: '並肩行進',
    en: 'two women moving forward side by side, synchronized walking rhythm, clean shared motion composition',
  },
  {
    id: 'front-back-walking',
    zh: '前後行進',
    en: 'two women moving in a front-back staggered walk, layered forward motion, dynamic editorial pacing',
  },
  {
    id: 'leaning-on-each-other',
    zh: '彼此倚靠',
    en: 'two women leaning into each other for support, asymmetrical weight balance, close shared composition',
  },
  {
    id: 'split-wall-lean',
    zh: '左右靠牆',
    en: 'two women arranged against opposite or separated wall planes, left-right architectural balance, clean spatial framing',
  },
  {
    id: 'side-by-side-squat',
    zh: '蹲姿',
    en: 'two women squatting side by side, low grounded composition, close shared framing',
  },
  {
    id: 'stand-and-squat',
    zh: '站＋蹲',
    en: 'one woman standing while the other squats nearby, clear height contrast, layered duo composition',
  },
  {
    id: 'side-by-side-kneeling',
    zh: '跪姿',
    en: 'two women kneeling together, upright low composition, poised controlled body lines',
  },
  {
    id: 'kneel-and-squat',
    zh: '跪＋蹲',
    en: 'one woman kneeling while the other squats, compact height contrast, stylized low duo composition',
  },
  {
    id: 'side-by-side-seated',
    zh: '坐姿',
    en: 'two women seated together, stable grounded composition, calm shared staging',
  },
  {
    id: 'sit-and-squat',
    zh: '坐＋蹲',
    en: 'one woman seated while the other squats nearby, layered low-height contrast, relaxed duo balance',
  },
  {
    id: 'side-lying',
    zh: '側躺',
    en: 'two women lying on their sides, elongated lateral composition, soft reclined shared framing',
  },
  {
    id: 'side-lying-and-seated',
    zh: '側躺＋坐',
    en: 'one woman side-lying while the other sits nearby, mixed-height reclined composition, editorial contrast',
  },
  {
    id: 'lying-on-back',
    zh: '仰躺',
    en: 'two women lying on their backs, open low composition, calm reclined symmetry',
  },
  {
    id: 'lying-on-back-and-side',
    zh: '仰躺＋側躺',
    en: 'one woman lying on her back while the other lies on her side, varied reclined body lines, soft asymmetrical low composition',
  },
  {
    id: 'prone',
    zh: '俯臥',
    en: 'two women lying prone, low elongated composition, intimate grounded body arrangement',
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
const POSE_COMPOSER_BASE_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不使用姿勢組合器。', meta: { tags: ['none'] } },
  { id: 'random', zh: '隨機', en: 'random pose base', desc: '由姿勢組合器隨機選擇姿勢基底。', meta: { tags: ['random'] } },
  { id: 'standing', zh: '站姿', en: 'standing pose', desc: '以站立作為姿勢基底。' },
  { id: 'sitting', zh: '坐姿', en: 'seated pose', desc: '以坐姿作為姿勢基底。' },
  { id: 'kneeling', zh: '跪姿', en: 'kneeling pose', desc: '以跪姿作為姿勢基底。' },
  { id: 'squatting', zh: '蹲姿', en: 'squatting pose', desc: '以蹲姿作為姿勢基底。' },
  { id: 'lying', zh: '躺姿', en: 'lying pose', desc: '以躺臥作為姿勢基底。' },
];
const POSE_COMPOSER_ARRANGEMENT_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不指定肢體變化。', meta: { tags: ['none'] } },
  { id: 'random', zh: '隨機', en: 'random body arrangement', desc: '依姿勢基底隨機選擇肢體變化。', meta: { tags: ['random'] } },
  {
    id: 'model-natural-body-arrangement',
    bases: ['standing', 'sitting', 'kneeling', 'squatting', 'lying'],
    zh: '模型自然決定',
    en: 'let the image model choose a clearly varied non-default physically believable body arrangement within the selected pose base with distinct weight shift limb angles torso orientation and asymmetry compatible with the wardrobe camera framing and environment',
    desc: '讓影像模型依目前基底、服裝、鏡頭與場景自行決定自然肢體變化。',
  },
  { id: 'standing-natural', base: 'standing', zh: '自然站姿', en: 'natural relaxed standing arrangement' },
  { id: 'standing-one-leg-weight', base: 'standing', zh: '單腳重心', en: 'one-leg weight shift, relaxed asymmetrical body balance' },
  { id: 'standing-forward-lean', base: 'standing', zh: '身體微前傾', en: 'slight forward-leaning standing arrangement' },
  { id: 'standing-back-lean', base: 'standing', zh: '身體微後仰', en: 'slight backward-leaning standing arrangement' },
  { id: 'standing-turn-back', base: 'standing', zh: '回身轉向', en: 'turning-back standing arrangement, torso subtly rotated' },
  { id: 'standing-contrapposto', base: 'standing', zh: '身體側傾', en: 'side-leaning contrapposto body arrangement' },
  { id: 'standing-raised-foot', base: 'standing', zh: '單腳微抬', en: 'one foot slightly lifted, delicate balance pose' },
  { id: 'standing-crossed-legs', base: 'standing', zh: '交叉腿站姿', en: 'crossed-leg standing arrangement, legs naturally crossed, one hip subtly shifted' },
  { id: 'standing-soft-bent-knees', base: 'standing', zh: '膝蓋微彎站姿', en: 'soft bent-knee standing arrangement, relaxed knees with slight lower-body compression' },
  { id: 'standing-back-facing-turn', base: 'standing', zh: '背對回身站姿', en: 'back-facing turn-back standing arrangement, torso rotated back toward the camera' },
  { id: 'standing-narrow-side', base: 'standing', zh: '側身窄站姿', en: 'narrow side-facing standing arrangement, legs close together, clean elongated body line' },
  { id: 'standing-forward-toe-point', base: 'standing', zh: '一腳向前點地', en: 'one foot pointed forward, rear leg holding the body weight, delicate extended stance' },
  { id: 'sitting-natural', base: 'sitting', zh: '自然坐姿', en: 'natural seated arrangement' },
  { id: 'sitting-forward-lean', base: 'sitting', zh: '微微前傾', en: 'slightly forward-leaning seated arrangement' },
  { id: 'sitting-hands-behind-support', base: 'sitting', zh: '雙手後撐', en: 'seated arrangement with both hands supporting behind the body' },
  { id: 'sitting-one-leg-relaxed', base: 'sitting', zh: '單腿放鬆', en: 'one leg relaxed in an easy seated arrangement' },
  { id: 'sitting-legs-extended', base: 'sitting', zh: '雙腿自然伸展', en: 'both legs naturally extended in a seated pose' },
  { id: 'sitting-cross-legged', base: 'sitting', zh: '盤腿坐姿', en: 'cross-legged seated arrangement' },
  { id: 'sitting-hug-knees', base: 'sitting', zh: '抱膝坐姿', en: 'hugging-knees seated arrangement' },
  { id: 'sitting-slouched', base: 'sitting', zh: '隨性癱坐', en: 'casually slouched seated arrangement, relaxed body weight' },
  { id: 'sitting-leg-cross', base: 'sitting', zh: '翹二郎腿', en: 'leg-cross seated arrangement' },
  { id: 'sitting-one-knee-up', base: 'sitting', zh: '單腿屈起坐姿', en: 'seated arrangement with one knee drawn up, the other leg relaxed' },
  { id: 'sitting-legs-to-side', base: 'sitting', zh: '雙腿側放坐姿', en: 'seated arrangement with both legs angled to one side, soft asymmetrical lower-body line' },
  { id: 'sitting-grounded-forward-lean', base: 'sitting', zh: '坐姿身體前傾', en: 'grounded forward-leaning seated arrangement, upper body angled forward with stable seated weight' },
  { id: 'sitting-open-confident', base: 'sitting', zh: '開闊自信坐姿', en: 'open confident seated arrangement, knees set wider with grounded posture, torso upright, strong spatial presence' },
  { id: 'sitting-edge-poised', base: 'sitting', zh: '椅緣端坐', en: 'edge-of-seat poised seated arrangement, seated near the front edge with clear leg line' },
  { id: 'kneeling-seiza', base: 'kneeling', zh: '跪坐', en: 'seiza-style kneeling arrangement' },
  { id: 'kneeling-wide', base: 'kneeling', zh: '分腿跪坐', en: 'wide-knee kneeling arrangement' },
  { id: 'kneeling-forward-lean', base: 'kneeling', zh: '前傾跪姿', en: 'forward-leaning kneeling arrangement' },
  { id: 'kneeling-all-fours', base: 'kneeling', zh: '四足跪姿', en: 'all-fours kneeling arrangement with hands and knees supporting the body' },
  { id: 'kneeling-puppy-crossed-hands-chin', base: 'kneeling', zh: '瑜伽小狗式交叉手托下巴', en: 'yoga extended puppy pose kneeling arrangement, knees grounded, torso folded forward, forearms crossed under the chin, hands tucked below the jaw' },
  { id: 'kneeling-one-knee', base: 'kneeling', zh: '單膝跪地', en: 'one-knee kneeling arrangement' },
  { id: 'kneeling-side', base: 'kneeling', zh: '跪姿側身', en: 'side-facing kneeling arrangement' },
  { id: 'kneeling-upright-poised', base: 'kneeling', zh: '直立端正跪姿', en: 'upright poised kneeling arrangement, torso vertical with stable knee support' },
  { id: 'kneeling-side-sit', base: 'kneeling', zh: '側坐跪姿', en: 'side-sitting kneeling arrangement, hips lowered beside the legs with a soft lateral body line' },
  { id: 'kneeling-one-knee-forward', base: 'kneeling', zh: '單膝前跨跪姿', en: 'one-knee-forward kneeling arrangement, front knee bent with the other knee grounded' },
  { id: 'kneeling-elbow-support', base: 'kneeling', zh: '手肘支撐跪姿', en: 'kneeling arrangement with elbows or forearms supporting the upper body on a nearby surface' },
  { id: 'kneeling-back-arched', base: 'kneeling', zh: '跪姿微後仰', en: 'slightly backward-arched kneeling arrangement, torso leaning back with balanced knee support' },
  { id: 'squatting-natural', base: 'squatting', zh: '自然蹲姿', en: 'natural squatting arrangement' },
  { id: 'squatting-one-knee', base: 'squatting', zh: '單膝蹲姿', en: 'one-knee squatting arrangement' },
  { id: 'squatting-hands-knees', base: 'squatting', zh: '手扶膝蓋蹲姿', en: 'squatting arrangement with hands resting on the knees' },
  { id: 'squatting-compact', base: 'squatting', zh: '緊湊蹲姿', en: 'compact low squatting arrangement' },
  { id: 'squatting-side', base: 'squatting', zh: '側身蹲姿', en: 'side-facing squatting arrangement' },
  { id: 'squatting-hug-knees', base: 'squatting', zh: '抱膝蹲', en: 'hugging-knees squat, compact grounded body shape' },
  { id: 'squatting-one-hand-ground', base: 'squatting', zh: '單手撐地蹲', en: 'squatting arrangement with one hand supporting on the ground' },
  { id: 'squatting-low-one-leg-forward', base: 'squatting', zh: '低蹲單腿前伸', en: 'low squat with one leg extended forward, compact support leg, clear asymmetrical silhouette' },
  { id: 'squatting-side-low', base: 'squatting', zh: '側身低蹲', en: 'side-facing low squat, torso and legs oriented laterally with readable profile line' },
  { id: 'squatting-raised-heels', base: 'squatting', zh: '腳跟抬起蹲姿', en: 'raised-heel squatting arrangement, heels lightly lifted, body balanced on the balls of the feet' },
  { id: 'squatting-forward-lean', base: 'squatting', zh: '蹲姿身體前傾', en: 'forward-leaning squatting arrangement, upper body angled toward the knees, grounded center of weight' },
  { id: 'squatting-compact-hug-knees-variant', base: 'squatting', zh: '緊湊抱膝蹲姿變體', en: 'compact knees-held squat variation, legs close together, body folded into a smaller grounded shape' },
  { id: 'squatting-knees-together-low', base: 'squatting', zh: '雙膝合併低蹲', en: 'low compact squat with both knees pressed together and feet grounded close under the body with thighs close and parallel forming a compact front-facing lower-body shape' },
  { id: 'lying-natural', base: 'lying', zh: '自然躺姿', en: 'natural lying arrangement' },
  { id: 'lying-on-back', base: 'lying', zh: '仰躺', en: 'lying on the back, relaxed upward-facing body line' },
  { id: 'lying-side', base: 'lying', zh: '側躺', en: 'side-lying arrangement, body turned along one side' },
  { id: 'lying-prone', base: 'lying', zh: '趴臥', en: 'prone lying arrangement, body resting forward on the surface' },
  { id: 'lying-half-reclined', base: 'lying', zh: '半躺倚靠', en: 'half-reclined lying arrangement with the upper body softly supported' },
  { id: 'lying-languid', base: 'lying', zh: '隨性慵懶', en: 'casually languid lying arrangement, relaxed uneven limbs, soft body weight settled into the surface' },
  { id: 'lying-side-knees-bent', base: 'lying', zh: '側躺屈膝', en: 'side-lying arrangement with both knees softly bent, compact curved body line' },
  { id: 'lying-on-back-one-arm-overhead', base: 'lying', zh: '仰躺單手過頭', en: 'lying on the back with one arm extended overhead, relaxed elongated body line' },
  { id: 'lying-prone-elbow-prop', base: 'lying', zh: '趴臥手肘撐起', en: 'prone lying arrangement with elbows propping up the upper body' },
  { id: 'lying-diagonal-recline', base: 'lying', zh: '斜向半躺', en: 'diagonal reclining arrangement, body angled across the support surface with relaxed limbs' },
  { id: 'lying-legs-bent-up', base: 'lying', zh: '躺姿雙腿屈起', en: 'lying arrangement with both legs bent upward, knees raised while the back stays supported' },
];
const POSE_COMPOSER_HAND_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不指定手部姿勢。', meta: { tags: ['none'] } },
  { id: 'random', zh: '隨機', en: 'random hand pose', desc: '隨機選擇手部姿勢。', meta: { tags: ['random'] } },
  { id: 'model-natural-hand-placement', zh: '模型自然決定', en: 'let the image model choose natural varied hand placement fitted to the selected body pose support contact wardrobe and camera crop without defaulting to stiff arms at the sides', desc: '讓影像模型依目前身體姿勢自行決定自然手部位置。' },
  { id: 'hands-relaxed-down', zh: '雙手自然垂放', en: 'both hands resting naturally along the body or on a nearby support surface' },
  { id: 'hands-in-pockets', zh: '雙手插口袋', en: 'both hands tucked into pockets' },
  { id: 'arms-crossed', zh: '雙臂交疊', en: 'arms crossed loosely in front of the body' },
  { id: 'hands-on-waist', zh: '雙手撐腰', en: 'both hands placed on the waist or hip line with elbows naturally adapted to the pose' },
  { id: 'one-hand-chin', zh: '單手摸下巴', en: 'one hand touching the chin' },
  { id: 'one-hand-forehead', zh: '單手扶額 / 摸頭', en: 'one hand touching the forehead or hair' },
  { id: 'hands-behind-back', zh: '雙手背在身後', en: 'both hands drawn behind the back or torso only where physically plausible for the selected pose' },
  { id: 'one-hand-hair', zh: '單手撩髮', en: 'one hand brushing hair back from the side of the face, fingers visibly touching the hair near the temple or ear' },
  { id: 'hands-on-thighs', zh: '雙手放在大腿上', en: 'both hands resting on the thighs or nearest upper-leg surface' },
  { id: 'hands-on-cheeks', zh: '雙手扶臉頰', en: 'both hands gently holding the cheeks' },
  { id: 'one-hand-chin-other-down', zh: '單手托下巴', en: 'one hand supporting the chin with the other hand relaxed along the body or support surface' },
  { id: 'one-hand-adjust-glasses', zh: '單手扶眼鏡', en: 'one hand adjusting the glasses at the frame or bridge, fingertips visibly touching the eyewear' },
  { id: 'one-hand-pull-down-glasses', zh: '單手把眼鏡拉下', en: 'one hand pulling the glasses slightly down the nose bridge, eyes visible above the frame' },
  { id: 'one-hand-mouth-corner', zh: '單手碰嘴角', en: 'one hand lightly touching the corner of the mouth, fingertips near the lower lip' },
  { id: 'one-hand-half-face-cover', zh: '單手遮住半邊臉', en: 'one hand partially covering one side of the face, fingers framing the cheek and eye area' },
  { id: 'both-hands-arrange-hair', zh: '雙手整理頭髮', en: 'both hands lifting and gathering the hair behind the head as if preparing to tie it up with fingers visibly holding the hair together' },
  { id: 'one-hand-nape-hair-lift', zh: '單手撩起後頸頭髮', en: 'one hand lifting hair away from the nape of the neck, fingers placed behind the ear or lower hairline' },
  { id: 'one-hand-collarbone', zh: '單手搭在鎖骨', en: 'one hand resting across the collarbone, fingertips lightly touching the upper chest line' },
  { id: 'one-hand-waist-one-down', zh: '一手扶腰一手自然放下', en: 'one hand on the waist or hip line with the other hand relaxed along the body or nearby support surface' },
  { id: 'one-hand-ground-one-leg', zh: '一手撐地一手放腿上', en: 'one hand supporting on the floor or nearby surface with the other hand resting on the leg' },
  { id: 'one-hand-knee-one-down', zh: '一手扶膝一手垂放', en: 'one hand holding the knee with the other hand relaxed beside the body or support surface' },
  { id: 'hands-clasped-front', zh: '雙手在身前交握', en: 'both hands clasped loosely in front of the body' },
  { id: 'one-hand-shoulder', zh: '單手搭肩', en: 'one hand resting on the opposite shoulder, fingers visibly touching the shoulder line' },
  { id: 'both-hands-overhead', zh: '雙手舉過頭頂', en: 'both hands raised overhead, arms extended naturally without stiff symmetry' },
  { id: 'one-hand-ankle', zh: '單手扶腳踝', en: 'one hand holding the ankle, fingers visibly touching the ankle or shoe area' },
  { id: 'hands-behind-head', zh: '雙手放在頭後', en: 'both hands placed behind the head, elbows angled outward naturally' },
  { id: 'hands-gathered-lower-abdomen', zh: '雙手收在腹前', en: 'both hands gathered close in front of the lower abdomen with wrists and fingers softly folded together and elbows tucked inward near the knees in a compact low pose' },
];
const POSE_COMPOSER_HEAD_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不指定頭部方向。', meta: { tags: ['none'] } },
  { id: 'random', zh: '隨機', en: 'random head direction', desc: '隨機選擇頭部方向。', meta: { tags: ['random'] } },
  { id: 'model-natural-head-angle', zh: '模型自然決定', en: 'let the image model choose a natural head angle and orientation compatible with the camera angle body orientation and selected pose', desc: '讓影像模型依鏡頭、身體方向與姿勢自行決定自然頭部角度。' },
  { id: 'head-camera-natural', zh: '頭部自然朝向鏡頭', en: 'head naturally facing the camera' },
  { id: 'head-slight-tilt', zh: '頭部微微側傾', en: 'head slightly tilted' },
  { id: 'chin-slightly-raised', zh: '下巴微抬', en: 'chin slightly raised' },
  { id: 'chin-slightly-lowered', zh: '下巴微收', en: 'chin slightly lowered' },
  { id: 'head-turned-away', zh: '側臉轉向畫面外', en: 'head turned into a three-quarter side profile facing out of frame' },
  { id: 'head-turned-back-camera', zh: '回頭朝向鏡頭', en: 'head turned back toward the camera' },
  { id: 'head-looking-down-hands', zh: '低頭看向手部', en: 'head lowered toward the hands' },
  { id: 'head-near-shoulder', zh: '頭靠近肩膀', en: 'head angled close to one shoulder' },
  { id: 'head-slightly-back', zh: '頭部微微後仰', en: 'head tilted slightly backward with the chin softly lifted' },
  { id: 'head-down-three-quarter', zh: '低頭三分之四側臉', en: 'head lowered into a three-quarter side angle' },
  { id: 'head-over-shoulder', zh: '越肩回望', en: 'head turned over one shoulder toward the camera' },
  { id: 'head-away-profile', zh: '側臉看向遠方', en: 'head turned into a clean side profile with the face oriented away from the camera' },
  { id: 'chin-tucked-shoulder-line', zh: '下巴靠近肩線', en: 'chin tucked toward one shoulder line with the neck softly folded by the selected pose' },
  { id: 'head-close-support-surface', zh: '頭部貼近支撐面', en: 'head angled close to a support surface or shoulder line with the cheek plane following the selected support contact' },
  { id: 'head-close-lens-off-axis', zh: '近鏡頭偏轉頭部', en: 'head turned slightly off-axis near the lens with the face plane angled diagonally instead of flat to camera' },
  { id: 'head-low-rim-support', zh: '頭靠近邊緣支撐', en: 'head angled low near a rim or support edge with cheek and jawline close to the supporting surface' },
];
const POSE_COMPOSER_ANCHOR_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不指定接觸或支撐物。', meta: { tags: ['none'] } },
  { id: 'random', zh: '隨機', en: 'random pose anchor', desc: '依姿勢基底隨機選擇接觸或支撐物。', meta: { tags: ['random'] } },
  { id: 'standing-wall', base: 'standing', zh: '靠牆', en: 'leaning against a wall' },
  { id: 'standing-doorway', base: 'standing', zh: '站在門框邊', en: 'standing beside a doorway frame' },
  { id: 'standing-table-edge', base: 'standing', zh: '站在桌邊', en: 'standing beside a table edge' },
  { id: 'standing-railing', base: 'standing', zh: '站在欄杆旁', en: 'standing beside a railing' },
  { id: 'standing-chair-side', base: 'standing', zh: '站在椅子旁', en: 'standing beside a chair' },
  { id: 'standing-window', base: 'standing', zh: '站在窗邊', en: 'standing beside a window' },
  { id: 'standing-column', base: 'standing', zh: '站在柱子旁', en: 'standing beside a column' },
  { id: 'standing-vending-machine', base: 'standing', zh: '站在自動販賣機旁', en: 'standing beside a vending machine' },
  { id: 'standing-lean-railing', base: 'standing', zh: '靠在欄杆', en: 'leaning lightly against a railing, body weight partially supported by the railing' },
  { id: 'standing-lean-table-edge', base: 'standing', zh: '倚靠桌邊', en: 'standing with one hip resting against a table edge, relaxed supported posture' },
  { id: 'standing-lean-doorway-shoulder', base: 'standing', zh: '肩靠門框', en: 'standing with one shoulder leaning against a doorway frame, relaxed supported posture' },
  { id: 'standing-lean-window-frame', base: 'standing', zh: '倚靠窗框', en: 'standing beside a window frame with the side of the body lightly supported by a window frame' },
  { id: 'standing-lean-column-side', base: 'standing', zh: '側身靠柱', en: 'standing with the side or back lightly leaning against a column, body weight naturally supported' },
  { id: 'standing-lean-chair-back', base: 'standing', zh: '倚著椅背', en: 'standing beside a chair with the body lightly leaning against the chair back' },
  { id: 'standing-lean-vending-machine', base: 'standing', zh: '側身靠自動販賣機', en: 'standing with one shoulder or side leaning against a vending machine, relaxed supported posture' },
  { id: 'standing-lean-scene-object', base: 'standing', zh: '倚靠現有場景物件', en: 'leaning against any suitable existing object within the current scene, body weight lightly supported by that existing scene object, using only a naturally available scene object for support' },
  { id: 'sitting-floor', base: 'sitting', zh: '坐在地板', en: 'sitting on the floor' },
  { id: 'sitting-scene-appropriate-chair', base: 'sitting', zh: '坐在椅子上', en: 'sitting on a chair that naturally fits the current scene with the chair style material and scale chosen to match the environment' },
  { id: 'sitting-ornate-velvet-armchair', base: 'sitting', zh: '坐在單人雕花絨布椅', en: 'lounging on an ornate single velvet armchair' },
  { id: 'sitting-bed-edge', base: 'sitting', zh: '坐在床邊', en: 'sitting on the edge of a bed' },
  { id: 'sitting-table-edge', base: 'sitting', zh: '坐在桌面邊緣', en: 'sitting on the edge of a tabletop' },
  { id: 'sitting-stairs', base: 'sitting', zh: '坐在樓梯台階', en: 'sitting on stair steps' },
  { id: 'sitting-bar-stool', base: 'sitting', zh: '坐在吧台高腳椅', en: 'sitting on a bar stool' },
  { id: 'sitting-sofa-seat', base: 'sitting', zh: '坐在沙發座面', en: 'sitting on a sofa seat' },
  { id: 'sitting-window-sill', base: 'sitting', zh: '坐在窗台', en: 'sitting on a window sill' },
  { id: 'sitting-high-back-chair', base: 'sitting', zh: '坐在高背椅', en: 'sitting on a high-back chair' },
  { id: 'kneeling-floor', base: 'kneeling', zh: '跪在地面', en: 'kneeling on the ground' },
  { id: 'kneeling-bed', base: 'kneeling', zh: '跪在床上', en: 'kneeling on a bed' },
  { id: 'kneeling-sofa-seat', base: 'kneeling', zh: '跪在沙發座面', en: 'kneeling on a sofa seat' },
  { id: 'kneeling-chair-front', base: 'kneeling', zh: '跪在椅子前', en: 'kneeling in front of a chair' },
  { id: 'kneeling-high-back-lean', base: 'kneeling', zh: '倚靠高背椅', en: 'leaning against a high-back chair' },
  { id: 'kneeling-hands-ground', base: 'kneeling', zh: '雙手支撐在地面', en: 'both hands supporting on the ground' },
  { id: 'kneeling-high-back-front', base: 'kneeling', zh: '跪在高背椅前', en: 'kneeling in front of a high-back chair' },
  { id: 'kneeling-low-table-front', base: 'kneeling', zh: '跪在矮桌前', en: 'kneeling in front of a low table' },
  { id: 'kneeling-bed-edge-lean', base: 'kneeling', zh: '跪在床邊倚靠', en: 'kneeling beside the edge of a bed with the upper body lightly supported' },
  { id: 'squatting-ground', base: 'squatting', zh: '蹲在地面', en: 'squatting on the ground' },
  { id: 'squatting-wall', base: 'squatting', zh: '蹲在牆邊', en: 'squatting beside a wall' },
  { id: 'squatting-chair-front', base: 'squatting', zh: '蹲在椅子前', en: 'squatting in front of a chair' },
  { id: 'squatting-low-step', base: 'squatting', zh: '蹲在低矮台階上', en: 'squatting on a low step' },
  { id: 'squatting-railing', base: 'squatting', zh: '蹲在欄杆旁', en: 'squatting beside a railing' },
  { id: 'squatting-vending-machine', base: 'squatting', zh: '蹲在自動販賣機旁', en: 'squatting beside a vending machine' },
  { id: 'squatting-column', base: 'squatting', zh: '蹲在柱子旁', en: 'squatting beside a column' },
  { id: 'lying-bed', base: 'lying', zh: '躺在床上', en: 'lying on a bed' },
  { id: 'lying-sofa', base: 'lying', zh: '躺在沙發上', en: 'lying on a sofa' },
  { id: 'lying-floor', base: 'lying', zh: '躺在地板', en: 'lying on the floor' },
  { id: 'lying-rug', base: 'lying', zh: '躺在地毯上', en: 'lying on a rug' },
  { id: 'lying-bed-edge', base: 'lying', zh: '半躺在床邊', en: 'reclining along the edge of a bed' },
  {
    id: 'shared-bathtub',
    bases: ['standing', 'sitting', 'squatting', 'lying'],
    zh: '浴缸',
    en: 'near a water-filled clawfoot vintage bathtub',
    phraseByBase: {
      standing: 'standing beside a water-filled clawfoot vintage bathtub',
      sitting: 'sitting on the edge of a water-filled clawfoot vintage bathtub',
      squatting: 'squatting inside a water-filled clawfoot vintage bathtub',
      lying: 'reclining inside a water-filled clawfoot vintage bathtub',
    },
  },
];

const FIXED_COMPOSITION_SET_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不使用固定構圖場景。', meta: { tags: ['none'] } },
  {
    id: 'concrete-wall-chesterfield-sofa',
    zh: '清水模牆面沙發棚',
    en: 'The portrait takes place inside a real-scale compact living-room editorial set, not a flat backdrop and not a tight subject portrait. Treat the fixed set as the primary composition: a raw concrete wall fills the back plane, a large brown vintage Chesterfield leather sofa occupies most of the lower set space, with thick rolled armrests, high tufted backrest, and deep adult-sized seat cushions clearly visible. Bare sculptural dry branches stand beside the sofa, and a normal-height coffee table sits in front with art books, a cup, a small lamp, and textured cushions as readable interaction props. Use an eye-level straight-on frontal camera, pulled back enough to show the subject inside the room',
    integrityEn: 'fixed set integrity: preserve the raw concrete wall, large brown vintage Chesterfield leather sofa, and bare sculptural branches as the selected set anchors, with the low coffee table, books, lamp, cup, and cushions available as interaction props',
    scaleGuardEn: 'normal adult-scale furniture-to-body relationship: standard adult two-seat sofa and normal-height coffee table; subject fits naturally on the seat plane or floor plane; do not enlarge the subject or shrink the sofa or table',
    replacementGuardEn: 'do not replace the fixed set with a plain studio backdrop, bedroom, cafe, outdoor street, or unrelated room',
    desc: '灰色清水模牆、枯樹枝、棕色復古 Chesterfield 皮沙發、茶几書本與桌燈構成的固定 editorial set。',
    aspectRatioId: '1:1',
    meta: { tags: ['fixed_composition_set', 'single_subject_only', 'indoor', 'sofa_set', 'square_set'] },
  },
  {
    id: 'luxury-hotel-window-nyc',
    zh: '高級飯店落地窗都市夜景',
    en: 'The portrait takes place inside a real-scale luxury hotel room editorial set, not a flat backdrop and not a tight subject portrait. Treat the fixed set as the primary composition: an ultra-large panoramic floor-to-ceiling glass wall fills almost the entire back plane, like one continuous clear window surface overlooking a New York-style high-rise city skyline. The glass should feel broad, open, and mostly uninterrupted, with only minimal slim structural seams near the far edges if needed. Avoid grid-like window panels, heavy black frames, boxed window sections, many repeated dividers, balcony doors, or apartment-style segmented windows. A bed with soft white rumpled bedding occupies the lower part of the room, with pillows, a bedside table, wine glass, open book, warm hotel lamp, and subtle room-depth details as readable interaction props. Use an eye-level straight-on frontal camera, pulled back enough to show the subject inside the room',
    integrityEn: 'fixed set integrity: preserve the oversized panoramic glass wall, New York-style skyline, bed or bedding foreground, pillows, bedside table, wine glass, book, and warm hotel lamp as the selected set anchors',
    replacementGuardEn: 'do not replace the fixed set with a generic bedroom, plain wall, cafe, outdoor street, studio backdrop, or unrelated hotel room',
    desc: '高級飯店房間、床面前景、超大片連續落地玻璃牆與紐約式高樓城市背景構成的窗景 set。',
    aspectRatioId: '1:1',
    meta: { tags: ['fixed_composition_set', 'single_subject_only', 'indoor', 'hotel_window_set', 'square_set'] },
  },
  {
    id: 'retro-tile-bathtub',
    zh: '復古磁磚浴室浴缸',
    en: 'fixed bathroom set, eye-level straight-on frontal camera, freestanding clawfoot bathtub shown broadside across the lower center of the frame and parallel to the camera, visible floor plane beneath and in front of the bathtub, wet vintage tile floor, small puddles and water reflections on the floor, flat frontal vintage tiled bathroom wall behind the bathtub, porcelain sink or vanity on one side with a mirror above it, chrome faucet hardware, wall lamp, folded towels, bath bottles, small wooden stool, foam or water surface, subtle steam, subject fully soaked from head to toe with wet hair, damp skin, and water-clinging wardrobe or bare skin',
    integrityEn: 'fixed set integrity: preserve the broadside bathtub, visible wet vintage tile floor plane, flat frontal vintage tiled wall, porcelain sink or vanity, mirror above it, foam or water surface, chrome bath hardware, puddles, and water reflections as the selected set anchors',
    replacementGuardEn: 'do not replace the fixed set with a shower room, bedroom, pool, plain studio backdrop, spa lobby, or unrelated bathroom; no diagonal corner view, no 3/4 bathroom angle, no side-wall perspective, no camera from inside the tub, no low tub-edge POV, no overhead angle, no dutch tilt',
    desc: '復古磁磚浴室、正面橫置浴缸、洗臉台、鏡子、壁燈、毛巾與瓶罐構成的浴室 set。',
    aspectRatioId: '1:1',
    meta: { tags: ['fixed_composition_set', 'single_subject_only', 'indoor', 'bathtub_set', 'square_set'] },
  },
];

const FIXED_SET_POSITION_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不指定固定場景內的人物位置。', meta: { tags: ['none'] } },
  {
    id: 'sofa-foreground',
    setId: 'concrete-wall-chesterfield-sofa',
    zh: '近鏡頭沙發前方',
    en: 'subject in the foreground in front of the sofa, with the sofa becoming a background layer; standing, crouching, floor sitting, or close-lens behavior can be model-decided',
  },
  {
    id: 'sofa-seat-center',
    setId: 'concrete-wall-chesterfield-sofa',
    zh: '沙發座面中央',
    en: 'subject placed on the sofa seat plane; sitting, lounging, half-reclining, lying, or leaning on an armrest can be model-decided',
  },
  {
    id: 'sofa-wall-back',
    setId: 'concrete-wall-chesterfield-sofa',
    zh: '沙發後方靠牆',
    en: 'subject near the wall behind or around the sofa, with the sofa as a horizontal foreground anchor; standing, wall-leaning, or forward-leaning behavior can be model-decided',
  },
  {
    id: 'sofa-armrest-foreground-occlusion',
    setId: 'concrete-wall-chesterfield-sofa',
    zh: '沙發扶手前景遮擋',
    en: 'subject partly hidden by the sofa armrest or leather cushion edge in the foreground; foreground occlusion, partial body crop, or close-lens layering can be model-decided',
  },
  {
    id: 'sofa-floor-off-center',
    setId: 'concrete-wall-chesterfield-sofa',
    zh: '沙發地面偏離中心',
    en: 'subject on the floor plane near the sofa but off center, allowing asymmetrical spacing, cropped limbs, or casual distance from the sofa without prescribing an exact pose',
  },
  {
    id: 'hotel-bed-foreground',
    setId: 'luxury-hotel-window-nyc',
    zh: '近鏡頭床面前景',
    en: 'subject close to the camera or bed foreground; the city view can be partially blocked or softened',
  },
  {
    id: 'hotel-bed-window-side',
    setId: 'luxury-hotel-window-nyc',
    zh: '床邊靠窗',
    en: 'subject around the bed edge or window-side mid-plane; body, bedding, glass, and city depth can all remain readable',
  },
  {
    id: 'hotel-window-silhouette',
    setId: 'luxury-hotel-window-nyc',
    zh: '窗前城市剪影',
    en: 'subject near the floor-to-ceiling window; city towers become the dominant background, allowing profile, back-view, window-gazing, or silhouette-like behavior',
  },
  {
    id: 'hotel-window-frame-close',
    setId: 'luxury-hotel-window-nyc',
    zh: '近鏡頭窗框邊緣',
    en: 'subject very near the lens along the window-frame edge, allowing partial face, shoulder, hair, or half-body crop while the city window remains a recognizable layer',
  },
  {
    id: 'hotel-bedding-foreground-occlusion',
    setId: 'luxury-hotel-window-nyc',
    zh: '床單前景遮擋',
    en: 'soft bedding or pillow shapes become a foreground occlusion layer in front of the subject, with the body distance and exact interaction left to the image model',
  },
  {
    id: 'bathtub-center',
    setId: 'retro-tile-bathtub',
    zh: '浴缸內中央',
    en: 'subject in the middle of the bathtub, surrounded by foam and tub edges; face and upper body can remain the main portrait anchor',
  },
  {
    id: 'bathtub-low-foreground',
    setId: 'retro-tile-bathtub',
    zh: '浴缸前景遮擋',
    en: 'bathtub rim, foam, water surface, towels, bottles, or partial body forms may create lower foreground occlusion and focus variation while the camera remains eye-level and frontal',
  },
  {
    id: 'bathtub-rim-edge',
    setId: 'retro-tile-bathtub',
    zh: '浴缸邊緣',
    en: 'subject close to the bathtub edge; sitting on the rim, holding the rim, or leaning from inside the tub can be model-decided',
  },
  {
    id: 'bathtub-rim-close-crop',
    setId: 'retro-tile-bathtub',
    zh: '浴缸邊近鏡頭裁切',
    en: 'subject very close to the camera at the bathtub rim, allowing partial face, shoulder, knees, feet, or torso fragments to enter the foreground without prescribing exact pose',
  },
  {
    id: 'bathtub-foam-foreground-occlusion',
    setId: 'retro-tile-bathtub',
    zh: '泡泡前景遮擋',
    en: 'foam bubbles and water surface create foreground occlusion around the subject, allowing parts of the body or face to be softened, hidden, or out of focus',
  },
];

const FIXED_SET_CAPTURE_MODE_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', meta: { tags: ['none'] } },
  {
    id: 'photographer-shot',
    zh: '攝影師拍攝',
    en: 'photographer-shot fixed set portrait, subject arranged within the selected set, fixed composition remains readable, face and wardrobe generally clear where framing allows',
    meta: { tags: ['fixed_set_photographer_shot'] },
  },
  {
    id: 'natural-self-shot',
    zh: '自然自拍感',
    en: 'self-shot social composition feeling, subject may move close to the lens, off-center partial face or half-body crop allowed, fixed set may remain only as recognizable background fragments, no visible phone required',
    meta: { tags: ['fixed_set_self_shot'] },
  },
  {
    id: 'imperfect-self-shot',
    zh: '失控自拍感',
    en: 'imperfect self-shot camera behavior, focus may fall on the background or set objects instead of the face, subject may be slightly blurred or partially cropped, fixed set may remain only as recognizable background fragments, casual accidental framing, real social snapshot imperfection, no visible phone required',
    meta: { tags: ['fixed_set_self_shot', 'fixed_set_imperfect_focus'] },
  },
];

const FIXED_SET_PERFORMANCE_STATE_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', meta: { tags: ['none'] } },
  {
    id: 'model-natural',
    zh: '模型自然發揮',
    en: 'let the image model choose a natural body attitude and expression that fits the selected fixed set position and capture mode',
  },
  {
    id: 'confident-powerful',
    zh: '自信力量感',
    en: 'confident powerful presence, strong self-possessed attitude, assertive body energy, direct control of the frame without specifying exact limb placement',
  },
  {
    id: 'lazy-drained',
    zh: '慵懶無力感',
    en: 'lazy drained presence, softened body energy, relaxed weight sinking into the set, unforced tired attitude without specifying exact limb placement',
  },
  {
    id: 'detached-cool',
    zh: '冷淡疏離感',
    en: 'detached cool presence, emotionally distant attitude, minimal outward reaction, restrained body energy without specifying exact limb placement',
  },
  {
    id: 'playful-provocative',
    zh: '俏皮挑釁感',
    en: 'playful provocative presence, teasing confidence, mischievous frame awareness, lively social energy without specifying exact limb placement',
  },
  {
    id: 'quiet-vulnerable',
    zh: '安靜脆弱感',
    en: 'quiet vulnerable presence, softened guarded emotion, delicate inner tension, small protective body energy without specifying exact limb placement',
  },
  {
    id: 'urban-fatigue',
    zh: '都市疲憊感',
    en: 'urban fatigue presence, late-night city exhaustion, heavy relaxed energy, candid tired attitude without specifying exact limb placement',
  },
  {
    id: 'dreamlike-dazed',
    zh: '夢遊恍神感',
    en: 'dreamlike dazed presence, slightly absent focus, half-awake social snapshot mood, drifting body energy without specifying exact limb placement',
  },
  {
    id: 'elegant-restrained',
    zh: '優雅克制感',
    en: 'elegant restrained presence, composed quiet poise, controlled emotion, refined low-key body energy without specifying exact limb placement',
  },
  {
    id: 'chaotic-candid',
    zh: '失控隨性感',
    en: 'chaotic candid presence, accidental spontaneous attitude, loose unplanned body energy, imperfect social snapshot timing without specifying exact limb placement',
  },
];

const LOCK_DEFINITIONS = [
  { key: 'subjectCount', label: '人物數量', options: SUBJECT_COUNT_OPTIONS, required: true, defaultValue: '1', section: 'core' },
  { key: 'specialSubjectId', label: '特殊角色', options: SPECIAL_SUBJECT_OPTIONS, defaultValue: 'none', section: 'character' },
  { key: 'aspectRatio', label: '畫面比例', options: ASPECT_RATIO_OPTIONS, required: true, defaultValue: 'random', section: 'core' },
  { key: 'styleId', label: '攝影風格', category: '攝影風格', section: 'core' },
  { key: 'cameraSystemId', label: '舊相機', options: CAMERA_SYSTEM_OPTIONS, section: 'hidden' },
  { key: 'sceneAttributeId', label: '場景屬性', options: SCENE_ATTRIBUTE_OPTIONS, section: 'core' },
  { key: 'locationId', label: '場景', category: null, section: 'core' },
  { key: 'importedWorldSceneMode', label: '匯入世界場景模式', defaultValue: 'none', section: 'hidden' },
  { key: 'importedWorldSceneLabel', label: '匯入世界場景標籤', section: 'hidden' },
  { key: 'importedWorldSceneArchitectureText', label: '匯入世界場景架構', section: 'hidden' },
  { key: 'fixedCompositionSetId', label: '固定構圖場景', options: FIXED_COMPOSITION_SET_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'core' },
  { key: 'fixedSetPositionId', label: '固定場景人物位置', options: FIXED_SET_POSITION_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'core' },
  { key: 'fixedSetCaptureModeId', label: '固定場景拍攝型態', options: FIXED_SET_CAPTURE_MODE_OPTIONS, defaultValue: 'photographer-shot', suppressDefaultRandomOption: true, section: 'core' },
  { key: 'fixedSetPerformanceStateId', label: '固定場景演出狀態', options: FIXED_SET_PERFORMANCE_STATE_OPTIONS, defaultValue: 'model-natural', suppressDefaultRandomOption: true, section: 'core' },
  { key: 'framingId', label: '構圖景別', category: '景別構圖 (Framing)', section: 'core' },
  { key: 'angleId', label: '俯仰角度', category: '相機視角 (Angle)', section: 'core' },
  { key: 'orbitId', label: '環繞角度', category: '拍攝方位 (Orbit Angle)', section: 'core' },
  { key: 'lensId', label: '鏡頭焦段', category: FOCAL_LENGTH_CATEGORY, section: 'core' },
  { key: 'opticalEffectId', label: '光學效果', category: OPTICAL_EFFECTS_CATEGORY, section: 'core' },
  { key: 'lightingId', label: '環境光條件', category: AMBIENT_LIGHT_CONDITIONS_CATEGORY, section: 'core' },
  { key: 'lightDirectionId', label: '光線表現', category: LIGHT_STYLE_CATEGORY, section: 'core' },
  { key: 'filmId', label: '成像模擬 / 調色', category: '底片與相機模擬 (Camera & Film Simulation)', section: 'core' },
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
  { key: 'duoPoseId', label: '雙人構圖姿態', options: DUO_POSE_OPTIONS, section: 'character' },
  { key: 'expressionId', label: '神情眼神', category: '神情與眼神 (Expression & Gaze)', section: 'character' },
  { key: 'expressionAId', label: '人物 1 神情眼神', category: '神情與眼神 (Expression & Gaze)', section: 'character' },
  { key: 'expressionBId', label: '人物 2 神情眼神', category: '神情與眼神 (Expression & Gaze)', section: 'character' },
  { key: 'poseId', label: '姿勢動作', category: '姿勢與肢體語言 (Pose & Body Language)', section: 'character' },
  { key: 'specialActionId', label: '特殊動作', category: '特殊動作 (Special Actions)', section: 'character' },
  { key: 'poseBaseId', label: '姿勢基底', options: POSE_COMPOSER_BASE_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'character' },
  { key: 'poseArrangementId', label: '肢體變化', options: POSE_COMPOSER_ARRANGEMENT_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'character' },
  { key: 'poseHandId', label: '手部姿勢', options: POSE_COMPOSER_HAND_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'character' },
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
  { key: 'fixedSetCaptureModeId', label: 'Fixed Set Capture Mode' },
  { key: 'fixedSetPerformanceStateId', label: 'Fixed Set Performance State' },
  { key: 'framingId', label: 'Framing' },
  { key: 'angleId', label: 'Angle' },
  { key: 'orbitId', label: 'Orbit' },
  { key: 'lensId', label: 'Lens' },
  { key: 'opticalEffectId', label: 'Optical Effect' },
  { key: 'lightingId', label: 'Ambient Light Conditions' },
  { key: 'lightDirectionId', label: 'Subject Light Style' },
  { key: 'filmId', label: 'Rendering / Color Grade' },
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
  { key: 'duoPoseId', label: 'Duo Composition Pose' },
  { key: 'expressionId', label: 'Expression' },
  { key: 'expressionAId', label: 'Woman 1 Expression' },
  { key: 'expressionBId', label: 'Woman 2 Expression' },
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

const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sampleNonNone = (arr) => {
  const nonNone = arr.filter((item) => !isNoneLikeItem(item));
  return sample(nonNone.length > 0 ? nonNone : arr);
};
const isRandomOption = (item) => item?.id === 'random';

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

function getTopBottomPaletteOption(id) {
  const option = TOP_BOTTOM_PALETTE_OPTIONS.find((item) => item.id === id) || null;
  if (!option || option.id === 'none') return null;
  if (option.random) return sample(TOP_BOTTOM_PALETTE_POOL);
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
    if (hasAny(haystack, ['夜晚街燈', 'streetlit night'])) {
      tags.push('artificial_light', 'dark', 'night_ambient', 'supports_outdoor', 'supports_urban', 'supports_commercial', 'supports_subterranean');
    }
    if (hasAny(haystack, ['月光夜色', 'moonlit night'])) {
      tags.push('natural_light', 'dark', 'cool', 'night_ambient', 'supports_outdoor', 'supports_natural', 'supports_urban');
    }
    if (item.zh === '霓虹夜色' || hasAny(haystack, ['neon night conditions'])) {
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
    if (hasAny(haystack, ['室內暖光夜景', 'indoor warm night'])) {
      tags.push('artificial_light', 'indoor', 'warm', 'dark', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_commercial', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內夜晚低照度暖光', 'indoor low-light warm night conditions'])) {
      tags.push('artificial_light', 'indoor', 'warm', 'dark', 'soft_light', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內派對暖光夜景', 'indoor house-party night environment'])) {
      tags.push('artificial_light', 'indoor', 'warm', 'dark', 'soft_light', 'supports_indoor', 'supports_residential');
    }
    if (hasAny(haystack, ['室內燭光', 'candlelit interior conditions'])) {
      tags.push('artificial_light', 'indoor', 'warm', 'dark', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內冷色人造光', 'indoor cool artificial'])) {
      tags.push('artificial_light', 'indoor', 'cool', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_commercial', 'supports_heritage', 'supports_subterranean');
    }
    if (hasAny(haystack, ['室內冷白螢光日常', 'indoor fluorescent everyday conditions'])) {
      tags.push('artificial_light', 'indoor', 'cool', 'controlled', 'supports_indoor', 'supports_residential', 'supports_commercial', 'supports_hospitality', 'supports_subterranean');
    }
    if (hasAny(haystack, ['室內外光滲入微暗空間', 'dim interior lit mostly by exterior spill light'])) {
      tags.push('window_light', 'natural_light', 'indoor', 'dark', 'diffused', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內深夜冷暗微光', 'very dark late-night interior'])) {
      tags.push('window_light', 'natural_light', 'indoor', 'dark', 'cool', 'night_ambient', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage', 'supports_subterranean');
    }
    if (hasAny(haystack, ['室內霓虹夜色', 'indoor neon-lit conditions'])) {
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

const CLOSEUP_MODE_ZH_LABELS = new Set(['臉部特寫', '胸上特寫', '局部五官特寫', '半臉傾斜特寫']);
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
  'styleId',
  'cameraSystemId',
  'framingId',
  'angleId',
  'orbitId',
  'lensId',
  'opticalEffectId',
  'lightingId',
  'lightDirectionId',
  'filmId',
  'facialFeaturesId',
  'facialFeaturesAId',
  'facialFeaturesBId',
  'skinDetailsId',
  'hairstyleId',
  'hairstyleAId',
  'hairstyleBId',
  'hairColorId',
  'hairColorAId',
  'hairColorBId',
  'expressionId',
  'expressionAId',
  'expressionBId',
  'poseId',
  'specialActionId',
  'duoPoseId',
  'duoInteractionId',
  'poseBaseId',
  'poseArrangementId',
  'poseHandId',
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
const CLOSEUP_CHEST_ALLOWED_KEYS = new Set([
  'locationId',
  'specialOutfitId',
  'specialOutfitAId',
  'specialOutfitBId',
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
  'topId',
  'topAId',
  'topBId',
  'topFitId',
  'topFitAId',
  'topFitBId',
  'topStylingId',
  'topStylingAId',
  'topStylingBId',
  'topBottomPaletteId',
  'topBottomPaletteAId',
  'topBottomPaletteBId',
  'topColorId',
  'topAColorId',
  'topBColorId',
  'topPatternId',
  'topAPatternId',
  'topBPatternId',
  'dressId',
  'dressAId',
  'dressBId',
  'dressColorId',
  'dressAColorId',
  'dressBColorId',
  'pantsId',
  'pantsAId',
  'pantsBId',
  'skirtId',
  'skirtAId',
  'skirtBId',
  'bottomFitId',
  'bottomFitAId',
  'bottomFitBId',
  'bottomRiseId',
  'bottomRiseAId',
  'bottomRiseBId',
  'bottomColorId',
  'bottomAColorId',
  'bottomBColorId',
  'bottomPatternId',
  'bottomAPatternId',
  'bottomBPatternId',
  'outerwearId',
  'outerwearFitId',
  'outerwearColorId',
  'outerwearPatternId',
  'outerwearOpeningId',
  'outerwearStylingId',
  'outerwearAId',
  'outerwearAFitId',
  'outerwearAColorId',
  'outerwearAPatternId',
  'outerwearAOpeningId',
  'outerwearAStylingId',
  'outerwearBId',
  'outerwearBFitId',
  'outerwearBColorId',
  'outerwearBPatternId',
  'outerwearBOpeningId',
  'outerwearBStylingId',
  'neckAccessoryId',
  'neckAccessoryAId',
  'neckAccessoryBId',
]);
const CLOSEUP_CONTEXT_ALLOWED_KEYS = new Set([
  ...CLOSEUP_CHEST_ALLOWED_KEYS,
  'locationId',
  'pantsId',
  'pantsAId',
  'pantsBId',
  'skirtId',
  'skirtAId',
  'skirtBId',
  'bottomFitId',
  'bottomFitAId',
  'bottomFitBId',
  'bottomRiseId',
  'bottomRiseAId',
  'bottomRiseBId',
  'bottomColorId',
  'bottomAColorId',
  'bottomBColorId',
  'bottomPatternId',
  'bottomAPatternId',
  'bottomBPatternId',
  'legwearId',
  'legwearAId',
  'legwearBId',
  'legwearColorId',
  'legwearAColorId',
  'legwearBColorId',
  'shoesId',
  'shoesAId',
  'shoesBId',
  'shoesColorId',
  'shoesAColorId',
  'shoesBColorId',
  'neckAccessoryId',
  'neckAccessoryAId',
  'neckAccessoryBId',
]);

function isCloseupModeFramingItem(framing) {
  return Boolean(framing?.zh && CLOSEUP_MODE_ZH_LABELS.has(framing.zh));
}

function isWormEyeAngleItem(angle) {
  return angle?.zh === WORM_EYE_ANGLE_LABEL;
}

function isWardrobeIncompatibleCloseupFramingItem() {
  return false;
}

export function isWardrobeIncompatibleCloseupFramingId(framingId, customLibrary = []) {
  if (!framingId) return false;
  const controls = getLockControls(customLibrary);
  const framingControl = controls.find((control) => control.key === 'framingId');
  const framing = findById(framingControl?.options || [], framingId);
  return isWardrobeIncompatibleCloseupFramingItem(framing);
}

export function hasEffectiveWardrobeLocks(rawLocks = {}, controls = getLockControls()) {
  const locks = normalizeLocks(rawLocks);
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

export function isCloseupModeFramingId(framingId, customLibrary = []) {
  if (!framingId) return false;
  const controls = getLockControls(customLibrary);
  const framingControl = controls.find((control) => control.key === 'framingId');
  const framing = findById(framingControl?.options || [], framingId);
  return isCloseupModeFramingItem(framing);
}

export function isWormEyeAngleId(angleId, customLibrary = []) {
  if (!angleId) return false;
  const controls = getLockControls(customLibrary);
  const angleControl = controls.find((control) => control.key === 'angleId');
  const angle = findById(angleControl?.options || [], angleId);
  return isWormEyeAngleItem(angle);
}

export function getCloseupAllowedKeys(framingId, customLibrary = []) {
  const controls = getLockControls(customLibrary);
  const framingControl = controls.find((control) => control.key === 'framingId');
  const framing = findById(framingControl?.options || [], framingId);
  const allowed = new Set(CLOSEUP_ALWAYS_ALLOWED_KEYS);
  if (isCloseupModeFramingItem(framing)) {
    CLOSEUP_CONTEXT_ALLOWED_KEYS.forEach((key) => allowed.add(key));
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

  if (hasAny(haystack, ['shallow depth of field', 'focus plane', 'focus falloff', '景深', '焦平面'])) tags.push('depth_of_field');
  if (hasAny(haystack, ['foreground occlusion', 'foreground obstruction', 'near-field bokeh', '前景遮擋'])) tags.push('foreground_occlusion', 'depth_layering');
  if (hasAny(haystack, ['lens flare', 'veiling flare', 'ghosting', 'internal lens reflections', '鏡頭光斑'])) tags.push('light_artifact', 'flare_artifact');
  if (hasAny(haystack, ['anamorphic lens flare', 'cylindrical lens', 'horizontal flare', '變形鏡頭光斑'])) tags.push('light_artifact', 'anamorphic_artifact');
  if (hasAny(haystack, ['light leak', 'film-gate leaks', 'exposure burns', '漏光'])) tags.push('analog_artifact', 'light_leak');
  if (hasAny(haystack, ['soft focus', 'diffusion filter', 'lowered microcontrast', '柔焦'])) tags.push('soft_focus', 'diffusion_filter');
  if (hasAny(haystack, ['highlight bloom', 'halation', 'luminance bleeding', '霧化高光'])) tags.push('bloom', 'halation');
  if (hasAny(haystack, ['vignette', 'vignetting', 'frame corners', '暗角'])) tags.push('vignette');
  if (hasAny(haystack, ['chromatic aberration', 'rgb edge fringing', 'color separation', '色差'])) tags.push('chromatic_aberration');
  if (hasAny(haystack, ['edge blur', 'peripheral edge blur', 'field curvature', '邊緣模糊'])) tags.push('edge_blur');
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
  { legacy: ['站姿｜自然自拍姿勢', 9], poseZh: '站姿｜自然站姿', specialActionZh: '自然自拍感' },
  { legacy: ['站姿｜鏡子自拍姿勢', 10], poseZh: '站姿｜自然站姿', specialActionZh: '鏡子自拍' },
  { legacy: ['坐姿｜自然自拍姿勢', 21], poseZh: '坐姿｜自然坐姿', specialActionZh: '自然自拍感' },
  { legacy: ['坐姿｜鏡子自拍姿勢', 22], poseZh: '坐姿｜自然坐姿', specialActionZh: '鏡子自拍' },
  { legacy: ['半躺低姿態｜自然自拍姿勢', 32], poseZh: '半躺低姿態｜側身半躺', specialActionZh: '自然自拍感' },
  { legacy: ['半躺低姿態｜鏡子自拍姿勢', 33], poseZh: '半躺低姿態｜側身半躺', specialActionZh: '鏡子自拍' },
  { legacy: ['動態互動｜自然自拍姿勢', 46], poseZh: '動態｜輕步移動', specialActionZh: '自然自拍感' },
  { legacy: ['動態互動｜鏡子自拍姿勢', 47], poseZh: '動態｜輕步移動', specialActionZh: '鏡子自拍' },
].map((entry) => ({
  ...entry,
  legacyId: `character:${slugify('姿勢與肢體語言 (Pose & Body Language)')}:${slugify(entry.legacy[0])}:${entry.legacy[1]}`,
}));

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

function getControlOptionByZh(controls, key, zh) {
  return controls.find((control) => control.key === key)?.options?.find((option) => option.zh === zh) || null;
}

function getControlOptionById(controls, key, id) {
  if (!id) return null;
  return controls.find((control) => control.key === key)?.options?.find((option) => option.id === id) || null;
}

function applyExpressionPoseLegacySocialLockMigration(normalizedLocks, rawLocks, controls) {
  const migration = CHARACTER_EXPRESSION_POSE_LEGACY_SOCIAL_POSE_MIGRATIONS.find((entry) => entry.legacyId === rawLocks?.poseId);
  if (!migration) return;

  const pose = getControlOptionByZh(controls, 'poseId', migration.poseZh);
  if (pose) normalizedLocks.poseId = pose.id;

  const specialAction = getControlOptionByZh(controls, 'specialActionId', migration.specialActionZh);
  const currentSpecialAction = getControlOptionById(controls, 'specialActionId', normalizedLocks.specialActionId);
  if (specialAction && (!normalizedLocks.specialActionId || isNoneLikeItem(currentSpecialAction))) {
    normalizedLocks.specialActionId = specialAction.id;
  }
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

export function normalizeLocks(rawLocks = {}) {
  const normalized = createEmptyLocks();

  Object.entries(rawLocks || {}).forEach(([key, value]) => {
    if (!LOCK_KEYS.has(key)) return;
    normalized[key] = value;
  });

  if (rawLocks?.subjectCount && SPECIAL_SUBJECT_OPTIONS.some((option) => option.id === rawLocks.subjectCount && !isNoneLikeItem(option))) {
    normalized.specialSubjectId = rawLocks.subjectCount;
    normalized.subjectCount = '1';
  }

  if (!normalized.filmId && normalized.cameraSystemId && CAMERA_PROFILE_OPTION_IDS.has(normalized.cameraSystemId)) {
    normalized.filmId = normalized.cameraSystemId;
  }

  const migrateCameraProfileToRendering = (profileId) => {
    const targetZh = CAMERA_PROFILE_RENDERING_MIGRATIONS[profileId];
    return targetZh ? getControlOptionByZh(getLockControls(), 'filmId', targetZh) : null;
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
    const { catalog } = buildCatalog();
    legacyJewelry.forEach((legacyId) => {
      const legacyItem = Object.values(catalog.wardrobe).flat().find((item) => item.id === legacyId);
      const targetKey = legacyMap[legacyItem?.zh];
      if (!targetKey || normalized[targetKey]) return;
      normalized[targetKey] = legacyId;
    });
  }

  const normalizedWithLegacyColors = normalizeLegacyOutfitPresetColors(normalized);
  const controls = getLockControls();

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

  applyExpressionPoseLegacySocialLockMigration(normalizedWithLegacyColors, rawLocks, controls);
  applyOutfitPresetToDressLegacyLockMigration(normalizedWithLegacyColors, rawLocks, controls);
  applyEyewearLegacyLockMigration(normalizedWithLegacyColors, rawLocks, controls);
  applyOuterwearOpeningLegacyLockMigration(normalizedWithLegacyColors, rawLocks, controls);

  return normalizedWithLegacyColors;
}

export function sanitizeLocksForCloseupMode(rawLocks = {}, controls = []) {
  const nextLocks = normalizeLocks(rawLocks);
  const framing = nextLocks.framingId ? findById(controls.find((control) => control.key === 'framingId')?.options || [], nextLocks.framingId) : null;
  const angle = nextLocks.angleId ? findById(controls.find((control) => control.key === 'angleId')?.options || [], nextLocks.angleId) : null;
  if (isWormEyeAngleItem(angle)) {
    WORM_EYE_FORCED_NONE_KEYS.forEach((key) => {
      const noneOption = controls.find((control) => control.key === key)?.options?.find((option) => option.zh === '全無');
      nextLocks[key] = noneOption ? noneOption.id : '';
    });
  }
  if (!isCloseupModeFramingItem(framing)) return nextLocks;

  const allowedKeys = new Set(CLOSEUP_ALWAYS_ALLOWED_KEYS);
  CLOSEUP_CONTEXT_ALLOWED_KEYS.forEach((key) => allowedKeys.add(key));

  controls.forEach((control) => {
    if (allowedKeys.has(control.key) || control.key === 'framingId') return;
    const noneOption = control.options?.find((option) => option.zh === '全無');
    nextLocks[control.key] = noneOption ? noneOption.id : '';
  });

  return nextLocks;
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
      if (definition.key === 'specialOutfitId') options = flatCatalog.specialOutfits;
      if (definition.key === 'specialOutfitAId') options = flatCatalog.specialOutfits;
      if (definition.key === 'specialOutfitBId') options = flatCatalog.specialOutfits;
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
      if (definition.key === 'expressionAId') options = getByKey(catalog.character, '神情與眼神 (Expression & Gaze)');
      if (definition.key === 'expressionBId') options = getByKey(catalog.character, '神情與眼神 (Expression & Gaze)');
      if (definition.key === 'poseId') options = getByKey(catalog.character, '姿勢與肢體語言 (Pose & Body Language)');
      if (definition.key === 'specialActionId') options = getByKey(catalog.character, '特殊動作 (Special Actions)');
      if (['topId', 'topAId', 'topBId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '上身 (Tops)');
      if (['topPatternId', 'topAPatternId', 'topBPatternId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '上身圖案 (Top Surface Design)');
      if (['dressId', 'dressAId', 'dressBId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '連身 (Dresses)');
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
  const base = normalizeWardrobePromptText(bottomItem.en);
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

function getFixedSetPositionOption(id, fixedSetId) {
  const item = FIXED_SET_POSITION_OPTIONS.find((option) => option.id === id) || FIXED_SET_POSITION_OPTIONS[0];
  if (!fixedSetId || item.id === 'none') return item;
  return item.setId === fixedSetId ? item : FIXED_SET_POSITION_OPTIONS[0];
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
  const integrityText = fixedSet.integrityEn || '';
  const scaleGuardText = fixedSet.scaleGuardEn || '';
  const replacementGuardText = fixedSet.replacementGuardEn || 'do not replace the fixed set with an unrelated scene';
  const readabilityText = isFixedSetSelfShotMode(captureMode)
    ? 'self-shot crop may hide parts of the set, but at least one or two selected set anchors must remain recognizable'
    : 'keep the fixed set clearly readable as the stable scene architecture';

  return [integrityText, scaleGuardText, readabilityText, replacementGuardText].filter(Boolean).join('; ');
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

export function getSceneDependentOptions(customLibrary = [], rawLocks = {}) {
  const runtime = buildCatalog(customLibrary);
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

  return { locationOptions, lightingOptions, lightDirectionOptions };
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

  if (actionTags.has('social_shooting_action')) return true;

  if (actionTags.has('face_action')) {
    if (orbitTags.has('back_view') || orbitTags.has('rear_three_quarter')) return false;
  }

  if (actionTags.has('full_body_action') || actionTags.has('leg_focus_action')) {
    if (orbitTags.has('back_view')) return false;
  }

  return true;
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

function isSpecialSubject(subject) {
  return Boolean(subject?.specialSubject);
}

function isSkeletonSubject(subject) {
  return subject?.specialSubject === 'skeleton';
}

function isAndroidSubject(subject) {
  return subject?.specialSubject === 'android';
}

function buildSpecialSubjectIntegrationPrompt(subject) {
  if (!isSpecialSubject(subject)) return '';
  const text = 'an unknown anomalous figure appearing naturally inside a real contemporary environment, photographed as if genuinely present in the same physical space, grounded by realistic scale, contact shadows, ambient light, and ordinary surroundings';
  return isSkeletonSubject(subject) ? sanitizeSkeletonPromptText(text) : text;
}

function getAspectRatioOption(id) {
  const option = ASPECT_RATIO_OPTIONS.find((entry) => entry.id === id);
  if (option?.random) return sample(ASPECT_RATIO_POOL);
  return option || DEFAULT_ASPECT_RATIO;
}

function getDuoInteractionOption(id) {
  if (id === 'editorial') return DUO_INTERACTION_OPTIONS.find((option) => option.id === 'distance') || null;
  if (id === 'natural') return DUO_INTERACTION_OPTIONS.find((option) => option.id === 'shoulder-lean') || null;
  if (id === 'intimate') return DUO_INTERACTION_OPTIONS.find((option) => option.id === 'intimate') || null;
  if (id === 'side-by-side-chatting') return DUO_INTERACTION_OPTIONS.find((option) => option.id === 'distance') || null;
  if (id === 'seated-chatting') return DUO_INTERACTION_OPTIONS.find((option) => option.id === 'distance') || null;
  if (id === 'eating-together') return DUO_INTERACTION_OPTIONS.find((option) => option.id === 'distance') || null;
  if (id === 'shopping-together') return DUO_INTERACTION_OPTIONS.find((option) => option.id === 'distance') || null;
  if (id === 'walking-together') return DUO_INTERACTION_OPTIONS.find((option) => option.id === 'distance') || null;
  if (id === 'looking-same-direction') return DUO_INTERACTION_OPTIONS.find((option) => option.id === 'strangers') || null;
  if (id === 'one-looking-at-other') return DUO_INTERACTION_OPTIONS.find((option) => option.id === 'distance') || null;
  if (id === 'adjusting-hair-or-clothes') return DUO_INTERACTION_OPTIONS.find((option) => option.id === 'distance') || null;
  if (id === 'leaning-shoulders') return DUO_INTERACTION_OPTIONS.find((option) => option.id === 'shoulder-lean') || null;
  if (id === 'arm-around-close') return DUO_INTERACTION_OPTIONS.find((option) => option.id === 'intimate') || null;
  if (id === 'whispering-close') return DUO_INTERACTION_OPTIONS.find((option) => option.id === 'intimate') || null;
  if (id === 'intimate-eye-contact') return DUO_INTERACTION_OPTIONS.find((option) => option.id === 'intimate') || null;
  if (id === 'lying-on-back-together') return DUO_INTERACTION_OPTIONS.find((option) => option.id === 'intimate') || null;
  return DUO_INTERACTION_OPTIONS.find((option) => option.id === id) || null;
}

function getDuoPoseOption(id) {
  return DUO_POSE_OPTIONS.find((option) => option.id === id) || null;
}

function getPoseComposerOption(options, id) {
  return id ? options.find((option) => option.id === id) || null : null;
}

function isActivePoseComposerOption(option) {
  return Boolean(option && !isNoneLikeItem(option));
}

function resolvePoseComposerOption(options, id, predicate = () => true) {
  const option = getPoseComposerOption(options, id);
  if (!isActivePoseComposerOption(option)) return null;

  const candidates = options.filter((item) => isActivePoseComposerOption(item) && !isRandomOption(item) && predicate(item));
  if (isRandomOption(option)) return sample(candidates);
  return predicate(option) ? option : null;
}

function poseComposerOptionMatchesBase(option, baseId) {
  if (!option) return false;
  if (option.base) return option.base === baseId;
  if (Array.isArray(option.bases)) return option.bases.includes(baseId);
  return false;
}

function getPoseComposerAnchorPhrase(anchor, base) {
  if (!anchor || !base) return '';
  return anchor.phraseByBase?.[base.id] || anchor.en || '';
}

function getPoseComposerBasePhrase(base) {
  const phrases = {
    standing: 'standing',
    sitting: 'sitting',
    kneeling: 'kneeling',
    squatting: 'squatting',
    lying: 'lying down',
  };
  return phrases[base?.id] || base?.en || '';
}

function getPoseComposerAnchorEffect(anchor, base) {
  if (anchor?.id !== 'shared-bathtub' || !base) return '';

  const waterContactEffects = {
    sitting: 'water-contact realism on the lower body and garment edges where they meet the bath water, clothing remains complete and non-transparent, visible water sheen and droplets, darker damp fabric tones, heavier wet folds',
    squatting: 'the outfit and exposed skin are soaked by bath water, clothing remains complete and non-transparent, visible water sheen and droplets, darker damp fabric tones, heavier wet folds',
    lying: 'the outfit and exposed skin are soaked by bath water, clothing remains complete and non-transparent, visible water sheen and droplets, darker damp fabric tones, heavier wet folds',
  };

  return waterContactEffects[base.id] || '';
}

function isModelNaturalPoseComposerOption(option) {
  return Boolean(option?.id?.startsWith('model-natural-'));
}

function toPoseComposerDirective(value) {
  if (!value) return '';
  const trimmed = value.trim();
  return ensureTerminalPeriod(`${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`);
}

function buildPoseComposerSentence({ base, arrangement, handPose, anchor, head }) {
  const anchorPhrase = getPoseComposerAnchorPhrase(anchor, base);
  const opening = anchorPhrase || getPoseComposerBasePhrase(base);
  const anchorEffect = getPoseComposerAnchorEffect(anchor, base);
  const details = [];
  const directives = [];
  const addOptionDetail = (option) => {
    if (!option?.en) return;
    if (isModelNaturalPoseComposerOption(option)) {
      directives.push(toPoseComposerDirective(option.en));
      return;
    }
    details.push(option.en);
  };

  addOptionDetail(arrangement);
  if (anchorEffect) details.push(anchorEffect);
  addOptionDetail(handPose);
  addOptionDetail(head);

  const baseSentence = details.length === 0
    ? `She is ${opening}.`
    : `She is ${opening} with ${details.join('; ')}.`;

  return [baseSentence, ...directives].filter(Boolean).join(' ');
}

function buildPoseComposerItem(context) {
  if (context.subject.count !== 1) return null;

  const base = resolvePoseComposerOption(POSE_COMPOSER_BASE_OPTIONS, context.locks?.poseBaseId);
  if (!base) return null;

  const matchesBase = (option) => poseComposerOptionMatchesBase(option, base.id);
  const arrangement = resolvePoseComposerOption(POSE_COMPOSER_ARRANGEMENT_OPTIONS, context.locks?.poseArrangementId, matchesBase);
  const handPose = resolvePoseComposerOption(POSE_COMPOSER_HAND_OPTIONS, context.locks?.poseHandId);
  const head = resolvePoseComposerOption(POSE_COMPOSER_HEAD_OPTIONS, context.locks?.poseHeadId);
  const anchor = resolvePoseComposerOption(POSE_COMPOSER_ANCHOR_OPTIONS, context.locks?.poseAnchorId, matchesBase);
  const parts = [base, arrangement, handPose, head, anchor].filter(Boolean);

  return {
    id: `character:姿勢組合器-pose-composer:${parts.map((part) => part.id).join(':')}`,
    zh: parts.map((part) => part.zh).join(' + '),
    en: buildPoseComposerSentence({ base, arrangement, handPose, anchor, head }),
    desc: '由姿勢組合器生成的組合姿勢。',
    meta: {
      tags: ['pose_composer'],
      minVisibility: 'full',
      poseBaseId: base.id,
      poseArrangementId: arrangement?.id || 'none',
      poseHandId: handPose?.id || 'none',
      poseHeadId: head?.id || 'none',
      poseAnchorId: anchor?.id || 'none',
    },
  };
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

function pickWithLock(list, lockedId, predicate = () => true, picker = sample) {
  if (lockedId) {
    const locked = findById(list, lockedId);
    if (locked) return locked;
  }

  const matches = list.filter(predicate);
  const nonNoneMatches = matches.filter((item) => !isNoneLikeItem(item));
  if (nonNoneMatches.length > 0) return picker(nonNoneMatches);
  if (matches.length > 0) return picker(matches);

  const noneOption = list.find((item) => isNoneLikeItem(item));
  return noneOption || null;
}

function pickWithCompatibleLock(list, lockedId, predicate = () => true, picker = sample) {
  if (lockedId) {
    const locked = findById(list, lockedId);
    if (locked && isNoneLikeItem(locked)) return locked;
    if (locked && predicate(locked)) return locked;
  }

  const matches = list.filter(predicate);
  const nonNoneMatches = matches.filter((item) => !isNoneLikeItem(item));
  if (nonNoneMatches.length > 0) return picker(nonNoneMatches);
  if (matches.length > 0) return picker(matches);

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
    const hairA = suppressHairA ? null : pickDistinctForRole('髮型 (Hairstyle)', 'a', context.locks?.hairstyleAId, [], sample);
    const hairB = suppressHairB ? null : pickDistinctForRole('髮型 (Hairstyle)', 'b', context.locks?.hairstyleBId, [hairA], sample);
    if (hairA) character.push(hairA);
    if (hairB) character.push(hairB);

    const hairColorA = suppressHairA ? null : pickDistinctForRole('髮色 (Hair Color)', 'a', context.locks?.hairColorAId, [], pickHairColor);
    const hairColorB = suppressHairB ? null : pickDistinctForRole('髮色 (Hair Color)', 'b', context.locks?.hairColorBId, [hairColorA], pickHairColor);
    if (hairColorA) character.push(hairColorA);
    if (hairColorB) character.push(hairColorB);
  }

  let expression = null;
  if (context.subject.count === 2) {
    const expressionA = pickDistinctForRole(
      '神情與眼神 (Expression & Gaze)',
      'a',
      context.locks?.expressionAId || context.locks?.expressionId,
      [],
      sample,
      (item) => expressionSupportsComposition(item, context)
    );
    const expressionB = pickDistinctForRole(
      '神情與眼神 (Expression & Gaze)',
      'b',
      context.locks?.expressionBId || context.locks?.expressionId,
      [expressionA],
      sample,
      (item) => expressionSupportsComposition(item, context)
    );
    if (expressionA) character.push(expressionA);
    if (expressionB) character.push(expressionB);
  } else {
    expression = pickCategory('神情與眼神 (Expression & Gaze)', context.locks, (item) => expressionSupportsComposition(item, context));
  }

  if (context.subject.count > 1) {
    const duoPoseOption = context.locks?.duoPoseId
      ? getDuoPoseOption(context.locks.duoPoseId)
      : sampleNonNone(DUO_POSE_OPTIONS);
    const duoPoseItem = buildDuoPoseItem(duoPoseOption);
    if (duoPoseItem && !isNoneLikeItem(duoPoseItem)) {
      character.push(duoPoseItem);
    } else {
      character.push(buildDuoPoseItem(DUO_POSE_OPTIONS[0]));
    }
    return character;
  }

  const poseComposer = buildPoseComposerItem(context);
  if (poseComposer && !isNoneLikeItem(poseComposer)) {
    character.push(poseComposer);
    return character;
  }

  const specialAction = context.locks?.specialActionId
    ? pickCategory('特殊動作 (Special Actions)', context.locks, () => true, sample, false)
    : null;
  if (specialAction && !isNoneLikeItem(specialAction) && !isSocialShootingAction(specialAction)) return character;

  if (context.locks?.poseId) {
    pickCategory('姿勢與肢體語言 (Pose & Body Language)', context.locks, () => true, sample, false);
  } else if (visibility === 'close') {
    return character;
  } else if (visibilityAtLeast(visibility, 'full')) {
    pickCategory('姿勢與肢體語言 (Pose & Body Language)', context.locks, (item) => poseSupportsLocationContext(item, context));
  } else if (!expression) {
    pickCategory(
      '姿勢與肢體語言 (Pose & Body Language)',
      context.locks,
      (item) => detailAllowed(item, context.framing) && poseSupportsLocationContext(item, context),
      sample,
      false
    );
  }

  return character;
}

function buildWardrobe(context, locks, catalog) {
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

  if (context.subject.count === 2 && (locks.specialOutfitAId || locks.specialOutfitBId)) {
    const specialOutfits = catalog.flatCatalog.specialOutfits;
    const specialA = locks.specialOutfitAId ? findById(specialOutfits, locks.specialOutfitAId) : null;
    const specialB = locks.specialOutfitBId ? findById(specialOutfits, locks.specialOutfitBId) : null;
    if (specialA && !isNoneLikeItem(specialA)) specialOutfitPieces.push(prepareSpecialOutfit(specialA, 'a'));
    if (specialB && !isNoneLikeItem(specialB)) specialOutfitPieces.push(prepareSpecialOutfit(specialB, 'b'));
  } else {
    const specialOutfit = locks.specialOutfitId ? findById(catalog.flatCatalog.specialOutfits, locks.specialOutfitId) : null;
    if (specialOutfit && !isNoneLikeItem(specialOutfit)) specialOutfitPieces.push(prepareSpecialOutfit(specialOutfit));
  }

  if (specialOutfitPieces.length > 0) return specialOutfitPieces;

  if (context.subject.count === 2 && (locks.outfitPresetAId || locks.outfitPresetBId)) {
    const presets = catalog.flatCatalog.outfitPresets;
    const presetA = locks.outfitPresetAId ? findById(presets, locks.outfitPresetAId) : null;
    const presetB = locks.outfitPresetBId ? findById(presets, locks.outfitPresetBId) : null;
    const presetAIsNone = isNoneLikeItem(presetA);
    const presetBIsNone = isNoneLikeItem(presetB);
    const hasRolePreset = (presetA && !presetAIsNone) || (presetB && !presetBIsNone);

    if (hasRolePreset) {
      const randomDistinctPreset = (excludeId) => {
        const candidates = presets.filter((item) => !isNoneLikeItem(item) && item.id !== excludeId);
        return sample(candidates.length > 0 ? candidates : presets);
      };

      const resolvedA = presetAIsNone ? null : presetA || (!locks.outfitPresetAId && presetB && !presetBIsNone ? randomDistinctPreset(presetB.id) : null);
      const resolvedB = presetBIsNone ? null : presetB || (!locks.outfitPresetBId && resolvedA ? randomDistinctPreset(resolvedA.id) : null);

      presetPieces.push(...[resolvedA ? clonePresetForRole(resolvedA, 'a') : null, resolvedB ? clonePresetForRole(resolvedB, 'b') : null].filter(Boolean));
    }
  }

  const outfitPreset = locks.outfitPresetId ? findById(catalog.flatCatalog.outfitPresets, locks.outfitPresetId) : null;
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
    const lockedItem = Array.isArray(lockedValue)
      ? lockedValue.map((id) => findById(items, id)).find(Boolean)
      : (lockedValue ? findById(items, lockedValue) : null);
    return {
      lockedItem,
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
  const pickRandomWardrobeItem = (items, { allowNone = false, predicate = () => true } = {}) => {
    const candidates = items.filter(
      (item) => (allowNone || !isNoneLikeItem(item)) && wardrobeFitsLocation(item, context.location) && predicate(item)
    );
    if (candidates.length === 0) return null;
    const picked = sample(candidates);
    addPiece(picked);
    return picked;
  };

  let topPiece = null;
  let dressPiece = null;
  let hasBottomPiece = false;

  const firstSpecifiedMainLayer = outfitPresetState.specifiedItem
    ? 'outfit'
    : dressState.specifiedItem
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
    topPiece = pickRandomWardrobeItem(topItems);
    return topPiece;
  };

  const ensureBottomPiece = () => {
    if (hasBottomPiece) return true;

    if (pantsState.specifiedItem) {
      addPiece(pantsState.specifiedItem);
      hasBottomPiece = true;
      return true;
    }

    const randomPants = pantsState.isExplicitNone
      ? null
      : pickRandomWardrobeItem(pantsItems, { allowNone: true });
    if (randomPants && !isNoneLikeItem(randomPants)) {
      hasBottomPiece = true;
      return true;
    }

    if (skirtState.specifiedItem) {
      addPiece(skirtState.specifiedItem);
      hasBottomPiece = true;
      return true;
    }

    if (skirtState.isExplicitNone) {
      hasBottomPiece = false;
      return false;
    }

    const forcedSkirt = pickRandomWardrobeItem(skirtItems);
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
    const pickedOption = sample(candidates);
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

  const pickRoleWardrobeItem = (items, role, layerSlot, { allowNone = false } = {}) => {
    const candidates = items.filter((item) => (allowNone || !isNoneLikeItem(item)) && wardrobeFitsLocation(item, context.location));
    if (candidates.length === 0) return null;
    const picked = sample(candidates);
    const clonedItem = cloneWardrobePieceForRole(picked, role, layerSlot);
    addPiece(clonedItem);
    return clonedItem;
  };

  const addLockedRoleWardrobeItem = (items, lockedValue, role, layerSlot) => {
    const lockedItem = lockedValue ? findById(items, lockedValue) : null;
    if (!lockedItem) return null;
    const clonedItem = cloneWardrobePieceForRole(lockedItem, role, layerSlot);
    addPiece(clonedItem);
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
    if (Math.random() > probability) return null;
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
      const presetRoleState = resolveLockState(catalog.flatCatalog.outfitPresets, config.presetId);
      if (presetRoleState.specifiedItem) return;

      const dressRoleState = resolveLockState(dressItems, config.dressId);
      const topRoleState = resolveLockState(topItems, config.topId);
      const pantsRoleState = resolveLockState(pantsItems, config.pantsId);
      const skirtRoleState = resolveLockState(skirtItems, config.skirtId);
      const firstSpecifiedRoleLayer = dressRoleState.specifiedItem
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

        const randomPants = pantsRoleState.isExplicitNone
          ? null
          : pickRoleWardrobeItem(pantsItems, config.role, 'pants', { allowNone: true });
        if (randomPants && !isNoneLikeItem(randomPants)) {
          roleHasBottom = true;
          return true;
        }

        if (skirtRoleState.specifiedItem) {
          addLockedRoleWardrobeItem(skirtItems, config.skirtId, config.role, 'skirt');
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
        addLockedRoleWardrobeItem(dressItems, config.dressId, config.role, 'dress');
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
    addPiece(outfitPresetState.specifiedItem);
  } else if (firstSpecifiedMainLayer === 'dress') {
    dressPiece = dressState.specifiedItem;
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
      : pickRandomWardrobeItem(catalog.flatCatalog.outfitPresets, { allowNone: true });
    if (randomPreset && !isNoneLikeItem(randomPreset)) {
      // Main outfit resolved at the preset layer.
    } else {
      const randomDress = dressState.isExplicitNone ? null : pickRandomWardrobeItem(dressItems);
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
  const styleLabel = context.style && !isNoneLikeItem(context.style) ? context.style.zh : '-';
  const importedWorldSceneLabel = context.locks?.importedWorldSceneMode === 'architecture'
    ? String(context.locks.importedWorldSceneLabel || '').trim()
    : '';
  const fixedSetSummaryLabel = context.fixedCompositionSet && !isNoneLikeItem(context.fixedCompositionSet)
    ? joinSummaryParts(
        context.fixedCompositionSet.zh,
        context.fixedSetPosition && !isNoneLikeItem(context.fixedSetPosition) ? context.fixedSetPosition.zh : '',
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
  const orbitLabel = context.orbit && !isNoneLikeItem(context.orbit) ? context.orbit.zh : '-';
  const lensLabel = context.lens && !isNoneLikeItem(context.lens) ? context.lens.zh : '-';
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
      characterSlots.specialAction?.zh && !isNoneLikeItem(characterSlots.specialAction) ? characterSlots.specialAction.zh : '',
      characterSlots.poseComposer?.zh && !isNoneLikeItem(characterSlots.poseComposer) ? characterSlots.poseComposer.zh : '',
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
          summarizeDuoRole(characterSlots.facialFeaturesA, characterSlots.hairstyleA, characterSlots.hairColorA)
            ? `人物 1：${summarizeDuoRole(characterSlots.facialFeaturesA, characterSlots.hairstyleA, characterSlots.hairColorA)}`
            : '',
          summarizeDuoRole(characterSlots.facialFeaturesB, characterSlots.hairstyleB, characterSlots.hairColorB)
            ? `人物 2：${summarizeDuoRole(characterSlots.facialFeaturesB, characterSlots.hairstyleB, characterSlots.hairColorB)}`
            : '',
          context.duoInteraction?.zh || '',
          characterSlots.duoPose?.zh && !isNoneLikeItem(characterSlots.duoPose) ? characterSlots.duoPose.zh : ''
        )
      : summarizeSingleCharacter(),
    wardrobe: summarizeWardrobe(),
    location: locationLabel,
    camera: joinSummaryParts(framingLabel, angleLabel, orbitLabel, lensLabel, opticalEffectLabel, filmLabel),
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
  '蜷川實花｜濃烈色彩戲劇感': 'Inspired by Mika Ninagawa, explosive hyper-saturated image language',
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
  return buildCatalog(customLibrary).flatCatalog.regional;
}

const DUO_PROMPT_OVERRIDES = {
  framing: {
    '特寫鏡頭 (Close-Up)': 'tight two-subject framing, both women clearly visible, shoulder-up composition, intimate close composition',
    '中景鏡頭 (Medium Shot)': 'medium shot, waist-up two-subject framing, both women clearly visible, balanced composition',
    '牛仔中景 (Cowboy Shot)': 'cowboy shot, knee-up two-subject framing, balanced spacing between both women, both subjects clearly visible',
    '全身鏡頭 (Full Body Shot)': 'full body shot, full-length two-subject framing, both women fully visible, balanced side-by-side composition',
  },
  angle: {
    '高位俯視鏡頭': 'high camera position above both subjects, looking downward, elevated two-subject portrait viewpoint, both women held clearly in frame',
    '平視高度鏡頭': 'eye-height camera position, level two-subject perspective, neutral stable duo portrait viewpoint, both women equally readable',
    '肩部高度鏡頭': 'shoulder-level camera position, level lens axis near the shoulder line, stable upper-body duo portrait viewpoint',
    '腰部高度鏡頭': 'waist-level camera position, level lens axis, grounded fashion duo camera height, no upward or downward tilt',
    '膝蓋高度鏡頭': 'knee-level camera position, level lens axis, low fashion duo camera height, legs and shoes emphasized when visible',
    '地面高度鏡頭': 'floor-level camera position, low camera near the floor, upward view toward both women, elongated full-body duo perspective',
    '蟲眼視角鏡頭': "worm's-eye view, ultra-low upward camera, ultra-wide lens perspective, strong near-far scale distortion, feet extremely close to the lens, intense spatial impact",
    '荷蘭角/傾斜 (Dutch Angle)': 'dutch angle, tilted two-subject framing, diagonal horizon line, both women held in frame',
  },
  orbit: {
    '正面 0 度': '0-degree front duo view, camera positioned directly in front of both women, frontal torso orientation',
    '左前 45 度': '45-degree front three-quarter duo view, camera at the duo front-left, both torsos angled toward the lens',
    '左側 90 度': '90-degree left-profile duo view, camera on the duo left side, lateral torso orientation',
    '左後 135 度': '135-degree rear three-quarter duo view, camera behind-left, shoulder line visible, torsos stay rear-facing if heads turn',
    '背面 180 度': '180-degree rear duo view, camera directly behind both women, rear torso orientation, bodies remain rear-facing if heads turn',
    '右後 225 度': '225-degree rear three-quarter duo view, camera behind-right, shoulder line visible, torsos stay rear-facing if heads turn',
    '右側 270 度': '270-degree right-profile duo view, camera on the duo right side, lateral torso orientation',
    '右前 315 度': '315-degree front three-quarter duo view, camera at the duo front-right, both torsos angled toward the lens',
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

function buildRoleExpressionPrompt(item, label) {
  if (!item || isNoneLikeItem(item)) return '';
  return `${label} ${item.en}`;
}

function extractCharacterSlots(character) {
  const findSlot = (token) => character.find((item) => item.id?.includes(token) && !item.meta?.characterRole);
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
    expressionA: findRoleSlot('character:神情與眼神-expression-gaze:', 'a'),
    expressionB: findRoleSlot('character:神情與眼神-expression-gaze:', 'b'),
    duoPose: findSlot('character:雙人構圖姿態-duo-pose:'),
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
  return {
    specialOutfit: specialOutfits.find((item) => !item.meta?.specialOutfitRole) || null,
    specialOutfitA: specialOutfits.find((item) => item.meta?.specialOutfitRole === 'a') || null,
    specialOutfitB: specialOutfits.find((item) => item.meta?.specialOutfitRole === 'b') || null,
    outfitPreset: outfitPresets.find((item) => !item.meta?.outfitRole) || null,
    outfitPresetA: outfitPresets.find((item) => item.meta?.outfitRole === 'a') || null,
    outfitPresetB: outfitPresets.find((item) => item.meta?.outfitRole === 'b') || null,
    top: findSlot('wardrobe:上身-tops:'),
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
    dress: findSlot('wardrobe:連身-dresses:'),
    dressA: findRoleSlot('wardrobe:連身-dresses:', 'a', 'dress'),
    dressB: findRoleSlot('wardrobe:連身-dresses:', 'b', 'dress'),
    pants: findSlot('wardrobe:褲裝-pants:'),
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
    outerwear: findSlot('wardrobe:外套-outerwear:'),
    outerwearFit: findSlot('wardrobe:外套版型-outerwear-fit:'),
    outerwearPattern: findSlot('wardrobe:外套圖案-outerwear-surface-design:'),
    outerwearOpening: findSlot('wardrobe:外套開合-outerwear-opening:'),
    outerwearStyling: findSlot('wardrobe:外套穿法-outerwear-styling:'),
    shoes: findSlot('wardrobe:鞋款-shoes:'),
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
    headAccessory: findSlot('wardrobe:頭部配件-head-accessories:'),
    eyewear: findSlot('wardrobe:眼鏡-eyewear:'),
    eyewearColor: findSlot('wardrobe:眼鏡配色-eyewear-color:'),
    eyewearPlacement: findSlot('wardrobe:眼鏡配戴方式-eyewear-placement:'),
    earrings: findSlot('wardrobe:耳環-earrings:'),
    neckAccessory: findSlot('wardrobe:頸部-neck-accessories:'),
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

function buildWardrobeColors(wardrobeSlots, locks) {
  const hasOutfitPreset = Boolean(
    (wardrobeSlots.outfitPreset && !isNoneLikeItem(wardrobeSlots.outfitPreset)) ||
    (wardrobeSlots.outfitPresetA && !isNoneLikeItem(wardrobeSlots.outfitPresetA)) ||
    (wardrobeSlots.outfitPresetB && !isNoneLikeItem(wardrobeSlots.outfitPresetB))
  );
  const hasCompleteLook = Boolean(
    (wardrobeSlots.specialOutfit && !isNoneLikeItem(wardrobeSlots.specialOutfit)) ||
    (wardrobeSlots.outfitPreset && !isNoneLikeItem(wardrobeSlots.outfitPreset)) ||
    (wardrobeSlots.dress && !isNoneLikeItem(wardrobeSlots.dress))
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
  const topBottomPalette = getTopBottomPaletteOption(normalizedLocks.topBottomPaletteId);
  const topBottomPaletteA = getTopBottomPaletteOption(normalizedLocks.topBottomPaletteAId);
  const topBottomPaletteB = getTopBottomPaletteOption(normalizedLocks.topBottomPaletteBId);
  const outfitPresetColor = wardrobeSlots.outfitPreset && !isNoneLikeItem(wardrobeSlots.outfitPreset)
    ? topBottomPalette?.topColor || getOutfitPresetColorOption(normalizedLocks.outfitPresetColorId) || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS)
    : null;
  const outfitPresetAColor = wardrobeSlots.outfitPresetA && !isNoneLikeItem(wardrobeSlots.outfitPresetA)
    ? topBottomPaletteA?.topColor || getOutfitPresetColorOption(normalizedLocks.outfitPresetAColorId) || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS)
    : null;
  const outfitPresetBColor = wardrobeSlots.outfitPresetB && !isNoneLikeItem(wardrobeSlots.outfitPresetB)
    ? topBottomPaletteB?.topColor || getOutfitPresetColorOption(normalizedLocks.outfitPresetBColorId) || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS)
    : null;
  const outfitPresetPrimaryColor = wardrobeSlots.outfitPreset && !isNoneLikeItem(wardrobeSlots.outfitPreset)
    ? topBottomPalette?.topColor
      || getOutfitPresetColorOption(normalizedLocks.outfitPresetPrimaryColorId)
      || getOutfitPresetColorOption(normalizedLocks.outfitPresetColorId)
      || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS)
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
      || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS)
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
      || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS)
    : null;
  const outfitPresetBContrastColor = wardrobeSlots.outfitPresetB && !isNoneLikeItem(wardrobeSlots.outfitPresetB)
    ? topBottomPaletteB?.bottomColor || getOutfitPresetColorOption(normalizedLocks.outfitPresetBContrastColorId)
    : null;
  const outfitPresetBLockedPalette = wardrobeSlots.outfitPresetB && !isNoneLikeItem(wardrobeSlots.outfitPresetB)
    ? getOutfitPresetLockedPaletteOption(normalizedLocks.outfitPresetBLockedPaletteId)
    : null;
  const topColor = !hasOutfitPreset && wardrobeSlots.top && !isNoneLikeItem(wardrobeSlots.top)
    ? topBottomPalette?.topColor || getGarmentColorOption(normalizedLocks.topColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS)
    : null;
  const topAColor = !hasOutfitPreset && wardrobeSlots.topA && !isNoneLikeItem(wardrobeSlots.topA)
    ? topBottomPaletteA?.topColor || getGarmentColorOption(normalizedLocks.topAColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS)
    : null;
  const topBColor = !hasOutfitPreset && wardrobeSlots.topB && !isNoneLikeItem(wardrobeSlots.topB)
    ? topBottomPaletteB?.topColor || getGarmentColorOption(normalizedLocks.topBColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS)
    : null;
  const dressColor = !hasOutfitPreset && wardrobeSlots.dress && !isNoneLikeItem(wardrobeSlots.dress) ? topBottomPalette?.topColor || getGarmentColorOption(normalizedLocks.dressColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS) : null;
  const dressAColor = !hasOutfitPreset && wardrobeSlots.dressA && !isNoneLikeItem(wardrobeSlots.dressA) ? topBottomPaletteA?.topColor || getGarmentColorOption(normalizedLocks.dressAColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS) : null;
  const dressBColor = !hasOutfitPreset && wardrobeSlots.dressB && !isNoneLikeItem(wardrobeSlots.dressB) ? topBottomPaletteB?.topColor || getGarmentColorOption(normalizedLocks.dressBColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS) : null;
  const hasBottom = (wardrobeSlots.pants && !isNoneLikeItem(wardrobeSlots.pants)) || (wardrobeSlots.skirt && !isNoneLikeItem(wardrobeSlots.skirt));
  const hasBottomA = (wardrobeSlots.pantsA && !isNoneLikeItem(wardrobeSlots.pantsA)) || (wardrobeSlots.skirtA && !isNoneLikeItem(wardrobeSlots.skirtA));
  const hasBottomB = (wardrobeSlots.pantsB && !isNoneLikeItem(wardrobeSlots.pantsB)) || (wardrobeSlots.skirtB && !isNoneLikeItem(wardrobeSlots.skirtB));
  const bottomColor = !hasOutfitPreset && hasBottom ? topBottomPalette?.bottomColor || getGarmentColorOption(normalizedLocks.bottomColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS) : null;
  const bottomAColor = !hasOutfitPreset && hasBottomA ? topBottomPaletteA?.bottomColor || getGarmentColorOption(normalizedLocks.bottomAColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS) : null;
  const bottomBColor = !hasOutfitPreset && hasBottomB ? topBottomPaletteB?.bottomColor || getGarmentColorOption(normalizedLocks.bottomBColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS) : null;
  const legwearColor = wardrobeSlots.legwear && !isNoneLikeItem(wardrobeSlots.legwear) ? getLegwearColorOption(normalizedLocks.legwearColorId) || sampleNonNone(LEGWEAR_COLOR_OPTIONS) : null;
  const outerwearColor = wardrobeSlots.outerwear && !isNoneLikeItem(wardrobeSlots.outerwear) ? getGarmentColorOption(normalizedLocks.outerwearColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS) : null;
  const shoesColor = wardrobeSlots.shoes && !isNoneLikeItem(wardrobeSlots.shoes) ? getLayerColorOption(normalizedLocks.shoesColorId) || sampleNonNone(LAYER_COLOR_OPTIONS) : null;
  const legwearAColor = wardrobeSlots.legwearA && !isNoneLikeItem(wardrobeSlots.legwearA) ? getLegwearColorOption(normalizedLocks.legwearAColorId) || sampleNonNone(LEGWEAR_COLOR_OPTIONS) : null;
  const outerwearAColor = wardrobeSlots.outerwearA && !isNoneLikeItem(wardrobeSlots.outerwearA) ? getGarmentColorOption(normalizedLocks.outerwearAColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS) : null;
  const shoesAColor = wardrobeSlots.shoesA && !isNoneLikeItem(wardrobeSlots.shoesA) ? getLayerColorOption(normalizedLocks.shoesAColorId) || sampleNonNone(LAYER_COLOR_OPTIONS) : null;
  const legwearBColor = wardrobeSlots.legwearB && !isNoneLikeItem(wardrobeSlots.legwearB) ? getLegwearColorOption(normalizedLocks.legwearBColorId) || sampleNonNone(LEGWEAR_COLOR_OPTIONS) : null;
  const outerwearBColor = wardrobeSlots.outerwearB && !isNoneLikeItem(wardrobeSlots.outerwearB) ? getGarmentColorOption(normalizedLocks.outerwearBColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS) : null;
  const shoesBColor = wardrobeSlots.shoesB && !isNoneLikeItem(wardrobeSlots.shoesB) ? getLayerColorOption(normalizedLocks.shoesBColorId) || sampleNonNone(LAYER_COLOR_OPTIONS) : null;
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
  const base = stripMarkdown(item.en).replace(/\s+/g, ' ').trim();
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
    stylingText = 'properly worn on both shoulders as a standard outer layer over the top, shoulder line fully covered';
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

  const details = [];
  const primaryTargets = colorTargets.primary || [];
  const contrastTargets = colorTargets.contrast || [];
  const lockedTargets = colorTargets.locked || [];

  if (primaryColor && !isNoneLikeItem(primaryColor)) {
    const targetText = describeOutfitColorTargets(primaryTargets);
    details.push(targetText ? `${targetText} in ${primaryColor.en}` : `main outfit color in ${primaryColor.en}`);
  }

  if (colorMode !== 'primary' && contrastColor && !isNoneLikeItem(contrastColor) && contrastTargets.length > 0) {
    const contrastText = describeOutfitColorTargets(contrastTargets);
    if (contrastText) details.push(`${contrastText} in ${contrastColor.en}`);
  }

  if (colorMode === 'primary_contrast_locked' && lockedTargets.length > 0) {
    const lockedText = describeLockedPalette(lockedPalette, lockedTargets, lockedOptional);
    if (lockedText) details.push(lockedText);
  }

  return appendCompleteLookPaletteDirection(details.length > 0 ? `${base}, ${details.join(', ')}` : base, completeLookPalette);
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

function buildOuterwearStylingLeadText(styling, { minimal = false } = {}) {
  if (!styling || isNoneLikeItem(styling)) return '';
  if (styling.zh === '正常穿著') {
    return minimal ? '' : 'properly worn on both shoulders';
  }
  if (styling.zh === '滑落肩部') {
    return 'outerwear intentionally slipped below one or both shoulders, sleeves still loosely on the arms, jacket body hanging as an intact outer layer';
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

function buildDuoWardrobeText(wardrobeSlots, wardrobeColors) {
  const normalizeWearable = (value) => stripMarkdown(value || '')
    .replace(/\s+/g, ' ')
    .replace(/^wearing\s+/i, '')
    .trim();
  const joinParts = (parts) => parts.map(normalizeWearable).filter(Boolean).join(', ');
  const specialAText = normalizeWearable(buildSpecialOutfitPrompt(wardrobeSlots.specialOutfitA, wardrobeColors.completeLookPaletteA));
  const specialBText = normalizeWearable(buildSpecialOutfitPrompt(wardrobeSlots.specialOutfitB, wardrobeColors.completeLookPaletteB));
  const specialSharedText = normalizeWearable(buildSpecialOutfitPrompt(wardrobeSlots.specialOutfit, wardrobeColors.completeLookPalette));
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
      return normalizeWearable(buildOutfitPresetPrompt(preset, {
        legacy: wardrobeColors[`outfitPreset${suffix}Color`],
        primary: wardrobeColors[`outfitPreset${suffix}PrimaryColor`],
        contrast: wardrobeColors[`outfitPreset${suffix}ContrastColor`],
        lockedPalette: wardrobeColors[`outfitPreset${suffix}LockedPalette`],
        completeLookPalette: wardrobeColors[`completeLookPalette${suffix}`],
      }));
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
        'distinct outfit-visible editorial duo composition, complete wardrobe visible on both women, visible torso and wardrobe details, no headshot-only crop',
      ].filter(Boolean).join(', '),
    };
  }

  const presetAText = normalizeWearable(
    buildOutfitPresetPrompt(wardrobeSlots.outfitPresetA, {
      legacy: wardrobeColors.outfitPresetAColor,
      primary: wardrobeColors.outfitPresetAPrimaryColor,
      contrast: wardrobeColors.outfitPresetAContrastColor,
      lockedPalette: wardrobeColors.outfitPresetALockedPalette,
      completeLookPalette: wardrobeColors.completeLookPaletteA,
    })
  );
  const presetBText = normalizeWearable(
    buildOutfitPresetPrompt(wardrobeSlots.outfitPresetB, {
      legacy: wardrobeColors.outfitPresetBColor,
      primary: wardrobeColors.outfitPresetBPrimaryColor,
      contrast: wardrobeColors.outfitPresetBContrastColor,
      lockedPalette: wardrobeColors.outfitPresetBLockedPalette,
      completeLookPalette: wardrobeColors.completeLookPaletteB,
    })
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
        'distinct outfit-visible editorial styling, complete wardrobe visible on both women, visible torso and wardrobe details, no headshot-only crop',
      ].filter(Boolean).join(', '),
    };
  }

  const presetText = normalizeWearable(
    buildOutfitPresetPrompt(wardrobeSlots.outfitPreset, {
      legacy: wardrobeColors.outfitPresetColor,
      primary: wardrobeColors.outfitPresetPrimaryColor,
      contrast: wardrobeColors.outfitPresetContrastColor,
      lockedPalette: wardrobeColors.outfitPresetLockedPalette,
      completeLookPalette: wardrobeColors.completeLookPalette,
    })
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
  const duoWardrobeText = buildDuoWardrobeText(wardrobeSlots, wardrobeColors);
  if (!duoWardrobeText.clothingText) return '';
  const subjectBaseText = stripMarkdown(context.subject.en || 'two women').replace(/\s+/g, ' ').trim();
  const roleAccessoryText = [
    buildRoleSubjectAccessoryPrompt(wardrobeSlots, 'a'),
    buildRoleSubjectAccessoryPrompt(wardrobeSlots, 'b'),
  ].filter(Boolean).join(', ');
  const subjectText = roleAccessoryText ? `${subjectBaseText}, ${roleAccessoryText}` : subjectBaseText;
  const sceneAccentText = buildContextualSceneAccent(context);
  const locationText = context.location && !isNoneLikeItem(context.location)
    ? stripMarkdown(context.location.en).replace(/\s+/g, ' ').trim()
    : '';
  const locationDetail = [locationText, sceneAccentText].filter(Boolean).join(', ');
  const locationClause = locationDetail ? ` in ${locationDetail}` : '';
  return `an editorial film still of ${subjectText} ${duoWardrobeText.clothingText}${locationClause}, outfit-visible editorial duo composition, visible torso and wardrobe details, both women shown within the same continuous frame, avoid headshot-only crop`;
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
    return 'top hem fully covering the low-rise waistband and abdomen, untucked shirt length extending below the waistband, no accidental midriff exposure';
  }

  if (['紮入下身', '半紮'].includes(topStyling?.zh) || isTuckedTopItem(top)) {
    return 'top properly tucked into the low-rise waistband with a natural low-rise proportion, clean waist styling, not cropped';
  }

  return 'top length extending below the low-rise waistband, abdomen covered, not cropped into an unintended midriff reveal';
}

function hasWardrobeText(item, patterns = []) {
  if (!item || isNoneLikeItem(item)) return false;
  const haystack = getTopBottomHaystack(item);
  return hasAny(haystack, patterns);
}

function isLongTopLayer(item) {
  return hasWardrobeText(item, [
    '長版',
    'longline',
    'oversized sweater',
    'oversized cable-knit',
    'long shirt',
    'tunic',
    'hanging hem',
    'relaxed hemline',
    'over the bottoms',
  ]);
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

function isStrappyInnerLayer(item) {
  return hasWardrobeText(item, [
    '細肩帶',
    'camisole',
    'spaghetti strap',
    'thin strap',
  ]);
}

function hasCompleteOuterwearLayer(wardrobeSlots, role = '') {
  const suffix = role === 'a' ? 'A' : role === 'b' ? 'B' : '';
  const outerwear = wardrobeSlots[`outerwear${suffix}`] || null;
  return outerwear && !isNoneLikeItem(outerwear);
}

function buildWardrobeLayeringLogicPrompt(wardrobeSlots, role = '') {
  const suffix = role === 'a' ? 'A' : role === 'b' ? 'B' : '';
  const top = wardrobeSlots[`top${suffix}`] && !isNoneLikeItem(wardrobeSlots[`top${suffix}`]) ? wardrobeSlots[`top${suffix}`] : null;
  const dress = wardrobeSlots[`dress${suffix}`] && !isNoneLikeItem(wardrobeSlots[`dress${suffix}`]) ? wardrobeSlots[`dress${suffix}`] : null;
  const pants = wardrobeSlots[`pants${suffix}`] && !isNoneLikeItem(wardrobeSlots[`pants${suffix}`]) ? wardrobeSlots[`pants${suffix}`] : null;
  const skirt = wardrobeSlots[`skirt${suffix}`] && !isNoneLikeItem(wardrobeSlots[`skirt${suffix}`]) ? wardrobeSlots[`skirt${suffix}`] : null;
  const legwear = wardrobeSlots[`legwear${suffix}`] && !isNoneLikeItem(wardrobeSlots[`legwear${suffix}`]) ? wardrobeSlots[`legwear${suffix}`] : null;
  const hasOuterwear = hasCompleteOuterwearLayer(wardrobeSlots, role);
  const bottom = pants || skirt;
  const rules = [];

  if (top && pants && isLongTopLayer(top) && isShortBottomLayer(pants)) {
    rules.push('long top layer worn naturally untucked, covering the waist and partially covering the shorts; shorts only peek out naturally below the hem; do not tuck the long top into the shorts');
  }

  if (hasOuterwear && (dress || top)) {
    rules.push('outerwear is the complete outer layer, properly worn with intact shoulders, sleeves, lapels and hem; inner garment remains visible only where naturally exposed at the neckline, front opening or hem');
  }

  if (hasOuterwear && dress && isStrappyInnerLayer(dress)) {
    rules.push('thin straps belong to the inner dress only; do not turn the outerwear into slipped straps, broken shoulders or an off-shoulder jacket shape');
  }

  if (hasOuterwear && top && isStrappyInnerLayer(top)) {
    rules.push('thin straps belong to the inner top only; keep the outerwear silhouette complete and structurally clean');
  }

  if (legwear && bottom && isLongBottomLayer(bottom)) {
    rules.push('legwear is secondary under the long bottom layer, visible only subtly near the shoe opening or through natural movement; do not force full socks or stockings to be completely displayed');
  }

  if (bottom && isLongBottomLayer(bottom)) {
    rules.push('long bottom layer keeps its natural full length and drape; shoes can remain normally visible without distorting the pants or skirt');
  }

  if (rules.length === 0) return '';
  return `realistic outer-to-inner dressing order: ${rules.join('; ')}`;
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

  return parts.length > 0 ? `with ${joinNaturalList(parts)}` : '';
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
  if (hasAny(haystack, ['夜晚街燈', 'streetlit night'])) return 'streetlit_night';
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

function isCloseupVisibilityContext(context) {
  return isCloseupModeFramingItem(context?.framing);
}

function buildCloseupSceneContextPrompt(context) {
  if (!isCloseupVisibilityContext(context) || !context.location || isNoneLikeItem(context.location)) return '';

  const locationAnchor = stripMarkdown(context.location.en || context.location.zh || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)[0];

  const selectedContext = locationAnchor ? `selected ${locationAnchor}` : 'the selected scene';
  const isFaceOnly = context?.framing?.meta?.tags?.includes('partial_face')
    || context?.framing?.zh === '局部五官特寫'
    || context?.framing?.zh === '臉部特寫';

  if (isFaceOnly) {
    return `render ${selectedContext} only as soft background color, environmental light, atmosphere, and faint spatial shapes behind the face; do not widen the frame just to reveal the full room or complete environment`;
  }

  return `render ${selectedContext} only through nearby surfaces, local objects, window light, or architectural edges around the upper body; do not widen the frame just to reveal the full room or complete environment`;
}

const CLOSEUP_HIDDEN_WARDROBE_SEGMENT_PATTERN = /\b(jeans|trousers|pants|shorts|skirt|stockings|tights|hosiery|socks|legwear|shoes|boots|sandals|heels|feet|toes|ankle|calf|thigh|waist sash|obi|belt|bag|handbag|clutch|pouch|kinchaku|bracelet|bracelets|rings?|bangles?|waistband|hemline)\b/i;
const CLOSEUP_ACCESSORY_SEGMENT_PATTERN = /\b(eyewear|glasses|sunglasses|earrings|necklace|pendant|choker|hair clip|hair clips|headpiece|headpieces)\b/i;
const CLOSEUP_UPPER_WARDROBE_SEGMENT_PATTERN = /\b(collar|neckline|wrap|front|shirt|blouse|top|dress|bodice|corset|bustier|camisole|sleeve|shoulder|lapel|hood|jacket|coat|robe|kimono|yukata|mesh|lace|embroidery|fabric|panel|trim|frill|ruffle|cami|gown|button-front|cape sleeve)\b/i;

function normalizeCloseupWardrobeSegment(value = '') {
  return stripMarkdown(value)
    .replace(/\s+/g, ' ')
    .replace(/^complete outfit:\s*/i, '')
    .replace(/^wearing\s+/i, '')
    .trim();
}

function extractCloseupWardrobeIdentitySegments(promptText, { maxSegments = 2 } = {}) {
  const segments = normalizeCloseupWardrobeSegment(promptText)
    .split(/[.,;]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) return [];

  const preferred = segments.filter(
    (segment) => CLOSEUP_UPPER_WARDROBE_SEGMENT_PATTERN.test(segment)
      && !CLOSEUP_HIDDEN_WARDROBE_SEGMENT_PATTERN.test(segment)
      && !CLOSEUP_ACCESSORY_SEGMENT_PATTERN.test(segment)
  );
  if (preferred.length > 0) return preferred.slice(0, maxSegments);

  return segments
    .filter(
      (segment) => !CLOSEUP_HIDDEN_WARDROBE_SEGMENT_PATTERN.test(segment)
        && !CLOSEUP_ACCESSORY_SEGMENT_PATTERN.test(segment)
    )
    .slice(0, maxSegments);
}

function buildCloseupWardrobeIdentityText(context, wardrobeSlots, wardrobeColors) {
  if (context?.subject?.count !== 1) return '';

  const buildSingleOutfitPresetText = () => buildOutfitPresetPrompt(wardrobeSlots.outfitPreset, {
    legacy: wardrobeColors.outfitPresetColor,
    primary: wardrobeColors.outfitPresetPrimaryColor,
    contrast: wardrobeColors.outfitPresetContrastColor,
    lockedPalette: wardrobeColors.outfitPresetLockedPalette,
    completeLookPalette: wardrobeColors.completeLookPalette,
  });
  const buildSingleOuterwearText = ({ minimalStyling = false } = {}) => buildOuterwearColoredPrompt(wardrobeSlots.outerwear, wardrobeColors.outerwearColor, {
    fit: wardrobeSlots.outerwearFit,
    pattern: wardrobeSlots.outerwearPattern,
    opening: wardrobeSlots.outerwearOpening,
    styling: wardrobeSlots.outerwearStyling,
    minimalStyling,
  });

  let sourceText = '';
  if (wardrobeSlots.specialOutfit && !isNoneLikeItem(wardrobeSlots.specialOutfit)) {
    sourceText = buildSpecialOutfitPrompt(wardrobeSlots.specialOutfit, wardrobeColors.completeLookPalette);
  } else if (wardrobeSlots.outfitPreset && !isNoneLikeItem(wardrobeSlots.outfitPreset)) {
    sourceText = buildSingleOutfitPresetText();
  } else if (wardrobeSlots.dress && !isNoneLikeItem(wardrobeSlots.dress)) {
    sourceText = buildCompleteLookDressPrompt(
      wardrobeSlots.dress,
      wardrobeColors.dressColor,
      wardrobeColors.completeLookPalette,
      { secondaryColor: wardrobeColors.topBottomPalette?.bottomColor }
    );
  } else {
    const topText = buildTopWardrobePrompt(wardrobeSlots, wardrobeColors);
    sourceText = topText || buildSingleOuterwearText({ minimalStyling: true });
  }

  return joinNaturalList(extractCloseupWardrobeIdentitySegments(sourceText, { maxSegments: 1 }));
}

function buildCloseupWardrobeVisibilityPrompt(context, wardrobeSlots = {}, wardrobeColors = {}) {
  if (!isCloseupVisibilityContext(context)) return '';

  const isPartialFace = context?.framing?.meta?.tags?.includes('partial_face');
  const framingZh = context?.framing?.zh || '';
  const isFaceOnly = isPartialFace || framingZh === '局部五官特寫' || framingZh === '臉部特寫';
  const identityText = buildCloseupWardrobeIdentityText(context, wardrobeSlots, wardrobeColors);
  const cueText = isFaceOnly
    ? joinNaturalList([
        'collar edge',
        'neckline fabric',
        'partial shoulder line',
        'small accessory details near the face',
        'eyewear',
        'earrings',
        context?.locks?.neckAccessoryId ? 'partial neck accessory detail' : '',
      ].filter(Boolean))
    : joinNaturalList([
        'neckline',
        'collar',
        'wrap front',
        'shoulder line',
        'upper-chest fabric',
        'sleeve edge',
        wardrobeSlots.outerwear && !isNoneLikeItem(wardrobeSlots.outerwear) ? 'outerwear edge' : '',
        context?.locks?.neckAccessoryId ? 'neck accessory detail' : '',
      ].filter(Boolean));
  const identityLead = identityText
    ? `show ${identityText} only through ${cueText}`
    : `show the selected styling only through ${cueText}`;

  if (isFaceOnly) {
    return `${identityLead}; keep torso clothing, lower-body garments, legwear, and shoes off-frame rather than widening the crop`;
  }

  return `${identityLead}; keep lower-body garments, legwear, shoes, waist accessories, and large bags as off-frame context rather than required visible elements`;
}

function getImportedWorldSceneArchitectureText(context) {
  if (context?.locks?.importedWorldSceneMode !== 'architecture') return '';
  return stripMarkdown(context?.locks?.importedWorldSceneArchitectureText || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildStructuredGrokPrompt(context, character, wardrobe, wardrobeColors, lightDirection, film, duoInteraction) {
  const characterSlots = extractCharacterSlots(character);
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
  const specialSubjectMode = isSpecialSubject(context.subject);
  const skeletonMode = isSkeletonSubject(context.subject);
  const fixedCompositionSetActive = isFixedCompositionSetActive(context.fixedCompositionSet);
  const fixedSetSelfShotMode = fixedCompositionSetActive && isFixedSetSelfShotMode(context.fixedSetCaptureMode);
  const duoWardrobeText = buildDuoWardrobeText(wardrobeSlots, wardrobeColors);
  const duoSceneAnchorText = buildDuoSceneAnchorText(context, wardrobeSlots, wardrobeColors);
  const hasDuoSceneAnchor = Boolean(duoSceneAnchorText);
  const waistlineCompatibilityText = buildWaistlineCompatibilityPrompt(wardrobeSlots);
  const wardrobeLayeringLogicText = buildWardrobeLayeringLogicPrompt(wardrobeSlots);
  const useCharacterIdentityAnchor = Boolean(context.characterProfilePrompt) && context.subject.count === 1 && !specialSubjectMode;
  const expressionText = characterSlots.expression ? resolvePromptVariant(characterSlots.expression, 'expression', context.subject.count) : '';
  const expressionAText = buildRoleExpressionPrompt(characterSlots.expressionA, 'woman 1');
  const expressionBText = buildRoleExpressionPrompt(characterSlots.expressionB, 'woman 2');
  const poseText = context.subject.count === 2
    ? (characterSlots.duoPose && !isNoneLikeItem(characterSlots.duoPose) ? characterSlots.duoPose.en : '')
    : characterSlots.poseComposer && !isNoneLikeItem(characterSlots.poseComposer)
      ? characterSlots.poseComposer.en
      : characterSlots.pose && !isNoneLikeItem(characterSlots.pose)
      ? resolvePromptVariant(characterSlots.pose, 'pose', context.subject.count)
      : '';
  const specialActionText = characterSlots.specialAction && !isNoneLikeItem(characterSlots.specialAction)
    ? characterSlots.specialAction.en
    : '';
  const sceneAccentText = buildContextualSceneAccent(context);
  const importedWorldSceneArchitectureText = getImportedWorldSceneArchitectureText(context);
  const closeupSceneContextText = buildCloseupSceneContextPrompt(context);
  const closeupWardrobeVisibilityText = buildCloseupWardrobeVisibilityPrompt(context, wardrobeSlots, wardrobeColors);
  const isCloseupVisibility = Boolean(closeupWardrobeVisibilityText);
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
    const baseSubjectText = useCharacterIdentityAnchor ? `${context.subject.en} ${context.characterProfilePrompt}` : context.subject.en;
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
  const skeletonText = (value) => (skeletonMode ? sanitizeSkeletonPromptText(value) : value);
  const buildGrokScenePriorityText = () => {
    if (fixedSetSelfShotMode) {
      return 'allow self-shot imperfection: partial face or half-body crop, off-center framing, close-lens proximity, imperfect focus, and incomplete fixed-set visibility are acceptable';
    }
    if (!sceneProtectedWardrobeMode || !context.location || isNoneLikeItem(context.location)) return '';

    const locationAnchor = stripMarkdown(context.location.en || context.location.zh || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[()]/g, '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(', ');

    if (!locationAnchor) return '';
    return `(${locationAnchor}:1.35), keep the recognizable selected environment visible behind the subject, preserve clear spatial context and background details, avoid plain or empty background`;
  };
  const addFixedCompositionSetLines = () => {
    if (!fixedCompositionSetActive) return;
    addContextLine('Fixed Composition Set', context.fixedCompositionSet, (item) => skeletonText(item.en));
    addContextLine('Fixed Set Position', context.fixedSetPosition, (item) => skeletonText(item.en));
    addContextLine('Fixed Set Capture Mode', context.fixedSetCaptureMode, (item) => skeletonText(item.en));
    addContextLine('Fixed Set Performance State', context.fixedSetPerformanceState, (item) => skeletonText(item.en));
    addLine('Fixed Set Integrity', skeletonText(buildFixedSetIntegrityText(context.fixedCompositionSet, context.fixedSetCaptureMode)));
    addContextLine('Ambient Light Conditions', context.lighting, (item) => skeletonText(item.en));
    addContextLine('Subject Light Style', lightDirection, (item) => skeletonText(resolvePromptVariant(item, 'lightDirection', context.subject.count)));
  };
  const addGrokSceneLines = () => {
    if (isCloseupVisibility) {
      addLine('Scene Context', skeletonText(closeupSceneContextText));
      addContextLine('Ambient Light Conditions', context.lighting, (item) => skeletonText(item.en));
      addContextLine('Subject Light Style', lightDirection, (item) => skeletonText(resolvePromptVariant(item, 'lightDirection', context.subject.count)));
      return;
    }
    addLine('World Scene Architecture', skeletonText(importedWorldSceneArchitectureText));
    addContextLine('Location', context.location, (item) => skeletonText(item.en));
    addLine('Scene Accent', skeletonText(sceneAccentText));
    addContextLine('Ambient Light Conditions', context.lighting, (item) => skeletonText(item.en));
    addContextLine('Subject Light Style', lightDirection, (item) => skeletonText(resolvePromptVariant(item, 'lightDirection', context.subject.count)));
    addLine('Scene Priority', skeletonText(buildGrokScenePriorityText()));
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
    if (isBarefoot) return `${base}, bare feet and visible toes clearly shown`;
    if (hasLegwear && hasShoes && !longBottom) return `${base}, legwear and shoes clearly visible`;
    if (hasShoes) return `${base}, shoes clearly visible`;
    return `${base}, full lower legs and feet clearly visible`;
  };
  const buildGrokCompositionPriorityText = () => {
    if (context.subject.count === 2 && duoWardrobeText.clothingText) {
      return 'preserve an outfit-visible editorial duo composition with both women in the same continuous frame, keep visible torso and wardrobe details, avoid collapsing into a headshot-only crop';
    }
    const visibility = context.framing?.meta?.visibility || '';
    if (isCloseupVisibility) {
      return 'honor the selected close portrait crop; keep clothing and setting as in-frame context only, avoid widening the frame just to reveal the full outfit or room';
    }
    if (sceneProtectedWardrobeMode) {
      return 'preserve the selected environment as a visible, recognizable background with moderate depth of field when needed, background softly separated but still readable, avoid collapsing into a plain backdrop or overly tight crop';
    }
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
  if (!hasDuoSceneAnchor && !specialSubjectMode) addItemLine('Body Type', characterSlots.bodyType);
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
    addLine('Outerwear', buildOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors));
    if (isCloseupVisibility) {
      addLine('Wardrobe Visibility', skeletonText(closeupWardrobeVisibilityText));
    } else {
      addLine('Woman 1 Special Outfit', buildSpecialOutfitPrompt(wardrobeSlots.specialOutfitA, wardrobeColors.completeLookPaletteA));
      addLine('Woman 2 Special Outfit', buildSpecialOutfitPrompt(wardrobeSlots.specialOutfitB, wardrobeColors.completeLookPaletteB));
    }
  } else if (wardrobeSlots.specialOutfit && !hasDuoSceneAnchor) {
    addLine('Outerwear', buildOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors));
    if (isCloseupVisibility) {
      addLine('Wardrobe Visibility', skeletonText(closeupWardrobeVisibilityText));
    } else {
      addLine('Special Outfit', buildSpecialOutfitPrompt(wardrobeSlots.specialOutfit, wardrobeColors.completeLookPalette));
    }
  }
  if (context.subject.count === 2 && !hasDuoSceneAnchor && (wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB)) {
    addLine('Outerwear', buildOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors));
    if (isCloseupVisibility) {
      addLine('Wardrobe Visibility', skeletonText(closeupWardrobeVisibilityText));
    } else {
      addLine('Woman 1 Outfit Preset', buildOutfitPresetPrompt(wardrobeSlots.outfitPresetA, {
        legacy: wardrobeColors.outfitPresetAColor,
        primary: wardrobeColors.outfitPresetAPrimaryColor,
        contrast: wardrobeColors.outfitPresetAContrastColor,
        lockedPalette: wardrobeColors.outfitPresetALockedPalette,
        completeLookPalette: wardrobeColors.completeLookPaletteA,
      }));
      addLine('Woman 2 Outfit Preset', buildOutfitPresetPrompt(wardrobeSlots.outfitPresetB, {
        legacy: wardrobeColors.outfitPresetBColor,
        primary: wardrobeColors.outfitPresetBPrimaryColor,
        contrast: wardrobeColors.outfitPresetBContrastColor,
        lockedPalette: wardrobeColors.outfitPresetBLockedPalette,
        completeLookPalette: wardrobeColors.completeLookPaletteB,
      }));
    }
  } else if (wardrobeSlots.outfitPreset && !hasDuoSceneAnchor) {
    addLine('Outerwear', buildOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors));
    if (isCloseupVisibility) {
      addLine('Wardrobe Visibility', skeletonText(closeupWardrobeVisibilityText));
    } else {
      addLine('Outfit Preset', buildOutfitPresetPrompt(wardrobeSlots.outfitPreset, {
        legacy: wardrobeColors.outfitPresetColor,
        primary: wardrobeColors.outfitPresetPrimaryColor,
        contrast: wardrobeColors.outfitPresetContrastColor,
        lockedPalette: wardrobeColors.outfitPresetLockedPalette,
        completeLookPalette: wardrobeColors.completeLookPalette,
      }));
    }
  }
  if (!specialSubjectMode && !wardrobeSlots.specialOutfit && !wardrobeSlots.specialOutfitA && !wardrobeSlots.specialOutfitB && !wardrobeSlots.outfitPreset && !wardrobeSlots.outfitPresetA && !wardrobeSlots.outfitPresetB && !(context.subject.count === 2 && duoWardrobeText.clothingText)) {
    const topText = buildTopWardrobePrompt(wardrobeSlots, wardrobeColors);
    const dressText = buildCompleteLookDressPrompt(wardrobeSlots.dress, wardrobeColors.dressColor, wardrobeColors.completeLookPalette, { secondaryColor: wardrobeColors.topBottomPalette?.bottomColor });
    const pantsText = buildBottomWardrobePrompt(wardrobeSlots.pants, wardrobeSlots, wardrobeColors);
    const skirtText = buildBottomWardrobePrompt(wardrobeSlots.skirt, wardrobeSlots, wardrobeColors);
    const outerwearFirstDressText = buildOuterwearFirstPrompt(
      dressText,
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
      (dressText && outerwearFirstDressText) ||
      (!dressText && outerwearFirstTopText)
    );
    if (isCloseupVisibility) {
      addLine('Wardrobe Visibility', skeletonText(closeupWardrobeVisibilityText));
    } else {
      if (!usedOuterwearInMain) addLine('Outerwear', buildOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors));
      addLine('Dress', outerwearFirstDressText || dressText);
      addLine('Top', dressText ? '' : (outerwearFirstTopText || topText));
      addLine('Pants', dressText ? '' : pantsText);
      addLine('Skirt', dressText ? '' : skirtText);
      addLine('Legwear', buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor));
      addLine('Shoes', buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor));
    }
  }
  if (!specialSubjectMode && !hasDuoSceneAnchor && !wardrobeSlots.specialOutfit && !wardrobeSlots.specialOutfitA && !wardrobeSlots.specialOutfitB && (wardrobeSlots.outfitPreset || wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB)) {
    if (!isCloseupVisibility) {
      addLine('Legwear', buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor));
      addLine('Shoes', buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor));
    }
  }
  if (!specialSubjectMode && !hasDuoSceneAnchor) {
    if (!isCloseupVisibility) {
      addLine('Waistline Coordination', waistlineCompatibilityText);
      addLine('Wardrobe Layering Logic', wardrobeLayeringLogicText);
    }
    addLine('Wardrobe Integrity', buildGrokWardrobeIntegrityText());
  }
  if (context.subject.count === 2 && !hasDuoSceneAnchor) addLine('Duo Wardrobe', duoWardrobeText.stylingText);
  addLine('Special Action', skeletonText(specialActionText));
  addLine(context.subject.count === 2 ? 'Duo Pose' : 'Pose', skeletonText(poseText));
  if (isAndroidSubject(context.subject)) {
    addItemLine('Hairstyle', characterSlots.hairstyle);
    addLine('Hair Color', buildHairColorPrompt(characterSlots.hairColor));
  }
  if (specialSubjectMode) addLine('Expression', skeletonText(expressionText));
  if (!specialSubjectMode && context.subject.count === 2) addLine('Duo Interaction', duoInteraction?.en);
  if (!specialSubjectMode && context.subject.count === 2) {
    addItemLine('Woman 1 Facial Features', characterSlots.facialFeaturesA);
    addItemLine('Woman 2 Facial Features', characterSlots.facialFeaturesB);
  } else if (!specialSubjectMode && !useCharacterIdentityAnchor) {
    addLine('Facial Features', buildFacialFeaturesPrompt(characterSlots.facialFeatures));
  }
  if (!specialSubjectMode && context.subject.count === 2) {
    addItemLine('Woman 1 Hairstyle', characterSlots.hairstyleA);
    addItemLine('Woman 2 Hairstyle', characterSlots.hairstyleB);
    addLine('Woman 1 Hair Color', buildHairColorPrompt(characterSlots.hairColorA));
    addLine('Woman 2 Hair Color', buildHairColorPrompt(characterSlots.hairColorB));
  } else if (!specialSubjectMode) {
    addItemLine('Hairstyle', characterSlots.hairstyle);
    addLine('Hair Color', buildHairColorPrompt(characterSlots.hairColor));
  }
  if (!specialSubjectMode && !useCharacterIdentityAnchor) addItemLine('Skin Details', characterSlots.skinDetails);
  if (!specialSubjectMode && context.subject.count === 2) {
    addLine('Woman 1 Expression', expressionAText);
    addLine('Woman 2 Expression', expressionBText);
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
    addContextLine('Optical Effect', context.opticalEffect, (item) => skeletonText(item.en));
  } else if (fixedSetSelfShotMode) {
    addLine('Composition Priority', 'allow imperfect self-shot framing, partial subject crop, close-lens body proximity, and incomplete set visibility when it makes the social snapshot feel real');
  }
  addContextLine('Camera / Film', film, (item) => skeletonText(item.en));
  if (!specialSubjectMode && !useCharacterIdentityAnchor) addLine('Character Identity', context.characterProfilePrompt);

  return lines.join('\n');
}

function parseStructuredPromptLines(prompt) {
  const valuesByLabel = new Map();

  prompt
    .split('\n')
    .forEach((line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) return;

      const label = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!label || !value) return;

      const current = valuesByLabel.get(label) || [];
      current.push(value);
      valuesByLabel.set(label, current);
    });

  return valuesByLabel;
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

function buildPromptSectionSources(valuesByLabel, context) {
  const sceneContextValues = getStructuredValues(valuesByLabel, ['Scene Context']);
  const subjectValues = getStructuredValues(valuesByLabel, [
    'Duo Scene Anchor',
    'Subject Count',
    'Reference Guidance',
    'Body Type',
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
    'Expression',
    'Woman 1 Expression',
    'Woman 2 Expression',
    'Character Identity',
    'Head Accessory',
    'Woman 1 Head Accessory',
    'Woman 2 Head Accessory',
  ]);
  const sceneValues = [
    ...getStructuredLabeledValues(valuesByLabel, [
      'Fixed Composition Set',
      'Fixed Set Position',
      'Fixed Set Capture Mode',
      'Fixed Set Performance State',
      'Fixed Set Integrity',
    ]),
    ...getStructuredValues(valuesByLabel, [
      'World Scene Architecture',
      'Location',
      'Scene Accent',
      'Scene Context',
      'Scene Priority',
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
    'Wardrobe Visibility',
    'Waistline Coordination',
    'Wardrobe Layering Logic',
  ]);
  const wardrobeVisibilityValues = getStructuredValues(valuesByLabel, ['Wardrobe Visibility']);
  const poseValues = getStructuredValues(valuesByLabel, [
    'Special Action',
    'Pose',
    'Duo Pose',
    'Duo Interaction',
    'Framing',
    'Composition Priority',
    'Angle',
    'Orbit Angle',
  ]);
  const lightingValues = getStructuredValues(valuesByLabel, [
    'Ambient Light Conditions',
    'Subject Light Style',
  ]);
  const cameraValues = getStructuredValues(valuesByLabel, [
    'Photography Style',
    'Lens',
    'Optical Effect',
    'Camera / Film',
  ]);
  const imageType = context.subject?.count === 2
    ? 'Create a photorealistic editorial portrait of two women in a real-world photography style'
    : 'Create a photorealistic editorial portrait';
  const subjectLead = context.subject?.count === 2 ? 'The subjects are' : 'The subject is';
  const wardrobeLead = context.subject?.count === 2 ? 'They wear' : 'She wears';
  const sceneUsesDirectSentence = sceneContextValues.length > 0;
  const wardrobeUsesDirectSentence = wardrobeVisibilityValues.length > 0;
  const constraints = [
    ...getStructuredValues(valuesByLabel, ['Wardrobe Integrity']),
    'Keep the specified outfit visible where the chosen framing allows',
    'natural body proportions',
    'no extra people unless specified',
    'no visible text or logos unless explicitly requested',
  ];

  return {
    imageType,
    sceneText: joinNaturalPromptValues(sceneValues),
    subjectText: joinNaturalPromptValues(subjectValues),
    wardrobeText: joinNaturalPromptValues(wardrobeValues),
    poseText: joinNaturalPromptValues(poseValues),
    lightingText: joinNaturalPromptValues(lightingValues),
    cameraText: joinNaturalPromptValues(cameraValues),
    constraintsText: joinNaturalPromptValues(constraints),
    subjectLead,
    wardrobeLead,
    sceneUsesDirectSentence,
    wardrobeUsesDirectSentence,
  };
}

function buildGptPromptFromStructuredPrompt(structuredPrompt, context) {
  const valuesByLabel = parseStructuredPromptLines(structuredPrompt);
  const section = (title, sentence) => {
    const cleaned = ensureTerminalPeriod(stripMarkdown(sentence || '').replace(/\s+/g, ' ').trim());
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
    constraintsText,
    subjectLead,
    wardrobeLead,
    sceneUsesDirectSentence,
    wardrobeUsesDirectSentence,
  } = buildPromptSectionSources(valuesByLabel, context);

  return [
    section('Image Type', imageType),
    sceneText ? section('Scene', sceneUsesDirectSentence ? sceneText : `The portrait takes place in ${sceneText}`) : '',
    subjectText ? section('Subject', `${subjectLead} ${subjectText}`) : '',
    wardrobeText ? section('Wardrobe', wardrobeUsesDirectSentence ? wardrobeText : `${wardrobeLead} ${wardrobeText}`) : '',
    section('Pose and Composition', poseText),
    section('Lighting', lightingText),
    section('Camera Look', cameraText),
    section('Constraints', constraintsText),
    'multi-cut sequence n=2',
  ].filter(Boolean).join('\n\n');
}

function buildZImagePrompt(context, character, wardrobe, wardrobeColors, lightDirection, film, opticalEffect, duoInteraction) {
  const characterSlots = extractCharacterSlots(character);
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
  const waistlineCompatibilityText = buildWaistlineCompatibilityPrompt(wardrobeSlots);
  const wardrobeLayeringLogicText = buildWardrobeLayeringLogicPrompt(wardrobeSlots);
  const specialSubjectMode = isSpecialSubject(context.subject);
  const useCharacterIdentityAnchor = Boolean(context.characterProfilePrompt) && context.subject.count === 1 && !specialSubjectMode;
  const sceneAccentText = buildContextualSceneAccent(context);
  const importedWorldSceneArchitectureText = getImportedWorldSceneArchitectureText(context);
  const closeupSceneContextText = buildCloseupSceneContextPrompt(context);
  const closeupWardrobeVisibilityText = buildCloseupWardrobeVisibilityPrompt(context, wardrobeSlots, wardrobeColors);
  const isCloseupVisibility = Boolean(closeupWardrobeVisibilityText);
  const sceneProtectedWardrobeMode = !specialSubjectMode
    && Boolean(
      wardrobeSlots.specialOutfit
      || wardrobeSlots.specialOutfitA
      || wardrobeSlots.specialOutfitB
      || wardrobeSlots.outfitPreset
      || wardrobeSlots.outfitPresetA
      || wardrobeSlots.outfitPresetB
    );
  const sentence = (value) => ensureTerminalPeriod(stripMarkdown(value || '').replace(/\s+/g, ' ').trim());
  const joinSentenceParts = (parts) => sentence(parts.filter(Boolean).join(', '));
  const leadSentence = (lead, parts) => {
    const detail = parts.filter(Boolean).join(', ');
    return detail ? sentence(`${lead} ${detail}`) : '';
  };
  const skeletonMode = isSkeletonSubject(context.subject);
  const fixedCompositionSetActive = isFixedCompositionSetActive(context.fixedCompositionSet);
  const buildZImageScenePriorityText = () => {
    if (!sceneProtectedWardrobeMode || !context.location || isNoneLikeItem(context.location)) return '';

    const locationAnchor = stripMarkdown(context.location.en || context.location.zh || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[()]/g, '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(', ');

    if (!locationAnchor) return '';
    return `Scene priority: (${locationAnchor}:1.35), keep the recognizable selected environment visible behind the subject, preserve clear spatial context and background details, avoid plain or empty background`;
  };
  const buildCharacterText = () => {
    if (specialSubjectMode) {
      const specialActionText = characterSlots.specialAction && !isNoneLikeItem(characterSlots.specialAction)
        ? (skeletonMode ? sanitizeSkeletonPromptText(characterSlots.specialAction.en) : characterSlots.specialAction.en)
        : '';
      const poseComposerText = characterSlots.poseComposer && !isNoneLikeItem(characterSlots.poseComposer)
        ? (skeletonMode ? sanitizeSkeletonPromptText(characterSlots.poseComposer.en) : characterSlots.poseComposer.en)
        : '';
      const parts = [
        skeletonMode ? sanitizeSkeletonPromptText(context.subject.en) : context.subject.en,
        buildSpecialSubjectIntegrationPrompt(context.subject),
        isAndroidSubject(context.subject) && characterSlots.hairstyle && !isNoneLikeItem(characterSlots.hairstyle) ? characterSlots.hairstyle.en : '',
        isAndroidSubject(context.subject) && characterSlots.hairColor && !isNoneLikeItem(characterSlots.hairColor) ? characterSlots.hairColor.en : '',
        characterSlots.expression && !isNoneLikeItem(characterSlots.expression) ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(characterSlots.expression, 'expression', context.subject.count)) : resolvePromptVariant(characterSlots.expression, 'expression', context.subject.count)) : '',
        poseComposerText,
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
    const parts = [
      appendSubjectAccessories(
        useCharacterIdentityAnchor ? `${context.subject.en} ${context.characterProfilePrompt}` : context.subject.en,
        subjectAccessoryText
      ),
      characterSlots.bodyType?.en,
      context.subject.count === 2
        ? [
            characterSlots.facialFeaturesA && !isNoneLikeItem(characterSlots.facialFeaturesA)
              ? `woman 1 has ${characterSlots.facialFeaturesA.en}`
              : '',
            characterSlots.facialFeaturesB && !isNoneLikeItem(characterSlots.facialFeaturesB)
              ? `woman 2 has ${characterSlots.facialFeaturesB.en}`
              : '',
          ].filter(Boolean).join(', ')
        : (!useCharacterIdentityAnchor ? characterSlots.facialFeatures?.en : ''),
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
      headAccessoryText,
      !useCharacterIdentityAnchor ? characterSlots.skinDetails?.en : '',
      context.subject.count === 2
        ? [buildRoleExpressionPrompt(characterSlots.expressionA, 'woman 1'), buildRoleExpressionPrompt(characterSlots.expressionB, 'woman 2')].filter(Boolean).join(', ')
        : (characterSlots.expression ? resolvePromptVariant(characterSlots.expression, 'expression', context.subject.count) : ''),
      characterSlots.specialAction && !isNoneLikeItem(characterSlots.specialAction) ? characterSlots.specialAction.en : '',
      context.subject.count === 2
        ? (characterSlots.duoPose && !isNoneLikeItem(characterSlots.duoPose) ? characterSlots.duoPose.en : '')
        : (characterSlots.poseComposer && !isNoneLikeItem(characterSlots.poseComposer)
          ? characterSlots.poseComposer.en
          : (characterSlots.pose && !isNoneLikeItem(characterSlots.pose) ? resolvePromptVariant(characterSlots.pose, 'pose', context.subject.count) : '')),
      context.subject.count === 2 ? duoInteraction?.en : '',
    ].filter(Boolean);

    return leadSentence('Create a photorealistic editorial portrait of', parts);
  };
  const buildWardrobeText = () => {
    const parts = [];
    const add = (value) => {
      if (value) parts.push(value);
    };
    if (isCloseupVisibility) return sentence(closeupWardrobeVisibilityText);
    const buildSingleOutfitPresetText = () => buildOutfitPresetPrompt(wardrobeSlots.outfitPreset, {
      legacy: wardrobeColors.outfitPresetColor,
      primary: wardrobeColors.outfitPresetPrimaryColor,
      contrast: wardrobeColors.outfitPresetContrastColor,
      lockedPalette: wardrobeColors.outfitPresetLockedPalette,
      completeLookPalette: wardrobeColors.completeLookPalette,
    });
    const buildSingleOuterwearText = ({ minimalStyling = false } = {}) => buildOuterwearColoredPrompt(wardrobeSlots.outerwear, wardrobeColors.outerwearColor, {
      fit: wardrobeSlots.outerwearFit,
      pattern: wardrobeSlots.outerwearPattern,
      opening: wardrobeSlots.outerwearOpening,
      styling: wardrobeSlots.outerwearStyling,
      minimalStyling,
    });
    if (wardrobeSlots.specialOutfitA || wardrobeSlots.specialOutfitB) {
      const specialAText = buildSpecialOutfitPrompt(wardrobeSlots.specialOutfitA, wardrobeColors.completeLookPaletteA);
      const specialBText = buildSpecialOutfitPrompt(wardrobeSlots.specialOutfitB, wardrobeColors.completeLookPaletteB);
      add(specialAText ? `woman 1 wears complete special outfit: ${specialAText}` : '');
      add(specialBText ? `woman 2 wears complete special outfit: ${specialBText}` : '');
      return parts.length > 0 ? sentence(parts.join(', ')) : '';
    }
    if (wardrobeSlots.specialOutfit) {
      add(`She wears complete special outfit: ${buildSpecialOutfitPrompt(wardrobeSlots.specialOutfit, wardrobeColors.completeLookPalette)}`);
      return parts.length > 0 ? sentence(parts.join(', ')) : '';
    }
    const buildRoleLayerText = (role) => {
      const suffix = role === 'a' ? 'A' : 'B';
      return [
        buildRoleOuterwearWardrobePrompt(wardrobeSlots, wardrobeColors, role),
        buildColoredGrokPrompt(wardrobeSlots[`legwear${suffix}`], wardrobeColors[`legwear${suffix}Color`]),
        buildColoredGrokPrompt(wardrobeSlots[`shoes${suffix}`], wardrobeColors[`shoes${suffix}Color`]),
      ].filter(Boolean).join(', ');
    };
    const buildRoleMainText = (role) => {
      const suffix = role === 'a' ? 'A' : 'B';
      const preset = wardrobeSlots[`outfitPreset${suffix}`];
      if (preset && !isNoneLikeItem(preset)) {
        return buildOutfitPresetPrompt(preset, {
          legacy: wardrobeColors[`outfitPreset${suffix}Color`],
          primary: wardrobeColors[`outfitPreset${suffix}PrimaryColor`],
          contrast: wardrobeColors[`outfitPreset${suffix}ContrastColor`],
          lockedPalette: wardrobeColors[`outfitPreset${suffix}LockedPalette`],
          completeLookPalette: wardrobeColors[`completeLookPalette${suffix}`],
        });
      }

      const dressText = buildCompleteLookDressPrompt(wardrobeSlots[`dress${suffix}`], wardrobeColors[`dress${suffix}Color`], wardrobeColors[`completeLookPalette${suffix}`], { secondaryColor: wardrobeColors[`topBottomPalette${suffix}`]?.bottomColor });
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
        buildRoleBottomWardrobePrompt(wardrobeSlots[`pants${suffix}`], wardrobeSlots, wardrobeColors, role),
        buildRoleBottomWardrobePrompt(wardrobeSlots[`skirt${suffix}`], wardrobeSlots, wardrobeColors, role),
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
      add(buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor));
      add(buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor));
    } else if (wardrobeSlots.outfitPreset) {
      const outfitPresetText = buildSingleOutfitPresetText();
      const outerwearText = buildSingleOuterwearText({ minimalStyling: true });
      const legwearText = buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor);
      const shoesText = buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor);

      if (outerwearText) {
        add(`She wears ${outerwearText}, layered over ${outfitPresetText}`);
      } else {
        add(`She wears ${outfitPresetText}`);
      }
      if (legwearText) add(`paired with ${legwearText}`);
      if (shoesText) add(`paired with ${shoesText}`);
    } else {
      const dressText = buildCompleteLookDressPrompt(wardrobeSlots.dress, wardrobeColors.dressColor, wardrobeColors.completeLookPalette, { secondaryColor: wardrobeColors.topBottomPalette?.bottomColor });
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
        add(buildBottomWardrobePrompt(wardrobeSlots.pants, wardrobeSlots, wardrobeColors));
        add(buildBottomWardrobePrompt(wardrobeSlots.skirt, wardrobeSlots, wardrobeColors));
      }
      add(buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor));
      add(buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor));
      add(waistlineCompatibilityText);
      add(wardrobeLayeringLogicText);
    }
    if (context.subject.count === 2 && !(wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB)) {
      add(buildRoleLayerText('a') ? `woman 1 additional styling includes ${buildRoleLayerText('a')}` : '');
      add(buildRoleLayerText('b') ? `woman 2 additional styling includes ${buildRoleLayerText('b')}` : '');
    }

    return parts.length > 0 ? sentence(parts.join(', ')) : '';
  };
  const buildSceneText = () => {
    if (fixedCompositionSetActive) {
      return leadSentence('The portrait uses', [
        skeletonMode ? sanitizeSkeletonPromptText(context.fixedCompositionSet.en) : context.fixedCompositionSet.en,
        context.fixedSetPosition && !isNoneLikeItem(context.fixedSetPosition) ? (skeletonMode ? sanitizeSkeletonPromptText(context.fixedSetPosition.en) : context.fixedSetPosition.en) : '',
        context.fixedSetCaptureMode && !isNoneLikeItem(context.fixedSetCaptureMode) ? (skeletonMode ? sanitizeSkeletonPromptText(context.fixedSetCaptureMode.en) : context.fixedSetCaptureMode.en) : '',
        context.fixedSetPerformanceState && !isNoneLikeItem(context.fixedSetPerformanceState) ? (skeletonMode ? sanitizeSkeletonPromptText(context.fixedSetPerformanceState.en) : context.fixedSetPerformanceState.en) : '',
        skeletonMode ? sanitizeSkeletonPromptText(buildFixedSetIntegrityText(context.fixedCompositionSet, context.fixedSetCaptureMode)) : buildFixedSetIntegrityText(context.fixedCompositionSet, context.fixedSetCaptureMode),
        context.lighting && !isNoneLikeItem(context.lighting) ? (skeletonMode ? sanitizeSkeletonPromptText(context.lighting.en) : context.lighting.en) : '',
        lightDirection && !isNoneLikeItem(lightDirection) ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count)) : resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count)) : '',
      ]);
    }
    if (isCloseupVisibility) {
      return sentence([
        skeletonMode ? sanitizeSkeletonPromptText(closeupSceneContextText) : closeupSceneContextText,
        context.lighting && !isNoneLikeItem(context.lighting) ? (skeletonMode ? sanitizeSkeletonPromptText(context.lighting.en) : context.lighting.en) : '',
        lightDirection && !isNoneLikeItem(lightDirection) ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count)) : resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count)) : '',
      ].filter(Boolean).join(', '));
    }

    const sceneParts = [
      skeletonMode ? sanitizeSkeletonPromptText(importedWorldSceneArchitectureText) : importedWorldSceneArchitectureText,
      context.location && !isNoneLikeItem(context.location) ? (skeletonMode ? sanitizeSkeletonPromptText(context.location.en) : context.location.en) : '',
      skeletonMode ? sanitizeSkeletonPromptText(sceneAccentText) : sceneAccentText,
      context.lighting && !isNoneLikeItem(context.lighting) ? (skeletonMode ? sanitizeSkeletonPromptText(context.lighting.en) : context.lighting.en) : '',
      lightDirection && !isNoneLikeItem(lightDirection) ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count)) : resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count)) : '',
      skeletonMode ? sanitizeSkeletonPromptText(buildZImageScenePriorityText()) : buildZImageScenePriorityText(),
    ].filter(Boolean);

    return leadSentence('The setting is', sceneParts);
  };
  const buildCameraText = () => {
    if (fixedCompositionSetActive) {
      return '';
    }

    return leadSentence('The composition uses', [
      context.framing ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(context.framing, 'framing', context.subject.count)) : resolvePromptVariant(context.framing, 'framing', context.subject.count)) : '',
      context.angle ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(context.angle, 'angle', context.subject.count)) : resolvePromptVariant(context.angle, 'angle', context.subject.count)) : '',
      context.orbit ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(context.orbit, 'orbit', context.subject.count)) : resolvePromptVariant(context.orbit, 'orbit', context.subject.count)) : '',
      context.lens?.en,
      skeletonMode ? sanitizeSkeletonPromptText(opticalEffect?.en) : opticalEffect?.en,
    ]);
  };
  const buildPhotographyStyleText = () => joinSentenceParts([
    context.style && !isNoneLikeItem(context.style) ? (skeletonMode ? sanitizeSkeletonPromptText(buildPhotographyStylePrompt(context.style)) : buildPhotographyStylePrompt(context.style)) : '',
  ]);
  const buildRenderingText = () => joinSentenceParts([
    skeletonMode ? sanitizeSkeletonPromptText(film?.en) : film?.en,
    skeletonMode
      ? 'natural photographic detail, coherent anatomical structure, clear skeletal structure readability, realistic spatial depth'
      : specialSubjectMode
        ? 'natural photographic detail, coherent subject construction, clear material readability, realistic spatial depth'
      : 'natural photographic detail, coherent fabric construction, clear facial readability, realistic spatial depth',
    'do not add visible text unless explicitly requested',
  ]);

  return [
    buildCharacterText(),
    sceneProtectedWardrobeMode ? buildSceneText() : '',
    buildWardrobeText(),
    sceneProtectedWardrobeMode ? '' : buildSceneText(),
    buildPhotographyStyleText(),
    buildCameraText(),
    buildRenderingText(),
  ].filter(Boolean).join(' ');
}

function compactAiSentence(sentenceText, limit = 3) {
  return stripMarkdown(sentenceText || '')
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/g, '')
    .split(/\s*,\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, limit)
    .join(', ');
}

function buildAiPromptFromStructuredPrompt(structuredPrompt, context) {
  const valuesByLabel = parseStructuredPromptLines(structuredPrompt);
  const fixedCompositionSetActive = isFixedCompositionSetActive(context.fixedCompositionSet);
  const {
    imageType,
    sceneText,
    subjectText,
    wardrobeText,
    poseText,
    lightingText,
    cameraText,
    constraintsText,
    subjectLead,
    sceneUsesDirectSentence,
    wardrobeLead,
    wardrobeUsesDirectSentence,
  } = buildPromptSectionSources(valuesByLabel, context);
  const parts = [
    compactAiSentence(imageType, 1),
    sceneText ? (sceneUsesDirectSentence ? compactAiSentence(sceneText, fixedCompositionSetActive ? 32 : 2) : `The scene is ${compactAiSentence(sceneText, fixedCompositionSetActive ? 32 : 2)}`) : '',
    subjectText ? `${subjectLead} ${compactAiSentence(subjectText, 4)}` : '',
    wardrobeText ? (wardrobeUsesDirectSentence ? compactAiSentence(wardrobeText, 6) : `${wardrobeLead} ${compactAiSentence(wardrobeText, 6)}`) : '',
    poseText ? `Pose and composition: ${compactAiSentence(poseText, 5)}` : '',
    lightingText ? `Lighting: ${compactAiSentence(lightingText, 3)}` : '',
    cameraText ? `Camera look: ${compactAiSentence(cameraText, 3)}` : '',
    constraintsText ? `Keep ${compactAiSentence(constraintsText, 3)}` : '',
  ]
    .map((part) => ensureTerminalPeriod(part))
    .filter(Boolean);

  return [...new Set(parts)].join(' ');
}

function buildPrompts(context, character, wardrobe, wardrobeColors, lightDirection, film, opticalEffect, duoInteraction) {
  const structuredPrompt = buildStructuredGrokPrompt(context, character, wardrobe, wardrobeColors, lightDirection, film, duoInteraction);
  const grokPrompt = buildGptPromptFromStructuredPrompt(structuredPrompt, context);
  const zImagePrompt = buildZImagePrompt(context, character, wardrobe, wardrobeColors, lightDirection, film, opticalEffect, duoInteraction);
  const midjourneyPrompt = buildAiPromptFromStructuredPrompt(structuredPrompt, context);

  return { midjourneyPrompt, grokPrompt, zImagePrompt };
}

function buildSelectionSnapshot(context, wardrobe, wardrobeColors, character, lightDirection, film, duoInteraction) {
  const characterSlots = extractCharacterSlots(character);
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
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
  return {
    subjectCount: isSpecialSubject(context.subject) ? '1' : context.subject.id,
    specialSubjectId: isSpecialSubject(context.subject) ? context.subject.id : 'none',
    aspectRatio: context.aspectRatio.id,
    styleId: context.style?.id || '',
    cameraSystemId: context.cameraSystem?.id || '',
    sceneAttributeId: context.sceneAttribute?.id || '',
    locationId: context.location?.id || '',
    importedWorldSceneMode: context.locks?.importedWorldSceneMode || 'none',
    importedWorldSceneLabel: context.locks?.importedWorldSceneLabel || '',
    importedWorldSceneArchitectureText: context.locks?.importedWorldSceneArchitectureText || '',
    fixedCompositionSetId: context.fixedCompositionSet?.id || 'none',
    fixedSetPositionId: context.fixedSetPosition?.id || 'none',
    fixedSetCaptureModeId: context.fixedSetCaptureMode?.id || 'photographer-shot',
    fixedSetPerformanceStateId: context.fixedSetPerformanceState?.id || 'model-natural',
    framingId: context.framing?.id || '',
    angleId: context.angle?.id || '',
    orbitId: context.orbit?.id || '',
    lensId: context.lens?.id || '',
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
    duoPoseId: characterSlots.duoPose?.id?.split(':').pop() || '',
    expressionId: characterSlots.expression?.id || '',
    expressionAId: characterSlots.expressionA?.id?.replace(/:a$/, '') || '',
    expressionBId: characterSlots.expressionB?.id?.replace(/:b$/, '') || '',
    poseId: characterSlots.pose?.id || '',
    specialActionId: characterSlots.specialAction?.id || '',
    poseBaseId: characterSlots.poseComposer?.meta?.poseBaseId || 'none',
    poseArrangementId: characterSlots.poseComposer?.meta?.poseArrangementId || 'none',
    poseHandId: characterSlots.poseComposer?.meta?.poseHandId || 'none',
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
  const lockControls = getLockControls(customLibrary);
  const runtime = buildCatalog(customLibrary);
  const effectiveLocks = sanitizeLocksForCloseupMode(locks, lockControls);
  const selectedFixedCompositionSet = getFixedCompositionSetOption(effectiveLocks.fixedCompositionSetId);
  const fixedCompositionSetActive = isFixedCompositionSetActive(selectedFixedCompositionSet) && effectiveLocks.subjectCount !== '2';
  if (fixedCompositionSetActive) {
    effectiveLocks.sceneAttributeId = '';
    effectiveLocks.importedWorldSceneMode = 'none';
    effectiveLocks.importedWorldSceneLabel = '';
    effectiveLocks.importedWorldSceneArchitectureText = '';

    ['locationId', 'framingId', 'angleId', 'orbitId', 'lensId', 'opticalEffectId'].forEach((key) => {
      const noneOption = getControlOptionByZh(lockControls, key, '全無');
      effectiveLocks[key] = noneOption?.id || '';
    });

    const requestedStyle = getControlOptionById(lockControls, 'styleId', locks.styleId);
    if (requestedStyle) effectiveLocks.styleId = requestedStyle.id;
  } else {
    effectiveLocks.fixedCompositionSetId = 'none';
    effectiveLocks.fixedSetPositionId = 'none';
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
  const subject = specialSubject || getSubjectOption(effectiveLocks.subjectCount);
  const hasWardrobeLocks = !specialSubject && hasEffectiveWardrobeLocks(effectiveLocks, lockControls);
  const hasSceneLocks = Boolean(effectiveLocks.locationId || effectiveLocks.sceneAttributeId);
  const aspectRatio = getAspectRatioOption(effectiveLocks.aspectRatio);
  const sceneAttribute = getSceneAttributeOption(effectiveLocks.sceneAttributeId);
  const lowFrequencyPicker = (tag) => (candidates) => {
    const regular = candidates.filter((item) => !item.meta.tags?.includes(tag));
    const lowFrequency = candidates.filter((item) => item.meta.tags?.includes(tag));

    if (regular.length > 0 && (lowFrequency.length === 0 || Math.random() < 0.88)) {
      return sample(regular);
    }

    return sample(lowFrequency.length > 0 ? lowFrequency : candidates);
  };
  const location = pickWithLock(
    runtime.flatCatalog.locations,
    effectiveLocks.locationId,
    (item) => locationMatchesSceneAttribute(item, sceneAttribute)
  );
  let style = pickWithLock(runtime.flatCatalog.regional, effectiveLocks.styleId, (item) => styleFitsLocation(item, location));
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
      && (effectiveLocks.framingId || (!hasWardrobeLocks && !hasSceneLocks) || item.meta.visibility !== 'close')
      && framingSupportsSubject(item, subject, aspectRatio)
      && specialActionSupportsFraming(lockedSpecialAction, item)
    )
  );
  const expressionOptions = getByKey(runtime.catalog.character, '神情與眼神 (Expression & Gaze)');
  const lockedExpressions = [
    subject.count === 2 && effectiveLocks.expressionAId ? findById(expressionOptions, effectiveLocks.expressionAId) : null,
    subject.count === 2 && effectiveLocks.expressionBId ? findById(expressionOptions, effectiveLocks.expressionBId) : null,
    effectiveLocks.expressionId ? findById(expressionOptions, effectiveLocks.expressionId) : null,
  ].filter(Boolean);
  const pickCameraWithExpressionLock = lockedExpressions.length > 0 ? pickWithCompatibleLock : pickWithLock;
  const angle = pickCameraWithExpressionLock(
    runtime.flatCatalog.angle,
    effectiveLocks.angleId,
    (item) => framingSupportsAngle(framing, item) && lockedExpressions.every((expression) => angleSupportsExpression(item, expression)),
    lowFrequencyPicker('low_frequency_angle')
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
  const orbit = pickCameraWithExpressionLock(
    runtime.flatCatalog.orbit,
    effectiveLocks.orbitId,
    (item) => framingSupportsOrbit(framing, item) && lockedExpressions.every((expression) => orbitSupportsExpression(item, expression)) && specialActionSupportsOrbit(item, lockedSpecialAction)
  );
  const lens = pickWithLock(runtime.flatCatalog.lens, effectiveLocks.lensId);
  const locationForLightingCompatibility = hasImportedWorldSceneArchitecture ? null : location;
  const lighting = pickWithCompatibleLock(
    runtime.flatCatalog.lighting,
    effectiveLocks.lightingId,
    (item) => (locationForLightingCompatibility ? locationSupportsLighting(locationForLightingCompatibility, item) : true)
  );
  const lightDirection = !lighting
    ? null
    : pickWithCompatibleLock(
      runtime.flatCatalog.lightDirection,
      effectiveLocks.lightDirectionId,
      (item) => lightDirectionSupportsScene(item, framing, locationForLightingCompatibility, lighting)
    );
  const imagingLockId = effectiveLocks.filmId || (CAMERA_PROFILE_OPTION_IDS.has(effectiveLocks.cameraSystemId) ? effectiveLocks.cameraSystemId : '');
  const film = pickWithLock(runtime.flatCatalog.film, imagingLockId, () => true, lowFrequencyPicker('low_frequency_film'));
  const cameraSystem = getLegacyCameraSystemFromImaging(film);
  const opticalEffect = pickWithLock(runtime.flatCatalog.effects, effectiveLocks.opticalEffectId);
  const fixedCompositionSet = fixedCompositionSetActive ? selectedFixedCompositionSet : null;
  const fixedSetPosition = fixedCompositionSet
    ? getFixedSetPositionOption(effectiveLocks.fixedSetPositionId, fixedCompositionSet.id)
    : getFixedSetPositionOption('none');
  const fixedSetCaptureMode = fixedCompositionSet
    ? getFixedSetCaptureModeOption(effectiveLocks.fixedSetCaptureModeId)
    : getFixedSetCaptureModeOption('photographer-shot');
  const fixedSetPerformanceState = fixedCompositionSet
    ? getFixedSetPerformanceStateOption(effectiveLocks.fixedSetPerformanceStateId)
    : getFixedSetPerformanceStateOption('model-natural');
  const duoInteraction = subject.count === 2 ? getDuoInteractionOption(effectiveLocks.duoInteractionId) || sampleNonNone(DUO_INTERACTION_OPTIONS) : null;

  const context = {
    subject,
    aspectRatio,
    sceneAttribute,
    style,
    cameraSystem,
    location,
    framing,
    angle,
    orbit,
    lens,
    opticalEffect,
    fixedCompositionSet,
    fixedSetPosition,
    fixedSetCaptureMode,
    fixedSetPerformanceState,
    film,
    lighting,
    lightDirection,
    locks: effectiveLocks,
    duoInteraction,
    characterProfilePrompt: String(runtimeOptions.characterProfilePrompt || '').trim(),
  };
  const character = buildCharacter(context, runtime.catalog);
  const wardrobe = isSpecialSubject(subject) ? [] : buildWardrobe({ ...context }, effectiveLocks, runtime);
  context.wardrobe = wardrobe;
  const wardrobeColors = buildWardrobeColors(extractWardrobeSlots(wardrobe), effectiveLocks);

  const { midjourneyPrompt, grokPrompt, zImagePrompt } = buildPrompts(context, character, wardrobe, wardrobeColors, lightDirection, film, opticalEffect, duoInteraction);
  const summaryFields = buildSummaryFields(context, wardrobe, character, wardrobeColors);

  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    summary: buildSummary(summaryFields),
    summaryFields,
    midjourneyPrompt,
    grokPrompt,
    zImagePrompt,
    selection: buildSelectionSnapshot(context, wardrobe, wardrobeColors, character, lightDirection, film, duoInteraction),
    structured: {
      Style: [style],
      Character: character,
      Wardrobe: wardrobe,
      Location: [location],
      Framing: [framing, angle, orbit].filter(Boolean),
      Lighting: [lighting, lightDirection].filter(Boolean),
      'Lens & Imaging': [lens, opticalEffect, film].filter(Boolean),
    },
  };
}

export function generatePrompts(count = 1, locks = createEmptyLocks(), customLibrary = [], runtimeOptions = {}) {
  return Array.from({ length: count }, (_, index) => generateSinglePrompt(index, locks, customLibrary, runtimeOptions));
}
