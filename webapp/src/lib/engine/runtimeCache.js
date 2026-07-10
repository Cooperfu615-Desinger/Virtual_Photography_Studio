export function deepFreezeRuntime(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;

  seen.add(value);
  Object.values(value).forEach((child) => deepFreezeRuntime(child, seen));
  return Object.freeze(value);
}

export function createEngineRuntimeResolver(compileRuntime) {
  let defaultRuntime = null;

  return function getEngineRuntime(customLibrary = []) {
    const usesDefaultLibrary = Array.isArray(customLibrary) && customLibrary.length === 0;
    if (!usesDefaultLibrary) return compileRuntime(customLibrary);

    defaultRuntime ||= compileRuntime();
    return defaultRuntime;
  };
}
