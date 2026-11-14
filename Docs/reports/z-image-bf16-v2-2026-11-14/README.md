# Z-Image Turbo NSFW v2 BF16 獨立 API 驗收

日期：2026-11-14。用戶授權單張 Comfy Cloud 額度測試；未修改 DLL、部署或提交 Git。

## 結果

- 模型：tewea/z_image_turbo_bf16_nsfw 的 z_image_turbo_bf16_nsfw_v2.safetensors。
- 私人模型庫 API 確認匯入資產存在，大小 12,566,033,952 bytes。標準 UNETLoader 可用 loader_path 載入；公共 object_info enum 未列出此私人模型，不代表無法執行。
- 工作流：workflow-api.json，基於既有 zImageTurbo API 圖建立獨立副本；無 LoRA、無提示詞擴寫。這是可重用的 API JSON，沒有另存為 Cloud 網頁命名草稿。
- 設定：832 × 1216，1 張，seed 20261114，8 steps，CFG 1，res_multistep/simple，shift 3。
- Prompt：30 歲、完整著衣的成年女性咖啡廳窗邊肖像；全文保存在工作流。
- API POST /api/v2/jobs 成功，ID：0b54751c-c839-485c-b30a-d6f55d36d7c0。固定 HTTPS 任務端點查詢 succeeded；未重送。
- 回報 queue_ms 2858、execution_ms 2957。07:04:14 UTC 扣額前快照，07:04:21 UTC 已觀察完成，約 7 秒包含提交與查詢。
- GET /api/v2/assets/{id} 取得結果，無憑證下載圖片，驗證 PNG signature、尺寸 832 × 1216、1,196,016 bytes。
- 目視：臉部、皮膚、毛衣紋理與窗邊光線清楚，無明顯破圖；雙手放桌上的要求僅部分遵循，右手垂下。單張結果不能代表整體穩定性，也未測試露骨內容。

## 費用

初次生成後帳務未立即更新；約一分鐘後再次查詢已反映：

- 前：331.2422363395 cents（約 698.921119 credits）
- 後：330.9405199875 cents（約 698.284497 credits）
- 差額：US$0.00301716352，依 DLL 既有 211 credits/USD 換算約 **0.636621503 credits**。

這是測試窗口餘額差，非單筆發票；本測試僅送出一筆，無法排除其他裝置同期使用。官方帳務端點說明其資料可能延遲，不能以初次未變動解讀為免費。

## 檔案與限制

- workflow-api.json：獨立 API 工作流，可匯入或供後續接入使用。
- acceptance.json：已去除金鑰與限時下載網址的任務及餘額紀錄。
- result.png：原始下載成果。

Chrome 工具連線回報 Debugger unattached，因此未在網頁 UI 核對任務；API、下載與本機圖片檢查已完成。沒有修改使用者現有 Cloud 工作流。

官方帳務規格：https://raw.githubusercontent.com/Comfy-Org/docs/main/openapi-cloud.yaml
