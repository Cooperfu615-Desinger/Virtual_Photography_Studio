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
  genres: 4,
  subgenres: 3,
  moods: 4,
  sceneMoods: 3,
  vocals: 3,
  instruments: 5,
  textures: 4,
  structure: 4,
  lyricThemes: 3,
  avoid: 5,
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
    { id: 'synth-pop', zh: '合成器流行', prompt: 'synth pop' },
    { id: 'electropop', zh: '電子流行', prompt: 'electropop' },
    { id: 'future-bass-pop', zh: '未來貝斯流行', prompt: 'future bass pop' },
    { id: 'cinematic-pop', zh: '電影感流行', prompt: 'cinematic pop' },
    { id: 'ambient-electronic', zh: '氛圍電子', prompt: 'ambient electronic' },
    { id: 'modern-ballad', zh: '現代抒情', prompt: 'modern ballad' },
  ],
  subgenres: [
    { id: 'nocturnal-rnb', zh: '夜色 R&B', prompt: 'nocturnal R&B' },
    { id: 'japanese-city-pop', zh: '日系 City Pop', prompt: 'Japanese city pop' },
    { id: 'korean-indie', zh: '韓系獨立感', prompt: 'Korean indie pop sensibility' },
    { id: 'uk-garage-pop', zh: 'UK Garage 流行', prompt: 'UK garage pop rhythm' },
    { id: 'trap-soul', zh: 'Trap Soul', prompt: 'trap soul' },
    { id: 'shoegaze-pop', zh: 'Shoegaze Pop', prompt: 'shoegaze pop haze' },
    { id: 'alt-pop-hook', zh: '另類流行 Hook', prompt: 'alternative pop hook writing' },
    { id: 'soulful-house', zh: '靈魂浩室', prompt: 'soulful house' },
    { id: 'piano-ballad', zh: '鋼琴抒情', prompt: 'piano ballad core' },
    { id: 'orchestral-pop', zh: '管弦流行', prompt: 'orchestral pop arrangement' },
  ],
  era: [
    { id: 'none', zh: '未指定', prompt: '' },
    { id: '70s', zh: '70s 復古', prompt: '1970s warmth' },
    { id: '80s', zh: '80s 合成器感', prompt: '1980s synth sheen' },
    { id: '90s', zh: '90s 類比感', prompt: '1990s analog character' },
    { id: 'y2k', zh: 'Y2K 數位感', prompt: 'Y2K digital pop color' },
    { id: 'modern', zh: '現代製作', prompt: 'modern production' },
    { id: 'future', zh: '近未來感', prompt: 'near-future pop production' },
  ],
  density: [
    { id: 'none', zh: '未指定', prompt: '' },
    { id: 'minimal', zh: '極簡編曲', prompt: 'minimal arrangement' },
    { id: 'balanced', zh: '平衡編曲', prompt: 'balanced arrangement' },
    { id: 'rich', zh: '豐富編曲', prompt: 'rich layered arrangement' },
    { id: 'cinematic', zh: '電影式堆疊', prompt: 'cinematic arrangement build' },
  ],
  moods: [
    { id: 'romantic', zh: '浪漫', prompt: 'romantic' },
    { id: 'lonely', zh: '孤獨', prompt: 'lonely' },
    { id: 'dreamy', zh: '夢幻', prompt: 'dreamy' },
    { id: 'melancholic', zh: '憂鬱', prompt: 'melancholic' },
    { id: 'bittersweet', zh: '苦甜', prompt: 'bittersweet' },
    { id: 'nostalgic', zh: '懷舊', prompt: 'nostalgic' },
    { id: 'rebellious', zh: '反叛', prompt: 'rebellious' },
    { id: 'uplifting', zh: '振奮', prompt: 'uplifting' },
    { id: 'dark', zh: '暗黑', prompt: 'dark' },
    { id: 'lazy', zh: '慵懶', prompt: 'lazy' },
    { id: 'hopeful', zh: '帶希望感', prompt: 'hopeful' },
    { id: 'sensual', zh: '感性', prompt: 'sensual' },
  ],
  sceneMoods: [
    { id: 'night-city', zh: '夜晚城市', prompt: 'night city atmosphere' },
    { id: 'rainy-street', zh: '雨天街道', prompt: 'rainy street mood' },
    { id: 'seaside', zh: '海邊', prompt: 'seaside air' },
    { id: 'highway', zh: '公路', prompt: 'late highway drive' },
    { id: 'underground-club', zh: '地下俱樂部', prompt: 'underground club room' },
    { id: 'bedroom-diary', zh: '臥室日記感', prompt: 'bedroom diary intimacy' },
    { id: 'empty-station', zh: '空車站', prompt: 'empty station ambience' },
    { id: 'sunrise', zh: '清晨日出', prompt: 'soft sunrise atmosphere' },
  ],
  energy: [
    { id: 'none', zh: '未指定', prompt: '' },
    { id: 'low', zh: '低能量', prompt: 'low energy' },
    { id: 'medium', zh: '中等能量', prompt: 'medium energy' },
    { id: 'high', zh: '高能量', prompt: 'high energy' },
    { id: 'explosive', zh: '爆發感', prompt: 'explosive chorus energy' },
  ],
  bpm: [
    { id: '40-60', zh: '40~60 BPM', prompt: '40-60 BPM' },
    { id: '50-70', zh: '50~70 BPM', prompt: '50-70 BPM' },
    { id: '60-90', zh: '60~90 BPM', prompt: '60-90 BPM' },
    { id: '85-105', zh: '85~105 BPM', prompt: '85-105 BPM' },
    { id: '100-125', zh: '100~125 BPM', prompt: '100-125 BPM' },
    { id: '120-140', zh: '120~140 BPM', prompt: '120-140 BPM' },
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
    { id: 'four-on-floor', zh: '四拍舞曲推進', prompt: 'four-on-the-floor pulse' },
    { id: 'syncopated-pop', zh: '切分流行律動', prompt: 'syncopated pop groove' },
  ],
  vocalType: [
    { id: 'none', zh: '未指定', prompt: '' },
    { id: 'instrumental', zh: '無人聲', prompt: 'instrumental, no lead vocal' },
    { id: 'female', zh: '女聲', prompt: 'female lead vocal' },
    { id: 'male', zh: '男聲', prompt: 'male lead vocal' },
    { id: 'duet', zh: '男女對唱', prompt: 'male and female duet vocals' },
    { id: 'choir', zh: '合唱', prompt: 'choir-like ensemble vocals' },
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
    { id: 'raspy', zh: '微沙啞', prompt: 'slightly raspy vocal tone' },
    { id: 'powerful', zh: '力量型', prompt: 'powerful vocal delivery' },
    { id: 'rnb-runs', zh: 'R&B 轉音', prompt: 'tasteful R&B vocal runs' },
  ],
  language: [
    { id: 'none', zh: '未指定', prompt: '' },
    { id: 'english', zh: '英文', prompt: 'English lyrics' },
    { id: 'japanese', zh: '日文', prompt: 'Japanese lyrics' },
    { id: 'korean', zh: '韓文', prompt: 'Korean lyrics' },
    { id: 'mandarin', zh: '中文', prompt: 'Mandarin Chinese lyrics' },
    { id: 'mixed', zh: '混合語言', prompt: 'mixed-language lyrics' },
  ],
  vocalSpace: [
    { id: 'none', zh: '未指定', prompt: '' },
    { id: 'intimate', zh: '貼耳近距離', prompt: 'intimate close vocal space' },
    { id: 'studio', zh: '乾淨錄音室', prompt: 'clean studio vocal space' },
    { id: 'arena', zh: '大型場館', prompt: 'wide arena vocal space' },
    { id: 'lofi-distant', zh: 'Lo-fi 遠距', prompt: 'lo-fi distant vocal space' },
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
    { id: 'string-section', zh: '弦樂群', prompt: 'warm string section' },
    { id: 'arpeggio-synth', zh: '琶音合成器', prompt: 'arpeggiated synthesizer' },
    { id: 'slap-bass', zh: 'Slap Bass', prompt: 'slap bass accents' },
  ],
  drumStyle: [
    { id: 'none', zh: '未指定', prompt: '' },
    { id: 'trap', zh: 'Trap 鼓組', prompt: 'trap drums' },
    { id: 'boom-bap', zh: 'Boom Bap', prompt: 'boom bap drums' },
    { id: 'four-on-floor', zh: 'Four-on-the-floor', prompt: 'four-on-the-floor drums' },
    { id: 'breakbeat', zh: 'Breakbeat', prompt: 'breakbeat drums' },
    { id: 'live-kit', zh: '現場鼓組', prompt: 'live drum kit' },
    { id: 'drum-machine', zh: '鼓機', prompt: 'vintage drum machine' },
  ],
  textures: [
    { id: 'plate-reverb', zh: '板式殘響', prompt: 'cinematic plate reverb' },
    { id: 'spring-reverb', zh: '彈簧殘響', prompt: 'spring reverb' },
    { id: 'tape-saturation', zh: '磁帶飽和', prompt: 'tape saturation' },
    { id: 'vinyl-crackle', zh: '黑膠雜訊', prompt: 'vinyl crackle' },
    { id: 'analog-warmth', zh: '類比暖度', prompt: 'analog warmth' },
    { id: 'mono-close-drums', zh: '單聲道近距鼓組', prompt: 'mono-close drums' },
    { id: 'sidechain-pumping', zh: '側鏈起伏', prompt: 'sidechain pumping' },
    { id: 'wet-pavement-foley', zh: '濕地面環境聲', prompt: 'wet pavement foley' },
    { id: 'glossy-pop', zh: '亮面流行製作', prompt: 'glossy pop polish' },
    { id: 'distorted-edge', zh: '失真邊緣', prompt: 'subtle distorted edge' },
    { id: 'wide-stereo', zh: '寬廣立體聲', prompt: 'wide stereo image' },
    { id: 'lofi-grain', zh: 'Lo-fi 顆粒', prompt: 'lo-fi grain' },
  ],
  reverbSpace: [
    { id: 'none', zh: '未指定', prompt: '' },
    { id: 'dry', zh: '乾聲近距', prompt: 'dry intimate mix' },
    { id: 'room', zh: 'Room 空間', prompt: 'small room ambience' },
    { id: 'hall', zh: 'Hall 殘響', prompt: 'hall reverb space' },
    { id: 'cathedral', zh: '教堂殘響', prompt: 'cathedral reverb tail' },
    { id: 'wide-stereo', zh: '寬立體聲場', prompt: 'wide stereo space' },
  ],
  structure: [
    { id: 'short-intro', zh: '短 Intro', prompt: 'short intro' },
    { id: 'clear-verse', zh: '清楚主歌', prompt: 'clear verse sections' },
    { id: 'big-chorus', zh: '明顯副歌', prompt: 'big memorable chorus' },
    { id: 'bridge', zh: 'Bridge 橋段', prompt: 'emotional bridge' },
    { id: 'drop', zh: 'Drop 段落', prompt: 'controlled drop section' },
    { id: 'breakdown', zh: 'Breakdown', prompt: 'breakdown section' },
    { id: 'solo', zh: 'Solo 段落', prompt: 'instrumental solo moment' },
    { id: 'fade-out', zh: '淡出尾奏', prompt: 'fade-out outro' },
  ],
  hookStyle: [
    { id: 'none', zh: '未指定', prompt: '' },
    { id: 'subtle', zh: '細緻 Hook', prompt: 'subtle hook' },
    { id: 'catchy', zh: '洗腦 Hook', prompt: 'catchy hook' },
    { id: 'anthemic', zh: '副歌口號感', prompt: 'anthemic chorus hook' },
    { id: 'melodic', zh: '旋律型 Hook', prompt: 'melodic hook line' },
  ],
  length: [
    { id: 'none', zh: '未指定', prompt: '' },
    { id: 'short', zh: '短歌', prompt: 'short song form' },
    { id: 'single', zh: '標準單曲', prompt: 'standard single length' },
    { id: 'extended', zh: '延展版', prompt: 'extended arrangement' },
  ],
  lyricThemes: [
    { id: 'love', zh: '愛情', prompt: 'love and longing' },
    { id: 'loss', zh: '失落', prompt: 'loss and emotional distance' },
    { id: 'journey', zh: '旅程', prompt: 'a journey through change' },
    { id: 'rebellion', zh: '反叛', prompt: 'quiet rebellion' },
    { id: 'future', zh: '未來', prompt: 'future memories' },
    { id: 'dream', zh: '夢境', prompt: 'dreamlike scenes' },
    { id: 'self-healing', zh: '自我修復', prompt: 'self-healing' },
    { id: 'city-night', zh: '城市夜晚', prompt: 'city night loneliness' },
  ],
  lyricPerspective: [
    { id: 'none', zh: '未指定', prompt: '' },
    { id: 'first-person', zh: '第一人稱', prompt: 'first-person lyrics' },
    { id: 'second-person', zh: '第二人稱', prompt: 'second-person address' },
    { id: 'observer', zh: '旁觀者', prompt: 'observer-like narrative' },
  ],
  lyricDensity: [
    { id: 'none', zh: '未指定', prompt: '' },
    { id: 'sparse', zh: '少量歌詞', prompt: 'sparse lyrics' },
    { id: 'balanced', zh: '正常歌詞量', prompt: 'balanced lyric density' },
    { id: 'dense', zh: '密集歌詞', prompt: 'dense lyrical phrasing' },
  ],
  repetition: [
    { id: 'none', zh: '未指定', prompt: '' },
    { id: 'low', zh: '低重複', prompt: 'low repetition' },
    { id: 'medium', zh: '中等 Hook 重複', prompt: 'medium hook repetition' },
    { id: 'high', zh: '高 Hook 重複', prompt: 'high hook repetition' },
  ],
  avoid: [
    { id: 'spoken-word', zh: '避免口白', prompt: 'spoken word' },
    { id: 'rap', zh: '避免饒舌', prompt: 'rap verses' },
    { id: 'edm-drop', zh: '避免 EDM Drop', prompt: 'EDM drop' },
    { id: 'heavy-autotune', zh: '避免重 Auto-Tune', prompt: 'heavy autotune' },
    { id: 'nursery', zh: '避免兒歌感', prompt: 'nursery rhyme feel' },
    { id: 'too-happy', zh: '避免太歡樂', prompt: 'overly cheerful mood' },
    { id: 'too-dark', zh: '避免太黑暗', prompt: 'overly dark atmosphere' },
    { id: 'metal', zh: '避免金屬樂', prompt: 'metal guitars' },
    { id: 'opera', zh: '避免歌劇唱腔', prompt: 'opera vocals' },
  ],
};

