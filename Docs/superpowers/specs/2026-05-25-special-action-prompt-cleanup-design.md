# Special Action Prompt Cleanup Design

## Goal

Clean `特殊動作 (Special Actions)` prompt wording while preserving the current feature shape.

This cleanup should keep all existing special actions, make the English prompts shorter and more stable, and protect the current interaction rule: social shooting actions can compose with normal poses, while other special actions replace the normal pose slot.

## Scope

This cleanup covers:

- `特殊動作 (Special Actions)` rows in `knowledge_base/character_design.md`.
- The synced `Character["特殊動作 (Special Actions)"]` category in `webapp/src/data/database.json`.
- Focused tests for option count, labels, prompt length, stable wording, and pose-composition behavior.

This cleanup does not remove, rename, or move any special action. It does not redesign normal `姿勢與肢體語言`, expressions, scenes, props, wardrobe, camera, or lighting controls.

## Current State

`特殊動作 (Special Actions)` currently contains `全無` plus 27 non-empty actions.

The category mixes several useful action types:

- Face and hand prop actions, such as lipstick, iced coffee, lollipop, and cigarette.
- Dressing or styling gestures, such as adjusting stockings or pulling a top off one shoulder.
- Specific body poses, such as leaning forward, kneeling, reclining, wall-supported poses, and pillow-supported poses.
- Social shooting relationships, such as natural selfie energy, mirror selfie, boyfriend perspective, and best-friend perspective.

This variety is intentional and should remain.

## Keep All Existing Labels

Keep these non-empty labels exactly:

- `塗口紅`
- `塗歪口紅`
- `喝冰咖啡`
- `咬著波板糖`
- `抽煙`
- `整理絲襪`
- `前傾抓住褲腰`
- `側坐單手後撐`
- `抱膝托腮坐姿`
- `仰躺雙手微抬`
- `跪坐回眸撩髮`
- `半脫上衣整理肩線`
- `隨性癱坐在雕花單人絨布沙發上`
- `趴臥滑手機`
- `靠牆站立`
- `靠牆坐姿`
- `靠牆後仰站姿`
- `靠牆仰躺抬腿`
- `側身斜躺伸腿`
- `跪姿前傾倚靠高背`
- `四足跪姿前傾`
- `抱枕俯臥回眸`
- `分腿跪坐仰視`
- `自然自拍感`
- `鏡子自拍`
- `男友視角拍攝`
- `閨蜜視角拍攝`

Scene-supported actions, such as wall, sofa, pillow, and high-back support actions, stay in this category. The user will choose compatible scenes separately.

## Prompt Rules

Each non-empty English prompt should describe the action in a compact, positive form:

`[main body action], [required hand/prop/support contact], [one stability detail if needed], [portrait/editorial/social tone].`

The prompt should preserve what makes the action visually readable:

- Prop actions should clearly bind the hand, mouth or body part, and visible prop.
- Body actions should name the support points, body direction, and main silhouette.
- Scene-supported actions may name the needed support object, but should not over-describe the surrounding scene.
- Social shooting actions should describe camera relationship and mood, not a fixed body pose.

Avoid repeated filler such as `deliberate staged portrait action` on every row. Keep staged/editorial language only where it helps the action read correctly.

## Length Rules

Targets:

- Normal target: 12-32 English words per non-empty prompt.
- Hard cap: 55 English words per non-empty prompt.
- Hard cap: 360 characters per non-empty prompt.
- Chinese description should stay under 100 characters when possible.

The goal is not to make actions vague. The goal is to keep the action clear while leaving room for identity, wardrobe, scene, lighting, and camera settings.

## Stability Rules

Do not add negative prompt wording inside special action prompts.

Avoid phrases such as:

- `without...`
- `not...`
- `do not...`
- `avoid...`
- `excluding...`

Avoid gaze or expression language unless the action requires it. For example:

- Keep `looking back` for `跪坐回眸撩髮` because the action is a look-back action.
- Keep phone visibility for `鏡子自拍` because the phone is required.
- Remove unnecessary `gazing toward the camera` wording from actions where the expression control should decide the face.

## Metadata And Interaction Behavior

The existing engine infers action metadata from prompt text. This cleanup should preserve useful tags by keeping the trigger language where needed:

- Social actions must still infer `social_shooting_action`.
- Lipstick, coffee, lollipop, and cigarette actions must still infer `prop_action` and `face_action`.
- Stocking adjustment must still infer `leg_focus_action`.
- Sofa action must still infer `large_prop_action`.
- Reclining, kneeling, all-fours, pillow, and similar full-body actions must still infer `full_body_action`.

The cleanup should also avoid accidental metadata. For example, `靠牆站立` should not read like a wardrobe action just because it says `one shoulder`; use body-support wording that keeps the wall lean but avoids clothing-related triggers.

Current UI and prompt behavior should remain:

- `自然自拍感`, `鏡子自拍`, `男友視角拍攝`, and `閨蜜視角拍攝` can compose with a selected normal pose.
- All other non-empty special actions replace the normal pose slot.
- Special action remains single-subject only.
- Scene-supported actions do not choose the scene automatically; they only describe the needed body/action support.

## Data Flow

Implementation should edit the Markdown source first, then sync JSON.

Because the sync script may rewrite more categories than this cleanup owns, implementation should scope `webapp/src/data/database.json` so only `Character["特殊動作 (Special Actions)"]` changes.

Expected files:

- `knowledge_base/character_design.md`
- `webapp/src/data/database.json`
- `webapp/src/lib/engineSpecialActionCleanup.test.js`
- `webapp/src/lib/engineExpressionPoseCleanup.test.js`

Engine code should only change if tests reveal a metadata or interaction regression that cannot be solved through prompt wording.

## Tests

Add focused tests that verify:

- The special action control exposes `全無` plus exactly the 27 existing labels.
- Every non-empty special action prompt stays under the hard length caps.
- Non-empty prompts avoid unstable negative phrasing.
- The four social shooting actions still have `social_shooting_action` metadata.
- Representative prop, leg-focus, large-prop, and full-body actions keep their expected metadata.
- Social shooting actions can still compose with normal poses.
- Non-social special actions still clear or replace the normal pose slot.

Update existing expression and pose cleanup tests only where their assertions should reflect the tightened special action wording.
