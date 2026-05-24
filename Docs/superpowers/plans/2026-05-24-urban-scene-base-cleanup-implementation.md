# Urban Scene Base Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean the `城市與社群感 (Urban & Social Snapshots)` PAGE1 scene base prompts so city locations use physical anchors and avoid rigid left-right symmetrical street layouts.

**Architecture:** This is a data-only continuation of the scene-base cleanup. Edit `knowledge_base/locations_and_sets.md`, sync to JSON, then merge only the synced `Locations` section into the current database so unrelated wardrobe data remains unchanged.

**Tech Stack:** Markdown knowledge base, Python sync script, Node.js JSON merge/check commands, Vite/React validation through npm scripts.

---

### Task 1: Clean Urban Scene Prompt Text

**Files:**
- Modify: `knowledge_base/locations_and_sets.md`

- [x] **Step 1: Clean transit, station, and landmark scenes**

Update urban rows from `室內：九龍城寨內部狹窄走道` through `戶外：大阪道頓堀心齋橋河道`. Keep place identity, but remove generic `atmosphere`, `mood`, `centered`, `both sides`, and rigid one-point-perspective wording. Favor offset anchors such as wall edges, platform corners, bench sections, pole areas, bridge railing, canal edge, crosswalk edge, and station-front paving.

- [x] **Step 2: Clean Hong Kong, Paris, Manhattan, Korea, Taiwan, LA scenes**

Update rows from `戶外：九龍城寨雜貨店門口` through `戶外：洛杉磯日落大道街景`. Keep storefront, doorway, signboard, stone wall, glass, railing, curb, billboard, palm tree, and facade cues. Remove `mood`, `snapshot`, `atmosphere`, `symmetry`, and `avenue` where they describe style rather than physical place.

- [x] **Step 3: Clean Kabukicho, Soho, London, French Concession, and Rome scenes**

Update rows from `戶外：新宿歌舞伎町招牌下` through `戶外：羅馬老城窗台邊`. Keep corner, doorway, signboard, storefront, poster wall, red-brick wall, townhouse entrance, terrace table, railing, stone wall, old door, window ledge, and potted plant anchors. Remove abstract street attitude, city mood, atmospheric terms, and wording that encourages long symmetrical streets.

- [x] **Step 4: Leave already clean waterfront and rooftop anchors mostly intact**

Review `戶外：城市遊艇碼頭欄杆旁` and `戶外：高樓頂樓城市天際線`. Only adjust if they contain direct symmetry or mood leakage. These are already high-specificity physical scene anchors.

- [x] **Step 5: Search for remaining city-batch residue**

Run:

```bash
rg -n "centered|both sides|two rows|central road|central path|tree tunnel|avenue|symmetry|symmetrical|mood|atmosphere|snapshot|cinematic|editorial|tension|attitude|energy|silence|intimate|romantic|literary|rain-soaked|wet street|damp street|streetlit" knowledge_base/locations_and_sets.md
```

Expected: no matches in the city batch except intentionally retained physical location identity or anti-symmetry guard wording.

### Task 2: Sync and Preserve Non-Location Sections

**Files:**
- Modify: `webapp/src/data/database.json`

- [x] **Step 1: Run markdown-to-JSON sync**

Run:

```bash
python3 scripts/sync_to_json.py
```

Expected: command exits successfully and updates `webapp/src/data/database.json`.

- [x] **Step 2: Merge only synced Locations into the pre-sync database**

Run:

```bash
node -e "const fs=require('fs'); const current=JSON.parse(fs.readFileSync('webapp/src/data/database.json','utf8')); const cp=require('child_process'); const previous=JSON.parse(cp.execFileSync('git',['show','HEAD:webapp/src/data/database.json'],{encoding:'utf8'})); previous.Locations=current.Locations; fs.writeFileSync('webapp/src/data/database.json', JSON.stringify(previous,null,2)+'\n'); console.log('merged locations into current database');"
```

Expected output includes:

```text
merged locations into current database
```

- [x] **Step 3: Confirm JSON parses**

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

- [x] **Step 1: Run test suite**

Run:

```bash
npm test
```

Working directory: `webapp`

Expected: 42/42 tests pass.

- [x] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Working directory: `webapp`

Expected: lint passes.

- [x] **Step 3: Run build**

Run:

```bash
npm run build
```

Working directory: `webapp`

Expected: build passes. The existing Vite chunk-size warning is acceptable.

- [x] **Step 4: Spot-check changed city scene prompts**

Run:

```bash
node -e "const db=require('./webapp/src/data/database.json'); const names=['室內：電車車廂側面走道視角','戶外：澀谷站前廣場人潮邊緣','戶外：首爾弘大街頭','戶外：雨後 mews 巷弄']; for (const name of names) { for (const entries of Object.values(db.Locations)) { const item=entries.find((entry)=>entry.zh===name); if (item) console.log(name+' => '+item.en); } }"
```

Expected: each printed prompt describes physical scene anchors and avoids `mood`, `atmosphere`, `snapshot`, `both sides`, or rigid symmetrical street framing.

### Task 4: Commit Urban Scene Cleanup

**Files:**
- Stage: `knowledge_base/locations_and_sets.md`
- Stage: `webapp/src/data/database.json`
- Stage: `Docs/superpowers/plans/2026-05-24-urban-scene-base-cleanup-implementation.md`

- [x] **Step 1: Review diff**

Run:

```bash
git diff -- knowledge_base/locations_and_sets.md webapp/src/data/database.json Docs/superpowers/plans/2026-05-24-urban-scene-base-cleanup-implementation.md
```

Expected: diff contains only third-batch urban scene base wording changes, generated location JSON updates, and this plan.

- [x] **Step 2: Commit**

Run:

```bash
git add knowledge_base/locations_and_sets.md webapp/src/data/database.json Docs/superpowers/plans/2026-05-24-urban-scene-base-cleanup-implementation.md
git commit -m "Clean urban scene base prompts"
```

Expected: commit succeeds. Existing dirty `Docs/conversation_handoff.md` remains unstaged.
