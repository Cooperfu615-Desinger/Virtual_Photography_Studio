/** Runtime projection contract shared by the prompt consumer and Saved Cards storage. */
function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

export const LOCAL_DETAIL_PROMPT_CONTRACT = deepFreeze({
  version: 1,
  outputId: 'local-detail',
  label: '局部超特寫',
  runtimeConnected: true,
  consumerConnected: true,
  storageConnected: true,
  supportedSubjectCounts: [1],
  unsupportedBehavior: 'absent',
  defaultTarget: 'eyes',
  source: {
    resolution: 'sameResolvedSnapshot',
    mainProjectedSource: false,
    parseMainPrompt: false,
    reroll: false,
    mutateSelections: false,
    mutateExistingOutputs: false,
  },
  output: {
    language: 'en',
    orderedGroups: ['imageType', 'composition', 'visibleIdentity', 'visibleSurface', 'visibleAccessories', 'lighting', 'imaging'],
    modelVariants: 1,
    inheritImageType: true,
    fixedAspectRatio: null,
    parameterTail: false,
    multiCut: false,
    requireSourceRefs: true,
    preserveCompleteIdentityAnchors: false,
  },
  // These are a source adapter's obligations, not a keyword deletion list.
  omittedGroups: [
    'fullBodyMeasurements', 'completeFace', 'completeHairstyle', 'completeOutfit',
    'ordinaryFraming', 'cameraAngle', 'cameraOrbit', 'focalLength', 'pose',
    'handAction', 'prop', 'contactSupport', 'supineSurface', 'fixedCompositionScene',
    'location', 'importedWorldScene', 'sceneAccent',
  ],
  coverage: {
    states: ['exposed', 'covered', 'translucent', 'mixed', 'unknown'],
    mixedRequiresSubregions: true,
    layerOrder: 'outerToInnerAtEachSubregion',
    noItemIsNotEvidenceOfBareSkin: true,
    openOuterLayerDoesNotExposeInnerLayer: true,
    opaqueCoverSuppressesUnderlyingSkinAndPiercing: true,
    unknownBehavior: 'confirmedSurfaceOnlyOtherwiseUnavailable',
    automaticGarmentAlteration: false,
  },
  targets: {
    eyes: {
      label: '眼部',
      subregions: ['eyes', 'brows', 'periocularSkin'],
      allowedGroups: ['eyeIdentity', 'browIdentity', 'eyeExpression', 'localSkin', 'localHairOcclusion', 'eyeCovering', 'eyewearAtEyes'],
      ignoredAccessoryGroups: ['earrings', 'neckAccessory', 'waistAccessory', 'eyewearOnHead'],
      framingIntent: 'eyesAndSurroundingsFillFrameWithoutCompleteFace',
    },
    'collarbone-chest': {
      label: '鎖骨／胸口',
      subregions: ['neckBase', 'collarbone', 'upperChest'],
      allowedGroups: ['localSkin', 'localHairOcclusion', 'localFabric', 'localColor', 'localNeckline', 'localStraps', 'effectiveCoverageModifiers', 'visibleNeckAccessory'],
      ignoredAccessoryGroups: ['eyewear', 'earrings', 'waistAccessory'],
      framingIntent: 'collarboneAndUpperChestFillFrameWithoutHeadOrCompleteBust',
    },
    'abdomen-navel': {
      label: '腰腹／肚臍',
      subregions: ['navelPosition', 'surroundingAbdomen', 'nearbyWaistline'],
      allowedGroups: ['localSkin', 'localFabric', 'localColor', 'localWaistline', 'effectiveCoverageModifiers', 'visibleWaistAccessory', 'visibleNavelPiercing'],
      ignoredAccessoryGroups: ['eyewear', 'earrings', 'neckAccessory'],
      framingIntent: 'navelPositionAndSurroundingsFillFrameEvenWhenClothed',
    },
  },
  storageTarget: {
    requiredReadyEntryFields: ['id', 'label', 'target', 'text', 'contractVersion'],
    readyStatus: 'ready',
    unavailableStatus: 'needs-source-review',
    unknownTargetBehavior: 'unavailable',
    legacyAbsentBehavior: 'preserveWithoutSynthesis',
    restoreText: 'verbatim',
    switchRestoredTarget: 'sameSnapshotOrPrecomputedOnly',
    currentCodecPreservesTarget: true,
  },
});
