const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildComfyWorkflow, parseComfyJob, submitComfyJob } = require('../src/comfyCloud');
const { readComfyQuota, createQuotaReader } = require('../src/comfyQuota');

const ratios = ['1:1', '4:3', '3:4', '16:9', '9:16', '4:5'];
const source = 'A red mug on a table.\nExact lettering: DLL.\n--ar 4:5';
const payload = modelKey => ({ modelKey, prompt: source, count: 1, resolution: '1k', aspectRatio: '1:1' });

test('partner submissions forward only the server credential and duplicates never resubmit', async () => {
  for (const modelKey of ['ideogram45', 'seedream5Pro', 'zImageTurboInt8', 'krea2Medium', 'krea2MediumTurbo', 'krea2Large']) {
    let record; const calls = [];
    const store = {
      claim: async (_, value) => { if (record) return { claimed: false }; record = value; return { claimed: true }; },
      update: async (_, value) => { record = { ...record, ...value }; },
      get: async () => record,
    };
    const apiKey = 'server-only-fixture-key';
    const fetchImpl = async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => ({ id: 'fixture-job', status: 'queued', urls: { self: '/api/v2/jobs/fixture-job' } }) };
    };
    const request = { apiKey, payload: { ...payload(modelKey), requestId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', extra_data: { api_key_comfy_org: 'untrusted-client-key' } }, store, fetchImpl };
    const result = await submitComfyJob(request);
    await submitComfyJob(request);
    assert.deepEqual(calls.map(c => c.options.method), ['POST', 'GET']);
    const body = JSON.parse(calls[0].options.body);
    assert.deepEqual(body.extra_data, modelKey === 'zImageTurboInt8' ? undefined : { api_key_comfy_org: apiKey });
    assert.ok(!JSON.stringify(body.workflow).includes(apiKey));
    assert.ok(!JSON.stringify(record).includes(apiKey));
    assert.ok(!JSON.stringify(result).includes(apiKey));
  }
});

test('partner credential is redacted if an upstream failure echoes it', async () => {
  const apiKey = 'server-only-fixture-key';
  const store = { claim: async () => ({ claimed: true }), update: async () => {} };
  const request = { apiKey, payload: { ...payload('ideogram45'), requestId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }, store };
  await assert.rejects(submitComfyJob({ ...request, fetchImpl: async () => ({
    ok: false, status: 422, json: async () => ({ error: { message: `rejected ${apiKey}` } }),
  }) }), error => !error.message.includes(apiKey) && error.message.includes('[redacted]'));
  const result = await submitComfyJob({ ...request, fetchImpl: async () => ({
    ok: true, json: async () => ({ id: 'fixture-job', status: 'failed', error: { message: `rejected ${apiKey}` } }),
  }) });
  assert.deepEqual(result.errors, ['rejected [redacted]']);
});

test('INT8 keeps the selected prompt, quantized model files and original sampler', () => {
  const { workflow: w, meta } = buildComfyWorkflow(payload('zImageTurboInt8'), 123);
  assert.equal(w['57:28'].inputs.unet_name, 'z_image_turbo_int8_convrot.safetensors');
  assert.equal(w['57:30'].inputs.clip_name, 'qwen_3_4b_fp8_mixed.safetensors');
  assert.equal(w['57:27'].inputs.text, source);
  assert.equal(w['57:3'].inputs.steps, 8);
  assert.equal(w['57:3'].inputs.sampler_name, 'res_multistep');
  assert.equal(w['57:3'].inputs.seed, 123);
  assert.equal(Object.keys(w).length, 10);
  assert.equal(meta.width, 1024);
});

test('partner models map all DLL ratios and resolutions to valid explicit sizes and bounded seeds', () => {
  for (const modelKey of ['ideogram45', 'seedream5Pro']) {
    for (const resolution of ['1k', '2k']) for (const aspectRatio of ratios) {
      const { workflow: w, meta } = buildComfyWorkflow({ ...payload(modelKey), resolution, aspectRatio }, 2147483647);
      assert.ok(meta.width * meta.height >= 921600 && meta.width * meta.height <= 4624220);
      if (modelKey === 'ideogram45') {
        const i = w['1'].inputs;
        assert.equal(i['model.prompt'], source);
        assert.equal(i['model.magic_prompt'], 'off');
        assert.equal(i['model.quality'], 'medium');
        assert.equal(i['model.size'], `(${resolution.toUpperCase()}) ${meta.width}x${meta.height} (${aspectRatio})`);
        assert.equal(i['model.seed'], 2147483647);
      } else {
        const i = w['3'].inputs;
        assert.equal(i.prompt, source);
        assert.equal(i['model.thinking'], false);
        assert.equal(i['model.watermark'], false);
        assert.equal(i['model.width'], aspectRatio === '4:5' ? meta.width : 1024);
        assert.equal(i['model.height'], aspectRatio === '4:5' ? meta.height : 1024);
        assert.ok(i['model.width'] >= 1024 && i['model.height'] >= 1024);
        assert.equal(i['model.size_preset'], aspectRatio === '4:5' ? 'Custom' : `(${resolution.toUpperCase()}) ${meta.width}x${meta.height} (${aspectRatio})`);
        assert.equal(i['model.seed'], 2147483647);
      }
    }
    assert.throws(() => buildComfyWorkflow(payload(modelKey), 2147483648), /Seed/);
    assert.throws(() => buildComfyWorkflow(payload(modelKey), -1), /Seed/);
    for (let i = 0; i < 30; i++) assert.ok(buildComfyWorkflow(payload(modelKey)).meta.seed <= 2147483647);
  }
});

