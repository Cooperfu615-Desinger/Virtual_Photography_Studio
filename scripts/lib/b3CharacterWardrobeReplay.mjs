// Test-only inverse for the narrow B3 follow-up. No production imports.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, realpathSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
export const B3_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const B3_REVIEW = JSON.parse(readFileSync(new URL('./b3CharacterWardrobePatches.json', import.meta.url)));
export const B3_BASE = B3_REVIEW.baseCommit;
const hash = value => createHash('sha256').update(value).digest('hex');
export function preB3WardrobeSource(path, source) {
  const file = B3_REVIEW.files.find(f => f.path === path);
  if (!file || hash(source) !== file.afterHash) return source;
  assert.equal(hash(file.beforeSource), file.beforeHash, 'B3 inverse corrupt oracle');
  return Buffer.isBuffer(source) ? Buffer.from(file.beforeSource) : file.beforeSource;
}
export function restorePreB3WardrobeFiles(directory, { allowPartial = false, prepareOnly = false } = {}) {
  assert.notEqual(realpathSync(directory), realpathSync(B3_ROOT), 'B3 inverse requires isolated copy');
  assert.ok(!existsSync(join(directory, '.git')), 'B3 inverse rejects Git checkout');
  const empty = { sources: new Map(), apply() {} };
  if (allowPartial && !B3_REVIEW.files.some(f => existsSync(join(directory, f.path))
    && hash(readFileSync(join(directory, f.path))) === f.afterHash)) return empty;
  const prepared = [], states = [];
  for (const file of B3_REVIEW.files) {
    const path = join(directory, file.path);
    if (allowPartial && !existsSync(path)) continue; // Earlier matrix fixtures copy only their own sealed paths.
    assert.ok(existsSync(path), 'B3 inverse missing source: ' + file.path);
    assert.equal(hash(file.beforeSource), file.beforeHash, 'B3 inverse corrupt oracle');
    const source = readFileSync(path), sha = hash(source);
    assert.ok([file.beforeHash, file.afterHash].includes(sha), 'B3 inverse rejects unknown source: ' + file.path);
    states.push(sha === file.afterHash ? 'after' : 'before');
    prepared.push([path, file.beforeSource]);
  }
  assert.ok(new Set(states).size <= 1, 'B3 inverse rejects mixed sources');
  const after = states[0] === 'after', remove = [];
  for (const [path, sha] of Object.entries(B3_REVIEW.newFiles)) {
    const full = join(directory, path);
    if (allowPartial && !existsSync(full)) continue;
    assert.equal(existsSync(full), after, 'B3 inverse missing/mixed tests: ' + path);
    if (after) { assert.equal(hash(readFileSync(full)), sha, 'B3 inverse changed test'); remove.push(full); }
  }
  if (!after) return empty;
  const plan = {
    sources: new Map(B3_REVIEW.files.filter(f => prepared.some(([path]) => path === join(directory, f.path)))
      .map(f => [f.path, Buffer.from(f.beforeSource)])),
    apply() {
      for (const [path, source] of prepared) writeFileSync(path, source);
      for (const path of remove) rmSync(path);
    },
  };
  if (!prepareOnly) plan.apply();
  return plan;
}
