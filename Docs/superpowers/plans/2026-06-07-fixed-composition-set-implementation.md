# Fixed Composition Set Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PAGE1 fixed composition sets that lock scene/camera geometry while allowing subject, wardrobe, lighting, photography style, rendering, set position, capture mode, and performance state to vary.

**Architecture:** Define the V1 fixed-set catalog in `engine.js` as code-defined option groups. Generate fixed-set prompt lines through the existing structured prompt pipeline, then let Gpt, Grok/Z-Image, and AI consume those lines through the current section builders. PAGE1 UI exposes the controls only in D scene/environment and disables conflicting location/PAGE3/camera-geometry controls when fixed set mode is active.

**Tech Stack:** Vite, React, Node test runner, existing PAGE1 prompt engine.

---

### Task 1: Add Fixed Composition Engine Contract Tests

**Files:**
- Create: `webapp/src/lib/engineFixedCompositionSet.test.js`

- [ ] **Step 1: Write the failing test file**

Create `webapp/src/lib/engineFixedCompositionSet.test.js` with this full content:

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

function control(key) {
  const found = getLockControls().find((entry) => entry.key === key);
  assert.ok(found, `Missing control ${key}`);
  return found;
}

function optionId(controlKey, zh) {
  const option = control(controlKey).options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

test('fixed composition controls expose three sets and fixed-set-only option groups', () => {
  assert.deepEqual(
    control('fixedCompositionSetId').options.map((entry) => entry.zh),
    ['全無', '清水模牆面沙發棚', '高級飯店落地窗都市夜景', '復古磁磚浴室浴缸']
  );

  assert.ok(control('fixedSetPositionId').options.some((entry) => entry.zh === '沙發座面中央'));
  assert.ok(control('fixedSetPositionId').options.some((entry) => entry.zh === '床邊靠窗'));
  assert.ok(control('fixedSetPositionId').options.some((entry) => entry.zh === '低角度浴缸前景'));

  assert.deepEqual(
    control('fixedSetCaptureModeId').options.map((entry) => entry.zh),
    ['攝影師拍攝', '自然自拍感', '失控自拍感']
  );
  assert.deepEqual(
    control('fixedSetPerformanceStateId').options.map((entry) => entry.zh),
    ['模型自然發揮', '自信力量感', '慵懶無力感']
  );
});

test('fixed composition set overrides normal location, PAGE3 import, camera geometry, optical effect, and aspect ratio', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '清水模牆面沙發棚'),
    fixedSetPositionId: optionId('fixedSetPositionId', '沙發座面中央'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '攝影師拍攝'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '自信力量感'),
    importedWorldSceneMode: 'architecture',
    importedWorldSceneLabel: '東京｜澀谷 Scramble Crossing',
    importedWorldSceneArchitectureText: 'world-scene architecture for the portrait: Shibuya should not remain',
    sceneAttributeId: 'outdoor',
    locationId: optionId('locationId', '戶外：首爾聖水洞街區'),
    aspectRatio: optionId('aspectRatio', '9:16 手機直式'),
    framingId: optionId('framingId', '全身鏡頭 (Full Body Shot)'),
    angleId: optionId('angleId', '蟲眼視角鏡頭'),
    orbitId: optionId('orbitId', '背面 180 度'),
    lensId: optionId('lensId', '135mm 長焦壓縮'),
    opticalEffectId: optionId('opticalEffectId', '前景遮擋散景'),
    lightingId: optionId('lightingId', '室內暖光夜景'),
    lightDirectionId: optionId('lightDirectionId', '局部暖光'),
    styleId: optionId('styleId', 'Daido Moriyama（森山大道）'),
    filmId: optionId('filmId', '高銳利快照黑位'),
  });

  assert.equal(prompt.selection.fixedCompositionSetId, optionId('fixedCompositionSetId', '清水模牆面沙發棚'));
  assert.equal(prompt.selection.fixedSetPositionId, optionId('fixedSetPositionId', '沙發座面中央'));
  assert.equal(prompt.selection.fixedSetCaptureModeId, optionId('fixedSetCaptureModeId', '攝影師拍攝'));
  assert.equal(prompt.selection.fixedSetPerformanceStateId, optionId('fixedSetPerformanceStateId', '自信力量感'));
  assert.equal(prompt.selection.aspectRatio, optionId('aspectRatio', '16:9 寬螢幕'));
  assert.equal(prompt.selection.locationId, optionId('locationId', '全無'));
  assert.equal(prompt.selection.importedWorldSceneMode, 'none');
  assert.equal(prompt.selection.sceneAttributeId, '');
  assert.equal(prompt.selection.framingId, optionId('framingId', '全無'));
  assert.equal(prompt.selection.angleId, optionId('angleId', '全無'));
  assert.equal(prompt.selection.orbitId, optionId('orbitId', '全無'));
  assert.equal(prompt.selection.lensId, optionId('lensId', '全無'));
  assert.equal(prompt.selection.opticalEffectId, optionId('opticalEffectId', '全無'));

  assert.match(prompt.grokPrompt, /Fixed Composition Set:/);
  assert.match(prompt.grokPrompt, /raw concrete wall background/);
  assert.match(prompt.grokPrompt, /subject placed on the sofa seat plane/);
  assert.match(prompt.grokPrompt, /photographer-shot fixed set portrait/);
  assert.match(prompt.grokPrompt, /confident powerful presence/);
  assert.match(prompt.grokPrompt, /Lighting:\n[\s\S]*indoor warm night environment/);
  assert.match(prompt.grokPrompt, /Lighting:\n[\s\S]*local warm practical-light pool on the subject/);
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*Daido Moriyama/);
  assert.match(prompt.grokPrompt, /Camera Look:\n[\s\S]*high-acutance snapshot rendering/);
  assert.doesNotMatch(prompt.grokPrompt, /Seoul Seongsu-dong urban corner/);
  assert.doesNotMatch(prompt.grokPrompt, /Shibuya should not remain/);
  assert.doesNotMatch(prompt.grokPrompt, /135mm long telephoto lens/);
  assert.doesNotMatch(prompt.grokPrompt, /blurred foreground occlusion near the lens/);
  assert.match(prompt.grokPrompt, /\n\nmulti-cut sequence n=2$/);

  assert.match(prompt.zImagePrompt, /fixed editorial set composition/);
  assert.match(prompt.zImagePrompt, /subject placed on the sofa seat plane/);
  assert.doesNotMatch(prompt.zImagePrompt, /multi-cut sequence n=2/);

  assert.match(prompt.midjourneyPrompt, /raw concrete wall background/);
  assert.match(prompt.midjourneyPrompt, /subject placed on the sofa seat plane/);
  assert.match(prompt.midjourneyPrompt, /confident powerful presence/);
});

