const assert = require('node:assert/strict');
const { test } = require('node:test');
const { buildComfyWorkflow, parseComfyJob, submitComfyJob, readComfyJob } = require('../src/comfyCloud');
const requestId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const payload = { requestId, modelKey: 'zImageTurbo', prompt: 'Exact prompt\n--ar 4:5', aspectRatio: '4:5', count: 1, resolution: '1k' };
const response = (body, status = 201) => ({ ok: status < 400, status, json: async () => body });
function makeStore() {
  const records = new Map();
  return {
    claim: async (id, record) => { if (records.has(id)) return { claimed: false }; records.set(id, record); return { claimed: true }; },
    update: async (id, record) => records.set(id, { ...records.get(id), ...record }),
    get: async (id) => records.get(id),
  };
}

test('both exported workflows retain sampling and model settings, bypass rewriting and LoRA', () => {
  for (const modelKey of ['zImageTurbo', 'qwenImage21']) {
    for (const aspectRatio of ['1:1', '4:3', '3:4', '16:9', '9:16', '4:5']) {
      for (const resolution of ['1k', '2k']) {
        const { workflow, meta } = buildComfyWorkflow({ ...payload, modelKey, aspectRatio, resolution }, 12345);
        const [a, b] = aspectRatio.split(':').map(Number);
        assert.equal(meta.width / meta.height, a / b);
        assert.equal(meta.width % 8, 0); assert.equal(meta.height % 8, 0);
        assert.ok(Math.abs(meta.width * meta.height / (resolution === '2k' ? 4194304 : 1048576) - 1) < 0.13);
        assert.ok(!Object.values(workflow).some((node) => /Lora|TextGenerate|Switch/.test(node.class_type)));
        const z = modelKey === 'zImageTurbo';
        assert.equal(workflow[z ? '57:27' : '459:452'].inputs[z ? 'text' : 'prompt'], payload.prompt);
        assert.equal(workflow[z ? '57:3' : '459:458'].inputs.steps, z ? 8 : 25);
        assert.equal(workflow[z ? '57:3' : '459:458'].inputs.seed, 12345);
        for (const node of Object.values(workflow)) for (const value of Object.values(node.inputs)) {
          if (Array.isArray(value)) assert.ok(workflow[value[0]], `missing link ${value[0]}`);
        }
      }
    }
  }
  assert.throws(() => buildComfyWorkflow({ ...payload, count: 2 }), /一張/);
  assert.throws(() => buildComfyWorkflow({ ...payload, aspectRatio: 'unknown' }), /比例/);
});

test('paid submission has one claim and duplicate requests only query the same job', async () => {
  const store = makeStore(); const calls = [];
  const fetchImpl = async (url, options) => { calls.push({ url, options }); return response({ id: 'job1', status: 'queued', urls: { self: '/api/v2/jobs/job1' } }); };
  const first = await submitComfyJob({ apiKey: 'test-secret', payload, store, fetchImpl });
  await submitComfyJob({ apiKey: 'test-secret', payload, store, fetchImpl });
  assert.equal(first.jobId, 'job1');
  assert.deepEqual(calls.map((call) => call.options.method), ['POST', 'GET']);
  assert.equal(calls[0].options.headers['Idempotency-Key'], requestId);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-secret');
  assert.deepEqual(Object.keys(JSON.parse(calls[0].options.body)), ['workflow']);
});

test('lost submission response remains uncertain and never reposts', async () => {
  const store = makeStore(); let calls = 0;
  const fetchImpl = async () => { calls += 1; throw new Error('timeout'); };
  await assert.rejects(submitComfyJob({ apiKey: 'key', payload, store, fetchImpl }), /timeout/);
  const result = await submitComfyJob({ apiKey: 'key', payload, store, fetchImpl });
  assert.equal(result.status, 'uncertain'); assert.equal(calls, 1);
  await assert.rejects(readComfyJob({ apiKey: 'key', requestId, store: makeStore(), fetchImpl }), /找不到/);
});

test('output parsing only returns final image nodes and preserves expiry and diagnostics', () => {
  const output = { type: 'image', node_id: '461', url: 'https://assets.example/image.png', content_type: 'image/png', id: 'asset1', url_expires_at: '2026-10-05T00:00:00Z' };
  const result = parseComfyJob({ id: 'job1', status: 'succeeded', outputs: [output, { ...output, node_id: 'other' }, { ...output, url: 'http://unsafe' }], error: null }, { modelKey: 'qwenImage21' });
  assert.equal(result.images.length, 1); assert.equal(result.images[0].assetId, 'asset1');
  assert.equal(result.images[0].expiresAt, output.url_expires_at);
  assert.equal(parseComfyJob({ id: 'job1', status: 'failed', error: { message: 'Node failed' } }, {}).errors[0], 'Node failed');
});

test('untrusted self links and definitive HTTP errors do not leak credentials or retry', async () => {
  const store = makeStore();
  await assert.rejects(submitComfyJob({ apiKey: 'key', payload, store, fetchImpl: async () => response({ id: 'job1', status: 'queued', urls: { self: 'https://evil.example/jobs/1' } }) }), /任務網址/);
  assert.equal((await store.get(requestId)).phase, 'uncertain');
  assert.equal((await store.get(requestId)).jobId, 'job1');
  const rejectedStore = makeStore();
  await assert.rejects(submitComfyJob({ apiKey: 'key', payload, store: rejectedStore, fetchImpl: async () => response({}, 422) }), /422/);
  assert.equal((await readComfyJob({ apiKey: 'key', requestId, store: rejectedStore })).status, 'rejected');
});

test('expired jobs finish tracking and GET uses only the stored provider job', async () => {
  const store = makeStore();
  await store.claim(requestId, { jobId: 'job1', self: 'https://cloud.comfy.org/api/v2/jobs/job1', meta: { seed: 7 } });
  const result = await readComfyJob({ apiKey: 'key', requestId, store, fetchImpl: async () => response({}, 410) });
  assert.equal(result.status, 'expired'); assert.equal(result.meta.seed, 7);
  await assert.rejects(readComfyJob({ apiKey: 'key', requestId, store, fetchImpl: async () => response({ id: 'other', status: 'queued' }) }), /ID 不一致/);
});
