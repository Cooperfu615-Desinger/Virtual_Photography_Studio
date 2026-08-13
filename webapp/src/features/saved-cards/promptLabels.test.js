import assert from 'node:assert/strict';
import { test } from 'node:test';

import { normalizeZImageDisplayLabel } from './promptLabels.js';

test('historical Grok/Z-Image labels render as Z-Image without changing current custom labels', () => {
  assert.equal(normalizeZImageDisplayLabel('Grok/Z-Image'), 'Z-Image Prompt');
  assert.equal(normalizeZImageDisplayLabel('Grok/Z-Image Prompt'), 'Z-Image Prompt');
  assert.equal(normalizeZImageDisplayLabel('Z-Image Prompt'), 'Z-Image Prompt');
  assert.equal(normalizeZImageDisplayLabel('', 'Z-Image'), 'Z-Image');
});
