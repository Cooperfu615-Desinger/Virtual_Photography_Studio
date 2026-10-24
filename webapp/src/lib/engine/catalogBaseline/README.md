# Catalog architecture A — frozen acceptance data

Source commit: `0746b280cc9f5c00daec7dadc73329779ac658e9` (main, 2026-10-24).
At initial recording, these artifacts and the A tools were intentionally uncommitted pending user review. The user has since accepted A and its main alignment and authorized scoped commit/push; B remains unauthorized. The source commit identifies the original runtime/data, not an A delivery commit. The manifests record the uncommitted generator/fixture hashes separately.

- `corpus.json.gz`: 2,540 fixed raw input cases, seeds, shared RNG streams, modes, and historical saved JSON/Markdown payloads. Resolve labels only when authoring the corpus; replay does not consult labels again.
- `outputs.json.gz`: full public prompt results except the exact top-level `prompt.id` and `prompt.date` paths; includes selection, summary, structured data, output applicability, RNG call count, restored locks, normalized locks, ordered eligible option IDs, display/DLL sources, all ID/alias resolutions, Saved Card round-trips and audit findings. Audit uses stable case IDs as diagnostic labels.
- `manifest.json`: source commit, Node/lockfile versions, tool/fixture hashes, ordered case IDs, expected effective outputs and artifact SHA-256. Also seals the three adjacent catalog snapshot JSON files.
- `coverage-corpus.json.gz` / `coverage-outputs.json.gz`: 141 additional effective orientation cases (47 lyingSurface scenes × side/prone/supine), plus the same 200 audit cases. The original legacy arrangement inputs remain in the core corpus; they are not relabeled as current effective orientation coverage.
- `coverage-manifest.json`: independent supplemental provenance. Every original runtime/data Git blob was checked before recording from an exported original Git tree. It refuses to overwrite existing evidence.

Both recording passes must agree before writing. Gzip is lossless storage for JSON, not prompt normalization. Use the exported `readJson` helper to inspect it. The finite matrix is not an exhaustive Cartesian product of all selections.

## Routine verification (repository root)

```bash
node scripts/catalog_baseline.mjs verify
node scripts/catalog_baseline.mjs check
node scripts/catalog_coverage_baseline.mjs check
node --test webapp/src/lib/engine/catalogSnapshot.test.js webapp/src/lib/engine/catalogBaselineCli.test.js
```

All four `catalog*.test.js` files are included in `npm test`. With Node 25, use the existing suite's expected TAP reporter:

```bash
cd webapp
NODE_OPTIONS=--test-reporter=tap npm test
npm run test:prompt-quality
npm run lint
npm run build
```

The baseline was recorded with Node `v25.8.2`. The two pre-existing runner tests require TAP text; the default Node 25 reporter failure was reproduced on the original commit. No product/test-runner code was changed to address it.

## Explicit comparisons

```bash
node scripts/catalog_baseline.mjs capture /tmp/catalog-candidate.json.gz
node scripts/catalog_baseline.mjs compare webapp/src/lib/engine/catalogBaseline/outputs.json.gz /tmp/catalog-candidate.json.gz
```

Missing/unparseable files, unresolved or duplicate cases, case-set differences, missing/extra outputs, punctuation/whitespace, same-length substitutions, selections, structured IDs, metadata order and RNG differences must fail with a nonzero exit. Reports identify the case and field path. Only `prompt.id` and `prompt.date` are excluded; nested IDs remain protected.

The legacy `dump_prompt_outputs.mjs --compare` now fails on differences and unresolved inputs, but its old input sampling format is retained. Use the sealed A tools for migration acceptance.

## Re-recording is a reviewed operation

Do not run record/update commands to silence a migration failure. `catalog_baseline.mjs record <new-directory>` refuses to overwrite an existing directory and refuses modified runtime/data. The supplementary recorder requires a verified original source tree. `scripts/update_catalog_snapshots.mjs` is the only snapshot writer; its output includes changed paths. Changing a snapshot also invalidates the manifest seal. A newly approved product baseline needs a separately reviewed manifest and explanation; preserve this baseline.

For browser checks, provide a preinstalled Playwright module, a local development URL with `?dllAcceptance=1`, and an evidence directory:

```bash
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node scripts/catalog_baseline_browser.mjs 'http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1' /tmp/catalog-browser
```

The script launches a new isolated browser context, seeds only its own historical cards, uses the local simulation namespace and aborts external POST requests. It checks five current workspaces at 1440×1000 and 390×900, historical restore/import, character/scene apply, observation capture, six clipboard outputs and explicit DLL transfer/draft reload. Screenshots still require human/agent inspection after the automated checks.

## A alignment to main 2f56438 (2026-10-24)

The original source baseline above remains immutable and is still checked in full. The user accepted A and then authorized alignment to main `2f56438804e751de4556060b293231966d6ea3b3`, after observation full-body import PR #15 and the pose legacy inventory document.

The separate [alignment revision](revisions/2f56438/README.md) binds the old artifacts by SHA-256 and adds 170 import cases, five source workflows and ten saved payloads. Its 200 audit rows reuse the existing fixed inputs. It does not replace the original corpus, snapshots or supplemental evidence.

Run the old checks above **and**:

```bash
node scripts/catalog_alignment_baseline.mjs verify
node scripts/catalog_alignment_baseline.mjs check
node --test webapp/src/lib/engine/catalogAlignment.test.js
```

The full frontend test command discovers the added test automatically. Recording another revision requires an explicitly reviewed reason and an exported committed source tree; the recorder checks every source Git blob, compares both inherited suites, runs the new corpus and workflows twice, and refuses to overwrite a revision directory. Do not change expected outputs to hide migration regressions.
