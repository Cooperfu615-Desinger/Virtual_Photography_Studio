import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Settings } from 'lucide-react';
import Page1Workspace from './components/Page1Workspace';
import Page2Workspace from './components/Page2Workspace';
import Page3Workspace from './components/Page3Workspace';
import {
  buildLocksFromPrompt,
  createEmptyLocks,
  generatePrompts,
  getKnowledgeBaseOptions,
  getCloseupAllowedKeys,
  getKnowledgeBaseSnapshot,
  getSceneDependentOptions,
  getLockControls,
  isCloseupModeFramingId,
  normalizeLocks,
  sanitizeLocksForCloseupMode
} from './lib/engine';
import './index.css';

const PROMPTS_KEY = 'vps.prompts';
const FAVORITES_KEY = 'vps.favorites';
const LOCKS_KEY = 'vps.locks';
const GEN_COUNT_KEY = 'vps.genCount';
const VIEW_MODE_KEY = 'vps.viewMode';
const LIBRARY_DRAFT_KEY = 'vps.libraryDraft';
const PAGE_MODE_KEY = 'vps.pageMode';
const PAGE2_PROFILE_KEY = 'vps.page2Profile';
const PAGE3_PROFILE_KEY = 'vps.page3Profile';
const FAVORITES_STORAGE_VERSION = 2;
let favoriteCloudRepositoryPromise = null;
const STORAGE_BUDGETS = {
  [PROMPTS_KEY]: 2_250_000,
  [FAVORITES_KEY]: 2_250_000,
};
const STORAGE_PERSIST_DELAY_MS = 300;
const STORAGE_IDLE_TIMEOUT_MS = 1000;
const FAVORITES_CLOUD_SYNC_DELAY_MS = 900;

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
const SUMMARY_SECTION_INFO = {
  style: {
    label: '風格',
    lockLabels: ['攝影風格'],
    keys: ['styleId'],
  },
  character: {
    label: '人物',
    lockLabels: ['人數', '體態', '五官', '膚質', '髮型', '髮色', '雙人互動', '表情', '人物 1 表情', '人物 2 表情', '姿勢', '特殊動作'],
    keys: [
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
      'expressionId',
      'expressionAId',
      'expressionBId',
      'poseId',
      'specialActionId',
    ],
  },
  wardrobe: {
    label: '服裝',
    lockLabels: ['套裝', '套裝主色', '套裝對比色', '套裝鎖定色方案', '上身', '特殊上下身配色', '上身圖案', '連身', '下身', '下身圖案', '襪類', '襪類配色', '外套', '外套圖案', '外套穿法', '鞋款', '配件'],
    keys: [
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
      'topBottomPaletteId',
      'topColorId',
      'topPatternId',
      'dressId',
      'dressColorId',
      'duoStylingId',
      'pantsId',
      'skirtId',
      'bottomColorId',
      'bottomPatternId',
      'legwearId',
      'legwearColorId',
      'outerwearId',
      'outerwearColorId',
      'outerwearPatternId',
      'outerwearStylingId',
      'shoesId',
      'shoesColorId',
      'headAccessoryId',
      'eyewearId',
      'earringsId',
      'neckAccessoryId',
      'wristAccessoryId',
      'ringId',
      'waistAccessoryId',
    ],
  },
  location: {
    label: '場景',
    lockLabels: ['場景屬性', '場景'],
    keys: ['sceneAttributeId', 'locationId'],
  },
  camera: {
    label: '鏡頭',
    lockLabels: ['畫面比例', '景別', '角度', '方位', '焦段', '光學效果', '成像風格'],
    keys: ['aspectRatio', 'framingId', 'angleId', 'orbitId', 'lensId', 'opticalEffectId', 'filmId'],
  },
  lighting: {
    label: '光影',
    lockLabels: ['環境光氛', '光線表現'],
    keys: ['lightingId', 'lightDirectionId'],
  },
};
const ADVANCED_REMIX_GROUP_INFO = {
  characterDna: {
    label: '角色 DNA',
    lockLabels: ['人數', '體態', '五官', '膚質', '髮型', '髮色', '雙人互動'],
    keys: [
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
    ],
  },
  expressionPose: {
    label: '表情姿勢',
    lockLabels: ['表情', '人物 1 表情', '人物 2 表情', '姿勢', '特殊動作'],
    keys: ['expressionId', 'expressionAId', 'expressionBId', 'poseId', 'specialActionId'],
  },
  wardrobeCore: {
    label: '服裝主體',
    lockLabels: ['套裝', '套裝主色', '套裝對比色', '套裝鎖定色方案', '上身', '特殊上下身配色', '上身圖案', '連身', '下身', '下身圖案', '外套', '外套圖案', '外套穿法', '襪類', '鞋款'],
    keys: [
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
      'topBottomPaletteId',
      'topColorId',
      'topPatternId',
      'dressId',
      'dressColorId',
      'duoStylingId',
      'pantsId',
      'skirtId',
      'bottomColorId',
      'bottomPatternId',
      'legwearId',
      'legwearColorId',
      'outerwearId',
      'outerwearColorId',
      'outerwearPatternId',
      'outerwearStylingId',
      'shoesId',
      'shoesColorId',
    ],
  },
  sceneLook: {
    label: '場景鏡頭',
    lockLabels: ['場景屬性', '場景', '鏡頭', '光影'],
    keys: ['sceneAttributeId', 'locationId', 'aspectRatio', 'framingId', 'angleId', 'orbitId', 'lensId', 'opticalEffectId', 'filmId', 'lightingId', 'lightDirectionId'],
  },
};
const REMIX_GROUP_INFO = { ...SUMMARY_SECTION_INFO, ...ADVANCED_REMIX_GROUP_INFO };
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
  'expressionId',
  'expressionAId',
  'expressionBId',
  'poseId',
  'specialActionId',
];
const SCENE_CAMERA_CONTROL_ORDER = ['styleId', 'sceneAttributeId', 'locationId', 'lightingId', 'lightDirectionId', 'angleId', 'orbitId', 'framingId', 'lensId', 'opticalEffectId', 'filmId', 'aspectRatio'];
const SCENE_CAMERA_SIMPLIFIED_ORDER = ['styleId', 'sceneAttributeId', 'locationId', 'angleId', 'orbitId', 'framingId', 'lensId', 'opticalEffectId', 'aspectRatio'];
const STYLE_WARDROBE_CONTROL_ORDER = [
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
  'topBottomPaletteId',
  'topColorId',
  'topPatternId',
  'dressId',
  'dressColorId',
  'duoStylingId',
  'pantsId',
  'skirtId',
  'bottomColorId',
  'bottomPatternId',
  'legwearId',
  'legwearColorId',
  'outerwearId',
  'outerwearColorId',
  'outerwearPatternId',
  'outerwearStylingId',
  'shoesId',
  'shoesColorId',
  'headAccessoryId',
  'eyewearId',
  'earringsId',
  'neckAccessoryId',
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
  const selected = control?.options.find((option) => option.id === value);
  return selected?.zh === '全無';
}

