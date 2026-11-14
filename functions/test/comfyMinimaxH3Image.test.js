const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildComfyWorkflow, parseComfyJob } = require('../src/comfyCloud');
const payload = { modelKey: 'minimaxH3Image', prompt: 'A ceramic cup.\nNatural daylight.' };
test('H3 Image defaults to verified 4 MP workflow with no reference or expansion', () => {
  const { workflow: w, meta } = buildComfyWorkflow(payload, 42);
  assert.equal(meta.resolution, '2k');
  assert.equal(meta.aspectRatio, '1:1');
  assert.equal(meta.width, 2048);
  assert.equal(meta.height, 2048);
  assert.equal(w['30'].inputs.prompt, payload.prompt);
  assert.equal(w['30'].inputs.width, 2048);
  assert.equal(w['35'].inputs.noise_seed, 42);
  assert.equal(w['1'].inputs.unet_name, 'minimax_h3_image_pruned_int8_convrot.safetensors');
  assert.equal(w['2'].inputs.clip_name, 'qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors');
  assert.equal(w['3'].inputs.vae_name, 'minimax_h3_image_vae_fp16.safetensors');
  assert.equal(w['37'].inputs.steps, 6);
  assert.equal(w['36'].inputs.cfg, 1);
  assert.deepEqual(w['38'].inputs, { s_noise: 1.1, s_noise_end: 0.9, noise_clip_std: 0 });
  assert.equal(Object.keys(w).length, 12);
  assert.ok(!Object.values(w).some(n => /LoadImage|TextGenerate|Lora/.test(n.class_type)));
  assert.throws(() => buildComfyWorkflow({ ...payload, count: 2 }), /每個任務固定一張/);
  assert.throws(() => buildComfyWorkflow({ ...payload, resolution: '1k' }), /解析度/);
  assert.throws(() => buildComfyWorkflow({ ...payload, aspectRatio: '9:16' }), /比例/);
  assert.throws(() => buildComfyWorkflow({ ...payload, loraStrength: 1 }), /不支援/);
  const result = parseComfyJob({ id: 'job', status: 'succeeded', outputs: [
    { id: 'ignore', node_id: '9', type: 'image' }, { id: 'final', node_id: '34', type: 'image', content_type: 'image/png' },
  ] }, meta);
  assert.deepEqual(result.images.map(x => x.assetId), ['final']);
});
