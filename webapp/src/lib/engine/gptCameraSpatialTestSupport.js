// Test-only exact bridge. Only a frozen old Composition plus its approved
// spatial sentence is reversible; arbitrary added/missing prose is not hidden.
import { readFileSync } from 'node:fs';
import { getLockControls } from '../engine.js';
import { resolveCompositionVisibilityBucket } from './compositionVisibilityContract.js';
import { buildGptCameraSpatialText } from './gptCameraSpatial.js';
import { normalizeBathroomVanityMirrorForLegacy } from './bathroomVanityMirrorReflectionTestSupport.js';
export const cameraBaseline = JSON.parse(readFileSync(new URL('./gptCameraSpatialBaseline.json', import.meta.url), 'utf8'));
const controls = getLockControls();
const angles = controls.find(c=>c.key==='angleId').options;
const framings = controls.find(c=>c.key==='framingId').options;
const descriptors = {
  '高位俯視鏡頭':'high angle, looking down', '地面高度鏡頭':'low angle from floor level',
  '蟲眼視角鏡頭':"worm's-eye view", '鳥瞰視角':"bird's-eye view", '正上方俯視鏡頭':'top-down view',
};
export function expectedCameraComposition(old, selection) {
  const angle = angles.find(a=>a.id===selection.angleId);
  const bucket = resolveCompositionVisibilityBucket(framings.find(f=>f.id===selection.framingId));
  const sentence = buildGptCameraSpatialText(angle,bucket,selection.poseBaseId);
  if (!old || !sentence) return old;
  const [base,...tail] = old.split('. ');
  const descriptor = descriptors[angle.zh];
  const opening = (descriptor ? base.replace(`, ${descriptor}`,'') : base).replace(/\.$/,'');
  return `${opening}. ${sentence}${tail.length ? ` ${tail.join('. ')}` : ''}`;
}
const reverse = new Map();
// Ratio is orthogonal to this projection. Preserve any exact known ratio cue
// byte-for-byte while matching only the frozen remainder of Composition.
const ratioPrefix = /^(?:Square composition at a 1:1 aspect ratio|Vertical portrait composition at a (?:4:5|3:4|9:16) aspect ratio|Landscape composition at a 4:3 aspect ratio|Wide landscape composition at a 16:9 aspect ratio), /;
for (const [angleId,framingId,poseBaseId,old] of cameraBaseline.originals) {
  const original = old.replace(ratioPrefix,'');
  const current = expectedCameraComposition(old,{angleId,framingId,poseBaseId}).replace(ratioPrefix,'');
  if (current===original) continue;
  if (reverse.has(current) && reverse.get(current)!==original) throw Error('Ambiguous Composition oracle');
  reverse.set(current,original);
}
export function normalizeGptCameraForLegacy(text) {
  text = normalizeBathroomVanityMirrorForLegacy(text, 'grokPrompt');
  return text.replace(/(^|\n\n)Composition:\n([^]*?)(?=\n\n[A-Z][^\n]*:\n|$)/,
    (all,prefix,current)=> {
      const ratio = current.match(ratioPrefix)?.[0] || '';
      const body = current.slice(ratio.length);
      return reverse.has(body) ? `${prefix}Composition:\n${ratio}${reverse.get(body)}` : all;
    });
}
