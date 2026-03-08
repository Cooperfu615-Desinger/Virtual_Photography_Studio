import database from '../data/database.json' with { type: 'json' };

const BASE_QUALITY = '(masterpiece, best quality, ultra-detailed:1.2), highres, raw photo';

const SOURCE_GROUPS = {
  styleId: 'Regional',
  locationId: 'Locations',
  framingId: 'CameraLighting',
  lightingId: 'CameraLighting',
  wardrobeVibeId: 'Wardrobe',
};

const LOCK_DEFINITIONS = [
  { key: 'styleId', label: 'Regional Style', category: '區域攝影風格' },
  { key: 'locationId', label: 'Location', category: null },
  { key: 'framingId', label: 'Framing', category: '景別構圖 (Framing)' },
  { key: 'lightingId', label: 'Lighting', category: '光線類型 (Lighting Type)' },
  { key: 'wardrobeVibeId', label: 'Wardrobe Core', category: '風格基調 (Vibe)' },
];

const PARTIAL_REROLL_OPTIONS = [
  { key: 'styleId', label: 'Style' },
  { key: 'locationId', label: 'Location' },
  { key: 'framingId', label: 'Framing' },
  { key: 'lightingId', label: 'Lighting' },
  { key: 'wardrobeVibeId', label: 'Wardrobe' },
];

const CUSTOM_GROUP_OPTIONS = [
  { value: 'Regional', label: 'Regional Style' },
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

  if (hasAny(haystack, ['taiwan'])) tags.push('nostalgic', 'warm_grade', 'film');
  if (hasAny(haystack, ['japan'])) tags.push('soft_grade', 'cool_grade', 'urban');
  if (hasAny(haystack, ['korea'])) tags.push('clean_grade', 'beauty');
  if (hasAny(haystack, ['hong kong'])) tags.push('neon', 'urban', 'artificial_light');
  if (hasAny(haystack, ['australia'])) tags.push('sunny', 'outdoor_bias', 'warm_grade');
  if (hasAny(haystack, ['usa'])) tags.push('high_contrast', 'sunny');
  if (hasAny(haystack, ['germany'])) tags.push('cool_grade', 'minimal');
  if (hasAny(haystack, ['france'])) tags.push('warm_grade', 'film', 'elegant');
  if (hasAny(haystack, ['italy'])) tags.push('warm_grade', 'high_saturation', 'dramatic');
  if (hasAny(haystack, ['china'])) tags.push('beauty', 'high_saturation');

  return { tags: withTags(tags) };
}

function inferLocationMeta(category, item) {
  const haystack = toHaystack(category, item.zh, item.en, item.desc);
  const tags = [];

  if (category.includes('Studio Sets')) tags.push('indoor', 'set', 'controlled', 'studio');
  if (category.includes('Seamless')) tags.push('studio', 'controlled', 'minimal', 'indoor');
  if (category.includes('Urban')) tags.push('urban');
  if (category.includes('Indoor')) tags.push('indoor');
  if (category.includes('Nature')) tags.push('outdoor', 'natural');
  if (category.includes('Sci-Fi')) tags.push('scifi', 'artificial_light');
  if (category.includes('Underground')) tags.push('underground', 'dark', 'artificial_light');

  if (hasAny(haystack, ['night', 'neon', '霓虹', '夜市', 'rave', 'club', '2am'])) tags.push('night');
  if (hasAny(haystack, ['golden hour', 'sunny', 'sunflower', 'desert', 'beach'])) tags.push('day', 'sunlight');
  if (hasAny(haystack, ['fog', '霧', 'twilight'])) tags.push('foggy');
  if (hasAny(haystack, ['window', 'sunbeams', 'daylight'])) tags.push('window_light');
  if (hasAny(haystack, ['laser', 'led', 'server room', 'monitor glow', 'space station'])) tags.push('artificial_light');
  if (hasAny(haystack, ['club', 'laser', 'smoke'])) tags.push('club', 'smoke');
  if (hasAny(haystack, ['mansion', 'victorian', 'opera house', 'library'])) tags.push('heritage');
  if (hasAny(haystack, ['white background', 'grey seamless', 'paper roll', 'backdrop'])) tags.push('studio');

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
  if (hasAny(haystack, ['dutch angle'])) return { tags: ['dynamic'] };

  return { tags: ['eye_contact_ok'] };
}