export const SUNO_FIELD_CONFIG = [
  { key: 'genres', label: '曲風', type: 'multi', limit: SUNO_LIMITS.genres, section: 'base' },
  { key: 'subgenres', label: '子類型', type: 'multi', limit: SUNO_LIMITS.subgenres, section: 'base' },
  { key: 'era', label: '年代感', type: 'single', section: 'base' },
  { key: 'density', label: '編曲密度', type: 'single', section: 'base' },
  { key: 'moods', label: '情緒', type: 'multi', limit: SUNO_LIMITS.moods, section: 'mood' },
  { key: 'sceneMoods', label: '場景感', type: 'multi', limit: SUNO_LIMITS.sceneMoods, section: 'mood' },
  { key: 'energy', label: '能量', type: 'single', section: 'mood' },
  { key: 'bpm', label: '節奏速度', type: 'single', section: 'mood' },
  { key: 'groove', label: '律動', type: 'single', section: 'mood' },
  { key: 'vocalType', label: '人聲類型', type: 'single', section: 'vocal' },
  { key: 'vocals', label: '唱法與音色', type: 'multi', limit: SUNO_LIMITS.vocals, section: 'vocal' },
  { key: 'language', label: '語言', type: 'single', section: 'vocal' },
  { key: 'vocalSpace', label: '人聲距離', type: 'single', section: 'vocal' },
  { key: 'instruments', label: '主樂器', type: 'multi', limit: SUNO_LIMITS.instruments, section: 'sound' },
  { key: 'drumStyle', label: '鼓組風格', type: 'single', section: 'sound' },
  { key: 'textures', label: '聲音質感', type: 'multi', limit: SUNO_LIMITS.textures, section: 'sound' },
  { key: 'reverbSpace', label: '空間感', type: 'single', section: 'sound' },
  { key: 'structure', label: '歌曲結構', type: 'multi', limit: SUNO_LIMITS.structure, section: 'structure' },
  { key: 'hookStyle', label: 'Hook 方向', type: 'single', section: 'structure' },
  { key: 'length', label: '長度方向', type: 'single', section: 'structure' },
  { key: 'lyricThemes', label: '歌詞主題', type: 'multi', limit: SUNO_LIMITS.lyricThemes, section: 'lyrics' },
  { key: 'lyricPerspective', label: '敘事視角', type: 'single', section: 'lyrics' },
  { key: 'lyricDensity', label: '歌詞密度', type: 'single', section: 'lyrics' },
  { key: 'repetition', label: '重複性', type: 'single', section: 'lyrics' },
  { key: 'avoid', label: '避免項目', type: 'multi', limit: SUNO_LIMITS.avoid, section: 'avoid' },
];

