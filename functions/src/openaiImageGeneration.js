'use strict';

// These sizes keep edges divisible by 16 and stay within the Images API's
// supported pixel limits. The displayed ratios are approximate when necessary.
const SIZES = Object.freeze({
  '1k': { '1:1': '1024x1024', '4:3': '1152x864', '3:4': '864x1152', '16:9': '1360x768', '9:16': '768x1360', '4:5': '1024x1280' },
  '2k': { '1:1': '1920x1920', '4:3': '2048x1536', '3:4': '1536x2048', '16:9': '2048x1152', '9:16': '1152x2048', '4:5': '1632x2048' },
});

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
  const response = await fetchImpl('https://api.openai.com/v1/images/generations', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(240000), redirect: 'error',
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'OpenAI 生圖失敗');
    error.status = response.status; error.providerCode = data?.error?.code;
    throw error;
  }
  const encoded = data?.data?.[0]?.b64_json;
  if (typeof encoded !== 'string' || !encoded) throw new Error('OpenAI 回應未包含圖片');
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
    await store.update(requestId, { phase: 'uncertain', completedAt: Date.now() }).catch(() => {});
    throw error;
  }
}
module.exports = { SIZES, buildOpenAIImageRequest, generateOpenAIImage, submitOpenAIImage };