test('self-shot fixed composition mode relaxes set, focus, face, and wardrobe completeness guards', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '高級飯店落地窗都市夜景'),
    fixedSetPositionId: optionId('fixedSetPositionId', '近鏡頭床面前景'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '失控自拍感'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '慵懶無力感'),
    outfitPresetId: optionId('outfitPresetId', '套裝：空服員制服'),
    poseBaseId: 'sitting',
    poseArrangementId: 'model-natural-body-arrangement',
    poseHandId: 'model-natural-hand-placement',
  });

  assert.match(prompt.grokPrompt, /large floor-to-ceiling glass window filling the background/);
  assert.match(prompt.grokPrompt, /subject close to the camera or bed foreground/);
  assert.match(prompt.grokPrompt, /focus may fall on the background or set objects instead of the face/);
  assert.match(prompt.grokPrompt, /subject may be slightly blurred or partially cropped/);
  assert.match(prompt.grokPrompt, /fixed set may remain only as recognizable background fragments/);
  assert.match(prompt.grokPrompt, /lazy drained presence/);
  assert.match(prompt.grokPrompt, /flight attendant uniform outfit/);
  assert.match(prompt.grokPrompt, /let the image model choose a natural physically believable body arrangement/);
  assert.doesNotMatch(prompt.grokPrompt, /avoid collapsing into a face-only crop/);
  assert.doesNotMatch(prompt.grokPrompt, /clear facial readability/);
  assert.doesNotMatch(prompt.grokPrompt, /preserve the selected environment as a visible, recognizable background/);

  assert.match(prompt.zImagePrompt, /imperfect self-shot camera behavior/);
  assert.match(prompt.zImagePrompt, /no visible phone required/);
  assert.match(prompt.midjourneyPrompt, /focus may fall on the background or set objects instead of the face/);
});

test('fixed composition sets are ignored for duo mode in V1', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '2',
    fixedCompositionSetId: optionId('fixedCompositionSetId', '復古磁磚浴室浴缸'),
    fixedSetPositionId: optionId('fixedSetPositionId', '浴缸內中央'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '自然自拍感'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '自信力量感'),
    aspectRatio: optionId('aspectRatio', '9:16 手機直式'),
    locationId: optionId('locationId', '戶外：首爾聖水洞街區'),
  });

  assert.equal(prompt.selection.subjectCount, '2');
  assert.equal(prompt.selection.fixedCompositionSetId, 'none');
  assert.equal(prompt.selection.fixedSetPositionId, 'none');
  assert.equal(prompt.selection.fixedSetCaptureModeId, 'photographer-shot');
  assert.equal(prompt.selection.fixedSetPerformanceStateId, 'model-natural');
  assert.equal(prompt.selection.aspectRatio, optionId('aspectRatio', '9:16 手機直式'));
  assert.match(prompt.grokPrompt, /Seoul Seongsu-dong urban corner/);
  assert.doesNotMatch(prompt.grokPrompt, /fixed bathtub portrait composition/);
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
cd webapp
node --test src/lib/engineFixedCompositionSet.test.js
```

Expected: FAIL because `fixedCompositionSetId` and the other fixed-set controls do not exist yet.

- [ ] **Step 3: Commit the failing contract test**

```bash
git add webapp/src/lib/engineFixedCompositionSet.test.js
git commit -m "test: add fixed composition set contract"
```

### Task 2: Add Engine Fixed-Set Catalog And Effective Lock Rules

**Files:**
- Modify: `webapp/src/lib/engine.js`
- Test: `webapp/src/lib/engineFixedCompositionSet.test.js`

- [ ] **Step 1: Add code-defined fixed-set option constants**

In `webapp/src/lib/engine.js`, insert this block after `POSE_COMPOSER_ANCHOR_OPTIONS` and before `LOCK_DEFINITIONS`:

```js
const FIXED_COMPOSITION_SET_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不使用固定構圖場景。', meta: { tags: ['none'] } },
  {
    id: 'concrete-wall-chesterfield-sofa',
    zh: '清水模牆面沙發棚',
    en: 'fixed editorial set composition, raw concrete wall background, black vintage two-seat Chesterfield leather sofa spanning the lower frame, bare sculptural tree branches on one side, modern-retro interior styling, straight-on horizontal camera view, sofa and wall remain the main set architecture',
    desc: '灰色清水模牆、枯樹枝與黑色復古雙人扶手沙發構成的橫幅 editorial set。',
    aspectRatioId: '16:9',
    meta: { tags: ['fixed_composition_set', 'single_subject_only', 'indoor', 'sofa_set', 'horizontal_set'] },
  },
  {
    id: 'luxury-hotel-window-nyc',
    zh: '高級飯店落地窗都市夜景',
    en: 'fixed luxury hotel window composition, large floor-to-ceiling glass window filling the background, New York-style high-rise city skyline outside, bed edge and soft white bedding in the lower foreground, intimate room-to-city depth, camera facing the window from inside the room',
    desc: '高級飯店房間、床面前景、大片落地窗與紐約式高樓城市背景構成的直幅窗景 set。',
    aspectRatioId: '3:4',
    meta: { tags: ['fixed_composition_set', 'single_subject_only', 'indoor', 'hotel_window_set', 'vertical_set'] },
  },
  {
    id: 'retro-tile-bathtub',
    zh: '復古磁磚浴室浴缸',
    en: 'fixed bathtub portrait composition, vintage tiled bathroom wall, bathtub rim crossing the lower foreground, white foam bubbles around the subject, chrome faucet and bath hardware on one side, intimate low horizontal camera view from the tub edge',
    desc: '復古磁磚浴室、浴缸、泡泡、金屬水龍頭與浴缸邊低角度構成的橫幅浴室 set。',
    aspectRatioId: '16:9',
    meta: { tags: ['fixed_composition_set', 'single_subject_only', 'indoor', 'bathtub_set', 'horizontal_set'] },
  },
];

