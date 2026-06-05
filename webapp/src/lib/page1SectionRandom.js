export function randomizeLockKeys(locks, keys, defaultLocks = {}) {
  const next = { ...locks };
  Array.from(new Set(keys)).forEach((key) => {
    next[key] = defaultLocks[key] ?? '';
  });
  return next;
}

export function setLockKeysToNone(locks, keys, controls = []) {
  const next = { ...locks };
  const controlsByKey = new Map(controls.map((control) => [control.key, control]));

  Array.from(new Set(keys)).forEach((key) => {
    if (key === 'subjectCount') return;
    const noneOption = controlsByKey.get(key)?.options?.find((option) => option.zh === '全無');
    next[key] = noneOption?.id || (Array.isArray(next[key]) ? [] : '');
  });

  return next;
}
