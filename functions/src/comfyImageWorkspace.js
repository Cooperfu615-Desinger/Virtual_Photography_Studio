const { randomInt } = require('node:crypto');
const { validateRequestId, callComfy, getJobUrl, readComfyJob } = require('./comfyCloud');
const { prepareVideoSource } = require('./comfyVideo');
const API = 'https://cloud.comfy.org/api/v2';

// Adapted from Comfy-Org's utility_seedvr2_7b_int8_upscale_image template.
// Only reviewed fixed nodes are accepted; no client-supplied workflow or model path.
function buildUpscaleWorkflow(source, scale, seed = randomInt(0, 2 ** 48 - 1)) {
  if (![2, 4].includes(scale) || source.width * scale > 8192 || source.height * scale > 8192
    || source.width * source.height * scale * scale > 32 * 1024 * 1024) throw new Error('放大結果上限為 8192 邊長及 32 MP，請選擇較小倍率');
  const node = (class_type, inputs) => ({ class_type, inputs });
  return {
    '1': node('LoadImage', { image: { __type: 'core/ASSET', info: { id: validateRequestId(source.assetId) } } }),
    '50': node('JoinImageWithAlpha', { image: ['1', 0], alpha: ['1', 1] }),
    '51': node('VAELoader', { vae_name: 'seedvr2_ema_vae_fp16.safetensors' }),
    '52': node('UNETLoader', { unet_name: 'seedvr2_7b_int8_convrot.safetensors', weight_dtype: 'default' }),
    '57': node('ResizeImageMaskNode', { input: ['50', 0], resize_type: 'scale by multiplier', 'resize_type.multiplier': scale, scale_method: 'lanczos' }),
    '58': node('SeedVR2Preprocess', { resized_images: ['57', 0] }),
    '48': node('VAEEncodeTiled', { pixels: ['58', 0], vae: ['51', 0], tile_size: 512, overlap: 128, temporal_size: 4096, temporal_overlap: 8 }),
    '61': node('SeedVR2Conditioning', { model: ['52', 0], vae_conditioning: ['48', 0] }),
    '54': node('KSampler', { model: ['52', 0], positive: ['61', 0], negative: ['61', 1], latent_image: ['48', 0], seed, steps: 1, cfg: 1, sampler_name: 'euler', scheduler: 'simple', denoise: 1 }),
    '55': node('VAEDecodeTiled', { samples: ['54', 0], vae: ['51', 0], tile_size: 512, overlap: 128, temporal_size: 4096, temporal_overlap: 8 }),
    '59': node('SeedVR2PostProcessing', { images: ['55', 0], original_resized_images: ['57', 0], color_correction_method: 'none' }),
    '9': node('SaveImage', { images: ['59', 0], filename_prefix: 'DLL_Upscale' }),
  };
}
async function upscaleResult({ apiKey, job, record, fetchImpl }) {
  if (job.id !== record.jobId || !['queued', 'running', 'succeeded', 'canceling', 'canceled', 'failed', 'expired'].includes(job.status)) throw new Error('放大任務回應不符，請保留追蹤');
  const result = { status: job.status, progress: job.progress || null, queuePosition: job.queue_position ?? null,
    images: [], meta: record.meta, errors: job.status === 'failed' ? ['放大工作流未完成，請至 Comfy Cloud 確認節點及模型可用性'] : [] };
  if (job.status !== 'succeeded') return result;
  const outputs = (job.outputs || []).filter(o => o.node_id === '9' && o.type === 'image' && (!o.content_type || o.content_type.startsWith('image/')));
  if (outputs.length !== 1) throw new Error('放大已完成但圖片尚未取得，請重新查詢');
  const id = validateRequestId(outputs[0].id);
  const asset = await callComfy(apiKey, `${API}/assets/${id}`, {}, fetchImpl);
  const url = new URL(asset.url);
  const mimeType = asset.content_type || (/\.png$/i.test(asset.file_path || '') ? 'image/png' : '');
  if (asset.id !== id || !mimeType.startsWith('image/') || url.protocol !== 'https:' || url.username || url.password || url.origin === 'https://cloud.comfy.org') throw new Error('放大圖片連結不符，請重新查詢');
  return { ...result, images: [{ src: url.href, assetId: id, mimeType, meta: record.meta }] };
}
async function readUpscale(args) {
  const { apiKey, payload, store, fetchImpl } = args;
  const record = await store.get(validateRequestId(payload.requestId));
  if (record?.kind !== 'upscale') throw new Error('找不到此帳號的放大任務');
  if (!record.jobId) return { status: record.phase === 'rejected' ? 'rejected' : 'uncertain', images: [], meta: record.meta };
  try {
    const job = await callComfy(apiKey, `${API}/jobs/${validateRequestId(record.jobId)}`, {}, fetchImpl);
    return upscaleResult({ apiKey, job, record, fetchImpl });
  } catch (error) {
    if (error.status === 410) return { status: 'expired', images: [] };
    throw error;
  }
}
async function imageWorkspaceOperation(args) {
  const { apiKey, payload, store, imageStore, fetchImpl = fetch } = args;
  if (payload.action === 'prepare') return prepareVideoSource({ ...args, fetchImpl });
  if (payload.action === 'status') return readUpscale({ ...args, fetchImpl });
  if (payload.action === 'cancel') {
    const target = payload.kind === 'upscale' ? store : imageStore;
    const record = await target.get(validateRequestId(payload.requestId));
    if (!record?.jobId) throw new Error('尚無可取消的雲端任務，請先確認提交結果');
    const job = await callComfy(apiKey, `${getJobUrl({ id: record.jobId })}/cancel`, { method: 'POST' }, fetchImpl);
    if (!['canceling', 'canceled', 'succeeded', 'failed', 'expired'].includes(job.status)) throw new Error('取消尚未確認，請重新查詢');
    return { status: job.status };
  }
  if (payload.action !== 'submit') throw new Error('不支援的圖片操作');
  const requestId = validateRequestId(payload.requestId);
  if (await store.get(requestId)) return readUpscale({ ...args, fetchImpl });
  const source = await store.get(validateRequestId(payload.sourceId));
  if (source?.kind !== 'source' || !source.assetId) throw new Error('找不到此帳號的來源圖片');
  const seed = randomInt(0, 2 ** 48 - 1);
  const workflow = buildUpscaleWorkflow(source, payload.scale, seed);
  const meta = { modelKey: 'seedvr2', scale: payload.scale, seed, width: source.width * payload.scale, height: source.height * payload.scale };
  if (!(await store.claim(requestId, { kind: 'upscale', phase: 'submitting', meta, createdAt: Date.now() })).claimed) return readUpscale({ ...args, fetchImpl });
  try {
    const job = await callComfy(apiKey, `${API}/jobs`, { method: 'POST', headers: { 'Idempotency-Key': requestId }, body: JSON.stringify({ workflow }) }, fetchImpl);
    validateRequestId(job.id);
    await store.update(requestId, { jobId: job.id, phase: 'submitted' });
    return upscaleResult({ apiKey, job, record: { jobId: job.id, meta }, fetchImpl });
  } catch (error) {
    await store.update(requestId, { phase: error.definitive && error.status !== 409 ? 'rejected' : 'uncertain' });
    throw error;
  }
}
module.exports = { buildUpscaleWorkflow, imageWorkspaceOperation, readUpscale, readComfyJob };