const FIXED_SET_POSITION_OPTIONS = [
  { id: 'none', zh: '全無', en: 'none', desc: '不指定固定場景內的人物位置。', meta: { tags: ['none'] } },
  {
    id: 'sofa-foreground',
    setId: 'concrete-wall-chesterfield-sofa',
    zh: '近鏡頭沙發前方',
    en: 'subject in the foreground in front of the sofa, with the sofa becoming a background layer; standing, crouching, floor sitting, or close-lens behavior can be model-decided',
  },
  {
    id: 'sofa-seat-center',
    setId: 'concrete-wall-chesterfield-sofa',
    zh: '沙發座面中央',
    en: 'subject placed on the sofa seat plane; sitting, lounging, half-reclining, lying, or leaning on an armrest can be model-decided',
  },
  {
    id: 'sofa-wall-back',
    setId: 'concrete-wall-chesterfield-sofa',
    zh: '沙發後方靠牆',
    en: 'subject near the wall behind or around the sofa, with the sofa as a horizontal foreground anchor; standing, wall-leaning, or forward-leaning behavior can be model-decided',
  },
  {
    id: 'hotel-bed-foreground',
    setId: 'luxury-hotel-window-nyc',
    zh: '近鏡頭床面前景',
    en: 'subject close to the camera or bed foreground; the city view can be partially blocked or softened',
  },
  {
    id: 'hotel-bed-window-side',
    setId: 'luxury-hotel-window-nyc',
    zh: '床邊靠窗',
    en: 'subject around the bed edge or window-side mid-plane; body, bedding, glass, and city depth can all remain readable',
  },
  {
    id: 'hotel-window-silhouette',
    setId: 'luxury-hotel-window-nyc',
    zh: '窗前城市剪影',
    en: 'subject near the floor-to-ceiling window; city towers become the dominant background, allowing profile, back-view, window-gazing, or silhouette-like behavior',
  },
  {
    id: 'bathtub-center',
    setId: 'retro-tile-bathtub',
    zh: '浴缸內中央',
    en: 'subject in the middle of the bathtub, surrounded by foam and tub edges; face and upper body can remain the main portrait anchor',
  },
  {
    id: 'bathtub-low-foreground',
    setId: 'retro-tile-bathtub',
    zh: '低角度浴缸前景',
    en: 'camera near the tub edge or waterline; tub rim, foam, legs, or partial body forms may create foreground occlusion and focus variation',
  },
  {
    id: 'bathtub-rim-edge',
    setId: 'retro-tile-bathtub',
    zh: '浴缸邊緣',
    en: 'subject close to the bathtub edge; sitting on the rim, holding the rim, or leaning from inside the tub can be model-decided',
  },
];

const FIXED_SET_CAPTURE_MODE_OPTIONS = [
  {
    id: 'photographer-shot',
    zh: '攝影師拍攝',
    en: 'photographer-shot fixed set portrait, subject arranged within the selected set, fixed composition remains readable, face and wardrobe generally clear where framing allows',
    meta: { tags: ['fixed_set_photographer_shot'] },
  },
  {
    id: 'natural-self-shot',
    zh: '自然自拍感',
    en: 'self-shot social composition feeling, subject may move close to the lens, off-center partial face or half-body crop allowed, fixed set may remain only as recognizable background fragments, no visible phone required',
    meta: { tags: ['fixed_set_self_shot'] },
  },
  {
    id: 'imperfect-self-shot',
    zh: '失控自拍感',
    en: 'imperfect self-shot camera behavior, focus may fall on the background or set objects instead of the face, subject may be slightly blurred or partially cropped, casual accidental framing, real social snapshot imperfection, no visible phone required',
    meta: { tags: ['fixed_set_self_shot', 'fixed_set_imperfect_focus'] },
  },
];

const FIXED_SET_PERFORMANCE_STATE_OPTIONS = [
  {
    id: 'model-natural',
    zh: '模型自然發揮',
    en: 'let the image model choose a natural body attitude and expression that fits the selected fixed set position and capture mode',
  },
  {
    id: 'confident-powerful',
    zh: '自信力量感',
    en: 'confident powerful presence, strong self-possessed attitude, assertive body energy, direct control of the frame without specifying exact limb placement',
  },
  {
    id: 'lazy-drained',
    zh: '慵懶無力感',
    en: 'lazy drained presence, softened body energy, relaxed weight sinking into the set, unforced tired attitude without specifying exact limb placement',
  },
];
```

- [ ] **Step 2: Register fixed-set controls**

In `LOCK_DEFINITIONS`, insert these four definitions after `importedWorldSceneArchitectureText`:

```js
  { key: 'fixedCompositionSetId', label: '固定構圖場景', options: FIXED_COMPOSITION_SET_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'core' },
  { key: 'fixedSetPositionId', label: '固定場景人物位置', options: FIXED_SET_POSITION_OPTIONS, defaultValue: 'none', suppressDefaultRandomOption: true, section: 'core' },
  { key: 'fixedSetCaptureModeId', label: '固定場景拍攝型態', options: FIXED_SET_CAPTURE_MODE_OPTIONS, defaultValue: 'photographer-shot', suppressDefaultRandomOption: true, section: 'core' },
  { key: 'fixedSetPerformanceStateId', label: '固定場景演出狀態', options: FIXED_SET_PERFORMANCE_STATE_OPTIONS, defaultValue: 'model-natural', suppressDefaultRandomOption: true, section: 'core' },