function buildMarkdownExport(data) {
  return `# Generated Prompt - ${new Date(data.date).toLocaleString()}
**Summary:** ${data.summary}

## Midjourney Prompt
\`\`\`text
${data.midjourneyPrompt}
\`\`\`

## Grok Structured Prompt
\`\`\`text
${data.grokPrompt}
\`\`\`

## Z-Image Prompt
\`\`\`text
${data.zImagePrompt || ''}
\`\`\`

---

## Structured Scheme
${Object.entries(data.structured)
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
      'topBottomPaletteId',
      'topColorId',
      'topPatternId',
      'dressId',
      'dressColorId',
      'duoStylingId',
      'pantsId',
      'skirtId',
      'bottomColorId',
      'bottomPatternId',
      'legwearId',
      'legwearColorId',
      'outerwearId',
      'outerwearColorId',
      'outerwearPatternId',
      'outerwearStylingId',
      'shoesId',
      'shoesColorId',
      'headAccessoryId',
      'eyewearId',
      'earringsId',
      'neckAccessoryId',
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
  const midjourneyMatch = text.match(/## Midjourney Prompt\n```text\n([\s\S]*?)\n```/);
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

function buildNextLineage(previousPrompt, nextPrompt, summaryKeys, { branch = false } = {}) {
  const previousLineage = previousPrompt.lineage || createLineage(previousPrompt);
  return {
    rootId: previousLineage.rootId || previousPrompt.id,
    rootShortId: previousLineage.rootShortId || toShortPromptId(previousLineage.rootId || previousPrompt.id),
    parentId: previousPrompt.id,
    parentShortId: toShortPromptId(previousPrompt.id),
    version: (previousLineage.version || 1) + 1,
    remixCount: (previousLineage.remixCount || 0) + 1,
    lastMode: branch ? 'branch' : 'replace',
    lastLocked: summaryKeys.map((key) => REMIX_GROUP_INFO[key]?.label).filter(Boolean),
  };
}

function selectionKeysEqual(previous, next, keys) {
  return keys.every((key) => (previous?.selection?.[key] || '') === (next?.selection?.[key] || ''));
}

function buildRemixMeta(previousPrompt, nextPrompt, lockedSections) {
  const kept = [];
  const changed = [];
  const adjusted = [];
  const sectionStates = {};

  Object.entries(SUMMARY_SECTION_INFO).forEach(([sectionKey, section]) => {
    const isLocked = lockedSections.includes(sectionKey);
    const isSame = selectionKeysEqual(previousPrompt, nextPrompt, section.keys);

    if (isLocked && isSame) kept.push(section.label);
    if (isLocked && !isSame) adjusted.push(section.label);
    if (!isLocked && !isSame) changed.push(section.label);

    sectionStates[sectionKey] = isLocked
      ? (isSame ? 'kept' : 'adjusted')
      : (isSame ? 'unchanged' : 'changed');
  });

  return {
    locked: lockedSections.map((key) => REMIX_GROUP_INFO[key]?.label).filter(Boolean),
    kept,
    changed,
    adjusted,
    sectionStates,
    previousSummaryFields: previousPrompt.summaryFields || {},
    nextSummaryFields: nextPrompt.summaryFields || {},
    sourceShortId: toShortPromptId(previousPrompt.id),
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

  const rawSelection = prompt.selection && typeof prompt.selection === 'object'
    ? prompt.selection
    : null;
  const selection = rawSelection
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
    date: prompt.date || new Date().toISOString(),
    summary: String(prompt.summary || ''),
    summaryFields,
    midjourneyPrompt: String(prompt.midjourneyPrompt || ''),
    grokPrompt: String(prompt.grokPrompt || ''),
    zImagePrompt: String(prompt.zImagePrompt || ''),
    selection,
    structured,
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
    d: sanitized.date,
    s: sanitized.summary,
    m: sanitized.midjourneyPrompt,
    g: sanitized.grokPrompt,
    z: sanitized.zImagePrompt,
    l: compactPromptSelection(sanitized.selection),
    n: sanitized.lineage,
    r: sanitized.remixMeta,
  };
}

function deserializeFavoritePrompt(record) {
  if (!record || typeof record !== 'object') return null;

  if (record.v === FAVORITES_STORAGE_VERSION && record.i) {
    return sanitizeStoredPrompt({
      id: record.i,
      date: record.d,
      summary: record.s,
      midjourneyPrompt: record.m,
      grokPrompt: record.g,
      zImagePrompt: record.z,
      selection: record.l,
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

function createEntryKey(group, category, index) {
  return `${group}::${category}::${index}`;
}

function buildLibraryDraftSummary(baseSnapshot, draftSnapshot) {
  if (!draftSnapshot) return '';

  const lines = [];
  const groupMap = {
    Regional: 'Photography Style',
    Locations: 'Location',
    Wardrobe: 'Wardrobe',
    Character: 'Character',
    CameraLighting: 'Camera & Lighting',
    Negative: 'Negative',
  };

  Object.entries(draftSnapshot).forEach(([groupKey, categories]) => {
    Object.entries(categories || {}).forEach(([categoryKey, items]) => {
      const baseItems = baseSnapshot?.[groupKey]?.[categoryKey] || [];
      items.forEach((item, index) => {
        const baseItem = baseItems[index];
        const normalizedItem = {
          zh: item?.zh || '',
          en: item?.en || '',
          desc: item?.desc || '',
        };
        const normalizedBase = {
          zh: baseItem?.zh || '',
          en: baseItem?.en || '',
          desc: baseItem?.desc || '',
        };

        if (!baseItem) {
          lines.push(`[新增] ${groupMap[groupKey] || groupKey} / ${categoryKey} / ${normalizedItem.zh || normalizedItem.en}`);
          lines.push(`en: ${normalizedItem.en}`);
          if (normalizedItem.desc) lines.push(`desc: ${normalizedItem.desc}`);
          lines.push('');
          return;
        }

        if (
          normalizedItem.zh !== normalizedBase.zh
          || normalizedItem.en !== normalizedBase.en
          || normalizedItem.desc !== normalizedBase.desc
        ) {
          lines.push(`[修改] ${groupMap[groupKey] || groupKey} / ${categoryKey} / ${normalizedBase.zh || normalizedBase.en}`);
          if (normalizedItem.zh !== normalizedBase.zh) lines.push(`zh: ${normalizedBase.zh} -> ${normalizedItem.zh}`);
          if (normalizedItem.en !== normalizedBase.en) lines.push(`en: ${normalizedBase.en} -> ${normalizedItem.en}`);
          if (normalizedItem.desc !== normalizedBase.desc) lines.push(`desc: ${normalizedBase.desc} -> ${normalizedItem.desc}`);
          lines.push('');
        }
      });
    });
  });

  return lines.join('\n').trim();
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
  const [genCount, setGenCount] = useState(() => loadJsonStorage(GEN_COUNT_KEY, 3));
  const [pageMode, setPageMode] = useState(() => loadStringStorage(PAGE_MODE_KEY, 'page1'));
  const [viewMode, setViewMode] = useState(() => loadStringStorage(VIEW_MODE_KEY, 'feed'));
  const [locks, setLocks] = useState(() => normalizeLocks(loadJsonStorage(LOCKS_KEY, createEmptyLocks())));
  const [libraryDraft, setLibraryDraft] = useState(() => loadJsonStorage(LIBRARY_DRAFT_KEY, null));
  const [page2Profile, setPage2Profile] = useState(() => loadJsonStorage(PAGE2_PROFILE_KEY, createEmptyPage2Profile()));
  const [page3Profile, setPage3Profile] = useState(() => loadJsonStorage(PAGE3_PROFILE_KEY, createEmptyPage3Profile()));
  const [libraryGroup, setLibraryGroup] = useState('Character');
  const [libraryCategory, setLibraryCategory] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  const [selectedEntryKey, setSelectedEntryKey] = useState('');
  const [editorDraft, setEditorDraft] = useState({ zh: '', en: '', desc: '' });
  const [editorMode, setEditorMode] = useState('edit');
  const [copiedLabel, setCopiedLabel] = useState('');
  const [isImportPromptOpen, setIsImportPromptOpen] = useState(false);
  const [importPromptText, setImportPromptText] = useState('');
  const [favoriteCloudAuth, setFavoriteCloudAuth] = useState({ status: 'loading', user: null, error: null });
  const [favoriteCloudSyncStatus, setFavoriteCloudSyncStatus] = useState('local-only');
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const promptsRef = useRef(prompts);
  const favoritePromptsRef = useRef(favoritePrompts);
  const favoriteCloudSyncReadyRef = useRef(false);
  const favoriteCloudLastSignatureRef = useRef('');

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
              setFavoritePrompts((prev) => mergeFavoritePrompts(hydratedCloudFavorites, prev));
              favoriteCloudSyncReadyRef.current = true;
              setFavoriteCloudSyncStatus('synced');
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
  }, [showToast]);

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
    if (favoriteCloudAuth.status !== 'signed-in' || !favoriteCloudAuth.user || !favoriteCloudSyncReadyRef.current) {
      return undefined;
    }

    const serializedFavorites = favoritePrompts.map(serializeFavoritePrompt).filter(Boolean);
    const nextSignature = JSON.stringify(serializedFavorites);
    if (favoriteCloudLastSignatureRef.current === nextSignature) {
      setFavoriteCloudSyncStatus('synced');
      return undefined;
    }

    setFavoriteCloudSyncStatus('saving');
    const timeoutId = window.setTimeout(() => {
      loadFavoriteCloudRepository()
        .then(({ replaceCloudFavorites }) => replaceCloudFavorites(favoriteCloudAuth.user.uid, serializedFavorites))
        .then(() => {
          favoriteCloudLastSignatureRef.current = nextSignature;
          setFavoriteCloudSyncStatus('synced');
        })
        .catch((error) => {
          console.error('Failed to sync cloud favorites:', error);
          setFavoriteCloudSyncStatus('error');
          showToast('Firebase Favorites 同步失敗，已保留本機資料');
        });
    }, FAVORITES_CLOUD_SYNC_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [favoriteCloudAuth, favoritePrompts, showToast]);

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
    window.localStorage.setItem(GEN_COUNT_KEY, JSON.stringify(genCount));
  }, [genCount]);

  useEffect(() => {
    window.localStorage.setItem(PAGE_MODE_KEY, pageMode);
  }, [pageMode]);

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (libraryDraft) {
      window.localStorage.setItem(LIBRARY_DRAFT_KEY, JSON.stringify(libraryDraft));
      return;
    }
    window.localStorage.removeItem(LIBRARY_DRAFT_KEY);
  }, [libraryDraft]);

  useEffect(() => {
    window.localStorage.setItem(PAGE2_PROFILE_KEY, JSON.stringify(page2Profile));
  }, [page2Profile]);

  useEffect(() => {
    window.localStorage.setItem(PAGE3_PROFILE_KEY, JSON.stringify(page3Profile));
  }, [page3Profile]);

  const favoriteIds = useMemo(() => new Set(favoritePrompts.map((prompt) => prompt.id)), [favoritePrompts]);
  const activeLibrary = useMemo(() => libraryDraft || [], [libraryDraft]);
  const baseKnowledgeBaseSnapshot = useMemo(() => getKnowledgeBaseSnapshot(), []);
  const knowledgeBaseOptions = useMemo(() => getKnowledgeBaseOptions(activeLibrary), [activeLibrary]);
  const knowledgeBaseSnapshot = useMemo(() => getKnowledgeBaseSnapshot(activeLibrary), [activeLibrary]);
  const lockControls = useMemo(() => getLockControls(activeLibrary), [activeLibrary]);
  const sceneDependentOptions = useMemo(() => getSceneDependentOptions(activeLibrary, locks), [activeLibrary, locks]);
  const isCloseupMode = useMemo(() => isCloseupModeFramingId(locks.framingId, activeLibrary), [locks.framingId, activeLibrary]);
  const closeupAllowedKeys = useMemo(() => getCloseupAllowedKeys(locks.framingId, activeLibrary), [locks.framingId, activeLibrary]);
  const isPhotographyStyleLocked = Boolean(locks.styleId) && !isNoneSelected('styleId', locks.styleId, lockControls);
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
      const activeOrder = isPhotographyStyleLocked ? SCENE_CAMERA_SIMPLIFIED_ORDER : SCENE_CAMERA_CONTROL_ORDER;
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
        controlsWithSceneFiltering.filter((control) => activeOrder.includes(control.key)),
        activeOrder
      );
    },
    [isPhotographyStyleLocked, lockControls, sceneDependentOptions]
  );
  const characterLockControls = useMemo(
    () =>
      sortControls(
        lockControls.filter((control) => {
          if (!(control.section === 'character' || control.key === 'subjectCount')) return false;
          if (control.key === 'duoInteractionId' && locks.subjectCount !== '2') return false;
          if (control.key === 'specialActionId' && locks.subjectCount !== '1') return false;
          if (['facialFeaturesId', 'hairstyleId', 'hairColorId', 'expressionId'].includes(control.key) && locks.subjectCount === '2') return false;
          if (['facialFeaturesAId', 'facialFeaturesBId', 'hairstyleAId', 'hairstyleBId', 'hairColorAId', 'hairColorBId', 'expressionAId', 'expressionBId'].includes(control.key) && locks.subjectCount !== '2') return false;
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
          if (control.section !== 'wardrobe') return false;
          if (['outfitPresetId', 'outfitPresetPrimaryColorId', 'outfitPresetContrastColorId', 'outfitPresetLockedPaletteId'].includes(control.key) && locks.subjectCount === '2') return false;
          if (['outfitPresetAId', 'outfitPresetAPrimaryColorId', 'outfitPresetAContrastColorId', 'outfitPresetALockedPaletteId', 'outfitPresetBId', 'outfitPresetBPrimaryColorId', 'outfitPresetBContrastColorId', 'outfitPresetBLockedPaletteId'].includes(control.key) && locks.subjectCount !== '2') return false;
          if (control.key.startsWith('outfitPreset') && !control.key.endsWith('Id') && !shouldShowPresetColorControl(control.key)) return false;
          if (['outfitPresetPrimaryColorId', 'outfitPresetContrastColorId', 'outfitPresetLockedPaletteId', 'outfitPresetAPrimaryColorId', 'outfitPresetAContrastColorId', 'outfitPresetALockedPaletteId', 'outfitPresetBPrimaryColorId', 'outfitPresetBContrastColorId', 'outfitPresetBLockedPaletteId'].includes(control.key) && !shouldShowPresetColorControl(control.key)) return false;
          if (control.key === 'duoStylingId' && locks.subjectCount !== '2') return false;
          return true;
        }),
        STYLE_WARDROBE_CONTROL_ORDER
      ),
    [lockControls, locks.subjectCount, shouldShowPresetColorControl]
  );

  const activeLockCount = Object.entries(locks).filter(([key, value]) => {
    if (['subjectCount', 'aspectRatio'].includes(key)) return false;
    if (isPhotographyStyleLocked && ['lightingId', 'lightDirectionId', 'filmId'].includes(key)) return false;
    if (key === 'topBottomPaletteId' && value === 'none') return false;
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }).length;
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

  const activeGroupOption = useMemo(
    () => knowledgeBaseOptions.find((group) => group.value === libraryGroup) || knowledgeBaseOptions[0] || null,
    [knowledgeBaseOptions, libraryGroup]
  );
  const libraryCategories = useMemo(() => activeGroupOption?.categories || [], [activeGroupOption]);
  const effectiveLibraryGroup = activeGroupOption?.value || '';
  const effectiveLibraryCategory = libraryCategory && libraryCategories.includes(libraryCategory)
    ? libraryCategory
    : (libraryCategories[0] || '');
  const libraryEntries = useMemo(() => {
    if (!effectiveLibraryGroup || !effectiveLibraryCategory) return [];
    const entries = knowledgeBaseSnapshot?.[effectiveLibraryGroup]?.[effectiveLibraryCategory] || [];
    const normalized = librarySearch.trim().toLowerCase();
    return entries
      .map((entry, index) => ({
        ...entry,
        entryKey: createEntryKey(effectiveLibraryGroup, effectiveLibraryCategory, index),
        index,
      }))
      .filter((entry) => {
        if (!normalized) return true;
        return [entry.zh, entry.en, entry.desc].join(' ').toLowerCase().includes(normalized);
      });
  }, [knowledgeBaseSnapshot, effectiveLibraryGroup, effectiveLibraryCategory, librarySearch]);
  const selectedLibraryEntry = useMemo(() => {
    if (editorMode === 'new') return null;
    return libraryEntries.find((entry) => entry.entryKey === selectedEntryKey) || libraryEntries[0] || null;
  }, [editorMode, libraryEntries, selectedEntryKey]);
  const libraryDraftSummary = useMemo(
    () => buildLibraryDraftSummary(baseKnowledgeBaseSnapshot, libraryDraft),
    [baseKnowledgeBaseSnapshot, libraryDraft]
  );
  const libraryDraftChangeCount = useMemo(
    () => (libraryDraftSummary ? libraryDraftSummary.split('\n\n').filter(Boolean).length : 0),
    [libraryDraftSummary]
  );
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
      if (specialTopBottomPaletteIsActive) {
        next.topColorId = 'none';
        next.bottomColorId = 'none';
      }

      if (next.subjectCount !== '1') {
        next.specialActionId = '';
      }

      return next;
    });
  }, [activeLibrary, lockControls]);

  const handleGenerate = useCallback(() => {
    const newPrompts = generatePrompts(genCount, locks, activeLibrary).map((prompt) => ({
      ...prompt,
      lineage: createLineage(prompt),
    }));
    setPrompts((prev) => [...newPrompts, ...prev]);
    setViewMode('feed');
  }, [activeLibrary, genCount, locks]);

  const handleRemixPrompt = useCallback((prompt, summaryKeys = [], options = {}) => {
    const { branch = false } = options;
    const keepKeys = Array.from(new Set(summaryKeys.flatMap((key) => SUMMARY_REROLL_MAP[key] || [])));
    const remixLocks = buildLocksFromPrompt(prompt, keepKeys);
    const [generatedPrompt] = generatePrompts(1, remixLocks, activeLibrary);
    const nextPrompt = {
      ...generatedPrompt,
      id: branch ? generatedPrompt.id : prompt.id,
      remixMeta: buildRemixMeta(prompt, generatedPrompt, summaryKeys),
      lineage: buildNextLineage(prompt, generatedPrompt, summaryKeys, { branch }),
    };
    if (branch) {
      setPrompts((prev) => [nextPrompt, ...prev]);
      setViewMode('feed');
      return;
    }

    setPrompts((prev) => prev.map((item) => (item.id === prompt.id ? nextPrompt : item)));
    setFavoritePrompts((prev) => prev.map((item) => (item.id === prompt.id ? nextPrompt : item)));
  }, [activeLibrary]);

  const toggleFavorite = useCallback((prompt) => {
    setFavoritePrompts((prev) => {
      if (prev.some((item) => item.id === prompt.id)) {
        return prev.filter((item) => item.id !== prompt.id);
      }
      return [prompt, ...prev];
    });
  }, []);

  const handleDeletePrompt = useCallback((prompt) => {
    setPrompts((prev) => prev.filter((item) => item.id !== prompt.id));
    setFavoritePrompts((prev) => prev.filter((item) => item.id !== prompt.id));
  }, []);

  const handleDownloadAll = () => {
    if (displayPrompts.length === 0) return;
    const zip = new JSZip();
    displayPrompts.forEach((data) => {
      zip.file(`prompt_${data.id}.md`, buildMarkdownExport(data));
    });
    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, `virtual_photography_prompts_${Date.now()}.zip`);
    });
  };

  const handleClearFavorites = () => {
    setFavoritePrompts([]);
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

  const handleLibraryGroupChange = (nextGroup) => {
    const nextGroupOption = knowledgeBaseOptions.find((group) => group.value === nextGroup) || null;
    const nextCategory = nextGroupOption?.categories?.[0] || '';
    const nextEntry = nextCategory ? (knowledgeBaseSnapshot?.[nextGroup]?.[nextCategory]?.[0] || null) : null;
    setLibraryGroup(nextGroup);
    setLibraryCategory(nextCategory);
    setLibrarySearch('');
    if (nextEntry) {
      setSelectedEntryKey(createEntryKey(nextGroup, nextCategory, 0));
      setEditorMode('edit');
      setEditorDraft({ zh: nextEntry.zh || '', en: nextEntry.en || '', desc: nextEntry.desc || '' });
      return;
    }
    setSelectedEntryKey('');
    setEditorMode('new');
    setEditorDraft({ zh: '', en: '', desc: '' });
  };

  const handleLibraryCategoryChange = (nextCategory) => {
    const nextEntry = nextCategory ? (knowledgeBaseSnapshot?.[effectiveLibraryGroup]?.[nextCategory]?.[0] || null) : null;
    setLibraryCategory(nextCategory);
    setLibrarySearch('');
    if (nextEntry) {
      setSelectedEntryKey(createEntryKey(effectiveLibraryGroup, nextCategory, 0));
      setEditorMode('edit');
      setEditorDraft({ zh: nextEntry.zh || '', en: nextEntry.en || '', desc: nextEntry.desc || '' });
      return;
    }
    setSelectedEntryKey('');
    setEditorMode('new');
    setEditorDraft({ zh: '', en: '', desc: '' });
  };

  const handleSelectLibraryEntry = (entry) => {
    setSelectedEntryKey(entry.entryKey);
    setEditorMode('edit');
    setEditorDraft({ zh: entry.zh || '', en: entry.en || '', desc: entry.desc || '' });
  };

  const handleCreateNewEntry = () => {
    setSelectedEntryKey('');
    setEditorMode('new');
    setEditorDraft({ zh: '', en: '', desc: '' });
  };

  const handleSaveLibraryEntry = () => {
    if (!effectiveLibraryGroup || !effectiveLibraryCategory) return;
    if (!editorDraft.zh.trim() || !editorDraft.en.trim()) return;

    const nextDatabase = structuredClone(knowledgeBaseSnapshot);
    const groupBucket = nextDatabase[effectiveLibraryGroup] || {};
    const categoryItems = Array.isArray(groupBucket[effectiveLibraryCategory]) ? [...groupBucket[effectiveLibraryCategory]] : [];

    if (editorMode === 'edit' && selectedEntryKey) {
      const target = selectedLibraryEntry;
      if (!target) return;
      categoryItems[target.index] = {
        zh: editorDraft.zh.trim(),
        en: editorDraft.en.trim(),
        desc: editorDraft.desc.trim(),
      };
    } else {
      categoryItems.push({
        zh: editorDraft.zh.trim(),
        en: editorDraft.en.trim(),
        desc: editorDraft.desc.trim(),
      });
    }

    nextDatabase[effectiveLibraryGroup] = {
      ...groupBucket,
      [effectiveLibraryCategory]: categoryItems,
    };
    setLibraryDraft(nextDatabase);
    if (editorMode === 'new') {
      const nextKey = createEntryKey(effectiveLibraryGroup, effectiveLibraryCategory, categoryItems.length - 1);
      setSelectedEntryKey(nextKey);
      setEditorMode('edit');
    }
  };

  const handleResetLibraryDraft = () => {
    setLibraryDraft(null);
    setLibrarySearch('');
  };

  const handleGenerateLibraryTest = () => {
    const newPrompts = generatePrompts(1, locks, activeLibrary).map((prompt) => ({
      ...prompt,
      lineage: createLineage(prompt),
    }));
    setPrompts((prev) => [...newPrompts, ...prev]);
    setViewMode('feed');
  };

  const handleCopyLibraryDraftSummary = () => {
    if (!libraryDraftSummary) return;
    handleCopyText('Library draft summary copied', libraryDraftSummary);
  };

  const handleRestorePromptToConsole = useCallback((prompt) => {
    if (!prompt?.selection) {
      showToast('這張卡片沒有可回填的設定');
      return;
    }
    applyLocksToConsole(prompt.selection, '卡片設定已回填到主控台');
  }, [applyLocksToConsole, showToast]);

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

  return (
    <div className="container">
      <header className="page-header">
        <div className="page-header-content">
          <div className="page-mode-switch" role="tablist" aria-label="Page mode switch">
            <button
              type="button"
              className={pageMode === 'page1' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
              onClick={() => setPageMode('page1')}
            >
              PAGE1
            </button>
            <button
              type="button"
              className={pageMode === 'page2' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
              onClick={() => setPageMode('page2')}
            >
              PAGE2
            </button>
            <button
              type="button"
              className={pageMode === 'page3' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
              onClick={() => setPageMode('page3')}
            >
              PAGE3
            </button>
          </div>
          <p className="eyebrow">Virtual Photography Studio</p>
          <h1>{pageMode === 'page1' ? 'Prompt Control Deck' : pageMode === 'page2' ? 'Character Builder' : 'Scene Builder'}</h1>
          <p className="subtitle">
            {pageMode === 'page1'
              ? '一個為個人創作流程設計的虛擬攝影 Prompt 生成工具，支援快速組合、批次生成與風格探索。'
              : pageMode === 'page2'
                ? '建立固定角色的臉部與妝容設定，整理成可搬回 PAGE1 使用的角色 Prompt。'
                : '建立無人物的純場景與世界觀 prompt，從小空間到超大景都可獨立生成。'}
          </p>
        </div>
        <div className="site-settings">
          <button
            type="button"
            className="settings-trigger"
            aria-label="Open settings"
            aria-expanded={isSettingsMenuOpen}
            onClick={() => setIsSettingsMenuOpen((prev) => !prev)}
          >
            <Settings size={18} />
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
      </header>

      {pageMode === 'page1' ? (
        <Page1Workspace
          activeLockCount={activeLockCount}
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
          genCount={genCount}
          setGenCount={setGenCount}
          handleGenerate={handleGenerate}
          prompts={prompts}
          setPrompts={setPrompts}
          createEmptyLocks={createEmptyLocks}
          buildAllNoneLocks={buildAllNoneLocks}
          lockControls={lockControls}
          viewMode={viewMode}
          setViewMode={setViewMode}
          favoritePrompts={favoritePrompts}
          libraryDraft={libraryDraft}
          libraryDraftChangeCount={libraryDraftChangeCount}
          handleGenerateLibraryTest={handleGenerateLibraryTest}
          handleCopyLibraryDraftSummary={handleCopyLibraryDraftSummary}
          libraryDraftSummary={libraryDraftSummary}
          handleResetLibraryDraft={handleResetLibraryDraft}
          displayPrompts={displayPrompts}
          handleDownloadAll={handleDownloadAll}
          handleClearFavorites={handleClearFavorites}
          importFeedInputRef={importFeedInputRef}
          handleOpenImportFeed={handleOpenImportFeed}
          handleImportFeed={handleImportFeed}
          isImportPromptOpen={isImportPromptOpen}
          setIsImportPromptOpen={setIsImportPromptOpen}
          importPromptText={importPromptText}
          setImportPromptText={setImportPromptText}
          handleApplyImportedPrompt={handleApplyImportedPrompt}
          knowledgeBaseOptions={knowledgeBaseOptions}
          effectiveLibraryGroup={effectiveLibraryGroup}
          handleLibraryGroupChange={handleLibraryGroupChange}
          libraryCategories={libraryCategories}
          effectiveLibraryCategory={effectiveLibraryCategory}
          handleLibraryCategoryChange={handleLibraryCategoryChange}
          librarySearch={librarySearch}
          setLibrarySearch={setLibrarySearch}
          libraryEntries={libraryEntries}
          selectedLibraryEntry={selectedLibraryEntry}
          editorMode={editorMode}
          handleSelectLibraryEntry={handleSelectLibraryEntry}
          editorDraft={editorDraft}
          setEditorDraft={setEditorDraft}
          handleCreateNewEntry={handleCreateNewEntry}
          handleSaveLibraryEntry={handleSaveLibraryEntry}
          favoriteIds={favoriteIds}
          toggleFavorite={toggleFavorite}
          handleDeletePrompt={handleDeletePrompt}
          handleRemixPrompt={handleRemixPrompt}
          handleRestorePromptToConsole={handleRestorePromptToConsole}
          summarySectionInfo={SUMMARY_SECTION_INFO}
          advancedRemixGroupInfo={ADVANCED_REMIX_GROUP_INFO}
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
          createEmptyProfile={createEmptyPage2Profile}
        />
      ) : (
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
          createEmptyProfile={createEmptyPage3Profile}
        />
      )}

      {copiedLabel ? <div className="toast">{copiedLabel}</div> : null}
    </div>
  );
}
const SUMMARY_REROLL_MAP = Object.fromEntries(
  Object.entries(REMIX_GROUP_INFO).map(([sectionKey, section]) => [sectionKey, section.keys])
);
