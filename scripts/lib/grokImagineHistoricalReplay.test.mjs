import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { preGrokImagineSource } from './grokImagineHistoricalReplay.mjs';
import seal from './grokImagineHistoricalSeal.json' with { type: 'json' };
const source=readFileSync(new URL('../../webapp/src/lib/engine.js',import.meta.url));
const hash=value=>createHash('sha256').update(value).digest('hex');
test('historical inverse restores only the exact sealed pre-change engine',()=>{
 const before=preGrokImagineSource(seal.source,source);
 assert.equal(hash(before),seal.beforeHash);
 assert.equal(hash(preGrokImagineSource(seal.source,before)),seal.beforeHash);
 assert.throws(()=>preGrokImagineSource(seal.source,Buffer.concat([source,Buffer.from('\n// unexpected edit')])));
 assert.equal(preGrokImagineSource('unrelated',source),source);
});
