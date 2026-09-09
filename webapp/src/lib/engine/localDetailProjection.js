import { LOCAL_DETAIL_PROMPT_CONTRACT as contract } from './localDetailPromptContract.js';

// Independent projection core. Its input is authored regional evidence
// from one resolved snapshot, never a main prompt or a cropped wardrobe string.
const imageTypes = Object.freeze({
  'photorealistic-photo': 'Photorealistic editorial detail image.',
  'fashion-advertising': 'Premium fashion advertising detail image.',
  'watercolor-illustration': 'Watercolor detail illustration.',
  'oil-painting': 'Oil-painted detail image.',
  'fashion-illustration': 'Fashion detail illustration.',
  'pastel-illustration': 'Pastel detail illustration.',
});

const compositions = Object.freeze({
  eyes: 'An extreme close-up centered on the eye area and its immediate surroundings, showing the visible surfaces at that location. This small region fills the frame, with the rest of the face outside the crop.',
  'collarbone-chest': 'An extreme close-up centered on the collarbone and upper-chest area. Only this small region and its visible surfaces fill the frame; the head and the rest of the torso remain outside the crop.',
  'abdomen-navel': 'An extreme close-up centered on the navel position and the immediately surrounding abdominal area, showing the visible surface at that location. This small region fills the frame; the rest of the torso and hips remain outside the crop.',
});

const surfaceGroups = new Set(['localFabric', 'localColor', 'localNeckline', 'localStraps',
  'localWaistline', 'effectiveCoverageModifiers', 'eyeCovering', 'localHairOcclusion', 'eyewearAtEyes']);
const groupOrder = ['eyeIdentity', 'browIdentity', 'eyeExpression', 'localSkin',
  ...surfaceGroups, 'visibleNeckAccessory', 'visibleWaistAccessory', 'visibleNavelPiercing',
  'lighting', 'imaging'];

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function validRef(sources, ref) {
  return typeof ref?.key === 'string' && typeof ref.excerpt === 'string'
    && ref.excerpt.trim().length > 0
    && typeof sources?.[ref.key]?.en === 'string'
    && sources[ref.key].en.includes(ref.excerpt);
}

function sentence(text) {
  const trimmed = text.trim().replace(/[,. ;]+$/, '');
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function projectTarget(snapshot, target) {
  const policy = contract.targets[target];
  const input = snapshot.targets?.[target];
  const sources = snapshot.sources || {};
  const fragments = [];
  const refs = [];
  const diagnostics = [];
  const coverage = {};
  const add = (fragment, allowed) => {
    if (!allowed.includes(fragment.group) || !validRef(sources, fragment.ref)) {
      diagnostics.push('unreviewed-or-stale-fragment');
      return;
    }
    const hasColor = ['localFabric', 'localStraps', 'eyeCovering'].includes(fragment.group) && validRef(sources, fragment.colorRef);
    fragments.push({ group: fragment.group, text: hasColor
      ? fragment.group === 'eyeCovering'
        ? `${fragment.colorRef.excerpt} ${fragment.ref.excerpt}`
        : `${fragment.ref.excerpt} in ${fragment.colorRef.excerpt}` : fragment.ref.excerpt });
    refs.push({ ...fragment.ref });
    if (hasColor) refs.push({ ...fragment.colorRef });
  };

  for (const region of policy.subregions) {
    const layers = input?.layers || [];
    let state = layers.length ? 'exposed' : 'unknown';
    let translucent = false;
    const exposureFragments = [];
    for (const layer of layers) {
      const evidence = layer.regions?.[region];
      const reviewed = validRef(sources, evidence?.ref);
      const layerState = reviewed && ['exposed', 'covered', 'translucent'].includes(evidence.state)
        ? evidence.state : 'unknown';
      if (reviewed) refs.push({ ...evidence.ref });
      // These are reviewed descriptions of this visible layer, not skin or
      // jewelry beneath it. A missing region is a barrier, not an open layer.
      for (const fragment of layer.details || []) {
        if (fragment.region === region && surfaceGroups.has(fragment.group)) {
          if (fragment.requiresExposed) exposureFragments.push(fragment);
          else add(fragment, policy.allowedGroups);
        }
      }
      if (layerState === 'covered' || layerState === 'unknown') {
        state = layerState;
        break;
      }
      translucent ||= layerState === 'translucent';
    }
    if (state === 'exposed' && translucent) state = 'translucent';
    coverage[region] = state;
    if (state === 'unknown') diagnostics.push(`unresolved-region:${region}`);
    // No inferred visibility through translucent material. Such features need
    // an explicit visible-layer fragment in a future reviewed adapter.
    if (state === 'exposed') {
      for (const fragment of exposureFragments) add(fragment, policy.allowedGroups);
      for (const fragment of input?.details || []) {
        if (fragment.region === region) add(fragment, policy.allowedGroups);
      }
    }
  }

  // Lighting cannot make an otherwise unsupported target available.
  const hasLocalEvidence = fragments.length > 0;
  for (const fragment of input?.effects || []) add(fragment, ['lighting', 'imaging']);
  const ready = hasLocalEvidence && Object.hasOwn(imageTypes, snapshot.imageType);
  if (!Object.hasOwn(imageTypes, snapshot.imageType)) diagnostics.push('unreviewed-image-type');
  const states = new Set(Object.values(coverage));
  const ordered = groupOrder.flatMap((group) => fragments.filter((f) => f.group === group).map((f) => f.text));
  return {
    id: contract.outputId, label: contract.label, target, contractVersion: contract.version,
    status: ready ? 'ready' : 'needs-source-review',
    text: ready ? [imageTypes[snapshot.imageType], compositions[target],
      ...[...new Set(ordered)].map(sentence)].join('\n\n') : '',
    coverage, coverageState: states.size === 1 ? [...states][0] : 'mixed',
    sourceRefs: [...new Map(refs.map((r) => [`${r.key}\u0000${r.excerpt}`, r])).values()],
    diagnostics: [...new Set(diagnostics)],
  };
}

/** All targets are calculated together without random calls or source mutation.
 * Layer order is explicit outer-to-inner. Callers must supply every potentially
 * occluding layer; raw catalog/character-card adaptation is a separate boundary.
 * Returned diagnostics are internal only, not storage/UI/public prompt fields.
 */
export function buildLocalDetailBundle(snapshot = {}) {
  if (snapshot.subjectCount !== 1) return freeze({});
  return freeze(Object.fromEntries(Object.keys(contract.targets).map((target) => [target, projectTarget(snapshot, target)])));
}
