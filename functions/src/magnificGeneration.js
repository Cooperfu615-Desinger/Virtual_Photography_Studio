const MAGNIFIC_API_BASE_URL = 'https://api.magnific.com';

const MAGNIFIC_ASPECT_SIZES = {
  '1:1': 'square_1_1',
  '4:3': 'classic_4_3',
  '3:4': 'traditional_3_4',
  '16:9': 'widescreen_16_9',
  '9:16': 'social_story_9_16',
};

const Z_IMAGE_SIZES = {
  '1:1': 'square_hd',
  '4:3': 'landscape_4_3',
  '3:4': 'portrait_3_4',
  '16:9': 'landscape_16_9',
  '9:16': 'portrait_9_16',
};

const NANO_ASPECT_RATIOS = {
  '1:1': '1:1',
  '4:3': '4:3',
  '3:4': '3:4',
  '16:9': '16:9',
  '9:16': '9:16',
};

const MAGNIFIC_MODEL_CONFIGS = {
  classic: {
    label: 'Magnific Classic',
    endpoint: '/v1/ai/text-to-image',
    mode: 'sync',
  },
  zImageTurbo: {
    label: 'Magnific Z-Image Turbo',
    endpoint: '/v1/ai/text-to-image/z-image',
    taskEndpoint: '/v1/ai/text-to-image/z-image',
    mode: 'async',
  },
  mystic: {
    label: 'Magnific Mystic',
    endpoint: '/v1/ai/mystic',
    taskEndpoint: '/v1/ai/mystic',
    mode: 'async',
  },
  nanoBananaProFlash: {
    label: 'Magnific Nano Banana Pro Flash',
    endpoint: '/v1/ai/text-to-image/nano-banana-pro-flash',
    taskEndpoint: '/v1/ai/text-to-image/nano-banana-pro-flash',
    mode: 'async',
  },
  gemini25FlashImagePreview: {
    label: 'Magnific Gemini 2.5 Flash Image Preview',
    endpoint: '/v1/ai/gemini-2-5-flash-image-preview',
    taskEndpoint: '/v1/ai/gemini-2-5-flash-image-preview',
    mode: 'async',
  },
  seedreamV5Lite: {
    label: 'Magnific Seedream V5 Lite',
    endpoint: '/v1/ai/text-to-image/seedream-v5-lite',
    taskEndpoint: '/v1/ai/text-to-image/seedream-v5-lite',
    mode: 'async',
  },
};

function clampGenerationCount(count) {
  const numericCount = Number(count);
  if (!Number.isFinite(numericCount)) return 1;
  return Math.max(1, Math.min(4, Math.trunc(numericCount)));
}

function getMagnificAspectSize(aspectRatio = '9:16') {
  return MAGNIFIC_ASPECT_SIZES[aspectRatio] || MAGNIFIC_ASPECT_SIZES['9:16'];
}

function getMagnificClassicImageSize(aspectRatio = '9:16') {
  return getMagnificAspectSize(aspectRatio);
}

function getZImageSize(aspectRatio = '9:16') {
  return Z_IMAGE_SIZES[aspectRatio] || Z_IMAGE_SIZES['9:16'];
}

function getNanoAspectRatio(aspectRatio = '9:16') {
  return NANO_ASPECT_RATIOS[aspectRatio] || NANO_ASPECT_RATIOS['9:16'];
}

function getNanoResolution(resolution = '1k') {
  const normalizedResolution = String(resolution || '1k').toLowerCase();
  if (normalizedResolution === '2k') return '2K';
  if (normalizedResolution === '4k') return '4K';
  return '1K';
}

function getMysticResolution(resolution = '1k') {
  const normalizedResolution = String(resolution || '1k').toLowerCase();
  if (normalizedResolution === '2k') return '2k';
  if (normalizedResolution === '4k') return '4k';
  return '1k';
}

function inferBase64ImageMimeType(base64 = '') {
  const value = String(base64 || '').trim();
  if (value.startsWith('iVBORw0KGgo')) return 'image/png';
  if (value.startsWith('/9j/')) return 'image/jpeg';
  if (value.startsWith('UklGR')) return 'image/webp';
  if (value.startsWith('R0lGOD')) return 'image/gif';
  return 'image/png';
}

