const DATA_URL_IMAGE_MIME_RE = /^data:(image\/[a-zA-Z0-9.+-]+);/;

const MIME_TYPE_EXTENSIONS = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function normalizeExtension(extension = '') {
  const value = String(extension || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (value === 'jpeg') return 'jpg';
  return value || 'png';
}

export function getImageDownloadExtension(src = '', mimeType = '') {
  const normalizedMimeType = String(mimeType || '').split(';')[0].trim().toLowerCase();
  if (MIME_TYPE_EXTENSIONS[normalizedMimeType]) return MIME_TYPE_EXTENSIONS[normalizedMimeType];

  const dataUrlMimeType = src.match(DATA_URL_IMAGE_MIME_RE)?.[1]?.toLowerCase();
  if (dataUrlMimeType && MIME_TYPE_EXTENSIONS[dataUrlMimeType]) return MIME_TYPE_EXTENSIONS[dataUrlMimeType];

  try {
    const parsedUrl = new URL(src, window.location.href);
    const pathExtension = parsedUrl.pathname.split('.').pop();
    return normalizeExtension(pathExtension);
  } catch {
    return normalizeExtension(src.split('?')[0].split('.').pop());
  }
}

export function createDllPicImageFilename(index, extension = 'png') {
  return `dll_pic_pro_${Date.now()}_${Number(index) + 1}.${normalizeExtension(extension)}`;
}

function triggerBrowserDownload(href, filename) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function fetchRemoteImageBlob(src) {
  const response = await fetch(src, {
    mode: 'cors',
    credentials: 'omit',
  });

  if (!response.ok) throw new Error(`圖片下載失敗 (${response.status})`);

  const blob = await response.blob();
  if (blob.type && !blob.type.startsWith('image/')) {
    throw new Error('遠端網址回應不是圖片格式');
  }

  return blob;
}

export async function downloadImageFile({
  src,
  index = 0,
  remoteDownload,
}) {
  if (!src) throw new Error('沒有可下載的圖片');

  if (DATA_URL_IMAGE_MIME_RE.test(src)) {
    const extension = getImageDownloadExtension(src);
    triggerBrowserDownload(src, createDllPicImageFilename(index, extension));
    return { source: 'data-url' };
  }

  try {
    const blob = await fetchRemoteImageBlob(src);
    const objectUrl = URL.createObjectURL(blob);
    const extension = getImageDownloadExtension(src, blob.type);
    triggerBrowserDownload(objectUrl, createDllPicImageFilename(index, extension));
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    return { source: 'browser-blob' };
  } catch (error) {
    if (!remoteDownload) throw error;
  }

  const result = await remoteDownload({ imageUrl: src });
  const extension = getImageDownloadExtension(result.src, result.mimeType);
  triggerBrowserDownload(result.src, createDllPicImageFilename(index, extension));
  return { source: 'firebase-proxy' };
}
