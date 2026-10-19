import test from 'node:test';
import assert from 'node:assert/strict';
import { createDllWorkspaceController, generationSnapshot } from './dllWorkspaceController.js';

function setup(overrides = {}) {
  const saved = new Map(); let calls = 0, id = 0;
  const storage = {
    load: async owner => ({ tasks: [...saved.values()].filter(t => t.owner === owner), draft: null }),
    saveTask: async task => { saved.set(task.id, structuredClone(task)); }, saveDraft: async () => {},
    remove: async (_, id) => saved.delete(id),
  };
  const controller = createDllWorkspaceController({ storage, locks: { request: async (_, __, fn) => fn({}) },
    uuid: () => `task-${++id}`, materialize: async image => ({ ...image, src: 'data:image/png;base64,LOCAL' }),
    execute: async (task, callbacks) => { calls++; await callbacks.onImages([{ src: 'https://temporary/image', meta: { seed: 7 } }]); return { images: [], errors: [], meta: { prompt: task.snapshot.prompt } }; },
    resume: async (_, callbacks) => { await callbacks.onImages([{ src: 'https://temporary/image' }]); return { images: [], errors: [] }; },
    ...overrides,
  });
  return { controller, saved, storage, calls: () => calls };
}
const input = { prompt: ' exact prompt\n', modelKey: 'comfyZImageTurbo', sourceLabel: 'Z-Image' };
test('snapshot preserves prompt exactly, excludes credentials and validates counts/seeds', () => {
  const value = generationSnapshot({ ...input, apiKey: 'secret', count: 2 });
  assert.equal(value.prompt, input.prompt); assert.equal(value.apiKey, undefined);
  assert.throws(() => generationSnapshot({ ...input, count: 3 }));
  assert.throws(() => generationSnapshot({ ...input, seed: -1 }));
});
test('enqueue is not submission; reload never runs waiting tasks automatically', async () => {
  const { controller: c, calls } = setup(); await c.setUser('u'); await c.enqueue(input);
  assert.equal(calls(), 0); await c.setUser('other'); await c.setUser('u'); assert.equal(calls(), 0);
  await c.start(); assert.equal(calls(), 1); assert.equal(c.getSnapshot().tasks[0].status, 'succeeded');
});
test('results save local bytes before completion and snapshot cannot mutate', async () => {
  const { controller: c, saved } = setup(); await c.setUser('u');
  const source = { ...input }; const id = await c.enqueue(source); source.prompt = 'changed'; await c.start();
  assert.equal(saved.get(id).snapshot.prompt, input.prompt);
  assert.match(saved.get(id).images[0].src, /^data:/);
});
test('persistence failure blocks paid submit', async () => {
  let submits = 0;
  const { controller: c } = setup({ storage: { load: async () => ({ tasks: [] }), saveTask: async () => { throw new Error('disk full'); } }, execute: async () => submits++ });
  await c.setUser('u'); await assert.rejects(c.enqueue(input, true), /disk full/); assert.equal(submits, 0);
});
test('uncertain request stops queue and is never automatically resubmitted', async () => {
  let submits = 0;
  const { controller: c } = setup({ execute: async () => { submits++; throw new Error('lost response'); } });
  await c.setUser('u'); await c.enqueue(input); await c.enqueue(input); await c.start(); await c.start();
  assert.equal(submits, 1); assert.equal(c.getSnapshot().tasks[0].status, 'uncertain'); assert.equal(c.getSnapshot().tasks[1].status, 'waiting');
});
test('failed second image retains first locally and stops following jobs', async () => {
  const { controller: c } = setup({ execute: async (_, cb) => { await cb.onImages([{ src: 'remote' }]); return { errors: ['second failed'], meta: { partial: true } }; } });
  await c.setUser('u'); await c.enqueue({ ...input, count: 2 }); await c.enqueue(input); await c.start();
  assert.equal(c.getSnapshot().tasks[0].status, 'partial'); assert.equal(c.getSnapshot().tasks[0].images.length, 1);
  assert.equal(c.getSnapshot().tasks[1].status, 'waiting');
});
test('resume queries only and finalizes interrupted task', async () => {
  const { controller: c, calls } = setup({ execute: async () => { throw new Error('offline'); } });
  await c.setUser('u'); const id = await c.enqueue(input, true); await c.resume(id);
  assert.equal(calls(), 0); assert.equal(c.getSnapshot().tasks[0].status, 'succeeded');
});
test('account changes cannot attach old response to new user', async () => {
  let release; const wait = new Promise(resolve => { release = resolve; });
  const { controller: c } = setup({ execute: async (_, cb) => { await wait; await cb.onImages([{ src: 'old' }]); return {}; } });
  await c.setUser('a'); await c.enqueue(input); const run = c.start();
  await new Promise(resolve => setTimeout(resolve, 0)); await c.setUser('b'); release(); await run;
  assert.equal(c.getSnapshot().owner, 'b'); assert.equal(c.getSnapshot().tasks.length, 0);
});
test('pause lets current job finish but does not submit next job', async () => {
  let release; const wait = new Promise(resolve => { release = resolve; }); let calls = 0;
  const { controller: c } = setup({ execute: async (_, cb) => { calls++; await wait; await cb.onImages([{ src: 'image' }]); return {}; } });
  await c.setUser('u'); await c.enqueue(input); await c.enqueue(input); const run = c.start();
  await new Promise(resolve => setTimeout(resolve, 0)); c.pause(); release(); await run;
  assert.equal(calls, 1); assert.equal(c.getSnapshot().tasks[1].status, 'waiting');
});
test('cross-tab lock rejects new submit', async () => {
  const { controller: c, calls } = setup({ locks: { request: async (_, __, fn) => fn(null) } });
  await c.setUser('u'); await c.enqueue(input, true); assert.equal(calls(), 0); assert.match(c.getSnapshot().error, /另一個分頁/);
});
test('upscale snapshot retains parent without mutating original', () => {
  const source = { src: 'data:image/png;base64,ORIGINAL' };
  const snapshot = generationSnapshot({ kind: 'upscale', sourceImage: source, parentId: 'original:0', scale: 2 });
  source.src = 'changed'; assert.match(snapshot.sourceImage.src, /ORIGINAL$/); assert.equal(snapshot.parentId, 'original:0');
});
test('terminal cancellation stops queue', async () => {
  const { controller: c } = setup({ execute: async () => { const error = new Error('canceled'); error.canceled = true; error.terminal = true; throw error; } });
  await c.setUser('u'); await c.enqueue(input); await c.enqueue(input); await c.start();
  assert.equal(c.getSnapshot().tasks[0].status, 'canceled'); assert.equal(c.getSnapshot().tasks[1].status, 'waiting');
});
test('reload queries interrupted Comfy job without submitting a waiting job', async () => {
  const { controller: c, saved, calls } = setup();
  await c.setUser('u'); const interrupted = await c.enqueue(input); await c.enqueue(input);
  saved.get(interrupted).status = 'running';
  await c.setUser('other'); await c.setUser('u');
  assert.equal(calls(), 0); assert.equal(c.getSnapshot().tasks[0].status, 'succeeded');
  assert.equal(c.getSnapshot().tasks[1].status, 'waiting');
});
test('stale waiting task cannot cancel or delete a submitted job from another tab', async () => {
  const { controller: c, saved } = setup();
  await c.setUser('u'); const id = await c.enqueue(input);
  saved.get(id).status = 'running';
  await c.cancel(id);
  assert.equal(saved.get(id).status, 'running');
  assert.match(c.getSnapshot().error, /狀態已更新/);
  await assert.rejects(c.remove(id), /未完成任務/);
});
test('recovery preserves downloaded original when Cloud returns only a later asset', async () => {
  const { controller: c, saved } = setup({ resume: async (_, cb) => {
    await cb.onImages([{ assetId: 'second', src: 'remote-second' }]);
    return { errors: ['first cloud asset expired'] };
  } });
  await c.setUser('u'); const id = await c.enqueue({ ...input, count: 2 });
  saved.set(id, { ...saved.get(id), status: 'uncertain', images: [{ assetId: 'first', src: 'data:image/png;base64,FIRST' }] });
  await c.resume(id);
  assert.deepEqual(c.getSnapshot().tasks[0].images.map(i => i.assetId), ['first', 'second']);
  assert.equal(c.getSnapshot().tasks[0].images[0].src, 'data:image/png;base64,FIRST');
});
test('restored history is chronological rather than database UUID order', async () => {
  const { controller: c } = setup({ storage: { load: async () => ({ tasks: [
    { id: 'a', createdAt: 30, status: 'waiting', snapshot: input },
    { id: 'z', createdAt: 10, status: 'waiting', snapshot: input },
  ] }) } });
  await c.setUser('u');
  assert.deepEqual(c.getSnapshot().tasks.map(t => t.id), ['z', 'a']);
});