export const SUNO_SECTION_CONFIG = [
  { id: 'base', label: '音樂基底', description: '先決定曲風、子類型、年代感與編曲密度。' },
  { id: 'mood', label: '情緒與氛圍', description: '補上情緒、場景感、能量、速度與律動。' },
  { id: 'vocal', label: '人聲設定', description: '設定人聲類型、唱法、語言與收音距離。' },
  { id: 'sound', label: '樂器與聲音設計', description: '指定主樂器、鼓組、聲音質感與空間感。' },
  { id: 'structure', label: '歌曲結構', description: '整理段落、Hook 與歌曲長度方向。' },
  { id: 'lyrics', label: '歌詞方向', description: '設定歌詞主題、敘事視角、密度與重複性。' },
  { id: 'avoid', label: '避免項目', description: '列出不希望 SUNO 往哪些方向生成。' },
];

const MULTI_KEYS = new Set(SUNO_FIELD_CONFIG.filter((field) => field.type === 'multi').map((field) => field.key));
const SINGLE_KEYS = SUNO_FIELD_CONFIG.filter((field) => field.type === 'single').map((field) => field.key);

export function createEmptySunoProfile() {
  return Object.fromEntries([
    ...Array.from(MULTI_KEYS).map((key) => [key, []]),
    ...SINGLE_KEYS.map((key) => [key, '']),
  ]);
}

