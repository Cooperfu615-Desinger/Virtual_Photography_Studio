const MAX_IMAGE_DOWNLOAD_BYTES = 25 * 1024 * 1024;

const IMAGE_EXTENSION_MIME_TYPES = {
  avif: 'image/avif',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function isBlockedDownloadHost(hostname = '') {
  const value = String(hostname || '').toLowerCase();
  return (
    value === 'localhost'
    || value === 'metadata.google.internal'
    || value === '0.0.0.0'
    || value === '127.0.0.1'
    || value === '::1'
    || /^127\./.test(value)
    || /^10\./.test(value)
    || /^192\.168\./.test(value)
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(value)
    || /^169\.254\./.test(value)
  );
}

function normalizeRemoteImageUrl(imageUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(String(imageUrl || '').trim());
  } catch {
    throw new Error('圖片網址格式不正確');
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('只允許下載 HTTPS 圖片網址');
  }

  if (parsedUrl.username || parsedUrl.password || isBlockedDownloadHost(parsedUrl.hostname)) {
    throw new Error('圖片網址來源不允許透過 proxy 下載');
  }

  return parsedUrl;
}

function inferImageMimeTypeFromUrl(imageUrl) {
  let extension = '';
  try {
    const parsedUrl = new URL(String(imageUrl || ''));
    extension = parsedUrl.pathname.split('.').pop()?.toLowerCase() || '';
  } catch {
    extension = String(imageUrl || '').split('?')[0].split('.').pop()?.toLowerCase() || '';
  }

  return IMAGE_EXTENSION_MIME_TYPES[extension] || '';
}

function getImageMimeTypeFromResponse(response, imageUrl) {
  const contentType = String(response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (contentType.startsWith('image/')) return contentType;

  const inferredMimeType = inferImageMimeTypeFromUrl(imageUrl);
  if (inferredMimeType) return inferredMimeType;

  throw new Error('遠端網址回應不是圖片格式');
}

async function downloadRemoteImageAsDataUrl({
  imageUrl,
  fetchImpl = fetch,
  maxBytes = MAX_IMAGE_DOWNLOAD_BYTES,
}) {
  const parsedUrl = normalizeRemoteImageUrl(imageUrl);
  const response = await fetchImpl(parsedUrl.toString(), {
    method: 'GET',
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`遠端圖片下載失敗 (${response.status})`);
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > maxBytes) {
    throw new Error('遠端圖片太大，無法透過 proxy 下載');
  }

  const mimeType = getImageMimeTypeFromResponse(response, parsedUrl.toString());
  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > maxBytes) {
    throw new Error('遠端圖片太大，無法透過 proxy 下載');
  }

  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return {
    src: `data:${mimeType};base64,${base64}`,
    mimeType,
    bytes: arrayBuffer.byteLength,
  };
}

module.exports = {
  MAX_IMAGE_DOWNLOAD_BYTES,
  downloadRemoteImageAsDataUrl,
  inferImageMimeTypeFromUrl,
  isBlockedDownloadHost,
  normalizeRemoteImageUrl,
};
