import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PROMPT_APPENDICES, appendPromptInstruction } from './promptAppendices.js';
import { buildPage1GenerationPromptCards, buildPage1DllPromptSources } from './page1PromptOutputs.js';

const source = {
  grokPrompt: 'Original GPT\nAspect ratio 4:5.',
  zImagePrompt: 'Original Z',
  midjourneyPrompt: 'Original MJ --ar 4:5 --v 7',
  extraPrompts: ['chest-up-portrait', 'chest-up-mj-portrait', 'full-body-character']
    .map((id) => ({ id, text: `Original ${id}` })),
};

test('appendices have unique stable IDs and do not introduce aspect ratios', () => {
  assert.equal(new Set(PROMPT_APPENDICES.map(({ id }) => id)).size, 2);
  for (const entry of PROMPT_APPENDICES) {
    assert.ok(entry.label && entry.description && entry.text);
    assert.doesNotMatch(entry.text, /--ar|9:16|4:5/);
    assert.match(entry.text, /separate images/);
  }
});

test('all six display/copy values retain exact originals and use only the selected appendix', () => {
  const before = structuredClone(source);
  const original = buildPage1GenerationPromptCards(source);
  const dllBefore = buildPage1DllPromptSources(source);
  for (const template of PROMPT_APPENDICES) {
    const displayed = original.map((card) => ({ ...card, value: appendPromptInstruction(card.value, template.id) }));
    assert.equal(displayed.length, 6);
    displayed.forEach((card, index) => {
      assert.equal(card.value, `${original[index].value}\n\n${template.text}`);
      assert.equal(appendPromptInstruction(original[index].value, template.id), card.value);
    });
  }
  assert.deepEqual(source, before);
  assert.deepEqual(buildPage1DllPromptSources(source), dllBefore);
  assert.deepEqual(original.map((card) => appendPromptInstruction(card.value, '')), original.map((card) => card.value));
});

test('empty outputs and unknown templates stay unchanged', () => {
  for (const value of ['', '  ', 'Original\n']) {
    assert.equal(appendPromptInstruction(value, 'unknown'), value);
  }
  assert.equal(appendPromptInstruction('', PROMPT_APPENDICES[0].id), '');
  assert.equal(appendPromptInstruction('  ', PROMPT_APPENDICES[0].id), '  ');
});
