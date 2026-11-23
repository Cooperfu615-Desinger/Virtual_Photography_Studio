# Virtual Photography Studio Agent Rules

These instructions apply to the whole repository. Optimize for the requested product outcome while preserving established prompt, storage, and UI contracts.

## Start With Current State

1. Read `Docs/current_project_state.md` before planning or editing.
2. Read `Docs/session_onboarding.md` for the current source-owner map, then the applicable authoring guide and feature spec. Use `Docs/conversation_handoff.md` only when current-state documentation does not provide enough history.
3. Verify the actual working directory, branch, HEAD and worktree inventory before editing; a familiar folder name is not proof of latest main. Follow the dated checkout guidance in `Docs/session_onboarding.md` without resetting or switching another session's work. Inspect `git status` and the relevant diff before editing. Existing changes and untracked files may belong to the user or another session.
4. State the intended outcome, success criteria, affected surfaces, and validation scope. Keep the implementation limited to that outcome.

## Catalog Source Workflow

- For catalog content, edit only classification JSON listed in `knowledge_base/catalog/index.json`; six knowledge-base Markdown files and `database.json` are generated. Follow `knowledge_base/catalog/README.md`.
- Preserve issued IDs and ordered aliases; append new permanent kebab-case IDs to `id_registry.json` as active. Never delete/reuse issued IDs or mint new frozen IDs. No retirement is authorized by C.
- Select a reviewed full `REGISTRY_BASE_COMMIT` before changes; sync and strict checks require historical registry validation. Initial C bootstrap is limited to the fixed pre-C commit; it cannot be reused after C is committed. Run sync, read-only `--check`, schema/history tests and strict integrity before frontend gates.
- This JSON rule applies to the catalog, not every source in the application. Current specified actions, character identities/shared wardrobe, and fixed-scene geometry have separate source owners; see `Docs/session_onboarding.md`. Do not add new public actions to retired Pose Composer controls.
- Stable IDs do not authorize changing display/random order. Existing A seals and outputs must not be re-recorded to hide migration differences. Pose and Observation Capture are integrated Prompt modes, not separate navigation workspaces.

## Catalog Semantic Source (D)

- Formal category JSON requires reviewed `meta.semantic`; generated Markdown/database must not be edited by hand. Follow `knowledge_base/catalog/README.md`.
- Preserve ordered semantic values, IDs and aliases. When editing zh/en/desc, record whether semantics change and why; use `scripts/suggest_catalog_semantics.mjs <id>` for read-only advice, never automatic replacement.
- Explicit semantic replaces inference before source metadata and dedicated fields; only historical/custom libraries without semantic use inference. Keep default runtime caches isolated.
- D's original migration preserved then-known semantic mistakes; E only relocated legacy data. These are historical migration boundaries, not a claim that later approved A5/Phase 4/C fixes remain open. Consult current state and the applicable approved spec; preserve the original D/E baselines. P5b remains out of scope.

## Catalog Legacy Source (E)

- The approved 22 tables and two legacy category constants live in `knowledge_base/catalog/legacy_mappings.json`; `webapp/src/data/legacyMappings.json` is its byte-identical generated copy. Neither is a category file or an ID registry.
- Keep table/row/tuple order, labels, indices, targetZh and old IDs. Engine retains load-time maps, Map construction, slugify, first-match and missing-target fallback. Renderer text remains in engine.
- Every field follows `scripts/lib/legacyMappingContract.json`; source contract changes require review. Sync rejects malformed/duplicate-key source, and strict integrity checks catalog displayZh, embedded targets, attributes and legacy-key collisions. Run E tool tests as well as the normal matrix.
- Never re-record `engine/legacyMappings.baseline.json` to hide a migration difference. It seals pre-E computed values and 1,098 restore cases. Future approved behavior changes need a separately justified revision while preserving historical evidence.

## Product and Compatibility Boundaries

- Preserve the existing visual language and interaction patterns unless the user has approved a new direction. Layout, workflow, or visual-hierarchy changes should be aligned with the user before implementation; a wireframe is discussion material unless explicitly approved as the specification.
- Treat saved data, lock IDs, section labels, import/restore payloads, renderer output fields, button labels, and browser-storage keys as compatibility surfaces.
- Keep the historical public mappings: `Gpt` -> `grokPrompt`, `Grok/Z-Image` -> `zImagePrompt`, and `AI` -> `midjourneyPrompt`. Do not rename them as cleanup.
- Retain compatibility fields such as Character Card `identityAndBody` even when newer renderers use structured fields. Do not remove legacy migrations without fixtures for old inputs.
- Do not reintroduce SUNO, hidden legacy controls, paused style-prefix work, Pose Modifier, or Pose Composer scene filtering unless the user explicitly reopens that scope.
- Avoid combining a compatibility migration, prompt wording change, visual redesign, and broad refactor in one change.

