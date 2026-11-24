# 第二階段：局部 Prompt 文案 CI 試點

日期：2026-11-24。實作基準：`782a4516dcb813c55e35c8e76f99d6a640a09122`。

本階段接續[純文件分流](ci-docs-only-v1.md)及[本機局部文案規則](local-prompt-copy-validation-v1.md)。使用者同意「只在歷史別名尾端追加修改前完整英文」的窄例外。新增 `copy` 路徑；不新增每日排程、不刪減任何原案例或斷言，不修改實際產品文案。首次交付包含 CI／測試邏輯，必須走完整路徑；本機驗收不等同遠端 CI／部署驗收。

## 1. 路徑與保守退回

| 路徑 | 條件 | 保留的門檻 |
| --- | --- | --- |
| `docs` | 既有文件白名單，且最新成功部署至候選版本沒有產品差異 | 文件格式／路徑／diff、分流測試、結果摘要；不建置部署 |
| `copy` | 受信任設定已存在，通過以下全部限定，且可追溯至已完整驗證的部署 | 全部 Python、catalog sync/history/schema/strict/E 工具、同 seed 前後對照、指定契約與還原測試、lint、build、bundle 初始化、Functions test/lint、部署及摘要 |
| `full` | 其他、未知、混合、缺歷史或部署證據、手動觸發 | 所有原完整門檻 |

`copy` 的必要檢查若失敗，工作失敗；不能以重分類、略過案例或重新錄製 seal 掩蓋。PR 仍不部署。既有 `cancel-in-progress: false`、`queue: max` 與部署前最新 main 檢查保留。

## 2. 第一個 profile 與文字限定

[設定](../../scripts/lib/ciPromptCopyPolicy.json)只登記 `straight-leg-jeans-v1`：

- 正式來源：`knowledge_base/catalog/Wardrobe/褲裝-pants.json`。
- 永久 ID：`wardrobe:褲裝-pants:直筒牛仔褲:1`。
- 只允許既有 `en`／`desc` 文字調整；英文第一個逗號分句 `straight-leg jeans` 及逗號分句數保持不變，保護主 MJ 名稱投影。
- ID、zh、legacyIds、順序、分類、所有其他 metadata、semantic、控制行為不變。新增／刪除單品、手部動作、其他衣物不在試點內。
- 英文改變時，`legacyPromptAliases` 保留原陣列且只追加完整舊英文一次；若原本已有該全文，不重複追加。不能刪除、修改、重排或增加其他 alias。中文說明單獨修改不追加英文。
- 必須記錄有效語意不變的審閱理由，核對所有 consumer。欄位不變及自動比較本身不是語意審核的替代品。
- 分類器使用基準 Git 物件內的 profile；本批修改 profile、驗證器、workflow、測試邏輯或其他非核准檔案，一律完整路徑。擴增試點須獨立審核。

## 3. 生成物與歷史證據

[分類器](../../scripts/ci_prompt_copy.py)讀取已提交 Git 物件，以正式 generator 重建來源投影。候選 database／Markdown 必須逐 byte 相符；其他六份生成物也確認沒有旁改。不能靠「檔名在白名單」放行手改生成檔。

[revision ledger](../../scripts/lib/promptCopyRevisions.json)只允許尾端追加記錄，初始為空。每筆包含既有 profile、修改前完整 Git SHA、語意審閱及正式來源／實際變動生成物的 before/after hash 與精確差異。每筆的 before bytes 必須等於 Git 基準；連續修改須接成完整鏈，不得改寫舊記錄。

[test-only inverse](../../scripts/lib/promptCopyHistoricalReplay.mjs)只在來源完全符合 after hash 時精確還原，並驗證還原內容等於 Git 基準。未知來源不會被概括正規化；原有歷史檢查仍會拒絕。C2 報告有對應的[獨立歷史投影](../../scripts/lib/prompt_copy_history.py)。本次對歷史測試增加的入口另外由 [infrastructure manifest](../../scripts/lib/ciPromptCopyInfrastructureHistory.json)保留原始測試來源，沒有重錄任何舊 seal。七個直接固定舊英文／hash 的測試入口在有 revision 時使用精確還原資料的隔離副本執行原斷言；沒有 revision 時仍直接執行原測試。其案例、斷言與既有 seed 均未刪減，新文案另由當前來源的前後探針驗證。

