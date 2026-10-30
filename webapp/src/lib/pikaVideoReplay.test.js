import { test } from 'node:test';
import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prePikaVideoSource, PIKA_VIDEO_PATH } from '../../../scripts/lib/pikaVideoReplay.mjs';
const review = JSON.parse(readFileSync(new URL('../../../scripts/lib/pikaVideoReplay.json', import.meta.url)));
test('Pika replay restores only the exact reviewed video UI and leaves unrecognized content untouched', () => {
  const current = readFileSync(new URL('../components/VideoWorkspace.jsx', import.meta.url));
  assert.equal(prePikaVideoSource(PIKA_VIDEO_PATH, current).toString(), review.beforeSource);
  assert.equal(prePikaVideoSource(PIKA_VIDEO_PATH, review.beforeSource), review.beforeSource);
  const altered = Buffer.concat([current, Buffer.from('unreviewed')]);
  assert.equal(prePikaVideoSource(PIKA_VIDEO_PATH, altered), altered);
  assert.equal(prePikaVideoSource('other', current), current);
});