```

In `PARTIAL_REROLL_OPTIONS`, add these entries after `Location`:

```js
  { key: 'fixedCompositionSetId', label: 'Fixed Composition Set' },
  { key: 'fixedSetPositionId', label: 'Fixed Set Position' },
  { key: 'fixedSetCaptureModeId', label: 'Fixed Set Capture Mode' },
  { key: 'fixedSetPerformanceStateId', label: 'Fixed Set Performance State' },
```

- [ ] **Step 3: Add fixed-set helper functions**

In `engine.js`, place these helpers near the scene compatibility helpers, before `generateSinglePrompt`:

```js
function getFixedCompositionSetOption(id) {
  return FIXED_COMPOSITION_SET_OPTIONS.find((option) => option.id === id) || FIXED_COMPOSITION_SET_OPTIONS[0];
}

function isFixedCompositionSetActive(item) {
  return Boolean(item && !isNoneLikeItem(item));
}

function getFixedSetPositionOption(id, fixedSetId) {
  const item = FIXED_SET_POSITION_OPTIONS.find((option) => option.id === id) || FIXED_SET_POSITION_OPTIONS[0];
  if (!fixedSetId || item.id === 'none') return item;
  return item.setId === fixedSetId ? item : FIXED_SET_POSITION_OPTIONS[0];
}

function getFixedSetCaptureModeOption(id) {
  return FIXED_SET_CAPTURE_MODE_OPTIONS.find((option) => option.id === id) || FIXED_SET_CAPTURE_MODE_OPTIONS[0];
}

function getFixedSetPerformanceStateOption(id) {
  return FIXED_SET_PERFORMANCE_STATE_OPTIONS.find((option) => option.id === id) || FIXED_SET_PERFORMANCE_STATE_OPTIONS[0];
}

function isFixedSetSelfShotMode(captureMode) {
  return Boolean(captureMode?.meta?.tags?.includes('fixed_set_self_shot'));
}
```

- [ ] **Step 4: Normalize effective locks inside `generateSinglePrompt`**

In `generateSinglePrompt`, immediately after `const effectiveLocks = sanitizeLocksForCloseupMode(locks, lockControls);`, add:

```js
  const selectedFixedCompositionSet = getFixedCompositionSetOption(effectiveLocks.fixedCompositionSetId);
  const fixedCompositionSetActive = isFixedCompositionSetActive(selectedFixedCompositionSet) && effectiveLocks.subjectCount !== '2';
  if (fixedCompositionSetActive) {
    effectiveLocks.aspectRatio = selectedFixedCompositionSet.aspectRatioId;
    effectiveLocks.sceneAttributeId = '';
    effectiveLocks.importedWorldSceneMode = 'none';
    effectiveLocks.importedWorldSceneLabel = '';
    effectiveLocks.importedWorldSceneArchitectureText = '';

    ['locationId', 'framingId', 'angleId', 'orbitId', 'lensId', 'opticalEffectId'].forEach((key) => {
      const noneOption = getControlOptionByZh(lockControls, key, '全無');
      effectiveLocks[key] = noneOption?.id || '';
    });
  } else {
    effectiveLocks.fixedCompositionSetId = 'none';
    effectiveLocks.fixedSetPositionId = 'none';
    effectiveLocks.fixedSetCaptureModeId = 'photographer-shot';
    effectiveLocks.fixedSetPerformanceStateId = 'model-natural';
  }
```

After `const opticalEffect = pickWithLock(runtime.flatCatalog.effects, effectiveLocks.opticalEffectId);`, add:

```js
  const fixedCompositionSet = fixedCompositionSetActive ? selectedFixedCompositionSet : null;
  const fixedSetPosition = fixedCompositionSet
    ? getFixedSetPositionOption(effectiveLocks.fixedSetPositionId, fixedCompositionSet.id)
    : getFixedSetPositionOption('none');
  const fixedSetCaptureMode = fixedCompositionSet
    ? getFixedSetCaptureModeOption(effectiveLocks.fixedSetCaptureModeId)
    : getFixedSetCaptureModeOption('photographer-shot');
  const fixedSetPerformanceState = fixedCompositionSet
    ? getFixedSetPerformanceStateOption(effectiveLocks.fixedSetPerformanceStateId)
    : getFixedSetPerformanceStateOption('model-natural');
```

In the `context` object returned by `generateSinglePrompt`, add:

```js
    fixedCompositionSet,
    fixedSetPosition,
    fixedSetCaptureMode,
    fixedSetPerformanceState,
```

- [ ] **Step 5: Add selection snapshot fields**

In `buildSelectionSnapshot`, add these fields after `importedWorldSceneArchitectureText`:

```js
    fixedCompositionSetId: context.fixedCompositionSet?.id || 'none',
    fixedSetPositionId: context.fixedSetPosition?.id || 'none',
    fixedSetCaptureModeId: context.fixedSetCaptureMode?.id || 'photographer-shot',
    fixedSetPerformanceStateId: context.fixedSetPerformanceState?.id || 'model-natural',
