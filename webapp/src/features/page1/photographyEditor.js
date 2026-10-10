import { getCameraControlDisplayLabel } from '../../lib/page1CameraLabels.js';
import { fixedSetAllowsLensVariation } from '../../lib/engine/stationFixedComposition.js';
import { fixedSetAllowsFramingVariation } from '../../lib/engine/carriageFixedComposition.js';
import { getFixedSceneCameraStatus } from './sceneEditor.js';

// Card placement keeps the existing control keys and independent action scopes.
export const PHOTOGRAPHY_EDITOR_GROUPS = [
  { id: 'image-type', label: '成品類型', keys: ['imageTypePresetId'] },
  { id: 'composition', label: '構圖與視角', keys: ['framingId', 'angleId', 'orbitId'] },
  { id: 'optics', label: '鏡頭與光學', keys: ['lensId', 'apertureId', 'shutterId', 'opticalEffectId'] },
  { id: 'look', label: '風格與成像', keys: ['styleId', 'filmId'] },
];

function selectedLabel(field) {
  const { control, value } = field;
  if (value === '' || value === undefined || value === null || value === 'random') {
    return '隨機（生成時決定）';
  }
  const option = control.options?.find(item => item.id === value);
  if (value === 'none' || option?.zh === '全無' || option?.meta?.tags?.includes('none')) return '全無';
  return option ? getCameraControlDisplayLabel(control.key, option) : '未辨識的設定';
}

function fixedManagement(field, set) {
  const key = field.control.key;
  let value = '';
  let reason = '';
  if (key === 'framingId' && !fixedSetAllowsFramingVariation(set)) {
    value = '固定場景構圖';
    reason = '此場景使用固定構圖，景別由場景決定。';
  } else if (key === 'angleId' && set.allowsCameraVariation === false) {
    value = '固定取景視角';
    reason = '此場景使用固定取景視角，俯仰角度由場景決定。';
  } else if (key === 'orbitId' && (set.allowsCameraVariation === false || set.orbitMode === 'bench-front')) {
    const label = selectedLabel(field);
    value = set.orbitMode === 'bench-front' && label === '正面' ? label : '固定取景方向';
    reason = set.orbitMode === 'bench-front'
      ? '相機固定在長椅正對面，拍攝方位由場景決定。'
      : '此場景使用固定取景方向，環繞角度由場景決定。';
  } else if (key === 'lensId' && !fixedSetAllowsLensVariation(set)) {
    value = '由固定場景決定';
    reason = '此場景不使用獨立焦段設定，取景由固定場景決定。';
  } else if (key === 'opticalEffectId') {
    value = '全無';
    reason = '固定場景不附加獨立光學效果。';
  }
  return value ? { label: '場景管理', value, reason } : null;
}

function enrichField(field, fixedSet, handLocksOrbit) {
  let management = null;
  // Prepared fields own availability and effective values; this model only describes them.
  if (field.disabled) {
    if (fixedSet) management = fixedManagement(field, fixedSet);
    if (!management && handLocksOrbit && field.control.key === 'orbitId') {
      management = {
        label: '自拍動作管理',
        value: '由自拍動作決定',
        reason: '目前自拍手部動作管理拍攝方位，環繞角度暫不可調整。',
      };
    }
  }
  return { ...field, management };
}

export function buildPhotographyEditorModel(fields = [], context = {}) {
  const fixedSet = context.fixedSet?.id && context.fixedSet.id !== 'none' ? context.fixedSet : null;
  const fieldsByKey = new Map(fields.map(field => [field.control.key, field]));
  const groups = PHOTOGRAPHY_EDITOR_GROUPS.map(group => {
    const preparedFields = group.keys.map(key => fieldsByKey.get(key)).filter(Boolean)
      .map(field => enrichField(field, fixedSet, Boolean(context.handLocksOrbit)));
    return {
      ...group,
      fields: preparedFields,
      summary: preparedFields.map(field => field.management?.value || selectedLabel(field)).join(' / '),
      actionKeys: preparedFields.filter(field => !field.disabled).map(field => field.control.key),
    };
  });
  return {
    groups,
    fixedNotice: fixedSet ? { name: fixedSet.zh, text: getFixedSceneCameraStatus(fixedSet) } : null,
  };
}
