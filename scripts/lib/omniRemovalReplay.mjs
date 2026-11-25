import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import review from './omniRemovalReplay.json' with { type: 'json' };
const hash = value => createHash('sha256').update(value).digest('hex');
export function preOmniRemovalSource(path, source) {
  const file = review.files.find(item => item.path === path);
  if (!file || hash(source) !== file.afterHash) return source;
  assert.equal(hash(file.beforeSource), file.beforeHash, 'Omni removal inverse corruption');
  return Buffer.isBuffer(source) ? Buffer.from(file.beforeSource) : file.beforeSource;
}