```

- [ ] **Step 6: Run the fixed-set test and observe remaining prompt failures**

Run:

```bash
cd webapp
node --test src/lib/engineFixedCompositionSet.test.js
```

Expected: the first control-exposure test should pass, but prompt-output assertions should still fail because structured prompt output has not been wired yet.

### Task 3: Wire Fixed Sets Into Gpt, Grok/Z-Image, And AI Prompt Output

**Files:**
- Modify: `webapp/src/lib/engine.js`
- Test: `webapp/src/lib/engineFixedCompositionSet.test.js`
- Test: `webapp/src/lib/enginePromptPipeline.test.js`

- [ ] **Step 1: Add fixed-set derived state in `buildStructuredGrokPrompt`**

Inside `buildStructuredGrokPrompt`, after `const skeletonMode = isSkeletonSubject(context.subject);`, add:

```js
  const fixedCompositionSetActive = isFixedCompositionSetActive(context.fixedCompositionSet);
  const fixedSetSelfShotMode = fixedCompositionSetActive && isFixedSetSelfShotMode(context.fixedSetCaptureMode);
```

- [ ] **Step 2: Add fixed-set scene line builder**

Inside `buildStructuredGrokPrompt`, add this function immediately after the closing brace of `buildGrokScenePriorityText`:

```js
  const addFixedCompositionSetLines = () => {
    if (!fixedCompositionSetActive) return;
    addContextLine('Fixed Composition Set', context.fixedCompositionSet, (item) => skeletonText(item.en));
    addContextLine('Fixed Set Position', context.fixedSetPosition, (item) => skeletonText(item.en));
    addContextLine('Fixed Set Capture Mode', context.fixedSetCaptureMode, (item) => skeletonText(item.en));
    addContextLine('Fixed Set Performance State', context.fixedSetPerformanceState, (item) => skeletonText(item.en));
  };
```

- [ ] **Step 3: Keep regular scene lines from competing with fixed set lines**

In `buildStructuredGrokPrompt`, replace:

```js
  if (sceneProtectedWardrobeMode) addGrokSceneLines();
```

with:

```js
  if (fixedCompositionSetActive) {
    addFixedCompositionSetLines();
  } else if (sceneProtectedWardrobeMode) {
    addGrokSceneLines();
  }
```

Then replace:

```js
  if (!sceneProtectedWardrobeMode) {
    addGrokSceneLines();
  }
```

with:

```js
  if (!fixedCompositionSetActive && !sceneProtectedWardrobeMode) {
    addGrokSceneLines();
  }
```

- [ ] **Step 4: Suppress normal camera geometry lines when fixed set mode is active**

In `buildStructuredGrokPrompt`, replace the final camera lines:

```js
  addLine('Aspect Ratio', context.aspectRatio.en);
  if (context.style && !isNoneLikeItem(context.style)) {
    addLine('Photography Style', skeletonText(buildPhotographyStylePrompt(context.style)));
  }
  addLine('Framing', buildGrokFramingText());
  addLine('Composition Priority', buildGrokCompositionPriorityText());
  addContextLine('Angle', context.angle, (item) => skeletonText(resolvePromptVariant(item, 'angle', context.subject.count)));
  addContextLine('Orbit Angle', context.orbit, (item) => skeletonText(resolvePromptVariant(item, 'orbit', context.subject.count)));
  addContextLine('Lens', context.lens);
  addContextLine('Optical Effect', context.opticalEffect, (item) => skeletonText(item.en));
  addContextLine('Camera / Film', film, (item) => skeletonText(item.en));
```

with:

```js
  addLine('Aspect Ratio', context.aspectRatio.en);
  if (context.style && !isNoneLikeItem(context.style)) {
    addLine('Photography Style', skeletonText(buildPhotographyStylePrompt(context.style)));
  }
  if (!fixedCompositionSetActive) {
    addLine('Framing', buildGrokFramingText());
    addLine('Composition Priority', buildGrokCompositionPriorityText());
    addContextLine('Angle', context.angle, (item) => skeletonText(resolvePromptVariant(item, 'angle', context.subject.count)));
    addContextLine('Orbit Angle', context.orbit, (item) => skeletonText(resolvePromptVariant(item, 'orbit', context.subject.count)));
    addContextLine('Lens', context.lens);
    addContextLine('Optical Effect', context.opticalEffect, (item) => skeletonText(item.en));
  } else if (fixedSetSelfShotMode) {
    addLine('Composition Priority', 'allow imperfect self-shot framing, partial subject crop, close-lens body proximity, and incomplete set visibility when it makes the social snapshot feel real');
  }
  addContextLine('Camera / Film', film, (item) => skeletonText(item.en));
```

- [ ] **Step 5: Relax wardrobe and composition guards in self-shot mode**

In `buildStructuredGrokPrompt`, replace:

```js
  const buildGrokWardrobeIntegrityText = () => (
    'preserve the selected wardrobe as complete, realistic clothing with natural fabric texture, folds, and construction'
  );
```

with:

```js
  const buildGrokWardrobeIntegrityText = () => (
    fixedSetSelfShotMode
      ? 'preserve selected wardrobe identity through visible clothing fragments, fabric color, neckline, shoulder, torso, or local detail when the self-shot crop allows'
      : 'preserve the selected wardrobe as complete, realistic clothing with natural fabric texture, folds, and construction'
  );
```

In `buildGrokCompositionPriorityText`, add this branch at the top of the function body:

```js
    if (fixedSetSelfShotMode) {
      return 'allow self-shot imperfection: partial face or half-body crop, off-center framing, close-lens proximity, imperfect focus, and incomplete fixed-set visibility are acceptable';
    }
```

- [ ] **Step 6: Add fixed-set labels to section sources**

In `buildPromptSectionSources`, prepend these labels to `sceneValues`:

```js
    'Fixed Composition Set',
    'Fixed Set Position',
    'Fixed Set Capture Mode',
    'Fixed Set Performance State',
```

The full `sceneValues` label list should begin:

```js
  const sceneValues = getStructuredValues(valuesByLabel, [
    'Fixed Composition Set',
    'Fixed Set Position',
    'Fixed Set Capture Mode',
    'Fixed Set Performance State',
    'World Scene Architecture',
    'Location',
    'Scene Accent',
    'Scene Context',
    'Scene Priority',
  ]);
