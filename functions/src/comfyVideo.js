const { randomInt } = require('node:crypto');
const { validateRequestId } = require('./comfyCloud');
const { balanceCredits } = require('./comfyQuota');
const contract = require('./videoModels.json');
const pikaH3FlexWorkflow = require('./pikaH3FlexWorkflow.json');
const API = 'https://cloud.comfy.org/api/v2';
const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;

function videoSettings(payload) {
  const model = contract.models[payload.modelKey];
  if (!Object.hasOwn(contract.models, payload.modelKey) || !model.resolutions.includes(payload.resolution)
    || !Number.isInteger(payload.duration) || payload.duration < model.minDuration || payload.duration > model.maxDuration
    || typeof payload.audio !== 'boolean' || (!model.audioToggle && !payload.audio)) throw new Error('不支援的影片設定');
  const settings = { modelKey: payload.modelKey, resolution: payload.resolution, duration: payload.duration, audio: payload.audio };
  if (model.referenceImage) {
    if (!model.ratios.includes(payload.ratio || 'adaptive')) throw new Error('不支援的影片比例');
    settings.ratio = payload.ratio || 'adaptive';
  }
  return settings;
}

function parseInputPng(src) {
  if (typeof src !== 'string' || src.length > MAX_INPUT_BYTES * 4 / 3 + 100) throw new Error('來源圖片超過 8 MB，請改用較小圖片');
  const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(src);
  if (!match) throw new Error('來源圖片需為 PNG');
  const bytes = Buffer.from(match[1], 'base64');
  if (bytes.length < 33 || bytes.length > MAX_INPUT_BYTES || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
    || bytes.toString('ascii', 12, 16) !== 'IHDR') throw new Error('來源圖片格式不符');
  const width = bytes.readUInt32BE(16); const height = bytes.readUInt32BE(20);
  if (width < 256 || height < 256 || width > 8192 || height > 8192 || width * height > 32 * 1024 * 1024
    || width / height < 0.4 || width / height > 2.5) throw new Error('來源圖片需至少 256×256，比例介於 2:5 與 5:2；不會自動裁切');
  return { bytes, width, height };
}

