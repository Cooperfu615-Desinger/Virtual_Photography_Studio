import { Fragment, useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import DllPicProPanel from './DllPicProPanel';
import SelectControlField from './SelectControlField';
import LightingReferenceModal from './LightingReferenceModal';
import PromptPreviewCard from './PromptPreviewCard';
import {
  OUTFIT_PRESET_A_COVERED_KEYS,
  OUTFIT_PRESET_B_COVERED_KEYS,
  OUTFIT_PRESET_COVERED_KEYS,
  buildWardrobeLayerInsights,
  buildWorkspaceSummary,
  getControlOptionLabel,
} from '../lib/page1WorkspaceSummary.js';
import { resolvePage1ActiveSubpanel } from '../lib/page1WorkspacePanels.js';
import { randomizeLockKeys, setLockKeysToNone } from '../lib/page1SectionRandom.js';

const WARDROBE_PICKER_KEYS = new Set([
  'characterProfileId',
  'specialOutfitId',
  'specialOutfitAId',
  'specialOutfitBId',
  'completeLookPaletteId',
  'completeLookPaletteAId',
  'completeLookPaletteBId',
  'outfitPresetId',
  'outfitPresetAId',
  'outfitPresetBId',
  'dressId',
  'dressAId',
  'dressBId',
  'outfitPresetPrimaryColorId',
  'outfitPresetContrastColorId',
  'outfitPresetLockedPaletteId',
  'outfitPresetAPrimaryColorId',
  'outfitPresetAContrastColorId',
  'outfitPresetALockedPaletteId',
  'outfitPresetBPrimaryColorId',
  'outfitPresetBContrastColorId',
  'outfitPresetBLockedPaletteId',
  'topBottomPaletteId',
  'topBottomPaletteAId',
  'topBottomPaletteBId',
  'topColorId',
  'topAColorId',
  'topBColorId',
  'bottomColorId',
  'bottomAColorId',
  'bottomBColorId',
  'outerwearColorId',
  'outerwearAColorId',
  'outerwearBColorId',
  'legwearColorId',
  'legwearAColorId',
  'legwearBColorId',
  'shoesColorId',
  'shoesAColorId',
  'shoesBColorId',
]);

const WARDROBE_IMAGE_ONLY_PICKER_KEYS = new Set([
  'characterProfileId',
  'outfitPresetId',
  'outfitPresetAId',
  'outfitPresetBId',
  'dressId',
  'dressAId',
  'dressBId',
]);

const WARDROBE_OUTFIT_PICKER_KEYS = new Set(['outfitPresetId', 'outfitPresetAId', 'outfitPresetBId']);
const WARDROBE_DRESS_PICKER_KEYS = new Set(['dressId', 'dressAId', 'dressBId']);

const POSE_COMPOSER_KEYS = ['poseBaseId', 'poseArrangementId', 'poseHandId', 'poseHeadId', 'poseAnchorId'];
const POSE_COMPOSER_CONTEXT_KEYS = new Set(['poseArrangementId', 'poseAnchorId']);
const POSE_COMPOSER_BASE_IDS = new Set(['standing', 'sitting', 'kneeling', 'squatting', 'lying']);
const FIXED_SET_KEYS = ['fixedCompositionSetId', 'fixedSetPositionId', 'fixedSetBackgroundStateId', 'fixedSetCaptureModeId', 'fixedSetPerformanceStateId'];
const FIXED_SET_DEPENDENT_DISPLAY_NONE_KEYS = new Set(['fixedSetBackgroundStateId', 'fixedSetCaptureModeId', 'fixedSetPerformanceStateId']);
const FIXED_SET_LOCKED_KEYS = [
  'sceneAttributeId',
  'locationId',
  'framingId',
  'lensId',
  'opticalEffectId',
];
const FIXED_SET_STRICT_CAMERA_KEYS = ['angleId', 'orbitId'];

const NAMED_COLOR_SWATCHES = {
  black: ['#111111'],
  white: ['#ffffff'],
  'off-white': ['#f4efe3'],
  'dark grey': ['#3f3f3f'],
  'light grey': ['#cfcfcf'],
  'dark brown': ['#4a2e21'],
  'light brown': ['#b8895f'],
  brown: ['#7a4f2f'],
  red: ['#c81e2c'],
  'bright red': ['#ff2a2a'],
  'neon red': ['#ff003c'],
  pink: ['#f6a7c8'],
  'neon pink': ['#ff4fd8'],
  'light blue': ['#9ed6ff'],
  'dark blue': ['#173d78'],
  'bright blue': ['#1c7cff'],
  blue: ['#2f6fd6'],
  'royal blue': ['#1748c8'],
  'neon blue': ['#00b7ff'],
  'tiffany aqua': ['#81d8d0'],
  'turquoise green': ['#40e0c0'],
  'light green': ['#a9d98d'],
  'dark green': ['#245c38'],
  green: ['#4b9a45'],
  'olive green': ['#687a3a'],
  'neon green': ['#39ff14'],
  'soft yellow': ['#f7dc72'],
  yellow: ['#f6d547'],
  'neon yellow': ['#eaff00'],
  burgundy: ['#800020'],
  silver: ['#c7c9cc'],
  gold: ['#d6a84f'],
  colorful: ['#f45b69', '#f7d154', '#4ecdc4'],
  'black and white': ['#111111', '#ffffff'],
  'black and red': ['#111111', '#c81e2c'],
  'white and red': ['#ffffff', '#c81e2c'],
  'black-white-cool': ['#111111', '#ffffff', '#9aa1a9'],
  'black-red-street': ['#111111', '#b7133f', '#5b0f18'],
  'deep-denim': ['#102f5f', '#315f92', '#d7d2c6'],
  'cream-neutral': ['#f4efe3', '#d8c3a5', '#8a7a68'],
  'pink-sweet-cool': ['#f6a7c8', '#111111', '#d7dce5'],
  'brown-vintage': ['#4a2e21', '#b8895f', '#ead7b7'],
  'silver-metallic': ['#c7c9cc', '#4d555c', '#f1f0e8'],
  'green-utility': ['#687a3a', '#a8b875', '#6f7472'],
  'yellow-orange-bright': ['#f6d547', '#e56b2f', '#ffffff'],
  'bold multicolored horizontal stripes, wide stripe bands, clearly separated random colors': ['#f45b69', '#f7d154', '#4ecdc4'],
};

const WARDROBE_GARMENT_CONTROL_DIVIDERS = {
  topId: '上身單品',
  topAId: '上身單品',
  pantsId: '下身單品',
  pantsAId: '下身單品',
};

const WORKSPACE_SECTIONS = [
  { id: 'character', label: 'A 人物設定' },
  { id: 'pose', label: 'B 神情姿態' },
  { id: 'wardrobe', label: 'C 穿搭設定' },
  { id: 'scene', label: 'D 場景環境' },
  { id: 'photography', label: 'E 攝影成像' },
];

const SECTION_SUBPANELS = {
  character: [
    {
      id: 'identity',
      label: '身份基底',
      description: '確立人物數量、體態、五官、膚質與髮型髮色，讓角色身份基底先穩定下來。',
      keys: [
        'subjectCount',
        'bodyTypeId',
        'bodyTypeAId',
        'bodyTypeBId',
        'facialFeaturesId',
        'facialFeaturesAId',
        'facialFeaturesBId',
        'skinDetailsId',
        'skinDetailsAId',
        'skinDetailsBId',
        'hairstyleId',
        'hairstyleAId',
        'hairstyleBId',
        'hairColorId',
        'hairColorAId',
        'hairColorBId',
      ],
    },
    {
      id: 'special',
      label: '特殊角色',
      description: '特殊角色會接管人物主體；神情眼神、姿勢動作與特殊動作請到 B 神情姿態調整。',
      keys: [
        'specialSubjectId',
      ],
    },
    {
      id: 'character-profile',
      label: '角色卡',
      description: '角色卡會接管人物身份與固定穿搭；神情眼神、姿勢動作與特殊動作請到 B 神情姿態調整。',
      keys: [
        'characterProfileId',
      ],
    },
  ],
  pose: [
    {
      id: 'basic',
      label: '基礎設置',
      description: '快速設定神情眼神、雙人動作情境、雙人姿態基底、姿勢動作與特殊動作，適合先抓整體人物狀態。',
      keys: [
        'duoPoseId',
        'duoPoseBaseId',
        'duoExpressionId',
        'expressionId',
        'poseId',
        'specialActionId',
      ],
    },
    {
      id: 'composer',
      label: '特殊設置',
      description: '用 Pose Composer 精準組合姿勢基底、肢體變化、手部、頭部與接觸點；目前僅支援單人。',
      keys: [
        'poseBaseId',
        'poseArrangementId',
        'poseHandId',
        'poseHeadId',
        'poseAnchorId',
      ],
    },
  ],
  wardrobe: [
    {
      id: 'overall',
      label: '完整造型',
      description: '優先決定特殊穿搭、套裝或連身這類完整造型，它們會直接影響後續單件欄位。',
      keys: [
        'specialOutfitId',
        'specialOutfitAId',
        'specialOutfitBId',
        'outfitPresetId',
        'outfitPresetAId',
        'outfitPresetBId',
        'dressId',
        'dressAId',
        'dressBId',
      ],
    },
    {
      id: 'garments',
      label: '上下身單件',
      description: '當你不走整體造型時，這裡只處理上身、褲裝與裙裝的主體輪廓。',
      keys: [
        'topId',
        'topAId',
        'topBId',
        'topFitId',
        'topFitAId',
        'topFitBId',
        'topStylingId',
        'topStylingAId',
        'topStylingBId',
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
      ],
    },
    {
      id: 'colors',
      label: '造型配色',
      description: '把特殊穿搭、套裝或連身與上下身單件的配色和圖案集中處理；完整造型色系只作用在完整造型上。',
      keys: [
        'completeLookPaletteId',
        'completeLookPaletteAId',
        'completeLookPaletteBId',
        'outfitPresetPrimaryColorId',
        'outfitPresetContrastColorId',
        'outfitPresetLockedPaletteId',
        'outfitPresetAPrimaryColorId',
        'outfitPresetAContrastColorId',
        'outfitPresetALockedPaletteId',
        'outfitPresetBPrimaryColorId',
        'outfitPresetBContrastColorId',
        'outfitPresetBLockedPaletteId',
        'topBottomPaletteId',
        'topBottomPaletteAId',
        'topBottomPaletteBId',
        'topColorId',
        'topAColorId',
        'topBColorId',
        'topPatternId',
        'topAPatternId',
        'topBPatternId',
        'dressColorId',
        'dressAColorId',
        'dressBColorId',
        'bottomColorId',
        'bottomAColorId',
        'bottomBColorId',
        'bottomPatternId',
        'bottomAPatternId',
        'bottomBPatternId',
      ],
    },
    {
      id: 'layers',
      label: '鞋襪與外層',
      description: '補上外套、襪類與鞋款，建立完整造型的外層與腳部層次。',
      keys: [
        'outerwearId',
        'outerwearFitId',
        'outerwearColorId',
        'outerwearPatternId',
        'outerwearOpeningId',
        'outerwearStylingId',
        'legwearId',
        'legwearColorId',
        'shoesId',
        'shoesColorId',
        'outerwearAId',
        'outerwearAFitId',
        'outerwearAColorId',
        'outerwearAPatternId',
        'outerwearAOpeningId',
        'outerwearAStylingId',
        'legwearAId',
        'legwearAColorId',
        'shoesAId',
        'shoesAColorId',
        'outerwearBId',
        'outerwearBFitId',
        'outerwearBColorId',
        'outerwearBPatternId',
        'outerwearBOpeningId',
        'outerwearBStylingId',
        'legwearBId',
        'legwearBColorId',
        'shoesBId',
        'shoesBColorId',
      ],
    },
    {
      id: 'accessories',
      label: '配件細節',
      description: '最後才加配件，避免太早被細節打散主造型方向。',
      keys: [
        'headAccessoryId',
        'eyewearId',
        'eyewearColorId',
        'eyewearPlacementId',
        'earringsId',
        'neckAccessoryId',
        'headAccessoryAId',
        'eyewearAId',
        'eyewearAColorId',
        'eyewearAPlacementId',
        'earringsAId',
        'neckAccessoryAId',
        'headAccessoryBId',
        'eyewearBId',
        'eyewearBColorId',
        'eyewearBPlacementId',
        'earringsBId',
        'neckAccessoryBId',
        'wristAccessoryId',
        'ringId',
        'waistAccessoryId',
      ],
    },
  ],
  scene: [
    {
      id: 'fixed',
      label: '固定構圖場景',
      description: '選擇固定場景、場景內人物位置、戶外背景狀態、拍攝型態與演出狀態；啟用後會接管普通場景與鏡頭幾何。',
      keys: ['fixedCompositionSetId', 'fixedSetPositionId', 'fixedSetBackgroundStateId', 'fixedSetCaptureModeId', 'fixedSetPerformanceStateId'],
    },
    {
      id: 'space',
      label: '場景基底',
      description: '先定義場景屬性與具體地點，讓作品的空間錨點先成立。',
      keys: ['sceneAttributeId', 'locationId'],
    },
    {
      id: 'light',
      label: '環境與光線',
      description: '補上環境光條件與人物受光，決定空間氣候與主體光線關係。',
      keys: ['lightingId', 'lightDirectionId'],
    },
  ],
  photography: [
    {
      id: 'composition',
      label: '構圖與視角',
      description: '選景別、相機視角與拍攝方位，決定人物和場景在畫面中的關係。',
      keys: ['framingId', 'angleId', 'orbitId'],
    },
    {
      id: 'style',
      label: '攝影風格',
      description: '選攝影師語氣，決定影像的觀看方式、人物距離、色彩節奏與整體作者語彙。',
      keys: ['styleId'],
    },
    {
      id: 'optics',
      label: '鏡頭與光學',
      description: '指定焦段、光圈、快門與光學效果，控制透視、景深、動態殘影、flare、暗角與鏡片瑕疵。',
      keys: ['lensId', 'apertureId', 'shutterId', 'opticalEffectId'],
    },
    {
      id: 'imaging',
      label: '成像模擬',
      description: '最後選相機、底片或數位色彩模擬，控制顆粒、色彩反應、動態範圍與輸出質地。',
      keys: ['filmId'],
    },
  ],
};

function filterControlsByKeys(controls, keys) {
  const keySet = new Set(keys);
  return controls.filter((control) => keySet.has(control.key));
}

function getSectionKeys(sectionId) {
  return (SECTION_SUBPANELS[sectionId] || []).flatMap((panel) => panel.keys);
}

function countEffectiveSelections(sectionId, locks, controls) {
  return Array.from(new Set(getSectionKeys(sectionId)))
    .filter((key) => getControlOptionLabel(controls, key, locks[key]))
    .length;
}

function formatSelectionStatus(count) {
  return count > 0 ? `已選 ${count}` : '未設定';
}

function findControlOption(control, value) {
  if (!value) return null;
  return control?.options?.find((option) => option.id === value) || null;
}

function getSelectedPromptText(control, value) {
  const selectedOption = findControlOption(control, value);
  if (!selectedOption || selectedOption.zh === '全無') return '';
  return selectedOption.en || '';
}

function getOptionSwatches(option) {
  const colorPairs = [option?.topColor, option?.bottomColor]
    .filter(Boolean)
    .map((color) => {
      const hex = color.hex || (color.en || '').match(/#[0-9a-fA-F]{6}/)?.[0] || NAMED_COLOR_SWATCHES[color.en]?.[0] || '';
      return hex ? { color: hex, label: color.zh } : null;
    })
    .filter(Boolean);
  if (colorPairs.length > 0) return colorPairs;

  const hexMatches = (option?.en || '').match(/#[0-9a-fA-F]{6}/g) || [];
  if (hexMatches.length > 0) {
    return Array.from(new Set(hexMatches)).slice(0, 3).map((color) => ({ color, label: color }));
  }

  const namedSwatches = NAMED_COLOR_SWATCHES[option?.en] || NAMED_COLOR_SWATCHES[option?.id];
  return (namedSwatches || []).slice(0, 3).map((color) => ({ color, label: option?.zh || color }));
}

function getOptionCategory(option, control) {
  const label = option?.zh || '';
  if (control?.label?.includes('配色') || control?.label?.includes('色')) return '配色';
  if (label.includes('全無')) return '全無';
  if (control?.key === 'characterProfileId') return '角色卡';
  if (label.startsWith('套裝：')) return '套裝';
  if (label.startsWith('連身：')) return '連身';
  if (label.includes('配色') || option?.topColor || option?.bottomColor) return '配色';
  if (label.includes('特殊') || label.includes('風格') || label.includes('造型')) return '造型';
  return '選項';
}

function getReferenceImageUrl(option) {
  const referenceImage = option?.meta?.referenceImage;
  if (!referenceImage) return '';
  if (/^https?:\/\//.test(referenceImage) || referenceImage.startsWith('/')) return referenceImage;
  return `${import.meta.env.BASE_URL}${referenceImage}`;
}

function isWardrobeImagePickerOption(option, control) {
  const label = option?.zh || '';
  if (option?.zh === '全無' || option?.id === 'none' || option?.id === 'random' || option?.random) return true;
  if (WARDROBE_OUTFIT_PICKER_KEYS.has(control.key)) return label.startsWith('套裝：');
  if (WARDROBE_DRESS_PICKER_KEYS.has(control.key)) return label.startsWith('連身：');
  if (!getReferenceImageUrl(option)) return false;
  return true;
}

function WardrobePickerField({ control, value, disabled, onOpen, onChange, onCopy }) {
  const selectedOption = findControlOption(control, value);
  const selectedLabel = selectedOption?.zh || '隨機';
  const copyText = getSelectedPromptText(control, value);
  const swatches = getOptionSwatches(selectedOption);
  const isMuted = !selectedOption || selectedOption.zh === '全無';

  return (
    <label className={`field wardrobe-picker-field ${disabled ? 'field-disabled' : ''}`}>
      <div className="field-heading-row">
        <span>{control.label}</span>
        <button
          type="button"
          className="icon-btn control-copy-icon-btn"
          disabled={disabled || !copyText}
          onClick={() => onCopy(copyText)}
          title={`Copy ${control.label} prompt`}
          aria-label={`Copy ${control.label} prompt`}
        >
          <Copy size={14} />
        </button>
      </div>
      <button
        type="button"
        className={`wardrobe-picker-trigger ${isMuted ? 'wardrobe-picker-trigger-muted' : ''}`}
        disabled={disabled}
        onClick={onOpen}
      >
        <span className="wardrobe-picker-trigger-main">{selectedLabel}</span>
        {swatches.length > 0 ? (
          <span className="wardrobe-picker-swatches" aria-hidden="true">
            {swatches.map((swatch) => (
              <span key={`${swatch.color}-${swatch.label}`} className="wardrobe-picker-swatch" style={{ background: swatch.color }} />
            ))}
          </span>
        ) : null}
        <span className="wardrobe-picker-open">選擇</span>
      </button>
      {value ? (
        <button className="wardrobe-picker-clear" type="button" disabled={disabled} onClick={() => onChange('')}>
          回到隨機
        </button>
      ) : null}
    </label>
  );
}

function WardrobePickerModal({ control, value, query, onQueryChange, onClose, onSelect }) {
  const selectedOption = findControlOption(control, value);
  const normalizedQuery = query.trim().toLowerCase();
  const imageOnly = WARDROBE_IMAGE_ONLY_PICKER_KEYS.has(control.key);
  const baseOptions = imageOnly ? control.options.filter((option) => isWardrobeImagePickerOption(option, control)) : control.options;
  const visibleOptions = baseOptions.filter((option) => {
    if (!normalizedQuery) return true;
    return `${option.zh} ${option.en || ''}`.toLowerCase().includes(normalizedQuery);
  });
  const hasReferenceImageOptions = visibleOptions.some((option) => getReferenceImageUrl(option));
  const categories = Array.from(new Set(baseOptions.map((option) => getOptionCategory(option, control))));
  const searchPlaceholder = imageOnly
    ? `搜尋${control.label}預覽圖或 prompt 關鍵字`
    : '搜尋套裝、連身、配色或 prompt 關鍵字';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel wardrobe-picker-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="lock-title">{control.label}</div>
            <p className="lock-subtitle">搜尋中文名稱、英文 prompt 或配色關鍵字，適合資料庫持續增加時快速定位。</p>
          </div>
          <button className="secondary" type="button" onClick={onClose}>關閉</button>
        </div>

        <div className="wardrobe-picker-toolbar">
          <input
            className="text-input wardrobe-picker-search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchPlaceholder}
            autoFocus
          />
        </div>

        <div className="wardrobe-picker-category-row">
          {categories.map((category) => (
            <span key={category} className="wardrobe-picker-category">{category}</span>
          ))}
          <span className="wardrobe-picker-count">{visibleOptions.length} options</span>
        </div>

        <div className={`wardrobe-picker-option-grid ${hasReferenceImageOptions ? 'wardrobe-picker-option-grid-image' : ''}`}>
          {visibleOptions.map((option) => {
            const swatches = getOptionSwatches(option);
            const isActive = selectedOption?.id === option.id;
            const isColorOption = swatches.length > 0;
            const isNoneOption = option.zh === '全無' || option.id === 'none';
            const isRandomOption = Boolean(option.random) || option.id === 'random';
            const referenceImageUrl = getReferenceImageUrl(option);
            const hasReferenceImage = Boolean(referenceImageUrl);
            const useColorCardStyle = isColorOption || isNoneOption || isRandomOption;
            return (
              <button
                key={option.id}
                type="button"
                className={`wardrobe-picker-option ${useColorCardStyle ? 'wardrobe-picker-option-color' : ''} ${hasReferenceImage ? 'wardrobe-picker-option-image' : ''} ${isNoneOption ? 'wardrobe-picker-option-none' : ''} ${isActive ? 'wardrobe-picker-option-active' : ''}`}
                disabled={option.disabled}
                onClick={() => onSelect(option.id)}
              >
                {hasReferenceImage ? (
                  <span className="wardrobe-picker-option-image-frame" aria-hidden="true">
                    <img src={referenceImageUrl} alt="" loading="lazy" />
                  </span>
                ) : null}
                <span className="wardrobe-picker-option-topline">
                  <strong>{useColorCardStyle ? (option.en || option.zh) : option.zh}</strong>
                  {!useColorCardStyle ? <span>{getOptionCategory(option, control)}</span> : null}
                </span>
                {swatches.length > 0 ? (
                  <span className="wardrobe-picker-swatches wardrobe-picker-option-swatches" aria-hidden="true">
                    {swatches.map((swatch) => (
                      <span key={`${option.id}-${swatch.color}-${swatch.label}`} className="wardrobe-picker-swatch" style={{ background: swatch.color }} />
                    ))}
                  </span>
                ) : null}
                {option.en && !useColorCardStyle && !hasReferenceImage ? <span className="wardrobe-picker-option-copy">{option.en}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WardrobeLayerPanel({ insights }) {
  const rows = [
    { label: '主體', values: insights.main },
    { label: '配色', values: insights.palette },
    { label: '外層鞋襪', values: insights.layers },
    { label: '配件', values: insights.accessories },
  ];

  return (
    <div className="wardrobe-layer-panel">
      <div className="wardrobe-layer-grid">
        {rows.map((row) => (
          <div key={row.label} className="wardrobe-layer-row">
            <span>{row.label}</span>
            <strong>{row.values.length > 0 ? row.values.join(' / ') : '未設定'}</strong>
          </div>
        ))}
      </div>
      {insights.notes.length > 0 ? (
        <div className="wardrobe-layer-notes">
          {insights.notes.map((note) => (
            <span key={note}>{note}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Page1Workspace({
  coreLockControls,
  characterLockControls,
  wardrobeLockControls,
  locks,
  isCloseupMode,
  isWormEyeAngle,
  closeupAllowedKeys,
  isNoneSelected,
  updateLocks,
  handleCopyText,
  isOutfitPresetActive,
  handleGenerate,
  handleRerollPreview,
  handleApplyPreviewSelection,
  createEmptyLocks,
  buildAllNoneLocks,
  lockControls,
  previewPrompt,
  isImportPromptOpen,
  setIsImportPromptOpen,
  importPromptText,
  setImportPromptText,
  handleApplyImportedPrompt,
  onApplyPage3WorldSceneArchitecture,
}) {
  const [isLightingReferenceOpen, setIsLightingReferenceOpen] = useState(false);
  const [activeWardrobePickerKey, setActiveWardrobePickerKey] = useState('');
  const [wardrobePickerQuery, setWardrobePickerQuery] = useState('');
  const [activeSection, setActiveSection] = useState('character');
  const [activeSubpanels, setActiveSubpanels] = useState({
    character: 'identity',
    pose: 'basic',
    wardrobe: 'overall',
    scene: 'fixed',
    photography: 'composition',
  });

  const workspaceSummary = useMemo(() => buildWorkspaceSummary(locks, lockControls), [locks, lockControls]);
  const generationSummary = [
    workspaceSummary.character.summary,
    workspaceSummary.pose.summary,
    workspaceSummary.wardrobe.summary,
    workspaceSummary.scene.summary,
    workspaceSummary.photography.summary,
  ].filter(Boolean).join(' / ');
  const activeSectionConfig = WORKSPACE_SECTIONS.find((section) => section.id === activeSection) || WORKSPACE_SECTIONS[0];
  const sectionSubpanels = SECTION_SUBPANELS[activeSection] || [];
  const activeSubpanelId = activeSubpanels[activeSection] || sectionSubpanels[0]?.id || '';
  const activeSubpanel = sectionSubpanels.find((panel) => panel.id === activeSubpanelId) || sectionSubpanels[0] || null;
  const specialSubjectControl = lockControls.find((control) => control.key === 'specialSubjectId');
  const specialSubjectOption = specialSubjectControl?.options?.find((option) => option.id === locks.specialSubjectId);
  const characterProfileControl = lockControls.find((control) => control.key === 'characterProfileId');
  const characterProfileOption = characterProfileControl?.options?.find((option) => option.id === locks.characterProfileId);
  const isSpecialSubjectMode = Boolean(specialSubjectOption?.specialSubject);
  const isCharacterProfileMode = Boolean(characterProfileOption?.specialSubject);
  const isDedicatedSubjectMode = isSpecialSubjectMode || isCharacterProfileMode;
  const isAndroidSubjectMode = specialSubjectOption?.specialSubject === 'android';
  const resolvedActiveSubpanel = resolvePage1ActiveSubpanel(activeSection, activeSubpanel, { isSpecialSubjectMode: isDedicatedSubjectMode });
  const activeSubpanelKeys = resolvedActiveSubpanel?.keys || getSectionKeys(activeSection);
  const isSingleOutfitPresetActive = Boolean(locks.outfitPresetId) && !isNoneSelected('outfitPresetId', locks.outfitPresetId, wardrobeLockControls);
  const isOutfitPresetAActive = Boolean(locks.outfitPresetAId) && !isNoneSelected('outfitPresetAId', locks.outfitPresetAId, wardrobeLockControls);
  const isOutfitPresetBActive = Boolean(locks.outfitPresetBId) && !isNoneSelected('outfitPresetBId', locks.outfitPresetBId, wardrobeLockControls);
  const isSpecialOutfitActive = locks.subjectCount === '2'
    ? (
        (Boolean(locks.specialOutfitAId) && !isNoneSelected('specialOutfitAId', locks.specialOutfitAId, wardrobeLockControls)) ||
        (Boolean(locks.specialOutfitBId) && !isNoneSelected('specialOutfitBId', locks.specialOutfitBId, wardrobeLockControls))
      )
    : Boolean(locks.specialOutfitId) && !isNoneSelected('specialOutfitId', locks.specialOutfitId, wardrobeLockControls);
  const isDuoMode = locks.subjectCount === '2';
  const isReferenceSubjectMode = locks.subjectCount === 'reference';
  const isAnyOutfitPresetActive = isSingleOutfitPresetActive || isOutfitPresetAActive || isOutfitPresetBActive;
  const importedWorldSceneActive = locks.importedWorldSceneMode === 'architecture' && Boolean(locks.importedWorldSceneArchitectureText);
  const fixedCompositionSetActive = locks.subjectCount !== '2'
    && Boolean(locks.fixedCompositionSetId)
    && !isNoneSelected('fixedCompositionSetId', locks.fixedCompositionSetId, lockControls);
  const selectedFixedCompositionSetId = fixedCompositionSetActive ? locks.fixedCompositionSetId : '';
  const fixedCompositionSetControl = lockControls.find((control) => control.key === 'fixedCompositionSetId');
  const getFixedCompositionSetOption = (id) => fixedCompositionSetControl?.options?.find((option) => option.id === id) || null;
  const selectedFixedCompositionSetOption = fixedCompositionSetActive ? getFixedCompositionSetOption(selectedFixedCompositionSetId) : null;
  const fixedSetScopedOptionMatchesSet = (option, fixedSetOption) => {
    if (!option || option.id === 'none') return true;
    if (!fixedSetOption) return false;
    if (option.setId === fixedSetOption.id) return true;
    if (Array.isArray(option.setIds) && option.setIds.includes(fixedSetOption.id)) return true;
    return Boolean(option.setGroupId && fixedSetOption.setGroupId && option.setGroupId === fixedSetOption.setGroupId);
  };
  const fixedSetPositionMatchesSet = (position, fixedSetOption) => fixedSetScopedOptionMatchesSet(position, fixedSetOption);
  const fixedSetBackgroundStateMatchesSet = (state, fixedSetOption) => fixedSetScopedOptionMatchesSet(state, fixedSetOption);
  const fixedSetAllowsCameraVariation = Boolean(selectedFixedCompositionSetOption) && selectedFixedCompositionSetOption.allowsCameraVariation !== false;
  const wardrobeLayerInsights = useMemo(
    () => buildWardrobeLayerInsights(locks, wardrobeLockControls, isSpecialOutfitActive, isAnyOutfitPresetActive),
    [locks, wardrobeLockControls, isSpecialOutfitActive, isAnyOutfitPresetActive],
  );
  const activeWardrobePickerControl = [...characterLockControls, ...wardrobeLockControls]
    .find((control) => control.key === activeWardrobePickerKey);
  const specialActionControl = characterLockControls.find((control) => control.key === 'specialActionId');
  const poseHandControl = characterLockControls.find((control) => control.key === 'poseHandId');
  const getSpecialActionOption = (id) => specialActionControl?.options?.find((option) => option.id === id) || null;
  const isSocialShootingActionOption = (option) => Boolean(option?.meta?.tags?.includes('social_shooting_action'));
  const isSelfiePoseHandOption = (option) => Boolean(option?.meta?.tags?.includes('selfie_hand_pose'));
  const selectedSpecialActionOption = getSpecialActionOption(locks.specialActionId);
  const selectedSpecialActionIsSocial = isSocialShootingActionOption(selectedSpecialActionOption);
  const selectedPoseHandOption = poseHandControl?.options?.find((option) => option.id === locks.poseHandId) || null;
  const selectedPoseHandLocksOrbit = isSelfiePoseHandOption(selectedPoseHandOption);
  const isPoseComposerValueActive = (key, value = locks[key]) => (
    Boolean(value) && !isNoneSelected(key, value, characterLockControls)
  );
  const isPoseComposerActive = POSE_COMPOSER_KEYS.some((key) => isPoseComposerValueActive(key));
  const selectedPoseBaseId = POSE_COMPOSER_BASE_IDS.has(locks.poseBaseId) ? locks.poseBaseId : '';
  const currentModeBadges = [
    isSpecialSubjectMode ? (specialSubjectOption?.zh || '特殊角色') : '',
    isCharacterProfileMode ? (characterProfileOption?.zh || '角色卡') : '',
    isReferenceSubjectMode ? '上傳人物' : '',
    isDuoMode ? '雙人' : '',
    isCloseupMode ? '特寫模式' : '',
    isWormEyeAngle ? '蟲眼視角' : '',
    isAnyOutfitPresetActive ? '套裝接管' : '',
    isSpecialOutfitActive ? '特殊穿搭' : '',
    fixedCompositionSetActive ? '固定構圖場景' : '',
  ].filter(Boolean);
  const sectionDiagnostics = {
    character: {
      status: isDedicatedSubjectMode ? '接管中' : formatSelectionStatus(countEffectiveSelections('character', locks, lockControls)),
      chips: [
        isSpecialSubjectMode ? (specialSubjectOption?.zh || '特殊角色') : '',
        isCharacterProfileMode ? (characterProfileOption?.zh || '角色卡') : '',
        isReferenceSubjectMode ? '上傳人物' : '',
        isDuoMode ? '雙人設定' : '',
      ].filter(Boolean),
    },
    pose: {
      status: formatSelectionStatus(countEffectiveSelections('pose', locks, lockControls)),
      chips: [
        isPoseComposerActive ? 'Pose Composer' : '',
        selectedPoseHandLocksOrbit ? '自拍手部鎖定環繞' : '',
        selectedSpecialActionIsSocial ? '社群拍攝動作' : '',
        isDuoMode ? '雙人姿態' : '',
        isCloseupMode ? '特寫收斂' : '',
      ].filter(Boolean),
    },
    wardrobe: {
      status: isDedicatedSubjectMode ? '已停用' : (isAnyOutfitPresetActive || isSpecialOutfitActive ? '接管中' : formatSelectionStatus(countEffectiveSelections('wardrobe', locks, lockControls))),
      chips: [
        isSpecialSubjectMode ? '特殊角色停用穿搭' : '',
        isCharacterProfileMode ? '角色卡停用穿搭' : '',
        isSpecialOutfitActive ? '特殊穿搭接管' : '',
        isAnyOutfitPresetActive ? '套裝接管單件' : '',
      ].filter(Boolean),
    },
    scene: {
      status: isCloseupMode ? '特寫中' : formatSelectionStatus(countEffectiveSelections('scene', locks, lockControls)),
      chips: [
        fixedCompositionSetActive ? '固定構圖場景' : '',
        getControlOptionLabel(lockControls, 'locationId', locks.locationId) ? '場景錨點' : '',
        getControlOptionLabel(lockControls, 'lightingId', locks.lightingId) ? '環境光條件' : '',
      ].filter(Boolean),
    },
    photography: {
      status: isCloseupMode ? '特寫中' : formatSelectionStatus(countEffectiveSelections('photography', locks, lockControls)),
      chips: [
        fixedCompositionSetActive ? '固定場景接管構圖' : '',
        isCloseupMode ? '收斂構圖欄位' : '',
        isWormEyeAngle ? '攝影風格與鏡頭光學全無' : '',
        getControlOptionLabel(lockControls, 'styleId', locks.styleId) ? '攝影風格' : '',
        getControlOptionLabel(lockControls, 'filmId', locks.filmId) ? '成像模擬' : '',
      ].filter(Boolean),
    },
  };

  const buildPoseComposerControl = (control) => {
    if (!POSE_COMPOSER_CONTEXT_KEYS.has(control.key)) return control;
    return {
      ...control,
      options: control.options.filter((option) => {
        if (!option.base && !option.bases) return true;
        if (!selectedPoseBaseId) return false;
        if (option.base) return option.base === selectedPoseBaseId;
        return option.bases.includes(selectedPoseBaseId);
      }),
    };
  };
  const buildFixedSetControl = (control) => {
    if (!['fixedSetPositionId', 'fixedSetBackgroundStateId'].includes(control.key)) return control;
    const matchesSelectedSet = control.key === 'fixedSetPositionId'
      ? fixedSetPositionMatchesSet
      : fixedSetBackgroundStateMatchesSet;
    return {
      ...control,
      options: control.options.filter((option) => matchesSelectedSet(option, selectedFixedCompositionSetOption)),
    };
  };
  const resetPoseComposerLocks = (target) => {
    POSE_COMPOSER_KEYS.forEach((key) => {
      target[key] = 'none';
    });
  };

  const isControlDisabled = (control) => (
    (isCloseupMode && !closeupAllowedKeys.has(control.key))
    || (isWormEyeAngle && ['styleId', 'lensId', 'opticalEffectId'].includes(control.key))
    || (FIXED_SET_KEYS.includes(control.key) && locks.subjectCount === '2')
    || (FIXED_SET_DEPENDENT_DISPLAY_NONE_KEYS.has(control.key) && !fixedCompositionSetActive)
    || (fixedCompositionSetActive && FIXED_SET_LOCKED_KEYS.includes(control.key))
    || (fixedCompositionSetActive && !fixedSetAllowsCameraVariation && FIXED_SET_STRICT_CAMERA_KEYS.includes(control.key))
    || (selectedPoseHandLocksOrbit && control.key === 'orbitId')
    || (POSE_COMPOSER_KEYS.includes(control.key) && locks.subjectCount !== '1')
    || (POSE_COMPOSER_KEYS.includes(control.key) && (Boolean(locks.poseId) && !isNoneSelected('poseId', locks.poseId, characterLockControls)))
    || (POSE_COMPOSER_KEYS.includes(control.key) && (Boolean(locks.specialActionId) && !isNoneSelected('specialActionId', locks.specialActionId, characterLockControls)))
    || (['poseId', 'specialActionId'].includes(control.key) && isPoseComposerActive)
    || (control.key === 'poseId' && Boolean(locks.specialActionId) && !isNoneSelected('specialActionId', locks.specialActionId, characterLockControls) && !selectedSpecialActionIsSocial)
    || (['topColorId', 'bottomColorId'].includes(control.key) && Boolean(locks.topBottomPaletteId) && !isNoneSelected('topBottomPaletteId', locks.topBottomPaletteId, wardrobeLockControls))
    || (['topAColorId', 'bottomAColorId'].includes(control.key) && Boolean(locks.topBottomPaletteAId) && !isNoneSelected('topBottomPaletteAId', locks.topBottomPaletteAId, wardrobeLockControls))
    || (['topBColorId', 'bottomBColorId'].includes(control.key) && Boolean(locks.topBottomPaletteBId) && !isNoneSelected('topBottomPaletteBId', locks.topBottomPaletteBId, wardrobeLockControls))
    || (isSingleOutfitPresetActive && OUTFIT_PRESET_COVERED_KEYS.has(control.key))
    || (isOutfitPresetAActive && OUTFIT_PRESET_A_COVERED_KEYS.has(control.key))
    || (isOutfitPresetBActive && OUTFIT_PRESET_B_COVERED_KEYS.has(control.key))
  );

  const applyControlValue = (control, value) => {
    updateLocks((prev) => {
      const next = { ...prev, [control.key]: value };
      if (control.key === 'fixedCompositionSetId') {
        const nextFixedSetActive = Boolean(value) && !isNoneSelected('fixedCompositionSetId', value, lockControls);
        const nextFixedSetOption = getFixedCompositionSetOption(value);
        if (nextFixedSetActive) {
          next.sceneAttributeId = '';
          next.locationId = '';
          next.importedWorldSceneMode = 'none';
          next.importedWorldSceneLabel = '';
          next.importedWorldSceneArchitectureText = '';
          ['framingId', 'lensId', 'opticalEffectId'].forEach((key) => {
            const noneOption = lockControls.find((item) => item.key === key)?.options?.find((option) => option.zh === '全無');
            next[key] = noneOption?.id || '';
          });
          if (nextFixedSetOption?.allowsCameraVariation === false) {
            FIXED_SET_STRICT_CAMERA_KEYS.forEach((key) => {
              const noneOption = lockControls.find((item) => item.key === key)?.options?.find((option) => option.zh === '全無');
              next[key] = noneOption?.id || '';
            });
          }
          const selectedPosition = lockControls.find((item) => item.key === 'fixedSetPositionId')?.options?.find((option) => option.id === prev.fixedSetPositionId);
          if (!fixedSetPositionMatchesSet(selectedPosition, nextFixedSetOption)) {
            next.fixedSetPositionId = 'none';
          }
          const selectedBackgroundState = lockControls.find((item) => item.key === 'fixedSetBackgroundStateId')?.options?.find((option) => option.id === prev.fixedSetBackgroundStateId);
          if (!fixedSetBackgroundStateMatchesSet(selectedBackgroundState, nextFixedSetOption)) {
            next.fixedSetBackgroundStateId = 'none';
          }
        } else {
          next.fixedSetPositionId = 'none';
          next.fixedSetBackgroundStateId = 'none';
          next.fixedSetCaptureModeId = 'photographer-shot';
          next.fixedSetPerformanceStateId = 'model-natural';
        }
      }
      if (control.key === 'fixedSetPositionId') {
        const selectedPosition = lockControls.find((item) => item.key === 'fixedSetPositionId')?.options?.find((option) => option.id === value);
        if (!fixedSetPositionMatchesSet(selectedPosition, getFixedCompositionSetOption(prev.fixedCompositionSetId))) {
          next.fixedSetPositionId = 'none';
        }
      }
      if (control.key === 'fixedSetBackgroundStateId') {
        const selectedBackgroundState = lockControls.find((item) => item.key === 'fixedSetBackgroundStateId')?.options?.find((option) => option.id === value);
        if (!fixedSetBackgroundStateMatchesSet(selectedBackgroundState, getFixedCompositionSetOption(prev.fixedCompositionSetId))) {
          next.fixedSetBackgroundStateId = 'none';
        }
      }
      if (control.key === 'poseId' && value && !isNoneSelected('poseId', value, characterLockControls)) {
        const currentSpecialAction = getSpecialActionOption(prev.specialActionId);
        if (currentSpecialAction && !isSocialShootingActionOption(currentSpecialAction)) {
          next.specialActionId = '';
        }
        resetPoseComposerLocks(next);
      }
      if (control.key === 'specialActionId' && value && !isNoneSelected('specialActionId', value, characterLockControls)) {
        const nextSpecialAction = getSpecialActionOption(value);
        if (!isSocialShootingActionOption(nextSpecialAction)) {
          next.poseId = '';
        }
        resetPoseComposerLocks(next);
      }
      if (POSE_COMPOSER_KEYS.includes(control.key) && value && !isNoneSelected(control.key, value, characterLockControls)) {
        next.poseId = '';
        next.specialActionId = '';
      }
      if (control.key === 'poseHandId') {
        const nextPoseHand = poseHandControl?.options?.find((option) => option.id === value);
        if (isSelfiePoseHandOption(nextPoseHand)) {
          const noneOrbit = lockControls.find((item) => item.key === 'orbitId')?.options?.find((option) => option.zh === '全無');
          next.orbitId = noneOrbit?.id || '';
        }
      }
      if (control.key === 'locationId' && value) {
        next.importedWorldSceneMode = 'none';
        next.importedWorldSceneLabel = '';
        next.importedWorldSceneArchitectureText = '';
        next.fixedCompositionSetId = 'none';
        next.fixedSetPositionId = 'none';
        next.fixedSetBackgroundStateId = 'none';
        next.fixedSetCaptureModeId = 'photographer-shot';
        next.fixedSetPerformanceStateId = 'model-natural';
      }
      if (control.key === 'poseBaseId') {
        const nextBase = POSE_COMPOSER_BASE_IDS.has(value) ? value : '';
        ['poseArrangementId', 'poseAnchorId'].forEach((key) => {
          const nextControl = characterLockControls.find((item) => item.key === key);
          const selected = nextControl?.options?.find((option) => option.id === next[key]);
          const selectedSupportsBase = selected?.base
            ? selected.base === nextBase
            : selected?.bases
              ? selected.bases.includes(nextBase)
              : true;
          if (!selectedSupportsBase) next[key] = 'none';
        });
      }
      return next;
    });
  };

  const handleRandomizeActiveSection = () => {
    updateLocks((prev) => randomizeLockKeys(prev, activeSubpanelKeys, createEmptyLocks()));
  };

  const handleSetActiveSectionNone = () => {
    updateLocks((prev) => setLockKeysToNone(prev, activeSubpanelKeys, lockControls));
  };

  const clearImportedWorldSceneArchitecture = () => {
    updateLocks((prev) => ({
      ...prev,
      importedWorldSceneMode: 'none',
      importedWorldSceneLabel: '',
      importedWorldSceneArchitectureText: '',
    }));
  };

  const renderSectionRandomButton = () => (
    <button className="secondary page1-section-random-btn" type="button" onClick={handleRandomizeActiveSection}>
      全部隨機
    </button>
  );

  const renderSectionNoneButton = () => (
    <button className="secondary subtle-action page1-section-random-btn" type="button" onClick={handleSetActiveSectionNone}>
      全部全無
    </button>
  );

  const renderSectionActionButtons = () => (
    <div className="page1-section-header-actions">
      {renderSectionRandomButton()}
      {renderSectionNoneButton()}
    </div>
  );

  const openWardrobePicker = (control) => {
    setActiveWardrobePickerKey(control.key);
    setWardrobePickerQuery('');
  };

  const renderControlGrid = (controls) => (
    <div className="lock-grid detail-lock-grid">
      {controls.map((rawControl) => {
        const control = buildFixedSetControl(buildPoseComposerControl(rawControl));
        const displayFixedSetDependentAsNone = FIXED_SET_DEPENDENT_DISPLAY_NONE_KEYS.has(control.key) && !fixedCompositionSetActive;
        const disabled = isControlDisabled(control);
        const value = displayFixedSetDependentAsNone ? 'none' : locks[control.key];
        const dividerLabel = activeSection === 'wardrobe' && activeSubpanel?.id === 'garments'
          ? WARDROBE_GARMENT_CONTROL_DIVIDERS[control.key]
          : '';
        const field = WARDROBE_PICKER_KEYS.has(control.key) ? (
          <WardrobePickerField
            control={control}
            value={value}
            disabled={disabled}
            onOpen={() => openWardrobePicker(control)}
            onChange={(value) => applyControlValue(control, value)}
            onCopy={(text) => handleCopyText(`${control.label} copied`, text)}
          />
        ) : (
          <SelectControlField
            control={control}
            value={value}
            disabled={disabled}
            onChange={(value) => applyControlValue(control, value)}
            onCopy={(text) => handleCopyText(`${control.label} copied`, text)}
          />
        );

        if (dividerLabel) {
          return (
            <Fragment key={control.key}>
              <div className="control-grid-divider">
                <span>{dividerLabel}</span>
              </div>
              {field}
            </Fragment>
          );
        }

        return <Fragment key={control.key}>{field}</Fragment>;
      })}
    </div>
  );

  const renderSceneControls = () => (
    <div className="control-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Scene & Environment</div>
          <p className="workspace-panel-copy">{resolvedActiveSubpanel?.description || '先決定場景、環境與光線，右側會同步反映成目前可直接使用的 Gpt prompt。'}</p>
        </div>
        <div className="page1-section-header-actions">
          {renderSectionRandomButton()}
          {renderSectionNoneButton()}
          <button className="secondary reference-trigger-btn" type="button" onClick={() => setIsLightingReferenceOpen(true)}>
            查看光線定位對照
          </button>
        </div>
      </div>
      <div className="context-note context-note-compact">
        <div className="context-note-copy">
          {importedWorldSceneActive
            ? `PAGE3 空景架構已套用：${locks.importedWorldSceneLabel || '未命名世界場景'}。此架構會優先進入三種 PAGE1 prompt，人物、服裝、姿勢仍由 PAGE1 控制。`
            : '可把目前 PAGE3 的空景建模 profile 套入 PAGE1，作為人像 prompt 的世界場景骨架。'}
        </div>
        <div className="page1-section-header-actions">
          <button className="secondary" type="button" onClick={onApplyPage3WorldSceneArchitecture}>
            套用 PAGE3 空景架構
          </button>
          {importedWorldSceneActive ? (
            <button className="secondary" type="button" onClick={clearImportedWorldSceneArchitecture}>
              清除匯入
            </button>
          ) : null}
        </div>
      </div>
      {renderControlGrid(filterControlsByKeys(coreLockControls, resolvedActiveSubpanel?.keys || []))}
    </div>
  );

  const renderPhotographyControls = () => (
    <div className="control-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Photography & Rendering</div>
          <p className="workspace-panel-copy">{resolvedActiveSubpanel?.description || '在這裡整理攝影師語氣、構圖視角、鏡頭光學與成像模擬。'}</p>
        </div>
        {renderSectionActionButtons()}
      </div>
      {renderControlGrid(filterControlsByKeys(coreLockControls, resolvedActiveSubpanel?.keys || []))}
    </div>
  );

  const renderCharacterControls = () => (
    <div className="control-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Character Setup</div>
          <p className="workspace-panel-copy">{resolvedActiveSubpanel?.description || '把人物身份與特殊角色先固定下來，後面換神情、穿搭與場景會更穩定。'}</p>
        </div>
        {renderSectionActionButtons()}
      </div>
      {locks.subjectCount === 'reference' ? (
        <div className="context-note">
          此模式不在 app 內上傳圖片；生成後請把同一張人物參考圖直接附給 Midjourney、Grok 或 Gemini，prompt 會以附圖人物五官與身份為主。
        </div>
      ) : null}
      {isSpecialSubjectMode ? (
        <div className="context-note">
          {isAndroidSubjectMode
            ? '女性人形機器人會接管人物主體，但仍可套用髮型、髮色、神情眼神、姿勢動作與特殊動作；身份基底中的五官、體態與 B 穿搭設定會暫時停用。'
            : '特殊角色會接管人物主體，只保留神情眼神、姿勢動作與特殊動作；身份基底中的五官、體態、髮型、髮色與 B 穿搭設定會暫時停用。'}
        </div>
      ) : null}
      {isCharacterProfileMode ? (
        <div className="context-note">
          角色卡會接管人物身份與固定穿搭，只保留神情眼神、姿勢動作與特殊動作；身份基底中的五官、體態、髮型、髮色與 B 穿搭設定會暫時停用。
        </div>
      ) : null}
      {isCloseupMode ? (
        <div className="context-note">
          目前為特寫模式，系統會自動收斂不必要欄位，保留與人物、主要服裝輪廓與構圖相關的設定，讓 prompt 更聚焦。
        </div>
      ) : null}
      {renderControlGrid(filterControlsByKeys(characterLockControls, resolvedActiveSubpanel?.keys || []))}
    </div>
  );

  const renderPoseControls = () => (
    <div className="control-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Expression & Pose</div>
          <p className="workspace-panel-copy">{resolvedActiveSubpanel?.description || '在這裡整理神情眼神、姿勢動作與 Pose Composer。'}</p>
        </div>
        {renderSectionActionButtons()}
      </div>
      {isPoseComposerActive ? (
        <div className="context-note">
          Pose Composer 已接管姿勢輸出，基礎姿勢與非社群型特殊動作會暫時停用，避免同時出現兩套肢體指令。
        </div>
      ) : null}
      {locks.subjectCount !== '1' && activeSubpanel?.id === 'composer' ? (
        <div className="context-note">
          Pose Composer 目前僅支援單人；雙人模式請使用基礎設置中的雙人姿態與互動。
        </div>
      ) : null}
      {renderControlGrid(filterControlsByKeys(characterLockControls, resolvedActiveSubpanel?.keys || []))}
    </div>
  );

  const renderWardrobeControls = () => (
    <div className="control-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Style & Wardrobe</div>
          <p className="workspace-panel-copy">{resolvedActiveSubpanel?.description || '在這裡分段處理整體造型、單件、鞋襪與配件。'}</p>
        </div>
        {renderSectionActionButtons()}
      </div>
      {isOutfitPresetActive ? (
        <div className="context-note">
          套裝或連身已接管主要服裝輪廓，和它重疊的上身、下身單件欄位會自動停用，避免 prompt 互相打架。
        </div>
      ) : null}
      {isSpecialOutfitActive ? (
        <div className="context-note">
          特殊穿搭是完整從頭到腳造型，已接管所有服裝、鞋襪與配件欄位。
        </div>
      ) : null}
      {isDedicatedSubjectMode ? (
        <div className="context-note">
          {isCharacterProfileMode
            ? '角色卡已內建固定穿搭，這一區已暫時停用，請改用角色卡、場景、鏡頭、光線與風格去塑造作品氣氛。'
            : '特殊角色目前不使用服裝、鞋襪或配件欄位，這一區已暫時停用，請改用角色本身、場景、鏡頭、光線與風格去塑造作品氣氛。'}
        </div>
      ) : null}
      <WardrobeLayerPanel insights={wardrobeLayerInsights} />
      {renderControlGrid(filterControlsByKeys(wardrobeLockControls, resolvedActiveSubpanel?.keys || []))}
    </div>
  );

  const renderEditorPanel = () => {
    if (activeSection === 'photography') return renderPhotographyControls();
    if (activeSection === 'scene') return renderSceneControls();
    if (activeSection === 'wardrobe') return renderWardrobeControls();
    if (activeSection === 'pose') return renderPoseControls();
    return renderCharacterControls();
  };

  const generationPromptCards = [
    {
      title: 'Gpt',
      value: previewPrompt?.grokPrompt || '',
      placeholder: '目前尚無可顯示的 Gpt prompt。',
      description: '分段自然語言主 prompt，主要給 ChatGPT-Image-2 / GPT Image 使用。',
      copyLabel: 'Gpt copied',
    },
    {
      title: 'Grok/Z-Image',
      value: previewPrompt?.zImagePrompt || '',
      placeholder: '目前尚無可顯示的 Grok/Z-Image prompt。',
      description: '更自然的完整段落描述，主要給 Grok Imagine / Z-Image 使用。',
      copyLabel: 'Grok/Z-Image copied',
    },
    {
      title: 'AI Prompt',
      value: previewPrompt?.midjourneyPrompt || '',
      placeholder: '目前尚無可顯示的 AI Prompt。',
      description: '偏通用影像生成語氣，適合快速貼到外部工具測試視覺方向。',
      copyLabel: 'AI copied',
    },
  ];

  return (
    <>
      <section className="page1-workspace-shell">
        <aside className="page1-sidebar lock-panel">
          <div className="page1-sidebar-header">
            <div className="lock-title">Prompt Workspace</div>
            <div className="page1-mode-stack">
              <span className="page1-mode-label">Current Modes</span>
              <div className="page1-mode-chip-row">
                {(currentModeBadges.length > 0 ? currentModeBadges : ['一般模式']).map((badge) => (
                  <span key={badge} className="page1-mode-chip">{badge}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="page1-section-nav">
            {WORKSPACE_SECTIONS.map((section) => {
              const snapshot = workspaceSummary[section.id];
              const diagnostics = sectionDiagnostics[section.id];
              return (
                <button
                  key={section.id}
                  type="button"
                  className={`page1-section-card ${activeSection === section.id ? 'page1-section-card-active' : ''}`}
                  onClick={() => {
                    setActiveSection(section.id);
                    setActiveSubpanels((prev) => ({
                      ...prev,
                      [section.id]: prev[section.id] || SECTION_SUBPANELS[section.id]?.[0]?.id || '',
                    }));
                  }}
                >
                  <span className="page1-section-heading">
                    <span className="page1-section-label">{section.label}</span>
                    <span className="page1-section-status">{diagnostics.status}</span>
                  </span>
                  <strong className="page1-section-value">{snapshot.summary}</strong>
                  {snapshot.meta ? <span className="page1-section-meta">{snapshot.meta}</span> : null}
                  {diagnostics.chips.length > 0 ? (
                    <span className="page1-section-chip-row">
                      {diagnostics.chips.map((chip) => (
                        <span key={chip} className="page1-section-chip">{chip}</span>
                      ))}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="page1-sidebar-actions">
            <button className="secondary danger" onClick={() => updateLocks(createEmptyLocks())}>
              清除已選
            </button>
            <button className="secondary" onClick={() => updateLocks(createEmptyLocks())}>
              全部隨機
            </button>
            <button className="secondary subtle-action" onClick={() => updateLocks(buildAllNoneLocks(lockControls, locks))}>
              全部全無
            </button>
            <button className="secondary" onClick={() => setIsImportPromptOpen(true)}>
              回填 Prompt
            </button>
          </div>
        </aside>

        <main className="page1-center-column">
          <section className="page1-editor lock-panel">
            <div className="page1-editor-header">
              <div>
                <div className="lock-title">{activeSectionConfig.label}</div>
              </div>
            </div>

            <div className="page1-subpanel-tabs">
              {sectionSubpanels.map((panel) => (
                <button
                  key={panel.id}
                  type="button"
                  className={`page1-subpanel-tab ${activeSubpanel?.id === panel.id ? 'page1-subpanel-tab-active' : ''}`}
                  onClick={() => setActiveSubpanels((prev) => ({ ...prev, [activeSection]: panel.id }))}
                >
                  <span className="page1-subpanel-label">{panel.label}</span>
                </button>
              ))}
            </div>
            {renderEditorPanel()}
          </section>

          <section className="page1-preview-panel page1-output-panel lock-panel reference-output-panel">
            <div className="reference-output-header">
              <div>
                <div className="control-section-title">Generation Outputs</div>
                <p className="workspace-panel-copy">集中整理目前 工作台 的三種生成輸出。</p>
              </div>
            </div>

            <div className="primary-action-row page1-generation-actions">
              <button className="primary-copy-btn page1-random-generate-btn" onClick={handleRerollPreview} disabled={!previewPrompt}>
                隨機生成
              </button>
              <button className="secondary primary-copy-btn" onClick={handleApplyPreviewSelection} disabled={!previewPrompt?.selection}>
                套用目前預覽
              </button>
              <button className="primary-copy-btn page1-save-current-btn" onClick={handleGenerate} disabled={!previewPrompt}>
                加入最愛
              </button>
            </div>

            <div className="prompt-preview-grid page1-generation-grid">
              <PromptPreviewCard
                title="生成摘要"
                value={generationSummary}
                placeholder="尚未形成明確選項。"
                variant="summary"
                description=""
              />
              {generationPromptCards.map((card) => (
                <PromptPreviewCard
                  key={card.title}
                  {...card}
                  onCopy={(text) => handleCopyText(card.copyLabel, text)}
                />
              ))}
            </div>
          </section>
        </main>

        <aside className="page1-preview-column">
          <DllPicProPanel
            title="DLL_PIC Pro"
            description="使用目前 prompt 直接生成圖像預覽。"
            promptSources={[
              { id: 'gpt', label: 'Gpt', value: previewPrompt?.grokPrompt || '' },
              { id: 'grok', label: 'Grok/Z-Image', value: previewPrompt?.zImagePrompt || '' },
              { id: 'ai', label: 'AI Prompt', value: previewPrompt?.midjourneyPrompt || '' },
            ]}
            defaultSourceId="gpt"
          />

        </aside>
      </section>

      {isImportPromptOpen ? (
        <div className="modal-backdrop" onClick={() => setIsImportPromptOpen(false)}>
          <div className="modal-panel prompt-import-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="lock-title">標準格式回填</div>
                <p className="lock-subtitle">貼上本工具輸出的標準 Prompt，系統會盡可能回填到 PAGE1 主控台。</p>
              </div>
            </div>

            <label className="field">
              <span>Prompt 內容</span>
              <textarea
                className="text-input prompt-import-textarea"
                value={importPromptText}
                onChange={(event) => setImportPromptText(event.target.value)}
                placeholder="貼上 AI、Gpt、Grok/Z-Image，或本工具匯出的標準格式內容"
              />
            </label>

            <div className="modal-actions">
              <button className="secondary" onClick={() => setIsImportPromptOpen(false)}>
                取消
              </button>
              <button className="primary-cta" onClick={handleApplyImportedPrompt} disabled={!importPromptText.trim()}>
                確認回填
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <LightingReferenceModal open={isLightingReferenceOpen} onClose={() => setIsLightingReferenceOpen(false)} />
      {activeWardrobePickerControl ? (
        <WardrobePickerModal
          control={activeWardrobePickerControl}
          value={locks[activeWardrobePickerControl.key]}
          query={wardrobePickerQuery}
          onQueryChange={setWardrobePickerQuery}
          onClose={() => setActiveWardrobePickerKey('')}
          onSelect={(value) => {
            applyControlValue(activeWardrobePickerControl, value);
            setActiveWardrobePickerKey('');
          }}
        />
      ) : null}
    </>
  );
}
