import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PROMPT_APPENDICES, appendPromptInstruction } from './promptAppendices.js';
import { buildPage1GenerationPromptCards, buildPage1DllPromptSources, buildPage1DisplayOutputs } from './page1PromptOutputs.js';

const source = {
  grokPrompt: 'Original GPT\nAspect ratio 4:5.',
  zImagePrompt: 'Original Z',
  midjourneyPrompt: 'Original MJ --ar 4:5 --v 7',
  extraPrompts: ['chest-up-portrait', 'full-body-character']
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

test('all five display/copy values retain exact originals and use only the selected appendix', () => {
  const before = structuredClone(source);
  const original = buildPage1GenerationPromptCards(source);
  const dllBefore = buildPage1DllPromptSources(source);
  for (const template of PROMPT_APPENDICES) {
    const displayed = original.map((card) => ({ ...card, value: appendPromptInstruction(card.value, template.id) }));
    assert.equal(displayed.length, 5);
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


test('custom photography notes follow templates without rewriting input or original MJ parameters', () => {
  const customText = '  Soft side lighting.\n背景保持簡潔。  ';
  const original = source.midjourneyPrompt;
  for (const templateId of ['', ...PROMPT_APPENDICES.map(({ id }) => id)]) {
    for (const referencePerson of [false, true]) {
      const options = { referencePerson, customEnabled: true, customText };
      const expected = `${appendPromptInstruction(original, templateId, { referencePerson })}\n\n${customText}`;
      assert.equal(appendPromptInstruction(original, templateId, options), expected);
      // Each render starts from the same original; toggling or rerendering cannot accumulate notes.
      assert.equal(appendPromptInstruction(original, templateId, options), expected);
      assert.equal(appendPromptInstruction(original, templateId, { ...options, customEnabled: false }),
        appendPromptInstruction(original, templateId, { referencePerson }));
    }
  }
});

test('blank or disabled custom notes preserve bytes and never populate missing outputs', () => {
  for (const original of ['', '  ', undefined]) {
    assert.equal(appendPromptInstruction(original, 'four-free-variations', {
      customEnabled: true, customText: 'Soft lighting.',
    }), original);
  }
  for (const customText of ['', ' \n ']) {
    assert.equal(appendPromptInstruction('original\n', '', { customEnabled: true, customText }), 'original\n');
  }
  assert.equal(appendPromptInstruction('original', '', { customText: 'Soft lighting.' }), 'original');
});

test('all six displayed and full-workspace sources share exact appended text while quick sources stay original', () => {
  const input = { ...source, nanoBananaPrompt: 'Original Nano' };
  const before = structuredClone(input);
  for (const templateId of ['', ...PROMPT_APPENDICES.map(({ id }) => id)]) {
    for (const referencePerson of [false, true]) {
      const { cards, dllSources } = buildPage1DisplayOutputs(input, templateId, {
        referencePerson, customEnabled: true, customText: 'Cool tones.\nSimple background.',
      });
      assert.equal(cards.length, 6);
      assert.deepEqual(dllSources.map(({ id, value }) => ({ id, value })), cards.map(({ id, value }) => ({ id, value })));
      dllSources.forEach((entry, index) => {
        const original = buildPage1DllPromptSources(input)[index];
        assert.deepEqual({ ...entry, value: original.value }, original);
        assert.ok(entry.value.endsWith('Cool tones.\nSimple background.'));
      });
    }
  }
  assert.deepEqual(input, before);
  assert.deepEqual(buildPage1DllPromptSources(input), buildPage1DllPromptSources(before));
});

test('display composition without appendices preserves existing single, duo and empty source shapes', () => {
  for (const input of [source, { ...source, extraPrompts: [] }, { grokPrompt: '', zImagePrompt: 'Z' }, null]) {
    const { cards, dllSources } = buildPage1DisplayOutputs(input);
    assert.deepEqual(cards, buildPage1GenerationPromptCards(input));
    assert.deepEqual(dllSources, buildPage1DllPromptSources(input));
  }
});
