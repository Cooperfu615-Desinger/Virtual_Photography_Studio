const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  buildMagnificClassicRequest,
  clampGenerationCount,
  getMagnificClassicImageSize,
  inferBase64ImageMimeType,
  parseMagnificClassicResponse,
} = require('../src/magnificClassic');

test('maps DLL PIC aspect ratios to Magnific Classic image sizes', () => {
  assert.equal(getMagnificClassicImageSize('1:1'), 'square_1_1');
  assert.equal(getMagnificClassicImageSize('4:3'), 'classic_4_3');
  assert.equal(getMagnificClassicImageSize('3:4'), 'traditional_3_4');
  assert.equal(getMagnificClassicImageSize('16:9'), 'widescreen_16_9');
  assert.equal(getMagnificClassicImageSize('9:16'), 'social_story_9_16');
  assert.equal(getMagnificClassicImageSize('unknown'), 'social_story_9_16');
});

test('clamps Magnific Classic generation count to supported range', () => {
  assert.equal(clampGenerationCount(0), 1);
  assert.equal(clampGenerationCount(2), 2);
  assert.equal(clampGenerationCount(8), 4);
  assert.equal(clampGenerationCount('3.8'), 3);
  assert.equal(clampGenerationCount('bad'), 1);
});

test('builds a Magnific Classic request body', () => {
  assert.deepEqual(buildMagnificClassicRequest({
    prompt: '  cinematic portrait  ',
    aspectRatio: '16:9',
    count: 5,
    guidanceScale: 2.8,
    seed: 1000008,
  }), {
    prompt: 'cinematic portrait',
    image: {
      size: 'widescreen_16_9',
    },
    num_images: 4,
    filter_nsfw: true,
    guidance_scale: 2,
    seed: 1000000,
  });
});

test('parses Magnific Classic base64 images into DLL PIC image objects', () => {
  assert.deepEqual(parseMagnificClassicResponse({
    data: [{
      base64: 'base64-image',
      has_nsfw: false,
    }],
    meta: {
      prompt: 'portrait',
    },
  }), {
    images: [{
      src: 'data:image/png;base64,base64-image',
      mimeType: 'image/png',
      hasNsfw: false,
    }],
    errors: [],
    meta: {
      prompt: 'portrait',
    },
  });
});

test('infers Magnific Classic image MIME type from base64 magic bytes', () => {
  assert.equal(inferBase64ImageMimeType('iVBORw0KGgoAAA'), 'image/png');
  assert.equal(inferBase64ImageMimeType('/9j/4AAQSkZJRg'), 'image/jpeg');
  assert.equal(inferBase64ImageMimeType('UklGRiIAAABXRUJQ'), 'image/webp');
  assert.equal(inferBase64ImageMimeType('R0lGODlhAQABAIA'), 'image/gif');
  assert.equal(inferBase64ImageMimeType('unknown'), 'image/png');
});

test('honors Magnific Classic declared image MIME type when present', () => {
  assert.deepEqual(parseMagnificClassicResponse({
    data: [{
      base64: '/9j/jpeg-image',
      mime_type: 'image/webp',
      has_nsfw: true,
    }],
  }).images, [{
    src: 'data:image/webp;base64,/9j/jpeg-image',
    mimeType: 'image/webp',
    hasNsfw: true,
  }]);
});
