import { getComfyGenerationNote } from './dllPicGenerationPresentation.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDllPicImages, getDllPicLoraSelection, getDllPicResolutionOptions, isDllPicAspectRatioSupported } from './dllPicProClient.js';
import { generationSnapshot } from './dllWorkspaceController.js';
import { generateComfyViaFirebase } from './comfyCloudProxyClient.js';
const modelKey = 'comfyMinimaxH3Image';
test('H3 Image defaults to one image and round trips as its own model without LoRA', () => {
  assert.match(getComfyGenerationNote({ comfyModel: 'minimaxH3Image' }), /4／8／16 MP/);
  const snapshot = generationSnapshot({ modelKey, prompt: 'A cup.' });
  assert.deepEqual(getDllPicResolutionOptions(modelKey), [{ value: '2k', label: '4 MP' }, { value: '8mp', label: '8 MP' }, { value: '16mp', label: '16 MP' }]);
  assert.equal(isDllPicAspectRatioSupported(modelKey, '9:16'), true);
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
    assert.equal(payload.resolution,'16mp'); assert.equal(payload.aspectRatio,'9:16');
    calls.push([name, payload.modelKey, payload.prompt, payload.seed]);
    return { status: 'succeeded', images: [{ src: 'https://example.test/a.png', mimeType: 'image/png' }] };
  } };
  const result = await generateDllPicImages({ modelKey, prompt: 'A cup.', count: 2, seed: 42, resolution: '16mp', aspectRatio: '9:16',
    onImages: async images => { receivedImages = images.length; },
    comfyGenerate: (payload, observers) => generateComfyViaFirebase(payload, { ...observers, session, storage }) });
  assert.equal(result.images.length, 2);
  assert.deepEqual(calls, [['comfyCloudWorkspaceSubmit', 'minimaxH3Image', 'A cup.', 42], ['comfyCloudWorkspaceSubmit', 'minimaxH3Image', 'A cup.', 43]]);
});

test('H3 old 2k square settings and new 16 MP portrait settings restore unchanged',()=>{
 for(const [resolution,aspectRatio] of [['2k','1:1'],['8mp','3:2'],['16mp','9:16']]){
 const input={modelKey,prompt:'A cup',resolution,aspectRatio,count:2};
 const saved=generationSnapshot(input), restored=generationSnapshot(JSON.parse(JSON.stringify(saved)));
 assert.equal(restored.resolution,resolution);assert.equal(restored.aspectRatio,aspectRatio);
 }
 assert.equal(isDllPicAspectRatioSupported(modelKey,'4:5'),false);
});