```

- [ ] **Step 7: Add fixed set language to `buildZImagePrompt`**

Inside `buildZImagePrompt`, after `const skeletonMode = isSkeletonSubject(context.subject);`, add:

```js
  const fixedCompositionSetActive = isFixedCompositionSetActive(context.fixedCompositionSet);
  const fixedSetSelfShotMode = fixedCompositionSetActive && isFixedSetSelfShotMode(context.fixedSetCaptureMode);
```

At the start of `buildSceneText`, before `if (isCloseupVisibility) {`, add:

```js
    if (fixedCompositionSetActive) {
      return leadSentence('The portrait uses', [
        skeletonMode ? sanitizeSkeletonPromptText(context.fixedCompositionSet.en) : context.fixedCompositionSet.en,
        context.fixedSetPosition && !isNoneLikeItem(context.fixedSetPosition) ? (skeletonMode ? sanitizeSkeletonPromptText(context.fixedSetPosition.en) : context.fixedSetPosition.en) : '',
        context.fixedSetCaptureMode ? (skeletonMode ? sanitizeSkeletonPromptText(context.fixedSetCaptureMode.en) : context.fixedSetCaptureMode.en) : '',
        context.fixedSetPerformanceState ? (skeletonMode ? sanitizeSkeletonPromptText(context.fixedSetPerformanceState.en) : context.fixedSetPerformanceState.en) : '',
        context.lighting && !isNoneLikeItem(context.lighting) ? (skeletonMode ? sanitizeSkeletonPromptText(context.lighting.en) : context.lighting.en) : '',
        lightDirection && !isNoneLikeItem(lightDirection) ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count)) : resolvePromptVariant(lightDirection, 'lightDirection', context.subject.count)) : '',
      ]);
    }
```

In `buildCameraText`, return only set-owned composition plus optional aspect ratio when fixed set mode is active:

```js
  const buildCameraText = () => {
    if (fixedCompositionSetActive) {
      return leadSentence('The fixed set owns the camera geometry, using', [
        context.aspectRatio.en ? `aspect ratio ${context.aspectRatio.en}` : '',
      ]);
    }

    return leadSentence('The composition uses', [
      context.framing ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(context.framing, 'framing', context.subject.count)) : resolvePromptVariant(context.framing, 'framing', context.subject.count)) : '',
      context.angle ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(context.angle, 'angle', context.subject.count)) : resolvePromptVariant(context.angle, 'angle', context.subject.count)) : '',
      context.orbit ? (skeletonMode ? sanitizeSkeletonPromptText(resolvePromptVariant(context.orbit, 'orbit', context.subject.count)) : resolvePromptVariant(context.orbit, 'orbit', context.subject.count)) : '',
      context.lens?.en,
      skeletonMode ? sanitizeSkeletonPromptText(opticalEffect?.en) : opticalEffect?.en,
      context.aspectRatio.en ? `aspect ratio ${context.aspectRatio.en}` : '',
    ]);
  };
```

- [ ] **Step 8: Run fixed composition and prompt pipeline tests**

Run:

```bash
cd webapp
node --test src/lib/engineFixedCompositionSet.test.js
node --test src/lib/enginePromptPipeline.test.js
```

Expected: PASS.

- [ ] **Step 9: Commit engine prompt support**

```bash
git add webapp/src/lib/engine.js webapp/src/lib/engineFixedCompositionSet.test.js
git commit -m "feat: add fixed composition prompt mode"
```

### Task 4: Add PAGE1 UI Filtering And Lock Clearing

**Files:**
- Modify: `webapp/src/components/Page1Workspace.jsx`
- Modify: `webapp/src/App.jsx`
- Test: `webapp/src/lib/engineFixedCompositionSet.test.js`

- [ ] **Step 1: Add fixed-set key constants to `Page1Workspace.jsx`**

After the Pose Composer constants near the top of `Page1Workspace.jsx`, add:

```js
const FIXED_SET_KEYS = ['fixedCompositionSetId', 'fixedSetPositionId', 'fixedSetCaptureModeId', 'fixedSetPerformanceStateId'];
const FIXED_SET_LOCKED_KEYS = [
  'sceneAttributeId',
  'locationId',
  'aspectRatio',
  'framingId',
  'angleId',
  'orbitId',
  'lensId',
  'opticalEffectId',
];
```

- [ ] **Step 2: Add a fixed-set scene subpanel**

In `SECTION_SUBPANELS.scene`, insert this panel before `space`:

```js
    {
      id: 'fixed',
      label: '固定構圖場景',
      description: '選擇固定場景、場景內人物位置、拍攝型態與演出狀態；啟用後會接管普通場景與鏡頭幾何。',
      keys: ['fixedCompositionSetId', 'fixedSetPositionId', 'fixedSetCaptureModeId', 'fixedSetPerformanceStateId'],
    },
```

- [ ] **Step 3: Track active fixed set state**

After this existing line:

```js
  const importedWorldSceneActive = locks.importedWorldSceneMode === 'architecture' && Boolean(locks.importedWorldSceneArchitectureText);
```

add:

```js
  const fixedCompositionSetActive = Boolean(locks.fixedCompositionSetId) && !isNoneSelected('fixedCompositionSetId', locks.fixedCompositionSetId, lockControls);
  const selectedFixedCompositionSetId = fixedCompositionSetActive ? locks.fixedCompositionSetId : '';
```

Add `fixedCompositionSetActive ? '固定構圖場景' : ''` to `currentModeBadges`.

In `sectionDiagnostics.scene.chips`, add:

```js
        fixedCompositionSetActive ? '固定構圖場景' : '',
```

In `sectionDiagnostics.photography.chips`, add:

```js
        fixedCompositionSetActive ? '固定場景接管構圖' : '',
