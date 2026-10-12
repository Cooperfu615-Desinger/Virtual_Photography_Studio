// Nano Banana consumes the same resolved visual sources as the other renderers.
// Paragraphs express their relationships without model parameters or section UI.
function sentence(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const capitalized = text[0].toUpperCase() + text.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

function paragraph(values) {
  return [...new Set(values.map(sentence).filter(Boolean))].join(' ');
}

export function renderNanoBananaNarrative({
  imageType = '', composition = '', subjects = [], wardrobe = '',
  pose = '', scene = '', lighting = '', camera = '',
} = {}) {
  return [
    paragraph([imageType, composition]),
    ...subjects.map(value => paragraph([value])),
    paragraph([wardrobe]),
    paragraph([pose, scene]),
    paragraph([lighting]),
    paragraph([camera]),
  ].filter(Boolean).join('\n\n');
}
