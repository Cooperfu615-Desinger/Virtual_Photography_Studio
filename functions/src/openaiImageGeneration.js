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

function buildOpenAIImageRequest(input = {}) {
  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
  if (prompt.length < 3 || prompt.length > 30000) throw new Error('Prompt 長度需為 3 至 30000 字元');
  const size = SIZES[input.resolution]?.[input.aspectRatio];
  if (!size) throw new Error('不支援的比例或解析度');
  const quality = input.quality ?? 'medium';
  if (!['low', 'medium', 'high'].includes(quality)) throw new Error('不支援的畫質');
  return { model: 'gpt-image-2', prompt, n: 1, size, quality, output_format: 'png' };
}

async function generateOpenAIImage({ apiKey, input, fetchImpl = fetch }) {
  const body = buildOpenAIImageRequest(input);
  let response;
  try {
    response = await fetchImpl('https://api.openai.com/v1/images/generations', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(240000), redirect: 'error',
    });
  } catch {
    // A connection failure may happen after submission; never infer that no charge occurred.
    throw new OpenAIImageError('connection');
  }
  let data;
  try { data = await response.json(); }
  catch { throw new OpenAIImageError('invalid_response', response.status); }
  if (!response.ok) throw new OpenAIImageError('provider', response.status, data?.error?.code);
  const encoded = data?.data?.[0]?.b64_json;
  if (typeof encoded !== 'string' || !encoded) throw new OpenAIImageError('invalid_response', response.status);
  return { images: [{ src: `data:image/png;base64,${encoded}`, mimeType: 'image/png' }], errors: [], meta: { model: body.model, size: body.size, quality: body.quality } };
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
