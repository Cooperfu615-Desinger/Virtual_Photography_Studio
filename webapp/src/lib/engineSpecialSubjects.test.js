import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';

test('special subject control exposes dedicated character options', () => {
  const specialSubjectControl = getLockControls().find((control) => control.key === 'specialSubjectId');
  const specialSubjectOptions = specialSubjectControl.options.filter((option) => option.specialSubject);

  assert.deepEqual(
    specialSubjectOptions.map((option) => [option.id, option.zh]),
    [
      ['skeleton', '黑骷髏'],
      ['white-skeleton', '白骷髏'],
      ['sengoku-samurai', '日本戰國武士'],
      ['european-knight', '歐洲騎士'],
      ['female-android', '女性人形機器人'],
    ]
  );
});

test('white skeleton uses skeleton generation path and ivory bone language', () => {
  const locks = {
    ...createEmptyLocks(),
    specialSubjectId: 'white-skeleton',
  };

  const [prompt] = generatePrompts(1, locks);
  const promptText = [
    prompt.midjourneyPrompt,
    prompt.grokPrompt,
    prompt.zImagePrompt,
    prompt.summary,
  ].join('\n');

  assert.equal(prompt.selection.subjectCount, '1');
  assert.equal(prompt.selection.specialSubjectId, 'white-skeleton');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /白骷髏|warm ivory bone tone|aged off-white bone surface|米白骨色/);
  assert.doesNotMatch(promptText, /dark blue-black bone tone/);
});

test('historical warrior special subjects disable wardrobe and preserve expression and pose only', () => {
  const locks = {
    ...createEmptyLocks(),
    specialSubjectId: 'sengoku-samurai',
  };

  const [prompt] = generatePrompts(1, locks);
  const promptText = [prompt.grokPrompt, prompt.zImagePrompt, prompt.summary].join('\n');

  assert.equal(prompt.selection.specialSubjectId, 'sengoku-samurai');
  assert.equal(prompt.structured.Wardrobe.length, 0);
  assert.match(promptText, /日本戰國武士|Sengoku-era samurai|lamellar armor|戰國甲冑/);
  assert.doesNotMatch(promptText, /Wardrobe Integrity|Top:|Shoes:/);
});

test('legacy skeleton subject count locks migrate into the special subject control', () => {
  const normalized = normalizeLocks({
    ...createEmptyLocks(),
    subjectCount: 'white-skeleton',
  });

  assert.equal(normalized.subjectCount, '1');
  assert.equal(normalized.specialSubjectId, 'white-skeleton');
});
