import { useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import SelectControlField from './SelectControlField';
import LightingReferenceModal from './LightingReferenceModal';
import PromptPreviewCard from './PromptPreviewCard';

const WARDROBE_PICKER_KEYS = new Set([
  'specialOutfitId',
  'specialOutfitAId',
  'specialOutfitBId',
  'outfitPresetId',
  'outfitPresetAId',
  'outfitPresetBId',
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
  'bold multicolored horizontal stripes, wide stripe bands, clearly separated random colors': ['#f45b69', '#f7d154', '#4ecdc4'],
};

const OUTFIT_PRESET_COVERED_KEYS = new Set([
  'topId',
  'topFitId',
  'topStylingId',
  'topColorId',
  'topPatternId',
  'dressId',
  'dressColorId',
  'pantsId',
  'skirtId',
  'bottomFitId',
  'bottomRiseId',
  'bottomColorId',
  'bottomPatternId',
]);

const OUTFIT_PRESET_A_COVERED_KEYS = new Set([
  'topAId',
  'topFitAId',
  'topStylingAId',
  'topAColorId',
  'topAPatternId',
  'dressAId',
  'dressAColorId',
  'pantsAId',
  'skirtAId',
  'bottomFitAId',
  'bottomRiseAId',
  'bottomAColorId',
  'bottomAPatternId',
]);

const OUTFIT_PRESET_B_COVERED_KEYS = new Set([
  'topBId',
  'topFitBId',
  'topStylingBId',
  'topBColorId',
  'topBPatternId',
  'dressBId',
  'dressBColorId',
  'pantsBId',
  'skirtBId',
  'bottomFitBId',
  'bottomRiseBId',
  'bottomBColorId',
  'bottomBPatternId',
]);

const WORKSPACE_SECTIONS = [
  { id: 'character', label: 'A 人物設定', summaryKey: 'characterDna', metaKey: 'expressionPose' },
  { id: 'wardrobe', label: 'B 穿搭設定', summaryKey: 'wardrobe', metaKey: null },
  { id: 'scene', label: 'C 場景與環境', summaryKey: 'sceneLook', metaKey: null },
  { id: 'photography', label: 'D 攝影與成像', summaryKey: 'photographyLook', metaKey: null },
];

const SECTION_SUBPANELS = {
  character: [
    {
      id: 'identity',
      label: '身份基底',
      description: '先確立人物數量、體態與臉髮基礎，讓角色 DNA 先穩定下來。',
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
      ],
    },
    {
      id: 'expression',
      label: '神情姿態',
      description: '再補上表情、雙人互動與構圖姿態，讓人物狀態更完整。',
      keys: [
        'duoInteractionId',
        'duoPoseId',
        'expressionId',
        'expressionAId',
        'expressionBId',
        'poseId',
        'specialActionId',
      ],
    },
    {
      id: 'special',
      label: '特殊角色',
      description: '特殊角色會接管人物主體，只保留神情眼神與姿勢動作，穿搭設定會暫時停用。',
      keys: [
        'specialSubjectId',
        'expressionId',
        'poseId',
      ],
    },
  ],
  wardrobe: [
    {
      id: 'overall',
      label: '整體穿搭',
      description: '優先決定套裝或連身這類整體輪廓，這會直接影響後續單件欄位。',
      keys: [
        'specialOutfitId',
        'specialOutfitAId',
        'specialOutfitBId',
        'outfitPresetId',
        'outfitPresetAId',
        'outfitPresetBId',
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
      label: '配色',
      description: '把套裝/連身與上下身單件的配色和圖案集中處理，避免與主體輪廓混在一起。',
      keys: [
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
      description: '補上外套、襪類與鞋款，建立完整造型層次。',
      keys: [
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
      ],
    },
    {
      id: 'accessories',
      label: '配件細節',
      description: '最後才加配件，避免太早被細節打散主造型方向。',
      keys: [
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
      ],
    },
  ],
  scene: [
    {
      id: 'space',
      label: '場景基底',
      description: '先定義場景屬性與具體地點，讓作品的空間錨點先成立。',
      keys: ['sceneAttributeId', 'locationId'],
    },
    {
      id: 'light',
      label: '環境與光線',
      description: '補上環境光條件、人物受光與畫面比例，決定空間氣候與輸出格式。',
      keys: ['lightingId', 'lightDirectionId', 'aspectRatio'],
    },
  ],
  photography: [
    {
      id: 'style',
      label: '攝影風格',
      description: '先選攝影師語氣與器材，決定影像的觀察方式與成像基調。',
      keys: ['styleId', 'cameraSystemId'],
    },
    {
      id: 'composition',
      label: '構圖與視角',
      description: '調整景別、相機視角與拍攝方位，決定人物和場景在畫面中的關係。',
      keys: ['framingId', 'angleId', 'orbitId'],
    },
    {
      id: 'rendering',
      label: '鏡頭與成像',
      description: '最後指定焦段、光學效果與底片模擬，控制影像的細節質感。',
      keys: ['lensId', 'opticalEffectId', 'filmId'],
    },
  ],
};

function getControlOptionLabel(controls, key, value) {
  if (!value) return '';
  const control = controls.find((item) => item.key === key);
  const option = control?.options?.find((item) => item.id === value);
  if (!option || option.zh === '全無' || option.zh === '隨機') return '';
  return option.zh || '';
}

function buildSummaryText(parts) {
  const filtered = parts.filter(Boolean);
  return filtered.length > 0 ? filtered.join(' / ') : '尚未形成明確選項';
}

function buildWorkspaceSummary(locks, controls) {
  const subjectTypeLabel = getControlOptionLabel(controls, 'subjectCount', locks.subjectCount);
  const specialSubjectControl = controls.find((control) => control.key === 'specialSubjectId');
  const specialSubjectOption = specialSubjectControl?.options?.find((option) => option.id === locks.specialSubjectId);
  const isSpecialSubjectMode = Boolean(specialSubjectOption?.specialSubject);
  const characterSummary = isSpecialSubjectMode
    ? specialSubjectOption?.zh || '特殊角色'
    : buildSummaryText([
        subjectTypeLabel === '上傳人物' ? subjectTypeLabel : '',
        getControlOptionLabel(controls, 'facialFeaturesId', locks.facialFeaturesId),
        getControlOptionLabel(controls, 'facialFeaturesAId', locks.facialFeaturesAId),
        getControlOptionLabel(controls, 'facialFeaturesBId', locks.facialFeaturesBId),
        getControlOptionLabel(controls, 'bodyTypeId', locks.bodyTypeId),
        getControlOptionLabel(controls, 'hairstyleId', locks.hairstyleId),
        getControlOptionLabel(controls, 'hairstyleAId', locks.hairstyleAId),
        getControlOptionLabel(controls, 'hairstyleBId', locks.hairstyleBId),
        getControlOptionLabel(controls, 'hairColorId', locks.hairColorId),
        getControlOptionLabel(controls, 'hairColorAId', locks.hairColorAId),
        getControlOptionLabel(controls, 'hairColorBId', locks.hairColorBId),
      ]);
  const characterMeta = buildSummaryText([
    getControlOptionLabel(controls, 'expressionId', locks.expressionId),
    getControlOptionLabel(controls, 'expressionAId', locks.expressionAId),
    getControlOptionLabel(controls, 'expressionBId', locks.expressionBId),
    getControlOptionLabel(controls, 'duoPoseId', locks.duoPoseId),
    getControlOptionLabel(controls, 'poseId', locks.poseId),
    getControlOptionLabel(controls, 'specialActionId', locks.specialActionId),
    getControlOptionLabel(controls, 'duoInteractionId', locks.duoInteractionId),
  ]);
  const wardrobeSummary = buildSummaryText([
    getControlOptionLabel(controls, 'specialOutfitId', locks.specialOutfitId),
    getControlOptionLabel(controls, 'specialOutfitAId', locks.specialOutfitAId),
    getControlOptionLabel(controls, 'specialOutfitBId', locks.specialOutfitBId),
    getControlOptionLabel(controls, 'outfitPresetId', locks.outfitPresetId),
    getControlOptionLabel(controls, 'outfitPresetAId', locks.outfitPresetAId),
    getControlOptionLabel(controls, 'outfitPresetBId', locks.outfitPresetBId),
    getControlOptionLabel(controls, 'dressId', locks.dressId),
    getControlOptionLabel(controls, 'dressAId', locks.dressAId),
    getControlOptionLabel(controls, 'dressBId', locks.dressBId),
    getControlOptionLabel(controls, 'topId', locks.topId),
    getControlOptionLabel(controls, 'topAId', locks.topAId),
    getControlOptionLabel(controls, 'topBId', locks.topBId),
    getControlOptionLabel(controls, 'topFitId', locks.topFitId),
    getControlOptionLabel(controls, 'topStylingId', locks.topStylingId),
    getControlOptionLabel(controls, 'pantsId', locks.pantsId),
    getControlOptionLabel(controls, 'pantsAId', locks.pantsAId),
    getControlOptionLabel(controls, 'pantsBId', locks.pantsBId),
    getControlOptionLabel(controls, 'skirtId', locks.skirtId),
    getControlOptionLabel(controls, 'skirtAId', locks.skirtAId),
    getControlOptionLabel(controls, 'skirtBId', locks.skirtBId),
    getControlOptionLabel(controls, 'bottomFitId', locks.bottomFitId),
    getControlOptionLabel(controls, 'bottomRiseId', locks.bottomRiseId),
    getControlOptionLabel(controls, 'legwearId', locks.legwearId),
    getControlOptionLabel(controls, 'shoesId', locks.shoesId),
    getControlOptionLabel(controls, 'legwearAId', locks.legwearAId),
    getControlOptionLabel(controls, 'shoesAId', locks.shoesAId),
    getControlOptionLabel(controls, 'headAccessoryAId', locks.headAccessoryAId),
    getControlOptionLabel(controls, 'eyewearAId', locks.eyewearAId),
    getControlOptionLabel(controls, 'earringsAId', locks.earringsAId),
    getControlOptionLabel(controls, 'neckAccessoryAId', locks.neckAccessoryAId),
    getControlOptionLabel(controls, 'legwearBId', locks.legwearBId),
    getControlOptionLabel(controls, 'shoesBId', locks.shoesBId),
    getControlOptionLabel(controls, 'headAccessoryBId', locks.headAccessoryBId),
    getControlOptionLabel(controls, 'eyewearBId', locks.eyewearBId),
    getControlOptionLabel(controls, 'earringsBId', locks.earringsBId),
    getControlOptionLabel(controls, 'neckAccessoryBId', locks.neckAccessoryBId),
  ]);
  const sceneSummary = buildSummaryText([
    getControlOptionLabel(controls, 'sceneAttributeId', locks.sceneAttributeId),
    getControlOptionLabel(controls, 'locationId', locks.locationId),
    getControlOptionLabel(controls, 'lightingId', locks.lightingId),
    getControlOptionLabel(controls, 'lightDirectionId', locks.lightDirectionId),
    getControlOptionLabel(controls, 'aspectRatio', locks.aspectRatio),
  ]);
  const photographySummary = buildSummaryText([
    getControlOptionLabel(controls, 'styleId', locks.styleId),
    getControlOptionLabel(controls, 'cameraSystemId', locks.cameraSystemId),
    getControlOptionLabel(controls, 'framingId', locks.framingId),
    getControlOptionLabel(controls, 'angleId', locks.angleId),
    getControlOptionLabel(controls, 'orbitId', locks.orbitId),
    getControlOptionLabel(controls, 'lensId', locks.lensId),
    getControlOptionLabel(controls, 'opticalEffectId', locks.opticalEffectId),
    getControlOptionLabel(controls, 'filmId', locks.filmId),
  ]);

  return {
    character: {
      summary: characterSummary,
      meta: characterMeta === '尚未形成明確選項' ? '' : characterMeta,
    },
    wardrobe: {
      summary: wardrobeSummary,
      meta: '',
    },
    scene: {
      summary: sceneSummary,
      meta: '',
    },
    photography: {
      summary: photographySummary,
      meta: '',
    },
  };
}

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
  if (label.startsWith('套裝：')) return '套裝';
  if (label.startsWith('連身：')) return '連身';
  if (label.includes('配色') || option?.topColor || option?.bottomColor) return '配色';
  if (label.includes('特殊') || label.includes('風格') || label.includes('造型')) return '造型';
  return '選項';
}

function buildWardrobeLayerInsights(locks, controls, isSpecialOutfitActive, isAnyOutfitPresetActive) {
  const selected = (key) => getControlOptionLabel(controls, key, locks[key]);
  const hasAny = (keys) => keys.some((key) => selected(key));
  const mainOutfitLabels = [
    selected('specialOutfitId'),
    selected('specialOutfitAId'),
    selected('specialOutfitBId'),
    selected('outfitPresetId'),
    selected('outfitPresetAId'),
    selected('outfitPresetBId'),
    selected('dressId'),
    selected('dressAId'),
    selected('dressBId'),
    selected('topId'),
    selected('topAId'),
    selected('topBId'),
    selected('pantsId'),
    selected('pantsAId'),
    selected('pantsBId'),
    selected('skirtId'),
    selected('skirtAId'),
    selected('skirtBId'),
  ].filter(Boolean);
  const paletteLabels = [
    selected('outfitPresetPrimaryColorId'),
    selected('outfitPresetContrastColorId'),
    selected('outfitPresetLockedPaletteId'),
    selected('outfitPresetAPrimaryColorId'),
    selected('outfitPresetAContrastColorId'),
    selected('outfitPresetALockedPaletteId'),
    selected('outfitPresetBPrimaryColorId'),
    selected('outfitPresetBContrastColorId'),
    selected('outfitPresetBLockedPaletteId'),
    selected('topBottomPaletteId'),
    selected('topBottomPaletteAId'),
    selected('topBottomPaletteBId'),
  ].filter(Boolean);
  const layerLabels = [
    selected('outerwearId'),
    selected('outerwearAId'),
    selected('outerwearBId'),
    selected('legwearId'),
    selected('legwearAId'),
    selected('legwearBId'),
    selected('shoesId'),
    selected('shoesAId'),
    selected('shoesBId'),
  ].filter(Boolean);
  const accessoryLabels = [
    selected('headAccessoryId'),
    selected('headAccessoryAId'),
    selected('headAccessoryBId'),
    selected('eyewearId'),
    selected('eyewearAId'),
    selected('eyewearBId'),
    selected('earringsId'),
    selected('earringsAId'),
    selected('earringsBId'),
    selected('neckAccessoryId'),
    selected('neckAccessoryAId'),
    selected('neckAccessoryBId'),
    selected('wristAccessoryId'),
    selected('ringId'),
    selected('waistAccessoryId'),
  ].filter(Boolean);

  const notes = [];
  if (isSpecialOutfitActive) {
    notes.push('特殊穿搭維持完整造型描述，不再額外改寫服裝結構。');
  }
  if (isAnyOutfitPresetActive && hasAny(['outerwearId', 'outerwearAId', 'outerwearBId'])) {
    notes.push('套裝/連身會被視為主體輪廓，外套固定作為完整最外層，避免西裝或罩衫被模型拆成奇怪形狀。');
  }
  if (isAnyOutfitPresetActive && hasAny(['legwearId', 'legwearAId', 'legwearBId'])) {
    notes.push('襪類只作為露出的腿部或邊緣細節，不要求模型為了看見襪子而破壞長褲、長裙或連身洋裝。');
  }
  if (isAnyOutfitPresetActive && paletteLabels.length > 0) {
    notes.push('套裝/連身配色會套用在主體服裝上，不會強迫拆成獨立上身與下身版型。');
  }
  if (mainOutfitLabels.length === 0) {
    notes.push('先選整體穿搭或上下身單件後，這裡會顯示更明確的疊穿順序。');
  }

  return {
    main: mainOutfitLabels.slice(0, 3),
    palette: paletteLabels.slice(0, 3),
    layers: layerLabels.slice(0, 4),
    accessories: accessoryLabels.slice(0, 4),
    notes,
  };
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
  const visibleOptions = control.options.filter((option) => {
    if (!normalizedQuery) return true;
    return `${option.zh} ${option.en || ''}`.toLowerCase().includes(normalizedQuery);
  });
  const categories = Array.from(new Set(control.options.map((option) => getOptionCategory(option, control))));

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
            placeholder="搜尋套裝、連身、配色或 prompt 關鍵字"
            autoFocus
          />
        </div>

        <div className="wardrobe-picker-category-row">
          {categories.map((category) => (
            <span key={category} className="wardrobe-picker-category">{category}</span>
          ))}
          <span className="wardrobe-picker-count">{visibleOptions.length} options</span>
        </div>

        <div className="wardrobe-picker-option-grid">
          {visibleOptions.map((option) => {
            const swatches = getOptionSwatches(option);
            const isActive = selectedOption?.id === option.id;
            const isColorOption = swatches.length > 0;
            const isNoneOption = option.zh === '全無' || option.id === 'none';
            const isRandomOption = Boolean(option.random) || option.id === 'random';
            const useColorCardStyle = isColorOption || isNoneOption || isRandomOption;
            return (
              <button
                key={option.id}
                type="button"
                className={`wardrobe-picker-option ${useColorCardStyle ? 'wardrobe-picker-option-color' : ''} ${isNoneOption ? 'wardrobe-picker-option-none' : ''} ${isActive ? 'wardrobe-picker-option-active' : ''}`}
                disabled={option.disabled}
                onClick={() => onSelect(option.id)}
              >
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
                {option.en && !useColorCardStyle ? <span className="wardrobe-picker-option-copy">{option.en}</span> : null}
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
}) {
  const [isLightingReferenceOpen, setIsLightingReferenceOpen] = useState(false);
  const [activeWardrobePickerKey, setActiveWardrobePickerKey] = useState('');
  const [wardrobePickerQuery, setWardrobePickerQuery] = useState('');
  const [activeSection, setActiveSection] = useState('character');
  const [activeSubpanels, setActiveSubpanels] = useState({
    character: 'identity',
    wardrobe: 'overall',
    scene: 'space',
    photography: 'style',
  });

  const workspaceSummary = useMemo(() => buildWorkspaceSummary(locks, lockControls), [locks, lockControls]);
  const generationSummary = [
    workspaceSummary.character.summary,
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
  const isSpecialSubjectMode = Boolean(specialSubjectOption?.specialSubject);
  const isAndroidSubjectMode = specialSubjectOption?.specialSubject === 'android';
  const effectiveCharacterSubpanel = activeSubpanel;
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
  const wardrobeLayerInsights = useMemo(
    () => buildWardrobeLayerInsights(locks, wardrobeLockControls, isSpecialOutfitActive, isAnyOutfitPresetActive),
    [locks, wardrobeLockControls, isSpecialOutfitActive, isAnyOutfitPresetActive],
  );
  const activeWardrobePickerControl = wardrobeLockControls.find((control) => control.key === activeWardrobePickerKey);
  const currentModeBadges = [
    isSpecialSubjectMode ? (specialSubjectOption?.zh || '特殊角色') : '',
    isReferenceSubjectMode ? '上傳人物' : '',
    isDuoMode ? '雙人' : '',
    isCloseupMode ? '特寫模式' : '',
    isAnyOutfitPresetActive ? '套裝接管' : '',
    isSpecialOutfitActive ? '特殊穿搭' : '',
  ].filter(Boolean);
  const sectionDiagnostics = {
    character: {
      status: isSpecialSubjectMode ? '接管中' : formatSelectionStatus(countEffectiveSelections('character', locks, lockControls)),
      chips: [
        isSpecialSubjectMode ? (specialSubjectOption?.zh || '特殊角色') : '',
        isReferenceSubjectMode ? '上傳人物' : '',
        isDuoMode ? '雙人設定' : '',
        isCloseupMode ? '特寫收斂' : '',
      ].filter(Boolean),
    },
    wardrobe: {
      status: isSpecialSubjectMode ? '已停用' : (isAnyOutfitPresetActive || isSpecialOutfitActive ? '接管中' : formatSelectionStatus(countEffectiveSelections('wardrobe', locks, lockControls))),
      chips: [
        isSpecialSubjectMode ? '特殊角色停用穿搭' : '',
        isSpecialOutfitActive ? '特殊穿搭接管' : '',
        isAnyOutfitPresetActive ? '套裝接管單件' : '',
      ].filter(Boolean),
    },
    scene: {
      status: isCloseupMode ? '特寫中' : formatSelectionStatus(countEffectiveSelections('scene', locks, lockControls)),
      chips: [
        getControlOptionLabel(lockControls, 'locationId', locks.locationId) ? '場景錨點' : '',
        getControlOptionLabel(lockControls, 'lightingId', locks.lightingId) ? '環境光條件' : '',
      ].filter(Boolean),
    },
    photography: {
      status: isCloseupMode ? '特寫中' : formatSelectionStatus(countEffectiveSelections('photography', locks, lockControls)),
      chips: [
        isCloseupMode ? '收斂構圖欄位' : '',
        getControlOptionLabel(lockControls, 'styleId', locks.styleId) ? '攝影風格' : '',
        getControlOptionLabel(lockControls, 'cameraSystemId', locks.cameraSystemId) ? '攝影器材' : '',
      ].filter(Boolean),
    },
  };

  const isControlDisabled = (control) => (
    (isCloseupMode && !closeupAllowedKeys.has(control.key))
    || (control.key === 'poseId' && Boolean(locks.specialActionId) && !isNoneSelected('specialActionId', locks.specialActionId, characterLockControls))
    || (control.key === 'specialActionId' && Boolean(locks.poseId) && !isNoneSelected('poseId', locks.poseId, characterLockControls))
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
      if (control.key === 'poseId' && value && !isNoneSelected('poseId', value, characterLockControls)) {
        next.specialActionId = '';
      }
      if (control.key === 'specialActionId' && value && !isNoneSelected('specialActionId', value, characterLockControls)) {
        next.poseId = '';
      }
      return next;
    });
  };

  const openWardrobePicker = (control) => {
    setActiveWardrobePickerKey(control.key);
    setWardrobePickerQuery('');
  };

  const renderControlGrid = (controls) => (
    <div className="lock-grid detail-lock-grid">
      {controls.map((control) => {
        const disabled = isControlDisabled(control);
        if (activeSection === 'wardrobe' && WARDROBE_PICKER_KEYS.has(control.key)) {
          return (
            <WardrobePickerField
              key={control.key}
              control={control}
              value={locks[control.key]}
              disabled={disabled}
              onOpen={() => openWardrobePicker(control)}
              onChange={(value) => applyControlValue(control, value)}
              onCopy={(text) => handleCopyText(`${control.label} copied`, text)}
            />
          );
        }

        return (
          <SelectControlField
            key={control.key}
            control={control}
            value={locks[control.key]}
            disabled={disabled}
            onChange={(value) => applyControlValue(control, value)}
            onCopy={(text) => handleCopyText(`${control.label} copied`, text)}
          />
        );
      })}
    </div>
  );

  const renderSceneControls = () => (
    <div className="control-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Scene & Environment</div>
          <p className="workspace-panel-copy">{activeSubpanel?.description || '先決定場景、環境與光線，右側會同步反映成目前可直接使用的 Grok prompt。'}</p>
        </div>
        <button className="secondary reference-trigger-btn" type="button" onClick={() => setIsLightingReferenceOpen(true)}>
          查看光線定位對照
        </button>
      </div>
      {renderControlGrid(filterControlsByKeys(coreLockControls, activeSubpanel?.keys || []))}
    </div>
  );

  const renderPhotographyControls = () => (
    <div className="control-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Photography & Rendering</div>
          <p className="workspace-panel-copy">{activeSubpanel?.description || '在這裡整理攝影師語氣、器材、構圖與成像風格。'}</p>
        </div>
      </div>
      {renderControlGrid(filterControlsByKeys(coreLockControls, activeSubpanel?.keys || []))}
    </div>
  );

  const renderCharacterControls = () => (
    <div className="control-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Character Setup</div>
          <p className="workspace-panel-copy">{effectiveCharacterSubpanel?.description || '把人物身份、臉部與姿態先固定下來，後面換穿搭與場景會更穩定。'}</p>
        </div>
      </div>
      {locks.subjectCount === 'reference' ? (
        <div className="context-note">
          此模式不在 app 內上傳圖片；生成後請把同一張人物參考圖直接附給 Midjourney、Grok 或 Gemini，prompt 會以附圖人物五官與身份為主。
        </div>
      ) : null}
      {isSpecialSubjectMode ? (
        <div className="context-note">
          {isAndroidSubjectMode
            ? '女性人形機器人會接管人物主體，但仍可套用髮型、髮色、神情眼神與姿勢動作；身份基底中的五官、體態與 B 穿搭設定會暫時停用。'
            : '特殊角色會接管人物主體，只保留神情眼神與姿勢動作；身份基底中的五官、體態、髮型、髮色與 B 穿搭設定會暫時停用。'}
        </div>
      ) : null}
      {isCloseupMode ? (
        <div className="context-note">
          目前為特寫模式，系統會自動收斂不必要欄位，保留與人物、主要服裝輪廓與構圖相關的設定，讓 prompt 更聚焦。
        </div>
      ) : null}
      {renderControlGrid(filterControlsByKeys(characterLockControls, effectiveCharacterSubpanel?.keys || []))}
    </div>
  );

  const renderWardrobeControls = () => (
    <div className="control-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Style & Wardrobe</div>
          <p className="workspace-panel-copy">{activeSubpanel?.description || '在這裡分段處理整體造型、單件、鞋襪與配件。'}</p>
        </div>
      </div>
      {isOutfitPresetActive ? (
        <div className="context-note">
          套裝/連身已接管主要服裝輪廓，和它重疊的上身、下身單件欄位會自動停用，避免 prompt 互相打架。
        </div>
      ) : null}
      {isSpecialOutfitActive ? (
        <div className="context-note">
          特殊穿搭是完整從頭到腳造型，已接管所有服裝、鞋襪與配件欄位。
        </div>
      ) : null}
      {isSpecialSubjectMode ? (
        <div className="context-note">
          特殊角色目前不使用服裝、鞋襪或配件欄位，這一區已暫時停用，請改用角色本身、場景、鏡頭、光線與風格去塑造作品氣氛。
        </div>
      ) : null}
      <WardrobeLayerPanel insights={wardrobeLayerInsights} />
      {renderControlGrid(filterControlsByKeys(wardrobeLockControls, activeSubpanel?.keys || []))}
    </div>
  );

  const renderEditorPanel = () => {
    if (activeSection === 'photography') return renderPhotographyControls();
    if (activeSection === 'scene') return renderSceneControls();
    if (activeSection === 'wardrobe') return renderWardrobeControls();
    return renderCharacterControls();
  };

  const generationPromptCards = [
    {
      title: 'Grok Prompt',
      value: previewPrompt?.grokPrompt || '',
      placeholder: '目前尚無可顯示的 Grok Prompt。',
      description: '結構化主 prompt，適合需要清楚描述人物、穿搭、場景與鏡頭的生成流程。',
      copyLabel: 'Grok copied',
    },
    {
      title: 'Z-Image Prompt',
      value: previewPrompt?.zImagePrompt || '',
      placeholder: '目前尚無可顯示的 Z-Image Prompt。',
      description: '較適合直接輸入影像生成模型的整合版本，保留重要視覺條件。',
      copyLabel: 'Z-Image copied',
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

        <aside className="page1-preview-column">
          <section className="page1-preview-panel page1-output-panel lock-panel reference-output-panel">
            <div className="reference-output-header">
              <div>
                <div className="control-section-title">Generation Outputs</div>
                <p className="workspace-panel-copy">右側集中整理目前 PAGE1 的三種生成輸出。</p>
              </div>
              <span className="reference-output-count">{generationPromptCards.length} outputs</span>
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
                onCopy={(text) => handleCopyText('Generation summary copied', text)}
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
                placeholder="貼上 Midjourney、Grok Structured Prompt，或本工具匯出的標準格式內容"
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
