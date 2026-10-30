# Virtual Photography Studio

Personal prompt operations tool for generating stable, high-volume prompts for Midjourney and Grok Imagine.

## Current Scope

- Constraint-based prompt generation instead of pure random mixing
- Lock selected factors and randomize the rest
- Batch generation for multiple prompt variations
- Model-specific prompt formats and derived outputs, governed by the existing output contracts
- The current PAGE1 UI uses the built-in catalog; custom-library engine interfaces remain available to tools and compatibility tests, without a public library-management screen
- Saved presets and last-result-aware reroll workflow that preserves locks while avoiding previous random choices

## Project Structure

- `AGENTS.md`: Repository-wide development, compatibility, evaluation, visual-QA, and session-synchronization rules
- `knowledge_base/catalog/`: Authoritative category JSON listed by `index.json`; the six Markdown dictionaries under `knowledge_base/` are generated reference views
- `source-assets/`: Original high-resolution reference images excluded from the Vite deployment artifact
- `scripts/sync_to_json.py`: Validates catalog JSON and generates the frontend database, six Markdown views, and legacy-mapping copy
- `scripts/build_image_previews.py`: Rebuilds 640px AVIF deployment previews from source assets
- `scripts/check_public_assets.py`: Enforces the public asset count and size budget
- `scripts/validate_prompt_logic.mjs`: Runs deterministic prompt-quality heuristics with an optional seed
- `functions/shared/imageProviderContract.json`: Versioned request/response contract shared by the webapp and Firebase Functions and packaged with deploys
- `webapp/`: React + Vite application
- `webapp/src/features/`: Saved Cards, PAGE1, PAGE2, and browser-storage feature boundaries
- `webapp/src/styles/`: Shared generation and multi-workspace CSS loaded by feature chunks
- `webapp/src/lib/engine.js`: Prompt-engine integration and compatibility boundary
- `webapp/src/lib/engine/`: Focused engine data, runtime, prompt-model, and selection-schema modules
- `webapp/src/lib/engine/promptOutputContracts.js`: Machine-readable contracts and validator for the four PAGE1 prompt outputs
- `webapp/src/lib/engine/representativePromptFixtures.js`: Deterministic representative scenarios for prompt regression evaluation
- `Docs/specs/frontend-visual-validation.md`: Required render-and-inspect workflow for browser-visible changes
- `Docs/specs/character-card-facial-identity.md`: Formal Character Card facial identity schema, difference matrix, compatibility contract, and maintenance workflow
- `Docs/specs/page1-random-none-control-contract.md`: PAGE1 batch-random and clear-action capability contract, Pose Composer randomization, and regression rules
- `output_prompts/`: Previously generated markdown prompt exports
- `Docs/`: Creative role notes and early workflow documents

## Local Workflow

1. Edit only the category JSON listed by `knowledge_base/catalog/index.json`; preserve issued IDs and follow the [catalog workflow](knowledge_base/catalog/README.md). Set `REGISTRY_BASE_COMMIT` to a reviewed full historical commit SHA before sync
2. Run `python3 scripts/sync_to_json.py`
3. Run `python3 scripts/sync_to_json.py --check`
4. When reference source images change, run `python3 scripts/build_image_previews.py`
5. Run `python3 scripts/check_public_assets.py`
6. Start the app from `webapp/`
7. Use the current workspace controls, locks, presets, and reroll workflow to generate prompts from the built-in catalog

## Webapp Commands

From `webapp/`:

```bash
npm install
npm run dev
npm test
npm run test:prompt-quality
npm run audit:prompts
npm run audit:prompts:strict
npm run lint
npm run build
```

Run a reproducible prompt-logic sample from the repository root:

```bash
node scripts/validate_prompt_logic.mjs 200 optimization-audit
```

The optional second argument is the random seed. Reusing the same seed reproduces prompt content and selections; generated IDs and timestamps remain runtime metadata.

