const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildComfyWorkflow, submitComfyJob, parseComfyJob } = require('../src/comfyCloud');
const { readComfyQuota, createQuotaReader } = require('../src/comfyQuota');
const input = (loraStrength = 0.7) => ({ modelKey: 'qwenImage21Lora', loraStrength,
  prompt: 'A blue ceramic cup in soft window light.', resolution: '1k', aspectRatio: '1:1', count: 1 });
const ids = Array.from({ length: 9 }, (_, i) => `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee${i}`);

test('Qwen v1.3b adds only the verified adapter, retaining cache, direct prompt, sampling and output', () => {
  for (const resolution of ['1k', '2k']) for (const aspectRatio of ['1:1', '4:3', '3:4', '16:9', '9:16', '4:5']) {
    const request = { ...input(), resolution, aspectRatio };
    const base = buildComfyWorkflow({ ...request, modelKey: 'qwenImage21', loraStrength: undefined }, 42);
    for (const strength of [0, 0.05, 0.7, 1]) {
      const { workflow, meta } = buildComfyWorkflow({ ...request, loraStrength: strength }, 42);
      assert.equal(meta.loraStrength, strength);
      assert.deepEqual(workflow['600'], { class_type: 'LoraLoaderModelOnly', inputs: {
        model: ['459:451', 0],
        lora_name: 'qwen2_1-femaledVaginus-nsfw-v1_3-fine_L22-31.safetensors', strength_model: strength } });
      assert.deepEqual(workflow['459:480'].inputs.model, ['600', 0]);
      assert.deepEqual(['steps', 'cfg', 'sampler_name', 'scheduler'].map(k => workflow['459:458'].inputs[k]),
        [25, 1, 'euler', 'simple']);
      delete workflow['600'];
      workflow['459:480'].inputs.model = ['459:451', 0];
      assert.deepEqual(workflow, base.workflow);
    }
  }
  const request = input(); delete request.loraStrength;
  assert.equal(buildComfyWorkflow(request, 42).meta.loraStrength, 0.7);
  assert.equal(buildComfyWorkflow(input(), 42).workflow['600'].inputs.strength_model, 0.7);
  const parsed = parseComfyJob({ id: ids[0], status: 'succeeded', outputs: [
    { type: 'image', node_id: '461', id: 'correct', content_type: 'image/png' },
    { type: 'image', node_id: '9', id: 'unrelated' },
  ] }, buildComfyWorkflow(input(), 42).meta);
  assert.deepEqual(parsed.images.map(i => i.assetId), ['correct']);
});

test('Qwen rejects invalid strengths before claim/payment and ignores client graph overrides', async () => {
  for (const loraStrength of [-0.05, 1.05, 0.333, '', '0.7', null, true, NaN, Infinity]) {
    await assert.rejects(submitComfyJob({ payload: { ...input(loraStrength), requestId: ids[0] },
      store: { claim: () => assert.fail('must not claim') }, fetchImpl: () => assert.fail('must not submit') }), /強度/);
  }
  assert.throws(() => buildComfyWorkflow({ ...input(), modelKey: 'qwenImage21' }, 42), /強度/);
  assert.deepEqual(buildComfyWorkflow({ ...input(), lora_name: 'other', workflow: {}, steps: 8, cfg: 5 }, 42),
    buildComfyWorkflow(input(), 42));
});

test('Qwen repeated request ID preserves original strength without resubmission', async () => {
  let record; const methods = [];
  const store = { claim: async (_, data) => {
    if (record) return { claimed: false }; record = data; return { claimed: true };
  }, get: async () => record, update: async (_, patch) => { record = { ...record, ...patch }; } };
  const fetchImpl = async (_, options) => {
    methods.push(options.method);
    if (options.method === 'POST') assert.equal(JSON.parse(options.body).workflow['600'].inputs.strength_model, 0.55);
    return { ok: true, json: async () => ({ id: ids[1], status: 'queued' }) };
  };
  const options = { apiKey: 'fixture', store, fetchImpl };
  await submitComfyJob({ ...options, payload: { ...input(0.55), requestId: ids[0] } });
  const again = await submitComfyJob({ ...options, payload: { ...input(1), requestId: ids[0] } });
  assert.equal(again.meta.loraStrength, 0.55);
  assert.deepEqual(methods, ['POST', 'GET']);
});

test('Qwen quota isolates base, adapter strength and cache; mismatched graphs cannot supply estimates', async () => {
  const requests = [{ ...input(), modelKey: 'qwenImage21', loraStrength: undefined }, input(0.7), input(1)];
  const builds = requests.map(request => buildComfyWorkflow(request, 42));
  const records = ids.map((jobId, i) => ({ jobId, meta: builds[Math.floor(i / 3)].meta }));
  let mismatched = false; let billingReads = 0;
  const fetchImpl = async url => {
    let body;
    if (url.includes('/billing/')) { billingReads++; body = { summary: { balance: { currency: 'USD', amount_micros: 100 } } }; }
    else {
      const jobId = url.split('/').at(url.endsWith('/workflow') ? -2 : -1);
      const group = Math.floor(ids.indexOf(jobId) / 3);
      if (url.endsWith('/workflow')) {
        const workflow = structuredClone(builds[group].workflow);
        if (mismatched && workflow['600']) workflow['600'].inputs.strength_model = 0.25;
        body = { format: 'api', workflow };
      } else body = { id: jobId, status: 'succeeded', metrics: { execution_ms: (group + 1) * 10000 },
        outputs: [{ type: 'image', node_id: '461' }] };
    }
    return { ok: true, json: async () => body };
  };
  const options = { uid: 'fixture', apiKey: 'fixture', fetchImpl, records, listRecords: async () => records };
  const read = createQuotaReader({ now: () => 1 });
  const results = await Promise.all([...requests, ...requests].map(payload => read({ ...options, payload })));
  assert.equal(billingReads, 3);
  for (let i = 0; i < 3; i++) assert.equal(results[i], results[i + 3]);
  assert.deepEqual(results.slice(0, 3).map(r => [r.sampleCount, r.creditsPerImage]), [[3, 2.66], [3, 5.32], [3, 7.98]]);
  mismatched = true;
  assert.equal((await readComfyQuota({ ...options, payload: input() })).sampleCount, 0);
});
