import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';

import {
  DLL_PIC_STORAGE_KEYS,
  generateDllPicImages,
  getDllPicApiKeyForModel,
  getDllPicApiKeyStorageKeys,
  getDllPicSelectableModelEntries,
  normalizeDllPicModelKey,
} from './dllPicProClient.js';

let originalFetch;
let originalWindow;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  originalWindow = globalThis.window;
  globalThis.window = {
    setTimeout,
    clearTimeout,
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.window = originalWindow;
});

test('xAI generation sends bearer auth, model, aspect ratio, count, and resolution', async () => {
  let request = null;
  globalThis.fetch = async (url, options) => {
    request = {
      url,
      headers: options.headers,
      body: JSON.parse(options.body),
    };
    return {
      ok: true,
      json: async () => ({
        data: [{
          b64_json: 'base64-image-payload',
          mime_type: 'image/jpeg',
        }],
      }),
    };
  };

  const result = await generateDllPicImages({
    apiKey: 'xai-test-key',
    modelKey: 'xaiGrokImagineQuality',
    prompt: '  a cinematic portrait  ',
    aspectRatio: '3:4',
    count: 2,
    resolution: '2k',
  });

  assert.equal(request.url, 'https://api.x.ai/v1/images/generations');
  assert.equal(request.headers.Authorization, 'Bearer xai-test-key');
  assert.deepEqual(request.body, {
    model: 'grok-imagine-image-quality',
    prompt: 'a cinematic portrait',
    n: 2,
    aspect_ratio: '3:4',
    resolution: '2k',
    response_format: 'b64_json',
  });
  assert.deepEqual(result, {
    images: [{
      src: 'data:image/jpeg;base64,base64-image-payload',
      mimeType: 'image/jpeg',
    }],
    errors: [],
  });
});

test('legacy Grok model key normalizes to the current xAI quality model', () => {
  assert.equal(normalizeDllPicModelKey('grok'), 'xaiGrokImagineQuality');
  assert.deepEqual(getDllPicApiKeyStorageKeys('xaiGrokImagine'), [DLL_PIC_STORAGE_KEYS.xaiApiKey]);
});

test('API key selection follows the active model provider', () => {
  const providerApiKeys = {
    google: ' gemini-key ',
    xai: ' xai-key ',
  };

  assert.equal(getDllPicApiKeyForModel('google', providerApiKeys), 'gemini-key');
  assert.equal(getDllPicApiKeyForModel('google31image', providerApiKeys), 'gemini-key');
  assert.equal(getDllPicApiKeyForModel('xaiGrokImagine', providerApiKeys), 'xai-key');
  assert.equal(getDllPicApiKeyForModel('xaiGrokImagineQuality', providerApiKeys), 'xai-key');
});

test('model option helpers hide legacy aliases and keep analyzer to analysis-capable models', () => {
  const allModelKeys = getDllPicSelectableModelEntries().map(([key]) => key);
  assert.deepEqual(allModelKeys, [
    'google',
    'google31image',
    'xaiGrokImagine',
    'xaiGrokImagineQuality',
  ]);

  const analysisModelKeys = getDllPicSelectableModelEntries({ includeAnalysisOnly: true }).map(([key]) => key);
  assert.deepEqual(analysisModelKeys, ['google', 'google31image']);
});
