# DLL：Comfy Cloud 三模型擴充 v1

日期：2026-10-06。狀態：使用者核准新增模型；實作已 commit／push `0c3a921`，正式 Pages 與三個新版 Functions 已發布，三模型真實額度查詢通過，未提交新付費生圖。此文件補充 [既有整合](comfy-cloud-integration-v1.md) 與 [額度規格](comfy-cloud-quota-v1.md)，原兩模型工作流與登入／續查／下載契約保留。

2026-10-08 本機追加 [Krea 三版本與逐張生成](comfy-krea-sequential-generation-v1.md)：DLL 操作可選 1／2 張，所有模型預設 1；下文單次一張指每個雲端任務，原三模型模板與單張額度樣本不變。本次追加尚未部署或付費生成驗收。

## 功能與來源

使用者提供三份 API-format JSON，Downloads 原檔不修改。新增獨立選單項目，沿用所有 DLL 工作區的 Prompt 來源、預覽、放大與下載。單次一張、1K／2K、1:1／4:3／3:4／16:9／9:16／4:5；不新增 LoRA、任意工作流、步數或品質控制。

| DLL 名稱 | 前端 model key | 後端 model key／模板 | 最終輸出 |
| --- | --- | --- | --- |
| Comfy Cloud · Z-Image-Turbo INT8 | `comfyZImageTurboInt8` | `zImageTurboInt8`／`functions/src/comfyWorkflows/zImageTurboInt8.json` | `9` SaveImage |
| Comfy Cloud · Ideogram 4.5 | `comfyIdeogram45` | `ideogram45`／`functions/src/comfyWorkflows/ideogram45.json` | `5` SaveImageAdvanced PNG |
| Comfy Cloud · Seedream 5.0 Pro | `comfySeedream5Pro` | `seedream5Pro`／`functions/src/comfyWorkflows/seedream5Pro.json` | `2` SaveImageAdvanced PNG |

- INT8 保留原檔 10 節點、`z_image_turbo_int8_convrot.safetensors`、`qwen_3_4b_fp8_mixed.safetensors`、`ae.safetensors`、steps=8、cfg=1、res_multistep／simple；Prompt 與 seed 改為每次輸入，filename prefix 改為 DLL 名稱。尺寸沿用原 Z／Qwen 約 1／4 MP 且比例精確、8 像素倍數算法。與原 Z 分開，不表示速度或品質已驗收。
- Ideogram 採 `ideogram-4.5`、Medium、Magic Prompt=off，直接傳入原 Prompt；以明確官方尺寸取代 auto。Prompt 限 10,000 個字元，前後端均拒絕超限，不靜默截斷；其他模型保留 30,000 上限。
- Seedream 採 `seedream 5.0 pro`、Thinking=false、watermark=false，保留 prompt_optimization=standard；僅文字生圖，沒有參考圖。4:5 使用 Custom，其他比例使用官方 preset。關閉 Thinking 不代表能保證模型內部完全不處理 Prompt。
- 合作夥伴模型的 seed 為 0～2,147,483,647；INT8 沿用既有安全整數 seed 範圍。Seed 不是跨模型或跨服務的效果一致性保證。

## 尺寸映射

由 `functions/src/comfyModels.js` 管理模型節點、seed 範圍、最終圖片節點與以下映射。Metadata 回傳實際要求的 width／height；Seedream preset 的 16:9／9:16 是官方近似比例，不能宣稱和原 Z 算法一樣精確。

| 比例 | Ideogram 1K | Ideogram 2K | Seedream 1K | Seedream 2K |
| --- | --- | --- | --- | --- |
| 1:1 | 1024×1024 | 2048×2048 | 1024×1024 | 2048×2048 |
| 4:3 | 1152×864 | 2304×1728 | 1152×864 | 2304×1728 |
| 3:4 | 864×1152 | 1728×2304 | 864×1152 | 1728×2304 |
| 16:9 | 1280×720 | 2560×1440 | 1312×736 | 2848×1600 |
| 9:16 | 720×1280 | 1440×2560 | 736×1312 | 1600×2848 |
| 4:5 | 896×1120 | 1792×2240 | 1024×1280 Custom | 1792×2240 Custom |

Seedream Custom 欄位最低邊長 1024。選官方 preset 時，未使用的 `model.width`／`model.height` 保持合法 1024；只有 Custom 才填入映射寬高，避免合法 1K 預設的短邊違反該欄位驗證。1K／4:5 因此為約 1.31 MP；解析度標籤表示工作流級別，不保證所有模型同像素數。

## 驗證、回傳與額度

