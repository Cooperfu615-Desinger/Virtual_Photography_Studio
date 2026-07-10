import test from 'node:test';
import assert from 'node:assert/strict';
import { createPromptSectionModel } from './promptModel.js';

test('prompt section model stores ordered sections and grouped label values', () => {
  const builder = createPromptSectionModel({
    normalizeValue: (value) => `${String(value).trim()}.`,
    shouldInclude: (value) => Boolean(String(value || '').trim()),
  });

  builder.addSection('Subject', 'first subject');
  builder.addSection('Lighting', 'soft light');
  builder.addSection('Subject', 'second subject');
  builder.addSection('Skipped', '');

  const model = builder.toModel();
  assert.deepEqual(model.sections, [
    { label: 'Subject', value: 'first subject.' },
    { label: 'Lighting', value: 'soft light.' },
    { label: 'Subject', value: 'second subject.' },
  ]);
  assert.deepEqual(model.valuesByLabel.get('Subject'), ['first subject.', 'second subject.']);
  assert.equal(model.valuesByLabel.has('Skipped'), false);
});
