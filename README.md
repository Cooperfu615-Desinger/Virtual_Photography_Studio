# Virtual Photography Studio

Personal prompt operations tool for generating stable, high-volume prompts for Midjourney and Grok Imagine.

## Current Scope

- Constraint-based prompt generation instead of pure random mixing
- Lock selected factors and randomize the rest
- Batch generation for multiple prompt variations
- Midjourney prompt, Grok Imagine prompt, and dynamic negative prompt output
- Local custom library management for adding your own styles, locations, wardrobe items, camera ideas, and negative prompt entries
- Saved presets and partial reroll workflow

## Project Structure

- `knowledge_base/`: Markdown dictionaries used as the core source material
- `scripts/sync_to_json.py`: Converts markdown tables into frontend JSON data
- `scripts/validate_prompt_logic.mjs`: Runs deterministic prompt-quality heuristics with an optional seed
- `webapp/`: React + Vite application
- `webapp/src/lib/engine.js`: Prompt-engine integration and compatibility boundary
- `webapp/src/lib/engine/`: Focused engine data, runtime, prompt-model, and selection-schema modules
- `output_prompts/`: Previously generated markdown prompt exports
- `Docs/`: Creative role notes and early workflow documents

## Local Workflow

1. Update or expand files in `knowledge_base/`
2. Run `python3 scripts/sync_to_json.py`
3. Start the app from `webapp/`
4. Use locks, presets, custom library entries, and remix controls to generate prompt batches

## Webapp Commands

From `webapp/`:

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

Run a reproducible prompt-logic sample from the repository root:

```bash
node scripts/validate_prompt_logic.mjs 200 optimization-audit
```

The optional second argument is the random seed. Reusing the same seed reproduces prompt content and selections; generated IDs and timestamps remain runtime metadata.

## Prompt Engine Architecture

The engine compiles the default prompt catalog and lock controls once, injects randomness for reproducible tests, builds one ordered prompt-section model, and renders the three public prompt formats from that shared model. Default runtime data is deeply frozen; custom-library overlays are compiled per request so browser-local changes do not become stale.

See [`Docs/specs/engine-architecture.md`](Docs/specs/engine-architecture.md) for module ownership, compatibility contracts, validation guidance, and dated performance measurements.

## Phase 2 Notes

- Custom library entries are stored locally in browser `localStorage`
- Saved presets are also stored locally in the browser
- The base knowledge base is still markdown-driven; custom entries act as a local overlay layer on top of the synced JSON data
