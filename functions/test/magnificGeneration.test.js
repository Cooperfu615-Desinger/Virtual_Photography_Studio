const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  buildMagnificAsyncRequest,
  buildMagnificRequest,
  generateMagnificModelImages,
  getNanoResolution,
  getZImageSize,
  parseMagnificTaskResponse,
} = require('../src/magnificGeneration');

test('builds Magnific Z-Image Turbo request body', () => {
  assert.deepEqual(buildMagnificAsyncRequest({
    modelKey: 'zImageTurbo',
    prompt: ' cinematic portrait ',
    aspectRatio: '16:9',
  }), {
    prompt: 'cinematic portrait',
    image_size: 'landscape_16_9',
    num_inference_steps: 8,
    output_format: 'png',
    enable_safety_checker: true,
  });
  assert.equal(getZImageSize('3:4'), 'portrait_3_4');
});

test('builds Magnific Mystic request body with 1K/2K resolution mapping', () => {
  assert.deepEqual(buildMagnificAsyncRequest({
    modelKey: 'mystic',
    prompt: 'cinematic portrait',
    aspectRatio: '9:16',
    resolution: '2k',
  }), {
    prompt: 'cinematic portrait',
    resolution: '2k',
    aspect_ratio: 'social_story_9_16',
    filter_nsfw: true,
  });
});

test('builds Nano Banana Pro Flash and Seedream V5 Lite request bodies', () => {
  assert.equal(getNanoResolution('1k'), '1K');
  assert.equal(getNanoResolution('2k'), '2K');
  assert.deepEqual(buildMagnificAsyncRequest({
    modelKey: 'nanoBananaProFlash',
    prompt: 'a studio portrait',
    aspectRatio: '4:3',
    resolution: '2k',
  }), {
    prompt: 'a studio portrait',
    aspect_ratio: '4:3',
    resolution: '2K',
  });
  assert.deepEqual(buildMagnificAsyncRequest({
    modelKey: 'seedreamV5Lite',
    prompt: 'a studio portrait',
    aspectRatio: '4:3',
  }), {
    prompt: 'a studio portrait',
    aspect_ratio: 'classic_4_3',
    enable_safety_checker: true,
  });
});

test('builds Gemini 2.5 Flash Image Preview request body', () => {
  assert.deepEqual(buildMagnificAsyncRequest({
    modelKey: 'gemini25FlashImagePreview',
    prompt: 'a studio portrait',
    aspectRatio: '16:9',
    resolution: '2k',
  }), {
    prompt: 'a studio portrait',
  });
});

test('normalizes async task response into DLL PIC image objects', () => {
  assert.deepEqual(parseMagnificTaskResponse({
    data: {
      task_id: 'task-1',
      status: 'COMPLETED',
      generated: [
        'https://example.com/image.png',
        { url: 'https://example.com/image-2.webp', mime_type: 'image/webp', has_nsfw: true },
      ],
      has_nsfw: [false, false],
    },
  }), {
    images: [
      {
        src: 'https://example.com/image.png',
        mimeType: 'image/png',
        hasNsfw: false,
      },
      {
        src: 'https://example.com/image-2.webp',
        mimeType: 'image/webp',
        hasNsfw: true,
      },
    ],
    errors: [],
    meta: {
      taskId: 'task-1',
      status: 'COMPLETED',
      groundingMetadata: null,
    },
  });
});

test('generates async Magnific images by creating and polling tasks', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({
      url,
      method: options.method,
      body: options.body ? JSON.parse(options.body) : null,
    });

    if (options.method === 'POST') {
      const taskIndex = requests.filter((request) => request.method === 'POST').length;
      return {
        ok: true,
        json: async () => ({
          data: {
            generated: [],
            task_id: `task-${taskIndex}`,
            status: 'IN_PROGRESS',
          },
        }),
      };
    }

    const taskId = url.split('/').pop();
    return {
      ok: true,
      json: async () => ({
        data: {
          generated: [`https://example.com/${taskId}.jpg`],
          task_id: taskId,
          status: 'COMPLETED',
        },
      }),
    };
  };

  const result = await generateMagnificModelImages({
    apiKey: 'test-key',
    apiBaseUrl: 'https://api.example.com',
    fetchImpl,
    pollIntervalMs: 0,
    maxAttempts: 3,
    payload: {
      modelKey: 'zImageTurbo',
      prompt: 'cinematic portrait',
      aspectRatio: '16:9',
      count: 2,
    },
  });

  assert.deepEqual(result.images.map((image) => image.src), [
    'https://example.com/task-1.jpg',
    'https://example.com/task-2.jpg',
  ]);
  assert.equal(requests.filter((request) => request.method === 'POST').length, 2);
  assert.equal(requests.filter((request) => request.method === 'GET').length, 2);
  assert.deepEqual(requests[0].body, {
    prompt: 'cinematic portrait',
    image_size: 'landscape_16_9',
    num_inference_steps: 8,
    output_format: 'png',
    enable_safety_checker: true,
  });
});

test('builds Classic request when model key is omitted for backwards compatibility', () => {
  const request = buildMagnificRequest({
    prompt: 'cinematic portrait',
    aspectRatio: '1:1',
    count: 3,
  });

  assert.equal(request.modelKey, 'classic');
  assert.equal(request.modelConfig.endpoint, '/v1/ai/text-to-image');
  assert.equal(request.body.num_images, 3);
});
