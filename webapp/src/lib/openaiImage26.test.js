import test from 'node:test';
import assert from 'node:assert/strict';
import { openAI26Settings } from './openaiImage26.js';
import { generationSnapshot } from './dllWorkspaceController.js';
import { generateOpenAISequence } from './openaiImageSequence.js';
import { getImageDownloadExtension } from './imageDownload.js';
const base={ modelKey:'openaiImage26Flare',prompt:'A ceramic cup',resolution:'1k',aspectRatio:'9:16',count:2 };
test('2.6 settings survive snapshots and use compatible defaults',()=>{
  const s=generationSnapshot({...base,modelKey:'openaiImage26Sunburst',quality:'xhigh',complexity:'low',outputFormat:'webp',outputCompression:80});
  assert.equal(s.quality,'xhigh');assert.equal(s.complexity,'low');assert.equal(s.outputFormat,'webp');assert.equal(s.outputCompression,80);
  assert.equal(openAI26Settings().complexity,'high');assert.equal(openAI26Settings().quality,'medium');
  assert.throws(()=>generationSnapshot({...base,imageMode:'edit'}),/參考/); assert.throws(()=>generationSnapshot({...base,outputFormat:'gif',frameCount:17}),/GIF/); assert.throws(()=>generationSnapshot({...base,outputFormat:'jpeg',background:'transparent'}),/透明/);
});
test('2.6 settings pass to sequential jobs after image save',async()=>{
  const task={id:'fixture',snapshot:generationSnapshot({...base,complexity:'low',imageMode:'edit',referenceImage:'data:image/png;base64,abc',markup:'data:image/png;base64,def'})}; const events=[];
  const result=await generateOpenAISequence(task,{onProgress:async()=>{},onImages:async images=>events.push(`saved:${images.length}`),submit:async payload=>{events.push(`submit:${payload.requestId}`);assert.equal(payload.modelKey,'openaiImage26Flare');assert.equal(payload.imageMode,'edit');assert.equal(payload.complexity,'low');assert.equal(payload.markup,'data:image/png;base64,def');return {images:[{src:'fixture'}]};}});
  assert.deepEqual(events,['submit:fixture_1','saved:1','submit:fixture_2','saved:2']);assert.equal(result.images.length,2);
});
test('SVG and GIF use proper download extensions',()=>{
  assert.equal(getImageDownloadExtension('data:image/svg+xml;base64,YWJj'),'svg'); assert.equal(getImageDownloadExtension('data:image/gif;base64,YWJj'),'gif');
});

test('custom sizes are preserved and invalid dimensions are rejected',()=>{
  const s=generationSnapshot({...base,resolution:'custom',customWidth:1024,customHeight:1536});
  assert.equal(s.customWidth,1024); assert.equal(s.customHeight,1536);
  assert.throws(()=>generationSnapshot({...base,resolution:'custom',customWidth:1000}),/尺寸/);
  assert.doesNotThrow(()=>generationSnapshot({...base,resolution:'custom',customWidth:0,outputFormat:'gif'}));
});
