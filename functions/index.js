const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const {
  buildMagnificClassicRequest,
  generateMagnificModelImages,
  parseMagnificError,
  parseMagnificClassicResponse,
} = require('./src/magnificGeneration');
const {
  generateBytePlusImages,
} = require('./src/byteplusGeneration');
const { downloadRemoteImageAsDataUrl } = require('./src/imageDownloadProxy');

const magnificApiKey = defineSecret('MAGNIFIC_API_KEY');
const bytePlusArkApiKey = defineSecret('BYTEPLUS_ARK_API_KEY');
const DEFAULT_ALLOWED_EMAILS = 'cooperfu.615@gmail.com';
const MAGNIFIC_API_BASE_URL = 'https://api.magnific.com';

function getAllowedEmails() {
  return String(process.env.ALLOWED_FIREBASE_EMAILS || DEFAULT_ALLOWED_EMAILS)
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function assertAllowedUser(request, serviceLabel = 'image generation proxy') {
  const email = request.auth?.token?.email;
  if (!email) {
    throw new HttpsError('unauthenticated', `請先登入 Firebase 後再使用 ${serviceLabel}`);
  }

  const allowedEmails = getAllowedEmails();
  if (allowedEmails.length > 0 && !allowedEmails.includes(String(email).toLowerCase())) {
    throw new HttpsError('permission-denied', `此帳號沒有使用 ${serviceLabel} 的權限`);
  }
}

exports.magnificGenerateClassic = onCall({
  region: 'us-central1',
  secrets: [magnificApiKey],
  timeoutSeconds: 120,
  memory: '512MiB',
}, async (request) => {
  assertAllowedUser(request, 'Magnific proxy');

  const body = buildMagnificClassicRequest(request.data || {});
  if (!body.prompt || body.prompt.length < 3) {
    throw new HttpsError('invalid-argument', '請先提供至少 3 個字元的 Prompt');
  }

  const apiKey = magnificApiKey.value();
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'Magnific API Key 尚未設定');
  }

  const response = await fetch(`${MAGNIFIC_API_BASE_URL}/v1/ai/text-to-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-magnific-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await parseMagnificError(response);
    logger.warn('Magnific Classic generation failed', {
      status: response.status,
      imageSize: body.image?.size,
      numImages: body.num_images,
    });
    throw new HttpsError('internal', message);
  }

  const payload = await response.json();
  const result = parseMagnificClassicResponse(payload);

  if (result.images.length === 0) {
    throw new HttpsError('internal', 'Magnific API 回應中未包含圖像資料');
  }

  logger.info('Magnific Classic generation succeeded', {
    imageSize: body.image?.size,
    numImages: result.images.length,
    mimeTypes: result.images.map((image) => image.mimeType),
    nsfwCount: result.images.filter((image) => image.hasNsfw).length,
  });

  return result;
});

exports.magnificGenerate = onCall({
  region: 'us-central1',
  secrets: [magnificApiKey],
  timeoutSeconds: 240,
  memory: '512MiB',
}, async (request) => {
  assertAllowedUser(request, 'Magnific proxy');

  const payload = request.data || {};
  const prompt = String(payload.prompt || '').trim();
  if (prompt.length < 3) {
    throw new HttpsError('invalid-argument', '請先提供至少 3 個字元的 Prompt');
  }

  const apiKey = magnificApiKey.value();
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'Magnific API Key 尚未設定');
  }

  try {
    const result = await generateMagnificModelImages({
      apiKey,
      payload: {
        ...payload,
        prompt,
      },
    });

    if (result.images.length === 0) {
      throw new HttpsError('internal', 'Magnific API 回應中未包含圖像資料');
    }

    logger.info('Magnific generation succeeded', {
      modelKey: payload.modelKey || 'classic',
      numImages: result.images.length,
      mimeTypes: result.images.map((image) => image.mimeType),
      nsfwCount: result.images.filter((image) => image.hasNsfw).length,
      taskCount: result.meta?.taskIds?.length || 0,
    });

    return result;
  } catch (error) {
    if (error instanceof HttpsError) throw error;

    logger.warn('Magnific generation failed', {
      modelKey: payload.modelKey || 'classic',
      message: error?.message || String(error),
    });
    throw new HttpsError('internal', error?.message || 'Magnific 生成失敗');
  }
});

exports.bytePlusGenerate = onCall({
  region: 'us-central1',
  secrets: [bytePlusArkApiKey],
  timeoutSeconds: 240,
  memory: '512MiB',
}, async (request) => {
  assertAllowedUser(request, 'BytePlus proxy');

  const payload = request.data || {};
  const prompt = String(payload.prompt || '').trim();
  if (prompt.length < 3) {
    throw new HttpsError('invalid-argument', '請先提供至少 3 個字元的 Prompt');
  }

  const apiKey = bytePlusArkApiKey.value();
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'BytePlus ARK API Key 尚未設定');
  }

  try {
    const result = await generateBytePlusImages({
      apiKey,
      payload: {
        ...payload,
        prompt,
      },
    });

    if (result.images.length === 0) {
      throw new HttpsError('internal', 'BytePlus API 回應中未包含圖像資料');
    }

    logger.info('BytePlus generation succeeded', {
      modelKey: payload.modelKey || 'seedream5Pro',
      numImages: result.images.length,
      mimeTypes: result.images.map((image) => image.mimeType),
      models: result.meta?.models || [],
    });

    return result;
  } catch (error) {
    if (error instanceof HttpsError) throw error;

    logger.warn('BytePlus generation failed', {
      modelKey: payload.modelKey || 'seedream5Pro',
      message: error?.message || String(error),
    });
    throw new HttpsError('internal', error?.message || 'BytePlus 生成失敗');
  }
});

exports.magnificDownloadImage = onCall({
  region: 'us-central1',
  timeoutSeconds: 120,
  memory: '512MiB',
}, async (request) => {
  assertAllowedUser(request, 'image download proxy');

  const imageUrl = String(request.data?.imageUrl || '').trim();
  if (!imageUrl) {
    throw new HttpsError('invalid-argument', '請提供要下載的圖片網址');
  }

  try {
    const result = await downloadRemoteImageAsDataUrl({ imageUrl });
    logger.info('Remote generated image downloaded', {
      mimeType: result.mimeType,
      bytes: result.bytes,
    });
    return result;
  } catch (error) {
    logger.warn('Remote generated image download failed', {
      message: error?.message || String(error),
    });
    throw new HttpsError('internal', error?.message || '圖片下載失敗');
  }
});
