// Exact inverse for approved H3 Image dimensions UI/provider additions. Historical seals remain unchanged.
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import review from './h3ImageSizesReplay.json' with { type: 'json' };
const hash = value => createHash('sha256').update(value).digest('hex');
export function preH3ImageSizesSource(path, source) {
 const file = review.files.find(item => item.path === path);
 if (!file || hash(source) !== file.afterHash) return source;
 assert.equal(hash(file.beforeSource), file.beforeHash, 'H3 Image dimensions inverse corruption');
 return Buffer.isBuffer(source) ? Buffer.from(file.beforeSource) : file.beforeSource;
}
