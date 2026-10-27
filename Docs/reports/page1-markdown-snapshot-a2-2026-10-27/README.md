# A2 PAGE1 Markdown 完整選值快照驗收

日期：2026-10-27。狀態：Cooper 已確認完整驗收通過並授權限定提交／push；本報告保留提交前的驗收證據。

可信 Git 基準：`943ab65fa153fbc5050ee2c9690e429c326296f2`；工作目錄為 main 的 moss-optional-lora checkout。原專案路徑及其他工作目錄的既有修改不動。正式目錄與所有生成引擎、renderer、資料 ID 不改；特殊穿搭／runtime 配色句、其他 Phase 4 與 P5b 排除。

## 產品結果

- PAGE1 單張與 ZIP 匯出共用版本化快照編碼，原可讀正文與排序逐字保持。
- 新檔先驗證快照再還原，保存完整正規化 selection、四主輸出及已有衍生輸出的 ID／標籤／原文。前後空白、CRLF、中文與 comment 字元有回歸；不重建原 Prompt。
- 選值不再依可見衣物／顏色推測：白黑上下身方案、休眠 A/B 欄位、原 MJ PAGE1 比例、裁切未顯示衣物、抓拍完整人物來源都可保存。
- 新 metadata 版本／來源／欄位／型別／ID／巢狀資料／大小深度／重複欄位／衍生 ID 與可讀正文的一致性均檢查；非法資料不退回猜測。ZIP 任一檔失敗不加入部分卡片。
- 無快照的舊檔沿用既有文字、Optional Silence、抓拍 metadata 路徑；JSON v3 與貼上文字解析保持。非 PAGE1、缺少 selection 的卡片維持舊格式；沒有增加 .md 上傳入口。

規格：[v1](../../specs/page1-markdown-snapshot-a2-v1.md)。決策：[本批決策](../../decisions/2026-10-27-a2-page1-markdown-snapshot.md)。

## 固定 Git 驗收

`acceptance/acceptance.json` 與 `acceptance/baseline-and-results.json.gz` 保存輸入、seed 名稱、RNG 次數、原始生成結果、舊匯入及新快照結果。只排除生成 id/date。

| 驗證 | 結果 |
| --- | --- |
| 固定 Git 生成：六輸出／structured／selection／RNG | 550 組，0 差異 |
| 新單張／ZIP 選值與衍生輸出往返 | 1,100 次通過 |
| 原可讀 Markdown 正文 | 1,100 次與修改前完全相同 |
| 舊 Markdown | 590 份，0 非預期差異 |
| 舊 JSON | 40 份保持 |
| 貼上原 GPT 解析 | 550 組保持 |
| 抓拍舊／新人物快照 | 80 組納入上述矩陣 |

全 90 特殊穿搭、整合套裝／連身、40 套裝三種代表色票、全部 9 完整造型色系與 42 上下身方案、雙人、各景別、33 角色卡、14 固定構圖與世界場景文字均納入相關生成／快照矩陣。這些案例驗證保存與生成不變，不授權改其來源內容。

完整 selection 以 sanitizeStoredPrompt 的卡片正規化結果為準。既有 compact JSON 省略部分空值，讀回後會補預設；本批保留空值，另驗證兩條路徑套用後一致，不宣稱 JSON 原始序列化逐字相同。

## 完整 gate

Node 22.23.3，既有依賴，未安裝／升級套件。

| Gate | 結果 |
| --- | --- |
| 聚焦快照／歷史 inverse／舊 parser／ZIP／抓拍 | 92／92 |
| 前端 npm test | 1,924／1,924 |
| Prompt Quality | 818／818 |
| lint、build | 通過；保留既有 Vite 500 kB chunk 提示 |
| 200 prompt-quality-baseline strict audit | 前後 log 逐字一致；0 blocker、18 既有診斷 |
| catalog sync／歷史 ID | 1,050／1,050，8 生成物保持 |
| Python | 43／43 |
| 目錄驗證工具 | 32／32 |
| strict integrity／public assets | 通過 |
| git diff --check | 通過 |

