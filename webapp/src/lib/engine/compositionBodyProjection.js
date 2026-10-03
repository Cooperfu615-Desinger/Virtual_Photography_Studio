/**
 * Standalone Body Type preserves the complete selected source at every crop.
 * Clothing visibility and Character Card body projection remain independent.
 * See Docs/specs/body-type-catalog-v2.md.
 */
export function projectNormalBodyTypeText(bodyType) {
  if (!bodyType?.en || /^none$/i.test(bodyType.en.trim())) return '';
  return bodyType.en;
}

export function projectNormalBodyTypeItem(bodyType, compositionVisibility, options) {
  const projectedText = projectNormalBodyTypeText(bodyType, compositionVisibility, options);
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
