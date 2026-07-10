function getDefaultValue(definition) {
  if (definition.defaultValue !== undefined) return definition.defaultValue;
  return definition.multi ? [] : '';
}

export function createSelectionSnapshot(definitions, resolvedValues = {}) {
  return Object.fromEntries(definitions.map((definition) => [
    definition.key,
    resolvedValues[definition.key] ?? getDefaultValue(definition),
  ]));
}
