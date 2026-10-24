# PAGE1 preview appendices v1

Approved scope: optional UI actions below the generation summary and above the six prompt previews. These are text instructions, not provider-native batch-generation parameters.

## 自訂攝影附加與 DLL 完整版帶入（2026-10-21，使用者已驗收）

本節是下方歷史「只預覽／複製、不帶入 DLL」的核准例外；用途為構圖、光線、色調與背景的一般攝影備註。

- 「自訂附加」獨立切換並展開多行輸入，與參考圖開關、四款互斥模板組合；也可單獨使用。依序輸出原始／參考投影、既有模板、自訂文字，各段以空行分隔。
- 保留輸入文字與換行，不翻譯、不改寫；空白備註不附加，空白來源不產生新輸出。每次從原始投影組合，重複切換或編輯不累加。MJ 原參數位置與內容保留，備註放在其後；不保證外部 MJ 對附加格式的接受程度。
- 關閉自訂附加只停用並保留本次文字；清除附加移除模板、自訂開關與文字，參考模式保持獨立。新 preview（重新生成、設定變更、回填）及離開工作台時全部暫存重設，不新增 Saved Cards 或瀏覽器儲存欄位。
- 預覽與複製使用同一組最終文字。Prompt 工作台快速面板的「開啟完整版」攜帶同一組六輸出（實際存在者）、來源 ID／名稱與固定比例；快速生圖仍使用原來源，其他工作區行為不變。
- DLL 已有草稿時不自動覆蓋，依既有「帶入 Prompt 工作台來源」更新；取代自訂文字仍確認。帶入後來源留在 DLL 草稿，可重新載入，不回寫原始 Prompt。任務快照與其他模型／張數／比例契約不變。
- 參考模式同步的是文字，不上傳參考圖或新增 provider 圖片參數；四張模板不變更 DLL 原生張數。沒有自動付費生成。
- 程式範圍：`Page1Workspace.jsx` 的暫存 UI、`promptAppendices.js` 的純文字組合、`page1PromptOutputs.js` 的一致預覽／帶入資料、`DllPicProPanel.jsx` 的可選完整版來源與局部 CSS。不改 engine、資料庫、Functions 或任務控制器。

- 使用者驗收後要求移除附加區的常駐說明文字；保留按鈕、狀態、輸入框標題與 placeholder，行為不變。移除後 lint／build 與桌面／手機附加、版面檢查通過。

### 本機驗證

- 基底 `main@90ed932`，實作前與交付前皆已 fetch 核對。使用者已驗收並授權僅提交／推送本批；實際提交及 Pages 結果以 Git／Actions 為準。
- 新增四項回歸測試；相關 33/33、完整前端 1770/1770、Prompt Quality 745/745、lint、build、diff-check 通過。保留既有大型 chunk 提示。
- 同 seed `200 / prompt-quality-baseline --strict` 修改前後整份 log 相同：0 blockers／18 diagnostic-only signals。
- 隔離 Chromium，桌面 1440×1000／手機 390×900，共 28 項操作與五個現用工作區 smoke 檢查。四模板 × 普通／參考模式 × 六輸出完成 48 次真實瀏覽器 clipboard 讀回比對；多行、空白、鍵盤、開關保留／清除／重新生成與離頁重設皆通過。
- DLL 新草稿六輸出逐字一致、固定比例保留、既有自訂草稿不被覆蓋、取消／確認帶入、reload 保留、手機複製／帶入通過。快速面板用本機模擬任務驗證仍提交原始 GPT，沒有外部 POST。
- 無新 console error／page error、破圖或 document 橫向溢出。截圖已檢視；暫存證據 `/tmp/vps-custom-browser/results.json`、`desktop-before.png`、`desktop-after.png`、`390-prompt.png`、`mobile-dll.png`。不代替真實模型出圖驗收。

## Behavior (historical baseline)

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
