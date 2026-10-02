const BODY_TYPE_LABEL = '豐胸纖腰沙漏身形';
const BIKINI_TOP_LABEL = '比基尼上身';
const BIKINI_BOTTOM_LABEL = '比基尼下身';

export const HOURGLASS_BIKINI_TOP_FIT = 'reduced-fabric triangle cups cover the bust center with localized soft fullness at the upper and outer cup edges while the cups stay in place';
export const HOURGLASS_BIKINI_BOTTOM_FIT = 'side ties make shallow impressions against the rounded outer hips';

function matchingBodyRoles(character) {
  const bodies = character.filter((item) => item?.id?.startsWith('character:體態-body-type:'));
  const hasRoleBodies = bodies.some((item) => item.meta?.characterRole);
  if (!hasRoleBodies) return bodies.some((item) => item.zh === BODY_TYPE_LABEL) ? new Set(['']) : new Set();

  const roles = new Set(bodies.filter((item) => item.zh === BODY_TYPE_LABEL).map((item) => item.meta.characterRole));
  if (roles.has('a') && roles.has('b')) roles.add('');
  return roles;
}

/** Keep the tested bikini pressure local to the matching person's selected pieces. */
export function addConditionalHourglassBikiniFit(pieces, character) {
  if (!Array.isArray(pieces) || !Array.isArray(character)) return pieces;
  const bodyRoles = matchingBodyRoles(character);
  if (bodyRoles.size === 0) return pieces;

  return pieces.map((piece) => {
    const role = piece?.meta?.wardrobeRole || '';
    if (!bodyRoles.has(role) || piece?.meta?.conditionalHourglassBikiniFit) return piece;

    const fit = piece?.zh === BIKINI_TOP_LABEL && piece.id?.startsWith('wardrobe:上身-tops:')
      ? HOURGLASS_BIKINI_TOP_FIT
      : piece?.zh === BIKINI_BOTTOM_LABEL && piece.id?.startsWith('wardrobe:褲裝-pants:')
        ? HOURGLASS_BIKINI_BOTTOM_FIT
        : '';
    if (!fit) return piece;

    return {
      ...piece,
      en: `${piece.en.replace(/[\s,.]+$/, '')}, ${fit}`,
      meta: { ...(piece.meta || {}), conditionalHourglassBikiniFit: true },
    };
  });
}
