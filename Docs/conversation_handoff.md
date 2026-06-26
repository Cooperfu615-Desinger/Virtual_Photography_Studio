# Virtual Photography Studio Handoff

## Read This First

For new sessions, read `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/current_project_state.md` first. It is the short current-state truth table.

This file is the longer handoff: it preserves current architecture, durable rules, and historical decisions that still matter. It intentionally does not keep exhaustive commit lists, old validation logs, old dirty-tree notes, or completed next-step lists. Use `git log --oneline` for commit history.

If any older note conflicts with `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/current_project_state.md` or the `Current Canonical State` below, the newer current-state rules win.

Important legacy terminology warning:

- Older historical decisions may say `Grok` where the current UI now says `Gpt`.
- Older historical decisions may say `Midjourney` where the current UI now says `AI`.
- Current source fields still use historical names:
  - `grokPrompt` = current `Gpt`
  - `zImagePrompt` = current `Grok/Z-Image`
  - `midjourneyPrompt` = current `AI`

## Snapshot

- Repo: `/Users/cooperfu/Desktop/Virtual_Photography_Studio`
- Frontend: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp`
- App type: Vite + React prompt generator with optional Firebase Favorites sync
- Knowledge base source: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/knowledge_base`
- Sync script: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/scripts/sync_to_json.py`
- Synced data target: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/data/database.json`
- Baseline commit before this QA handoff update: `2426ad8 Update character profile card picker`

## Validation

Standard validation flow:

- From repo root when knowledge base markdown changes: `python3 scripts/sync_to_json.py`
- From `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp`:
  - `npm test`
  - `npm run lint`
  - `npm run build`

Last QA validation on 2026-06-25:

- `python3 scripts/sync_to_json.py`: passed, with one known warning: `套裝 (Outfit Presets)` has 54 reference images for 55 items. Missing reference image: `網狀蕾絲馬甲短裙長靴`.
- `npm test`: 246 / 246 passed
- `npm run lint`: passed
- `npm run build`: passed with the existing Vite chunk-size warning
- Rendered smoke test on dev server: PAGE1 / PAGE2 / PAGE3 / SUNO / Saved Cards loaded without console errors; PAGE1 and SUNO random generation buttons updated prompt outputs; mobile 390x900 had no horizontal overflow.
- `git diff --check`: passed

Optional dev server:

- `npm run dev -- --host 127.0.0.1 --port 5175`
- URL: `http://127.0.0.1:5175/Virtual_Photography_Studio/`

QA notes from 2026-06-25:

- A stale `enginePromptPipeline.test.js` expectation was aligned with the current face-only close-up policy: `AI` should omit hidden wardrobe and should not inject the old default spaghetti-strap dress fallback.
- In-app Browser rendered QA could not operate native `<select>` values through `selectOption`, keyboard, or coordinate fallback. Pose Composer select dependencies and prompt output remain covered by unit tests; rendered QA covered page load, buttons, prompt output updates, console health, and responsive layout.
- Add `webapp/public/reference/wardrobe/outfit-presets/55_*.png` for `網狀蕾絲馬甲短裙長靴` to clear the current sync warning and restore full outfit-preset reference image coverage.

## Current Canonical State

### Documentation Split

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/current_project_state.md`
  - Short current-state briefing.
  - Best first read for a new session.
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/conversation_handoff.md`
  - Full handoff and historical rationale.
  - Useful when a session needs context behind older decisions.

### PAGE1 Output Contract

- `Gpt`
  - Internal field: `grokPrompt`
  - Target: ChatGPT Image / GPT Image
  - Structured natural prompt
  - Must end with `multi-cut sequence n=2`
- `Grok/Z-Image`
  - Internal field: `zImagePrompt`
  - Target: Grok Imagine / Aurora and Z-Image
  - Natural-language prompt
- `AI`
  - Internal field: `midjourneyPrompt`
  - Compact natural prompt derived from Gpt sections
  - Must preserve selected wardrobe, clothing, pose, and action details
  - Duo mode uses a compact labeled format; single mode remains a compact natural sentence
  - In face-only close-up, hidden wardrobe should be omitted instead of replaced by a default visible dress phrase

