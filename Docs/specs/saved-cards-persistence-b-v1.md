# Saved Cards 持久化 v1：B 隔離實作

2026-11-02；基準 main bd69cdbbe6709ea32b04046c65c229f1ac60bb63。使用者授權 B 隔離實作及演練；本機候選待驗收，尚未 commit／push。此文件承接 [v1 主規格](saved-cards-persistence-v1.md)，A 基準、ZIP 與其他歷史報告不重錄。

## 隔離與入口

B 模組不被正式工作台匯入，僅允許明確注入 IndexedDB 並使用 vps-saved-cards-b-test- 開頭的測試資料庫；正式 vps_saved_cards 不會開啟。實際瀏覽器 Storage 只在專用測試 origin 接受；驗收使用新建隔離 profile 與合成資料，外部網路全部封鎖。

- repository：cards、syncOutbox、syncBaselines、tombstones、snapshots、meta 的隔離交易；提交完成後才回報成功，版本、lease、fence、revision 或資料不一致時中止。
- migration：原始四個來源字串與 SHA-256 快照、暫存世代、完整讀回、未解項清單與 ready 指標；不存在、空、錯誤、衝突、未知版本及缺 ID 分開。原始 payload 不經 codec 整批重寫。
- coordination：Web Locks 可用時優先，仍以 IndexedDB 租約／fencing 保護；BroadcastChannel 僅通知重讀 revision，沒有時由焦點／可見性回讀。測試 origin 的舊分頁 storage 事件與再次讀取會保存分歧快照並停止寫入。
- recovery：checksum 保護的 backup-only JSON Blob，可在空的隔離測試庫還原 cards、快照、未解項、outbox、baselines、tombstones 和 meta；不復活舊 lease，保留 fence。重複 ID 衝突可明確選擇原快照內來源／索引並保存決策；ready 前後的來源分歧保留不同快照，可明確選擇快照於全新隔離測試庫恢復並記錄來源；未知格式或缺來源保持 unresolved，不能憑空補資料。

本批沒有啟用正式儲存來源、產品恢復介面、雲端 sender 或更改收藏資料。同步意圖及 tombstone 僅為隔離交易結構，不代表 C 的帳號、Firestore、重試與衝突整合已完成。

## 交易與遷移邊界

新卡、對應 upsert 意圖與 revision 同交易；刪除與 tombstone、對應帳號意圖同交易。刪除本地尚未綁定且未送出的卡時，取消該卡尚未送出的 unbound upsert；已知帳號意圖或基準不能被視為無帳號刪除。已知多個不同帳號目標時採保守拒絕，後續 C 不可據此省略帳號衝突設計。

先取得協調權並讀取原始來源，建立不可變快照，再解析、寫入暫存、讀回核對 ID／順序／原文 hash 與未解數，成功後才在單筆交易標記 ready。中斷重試沿用相同快照；標記寫入失敗不重複遷移。快照存在但來源變動不重用，ready 後發現來源變動或讀取失敗會凍結；有未解項不可啟用。

localStorage 與 IndexedDB 不具跨 API 原子交易；切換期間既有舊版分頁不能被新鎖強制阻止。隔離流程有切換前後核對與 storage／焦點偵測，但這不能消除所有時序窗口；正式釋出前 D 仍須停止舊寫入端並完成受控切換、衝突與回退驗收。

## 驗收與限制

具體測試、固定合成資料、瀏覽器兩分頁及報告見 [B 驗收](../reports/saved-cards-persistence-b-2026-11-02/README.md)。B 的 SC-P01～P06、P12 為隔離範圍驗收；P13／P14 僅記錄 ZIP 相容與隔離恢復包部分，不代表整體驗收結束。P07～P11 的真實同步、帳號競爭與 Emulator 屬 C，正式切換、真實裝置／私人資料與整體回退屬 D 或另行授權。

QuotaExceededError 以隔離故障注入驗證；本次 Chrome 測試的容量覆寫未生效，並未實際耗盡裝置配額。未使用 Storage.persist API，也不承諾瀏覽器不會清理資料。既有 favicon 404／原生下載視窗限制仍按前一批報告保留。
