import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDllPicSelectableModelEntries, generateDllPicImages, getDllPicModelConfig, isDllPicAspectRatioSupported, normalizeDllPicModelKey } from './dllPicProClient.js';
import { normalizeProviderGenerationRequest } from './providerContract.js';

test('all five Comfy models are distinct and select correctly without reviving hidden providers', () => {
  const entries = getDllPicSelectableModelEntries();
  const expected = ['comfyZImageTurbo', 'comfyQwenImage21', 'comfyZImageTurboInt8', 'comfyIdeogram45', 'comfySeedream5Pro'];
  assert.deepEqual(entries.filter(([, m]) => m.provider === 'comfyCloud').map(([key]) => key), expected);
  assert.equal(new Set(entries.map(([, m]) => m.label)).size, entries.length);
  assert.equal(entries.some(([, m]) => ['byteplus', 'magnific'].includes(m.provider)), false);
  for (const key of expected) {
    assert.equal(normalizeDllPicModelKey(key), key);
    assert.equal(isDllPicAspectRatioSupported(key, '4:5'), true);
    assert.deepEqual(getDllPicModelConfig(key).resolutionOptions, ['1k', '2k']);
  }
});

test('new models use the Comfy proxy and preserve selected prompt, ratio and one-image limit', async () => {
  for (const [modelKey, backend] of [['comfyZImageTurboInt8', 'zImageTurboInt8'], ['comfyIdeogram45', 'ideogram45'], ['comfySeedream5Pro', 'seedream5Pro']]) {
    let sent;
    const prompt = 'A red mug.\n--ar 4:5';
    const result = await generateDllPicImages({ modelKey, prompt, resolution: '2k', aspectRatio: '4:5', count: 4,
      comfyGenerate: async payload => { sent = payload; return { images: [{ src: 'https://example.test/image.png', mimeType: 'image/png' }], meta: { seed: 42, modelKey: backend } }; } });
    assert.equal(sent.modelKey, backend); assert.equal(sent.prompt, prompt);
    assert.equal(sent.aspectRatio, '4:5'); assert.equal(sent.resolution, '2k'); assert.equal(sent.count, 1);
    assert.equal(result.meta.seed, 42);
  }
});

test('Ideogram length limit is validated locally without truncating source', () => {
  assert.throws(() => normalizeProviderGenerationRequest('comfyCloud', { modelKey: 'ideogram45', prompt: 'x'.repeat(10001) }), /10000/);
  assert.equal(normalizeProviderGenerationRequest('comfyCloud', { modelKey: 'seedream5Pro', prompt: 'x'.repeat(10001) }).prompt.length, 10001);
});
