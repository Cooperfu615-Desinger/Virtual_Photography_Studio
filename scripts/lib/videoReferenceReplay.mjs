// Only inverse the exact approved UI change for historical prompt replay.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const manifest = JSON.parse(readFileSync(new URL('./videoReferenceReplay.json', import.meta.url)));
const hash = value => createHash('sha256').update(value).digest('hex');
export const videoReferenceHistoricalPaths = manifest.files.map(file => file.path);
export function preVideoReferenceSource(path, source) {
  const review = manifest.files.find(file => file.path === path);
  if (!review || hash(source) !== review.afterHash) return source;
  assert.equal(hash(review.beforeSource), review.beforeHash, 'Reference video inverse corrupt');
  return Buffer.isBuffer(source) ? Buffer.from(review.beforeSource) : review.beforeSource;
}
