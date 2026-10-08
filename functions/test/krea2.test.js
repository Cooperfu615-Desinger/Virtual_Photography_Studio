const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildComfyWorkflow, submitComfyJob, readComfyJob, generateComfySeed } = require('../src/comfyCloud');
const { IMAGE_PROVIDER_CONTRACT, normalizeGenerationRequest } = require('../src/providerContract');

const variants = [
  ['krea2Medium', 'Krea 2 Medium'],
  ['krea2MediumTurbo', 'Krea 2 Medium Turbo'],
  ['krea2Large', 'Krea 2 Large'],
];
const ratios = ['1:1', '4:3', '16:9', '9:16', '4:5'];
const source = 'A red ceramic mug.\nExact lettering: DLL.\n--ar 4:5';
const payload = modelKey => ({ modelKey, prompt: source, count: 1, resolution: '1k', aspectRatio: '4:5' });
const requestId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

test('Krea variants preserve the supplied node controls and use native ratio without inventing pixel sizes', () => {
  for (const [key, name] of variants) for (const aspectRatio of ratios) {
    const { workflow, meta } = buildComfyWorkflow({ ...payload(key), aspectRatio,
      creativity: 'high', moodboard_id: 'untrusted', workflow: { arbitrary: {} } }, 2147483647);
    assert.deepEqual(Object.keys(workflow), ['1', '2']);
    assert.equal(workflow['1'].class_type, 'Krea2ImageNode');
    assert.deepEqual(workflow['1'].inputs, {
      prompt: source, model: name, 'model.aspect_ratio': aspectRatio,
      'model.resolution': '1K', 'model.creativity': 'medium',
      'model.moodboard_id': '', 'model.moodboard_strength': 0.35, seed: 2147483647,
    });
    assert.equal(workflow['2'].class_type, 'SaveImage');
    assert.deepEqual(workflow['2'].inputs.images, ['1', 0]);
    assert.equal(meta.width, null);
    assert.equal(meta.height, null);
    assert.equal(meta.aspectRatio, aspectRatio);
    assert.equal(meta.resolution, '1k');
    assert.equal(meta.seed, 2147483647);
  }
});

test('Krea rejects unsupported ratio, resolution and out-of-range seed before any paid call', async () => {
  for (const [key] of variants) {
    assert.throws(() => buildComfyWorkflow(payload(key), 2147483648), /Seed/);
    assert.throws(() => buildComfyWorkflow(payload(key), -1), /Seed/);
    assert.throws(() => buildComfyWorkflow(payload(key), 1.5), /Seed/);
    for (const override of [{ aspectRatio: '3:4' }, { resolution: '2k' }, { count: 2 }]) {
      await assert.rejects(submitComfyJob({ apiKey: 'fixture',
        payload: { ...payload(key), requestId, ...override },
        store: { claim: () => { throw Error('invalid request must not be claimed'); } },
        fetchImpl: () => { throw Error('invalid request must not reach a provider'); },
      }), /不支援|每個任務固定一張/);
    }
  }
});

test('DLL total count can be two while every Comfy backend job remains exactly one image', () => {
  for (const [key, model] of Object.entries(IMAGE_PROVIDER_CONTRACT.providers.comfyCloud.models)) {
    assert.equal(model.maxCount, 2);
    assert.equal(model.oneImagePerJob, true);
    assert.equal(normalizeGenerationRequest('comfyCloud', { ...payload(key), count: 99 }).count, 2);
    assert.throws(() => buildComfyWorkflow({ ...payload(key), count: 2 }, 1), /每個任務固定一張/);
  }
});

test('Krea random seeds stay within the official signed 32-bit range', () => {
  for (const [key] of variants) {
    const seed = buildComfyWorkflow(payload(key)).meta.seed;
    assert.ok(Number.isInteger(seed) && seed >= 0 && seed <= 2147483647);
  }
});

test('sequential Comfy jobs exclude the previous valid seed without retrying or changing explicit fixture seeds', () => {
  for (const limit of [2 ** 31, 2 ** 48 - 1]) {
    for (const previousSeed of [0, 1, limit - 1]) {
      for (const sample of [0, 1, limit - 2]) {
        let calls = 0;
        const actual = generateComfySeed(limit, previousSeed, (min, max) => {
          calls += 1; assert.equal(min, 0); assert.equal(max, limit - 1); return sample;
        });
        assert.equal(calls, 1);
        assert.notEqual(actual, previousSeed);
        assert.ok(actual >= 0 && actual < limit);
      }
    }
    for (const previousSeed of [-1, limit, '1', undefined]) {
      assert.equal(generateComfySeed(limit, previousSeed, (min, max) => {
        assert.equal(min, 0); assert.equal(max, limit); return 1;
      }), 1);
    }
  }
  for (const key of Object.keys(IMAGE_PROVIDER_CONTRACT.providers.comfyCloud.models)) {
    assert.equal(buildComfyWorkflow({ ...payload(key), previousSeed: 7 }, 7).meta.seed, 7);
    assert.notEqual(buildComfyWorkflow({ ...payload(key), previousSeed: 0 }).meta.seed, 0);
  }
});

test('a lost Krea submit response stays uncertain and cannot submit the same job again', async () => {
  for (const [key] of variants) {
    let record; let paidCalls = 0;
    const store = {
      claim: async (_, value) => { if (record) return { claimed: false }; record = value; return { claimed: true }; },
      update: async (_, value) => { record = { ...record, ...value }; },
      get: async () => record,
    };
    const request = { apiKey: 'fixture', payload: { ...payload(key), requestId }, store,
      fetchImpl: async () => { paidCalls += 1; throw Error('lost response'); } };
    await assert.rejects(submitComfyJob(request), /lost response/);
    assert.equal((await submitComfyJob(request)).status, 'uncertain');
    assert.equal((await readComfyJob({ ...request, requestId })).status, 'uncertain');
    assert.equal(paidCalls, 1);
  }
});

test('the original one-image Z and Qwen request bodies retain their exact serialized workflow bytes', async () => {
  for (const [key, textNode, textKey, latent, sampler] of [
    ['zImageTurbo', '57:27', 'text', '57:13', '57:3'],
    ['qwenImage21', '459:452', 'prompt', '459:456', '459:458'],
  ]) {
    const expected = structuredClone(require(`../src/comfyWorkflows/${key}.json`));
    expected[textNode].inputs[textKey] = source;
    // Original 1K 4:5 single-image canvas, frozen independently of the builder.
    expected[latent].inputs.width = 928; expected[latent].inputs.height = 1160;
    let sent;
    const store = {
      claim: async (_, record) => { expected[sampler].inputs.seed = record.meta.seed; return { claimed: true }; },
      update: async () => {},
    };
    await submitComfyJob({ apiKey: 'fixture', payload: { ...payload(key), requestId }, store,
      fetchImpl: async (_, options) => { sent = options.body; return { ok: true, json: async () => ({ id: 'job', status: 'queued' }) }; } });
    assert.equal(sent, JSON.stringify({ workflow: expected }));
  }
});
