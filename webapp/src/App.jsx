import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Page1Workspace from './components/Page1Workspace';
import Page2Workspace from './components/Page2Workspace';
import Page3Workspace from './components/Page3Workspace';
import PageSunoWorkspace from './components/PageSunoWorkspace';
import SavedCardsWorkspace from './components/SavedCardsWorkspace';
import {
  createEmptyLocks,
  generatePrompts,
  getCloseupAllowedKeys,
  getSceneDependentOptions,
  getLockControls,
  hasEffectiveWardrobeLocks,
  isCloseupModeFramingId,
  isWardrobeIncompatibleCloseupFramingId,
  normalizeLocks,
  sanitizeLocksForCloseupMode
} from './lib/engine';
import {
  buildRandomSunoProfile,
  buildSunoSavedCard,
  buildSunoStylesPrompt,
  buildSunoSummary,
  coerceSunoProfile,
  createEmptySunoProfile,
} from './lib/suno';
import './index.css';

const PROMPTS_KEY = 'vps.prompts';
const FAVORITES_KEY = 'vps.favorites';
const LOCKS_KEY = 'vps.locks';
const VIEW_MODE_KEY = 'vps.viewMode';
const PAGE_MODE_KEY = 'vps.pageMode';
const PAGE2_PROFILE_KEY = 'vps.page2Profile';
const PAGE3_PROFILE_KEY = 'vps.page3Profile';
const PAGE5_PROFILE_KEY = 'vps.page5Profile';
const FAVORITES_STORAGE_VERSION = 2;
let favoriteCloudRepositoryPromise = null;
const STORAGE_BUDGETS = {
  [PROMPTS_KEY]: 2_250_000,
  [FAVORITES_KEY]: 2_250_000,
};
const STORAGE_PERSIST_DELAY_MS = 300;
const STORAGE_IDLE_TIMEOUT_MS = 1000;
const FAVORITES_CLOUD_SYNC_DELAY_MS = 900;
const FAVORITES_CLOUD_BATCH_SYNC_THRESHOLD = 25;
const PAGE_MODE_COPY = {
  page1: {
    title: 'Prompt Control Deck',
    subtitle: '一個為個人創作流程設計的虛擬攝影 Prompt 生成工具，支援快速組合、批次生成與風格探索。',
  },
  page2: {
    title: 'Character Builder',
    subtitle: '建立固定角色的臉部與妝容設定，整理成可搬回 PAGE1 使用的角色 Prompt。',
  },
  page3: {
    title: 'Scene Builder',
    subtitle: '建立無人物的純場景與世界觀 prompt，從小空間到超大景都可獨立生成。',
  },
  page4: {
    title: 'Saved Cards',
    subtitle: '集中查看已加入最愛的 Prompt 版本，保留三種輸出內容與一鍵複製流程。',
  },
  page5: {
    title: 'SUNO Styles Builder',
    subtitle: '用結構化欄位快速組裝 SUNO 專用 music styles prompt，集中測試曲風、樂器、律動與人聲方向。',
  },
};

function loadFavoriteCloudRepository() {
  favoriteCloudRepositoryPromise ||= import('./lib/favoritesRepository');
  return favoriteCloudRepositoryPromise;
}

const PAGE2_FIELD_OPTIONS = {
  eyes: [
    { id: '', zh: '未指定', en: '' },
    { id: 'round-clear', zh: '圓眼清透感', en: 'clear round eyes with bright open gaze' },
    { id: 'almond-soft', zh: '杏眼柔和感', en: 'soft almond-shaped eyes with gentle feminine balance' },
    { id: 'phoenix-mono', zh: '單眼皮鳳眼', en: 'sleek monolid phoenix eyes with elegant lifted shape' },
    { id: 'siren-mole', zh: '右眼角有痣的媚眼', en: 'siren-like eyes with a small beauty mark near the outer corner of the right eye' },
    { id: 'cat-upturned', zh: '貓系上挑眼', en: 'slightly upturned cat-like eyes with sharp alluring definition' },
  ],
  brows: [
    { id: '', zh: '未指定', en: '' },
    { id: 'straight-soft', zh: '平直自然眉', en: 'soft straight brows with natural density' },
    { id: 'arched-gentle', zh: '柔和微挑眉', en: 'gently arched brows with refined feminine lift' },
    { id: 'cool-thin', zh: '細長冷感眉', en: 'long slim brows with cool composed sharpness' },
    { id: 'dense-bold', zh: '濃密英氣眉', en: 'defined dense brows with quietly confident strength' },
  ],
  nose: [
    { id: '', zh: '未指定', en: '' },
    { id: 'small-straight', zh: '小巧直鼻', en: 'small straight nose with clean refined bridge' },
    { id: 'upturned', zh: '精緻微翹鼻', en: 'delicate slightly upturned nose with refined tip' },
    { id: 'high-bridge', zh: '細長高挺鼻', en: 'slender high-bridge nose with elegant definition' },
    { id: 'soft-tip', zh: '柔和圓鼻尖', en: 'soft rounded nose tip with natural feminine shape' },
  ],
  lips: [
    { id: '', zh: '未指定', en: '' },
    { id: 'petal', zh: '小巧花瓣唇', en: 'small petal-shaped lips with delicate cupid bow' },
    { id: 'full-soft', zh: '柔軟飽滿唇', en: 'soft full lips with smooth natural volume' },
    { id: 'thin-cool', zh: '薄唇冷感型', en: 'slim lips with cool understated definition' },
    { id: 'defined-cupid', zh: '唇峰明顯的精緻唇', en: 'refined lips with pronounced cupid bow and sculpted shape' },
  ],
  faceShape: [
    { id: '', zh: '未指定', en: '' },
    { id: 'oval-small', zh: '小巧鵝蛋臉', en: 'small oval face with smooth balanced proportions' },
    { id: 'round-soft', zh: '柔和圓臉', en: 'soft round face with gentle youthful fullness' },
    { id: 'long-narrow', zh: '窄長臉', en: 'narrow long face with elegant vertical balance' },
    { id: 'heart', zh: '心形臉', en: 'heart-shaped face with softly tapered chin' },
    { id: 'defined-small', zh: '線條分明的巴掌臉', en: 'small face with crisp contour lines and defined jaw balance' },
  ],
  skin: [
    { id: '', zh: '未指定', en: '' },
    { id: 'cool-matte', zh: '冷白霧面肌', en: 'cool fair matte skin with clean refined surface' },
    { id: 'clear-natural', zh: '清透自然肌', en: 'clear natural skin with soft realistic translucency' },
    { id: 'cream', zh: '細膩奶油肌', en: 'fine creamy skin with smooth soft-focus finish' },
    { id: 'dewy', zh: '微光澤裸肌', en: 'subtle dewy bare skin with natural healthy sheen' },
    { id: 'freckles', zh: '帶雀斑清新肌', en: 'fresh skin with soft natural freckles across the cheeks' },
  ],
  makeup: [
    { id: '', zh: '未指定', en: '' },
    { id: 'almost-none', zh: '幾乎無妝感', en: 'almost no-makeup look with understated enhancement' },
    { id: 'korean-nude', zh: '清透韓系裸妝', en: 'clear Korean nude makeup with polished natural glow' },
    { id: 'japanese-sweet', zh: '日系甜感眼妝', en: 'sweet Japanese eye makeup with soft feminine warmth' },
    { id: 'rose-mature', zh: '成熟玫瑰調妝容', en: 'mature rose-toned makeup with elegant romantic depth' },
    { id: 'cool-smoky', zh: '微煙燻冷感妝', en: 'subtle cool smoky makeup with restrained sharpness' },
  ],
};
const PAGE2_FIELD_CONFIG = [
  { key: 'eyes', label: '眼睛' },
  { key: 'brows', label: '眉型' },
  { key: 'nose', label: '鼻子' },
  { key: 'lips', label: '嘴唇' },
  { key: 'faceShape', label: '臉型' },
  { key: 'skin', label: '皮膚' },
  { key: 'makeup', label: '妝容' },
];
const PAGE3_BASE_FIELD_OPTIONS = {
  scale: [
    { id: '', zh: '未指定', en: '' },
    { id: 'small-corner', zh: '小場景特寫', en: 'intimate small-scale scene' },
    { id: 'interior-space', zh: '室內空間', en: 'full interior space' },
    { id: 'street-block', zh: '街區尺度', en: 'street-block scale environment' },
    { id: 'city-scale', zh: '城市尺度', en: 'large city-scale environment' },
    { id: 'mountain-landscape', zh: '山脈地景', en: 'vast mountain landscape scale' },
    { id: 'ultra-wide-panorama', zh: '超廣域全景', en: 'ultra wide panoramic scale' },
    { id: 'epic-world', zh: '史詩級世界景觀', en: 'epic world-scale environment' },
  ],
  subject: [
    { id: '', zh: '未指定', en: '' },
    { id: 'cafe-corner', zh: '咖啡館角落', en: 'vintage cafe corner interior' },
    { id: 'hotel-room', zh: '旅館房間', en: 'lived-in hotel room interior' },
    { id: 'conservatory', zh: '溫室', en: 'glass conservatory interior' },
    { id: 'vinyl-listening-room', zh: '黑膠唱片聆聽角', en: 'vinyl listening room' },
    { id: 'piano-room', zh: '老式鋼琴房', en: 'old piano room' },
    { id: 'livehouse-backstage', zh: '地下 live house 後台', en: 'underground live house backstage area' },
    { id: 'alley-street', zh: '巷弄街道', en: 'narrow urban alley street' },
    { id: 'city-skyline', zh: '城市天際線', en: 'expansive city skyline' },
    { id: 'industrial-harbor', zh: '港口工業區', en: 'industrial harbor district' },
    { id: 'grand-terminal', zh: '巨型車站大廳', en: 'grand monumental transit terminal hall' },
    { id: 'mountain-ridge', zh: '山脈稜線', en: 'towering mountain ridgeline' },
    { id: 'canyon', zh: '峽谷地形', en: 'vast canyon terrain' },
    { id: 'coastal-cliff', zh: '海岸懸崖', en: 'dramatic coastal cliff landscape' },
    { id: 'desert-ruins', zh: '沙漠遺跡', en: 'vast desert ruins landscape' },
    { id: 'glacier-valley', zh: '冰川山谷', en: 'immense glacier valley environment' },
    { id: 'future-megacity', zh: '巨型未來都市', en: 'colossal futuristic megacity' },
    { id: 'ringworld-megastructure', zh: '環形巨構世界', en: 'ringworld-scale megastructure environment' },
    { id: 'floating-city', zh: '浮空城市', en: 'floating city suspended in the sky' },
    { id: 'floating-islands', zh: '漂浮群島', en: 'floating island archipelago in the sky' },
    { id: 'ancient-temple-ruin', zh: '古老神殿遺跡', en: 'ancient monumental temple ruins' },
    { id: 'celestial-observatory', zh: '天體觀測聖殿', en: 'celestial observatory temple complex' },
    { id: 'otherworld-forest', zh: '異世界森林', en: 'otherworldly forest environment' },
    { id: 'impossible-city', zh: '不可能結構城市', en: 'impossible architecture cityscape' },
    { id: 'dreamlike-space', zh: '超現實夢境空間', en: 'surreal dreamlike spatial environment' },
  ],
  cityIdentity: [
    { id: '', zh: '未指定', en: '' },
    { id: 'tokyo', zh: '東京', en: 'recognizable Tokyo urban character, dense layered Japanese signage, narrow commercial street rhythm, Tokyo Tower or Tokyo Skytree visible as a signature skyline landmark' },
    { id: 'seoul', zh: '首爾', en: 'recognizable Seoul urban character, Korean commercial streetscape, dense mid-rise building rhythm, N Seoul Tower and layered Han River-side skyline silhouettes' },
    { id: 'taipei', zh: '台北', en: 'recognizable Taipei urban character, humid dense city texture, layered signage, mixed older facades and modern storefronts, Taipei 101 visible as a signature skyline landmark' },
    { id: 'shanghai', zh: '上海', en: 'recognizable Shanghai urban character, broad commercial scale, polished metropolitan density, Oriental Pearl Tower or Lujiazui skyline silhouettes as signature landmarks' },
    { id: 'new-york', zh: '紐約', en: 'recognizable New York City character, dense vertical urban grid, iconic Manhattan-like commercial density, Empire State Building or One World Trade Center visible as signature skyline landmarks' },
    { id: 'london', zh: '倫敦', en: 'recognizable London urban character, restrained historic-modern contrast, British street rhythm, Big Ben, the Shard, or the London Eye visible as signature skyline landmarks' },
    { id: 'paris', zh: '巴黎', en: 'recognizable Paris urban character, elegant Haussmann-style facades, refined boulevard rhythm, Eiffel Tower visible as a signature skyline landmark' },
  ],
  world: [
    { id: '', zh: '未指定', en: '' },
    { id: 'realistic', zh: '寫實', en: 'grounded realistic worldbuilding' },
    { id: 'nostalgic', zh: '懷舊', en: 'nostalgic atmosphere' },
    { id: 'british', zh: '英倫', en: 'British environmental character' },
    { id: 'punk', zh: '龐克', en: 'punk-influenced visual identity' },
    { id: 'industrial', zh: '工業', en: 'industrial environmental tone' },
    { id: 'fantasy', zh: '奇幻', en: 'fantasy world atmosphere' },
    { id: 'dark-fantasy', zh: '黑暗奇幻', en: 'dark fantasy mood' },
    { id: 'future-sci-fi', zh: '高科幻未來', en: 'high science-fiction future setting' },
    { id: 'retro-future', zh: '復古未來', en: 'retro-futurist world tone' },
    { id: 'solarpunk', zh: '太陽龐克', en: 'solarpunk worldbuilding language' },
    { id: 'cyberpunk', zh: '賽博龐克', en: 'cyberpunk urban world' },
    { id: 'post-apocalyptic', zh: '末世廢墟', en: 'post-apocalyptic environmental tone' },
    { id: 'surreal', zh: '超現實', en: 'surreal unreal atmosphere' },
    { id: 'dreamlike', zh: '夢境感', en: 'dreamlike environmental tone' },
    { id: 'mythic-unreal', zh: '非現實神話感', en: 'mythic unreal world presence' },
    { id: 'sacred-cosmic', zh: '神聖宇宙感', en: 'sacred cosmic environmental presence' },
  ],
  timeWeather: [
    { id: '', zh: '未指定', en: '' },
    { id: 'sunrise', zh: '日出', en: 'sunrise atmosphere' },
    { id: 'clear-day', zh: '晴朗白天', en: 'clear daytime conditions' },
    { id: 'overcast-day', zh: '陰天白天', en: 'overcast daytime sky' },
    { id: 'sunset', zh: '黃昏', en: 'sunset hour atmosphere' },
    { id: 'blue-hour', zh: '藍調時刻', en: 'blue-hour atmosphere' },
    { id: 'deep-night', zh: '深夜', en: 'deep night setting' },
    { id: 'aurora-night', zh: '極光夜空', en: 'aurora-lit night sky' },
    { id: 'eclipse', zh: '日蝕或月蝕時刻', en: 'eclipse-darkened sky event' },
    { id: 'after-rain', zh: '雨後', en: 'fresh after-rain atmosphere' },
    { id: 'light-mist', zh: '薄霧', en: 'light mist in the air' },
    { id: 'dense-fog', zh: '濃霧', en: 'dense fog-filled atmosphere' },
    { id: 'storm-coming', zh: '暴風前壓迫天氣', en: 'heavy pre-storm pressure in the sky' },
    { id: 'lightning-storm', zh: '閃電風暴', en: 'electrical storm atmosphere with distant lightning' },
    { id: 'after-snow', zh: '雪後冷冽空氣', en: 'cold post-snow atmosphere' },
  ],
  lighting: [
    { id: '', zh: '未指定', en: '' },
    { id: 'soft-natural', zh: '柔和自然光', en: 'soft natural ambient light' },
    { id: 'hard-noon', zh: '強烈正午日照', en: 'hard high-noon sunlight' },
    { id: 'cool-overcast', zh: '冷色陰天光', en: 'cool diffused overcast light' },
    { id: 'warm-tungsten', zh: '暖色鎢絲燈', en: 'warm tungsten practical lighting' },
    { id: 'neon-mixed', zh: '霓虹混光', en: 'mixed neon lighting' },
    { id: 'moonlight', zh: '月光', en: 'cold moonlit illumination' },
    { id: 'strong-backlight', zh: '強烈逆光', en: 'strong backlit atmosphere' },
    { id: 'god-rays', zh: '穿透光束', en: 'dramatic god rays cutting through atmosphere' },
    { id: 'glowing-mist', zh: '神秘發光霧氣', en: 'mysterious glowing mist illumination' },
    { id: 'celestial-light', zh: '巨型天體照明', en: 'dramatic celestial body lighting' },
    { id: 'volcanic-glow', zh: '火山熔光', en: 'volcanic glow from below the horizon' },
    { id: 'bioluminescent', zh: '生物發光環境光', en: 'bioluminescent environmental illumination' },
    { id: 'cloud-diffusion', zh: '漫射雲層天光', en: 'broad diffused skylight through cloud cover' },
    { id: 'spot-source', zh: '局部聚焦光源', en: 'localized focused light sources' },
  ],
  composition: [
    { id: '', zh: '未指定', en: '' },
    { id: 'neutral-view', zh: '中性環境視角', en: 'neutral environmental point of view' },
    { id: 'wide-establishing', zh: '廣角建立鏡頭', en: 'wide establishing shot' },
    { id: 'ultra-wide-pano', zh: '超廣角全景視角', en: 'ultra wide panoramic view' },
    { id: 'birds-eye', zh: '鳥瞰式世界視角', en: 'bird’s-eye world view' },
    { id: 'distant-aerial', zh: '遠距高空俯瞰', en: 'distant aerial overlook' },
    { id: 'elevated-overlook', zh: '高處俯瞰視角', en: 'elevated overlook composition' },
    { id: 'low-angle-monumental', zh: '低角度紀念碑式取景', en: 'low-angle monumental framing' },
    { id: 'center-monumental', zh: '中央紀念碑式構圖', en: 'central monumental framing' },
    { id: 'symmetrical', zh: '對稱式構圖', en: 'symmetrical composition' },
    { id: 'layered-depth', zh: '層次景深構圖', en: 'layered depth composition' },
    { id: 'foreground-occlusion', zh: '電影感前景遮擋', en: 'cinematic foreground occlusion' },
    { id: 'horizon-emphasis', zh: '強調遠方地平線', en: 'distant horizon emphasis' },
  ],
  details: [
    { id: '', zh: '未指定', en: '' },
    { id: 'wood-furniture', zh: '木質家具與舊物件', en: 'aged wood furniture and lived-in objects' },
    { id: 'brick-walls', zh: '紅磚與舊牆面', en: 'weathered brick and aged wall surfaces' },
    { id: 'wet-ground', zh: '潮濕反光地面', en: 'wet reflective ground surfaces' },
    { id: 'metal-pipes', zh: '金屬結構與管線', en: 'exposed metal structures and pipework' },
    { id: 'neon-signage', zh: '發光招牌與霓虹', en: 'glowing signage and neon accents' },
    { id: 'stone-ruins', zh: '石材遺跡', en: 'monumental stone ruins and carved surfaces' },
    { id: 'glowing-plants', zh: '發光植被', en: 'subtly glowing vegetation' },
    { id: 'floating-fragments', zh: '漂浮碎片', en: 'floating fragments suspended in space' },
    { id: 'layered-mountains', zh: '遠景層疊山巒', en: 'layered distant mountain forms' },
    { id: 'waterfalls', zh: '巨大瀑布結構', en: 'massive cascading waterfalls integrated into the environment' },
    { id: 'colossal-bridges', zh: '巨型橋樑結構', en: 'colossal bridges spanning impossible distances' },
    { id: 'cloud-sea', zh: '厚重雲海', en: 'heavy rolling sea of clouds' },
    { id: 'massive-architecture', zh: '巨型建築輪廓', en: 'massive architectural silhouettes' },
    { id: 'aerial-traffic', zh: '空中交通光軌', en: 'aerial traffic trails cutting through the distance' },
    { id: 'cosmic-rings', zh: '天體環帶', en: 'visible cosmic rings dominating the sky' },
    { id: 'weathered-ground', zh: '風化地表紋理', en: 'weathered ground texture and erosion patterns' },
  ],
};
const PAGE3_FIELD_CONFIG = [
  { key: 'scale', label: '場景尺度' },
  { key: 'subject', label: '場景主體' },
  { key: 'cityIdentity', label: '城市定位' },
  { key: 'world', label: '世界觀方向' },
  { key: 'styleId', label: '攝影風格' },
  { key: 'timeWeather', label: '時間與天氣' },
  { key: 'lighting', label: '光線氛圍' },
  { key: 'composition', label: '構圖與鏡頭' },
  { key: 'details', label: '材質與環境細節' },
];

