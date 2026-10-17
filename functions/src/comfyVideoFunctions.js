const { onRequest } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');
const { assertExpectedComfyUid } = require('./comfyCloud');
const { videoOperation, sendVideoDownloadChunk } = require('./comfyVideo');

module.exports = function videoFunctions({ onCall, HttpsError, assertAllowedUser, apiKey, storeFor }) {
  const options = { region: 'us-central1', secrets: [apiKey], timeoutSeconds: 120, memory: '512MiB', maxInstances: 2 };
  return {
    comfyCloudVideo: onCall(options, async request => {
      assertAllowedUser(request, 'Comfy Cloud 影片');
      try {
        assertExpectedComfyUid(request.data, request.auth.uid);
        if (!apiKey.value()) throw new Error('Comfy Cloud API Key 尚未設定');
        return await videoOperation({ apiKey: apiKey.value(), payload: request.data || {}, store: storeFor(request.auth.uid) });
      } catch (error) {
        throw new HttpsError('failed-precondition', error.message || '影片操作失敗');
      }
    }),
    comfyCloudVideoDownload: onRequest({ ...options, cors: true }, async (request, response) => {
      if (request.method !== 'POST') { response.status(405).send('Method not allowed'); return; }
      try {
        const token = /^Bearer (.+)$/.exec(request.headers.authorization || '')?.[1];
        if (!token) { response.status(401).send('請先登入'); return; }
        // storeFor initializes the default Admin app; no database read occurs here.
        storeFor('_initialize');
        const identity = await getAuth().verifyIdToken(token);
        assertAllowedUser({ auth: { token: identity } }, 'Comfy Cloud 影片下載');
        assertExpectedComfyUid(request.body, identity.uid);
        await sendVideoDownloadChunk({ apiKey: apiKey.value(), requestId: request.body?.requestId, offset: request.body?.offset,
          store: storeFor(identity.uid), response });
      } catch {
        if (response.headersSent) response.destroy();
        else response.status(403).send('影片下載失敗，請確認登入帳號並重新查詢影片');
      }
    }),
  };
};
