// Test-only bridge for immutable historical snapshots. Recognize only exact
// approved projected Scene text captured from the pre-change engine; never hide
// arbitrary new content or changes in any other GPT section.
import { readFileSync } from 'node:fs';
import { getLockControls } from '../engine.js';
import { projectZImageDirectionalSource } from './zImageSceneDirection.js';
import { normalizeGptCameraForLegacy } from './gptCameraSpatialTestSupport.js';
import { normalizeShibuyaPromptForLegacy, normalizeShibuyaSceneForLegacy } from './shibuyaSceneTestSupport.js';
import {
  normalizeBathroomVanityMirrorForLegacy,
  normalizeBathroomVanitySceneForLegacy,
} from './bathroomVanityMirrorReflectionTestSupport.js';
const legacy = JSON.parse(readFileSync(new URL('./gptSceneVisibilityLegacyScenes.json', import.meta.url), 'utf8'));
const angles = getLockControls().find(c => c.key === 'angleId').options;
export const gptSection = (text, name, selection = {}) => {
  const value = text.match(new RegExp(`(?:^|\\n\\n)${name}:\\n([^]*?)(?=\\n\\n[A-Z][^\\n]*:\\n|$)`))?.[1] || '';
  return name === 'Scene' ? normalizeShibuyaSceneForLegacy(normalizeBathroomVanitySceneForLegacy(value, selection), selection) : value;
};
export const withoutSceneLighting = (text, selection = {}) => normalizeGptCameraForLegacy(text, selection).replace(/(?:^|\n\n)(Scene|Lighting):\n[^]*?(?=\n\n[A-Z][^\n]*:\n|$)/g, '');

export function expectedSceneProjection(scene, angle) {
  if (!scene) return scene;
  return scene.split('\n').map(line => {
    const end = line.match(/[.!?]+$/)?.[0] || '';
    const body = end ? line.slice(0, -end.length) : line;
    return projectZImageDirectionalSource(body, angle, { preserveIdentity: true }) + end;
  }).join('\n');
}
export function normalizeGptVisibilityForLegacy(text, selection) {
  text = normalizeShibuyaPromptForLegacy(text, 'grokPrompt', selection);
  text = normalizeBathroomVanityMirrorForLegacy(normalizeGptCameraForLegacy(text, selection), 'grokPrompt', selection);
  const current = gptSection(text, 'Scene', selection);
  const angle = angles.find(a => a.id === selection?.angleId);
  const candidates = legacy.filter(([loc, frame, old]) => loc === selection?.locationId
    && frame === selection?.framingId && old !== current && expectedSceneProjection(old, angle) === current);
  const originals = [...new Set(candidates.map(c => c[2]))];
  if (originals.length > 1) throw Error('Ambiguous frozen Scene oracle');
  return originals.length === 1 ? text.replace(`Scene:\n${current}`, `Scene:\n${originals[0]}`) : text;
}
