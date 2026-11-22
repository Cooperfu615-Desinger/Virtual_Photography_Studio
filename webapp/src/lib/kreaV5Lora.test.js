import test from 'node:test';
import assert from 'node:assert/strict';
import { DLL_KREA_V5_MODEL_KEYS as keys, DLL_PIC_STORAGE_KEYS, getDllPicLoraSelection, normalizeDllPicModelKey,
  getDllPicSelectableModelEntries, getDllPicLoraModelKey, readDllPicLoraStrength, generateDllPicImages } from './dllPicProClient.js';
import { generationSnapshot } from './dllWorkspaceController.js';
import { generateComfyViaFirebase } from './comfyCloudProxyClient.js';
import { getComfyGenerationNote } from './dllPicGenerationPresentation.js';

test('Krea V5 is an independently restored hidden native Krea 2 Turbo variant', () => {
  assert.equal(getDllPicLoraSelection(keys.base).enabled, false);
  assert.equal(getDllPicLoraModelKey(keys.base, true), keys.lora);
  assert.equal(getDllPicLoraModelKey(keys.lora, false), keys.base);
  const radiance = getDllPicLoraSelection(keys.lora);
  assert.equal(radiance.enabled, true); assert.equal(radiance.modelKey, keys.base);
  assert.equal(radiance.label, 'Krea 2 NSFW V5 LoRA'); assert.equal(radiance.strength, 1);
  assert.equal(normalizeDllPicModelKey(keys.lora), keys.lora);
  assert.deepEqual(getDllPicSelectableModelEntries().filter(([k]) => Object.values(keys).includes(k)).map(([k]) => k), [keys.base]);
  const stored = new Map([[DLL_PIC_STORAGE_KEYS.asianMixStrength, '0.65'], [DLL_PIC_STORAGE_KEYS.kreaV5Strength, '0.35']]);
  assert.equal(readDllPicLoraStrength(keys.lora, k => stored.get(k)), 0.35);
  assert.equal(readDllPicLoraStrength(keys.base, k => stored.get(k)), 0.35);
  assert.equal(readDllPicLoraStrength(keys.lora, () => null), 1);
  assert.match(getComfyGenerationNote({ comfyModel: 'krea2TurboNativeV5Lora' }, 0.35), /Krea 2 NSFW V5 LoRA.*0.35/);
});
test('Krea V5 snapshots preserve strength and reject invalid values', () => {
  assert.equal(generationSnapshot({ modelKey: keys.lora, prompt: 'A cup.' }).loraStrength, 1);
  assert.equal(generationSnapshot({ modelKey: keys.lora, prompt: 'A cup.', loraStrength: 0 }).loraStrength, 0);
  for (const loraStrength of ['', null, 1.1, 0.333]) assert.throws(() => generationSnapshot({ modelKey: keys.lora, prompt: 'A cup.', loraStrength }), /強度/);
});
test('two sequential jobs preserve Krea V5 variant and selected strength', async () => {
  const calls = [], values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const session = { uid: 'fixture', call: async (name, payload) => {
    calls.push([name, payload.modelKey, payload.loraStrength, payload.seed]);
    return { status: 'succeeded', images: [{ src: 'https://example.test/a.png', mimeType: 'image/png' }] };
  } };
  const result = await generateDllPicImages({ modelKey: keys.lora, loraStrength: 0.55, prompt: 'A cup.', count: 2, seed: 42,
    comfyGenerate: (payload, observers) => generateComfyViaFirebase(payload, { ...observers, session, storage }) });
  assert.equal(result.images.length, 2);
  assert.deepEqual(calls, [['comfyCloudWorkspaceSubmit', 'krea2TurboNativeV5Lora', 0.55, 42], ['comfyCloudWorkspaceSubmit', 'krea2TurboNativeV5Lora', 0.55, 43]]);
});

test('Krea V5 history JSON round-trip preserves toggle and strength independently of base', () => {
  for (const loraStrength of [0, 0.35, 1]) {
    const saved = generationSnapshot({modelKey:keys.lora,prompt:'A cup.',loraStrength});
    const restored = generationSnapshot(JSON.parse(JSON.stringify(saved)));
    assert.equal(restored.modelKey,keys.lora);
    assert.equal(restored.loraStrength,loraStrength);
  }
  const base=generationSnapshot({modelKey:keys.base,prompt:'A cup.',loraStrength:0.35});
  assert.equal(base.loraStrength,undefined);
  assert.equal(getDllPicLoraSelection('comfyKrea2MediumTurbo').supported,false);
});
