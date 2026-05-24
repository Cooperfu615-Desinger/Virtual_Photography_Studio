# Photography Imaging Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize PAGE1 section D into a clearer photography flow: photographer style, composition/viewpoint, lens/optics, and imaging simulation, while merging visible camera equipment choices into imaging simulation.

**Architecture:** Keep existing lock compatibility by preserving `cameraSystemId` as a hidden legacy field. The visible UI should use `filmId` as the single imaging simulation control, with camera-profile options merged into the existing film/rendering catalog. Prompt output should use the new ordering and labels without a separate `Camera System` line.

**Tech Stack:** React UI controls, JavaScript prompt engine, Node.js tests, Vite build.

---

### Task 1: Restructure D UI Panels

**Files:**
- Modify: `webapp/src/components/Page1Workspace.jsx`

- [x] **Step 1: Split D into four subpanels**

Use these PAGE1 D panels:

```text
攝影風格: styleId
構圖與視角: framingId, angleId, orbitId
鏡頭與光學: lensId, opticalEffectId
成像模擬: filmId
```

- [x] **Step 2: Update summaries and chips**

Remove visible `cameraSystemId` references from the D summary and chips. Use `filmId` for the imaging chip.

### Task 2: Merge Camera Equipment Into Imaging Simulation

**Files:**
- Modify: `webapp/src/lib/engine.js`

- [x] **Step 1: Keep `cameraSystemId` hidden for compatibility**

Change the visible lock model so `cameraSystemId` is no longer in the D UI or partial reroll list, but remains accepted by `normalizeLocks()`.

- [x] **Step 2: Add camera-profile options to `filmId`**

Merge cleaned camera-profile options into the `flatCatalog.film` list after `全無` and before existing film/digital rendering rows.

- [x] **Step 3: Normalize legacy camera locks**

When old data has `cameraSystemId` and no `filmId`, copy the camera profile id into `filmId` so old saved cards map into the new imaging simulation control.

### Task 3: Update Prompt Output

**Files:**
- Modify: `webapp/src/lib/engine.js`

- [x] **Step 1: Rename prompt label**

Replace the Grok line `Camera System` and `Film` split with a single `Imaging Simulation` line.

- [x] **Step 2: Reorder photography prompt lines**

Emit photography-related lines in this order:

```text
Photography Style
Framing
Composition Priority
Angle
Orbit Angle
Lens
Optical Effect
Imaging Simulation
```

- [x] **Step 3: Update structured output**

Move `lens` out of `Framing` and create a `Lens & Imaging` group containing lens, optical effect, and imaging simulation.

### Task 4: Update Tests And Validate

**Files:**
- Modify: `webapp/src/lib/engineGrokScenePriority.test.js`
- Modify: `webapp/src/lib/engineLightingCompatibility.test.js`

- [x] **Step 1: Update camera/imaging assertions**

Test the new `filmId` camera-profile path and legacy `cameraSystemId` migration.

- [x] **Step 2: Run validation**

Run:

```bash
node --input-type=module -e "import { getLockControls } from './webapp/src/lib/engine.js'; const film = getLockControls().find((control) => control.key === 'filmId'); console.log(film.label); console.log(film.options.map((item) => item.zh).slice(0, 12).join(' | '));"
cd webapp
npm test
npm run lint
npm run build
```

Expected: `filmId` is labelled `成像模擬`, camera-profile options appear in its options, tests/lint/build pass, and the existing Vite chunk-size warning is acceptable.
