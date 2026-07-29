function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export const FIXED_FRAMING_PHASE6_SINGLE_MATRIX = deepFreeze([
  {
    id: 'half-face-separates',
    seed: 'fixed-framing-phase6-half-face-separates-v1',
    framingZh: '半臉傾斜特寫',
    locks: {
      topId: '領帶襯衫',
      pantsId: '直筒牛仔褲',
      shoesId: '高跟鞋',
      poseBaseId: '站姿',
      poseArrangementId: '自然站姿',
      locationId: '室內：英倫復古窗邊房間',
    },
    primaryIncludes: ['collared shirt with a short'],
    primaryExcludes: ['straight-leg jeans', 'stiletto pumps', 'natural relaxed standing pose'],
    facialIncludes: ['collared shirt with a short'],
    facialExcludes: ['straight-leg jeans', 'stiletto pumps'],
    chestIncludes: ['collared shirt with a short'],
    chestExcludes: ['straight-leg jeans', 'stiletto pumps'],
    fullBodyIncludes: ['collared shirt with a short', 'straight-leg jeans', 'stiletto pumps'],
  },
  {
    id: 'medium-special-outfit',
    seed: 'fixed-framing-phase6-medium-special-v1',
    framingZh: '中景鏡頭 (Medium Shot)',
    locks: {
      specialOutfitId: '酒紅格紋吊帶牛仔短裙長靴造型',
      locationId: '室內：古書二手書店',
    },
    primaryIncludes: ['burgundy plaid handkerchief camisole', 'low-rise blue denim mini skirt'],
    primaryExcludes: ['black knee-high leather boots'],
    facialIncludes: ['burgundy plaid handkerchief camisole'],
    facialExcludes: ['low-rise blue denim mini skirt', 'black knee-high leather boots'],
    chestIncludes: ['burgundy plaid handkerchief camisole'],
    chestExcludes: ['low-rise blue denim mini skirt', 'black knee-high leather boots'],
    fullBodyIncludes: ['burgundy plaid handkerchief camisole', 'low-rise blue denim mini skirt', 'black knee-high leather boots'],
  },
  {
    id: 'cowboy-outfit-preset',
    seed: 'fixed-framing-phase6-cowboy-preset-v1',
    framingZh: '牛仔中景 (Cowboy Shot)',
    locks: {
      outfitPresetId: '套裝：春日巴黎亞麻長褲',
      locationId: '室內：Y2K 復古房間',
    },
    primaryIncludes: ['Parisian linen trouser outfit', 'high-waisted wide-leg trousers'],
    aiPrimaryIncludes: ['Parisian linen trouser', 'high-waisted wide-leg trousers'],
    primaryExcludes: [],
    facialIncludes: ['silk camisole'],
    facialExcludes: ['high-waisted wide-leg trousers'],
    chestIncludes: ['silk camisole'],
    chestExcludes: ['high-waisted wide-leg trousers'],
    fullBodyIncludes: ['Parisian linen trouser outfit', 'silk camisole', 'high-waisted wide-leg trousers'],
  },
  {
    id: 'full-body-dress',
    seed: 'fixed-framing-phase6-full-dress-v1',
    framingZh: '全身鏡頭 (Full Body Shot)',
    locks: {
      dressId: '連身：短版｜一字領哥德迷你洋裝',
      locationId: '室內：精品飯店房間',
    },
    primaryIncludes: ['off-shoulder gothic mini dress'],
    primaryExcludes: [],
    facialIncludes: ['off-shoulder gothic dress', 'off-shoulder neckline'],
    facialExcludes: ['short hem'],
    chestIncludes: ['off-shoulder gothic dress'],
    chestExcludes: ['short hem'],
    fullBodyIncludes: ['off-shoulder gothic mini dress', 'short hem'],
  },
]);

export const FIXED_FRAMING_PHASE6_LEGACY_RESTORE_MATRIX = deepFreeze([
  { framingZh: '局部五官特寫', seed: 'fixed-framing-phase6-legacy-features-v1' },
  { framingZh: '臉部特寫', seed: 'fixed-framing-phase6-legacy-face-v1' },
  { framingZh: '特寫鏡頭 (Close-Up)', seed: 'fixed-framing-phase6-legacy-close-v1' },
  { framingZh: '胸上特寫', seed: 'fixed-framing-phase6-legacy-chest-v1' },
]);
