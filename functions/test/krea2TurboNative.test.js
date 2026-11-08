const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildComfyWorkflow, parseComfyJob } = require('../src/comfyCloud');

test('native Krea Turbo samples the directly encoded DLL prompt with the original FP8 model', () => {
  const payload = { modelKey: 'krea2TurboNative', prompt: 'Rainy window.\nClose portrait.', aspectRatio: '9:16', resolution: '1k' };
  const { workflow, meta } = buildComfyWorkflow(payload, 123);
  const sampler = workflow['30:3'].inputs;
  assert.deepEqual([sampler.steps, sampler.cfg, sampler.sampler_name, sampler.scheduler, sampler.seed], [8, 1, 'euler', 'simple', 123]);
  const inputsOf = ([id]) => workflow[id].inputs;
  assert.equal(inputsOf(sampler.model).unet_name, 'krea2_turbo_fp8_scaled.safetensors');
  assert.equal(inputsOf(sampler.positive).text, payload.prompt);
  assert.deepEqual(inputsOf(sampler.negative).conditioning, sampler.positive);
  assert.equal(inputsOf(sampler.latent_image).batch_size, 1);
  assert.equal(meta.width * 16, meta.height * 9);
  assert.throws(() => buildComfyWorkflow({ ...payload, count: 2 }, 123), /固定一張/);
  const outputs = ['30:8', '29'].map(node_id => ({ node_id, type: 'image', id: node_id }));
  const result = parseComfyJob({ id: 'fixture', status: 'succeeded', outputs }, meta);
  assert.deepEqual(result.images.map(image => image.assetId), ['29']);
});
