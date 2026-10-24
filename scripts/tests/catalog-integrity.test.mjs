import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, existsSync, symlinkSync, realpathSync, readdirSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { controlIssues, applyAllowlist, validateActions, checkFieldMapping, checkDeclaredPaths, validatePoseMetadata } from '../lib/catalogIntegrity.mjs';
import { assertOutputPath, rehearse, publishRehearsal } from '../migrations/migrate_catalog_to_json.mjs';
const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const temp = () => mkdtempSync(join(tmpdir(), 'catalog-b-test-'));
const exception = { code: 'LEGACY_ID_AMBIGUOUS', itemKey: 'one:old', reason: 'fixture known history', decisionRef: 'fixture decision' };

test('aliases are scoped by actual control, self aliases legal, cross-category owners conflict', () => {
  const options = [{ id: 'first', legacyIds: ['first', 'old'] }, { id: 'second', legacyIds: ['old'] }];
  const issues = controlIssues([{ key: 'one', options }, { key: 'two', options }]);
  assert.deepEqual(issues.map(i => i.itemKey), ['one:old', 'two:old']);
  const result = applyAllowlist(issues, [exception]);
  assert.equal(result.allowed.length, 1);assert.equal(result.blocking[0].itemKey, 'two:old');
  assert.deepEqual(controlIssues([{ key: 'a', options: [{ id: 'none', legacyIds: ['none'] }] }, { key: 'b', options: [{ id: 'none' }] }]), []);
});

test('primary ID duplication and alias shadowing are blocking', () => {
  assert(controlIssues([{ key: 'x', options: [{ id: 'same' }, { id: 'same' }] }]).some(i => i.code === 'DUPLICATE_ID_IN_CONTROL'));
  assert(controlIssues([{ key: 'x', options: [{ id: 'a', legacyIds: ['b'] }, { id: 'b' }] }]).some(i => i.code === 'LEGACY_ID_SHADOWED'));
});

test('allowlist rejects stale, incomplete, duplicate and broad exceptions', () => {
  assert.equal(applyAllowlist([], [exception]).stale.length, 1);
  for (const bad of [[{ ...exception, reason: '' }], [{ ...exception, decisionRef: '' }], [exception, exception], [{ code: 'LEGACY_ID_AMBIGUOUS' }]]) assert.throws(() => applyAllowlist([], bad));
  const other = { code: 'LEGACY_ID_AMBIGUOUS', itemKey: 'one:new', message: '', evidence: [] };
  assert.equal(applyAllowlist([other], [exception]).blocking.length, 1);
});

test('action source references, clauses, validation and family errors are detected', () => {
  const action = { id: 'action', baseId: 'standing', orientationId: 'none', family: 'standing', hands: { mode: 'free' }, scene: { support: 'ground' }, validation: { status: 'accepted' }, clauses: [{ region: 'core', join: '', en: 'She stands' }], en: 'She stands.' };
  const context = { bases: new Set(['standing']), orientations: new Set(['none']), legacyCards: new Set() };
  assert.deepEqual(validateActions([action], context), []);
  for (const update of [{ baseId: 'missing' }, { orientationId: 'missing' }, { family: 'missing' }, { legacyCardId: 'missing' }, { scene: { support: 'invented' } }, { validation: { status: 'typo' } }, { hands: { mode: 'typo' } }, { clauses: [] }, { en: 'Changed.' }]) assert(validateActions([{ ...action, ...update }], context).length);
});

test('field mapping preserves false, empty strings, nested values and reports unknown source fields', () => {
  const raw = { Wardrobe: { C: [{ zh: 'A', en: 'en', desc: 'desc', outerwearFastenerRequirement: '', randomEligible: false, meta: { nested: { a: [0, false] } } }] } };
  const entries = { wardrobe: { C: [{ id: 'x', zh: 'A', en: 'en', desc: 'desc', meta: { outerwearFastenerRequirement: '', randomEligible: false, nested: { a: [0, false] } } }] } };
  const map = { fields: Object.fromEntries(Object.keys(raw.Wardrobe.C[0]).map(k => [k, { runtime: ['zh','en','desc','meta'].includes(k) ? k : 'meta.'+k }])) };
  assert.equal(checkFieldMapping(raw, entries, map).issues.length, 0);
  entries.wardrobe.C[0].meta.randomEligible = true;
  assert(checkFieldMapping(raw, entries, map).issues.some(i => i.itemKey === 'x:randomEligible'));
  raw.Wardrobe.C[0].unmapped = 'kept';
  assert(checkFieldMapping(raw, entries, map).issues.some(i => i.itemKey === 'x:unmapped'));
});