Do not rename the internal fields casually. Many saved cards, import/export paths, and older helper names still rely on them.

### Product Architecture

- PAGE1 is the main full portrait prompt workspace.
- PAGE2 is the character-reference prompt workspace.
- PAGE3 is the world / scene prompt workspace.
- SUNO is a music style prompt builder.
- PAGE1 / PAGE2 / PAGE3 currently include DLL PIC Pro generation panels.
- PAGE1 includes section-scoped random controls, prompt restore / backfill, saved cards, Favorites, lighting reference modal, and wardrobe reference image picker cards.

### DLL PIC Pro / Image Analyzer

DLL PIC Pro is a local UI wrapper for direct image generation from current prompt outputs.

Main files:

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/DllPicProPanel.jsx`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/dllPicProClient.js`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/ImagePromptAnalyzerPanel.jsx`

Generation panel behavior:

- PAGE1 / PAGE2 / PAGE3 include `DllPicProPanel`.
- API key and selected model are stored in localStorage:
  - `dll_pic_pro_api_key`
  - `dll_pic_pro_model`
- PAGE1 prompt sources:
  - `Gpt` from `previewPrompt.grokPrompt`
  - `Grok/Z-Image` from `previewPrompt.zImagePrompt`
  - `AI Prompt` from `previewPrompt.midjourneyPrompt`
- PAGE1 default source is `Gpt`.
- PAGE2 default source is `Master Sheet`.
- PAGE3 default source is `Scene Prompt`.
- Supported aspect ratios:
  - `16:9`, `9:16`, `1:1`, `4:3`, `3:4`
- Generation count can be 1 to 4 images.
- Current connected generation providers:
  - `Google Gemini`: `gemini-2.5-flash-image`
  - `Google Gemini (實驗)`: `gemini-3.1-flash-image-preview`
  - `xAI Grok` is listed but has no generation model connected yet.
- Returned inline image data is previewed as data URLs and can be downloaded as `dll_pic_pro_{timestamp}_{index}.png`.

Image Analyzer behavior:

- SUNO page currently includes `ImagePromptAnalyzerPanel`.
- It uses the same DLL PIC Pro API key / model storage.
- It calls Gemini image analysis and returns:
  - short prompt
  - detailed GPT-image-style prompt
  - structured analysis
- Current analysis model for Google options is `gemini-2.5-flash`.

### Subject Model

- `subjectCount` controls normal subject count:
  - `1`
  - `2`
  - `reference`
- Special characters are controlled by `specialSubjectId`, not `subjectCount`.
- Current special subjects include:
  - `黑骷髏`
  - `白骷髏`
  - `日本戰國武士`
  - `歐洲騎士`
  - `女性人形機器人`
- `上傳人物` is prompt-only reference guidance. The app does not upload an image; the user attaches the reference image in the target image tool.

### Pose / Action / Pose Composer

Existing controls:

- `poseId`
- `specialActionId`

Pose Composer controls:

- `poseBaseId`
- `poseArrangementId`
- `poseHandId`
- `poseAnchorId`

Duo-only controls:

- `duoPoseId`
- `duoPoseBaseId`
- `duoExpressionId`

Rules:

- Pose Composer is single-subject only.
- Duo mode ignores Pose Composer and uses `duoPoseId` / `duoPoseBaseId` / `duoExpressionId`.
- In PAGE1 UI, Pose Composer is mutually exclusive with old `poseId` and `specialActionId`.
- Existing social shooting behavior is preserved where possible: social special actions can still compose with old `poseId`.
- Engine priority: if Pose Composer resolves, it outputs instead of old `poseId` / `specialActionId`.
- Pose Composer scene compatibility is intentionally not implemented yet. The user currently prefers free combination.
- `Pose Modifier` is intentionally not implemented yet. Test base + arrangement + hand + anchor first.
- Legacy `duoInteractionId` and separated A/B expression controls are hidden / migrated. Do not reintroduce them.

### Current Key Files

- Prompt engine: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine.js`
- App state / filtering: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/App.jsx`
- PAGE1 UI: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/Page1Workspace.jsx`
- PAGE2 UI: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/Page2Workspace.jsx`
- PAGE3 UI: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/Page3Workspace.jsx`
- Prompt cards: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/PromptCard.jsx`
- Prompt preview cards: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/PromptPreviewCard.jsx`
- DLL PIC Pro panel: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/DllPicProPanel.jsx`
- DLL PIC Pro client: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/dllPicProClient.js`
- Image Analyzer panel: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/ImagePromptAnalyzerPanel.jsx`
- Section random helper: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/page1SectionRandom.js`
- PAGE1 summary helper: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/page1WorkspaceSummary.js`

## Authoring Guides

Four spec files exist under `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs`:

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/character-section-a-authoring-guide.md`
  - Use before adding or changing body type, face type, skin, hairstyle, hair color, expression, pose, special action, Pose Composer, or special subject.
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/wardrobe-section-b-authoring-guide.md`
  - Use before adding or changing tops, bottoms, outfit presets, dresses, special outfits, shoes, socks, outerwear, accessories, colors, patterns, or wardrobe composition logic.
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/scene-section-c-authoring-guide.md`
  - Use before adding or changing indoor / outdoor / other scene bases, ambient light, subject lighting, scene compatibility tags, or scene-light filtering.
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/photography-section-d-authoring-guide.md`
  - Use before adding or changing photographer style, framing, camera angle, orbit angle, camera profile, focal length, optical effect, film stock, rendering simulation, or legacy imaging mappings.

When adding database options, read the relevant guide first, then update the knowledge base / engine / tests as needed.

## PAGE1 Prompt Pipeline

Current implementation:

- `buildStructuredGrokPrompt()` creates the detailed structured source.
- `buildGptPromptFromStructuredPrompt()` converts the structured source into the current `Gpt` output.
- `buildZImagePrompt()` creates the natural `Grok/Z-Image` output.
- `buildAiPromptFromStructuredPrompt()` creates the compact `AI` output.
- `buildPrompts()` returns historical fields:
  - `midjourneyPrompt`
  - `grokPrompt`
  - `zImagePrompt`

Important tests:

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/enginePromptPipeline.test.js`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/enginePoseComposer.test.js`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engineZImageWardrobeLanguage.test.js`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engineGrokScenePriority.test.js`

### Gpt

- Most structured of the current three outputs.
- Primary target is ChatGPT Image / GPT Image.
- Ends with `multi-cut sequence n=2`.
- This multi-cut line is only for Gpt.
- Duo `Gpt` uses role-ordered sections:
  - `Image Type`
  - `Subject` containing the base subject sentence, then `Woman 1` and `Woman 2` role blocks
  - `Shared Expression`
  - `Pose and Composition`
  - `Scene`
  - `Lighting`
  - `Camera Look`
  - `multi-cut sequence n=2`
- Duo `Gpt` should fully describe Woman 1 before Woman 2. Each woman block can include body, face, skin details, hairstyle, hair color, wardrobe, and role-bound accessories.
- Duo `Gpt` should keep shared gaze / mood in `Shared Expression` instead of burying it inside only one subject block.
- Duo `Gpt` should not emit internal color fallback text such as `dominant fabric color controlled by the outfit color selection`.
- Duo `Gpt` should not emit wardrobe guard text such as `coordinated but clearly distinct outfits, avoid identical garment colors...`.

### Grok/Z-Image

- More natural-language rewrite.
- Primary target is Grok Imagine / Aurora and Z-Image.
- Aurora is understood to prefer natural-language descriptions.
- Avoid making this output too rigid or too field-list-like.
- Duo `Grok/Z-Image` now uses compact labeled sections rather than one long mixed natural paragraph:
  - `Image Type`
  - `Subject`
  - `Woman 1`
  - `Woman 2`
  - `Shared Expression`
  - `Pose and Composition`
  - `Scene`
  - `Lighting`
  - `Camera Look`
- Duo `Grok/Z-Image` intentionally omits detailed body / face / hair identity blocks and focuses on subject type, per-role wardrobe, shared expression, pose scenario, scene, lighting, and camera look.
- Role wardrobe lines should remain natural and concise. Keep selected garments and important accessories, but avoid exposing internal differentiation guard text.

### AI

- Compact natural prompt.
- Source should be the Gpt structured sections.
- Do not over-compress. Earlier over-compression caused clothing or wardrobe details to disappear.
- Each major selected section should remain represented, especially wardrobe, pose, and action.
- Pose/composition currently keeps enough comma-separated detail to preserve generated body state.
- Duo `AI` uses the shortest labeled format:
  - opening sentence
  - `Woman 1`
  - `Woman 2`
  - `Pose`
  - `Scene`
  - `Lighting`
  - `Camera Look`
- Duo `AI` may drop secondary detail, but should not lose core garments, pose/action scenario, scene anchor, lighting, or camera look.
- Duo `AI` removes palette-direction prose and internal guard phrases during compression.

### Duo Prompt Format Decisions

The current duo prompt direction came from real-generation testing:

- Role ordering improved generation precision. The model performs better when Woman 1 is fully described before Woman 2 instead of interleaving wardrobe, body, hair, and accessories by source control order.
- `Shared Expression` is separate because it describes the relationship between both women rather than either role alone.
- `Pose and Composition` is now scenario-led. It should describe the two-person action in simple natural language and let the image model decide exact body contact, hand placement, movement, and crop.
- Natural crop and occlusion are acceptable in duo mode. Do not force both women to be fully visible unless the selected framing/control explicitly requires it.
- Duo wardrobe differentiation should happen in wardrobe selection / random composition, not by appending visible guard commands to the public prompt.
- Missing explicit color should stay silent. Do not add fallback phrases that tell the model the fabric color is controlled by a selection.

### Paused Style Prefix Idea

The user tested a lightweight style-prefix idea for oil painting / watercolor / animation / 3D. It worked in GPT Image and Nano Banana but failed in Grok. Do not implement a style-prefix control until the user explicitly asks to revisit model-specific style handling.

## PAGE1 Control Rules

### A. Character / Identity

- User wants to preserve Japanese / Korean female identity direction because most generated subjects are Japanese / Korean women.
- `subjectCount` should only decide subject quantity or reference mode.
- Body types carry the strongest silhouette and sensuality differences.
- Face types are intentionally simplified into a small number of clear directions.
- Special subjects override normal A-person settings where appropriate.

Special subjects:

- Special subjects should feel like an unknown character appearing in the real modern world and blending naturally into the photograph.
- Wording should emphasize live-action realism, natural environmental integration, credible material, and physical body details.
- Avoid making them read as cosplay or fantasy staging.
- Female android supports normal hairstyle and hair-color controls.
- Skeleton modes have no wardrobe generation but keep scene / camera / lighting / style and motion support.

Expression / pose:

- Repetitive expressions were merged.
- Social selfie language was strengthened.
- General portrait and social snapshot directions both remain.
- Boyfriend / best-friend photographer perspective exists as a social snapshot direction.
- Legacy social selfie pose migrations exist; preserve them when editing expression/pose controls.

### Pose Composer

Implemented first version:

- `poseBaseId` / `姿勢基底`
  - `站姿`
  - `坐姿`
  - `跪姿`
  - `蹲姿`
- `poseArrangementId` / `肢體變化`
  - Base-dependent body arrangement.
  - Examples: `單腳重心`, `隨性癱坐`, `抱膝蹲`.
- `poseHandId` / `手部姿勢`
  - Independent hand pose.
  - Examples: `單手摸下巴`, `雙手放在大腿上`, `雙手扶臉頰`.
- `poseAnchorId` / `接觸 / 支撐`
  - Base-dependent support / anchor.
  - Examples: `站在門框邊`, `坐在單人雕花絨布椅`, `蹲在自動販賣機旁`.

Implementation locations:

- `engine.js`
  - Pose Composer option constants live near core option definitions.
  - `buildPoseComposerItem(context)` resolves base, arrangement, hand pose, and anchor.
  - `buildCharacter()` inserts Pose Composer before special action / old pose selection for single subjects.
  - `extractCharacterSlots()` includes `poseComposer`.
  - Gpt, Grok/Z-Image, AI, summary, and selection snapshot understand the Pose Composer slot.
- `Page1Workspace.jsx`
  - Adds Pose Composer controls under `神情姿態`.
  - Filters arrangement / anchor options based on selected base.
  - Handles UI-level mutual exclusion.
- `App.jsx`
  - Adds ordering, import/export structured display, character-control filtering, and lock sanitization for Pose Composer.
- `enginePoseComposer.test.js`
  - Covers control exposure, all prompt-version output, priority over old pose / non-social special action, and duo-mode ignoring.

Good next test combinations:

- `坐姿 + 隨性癱坐 + 雙手放在大腿上 + 坐在單人雕花絨布椅`
- `站姿 + 單腳重心 + 單手摸下巴 + 站在門框邊`
- `蹲姿 + 抱膝蹲 + 雙手扶臉頰 + 蹲在自動販賣機旁`

Expand Pose Composer only after real-generation testing:

- standing / sitting first
- kneeling / squatting next
- modifiers last

### B. Wardrobe

The wardrobe system is optimized around clear responsibility boundaries:

- Base garment options should identify garment identity, material, surface, and distinctive structure.
- Fit, styling, rise, and wearing behavior should live in dedicated controls when possible.
- Avoid re-adding fit/rise/tucked behavior into every base garment description.

Current important controls:

- `topFit`
- `topStyling`
- `bottomFit`
- `bottomRise`
- `outerwearStyling`
- garment colors
- pattern controls
- special upper/lower color palettes

Wardrobe priority:

- `特殊穿搭` is a complete outfit and takes priority over normal separated wardrobe pieces.
- Special outfit prompts should read as complete head-to-toe looks.
- Outfit presets / dresses remain explicit and can layer with outerwear.
- Outerwear should not replace or erase the inner outfit preset / dress.
- Natural layered language is important for Grok/Z-Image and AI.

Special outfits:

- User chose to keep all approved special outfits rather than deleting them.
- Image-derived special outfits can include visible glasses, jewelry, bags, gloves, tattoos, and styling details when part of the look.
- Avoid unrelated temporary handheld props unless the user explicitly asks.

Accessories:

- Eyewear is separated into frame, color, and placement.
- Headphone style is only black Marshall Major V; AirPods Max was removed.
- Glasses, earrings, and neck accessories are generally bound into the subject/person description for Grok/Z-Image rather than emitted as separate wardrobe layers.
- Neck accessories should not be parsed as clothing layers.
- Head accessories remain head/silhouette-adjacent.

Important tests:

- `engineWardrobeControls.test.js`
- `engineWardrobeTopCleanup.test.js`
- `engineOutfitPresetDressCleanup.test.js`
- `engineSpecialOutfitCleanup.test.js`
- `engineAccessoryEyewearCleanup.test.js`
- `engineZImageWardrobeLanguage.test.js`

### C. Scene / Environment

Scene base prompts were simplified and stabilized without deleting options.

Current rules:

- Scene attribute filtering remains:
  - indoor
  - outdoor
  - other
- Scene base prompts should avoid forcing overly neat symmetrical corridor compositions.
- Seamless color-field backgrounds should read as clean single-color cyclorama / color fields.
- Avoid visible paper rolls, stands, light stands, ceiling fluorescent tubes, rigging, and obvious paper backdrop construction.
- Subject shadows should still exist.

Ambient vs subject light:

- `環境光條件` describes whole-scene sky / weather / time / color-temperature state.
- `光線表現` describes how the subject is lit: direction, hardness, contrast, edge light, shadows, reflectivity.
- Optical effects belong to D photography / imaging, not C lighting.

Contextual night-scene accent exists for selected night-city combinations. It should add practical light / city glow detail without turning the scene into a generic postcard.

Important tests:

- `engineSceneBaseCleanup.test.js`
- `engineLightingCompatibility.test.js`
- `engineLightingPromptCleanup.test.js`
- `page3WorldScene.test.js`

### D. Photography / Imaging

Current structure:

- Photographer / regional style = broad image-language layer.
- Composition and viewpoint = geometry.
- Lens / optical / camera / film rendering = imaging controls.

Camera / film:

- `相機 / 底片` is the UI concept for merged camera and rendering simulation.
- Camera profiles describe camera system traits, likely lens perspective, optical behavior, and capture response.
- Film / rendering options describe color response, contrast curve, grain, highlight roll-off, or low-quality media texture.
- Legacy mappings must be preserved through the imaging simulation helpers in `engine.js`.

Framing / viewpoint:

- Geometry should describe crop, camera height, tilt, orbit, and body visibility.
- It should not describe emotional pose, story mood, or character personality.

Optical effects:

- Optical effects stay in D.
- `前景遮擋散景` intentionally keeps a strong partial-occlusion / doorway feel. It should remain a real foreground obstruction, not generic bokeh.

Important tests:

- `enginePhotographyImagingCleanup.test.js`

## PAGE Architecture

### PAGE1

PAGE1 is the main full portrait generator. It handles:

- subject / identity
- wardrobe
- expression / pose / action / Pose Composer
- scene
- lighting
- camera / imaging
- prompt restore / import
- saved cards and Favorites
- DLL PIC Pro panel

### PAGE2

PAGE2 is a separate character-reference builder.

- Does not inject role text back into PAGE1.
- Intended for identity-lock / reference prompts.
- Emphasizes standard identity views rather than editorial portrait language.
- Has its own prompt preview and DLL PIC Pro panel.

### PAGE3

PAGE3 is a pure scene / world / environment prompt builder.

- Outputs scene / cinematic / world prompt styles.
- Supports city identity, worldview, photography style, time/weather, lighting mood, composition/lens language, and material/environment details.
- Can use PAGE1 photography styles in a scene-adapted way.
- Has its own prompt preview and DLL PIC Pro panel.

### SUNO

SUNO is a music style prompt builder.

- Supports genre, instruments, BPM range, groove, vocal traits, texture, and atmosphere.
- Saved Cards also support SUNO entries.
- SUNO is not part of PAGE1 image prompt generation.

## Restore / Import / Favorites / Feed

Current behavior:

- Favorites support restore back to PAGE1.
- Prompt cards in Favorites can load saved structured selections back into the console.
- Standard-format prompt restore exists:
  - paste a standard exported prompt
  - parse matching controls
  - restore them into PAGE1
- Restore default rule:
  - if a control has `全無` and restore misses it, it becomes `全無`
  - otherwise it falls back to Random
- Feed ZIP import accepts the app's own ZIP format only.
- Feed import merges into current Favorites; duplicate ids are overwritten by imported entries.
- Invalid ZIP format rejects the whole import.
- Feed and Favorites no longer have the old 120-item cap.

Firebase:

- Firebase is used only for Favorites persistence / Google sign-in, not prompt generation.
- Main files:
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/firebase.js`
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/favoritesRepository.js`
  - `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/firebase_favorites_rules.md`
- Firebase modular SDK is lazy-loaded through dynamic import.
- Firestore path: `users/{uid}/favorites/{promptId}`.
- LocalStorage remains fallback when Firebase is unavailable or signed out.
- GitHub Pages Firebase Authorized Domains should include `cooperfu615-desinger.github.io`.

## Random / Close-Up / Lock Rules

Random and lock handling are important because many controls are data-driven.

- Section-scoped random exists in PAGE1.
- When adding controls, update section keys / ordering / sanitize logic as needed.
- Close-up mode can disable or clear fields that cannot be visible.
- Chest-up framing has special upper-clothing allowances.
- Do not re-enable all wardrobe fields in tight close-ups without checking tests.
- Wardrobe random routing should preserve explicitly chosen values instead of overwriting them.
- Secondary styling layers such as legwear, outerwear, and accessories are handled independently where possible.

## Historical Decision Summary

The details below are condensed history. They should explain why the current system behaves the way it does without preserving every old commit, validation run, or item-level changelog.

### Broad A / B / C / D Cleanup

A broad cleanup pass made PAGE1 easier to maintain:

- A: character identity, expression, pose, and special subjects
- B: wardrobe, clothing structure, colors, accessories
- C: scene base, environment, ambient light, subject light
- D: photography style, composition, lens, optical effects, camera/film rendering

The durable rule from that cleanup: each option should own one responsibility. Avoid repeated wording that causes controls to fight each other.

### Character Direction

- Japanese / Korean female portrait direction remains intentional.
- Body type carries silhouette and sensuality differences.
- Face, hair, expression, and pose options were simplified to reduce redundancy.
- Special subjects should be physically credible in live-action photographs rather than fantasy/cosplay illustrations.
- Female historical warrior subjects were revised to female-character armor shaping.
- Female android became a near-human android with subtle mechanical facial panel lines and body mechanisms.

### Wardrobe Direction

- Outfit presets were redefined as clear style-direction looks, not generic commute / daily / lifestyle buckets.
- Sets and dresses should avoid hardcoded color where color controls can supply color.
- Special outfits remain more verbose because they represent complete looks.
- Base tops and bottoms were simplified so fit/rise/styling controls can do their job.
- Outerwear, shoes, socks, and accessories were tightened to avoid repeating color/fit details.
- Layering language was improved because models often treated outerwear as the whole outfit and ignored the inner outfit.

### Scene Direction

- Scene base cleanup was stabilization-focused: no broad deletion of scene options.
- Ruins / empty special locations should avoid incidental pedestrian language.
- Street scenes may keep incidental pedestrian atmosphere where appropriate.
- Seamless color-field backgrounds should be clean single-color fields rather than visible studio-equipment setups.
- Ambient light and subject light were split conceptually to reduce conflict.

### Photography Direction

- Photographer style should describe image language, color rhythm, editorial/documentary distance, and viewing behavior.
- Framing / angle / orbit should stay geometric.
- Lens options should describe field of view, perspective, compression, distortion, working distance, and focus behavior.
- Optical effects should be visible optical/camera effects, not scene or mood instructions.
- Camera and film simulation were merged into a more coherent imaging layer.

### Grok / Z-Image Historical Lessons

- Complex wardrobe could cause Grok Imagine to ignore the scene, so scene priority was improved.
- Z-Image moved toward natural wardrobe language.
- Outfit + outerwear wording should explicitly preserve both layers.
- Wardrobe integrity guard exists to reduce missing clothing / nudity risk.
- Grok/Aurora can over-prioritize face detail or brighten subjects in night scenes, so night exposure behavior remains a future area to test carefully.

### Close-Up Historical Lessons

- Tight face framings can conflict with wardrobe visibility.
- If visible wardrobe is selected, random should avoid tight framings that cannot show it.
- Chest-up framing is special: it can preserve some upper-body wardrobe details.
- Older close-up wording that emphasized half-face / partial-face caused split-face artifacts and was rewritten.

### Duo Historical Lessons

- Duo-specific wardrobe controls exist for A/B subjects.
- Duo body type and skin details are split into A/B role controls.
- Duo action and broad posture are now split as `duoPoseId` / `duoPoseBaseId`.
- Duo expression is a single shared `duoExpressionId` control.
- Legacy `duoInteractionId` and legacy separate A/B expression controls were hidden / migrated and should not be added back.
- Duo prompt output should keep accessories and clothing grouped by person when possible.
- Duo public prompts should not expose internal wardrobe guard text or color fallback text.
- Pose Composer is currently single-subject only and should not be applied to duo mode.

### PAGE3 Historical Lessons

- PAGE3 is separate and should remain scene/world focused.
- City identity can include landmark-aware cues, but avoid turning every scene into a postcard.
- PAGE3 can adapt PAGE1 photography styles for environments.

### SUNO Historical Lessons

- SUNO is a separate music prompt builder.
- It should remain separate from PAGE1 image generation logic.

## Current Best Next Work

- Real-generation test Pose Composer before expanding it.
- Expand Pose Composer options in batches only after stable outputs:
  - standing / sitting first
  - kneeling / squatting next
  - modifiers last
- Continue database additions through the relevant authoring guide.
- Keep prompt-output changes backed by tests because current UI labels and historical source field names are easy to confuse.
- Continue small targeted additions rather than broad cleanup unless the user explicitly requests another broad cleanup pass.
