const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildVideoWorkflow, videoSettings, parseInputPng, submitVideoJob, readVideoJob, prepareVideoSource, resolveVideoAsset, readVideoQuota } = require('../src/comfyVideo');
const ID = '12345678-1234-1234-1234-123456789abc';
const SOURCE = '22345678-1234-1234-1234-123456789abc';
const JOB = '32345678-1234-1234-1234-123456789abc';
const ASSET = '42345678-1234-1234-1234-123456789abc';
const payload = { requestId: ID, sourceId: SOURCE, modelKey: 'wan3', resolution: '720P', duration: 5, audio: false, motion: 'Turn slowly', camera: 'Push in' };
const response = data => ({ ok: true, json: async () => data });
function store() {
  const records = new Map([[SOURCE, { kind: 'source', assetId: ASSET, width: 576, height: 1024 }]]);
  return { records, get: async id => records.get(id), claim: async (id, data) => {
    if (records.has(id)) return { claimed: false };
    records.set(id, data); return { claimed: true };
  }, update: async (id, patch) => records.set(id, { ...records.get(id), ...patch }) };
}

test('two explicit I2V graphs bind owned input, motion/camera, final MP4 and real model capabilities', () => {
  const wan = buildVideoWorkflow(payload, { assetId: ASSET }, 7);
  assert.equal(wan.workflow['1'].inputs.image.info.id, ASSET);
  assert.equal(wan.workflow['2'].class_type, 'Wan3ImageToVideoApi');
  assert.equal(wan.workflow['2'].inputs['model.prompt'], 'Turn slowly\nPush in');
  assert.equal(wan.workflow['2'].inputs['model.duration'], '5');
  assert.equal(wan.workflow['2'].inputs['model.prompt_extend'], false);
  assert.equal(wan.workflow['2'].inputs['model.ratio'], 'adaptive');
  assert.deepEqual(wan.workflow['3'].inputs, { video: ['2', 0], filename_prefix: 'DLL_Video', format: 'mp4', 'format.codec': 'h264', 'format.codec.encoding': 'auto' });
  const h3 = buildVideoWorkflow({ ...payload, modelKey: 'minimaxH3', resolution: '768P', audio: true }, { assetId: ASSET }, 7);
  assert.equal(h3.workflow['2'].class_type, 'MinimaxHailuo03FirstLastFrameNode');
  assert.equal(h3.workflow['2'].inputs['model.duration'], 5);
  assert.equal(h3.workflow['2'].inputs['model.audio'], undefined);
  for (const patch of [{ modelKey: '__proto__' }, { duration: 1 }, { duration: 5.5 }, { resolution: '2K' }, { audio: 'false' },
    { modelKey: 'minimaxH3', resolution: '720P', audio: true }, { modelKey: 'minimaxH3', resolution: '768P', audio: false }]) {
    assert.throws(() => videoSettings({ ...payload, ...patch }));
  }
  assert.throws(() => buildVideoWorkflow({ ...payload, motion: '' }, { assetId: ASSET }));
});

test('input limits inspect PNG dimensions, disallow silent crops and reject arbitrary URL uploads', () => {
  const bytes = Buffer.alloc(33); Buffer.from('89504e470d0a1a0a', 'hex').copy(bytes); bytes.write('IHDR', 12); bytes.writeUInt32BE(576, 16); bytes.writeUInt32BE(1024, 20);
  const png = () => `data:image/png;base64,${bytes.toString('base64')}`;
  assert.equal(parseInputPng(png()).width, 576);
  bytes.writeUInt32BE(10, 16); assert.throws(() => parseInputPng(png()), /比例/);
  assert.throws(() => parseInputPng('https://example.org/image.png'), /PNG/);
});

