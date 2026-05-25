# Special Action Prompt Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep all 27 existing special actions while tightening prompt wording and preserving pose-composition behavior.

**Architecture:** `knowledge_base/character_design.md` remains the source of truth for character prompt text. `webapp/src/data/database.json` should receive only the synced `Character["特殊動作 (Special Actions)"]` category from the Markdown source. Tests under `webapp/src/lib` guard labels, prompt length, stable wording, metadata inference, and pose priority behavior.

**Tech Stack:** Markdown knowledge base, JSON sync script, Node built-in test runner, Vite app data.

---

### Task 1: Focused RED Tests

**Files:**
- Create: `webapp/src/lib/engineSpecialActionCleanup.test.js`

- [x] **Step 1: Add focused special action cleanup tests**

Create `webapp/src/lib/engineSpecialActionCleanup.test.js` with tests that assert:

- `specialActionId` exposes `全無` plus exactly the 27 existing non-empty labels.
- Every non-empty action prompt is under 55 words and 360 characters.
- Non-empty prompts do not contain unstable negative wording or repeated filler such as `deliberate`.
- Social shooting actions keep `social_shooting_action` metadata.
- Representative prop, leg-focus, large-prop, and full-body actions keep expected metadata.
- `靠牆站立` does not infer `wardrobe_action`.
- A social action can compose with a normal pose.
- A non-social action clears the normal pose slot.

- [x] **Step 2: Run focused test and confirm RED**

Run:

```bash
cd webapp
node --test src/lib/engineSpecialActionCleanup.test.js
```

Expected: FAIL because current prompts still contain negative wording or repeated `deliberate` filler, and `靠牆站立` currently infers `wardrobe_action`.

### Task 2: Prompt Data Cleanup

**Files:**
- Modify: `knowledge_base/character_design.md`
- Modify: `webapp/src/data/database.json`

- [x] **Step 1: Rewrite the 27 Markdown rows**

Replace only the non-empty `特殊動作 (Special Actions)` prompts with compact positive descriptions. Keep all labels exactly the same. Preserve metadata trigger words where tests require them.

- [x] **Step 2: Sync JSON and scope the diff**

Run:

```bash
python3 scripts/sync_to_json.py
```

Then replace only `Character["特殊動作 (Special Actions)"]` in `webapp/src/data/database.json` with the synced category so unrelated categories remain unchanged.

### Task 3: Verification And Commit

**Files:**
- Stage all implementation files except `Docs/conversation_handoff.md`.

- [x] **Step 1: Run focused and full verification**

Run:

```bash
cd webapp
node --test src/lib/engineSpecialActionCleanup.test.js
npm test
npm run lint
npm run build
cd ..
git diff --check
```

Expected: all pass. Vite chunk-size warnings are acceptable.

- [x] **Step 2: Commit**

Stage implementation files and commit:

```bash
git commit -m "Clean special action prompts"
```
