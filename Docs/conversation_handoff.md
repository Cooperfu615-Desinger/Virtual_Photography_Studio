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

### 2026-07-13 Pose Composer canonical prompt update

- `poseArrangementId`、`poseHandId`、`poseHeadId` 的顯示名稱為 `任意`，但沿用既有 option ID；`任意`代表不指定固定描述，讓模型依基底姿勢、服裝、鏡頭與場景產生隨意、放鬆且自然的結果，不代表隨機抽選。
- `隨機` 只會解析為具體選項，`全無` 則完全省略該組文字。
- 三組姿勢選項共用 canonical 順序：具體頭部描述 → 具體手部描述 → 姿勢結果；任一組為 `任意` 時只加入一次自然語意。
- 接觸／支撐（`poseAnchorId`）整合在姿勢結果內，例如 `... presents a wide-knee kneeling pose leaning against a high-back chair.`
- Pose Composer 啟用時，GPT、Grok/Z-Image、AI 直接共用完全相同的 canonical pose prompt；不得因模型而刪減、壓縮或改寫姿勢語意，僅可有不同外層標題或排版。

## Snapshot

- Repo: `/Users/cooperfu/Desktop/Virtual_Photography_Studio`
- Frontend: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp`
- App type: Vite + React prompt generator with optional Firebase Favorites sync
- Knowledge base source: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/knowledge_base`
- Sync script: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/scripts/sync_to_json.py`
- Synced data target: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/data/database.json`
- Baseline for the facial-identity optimization: `main` at `45ee3ea`

## Validation

Standard validation flow:

- From repo root when knowledge base markdown changes: `python3 scripts/sync_to_json.py`
- From repo root after syncing: `python3 scripts/sync_to_json.py --check`
- Data and asset checks:
  - `python3 -m unittest discover -s scripts/tests`
  - `python3 scripts/check_public_assets.py`
- From `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp`:
  - `npm test`
  - `npm run lint`
  - `npm run build`

Previous implementation validation on 2026-07-10 before the facial-identity optimization:

- Frontend test count was superseded by the 2026-07-11 result below.
- Frontend `npm run lint` and `npm run build`: passed without a Vite chunk-size warning.
- Functions `npm test`: 30 tests passed.
- Functions `npm run lint`: passed with the active repository ESLint configuration.
- Functions test discovery uses `node --test test/*.test.js` for Node 20 CI compatibility. Do not restore `test/**/*.test.js` unless nested test directories are introduced and shell-independent discovery is added; the recursive pattern blocked GitHub Pages deployment on 2026-07-10.
- Browser QA confirmed PAGE2 pagination is `10 + 7`, all seven new previews load, Olivia's removable cap and hair variants render, the six copy outputs remain available, and the desktop five-column layout has no horizontal overflow.
- Git reference and object validation passed after stale synced-directory conflict copies were removed.
- Public asset budget validation passed with 185 deployment files totaling 2,378,672 bytes. Full-resolution character sources remain under `source-assets/`.

Optional dev server:

- `npm run dev -- --host 127.0.0.1 --port 5175`
- URL: `http://127.0.0.1:5175/Virtual_Photography_Studio/`

QA notes from 2026-06-25:

- A stale `enginePromptPipeline.test.js` expectation was aligned with the current face-only close-up policy: `AI` should omit hidden wardrobe and should not inject the old default spaghetti-strap dress fallback.
- In-app Browser rendered QA could not operate native `<select>` values through `selectOption`, keyboard, or coordinate fallback. Pose Composer select dependencies and prompt output remain covered by unit tests; rendered QA covered page load, buttons, prompt output updates, console health, and responsive layout.

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
  - 已實作（單人）：同源自由導向的極簡版；一般模式只保留完整身材數值／比例、髮型髮色、眼鏡耳機、極簡服裝、場景與成像，刻意省略五官、表情、姿勢／動作與光線
  - 已實作（角色卡）：完整保留結構化五官、膚質、永久特徵、身形與髮型髮色，服裝極簡化且避免與 PAGE1 服裝重複
  - 已實作（特殊穿搭／套裝／連身服）：保留主服裝／主風格、關鍵衣物、外套、鞋襪與必要配件；內建髮型、髮色、刺青與身體記憶點移入人物句
  - Duo mode uses a compact labeled format; single mode remains a compact natural sentence
  - In face-only close-up, hidden wardrobe should be omitted instead of replaced by a default visible dress phrase

Do not rename the internal fields casually. Many saved cards, import/export paths, and older helper names still rely on them.

### Character-card facial identity contract (2026-07-11)