test('new sources are scoped to store; duplicate upload is not a new paid job', async () => {
  const storage = store(); let calls = 0;
  const source = await prepareVideoSource({ apiKey: 'secret', payload: { sourceId: SOURCE }, store: storage, fetchImpl: () => { calls++; } });
  assert.equal(source.sourceId, SOURCE); assert.equal(calls, 0);
  await assert.rejects(submitVideoJob({ apiKey: 'secret', payload: { ...payload, sourceId: JOB }, store: storage }), /此帳號/);
});

test('submit has one paid POST, server-only partner credential, and repeated calls only poll', async () => {
  const storage = store(); const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options }); return response({ id: JOB, status: 'queued' });
  };
  const options = { apiKey: 'secret', payload, store: storage, fetchImpl };
  await Promise.all([submitVideoJob(options), submitVideoJob(options)]);
  assert.equal(calls.filter(call => call.options.method === 'POST').length, 1);
  assert.equal(JSON.parse(calls[0].options.body).extra_data.api_key_comfy_org, 'secret');
  assert.ok(!JSON.stringify([...storage.records]).includes('secret'));
  assert.ok(!JSON.stringify([...storage.records]).includes('Turn slowly'));
  await submitVideoJob(options); assert.equal(calls.at(-1).options.method, 'GET');
});

test('lost response and duplicate idempotency response stay uncertain without resubmission', async () => {
  for (const status of [0, 409, 503]) {
    const storage = store(); let paid = 0;
    const options = { apiKey: 'secret', payload, store: storage, fetchImpl: async () => {
      paid++; if (!status) throw new Error('lost'); return { ok: false, status, json: async () => ({}) };
    } };
    await assert.rejects(submitVideoJob(options));
    const retry = await submitVideoJob(options);
    assert.equal(retry.status, 'uncertain'); assert.equal(paid, 1);
  }
});

test('completed job resolves exactly one final video and refreshes expiring asset URL', async () => {
  const storage = store(); await storage.claim(ID, { kind: 'video', jobId: JOB, meta: payload });
  let assets = 0;
  const fetchImpl = async url => {
    if (url.includes('/assets/')) { assets++; return response({ id: ASSET, file_path: 'output.mp4', url: `https://cdn.example.org/clip.mp4?v=${assets}` }); }
    return response({ id: JOB, status: 'succeeded', outputs: [{ node_id: '3', id: ASSET, type: 'video' }, { node_id: '2', id: SOURCE, type: 'image' }] });
  };
  const options = { apiKey: 'secret', payload, store: storage, fetchImpl };
  const first = await readVideoJob(options); const second = await readVideoJob(options);
  assert.equal(first.video.mimeType, 'video/mp4'); assert.notEqual(first.video.src, second.video.src);
  assert.equal((await storage.get(ID)).outputAssetId, ASSET);
  await assert.rejects(readVideoJob({ ...options, fetchImpl: async () => response({ id: JOB, status: 'succeeded', outputs: [] }) }), /尚未取得/);
  await assert.rejects(resolveVideoAsset({ apiKey: 'secret', assetId: ASSET, fetchImpl: async () => response({ id: ASSET, content_type: 'image/png', url: 'https://example.org/x.png' }) }), /格式/);
  await assert.rejects(resolveVideoAsset({ apiKey: 'secret', assetId: ASSET, fetchImpl: async () => response({ id: ASSET, content_type: 'video/mp4', url: 'https://cloud.comfy.org/api/v2/assets/x/content' }) }), /格式/);
});

test('quota uses current per-second model rates and missing balance never means zero', async () => {
  const base = { apiKey: 'secret', payload, fetchImpl: async () => response({ summary: { balance: { currency: 'USD', amount_micros: 1000 } } }) };
  const result = await readVideoQuota(base);
  assert.equal(result.credits, 2110); assert.equal(result.estimatedCredits, 150.85); assert.equal(result.estimatedVideos, 13);
  const missing = await readVideoQuota({ ...base, fetchImpl: async () => response({}) });
  assert.equal(missing.credits, null); assert.equal(missing.estimatedVideos, null);
});

