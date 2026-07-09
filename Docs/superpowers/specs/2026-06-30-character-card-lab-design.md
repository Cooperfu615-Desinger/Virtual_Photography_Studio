# Character Card Lab Design

## Goal

Replace the current PAGE2 face-only character builder with a `Character Card Lab` that serves as the detailed editor for PAGE1 `A 人物設定`.

PAGE2 should let the user select an existing built-in character card, choose a character-safe hair styling variant, decide which default wardrobe layers should travel back to PAGE1, preview six copyable prompt outputs, and import the resulting character-card variant back into PAGE1.

PAGE2 is not a user-facing character-card database manager. New built-in character cards, deletions, and permanent card data changes remain codebase work handled through Codex.

## Current Context

Current PAGE1 character cards live in `webapp/src/lib/engine.js` as `CHARACTER_PROFILE_OPTIONS`.

Each card already has:

- stable identity/body wording
- hair wording
- outfit wording
- accessories wording
- photographic direction
- reference image metadata

Current behavior treats a character card as a dedicated subject. When selected, the card replaces normal identity and disables PAGE1 wardrobe generation entirely. This is too coarse for the new workflow.

Current PAGE2 is a separate face-reference builder with fields for eyes, brows, nose, lips, face shape, skin, and makeup. It produces Face Anchor, Identity Prompt, Master Sheet, individual views, Core Views, and Prompt Bundle. It does not share the PAGE1 character-card data model.

## Product Model

PAGE2 becomes the detailed character-card variant editor for PAGE1.

PAGE1 remains the main shooting and styling workspace:

- pose
- scene
- lighting
- camera
- final wardrobe completion
- generation panel
- saved cards

PAGE2 owns the character-card source state:

- selected built-in character card
- character identity details
- base hair identity
- hair styling variant
- which default wardrobe layers are included
- six character-card prompt outputs
- import/apply behavior back to PAGE1

## Data Model

Add a structured character-card representation derived from the existing card data.

```js
characterCard = {
  id,
  label,
  identityAndBody,
  face,
  skin,
  makeup,
  baseHair,
  hairTags,
  defaultWardrobeLayers: {
    top,
    bottom,
    dress,
    outerwear,
    shoes,
    headAccessory,
    eyewear,
    earrings,
    neckAccessory,
    wristAccessory,
    ring,
    waistAccessory
  },
  photographicDirection,
  referenceImages
}
```

PAGE2 edits a temporary variant, not a new permanent card.

```js
characterCardVariant = {
  characterProfileId,
  hairVariantId,
  eyewearMode,
  includedWardrobeLayers,
  promptOverrideText,
  outputMode
}
```

`includedWardrobeLayers` is a set of layer ids selected in PAGE2. It controls which character-card wardrobe layers are imported into PAGE1.

`outputMode` has two values:

- `pure-character`: identity, body, face, skin/makeup, and hair variant only
- `included-wardrobe`: pure-character content plus the PAGE2-selected wardrobe layers

`eyewearMode` is a planned v1.1 UIUX extension:

- `default`: follow the character card's default eyewear state
- `glasses-on`: force/import eyewear as part of the character-card variant
- `glasses-off`: remove or suppress eyewear from the imported character-card variant

Because eyewear must be able to import back to PAGE1, it should be treated as structured character-card variant state rather than a visual-only UI toggle.

## Hair Variants

Pure-character output keeps hair. A pure-character prompt means:

- identity
- body
- face
- skin/makeup
- base hair identity
- selected hair styling variant
- no wardrobe layers

Hair variants should never replace the entire hairstyle with an unrelated hairstyle. They modify the card's base hair identity.

Use a shared hair-variant library plus per-card enable/disable overrides.

```js
hairVariant = {
  id,
  label,
  compatibleTags,
  prompt,
  cardEnableIds,
  cardDisableIds
}
```

Examples:

- long hair: loose default, low ponytail, high ponytail, twin tails, half-up style, loose bun, highlight streaks
- medium / lob: tucked behind ears, half-up, outward-flipped ends, damp styling, subtle highlight streaks
- bob / short hair: tucked behind ears, slicked-back wet look, airy tousled volume, outward-flipped ends, hair clips, subtle highlight streaks
- bangs-aware variants: keep bangs, stronger airy bangs, side-parted bangs, slightly wet bangs

PAGE2 filters options by `hairTags`, then applies each card's enable/disable overrides.

## Wardrobe Layer Rules

Character-card wardrobe must be split into the same conceptual layers PAGE1 already uses.

The first implementation can map each existing card by curated structured data rather than attempting broad automatic string parsing.

PAGE2 decides which character-card wardrobe layers are imported into PAGE1.

Examples for Rika:

- top: cropped white baby tee
- bottom: low-rise light-wash jeans
- shoes: white low-top sneakers
- neckAccessory: black-and-white beaded choker

If PAGE2 imports only Rika's top, PAGE1 receives only the top as a character-card layer. PAGE1 can then add or choose its own skirt, shoes, outerwear, eyewear, earrings, and other accessories.

