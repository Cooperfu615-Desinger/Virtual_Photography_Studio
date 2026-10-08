import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { setImmediate } from 'node:timers';

import {
  DLL_PIC_ASPECT_RATIOS,
  DLL_PIC_STORAGE_KEYS,
  generateDllPicImages,
  getDllPicApiKeyForModel,
  getDllPicApiKeyStorageKeys,
  normalizeDllPicImageCount,
  getDllPicResolutionOption,
  getDllPicResolutionOptions,
  getDllPicSelectableModelEntries,
  isDllPicAspectRatioSupported,
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

test('xAI generation sends two sequential single-image requests with the selected settings', async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({
      url,
      headers: options.headers,
      body: JSON.parse(options.body),
    });
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

  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, 'https://api.x.ai/v1/images/generations');
  assert.equal(requests[0].headers.Authorization, 'Bearer xai-test-key');
  assert.deepEqual(requests[0].body, {
    model: 'grok-imagine-image-quality',
    prompt: 'a cinematic portrait',
    n: 1,
    aspect_ratio: '3:4',
    resolution: '2k',
    response_format: 'b64_json',
  });
  assert.deepEqual(requests[1].body, requests[0].body);
  assert.deepEqual(result, {
    images: Array.from({ length: 2 }, () => ({
      src: 'data:image/jpeg;base64,base64-image-payload',
      mimeType: 'image/jpeg',
    })),
    errors: [],
    meta: { requestedCount: 2, completedCount: 2, partial: false },
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

test('fixed chest-up 4:5 ratio stays selectable only for a verified supporting model', () => {
  assert.equal(DLL_PIC_ASPECT_RATIOS.some((option) => option.value === '4:5'), true);
  assert.equal(isDllPicAspectRatioSupported('google31FlashLiteImage', '4:5'), true);
  assert.equal(isDllPicAspectRatioSupported('google', '4:5'), true);
  assert.equal(isDllPicAspectRatioSupported('xaiGrokImagineQuality', '4:5'), false);
  assert.equal(isDllPicAspectRatioSupported('magnificNanoBananaProFlash', '4:5'), false);
  assert.equal(isDllPicAspectRatioSupported('byteplusSeedream5Pro', '4:5'), false);
  assert.equal(isDllPicAspectRatioSupported('xaiGrokImagineQuality', '3:4'), true);
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
  assert.equal(getDllPicApiKeyForModel('byteplusSeedream5Pro', providerApiKeys), '');
  assert.equal(getDllPicApiKeyForModel('byteplusSeedream5Lite', providerApiKeys), '');
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

test('Magnific generation preserves the hidden proxy adapter with single-image sequencing', async () => {
  const proxyPayloads = [];
  const result = await generateDllPicImages({
    apiKey: '',
    modelKey: 'magnificZImageTurbo',
    prompt: '  cinematic portrait  ',
    aspectRatio: '16:9',
    count: 2,
    resolution: '2k',
    magnificGenerate: async (payload) => {
      proxyPayloads.push(payload);
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

  assert.equal(proxyPayloads.length, 2);
  assert.deepEqual(proxyPayloads[0], {
    modelKey: 'zImageTurbo',
    prompt: 'cinematic portrait',
    aspectRatio: '16:9',
    count: 1,
    resolution: '2k',
  });
  assert.deepEqual(proxyPayloads[1], proxyPayloads[0]);
  assert.deepEqual(result, {
    images: Array.from({ length: 2 }, () => ({
      src: 'data:image/png;base64,magnific-image',
      mimeType: 'image/png',
    })),
    errors: [],
    meta: {
      prompt: 'cinematic portrait',
      requestedCount: 2,
      completedCount: 2,
      partial: false,
    },
  });
});

test('BytePlus generation preserves model-specific resolution with single-image sequencing', async () => {
  const proxyPayloads = [];
  const result = await generateDllPicImages({
    apiKey: '',
    modelKey: 'byteplusSeedream5Pro',
    prompt: '  cinematic portrait  ',
    aspectRatio: '16:9',
    count: 2,
    resolution: '4k',
    bytePlusGenerate: async (payload) => {
      proxyPayloads.push(payload);
      return {
        images: [{
          src: 'data:image/png;base64,byteplus-image',
          mimeType: 'image/png',
        }],
        errors: [],
        meta: {
          modelKey: 'seedream5Pro',
        },
      };
    },
  });

  assert.equal(proxyPayloads.length, 2);
  assert.deepEqual(proxyPayloads[0], {
    modelKey: 'seedream5Pro',
    prompt: 'cinematic portrait',
    aspectRatio: '16:9',
    count: 1,
    resolution: '2k',
  });
  assert.deepEqual(proxyPayloads[1], proxyPayloads[0]);
  assert.deepEqual(result, {
    images: Array.from({ length: 2 }, () => ({
      src: 'data:image/png;base64,byteplus-image',
      mimeType: 'image/png',
    })),
    errors: [],
    meta: {
      modelKey: 'seedream5Pro',
      requestedCount: 2,
      completedCount: 2,
      partial: false,
    },
  });
});

test('BytePlus resolution options follow Pro and Lite model support', () => {
  assert.deepEqual(getDllPicResolutionOptions('byteplusSeedream5Pro').map((option) => option.value), ['1k', '2k']);
  assert.deepEqual(getDllPicResolutionOptions('byteplusSeedream5Lite').map((option) => option.value), ['2k', '3k', '4k']);
  assert.equal(getDllPicResolutionOption('byteplusSeedream5Pro', '4k').value, '2k');
  assert.equal(getDllPicResolutionOption('byteplusSeedream5Lite', '1k').value, '2k');
  assert.equal(getDllPicResolutionOption('byteplusSeedream5Lite', '4k').value, '4k');
});

test('model option helpers hide legacy aliases and keep analyzer to analysis-capable models', () => {
  const allModelKeys = getDllPicSelectableModelEntries().map(([key]) => key);
  assert.deepEqual(allModelKeys, [
    'google31FlashLiteImage',
    'xaiGrokImagine',
    'xaiGrokImagineQuality',
    'comfyZImageTurbo',
    'comfyQwenImage21',
    'comfyZImageTurboInt8',
    'comfyIdeogram45',
    'comfySeedream5Pro',
    'comfyKrea2Medium',
    'comfyKrea2MediumTurbo',
    'comfyKrea2Large',
  ]);

  const analysisModelKeys = getDllPicSelectableModelEntries({ includeAnalysisOnly: true }).map(([key]) => key);
  assert.deepEqual(analysisModelKeys, ['google31FlashLiteImage']);
});

test('retired provider selections fall back for UI while their adapters remain compatible', () => {
  for (const key of ['byteplusSeedream5Pro', 'byteplusSeedream5Lite', 'magnificClassic', 'magnificZImageTurbo', 'magnificMystic', 'magnificNanoBananaProFlash', 'magnificGemini25FlashImagePreview', 'magnificSeedreamV5Lite']) {
    assert.equal(normalizeDllPicModelKey(key), 'google31FlashLiteImage');
    assert.equal(normalizeDllPicModelKey(key, 'comfyZImageTurbo'), 'comfyZImageTurbo');
  }
});

test('DLL image count defaults to one and is bounded to one or two', () => {
  for (const count of [undefined, null, 0, -1, NaN, Infinity, 'invalid']) {
    assert.equal(normalizeDllPicImageCount(count), 1);
  }
  assert.equal(normalizeDllPicImageCount(1.9), 1);
  assert.equal(normalizeDllPicImageCount('2'), 2);
  assert.equal(normalizeDllPicImageCount(4), 2);
  assert.equal(normalizeDllPicImageCount(100), 2);
});

test('the second Gemini request waits for the first image and its callback to complete', async () => {
  let resolveFirstResponse;
  let resolveFirstPayload;
  let finishFirstImageCallback;
  const events = [];
  const progress = [];
  globalThis.fetch = async () => {
    const requestIndex = events.filter((event) => event.startsWith('request')).length + 1;
    events.push(`request${requestIndex}`);
    if (requestIndex === 1) return new Promise((resolve) => { resolveFirstResponse = resolve; });
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ inlineData: { data: 'second', mimeType: 'image/png' } }] } }] }) };
  };

  const generation = generateDllPicImages({
    apiKey: 'test-key', modelKey: 'google', prompt: 'portrait', count: 2,
    onProgress: (job) => progress.push(job),
    onImages: async (images) => {
      events.push(`images${images.length}`);
      if (images.length === 1) await new Promise((resolve) => { finishFirstImageCallback = resolve; });
    },
  });
  await new Promise(setImmediate);
  assert.deepEqual(events, ['request1']);
  resolveFirstResponse({ ok: true, json: () => new Promise((resolve) => { resolveFirstPayload = resolve; }) });
  await new Promise(setImmediate);
  assert.deepEqual(events, ['request1']);
  resolveFirstPayload({ candidates: [{ content: { parts: [{ inlineData: { data: 'first', mimeType: 'image/png' } }] } }] });
  await new Promise(setImmediate);
  assert.deepEqual(events, ['request1', 'images1']);
  finishFirstImageCallback();
  const result = await generation;

  assert.deepEqual(events, ['request1', 'images1', 'request2', 'images2']);
  assert.equal(result.images.length, 2);
  assert.deepEqual(progress.map(({ status, sequenceIndex, sequenceTotal, images }) => ({ status, sequenceIndex, sequenceTotal, count: images.length })), [
    { status: 'running', sequenceIndex: 1, sequenceTotal: 2, count: 0 },
    { status: 'running', sequenceIndex: 2, sequenceTotal: 2, count: 1 },
  ]);
});