function createEmptyPage2Profile() {
  return Object.fromEntries(PAGE2_FIELD_CONFIG.map((field) => [field.key, '']));
}

function createEmptyPage3Profile() {
  return Object.fromEntries(PAGE3_FIELD_CONFIG.map((field) => [field.key, '']));
}
const CHARACTER_CONTROL_ORDER = [
  'subjectCount',
  'bodyTypeId',
  'facialFeaturesId',
  'facialFeaturesAId',
  'facialFeaturesBId',
  'hairstyleId',
  'hairstyleAId',
  'hairstyleBId',
  'hairColorId',
  'hairColorAId',
  'hairColorBId',
  'skinDetailsId',
  'duoInteractionId',
  'duoPoseId',
  'expressionId',
  'expressionAId',
  'expressionBId',
  'poseId',
  'specialActionId',
];
const SCENE_CAMERA_CONTROL_ORDER = ['styleId', 'sceneAttributeId', 'locationId', 'lightingId', 'lightDirectionId', 'angleId', 'orbitId', 'framingId', 'lensId', 'opticalEffectId', 'filmId', 'aspectRatio'];
const STYLE_WARDROBE_CONTROL_ORDER = [
  'specialOutfitId',
  'specialOutfitAId',
  'specialOutfitBId',
  'outfitPresetId',
  'outfitPresetPrimaryColorId',
  'outfitPresetContrastColorId',
  'outfitPresetLockedPaletteId',
  'outfitPresetAId',
  'outfitPresetAPrimaryColorId',
  'outfitPresetAContrastColorId',
  'outfitPresetALockedPaletteId',
  'outfitPresetBId',
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
  'topBottomPaletteId',
  'topBottomPaletteAId',
  'topBottomPaletteBId',
  'topColorId',
  'topAColorId',
  'topBColorId',
  'topPatternId',
  'topAPatternId',
  'topBPatternId',
  'bottomColorId',
  'bottomAColorId',
  'bottomBColorId',
  'bottomPatternId',
  'bottomAPatternId',
  'bottomBPatternId',
  'outerwearId',
  'outerwearColorId',
  'outerwearPatternId',
  'outerwearStylingId',
  'legwearId',
  'legwearColorId',
  'shoesId',
  'shoesColorId',
  'outerwearAId',
  'outerwearAColorId',
  'outerwearAPatternId',
  'outerwearAStylingId',
  'legwearAId',
  'legwearAColorId',
  'shoesAId',
  'shoesAColorId',
  'outerwearBId',
  'outerwearBColorId',
  'outerwearBPatternId',
  'outerwearBStylingId',
  'legwearBId',
  'legwearBColorId',
  'shoesBId',
  'shoesBColorId',
  'headAccessoryId',
  'eyewearId',
  'earringsId',
  'neckAccessoryId',
  'headAccessoryAId',
  'eyewearAId',
  'earringsAId',
  'neckAccessoryAId',
  'headAccessoryBId',
  'eyewearBId',
  'earringsBId',
  'neckAccessoryBId',
  'wristAccessoryId',
  'ringId',
  'waistAccessoryId',
];

function sortControls(controls, order) {
  const orderMap = new Map(order.map((key, index) => [key, index]));
  return [...controls].sort((a, b) => (orderMap.get(a.key) ?? 999) - (orderMap.get(b.key) ?? 999));
}

function isNoneSelected(controlKey, value, controls) {
  if (!value) return false;
  const control = controls.find((item) => item.key === controlKey);
  if (!control) return true;
  const selected = control?.options.find((option) => option.id === value);
  if (!selected) return true;
  return selected.zh === '全無';
}

function buildMarkdownExport(data) {
  const labels = {
    midjourney: data.promptLabels?.midjourney || 'AI Prompt',
    grok: data.promptLabels?.grok || 'Grok Structured Prompt',
    zImage: data.promptLabels?.zImage || 'Z-Image Prompt',
  };
  const structured = data.structured && typeof data.structured === 'object' ? data.structured : {};
  const promptEntries = [
    { label: labels.midjourney, text: data.midjourneyPrompt },
    { label: labels.grok, text: data.grokPrompt },
    { label: labels.zImage, text: data.zImagePrompt },
  ].filter((entry) => entry.text);

  return `# Generated Prompt - ${new Date(data.date).toLocaleString()}
**Source:** ${data.sourceLabel || 'Prompt 工作台'}
**Summary:** ${data.summary}

${promptEntries.map((entry) => `## ${entry.label}
\`\`\`text
${entry.text}
\`\`\``).join('\n\n')}