function inferUrlImageMimeType(url = '') {
  const path = String(url || '').split('?')[0].toLowerCase();
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function getMagnificImageMimeType(image = {}) {
  const declaredMimeType = image.mime_type || image.mimeType;
  if (typeof declaredMimeType === 'string' && declaredMimeType.startsWith('image/')) {
    return declaredMimeType;
  }

  return inferBase64ImageMimeType(image.base64);
}

function buildMagnificClassicRequest({
  prompt,
  aspectRatio = '9:16',
  count = 1,
  guidanceScale,
  seed,
}) {
  const body = {
    prompt: String(prompt || '').trim(),
    image: {
      size: getMagnificClassicImageSize(aspectRatio),
    },
    num_images: clampGenerationCount(count),
    filter_nsfw: true,
  };

  if (guidanceScale !== undefined && guidanceScale !== null && guidanceScale !== '') {
    body.guidance_scale = Math.max(0, Math.min(2, Number(guidanceScale)));
  }

  if (seed !== undefined && seed !== null && seed !== '') {
    body.seed = Math.max(0, Math.min(1000000, Math.trunc(Number(seed))));
  }

  return body;
}

function buildMagnificAsyncRequest({
  modelKey,
  prompt,
  aspectRatio = '9:16',
  resolution = '1k',
}) {
  const normalizedPrompt = String(prompt || '').trim();

  if (modelKey === 'zImageTurbo') {
    return {
      prompt: normalizedPrompt,
      image_size: getZImageSize(aspectRatio),
      num_inference_steps: 8,
      output_format: 'png',
      enable_safety_checker: true,
    };
  }

  if (modelKey === 'mystic') {
    return {
      prompt: normalizedPrompt,
      resolution: getMysticResolution(resolution),
      aspect_ratio: getMagnificAspectSize(aspectRatio),
      filter_nsfw: true,
    };
  }

  if (modelKey === 'nanoBananaProFlash') {
    return {
      prompt: normalizedPrompt,
      aspect_ratio: getNanoAspectRatio(aspectRatio),
      resolution: getNanoResolution(resolution),
    };
  }

  if (modelKey === 'gemini25FlashImagePreview') {
    return {
      prompt: normalizedPrompt,
    };
  }

  if (modelKey === 'seedreamV5Lite') {
    return {
      prompt: normalizedPrompt,
      aspect_ratio: getMagnificAspectSize(aspectRatio),
      enable_safety_checker: true,
    };
  }

  throw new Error(`Unsupported Magnific model: ${modelKey}`);
}

function buildMagnificRequest(payload = {}) {
  const modelKey = payload.modelKey || 'classic';
  const modelConfig = MAGNIFIC_MODEL_CONFIGS[modelKey];
  if (!modelConfig) throw new Error(`Unsupported Magnific model: ${modelKey}`);

  const body = modelConfig.mode === 'sync'
    ? buildMagnificClassicRequest(payload)
    : buildMagnificAsyncRequest({ ...payload, modelKey });

  return {
    body,
    modelConfig,
    modelKey,
    count: modelConfig.mode === 'sync' ? 1 : clampGenerationCount(payload.count),
  };
}

function parseMagnificClassicResponse(payload) {
  const images = (payload?.data || []).flatMap((image) => {
    if (!image?.base64) return [];
    const base64 = String(image.base64).trim();
    const mimeType = getMagnificImageMimeType(image);

    return [{
      src: `data:${mimeType};base64,${base64}`,
      mimeType,
      hasNsfw: Boolean(image.has_nsfw),
    }];
  });

  return {
    images,
    errors: [],
    meta: payload?.meta || null,
  };
}

function parseMagnificTaskResponse(payload) {
  const task = payload?.data || payload || {};
  const generated = Array.isArray(task.generated) ? task.generated : [];
  const nsfwFlags = Array.isArray(task.has_nsfw) ? task.has_nsfw : [];

  const images = generated.flatMap((item, index) => {
    const src = typeof item === 'string' ? item : item?.url || item?.src;
    if (!src) return [];
    const mimeType = item?.mime_type || item?.mimeType || inferUrlImageMimeType(src);

    return [{
      src,
      mimeType,
      hasNsfw: Boolean(nsfwFlags[index] || item?.has_nsfw),
    }];
  });

  return {
    images,
    errors: [],
    meta: {
      taskId: task.task_id || null,
      status: task.status || null,
      groundingMetadata: task.groundingMetadata || task.grounding_metadata || null,
    },
  };
}

async function parseMagnificError(response) {
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    // Fall through to status text.
  }

  const invalidParams = payload?.problem?.invalid_params
    ?.map((param) => `${param.name}: ${param.reason}`)
    .join('; ');
  const message = payload?.message || payload?.problem?.message || invalidParams || response.statusText;
  return `Magnific API 錯誤 (${response.status}): ${message || 'Unknown error'}`;
}