test('Ideogram rejects excessive prompt before submitting; existing models retain 30K limit', () => {
  assert.throws(() => buildComfyWorkflow({ ...payload('ideogram45'), prompt: 'x'.repeat(10001) }), /10000/);
  assert.doesNotThrow(() => buildComfyWorkflow({ ...payload('zImageTurbo'), prompt: 'x'.repeat(10001) }, 1));
});

test('final image filtering uses each model SaveImage and ignores partner text outputs', () => {
  for (const [modelKey, node] of [['zImageTurboInt8', '9'], ['ideogram45', '5'], ['seedream5Pro', '2'],
    ['krea2Medium', '2'], ['krea2MediumTurbo', '2'], ['krea2Large', '2']]) {
    const result = parseComfyJob({ id: 'job', status: 'succeeded', outputs: [
      { id: 'image', node_id: node, type: 'image', content_type: '' },
      { id: 'text', node_id: '1', type: 'text' },
      { id: 'other', node_id: '461', type: 'image' },
    ] }, { modelKey });
    assert.deepEqual(result.images.map(i => i.assetId), ['image']);
  }
});

test('partner quota reads balance without guessing GPU-only cost or requesting history', async () => {
  for (const modelKey of ['ideogram45', 'seedream5Pro', 'krea2Medium', 'krea2MediumTurbo', 'krea2Large']) {
    const calls = [];
    const r = await createQuotaReader()({ uid: 'fixture', apiKey: 'fixture', payload: payload(modelKey),
      listRecords: async () => { throw Error('partner model must not read GPU history'); }, fetchImpl: async url => {
      calls.push(url); return { ok: true, json: async () => ({ summary: { balance: { currency: 'USD', amount_micros: 100 } } }) };
    } });
    assert.equal(r.credits, 211);
    assert.equal(r.estimatedImages, null);
    assert.equal(r.estimateUnavailableReason, 'partnerPricing');
    assert.equal(calls.length, 1);
  }
});

test('INT8 estimates use only INT8 records and exact quantized workflow samples', async () => {
  const ids = Array.from({ length: 3 }, (_, i) => `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee${i}`);
  const built = buildComfyWorkflow(payload('zImageTurboInt8'), 42);
  const records = ids.map(jobId => ({ jobId, meta: built.meta }));
  const original = buildComfyWorkflow(payload('zImageTurbo'), 42);
  let oldTemplate = false;
  const calls = [];
  const fetchImpl = async url => {
    calls.push(url);
    const data = url.includes('/billing/') ? { summary: { balance: { currency: 'USD', amount_micros: 100 } } }
      : url.endsWith('/workflow') ? { format: 'api', workflow: oldTemplate ? original.workflow : built.workflow }
        : { id: url.split('/').pop(), status: 'succeeded', metrics: { execution_ms: 10000 }, outputs: [{ type: 'image', node_id: '9' }] };
    return { ok: true, json: async () => data };
  };
  const request = { apiKey: 'fixture', payload: payload('zImageTurboInt8'), records, fetchImpl };
  const valid = await readComfyQuota(request);
  assert.equal(valid.sampleCount, 3);
  assert.equal(valid.estimatedImages, Math.floor(211 / 2.66));
  oldTemplate = true;
  assert.equal((await readComfyQuota(request)).sampleCount, 0);
  calls.length = 0;
  assert.equal((await readComfyQuota({ ...request, records: records.map(r => ({ ...r, meta: original.meta })) })).sampleCount, 0);
  assert.equal(calls.length, 1);
});

test('adding models preserves old Z and Qwen deterministic workflows and metadata', () => {
  // Freeze original workflows by projecting the same payload onto existing templates.
  for (const [key, textNode, textKey, latent, sampler] of [
    ['zImageTurbo', '57:27', 'text', '57:13', '57:3'],
    ['qwenImage21', '459:452', 'prompt', '459:456', '459:458'],
  ]) {
    const old = structuredClone(require(`../src/comfyWorkflows/${key}.json`));
    old[textNode].inputs[textKey] = source;
    old[latent].inputs.width = 1024; old[latent].inputs.height = 1024;
    old[sampler].inputs.seed = 42;
    assert.deepEqual(buildComfyWorkflow(payload(key), 42), { workflow: old, meta: {
      modelKey: key, aspectRatio: '1:1', resolution: '1k', width: 1024, height: 1024, seed: 42,
    } });
  }
});
