// Final punctuation polish for public prompt text. It only repairs assembly
// artifacts (doubled punctuation, a dangling comma after the wardrobe lead and
// lowercase sentence starts); it never adds, removes or reorders visual facts.
// See Docs/reports/prompt-official-review-2026-10-13/README.md §2 X3/X4.

// Lowercase tokens that must stay lowercase at a sentence start.
const LOWERCASE_SENTENCE_START_EXCEPTIONS = /^(?:adidas\b|f\/|iphone\b)/i;

function capitalizeSentenceStarts(text) {
  return text.replace(/(^|\n|[.!?][ \t]+)([a-z])/g, (match, boundary, letter, offset) => {
    const rest = text.slice(offset + boundary.length);
    if (LOWERCASE_SENTENCE_START_EXCEPTIONS.test(rest)) return match;
    return `${boundary}${letter.toUpperCase()}`;
  });
}

export function polishPublicPromptText(value) {
  if (typeof value !== 'string' || !value) return value;
  const text = value
    // "where visible., soft" -> "where visible, soft"
    .replace(/\.[ \t]*,/g, ',')
    // "She wears, black t-shirt" -> "She wears black t-shirt"
    .replace(/\b(She wears|They wear),[ \t]+/g, '$1 ')
    // "at a 4:5 aspect ratio, Chest-up portrait" -> "..., chest-up portrait"
    .replace(/(aspect ratio,[ \t]+)([A-Z])(?=[a-z])/g, (match, lead, letter) => `${lead}${letter.toLowerCase()}`);
  return capitalizeSentenceStarts(text);
}
