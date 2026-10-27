# A2 第一批：連身控制語決策

日期：2026-10-26。範圍由 Cooper 核准；本機驗收完成後回報，不 commit／push。

- 只處理連身分類的 24 筆非全無來源；40 筆套裝、1 筆特殊穿搭及 runtime 配色句另批。正式來源 main 基準 `4e35912f82280c058d0c86b6de3f44fcb019f9df`。
- 刪除 24 句連身色票控制語，以及一字領哥德迷你洋裝的對比色控制語。哥德來源仍有 ruffle trim，不發明黑色飾邊或新的對比色能力；衣物、材質、領口、拉鏈與輪廓全部保留。
- 不新增 metadata.color、不改 renderer。連身既有獨立 dressColorId 與投影路徑已能處理所選色票。既有外套遮擋、完整造型及上下配色規則維持。
- 前版完整 en 追加到既有 legacyPromptAliases 尾端。ID、legacyIds、有序別名、semantic、中文、desc、圖片及顯示／隨機順序均保持。
- 收藏儲存的原文字與已匯入全身快照不清洗。收藏解析依既有行為用 ID 取得目前 structured 資料，因此「原輸出保留」和「結構化來源更新」分開驗證；重新生成及明確重新匯入使用新來源。
- A1／四批 A5／A～E 的原始證據不重錄。具名歷史測試只在隔離副本精確逆轉這 24 筆資料；現行行為另用固定 Git 加核准資料差異的 oracle 驗證，錯誤 metadata／aliases／混合狀態不得被逆轉吞掉。
- 與「APIKEY分析」影片分頁分工：本批不改導覽、UI、影片服務或套件依賴；共用文件與 5175 驗收服務需檢查重疊。已讀取該 session 最近紀錄為示意圖階段，不能視為後續永久凍結授權。

[規格](../specs/wardrobe-control-a2-dresses-v1.md) · [驗收與交付狀態](../reports/wardrobe-control-a2-dresses-2026-10-26/README.md)

## 2026-10-27 交付對齊補記

使用者已授權在確認影片提交後限定交付本批。原始 oracle 與 2026-10-26 證據保持；整合保護基準採 `e9983769e326ead175b381834c6e2df4fd02e28d`。A1／A5 歷史回放僅於隔離副本將六個已審查影片前端檔精確還原至原 baseline，要求全檔 before／after 一致，額外修改／缺檔／混合版本拒絕。正式影片功能仍驗收最新版本。

新增 DLL_VIDEO Pro 桌手機往返及全六工作區檢查。原五工作區工具保持，在乾淨副本服務執行；既有服務的熱更新 runtime 與固定網址驗收 import 不一致列為工具環境診斷。完整結果見 [最新整合驗收](../reports/wardrobe-control-a2-dresses-2026-10-26/integration-2026-10-27/README.md)。此補記不改本批 24 筆資料範圍，也不開始後批或 P5b。
