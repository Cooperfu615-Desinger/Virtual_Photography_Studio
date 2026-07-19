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

Prompt-quality governance added on 2026-07-15:

- Root `AGENTS.md` is the durable repository instruction surface. New and resumed sessions must read it with this current-state file, preserve unrelated dirty work, and use its validation matrix.
- `webapp/src/lib/engine/promptOutputContracts.js` defines machine-readable contracts for `grokPrompt`, `zImagePrompt`, `midjourneyPrompt`, and the single-subject `full-body-character` extra prompt.
- `webapp/src/lib/engine/representativePromptFixtures.js` owns nine deterministic regression scenarios: normal single, Pose Composer canonical grammar, random Pose Composer selfie with an incompatible rear orbit, Character Card, special outfit, duo, fixed composition, face close-up, and full-body reference.
- Composition visibility phase 1 is recorded in `webapp/src/lib/engine/compositionVisibilityContract.js`: it separates `faceDetail`, `headShoulders`, `chestUp`, `mediumWaist`, `cowboyKnee`, `fullBody`, and `unconstrained`, requires raw selection preservation, and defines source-traceable scene compression without renderer-invented depth effects. `compositionVisibilityFixtures.js` now owns sixteen deterministic regression cases spanning normal layers, dress, preset, special outfit, Character Card, duo, pose/support pressure, close/medium/full scene anchors, selection preservation, and full-body restoration.
- At the completion of phase 1, the new contract was behavior-neutral and was not connected to `engine.js` or PAGE1 lock transitions. Phase 2 activated state preservation and the `faceDetail` wardrobe boundary; phase 3 activated the remaining wardrobe buckets; phase 4 activated the shared Pose Composer projection; phase 5 activates the shared source-traceable scene projection.
- Composition visibility phase-1 validation on 2026-07-18: focused contract tests passed 5 tests; frontend `npm test` passed 464 tests; `npm run test:prompt-quality` passed 15 tests; lint and build passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained zero blocking, contract, duplicate, control-leakage, and contradiction signals, with the unchanged 13 diagnostic-only wardrobe/scene findings. Browser validation was not required because phase 1 changes no runtime or user-visible behavior.
- Composition visibility phase 2 makes close-up state non-destructive. Disabled close-up controls retain their normalized UI and `vps.locks` values; generated selections, Saved Cards restore, Character Card/body/wardrobe/Pose Composer/scene locks, and return-to-wide transitions preserve the same source choices. `faceDetail` main outputs hide normal and complete-look wardrobe text, while the single-subject full-body character output restores the complete resolved outfit. Explicit skirt selections now take precedence over random pants fallback so the stored selection and full-body reference cannot silently replace a requested skirt.
- Composition visibility phase-2 validation on 2026-07-18: focused close-up transition, wardrobe, and state-contract tests passed 40 tests; frontend `npm test` passed 467 tests; `npm run test:prompt-quality` passed 15 tests; lint and build passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained zero blocking, contract, duplicate, control-leakage, and contradiction signals, with the unchanged 13 diagnostic-only wardrobe/scene findings. Desktop 1440×1000 and mobile 390×844 browser smoke exercised all five workspaces plus the `faceDetail` to full-body composition transition: close-up-disabled controls became available again without document overflow, broken images, browser warnings, or console errors.
- Composition visibility phase 3 projects wardrobe visibility for `headShoulders`, `chestUp`, `mediumWaist`, and `cowboyKnee` before renderer formatting. All three main outputs share the same allowed clothing roles and source fragments across normal separates, dresses, outfit presets, special outfits, Character Cards, and duo roles. Dress identity is retained while out-of-frame hem/length details are removed; cowboy framing retains thigh-/knee-visible legwear conditionally and removes shoes. Generated selections remain complete, and the single-subject full-body character output restores all garments, shoes, bags, and accessories from its independent `fullBody` projection. Pose and scene projection remain out of scope for this phase.
- Composition visibility phase-3 validation on 2026-07-18: focused composition/wardrobe, Character Card, renderer, and compatibility tests passed 173 tests; frontend `npm test` passed 482 tests; `npm run test:prompt-quality` passed 15 tests; lint and build passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained the same 13 diagnostic-only wardrobe/scene findings with zero blocking, contract, duplicate, control-leakage, and contradiction signals. Browser validation at 1440×1000 and 390×900 exercised all five workspaces plus the `chestUp` → `fullBody` → `chestUp` transition: the three main outputs removed and restored lower-body wardrobe while the full-body character output stayed complete; no browser errors or broken images appeared. Desktop had no document overflow. Mobile navigation and prompt behavior passed, but PAGE1's existing `E 攝影成像` panel produced document width 398px against a 375px client width inside the 390px test viewport; no UI/CSS files changed in this phase, so this diagnostic remains separate from the Prompt behavior change.
- Composition visibility phase 4 projects one resolved Pose Composer structure into one canonical pose string before Gpt, Grok/Z-Image, and AI formatting. `faceDetail` and `headShoulders` omit it; `chestUp` keeps visible head, upper-body, hand/prop, and high support fragments; `mediumWaist` falls back to the pose base when a selected arrangement or support is below the waist; `cowboyKnee` keeps knee-level posture and support while removing foot-only actions; `fullBody` and `unconstrained` preserve the original canonical text exactly. Character Card and dedicated special-subject routes no longer embed an unprojected duplicate in Grok/Z-Image. Generated selections retain all source Pose Composer IDs, so widening the crop restores the complete pose.
- Composition visibility phase-4 validation on 2026-07-18: the focused projection fixture suite passed 7 tests; frontend `npm test` passed 490 tests; `npm run test:prompt-quality` passed 15 tests; lint and build passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained the same 13 diagnostic-only wardrobe/scene findings with zero blocking, contract, duplicate, control-leakage, and contradiction signals. Browser validation at 1440×1000 and 390×900 exercised all five workspaces plus `headShoulders`, `chestUp`, `mediumWaist`, `cowboyKnee`, and `fullBody`: projected pose text was shared exactly by Gpt, Grok/Z-Image, and AI, head-and-shoulders removed it, and full-body restored complete pose detail. No broken images or console errors appeared. Desktop had no document overflow; mobile retained the existing PAGE1 `E 攝影成像` width diagnostic (398px document width against a 375px client width). The existing compact camera descriptor also still matches `牛仔中景` as generic `中景` in the public opening line even though the visibility contract correctly uses `cowboyKnee`; neither unrelated UI/descriptor issue was changed in phase 4.
- Composition visibility phase 5 resolves one shared projected scene before Gpt, Grok/Z-Image, and AI formatting. `faceDetail`, `headShoulders`, and `chestUp` retain the first three source scene clauses as a compact background identity cue; `mediumWaist` and `cowboyKnee` retain the first five source clauses; `fullBody` and `unconstrained` preserve the complete source scene. Imported world-scene architecture follows the same crop mode, compact crops omit optional scene accents, and wider crops restore them from source. The projection never invents blur, bokeh, shallow depth of field, faint shapes, or framing-expansion instructions; those effects remain controlled only by selected imaging controls. Scene locks and generated selections remain unchanged, so widening the crop restores the omitted source anchors. Dedicated fixed composition sets retain their existing specialized scene contract.
- Composition visibility phase-5 validation on 2026-07-18: focused scene/contract tests passed 15 tests; frontend `npm test` passed 498 tests; `npm run test:prompt-quality` passed 15 tests; lint and build passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained the same 13 diagnostic-only wardrobe/scene findings with zero blocking, contract, duplicate, control-leakage, and contradiction signals. Browser validation at 1440×1000 and 390×900 exercised all five workspaces plus the `faceDetail` → `mediumWaist` → `fullBody` scene transition: the three main outputs kept the same compact source scene in the face crop and omitted pose, Gpt restored the fourth/fifth source clauses at medium and the complete source at full body, and no renderer exposed scene-priority, framing-expansion, or invented depth language. The selected location remained visible in PAGE1 state, with no broken images, browser errors, or warnings. Desktop had no document overflow; mobile retained the existing PAGE1 active `E 攝影成像` width diagnostic (398px document width against a 375px client width), which remains outside this Prompt-only phase.
- Composition visibility phase 6 completes renderer integration around the canonical projection. The Gpt section model, Grok/Z-Image renderer, AI scene/wardrobe consumers, and legacy non-Pose-Composer pose filtering no longer maintain a second close-up bucket or read the retired `Wardrobe Visibility` / `Scene Context` bridge. Face-detail wardrobe suppression now comes from the canonical `faceDetail` bucket, while old pose text still keeps its compatibility filtering but derives its crop from that same bucket. Fixed composition sets, duo candid-composition rules, complete full-body reference restoration, raw locks, and public output mappings remain unchanged. The sixteen composition fixtures now run as one cross-output integration regression inside `npm run test:prompt-quality`.
- Composition visibility phase-6 validation on 2026-07-18: focused composition/output tests passed 50 tests; frontend `npm test` passed 499 tests; the expanded `npm run test:prompt-quality` passed 16 tests; lint and build passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) kept the exact phase-5 word statistics and the same 13 diagnostic-only wardrobe/scene findings, with zero blocking, output-contract, duplicate, control-leakage, or contradiction signals. Browser validation at 1440×1000 and 390×900 exercised all five workspaces and generated both head-and-shoulders and full-body Prompt cases: the near crop omitted pose in all three main outputs, retained the projected source scene and upper wardrobe, while the independent full-body character output restored the trousers and bag; the full-body main output restored lower-body wardrobe and accessories. No broken images or app-origin console errors appeared. Desktop had no document overflow, and mobile retained the existing active `E 攝影成像` width diagnostic (398px document width against a 375px client width), unchanged from phases 3–5.
- Fixed-composition visibility optimization phase 1 on 2026-07-19 is behavior-neutral and adds deterministic representative fixtures for separates, special outfits, outfit presets, and dresses. Each fixture requires Gpt, Grok/Z-Image, and AI to preserve the selected wardrobe core together with the fixed lounge anchor. Manual framing remains disabled by product design while a fixed set is active; the dedicated fixed-set composition context and renderer-order changes remain pending for later phases, and the current Grok/Z-Image scene-first ordering is intentionally not recorded as the target contract.
- Fixed-composition visibility phase-1 validation on 2026-07-19: the representative contract suite passed 17 tests; frontend `npm test` passed 505 tests; `npm run test:prompt-quality` passed 22 tests; lint and build passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained the existing 13 diagnostic-only wardrobe/scene findings with zero required-output, duplicate, control-leakage, contradiction, or strict blocking signals. Browser validation was not required because this phase changes fixtures and documentation only, with no runtime or user-visible behavior change.
- `npm run test:prompt-quality` runs the contract, representative-fixture, conservative deduplication, and composition-visibility integration gates. The 2026-07-19 result is 22 passed.
- `npm run audit:prompts:strict` runs 200 prompts with seed `prompt-quality-baseline`. The 2026-07-15 baseline has zero contract errors, exact/near duplicate signals, public control-language leakage, contradictory constraints, and strict blocking signals. It retains 13 diagnostic-only findings: seven pants/legwear, four pants/skirt, and two swimwear/location combinations.
- Prompt output fixes made with the new gate: selected outfit colors replace `controlled by ... selection` wording when the control can be materialized; repeated identical accessory fragments are emitted once; Z-Image scene-priority guidance is natural text without its internal label; duo Z-Image/AI special-outfit role text no longer inherits internal guard clauses.
- PAGE1 Pose Composer P0 repair: section/global batch random now writes the five explicit `random` lock values instead of clearing the complete pose; canonical assembly chooses `a` / `an` from the resolved posture phrase, and high-risk arrangement, hand/action, selfie, and support fragments are normalized into grammatical positive phrases shared exactly by Gpt, Grok/Z-Image, and AI.
- Pose Composer P0 validation on 2026-07-15: focused prompt/pose/random tests 98 passed; frontend `npm test` 441 passed; `npm run test:prompt-quality` 14 passed; lint and build passed; the same-seed strict audit retained zero blocking signals and the same 13 pre-existing diagnostics. Desktop 1440×1000 and mobile 390×900 browser smoke passed all five workspaces with PAGE1 batch-random interaction, exact shared canonical output, no overflow, broken images, app page errors, or failed declared app assets. Desktop Chrome still makes an automatic request for the undeclared `/favicon.ico` and receives the existing 404; this P0 work does not add or change favicon assets.
- PAGE1 Pose Composer P1 repair: seeded random resolution now follows the documented `base -> arrangement -> hand -> head -> anchor` order. When a random hand resolves to a selfie, the final resolved selection clears an incompatible orbit even if the raw orbit lock was explicit; renderer context, saved/applied selection, and Generation Outputs summary all use that same resolved state. Non-selfie random results retain compatible explicit orbit locks, and standalone hand/head behavior remains unchanged.
- Pose Composer P1 validation on 2026-07-16: focused PAGE1 summary/prompt/pose/random tests passed 73 tests; frontend `npm test` passed 446 tests; `npm run test:prompt-quality` passed 15 tests; lint and build passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained zero blocking, contract, duplicate, control-leakage, and contradiction signals, with the unchanged 13 diagnostic-only wardrobe/scene findings. Desktop 1440×1000 and mobile 390×900 browser smoke exercised all five workspaces, PAGE1 random-selfie generation, exact shared canonical output, DLL PIC source switching, apply-preview, and Saved Cards save/restore without broken images or browser errors. The active PAGE1 E editor still exposes a pre-existing mobile grid min-content overflow (`399px` document width at a `390px` emulated viewport); hiding Generation Outputs leaves it unchanged, so this unrelated CSS issue was not modified in the P1 prompt repair.
- Pose Composer contact/prop redesign: `posePropId` is now an independent saved/UI control. Six legacy prop-action IDs move out of `poseHandId` and become five public options; the two lipstick variants converge on `hand-apply-lipstick` with model-decided clean-to-slightly-smudged finish. V1 keeps hand and prop mutually exclusive, preserves an explicit prop during five-layer pose batch random, migrates old hand-stored prop IDs and both legacy lipstick Markdown descriptions, and carries the resolved prop through canonical prompt text, selection snapshots, summaries, Saved Cards, and Markdown restore.
- Contact/support now exposes six generic relationship anchors, retains the ornate velvet armchair, bathtub, water anchors, and adds mirrored stainless-steel and transparent acrylic cube plinths for editorial use. Lower-generality legacy anchors keep their exact IDs and prompt behavior but are `uiHidden`, excluded from random, and shown only while restoring their selected legacy value. Contact random may resolve to `全無` so it does not force a support object into every generated image.
- Pose Composer contact/prop validation on 2026-07-17: focused pose, prompt, restore, random, selector, and summary tests passed 190 tests, and the follow-up legacy Markdown parser suites passed 14 targeted tests; frontend `npm test` passed 459 tests; `npm run test:prompt-quality` passed 15 tests; lint and build passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained zero blocking, contract, duplicate, control-leakage, and contradiction signals, with the unchanged 13 diagnostic-only wardrobe/scene findings. Desktop 1440×1000 and mobile 390×900 browser smoke exercised all five workspaces, hand/prop last-action takeover, explicit-prop batch-random preservation, generic and editorial anchor visibility, exact lipstick/cube prompt output, and Saved Cards restore with no document overflow, clipped controls, broken images, console/page errors, or failed declared app assets.
- Frontend completion criteria are formalized in `Docs/specs/frontend-visual-validation.md`, including desktop/mobile rendering, five-workspace navigation smoke, console/page-error checks, overflow checks, interactions, and evidence reporting.
- Frontend `npm test`: 438 passed. Frontend `npm run lint` and `npm run build`: passed. Prompt-audit unit tests: 12 passed.
- Browser smoke at 1440×1000 and 390×900 passed across Prompt 工作台, 角色建模, 動作姿勢, 場景建模, and Saved Cards: no document-level horizontal overflow, broken images, browser errors, or public prompt control-language leakage; PAGE1 random generation also completed successfully.

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
  - 已實作：與 Gpt 使用相同 resolved selections 的「來源可追溯刪減式重組」；只刪除冗詞、內部控制語與重複描述，只用最小語法連接既有內容，不補寫新的視覺描述。完整身材數值／比例 anchor、已選服裝與配色、動作、場景、光線及攝影設定不可遺失。
  - 已實作：特殊穿搭內建的髮型、髮色、刺青與身體記憶點進入人物句，不留在 `She wears complete special outfit` 句。
