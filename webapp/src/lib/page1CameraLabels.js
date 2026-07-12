const ORBIT_LABEL_PATTERN = /^(正面|左前|左側|左後|背面|右後|右側|右前)/;

/**
 * Camera orbit angles keep their numeric IDs internally for compatibility,
 * but the Page 1 controls show the short directional label only.
 */
export function getCameraControlDisplayLabel(controlKey, option) {
  const label = option?.zh || '';
  if (controlKey !== 'orbitId' || label === '全無' || label === '隨機') return label;
  return label.match(ORBIT_LABEL_PATTERN)?.[1] || label;
}
