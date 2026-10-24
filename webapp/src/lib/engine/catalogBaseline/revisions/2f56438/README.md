# A alignment revision — 2f56438

Source: `2f56438804e751de4556060b293231966d6ea3b3`. Previous accepted source: `0746b280cc9f5c00daec7dadc73329779ac658e9`. This is A acceptance tooling only; B–E and data migration remain unauthorized. After acceptance, the user authorized scoped A commit/push on 2026-10-24.

- `manifest.json`: both commits, approved upstream commits, exact committed-source Git blobs, Node/locale/timezone/lockfile, generator hashes, case IDs and effective outputs, inherited artifact hashes and zero-difference replay results.
- `corpus.json.gz`: frozen raw IDs/locks/seeds, five source scenarios, 120 scene/crop cases (5 sources × 8 scenes × 3 crops), 40 transition cases, five dormant-card cases, five standard-mode return cases, ten JSON/Markdown payloads, and the existing 200 fixed audit rows.
- `outputs.json.gz`: all six outputs, effective states, selections, summary/structured data, RNG counts, restore/normalize locks, eligible scene IDs, preview/DLL sources, every control ID/alias resolution and saved round-trips.
- `flows.json.gz`: original source output and import snapshot, replacement source, initial import, three rerolls, candidate-only replacement, explicit reimport, card-and-back and JSON reload profiles. Invalid snapshots, duo sources and capture-as-source are rejected. All nested IDs and metadata remain protected.

The source scenarios are random, explicit identity/wardrobe/color, all optional fields silent, close-cropped source with complete lower clothing/footwear, and dormant duo controls. Authoring fails if a selected catalog label does not exist; later replay never resolves labels again. The wardrobe fixture explicitly resolves ADIZERO footwear rather than accepting a missing match.

The addendum has 170 new cases and replays 200 existing audit rows. Combined with the old 2,540 cases and 141 effective-surface cases, coverage is **2,851 distinct prompt cases**, not 3,251 distinct cases. The three full replay sets contain 3,251 records because the 200 audit rows are repeated twice.

The original baseline directory and three catalog snapshot files are unchanged. Fresh recording was made from an exact Git archive of the committed source, without A's engine test hook. New captures and API workflows were repeated before sealing; both inherited suites matched this source exactly. Candidate checks keep all parent and child gates active.

Run `node scripts/catalog_alignment_baseline.mjs check` from the repository root. Full validation and browser evidence are recorded in [the alignment report](../../../../../../../Docs/reports/catalog-architecture-a-alignment-2026-10-24/README.md).
