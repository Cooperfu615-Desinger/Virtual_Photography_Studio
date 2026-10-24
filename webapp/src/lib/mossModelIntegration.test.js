import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DLL_MOSS_MODEL_KEYS, getDllPicLoraSelection, getDllPicLoraModelKey,
  getDllPicModelConfig, getDllPicSelectableModelEntries, normalizeDllPicModelKey,
  getDllPicResolutionOptions, generateDllPicImages,
} from './dllPicProClient.js';
import { generateComfyViaFirebase, readComfyPending } from './comfyCloudProxyClient.js';
import { createDllWorkspaceController, generationSnapshot } from './dllWorkspaceController.js';

test('MOSS offers one model option while preserving the actual LoRA variant across restore', () => {
  const { base, lora } = DLL_MOSS_MODEL_KEYS;
  assert.deepEqual(getDllPicSelectableModelEntries().filter(([key]) => [base, lora].includes(key)).map(([key]) => key), [base]);
  for (const [key, enabled, backend] of [[base, false, 'mossImageSftInt8'], [lora, true, 'mossImageSftInt8Lora']]) {
    assert.equal(normalizeDllPicModelKey(key), key);
    assert.deepEqual(getDllPicLoraSelection(key), { modelKey: base, supported: true, enabled, strength: 0.7 });
    assert.equal(getDllPicModelConfig(key).comfyModel, backend);
    assert.deepEqual(getDllPicResolutionOptions(key).map(option => option.value), ['1k']);
    assert.equal(generationSnapshot({ modelKey: key, prompt: 'a ceramic cup', count: 2, seed: 42 }).modelKey, key);
  }
  assert.notEqual(getDllPicModelConfig(base).label, getDllPicModelConfig(lora).label);
  assert.equal(getDllPicLoraModelKey(base, true), lora);
  assert.equal(getDllPicLoraModelKey(lora, false), base);
  assert.equal(getDllPicLoraModelKey('comfyZImageTurboInt8', true), 'comfyZImageTurboInt8');
  assert.equal(getDllPicLoraSelection('comfyZImageTurboInt8').supported, false);
  assert.equal(normalizeDllPicModelKey('magnificClassic'), 'google31FlashLiteImage');
});

test('MOSS LoRA selection survives the DLL adapter and both sequential seeded submissions', async () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const calls = [];
  let preserved = 0;
  const prompt = 'A blue ceramic cup.\nSoft window light.';
  const result = await generateDllPicImages({
    modelKey: DLL_MOSS_MODEL_KEYS.lora, prompt, count: 2, resolution: '1k', aspectRatio: '4:5', seed: 42,
    onImages: async images => { preserved = images.length; },
    comfyGenerate: (payload, observers) => generateComfyViaFirebase(payload, {
      ...observers, storage, session: { uid: 'test-user', call: async (name, input) => {
        assert.equal(preserved, calls.length, 'the previous image must be preserved before another submission');
        calls.push({ name, input });
        return { status: 'succeeded', images: [{ src: `https://example.test/${calls.length}.png`, mimeType: 'image/png' }],
          meta: { modelKey: input.modelKey, seed: input.seed } };
      } },
    }),
  });
  assert.deepEqual(calls.map(({ name }) => name), ['comfyCloudWorkspaceSubmit', 'comfyCloudWorkspaceSubmit']);
  assert.deepEqual(calls.map(({ input }) => input.modelKey), ['mossImageSftInt8Lora', 'mossImageSftInt8Lora']);
  assert.deepEqual(calls.map(({ input }) => input.seed), [42, 43]);
  assert.ok(calls.every(({ input }) => input.prompt === prompt && input.count === 1));
  assert.equal(result.images.length, 2);
  assert.equal(readComfyPending(storage), null);
});

test('MOSS queued snapshots and drafts keep the chosen variant after later settings change', async () => {
  const saved = new Map();
  let draft = null;
  let id = 0;
  const controller = createDllWorkspaceController({
    storage: { load: async () => ({ tasks: [...saved.values()], draft }),
      saveTask: async task => saved.set(task.id, structuredClone(task)),
      saveDraft: async (_, value) => { draft = structuredClone(value); } },
    uuid: () => `moss-task-${++id}`,
    locks: { request: async (_, __, work) => work({}) },
  });
  await controller.setUser('test-user');
  const input = { modelKey: DLL_MOSS_MODEL_KEYS.lora, prompt: 'A ceramic cup', seed: 42 };
  const taskId = await controller.enqueue(input);
  input.modelKey = DLL_MOSS_MODEL_KEYS.base;
  controller.draft({ modelKey: DLL_MOSS_MODEL_KEYS.lora, custom: true, customPrompt: input.prompt, seed: 42 });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(saved.get(taskId).snapshot.modelKey, DLL_MOSS_MODEL_KEYS.lora);
  assert.equal(draft.modelKey, DLL_MOSS_MODEL_KEYS.lora);
  assert.equal(draft.seed, 42);
});
