# Webapp

Frontend for the Virtual Photography Studio prompt tool. Start with [session onboarding](../Docs/session_onboarding.md), [current state](../Docs/current_project_state.md), and the applicable authoring guide.

## Features

- Lockable generation inputs
- Constraint-based prompt composition
- GPT, Z-Image, Midjourney and Nano Banana outputs, plus supported derived outputs
- Dynamic negative prompt filtering
- Saved presets in browser storage
- Local custom library overlay
- Partial reroll/remix workflow

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Notes

- Catalog source is the indexed JSON under ../knowledge_base/catalog/; sync generates the database and Markdown overviews. Specified actions, character sources, fixed scenes and PAGE3 have separate owners; see session onboarding.
- Custom entries created in the UI are stored in `localStorage`, not written back to markdown automatically
