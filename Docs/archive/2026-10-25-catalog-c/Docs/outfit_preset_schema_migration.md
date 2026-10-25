# Outfit Preset Schema Migration Plan

## Goal

Refactor current `套裝 (Outfit Presets)` handling from a single-color preset model:

- `outfitPresetId`
- `outfitPresetColorId`

into a structured outfit-color system that supports:

- `主色`
- `對比色`
- `鎖定色`

while preserving compatibility with:

- existing knowledge-base sync
- current prompt generation
- Favorites restore
- import/export selection snapshots
- duo mode (`outfitPresetA/B`)

This document only covers `套裝` and its migration path. It does not yet merge `套裝` and `連身`.

## Current State

### Current knowledge-base format

`knowledge_base/wardrobe_and_styling.md` currently stores outfit presets as plain rows:

| 維度分類 | 參數名稱 | 英文 Prompt 關鍵字 | 視覺與材質說明 |
| --- | --- | --- | --- |

After `scripts/sync_to_json.py`, they become:

```json
{
  "zh": "兔女郎套裝",
  "en": "wearing a bunny girl outfit, ...",
  "desc": "..."
}
```

There is no schema for:

- outfit series (`日常` / `特色`)
- color mode
- primary/contrast/locked target areas
- locked-color policy

### Current frontend/runtime model

`webapp/src/lib/engine.js` currently treats outfit preset colors as a single color token:

- `OUTFIT_PRESET_COLOR_OPTIONS`
- `outfitPresetColorId`
- `outfitPresetAColorId`
- `outfitPresetBColorId`

Prompt generation currently uses:

```js
buildColoredGrokPrompt(item, color, { preset: true })
```

For presets, this resolves to:

```js
return `${color.en} ${base.replace(/^wearing\s+/i, '')}`;
```

So current preset coloring is effectively:

- one selected color
- prefixed onto the preset prompt
- no structural understanding of which outfit parts should receive which color

### Current compatibility surface

The following systems currently depend on single-color preset fields:

- `LOCK_DEFINITIONS`
- prompt summary formatting
- import/export selection snapshot
- restore from Favorites
- remix group lock lists
- duo mode preset selection

Relevant persisted keys:

- `outfitPresetId`
- `outfitPresetColorId`
- `outfitPresetAId`
- `outfitPresetAColorId`
- `outfitPresetBId`
- `outfitPresetBColorId`

## Target Model

## Design Principles

1. Outfit presets must support a common color model.
2. Not every preset must use all three layers.
3. `鎖定色` should be optional and sparse.
4. `日常系列` should mostly use `主色 + 對比色`.
5. `特色系列` may use `主色 + 對比色 + 鎖定色`.
6. Old saved prompts must still restore cleanly.

## New preset metadata schema

Each outfit preset should become a richer object.

### Proposed shape

```json
{
  "zh": "兔女郎套裝",
  "en": "wearing a bunny girl outfit, fitted corset bodice, satin or stretch fabric finish, sweetheart neckline, structured bodysuit silhouette, crisp contrast cuffs and collar, playful rabbit-ear headband, polished cabaret styling",
  "desc": "以兔耳頭飾、貼身馬甲式連身輪廓、袖口與領圈構成的高辨識度主題套裝。",
  "meta": {
    "series": "signature",
    "colorMode": "primary_contrast_locked",
    "contrastBehavior": "strong",
    "lockedOptional": true,
    "colorTargets": {
      "primary": ["bodysuit_body"],
      "contrast": ["cuffs", "collar"],
      "locked": ["classic_cuff_collar_scheme"]
    },
    "renderHints": {
      "preserveContrastCrispness": true,
      "avoidMonochromeMerge": true
    }
  }
}
```

## Enumerations

### `series`

User-facing grouping:

- `daily`
- `signature`

Display mapping:

- `daily` -> `日常系列`
- `signature` -> `特色系列`

### `colorMode`

- `primary`
- `primary_contrast`
- `primary_contrast_locked`

### `contrastBehavior`

Defines how far apart primary and contrast colors are allowed to feel:

- `soft`
- `balanced`
- `strong`

Examples:

- Paris daily layered set -> `soft`
- commuter / minimal sets -> `balanced`
- bunny girl / maid / gothic -> `strong`

### `lockedOptional`

Boolean:

- `false`: locked targets should always be preserved
- `true`: locked targets represent a classic-mode scheme and may later become configurable

## Target IDs and color controls

### Replace current single-color preset fields with layered fields

Current:

- `outfitPresetColorId`
- `outfitPresetAColorId`
- `outfitPresetBColorId`

Target:

- `outfitPresetPrimaryColorId`
- `outfitPresetContrastColorId`
- `outfitPresetLockedPaletteId`
- `outfitPresetAPrimaryColorId`
- `outfitPresetAContrastColorId`
- `outfitPresetALockedPaletteId`
- `outfitPresetBPrimaryColorId`
- `outfitPresetBContrastColorId`
- `outfitPresetBLockedPaletteId`

### Why `LockedPaletteId` instead of `LockedColorId`

`鎖定色` is not always a single literal color. In some presets it may mean:

