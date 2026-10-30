const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildVideoWorkflow, videoSettings, readVideoQuota, readVideoJob } = require('../src/comfyVideo');
const template = require('../src/pikaH3FlexWorkflow.json');
const ID = '12345678-1234-1234-1234-123456789abc';
const JOB = '32345678-1234-1234-1234-123456789abc';
const ASSET = '42345678-1234-1234-1234-123456789abc';
const payload = { requestId: ID, sourceId: ID, modelKey: 'pikaH3Flex', resolution: '依首圖', duration: 5, audio: true, motion: 'Turn slowly', camera: 'Push in' };

test('Pika uses the tested single-first-frame graph and preserves its sampling and output', () => {
  const { workflow, meta } = buildVideoWorkflow(payload, { assetId: ASSET, width: 768, height: 1360 }, 7);
  assert.equal(Object.keys(workflow).length, 23);
  assert.equal(workflow['1'].inputs.image.info.id, ASSET);
  assert.deepEqual(workflow['140:131'].inputs.first_frame, ['1', 0]);
  assert.equal(workflow['140:131'].inputs.last_frame, undefined);
  assert.equal(workflow['140:131'].inputs.prompt, 'Turn slowly\nPush in');
  assert.equal(workflow['140:129'].inputs.noise_seed, 7);
  assert.equal(workflow['140:133'].inputs.value, 5);
  assert.equal(workflow['140:134'].inputs.lora_name, 'pika_h3_flex_fl2va_v1_bf16.safetensors');
  assert.equal(workflow['140:134'].inputs.strength_model, 1);
  assert.equal(workflow['140:123'].inputs.sampler_name, 'lcm');
  assert.equal(workflow['140:130'].inputs.fps, 24);
  assert.equal(workflow['3'].class_type, 'SaveVideo');
  assert.equal(meta.width, 768);
  assert.equal(template['140:131'].inputs.prompt, '');
  for (const patch of [{ duration: 4 }, { duration: 6 }, { audio: false }, { resolution: '2K' }]) assert.throws(() => videoSettings({ ...payload, ...patch }));
});

test('Pika shows real remaining credits without inventing a cost estimate', async () => {
  const result = await readVideoQuota({ apiKey: 'key', payload, fetchImpl: async () => ({ ok: true, json: async () => ({ summary: { balance: { currency: 'USD', amount_micros: 1000 } } }) }) });
  assert.equal(result.credits, 2110); assert.equal(result.estimatedCredits, null); assert.equal(result.estimatedVideos, null); assert.equal(result.rateDate, null);
});

test('Pika accepts observed MP4 output type and uses owned asset lookup', async () => {
  const records = new Map([[ID, { kind: 'video', jobId: JOB, meta: payload }]]);
  const store = { get: async id => records.get(id), update: async (id, patch) => records.set(id, { ...records.get(id), ...patch }) };
  const fetchImpl = async url => ({ ok: true, json: async () => url.includes('/assets/')
    ? { id: ASSET, file_path: 'result.mp4', url: 'https://media.example.org/result.mp4' }
    : { id: JOB, status: 'succeeded', outputs: [{ node_id: '3', id: ASSET, type: 'image', content_type: 'video/mp4' }] } });
  const result = await readVideoJob({ apiKey: 'key', payload, store, fetchImpl });
  assert.equal(result.video.mimeType, 'video/mp4'); assert.equal(records.get(ID).outputAssetId, ASSET);
});
