import test from 'node:test';
import assert from 'node:assert/strict';
import { getDllPicLoraSelection, getDllPicLoraModelKey, normalizeDllPicModelKey,
  getDllPicSelectableModelEntries, generateDllPicImages } from './dllPicProClient.js';
import { generateComfyViaFirebase, readComfyQuotaViaFirebase } from './comfyCloudProxyClient.js';
import { generationSnapshot, createDllWorkspaceController } from './dllWorkspaceController.js';
import { normalizeProviderGenerationRequest } from './providerContract.js';
import { getComfyGenerationNote } from './dllPicGenerationPresentation.js';

const base = 'comfyZImageTurbo', lora = 'comfyZImageTurboAsianMix';
test('Asian Mix is an optional BF16 variant; INT8 and MOSS behavior remain separate', () => {
  assert.equal(getDllPicLoraModelKey(base, true), lora);
  assert.equal(getDllPicLoraModelKey(lora, false), base);
  assert.equal(getDllPicLoraSelection(lora).modelKey, base);
  assert.equal(getDllPicLoraSelection(lora).adjustable, true);
  assert.equal(getDllPicLoraSelection('comfyZImageTurboInt8').supported, false);
  assert.equal(getDllPicLoraSelection('comfyMossImageSftInt8Lora').strength, 0.7);
  assert.equal(normalizeDllPicModelKey(lora), lora);
  assert.equal(normalizeDllPicModelKey('magnificClassic'), 'google31FlashLiteImage');
  assert.ok(!getDllPicSelectableModelEntries().some(([key]) => key === lora));
});

test('strength survives DLL adapter, sequential submissions, image metadata and quota request', async () => {
  const values = new Map(), calls = [];
  const storage = { getItem: key => values.get(key), setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) };
  let preserved = 0;
  const session = { uid: 'fixture', call: async (name, payload) => {
    assert.equal(preserved, calls.length);
    calls.push({ name, payload });
    return { status: 'succeeded', images: [{ src: 'https://example.test/image.png', mimeType: 'image/png' }],
      meta: { seed: payload.seed, loraStrength: payload.loraStrength } };
  } };
  const result = await generateDllPicImages({ modelKey: lora, loraStrength: 0.55, prompt: 'A ceramic cup',
    count: 2, seed: 42, onImages: images => { preserved = images.length; },
    comfyGenerate: (payload, observers) => generateComfyViaFirebase(payload, { ...observers, storage, session }) });
  assert.deepEqual(calls.map(c => [c.name, c.payload.modelKey, c.payload.seed, c.payload.loraStrength]),
    [['comfyCloudWorkspaceSubmit', 'zImageTurboAsianMix', 42, 0.55], ['comfyCloudWorkspaceSubmit', 'zImageTurboAsianMix', 43, 0.55]]);
  assert.deepEqual(result.images.map(image => image.meta.loraStrength), [0.55, 0.55]);
  let quota;
  await readComfyQuotaViaFirebase({ modelKey: 'zImageTurboAsianMix', resolution: '1k', aspectRatio: '1:1', loraStrength: 0 },
    { session: { call: async (_, payload) => { quota = payload; } } });
  assert.equal(quota.loraStrength, 0);
});

test('snapshots default strength, preserve zero and reject invalid values; base ignores stale UI strength', () => {
  const common = { modelKey: lora, prompt: 'A ceramic cup' };
  assert.equal(generationSnapshot(common).loraStrength, 1);
  assert.equal(generationSnapshot({ ...common, loraStrength: 0 }).loraStrength, 0);
  assert.ok(!Object.hasOwn(generationSnapshot({ ...common, modelKey: base, loraStrength: 0.5 }), 'loraStrength'));
  for (const value of ['', null, '0.5', -0.1, 1.1, 0.333, NaN]) {
    assert.throws(() => generationSnapshot({ ...common, loraStrength: value }), /強度/);
    assert.throws(() => normalizeProviderGenerationRequest('comfyCloud',
      { ...common, modelKey: 'zImageTurboAsianMix', loraStrength: value }), /強度/);
  }
  assert.match(getComfyGenerationNote({ comfyModel: 'zImageTurboAsianMix' }, 0.55), /Asian Mix.*0.55/);
});

test('queued strength stays immutable while draft and restored history preserve their own values', async () => {
  const saved = new Map(); let draft = null;
  const storage = { load: async () => ({ tasks: [...saved.values()], draft }),
    saveTask: async task => saved.set(task.id, structuredClone(task)), saveDraft: async (_, data) => { draft = structuredClone(data); } };
  const controller = createDllWorkspaceController({ storage, uuid: () => 'fixture' });
  await controller.setUser('fixture');
  const input = { modelKey: lora, loraStrength: 0.55, prompt: 'A ceramic cup' };
  await controller.enqueue(input);
  input.loraStrength = 1;
  controller.draft(input);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(saved.get('fixture').snapshot.loraStrength, 0.55);
  assert.equal(draft.loraStrength, 1);
  const reopened = createDllWorkspaceController({ storage });
  await reopened.setUser('fixture');
  assert.equal(reopened.getSnapshot().draft.loraStrength, 1);
  assert.equal(generationSnapshot(reopened.getSnapshot().tasks[0].snapshot).loraStrength, 0.55);
});
