# Virtual Photography Studio Current Project State

This is the short current-state briefing for new sessions. Read this first. Use `Docs/conversation_handoff.md` only when deeper history or rationale is needed.

## Snapshot

- Repo: `/Users/cooperfu/Desktop/Virtual_Photography_Studio`
- Frontend: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp`
- App: Vite + React prompt generator
- Baseline for the facial-identity optimization: `main` at `45ee3ea`
- Normal working branch: `main`

## Validation

Run from `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp` unless noted:

- `npm test`
- `npm run lint`
- `npm run build`
- From repo root when knowledge base markdown changes: `python3 scripts/sync_to_json.py`
- From repo root after syncing: `python3 scripts/sync_to_json.py --check`
- Data sync unit tests: `python3 -m unittest discover -s scripts/tests`
- Public asset budget: `python3 scripts/check_public_assets.py`
- Optional dev server: `npm run dev -- --host 127.0.0.1 --port 5175`
- Dev URL: `http://127.0.0.1:5175/Virtual_Photography_Studio/`

Previous implementation validation on 2026-07-10 before the facial-identity optimization:

- Frontend test count was superseded by the 2026-07-11 result below.
- Frontend `npm run lint`: passed.
- Frontend `npm run build`: passed without a Vite chunk-size warning. Character profile data is grouped with the prompt catalog instead of inflating the prompt engine chunk.
- Functions `npm test`: 30 tests passed.
- Functions `npm run lint`: passed with the repository ESLint configuration; this is now an active lint check instead of a placeholder command.
- Functions tests use the Node 20-compatible single-level `test/*.test.js` pattern; the previous recursive glob required a subdirectory on the GitHub Actions shell and blocked Pages deployment even though local Node 25 tests passed.
- Browser QA confirmed PAGE2 shows 10 cards on page 1 and the seven new cards on page 2, all seven AVIF previews load, Olivia exposes removable headwear plus eight compatible hair choices, the six copy outputs remain available, and the desktop five-column layout has no horizontal overflow.
- Git reference validation passed with `git show-ref --head` and `git fsck --full --no-dangling` after removing stale synced-directory conflict copies.
- Data sync unit tests and deterministic `--check` remain unchanged. Public asset budget validation passed with 185 deployment files totaling 2,378,672 bytes.
- Deterministic audit `node scripts/validate_prompt_logic.mjs 200 optimization-audit`: generated 200 prompts with seed `optimization-audit`; 11 prompts were flagged by the existing heuristics. The occurrence summary was 9 pants/legwear overlaps and 3 pants/skirt overlaps; one prompt can contain more than one finding. Treat these as prompt-quality follow-up items, not test failures or optimization regressions.

## Product Pages

### PAGE1 Prompt Workspace

PAGE1 is the main full portrait prompt workspace. It combines subject, wardrobe, pose, scene, lighting, camera, and imaging controls.

Current PAGE1 output labels:

- `Gpt`
  - Internal field: `grokPrompt`
  - Target: ChatGPT Image / GPT Image
  - Structured natural prompt
  - Current rule as of 2026-07-03: `GPT Full-Fidelity Prompt` / `GPT 完整保留型 Prompt`
  - Gpt should preserve selected effective English descriptions instead of semantically compressing them; only formatting cleanup, section organization, empty-value removal, and exact duplicate cleanup are allowed
  - Must end with `multi-cut sequence n=2`
  - Single special outfits place built-in hair, body, tattoo, and other person-detail fragments in `Subject` under `Hair and body details`; `Wardrobe` uses named `Full outfit` and `Headwear, eyewear, and bag` subsections
  - Single character profile cards use structured facial geometry, eye, nose, mouth, skin, makeup, body, permanent-anchor, hair, outfit, accessory, and photographic-direction groups inside `Subject`; the legacy `identityAndBody` paragraph is retained in data but not repeated by the full renderer
- `Grok/Z-Image`
  - Internal field: `zImagePrompt`
  - Target: Grok Imagine / Aurora and Z-Image
  - More natural-language description
- `AI`
  - Internal field: `midjourneyPrompt`
  - Compact natural prompt derived from Gpt sections
  - Must not drop selected wardrobe, clothing, pose, or action details
  - Duo mode uses a compact labeled format, not the older single-paragraph compression
