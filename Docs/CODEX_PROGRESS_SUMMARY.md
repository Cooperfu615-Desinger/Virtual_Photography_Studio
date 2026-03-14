# Virtual Photography Studio Progress Summary

## Project Direction
- This project is a prompt workbench for generating editorial/fashion portrait prompts.
- Current workflow is:
  1. Photography
  2. Character
  3. Wardrobe
- `Grok Structured Prompt` is the main editable control format.
- `Midjourney Prompt` is a condensed natural-language prompt generated from the same selection state.

## Core Product Decisions
- `Photography Style` is now the primary photography-language control.
- When `Photography Style` is selected, the camera UI enters a simplified mode and only keeps:
  - `Aspect Ratio`
  - `Framing`
  - `Angle`
  - `Orbit Angle`
  - `Location`
- In style-driven camera mode, `Lighting / Light Direction / Film` are hidden and omitted from the prompt.
- When `Photography Style` is not selected, full manual camera controls remain available.

## Prompt Output Rules
- `Grok Structured Prompt`
  - English key-value format
  - Omits fields whose selection is `全無`
  - Used as the main controllable prompt format
- `Midjourney Prompt`
  - Uses a shorter, de-duplicated composition strategy
  - Avoids overloading with repeated `portrait` wording
  - Style language is shorter and more camera-safe than Grok output

## Photography Style System
- `regional_portrait_styles.md` has been refactored into photographer-based styles.
- Style names are now photographer names, for example:
  - `Mika Ninagawa（蜷川實花）`
  - `Yoshihiko Ueda（上田義彥）`
  - `Rinko Kawauchi（川內倫子）`
  - `Juergen Teller（尤爾根・特勒）`
  - `Elsa Bleda（艾爾莎·布萊達）`
- Style descriptions were rewritten to be:
  - photographer-inspired
  - visual-language focused
  - less likely to force close-up beauty portraits
- A large prompt cleanup removed repeated `portrait`-heavy phrasing that was making Grok Imagine generate too many big-head shots.

## Character System
- Body types currently kept:
  - `正常人`
  - `模特兒`
  - `性感`
- `豐腴` was removed.
- `Skin Tone` was removed; only `Skin Details` remains.
- Duo mode now supports split controls for:
  - `Facial Features A / B`
  - `Hairstyle A / B`
  - `Hair Color A / B`
- Duo prompt logic was adjusted to reduce identical-twin outputs.

## Duo Logic
- Added `Duo Interaction`:
  - `互動自然`
  - `互動親密`
  - `各自為立`
- Added `Duo Styling`:
  - `呼應穿搭`
  - `對比穿搭`
  - `各自獨立`
- Duo prompts also include a stabilizing distinction hint:
  - `clearly distinct women, not identical twins, individual facial character`

## Wardrobe System
- Wardrobe is moving toward two modes:
  1. Outfit preset mode
  2. Free single-item composition mode
- `Outfit Presets` now exist and are meant to be the highest-level wardrobe control.
- Duo mode supports:
  - `人物 A 套裝`
  - `人物 B 套裝`
- If an outfit preset is selected, granular wardrobe items are suppressed in prompt output.
- `Jewelry & Piercings` is multi-select and supports up to 3 items.

## Important Wardrobe Migration Note
- Source data in `knowledge_base/wardrobe_and_styling.md` has already been converted away from `風格基調 (Vibe)` and toward `套裝 (Outfit Presets)`.
- Runtime still had stale `Wardrobe Core / wardrobeVibe` logic after the source migration.
- Current in-progress fix:
  - remove `wardrobeVibeId` from runtime lock definitions
  - remove `Wardrobe Core` prompt output
  - remove old vibe-based family selection from engine
  - make outfit presets the only top-level wardrobe preset mechanism
- This is the main unfinished migration to verify after reopening work.

## Scene / Location Work
- `locations_and_sets.md` was rewritten to reduce “wide avenue / corridor / central vanishing point” generation.
- Many broad locations were replaced with more local, human-photo-friendly scene descriptions.
- Example direction:
  - not “long street”
  - more “corner, storefront edge, room detail, bed, shelves, window area”

## Camera / Lighting Work
- Added three high-key soft-light variants:
  - `逆光的高曝光柔光`
  - `側光的高曝光柔光`
  - `正光的高曝光柔光`
- Several lighting descriptions were rewritten to avoid literal geometric artifacts on the face.
- Examples fixed:
  - split lighting no longer creates black/white face paint artifacts
  - Rembrandt / butterfly wording was softened to avoid literal triangles or blocks on the face

## “None” Testing System
- Added `全無` to multiple categories so models can fill missing information naturally.
- Categories with `全無` include:
  - scene
  - framing
  - angle
  - orbit
  - lighting
  - light direction
  - film
  - pose
  - expression
  - skin details
  - hair color
  - hairstyle
  - facial features
  - wardrobe-related fields
- Rule:
  - if a slot is `全無`, the field is omitted from prompt output
  - no extra fallback wording is injected
- User test result already confirmed:
  - `姿勢動作 = 全無` leads Grok to invent varied, plausible poses

## Card / UI Behavior
- Partial reroll panel was removed.
- Summary labels inside each card became lock buttons:
  - `風格`
  - `人物`
  - `服裝`
  - `場景`
  - `鏡頭`
  - `光影`
- Clicking these locks preserves the selected summary dimensions for card reroll.
- Card meta now uses a compact short ID instead of time and “Prompt Card”.
- Favorites were refactored to persist independently instead of only storing prompt IDs.

## Visual UI Direction
- UI was moved from dark tool-panel styling to a warm editorial theme:
  - cream / off-white background
  - warm neutral cards
  - softer accent orange
- Main active orange is now `#E88C4F`.
- Labels and controls were restyled to match the warm editorial direction.

## Recent Hair / Wardrobe Library Expansions
- A large set of hairstyles was added from reference-image analysis.
- Additional accessories and bohemian bottoms were added.
- Recent accessory additions include items like:
  - `黑框眼鏡`
  - `細框眼鏡`
  - `太陽眼鏡`
  - layered necklaces
  - scarves
  - belts

## Current Open Work
- Finish runtime removal of `Wardrobe Core / wardrobeVibe`
- Verify that:
  - the control no longer appears in the UI
  - all converted outfit presets appear in the dropdown
  - prompt output contains no stale `Wardrobe Core` line
- Keep expanding wardrobe single items and outfit presets
- Continue testing Grok’s behavior when key slots are set to `全無`

## Recommended Resume Prompt For A New Conversation
- “Please continue from `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/CODEX_PROGRESS_SUMMARY.md`. First, verify the Wardrobe Core removal is fully complete in runtime and UI, then continue improving outfit-preset-driven wardrobe flow.”
