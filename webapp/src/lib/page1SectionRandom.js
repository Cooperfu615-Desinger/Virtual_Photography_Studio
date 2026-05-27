export function randomizeLockKeys(locks, keys, defaultLocks = {}) {
  const next = { ...locks };
  Array.from(new Set(keys)).forEach((key) => {
    next[key] = defaultLocks[key] ?? '';
  });
  return next;
}
