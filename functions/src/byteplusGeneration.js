const BYTEPLUS_API_BASE_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3';

const BYTEPLUS_MODEL_CONFIGS = {
  seedream5Pro: {
    label: 'BytePlus Seedream 5.0 Pro',
    modelIds: ['dola-seedream-5-0-pro-260628', 'seedream-5-0-pro-260628'],
    resolutions: ['1K', '2K'],
    defaultResolution: '2K',
  },
  seedream5Lite: {
    label: 'BytePlus Seedream 5.0 Lite',
    modelIds: ['seedream-5-0-260128', 'seedream-5-0-lite-260128'],
    resolutions: ['2K', '3K', '4K'],
    defaultResolution: '2K',
    sequentialImageGeneration: 'disabled',
  },
};

const BYTEPLUS_ASPECT_PROMPTS = {
  '1:1': 'Use a square 1:1 composition.',
  '4:3': 'Use a horizontal 4:3 composition.',
  '3:4': 'Use a vertical 3:4 composition.',
  '16:9': 'Use a wide horizontal 16:9 composition.',
  '9:16': 'Use a tall vertical 9:16 composition.',
};

function clampGenerationCount(count) {
  const numericCount = Number(count);
  if (!Number.isFinite(numericCount)) return 1;
  return Math.max(1, Math.min(4, Math.trunc(numericCount)));
}

function getBytePlusModelConfig(modelKey = 'seedream5Pro') {
  return BYTEPLUS_MODEL_CONFIGS[modelKey] || BYTEPLUS_MODEL_CONFIGS.seedream5Pro;
}

function getBytePlusResolution(modelKey = 'seedream5Pro', resolution) {
  const modelConfig = getBytePlusModelConfig(modelKey);
  const normalizedResolution = String(resolution || modelConfig.defaultResolution || '').toUpperCase();
  return modelConfig.resolutions.includes(normalizedResolution)
    ? normalizedResolution
    : modelConfig.defaultResolution;
}

function buildBytePlusPrompt(prompt, aspectRatio = '9:16') {
  const normalizedPrompt = String(prompt || '').trim();
  const aspectPrompt = BYTEPLUS_ASPECT_PROMPTS[aspectRatio] || BYTEPLUS_ASPECT_PROMPTS['9:16'];
  return `${normalizedPrompt}\n\nComposition requirement: ${aspectPrompt}`;
}

function buildBytePlusRequest({
  modelKey = 'seedream5Pro',
  modelId,
  prompt,
  aspectRatio = '9:16',
  resolution,
}) {
  const modelConfig = getBytePlusModelConfig(modelKey);
  const body = {
    model: modelId || modelConfig.modelIds[0],
    prompt: buildBytePlusPrompt(prompt, aspectRatio),
    size: getBytePlusResolution(modelKey, resolution),
    output_format: 'png',
    response_format: 'b64_json',
    watermark: false,
  };

  if (modelConfig.sequentialImageGeneration) {
    body.sequential_image_generation = modelConfig.sequentialImageGeneration;
  }

  return body;
}

function inferUrlImageMimeType(url = '') {
  const path = String(url || '').split('?')[0].toLowerCase();
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function parseBytePlusGenerationResponse(payload) {
  const data = Array.isArray(payload?.data) ? payload.data : [];
  const errors = [];

  const images = data.flatMap((image) => {
    if (image?.b64_json) {
      return [{
        src: `data:${image.mime_type || 'image/png'};base64,${image.b64_json}`,
        mimeType: image.mime_type || 'image/png',
        size: image.size || null,
      }];
    }

    if (image?.url) {
      return [{
        src: image.url,
        mimeType: image.mime_type || inferUrlImageMimeType(image.url),
        size: image.size || null,
      }];
    }

    if (image?.error?.message) {
      errors.push(image.error.message);
    }

    return [];
  });

  return {
    images,
    errors,
    meta: {
      model: payload?.model || null,
      usage: payload?.usage || null,
    },
  };
}

class BytePlusApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'BytePlusApiError';
    this.status = status;
  }
}

async function parseBytePlusError(response) {
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    // Fall through to status text.
  }

  const message = payload?.error?.message
    || payload?.message
    || payload?.error_msg
    || response.statusText
    || 'Unknown error';
  const code = payload?.error?.code || payload?.code;
  return `BytePlus API 錯誤 (${response.status}${code ? ` ${code}` : ''}): ${message}`;
}

function shouldRetryWithNextModelId(error) {
  if (!(error instanceof BytePlusApiError)) return false;
  if (![400, 404].includes(error.status)) return false;
  return /model|endpoint|not found|not exist|invalid/i.test(error.message);
}

async function requestBytePlusJson({
  apiKey,
  apiBaseUrl = BYTEPLUS_API_BASE_URL,
  body,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(`${apiBaseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new BytePlusApiError(await parseBytePlusError(response), response.status);
  }

  return response.json();
}

async function requestBytePlusGeneration({
  apiKey,
  apiBaseUrl,
  fetchImpl,
  payload,
}) {
  const modelConfig = getBytePlusModelConfig(payload.modelKey);
  let lastModelError = null;

  for (const modelId of modelConfig.modelIds) {
    const body = buildBytePlusRequest({
      ...payload,
      modelId,
    });

    try {
      const responsePayload = await requestBytePlusJson({
        apiKey,
        apiBaseUrl,
        fetchImpl,
        body,
      });
      return parseBytePlusGenerationResponse(responsePayload);
    } catch (error) {
      if (!shouldRetryWithNextModelId(error)) throw error;
      lastModelError = error;
    }
  }

  throw lastModelError || new Error('BytePlus 生成失敗');
}

async function generateBytePlusImages({
  apiKey,
  payload,
  apiBaseUrl = BYTEPLUS_API_BASE_URL,
  fetchImpl = fetch,
}) {
  const prompt = String(payload?.prompt || '').trim();
  if (prompt.length < 3) {
    throw new Error('請先提供至少 3 個字元的 Prompt');
  }

  const count = clampGenerationCount(payload?.count);
  const results = await Promise.all(Array.from({ length: count }, () => (
    requestBytePlusGeneration({
      apiKey,
      apiBaseUrl,
      fetchImpl,
      payload: {
        ...payload,
        prompt,
      },
    })
  )));

  return {
    images: results.flatMap((result) => result.images),
    errors: results.flatMap((result) => result.errors || []),
    meta: {
      modelKey: payload?.modelKey || 'seedream5Pro',
      models: results.map((result) => result.meta?.model).filter(Boolean),
      usage: results.map((result) => result.meta?.usage).filter(Boolean),
    },
  };
}

module.exports = {
  BYTEPLUS_MODEL_CONFIGS,
  buildBytePlusPrompt,
  buildBytePlusRequest,
  clampGenerationCount,
  generateBytePlusImages,
  getBytePlusResolution,
  parseBytePlusError,
  parseBytePlusGenerationResponse,
};
