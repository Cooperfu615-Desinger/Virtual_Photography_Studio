const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildComfyWorkflow, parseComfyJob } = require('../src/comfyCloud');
const payload = { modelKey: 'minimaxH3Image', prompt: 'A ceramic cup.\nNatural daylight.' };
test('H3 Image defaults to official default 4 MP workflow with no reference or expansion', () => {
  const { workflow: w, meta } = buildComfyWorkflow(payload, 42);
  assert.equal(meta.resolution, '2k');
  assert.equal(meta.aspectRatio, '1:1');
  assert.equal(meta.width, 2048);
  assert.equal(meta.height, 2048);
  assert.equal(w['30'].inputs.prompt, payload.prompt);
  assert.equal(w['30'].inputs.width, 2048);
  assert.equal(w['39'].inputs.seed, 42);
  assert.equal(w['1'].inputs.unet_name, 'minimax_h3_image_pruned_int8_convrot.safetensors');
  assert.equal(w['2'].inputs.clip_name, 'qwen3vl_32b_minimax_h3_int8_convrot.safetensors');
  assert.equal(w['3'].inputs.vae_name, 'minimax_h3_image_vae_fp16.safetensors');
  assert.equal(w['39'].class_type, 'KSampler');
  assert.deepEqual(w['39'].inputs, { model: ['1', 0], positive: ['30', 0], negative: ['31', 0], latent_image: ['30', 1], seed: 42, steps: 6, cfg: 1, sampler_name: 'euler', scheduler: 'simple', denoise: 1 });
  assert.deepEqual(w['33'].inputs.samples, ['39', 0]);
  assert.equal(Object.keys(w).length, 8);
  assert.ok(!Object.values(w).some(n => /LoadImage|TextGenerate|Lora/.test(n.class_type)));
  assert.throws(() => buildComfyWorkflow({ ...payload, count: 2 }), /每個任務固定一張/);
  assert.throws(() => buildComfyWorkflow({ ...payload, resolution: '1k' }), /解析度/);
  assert.throws(() => buildComfyWorkflow({ ...payload, aspectRatio: '4:5' }), /比例/);
  assert.throws(() => buildComfyWorkflow({ ...payload, loraStrength: 1 }), /不支援/);
  const result = parseComfyJob({ id: 'job', status: 'succeeded', outputs: [
    { id: 'ignore', node_id: '9', type: 'image' }, { id: 'final', node_id: '34', type: 'image', content_type: 'image/png' },
  ] }, meta);
  assert.deepEqual(result.images.map(x => x.assetId), ['final']);
});

test('official H3 graph excludes old LCM cost samples and still resolves old output node', () => {
  const { normalizeWorkflow } = require('../src/comfyQuota');
  const old = require('./fixtures/minimaxH3Image-lcm-20261114.json');
  const current = buildComfyWorkflow(payload, 42);
  assert.notDeepEqual(normalizeWorkflow(old, 'minimaxH3Image'), normalizeWorkflow(current.workflow, 'minimaxH3Image'));
  const result = parseComfyJob({id:'old-job',status:'succeeded',outputs:[{id:'old-image',node_id:'34',type:'image',content_type:'image/png'}]}, {modelKey:'minimaxH3Image',seed:42,width:2048,height:2048});
  assert.equal(result.images[0].assetId,'old-image');
});

test('all eight H3 ratios at 4/8/16 MP match official ResolutionSelector at 32 px', () => {
  const { quotaSelection } = require('../src/comfyQuota');
  const ratios=['1:1','4:3','3:4','3:2','2:3','16:9','9:16','21:9'];
  for(const [resolution,mp] of [['2k',4],['8mp',8],['16mp',16]]) for(const aspectRatio of ratios){
    const [a,b]=aspectRatio.split(':').map(Number), scale=Math.sqrt(mp*1024*1024/(a*b));
    const expected=[Math.round(a*scale/32)*32,Math.round(b*scale/32)*32];
    const input={...payload,resolution,aspectRatio};
    const {workflow:w,meta}=buildComfyWorkflow(input,17);
    assert.deepEqual([meta.width,meta.height],expected);
    assert.deepEqual([w['30'].inputs.width,w['30'].inputs.height],expected);
    assert.deepEqual([quotaSelection(input).meta.width,quotaSelection(input).meta.height],expected);
    assert.equal(w['39'].inputs.sampler_name,'euler');
  }
  assert.deepEqual([buildComfyWorkflow({...payload,resolution:'16mp',aspectRatio:'9:16'},0).meta.width,buildComfyWorkflow({...payload,resolution:'16mp',aspectRatio:'9:16'},0).meta.height],[3072,5472]);
  assert.throws(()=>buildComfyWorkflow({...payload,resolution:'32mp'}),/解析度/);
  assert.throws(()=>buildComfyWorkflow({modelKey:'zImageTurbo',prompt:'A cup',resolution:'16mp'}),/解析度/);
});
