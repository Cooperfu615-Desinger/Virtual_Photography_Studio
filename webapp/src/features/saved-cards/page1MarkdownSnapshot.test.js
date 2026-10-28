import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import JSZip from 'jszip';
import { createSavedCardsArchive, parseSavedCardsArchive } from './savedCardArchive.js';
import { encodePage1MarkdownSnapshot, decodePage1MarkdownSnapshot } from './page1MarkdownSnapshot.js';
import { normalizeZImageDisplayLabel } from './promptLabels.js';
import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyLocks, getLockControls, normalizeLocks } from '../../lib/engine.js';
import { buildMarkdownExport, parseExportedMarkdownPrompt, serializeFavoritePrompt, deserializeFavoritePrompt } from './cardCodec.js';
const controls = getLockControls();
const card = () => ({ id: 'snapshot-fixture', date: '2026-10-27T00:00:00.000Z', summary: '完整選值',
  source: 'page1', selection: normalizeLocks({ ...createEmptyLocks(), topBottomPaletteId: 'white-black' }),
  grokPrompt: '  Original text without recoverable clothing.\n', midjourneyPrompt: '  AI text  ', zImagePrompt: 'Z text',
  nanoBananaPrompt: '  Nano\ntext  ', extraPrompts: [
    { id: 'chest-up-portrait', label: '胸上特寫照', text: '  Chest source\n' },
    { id: 'full-body-character', label: '全身角色照', text: 'Full source' },
  ],
});
test('PAGE1 Markdown restores complete selections before prose and preserves every output byte', () => {
  const p = card();
  const actual = parseExportedMarkdownPrompt(buildMarkdownExport(p), controls, 'import');
  assert.deepEqual(actual.selection, p.selection);
  for (const key of ['grokPrompt', 'midjourneyPrompt', 'zImagePrompt', 'nanoBananaPrompt', 'extraPrompts']) assert.deepEqual(actual[key], p[key]);
});

function change(markdown, fn) {
  const line = markdown.slice(0, markdown.indexOf(' -->\n') + 5);
  const payload = JSON.parse(line.slice('<!-- VPStudio PAGE1 Snapshot: '.length, -5));
  fn(payload);
  return '<!-- VPStudio PAGE1 Snapshot: ' + JSON.stringify(payload).replace(/</g, '\\u003c').replace(/>/g, '\\u003e') + ' -->\n' + markdown.slice(line.length);
}
const singleExport = (() => {
  const source = readFileSync(new URL('../../components/PromptCard.jsx', import.meta.url), 'utf8');
  return runInNewContext(source.slice(source.indexOf('function buildMarkdownExport'), source.indexOf('const SUMMARY_FIELD_LABELS')) + '\nbuildMarkdownExport',
    { encodePage1MarkdownSnapshot, normalizeZImageDisplayLabel });
})();
test('actual single-card and ZIP exporters share identical metadata and preserve their readable bodies', async () => {
  const p = card(), single = singleExport(p), archive = buildMarkdownExport(p);
  assert.equal(single.split('\n')[0], archive.split('\n')[0]);
  assert.ok(single.indexOf('## Gpt') < single.indexOf('## AI Prompt'));
  assert.ok(archive.indexOf('## AI Prompt') < archive.indexOf('## Gpt'));
  for (const md of [single, archive]) {
    const restored = parseExportedMarkdownPrompt(md, controls, 'same');
    assert.deepEqual(restored.selection, deserializeFavoritePrompt(serializeFavoritePrompt(p)).selection);
    assert.deepEqual(restored.extraPrompts, p.extraPrompts);
    const zip = new JSZip(); zip.file('prompt_single.md', md);
    const [fromZip] = await parseSavedCardsArchive(await zip.generateAsync({ type: 'uint8array' }), controls);
    assert.deepEqual(fromZip.selection, restored.selection);
    assert.deepEqual(fromZip.extraPrompts, p.extraPrompts);
  }
  const [restored] = await parseSavedCardsArchive(await createSavedCardsArchive([p], 0, 'uint8array'), controls);
  assert.deepEqual(restored.selection, p.selection);
});
test('CRLF, whitespace, Unicode, comment tokens and historical extra outputs preserve exact text', () => {
  const p = card(); p.grokPrompt = '  中文\r\n<!-- VPStudio PAGE1 Snapshot: literal -->\n```text\nembedded\n```  ';
  p.extraPrompts.push({ id: 'chest-up-mj-portrait', label: '歷史衍生輸出', text: '  old --ar 4:5  ' });
  for (const md of [singleExport(p), buildMarkdownExport(p)].map(md => md.replace(/(?<!\r)\n/g, '\r\n'))) {
    const restored = parseExportedMarkdownPrompt(md, controls, 'same');
    assert.equal(restored.grokPrompt, p.grokPrompt);
    assert.deepEqual(restored.extraPrompts, p.extraPrompts);
  }
});
test('new snapshots preserve PAGE1 MJ ratio ownership instead of inferring the rendered ratio', () => {
  const p = card(); p.selection = normalizeLocks({ ...p.selection, aspectRatio: '3:4', mjAspectRatio: 'page1', mjStylize: 333 });
  const restored = parseExportedMarkdownPrompt(buildMarkdownExport(p), controls, 'same');
  assert.equal(restored.selection.mjAspectRatio, 'page1');
  assert.equal(restored.selection.mjStylize, 333);
});
test('non-PAGE1 and cards without selections retain legacy format', () => {
  for (const source of ['page2', 'page3', 'actionPose']) assert.equal(encodePage1MarkdownSnapshot({ ...card(), source }), '');
  assert.equal(encodePage1MarkdownSnapshot({ ...card(), selection: null }), '');
  assert.equal(decodePage1MarkdownSnapshot('old markdown'), null);
});
for (const [name, mutate] of [
  ['version', p => { p.version = 2; }], ['source', p => { p.source = 'page2'; }],
  ['missing key', p => { delete p.selection.topId; }], ['extra key', p => { p.selection.unreviewed = ''; }],
  ['unknown ID', p => { p.selection.topId = 'missing-issued-ID'; }], ['wrong type', p => { p.selection.topId = []; }],
  ['bad numeric range', p => { p.selection.mjStylize = -500; }],
  ['bad hidden enum', p => { p.selection.captureMode = 'broken'; }],
  ['bad nested capture', p => { p.selection.observationCapture = { version: 999 }; }],
  ['bad output', p => { p.outputs.grokPrompt = 42; }],
  ['duplicate extra ID', p => { p.outputs.extraPrompts.push(p.outputs.extraPrompts[0]); }],
  ['bad label', p => { p.outputs.extraPrompts[0].label += '\n## Gpt'; }],
  ['unknown payload field', p => { p.unknown = 1; }],
]) test('new metadata rejects ' + name + ' without prose fallback', () => {
  assert.throws(() => parseExportedMarkdownPrompt(change(buildMarkdownExport(card()), mutate), controls, 'same'));
});
for (const [name, mutate] of [
  ['truncated', md => md.slice(0, 80)],
  ['duplicate marker', md => md.split('\n')[0] + '\n' + md],
  ['duplicate JSON key', md => md.replace('"version":1', '"version":2,"version":1')],
  ['unsafe key', md => md.replace('"version":1', '"__proto__":{},"version":1')],
  ['changed visible text', md => md.replace('## Gpt\n```text\n  Original', '## Gpt\n```text\n  Altered')],
  ['missing extra block', md => md.replace('## 全身角色照\n```text\nFull source\n```', '')],
  ['legacy conflict', md => md.replace('# Generated Prompt', '<!-- VPStudio Optional Silence: {"topBottomPaletteId":"none"} -->\n# Generated Prompt')],
]) test('new metadata rejects ' + name, () => assert.throws(() => parseExportedMarkdownPrompt(mutate(buildMarkdownExport(card())), controls, 'same')));
test('known issued legacy option IDs migrate while other IDs are rejected', () => {
  const c = controls.find(c => c.options.some(o => o.legacyIds?.length));
  const o = c.options.find(o => o.legacyIds?.length);
  const md = change(buildMarkdownExport(card()), p => { p.selection[c.key] = o.legacyIds[0]; });
  assert.equal(parseExportedMarkdownPrompt(md, controls, 'same').selection[c.key], normalizeLocks({ ...card().selection, [c.key]: o.legacyIds[0] }, controls)[c.key]);
});

