import test from 'node:test';
import assert from 'node:assert/strict';
import { createEngineRuntimeResolver, deepFreezeRuntime } from './runtimeCache.js';

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
