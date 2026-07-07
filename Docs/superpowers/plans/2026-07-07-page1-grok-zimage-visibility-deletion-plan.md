# PAGE1 Grok/Z-Image Visibility Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PAGE1 `Grok/Z-Image` (`zImagePrompt`) stop emitting clothing, body, pose, and composition details that cannot be visible under the selected framing.

**Architecture:** Keep user selections and lock fields intact, then filter only final prompt text at output assembly time. Extend the existing complete-look visibility idea into scoped Z-Image sanitizers for wardrobe add-ons, body descriptors, pose clauses, scene priority, and camera/composition clauses, without changing UI labels or historical internal field names.

**Tech Stack:** Vite + React app, PAGE1 prompt engine in `webapp/src/lib/engine.js`, Node test runner via `npm test`.

---

## Output Scope

- Primary target: `Grok/Z-Image` output only.
- Internal field: `zImagePrompt`.
- Do not rename UI label `Grok/Z-Image`.
- Do not rename internal fields:
  - `grokPrompt`
  - `zImagePrompt`
  - `midjourneyPrompt`
- Do not clear the user's selected locks. The deletion happens only in final prompt output.
- Existing specialOutfit / outfitPreset fragment filtering remains active and should not be weakened.

## Framing Visibility Buckets

| Framing bucket | Examples | Visible output policy |
| --- | --- | --- |
| `faceClose` | 臉部特寫, 半臉, 局部五官, close face crops | Keep face, hair, head/neck accessories, neckline or tiny upper-garment hints only. Delete lower body, floor contact, legs, shoes, bags, full-room pressure. |
| `portraitUpper` | 特寫, 胸上, tight bust-up, portrait | Keep upper garment, neckline, shoulders, bust/torso-visible garment details, outerwear/layering. Delete bottoms, legwear, shoes, bags, hips/legs/feet, lower-body pose anchors. |
| `mediumUpper` | 中景, waist-up medium | Keep top, outerwear, visible waistline, and bottoms when needed for waist connection. Delete legwear, shoes, feet, bags, foot-level pose anchors. |
| `cowboyKnee` | 牛仔中景, knee-up | Keep top, outerwear, bottoms. Delete shoes, feet, footwear emphasis. Delete socks/legwear by default unless a future approved test proves knee-up legwear must remain. |
| `fullWide` | 全身, wide, environmental full body | Keep full wardrobe, full body pose, shoes, feet, bags, and environment context. |

## Complete Deletion / Rewrite List

### 1. Wardrobe Add-ons Outside specialOutfit / outfitPreset

These are separate PAGE1 wardrobe slots or append-only clauses that can still appear after the first complete-look filter.

| Output source | Delete in `faceClose` / `portraitUpper` | Delete in `mediumUpper` / `cowboyKnee` | Keep in `fullWide` | Planned method |
| --- | --- | --- | --- | --- |
| General bottoms | pants, trousers, jeans, shorts, hot pants, skirts, panties, briefs, culottes, skorts, leggings as pants | Keep in `mediumUpper` and `cowboyKnee` when they describe waist/bottom connection | Yes | Add a Z-Image wardrobe visibility helper before `buildBottomWardrobePrompt(...)` text is appended. |
| Legwear | stockings, socks, tights, pantyhose, leg warmers, hosiery, garter straps | Delete | Yes | Wrap `buildColoredGrokPrompt(legwear...)` calls in a visibility check. |
| Shoes / feet | shoes, boots, heels, pumps, sandals, sneakers, loafers, Mary Janes, slippers, footwear, bare feet, barefoot | Delete | Yes | Wrap `buildColoredGrokPrompt(shoes...)` calls in a visibility check. |
| Bags | bag, handbag, shoulder bag, crossbody, tote, backpack, purse, clutch, satchel, pouch, kinchaku, wallet | Delete | Yes | Reuse complete-look bag classifier for any Z-Image wardrobe/accessory clause that is wardrobe-bound rather than subject-bound. |
| Outerwear / layers | Keep | Keep | Yes | Preserve jacket, coat, cardigan, blazer, cape, shawl, robe, haori, cover-up, layered-over clauses. |
| Upper garments | Keep | Keep | Yes | Preserve shirt, tee, blouse, corset, bra, bralette, camisole, tank, bodice, bustier, sweater, hoodie, vest, halter, tube top, bikini top. |

Expected example:

```text
Before chest-up:
She wears leopard-pattern strapless corset top, lace bust cups, long front ribbon ties, paired with white lace thigh-high stockings, paired with black knee-high boots.

After chest-up:
She wears leopard-pattern strapless corset top, lace bust cups, long front ribbon ties.
```

### 2. Body Type / Body Shape Descriptors

These are not clothing, but they can force the model to widen the crop.

