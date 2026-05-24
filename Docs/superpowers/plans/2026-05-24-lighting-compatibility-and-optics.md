# Lighting Compatibility And Optics Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten ambient-light, subject-light, and optical-effect boundaries so generated prompts keep scene conditions, subject lighting, and camera optics in their proper lanes.

**Architecture:** Add runtime ambient scope tags for indoor, outdoor, and studio light conditions, then centralize ambient-to-subject-light compatibility in the prompt engine. Keep optical effects in the camera/photography area by updating summary composition and tests; the existing structured prompt already places `Optical Effect` under camera.

**Tech Stack:** JavaScript prompt engine, Node test runner, Markdown knowledge base sync only if source dictionaries change.

---

### Task 1: Add Lighting Compatibility Tests

**Files:**
- Create: `webapp/src/lib/engineLightingCompatibility.test.js`

- [x] **Step 1: Add tests for scene scope, ambient pairing, and optical summary placement**

Create `webapp/src/lib/engineLightingCompatibility.test.js` with tests that:

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, getSceneDependentOptions } from './engine.js';

function optionId(controlKey, zh) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  const option = control?.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

function optionNames(options) {
  return options.map((entry) => entry.zh);
}
```

The tests should verify:
- Indoor scene attribute excludes outdoor ambient options like `晴朗白日` and `夜晚街燈`.
- Outdoor scene attribute excludes indoor/studio options like `室內窗邊日光` and `高調純白攝影棚`.
- `雨天陰濕` hides `硬質晴光` even when no location is selected.
- `高調純白攝影棚` hides outdoor/natural subject-light options like `斑駁樹影光`.
- Prompt summary puts `霧化高光 Bloom` in `鏡頭：...` and keeps `光影：...` for `環境光條件 / 光線表現`.

- [x] **Step 2: Run the new test and confirm it fails before implementation**

Run:

```bash
npm test -- src/lib/engineLightingCompatibility.test.js
```

Expected: at least one assertion fails before engine changes.

### Task 2: Implement Ambient Scope And Pairing Rules

**Files:**
- Modify: `webapp/src/lib/engine.js`

- [x] **Step 1: Tag ambient light entries by scope**

In `inferLightingMeta()`, after environment-category inference, append:

```js
if (isEnvironmentCategory && !isNoneLikeItem(item)) {
  if (/(攝影棚|舞台)/.test(item.zh || '')) {
    tags.push('ambient_studio', 'ambient_indoor');
  } else if (String(item.zh || '').startsWith('室內')) {
    tags.push('ambient_indoor');
  } else {
    tags.push('ambient_outdoor');
  }
}
```

- [x] **Step 2: Respect explicit ambient scope in `getLightingEnvironmentFlags()`**

Use `ambient_outdoor`, `ambient_indoor`, and `ambient_studio` before broader support tags so outdoor night conditions do not leak into indoor-only filters.

- [x] **Step 3: Add subject-light tags needed for pair rules**

Add lightweight tags such as `high_key_subject`, `hard_direct_sun`, `night_subject`, `window_projection`, and `dappled_subject_light` to the relevant `光線表現` inference branches.

- [x] **Step 4: Split ambient pairing from location pairing**

Create `lightDirectionSupportsAmbientLight(lightDirection, lighting)` and call it from `lightDirectionSupportsScene()`. Also call `lightDirectionSupportsScene()` from `getSceneDependentOptions()` even when `location` is null so ambient-pair filtering works before a location is selected.

### Task 3: Move Optical Summary Back To Photography

**Files:**
- Modify: `webapp/src/lib/engine.js`

- [x] **Step 1: Keep selected subject light in `context`**

Add `lightDirection` to the generated prompt context object.

- [x] **Step 2: Update summary fields**

Change summary fields so:

```js
camera: joinSummaryParts(cameraSystemLabel, framingLabel, angleLabel, orbitLabel, lensLabel, opticalEffectLabel, aspectRatioLabel),
lighting: joinSummaryParts(lightingLabel, lightDirectionLabel),
```

Expected: `光學效果` no longer appears in the `光影` summary.

### Task 4: Validate And Commit

**Files:**
- Modify: `Docs/superpowers/plans/2026-05-24-lighting-compatibility-and-optics.md`

- [x] **Step 1: Run targeted and full validation**

Run:

```bash
npm test -- src/lib/engineLightingCompatibility.test.js
npm test
npm run lint
npm run build
```

Expected: tests pass, lint passes, build passes. Existing Vite chunk warning is acceptable.

- [x] **Step 2: Review and commit**

Run:

```bash
git diff --check -- webapp/src/lib/engine.js webapp/src/lib/engineLightingCompatibility.test.js Docs/superpowers/plans/2026-05-24-lighting-compatibility-and-optics.md
git add webapp/src/lib/engine.js webapp/src/lib/engineLightingCompatibility.test.js Docs/superpowers/plans/2026-05-24-lighting-compatibility-and-optics.md
git commit -m "Refine lighting compatibility rules"
```

Expected: commit succeeds. Existing dirty `Docs/conversation_handoff.md` remains unstaged.
