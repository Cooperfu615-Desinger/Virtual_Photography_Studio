# Virtual Photography Studio Current Project State

This is the short current-state briefing for new sessions. Read this first. Use `Docs/conversation_handoff.md` only when deeper history or rationale is needed.

Last updated: 2026-08-01

## Snapshot

- Repo: `/Users/cooperfu/Desktop/Virtual_Photography_Studio`
- Frontend: `/Users/cooperfu/Desktop/Virtual_Photography_Studio/webapp`
- App: Vite + React prompt generator
- Baseline for the facial-identity optimization: `main` at `45ee3ea`
- Normal working branch: `main`

## Current PAGE1 prompt outputs

- Single-subject output order is fixed as: `Gpt` (`grokPrompt`), `Grok/Z-Image` (`zImagePrompt`), `AI Prompt` (`midjourneyPrompt`), `胸上特寫照`, `MJ 胸上特寫照`, `全身角色照`.
- `胸上特寫照` remains the GPT structured `4:5` output. `MJ 胸上特寫照` uses the same resolved chest-up projection and canonical pose, but renders one Midjourney-native line with a contract-owned `--ar 4:5` tail and inherited F settings.
- `五官特寫照` is retired from active generation, PAGE1 cards, and DLL sources. The legacy preset metadata and saved-card `facial-closeup-portrait` entries remain readable for restore/serialization compatibility; old data is not deleted or rewritten.
- F parameter changes affect `midjourneyPrompt` and `chestUpMjPortraitPrompt`; the Gpt, Grok/Z-Image, structured chest-up, and full-body outputs remain parameter-free.
- Final validation passed on 2026-08-01: frontend `npm test` 635/635, `npm run test:prompt-quality` 116/116, lint, build, root prompt-audit tests 12/12, Python unit tests 2/2, `git diff --check`, and the 200-seed strict audit with zero blocking findings. Browser QA exercised the Prompt 工作台 at the default desktop viewport and 390×844 mobile viewport; all six outputs and six DLL sources were present, the MJ chest output used one native `--ar 4:5` line, and browser warnings/errors were empty.

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
- AI Prompt length optimization phase 1 is behavior-neutral. `aiPromptLengthContract.js` records single-subject budgets for normal (110 target／130 soft max), complete-look (115／130), and Character Card (150／170) outputs; image type, shared composition, and projected canonical pose are immutable, while hard truncation and partial sentence tails are prohibited. `aiPromptLengthFixtures.js` adds deterministic normal, latex preset, special outfit, dress, Jiwoo／Sui Character Card, canonical-pose, half-face, and duo-exclusion pressure cases. Runtime `renderAiPrompt()` and all public text remain unchanged in this phase.
- AI Prompt length phase-1 validation on 2026-07-23: the focused contract suite passed 4 tests; frontend `npm test` passed 568 tests; the expanded `npm run test:prompt-quality` passed 76 tests; lint, build, and `git diff --check` passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained the pre-change AI statistics (avg 98.8, median 98, p95 121, max 162), zero blocking signals, and the same 15 diagnostic-only wardrobe／scene findings. Browser validation was not required because phase 1 adds policy data, fixtures, tests, quality wiring, and documentation only; it changes no runtime renderer, UI, interaction, storage, or public Prompt text.
- AI Prompt length optimization phase 2 adds the section-aware `aiPromptBudget.js` boundary. The single-subject AI renderer now names and measures its image type, composition, subject, wardrobe, canonical pose, scene, and imaging producers, selects the normal／complete-look／Character Card policy from the shared resolved model, and recomposes the same text. Duo AI is explicitly excluded. Nine deterministic outputs retain their exact phase-1 SHA-256 values, so this infrastructure phase changes no public wording, spacing, selection, storage, or output mapping.
- AI Prompt length phase-2 validation on 2026-07-23: the focused contract／budget group passed 7 tests; frontend `npm test` passed 571 tests; the expanded `npm run test:prompt-quality` passed 79 tests; lint, build, and `git diff --check` passed. The same-seed strict audit retained identical AI statistics (avg 98.8, median 98, p95 121, max 162), zero blocking signals, and the same 15 diagnostic-only findings. Browser validation was not required because the section boundary reproduces all nine phase-1 outputs byte-for-byte and changes no visible UI or Prompt content.
- AI Prompt length optimization phase 3 activates normal-person and complete-look compression only. Generic Body Type silhouette endings and secondary hair-color explanations are removed while numeric／regional body anchors, hairstyle, primary hair color, eyewear, and headphones remain. Special outfits, outfit presets, and dresses are grouped by projected wardrobe role and retain their style／garment identities, necessary signature structures, legwear, footwear, and one accessory without repeated construction prose. The long latex fixture falls from 132 to 93 words and the long special-outfit fixture from 152 to 117; Character Card, scene, imaging, duo, canonical pose, raw selections, Gpt, Grok-Z, and derived outputs remain outside this phase.
- AI Prompt length phase-3 validation on 2026-07-23: the focused AI／wardrobe／output-contract group passed 78 tests and the shared crop-wardrobe group passed 22; frontend `npm test` passed 572 tests; `npm run test:prompt-quality` passed 80 tests; lint, build, and `git diff --check` passed. The same-seed strict audit lowered AI p95 from 121 to 119 and max from 162 to 130, with zero blocking signals and the unchanged 15 diagnostic-only wardrobe／scene findings. Browser QA at 1440×1000 and 390×900 exercised PAGE1 random generation plus all five workspaces, Character Card pagination, Action Pose selection, PAGE3 location update, and Saved Cards populated／empty filters. Every workspace had zero document overflow and broken images; AI output remained assigned to the correct card with no control-language leakage, and browser console warnings／errors were empty.
- AI Prompt length optimization phase 4 activates Character Card-only compression. The four authored permanent identity anchors become the canonical compact face representation instead of repeating the longer facial geometry, eye, nose, and mouth groups; skin tone, one makeup anchor, composition-projected body, principal hairstyle and signature color treatment, effective eyewear／headphones, user hair variants, and prompt overrides remain. Default Character Card wardrobe keeps one source garment identity per visible role plus the complete selected accessory text. Normal, complete-look, scene, imaging, duo, canonical pose, raw selections, Gpt, Grok-Z, and derived outputs remain outside this phase.
- AI Prompt length phase-4 validation on 2026-07-23: Jiwoo／Sui deterministic fixtures both satisfy the 170-word Character Card soft max and retain their permanent identity, hair, and wardrobe anchors. The focused Character Card／variant／body-projection group passed 37 tests; frontend `npm test` passed 573 tests; `npm run test:prompt-quality` passed 81 tests; lint, build, and `git diff --check` passed. The same-seed strict audit kept AI avg 98.6, median 98, p95 119, max 130, zero blocking signals, and the unchanged 15 diagnostic-only findings. Browser QA at 1440×1000 and 390×900 exercised all five workspaces and generated a Jiwoo AI Prompt; all permanent face and hair anchors were present with no internal-control leakage, while every workspace had zero document overflow, broken images, console warnings, or errors. A random half-face result measured 171 words because its immutable composition sentence is longer; global cross-section arbitration remains phase 5 scope.
- AI Prompt length optimization phase 5 adds soft-max arbitration to the section model. An already-compliant Prompt remains byte-stable. When a single-subject AI Prompt exceeds its policy soft max, arbitration first removes only secondary lens／film explanation while retaining photographer style, lens identity, selected optical effect, and film/rendering identity. If an eligible cropped composition is still long, it then removes secondary projected-scene anchors while preserving the source location identity and representative anchor. Full-body, unconstrained, and fixed-composition scenes never expose scene reductions because their shared composition contract requires the complete projected scene. Immutable image type, composition, and canonical pose sections are never alternatives; no hard truncation or partial sentence tail is available.
- AI Prompt length phase-5 validation on 2026-07-23: the new Jiwoo＋highlight-streaks＋half-face pressure fixture falls from 177 to 169 words while retaining every identity, upper wardrobe, location, photographer, lens, optical-effect, and film anchor required by the fixture. Nine already-compliant phase-4 fixtures retain exact SHA-256 output hashes. `npm run test:prompt-quality` passed 84 tests; frontend `npm test` passed 576 tests; lint, build, and `git diff --check` passed. The same-seed strict audit remained AI avg 98.6, median 98, p95 119, max 130, zero blocking signals, and the unchanged 15 diagnostics. Browser QA at 1440×1000 and 390×900 exercised the live Jiwoo half-face state and all five workspaces; its AI output measured 165 words with all required identity／scene／imaging anchors, zero control leakage, zero document overflow, zero broken images, and no console warnings or errors.
- AI Prompt length optimization phase 6 is the behavior-neutral completion gate. `aiPromptLengthIntegration.test.js` generates all ten deterministic length fixtures and verifies the three historical primary field mappings, public output contracts, resolved selection preservation, required AI identity／wardrobe／scene／imaging anchors, per-policy soft max, exact canonical-pose reuse, the single-subject budget boundary, duo exclusion, and immutable sections. It is now part of `npm run test:prompt-quality`; this phase changes no renderer text, UI, storage, IDs, or public mapping.
- AI Prompt length phase-6 final validation on 2026-07-23: the integration gate passed 2 tests; `npm run test:prompt-quality` passed 86 tests; frontend `npm test` passed 578 tests; lint, build, and `git diff --check` passed. The final same-seed strict audit remained AI avg 98.6, median 98, p95 119, max 130, zero blocking signals, zero control-language leakage, and the same 15 diagnostic-only wardrobe／scene findings. Final browser QA at 1440×1000 and 390×900 exercised a 165-word Character Card pressure output and all five workspaces; the output retained character, scene, and imaging identities with no leakage, and every workspace had zero document overflow, broken images, console warnings, or errors. All six AI Prompt length-optimization phases are complete.
- Midjourney V8 parameter phase 1 is behavior-neutral. `midjourneyParameterContract.js` defines the future PAGE1 `F｜MJ 參數設定` boundary for V8.2／V8.1, Standard／Raw, Stylize, Chaos, Weirdness, and SD／HD; the later F ratio control is intentionally deferred to phase 7. The contract keeps parameters outside the AI content budget, excludes F from PAGE1 randomization, preserves the historical `AI` → `midjourneyPrompt` mapping and exact canonical pose reuse, and freezes all current Body Type wording until user testing. Seven deterministic fixtures record byte-stable Gpt, Grok/Z-Image, and AI hashes across normal single, complete look, canonical pose, Character Card, duo, fixed composition, special outfit, dress, V8.1 compatibility, and SD／HD settings. Phase 1 registers no controls, changes no UI or public Prompt text, and appends no Midjourney parameters.
- Midjourney V8 parameter phase-1 validation on 2026-07-29: the focused contract suite passed 5 tests and the expanded `npm run test:prompt-quality` passed 91 tests. Lint, build, and the same-seed strict audit passed with zero blocking, integrity, duplicate, control-leakage, or contradiction signals; the audit retained 14 diagnostic-only wardrobe／scene findings. Full `npm test` passed 587 of 588 tests in two runs but remains blocked by a pre-existing non-deterministic `enginePromptPipeline.test.js` assumption: the unseeded fixture can trigger current soft-max removal of `snap-focus clarity`; running that file independently moved the failure to a separate exact wardrobe assertion when an unlocked outerwear item was sampled. The new phase-1 files do not register runtime controls or change renderer code, and all seven new deterministic hashes stay byte-stable. Browser validation was not required because this phase changes no public Prompt, UI, interaction, storage, or consumer behavior.
- Midjourney V8 parameter phase 2 adds the responsive PAGE1 `F MJ 參數設定` workspace. It exposes V8.2／V8.1, Standard／Raw, Stylize 0–1000, Chaos 0–100, Weirdness 0–3000, SD／HD, and the precise-realistic／balanced／creative presets through one contract-backed draft model. Numeric input and sliders share range normalization, presets only replace their declared creative controls, and the sidebar summary reflects the current draft. F remains excluded from PAGE1 random／clear actions. This behavior-neutral UI phase does not register engine locks, persist or restore the draft, or append parameters to any Prompt; those compatibility and output boundaries remain phase 3 and phase 4 work.
- Midjourney V8 parameter phase-2 validation on 2026-07-29: the focused UI／schema／contract group passed 13 tests; frontend `npm test` passed 594 tests; `npm run test:prompt-quality` passed 91 tests; lint, build, and `git diff --check` passed. The same-seed strict audit retained zero blocking, integrity, duplicate, control-leakage, or contradiction signals and the same 14 diagnostic-only wardrobe／scene findings. Browser QA at 1440×1100 and 390×844 exercised version, Raw, Stylize, HD, creative preset, and all three global random／clear actions. The six public Prompt values remained byte-identical during F-only changes; the F value stayed unchanged across global actions; both viewports had zero document overflow. No app response failed and no page error appeared. Chrome still requests the repository's pre-existing missing `/favicon.ico`, which is unrelated to the PAGE1 change and remains outside this phase.
- Midjourney V8 parameter phase 3 registers all six F fields as normalized `midjourney` lock values while keeping them excluded from random and clear actions. They now persist in `vps.locks`, enter every resolved PAGE1 selection, survive the existing Favorites v3 compact codec and cloud payload, and restore through preview or Saved Cards selection. Old locks and cards without F fields receive contract defaults; invalid enums, non-numeric values, decimals, and out-of-range integers are normalized without changing storage IDs or the Favorites version. F-only updates are removed from the live generation signature and merged back into selection afterward, so changing parameters updates state without rerolling any of the six current Prompt texts. Standard Prompt import preserves the current F settings until the phase-4 parameter tail becomes publicly parseable.
- Midjourney V8 parameter phase-3 validation on 2026-07-29: the focused normalization／selection／Favorites／random-clear group passed 30 tests; `npm run test:prompt-quality` passed 91 tests; lint, build, and `git diff --check` passed. The same-seed strict audit retained zero blocking, integrity, duplicate, control-leakage, or contradiction signals and the same 14 diagnostic-only wardrobe／scene findings. Full `npm test` passed 598 of 599 tests; the only failure is the documented pre-existing unseeded `enginePromptPipeline.test.js` wardrobe assertion, which expects the outfit sentence to begin with the top even when the unlocked resolver validly samples an outerwear item. Browser QA at 1440×1100 and 390×844 verified exact F persistence across reload, Favorites v3 compact storage, Saved Cards restore, byte-identical six-Prompt text during F-only changes, all five workspaces, and zero document overflow, failed app responses, or page errors. The repository's pre-existing missing `/favicon.ico` request remains the only console message.
- Midjourney V8 parameter phase 4 activates the contract-owned AI parameter tail. `midjourneyPrompt` now ends with one ordered tail containing version, resolved PAGE1 aspect ratio when available, optional Raw, Stylize, Chaos, Weirdness, and SD／HD; no descriptive text may follow it. Gpt, Grok/Z-Image, and the three fixed-framing outputs remain parameter-free. The assembler runs after AI content budgeting, and all AI length／audit measurements strip the recognized tail before counting or comparing descriptive content. F-only updates replace the tail without rerolling the live description. Standard Prompt and Markdown Saved Cards import parse the tail back into F locks and aspect ratio; inputs without a recognized final tail keep the user's current F settings.
- Midjourney V8 parameter phase-4 validation on 2026-07-29: the focused parameter-tail／Saved Cards group passed 54 tests, the expanded `npm run test:prompt-quality` passed 95 tests, and lint, build, documentation sync checks, root unit tests, and `git diff --check` passed. The same-seed strict audit retained zero blocking, integrity, duplicate, control-leakage, or contradiction signals, the same 14 diagnostic-only wardrobe／scene findings, and unchanged descriptive AI statistics because the recognized tail is excluded from content measurement. Full `npm test` passed 603 of 604 tests; the only failure is the documented pre-existing unseeded `enginePromptPipeline.test.js` secondary imaging-cue assertion, which can be removed by the current soft-max compressor after an unlocked random selection. Browser QA at 1440×1100 and 390×844 exercised live F-only tail replacement, Standard Prompt import, Saved Cards AI copy, and all five workspaces. Gpt, Grok／Z-Image, and the three fixed-framing outputs stayed byte-identical while AI descriptive content stayed stable; the canonical tail restored version, aspect ratio, creative controls, and resolution, with zero document overflow, broken images, console warnings, or errors.
- Midjourney V8 parameter phase 5 projects the completed AI description into one Midjourney-native text-prompt block before the canonical parameter tail. `renderMidjourneyNativeDescription()` changes only section whitespace to a single space and preserves every authored sentence, token, punctuation mark, word count, information order, Body Type source, and projected canonical pose. Single and duo AI outputs share the rule; Gpt, Grok/Z-Image, and the three fixed-framing outputs bypass it. Seven deterministic native-structure targets now freeze the phase-4 cases as one-block description hashes and remain part of `npm run test:prompt-quality`. No Midjourney-specific descriptor, Body Type, wardrobe, scene, imaging, or pose wording is reauthored in this phase.
- Midjourney V8 parameter phase-5 validation on 2026-07-29: the focused native-structure and affected compatibility tests passed, the expanded `npm run test:prompt-quality` passed all 98 tests, and lint plus build passed. The same-seed strict audit retained unchanged AI word statistics, zero blocking, integrity, duplicate, control-leakage, or contradiction signals, and the same 14 diagnostic-only wardrobe／scene findings. Full `npm test` passed 605 of 607 tests; both failures are the documented pre-existing unseeded `enginePromptPipeline.test.js` assumptions, where unlocked generation may validly sample outerwear before an outfit preset and the existing soft-max compressor may omit the secondary `snap-focus clarity` explanation. Browser QA at 1440×1100 and 390×844 exercised live random generation, the one-block AI description and final parameter tail, all six Prompt cards, and all five workspaces. AI descriptions contained zero line breaks, non-AI outputs remained parameter-free, and both viewports had zero document overflow, broken images, console warnings, or errors.
- Midjourney V8 parameter phase 6 completes the work with a behavior-neutral blocking integration gate. `midjourneyCompletionGate.test.js` regenerates all seven representative cases from one resolved selection and verifies engine outputs, all six public Prompt contracts, PAGE1 generation cards, DLL Prompt sources, Standard Prompt import, Favorites v3 round trips, Saved Cards Markdown import, historical field mappings, parameter-free fixed-framing outputs, and exact canonical-pose reuse. The machine-readable parameter contract now records these required consumers and mappings; renderer text, UI behavior, storage IDs, and public Prompt fields remain unchanged from phase 5.
- Midjourney V8 parameter phase-6 validation on 2026-07-29: the focused completion gate passed 4 tests and the expanded `npm run test:prompt-quality` passed all 102 tests. The same-seed strict audit retained AI avg 119.8, median 122, p95 130, max 133, zero blocking, integrity, duplicate, control-leakage, or contradiction signals, and the same 14 diagnostic-only wardrobe／scene findings. Full `npm test` passed 610 of 611 tests; its only failure is the documented pre-existing unseeded `enginePromptPipeline.test.js` assertion, where an unlocked outerwear item may validly precede the expected two-piece outfit wording. Lint, build, documentation sync／check, root unit tests, and `git diff --check` passed. Final behavior-neutral browser smoke at 1280×720 exercised live generation and all five workspaces: AI retained one description block plus its canonical tail, all non-AI cards remained parameter-free, and every workspace had zero document overflow, broken images, console warnings, or errors. No production or UI code changed in phase 6, so the phase-5 390×844 mobile result remains the current rendered mobile evidence.
- Midjourney V8 parameter phase 7 adds an independent AI-only `mjAspectRatio` control to `F｜MJ 參數設定`. The UI maps directly to common Midjourney `--ar` ratios (`1:1`, `4:3`, `3:2`, `16:9`, `21:9`, `2:3`, `3:4`, `9:16`, `1:2`, `4:5`, `5:4`) plus `跟隨 PAGE1`; the latter preserves the historical resolved `selection.aspectRatio` fallback. Explicit F ratios affect only `midjourneyPrompt`, remain excluded from global random／clear and generation rerolls, and do not replace the PAGE1 composition ratio. The canonical tail still emits one `--ar` at the existing parameter position, while Gpt, Grok/Z-Image, and derived fixed-framing outputs remain parameter-free. Legacy tail parsing keeps the historical PAGE1 ratio field and also restores the new F selection. This phase changes no descriptive wording, body-type language, storage IDs, or public field mappings.
- Midjourney V8 parameter phase-7 validation on 2026-08-01: focused contract／tail／state／UI／schema／archive tests passed 27 tests, including explicit `21:9` and `1:2` tail fixtures; `npm run test:prompt-quality` passed all 117 tests; the same-seed strict audit (`200`, `prompt-quality-baseline`) retained zero blocking／integrity／duplicate／control-leakage／contradiction signals and 12 existing diagnostic-only wardrobe／scene findings; frontend `npm test` passed all 628 tests, lint, build, and `git diff --check` passed. Browser QA at the default desktop viewport showed both new F options, verified the AI tail changed to `21:9` and `1:2` while Gpt／Grok-Z stayed parameter-free, and found zero document overflow; the existing 390×844 mobile validation and five-workspace checks remain clean. Official Midjourney documentation confirms `--ar` belongs at the end of the prompt, defaults to `1:1`, and supports the common ratios exposed here while accepting custom integer ratios. The independent-ratio regression preserves PAGE1's existing composition ratio and changes only `midjourneyPrompt`.
- After phase 7, the F UI keeps the existing discrete `mjAspectRatio` IDs but presents them with the same current-value plus range-slider interaction used by Stylize／Chaos／Weirdness; `跟隨 PAGE1` remains the first position and no arbitrary ratio text input is introduced. The parameter-tail panel now renders contract-owned explanations for `--v`、`--ar`、`--raw`、`--s`、`--c`、`--w`、`--sd` and `--hd`, including larger／smaller numeric direction where applicable. These explanations are UI-only and do not alter the canonical AI tail or any other Prompt output. Follow-up validation passed all 629 frontend tests, all 117 Prompt-quality tests, lint, build, documentation sync／check, and the same-seed strict audit with zero blocking signals and 12 existing diagnostic-only wardrobe／scene findings; browser checks at 1280×720 and 390×844 found zero horizontal overflow or console errors.
- MJ low-freedom default phase 8 changes only the missing-value fallback in the F contract to the existing precise-realistic profile: V8.2, 跟隨 PAGE1, Raw, `--s 25`, `--c 0`, `--w 0`, SD. Explicitly saved F values remain authoritative; F stays excluded from PAGE1 random／clear and generation rerolls, and only `midjourneyPrompt` receives the changed default tail. The contract version is `1.5.0`; Gpt／Grok-Z, fixed framing outputs, PAGE1 composition ratio, storage IDs, and historical mappings remain unchanged. Validation: focused MJ group 21 tests passed; `npm run test:prompt-quality` 117/117, frontend `npm test` 635/635, lint, build, `git diff --check`, and same-seed strict audit 200 all passed with zero blocking findings. Browser smoke at 1280×720 and 390×844 confirmed the live Raw／S25／C0／W0／SD preset, explicit saved settings remaining authoritative, no horizontal overflow, and no console errors.
- Midjourney description optimization phase 1 is behavior-neutral. `midjourneyDescriptionContract.js` defines the new direct, single-line semantic sequence for image type, composition, subject, wardrobe, canonical pose, scene／lighting, and imaging before the independent F parameter tail. Starting in phase 2, imperative `Create a／an` openings are forbidden and each semantic group must retain an explicit sentence boundary. Six image-type opening targets and seven representative description baselines cover normal Body Type, complete look, Pose Composer, Character Card, duo, fixed composition, special outfit, dress, and V8.1 compatibility without changing any current Prompt text.
- Midjourney description optimization phase-1 validation on 2026-07-29: the focused contract suite passed 3 tests and `npm run test:prompt-quality` passed all 105 tests. The same-seed strict audit retained the phase-6 output statistics, zero blocking, integrity, duplicate, control-leakage, or contradiction signals, and the same 14 diagnostic-only findings. Lint and build passed. Full `npm test` passed 613 of 614 tests; the only failure is the documented pre-existing unseeded imaging assertion, where the existing soft-max compressor may validly remove the secondary `snap-focus clarity` cue. Browser validation was not required because phase 1 changes only contract data, fixtures, tests, and documentation.
- Midjourney description optimization phase 2 replaces AI-only imperative image-type instructions with six direct visual identities and terminates the composition section before subject text. A photorealistic result now begins `Photorealistic editorial portrait.` rather than `Create a photorealistic editorial portrait.`, and a populated composition becomes `Waist-up portrait, high angle, looking down, front view. A 20s...`. Gpt, Grok/Z-Image, derived prompts, resolved selections, canonical pose, and the F parameter tail remain unchanged. The public AI contract and strict audit now recognize and cross-check the direct identity without requiring `Create a／an`.
- Midjourney description optimization phase-2 validation on 2026-07-29: the opening／contract and expanded Prompt-quality suites passed all 107 tests. The same-seed strict audit lowered AI descriptive statistics to avg 118.8, median 121, p95 129, max 131 and retained zero blocking, integrity, duplicate, control-leakage, or contradiction signals plus the same 14 diagnostic-only findings. Full `npm test` passed 615 of 616 tests; the only failure remains the documented pre-existing unseeded `snap-focus clarity` assertion. Lint, build, root audit tests, and browser smoke passed. At 1280×720, live AI output used an approved direct opening, one line, a canonical parameter tail, and no imperative prefix; all five workspaces had zero document overflow, broken images, console warnings, or errors. No layout or CSS changed, so the existing 390×844 mobile layout evidence remains current.
- Midjourney description optimization phase 3 gives normal single-subject AI output its own direct identity lead: `20s Japanese or Korean woman, seductive editorial presence`. It retains the selected Body Type anchors, hair, eyewear, headphones, wardrobe source, and composition projection, while removing duplicate `at the lower crop edge` phrases from the same AI wardrobe sentence. Gpt and Grok/Z-Image keep their historical subject wording, and Character Card／duo／special-mode restructuring remains deferred to phase 5.
- Midjourney description optimization phase-3 validation on 2026-07-29: the focused subject／wardrobe tests and expanded `npm run test:prompt-quality` passed all 109 tests. The same-seed strict audit retained AI avg 118.8, median 121, p95 129, max 131, zero blocking／integrity／duplicate／control-leakage／contradiction signals, and the same 14 diagnostic-only findings. Full `npm test` passed 617 of 618 tests; the only failure is the documented pre-existing unseeded outfit assertion, where an unlocked outerwear may validly precede the requested two-piece outfit. Lint, build, documentation sync／check, root tests, and `git diff --check` passed. Browser smoke at 1280×720 verified the direct AI subject lead, unchanged Gpt／Grok-Z identities, one canonical parameter tail, all five workspaces, zero horizontal overflow, and zero broken images; no CSS or layout changed, so the existing 390×844 mobile evidence remains current.
- Midjourney description optimization phase 4 keeps the shared projected canonical pose verbatim, then renders AI scene and lighting as adjacent direct sentences instead of `In ..., lit by ...`. AI imaging uses `<photographer>-inspired <image language>` and a direct lens identity without `shot on`; optical and film anchors remain source-traceable. Gpt, Grok/Z-Image, all fixed-framing outputs, resolved selections, and the canonical F parameter tail are unchanged.
- Midjourney description optimization phase-4 validation on 2026-07-29: the focused scene／imaging／canonical-pose tests and expanded `npm run test:prompt-quality` passed all 111 tests; full `npm test` passed all 620 tests. The same-seed strict audit reduced AI descriptive statistics to avg 114.2, median 116, p95 129, max 130 while retaining zero blocking／integrity／duplicate／control-leakage／contradiction signals and the same 14 diagnostic-only findings. Lint, build, documentation sync／check, root tests, and `git diff --check` passed. Browser smoke at 1280×720 exercised a complete random prompt with direct scene, separate light sentence, `<name>-inspired` style, direct lens identity, one-line output, and the canonical tail; all five workspaces had zero horizontal overflow and broken images. No layout or CSS changed, so the existing 390×844 mobile evidence remains current.
- Midjourney description optimization phase 5 extends direct AI syntax to Character Card, complete-look wardrobe modes, duo, and fixed composition. Character Card keeps its four permanent identity anchors while hair variants express only the visible change; complete-look phrases remove a redundant terminal `outfit`. Duo AI now uses direct `First woman`／`Second woman` role sentences and direct pose／scene／lighting／imaging sentences with no inline section labels. Gpt and Grok/Z-Image retain their historical labeled duo output. The AI length contract now includes duo at 160 target／180 soft max, while the three existing single-subject budgets remain unchanged.
- Midjourney description optimization phase-5 validation on 2026-07-29: the expanded `npm run test:prompt-quality` passed all 115 tests and full `npm test` passed all 624 tests; lint, build, documentation sync／check, root unit tests, and `git diff --check` passed. The same-seed strict audit reported AI avg 114.0, median 116, p95 129, max 130, with zero blocking／integrity／duplicate／control-leakage／contradiction signals and the same 14 diagnostic-only wardrobe／scene findings. Browser QA at 1280×720 and 390×844 exercised a 121-word duo AI output plus all five workspaces: direct role sentences were present, retired inline labels were absent, and every workspace had zero horizontal overflow, broken images, console warnings, or errors.
- Midjourney description optimization phase 6 completes the work with a behavior-neutral blocking gate. The description contract now records the required engine, six-output contract, PAGE1／DLL, Standard Prompt, Favorites v3, and Saved Cards Markdown consumers. `midjourneyCompletionGate.test.js` regenerates all seven accepted description targets and verifies direct openings, one-line syntax, forbidden AI section labels, phase-5 hashes, mode-specific soft limits, historical field mappings, exact canonical pose reuse, parameter-tail ownership, and downstream byte identity. This phase changes no renderer text, UI, selection, storage ID, or parameter behavior.
- Midjourney description optimization phase-6 validation on 2026-07-29: the focused completion group passed 8 tests, `npm run test:prompt-quality` passed all 116 tests, and full `npm test` passed all 625 tests; lint, build, documentation sync／check, root unit tests, and `git diff --check` passed. The final same-seed strict audit remained AI avg 114.0, median 116, p95 129, max 130, with zero blocking／integrity／duplicate／control-leakage／contradiction signals and the same 14 diagnostic-only wardrobe／scene findings. Because phase 6 changes only contract data, tests, and documentation, it introduces no rendered behavior; the completed phase-5 desktop 1280×720 and mobile 390×844 five-workspace browser evidence remains current.
- MJ Body Type short-positive-anchor optimization on 2026-08-01 activates `SINGLE_BODY_TYPE_ANCHOR_RULES` for the historical `AI` → `midjourneyPrompt` field. Normal single and duo AI outputs now use six short source-derived positive silhouette anchors and omit height, weight, measurement-style ratio, torso-to-leg, and cup-scale strings. Gpt (`grokPrompt`), Grok/Z-Image (`zImagePrompt`), database `en`, resolved selections, Character Card identity, and canonical pose remain unchanged. The contract version is `1.6.0`; the native-description and parameter fixtures were updated only for the affected AI description hashes and word counts.
- MJ Body Type anchor validation on 2026-08-01: the focused AI／identity／Midjourney contract group passed 70 tests; all six public body-type cases assert numeric-free positive anchors, and the duo case confirms role-specific anchors while Gpt／Grok-Z retain full source wording. `npm run test:prompt-quality` passed 117 tests, full `npm test` passed 635 tests, lint and build passed, and the same-seed strict audit (`200`, `prompt-quality-baseline`) retained zero blocking signals with 12 diagnostic-only wardrobe／scene findings. Browser smoke at 1280×720 and 390×844 exercised the Prompt 工作台, verified numeric-free AI/MJ anchors with numeric Gpt／Grok-Z source wording, found zero horizontal overflow and console errors, and captured final desktop/mobile evidence.
- `webapp/src/lib/engine/promptOutputContracts.js` defines machine-readable contracts for `grokPrompt`, `zImagePrompt`, `midjourneyPrompt`, and the single-subject `facial-closeup-portrait`, `chest-up-portrait`, and `full-body-character` extra prompts.
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
- Body-visibility optimization phase 1 on 2026-07-21 is behavior-neutral and records the approved crop policy before runtime changes. `compositionBodyVisibilityFixtures.js` defines `omit` for `faceDetail` and `headShoulders`, chest-only source for `chestUp`, chest/torso/waist/abdomen source for `mediumWaist`, chest/torso/waist/abdomen/hips source for `cowboyKnee`, and complete canonical source for `fullBody`, `unconstrained`, and the current `fixedComposition` contract. All six public Body Types have source-traceable projected text, and deterministic scenarios cover normal single, duo roles, Character Card `profile.body`, special-outfit person details, raw selection preservation, non-body identity preservation, and full-body restoration. The runtime and public Prompt text are intentionally unchanged; the existing chest-up full-body anchor assertion is explicitly labeled as a legacy baseline until phase 2 connects the shared projection.
- Body-visibility phase-1 validation on 2026-07-21: the new contract suite passed 5 tests; the focused body-contract plus existing Prompt-pipeline run passed 52 tests; `npm run test:prompt-quality` passed 32 tests after adding the structural body gate; frontend `npm test` passed 519 tests; lint and `git diff --check` passed. No production renderer, UI, CSS, data source, lock schema, or browser behavior changed, so strict Prompt audit, build, and browser validation remain completion gates for the later runtime phase rather than this fixture-only baseline.
- Body-visibility optimization phase 2 activates the crop policy for the six normal single-subject Body Types. `compositionVisibilityContract` version 3 carries `body.mode` and visible zones, while `compositionBodyProjection.js` resolves one authored, source-traceable Body Type before Gpt, Grok/Z-Image, and AI formatting. Face-detail and head-shoulder prompts omit the Body Type; chest, medium, and cowboy prompts progressively retain only visible body regions; full-body, unconstrained, and fixed-composition contexts retain the complete source. Raw locks and generated selections remain intact, and the independent `full-body-character` output restores the original complete Body Type. This phase does not change wardrobe, pose, scene, imaging, UI, duo, Character Card body, or special-outfit body-fragment behavior; those compatibility sources remain later body-visibility work.
- Body-visibility phase-2 validation on 2026-07-21: the focused body-contract, integration, composition-contract, and Prompt-pipeline run passed 64 tests; `npm run test:prompt-quality` passed 34 tests; frontend `npm test` passed 521 tests; lint, build, and `git diff --check` passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) reported zero required-output, duplicate, control-leakage, contradiction, or strict blocking signals and retained the same 13 diagnostic-only wardrobe/scene findings. Browser validation at 1440×1000 and 390×900 exercised all five workspaces, all six normal-single Body Type crop buckets on desktop, the chest-up transition on mobile, raw Body Type selection preservation, complete `full-body-character` restoration, and the DLL PIC full-body source lock to 9:16. No broken images, console warnings, or page errors appeared. Desktop and the four unaffected mobile workspaces had no document overflow; mobile PAGE1 with E 攝影成像 active retained the pre-existing 398px document width against a 375px client width, with no UI or CSS changes in this phase.
- Body-visibility optimization phase 3 activates the compatibility sources. Duo A/B Body Types now use the same projected source in Gpt, Grok/Z-Image, and AI role blocks. Every formal Character Card owns authored `profile.bodyProjection` text beside its canonical structured `body`; face/head crops remove only the body field while preserving structured facial identity, permanent identity anchors, hair, and face accessories. Special-outfit built-in hair remains available in close crops, while chest/arm tattoo fragments follow body visibility. Raw selections remain unchanged, and `full-body-character` restores the original Character Card body, normal Body Type, tattoo details, and complete outfit. Wardrobe, pose, scene, imaging, UI, storage, and public output mappings are unchanged.
- Body-visibility phase-3 validation on 2026-07-21: the focused body-contract and integration suites passed 14 tests; `npm run test:prompt-quality` passed 41 tests; frontend `npm test` passed 528 tests; lint and build passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) reported zero required-output, duplicate, control-leakage, contradiction, or strict blocking signals and retained the same 13 diagnostic-only wardrobe/scene findings. Browser validation at 1440×1000 and 390×900 exercised all five workspaces plus normal Body Type, Character Card, and special-outfit face-detail behavior: the three main outputs omitted out-of-frame body and tattoo text, facial identity and current hair remained available, and `full-body-character` restored the complete body and outfit source. No document overflow, broken images, console warnings, or page errors appeared.
- Body-visibility optimization phase 4 completes the work as a blocking integration gate without changing production Prompt text. `compositionBodyPromptIntegration.test.js` uses one data-only matrix to generate all public framing aliases for all six Body Types, fixed-composition full-source behavior, duo A/B, every formal Character Card, and every tattoo-bearing special outfit. It verifies the historical `grokPrompt` / `zImagePrompt` / `midjourneyPrompt` mapping, raw selection preservation, permanent identity anchors, progressive body projection, and independent `full-body-character` restoration. The gate is included in `npm run test:prompt-quality`; renderer, wardrobe, pose, scene, imaging, UI, storage, and public output contracts remain unchanged.
- Body-visibility phase-4 validation on 2026-07-21: the complete body-contract and integration group passed 19 tests, including the new four-case matrix across every enumerated source; the expanded `npm run test:prompt-quality` passed 46 tests; frontend `npm test` passed 533 tests; lint, build, and `git diff --check` passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained zero required-output, duplicate, control-leakage, contradiction, or strict blocking signals and the unchanged 13 diagnostic-only wardrobe/scene findings. Browser validation was not repeated because phase 4 changes tests, the quality command, and documentation only; it changes no production module or user-visible output, so phase-3 desktop/mobile evidence remains the rendered baseline.
- Fixed-framing derived Prompt phase 1 on 2026-07-22 is behavior-neutral. `fixedFramingDerivedPromptContract.js` records future single-subject `facial-closeup-portrait` (`五官特寫照`, fixed `1:1`) and `chest-up-portrait` (`胸上特寫照`, fixed `4:5`) extra outputs without connecting them to runtime. Both reuse the parent's resolved selections without rerolling and preserve source-traceable scene, lighting, photography, and imaging. Facial close-up omits body and pose but requires a selected upper-garment neckline or the positive fallback `a simple opaque crew-neck top`; chest-up preserves the existing projected upper-body canonical pose. Fixed-set scenes retain identity and source anchors while their conflicting camera-distance statement is excluded only from the future derived crop.
- The same phase-1 contract partitions the future main framing UI into `全無`, half-face, medium, cowboy, and full body while preserving the exact existing IDs and restore behavior of local-feature, face, head-and-shoulder, and chest-up legacy framings. The future half-face resolver chooses one explicit seeded left/right edge placement and shares it across Gpt, Grok/Z-Image, and AI, with the face cropped by that frame edge, broad opposite negative space, and neck/shoulders/upper torso still visible. Deterministic target fixtures cover separates, special outfits, outfit presets, dresses, Character Cards, missing-upper fallback, fixed-set scenes, rear-orbit compatibility, duo absence, and both half-face sides. Runtime Prompt text, public output contracts, UI, random pools, Saved Cards, DLL PIC Pro, and the existing full-body character output are unchanged.
- Fixed-framing derived Prompt phase-1 validation on 2026-07-22: the new structural contract suite passed 6 tests; the expanded `npm run test:prompt-quality` passed 52 tests; frontend `npm test` passed 540 tests; lint, build, and `git diff --check` passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained zero required-output, duplicate, control-leakage, contradiction, or strict blocking signals and the unchanged 13 diagnostic-only wardrobe/scene findings. Browser validation was not run because phase 1 adds frozen target data, tests, the quality command, and documentation only; runtime and user-visible behavior remain unchanged.
- Fixed-framing derived Prompt phase 2 adds `fixedFramingDerivedPrompt.js` as the shared preset and context-derivation boundary. The existing `full-body-character` is the first consumer: `engine.js` replaces only its framing-dependent context, rebuilds structured sections from the parent's already-resolved subject, full body, full wardrobe, colors, lighting, and film sources, and keeps its renderer unchanged. Deterministic normal separates, special outfit, Character Card, and fixed-composition cases lock the exact pre-migration text length and SHA-256, preserve raw source selections, and require `extraPrompts` to contain only the historical `full-body-character`. The future `facial-closeup-portrait` and `chest-up-portrait` outputs, main framing UI, random pool, output contracts, Saved Cards, and DLL PIC Pro remain unchanged until later phases.
- Fixed-framing derived Prompt phase-2 validation on 2026-07-22: the focused contract, infrastructure, composition, and full-body compatibility group passed 13 tests; the expanded `npm run test:prompt-quality` passed 54 tests; frontend `npm test` passed 542 tests; lint, build, and `git diff --check` passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained zero required-output, duplicate, control-leakage, contradiction, or strict blocking signals and the unchanged 13 diagnostic-only wardrobe/scene findings. Browser validation was not repeated because all existing public full-body text is locked to its exact pre-migration SHA-256 and no output, UI, CSS, interaction, or storage behavior changed; phase 1 browser-neutral evidence remains applicable.
- Fixed-framing derived Prompt phase 3 activates `facial-closeup-portrait` and `chest-up-portrait` for single-subject PAGE1 results. Both reuse the parent's resolved sources and a full-fidelity structured renderer without a multi-cut tail. Facial close-up omits body and pose, preserves upper garments and permanent face identity, supplies the approved positive top fallback when needed, and changes an incompatible rear orbit only inside its derived context. Chest-up uses the existing projected body and canonical upper-body pose. Fixed-composition inputs retain compact scene identity and anchors while excluding the fixed distance and internal controls. Duo remains unsupported; raw selections, main outputs, and exact full-body character bytes remain unchanged. The two texts now participate in Saved Cards and generic export consumers through `extraPrompts`, while direct PAGE1 cards, DLL PIC Pro source controls, main-framing UI, and random-pool changes remain later phases.
- Fixed-framing derived Prompt phase-3 validation on 2026-07-22: the focused runtime and infrastructure suite passed 8 tests; the expanded `npm run test:prompt-quality` passed 60 tests; frontend `npm test` passed 548 tests; lint, build, and `git diff --check` passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained zero required-output, duplicate, control-leakage, contradiction, or strict blocking signals and the unchanged 13 diagnostic-only wardrobe/scene findings. Browser validation at desktop 1440×1000 and mobile 390×900 exercised all five workspaces with no document overflow, broken images, console warnings, or console errors. A single PAGE1 result was saved locally and verified as six Saved Cards prompts including `五官特寫照`, `胸上特寫照`, and `全身角色照`; the temporary card was then removed.
- Fixed-framing derived Prompt phase 4 connects the three single-subject extras to PAGE1 Generation Outputs and DLL PIC Pro through `page1PromptOutputs.js`. Single results expose six ordered sources: Gpt, Grok/Z-Image, AI, facial close-up, chest-up, and full-body character. DLL PIC Pro locks the three derived sources to `1:1`, `4:5`, and `9:16`; duo results retain only the historical three primary sources. The DLL ratio selector now contains `4:5`. Only the direct Google Gemini route is currently marked verified for that ratio; other models disable generation and show a compatibility message instead of silently changing the requested crop. The consumer model reuses the engine text exactly and does not change Prompt renderers, raw selections, Saved Cards, main framing controls, or public field mappings.
- Fixed-framing derived Prompt phase-4 validation on 2026-07-22: the focused PAGE1 consumer and DLL compatibility suites passed 13 tests; frontend `npm test` passed 551 tests; the expanded `npm run test:prompt-quality` passed 62 tests; lint, build, and `git diff --check` passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained zero required-output, duplicate, control-leakage, contradiction, or strict blocking signals and the unchanged 13 diagnostic-only wardrobe/scene findings. Browser validation at desktop 1440×1000 and mobile 390×900 exercised the single six-source order, the duo three-source boundary, fixed `1:1` / `4:5` / `9:16` DLL ratios, the unsupported-model `4:5` message and disabled generation state, and all five workspaces. No document overflow, broken images, console warnings, or console errors appeared.
- Fixed-framing derived Prompt phase 5 activates the main-framing policy without removing compatibility data. PAGE1 now offers `全無`, half-face, medium, cowboy, and full-body; unlocked generation samples only the four concrete current framings. The retired facial-detail, face, head-and-shoulders, and chest-up IDs remain in the complete engine catalog and continue to normalize, generate, store, and restore. A restored old value appears temporarily as a disabled restore-only option and disappears after a current selection is made. Half-face now resolves one seeded left- or right-edge geometry once per result and shares the exact composition line across Gpt, Grok/Z-Image, and AI. It uses the `headShoulders` visibility boundary so Body Type and pose stay omitted while selected upper clothing and head/neck accessories remain visible with the specified shoulders and upper torso.
- Fixed-framing derived Prompt phase-5 validation on 2026-07-22: the focused main-framing suite passed 5 tests; frontend `npm test` passed 556 tests; the expanded `npm run test:prompt-quality` passed 67 tests; lint and build passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained zero required-output, duplicate, control-leakage, contradiction, or strict blocking signals. Its 15 diagnostic-only findings comprise nine existing pants/legwear combinations, three pants/skirt combinations, and three swimwear/non-vacation combinations; the count shift reflects the new current-only random framing distribution rather than a new blocking violation. Browser validation at desktop 1440×1000 and mobile 390×900 exercised all five workspaces, legacy restore-only display, current-option takeover, shared half-face edge geometry, three-output equality, and the retained upper-clothing editor. No document overflow, broken images, console warnings, or console errors appeared.
- Fixed-framing derived Prompt phase 6 completes the work as a blocking integration gate without changing production Prompt text. `fixedFramingPromptIntegrationFixtures.js` pairs half-face, medium, cowboy, and full-body with separates, special outfits, outfit presets, and dresses; `fixedFramingPromptIntegration.test.js` verifies one preserved resolved selection across the three primary and three derived outputs, PAGE1 cards, and DLL sources. It separately covers all four restore-only legacy IDs, unlocked single／Character Card／duo exclusion of legacy candidates, fixed-composition isolation, duo extra-output absence, and all six public output contracts. The gate is included in `npm run test:prompt-quality`; renderers, UI behavior, IDs, storage, and public mappings remain unchanged from phase 5.
- Fixed-framing derived Prompt phase-6 validation on 2026-07-23: the focused fixed-framing contract, main-framing, integration, and consumer group passed 17 tests; frontend `npm test` passed 560 tests; the expanded `npm run test:prompt-quality` passed 71 tests; lint, build, and `git diff --check` passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) preserved the phase-5 word statistics, zero required-output, duplicate, control-leakage, contradiction, or strict blocking signals, and the same 15 diagnostic-only wardrobe/scene findings. Browser validation was not repeated because phase 6 adds frozen fixture data, contract metadata, tests, the quality command, and documentation only; it changes no production renderer, UI, CSS, interaction, storage, or public Prompt text, so the phase-5 desktop/mobile five-workspace evidence remains the rendered baseline.
- Fixed-composition visibility optimization phase 1 on 2026-07-19 is behavior-neutral and adds deterministic representative fixtures for separates, special outfits, outfit presets, and dresses. Each fixture requires Gpt, Grok/Z-Image, and AI to preserve the selected wardrobe core together with the fixed lounge anchor. Manual framing remains disabled by product design while a fixed set is active; the dedicated fixed-set composition context and renderer-order changes remain pending for later phases, and the current Grok/Z-Image scene-first ordering is intentionally not recorded as the target contract.
- Fixed-composition visibility phase-1 validation on 2026-07-19: the representative contract suite passed 17 tests; frontend `npm test` passed 505 tests; `npm run test:prompt-quality` passed 22 tests; lint and build passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained the existing 13 diagnostic-only wardrobe/scene findings with zero required-output, duplicate, control-leakage, contradiction, or strict blocking signals. Browser validation was not required because this phase changes fixtures and documentation only, with no runtime or user-visible behavior change.
- Fixed-composition visibility optimization phase 2 upgrades `compositionVisibilityContract` to version 2 and adds the dedicated `fixedComposition` bucket. A fixed set no longer inherits the ordinary `unconstrained` semantics from its effective `framingId = 全無`: the composition source is the selected fixed set, the camera distance is fixed-set-defined, and manual framing remains disabled. The bucket exposes all wardrobe roles, the full canonical pose, and `fixedSetContract` scene semantics. `generateSinglePrompt()` resolves this context before character and wardrobe construction, while pose, scene, wardrobe, and renderer fallbacks reuse the same projection. Public Prompt wording, fixed-set IDs, stored selections, and the specialized fixed-set scene renderer remain unchanged; shared structured projection and renderer ordering remain later phases.
- Fixed-composition visibility phase-2 validation on 2026-07-19: focused contract, output-contract, and fixed-set tests passed 44 tests; frontend `npm test` passed 507 tests; `npm run test:prompt-quality` passed 22 tests; lint and build passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained the same 13 diagnostic-only wardrobe/scene findings with zero required-output, duplicate, control-leakage, contradiction, or strict blocking signals. Desktop 1440×1000 and mobile 390×844 browser smoke exercised all five workspaces with no broken images, console errors, or warnings; desktop had no document overflow. The current browser harness could display but could not submit the native fixed-set `<select>`, so the active fixed-set transition is covered by deterministic representative fixtures and fixed-set engine tests rather than claimed as a browser interaction. Mobile PAGE1 with the fixed-composition D panel active retained an unrelated pre-existing document-width diagnostic (575px against a 375px client width); no UI or CSS file changed in this phase.
- Fixed-composition visibility optimization phase 3 adds the frozen, renderer-neutral `fixedCompositionPromptProjection`. When a fixed set is active, `buildPrompts()` now supplies Gpt, Grok/Z-Image, and AI with the same projected wardrobe items and colors, canonical pose text, composition metadata, and resolved fixed-set scene selections. The independent full-body character model explicitly returns to the original complete wardrobe source. This phase changes no public Prompt wording or paragraph order; the existing Grok/Z-Image fixed-scene-first layout remains isolated for the renderer-formatting phase.
- Fixed-composition visibility phase-3 validation on 2026-07-19: focused projection, composition contract, output contract, and fixed-set tests passed 46 tests; frontend `npm test` passed 509 tests; `npm run test:prompt-quality` passed 22 tests; lint and build passed. The before/after same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained identical word statistics and the same 13 diagnostic-only wardrobe/scene findings, with zero required-output, duplicate, control-leakage, contradiction, or strict blocking signals. Desktop 1440×1000 and mobile 390×900 navigation smoke exercised all five workspaces with no root document overflow, broken images, console errors, or warnings. The browser harness again displayed but could not submit the native fixed-set `<select>`; active fixed-set behavior is therefore covered by deterministic fixtures and engine tests rather than claimed as a browser interaction.
- Fixed-composition visibility optimization phase 4 corrects the fixed-set Grok/Z-Image paragraph order to image type/composition, subject, wardrobe, projected canonical pose when present, fixed-set scene, photography style, and rendering simulation. It reorders only existing paragraph producers, so no selected content, canonical projection, Gpt/AI output, option ID, saved selection, or compatibility mapping changes. The four fixed-composition wardrobe fixtures now enforce subject-before-wardrobe-before-pose/scene ordering, and the lounge, Fuji hotel, and bathtub tests no longer preserve the retired scene-first behavior.
- Fixed-composition visibility phase-4 validation on 2026-07-19: focused fixed-set, output-contract, projection, Prompt pipeline, Z-Image wardrobe, and composition-integration tests passed 90 tests; frontend `npm test` passed 509 tests; `npm run test:prompt-quality` passed 22 tests; lint and build passed. The before/after same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained identical word statistics and the same 13 diagnostic-only wardrobe/scene findings, with zero required-output, duplicate, control-leakage, contradiction, or strict blocking signals. Desktop 1440×1000 and mobile 390×900 navigation smoke exercised all five workspaces with no broken images, console errors, or warnings. The fixed-set selector remained inspectable but inactive in the browser harness, so active output ordering is verified by deterministic fixtures and engine tests. Desktop fixed-set-panel layout had no overflow; mobile D-panel expansion retained the unrelated pre-existing 575px document width against a 375px client width, with no UI or CSS changes in this phase.
- Fixed-composition visibility optimization phase 5 adds `fixedCompositionPromptIntegration.test.js` as a blocking cross-output contract. Its four cases cover separates, special outfits, outfit presets, and dresses; each verifies that Gpt, Grok/Z-Image, and AI preserve the selected wardrobe, reuse the exact canonical pose, retain the black-velvet fixed-set anchor, and keep subject-before-wardrobe-before-pose-before-scene order. Fixed-set and wardrobe selection IDs remain preserved while manual framing stays `全無`. The suite is included in `npm run test:prompt-quality`; production renderers and public Prompt text are unchanged.
- Fixed-composition visibility phase-5 validation on 2026-07-19: the new integration suite passed 4 tests; frontend `npm test` passed 513 tests; the expanded `npm run test:prompt-quality` passed 26 tests; lint and build passed. The same-seed strict audit (`200`, seed `prompt-quality-baseline`) retained the phase-4 word statistics and the same 13 diagnostic-only wardrobe/scene findings, with zero required-output, duplicate, control-leakage, contradiction, or strict blocking signals. Browser validation was not repeated because phase 5 changes tests, the package quality command, and documentation only; it introduces no runtime or user-visible behavior, and phase-4 browser evidence remains the current rendered reference.
- `npm run test:prompt-quality` runs the contract, representative-fixture, conservative deduplication, composition-visibility integration, normal-single and compatibility-source body-visibility integration, the phase-4 body matrix, fixed-composition cross-output integration, and fixed-framing phase-1 structural, phase-2 infrastructure, phase-3 runtime, phase-4 PAGE1 consumer, phase-5 main-framing, and phase-6 completion-integration gates. The 2026-07-23 phase-6 run passed all 71 tests.
- `npm run audit:prompts:strict` runs 200 prompts with seed `prompt-quality-baseline`. The 2026-07-23 phase-6 baseline has zero contract errors, exact/near duplicate signals, public control-language leakage, contradictory constraints, and strict blocking signals. It retains 15 diagnostic-only findings: nine pants/legwear, three pants/skirt, and three swimwear/non-vacation combinations.
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