- `全身角色照`
  - Internal renderer output: `fullBodyCharacterPrompt`; exposed and stored through `extraPrompts` id `full-body-character`
  - Single-subject-only full-body character reference prompt using Gpt-style `Image Type`, `Subject`, `Wardrobe`, `Lighting`, and `Camera Look` sections
  - Fixed to one `9:16 vertical image`; DLL PIC locks the aspect ratio to `9:16` when this source is selected
  - Rebuilds wardrobe with full-body visibility so current chest-up or medium framing cannot remove bottoms, outerwear, legwear, shoes, bags, or accessories
  - Does not include `Pose and Composition`, `Scene`, or `multi-cut sequence n=2`

Important naming note:

- Older docs may say `Grok` where the current UI says `Gpt`.
- Older docs may say `Midjourney` where the current UI says `AI`.
- Current source fields are historical names; do not rename them casually.

PAGE1 also includes:

- Section-scoped random controls
- Standard prompt backfill / restore
- Favorites and saved cards
- DLL PIC Pro generation panel
- Wardrobe reference image picker cards
- Lighting reference modal

### PAGE2 Character Card Lab

PAGE2 is now the Character Card Lab for PAGE1 `A 人物設定`.

Implemented v1 behavior:

- Selects one of 27 built-in character cards, paged as 10 cards, 10 cards, then seven cards.
- Current cards are `11_Rika`, `48_G`, `29_Philippa`, `07_Lily`, `06_Hinata`, `38_Rin`, `12_Sakura`, `03_Sui`, `02_Yuri`, `37_Hina`, `26_Yuna`, `41_Eleanor`, `22_Olivia`, `08_Jiwoo`, `05_Chihiro`, `04_Koto`, `00_Mei`, `01_Rei`, `09_Amy`, `10_Ji-Yoo`, `13_Yui`, `14_Nana`, `15_Emily`, `16_Shiori`, `18_Natsuki`, `19_Minji`, and `20_Manami`.
- Supports character-safe hair styling variants that modify the card's base hair instead of replacing it.
- Supports `預設` / `戴眼鏡` / `不戴眼鏡`, including PAGE1 import behavior.
- Lets PAGE2 decide which default character-card wardrobe layers are imported into PAGE1.
- Imports the selected character card, hair variant, prompt override, and selected wardrobe layers back into PAGE1.
- PAGE1 displays imported wardrobe layers in C 穿搭設定 as `來自角色卡｜...` and can fill missing layers with normal PAGE1 controls.
- Reimporting from PAGE2 changes only the included character-card layers and preserves unrelated PAGE1 choices.
- Produces six copyable outputs:
  - `GPT Prompt`
  - `Grok/Z-Image Prompt`
  - `AI Prompt`
  - `Headshot Prompt`
  - `Four-View Prompt`
  - `Full-Body Reference Prompt`
- Saved Cards supports PAGE2 six-output cards and PAGE1 imported character-card selection snapshots.

Facial identity optimization (2026-07-11):

- All 27 formal cards now expose `facialGeometry`, `eyeSignature`, `noseSignature`, `mouthSignature`, `skinSignature`, `makeup`, `body`, and four compact `distinctiveFeatures` anchors.
- `identityAndBody` remains verbatim as a compatibility field for existing Saved Cards and legacy prompt consumers; new full renderers use the structured identity fields instead of repeating the legacy paragraph, and `face`, `skin`, and `makeup` no longer mirror one mixed string.
- PAGE1 Gpt / full-body prompts render facial fields as separate labeled blocks. PAGE1 compact AI and every PAGE2 copy output retain all four permanent identity anchors, even when users switch hair, clothes, or makeup.
- Eleanor's horns, red eyes, bilateral facial markings, forehead sigil, and arcane tattoos are explicit permanent anchors.
- The high-similarity checks preserve Jiwoo/Koto (heart-oval wide-set eyes vs balanced oval shallow-lid eyes), Yuna/Chihiro (short rounded chin vs longer oval-heart/slightly close-set eyes), Sakura/Lily, Yuri/Hina, and Olivia/Mei contrasts.
- The formal maintenance specification and source-image matrix live in [`specs/character-card-facial-identity.md`](specs/character-card-facial-identity.md).

Validation for the facial identity optimization:

- Frontend `npm test`: 407 passed.
- Frontend `npm run lint` and `npm run build`: passed.
- Functions `npm test`: 30 passed; Functions `npm run lint`: passed.
- `python3 scripts/sync_to_json.py --check` and `python3 -m unittest discover -s scripts/tests`: passed.
- `python3 scripts/check_public_assets.py` passes with all 27 formal cards using manifest-backed AVIF deployment previews; full-resolution source images remain outside the deployment public directory.
- Deterministic audit `node scripts/validate_prompt_logic.mjs 200 facial-identity-audit`: 9 existing wardrobe-combination heuristic findings; no facial-identity finding.

