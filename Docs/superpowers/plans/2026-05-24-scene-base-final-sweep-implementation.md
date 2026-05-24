# Scene Base Final Sweep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the scene-base cleanup by scanning all remaining `Locations` prompts for role leakage, studio artifacts, mood wording, pose wording, light wording, and symmetry triggers.

**Architecture:** This is a data-only sweep. Edit `knowledge_base/locations_and_sets.md`, run the markdown-to-JSON sync, then merge only the synced `Locations` section into the current app database so unrelated sections remain unchanged.

**Tech Stack:** Markdown knowledge base, Python sync script, Node.js JSON merge/check commands, Vite/React validation through npm scripts.

---

### Task 1: Scan Remaining Scene Base Residue

**Files:**
- Read: `knowledge_base/locations_and_sets.md`

- [x] **Step 1: Search for mood, lighting, pose, studio-artifact, and symmetry terms**

Run:

```bash
rg -n "mood|atmosphere|snapshot|cinematic|editorial|romantic|intimate|literary|energy|tension|attitude|silence|feeling|comfortable|soft light|sunlight|shadow|shadows|dappled|glowing|fluorescent|ceiling tubes|paper roll|backdrop stand|light stands|studio equipment|subject lying|subject sitting|lying down|sitting directly|centered|both sides|two rows|central road|central path|tree tunnel|avenue|symmetry|symmetrical" knowledge_base/locations_and_sets.md
```

Expected: identify only entries that still leak non-scene responsibilities or intentionally retained guard wording.

- [x] **Step 2: Review the lower sections directly**

Run:

```bash
sed -n '136,155p' knowledge_base/locations_and_sets.md
```

Expected: inspect `自然與戶外` and `其他專屬場景` for pose, light, and mood terms that should be moved out of the scene base.

### Task 2: Clean Final Scene Base Entries

**Files:**
- Modify: `knowledge_base/locations_and_sets.md`

- [x] **Step 1: Clean `其他專屬場景` pose and light leakage**

Update `其他：草地`, `其他：白色床鋪`, `其他：生活感日式榻榻米房間`, `其他：樹下草地`, and `其他：沙灘海岸線` so the English prompts describe surfaces and nearby physical anchors only. Remove `subject lying`, `subject sitting`, `comfortable`, `soft`, `sunlight`, and shadow-light phrases unless the word is part of a negative guard about object generation.

- [x] **Step 2: Clean any remaining natural-scene light or symmetry leakage**

Adjust nature entries only if the scan finds terms that belong to lighting, mood, or forced symmetrical composition. Preserve physical terms such as sand, waterline, grass, trunks, stones, deck planks, railings, reeds, roots, and shoreline.

- [x] **Step 3: Preserve intentional anti-artifact and anti-symmetry guards**

Keep negative guards such as `no paper roll backdrop`, `no light stands`, `avoid symmetrical two-sided cherry tree avenue`, and `avoid central road lined with cherry blossoms` because they prevent known generation failures.

### Task 3: Sync, Validate, and Commit

**Files:**
- Modify: `webapp/src/data/database.json`

- [x] **Step 1: Run markdown-to-JSON sync**

Run:

```bash
python3 scripts/sync_to_json.py
```

Expected: sync exits successfully.

- [x] **Step 2: Merge only synced Locations into current database**

Run:

```bash
node -e "const fs=require('fs'); const current=JSON.parse(fs.readFileSync('webapp/src/data/database.json','utf8')); const cp=require('child_process'); const previous=JSON.parse(cp.execFileSync('git',['show','HEAD:webapp/src/data/database.json'],{encoding:'utf8'})); previous.Locations=current.Locations; fs.writeFileSync('webapp/src/data/database.json', JSON.stringify(previous,null,2)+'\n'); console.log('merged locations into current database');"
```

Expected output includes:

```text
merged locations into current database
```

- [x] **Step 3: Confirm JSON parses and only Locations changed**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('./webapp/src/data/database.json','utf8')); console.log('database json ok')"
node -e "const fs=require('fs'); const cp=require('child_process'); const before=JSON.parse(cp.execFileSync('git',['show','HEAD:webapp/src/data/database.json'],{encoding:'utf8'})); const after=JSON.parse(fs.readFileSync('webapp/src/data/database.json','utf8')); const changed=Object.keys(after).filter(k=>JSON.stringify(after[k])!==JSON.stringify(before[k])); console.log(changed.join('\n'));"
```

Expected output includes `database json ok` and `Locations`.

- [x] **Step 4: Run app validation**

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
git diff --check -- knowledge_base/locations_and_sets.md webapp/src/data/database.json Docs/superpowers/plans/2026-05-24-scene-base-final-sweep-implementation.md
git add knowledge_base/locations_and_sets.md webapp/src/data/database.json Docs/superpowers/plans/2026-05-24-scene-base-final-sweep-implementation.md
git commit -m "Finalize scene base prompt cleanup"
```

Expected: commit succeeds. Existing dirty `Docs/conversation_handoff.md` remains unstaged.
