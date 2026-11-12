// Opt-in UI validation server with synthetic restore fixtures; never changes product config or real storage.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { mergeConfig } from '../../../../webapp/node_modules/vite/dist/node/index.js';
import original from '../../../../webapp/vite.config.js';

const initial = JSON.parse(readFileSync(new URL('./preview-state.json', import.meta.url), 'utf8'));
const bootstrap = `(() => {
  const marker = 'vps-upper-body-state-batch3-validation:';
  let state = { local: ${JSON.stringify(initial)}, session: {} };
  if (window.name.startsWith(marker)) {
    try { state = JSON.parse(window.name.slice(marker.length)); } catch { /* Fresh synthetic state. */ }
  }
  state.databasePrefix ||= 'vps-upper-body-state-b3-qa-' + crypto.randomUUID() + ':';
  const persist = () => { window.name = marker + JSON.stringify(state); };
  const memory = part => ({
    getItem: key => Object.prototype.hasOwnProperty.call(state[part], key) ? state[part][key] : null,
    setItem: (key, value) => { state[part][key] = String(value); persist(); },
    removeItem: key => { delete state[part][key]; persist(); },
    clear: () => { state[part] = {}; persist(); },
    key: index => Object.keys(state[part])[index] || null,
    get length() { return Object.keys(state[part]).length; },
  });
  Object.defineProperty(window, 'localStorage', { value: memory('local'), configurable: true });
  Object.defineProperty(window, 'sessionStorage', { value: memory('session'), configurable: true });
  // DLL image/video histories use IndexedDB independently of localStorage.
  // Route every operation to this synthetic tab's namespace and never list real databases.
  const originalIndexedDB = window.indexedDB;
  if (originalIndexedDB) Object.defineProperty(window, 'indexedDB', {
    configurable: true,
    value: new Proxy(originalIndexedDB, { get(target, key) {
      if (key === 'open') return (name, version) => version === undefined
        ? target.open(state.databasePrefix + name) : target.open(state.databasePrefix + name, version);
      if (key === 'deleteDatabase') return name => target.deleteDatabase(state.databasePrefix + name);
      if (key === 'databases') return async () => [];
      const value = Reflect.get(target, key, target);
      return typeof value === 'function' ? value.bind(target) : value;
    } }),
  });
  persist();
  const errors = [];
  const report = () => { document.documentElement.dataset.validationPageErrors = JSON.stringify(errors); };
  window.addEventListener('error', event => { errors.push(event.message); report(); });
  window.addEventListener('unhandledrejection', event => { errors.push(String(event.reason)); report(); });
  report();
})();`;

export default mergeConfig(original, {
  root: fileURLToPath(new URL('../../../../webapp/', import.meta.url)),
  define: { 'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify('') },
  plugins: [{
    name: 'isolated-upper-body-state-batch3-validation',
    transformIndexHtml: { order: 'pre', handler: () => [
      { tag: 'script', children: bootstrap, injectTo: 'head-prepend' },
    ] },
  }],
});
