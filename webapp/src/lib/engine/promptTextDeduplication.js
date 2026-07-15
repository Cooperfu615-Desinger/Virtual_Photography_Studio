function normalizeFragment(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function dedupeRepeatedCommaFragments(parts = []) {
  const seen = new Set();

  return parts
    .map((part) => String(part || '')
      .split(/,\s*/)
      .map((fragment) => fragment.trim())
      .filter(Boolean)
      .filter((fragment) => {
        const key = normalizeFragment(fragment);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .join(', '))
    .filter(Boolean);
}

function replaceColorControls(value, pattern, colorText) {
  let consumed = false;
  if (!colorText) return { text: value, consumed };

  const text = value.replace(pattern, (_, target) => {
    const cleanedTarget = String(target || '').replace(/\s+/g, ' ').trim();
    if (!cleanedTarget) return _;
    consumed = true;
    return `${cleanedTarget} set to ${colorText}`;
  });

  return { text, consumed };
}

export function materializeOutfitColorControls(value, {
  primaryColorText = '',
  contrastColorText = '',
} = {}) {
  let text = String(value || '');
  let consumedPrimary = false;
  let consumedContrast = false;

  const primary = replaceColorControls(
    text,
    /([^,.;]+?)\s+controlled by\s+(?:the\s+)?(?:outfit\s+)?(?:primary color|outfit color selection)/gi,
    primaryColorText
  );
  text = primary.text;
  consumedPrimary = primary.consumed;

  const contrast = replaceColorControls(
    text,
    /([^,.;]+?)\s+controlled by\s+(?:the\s+)?(?:outfit\s+)?contrast (?:color|palette)/gi,
    contrastColorText
  );
  text = contrast.text;
  consumedContrast = contrast.consumed;

  return {
    text: text
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .trim(),
    consumedPrimary,
    consumedContrast,
  };
}
