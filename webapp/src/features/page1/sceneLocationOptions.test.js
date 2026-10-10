import assert from 'node:assert/strict';
import test from 'node:test';
import { filterSceneLocations, getSceneLocationOptions } from './sceneLocationOptions.js';

const none = Object.freeze({ id: 'scene-none', zh: '全無', en: '' });
const diner = Object.freeze({ id: 'diner', zh: '室內：復古美式 Diner', en: 'A retro American diner', meta: Object.freeze({ sceneAttribute: 'indoor' }) });
const station = Object.freeze({ id: 'station', zh: '戶外：澀谷車站前', en: 'Shibuya Station street', disabled: true });
const options = Object.freeze([none, diner, station]);

test('location picker prepends the native default random choice and preserves source order and metadata', () => {
  const result = getSceneLocationOptions({ options });
  assert.deepEqual(result.map((option) => option.id), ['', 'scene-none', 'diner', 'station']);
  assert.deepEqual(result[0], { id: '', zh: '隨機', en: '', random: true });
  assert.equal(result[1], none);
  assert.equal(result[2], diner);
  assert.equal(result[3], station);
  assert.equal(result[3].disabled, true);
  assert.deepEqual(options, [none, diner, station]);
});

test('required and suppressDefaultRandomOption policies hide only the synthetic random option', () => {
  for (const policy of [{ required: true }, { suppressDefaultRandomOption: true }, { required: true, suppressDefaultRandomOption: true }]) {
    assert.deepEqual(getSceneLocationOptions({ options, ...policy }), options);
  }
});

test('explicit random metadata survives even when the default random choice is suppressed', () => {
  const random = Object.freeze({ id: 'scene-random', zh: '隨機場景', random: true, meta: Object.freeze({ mode: 'catalog' }) });
  const result = getSceneLocationOptions({ options: [none, random, station], suppressDefaultRandomOption: true });
  assert.deepEqual(result.map((option) => option.id), ['scene-none', 'scene-random', 'station']);
  assert.equal(result[1], random);
});

test('location filter matches trimmed Chinese labels and case-insensitive English source or label', () => {
  assert.deepEqual(filterSceneLocations(options, '  澀谷  '), [station]);
  assert.deepEqual(filterSceneLocations(options, 'AMERICAN'), [diner]);
  assert.deepEqual(filterSceneLocations(options, 'dINer'), [diner]);
  const labeled = { id: 'label-only', label: 'Golden Street' };
  assert.deepEqual(filterSceneLocations([labeled], 'golden'), [labeled]);
});

test('location filter retains none and disabled options as searchable choices without mutating input', () => {
  assert.deepEqual(filterSceneLocations(options, '全無'), [none]);
  assert.equal(filterSceneLocations(options, 'station')[0].disabled, true);
  const result = filterSceneLocations(options, '   ');
  assert.deepEqual(result, options);
  assert.notEqual(result, options);
  assert.equal(result[2], station);
  assert.deepEqual(filterSceneLocations(options, 'unmatched'), []);
});

test('empty controls and empty searches are safe', () => {
  assert.deepEqual(getSceneLocationOptions({ options: [], required: true }), []);
  assert.deepEqual(filterSceneLocations(), []);
  assert.equal(getSceneLocationOptions()[0].id, '');
});