---

## Structured Scheme
${Object.entries(structured)
  .map(([key, items]) => {
    const text = items.map((item) => `${item.en} (${item.zh})`).join(', ');
    return `* **${key}:** ${text || '-'}`;
  })
  .join('\n')}
`;
}

function parseSummaryFields(summary) {
  const text = String(summary || '');
  const labels = {
    style: '風格',
    character: '人物',
    wardrobe: '服裝',
    location: '場景',
    camera: '鏡頭',
    lighting: '光影',
  };

  return Object.fromEntries(
    Object.entries(labels).map(([key, label]) => {
      const match = text.match(new RegExp(`${label}：([^|]+)`));
      return [key, match ? match[1].trim() : '-'];
    })
  );
}

function buildImportedStructured(locks, controls) {
  const controlMap = new Map(controls.map((control) => [control.key, control]));
  const getOption = (key) => {
    const value = locks[key];
    if (!value) return null;
    const control = controlMap.get(key);
    return control?.options?.find((option) => option.id === value) || null;
  };
  const buildSection = (keys) => keys.map(getOption).filter(Boolean);

  return {
    Style: buildSection(['styleId']),
    Character: buildSection([
      'subjectCount',
      'bodyTypeId',
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
      'duoInteractionId',
      'duoPoseId',
      'expressionId',
      'expressionAId',
      'expressionBId',
      'poseId',
      'specialActionId',
    ]),
    Wardrobe: buildSection([
      'outfitPresetId',
      'outfitPresetColorId',
      'outfitPresetAId',
      'outfitPresetAColorId',
      'outfitPresetBId',
      'outfitPresetBColorId',
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
      'outerwearColorId',
      'outerwearPatternId',
      'outerwearStylingId',
      'legwearId',
      'legwearColorId',
      'shoesId',
      'shoesColorId',
      'headAccessoryId',
      'eyewearId',
      'earringsId',
      'neckAccessoryId',
      'headAccessoryAId',
      'eyewearAId',
      'earringsAId',
      'neckAccessoryAId',
      'headAccessoryBId',
      'eyewearBId',
      'earringsBId',
      'neckAccessoryBId',
      'wristAccessoryId',
      'ringId',
      'waistAccessoryId',
    ]),
    Location: buildSection(['sceneAttributeId', 'locationId']),
    Framing: buildSection(['framingId', 'angleId', 'orbitId', 'lensId']),
    Lighting: buildSection(['lightingId', 'lightDirectionId']),
    'Camera & Film': buildSection(['filmId', 'opticalEffectId']),
  };
}

function parseExportedMarkdownPrompt(markdownText, controls, fallbackId) {
  const text = String(markdownText || '').replace(/\r\n/g, '\n');
  const summaryMatch = text.match(/\*\*Summary:\*\*\s*(.+)/);
  const midjourneyMatch = text.match(/## (?:AI Prompt|Midjourney Prompt)\n```text\n([\s\S]*?)\n```/);
  const grokMatch = text.match(/## Grok Structured Prompt\n```text\n([\s\S]*?)\n```/);
  const zImageMatch = text.match(/## Z-Image Prompt\n```text\n([\s\S]*?)\n```/);

  if (!summaryMatch || !midjourneyMatch || !grokMatch) {
    throw new Error('missing required markdown sections');
  }

  const summary = summaryMatch[1].trim();
  const midjourneyPrompt = midjourneyMatch[1].trim();
  const grokPrompt = grokMatch[1].trim();
  const zImagePrompt = zImageMatch?.[1]?.trim() || '';
  const { locks: parsedLocks, matchedControls } = parseLocksFromStandardPrompt(`${midjourneyPrompt}\n${grokPrompt}\n${zImagePrompt}`, controls);

  if (matchedControls.length === 0) {
    throw new Error('no recoverable controls found in prompt');
  }

  const selection = buildRestoreLocks(parsedLocks, controls);
  const prompt = {
    id: fallbackId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    summary,
    summaryFields: parseSummaryFields(summary),
    midjourneyPrompt,
    grokPrompt,
    zImagePrompt,
    selection,
    structured: buildImportedStructured(selection, controls),
  };

  return {
    ...prompt,
    lineage: createLineage(prompt),
  };
}

function mergeFavoritePrompts(existingPrompts, importedPrompts) {
  const importedIds = new Set(importedPrompts.map((item) => item.id));
  const preservedExisting = existingPrompts.filter((item) => !importedIds.has(item.id));
  return [...importedPrompts, ...preservedExisting];
}

function toShortPromptId(id) {
  return `#${String(id).slice(-6).toUpperCase()}`;
}

function createLineage(prompt) {
  return {
    rootId: prompt.id,
    rootShortId: toShortPromptId(prompt.id),
    parentId: null,
    parentShortId: '',
    version: 1,
    remixCount: 0,
    lastMode: 'original',
    lastLocked: [],
  };
}

function buildAllNoneLocks(controls, currentLocks) {
  const nextLocks = createEmptyLocks();
  nextLocks.subjectCount = currentLocks.subjectCount || nextLocks.subjectCount;

  controls.forEach((control) => {
    if (control.key === 'subjectCount') return;
    const noneOption = control.options?.find((option) => option.zh === '全無');
    if (noneOption) {
      nextLocks[control.key] = noneOption.id;
      return;
    }
    nextLocks[control.key] = Array.isArray(nextLocks[control.key]) ? [] : '';
  });

  return nextLocks;
}

function loadJsonStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function loadStringStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

function compactPromptSelection(selection) {
  if (!selection || typeof selection !== 'object') return null;

  const normalized = normalizeLocks({ ...createEmptyLocks(), ...selection });
  return Object.fromEntries(
    Object.entries(normalized).filter(([key, value]) => {
      if (key === 'subjectCount' || key === 'aspectRatio') return true;
      if (key === 'topBottomPaletteId' && value === 'none') return false;
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    })
  );
}

function sanitizeStoredPrompt(prompt, controls = getLockControls()) {
  if (!prompt || typeof prompt !== 'object' || !prompt.id) return null;

  const source = String(prompt.source || 'page1');
  const rawSelection = prompt.selection && typeof prompt.selection === 'object'
    ? prompt.selection
    : null;
  const selection = source === 'page1' && rawSelection
    ? normalizeLocks({ ...createEmptyLocks(), ...rawSelection })
    : null;
  const summaryFields = prompt.summaryFields && typeof prompt.summaryFields === 'object'
    ? prompt.summaryFields
    : parseSummaryFields(prompt.summary);
  const structured = prompt.structured && typeof prompt.structured === 'object'
    ? prompt.structured
    : (selection ? buildImportedStructured(selection, controls) : {});

  return {
    id: prompt.id,
    source,
    sourceLabel: String(prompt.sourceLabel || ''),
    date: prompt.date || new Date().toISOString(),
    summary: String(prompt.summary || ''),
    summaryFields,
    midjourneyPrompt: String(prompt.midjourneyPrompt || ''),
    grokPrompt: String(prompt.grokPrompt || ''),
    zImagePrompt: String(prompt.zImagePrompt || ''),
    promptLabels: prompt.promptLabels && typeof prompt.promptLabels === 'object' ? prompt.promptLabels : null,
    selection,
    structured,
    profile: prompt.profile && typeof prompt.profile === 'object' ? prompt.profile : null,
    lineage: prompt.lineage && typeof prompt.lineage === 'object' ? prompt.lineage : null,
    remixMeta: prompt.remixMeta && typeof prompt.remixMeta === 'object' ? prompt.remixMeta : null,
  };
}

function sanitizeStoredPromptCollection(items) {
  if (!Array.isArray(items)) return [];
  return items.map(sanitizeStoredPrompt).filter(Boolean);
}

function serializeFavoritePrompt(prompt) {
  const sanitized = sanitizeStoredPrompt(prompt);
  if (!sanitized) return null;

  return {
    v: FAVORITES_STORAGE_VERSION,
    i: sanitized.id,
    o: sanitized.source,
    b: sanitized.sourceLabel,
    d: sanitized.date,
    s: sanitized.summary,
    m: sanitized.midjourneyPrompt,
    g: sanitized.grokPrompt,
    z: sanitized.zImagePrompt,
    y: sanitized.promptLabels,
    l: compactPromptSelection(sanitized.selection),
    p: sanitized.profile,
    n: sanitized.lineage,
    r: sanitized.remixMeta,
  };
}

function deserializeFavoritePrompt(record) {
  if (!record || typeof record !== 'object') return null;

  if (record.v === FAVORITES_STORAGE_VERSION && record.i) {
    return sanitizeStoredPrompt({
      id: record.i,
      source: record.o,
      sourceLabel: record.b,
      date: record.d,
      summary: record.s,
      midjourneyPrompt: record.m,
      grokPrompt: record.g,
      zImagePrompt: record.z,
      promptLabels: record.y,
      selection: record.l,
      profile: record.p,
      lineage: record.n,
      remixMeta: record.r,
    });
  }

  return sanitizeStoredPrompt(record);
}

function deserializeFavoritePromptCollection(items) {
  if (!Array.isArray(items)) return [];
  return items.map(deserializeFavoritePrompt).filter(Boolean);
}

function estimateStorageBytes(text) {
  return new Blob([text]).size;
}

function fitPromptsToStorageBudget(prompts, budget) {
  if (!budget) return prompts;

  const fitted = [];
  let bytesUsed = 2;

  for (const prompt of prompts) {
    const serializedPrompt = JSON.stringify(prompt);
    const nextBytes = estimateStorageBytes(serializedPrompt) + (fitted.length > 0 ? 1 : 0);
    if (bytesUsed + nextBytes > budget) break;
    fitted.push(prompt);
    bytesUsed += nextBytes;
  }

  return fitted;
}

function persistPromptCollection(key, prompts, serializer = sanitizeStoredPromptCollection) {
  if (typeof window === 'undefined') {
    return { truncatedCount: 0, failed: false };
  }

  const sanitized = serializer(prompts).filter(Boolean);
  let fitted = fitPromptsToStorageBudget(sanitized, STORAGE_BUDGETS[key]);

  while (fitted.length >= 0) {
    try {
      window.localStorage.setItem(key, JSON.stringify(fitted));
      return {
        truncatedCount: sanitized.length - fitted.length,
        failed: false,
      };
    } catch (error) {
      const isQuotaExceeded = error instanceof DOMException
        && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');

      if (!isQuotaExceeded || fitted.length === 0) {
        return {
          truncatedCount: sanitized.length,
          failed: true,
        };
      }

      fitted = fitted.slice(0, -1);
    }
  }

  return { truncatedCount: sanitized.length, failed: true };
}

function schedulePromptCollectionPersist(key, prompts, serializer, onResult) {
  if (typeof window === 'undefined') return () => {};

  let idleHandle = null;
  const timeoutId = window.setTimeout(() => {
    const persist = () => {
      idleHandle = null;
      onResult(persistPromptCollection(key, prompts, serializer));
    };

    if ('requestIdleCallback' in window) {
      idleHandle = window.requestIdleCallback(persist, { timeout: STORAGE_IDLE_TIMEOUT_MS });
      return;
    }

    idleHandle = window.setTimeout(persist, 0);
  }, STORAGE_PERSIST_DELAY_MS);

  return () => {
    window.clearTimeout(timeoutId);
    if (idleHandle === null) return;
    if ('cancelIdleCallback' in window) {
      window.cancelIdleCallback(idleHandle);
      return;
    }
    window.clearTimeout(idleHandle);
  };
}

function getPage2OptionLabel(fieldKey, optionId) {
  return PAGE2_FIELD_OPTIONS[fieldKey]?.find((option) => option.id === optionId)?.zh || '';
}

function getPage2OptionPrompt(fieldKey, optionId) {
  return PAGE2_FIELD_OPTIONS[fieldKey]?.find((option) => option.id === optionId)?.en || '';
}

function buildPage2ProfileSummary(profile) {
  return PAGE2_FIELD_CONFIG
    .map((field) => getPage2OptionLabel(field.key, profile[field.key]))
    .filter(Boolean)
    .join(' / ');
}

function buildPage2ProfileAnchor(profile) {
  const anchorPriority = ['eyes', 'faceShape', 'makeup', 'skin', 'lips', 'brows', 'nose'];
  const promptParts = anchorPriority
    .map((fieldKey) => getPage2OptionPrompt(fieldKey, profile[fieldKey]))
    .filter(Boolean)
    .slice(0, 4);

  if (promptParts.length === 0) return '';

  return `reference face anchor, ${promptParts.join(', ')}`;
}

