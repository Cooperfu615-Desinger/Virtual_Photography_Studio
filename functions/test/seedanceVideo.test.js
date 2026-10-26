const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildVideoWorkflow, videoSettings, readVideoQuota } = require('../src/comfyVideo');
const input = { modelKey: 'seedance25', duration: 5, resolution: '720p', ratio: '16:9', audio: false, motion: 'Slow turn', camera: 'Push in' };
const source = { assetId: '42345678-1234-1234-1234-123456789abc', width: 1920, height: 1080 };

test('Seedance R2V binds one owned reference, explicit task, audio and MP4 without first-frame or expansion', () => {
  const { workflow, meta } = buildVideoWorkflow(input, source, 7);
  assert.equal(workflow['2'].class_type, 'ByteDance2ReferenceNodeV2');
  assert.deepEqual(workflow['2'].inputs, { model: 'Seedance 2.5', 'model.prompt': 'Slow turn\nPush in',
    'model.resolution': '720p', 'model.duration': 5, seed: 7, watermark: false,
    'model.reference_images.image_1': ['1', 0], 'model.ratio': '16:9', 'model.generate_audio': false,
    'model.task_type': 'reference', 'model.output_format': 'mp4', 'model.auto_downscale': true, 'model.auto_upscale': false });
  assert.equal(workflow['3'].inputs.format, 'mp4'); assert.equal(meta.ratio, '16:9');
  for (const duration of [4, 30]) for (const resolution of ['480p', '720p', '1080p']) {
    assert.doesNotThrow(() => videoSettings({ ...input, duration, resolution }));
  }
  for (const patch of [{ duration: 3 }, { duration: 31 }, { duration: 4.5 }, { resolution: '4k' }, { ratio: '2:3' }]) {
    assert.throws(() => videoSettings({ ...input, ...patch }));
  }
  assert.throws(() => buildVideoWorkflow(input, { ...source, width: 299 }), /300/);
  assert.throws(() => buildVideoWorkflow(input, { assetId: source.assetId }), /300/);
});

test('Seedance credit estimate tracks resolution, duration and ratio, not audio; adaptive uses conservative area', async () => {
  const quote = patch => readVideoQuota({ apiKey: 'test', payload: { ...input, ...patch }, fetchImpl: async () => ({ ok: true, json: async () => ({}) }) });
  assert.equal((await quote({})).estimatedCredits, 348.73);
  assert.equal((await quote({ resolution: '480p' })).estimatedCredits, 155.11);
  assert.equal((await quote({ resolution: '1080p' })).estimatedCredits, 857.79);
  assert.equal((await quote({ duration: 10, audio: true })).estimatedCredits, 697.46);
  assert.ok((await quote({ ratio: 'adaptive' })).estimatedCredits >= (await quote({ ratio: '4:3' })).estimatedCredits);
  assert.equal((await quote({})).credits, null);
});
