# Special Outfit Cleanup Design

## Goal

Clean `特殊穿搭 (Special Outfits)` while preserving its role as a one-click complete outfit package.

The cleaned system should keep the approved 29 complete looks, make each prompt shorter and more stable, and ensure a selected special outfit continues to override normal wardrobe composition.

## Scope

This cleanup covers:

- `特殊穿搭 (Special Outfits)` rows in `knowledge_base/wardrobe_and_styling.md`.
- The synced `Wardrobe["特殊穿搭 (Special Outfits)"]` category in `webapp/src/data/database.json`.
- Focused tests for option count, labels, prompt prefix, prompt length, unstable negative wording, and special outfit output priority.

This cleanup does not redesign `套裝 (Outfit Presets)`, `連身 (Dresses)`, tops, bottoms, shoes, legwear, accessories, character settings, scenes, lighting, or photography controls.

## Current State

`knowledge_base/wardrobe_and_styling.md` currently has `全無` plus 29 special outfit rows.

`webapp/src/data/database.json` currently exposes extra stale special outfit rows that are no longer present in the Markdown source. This cleanup treats the Markdown list as canonical and brings the UI data back to the approved 29 complete looks.

## Definition

`特殊穿搭` remains a complete head-to-toe look.

Unlike `套裝/連身`, this category is allowed to include:

- Fixed colors.
- Shoes.
- Bags.
- Headwear.
- Eyewear.
- Jewelry.
- Styling details that are essential to the reference look.

The value of this category is that a user can pick one option and receive a complete, highly specific outfit without separately configuring every wardrobe control.

## Keep The 29 Approved Looks

Keep these non-empty special outfit labels exactly:

- `黑色波點頭巾透紗套裝`
- `藍灰長外套蕾絲胸衣寬褲造型`
- `黑白條紋哥德蕾絲層次造型`
- `黑色背心豹紋單車褲機能造型`
- `迷彩透紗白蕾絲束胸裙裝`
- `復古樂團寬版短褲街頭造型`
- `Metallica 圖像T黑罩衫熱褲造型`
- `酒紅格紋吊帶牛仔短裙長靴造型`
- `粉紫蕾絲豹紋低腰喇叭褲造型`
- `深色牛仔短外套條紋襯衫寬褲造型`
- `淺色牛仔外套白粉T灰牛仔寬褲造型`
- `黑色亮片花卉透膚套裝`
- `白色花卉刺繡外套紅寬褲造型`
- `灰格紋西裝短版背心破壞牛仔寬褲造型`
- `棕格紋西裝絲巾白寬褲造型`
- `白色短版背心垂墜牛仔寬褲造型`
- `黑色運動外套抹胸寬版訓練褲造型`
- `紅色棒球外套藍T格紋裙造型`
- `棕色皮革飛行外套角色針織牛仔褲造型`
- `黑粉透膚蕾絲流蘇長裙造型`
- `米色潑染破壞工裝套裝造型`
- `粉白絨格外套蕾絲胸衣黃紗裙造型`
- `藍色束胸粉格裙白綁帶長襪造型`
- `海軍針織背心條紋巨袋褲紅靴造型`
- `橄欖亮面長外套奶油針織牛仔造型`
- `白色寬簷帽丹寧抹胸開衩裙造型`
- `鏽橘紮染工裝吊帶褲帽T造型`
- `白色字母短T條紋蕾絲裙靴造型`
- `金色貝雷帽皮草外套寬牛仔造型`

Remove any JSON-only stale special outfit rows that are not in this list.

## Prompt Structure

Every non-empty special outfit English prompt must start with:

`complete outfit:`

Each prompt should follow this compact structure:

`complete outfit: [style direction]. [headwear/eyewear only if essential]. [main top or dress]. [bottom]. [outerwear/layering]. [shoes and bag]. [one or two key accessories]. coordinated [style] styling.`

The prompt should preserve the look's strongest signals, but remove repeated material adjectives, redundant construction details, and long reference-image explanations.

## Length Rules

Targets:

- Normal target: 45-75 English words per non-empty prompt.
- Hard cap: 90 English words per non-empty prompt.
- Hard cap: 700 characters per non-empty prompt.
- Chinese description should remain a short inventory sentence, not a paragraph.

The goal is not minimalism. The goal is a complete outfit prompt that is dense enough to guide the model but short enough that the main clothing structure is not buried.

## Stability Rules

Avoid negative phrasing inside special outfit prompts unless it is absolutely necessary.

Remove or rewrite phrases such as:

- `excluding all...`
- `without...`
- `not a...`
- `do not...`
- `avoid...`

These phrases can accidentally become visual instructions. The cleaned prompts should describe what to generate rather than what not to generate.

## Priority Behavior

When a non-empty `特殊穿搭` option is selected:

- Grok output should include the selected special outfit as the complete wardrobe description.
- Z-Image output should describe the subject as wearing a complete special outfit.
- Normal top, bottom, dress, outfit preset, legwear, shoes, and accessory wardrobe controls should not add competing clothing lines.
- Scene priority should still stay before special outfit details, preserving the earlier scene-first behavior.

The existing engine already has most of this priority behavior. This cleanup should add tests so future prompt edits do not regress it.

## Data Flow

Implementation should edit the Markdown source first, then sync to JSON.

Because the sync script may rewrite more categories than this cleanup owns, implementation should scope `webapp/src/data/database.json` so only `Wardrobe["特殊穿搭 (Special Outfits)"]` changes.

Expected files:

- `knowledge_base/wardrobe_and_styling.md`
- `webapp/src/data/database.json`
- `webapp/src/lib/engineSpecialOutfitCleanup.test.js`

Engine code should only change if tests reveal a priority regression that cannot be solved by data cleanup.

## Tests

Add focused tests that verify:

- The special outfit control exposes `全無` plus exactly the 29 approved labels.
- Every non-empty special outfit prompt starts with `complete outfit:`.
- Every non-empty special outfit prompt stays under the hard length caps.
- Non-empty prompts do not use unstable negative phrasing.
- Selecting a special outfit still suppresses normal wardrobe clothing lines and produces a complete special outfit in both Grok and Z-Image prompts.

Run the focused test before implementation and confirm it fails because the current UI JSON still exposes stale extra options and long prompts.
