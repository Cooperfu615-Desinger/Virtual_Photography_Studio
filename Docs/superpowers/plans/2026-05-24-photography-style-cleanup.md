# Photography Style Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean Photography Style prompts so photographer-inspired language preserves color, lighting, composition, texture, and finish without forcing explicit scenes or locations.

**Architecture:** `knowledge_base/regional_portrait_styles.md` is the source of truth for the Regional database. `webapp/src/lib/engine.js` supplies style intros and metadata inference, so its style keywords must stay aligned with the cleaned data. After syncing, merge only the `Regional` section into `webapp/src/data/database.json`.

**Tech Stack:** Markdown knowledge base, JavaScript prompt engine metadata, Python sync script, JSON database, Node.js tests, Vite build.

---

### Task 1: Clean Photography Style Rows

**Files:**
- Modify: `knowledge_base/regional_portrait_styles.md`

- [x] **Step 1: Rewrite the 26 photographer rows**

Remove hard scene guidance such as `適合森林`, `窗邊`, `居家`, `校園`, `街頭`, `臥室`, `旅館`, `飯店`, `泳池`, `天台`, `地鐵口`, and direct English scene words that would override the selected scene base.

- [x] **Step 2: Preserve visual identity**

Keep each photographer option recognizable through palette, contrast, light behavior, subject distance, composition rhythm, grain/texture, production finish, and emotional density.

### Task 2: Align Engine Style Helpers

**Files:**
- Modify: `webapp/src/lib/engine.js`

- [x] **Step 1: Update `inferStyleMeta()` keyword matching**

Replace stale scene-leading keyword triggers with the cleaned style phrases. Preserve broad compatibility tags where useful, but avoid adding new hard scene bias tags unless the style genuinely needs them.

- [x] **Step 2: Update `STYLE_PROMPT_INTROS`**

Remove scene-leading intro words such as `coastal`, `street`, and `studio` when they can cause the style intro to compete with the selected scene base.

### Task 3: Update Tests

**Files:**
- Modify: `webapp/src/lib/page3WorldScene.test.js`

- [x] **Step 1: Adjust photographer-style assertion**

Update the Daido Moriyama expectation to the cleaned style-intro wording while preserving the test intent: Page 3 still imports Page 1 photographer-style language.

### Task 4: Sync And Validate

**Files:**
- Modify: `webapp/src/data/database.json`

- [x] **Step 1: Run markdown sync**

Run:

```bash
python3 scripts/sync_to_json.py
```

- [x] **Step 2: Merge only `Regional` into database**

Use the section-only merge pattern so unrelated dictionaries are not changed.

- [x] **Step 3: Verify catalog and tests**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('./webapp/src/data/database.json','utf8')); console.log('database json ok')"
node --input-type=module -e "import { getPhotographyStyleOptions } from './webapp/src/lib/engine.js'; const styles=getPhotographyStyleOptions(); console.log(styles.length); console.log(styles.map((item)=>item.zh).slice(0,5).join(' | '));"
cd webapp
npm test
npm run lint
npm run build
```

Expected: JSON parse succeeds, photography style count remains `27` including `全無`, tests/lint/build pass, and the existing Vite chunk-size warning is acceptable.
