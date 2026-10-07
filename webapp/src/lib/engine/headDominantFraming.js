export const HEAD_DOMINANT_FRAMING_ZH = '頭部主導近景';
export const HEAD_DOMINANT_FRAMING_ID = 'camera:景別構圖-framing:頭部主導近景:10';
const ALLOWED_ANGLES = new Set(['高位俯視鏡頭', '平視高度鏡頭', '正上方俯視鏡頭']);

export const isHeadDominantFraming = framing => framing?.zh === HEAD_DOMINANT_FRAMING_ZH;
export const headDominantAngleAllowed = angle => !angle || angle.id === 'none'
  || angle.zh === '全無' || ALLOWED_ANGLES.has(angle.zh);

export function prepareHeadDominantAngleControl(control, locks, controls) {
  if (control.key !== 'angleId') return control;
  const framing = controls.find(c => c.key === 'framingId')?.options.find(o => o.id === locks.framingId);
  if (!isHeadDominantFraming(framing)) return control;
  const options = control.options.map(option => headDominantAngleAllowed(option) ? option : {
    ...option, disabled: true,
    desc: `${option.desc || ''} 頭部主導近景只適用高位俯視、平視及正上方。`.trim(),
  });
  const selected = options.find(o => o.id === locks.angleId);
  return { ...control, options, ...(selected?.disabled ? {
    closureDisplayValue: options.find(option => option.zh === '全無')?.id || 'none',
    helpText: '目前視角不適用，暫顯全無；原選值保留，切回其他景別即可恢復。',
  } : {}) };
}

// Only this main framing owns the close-distance cue. Synthetic chest/full
// derivatives retain their existing camera wording and crop.
export function headDominantCameraText(framing, angle, subjectKind = 'woman') {
  if (!isHeadDominantFraming(framing)) return '';
  const target = subjectKind === 'subject' ? 'the subject' : 'her';
  if (angle?.zh === '高位俯視鏡頭') {
    return `At close portrait distance, the camera is positioned above ${target} and angled downward toward the head and upper body.`;
  }
  if (angle?.zh === '正上方俯視鏡頭') {
    return `At close portrait distance, the camera is directly above ${target} and points vertically downward at a 90-degree angle.`;
  }
  return '';
}

export function matchHeadDominantAngle(prompt, angles) {
  const text = String(prompt || '').toLowerCase();
  const label = text.includes('top-down view') || text.includes('points vertically downward at a 90-degree angle')
    ? '正上方俯視鏡頭'
    : text.includes('high angle, looking down') || text.includes('angled downward toward the head and upper body')
      ? '高位俯視鏡頭' : text.includes('eye-level view') ? '平視高度鏡頭' : '';
  return angles.find(angle => angle.zh === label) || null;
}
