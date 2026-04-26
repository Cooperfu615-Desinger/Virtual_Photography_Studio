const sample = (items) => items[Math.floor(Math.random() * items.length)];

function shuffle(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function sampleMany(items, count) {
  return shuffle(items).slice(0, Math.max(0, count));
}

function unique(items) {
  return [...new Set(items)];
}

export const SUNO_LIMITS = {
  genres: 5,
  instruments: 5,
  vocals: 3,
  textures: 4,
};

export const SUNO_OPTIONS = {
  genres: [
    { id: 'soft-rock', zh: 'Soft Rock', prompt: 'soft rock' },
    { id: 'acid-jazz', zh: 'Acid Jazz', prompt: 'acid jazz' },
    { id: 'hip-hop-soul', zh: 'Hip Hop Soul', prompt: 'hip hop soul' },
    { id: 'britpop', zh: 'Britpop', prompt: 'britpop' },
    { id: 'lofi-indie-pop', zh: 'Lo-Fi Indie Pop', prompt: 'lo-fi indie pop' },
    { id: 'dream-pop', zh: 'Dream Pop', prompt: 'dream pop' },
    { id: 'city-pop', zh: 'City Pop', prompt: 'city pop' },
    { id: 'neo-soul', zh: 'Neo Soul', prompt: 'neo soul' },
    { id: 'jazz-rap', zh: 'Jazz Rap', prompt: 'jazz rap' },
    { id: 'alternative-rnb', zh: 'Alternative R&B', prompt: 'alternative r&b' },
    { id: 'trip-hop', zh: 'Trip Hop', prompt: 'trip hop' },
    { id: 'downtempo', zh: 'Downtempo', prompt: 'downtempo' },
    { id: 'indie-folk', zh: 'Indie Folk', prompt: 'indie folk' },
    { id: 'ambient-pop', zh: 'Ambient Pop', prompt: 'ambient pop' },
    { id: 'bedroom-pop', zh: 'Bedroom Pop', prompt: 'bedroom pop' },
    { id: 'chillwave', zh: 'Chillwave', prompt: 'chillwave' },
  ],
  instruments: [
    { id: 'rhodes-stabs', zh: 'Rhodes 和弦點綴', prompt: 'Rhodes chord stabs' },
    { id: '808-sub-bass', zh: '808 Sub Bass', prompt: '808 sub-bass' },
    { id: 'deep-808-bass', zh: 'Deep 808 Bass', prompt: 'deep 808 bass' },
    { id: 'upright-bass', zh: '立式低音提琴', prompt: 'soft upright bass' },
    { id: 'brushed-snare', zh: '刷鈸軍鼓', prompt: 'brushed snare accents' },
    { id: 'rim-clicks', zh: 'Rim Clicks', prompt: 'brushed snare rim clicks' },
    { id: 'muted-electric-guitar', zh: '悶音電吉他', prompt: 'muted electric guitar' },
    { id: 'acoustic-guitar', zh: '節奏木吉他', prompt: 'muted rhythmic acoustic guitar' },
    { id: 'hammond-organ', zh: 'Hammond Organ Pad', prompt: 'Hammond organ pad' },
    { id: 'analog-keys', zh: 'Analog Keys', prompt: 'warm analog keys' },
    { id: 'tape-rhodes', zh: 'Tape Rhodes', prompt: 'tape-saturated Rhodes' },
    { id: 'melodica', zh: 'Melodica', prompt: 'distant melodica phrases' },
    { id: 'synth-pad', zh: 'Synth Pad', prompt: 'soft synth pad' },
    { id: 'plate-piano', zh: '柔和鋼琴', prompt: 'soft cinematic piano' },
    { id: 'electric-piano', zh: 'Electric Piano', prompt: 'electric piano comping' },
    { id: 'vinyl-keys', zh: '黑膠質感鍵盤', prompt: 'dusty vintage keys' },
  ],
  bpm: [
    { id: '40-60', zh: '40~60 BPM', prompt: '40-60 BPM' },
    { id: '50-70', zh: '50~70 BPM', prompt: '50-70 BPM' },
    { id: '50-80', zh: '50~80 BPM', prompt: '50-80 BPM' },
    { id: '60-90', zh: '60~90 BPM', prompt: '60-90 BPM' },
  ],
  groove: [
    { id: 'halftime-groove', zh: 'Halftime Groove', prompt: 'halftime groove' },
    { id: 'swung-backbeat', zh: 'Swung Backbeat', prompt: 'swung backbeat' },
    { id: 'laidback-groove', zh: 'Laid-Back Groove', prompt: 'laid-back groove' },
    { id: 'steady-straight', zh: 'Steady Straight Beat', prompt: 'steady straight beat' },
    { id: 'broken-beat', zh: 'Broken Beat Sway', prompt: 'broken beat sway' },
    { id: 'head-nod-pocket', zh: 'Head-Nod Pocket', prompt: 'gentle head-nod pocket' },
    { id: 'night-drive-pulse', zh: 'Night Drive Pulse', prompt: 'pulse-driven nocturnal groove' },
    { id: 'slow-rolling', zh: 'Slow Rolling Groove', prompt: 'slow rolling groove' },
  ],
  vocals: [
    { id: 'intimate-female', zh: '親密女聲', prompt: 'intimate female vocals' },
    { id: 'airy-female', zh: '空氣感女聲', prompt: 'airy female vocals' },
    { id: 'breathy-soft', zh: '輕柔氣聲', prompt: 'soft breathy vocals' },
    { id: 'close-mic', zh: 'Close-Mic Vocal', prompt: 'close-mic vocal' },
    { id: 'japanese-hooks', zh: '日文 Hook Lines', prompt: 'Japanese hook lines' },
    { id: 'restrained-delivery', zh: '克制情緒唱法', prompt: 'restrained emotional delivery' },
    { id: 'layered-backing', zh: 'Layered Backing Vocals', prompt: 'layered backing vocals' },
    { id: 'whispery-tone', zh: '耳語感音色', prompt: 'whispery vocal tone' },
    { id: 'mellow-male', zh: '溫柔男聲', prompt: 'mellow male vocals' },
    { id: 'low-register-female', zh: '低聲線女聲', prompt: 'low-register female vocals' },
  ],
  textures: [
    { id: 'plate-reverb', zh: 'Plate Reverb', prompt: 'cinematic plate reverb' },
    { id: 'spring-reverb', zh: 'Spring Reverb', prompt: 'spring reverb' },
    { id: 'tape-saturation', zh: 'Tape Saturation', prompt: 'tape saturation' },
    { id: 'vinyl-crackle', zh: 'Vinyl Crackle', prompt: 'vinyl crackle' },
    { id: 'analog-warmth', zh: 'Analog Warmth', prompt: 'analog warmth' },
    { id: 'mono-close-drums', zh: 'Mono-Close Drums', prompt: 'mono-close drums' },
    { id: 'sidechain-pumping', zh: 'Sidechain Pumping', prompt: 'sidechain pumping' },
    { id: 'tokyo-night-drive', zh: 'Tokyo Night Drive', prompt: 'Tokyo night drive' },
    { id: 'rainy-night-melancholy', zh: 'Rainy-Night Melancholy', prompt: 'rainy-night melancholy' },
    { id: 'bittersweet-devotion', zh: 'Bittersweet Devotion', prompt: 'bittersweet devotion' },
    { id: 'reflective-drift', zh: 'Reflective Drift', prompt: 'reflective drift' },
    { id: 'late-night-tenderness', zh: 'Late-Night Tenderness', prompt: 'late-night tenderness' },
    { id: 'majestic-sunrise', zh: 'Majestic Sunrise Atmosphere', prompt: 'majestic sunrise atmosphere' },
    { id: 'wet-pavement-foley', zh: 'Wet Pavement Foley', prompt: 'wet pavement foley' },
    { id: 'epic-finale', zh: 'Epic Finale', prompt: 'epic finale' },
    { id: 'dusky-neon-glow', zh: 'Dusky Neon Glow', prompt: 'dusky neon glow' },
  ],
};

export const SUNO_FIELD_CONFIG = [
  { key: 'genres', label: '音樂風格', type: 'multi', limit: SUNO_LIMITS.genres },
  { key: 'instruments', label: '主要樂器', type: 'multi', limit: SUNO_LIMITS.instruments },
  { key: 'bpm', label: '節奏速度', type: 'single' },
  { key: 'groove', label: '律動', type: 'single' },
  { key: 'vocals', label: '人聲特色', type: 'multi', limit: SUNO_LIMITS.vocals },
  { key: 'textures', label: '質感氛圍', type: 'multi', limit: SUNO_LIMITS.textures },
];

const MULTI_KEYS = new Set(SUNO_FIELD_CONFIG.filter((field) => field.type === 'multi').map((field) => field.key));

export function createEmptySunoProfile() {
  return {
    genres: [],
    instruments: [],
    bpm: '',
    groove: '',
    vocals: [],
    textures: [],
  };
}

function getOptionMap(key) {
  return new Map(SUNO_OPTIONS[key].map((option) => [option.id, option]));
}

function coerceMultiValue(key, value) {
  const optionMap = getOptionMap(key);
  const limit = SUNO_FIELD_CONFIG.find((field) => field.key === key)?.limit || 99;
  return unique(Array.isArray(value) ? value : [])
    .filter((id) => optionMap.has(id))
    .slice(0, limit);
}

function coerceSingleValue(key, value) {
  const optionMap = getOptionMap(key);
  return optionMap.has(value) ? value : '';
}

export function coerceSunoProfile(profile) {
  const source = profile && typeof profile === 'object' ? profile : {};

  return {
    genres: coerceMultiValue('genres', source.genres),
    instruments: coerceMultiValue('instruments', source.instruments),
    bpm: coerceSingleValue('bpm', source.bpm),
    groove: coerceSingleValue('groove', source.groove),
    vocals: coerceMultiValue('vocals', source.vocals),
    textures: coerceMultiValue('textures', source.textures),
  };
}

function resolveMultiPrompts(key, ids) {
  const optionMap = getOptionMap(key);
  return ids.map((id) => optionMap.get(id)).filter(Boolean);
}

function resolveSinglePrompt(key, id) {
  return getOptionMap(key).get(id) || null;
}

export function buildSunoSummary(profile) {
  const normalized = coerceSunoProfile(profile);
  const genres = resolveMultiPrompts('genres', normalized.genres).map((item) => item.zh).join(' / ') || '未指定';
  const instruments = resolveMultiPrompts('instruments', normalized.instruments).map((item) => item.zh).join(' / ') || '未指定';
  const bpm = resolveSinglePrompt('bpm', normalized.bpm)?.zh || '未指定';
  const groove = resolveSinglePrompt('groove', normalized.groove)?.zh || '未指定';
  const vocals = resolveMultiPrompts('vocals', normalized.vocals).map((item) => item.zh).join(' / ') || '未指定';
  const textures = resolveMultiPrompts('textures', normalized.textures).map((item) => item.zh).join(' / ') || '未指定';

  return `風格：${genres}｜樂器：${instruments}｜BPM：${bpm}｜律動：${groove}｜人聲：${vocals}｜質感：${textures}`;
}

function joinPromptParts(parts) {
  return parts.filter(Boolean).join(', ');
}

export function buildSunoStylesPrompt(profile) {
  const normalized = coerceSunoProfile(profile);
  return joinPromptParts([
    ...resolveMultiPrompts('genres', normalized.genres).map((item) => item.prompt),
    resolveSinglePrompt('bpm', normalized.bpm)?.prompt,
    resolveSinglePrompt('groove', normalized.groove)?.prompt,
    ...resolveMultiPrompts('instruments', normalized.instruments).map((item) => item.prompt),
    ...resolveMultiPrompts('vocals', normalized.vocals).map((item) => item.prompt),
    ...resolveMultiPrompts('textures', normalized.textures).map((item) => item.prompt),
  ]);
}

export function buildSunoCompactPrompt(profile) {
  const normalized = coerceSunoProfile(profile);
  return joinPromptParts([
    ...resolveMultiPrompts('genres', normalized.genres).slice(0, 3).map((item) => item.prompt),
    resolveSinglePrompt('bpm', normalized.bpm)?.prompt,
    ...resolveMultiPrompts('instruments', normalized.instruments).slice(0, 3).map((item) => item.prompt),
    ...resolveMultiPrompts('vocals', normalized.vocals).slice(0, 2).map((item) => item.prompt),
    ...resolveMultiPrompts('textures', normalized.textures).slice(0, 2).map((item) => item.prompt),
  ]);
}

export function buildSunoMoodPrompt(profile) {
  const normalized = coerceSunoProfile(profile);
  return joinPromptParts([
    ...resolveMultiPrompts('genres', normalized.genres).slice(0, 3).map((item) => item.prompt),
    resolveSinglePrompt('bpm', normalized.bpm)?.prompt,
    resolveSinglePrompt('groove', normalized.groove)?.prompt,
    ...resolveMultiPrompts('textures', normalized.textures).map((item) => item.prompt),
    ...resolveMultiPrompts('vocals', normalized.vocals).slice(0, 2).map((item) => item.prompt),
  ]);
}

export function buildRandomSunoProfile() {
  return {
    genres: sampleMany(SUNO_OPTIONS.genres.map((item) => item.id), sample([2, 3, 4])).slice(0, SUNO_LIMITS.genres),
    instruments: sampleMany(SUNO_OPTIONS.instruments.map((item) => item.id), sample([2, 3, 4])).slice(0, SUNO_LIMITS.instruments),
    bpm: sample(SUNO_OPTIONS.bpm).id,
    groove: sample(SUNO_OPTIONS.groove).id,
    vocals: sampleMany(SUNO_OPTIONS.vocals.map((item) => item.id), sample([1, 2])).slice(0, SUNO_LIMITS.vocals),
    textures: sampleMany(SUNO_OPTIONS.textures.map((item) => item.id), sample([2, 3])).slice(0, SUNO_LIMITS.textures),
  };
}

export function buildSunoStructured(profile) {
  const normalized = coerceSunoProfile(profile);
  return {
    'Music Genres': resolveMultiPrompts('genres', normalized.genres).map((item) => ({ zh: item.zh, en: item.prompt })),
    'Main Instruments': resolveMultiPrompts('instruments', normalized.instruments).map((item) => ({ zh: item.zh, en: item.prompt })),
    'Tempo Range': [resolveSinglePrompt('bpm', normalized.bpm)].filter(Boolean).map((item) => ({ zh: item.zh, en: item.prompt })),
    Groove: [resolveSinglePrompt('groove', normalized.groove)].filter(Boolean).map((item) => ({ zh: item.zh, en: item.prompt })),
    Vocals: resolveMultiPrompts('vocals', normalized.vocals).map((item) => ({ zh: item.zh, en: item.prompt })),
    'Texture & Mood': resolveMultiPrompts('textures', normalized.textures).map((item) => ({ zh: item.zh, en: item.prompt })),
  };
}

export function buildSunoSavedCard(profile) {
  const normalized = coerceSunoProfile(profile);
  const summary = buildSunoSummary(normalized);
  const stylesPrompt = buildSunoStylesPrompt(normalized);
  const compactPrompt = buildSunoCompactPrompt(normalized);
  const moodPrompt = buildSunoMoodPrompt(normalized);

  return {
    id: `page5-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: 'page5',
    sourceLabel: 'SUNO',
    date: new Date().toISOString(),
    summary: `SUNO｜${summary}`,
    summaryFields: {
      characterDna: resolveMultiPrompts('genres', normalized.genres).map((item) => item.zh).join(' / ') || '-',
      expressionPose: `${resolveSinglePrompt('bpm', normalized.bpm)?.zh || '-'} / ${resolveSinglePrompt('groove', normalized.groove)?.zh || '-'}`,
      wardrobe: resolveMultiPrompts('instruments', normalized.instruments).map((item) => item.zh).join(' / ') || '-',
      sceneLook: resolveMultiPrompts('textures', normalized.textures).map((item) => item.zh).join(' / ') || '-',
    },
    midjourneyPrompt: stylesPrompt,
    grokPrompt: compactPrompt,
    zImagePrompt: moodPrompt,
    promptLabels: {
      midjourney: 'Styles Prompt',
      grok: 'Compact Prompt',
      zImage: 'Mood Prompt',
    },
    selection: null,
    structured: buildSunoStructured(normalized),
    profile: normalized,
  };
}

export function getSunoFieldOptions(key) {
  return SUNO_OPTIONS[key] || [];
}

export function isSunoMultiField(key) {
  return MULTI_KEYS.has(key);
}
