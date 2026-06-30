const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const {
  buildMagnificClassicRequest,
  parseMagnificClassicResponse,
} = require('./src/magnificClassic');

const magnificApiKey = defineSecret('MAGNIFIC_API_KEY');
const DEFAULT_ALLOWED_EMAILS = 'cooperfu.615@gmail.com';
const MAGNIFIC_API_BASE_URL = 'https://api.magnific.com';

function getAllowedEmails() {
  return String(process.env.ALLOWED_FIREBASE_EMAILS || DEFAULT_ALLOWED_EMAILS)
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function assertAllowedUser(request) {
  const email = request.auth?.token?.email;
  if (!email) {
    throw new HttpsError('unauthenticated', '請先登入 Firebase 後再使用 Magnific');
  }

  const allowedEmails = getAllowedEmails();
  if (allowedEmails.length > 0 && !allowedEmails.includes(String(email).toLowerCase())) {
    throw new HttpsError('permission-denied', '此帳號沒有使用 Magnific proxy 的權限');
  }
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

exports.magnificGenerateClassic = onCall({
  region: 'us-central1',
  secrets: [magnificApiKey],
  timeoutSeconds: 120,
  memory: '512MiB',
}, async (request) => {
  assertAllowedUser(request);

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

  return result;
});
