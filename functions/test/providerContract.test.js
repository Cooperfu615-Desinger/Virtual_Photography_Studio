const assert = require('node:assert/strict');
const test = require('node:test');

const {
  IMAGE_PROVIDER_CONTRACT,
  normalizeGenerationRequest,
} = require('../src/providerContract');

test('functions consume the versioned shared provider contract', () => {
  const request = normalizeGenerationRequest('magnific', {
    modelKey: 'mystic',
    prompt: '  cinematic portrait  ',
    aspectRatio: '3:4',
    count: 8,
    resolution: '3k',
  });

  assert.equal(IMAGE_PROVIDER_CONTRACT.version, 1);
  assert.equal(request.prompt, 'cinematic portrait');
  assert.equal(request.aspectRatio, '3:4');
  assert.equal(request.count, 4);
  assert.equal(request.resolution, '1k');
});

test('functions reject provider model keys outside the shared contract', () => {
  assert.throws(
    () => normalizeGenerationRequest('byteplus', { modelKey: 'unknown', prompt: 'valid prompt' }),
    /Unsupported byteplus model/,
  );
});
