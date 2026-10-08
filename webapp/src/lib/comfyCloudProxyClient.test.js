import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateComfyViaFirebase, readComfyPending, clearComfyPending, formatComfyProgress } from './comfyCloudProxyClient.js';
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

test('DLL routes both models through the proxy with a bounded sequence count and retains metadata', async () => {
  for (const modelKey of ['comfyZImageTurbo', 'comfyQwenImage21']) {
    let request;
    const result = await generateDllPicImages({ modelKey, prompt: payload.prompt, count: 4, aspectRatio: '4:5', resolution: '2k', comfyGenerate: async (input) => { request = input; return { images: [{ src: 'https://image.example/1.png', mimeType: 'image/png' }], errors: [], meta: { seed: 123 } }; } });
    assert.equal(request.count, 2); assert.equal(request.prompt, payload.prompt);
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

test('a completed job without an image retains tracking and recovers with query only', async () => {
  const store = storage(); const names = [];
  const session = { uid: 'user1', call: async (name) => {
    names.push(name); return { status: 'succeeded', images: [] };
  } };
  await assert.rejects(generateComfyViaFirebase(payload, { session, storage: store }), /最終圖像/);
  const pending = readComfyPending(store);
  assert.ok(pending);
  session.call = async (name, input) => {
    names.push(name); assert.equal(input.requestId, pending.requestId);
    return { status: 'succeeded', images: [{ src: 'https://image.example/recovered.png', mimeType: 'image/png' }] };
  };
  const result = await generateComfyViaFirebase({}, { session, storage: store, resume: true });
  assert.equal(result.images.length, 1);
  assert.deepEqual(names, ['comfyCloudSubmit', 'comfyCloudStatus']);
  assert.equal(readComfyPending(store), null);
});

const imageJob = (index) => ({ status: 'succeeded', images: [{ src: `https://image.example/${index}.png`, mimeType: 'image/png' }], errors: [], meta: { provider: 'comfyCloud', seed: index } });

test('two images submit separate single-image jobs only after the first image is received and saved', async () => {
  const store = storage(); const order = []; const ids = [];
  const session = { uid: 'user1', call: async (name, input) => {
    assert.equal(name, 'comfyCloudSubmit'); assert.equal(input.count, 1);
    const pending = readComfyPending(store);
    if (ids.length) assert.equal(pending.items[0].state, 'succeeded');
    ids.push(input.requestId); order.push(`submit${ids.length}`);
    return imageJob(ids.length);
  } };
  const result = await generateComfyViaFirebase({ ...payload, count: 2 }, {
    session, storage: store, onImages: async (images) => { order.push(`images${images.length}`); },
  });
  assert.deepEqual(order, ['submit1', 'images1', 'submit2', 'images2']);
  assert.notEqual(ids[0], ids[1]); assert.equal(result.images.length, 2);
  assert.equal(result.meta.requestedCount, 2); assert.equal(readComfyPending(store), null);
});

test('second submission with a lost response retains the first image and resumes by querying only', async () => {
  const store = storage(); const calls = []; const ids = [];
  const session = { uid: 'user1', call: async (name, input) => {
    calls.push(name); ids.push(input.requestId);
    if (ids.length === 1) return imageJob(1);
    throw new Error('lost second response');
  } };
  await assert.rejects(generateComfyViaFirebase({ ...payload, count: 2 }, { session, storage: store }), (error) => {
    assert.equal(error.images.length, 1); return /lost second/.test(error.message);
  });
  const pending = readComfyPending(store);
  assert.deepEqual(pending.items.map(item => item.state), ['succeeded', 'attempted']);
  assert.equal(JSON.stringify(pending).includes(payload.prompt), false);
  assert.equal(JSON.stringify(pending).includes('https://image'), false);
  session.call = async (name, input) => {
    calls.push(name); assert.equal(name, 'comfyCloudStatus');
    return imageJob(ids.indexOf(input.requestId) + 1);
  };
  const recovered = await generateComfyViaFirebase({}, { session, storage: store, resume: true });
  assert.equal(recovered.images.length, 2);
  assert.deepEqual(calls, ['comfyCloudSubmit', 'comfyCloudSubmit', 'comfyCloudStatus', 'comfyCloudStatus']);
  assert.equal(readComfyPending(store), null);
});

test('a failed second job preserves the first result without automatically reposting', async () => {
  const store = storage(); let submits = 0;
  const session = { uid: 'user1', call: async () => ++submits === 1 ? imageJob(1) : { status: 'failed', errors: ['provider failed'] } };
  const result = await generateComfyViaFirebase({ ...payload, count: 2 }, { session, storage: store });
  assert.equal(result.images.length, 1); assert.match(result.errors[0], /第 2 張.*provider failed/);
  assert.equal(submits, 2); assert.equal(readComfyPending(store), null);
});

test('resume can recover a later submitted image even if the first job has expired', async () => {
  const store = storage(); let submits = 0;
  const session = { uid: 'user1', call: async () => { if (++submits === 1) return imageJob(1); throw new Error('network'); } };
  await assert.rejects(generateComfyViaFirebase({ ...payload, count: 2 }, { session, storage: store }), /network/);
  const pending = readComfyPending(store);
  session.call = async (name, input) => {
    assert.equal(name, 'comfyCloudStatus');
    return input.requestId === pending.items[0].requestId ? { status: 'expired', errors: ['expired first'] } : imageJob(2);
  };
  const result = await generateComfyViaFirebase({}, { session, storage: store, resume: true });
  assert.equal(result.images[0].src, imageJob(2).images[0].src);
  assert.match(result.errors[0], /第 1 張/); assert.equal(readComfyPending(store), null);
});

test('storage failure after the first image stops the sequence and recovery does not submit the unstarted image', async () => {
  const store = storage(); const set = store.setItem; let submits = 0; let rejectWrite = false;
  store.setItem = (...args) => { if (rejectWrite) throw new Error('storage full'); set(...args); };
  const session = { uid: 'user1', call: async () => { submits += 1; rejectWrite = true; return imageJob(1); } };
  await assert.rejects(generateComfyViaFirebase({ ...payload, count: 2 }, { session, storage: store }), (error) => {
    assert.equal(error.images.length, 1); return /storage full/.test(error.message);
  });
  assert.equal(submits, 1); rejectWrite = false;
  session.call = async (name) => { assert.equal(name, 'comfyCloudStatus'); return imageJob(1); };
  const result = await generateComfyViaFirebase({ ...payload, count: 2 }, { session, storage: store, resume: true });
  assert.equal(result.images.length, 1); assert.match(result.errors[0], /尚未提交/);
  assert.equal(readComfyPending(store), null);
});

test('a first-image observer error cannot cause a second paid call', async () => {
  const store = storage(); let submits = 0;
  const session = { uid: 'user1', call: async () => { submits += 1; return imageJob(1); } };
  await assert.rejects(generateComfyViaFirebase({ ...payload, count: 2 }, {
    session, storage: store, onImages: () => { throw new Error('observer error'); },
  }), /observer error/);
  assert.equal(submits, 1); assert.equal(readComfyPending(store).items[0].state, 'succeeded');
});

test('corrupt tracking and unavailable cross-tab locks fail before a paid call', async () => {
  const store = storage(); let called = false;
  store.setItem('dll_pic_pro_comfy_pending_v1', '{broken');
  const session = { uid: 'user1', call: async () => { called = true; } };
  await assert.rejects(generateComfyViaFirebase(payload, { session, storage: store }), /追蹤資料/);
  assert.equal(called, false);
  store.removeItem('dll_pic_pro_comfy_pending_v1');
  const locks = { request: async (name, options, fn) => { assert.equal(options.ifAvailable, true); return fn(null); } };
  await assert.rejects(generateComfyViaFirebase(payload, { session, storage: store, locks }), /另一個頁面/);
  assert.equal(called, false);
});

test('stored false values are invalid tracking, and stale clear cannot remove another sequence', async () => {
  const store = storage(); let submits = 0;
  const session = { uid: 'user1', call: async () => { submits += 1; throw new Error('network'); } };
  for (const raw of ['', 'false', '0', '""', '[]']) {
    store.setItem('dll_pic_pro_comfy_pending_v1', raw);
    assert.equal(readComfyPending(store).invalid, true);
    await assert.rejects(generateComfyViaFirebase(payload, { session, storage: store }), /追蹤資料/);
  }
  assert.equal(submits, 0);
  await clearComfyPending(store, { expectedRequestId: null });
  await assert.rejects(generateComfyViaFirebase(payload, { session, storage: store }), /network/);
  const id = readComfyPending(store).requestId;
  await assert.rejects(clearComfyPending(store, { expectedRequestId: 'old-request' }), /已變更/);
  assert.equal(readComfyPending(store).requestId, id);
});

test('query-only recovery continues after one asset fails and preserves unresolved tracking', async () => {
  const store = storage(); let submits = 0;
  const session = { uid: 'user1', call: async () => { if (++submits === 1) return imageJob(1); throw new Error('network'); } };
  await assert.rejects(generateComfyViaFirebase({ ...payload, count: 2 }, { session, storage: store }), /network/);
  const pending = readComfyPending(store); const queried = [];
  session.call = async (name, input) => {
    assert.equal(name, 'comfyCloudStatus'); queried.push(input.requestId);
    if (input.requestId === pending.items[0].requestId) throw new Error('asset unavailable');
    return imageJob(2);
  };
  const result = await generateComfyViaFirebase({}, { session, storage: store, resume: true });
  assert.equal(result.images.length, 1); assert.match(result.errors[0], /asset unavailable/);
  assert.equal(queried.length, 2); assert.ok(readComfyPending(store));
});

test('legacy single-job tracking remains query-only even when the current selection asks for two Krea images', async () => {
  const store = storage();
  const requestId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  store.setItem('dll_pic_pro_comfy_pending_v1', JSON.stringify({ requestId, uid: 'user1', modelKey: 'zImageTurbo', createdAt: 1 }));
  const calls = [];
  const session = { uid: 'user1', call: async (name, input) => { calls.push(name); assert.equal(input.requestId, requestId); return imageJob(1); } };
  const result = await generateComfyViaFirebase({ ...payload, modelKey: 'krea2Large', count: 2 }, { session, storage: store });
  assert.deepEqual(calls, ['comfyCloudStatus']); assert.equal(result.meta.requestedCount, 1);
});

test('a first-image failure never submits the second image, including missing final output', async () => {
  for (const job of [{ status: 'failed', errors: ['node failed'] }, { status: 'succeeded', images: [] }]) {
    const store = storage(); let calls = 0;
    const session = { uid: 'user1', call: async () => { calls += 1; return job; } };
    await assert.rejects(generateComfyViaFirebase({ ...payload, count: 2 }, { session, storage: store }));
    assert.equal(calls, 1);
  }
});

test('a concurrent generation or clear cannot replace in-flight sequence tracking', async () => {
  const store = storage(); let release; let submits = 0;
  const gate = new Promise(resolve => { release = resolve; });
  const session = { uid: 'user1', call: async () => { submits += 1; await gate; return imageJob(1); } };
  const first = generateComfyViaFirebase(payload, { session, storage: store });
  await Promise.resolve();
  await assert.rejects(generateComfyViaFirebase(payload, { session, storage: store }), /另一個頁面/);
  await assert.rejects(clearComfyPending(store), /另一個頁面/);
  assert.equal(submits, 1); release(); await first;
});
