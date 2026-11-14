import { getComfyGenerationNote } from './dllPicGenerationPresentation.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDllPicImages, getDllPicLoraSelection, getDllPicResolutionOptions, isDllPicAspectRatioSupported } from './dllPicProClient.js';
import { generationSnapshot } from './dllWorkspaceController.js';
import { generateComfyViaFirebase } from './comfyCloudProxyClient.js';
const modelKey = 'comfyMinimaxH3Image';
test('H3 Image defaults to one image and round trips as its own model without LoRA', () => {
  assert.match(getComfyGenerationNote({ comfyModel: 'minimaxH3Image' }), /固定方形 4 MP/);
  const snapshot = generationSnapshot({ modelKey, prompt: 'A cup.' });
  assert.deepEqual(getDllPicResolutionOptions(modelKey), [{ value: '2k', label: '4 MP（2048 × 2048）' }]);
  assert.equal(isDllPicAspectRatioSupported(modelKey, '9:16'), false);
  assert.equal(isDllPicAspectRatioSupported(modelKey, '1:1'), true);
  assert.equal(snapshot.count, 1);
  assert.equal(snapshot.modelKey, modelKey);
  assert.equal(generationSnapshot(JSON.parse(JSON.stringify(snapshot))).modelKey, modelKey);
  assert.equal(getDllPicLoraSelection(modelKey).supported, false);
});
test('H3 Image two-image sequence keeps the model, prompt and independent seeds', async () => {
  const calls = [], values = new Map();
  let receivedImages = 0;
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const session = { uid: 'fixture', call: async (name, payload) => {
    assert.equal(receivedImages, calls.length, 'next submission waits for previous onImages');
    calls.push([name, payload.modelKey, payload.prompt, payload.seed]);
    return { status: 'succeeded', images: [{ src: 'https://example.test/a.png', mimeType: 'image/png' }] };
  } };
  const result = await generateDllPicImages({ modelKey, prompt: 'A cup.', count: 2, seed: 42, resolution: '2k', aspectRatio: '1:1',
    onImages: async images => { receivedImages = images.length; },
    comfyGenerate: (payload, observers) => generateComfyViaFirebase(payload, { ...observers, session, storage }) });
  assert.equal(result.images.length, 2);
  assert.deepEqual(calls, [['comfyCloudWorkspaceSubmit', 'minimaxH3Image', 'A cup.', 42], ['comfyCloudWorkspaceSubmit', 'minimaxH3Image', 'A cup.', 43]]);
});