async function api(apiKey, path, options = {}, fetchImpl = fetch) {
  const response = await fetchImpl(`${API}${path}`, { ...options, redirect: 'error', signal: AbortSignal.timeout(45000),
    headers: { Authorization: `Bearer ${apiKey}`, ...options.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Provider messages can contain prompts, credentials or signed URLs.
    const error = new Error(`Comfy Cloud 請求失敗（HTTP ${response.status}）`);
    error.status = response.status;
    error.definitive = response.status >= 400 && response.status < 500 && ![408, 409].includes(response.status);
    throw error;
  }
  return body;
}

async function prepareVideoSource({ apiKey, payload, store, fetchImpl }) {
  const sourceId = validateRequestId(payload.sourceId);
  const previous = await store.get(sourceId);
  if (previous?.kind === 'source' && previous.assetId) return { sourceId, width: previous.width, height: previous.height };
  if (previous) throw new Error('圖片上傳尚未確認，請重新準備圖片');
  const { bytes, width, height } = parseInputPng(payload.src);
  if (!(await store.claim(sourceId, { kind: 'source', createdAt: Date.now() })).claimed) throw new Error('圖片正在上傳，請稍後再試');
  const form = new FormData();
  // Cloud's streaming multipart parser requires metadata before file bytes.
  form.set('content_type', 'image/png');
  form.set('file_path', `dll-video/${sourceId}.png`);
  form.set('file', new Blob([bytes], { type: 'image/png' }), `${sourceId}.png`);
  const asset = await api(apiKey, '/assets', { method: 'POST', body: form, headers: { 'Idempotency-Key': sourceId } }, fetchImpl);
  const assetId = validateRequestId(asset.id);
  await store.update(sourceId, { assetId, width, height });
  return { sourceId, width, height };
}

function buildVideoWorkflow(payload, source, seed = randomInt(0, 2147483647)) {
  const settings = videoSettings(payload);
  const motion = typeof payload.motion === 'string' ? payload.motion.trim() : '';
  const camera = typeof payload.camera === 'string' ? payload.camera.trim() : '';
  const prompt = [motion, camera].filter(Boolean).join('\n');
  if (!motion || prompt.length > 10000) throw new Error('請填寫動作描述，總長度不可超過 10,000 字');
  const model = contract.models[settings.modelKey];
  if (settings.modelKey === 'pikaH3Flex') {
    const workflow = structuredClone(pikaH3FlexWorkflow);
    workflow['1'].inputs.image = { __type: 'core/ASSET', info: { id: validateRequestId(source.assetId) } };
    workflow['140:131'].inputs.prompt = prompt;
    workflow['140:129'].inputs.noise_seed = seed;
    return { workflow, meta: { ...settings, sourceId: payload.sourceId, width: source.width, height: source.height, seed, mediaType: 'video' } };
  }
  const inputs = { model: model.model, 'model.prompt': prompt, 'model.resolution': settings.resolution,
    'model.duration': settings.modelKey === 'wan3' ? String(settings.duration) : settings.duration,
    first_frame: ['1', 0], seed, watermark: false };
  if (settings.modelKey === 'wan3') Object.assign(inputs, { 'model.ratio': 'adaptive', 'model.audio': settings.audio, 'model.prompt_extend': false });
  if (model.referenceImage) {
    if (!Number.isFinite(source.width) || !Number.isFinite(source.height) || source.width < 300 || source.height < 300
      || source.width / source.height < 0.4 || source.width / source.height > 2.5) throw new Error('Seedance 來源圖片需至少 300×300，比例介於 2:5 與 5:2');
    delete inputs.first_frame;
    Object.assign(inputs, { 'model.reference_images.image_1': ['1', 0], 'model.ratio': settings.ratio,
      'model.generate_audio': settings.audio, 'model.task_type': 'reference', 'model.output_format': 'mp4',
      'model.auto_downscale': true, 'model.auto_upscale': false });
  }
  return { workflow: {
    '1': { class_type: 'LoadImage', inputs: { image: { __type: 'core/ASSET', info: { id: validateRequestId(source.assetId) } } } },
    '2': { class_type: model.node, inputs },
    '3': { class_type: 'SaveVideo', inputs: { video: ['2', 0], filename_prefix: 'DLL_Video', format: 'mp4', 'format.codec': 'h264', 'format.codec.encoding': 'auto' } },
  }, meta: { ...settings, sourceId: payload.sourceId, width: source.width, height: source.height, seed, mediaType: 'video' } };
}

async function resolveVideoAsset({ apiKey, assetId, fetchImpl }) {
  const id = validateRequestId(assetId);
  const asset = await api(apiKey, `/assets/${id}`, { method: 'GET' }, fetchImpl);
  let url;
  try { url = new URL(asset.url); } catch { throw new Error('影片連結暫時無法取得，請重新查詢'); }
  const mimeType = asset.content_type || (/\.mp4$/i.test(asset.file_path || '') ? 'video/mp4' : '');
  if (asset.id !== id || mimeType !== 'video/mp4' || url.protocol !== 'https:' || url.username || url.password
    || url.origin === 'https://cloud.comfy.org') throw new Error('影片連結格式不符，請重新查詢');
  return { assetId: id, src: url.href, mimeType, expiresAt: asset.url_expires_at || null };
}

async function videoJobResult({ apiKey, job, record, requestId, store, fetchImpl }) {
  const statuses = ['queued', 'running', 'succeeded', 'canceling', 'canceled', 'failed', 'expired'];
  if (!statuses.includes(job.status) || job.id !== record.jobId) throw new Error('影片作業回應不符，請保留追蹤並重新查詢');
  const result = { requestId, status: job.status, meta: record.meta, queuePosition: job.queue_position ?? null,
    error: job.status === 'failed' ? '模型未完成影片生成，請至 Comfy Cloud 查看作業詳情' : '' };
  if (job.status !== 'succeeded') return result;
  // Cloud may label SaveVideo as legacy type=image; accept only explicit MP4 in that case.
  const outputs = (job.outputs || []).filter(o => o.node_id === '3'
    && ((o.type === 'video' && (!o.content_type || o.content_type === 'video/mp4'))
      || (o.type === 'image' && o.content_type === 'video/mp4')));
  if (outputs.length !== 1) throw new Error('作業已完成但影片尚未取得，請重新查詢；不會重新生成');
  const assetId = validateRequestId(outputs[0].id);
  await store.update(requestId, { outputAssetId: assetId });
  return { ...result, video: await resolveVideoAsset({ apiKey, assetId, fetchImpl }) };
}

async function readVideoJob({ apiKey, payload, store, fetchImpl }) {
  const requestId = validateRequestId(payload.requestId);
  const record = await store.get(requestId);
  if (record?.kind !== 'video') throw new Error('找不到此帳號的影片作業');
  if (!record.jobId) return { requestId, status: record.phase === 'rejected' ? 'rejected' : 'uncertain', meta: record.meta };
  try {
    const job = await api(apiKey, `/jobs/${validateRequestId(record.jobId)}`, { method: 'GET' }, fetchImpl);
    return await videoJobResult({ apiKey, job, record, requestId, store, fetchImpl });
  } catch (error) {
    if (error.status === 410) return { requestId, status: 'expired', meta: record.meta, error: '影片保存期限已過，請至 Comfy Cloud 確認' };
    throw error;
  }
}

async function submitVideoJob({ apiKey, payload, store, fetchImpl }) {
  const requestId = validateRequestId(payload.requestId);
  // Repeats are read-only, even when the uploaded source has since expired.
  if (await store.get(requestId)) return readVideoJob({ apiKey, payload, store, fetchImpl });
  const source = await store.get(validateRequestId(payload.sourceId));
  if (source?.kind !== 'source' || !source.assetId) throw new Error('請先準備此帳號的來源圖片');
  const { workflow, meta } = buildVideoWorkflow(payload, source);
  if (!(await store.claim(requestId, { kind: 'video', phase: 'submitting', meta, createdAt: Date.now() })).claimed) {
    return readVideoJob({ apiKey, payload, store, fetchImpl });
  }
  let job;
  try {
    job = await api(apiKey, '/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestId },
      body: JSON.stringify({ workflow, extra_data: { api_key_comfy_org: apiKey } }) }, fetchImpl);
    validateRequestId(job.id);
    await store.update(requestId, { jobId: job.id, phase: 'submitted' });
  } catch (error) {
    await store.update(requestId, { phase: error.definitive ? 'rejected' : 'uncertain' });
    throw error;
  }
  return videoJobResult({ apiKey, job, record: { jobId: job.id, meta }, requestId, store, fetchImpl });
}

async function readVideoQuota({ apiKey, payload, fetchImpl = fetch }) {
  const settings = videoSettings(payload);
  const response = await fetchImpl('https://cloud.comfy.org/api/billing/usage/timeseries?months=1&group_by=product&granularity=month', {
    headers: { 'X-API-Key': apiKey }, redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('額度查詢失敗，請稍後重新整理');
  const credits = balanceCredits(await response.json());
  const model = contract.models[settings.modelKey];
  if (model.unpriced) return { credits, estimatedCredits: null, estimatedVideos: null,
    checkedAt: Date.now(), rateDate: null, selection: settings };
  // Seedance uses 24 fps token estimates, not the Wan/MiniMax per-second tariff.
  // For adaptive ratio, budget the largest supported pixel area conservatively.
  const frames = model.tokensPerFrame?.[settings.resolution];
  const tokensPerFrame = frames && (frames[settings.ratio] || Math.max(...Object.values(frames)));
  const estimatedCredits = Number((frames
    ? tokensPerFrame * 24 * settings.duration / 1000 * model.creditsPerThousandTokens[settings.resolution]
    : model.creditsPerSecond[settings.resolution] * settings.duration).toFixed(2));
  return { credits, estimatedCredits, estimatedVideos: credits === null ? null : Math.floor(Math.max(0, credits) / estimatedCredits),
    checkedAt: Date.now(), rateDate: model.rateDate || contract.rateDate, selection: settings };
}

async function videoOperation(options) {
  const operations = { prepare: prepareVideoSource, submit: submitVideoJob, status: readVideoJob, quota: readVideoQuota };
  const operation = operations[options.payload.action];
  if (!Object.hasOwn(operations, options.payload.action)) throw new Error('不支援的影片操作');
  return operation(options);
}

// Bounded chunks stay below the Functions HTTP response limit. Only account-owned
// assets are accepted; credentials never accompany the signed media request.
async function sendVideoDownloadChunk({ apiKey, requestId, offset = 0, store, response, fetchImpl = fetch, lookupImpl }) {
  const chunkSize = 6 * 1024 * 1024;
  if (!Number.isSafeInteger(offset) || offset < 0 || offset >= MAX_VIDEO_BYTES || offset % chunkSize) throw new Error('影片下載位置不符');
  const record = await store.get(validateRequestId(requestId));
  if (record?.kind !== 'video' || !record.outputAssetId) throw new Error('找不到此帳號已完成的影片');
  const asset = await resolveVideoAsset({ apiKey, assetId: record.outputAssetId, fetchImpl });
  const { assertPublicDownloadHost } = require('./imageDownloadProxy');
  await assertPublicDownloadHost(new URL(asset.src).hostname, lookupImpl);
  const remote = await fetchImpl(asset.src, {
    headers: { Range: `bytes=${offset}-${offset + chunkSize - 1}` },
    redirect: 'error', signal: AbortSignal.timeout(60000),
  });
  const mime = remote.headers.get('content-type')?.split(';')[0];
  if (!remote.ok || !['video/mp4', 'application/octet-stream'].includes(mime) || !remote.body) throw new Error('影片下載失敗，請重新查詢影片');
  const range = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(remote.headers.get('content-range') || '');
  const total = remote.status === 206 && range ? Number(range[3]) : Number(remote.headers.get('content-length'));
  const expected = Math.min(chunkSize, total - offset);
  if (!Number.isSafeInteger(total) || total <= offset || total > MAX_VIDEO_BYTES
    || (remote.status === 206 ? !range || Number(range[1]) !== offset || Number(range[2]) !== offset + expected - 1
      : remote.status !== 200 || offset !== 0 || total > chunkSize)) throw new Error('影片大小或分段格式不符，請至 Comfy Cloud 下載');
  const chunks = []; let bytes = 0;
  for await (const chunk of remote.body) {
    bytes += chunk.length;
    if (bytes > expected) throw new Error('影片分段超過上限');
    chunks.push(Buffer.from(chunk));
  }
  if (bytes !== expected) throw new Error('影片下載不完整，請重試下載');
  response.setHeader('Content-Type', 'video/mp4');
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('Access-Control-Expose-Headers', 'X-Video-Total, X-Video-Asset');
  response.setHeader('X-Video-Total', String(total));
  response.setHeader('X-Video-Asset', asset.assetId);
  response.send(Buffer.concat(chunks));
}

module.exports = { videoSettings, parseInputPng, buildVideoWorkflow, videoOperation, readVideoJob,
  submitVideoJob, prepareVideoSource, resolveVideoAsset, readVideoQuota, sendVideoDownloadChunk };