async function requestMagnificJson({
  apiKey,
  apiBaseUrl = MAGNIFIC_API_BASE_URL,
  path,
  method = 'GET',
  body,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-magnific-api-key': apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await parseMagnificError(response));
  }

  return response.json();
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function pollMagnificTask({
  apiKey,
  apiBaseUrl,
  fetchImpl,
  modelConfig,
  initialPayload,
  pollIntervalMs = 2500,
  maxAttempts = 60,
}) {
  let payload = initialPayload;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const task = payload?.data || payload || {};

    if (task.status === 'COMPLETED') {
      return parseMagnificTaskResponse(payload);
    }

    if (task.status === 'FAILED') {
      throw new Error('Magnific 生成任務失敗');
    }

    if (!task.task_id) {
      throw new Error('Magnific API 回應中未包含 task_id');
    }

    if (attempt < maxAttempts - 1) {
      if (pollIntervalMs > 0) await sleep(pollIntervalMs);
      payload = await requestMagnificJson({
        apiKey,
        apiBaseUrl,
        fetchImpl,
        path: `${modelConfig.taskEndpoint}/${task.task_id}`,
      });
    }
  }

  throw new Error('Magnific 生成逾時，請稍後重試');
}

async function generateMagnificModelImages({
  apiKey,
  payload,
  apiBaseUrl = MAGNIFIC_API_BASE_URL,
  fetchImpl = fetch,
  pollIntervalMs,
  maxAttempts,
}) {
  const request = buildMagnificRequest(payload);

  if (request.modelConfig.mode === 'sync') {
    const responsePayload = await requestMagnificJson({
      apiKey,
      apiBaseUrl,
      fetchImpl,
      path: request.modelConfig.endpoint,
      method: 'POST',
      body: request.body,
    });
    return parseMagnificClassicResponse(responsePayload);
  }

  const taskPayloads = await Promise.all(Array.from({ length: request.count }, () => (
    requestMagnificJson({
      apiKey,
      apiBaseUrl,
      fetchImpl,
      path: request.modelConfig.endpoint,
      method: 'POST',
      body: request.body,
    })
  )));

  const results = await Promise.all(taskPayloads.map((taskPayload) => (
    pollMagnificTask({
      apiKey,
      apiBaseUrl,
      fetchImpl,
      modelConfig: request.modelConfig,
      initialPayload: taskPayload,
      pollIntervalMs,
      maxAttempts,
    })
  )));

  return {
    images: results.flatMap((result) => result.images),
    errors: results.flatMap((result) => result.errors || []),
    meta: {
      modelKey: request.modelKey,
      taskIds: results.map((result) => result.meta?.taskId).filter(Boolean),
    },
  };
}

module.exports = {
  MAGNIFIC_MODEL_CONFIGS,
  buildMagnificAsyncRequest,
  buildMagnificClassicRequest,
  buildMagnificRequest,
  clampGenerationCount,
  generateMagnificModelImages,
  getMagnificAspectSize,
  getMagnificClassicImageSize,
  getMysticResolution,
  getNanoAspectRatio,
  getNanoResolution,
  getZImageSize,
  inferBase64ImageMimeType,
  parseMagnificError,
  parseMagnificClassicResponse,
  parseMagnificTaskResponse,
};
