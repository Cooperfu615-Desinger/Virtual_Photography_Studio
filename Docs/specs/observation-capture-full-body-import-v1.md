# 觀察式抓拍：匯入全身角色照 v1

日期：2026-10-24。狀態：使用者已確認本機驗收通過，授權僅提交並推送本批至 `origin/codex/shirt-black-bottom`；不合併或部署，其他未追蹤檔案保持原樣。

## 產品行為

在 Prompt 工作台的「觀察式抓拍 → 拍攝人物」新增人物來源選單，提供「選擇角色卡」與「匯入全身角色照」。此規格接續 [抓拍整合 v1](observation-capture-workspace-v1.md)，取代其停用的未來匯入入口；不擴充雙人或特殊主體。

- 匯入來源是切入抓拍前，一般拍攝最後一次已產生的單人預覽之完整全身角色資料。不是圖片上傳、文字反向解析或切換模式後重新隨機抽取。
- 點選「匯入全身角色照」即匯入。畫面以「生成摘要」的「人物／穿搭」兩列呈現，沿用現行摘要規則、隱去全無項；摘要並非完整資料的替代品。
- 「重新匯入」明確取用本次切入抓拍時保留的來源。回到一般拍攝調整或重新生成後，再進入抓拍時只更新可匯入來源，舊的已匯入人物仍保持，直到按重新匯入。
- 「回一般拍攝調整」返回 A 區；一般模式原始選值不被匯入覆寫。若原選項是隨機，回一般模式仍保持隨機規則。
- 抓拍重抽只更換抓拍組合，匯入人物、穿搭、配色與全身 reference 文字保持不變。A／C 在匯入模式中顯示已匯入摘要及調整提示，編輯欄位停用。
- 切換角色卡來源保留已匯入快照；角色卡來源仍沿用 A／C 原本的操作契約。
- 沒有有效的一般單人來源時顯示說明，停用重新匯入與生成／收藏；可回一般模式準備來源。

## 資料與輸出邊界

`observationCapture` 沿用 version 1，新增可選的 `personSource: 'full-body'`、`importedPerson`、`availablePerson`。角色卡仍為預設，不要求舊收藏新增欄位。每份人物快照保留：

| 欄位 | 內容 |
| --- | --- |
| `version` | 匯入快照 version 1 |
| `character` | 體態、五官、膚質、髮型、整理狀態、髮色的已解析完整來源物件，含 ID、英文與 metadata |
| `wardrobe` | 完整已解析穿搭與配件來源，不因主畫面腰上裁切丟棄鞋襪／下身 |
| `wardrobeColors` | 配色來源及上下身等巢狀資料 |
| `selection` | 單人人物與穿搭的已解析選項；不帶入休眠雙人欄位 |
| `rawSelection` | 對應一般模式原選項，包含隨機及全無 |
| `fullBodyPrompt` | 原始全身角色照的完整文字 |

一般預覽的完整來源以 runtime WeakMap 關聯至其 structured object，不改寫普通 Prompt 物件或加入新的普通模式輸出欄位；進入抓拍才將候選快照放入 profile。匯入／正規化時深拷貝並驗證必要欄位，不共用可變物件。

抓拍四主輸出與胸上輸出共用匯入人物、穿搭及同一抓拍狀態。場景、動作、察覺、觀察位置、鏡頭、光線與質感仍由抓拍規則接管；不匯入原拍攝姿勢或背景。主 GPT／胸上 GPT 依既有規格省略獨立 Body Type，其他對應輸出保留原契約。

全身角色照沿用匯入前的完整 reference 文字，維持單人、9:16、自然站姿及完整穿搭；不改為抓拍姿勢。參考圖人物與穿搭的臨時預覽功能仍走自己的既有投影，不改寫保存資料。

Saved Cards JSON、Markdown 的選項 metadata 及瀏覽器重載保存完整 profile。收藏還原保留休眠一般 A／C 的隨機空值，不把它們改成全無；六輸出可還原一致。只複製公開 Prompt 純文字仍不足以還原完整 profile。既有來源 ID、storage keys、角色卡 identityAndBody、歷史輸出與 public field mapping 不變；public output contract 仍為 1.62.0。

## 程式位置

- 快照建立／驗證／匯入：`webapp/src/lib/observationCaptureImport.js`。
- 抓拍資格、有效選項與引擎：`observationCaptureMode.js`、`engine.js`。
- 進入抓拍時保存候選：`webapp/src/features/page1/usePromptWorkspace.js`。
- 介面與摘要：`ObservationCapturePanel.jsx`、`observationCapturePanel.css`、`Page1Workspace.jsx`、`page1WorkspaceSummary.js`。
- 收藏相容：`webapp/src/features/saved-cards/cardCodec.js`。
- 回歸測試：`webapp/src/lib/observationCaptureImport.test.js`，納入 `test:prompt-quality`。

## 驗證紀錄

- 新增 9 項測試：來源與深拷貝、12 次重抽、六輸出 JSON／Markdown／重載、明確重新匯入、無來源／非法來源拒絕、六項身份來源、腰上／近景的完整衣服、8 場景 × 3 支援景別的六輸出契約、休眠角色卡及雙人欄位隔離。
- Node 22 前端完整測試 1711/1711、Prompt Quality 755/755；lint、build 通過。保留既有 Vite 500 kB chunk 提示。
- 同 seed `200 prompt-quality-baseline --strict` 修改前後一致：0 blockers、22 項既有 diagnostics。
- 前一輪完整測試曾碰到既有服裝重複詞的隨機失敗；以修改前 HEAD 與目前版本跑 100 個相同 seed，六輸出雜湊完全相同，seed `dedup-baseline-33` 兩邊均重現，未擴修。Node 25／24 的預設 reporter 與既有 runner 測試不相容；最終依專案 Node 22 執行通過。
- 隔離 Chromium 在 1440×1000、390×900 與 639／641px 檢查匯入摘要、重抽、角色卡切換、回一般模式、重新匯入、重載、收藏回填。確認人物快照和六輸出保持；現行五工作區（Prompt 工作台、角色建模、場景建模、DLL_PIC Pro、Saved Cards）無橫向溢位、破圖或 console／page errors。
- 另驗證缺少來源時重新匯入／收藏停用、回一般模式後以鍵盤 Enter 重新匯入恢復；日常穿搭樣本確認摘要包含上衣、褲裝與鞋款，無全無項。
- 使用者已確認本機驗收通過。未呼叫付費圖像生成，外部模型出圖未驗證。隔離測試未改使用者瀏覽器資料、收藏、登入或原有未追蹤文件。
- 本機入口：`http://127.0.0.1:5175/Virtual_Photography_Studio/`。
- 測試 log 與瀏覽器機器紀錄：`/tmp/vps-capture-import-*-final.log`、`/tmp/vps-capture-browser-results.json`、`/tmp/vps-capture-empty-results.json`；原始基線 `/tmp/vps-capture-import-before.log`。
- 最終截圖目錄：`/Users/cooperfu/.codex/visualizations/2026/10/24/01a16cd9-607a-7452-a052-f90ae6cf11b9/`，含 `capture-import-desktop.png`、`capture-import-summary.png`、`capture-import-mobile.png`、`capture-import-empty.png`。五工作區畫面另存 `/tmp/vps-capture-workspace-{1440,390}-{0..4}.png` 及 `/tmp/vps-capture-viewport-{1440,390}-{0..4}.png`，已逐張檢視桌面／手機主要畫面與匯入面板。
