import assert from 'node:assert/strict';
import { digest } from './sceneIntegratedAssemblyTestSupport.js';

export function restoreCapturedFixtureRows(baseline, group, fixtures, rows) {
  const record = baseline.groups[group];
  assert.ok(record, `unknown fixture group: ${group}`);
  assert.equal(rows.length, record.rows.length, `${group}: fixture count`);
  assert.equal(digest(fixtures.map(fixture => fixture.id)), record.idsHash, `${group}: fixture order`);
  return rows.map((row, index) => {
    // Captures and protected baselines use JSON serialization; duplicate
    // references must become independent just as they do in those captures.
    const restored = JSON.parse(JSON.stringify(row));
    for (const [path, patternIndex] of baseline.descriptors[record.rows[index]]) {
      const pattern = baseline.patterns[patternIndex];
      const parent = path.slice(0, -1).reduce((value, key) => value[key], restored);
      const key = path.at(-1);
      if (pattern.kind === 'text') {
        assert.equal(parent[key].split(pattern.after).length - 1, 1, `${group}/${index}/${path.join('.')}: exact wardrobe change`);
        parent[key] = parent[key].replace(pattern.after, pattern.before);
      } else {
        assert.deepEqual(parent[key], pattern.after, `${group}/${index}/${path.join('.')}: exact wardrobe value`);
        parent[key] = structuredClone(pattern.before);
      }
    }
    return restored;
  });
}
