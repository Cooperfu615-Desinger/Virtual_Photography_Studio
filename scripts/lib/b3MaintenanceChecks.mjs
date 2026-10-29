import assert from 'node:assert/strict';
// Projection names own wording, but must refer to exactly the authored layers.
export function validateCharacterItemNameOwnership(sources, names) {
  assert.deepEqual(Object.keys(names).sort(), Object.keys(sources).sort(), 'MJ character owners differ');
  let layers = 0;
  for (const [id, source] of Object.entries(sources)) {
    assert.ok(names[id] && typeof names[id] === 'object' && !Array.isArray(names[id]), id);
    assert.deepEqual(Object.keys(names[id]).sort(), Object.keys(source.layers).sort(), `MJ layers differ: ${id}`);
    for (const [layer, text] of Object.entries(names[id])) {
      assert.ok(typeof text === 'string' && text.trim(), `Empty MJ name: ${id}:${layer}`);
      layers++;
    }
  }
  return { characters: Object.keys(sources).length, layers };
}
