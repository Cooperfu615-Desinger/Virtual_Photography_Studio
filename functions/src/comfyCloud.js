const { randomInt } = require('node:crypto');
const { normalizeGenerationRequest } = require('./providerContract');
const templates = {
  zImageTurbo: require('./comfyWorkflows/zImageTurbo.json'),
  qwenImage21: require('./comfyWorkflows/qwenImage21.json'),
};
const BASE = 'https://cloud.comfy.org/api/v2/jobs';

function validateRequestId(id) {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(String(id || ''))) throw new Error('無效的任務識別碼');
  return id;
}

function buildComfyWorkflow(payload, seed = randomInt(0, 2 ** 48 - 1)) {
  if (payload.aspectRatio && !['1:1', '4:3', '3:4', '16:9', '9:16', '4:5'].includes(payload.aspectRatio)) throw new Error('不支援的 Comfy Cloud 比例');
  if (payload.resolution && !['1k', '2k'].includes(payload.resolution)) throw new Error('不支援的 Comfy Cloud 解析度');
  const input = normalizeGenerationRequest('comfyCloud', payload);
  if (Number(payload.count ?? 1) !== 1) throw new Error('Comfy Cloud 第一版每次只生成一張');
  const [a, b] = input.aspectRatio.split(':').map(Number);
  const unit = Math.max(1, Math.round(Math.sqrt((input.resolution === '2k' ? 4 : 1) * 1048576 / (a * b)) / 8));
  const width = a * unit * 8;
  const height = b * unit * 8;
  const workflow = structuredClone(templates[input.modelKey]);
  const z = input.modelKey === 'zImageTurbo';
  workflow[z ? '57:27' : '459:452'].inputs[z ? 'text' : 'prompt'] = input.prompt;
  workflow[z ? '57:13' : '459:456'].inputs.width = width;
  workflow[z ? '57:13' : '459:456'].inputs.height = height;
  workflow[z ? '57:3' : '459:458'].inputs.seed = seed;
  return { workflow, meta: { modelKey: input.modelKey, aspectRatio: input.aspectRatio, resolution: input.resolution, width, height, seed } };
}

function getJobUrl(job) {
  const url = new URL(job.urls?.self || `${BASE}/${encodeURIComponent(job.id)}`, BASE);
  if (url.origin !== 'https://cloud.comfy.org' || !url.pathname.startsWith('/api/v2/jobs/') || url.username || url.password) throw new Error('無效的 Comfy Cloud 任務網址');
  return url.href;
}

async function callComfy(apiKey, url = BASE, options = {}, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    ...options,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...options.headers },
    signal: AbortSignal.timeout(45000), redirect: 'error',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = String(body.error?.message || '').slice(0, 500);
    const error = new Error(`Comfy Cloud 請求失敗（HTTP ${response.status}）${detail ? `：${detail}` : ''}`);
    error.status = response.status;
    error.definitive = response.status >= 400 && response.status < 500 && response.status !== 408;
    throw error;
  }
  return body;
}

function parseComfyJob(job, meta) {
  if (!job?.id || !['queued', 'running', 'succeeded', 'canceling', 'canceled', 'failed', 'expired'].includes(job.status)) {
    throw new Error('Comfy Cloud 任務回應格式不符，請保留任務繼續查詢');
  }
  const outputNode = meta.modelKey === 'zImageTurbo' ? '9' : '461';
  // Output.url is authenticated and must never be passed to a browser as src.
  // Cloud workers can leave MIME empty; retain final image assets for metadata lookup.
  const images = (job.outputs || []).filter((output) => output.type === 'image' && output.node_id === outputNode
    && (!output.content_type || output.content_type.startsWith('image/'))).map((output) => ({
    mimeType: output.content_type, assetId: output.id,
  }));
  return {
    jobId: job.id, status: job.status, queuePosition: job.queue_position ?? null,
    progress: job.progress ?? null, images,
    errors: job.error ? [String(job.error.message || job.error.code || 'Comfy Cloud 任務失敗')] : [],
    meta: { ...meta, provider: 'comfyCloud', jobId: job.id, expiresAt: job.expires_at ?? null },
  };
}

