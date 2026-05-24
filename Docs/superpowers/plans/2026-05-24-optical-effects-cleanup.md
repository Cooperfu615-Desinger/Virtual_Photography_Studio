# Optical Effects Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean `光學效果 (Optical Effects)` prompts so they describe lens, filter, focus-plane, and imaging artifacts without scene, mood, or lighting-story drift.

**Architecture:** Keep the existing category and option ids unchanged. Rewrite only the optical-effect rows in `knowledge_base/camera_and_lighting.md`, enrich `inferEffectMeta()` with specific optical tags, sync `CameraLighting` into `webapp/src/data/database.json`, and verify catalog/test/build stability.

**Tech Stack:** Markdown knowledge base, JavaScript prompt engine metadata, Python sync script, JSON database, Node.js tests, Vite build.

---

### Task 1: Clean Optical Effect Rows

**Files:**
- Modify: `knowledge_base/camera_and_lighting.md`

- [x] **Step 1: Rewrite optical-effect prompts**

Replace rows `淺景深` through `光學朦朧薄霧` with optics-only wording. Preserve option names and category names.

- [x] **Step 2: Remove scene and mood drift**

Verify the rewritten rows avoid scene types, story mood, cinematic/narrative adjectives, and environmental weather cues. Keep optical terms such as depth of field, bokeh, flare, light leak, diffusion, bloom, vignette, chromatic aberration, field curvature, and veiling glare.

### Task 2: Enrich Optical Metadata

**Files:**
- Modify: `webapp/src/lib/engine.js`

- [x] **Step 1: Update `inferEffectMeta()` tags**

Add specific tags for `depth_of_field`, `foreground_occlusion`, `light_artifact`, `anamorphic_artifact`, `analog_artifact`, `soft_focus`, `bloom`, `vignette`, `chromatic_aberration`, `edge_blur`, and `optical_haze`.

### Task 3: Sync And Validate

**Files:**
- Modify: `webapp/src/data/database.json`

- [x] **Step 1: Run markdown sync**

Run:

```bash
python3 scripts/sync_to_json.py
```

- [x] **Step 2: Merge only `CameraLighting` into database**

Use the existing section-only merge pattern so unrelated dictionaries are not changed.

- [x] **Step 3: Verify catalog and tests**

Run:

```bash
node --input-type=module -e "import { getLockControls } from './webapp/src/lib/engine.js'; const effects = getLockControls().find((control) => control.key === 'opticalEffectId'); console.log(effects.options.length); console.log(effects.options.map((item) => item.zh).join(' | '));"
npm test
npm run lint
npm run build
```

Expected: optical-effect count remains `14`; tests, lint, and build pass. Existing Vite chunk-size warning is acceptable.

### Task 4: Review And Commit

**Files:**
- Modify: `Docs/superpowers/plans/2026-05-24-optical-effects-cleanup.md`

- [x] **Step 1: Check diff**

Run:

```bash
git diff --check -- knowledge_base/camera_and_lighting.md webapp/src/lib/engine.js webapp/src/data/database.json Docs/superpowers/plans/2026-05-24-optical-effects-cleanup.md
```

- [x] **Step 2: Commit scoped changes**

Run:

```bash
git add knowledge_base/camera_and_lighting.md webapp/src/lib/engine.js webapp/src/data/database.json Docs/superpowers/plans/2026-05-24-optical-effects-cleanup.md
git commit -m "Clean optical effects prompt wording"
```

Expected: commit succeeds. Existing dirty `Docs/conversation_handoff.md` remains unstaged.
