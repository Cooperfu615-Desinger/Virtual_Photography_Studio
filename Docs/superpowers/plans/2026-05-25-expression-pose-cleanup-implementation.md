# Expression Pose Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean PAGE1 `神情姿態` so expression, body pose, and social shooting actions have separate responsibilities while preserving old saved locks.

**Architecture:** `knowledge_base/character_design.md` remains the source of truth and is synced into `webapp/src/data/database.json`. `webapp/src/lib/engine.js` owns compatibility aliases, prompt assembly, and social-action semantics. `webapp/src/components/Page1Workspace.jsx` owns the control-level mutual-exclusion behavior.

**Tech Stack:** Markdown knowledge base, Node/Vitest engine tests, React PAGE1 controls, JSON data sync via `scripts/sync_to_json.py`.

---

### Task 1: Focused Regression Tests

**Files:**
- Create: `webapp/src/lib/engineExpressionPoseCleanup.test.js`

- [ ] **Step 1: Add tests for option sets, prompt composition, and legacy locks**

Create `webapp/src/lib/engineExpressionPoseCleanup.test.js` with tests that:

```js
import { describe, expect, it } from 'vitest';
import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';

const optionsFor = (key) => getLockControls().find((control) => control.key === key)?.options || [];
const labelsFor = (key) => optionsFor(key).map((option) => option.zh);
const optionByLabel = (key, label) => optionsFor(key).find((option) => option.zh === label);

describe('expression and pose cleanup', () => {
  it('exposes the approved expression and body-pose sets', () => {
    expect(labelsFor('expressionId')).toEqual([
      '全無',
      '直視鏡頭｜柔和微笑',
      '直視鏡頭｜平靜淡然',
      '直視鏡頭｜無辜清透',
      '抿唇忍笑｜俏皮',
      '離鏡凝視｜若有所思',
      '低頭垂眼｜內斂',
      '回眸側看｜輕柔注意',
      '閉眼沉浸',
      '大笑｜自然喜悅',
    ]);

    expect(labelsFor('poseId')).toEqual([
      '全無',
      '站姿｜自然站姿',
      '站姿｜單腳重心',
      '站姿｜雙手自然垂放',
      '站姿｜雙臂交疊',
      '坐姿｜自然坐姿',
      '坐姿｜微微前傾',
      '坐姿｜雙手後撐',
      '坐姿｜單腿放鬆',
      '坐姿｜雙腿自然伸展',
      '坐姿｜盤腿坐姿',
      '坐姿｜側身坐姿',
      '坐姿｜抱膝坐姿',
      '半躺低姿態｜側身半躺',
      '半躺低姿態｜正面仰躺',
      '半躺低姿態｜手撐半躺',
      '半躺低姿態｜微蜷放鬆',
      '半躺低姿態｜趴姿',
      '半躺低姿態｜側躺延伸',
      '蹲姿｜自然蹲姿',
      '蹲姿｜單膝蹲姿',
      '蹲姿｜手扶膝蓋蹲姿',
      '動態｜輕步移動',
      '動態｜整理頭髮',
      '動態｜整理衣襬',
      '動態｜抬手整理肩頸',
      '動態｜回身動作',
      '動態｜停步姿勢',
    ]);

    expect(labelsFor('poseId').join(' ')).not.toMatch(/自拍|鏡子自拍|回頭看鏡頭|低頭/);
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails before implementation**

Run: `npm test -- --run webapp/src/lib/engineExpressionPoseCleanup.test.js`

Expected: FAIL because the old expression and pose labels are still present.

### Task 2: Knowledge Base Cleanup

**Files:**
- Modify: `knowledge_base/character_design.md`
- Modify: `webapp/src/data/database.json`

- [ ] **Step 1: Replace expression rows**

Replace the existing `神情與眼神 (Expression & Gaze)` rows with `全無` plus these nine labels: `直視鏡頭｜柔和微笑`, `直視鏡頭｜平靜淡然`, `直視鏡頭｜無辜清透`, `抿唇忍笑｜俏皮`, `離鏡凝視｜若有所思`, `低頭垂眼｜內斂`, `回眸側看｜輕柔注意`, `閉眼沉浸`, `大笑｜自然喜悅`.

- [ ] **Step 2: Replace pose rows**

Replace the existing `姿勢與肢體語言 (Pose & Body Language)` rows with `全無` plus the 27 body-only labels from the design spec. Pose prompts must avoid selfie, mirror selfie, direct gaze, lowered gaze, and over-the-shoulder gaze wording.

- [ ] **Step 3: Add social shooting special actions**

Append `自然自拍感`, `鏡子自拍`, `男友視角拍攝`, and `閨蜜視角拍攝` to `特殊動作 (Special Actions)` without shifting existing special action rows.

- [ ] **Step 4: Sync JSON and keep the diff scoped to Character**

Run: `python3 scripts/sync_to_json.py`

Then restore non-Character sections from HEAD so `webapp/src/data/database.json` only carries Character changes.

### Task 3: Engine Compatibility And Composition

**Files:**
- Modify: `webapp/src/lib/engine.js`
- Test: `webapp/src/lib/engineExpressionPoseCleanup.test.js`

- [ ] **Step 1: Add legacy aliases**

Add targeted legacy option ids so old expression and pose locks normalize to the nearest new label. Add explicit cross-control migration for old selfie pose ids so `poseId` maps to the nearest body pose and `specialActionId` maps to either `自然自拍感` or `鏡子自拍`.

- [ ] **Step 2: Add social shooting action metadata**

Tag the four social shooting actions with `social_shooting_action` in `inferCharacterMeta`. Update special-action framing logic so these actions do not force the full-body action restrictions used by normal special actions.

- [ ] **Step 3: Allow social action plus pose in prompt assembly**

In `buildCharacter`, keep the current early return for non-social special actions, but continue into pose selection when the selected special action has `social_shooting_action`.

- [ ] **Step 4: Expand tests**

Add tests that assert:
- social shooting actions and poses both appear in generated prompt selections,
- non-social special actions still replace `poseId`,
- old expression locks normalize to the new expression labels,
- old selfie and mirror-selfie pose locks normalize into both `poseId` and `specialActionId`.

### Task 4: PAGE1 Mutual-Exclusion Adjustment

**Files:**
- Modify: `webapp/src/components/Page1Workspace.jsx`

- [ ] **Step 1: Make social actions composable in the control layer**

Keep pose disabled when a non-social special action is selected. Keep `specialActionId` selectable when a pose is selected. When selecting a non-social special action, clear `poseId`; when selecting a social shooting action, preserve `poseId`.

- [ ] **Step 2: Preserve existing close-up and special-subject restrictions**

Do not change close-up allowed keys or special subject disabling rules.

### Task 5: Verification And Commit

**Files:**
- Stage all files changed by this implementation except `Docs/conversation_handoff.md`.

- [ ] **Step 1: Run focused and full verification**

Run:

```bash
npm test -- --run webapp/src/lib/engineExpressionPoseCleanup.test.js
npm test
npm run lint
npm run build
git diff --check
```

Expected: all pass. Vite chunk-size warnings are acceptable.

- [ ] **Step 2: Commit**

Stage only the implementation files and commit with:

```bash
git commit -m "Clean expression and pose prompts"
```