## Scope and Autonomy

- User preference (2026-10-20): develop directly on `main`; do not create feature branches unless the user explicitly requests one. Continue to inspect and preserve unrelated work before editing. This does not grant standing permission to commit, push, or deploy.
- For analysis or diagnosis, inspect and report; do not silently implement a fix.
- For an implementation request, make the smallest coherent change, add proportionate tests, validate it, and report the result.
- Do not broaden the task into unrelated cleanup, dependency upgrades, data migrations, deployment, commits, pushes, or external changes without authorization.
- Ask before making a choice that changes product behavior beyond the stated outcome. Otherwise, use a reversible, convention-preserving assumption and record it.
- Protect unrelated dirty work. Never reset, restore, delete, reformat, stage, or overwrite another session's changes. If an overlap cannot be safely separated, stop and report the exact conflict.

## Prompt Changes and Evaluations

Read `Docs/specs/page1-single-prompt-compression-guide.md`, `webapp/src/lib/engine/promptOutputContracts.js`, `webapp/src/lib/engine/representativePromptFixtures.js`, and the relevant authoring guide before changing prompt data or renderers.

- Build all outputs from the same resolved selections and shared structured model.
- `Gpt` is full fidelity: preserve every effective selected English description. Only reorganize formatting, remove empty values, and remove exact duplicates.
- Approved standalone Body Type exception: omit the independent catalog Body Type source from main GPT and GPT chest-up outputs, including each role in duo main GPT, per `Docs/specs/gpt-standalone-body-omission-v1.md`. The full-body character output is the approved 2026-10-14 exception and keeps the Body Type source at its original position. Preserve adult identity, canonical pose, wardrobe and other effective descriptions; keep resolved selections and structured Saved Cards. Z-Image, AI/MJ chest, Character Card body, permanent identity and legacy `identityAndBody` retain their existing contracts.
- Approved narrow exception: ordinary single main GPT may project reviewed Scene/Lighting floor/sky visibility by effective camera direction, per `Docs/specs/gpt-scene-lighting-visibility-v1.md`. Preserve full surviving source, GPT section order, light core, subject light and canonical pose. Do not copy Z compaction, upper-scene additions or camera-distance wording; all excluded modes and derivatives stay unchanged.
- Later approved Composition exception: ordinary single main GPT may express crop-aware angle geometry and six full-body camera groups per `Docs/specs/gpt-composition-camera-spatial-v1.md`. Preserve ratio, orbit, hand composition modifiers, pose, other sections and excluded paths. This does not authorize Z assembly, new support geometry or lens changes.
- Approved follow-up: ordinary main GPT/Z mediumWaist and cowboyKnee worm-eye use near-contact camera wording per `Docs/specs/close-worm-eye-medium-cowboy-v1.md`; preserve other crops, all existing exclusions, pose, orbit, scene and selected lens.
- `Grok/Z-Image` is a source-traceable reduction: remove redundancy and internal control language, use minimal connective grammar, and do not invent visual facts.
- `AI` follows its mode-specific compact contract. Compression must retain the required identity, wardrobe, scene, imaging, and other mode-specific anchors.
- Preserve all four Character Card permanent identity anchors in compact outputs. Mutable hair, makeup, wardrobe, or accessories must not replace identity.
- When Pose Composer is active, preserve the shared canonical pose. Ordinary PAGE1 single-subject main Z-Image alone may assemble the same projected sources without relational independent anchors, retain explicitly source-marked manual sitting objects, and relocate visible selfie-action text into capture context, per `Docs/specs/page1-single-scene-integrated-assembly-v1.md`. GPT, MJ, derived outputs, duo, fixed composition, dedicated subjects, Character Cards and supine surface-led paths retain the exact canonical-pose contract.
- Keep the full-body character output single-subject, fixed at `9:16`, and complete from head to footwear/accessories. It must not inherit a crop that hides wardrobe.
- Approved main-Z follow-up: ordinary single and the three Japanese carriage fixed sets may group surviving scene, unchanged projected pose, existing visible selfie capture source, light and camera wording into one opening capture paragraph under `Docs/specs/z-image-on-location-capture-v1.md`. Ordinary Z may append the conditional shared-ambient sentence; carriages retain their existing relationship. Do not alter other five outputs, selections, canonical source text, support objects or excluded paths.
- Approved chest-output follow-up: `chest-up-portrait` preserves the same resolved capture state under `Docs/specs/chest-up-same-state-v1.md`. Reproject raw resolved sources to chest visibility; retain posture identity and selected manual seats; apply the main GPT camera, scene, ambient and imaging policies with their mode exclusions. It owns `4:5`. The former `chest-up-mj-portrait` output was removed on 2026-10-14 per `Docs/specs/prompt-official-fixes-v1.md`; do not reintroduce it. Live F settings update only the main MJ tail. Existing Saved Card data that still contains the removed output is kept, not rewritten.
- Do not leak internal guard, fallback, integrity, or selection-control language into public prompts.
- Add or update a focused regression fixture before changing behavior. Change one instruction/behavior group at a time, then compare the same fixtures and seed.
- Use deterministic seeds for comparisons and exclude runtime IDs/timestamps. Eligible local Prompt copy changes use the targeted before/after plan below; other Prompt changes run `scripts/validate_prompt_logic.mjs` with the same count and seed before and after the change.
- Eligible local Prompt copy changes run the focused output-contract, representative and feature checks specified below. Other Prompt changes run `npm run test:prompt-quality` from `webapp/`; use `npm run audit:prompts:strict` when the full blocking gate is required. Check every current public output applicable to the affected item, not only the legacy four-output contract.
- Heuristic audit findings are diagnostics, not automatic failures. Separate new regressions from known wardrobe-combination findings; do not rewrite unrelated behavior to make the count smaller.

