import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDllPicImages, getDllPicLoraSelection } from './dllPicProClient.js';
import { generationSnapshot } from './dllWorkspaceController.js';
import { generateComfyViaFirebase } from './comfyCloudProxyClient.js';
const modelKey = 'comfyZImageTurboNsfwV2Bf16';
test('BF16 v2 defaults to one image and round trips as its own model without LoRA', () => {
  const snapshot = generationSnapshot({ modelKey, prompt: 'A cup.' });
  assert.equal(snapshot.count, 1);
  assert.equal(snapshot.modelKey, modelKey);
  assert.equal(generationSnapshot(JSON.parse(JSON.stringify(snapshot))).modelKey, modelKey);
  assert.equal(getDllPicLoraSelection(modelKey).supported, false);
});
test('BF16 v2 two-image sequence keeps the model, prompt and independent seeds', async () => {
  const calls = [], values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const session = { uid: 'fixture', call: async (name, payload) => {
    calls.push([name, payload.modelKey, payload.prompt, payload.seed]);
    return { status: 'succeeded', images: [{ src: 'https://example.test/a.png', mimeType: 'image/png' }] };
  } };
  const result = await generateDllPicImages({ modelKey, prompt: 'A cup.', count: 2, seed: 42,
    comfyGenerate: (payload, observers) => generateComfyViaFirebase(payload, { ...observers, session, storage }) });
  assert.equal(result.images.length, 2);
  assert.deepEqual(calls, [['comfyCloudWorkspaceSubmit', 'zImageTurboNsfwV2Bf16', 'A cup.', 42], ['comfyCloudWorkspaceSubmit', 'zImageTurboNsfwV2Bf16', 'A cup.', 43]]);
});
