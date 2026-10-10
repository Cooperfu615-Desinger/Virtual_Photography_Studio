import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEngineRuntimeResolver,
  deepFreezeRuntime,
  prepareImmutableRuntimeLibrary,
} from './runtimeCache.js';

test('runtime resolver caches the default library and recompiles custom libraries', () => {
  let compileCount = 0;
  const getRuntime = createEngineRuntimeResolver((library = []) => ({
    compileNumber: ++compileCount,
    library,
  }));

  const defaultRuntime = getRuntime();
  assert.equal(getRuntime(), defaultRuntime);
  assert.equal(getRuntime([]), defaultRuntime);

  const customLibrary = [{ group: 'Character' }];
  assert.notEqual(getRuntime(customLibrary), getRuntime(customLibrary));
  assert.equal(compileCount, 3);
});

test('deepFreezeRuntime protects cached nested catalog state', () => {
  const runtime = deepFreezeRuntime({
    controls: [{ key: 'styleId', options: [{ id: 'none' }] }],
  });

  assert.equal(Object.isFrozen(runtime), true);
  assert.equal(Object.isFrozen(runtime.controls), true);
  assert.equal(Object.isFrozen(runtime.controls[0].options[0]), true);
  assert.throws(() => runtime.controls.push({ key: 'locationId' }), TypeError);
});

test('mutable custom libraries are recompiled after nested edits', () => {
  let compileCount = 0;
  const getRuntime = createEngineRuntimeResolver((library) => ({
    compileNumber: ++compileCount,
    label: library[0].options[0].label,
  }));
  const library = [{ options: [{ label: 'original' }] }];

  assert.equal(getRuntime(library).label, 'original');
  library[0].options[0].label = 'changed';
  assert.equal(getRuntime(library).label, 'changed');
  assert.equal(compileCount, 2);
});

test('prepared custom libraries compile once per identity and resolver', () => {
  let compileCount = 0;
  const compile = (library) => ({ compileNumber: ++compileCount, library });
  const getRuntime = createEngineRuntimeResolver(compile);
  const firstLibrary = prepareImmutableRuntimeLibrary([{ group: 'Character' }]);
  const secondLibrary = prepareImmutableRuntimeLibrary([{ group: 'Character' }]);

  const firstRuntime = getRuntime(firstLibrary);
  assert.equal(getRuntime(firstLibrary), firstRuntime);
  const secondRuntime = getRuntime(secondLibrary);
  assert.equal(getRuntime(secondLibrary), secondRuntime);
  assert.notEqual(secondRuntime, firstRuntime);
  assert.equal(compileCount, 2);

  const otherResolver = createEngineRuntimeResolver(compile);
  assert.notEqual(otherResolver(firstLibrary), firstRuntime);
  assert.equal(compileCount, 3);
});

test('preparing a library deeply protects data and preserves its identity', () => {
  const hiddenOptions = [{ id: 'hidden' }];
  const library = {
    groups: [{ options: [{ id: 'original' }] }],
    metadata: Object.assign(Object.create(null), { version: 1 }),
  };
  Object.defineProperty(library, 'hiddenOptions', { value: hiddenOptions });

  assert.equal(prepareImmutableRuntimeLibrary(library), library);
  assert.equal(prepareImmutableRuntimeLibrary(library), library);
  assert.equal(Object.isFrozen(library), true);
  assert.equal(Object.isFrozen(library.groups), true);
  assert.equal(Object.isFrozen(library.groups[0].options[0]), true);
  assert.equal(Object.isFrozen(library.metadata), true);
  assert.equal(Object.isFrozen(hiddenOptions[0]), true);
  assert.throws(() => { library.groups[0].options[0].id = 'changed'; }, TypeError);
  assert.throws(() => { library.metadata.version = 2; }, TypeError);
  assert.throws(() => hiddenOptions.push({ id: 'changed' }), TypeError);
});

test('unregistered frozen custom libraries still recompile', () => {
  let compileCount = 0;
  const getRuntime = createEngineRuntimeResolver((library) => ({
    compileNumber: ++compileCount,
    label: library.options[0].label,
  }));
  const frozenRoot = Object.freeze({ options: [{ label: 'original' }] });

  assert.equal(getRuntime(frozenRoot).label, 'original');
  frozenRoot.options[0].label = 'changed';
  assert.equal(getRuntime(frozenRoot).label, 'changed');

  const frozenTree = deepFreezeRuntime({ options: [{ label: 'fixed' }] });
  assert.notEqual(getRuntime(frozenTree), getRuntime(frozenTree));
  assert.equal(compileCount, 4);
});

test('prepared empty arrays retain the default runtime path', () => {
  let compileCount = 0;
  const getRuntime = createEngineRuntimeResolver((library = 'default') => ({
    compileNumber: ++compileCount,
    library,
  }));
  const defaultRuntime = getRuntime();

  assert.equal(getRuntime(prepareImmutableRuntimeLibrary([])), defaultRuntime);
  assert.equal(defaultRuntime.library, 'default');
  assert.equal(compileCount, 1);
});

test('preparation accepts cyclic plain data without repeated traversal', () => {
  const library = { entries: [] };
  library.entries.push(library);

  assert.equal(prepareImmutableRuntimeLibrary(library), library);
  assert.equal(library.entries[0], library);
  assert.equal(Object.isFrozen(library.entries), true);
  assert.throws(() => library.entries.pop(), TypeError);
});

test('preparation rejects unsupported roots and nested values before freezing', () => {
  const unsupported = [
    null, undefined, 1, 'library', true, Symbol('library'), 1n,
    () => {}, new Map(), new Set(), new Date(), /library/,
    Object.create({ inherited: true }),
  ];
  for (const value of unsupported) {
    assert.throws(() => prepareImmutableRuntimeLibrary(value), TypeError);
  }
  for (const invalid of unsupported.filter((value) => value !== null &&
    !['undefined', 'number', 'string', 'boolean'].includes(typeof value))) {
    const firstChild = { options: [] };
    const library = { firstChild, invalid };
    assert.throws(() => prepareImmutableRuntimeLibrary(library), TypeError);
    assert.equal(Object.isFrozen(library), false);
    assert.equal(Object.isFrozen(firstChild), false);
    assert.equal(Object.isFrozen(firstChild.options), false);
  }
});

test('preparation rejects accessors without invoking them', () => {
  let getterCount = 0;
  const library = { options: [] };
  Object.defineProperty(library, 'derived', {
    get() { getterCount += 1; return []; },
  });

  assert.throws(() => prepareImmutableRuntimeLibrary(library), TypeError);
  assert.equal(getterCount, 0);
  assert.equal(Object.isFrozen(library), false);
  assert.equal(Object.isFrozen(library.options), false);

  const withSymbolKey = { [Symbol('options')]: [] };
  assert.throws(() => prepareImmutableRuntimeLibrary(withSymbolKey), TypeError);
});

test('failed compilation of a prepared library is retried', () => {
  const library = prepareImmutableRuntimeLibrary({ options: [] });
  let compileCount = 0;
  const getRuntime = createEngineRuntimeResolver(() => {
    compileCount += 1;
    if (compileCount === 1) throw new Error('compile failed');
    return { compileCount };
  });

  assert.throws(() => getRuntime(library), /compile failed/);
  const runtime = getRuntime(library);
  assert.equal(getRuntime(library), runtime);
  assert.equal(compileCount, 2);
});
