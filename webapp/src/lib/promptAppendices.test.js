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

test('appendices keep stable IDs and only the approved snapshot modes request 9:16', () => {
  assert.deepEqual(PROMPT_APPENDICES.map(({ id }) => id), [
    'four-free-variations', 'four-camera-views', 'amateur-selfies', 'everyday-snapshots',
  ]);
  for (const entry of PROMPT_APPENDICES) {
    assert.ok(entry.label && entry.description && entry.text);
    assert.doesNotMatch(entry.text, /--ar|4:5/);
    if (['amateur-selfies', 'everyday-snapshots'].includes(entry.id)) {
      assert.match(entry.text, /Generate 4 separate 9:16 photographs, not a collage, with no added text\./);
      assert.match(entry.text, /Keep the same person, outfit, and setting described above/);
    } else {
      assert.doesNotMatch(entry.text, /9:16/);
      assert.match(entry.text, /separate images/);
    }
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
