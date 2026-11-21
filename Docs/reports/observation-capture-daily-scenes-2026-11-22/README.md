# 觀察式抓拍生活場景擴充：本機驗證

基準：`abaf1569936bb82911fd060abc9074e0fe5a5579`，原專案 `main` 工作目錄。
範圍：[十二場景規格](../../specs/observation-capture-daily-scenes-v1.md)。本報告記錄本機驗證階段，當時不 commit／push／部署、不付費出圖。後續使用者已確認本機驗收通過，授權限定提交並推送本批。沿用既有 5175 本機服務。

## 內容與保護邊界

新增 12 場景、33 動作、5 光線、2 前景。20 個場景／42 個動作仍使用原抓拍介面。一般 D catalog、舊八場景來源、退役獨立產生器、角色卡與完整人物快照不變。場景／動作配對表與胸上投影均有專項回歸。

開始前記錄的 115 個既有未提交／未追蹤檔案以 SHA-256 檢查，最終再次確認全部一致。兩份既有 dirty 文件 `Docs/current_project_state.md`、`Docs/session_onboarding.md` 未編輯；本批說明另外新增。

## 自動驗證

使用 Node 22.22.3。

| 檢查 | 結果 |
| --- | --- |
| 抓拍模式／人物匯入／舊獨立產生器 | 38/38 通過（包含 Grok Imagine 的 33 × 3 景別檢查與歷史 inverse） |
| 歷史回放、catalog alignment、C7、姿態第二批與抓拍模式 | 35/35 通過 |
| 姿態第三批同 seed 保護、舊六輸出 hash、完整 inverse | 3/3 通過 |
| 完整前端 | 2452/2452 通過 |
| Prompt Quality | 993/993 通過 |
| ESLint | 通過 |
| Production build | 通過；保留 Vite 既有大於 500 kB chunk 提示 |
| strict audit，200 筆，seed `prompt-quality-baseline` | 修改前後完整輸出一致：0 blocking、24 既有 diagnostics |
| diff-check | 通過 |

新場景白名單逐一檢查允許及停用項，每場景 30 seed 與重抽；所有選項可達。33 個新增動作 × 全身／膝上／腰上共 99 案，驗證匯入人物、穿搭、胸上投影、全身 reference、六個既有輸出契約及 Grok Imagine 動作保留／JSON／Markdown 還原。另保存修改前八個已解析抓拍組合與兩個一般拍攝案例的 60 個輸出 hash。

初輪完整測試的 4 個失敗都來自歷史抓拍隨機池：C7、catalog alignment、姿態第二批及第三批。新增精確 inverse 後，回放副本使用舊抓拍解析器；第三批姿態 fixture 使用其原 seed 27 已解析八欄輸入。舊 baseline／seal 沒有重錄或放寬。後續完整前端與 Prompt Quality 均全部通過。最後補上測試中 `Buffer` 的明確 Node import，重跑 ESLint 與抓拍 38 項通過；未改執行行為。

原始 log 與可執行瀏覽器腳本位於 `/private/tmp/vps-capture-expansion/`：`full-final.log`、`quality.log`、`focused-final.log`、`history-focused.log`、`history-final.log`、`lint-final.log`、`build.log`、`audit-before.log`、`audit-after.log`、`browser.mjs`、`zip-import.mjs`。

## 桌面與手機

隔離 Chrome，1440×1000／390×900；沒有使用使用者瀏覽器資料、收藏或登入。

- 兩個尺寸各操作全部 12 新場景及代表新動作，核對 20 場景／42 動作選單、停用動作／光線／察覺原因、固定／重抽與人物摘要穩定。
- 重新整理、加入測試收藏、ZIP 下載及解析、收藏套用回填、全部固定停用重抽。
- 另用全新隔離 context 實際選取 ZIP 匯入，確認完整抓拍 profile／人物快照還原；Enter 鍵切換固定與隨機。
- 載入無效固定組合（Diner＋放入洗衣機）保留原值、顯示錯誤並暫停產生；解除固定後恢復合法組合。
- 六工作區導覽與桌手機截圖檢查：Prompt、角色、場景、DLL_PIC、DLL_VIDEO、Saved Cards。
- 無 console error／page error、文件橫向溢位。測試期間沒有外部 POST 或付費生成。
- 介面布局未改，未重做視覺設計；保留原多欄／手機單欄、長頁面捲動、摘要與錯誤提示。

[桌面面板](desktop.png)／[手機面板](mobile.png)。機器紀錄：[瀏覽器結果](browser-results.json)、[全新環境 ZIP 匯入](zip-ui-results.json)。全部工作區與衝突截圖保留在上述 `/private/tmp/` 證據目錄。

## 本機驗收

開啟 `http://127.0.0.1:5175/Virtual_Photography_Studio/`，進入「觀察式抓拍」。若原有固定項不相容，可先「全部設為隨機」，再選新場景及動作；新選項會沿原操作方式固定。可分別確認洗衣、閱讀、車廂坐姿及緣側等不同活動。

文字與瀏覽器驗證不代表外部圖像模型對手部、道具、坐姿或空間關係的實際出圖效果已通過；使用者已確認本批本機驗收通過，未進行外部付費生成。

## 本批檔案

- `webapp/src/data/observationCaptureExpansion.js`：新場景、動作、光線、前景及配對清單。
- `webapp/src/lib/observationCaptureMode.js`：整合選單、相容判斷與胸上／腰上投影。
- `webapp/src/lib/observationCaptureMode.test.js`、`observationCaptureExpansion.baseline.json`：專項回歸與修改前輸出證據。
- `scripts/lib/observationCaptureExpansionHistory.json`、`gestureExpressionGazeHistoricalReplay.mjs`：只供歷史測試使用的精確回放。
- `webapp/src/lib/engine/specifiedActionUpperBodyStateBatch3Fixtures.js`：固定舊證據原已解析抓拍輸入，不重錄封存結果。
- `Docs/specs/observation-capture-daily-scenes-v1.md`、本報告與瀏覽器紀錄／截圖。

本機驗證結束時 Git HEAD 為基準 `abaf1569`，index 為空，尚未 stage、commit 或 push。使用者隨後確認本機驗收通過並授權限定提交／推送；外部模型畫面品質不屬於本輪驗證結論。
