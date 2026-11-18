function isNone(option) {
  return option.id === 'none' || option.id === 'style-none';
}

export function getPage3FieldActionOptions(options, currentId) {
  const noneId = options.find(isNone)?.id;
  const choices = options.filter(option => option.id && option.id !== 'random' && !isNone(option) && !option.disabled);
  const alternatives = choices.filter(option => option.id !== currentId);
  return { noneId, randomChoices: alternatives.length ? alternatives : choices };
}

export function updatePage3Field(profile, key, value) {
  const next = { ...profile, [key]: value };
  if (key === 'worldLocation' && value) next.specialLocation = '';
  if (key === 'specialLocation' && value) next.worldLocation = '';
  return next;
}