Character-card authoring locations:

- Full-resolution source images and alternate reference views: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/source-assets/character-cards/<lowercase-name>/`
- Deployment preview: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/public/character-cards/<lowercase-name>/<number>_<Name>_00.avif`
- Preview manifest: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/knowledge_base/character_reference_manifest.json`
- Identity, face, body, hair, outfit, and reference metadata: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine/characterProfiles.js`
- PAGE2 hair compatibility and removable wardrobe layers: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/characterCardLab.js`

### PAGE3 World Scene

PAGE3 is separate from PAGE1 and PAGE2. It builds scene / world / environment prompts and has its own prompt preview and DLL PIC Pro panel.

### SUNO

SUNO has been removed from the active app navigation / workspace flow. The user plans a separate music prompt tool.

The unreachable SUNO workspace, prompt builder, tests, and CSS were removed on 2026-07-10. Historical saved cards remain plain stored prompt records and do not require the SUNO builder at runtime. Do not re-add SUNO to active navigation unless explicitly requested.

## DLL PIC Pro

DLL PIC Pro is a local UI wrapper for direct image generation from current prompt outputs.

Main files:

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/DllPicProPanel.jsx`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/dllPicProClient.js`

Generation panel behavior:

- PAGE1 / PAGE2 / PAGE3 include `DllPicProPanel`.
- API key and selected model are stored in localStorage:
  - `dll_pic_pro_api_key`
  - `dll_pic_pro_model`
- PAGE1 prompt sources:
  - `Gpt` from `previewPrompt.grokPrompt`
  - `Grok/Z-Image` from `previewPrompt.zImagePrompt`
  - `AI Prompt` from `previewPrompt.midjourneyPrompt`
  - `全身角色照` from `previewPrompt.extraPrompts` id `full-body-character`, fixed to `9:16`
- PAGE1 default source is `Gpt`.
- PAGE2 prompt sources are the six Character Card Lab outputs.
- PAGE3 default source is `Scene Prompt`.
- Supported aspect ratios:
  - `16:9`, `9:16`, `1:1`, `4:3`, `3:4`
- Generation count can be 1 to 4 images.
- Current connected generation providers:
  - `Google Gemini`: `gemini-2.5-flash-image`
  - `Google Gemini (實驗)`: `gemini-3.1-flash-image-preview`
  - `xAI Grok` is listed but has no generation model connected yet.
- Returned inline image data is previewed as data URLs and can be downloaded as `dll_pic_pro_{timestamp}_{index}.png`.

## Current PAGE1 Control Rules

### Subject Routing

- `subjectCount` controls normal subject count:
  - `1`
  - `2`
- Legacy saved cards / imports with `subjectCount: "reference"` are normalized to `subjectCount: "1"`.
- Special characters are controlled by `specialSubjectId`, not `subjectCount`.
- Current special subjects include:
  - `黑骷髏`
  - `白骷髏`
  - `日本戰國武士`
  - `歐洲騎士`
  - `女性人形機器人`
- PAGE1 no longer has an `上傳人物` subject-count mode or reference-guidance prompt line.

### Prompt Pipeline

- `buildStructuredPromptSections()` creates one ordered prompt-section model with both `sections` and `valuesByLabel` views.
- `renderGptPrompt()` creates the current full-fidelity `Gpt` output.
- `renderZImagePrompt()` creates the natural `Grok/Z-Image` output.
- `renderAiPrompt()` creates the compact `AI` output.
- `renderFullBodyCharacterPrompt()` creates the single-subject full-body character reference output.
- `buildPrompts()` preserves the three historical fields:
  - `midjourneyPrompt`
  - `grokPrompt`
  - `zImagePrompt`
  - It also returns `fullBodyCharacterPrompt`, which `generateSinglePrompt()` stores as the `full-body-character` extra prompt when available.

Runtime rules:

- The default database catalog, flattened lookup lists, and lock controls are compiled once and deeply frozen.
- A non-empty custom library is compiled per request so local overlay edits are immediately reflected.
- `generatePrompts()` accepts `runtimeOptions.random`; production defaults to `Math.random`, while tests and audits can inject `createSeededRandom(seed)`.
- Selection snapshots are created from `LOCK_DEFINITIONS`, retain schema order, fill declared defaults, and ignore undeclared fields.
- Prompt renderer labels are internal integration keys. Renaming a section label can affect all three renderers and requires prompt-pipeline tests.

Current duo prompt output contract:

- Duo `Gpt` is role-ordered and sectioned:
  - `Image Type`
  - `Subject` containing the base subject sentence, then `Woman 1` and `Woman 2` role blocks
  - `Shared Expression`
  - `Pose and Composition`
  - `Scene`
  - `Lighting`
  - `Camera Look`
  - `multi-cut sequence n=2`
- Duo `Gpt` should describe Woman 1 completely before Woman 2, including body, face, hair, hair color, wardrobe, and role-bound accessories where available.
- Duo `Gpt` should keep `Shared Expression` separate from each woman's identity / wardrobe block.
- Duo `Grok/Z-Image` uses the same broad section order but is more compact:
  - `Image Type`
  - `Subject`
  - `Woman 1`
  - `Woman 2`
  - `Shared Expression`
  - `Pose and Composition`
  - `Scene`
  - `Lighting`
  - `Camera Look`
- Duo `AI` uses an even shorter labeled format:
  - opening sentence
  - `Woman 1`
  - `Woman 2`
  - `Pose`
  - `Scene`
  - `Lighting`
  - `Camera Look`
- Duo `AI` may compress details, but must keep core wardrobe, pose/action scenario, scene, lighting, and camera look represented.
- When no explicit garment color is selected, do not inject fallback phrases such as `dominant fabric color controlled by the outfit color selection`.
- Duo public outputs should not include wardrobe guard text such as `coordinated but clearly distinct outfits, avoid identical garment colors...`; color / garment differentiation should happen during wardrobe resolution and random composition instead.

### Pose / Action / Pose Composer

Existing controls remain:

- `poseId`
  - Legacy compatibility field only.
  - PAGE1 no longer exposes it in B 神情姿態.
  - Restore / normalize migrates old `poseId` selections into Pose Composer locks and clears `poseId`.
- `specialActionId`
  - Legacy hidden control after the special-action-to-Pose-Composer migration.
  - PAGE1 no longer exposes it as an independent B 神情姿態 field.
  - Existing saved cards / restore data are migrated into Pose Composer locks where possible.

New Pose Composer controls:

- `poseBaseId`
- `poseArrangementId`
- `poseHandId`
- `poseHeadId`
- `poseAnchorId`
- Duo-only controls:
  - `duoPoseId`
  - `duoPoseBaseId`
  - `duoExpressionId`

Rules:

- Pose Composer is single-subject only.
- Duo mode ignores Pose Composer and uses `duoPoseId` / `duoPoseBaseId` / `duoExpressionId`.
- PAGE1 `B 神情姿態` has two mutually exclusive panels:
  - `單人設置`: `expressionId`, `poseBaseId`, `poseArrangementId`, `poseHandId`, `poseHeadId`, `poseAnchorId`
  - `雙人設置`: `duoPoseId`, `duoPoseBaseId`, `duoExpressionId`
- `單人設置` is enabled for `subjectCount === "1"` and disabled for duo mode; `雙人設置` is enabled for `subjectCount === "2"` and disabled for single mode.
- Legacy social shooting actions are migrated into Pose Composer hand poses.
- Engine priority: if Pose Composer resolves, it outputs instead of old `poseId`; legacy `poseId` and `specialActionId` restores are normalized into Pose Composer locks and cleared.
- Scene conflict checking for Pose Composer is intentionally not implemented yet.
- `Pose Modifier` is intentionally not implemented yet.

Duo rules:

- `duoPoseId` is the current `雙人動作情境` control.
- `duoPoseBaseId` is the current `雙人姿態基底` control.
- `duoExpressionId` is the current shared `雙人神情眼神` control.
- Legacy `duoInteractionId` / separated A-B expression controls are hidden / migrated and should not be reintroduced.
- Duo action scenario language should usually be one simple natural sentence that lets the image model decide exact contact, crop, hand placement, and movement.
- Natural duo crops, partial occlusion, incomplete full-body visibility, and model-decided body language are acceptable when the selected scenario implies them.

### Wardrobe Priority

- `specialOutfitId` / duo special outfit controls produce complete looks and take priority over normal wardrobe pieces.
- Outfit presets / dresses remain explicit and can layer with outerwear.
- AI and Grok/Z-Image must preserve clothing details; do not over-compress wardrobe.
- Accessories such as eyewear, earrings, and neck accessories are generally bound into the subject/person description rather than emitted as separate prompt lines.
- Duo wardrobe is resolved per role. Random A/B clothing and palette choices should avoid unintentional identical garments or same-color collisions where possible, while still respecting explicit user locks.
- Duo role wardrobe text should end as clean sentences and should not expose internal fallback or guard phrases.

### Close-Up Mode

- Close-up framing can disable or clear controls that cannot be visible.
- Chest-up framing has special allowances for upper-body wardrobe.
- Face-only close-up currently omits hidden wardrobe text instead of injecting a default strap-dress fallback. This applies to `AI` as well as `Gpt` and `Grok/Z-Image`.
- Do not re-enable all wardrobe fields in tight close-up without checking existing close-up rules and tests.

## Key Files

Core prompt engine:

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine.js`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engineRandom.js`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine/runtimeCache.js`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine/promptModel.js`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine/selectionSchema.js`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine/characterProfiles.js`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine/duoOptions.js`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine/fixedCompositionOptions.js`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine/poseComposerOptions.js`

