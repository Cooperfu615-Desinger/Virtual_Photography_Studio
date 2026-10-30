// Narrow test-only forward inverse; original historical evidence remains unchanged.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const review = JSON.parse(readFileSync(new URL('./pikaVideoReplay.json', import.meta.url)));
const hash = value => createHash('sha256').update(value).digest('hex');
export const PIKA_VIDEO_PATH = review.path;
export function prePikaVideoSource(path, source) {
  if (path !== review.path || hash(source) !== review.afterHash) return source;
  assert.equal(hash(review.beforeSource), review.beforeHash, 'Pika replay source is corrupt');
  return Buffer.isBuffer(source) ? Buffer.from(review.beforeSource) : review.beforeSource;
}
