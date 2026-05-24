# Ambient And Subject Lighting Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clarify the lighting model by separating whole-scene ambient light conditions from subject-facing light style.

**Architecture:** Keep the existing two controls and lock keys, but rename the environment-facing control to `環境光條件` and make generated labels use `Ambient Light Conditions`. Preserve backward compatibility for the old `環境光氛 (Environment Mood)` category by supporting both category names and adding legacy ids when entries are rebuilt. Clean `光線表現 (Light Style)` prompts so they only describe how light falls on the subject.

**Tech Stack:** Markdown knowledge base, React UI copy, JavaScript prompt engine, Python markdown sync, Node.js JSON checks, Vite/React validation.

---

### Task 1: Rename Ambient Light Concept With Compatibility

**Files:**
- Modify: `knowledge_base/camera_and_lighting.md`
- Modify: `webapp/src/lib/engine.js`
- Modify: `webapp/src/components/Page1Workspace.jsx`
- Modify: `webapp/src/components/LightingReferenceModal.jsx`
- Modify: `webapp/src/lib/page3WorldScene.js`

- [x] **Step 1: Rename the environment category in Markdown**

Change the category label for rows `全無` through `舞台演出燈光` from:

```text
環境光氛 (Environment Mood)
```

to:

```text
環境光條件 (Ambient Light Conditions)
```

- [x] **Step 2: Update engine constants and generated prompt labels**

Update `webapp/src/lib/engine.js` so:

```js
const AMBIENT_LIGHT_CONDITIONS_CATEGORY = '環境光條件 (Ambient Light Conditions)';
const LEGACY_ENVIRONMENT_MOOD_CATEGORY = '環境光氛 (Environment Mood)';
const ENVIRONMENT_LIGHT_CATEGORIES = [AMBIENT_LIGHT_CONDITIONS_CATEGORY, LEGACY_ENVIRONMENT_MOOD_CATEGORY];
```

Use the new category as the primary `lightingId` category, make `flatCatalog.lighting` read both categories, and change generated section labels from `Environment Mood` to `Ambient Light Conditions`.

- [x] **Step 3: Preserve old saved lock ids**

When `buildEntries()` builds camera entries in the new ambient-light category, add the old environment-mood runtime id as a `legacyId` for each item so `normalizeLocks()` can migrate previously saved selections.

- [x] **Step 4: Update UI copy**

Update visible UI text from `環境光氛` to `環境光條件` where the control is explained. Keep `光線表現` visible, but explain it as subject lighting / 人物受光.

### Task 2: Clean Subject Light Style Prompt Text

**Files:**
- Modify: `knowledge_base/camera_and_lighting.md`

- [x] **Step 1: Clean direction and hardness entries**

Update `柔和順光` through `高調亮光` so each prompt describes light direction, hardness, contrast, rim edges, or shadow behavior on the subject. Remove broad mood words such as `cinematic`, `moody`, `tense`, and `atmospheric`.

- [x] **Step 2: Clean color-temperature and color-cast entries**

Update `暖金黃昏色溫` through `霓虹染色光` so they describe subject light color cast only. Keep guards like `no sunset or sky cues` where helpful.

- [x] **Step 3: Clean projection and reflection entries**

Update `窗格投影光` through `深夜邊緣微光` so they describe projected patterns, bounce, rim, and local practical light on the subject. Remove `intimate`, `cozy`, `sensual`, `cinematic`, and story mood words.

### Task 3: Sync, Validate, And Commit

**Files:**
- Modify: `webapp/src/data/database.json`

- [x] **Step 1: Run markdown-to-JSON sync**

Run:

```bash
python3 scripts/sync_to_json.py
```

Expected: sync exits successfully.

- [x] **Step 2: Merge only synced CameraLighting into current database**

Run:

```bash
node -e "const fs=require('fs'); const current=JSON.parse(fs.readFileSync('webapp/src/data/database.json','utf8')); const cp=require('child_process'); const previous=JSON.parse(cp.execFileSync('git',['show','HEAD:webapp/src/data/database.json'],{encoding:'utf8'})); previous.CameraLighting=current.CameraLighting; fs.writeFileSync('webapp/src/data/database.json', JSON.stringify(previous,null,2)+'\n'); console.log('merged camera lighting into current database');"
```

Expected output includes:

```text
merged camera lighting into current database
```

- [x] **Step 3: Confirm JSON parses and only CameraLighting changed**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('./webapp/src/data/database.json','utf8')); console.log('database json ok')"
node -e "const fs=require('fs'); const cp=require('child_process'); const before=JSON.parse(cp.execFileSync('git',['show','HEAD:webapp/src/data/database.json'],{encoding:'utf8'})); const after=JSON.parse(fs.readFileSync('webapp/src/data/database.json','utf8')); const changed=Object.keys(after).filter(k=>JSON.stringify(after[k])!==JSON.stringify(before[k])); console.log(changed.join('\n'));"
```

Expected output includes `database json ok` and `CameraLighting`.

- [x] **Step 4: Run validation**

Run:

```bash
npm test
npm run lint
npm run build
```

Working directory: `webapp`

Expected: tests pass, lint passes, build passes. The existing Vite chunk-size warning is acceptable.

- [x] **Step 5: Review and commit**

Run:

```bash
git diff --check -- knowledge_base/camera_and_lighting.md webapp/src/lib/engine.js webapp/src/components/Page1Workspace.jsx webapp/src/components/LightingReferenceModal.jsx webapp/src/lib/page3WorldScene.js webapp/src/data/database.json Docs/superpowers/plans/2026-05-24-ambient-subject-lighting-implementation.md
git add knowledge_base/camera_and_lighting.md webapp/src/lib/engine.js webapp/src/components/Page1Workspace.jsx webapp/src/components/LightingReferenceModal.jsx webapp/src/lib/page3WorldScene.js webapp/src/data/database.json Docs/superpowers/plans/2026-05-24-ambient-subject-lighting-implementation.md
git commit -m "Clarify ambient and subject lighting prompts"
```

Expected: commit succeeds. Existing dirty `Docs/conversation_handoff.md` remains unstaged.