- metallic hardware
- white maid apron
- black gothic trim bundle
- school-uniform trim scheme

So the locked layer should be represented as a palette/scheme identifier rather than a generic flat color.

Examples:

- `none`
- `metallic-gold`
- `metallic-silver`
- `classic-black-trim`
- `classic-white-apron`
- `classic-school-navy-trim`

## Target prompt assembly model

## Problem with current model

Current preset rendering only prepends a color word to the whole preset string:

```js
blue wearing a bunny girl outfit ...
```

This is too shallow for:

- mixed fabric outfits
- contrast trim
- locked metallic details
- clean role costume preservation

## New assembly strategy

Preset prompt should become:

1. base outfit description
2. auto-appended color application clauses generated from metadata

### Proposed rendering pipeline

```js
buildOutfitPresetPrompt(preset, colors)
```

Where:

- `preset` provides base text + metadata
- `colors` provides selected primary/contrast/locked palette

### Example output pattern

```text
wearing a bunny girl outfit, fitted corset bodice, satin or stretch fabric finish, sweetheart neckline, structured bodysuit silhouette, crisp contrast cuffs and collar, playful rabbit-ear headband, polished cabaret styling, main bodysuit in red, cuffs and collar in white, classic costume contrast kept clean and crisp
```

### Example for metallic locked scheme

```text
wearing a retro double-breasted dress outfit, ..., main dress fabric in navy, trim accents and neck bow in cream, gold buttons kept in fixed metallic gold
```

## Proposed helper functions

Introduce new helpers in `engine.js`:

- `buildOutfitPresetColorState()`
- `buildOutfitPresetPrompt()`
- `buildLockedPalettePrompt()`
- `formatOutfitPresetSummary()`

### Suggested shape for runtime color state

```js
{
  primary: { id: 'red', zh: '紅色', en: 'red' },
  contrast: { id: 'white', zh: '白色', en: 'white' },
  lockedPalette: { id: 'classic-white-apron', zh: '經典白圍裙', en: 'classic white apron' }
}
```

## Data storage and sync migration

## Current sync limitation

`scripts/sync_to_json.py` only supports Markdown tables with flat row values.

That is not enough for the new preset metadata model.

## Proposed migration approach

Do not overload `wardrobe_and_styling.md` with complex inline JSON inside the table.

Instead, split outfit preset metadata into a dedicated companion file.

### Recommended structure

Keep:

- `knowledge_base/wardrobe_and_styling.md`

Add:

- `knowledge_base/outfit_preset_metadata.json`

### Companion metadata file example

```json
{
  "兔女郎套裝": {
    "series": "signature",
    "colorMode": "primary_contrast_locked",
    "contrastBehavior": "strong",
    "lockedOptional": true,
    "colorTargets": {
      "primary": ["bodysuit_body"],
      "contrast": ["cuffs", "collar"],
      "locked": ["classic_cuff_collar_scheme"]
    }
  }
}
```

### Sync behavior

Update `scripts/sync_to_json.py` to:

1. parse the Markdown table as usual
2. load `knowledge_base/outfit_preset_metadata.json`
3. merge metadata into matching `套裝 (Outfit Presets)` entries by `zh`
4. emit merged objects into `database.json`

### Why this is preferable

Benefits:

- keeps authoring readable
- avoids brittle Markdown-embedded JSON
- allows metadata schema to evolve independently
- makes migration incremental

## Database output target

After sync, `database.json` preset items should look like:

```json
{
  "zh": "復古雙排釦洋裝套裝",
  "en": "wearing a classic elegant dress outfit, ...",
  "desc": "以高腰洋裝、雙排金釦胸身為重點的復古套裝。",
  "meta": {
    "series": "signature",
    "colorMode": "primary_contrast_locked",
    "contrastBehavior": "balanced",
    "lockedOptional": false,
    "colorTargets": {
      "primary": ["dress_body"],
      "contrast": ["trim", "neck_bow", "inner_accent_line", "lace_underskirt"],
      "locked": ["gold_buttons"]
    }
  }
}
```

## Frontend control migration

## UI control changes

Current controls:

- `套裝`
- `套裝配色`

Target controls:

- `套裝`
- `套裝主色`
- `套裝對比色`
- `套裝鎖定色方案`

For duo mode:

- `人物 1 套裝主色`
- `人物 1 套裝對比色`
- `人物 1 套裝鎖定色方案`
- `人物 2 套裝主色`
- `人物 2 套裝對比色`
- `人物 2 套裝鎖定色方案`

## Recommended option pools

### Primary color options

Reuse current outfit color palette and expand if needed:

- white
- black
- red
- blue
- green
- yellow
- pink
- silver
- gold
- etc.

### Contrast color options

Separate list recommended.
Should allow:

- neutrals
- high-contrast pairings
- saturated accents

### Locked palette options

Dedicated list:

- `none`
- `metallic-gold`
- `metallic-silver`
- `classic-black-trim`
- `classic-white-apron`
- `classic-school-navy-trim`

This should not share the same option pool as normal garment colors.

## Summary / remix / export migration

