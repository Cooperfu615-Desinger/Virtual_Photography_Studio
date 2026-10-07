// Node-only exact inverse for immutable pre-Shibuya crowd snapshots. Never
// normalize arbitrary scene prose, a different location, or unrelated output.
import { getLockControls } from '../engine.js';
import { resolveCompositionVisibilityBucket } from './compositionVisibilityContract.js';
import { projectGptSceneSource } from './gptSceneVisibility.js';
import { LOW_CAMERA_LABELS } from './zImageSceneDirection.js';

export const SHIBUYA_LEGACY_LOCATION_ID = 'locations:城市與社群感-urban-social-snapshots:戶外-澀谷站前廣場人潮邊緣:11';
const CURRENT_PARTS = Object.freeze([
  'Shibuya Station front plaza with the QFRONT glass facade carrying TSUTAYA and STARBUCKS signage and large advertising screens in the background',
  'the subject as one person within a dense pedestrian flow with people passing in different directions beside and in front of and behind her; everyone sharing the same physical space and perspective with apparent size varying naturally by distance',
  'pedestrians in varied everyday clothing in mixed colors and styles sharing the same ambient light as the subject; nearby passersby naturally overlapping and partly cropped at frame edges',
  'surrounding Japanese shop signs',
]);
const LEGACY_PARTS = Object.freeze([
  'Shibuya Station front plaza edge near Hachiko Square',
  'broad pedestrian paving',
  'dense realistic foot traffic',
  'station-front commercial facade layers',
  'meeting crowd clusters',
  'curb and railing fragments',
  'recognizable public-plaza ground plane without focusing on a single monument',
]);

const active = id => Boolean(id && !['none', 'random'].includes(id));
const capitalize = text => text[0].toUpperCase() + text.slice(1);
function context(selection, chest = false) {
  if (selection?.locationId !== SHIBUYA_LEGACY_LOCATION_ID) return null;
  const controls = getLockControls();
  const framing = controls.find(c => c.key === 'framingId').options.find(o => o.id === selection.framingId);
  const angle = controls.find(c => c.key === 'angleId').options.find(o => o.id === selection.angleId);
  const bucket = resolveCompositionVisibilityBucket(framing);
  const near = ['faceDetail', 'headShoulders', 'chestUp'].includes(bucket);
  const medium = ['mediumWaist', 'cowboyKnee'].includes(bucket);
  const directional = selection.subjectCount === '1'
    && !['fixedCompositionSetId', 'specialSubjectId', 'characterProfileId'].some(key => active(selection[key]))
    && !(selection.poseBaseId === 'lying' && selection.poseOrientationId === 'lying-supine');
  return { angle, near: !chest && near, medium: !chest && medium, directional };
}

export function normalizeShibuyaSceneForLegacy(scene, selection = {}, { chest = false } = {}) {
  const c = context(selection, chest);
  if (!c) return scene;
  const current = `The portrait takes place in ${CURRENT_PARTS.slice(0, c.near ? 3 : 4).join(', ')}.`;
  if (scene !== current) return scene;
  const original = `The portrait takes place in ${LEGACY_PARTS.slice(0, c.near ? 3 : c.medium ? 5 : 7).join(', ')}.`;
  return c.directional ? projectGptSceneSource(original, c.angle) : original;
}

function normalizeGpt(text, selection, chest) {
  return text.replace(/(Scene:\n)([^\n]+)(?=\n\n[A-Z][^\n]*:\n|$)/,
    (_, prefix, scene) => prefix + normalizeShibuyaSceneForLegacy(scene, selection, { chest }));
}

function normalizeZ(text, selection) {
  const c = context(selection);
  if (!c) return text;
  const current = `The setting is ${CURRENT_PARTS.slice(0, 3).join(', ')}.`;
  const original = `The setting is ${c.directional && LOW_CAMERA_LABELS.includes(c.angle?.zh)
    ? [LEGACY_PARTS[0], LEGACY_PARTS[3]].join(', ') : LEGACY_PARTS.slice(0, 3).join(', ')}.`;
  return text.replace(/(^|\n\n)(The setting is [^.\n]+\.)/,
    (all, prefix, scene) => scene === current ? prefix + original : all);
}

function normalizeMj(text, selection, chest) {
  const c = context(selection, chest);
  if (!c) return text;
  const identity = `The setting is ${CURRENT_PARTS[0]}.`;
  if (text.split(identity).length !== 2) return text;
  const fullDetails = capitalize(CURRENT_PARTS.slice(1, c.near ? 3 : 4).join(', ')) + '.';
  const compactDetails = capitalize(CURRENT_PARTS[1]) + '.';
  const currentDetails = [fullDetails, compactDetails].find(source => text.split(` ${source}`).length === 2);
  if (!currentDetails) return text;
  const legacyDetails = currentDetails === compactDetails
    ? (c.near || c.medium ? LEGACY_PARTS[1] : LEGACY_PARTS[5])
    : c.near ? LEGACY_PARTS.slice(1, 3).join(', ')
      : c.medium ? LEGACY_PARTS.slice(1, 4).join(', ')
        : [LEGACY_PARTS[5], LEGACY_PARTS[1], LEGACY_PARTS[2]].join(', ');
  return text.replace(identity, `The setting is ${LEGACY_PARTS[0]}.`)
    .replace(` ${currentDetails}`, ` ${capitalize(legacyDetails)}.`);
}

export function normalizeShibuyaPromptForLegacy(text, field, selection = {}) {
  if (!text || selection.locationId !== SHIBUYA_LEGACY_LOCATION_ID) return text;
  if (field === 'grokPrompt') return normalizeGpt(text, selection, false);
  if (field === 'chestUpPortraitPrompt') return normalizeGpt(text, selection, true);
  if (field === 'zImagePrompt') return normalizeZ(text, selection);
  if (field === 'midjourneyPrompt') return normalizeMj(text, selection, false);
  if (field === 'chestUpMjPortraitPrompt') return normalizeMj(text, selection, true);
  return text;
}
