import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getWardrobeEditorGroups, getWardrobePanelKeys, getCompleteLookOwner, getLayerControlHelp } from './wardrobeEditor.js';
import { prepareOuterwearClosureControl, FULLY_CLOSED_OPENING_ID } from '../../lib/engine/outerwearClosure.js';
import { SECTION_SUBPANELS, SHARED_ACCESSORY_KEYS, DUO_ACCESSORY_KEYS } from './page1Schema.js';
import { createEmptyLocks, getLockControls } from '../../lib/engine.js';
import { getDuoEditorGroups, getDuoRoleActionKeys } from './duoEditor.js';
import { randomizePage1WardrobePanelLocks, randomizeLockKeys, setLockKeysToNone } from '../../lib/page1SectionRandom.js';
const controls = getLockControls();
const activeValue = key => controls.find(control => control.key === key).options.find(option => option.en && option.en !== 'none' && option.zh !== '全無' && !['none', 'random'].includes(option.id)).id;

test('accessories share five cards with every existing field exactly once and single-only piercings', () => {
  for (const role of ['', 'A', 'B']) {
    const groups = getWardrobeEditorGroups('accessories', role);
    assert.deepEqual(groups.map(group => group.label), ['頭部配件', '耳機', '眼鏡', '口鼻配件', '飾品']);
    const keys = groups.flatMap(group => group.keys);
    assert.equal(new Set(keys).size, keys.length);
    keys.forEach(key => assert.ok(controls.some(control => control.key === key), key));
    const expected = role ? DUO_ACCESSORY_KEYS.filter(key => new RegExp(`${role}(?:Color|Placement)?Id$`).test(key)) : SHARED_ACCESSORY_KEYS;
    assert.deepEqual([...keys].sort(), [...expected].sort());
    assert.equal(keys.length, role ? 12 : 14);
    assert.deepEqual(groups.find(group => group.id === 'face').keys,
      [`faceCovering${role}Id`, `faceCovering${role}ColorId`, ...(!role ? ['nosePiercingId', 'lipPiercingId'] : [])]);
    assert.deepEqual(groups.find(group => group.id === 'eyewear').keys,
      [`eyewear${role}Id`, `eyewear${role}ColorId`, `eyewear${role}PlacementId`]);
    if (role) assert.deepEqual(getDuoEditorGroups('accessories', role), groups);
  }
});

test('accessory page and person actions preserve wardrobe and the other person', () => {
  for (const role of ['', 'A', 'B']) {
    const locks = { ...createEmptyLocks(), subjectCount: role ? '2' : '1' };
    for (const key of [...getWardrobePanelKeys('accessories'), ...getWardrobePanelKeys('layers'), ...getWardrobePanelKeys('garments')]) locks[key] = activeValue(key);
    const keys = role ? getDuoRoleActionKeys('accessories', role, controls) : getWardrobePanelKeys('accessories', '');
    const randomized = role ? randomizeLockKeys(locks, keys, createEmptyLocks(), controls)
      : randomizePage1WardrobePanelLocks(locks, 'accessories', keys, createEmptyLocks(), controls);
    for (const next of [randomized, setLockKeysToNone(locks, keys, controls)]) {
      for (const key of Object.keys(locks)) if (!keys.includes(key)) assert.deepEqual(next[key], locks[key], key);
      assert.notEqual(next[`headAccessory${role}Id`], locks[`headAccessory${role}Id`]);
    }
  }
});

test('layer hints explain existing styling conflicts and preserve every stored choice', () => {
  for (const role of ['', 'A', 'B']) {
    const key = `outerwear${role}StylingId`;
    const control = controls.find(control => control.key === key);
    const locks = { ...createEmptyLocks(), [key]: control.options.find(option => option.zh === '雙肩露出').id,
      [`outerwear${role}OpeningId`]: `${FULLY_CLOSED_OPENING_ID}${role ? `:${role.toLowerCase()}` : ''}` };
    const before = JSON.stringify(locks);
    const prepared = prepareOuterwearClosureControl(control, locks, controls);
    assert.match(getLayerControlHelp(prepared, locks, controls), /完全閉合.*原選項保留/);
    assert.equal(JSON.stringify(locks), before);
    locks[`outerwear${role}OpeningId`] = '';
    const reopened = prepareOuterwearClosureControl(control, locks, controls);
    assert.equal(getLayerControlHelp(reopened, locks, controls), reopened.helpText);
  }
});

test('four wardrobe panels retain every relocated color and garment field once', () => {
  assert.deepEqual(SECTION_SUBPANELS.wardrobe.map(panel => panel.id), ['overall', 'garments', 'layers', 'accessories']);
  for (const role of ['', 'A', 'B']) {
    for (const panel of ['overall', 'garments', 'layers']) {
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

test('layers share the ten existing fields in garment order for each person', () => {
  for (const role of ['', 'A', 'B']) {
    const groups = getWardrobeEditorGroups('layers', role);
    assert.deepEqual(groups.map(group => group.label), ['外套', '襪類', '鞋款']);
    assert.deepEqual(groups.map(group => group.keys), [
      [`outerwear${role}Id`, `outerwear${role}FitId`, `outerwear${role}OpeningId`, `outerwear${role}StylingId`, `outerwear${role}ColorId`, `outerwear${role}PatternId`],
      [`legwear${role}Id`, `legwear${role}ColorId`],
      [`shoes${role}Id`, `shoes${role}ColorId`],
    ]);
    if (role) assert.deepEqual(getDuoEditorGroups('layers', role), groups);
  }
  assert.deepEqual(SECTION_SUBPANELS.wardrobe.find(panel => panel.id === 'layers').keys, getWardrobePanelKeys('layers'));
});

test('layer random and clear preserve the other person, complete look, garments and accessories', () => {
  for (const role of ['', 'A', 'B']) {
    const locks = { ...createEmptyLocks(), subjectCount: role ? '2' : '1' };
    for (const key of getWardrobePanelKeys('layers')) locks[key] = activeValue(key);
    for (const key of ['topId', 'outfitPresetId', 'headAccessoryId', 'topAId', 'topBId']) locks[key] = activeValue(key);
    const keys = role ? getDuoRoleActionKeys('layers', role, controls) : getWardrobePanelKeys('layers', '');
    const random = role ? randomizeLockKeys(locks, keys, createEmptyLocks(), controls)
      : randomizePage1WardrobePanelLocks(locks, 'layers', keys, createEmptyLocks(), controls);
    for (const next of [random, setLockKeysToNone(locks, keys, controls)]) {
      for (const key of Object.keys(locks)) if (!keys.includes(key)) assert.deepEqual(next[key], locks[key], key);
      assert.notEqual(next[`outerwear${role}Id`], locks[`outerwear${role}Id`]);
    }
    if (role) {
      const blocked = controls.map(control => ({ ...control, closureDisabled: control.key === `outerwear${role}StylingId` }));
      assert.ok(!getDuoRoleActionKeys('layers', role, blocked).includes(`outerwear${role}StylingId`));
    }
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
