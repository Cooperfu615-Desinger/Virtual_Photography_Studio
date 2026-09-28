export const BATHROOM_VANITY_LOCATION_ID = 'locations:生活感室內-indoor-lifestyle:室內-浴室鏡前-洗手台:8';
export const BATHROOM_VANITY_LOCATION_ZH = '室內：浴室鏡前 / 洗手台';

export const BATHROOM_VANITY_MIRROR_TEXT = 'The mirror clearly reflects the same woman from a physically consistent angle, with matching appearance, outfit, and pose. The reflection shows her front when her back faces the camera, her back when her front faces the camera, and a corresponding side view at side angles. Light post-shower condensation gathers around the mirror edges while the center stays clear. Her skin and hair are damp; her clothing looks visibly soaked while retaining its original sheerness and coverage. Show the full mirror frame whenever the selected crop allows.';

export function isBathroomVanityLocation(location) {
  return location?.id === BATHROOM_VANITY_LOCATION_ID
    || location?.zh === BATHROOM_VANITY_LOCATION_ZH;
}

export function buildBathroomVanityMirrorReflectionText({ location = null } = {}) {
  if (!isBathroomVanityLocation(location)) return '';
  return BATHROOM_VANITY_MIRROR_TEXT;
}
