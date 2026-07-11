# Virtual Photography Studio

Personal prompt operations tool for generating stable, high-volume prompts for Midjourney and Grok Imagine.

## Current Scope

- Constraint-based prompt generation instead of pure random mixing
- Lock selected factors and randomize the rest
- Batch generation for multiple prompt variations
- Midjourney prompt, Grok Imagine prompt, and dynamic negative prompt output
- Local custom library management for adding your own styles, locations, wardrobe items, camera ideas, and negative prompt entries
- Saved presets and last-result-aware reroll workflow that preserves locks while avoiding previous random choices

## Project Structure

- `knowledge_base/`: Markdown dictionaries used as the core source material
- `source-assets/`: Original high-resolution reference images excluded from the Vite deployment artifact
- `scripts/sync_to_json.py`: Converts markdown tables into frontend JSON data
- `scripts/build_image_previews.py`: Rebuilds 640px AVIF deployment previews from source assets
- `scripts/check_public_assets.py`: Enforces the public asset count and size budget
- `scripts/validate_prompt_logic.mjs`: Runs deterministic prompt-quality heuristics with an optional seed
- `functions/shared/imageProviderContract.json`: Versioned request/response contract shared by the webapp and Firebase Functions and packaged with deploys
- `webapp/`: React + Vite application
- `webapp/src/features/`: Saved Cards, PAGE1, PAGE2, and browser-storage feature boundaries
- `webapp/src/styles/`: Shared generation and multi-workspace CSS loaded by feature chunks
- `webapp/src/lib/engine.js`: Prompt-engine integration and compatibility boundary
- `webapp/src/lib/engine/`: Focused engine data, runtime, prompt-model, and selection-schema modules
- `Docs/specs/character-card-facial-identity.md`: Formal Character Card facial identity schema, difference matrix, compatibility contract, and maintenance workflow
- `output_prompts/`: Previously generated markdown prompt exports
- `Docs/`: Creative role notes and early workflow documents

## Local Workflow

1. Update or expand files in `knowledge_base/`
2. Run `python3 scripts/sync_to_json.py`
3. Run `python3 scripts/sync_to_json.py --check`
4. When reference source images change, run `python3 scripts/build_image_previews.py`
5. Run `python3 scripts/check_public_assets.py`
6. Start the app from `webapp/`
7. Use locks, presets, custom library entries, and remix controls to generate prompt batches

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

## Data and Asset Integrity

Wardrobe reference images are mapped through `knowledge_base/wardrobe_reference_manifest.json`, not by list position. The sync fails on missing files, duplicate IDs/names, unexpected files, or stale generated JSON. Item metadata that cannot live in Markdown is versioned in explicit JSON sources instead of being copied from the previous `database.json`.

The browser receives AVIF previews from `webapp/public`; original images remain under `source-assets` and are not copied into the GitHub Pages artifact. CI runs the sync tests, `--check`, and the public asset budget check before the frontend quality gates.

Saved Cards has one Favorites collection. Existing `vps.prompts` Feed records are migrated once into Favorites, de-duplicated by ID, and the legacy storage keys are removed only after the merged Favorites payload is written successfully.

The app shell lazy-loads each workspace. Saved Cards archive dependencies and workspace CSS are split from the initial bundle; PAGE1 state, selectors, transitions, and Saved Cards persistence/cloud sync live outside `App.jsx`. Firebase proxy requests for Magnific and BytePlus are normalized against `functions/shared/imageProviderContract.json` on both the browser and Functions sides.

## Character-card facial identity

The 27 built-in Character Card profiles are paged in PAGE2 as `10 / 10 / 7` and preserve the historical `identityAndBody` field for existing Saved Cards and PAGE1/PAGE2 integrations. New profile fields (`facialGeometry`, `eyeSignature`, `noseSignature`, `mouthSignature`, `skinSignature`, `makeup`, `body`, and `distinctiveFeatures`) are rendered separately by full prompts. Every compact AI prompt also carries four non-negotiable facial identity anchors; changing hair, wardrobe, or makeup must not replace the character's face. See [`Docs/specs/character-card-facial-identity.md`](Docs/specs/character-card-facial-identity.md).

## Prompt Engine Architecture

The engine compiles the default prompt catalog and lock controls once, injects randomness for reproducible tests, builds one ordered prompt-section model, and renders the three public prompt formats from that shared model. Default runtime data is deeply frozen; custom-library overlays are compiled per request so browser-local changes do not become stale.

See [`Docs/specs/engine-architecture.md`](Docs/specs/engine-architecture.md) for module ownership, compatibility contracts, validation guidance, and dated performance measurements.

## Phase 2 Notes

- Custom library entries are stored locally in browser `localStorage`
- Saved presets are also stored locally in the browser
- The base knowledge base is still markdown-driven; custom entries act as a local overlay layer on top of the synced JSON data
