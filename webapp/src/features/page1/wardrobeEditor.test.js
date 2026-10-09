import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getWardrobeEditorGroups, getWardrobePanelKeys, getCompleteLookOwner } from './wardrobeEditor.js';
import { SECTION_SUBPANELS } from './page1Schema.js';
import { createEmptyLocks, getLockControls } from '../../lib/engine.js';
import { getDuoEditorGroups, getDuoRoleActionKeys } from './duoEditor.js';
import { randomizePage1WardrobePanelLocks, setLockKeysToNone } from '../../lib/page1SectionRandom.js';
const controls = getLockControls();
const activeValue = key => controls.find(control => control.key === key).options.find(option => option.en && option.en !== 'none' && option.zh !== '全無' && !['none', 'random'].includes(option.id)).id;

test('four wardrobe panels retain every relocated color and garment field once', () => {
  assert.deepEqual(SECTION_SUBPANELS.wardrobe.map(panel => panel.id), ['overall', 'garments', 'layers', 'accessories']);
  for (const role of ['', 'A', 'B']) {
    for (const panel of ['overall', 'garments']) {
      const keys = getWardrobePanelKeys(panel, role);
      assert.equal(new Set(keys).size, keys.length);
      keys.forEach(key => assert.ok(controls.some(control => control.key === key), key));
      assert.ok(SECTION_SUBPANELS.wardrobe.find(item => item.id === panel).keys.every(key => controls.some(control => control.key === key)));
    }
    const overall = getWardrobePanelKeys('overall', role);
    for (const key of [`completeLookPalette${role}Id`, `outfitPreset${role}PrimaryColorId`, `outfitPreset${role}ContrastColorId`, `outfitPreset${role}LockedPaletteId`, `dress${role}ColorId`]) assert.ok(overall.includes(key), key);
    const garments = getWardrobePanelKeys('garments', role);
    for (const key of [`topBottomPalette${role}Id`, `top${role}ColorId`, `bottom${role}ColorId`, `top${role}PatternId`, `bottom${role}PatternId`, `pants${role}Id`, `skirt${role}Id`]) assert.ok(garments.includes(key), key);
  }
});

test('one complete-look palette entry follows effective owner per person, without changing locks', () => {
  for (const role of ['', 'A', 'B']) {
    for (const [prefix, owner] of [['specialOutfit', 'special'], ['outfitPreset', 'preset'], ['dress', 'dress']]) {
      const key = `${prefix}${role}Id`;
      const locks = { ...createEmptyLocks(), [key]: activeValue(key) };
      const before = JSON.stringify(locks);
      assert.equal(getCompleteLookOwner(locks, controls, role), owner);
      const groups = getWardrobeEditorGroups('overall', role, owner);
      const palette = `completeLookPalette${role}Id`;
      assert.equal(groups.flatMap(group => group.keys).filter(key => key === palette).length, 1);
      assert.ok(groups.find(group => group.id === owner).keys.includes(palette));
      if (role) assert.deepEqual(getDuoEditorGroups('overall', role, owner), groups);
      assert.equal(JSON.stringify(locks), before);
    }
  }
});

test('integrated single actions include color and pattern while preserving duo and unrelated panels', () => {
  for (const panel of ['overall', 'garments']) {
    const keys = getWardrobePanelKeys(panel, '');
    const locks = { ...createEmptyLocks(), subjectCount: '1', topAId: activeValue('topAId'), topBColorId: activeValue('topBColorId'), shoesId: activeValue('shoesId') };
    for (const key of keys) locks[key] = activeValue(key);
    for (const next of [randomizePage1WardrobePanelLocks(locks, panel, keys, createEmptyLocks(), controls), setLockKeysToNone(locks, keys, controls)]) {
      for (const key of ['topAId', 'topBColorId', 'shoesId']) assert.equal(next[key], locks[key]);
      assert.equal(next.subjectCount, '1');
    }
    for (const role of ['A', 'B']) {
      const available = controls.map(control => ({ ...control, disabled: control.key === `top${role}ColorId` }));
      const actionKeys = getDuoRoleActionKeys(panel, role, available);
      assert.ok(actionKeys.every(key => getWardrobePanelKeys(panel, role).includes(key)));
      assert.ok(!actionKeys.includes(`top${role}ColorId`));
    }
  }
});