| Descriptor group | Delete or rewrite in close / portrait | Medium policy | Full policy | Planned method |
| --- | --- | --- | --- | --- |
| Hips / pelvis | Delete `wider hips`, `wide hips`, `curvy hips`, `narrow hips`, `pelvis`, `hip line` | Keep only if wording is waist-up compatible; otherwise delete | Keep | Add `filterZImageBodyTypeForFraming(...)` before body type text is added to Z-Image subject text. |
| Legs / thighs | Delete `long legs`, `slender legs`, `thighs`, `lower legs`, `calves`, `knees` | Delete feet/lower-leg details; keep only waist/upper silhouette if phrased that way | Keep | Clause-level filtering using lower-body role keywords. |
| Feet | Delete `feet`, `bare feet`, `toes` | Delete | Keep | Same lower-body keyword filtering. |
| Full-body shape labels | Rewrite `soft hourglass body` to `soft upper-body curves` for chest-up crops when a visible torso/bust cue is useful | Keep `hourglass` only if medium framing includes waist | Keep | Prefer rewrite over full deletion when it preserves useful portrait styling without forcing a full-body frame. |
| Bust / shoulders / neck | Keep when not explicit or sexualized beyond existing option text | Keep | Keep | Do not filter; these can be visible in chest-up framing. |

Expected example:

```text
Before chest-up:
soft hourglass body, fuller bust, wider hips

After chest-up:
soft upper-body curves, fuller bust
```

### 3. Pose Composer / Action Clauses

These often describe a full body even when framing is chest-up.

| Pose clause group | Delete in close / portrait | Medium / cowboy policy | Full policy | Planned method |
| --- | --- | --- | --- | --- |
| Floor contact | `sitting on the floor`, `supporting on floor`, `floor-seated`, `grounded seated weight`, `kneeling on floor`, `lying on floor` | Rewrite to posture-only when useful, e.g. `low seated posture` | Keep | Add `filterZImagePoseForFraming(...)` after pose text resolution and before `compressZImageSinglePoseText(...)`. |
| Lower-body anchors | `hand resting on the leg`, `hands on thighs`, `hands near knees`, `knees together`, `one knee raised`, `thigh contact`, `lower abdomen` when it implies lower crop | Delete for close / portrait; keep only torso/hand-visible clauses | Keep if visible in knee-up; delete feet-only anchors | Keep | Split pose text into clauses and remove lower-body clauses by role keywords. |
| Foot / shoe actions | `feet planted`, `toes pointed`, `heels lifted`, `shoe visible`, `standing with feet apart` | Delete | Delete in cowboy unless feet are explicitly visible by framing | Keep | Same pose visibility role check. |
| Upper-body posture | Keep `upper body leaning forward`, `shoulders angled`, `torso angled`, `head turned`, `chin direction` | Keep | Keep | Preserve, but run a conflict pass for gaze/head direction separately if approved. |
| Seated / standing identity | Rewrite instead of deleting when crop can imply posture: `sitting on the floor with grounded forward-leaning seated arrangement` -> `low seated posture with upper body leaning forward` | Keep posture, delete feet/shoes | Keep | Rewrite known patterns before generic deletion so output stays natural. |

Expected example:

```text
Before chest-up:
She is sitting on the floor with grounded forward-leaning seated arrangement; one hand supporting on floor or nearby surface, other hand resting on the leg.

After chest-up:
She holds a low seated posture with the upper body leaning forward.
```

### 4. Camera / Composition Clauses

These can contradict the selected crop even after wardrobe text is clean.

| Clause group | Delete or rewrite in close / portrait | Medium / cowboy policy | Full policy | Planned method |
| --- | --- | --- | --- | --- |
| Lower-body emphasis | `legs and shoes emphasized`, `full lower legs and feet clearly visible`, `legwear and shoes clearly visible`, `shoes clearly visible`, `bare feet clearly shown` | Delete shoes/feet emphasis; keep waist/knee composition only when selected framing supports it | Keep | Add `filterZImageCameraForFraming(...)` inside `buildCameraText()`. |
| Full-body pressure | `full-body composition`, `head-to-toe`, `complete outfit visible`, `full figure`, `full wardrobe visible` | Delete or replace with selected crop wording | Keep only if medium/cowboy wording matches selected framing | Keep | Remove incompatible add-on clauses generated by full-body helpers. |
| Low camera causing leg emphasis | `knee-level camera` in a tight bust-up / chest-up crop | Rewrite to `low portrait camera angle` or delete if it still pulls to legs | Keep only if it does not mention legs/feet | Keep | Use phrase rewrite table for known camera angle text. |
| Selected framing text | Keep selected framing itself | Keep | Keep | Never delete `tight bust-up portrait`, `chest-up framing`, `shoulders and torso visible`, etc. |

