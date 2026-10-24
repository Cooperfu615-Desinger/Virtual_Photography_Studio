# 目錄資料架構 A：對齊最新 main 驗收報告

2026-10-24。本輪由 Cooper 在原 A 驗收通過後單獨授權。**A 已對齊 main `2f56438804e751de4556060b293231966d6ea3b3`，本機驗證通過；未 stage、commit、push 或進入 B。**

## 整合與保留

- 原 A 基於 `0746b280cc9f5c00daec7dadc73329779ac658e9`。舊 manifest、核心與躺姿補充案例／輸出、三份目錄快照全部保持原位且逐位元組不變；[保留雜湊](preserved-baseline-hashes.json) 經整合前備份逐檔比較。
- 上游新功能提交 `d469a32`，整合提交 `9c1a58f`，PR #15 合併提交 `a70cf85`，以及姿勢舊資料去向文件 `2f56438` 已納入 main。沒有調整上游已核准的產品行為。
- 先備份全部 4 個 tracked 修改與 45 個未追蹤檔案，再快轉 main；僅重新套用本批修改。`engine.js` 測試專用匯出乾淨合併；現況文件的開頭新增段落保留兩邊內容。原專案 `codex/shirt-black-bottom` 工作目錄未修改。
- 相對最新 main，正式程式仍只有 A 原先核准的測試專用 catalog 匯出。資料格式、renderer、使用者存檔／storage key／ID 未新增修改。沒有建立 B schema、完整性 CI 或登記簿，也沒有執行資料遷移。

## 獨立的新基準

[新 revision manifest](../../../webapp/src/lib/engine/catalogBaseline/revisions/2f56438/manifest.json) 記錄新／舊完整 commit、上游已核准變更、source Git blobs、工具／fixtures 雜湊、執行環境、案例 ID 與有效輸出，並綁定舊產物 SHA-256。它不覆蓋舊基準。

錄製來源是最新 commit 的乾淨 Git archive，逐檔驗證所有 runtime/data Git blob，未包含 A 的測試匯出修改；原兩組案例先重播零差異，新案例及匯入 API 流程各錄製兩次確認一致才封存。候選工作樹再重播通過。[錄製證據](record.txt)

| 新增覆蓋 | 數量 | 保護內容 |
| --- | ---: | --- |
| 5 來源 × 8 抓拍場景 × 3 支援景別 | 120 | 隨機、明確身份／衣著／配色、全無、近景來源仍保留鞋褲、休眠雙人欄位 |
| 匯入流程 | 40 | 初次匯入、三次重抽、更新候選但不換人、明確重匯入、角色卡來回、JSON 重載 |
| 休眠角色卡 | 5 | 已選角色卡不覆蓋匯入人物 |
| 回一般拍攝 | 5 | 保留原始隨機／全無及一般模式輸出 |
| 收藏 payload | 10 | 每個來源各一份 JSON／Markdown，還原／再生成保持完整人物與全身 reference |

另比較 5 組來源生成、完整 import snapshot、replacement source、API 產出的 profile、RNG，並拒絕缺失／不合法來源、雙人來源與把抓拍本身當一般來源。不是只有重播事先填好的 importedPerson。

本輪新增 **170 個固定 Prompt 案例**；連同舊核心 2,540 案與躺姿補充 141 案，共 **2,851 個不同案例**。三套實際重播共 3,251 筆，因為同一 200 audit 樣本在兩份補充中重複；不可把重播筆數宣稱成不同案例數。來源流程與收藏 payload 另列，不灌入上述案例數。

## I1–I9 驗證

| 不變量 | 本輪結果與證據 |
| --- | --- |
| I1–I3：control／ID／alias／meta | 三份快照零差異；219 controls／4,771 options 保持；[focused tests](import-and-snapshot-tests.txt) 12/12 |
| I4：完整輸出 | 原核心 2,540、補充 341、新補充 370 筆零差異；六輸出／selection／summary／structured／下游文字皆比較 |
| I5：隨機與 audit | RNG 與固定 200 audit 一致；[before](audit-before.txt)／[after](audit-after.txt) 文字完全相同，0 blockers／18 diagnostics |
| I6：收藏／還原 | 新增 10 payload、來源 API 流程與歷史核心收藏全部通過；[新基準與防竄改測試](focused-tests.txt) 2/2 |
| I7：前端 | [完整測試](full-tests.txt) 1,821/1,821；[Prompt Quality](prompt-quality.txt) 754/754；[lint](lint.txt)、[build](build.txt) 通過 |
| I8：資料 | [sync --check](data-check.txt)、[Python](python-tests.txt) 2/2、[公開資產](assets.txt) 207 檔通過；B/C 才開始的 schema／registry 門檻仍不適用 |
| I9：瀏覽器 | [新匯入](browser-import-final/results.json) 22 項＋[舊流程](browser-regression/results.json) 22 項通過，無 console／page errors 或外部 POST |

