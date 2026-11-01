# Saved Cards ZIP Unicode 原文保護驗收

2026-11-01；基準 main 70129ef836d46a7cadd1be3d511c5476c2ecd909。僅使用 synthetic-only 來源，不讀寫私人收藏、不連結真實帳號、不付費生成。

## 本批與歷史回放

- ZIP 的 Markdown、manifest、backup-only JSON 在交給 JSZip 前先完整 UTF-8 編碼；不更改備份結構、過濾、匯入或收藏來源。
- 固定 131 筆合成資料逐項比較所有 Markdown 和 backup payload；長文字、emoji、長 source ID 對分段邊界做獨立回歸。Python 標準 ZIP 解碼後 JSON 的 2,711,991 bytes 與原 UTF-8 位元組一致。
- 既有下載歷史回放以來源 hash 精確反轉此批變更，未知來源拒絕且不修改其他檔案；原下載回放及額外負例通過。
- A 的舊程式透過 `node scripts/replay_saved_cards_unicode_a.mjs` 在隔離副本回放，封存 CLI 一致、19／19 通過；舊缺口在舊版本仍可重現。A 原基準與報告不重錄。

## 瀏覽器驗收

隔離 Chrome 的 1440×1000、390×900，六工作區導覽與頁面溢出檢查通過；各自以 131 筆合成收藏按 Saved Cards Download，ZIP 的 manifest 及各卡 Markdown 原文檢查通過。由於現行畫面載入投影不觸發 backup-only，另外在同一隔離瀏覽器呼叫實際 ZIP 產生模組，對 131 筆合成 backup-only 完整 payload 比對通過。沒有使用私人 Chrome profile。

桌機載入過程有一筆 `/favicon.ico` 404；本批未修改 favicon 或 HTML，記為既有路徑限制，沒有將其忽略為零錯誤。手機本次無 console/page error。沒有真實收藏、真實雲端或原生瀏覽器下載視窗驗收。

## 自動驗收

- Unicode 聚焦 3／3、既有 ZIP／下載歷史回放及新增未知來源拒絕案例通過；原 A 歷史回放 19／19。
- Prompt Quality 853／853；同 seed/count 的 200 筆 strict 前後文字結果一致，0 blocking。既有 wardrobe/scene 診斷保持。
- lint 通過；build 使用隔離 /tmp 輸出目錄通過。預設 dist 先前因工作目錄權限無法清空，沒有覆寫既有 dist；大型 chunk 建議為既有 build 提示。
- Node 25 初次全套 2089／2091，兩項測試執行器期待 TAP 而實際為 spec 輸出；強制全域 TAP 會與歷史回放的子程序參數重複，已停止。使用專案驗收 Node 22 重跑結果見下方。

- Node 22.22.3 全套前端測試 2,093／2,093 通過。聚焦新測試與歷史回放負例亦已單獨重跑通過。

本批是 ZIP 原文保護，不等同 Saved Cards B、完整持久化、恢復包或 SC-P13／P14 整體驗收。舊資料與其他歷史基準保持；本機候選未 commit／push。
