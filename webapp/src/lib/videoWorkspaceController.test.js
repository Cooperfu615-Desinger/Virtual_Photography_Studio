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
    if (fault === 'pending') {
      assert.equal(controller.getSnapshot().results[0].status, 'rejected');
      assert.match(controller.getSnapshot().results[0].error, /未送出生成任務/);
    }
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

test('independent workspace retains multiple sources and reuses immutable settings without a paid call', async () => {
  const f = fixture(); await ready(f.controller);
  await f.controller.generate(); const first = f.controller.getSnapshot().results[0];
  f.controller.open({ src: 'https://example.org/second.png', name: 'Second image' });
  f.controller.draft({ modelKey: 'seedance25' });
  f.controller.draft({ motion: 'New motion' });
  await f.controller.generate();
  const state = f.controller.getSnapshot();
  assert.equal(state.results.length, 2); assert.equal(Object.keys(state.sources).length, 2);
  assert.equal(state.results[0].draft.motion, 'Turn slowly');
  assert.equal(state.results[1].draft.modelKey, 'seedance25');
  assert.equal(f.calls.at(-1).ratio, '9:16');
  const before = f.calls.length;
  f.controller.select(first.requestId); f.controller.reuse(first.requestId);
  assert.equal(f.controller.getSnapshot().draft.motion, 'Turn slowly');
  assert.equal(f.controller.getSnapshot().source.id, first.sourceId);
  assert.equal(f.calls.length, before);
  await f.controller.setUser('a');
  assert.equal(f.controller.getSnapshot().results.length, 2);
});

test('failed generation remains in history and legacy successes retain their source after migration', async () => {
  const f = fixture();
  f.data.set('a', { source: { id: 'legacy-source', src: 'data:image/png;base64,test' }, draft: defaultVideoDraft(),
    results: [{ requestId: 'old', sourceId: 'legacy-source', video: { src: 'old.mp4' }, draft: { ...defaultVideoDraft(), motion: 'Legacy' } }] });
  await f.controller.setUser('a');
  assert.equal(f.controller.getSnapshot().results[0].status, 'succeeded');
  assert.equal(f.controller.getSnapshot().sources['legacy-source'].src, 'data:image/png;base64,test');
  const failed = fixture({ session: async () => ({ uid: 'a', call: async p => p.action === 'prepare'
    ? { sourceId: 'uploaded' } : { status: 'failed', error: 'Rejected by provider' } }) });
  await ready(failed.controller); await failed.controller.generate();
  assert.equal(failed.controller.getSnapshot().results[0].status, 'failed');
  assert.equal(failed.controller.getSnapshot().pending, null);
  assert.equal(failed.data.get('a').results[0].draft.motion, 'Turn slowly');
});

test('Seedance model switch and aspect mapping preserve legacy defaults and reject unknown model keys', async () => {
  const { videoSourceRatio } = await import('./comfyVideoClient.js');
  const seedance = changeVideoModel(defaultVideoDraft(), 'seedance25');
  assert.equal(seedance.resolution, '720p'); assert.equal(seedance.duration, 5); assert.equal(seedance.audio, false);
  assert.equal(videoSourceRatio({ width: 1920, height: 1080 }), '16:9');
  assert.equal(videoSourceRatio({ width: 576, height: 1024 }), '9:16');
  assert.equal(videoSourceRatio({ width: 1000, height: 1500 }), 'adaptive');
  assert.equal(videoSourceRatio(null), 'adaptive');
  assert.equal(changeVideoModel(seedance, '__proto__'), seedance);
});

test('switching account while a paid response arrives never starts polling the old account', async () => {
  let release; const calls = [];
  const f = fixture({ session: async () => ({ uid: 'a', call: async p => {
    calls.push(p.action);
    if (p.action === 'prepare') return { sourceId: 'uploaded' };
    return new Promise(resolve => { release = resolve; });
  } }) });
  await ready(f.controller); const work = f.controller.generate();
  while (!release) await new Promise(resolve => setTimeout(resolve, 0));
  await f.controller.setUser('b'); release({ status: 'queued' }); await work;
  assert.deepEqual(calls, ['prepare', 'submit']);
  assert.equal(f.controller.getSnapshot().uid, 'b'); assert.equal(f.controller.getSnapshot().results.length, 0);
  assert.ok(f.pending.get('a'));
});

test('Pika model switch selects the tested five-second first-frame settings', () => {
  const pika = changeVideoModel({ ...defaultVideoDraft(), duration: 20, resolution: '1080P', audio: false }, 'pikaH3Flex');
  assert.equal(pika.duration, 5); assert.equal(pika.resolution, '依首圖'); assert.equal(pika.audio, true);
  assert.equal(changeVideoModel(pika, 'wan3').resolution, '720P');
});
