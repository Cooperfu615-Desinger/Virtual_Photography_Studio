# Special Outfit Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the approved 29 special outfit looks while shortening prompts and syncing UI data back to the canonical Markdown list.

**Architecture:** `knowledge_base/wardrobe_and_styling.md` remains the source of truth. `webapp/src/data/database.json` should receive only the synced `特殊穿搭 (Special Outfits)` category from the Markdown source. Tests under `webapp/src/lib` guard the option list, prompt structure, length caps, stable wording, and special outfit priority behavior.

**Tech Stack:** Markdown knowledge base, JSON sync script, Node built-in test runner, Vite app data.

---

### Task 1: Focused RED Tests

**Files:**
- Create: `webapp/src/lib/engineSpecialOutfitCleanup.test.js`
- Modify later: `webapp/src/lib/engineWardrobeControls.test.js`

- [x] **Step 1: Add focused tests**

Create `webapp/src/lib/engineSpecialOutfitCleanup.test.js` with:

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls } from './engine.js';

const EXPECTED_SPECIAL_OUTFITS = [
  '黑色波點頭巾透紗套裝',
  '藍灰長外套蕾絲胸衣寬褲造型',
  '黑白條紋哥德蕾絲層次造型',
  '黑色背心豹紋單車褲機能造型',
  '迷彩透紗白蕾絲束胸裙裝',
  '復古樂團寬版短褲街頭造型',
  'Metallica 圖像T黑罩衫熱褲造型',
  '酒紅格紋吊帶牛仔短裙長靴造型',
  '粉紫蕾絲豹紋低腰喇叭褲造型',
  '深色牛仔短外套條紋襯衫寬褲造型',
  '淺色牛仔外套白粉T灰牛仔寬褲造型',
  '黑色亮片花卉透膚套裝',
  '白色花卉刺繡外套紅寬褲造型',
  '灰格紋西裝短版背心破壞牛仔寬褲造型',
  '棕格紋西裝絲巾白寬褲造型',
  '白色短版背心垂墜牛仔寬褲造型',
  '黑色運動外套抹胸寬版訓練褲造型',
  '紅色棒球外套藍T格紋裙造型',
  '棕色皮革飛行外套角色針織牛仔褲造型',
  '黑粉透膚蕾絲流蘇長裙造型',
  '米色潑染破壞工裝套裝造型',
  '粉白絨格外套蕾絲胸衣黃紗裙造型',
  '藍色束胸粉格裙白綁帶長襪造型',
  '海軍針織背心條紋巨袋褲紅靴造型',
  '橄欖亮面長外套奶油針織牛仔造型',
  '白色寬簷帽丹寧抹胸開衩裙造型',
  '鏽橘紮染工裝吊帶褲帽T造型',
  '白色字母短T條紋蕾絲裙靴造型',
  '金色貝雷帽皮草外套寬牛仔造型',
];

const controlOptions = (key) => getLockControls().find((control) => control.key === key).options;
const specialOutfitOptions = () => controlOptions('specialOutfitId');
const nonNoneSpecialOutfits = () => specialOutfitOptions().filter((option) => option.zh !== '全無');
const optionByLabel = (key, label) => {
  const option = controlOptions(key).find((item) => item.zh === label);
  assert.ok(option, `Missing option ${label} for ${key}`);
  return option;
};

const wordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;

test('special outfit controls expose exactly the approved 29 complete looks', () => {
  assert.deepEqual(nonNoneSpecialOutfits().map((option) => option.zh), EXPECTED_SPECIAL_OUTFITS);
});

test('special outfit prompts keep complete outfit prefix and stay compact', () => {
  for (const option of nonNoneSpecialOutfits()) {
    assert.match(option.en, /^complete outfit:/, `${option.zh} should start with complete outfit:`);
    assert.ok(wordCount(option.en) <= 90, `${option.zh} has ${wordCount(option.en)} words`);
    assert.ok(option.en.length <= 700, `${option.zh} has ${option.en.length} characters`);
    assert.ok(option.desc.length <= 140, `${option.zh} description is too long`);
  }
});

test('special outfit prompts avoid unstable negative phrasing', () => {
  const unstableNegative = /\b(excluding|without|not a|do not|avoid)\b/i;
  for (const option of nonNoneSpecialOutfits()) {
    assert.doesNotMatch(option.en, unstableNegative, `${option.zh} should describe what to generate`);
  }
});

test('selected special outfit stays the complete wardrobe priority', () => {
  const specialOutfit = optionByLabel('specialOutfitId', '黑色波點頭巾透紗套裝');
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    specialOutfitId: specialOutfit.id,
    topId: optionByLabel('topId', '襯衫').id,
    pantsId: optionByLabel('pantsId', '直筒牛仔褲').id,
    shoesId: optionByLabel('shoesId', '高跟鞋').id,
  });

  assert.match(prompt.grokPrompt, /Special Outfit: black sheer polka-dot matching fashion set/);
  assert.doesNotMatch(prompt.grokPrompt, /\nTop:|\nPants:|\nShoes:|\nOutfit Preset:|\nDress:/);
  assert.match(prompt.zImagePrompt, /She wears complete special outfit: black sheer polka-dot matching fashion set/);
});
```

- [x] **Step 2: Run focused test and confirm RED**

Run:

```bash
cd webapp
node --test src/lib/engineSpecialOutfitCleanup.test.js
```

Expected: FAIL because current JSON exposes extra stale special outfits and current prompts exceed the length caps.

### Task 2: Data Cleanup

**Files:**
- Modify: `knowledge_base/wardrobe_and_styling.md`
- Modify: `webapp/src/data/database.json`

- [x] **Step 1: Rewrite the 29 Markdown rows**

Replace the 29 non-empty special outfit prompts with compact `complete outfit:` prompts. Keep labels exactly the same. Remove unstable negative wording from the English prompt. Keep fixed colors because this category is a complete look package.

- [x] **Step 2: Sync JSON and scope the diff**

Run:

```bash
python3 scripts/sync_to_json.py
```

Then replace only `Wardrobe["特殊穿搭 (Special Outfits)"]` in `webapp/src/data/database.json` with the synced category so unrelated categories remain unchanged.

### Task 3: Existing Test Updates

**Files:**
- Modify: `webapp/src/lib/engineWardrobeControls.test.js`

- [x] **Step 1: Update stale special outfit expectation**

Replace the old stale-extra test with a check that removed JSON-only special outfits are no longer exposed and that representative approved labels remain.

### Task 4: Verification And Commit

**Files:**
- Stage all implementation files except `Docs/conversation_handoff.md`.

- [x] **Step 1: Run focused and full verification**

Run:

```bash
cd webapp
node --test src/lib/engineSpecialOutfitCleanup.test.js
npm test
npm run lint
npm run build
cd ..
git diff --check
```

Expected: all pass. Vite chunk-size warnings are acceptable.

- [x] **Step 2: Commit**

Stage implementation files and commit:

```bash
git commit -m "Clean special outfit prompts"
```