- Selects one of 33 built-in character cards, paged as 10 cards, 10 cards, 10 cards, then three cards.
- Current cards are `11_Rika`, `48_G`, `29_Philippa`, `07_Lily`, `06_Hinata`, `38_Rin`, `12_Sakura`, `03_Sui`, `02_Yuri`, `37_Hina`, `26_Yuna`, `41_Eleanor`, `22_Olivia`, `08_Jiwoo`, `05_Chihiro`, `04_Koto`, `00_Mei`, `01_Rei`, `09_Amy`, `10_Ji-Yoo`, `13_Yui`, `14_Nana`, `15_Emily`, `16_Shiori`, `18_Natsuki`, `19_Minji`, `20_Manami`, `25_Grace`, `30_Kaori`, `32_Soyeon`, `33_Bora`, `34_Seulgi`, and `36_Miku`.
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

- All 33 formal cards now expose `facialGeometry`, `eyeSignature`, `noseSignature`, `mouthSignature`, `skinSignature`, `makeup`, `body`, and four compact `distinctiveFeatures` anchors.
- `identityAndBody` remains verbatim as a compatibility field for existing Saved Cards and legacy prompt consumers; new full renderers use the structured identity fields instead of repeating the legacy paragraph, and `face`, `skin`, and `makeup` no longer mirror one mixed string.
- PAGE1 Gpt / full-body prompts render facial fields as separate labeled blocks. PAGE1 compact AI and every PAGE2 copy output retain all four permanent identity anchors, even when users switch hair, clothes, or makeup.
- Eleanor's horns, red eyes, bilateral facial markings, forehead sigil, and arcane tattoos are explicit permanent anchors.
- The high-similarity checks preserve Jiwoo/Koto (heart-oval wide-set eyes vs balanced oval shallow-lid eyes), Yuna/Chihiro (short rounded chin vs longer oval-heart/slightly close-set eyes), Sakura/Lily, Yuri/Hina, Olivia/Mei, Bora/Seulgi, Grace/Soyeon, Kaori/Olivia, and Miku/Nana contrasts.
- The formal maintenance specification and source-image matrix live in [`specs/character-card-facial-identity.md`](specs/character-card-facial-identity.md).

