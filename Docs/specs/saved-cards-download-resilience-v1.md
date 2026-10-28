# Saved Cards 下載容錯 v1

2026-10-29。本機驗收通過；Cooper 已授權限定提交／推送並確認 CI 與部署。基準 main `ad70d816598b2d8dfe5f853c5c53a3ee0bf73bf3`。

## 問題與範圍

Chrome 現場顯示 131 筆，Download 無反應，console 為 `Invalid PAGE1 Markdown snapshot: unknown ID: locationId`。ZIP 逐卡呼叫嚴格快照編碼，一張失敗就中斷全部，事件處理器未呈現錯誤。不能僅由錯誤訊息判定實際 ID；本批不擷取或變更私人收藏。

另由原始碼確認仰躺場景政策會產生合法的 `locationId: none`，此 sentinel 不在場景選單，亦會遭快照驗證拒絕。僅當既有 `isSupinePoseSelection` 成立且欄位屬 `SUPINE_SCENE_NONE_LOCKS` 才接受該 none 值，不廣泛放寬任意 ID。

本批修改單張 Markdown、ZIP 匯出與下載狀態；不改生成器、儲存容量、雲端、PAGE2 匯入相容及其他工作。122 並非固定筆數上限：本機依 2,250,000 UTF-8 bytes 裁切保存，畫面記憶體仍可保留 131。未確認完整備份前不得重新整理使用者原分頁。

## 匯出契約

1. 可通過驗證的 PAGE1 卡片保留原 snapshot 格式與可讀正文；已知 legacyIds 沿用既有遷移。其他來源／無 selection 沿用既有格式。
2. 單張與 ZIP 共用 `encodeSavedCardExportMetadata`。先檢查原始已保存 ID，避免未知 ID 被 normalizeLocks 靜默替換；僅已知快照契約驗證錯誤可轉原始備份，非預期錯誤仍回報。
3. 無法驗證的卡片使用獨立 `VPStudio Saved Card Backup` 註解，版本 1、backup-only、原因及完整原始 card；JSON 的 `<`／`>` escape。正文及所有原始設定／輸出仍保留，不猜 ID、不重新生成、不跳過卡片。
4. ZIP 只要含任一備份卡，就附 `saved-cards-backup.json` 保存這次所選全部原始卡片，manifest 額外列出 backupFile／backupOnlyFiles。全部正常時 ZIP 格式不變，來源篩選及檔名避碰保持。
5. 備份不是可直接匯入的 PAGE1 快照。解析器遇到備份明確拒絕並提示保留原檔，不落入純文字猜測。合法快照的版本、型別、未知 ID、公開原文一致性、巢狀驗證保持。備份還原 UI 不屬本批。
6. Download 顯示 Preparing… 並暫停重複點擊，finally 解除。成功訊息只表示送出瀏覽器下載；錯誤提示收藏仍在原頁、勿重新整理。單張下載同樣捕捉錯誤，不讓操作無聲失敗。

## 驗收

- 131 筆混合正常／未知地點卡，ZIP 含 131 份 Markdown，manifest 筆數一致，原始備份逐欄等於輸入，輸入物件不變。
- 單張與 ZIP 備份 metadata 相同，中文、空白、換行、HTML comment 字元、舊衍生 ID 保持；正常仰躺可往返，偽造未知 ID 仍拒絕。
- 既有完整前端、Prompt Quality、lint／build、strict audit；正式打包初始化與六工作區 smoke。
- 正式版 preview 5175，桌面 1440×1000、手機 390×900，實際下載 ZIP／單張並解包；驗證 loading／success／error、無頁面錯誤及水平溢位。
- 新增精確 inverse 及 hash，只在隔離副本恢復本批前程式；拒絕未知修改與產品工作目錄。A～E、A2 舊基準不可重錄。

可重跑：`node --test webapp/src/features/saved-cards/savedCardBackup.test.js webapp/src/features/saved-cards/savedCardArchive.test.js webapp/src/features/saved-cards/page1MarkdownSnapshot.test.js webapp/src/features/saved-cards/savedCardsDownloadHistory.test.js`；正式 preview 啟動後執行 `PLAYWRIGHT_MODULE=<installed-playwright-module> node scripts/check_saved_cards_download_browser.mjs <new-report-directory>`。

## 線上交付邊界

本機驗收不代表使用者真實 131 筆已完成備份。獲授權 push 並確認 CI／部署後，先用新分頁確認收藏完整並下載，原分頁保持不動；若新分頁少於 131，停止刷新原分頁並另行處理完整備份。不要以本機裁切的 122 筆下載冒充 131 筆成功。
