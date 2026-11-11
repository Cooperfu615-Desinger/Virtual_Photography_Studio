'use strict';

// These sizes keep edges divisible by 16 and stay within the Images API's
// supported pixel limits. The displayed ratios are approximate when necessary.
const SIZES = Object.freeze({
  '1k': { '1:1': '1024x1024', '4:3': '1152x864', '3:4': '864x1152', '16:9': '1360x768', '9:16': '768x1360', '4:5': '1024x1280' },
  '2k': { '1:1': '1920x1920', '4:3': '2048x1536', '3:4': '1536x2048', '16:9': '2048x1152', '9:16': '1152x2048', '4:5': '1632x2048' },
});

// Only recognized provider codes are retained; arbitrary provider text can contain user data.
const PROVIDER_CODES = new Set([
  'content_policy_violation', 'moderation_blocked', 'image_content_policy_violation',
  'rate_limit_exceeded', 'insufficient_quota', 'invalid_api_key', 'model_not_found',
]);
const MODERATION_CODES = new Set(['content_policy_violation', 'moderation_blocked', 'image_content_policy_violation']);
class OpenAIImageError extends Error {
  constructor(kind, status = null, code = null) {
    super('OpenAI 圖片生成未完成');
    this.kind = kind;
    this.status = Number.isInteger(status) && status >= 100 && status <= 599 ? status : null;
    this.providerCode = typeof code !== 'string' || !code ? null : PROVIDER_CODES.has(code) ? code : 'other';
  }
}
function classifyOpenAIImageError(error) {
  if (!(error instanceof OpenAIImageError)) return { reason: 'openai_unknown', httpStatus: null, providerCode: null };
  let reason = 'openai_unknown';
  if (error.kind === 'connection') reason = 'openai_connection';
  else if (error.kind === 'invalid_response') reason = 'openai_invalid_response';
  else if (error.kind === 'provider') reason = error.status === 400 && MODERATION_CODES.has(error.providerCode)
    ? 'openai_moderation' : 'openai_provider_error';
  return { reason, httpStatus: error.status, providerCode: error.providerCode };
}
function mapOpenAIImageFailure(error) {
  const classification = classifyOpenAIImageError(error);
  const { reason, httpStatus } = classification;
  if (reason === 'openai_moderation') return { classification, functionCode: 'invalid-argument',
    message: 'OpenAI 內容審核未通過，請調整描述後再手動生成。' };
  if (reason === 'openai_provider_error' && [401, 403].includes(httpStatus)) return { classification, functionCode: 'permission-denied',
    message: 'OpenAI 金鑰或模型權限有問題' };
  if (reason === 'openai_provider_error' && httpStatus === 429) return { classification, functionCode: 'resource-exhausted',
    message: 'OpenAI 額度不足或已達速率限制，請查看帳務與限制' };
  if (reason === 'openai_connection') return { classification, functionCode: 'unavailable',
    message: 'OpenAI 連線中斷，生成結果與扣額未能確認；請先檢查用量，不會自動重送。' };
  return { classification, functionCode: 'unavailable',
    message: 'OpenAI 生成回應異常，結果與扣額未能確認；請先檢查用量，不會自動重送。' };
}
function reportOpenAIImageFailure(error, log) {
  const failure = mapOpenAIImageFailure(error);
  log('OpenAI image generation failed', failure.classification);
  return failure;
}

