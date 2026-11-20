// Exact inverse for approved Seedream 5.5 UI/provider additions. Historical seals remain unchanged.
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import review from './seedream55Replay.json' with { type: 'json' };
const hash = value => createHash('sha256').update(value).digest('hex');
export function preSeedream55Source(path, source) {
 const file = review.files.find(item => item.path === path);
 if (!file || hash(source) !== file.afterHash) return source;
 assert.equal(hash(file.beforeSource), file.beforeHash, 'Seedream 5.5 inverse corruption');
 return Buffer.isBuffer(source) ? Buffer.from(file.beforeSource) : file.beforeSource;
}
