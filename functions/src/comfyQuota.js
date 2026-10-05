const { isDeepStrictEqual } = require('node:util');
const { createHash } = require('node:crypto');
const { buildComfyWorkflow } = require('./comfyCloud');

// Official Cloud rates verified 2026-10-05. This is an estimate, not billed cost.
const CREDITS_PER_USD = 211;
const CREDITS_PER_SECOND = 0.266;
const MIN_SAMPLES = 3;
const MAX_SAMPLES = 8;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

function quotaSelection(payload = {}) {
  if (!['zImageTurbo', 'qwenImage21'].includes(payload.modelKey)
    || !['1k', '2k'].includes(payload.resolution)
    || !['1:1', '4:3', '3:4', '16:9', '9:16', '4:5'].includes(payload.aspectRatio)) {
    throw new Error('不支援的 Comfy Cloud 額度查詢設定');
  }
  return buildComfyWorkflow({ modelKey: payload.modelKey, resolution: payload.resolution,
    aspectRatio: payload.aspectRatio, count: 1, prompt: 'quota reference' }, 0);
}

function normalizeWorkflow(workflow, modelKey) {
  if (!workflow || typeof workflow !== 'object' || Array.isArray(workflow)) return null;
  const copy = structuredClone(workflow);
  for (const node of Object.values(copy)) {
    if (!node || typeof node !== 'object') return null;
    delete node._meta;
  }
  const z = modelKey === 'zImageTurbo';
  const text = copy[z ? '57:27' : '459:452']?.inputs;
  const sampler = copy[z ? '57:3' : '459:458']?.inputs;
  if (!text || !sampler) return null;
  text[z ? 'text' : 'prompt'] = '';
  sampler.seed = 0;
  return copy;
}

function balanceCredits(body) {
  const balance = body?.summary?.balance;
  // This API's balance is cents despite the _micros suffix; missing is not zero.
  if (balance?.currency !== 'USD' || typeof balance.amount_micros !== 'number'
    || !Number.isFinite(balance.amount_micros)) return null;
  return balance.amount_micros / 100 * CREDITS_PER_USD;
}

async function readComfyQuota({ apiKey, payload, records, fetchImpl = fetch, now = Date.now }) {
  const { workflow, meta } = quotaSelection(payload);
  const reference = normalizeWorkflow(workflow, meta.modelKey);
  async function get(path, v2 = false) {
    const response = await fetchImpl(`https://cloud.comfy.org${path}`, {
      method: 'GET', redirect: 'error', signal: AbortSignal.timeout(6000),
      headers: v2 ? { Authorization: `Bearer ${apiKey}` } : { 'X-API-Key': apiKey },
    });
    if (!response.ok) throw new Error(`Comfy Cloud 查詢失敗（HTTP ${response.status}）`);
    return response.json();
  }
  const credits = balanceCredits(await get('/api/billing/usage/timeseries?months=1&group_by=product&granularity=month'));
  const seen = new Set();
  const candidates = records.filter((r) => {
    if (!uuid.test(r.jobId) || seen.has(r.jobId) || r.meta?.modelKey !== meta.modelKey
      || r.meta?.resolution !== meta.resolution || r.meta?.aspectRatio !== meta.aspectRatio
      || r.meta?.width !== meta.width || r.meta?.height !== meta.height) return false;
    seen.add(r.jobId);
    return true;
  }).slice(0, MAX_SAMPLES);
  const times = [];
  let sampleReadFailed = false;
  for (let i = 0; i < candidates.length; i += 4) {
    await Promise.all(candidates.slice(i, i + 4).map(async ({ jobId }) => {
      try {
        const job = await get(`/api/v2/jobs/${jobId}`, true);
        const ms = job.metrics?.execution_ms;
        const outputNode = meta.modelKey === 'zImageTurbo' ? '9' : '461';
        if (job.id !== jobId || job.status !== 'succeeded' || job.error
          || typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0 || ms > 3600000
          || !Array.isArray(job.outputs) || job.outputs.filter(o => o.type === 'image' && o.node_id === outputNode).length !== 1) return;
        const saved = await get(`/api/v2/jobs/${jobId}/workflow`, true);
        if (saved.format !== 'api' || !isDeepStrictEqual(normalizeWorkflow(saved.workflow, meta.modelKey), reference)) return;
        times.push(ms / 1000);
      } catch {
        sampleReadFailed = true;
      }
    }));
  }
  const meanSeconds = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null;
  const creditsPerImage = meanSeconds === null ? null : meanSeconds * CREDITS_PER_SECOND;
  const estimatedImages = credits !== null && times.length >= MIN_SAMPLES && !sampleReadFailed
    ? Math.floor(Math.max(0, credits) / creditsPerImage) : null;
  return { selection: { modelKey: meta.modelKey, resolution: meta.resolution, aspectRatio: meta.aspectRatio },
    credits, estimatedImages, sampleCount: times.length, minimumSamples: MIN_SAMPLES,
    creditsPerImage, sampleReadFailed, checkedAt: now(), rateDate: '2026-10-05' };
}

// In-memory, bounded, per-user cache also coalesces simultaneous panel requests.
function createQuotaReader({ now = Date.now } = {}) {
  const cache = new Map();
  return async (options) => {
    const { meta } = quotaSelection(options.payload);
    const key = JSON.stringify([options.uid, createHash('sha256').update(options.apiKey).digest('hex'), meta.modelKey, meta.resolution, meta.aspectRatio]);
    const previous = cache.get(key);
    if (previous && now() - previous.at < 30000) return previous.promise;
    if (cache.size >= 64) cache.delete(cache.keys().next().value);
    const entry = { at: now() };
    entry.promise = Promise.resolve().then(async () => readComfyQuota({ ...options, now, records: await options.listRecords() }));
    cache.set(key, entry);
    try { return await entry.promise; } catch (error) {
      if (cache.get(key) === entry) cache.delete(key);
      throw error;
    }
  };
}

module.exports = { balanceCredits, normalizeWorkflow, quotaSelection, readComfyQuota, createQuotaReader };
