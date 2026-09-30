# PAGE1 preview appendices v1

Approved scope: optional UI actions below the generation summary and above the six prompt previews. These are text instructions, not provider-native batch-generation parameters.

## Behavior

- Four exclusive actions: 四張自由變化, 四張多機位, 素人失敗自拍 and 日常生活照; 清除附加 removes the temporary appendix.
- `webapp/src/lib/promptAppendices.js` owns stable IDs, labels, descriptions and English text. Add future templates here without changing engine or catalog data.
- Always compose from the original preview card value, never from previously appended text. Original bytes, including selected ratios and MJ parameters, are preserved. The original two templates add no ratio; the two snapshot templates append the approved request for four separate 9:16 photographs, without changing the original ratio fields or MJ tail.
- Apply to every currently available nonblank output (six for single subject, three for duo). Empty outputs stay empty. Summary stays unchanged.
- Copy uses the same value displayed in each preview. No provider request is made by these buttons.
- New preview object (reroll, setting-driven regeneration, restore) clears the action. Workspace unmount also clears it. This is not a saved generation setting.
- Favorites, DLL image-generation sources, locks, original preview payload, imports and storage schemas remain unchanged. The toolbar explicitly states this boundary.
- Existing full-body/crop instructions are not rewritten. External models may not follow the requested count, separation or viewpoint changes; this manual appendix does not promise strict geometric consistency or native Midjourney parameter compatibility.

## Snapshot templates (2026-09-30)

- 素人失敗自拍 uses the user's tested short wording: `Create a series of imperfect amateur smartphone selfies. Keep the same person, outfit, and setting described above; freely vary poses and camera angles. Generate 4 separate 9:16 photographs, not a collage, with no added text.` Selfies and companion-style casual portraits may mix; do not add an exhaustive flaw list.
- 日常生活照 uses the approved short wording: `Create a series of casual everyday snapshots with natural expressions. Keep the same person, outfit, and setting described above; freely vary activities, poses, and camera angles. Generate 4 separate 9:16 photographs, not a collage, with no added text.`
- Keep both actions in the existing registry and exclusive toolbar flow. No new count/ratio selectors or camera/pose locks. User tests accepted occasional four-panel collages; retain the requested separate-image wording without adding corrective instructions.

## Validation (2026-09-30)

- Snapshot extension: focused 5/5 and full frontend 1126/1126, lint/build passed. At desktop 1440×1000/mobile 390×900, six exact appended values, repeated click, new/old template replacement, clear restoring original bytes, keyboard activation and workspace-exit reset passed. All five workspaces loaded with no document overflow, broken loaded images or console warnings/errors. Screenshots: `/tmp/vps-snapshot-desktop.png`, `/tmp/vps-snapshot-mobile.png`. No clipboard round trip or external-model generation performed in this extension.
- Focused helpers/consumers: 5/5. Frontend full test suite: 1126/1126. Lint and build passed; existing large bundle warning remains. No engine or authored catalog changes.
- Browser: `http://127.0.0.1:5175/Virtual_Photography_Studio/`, 1440×1000 and 390×900. Six populated previews, free/multicamera replacement, repeated action, clear restoring exact original text, disabled clear, and reroll reset verified. Empty/unknown cases covered by helper tests.
- All five active workspaces loaded at both viewport sizes; no document overflow, broken loaded images, or console warnings/errors observed. Existing narrow-screen primary-action label truncation is unchanged. No Saved Cards written or provider generation requested.
- Copy button displayed success and shares the preview value through the existing callback. The browser automation virtual clipboard returned empty and refused paste, so cross-application clipboard contents are NOT verified. Do not describe this as a successful clipboard round trip.
- Screenshots: `/tmp/vps-appendix-desktop.png`, `/tmp/vps-appendix-mobile.png`.
