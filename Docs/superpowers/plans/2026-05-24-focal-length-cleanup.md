# Focal Length Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean `鏡頭焦段 (Focal Length)` prompts so they describe optical perspective, compression, distortion, working distance, and subject/background separation without scene, mood, or narrative hints.

**Architecture:** Keep the existing category and option ids unchanged. Edit only the focal-length rows in `knowledge_base/camera_and_lighting.md`, sync `CameraLighting` into `webapp/src/data/database.json`, and verify the generated catalog still parses and exposes the same lens controls.

**Tech Stack:** Markdown knowledge base, Python sync script, JSON database, Node.js tests, Vite build.

---

### Task 1: Clean Focal Length Rows

**Files:**
- Modify: `knowledge_base/camera_and_lighting.md`

- [x] **Step 1: Rewrite all focal-length prompts**

Replace rows `20mm 超廣角` through `變形寬銀幕鏡頭 Anamorphic` with lens-only wording. Preserve option names and category names.

- [x] **Step 2: Ensure wording stays in the optical lane**

Verify the rewritten rows focus on field of view, perspective, compression, distortion, focus plane, and magnification. Avoid scene types such as street, travel, studio, road, night, or fashion.

### Task 2: Sync And Validate

**Files:**
- Modify: `webapp/src/data/database.json`
- Modify: `webapp/src/lib/engineLightingCompatibility.test.js`

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
node --input-type=module -e "import { getLockControls } from './webapp/src/lib/engine.js'; const lens = getLockControls().find((control) => control.key === 'lensId'); console.log(lens.options.length); console.log(lens.options.map((item) => item.zh).join(' | '));"
npm test
npm run lint
npm run build
```

Expected: lens count remains `13`; tests, lint, and build pass. Existing Vite chunk-size warning is acceptable.

### Task 3: Review And Commit

**Files:**
- Modify: `Docs/superpowers/plans/2026-05-24-focal-length-cleanup.md`

- [x] **Step 1: Check diff**

Run:

```bash
git diff --check -- knowledge_base/camera_and_lighting.md webapp/src/data/database.json webapp/src/lib/engineLightingCompatibility.test.js Docs/superpowers/plans/2026-05-24-focal-length-cleanup.md
```

- [x] **Step 2: Commit scoped changes**

Run:

```bash
git add knowledge_base/camera_and_lighting.md webapp/src/data/database.json webapp/src/lib/engineLightingCompatibility.test.js Docs/superpowers/plans/2026-05-24-focal-length-cleanup.md
git commit -m "Clean focal length prompt wording"
```

Expected: commit succeeds. Existing dirty `Docs/conversation_handoff.md` remains unstaged.