- The 27 formal cards use the structured profile fields `facialGeometry`, `eyeSignature`, `noseSignature`, `mouthSignature`, `skinSignature`, `makeup`, `body`, and `distinctiveFeatures` in addition to the historical `identityAndBody` string.
- `webapp/src/lib/engine/characterProfiles.js` is the sole formal-card data source. It contains the 27 integrated IDs, structured identity fields, legacy string, hair, wardrobe, and preview metadata. Do not create a second profile dataset.
- Original references live at `source-assets/character-cards/<character-folder>/`; manifest-backed deployment previews live at `webapp/public/character-cards/<character-folder>/<reference>.avif`. The complete approved roster and source folders are in [`specs/character-card-facial-identity.md`](specs/character-card-facial-identity.md).
- Treat `identityAndBody` as a read-compatible legacy field: Saved Cards, PAGE1 selection snapshots, PAGE2 bundles, and old prompt consumers may still depend on it. Do not replace it with one of the facial subfields.
- New full-fidelity renderers use the structured facial fields as the canonical prompt representation and do not repeat the complete legacy paragraph alongside them. Grok/Z-Image and compact outputs append all four identity anchors in both full-default and selected-layers modes.
- `face`, `skin`, and `makeup` aliases emitted by Character Card Lab must resolve to separate schema fields, never the same mixed identity string.
- The four comma-separated `distinctiveFeatures` fragments are mandatory identity anchors. Full Gpt / full-body blocks render all facial fields; PAGE1 compact AI and PAGE2 outputs must preserve all four fragments after compression.
- Eleanor's horns, red eyes, facial marks/sigil, and arcane tattoos are permanent biological or supernatural identifiers, not removable styling.
- The formal specification, matrix, compatibility contract, and future-change workflow are in [`specs/character-card-facial-identity.md`](specs/character-card-facial-identity.md). Do not use hair, outfit, eyewear, or makeup as the sole differentiator.
- Validation: frontend 407 tests, frontend lint/build, Functions 30 tests/lint, data sync checks, and public-asset budget checks pass. The 200-prompt deterministic audit reports existing wardrobe heuristic findings and no facial-identity issue.
- Before adding or changing a card: review every available original view, update only `characterProfiles.js` for identity facts, write exactly four anchors, update the matrix and pair tests, then run the documented validation flow.

### Product Architecture

- PAGE1 is the main full portrait prompt workspace.
- PAGE2 is the Character Card Lab for PAGE1 `A 人物設定`, with 27 built-in cards across three pages (`10 / 10 / 7`).
- PAGE3 is the world / scene prompt workspace.
- SUNO has been removed from active app navigation / workspace flow; the user plans a separate music prompt tool.
- The unreachable SUNO workspace, prompt builder, tests, and CSS were removed on 2026-07-10. Historical saved cards remain plain stored prompt records.
- PAGE1 / PAGE2 / PAGE3 currently include DLL PIC Pro generation panels.
- PAGE1 includes section-scoped random controls, prompt restore / backfill, saved cards, Favorites, lighting reference modal, and wardrobe reference image picker cards.
- PAGE1 reroll is last-result-aware: unlocked scene, camera, lighting, imaging, character, pose, and main wardrobe choices exclude the previous selection when a compatible alternative exists; explicit locks are preserved.
- `App.jsx` is a 546-line application shell. Saved Cards codec/storage/cloud sync, PAGE1 state/schema/selectors/transitions, and PAGE3 card construction are feature-owned modules.
- All five workspaces are loaded with `React.lazy`; workspace CSS and the Saved Cards ZIP implementation are separate build chunks.
- Magnific and BytePlus browser/Functions payloads share the versioned `/functions/shared/imageProviderContract.json` contract.

### DLL PIC Pro

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

### Subject Model

- `subjectCount` controls normal subject count:
  - `1`
  - `2`
- Legacy saved cards / imports with `subjectCount: "reference"` normalize to `subjectCount: "1"`.
- Special characters are controlled by `specialSubjectId`, not `subjectCount`.
- Current special subjects include:
  - `黑骷髏`
  - `白骷髏`
  - `日本戰國武士`
  - `歐洲騎士`
  - `女性人形機器人`
- PAGE1 no longer exposes `上傳人物` as a subject-count mode, and PAGE1 prompts no longer emit reference-guidance lines from `subjectCount`.

### Pose / Action / Pose Composer

Existing controls:

- `poseId`
  - Legacy compatibility field only.
  - PAGE1 no longer exposes it in B 神情姿態.
  - Restore / normalize migrates old values into Pose Composer locks and clears `poseId`.