```

- [ ] **Step 4: Filter set-specific position options**

Add this function near `buildPoseComposerControl`:

```js
  const buildFixedSetControl = (control) => {
    if (control.key !== 'fixedSetPositionId') return control;
    return {
      ...control,
      options: control.options.filter((option) => option.id === 'none' || option.setId === selectedFixedCompositionSetId),
    };
  };
```

In `renderControlGrid`, replace the control mapping line:

```js
      {controls.map((rawControl) => {
        const control = buildPoseComposerControl(rawControl);
```

with:

```js
      {controls.map((rawControl) => {
        const control = buildFixedSetControl(buildPoseComposerControl(rawControl));
```

- [ ] **Step 5: Disable controls that fixed set mode owns**

In `isControlDisabled`, add these conditions before wardrobe conditions:

```js
    || (FIXED_SET_KEYS.includes(control.key) && locks.subjectCount === '2')
    || (fixedCompositionSetActive && FIXED_SET_LOCKED_KEYS.includes(control.key))
```

- [ ] **Step 6: Clear conflicting locks when fixed set mode changes**

In `applyControlValue`, after `const next = { ...prev, [control.key]: value };`, add:

```js
      if (control.key === 'fixedCompositionSetId') {
        const nextFixedSetActive = Boolean(value) && !isNoneSelected('fixedCompositionSetId', value, lockControls);
        if (nextFixedSetActive) {
          next.sceneAttributeId = '';
          next.locationId = '';
          next.importedWorldSceneMode = 'none';
          next.importedWorldSceneLabel = '';
          next.importedWorldSceneArchitectureText = '';
          ['framingId', 'angleId', 'orbitId', 'lensId', 'opticalEffectId'].forEach((key) => {
            const noneOption = lockControls.find((item) => item.key === key)?.options?.find((option) => option.zh === '全無');
            next[key] = noneOption?.id || '';
          });
          const fixedSetOption = lockControls.find((item) => item.key === 'fixedCompositionSetId')?.options?.find((option) => option.id === value);
          next.aspectRatio = fixedSetOption?.aspectRatioId || next.aspectRatio;
        } else {
          next.fixedSetPositionId = 'none';
          next.fixedSetCaptureModeId = 'photographer-shot';
          next.fixedSetPerformanceStateId = 'model-natural';
        }
      }
      if (control.key === 'fixedSetPositionId') {
        const selectedPosition = lockControls.find((item) => item.key === 'fixedSetPositionId')?.options?.find((option) => option.id === value);
        if (selectedPosition?.setId && selectedPosition.setId !== prev.fixedCompositionSetId) {
          next.fixedSetPositionId = 'none';
        }
      }
```

Replace the existing `locationId` clearing block:

```js
      if (control.key === 'locationId' && value) {
        next.importedWorldSceneMode = 'none';
        next.importedWorldSceneLabel = '';
        next.importedWorldSceneArchitectureText = '';
      }
```

with:

```js
      if (control.key === 'locationId' && value) {
        next.importedWorldSceneMode = 'none';
        next.importedWorldSceneLabel = '';
        next.importedWorldSceneArchitectureText = '';
        next.fixedCompositionSetId = 'none';
        next.fixedSetPositionId = 'none';
        next.fixedSetCaptureModeId = 'photographer-shot';
        next.fixedSetPerformanceStateId = 'model-natural';
      }
```

- [ ] **Step 7: Clear fixed set mode when applying PAGE3 architecture**

In `App.jsx`, update `handleApplyPage3WorldSceneArchitecture` so the `updateLocks` object includes:

```js
      fixedCompositionSetId: 'none',
      fixedSetPositionId: 'none',
      fixedSetCaptureModeId: 'photographer-shot',
      fixedSetPerformanceStateId: 'model-natural',
```

The full object should be:

```js
    updateLocks((prev) => ({
      ...prev,
      locationId: '',
      fixedCompositionSetId: 'none',
      fixedSetPositionId: 'none',
      fixedSetCaptureModeId: 'photographer-shot',
      fixedSetPerformanceStateId: 'model-natural',
      importedWorldSceneMode: 'architecture',
      importedWorldSceneLabel: architecture.label,
      importedWorldSceneArchitectureText: architecture.text,
    }));
```

- [ ] **Step 8: Run targeted tests and build for UI syntax**

Run:

```bash
cd webapp
node --test src/lib/engineFixedCompositionSet.test.js
npm run build
```

Expected: tests pass and build passes with only the existing Vite chunk-size warning.

- [ ] **Step 9: Commit PAGE1 UI fixed-set controls**

```bash
git add webapp/src/components/Page1Workspace.jsx webapp/src/App.jsx
git commit -m "feat: expose fixed composition controls"
```

### Task 5: Add Summary And Restore Coverage

**Files:**
- Modify: `webapp/src/lib/page1WorkspaceSummary.test.js`
- Modify: `webapp/src/lib/page1WorkspaceSummary.js`
- Modify: `webapp/src/lib/engine.js`
- Modify: `webapp/src/App.jsx`

- [ ] **Step 1: Add workspace summary tests**

Append these tests to `webapp/src/lib/page1WorkspaceSummary.test.js`:

```js
test('workspace scene summary includes fixed composition set controls', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '復古磁磚浴室浴缸'),
    fixedSetPositionId: optionId('fixedSetPositionId', '低角度浴缸前景'),
    fixedSetCaptureModeId: optionId('fixedSetCaptureModeId', '失控自拍感'),
    fixedSetPerformanceStateId: optionId('fixedSetPerformanceStateId', '慵懶無力感'),
  }, controls);

  assert.match(summary.scene.summary, /復古磁磚浴室浴缸/);
  assert.match(summary.scene.summary, /低角度浴缸前景/);
  assert.match(summary.scene.summary, /失控自拍感/);
  assert.match(summary.scene.summary, /慵懶無力感/);
});

test('fixed composition set aspect ratio remains visible in photography summary', () => {
  const summary = buildWorkspaceSummary({
    ...createEmptyLocks(),
    fixedCompositionSetId: optionId('fixedCompositionSetId', '清水模牆面沙發棚'),
    aspectRatio: optionId('aspectRatio', '16:9 寬螢幕'),
    styleId: optionId('styleId', 'Daido Moriyama（森山大道）'),
    filmId: optionId('filmId', '高銳利快照黑位'),
  }, controls);

  assert.match(summary.scene.summary, /清水模牆面沙發棚/);
  assert.match(summary.photography.summary, /16:9/);
  assert.match(summary.photography.summary, /Daido Moriyama/);
  assert.match(summary.photography.summary, /高銳利快照黑位/);
});
```

- [ ] **Step 2: Run summary tests to verify they fail**

Run:

```bash
cd webapp
node --test src/lib/page1WorkspaceSummary.test.js
```

Expected: FAIL because fixed-set fields are not included in workspace summary yet.

- [ ] **Step 3: Update workspace summary scene section**

In `buildWorkspaceSummary` inside `page1WorkspaceSummary.js`, update `sceneSummary` so it includes fixed-set labels before normal scene labels:

```js
  const sceneSummary = buildSummaryText([
    getControlOptionLabel(controls, 'sceneAttributeId', locks.sceneAttributeId),
    importedWorldSceneLabel,
    getControlOptionLabel(controls, 'fixedCompositionSetId', locks.fixedCompositionSetId),
    getControlOptionLabel(controls, 'fixedSetPositionId', locks.fixedSetPositionId),
    getControlOptionLabel(controls, 'fixedSetCaptureModeId', locks.fixedSetCaptureModeId),
    getControlOptionLabel(controls, 'fixedSetPerformanceStateId', locks.fixedSetPerformanceStateId),
    getControlOptionLabel(controls, 'locationId', locks.locationId),
    getControlOptionLabel(controls, 'lightingId', locks.lightingId),
    getControlOptionLabel(controls, 'lightDirectionId', locks.lightDirectionId),
  ]);
```

- [ ] **Step 4: Update engine summary fields**

In `buildSummaryFields` inside `engine.js`, replace `locationLabel` with fixed-set-aware labels:

```js
  const fixedSetSummaryLabel = context.fixedCompositionSet && !isNoneLikeItem(context.fixedCompositionSet)
    ? joinSummaryParts(
        context.fixedCompositionSet.zh,
        context.fixedSetPosition && !isNoneLikeItem(context.fixedSetPosition) ? context.fixedSetPosition.zh : '',
        context.fixedSetCaptureMode?.zh || '',
        context.fixedSetPerformanceState?.zh || ''
      )
    : '';
  const locationLabel = fixedSetSummaryLabel && fixedSetSummaryLabel !== '-'
    ? fixedSetSummaryLabel
    : importedWorldSceneLabel
    ? `PAGE3：${importedWorldSceneLabel}`
    : context.location && !isNoneLikeItem(context.location) ? context.location.zh : '-';
```

- [ ] **Step 5: Include fixed set fields in imported structured display**

In `App.jsx`, inside `buildImportedStructured(locks, controls)`, replace:

```js
    Location: buildSection(['sceneAttributeId', 'locationId']),
```

with:

```js
    Location: buildSection([
      'sceneAttributeId',
      'fixedCompositionSetId',
      'fixedSetPositionId',
      'fixedSetCaptureModeId',
      'fixedSetPerformanceStateId',
      'locationId',
    ]),
```

- [ ] **Step 6: Run summary and fixed-set tests**

Run:

```bash
cd webapp
node --test src/lib/page1WorkspaceSummary.test.js
node --test src/lib/engineFixedCompositionSet.test.js
```

Expected: PASS.

- [ ] **Step 7: Commit summary and restore display support**

```bash
git add webapp/src/lib/page1WorkspaceSummary.test.js webapp/src/lib/page1WorkspaceSummary.js webapp/src/lib/engine.js webapp/src/App.jsx
git commit -m "feat: summarize fixed composition selections"
```

### Task 6: Full Verification

**Files:**
- Verify all changed files

- [ ] **Step 1: Run targeted tests**

Run:

```bash
cd webapp
node --test src/lib/engineFixedCompositionSet.test.js
node --test src/lib/enginePromptPipeline.test.js
node --test src/lib/engineGrokScenePriority.test.js
node --test src/lib/page1WorkspaceSummary.test.js
node --test src/lib/page1SectionRandom.test.js
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run:

```bash
cd webapp
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Run lint**

Run:

```bash
cd webapp
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Run production build**

Run:

```bash
cd webapp
npm run build
```

Expected: PASS with the existing Vite chunk-size warning allowed.

- [ ] **Step 5: Check whitespace**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 6: Inspect final diff**

Run:

```bash
git status --short
git diff --stat
```

Expected changed implementation files:

```text
webapp/src/lib/engine.js
webapp/src/lib/engineFixedCompositionSet.test.js
webapp/src/components/Page1Workspace.jsx
webapp/src/App.jsx
webapp/src/lib/page1WorkspaceSummary.js
webapp/src/lib/page1WorkspaceSummary.test.js
```

No knowledge base markdown or `webapp/src/data/database.json` changes should appear in V1.

- [ ] **Step 7: Commit verified implementation**

If Task 6 found no further changes, this commit step is not needed because earlier tasks already committed. If Task 6 required fixes, commit only those fixes:

```bash
git add webapp/src/lib/engine.js webapp/src/lib/engineFixedCompositionSet.test.js webapp/src/components/Page1Workspace.jsx webapp/src/App.jsx webapp/src/lib/page1WorkspaceSummary.js webapp/src/lib/page1WorkspaceSummary.test.js
git commit -m "fix: verify fixed composition set flow"
```