function getOptionMap(key) {
  return new Map((SUNO_OPTIONS[key] || []).map((option) => [option.id, option]));
}

function getFieldConfig(key) {
  return SUNO_FIELD_CONFIG.find((field) => field.key === key);
}

function coerceMultiValue(key, value) {
  const optionMap = getOptionMap(key);
  const limit = getFieldConfig(key)?.limit || 99;
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
  const empty = createEmptySunoProfile();

  return {
    ...empty,
    genres: coerceMultiValue('genres', source.genres),
    subgenres: coerceMultiValue('subgenres', source.subgenres),
    era: coerceSingleValue('era', source.era),
    density: coerceSingleValue('density', source.density),
    moods: coerceMultiValue('moods', source.moods),
    sceneMoods: coerceMultiValue('sceneMoods', source.sceneMoods),
    energy: coerceSingleValue('energy', source.energy),
    bpm: coerceSingleValue('bpm', source.bpm),
    groove: coerceSingleValue('groove', source.groove),
    vocalType: coerceSingleValue('vocalType', source.vocalType),
    vocals: coerceMultiValue('vocals', source.vocals),
    language: coerceSingleValue('language', source.language),
    vocalSpace: coerceSingleValue('vocalSpace', source.vocalSpace),
    instruments: coerceMultiValue('instruments', source.instruments),
    drumStyle: coerceSingleValue('drumStyle', source.drumStyle),
    textures: coerceMultiValue('textures', source.textures),
    reverbSpace: coerceSingleValue('reverbSpace', source.reverbSpace),
    structure: coerceMultiValue('structure', source.structure),
    hookStyle: coerceSingleValue('hookStyle', source.hookStyle),
    length: coerceSingleValue('length', source.length),
    lyricThemes: coerceMultiValue('lyricThemes', source.lyricThemes),
    lyricPerspective: coerceSingleValue('lyricPerspective', source.lyricPerspective),
    lyricDensity: coerceSingleValue('lyricDensity', source.lyricDensity),
    repetition: coerceSingleValue('repetition', source.repetition),
    avoid: coerceMultiValue('avoid', source.avoid),
  };
}

