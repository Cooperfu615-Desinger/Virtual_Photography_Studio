export const Z_IMAGE_VISIBLE_TEXT_MAX_CHARACTERS = 48;

export const Z_IMAGE_VISIBLE_TEXT_SELECTION_KEYS = Object.freeze([
  'zImageVisibleTextEnabled',
  'zImageVisibleTextContent',
  'zImageVisibleTextLanguage',
  'zImageVisibleTextPlacement',
]);

export const Z_IMAGE_VISIBLE_TEXT_LANGUAGES = Object.freeze([
  {
    id: 'traditional-chinese',
    label: '繁體中文',
    promptLabel: 'Traditional Chinese',
  },
  {
    id: 'english',
    label: '英文',
    promptLabel: 'English',
  },
]);

export const Z_IMAGE_VISIBLE_TEXT_PLACEMENTS = Object.freeze([
  {
    id: 'background-storefront-sign',
    label: '背景店面招牌',
    promptSubject: 'A background storefront sign',
  },
  {
    id: 'wall-poster',
    label: '場景牆面海報',
    promptSubject: 'A wall poster within the scene',
  },
  {
    id: 'background-digital-display',
    label: '背景數位顯示器',
    promptSubject: 'A background digital display',
  },
]);

const DEFAULT_LANGUAGE = Z_IMAGE_VISIBLE_TEXT_LANGUAGES[0].id;
const DEFAULT_PLACEMENT = Z_IMAGE_VISIBLE_TEXT_PLACEMENTS[0].id;

function clipCodePoints(value, limit) {
  return Array.from(value).slice(0, limit).join('');
}

export function normalizeZImageVisibleTextContent(value) {
  const printableText = Array.from(String(value ?? ''))
    .map((character) => {
      const codePoint = character.codePointAt(0);
      return codePoint <= 31 || codePoint === 127 ? ' ' : character;
    })
    .join('');

  return clipCodePoints(
    printableText
      .replace(/\s+/g, ' ')
      .trim(),
    Z_IMAGE_VISIBLE_TEXT_MAX_CHARACTERS,
  );
}

export function normalizeZImageVisibleTextSettings(value = {}) {
  const language = Z_IMAGE_VISIBLE_TEXT_LANGUAGES.some((option) => option.id === value.zImageVisibleTextLanguage)
    ? value.zImageVisibleTextLanguage
    : DEFAULT_LANGUAGE;
  const placement = Z_IMAGE_VISIBLE_TEXT_PLACEMENTS.some((option) => option.id === value.zImageVisibleTextPlacement)
    ? value.zImageVisibleTextPlacement
    : DEFAULT_PLACEMENT;

  return {
    zImageVisibleTextEnabled: value.zImageVisibleTextEnabled === true,
    zImageVisibleTextContent: normalizeZImageVisibleTextContent(value.zImageVisibleTextContent),
    zImageVisibleTextLanguage: language,
    zImageVisibleTextPlacement: placement,
  };
}

export function buildZImageVisibleTextSentence(value = {}) {
  const settings = normalizeZImageVisibleTextSettings(value);
  if (!settings.zImageVisibleTextEnabled || !settings.zImageVisibleTextContent) return '';

  const language = Z_IMAGE_VISIBLE_TEXT_LANGUAGES.find(
    (option) => option.id === settings.zImageVisibleTextLanguage,
  );
  const placement = Z_IMAGE_VISIBLE_TEXT_PLACEMENTS.find(
    (option) => option.id === settings.zImageVisibleTextPlacement,
  );

  return `${placement.promptSubject} clearly displays the exact ${language.promptLabel} text ${JSON.stringify(settings.zImageVisibleTextContent)}.`;
}

export function parseZImageVisibleTextSentence(value) {
  const text = String(value || '');
  for (const placement of Z_IMAGE_VISIBLE_TEXT_PLACEMENTS) {
    for (const language of Z_IMAGE_VISIBLE_TEXT_LANGUAGES) {
      const prefix = `${placement.promptSubject} clearly displays the exact ${language.promptLabel} text `;
      const startIndex = text.indexOf(prefix);
      if (startIndex < 0) continue;

      const literalStart = startIndex + prefix.length;
      const tail = text.slice(literalStart);
      const literalMatch = tail.match(/^("(?:\\.|[^"\\])*")\./);
      if (!literalMatch) continue;

      try {
        const content = normalizeZImageVisibleTextContent(JSON.parse(literalMatch[1]));
        if (!content) continue;
        return {
          zImageVisibleTextEnabled: true,
          zImageVisibleTextContent: content,
          zImageVisibleTextLanguage: language.id,
          zImageVisibleTextPlacement: placement.id,
        };
      } catch {
        // Ignore malformed external prompt text and leave the capability disabled.
      }
    }
  }

  return null;
}
