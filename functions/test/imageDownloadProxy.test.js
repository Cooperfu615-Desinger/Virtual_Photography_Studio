const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  downloadRemoteImageAsDataUrl,
  inferImageMimeTypeFromUrl,
  isBlockedDownloadHost,
  isBlockedIpAddress,
  normalizeRemoteImageUrl,
} = require('../src/imageDownloadProxy');

const PUBLIC_LOOKUP = async () => [{ address: '93.184.216.34', family: 4 }];

function createResponse({
  ok = true,
  status = 200,
  contentType = 'image/png',
  contentLength = '',
  location = '',
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
        if (key === 'location') return location;
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
  assert.equal(isBlockedDownloadHost('100.64.0.1'), true);
  assert.equal(isBlockedDownloadHost('192.0.2.5'), true);
  assert.equal(isBlockedDownloadHost('203.0.113.8'), true);
  assert.equal(isBlockedDownloadHost('224.0.0.1'), true);
  assert.equal(isBlockedDownloadHost('metadata.google.internal'), true);
  assert.equal(isBlockedDownloadHost('preview.localhost'), true);
  assert.equal(isBlockedIpAddress('fd00::1'), true);
  assert.equal(isBlockedIpAddress('fe80::1'), true);
  assert.equal(isBlockedIpAddress('::ffff:7f00:1'), true);
  assert.equal(isBlockedIpAddress('2001:db8::1'), true);
  assert.equal(isBlockedIpAddress('2606:4700:4700::1111'), false);
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
    lookupImpl: PUBLIC_LOOKUP,
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
      redirect: 'manual',
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
    lookupImpl: PUBLIC_LOOKUP,
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
      lookupImpl: PUBLIC_LOOKUP,
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

test('revalidates every HTTPS redirect before downloading', async () => {
  const requests = [];
  const result = await downloadRemoteImageAsDataUrl({
    imageUrl: 'https://cdn.example.test/start',
    lookupImpl: PUBLIC_LOOKUP,
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      if (requests.length === 1) {
        return createResponse({
          ok: false,
          status: 302,
          location: 'https://assets.example.test/final.webp',
        });
      }
      return createResponse({ contentType: 'image/webp', bytes: [1, 2] });
    },
  });

  assert.deepEqual(requests.map((request) => request.url), [
    'https://cdn.example.test/start',
    'https://assets.example.test/final.webp',
  ]);
  assert.equal(requests.every((request) => request.options.redirect === 'manual'), true);
  assert.equal(result.src, 'data:image/webp;base64,AQI=');
});

test('rejects redirects to private hosts', async () => {
  await assert.rejects(
    () => downloadRemoteImageAsDataUrl({
      imageUrl: 'https://cdn.example.test/start',
      lookupImpl: PUBLIC_LOOKUP,
      fetchImpl: async () => createResponse({
        ok: false,
        status: 302,
        location: 'https://127.0.0.1/private.png',
      }),
    }),
    /不允許/,
  );
});

test('rejects insecure or excessive redirect chains', async () => {
  await assert.rejects(
    () => downloadRemoteImageAsDataUrl({
      imageUrl: 'https://cdn.example.test/start',
      lookupImpl: PUBLIC_LOOKUP,
      fetchImpl: async () => createResponse({
        ok: false,
        status: 302,
        location: 'http://assets.example.test/final.png',
      }),
    }),
    /HTTPS/,
  );

  await assert.rejects(
    () => downloadRemoteImageAsDataUrl({
      imageUrl: 'https://cdn.example.test/start',
      lookupImpl: PUBLIC_LOOKUP,
      maxRedirects: 1,
      fetchImpl: async () => createResponse({
        ok: false,
        status: 302,
        location: '/next',
      }),
    }),
    /重新導向次數過多/,
  );
});

test('rejects public-looking hosts that resolve to private addresses', async () => {
  let fetched = false;
  await assert.rejects(
    () => downloadRemoteImageAsDataUrl({
      imageUrl: 'https://cdn.example.test/generated.png',
      lookupImpl: async () => [{ address: '10.10.0.5', family: 4 }],
      fetchImpl: async () => {
        fetched = true;
        return createResponse();
      },
    }),
    /不允許的網路位址/,
  );
  assert.equal(fetched, false);
});
