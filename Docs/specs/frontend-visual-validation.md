# Frontend Visual Validation

Status: required completion workflow for user-visible frontend changes

Last updated: 2026-07-15

## Outcome

A frontend change is complete only when its intended behavior is visible, usable, responsive, and consistent with the existing Virtual Photography Studio interface. Automated tests and a successful production build are prerequisites, not substitutes for rendering and inspecting the actual app.

This workflow applies to React components, CSS, shared shell/navigation, copy that can affect layout, interaction state, deployable images, prompt preview presentation, and browser-facing import/restore behavior.

## Active Workspaces

The app has five active workspaces that share the shell and parts of the style system:

1. Prompt 工作台 (`page1`)
2. 角色建模 / Character Card Lab (`page2`)
3. 動作姿勢 / Action Pose Lab (`actionPose`)
4. 場景建模 / World Street Scene Builder (`page3`)
5. Saved Cards (`page4`)

SUNO is not an active workspace and is outside this validation set.

## Validation Depth

Choose the smallest row that fully covers the risk. When a change spans rows, use the broader coverage.

| Changed surface | Required rendered coverage |
| --- | --- |
| Local copy, spacing, or styling | Changed workspace and changed state at desktop and mobile widths |
| Local interaction or conditional UI | Changed workspace; initial state plus each affected selected/disabled/loading/success/empty/error state |
| Import, restore, save, copy, or generated-output flow | Source workspace, destination/consumer workspace, and the complete affected transition |
| Shared component or shared generation styling | Every workspace that consumes it at desktop and mobile widths |
| App shell, navigation, global typography, or global CSS | All five workspaces, settings/navigation state, desktop and mobile widths |
| Responsive grid or breakpoint logic | Changed workspace below and above each affected breakpoint, plus a normal desktop and phone viewport |
| Image or preview asset | Every changed asset rendered in its card/panel, including loading/fallback behavior and the responsive crop |
| Prompt/compatibility behavior without intended layout change | Relevant prompt source and downstream consumer, then navigation smoke across all five workspaces |

## Preparation

Before opening the browser:

1. Read `AGENTS.md`, `Docs/current_project_state.md`, and the specification for the changed feature.
2. Inspect `git status` and the relevant diff. Record which visible surfaces and states should change and which must remain unchanged.
3. Run the targeted automated tests for the behavior.
4. Run the frontend completion gates from `webapp/`:

   ```bash
   npm test
   npm run lint
   npm run build
   ```

5. Start the development server from `webapp/`:

   ```bash
   npm run dev -- --host 127.0.0.1 --port 5175
   ```

6. Open `http://127.0.0.1:5175/Virtual_Photography_Studio/` and wait for lazy-loaded workspace content to settle before judging layout.

When feasible, capture the same viewport and state before and after a material visual change. If the pre-change state cannot be reproduced safely in the shared worktree, document the expected unchanged references instead of resetting other work.

## Viewport Set

Use these baseline viewports:

- Desktop: `1440 x 1000`
- Mobile: `390 x 900`

Add a tablet or intermediate width when the changed surface is dense. If work touches existing responsive rules near `1100px` or `820px`, inspect immediately above and below the affected breakpoint, not only at the two baselines. Browser zoom should remain at 100% unless the task is specifically about zoom or accessibility scaling.

## Render-and-Inspect Checklist

### 1. Runtime health

- The initial app shell renders and the requested workspace finishes loading.
- Navigation between covered workspaces succeeds without a blank or stale panel.
- There are no new browser console errors, unhandled promise rejections, or uncaught page errors.
- Changed images load successfully; expected fallback or empty states do not show broken-image icons.

### 2. Layout containment

- `document.documentElement.scrollWidth` does not exceed `clientWidth` unless document-level horizontal scrolling is an explicit approved behavior.
- Panels, cards, controls, menus, dialogs, and output previews stay within their containers.
- Long Chinese and English labels wrap or truncate intentionally; they do not collide with buttons or counts.
- Focus rings, menus, dropdowns, tooltips, and modal actions are not clipped by an ancestor overflow rule.
- Intentional scrolling remains inside clearly bounded areas such as long option lists or prompt previews.
- Opening, closing, selecting, loading, and pagination do not cause disruptive layout jumps.

### 3. Visual consistency

- Existing hierarchy, warm neutral palette, type scale, panel treatment, spacing rhythm, control shapes, and active-state language remain coherent.
- Primary actions are visually stronger than secondary actions; disabled controls remain recognizable without appearing active.
- Repeated cards and control groups align consistently. A local fix does not introduce an unexplained one-off width, radius, shadow, or color.
- The changed view still reads as a working creative tool, not a detached marketing section.

