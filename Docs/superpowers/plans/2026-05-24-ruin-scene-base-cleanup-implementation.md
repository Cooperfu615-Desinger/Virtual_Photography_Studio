# Ruin Scene Base Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean the `地下與廢墟風格 (Abandoned & Underground)` PAGE1 scene base prompts so ruin locations stay physical, concrete, and less dependent on generic mood words.

**Architecture:** This is a data-only continuation of the scene-base cleanup. Edit only `knowledge_base/locations_and_sets.md`, sync to JSON, then merge only the synced `Locations` section into the current database to avoid overwriting unrelated wardrobe data.

**Tech Stack:** Markdown knowledge base, Python sync script, Node.js JSON merge/check commands, Vite/React validation through npm scripts.

---

### Task 1: Clean Underground and Ruin Location Entries

**Files:**
- Modify: `knowledge_base/locations_and_sets.md`

- [ ] **Step 1: Replace industrial and underground mood wording with physical anchors**

Update entries from `室內：廢棄水泥工廠破碎輸送帶區` through `室內：地下排洪道機房通道口` so the English prompt describes machinery, concrete, pipes, rust, pooled water, wall stains, and door/corner anchors. Avoid `mood`, `atmosphere`, `harsh`, and abstract decay phrasing.

- [ ] **Step 2: Replace medical and school ruin mood wording with physical anchors**

Update entries from `室內：廢棄手術室` through `室內：廢棄校舍體育器材室` so the English prompt describes beds, curtains, cabinets, instrument carts, desks, chalkboards, old piano, gym mats, ball racks, broken windows, dust, tile, wood floor, and scattered objects. Keep the scene identity, but avoid generic emotional words.

- [ ] **Step 3: Replace club, mansion, mall, park, train-yard, and high-rise ruin mood wording**

Update entries from `室內：地下狂歡俱樂部 / 金庫` through `戶外：高樓建築骨架建材堆放角落` so the English prompt describes fixtures and surfaces. Use asymmetric anchors such as corners, edges, broken storefronts, floor slab edges, scaffolding side, exposed beams, railings, concrete lips, stacked materials, and overgrown pavement.

- [ ] **Step 4: Search for remaining second-batch residue**

Run:

```bash
rg -n "harsh|mood|atmosphere|silence|decay|precarious|haunted|rebellious|wind-swept|haze|symmetry|symmetrical|both sides|two rows|central road|central path|tree tunnel|avenue" knowledge_base/locations_and_sets.md
```

Expected: no matches in lines 56-82 except words that are part of physical location identity and intentionally kept.

### Task 2: Sync and Preserve Non-Location Sections

**Files:**
- Modify: `webapp/src/data/database.json`

- [ ] **Step 1: Run markdown-to-JSON sync**

Run:

```bash
python3 scripts/sync_to_json.py
```

Expected: command exits successfully and updates `webapp/src/data/database.json`.

- [ ] **Step 2: Merge only synced Locations into the pre-sync database**

Run:

```bash
node -e "const fs=require('fs'); const current=JSON.parse(fs.readFileSync('webapp/src/data/database.json','utf8')); const cp=require('child_process'); const previous=JSON.parse(cp.execFileSync('git',['show','HEAD:webapp/src/data/database.json'],{encoding:'utf8'})); previous.Locations=current.Locations; fs.writeFileSync('webapp/src/data/database.json', JSON.stringify(previous,null,2)+'\n'); console.log('merged locations into current database');"
```

Expected output includes:

```text
merged locations into current database
```

- [ ] **Step 3: Confirm JSON parses**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('./webapp/src/data/database.json','utf8')); console.log('database json ok')"
```

Expected output includes:

```text
database json ok
```

### Task 3: Validate and Spot-Check

**Files:**
- Read: `webapp/src/data/database.json`

- [ ] **Step 1: Run test suite**

Run:

```bash
npm test
```

Working directory: `webapp`

Expected: 42/42 tests pass.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Working directory: `webapp`

Expected: lint passes.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Working directory: `webapp`

Expected: build passes. The existing Vite chunk-size warning is acceptable.

- [ ] **Step 4: Spot-check changed ruin scene prompts**

Run:

```bash
node -e "const db=require('./webapp/src/data/database.json'); const names=['室內：廢棄水泥工廠生鏽控制室','室內：遭洗劫的維多利亞大宅','戶外：雜草叢生的廢棄公園','戶外：高樓建築骨架開放樓層邊緣']; for (const name of names) { for (const entries of Object.values(db.Locations)) { const item=entries.find((entry)=>entry.zh===name); if (item) console.log(name+' => '+item.en); } }"
```

Expected: each printed prompt describes physical structures and does not include `mood`, `atmosphere`, `haunted`, `precarious`, or generic emotional phrasing.

### Task 4: Commit Ruin Scene Cleanup

**Files:**
- Stage: `knowledge_base/locations_and_sets.md`
- Stage: `webapp/src/data/database.json`
- Stage: `Docs/superpowers/plans/2026-05-24-ruin-scene-base-cleanup-implementation.md`

- [ ] **Step 1: Review diff**

Run:

```bash
git diff -- knowledge_base/locations_and_sets.md webapp/src/data/database.json Docs/superpowers/plans/2026-05-24-ruin-scene-base-cleanup-implementation.md
```

Expected: diff contains only second-batch ruin/underground scene base wording changes, generated location JSON updates, and this plan.

- [ ] **Step 2: Commit**

Run:

```bash
git add knowledge_base/locations_and_sets.md webapp/src/data/database.json Docs/superpowers/plans/2026-05-24-ruin-scene-base-cleanup-implementation.md
git commit -m "Clean ruin scene base prompts"
```

Expected: commit succeeds. Existing dirty `Docs/conversation_handoff.md` remains unstaged.