function inferLightingMeta(category, item) {
  const haystack = toHaystack(category, item.zh, item.en, item.desc);
  const tags = [];

  if (hasAny(haystack, ['golden hour', 'warm sunlight'])) tags.push('natural_light', 'sunlight', 'outdoor', 'warm');
  if (hasAny(haystack, ['blue hour', 'twilight'])) tags.push('natural_light', 'outdoor', 'dusk', 'cool');
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

  if (category.includes('Face Shape')) minVisibility = 'medium';
  if (category.includes('Facial Features')) minVisibility = 'portrait';
  if (category.includes('Skin Tone')) minVisibility = 'portrait';
  if (category.includes('Hairstyle')) minVisibility = 'medium';
  if (category.includes('Hair Color')) minVisibility = 'medium';
  if (category.includes('Expression')) minVisibility = 'medium';
  if (category.includes('Pose')) minVisibility = 'full';
  if (category.includes('Age')) minVisibility = 'medium';

  if (hasAny(haystack, ['freckles', '雀斑', 'eyelashes', 'lip', 'nose', '瞳', 'gaze', 'eye contact'])) {
    minVisibility = 'portrait';
    tags.push('fine_detail');
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

  return { family, tags: withTags(tags) };
}

function inferFilmMeta(_category, item) {
  const haystack = toHaystack(item.zh, item.en, item.desc);
  const tags = [];

  if (hasAny(haystack, ['polaroid', 'vhs'])) tags.push('retro');
  if (hasAny(haystack, ['kodak', 'portra', 'superia'])) tags.push('film');
  if (hasAny(haystack, ['black and white', 'ilford'])) tags.push('monochrome');
  if (hasAny(haystack, ['medium format'])) tags.push('detail_heavy');

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
  return Object.fromEntries(LOCK_DEFINITIONS.map((definition) => [definition.key, '']));
}

export function getLockControls(customLibrary = []) {
  const { flatCatalog } = buildCatalog(customLibrary);

  return LOCK_DEFINITIONS.map((definition) => {
    let options = [];

    if (definition.key === 'styleId') options = flatCatalog.regional;
    if (definition.key === 'locationId') options = flatCatalog.locations;
    if (definition.key === 'framingId') options = flatCatalog.framing;
    if (definition.key === 'lightingId') options = flatCatalog.lighting;
    if (definition.key === 'wardrobeVibeId') options = flatCatalog.wardrobeVibe;

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
  }

  if (locTags.has('night') && lightTags.has('sunlight')) return false;
  if (locTags.has('day') && lightTags.has('dusk')) return false;
  if (locTags.has('scifi') && lightTags.has('sunlight')) return false;
  if ((locTags.has('heritage') || locTags.has('urban') || locTags.has('natural')) && lightTags.has('studio_light')) return false;

  return true;
}

function lightDirectionSupportsScene(lightDirection, framing, location, lighting) {
  const directionTags = new Set(lightDirection.meta.tags);
  const locationTags = new Set(location.meta.tags);
  const lightingTags = new Set(lighting.meta.tags);

  if (directionTags.has('portrait_light') && !visibilityAtLeast(framing.meta.visibility, 'medium')) return false;
  if (directionTags.has('window_light') && !locationTags.has('window_light') && !locationTags.has('indoor')) return false;
  if (directionTags.has('portrait_light') && lightingTags.has('outdoor') && !visibilityAtLeast(framing.meta.visibility, 'portrait')) return false;
  if (locationTags.has('outdoor') && (directionTags.has('window_light') || directionTags.has('overhead'))) return false;
  if (lightingTags.has('outdoor') && directionTags.has('artificial_light')) return false;

  return true;
}

function styleFitsLocation(style, location) {
  const styleTags = new Set(style.meta.tags);
  const locationTags = new Set(location.meta.tags);

  if (styleTags.has('outdoor_bias') && (locationTags.has('underground') || locationTags.has('club') || locationTags.has('studio'))) return false;
  if (styleTags.has('outdoor_bias') && !locationTags.has('outdoor') && !locationTags.has('sunlight')) return false;
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
  return true;
}

function detailAllowed(item, framing) {
  return visibilityAtLeast(framing.meta.visibility, item.meta.minVisibility);
}

function pickWithLock(list, lockedId, predicate = () => true) {
  if (lockedId) {
    const locked = findById(list, lockedId);
    if (locked && predicate(locked)) return locked;
  }

  const matches = list.filter(predicate);
  return matches.length > 0 ? sample(matches) : sample(list);
}

function collectPositiveTags(...items) {
  return withTags(items.filter(Boolean).flatMap((item) => item.meta?.tags || []));
}

function buildCharacter(context, catalog) {
  const character = [{ zh: '一名女性', en: '1girl', id: 'base-character', meta: { tags: ['female'] } }];
  const visibility = context.framing.meta.visibility;
  let lockedArchetype = null;

  const pickCategory = (categoryKey, customPredicate = () => true) => {
    const candidates = getByKey(catalog.character, categoryKey).filter((item) => detailAllowed(item, context.framing) && customPredicate(item));
    if (candidates.length === 0) return null;
    const picked = sample(candidates);
    if (picked.meta.archetype && !lockedArchetype) lockedArchetype = picked.meta.archetype;
    character.push(picked);
    return picked;
  };

  if (visibilityAtLeast(visibility, 'medium')) pickCategory('臉型輪廓 (Face Shape)');

  if (visibilityAtLeast(visibility, 'portrait')) {
    pickCategory('五官特徵 (Facial Features)', (item) => !lockedArchetype || !item.meta.archetype || item.meta.archetype === lockedArchetype);
    pickCategory('膚色與膚質 (Skin Tone & Texture)');
  }

  if (visibilityAtLeast(visibility, 'medium')) {
    pickCategory('髮型 (Hairstyle)');
    pickCategory('髮色 (Hair Color)');
    pickCategory('年齡氣質 (Age & Aura)');
  }

  const expression = pickCategory('神情與眼神 (Expression & Gaze)', (item) => expressionSupportsComposition(item, context));

  if (visibilityAtLeast(visibility, 'full')) {
    pickCategory('姿勢與肢體語言 (Pose & Body Language)');
  } else if (!expression) {
    pickCategory('姿勢與肢體語言 (Pose & Body Language)', (item) => detailAllowed(item, context.framing));
  }

  return character;
}

function buildWardrobe(context, locks, catalog) {
  const vibe = pickWithLock(catalog.flatCatalog.wardrobeVibe, locks.wardrobeVibeId, (item) => wardrobeFitsLocation(item, context.location));
  const family = vibe.meta.family;
  const pieces = [vibe];
  const visibility = context.framing.meta.visibility;

  const maybePick = (categoryKey, probability = 1, extraPredicate = () => true) => {
    if (Math.random() > probability) return null;
    const candidates = getByKey(catalog.catalog.wardrobe, categoryKey).filter(
      (item) => familyCompatible(family, item.meta.family) && wardrobeFitsLocation(item, context.location) && extraPredicate(item)
    );
    if (candidates.length === 0) return null;
    const picked = sample(candidates);
    pieces.push(picked);
    return picked;
  };

  maybePick('上身 (Tops)');

  if (frameShowsAtLeast(visibility, 'medium')) {
    maybePick('下身 (Bottoms)');
    maybePick('外套 (Outerwear)', context.location.meta.tags.includes('outdoor') ? 0.6 : 0.35);
  }

  if (frameShowsAtLeast(visibility, 'full')) {
    maybePick('鞋款 (Shoes)');
  }

  maybePick('配件 (Accessories)', visibilityAtLeast(visibility, 'portrait') ? 0.55 : 0.7);
  maybePick('材質與細節 (Textures & Details)', 0.45, (item) => {
    if (family !== 'bdsm' && item.meta.family === 'bdsm') return false;
    if (context.location.meta.tags.includes('outdoor') && item.meta.tags.includes('revealing') && !context.location.meta.tags.includes('beach')) return false;
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

function buildSummary(context, wardrobe, character) {
  const characterBits = character.slice(1).filter((item) => item && item.zh).slice(0, 2).map((item) => item.zh);

  return [
    `風格：${context.style.zh || '-'}`,
    `人物：${characterBits.length > 0 ? `一名女性, ${characterBits.join(', ')}` : '一名女性'}`,
    `服裝：${wardrobe[0]?.zh || '-'}`,
    `場景：${context.location.zh || '-'}`,
    `鏡頭：${context.framing.zh || '-'} / ${context.angle.zh || '-'}`,
    `光影：${context.lighting.zh || '-'}`,
  ].join(' | ');
}

function joinEn(items) {
  return items.filter(Boolean).map((item) => item.en).filter(Boolean).join(', ');
}

function joinLimited(items, limit) {
  return joinEn(items.slice(0, limit));
}

function buildPrompts(context, character, wardrobe, lightDirection, film, effect) {
  const styleMood = context.style.en;
  const locationText = context.location.en;
  const characterText = joinEn(character);
  const wardrobeText = joinEn(wardrobe);
  const conciseCharacter = joinLimited(character, 5);
  const conciseWardrobe = joinLimited(wardrobe, 4);

  const midjourneySegments = [
    BASE_QUALITY,
    styleMood,
    context.framing.en,
    context.angle.en,
    conciseCharacter,
    `wearing ${conciseWardrobe}`,
    `in ${locationText}`,
    context.lighting.en,
    lightDirection.en,
    film.en,
    effect?.en,
  ].filter(Boolean);

  let midjourneyPrompt = '';
  for (const segment of midjourneySegments) {
    const next = midjourneyPrompt ? `${midjourneyPrompt}, ${segment}` : segment;
    if (next.length > 900) break;
    midjourneyPrompt = next;
  }

  const grokPrompt = [
    `Create a realistic editorial photograph of ${characterText}.`,
    wardrobeText ? `The subject is wearing ${wardrobeText}.` : '',
    `Place her in ${locationText}.`,
    `Use ${context.framing.en} with ${context.angle.en}.`,
    `Light the scene with ${context.lighting.en} and ${lightDirection.en}.`,
    `Finish with ${film.en}${effect ? ` and ${effect.en}` : ''}.`,
    `Overall visual direction: ${styleMood}.`,
  ]
    .filter(Boolean)
    .join(' ');

  return { midjourneyPrompt, grokPrompt };
}

function buildSelectionSnapshot(context, wardrobe) {
  return {
    styleId: context.style.id,
    locationId: context.location.id,
    framingId: context.framing.id,
    lightingId: context.lighting.id,
    wardrobeVibeId: wardrobe[0]?.id || '',
  };
}

export function buildLocksFromPrompt(prompt, keepKeys = []) {
  const base = createEmptyLocks();
  keepKeys.forEach((key) => {
    base[key] = prompt.selection?.[key] || '';
  });
  return base;
}

function generateSinglePrompt(index, locks, customLibrary) {
  const runtime = buildCatalog(customLibrary);
  const location = pickWithLock(runtime.flatCatalog.locations, locks.locationId);
  const style = pickWithLock(runtime.flatCatalog.regional, locks.styleId, (item) => styleFitsLocation(item, location));
  const framing = pickWithLock(runtime.flatCatalog.framing, locks.framingId, (item) => !(location.meta.tags.includes('club') && item.meta.visibility === 'close'));
  const angle = pickWithLock(runtime.flatCatalog.angle, locks.angleId, (item) => framingSupportsAngle(framing, item));
  const lighting = pickWithLock(runtime.flatCatalog.lighting, locks.lightingId, (item) => locationSupportsLighting(location, item));
  const lightDirection = pickWithLock(runtime.flatCatalog.lightDirection, locks.lightDirectionId, (item) => lightDirectionSupportsScene(item, framing, location, lighting));
  const film = pickWithLock(runtime.flatCatalog.film, locks.filmId);
  const effect = Math.random() > 0.65 ? sample(runtime.flatCatalog.effects) : null;

  const context = { style, location, framing, angle, lighting };
  const character = buildCharacter(context, runtime.catalog);
  const wardrobe = buildWardrobe({ ...context }, locks, runtime);
  context.wardrobe = wardrobe;

  const positiveTags = collectPositiveTags(style, location, framing, angle, lighting, lightDirection, film, effect, wardrobe, character);
  const negativePrompt = buildNegativePrompt(context, positiveTags, runtime);
  const { midjourneyPrompt, grokPrompt } = buildPrompts(context, character, wardrobe, lightDirection, film, effect);

  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    summary: buildSummary(context, wardrobe, character),
    midjourneyPrompt,
    grokPrompt,
    negativePrompt,
    selection: buildSelectionSnapshot(context, wardrobe),
    structured: {
      Style: [style],
      Character: character,
      Wardrobe: wardrobe,
      Location: [location],
      Framing: [framing, angle],
      Lighting: [lighting, lightDirection],
      'Camera & Film': [film, effect].filter(Boolean),
    },
  };
}

export function generatePrompts(count = 1, locks = createEmptyLocks(), customLibrary = []) {
  return Array.from({ length: count }, (_, index) => generateSinglePrompt(index, locks, customLibrary));
}
