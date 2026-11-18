export const PAGE3_PERSON_OPTIONS = [
  { id: 'none', label: '不放人物' },
  { id: 'default', label: '預設' },
  { id: 'prompt-workbench', label: 'Prompt 工作台' },
  { id: 'character-lab', label: '角色建模' },
];

export const PAGE3_DEFAULT_PERSON = 'A 20-year-old seductive stunning adult Japanese woman.';

const fullBodyAppearances = new WeakMap();

export function registerScenePersonAppearance(prompt, renderAppearance) {
  fullBodyAppearances.set(prompt.structured, renderAppearance);
}

export function readScenePersonAppearance(prompt) {
  return fullBodyAppearances.get(prompt?.structured)?.() || '';
}

export function getPage3Person(profile) {
  const person = profile?.person;
  if (person?.source === 'default') return { source: 'default', label: '預設人物', text: PAGE3_DEFAULT_PERSON };
  if (['prompt-workbench', 'character-lab'].includes(person?.source)
    && typeof person.text === 'string' && person.text.trim()) {
    const sourceLabel = PAGE3_PERSON_OPTIONS.find(option => option.id === person.source).label;
    return {
      source: person.source,
      label: typeof person.label === 'string' && person.label.trim() ? person.label.trim() : sourceLabel,
      text: person.text.trim(),
    };
  }
  return null;
}