本輪未修改知識庫 Markdown，因此只執行 sync `--check`，未重寫 database.json。完整測試使用 `NODE_OPTIONS=--test-reporter=tap npm test`（Node v25.8.2），沿用原 A 已核對的 reporter 設定，不修改測試 runner。建置保留既有超過 500 kB chunk 提示。

## 瀏覽器實際驗收

- URL：`http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1`，本輪由已整合的 main 啟動；1440×1000 與 390×900。
- 現行五工作區：Prompt 工作台、角色建模、場景建模、DLL_PIC Pro、Saved Cards。動作／抓拍在工作台內；沒有恢復歷史獨立動作頁。
- 匯入全身人物後三次重抽仍保持全部資料與摘要；切換角色卡後返回、更新候選不自行換人、按 Enter 明確重新匯入、重載、收藏回填及固定 Markdown ZIP 匯入均通過。六輸出與封存還原結果一致。無來源時重新匯入／收藏按鈕停用。
- 舊收藏保留退役 MJ 胸上文字；角色／場景套用 PAGE1、六輸出剪貼簿與 DLL 明確帶入／隔離草稿重載皆通過。桌手機各比較六輸出，共 12 次剪貼簿與 12 次 DLL 來源比對。
- 檢查無非預期橫向溢位、破圖、不可達控制或新錯誤。已檢視五工作區桌手機畫面及匯入、還原、缺來源的細部截圖；保留既有直向長頁與面板捲動。
- 16 張最終截圖位於 `browser-import-final/`（6）及 `browser-regression/`（10）。[桌面匯入](browser-import-final/1440-capture-import.png)、[手機匯入](browser-import-final/390-capture-import.png)、[手機還原](browser-import-final/390-markdown-restored.png)、[手機缺來源](browser-import-final/390-missing-source.png)。
- 使用全新隔離 browser context 與本機 DLL 模擬，外部 POST 為 0；未動使用者收藏、登入或正式服務。未驗證外部模型出圖，不代表生成品質或部署驗收。

## 重跑與交付範圍

在 repo root 執行舊 `catalog_baseline.mjs`／`catalog_coverage_baseline.mjs` 檢查與新 `node scripts/catalog_alignment_baseline.mjs check`。完整前端測試自動包含三組。錄製新 revision 必須先另行審查來源與理由；現有目錄存在即拒絕覆寫。

新增工具：`scripts/catalog_alignment_baseline.mjs`、`scripts/lib/catalogImportCorpus.mjs`、`scripts/catalog_import_browser.mjs`，以及 `webapp/src/lib/engine/catalogAlignment.test.js`。其餘本輪更新為 revision 產物、操作文件、規格／現況與本報告。原 A 已驗收成果仍留在同一未提交工作樹。完整機器摘要見 [validation.json](validation.json)。

本輪驗收工具開發期間修正了兩個測試工具問題：鞋名需使用實際大小寫 `ADIZERO`，以及 Markdown 還原六輸出須比較 regenerated 結果而非 decoded 欄位。這些修正沒有改正式程式；最終封存／完整驗證與瀏覽器結果均為修正後版本。

## 後續驗收與交付授權（2026-10-24）

Cooper 已確認本輪 A 對齊驗收通過，明確授權僅提交並推送 A 文件、舊／新基準及驗收工具；前文未提交狀態與 validation.json 保留為驗收當時的證據。交付包含原 A 的測試專用引擎匯出與比較器修正，不含 B。完整檔案清單見 [delivery-allowlist.json](delivery-allowlist.json)；Git 與遠端結果在交付回報中另列，不把尚未完成的推送或 CI 寫成已完成。

提交前另驗證 7 項基準／CLI／防竄改測試通過，舊／新 manifest 封印正常。暫存區完整 whitespace 檢查只指出 5 份原始工具 log 中的行尾空白／末尾空行（兩份 build、兩份 lint 與舊 Node25 runner log）；為保留原始驗證證據，這些 log 不做重排或清洗。排除這 5 份原始 log 後，所有暫存來源、文件與其他文字檔 whitespace 檢查通過；此差異不涉及 Prompt 基準或程式行為。
