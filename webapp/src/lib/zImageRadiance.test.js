import test from 'node:test';
import assert from 'node:assert/strict';
import { DLL_ASIAN_MIX_MODEL_KEYS as keys, DLL_PIC_STORAGE_KEYS, getDllPicLoraSelection, normalizeDllPicModelKey,
  getDllPicSelectableModelEntries, readDllPicLoraStrength, generateDllPicImages } from './dllPicProClient.js';
import { generationSnapshot } from './dllWorkspaceController.js';
import { generateComfyViaFirebase } from './comfyCloudProxyClient.js';
import { getComfyGenerationNote } from './dllPicGenerationPresentation.js';

test('Radiance is an independently restored hidden Z-Image BF16 variant', () => {
  assert.equal(getDllPicLoraSelection(keys.base).enabled, false);
  const radiance = getDllPicLoraSelection(keys.radiance);
  assert.equal(radiance.enabled, true); assert.equal(radiance.modelKey, keys.base);
  assert.equal(radiance.label, 'Radiance LoRA'); assert.equal(radiance.strength, 1);
  assert.equal(normalizeDllPicModelKey(keys.radiance), keys.radiance);
  assert.deepEqual(getDllPicSelectableModelEntries().filter(([k]) => Object.values(keys).includes(k)).map(([k]) => k), [keys.base]);
  const stored = new Map([[DLL_PIC_STORAGE_KEYS.asianMixStrength, '0.65'], [DLL_PIC_STORAGE_KEYS.radianceStrength, '0.35']]);
  assert.equal(readDllPicLoraStrength(keys.radiance, k => stored.get(k)), 0.35);
  assert.equal(readDllPicLoraStrength(keys.lora, k => stored.get(k)), 0.65);
  assert.equal(readDllPicLoraStrength(keys.radiance, () => null), 1);
  assert.match(getComfyGenerationNote({ comfyModel: 'zImageTurboRadiance' }, 0.35), /Radiance LoRA.*0.35/);
});
test('Radiance snapshots preserve strength and reject invalid values', () => {
  assert.equal(generationSnapshot({ modelKey: keys.radiance, prompt: 'A cup.' }).loraStrength, 1);
  assert.equal(generationSnapshot({ modelKey: keys.radiance, prompt: 'A cup.', loraStrength: 0 }).loraStrength, 0);
  for (const loraStrength of ['', null, 1.1, 0.333]) assert.throws(() => generationSnapshot({ modelKey: keys.radiance, prompt: 'A cup.', loraStrength }), /強度/);
});
test('two sequential jobs preserve Radiance variant and selected strength', async () => {
  const calls = [], values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const session = { uid: 'fixture', call: async (name, payload) => {
    calls.push([name, payload.modelKey, payload.loraStrength, payload.seed]);
    return { status: 'succeeded', images: [{ src: 'https://example.test/a.png', mimeType: 'image/png' }] };
  } };
  const result = await generateDllPicImages({ modelKey: keys.radiance, loraStrength: 0.55, prompt: 'A cup.', count: 2, seed: 42,
    comfyGenerate: (payload, observers) => generateComfyViaFirebase(payload, { ...observers, session, storage }) });
  assert.equal(result.images.length, 2);
  assert.deepEqual(calls, [['comfyCloudWorkspaceSubmit', 'zImageTurboRadiance', 0.55, 42], ['comfyCloudWorkspaceSubmit', 'zImageTurboRadiance', 0.55, 43]]);
});
