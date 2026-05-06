import database from '../data/database.json' with { type: 'json' };

const SUBJECT_COUNT_OPTIONS = [
  { id: '1', zh: '1 位', en: 'an elegant beautiful 20-year-old Japanese or Korean woman', count: 1 },
  { id: '2', zh: '2 位', en: 'two elegant beautiful 20-year-old Japanese or Korean women', count: 2 },
  {
    id: 'skeleton',
    zh: '骷髏',
    en: 'a complete human skeleton, fleshless, clean anatomical specimen presence, realistic full skeletal structure, dark blue-black bone tone, subtle cool blue highlights, dry matte specimen surface, surreal photographic installation presence',
    count: 1,
    specialSubject: 'skeleton',
  },
  {
    id: 'reference',
    zh: '上傳人物',
    en: 'a woman matching the attached reference person, preserve facial identity and overall likeness from the attached image',
    count: 1,
    reference: true,
  },
];

const ASPECT_RATIO_POOL = [
  { id: '1:1', zh: '1:1', en: '1:1' },
  { id: '3:4', zh: '3:4', en: '3:4' },
  { id: '4:5', zh: '4:5', en: '4:5' },
  { id: '2:3', zh: '2:3', en: '2:3' },
  { id: '9:16', zh: '9:16', en: '9:16' },
  { id: '16:9', zh: '16:9', en: '16:9' },
];
const DEFAULT_ASPECT_RATIO = ASPECT_RATIO_POOL[2];
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
  { id: 'standard', zh: '正常', en: 'standard cut' },
  { id: 'fitted', zh: '合身', en: 'fitted cut' },
  { id: 'tight', zh: '緊身', en: 'tight body-skimming fit' },
  { id: 'oversized', zh: 'oversize', en: 'oversized proportion' },
];

const TOP_STYLING_OPTIONS = [
  { id: 'none', zh: '全無', en: '', meta: { tags: ['none'] } },
  { id: 'standard', zh: '正常穿著', en: 'worn in a standard natural position' },
  { id: 'tucked', zh: '紮入下身', en: 'tucked neatly into the bottoms' },
  { id: 'half-tucked', zh: '半紮', en: 'front hem half-tucked into the bottoms' },
  { id: 'untucked', zh: '自然放出', en: 'hem worn naturally loose over the waistband' },
  { id: 'knot-tied', zh: '下擺打結', en: 'front hem tied into a compact knot' },
];

const BOTTOM_FIT_OPTIONS = [
  { id: 'none', zh: '全無', en: '', meta: { tags: ['none'] } },
  { id: 'standard', zh: '正常', en: 'standard proportion' },
  { id: 'fitted', zh: '合身', en: 'fitted tailored line' },
  { id: 'tight', zh: '緊身', en: 'tight body-skimming line' },
  { id: 'wide', zh: '寬版', en: 'wide-volume cut' },
];

const BOTTOM_RISE_OPTIONS = [
  { id: 'none', zh: '全無', en: '', meta: { tags: ['none'] } },
  { id: 'high-rise', zh: '高腰', en: 'high-rise waist placement' },
  { id: 'mid-rise', zh: '正常腰線', en: 'standard waist placement' },
  { id: 'low-rise', zh: '低腰', en: 'low-rise waist placement' },
  { id: 'ultra-low-rise', zh: '超低腰', en: 'ultra-low-rise waist placement' },
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

const OUTFIT_PRESET_LOCKED_PALETTE_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none' },
  { id: 'metallic-gold', zh: '金屬金', en: 'metallic gold' },
  { id: 'metallic-silver', zh: '金屬銀', en: 'metallic silver' },
  { id: 'classic-black-trim', zh: '經典黑色細節', en: 'classic black trim' },
  { id: 'classic-white-apron', zh: '經典白圍裙', en: 'classic white apron' },
  { id: 'classic-white-cuff-collar', zh: '經典白領圈袖口', en: 'classic white cuffs and collar' },
  { id: 'classic-school-navy-trim', zh: '經典制服深藍飾線', en: 'classic school navy trim' },
];

const TOP_BOTTOM_PALETTE_OPTIONS = [
  { id: 'random', zh: '隨機', en: 'random top and bottom palette', random: true },
  { id: 'none', zh: '全無', en: 'none', meta: { tags: ['none'] } },
  {
    id: 'mocha-berry-soft-vanilla',
    zh: '摩卡莓果 × 柔香草',
    en: 'mocha berry top with soft vanilla bottom',
    topColor: { zh: '摩卡莓果', en: 'mocha berry (#7B4955)' },
    bottomColor: { zh: '柔香草', en: 'soft vanilla (#F4EDDB)' },
  },
  {
    id: 'jasmine-dark-graphite',
    zh: '茉莉黃 × 暗石墨',
    en: 'jasmine yellow top with dark graphite bottom',
    topColor: { zh: '茉莉黃', en: 'jasmine yellow (#F8DE7F)' },
    bottomColor: { zh: '暗石墨', en: 'dark graphite (#3A393F)' },
  },
  {
    id: 'matcha-cream-milky-honey',
    zh: '抹茶奶霜 × 蜜乳白',
    en: 'matcha cream top with milky honey bottom',
    topColor: { zh: '抹茶奶霜', en: 'matcha cream (#9CA763)' },
    bottomColor: { zh: '蜜乳白', en: 'milky honey (#F1E8C7)' },
  },
  {
    id: 'hot-chocolate-fresh-cabbage',
    zh: '熱巧克力 × 新鮮高麗菜',
    en: 'hot chocolate top with fresh cabbage bottom',
    topColor: { zh: '熱巧克力', en: 'hot chocolate (#2F2420)' },
    bottomColor: { zh: '新鮮高麗菜', en: 'fresh cabbage (#849753)' },
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
    topColor: { zh: '藤黃', en: 'xanthous yellow (#F7B638)' },
    bottomColor: { zh: '勃艮第紅', en: 'burgundy (#780115)' },
  },
  {
    id: 'claret-dark-purple',
    zh: '深紅酒 × 暗紫',
    en: 'claret top with dark purple bottom',
    topColor: { zh: '深紅酒', en: 'claret (#C20F47)' },
    bottomColor: { zh: '暗紫', en: 'dark purple (#241125)' },
  },
];
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

const ENVIRONMENT_MOOD_CATEGORY = '環境光氛 (Environment Mood)';
const LIGHT_STYLE_CATEGORY = '光線表現 (Light Style)';
const FOCAL_LENGTH_CATEGORY = '鏡頭焦段 (Focal Length)';
const OPTICAL_EFFECTS_CATEGORY = '光學效果 (Optical Effects)';
const SCENE_ATTRIBUTE_OPTIONS = [
  { id: '', zh: '未指定', en: '' },
  { id: 'indoor', zh: '室內', en: 'indoor setting' },
  { id: 'outdoor', zh: '戶外', en: 'outdoor setting' },
  { id: 'other', zh: '其他', en: 'other dedicated setting' },
];

