import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import config from './preview.config.mjs';

test('preview isolates local/session storage and DLL IndexedDB across reload', async () => {
  const code = config.plugins.at(-1).transformIndexHtml.handler()[0].children;
  const calls = [];
  const local = { private: 'untouched' };
  const session = { private: 'untouched' };
  const indexedDB = {
    open(...args) { calls.push(['open', ...args]); },
    deleteDatabase(...args) { calls.push(['delete', ...args]); },
    databases() { throw new Error('Private inventory must not be read'); },
  };
  const sandbox = name => ({
    window: { name, localStorage: local, sessionStorage: session, indexedDB, addEventListener() {} },
    document: { documentElement: { dataset: {} } },
    crypto: { randomUUID: () => 'synthetic-id' },
  });
  const first = sandbox('');
  vm.runInNewContext(code, first);
  first.window.localStorage.setItem('qa', 'yes');
  first.window.sessionStorage.setItem('qa-session', 'yes');
  first.window.indexedDB.open('dll-image');
  first.window.indexedDB.open('dll-video', 3);
  first.window.indexedDB.deleteDatabase('dll-image');
  assert.equal((await first.window.indexedDB.databases()).length, 0);
  assert.deepEqual(calls, [
    ['open', 'vps-upper-body-state-b3-qa-synthetic-id:dll-image'],
    ['open', 'vps-upper-body-state-b3-qa-synthetic-id:dll-video', 3],
    ['delete', 'vps-upper-body-state-b3-qa-synthetic-id:dll-image'],
  ]);
  const restored = sandbox(first.window.name);
  vm.runInNewContext(code, restored);
  assert.equal(restored.window.localStorage.getItem('qa'), 'yes');
  assert.equal(restored.window.sessionStorage.getItem('qa-session'), 'yes');
  restored.window.indexedDB.open('dll-image');
  assert.deepEqual(calls.at(-1), calls[0]);
  assert.deepEqual(local, { private: 'untouched' });
  assert.deepEqual(session, { private: 'untouched' });
  assert.equal(first.document.documentElement.dataset.validationPageErrors, '[]');
});