Expected example:

```text
Before chest-up:
The composition uses tight bust-up portrait, chest-up framing, shoulders and torso visible, knee-level camera, level lens axis, legs and shoes emphasized.

After chest-up:
The composition uses tight bust-up portrait, chest-up framing, shoulders and torso visible, low portrait camera angle, level lens axis.
```

### 5. Scene Priority / Environment Pressure

The scene should remain readable, but close crops should not force a wide room reveal.

| Scene clause group | Rewrite in close / portrait | Medium policy | Full policy | Planned method |
| --- | --- | --- | --- | --- |
| Full spatial context pressure | `clear spatial context`, `full room layout`, `complete environment readable`, `surrounding setting visible` | Replace with local background cues | Keep moderate environment readability | Keep | Make `buildZImageScenePriorityText()` framing-aware. |
| Local scene anchors | Keep compact visible cues: wall surface, lamp glow, bedding edge, window light, room color, close background shapes | Keep | Keep | Preserve existing location text but compact it for close/portrait. |

Expected example:

```text
Before chest-up:
Scene priority: keep the selected environment readable with clear spatial context.

After chest-up:
Scene priority: keep the small hotel room readable through close background cues, soft wall surfaces, lamp glow, and bedding-edge hints without widening the portrait crop.
```

### 6. Gaze / Head Direction Conflict Guard

This is not strictly wardrobe visibility, but the sample prompt exposed it clearly.

| Conflict | Current bad combination | Proposed behavior | Planned method |
| --- | --- | --- | --- |
| Eye contact vs away-facing side profile | `direct eye contact` plus `face oriented away from the camera` | Prefer the explicit pose/head-direction selection if selected later in B section, or rewrite to `three-quarter profile with readable facial features` if both must coexist | Add a small Z-Image conflict sanitizer after expression/head pose composition. |
| Clear facial readability vs face turned fully away | `clear facial readability` plus `face oriented away from the camera` | Replace away-facing wording with readable profile wording when close/portrait framing is selected | Phrase-level rewrite in pose/head direction sanitizer. |

This guard should be implemented only if approved with the visibility pass. If not approved, it can remain a separate follow-up.

## Explicit Non-Goals For This Pass

- Do not change PAGE1 UI labels.
- Do not change internal output field names.
- Do not change random generation probabilities.
- Do not clear user-selected locks.
- Do not remove head accessories, eyewear, headphones, earrings, or neck accessories from Subject identity text.
- Do not apply broad regex replacement to the final full prompt string. Filtering should happen at structured assembly points.
- Do not implement a dress visibility filter unless separately approved. Dress semantics cross top/bottom boundaries and need a dedicated pass.
- Do not change character profile signature outfits in this pass unless a selected character card emits explicit shoes/feet/lower-body text into `zImagePrompt` under close framing; that should be covered by tests before changing.

## Implementation Tasks

### Task 1: Add Z-Image visibility profile helpers

**Files:**
- Modify: `webapp/src/lib/engine.js`
- Test: `webapp/src/lib/engineZImageWardrobeLanguage.test.js`

- [ ] Add tests proving chest-up and face-close `zImagePrompt` omit lower-body wardrobe add-ons while preserving upper garments.
- [ ] Add helper functions near the existing complete-look helpers:
  - `getPromptVisibilityBucket(context)`
  - `shouldKeepWardrobeRoleForVisibility(role, bucket)`
  - `filterZImageWardrobeAddonForFraming(value, context)`
- [ ] Reuse the existing wardrobe fragment classifier where safe, but keep Z-Image wrapper names separate so the output-specific behavior is easy to audit.
- [ ] Run targeted tests:

```bash
cd /Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp
node --test src/lib/engineZImageWardrobeLanguage.test.js src/lib/engineWardrobeControls.test.js
```

Expected result after implementation: all targeted tests pass.

### Task 2: Filter Z-Image general wardrobe add-ons

**Files:**
- Modify: `webapp/src/lib/engine.js`
- Test: `webapp/src/lib/engineZImageWardrobeLanguage.test.js`

- [ ] Add failing tests for:
  - chest-up outfit preset plus selected legwear/shoes
  - chest-up normal separates plus selected pants/skirt/legwear/shoes
  - cowboy shot preserving bottoms but deleting shoes
- [ ] Apply visibility wrappers around:
  - `buildBottomWardrobePrompt(...)`
  - `buildColoredGrokPrompt(legwear...)`
  - `buildColoredGrokPrompt(shoes...)`
  - role-specific duo equivalents used by Z-Image
- [ ] Keep specialOutfit / outfitPreset body filtering as currently implemented.
- [ ] Run targeted tests:

```bash
cd /Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp
node --test src/lib/engineZImageWardrobeLanguage.test.js src/lib/engineWardrobeControls.test.js src/lib/engineSpecialOutfitCleanup.test.js src/lib/engineOutfitPresetDressCleanup.test.js
```

Expected result after implementation: all targeted tests pass.

### Task 3: Filter Z-Image body descriptors

**Files:**
- Modify: `webapp/src/lib/engine.js`
- Test: `webapp/src/lib/enginePromptPipeline.test.js`

- [ ] Add failing tests proving chest-up `zImagePrompt` removes `wider hips` while preserving visible portrait identity, hair, face, and upper-body descriptors.
- [ ] Implement `filterZImageBodyTypeForFraming(value, context)` before body type text enters `buildCharacterText()`.
- [ ] Rewrite known full-body body labels only when there is a safe visible substitute:
  - `soft hourglass body` -> `soft upper-body curves` for close / portrait
- [ ] Delete lower-body-only clauses:
  - hips
  - legs
  - thighs
  - knees
  - feet
- [ ] Run targeted tests:

```bash
cd /Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp
node --test src/lib/enginePromptPipeline.test.js src/lib/engineZImageWardrobeLanguage.test.js
```

Expected result after implementation: all targeted tests pass.

### Task 4: Filter Z-Image pose clauses

**Files:**
- Modify: `webapp/src/lib/engine.js`
- Test: `webapp/src/lib/enginePromptPipeline.test.js`

- [ ] Add failing tests using a chest-up floor-seated pose with lower-body hand/leg anchors.
- [ ] Implement `filterZImagePoseForFraming(value, context)` after pose text resolution and before Z-Image pose sentence output.
- [ ] Rewrite known useful posture patterns:
  - `sitting on the floor with grounded forward-leaning seated arrangement` -> `low seated posture with the upper body leaning forward`
- [ ] Delete lower-body clauses:
  - floor support
  - hand on leg/thigh/knee
  - foot/shoe action
  - knees and lower-leg arrangement
- [ ] Preserve visible clauses:
  - upper body lean
  - shoulders / torso angle
  - head direction
  - hands near face/chest/shoulders
- [ ] Run targeted tests:

```bash
cd /Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp
node --test src/lib/enginePromptPipeline.test.js src/lib/engineFixedCompositionSet.test.js
```

Expected result after implementation: all targeted tests pass.

### Task 5: Filter Z-Image camera and scene pressure

**Files:**
- Modify: `webapp/src/lib/engine.js`
- Test: `webapp/src/lib/enginePromptPipeline.test.js`

- [ ] Add failing tests for chest-up `zImagePrompt` showing no `legs and shoes emphasized`, no shoe/feet visibility add-ons, and no full-room widening pressure.
- [ ] Implement `filterZImageCameraForFraming(value, context)` inside `buildCameraText()`.
- [ ] Implement framing-aware scene priority in `buildZImageScenePriorityText()`.
- [ ] Preserve selected crop words:
  - `tight bust-up portrait`
  - `chest-up framing`
  - `shoulders and torso visible`
- [ ] Rewrite incompatible low camera text:
  - `knee-level camera` -> `low portrait camera angle` for close / portrait
- [ ] Run targeted tests:

```bash
cd /Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp
node --test src/lib/enginePromptPipeline.test.js src/lib/engineFixedCompositionSet.test.js src/lib/engineWardrobeControls.test.js
```

Expected result after implementation: all targeted tests pass.

### Task 6: Optional gaze / head conflict guard

**Files:**
- Modify: `webapp/src/lib/engine.js`
- Test: `webapp/src/lib/enginePromptPipeline.test.js`

- [ ] Add failing test for a prompt that currently emits both `direct eye contact` and `face oriented away from the camera`.
- [ ] Implement `filterZImageGazeHeadDirectionConflicts(value, context)` only for Z-Image.
- [ ] If close / portrait framing asks for clear facial readability, rewrite fully-away profile wording to readable profile wording.
- [ ] Run targeted tests:

```bash
cd /Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp
node --test src/lib/enginePromptPipeline.test.js
```

Expected result after implementation: all targeted tests pass.

## Final Verification

After approved implementation:

```bash
cd /Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp
npm test
npm run lint
npm run build
cd /Users/cooperfu/Desktop/Virtual_Photography_Studio
git diff --check
```

Expected result:

- `npm test`: all tests pass
- `npm run lint`: exit 0
- `npm run build`: exit 0, allowing the existing Vite chunk-size warning
- `git diff --check`: exit 0

## Confirmation Questions

1. Should this pass target only `Grok/Z-Image` (`zImagePrompt`), or should the same broad visibility sanitizer also apply to `Gpt` and `AI` immediately?
2. Should Task 6, the gaze / head conflict guard, be included in this pass or kept as a separate follow-up?
3. Should dress visibility remain excluded for now, as listed in non-goals?
