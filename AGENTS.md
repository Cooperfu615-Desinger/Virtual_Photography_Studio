# Virtual Photography Studio Agent Rules

These instructions apply to the whole repository. Optimize for the requested product outcome while preserving established prompt, storage, and UI contracts.

## Start With Current State

1. Read `Docs/current_project_state.md` before planning or editing.
2. Read the spec or authoring guide for the area being changed. Use `Docs/conversation_handoff.md` only when current-state documentation does not provide enough history.
3. Inspect `git status` and the relevant diff before editing. Existing changes and untracked files may belong to the user or another session.
4. State the intended outcome, success criteria, affected surfaces, and validation scope. Keep the implementation limited to that outcome.

## Product and Compatibility Boundaries

- Preserve the existing visual language and interaction patterns unless the user has approved a new direction. Layout, workflow, or visual-hierarchy changes should be aligned with the user before implementation; a wireframe is discussion material unless explicitly approved as the specification.
- Treat saved data, lock IDs, section labels, import/restore payloads, renderer output fields, button labels, and browser-storage keys as compatibility surfaces.
- Keep the historical public mappings: `Gpt` -> `grokPrompt`, `Grok/Z-Image` -> `zImagePrompt`, and `AI` -> `midjourneyPrompt`. Do not rename them as cleanup.
- Retain compatibility fields such as Character Card `identityAndBody` even when newer renderers use structured fields. Do not remove legacy migrations without fixtures for old inputs.
- Do not reintroduce SUNO, hidden legacy controls, paused style-prefix work, Pose Modifier, or Pose Composer scene filtering unless the user explicitly reopens that scope.
- Avoid combining a compatibility migration, prompt wording change, visual redesign, and broad refactor in one change.

## Scope and Autonomy

- For analysis or diagnosis, inspect and report; do not silently implement a fix.
- For an implementation request, make the smallest coherent change, add proportionate tests, validate it, and report the result.
- Do not broaden the task into unrelated cleanup, dependency upgrades, data migrations, deployment, commits, pushes, or external changes without authorization.
- Ask before making a choice that changes product behavior beyond the stated outcome. Otherwise, use a reversible, convention-preserving assumption and record it.
- Protect unrelated dirty work. Never reset, restore, delete, reformat, stage, or overwrite another session's changes. If an overlap cannot be safely separated, stop and report the exact conflict.

## Prompt Changes and Evaluations

Read `Docs/specs/page1-single-prompt-compression-guide.md`, `webapp/src/lib/engine/promptOutputContracts.js`, `webapp/src/lib/engine/representativePromptFixtures.js`, and the relevant authoring guide before changing prompt data or renderers.

- Build all outputs from the same resolved selections and shared structured model.
- `Gpt` is full fidelity: preserve every effective selected English description. Only reorganize formatting, remove empty values, and remove exact duplicates.
- `Grok/Z-Image` is a source-traceable reduction: remove redundancy and internal control language, use minimal connective grammar, and do not invent visual facts.
- `AI` follows its mode-specific compact contract. Compression must retain the required identity, wardrobe, scene, imaging, and other mode-specific anchors.
- Preserve all four Character Card permanent identity anchors in compact outputs. Mutable hair, makeup, wardrobe, or accessories must not replace identity.
- When Pose Composer is active, all three renderers reuse the exact canonical pose text; only the outer label or layout may differ.
- Keep the full-body character output single-subject, fixed at `9:16`, and complete from head to footwear/accessories. It must not inherit a crop that hides wardrobe.
- Do not leak internal guard, fallback, integrity, or selection-control language into public prompts.
- Add or update a focused regression fixture before changing behavior. Change one instruction/behavior group at a time, then compare the same fixtures and seed.
- Use deterministic seeds for comparisons and exclude runtime IDs/timestamps. Run `scripts/validate_prompt_logic.mjs` with the same count and seed before and after a prompt change.
- Run `npm run test:prompt-quality` from `webapp/` for the four-output contract and representative-fixture gate. Use `npm run audit:prompts:strict` when the strict blocking gate is required.
- Heuristic audit findings are diagnostics, not automatic failures. Separate new regressions from known wardrobe-combination findings; do not rewrite unrelated behavior to make the count smaller.

## Validation Matrix

Run focused checks first. Expand to the full gates appropriate to the changed surface.

| Change | Focused validation | Completion gates |
| --- | --- | --- |
| Documentation only | Link/path review and `git diff --check` | No code suite unless the document is generated or changes a documented executable contract |
| Focused frontend logic | Relevant `node --test <test-file>` files | From `webapp`: `npm test`, `npm run lint`, `npm run build`; inspect the affected browser flow when behavior is user-visible |
| Prompt data, renderer, or compatibility | Relevant prompt-pipeline/feature tests plus `npm run test:prompt-quality` | Frontend full gates, same-seed `npm run audit:prompts:strict`, and browser smoke across all five active workspaces |
| UI, CSS, assets, or interaction | Relevant state/helper tests | Frontend full gates and the render-and-inspect workflow in `Docs/specs/frontend-visual-validation.md` |
| Knowledge-base Markdown or manifests | Relevant sync/manifest tests | From root: run `python3 scripts/sync_to_json.py` when source Markdown changed, then `python3 scripts/sync_to_json.py --check` and `python3 -m unittest discover -s scripts/tests`; add `python3 scripts/check_public_assets.py` for deployable assets |
| Firebase Functions or shared provider contract | Relevant Functions/client tests | From `functions`: `npm test`, `npm run lint`; also run affected frontend gates and shared-contract tests |

For a narrow change, a failing unrelated pre-existing check is not permission to edit outside scope. Confirm it is pre-existing, preserve evidence, and report it.

## Browser Completion Criteria

A user-visible change is not complete after code review, tests, or build alone. Render the app at `http://127.0.0.1:5175/Virtual_Photography_Studio/`, exercise the affected state, and inspect it at desktop and mobile sizes.

- Check the affected workspace and any downstream import/restore/output consumer.
- For shared shell, navigation, typography, generation, or workspace CSS, inspect all five active workspaces: Prompt 工作台, 角色建模, 動作姿勢, 場景建模, and Saved Cards.
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

New sessions must read this file and `Docs/current_project_state.md`. For an already running or idle session, send this instruction before its next edit:

> Reload the root `AGENTS.md`, `Docs/current_project_state.md`, and the applicable spec before continuing. Keep your current scoped task and all uncommitted work; do not reset or abandon it. Reconcile your plan and validation with the new rules, inspect shared-file changes before editing, and report any overlap you cannot safely isolate.

The session should acknowledge the refreshed scope, continue rather than restart, and use the validation matrix for its remaining work.
