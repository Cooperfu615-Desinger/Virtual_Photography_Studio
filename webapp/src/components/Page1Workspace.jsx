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
import { randomizeLockKeys } from '../lib/page1SectionRandom.js';

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

const POSE_COMPOSER_KEYS = ['poseBaseId', 'poseArrangementId', 'poseHandId', 'poseHeadId', 'poseAnchorId'];
const POSE_COMPOSER_CONTEXT_KEYS = new Set(['poseArrangementId', 'poseAnchorId']);
const POSE_COMPOSER_BASE_IDS = new Set(['standing', 'sitting', 'kneeling', 'squatting', 'lying']);

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

const WARDROBE_GARMENT_CONTROL_DIVIDERS = {
  topId: '上身單品',
  topAId: '上身單品',
  pantsId: '下身單品',
  pantsAId: '下身單品',
};

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
        'poseBaseId',
        'poseArrangementId',
        'poseHandId',
        'poseHeadId',
        'poseAnchorId',
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
      description: '先選攝影師語氣，決定影像的觀看方式、人物距離、色彩節奏與整體作者語彙。',
      keys: ['styleId'],
    },
    {
      id: 'composition',
      label: '構圖與視角',
      description: '調整景別、相機視角與拍攝方位，決定人物和場景在畫面中的關係。',
      keys: ['framingId', 'angleId', 'orbitId'],
    },
    {
      id: 'optics',
      label: '鏡頭與光學',
      description: '指定焦段與光學效果，控制透視、空間壓縮、景深、flare、暗角與鏡片瑕疵。',
      keys: ['lensId', 'opticalEffectId'],
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
  const hasReferenceImageOptions = visibleOptions.some((option) => getReferenceImageUrl(option));
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
    isWormEyeAngle ? '蟲眼視角' : '',
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
        isWormEyeAngle ? '攝影風格與鏡頭光學全無' : '',
        getControlOptionLabel(lockControls, 'styleId', locks.styleId) ? '攝影風格' : '',
        getControlOptionLabel(lockControls, 'filmId', locks.filmId) ? '成像模擬' : '',
      ].filter(Boolean),
    },
  };

  const specialActionControl = characterLockControls.find((control) => control.key === 'specialActionId');
  const getSpecialActionOption = (id) => specialActionControl?.options?.find((option) => option.id === id) || null;
  const isSocialShootingActionOption = (option) => Boolean(option?.meta?.tags?.includes('social_shooting_action'));
  const selectedSpecialActionOption = getSpecialActionOption(locks.specialActionId);
  const selectedSpecialActionIsSocial = isSocialShootingActionOption(selectedSpecialActionOption);
  const isPoseComposerValueActive = (key, value = locks[key]) => (
    Boolean(value) && !isNoneSelected(key, value, characterLockControls)
  );
  const isPoseComposerActive = POSE_COMPOSER_KEYS.some((key) => isPoseComposerValueActive(key));
  const selectedPoseBaseId = POSE_COMPOSER_BASE_IDS.has(locks.poseBaseId) ? locks.poseBaseId : '';
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
  const resetPoseComposerLocks = (target) => {
    POSE_COMPOSER_KEYS.forEach((key) => {
      target[key] = 'none';
    });
  };

  const isControlDisabled = (control) => (
    (isCloseupMode && !closeupAllowedKeys.has(control.key))
    || (isWormEyeAngle && ['styleId', 'lensId', 'opticalEffectId'].includes(control.key))
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
    updateLocks((prev) => randomizeLockKeys(prev, getSectionKeys(activeSection), createEmptyLocks()));
  };

  const renderSectionRandomButton = () => (
    <button className="secondary page1-section-random-btn" type="button" onClick={handleRandomizeActiveSection}>
      全部隨機
    </button>
  );

  const openWardrobePicker = (control) => {
    setActiveWardrobePickerKey(control.key);
    setWardrobePickerQuery('');
  };

  const renderControlGrid = (controls) => (
    <div className="lock-grid detail-lock-grid">
      {controls.map((rawControl) => {
        const control = buildPoseComposerControl(rawControl);
        const disabled = isControlDisabled(control);
        const dividerLabel = activeSection === 'wardrobe' && activeSubpanel?.id === 'garments'
          ? WARDROBE_GARMENT_CONTROL_DIVIDERS[control.key]
          : '';
        const field = activeSection === 'wardrobe' && WARDROBE_PICKER_KEYS.has(control.key) ? (
          <WardrobePickerField
            control={control}
            value={locks[control.key]}
            disabled={disabled}
            onOpen={() => openWardrobePicker(control)}
            onChange={(value) => applyControlValue(control, value)}
            onCopy={(text) => handleCopyText(`${control.label} copied`, text)}
          />
        ) : (
          <SelectControlField
            control={control}
            value={locks[control.key]}
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
          <p className="workspace-panel-copy">{activeSubpanel?.description || '先決定場景、環境與光線，右側會同步反映成目前可直接使用的 Gpt prompt。'}</p>
        </div>
        <div className="page1-section-header-actions">
          {renderSectionRandomButton()}
          <button className="secondary reference-trigger-btn" type="button" onClick={() => setIsLightingReferenceOpen(true)}>
            查看光線定位對照
          </button>
        </div>
      </div>
      {renderControlGrid(filterControlsByKeys(coreLockControls, activeSubpanel?.keys || []))}
    </div>
  );

  const renderPhotographyControls = () => (
    <div className="control-section">
      <div className="control-section-header">
        <div>
          <div className="control-section-title">Photography & Rendering</div>
          <p className="workspace-panel-copy">{activeSubpanel?.description || '在這裡整理攝影師語氣、構圖視角、鏡頭光學與成像模擬。'}</p>
        </div>
        {renderSectionRandomButton()}
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
        {renderSectionRandomButton()}
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
        {renderSectionRandomButton()}
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
