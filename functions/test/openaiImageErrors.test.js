'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generateOpenAIImage, submitOpenAIImage, classifyOpenAIImageError, mapOpenAIImageFailure, reportOpenAIImageFailure } = require('../src/openaiImageGeneration');
const input = { prompt: 'private prompt secret phrase', resolution: '1k', aspectRatio: '1:1' };
const secret = 'sk-secretprivate123';
const mockResponse = (status, code, message = 'private prompt secret phrase sk-secretprivate123') => ({
  ok: false, status, json: async () => ({ error: { code, message } }),
});
async function rejected(status, code) {
  try { await generateOpenAIImage({ apiKey: secret, input, fetchImpl: async () => mockResponse(status, code) }); }
  catch (error) { return error; }
  throw new Error('expected provider error');
}
test('explicit 400 moderation codes are terminal and never leak message, prompt, or key', async () => {
  for (const code of ['content_policy_violation', 'moderation_blocked', 'image_content_policy_violation']) {
    const error = await rejected(400, code);
    const info = mapOpenAIImageFailure(error);
    assert.equal(info.classification.reason, 'openai_moderation');
    assert.equal(info.classification.providerCode, code);
    assert.equal(info.functionCode, 'invalid-argument');
    assert.match(info.message, /審核/);
    assert.doesNotMatch(JSON.stringify(info) + error.message, /private prompt|sk-secretprivate123/);
  }
});
test('network failure and ambiguous provider errors never imply moderation or success', async () => {
  let network;
  try { await generateOpenAIImage({ apiKey: secret, input, fetchImpl: async () => { throw new Error('sk-secretprivate123 private prompt'); } }); }
  catch (error) { network = error; }
  assert.equal(mapOpenAIImageFailure(network).classification.reason, 'openai_connection');
  assert.equal(mapOpenAIImageFailure(network).functionCode, 'unavailable');
  assert.match(mapOpenAIImageFailure(network).message, /連線/);
  assert.doesNotMatch(JSON.stringify(mapOpenAIImageFailure(network)) + network.message, /private prompt|sk-secretprivate123/);
  for (const [status, code] of [[500, 'moderation_blocked'], [400, 'sk-secretprivate123'], [400, null]]) {
    const info = mapOpenAIImageFailure(await rejected(status, code));
    assert.notEqual(info.classification.reason, 'openai_moderation');
    assert.equal(info.functionCode, 'unavailable');
    assert.doesNotMatch(JSON.stringify(info), /sk-secretprivate123/);
  }
  assert.equal((await classifyOpenAIImageError(await rejected(400, 'sk-secretprivate123'))).providerCode, 'other');
});
test('malformed response keeps HTTP status and remains uncertain without exposing response content', async () => {
  let error;
  try { await generateOpenAIImage({ apiKey: secret, input, fetchImpl: async () => ({ ok: false, status: 400, json: async () => { throw new Error(secret); } }) }); }
  catch (caught) { error = caught; }
  const result = mapOpenAIImageFailure(error);
  assert.equal(result.classification.reason, 'openai_invalid_response');
  assert.equal(result.classification.httpStatus, 400);
  assert.equal(result.functionCode, 'unavailable');
  assert.doesNotMatch(JSON.stringify(result) + error.message, /sk-secretprivate123/);
});
test('claimed moderation is recorded rejected, ambiguous failure uncertain, and neither resubmits', async () => {
  for (const [error, phase] of [[await rejected(400, 'content_policy_violation'), 'rejected'], [await rejected(500, 'moderation_blocked'), 'uncertain']]) {
    let claimed = false, calls = 0; const phases = [];
    const store = { claim: async () => claimed ? { claimed: false } : (claimed = true, { claimed: true }), update: async (_, value) => phases.push(value.phase) };
    const args = { apiKey: secret, input, requestId: 'example', store, generate: async () => { calls++; throw error; } };
    await assert.rejects(submitOpenAIImage(args));
    await assert.rejects(submitOpenAIImage(args), e => e.duplicate === true);
    assert.equal(calls, 1); assert.deepEqual(phases, [phase]);
  }
});

test('diagnostic log only receives sanitized fixed classification fields', async () => {
  const messages = [];
  const error = await rejected(400, 'sk-secretprivate123 private prompt');
  const failure = reportOpenAIImageFailure(error, (...args) => messages.push(args));
  assert.deepEqual(messages, [['OpenAI image generation failed', { reason: 'openai_provider_error', httpStatus: 400, providerCode: 'other' }]]);
  assert.doesNotMatch(JSON.stringify(messages), /sk-secretprivate123|private prompt/);
  assert.equal(failure.functionCode, 'unavailable');
  const unrelated = Object.assign(new Error('private prompt'), { status: 400, providerCode: 'content_policy_violation' });
  assert.equal(mapOpenAIImageFailure(unrelated).classification.reason, 'openai_unknown');
});
