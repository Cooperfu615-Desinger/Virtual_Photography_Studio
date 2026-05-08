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
    { id: 'soft-rock', zh: '柔和搖滾', prompt: 'soft rock' },
    { id: 'acid-jazz', zh: '迷幻爵士', prompt: 'acid jazz' },
    { id: 'hip-hop-soul', zh: '嘻哈靈魂樂', prompt: 'hip hop soul' },
    { id: 'britpop', zh: '英倫流行搖滾', prompt: 'britpop' },
    { id: 'lofi-indie-pop', zh: '低傳真獨立流行', prompt: 'lo-fi indie pop' },
    { id: 'dream-pop', zh: '夢幻流行', prompt: 'dream pop' },
    { id: 'city-pop', zh: '都會流行', prompt: 'city pop' },
    { id: 'neo-soul', zh: '新靈魂樂', prompt: 'neo soul' },
    { id: 'jazz-rap', zh: '爵士饒舌', prompt: 'jazz rap' },
    { id: 'alternative-rnb', zh: '另類節奏藍調', prompt: 'alternative r&b' },
    { id: 'trip-hop', zh: '迷幻嘻哈', prompt: 'trip hop' },
    { id: 'downtempo', zh: '慢速電子', prompt: 'downtempo' },
    { id: 'indie-folk', zh: '獨立民謠', prompt: 'indie folk' },
    { id: 'ambient-pop', zh: '氛圍流行', prompt: 'ambient pop' },
    { id: 'bedroom-pop', zh: '臥室流行', prompt: 'bedroom pop' },
    { id: 'chillwave', zh: '冷波電子', prompt: 'chillwave' },
  ],
  instruments: [
    { id: 'rhodes-stabs', zh: '電鋼琴和弦點綴', prompt: 'Rhodes chord stabs' },
    { id: '808-sub-bass', zh: '808 次低音', prompt: '808 sub-bass' },
    { id: 'deep-808-bass', zh: '深沉 808 低音', prompt: 'deep 808 bass' },
    { id: 'upright-bass', zh: '立式低音提琴', prompt: 'soft upright bass' },
    { id: 'brushed-snare', zh: '刷鈸軍鼓', prompt: 'brushed snare accents' },
    { id: 'rim-clicks', zh: '鼓框敲擊', prompt: 'brushed snare rim clicks' },
    { id: 'muted-electric-guitar', zh: '悶音電吉他', prompt: 'muted electric guitar' },
    { id: 'acoustic-guitar', zh: '節奏木吉他', prompt: 'muted rhythmic acoustic guitar' },
    { id: 'hammond-organ', zh: '哈蒙德風琴鋪底', prompt: 'Hammond organ pad' },
    { id: 'analog-keys', zh: '類比鍵盤', prompt: 'warm analog keys' },
    { id: 'tape-rhodes', zh: '磁帶感電鋼琴', prompt: 'tape-saturated Rhodes' },
    { id: 'melodica', zh: '口風琴', prompt: 'distant melodica phrases' },
    { id: 'synth-pad', zh: '合成器鋪底', prompt: 'soft synth pad' },
    { id: 'plate-piano', zh: '柔和鋼琴', prompt: 'soft cinematic piano' },
    { id: 'electric-piano', zh: '電鋼琴伴奏', prompt: 'electric piano comping' },
    { id: 'vinyl-keys', zh: '黑膠質感鍵盤', prompt: 'dusty vintage keys' },
  ],
  bpm: [
    { id: '40-60', zh: '40~60 BPM', prompt: '40-60 BPM' },
    { id: '50-70', zh: '50~70 BPM', prompt: '50-70 BPM' },
    { id: '50-80', zh: '50~80 BPM', prompt: '50-80 BPM' },
    { id: '60-90', zh: '60~90 BPM', prompt: '60-90 BPM' },
  ],
  groove: [
    { id: 'halftime-groove', zh: '半拍律動', prompt: 'halftime groove' },
    { id: 'swung-backbeat', zh: '搖擺反拍', prompt: 'swung backbeat' },
    { id: 'laidback-groove', zh: '慵懶律動', prompt: 'laid-back groove' },
    { id: 'steady-straight', zh: '穩定直拍', prompt: 'steady straight beat' },
    { id: 'broken-beat', zh: '碎拍搖擺', prompt: 'broken beat sway' },
    { id: 'head-nod-pocket', zh: '點頭節拍口袋', prompt: 'gentle head-nod pocket' },
    { id: 'night-drive-pulse', zh: '夜間駕車脈衝', prompt: 'pulse-driven nocturnal groove' },
    { id: 'slow-rolling', zh: '緩慢滾動律動', prompt: 'slow rolling groove' },
  ],
  vocals: [
    { id: 'intimate-female', zh: '親密女聲', prompt: 'intimate female vocals' },
    { id: 'airy-female', zh: '空氣感女聲', prompt: 'airy female vocals' },
    { id: 'breathy-soft', zh: '輕柔氣聲', prompt: 'soft breathy vocals' },
    { id: 'close-mic', zh: '近距離收音人聲', prompt: 'close-mic vocal' },
    { id: 'japanese-hooks', zh: '日文副歌旋律句', prompt: 'Japanese hook lines' },
    { id: 'restrained-delivery', zh: '克制情緒唱法', prompt: 'restrained emotional delivery' },
    { id: 'layered-backing', zh: '多層和聲', prompt: 'layered backing vocals' },
    { id: 'whispery-tone', zh: '耳語感音色', prompt: 'whispery vocal tone' },
    { id: 'mellow-male', zh: '溫柔男聲', prompt: 'mellow male vocals' },
    { id: 'low-register-female', zh: '低聲線女聲', prompt: 'low-register female vocals' },
  ],
  textures: [
    { id: 'plate-reverb', zh: '板式殘響', prompt: 'cinematic plate reverb' },
    { id: 'spring-reverb', zh: '彈簧殘響', prompt: 'spring reverb' },
    { id: 'tape-saturation', zh: '磁帶飽和', prompt: 'tape saturation' },
    { id: 'vinyl-crackle', zh: '黑膠雜訊', prompt: 'vinyl crackle' },
    { id: 'analog-warmth', zh: '類比暖度', prompt: 'analog warmth' },
    { id: 'mono-close-drums', zh: '單聲道近距鼓組', prompt: 'mono-close drums' },
    { id: 'sidechain-pumping', zh: '側鏈起伏', prompt: 'sidechain pumping' },
    { id: 'tokyo-night-drive', zh: '東京夜間駕車感', prompt: 'Tokyo night drive' },
    { id: 'rainy-night-melancholy', zh: '雨夜憂鬱感', prompt: 'rainy-night melancholy' },
    { id: 'bittersweet-devotion', zh: '苦甜深情感', prompt: 'bittersweet devotion' },
    { id: 'reflective-drift', zh: '沉思漂浮感', prompt: 'reflective drift' },
    { id: 'late-night-tenderness', zh: '深夜溫柔感', prompt: 'late-night tenderness' },
    { id: 'majestic-sunrise', zh: '壯闊日出氛圍', prompt: 'majestic sunrise atmosphere' },
    { id: 'wet-pavement-foley', zh: '濕地面環境聲', prompt: 'wet pavement foley' },
    { id: 'epic-finale', zh: '史詩收尾感', prompt: 'epic finale' },
    { id: 'dusky-neon-glow', zh: '暮色霓虹光感', prompt: 'dusky neon glow' },
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
    grokPrompt: '',
    zImagePrompt: '',
    promptLabels: {
      midjourney: 'Styles Prompt',
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
