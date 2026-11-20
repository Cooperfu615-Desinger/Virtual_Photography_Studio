import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { seedream55Settings, seedream55Price } from './seedream55.js';
import { generationSnapshot } from './dllWorkspaceController.js';
import { summarizeTask } from './dllWorkspaceStorage.js';
import { getDllPicResolutionOptions, getDllPicModelConfig } from './dllPicProClient.js';
const backend=createRequire(import.meta.url)('../../../functions/shared/seedream55.mjs');
test('5.5 independent selector supports all resolution choices and keeps 5.0',()=>{
 assert.equal(getDllPicModelConfig('comfySeedream55').defaultResolution,'2k');
 assert.deepEqual(getDllPicResolutionOptions('comfySeedream55').map(x=>x.value),['1k','1.5k','2k','custom']);
 assert.equal(getDllPicModelConfig('comfySeedream5Pro').comfyModel,'seedream5Pro');
});
test('5.5 snapshots restore options and references, summaries omit image payloads',()=>{
 const snapshot=generationSnapshot({modelKey:'comfySeedream55',prompt:'A portrait',resolution:'custom',customWidth:1824,customHeight:2280,background:'transparent',watermark:true,referenceImages:['data:image/png;base64,abc'],seed:7});
 assert.equal(snapshot.background,'transparent');assert.equal(snapshot.customWidth,1824);
 assert.equal(snapshot.referenceImages.length,1);assert.equal(summarizeTask({snapshot,images:[]}).snapshot.referenceImages,undefined);
 assert.throws(()=>generationSnapshot({...snapshot,seed:2147483647,count:2}));
});
test('frontend and backend size and fee contracts agree',()=>{
 for(const resolution of ['1k','1.5k','2k','custom']) {
 const x={resolution,aspectRatio:'9:16',customWidth:768,customHeight:1360};
 assert.deepEqual(seedream55Settings(x),backend.seedream55Settings(x));
 assert.equal(seedream55Price(x,10),backend.seedream55Price(x,10));
 }
});
