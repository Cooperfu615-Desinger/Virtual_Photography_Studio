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

test('Flare and Sunburst keep four ordered results from a single batch, including a short reply', async () => {
  for (const modelKey of ['openaiImage26Flare', 'openaiImage26Sunburst']) {
    for (const returned of [4, 2]) {
      const snapshot = generationSnapshot({ ...base, modelKey, count: 4 });
      const images = Array.from({ length: returned }, (_, i) => ({ src: 'image-' + i }));
      const calls = [], saves = [];
      const result = await generateOpenAISequence({ id: 'batch', snapshot }, {
        submit: async payload => { calls.push(payload); return { images }; },
        onProgress: async () => {}, onImages: async batch => saves.push(batch),
      });
      assert.deepEqual(calls.map(p => [p.modelKey, p.count, p.prompt]), [[modelKey, 4, base.prompt]]);
      assert.deepEqual(saves, [images]);
      assert.equal(result.errors.length, returned === 4 ? 0 : 1);
    }
  }
  for (const overrides of [{ count: 3 }, { count: 4, outputFormat: 'svg' }, { count: 4, modelKey: 'openaiImage2' }]) {
    assert.throws(() => generationSnapshot({ ...base, ...overrides }), /張/);
  }
});

test('GIF sizes survive snapshots and every count reaches the provider with matching frames', async () => {
  for (const modelKey of ['openaiImage26Flare', 'openaiImage26Sunburst']) {
    for (const gifSize of ['auto', '512x512', '768x432', '432x768']) {
      for (const count of [1, 2, 4]) {
        for (const frameCount of [2, 9, 16]) {
          const snapshot = generationSnapshot({ ...base, modelKey, outputFormat: 'gif', gifSize, count, frameCount });
          assert.equal(snapshot.gifSize, gifSize);
          const calls = [];
          const result = await generateOpenAISequence({ id: 'gif', snapshot }, {
            submit: async payload => {
              calls.push(payload);
              assert.equal(payload.gifSize, gifSize);
              assert.equal(payload.frameCount, frameCount);
              return { images: Array.from({ length: payload.count ?? 1 }, () => ({ src: 'data:image/gif;base64,R0lG' })) };
            },
            onProgress: async () => {}, onImages: async () => {},
          });
          assert.equal(calls.length, count === 2 ? 2 : 1);
          assert.equal(result.images.length, count);
        }
      }
    }
  }
  assert.equal(generationSnapshot({ ...base, outputFormat: 'gif' }).gifSize, 'auto');
  for (const patch of [{ gifSize: '1024x1024' }, { frameCount: 1 }, { frameCount: 17 }, { frameCount: 2.5 }, { count: 3 }]) {
    assert.throws(() => generationSnapshot({ ...base, outputFormat: 'gif', ...patch }));
  }
});
