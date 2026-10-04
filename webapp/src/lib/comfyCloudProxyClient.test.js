import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateComfyViaFirebase, readComfyPending, formatComfyProgress } from './comfyCloudProxyClient.js';
import { generateDllPicImages, isDllPicAspectRatioSupported } from './dllPicProClient.js';
function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}
const payload = { modelKey: 'qwenImage21', prompt: 'A portrait\n--ar 4:5', count: 1, aspectRatio: '4:5', resolution: '2k' };

test('submit → queue → run → success keeps original source and clears completed tracking', async () => {
  const store = storage(); const calls = []; const progress = [];
  const jobs = [{ status: 'queued', queuePosition: 2 }, { status: 'running' }, { status: 'succeeded', images: [{ src: 'https://image.example/1.png', mimeType: 'image/png' }], errors: [] }];
  const session = { uid: 'user1', call: async (name, input) => { calls.push({ name, input }); return jobs.shift(); } };
  const result = await generateComfyViaFirebase(payload, { session, storage: store, sleep: async () => {}, onProgress: (job) => progress.push(job.status) });
  assert.deepEqual(progress, ['queued', 'running', 'succeeded']);
  assert.deepEqual(calls.map((call) => call.name), ['comfyCloudSubmit', 'comfyCloudStatus', 'comfyCloudStatus']);
  assert.equal(calls[0].input.prompt, payload.prompt); assert.equal(calls[0].input.aspectRatio, '4:5');
  assert.equal(calls[1].input.requestId, calls[0].input.requestId);
  assert.equal(readComfyPending(store), null); assert.equal(result.images.length, 1);
  assert.match(formatComfyProgress({ status: 'queued', queuePosition: 2 }), /2/);
});

test('network loss and wait timeout preserve request for query-only recovery and account isolation', async () => {
  const store = storage(); const names = [];
  const session = { uid: 'user1', call: async (name) => { names.push(name); throw new Error('network loss'); } };
  await assert.rejects(generateComfyViaFirebase(payload, { session, storage: store }), /network loss/);
  assert.ok(readComfyPending(store));
  session.call = async (name) => { names.push(name); return { status: 'queued' }; };
  await assert.rejects(generateComfyViaFirebase({}, { session, storage: store, resume: true, maxPolls: 0 }), /逾時/);
  assert.deepEqual(names, ['comfyCloudSubmit', 'comfyCloudStatus']);
  await assert.rejects(generateComfyViaFirebase({}, { session: { ...session, uid: 'other' }, storage: store, resume: true }), /另一個/);
  session.call = async () => ({ status: 'failed', errors: ['Node error'] });
  await assert.rejects(generateComfyViaFirebase({}, { session, storage: store, resume: true }), /Node error/);
  assert.equal(readComfyPending(store), null);
});

test('DLL routes both new models through authenticated proxy with one image and retains result metadata', async () => {
  for (const modelKey of ['comfyZImageTurbo', 'comfyQwenImage21']) {
    let request;
    const result = await generateDllPicImages({ modelKey, prompt: payload.prompt, count: 4, aspectRatio: '4:5', resolution: '2k', comfyGenerate: async (input) => { request = input; return { images: [{ src: 'https://image.example/1.png', mimeType: 'image/png' }], errors: [], meta: { seed: 123 } }; } });
    assert.equal(request.count, 1); assert.equal(request.prompt, payload.prompt);
    assert.equal(request.modelKey, modelKey === 'comfyZImageTurbo' ? 'zImageTurbo' : 'qwenImage21');
    assert.equal(result.meta.seed, 123); assert.equal(isDllPicAspectRatioSupported(modelKey, '4:5'), true);
  }
  assert.equal(isDllPicAspectRatioSupported('xaiGrokImagineQuality', '4:5'), false);
});

test('unavailable persistent storage prevents a paid submission', async () => {
  let called = false;
  await assert.rejects(generateComfyViaFirebase(payload, { storage: null, session: { uid: 'user1', call: async () => { called = true; } } }), /儲存空間/);
  assert.equal(called, false);
});
