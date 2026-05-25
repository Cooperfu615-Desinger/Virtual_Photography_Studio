# Special Subject Prompt Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance all five existing special subjects so they read as unknown physical figures naturally appearing in real contemporary scenes.

**Architecture:** Special subjects are code-defined in `webapp/src/lib/engine.js`, so implementation updates `SPECIAL_SUBJECT_OPTIONS` directly and adds one shared prompt assembly sentence for modern-world integration. Existing tests in `webapp/src/lib/engineSpecialSubjects.test.js` guard exposed labels, wardrobe suppression, android hair controls, positive prompt wording, and the shared integration sentence.

**Tech Stack:** JavaScript engine data, Node built-in test runner, Vite app.

---

### Task 1: Focused RED Tests

**Files:**
- Modify: `webapp/src/lib/engineSpecialSubjects.test.js`

- [x] **Step 1: Add failing assertions for enhanced special subjects**

Update `webapp/src/lib/engineSpecialSubjects.test.js` so it checks:

- Each special subject prompt includes live-action or physical photographic language.
- Generated prompt output includes the shared modern-world integration language.
- Warrior and knight prompts avoid `not anime`, `not cosplay`, and `not fantasy armor`.
- Android prompt avoids `not a helmeted robot`, `not cartoon`, and `not toy-like`.
- Expression and pose still compose with a selected special subject.

- [x] **Step 2: Run focused test and confirm RED**

Run:

```bash
cd webapp
node --test src/lib/engineSpecialSubjects.test.js
```

Expected: FAIL because current prompts still use negative wording and do not include the shared modern-world integration sentence.

### Task 2: Engine Prompt Enhancement

**Files:**
- Modify: `webapp/src/lib/engine.js`

- [x] **Step 1: Rewrite special subject option prompts**

Update only the five non-empty `SPECIAL_SUBJECT_OPTIONS` prompts. Keep ids, labels, counts, `specialSubject` values, `skeletonToneZh`, and `specialToneZh` unchanged.

- [x] **Step 2: Add shared special subject integration text**

Add a small helper for the shared integration sentence and include it in Grok and Z-Image special-subject output. Pass it through skeleton sanitization for skeleton subjects.

### Task 3: Verification, Commit, Push

**Files:**
- Stage implementation files except `Docs/conversation_handoff.md`.

- [x] **Step 1: Run focused and full verification**

Run:

```bash
cd webapp
node --test src/lib/engineSpecialSubjects.test.js
npm test
npm run lint
npm run build
cd ..
git diff --check
```

Expected: all pass. Vite chunk-size warnings are acceptable.

- [x] **Step 2: Commit and push**

Stage implementation files and commit:

```bash
git commit -m "Enhance special subject prompts"
git push origin main
```