function resolveMultiPrompts(key, ids) {
  const optionMap = getOptionMap(key);
  return ids.map((id) => optionMap.get(id)).filter(Boolean);
}

function resolveSinglePrompt(key, id) {
  const option = getOptionMap(key).get(id) || null;
  return option?.prompt ? option : null;
}

function joinPromptParts(parts) {
  return parts.filter(Boolean).join(', ');
}

function joinSentenceParts(parts) {
  return parts.filter(Boolean).join(', ');
}

function labels(key, normalized) {
  if (MULTI_KEYS.has(key)) {
    return resolveMultiPrompts(key, normalized[key]).map((item) => item.zh).join(' / ') || '未指定';
  }
  return resolveSinglePrompt(key, normalized[key])?.zh || '未指定';
}

export function buildSunoSummary(profile) {
  const normalized = coerceSunoProfile(profile);

  return [
    `曲風：${labels('genres', normalized)}`,
    `情緒：${labels('moods', normalized)}`,
    `人聲：${labels('vocalType', normalized)}`,
    `樂器：${labels('instruments', normalized)}`,
    `結構：${labels('structure', normalized)}`,
    `歌詞：${labels('lyricThemes', normalized)}`,
  ].join('｜');
}

export function buildSunoStylesPrompt(profile) {
  const normalized = coerceSunoProfile(profile);
  return joinPromptParts([
    ...resolveMultiPrompts('genres', normalized.genres).map((item) => item.prompt),
    ...resolveMultiPrompts('subgenres', normalized.subgenres).map((item) => item.prompt),
    resolveSinglePrompt('era', normalized.era)?.prompt,
    resolveSinglePrompt('density', normalized.density)?.prompt,
    ...resolveMultiPrompts('moods', normalized.moods).map((item) => item.prompt),
    ...resolveMultiPrompts('sceneMoods', normalized.sceneMoods).map((item) => item.prompt),
    resolveSinglePrompt('energy', normalized.energy)?.prompt,
    resolveSinglePrompt('bpm', normalized.bpm)?.prompt,
    resolveSinglePrompt('groove', normalized.groove)?.prompt,
    resolveSinglePrompt('vocalType', normalized.vocalType)?.prompt,
    ...resolveMultiPrompts('vocals', normalized.vocals).map((item) => item.prompt),
    resolveSinglePrompt('language', normalized.language)?.prompt,
    resolveSinglePrompt('vocalSpace', normalized.vocalSpace)?.prompt,
    ...resolveMultiPrompts('instruments', normalized.instruments).map((item) => item.prompt),
    resolveSinglePrompt('drumStyle', normalized.drumStyle)?.prompt,
    ...resolveMultiPrompts('textures', normalized.textures).map((item) => item.prompt),
    resolveSinglePrompt('reverbSpace', normalized.reverbSpace)?.prompt,
    ...resolveMultiPrompts('structure', normalized.structure).map((item) => item.prompt),
    resolveSinglePrompt('hookStyle', normalized.hookStyle)?.prompt,
    resolveSinglePrompt('length', normalized.length)?.prompt,
  ]);
}

