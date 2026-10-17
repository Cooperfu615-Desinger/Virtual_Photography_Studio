import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVideoController } from './videoWorkspaceController.js';
import { changeVideoModel, defaultVideoDraft } from './comfyVideoClient.js';

function fixture(overrides = {}) {
  const data = new Map(); const pending = new Map(); const calls = []; let count = 0;
  const storage = { load: async uid => data.get(uid), save: async (uid, value) => data.set(uid, structuredClone(value)),
    pending: uid => pending.get(uid), setPending: (uid, value) => value ? pending.set(uid, value) : pending.delete(uid) };
  const call = async payload => {
    calls.push(payload);
    if (payload.action === 'prepare') return { sourceId: 'uploaded-source' };
    return { status: 'succeeded', video: { src: 'https://example.org/video.mp4', mimeType: 'video/mp4' }, meta: payload };
  };
  const controller = createVideoController({ storage, session: async () => ({ uid: 'a', call }),
    prepare: async () => ({ src: 'data:image/png;base64,test', width: 576, height: 1024 }),
    locks: { request: (_name, _options, work) => work({}) }, sleep: async () => {},
    uuid: () => `id-${++count}`, ...overrides });
  return { controller, data, pending, calls, storage, call };
}
async function ready(controller) {
  await controller.setUser('a'); controller.open({ src: 'https://example.org/image.png', index: 1 });
  controller.draft({ motion: 'Turn slowly', camera: 'Push in' });
}

test('switching model preserves writing but changes valid resolution, duration and audio', () => {
  const draft = { ...defaultVideoDraft(), motion: 'Turn', camera: 'Push', duration: 30 };
  const next = changeVideoModel(draft, 'minimaxH3');
  assert.equal(next.resolution, '768P'); assert.equal(next.duration, 15); assert.equal(next.audio, true);
  assert.equal(next.motion, 'Turn'); assert.equal(next.camera, 'Push');
});

test('successful submit saves pending before paid call and keeps previous results', async () => {
  const f = fixture(); await ready(f.controller);
  await f.controller.generate();
  assert.deepEqual(f.calls.map(x => x.action), ['prepare', 'submit']);
  assert.equal(f.controller.getSnapshot().results.length, 1); assert.equal(f.pending.size, 0);
  await f.controller.generate(); assert.equal(f.controller.getSnapshot().results.length, 2);
  f.controller.close(); assert.equal(f.controller.getSnapshot().open, false);
  assert.equal(f.controller.getSnapshot().results.length, 2);
});

test('lost submission response blocks new generation and reload resumes status only', async () => {
  const f = fixture(); const calls = [];
  const controller = createVideoController({ storage: f.storage,
    session: async () => ({ uid: 'a', call: async payload => {
      calls.push(payload.action);
      if (payload.action === 'prepare') return { sourceId: 'uploaded' };
      assert.ok(f.pending.get('a')); throw new Error('lost response');
    } }), prepare: async () => ({ src: 'local png' }),
    locks: { request: (_n, _o, work) => work({}) }, uuid: () => crypto.randomUUID(), sleep: async () => {},
  });
  await ready(controller); await controller.generate();
  assert.equal(controller.getSnapshot().pending.uid, 'a');
  await controller.generate(); assert.deepEqual(calls, ['prepare', 'submit', 'status']);
  await f.controller.setUser('a');
  assert.deepEqual(f.calls.map(x => x.action), ['status']);
  assert.equal(f.controller.getSnapshot().results.length, 1);
});

test('storage and cross-tab lock failures stop paid requests', async () => {
  for (const fault of ['save', 'pending', 'lock']) {
    const f = fixture();
    if (fault === 'save') f.storage.save = async () => { throw new Error('full'); };
    if (fault === 'pending') f.storage.setPending = () => { throw new Error('full'); };
    const controller = createVideoController({ storage: f.storage, session: async () => ({ uid: 'a', call: f.call }),
      prepare: async () => ({ src: 'png' }), locks: { request: (_n, _o, work) => work(fault === 'lock' ? null : {}) } });
    await ready(controller); await controller.generate();
    assert.equal(f.calls.filter(x => x.action === 'submit').length, 0);
    assert.ok(controller.getSnapshot().error);
  }
});

test('switching accounts discards visible state and prevents old in-flight work from submitting', async () => {
  let resolvePrepare;
  const f = fixture({ prepare: () => new Promise(resolve => { resolvePrepare = resolve; }) });
  await ready(f.controller);
  const work = f.controller.generate();
  while (!resolvePrepare) await new Promise(resolve => setTimeout(resolve, 0));
  await f.controller.setUser('b'); resolvePrepare({ src: 'png' }); await work;
  assert.equal(f.controller.getSnapshot().uid, 'b'); assert.equal(f.controller.getSnapshot().source, null);
  assert.equal(f.calls.length, 0);
});

test('busy state survives closing and does not permit another source during a pending job', async () => {
  let release;
  const f = fixture({ prepare: () => new Promise(resolve => { release = resolve; }) });
  await ready(f.controller); const source = f.controller.getSnapshot().source;
  const work = f.controller.generate();
  while (!release) await new Promise(resolve => setTimeout(resolve, 0));
  f.controller.close(); f.controller.open({ src: 'other' });
  assert.equal(f.controller.getSnapshot().source, source);
  release({ src: 'png' }); await work;
  assert.equal(f.controller.getSnapshot().results.length, 1);
});

test('multi-part download assembles only complete chunks from the same video asset', async () => {
  const { collectVideoDownload } = await import('./comfyVideoClient.js');
  const size = 6 * 1024 * 1024; const offsets = [];
  const response = (bytes, total, asset = 'asset') => new Response(bytes, { headers: { 'content-type': 'video/mp4', 'X-Video-Total': String(total), 'X-Video-Asset': asset } });
  const blob = await collectVideoDownload(async offset => {
    offsets.push(offset); return response(new Uint8Array(offset === 0 ? size : 3), size + 3);
  });
  assert.deepEqual(offsets, [0, size]); assert.equal(blob.size, size + 3);
  await assert.rejects(collectVideoDownload(async () => response('ab', 3)), /不完整/);
  await assert.rejects(collectVideoDownload(async offset => response(new Uint8Array(offset ? 3 : size), size + 3, offset ? 'changed' : 'original')), /不一致/);
});