const LOCK_DEFINITIONS = [
  { key: 'subjectCount', label: '人物數量', options: SUBJECT_COUNT_OPTIONS, required: true, defaultValue: '1', section: 'core' },
  { key: 'aspectRatio', label: '畫面比例', options: ASPECT_RATIO_OPTIONS, required: true, defaultValue: 'random', section: 'core' },
  { key: 'styleId', label: '攝影風格', category: '攝影風格', section: 'core' },
  { key: 'sceneAttributeId', label: '場景屬性', options: SCENE_ATTRIBUTE_OPTIONS, section: 'core' },
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
  { key: 'duoPoseId', label: '雙人構圖姿態', options: DUO_POSE_OPTIONS, section: 'character' },
  { key: 'expressionId', label: '神情眼神', category: '神情與眼神 (Expression & Gaze)', section: 'character' },
  { key: 'expressionAId', label: '人物 1 神情眼神', category: '神情與眼神 (Expression & Gaze)', section: 'character' },
  { key: 'expressionBId', label: '人物 2 神情眼神', category: '神情與眼神 (Expression & Gaze)', section: 'character' },
  { key: 'poseId', label: '姿勢動作', category: '姿勢與肢體語言 (Pose & Body Language)', section: 'character' },
  { key: 'specialActionId', label: '特殊動作', category: '特殊動作 (Special Actions)', section: 'character' },
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
  { key: 'legwearId', label: '襪類', category: '襪類 (Legwear)', section: 'wardrobe' },
  { key: 'legwearColorId', label: '襪類配色', options: LEGWEAR_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outerwearId', label: '外套', category: '外套 (Outerwear)', section: 'wardrobe' },
  { key: 'outerwearColorId', label: '外套配色', options: LAYER_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outerwearPatternId', label: '外套圖案', category: '外套圖案 (Outerwear Surface Design)', section: 'wardrobe' },
  { key: 'outerwearStylingId', label: '外套穿法', category: '外套穿法 (Outerwear Styling)', section: 'wardrobe' },
  { key: 'shoesId', label: '鞋款', category: '鞋款 (Shoes)', section: 'wardrobe' },
  { key: 'shoesColorId', label: '鞋款配色', options: LAYER_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'legwearAId', label: '人物 1 襪類', category: '襪類 (Legwear)', section: 'wardrobe' },
  { key: 'legwearAColorId', label: '人物 1 襪類配色', options: LEGWEAR_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outerwearAId', label: '人物 1 外套', category: '外套 (Outerwear)', section: 'wardrobe' },
  { key: 'outerwearAColorId', label: '人物 1 外套配色', options: LAYER_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outerwearAPatternId', label: '人物 1 外套圖案', category: '外套圖案 (Outerwear Surface Design)', section: 'wardrobe' },
  { key: 'outerwearAStylingId', label: '人物 1 外套穿法', category: '外套穿法 (Outerwear Styling)', section: 'wardrobe' },
  { key: 'shoesAId', label: '人物 1 鞋款', category: '鞋款 (Shoes)', section: 'wardrobe' },
  { key: 'shoesAColorId', label: '人物 1 鞋款配色', options: LAYER_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'legwearBId', label: '人物 2 襪類', category: '襪類 (Legwear)', section: 'wardrobe' },
  { key: 'legwearBColorId', label: '人物 2 襪類配色', options: LEGWEAR_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outerwearBId', label: '人物 2 外套', category: '外套 (Outerwear)', section: 'wardrobe' },
  { key: 'outerwearBColorId', label: '人物 2 外套配色', options: LAYER_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'outerwearBPatternId', label: '人物 2 外套圖案', category: '外套圖案 (Outerwear Surface Design)', section: 'wardrobe' },
  { key: 'outerwearBStylingId', label: '人物 2 外套穿法', category: '外套穿法 (Outerwear Styling)', section: 'wardrobe' },
  { key: 'shoesBId', label: '人物 2 鞋款', category: '鞋款 (Shoes)', section: 'wardrobe' },
  { key: 'shoesBColorId', label: '人物 2 鞋款配色', options: LAYER_COLOR_OPTIONS, section: 'wardrobe' },
  { key: 'headAccessoryId', label: '頭部配件', category: '頭部配件 (Head Accessories)', section: 'wardrobe' },
  { key: 'eyewearId', label: '眼鏡', category: '眼鏡 (Eyewear)', section: 'wardrobe' },
  { key: 'earringsId', label: '耳環', category: '耳環 (Earrings)', section: 'wardrobe' },
  { key: 'neckAccessoryId', label: '頸部', category: '頸部 (Neck Accessories)', section: 'wardrobe' },
  { key: 'headAccessoryAId', label: '人物 1 頭部配件', category: '頭部配件 (Head Accessories)', section: 'wardrobe' },
  { key: 'eyewearAId', label: '人物 1 眼鏡', category: '眼鏡 (Eyewear)', section: 'wardrobe' },
  { key: 'earringsAId', label: '人物 1 耳環', category: '耳環 (Earrings)', section: 'wardrobe' },
  { key: 'neckAccessoryAId', label: '人物 1 頸部', category: '頸部 (Neck Accessories)', section: 'wardrobe' },
  { key: 'headAccessoryBId', label: '人物 2 頭部配件', category: '頭部配件 (Head Accessories)', section: 'wardrobe' },
  { key: 'eyewearBId', label: '人物 2 眼鏡', category: '眼鏡 (Eyewear)', section: 'wardrobe' },
  { key: 'earringsBId', label: '人物 2 耳環', category: '耳環 (Earrings)', section: 'wardrobe' },
  { key: 'neckAccessoryBId', label: '人物 2 頸部', category: '頸部 (Neck Accessories)', section: 'wardrobe' },
];

const REQUIRED_LOCK_KEYS = LOCK_DEFINITIONS.filter((definition) => definition.required).map((definition) => definition.key);
const LOCK_KEYS = new Set(LOCK_DEFINITIONS.map((definition) => definition.key));

const PARTIAL_REROLL_OPTIONS = [
  { key: 'styleId', label: 'Style' },
  { key: 'sceneAttributeId', label: 'Scene Attribute' },
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
  { key: 'duoPoseId', label: 'Duo Composition Pose' },
  { key: 'expressionId', label: 'Expression' },
  { key: 'expressionAId', label: 'Woman 1 Expression' },
  { key: 'expressionBId', label: 'Woman 2 Expression' },
  { key: 'poseId', label: 'Pose' },
  { key: 'specialActionId', label: 'Special Action' },
  { key: 'outfitPresetId', label: 'Outfit Preset' },
  { key: 'outfitPresetColorId', label: 'Outfit Preset Color' },
  { key: 'outfitPresetPrimaryColorId', label: 'Outfit Preset Primary Color' },
  { key: 'outfitPresetContrastColorId', label: 'Outfit Preset Contrast Color' },
  { key: 'outfitPresetLockedPaletteId', label: 'Outfit Preset Locked Palette' },
  { key: 'outfitPresetAId', label: 'Woman 1 Outfit Preset' },
  { key: 'outfitPresetAColorId', label: 'Woman 1 Outfit Preset Color' },
  { key: 'outfitPresetAPrimaryColorId', label: 'Woman 1 Outfit Preset Primary Color' },
  { key: 'outfitPresetAContrastColorId', label: 'Woman 1 Outfit Preset Contrast Color' },
  { key: 'outfitPresetALockedPaletteId', label: 'Woman 1 Outfit Preset Locked Palette' },
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
  { key: 'legwearId', label: 'Legwear' },
  { key: 'legwearColorId', label: 'Legwear Color' },
  { key: 'outerwearId', label: 'Outerwear' },
  { key: 'outerwearColorId', label: 'Outerwear Color' },
  { key: 'outerwearPatternId', label: 'Outerwear Surface Design' },
  { key: 'outerwearStylingId', label: 'Outerwear Styling' },
  { key: 'shoesId', label: 'Shoes' },
  { key: 'shoesColorId', label: 'Shoes Color' },
  { key: 'legwearAId', label: 'Woman 1 Legwear' },
  { key: 'legwearAColorId', label: 'Woman 1 Legwear Color' },
  { key: 'outerwearAId', label: 'Woman 1 Outerwear' },
  { key: 'outerwearAColorId', label: 'Woman 1 Outerwear Color' },
  { key: 'outerwearAPatternId', label: 'Woman 1 Outerwear Surface Design' },
  { key: 'outerwearAStylingId', label: 'Woman 1 Outerwear Styling' },
  { key: 'shoesAId', label: 'Woman 1 Shoes' },
  { key: 'shoesAColorId', label: 'Woman 1 Shoes Color' },
  { key: 'legwearBId', label: 'Woman 2 Legwear' },
  { key: 'legwearBColorId', label: 'Woman 2 Legwear Color' },
  { key: 'outerwearBId', label: 'Woman 2 Outerwear' },
  { key: 'outerwearBColorId', label: 'Woman 2 Outerwear Color' },
  { key: 'outerwearBPatternId', label: 'Woman 2 Outerwear Surface Design' },
  { key: 'outerwearBStylingId', label: 'Woman 2 Outerwear Styling' },
  { key: 'shoesBId', label: 'Woman 2 Shoes' },
  { key: 'shoesBColorId', label: 'Woman 2 Shoes Color' },
  { key: 'headAccessoryId', label: 'Head Accessory' },
  { key: 'eyewearId', label: 'Eyewear' },
  { key: 'earringsId', label: 'Earrings' },
  { key: 'neckAccessoryId', label: 'Neck Accessory' },
  { key: 'headAccessoryAId', label: 'Woman 1 Head Accessory' },
  { key: 'eyewearAId', label: 'Woman 1 Eyewear' },
  { key: 'earringsAId', label: 'Woman 1 Earrings' },
  { key: 'neckAccessoryAId', label: 'Woman 1 Neck Accessory' },
  { key: 'headAccessoryBId', label: 'Woman 2 Head Accessory' },
  { key: 'eyewearBId', label: 'Woman 2 Eyewear' },
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
  if (hasAny(haystack, ['plaza', 'pedestrian', 'crosswalk', 'sidewalk', 'street', 'streetfront', 'square', 'lawn edge', 'outdoor', 'shoreline', 'beach', 'park', 'deck', 'avenue', 'station front', '廣場', '行人區', '人行道', '街頭', '街角', '穿越口', '草地邊', '海灘', '岩岸', '公園', '木棧道', '戶外'])) {
    tags.push('outdoor');
  }
  if (hasAny(haystack, ['café', 'bar entrance', 'storefront', 'shopfront', 'night market', 'mall', 'laundromat', '咖啡', '夜市', '商場'])) {
    tags.push('commercial');
  }
  if (hasAny(haystack, ['subway', 'platform', 'station', 'train car', 'commuter train', 'carriage', 'railway carriage', 'grab poles', 'hand straps', '地鐵', '月台', '電車', '車廂', '吊環', '扶手柱'])) tags.push('transit', 'urban');
  if (hasAny(haystack, ['factory', 'control room', 'train yard', 'scaffolding', 'construction', '工廠', '工地', '機房'])) tags.push('industrial');
  if (hasAny(haystack, ['hospital', 'operating room', 'ward', 'classroom', 'music room', 'school', '病房', '診療室', '教室'])) {
    tags.push('institutional', 'indoor');
  }
  if (hasAny(haystack, ['opera house', 'mansion', 'library', 'old town', 'townhouse', '洋房', '歌劇院', '大宅', '老城'])) {
    tags.push('heritage');
  }
  if (hasAny(haystack, ['beach', 'shoreline', 'coastline', 'lake', 'lakeside', 'marina', 'harbor', 'waterfront', 'dockside', 'yacht', 'sailboat', 'pier', 'sand dune', '沙丘', '海灘', '湖邊', '岩岸', '碼頭', '港灣', '水岸', '遊艇', '帆船'])) {
    tags.push('waterfront', 'outdoor', 'natural');
  }
  if (hasAny(haystack, ['forest', 'grass', 'sunflower', 'park', '樹影', '森林', '草地', '花田', '公園'])) {
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

  if (hasAny(haystack, ['bird', 'top-down', 'zenith', 'overhead', '正上方俯視', '鳥瞰'])) return { tags: ['aerial', 'no_eye_contact', 'low_frequency_angle'] };
  if (hasAny(haystack, ['ground-level', '地面高度'])) return { tags: ['low_angle', 'low_frequency_angle'] };
  if (hasAny(haystack, ['knee-level', '膝蓋高度'])) return { tags: ['low_angle', 'low_frequency_angle'] };
  if (hasAny(haystack, ['hip-level', '腰部高度'])) return { tags: ['low_angle'] };
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
  const isEnvironmentCategory = category === ENVIRONMENT_MOOD_CATEGORY;

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
    if (item.zh === '霓虹夜色' || hasAny(haystack, ['neon night atmosphere'])) {
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
    if (hasAny(haystack, ['室內夜晚低照度暖光', 'indoor low-light warm night atmosphere'])) {
      tags.push('artificial_light', 'indoor', 'warm', 'dark', 'soft_light', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內燭光', 'candlelit interior atmosphere'])) {
      tags.push('artificial_light', 'indoor', 'warm', 'dark', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內冷色人造光', 'indoor cool artificial'])) {
      tags.push('artificial_light', 'indoor', 'cool', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_commercial', 'supports_heritage', 'supports_subterranean');
    }
    if (hasAny(haystack, ['室內冷白螢光日常', 'indoor fluorescent everyday atmosphere'])) {
      tags.push('artificial_light', 'indoor', 'cool', 'controlled', 'supports_indoor', 'supports_residential', 'supports_commercial', 'supports_hospitality', 'supports_subterranean');
    }
    if (hasAny(haystack, ['室內外光滲入微暗空間', 'dim interior lit mostly by exterior spill light'])) {
      tags.push('window_light', 'natural_light', 'indoor', 'dark', 'diffused', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['室內深夜冷暗微光', 'very dark late-night interior'])) {
      tags.push('window_light', 'natural_light', 'indoor', 'dark', 'cool', 'night_ambient', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage', 'supports_subterranean');
    }
    if (hasAny(haystack, ['室內霓虹夜色', 'indoor neon-lit atmosphere'])) {
      tags.push('artificial_light', 'indoor', 'neon', 'dark', 'supports_indoor', 'supports_commercial', 'supports_hospitality', 'supports_subterranean');
    }
    if (hasAny(haystack, ['高調純白攝影棚', 'high-key white studio atmosphere'])) {
      tags.push('artificial_light', 'indoor', 'studio_light', 'studio_scene_only', 'controlled', 'soft_light', 'supports_indoor', 'supports_studio', 'supports_commercial');
    }
    if (hasAny(haystack, ['柔霧美妝攝影棚', 'soft beauty studio atmosphere'])) {
      tags.push('artificial_light', 'indoor', 'studio_light', 'studio_scene_only', 'controlled', 'soft_light', 'portrait_light', 'supports_indoor', 'supports_studio', 'supports_commercial');
    }
    if (hasAny(haystack, ['舞台演出燈光', 'stage-lit atmosphere'])) {
      tags.push('artificial_light', 'stage_light', 'studio_scene_only', 'dramatic', 'supports_indoor', 'supports_commercial', 'supports_studio');
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
    if (hasAny(haystack, ['暖金黃昏色溫', 'warm golden-amber color temperature'])) {
      tags.push('soft_light', 'warm', 'color_temperature', 'supports_indoor', 'supports_outdoor', 'supports_studio', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['冷白日光色溫', 'cool clean daylight color temperature'])) {
      tags.push('soft_light', 'cool', 'color_temperature', 'supports_indoor', 'supports_outdoor', 'supports_studio', 'supports_urban', 'supports_natural');
    }
    if (hasAny(haystack, ['室內暖白燈色溫', 'indoor warm-white lamp color temperature'])) {
      tags.push('soft_light', 'warm', 'color_temperature', 'indoor', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_commercial', 'supports_studio');
    }
    if (hasAny(haystack, ['冷藍夜色光', 'cool blue night-toned light cast'])) {
      tags.push('cool', 'dark', 'color_temperature', 'supports_indoor', 'supports_outdoor', 'supports_studio', 'supports_urban', 'supports_subterranean');
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
    if (hasAny(haystack, ['冷調窗邊輪廓光', 'cool window-side rim light'])) {
      tags.push('backlight', 'portrait_light', 'cool', 'indoor', 'supports_indoor', 'supports_residential', 'supports_hospitality', 'supports_heritage');
    }
    if (hasAny(haystack, ['斑駁樹影光', 'dappled light'])) {
      tags.push('natural_light', 'sunlight', 'supports_outdoor', 'supports_natural', 'supports_urban');
    }
    if (hasAny(haystack, ['潮濕反射光', 'wet reflective light'])) {
      tags.push('reflective', 'wet_surface', 'outdoor_only', 'supports_outdoor', 'supports_urban');
    }
    if (hasAny(haystack, ['局部暖光', 'local warm glow'])) {
      tags.push('artificial_light', 'warm', 'supports_indoor', 'supports_hospitality', 'supports_residential', 'supports_commercial');
    }
    if (hasAny(haystack, ['深夜邊緣微光', 'midnight edge glimmer'])) {
      tags.push('backlight', 'dark', 'cool', 'supports_indoor', 'supports_outdoor', 'supports_studio', 'supports_urban', 'supports_subterranean');
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
const CLOSEUP_CHEST_UP_LABEL = '胸上特寫';
const WARDROBE_INCOMPATIBLE_CLOSEUP_LABELS = new Set(['特寫鏡頭 (Close-Up)', '臉部特寫', '局部五官特寫', '半臉傾斜特寫']);
const WARDROBE_SAFE_FRAMING_LABEL = '中景鏡頭 (Medium Shot)';
const EFFECTIVE_WARDROBE_LOCK_KEYS = new Set([
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
  'outerwearAId',
  'outerwearBId',
  'shoesId',
  'shoesAId',
  'shoesBId',
  'headAccessoryId',
  'headAccessoryAId',
  'headAccessoryBId',
  'eyewearId',
  'eyewearAId',
  'eyewearBId',
  'earringsId',
  'earringsAId',
  'earringsBId',
  'neckAccessoryId',
  'neckAccessoryAId',
  'neckAccessoryBId',
]);
const CLOSEUP_DISABLED_KEYS = new Set([
  'locationId',
  'poseId',
  'duoPoseId',
  'specialActionId',
  'duoInteractionId',
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
  'topFitId',
  'topFitAId',
  'topFitBId',
  'topStylingId',
  'topStylingAId',
  'topStylingBId',
  'topBottomPaletteId',
  'topBottomPaletteAId',
  'topBottomPaletteBId',
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
  'legwearColorId',
  'outerwearId',
  'outerwearColorId',
  'outerwearPatternId',
  'outerwearStylingId',
  'shoesId',
  'shoesColorId',
  'legwearAId',
  'legwearAColorId',
  'outerwearAId',
  'outerwearAColorId',
  'outerwearAPatternId',
  'outerwearAStylingId',
  'shoesAId',
  'shoesAColorId',
  'legwearBId',
  'legwearBColorId',
  'outerwearBId',
  'outerwearBColorId',
  'outerwearBPatternId',
  'outerwearBStylingId',
  'shoesBId',
  'shoesBColorId',
]);
const CLOSEUP_ALWAYS_ALLOWED_KEYS = new Set([
  'subjectCount',
  'aspectRatio',
  'styleId',
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
  'headAccessoryId',
  'eyewearId',
  'earringsId',
  'headAccessoryAId',
  'eyewearAId',
  'earringsAId',
  'headAccessoryBId',
  'eyewearBId',
  'earringsBId',
]);
const CLOSEUP_CHEST_ALLOWED_KEYS = new Set([
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
  'neckAccessoryId',
  'neckAccessoryAId',
  'neckAccessoryBId',
]);

function isCloseupModeFramingItem(framing) {
  return Boolean(framing?.zh && CLOSEUP_MODE_ZH_LABELS.has(framing.zh));
}

function isWardrobeIncompatibleCloseupFramingItem(framing) {
  return Boolean(framing?.zh && WARDROBE_INCOMPATIBLE_CLOSEUP_LABELS.has(framing.zh));
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

function getWardrobeSafeFramingId(controls) {
  const framingOptions = controls.find((control) => control.key === 'framingId')?.options || [];
  return framingOptions.find((option) => option.zh === WARDROBE_SAFE_FRAMING_LABEL)?.id ||
    framingOptions.find((option) => !isWardrobeIncompatibleCloseupFramingItem(option) && !isNoneLikeItem(option))?.id ||
    '';
}

export function isCloseupModeFramingId(framingId, customLibrary = []) {
  if (!framingId) return false;
  const controls = getLockControls(customLibrary);
  const framingControl = controls.find((control) => control.key === 'framingId');
  const framing = findById(framingControl?.options || [], framingId);
  return isCloseupModeFramingItem(framing);
}

export function getCloseupAllowedKeys(framingId, customLibrary = []) {
  const controls = getLockControls(customLibrary);
  const framingControl = controls.find((control) => control.key === 'framingId');
  const framing = findById(framingControl?.options || [], framingId);
  const allowed = new Set(CLOSEUP_ALWAYS_ALLOWED_KEYS);
  if (framing?.zh === CLOSEUP_CHEST_UP_LABEL) {
    CLOSEUP_CHEST_ALLOWED_KEYS.forEach((key) => allowed.add(key));
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
        legacyIds: Array.isArray(item.legacyIds) ? item.legacyIds : [],
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

  return normalizedWithLegacyColors;
}

export function sanitizeLocksForCloseupMode(rawLocks = {}, controls = []) {
  const nextLocks = normalizeLocks(rawLocks);
  const framing = nextLocks.framingId ? findById(controls.find((control) => control.key === 'framingId')?.options || [], nextLocks.framingId) : null;
  if (hasEffectiveWardrobeLocks(nextLocks, controls) && isWardrobeIncompatibleCloseupFramingItem(framing)) {
    nextLocks.framingId = getWardrobeSafeFramingId(controls);
    return nextLocks;
  }
  if (!isCloseupModeFramingItem(framing)) return nextLocks;

  const allowedKeys = new Set(CLOSEUP_ALWAYS_ALLOWED_KEYS);
  if (framing?.zh === CLOSEUP_CHEST_UP_LABEL) {
    CLOSEUP_CHEST_ALLOWED_KEYS.forEach((key) => allowedKeys.add(key));
  }

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
      if (['outerwearId', 'outerwearAId', 'outerwearBId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '外套 (Outerwear)');
      if (['outerwearPatternId', 'outerwearAPatternId', 'outerwearBPatternId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '外套圖案 (Outerwear Surface Design)');
      if (['outerwearStylingId', 'outerwearAStylingId', 'outerwearBStylingId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '外套穿法 (Outerwear Styling)');
      if (['shoesId', 'shoesAId', 'shoesBId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '鞋款 (Shoes)');
      if (['headAccessoryId', 'headAccessoryAId', 'headAccessoryBId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '頭部配件 (Head Accessories)');
      if (['eyewearId', 'eyewearAId', 'eyewearBId'].includes(definition.key)) options = getByKey(catalog.wardrobe, '眼鏡 (Eyewear)');
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

function buildTopWardrobePrompt(wardrobeSlots, wardrobeColors) {
  return buildColoredGrokPrompt(wardrobeSlots.top, wardrobeColors.topColor, {
    pattern: wardrobeSlots.topPattern,
    fit: wardrobeSlots.topFit,
    styling: wardrobeSlots.topStyling,
  });
}

function buildRoleTopWardrobePrompt(wardrobeSlots, wardrobeColors, role) {
  const suffix = role === 'a' ? 'A' : 'B';
  return buildColoredGrokPrompt(wardrobeSlots[`top${suffix}`], wardrobeColors[`top${suffix}Color`], {
    pattern: wardrobeSlots[`top${suffix}Pattern`],
    fit: wardrobeSlots[`topFit${suffix}`],
    styling: wardrobeSlots[`topStyling${suffix}`],
  });
}

function buildBottomWardrobePrompt(bottomItem, wardrobeSlots, wardrobeColors) {
  return buildColoredGrokPrompt(bottomItem, wardrobeColors.bottomColor, {
    pattern: wardrobeSlots.bottomPattern,
    fit: wardrobeSlots.bottomFit,
    rise: wardrobeSlots.bottomRise,
  });
}

function buildRoleBottomWardrobePrompt(bottomItem, wardrobeSlots, wardrobeColors, role) {
  const suffix = role === 'a' ? 'A' : 'B';
  return buildColoredGrokPrompt(bottomItem, wardrobeColors[`bottom${suffix}Color`], {
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

function getLightingEnvironmentFlags(lighting) {
  const tags = new Set(lighting?.meta?.tags || []);
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

  return { indoor, outdoor };
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

function lightDirectionSupportsScene(lightDirection, framing, location, lighting) {
  const directionTags = new Set(lightDirection.meta.tags);
  const locationTags = new Set(location.meta.tags);
  const lightingTags = new Set(lighting?.meta?.tags || []);
  const locationEnvironment = getLocationEnvironmentFlags(location);
  const directionEnvironment = getLightDirectionEnvironmentFlags(lightDirection);

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
    return location ? lightDirectionSupportsScene(item, framing, location, lightingForDirection) : true;
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
  if ((framingTags.has('partial_face') || framingTags.has('full_face_tight')) && (angleTags.has('low_angle') || angleTags.has('high_angle') || angleTags.has('aerial'))) return false;

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

function isSkeletonSubject(subject) {
  return subject?.specialSubject === 'skeleton';
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
  if (isSkeletonSubject(subject)) {
    return {
      zh: '一具完整人類骷髏',
      en: subject.en,
      id: `base-character-${subject.id}`,
      meta: { tags: ['skeleton', 'solo', 'surreal_subject'] },
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

function buildCharacter(context, catalog) {
  const character = [buildSubjectBase(context.subject)];
  const visibility = context.framing.meta.visibility;
  if (isSkeletonSubject(context.subject)) {
    const poseItems = getByKey(catalog.character, '姿勢與肢體語言 (Pose & Body Language)');
    const specialActionItems = getByKey(catalog.character, '特殊動作 (Special Actions)');

    if (context.locks?.specialActionId) {
      const specialAction = findById(specialActionItems, context.locks.specialActionId);
      if (specialAction && !isNoneLikeItem(specialAction)) {
        character.push(specialAction);
        return character;
      }
    }

    if (context.locks?.poseId) {
      const pose = findById(poseItems, context.locks.poseId);
      if (pose && !isNoneLikeItem(pose)) {
        character.push(pose);
        return character;
      }
    }

    const skeletonPose = visibilityAtLeast(visibility, 'full')
      ? sample(poseItems.filter((item) => !isNoneLikeItem(item) && poseSupportsLocationContext(item, context)))
      : null;
    if (skeletonPose) character.push(skeletonPose);
    return character;
  }
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
  if (visibility === 'close') return character;

  const specialAction = context.locks?.specialActionId
    ? pickCategory('特殊動作 (Special Actions)', context.locks, () => true, sample, false)
    : null;
  if (specialAction && !isNoneLikeItem(specialAction)) return character;

  if (context.locks?.poseId) {
    pickCategory('姿勢與肢體語言 (Pose & Body Language)', context.locks, () => true, sample, false);
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
    '外套 (Outerwear)': 'outerwearId',
    '外套圖案 (Outerwear Surface Design)': 'outerwearPatternId',
    '外套穿法 (Outerwear Styling)': 'outerwearStylingId',
    '鞋款 (Shoes)': 'shoesId',
    '頭部配件 (Head Accessories)': 'headAccessoryId',
    '眼鏡 (Eyewear)': 'eyewearId',
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
    'outerwearAPatternId',
    'outerwearAStylingId',
    'shoesAId',
    'legwearBId',
    'outerwearBId',
    'outerwearBPatternId',
    'outerwearBStylingId',
    'shoesBId',
  ].some((key) => Boolean(locks?.[key]));
  const hasDuoAccessoryLock = context.subject.count === 2 && [
    'headAccessoryAId',
    'eyewearAId',
    'earringsAId',
    'neckAccessoryAId',
    'headAccessoryBId',
    'eyewearBId',
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
    const keepExplicitCloseupWardrobeItem = (item) => {
      if (!item || isNoneLikeItem(item)) return false;
      if (item.meta?.tags?.includes('accessory_small')) return true;
      if (outfitPresetState.specifiedItem && item.id === outfitPresetState.specifiedItem.id) return true;
      if (dressState.specifiedItem && item.id === dressState.specifiedItem.id) return true;
      if (topState.specifiedItem && item.id === topState.specifiedItem.id) return true;
      return false;
    };

    if (context.subject.count === 2) {
      addRoleLockedPiece('頭部配件 (Head Accessories)', 'headAccessoryAId', 'a', 'headAccessory');
      addRoleLockedPiece('眼鏡 (Eyewear)', 'eyewearAId', 'a', 'eyewear');
      addRoleLockedPiece('耳環 (Earrings)', 'earringsAId', 'a', 'earrings');
      addRoleLockedPiece('頭部配件 (Head Accessories)', 'headAccessoryBId', 'b', 'headAccessory');
      addRoleLockedPiece('眼鏡 (Eyewear)', 'eyewearBId', 'b', 'eyewear');
      addRoleLockedPiece('耳環 (Earrings)', 'earringsBId', 'b', 'earrings');
    }
    if (!hasDuoAccessoryLock) {
      maybePick('頭部配件 (Head Accessories)', 0.28, () => true, { allowNoneWhenUnlocked: true });
      maybePick('眼鏡 (Eyewear)', 0.35, () => true, { allowNoneWhenUnlocked: true });
      maybePick('耳環 (Earrings)', 0.45, () => true, { allowNoneWhenUnlocked: true });
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

  if (!useDuoRoleWardrobe && ((hasOutfitPresetPieceResolved && !hasDuoLayerLock) || hasDressPiece || hasBottomPiece || locks?.outerwearId)) {
    const outerwearProbability = locks?.outerwearId
      ? 1
      : context.location.meta.tags.includes('outdoor')
        ? (hasOutfitPresetPieceResolved ? 0.55 : 0.6)
        : (hasOutfitPresetPieceResolved ? 0.3 : 0.35);
    const outerwearPiece = maybePick('外套 (Outerwear)', outerwearProbability, () => true, { allowNoneWhenUnlocked: true });
    const hasOuterwearPiece = Array.isArray(outerwearPiece)
      ? outerwearPiece.some((item) => item && !isNoneLikeItem(item))
      : Boolean(outerwearPiece && !isNoneLikeItem(outerwearPiece));

    if (hasOuterwearPiece) {
      maybePick('外套圖案 (Outerwear Surface Design)', locks?.outerwearPatternId ? 1 : 0.3, () => true, { allowNoneWhenUnlocked: true });
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

  if (!useDuoRoleWardrobe && !frameShowsAtLeast(visibility, 'medium') && locks?.outerwearId) {
    const outerwearPiece = maybePick('外套 (Outerwear)', 1, () => true, { allowNoneWhenUnlocked: true });
    const hasOuterwearPiece = Array.isArray(outerwearPiece)
      ? outerwearPiece.some((item) => item && !isNoneLikeItem(item))
      : Boolean(outerwearPiece && !isNoneLikeItem(outerwearPiece));
    if (hasOuterwearPiece) {
      maybePick('外套圖案 (Outerwear Surface Design)', 1, () => true, { allowNoneWhenUnlocked: true });
      maybePick('外套穿法 (Outerwear Styling)', 1, () => true, { allowNoneWhenUnlocked: true });
    }
  }

  if (!useDuoRoleWardrobe && ((frameShowsAtLeast(visibility, 'full') && !hasDuoLayerLock) || locks?.shoesId)) {
    maybePick('鞋款 (Shoes)', 1, () => true, { allowNoneWhenUnlocked: true });
  }

  if (context.subject.count === 2) {
    addRoleLockedPiece('襪類 (Legwear)', 'legwearAId', 'a', 'legwear');
    addRoleLockedPiece('外套 (Outerwear)', 'outerwearAId', 'a', 'outerwear');
    addRoleLockedPiece('外套圖案 (Outerwear Surface Design)', 'outerwearAPatternId', 'a', 'outerwearPattern');
    addRoleLockedPiece('外套穿法 (Outerwear Styling)', 'outerwearAStylingId', 'a', 'outerwearStyling');
    addRoleLockedPiece('鞋款 (Shoes)', 'shoesAId', 'a', 'shoes');
    addRoleLockedPiece('襪類 (Legwear)', 'legwearBId', 'b', 'legwear');
    addRoleLockedPiece('外套 (Outerwear)', 'outerwearBId', 'b', 'outerwear');
    addRoleLockedPiece('外套圖案 (Outerwear Surface Design)', 'outerwearBPatternId', 'b', 'outerwearPattern');
    addRoleLockedPiece('外套穿法 (Outerwear Styling)', 'outerwearBStylingId', 'b', 'outerwearStyling');
    addRoleLockedPiece('鞋款 (Shoes)', 'shoesBId', 'b', 'shoes');
    addRoleLockedPiece('頭部配件 (Head Accessories)', 'headAccessoryAId', 'a', 'headAccessory');
    addRoleLockedPiece('眼鏡 (Eyewear)', 'eyewearAId', 'a', 'eyewear');
    addRoleLockedPiece('耳環 (Earrings)', 'earringsAId', 'a', 'earrings');
    addRoleLockedPiece('頸部 (Neck Accessories)', 'neckAccessoryAId', 'a', 'neckAccessory');
    addRoleLockedPiece('頭部配件 (Head Accessories)', 'headAccessoryBId', 'b', 'headAccessory');
    addRoleLockedPiece('眼鏡 (Eyewear)', 'eyewearBId', 'b', 'eyewear');
    addRoleLockedPiece('耳環 (Earrings)', 'earringsBId', 'b', 'earrings');
    addRoleLockedPiece('頸部 (Neck Accessories)', 'neckAccessoryBId', 'b', 'neckAccessory');
  }

  if (!hasDuoAccessoryLock) {
    maybePick('頭部配件 (Head Accessories)', visibilityAtLeast(visibility, 'portrait') ? 0.28 : 0.12, () => true, { allowNoneWhenUnlocked: true });
    maybePick('眼鏡 (Eyewear)', visibilityAtLeast(visibility, 'portrait') ? 0.35 : 0.15, () => true, { allowNoneWhenUnlocked: true });
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
  const subjectLabel = isSkeletonSubject(context.subject)
    ? '一具完整人類骷髏'
    : context.subject.reference
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
  const lightingLabel = context.lighting && !isNoneLikeItem(context.lighting) ? context.lighting.zh : '-';
  const opticalEffectLabel = context.opticalEffect && !isNoneLikeItem(context.opticalEffect) ? context.opticalEffect.zh : '-';
  const formatPresetSummary = (preset, primaryColor) => {
    if (!preset) return '';
    return primaryColor?.zh ? `${primaryColor.zh}｜${preset.zh}` : preset.zh;
  };
  const summarizeSingleCharacter = () => {
    if (isSkeletonSubject(context.subject)) {
      return joinSummaryParts(
        subjectLabel,
        '深藍黑骨色',
        '乾淨標本質感',
        '超現實攝影裝置感',
        characterSlots.specialAction?.zh && !isNoneLikeItem(characterSlots.specialAction) ? characterSlots.specialAction.zh : '',
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
          wardrobeSlots.outerwearPattern?.zh && !isNoneLikeItem(wardrobeSlots.outerwearPattern) ? wardrobeSlots.outerwearPattern.zh : '',
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
    camera: joinSummaryParts(framingLabel, angleLabel, orbitLabel, lensLabel, aspectRatioLabel),
    lighting: joinSummaryParts(lightingLabel, opticalEffectLabel),
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
    pose: findSlot('character:姿勢與肢體語言-pose-body-language:'),
    specialAction: findSlot('character:特殊動作-special-actions:'),
  };
}

function extractWardrobeSlots(wardrobe) {
  const findSlot = (token) => wardrobe.find((item) => item.id?.includes(token) && !item.meta?.wardrobeRole);
  const findRoleSlot = (token, role, layerSlot) => wardrobe.find((item) => item.id?.includes(token) && item.meta?.wardrobeRole === role && item.meta?.layerSlot === layerSlot);
  const outfitPresets = wardrobe.filter((item) => item.id?.includes('wardrobe:套裝-outfit-presets:'));
  return {
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
    outerwearPattern: findSlot('wardrobe:外套圖案-outerwear-surface-design:'),
    outerwearStyling: findSlot('wardrobe:外套穿法-outerwear-styling:'),
    shoes: findSlot('wardrobe:鞋款-shoes:'),
    legwearA: findRoleSlot('wardrobe:襪類-legwear:', 'a', 'legwear'),
    outerwearA: findRoleSlot('wardrobe:外套-outerwear:', 'a', 'outerwear'),
    outerwearAPattern: findRoleSlot('wardrobe:外套圖案-outerwear-surface-design:', 'a', 'outerwearPattern'),
    outerwearAStyling: findRoleSlot('wardrobe:外套穿法-outerwear-styling:', 'a', 'outerwearStyling'),
    shoesA: findRoleSlot('wardrobe:鞋款-shoes:', 'a', 'shoes'),
    legwearB: findRoleSlot('wardrobe:襪類-legwear:', 'b', 'legwear'),
    outerwearB: findRoleSlot('wardrobe:外套-outerwear:', 'b', 'outerwear'),
    outerwearBPattern: findRoleSlot('wardrobe:外套圖案-outerwear-surface-design:', 'b', 'outerwearPattern'),
    outerwearBStyling: findRoleSlot('wardrobe:外套穿法-outerwear-styling:', 'b', 'outerwearStyling'),
    shoesB: findRoleSlot('wardrobe:鞋款-shoes:', 'b', 'shoes'),
    headAccessory: findSlot('wardrobe:頭部配件-head-accessories:'),
    eyewear: findSlot('wardrobe:眼鏡-eyewear:'),
    earrings: findSlot('wardrobe:耳環-earrings:'),
    neckAccessory: findSlot('wardrobe:頸部-neck-accessories:'),
    headAccessoryA: findRoleSlot('wardrobe:頭部配件-head-accessories:', 'a', 'headAccessory'),
    eyewearA: findRoleSlot('wardrobe:眼鏡-eyewear:', 'a', 'eyewear'),
    earringsA: findRoleSlot('wardrobe:耳環-earrings:', 'a', 'earrings'),
    neckAccessoryA: findRoleSlot('wardrobe:頸部-neck-accessories:', 'a', 'neckAccessory'),
    headAccessoryB: findRoleSlot('wardrobe:頭部配件-head-accessories:', 'b', 'headAccessory'),
    eyewearB: findRoleSlot('wardrobe:眼鏡-eyewear:', 'b', 'eyewear'),
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
  const normalizedLocks = normalizeLegacyOutfitPresetColors(locks || {});
  const outfitPresetColor = wardrobeSlots.outfitPreset && !isNoneLikeItem(wardrobeSlots.outfitPreset)
    ? getOutfitPresetColorOption(normalizedLocks.outfitPresetColorId) || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS)
    : null;
  const outfitPresetAColor = wardrobeSlots.outfitPresetA && !isNoneLikeItem(wardrobeSlots.outfitPresetA)
    ? getOutfitPresetColorOption(normalizedLocks.outfitPresetAColorId) || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS)
    : null;
  const outfitPresetBColor = wardrobeSlots.outfitPresetB && !isNoneLikeItem(wardrobeSlots.outfitPresetB)
    ? getOutfitPresetColorOption(normalizedLocks.outfitPresetBColorId) || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS)
    : null;
  const outfitPresetPrimaryColor = wardrobeSlots.outfitPreset && !isNoneLikeItem(wardrobeSlots.outfitPreset)
    ? getOutfitPresetColorOption(normalizedLocks.outfitPresetPrimaryColorId)
      || getOutfitPresetColorOption(normalizedLocks.outfitPresetColorId)
      || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS)
    : null;
  const outfitPresetContrastColor = wardrobeSlots.outfitPreset && !isNoneLikeItem(wardrobeSlots.outfitPreset)
    ? getOutfitPresetColorOption(normalizedLocks.outfitPresetContrastColorId)
    : null;
  const outfitPresetLockedPalette = wardrobeSlots.outfitPreset && !isNoneLikeItem(wardrobeSlots.outfitPreset)
    ? getOutfitPresetLockedPaletteOption(normalizedLocks.outfitPresetLockedPaletteId)
    : null;
  const outfitPresetAPrimaryColor = wardrobeSlots.outfitPresetA && !isNoneLikeItem(wardrobeSlots.outfitPresetA)
    ? getOutfitPresetColorOption(normalizedLocks.outfitPresetAPrimaryColorId)
      || getOutfitPresetColorOption(normalizedLocks.outfitPresetAColorId)
      || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS)
    : null;
  const outfitPresetAContrastColor = wardrobeSlots.outfitPresetA && !isNoneLikeItem(wardrobeSlots.outfitPresetA)
    ? getOutfitPresetColorOption(normalizedLocks.outfitPresetAContrastColorId)
    : null;
  const outfitPresetALockedPalette = wardrobeSlots.outfitPresetA && !isNoneLikeItem(wardrobeSlots.outfitPresetA)
    ? getOutfitPresetLockedPaletteOption(normalizedLocks.outfitPresetALockedPaletteId)
    : null;
  const outfitPresetBPrimaryColor = wardrobeSlots.outfitPresetB && !isNoneLikeItem(wardrobeSlots.outfitPresetB)
    ? getOutfitPresetColorOption(normalizedLocks.outfitPresetBPrimaryColorId)
      || getOutfitPresetColorOption(normalizedLocks.outfitPresetBColorId)
      || sampleNonNone(OUTFIT_PRESET_COLOR_OPTIONS)
    : null;
  const outfitPresetBContrastColor = wardrobeSlots.outfitPresetB && !isNoneLikeItem(wardrobeSlots.outfitPresetB)
    ? getOutfitPresetColorOption(normalizedLocks.outfitPresetBContrastColorId)
    : null;
  const outfitPresetBLockedPalette = wardrobeSlots.outfitPresetB && !isNoneLikeItem(wardrobeSlots.outfitPresetB)
    ? getOutfitPresetLockedPaletteOption(normalizedLocks.outfitPresetBLockedPaletteId)
    : null;
  const topBottomPalette = hasOutfitPreset ? null : getTopBottomPaletteOption(normalizedLocks.topBottomPaletteId);
  const topBottomPaletteA = hasOutfitPreset ? null : getTopBottomPaletteOption(normalizedLocks.topBottomPaletteAId);
  const topBottomPaletteB = hasOutfitPreset ? null : getTopBottomPaletteOption(normalizedLocks.topBottomPaletteBId);
  const topColor = !hasOutfitPreset && wardrobeSlots.top && !isNoneLikeItem(wardrobeSlots.top)
    ? topBottomPalette?.topColor || getGarmentColorOption(normalizedLocks.topColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS)
    : null;
  const topAColor = !hasOutfitPreset && wardrobeSlots.topA && !isNoneLikeItem(wardrobeSlots.topA)
    ? topBottomPaletteA?.topColor || getGarmentColorOption(normalizedLocks.topAColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS)
    : null;
  const topBColor = !hasOutfitPreset && wardrobeSlots.topB && !isNoneLikeItem(wardrobeSlots.topB)
    ? topBottomPaletteB?.topColor || getGarmentColorOption(normalizedLocks.topBColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS)
    : null;
  const dressColor = !hasOutfitPreset && wardrobeSlots.dress && !isNoneLikeItem(wardrobeSlots.dress) ? getGarmentColorOption(normalizedLocks.dressColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS) : null;
  const dressAColor = !hasOutfitPreset && wardrobeSlots.dressA && !isNoneLikeItem(wardrobeSlots.dressA) ? getGarmentColorOption(normalizedLocks.dressAColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS) : null;
  const dressBColor = !hasOutfitPreset && wardrobeSlots.dressB && !isNoneLikeItem(wardrobeSlots.dressB) ? getGarmentColorOption(normalizedLocks.dressBColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS) : null;
  const hasBottom = (wardrobeSlots.pants && !isNoneLikeItem(wardrobeSlots.pants)) || (wardrobeSlots.skirt && !isNoneLikeItem(wardrobeSlots.skirt));
  const hasBottomA = (wardrobeSlots.pantsA && !isNoneLikeItem(wardrobeSlots.pantsA)) || (wardrobeSlots.skirtA && !isNoneLikeItem(wardrobeSlots.skirtA));
  const hasBottomB = (wardrobeSlots.pantsB && !isNoneLikeItem(wardrobeSlots.pantsB)) || (wardrobeSlots.skirtB && !isNoneLikeItem(wardrobeSlots.skirtB));
  const bottomColor = !hasOutfitPreset && hasBottom ? topBottomPalette?.bottomColor || getGarmentColorOption(normalizedLocks.bottomColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS) : null;
  const bottomAColor = !hasOutfitPreset && hasBottomA ? topBottomPaletteA?.bottomColor || getGarmentColorOption(normalizedLocks.bottomAColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS) : null;
  const bottomBColor = !hasOutfitPreset && hasBottomB ? topBottomPaletteB?.bottomColor || getGarmentColorOption(normalizedLocks.bottomBColorId) || sampleNonNone(GARMENT_COLOR_OPTIONS) : null;
  const legwearColor = wardrobeSlots.legwear && !isNoneLikeItem(wardrobeSlots.legwear) ? getLegwearColorOption(normalizedLocks.legwearColorId) || sampleNonNone(LEGWEAR_COLOR_OPTIONS) : null;
  const outerwearColor = wardrobeSlots.outerwear && !isNoneLikeItem(wardrobeSlots.outerwear) ? getLayerColorOption(normalizedLocks.outerwearColorId) || sampleNonNone(LAYER_COLOR_OPTIONS) : null;
  const shoesColor = wardrobeSlots.shoes && !isNoneLikeItem(wardrobeSlots.shoes) ? getLayerColorOption(normalizedLocks.shoesColorId) || sampleNonNone(LAYER_COLOR_OPTIONS) : null;
  const legwearAColor = wardrobeSlots.legwearA && !isNoneLikeItem(wardrobeSlots.legwearA) ? getLegwearColorOption(normalizedLocks.legwearAColorId) || sampleNonNone(LEGWEAR_COLOR_OPTIONS) : null;
  const outerwearAColor = wardrobeSlots.outerwearA && !isNoneLikeItem(wardrobeSlots.outerwearA) ? getLayerColorOption(normalizedLocks.outerwearAColorId) || sampleNonNone(LAYER_COLOR_OPTIONS) : null;
  const shoesAColor = wardrobeSlots.shoesA && !isNoneLikeItem(wardrobeSlots.shoesA) ? getLayerColorOption(normalizedLocks.shoesAColorId) || sampleNonNone(LAYER_COLOR_OPTIONS) : null;
  const legwearBColor = wardrobeSlots.legwearB && !isNoneLikeItem(wardrobeSlots.legwearB) ? getLegwearColorOption(normalizedLocks.legwearBColorId) || sampleNonNone(LEGWEAR_COLOR_OPTIONS) : null;
  const outerwearBColor = wardrobeSlots.outerwearB && !isNoneLikeItem(wardrobeSlots.outerwearB) ? getLayerColorOption(normalizedLocks.outerwearBColorId) || sampleNonNone(LAYER_COLOR_OPTIONS) : null;
  const shoesBColor = wardrobeSlots.shoesB && !isNoneLikeItem(wardrobeSlots.shoesB) ? getLayerColorOption(normalizedLocks.shoesBColorId) || sampleNonNone(LAYER_COLOR_OPTIONS) : null;
  return {
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

function buildColoredGrokPrompt(item, color = null, { preset = false, pattern = null, styling = null, fit = null, rise = null } = {}) {
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
  let stylingText = styling && !isNoneLikeItem(styling)
    ? stripMarkdown(styling.en).replace(/\s+/g, ' ').trim()
    : '';
  if (isOuterwear && styling?.zh === '正常穿著') {
    stylingText = 'properly worn on both shoulders as a standard outer layer over the top, shoulder line fully covered';
  }
  const detailText = [riseText, fitText, patternText, stylingText].filter(Boolean).join(', ');
  if (!color || isNoneLikeItem(color)) return detailText ? `${base}, ${detailText}` : base;

  if (preset) {
    return `${color.en} ${base.replace(/^wearing\s+/i, '')}`;
  }

  const coloredBase = `${color.en} ${base}`;
  return detailText ? `${coloredBase}, ${detailText}` : coloredBase;
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

  if (!meta.colorMode || !colorTargets || Object.keys(colorTargets).length === 0) {
    return primaryColor && !isNoneLikeItem(primaryColor) ? `${primaryColor.en} ${base}` : base;
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

  return details.length > 0 ? `${base}, ${details.join(', ')}` : base;
}

function buildTopOuterwearComboPrompt(wardrobeSlots, wardrobeColors) {
  const top = wardrobeSlots.top;
  const dress = wardrobeSlots.dress;
  const outerwear = wardrobeSlots.outerwear;
  const styling = wardrobeSlots.outerwearStyling;
  const baseLayer = dress && !isNoneLikeItem(dress) ? dress : top;

  if (!baseLayer || !outerwear || isNoneLikeItem(baseLayer) || isNoneLikeItem(outerwear)) return null;

  const baseLayerText = dress && !isNoneLikeItem(dress)
    ? buildColoredGrokPrompt(dress, wardrobeColors.dressColor)
    : buildTopWardrobePrompt(wardrobeSlots, wardrobeColors);
  if (!baseLayerText) return null;

  const outerwearBase = buildColoredGrokPrompt(outerwear, wardrobeColors.outerwearColor, { pattern: wardrobeSlots.outerwearPattern });
  if (!outerwearBase) return baseLayerText;

  const isNormalStyling = styling && !isNoneLikeItem(styling) && styling.zh === '正常穿著';
  const isSlippedStyling = styling && !isNoneLikeItem(styling) && styling.zh === '滑落肩部';

  let outerwearPhrase = `${outerwearBase} as the outer layer`;
  if (isNormalStyling) {
    outerwearPhrase = `${buildColoredGrokPrompt(outerwear, wardrobeColors.outerwearColor, { pattern: wardrobeSlots.outerwearPattern })} fully worn on both shoulders as a complete outer layer, shoulder line covered by the outerwear, not slipping off the shoulders`;
  } else if (isSlippedStyling) {
    outerwearPhrase = `${buildColoredGrokPrompt(outerwear, wardrobeColors.outerwearColor, { pattern: wardrobeSlots.outerwearPattern })} slipped off the shoulder line as a relaxed outer layer`;
  }

  if (!dress && top.zh === '比基尼' && outerwear.zh === '人造毛皮草外套' && isNormalStyling) {
    return `${baseLayerText}, layered under ${outerwearPhrase}, plush voluminous fur framing the exposed bikini neckline`;
  }

  return `${baseLayerText}, layered under ${outerwearPhrase}`;
}

function buildOuterwearStylingLeadText(styling, { minimal = false } = {}) {
  if (!styling || isNoneLikeItem(styling)) return '';
  if (styling.zh === '正常穿著') {
    return minimal ? '' : 'properly worn on both shoulders';
  }
  if (styling.zh === '滑落肩部') {
    return minimal ? 'slipped off the shoulder line' : 'slipped off the shoulder line';
  }
  return stripMarkdown(styling.en || '').replace(/\s+/g, ' ').trim();
}

function buildOuterwearFirstPrompt(baseLayerText, outerwearItem, outerwearColor, outerwearPattern, outerwearStyling, { minimal = false } = {}) {
  if (!baseLayerText || !outerwearItem || isNoneLikeItem(outerwearItem)) return '';
  const outerwearText = buildColoredGrokPrompt(outerwearItem, outerwearColor, { pattern: outerwearPattern });
  if (!outerwearText) return baseLayerText;
  const stylingText = buildOuterwearStylingLeadText(outerwearStyling, { minimal });
  const joined = [
    outerwearText,
    stylingText,
    `layered over ${baseLayerText}`,
  ].filter(Boolean).join(', ');
  return joined;
}

function buildDuoWardrobeText(wardrobeSlots, wardrobeColors, topOuterwearComboText) {
  const normalizeWearable = (value) => stripMarkdown(value || '')
    .replace(/\s+/g, ' ')
    .replace(/^wearing\s+/i, '')
    .trim();
  const joinParts = (parts) => parts.map(normalizeWearable).filter(Boolean).join(', ');
  const buildSharedAddonText = () => joinParts([
    buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor),
    buildColoredGrokPrompt(wardrobeSlots.outerwear, wardrobeColors.outerwearColor, {
      pattern: wardrobeSlots.outerwearPattern,
      styling: wardrobeSlots.outerwearStyling,
    }),
    buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor),
    buildAccessoryPrompt(wardrobeSlots.headAccessory),
    buildAccessoryPrompt(wardrobeSlots.eyewear),
    buildAccessoryPrompt(wardrobeSlots.earrings),
    buildAccessoryPrompt(wardrobeSlots.neckAccessory),
  ]);
  const buildRoleAddonText = (role) => {
    const suffix = role === 'a' ? 'A' : 'B';
    return joinParts([
      buildColoredGrokPrompt(wardrobeSlots[`legwear${suffix}`], wardrobeColors[`legwear${suffix}Color`]),
      buildColoredGrokPrompt(wardrobeSlots[`outerwear${suffix}`], wardrobeColors[`outerwear${suffix}Color`], {
        pattern: wardrobeSlots[`outerwear${suffix}Pattern`],
        styling: wardrobeSlots[`outerwear${suffix}Styling`],
      }),
      buildColoredGrokPrompt(wardrobeSlots[`shoes${suffix}`], wardrobeColors[`shoes${suffix}Color`]),
      buildAccessoryPrompt(wardrobeSlots[`headAccessory${suffix}`]),
      buildAccessoryPrompt(wardrobeSlots[`eyewear${suffix}`]),
      buildAccessoryPrompt(wardrobeSlots[`earrings${suffix}`]),
      buildAccessoryPrompt(wardrobeSlots[`neckAccessory${suffix}`]),
    ]);
  };
  const buildSharedMainText = () => {
    const dressText = normalizeWearable(buildColoredGrokPrompt(wardrobeSlots.dress, wardrobeColors.dressColor));
    const topText = normalizeWearable(topOuterwearComboText || buildTopWardrobePrompt(wardrobeSlots, wardrobeColors));
    const pantsText = normalizeWearable(buildBottomWardrobePrompt(wardrobeSlots.pants, wardrobeSlots, wardrobeColors));
    const skirtText = normalizeWearable(buildBottomWardrobePrompt(wardrobeSlots.skirt, wardrobeSlots, wardrobeColors));
    return joinParts(dressText ? [topOuterwearComboText ? topText : dressText] : [topText, pantsText, skirtText]);
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
      }));
    }

    const dressText = normalizeWearable(buildColoredGrokPrompt(wardrobeSlots[`dress${suffix}`], wardrobeColors[`dress${suffix}Color`]));
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
    })
  );
  const presetBText = normalizeWearable(
    buildOutfitPresetPrompt(wardrobeSlots.outfitPresetB, {
      legacy: wardrobeColors.outfitPresetBColor,
      primary: wardrobeColors.outfitPresetBPrimaryColor,
      contrast: wardrobeColors.outfitPresetBContrastColor,
      lockedPalette: wardrobeColors.outfitPresetBLockedPalette,
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

  const dressText = normalizeWearable(buildColoredGrokPrompt(wardrobeSlots.dress, wardrobeColors.dressColor));
  const topText = normalizeWearable(
    topOuterwearComboText || buildTopWardrobePrompt(wardrobeSlots, wardrobeColors)
  );
  const pantsText = normalizeWearable(
    buildBottomWardrobePrompt(wardrobeSlots.pants, wardrobeSlots, wardrobeColors)
  );
  const skirtText = normalizeWearable(
    buildBottomWardrobePrompt(wardrobeSlots.skirt, wardrobeSlots, wardrobeColors)
  );
  const legwearText = normalizeWearable(buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor));
  const outerwearText = topOuterwearComboText
    ? ''
    : normalizeWearable(buildColoredGrokPrompt(wardrobeSlots.outerwear, wardrobeColors.outerwearColor, {
        pattern: wardrobeSlots.outerwearPattern,
        styling: wardrobeSlots.outerwearStyling,
      }));
  const shoesText = normalizeWearable(buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor));
  const accessoryText = joinParts([
    buildAccessoryPrompt(wardrobeSlots.headAccessory),
    buildAccessoryPrompt(wardrobeSlots.eyewear),
    buildAccessoryPrompt(wardrobeSlots.earrings),
    buildAccessoryPrompt(wardrobeSlots.neckAccessory),
  ]);
  const sharedParts = dressText
    ? [topOuterwearComboText ? topText : dressText, legwearText, outerwearText, shoesText, accessoryText]
    : [topText, pantsText, skirtText, legwearText, outerwearText, shoesText, accessoryText];
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

function buildDuoSceneAnchorText(context, wardrobeSlots, wardrobeColors, topOuterwearComboText) {
  if (context.subject.count !== 2) return '';
  const duoWardrobeText = buildDuoWardrobeText(wardrobeSlots, wardrobeColors, topOuterwearComboText);
  if (!duoWardrobeText.clothingText) return '';
  const subjectText = stripMarkdown(context.subject.en || 'two women').replace(/\s+/g, ' ').trim();
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
    'yacht',
    'promenade',
    'city skyline',
    'rooftop',
    'canal',
    'bridge',
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

function buildStructuredGrokPrompt(context, character, wardrobe, wardrobeColors, lightDirection, film, duoInteraction) {
  const characterSlots = extractCharacterSlots(character);
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
  const skeletonMode = isSkeletonSubject(context.subject);
  const topOuterwearComboText = buildTopOuterwearComboPrompt(wardrobeSlots, wardrobeColors);
  const duoWardrobeText = buildDuoWardrobeText(wardrobeSlots, wardrobeColors, topOuterwearComboText);
  const duoSceneAnchorText = buildDuoSceneAnchorText(context, wardrobeSlots, wardrobeColors, topOuterwearComboText);
  const hasDuoSceneAnchor = Boolean(duoSceneAnchorText);
  const waistlineCompatibilityText = buildWaistlineCompatibilityPrompt(wardrobeSlots);
  const useCharacterIdentityAnchor = Boolean(context.characterProfilePrompt) && context.subject.count === 1;
  const expressionText = characterSlots.expression ? resolvePromptVariant(characterSlots.expression, 'expression', context.subject.count) : '';
  const expressionAText = buildRoleExpressionPrompt(characterSlots.expressionA, 'woman 1');
  const expressionBText = buildRoleExpressionPrompt(characterSlots.expressionB, 'woman 2');
  const poseText = context.subject.count === 2
    ? (characterSlots.duoPose && !isNoneLikeItem(characterSlots.duoPose) ? characterSlots.duoPose.en : '')
    : characterSlots.pose && !isNoneLikeItem(characterSlots.pose)
      ? resolvePromptVariant(characterSlots.pose, 'pose', context.subject.count)
      : '';
  const specialActionText = characterSlots.specialAction && !isNoneLikeItem(characterSlots.specialAction)
    ? characterSlots.specialAction.en
    : '';
  const sceneAccentText = buildContextualSceneAccent(context);
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
  const buildGrokFramingText = () => {
    const base = context.framing ? resolvePromptVariant(context.framing, 'framing', context.subject.count) : '';
    if (!base || context.framing?.zh !== '全身鏡頭 (Full Body Shot)') return skeletonText(base);

    const hasLegwear = wardrobeSlots.legwear && !isNoneLikeItem(wardrobeSlots.legwear);
    const hasShoes = wardrobeSlots.shoes && !isNoneLikeItem(wardrobeSlots.shoes);
    const isBarefoot = wardrobeSlots.shoes?.zh === '赤腳';

    if (skeletonMode) return skeletonText(`${base}, complete skeletal feet clearly visible`);
    if (isBarefoot) return `${base}, bare feet and visible toes clearly shown`;
    if (hasLegwear && hasShoes) return `${base}, legwear and shoes clearly visible`;
    if (hasShoes) return `${base}, shoes clearly visible`;
    return `${base}, full lower legs and feet clearly visible`;
  };
  const buildGrokCompositionPriorityText = () => {
    if (context.subject.count === 2 && duoWardrobeText.clothingText) {
      return 'preserve an outfit-visible editorial duo composition with both women in the same continuous frame, keep visible torso and wardrobe details, avoid collapsing into a headshot-only crop';
    }
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
  const buildGrokWardrobeIntegrityText = () => (
    'preserve the specified wardrobe as complete clothing, detailed realistic fabric folds and wrinkles visible, clothing covers the body appropriately, fully clothed styling, no nudity'
  );

  addLine('Duo Scene Anchor', duoSceneAnchorText);
  if (!hasDuoSceneAnchor) {
    addLine('Subject Count', useCharacterIdentityAnchor ? `${context.subject.en} ${context.characterProfilePrompt}` : context.subject.en);
  }
  if (context.subject.reference) {
    addLine('Reference Guidance', 'use the attached reference image as the primary facial identity guide, keep the facial features and overall likeness consistent with the image');
  }
  if (!hasDuoSceneAnchor && !skeletonMode) addItemLine('Body Type', characterSlots.bodyType);
  if (context.subject.count === 2 && !hasDuoSceneAnchor) {
    addLine('Woman 1 Outfit Preset', buildOutfitPresetPrompt(wardrobeSlots.outfitPresetA, {
      legacy: wardrobeColors.outfitPresetAColor,
      primary: wardrobeColors.outfitPresetAPrimaryColor,
      contrast: wardrobeColors.outfitPresetAContrastColor,
      lockedPalette: wardrobeColors.outfitPresetALockedPalette,
    }));
    addLine('Woman 2 Outfit Preset', buildOutfitPresetPrompt(wardrobeSlots.outfitPresetB, {
      legacy: wardrobeColors.outfitPresetBColor,
      primary: wardrobeColors.outfitPresetBPrimaryColor,
      contrast: wardrobeColors.outfitPresetBContrastColor,
      lockedPalette: wardrobeColors.outfitPresetBLockedPalette,
    }));
  } else if (wardrobeSlots.outfitPreset && !hasDuoSceneAnchor) {
    addLine('Outfit Preset', buildOutfitPresetPrompt(wardrobeSlots.outfitPreset, {
      legacy: wardrobeColors.outfitPresetColor,
      primary: wardrobeColors.outfitPresetPrimaryColor,
      contrast: wardrobeColors.outfitPresetContrastColor,
      lockedPalette: wardrobeColors.outfitPresetLockedPalette,
    }));
  }
  if (!skeletonMode && !wardrobeSlots.outfitPreset && !wardrobeSlots.outfitPresetA && !wardrobeSlots.outfitPresetB && !(context.subject.count === 2 && duoWardrobeText.clothingText)) {
    const topText = topOuterwearComboText || buildTopWardrobePrompt(wardrobeSlots, wardrobeColors);
    const dressText = buildColoredGrokPrompt(wardrobeSlots.dress, wardrobeColors.dressColor);
    const pantsText = buildBottomWardrobePrompt(wardrobeSlots.pants, wardrobeSlots, wardrobeColors);
    const skirtText = buildBottomWardrobePrompt(wardrobeSlots.skirt, wardrobeSlots, wardrobeColors);
    addLine('Dress', dressText);
    addLine('Top', dressText ? '' : topText);
    addLine('Pants', dressText ? '' : pantsText);
    addLine('Skirt', dressText ? '' : skirtText);
    addLine('Legwear', buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor));
    if (!topOuterwearComboText) {
      addLine('Outerwear', buildColoredGrokPrompt(wardrobeSlots.outerwear, wardrobeColors.outerwearColor, { pattern: wardrobeSlots.outerwearPattern, styling: wardrobeSlots.outerwearStyling }));
    }
    addLine('Shoes', buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor));
  }
  if (!skeletonMode && !hasDuoSceneAnchor && (wardrobeSlots.outfitPreset || wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB)) {
    addLine('Legwear', buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor));
    addLine('Outerwear', buildColoredGrokPrompt(wardrobeSlots.outerwear, wardrobeColors.outerwearColor, {
      pattern: wardrobeSlots.outerwearPattern,
      styling: wardrobeSlots.outerwearStyling,
    }));
    addLine('Shoes', buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor));
  }
  if (!skeletonMode && !hasDuoSceneAnchor) {
    addLine('Waistline Coordination', waistlineCompatibilityText);
    addLine('Wardrobe Integrity', buildGrokWardrobeIntegrityText());
  }
  if (context.subject.count === 2 && !hasDuoSceneAnchor) addLine('Duo Wardrobe', duoWardrobeText.stylingText);
  addLine('Special Action', skeletonText(specialActionText));
  addLine(context.subject.count === 2 ? 'Duo Pose' : 'Pose', skeletonText(poseText));
  if (!skeletonMode && context.subject.count === 2) addLine('Duo Interaction', duoInteraction?.en);
  if (!skeletonMode && context.subject.count === 2) {
    addItemLine('Woman 1 Facial Features', characterSlots.facialFeaturesA);
    addItemLine('Woman 2 Facial Features', characterSlots.facialFeaturesB);
  } else if (!skeletonMode && !useCharacterIdentityAnchor) {
    addLine(
      'Facial Features',
      buildFacialFeaturesPrompt(characterSlots.facialFeatures, {
        eyewear: wardrobeSlots.eyewear,
        earrings: wardrobeSlots.earrings,
      })
    );
  }
  if (!skeletonMode && context.subject.count === 2) {
    addItemLine('Woman 1 Hairstyle', characterSlots.hairstyleA);
    addItemLine('Woman 2 Hairstyle', characterSlots.hairstyleB);
    addLine('Woman 1 Hair Color', buildHairColorPrompt(characterSlots.hairColorA));
    addLine('Woman 2 Hair Color', buildHairColorPrompt(characterSlots.hairColorB));
  } else if (!skeletonMode) {
    addItemLine('Hairstyle', characterSlots.hairstyle);
    addLine('Hair Color', buildHairColorPrompt(characterSlots.hairColor));
  }
  if (!skeletonMode && !useCharacterIdentityAnchor) addItemLine('Skin Details', characterSlots.skinDetails);
  if (!skeletonMode && context.subject.count === 2) {
    addLine('Woman 1 Expression', expressionAText);
    addLine('Woman 2 Expression', expressionBText);
  } else if (!skeletonMode) {
    addLine('Expression', expressionText);
  }
  addContextLine('Location', context.location, (item) => skeletonText(item.en));
  addLine('Scene Accent', skeletonText(sceneAccentText));
  addContextLine('Environment Mood', context.lighting, (item) => skeletonText(item.en));
  addContextLine('Light Style', lightDirection, (item) => skeletonText(resolvePromptVariant(item, 'lightDirection', context.subject.count)));
  addLine('Aspect Ratio', context.aspectRatio.en);
  addContextLine('Film', film, (item) => skeletonText(item.en));
  addContextLine('Angle', context.angle, (item) => skeletonText(resolvePromptVariant(item, 'angle', context.subject.count)));
  addContextLine('Orbit Angle', context.orbit, (item) => skeletonText(resolvePromptVariant(item, 'orbit', context.subject.count)));
  addContextLine('Lens', context.lens);
  addContextLine('Optical Effect', context.opticalEffect, (item) => skeletonText(item.en));
  addLine('Framing', buildGrokFramingText());
  addLine('Composition Priority', buildGrokCompositionPriorityText());
  if (context.style && !isNoneLikeItem(context.style)) {
    addLine('Photography Style', skeletonText(buildPhotographyStylePrompt(context.style)));
  }
  if (!skeletonMode && context.subject.count === 2) {
    addLine('Woman 1 Head Accessory', buildAccessoryPrompt(wardrobeSlots.headAccessoryA));
    addLine('Woman 1 Eyewear', buildAccessoryPrompt(wardrobeSlots.eyewearA));
    addLine('Woman 1 Earrings', buildAccessoryPrompt(wardrobeSlots.earringsA));
    addLine('Woman 1 Neck Accessory', buildAccessoryPrompt(wardrobeSlots.neckAccessoryA));
    addLine('Woman 2 Head Accessory', buildAccessoryPrompt(wardrobeSlots.headAccessoryB));
    addLine('Woman 2 Eyewear', buildAccessoryPrompt(wardrobeSlots.eyewearB));
    addLine('Woman 2 Earrings', buildAccessoryPrompt(wardrobeSlots.earringsB));
    addLine('Woman 2 Neck Accessory', buildAccessoryPrompt(wardrobeSlots.neckAccessoryB));
  }
  if (!skeletonMode && (context.subject.count === 2 || useCharacterIdentityAnchor)) {
    addLine('Head Accessory', buildAccessoryPrompt(wardrobeSlots.headAccessory));
    addLine('Eyewear', buildAccessoryPrompt(wardrobeSlots.eyewear));
    addLine('Earrings', buildAccessoryPrompt(wardrobeSlots.earrings));
  }
  if (!skeletonMode && !(context.subject.count === 2 || useCharacterIdentityAnchor)) addLine('Head Accessory', buildAccessoryPrompt(wardrobeSlots.headAccessory));
  if (!skeletonMode) addLine('Neck Accessory', buildAccessoryPrompt(wardrobeSlots.neckAccessory));
  if (!skeletonMode && !useCharacterIdentityAnchor) addLine('Character Identity', context.characterProfilePrompt);

  return lines.join('\n');
}

function buildZImagePrompt(context, character, wardrobe, wardrobeColors, lightDirection, film, opticalEffect, duoInteraction) {
  const characterSlots = extractCharacterSlots(character);
  const wardrobeSlots = extractWardrobeSlots(wardrobe);
  const waistlineCompatibilityText = buildWaistlineCompatibilityPrompt(wardrobeSlots);
  const useCharacterIdentityAnchor = Boolean(context.characterProfilePrompt) && context.subject.count === 1;
  const sceneAccentText = buildContextualSceneAccent(context);
  const sentence = (value) => ensureTerminalPeriod(stripMarkdown(value || '').replace(/\s+/g, ' ').trim());
  const joinSentenceParts = (parts) => sentence(parts.filter(Boolean).join(', '));
  const leadSentence = (lead, parts) => {
    const detail = parts.filter(Boolean).join(', ');
    return detail ? sentence(`${lead} ${detail}`) : '';
  };
  const skeletonMode = isSkeletonSubject(context.subject);
  const buildCharacterText = () => {
    if (skeletonMode) {
      const parts = [
        sanitizeSkeletonPromptText(context.subject.en),
        characterSlots.specialAction && !isNoneLikeItem(characterSlots.specialAction) ? sanitizeSkeletonPromptText(characterSlots.specialAction.en) : '',
        characterSlots.pose && !isNoneLikeItem(characterSlots.pose) ? sanitizeSkeletonPromptText(resolvePromptVariant(characterSlots.pose, 'pose', context.subject.count)) : '',
      ].filter(Boolean);
      return leadSentence('The image shows', parts);
    }

    const parts = [
      useCharacterIdentityAnchor ? `${context.subject.en} ${context.characterProfilePrompt}` : context.subject.en,
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
      !useCharacterIdentityAnchor ? characterSlots.skinDetails?.en : '',
      context.subject.count === 2
        ? [buildRoleExpressionPrompt(characterSlots.expressionA, 'woman 1'), buildRoleExpressionPrompt(characterSlots.expressionB, 'woman 2')].filter(Boolean).join(', ')
        : (characterSlots.expression ? resolvePromptVariant(characterSlots.expression, 'expression', context.subject.count) : ''),
      characterSlots.specialAction && !isNoneLikeItem(characterSlots.specialAction) ? characterSlots.specialAction.en : '',
      context.subject.count === 2
        ? (characterSlots.duoPose && !isNoneLikeItem(characterSlots.duoPose) ? characterSlots.duoPose.en : '')
        : (characterSlots.pose && !isNoneLikeItem(characterSlots.pose) ? resolvePromptVariant(characterSlots.pose, 'pose', context.subject.count) : ''),
      context.subject.count === 2 ? duoInteraction?.en : '',
    ].filter(Boolean);

    return leadSentence('The image shows', parts);
  };
  const buildWardrobeText = () => {
    const parts = [];
    const add = (value) => {
      if (value) parts.push(value);
    };
    const buildRoleLayerText = (role) => {
      const suffix = role === 'a' ? 'A' : 'B';
      return [
        buildColoredGrokPrompt(wardrobeSlots[`legwear${suffix}`], wardrobeColors[`legwear${suffix}Color`]),
        buildColoredGrokPrompt(wardrobeSlots[`outerwear${suffix}`], wardrobeColors[`outerwear${suffix}Color`], {
          pattern: wardrobeSlots[`outerwear${suffix}Pattern`],
          styling: wardrobeSlots[`outerwear${suffix}Styling`],
        }),
        buildColoredGrokPrompt(wardrobeSlots[`shoes${suffix}`], wardrobeColors[`shoes${suffix}Color`]),
        buildAccessoryPrompt(wardrobeSlots[`headAccessory${suffix}`]),
        buildAccessoryPrompt(wardrobeSlots[`eyewear${suffix}`]),
        buildAccessoryPrompt(wardrobeSlots[`earrings${suffix}`]),
        buildAccessoryPrompt(wardrobeSlots[`neckAccessory${suffix}`]),
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
        });
      }

      const dressText = buildColoredGrokPrompt(wardrobeSlots[`dress${suffix}`], wardrobeColors[`dress${suffix}Color`]);
      const outerwearFirstDressText = buildOuterwearFirstPrompt(
        dressText,
        wardrobeSlots[`outerwear${suffix}`],
        wardrobeColors[`outerwear${suffix}Color`],
        wardrobeSlots[`outerwear${suffix}Pattern`],
        wardrobeSlots[`outerwear${suffix}Styling`]
      );
      if (dressText) return outerwearFirstDressText || dressText;

      const topText = buildRoleTopWardrobePrompt(wardrobeSlots, wardrobeColors, role);
      const outerwearFirstTopText = buildOuterwearFirstPrompt(
        topText,
        wardrobeSlots[`outerwear${suffix}`],
        wardrobeColors[`outerwear${suffix}Color`],
        wardrobeSlots[`outerwear${suffix}Pattern`],
        wardrobeSlots[`outerwear${suffix}Styling`]
      );

      const fallbackOuterwearText = buildColoredGrokPrompt(wardrobeSlots[`outerwear${suffix}`], wardrobeColors[`outerwear${suffix}Color`], {
        pattern: wardrobeSlots[`outerwear${suffix}Pattern`],
        styling: wardrobeSlots[`outerwear${suffix}Styling`],
      });

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
      add(buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor));
      add(buildColoredGrokPrompt(wardrobeSlots.outerwear, wardrobeColors.outerwearColor, { pattern: wardrobeSlots.outerwearPattern, styling: wardrobeSlots.outerwearStyling }));
      add(buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor));
    } else if (wardrobeSlots.outfitPreset) {
      add(`the subject wears ${buildOutfitPresetPrompt(wardrobeSlots.outfitPreset, {
        legacy: wardrobeColors.outfitPresetColor,
        primary: wardrobeColors.outfitPresetPrimaryColor,
        contrast: wardrobeColors.outfitPresetContrastColor,
        lockedPalette: wardrobeColors.outfitPresetLockedPalette,
      })}`);
      add(buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor));
      add(buildColoredGrokPrompt(wardrobeSlots.outerwear, wardrobeColors.outerwearColor, { pattern: wardrobeSlots.outerwearPattern, styling: wardrobeSlots.outerwearStyling }));
      add(buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor));
    } else {
      const dressText = buildColoredGrokPrompt(wardrobeSlots.dress, wardrobeColors.dressColor);
      const topText = buildTopWardrobePrompt(wardrobeSlots, wardrobeColors);
      const outerwearFirstDressText = buildOuterwearFirstPrompt(
        dressText,
        wardrobeSlots.outerwear,
        wardrobeColors.outerwearColor,
        wardrobeSlots.outerwearPattern,
        wardrobeSlots.outerwearStyling
      );
      const outerwearFirstTopText = buildOuterwearFirstPrompt(
        topText,
        wardrobeSlots.outerwear,
        wardrobeColors.outerwearColor,
        wardrobeSlots.outerwearPattern,
        wardrobeSlots.outerwearStyling
      );
      const fallbackOuterwearText = buildColoredGrokPrompt(wardrobeSlots.outerwear, wardrobeColors.outerwearColor, {
        pattern: wardrobeSlots.outerwearPattern,
        styling: wardrobeSlots.outerwearStyling,
      });
      const mainWardrobeText = dressText
        ? (outerwearFirstDressText || dressText)
        : (outerwearFirstTopText || topText || fallbackOuterwearText);
      const usedOuterwearInMain = Boolean(
        (dressText && outerwearFirstDressText) ||
        (!dressText && (outerwearFirstTopText || (!topText && fallbackOuterwearText)))
      );
      add(mainWardrobeText);
      if (!dressText) {
        add(buildBottomWardrobePrompt(wardrobeSlots.pants, wardrobeSlots, wardrobeColors));
        add(buildBottomWardrobePrompt(wardrobeSlots.skirt, wardrobeSlots, wardrobeColors));
      }
      add(buildColoredGrokPrompt(wardrobeSlots.legwear, wardrobeColors.legwearColor));
      if (!usedOuterwearInMain) {
        add(buildColoredGrokPrompt(wardrobeSlots.outerwear, wardrobeColors.outerwearColor, { pattern: wardrobeSlots.outerwearPattern, styling: wardrobeSlots.outerwearStyling }));
      }
      add(buildColoredGrokPrompt(wardrobeSlots.shoes, wardrobeColors.shoesColor));
      add(waistlineCompatibilityText);
    }
    if (context.subject.count === 2 && !(wardrobeSlots.outfitPresetA || wardrobeSlots.outfitPresetB)) {
      add(buildRoleLayerText('a') ? `woman 1 additional styling includes ${buildRoleLayerText('a')}` : '');
      add(buildRoleLayerText('b') ? `woman 2 additional styling includes ${buildRoleLayerText('b')}` : '');
    }

    const accessories = [
      buildAccessoryPrompt(wardrobeSlots.headAccessory),
      buildAccessoryPrompt(wardrobeSlots.eyewear),
      buildAccessoryPrompt(wardrobeSlots.earrings),
      buildAccessoryPrompt(wardrobeSlots.neckAccessory),
    ].filter(Boolean);
    if (accessories.length > 0) add(`accessories include ${accessories.join(', ')}`);

    return parts.length > 0 ? sentence(`Wardrobe details: ${parts.join(', ')}`) : '';
  };
  const buildSceneText = () => {
    const sceneParts = [
      context.location && !isNoneLikeItem(context.location) ? (skeletonMode ? sanitizeSkeletonPromptText(context.location.en) : context.location.en) : '',
      skeletonMode ? sanitizeSkeletonPromptText(sceneAccentText) : sceneAccentText,
      context.lighting && !isNoneLikeItem(context.lighting) ? (skeletonMode ? sanitizeSkeletonPromptText(context.lighting.en) : context.lighting.en) : '',
      lightDirection && !isNoneLikeItem(lightDirection) ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count)) : resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count)) : '',
    ].filter(Boolean);

    return leadSentence('The setting is', sceneParts);
  };
  const buildCameraText = () => leadSentence('The composition uses', [
    context.framing ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(context.framing, 'framing', context.subject.count)) : resolvePromptVariant(context.framing, 'framing', context.subject.count)) : '',
    context.angle ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(context.angle, 'angle', context.subject.count)) : resolvePromptVariant(context.angle, 'angle', context.subject.count)) : '',
    context.orbit ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(context.orbit, 'orbit', context.subject.count)) : resolvePromptVariant(context.orbit, 'orbit', context.subject.count)) : '',
    context.lens?.en,
    skeletonMode ? sanitizeSkeletonPromptText(opticalEffect?.en) : opticalEffect?.en,
    context.aspectRatio.en ? `aspect ratio ${context.aspectRatio.en}` : '',
  ]);
  const buildStyleText = () => joinSentenceParts([
    context.style && !isNoneLikeItem(context.style) ? (skeletonMode ? sanitizeSkeletonPromptText(buildPhotographyStylePrompt(context.style)) : buildPhotographyStylePrompt(context.style)) : '',
    skeletonMode ? sanitizeSkeletonPromptText(film?.en) : film?.en,
    skeletonMode
      ? 'natural photographic detail, coherent anatomical structure, clear skeletal structure readability, realistic spatial depth'
      : 'natural photographic detail, coherent fabric construction, clear facial readability, realistic spatial depth',
    'do not add visible text unless explicitly requested',
  ]);

  return [
    buildCharacterText(),
    buildWardrobeText(),
    buildSceneText(),
    buildCameraText(),
    buildStyleText(),
  ].filter(Boolean).join(' ');
}

const AI_PROMPT_EXCLUDED_GROK_LABELS = new Set([
  'Wardrobe Integrity',
  'Composition Priority',
]);

const AI_PROMPT_SECTION_LABELS = {
  subject: new Set([
    'Duo Scene Anchor',
    'Subject Count',
    'Reference Guidance',
    'Body Type',
    'Special Action',
    'Pose',
    'Duo Pose',
    'Duo Interaction',
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
  ]),
  outfit: new Set([
    'Outfit Preset',
    'Woman 1 Outfit Preset',
    'Woman 2 Outfit Preset',
    'Dress',
    'Top',
    'Pants',
    'Skirt',
    'Legwear',
    'Outerwear',
    'Shoes',
    'Waistline Coordination',
    'Duo Wardrobe',
  ]),
  accessories: new Set([
    'Head Accessory',
    'Woman 1 Head Accessory',
    'Woman 2 Head Accessory',
    'Eyewear',
    'Woman 1 Eyewear',
    'Woman 2 Eyewear',
    'Earrings',
    'Woman 1 Earrings',
    'Woman 2 Earrings',
    'Neck Accessory',
    'Woman 1 Neck Accessory',
    'Woman 2 Neck Accessory',
  ]),
  setting: new Set([
    'Location',
  ]),
  camera: new Set([
    'Aspect Ratio',
    'Angle',
    'Orbit Angle',
    'Lens',
    'Optical Effect',
    'Framing',
  ]),
  lighting: new Set([
    'Environment Mood',
    'Light Style',
  ]),
  atmosphere: new Set([
    'Film',
    'Photography Style',
  ]),
};

const AI_PROMPT_CORE_PART_LIMITS = {
  default: 1,
  'Body Type': 1,
  'Facial Features': 2,
  'Woman 1 Facial Features': 2,
  'Woman 2 Facial Features': 2,
  'Hairstyle': 2,
  'Woman 1 Hairstyle': 2,
  'Woman 2 Hairstyle': 2,
  'Outfit Preset': 2,
  'Woman 1 Outfit Preset': 2,
  'Woman 2 Outfit Preset': 2,
  Dress: 2,
  Top: 2,
  Pants: 2,
  Skirt: 2,
  Legwear: 2,
  Outerwear: 3,
  Shoes: 2,
  'Duo Wardrobe': 2,
};

function normalizeAiPromptValue(value, label) {
  const partLimit = AI_PROMPT_CORE_PART_LIMITS[label] || AI_PROMPT_CORE_PART_LIMITS.default;
  const cleaned = stripMarkdown(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/g, '')
    .trim();
  if (!cleaned) return '';

  return cleaned
    .split(/[.!?]|\s*,\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, partLimit)
    .join(', ');
}

function buildAiSectionText(values) {
  return [...new Set(values.filter(Boolean))].join(', ');
}

function pushAiSectionValue(sections, label, value) {
  if (!value) return;
  if (AI_PROMPT_SECTION_LABELS.accessories.has(label)) {
    sections.subject.push(value);
    return;
  }

  Object.entries(AI_PROMPT_SECTION_LABELS).some(([sectionName, labels]) => {
    if (sectionName === 'accessories' || !labels.has(label)) return false;
    sections[sectionName].push(value);
    return true;
  });
}

function buildAiFallbackPromptFromGrok(grokPrompt) {
  const clauses = grokPrompt
    .split('\n')
    .map((line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) return '';

      const label = line.slice(0, separatorIndex).trim();
      if (AI_PROMPT_EXCLUDED_GROK_LABELS.has(label)) return '';
      return normalizeAiPromptValue(line.slice(separatorIndex + 1), label);
    })
    .filter(Boolean);

  return ensureTerminalPeriod(clauses.join(', '));
}

function buildAiMinimalPromptFromGrok(grokPrompt) {
  const sections = {
    subject: [],
    outfit: [],
    setting: [],
    camera: [],
    lighting: [],
    atmosphere: [],
  };

  grokPrompt
    .split('\n')
    .forEach((line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) return;

      const label = line.slice(0, separatorIndex).trim();
      if (AI_PROMPT_EXCLUDED_GROK_LABELS.has(label)) return;

      pushAiSectionValue(sections, label, normalizeAiPromptValue(line.slice(separatorIndex + 1), label));
    });

  const subjectText = buildAiSectionText(sections.subject);
  if (!subjectText) return buildAiFallbackPromptFromGrok(grokPrompt);

  const outfitText = buildAiSectionText(sections.outfit);
  const settingText = buildAiSectionText(sections.setting);
  const cameraText = buildAiSectionText(sections.camera);
  const lightingText = buildAiSectionText(sections.lighting);
  const atmosphereText = buildAiSectionText(sections.atmosphere);

  return [
    ensureTerminalPeriod(subjectText),
    outfitText ? ensureTerminalPeriod(`main outfit: ${outfitText}`) : '',
    settingText ? ensureTerminalPeriod(`setting: ${settingText}`) : '',
    cameraText ? ensureTerminalPeriod(`camera: ${cameraText}`) : '',
    lightingText ? ensureTerminalPeriod(`lighting: ${lightingText}`) : '',
    atmosphereText ? ensureTerminalPeriod(`atmosphere: ${atmosphereText}`) : '',
  ].filter(Boolean).join(' ');
}

function buildPrompts(context, character, wardrobe, wardrobeColors, lightDirection, film, opticalEffect, duoInteraction) {
  const grokPrompt = buildStructuredGrokPrompt(context, character, wardrobe, wardrobeColors, lightDirection, film, duoInteraction);
  const zImagePrompt = buildZImagePrompt(context, character, wardrobe, wardrobeColors, lightDirection, film, opticalEffect, duoInteraction);
  const midjourneyPrompt = buildAiMinimalPromptFromGrok(grokPrompt);

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
    subjectCount: context.subject.id,
    aspectRatio: context.aspectRatio.id,
    styleId: context.style?.id || '',
    sceneAttributeId: context.sceneAttribute?.id || '',
    locationId: context.location?.id || '',
    framingId: context.framing?.id || '',
    angleId: context.angle?.id || '',
    orbitId: context.orbit?.id || '',
    lensId: context.lens?.id || '',
    opticalEffectId: context.opticalEffect?.id || '',
    lightingId: context.lighting?.id || '',
    lightDirectionId: lightDirection?.id || '',
    filmId: film?.id || '',
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
    outerwearColorId: wardrobeColors.outerwearColor?.id || '',
    outerwearPatternId: wardrobeSlots.outerwearPattern?.id || '',
    outerwearStylingId: wardrobeSlots.outerwearStyling?.id || '',
    shoesId: wardrobeSlots.shoes?.id || '',
    shoesColorId: wardrobeColors.shoesColor?.id || '',
    legwearAId: wardrobeSlots.legwearA?.id?.replace(/:a$/, '') || '',
    legwearAColorId: wardrobeColors.legwearAColor?.id || '',
    outerwearAId: wardrobeSlots.outerwearA?.id?.replace(/:a$/, '') || '',
    outerwearAColorId: wardrobeColors.outerwearAColor?.id || '',
    outerwearAPatternId: wardrobeSlots.outerwearAPattern?.id?.replace(/:a$/, '') || '',
    outerwearAStylingId: wardrobeSlots.outerwearAStyling?.id?.replace(/:a$/, '') || '',
    shoesAId: wardrobeSlots.shoesA?.id?.replace(/:a$/, '') || '',
    shoesAColorId: wardrobeColors.shoesAColor?.id || '',
    legwearBId: wardrobeSlots.legwearB?.id?.replace(/:b$/, '') || '',
    legwearBColorId: wardrobeColors.legwearBColor?.id || '',
    outerwearBId: wardrobeSlots.outerwearB?.id?.replace(/:b$/, '') || '',
    outerwearBColorId: wardrobeColors.outerwearBColor?.id || '',
    outerwearBPatternId: wardrobeSlots.outerwearBPattern?.id?.replace(/:b$/, '') || '',
    outerwearBStylingId: wardrobeSlots.outerwearBStyling?.id?.replace(/:b$/, '') || '',
    shoesBId: wardrobeSlots.shoesB?.id?.replace(/:b$/, '') || '',
    shoesBColorId: wardrobeColors.shoesBColor?.id || '',
    headAccessoryId: wardrobeSlots.headAccessory?.id || '',
    eyewearId: wardrobeSlots.eyewear?.id || '',
    earringsId: wardrobeSlots.earrings?.id || '',
    neckAccessoryId: wardrobeSlots.neckAccessory?.id || '',
    headAccessoryAId: wardrobeSlots.headAccessoryA?.id?.replace(/:a$/, '') || '',
    eyewearAId: wardrobeSlots.eyewearA?.id?.replace(/:a$/, '') || '',
    earringsAId: wardrobeSlots.earringsA?.id?.replace(/:a$/, '') || '',
    neckAccessoryAId: wardrobeSlots.neckAccessoryA?.id?.replace(/:a$/, '') || '',
    headAccessoryBId: wardrobeSlots.headAccessoryB?.id?.replace(/:b$/, '') || '',
    eyewearBId: wardrobeSlots.eyewearB?.id?.replace(/:b$/, '') || '',
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
  const hasWardrobeLocks = hasEffectiveWardrobeLocks(effectiveLocks, lockControls);
  const subject = getSubjectOption(effectiveLocks.subjectCount);
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
      && !(hasWardrobeLocks && isWardrobeIncompatibleCloseupFramingItem(item))
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
  const angle = pickWithLock(
    runtime.flatCatalog.angle,
    effectiveLocks.angleId,
    (item) => framingSupportsAngle(framing, item) && lockedExpressions.every((expression) => angleSupportsExpression(item, expression)),
    lowFrequencyPicker('low_frequency_angle')
  );
  const orbit = pickWithLock(
    runtime.flatCatalog.orbit,
    effectiveLocks.orbitId,
    (item) => framingSupportsOrbit(framing, item) && lockedExpressions.every((expression) => orbitSupportsExpression(item, expression)) && specialActionSupportsOrbit(item, lockedSpecialAction)
  );
  const lens = pickWithLock(runtime.flatCatalog.lens, effectiveLocks.lensId);
  const lighting = pickWithCompatibleLock(runtime.flatCatalog.lighting, effectiveLocks.lightingId, (item) => locationSupportsLighting(location, item));
  const lightDirection = !lighting
    ? null
    : pickWithCompatibleLock(runtime.flatCatalog.lightDirection, effectiveLocks.lightDirectionId, (item) => lightDirectionSupportsScene(item, framing, location, lighting));
  const film = pickWithLock(runtime.flatCatalog.film, effectiveLocks.filmId, () => true, lowFrequencyPicker('low_frequency_film'));
  const opticalEffect = pickWithLock(runtime.flatCatalog.effects, effectiveLocks.opticalEffectId);
  const duoInteraction = subject.count === 2 ? getDuoInteractionOption(effectiveLocks.duoInteractionId) || sampleNonNone(DUO_INTERACTION_OPTIONS) : null;

  const context = {
    subject,
    aspectRatio,
    sceneAttribute,
    style,
    location,
    framing,
    angle,
    orbit,
    lens,
    opticalEffect,
    lighting,
    locks: effectiveLocks,
    duoInteraction,
    characterProfilePrompt: String(runtimeOptions.characterProfilePrompt || '').trim(),
  };
  const character = buildCharacter(context, runtime.catalog);
  const wardrobe = isSkeletonSubject(subject) ? [] : buildWardrobe({ ...context }, effectiveLocks, runtime);
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
      Framing: [framing, angle, orbit, lens].filter(Boolean),
      Lighting: [lighting, lightDirection].filter(Boolean),
      'Camera & Film': [film, opticalEffect].filter(Boolean),
    },
  };
}

export function generatePrompts(count = 1, locks = createEmptyLocks(), customLibrary = [], runtimeOptions = {}) {
  return Array.from({ length: count }, (_, index) => generateSinglePrompt(index, locks, customLibrary, runtimeOptions));
}
