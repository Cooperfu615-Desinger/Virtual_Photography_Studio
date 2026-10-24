const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildComfyWorkflow, parseComfyJob, submitComfyJob } = require('../src/comfyCloud');
const { getProviderModelContract, normalizeGenerationRequest } = require('../src/providerContract');
const { createQuotaReader, readComfyQuota } = require('../src/comfyQuota');

const models = ['mossImageSftInt8', 'mossImageSftInt8Lora'];
const prompt = 'A fully clothed adult at a cafe.\nExact sign: DLL.\n--ar 4:5';
const payload = modelKey => ({ modelKey, prompt, aspectRatio: '1:1', resolution: '1k', count: 1 });
const ids = Array.from({ length: 6 }, (_, index) => `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee${index}`);
const importedLora = 'Nailai__moss-image-comfy-lora__moss_image_axiomofmind_comfy_native_naming.safetensors';

test('MOSS variants preserve direct prompt and verified sampling, differing only by the fixed model adapter', () => {
  const base = buildComfyWorkflow(payload(models[0]), 42);
  const adapted = buildComfyWorkflow(payload(models[1]), 42);
  for (const { workflow: w, meta } of [base, adapted]) {
    assert.equal(w['18:1'].inputs.unet_name, 'moss_image_sft_int8_convrot.safetensors');
    assert.deepEqual(w['18:2'].inputs, { clip_name: 'qwen3.5_9b_w4a8_gptq.safetensors', type: 'moss_image', device: 'default' });
    assert.equal(w['18:3'].inputs.vae_name, 'flux2-vae_small.safetensors');
    assert.equal(w['18:4'].inputs.text, prompt);
    assert.equal(w['18:5'].inputs.text, 'nsfw, worst quality, bad anatomy, watermark, jpeg artifact');
    assert.deepEqual(w['18:6'], { class_type: 'EmptyFlux2LatentImage', inputs: { width: 1024, height: 1024, batch_size: 1 } });
    assert.deepEqual(w['18:7'].inputs, { seed: 42, steps: 30, cfg: 3, sampler_name: 'euler', scheduler: 'simple', denoise: 1,
      model: [meta.modelKey === models[0] ? '18:1' : '18:25', 0], positive: ['18:4', 0], negative: ['18:5', 0], latent_image: ['18:6', 0] });
    assert.deepEqual(w['18:8'].inputs, { samples: ['18:7', 0], vae: ['18:3', 0] });
    assert.deepEqual(w['9'].inputs.images, ['18:8', 0]);
    assert.ok(!Object.values(w).some(node => ['TextGenerate', 'ComfySwitchNode', 'ResolutionSelector', 'SkipLayerGuidanceDiTSimple'].includes(node.class_type)));
    assert.equal(meta.seed, 42);
  }
  assert.equal(Object.keys(base.workflow).length, 9);
  assert.equal(Object.keys(adapted.workflow).length, 10);
  assert.deepEqual(adapted.workflow['18:25'], { class_type: 'LoraLoaderModelOnly', inputs: {
    lora_name: importedLora, strength_model: 0.7, model: ['18:1', 0] } });
  const withoutAdapter = structuredClone(adapted.workflow);
  delete withoutAdapter['18:25'];
  withoutAdapter['18:7'].inputs.model = ['18:1', 0];
  assert.deepEqual(withoutAdapter, base.workflow);
  // Each request receives a clone, so a prior job cannot alter the next one's template.
  adapted.workflow['18:25'].inputs.strength_model = 0;
  assert.equal(buildComfyWorkflow(payload(models[1]), 42).workflow['18:25'].inputs.strength_model, 0.7);
});

test('both MOSS variants expose one-megapixel six-ratio canvases with a single image per job', () => {
  const dimensions = { '1:1': [1024, 1024], '4:3': [1152, 864], '3:4': [864, 1152],
    '16:9': [1280, 720], '9:16': [720, 1280], '4:5': [896, 1120] };
  for (const modelKey of models) {
    const { model } = getProviderModelContract('comfyCloud', modelKey);
    assert.deepEqual(model.resolutions, ['1k']);
    assert.equal(model.maxCount, 2);
    assert.equal(model.oneImagePerJob, true);
    assert.deepEqual(model.aspectRatios, Object.keys(dimensions));
    assert.equal(normalizeGenerationRequest('comfyCloud', { modelKey, prompt }).count, 1);
    for (const [aspectRatio, [width, height]] of Object.entries(dimensions)) {
      const built = buildComfyWorkflow({ ...payload(modelKey), aspectRatio }, 123);
      assert.deepEqual([built.meta.width, built.meta.height], [width, height]);
      assert.equal(width % 16, 0);
      assert.equal(height % 16, 0);
      assert.deepEqual(built.workflow['18:6'].inputs, { width, height, batch_size: 1 });
    }
    for (const resolution of ['2k', '3k']) assert.throws(() => buildComfyWorkflow({ ...payload(modelKey), resolution }, 1), /解析度/);
    assert.throws(() => buildComfyWorkflow({ ...payload(modelKey), aspectRatio: '21:9' }, 1), /比例/);
    assert.throws(() => buildComfyWorkflow({ ...payload(modelKey), count: 2 }, 1), /每個任務固定一張/);
    for (const seed of [-1, 0.5, 2 ** 48 - 1]) assert.throws(() => buildComfyWorkflow(payload(modelKey), seed), /Seed/);
    for (const seed of [0, 42, 2 ** 48 - 2]) assert.equal(buildComfyWorkflow(payload(modelKey), seed).meta.seed, seed);
  }
});

