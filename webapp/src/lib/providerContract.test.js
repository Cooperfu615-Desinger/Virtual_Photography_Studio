import assert from 'node:assert/strict';
import test from 'node:test';

import {
  IMAGE_PROVIDER_CONTRACT,
  normalizeProviderGenerationRequest,
  normalizeProviderGenerationResponse,
} from './providerContract.js';

test('provider contract normalizes request fields from the shared provider model definition', () => {
  const request = normalizeProviderGenerationRequest('byteplus', {
    modelKey: 'seedream5Lite',
    prompt: '  cinematic portrait  ',
    aspectRatio: 'invalid',
    count: 99,
    resolution: '1k',
  });

  assert.equal(IMAGE_PROVIDER_CONTRACT.version, 1);
  assert.equal(request.prompt, 'cinematic portrait');
  assert.equal(request.aspectRatio, '9:16');
  assert.equal(request.count, 4);
  assert.equal(request.resolution, '2k');
});

test('provider response contract removes malformed image entries and stabilizes optional fields', () => {
  const response = normalizeProviderGenerationResponse({
    images: [{ src: 'data:image/png;base64,abc', mimeType: 'image/png' }, { src: '' }],
    errors: [new Error('failed')],
  });

  assert.equal(response.images.length, 1);
  assert.deepEqual(response.errors, ['Error: failed']);
  assert.equal(response.meta, null);
});
