/**
 * Target contract for PAGE1 fixed-framing derived prompts.
 *
 * Phase 1 records this as frozen data only. Runtime generation, public output
 * contracts, UI visibility, and legacy-option filtering remain disconnected
 * until their dedicated implementation phases.
 */

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export const FIXED_FRAMING_DERIVED_PROMPT_CONTRACT_VERSION = 1;

export const FIXED_FRAMING_MAIN_OPTION_POLICY = deepFreeze({
  visible: [
    { id: 'camera:景別構圖-framing:全無:0', zh: '全無', randomCandidate: false },
    { id: 'camera:景別構圖-framing:半臉傾斜特寫:1', zh: '半臉傾斜特寫', randomCandidate: true },
    { id: 'camera:景別構圖-framing:中景鏡頭-medium-shot:6', zh: '中景鏡頭 (Medium Shot)', randomCandidate: true },
    { id: 'camera:景別構圖-framing:牛仔中景-cowboy-shot:7', zh: '牛仔中景 (Cowboy Shot)', randomCandidate: true },
    { id: 'camera:景別構圖-framing:全身鏡頭-full-body-shot:8', zh: '全身鏡頭 (Full Body Shot)', randomCandidate: true },
  ],
  legacyHidden: [
    { id: 'camera:景別構圖-framing:局部五官特寫:2', zh: '局部五官特寫' },
    { id: 'camera:景別構圖-framing:臉部特寫:3', zh: '臉部特寫' },
    { id: 'camera:景別構圖-framing:特寫鏡頭-close-up:4', zh: '特寫鏡頭 (Close-Up)' },
    { id: 'camera:景別構圖-framing:胸上特寫:5', zh: '胸上特寫' },
  ],
  legacyRestore: {
    preserveIds: true,
    remainResolvable: true,
    preserveStoredSelection: true,
    participateInNewRandomSelection: false,
  },
});

const SHARED_DERIVED_OUTPUT_POLICY = {
  supportedModes: ['single'],
  unsupportedModeBehavior: 'absent',
  sourceResolution: 'reuseSameResolvedSelectionsWithoutReroll',
  preserveRawSelections: true,
  rendererStyle: 'gptFullFidelityStructured',
  selectedScene: 'sourceTraceableProjectedScene',
  selectedLighting: 'preserve',
  selectedPhotographyAndImaging: 'preserve',
  depthEffects: 'selectedImagingControlsOnly',
  fixedCompositionScene: {
    preserveSceneIdentityAndSourceAnchors: true,
    omitConflictingFixedCameraDistance: true,
    derivedFramingOverridesFixedSetDistance: true,
  },
};

export const FIXED_FRAMING_DERIVED_PROMPT_CONTRACT = deepFreeze({
  runtimeConnected: true,
  runtimePhase: 3,
  shared: SHARED_DERIVED_OUTPUT_POLICY,
  outputs: {
    facialCloseupPortrait: {
      id: 'facial-closeup-portrait',
      uiLabel: '五官特寫照',
      aspectRatio: '1:1',
      lockAspectRatio: true,
      framingSourceZh: '臉部特寫',
      visibilityBucket: 'faceDetail',
      compositionOpening: 'Face-dominant close-up, full facial features visible, shoulders and upper garment neckline visible',
      body: { mode: 'omit' },
      wardrobe: {
        roles: ['top', 'dress', 'outerwear', 'headAccessory', 'eyewear', 'earrings', 'neckAccessory'],
        visibleZones: ['head', 'face', 'shoulder', 'neckline'],
        upperGarmentRequired: true,
        sourcePriority: ['specialOutfit', 'outfitPreset', 'dress', 'outerwear', 'top', 'characterCardOutfit'],
        fallbackText: 'a simple opaque crew-neck top',
      },
      pose: { mode: 'omit' },
      scene: { mode: 'compactSource', preserveLocationIdentity: true, preserveSourceAnchors: true },
      viewpoint: {
        angle: 'preserveCompatibleResolvedSelection',
        orbit: 'preserveCompatibleElseFrontView',
        preserveRawSelection: true,
      },
      orderedSections: ['Image Type', 'Composition', 'Subject', 'Wardrobe', 'Scene', 'Lighting', 'Camera Look'],
      forbiddenSections: ['Pose and Composition'],
    },
    chestUpPortrait: {
      id: 'chest-up-portrait',
      uiLabel: '胸上特寫照',
      aspectRatio: '4:5',
      lockAspectRatio: true,
      framingSourceZh: '胸上特寫',
      visibilityBucket: 'chestUp',
      compositionOpening: 'Chest-up portrait',
      body: { mode: 'visibleZones', zones: ['chest'] },
      wardrobe: {
        roles: ['top', 'dress', 'outerwear', 'headAccessory', 'eyewear', 'earrings', 'neckAccessory'],
        visibleZones: ['head', 'face', 'shoulder', 'neckline', 'upperBody'],
        upperGarmentRequired: false,
      },
      pose: {
        mode: 'projectedCanonical',
        parts: ['head', 'upperBody'],
        conditionalParts: ['hand', 'prop', 'anchor', 'contactWeight'],
        shareExactTextAcrossConsumers: true,
      },
      scene: { mode: 'compactSource', preserveLocationIdentity: true, preserveSourceAnchors: true },
      viewpoint: {
        angle: 'preserveResolvedSelection',
        orbit: 'preserveResolvedSelection',
        preserveRawSelection: true,
      },
      orderedSections: ['Image Type', 'Composition', 'Subject', 'Wardrobe', 'Pose and Composition', 'Scene', 'Lighting', 'Camera Look'],
      forbiddenSections: [],
    },
    fullBodyCharacterCompatibility: {
      id: 'full-body-character',
      uiLabel: '全身角色照',
      aspectRatio: '9:16',
      lockAspectRatio: true,
      behaviorMustRemainUnchangedDuringInfrastructureMigration: true,
    },
  },
});

export const HALF_FACE_COMPOSITION_TARGET = deepFreeze({
  framingId: 'camera:景別構圖-framing:半臉傾斜特寫:1',
  framingZh: '半臉傾斜特寫',
  legacySourceText: 'asymmetrical half-face close-up, off-center crop, slight tilted frame',
  resolutionMode: 'seededSinglePlacementVariant',
  shareResolvedOpeningAcrossPrimaryOutputs: true,
  preserveRawFramingId: true,
  placementVariants: [
    {
      id: 'left-edge',
      subjectSide: 'left',
      opening: 'Asymmetrical off-center half-face portrait, subject placed flush against the far left frame edge, left vertical frame boundary cropping through the outer half of the face, broad negative space on the right, neck, shoulders, and upper torso visible',
    },
    {
      id: 'right-edge',
      subjectSide: 'right',
      opening: 'Asymmetrical off-center half-face portrait, subject placed flush against the far right frame edge, right vertical frame boundary cropping through the outer half of the face, broad negative space on the left, neck, shoulders, and upper torso visible',
    },
  ],
});
