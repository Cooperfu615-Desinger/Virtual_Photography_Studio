# Film Camera Simulation Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean the Camera & Film Simulation options so they describe image rendering only, without forcing scenes, activities, or narrative themes.

**Architecture:** The source of truth is `knowledge_base/camera_and_lighting.md`. After editing the Markdown table, run the existing sync script and merge only the `CameraLighting` section into `webapp/src/data/database.json` to avoid unrelated database churn.

**Tech Stack:** Markdown knowledge base, Python sync script, JSON database, Vite/React validation scripts.

---

### Task 1: Clean Film And Camera Simulation Copy

**Files:**
- Modify: `knowledge_base/camera_and_lighting.md:113-127`
- Modify: `webapp/src/data/database.json`

- [x] **Step 1: Rewrite the Camera & Film Simulation rows**

Replace scene-leading phrases such as `適合街拍`, `適合旅行`, `城市`, `咖啡館`, `生活敘事`, and `電影氣質` with rendering-specific language: color response, contrast curve, grain/noise, highlight roll-off, shadow tint, sharpness, dynamic range, and degradation artifacts.

- [x] **Step 2: Preserve option identity**

Keep the existing option names and recognizable camera/film stock anchors: Polaroid SX-70, Kodak Portra 400, Fujifilm Superia 400, Leica, Fujifilm Classic Chrome, Fujifilm Provia, Leica Monochrom, Contax Zeiss, Canon, Nikon, Ricoh GR, Hasselblad medium format, and VHS.

- [x] **Step 3: Sync the database**

Run:

```bash
python3 scripts/sync_to_json.py
```

Expected: `webapp/src/data/database.json` is regenerated.

- [x] **Step 4: Merge only CameraLighting**

Run a JSON merge that copies only `CameraLighting` from the regenerated database into the previous HEAD database, preserving unrelated sections.

- [x] **Step 5: Validate**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('./webapp/src/data/database.json','utf8')); console.log('database json ok')"
cd webapp
npm test
npm run lint
npm run build
```

Expected: JSON parse succeeds and all validation commands pass. The existing Vite chunk-size warning is acceptable.
