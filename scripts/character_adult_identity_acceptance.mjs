// Independent output oracle: fixed Git inputs + one literal source sentence at one exact position.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, symlinkSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import * as current from '../webapp/src/lib/engine.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import * as lab from '../webapp/src/lib/characterCardLab.js';
import * as capture from '../webapp/src/lib/observationCaptureMode.js';
import { CHARACTER_PROFILE_OPTIONS } from '../webapp/src/lib/engine/characterProfiles.js';
import { stablePrompt, sha256, pack, readJson } from './lib/catalogBaseline.mjs';
import { captureImportFlows } from './lib/catalogImportCorpus.mjs';
import { A1_ROOT as root, A1_BASE_COMMIT as base, preA1EngineSource } from './lib/a1AdultIdentityHistoricalReplay.mjs';
const git = (...args) => execFileSync('git', ['-C', root, ...args], { maxBuffer: 256 * 1024 * 1024 });
const out = resolve(process.argv[2] || '/tmp/vps-a1-acceptance'); mkdirSync(out, { recursive: true });
const temp = mkdtempSync(join(tmpdir(), 'vps-a1-oracle-'));
try {
  execFileSync('tar', ['-x', '-C', temp], { input: git('archive', base, 'webapp/src', 'webapp/package.json', 'webapp/package-lock.json', 'scripts', 'knowledge_base') });
  symlinkSync(join(root, 'webapp/node_modules'), join(temp, 'webapp/node_modules'), 'dir');
  const load = file => import(pathToFileURL(join(temp, file)).href);
  const old = await load('webapp/src/lib/engine.js'), oldCodec = await load('webapp/src/features/saved-cards/cardCodec.js'), oldLab = await load('webapp/src/lib/characterCardLab.js');
  const source = readFileSync(join(root, 'webapp/src/lib/engine.js'), 'utf8');
  assert.equal(preA1EngineSource(source), git('show', base + ':webapp/src/lib/engine.js').toString(), 'only approved renderer insertions');
  const protectedPaths = git('ls-tree', '-r', '--name-only', base).toString().trim().split('\n').filter(p => /^(knowledge_base\/|webapp\/src\/)/.test(p) && !p.endsWith('.test.js') && p !== 'webapp/src/lib/engine.js');
  for (const p of protectedPaths) assert.equal(sha256(readFileSync(join(root, p))), sha256(git('show', base + ':' + p)), p);
  const controls = current.getLockControls(), options = key => controls.find(c => c.key === key).options;
  const cards = CHARACTER_PROFILE_OPTIONS.filter(c => c.profile);
  assert.equal(cards.length, 33); assert.deepEqual(controls, old.getLockControls());
  const byZh = (key, zh) => { const value = options(key).find(o => o.zh.includes(zh)); assert.ok(value, key + ': ' + zh); return value.id; };
  const full = byZh('framingId', '全身鏡頭');
  const run = (e, locks, seed) => { let rngCalls = 0; const rng = e.createSeededRandom(seed); const p = e.generatePrompts(1, structuredClone(locks), [], { random: () => { rngCalls++; return rng(); } })[0]; assert.ok(p, seed); return { prompt: stablePrompt(p), rngCalls }; };
  const rows = [], baseline = [], saved = [];
  function expectedPrompt(before, card) {
    const expected = structuredClone(before);
    if (!card) return expected;
    const prefix = `Character Profile Card:\n${card.zh}.\n\n`;
    const identity = card.profile.identityAndBody.split(' with ')[0].replace(/^a /, 'A ') + '.';
    assert.match(identity, /^A 20-year-old adult (East Asian|demonic) woman\.$/);
    const add = text => {
      assert.equal(text.split(prefix + 'Facial geometry:').length - 1, 1, card.id + ': exact insertion point');
      assert.equal(text.includes(identity), false, card.id + ': old output already has identity');
      return text.replace(prefix + 'Facial geometry:', prefix + identity + '\n\nFacial geometry:');
    };
    expected.grokPrompt = add(expected.grokPrompt);
    for (const x of expected.extraPrompts) if (['chest-up-portrait', 'full-body-character'].includes(x.id)) x.text = add(x.text);
    return expected;
  }
  function compare(id, locks, card = null, seed = id) {
    const before = run(old, locks, seed), after = run(current, locks, seed);
    assert.deepEqual(after, { prompt: expectedPrompt(before.prompt, card), rngCalls: before.rngCalls }, id);
    rows.push({ id, seed, beforeSha256: sha256(JSON.stringify(before)), afterSha256: sha256(JSON.stringify(after)), rngCalls: after.rngCalls, addedIdentity: card?.id || null });
    return { before, after };
  }
  for (const card of cards) {
    const input = { ...current.createEmptyLocks(), characterProfileId: card.id, framingId: full };
    const pair = compare(`baseline:${card.id}`, input, card);
    baseline.push({ id: card.id, sourceIdentity: card.profile.identityAndBody, ...pair });
    for (const mode of ['full-default', 'selected-layers']) {
      for (const frame of options('framingId')) compare(`frame:${card.id}:${mode}:${frame.id}`, { ...input, characterCardWardrobeMode: mode, framingId: frame.id }, card);
      for (const fixed of options('fixedCompositionSetId').filter(x => /車廂/.test(x.zh))) compare(`fixed:${card.id}:${mode}:${fixed.id}`, { ...input, characterCardWardrobeMode: mode, fixedCompositionSetId: fixed.id }, card);
      for (const frame of options('framingId').filter(x => /全身鏡頭|中景鏡頭|牛仔/.test(x.zh))) {
        compare(`capture:${card.id}:${mode}:${frame.id}`, { ...input, characterCardWardrobeMode: mode, framingId: frame.id, captureMode: 'observation', observationCapture: { ...capture.resolveCapture({ seed: 41 }).profile, personSource: 'card' } }, card);
      }
    }
    const prompt = { ...pair.before.prompt, id: `a1-old-${card.id}`, date: '2026-10-26T00:00:00.000Z' };
    const raw = oldCodec.serializeFavoritePrompt(prompt), bytes = JSON.stringify(raw);
    const decoded = codec.deserializeFavoritePrompt(raw);
    assert.deepEqual(decoded, oldCodec.deserializeFavoritePrompt(raw));
    assert.deepEqual(codec.serializeFavoritePrompt(decoded), oldCodec.serializeFavoritePrompt(decoded));
    const markdown = oldCodec.buildMarkdownExport(prompt);
    assert.deepEqual(stablePrompt(codec.parseExportedMarkdownPrompt(markdown, controls, prompt.id)), stablePrompt(oldCodec.parseExportedMarkdownPrompt(markdown, controls, prompt.id)));
    compare('restore:' + card.id, codec.buildRestoreLocks(decoded.selection, controls), card);
    assert.equal(JSON.stringify(raw), bytes); saved.push({ id: card.id, raw, markdown });
    for (const mode of ['pure-character', 'included-wardrobe']) {
      const variant = { characterProfileId: card.id, outputMode: mode };
      const bundle = lab.buildCharacterCardPromptBundle(lab.getCharacterCardOptions(controls), variant);
      assert.equal(bundle.variant.outputMode, mode);
      assert.deepEqual(bundle, oldLab.buildCharacterCardPromptBundle(oldLab.getCharacterCardOptions(controls), variant));
    }
  }
  for (const subjectCount of ['1', '2']) for (let i = 0; i < 40; i++) compare(`ordinary:${subjectCount}:${i}`, { ...current.createEmptyLocks(), subjectCount });
  for (const special of options('specialSubjectId').filter(x => x.specialSubject)) compare('dedicated:' + special.id, { ...current.createEmptyLocks(), specialSubjectId: special.id, framingId: full });
  const corpus = readJson(join(root, 'webapp/src/lib/engine/catalogBaseline/revisions/2f56438/corpus.json.gz'));
  const importsBefore = await captureImportFlows(temp, corpus.sources), importsAfter = await captureImportFlows(root, corpus.sources);
  assert.deepEqual(importsAfter, importsBefore, 'ordinary import/reimport/reroll snapshots unchanged');
  writeFileSync(join(out, 'baseline-and-saved.json.gz'), pack({ baseCommit: base, baseline, saved }));
  const beforeCount = baseline.reduce((n, x) => n + [x.before.prompt.grokPrompt, ...x.before.prompt.extraPrompts.map(p => p.text)].filter(t => /20-year-old adult/.test(t)).length, 0);
  const afterCount = baseline.reduce((n, x) => n + [x.after.prompt.grokPrompt, ...x.after.prompt.extraPrompts.map(p => p.text)].filter(t => /20-year-old adult/.test(t)).length, 0);
  assert.equal(beforeCount, 0); assert.equal(afterCount, 99);
  const report = { baseCommit: base, protectedFiles: protectedPaths.length, cases: rows.length, cards: cards.length, adultIdentityBefore: beforeCount, adultIdentityAfter: afterCount, page2BundlesUnchanged: 66, oldSavedJsonAndMarkdown: 66, ordinaryImportSources: Object.keys(importsAfter.sources).length, differencesOutsideAllowance: 0, rows };
  writeFileSync(join(out, 'acceptance.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, rows: undefined }));
} finally { rmSync(temp, { recursive: true, force: true }); }
