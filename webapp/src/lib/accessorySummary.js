/**
 * Normalize accessory labels for the human-readable wardrobe summaries.
 *
 * Summary entries are keyed by their source field so two different fields may
 * legitimately share the same label (for example, a black hat and black
 * eyewear). Repeated values from the same source field are still collapsed.
 */
function normalizeSummaryText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isEmptyAccessorySummaryText(value) {
  const text = normalizeSummaryText(value);
  const normalized = text.toLowerCase();
  return !text
    || text === '-'
    || text === '全無'
    || text === '隨機'
    || normalized === 'none'
    || normalized === 'random';
}

export function buildAccessorySummaryEntries(entries = []) {
  const seen = new Set();

  return entries
    .map((entry, index) => {
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        return {
          key: entry.key || `accessory-${index}`,
          text: normalizeSummaryText(entry.text ?? entry.value),
        };
      }
      return {
        key: `accessory-${index}`,
        text: normalizeSummaryText(entry),
      };
    })
    .filter((entry) => !isEmptyAccessorySummaryText(entry.text))
    .filter((entry) => {
      if (seen.has(entry.key)) return false;
      seen.add(entry.key);
      return true;
    });
}

export function buildAccessorySummaryText(entries = []) {
  return buildAccessorySummaryEntries(entries)
    .map((entry) => entry.text)
    .join(' / ');
}
