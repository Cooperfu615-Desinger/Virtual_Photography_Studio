/**
 * Canonical normal-single Body Type projection.
 *
 * Full Body Type descriptions remain sourced from knowledge_base through the
 * resolved catalog item. These authored partial strings contain only visual
 * facts already present in that canonical source and are selected once before
 * public renderer formatting.
 */

const BODY_TYPE_PROJECTED_TEXT_BY_ZH = Object.freeze({
  高挑時裝模特: Object.freeze({
    chestUp: 'narrow ribcage',
    mediumWaist: 'shorter upper torso, high waistline, narrow ribcage',
    cowboyKnee: '80-58-88 body proportion anchor, high waistline, narrow ribcage, gently wider hips, shorter upper torso',
  }),
  一般基本體型: Object.freeze({
    chestUp: 'modest bust',
    mediumWaist: 'modest bust, low-contrast waist curve',
    cowboyKnee: '83-62-88 body proportion anchor, modest bust and hips, low-contrast waist curve, smooth natural silhouette',
  }),
  柔和沙漏身形: Object.freeze({
    chestUp: 'fuller bust',
    mediumWaist: 'longer upper torso, lower waistline, fuller bust, elongated abdomen with subtle contour lines',
    cowboyKnee: '90-62-94 body proportion anchor, fuller bust, lower waistline, wider hips, longer upper torso, elongated abdomen with subtle contour lines',
  }),
  性感曲線身形: Object.freeze({
    chestUp: 'full bust',
    mediumWaist: 'full bust, narrow defined waist',
    cowboyKnee: '94-58-92 body proportion anchor, full bust, narrow defined waist, rounded hips, dramatic but lean bust-waist-hip curve',
  }),
  運動緊實身形: Object.freeze({
    chestUp: 'fit toned athletic upper body, subtle muscle definition',
    mediumWaist: 'fit toned athletic upper body, healthy firm silhouette, subtle muscle definition',
    cowboyKnee: 'fit toned athletic body, healthy firm silhouette, subtle muscle definition, energetic balanced proportions',
  }),
  小隻精緻身形: Object.freeze({
    chestUp: 'compact refined upper-body proportions, graceful small-frame presence',
    mediumWaist: 'compact refined upper-body proportions, graceful small-frame presence',
    cowboyKnee: 'petite polished body, compact refined proportions, delicate idol-like silhouette, graceful small-frame presence',
  }),
});

export function projectNormalBodyTypeText(bodyType, compositionVisibility) {
  if (!bodyType || !bodyType.en || /^none$/i.test(bodyType.en.trim())) return '';

  const mode = compositionVisibility?.body?.mode || 'fullSource';
  if (mode === 'omit') return '';
  if (mode === 'fullSource') return bodyType.en;
  if (mode !== 'visibleZones') return '';

  return BODY_TYPE_PROJECTED_TEXT_BY_ZH[bodyType.zh]?.[compositionVisibility?.bucket] || '';
}

export function projectNormalBodyTypeItem(bodyType, compositionVisibility) {
  const projectedText = projectNormalBodyTypeText(bodyType, compositionVisibility);
  if (!projectedText) return null;
  if (projectedText === bodyType?.en) return bodyType;
  return { ...bodyType, en: projectedText };
}

export function projectCharacterProfileBody(profile, compositionVisibility) {
  if (!profile?.body) return '';

  const mode = compositionVisibility?.body?.mode || 'fullSource';
  if (mode === 'omit') return '';
  if (mode === 'fullSource') return profile.body;
  if (mode !== 'visibleZones') return '';

  return profile.bodyProjection?.[compositionVisibility?.bucket] || '';
}

export function projectCharacterProfileSubject(subject, compositionVisibility) {
  if (!subject?.profile?.body) return subject;

  const projectedBody = projectCharacterProfileBody(subject.profile, compositionVisibility);
  if (projectedBody === subject.profile.body) return subject;
  return {
    ...subject,
    profile: {
      ...subject.profile,
      body: projectedBody,
    },
  };
}

export function projectSpecialOutfitPersonFragment(fragment, compositionVisibility) {
  const text = String(fragment || '').trim();
  if (!text) return '';
  if (!/\btattoos?\b/i.test(text)) return text;

  const mode = compositionVisibility?.body?.mode || 'fullSource';
  if (mode === 'fullSource') return text;
  if (mode !== 'visibleZones') return '';
  return compositionVisibility?.body?.zones?.includes('chest') ? text : '';
}
