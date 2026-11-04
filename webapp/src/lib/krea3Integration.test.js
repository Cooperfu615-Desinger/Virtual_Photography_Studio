import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDllPicImages, getDllPicModelConfig, isDllPicAspectRatioSupported, KREA3_EXTRA_ASPECT_RATIOS } from './dllPicProClient.js';
import { generateComfyViaFirebase } from './comfyCloudProxyClient.js';
import { generationSnapshot } from './dllWorkspaceController.js';
import { getComfyGenerationNote } from './dllPicGenerationPresentation.js';
const modelKey = 'comfyKrea3';
test('Krea 3 exposes 1K / 2K and its native text ratios without changing other models', () => {
  const config = getDllPicModelConfig(modelKey);
  assert.deepEqual(config.resolutionOptions, ['1k','2k']);
  for (const {value} of KREA3_EXTRA_ASPECT_RATIOS) {
    assert.equal(isDllPicAspectRatioSupported(modelKey,value),true);
    assert.equal(isDllPicAspectRatioSupported('comfyZImageTurbo',value),false);
  }
  assert.match(getComfyGenerationNote(config), /Seed/);
});
test('Krea mode persists in task snapshots and is passed to the adapter', async () => {
  const input={modelKey,prompt:'A ceramic cup',count:2,resolution:'2k',aspectRatio:'2:3',thinkingMode:'high'};
  const snapshot=generationSnapshot(input);
  assert.equal(snapshot.thinkingMode,'high');
  assert.equal(generationSnapshot({...input,thinkingMode:undefined}).thinkingMode,'fast');
  assert.throws(()=>generationSnapshot({...input,thinkingMode:'ultra'}),/模式/);
  assert.equal(generationSnapshot({...input,modelKey:'comfyZImageTurbo'}).thinkingMode,undefined);
  let payload;
  await generateDllPicImages({...snapshot, comfyGenerate: async p=> { payload=p; return {images:[{src:'test',mimeType:'image/png'}],errors:[]}; }});
  assert.equal(payload.modelKey,'krea3'); assert.equal(payload.thinkingMode,'high'); assert.equal(payload.count,2);
  assert.equal(payload.aspectRatio,'2:3'); assert.equal(payload.resolution,'2k');
});

test('two Krea jobs are sequential and retain mode, resolution, ratio and seed', async () => {
  const calls = [], values = new Map();
  const storage = {getItem: key => values.get(key), setItem: (key, value) => values.set(key,value), removeItem: key => values.delete(key)};
  const session = {uid:'fixture', call:async(name,payload)=> {
    calls.push([name,payload.modelKey,payload.thinkingMode,payload.resolution,payload.aspectRatio,payload.seed]);
    return {status:'succeeded',images:[{src:'https://example.test/a.png',mimeType:'image/png'}]};
  }};
  const result = await generateDllPicImages({modelKey,prompt:'A ceramic cup',count:2,seed:42,resolution:'2k',aspectRatio:'21:9',thinkingMode:'high',
    comfyGenerate:(payload,observers)=>generateComfyViaFirebase(payload,{...observers,session,storage})});
  assert.equal(result.images.length,2);
  assert.deepEqual(calls,[['comfyCloudWorkspaceSubmit','krea3','high','2k','21:9',42],['comfyCloudWorkspaceSubmit','krea3','high','2k','21:9',43]]);
  assert.throws(()=>generationSnapshot({modelKey,prompt:'A cup',count:2,seed:2147483647}),/Seed/);
  assert.doesNotThrow(()=>generationSnapshot({modelKey,prompt:'A cup',count:1,seed:2147483647}));
});
