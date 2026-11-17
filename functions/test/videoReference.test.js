const { test } = require('node:test');
const assert = require('node:assert/strict');
const { inspectReferenceMp4, validateVideoReference } = require('../shared/videoReference.mjs');
const { buildVideoWorkflow, videoOperation, readVideoQuota } = require('../src/comfyVideo');
const id = n => `${n}2345678-1234-1234-1234-123456789abc`;
function mp4(duration = 5, codec = 'avc1') {
  const box = (name, ...parts) => { const body = Buffer.concat(parts); const b = Buffer.alloc(8); b.writeUInt32BE(body.length + 8); b.write(name, 4); return Buffer.concat([b, body]); };
  const timing = Buffer.alloc(24); timing.writeUInt32BE(1000, 12); timing.writeUInt32BE(duration * 1000, 16);
  const track = Buffer.alloc(84); track.writeUInt32BE(1280 * 65536, 76); track.writeUInt32BE(720 * 65536, 80);
  const handler = Buffer.alloc(12); handler.write('vide', 8);
  return Buffer.concat([box('ftyp', Buffer.from('isom0000')), box('moov', box('mvhd', timing), box('trak', box('tkhd', track),
    box('mdia', box('hdlr', handler), box('mdhd', timing), box('minf', box('stbl', box('stsd', Buffer.alloc(8), box(codec, Buffer.alloc(78)))))))), box('mdat', Buffer.from('fixture'))]);
}
const source = { kind: 'source', assetId: id(1), width: 1280, height: 720 };
const reference = { kind: 'referenceVideo', assetId: id(2), metadata: inspectReferenceMp4(mp4()) };
const input = { modelKey: 'seedance25', duration: 5, resolution: '720p', ratio: '16:9', audio: false, motion: 'A boat moving slowly', camera: 'Slow pan' };
test('shared MP4 inspection rejects bad containers, codecs, lengths and dimensions', () => {
  assert.equal(inspectReferenceMp4(mp4()).duration, 5);
  for (const bytes of [mp4(1), mp4(16), mp4(5, 'hvc1'), mp4().subarray(0, 70), Buffer.alloc(21 * 1024 * 1024)]) assert.throws(() => inspectReferenceMp4(bytes));
  assert.throws(() => validateVideoReference({ duration: 5, width: 256, height: 256 }, 'seedance25'), /409,600/);
  assert.throws(() => validateVideoReference({ duration: Infinity, width: 1280, height: 720 }));
});
test('single reference branches retain prompt and source with correct video/image inputs, old paths unchanged', () => {
  for (const modelKey of ['seedance25', 'minimaxH3']) {
    const payload = { ...input, modelKey, resolution: modelKey === 'seedance25' ? '720p' : '768P', audio: modelKey === 'minimaxH3' };
    const graph = buildVideoWorkflow(payload, source, 7, reference).workflow;
    assert.equal(graph['4'].class_type, 'LoadVideo');
    assert.equal(graph['4'].inputs.file.info.id, id(2));
    assert.deepEqual(graph['2'].inputs['model.reference_videos.video_1'], ['4', 0]);
    assert.deepEqual(graph['2'].inputs['model.reference_images.image_1'], ['1', 0]);
    assert.equal(graph['2'].inputs.first_frame, undefined);
    assert.equal(graph['2'].inputs['model.prompt'], input.motion + '\n' + input.camera);
    if (modelKey === 'minimaxH3') {
      assert.equal(graph['2'].class_type, 'MinimaxHailuo03ReferenceNode');
      assert.equal(buildVideoWorkflow(payload, source, 7).workflow['2'].class_type, 'MinimaxHailuo03FirstLastFrameNode');
    }
    assert.equal(buildVideoWorkflow(payload, source, 7).workflow['4'], undefined);
  }
});
test('reference upload validates bytes, stores metadata, reuses uploaded ID and never creates a paid job', async () => {
  const records = new Map(); const calls = [];
  const store = { get: async key => records.get(key), claim: async (key, v) => { records.set(key, v); return { claimed: true }; }, update: async (key, v) => records.set(key, { ...records.get(key), ...v }) };
  const fetchImpl = async (url, opts) => { calls.push(url); assert.deepEqual([...opts.body.keys()], ['content_type', 'file_path', 'file']); return { ok: true, json: async () => ({ id: id(2) }) }; };
  const payload = { action: 'prepareReference', modelKey: 'seedance25', sourceId: id(3), base64: mp4().toString('base64'), duration: 1 };
  const result = await videoOperation({ apiKey: 'test', payload, store, fetchImpl });
  assert.equal(result.duration, 5); assert.equal(records.get(id(3)).kind, 'referenceVideo');
  await videoOperation({ apiKey: 'test', payload, store, fetchImpl }); assert.equal(calls.length, 1);
  await assert.rejects(videoOperation({ payload: { ...payload, modelKey: 'wan3' }, store }), /不支援/);
});
test('foreign/missing reference prevents paid submission and ignores untrusted URLs', async () => {
  const store = { get: async key => key === id(1) ? source : null };
  const options = { payload: { ...input, action: 'submit', sourceId: id(1), requestId: id(4), referenceVideoId: id(2), referenceUrl: 'https://example.org/x' }, store,
    fetchImpl: () => { throw new Error('must not call'); } };
  await assert.rejects(videoOperation(options), /此帳號的參考影片/);
  await assert.rejects(videoOperation({ ...options, payload: { ...options.payload, referenceVideoId: null, referenceVideo: reference.metadata } }), /準備參考影片/);
});
test('quotes include measured reference seconds and with-video tariff; removal returns old quote', async () => {
  const quote = patch => readVideoQuota({ apiKey: 'test', payload: { ...input, ...patch }, fetchImpl: async () => ({ ok: true, json: async () => ({}) }) });
  assert.equal((await quote({ referenceVideo: reference.metadata })).estimatedCredits, 418.83);
  assert.equal((await quote({})).estimatedCredits, 348.73);
  assert.equal((await quote({ modelKey: 'minimaxH3', audio: true, resolution: '768P', referenceVideo: reference.metadata })).estimatedCredits, 271.6);
  await assert.rejects(quote({ referenceVideo: { ...reference.metadata, duration: -1 } }), /2～15/);
});
