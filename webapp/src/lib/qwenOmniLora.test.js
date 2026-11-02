import test from 'node:test';
import assert from 'node:assert/strict';
import { DLL_QWEN_MODEL_KEYS as keys, DLL_PIC_STORAGE_KEYS, getDllPicLoraSelection, normalizeDllPicModelKey,
  getDllPicSelectableModelEntries, readDllPicLoraStrength, generateDllPicImages } from './dllPicProClient.js';
import { generationSnapshot } from './dllWorkspaceController.js';
import { generateComfyViaFirebase } from './comfyCloudProxyClient.js';
import { getComfyGenerationNote } from './dllPicGenerationPresentation.js';
test('Omni is an independently restored hidden Qwen variant, with its own strength', () => {
  assert.equal(getDllPicLoraSelection(keys.base).enabled, false);
  const omni = getDllPicLoraSelection(keys.omni);
  assert.equal(omni.enabled, true); assert.equal(omni.modelKey, keys.base);
  assert.equal(omni.label, 'Omni LoRA'); assert.equal(omni.strength, 1);
  assert.equal(normalizeDllPicModelKey(keys.omni), keys.omni);
  assert.deepEqual(getDllPicSelectableModelEntries().filter(([k]) => Object.values(keys).includes(k)).map(([k]) => k), [keys.base]);
  const stored = new Map([[DLL_PIC_STORAGE_KEYS.qwenLoraStrength, '0.65'], [DLL_PIC_STORAGE_KEYS.qwenOmniLoraStrength, '0.35']]);
  assert.equal(readDllPicLoraStrength(keys.omni, k => stored.get(k)), 0.35);
  assert.equal(readDllPicLoraStrength(keys.lora, k => stored.get(k)), 0.65);
  assert.equal(readDllPicLoraStrength(keys.omni, () => null), 1);
  assert.match(getComfyGenerationNote({ comfyModel: 'qwenImage21OmniLora' }, 0.35), /Omni LoRA.*0.35/);
});
test('Omni snapshot preserves selected strength and rejects invalid values', () => {
  assert.equal(generationSnapshot({ modelKey: keys.omni, prompt: 'A cup.' }).loraStrength, 1);
  assert.equal(generationSnapshot({ modelKey: keys.omni, prompt: 'A cup.', loraStrength: 0 }).loraStrength, 0);
  for (const loraStrength of ['', null, 1.1, 0.333]) assert.throws(() => generationSnapshot({ modelKey: keys.omni, prompt: 'A cup.', loraStrength }), /強度/);
});
test('Omni sequential jobs preserve variant and chosen strength', async () => {
  const calls = [], values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const session = { uid: 'fixture', call: async (name, payload) => {
    calls.push([name, payload.modelKey, payload.loraStrength, payload.seed]);
    return { status: 'succeeded', images: [{ src: 'https://example.test/a.png', mimeType: 'image/png' }] };
  } };
  const result = await generateDllPicImages({ modelKey: keys.omni, loraStrength: 0.55, prompt: 'A cup.', count: 2, seed: 42,
    comfyGenerate: (payload, observers) => generateComfyViaFirebase(payload, { ...observers, session, storage }) });
  assert.equal(result.images.length, 2);
  assert.deepEqual(calls, [['comfyCloudWorkspaceSubmit', 'qwenImage21OmniLora', 0.55, 42], ['comfyCloudWorkspaceSubmit', 'qwenImage21OmniLora', 0.55, 43]]);
});