`logs/` 保存最終結果；`diagnostics/` 保存初次診斷，不冒充通過紀錄。提交封裝時，四份含工具行尾空白的原始 log 以 `.log.gz` 無損保存，解壓後 SHA-256 與驗收原檔一致；對應記錄見 `delivery-source-and-tools.json`。初次五個失敗是舊測試要求「僅推測主輸出／場景／比例」或刻意替換標頭；改為明確移除新 metadata，原斷言保持，新格式另測。抓拍原有空字串保留、格式護欄也在聚焦與最終 gates 覆蓋。目錄工具首次未傳可信基準遭拒絕，補上固定 REGISTRY_BASE_COMMIT 後全數通過。

## 歷史回放

`history/` 及 `logs/history.log` 已完成隔離回放，全部無核准外差異：

| 歷史批次 | 回放結果 |
| --- | --- |
| A2 舊文字配色還原 | 338 生成、378 文字匯入、40 JSON、80 抓拍 |
| A2 40 套裝 | 8,611 案，oracleMismatches 0 |
| A2 24 連身 | 3,545 案，oracleMismatches 0 |
| A1 成年身份 | 1,273 案，differencesOutsideAllowance 0 |
| A5 收尾／CRT／commercial／最初三筆 | 3,834／3,834／3,804／1,740 案，oracleMismatches 全為 0 |

歷史結果保留當時核准的變動（例如 CRT 的隨機池修正），不能誤稱當年生成零差異。新 inverse 的 6 項測試已通過：精確回復、重複執行、未知來源、混合版本、缺檔、helper 變動及禁止正式工作目錄。所有輸入先核對，才開始寫隔離副本。E 的 1,098 例原 expectedHash 由前置還原後的舊 codec 驗證，原 seal 不變。

## 瀏覽器證據

URL：`http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1`。沿用已核對的既有服務；獨立 Chromium 儲存，不修改使用者登入／收藏。

桌面 1440×1000、手機 390×900：34 項操作、20 張原始畫面，另有 4 張檢視用聯絡圖。

- 實際 ZIP 下載與每筆完整選值／衍生輸出還原；單人、雙人、抓拍各自單張下載，使用既有 ZIP 入口重新匯入。
- 原 GPT、胸上及全身文字逐字複製；套用選值，生成／抓拍重抽，收藏、重載後匯入原文保持。
- 一份合法檔加一份非法快照的 ZIP 整批拒絕，收藏完全不變。
- Prompt 工作台、角色建模、場景建模、DLL_PIC Pro、DLL_VIDEO Pro、Saved Cards 六工作區巡覽。
- 0 console/page error、0 外部 POST、0 破圖／非預期水平溢位。人工檢視見 `browser/visual-review.json`，機器紀錄見 `browser/results.json`。

初次 browser fixture 用 raw 卡片與已壓縮 localStorage 直接比較，造成休眠空值差異；調整為實際 compact JSON 建立 fixture。抓拍按鈕使用現行「重抽隨機項目」，而非一般模式「隨機生成」。這兩項修正均在驗收工具，沒有修改產品 UI。

## 保護及限制

修改前清點 `protection-before.json`，最後依 `scripts/page1_markdown_snapshot_a2_protection.py` 重跑。已確認 2,409 原追蹤檔只有 allowlist 變更、1,038 歷史報告／基準不變，其他 20 工作目錄的 140 份既有未提交檔及 Git 狀態保持。最終結果見 `final-protection.json`。

完整快照不能補回舊檔早已遺失的選值；只含公開文字的貼上流程仍是保守推測。structured 依目前 ID 重建，原公開輸出與抓拍內嵌來源保存舊文字。metadata 重複保存輸出使 Markdown 較大；這是保留精確字串與驗證正文一致性的取捨。公開 Prompt、renderer、特殊穿搭與 runtime 配色未修改。

Cooper 已授權本批限定 Git 交付。實際 commit、push 與該提交 CI 結果另行核對；此處的驗收紀錄、原 source-and-tools.json 與保護快照保留交付前狀態。僅交付狀態文字更新記錄於 delivery-source-and-tools.json；未進行外部模型出圖品質驗收。
