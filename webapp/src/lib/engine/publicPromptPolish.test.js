import assert from 'node:assert/strict';
import test from 'node:test';

import { polishPublicPromptText } from './publicPromptPolish.js';

test('removes a period that is immediately followed by a comma', () => {
  assert.equal(
    polishPublicPromptText('Bright daytime sky where visible., soft side light.'),
    'Bright daytime sky where visible, soft side light.',
  );
});

test('removes the dangling comma after the wardrobe lead', () => {
  assert.equal(
    polishPublicPromptText('She wears, black dropped-shoulder t-shirt.'),
    'She wears black dropped-shoulder t-shirt.',
  );
  assert.equal(polishPublicPromptText('They wear, matching jackets.'), 'They wear matching jackets.');
});

test('capitalizes sentence and line starts without touching mid-sentence words', () => {
  assert.equal(
    polishPublicPromptText('Subject:\nlong soft waves. dark blue straight-leg jeans, clean denim.'),
    'Subject:\nLong soft waves. Dark blue straight-leg jeans, clean denim.',
  );
});

test('keeps lowercase brand and aperture tokens at a sentence start', () => {
  assert.equal(polishPublicPromptText('Track jacket. adidas three stripes.'), 'Track jacket. adidas three stripes.');
  assert.equal(polishPublicPromptText('Soft focus. f/2 aperture.'), 'Soft focus. f/2 aperture.');
});

test('lowercases the framing phrase that follows the aspect-ratio clause', () => {
  assert.equal(
    polishPublicPromptText('Vertical portrait composition at a 4:5 aspect ratio, Chest-up portrait, eye-level view.'),
    'Vertical portrait composition at a 4:5 aspect ratio, chest-up portrait, eye-level view.',
  );
});

test('leaves decimals, Midjourney parameters and already clean text unchanged', () => {
  const clean = 'Full-body portrait, f/1.4 lens. --v 8.2 --ar 2:3 --raw --s 25';
  assert.equal(polishPublicPromptText(clean), clean);
  assert.equal(polishPublicPromptText(''), '');
  assert.equal(polishPublicPromptText(undefined), undefined);
});

test('is idempotent', () => {
  const once = polishPublicPromptText('She wears, white top. soft light where visible., warm tone.');
  assert.equal(polishPublicPromptText(once), once);
});
