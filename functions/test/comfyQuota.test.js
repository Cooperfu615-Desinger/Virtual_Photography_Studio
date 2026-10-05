const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildComfyWorkflow } = require('../src/comfyCloud');
const { balanceCredits, readComfyQuota, createQuotaReader } = require('../src/comfyQuota');
const payload = { modelKey: 'zImageTurbo', resolution: '1k', aspectRatio: '9:16' };
const built = buildComfyWorkflow({ ...payload, prompt: 'different prompt', count: 1 }, 123);
const ids = Array.from({ length: 3 }, (_, i) => `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee${i}`);
const records = ids.map(jobId => ({ jobId, meta: built.meta }));
const ok = data => ({ ok: true, json: async () => data });
function fake({ balance = { amount_micros: 100, currency: 'USD' }, ms = 10000, mutate = () => {} } = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('/billing/')) return ok({ summary: { balance } });
    if (url.endsWith('/workflow')) {
      const workflow = structuredClone(built.workflow); mutate(workflow);
      return ok({ format: 'api', workflow });
    }
    return ok({ id: url.split('/').pop(), status: 'succeeded', metrics: { execution_ms: ms, queue_ms: 9999999 }, outputs: [{ type: 'image', node_id: '9' }] });
  };
  return { calls, fetchImpl };
}
test('balance uses cents and USD conversion; absent, null, NaN and other currencies are unavailable', () => {
  assert.equal(balanceCredits({ summary: { balance: { amount_micros: 100, currency: 'USD' } } }), 211);
  assert.equal(balanceCredits({ summary: { balance: { amount_micros: 0, currency: 'USD' } } }), 0);
  for (const balance of [null, {}, { amount_micros: null, currency: 'USD' }, { amount_micros: NaN, currency: 'USD' }, { amount_micros: 100, currency: 'EUR' }]) assert.equal(balanceCredits({ summary: { balance } }), null);
});
test('estimate uses successful execution only, excludes duplicate IDs and never sends paid POST', async () => {
  const f = fake();
  const result = await readComfyQuota({ apiKey: 'test-key', payload, records: [...records, records[0]], ...f, now: () => 123 });
  assert.equal(result.sampleCount, 3); assert.equal(result.estimatedImages, Math.floor(211 / 2.66));
  assert.equal(result.checkedAt, 123); assert.equal(result.creditsPerImage, 2.66);
  assert.ok(f.calls.every(c => c.options.method === 'GET' && c.options.redirect === 'error'));
  assert.equal(f.calls[0].options.headers['X-API-Key'], 'test-key');
  assert.equal(f.calls[1].options.headers.Authorization, 'Bearer test-key');
});
test('requires 3 samples and exact model, resolution and ratio', async () => {
  const mixed = [...records.slice(0, 2), { ...records[2], meta: { ...built.meta, resolution: '2k' } }];
  const result = await readComfyQuota({ apiKey: 'key', payload, records: mixed, ...fake() });
  assert.equal(result.sampleCount, 2); assert.equal(result.estimatedImages, null);
});
test('changed sampler or extra LoRA invalidates samples, prompt and seed differences are allowed', async () => {
  for (const mutate of [w => { w['57:3'].inputs.steps = 20; }, w => { w.extra = { class_type: 'LoraLoader', inputs: {} }; }]) {
    const r = await readComfyQuota({ apiKey: 'key', payload, records, ...fake({ mutate }) });
    assert.equal(r.sampleCount, 0); assert.equal(r.estimatedImages, null);
  }
});
test('missing or invalid execution metrics cannot use queue time as fallback', async () => {
  for (const ms of [null, 0, -1, Infinity]) {
    const r = await readComfyQuota({ apiKey: 'key', payload, records, ...fake({ ms }) });
    assert.equal(r.estimatedImages, null);
  }
});
test('missing balance stays unavailable; negative balance yields zero capacity', async () => {
  const missing = await readComfyQuota({ apiKey: 'key', payload, records, ...fake({ balance: null }) });
  assert.equal(missing.credits, null); assert.equal(missing.estimatedImages, null);
  const negative = await readComfyQuota({ apiKey: 'key', payload, records, ...fake({ balance: { amount_micros: -1, currency: 'USD' } }) });
  assert.equal(negative.estimatedImages, 0);
});
test('sample errors retain balance but do not yield biased estimate; upstream error body is never exposed', async () => {
  const f = fake();
  const r = await readComfyQuota({ apiKey: 'key', payload, records, fetchImpl: (url, opts) => url.includes('/billing/') ? f.fetchImpl(url, opts) : Promise.reject(new Error('secret')) });
  assert.equal(r.credits, 211); assert.equal(r.sampleReadFailed, true); assert.equal(r.estimatedImages, null);
  await assert.rejects(readComfyQuota({ apiKey: 'key', payload, records, fetchImpl: async () => ({ ok: false, status: 403, json: async () => ({ secret: 'secret' }) }) }), /^Error: Comfy Cloud 查詢失敗（HTTP 403）$/);
});
test('cache coalesces, expires and isolates users, settings and rotated keys', async () => {
  let time = 100; let reads = 0;
  const reader = createQuotaReader({ now: () => time });
  const args = { uid: 'u1', apiKey: 'key', payload, listRecords: async () => { reads++; return []; }, ...fake() };
  await Promise.all([reader(args), reader(args)]); assert.equal(reads, 1);
  await reader({ ...args, uid: 'u2' }); await reader({ ...args, apiKey: 'new-key' });
  await reader({ ...args, payload: { ...payload, resolution: '2k' } }); assert.equal(reads, 4);
  time += 30001; await reader(args); assert.equal(reads, 5);
});
test('unsupported input fails before network or datastore reads', async () => {
  await assert.rejects(readComfyQuota({ apiKey: 'key', payload: {}, records: [], fetchImpl: () => { throw Error('network should not run'); } }), /不支援/);
});
