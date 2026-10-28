# Saved Cards 下載失敗修復決策

- 授權：Cooper 要求修復 Download，讓現有 131 筆收藏正常下載。本機驗收完成後，Cooper 已明確授權本批 commit／push 並確認 CI 與部署。
- 現場證據：Chrome UI 131 筆，下載 promise 因 PAGE1 snapshot `unknown ID: locationId` reject。沒有讀取 React 內部狀態，也沒有刷新原分頁。
- 決定：合法仰躺 none 遵守引擎既有政策；不相容原始資料仍可匯出為明確備份。嚴格匯入驗證保持，不能為了下載而猜測／刪除舊 ID。
- 全正常匯出維持原格式；混合 ZIP 增加原始 JSON 備份，並保留每筆 Markdown。僅備份型卡片明確標示不可直接匯入。
- 本機容量裁切與下載錯誤是兩件事。本次不擴充容量或遷移儲存，也不把 122 視為固定筆數上限。
- 歷史驗收最初因新程式 hash 不等於舊封存來源而失敗；補本批精確 inverse，從最新 B3 回放邊界銜接，舊基準不重錄。Phase 4 工具保持原檔。
- 規格：[下載容錯 v1](../specs/saved-cards-download-resilience-v1.md)。本機與線上／真實收藏備份分開驗收。
