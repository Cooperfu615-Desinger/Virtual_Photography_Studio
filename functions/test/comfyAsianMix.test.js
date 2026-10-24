const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildComfyWorkflow, submitComfyJob } = require('../src/comfyCloud');
const { readComfyQuota, createQuotaReader } = require('../src/comfyQuota');
const input = (loraStrength = 1) => ({ modelKey: 'zImageTurboAsianMix', loraStrength,
  prompt: 'A fully clothed adult asian woman at a cafe.', resolution: '1k', aspectRatio: '1:1', count: 1 });
const ids = Array.from({ length: 6 }, (_, i) => `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee${i}`);

test('Asian Mix adds only the verified adapter to BF16 and preserves direct prompt and sampling', () => {
  const base = buildComfyWorkflow({ ...input(), modelKey: 'zImageTurbo', loraStrength: undefined }, 42);
  for (const strength of [0, 0.05, 0.3, 0.55, 1]) {
    const { workflow, meta } = buildComfyWorkflow(input(strength), 42);
    assert.equal(meta.loraStrength, strength);
    assert.deepEqual(workflow['60'], { class_type: 'LoraLoaderModelOnly', inputs: {
      model: ['57:28', 0], lora_name: 'hina_zImageTurbo_asianMix_v7.0-R-rev1_fp32.safetensors', strength_model: strength } });
    assert.deepEqual(workflow['57:11'].inputs.model, ['60', 0]);
    delete workflow['60'];
    workflow['57:11'].inputs.model = ['57:28', 0];
    assert.deepEqual(workflow, base.workflow);
  }
  const request = input(); delete request.loraStrength;
  assert.equal(buildComfyWorkflow(request, 42).meta.loraStrength, 1);
  assert.equal(buildComfyWorkflow(input(), 42).workflow['60'].inputs.strength_model, 1);
});

test('invalid or unsupported strengths fail before claim and paid submission', async () => {
  for (const loraStrength of [-0.05, 1.05, 0.333, '', '0.5', null, true, NaN, Infinity]) {
    await assert.rejects(submitComfyJob({ payload: { ...input(loraStrength), requestId: ids[0] },
      store: { claim: () => assert.fail('must not claim') }, fetchImpl: () => assert.fail('must not submit') }), /強度/);
  }
  for (const modelKey of ['zImageTurbo', 'zImageTurboInt8', 'mossImageSftInt8Lora']) {
    assert.throws(() => buildComfyWorkflow({ ...input(0.5), modelKey }, 42), /強度/);
  }
  const clean = buildComfyWorkflow(input(0.5), 42);
  assert.deepEqual(buildComfyWorkflow({ ...input(0.5), lora_name: 'other', strength_model: 9,
    workflow: {}, steps: 1, extra_data: { api_key_comfy_org: 'untrusted' } }, 42), clean);
});

test('same request ID preserves original adapter strength without a second paid call', async () => {
  let record; const methods = [];
  const store = { claim: async (_, data) => {
    if (record) return { claimed: false }; record = data; return { claimed: true };
  }, get: async () => record, update: async (_, patch) => { record = { ...record, ...patch }; } };
  const fetchImpl = async (_, options) => {
    methods.push(options.method);
    if (options.method === 'POST') {
      const body = JSON.parse(options.body);
      assert.deepEqual(Object.keys(body), ['workflow']);
      assert.equal(body.workflow['60'].inputs.strength_model, 0.55);
    }
    return { ok: true, json: async () => ({ id: ids[1], status: 'queued' }) };
  };
  const options = { apiKey: 'fixture', store, fetchImpl };
  await submitComfyJob({ ...options, payload: { ...input(0.55), requestId: ids[0] } });
  const again = await submitComfyJob({ ...options, payload: { ...input(1), requestId: ids[0] } });
  assert.equal(again.meta.loraStrength, 0.55);
  assert.deepEqual(methods, ['POST', 'GET']);
});

test('quota samples and cache isolate each strength and verify upstream workflow', async () => {
  const builds = [0.5, 1].map(strength => buildComfyWorkflow(input(strength), 42));
  const records = ids.map((jobId, i) => ({ jobId, meta: builds[i < 3 ? 0 : 1].meta }));
  let mismatched = false; let billingReads = 0;
  const fetchImpl = async url => {
    let body;
    if (url.includes('/billing/')) { billingReads++; body = { summary: { balance: { currency: 'USD', amount_micros: 100 } } }; }
    else {
      const jobId = url.split('/').at(url.endsWith('/workflow') ? -2 : -1);
      const group = ids.indexOf(jobId) < 3 ? 0 : 1;
      if (url.endsWith('/workflow')) {
        const workflow = structuredClone(builds[group].workflow);
        if (mismatched) workflow['60'].inputs.strength_model = 0.25;
        body = { format: 'api', workflow };
      } else body = { id: jobId, status: 'succeeded', metrics: { execution_ms: group ? 20000 : 10000 },
        outputs: [{ type: 'image', node_id: '9' }] };
    }
    return { ok: true, json: async () => body };
  };
  const options = { uid: 'fixture', apiKey: 'fixture', fetchImpl, records, listRecords: async () => records };
  const read = createQuotaReader({ now: () => 1 });
  const results = await Promise.all([0.5, 1, 0.5, 1].map(strength => read({ ...options, payload: input(strength) })));
  assert.equal(billingReads, 2);
  assert.equal(results[0], results[2]);
  assert.equal(results[1], results[3]);
  assert.deepEqual(results.slice(0, 2).map(r => [r.selection.loraStrength, r.sampleCount, r.creditsPerImage]),
    [[0.5, 3, 2.66], [1, 3, 5.32]]);
  mismatched = true;
  assert.equal((await readComfyQuota({ ...options, payload: input(0.5) })).sampleCount, 0);
});
