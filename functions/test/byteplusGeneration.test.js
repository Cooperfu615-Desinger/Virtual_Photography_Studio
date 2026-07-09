const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  buildBytePlusPrompt,
  buildBytePlusRequest,
  generateBytePlusImages,
  getBytePlusResolution,
  parseBytePlusGenerationResponse,
} = require('../src/byteplusGeneration');

test('builds BytePlus Seedream 5.0 Pro request body', () => {
  assert.equal(getBytePlusResolution('seedream5Pro', '1k'), '1K');
  assert.equal(getBytePlusResolution('seedream5Pro', '4k'), '2K');
  assert.equal(
    buildBytePlusPrompt(' cinematic portrait ', '16:9'),
    'cinematic portrait\n\nComposition requirement: Use a wide horizontal 16:9 composition.',
  );
  assert.deepEqual(buildBytePlusRequest({
    modelKey: 'seedream5Pro',
    prompt: ' cinematic portrait ',
    aspectRatio: '9:16',
    resolution: '2k',
  }), {
    model: 'dola-seedream-5-0-pro-260628',
    prompt: 'cinematic portrait\n\nComposition requirement: Use a tall vertical 9:16 composition.',
    size: '2K',
    output_format: 'png',
    response_format: 'b64_json',
    watermark: false,
  });
});

test('builds BytePlus Seedream 5.0 Lite request body', () => {
  assert.equal(getBytePlusResolution('seedream5Lite', '4k'), '4K');
  assert.equal(getBytePlusResolution('seedream5Lite', '1k'), '2K');
  assert.deepEqual(buildBytePlusRequest({
    modelKey: 'seedream5Lite',
    prompt: 'a studio portrait',
    aspectRatio: '3:4',
    resolution: '4k',
  }), {
    model: 'seedream-5-0-260128',
    prompt: 'a studio portrait\n\nComposition requirement: Use a vertical 3:4 composition.',
    size: '4K',
    output_format: 'png',
    response_format: 'b64_json',
    watermark: false,
    sequential_image_generation: 'disabled',
  });
});

test('parses BytePlus base64 and URL responses into DLL PIC image objects', () => {
  assert.deepEqual(parseBytePlusGenerationResponse({
    model: 'seedream-5-0-pro-260628',
    data: [
      {
        b64_json: 'base64-image',
        mime_type: 'image/png',
        size: '2K',
      },
      {
        url: 'https://cdn.example.test/generated.webp?token=1',
        size: '1K',
      },
      {
        error: {
          message: 'blocked',
        },
      },
    ],
    usage: {
      total_tokens: 1,
    },
  }), {
    images: [
      {
        src: 'data:image/png;base64,base64-image',
        mimeType: 'image/png',
        size: '2K',
      },
      {
        src: 'https://cdn.example.test/generated.webp?token=1',
        mimeType: 'image/webp',
        size: '1K',
      },
    ],
    errors: ['blocked'],
    meta: {
      model: 'seedream-5-0-pro-260628',
      usage: {
        total_tokens: 1,
      },
    },
  });
});

test('falls back from tutorial Pro model id to listed Pro model id when unavailable', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({
      url,
      method: options.method,
      headers: options.headers,
      body: JSON.parse(options.body),
    });

    if (requests.length === 1) {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: {
            message: 'model not found',
          },
        }),
      };
    }

    return {
      ok: true,
      json: async () => ({
        model: requests.at(-1).body.model,
        data: [{
          b64_json: 'byteplus-image',
          mime_type: 'image/png',
        }],
      }),
    };
  };

  const result = await generateBytePlusImages({
    apiKey: 'ark-test-key',
    apiBaseUrl: 'https://ark.example.test/api/v3',
    fetchImpl,
    payload: {
      modelKey: 'seedream5Pro',
      prompt: 'cinematic portrait',
      aspectRatio: '16:9',
      count: 1,
      resolution: '2k',
    },
  });

  assert.deepEqual(requests.map((request) => request.body.model), [
    'dola-seedream-5-0-pro-260628',
    'seedream-5-0-pro-260628',
  ]);
  assert.equal(requests[0].url, 'https://ark.example.test/api/v3/images/generations');
  assert.equal(requests[0].headers.Authorization, 'Bearer ark-test-key');
  assert.deepEqual(result.images, [{
    src: 'data:image/png;base64,byteplus-image',
    mimeType: 'image/png',
    size: null,
  }]);
  assert.deepEqual(result.meta.models, ['seedream-5-0-pro-260628']);
});

test('generates one BytePlus request per requested image', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    const requestIndex = requests.length + 1;
    requests.push({
      url,
      body: JSON.parse(options.body),
    });

    return {
      ok: true,
      json: async () => ({
        model: requests.at(-1).body.model,
        data: [{
          b64_json: `image-${requestIndex}`,
          mime_type: 'image/png',
        }],
      }),
    };
  };

  const result = await generateBytePlusImages({
    apiKey: 'ark-test-key',
    fetchImpl,
    payload: {
      modelKey: 'seedream5Lite',
      prompt: 'cinematic portrait',
      aspectRatio: '1:1',
      count: 3,
      resolution: '3k',
    },
  });

  assert.equal(requests.length, 3);
  assert.deepEqual(requests.map((request) => request.body.size), ['3K', '3K', '3K']);
  assert.deepEqual(result.images.map((image) => image.src), [
    'data:image/png;base64,image-1',
    'data:image/png;base64,image-2',
    'data:image/png;base64,image-3',
  ]);
});
