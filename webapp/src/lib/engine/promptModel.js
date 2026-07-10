export function createPromptSectionModel({
  normalizeValue = (value) => String(value || '').trim(),
  shouldInclude = (value) => Boolean(value),
} = {}) {
  const sections = [];
  const valuesByLabel = new Map();

  const addSection = (label, value) => {
    if (!label || !shouldInclude(value)) return false;

    const normalizedValue = normalizeValue(value);
    if (!normalizedValue) return false;

    sections.push({ label, value: normalizedValue });
    const currentValues = valuesByLabel.get(label) || [];
    currentValues.push(normalizedValue);
    valuesByLabel.set(label, currentValues);
    return true;
  };

  return {
    addSection,
    toModel: () => ({ sections, valuesByLabel }),
  };
}