### 4. Responsive behavior

- Multi-column layouts collapse in a useful order; the primary task remains ahead of secondary output or utility panels.
- Controls remain tappable and labels remain readable at `390px` width.
- Navigation and settings remain reachable without accidental page overflow.
- Cards preserve useful image crops and do not become too short to identify or so tall that controls are effectively unreachable.
- Sticky, fixed, or full-height elements do not hide content behind the browser viewport.

### 5. Interaction and state

- Exercise the primary user action, not only the first rendered frame.
- Confirm selected/active styling tracks the actual selected value.
- Confirm disabled controls cannot be activated and explain their state when the existing interface does so.
- Check affected success feedback, copy/save/import confirmation, empty state, loading state, and error state.
- For import/restore flows, verify both the source state and the resulting destination state.
- Use keyboard navigation for changed controls: focus must be visible, activation must work, and focus must not become trapped or lost when a dialog/menu closes.

### 6. Content and compatibility

- User-facing labels match current names even where internal field names are historical.
- Counts, pagination, selected summaries, prompt-source choices, and saved-card metadata agree with the underlying state.
- Prompt text is not visibly duplicated, cut off, or assigned to the wrong public output.
- Existing saved/imported data still renders in the changed surface when compatibility is in scope.

## Workspace Scenarios

Run the scenarios affected by the change. For shell/global changes, run at least the bold scenario in every workspace.

### Prompt 工作台

- **Open each PAGE1 section and confirm sidebar, editor, output actions, and preview column remain usable.**
- Exercise the changed control, section random/clear behavior, or subject mode.
- Verify all four output choices remain present where expected and DLL PIC Pro uses the selected source.
- When crop, wardrobe, character, duo, Pose Composer, or import behavior changed, inspect that exact state rather than relying on the default prompt.

### 角色建模

- **Open the card catalog, change pages, select a character, and inspect the configuration and output columns.**
- Confirm `10 / 10 / 10 / 3` pagination remains coherent for the current 33-card catalog.
- Confirm visible previews load and preserve intentional crops.
- When relevant, exercise hair, eyewear, wardrobe-layer choices, all six copy outputs, PAGE1 import, and the DLL PIC Pro prompt-source selector.
- Desktop should preserve the intended five-card grid where the layout has room; mobile should collapse without document overflow.

### 動作姿勢

- **Select a card and confirm the configuration and output panels reflect it.**
- Exercise save/apply-to-PAGE1 behavior when affected.
- If subject-mode gating changed, verify the disabled duo case and the enabled single-subject case.

### 場景建模

- **Change a scene field and confirm summary, anchor, and the three scene outputs update.**
- Exercise PAGE1 import when the world-scene bridge or related layout changed.
- Confirm dense location and output controls collapse to a usable single-column mobile layout.

### Saved Cards

- **Open Saved Cards, change a source filter, and inspect the card list at each supported density.**
- Cover both an empty result and a populated result when filter, storage, or migration behavior changed.
- Exercise the affected copy, restore/apply, export/import, pagination/load-more, or cloud/auth state.

## Evidence and Acceptance

For a material visual change, retain at least one desktop and one mobile screenshot of the final affected state. For an interaction change, record the state transition that was exercised; a screenshot of only the initial page is insufficient.

The validation report must identify:

- URL and viewport sizes;
- workspaces and states inspected;
- primary interactions exercised;
- console/page-error result;
- horizontal-overflow result;
- screenshot paths when captured;
- any skipped state and the reason.

The change passes only when:

- the intended outcome is visibly present;
- the primary flow completes;
- no new runtime error appears;
- no accidental document overflow, clipping, collision, broken asset, or unreachable control remains;
- desktop and mobile behavior are both acceptable;
- unchanged shared surfaces remain coherent.

Do not mark visual validation as passed when only tests/build were run, only one viewport was inspected, only the first frame was viewed, or a known new error was ignored. If a required state needs unavailable credentials or an external service, validate every local state available and report the exact unverified boundary.

## Concise Report Template

```text
Visual QA: PASS / PARTIAL / FAIL
URL: http://127.0.0.1:5175/Virtual_Photography_Studio/
Viewports: 1440x1000, 390x900[, breakpoint checks]
Covered: <workspaces and states>
Interactions: <actions exercised>
Console/page errors: none / <details>
Horizontal overflow: none / <details>
Evidence: <absolute screenshot paths or not captured>
Unverified: none / <boundary and reason>
```