## PAGE2 UI

V1 PAGE2 has the required character-card editor controls and six prompt outputs. The next UIUX polish should reorganize the same behavior into a clearer two-block operational layout.

### V1 Character Card Selection

Show built-in character cards with:

- card label
- primary reference thumbnail
- identity summary
- available reference image thumbnails where useful

Selecting a card updates the active temporary variant.

### Character And Hair

Show:

- identity/body summary
- face/skin/makeup summary
- base hair identity
- compatible hair styling variants

The selected hair variant modifies the prompt wording while preserving the base hair identity.

### Wardrobe Include

Show the card's available default wardrobe layers as selectable layer rows.

Each row should show:

- layer name
- card source label
- concise English prompt fragment
- included/excluded state

PAGE2 is the only place to change which character-card wardrobe layers are imported. PAGE1 displays imported layers but does not directly clear or edit them.

### V1.1 UIUX Polish Direction

The user approved this direction on 2026-07-09 through low-fidelity wireframe discussion.

The PAGE2 interface should be split into two vertical blocks.

Top block: character-card setup and PAGE1 import controls.

- Character-card grid shows 10 large cards at a time.
- Arrange visible character cards as 5 columns x 2 rows on desktop.
- Cards should be larger than the initial v1 cards.
- Each character card only needs:
  - preview image
  - character name
- Remove long default character descriptions from the visible UI.
- Future capacity target is at least 40 built-in characters, but do not display all 40 at once.
- Add a glasses / eyewear option:
  - `預設`
  - `戴眼鏡`
  - `不戴眼鏡`
- Eyewear must be able to import back to PAGE1.
- Wardrobe import controls should be compact buttons rather than large rows/cards.
- The primary PAGE1 action remains `匯回 PAGE1`.

Bottom block: prompt actions and DLL PIC Pro.

- Six prompt outputs should still be generated internally.
- The main PAGE2 UI should show copy-only buttons by default instead of long prompt text boxes.
- Copy buttons:
  - `Copy GPT`
  - `Copy Grok/Z-Image`
  - `Copy AI Prompt`
  - `Copy 大頭照`
  - `Copy 四視圖`
  - `Copy 全身 Reference`
- DLL PIC Pro should use a dropdown prompt-source selector to choose from the six generated prompt outputs.
- Clicking copy buttons does not need to change the DLL PIC Pro prompt source.

Open implementation details:

- Navigation beyond the 10 visible character cards: pagination, carousel, or internal scroll.
- Exact import behavior for `不戴眼鏡` when PAGE1 already has eyewear selected.
- Whether compact wardrobe import buttons should show explicit `帶入` / `交給 PAGE1` text or active state only.

## Six Prompt Outputs

PAGE2 produces six copyable outputs. V1 used prompt preview cards; the v1.1 UIUX direction is to keep the outputs but collapse the visible main UI to copy buttons, with long text hidden by default or available through detail/modal behavior if needed.

It should produce six copyable outputs:

1. `GPT Prompt`
   - structured natural prompt for GPT Image
   - contains selected identity, hair variant, and included wardrobe layers

2. `Grok/Z-Image Prompt`
   - more natural-language version for Grok Imagine / Aurora / Z-Image

3. `AI Prompt`
   - compact prompt version
   - should preserve selected identity, hair variant, and included wardrobe layers

4. `Headshot Prompt`
   - focused headshot / avatar reference prompt
   - emphasizes face, makeup, skin, and selected hair variant
   - omits wardrobe except visible neckline/accessory cues when included and relevant

5. `Four-View Prompt`
   - one-sheet reference prompt for front, 45-degree, side profile, and back view
   - emphasizes consistent face and hair across views
   - can include included wardrobe layers only when the output mode is not pure-character

6. `Full-Body Reference Prompt`
   - full-body reference prompt
   - includes identity, body, selected hair variant, and PAGE2-included wardrobe layers
   - if no wardrobe layers are included, describes a neutral body reference state without importing PAGE1 wardrobe assumptions

The DLL PIC Pro panel on PAGE2 should use these six prompt sources. A good default source is `Full-Body Reference Prompt`, because PAGE2's main job is creating reusable character-card reference material.

## Import Back To PAGE1

PAGE2 supports two import modes.

### Structured Apply

This is the normal import path.

It writes structured character-card variant state into PAGE1:

- selected `characterProfileId`
- selected hair variant
- selected character-card wardrobe layers

It can replace PAGE1 `A 人物設定` and selected PAGE1 `C 穿搭設定` layers according to PAGE2's included layer set.

### Prompt Override

This is an advanced import path.

It injects a generated character description into PAGE1 as a temporary prompt override. It is for testing one-off variants or card wording that is not ready to be formal structured data.

Prompt Override should not be the default path.

## PAGE1 Merge And Display Behavior

PAGE1 should keep all C wardrobe fields visible.

Imported character-card layers are displayed in their corresponding PAGE1 layer positions as:

```text
來自角色卡｜Rika 預設上身
```

PAGE1 can fill any wardrobe layer not imported from PAGE2.