function buildPage2ViewPrompts(profile) {
  const anchor = buildPage2ProfileAnchor(profile);
  if (!anchor) return [];

  const base =
    'neutral studio reference portrait, plain seamless background, flat even lighting, passport-photo-like clarity, same exact woman in every image, consistent facial identity, matched facial proportions, no dramatic shadows, no cinematic styling, natural realistic skin rendering';

  return [
    {
      key: 'four-angle-sheet',
      label: '四角度合成一張',
      prompt: `${base}, one image containing four standardized reference angles arranged as a clean identity sheet: exact front view, exact left three-quarter view, exact side profile view, and exact back view, same identity in every panel, neutral expression, direct head alignment, clear structural comparison across all four angles, no duplicated frontal views, ${anchor}`,
    },
    {
      key: 'front',
      label: '正面',
      prompt: `${base}, exact front-facing reference portrait, direct symmetrical facial axis, centered head position, both ears evenly aligned if visible, both eyes fully visible, nose bridge centered, lips centered, neutral closed-mouth expression, balanced jawline visibility, ${anchor}`,
    },
    {
      key: 'left-three-quarter',
      label: '左前 45 度',
      prompt: `${base}, exact left three-quarter reference portrait at roughly forty-five degrees, neutral head turn without dramatic tilt, clear separation of the front facial plane and side facial plane, both eyes still visible, nose bridge angle readable, cheekbone and jaw transition clearly defined, neutral closed-mouth expression, ${anchor}`,
    },
    {
      key: 'profile',
      label: '側面',
      prompt: `${base}, exact ninety-degree side profile reference portrait, only one side of the face visible, head fully turned to profile, no partial front visibility, clean silhouette of forehead, nose bridge, lips, chin, and jawline, neck line readable, neutral closed-mouth expression, clear profile contour readability, ${anchor}`,
    },
    {
      key: 'back',
      label: '背面',
      prompt: 'neutral studio reference back view, plain seamless background, flat even lighting, back-facing portrait showing head shape, hairstyle silhouette, and hair length clearly, no dramatic styling',
    },
  ];
}

function buildPage2IdentityPrompt(profile) {
  const anchor = buildPage2ProfileAnchor(profile);
  if (!anchor) return '';

  return [
    'same exact woman',
    'consistent facial identity',
    'same facial proportions across every image',
    anchor,
    'neutral studio reference portrait',
    'plain seamless background',
    'flat even lighting',
    'passport-photo-like clarity',
    'neutral closed-mouth expression',
    'no cinematic styling',
  ].join(', ');
}

function buildPage2MasterPrompt(profile) {
  const anchor = buildPage2ProfileAnchor(profile);
  if (!anchor) return '';

  return [
    'neutral studio character reference sheet',
    'plain seamless background',
    'flat even lighting',
    'passport-photo-like clarity',
    'same exact woman in every panel',
    'one image containing four core identity views of the same person',
    'exact front reference view',
    'exact left three-quarter reference view',
    'exact side profile reference view',
    'exact back reference view',
    'neutral expression in every panel',
    'centered head alignment',
    'matched proportions across all views including head shape and hairstyle silhouette continuity',
    'clear structural comparison focused on front, three-quarter, profile, and back-view consistency',
    buildPage2IdentityPrompt(profile),
  ].join(', ');
}

function buildPage2CoreViewsBundle(viewPrompts) {
  const coreKeys = new Set(['front', 'left-three-quarter', 'profile', 'back']);
  const coreViews = viewPrompts.filter((item) => coreKeys.has(item.key));
  if (coreViews.length === 0) return '';

  return coreViews
    .map((item) => `${item.label}: ${item.prompt}`)
    .join('\n\n');
}

function buildPage2PromptBundle(profile, viewPrompts) {
  const anchor = buildPage2ProfileAnchor(profile);
  if (!anchor || viewPrompts.length === 0) return '';

  const identityPrompt = buildPage2IdentityPrompt(profile);
  const coreViewsBundle = buildPage2CoreViewsBundle(viewPrompts);
  const lines = [
    `Face Anchor: ${anchor}`,
    '',
    `Identity Prompt: ${identityPrompt}`,
    '',
    `Master Sheet: ${buildPage2MasterPrompt(profile)}`,
    '',
    'Core Views:',
    coreViewsBundle,
    '',
    ...viewPrompts.flatMap((item) => [`${item.label}: ${item.prompt}`, '']),
  ];

  return lines.join('\n').trim();
}

function buildPage2SavedCard(profile, summary, anchor, masterPrompt, coreViewsBundle, promptBundle) {
  const safeSummary = summary || '尚未選擇角色特徵';

  return {
    id: `page2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: 'page2',
    sourceLabel: '角色建模',
    date: new Date().toISOString(),
    summary: `角色建模｜${safeSummary}`,
    summaryFields: {
      characterDna: safeSummary,
      expressionPose: anchor || '-',
      wardrobe: '-',
      sceneLook: '-',
    },
    midjourneyPrompt: masterPrompt,
    grokPrompt: promptBundle,
    zImagePrompt: coreViewsBundle,
    promptLabels: {
      midjourney: 'Master Sheet',
      grok: 'Prompt Bundle',
      zImage: 'Core Views',
    },
    selection: null,
    structured: {
      'Page2 Character': [
        {
          zh: safeSummary,
          en: anchor || 'character profile anchor',
        },
      ],
    },
    profile: { ...profile },
  };
}

function getPage3Option(fieldOptions, fieldKey, optionId) {
  return fieldOptions[fieldKey]?.find((option) => option.id === optionId) || null;
}

function getPage3OptionLabel(fieldOptions, fieldKey, optionId) {
  return getPage3Option(fieldOptions, fieldKey, optionId)?.zh || '';
}

function getPage3OptionPrompt(fieldOptions, fieldKey, optionId) {
  return getPage3Option(fieldOptions, fieldKey, optionId)?.en || '';
}

function buildPage3Summary(profile, fieldOptions) {
  return PAGE3_FIELD_CONFIG
    .map((field) => getPage3OptionLabel(fieldOptions, field.key, profile[field.key]))
    .filter(Boolean)
    .join(' / ');
}

function buildPage3Anchor(profile, fieldOptions) {
  const priority = ['subject', 'cityIdentity', 'scale', 'world', 'styleId', 'timeWeather', 'lighting', 'composition'];
  const promptParts = priority
    .map((fieldKey) => getPage3OptionPrompt(fieldOptions, fieldKey, profile[fieldKey]))
    .filter(Boolean)
    .slice(0, 6);

  if (promptParts.length === 0) return '';
  return promptParts.join(', ');
}

function getPage3ScaleTone(scaleId) {
  switch (scaleId) {
    case 'small-corner':
      return ['intimate environmental focus', 'fine localized detail'];
    case 'interior-space':
      return ['clear spatial readability', 'contained architectural atmosphere'];
    case 'street-block':
      return ['street-scale depth', 'readable surrounding structures'];
    case 'city-scale':
      return ['monumental urban scale', 'layered skyline depth'];
    case 'mountain-landscape':
      return ['vast geographic scale', 'towering natural mass'];
    case 'ultra-wide-panorama':
      return ['ultra wide environmental sweep', 'expansive horizon line'];
    case 'epic-world':
      return ['world-scale grandeur', 'mythic environmental vastness'];
    default:
      return [];
  }
}

function getPage3SubjectTone(subjectId) {
  const subjectToneMap = {
    'cafe-corner': ['quiet interior storytelling', 'inviting lived-in texture'],
    'hotel-room': ['lived-in interior atmosphere', 'traceable signs of recent presence without showing any person'],
    conservatory: ['glass structure depth', 'botanical enclosure atmosphere'],
    'alley-street': ['urban emptiness', 'layered street perspective'],
    'city-skyline': ['recognizable skyline silhouette', 'layered architectural rhythm'],
    'grand-terminal': ['cathedral-like civic scale', 'structured circulation space'],
    'mountain-ridge': ['towering landform silhouette', 'clean atmospheric distance'],
    canyon: ['geological depth', 'immense carved terrain'],
    'coastal-cliff': ['open coastal exposure', 'dramatic vertical drop'],
    'desert-ruins': ['ancient scale buried in erosion', 'harsh elemental emptiness'],
    'glacier-valley': ['cold massive terrain', 'crystalline atmospheric clarity'],
    'future-megacity': ['dense futuristic infrastructure', 'vast engineered urban layering'],
    'ringworld-megastructure': ['civilization-scale engineering', 'impossible but believable megastructure presence'],
    'floating-city': ['suspended architecture', 'weightless monumental balance'],
    'floating-islands': ['airborne landmass layering', 'open sky depth'],
    'ancient-temple-ruin': ['sacred ruin atmosphere', 'monumental stone geometry'],
    'celestial-observatory': ['cosmic ritual architecture', 'astronomical scale motifs'],
    'otherworld-forest': ['unfamiliar natural logic', 'organic spatial mystery'],
    'impossible-city': ['architectural paradox', 'non-euclidean visual logic'],
    'dreamlike-space': ['spatial ambiguity', 'unreal dream atmosphere'],
  };

  return subjectToneMap[subjectId] || [];
}

function buildPage3CityPrompt(profile, fieldOptions) {
  const city = getPage3Option(fieldOptions, 'cityIdentity', profile.cityIdentity);
  if (!city || !city.en) return '';

  const urbanSubjects = new Set([
    'alley-street',
    'city-skyline',
    'industrial-harbor',
    'grand-terminal',
    'future-megacity',
    'impossible-city',
  ]);
  const interiorSubjects = new Set([
    'cafe-corner',
    'hotel-room',
    'conservatory',
    'vinyl-listening-room',
    'piano-room',
    'livehouse-backstage',
  ]);

  if (interiorSubjects.has(profile.subject)) {
    return `${city.en}, subtle landmark or skyline presence only through windows, openings, or distant exterior glimpses`;
  }

  if (urbanSubjects.has(profile.subject)) {
    return city.en;
  }

  return `${city.en}, landmark presence kept secondary to the main environment`;
}

function buildPage3StylePrompt(style) {
  if (!style || !style.id || style.zh === '全無' || style.en === 'none') return '';

  const styleText = String(style.en || '')
    .replace(/^Inspired by [^,]+,\s*/i, '')
    .replace(/\bportraiture\b/gi, 'environmental photography')
    .replace(/\bportrait photography\b/gi, 'environmental photography')
    .replace(/\bportrait\b/gi, 'environmental')
    .replace(/\bcommanding presence\b/gi, 'commanding spatial presence')
    .replace(/\bspontaneous energy\b/gi, 'spontaneous environmental energy')
    .replace(/\bcandid movement\b/gi, 'incidental environmental motion cues')
    .replace(/\bfeminine confidence\b/gi, 'charged atmospheric confidence')
    .replace(/\bbeauty lighting\b/gi, 'polished scene lighting')
    .replace(/\bskin rendering\b/gi, 'surface rendering')
    .replace(/\s+/g, ' ')
    .trim();

  const styleTags = new Set(style.meta?.tags || []);
  const tagPhrases = [
    styleTags.has('high_saturation') ? 'heightened color contrast' : '',
    styleTags.has('moody') ? 'moody scene atmosphere' : '',
    styleTags.has('dreamlike') ? 'dreamlike visual tension' : '',
    styleTags.has('minimal') ? 'disciplined negative space' : '',
    styleTags.has('structured') ? 'ordered structural composition' : '',
    styleTags.has('conceptual') ? 'conceptual environmental staging' : '',
    styleTags.has('natural_light_bias') ? 'natural-light observation' : '',
    styleTags.has('studio_bias') || styleTags.has('set_bias') ? 'controlled stylized lighting' : '',
    styleTags.has('urban_bias') ? 'urban observational framing' : '',
    styleTags.has('night_bias') ? 'night-environment emphasis' : '',
    styleTags.has('low_key_bias') ? 'low-key shadow shaping' : '',
    styleTags.has('soft_grade') ? 'soft lifted tonal rendering' : '',
    styleTags.has('clean_grade') ? 'clean editorial polish' : '',
    styleTags.has('monochrome') ? 'monochrome-ready tonal discipline' : '',
    styleTags.has('neon') ? 'neon color separation' : '',
  ].filter(Boolean);

  return [
    `${style.zh} inspired environmental image language`,
    styleText,
    ...tagPhrases,
  ].filter(Boolean).join(', ');
}

function buildPage3BaseParts(profile, fieldOptions) {
  const subject = getPage3OptionPrompt(fieldOptions, 'subject', profile.subject);
  const scale = getPage3OptionPrompt(fieldOptions, 'scale', profile.scale);
  const cityIdentity = buildPage3CityPrompt(profile, fieldOptions);
  const world = getPage3OptionPrompt(fieldOptions, 'world', profile.world);
  const timeWeather = getPage3OptionPrompt(fieldOptions, 'timeWeather', profile.timeWeather);
  const lighting = getPage3OptionPrompt(fieldOptions, 'lighting', profile.lighting);
  const composition = getPage3OptionPrompt(fieldOptions, 'composition', profile.composition);
  const details = getPage3OptionPrompt(fieldOptions, 'details', profile.details);
  const style = buildPage3StylePrompt(getPage3Option(fieldOptions, 'styleId', profile.styleId));
  const qualifiers = ['empty scene', 'no people', 'no human subject'];
  const interiorSubjects = new Set([
    'cafe-corner', 'hotel-room', 'conservatory', 'vinyl-listening-room', 'piano-room', 'livehouse-backstage', 'grand-terminal'
  ]);
  const streetSubjects = new Set(['alley-street']);

  if (interiorSubjects.has(profile.subject)) qualifiers.push('unoccupied interior');
  if (streetSubjects.has(profile.subject)) qualifiers.push('empty street scene');

  return {
    subject,
    scale,
    cityIdentity,
    world,
    style,
    timeWeather,
    lighting,
    composition,
    details,
    qualifiers,
    scaleTone: getPage3ScaleTone(profile.scale),
    subjectTone: getPage3SubjectTone(profile.subject),
    isMonumental: ['city-scale', 'mountain-landscape', 'ultra-wide-panorama', 'epic-world'].includes(profile.scale),
  };
}

function buildPage3Prompt(profile, fieldOptions) {
  const {
    subject, scale, cityIdentity, world, style, timeWeather, lighting, composition, details, qualifiers, scaleTone, subjectTone
  } = buildPage3BaseParts(profile, fieldOptions);

  const parts = [
    ...qualifiers,
    subject,
    cityIdentity,
    scale,
    world,
    style,
    timeWeather,
    lighting,
    composition,
    details,
    ...scaleTone,
    ...subjectTone,
    'strong environmental storytelling',
    'focus entirely on environment design',
  ].filter(Boolean);

  return parts.join(', ');
}

function buildPage3CinematicPrompt(profile, fieldOptions) {
  const {
    subject, scale, cityIdentity, world, style, timeWeather, lighting, composition, details, scaleTone, subjectTone, isMonumental
  } = buildPage3BaseParts(profile, fieldOptions);
  const opener = isMonumental
    ? `ultra wide cinematic establishing shot of ${subject || 'a vast environment'}`
    : `cinematic environment study of ${subject || 'an environment scene'}`;
  const sizeEnhancers = isMonumental
    ? ['colossal scale', 'monumental presence', 'vast atmospheric depth', 'epic environmental storytelling']
    : ['cinematic environmental storytelling'];

  const parts = [
    opener,
    'no people',
    'no human subject',
    cityIdentity,
    scale,
    world,
    style,
    timeWeather,
    lighting,
    composition,
    details,
    ...scaleTone,
    ...subjectTone,
    ...sizeEnhancers,
  ].filter(Boolean);

  return parts.join(', ');
}

function buildPage3WorldPrompt(profile, fieldOptions) {
  const {
    subject, scale, cityIdentity, world, style, timeWeather, lighting, composition, details, qualifiers, scaleTone, subjectTone, isMonumental
  } = buildPage3BaseParts(profile, fieldOptions);

  const parts = [
    'worldbuilding environment concept',
    ...qualifiers,
    subject,
    cityIdentity,
    scale,
    world,
    style,
    timeWeather,
    lighting,
    composition,
    details,
    ...scaleTone,
    ...subjectTone,
    isMonumental ? 'civilization-scale environment logic' : 'internally coherent environmental storytelling',
    'surreal but believable spatial design',
    'rich atmosphere and layered lore cues',
  ].filter(Boolean);

  return parts.join(', ');
}

function buildPage3SavedCard(profile, summary, anchor, prompt, cinematicPrompt, worldPrompt) {
  const safeSummary = summary || '尚未選擇場景條件';

  return {
    id: `page3-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: 'page3',
    sourceLabel: '場景建模',
    date: new Date().toISOString(),
    summary: `場景建模｜${safeSummary}`,
    summaryFields: {
      characterDna: '-',
      expressionPose: '-',
      wardrobe: '-',
      sceneLook: safeSummary,
    },
    midjourneyPrompt: prompt,
    grokPrompt: cinematicPrompt,
    zImagePrompt: worldPrompt,
    promptLabels: {
      midjourney: 'Scene Prompt',
      grok: 'Cinematic',
      zImage: 'World',
    },
    selection: null,
    structured: {
      'Page3 Scene': [
        {
          zh: safeSummary,
          en: anchor || 'scene profile anchor',
        },
      ],
    },
    profile: { ...profile },
  };
}

