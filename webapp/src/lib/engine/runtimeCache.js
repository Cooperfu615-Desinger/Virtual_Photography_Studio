const immutableRuntimeLibraries = new WeakSet();

function isPlainRuntimeData(value) {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return Array.isArray(value)
    ? prototype === Array.prototype
    : prototype === Object.prototype || prototype === null;
}

// Opt in only after a custom catalog is complete. A new catalog revision must
// use a new identity; ordinary custom libraries retain per-call compilation.
export function prepareImmutableRuntimeLibrary(value) {
  if (immutableRuntimeLibraries.has(value)) return value;
  if (!isPlainRuntimeData(value)) {
    throw new TypeError('Immutable runtime libraries require a plain object or array');
  }

  const seen = new WeakSet();
  const nodes = [];
  const pending = [value];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === null || ['undefined', 'string', 'number', 'boolean'].includes(typeof current)) {
      continue;
    }
    if (!isPlainRuntimeData(current)) {
      throw new TypeError('Immutable runtime libraries require plain data throughout');
    }
    if (seen.has(current)) continue;
    seen.add(current);
    nodes.push(current);

    const descriptors = Object.getOwnPropertyDescriptors(current);
    for (const key of Reflect.ownKeys(descriptors)) {
      const descriptor = descriptors[key];
      if (typeof key === 'symbol' || !Object.hasOwn(descriptor, 'value')) {
        throw new TypeError('Immutable runtime libraries cannot contain symbols or accessors');
      }
      pending.push(descriptor.value);
    }
  }

  // Validate the entire tree before freezing any part, without reading getters.
  nodes.reverse().forEach((node) => Object.freeze(node));
  immutableRuntimeLibraries.add(value);
  return value;
}

export function deepFreezeRuntime(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;

  seen.add(value);
  Object.values(value).forEach((child) => deepFreezeRuntime(child, seen));
  return Object.freeze(value);
}

export function createEngineRuntimeResolver(compileRuntime) {
  let defaultRuntime = null;
  const immutableRuntimes = new WeakMap();

  return function getEngineRuntime(customLibrary = []) {
    const usesDefaultLibrary = Array.isArray(customLibrary) && customLibrary.length === 0;
    if (!usesDefaultLibrary) {
      if (!immutableRuntimeLibraries.has(customLibrary)) return compileRuntime(customLibrary);
      if (!immutableRuntimes.has(customLibrary)) {
        immutableRuntimes.set(customLibrary, compileRuntime(customLibrary));
      }
      return immutableRuntimes.get(customLibrary);
    }

    defaultRuntime ||= compileRuntime();
    return defaultRuntime;
  };
}
