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

test('legacy Gemini model keys normalize to Nano Banana 2 Lite', () => {
  assert.equal(normalizeDllPicModelKey('google'), 'google31FlashLiteImage');
  assert.equal(normalizeDllPicModelKey('google31image'), 'google31FlashLiteImage');
});

test('API key selection follows the active model provider', () => {
  const providerApiKeys = {
    google: ' gemini-key ',
    xai: ' xai-key ',
  };

  assert.equal(getDllPicApiKeyForModel('google', providerApiKeys), 'gemini-key');
  assert.equal(getDllPicApiKeyForModel('google31image', providerApiKeys), 'gemini-key');
  assert.equal(getDllPicApiKeyForModel('google31FlashLiteImage', providerApiKeys), 'gemini-key');
  assert.equal(getDllPicApiKeyForModel('xaiGrokImagine', providerApiKeys), 'xai-key');
  assert.equal(getDllPicApiKeyForModel('xaiGrokImagineQuality', providerApiKeys), 'xai-key');
  assert.equal(getDllPicApiKeyForModel('magnificClassic', providerApiKeys), '');
  assert.equal(getDllPicApiKeyForModel('magnificZImageTurbo', providerApiKeys), '');
});

test('legacy Gemini generation model keys route to Nano Banana 2 Lite', async () => {
  let request = null;
  globalThis.fetch = async (url, options) => {
    request = {
      url,
      body: JSON.parse(options.body),
    };
    return {
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                mimeType: 'image/png',
                data: 'gemini-image',
              },
            }],
          },
        }],
      }),
    };
  };

  await generateDllPicImages({
    apiKey: 'gemini-test-key',
    modelKey: 'google',
    prompt: 'studio portrait',
    aspectRatio: '3:4',
    count: 1,
  });

  assert.equal(
    request.url,
    'https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-lite-image:generateContent?key=gemini-test-key'
  );
  assert.deepEqual(request.body, {
    contents: [{
      parts: [{ text: 'studio portrait' }],
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      responseFormat: {
        image: {
          aspectRatio: '3:4',
          imageSize: '1K',
        },
      },
    },
  });
});

test('Gemini Nano Banana 2 Lite generation uses the stable v1 model and fixed 1K image size', async () => {
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
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                mimeType: 'image/png',
                data: 'gemini-lite-image',
              },
            }],
          },
        }],
      }),
    };
  };

  const result = await generateDllPicImages({
    apiKey: 'gemini-test-key',
    modelKey: 'google31FlashLiteImage',
    prompt: '  studio portrait  ',
    aspectRatio: '16:9',
    count: 1,
  });

  assert.equal(
    request.url,
    'https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-lite-image:generateContent?key=gemini-test-key'
  );
  assert.equal(request.headers['Content-Type'], 'application/json');
  assert.deepEqual(request.body, {
    contents: [{
      parts: [{ text: 'studio portrait' }],
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      responseFormat: {
        image: {
          aspectRatio: '16:9',
          imageSize: '1K',
        },
      },
    },
  });
  assert.deepEqual(result, {
    images: [{
      src: 'data:image/png;base64,gemini-lite-image',
      mimeType: 'image/png',
    }],
    errors: [],
  });
});

test('Magnific generation uses the Firebase proxy without a local API key', async () => {
  let proxyPayload = null;
  const result = await generateDllPicImages({
    apiKey: '',
    modelKey: 'magnificZImageTurbo',
    prompt: '  cinematic portrait  ',
    aspectRatio: '16:9',
    count: 2,
    resolution: '2k',
    magnificGenerate: async (payload) => {
      proxyPayload = payload;
      return {
        images: [{
          src: 'data:image/png;base64,magnific-image',
          mimeType: 'image/png',
        }],
        errors: [],
        meta: {
          prompt: 'cinematic portrait',
        },
      };
    },
  });

  assert.deepEqual(proxyPayload, {
    modelKey: 'zImageTurbo',
    prompt: 'cinematic portrait',
    aspectRatio: '16:9',
    count: 2,
    resolution: '2k',
  });
  assert.deepEqual(result, {
    images: [{
      src: 'data:image/png;base64,magnific-image',
      mimeType: 'image/png',
    }],
    errors: [],
    meta: {
      prompt: 'cinematic portrait',
    },
  });
});

test('model option helpers hide legacy aliases and keep analyzer to analysis-capable models', () => {
  const allModelKeys = getDllPicSelectableModelEntries().map(([key]) => key);
  assert.deepEqual(allModelKeys, [
    'google31FlashLiteImage',
    'xaiGrokImagine',
    'xaiGrokImagineQuality',
    'magnificClassic',
    'magnificZImageTurbo',
    'magnificMystic',
    'magnificNanoBananaProFlash',
    'magnificGemini25FlashImagePreview',
    'magnificSeedreamV5Lite',
  ]);

  const analysisModelKeys = getDllPicSelectableModelEntries({ includeAnalysisOnly: true }).map(([key]) => key);
  assert.deepEqual(analysisModelKeys, ['google31FlashLiteImage']);
});
