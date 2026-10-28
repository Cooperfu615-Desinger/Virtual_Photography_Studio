import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createEmptyLocks } from '../../lib/engine.js';
import { encodeSavedCardExportMetadata, encodePage1MarkdownSnapshot, SAVED_CARD_BACKUP_MARKER } from './page1MarkdownSnapshot.js';
import { buildMarkdownExport, parseExportedMarkdownPrompt } from './cardCodec.js';
import { normalizeZImageDisplayLabel } from './promptLabels.js';
const source = readFileSync(new URL('../../components/PromptCard.jsx', import.meta.url), 'utf8');
const singleExport = runInNewContext(source.slice(source.indexOf('function buildMarkdownExport'), source.indexOf('const SUMMARY_FIELD_LABELS')) + '\nbuildMarkdownExport',
  { encodePage1MarkdownSnapshot: encodeSavedCardExportMetadata, normalizeZImageDisplayLabel });
const card = () => ({ id: 'legacy', source: 'page1', date: '2026-10-27', summary: '原始摘要',
  selection: { ...createEmptyLocks(), captureMode: 'observation', locationId: 'unknown-old-location' },
  grokPrompt: '  中文 <tag> -->\n原始文字 ', midjourneyPrompt: ' AI ', zImagePrompt: ' Z ',
  extraPrompts: [{ id: 'old-output', label: '舊輸出', text: ' 原文 ' }], structured: {} });
test('single and archive Markdown preserve identical raw backup and readable original text', () => {
  const p = card(), before = structuredClone(p);
  assert.throws(() => encodePage1MarkdownSnapshot(p), /unknown ID: locationId/);
  const single = singleExport(p), archive = buildMarkdownExport(p);
  assert.equal(single.split('\n')[0], archive.split('\n')[0]);
  for (const markdown of [single, archive]) {
    assert.ok(markdown.startsWith(SAVED_CARD_BACKUP_MARKER));
    const line = markdown.split('\n')[0];
    const backup = JSON.parse(line.slice(SAVED_CARD_BACKUP_MARKER.length, -4));
    assert.deepEqual(backup.card, p);
    assert.equal(backup.restoreStatus, 'backup-only');
    assert.equal((line.match(/-->/g) || []).length, 1);
    for (const text of [p.grokPrompt, p.midjourneyPrompt, p.zImagePrompt, p.extraPrompts[0].text]) assert.ok(markdown.includes(text));
    assert.throws(() => parseExportedMarkdownPrompt(markdown), /備份.*無法直接匯入/);
  }
  assert.deepEqual(p, before);
});
test('historical extra-output identity conflicts can be backed up without pretending to be valid snapshots', () => {
  const p = card(); p.selection = createEmptyLocks();
  p.extraPrompts.push({ id: 'nano-banana-2.1', label: '舊 Nano', text: '舊原文' });
  assert.throws(() => encodePage1MarkdownSnapshot(p), /extra output identity/);
  assert.ok(encodeSavedCardExportMetadata(p).startsWith(SAVED_CARD_BACKUP_MARKER));
});
test('unexpected serialization faults are not silently swallowed', () => {
  const p = card(); p.selection.observationCapture = { circular: p };
  assert.throws(() => encodeSavedCardExportMetadata(p));
});

test('ordinary historical unknown IDs are preserved before normalization can replace them', () => {
  const p = card(); p.selection.captureMode = 'standard';
  const metadata = encodeSavedCardExportMetadata(p);
  assert.ok(metadata.startsWith(SAVED_CARD_BACKUP_MARKER));
  const payload = JSON.parse(metadata.split('\n')[0].slice(SAVED_CARD_BACKUP_MARKER.length, -4));
  assert.equal(payload.card.selection.locationId, p.selection.locationId);
});