- 既有 `POST /api/v2/jobs`、Bearer、Idempotency-Key 不變。INT8 僅提交 `{workflow}`；Ideogram／Seedream 另由伺服端 Secret 加入 `extra_data.api_key_comfy_org`，供 worker 的 Partner Node 使用。使用者 payload 不能覆寫此值；不放在模板、Firestore 任務記錄或 callable 回應。上游錯誤若回傳原 key，回傳前遮蔽。Comfy Cloud 本身依官方 v2 契約保存並遮蔽 extra_data。
- 仍只接受各模型最終 SaveImage 節點的 image 輸出；不把 Ideogram final_prompt 或中間圖片當預覽。不回傳需驗證的 content route，伺服端查 Asset 後回傳簽名圖片網址與期限。未知回應、缺圖片、Asset 查詢失敗都沿用原續查，不再次提交扣費。
- 三模型均可查共用剩餘 Credits 及手動刷新。INT8 只用同 INT8 工作流／尺寸／比例的 DLL 成功歷史，至少三筆才估算，不混入原 Z。
- Ideogram／Seedream 包含額外合作夥伴計費，不能使用 GPU 執行秒數推算總成本。只顯示餘額，估算回傳 null、`estimateUnavailableReason=partnerPricing`，畫面顯示「此模型暫不估算張數」。不讀 GPU 歷史。未加入固定牌價推算，未宣稱精確單張費用。
- 共享 provider contract 保持 version 1，模型為追加；原 `comfyZImageTurbo`／`comfyQwenImage21` key、預設、儲存鍵、Prompt mappings 與隱藏 BytePlus／Magnific 規則保留。

## 已驗證與待驗收

- Functions 63/63、完整前端 1326/1326、雙端 lint、前端 build 與 diff-check 通過。新增測試涵蓋新模型路由、Prompt／seed／尺寸、原兩模型固定工作流相容、合作夥伴驗證且不洩 key、重複請求不重送、最終圖片節點、INT8 樣本隔離與合作夥伴額度邊界。Vite 既有大型 chunk 提示保留。
- 以既有 Firebase Secret 在記憶體中做 GET `/api/object_info` 唯讀核對：兩個 Partner Node、SaveImageAdvanced、INT8 三個模型檔案均存在；24 組兩模型×兩解析度×六比例的參數通過目前 Cloud schema 核對。不輸出 Secret，不提交付費工作。
- 瀏覽器 1440×1000／390×900，五主要工作區完成載入及模型選單檢查；新模型、1K／2K、胸上來源固定 4:5、未登入生成保護與空預覽均通過。完整 App 無 console warning/error、破圖或文件橫向溢出。額度元件以模擬資料驗證兩個合作夥伴提示、INT8 樣本不足、loading、刷新失敗保留值及鍵盤重試；模擬不代表真實餘額／扣費。臨時頁熱更新曾出現 createRoot 重複告警，完整重載後沒有新增，臨時頁與分頁已移除。原 DLL 設定、viewport 已還原。截圖 `/tmp/dll-models-desktop.png`、`/tmp/dll-models-mobile.png`、`/tmp/dll-models-quota-{desktop,mobile}.png`。
- 已 push `0c3a9211e072547378278cffab54a4f89d751b03`；GitHub Actions `37401555769` 的 webapp-quality／functions-quality／build／deploy 全部成功，Pages 於 2026-10-06 10:15:19（台北）發布。正式 DLL lazy asset 已核對三模型標籤、後端 key 與 `partnerPricing`。
- 使用者另行授權部署三個 Functions，2026-10-06 14:35（台北）部署成功；Cloud Functions v2 metadata 確認三者 ACTIVE、所有流量指向最新 revision，均使用 build `0337ff76-33ae-45cd-a297-8bf94ad53b38`。`virtualphotographystudio/us-central1` 的 revision：submit `comfycloudsubmit-00006-cow`、status `comfycloudstatus-00007-yez`、quota `comfycloudquota-00002-jij`。沿用 Secret `COMFY_CLOUD_API_KEY` v1、allowlist、Node.js 20，不新增 Secret、rules 或 index；其他四個 Functions 部署前後的 CLI metadata 語意相同。CLI 有 Node.js 20 於 2026-10-30 停止支援部署及 firebase-functions 更新提示，本次未升級。
- 正式 Pages 使用既有登入逐一查詢三個新模型 1K／9:16，均讀回 4,086 Credits（14:36 快照）。INT8 顯示「尚無足夠估算資料」，Ideogram／Seedream 顯示「此模型暫不估算張數」；Seedream 手動刷新完成且無錯誤。此驗收涵蓋已部署 quota callable／Secret／真實 Comfy 餘額及 INT8 Firestore 樣本路徑，未送 submit 付費工作，也未操作既有上次任務追蹤。瀏覽器 1732×757 的 console warning/error 為空、無文件橫向溢出，截圖 `/tmp/dll-models-live-deployment.png`；原 DLL 設定已還原，收藏未變更，臨時驗收分頁已關閉。
- 真實模型出圖、圖片實際尺寸／下載、Partner Node 執行權限、實際扣額、不同尺寸的品質及和 GUI 的效果一致性仍待部署後驗收。建議先 1K、一張、同中性 Prompt，由使用者確認三模型效果；不自動重送不明結果。

官方依據（2026-10-06 核對）：[HTTP v2 OpenAPI](https://github.com/Comfy-Org/docs/blob/main/openapi-v2.yaml)、[Ideogram 節點](https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_api_nodes/nodes_ideogram.py)、[Seedream 節點](https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_api_nodes/nodes_bytedance.py)、[Seedream presets](https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_api_nodes/apis/bytedance.py)、[Credits 說明](https://support.comfy.org/articles/5846341390-how-credits-work-in-comfy)。
