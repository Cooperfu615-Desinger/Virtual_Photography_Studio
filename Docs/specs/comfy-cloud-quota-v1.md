# Comfy Cloud 額度與可生成張數 v1

日期：2026-10-05。使用者核准實作及部署；後端已部署，本機前端真實查詢通過，使用者已授權本批 commit/push。

## 介面

選擇 Comfy Cloud 模型時，在模型說明與「生成圖像」之間顯示剩餘 Credits、預估可生成張數、重新整理及更新時間。沿用 DLL 現有寬度與響應式規則，不新增成功張數。未登入顯示請先登入；查詢中停用重新整理；更新失敗保留上次結果並提示失敗。切換帳號、模型、解析度或比例重建查詢狀態，忽略過期回應；生成結果更新後重新查詢。非 Comfy 模型不顯示此區。

## 唯讀服務與估算

- 新增 `comfyCloudQuota`，沿用現有 Firebase email allowlist 及伺服端 `COMFY_CLOUD_API_KEY`。不新增 Secrets、資料庫寫入或生成請求。
- GET `/api/billing/usage/timeseries?months=1&group_by=product&granularity=month` 的 `summary.balance.amount_micros` 依官方契約實為 cents；USD 除 100 再乘 211 換算 Credits。畫面四捨五入到整數；缺少、非數值或非 USD 為無法取得，不當成零。
- 從目前 Firebase uid 最新 50 筆 DLL 請求中，最多查詢 8 個相同模型／解析度／比例／尺寸的唯一 job。只採成功、最終輸出節點恰一張圖、有效 `metrics.execution_ms` 的工作。
- 另 GET job workflow，比對目前伺服端模板；只忽略 prompt、seed、節點 `_meta`。LoRA、步數、節點、尺寸等不同均排除。
- 至少 3 筆合格樣本，以平均 execution 秒數 × 0.266 Credits/秒估算每張耗額，再用未取整的餘額除以每張耗額向下取整。排隊時間不計；沒有單張實際扣額資料，不宣稱精確費用。
- 樣本不足、查詢失敗或餘額不可用不顯示猜測張數。估算依目前設定，實際消耗可能不同。樣本 API 任一讀取失敗時保留餘額但暫不估算。
- 依 uid、API Key 雜湊與設定做 30 秒 process-local 快取及合併查詢，最多 64 項；重新整理可能取得此時間內的快取。不是跨執行個體的全域限流。

## 來源與邊界

2026-10-05 核對 [官方 Credits 說明](https://support.comfy.org/articles/5846341390-how-credits-work-in-comfy)、[Cloud OpenAPI](https://raw.githubusercontent.com/Comfy-Org/docs/main/openapi-cloud.yaml)、[Jobs v2 OpenAPI](https://raw.githubusercontent.com/Comfy-Org/docs/main/openapi-v2.yaml)。費率為當日資料，未來變更需同步更新常數與測試；API usage 統計有延遲，更新時間表示查詢時間。Cloud 帳號餘額可能同時受 GUI／其他 API 使用影響。

## 驗證與啟用

- Functions 測試涵蓋單位、缺值、零值、樣本過濾、workflow 一致性、讀取失敗、快取及既有授權隔離；前端涵蓋顯示與唯讀 callable payload。
- 桌面 1440×1000／手機 390×900 五主要工作區 smoke；模擬資料驗證成功、零額度、缺資料、樣本不足、loading、刷新失敗保留、切換模型的延遲回應、登出與鍵盤刷新。模擬頁已移除，未改使用者收藏。
- 新 adapter 實際唯讀取得 4153.831699 Credits，與 Cloud GUI 4,154 一致。兩模型各一筆既有 1K／9:16 工作通過模板核對，均因不足三筆回傳無估算。這次直接 adapter 查詢使用已知任務的記錄 fixture，不代表已部署 callable／Firestore 整合驗收。
- 使用者後續授權部署 `comfyCloudQuota`；已於 us-central1 建立 revision `comfycloudquota-00001-len`，綁定既有 Secret version 1。以 Nailai 帳號在 localhost 登入，Z／Qwen 1K、9:16 及手動刷新顯示 4,154 Credits、樣本不足；此輪已覆蓋 callable 與 Firestore 真實整合，未新增付費工作。
- 部署後曾短暫發生 Cloud Run 拒絕驗證登入 token；IAM 唯讀比較與既有 status 服務一致，沒有修改權限。重試、重新載入及模型切換後成功，根因未確定，保留為外部服務觀察事項。桌面 1440×1000／手機 390×900 真實畫面無 console 錯誤，手機無橫向溢出。證據 `/tmp/dll-quota-live-1440.png`、`/tmp/dll-quota-live-390.png`。
- 使用者已授權本批 commit/push，正式 Pages 發布狀態以後續 Actions 為準；本機服務與登入頁保留供使用者確認。部署 CLI 提示 Node.js 20 將於 2026-10-30 停止部署支援，需另案升級 runtime；本次未改 runtime／依賴。
