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

export const EYEWEAR_MODE_OPTIONS = [
  { id: 'default', label: '預設' },
  { id: 'glasses-on', label: '戴眼鏡' },
  { id: 'glasses-off', label: '不戴眼鏡' },
];

const DEFAULT_EYEWEAR_LAYER = {
  key: 'eyewear',
  label: CHARACTER_CARD_LAYER_LABELS.eyewear,
  prompt: 'natural thin-frame eyeglasses with transparent lenses, worn normally on the face',
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
  'character-yuna': {
    hairTags: ['long', 'wavy', 'bangs', 'brown-hair'],
    wardrobeLayers: {
      top: 'fitted white ribbed scoop-neck cropped tank top',
      bottom: 'slate-gray relaxed athletic shorts with a wide elastic waistband',
      outerwear: 'oversized pale powder-blue zip hoodie worn open with the hood usually raised',
      shoes: 'white crew socks and clean white low-top sneakers',
      neckAccessory: 'matte white over-ear headphones worn around the neck',
    },
  },
  'character-eleanor': {
    hairTags: ['long', 'wavy', 'black-hair', 'center-part'],
    wardrobeLayers: {
      dress: 'elaborate black and aged-bronze gothic armored corset gown with structured lace cups, engraved metal framing, sheer black floral-lace torso panels, fitted waist armor and floor-length layered black skirt panels with a trailing hem',
      shoes: 'black armored boots',
      neckAccessory: 'ornate black lace high collar with a small bronze centerpiece',
      wristAccessory: 'black lace gauntlets and engraved black-and-bronze forearm armor',
    },
  },
  'character-olivia': {
    hairTags: ['long', 'wavy', 'brown-hair', 'center-part'],
    wardrobeLayers: {
      top: 'glossy black patent triangle bikini top',
      bottom: 'matching low-rise thin-strap black bikini bottom',
      outerwear: 'oversized black varsity bomber jacket worn open with white striped ribbed trim and white script embroidery',
      shoes: 'black ankle-strap open-toe stiletto sandals',
      headAccessory: 'plain black baseball cap',
      earrings: 'long slim rectangular silver drop earrings',
      neckAccessory: 'delicate gold chain necklace with a small round pendant',
    },
  },
  'character-jiwoo': {
    hairTags: ['long', 'wavy', 'bangs', 'black-hair', 'dyed', 'highlight-streaks'],
    wardrobeLayers: {
      dress: 'fitted black off-shoulder gothic dress with a clean sweetheart neckline, short lace-trim sleeves, a defined waist and a flowing ankle-length A-line skirt',
      shoes: 'black pointed-toe stiletto pumps',
    },
  },
  'character-chihiro': {
    hairTags: ['long', 'wavy', 'dyed', 'center-part'],
    wardrobeLayers: {
      dress: 'black deep-V embellished camisole gown under a sheer black mesh and floral-lace overlay with translucent long sleeves, lace cuffs, a fitted lace waist panel and a floor-length layered black tulle skirt',
      shoes: 'black platform ankle boots',
      neckAccessory: 'wide black floral-lace choker',
    },
  },
  'character-koto': {
    hairTags: ['long', 'wavy', 'bangs', 'black-hair'],
    wardrobeLayers: {
      dress: 'fitted black gothic lace mini dress with an ornate beaded bodice, sheer floral-lace short sleeves, asymmetric translucent lace cape panels and a long trailing high-low overskirt',
      shoes: 'glossy black pointed-toe pumps',
      neckAccessory: 'wide black jeweled choker with an ornate silver pendant',
    },
  },
  'character-mei': {
    hairTags: ['long', 'wavy', 'dyed', 'center-part', 'ombre'],
    wardrobeLayers: {
      dress: 'floor-length black off-shoulder gothic gown with fitted long sleeves, pointed lace cuffs, an ornate black lace-and-beaded chest panel, a close fitted waist and a layered asymmetric trailing skirt',
      shoes: 'black lace-up platform combat ankle boots',
    },
  },
  'character-rei': {
    hairTags: ['long', 'black-hair', 'center-part', 'updo'],
    enabledHairVariants: ['low-ponytail', 'high-ponytail', 'half-up', 'loose-bun'],
    wardrobeLayers: {
      top: 'black ribbed high-neck cropped tank top',
      outerwear: 'open black zip hoodie with relaxed sleeves',
      bottom: 'faded charcoal distressed low-rise baggy jeans',
      shoes: 'worn cream athletic sneakers',
      earrings: 'small silver earrings',
      neckAccessory: 'layered silver chain necklaces',
    },
  },
  'character-amy': {
    hairTags: ['long', 'straight', 'bangs', 'brown-hair'],
    wardrobeLayers: {
      top: 'oversized vivid red pullover hoodie with a front kangaroo pocket and matching drawstrings',
      bottom: 'black sheer tights',
      shoes: 'glossy red lace-up combat boots with black soles',
      headAccessory: 'black ribbed knit beanie',
    },
  },
  'character-jiyoo': {
    hairTags: ['long', 'straight', 'black-hair', 'center-part'],
    wardrobeLayers: {
      top: 'black and crimson silk hanbok jeogori with a white crossover collar and ornate gold embroidery',
      bottom: 'floor-length charcoal-black skirt with deep crimson and gold brocade hem panels',
      shoes: 'black-and-gold embroidered flats',
    },
  },
  'character-yui': {
    hairTags: ['short', 'bob', 'bangs', 'blonde', 'center-part'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: {
      top: 'white strapless fitted tube top',
      bottom: 'white fitted mini skirt',
      shoes: 'bare feet as the locked footwear state',
    },
  },
  'character-nana': {
    hairTags: ['short', 'bob', 'bangs', 'black-hair'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: {
      top: 'crisp white short-sleeve button-up shirt with a navy plaid necktie',
      bottom: 'navy pleated skirt',
      shoes: 'navy ankle socks and brown leather loafers',
      earrings: 'small silver hoop earrings',
    },
  },
  'character-emily': {
    hairTags: ['long', 'black-hair', 'center-part', 'updo'],
    enabledHairVariants: ['low-ponytail', 'high-ponytail', 'half-up', 'loose-bun'],
    wardrobeLayers: {
      top: 'oversized white mesh football jersey with a bold black number graphic',
      bottom: 'dark washed baggy jeans',
      shoes: 'black-and-white chunky athletic sneakers',
      neckAccessory: 'black cord necklace with a silver cross pendant',
    },
  },
  'character-shiori': {
    hairTags: ['long', 'wavy', 'bangs', 'brown-hair'],
    wardrobeLayers: {
      top: 'black ribbed cropped camisole with thin straps',
      bottom: 'light-blue denim bib overalls worn loosely',
      shoes: 'black-and-white low-top canvas sneakers',
    },
  },
  'character-natsuki': {
    hairTags: ['short', 'bob', 'bangs', 'black-hair'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: {
      top: 'navy racerback athletic crop tank with white piping',
      bottom: 'matching navy athletic shorts with white trim',
      shoes: 'white lace-up athletic sneakers',
    },
  },
  'character-minji': {
    hairTags: ['short', 'bob', 'bangs', 'black-hair'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: {
      top: 'loose slate-blue camisole tank with thin straps',
      bottom: 'light-wash distressed straight-leg jeans',
      shoes: 'white athletic sneakers',
    },
  },
  'character-manami': {
    hairTags: ['short', 'bob', 'bangs', 'black-hair', 'dyed', 'highlight-streaks'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: {
      top: 'black floral-lace bralette',
      bottom: 'black high-waisted floral-lace briefs',
      outerwear: 'long white faux-fur coat worn open',
      shoes: 'black pointed-toe pumps',
      headAccessory: 'white lace headband',
      earrings: 'small dark crystal earrings',
    },
  },
  'character-grace': {
    hairTags: ['long', 'straight', 'bangs', 'black-hair', 'updo'],
    wardrobeLayers: {
      top: 'fitted white ribbed spaghetti-strap cropped camisole',
      bottom: 'low-rise light-wash denim mini skirt with a raw frayed hem',
      shoes: 'bare feet as the locked footwear state',
    },
  },
  'character-kaori': {
    hairTags: ['medium', 'bob', 'straight', 'black-hair', 'center-part'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: {
      top: 'fitted white graffiti-print cropped tank',
      bottom: 'black high-rise leather skinny pants',
      outerwear: 'black leather biker jacket with silver hardware',
      shoes: 'black lace-up combat boots',
      neckAccessory: 'black studded choker and layered silver chain necklaces',
      wristAccessory: 'spiked black wrist cuffs',
      ring: 'stacked silver rings',
    },
  },
  'character-soyeon': {
    hairTags: ['medium', 'bob', 'straight', 'bangs', 'black-hair', 'updo'],
    wardrobeLayers: {
      top: 'red satin Chinese-inspired halter bikini top with a standing mandarin collar, black piping and gold dragon embroidery',
      bottom: 'matching red high-cut bikini bottom with black edging',
      shoes: 'glossy red pointed-toe stiletto pumps',
    },
  },
  'character-bora': {
    hairTags: ['medium-long', 'medium', 'wavy', 'bangs', 'brown-hair', 'updo'],
    enabledHairVariants: ['low-ponytail', 'half-up', 'loose-bun'],
    wardrobeLayers: {
      top: 'sleeveless high-neck sheer black floral-lace cropped blouse layered over a black triangle bralette',
      bottom: 'black high-waisted pleated wide-leg tailored trousers',
      shoes: 'black lace-up platform ankle boots',
    },
  },
  'character-seulgi': {
    hairTags: ['medium', 'wavy', 'bangs', 'brown-hair'],
    enabledHairVariants: ['half-up', 'loose-bun'],
    wardrobeLayers: {
      top: 'sleeveless high-neck sheer black floral-lace cropped blouse layered over a black lace triangle bralette',
      bottom: 'black high-waisted pleated wide-leg tailored trousers',
      shoes: 'black low-platform lace-up shoes',
    },
  },
  'character-miku': {
    hairTags: ['long', 'wavy', 'bangs', 'black-hair', 'updo'],
    enabledHairVariants: ['low-ponytail', 'high-ponytail', 'twin-tails', 'half-up', 'loose-bun'],
    wardrobeLayers: {
      top: 'navy oversized V-neck cardigan over a crisp white collared shirt',
      bottom: 'navy pleated mini skirt',
      shoes: 'navy ankle socks and black leather penny loafers',
      neckAccessory: 'striped navy bow tie',
      waistAccessory: 'black nylon school backpack with a small plush teddy-bear charm',
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

function copyArray(value) {
  return Array.isArray(value) ? [...value] : [];
}

function normalizeVariantInput(rawVariant) {
  return rawVariant && typeof rawVariant === 'object' && !Array.isArray(rawVariant) ? rawVariant : {};
}

function normalizeEyewearMode(value) {
  return EYEWEAR_MODE_OPTIONS.some((option) => option.id === value) ? value : 'default';
}

export function getEffectiveCharacterCardWardrobeLayers(card, variant = {}) {
  const layerMap = { ...(card?.defaultWardrobeLayers || {}) };
  const eyewearMode = normalizeEyewearMode(variant.eyewearMode);

  if (eyewearMode === 'glasses-on' && !layerMap.eyewear) {
    layerMap.eyewear = { ...DEFAULT_EYEWEAR_LAYER };
  }
  if (eyewearMode === 'glasses-off') {
    delete layerMap.eyewear;
  }

  return layerMap;
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
        legacyIdentityAndBody: option.profile?.legacyIdentityAndBody || option.profile?.identityAndBody || '',
        facialGeometry: option.profile?.facialGeometry || '',
        eyeSignature: option.profile?.eyeSignature || '',
        noseSignature: option.profile?.noseSignature || '',
        mouthSignature: option.profile?.mouthSignature || '',
        skinSignature: option.profile?.skinSignature || '',
        makeup: option.profile?.makeup || '',
        body: option.profile?.body || '',
        distinctiveFeatures: option.profile?.distinctiveFeatures || '',
        // Legacy aliases now point to their corresponding structured fields.
        face: option.profile?.facialGeometry || '',
        skin: option.profile?.skinSignature || '',
        baseHair: option.profile?.hair || '',
        photographicDirection: option.profile?.photographicDirection || '',
        primaryReferenceImage: option.meta?.referenceImage || '',
        hairTags: copyArray(extension.hairTags),
        enabledHairVariants: copyArray(extension.enabledHairVariants),
        disabledHairVariants: copyArray(extension.disabledHairVariants),
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
  const layerMap = getEffectiveCharacterCardWardrobeLayers(card, { eyewearMode: 'default' });
  return {
    characterProfileId: card?.id || '',
    hairVariantId: 'default',
    eyewearMode: 'default',
    includedWardrobeLayers: card ? Object.keys(layerMap) : [],
    promptOverrideText: '',
    outputMode: 'included-wardrobe',
  };
}

export function normalizeCharacterCardVariant(rawVariant = {}, cards = []) {
  const variant = normalizeVariantInput(rawVariant);
  const fallback = createEmptyCharacterCardVariant(cards);
  const characterProfileId = resolveCharacterCard(cards, variant.characterProfileId)?.id || fallback.characterProfileId;
  const card = resolveCharacterCard(cards, characterProfileId);
  const hairVariants = getCompatibleHairVariants(card);
  const hairVariantId = hairVariants.some((hairVariant) => hairVariant.id === variant.hairVariantId)
    ? variant.hairVariantId
    : 'default';
  const eyewearMode = normalizeEyewearMode(variant.eyewearMode);
  const effectiveLayerMap = getEffectiveCharacterCardWardrobeLayers(card, { eyewearMode });
  const validLayers = new Set(Object.keys(effectiveLayerMap));
  const rawIncludedLayerSet = new Set(
    variant.outputMode === 'pure-character'
      ? []
      : Array.isArray(variant.includedWardrobeLayers)
        ? variant.includedWardrobeLayers
        : fallback.includedWardrobeLayers
  );
  if (eyewearMode === 'glasses-on') rawIncludedLayerSet.add('eyewear');
  if (eyewearMode === 'glasses-off') rawIncludedLayerSet.delete('eyewear');
  const includedWardrobeLayers = CHARACTER_CARD_LAYER_KEYS.filter((key) => validLayers.has(key) && rawIncludedLayerSet.has(key));
  const outputMode = variant.outputMode === 'pure-character' && includedWardrobeLayers.length === 0
    ? 'pure-character'
    : 'included-wardrobe';

  return {
    characterProfileId,
    hairVariantId,
    eyewearMode,
    includedWardrobeLayers,
    promptOverrideText: String(variant.promptOverrideText || ''),
    outputMode,
  };
}

function cleanSentence(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function selectedHairVariant(card, variant) {
  return getCompatibleHairVariants(card).find((item) => item.id === variant.hairVariantId)
    || HAIR_VARIANT_OPTIONS[0];
}

function selectedLayers(card, variant) {
  const layerMap = getEffectiveCharacterCardWardrobeLayers(card, variant);
  const included = new Set(variant.includedWardrobeLayers || []);
  if (variant.outputMode === 'pure-character') return [];
  return CHARACTER_CARD_LAYER_KEYS
    .filter((key) => included.has(key) && layerMap[key])
    .map((key) => layerMap[key]);
}

function buildLayerText(layers) {
  return layers.map((layer) => `${layer.label}: ${layer.prompt}`).join('\n');
}

function normalizePromptOverrideText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function buildCharacterIdentityText(card, hairVariant) {
  const structuredIdentityLines = [
    `Facial geometry:\n${cleanSentence(card.facialGeometry)}`,
    `Eye signature:\n${cleanSentence(card.eyeSignature)}`,
    `Nose signature:\n${cleanSentence(card.noseSignature)}`,
    `Mouth signature:\n${cleanSentence(card.mouthSignature)}`,
    `Skin signature:\n${cleanSentence(card.skinSignature)}`,
    `Makeup:\n${cleanSentence(card.makeup)}`,
    `Body:\n${cleanSentence(card.body)}`,
    `Permanent identity anchors:\n${cleanSentence(card.distinctiveFeatures)}`,
  ].filter((line) => !line.endsWith(':\n'));

  return [
    `Character Profile Card:\n${card.label}`,
    ...(structuredIdentityLines.length > 0
      ? structuredIdentityLines
      : [`Identity and body:\n${cleanSentence(card.identityAndBody)}`]),
    `Hair:\n${cleanSentence(`${card.baseHair}, ${hairVariant.prompt}`)}`,
    `Photographic direction:\n${cleanSentence(card.photographicDirection || 'photorealistic editorial portrait, coherent facial identity, natural photographic detail')}`,
  ].join('\n\n');
}

export function buildCharacterCardPromptBundle(cards = [], rawVariant = {}) {
  const variant = normalizeCharacterCardVariant(rawVariant, cards);
  const card = resolveCharacterCard(cards, variant.characterProfileId);
  if (!card) return { card: null, variant, outputs: [], summary: '' };

  const hairVariant = selectedHairVariant(card, variant);
  const layers = selectedLayers(card, variant);
  const wardrobeText = buildLayerText(layers);
  const wardrobeBlock = wardrobeText ? `\n\nWardrobe layers:\n${wardrobeText}` : '';
  const promptOverrideText = normalizePromptOverrideText(variant.promptOverrideText);
  const promptOverrideBlock = promptOverrideText
    ? `\n\nTemporary character-card override:\n${cleanSentence(promptOverrideText)}`
    : '';
  const promptOverridePhrase = promptOverrideText
    ? `temporary character-card override, supplemental character direction: ${promptOverrideText}`
    : '';
  const identityText = buildCharacterIdentityText(card, hairVariant);
  const summary = `${card.label} / ${hairVariant.label}${layers.length ? ` / ${layers.map((layer) => layer.label).join('、')}` : ' / 純人物'}`;
  const gpt = [
    'Image Type:\nCreate a photorealistic character-card portrait reference.',
    `Subject:\n${identityText}${wardrobeBlock}${promptOverrideBlock}`,
    'Camera Look:\nclean realistic character reference, neutral production-ready detail, consistent identity, realistic facial proportions',
  ].join('\n\n');
  const grokZImage = cleanSentence([
    `Create a natural photorealistic character reference of ${card.label}`,
    card.identityAndBody,
    `permanent identity anchors: ${card.distinctiveFeatures}`,
    `${card.baseHair}, ${hairVariant.prompt}`,
    layers.length ? `included wardrobe layers: ${layers.map((layer) => layer.prompt).join(', ')}` : 'no clothing layers included, focus on identity and hair',
    promptOverridePhrase,
    card.photographicDirection,
  ].filter(Boolean).join(', '));
  const ai = cleanSentence([
    `Photorealistic character reference of ${card.label}`,
    card.identityAndBody,
    `permanent identity anchors: ${card.distinctiveFeatures}`,
    `${card.baseHair}, ${hairVariant.prompt}`,
    layers.length ? `wearing ${layers.map((layer) => layer.prompt).join(', ')}` : 'pure character identity and hair reference',
    promptOverridePhrase,
  ].filter(Boolean).join(', '));
  const headshot = cleanSentence([
    `headshot reference of ${card.label}`,
    'tight face-and-hair portrait, neutral clean background, consistent facial identity',
    card.identityAndBody,
    `permanent identity anchors: ${card.distinctiveFeatures}`,
    `${card.baseHair}, ${hairVariant.prompt}`,
    promptOverridePhrase,
    'clear skin texture, makeup, eyes, nose, lips, jawline, and hairline',
  ].filter(Boolean).join(', '));
  const fourView = cleanSentence([
    `four-view character reference sheet for ${card.label}`,
    'one image containing front view, left 45-degree view, side profile view, and back view',
    'same exact woman in every panel, matched facial proportions, consistent hair silhouette',
    card.identityAndBody,
    `permanent identity anchors: ${card.distinctiveFeatures}`,
    `${card.baseHair}, ${hairVariant.prompt}`,
    layers.length ? `use the included wardrobe layers consistently: ${layers.map((layer) => layer.prompt).join(', ')}` : 'no clothing design emphasis, neutral shoulders and body reference',
    promptOverridePhrase,
  ].filter(Boolean).join(', '));
  const fullBody = cleanSentence([
    `full-body character reference of ${card.label}`,
    'neutral studio reference, clear standing full-body view, same exact identity',
    card.identityAndBody,
    `permanent identity anchors: ${card.distinctiveFeatures}`,
    `${card.baseHair}, ${hairVariant.prompt}`,
    layers.length ? `included wardrobe layers: ${layers.map((layer) => layer.prompt).join(', ')}` : 'pure body and hair reference without fixed outfit design',
    promptOverridePhrase,
  ].filter(Boolean).join(', '));

  return {
    card,
    variant,
    summary,
    outputs: [
      { id: 'gpt', label: 'GPT Prompt', value: gpt },
      { id: 'grok-z-image', label: 'Grok/Z-Image Prompt', value: grokZImage },
      { id: 'ai', label: 'AI Prompt', value: ai },
      { id: 'headshot', label: 'Headshot Prompt', value: headshot },
      { id: 'four-view', label: 'Four-View Prompt', value: fourView },
      { id: 'full-body-reference', label: 'Full-Body Reference Prompt', value: fullBody },
    ],
  };
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function normalizePromptOutput(output, fallbackOutput) {
  const label = String(output?.label || fallbackOutput.label || '');
  const value = String(output?.value || output?.text || fallbackOutput.value || '');
  return { id: fallbackOutput.id, label, value };
}

function mergePromptOutputs(fallbackOutputs, rawOutputs) {
  const outputMap = new Map(
    Array.isArray(rawOutputs)
      ? rawOutputs
        .filter((output) => isPlainObject(output) && typeof output.id === 'string')
        .map((output) => [output.id, output])
      : []
  );

  return fallbackOutputs.map((fallbackOutput) => (
    outputMap.has(fallbackOutput.id)
      ? normalizePromptOutput(outputMap.get(fallbackOutput.id), fallbackOutput)
      : fallbackOutput
  ));
}

function promptOutputById(outputs, id) {
  return outputs.find((output) => output.id === id) || null;
}

function buildWardrobeSummary(card, variant) {
  const layers = selectedLayers(card, variant);
  return layers.length ? layers.map((layer) => layer.label).join('、') : '純人物';
}

function mergeBundleVariantInput(rawVariant, bundleVariant, cards) {
  const merged = { ...normalizeVariantInput(rawVariant) };
  if (!isPlainObject(bundleVariant)) return merged;

  const bundleCharacterId = typeof bundleVariant.characterProfileId === 'string'
    ? bundleVariant.characterProfileId.trim()
    : '';
  if (bundleCharacterId && resolveCharacterCard(cards, bundleCharacterId)?.id === bundleCharacterId) {
    merged.characterProfileId = bundleCharacterId;
  }

  const effectiveCard = resolveCharacterCard(cards, merged.characterProfileId);
  const bundleHairId = typeof bundleVariant.hairVariantId === 'string'
    ? bundleVariant.hairVariantId.trim()
    : '';
  if (bundleHairId && getCompatibleHairVariants(effectiveCard).some((hairVariant) => hairVariant.id === bundleHairId)) {
    merged.hairVariantId = bundleHairId;
  }
  if (Array.isArray(bundleVariant.includedWardrobeLayers)) {
    merged.includedWardrobeLayers = bundleVariant.includedWardrobeLayers;
  }
  if (typeof bundleVariant.eyewearMode === 'string') {
    merged.eyewearMode = bundleVariant.eyewearMode;
  }
  if (typeof bundleVariant.promptOverrideText === 'string') {
    merged.promptOverrideText = bundleVariant.promptOverrideText;
  }
  if (bundleVariant.outputMode === 'pure-character' || bundleVariant.outputMode === 'included-wardrobe') {
    merged.outputMode = bundleVariant.outputMode;
  }

  return merged;
}

export function buildCharacterCardSavedCard(cards = [], rawVariant = {}, bundle = null) {
  const inputBundle = isPlainObject(bundle) ? bundle : {};
  const mergedRawVariant = mergeBundleVariantInput(rawVariant, inputBundle.variant, cards);
  const fallbackBundle = buildCharacterCardPromptBundle(cards, mergedRawVariant);
  const effectiveVariant = fallbackBundle.variant;
  const outputs = mergePromptOutputs(fallbackBundle.outputs, inputBundle.outputs);
  const card = fallbackBundle.card || (isPlainObject(inputBundle.card) ? inputBundle.card : null);
  const summary = String(inputBundle.summary || fallbackBundle.summary || '');
  const gpt = promptOutputById(outputs, 'gpt')?.value || '';
  const grokZImage = promptOutputById(outputs, 'grok-z-image')?.value || '';
  const ai = promptOutputById(outputs, 'ai')?.value || '';
  const extraPrompts = outputs
    .filter((output) => !['gpt', 'grok-z-image', 'ai'].includes(output.id))
    .map((output) => ({ id: output.id, label: output.label, text: output.value }));

  return {
    id: `page2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: 'page2',
    sourceLabel: '角色卡',
    date: new Date().toISOString(),
    summary: `角色卡｜${summary}`,
    summaryFields: {
      characterDna: card?.label || '-',
      expressionPose: promptOutputById(outputs, 'headshot')?.label || '-',
      wardrobe: buildWardrobeSummary(card, effectiveVariant),
      sceneLook: '-',
    },
    midjourneyPrompt: ai,
    grokPrompt: gpt,
    zImagePrompt: grokZImage,
    promptLabels: {
      midjourney: 'AI Prompt',
      grok: 'GPT Prompt',
      zImage: 'Grok/Z-Image Prompt',
    },
    extraPrompts,
    selection: null,
    structured: {
      'Character Card': [
        { zh: card?.label || '角色卡', en: summary },
      ],
    },
    profile: { ...effectiveVariant },
  };
}

const PAGE1_FULL_LOOK_CLEAR_KEYS = [
  'specialOutfitId',
  'outfitPresetId',
  'outfitPresetColorId',
  'outfitPresetPrimaryColorId',
  'outfitPresetContrastColorId',
  'outfitPresetLockedPaletteId',
  'completeLookPaletteId',
  'topBottomPaletteId',
];

const PAGE1_TOP_CLEAR_KEYS = ['topId', 'topFitId', 'topStylingId', 'topColorId', 'topPatternId'];
const PAGE1_BOTTOM_CLEAR_KEYS = ['pantsId', 'skirtId', 'bottomFitId', 'bottomRiseId', 'bottomColorId', 'bottomPatternId'];
const PAGE1_DRESS_CLEAR_KEYS = ['dressId', 'dressColorId'];

const PAGE1_NONE_LOCK_IDS = {
  specialOutfitId: 'wardrobe:特殊穿搭-special-outfits:全無:0',
  outfitPresetId: 'outfit-preset-none',
  outfitPresetColorId: 'none',
  outfitPresetPrimaryColorId: 'none',
  outfitPresetContrastColorId: 'none',
  outfitPresetLockedPaletteId: 'none',
  completeLookPaletteId: 'none',
  topBottomPaletteId: 'none',
  dressId: 'wardrobe:連身-dresses:全無:0',
  dressColorId: 'none',
  topId: 'wardrobe:上身-tops:全無:0',
  topFitId: 'none',
  topStylingId: 'none',
  topColorId: 'none',
  topPatternId: 'wardrobe:上身圖案-top-surface-design:全無:0',
  pantsId: 'wardrobe:褲裝-pants:全無:0',
  skirtId: 'wardrobe:裙裝-skirts:全無:0',
  bottomFitId: 'none',
  bottomRiseId: 'none',
  bottomColorId: 'none',
  bottomPatternId: 'wardrobe:下身圖案-bottom-surface-design:全無:0',
  outerwearId: 'wardrobe:外套-outerwear:全無:0',
  outerwearFitId: 'wardrobe:外套版型-outerwear-fit:全無:0',
  outerwearColorId: 'none',
  outerwearPatternId: 'wardrobe:外套圖案-outerwear-surface-design:全無:0',
  outerwearOpeningId: 'wardrobe:外套開合-outerwear-opening:全無:0',
  outerwearStylingId: 'wardrobe:外套穿法-outerwear-styling:全無:0',
  shoesId: 'wardrobe:鞋款-shoes:全無:0',
  shoesColorId: 'none',
  headAccessoryId: 'wardrobe:頭部配件-head-accessories:全無:0',
  eyewearId: 'wardrobe:眼鏡-eyewear:全無:0',
  eyewearColorId: 'wardrobe:眼鏡配色-eyewear-color:全無:0',
  eyewearPlacementId: 'none',
  earringsId: 'wardrobe:耳環-earrings:全無:0',
  neckAccessoryId: 'wardrobe:頸部-neck-accessories:全無:0',
};

const PAGE1_LAYER_CLEAR_KEYS = {
  top: [...PAGE1_TOP_CLEAR_KEYS, ...PAGE1_DRESS_CLEAR_KEYS, ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  bottom: [...PAGE1_BOTTOM_CLEAR_KEYS, ...PAGE1_DRESS_CLEAR_KEYS, ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  dress: [...PAGE1_DRESS_CLEAR_KEYS, ...PAGE1_TOP_CLEAR_KEYS, ...PAGE1_BOTTOM_CLEAR_KEYS, ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  outerwear: ['outerwearId', 'outerwearFitId', 'outerwearColorId', 'outerwearPatternId', 'outerwearOpeningId', 'outerwearStylingId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  shoes: ['shoesId', 'shoesColorId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  headAccessory: ['headAccessoryId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  eyewear: ['eyewearId', 'eyewearColorId', 'eyewearPlacementId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  earrings: ['earringsId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  neckAccessory: ['neckAccessoryId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  wristAccessory: ['wristAccessoryId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  ring: ['ringId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  waistAccessory: ['waistAccessoryId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
};

const PAGE1_EYEWEAR_CLEAR_KEYS = PAGE1_LAYER_CLEAR_KEYS.eyewear;

export function buildPage1LocksFromCharacterCardVariant(prevLocks = {}, rawVariant = {}, cards = []) {
  const variant = normalizeCharacterCardVariant(rawVariant, cards);
  const appliedLayerIds = variant.outputMode === 'pure-character' ? [] : variant.includedWardrobeLayers;
  const next = {
    ...prevLocks,
    subjectCount: '1',
    specialSubjectId: 'none',
    characterProfileId: variant.characterProfileId,
    characterCardHairVariantId: variant.hairVariantId,
    characterCardEyewearMode: variant.eyewearMode,
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: [...appliedLayerIds],
    characterCardPromptOverride: variant.promptOverrideText,
  };

  appliedLayerIds.forEach((layerKey) => {
    (PAGE1_LAYER_CLEAR_KEYS[layerKey] || []).forEach((lockKey) => {
      next[lockKey] = PAGE1_NONE_LOCK_IDS[lockKey] ?? (Array.isArray(next[lockKey]) ? [] : '');
    });
  });

  if (variant.eyewearMode === 'glasses-off') {
    PAGE1_EYEWEAR_CLEAR_KEYS.forEach((lockKey) => {
      next[lockKey] = PAGE1_NONE_LOCK_IDS[lockKey] ?? (Array.isArray(next[lockKey]) ? [] : '');
    });
  }

  return next;
}
