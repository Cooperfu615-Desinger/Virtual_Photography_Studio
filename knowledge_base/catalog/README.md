# Catalog architecture B: preparation only

2026-10-25. This directory contains validation contracts, **not the production data source**. Production `scripts/sync_to_json.py` still reads the six existing knowledge-base Markdown files, metadata and image manifests. No production `index.json`, category records or `id_registry.json` exists here. C requires separate authorization.

## Contracts

- [schema.json](schema.json): project-specific common → section → category wrapper; 6 sections / 56 current categories. Supported keywords are only `type`, `enum`, `required`, `properties`, `items`, `additionalProperties`, `pattern`, `minLength`. Equal field definitions may merge; conflicting definitions, unknown keywords and unknown record fields fail. Required strings reject blank content. Nested objects and arrays are checked recursively; boolean, zero and empty-string handling follows each explicit schema.
- [field_mapping.json](field_mapping.json): 22 current top-level source fields and 67 observed top-level/nested paths, source/generated/runtime ownership, applicable categories, overwrite order and conditional policies. Counts describe the reviewed source, not permanent limits. New fields/categories require explicit review of this contract. Direct runtime comparisons inspect every value, including all 47 `lyingSurface` records; inferred metadata and key/tag order remain protected by A snapshots.
- Manifest image keys remain generated-only. Future `id → stableId → id`, Regional `inspiration | desc`, and deferred `meta.semantic` responsibilities are recorded separately. No D semantic source is introduced.

## Read-only integrity gate

From repository root, after existing `webapp` dependencies are available:

```sh
node scripts/check_catalog_integrity.mjs --strict
node --test scripts/tests/catalog-integrity.test.mjs
python3 -B -m unittest discover -s scripts/tests
python3 -B scripts/sync_to_json.py --check
```

The strict checker includes schema validation, actual field consumption, final per-control ID/alias ownership, five-way character ID sets, embedded pose/action/fixed-set references and overlays with source pins. Unsupported/invalid input or a parser failure returns nonzero. `possible` diagnostics are reported without blocking. A `confirmed` issue must have its exact `code + itemKey` in [the reviewed allowlist](../../scripts/catalog_integrity_allowlist.json), with reason and decision reference. Stale exceptions fail too. The initial two exceptions preserve J12's existing duo resolution order; no broad code-level exemption is permitted.

## Isolated rehearsal

```sh
node scripts/migrations/migrate_catalog_to_json.mjs \
  --output /private/tmp/catalog-b-new-run \
  --source-sha FULL_CURRENT_HEAD_SHA
```

Replace `FULL_CURRENT_HEAD_SHA` with the full reviewed current commit. The output must be a **new directory outside the repository**, with an existing parent. Existing output, paths resolving through symlinks into the repo, changed runtime/source files, untracked runtime/source files, missing historical A Git objects and invalid schemas fail. Tool/doc changes may be uncommitted. No default production destination or source-switch flag exists.

The orchestrator verifies A seals, extracts historical entries from the A Git object, checks every frozen ID against the sealed A catalog snapshot, then prepares 56 category files, index/layout and registry **inside a disposable staging directory**. It rebuilds `database.json`, compares bytes after removing only `stableId`/`legacyIds`, compares complete compiled entries/catalog and final controls, regenerates all six Markdown tables and checks both existing parsers (12 round-trips). IDs and aliases are separately compared in the complete compiled objects, not discarded as a side effect of the byte comparison. Source hashes are checked again before publication. Only an entirely successful result is atomically renamed to the requested output; a failed run removes its own staging directory and does not overwrite a racing target.

`catalog_prepare.py --output` is an internal worker accepting an **existing empty external staging directory**. Use the Node orchestrator for end-to-end execution and cleanup. The generated Markdown warning describes the proposed C workflow; it is rehearsal output only. Do not copy it over production Markdown or run it as a C cutover.

## Historical ID validator

[scripts/catalog_registry.py](../../scripts/catalog_registry.py) is a dependency-free library, exercised by Python fixtures and the isolated initial-freeze rehearsal. `load_registry_history(repo, base_commit, candidate_commit)` reads the explicit full-SHA Git object, requires ancestry and rejects the candidate as its own baseline. Local uncommitted validation may use the committed HEAD as the prior version; committed candidate checks must pass its SHA explicitly. The caller selects a trusted historical commit; candidate JSON cannot choose its own base. Missing object, missing historical registry or invalid JSON fails, without a current-only fallback.

`validate_registry` checks append-only issued IDs, immutable initial group/category/provenance, initial A set equality, active format, live catalog/registry symmetry, status transitions and alias ownership. Self aliases are legal; another primary or alias owner is not. Retired IDs cannot reappear. Fixtures cover simultaneous deletion of data and registry, retired-history deletion, replacement self-loops/cycles/dangling targets and missing history.

Retirement is disabled by default throughout A–E. The fixture-only retirement option checks graph structure and required policy fields; it does **not** prove real control restoration or authorize retirement. A future retirement proposal still requires the spec's fixed old payload, actual control/migration resolution and regenerated-result acceptance. This version also refuses edits to existing retired history; a future approved multi-step replacement must extend that rule with explicit evidence. C must connect trusted historical comparison to the real registry and production sync; B has not activated that production path.

## CI and acceptance

The webapp-quality job now requests full Git history, runs strict integrity after `npm ci`, runs Node tool tests, then rehearses outside the checkout before the existing frontend tests. Existing Python discovery includes schema/registry tests. These are local workflow changes; no remote CI has run for this uncommitted batch.

See [v1.1](../../Docs/specs/catalog-data-architecture-v1.md) and the [B acceptance report](../../Docs/reports/catalog-architecture-b-2026-10-25/README.md). A artifacts are immutable. Do not re-record them to hide a difference. No engine, renderer, storage key, selected value, public output or actual catalog content changes are part of B.
