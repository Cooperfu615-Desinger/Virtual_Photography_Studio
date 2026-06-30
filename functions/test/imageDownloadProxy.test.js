const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  downloadRemoteImageAsDataUrl,
  inferImageMimeTypeFromUrl,
  isBlockedDownloadHost,
  normalizeRemoteImageUrl,
} = require('../src/imageDownloadProxy');

function createResponse({
  ok = true,
  status = 200,
  contentType = 'image/png',
  contentLength = '',
  bytes = [137, 80, 78, 71],
} = {}) {
  return {
    ok,
    status,
    headers: {
      get(name) {
        const key = String(name).toLowerCase();
        if (key === 'content-type') return contentType;
        if (key === 'content-length') return contentLength;
        return '';
      },
    },
    arrayBuffer: async () => new Uint8Array(bytes).buffer,
  };
}

test('normalizes only HTTPS remote image URLs', () => {
  assert.equal(normalizeRemoteImageUrl('https://cdn.example.test/image.png').toString(), 'https://cdn.example.test/image.png');
  assert.throws(() => normalizeRemoteImageUrl('http://cdn.example.test/image.png'), /HTTPS/);
  assert.throws(() => normalizeRemoteImageUrl('https://localhost/image.png'), /不允許/);
});

test('blocks obvious private download hosts', () => {
  assert.equal(isBlockedDownloadHost('127.0.0.1'), true);
  assert.equal(isBlockedDownloadHost('10.1.2.3'), true);
  assert.equal(isBlockedDownloadHost('172.20.2.3'), true);
  assert.equal(isBlockedDownloadHost('192.168.1.5'), true);
  assert.equal(isBlockedDownloadHost('metadata.google.internal'), true);
  assert.equal(isBlockedDownloadHost('cdn.example.test'), false);
});

test('infers image MIME type from URL extension', () => {
  assert.equal(inferImageMimeTypeFromUrl('https://cdn.example.test/image.webp?token=1'), 'image/webp');
  assert.equal(inferImageMimeTypeFromUrl('https://cdn.example.test/image.jpg'), 'image/jpeg');
  assert.equal(inferImageMimeTypeFromUrl('https://cdn.example.test/image.bin'), '');
});

test('downloads remote image as a data URL', async () => {
  let request = null;
  const result = await downloadRemoteImageAsDataUrl({
    imageUrl: 'https://cdn.example.test/generated.png?token=1',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return createResponse({
        contentType: 'image/png; charset=binary',
        bytes: [1, 2, 3, 4],
      });
    },
  });

  assert.deepEqual(request, {
    url: 'https://cdn.example.test/generated.png?token=1',
    options: {
      method: 'GET',
      redirect: 'follow',
    },
  });
  assert.deepEqual(result, {
    src: 'data:image/png;base64,AQIDBA==',
    mimeType: 'image/png',
    bytes: 4,
  });
});

test('uses URL MIME inference when response content type is generic', async () => {
  const result = await downloadRemoteImageAsDataUrl({
    imageUrl: 'https://cdn.example.test/generated.webp?token=1',
    fetchImpl: async () => createResponse({
      contentType: 'application/octet-stream',
      bytes: [1, 2, 3],
    }),
  });

  assert.equal(result.mimeType, 'image/webp');
  assert.equal(result.src, 'data:image/webp;base64,AQID');
});

test('rejects remote images above the proxy size limit', async () => {
  await assert.rejects(
    () => downloadRemoteImageAsDataUrl({
      imageUrl: 'https://cdn.example.test/large.png',
      maxBytes: 2,
      fetchImpl: async () => createResponse({
        contentType: 'image/png',
        contentLength: '3',
        bytes: [1, 2, 3],
      }),
    }),
    /太大/,
  );
});