- `AI`
  - Internal field: `midjourneyPrompt`
  - Compact natural prompt derived from Gpt sections
  - 已實作（單人）：同源自由導向的極簡版；一般模式保留完整身材數值／比例、髮型髮色、眼鏡耳機、極簡服裝、場景與成像；非 Pose Composer 路徑可省略五官、表情、姿勢／動作與光線，Pose Composer 啟用時使用依景別投影、三組逐字共用的 canonical pose
  - 已實作（角色卡）：完整保留結構化五官、膚質、永久特徵、身形與髮型髮色，服裝極簡化且避免與 PAGE1 服裝重複
  - 已實作（特殊穿搭／套裝／連身服）：保留主服裝／主風格、關鍵衣物、外套、鞋襪與必要配件；內建髮型、髮色、刺青與身體記憶點移入人物句
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
- Random / clear actions follow the contract in [specs/page1-random-none-control-contract.md](specs/page1-random-none-control-contract.md): randomizable controls clear their locks, takeover and required controls keep explicit defaults, and the clear action is labelled 清空可清除項目.
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

Batch random / clear actions are capability-aware:

- Global and section random actions preserve subjectCount, do not auto-enable special subjects, character cards, fixed-composition sets, or image-type takeover, and reset those controls to explicit defaults.
- Single-subject Pose Composer randomizes all five composer locks so the engine can resolve one compatible pose bundle; it must not leave only expression randomized while the pose fields stay 全無.
- `posePropId` remains independent from those five locks. Batch random preserves its current value; an active prop takes over and clears the hand layer, while manual prop `隨機` resolves after the five-layer sequence.
- Clear actions remove only fields with an explicit 全無 option. Required controls keep their declared defaultValue.
- PAGE1 button labels and tooltips are part of this compatibility contract. See specs/page1-random-none-control-contract.md.

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

