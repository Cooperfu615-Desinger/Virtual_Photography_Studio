// Node-only compatibility oracle for immutable pre-ambient snapshots.
// Replace only a recognized new ambient source, never an entire lighting block.
import { getLockControls } from '../engine.js';
import { AMBIENT_LIGHT_DESCRIPTIONS, renderAmbientLightDescription } from './ambientLightDescriptions.js';
import { projectZImageDirectionalSource } from './zImageSceneDirection.js';
const angles = getLockControls().find(c => c.key === 'angleId').options;
const cap = s => s[0].toUpperCase() + s.slice(1);
export function normalizeAmbientForLegacy(text, field, selection) {
  const entry = AMBIENT_LIGHT_DESCRIPTIONS[selection?.lightingId];
  if (!entry || !['grokPrompt', 'zImagePrompt'].includes(field)) return text;
  const angle = angles.find(a => a.id === selection.angleId);
  if (field === 'grokPrompt') return text.replace(
    `Lighting:\n${renderAmbientLightDescription(entry)}`,
    `Lighting:\n${entry.source}`,
  );
  const current = cap(renderAmbientLightDescription(entry, 'z', angle));
  const previous = cap(projectZImageDirectionalSource(entry.source.split(', ').slice(0, 2).join(', '), angle));
  return text.split('\n\n').map(p => p.startsWith(current) ? previous + p.slice(current.length) : p).join('\n\n');
}
