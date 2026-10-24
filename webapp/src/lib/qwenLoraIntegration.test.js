import test from 'node:test';
import assert from 'node:assert/strict';
import { DLL_QWEN_MODEL_KEYS, DLL_PIC_STORAGE_KEYS, getDllPicLoraSelection, getDllPicLoraModelKey,
  normalizeDllPicModelKey, getDllPicSelectableModelEntries, generateDllPicImages, readDllPicLoraStrength } from './dllPicProClient.js';
import { generateComfyViaFirebase, readComfyQuotaViaFirebase } from './comfyCloudProxyClient.js';
import { generationSnapshot, createDllWorkspaceController } from './dllWorkspaceController.js';
import { normalizeProviderGenerationRequest } from './providerContract.js';
import { getComfyGenerationNote } from './dllPicGenerationPresentation.js';

const { base, lora } = DLL_QWEN_MODEL_KEYS;
test('Qwen offers one model with optional v1.3b, default off, and preserves its hidden variant on restore', () => {
  assert.equal(getDllPicLoraSelection(base).enabled, false);
  assert.equal(getDllPicLoraSelection(lora).enabled, true);
  assert.equal(getDllPicLoraSelection(lora).strength, 0.7);
  assert.equal(getDllPicLoraModelKey(base, true), lora);
  assert.equal(getDllPicLoraModelKey(lora, false), base);
  assert.equal(normalizeDllPicModelKey(lora), lora);
  assert.deepEqual(getDllPicSelectableModelEntries().filter(([key]) => [base, lora].includes(key)).map(([key]) => key), [base]);
  assert.match(getComfyGenerationNote({ comfyModel: 'qwenImage21Lora' }), /v1.3b.*0.7/);
  assert.match(getComfyGenerationNote({ comfyModel: 'qwenImage21Lora' }, 0), /強度 0）/);
});

test('Qwen and Asian Mix stored strengths stay separate, with defaults and corrupt-storage fallback', () => {
  const stored = new Map([[DLL_PIC_STORAGE_KEYS.asianMixStrength, '0.4'], [DLL_PIC_STORAGE_KEYS.qwenLoraStrength, '0.65']]);
  const read = key => stored.get(key);
  assert.equal(readDllPicLoraStrength(base, read), 0.65);
  assert.equal(readDllPicLoraStrength('comfyZImageTurbo', read), 0.4);
  for (const value of [undefined, '', ' ', 'NaN', '1.1', '0.333']) {
    stored.set(DLL_PIC_STORAGE_KEYS.qwenLoraStrength, value);
    assert.equal(readDllPicLoraStrength(lora, read), 0.7);
  }
  stored.set(DLL_PIC_STORAGE_KEYS.qwenLoraStrength, '0');
  assert.equal(readDllPicLoraStrength(lora, read), 0);
  assert.equal(readDllPicLoraStrength(lora, () => { throw new Error('storage blocked'); }), 0.7);
  assert.equal(readDllPicLoraStrength('comfyZImageTurbo', () => null), 1);
});

test('Qwen strength reaches both sequential submissions, metadata and quota, after previous image preservation', async () => {
  const values = new Map(), calls = [];
  const storage = { getItem: key => values.get(key), setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) };
  let preserved = 0;
  const session = { uid: 'fixture', call: async (name, payload) => {
    assert.equal(preserved, calls.length);
    calls.push({ name, payload });
    return { status: 'succeeded', images: [{ src: 'https://example.test/image.png', mimeType: 'image/png' }],
      meta: { seed: payload.seed, loraStrength: payload.loraStrength } };
  } };
  const prompt = 'A ceramic cup. Soft window light.';
  const result = await generateDllPicImages({ modelKey: lora, loraStrength: 0.55, prompt, count: 2, seed: 42,
    onImages: images => { preserved = images.length; },
    comfyGenerate: (payload, observers) => generateComfyViaFirebase(payload, { ...observers, storage, session }) });
  assert.deepEqual(calls.map(c => [c.name, c.payload.modelKey, c.payload.seed, c.payload.loraStrength, c.payload.prompt]),
    [['comfyCloudWorkspaceSubmit', 'qwenImage21Lora', 42, 0.55, prompt], ['comfyCloudWorkspaceSubmit', 'qwenImage21Lora', 43, 0.55, prompt]]);
  assert.deepEqual(result.images.map(image => image.meta.loraStrength), [0.55, 0.55]);
  let quota;
  await readComfyQuotaViaFirebase({ modelKey: 'qwenImage21Lora', resolution: '1k', aspectRatio: '1:1', loraStrength: 0 },
    { session: { call: async (_, payload) => { quota = payload; } } });
  assert.equal(quota.loraStrength, 0);
  assert.equal(quota.modelKey, 'qwenImage21Lora');
});

test('Qwen snapshots validate strength including zero; disabling omits strength and preserves base request', () => {
  const common = { modelKey: lora, prompt: 'A ceramic cup' };
  assert.equal(generationSnapshot(common).loraStrength, 0.7);
  assert.equal(generationSnapshot({ ...common, loraStrength: 0 }).loraStrength, 0);
  assert.ok(!Object.hasOwn(generationSnapshot({ ...common, modelKey: base, loraStrength: 0.5 }), 'loraStrength'));
  for (const value of ['', null, '0.5', -0.1, 1.1, 0.333, NaN]) {
    assert.throws(() => generationSnapshot({ ...common, loraStrength: value }), /強度/);
    assert.throws(() => normalizeProviderGenerationRequest('comfyCloud',
      { ...common, modelKey: 'qwenImage21Lora', loraStrength: value }), /強度/);
  }
});

test('queued Qwen strength stays immutable; drafts and reopened history preserve distinct values', async () => {
  const saved = new Map(); let draft = null;
  const storage = { load: async () => ({ tasks: [...saved.values()], draft }),
    saveTask: async task => saved.set(task.id, structuredClone(task)), saveDraft: async (_, data) => { draft = structuredClone(data); } };
  const controller = createDllWorkspaceController({ storage, uuid: () => 'fixture' });
  await controller.setUser('fixture');
  const input = { modelKey: lora, loraStrength: 0.55, prompt: 'A ceramic cup', seed: 42 };
  await controller.enqueue(input);
  input.loraStrength = 0.7;
  controller.draft(input);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(saved.get('fixture').snapshot.loraStrength, 0.55);
  const reopened = createDllWorkspaceController({ storage });
  await reopened.setUser('fixture');
  assert.equal(reopened.getSnapshot().draft.loraStrength, 0.7);
  assert.deepEqual(generationSnapshot(reopened.getSnapshot().tasks[0].snapshot), generationSnapshot({ ...input, loraStrength: 0.55 }));
});
