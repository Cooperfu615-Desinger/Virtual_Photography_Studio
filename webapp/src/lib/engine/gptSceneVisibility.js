import { LOW_CAMERA_LABELS, DOWNWARD_CAMERA_LABELS, GROUND_SOURCE_REDUCTIONS, SKY_SOURCE_REDUCTIONS } from './zImageSceneDirection.js';
import { renderAmbientLightDescription } from './ambientLightDescriptions.js';

export const GPT_SCENE_VISIBILITY_VERSION = '1.0.0';

// Use the reviewed directional vocabulary, not Z's compact renderer. Preserve
// untouched GPT source bytes and sentence boundaries, including custom prose.
export function projectGptSceneSource(source, angle, preserveIdentity = true) {
  if (typeof source !== 'string' || !source) return source;
  const rules = LOW_CAMERA_LABELS.includes(angle?.zh) ? GROUND_SOURCE_REDUCTIONS
    : DOWNWARD_CAMERA_LABELS.includes(angle?.zh) ? SKY_SOURCE_REDUCTIONS : null;
  if (!rules) return source;
  return source.split(/(\n+)/).map(line => {
    if (!line.trim()) return line;
    const punctuation = line.match(/[.!?]+$/)?.[0] || '';
    const body = punctuation ? line.slice(0, -punctuation.length) : line;
    let changed = false;
    const projected = body.split(/,\s*/).map((clause, index) => {
      if (preserveIdentity && index === 0) return clause;
      const key = clause.trim().toLowerCase();
      if (!Object.hasOwn(rules, key)) return clause;
      changed = true;
      return rules[key];
    }).filter(Boolean).join(', ');
    // No broad substring deletion, whitespace rewrite or invented replacement.
    if (!changed) return line;
    return projected ? projected + punctuation : '';
  }).join('');
}

export function projectGptSceneLightingModel(model) {
  const valuesByLabel = new Map(model.valuesByLabel);
  const angle = model.context.angle;
  for (const label of ['World Scene Architecture', 'Location', 'Scene Accent']) {
    const values = valuesByLabel.get(label);
    if (values) valuesByLabel.set(label, values.map(value =>
      projectGptSceneSource(value, angle, label !== 'Scene Accent')).filter(Boolean));
  }
  if (model.ambientLightDescription) {
    valuesByLabel.set('Ambient Light Conditions', [
      `${renderAmbientLightDescription(model.ambientLightDescription, 'directional', angle)}.`,
    ]);
  }
  return { ...model, valuesByLabel };
}