These systems must be updated:

- summary labels
- remix lock groups
- exported selection snapshot
- import restore
- favorites serialization

### Summary format target

Current summary:

```text
兔女郎套裝（黑白）
```

Target summary:

```text
兔女郎套裝（主色：紅色 / 對比色：白色 / 鎖定：經典白領袖）
```

When fields are absent:

- omit missing layers
- do not print empty tokens

### Remix lock groups

Current keys:

- `outfitPresetColorId`
- `outfitPresetAColorId`
- `outfitPresetBColorId`

Target keys:

- `outfitPresetPrimaryColorId`
- `outfitPresetContrastColorId`
- `outfitPresetLockedPaletteId`
- `outfitPresetAPrimaryColorId`
- `outfitPresetAContrastColorId`
- `outfitPresetALockedPaletteId`
- `outfitPresetBPrimaryColorId`
- `outfitPresetBContrastColorId`
- `outfitPresetBLockedPaletteId`

## Backward compatibility plan

## Why compatibility matters

Current persisted prompt selections already exist in:

- Favorites local storage
- Firebase favorites
- imported ZIP feeds

These may contain only:

- `outfitPresetColorId`

## Compatibility strategy

### Phase 1: Dual read, old write still supported

During migration rollout:

- continue reading `outfitPresetColorId`
- map it into `outfitPresetPrimaryColorId` if new fields are missing
- leave `contrast` empty by default
- leave `lockedPalette` empty by default

Mapping rule:

```js
if (!selection.outfitPresetPrimaryColorId && selection.outfitPresetColorId) {
  selection.outfitPresetPrimaryColorId = selection.outfitPresetColorId;
}
```

Same for duo keys.

### Phase 2: New write, old read fallback

Once UI and engine are migrated:

- export only new keys
- still accept old keys during restore/import

### Phase 3: Cleanup

After enough stability:

- remove old single-color keys from runtime internals
- keep one legacy migration shim in restore/import path only

## Suggested implementation steps

## Phase A: Non-breaking schema prep

1. Add `knowledge_base/outfit_preset_metadata.json`
2. Update `scripts/sync_to_json.py` to merge metadata into outfit preset rows
3. Keep old runtime behavior unchanged
4. Confirm `database.json` now includes preset metadata

## Phase B: Runtime color-model prep

1. Add new lock keys for primary/contrast/locked palette
2. Keep reading old `outfitPresetColorId`
3. Introduce a new helper:

```js
normalizeLegacyOutfitPresetColors(selection)
```

4. Update summary/export snapshot shape to include new keys
5. Keep old keys as fallback only

## Phase C: Prompt builder migration

1. Replace preset usage of `buildColoredGrokPrompt(..., { preset: true })`
2. Add `buildOutfitPresetPrompt(preset, colorState)`
3. Generate color clauses from `meta.colorTargets`
4. Preserve old behavior for presets with missing metadata

Fallback rule:

- if preset has no metadata, treat it as `primary`
- render like old single-color preset behavior

## Phase D: UI migration

1. Replace `套裝配色` with layered controls
2. Hide/disable irrelevant controls depending on `colorMode`
3. If `colorMode === primary`, only show primary color
4. If `colorMode === primary_contrast`, show primary + contrast
5. If `colorMode === primary_contrast_locked`, show locked palette selector when the preset defines locked targets

## Phase E: Persistence cleanup

1. Export new fields only
2. Keep restore/import fallback for old fields
3. Migrate Firebase/local favorites lazily on save

## Concrete file impact map

### Knowledge base / sync

- `knowledge_base/wardrobe_and_styling.md`
- `knowledge_base/outfit_preset_metadata.json` (new)
- `scripts/sync_to_json.py`

### Runtime / prompt generation

- `webapp/src/lib/engine.js`

Key areas:

- `OUTFIT_PRESET_COLOR_OPTIONS`
- `LOCK_DEFINITIONS`
- `buildWardrobeColors`
- `buildColoredGrokPrompt`
- summary formatting
- selection snapshot export/import

### UI / control ordering

- `webapp/src/App.jsx`

Key areas:

- summary lock groups
- wardrobe control order
- field labels
- export/import handling

## Recommended first implementation slice

The safest first slice is:

1. add companion metadata file
2. sync metadata into `database.json`
3. add new selection keys with legacy fallback
4. do not change the visible UI yet

This gives:

- schema stability
- backward compatibility
- safe iteration room before changing the prompt builder

## Open decisions

These need final product decisions before Phase D:

1. Should `鎖定色方案` always be user-selectable, or auto-resolved per preset?
2. Should `lockedOptional: true` presets expose a UI toggle for “classic scheme”?
3. Should `日常系列 / 特色系列` appear as a visible group in the current outfit selector, or only as metadata first?
4. Should `素色緞面旗袍套裝` remain truly `primary` only, or force all presets into at least `primary_contrast` for UI consistency?

## Recommendation

Recommended implementation order:

1. schema first
2. compatibility second
3. prompt-builder third
4. UI last

That order minimizes breakage to:

- favorites restore
- duo mode
- prompt exports
- existing saved selections