Shared composition opening (implemented 2026-07-12):

- All three primary outputs can begin with the same short image-type sentence, followed by the same compact composition line and then the model-specific subject line.
- The composition line combines framing, camera height/pitch, and orbit, for example `Chest-up portrait, eye-level view, front-left three-quarter view`.
- Long framing / angle / orbit descriptions are removed from later camera sections to avoid dilution and duplicate instructions.
- Page 1 orbit controls display `正面`、`左前`、`左側`、`左後`、`背面`、`右後`、`右側`、`右前`; legacy numeric IDs remain unchanged internally.
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
- `posePropId`
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
  - `單人設置`: `expressionId`, `poseBaseId`, `poseArrangementId`, `poseHandId`, `posePropId`, `poseHeadId`, `poseAnchorId`
  - `雙人設置`: `duoPoseId`, `duoPoseBaseId`, `duoExpressionId`
- `單人設置` is enabled for `subjectCount === "1"` and disabled for duo mode; `雙人設置` is enabled for `subjectCount === "2"` and disabled for single mode.
- Legacy social shooting actions are migrated into Pose Composer hand poses.
- Legacy hand-stored prop actions migrate into `posePropId`; an active V1 prop clears `poseHandId`, and the merged lipstick option lets the image model choose a clean or slightly smudged finish.
- Engine priority: if Pose Composer resolves, it outputs instead of old `poseId`; legacy `poseId` and `specialActionId` restores are normalized into Pose Composer locks and cleared.
- Scene conflict checking for Pose Composer is intentionally not implemented yet.
- `Pose Modifier` is intentionally not implemented yet.
- `poseArrangementId`, `poseHandId`, and `poseHeadId` use the visible option name `任意` (legacy option IDs remain unchanged). `任意` means the group supplies no fixed description and lets the model choose a casual, relaxed, natural result from the selected base pose, wardrobe, camera, and scene; it is not random selection.
- `隨機` never resolves to `任意`; base, arrangement, hand, prop, and head random resolve to concrete options, while anchor random alone may resolve to `全無`. `全無` contributes no text.
- The shared canonical pose sentence orders concrete head text, active prop text (otherwise concrete hand text), then the pose result. If arrangement, hand, or head is `任意`, the natural qualifier is appended once only. A concrete arrangement uses its concrete pose name; an `任意` arrangement falls back to the base pose name.
- Concrete posture results use grammar-aware indefinite articles, and option English must remain a predicate-compatible noun/action phrase rather than renderer instructions or negative control language.
- Support/contact (`poseAnchorId`) is part of the pose result, for example `... presents a wide-knee kneeling pose leaning against a high-back chair.`
- New anchor authoring is relationship-first and code-defined in `webapp/src/lib/engine/poseComposerOptions.js`. Deprecated scene-bound anchors stay restorable but do not appear in the normal picker or random pool.
- When Pose Composer is active, GPT, Grok/Z-Image, and AI all reuse the exact same canonical pose text. Model-specific renderers may change only the surrounding section label or paragraph layout; they must not compress or rewrite pose semantics.

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

Completed on 2026-07-12:

- Added the shared compact composition opening to Gpt, Grok/Z-Image, and AI renderers.
- Removed duplicated long framing / angle / orbit clauses from the main Gpt and Z-Image camera sections.
- Applied AI visibility filtering so chest-up prompts omit hidden pants, legwear, and shoes while preserving upper garments.
- Added regression coverage for shared composition text and short orbit labels.

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
- Follow up separately on the pre-existing PAGE1 mobile E-editor grid min-content overflow; it is independent of Pose Composer prompt resolution and should be handled as a focused frontend layout change.
- Expand Pose Composer options in batches only after stable results:
  - standing / sitting first
  - kneeling / squatting next
  - modifiers last
- Continue database additions through the relevant authoring guide first.
- For PAGE1 single-subject prompt wording, use `Docs/specs/page1-single-prompt-compression-guide.md`. Gpt is now full-fidelity; Grok/Z-Image and AI are the compact outputs.
- Keep prompt-output changes backed by tests because naming and source-field history are easy to confuse.