Validation for the facial identity optimization:

- Frontend `npm test`: 407 passed.
- Frontend `npm run lint` and `npm run build`: passed.
- Functions `npm test`: 30 passed; Functions `npm run lint`: passed.
- `python3 scripts/sync_to_json.py --check` and `python3 -m unittest discover -s scripts/tests`: passed.
- `python3 scripts/check_public_assets.py` covers all 33 formal cards using manifest-backed AVIF deployment previews; full-resolution source images remain outside the deployment public directory.
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
- `renderFixedFramingDerivedPrompt()` creates the single-subject facial-closeup and chest-up structured outputs from the shared derived model.
- `buildPrompts()` preserves the three historical fields:
  - `midjourneyPrompt`
  - `grokPrompt`
  - `zImagePrompt`
  - It also returns `facialCloseupPortraitPrompt`, `chestUpPortraitPrompt`, and `fullBodyCharacterPrompt`, which `generateSinglePrompt()` stores under their historical or approved `extraPrompts` IDs when available.

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
- Scene-object compatibility checking for Pose Composer is intentionally not implemented yet. Camera orbit, camera angle, and crop compatibility for random Pose Composer combinations are implemented separately in the shared resolver.
- `Pose Modifier` is intentionally not implemented yet.
- `poseArrangementId`, `poseHandId`, and `poseHeadId` use the visible option name `任意` (legacy option IDs remain unchanged). `任意` means the group supplies no fixed description and lets the model choose a casual, relaxed, natural result from the selected base pose, wardrobe, camera, and scene; it is not random selection.
- `隨機` never resolves to `任意`; base, arrangement, hand, prop, and head random resolve to concrete options, while anchor random alone may resolve to `全無`. `全無` contributes no text.
- Random Pose Composer resolution uses `webapp/src/lib/engine/poseComposerCompatibility.js` (version 1): upper crops prefer standing/sitting bases; cowboy crops exclude lying; front-view random body arrangements exclude side/rear-facing variants; random head directions avoid a camera-facing head on a side/rear body or an aerial face-visibility conflict; random face props avoid rear-view contact. Upper crops also exclude lower-body-only hand placements.
- These compatibility predicates filter random pools only. Explicit base, arrangement, hand, prop, or head locks remain visible even when the user intentionally chooses a contradictory combination.
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
- Pose Composer scene-object compatibility is paused.
  - Camera orbit, angle, and crop compatibility is active for random combinations; location/object compatibility remains free combination for now.

