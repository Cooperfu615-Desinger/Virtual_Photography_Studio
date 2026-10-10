const DEFAULT_RANDOM_LOCATION = Object.freeze({ id: '', zh: '隨機', en: '', random: true });

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
