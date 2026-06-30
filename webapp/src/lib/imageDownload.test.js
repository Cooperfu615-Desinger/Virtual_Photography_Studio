import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';

import {
  downloadImageFile,
  getImageDownloadExtension,
} from './imageDownload.js';

let originalDateNow;
let originalDocument;
let originalFetch;
let originalLocation;
let originalUrlCreateObjectUrl;
let originalUrlRevokeObjectUrl;
let originalWindow;
let clickedDownloads;

function setupDownloadDom() {
  clickedDownloads = [];
  globalThis.document = {
    body: {
      appendChild: () => {},
    },
    createElement: () => ({
      href: '',
      download: '',
      rel: '',
      style: {},
      click() {
        clickedDownloads.push({
          href: this.href,
          download: this.download,
          rel: this.rel,
        });
      },
      remove() {},
    }),
  };
}

beforeEach(() => {
  originalDateNow = Date.now;
  originalDocument = globalThis.document;
  originalFetch = globalThis.fetch;
  originalLocation = globalThis.location;
  originalUrlCreateObjectUrl = globalThis.URL.createObjectURL;
  originalUrlRevokeObjectUrl = globalThis.URL.revokeObjectURL;
  originalWindow = globalThis.window;

  Date.now = () => 1700000000000;
  setupDownloadDom();
  globalThis.window = {
    location: { href: 'https://app.example.test/' },
    setTimeout: (callback) => {
      callback();
      return 1;
    },
  };
  globalThis.location = globalThis.window.location;
});

afterEach(() => {
  Date.now = originalDateNow;
  globalThis.document = originalDocument;
  globalThis.fetch = originalFetch;
  globalThis.location = originalLocation;
  globalThis.URL.createObjectURL = originalUrlCreateObjectUrl;
  globalThis.URL.revokeObjectURL = originalUrlRevokeObjectUrl;
  globalThis.window = originalWindow;
});

test('downloads data URL images without fetching remote content', async () => {
  let fetched = false;
  globalThis.fetch = async () => {
    fetched = true;
    throw new Error('should not fetch data URLs');
  };

  const result = await downloadImageFile({
    src: 'data:image/jpeg;base64,abc123',
    index: 1,
  });

  assert.equal(fetched, false);
  assert.deepEqual(result, { source: 'data-url' });
  assert.deepEqual(clickedDownloads, [{
    href: 'data:image/jpeg;base64,abc123',
    download: 'dll_pic_pro_1700000000000_2.jpg',
    rel: 'noopener',
  }]);
});

test('downloads remote images as browser blobs when CORS allows it', async () => {
  let request = null;
  let revokedUrl = '';
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      blob: async () => new Blob(['image'], { type: 'image/webp' }),
    };
  };
  globalThis.URL.createObjectURL = () => 'blob:downloadable-image';
  globalThis.URL.revokeObjectURL = (url) => {
    revokedUrl = url;
  };

  const result = await downloadImageFile({
    src: 'https://cdn.example.test/generated-image.jpg?token=1',
    index: 0,
  });

  assert.equal(request.url, 'https://cdn.example.test/generated-image.jpg?token=1');
  assert.deepEqual(request.options, {
    mode: 'cors',
    credentials: 'omit',
  });
  assert.deepEqual(result, { source: 'browser-blob' });
  assert.equal(revokedUrl, 'blob:downloadable-image');
  assert.deepEqual(clickedDownloads, [{
    href: 'blob:downloadable-image',
    download: 'dll_pic_pro_1700000000000_1.webp',
    rel: 'noopener',
  }]);
});

test('falls back to Firebase proxy when browser blob download is blocked', async () => {
  let proxyPayload = null;
  globalThis.fetch = async () => {
    throw new TypeError('CORS blocked');
  };

  const result = await downloadImageFile({
    src: 'https://cdn.example.test/generated-image.png?token=1',
    index: 2,
    remoteDownload: async (payload) => {
      proxyPayload = payload;
      return {
        src: 'data:image/png;base64,proxy-image',
        mimeType: 'image/png',
      };
    },
  });

  assert.deepEqual(proxyPayload, {
    imageUrl: 'https://cdn.example.test/generated-image.png?token=1',
  });
  assert.deepEqual(result, { source: 'firebase-proxy' });
  assert.deepEqual(clickedDownloads, [{
    href: 'data:image/png;base64,proxy-image',
    download: 'dll_pic_pro_1700000000000_3.png',
    rel: 'noopener',
  }]);
});

test('infers stable image download extensions', () => {
  assert.equal(getImageDownloadExtension('data:image/webp;base64,abc'), 'webp');
  assert.equal(getImageDownloadExtension('https://cdn.example.test/image.jpeg?x=1'), 'jpg');
  assert.equal(getImageDownloadExtension('https://cdn.example.test/image.bin', 'image/png'), 'png');
});