test('a second image API failure returns the successful image without a retry', async () => {
  let calls = 0;
  const snapshots = [];
  globalThis.fetch = async () => {
    calls += 1;
    return calls === 1
      ? { ok: true, json: async () => ({ data: [{ b64_json: 'first' }] }) }
      : { ok: false, status: 429, json: async () => ({ error: { message: 'quota exceeded' } }) };
  };
  const result = await generateDllPicImages({
    apiKey: 'test-key', modelKey: 'xaiGrokImagine', prompt: 'portrait', count: 99,
    onImages: (images) => snapshots.push(images),
  });
  assert.equal(calls, 2);
  assert.equal(result.images.length, 1);
  assert.equal(result.images[0].src, 'data:image/jpeg;base64,first');
  assert.deepEqual(result.errors, ['第 2 張生成失敗：API 錯誤 (429): quota exceeded']);
  assert.deepEqual(result.meta, { requestedCount: 2, completedCount: 1, partial: true });
  assert.equal(snapshots.length, 1);
  assert.equal(snapshots[0].length, 1);
});

test('a second image network failure keeps the first proxy image and does not retry', async () => {
  let calls = 0;
  const result = await generateDllPicImages({
    modelKey: 'magnificClassic', prompt: 'portrait', count: 2,
    magnificGenerate: async (payload) => {
      calls += 1;
      assert.equal(payload.count, 1);
      if (calls === 2) throw new Error('connection lost');
      return { images: [{ src: 'https://example.test/first.png' }], errors: [], meta: { provider: 'magnific' } };
    },
  });
  assert.equal(calls, 2);
  assert.equal(result.images.length, 1);
  assert.deepEqual(result.errors, ['第 2 張生成失敗：connection lost']);
  assert.equal(result.meta.partial, true);
});