async function resolveComfyImages(job, meta, apiKey, fetchImpl) {
  const result = parseComfyJob(job, meta);
  if (result.status !== 'succeeded') return { ...result, images: [] };
  if (!result.images.length) console.warn('Comfy Cloud output mismatch', JSON.stringify({
    jobId: job.id, modelKey: meta.modelKey,
    outputs: (job.outputs || []).slice(0, 10).map(({ node_id, type, content_type }) => ({ node_id, type, content_type })),
  }));
  result.images = await Promise.all(result.images.map(async (image) => {
    const id = validateRequestId(image.assetId);
    const asset = await callComfy(apiKey, `https://cloud.comfy.org/api/v2/assets/${id}`, { method: 'GET' }, fetchImpl);
    const url = new URL(asset.url);
    // Both controlled final SaveImage nodes emit PNG. Live Cloud metadata can
    // omit MIME in both records; only infer it from the matching PNG asset path.
    const mimeType = asset.content_type || (/\.png$/i.test(asset.file_path || '') ? 'image/png' : null);
    if (asset.id !== id || !mimeType?.startsWith('image/') || url.protocol !== 'https:' || url.username || url.password
      || (url.origin === 'https://cloud.comfy.org' && url.pathname.startsWith('/api/v2/assets/'))) {
      console.warn('Comfy Cloud asset mismatch', JSON.stringify({ jobId: job.id, contentType: asset.content_type, urlOrigin: url.origin, urlPath: url.pathname, queryKeys: [...url.searchParams.keys()] }));
      throw new Error('Comfy Cloud 圖片下載網址格式不符，請保留任務繼續查詢');
    }
    return { ...image, src: url.href, mimeType, expiresAt: asset.url_expires_at ?? null };
  }));
  return result;
}

// The store claims a request transactionally before making a paid call. A lost
// response remains uncertain; neither a timeout nor a repeated callable reposts it.
async function submitComfyJob({ apiKey, payload, store, fetchImpl = fetch }) {
  const requestId = validateRequestId(payload.requestId);
  const { workflow, meta } = buildComfyWorkflow(payload);
  const claim = await store.claim(requestId, { phase: 'submitting', meta, createdAt: Date.now() });
  if (!claim.claimed) return readComfyJob({ apiKey, requestId, store, fetchImpl });
  try {
    const job = await callComfy(apiKey, BASE, {
      method: 'POST', headers: { 'Idempotency-Key': requestId }, body: JSON.stringify({ workflow }),
    }, fetchImpl);
    // Persist the ID before parsing output so malformed output cannot lose a job.
    if (!job?.id || typeof job.id !== 'string') throw new Error('Comfy Cloud 未回傳任務 ID');
    await store.update(requestId, { phase: 'submitted', jobId: job.id });
    await store.update(requestId, { self: getJobUrl(job) });
    return resolveComfyImages(job, meta, apiKey, fetchImpl);
  } catch (error) {
    await store.update(requestId, { phase: error.definitive ? 'rejected' : 'uncertain' });
    throw error;
  }
}

async function readComfyJob({ apiKey, requestId, store, fetchImpl = fetch }) {
  const record = await store.get(validateRequestId(requestId));
  if (!record) throw new Error('找不到此帳號的任務');
  if (!record.jobId) return {
    status: record.phase === 'rejected' ? 'rejected' : 'uncertain', images: [], errors: [], meta: record.meta,
  };
  let job;
  try {
    job = await callComfy(apiKey, getJobUrl({ id: record.jobId, urls: { self: record.self } }), { method: 'GET' }, fetchImpl);
  } catch (error) {
    if (error.status === 410) return { status: 'expired', images: [], errors: ['Comfy Cloud 任務已到期，請至雲端確認保存的圖像'], meta: record.meta };
    throw error;
  }
  if (job.id !== record.jobId) throw new Error('Comfy Cloud 任務 ID 不一致');
  return resolveComfyImages(job, record.meta, apiKey, fetchImpl);
}

module.exports = { buildComfyWorkflow, parseComfyJob, submitComfyJob, readComfyJob, validateRequestId };
