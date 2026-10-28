# Saved Cards 下載修復驗收

2026-10-29；基準 main `ad70d816598b2d8dfe5f853c5c53a3ee0bf73bf3`。本機驗收通過，未 stage／commit／push；尚未聲稱真實收藏已下載或線上已修復。

## 結果

- 首先以 131 筆、其中一筆含未知 locationId 的固定案例重現 `Invalid PAGE1 Markdown snapshot: unknown ID: locationId`。
- 前端完整 2,020/2,020；之後新增純測試的 inverse 防護 2/2 單獨通過。聚焦匯出／快照 39/39；Prompt Quality 853/853。
- lint、build、正式打包 catalog 初始化通過。build 僅既有大 chunk 提示。固定 seed `prompt-quality-baseline` 200 筆 strict，0 blocker，17 筆有非阻擋診斷；生成器與 catalog 未變更。
- 正式 preview：`http://127.0.0.1:5175/Virtual_Photography_Studio/`。1440×1000／390×900，實際 ZIP 下載各 131 份 Markdown，完整 JSON 備份 131 筆，逐筆 ID／GPT 原文及未知地點 ID 保持；單元測試另逐欄核對完整原始物件。單張備份下載、loading 停用、success、桌手機失敗提示、空清單停用通過。
- 下載正常流程無 console／page error、無水平溢位。錯誤情境刻意阻斷下載模組網路請求，瀏覽器預期記錄該網路失敗，但無未捕捉 page error，按鈕恢復可用。
- 六工作區桌手機 12 項正式版 smoke 通過，無 console／page error；見 workspace-smoke.json。最終下載畫面已檢視，控制列及卡片在桌手機寬度可用。
- 歷史回放接點只為本批 source 差異建立精確 inverse；原 A～E、A2 及既有封存內容未改。首次完整測試的 hash 拒絕已由此解決，沒有調低舊驗收門檻。

## 證據與重跑

`frontend.log.gz`、`quality.log.gz` 為完整輸出；`focused.log`、`lint.log`、`build.log`、`audit.log`；瀏覽器 `results.json`、`workspace-smoke.json` 與 `1440.png`／`390.png`。資料全部為合成測試收藏，未複製私人 Prompt。

重跑命令與格式見 [規格](../../specs/saved-cards-download-resilience-v1.md)。歷史測試為 `node --test webapp/src/features/saved-cards/savedCardsDownloadHistory.test.js`。原始碼只改本批匯出、快照／備份驗證、下載狀態及必要驗收接點；未改資料庫、產生器、容量或雲端。

## 尚待線上交付

Cooper 已授權 commit／push；上述未提交為驗收時點紀錄。交付時確認對應 CI／部署，再驗證使用者實際 131 筆。原 Chrome 分頁保持不刷新；先開新分頁核對是否具有全部 131 筆，再下載、解包確認。新分頁若只有裁切後筆數，不能宣稱完成備份，也不得刷新原分頁。未知設定備份可讀且保留原始 JSON，目前不承諾直接匯入。
