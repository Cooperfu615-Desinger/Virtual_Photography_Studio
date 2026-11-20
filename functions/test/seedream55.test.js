const test = require('node:test');
const assert = require('node:assert/strict');
const { buildComfyWorkflow, submitComfyJob } = require('../src/comfyCloud');
const { seedream55Price } = require('../shared/seedream55.mjs');
const sizes = require('../shared/seedream55Sizes.json');
const base = { modelKey: 'seedream55', prompt: 'A ceramic cup', resolution: '2k', aspectRatio: '1:1', count: 1 };
test('Seedream 5.5 presets, background and watermark reach the graph without 5.0 options', () => {
  for (const [resolution, ratios] of Object.entries(sizes)) for (const [aspectRatio, [w,h]] of Object.entries(ratios)) {
    const { workflow, meta } = buildComfyWorkflow({ ...base, resolution, aspectRatio, background: 'transparent', watermark: true }, 7);
    assert.equal(meta.width,w); assert.equal(meta.height,h);
    assert.equal(workflow['1'].inputs['model.background'], 'transparent');
    assert.equal(workflow['1'].inputs['model.watermark'], true);
    assert.equal(workflow['1'].inputs['model.thinking'], undefined);
    assert.equal(workflow['1'].inputs['model.prompt_optimization'], undefined);
  }
});
test('reject invalid custom dimensions, background, seed and reference count before billing', () => {
  for (const patch of [{customWidth: 2049,customHeight:2048},{customWidth:8192,customHeight:8192},{customWidth:240,customHeight:240}]) assert.throws(() => buildComfyWorkflow({...base,resolution:'custom',...patch},1));
  assert.throws(()=>buildComfyWorkflow({...base,background:'invalid'},1));
  assert.throws(()=>buildComfyWorkflow(base,2147483648));
  assert.throws(()=>seedream55Price(base,11));
  assert.equal(seedream55Price(base,0),0.05005);
  assert.equal(seedream55Price({...base,resolution:'1.5k'},2),0.05148);
});
test('ordered owned references bind without rewriting prompt; foreign sources cannot submit', async () => {
  const id='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'; let sent;
  const store={get:async()=>null,claim:async()=>({claimed:true}),update:async()=>{}};
  const sourceStore={get:async()=>({kind:'source',assetId:id})};
  const payload={...base,requestId:id,referenceSourceIds:Array(10).fill(id)};
  await submitComfyJob({apiKey:'test',payload,store,sourceStore,fetchImpl:async(url,opts)=>{sent=JSON.parse(opts.body);return{ok:true,json:async()=>({id,status:'queued'})};}});
  assert.deepEqual(sent.workflow['1'].inputs['model.images.image_10'],['19',0]);
  assert.equal(sent.workflow['1'].inputs.prompt,base.prompt);
  await assert.rejects(submitComfyJob({apiKey:'test',payload,store,sourceStore:{get:async()=>null},fetchImpl:()=>{throw Error('must not submit');}}),/找不到/);
});
test('custom quota uses actual dimensions and charges every reference', async()=>{
 const { readComfyQuota }=require('../src/comfyQuota');
 const quote=await readComfyQuota({apiKey:'test',payload:{...base,resolution:'custom',customWidth:768,customHeight:1360,referenceCount:2},records:[],fetchImpl:async()=>({ok:true,json:async()=>({summary:{balance:{currency:'USD',amount_micros:100}}})})});
 assert.equal(quote.creditsPerImage,0.05148*211);
 assert.equal(quote.estimatedImages,19);
});
