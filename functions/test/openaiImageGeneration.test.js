'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { SIZES, buildOpenAIImageRequest, generateOpenAIImage } = require('../src/openaiImageGeneration');

test('OpenAI sizes satisfy image constraints and retain quality', () => {
  for (const [resolution, ratios] of Object.entries(SIZES)) {
    for (const [aspectRatio, size] of Object.entries(ratios)) {
      const [w, h] = size.split('x').map(Number);
      assert.equal(w % 16, 0); assert.equal(h % 16, 0);
      assert.ok(w * h >= 655360 && w * h <= 8294400);
      assert.equal(buildOpenAIImageRequest({ prompt: ' portrait ', resolution, aspectRatio, quality: 'high' }).quality, 'high');
    }
  }
  assert.throws(() => buildOpenAIImageRequest({ prompt: 'abc', resolution: '4k', aspectRatio: '1:1' }));
  assert.throws(() => buildOpenAIImageRequest({ prompt: 'abc', resolution: '1k', aspectRatio: '1:1', quality: 'max' }));
});

test('OpenAI request returns base64 data without exposing key', async () => {
  let body;
  const result = await generateOpenAIImage({ apiKey: 'fake', input: { prompt: 'portrait', resolution: '1k', aspectRatio: '1:1' }, fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/images/generations');
    body = JSON.parse(options.body);
    return { ok: true, json: async () => ({ data: [{ b64_json: 'YWJj' }] }) };
  } });
  assert.equal(body.model, 'gpt-image-2'); assert.equal(body.n, 1); assert.equal(body.quality, 'medium');
  assert.equal(result.images[0].src, 'data:image/png;base64,YWJj');
  assert.ok(!JSON.stringify(result).includes('fake'));
});

test('claimed request is submitted once even when the provider response is lost', async () => {
  const { submitOpenAIImage } = require('../src/openaiImageGeneration');
  let claimed = false, calls = 0; const phases = [];
  const store = { claim: async () => { if (claimed) return { claimed: false }; claimed = true; return { claimed: true }; }, update: async (_id, data) => { phases.push(data.phase); } };
  const args = { apiKey: 'fake', requestId: 'id', input: { prompt: 'portrait', resolution: '1k', aspectRatio: '1:1' }, store, generate: async () => { calls += 1; throw new Error('network'); } };
  await assert.rejects(submitOpenAIImage(args), /network/);
  await assert.rejects(submitOpenAIImage(args), error => error.duplicate === true);
  assert.equal(calls, 1); assert.deepEqual(phases, ['uncertain']);
});