## Best Next Work

- Character Card Lab UIUX polish and the first 17-card catalog are implemented.
  - Real-generation test the seven new profiles across Gpt, Grok/Z-Image, and AI before tuning descriptions from observed model drift.
  - Pay special attention to Eleanor's permanent horns/markings, Olivia's removable cap and exposed base hair, Jiwoo's white streak placement, and the visual separation between Chihiro, Koto, and Mei.
  - Continue future built-in cards through the source/preview/manifest/profile/layer workflow documented above.
- UIUX discussion process for future sessions:
  - Discuss wireframe direction before implementation.
  - Use low-fidelity generated wireframes when useful to align layout imagination.
  - Record decisions as current-state vs planned-next-work so future sessions do not confuse sketches with implemented behavior.
- Real-generation test Pose Composer with fixed combinations and random compatible bundles across Gpt, Grok/Z-Image, and AI before expanding the database.
- Follow up separately on the pre-existing PAGE1 mobile E-editor grid min-content overflow; it is independent of Pose Composer prompt resolution and should be handled as a focused frontend layout change.
- Expand Pose Composer options in batches only after stable results:
  - standing / sitting first
  - kneeling / squatting next
  - modifiers last
- Continue database additions through the relevant authoring guide first.
- For PAGE1 single-subject prompt wording, use `Docs/specs/page1-single-prompt-compression-guide.md`. Gpt is now full-fidelity; Grok/Z-Image and AI are the compact outputs.
- Keep prompt-output changes backed by tests because naming and source-field history are easy to confuse.
