import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  Z_IMAGE_VISIBLE_TEXT_MAX_CHARACTERS,
  buildZImageVisibleTextSentence,
  normalizeZImageVisibleTextSettings,
  parseZImageVisibleTextSentence,
} from './zImageVisibleText.js';

test('visible text stays disabled by default and does not emit a sentence without content', () => {
  assert.deepEqual(normalizeZImageVisibleTextSettings(), {
    zImageVisibleTextEnabled: false,
    zImageVisibleTextContent: '',
    zImageVisibleTextLanguage: 'traditional-chinese',
    zImageVisibleTextPlacement: 'background-storefront-sign',
  });
  assert.equal(buildZImageVisibleTextSentence({ zImageVisibleTextEnabled: true }), '');
});

test('visible text uses an English instruction wrapper around the exact source literal', () => {
  const sentence = buildZImageVisibleTextSentence({
    zImageVisibleTextEnabled: true,
    zImageVisibleTextContent: '美華冰室',
    zImageVisibleTextLanguage: 'traditional-chinese',
    zImageVisibleTextPlacement: 'background-storefront-sign',
  });

  assert.equal(
    sentence,
    'A background storefront sign clearly displays the exact Traditional Chinese text "美華冰室".',
  );
  assert.deepEqual(parseZImageVisibleTextSentence(sentence), {
    zImageVisibleTextEnabled: true,
    zImageVisibleTextContent: '美華冰室',
    zImageVisibleTextLanguage: 'traditional-chinese',
    zImageVisibleTextPlacement: 'background-storefront-sign',
  });
});

test('visible text normalizes unsafe whitespace, clips length, and round-trips quoted content', () => {
  const longContent = `Studio "A"\n${'x'.repeat(80)}`;
  const settings = normalizeZImageVisibleTextSettings({
    zImageVisibleTextEnabled: true,
    zImageVisibleTextContent: longContent,
    zImageVisibleTextLanguage: 'english',
    zImageVisibleTextPlacement: 'wall-poster',
  });
  const sentence = buildZImageVisibleTextSentence(settings);

  assert.equal(Array.from(settings.zImageVisibleTextContent).length, Z_IMAGE_VISIBLE_TEXT_MAX_CHARACTERS);
  assert.doesNotMatch(settings.zImageVisibleTextContent, /\n/);
  assert.deepEqual(parseZImageVisibleTextSentence(sentence), settings);
});

test('visible text parser ignores malformed or unrecognized external wording', () => {
  assert.equal(parseZImageVisibleTextSentence('Please write 美華冰室 somewhere.'), null);
  assert.equal(
    parseZImageVisibleTextSentence('A background storefront sign clearly displays the exact Traditional Chinese text "unterminated.'),
    null,
  );
});
