export function loadJsonStorage(key, fallback, storage = globalThis.window?.localStorage) {
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function loadStringStorage(key, fallback, storage = globalThis.window?.localStorage) {
  if (!storage) return fallback;

  try {
    return storage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveJsonStorage(key, value, storage = globalThis.window?.localStorage) {
  if (!storage) return false;

  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