- `specialActionId`
  - Legacy hidden control after the special-action-to-Pose-Composer migration.
  - PAGE1 no longer exposes it as an independent B 神情姿態 field.
  - Existing saved cards / restore data are migrated into Pose Composer locks where possible.

Pose Composer controls:

- `poseBaseId`
- `poseArrangementId`
- `poseHandId`
- `poseHeadId`
- `poseAnchorId`

Duo-only controls:

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
- Pose Composer scene compatibility is intentionally not implemented yet. The user currently prefers free combination.
- `Pose Modifier` is intentionally not implemented yet. Test base + arrangement + hand + anchor first.
- Legacy `duoInteractionId` and separated A/B expression controls are hidden / migrated. Do not reintroduce them.

### Current Key Files

- Prompt engine: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/engine.js`
- App shell / cross-workspace orchestration: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/App.jsx`
- PAGE1 state and derived controls: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/features/page1/`
- Saved Cards codec, persistence, and cloud sync: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/features/saved-cards/`
- Shared provider contract: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/functions/shared/imageProviderContract.json`
- PAGE1 UI: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/Page1Workspace.jsx`
- PAGE2 UI: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/Page2Workspace.jsx`
- PAGE3 UI: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/Page3Workspace.jsx`
- Prompt cards: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/PromptCard.jsx`
- Prompt preview cards: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/PromptPreviewCard.jsx`
- DLL PIC Pro panel: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/components/DllPicProPanel.jsx`
- DLL PIC Pro client: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/dllPicProClient.js`
- Section random helper: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/page1SectionRandom.js`
- PAGE1 summary helper: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/page1WorkspaceSummary.js`
- Character Card Lab helper: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp/src/lib/characterCardLab.js`

## Authoring Guides

Five spec files exist under `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs`:

- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/character-section-a-authoring-guide.md`
  - Use before adding or changing body type, face type, skin, hairstyle, hair color, expression, pose, special action, Pose Composer, or special subject.
- `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/page1-single-prompt-compression-guide.md`
  - Use before adding or changing PAGE1 single-subject prompt wording. It defines the current Gpt / Grok/Z-Image / AI compression rules and single Gpt special-outfit grouping rules.
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
- Single `Gpt` keeps the main section order `Image Type`, `Subject`, `Wardrobe`, `Pose and Composition`, `Scene`, `Lighting`, `Camera Look`.
- Single special outfits place built-in hair, body, tattoo, and other person-detail fragments in `Subject` under `Hair and body details`; `Wardrobe` uses named `Full outfit` and `Headwear, eyewear, and bag` subsections so clothing and removable accessories remain easy to inspect and edit.
- Single character profile cards use structured facial geometry, eye, nose, mouth, skin, makeup, body, permanent-anchor, hair, outfit, accessory, and photographic-direction groups inside `Subject`; the legacy `identityAndBody` paragraph stays available to compatibility consumers but is not repeated by the full renderer.
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
- 已實作：Grok/Z-Image 以和 Gpt 相同的 resolved selections／完整語意內容為來源，做來源可追溯的刪減式重組；renderer 不補寫新的視覺描述、穿搭關係或氣氛詞。
- 已實作：只刪除冗詞、一般正常狀態、內部控制語與重複描述，並用 `with`、`and`、`She wears`、逗號與句號等最小語法連接既有片段。完整身材數值／比例 anchor、已選服裝與配色、動作核心、場景 anchor、光線方向與主要攝影設定必須保留。
- 已實作：特殊穿搭內建的髮型、髮色、刺青與身體記憶點屬於人物資訊，移入人物句，不在 `She wears complete special outfit` 句。
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
- 2026-07-12 已實作共用開頭：成品類型短句後，先輸出精簡的景別／俯仰角度／環繞角度句，再輸出人物句。構圖句使用 `Chest-up portrait, eye-level view, front-left three-quarter view` 這類幾何短語，並移除後段重複的完整 camera 描述。

### AI

