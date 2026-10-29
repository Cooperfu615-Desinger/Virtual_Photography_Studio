import { preB3WardrobeSource, restorePreB3WardrobeFiles } from './b3CharacterWardrobeReplay.mjs';
// Test-only inverse for the narrow PAGE2 follow-up. No production imports.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, realpathSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
export const PAGE2_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const PAGE2_REVIEW = JSON.parse(readFileSync(new URL('./page2AdultIdentityPatches.json', import.meta.url)));
export const PAGE2_BASE = PAGE2_REVIEW.baseCommit;
const hash = value => createHash('sha256').update(value).digest('hex');
export function prePage2AdultSource(path, source) {
  source = preB3WardrobeSource(path, source);
  const file = PAGE2_REVIEW.files.find(f => f.path === path);
  if (!file || hash(source) !== file.afterHash) return source;
  assert.equal(hash(file.beforeSource), file.beforeHash, 'PAGE2 inverse corrupt oracle');
  return Buffer.isBuffer(source) ? Buffer.from(file.beforeSource) : file.beforeSource;
}
export function restorePrePage2AdultFiles(directory, { allowPartial = false, prepareOnly = false } = {}) {
  assert.notEqual(realpathSync(directory), realpathSync(PAGE2_ROOT), 'PAGE2 inverse requires isolated copy');
  assert.ok(!existsSync(join(directory, '.git')), 'PAGE2 inverse rejects Git checkout');
  const b3 = restorePreB3WardrobeFiles(directory, { allowPartial: true, prepareOnly: true });
  const empty = b3;
  if (allowPartial && !PAGE2_REVIEW.files.some(f => existsSync(join(directory, f.path))
    && hash(preB3WardrobeSource(f.path, readFileSync(join(directory, f.path)))) === f.afterHash)) return empty;
  const prepared = [], states = [];
  for (const file of PAGE2_REVIEW.files) {
    const path = join(directory, file.path);
    if (allowPartial && !existsSync(path)) continue; // Earlier matrix fixtures copy only their own sealed paths.
    assert.ok(existsSync(path), 'PAGE2 inverse missing source: ' + file.path);
    assert.equal(hash(file.beforeSource), file.beforeHash, 'PAGE2 inverse corrupt oracle');
    const source = b3.sources.get(file.path) ?? readFileSync(path), sha = hash(source);
    assert.ok([file.beforeHash, file.afterHash].includes(sha), 'PAGE2 inverse rejects unknown source: ' + file.path);
    states.push(sha === file.afterHash ? 'after' : 'before');
    prepared.push([path, file.beforeSource]);
  }
  assert.ok(new Set(states).size <= 1, 'PAGE2 inverse rejects mixed sources');
  const after = states[0] === 'after', remove = [];
  for (const [path, sha] of Object.entries(PAGE2_REVIEW.newTests)) {
    const full = join(directory, path);
    if (allowPartial && !existsSync(full)) continue;
    assert.equal(existsSync(full), after, 'PAGE2 inverse missing/mixed tests: ' + path);
    if (after) { assert.equal(hash(readFileSync(full)), sha, 'PAGE2 inverse changed test'); remove.push(full); }
  }
  if (!after) return empty;
  const plan = {
    sources: new Map([...b3.sources, ...PAGE2_REVIEW.files.filter(f => prepared.some(([path]) => path === join(directory, f.path)))
      .map(f => [f.path, Buffer.from(f.beforeSource)])]),
    apply() {
      b3.apply();
      for (const [path, source] of prepared) writeFileSync(path, source);
      for (const path of remove) rmSync(path);
    },
  };
  if (!prepareOnly) plan.apply();
  return plan;
}
