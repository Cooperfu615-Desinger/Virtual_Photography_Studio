/** Authored target scenarios, not runtime output or production coverage metadata.
 * Evidence excerpts are checked against the current catalog before use.
 * Coverage expectations apply only to the described region and explicit layers.
 */
export const LOCAL_DETAIL_PROMPT_FIXTURES = [
  {
    id: 'eyes-visible-feature', target: 'eyes', tags: ['eyes', 'identity'],
    sources: [{ domain: 'Character', category: '五官特徵 (Facial Features)', zh: '甜美可愛臉', excerpt: 'bright friendly eyes' }],
    expected: { retain: ['eyeIdentity'], omit: ['completeFace', 'completeOutfit', 'location'] },
  },
  {
    id: 'eyes-head-placement-not-visible', target: 'eyes', tags: ['eyes', 'accessory-placement'],
    sources: [{ domain: 'Wardrobe', category: '眼鏡配戴方式 (Eyewear Placement)', zh: '戴在頭頂', excerpt: 'eyes unobstructed' }],
    expected: { retain: [], omit: ['eyewearOnHead', 'completeHairstyle'] },
  },
  {
    id: 'chest-local-neckline', target: 'collarbone-chest', tags: ['chest', 'separates', 'mixed'],
    sources: [{ domain: 'Wardrobe', category: '上身 (Tops)', zh: '一字領上衣', excerpt: 'open collarbone line' }],
    expected: { region: 'collarbone', coverage: 'exposed', retain: ['localNeckline'], omit: ['completeOutfit', 'fullBodyMeasurements'] },
    reviewNote: 'Only the collarbone opening is explicit; do not mark the entire chest exposed.',
  },
  {
    id: 'abdomen-continuous-latex-covered', target: 'abdomen-navel', tags: ['abdomen', 'preset', 'covered', 'piercing-occlusion'],
    sources: [
      { domain: 'Wardrobe', category: '套裝 (Outfit Presets)', zh: '亮面乳膠束帶套裝', excerpt: 'continuous unbroken coverage' },
      { domain: 'Wardrobe', category: '腰部配件 (Waist Accessories)', zh: '肚臍環', excerpt: 'navel piercing' },
    ],
    expected: { region: 'navelPosition', coverage: 'covered', retain: ['localFabric'], omit: ['visibleNavelPiercing', 'completeOutfit', 'fullBodyMeasurements'] },
  },
  {
    id: 'abdomen-explicit-monokini-opening', target: 'abdomen-navel', tags: ['abdomen', 'dress', 'exposed'],
    sources: [{ domain: 'Wardrobe', category: '連身 (Dresses)', zh: '短版｜高領挖腰連身泳裝', excerpt: 'gap exposing most of the abdomen and navel' }],
    expected: { region: 'navelPosition', coverage: 'exposed', retain: ['localSkin'], omit: ['localNeckline', 'completeOutfit'] },
  },
  {
    id: 'abdomen-zipper-opening-is-local', target: 'abdomen-navel', tags: ['abdomen', 'dress', 'opening'],
    sources: [{ domain: 'Wardrobe', category: '連身 (Dresses)', zh: '短版｜亮面乳膠拉鏈洋裝', excerpt: 'zipper opened down below the navel by default' }],
    expected: { region: 'navelPosition', coverage: 'exposed', retain: ['effectiveCoverageModifiers', 'localFabric'], omit: ['completeOutfit'] },
    reviewNote: 'The opening is a vertical strip, not a completely bare abdomen or two-piece garment.',
  },
  {
    id: 'sheer-top-needs-local-layer-map', target: 'collarbone-chest', tags: ['chest', 'translucent', 'unknown'],
    sources: [{ domain: 'Wardrobe', category: '上身 (Tops)', zh: '透膚刺繡襯衫', excerpt: 'semi-sheer embroidered shirt' }],
    expected: { coverage: 'unknown', retain: ['localFabric'], omit: ['completeOutfit'], needs: ['subregionCoverage', 'resolvedInnerLayers'] },
    reviewNote: 'Semi-sheer material is evidence; visibility of underlying skin still depends on the resolved layers.',
  },
  {
    id: 'open-outerwear-does-not-remove-inner-cover', target: 'abdomen-navel', tags: ['abdomen', 'outerwear-layering', 'unknown'],
    sources: [
      { domain: 'Wardrobe', category: '外套 (Outerwear)', zh: '長版襯衫', excerpt: 'longline button-up shirt' },
      { domain: 'Wardrobe', category: '外套開合 (Outerwear Opening)', zh: '敞開穿', excerpt: 'worn open at the front' },
      { domain: 'Wardrobe', category: '上身 (Tops)', zh: '高領連身上衣', excerpt: 'continuous torso line' },
    ],
    expected: { coverage: 'unknown', retain: ['localFabric'], omit: ['visibleNavelPiercing'], needs: ['resolvedInnerLayers', 'subregionCoverage'] },
  },
  {
    id: 'shoulder-drop-is-not-abdomen-opening', target: 'abdomen-navel', tags: ['abdomen', 'shoulder-wear', 'unknown'],
    sources: [{ domain: 'Wardrobe', category: '外套穿法 (Outerwear Styling)', zh: '雙肩露出', excerpt: 'neckline resting below both shoulders' }],
    expected: { coverage: 'unknown', retain: [], omit: ['localNeckline'], needs: ['resolvedInnerLayers', 'subregionCoverage'] },
  },
  {
    id: 'empty-top-is-not-bare-abdomen', target: 'abdomen-navel', tags: ['abdomen', 'none', 'unknown'],
    sources: [{ domain: 'Wardrobe', category: '上身 (Tops)', zh: '全無', excerpt: 'no top layering' }],
    expected: { coverage: 'unknown', retain: [], omit: ['localSkin'], needs: ['resolvedInnerLayers'] },
  },
];

// Adapter-level obligations deferred until adapters exist; not claimed as passed
// runtime fixtures in phase one.
export const LOCAL_DETAIL_PENDING_INTEGRATION_CASES = [
  'same-snapshot-no-reroll-three-target-switch',
  'existing-six-output-byte-identity',
  'character-card-visible-identity-only',
  'special-outfit-local-source-or-explicit-unavailable',
  'duo-output-absent',
  'supine-surface-fixed-scene-imported-scene-omitted',
  'selfie-open-palm-framing-and-camera-geometry-omitted',
  'eyes-invariant-to-shoes-and-scene',
  'image-type-not-forced-to-photography',
  'source-traceable-local-lighting-no-scene-objects',
  'saved-card-target-version-text-roundtrip',
  'legacy-six-output-record-without-synthesis',
];
