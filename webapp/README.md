# Webapp

Frontend for the Virtual Photography Studio prompt tool.

## Features

- Lockable generation inputs
- Constraint-based prompt composition
- Midjourney and Grok Imagine output formats
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

- Source prompt data comes from `../knowledge_base` after running `../scripts/sync_to_json.py`
- Custom entries created in the UI are stored in `localStorage`, not written back to markdown automatically