export function buildSunoLyricsDirection(profile) {
  const normalized = coerceSunoProfile(profile);
  const lyricParts = joinSentenceParts([
    ...resolveMultiPrompts('lyricThemes', normalized.lyricThemes).map((item) => item.prompt),
    resolveSinglePrompt('lyricPerspective', normalized.lyricPerspective)?.prompt,
    resolveSinglePrompt('lyricDensity', normalized.lyricDensity)?.prompt,
    resolveSinglePrompt('repetition', normalized.repetition)?.prompt,
    resolveSinglePrompt('language', normalized.language)?.prompt,
    resolveSinglePrompt('hookStyle', normalized.hookStyle)?.prompt,
  ]);

  if (!lyricParts) return '';
  return `Write lyrics focused on ${lyricParts}. Keep the wording natural, singable, and emotionally specific.`;
}

export function buildSunoAvoidPrompt(profile) {
  const normalized = coerceSunoProfile(profile);
  const avoidParts = resolveMultiPrompts('avoid', normalized.avoid).map((item) => item.prompt);
  return avoidParts.length > 0 ? `Avoid ${avoidParts.join(', ')}.` : '';
}

export function buildSunoFullPrompt(profile) {
  const normalized = coerceSunoProfile(profile);
  const stylePrompt = buildSunoStylesPrompt(normalized);
  const lyricsDirection = buildSunoLyricsDirection(normalized);
  const avoidPrompt = buildSunoAvoidPrompt(normalized);
  const sections = [];

  if (stylePrompt) sections.push(`Create a song with ${stylePrompt}.`);
  if (lyricsDirection) sections.push(lyricsDirection);
  if (avoidPrompt) sections.push(avoidPrompt);

  return sections.join(' ');
}