PAGE1 does not directly clear or edit imported character-card layers. To change which card layers are imported, the user returns to PAGE2, changes the included layers, and imports again.

## Reimport Rules

Reimporting from PAGE2 should be predictable.

If PAGE2 does not include a wardrobe layer:

- do not touch the PAGE1 selection for that layer

If PAGE2 includes a wardrobe layer:

- PAGE2's character-card layer wins
- clear the PAGE1 selection for the same layer
- display the imported layer as `來自角色卡`

Reimporting should not alter unrelated PAGE1 state:

- pose
- scene
- lighting
- camera
- PAGE1 wardrobe layers not included by PAGE2
- Saved Cards state

Example:

1. PAGE2 imports Rika with only top included.
2. PAGE1 user selects skirt, high heels, and necklace.
3. PAGE2 reimports Rika with top and bottom included.
4. PAGE1 clears its bottom/skirt selection and uses Rika's imported bottom.
5. PAGE1 keeps high heels and necklace because PAGE2 did not include shoes or neck accessory.

## Prompt Engine Changes

The engine needs to separate character identity source from wardrobe source.

Current behavior:

```text
character card selected -> special subject mode -> PAGE1 wardrobe disabled
```

New behavior:

```text
character identity source = normal | special subject | character card variant
wardrobe source per layer = character card layer | PAGE1 wardrobe layer | none/random
```

Character-card identity should still produce the current strong Gpt subject grouping:

- Character Profile Card
- Identity and body
- Hair
- Outfit, only for included card wardrobe layers
- Accessories, only for included accessory layers
- Photographic direction

PAGE1 generated prompts must preserve the current output labels and historical field names:

- `Gpt` stored in `grokPrompt`
- `Grok/Z-Image` stored in `zImagePrompt`
- `AI` stored in `midjourneyPrompt`

## Saved Cards

Saved Cards should support PAGE2 character-card outputs.

PAGE2 saved cards should store:

- source: `page2`
- selected character card id
- hair variant id
- included wardrobe layers
- six prompt outputs

PAGE1 saved cards should store imported character-card variant state in their selection snapshot so restore can rebuild the same PAGE1 result.

Old PAGE2 saved cards from the face-only builder should remain visible and copyable in Saved Cards as legacy cards. They do not restore into the new PAGE2 editor.

## SUNO Removal

SUNO should be removed from this app's main product flow because the user plans a separate music prompt tool.

Recommended removal strategy:

1. Remove SUNO from the main navigation.
2. Remove `PageSunoWorkspace` rendering from `App.jsx`.
3. Stop creating new `page5` Saved Cards.
4. Keep old `page5` saved-card display compatibility initially so existing local/Firebase data does not break.
5. Remove `suno.js`, `suno.test.js`, and related CSS only after old-card compatibility is intentionally retired.

The first implementation should not delete user data.

## Testing Plan

Add or update focused tests before broad UI testing:

- character-card data exposes structured wardrobe layers
- hair variant filtering respects shared tags and per-card enable/disable overrides
- PAGE2 prompt bundle returns exactly six prompt outputs
- pure-character output keeps hair and excludes wardrobe
- PAGE2 structured apply imports selected card layers into PAGE1
- PAGE2 reimport clears PAGE1 same-layer selections only for included layers
- PAGE2 reimport preserves unrelated PAGE1 wardrobe, pose, scene, lighting, and camera selections
- PAGE1 prompt engine combines character-card layers with PAGE1-filled layers
- Gpt / Grok-Z-Image / AI preserve selected identity, hair variant, and wardrobe layers
- old PAGE1 character-card behavior remains compatible when no PAGE2 variant exists
- SUNO navigation removal does not break old saved-card display

Run the standard validation after implementation:

- `npm test`
- `npm run lint`
- `npm run build`

When knowledge-base markdown changes, also run:

- `python3 scripts/sync_to_json.py`

## Non-Goals For V1

V1 does not include:

- user-created permanent character cards
- character-card CRUD UI
- Firebase sync for editable character-card definitions
- replacing PAGE1 scene, lighting, pose, or camera workflows
- applying Pose Composer to duo character-card variants
- deleting old SUNO saved-card records

## Recommended Implementation Phases

### Phase 1: Data Model And Prompt Helpers

Create character-card structured helpers, hair variant library, wardrobe layer mapping, and PAGE2 six-output prompt builder.

### Phase 2: PAGE2 Character Card Lab UI

Replace current PAGE2 face builder with card selection, hair variant selection, wardrobe include controls, six prompt outputs, and DLL PIC Pro sources.

### Phase 3: PAGE1 Import And Merge

Add structured apply and prompt override paths. Update PAGE1 display so imported card layers show as `來自角色卡`. Update engine merge logic.

### Phase 4: Saved Cards And Legacy Compatibility

Persist PAGE2 variants and PAGE1 imported variant selections. Keep legacy PAGE2 and page5 cards readable.

### Phase 5: SUNO Product Removal

Remove SUNO from the active app flow while preserving old saved-card display compatibility.
