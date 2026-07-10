const { lookup } = require('node:dns').promises;
const net = require('node:net');

const MAX_IMAGE_DOWNLOAD_BYTES = 25 * 1024 * 1024;
const MAX_IMAGE_DOWNLOAD_REDIRECTS = 3;

const IMAGE_EXTENSION_MIME_TYPES = {
  avif: 'image/avif',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function normalizeHostValue(hostname = '') {
  return String(hostname || '')
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .split('%')[0];
}

function parseIpv4Octets(address) {
  const octets = String(address || '').split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }
  return octets;
}

function isBlockedIpv4Address(address) {
  const octets = parseIpv4Octets(address);
  if (!octets) return false;

  const [first, second, third] = octets;
  return (
    first === 0
    || first === 10
    || first === 127
    || first >= 224
    || (first === 100 && second >= 64 && second <= 127)
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
    || (first === 192 && second === 0 && (third === 0 || third === 2))
    || (first === 192 && second === 88 && third === 99)
    || (first === 198 && (second === 18 || second === 19))
    || (first === 198 && second === 51 && third === 100)
    || (first === 203 && second === 0 && third === 113)
  );
}

function parseIpv6Words(address) {
  const value = String(address || '').toLowerCase();
  const sections = value.split('::');
  if (sections.length > 2) return null;

  const leading = sections[0] ? sections[0].split(':') : [];
  const trailing = sections[1] ? sections[1].split(':') : [];
  const missingCount = 8 - leading.length - trailing.length;
  if ((sections.length === 1 && missingCount !== 0) || missingCount < 0) return null;

  const words = [
    ...leading,
    ...Array(sections.length === 2 ? missingCount : 0).fill('0'),
    ...trailing,
  ].map((word) => Number.parseInt(word || '0', 16));

  if (words.length !== 8 || words.some((word) => !Number.isInteger(word) || word < 0 || word > 0xffff)) {
    return null;
  }
  return words;
}

function isBlockedIpAddress(address = '') {
  const value = normalizeHostValue(address);
  const mappedIpv4 = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mappedIpv4) return isBlockedIpAddress(mappedIpv4);

  if (net.isIP(value) === 4) {
    return isBlockedIpv4Address(value);
  }

  if (net.isIP(value) === 6) {
    const words = parseIpv6Words(value);
    if (!words) return true;

    const isIpv4Embedded = words.slice(0, 5).every((word) => word === 0)
      && (words[5] === 0 || words[5] === 0xffff);
    const isGlobalUnicast = words[0] >= 0x2000 && words[0] <= 0x3fff;
    const isDocumentationRange = words[0] === 0x2001 && words[1] === 0x0db8;
    return isIpv4Embedded || !isGlobalUnicast || isDocumentationRange;
  }

  return false;
}

function isBlockedDownloadHost(hostname = '') {
  const value = normalizeHostValue(hostname);
  return (
    value === 'localhost'
    || value === 'metadata.google.internal'
    || value.endsWith('.localhost')
    || isBlockedIpAddress(value)
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

async function assertPublicDownloadHost(hostname, lookupImpl = lookup) {
  const normalizedHost = normalizeHostValue(hostname);
  if (isBlockedDownloadHost(normalizedHost)) {
    throw new Error('圖片網址來源不允許透過 proxy 下載');
  }

  let resolvedAddresses;
  try {
    resolvedAddresses = await lookupImpl(normalizedHost, { all: true, verbatim: true });
  } catch {
    throw new Error('圖片網址主機無法安全解析');
  }

  const addresses = Array.isArray(resolvedAddresses) ? resolvedAddresses : [resolvedAddresses];
  if (addresses.length === 0 || addresses.some((entry) => isBlockedIpAddress(entry?.address || entry))) {
    throw new Error('圖片網址解析到不允許的網路位址');
  }
}

function isRedirectResponse(response) {
  return response?.status >= 300 && response.status < 400;
}

async function fetchRemoteImageResponse({
  parsedUrl,
  fetchImpl,
  lookupImpl,
  maxRedirects,
}) {
  let currentUrl = parsedUrl;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    await assertPublicDownloadHost(currentUrl.hostname, lookupImpl);
    const response = await fetchImpl(currentUrl.toString(), {
      method: 'GET',
      redirect: 'manual',
    });

    if (!isRedirectResponse(response)) {
      return { response, finalUrl: currentUrl };
    }

    if (redirectCount >= maxRedirects) {
      throw new Error('遠端圖片重新導向次數過多');
    }

    const location = String(response.headers.get('location') || '').trim();
    if (!location) {
      throw new Error('遠端圖片重新導向缺少目標網址');
    }

    currentUrl = normalizeRemoteImageUrl(new URL(location, currentUrl).toString());
  }

  throw new Error('遠端圖片重新導向失敗');
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
  lookupImpl = lookup,
  maxBytes = MAX_IMAGE_DOWNLOAD_BYTES,
  maxRedirects = MAX_IMAGE_DOWNLOAD_REDIRECTS,
}) {
  const parsedUrl = normalizeRemoteImageUrl(imageUrl);
  const { response, finalUrl } = await fetchRemoteImageResponse({
    parsedUrl,
    fetchImpl,
    lookupImpl,
    maxRedirects,
  });

  if (!response.ok) {
    throw new Error(`遠端圖片下載失敗 (${response.status})`);
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > maxBytes) {
    throw new Error('遠端圖片太大，無法透過 proxy 下載');
  }

  const mimeType = getImageMimeTypeFromResponse(response, finalUrl.toString());
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
  MAX_IMAGE_DOWNLOAD_REDIRECTS,
  assertPublicDownloadHost,
  downloadRemoteImageAsDataUrl,
  inferImageMimeTypeFromUrl,
  isBlockedDownloadHost,
  isBlockedIpAddress,
  normalizeRemoteImageUrl,
};
