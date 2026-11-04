// Keep the legacy prompt object and historical extraPrompts contract intact.
// The same structured source survives PAGE1's presentation-only object spreads.
const resolvedByStructure = new WeakMap();
const overridesByPrompt = new WeakMap();

export function registerGrokImagineResult(prompt, text, { override = false } = {}) {
  if (!prompt || typeof prompt !== 'object') return prompt;
  if (override) overridesByPrompt.set(prompt, text || '');
  else if (prompt.structured && typeof prompt.structured === 'object') resolvedByStructure.set(prompt.structured, text || '');
  return prompt;
}

export function getGrokImagineResult(prompt) {
  if (!prompt || typeof prompt !== 'object') return '';
  const stored = Array.isArray(prompt.extraPrompts) ? prompt.extraPrompts.find(entry => entry?.id === 'grok-imagine') : null;
  if (stored?.text) return stored.text;
  if (overridesByPrompt.has(prompt)) return overridesByPrompt.get(prompt);
  return prompt.structured ? resolvedByStructure.get(prompt.structured) || '' : '';
}

export function withGrokImagineForSave(prompt) {
  const text = getGrokImagineResult(prompt);
  if (!text || prompt.extraPrompts?.some(entry => entry?.id === 'grok-imagine')) return prompt;
  return { ...prompt, extraPrompts: [...(prompt.extraPrompts || []), { id: 'grok-imagine', label: 'Grok Imagine', text }] };
}