後續文案修改先依正式 catalog 流程同步，再產生待審的 ledger 文字：

```sh
python3 scripts/prepare_prompt_copy.py --base <完整修改前SHA> --semantic-review '<有效語意與consumer不變的具體理由>'
```

工具只輸出文字，不寫來源。檢查結果後才將內容存為 ledger；不可直接用 shell 重導向覆蓋輸入中的 ledger。現有 ledger 已有未提交內容時工具會拒絕，避免覆寫另一筆修訂。修改前 baseline 必須包含本階段已審核的基礎建設。

## 4. 針對性驗證

[入口](../../scripts/validate_prompt_copy.py)在兩份隔離的 Git snapshot，以同 fixture／seed 執行[探針](../../scripts/prompt_copy_probe.mjs)。只連結既有相依套件；不讀取工作區未提交產品內容，不修改使用者 index、分支或來源。

| 風險 | 必要對照 |
| --- | --- |
| 公開輸出漏字或錯誤投影 | GPT、Z、MJ、Nano、胸上、全身、Grok Imagine；後者從正式輸出 accessor 取得 |
| 裁切與配色 | 所有現行 framing，包括 legacy；無色、深藍、鏡面鉻銀 |
| 腰線與雙人責任 | 所有腰線，單人、雙人 A、雙人 B；相同 seed |
| 專屬模式接管 | 所有角色、特殊主體、特殊穿搭、套裝、固定場景，分別全身與胸上 |
| 非目標回歸 | 工裝長褲跨景別及全部既有 representative fixture；保留代表 seed |
| 還原及資料消費 | 舊／新完整英文、全部既有 ID，Saved Card serialize/deserialize，再產生；preview／copy 與 DLL source 相同 |
| 結構與隨機 | selection、restore locks、所有未核准 metadata／summary 欄位、RNG 次數及下一個 RNG 值；僅排除 runtime ID／時間戳 |

只允許目標有效來源的 `en`／`desc`、完整舊英文尾端 alias 及對應完整英文分句的已記錄差異。非目標案例逐值相同；任意無法對應的文字投影差異都阻擋。除前後比較外，仍執行 `enginePromptPipeline`、`bodyTypeCatalog`、`promptOutputContracts`、`framingWardrobeRetention`、`denimOveralls`、`page1PromptOutputs`、`promptAppendices`、`cardCodec` 八個完整測試檔，不使用名稱篩選略過原斷言。

實際產品文案任務仍依本機規格完成桌面／手機的選取、預覽、複製及適用下游驗收。本次 CI 基礎建設沒有 UI／產品文案變更，不以瀏覽器檢查取代 CI 邏輯測試。

## 5. 部署證據與完整基準

永遠先看最新 Pages deployment；pending／failed／來源不明不可退找較舊的成功部署來跳過產品工作。完整部署沿用原證據。局部部署另外要求成功的 scoped test、catalog、lint、Functions、build、deploy、scope 及結果摘要；不能將它標為完整測試成功。

局部部署需要找到成功完整 run 的祖先，重新檢查該完整基準至已部署版本的所有差異都符合已核准 copy／docs 範圍。最多搜尋 30 筆近期成功 main workflow；找不到、API 不可用或歷史不足就執行完整路徑。此限制會在長串局部修改後自然要求完整驗證，沒有改為定期排程。

新局部提交比較完整基準至候選版本的累積差異，防止前一筆未驗證產品修改被最後一筆小文案掩蓋。後續純文件提交只有在已成功部署的版本與當前產品內容等價時才跳過部署。

## 6. 進度、耗時及驗收界線

前後探針每 50 案顯示一次進度，最後列出比較案例數、變動／不變數與實際秒數；不再長時間只有一個無進度的測試步驟。Git 不變物件以 SHA 快取，避免同一來源重複啟動 Git 讀取。

對照手勢交付 run `45196140830`：完整 workflow 約 14 分 50 秒，前端測試約 10 分 47 秒。局部流程預估 4–6 分鐘屬規劃值，必須以推送後真實 runner 量測確認，不能將本機測試時間當作 GitHub 部署時間。本次測試結果另記錄在驗證報告；尚未授權 commit／push，遠端新路徑不宣稱已通過。
