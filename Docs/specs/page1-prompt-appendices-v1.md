# PAGE1 preview appendices v1

Approved scope: optional UI actions below the generation summary and above the six prompt previews. These are text instructions, not provider-native batch-generation parameters.

## Behavior

- Two exclusive actions: 四張自由變化 and 四張多機位; 清除附加 removes the temporary appendix.
- `webapp/src/lib/promptAppendices.js` owns stable IDs, labels, descriptions and English text. Add future templates here without changing engine or catalog data.
- Always compose from the original preview card value, never from previously appended text. Original bytes, including selected ratios and MJ parameters, are preserved; the appendix adds no ratio.
- Apply to every currently available nonblank output (six for single subject, three for duo). Empty outputs stay empty. Summary stays unchanged.
- Copy uses the same value displayed in each preview. No provider request is made by these buttons.
- New preview object (reroll, setting-driven regeneration, restore) clears the action. Workspace unmount also clears it. This is not a saved generation setting.
- Favorites, DLL image-generation sources, locks, original preview payload, imports and storage schemas remain unchanged. The toolbar explicitly states this boundary.
- Existing full-body/crop instructions are not rewritten. External models may not follow the requested count, separation or viewpoint changes; this manual appendix does not promise strict geometric consistency or native Midjourney parameter compatibility.

## Validation (2026-09-30)

- Focused helpers/consumers: 5/5. Frontend full test suite: 1126/1126. Lint and build passed; existing large bundle warning remains. No engine or authored catalog changes.
- Browser: `http://127.0.0.1:5175/Virtual_Photography_Studio/`, 1440×1000 and 390×900. Six populated previews, free/multicamera replacement, repeated action, clear restoring exact original text, disabled clear, and reroll reset verified. Empty/unknown cases covered by helper tests.
- All five active workspaces loaded at both viewport sizes; no document overflow, broken loaded images, or console warnings/errors observed. Existing narrow-screen primary-action label truncation is unchanged. No Saved Cards written or provider generation requested.
- Copy button displayed success and shares the preview value through the existing callback. The browser automation virtual clipboard returned empty and refused paste, so cross-application clipboard contents are NOT verified. Do not describe this as a successful clipboard round trip.
- Screenshots: `/tmp/vps-appendix-desktop.png`, `/tmp/vps-appendix-mobile.png`.
