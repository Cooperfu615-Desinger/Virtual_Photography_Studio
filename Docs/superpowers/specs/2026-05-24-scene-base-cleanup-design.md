# Scene Base Cleanup Design

## Goal

Clean the older PAGE1 scene base prompts so `Location` describes only the physical place, while `Environment Mood`, `Scene Accent`, `Light Style`, and photography style remain responsible for time, weather, lighting, atmosphere, and camera tone.

The first cleanup batch should improve prompt stability without changing the identity of existing scenes.

## Scope

First batch targets older, shorter, or mood-heavy scene entries in `knowledge_base/locations_and_sets.md`, especially:

- Natural outdoor legacy scenes such as grass, sunflower field, forest path, lakeside deck, rocky shore, and sand dunes.
- Lifestyle indoor legacy scenes such as boutique hotel, apartment living room, bedroom window area, bathroom vanity, fitting room, and elevator.
- Local lifestyle detail scenes such as laundromat, library, cafe, inn, pub, music room, and listening-corner entries.

Recent high-specificity entries should be left alone in this first batch unless they clearly violate the cleanup rules. This includes train scenes, solid-color cyclorama backgrounds, Meguro River, yacht marina, and other recently refined scenes.

## Scene Base Rules

Each `Location` prompt should focus on:

- Space identity: what place this is.
- Visible anchors: doors, windows, counters, railing, shelves, signs, machines, furniture, walls, floors, plants, water, sand, stone, or other concrete objects.
- Material and surface cues: tile, glass, metal, wood, concrete, fabric, grass, wet sand, stone, or similar texture.
- Subject placement affordance: where a person can stand, sit, lean, or lie when useful.
- Background layering only when it helps scene recognition.

Each `Location` prompt should avoid:

- Time of day, weather, sky state, sunlight, glow, night, rain, fog, haze, moonlight, sunset, or daylight language unless the physical place cannot be identified without it.
- Photography style and rendering tone such as cinematic, editorial, commercial, portrait mood, photobook atmosphere, snapshot mood, or film still.
- Generic emotional atmosphere such as solitude, mysterious mood, quiet mood, romantic mood, energetic mood, or tension.
- Lighting behavior that belongs in `Environment Mood` or `Light Style`.

## Anti-Symmetry Rule

Scene base wording should avoid pushing the model into a rigid one-point-perspective layout with matching buildings, trees, columns, or objects neatly lining both left and right sides.

Prefer asymmetric human-scale anchors:

- Corner, edge, entrance, doorway, railing, counter, window side, wall section, stair landing, bench edge, machine front, shelf row, table side, ground plane, shoreline edge, or uneven natural surface.
- Angled, partial, layered, offset, or close human-scale framing cues.

Avoid wording that implies:

- A central road, path, aisle, boulevard, avenue, corridor, or tree tunnel unless the scene explicitly needs it.
- Two perfectly mirrored rows of buildings, trees, lights, chairs, pillars, or storefronts.
- Symmetrical left-right alignment as the default scene structure.

## Data Flow

The source file remains `knowledge_base/locations_and_sets.md`.

After edits, run:

```bash
python3 scripts/sync_to_json.py
cd webapp
npm run lint
npm run build
```

The sync script updates `webapp/src/data/database.json`. Prompt assembly in `webapp/src/lib/engine.js` should not need code changes for this first batch.

## Validation

Validation should confirm:

- Markdown sync succeeds.
- `database.json` remains valid.
- Lint passes.
- Build passes, allowing the existing Vite large chunk warning.
- Spot-check generated prompt output for a few cleaned scenes to confirm `Location` is cleaner and `Environment Mood` / `Light Style` still carry the intended atmosphere.

## Out of Scope

This first batch does not redesign the scene system, add new UI controls, rewrite the contextual `Scene Accent` engine, or tune night exposure behavior. Those can be handled after the scene base layer is cleaner.
