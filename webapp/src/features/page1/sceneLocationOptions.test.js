import assert from 'node:assert/strict';
import test from 'node:test';
import { filterSceneLocations, getSceneLocationOptions, groupSceneLocations } from './sceneLocationOptions.js';
import { getLockControls } from '../../lib/engine.js';
import { SCENE_LOCATION_BROWSE_GROUPS } from './sceneLocationBrowseGroups.js';

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

test('browse groups collect related spaces and retain every prepared option exactly once', () => {
  const control = getLockControls().find((item) => item.key === 'locationId');
  const prepared = getSceneLocationOptions(control);
  const groups = groupSceneLocations(prepared);
  assert.deepEqual(groups.map((group) => group.label), [
    '一般選項', '室內房間', '居家與生活空間', '餐廳・咖啡館與酒吧',
    '書店與圖書館', '音樂與表演', '學校與辦公', '洗衣與更衣空間',
    '月台與車廂', '住宅街巷與建築', '城市街景與商圈', '海岸・水岸與度假',
    '草地・森林與花田', '沙丘與荒漠', '工廠・地下與施工', '廢棄學校與醫院',
    '廢墟與荒廢場所', '攝影棚與背景', '近景地面與支撐',
  ]);
  const displayed = groups.flatMap((group) => group.options);
  assert.deepEqual(displayed.map((option) => option.id).sort(), prepared.map((option) => option.id).sort());
  assert.equal(new Set(displayed.map((option) => option.id)).size, prepared.length);
  for (const option of prepared) {
    assert.equal(displayed.find((entry) => entry.id === option.id), option);
  }
  assert.deepEqual(getSceneLocationOptions(control), prepared);
});

test('filtered scene groups keep space classification and disabled metadata', () => {
  const secondDiner = Object.freeze({ ...diner, id: 'legacy-diner', disabled: true });
  const groups = groupSceneLocations(filterSceneLocations([diner, secondDiner, station], 'diner'));
  assert.deepEqual(groups.map((group) => group.label), ['餐廳・咖啡館與酒吧']);
  assert.deepEqual(groups[0].options, [diner, secondDiner]);
  assert.equal(groups[0].options[1], secondDiner);
  assert.equal(groups[0].options[1].disabled, true);
});

test('random, none, and unfamiliar scenes remain available without altering their source', () => {
  const random = Object.freeze({ id: 'explicit-random', zh: '隨機場景', random: true });
  const unknown = Object.freeze({ id: 'custom-scene', zh: '自訂場景', en: 'Custom scene' });
  const input = Object.freeze([random, none, unknown, diner]);
  const groups = groupSceneLocations(input);
  assert.deepEqual(groups.map((group) => group.label), ['一般選項', '餐廳・咖啡館與酒吧', '其他場景']);
  assert.deepEqual(groups[0].options, [random, none]);
  assert.equal(groups[2].options[0], unknown);
  assert.deepEqual(input, [random, none, unknown, diner]);
  assert.deepEqual(groupSceneLocations(), []);
});

test('room series keeps hotel, retro, student and bedroom variants together in browse order', () => {
  const control = getLockControls().find((item) => item.key === 'locationId');
  const roomNames = [
    '室內：精品飯店房間', '室內：英式小旅館房間', '室內：狹小都會旅館房間',
    '室內：Y2K 復古房間', '室內：英倫復古窗邊房間', '室內：女高生房間',
    '室內：臥室窗邊', '室內：白色書櫃落地窗臥室', '室內：日式和室',
  ];
  const groups = groupSceneLocations([...control.options].reverse());
  const rooms = groups.find((group) => group.label === '室內房間');
  assert.deepEqual(rooms.options.map((option) => option.zh), roomNames);
  assert.ok(!rooms.options.some((option) => /書店|圖書館|洗衣店/.test(option.zh)));
});

test('type grouping joins related locations across source categories and preserves filtered subsets', () => {
  const control = getLockControls().find((item) => item.key === 'locationId');
  const cafes = filterSceneLocations(control.options, '咖啡館');
  const groups = groupSceneLocations(cafes);
  assert.deepEqual(groups.map((group) => group.label), ['餐廳・咖啡館與酒吧']);
  assert.deepEqual(new Set(groups[0].options), new Set(cafes));
  assert.ok(groups[0].options.some((option) => option.zh === '室內：倫敦老咖啡館角落'));
  assert.ok(groups[0].options.some((option) => option.zh === '室內：法租界咖啡館靠窗座位'));
});

test('reviewed browse entries reference current scenes without duplicate group assignments', () => {
  const names = SCENE_LOCATION_BROWSE_GROUPS.flatMap((group) => group.names);
  const sourceNames = new Set(getLockControls().find((item) => item.key === 'locationId').options.map((option) => option.zh));
  assert.equal(new Set(names).size, names.length);
  assert.equal(new Set(SCENE_LOCATION_BROWSE_GROUPS.map((group) => group.id)).size, SCENE_LOCATION_BROWSE_GROUPS.length);
  for (const name of names) assert.ok(sourceNames.has(name), `Unknown source label: ${name}`);
});