function loadFavoritePrompts() {
  if (typeof window === 'undefined') return [];

  const rawFavorites = loadJsonStorage(FAVORITES_KEY, []);
  if (!Array.isArray(rawFavorites) || rawFavorites.length === 0) return [];

  // New format: store full prompt objects directly.
  if (typeof rawFavorites[0] === 'object' && rawFavorites[0] !== null) {
    return deserializeFavoritePromptCollection(rawFavorites);
  }

  // Legacy format: store only ids, recover from prompt cache if possible.
  const promptCache = sanitizeStoredPromptCollection(loadJsonStorage(PROMPTS_KEY, []));
  if (!Array.isArray(promptCache)) return [];

  const idSet = new Set(rawFavorites.filter(Boolean));
  return promptCache.filter((item) => item?.id && idSet.has(item.id));
}

function normalizePromptText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function findBestOptionMatch(options, normalizedPrompt) {
  const candidates = [...(options || [])]
    .filter((option) => option?.id && option?.en && option.zh !== '全無')
    .sort((a, b) => b.en.length - a.en.length);

  return candidates.find((option) => normalizedPrompt.includes(normalizePromptText(option.en))) || null;
}

function parseLocksFromStandardPrompt(promptText, controls) {
  const normalizedPrompt = normalizePromptText(promptText);
  const nextLocks = createEmptyLocks();
  const matchedControls = [];

  if (!normalizedPrompt) {
    return { locks: nextLocks, matchedControls };
  }

  controls.forEach((control) => {
    const matchedOption = findBestOptionMatch(control.options, normalizedPrompt);
    if (!matchedOption) return;
    nextLocks[control.key] = matchedOption.id;
    matchedControls.push({
      key: control.key,
      label: control.label,
      option: matchedOption,
    });
  });

  return { locks: nextLocks, matchedControls };
}

function buildRestoreLocks(nextLocks, controls) {
  const restoredLocks = { ...createEmptyLocks(), ...nextLocks };

  controls.forEach((control) => {
    if (restoredLocks[control.key]) return;
    const noneOption = control.options?.find((option) => option.zh === '全無');
    if (noneOption) {
      restoredLocks[control.key] = noneOption.id;
    }
  });

  return restoredLocks;
}

