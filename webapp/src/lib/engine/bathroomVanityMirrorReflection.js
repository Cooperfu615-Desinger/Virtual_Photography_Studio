export const BATHROOM_VANITY_LOCATION_ID = 'locations:生活感室內-indoor-lifestyle:室內-浴室鏡前-洗手台:8';
export const BATHROOM_VANITY_LOCATION_ZH = '室內：浴室鏡前 / 洗手台';

const REFLECTION_TEXT_BY_ORBIT_ZH = Object.freeze({
  '正面 0 度': 'The full mirror behind her accurately reflects the back of the same woman.',
  '左前 45 度': 'The full mirror behind her accurately reflects the same woman from a matching rear three-quarter angle.',
  '左側 90 度': 'The full mirror behind her accurately reflects the same woman in a consistent side profile.',
  '左後 135 度': 'The full mirror behind her accurately reflects the same woman from a matching front three-quarter angle.',
  '背面 180 度': 'The full mirror behind her accurately reflects the front of the same woman.',
  '右後 225 度': 'The full mirror behind her accurately reflects the same woman from a matching front three-quarter angle.',
  '右側 270 度': 'The full mirror behind her accurately reflects the same woman in a consistent side profile.',
  '右前 315 度': 'The full mirror behind her accurately reflects the same woman from a matching rear three-quarter angle.',
});

const GENERIC_REFLECTION_TEXT = 'The full mirror behind her accurately reflects the same woman.';

export function isBathroomVanityLocation(location) {
  return location?.id === BATHROOM_VANITY_LOCATION_ID
    || location?.zh === BATHROOM_VANITY_LOCATION_ZH;
}

export function buildBathroomVanityMirrorReflectionText({ location = null, orbit = null } = {}) {
  if (!isBathroomVanityLocation(location)) return '';
  return REFLECTION_TEXT_BY_ORBIT_ZH[orbit?.zh] || GENERIC_REFLECTION_TEXT;
}
