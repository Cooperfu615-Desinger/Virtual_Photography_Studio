const test = require('node:test');
const assert = require('node:assert/strict');
const { buildComfyWorkflow, parseComfyJob, submitComfyJob } = require('../src/comfyCloud');
const { readComfyQuota } = require('../src/comfyQuota');
const input = (extra = {}) => ({ modelKey: 'krea3', prompt: 'A ceramic cup', aspectRatio: '9:16', resolution: '1k', count: 1, ...extra });

test('Krea 3 maps every supported ratio, resolution and text mode into the exported graph', () => {
  for (const aspectRatio of ['auto','1:1','4:5','3:4','2:3','9:16','5:4','4:3','3:2','16:9','21:9']) {
    for (const resolution of ['1k','2k']) for (const thinkingMode of ['fast','high']) {
      const { workflow, meta } = buildComfyWorkflow(input({ aspectRatio, resolution, thinkingMode }), 42);
      assert.equal(workflow['1'].class_type, 'Krea3ImageNode');
      assert.deepEqual(workflow['1'].inputs, { model: 'Krea 3', 'model.prompt': 'A ceramic cup', 'model.aspect_ratio': aspectRatio,
        'model.resolution': resolution.toUpperCase(), 'model.thinking_mode': thinkingMode, 'model.precise_edit': false, 'model.seed': 42 });
      assert.equal(workflow['7'].class_type, 'SaveImageAdvanced');
      assert.deepEqual(workflow['7'].inputs.images, ['1', 0]);
      assert.equal(meta.width, null); assert.equal(meta.height, null); assert.equal(meta.thinkingMode, thinkingMode);
    }
  }
  assert.equal(buildComfyWorkflow(input(), 0).workflow['1'].inputs['model.thinking_mode'], 'fast');
});

test('rejects unsupported modes and ratios before claiming paid tasks', async () => {
  let claimed = false;
  for (const values of [{thinkingMode:'ultra'}, {thinkingMode:'invalid'}, {aspectRatio:'7:9'}, {resolution:'4k'}, {seed: 2147483648}]) {
    await assert.rejects(submitComfyJob({ apiKey: 'key', payload: { ...input(values), requestId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }, store: { claim: () => { claimed = true; } } }));
  }
  assert.equal(claimed, false);
  assert.throws(() => buildComfyWorkflow(input({modelKey:'zImageTurbo', aspectRatio:'2:3'}), 42), /比例/);
  assert.throws(() => buildComfyWorkflow(input({modelKey:'krea2Medium', thinkingMode:'high'}), 42), /模式/);
});

test('Krea 3 recognizes the exported output and reads balance without invented estimates', async () => {
  const {meta} = buildComfyWorkflow(input({aspectRatio:'auto'}), 42);
  const result = parseComfyJob({id:'job', status:'succeeded', outputs:[{type:'image', node_id:'7', id:'image', content_type:'image/png'}, {type:'image', node_id:'2',id:'other'}]}, meta);
  assert.deepEqual(result.images.map(x=>x.assetId), ['image']);
  const quota = await readComfyQuota({apiKey:'key',payload:input({aspectRatio:'auto'}),records:[],fetchImpl:async()=>({ok:true,json:async()=>({summary:{balance:{currency:'USD',amount_micros:100}}})})});
  assert.equal(quota.estimatedImages, null); assert.equal(quota.estimateUnavailableReason, 'partnerPricing'); assert.equal(quota.credits,211);
});