## Local Prompt Copy Changes (局部 Prompt 文案調整)

Read [the local copy validation spec](Docs/specs/local-prompt-copy-validation-v1.md) before choosing this path. This is a local validation exception, not an automatic CI selector.

- Before editing, record the baseline, exact existing item IDs/text constants, source owners, old/new text, consumers and required cases. Eligibility requires a bounded copy-only change: no item additions/removals, ID/name/alias/order/pool/semantic/schema changes, and no new behavior in selection, color, visibility, assembly, compatibility or storage/restore. An item-specific literal in code may qualify only when its consumers and behavior are proven unchanged; a small diff or a JSON file alone is not evidence.
- Keep the existing authoring, catalog sync/check, trusted registry history, schema, semantic review, strict integrity and applicable legacy-mapping checks. Preserve frozen baselines and historical aliases; do not omit necessary compatibility work to qualify for this exception.
- Validate all affected items through their applicable public outputs, mode/crop boundaries, colors and existing compatibility/restore paths. Compare the same fixed inputs/seeds before and after, allow only the approved text and its documented projections, and check unchanged selections, metadata and RNG. Include fixed-seed unaffected representatives, focused contract/feature tests, lint/build and the affected desktop/mobile preview/copy/downstream flow. The spec defines the detailed evidence and conditional checks.
- When these conditions hold, the local plan does not require full `npm test`, the entire `test:prompt-quality` list, global strict Prompt audit, unrelated historical matrices or a six-workspace smoke solely because public Prompt text changed. This exception takes precedence over those blanket local gate requirements in the general Prompt-data row and older authoring/feature validation lists; product contracts, specific compatibility assertions, catalog checks and an explicit task requirement for full validation still apply.
- Escalate to the full Prompt-data/renderer/compatibility gates if the scope expands, text affects recognition or branching, aliases or semantic metadata need changing, non-target outputs/selections/RNG differ, or the impact/required focused evidence cannot be established. Fix a known approved-text assertion narrowly; never skip a failure or rewrite an immutable seal to remain on the local path. Preserve unrelated work and report pre-existing failures separately.
- Report why the change qualifies, the cases/commands actually run, results and timing, any justified non-applicable cases, and which broad suites were not run locally. This does not claim equal per-change exhaustive coverage or guarantee a time budget. Existing tests, package scripts, CI gates and deployment requirements remain unchanged; no scheduled audit, case retirement or commit/push permission is introduced.

## Validation Matrix

