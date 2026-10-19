const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildComfyWorkflow, parseComfyJob } = require('../src/comfyCloud');
const { readComfyQuota } = require('../src/comfyQuota');
const payload = { modelKey: 'flux3KleinBaseInt8', prompt: 'Exact DLL prompt.\nDo not expand.', aspectRatio: '1:1', resolution: '1k', count: 1 };

test('FLUX Base uses direct prompt and original 50-step sampler without upsampler or layout nodes', () => {
  const { workflow: w } = buildComfyWorkflow(payload, 42);
  assert.equal(Object.keys(w).length, 9);
  assert.equal(w['18:1'].inputs.unet_name, 'flux3_image_klein_base_int8_convrot.safetensors');
  assert.equal(w['18:2'].inputs.clip_name, 'qwen3vl_4b_int8_convrot.safetensors');
  assert.equal(w['18:3'].inputs.vae_name, 'flux2-vae.safetensors');
  assert.equal(w['18:4'].inputs.text, payload.prompt);
  assert.equal(w['18:5'].inputs.text, '');
  assert.deepEqual(w['18:7'].inputs, { seed: 42, steps: 50, cfg: 3.5, sampler_name: 'euler', scheduler: 'simple', denoise: 1,
    model: ['18:1', 0], positive: ['18:4', 0], negative: ['18:5', 0], latent_image: ['18:6', 0] });
  assert.equal(w['18:6'].inputs.batch_size, 1);
  assert.deepEqual(w['9'].inputs.images, ['18:8', 0]);
  for (const node of Object.values(w)) for (const value of Object.values(node.inputs)) {
    if (Array.isArray(value)) assert.ok(w[value[0]], 'all node references resolve');
  }
  assert.throws(() => buildComfyWorkflow({ ...payload, count: 2 }), /每個任務固定一張/);
});

test('FLUX dimensions preserve exact ratios on a 16-pixel grid; old local model dimensions stay unchanged', () => {
  for (const resolution of ['1k', '2k']) for (const aspectRatio of ['1:1', '4:3', '3:4', '16:9', '9:16', '4:5']) {
    const [a, b] = aspectRatio.split(':').map(Number);
    const { workflow, meta } = buildComfyWorkflow({ ...payload, resolution, aspectRatio }, 42);
    assert.equal(meta.width % 16, 0); assert.equal(meta.height % 16, 0);
    assert.equal(meta.width * b, meta.height * a);
    assert.equal(workflow['18:6'].inputs.width, meta.width);
    assert.equal(workflow['18:6'].inputs.height, meta.height);
    for (const modelKey of ['zImageTurbo', 'qwenImage21', 'zImageTurboInt8']) {
      const unit = Math.round(Math.sqrt((resolution === '2k' ? 4 : 1) * 1048576 / (a * b)) / 8);
      const old = buildComfyWorkflow({ ...payload, modelKey, resolution, aspectRatio }, 42).meta;
      assert.equal(old.width, a * unit * 8); assert.equal(old.height, b * unit * 8);
    }
  }
});

test('FLUX accepts only final SaveImage output', () => {
  const result = parseComfyJob({ id: 'job', status: 'succeeded', outputs: [
    { id: 'final', node_id: '9', type: 'image', content_type: 'image/png' },
    { id: 'preview', node_id: '18:8', type: 'image' },
    { id: 'text', node_id: '9', type: 'text' },
  ] }, { modelKey: payload.modelKey });
  assert.deepEqual(result.images.map(i => i.assetId), ['final']);
});

test('FLUX estimate requires its own exact workflow samples and rejects changed sampling settings', async () => {
  const built = buildComfyWorkflow(payload, 42);
  const records = [0, 1, 2].map(i => ({ jobId: `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee${i}`, meta: built.meta }));
  let changed = false;
  const fetchImpl = async url => {
    const workflow = structuredClone(built.workflow);
    if (changed) workflow['18:7'].inputs.steps = 16;
    return { ok: true, json: async () => url.includes('/billing/')
      ? { summary: { balance: { currency: 'USD', amount_micros: 100 } } }
      : url.endsWith('/workflow') ? { format: 'api', workflow }
        : { id: url.split('/').pop(), status: 'succeeded', metrics: { execution_ms: 10000 }, outputs: [{ type: 'image', node_id: '9' }] } };
  };
  const request = { apiKey: 'fixture', payload, records, fetchImpl };
  assert.equal((await readComfyQuota(request)).sampleCount, 3);
  changed = true;
  assert.equal((await readComfyQuota(request)).estimatedImages, null);
  assert.equal((await readComfyQuota({ ...request, records: records.map(r => ({ ...r, meta: { ...r.meta, modelKey: 'zImageTurbo' } })) })).sampleCount, 0);
});