test('header-like public text cannot replace the real card summary', () => {
  const p = card(); p.grokPrompt = '**Summary:** not the card summary\n**Source:** not the source';
  const restored = parseExportedMarkdownPrompt(buildMarkdownExport(p), controls, 'same');
  assert.equal(restored.summary, p.summary); assert.equal(restored.grokPrompt, p.grokPrompt);
});

test('nested capture IDs and dormant scene restore are validated even in capture mode', () => {
  const md = buildMarkdownExport(card());
  assert.throws(() => parseExportedMarkdownPrompt(change(md, p => {
    p.selection.observationCapture = normalizeLocks({ observationCapture: {} }).observationCapture;
    p.selection.observationCapture.selected.scene = 'unknown-scene';
  }), controls));
  assert.throws(() => parseExportedMarkdownPrompt(change(md, p => {
    p.selection.captureMode = 'observation'; p.selection.specifiedActionSceneRestore = { unknown: 'data' };
  }), controls));
});
test('metadata limits reject excessive size or nesting', () => {
  const md = buildMarkdownExport(card());
  assert.throws(() => parseExportedMarkdownPrompt(change(md, p => { p.outputs.grokPrompt = 'x'.repeat(8 * 1024 * 1024); }), controls));
  assert.throws(() => parseExportedMarkdownPrompt(change(md, p => { let v = {}; p.selection.observationCapture = v; for (let n = 0; n < 65; n++) { v.child = {}; v = v.child; } }), controls));
});

test('supine scene-none sentinel remains a valid round-trip without allowing arbitrary location IDs', () => {
  const p = card();
  p.selection = normalizeLocks({ ...p.selection, subjectCount: '1', poseBaseId: 'lying', poseOrientationId: 'lying-supine' });
  assert.equal(p.selection.locationId, 'none');
  const markdown = buildMarkdownExport(p);
  assert.ok(markdown.startsWith('<!-- VPStudio PAGE1 Snapshot:'));
  assert.deepEqual(parseExportedMarkdownPrompt(markdown, controls, 'supine').selection, p.selection);
  assert.throws(() => parseExportedMarkdownPrompt(change(markdown, payload => {
    payload.selection.locationId = 'unknown-location';
  }), controls, 'bad'), /unknown ID: locationId/);
});