test('strict CLI succeeds for exact exceptions and fails for stale exceptions', () => {
  const run = args => execFileSync(process.execPath, ['scripts/check_catalog_integrity.mjs', '--strict', '--json', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 16*1024*1024 });
  const result = JSON.parse(run([]));assert.equal(result.allowlist.allowed.length, 2);assert.equal(result.allowlist.blocking.length, 0);
  const dir = temp();
  try {
    const p = join(dir, 'allow.json');writeFileSync(p, JSON.stringify([exception]));
    assert.throws(() => run(['--allowlist', p]), e => e.status === 1);
    assert.throws(() => run(['--repo']), e => e.status !== 0);
    assert.throws(() => run(['--repo', dir]), e => e.status !== 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('rehearsal refuses repo output, symlink escape into repo, existing targets and wrong source without writes', async () => {
  assert.throws(() => assertOutputPath(join(root, 'catalog-b-output')));
  const dir = temp();
  try {
    assert.throws(() => assertOutputPath(dir));
    symlinkSync(root, join(dir, 'project'));
    assert.throws(() => assertOutputPath(join(dir, 'project', 'new-output')));
    const out = join(dir, 'output');
    assert.equal(assertOutputPath(out), join(realpathSync(dir), 'output'));
    await assert.rejects(rehearse({ output: out, sourceSha: '0'.repeat(40) }));
    assert.equal(existsSync(out), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('failed staged conversion leaves no target or staging; racing target is preserved', async () => {
  const dir = temp(), out = join(dir, 'result');
  try {
    await assert.rejects(publishRehearsal(out, async staging => {
      writeFileSync(join(staging, 'partial.json'), '{}'); throw new Error('injected conversion failure');
    }), /injected/);
    assert.deepEqual(readdirSync(dir), []);
    await assert.rejects(publishRehearsal(out, async () => { mkdirSync(out); writeFileSync(join(out, 'owned.txt'), 'keep'); }), /appeared/);
    assert.deepEqual(readdirSync(dir), ['result']);
    assert.deepEqual(readdirSync(out), ['owned.txt']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('nested source paths and category membership require explicit responsibility', () => {
  const db = { S: { C: [{ meta: { flags: [false] } }] } };
  const paths = Object.fromEntries(['meta', 'meta.flags', 'meta.flags[]'].map(p => [p, { categories: ['S/C'] }]));
  assert.equal(checkDeclaredPaths(db, { paths }).issues.length, 0);
  db.S.C[0].meta.unknown = 0;
  assert.equal(checkDeclaredPaths(db, { paths }).issues[0].itemKey, 'S/C:meta.unknown');
  assert(checkDeclaredPaths({ S: { Other: db.S.C } }, { paths }).issues.length);
});

test('pose metadata validates nested support, arrangement, orientation and crop references', () => {
  const ctx = Object.fromEntries(Object.entries({ bases: ['lying'], orientations: ['supine'], hands: ['palms'], arrangements: ['relaxed'], buckets: ['chest'], modes: ['projected'] }).map(([k,v])=>[k,new Set(v)]));
  const meta = { randomEligibleForArrangements: { lying: ['relaxed'] }, supportVariants: { palms: { projectionByBucket: { chest: { mode: 'projected', en: 'source text' } } } }, supineEnvironmentByOrientation: { supine: 'source' }, visibleBuckets: ['chest'], supportSurface: 'ground' };
  assert.deepEqual(validatePoseMetadata({ id:'x', meta }, ctx), []);
  for (const update of [{ randomEligibleForArrangements: { lying:['missing'] } }, { supportVariants: { missing:{} } }, { projectionByBucket:{ unknown:{ mode:'projected', en:'x' } } }, { projectionByBucket:{ chest:{ mode:'unknown', en:'' } } }, { supineEnvironmentByOrientation:{ missing:'x' } }, { supportSurface:'typo' }, { requiresWardrobeRole:'typo' }, { requiresSceneType:'typo' }, { visibleBuckets:['missing'] }]) assert(validatePoseMetadata({id:'x',meta:{...meta,...update}},ctx).length);
});
