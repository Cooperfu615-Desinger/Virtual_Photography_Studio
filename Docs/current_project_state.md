# Virtual Photography Studio Current Project State

This is the short current-state briefing for new sessions. Read this first. Use `Docs/conversation_handoff.md` only when deeper history or rationale is needed.

## Snapshot

- Repo: `/Users/cooperfu/Desktop/Virtual_Photography_Studio`
- Frontend: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp`
- App: Vite + React prompt generator
- Baseline commit before this QA update: `2426ad8 Update character profile card picker`
- Normal working branch: `main`

## Validation

Run from `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp` unless noted:

- `npm test`
- `npm run lint`
- `npm run build`
- From repo root when knowledge base markdown changes: `python3 scripts/sync_to_json.py`
- Optional dev server: `npm run dev -- --host 127.0.0.1 --port 5175`
- Dev URL: `http://127.0.0.1:5175/Virtual_Photography_Studio/`

Last QA validation on 2026-06-25:

- `python3 scripts/sync_to_json.py`: passed, with one known warning: `套裝 (Outfit Presets)` has 54 reference images for 55 items. Missing reference image: `網狀蕾絲馬甲短裙長靴`.
- `npm test`: 246 / 246 passed
- `npm run lint`: passed
- `npm run build`: passed with the existing Vite chunk-size warning
- Rendered smoke test on dev server: PAGE1 / PAGE2 / PAGE3 / SUNO / Saved Cards loaded without console errors; PAGE1 and SUNO random generation buttons updated prompt outputs; mobile 390x900 had no horizontal overflow.
- `git diff --check`: passed

## Product Pages

### PAGE1 Prompt Workspace

PAGE1 is the main full portrait prompt workspace. It combines subject, wardrobe, pose, scene, lighting, camera, and imaging controls.

Current PAGE1 output labels:

- `Gpt`
  - Internal field: `grokPrompt`
  - Target: ChatGPT Image / GPT Image
  - Structured natural prompt
  - Must end with `multi-cut sequence n=2`
  - Single special outfits can be grouped inside `Wardrobe` as `Hair and body details`, `Full outfit`, and `Headwear, eyewear, and bag`
  - Single character profile cards can be grouped inside `Subject` as `Character Profile Card`, `Identity and body`, `Hair`, `Outfit`, `Accessories`, and `Photographic direction`
- `Grok/Z-Image`
  - Internal field: `zImagePrompt`
  - Target: Grok Imagine / Aurora and Z-Image
  - More natural-language description
- `AI`
  - Internal field: `midjourneyPrompt`
  - Compact natural prompt derived from Gpt sections
  - Must not drop selected wardrobe, clothing, pose, or action details
  - Duo mode uses a compact labeled format, not the older single-paragraph compression

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

### PAGE2 Character Reference

PAGE2 is separate from PAGE1 and is used for character / identity reference prompts. It does not inject role text back into PAGE1. It has its own prompt preview and DLL PIC Pro panel.

### PAGE3 World Scene

PAGE3 is separate from PAGE1 and PAGE2. It builds scene / world / environment prompts and has its own prompt preview and DLL PIC Pro panel.

### SUNO

SUNO is a music style prompt builder. It is not part of PAGE1 image prompt generation.

## DLL PIC Pro / Image Analyzer

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

## Current PAGE1 Control Rules

### Subject Routing

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

### Prompt Pipeline

- `buildStructuredGrokPrompt()` creates the detailed structured source.
- `buildGptPromptFromStructuredPrompt()` converts it into the current `Gpt` output.
- `buildZImagePrompt()` creates the natural `Grok/Z-Image` output.
- `buildAiPromptFromStructuredPrompt()` creates the compact `AI` output.
- `buildPrompts()` returns the three historical fields:
  - `midjourneyPrompt`
  - `grokPrompt`
  - `zImagePrompt`

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
- `specialActionId`
  - Legacy hidden control after the special-action-to-Pose-Composer migration.
  - PAGE1 no longer exposes it as an independent B 神情姿態 field.
  - Existing saved cards / restore data are migrated into Pose Composer locks where possible.

New Pose Composer controls:

- `poseBaseId`
- `poseArrangementId`
- `poseHandId`
- `poseAnchorId`
- Duo-only controls:
  - `duoPoseId`
  - `duoPoseBaseId`
  - `duoExpressionId`

Rules:

- Pose Composer is single-subject only.
- Duo mode ignores Pose Composer and uses `duoPoseId` / `duoPoseBaseId` / `duoExpressionId`.
- In PAGE1 UI, Pose Composer is mutually exclusive with old `poseId`; the old `specialActionId` field is hidden.
- Legacy social shooting actions are migrated into Pose Composer hand poses.
- Engine priority: if Pose Composer resolves, it outputs instead of old `poseId`; legacy `specialActionId` restores are normalized into Pose Composer locks and cleared.
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

PAGE1 app state and control filtering:

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/App.jsx`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/Page1Workspace.jsx`

Shared PAGE UI / prompt display:

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/PromptCard.jsx`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/PromptPreviewCard.jsx`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/DllPicProPanel.jsx`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/ImagePromptAnalyzerPanel.jsx`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/dllPicProClient.js`

PAGE1 helpers:

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/page1SectionRandom.js`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/page1WorkspaceSummary.js`

Knowledge base:

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/knowledge_base`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/data/database.json`
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/scripts/sync_to_json.py`

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
- `engineLightingCompatibility.test.js`
- `page1SectionRandom.test.js`
- `page1WorkspaceSummary.test.js`

Prefer targeted tests first, then full `npm test`.

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

- Real-generation test Pose Composer with fixed combinations before expanding the database.
- Expand Pose Composer options in batches only after stable results:
  - standing / sitting first
  - kneeling / squatting next
  - modifiers last
- Continue database additions through the relevant authoring guide first.
- For PAGE1 single-subject prompt wording, also use `Docs/specs/page1-single-prompt-compression-guide.md` to avoid redundant prompt prose before adding new database rows.
- Keep prompt-output changes backed by tests because naming and source-field history are easy to confuse.