export function buildSunoPromptBundle(profile) {
  const normalized = coerceSunoProfile(profile);
  return {
    stylePrompt: buildSunoStylesPrompt(normalized),
    lyricsDirection: buildSunoLyricsDirection(normalized),
    fullPrompt: buildSunoFullPrompt(normalized),
    avoidPrompt: buildSunoAvoidPrompt(normalized),
  };
}

export function buildRandomSunoProfile() {
  return {
    ...createEmptySunoProfile(),
    genres: sampleMany(SUNO_OPTIONS.genres.map((item) => item.id), sample([2, 3])).slice(0, SUNO_LIMITS.genres),
    subgenres: sampleMany(SUNO_OPTIONS.subgenres.map((item) => item.id), sample([1, 2])).slice(0, SUNO_LIMITS.subgenres),
    era: sample(SUNO_OPTIONS.era.filter((item) => item.id !== 'none')).id,
    density: sample(SUNO_OPTIONS.density.filter((item) => item.id !== 'none')).id,
    moods: sampleMany(SUNO_OPTIONS.moods.map((item) => item.id), sample([2, 3])).slice(0, SUNO_LIMITS.moods),
    sceneMoods: sampleMany(SUNO_OPTIONS.sceneMoods.map((item) => item.id), sample([1, 2])).slice(0, SUNO_LIMITS.sceneMoods),
    energy: sample(SUNO_OPTIONS.energy.filter((item) => item.id !== 'none')).id,
    bpm: sample(SUNO_OPTIONS.bpm).id,
    groove: sample(SUNO_OPTIONS.groove).id,
    vocalType: sample(SUNO_OPTIONS.vocalType.filter((item) => item.id !== 'none')).id,
    vocals: sampleMany(SUNO_OPTIONS.vocals.map((item) => item.id), sample([1, 2])).slice(0, SUNO_LIMITS.vocals),
    language: sample(SUNO_OPTIONS.language.filter((item) => item.id !== 'none')).id,
    vocalSpace: sample(SUNO_OPTIONS.vocalSpace.filter((item) => item.id !== 'none')).id,
    instruments: sampleMany(SUNO_OPTIONS.instruments.map((item) => item.id), sample([2, 3, 4])).slice(0, SUNO_LIMITS.instruments),
    drumStyle: sample(SUNO_OPTIONS.drumStyle.filter((item) => item.id !== 'none')).id,
    textures: sampleMany(SUNO_OPTIONS.textures.map((item) => item.id), sample([2, 3])).slice(0, SUNO_LIMITS.textures),
    reverbSpace: sample(SUNO_OPTIONS.reverbSpace.filter((item) => item.id !== 'none')).id,
    structure: sampleMany(SUNO_OPTIONS.structure.map((item) => item.id), sample([2, 3])).slice(0, SUNO_LIMITS.structure),
    hookStyle: sample(SUNO_OPTIONS.hookStyle.filter((item) => item.id !== 'none')).id,
    length: sample(SUNO_OPTIONS.length.filter((item) => item.id !== 'none')).id,
    lyricThemes: sampleMany(SUNO_OPTIONS.lyricThemes.map((item) => item.id), sample([1, 2])).slice(0, SUNO_LIMITS.lyricThemes),
    lyricPerspective: sample(SUNO_OPTIONS.lyricPerspective.filter((item) => item.id !== 'none')).id,
    lyricDensity: sample(SUNO_OPTIONS.lyricDensity.filter((item) => item.id !== 'none')).id,
    repetition: sample(SUNO_OPTIONS.repetition.filter((item) => item.id !== 'none')).id,
    avoid: sampleMany(SUNO_OPTIONS.avoid.map((item) => item.id), sample([2, 3])).slice(0, SUNO_LIMITS.avoid),
  };
}