Run focused checks first. Classify local Prompt copy changes using the section above; otherwise expand to the full gates appropriate to the changed surface. Catalog requirements are additive even when the local copy path applies.

| Change | Focused validation | Completion gates |
| --- | --- | --- |
| Documentation only | Link/path review and `git diff --check` | No code suite unless the document is generated or changes a documented executable contract |
| Focused frontend logic | Relevant `node --test <test-file>` files | From `webapp`: `npm test`, `npm run lint`, `npm run build`; inspect the affected browser flow when behavior is user-visible |
| Eligible local Prompt copy only | Item-specific before/after cases, focused contract/representative/feature tests; see [spec](Docs/specs/local-prompt-copy-validation-v1.md) | Applicable catalog checks, lint/build, affected desktop/mobile flow, evidence report and `git diff --check`; no automatic full local suite |
| Other Prompt data, renderer, or compatibility; escalated local copy | Relevant prompt-pipeline/feature tests plus `npm run test:prompt-quality` | Frontend full gates, same-seed `npm run audit:prompts:strict`, and browser smoke across all six active workspaces |
| UI, CSS, assets, or interaction | Relevant state/helper tests | Frontend full gates and the render-and-inspect workflow in `Docs/specs/frontend-visual-validation.md` |
| Catalog JSON or reference manifests | Relevant sync/manifest tests | From root: run `python3 scripts/sync_to_json.py` when catalog JSON or manifests changed, then `python3 scripts/sync_to_json.py --check` and `python3 -m unittest discover -s scripts/tests`; add `python3 scripts/check_public_assets.py` for deployable assets |
| Firebase Functions or shared provider contract | Relevant Functions/client tests | From `functions`: `npm test`, `npm run lint`; also run affected frontend gates and shared-contract tests |

For a narrow change, a failing unrelated pre-existing check is not permission to edit outside scope. Confirm it is pre-existing, preserve evidence, and report it.

## Browser Completion Criteria

A user-visible change is not complete after code review, tests, or build alone. Render the app at `http://127.0.0.1:5175/Virtual_Photography_Studio/`, exercise the affected state, and inspect it at desktop and mobile sizes.

For an eligible local Prompt copy change, inspect the affected selection, preview, copy and applicable downstream flow at both sizes under the local copy spec. Public text changing alone does not require all six workspaces; shared generation behavior, shell/layout or output-consumer logic changes use the full procedure below.

- Check the affected workspace and any downstream import/restore/output consumer.
- For shared shell, navigation, typography, generation, or workspace CSS, inspect all six active workspaces: Prompt 工作台, 角色建模, 場景建模, DLL_PIC Pro, DLL_VIDEO Pro, and Saved Cards.
- Confirm no unexpected horizontal page overflow, clipped or overlapping controls, unreadable wrapping, broken images, missing content, or layout shift.
- Exercise the primary interaction and its selected, disabled, loading, success, empty, or error states when affected.
- Inspect browser console errors and uncaught page errors. Do not dismiss new errors because the page still renders.
- Preserve intentional scrolling inside bounded panels; distinguish it from accidental document overflow.
- Record the viewport(s), states exercised, and result. Capture before/after or final screenshots for material visual changes.

Use `Docs/specs/frontend-visual-validation.md` as the full procedure and acceptance checklist.

## Stopping and Reporting

- Continue through safe in-scope alternatives when a check fails. Stop only for a genuine authorization decision, unsafe overlap, unavailable required input, or an external blocker.
- Do not claim completion when required validation was skipped. State exactly what remains and why.
- In the final report, lead with the product outcome, then list changed files, validations run and their results, browser evidence when required, and any known limitations or pre-existing findings.
- Do not commit, push, deploy, or stage files unless the user explicitly requests it.

## Session Synchronization

New sessions must read this file, `Docs/current_project_state.md`, and `Docs/session_onboarding.md`, then the task-specific source-owner guide and applicable spec. For an already running or idle session, send this instruction before its next edit:

> Reload the root `AGENTS.md`, `Docs/current_project_state.md`, `Docs/session_onboarding.md`, and the applicable spec before continuing. Keep your current scoped task and all uncommitted work; do not reset or abandon it. Reconcile your plan and validation with the new rules, inspect shared-file changes before editing, and report any overlap you cannot safely isolate.

The session should acknowledge the refreshed scope, continue rather than restart, and use the validation matrix for its remaining work.