- Compact natural prompt.
- Source should be the Gpt structured sections.
- 已實作（先限單人）：使用和 Gpt／Grok-Z 相同 resolved selections，只做刪除、重排與最小語法連接；不使用關鍵字映射、風格 shorthand、mood tail、負面 guard 或 fallback 補寫語意。
- 2026-07-12 已實作共用開頭：成品類型短句後，先輸出同一條精簡景別／俯仰角度／環繞角度句，再進入 AI 的人物句；構圖句不再留在成像段落末端。
- 一般單人保留四個內容句：人物（完整身材數值／比例、髮型髮色、眼鏡耳機）、極簡穿搭、場景（地點＋1–2 anchor＋必要時段／天氣）、成像（風格＋主要鏡頭／光學＋成像模擬）。五官、膚質、表情、姿勢／動作與光線交由模型自由決定。
- 角色卡單人模式完整保留結構化五官、膚質、永久特徵、身形、髮型髮色與有效眼鏡／耳機；服裝仍極簡，且不得與目前 PAGE1 服裝重複。
- 特殊穿搭、套裝與連身服只保留主服裝／主風格、關鍵衣物結構、外套、鞋襪與一項必要配件；特殊穿搭內建髮型、髮色、刺青與身體記憶點移入人物句。
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
- `subjectCount` should only decide subject quantity.
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
  - Splits `神情姿態` into `單人設置` and `雙人設置`.
  - Adds Pose Composer controls under `單人設置`.
  - Filters arrangement / anchor options based on selected base.
  - Handles subject-count-based panel disabling.
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
- PAGE1 的構圖開頭使用固定短語：景別（crop）、俯仰角度（camera height / pitch）、環繞角度（orbit）。UI 環繞角度顯示兩字方向標籤，數字只留在內部相容性資料。

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

PAGE2 is the Character Card Lab for PAGE1 `A 人物設定`.

- Selects 27 built-in character cards. The first page contains the original 10; the second page contains `26_Yuna`, `41_Eleanor`, `22_Olivia`, `08_Jiwoo`, `05_Chihiro`, `04_Koto`, `00_Mei`, `01_Rei`, `09_Amy`, and `10_Ji-Yoo`; the third page contains `13_Yui`, `14_Nana`, `15_Emily`, `16_Shiori`, `18_Natsuki`, `19_Minji`, and `20_Manami`.
- Supports character-safe hair styling variants that preserve the base hair identity.
- Supports `預設` / `戴眼鏡` / `不戴眼鏡`, including PAGE1 import behavior.
- PAGE2 owns which character-card wardrobe layers are imported into PAGE1.
- Imports structured character-card state back into PAGE1:
  - `characterProfileId`
  - hair variant
  - selected character-card wardrobe layers
  - prompt override text
- PAGE1 displays imported wardrobe layers as `來自角色卡｜...` and can fill missing wardrobe layers normally.
- Reimporting from PAGE2 only replaces same-layer PAGE1 choices for layers included by PAGE2.
- PAGE2 produces six prompt outputs:
  - `GPT Prompt`
  - `Grok/Z-Image Prompt`
  - `AI Prompt`
  - `Headshot Prompt`
  - `Four-View Prompt`
  - `Full-Body Reference Prompt`
- Has its own DLL PIC Pro panel using the six Character Card Lab outputs as prompt sources.
- Desktop layout uses two vertical blocks. The upper block has a 5-column, 10-card paged grid plus PAGE1 import controls; the lower block has six copy buttons plus DLL PIC Pro.

Character-card authoring workflow:

- Keep full-resolution sources and alternate views under `source-assets/character-cards/<lowercase-name>/`.
- Generate one 640px AVIF deployment preview under `webapp/public/character-cards/<lowercase-name>/`.
- Register the source/preview pair in `knowledge_base/character_reference_manifest.json`.
- Add detailed identity/body, face, hair, outfit, accessories, photographic direction, and reference metadata in `webapp/src/lib/engine/characterProfiles.js`.
- Add PAGE2 hair tags and removable wardrobe layers in `webapp/src/lib/characterCardLab.js`.
- Permanent anatomy belongs in identity, not removable wardrobe. Eleanor's horns, glowing eyes, facial markings, and body tattoos are the current example.
- A removable item that obscures hair still belongs in wardrobe. Olivia's black cap is a `headAccessory`; her uncovered center-parted chestnut waves remain the base hair identity.

### PAGE3

PAGE3 is a pure scene / world / environment prompt builder.

- Outputs scene / cinematic / world prompt styles.
- Supports city identity, worldview, photography style, time/weather, lighting mood, composition/lens language, and material/environment details.
- Can use PAGE1 photography styles in a scene-adapted way.
- Has its own prompt preview and DLL PIC Pro panel.

### SUNO

SUNO was removed from active app navigation / workspace flow because the user plans a separate music prompt tool.

- The unreachable SUNO source files were removed. Historical cards remain plain saved prompt data.
- Do not re-add SUNO to active navigation unless explicitly requested.
- Old `page5` saved cards should remain readable/copyable where compatibility still exists.

## Restore / Import / Favorites

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
- Saved Cards ZIP import accepts the app's own ZIP format only.
- ZIP import merges into current Favorites; duplicate ids are overwritten by imported entries.
- Invalid ZIP format rejects the whole import.
- Favorites no longer has the old 120-item cap.
- On first launch after the 2026-07-10 migration, legacy `vps.prompts` Feed cards are appended to Favorites without replacing richer Favorites records. Legacy keys are deleted only after the merged payload is saved successfully.