export function buildSunoStructured(profile) {
  const normalized = coerceSunoProfile(profile);
  const resolve = (key) => MULTI_KEYS.has(key)
    ? resolveMultiPrompts(key, normalized[key]).map((item) => ({ zh: item.zh, en: item.prompt }))
    : [resolveSinglePrompt(key, normalized[key])].filter(Boolean).map((item) => ({ zh: item.zh, en: item.prompt }));

  return {
    'Music Base': [...resolve('genres'), ...resolve('subgenres'), ...resolve('era'), ...resolve('density')],
    'Mood & Atmosphere': [...resolve('moods'), ...resolve('sceneMoods'), ...resolve('energy'), ...resolve('bpm'), ...resolve('groove')],
    Vocals: [...resolve('vocalType'), ...resolve('vocals'), ...resolve('language'), ...resolve('vocalSpace')],
    'Instruments & Sound Design': [...resolve('instruments'), ...resolve('drumStyle'), ...resolve('textures'), ...resolve('reverbSpace')],
    'Song Structure': [...resolve('structure'), ...resolve('hookStyle'), ...resolve('length')],
    'Lyrics Direction': [...resolve('lyricThemes'), ...resolve('lyricPerspective'), ...resolve('lyricDensity'), ...resolve('repetition')],
    Avoid: resolve('avoid'),
  };
}

export function buildSunoSavedCard(profile) {
  const normalized = coerceSunoProfile(profile);
  const summary = buildSunoSummary(normalized);
  const bundle = buildSunoPromptBundle(normalized);

  return {
    id: `page5-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: 'page5',
    sourceLabel: 'SUNO',
    date: new Date().toISOString(),
    summary: `SUNO｜${summary}`,
    summaryFields: {
      characterDna: labels('genres', normalized),
      expressionPose: labels('moods', normalized),
      wardrobe: labels('instruments', normalized),
      sceneLook: labels('structure', normalized),
    },
    midjourneyPrompt: bundle.stylePrompt,
    grokPrompt: bundle.lyricsDirection,
    zImagePrompt: bundle.fullPrompt,
    promptLabels: {
      midjourney: 'Style Prompt',
      grok: 'Lyrics Direction',
      zImage: 'Full SUNO Prompt',
    },
    selection: null,
    structured: {
      ...buildSunoStructured(normalized),
      'Avoid Prompt': bundle.avoidPrompt ? [{ zh: 'Avoid Prompt', en: bundle.avoidPrompt }] : [],
    },
    profile: normalized,
  };
}

export function getSunoFieldOptions(key) {
  return SUNO_OPTIONS[key] || [];
}

export function getSunoFieldsForSection(sectionId) {
  return SUNO_FIELD_CONFIG.filter((field) => field.section === sectionId);
}

export function isSunoMultiField(key) {
  return MULTI_KEYS.has(key);
}
