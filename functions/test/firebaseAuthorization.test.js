const test = require('node:test');
const assert = require('node:assert/strict');

// Test-only configuration; these handlers stop at input validation and make no
// provider calls or database writes.
process.env.COMFY_CLOUD_API_KEY = 'authorization-test-fixture';
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'authorization-test-project' });
const { initializeApp, getApps } = require('firebase-admin/app');
initializeApp({ projectId: 'authorization-test-project' }, 'token-verification-test-app');
const { comfyCloudSubmit, comfyCloudStatus, comfyCloudQuota, magnificDownloadImage } = require('../index');
const handlers = [comfyCloudSubmit, comfyCloudStatus, comfyCloudQuota, magnificDownloadImage];
const request = (email) => ({ auth: { uid: 'authorization-test-user', token: { email } }, data: {} });

test.beforeEach(() => { delete process.env.ALLOWED_FIREBASE_EMAILS; });

async function assertAllowed(email) {
  for (const handler of handlers) {
    await assert.rejects(handler.run(request(email)), (error) => (
      handler === magnificDownloadImage
        ? error.code === 'invalid-argument' && error.message === '請提供要下載的圖片網址'
        : handler === comfyCloudQuota
          ? error.code === 'failed-precondition' && error.message === 'Comfy Cloud 額度查詢失敗，請稍後重新整理'
        : error.code === 'failed-precondition' && error.message === '無效的任務識別碼'
    ));
  }
}

test('Comfy creates a default Firestore app when token verification already created a named Admin app', async () => {
  assert.equal(getApps().some((app) => app.name === '[DEFAULT]'), false);
  await assertAllowed('nailai7981.ai@gmail.com');
  assert.equal(getApps().some((app) => app.name === '[DEFAULT]'), true);
});

test('the existing account and the approved new account reach input validation', async () => {
  await assertAllowed('cooperfu.615@gmail.com');
  await assertAllowed('nailai7981.ai@gmail.com');
});

test('account email comparison remains case insensitive', async () => {
  await assertAllowed('NaiLai7981.AI@Gmail.com');
});

test('anonymous callers are rejected before any paid submission or download', async () => {
  for (const handler of handlers) {
    await assert.rejects(handler.run({ data: {} }), { code: 'unauthenticated' });
  }
});

test('unlisted accounts remain rejected by every affected callable', async () => {
  for (const handler of handlers) {
    await assert.rejects(handler.run(request('unlisted@example.com')), { code: 'permission-denied' });
  }
});

test('an explicitly configured allowlist continues to override the default', async () => {
  process.env.ALLOWED_FIREBASE_EMAILS = ' custom@example.com ';
  await assertAllowed('custom@example.com');
  for (const handler of handlers) {
    await assert.rejects(handler.run(request('nailai7981.ai@gmail.com')), { code: 'permission-denied' });
  }
});