test('an empty first response stops the sequence before a second request', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'unable to generate' }] } }] }) };
  };
  await assert.rejects(generateDllPicImages({ apiKey: 'test-key', modelKey: 'google', prompt: 'portrait', count: 2 }), /unable to generate/);
  assert.equal(calls, 1);
});

test('Comfy receives one bounded sequence request and the progress callbacks', async () => {
  const requests = [];
  const onProgress = () => {};
  const onImages = () => {};
  const result = await generateDllPicImages({
    modelKey: 'comfyZImageTurbo', prompt: 'portrait', count: 99,
    onProgress, onImages,
    comfyGenerate: async (payload, options) => {
      requests.push(payload);
      assert.equal(options.onProgress, onProgress);
      assert.equal(options.onImages, onImages);
      return { images: [{ src: 'https://example.test/first.png' }], errors: ['第 2 張失敗'], meta: { provider: 'comfyCloud', partial: true } };
    },
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].count, 2);
  assert.equal(result.images.length, 1);
  assert.equal(result.meta.partial, true);
});

test('Krea models expose only 1K with five native ratios and stay unavailable to the analyzer', () => {
  for (const modelKey of ['comfyKrea2Medium', 'comfyKrea2MediumTurbo', 'comfyKrea2Large']) {
    assert.deepEqual(getDllPicResolutionOptions(modelKey).map(({ value }) => value), ['1k']);
    assert.equal(getDllPicResolutionOption(modelKey, '2k').value, '1k');
    assert.equal(isDllPicAspectRatioSupported(modelKey, '3:4'), false);
    for (const ratio of ['1:1', '16:9', '9:16', '4:3', '4:5']) assert.equal(isDllPicAspectRatioSupported(modelKey, ratio), true);
    assert.equal(getDllPicSelectableModelEntries({ includeAnalysisOnly: true }).some(([key]) => key === modelKey), false);
  }
});

for (const observer of ['onProgress', 'onImages']) {
  test(`a rejected ${observer} callback preserves the first image and prevents the second request`, async () => {
    let calls = 0;
    const options = {
      modelKey: 'magnificClassic', prompt: 'portrait', count: 2,
      magnificGenerate: async () => {
        calls += 1;
        return { images: [{ src: 'https://example.test/first.png' }], errors: [] };
      },
    };
    options[observer] = async (value) => {
      if (observer === 'onImages' || value.sequenceIndex === 2) throw new Error('observer rejected');
    };
    await assert.rejects(generateDllPicImages(options), (error) => {
      assert.equal(error.message, 'observer rejected');
      assert.deepEqual(error.images, [{ src: 'https://example.test/first.png' }]);
      return true;
    });
    assert.equal(calls, 1);
  });
}

test('Krea generation rejects unsupported requested resolutions before invoking the adapter', async () => {
  let calls = 0;
  for (const modelKey of ['comfyKrea2Medium', 'comfyKrea2MediumTurbo', 'comfyKrea2Large']) {
    for (const resolution of ['2k', '4k', 'unknown']) {
      await assert.rejects(generateDllPicImages({
        modelKey, prompt: 'portrait', resolution,
        comfyGenerate: async () => { calls += 1; return { images: [{ src: 'unexpected.png' }], errors: [] }; },
      }), /不支援.*解析度/);
    }
  }
  assert.equal(calls, 0);
});
