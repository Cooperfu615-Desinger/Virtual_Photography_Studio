const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { runInNewContext } = require('node:vm');
const { assertExpectedComfyUid } = require('../src/comfyCloud');

test('Comfy account expectation matches exactly and remains optional for existing clients', () => {
  assert.doesNotThrow(() => assertExpectedComfyUid({ expectedUid: 'user-a' }, 'user-a'));
  assert.doesNotThrow(() => assertExpectedComfyUid({}, 'user-a'));
  assert.doesNotThrow(() => assertExpectedComfyUid(undefined, 'user-a'));
  for (const expectedUid of ['user-b', '', null, 1]) {
    assert.throws(() => assertExpectedComfyUid({ expectedUid }, 'user-a'), /登入帳號已變更/);
  }
});

function createHandlerFixture() {
  const counters = { stores: 0, submits: 0, reads: 0, owners: [] };
  const exported = {};
  class HttpsError extends Error {
    constructor(code, message) { super(message); this.code = code; }
  }
  const modules = {
    'firebase-functions/v2/https': { onCall: (_, handler) => handler, HttpsError },
    'firebase-functions/params': { defineSecret: () => ({ value: () => 'server-fixture' }) },
    'firebase-functions/logger': {},
    'firebase-admin/app': { getApps: () => [{ name: '[DEFAULT]' }] },
    'firebase-admin/firestore': { getFirestore: () => {
      counters.stores += 1;
      return { collection: () => ({ doc: uid => {
        counters.owners.push(uid);
        return { collection: () => ({}) };
      } }) };
    } },
    './src/comfyCloud': {
      assertExpectedComfyUid,
      submitComfyJob: async () => { counters.submits += 1; return { status: 'queued' }; },
      readComfyJob: async () => { counters.reads += 1; return { status: 'running' }; },
    },
    './src/comfyQuota': { createQuotaReader: () => async () => ({}) },
  };
  runInNewContext(readFileSync(path.join(__dirname, '../index.js'), 'utf8'), {
    exports: exported, process: { env: {} },
    require: name => Object.hasOwn(modules, name) ? modules[name] : require(path.join(__dirname, '..', name)),
  });
  return { counters, exported };
}

test('both Comfy callables stop changed accounts before creating a store or reaching submission/status operations', async () => {
  for (const name of ['comfyCloudSubmit', 'comfyCloudStatus']) {
    const { counters, exported } = createHandlerFixture();
    const auth = { uid: 'user-b', token: { email: 'nailai7981.ai@gmail.com' } };
    await assert.rejects(exported[name]({ auth, data: { expectedUid: 'user-a' } }), {
      code: 'failed-precondition', message: '登入帳號已變更，請重新操作',
    });
    assert.deepEqual(counters, { stores: 0, submits: 0, reads: 0, owners: [] });
    for (const data of [{ expectedUid: 'user-b' }, {}]) await exported[name]({ auth, data });
    assert.equal(counters.stores, 2);
    assert.deepEqual(counters.owners, ['user-b', 'user-b']);
    assert.equal(counters.submits, name === 'comfyCloudSubmit' ? 2 : 0);
    assert.equal(counters.reads, name === 'comfyCloudStatus' ? 2 : 0);
  }
});
