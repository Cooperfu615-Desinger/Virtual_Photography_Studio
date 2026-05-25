# Outfit Preset And Dress Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the outfit preset and dress cleanup so themed outfit presets and one-piece dresses have clear, color-neutral responsibilities.

**Architecture:** `knowledge_base/wardrobe_and_styling.md` remains the source of truth and syncs into `webapp/src/data/database.json`. `webapp/src/lib/engine.js` owns legacy aliases and cross-control migration for old outfit-preset locks that become dress locks. Focused Node tests guard option labels, removed rows, color-neutral prompt text, and legacy normalization.

**Tech Stack:** Markdown knowledge base, JSON sync script, Node built-in test runner, React/Vite app data.

---

### Task 1: Focused Regression Tests

**Files:**
- Create: `webapp/src/lib/engineOutfitPresetDressCleanup.test.js`
- Modify: `webapp/src/lib/engineWardrobeControls.test.js`

- [x] **Step 1: Add tests for cleaned outfit and dress controls**

Create `webapp/src/lib/engineOutfitPresetDressCleanup.test.js` with tests that:

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';

const controlOptions = (key) => getLockControls().find((control) => control.key === key).options;
const optionLabels = (key) => controlOptions(key).map((option) => option.zh);
const optionByLabel = (key, label) => {
  const option = controlOptions(key).find((item) => item.zh === label);
  assert.ok(option, `Missing option ${label} for ${key}`);
  return option;
};

test('outfit presets expose themed options and remove abstract style presets', () => {
  const labels = optionLabels('outfitPresetId');
  ['套裝：西裝長褲', '套裝：秘書短裙', '套裝：空服員制服', '套裝：護士制服', '套裝：醫生白袍'].forEach((label) => {
    assert.ok(labels.includes(label), `${label} should be available`);
  });
  ['套裝：極簡高級', '套裝：日系街頭', '套裝：居家慵懶', '套裝：文青生活', '套裝：清爽運動', '套裝：甜辣街頭', '套裝：都會通勤', '套裝：旅行度假', '套裝：夜生活辣妹'].forEach((label) => {
    assert.ok(!labels.includes(label), `${label} should be removed`);
  });
  assert.ok(!labels.includes('套裝：經典漢服'));
  assert.ok(!labels.includes('套裝：改良漢服'));
});
```

- [x] **Step 2: Run the focused test and confirm it fails before implementation**

Run: `node --test src/lib/engineOutfitPresetDressCleanup.test.js`

Expected: FAIL because the current data still exposes removed presets and does not expose new occupational presets.

### Task 2: Knowledge Base Cleanup

**Files:**
- Modify: `knowledge_base/wardrobe_and_styling.md`
- Modify: `webapp/src/data/database.json`

- [x] **Step 1: Replace outfit preset rows**

Replace `套裝 (Outfit Presets)` rows so they keep concrete themed presets, add the five occupational presets, remove abstract style presets, remove Hanfu rows, and rewrite sensual/costume prompts into short color-neutral descriptions.

- [x] **Step 2: Replace dress rows**

Replace `連身 (Dresses)` rows with `全無`, seven short dress silhouettes, and four long dress silhouettes. Do not include denim overall shorts.

- [x] **Step 3: Sync JSON and scope the diff**

Run: `python3 scripts/sync_to_json.py`

Then restore non-Wardrobe sections from HEAD so `webapp/src/data/database.json` only carries Wardrobe changes.

### Task 3: Engine Compatibility

**Files:**
- Modify: `webapp/src/lib/engine.js`
- Test: `webapp/src/lib/engineOutfitPresetDressCleanup.test.js`

- [x] **Step 1: Add wardrobe legacy aliases**

Add targeted `legacyIds` for renamed outfit presets and dresses. Old `象牙白春日巴黎套裝` maps to `套裝：春日巴黎亞麻長褲`; old `全黑長版襯衫百褶長裙套裝` maps to `套裝：長版襯衫百褶長裙`.

- [x] **Step 2: Add cross-control migration for moved dresses**

When old `outfitPresetId` values for dress-like presets are found, normalize `outfitPresetId` to `全無` and set `dressId` to the moved dress option if `dressId` is empty or none-like.

- [x] **Step 3: Add tests for normalization**

Assert old moved outfit preset ids normalize into the expected `dressId`, and old Hanfu ids normalize back to `全無`.

### Task 4: Test Updates And Prompt Verification

**Files:**
- Modify: `webapp/src/lib/engineWardrobeControls.test.js`
- Modify if needed: `webapp/src/lib/engineZImageWardrobeLanguage.test.js`

- [x] **Step 1: Update existing tests that reference removed labels**

Replace old `套裝：春日巴黎`, `套裝：極簡高級`, `套裝：日系街頭`, `連身：無袖洋裝`, and `連身：細肩帶洋裝` expectations with the cleaned labels.

- [x] **Step 2: Verify color-neutral wording**

Add prompt checks for the rewritten sensual/costume presets so their base prompt does not include fixed color words such as `black`, `white`, `silver`, `rose pink`, `burgundy`, or `ivory`.

### Task 5: Verification And Commit

**Files:**
- Stage all files changed by this implementation except `Docs/conversation_handoff.md`.

- [x] **Step 1: Run verification**

Run:

```bash
node --test src/lib/engineOutfitPresetDressCleanup.test.js
npm test
npm run lint
npm run build
git diff --check
```

Expected: all pass. Vite chunk-size warnings are acceptable.

- [x] **Step 2: Commit**

Stage only the implementation files and commit with:

```bash
git commit -m "Clean outfit presets and dresses"
```
