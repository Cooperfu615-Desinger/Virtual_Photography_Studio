// Reviewed main-MJ projection only. Catalog sources and all other outputs retain
// their existing contracts; unknown/custom body sources have no inferred mapping.
export const MIDJOURNEY_BODY_DESCRIPTIONS = Object.freeze({
  'character:體態-body-type:高挑時裝模特:0': 'A tall, slender figure with long legs and elegant, balanced proportions.',
  'character:體態-body-type:柔和沙漏身形:2': 'A soft, balanced hourglass figure with a gently defined waist and naturally rounded curves.',
  'character:體態-body-type:性感曲線身形:3': 'A well-defined curvy figure with a slender waist, long legs and graceful lines.',
  'character:體態-body-type:運動緊實身形:4': 'A lean, toned figure with a firm waist and naturally athletic limbs.',
  'character:體態-body-type:小隻精緻身形:5': 'A petite, slender figure with balanced proportions and soft, delicate lines.',
  'character:體態-body-type:豐胸纖腰沙漏身形:7': 'A full, well-proportioned figure with a slender waist and naturally graceful curves.',
});

export function midjourneyBodyDescription(item, role = '') {
  const sentence = MIDJOURNEY_BODY_DESCRIPTIONS[String(item?.id || '').replace(/:[ab]$/, '')] || '';
  if (!sentence || !role) return sentence;
  return `The ${role === 'a' ? 'first' : 'second'} woman has ${sentence[0].toLowerCase()}${sentence.slice(1)}`;
}
