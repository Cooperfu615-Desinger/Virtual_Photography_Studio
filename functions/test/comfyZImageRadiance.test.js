const test = require('node:test');
const assert = require('node:assert/strict');
const { buildComfyWorkflow, submitComfyJob } = require('../src/comfyCloud');
const { readComfyQuota } = require('../src/comfyQuota');
const payload = { modelKey: 'zImageTurboRadiance', prompt: 'An adult portrait.', resolution: '1k', aspectRatio: '1:1', count: 1 };
const filename = 'AIImageStudio__RadianceChromeVoluptuous_z_image_turbo_v20__RadianceChromeVoluptuous_z-image_turbo_v2.0.safetensors';

test('Radiance adds only the verified adapter to Z-Image Turbo BF16', () => {
  for (const resolution of ['1k', '2k']) for (const aspectRatio of ['1:1', '4:3', '3:4', '16:9', '9:16', '4:5']) {
    const base = buildComfyWorkflow({ ...payload, modelKey: 'zImageTurbo', resolution, aspectRatio }, 42);
    for (const loraStrength of [0, 0.05, 0.7, 1]) {
      const result = buildComfyWorkflow({ ...payload, resolution, aspectRatio, loraStrength }, 42);
      assert.equal(result.meta.loraStrength, loraStrength);
      assert.deepEqual(result.workflow['60'], { class_type: 'LoraLoaderModelOnly', inputs: {
        model: ['57:28', 0], lora_name: filename, strength_model: loraStrength } });
      assert.deepEqual(result.workflow['57:11'].inputs.model, ['60', 0]);
      delete result.workflow['60']; result.workflow['57:11'].inputs.model = ['57:28', 0];
      assert.deepEqual(result.workflow, base.workflow);
    }
  }
  assert.equal(buildComfyWorkflow(payload, 42).meta.loraStrength, 1);
});

test('invalid Radiance strengths fail before claiming or submitting', async () => {
  for (const loraStrength of [-0.05, 1.05, 0.333, '', '0.7', null, true, NaN]) {
    await assert.rejects(submitComfyJob({ payload: { ...payload, loraStrength, requestId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' },
      store: { claim: () => assert.fail('must not claim') }, fetchImpl: () => assert.fail('must not submit') }), /強度/);
  }
});

test('quota samples isolate Radiance, Asian Mix and strength and verify the upstream workflow', async () => {
  const requests = [{ ...payload, loraStrength: 0.55 }, { ...payload, loraStrength: 1 },
    { ...payload, modelKey: 'zImageTurboAsianMix', loraStrength: 1 }];
  const builds = requests.map(request => buildComfyWorkflow(request, 42));
  const ids = Array.from({ length: 9 }, (_, i) => `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee${i}`);
  const records = ids.map((jobId, i) => ({ jobId, meta: builds[Math.floor(i / 3)].meta }));
  let mismatch = false;
  const fetchImpl = async url => {
    let body;
    if (url.includes('/billing/')) body = { summary: { balance: { currency: 'USD', amount_micros: 100 } } };
    else {
      const jobId = url.split('/').at(url.endsWith('/workflow') ? -2 : -1);
      const group = Math.floor(ids.indexOf(jobId) / 3);
      if (url.endsWith('/workflow')) {
        const workflow = structuredClone(builds[group].workflow);
        if (mismatch) workflow['60'].inputs.lora_name = 'unexpected.safetensors';
        body = { format: 'api', workflow };
      } else body = { id: jobId, status: 'succeeded', metrics: { execution_ms: 10000 }, outputs: [{ type: 'image', node_id: '9' }] };
    }
    return { ok: true, json: async () => body };
  };
  const options = { apiKey: 'fixture', fetchImpl, records };
  for (const request of requests) assert.equal((await readComfyQuota({ ...options, payload: request })).sampleCount, 3);
  mismatch = true;
  assert.equal((await readComfyQuota({ ...options, payload: requests[0] })).sampleCount, 0);
});