const MODELS = Object.freeze({ openaiImage2: 'gpt-image-2', openaiImage26Flare: 'gpt-image-2.6-flare', openaiImage26Sunburst: 'gpt-image-2.6-sunburst' });
const FORMATS = Object.freeze({ png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' });
const MAX_REFERENCE_BYTES = 2 * 1024 * 1024;
function checkedPng(value, label) {
  if (typeof value !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new Error(`${label}必須是 PNG 圖片`);
  const bytes = Buffer.from(value.slice(value.indexOf(',') + 1), 'base64');
  if (bytes.length < 33 || bytes.length > MAX_REFERENCE_BYTES || !bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) || bytes.toString('ascii', 12, 16) !== 'IHDR') throw new Error(`${label}格式不符或超過 2 MB`);
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (!width || !height || width > 4096 || height > 4096 || width * height > 16777216) throw new Error(`${label}尺寸超出限制`);
  return { width, height, colorType: bytes[25] };
}
function buildOpenAIImageRequest(input = {}) {
  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
  if (prompt.length < 3 || prompt.length > 30000) throw new Error('Prompt 長度需為 3 至 30000 字元');
  const modelKey = input.modelKey ?? 'openaiImage2';
  const model = MODELS[modelKey];
  if (!Object.hasOwn(MODELS, modelKey)) throw new Error('不支援的 OpenAI 模型');
  const legacy = modelKey === 'openaiImage2';
  const count = input.count ?? 1;
  if (count !== 1 && !(count === 4 && !legacy && input.outputFormat !== 'svg')) throw new Error('此模型或格式不支援指定張數');
  let size = SIZES[input.resolution]?.[input.aspectRatio];
  if (!legacy && (input.resolution === 'auto' || input.outputFormat === 'gif')) size = 'auto';
  if (!legacy && input.resolution === 'custom' && input.outputFormat !== 'gif') {
    const w = input.customWidth, h = input.customHeight;
    if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0 || w > 3840 || h > 3840 || w % 16 || h % 16 || Math.max(w,h) / Math.min(w,h) > 3 || w*h < 655360 || w*h > 8294400) throw new Error('自訂尺寸不符合限制');
    size = `${w}x${h}`;
  }
  if (!size) throw new Error('不支援的比例或解析度');
  const quality = input.quality ?? 'medium';
  if (!(legacy ? ['low', 'medium', 'high'] : ['auto', 'low', 'medium', 'high', 'xhigh', 'max']).includes(quality)) throw new Error('不支援的畫質');
  if (legacy) return { model, prompt, n: 1, size, quality, output_format: 'png' };
  const mode = input.imageMode ?? 'generate', format = input.outputFormat ?? 'png';
  const complexity = input.complexity ?? 'high', background = input.background ?? 'auto', moderation = input.moderation ?? 'auto';
  if (!['generate', 'edit'].includes(mode) || !Object.hasOwn(FORMATS, format) || !['low', 'medium', 'high'].includes(complexity) || !['auto', 'opaque', 'transparent'].includes(background) || !['auto', 'low'].includes(moderation)) throw new Error('不支援的 OpenAI 圖片設定');
  if (mode === 'edit' && ['gif', 'svg'].includes(format)) throw new Error('圖片編輯僅支援 PNG、JPEG 或 WebP');
  if (background === 'transparent' && !['png', 'webp', 'svg'].includes(format)) throw new Error('透明背景僅支援 PNG、WebP 或 SVG');
  const body = { model, prompt, n: count, size, quality, complexity, background, moderation, output_format: format };
  if (['jpeg', 'webp'].includes(format)) {
    const compression = input.outputCompression ?? 100;
    if (!Number.isInteger(compression) || compression < 0 || compression > 100) throw new Error('壓縮品質需介於 0 至 100');
    body.output_compression = compression;
  }
  if (format === 'gif') {
    const gifSize = input.gifSize ?? 'auto';
    if (!['auto', '512x512', '768x432', '432x768'].includes(gifSize)) throw new Error('不支援的 GIF 尺寸');
    body.size = gifSize;
    const frames = input.frameCount ?? 9, duration = input.frameDurationMs ?? 200;
    if (!Number.isInteger(frames) || frames < 2 || frames > 16 || !Number.isInteger(duration) || duration < 20 || duration > 2000) throw new Error('GIF 影格數或間隔不支援');
    Object.assign(body, { frame_count: frames, frame_duration_ms: duration });
  }
  if (mode === 'edit') {
    const main = checkedPng(input.referenceImage, '參考圖片');
    body.images = [{ image_url: input.referenceImage }];
    if (input.mask && input.markup) throw new Error('遮罩與標記圖無法同時使用');
    for (const key of ['mask', 'markup']) if (input[key]) {
      const overlay = checkedPng(input[key], key === 'mask' ? '遮罩' : '標記圖');
      if (overlay.width !== main.width || overlay.height !== main.height || ![4, 6].includes(overlay.colorType)) throw new Error('遮罩或標記圖需與參考圖尺寸相同，並具有透明通道');
      body[key] = { image_url: input[key] };
    }
  } else if (input.referenceImage || input.mask || input.markup) throw new Error('文字生圖不可包含參考圖片');
  return body;
}
async function generateOpenAIImage({ apiKey, input, fetchImpl = fetch }) {
  const body = buildOpenAIImageRequest(input);
  let response;
  try {
    response = await fetchImpl(`https://api.openai.com/v1/images/${input.imageMode === 'edit' && body.model !== 'gpt-image-2' ? 'edits' : 'generations'}`, {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(240000), redirect: 'error',
    });
  } catch { throw new OpenAIImageError('connection'); }
  let data;
  try { data = await response.json(); }
  catch { throw new OpenAIImageError('invalid_response', response.status); }
  if (!response.ok) throw new OpenAIImageError('provider', response.status, data?.error?.code);
  const items = data?.data;
  if (!Array.isArray(items) || !items.length || items.length > body.n) throw new OpenAIImageError('invalid_response', response.status);
  const mimeType = FORMATS[body.output_format];
  const images = [];
  for (const item of items) {
    const encoded = item?.b64_json;
    if (typeof encoded === 'string' && encoded.length <= 40 * 1024 * 1024 && /^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
      images.push({ src: `data:${mimeType};base64,${encoded}`, mimeType });
    }
  }
  if (!images.length) throw new OpenAIImageError('invalid_response', response.status);
  return { images, errors: [], meta: { model: body.model, size: body.size, quality: body.quality, ...(body.complexity ? { complexity: body.complexity, background: body.background, moderation: body.moderation, outputFormat: body.output_format } : {}) } };
}

async function submitOpenAIImage({ apiKey, input, requestId, store, generate = generateOpenAIImage }) {
  buildOpenAIImageRequest(input);
  const claim = await store.claim(requestId, { phase: 'submitting', createdAt: Date.now() });
  if (!claim.claimed) { const error = new Error('此請求已提交，請先檢查 OpenAI 用量；不會自動重送'); error.duplicate = true; throw error; }
  try {
    const result = await generate({ apiKey, input });
    await store.update(requestId, { phase: 'succeeded', completedAt: Date.now() });
    return result;
  } catch (error) {
    const phase = classifyOpenAIImageError(error).reason === 'openai_moderation' ? 'rejected' : 'uncertain';
    await store.update(requestId, { phase, completedAt: Date.now() }).catch(() => {});
    throw error;
  }
}
module.exports = { SIZES, buildOpenAIImageRequest, generateOpenAIImage, submitOpenAIImage, classifyOpenAIImageError, mapOpenAIImageFailure, reportOpenAIImageFailure };
