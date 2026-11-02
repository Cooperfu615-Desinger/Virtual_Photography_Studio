const test = require('node:test');
const assert = require('node:assert/strict');
const { buildComfyWorkflow, submitComfyJob } = require('../src/comfyCloud');
const payload = { modelKey: 'qwenImage21OmniLora', prompt: 'A ceramic cup.', resolution: '1k', aspectRatio: '1:1', count: 1 };
test('Omni uses the fixed imported adapter and preserves the baseline workflow', () => {
  for (const resolution of ['1k', '2k']) for (const aspectRatio of ['1:1', '4:3', '3:4', '16:9', '9:16', '4:5']) {
    const base = buildComfyWorkflow({ ...payload, modelKey: 'qwenImage21', resolution, aspectRatio }, 42);
    for (const loraStrength of [0, 0.05, 0.7, 1]) {
      const result = buildComfyWorkflow({ ...payload, resolution, aspectRatio, loraStrength }, 42);
      assert.equal(result.meta.loraStrength, loraStrength);
      assert.deepEqual(result.workflow['600'], { class_type: 'LoraLoaderModelOnly', inputs: {
        model: ['459:451', 0], lora_name: 'chatrlabs__Qwen-Image-21-Uncensored-Omni-LoRA-v01__chatrlabs-omni-lora-v0.1-bf16.safetensors', strength_model: loraStrength } });
      assert.deepEqual(result.workflow['459:480'].inputs.model, ['600', 0]);
      delete result.workflow['600'];
      result.workflow['459:480'].inputs.model = ['459:451', 0];
      assert.deepEqual(result.workflow, base.workflow);
    }
  }
  assert.equal(buildComfyWorkflow(payload, 42).meta.loraStrength, 1);
});
test('invalid Omni strengths are rejected before submission', async () => {
  for (const loraStrength of [-0.05, 1.05, 0.333, '', '0.7', null, true, NaN]) {
    await assert.rejects(submitComfyJob({ payload: { ...payload, loraStrength, requestId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' },
      store: { claim: () => assert.fail('must not claim') }, fetchImpl: () => assert.fail('must not submit') }), /強度/);
  }
});

test('Omni quota ignores v1.3b and different strengths, and rejects a mismatched workflow', async () => {
  const { readComfyQuota } = require('../src/comfyQuota');
  const requests = [{ ...payload, loraStrength: 0.55 }, { ...payload, loraStrength: 1 },
    { ...payload, modelKey: 'qwenImage21Lora', loraStrength: 0.7 }];
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
        if (mismatch) workflow['600'].inputs.lora_name = 'unexpected.safetensors';
        body = { format: 'api', workflow };
      } else body = { id: jobId, status: 'succeeded', metrics: { execution_ms: 10000 }, outputs: [{ type: 'image', node_id: '461' }] };
    }
    return { ok: true, json: async () => body };
  };
  const options = { apiKey: 'fixture', fetchImpl, records };
  for (const request of requests) assert.equal((await readComfyQuota({ ...options, payload: request })).sampleCount, 3);
  mismatch = true;
  assert.equal((await readComfyQuota({ ...options, payload: requests[0] })).sampleCount, 0);
});
