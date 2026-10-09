import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDuoEditorGroups, getDuoFieldRole, getDuoRoleActionKeys, getDuoRoleSummary } from './duoEditor.js';
import { getLockControls, createEmptyLocks } from '../../lib/engine.js';
import { randomizeLockKeys, setLockKeysToNone } from '../../lib/page1SectionRandom.js';
import { buildWorkspaceSummary } from '../../lib/page1WorkspaceSummary.js';
import { SECTION_SUBPANELS } from './page1Schema.js';
const controls = getLockControls();
const pick = (key, label) => controls.find(c => c.key === key).options.find(o => o.zh === label).id;

test('all existing duo identity and wardrobe fields retain explicit ownership and one group per panel', () => {
  for (const section of ['character', 'wardrobe']) {
    for (const panel of SECTION_SUBPANELS[section]) {
      if (section === 'character' && panel.id !== 'identity') continue;
      for (const role of ['A', 'B']) {
        const keys = getDuoEditorGroups(panel.id, role).flatMap(g => g.keys);
        assert.equal(new Set(keys).size, keys.length);
        for (const key of keys) {
          assert.ok(controls.some(c => c.key === key), key);
          assert.equal(getDuoFieldRole(key), role);
        }
        const expected = panel.keys.filter(key => getDuoFieldRole(key) === role);
        expected.forEach(key => assert.ok(keys.includes(key), `${panel.id}: ${key}`));
      }
    }
  }
  assert.equal(getDuoFieldRole('topId'), null);
  assert.equal(getDuoFieldRole('duoExpressionId'), null);
  assert.deepEqual(getDuoEditorGroups('garments', 'invalid'), []);
});

test('person and panel actions include inline colors, exclude disabled fields, preserve all other values', () => {
  const locks = { ...createEmptyLocks(), subjectCount: '2', topAId: pick('topAId', '襯衫'), topBId: pick('topBId', '短袖上衣'), topAColorId: pick('topAColorId', '白色'), outerwearAId: pick('outerwearAId', '西裝外套') };
  const keys = getDuoRoleActionKeys('garments', 'A', controls);
  assert.ok(keys.includes('topAColorId'));
  for (const mutate of [(prev) => randomizeLockKeys(prev, keys, createEmptyLocks(), controls), (prev) => setLockKeysToNone(prev, keys, controls)]) {
    const next = mutate(locks);
    for (const key of Object.keys(locks)) if (!keys.includes(key)) assert.deepEqual(next[key], locks[key], key);
    assert.notEqual(next.topAId, locks.topAId);
  }
  const blocked = controls.map(c => ({ ...c, disabled: c.key === 'topAId', closureDisabled: c.key === 'topAColorId' }));
  assert.ok(!getDuoRoleActionKeys('garments', 'A', blocked).includes('topAId'));
  assert.ok(!getDuoRoleActionKeys('garments', 'A', blocked).includes('topAColorId'));
  assert.ok(getDuoRoleActionKeys('garments', 'B', blocked).includes('topBId'));
});

test('duo summaries exclude inactive single selections and separate ownership', () => {
  const locks = { ...createEmptyLocks(), subjectCount: '2', topId: pick('topId', '比基尼上身'), topAId: pick('topAId', '襯衫'), topBId: pick('topBId', '短袖上衣') };
  const summary = buildWorkspaceSummary(locks, controls);
  assert.equal(summary.wardrobe.roles[0].summary, '襯衫');
  assert.equal(summary.wardrobe.roles[1].summary, '短袖上衣');
  assert.doesNotMatch(summary.wardrobe.summary, /比基尼/);
  locks.dressBId = pick('dressBId', '連身：長版｜無袖長洋裝');
  assert.equal(getDuoRoleSummary('wardrobe', 'B', locks, controls), '連身：長版｜無袖長洋裝');
  assert.equal(getDuoRoleSummary('wardrobe', 'A', locks, controls), '襯衫');
  assert.equal(locks.topBId, pick('topBId', '短袖上衣'));
});