export default function App() {
  const importFeedInputRef = useRef(null);
  const storageWarningRef = useRef('');
  const [prompts, setPrompts] = useState(() => sanitizeStoredPromptCollection(loadJsonStorage(PROMPTS_KEY, [])));
  const [favoritePrompts, setFavoritePrompts] = useState(() => loadFavoritePrompts());
  const [pageMode, setPageMode] = useState(() => loadStringStorage(PAGE_MODE_KEY, 'page1'));
  const [viewMode, setViewMode] = useState(() => loadStringStorage(VIEW_MODE_KEY, 'feed'));
  const [locks, setLocks] = useState(() => normalizeLocks(loadJsonStorage(LOCKS_KEY, createEmptyLocks())));
  const [previewGenerationNonce, setPreviewGenerationNonce] = useState(0);
  const [page2Profile, setPage2Profile] = useState(() => loadJsonStorage(PAGE2_PROFILE_KEY, createEmptyPage2Profile()));
  const [page3Profile, setPage3Profile] = useState(() => loadJsonStorage(PAGE3_PROFILE_KEY, createEmptyPage3Profile()));
  const [page5Profile, setPage5Profile] = useState(() => coerceSunoProfile(loadJsonStorage(PAGE5_PROFILE_KEY, createEmptySunoProfile())));
  const [copiedLabel, setCopiedLabel] = useState('');
  const [isImportPromptOpen, setIsImportPromptOpen] = useState(false);
  const [importPromptText, setImportPromptText] = useState('');
  const [favoriteCloudAuth, setFavoriteCloudAuth] = useState({ status: 'loading', user: null, error: null });
  const [favoriteCloudSyncStatus, setFavoriteCloudSyncStatus] = useState('local-only');
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const promptsRef = useRef(prompts);
  const favoritePromptsRef = useRef(favoritePrompts);
  const favoriteCloudAuthRef = useRef(favoriteCloudAuth);
  const favoriteCloudSyncReadyRef = useRef(false);
  const favoriteCloudMutationTimerRef = useRef(null);
  const favoriteCloudPendingMutationsRef = useRef({
    clear: false,
    upserts: new Map(),
    deletes: new Set(),
  });

  const showToast = useCallback((label) => {
    setCopiedLabel(label);
    window.setTimeout(() => setCopiedLabel(''), 1800);
  }, []);

  const showStorageWarning = useCallback((label) => {
    if (storageWarningRef.current === label) return;
    storageWarningRef.current = label;
    showToast(label);
  }, [showToast]);

  const clearStorageWarning = useCallback((channel) => {
    if (channel === 'prompts' && storageWarningRef.current.includes('Feed')) {
      storageWarningRef.current = '';
    }
    if (channel === 'favorites' && storageWarningRef.current.includes('Favorites')) {
      storageWarningRef.current = '';
    }
  }, []);

  useEffect(() => {
    promptsRef.current = prompts;
  }, [prompts]);

  useEffect(() => {
    favoritePromptsRef.current = favoritePrompts;
  }, [favoritePrompts]);

  useEffect(() => {
    favoriteCloudAuthRef.current = favoriteCloudAuth;
  }, [favoriteCloudAuth]);

  useEffect(() => () => {
    if (favoriteCloudMutationTimerRef.current) {
      window.clearTimeout(favoriteCloudMutationTimerRef.current);
    }
  }, []);

  const scheduleFavoriteCloudMutationFlush = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (favoriteCloudMutationTimerRef.current) {
      window.clearTimeout(favoriteCloudMutationTimerRef.current);
    }

    favoriteCloudMutationTimerRef.current = window.setTimeout(async () => {
      favoriteCloudMutationTimerRef.current = null;
      const currentAuth = favoriteCloudAuthRef.current;

      if (currentAuth.status !== 'signed-in' || !currentAuth.user) {
        favoriteCloudPendingMutationsRef.current = {
          clear: false,
          upserts: new Map(),
          deletes: new Set(),
        };
        return;
      }

      if (!favoriteCloudSyncReadyRef.current) {
        return;
      }

      const pending = favoriteCloudPendingMutationsRef.current;
      favoriteCloudPendingMutationsRef.current = {
        clear: false,
        upserts: new Map(),
        deletes: new Set(),
      };

      const upserts = [...pending.upserts.values()];
      const deletes = [...pending.deletes].filter((id) => !pending.upserts.has(id));
      if (!pending.clear && upserts.length === 0 && deletes.length === 0) {
        return;
      }

      setFavoriteCloudSyncStatus('saving');
      try {
        const {
          clearCloudFavorites,
          deleteCloudFavorite,
          saveCloudFavorite,
          saveCloudFavorites,
        } = await loadFavoriteCloudRepository();

        if (pending.clear) {
          await clearCloudFavorites(currentAuth.user.uid);
        }

        if (deletes.length > 0) {
          await Promise.all(deletes.map((favoriteId) => deleteCloudFavorite(currentAuth.user.uid, favoriteId)));
        }

        if (upserts.length >= FAVORITES_CLOUD_BATCH_SYNC_THRESHOLD) {
          await saveCloudFavorites(currentAuth.user.uid, upserts);
        } else {
          await Promise.all(upserts.map((favorite) => saveCloudFavorite(currentAuth.user.uid, favorite)));
        }

        setFavoriteCloudSyncStatus('synced');
      } catch (error) {
        console.error('Failed to sync cloud favorite mutations:', error);
        setFavoriteCloudSyncStatus('error');
        favoriteCloudPendingMutationsRef.current = {
          clear: pending.clear || favoriteCloudPendingMutationsRef.current.clear,
          upserts: new Map([...pending.upserts, ...favoriteCloudPendingMutationsRef.current.upserts]),
          deletes: new Set([...pending.deletes, ...favoriteCloudPendingMutationsRef.current.deletes]),
        };
        showToast('Firebase Favorites 同步失敗，已保留本機資料');
      }
    }, FAVORITES_CLOUD_SYNC_DELAY_MS);
  }, [showToast]);

  const queueFavoriteCloudUpsert = useCallback((prompt) => {
    const serializedFavorite = serializeFavoritePrompt(prompt);
    if (!serializedFavorite?.i) return;
    const pending = favoriteCloudPendingMutationsRef.current;
    if (!pending.clear) pending.deletes.delete(serializedFavorite.i);
    pending.upserts.set(serializedFavorite.i, serializedFavorite);
    scheduleFavoriteCloudMutationFlush();
  }, [scheduleFavoriteCloudMutationFlush]);

  const queueFavoriteCloudUpserts = useCallback((promptsToSync) => {
    const pending = favoriteCloudPendingMutationsRef.current;
    promptsToSync.forEach((prompt) => {
      const serializedFavorite = serializeFavoritePrompt(prompt);
      if (!serializedFavorite?.i) return;
      if (!pending.clear) pending.deletes.delete(serializedFavorite.i);
      pending.upserts.set(serializedFavorite.i, serializedFavorite);
    });
    scheduleFavoriteCloudMutationFlush();
  }, [scheduleFavoriteCloudMutationFlush]);

  const queueFavoriteCloudDelete = useCallback((favoriteId) => {
    if (!favoriteId) return;
    const pending = favoriteCloudPendingMutationsRef.current;
    pending.upserts.delete(favoriteId);
    if (!pending.clear) pending.deletes.add(favoriteId);
    scheduleFavoriteCloudMutationFlush();
  }, [scheduleFavoriteCloudMutationFlush]);

  const queueFavoriteCloudClear = useCallback(() => {
    favoriteCloudPendingMutationsRef.current = {
      clear: true,
      upserts: new Map(),
      deletes: new Set(),
    };
    scheduleFavoriteCloudMutationFlush();
  }, [scheduleFavoriteCloudMutationFlush]);

  const addFavoritePrompt = useCallback((prompt) => {
    setFavoritePrompts((prev) => [prompt, ...prev]);
    queueFavoriteCloudUpsert(prompt);
  }, [queueFavoriteCloudUpsert]);

  useEffect(() => {
    let isCancelled = false;
    let unsubscribe = () => {};

    loadFavoriteCloudRepository()
      .then(({ loadCloudFavorites, subscribeToFavoriteAuth }) => {
        if (isCancelled) return;

        unsubscribe = subscribeToFavoriteAuth((nextAuthState) => {
          favoriteCloudSyncReadyRef.current = false;
          setFavoriteCloudAuth(nextAuthState);

          if (nextAuthState.status !== 'signed-in' || !nextAuthState.user) {
            setFavoriteCloudSyncStatus(nextAuthState.status === 'disabled' ? 'disabled' : 'local-only');
            return;
          }

          setFavoriteCloudSyncStatus('loading');
          loadCloudFavorites(nextAuthState.user.uid)
            .then((cloudFavorites) => {
              if (isCancelled) return;
              const hydratedCloudFavorites = deserializeFavoritePromptCollection(cloudFavorites);
              const mergedFavorites = mergeFavoritePrompts(hydratedCloudFavorites, favoritePromptsRef.current);
              setFavoritePrompts(mergedFavorites);
              favoriteCloudSyncReadyRef.current = true;
              setFavoriteCloudSyncStatus('synced');
              if (mergedFavorites.length > hydratedCloudFavorites.length) {
                favoriteCloudPendingMutationsRef.current = {
                  clear: false,
                  upserts: new Map(
                    mergedFavorites
                      .map(serializeFavoritePrompt)
                      .filter(Boolean)
                      .map((favorite) => [favorite.i, favorite])
                  ),
                  deletes: new Set(),
                };
                scheduleFavoriteCloudMutationFlush();
              }
              const pending = favoriteCloudPendingMutationsRef.current;
              if (!pending.clear && (pending.upserts.size > 0 || pending.deletes.size > 0)) {
                scheduleFavoriteCloudMutationFlush();
              }
            })
            .catch((error) => {
              if (isCancelled) return;
              favoriteCloudSyncReadyRef.current = false;
              console.error('Failed to load cloud favorites:', error);
              setFavoriteCloudSyncStatus('error');
              showToast('Firebase Favorites 載入失敗，暫時使用本機資料');
            });
        });
      })
      .catch((error) => {
        if (isCancelled) return;
        favoriteCloudSyncReadyRef.current = false;
        console.error('Failed to initialize Firebase Favorites:', error);
        setFavoriteCloudAuth({ status: 'disabled', user: null, error: 'Firebase Favorites 無法初始化' });
        setFavoriteCloudSyncStatus('disabled');
      });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [scheduleFavoriteCloudMutationFlush, showToast]);

  useEffect(() => {
    return schedulePromptCollectionPersist(PROMPTS_KEY, prompts, sanitizeStoredPromptCollection, (result) => {
      if (result.failed) {
        showStorageWarning('提示：本機儲存空間已滿，新的 Feed 卡片這次無法完整保存。');
        return;
      }
      if (result.truncatedCount > 0) {
        showStorageWarning(`提示：為避免瀏覽器儲存爆滿，只保留最新 ${prompts.length - result.truncatedCount} 張 Feed 卡片到本機。`);
        return;
      }
      clearStorageWarning('prompts');
    });
  }, [clearStorageWarning, prompts, showStorageWarning]);

  useEffect(() => {
    return schedulePromptCollectionPersist(
      FAVORITES_KEY,
      favoritePrompts,
      (items) => items.map(serializeFavoritePrompt).filter(Boolean),
      (result) => {
        if (result.failed) {
          showStorageWarning('提示：本機儲存空間已滿，這次最愛變更無法完整保存，但畫面不會再白掉。');
          return;
        }
        if (result.truncatedCount > 0) {
          showStorageWarning(`提示：為避免瀏覽器儲存爆滿，只保留最新 ${favoritePrompts.length - result.truncatedCount} 張 Favorites 到本機。`);
          return;
        }
        clearStorageWarning('favorites');
      }
    );
  }, [clearStorageWarning, favoritePrompts, showStorageWarning]);

  useEffect(() => {
    const flushPromptCollections = () => {
      persistPromptCollection(PROMPTS_KEY, promptsRef.current);
      persistPromptCollection(FAVORITES_KEY, favoritePromptsRef.current, (items) =>
        items.map(serializeFavoritePrompt).filter(Boolean)
      );
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPromptCollections();
      }
    };

    window.addEventListener('pagehide', flushPromptCollections);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', flushPromptCollections);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [favoriteCloudAuth]);

  useEffect(() => {
    window.localStorage.setItem(LOCKS_KEY, JSON.stringify(locks));
  }, [locks]);

  useEffect(() => {
    window.localStorage.setItem(PAGE_MODE_KEY, pageMode);
  }, [pageMode]);

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    window.localStorage.setItem(PAGE2_PROFILE_KEY, JSON.stringify(page2Profile));
  }, [page2Profile]);

  useEffect(() => {
    window.localStorage.setItem(PAGE3_PROFILE_KEY, JSON.stringify(page3Profile));
  }, [page3Profile]);

  useEffect(() => {
    window.localStorage.setItem(PAGE5_PROFILE_KEY, JSON.stringify(page5Profile));
  }, [page5Profile]);

  const activeLibrary = useMemo(() => [], []);
  const rawLockControls = useMemo(() => getLockControls(activeLibrary), [activeLibrary]);
  const hasWardrobeLocks = useMemo(() => hasEffectiveWardrobeLocks(locks, rawLockControls), [locks, rawLockControls]);
  const lockControls = useMemo(
    () => rawLockControls.map((control) => {
      if (control.key !== 'framingId' || !hasWardrobeLocks) return control;
      return {
        ...control,
        options: control.options.map((option) => ({
          ...option,
          disabled: isWardrobeIncompatibleCloseupFramingId(option.id, activeLibrary),
        })),
      };
    }),
    [activeLibrary, hasWardrobeLocks, rawLockControls]
  );
  const sceneDependentOptions = useMemo(() => getSceneDependentOptions(activeLibrary, locks), [activeLibrary, locks]);
  const isCloseupMode = useMemo(() => isCloseupModeFramingId(locks.framingId, activeLibrary), [locks.framingId, activeLibrary]);
  const closeupAllowedKeys = useMemo(() => getCloseupAllowedKeys(locks.framingId, activeLibrary), [locks.framingId, activeLibrary]);
  const outfitPresetControl = useMemo(() => lockControls.find((control) => control.key === 'outfitPresetId') || null, [lockControls]);
  const outfitPresetAControl = useMemo(() => lockControls.find((control) => control.key === 'outfitPresetAId') || null, [lockControls]);
  const outfitPresetBControl = useMemo(() => lockControls.find((control) => control.key === 'outfitPresetBId') || null, [lockControls]);
  const selectedOutfitPreset = useMemo(
    () => outfitPresetControl?.options?.find((option) => option.id === locks.outfitPresetId) || null,
    [outfitPresetControl, locks.outfitPresetId]
  );
  const selectedOutfitPresetA = useMemo(
    () => outfitPresetAControl?.options?.find((option) => option.id === locks.outfitPresetAId) || null,
    [outfitPresetAControl, locks.outfitPresetAId]
  );
  const selectedOutfitPresetB = useMemo(
    () => outfitPresetBControl?.options?.find((option) => option.id === locks.outfitPresetBId) || null,
    [outfitPresetBControl, locks.outfitPresetBId]
  );
  const isActivePreset = (preset) => Boolean(preset && preset.zh !== '全無' && preset.en !== 'none');

  const getPresetColorMode = (preset) => preset?.meta?.colorMode || '';
  const hasLockedTargets = (preset) => Array.isArray(preset?.meta?.colorTargets?.locked) && preset.meta.colorTargets.locked.length > 0;

  const shouldShowPresetColorControl = useCallback((controlKey) => {
    const singleMode = getPresetColorMode(selectedOutfitPreset);
    const duoModeA = getPresetColorMode(selectedOutfitPresetA);
    const duoModeB = getPresetColorMode(selectedOutfitPresetB);

    if (controlKey === 'outfitPresetPrimaryColorId') return isActivePreset(selectedOutfitPreset);
    if (controlKey === 'outfitPresetContrastColorId') return singleMode === 'primary_contrast' || singleMode === 'primary_contrast_locked';
    if (controlKey === 'outfitPresetLockedPaletteId') return singleMode === 'primary_contrast_locked' && hasLockedTargets(selectedOutfitPreset);

    if (controlKey === 'outfitPresetAPrimaryColorId') return isActivePreset(selectedOutfitPresetA);
    if (controlKey === 'outfitPresetAContrastColorId') return duoModeA === 'primary_contrast' || duoModeA === 'primary_contrast_locked';
    if (controlKey === 'outfitPresetALockedPaletteId') return duoModeA === 'primary_contrast_locked' && hasLockedTargets(selectedOutfitPresetA);

    if (controlKey === 'outfitPresetBPrimaryColorId') return isActivePreset(selectedOutfitPresetB);
    if (controlKey === 'outfitPresetBContrastColorId') return duoModeB === 'primary_contrast' || duoModeB === 'primary_contrast_locked';
    if (controlKey === 'outfitPresetBLockedPaletteId') return duoModeB === 'primary_contrast_locked' && hasLockedTargets(selectedOutfitPresetB);

    return true;
  }, [selectedOutfitPreset, selectedOutfitPresetA, selectedOutfitPresetB]);
  const coreLockControls = useMemo(
    () => {
      const controlsWithSceneFiltering = lockControls.map((control) => {
        if (control.key === 'locationId') {
          return { ...control, options: sceneDependentOptions.locationOptions };
        }
        if (control.key === 'lightingId') {
          return { ...control, options: sceneDependentOptions.lightingOptions };
        }
        if (control.key === 'lightDirectionId') {
          return { ...control, options: sceneDependentOptions.lightDirectionOptions };
        }
        return control;
      });

      return sortControls(
        controlsWithSceneFiltering.filter((control) => SCENE_CAMERA_CONTROL_ORDER.includes(control.key)),
        SCENE_CAMERA_CONTROL_ORDER
      );
    },
    [lockControls, sceneDependentOptions]
  );
  const characterLockControls = useMemo(
    () =>
      sortControls(
        lockControls.filter((control) => {
          if (locks.subjectCount === 'skeleton') {
            return ['subjectCount', 'poseId', 'specialActionId'].includes(control.key);
          }
          if (!(control.section === 'character' || control.key === 'subjectCount')) return false;
          if (['duoInteractionId', 'duoPoseId'].includes(control.key) && locks.subjectCount !== '2') return false;
          if (control.key === 'specialActionId' && locks.subjectCount !== '1') return false;
          if (['facialFeaturesId', 'hairstyleId', 'hairColorId', 'expressionId', 'poseId'].includes(control.key) && locks.subjectCount === '2') return false;
          if (['facialFeaturesAId', 'facialFeaturesBId', 'hairstyleAId', 'hairstyleBId', 'hairColorAId', 'hairColorBId', 'expressionAId', 'expressionBId', 'duoPoseId'].includes(control.key) && locks.subjectCount !== '2') return false;
          return true;
        }),
        CHARACTER_CONTROL_ORDER
      ),
    [lockControls, locks.subjectCount]
  );
  const wardrobeLockControls = useMemo(
    () =>
      sortControls(
        lockControls.filter((control) => {
          if (locks.subjectCount === 'skeleton') return false;
          const sharedGarmentKeys = [
            'topId', 'topFitId', 'topStylingId', 'topBottomPaletteId', 'topColorId', 'topPatternId',
            'dressId', 'dressColorId', 'pantsId', 'skirtId', 'bottomFitId', 'bottomRiseId', 'bottomColorId', 'bottomPatternId',
          ];
          const duoGarmentKeys = [
            'topAId', 'topBId', 'topFitAId', 'topFitBId', 'topStylingAId', 'topStylingBId',
            'topBottomPaletteAId', 'topBottomPaletteBId', 'topAColorId', 'topBColorId', 'topAPatternId', 'topBPatternId',
            'dressAId', 'dressBId', 'dressAColorId', 'dressBColorId',
            'pantsAId', 'pantsBId', 'skirtAId', 'skirtBId',
            'bottomFitAId', 'bottomFitBId', 'bottomRiseAId', 'bottomRiseBId',
            'bottomAColorId', 'bottomBColorId', 'bottomAPatternId', 'bottomBPatternId',
          ];
          const sharedLayerKeys = ['outerwearId', 'outerwearColorId', 'outerwearPatternId', 'outerwearStylingId', 'legwearId', 'legwearColorId', 'shoesId', 'shoesColorId'];
          const duoLayerKeys = ['outerwearAId', 'outerwearAColorId', 'outerwearAPatternId', 'outerwearAStylingId', 'legwearAId', 'legwearAColorId', 'shoesAId', 'shoesAColorId', 'outerwearBId', 'outerwearBColorId', 'outerwearBPatternId', 'outerwearBStylingId', 'legwearBId', 'legwearBColorId', 'shoesBId', 'shoesBColorId'];
          const sharedAccessoryKeys = ['headAccessoryId', 'eyewearId', 'earringsId', 'neckAccessoryId'];
          const duoAccessoryKeys = ['headAccessoryAId', 'eyewearAId', 'earringsAId', 'neckAccessoryAId', 'headAccessoryBId', 'eyewearBId', 'earringsBId', 'neckAccessoryBId'];
          if (control.section !== 'wardrobe') return false;
          const specialOutfitActive = locks.subjectCount === '2'
            ? (
                (Boolean(locks.specialOutfitAId) && !isNoneSelected('specialOutfitAId', locks.specialOutfitAId, lockControls)) ||
                (Boolean(locks.specialOutfitBId) && !isNoneSelected('specialOutfitBId', locks.specialOutfitBId, lockControls))
              )
            : Boolean(locks.specialOutfitId) && !isNoneSelected('specialOutfitId', locks.specialOutfitId, lockControls);
          if (['specialOutfitId'].includes(control.key) && locks.subjectCount === '2') return false;
          if (['specialOutfitAId', 'specialOutfitBId'].includes(control.key) && locks.subjectCount !== '2') return false;
          if (specialOutfitActive && !['specialOutfitId', 'specialOutfitAId', 'specialOutfitBId'].includes(control.key)) return false;
          if (['dressId', 'dressAId', 'dressBId', 'dressColorId', 'dressAColorId', 'dressBColorId'].includes(control.key)) return false;
          if (['outfitPresetId', 'outfitPresetPrimaryColorId', 'outfitPresetContrastColorId', 'outfitPresetLockedPaletteId'].includes(control.key) && locks.subjectCount === '2') return false;
          if (['outfitPresetAId', 'outfitPresetAPrimaryColorId', 'outfitPresetAContrastColorId', 'outfitPresetALockedPaletteId', 'outfitPresetBId', 'outfitPresetBPrimaryColorId', 'outfitPresetBContrastColorId', 'outfitPresetBLockedPaletteId'].includes(control.key) && locks.subjectCount !== '2') return false;
          if (sharedGarmentKeys.includes(control.key) && locks.subjectCount === '2') return false;
          if (duoGarmentKeys.includes(control.key) && locks.subjectCount !== '2') return false;
          if (sharedLayerKeys.includes(control.key) && locks.subjectCount === '2') return false;
          if (duoLayerKeys.includes(control.key) && locks.subjectCount !== '2') return false;
          if (sharedAccessoryKeys.includes(control.key) && locks.subjectCount === '2') return false;
          if (duoAccessoryKeys.includes(control.key) && locks.subjectCount !== '2') return false;
          if (control.key.startsWith('outfitPreset') && !control.key.endsWith('Id') && !shouldShowPresetColorControl(control.key)) return false;
          if (['outfitPresetPrimaryColorId', 'outfitPresetContrastColorId', 'outfitPresetLockedPaletteId', 'outfitPresetAPrimaryColorId', 'outfitPresetAContrastColorId', 'outfitPresetALockedPaletteId', 'outfitPresetBPrimaryColorId', 'outfitPresetBContrastColorId', 'outfitPresetBLockedPaletteId'].includes(control.key) && !shouldShowPresetColorControl(control.key)) return false;
          return true;
        }),
        STYLE_WARDROBE_CONTROL_ORDER
      ),
    [lockControls, locks.specialOutfitAId, locks.specialOutfitBId, locks.specialOutfitId, locks.subjectCount, shouldShowPresetColorControl]
  );

  const isOutfitPresetActive = locks.subjectCount === '2'
    ? (
        (Boolean(locks.outfitPresetAId) && !isNoneSelected('outfitPresetAId', locks.outfitPresetAId, wardrobeLockControls)) ||
        (Boolean(locks.outfitPresetBId) && !isNoneSelected('outfitPresetBId', locks.outfitPresetBId, wardrobeLockControls))
      )
    : Boolean(locks.outfitPresetId) && !isNoneSelected('outfitPresetId', locks.outfitPresetId, wardrobeLockControls);

  const displayPrompts = useMemo(() => {
    const baseList = viewMode === 'favorites' ? favoritePrompts : prompts;
    return baseList;
  }, [favoritePrompts, prompts, viewMode]);
  const previewPrompt = useMemo(() => {
    const [prompt] = generatePrompts(1, locks, activeLibrary, { previewGenerationNonce });
    return prompt || null;
  }, [activeLibrary, locks, previewGenerationNonce]);
  const favoriteCloudLabel = useMemo(() => {
    if (favoriteCloudAuth?.status === 'signed-in') {
      if (favoriteCloudSyncStatus === 'loading') return 'Firebase 載入中';
      if (favoriteCloudSyncStatus === 'saving') return 'Firebase 同步中';
      if (favoriteCloudSyncStatus === 'error') return 'Firebase 同步失敗';
      return `Firebase 已同步：${favoriteCloudAuth.user.email}`;
    }
    if (favoriteCloudAuth?.status === 'unauthorized') return favoriteCloudAuth.error || 'Firebase 權限不足';
    if (favoriteCloudAuth?.status === 'disabled') return 'Firebase 尚未設定';
    return 'Favorites 僅存本機';
  }, [favoriteCloudAuth, favoriteCloudSyncStatus]);

  const page2ProfileSummary = useMemo(() => buildPage2ProfileSummary(page2Profile), [page2Profile]);
  const page2ProfileAnchor = useMemo(() => buildPage2ProfileAnchor(page2Profile), [page2Profile]);
  const page2ViewPrompts = useMemo(() => buildPage2ViewPrompts(page2Profile), [page2Profile]);
  const page2IdentityPrompt = useMemo(() => buildPage2IdentityPrompt(page2Profile), [page2Profile]);
  const page2MasterPrompt = useMemo(() => buildPage2MasterPrompt(page2Profile), [page2Profile]);
  const page2CoreViewsBundle = useMemo(() => buildPage2CoreViewsBundle(page2ViewPrompts), [page2ViewPrompts]);
  const page2PromptBundle = useMemo(() => buildPage2PromptBundle(page2Profile, page2ViewPrompts), [page2Profile, page2ViewPrompts]);
  const page3FieldOptions = useMemo(() => {
    const styleControl = lockControls.find((control) => control.key === 'styleId');
    const styleOptions = [
      { id: '', zh: '未指定', en: '' },
      ...(styleControl?.options || []).filter((option) => option.id !== 'style-none'),
    ];

    return {
      ...PAGE3_BASE_FIELD_OPTIONS,
      styleId: styleOptions,
    };
  }, [lockControls]);
  const page3Summary = useMemo(() => buildPage3Summary(page3Profile, page3FieldOptions), [page3Profile, page3FieldOptions]);
  const page3Anchor = useMemo(() => buildPage3Anchor(page3Profile, page3FieldOptions), [page3Profile, page3FieldOptions]);
  const page3Prompt = useMemo(() => buildPage3Prompt(page3Profile, page3FieldOptions), [page3Profile, page3FieldOptions]);
  const page3CinematicPrompt = useMemo(() => buildPage3CinematicPrompt(page3Profile, page3FieldOptions), [page3Profile, page3FieldOptions]);
  const page3WorldPrompt = useMemo(() => buildPage3WorldPrompt(page3Profile, page3FieldOptions), [page3Profile, page3FieldOptions]);
  const normalizedPage5Profile = useMemo(() => coerceSunoProfile(page5Profile), [page5Profile]);
  const page5Summary = useMemo(() => buildSunoSummary(normalizedPage5Profile), [normalizedPage5Profile]);
  const page5StylesPrompt = useMemo(() => buildSunoStylesPrompt(normalizedPage5Profile), [normalizedPage5Profile]);

  useEffect(() => {
    setLocks((prev) => {
      const sanitized = sanitizeLocksForCloseupMode(prev, lockControls);
      return JSON.stringify(prev) === JSON.stringify(sanitized) ? prev : sanitized;
    });
  }, [lockControls]);

  const updateLocks = useCallback((updater) => {
    setLocks((prev) => {
      const candidate = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      const next = sanitizeLocksForCloseupMode({ ...candidate }, lockControls);
      const nextSceneDependentOptions = getSceneDependentOptions(activeLibrary, next);
      const allowedLocationIds = new Set(nextSceneDependentOptions.locationOptions.map((option) => option.id));
      const allowedLightingIds = new Set(nextSceneDependentOptions.lightingOptions.map((option) => option.id));
      const allowedDirectionIds = new Set(nextSceneDependentOptions.lightDirectionOptions.map((option) => option.id));

      if (next.locationId && !allowedLocationIds.has(next.locationId)) {
        next.locationId = '';
      }

      if (next.lightingId && !allowedLightingIds.has(next.lightingId)) {
        next.lightingId = '';
      }

      if (next.lightDirectionId && !allowedDirectionIds.has(next.lightDirectionId)) {
        next.lightDirectionId = '';
      }

      const poseIsActive = Boolean(next.poseId) && !isNoneSelected('poseId', next.poseId, lockControls);
      const specialActionIsActive = Boolean(next.specialActionId) && !isNoneSelected('specialActionId', next.specialActionId, lockControls);
      if (poseIsActive && specialActionIsActive) {
        next.specialActionId = '';
      }

      const specialTopBottomPaletteIsActive = next.topBottomPaletteId && !isNoneSelected('topBottomPaletteId', next.topBottomPaletteId, lockControls);
      const specialTopBottomPaletteAIsActive = next.topBottomPaletteAId && !isNoneSelected('topBottomPaletteAId', next.topBottomPaletteAId, lockControls);
      const specialTopBottomPaletteBIsActive = next.topBottomPaletteBId && !isNoneSelected('topBottomPaletteBId', next.topBottomPaletteBId, lockControls);
      if (specialTopBottomPaletteIsActive) {
        next.topColorId = 'none';
        next.bottomColorId = 'none';
      }
      if (specialTopBottomPaletteAIsActive) {
        next.topAColorId = 'none';
        next.bottomAColorId = 'none';
      }
      if (specialTopBottomPaletteBIsActive) {
        next.topBColorId = 'none';
        next.bottomBColorId = 'none';
      }

      const specialOutfitIsActive = next.subjectCount === '2'
        ? (
            (Boolean(next.specialOutfitAId) && !isNoneSelected('specialOutfitAId', next.specialOutfitAId, lockControls)) ||
            (Boolean(next.specialOutfitBId) && !isNoneSelected('specialOutfitBId', next.specialOutfitBId, lockControls))
          )
        : Boolean(next.specialOutfitId) && !isNoneSelected('specialOutfitId', next.specialOutfitId, lockControls);
      if (specialOutfitIsActive) {
        lockControls.forEach((control) => {
          if (control.section !== 'wardrobe') return;
          if (['specialOutfitId', 'specialOutfitAId', 'specialOutfitBId'].includes(control.key)) return;
          const noneOption = control.options?.find((option) => option.zh === '全無');
          next[control.key] = noneOption ? noneOption.id : '';
        });
      }

      if (next.subjectCount !== '1') {
        next.specialActionId = '';
      }

      return next;
    });
  }, [activeLibrary, lockControls]);

  const handleGenerate = useCallback(() => {
    if (!previewPrompt) return;
    const nextPrompt = {
      ...previewPrompt,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
    };
    nextPrompt.lineage = createLineage(nextPrompt);
    addFavoritePrompt(nextPrompt);
    showToast('目前 Prompt 已加入我的最愛');
  }, [addFavoritePrompt, previewPrompt, showToast]);

  const handleRerollPreview = useCallback(() => {
    setPreviewGenerationNonce((prev) => prev + 1);
    showToast('已依目前設定重新隨機生成');
  }, [showToast]);

  const handleDeletePrompt = useCallback((prompt) => {
    setPrompts((prev) => prev.filter((item) => item.id !== prompt.id));
    setFavoritePrompts((prev) => prev.filter((item) => item.id !== prompt.id));
    queueFavoriteCloudDelete(prompt.id);
  }, [queueFavoriteCloudDelete]);

  const handleDownloadAll = (items = displayPrompts) => {
    if (items.length === 0) return;
    const zip = new JSZip();
    items.forEach((data) => {
      zip.file(`prompt_${data.id}.md`, buildMarkdownExport(data));
    });
    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, `virtual_photography_prompts_${Date.now()}.zip`);
    });
  };

  const handleClearFavorites = () => {
    setFavoritePrompts([]);
    queueFavoriteCloudClear();
    showToast('Favorites 已清空');
  };

  const handleSignInFavorites = useCallback(async () => {
    try {
      const { signInToFavorites } = await loadFavoriteCloudRepository();
      await signInToFavorites();
      setIsSettingsMenuOpen(false);
    } catch (error) {
      console.error('Firebase sign-in failed:', error);
      showToast('Firebase 登入失敗，請稍後再試');
    }
  }, [showToast]);

  const handleSignOutFavorites = useCallback(async () => {
    try {
      const { signOutFromFavorites } = await loadFavoriteCloudRepository();
      await signOutFromFavorites();
      setIsSettingsMenuOpen(false);
      showToast('Firebase 已登出，Favorites 改用本機保存');
    } catch (error) {
      console.error('Firebase sign-out failed:', error);
      showToast('Firebase 登出失敗，請稍後再試');
    }
  }, [showToast]);

  const handleOpenImportFeed = () => {
    importFeedInputRef.current?.click();
  };

  const handleImportFeed = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const zip = await JSZip.loadAsync(file);
      const markdownEntries = Object.values(zip.files)
        .filter((entry) => !entry.dir && entry.name.toLowerCase().endsWith('.md'))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (markdownEntries.length === 0) {
        throw new Error('zip does not contain exported markdown prompts');
      }

      const importedPrompts = [];
      for (const entry of markdownEntries) {
        const markdown = await entry.async('string');
        const idMatch = entry.name.match(/prompt_(.+)\.md$/i);
        const fallbackId = idMatch?.[1] || `${Date.now()}-${importedPrompts.length}`;
        importedPrompts.push(parseExportedMarkdownPrompt(markdown, lockControls, fallbackId));
      }

      setFavoritePrompts((prev) => mergeFavoritePrompts(prev, importedPrompts));
      queueFavoriteCloudUpserts(importedPrompts);
      setViewMode('favorites');
      showToast(`已匯入 ${importedPrompts.length} 張最愛卡片`);
    } catch {
      showToast('ZIP 格式錯誤，無法匯入 Favorites');
    }
  };

  const handleCopyText = async (label, text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLabel(label);
      window.setTimeout(() => setCopiedLabel(''), 1800);
    } catch {
      setCopiedLabel('Copy failed');
      window.setTimeout(() => setCopiedLabel(''), 1800);
    }
  };

  const applyLocksToConsole = useCallback((nextLocks, successLabel) => {
    const restoredLocks = buildRestoreLocks(nextLocks, lockControls);
    updateLocks(() => normalizeLocks(restoredLocks));
    setPageMode('page1');
    showToast(successLabel);
  }, [lockControls, showToast, updateLocks]);

  const handleApplyImportedPrompt = () => {
    const { locks: parsedLocks, matchedControls } = parseLocksFromStandardPrompt(importPromptText, lockControls);
    if (matchedControls.length === 0) {
      showToast('沒有解析到可回填的標準欄位');
      return;
    }
    applyLocksToConsole(parsedLocks, `已回填 ${matchedControls.length} 個欄位到主控台`);
    setIsImportPromptOpen(false);
    setImportPromptText('');
  };
  const handleSavePage2Card = useCallback(() => {
    if (!page2PromptBundle) {
      showToast('請先完成角色設定再加入 Saved Cards');
      return;
    }

    const nextCard = buildPage2SavedCard(
      page2Profile,
      page2ProfileSummary,
      page2ProfileAnchor,
      page2MasterPrompt,
      page2CoreViewsBundle,
      page2PromptBundle
    );
    addFavoritePrompt(nextCard);
    setViewMode('favorites');
    setPageMode('page4');
    showToast('角色建模 Prompt 已加入 Saved Cards');
  }, [addFavoritePrompt, page2CoreViewsBundle, page2MasterPrompt, page2Profile, page2ProfileAnchor, page2ProfileSummary, page2PromptBundle, showToast]);

  const handleSavePage3Card = useCallback(() => {
    if (!page3Prompt) {
      showToast('請先完成場景設定再加入 Saved Cards');
      return;
    }

    const nextCard = buildPage3SavedCard(
      page3Profile,
      page3Summary,
      page3Anchor,
      page3Prompt,
      page3CinematicPrompt,
      page3WorldPrompt
    );
    addFavoritePrompt(nextCard);
    setViewMode('favorites');
    setPageMode('page4');
    showToast('場景建模 Prompt 已加入 Saved Cards');
  }, [addFavoritePrompt, page3Anchor, page3CinematicPrompt, page3Profile, page3Prompt, page3Summary, page3WorldPrompt, showToast]);

  const handleRandomizePage5Profile = useCallback(() => {
    setPage5Profile(buildRandomSunoProfile());
    showToast('已生成一組新的 SUNO 風格組合');
  }, [showToast]);

  const handleSavePage5Card = useCallback(() => {
    if (!page5StylesPrompt) {
      showToast('請先完成 SUNO 風格設定再加入 Saved Cards');
      return;
    }

    const nextCard = buildSunoSavedCard(normalizedPage5Profile);
    addFavoritePrompt(nextCard);
    setViewMode('favorites');
    setPageMode('page4');
    showToast('SUNO Styles Prompt 已加入 Saved Cards');
  }, [addFavoritePrompt, normalizedPage5Profile, page5StylesPrompt, showToast]);
  const pageHeaderCopy = PAGE_MODE_COPY[pageMode] || PAGE_MODE_COPY.page1;

  return (
    <div className="container">
      <header className="page-header">
        <div className="page-header-content">
          <p className="eyebrow">Virtual Photography Studio</p>
          <h1>{pageHeaderCopy.title}</h1>
          <p className="subtitle">{pageHeaderCopy.subtitle}</p>
          <div className="page-header-toolbar">
            <div className="page-mode-switch" role="tablist" aria-label="Page mode switch">
              <button
                type="button"
                className={pageMode === 'page1' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
                onClick={() => setPageMode('page1')}
              >
                Prompt 工作台
              </button>
              <button
                type="button"
                className={pageMode === 'page2' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
                onClick={() => setPageMode('page2')}
              >
                角色建模
              </button>
              <button
                type="button"
                className={pageMode === 'page3' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
                onClick={() => setPageMode('page3')}
              >
                場景建模
              </button>
              <button
                type="button"
                className={pageMode === 'page5' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
                onClick={() => setPageMode('page5')}
              >
                SUNO
              </button>
              <button
                type="button"
                className={pageMode === 'page4' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
                onClick={() => setPageMode('page4')}
              >
                Saved Cards
              </button>
            </div>

            <div className="site-settings">
              <button
                type="button"
                className="settings-trigger"
                aria-label="Open settings"
                aria-expanded={isSettingsMenuOpen}
                onClick={() => setIsSettingsMenuOpen((prev) => !prev)}
              >
                設置
              </button>
              {isSettingsMenuOpen ? (
                <div className="settings-menu">
                  <div className="settings-menu-title">Settings</div>
                  <div className={`settings-menu-status sync-status-${favoriteCloudSyncStatus}`}>
                    {favoriteCloudLabel}
                  </div>
                  {favoriteCloudAuth?.status === 'signed-in' ? (
                    <button className="secondary" onClick={handleSignOutFavorites}>
                      Sign Out Firebase
                    </button>
                  ) : (
                    <button className="secondary" onClick={handleSignInFavorites} disabled={favoriteCloudAuth?.status === 'disabled'}>
                      Sign In Firebase
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {pageMode === 'page1' ? (
        <Page1Workspace
          coreLockControls={coreLockControls}
          characterLockControls={characterLockControls}
          wardrobeLockControls={wardrobeLockControls}
          locks={locks}
          isCloseupMode={isCloseupMode}
          closeupAllowedKeys={closeupAllowedKeys}
          isNoneSelected={isNoneSelected}
          updateLocks={updateLocks}
          handleCopyText={handleCopyText}
          isOutfitPresetActive={isOutfitPresetActive}
          handleGenerate={handleGenerate}
          handleRerollPreview={handleRerollPreview}
          createEmptyLocks={createEmptyLocks}
          buildAllNoneLocks={buildAllNoneLocks}
          lockControls={lockControls}
          previewPrompt={previewPrompt}
          isImportPromptOpen={isImportPromptOpen}
          setIsImportPromptOpen={setIsImportPromptOpen}
          importPromptText={importPromptText}
          setImportPromptText={setImportPromptText}
          handleApplyImportedPrompt={handleApplyImportedPrompt}
        />
      ) : pageMode === 'page2' ? (
        <Page2Workspace
          fieldConfig={PAGE2_FIELD_CONFIG}
          fieldOptions={PAGE2_FIELD_OPTIONS}
          profile={page2Profile}
          setProfile={setPage2Profile}
          profileSummary={page2ProfileSummary}
          profileAnchor={page2ProfileAnchor}
          viewPrompts={page2ViewPrompts}
          identityPrompt={page2IdentityPrompt}
          masterPrompt={page2MasterPrompt}
          coreViewsBundle={page2CoreViewsBundle}
          promptBundle={page2PromptBundle}
          onCopyText={handleCopyText}
          onSaveCard={handleSavePage2Card}
          createEmptyProfile={createEmptyPage2Profile}
        />
      ) : pageMode === 'page3' ? (
        <Page3Workspace
          fieldConfig={PAGE3_FIELD_CONFIG}
          fieldOptions={page3FieldOptions}
          profile={page3Profile}
          setProfile={setPage3Profile}
          summary={page3Summary}
          anchor={page3Anchor}
          prompt={page3Prompt}
          cinematicPrompt={page3CinematicPrompt}
          worldPrompt={page3WorldPrompt}
          onCopyText={handleCopyText}
          onSaveCard={handleSavePage3Card}
          createEmptyProfile={createEmptyPage3Profile}
        />
      ) : pageMode === 'page5' ? (
        <PageSunoWorkspace
          profile={normalizedPage5Profile}
          setProfile={setPage5Profile}
          summary={page5Summary}
          stylesPrompt={page5StylesPrompt}
          onCopyText={handleCopyText}
          onSaveCard={handleSavePage5Card}
          onRandomize={handleRandomizePage5Profile}
          onNotice={showToast}
          createEmptyProfile={createEmptySunoProfile}
        />
      ) : (
        <SavedCardsWorkspace
          prompts={prompts}
          setPrompts={setPrompts}
          viewMode={viewMode}
          setViewMode={setViewMode}
          favoritePrompts={favoritePrompts}
          displayPrompts={displayPrompts}
          handleDownloadAll={handleDownloadAll}
          handleClearFavorites={handleClearFavorites}
          importFeedInputRef={importFeedInputRef}
          handleOpenImportFeed={handleOpenImportFeed}
          handleImportFeed={handleImportFeed}
          handleDeletePrompt={handleDeletePrompt}
        />
      )}

      {copiedLabel ? <div className="toast">{copiedLabel}</div> : null}
    </div>
  );
}