test('new PNG upload uses multipart v2 assets and records no image payload', async () => {
  const storage = store(); const bytes = Buffer.alloc(33);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(bytes); bytes.write('IHDR', 12); bytes.writeUInt32BE(576, 16); bytes.writeUInt32BE(1024, 20);
  let calls = 0;
  const result = await prepareVideoSource({ apiKey: 'secret', payload: { sourceId: JOB, src: `data:image/png;base64,${bytes.toString('base64')}` }, store: storage,
    fetchImpl: async (url, options) => {
      calls++; assert.ok(url.endsWith('/assets')); assert.equal(options.body.get('content_type'), 'image/png');
      assert.equal(options.body.get('file').size, 33); assert.equal(options.headers.Authorization, 'Bearer secret');
      return response({ id: ASSET });
    } });
  assert.equal(result.width, 576); assert.equal(calls, 1);
  assert.equal(storage.records.get(JOB).assetId, ASSET);
  assert.ok(!JSON.stringify([...storage.records]).includes('base64'));
});

test('authenticated owned download validates ranges, bounds, DNS and complete bytes without forwarding credentials', async () => {
  const { sendVideoDownloadChunk } = require('../src/comfyVideo');
  const storage = store(); storage.records.set(ID, { kind: 'video', outputAssetId: ASSET });
  const size = 6 * 1024 * 1024; const calls = [];
  const headers = {}; let downloaded;
  const options = { apiKey: 'secret', requestId: ID, store: storage,
    lookupImpl: async () => [{ address: '8.8.8.8', family: 4 }],
    response: { setHeader: (key, value) => { headers[key] = value; }, send: data => { downloaded = data; } },
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      if (url.includes('/assets/')) return response({ id: ASSET, url: 'https://media.example.org/video.mp4', content_type: 'video/mp4' });
      assert.equal(init.headers.Authorization, undefined); assert.equal(init.headers.Range, `bytes=${size}-${2 * size - 1}`);
      return new Response(Buffer.from('mp4'), { status: 206, headers: { 'content-type': 'video/mp4', 'content-range': `bytes ${size}-${size + 2}/${size + 3}` } });
    } };
  await sendVideoDownloadChunk({ ...options, offset: size });
  assert.equal(downloaded.toString(), 'mp4'); assert.equal(headers['X-Video-Total'], String(size + 3));
  assert.equal(headers['X-Video-Asset'], ASSET); assert.equal(calls.length, 2);
  await assert.rejects(sendVideoDownloadChunk({ ...options, offset: 1 }), /位置/);
  await assert.rejects(sendVideoDownloadChunk({ ...options, requestId: JOB }), /此帳號/);
  await assert.rejects(sendVideoDownloadChunk({ ...options, lookupImpl: async () => [{ address: '127.0.0.1', family: 4 }] }));
  await assert.rejects(sendVideoDownloadChunk({ ...options, offset: size, fetchImpl: async url => url.includes('/assets/')
    ? response({ id: ASSET, url: 'https://media.example.org/video.mp4', content_type: 'video/mp4' })
    : new Response('ab', { status: 206, headers: { 'content-type': 'video/mp4', 'content-range': `bytes ${size}-${size + 2}/${size + 3}` } }) }), /不完整/);
});

test('new callable denies anonymous, disallowed and changed-account requests before provider access', async () => {
  const { comfyCloudVideo } = require('../index');
  await assert.rejects(comfyCloudVideo.run({ data: { action: 'submit' } }), error => error.code === 'unauthenticated');
  await assert.rejects(comfyCloudVideo.run({ auth: { uid: 'a', token: { email: 'not-allowed@example.org' } }, data: {} }), error => error.code === 'permission-denied');
  const email = (process.env.ALLOWED_FIREBASE_EMAILS || 'cooperfu.615@gmail.com').split(',')[0].trim();
  await assert.rejects(comfyCloudVideo.run({ auth: { uid: 'a', token: { email } }, data: { expectedUid: 'b', action: 'submit' } }), /帳號/);
});
