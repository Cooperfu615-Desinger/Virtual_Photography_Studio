# Environment Mood Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean the existing `環境光氛 (Environment Mood)` prompts so they describe concrete environmental conditions rather than abstract emotion, cinematic mood, or scene base content.

**Architecture:** This is a data-only cleanup. Keep the existing UI control, category name, option names, and compatibility tags. Edit `knowledge_base/camera_and_lighting.md`, sync to JSON, then merge only the synced `CameraLighting` section into the current database to avoid unrelated data churn.

**Tech Stack:** Markdown knowledge base, Python sync script, Node.js JSON merge/check commands, Vite/React validation through npm scripts.

---

### Task 1: Clean Existing Environment Mood Rows

**Files:**
- Modify: `knowledge_base/camera_and_lighting.md`

- [x] **Step 1: Clean outdoor sky, time, and weather entries**

Update `晴朗白日` through `冬季灰冷` so English prompts emphasize sky state, cloud mass, time of day, air clarity, rain/snow/wetness, and surface visibility. Remove abstract words such as `mood`, `atmosphere`, `tension`, `oppressive`, `stillness`, `ambience`, `cinematic`, and `dramatic` unless a term is necessary as a compatibility guard.

- [x] **Step 2: Clean indoor ambient-condition entries**

Update `室內窗邊日光` through `室內深夜冷暗微光` so English prompts describe interior brightness, visible exterior state, practical light sources, spill light, color cast, and low/high brightness. Remove `cozy`, `intimate`, `romantic`, `quiet`, `mood`, and broad emotional wording.

- [x] **Step 3: Clean studio-light environment entries**

Update `高調純白攝影棚`, `柔霧美妝攝影棚`, and `舞台演出燈光` so they describe the lighting condition only and do not summon background structures, stage venues, or editorial mood.

- [x] **Step 4: Scan the environment block for residue**

Run:

```bash
sed -n '50,85p' knowledge_base/camera_and_lighting.md
rg -n "mood|atmosphere|cinematic|editorial|romantic|intimate|tension|attitude|ambience|stillness|oppressive|cozy|quiet|dramatic" knowledge_base/camera_and_lighting.md
```

Expected: no matches in the `環境光氛` rows except the category name itself or known matches outside the environment block.

### Task 2: Sync CameraLighting Safely

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

### Task 3: Validate and Commit

**Files:**
- Stage: `knowledge_base/camera_and_lighting.md`
- Stage: `webapp/src/data/database.json`
- Stage: `Docs/superpowers/plans/2026-05-24-environment-mood-cleanup-implementation.md`

- [x] **Step 1: Run app validation**

Run:

```bash
npm test
npm run lint
npm run build
```

Working directory: `webapp`

Expected: tests pass, lint passes, build passes. The existing Vite chunk-size warning is acceptable.

- [x] **Step 2: Review and commit**

Run:

```bash
git diff --check -- knowledge_base/camera_and_lighting.md webapp/src/data/database.json Docs/superpowers/plans/2026-05-24-environment-mood-cleanup-implementation.md
git add knowledge_base/camera_and_lighting.md webapp/src/data/database.json Docs/superpowers/plans/2026-05-24-environment-mood-cleanup-implementation.md
git commit -m "Clean environment mood prompts"
```

Expected: commit succeeds. Existing dirty `Docs/conversation_handoff.md` remains unstaged.