test('MOSS cannot accept arbitrary LoRA, sampling, negative prompt, graph or credential overrides', () => {
  for (const modelKey of models) {
    const clean = buildComfyWorkflow(payload(modelKey), 42);
    const untrusted = buildComfyWorkflow({ ...payload(modelKey), workflow: { injected: {} },
      lora_name: 'untrusted.safetensors', strength_model: 100, steps: 1, cfg: 100,
      negativePrompt: '', enable_prompt_upsampler: true,
      extra_data: { api_key_comfy_org: 'untrusted-token' } }, 42);
    assert.deepEqual(untrusted, clean);
  }
});

test('MOSS final images are limited to its verified SaveImage output', () => {
  for (const modelKey of models) {
    const result = parseComfyJob({ id: ids[0], status: 'succeeded', outputs: [
      { id: ids[1], node_id: '9', type: 'image', content_type: '' },
      { id: ids[2], node_id: '18:8', type: 'image', content_type: 'image/png' },
      { id: ids[3], node_id: '9', type: 'text' },
    ] }, { modelKey });
    assert.deepEqual(result.images.map(image => image.assetId), [ids[1]]);
  }
});

test('MOSS paid requests use no partner credential and duplicate IDs preserve the original variant', async () => {
  for (const modelKey of models) {
    let record; const calls = [];
    const store = {
      claim: async (_, value) => { if (record) return { claimed: false }; record = value; return { claimed: true }; },
      get: async () => record,
      update: async (_, value) => { record = { ...record, ...value }; },
    };
    const fetchImpl = async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => ({ id: ids[1], status: 'queued' }) };
    };
    const request = { apiKey: 'server-only-secret', store, fetchImpl,
      payload: { ...payload(modelKey), requestId: ids[0], extra_data: { api_key_comfy_org: 'untrusted-token' } } };
    await submitComfyJob(request);
    const duplicate = await submitComfyJob({ ...request, payload: { ...request.payload,
      modelKey: models.find(key => key !== modelKey) } });
    assert.deepEqual(calls.map(call => call.options.method), ['POST', 'GET']);
    const body = JSON.parse(calls[0].options.body);
    assert.deepEqual(Object.keys(body), ['workflow']);
    assert.equal(duplicate.meta.modelKey, modelKey);
    assert.equal(record.meta.modelKey, modelKey);
    for (const secret of ['server-only-secret', 'untrusted-token']) {
      assert.ok(!JSON.stringify(body).includes(secret));
      assert.ok(!JSON.stringify(record).includes(secret));
      assert.ok(!JSON.stringify(duplicate).includes(secret));
    }
  }
  let claimed = false;
  await assert.rejects(submitComfyJob({ apiKey: 'fixture', payload: { ...payload('arbitraryMossVariant'), requestId: ids[0] },
    store: { claim: async () => { claimed = true; } }, fetchImpl: async () => { throw Error('must not submit'); } }), /Unsupported/);
  assert.equal(claimed, false);
});

function quotaFixture() {
  const built = models.map(modelKey => buildComfyWorkflow(payload(modelKey), 42));
  const records = ids.map((jobId, index) => ({ jobId, meta: built[index < 3 ? 0 : 1].meta }));
  const calls = [];
  let alteredStrength = false;
  const fetchImpl = async url => {
    calls.push(url);
    let body;
    if (url.includes('/billing/')) body = { summary: { balance: { currency: 'USD', amount_micros: 100 } } };
    else {
      const jobId = url.split('/').at(url.endsWith('/workflow') ? -2 : -1);
      if (url.endsWith('/workflow')) {
        const workflow = structuredClone(built[ids.indexOf(jobId) < 3 ? 0 : 1].workflow);
        if (alteredStrength && workflow['18:25']) workflow['18:25'].inputs.strength_model = 0.5;
        body = { format: 'api', workflow };
      } else body = { id: jobId, status: 'succeeded', metrics: { execution_ms: ids.indexOf(jobId) < 3 ? 10000 : 20000 },
        outputs: [{ type: 'image', node_id: '9' }] };
    }
    return { ok: true, json: async () => body };
  };
  return { records, calls, fetchImpl, changeStrength: () => { alteredStrength = true; } };
}

test('MOSS quota uses separate base and LoRA samples and rejects other adapter strengths', async () => {
  const fixture = quotaFixture();
  const request = { apiKey: 'fixture', records: fixture.records, fetchImpl: fixture.fetchImpl };
  for (let index = 0; index < models.length; index++) {
    const result = await readComfyQuota({ ...request, payload: payload(models[index]) });
    assert.equal(result.selection.modelKey, models[index]);
    assert.equal(result.sampleCount, 3);
    assert.equal(result.creditsPerImage, (index + 1) * 2.66);
    assert.equal(result.estimatedImages, Math.floor(211 / result.creditsPerImage));
  }
  fixture.changeStrength();
  assert.equal((await readComfyQuota({ ...request, payload: payload(models[1]) })).sampleCount, 0);
  assert.equal((await readComfyQuota({ ...request, payload: payload(models[0]) })).sampleCount, 3);
});

test('MOSS quota caches coalesce each variant independently without sharing their estimates', async () => {
  const fixture = quotaFixture();
  const read = createQuotaReader({ now: () => 1 });
  let listReads = 0;
  const request = { uid: 'fixture-owner', apiKey: 'fixture', fetchImpl: fixture.fetchImpl,
    listRecords: async () => { listReads++; return fixture.records; } };
  const results = await Promise.all([models[0], models[1], models[0], models[1]].map(modelKey => read({ ...request, payload: payload(modelKey) })));
  assert.equal(listReads, 2);
  assert.equal(fixture.calls.filter(url => url.includes('/billing/')).length, 2);
  assert.equal(results[0], results[2]);
  assert.equal(results[1], results[3]);
  assert.notEqual(results[0].creditsPerImage, results[1].creditsPerImage);
});
