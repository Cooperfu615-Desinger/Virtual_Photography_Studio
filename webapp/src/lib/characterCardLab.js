export const CHARACTER_CARD_LAYER_KEYS = [
  'top',
  'bottom',
  'dress',
  'outerwear',
  'shoes',
  'headAccessory',
  'eyewear',
  'earrings',
  'neckAccessory',
  'wristAccessory',
  'ring',
  'waistAccessory',
];

export const CHARACTER_CARD_LAYER_LABELS = {
  top: '上身',
  bottom: '下身',
  dress: '連身',
  outerwear: '外套',
  shoes: '鞋子',
  headAccessory: '頭飾',
  eyewear: '眼鏡',
  earrings: '耳環',
  neckAccessory: '脖子飾品',
  wristAccessory: '手部飾品',
  ring: '戒指',
  waistAccessory: '腰部飾品',
};

const CHARACTER_CARD_EXTENSIONS = {
  'character-rika': {
    hairTags: ['long', 'wavy', 'bangs', 'black-hair'],
    disabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: {
      top: 'fitted cropped white short-sleeve baby tee with a small minimalist black line-art chest graphic',
      bottom: 'slightly loose low-rise light-wash blue jeans with relaxed straight legs and soft vintage fading',
      shoes: 'clean white low-top sneakers',
      neckAccessory: 'black-and-white beaded choker necklace',
      waistAccessory: 'small silver ring keychain clipped to the front belt loop',
    },
  },
  'character-48g': {
    hairTags: ['medium', 'lob', 'straight', 'bangs', 'black-hair'],
    wardrobeLayers: {
      outerwear: 'taupe-gray cropped hooded zip jacket worn open with the hood usually worn up framing the hair',
      top: 'black lace bralette neckline',
      bottom: 'low-rise faded blue denim mini skirt worn unbuttoned with the zipper slightly pulled down and visible thin-strap black lace thong waistband underneath',
      shoes: 'black lace-up ankle boots with glossy rounded toes',
      waistAccessory: 'small off-white shoulder bag with thin black strap',
    },
  },
  'character-philippa': {
    hairTags: ['long', 'wavy', 'bangs', 'black-hair', 'dip-dye'],
    wardrobeLayers: {
      dress: 'black high-neck gothic lace dress with sheer mesh long sleeves, black floral lace sleeve appliques across shoulders and arms, fitted black lace bodice with subtle beadwork, floor-length translucent black tulle skirt overlay with trailing hem',
      shoes: 'black elegant dress shoes',
    },
  },
  'character-lily': {
    hairTags: ['long', 'wavy', 'bangs', 'red-hair', 'dyed'],
    wardrobeLayers: {
      outerwear: 'black shaggy faux-fur off-shoulder mini coat worn as the main garment, plush high-pile texture, deep V neckline, bare shoulders and collarbones, oversized sleeves, mini-length hem',
      top: 'minimal black inner layer kept subtle under the coat',
      shoes: 'black ankle-strap stiletto sandals with thin straps and open toes',
    },
  },
  'character-hinata': {
    hairTags: ['bob', 'medium', 'wavy', 'dyed', 'center-part'],
    wardrobeLayers: {
      top: 'deep cobalt blue cable-knit turtleneck cutout bodysuit sweater with thick ribbed high collar, fitted long sleeves, vertical cable texture, sculpted bust-waist contour, large side-waist cutout openings exposing both sides of the narrow waist and upper hips',
      bottom: 'medium-wash skinny blue jeans with natural denim fading',
      shoes: 'black leather ankle boots with rounded toes and low block heels',
      waistAccessory: 'black leather belt with small silver buckle',
    },
  },
  'character-rin': {
    hairTags: ['short', 'bob', 'curly', 'bangs', 'black-hair'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: {
      top: 'crisp white oversized button-down shirt with open collar, relaxed dropped shoulders, sleeves rolled to the forearms, slightly loose tucked-in fabric',
      bottom: 'charcoal high-waisted tailored straight trousers with pressed front crease and clean waistband',
      shoes: 'black leather loafers with low stacked heels',
      eyewear: 'signature thin rectangular brown-gold metal frame eyeglasses with transparent lenses',
      earrings: 'stacked twin gold hoop earrings on both ears',
      neckAccessory: 'layered delicate gold necklaces with tiny pendant charms',
    },
  },
  'character-sakura': {
    hairTags: ['long', 'wavy', 'bangs', 'brown-hair', 'pink-streaks'],
    wardrobeLayers: {
      headAccessory: 'white plush bunny-eared hood with floppy long ears, pink inner ears, cute black cartoon eyes, small pink nose, soft white plush fur texture, tiny white fang-like teeth along the hood opening',
      top: 'oversized ivory-white fleece pullover hoodie with dropped shoulders, long loose sleeves, front kangaroo pocket and white drawstrings',
      bottom: 'relaxed beige oatmeal sweatpants with soft brushed knit texture and straight loose legs',
      shoes: 'clean white low-top sneakers',
    },
  },
  'character-sui': {
    hairTags: ['long', 'wavy', 'bangs', 'black-hair'],
    wardrobeLayers: {
      outerwear: 'mustard yellow oversized knit cardigan with chunky fuzzy texture, deep V open front, wooden buttons, relaxed dropped shoulders, long loose sleeves with ribbed cuffs, small white fuzzy floral embroidery scattered on the cardigan',
      top: 'cream ribbed knit camisole with a scoop neckline underneath',
      bottom: 'high-waisted medium-dark blue straight-leg jeans with natural denim fading',
      shoes: 'brown leather ankle boots with rounded toes and low stacked heels',
      neckAccessory: 'delicate gold necklace with a small red-orange oval pendant',
    },
  },
  'character-yuri': {
    hairTags: ['long', 'straight', 'bangs', 'black-hair'],
    wardrobeLayers: {
      top: 'white ribbed off-shoulder cropped long-sleeve top with exposed shoulders, fitted sleeves, small front buttons, vintage black graphic print across the chest and delicate lace trim along the cropped hem',
      bottom: 'low-rise medium-wash blue flared jeans with natural fading',
      shoes: 'brown low-top canvas sneakers with cream rubber soles and white laces',
      eyewear: 'round translucent brown acetate eyeglasses with thin metal temples',
      neckAccessory: 'black choker necklace with small silver charm details',
      wristAccessory: 'stacked silver bangles and rings',
      waistAccessory: 'decorated leather belt with large oval western-style belt buckle and metal-stud chain detail',
    },
  },
  'character-hina': {
    hairTags: ['short', 'bob', 'bangs', 'dyed'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: {
      top: 'loose sage-mint green sleeveless tunic tank top with soft washed cotton texture, round crew neckline, oversized A-line drape, wide armholes with a subtle black inner layer visible at the side',
      bottom: 'matching sage-mint green relaxed short shorts',
      shoes: 'bare feet as the locked footwear state',
      eyewear: 'round thin black metal eyeglasses',
    },
  },
};

export const HAIR_VARIANT_OPTIONS = [
  { id: 'default', label: '保留預設髮型', compatibleTags: [], prompt: 'keep the original character hair identity unchanged' },
  { id: 'low-ponytail', label: '低馬尾', compatibleTags: ['long', 'medium-long'], prompt: 'keep the original hair identity, gather the hair length into a loose low ponytail while preserving bangs, hair color, texture, and face-framing strands' },
  { id: 'high-ponytail', label: '高馬尾', compatibleTags: ['long'], prompt: 'keep the original hair identity, tie the hair into a high ponytail with natural volume while preserving bangs, hair color, texture, and face-framing strands' },
  { id: 'twin-tails', label: '雙馬尾', compatibleTags: ['long'], prompt: 'keep the original hair identity, style the length into loose twin tails while preserving bangs, hair color, texture, and face-framing strands' },
  { id: 'half-up', label: '半綁髮', compatibleTags: ['long', 'medium', 'lob'], prompt: 'keep the original hair identity, pull the upper hair into a soft half-up style while leaving the remaining length visible' },
  { id: 'loose-bun', label: '鬆散髮髻', compatibleTags: ['long', 'medium-long'], prompt: 'keep the original hair identity, gather the hair into a loose relaxed bun with natural loose strands around the face' },
  { id: 'tucked-behind-ears', label: '耳後收整', compatibleTags: ['short', 'bob', 'lob', 'medium'], prompt: 'keep the original hair identity, tuck part of the hair behind the ears while preserving length, bangs, color, and texture' },
  { id: 'outward-flipped-ends', label: '髮尾外翹', compatibleTags: ['short', 'bob', 'lob', 'medium'], prompt: 'keep the original hair identity, style the ends with a subtle outward flip and polished shape' },
  { id: 'slicked-back-wet-look', label: '油頭濕髮感', compatibleTags: ['short', 'bob'], prompt: 'keep the original hair identity, style the hair into a sleek wet-look swept-back finish while preserving the character hair color and cut length' },
  { id: 'highlight-streaks', label: '增加局部挑染', compatibleTags: ['long', 'medium', 'lob', 'bob', 'short'], prompt: 'keep the original hair identity, add subtle localized highlight streaks without changing the base hair color or haircut' },
  { id: 'hair-clips', label: '局部髮夾', compatibleTags: ['long', 'medium', 'lob', 'bob', 'short', 'bangs'], prompt: 'keep the original hair identity, add small understated hair clips near one side while preserving the original silhouette' },
];

function normalizeLayerMap(layerMap = {}) {
  return Object.fromEntries(
    CHARACTER_CARD_LAYER_KEYS
      .map((key) => {
        const prompt = String(layerMap[key] || '').trim();
        if (!prompt) return null;
        return [key, { key, label: CHARACTER_CARD_LAYER_LABELS[key], prompt }];
      })
      .filter(Boolean)
  );
}

export function getCharacterCardOptions(lockControls = []) {
  const control = lockControls.find((item) => item.key === 'characterProfileId');
  return (control?.options || [])
    .filter((option) => option.specialSubject === 'character-profile')
    .map((option) => {
      const extension = CHARACTER_CARD_EXTENSIONS[option.id] || {};
      return {
        id: option.id,
        label: option.zh,
        sourceOption: option,
        identityAndBody: option.profile?.identityAndBody || '',
        face: option.profile?.identityAndBody || '',
        skin: option.profile?.identityAndBody || '',
        makeup: option.profile?.identityAndBody || '',
        baseHair: option.profile?.hair || '',
        photographicDirection: option.profile?.photographicDirection || '',
        referenceImages: option.referenceImages || [],
        primaryReferenceImage: option.meta?.referenceImage || '',
        hairTags: extension.hairTags || [],
        enabledHairVariants: extension.enabledHairVariants || [],
        disabledHairVariants: extension.disabledHairVariants || [],
        defaultWardrobeLayers: normalizeLayerMap(extension.wardrobeLayers),
      };
    });
}

export function resolveCharacterCard(cards, id) {
  return cards.find((card) => card.id === id) || cards[0] || null;
}

export function getCompatibleHairVariants(card) {
  if (!card) return HAIR_VARIANT_OPTIONS.filter((variant) => variant.id === 'default');
  const tags = new Set(card.hairTags || []);
  const enabled = new Set(card.enabledHairVariants || []);
  const disabled = new Set(card.disabledHairVariants || []);
  return HAIR_VARIANT_OPTIONS.filter((variant) => {
    if (disabled.has(variant.id)) return false;
    if (variant.id === 'default' || enabled.has(variant.id)) return true;
    return variant.compatibleTags.some((tag) => tags.has(tag));
  });
}

export function createEmptyCharacterCardVariant(cards = []) {
  const card = cards[0] || null;
  return {
    characterProfileId: card?.id || '',
    hairVariantId: 'default',
    includedWardrobeLayers: card ? Object.keys(card.defaultWardrobeLayers) : [],
    promptOverrideText: '',
    outputMode: 'included-wardrobe',
  };
}

export function normalizeCharacterCardVariant(rawVariant = {}, cards = []) {
  const fallback = createEmptyCharacterCardVariant(cards);
  const characterProfileId = resolveCharacterCard(cards, rawVariant.characterProfileId)?.id || fallback.characterProfileId;
  const card = resolveCharacterCard(cards, characterProfileId);
  const hairVariants = getCompatibleHairVariants(card);
  const hairVariantId = hairVariants.some((variant) => variant.id === rawVariant.hairVariantId)
    ? rawVariant.hairVariantId
    : 'default';
  const validLayers = new Set(Object.keys(card?.defaultWardrobeLayers || {}));
  const includedWardrobeLayers = Array.isArray(rawVariant.includedWardrobeLayers)
    ? rawVariant.includedWardrobeLayers.filter((key) => validLayers.has(key))
    : fallback.includedWardrobeLayers;
  const outputMode = rawVariant.outputMode === 'pure-character' ? 'pure-character' : 'included-wardrobe';

  return {
    characterProfileId,
    hairVariantId,
    includedWardrobeLayers,
    promptOverrideText: String(rawVariant.promptOverrideText || ''),
    outputMode,
  };
}
