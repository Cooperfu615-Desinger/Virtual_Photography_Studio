import database from '../../data/database.json' with { type: 'json' };
import { SCENE_LOCATION_BROWSE_GROUPS } from './sceneLocationBrowseGroups.js';

const DEFAULT_RANDOM_LOCATION = Object.freeze({ id: '', zh: '隨機', en: '', random: true });
const LOCATION_CATEGORIES = new Map(
  Object.entries(database.Locations || {}).flatMap(([category, options]) => (
    options.map((option) => [option.zh, category])
  )),
);
const BROWSE_BY_NAME = new Map(SCENE_LOCATION_BROWSE_GROUPS.flatMap((group) => (
  group.names.map((name, order) => [name, { id: group.id, label: group.label, order }])
)));
const GROUP_ORDER = new Map([
  ['general', 0],
  ...SCENE_LOCATION_BROWSE_GROUPS.map((group, index) => [group.id, index + 1]),
  ...Object.keys(database.Locations || {}).map((category, index) => [category, SCENE_LOCATION_BROWSE_GROUPS.length + index + 1]),
]);
const UNSORTED = Number.MAX_SAFE_INTEGER;

// Build the picker from the already-resolved control options. Filtering here
// changes the visible list only; IDs, order, and compatibility metadata survive.
export function getSceneLocationOptions(control = {}) {
  const options = [...(control.options || [])];
  if (!control.required && !control.suppressDefaultRandomOption) {
    options.unshift(DEFAULT_RANDOM_LOCATION);
  }
  return options;
}

export function filterSceneLocations(options = [], query = '') {
  const keyword = String(query).trim().toLowerCase();
  if (!keyword) return [...options];
  return options.filter((option) => (
    [option.zh, option.en, option.label].filter(Boolean).join(' ').toLowerCase().includes(keyword)
  ));
}

// Reorder only the visible picker. Never mutate the prepared controls or use
// presentation groups as a new catalog, random pool, or saved selection value.
export function groupSceneLocations(options = []) {
  const groups = new Map();
  for (const option of options) {
    const isGeneral = option.id === '' || option.random || option.zh === '全無';
    const browse = isGeneral ? null : BROWSE_BY_NAME.get(option.zh);
    const category = isGeneral ? 'general' : browse?.id || LOCATION_CATEGORIES.get(option.zh) || 'unclassified';
    if (!groups.has(category)) {
      groups.set(category, {
        id: category,
        label: browse?.label || (category === 'general' ? '一般選項'
          : category === 'unclassified' ? '其他場景' : category.replace(/\s*\([^)]*\)$/, '')),
        options: [],
      });
    }
    groups.get(category).options.push(option);
  }
  return [...groups.values()]
    .sort((a, b) => (GROUP_ORDER.get(a.id) ?? UNSORTED) - (GROUP_ORDER.get(b.id) ?? UNSORTED))
    .map((group) => ({
      ...group,
      options: group.options.sort((a, b) => (
        (BROWSE_BY_NAME.get(a.zh)?.order ?? UNSORTED) - (BROWSE_BY_NAME.get(b.zh)?.order ?? UNSORTED)
      )),
    }));
}
