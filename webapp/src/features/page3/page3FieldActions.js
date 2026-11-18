function isNone(option) {
  return option.id === 'none' || option.id === 'style-none';
}

export function getPage3FieldActionOptions(options, currentId) {
  const noneId = options.find(isNone)?.id;
  const choices = options.filter(option => option.id && option.id !== 'random' && !isNone(option) && !option.disabled);
  const alternatives = choices.filter(option => option.id !== currentId);
  return { noneId, randomChoices: alternatives.length ? alternatives : choices };
}

export function getPage3ParameterFields(fieldConfig) {
  return fieldConfig.filter(({ key }) => key !== 'worldLocation' && key !== 'specialLocation');
}

export function buildPage3BatchPatch(fieldConfig, fieldOptions, profile, action, random = Math.random) {
  const patch = {};
  for (const { key } of getPage3ParameterFields(fieldConfig)) {
    const { noneId, randomChoices } = getPage3FieldActionOptions(fieldOptions[key], profile[key]);
    const value = action === 'none'
      ? noneId
      : randomChoices[Math.floor(random() * randomChoices.length)]?.id;
    if (value !== undefined) patch[key] = value;
  }
  return patch;
}

export function updatePage3Field(profile, key, value) {
  const next = { ...profile, [key]: value };
  if (key === 'worldLocation' && value) next.specialLocation = '';
  if (key === 'specialLocation' && value) next.worldLocation = '';
  return next;
}
