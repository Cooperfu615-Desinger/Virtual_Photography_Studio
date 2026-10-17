// Node-only helpers for the approved full-body character Body Type exception
// (2026-10-14). Main GPT and GPT chest-up still omit the standalone catalog Body
// Type; the full-body character reference keeps it as a reusable character
// backup, placed after the Subject Count sentence (and Reference Guidance)
// and before facial, hair, skin and expression fragments.
import assert from 'node:assert/strict';
import { polishPublicPromptText } from './publicPromptPolish.js';
import { expectedSubjectText } from './defaultEthnicityTestSupport.js';

export const FULL_BODY_CHARACTER_ID = 'full-body-character';
const SUBJECT_LABEL = 'Subject:\n';
const BASE_IDS = ['base-character-1', 'base-character-2'];

// Public prompt polish capitalizes sentence starts. Accept only the exact
// source or its polished letter case, never a paraphrase.
export const bodySourceForms = source => [...new Set([
  source,
  polishPublicPromptText(source),
  source[0] + polishPublicPromptText(source).slice(1),
])];

const countOccurrences = (text, value) => text.split(value).length - 1;
export const countBodySource = (text, source) => bodySourceForms(source)
  .reduce((total, form) => total + countOccurrences(text, form), 0);

export const fullBodyCharacterText = prompt =>
  prompt.extraPrompts.find(item => item.id === FULL_BODY_CHARACTER_ID).text;

function subjectBlockRange(text) {
  const start = text.indexOf(SUBJECT_LABEL);
  if (start < 0) return null;
  const next = text.indexOf('\n\n', start);
  // A block-form Subject (special outfit) keeps a blank line before
  // "Hair and body details:"; that block is still part of Subject.
  const sectionEnd = text.slice(start).search(/\n\n(?:Wardrobe|Lighting|Camera Look):\n/);
  const end = sectionEnd >= 0 ? start + sectionEnd : (next >= 0 ? next : text.length);
  return { start, end };
}

// Assert the new rule for one ordinary single full-body character output:
// the selected Body Type source appears exactly once, inside Subject, after the
// Subject Count sentence and before every other selected Character fragment.
export function assertFullBodyCharacterBody(prompt, source, message = '') {
  const text = fullBodyCharacterText(prompt);
  const label = message ? `${message}: ` : '';
  assert.equal(countBodySource(text, source), 1, `${label}full-body Body Type source appears exactly once`);
  const range = subjectBlockRange(text);
  assert.ok(range, `${label}full-body Subject section exists`);
  const subject = text.slice(range.start, range.end);
  const bodyIndex = Math.max(...bodySourceForms(source).map(form => subject.indexOf(form)));
  assert.ok(bodyIndex > 0, `${label}Body Type source sits inside Subject`);
  const base = prompt.structured?.Character?.find(item => BASE_IDS.includes(item.id));
  assert.ok(base?.en, `${label}ordinary base identity exists`);
  const lead = `${SUBJECT_LABEL}The subject is ${expectedSubjectText(prompt, base.en)}`;
  assert.ok(subject.startsWith(lead), `${label}Subject opens with the Subject Count sentence`);
  const countBoundary = subject.slice(lead.length).search(/\.(?=\s|$)/);
  assert.ok(countBoundary >= 0, `${label}Subject Count sentence ends`);
  assert.ok(bodyIndex > lead.length + countBoundary, `${label}Body Type follows the Subject Count sentence`);
  for (const item of prompt.structured.Character) {
    if (BASE_IDS.includes(item.id) || item.id === prompt.selection.bodyTypeId) continue;
    if (!item.en || /^none$/i.test(item.en)) continue;
    const head = item.en.replace(/[.!?]+$/, '').slice(0, 32);
    const fragmentIndex = Math.max(...bodySourceForms(head).map(form => subject.indexOf(form)));
    if (fragmentIndex < 0) continue;
    assert.ok(bodyIndex < fragmentIndex, `${label}Body Type precedes ${item.id}`);
  }
}

// Assert that none / no Body Type leaves the full-body Subject free of any
// catalog body source.
export function assertFullBodyCharacterHasNoBody(prompt, sources, message = '') {
  const text = fullBodyCharacterText(prompt);
  for (const source of sources) {
    assert.equal(countBodySource(text, source), 0, `${message}: full-body has no ${source.slice(0, 24)}`);
  }
}

// Exact test-only inverse for snapshots frozen while full-body still omitted the
// standalone Body Type (gpt-standalone-body-omission-v1, before 2026-10-14).
// It removes only the single ` <Body>.` sentence the renderer inserted into the
// full-body Subject section for an ordinary single subject with a selected
// catalog body. Cards, special subjects, duo and none are returned unchanged.
// Any other placement or repeated source throws instead of silently matching.
export function stripFullBodyCharacterBodySource(prompt) {
  const selection = prompt.selection || {};
  if (selection.characterProfileId && !['none', 'random'].includes(selection.characterProfileId)) return prompt;
  const base = prompt.structured?.Character?.find(item => item.id === 'base-character-1');
  if (!base?.en || base.meta?.tags?.includes('special_subject')) return prompt;
  const body = prompt.structured.Character.find(item => item.id === selection.bodyTypeId);
  if (!body?.en || /^none$/i.test(body.en)) return prompt;
  const index = prompt.extraPrompts.findIndex(item => item.id === FULL_BODY_CHARACTER_ID);
  if (index < 0) return prompt;
  const text = prompt.extraPrompts[index].text;
  const total = countBodySource(text, body.en);
  if (total === 0) return prompt;
  const range = subjectBlockRange(text);
  const subject = range ? text.slice(range.start, range.end) : '';
  const sentence = bodySourceForms(body.en.replace(/[.!?]+$/, ''))
    .map(form => ` ${form}.`)
    .find(form => subject.includes(form));
  if (total !== 1 || !sentence || countOccurrences(subject, sentence) !== 1) {
    throw new Error(`unexpected full-body Body Type placement for ${selection.bodyTypeId}`);
  }
  const nextSubject = subject.replace(sentence, '');
  const extraPrompts = prompt.extraPrompts.slice();
  extraPrompts[index] = {
    ...prompt.extraPrompts[index],
    text: text.slice(0, range.start) + nextSubject + text.slice(range.end),
  };
  return { ...prompt, extraPrompts };
}