The default prompt audit is diagnostic. `npm run audit:prompts:strict` fails only on output-contract violations, exact duplicates, public control-language leakage, or contradictory constraints. Existing wardrobe/scene compatibility heuristics and near-duplicate signals remain diagnostic so they can be reviewed without hiding a contract regression.

## Data and Asset Integrity

Wardrobe reference images are mapped through `knowledge_base/wardrobe_reference_manifest.json`, not by list position. The sync fails on missing files, duplicate IDs/names, unexpected files, or stale generated JSON. Catalog records and metadata are authored in the category JSON listed by `knowledge_base/catalog/index.json`. The six Markdown dictionaries and `database.json` are generated, read-only outputs. Set a reviewed `REGISTRY_BASE_COMMIT` before sync; schema, append-only historical ID validation and all eight generated-output checks are mandatory. See [catalog workflow](knowledge_base/catalog/README.md).

The browser receives AVIF previews from `webapp/public`; original images remain under `source-assets` and are not copied into the GitHub Pages artifact. CI runs the sync tests, `--check`, and the public asset budget check before the frontend quality gates.

Saved Cards has one Favorites collection. Existing `vps.prompts` Feed records are migrated once into Favorites, de-duplicated by ID, and the legacy storage keys are removed only after the merged Favorites payload is written successfully.

The app shell lazy-loads each workspace. Saved Cards archive dependencies and workspace CSS are split from the initial bundle; PAGE1 state, selectors, transitions, and Saved Cards persistence/cloud sync live outside `App.jsx`. Firebase proxy requests for Magnific and BytePlus are normalized against `functions/shared/imageProviderContract.json` on both the browser and Functions sides.

## Character-card facial identity

The 33 built-in Character Card profiles are paged in PAGE2 as `10 / 10 / 10 / 3` and preserve the historical `identityAndBody` field for existing Saved Cards and PAGE1/PAGE2 integrations. New profile fields (`facialGeometry`, `eyeSignature`, `noseSignature`, `mouthSignature`, `skinSignature`, `makeup`, `body`, and `distinctiveFeatures`) are rendered separately by full prompts. Every compact AI prompt also carries four non-negotiable facial identity anchors; changing hair, wardrobe, or makeup must not replace the character's face. See [`Docs/specs/character-card-facial-identity.md`](Docs/specs/character-card-facial-identity.md).

## Prompt Engine Architecture

The engine compiles the default prompt catalog and lock controls once, injects randomness for reproducible tests, builds one ordered prompt-section model, and renders the three public prompt formats from that shared model. Default runtime data is deeply frozen. Ordinary non-empty custom arrays and database objects compile per call; explicitly registered immutable historical libraries use their documented cache path. These engine interfaces do not imply a current browser UI for editing custom libraries.

Prompt changes must also pass the machine-readable four-output contracts and the fixed representative fixtures. Gpt remains full fidelity; Grok/Z-Image and AI must not leak internal renderer labels or approval/control language; the single-subject full-body output remains a separate fixed `9:16` compatibility surface.

See [`Docs/specs/engine-architecture.md`](Docs/specs/engine-architecture.md) for module ownership, compatibility contracts, validation guidance, and dated performance measurements.

## Compatibility and Tool-Only Sources

The 19 Negative catalog entries remain protected by catalog IDs and historical snapshots. The current webapp has no control or renderer consuming this catalog group, so it does not provide dynamic negative-prompt generation from these entries. Separate pose-guard wording is not a consumer of this group.

Custom-library parameters support tools, tests, and historical replay. The current PAGE1 hook passes an empty custom library; this README does not claim a custom-library editor or storage workflow in the production UI. Array overlays append only `zh`, `en`, and `desc`; they are not an authoring path for stable IDs or full metadata. The database-object path and snapshot/compiler helpers retain their documented tool uses.

The legacy Python generator still contains a standalone negative-prompt path, and its Markdown parser is used by catalog preparation and historical validation. Keep these sources unless a separate retirement is approved. For the four C5 usage decisions, including unchanged Elsa Bleda random-selection limitations and the seven compatibility bias tags, see [C5 usage inventory](Docs/specs/c5-usage-retention-v1.md).
