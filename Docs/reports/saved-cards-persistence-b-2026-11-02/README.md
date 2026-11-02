# Saved Cards 持久化 B：隔離驗收

2026-11-02；基準 main bd69cdbbe6709ea32b04046c65c229f1ac60bb63，僅測試專用 origin、全新無頭 Chrome profile 和 synthetic-only 資料。沒有使用私人收藏、真實帳號或正式雲端；此候選不接入產品工作台。

## 驗收結果

- [瀏覽器案例清單](browser-results.json)：IndexedDB 測試庫（正式名稱拒絕）；131／500／1,000 筆與超大單卡原文、順序、重開及原來源不變；A 的 14 組來源；snapshot／staging／readback／ready 中斷與重跑、輔助標記失敗、舊來源競爭、讀取拒絕及錯誤資料；ready 前來源變更的兩份快照皆保留，需明確選擇來源才能在全新測試庫恢復。
- IndexedDB 交易中止、131 筆整批回滾、寫入成功後實際關閉分頁並在新分頁讀回、blocked 升版、新版 schema 拒絕、租約 fence、Web Locks、BroadcastChannel／focus 退路及兩個真實隔離分頁交錯新增／刪除通過。
- 原始快照與 unresolved 可進恢復包；重複 ID 衝突只能選原快照中的來源與索引，明確記錄來源。恢復包以 JSON Blob 經 checksum 驗證後還原至全新測試庫，覆蓋卡片、待同步、刪除、遠端基準與未解衝突；拒絕被更改包或非空目標，不復活舊 lease。
- QuotaExceededError 是在隔離瀏覽器注入的失敗；Chrome 的測試配額覆寫未生效，未實際耗盡裝置配額。交易 abort 與 blocked 在真實 IndexedDB 中執行。Storage.persist 未使用；不能據此宣稱任何瀏覽器不會清理資料。
- 六工作區桌面 1440×1000、手機 390×900 的現行 UI 導覽與橫向溢出 smoke 見 [畫面紀錄](ui-smoke.json)。B 尚未接入正式畫面，這不是 B 的正式產品流程或私人資料驗收。前一批原生下載視窗／favicon 限制保留。

## 自動檢查

- Node 22.22.3 最後一輪前端全套 2,098／2,098 通過；B 聚焦單元 5／5、隔離 Chrome 118 項檢查通過，lint 通過。

- Prompt Quality 853／853；同 seed 200 筆 strict 稽核 0 blocking，與 ZIP 修復交付前結果一致。既有 wardrobe／scene 診斷保留。
- build 在獨立 /tmp 輸出目錄通過；A 階段封存以固定舊版隔離回放，19／19 且基準相符。固定的 ZIP Unicode 回歸和現行下載相容性納入前端全套。
- 受影響的新單元測試與瀏覽器工具命令、結果摘要及來源雜湊見 [validation.json](validation.json)；沒有更改封存 A、ZIP、A～E 或 Phase 4 基準。

## 階段邊界

SC-P01～P06、P12 在上述**合成／隔離範圍**演練；配額與交易中斷採注入而非真實硬體故障；已完成真實分頁關閉／重開。SC-P13 為既有 ZIP 相容的一部分，P14 為測試資料庫／恢復 Blob 的隔離回放；C 的真實同步／帳號、D 的停止舊端、正式資料切換與全面回退均未驗收。

localStorage 與 IndexedDB 不能跨 API 原子提交。切換後比對、watcher 與凍結不保證舊版完全無競爭；D 必須先停止舊寫入端。未知版本或缺少來源仍 unresolved，不自動選邊或宣稱完整。多帳號基準不一致時保守拒絕，C 需完成對應的使用者處理。

未修改正式 UI、Prompt、收藏、雲端或 Firebase 規則；未進入 C／D，未 commit／push。

## 重跑入口

在隔離環境使用 Node 22 及 Playwright（依環境指定 PLAYWRIGHT_MODULE；必要時指定 CHROME_PATH）：

```sh
node --test webapp/src/features/saved-cards/persistenceB.test.js
node scripts/saved_cards_b_browser.mjs
node scripts/replay_saved_cards_unicode_a.mjs
cd webapp
npm test
npm run lint
npm run test:prompt-quality
npm run audit:prompts:strict
```

B 瀏覽器工具使用專用測試 origin 與新建 profile，拒絕非測試資料庫名稱，所有非測試 origin 請求阻擋；不要改成既有私人瀏覽器 profile。
