const test = require('node:test');
const assert = require('node:assert/strict');
const { buildUpscaleWorkflow, imageWorkspaceOperation } = require('../src/comfyImageWorkspace');
const { buildComfyWorkflow } = require('../src/comfyCloud');
const id = '11111111-1111-4111-8111-111111111111';
const sourceId = '22222222-2222-4222-8222-222222222222';
const assetId = '33333333-3333-4333-8333-333333333333';
test('fixed SeedVR2 graph keeps original aspect, seed and output; bounds large images', () => {
  const source = { width: 720, height: 1280, assetId };
  const graph = buildUpscaleWorkflow(source, 2, 19);
  assert.equal(graph['57'].inputs['resize_type.multiplier'], 2);
  assert.equal(graph['54'].inputs.seed, 19);
  assert.equal(graph['9'].class_type, 'SaveImage');
  assert.equal(graph['1'].inputs.image.info.id, assetId);
  assert.equal(source.width, 720);
  assert.throws(() => buildUpscaleWorkflow({ ...source, width: 4096, height: 4096 }, 4));
  assert.throws(() => buildUpscaleWorkflow(source, 3));
});
test('specified image seed is honored and out-of-range seeds rejected', () => {
  const payload = { modelKey: 'zImageTurbo', prompt: 'portrait', count: 1, resolution: '1k', aspectRatio: '9:16', seed: 123 };
  assert.equal(buildComfyWorkflow(payload).meta.seed, 123);
  assert.throws(() => buildComfyWorkflow({ ...payload, seed: -1 }));
  assert.throws(() => buildComfyWorkflow({ ...payload, seed: 1.5 }));
});
function storeFixture() {
  const data = new Map([[sourceId, { kind: 'source', assetId, width: 720, height: 1280 }]]);
  return { data, get: async id => data.get(id), claim: async (id, value) => { if (data.has(id)) return { claimed: false }; data.set(id, value); return { claimed: true }; }, update: async (id, patch) => data.set(id, { ...data.get(id), ...patch }) };
}
test('lost upscale response claims before submit and retries are query-only', async () => {
  const store = storeFixture(); let calls = 0;
  const args = { apiKey: 'secret', payload: { action: 'submit', requestId: id, sourceId, scale: 2 }, store, fetchImpl: async () => { calls++; throw new Error('network'); } };
  await assert.rejects(imageWorkspaceOperation(args), /network/);
  assert.equal(store.data.get(id).phase, 'uncertain');
  assert.equal((await imageWorkspaceOperation(args)).status, 'uncertain'); assert.equal(calls, 1);
});
test('upscale source is scoped to owner store and cancel never sends new generation', async () => {
  const store = storeFixture(); let calls = 0;
  await assert.rejects(imageWorkspaceOperation({ apiKey: 'secret', store, payload: { action: 'submit', requestId: id, sourceId: assetId, scale: 2 }, fetchImpl: async () => calls++ }), /來源圖片/);
  assert.equal(calls, 0);
  store.data.set(id, { jobId: assetId });
  const result = await imageWorkspaceOperation({ apiKey: 'secret', store, imageStore: store, payload: { action: 'cancel', requestId: id }, fetchImpl: async (url, options) => {
    assert.match(url, /\/cancel$/); assert.equal(options.method, 'POST'); calls++;
    return { ok: true, json: async () => ({ status: 'canceling' }) };
  } });
  assert.equal(result.status, 'canceling'); assert.equal(calls, 1);
});
test('completed upscale resolves only the final image and repeat submit never posts again', async () => {
  const store = storeFixture(), methods = [];
  const args = { apiKey: 'secret', store, payload: { action: 'submit', requestId: id, sourceId, scale: 2 }, fetchImpl: async (url, options) => {
    methods.push(options.method || 'GET');
    return { ok: true, json: async () => url.includes('/assets/')
      ? { id: assetId, url: 'https://cdn.example/image.png', content_type: 'image/png' }
      : { id: assetId, status: 'succeeded', outputs: [{ node_id: '9', type: 'image', id: assetId }] } };
  } };
  const first = await imageWorkspaceOperation(args), repeat = await imageWorkspaceOperation(args);
  assert.equal(first.images[0].assetId, assetId); assert.equal(repeat.images[0].assetId, assetId);
  assert.equal(first.meta.width, 1440); assert.equal(first.meta.height, 2560);
  assert.deepEqual(methods, ['POST', 'GET', 'GET', 'GET']);
});
