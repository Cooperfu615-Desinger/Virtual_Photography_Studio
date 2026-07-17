import { POSE_COMPOSER_KEYS } from '../features/page1/page1Schema.js';

const RESET_TO_DEFAULT_KEYS = new Set([
  'specialSubjectId',
  'characterProfileId',
  'imageTypePresetId',
  'sceneAttributeId',
  'fixedCompositionSetId',
  'fixedSetPositionId',
  'fixedSetBackgroundStateId',
  'fixedSetCaptureModeId',
  'fixedSetPerformanceStateId',
  'completeLookPaletteId',
  'completeLookPaletteAId',
  'completeLookPaletteBId',
  'topBottomPaletteId',
  'topBottomPaletteAId',
  'topBottomPaletteBId',
]);

const PRESERVE_KEYS = new Set(['subjectCount', 'posePropId']);

function getControlByKey(controls, key) {
  return controls.find((control) => control.key === key) || null;
}

export function getPage1ControlActionMode(controlOrKey, controls = []) {
  const control = typeof controlOrKey === 'string'
    ? getControlByKey(controls, controlOrKey)
    : controlOrKey;
  const key = control?.key || controlOrKey;

  if (PRESERVE_KEYS.has(key) || control?.required) return 'preserve';
  if (POSE_COMPOSER_KEYS.includes(key)) return 'random';
  if (RESET_TO_DEFAULT_KEYS.has(key) || control?.section === 'hidden') return 'reset';
  if (control?.suppressDefaultRandomOption) return 'reset';
  return 'random';
}

function getNoneOrDefaultValue(control, fallback = '') {
  const noneOption = control?.options?.find((option) => option.zh === '全無');
  if (noneOption) return noneOption.id;
  if (control?.defaultValue !== undefined) return control.defaultValue;
  return fallback;
}

export function getPage1SectionActionLabels(panel, controls = []) {
  const keys = Array.from(new Set(panel?.keys || []));
  const modes = keys.map((key) => getPage1ControlActionMode(key, controls));
  const randomCount = modes.filter((mode) => mode === 'random').length;

  return {
    random: panel?.randomActionLabel
      || (randomCount > 0 ? '全部隨機' : '重設為預設'),
    none: '清空可清除項目',
  };
}

export function randomizeLockKeys(locks, keys, defaultLocks = {}, controls = []) {
  const next = { ...locks };
  const controlsByKey = new Map(controls.map((control) => [control.key, control]));

  Array.from(new Set(keys)).forEach((key) => {
    const control = controlsByKey.get(key);
    const mode = getPage1ControlActionMode(control || key, controls);
    if (mode === 'preserve') return;
    if (mode === 'reset') {
      next[key] = getNoneOrDefaultValue(control, defaultLocks[key] ?? '');
      return;
    }
    next[key] = POSE_COMPOSER_KEYS.includes(key)
      ? (control?.options?.find((option) => option.id === 'random')?.id || 'random')
      : '';
  });

  return next;
}

export function setLockKeysToNone(locks, keys, controls = []) {
  const next = { ...locks };
  const controlsByKey = new Map(controls.map((control) => [control.key, control]));

  Array.from(new Set(keys)).forEach((key) => {
    if (key === 'subjectCount') return;
    const control = controlsByKey.get(key);
    const fallback = Array.isArray(next[key]) ? [] : '';
    next[key] = getNoneOrDefaultValue(control, fallback);
  });

  return next;
}