Engine architecture reference:

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/engine-architecture.md`

PAGE1 app state and control filtering:

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/App.jsx`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/Page1Workspace.jsx`

Shared PAGE UI / prompt display:

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/PromptCard.jsx`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/PromptPreviewCard.jsx`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/Page2Workspace.jsx`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/DllPicProPanel.jsx`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/dllPicProClient.js`

PAGE1 helpers:

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/page1SectionRandom.js`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/page1WorkspaceSummary.js`

Knowledge base:

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/knowledge_base`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/knowledge_base/wardrobe_reference_manifest.json`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/knowledge_base/item_metadata.json`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/source-assets`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/data/database.json`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/scripts/sync_to_json.py`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/scripts/build_image_previews.py`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/scripts/check_public_assets.py`

Authoring guides:

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/character-section-a-authoring-guide.md`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/page1-single-prompt-compression-guide.md`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/wardrobe-section-b-authoring-guide.md`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/scene-section-c-authoring-guide.md`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/photography-section-d-authoring-guide.md`

## Important Tests

- `enginePromptPipeline.test.js`
- `enginePoseComposer.test.js`
- `engineExpressionPoseCleanup.test.js`
- `engineSpecialSubjects.test.js`
- `engineWardrobeControls.test.js`
- `engineGrokScenePriority.test.js`
- `engineZImageWardrobeLanguage.test.js`
- `engineCharacterCardVariant.test.js`
- `characterCardLab.test.js`
- `engineLightingCompatibility.test.js`
- `engineRandom.test.js`
- `engine/runtimeCache.test.js`
- `engine/promptModel.test.js`
- `engine/selectionSchema.test.js`
- `page1SectionRandom.test.js`
- `page1WorkspaceSummary.test.js`

Prefer targeted tests first, then full `npm test`.

## Engine Optimization Status

Completed on 2026-07-10:

- Cached and deeply froze the default compiled runtime instead of rebuilding the complete catalog and controls for every prompt request.
- Added injected seeded randomness without changing the default production behavior.
- Introduced a shared prompt-section model and explicit Gpt, Grok/Z-Image, and AI renderer boundaries.
- Centralized selection snapshot construction around the lock schema.
- Moved large static character, duo, fixed-composition, and Pose Composer option sets into focused modules.
- Removed redundant PAGE1 calls that recomputed wardrobe lock/control information.
- Split the production output into application, prompt-engine, prompt-catalog, and Firebase chunks.

Local development measurements from 2026-07-10 on arm64, Node `v22.22.3`, npm `10.9.8`:

- `getLockControls()`: approximately `23.75 ms/op` before and below `0.001 ms/op` after warm-cache reuse.
- `generatePrompts(1)`: approximately `98.68 ms` before and `2.98 ms` after.
- `generatePrompts(10)`: approximately `928.6 ms` before and `29.95 ms` after.
- Frontend test duration: approximately `29.0 s` before and `3.23 s` after.

These numbers are dated development measurements, not performance guarantees. Compare future measurements on the same machine, Node version, data set, command, and warm/cold-cache conditions.

Remaining engine work should be incremental:

- `buildCharacter()` and `buildWardrobe()` remain high-coupling orchestration areas inside `engine.js`.
- Legacy saved-card and lock migration logic remains in the compatibility boundary.
- Extract either area only with seeded regression fixtures and existing public-output field mappings preserved.
- Do not cache arbitrary custom-library overlays without an explicit invalidation or versioning strategy.

## Architecture Hardening Status

Completed on 2026-07-10:

- Removed stale Git metadata and generated `dist` conflict copies created by synced-directory filename duplication. The repository now has one valid index and one `main` ref.
- Expanded GitHub Actions into pull-request and `main` quality gates for frontend tests/lint, Functions tests/lint, and pull-request build validation before production deployment.
- Added a version-controlled root `firestore.rules` file and connected it through `firebase.json`.
- Hardened the image download proxy against private-network targets, private-address DNS resolution, and unsafe redirect chains; each redirect target is revalidated and redirects are capped.
- Added conservative `maxInstances: 2` limits to public callable generation/download Functions to reduce accidental scaling exposure.
- Removed unreachable SUNO runtime/test/CSS files, the unused Image Analyzer panel/CSS, and the remaining Vite starter assets.
- Migrated the legacy read-only Feed collection into Favorites with ID de-duplication and success-gated removal of `vps.prompts` / `vps.viewMode`; Saved Cards now maintains one collection and one persistence path.
- Reduced `App.jsx` from 1,932 to 546 lines by extracting Saved Cards codec/local repository/cloud mutation sync, browser storage, PAGE1 workspace state, and PAGE3 card construction into feature modules.
- Moved PAGE1 navigation schema, control selectors, and lock transitions into tested feature modules; `Page1Workspace.jsx` is now 1,184 lines and receives three grouped contracts instead of 24 independent props.
- Lazy-loaded all five workspaces and the Saved Cards ZIP implementation. CSS is split into base, PAGE1, PAGE2 character-card, Saved Cards, shared lab, and generation-preview assets.
- Added `functions/shared/imageProviderContract.json`; web proxy clients and Firebase Functions now share model keys, aspect ratios, resolution support, count bounds, prompt limits, and response-envelope normalization while keeping the contract inside the Firebase deployment source.
- Expanded PAGE1 reroll exclusion from pose and primary outfit choices to the main unlocked aspect-ratio, scene, style, camera, lighting, imaging, and character dimensions. Explicit locks remain unchanged, and a previous choice is reused only when no compatible alternative exists.
- Replaced positional wardrobe image `zip()` matching and inherited database metadata with explicit versioned manifests. Missing, duplicate, unexpected, or stale inputs now fail; `--check` is read-only and runs in CI.
- Moved 203 MiB of original reference images to `source-assets/` and generated 178 640px AVIF previews for deployment. `webapp/public` is about 2.5 MiB, and CI enforces a 15 MiB total / 512 KiB per-file budget.

Remaining security follow-up:

- Firebase App Check is not enforced yet. The frontend does not currently initialize an App Check provider or provide a production site key, so enabling enforcement now would break legitimate calls. Add the client provider and deployment secret first, verify production traffic, then enable enforcement on callable Functions.
- Keep the repository outside folders managed by desktop sync software when practical. The stale conflict copies are gone, but relocation is an environment-level preventive action and was not performed automatically.

## Paused Ideas

- Style prefix control for oil painting / watercolor / animation / 3D is paused.
  - It worked in GPT Image and Nano Banana.
  - It failed in Grok.
  - Do not implement until the user asks to revisit model-specific style handling.
- Pose Modifier is paused.
  - First verify base + arrangement + hand + anchor generation quality.
- Pose Composer scene compatibility is paused.
  - User currently prefers free combination.

## Best Next Work

- Character Card Lab UIUX polish and the first 17-card catalog are implemented.
  - Real-generation test the seven new profiles across Gpt, Grok/Z-Image, and AI before tuning descriptions from observed model drift.
  - Pay special attention to Eleanor's permanent horns/markings, Olivia's removable cap and exposed base hair, Jiwoo's white streak placement, and the visual separation between Chihiro, Koto, and Mei.
  - Continue future built-in cards through the source/preview/manifest/profile/layer workflow documented above.
- UIUX discussion process for future sessions:
  - Discuss wireframe direction before implementation.
  - Use low-fidelity generated wireframes when useful to align layout imagination.
  - Record decisions as current-state vs planned-next-work so future sessions do not confuse sketches with implemented behavior.
- Real-generation test Pose Composer with fixed combinations before expanding the database.
- Expand Pose Composer options in batches only after stable results:
  - standing / sitting first
  - kneeling / squatting next
  - modifiers last
- Continue database additions through the relevant authoring guide first.
- For PAGE1 single-subject prompt wording, use `Docs/specs/page1-single-prompt-compression-guide.md`. Gpt is now full-fidelity; Grok/Z-Image and AI are the compact outputs.
- Keep prompt-output changes backed by tests because naming and source-field history are easy to confuse.
