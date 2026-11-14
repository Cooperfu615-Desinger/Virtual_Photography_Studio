const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildComfyWorkflow, parseComfyJob } = require('../src/comfyCloud');
const modelKey = 'zImageTurboNsfwV2Bf16';
const payload = { modelKey, prompt: 'A ceramic cup.\nNatural daylight.', count: 1, resolution: '1k', aspectRatio: '1:1' };

test('BF16 v2 uses verified model and sampling without changing the original Z model', () => {
  const { workflow: w, meta } = buildComfyWorkflow(payload, 20261114);
  assert.equal(w['57:28'].inputs.unet_name, 'tewea__z_image_turbo_bf16_nsfw__z_image_turbo_bf16_nsfw_v2.safetensors');
  assert.equal(w['57:30'].inputs.clip_name, 'qwen_3_4b.safetensors');
  assert.equal(w['57:29'].inputs.vae_name, 'ae.safetensors');
  assert.equal(w['57:27'].inputs.text, payload.prompt);
  assert.equal(w['57:3'].inputs.steps, 8);
  assert.equal(w['57:3'].inputs.cfg, 1);
  assert.equal(w['57:3'].inputs.sampler_name, 'res_multistep');
  assert.equal(w['57:3'].inputs.scheduler, 'simple');
  assert.equal(w['57:11'].inputs.shift, 3);
  assert.equal(w['57:3'].inputs.seed, 20261114);
  assert.equal(w['57:13'].inputs.batch_size, 1);
  assert.equal(Object.keys(w).length, 10);
  assert.equal(meta.modelKey, modelKey);
  assert.equal(buildComfyWorkflow({ ...payload, modelKey: 'zImageTurbo' }, 1).workflow['57:28'].inputs.unet_name, 'z_image_turbo_bf16.safetensors');
  assert.throws(() => buildComfyWorkflow({ ...payload, count: 2 }), /每個任務固定一張/);
});

test('BF16 v2 preserves selected dimensions and returns only final image output', () => {
  for (const resolution of ['1k', '2k']) for (const aspectRatio of ['1:1', '4:3', '3:4', '16:9', '9:16', '4:5']) {
    const { workflow, meta } = buildComfyWorkflow({ ...payload, resolution, aspectRatio }, 42);
    const [a, b] = aspectRatio.split(':').map(Number);
    assert.equal(meta.width / meta.height, a / b);
    assert.equal(workflow['57:13'].inputs.width, meta.width);
    assert.equal(workflow['57:13'].inputs.height, meta.height);
    const result = parseComfyJob({ id: 'job', status: 'succeeded', outputs: [{ id: 'final', node_id: '9', type: 'image', content_type: 'image/png' }] }, meta);
    assert.equal(result.images.length, 1);
  }
});
