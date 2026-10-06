import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatComfyQuota } from './comfyQuotaDisplay.js';
import { readComfyQuotaViaFirebase } from './comfyCloudProxyClient.js';
test('quota display preserves unavailable vs true zero and rounds Cloud credits', () => {
  assert.equal(formatComfyQuota(null).balance, '暫時無法取得');
  assert.equal(formatComfyQuota({ credits: 0, estimatedImages: 0 }).estimate, '約 0 張');
  assert.equal(formatComfyQuota({ credits: 4153.831699 }).balance, '4,154 Credits');
  assert.equal(formatComfyQuota({ credits: '0' }).balance, '暫時無法取得');
  assert.equal(formatComfyQuota({ sampleReadFailed: true }).estimate, '估算資料暫時無法取得');
  assert.equal(formatComfyQuota({ credits: 100, estimatedImages: -1 }).estimate, '尚無足夠估算資料');
  assert.equal(formatComfyQuota({ credits: null, estimatedImages: null }).estimate, '暫時無法估算');
  assert.equal(formatComfyQuota({ credits: 211, estimatedImages: null, estimateUnavailableReason: 'partnerPricing' }).estimate, '此模型暫不估算張數');
});
test('quota refresh sends only selection to a read-only callable', async () => {
  const calls = [];
  const session = { uid: 'user', call: async (...args) => { calls.push(args); return { credits: 10 }; } };
  assert.deepEqual(await readComfyQuotaViaFirebase({ modelKey: 'qwenImage21', resolution: '1k', aspectRatio: '9:16', prompt: 'private' }, { session }), { credits: 10 });
  assert.deepEqual(calls, [['comfyCloudQuota', { modelKey: 'qwenImage21', resolution: '1k', aspectRatio: '9:16' }]]);
});