## Data and Reference Assets

- `knowledge_base/wardrobe_reference_manifest.json` maps every wardrobe item name to a stable reference ID, original source filename, and AVIF preview filename.
- `knowledge_base/item_metadata.json` and `outfit_preset_metadata.json` are explicit metadata sources; `database.json` is no longer used as an implicit metadata source.
- `python3 scripts/sync_to_json.py --check` validates manifest coverage, duplicates, source files, previews, metadata targets, and exact generated JSON without writing.
- Original wardrobe and character images live under `source-assets/`; only 640px AVIF previews live under `webapp/public` and enter the Vite deployment.
- `python3 scripts/build_image_previews.py` rebuilds previews locally with ffmpeg. `python3 scripts/check_public_assets.py` enforces the deployment budget in CI.

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
- PAGE1 random and clear behavior is defined in specs/page1-random-none-control-contract.md.
- Batch random preserves subjectCount and does not auto-enable special subjects, character cards, fixed-composition sets, or image-type takeover.
- Single-subject Pose Composer randomizes all five composer locks as one engine-resolved compatible bundle.
- The UI action is labelled 清空可清除項目 because required controls keep their declared defaults instead of pretending to support 全無.
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

## UIUX Discussion Protocol

The user confirmed on 2026-07-09 that the low-fidelity wireframe discussion process is useful for UIUX optimization.

For future UIUX work:

- Discuss direction before implementation when the change affects layout, operation flow, or visual hierarchy.
- Use quick low-fidelity generated wireframes when helpful to align the mental picture.
- Keep wireframes operational and product-like, not marketing pages.
- Clearly separate:
  - implemented current behavior
  - agreed next UIUX direction
  - open questions
- Do not treat generated wireframes as exact visual specs unless the user explicitly approves that level of fidelity.

### PAGE2 Character Card Lab UIUX State

The agreed PAGE2 UIUX polish is implemented.

Current behavior:

- The interface is split into two vertical blocks:
  - top block: character-card selection and PAGE1 import controls
  - bottom block: prompt copy actions and DLL PIC Pro
- Top block:
  - Character-card grid shows 10 large cards at a time, arranged 5 columns x 2 rows.
  - Cards are larger than the original v1 cards.
  - Each card shows only its preview image and character name.
  - Long default character descriptions are removed from the visible UI.
  - The catalog currently has 27 built-in characters and retains the future growth target of at least 40 without showing all cards at once.
  - Eyewear/glasses uses `預設` / `戴眼鏡` / `不戴眼鏡` and imports back to PAGE1.
  - Wardrobe-layer import choices are compact buttons instead of large cards/rows.
- Bottom block:
  - Six PAGE2 prompt outputs are copy-only buttons by default.
  - Long prompt text is not shown in the main PAGE2 layout.
  - The six buttons are:
    - `Copy GPT`
    - `Copy Grok/Z-Image`
    - `Copy AI Prompt`
    - `Copy 大頭照`
    - `Copy 四視圖`
    - `Copy 全身 Reference`
  - DLL PIC Pro uses a dropdown prompt-source selector for the six prompt outputs.
  - Prompt copy buttons do not change the DLL PIC Pro source.

Resolved decisions:

- Navigation beyond 10 visible cards uses previous/next pagination.
- `不戴眼鏡` clears character-card and PAGE1 eyewear when imported.
- Wardrobe import controls use compact active-state buttons.
- CSS import order must keep `features/page2/characterCard.css` after the shared `styles/workspaceLabs.css`; otherwise the shared desktop grid overrides the intended vertical PAGE2 shell.

## Current Best Next Work

- Real-generation test the seven new character cards across Gpt, Grok/Z-Image, and AI before tuning descriptions from observed model drift.
- Verify Eleanor's permanent anatomy, Olivia's removable cap, Jiwoo's white streak placement, and the visual separation among Chihiro, Koto, and Mei.
- Continue future cards through the source/preview/manifest/profile/layer workflow; the current data model does not need another redesign.
- Real-generation test Pose Composer before expanding it.
- Expand Pose Composer options in batches only after stable outputs:
  - standing / sitting first
  - kneeling / squatting next
  - modifiers last
- Continue database additions through the relevant authoring guide.
- Keep prompt-output changes backed by tests because current UI labels and historical source field names are easy to confuse.
- Continue small targeted additions rather than broad cleanup unless the user explicitly requests another broad cleanup pass.
