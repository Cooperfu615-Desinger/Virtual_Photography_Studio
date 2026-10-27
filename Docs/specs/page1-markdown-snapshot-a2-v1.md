# A2 PAGE1 Markdown 完整選值快照 v1

狀態：2026-10-27，Cooper 已確認完整驗收通過並授權限定提交／推送；實際 Git 與該提交 CI 結果另行核對。

基準：`943ab65fa153fbc5050ee2c9690e429c326296f2`。本批只處理 PAGE1 卡片的 Markdown 保存與還原、兩條匯出路徑共用編碼、衍生輸出及格式驗證。特殊穿搭、runtime 配色句、其他 Phase 4、P5b 排除。生成引擎、正式 catalog、JSON 儲存版本及公開 Prompt 不改。

## 保存契約

單張與 ZIP 在原有可讀 Markdown 前加入相同的版本化 PAGE1 快照。快照保存卡片經既有規則正規化的完整 selection 與原四主／衍生輸出（含 ID、標籤、前後空白）；不是目前編輯器尚未保存的設定。兩個匯出器維持原本公開段落與排序，共用快照編碼。其他來源與缺 selection 的歷史卡片維持原格式。

合法 v1 快照優先還原，不要求公開文字可解析，也不使用 buildRestoreLocks 把隨機空值轉成全無。structured 沿用既有依 ID 重建規則；套用時仍走既有產品正規化。原文只在使用者重新生成後才改變。既有已移除的衍生輸出若在歷史卡片中仍存在，只保存／還原，不重新加入生成器。

沒有新快照的 Markdown 沿用既有文字、Optional Silence、Observation Capture 相容路徑；新快照無法補回舊檔原已遺失的選值。新快照必須驗證版本、來源、完整欄位、型別、ID、巢狀資料與可讀輸出的一致性；損壞、重複或不支援格式明確拒絕，不退回猜測。新版快照與舊 metadata 同時存在時必須一致。

## 驗收

先建立失敗回歸。新檔逐欄等於卡片的 sanitizeStoredPrompt 正規化 selection，套用結果與 JSON 一致；既有 compact JSON 會省略空值並於讀回補預設，因此不要求其休眠空值與新快照逐字相同，也不修改 JSON 格式。單人／雙人、全無、隱藏衣物、9 完整造型與 42 上下身配色、固定構圖、角色卡、世界場景文字、抓拍完整快照都覆蓋。主／衍生原文逐字保持，測 CRLF、中文、HTML comment 字元與錯誤資料。舊 40 無色案例不重現假紅／假白，既有 JSON、貼上文字與舊檔保持。

以固定 Git 比較生成六輸出、structured、selection 與 RNG，要求零差異。新精確 inverse 只在隔離副本恢復本批，再接前批 A2／A1／A5 與 E 回放；原 A～E、所有前批基準與 hash 不重錄。

執行聚焦／前端完整測試、Prompt Quality、lint／build、同 seed 200 strict audit、catalog sync／ID／Python／工具檢查。5175 桌面 1440×1000、手機 390×900 操作單張下載、ZIP 匯入、原文複製、套用／重新生成／收藏／重載、抓拍與六工作區；不呼叫付費服務。不新增獨立 Markdown 上傳介面，不修改其他卡片來源格式。

## v1 格式與拒絕規則

檔案第一行為 `<!-- VPStudio PAGE1 Snapshot: {JSON} -->`。JSON 欄位固定為 `version: 1`、`source: "page1"`、`selection`、`outputs`、`promptLabels`。`outputs` 包含 grokPrompt／midjourneyPrompt／zImagePrompt、可選 nanoBananaPrompt 與 extraPrompts（id、label、text）；metadata 的 `<`／`>` 使用 JSON Unicode escape，公開正文保持。新格式是 Markdown 的獨立版本，不調整 Favorites storage v3。

- selection 必須有目前完整欄位及正確型別；已知 control legacyIds 由既有 normalizeLocks 遷移，未知 ID 拒絕。抓拍八組 ID、巢狀 profile 與休眠場景快照另驗證。正式資料未新增／刪除 ID。
- 不接受額外根欄位、重複 JSON key、危險物件 key、重複 metadata、衍生 ID 重複、標籤換行、錯誤／不支援版本、截斷資料。JSON 長度上限為 8 × 1024 × 1024 UTF-16 code units，巢狀深度上限 64。
- 可讀輸出可沿用單張或 ZIP 原順序；還原原文保存 metadata 的精確字串，正文比較只容許 CRLF／LF 換行轉換。既有自訂顯示標籤與 Nano 空白條件沿用；標頭解析不讀 metadata 或 Prompt 內的偽標頭。
- 新舊 metadata 同時存在時，Observation Capture 正規化結果與新 selection、Optional Silence 明確欄位必須一致。舊 metadata 損壞或衝突不得覆蓋新 selection。
- 新 selection 優先於可見文字，不要求可見文字能反推衣物或原 ID；不允許重新生成原公開字串。匯入卡片 ID／日期／lineage 與 ZIP 來源追溯仍沿用既有匯入流程。

## 工具

使用 Node 22 與既有依賴，在根目錄執行：

```sh
node --test webapp/src/features/saved-cards/page1MarkdownSnapshot*.test.js
node scripts/page1_markdown_snapshot_a2_acceptance.mjs /tmp/a2-markdown-acceptance
node scripts/page1_markdown_snapshot_a2_history.mjs /tmp/a2-markdown-history
node scripts/page1_markdown_snapshot_a2_browser.mjs /tmp/a2-markdown-browser
```

瀏覽器工具使用正確工作目錄的 5175；必要時以 PLAYWRIGHT_MODULE 指向已安裝的 Playwright。目錄檢查的 REGISTRY_BASE_COMMIT 使用本批完整 Git 基準。報告只能寫本批新路徑，不覆蓋歷史。詳細結果見[本批驗收報告](../reports/page1-markdown-snapshot-a2-2026-10-27/README.md)。
