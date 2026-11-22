# Krea 2 NSFW V5 LoRA：原生 Krea 2 Turbo A/B 測試

日期：2026-11-22（Asia/Taipei）。使用者授權匯入及兩張付費對照測試，尚未授權 DLL 整合、commit、push 或部署。

## 匯入與工作流

- 來源：https://huggingface.co/f23gg/Krea-2-NSFW-V5
- 檔案：Verite_realism.safetensors，457,111,960 bytes。Cloud 已匯入至 loras；畫面顯示所有下載完成。
- Cloud 檔名：f23gg__Krea-2-NSFW-V5__Verite_realism.safetensors。
- DLL 現有原生 Krea 2 Turbo 工作流複製為獨立測試圖，加入 LoraLoaderModelOnly；正式程式未變更。
- 基底 krea2_turbo_fp8_scaled.safetensors；編碼器 qwen3vl_4b_fp8_scaled.safetensors；VAE qwen_image_vae.safetensors。
- 1024×1024、Seed 20261122、8 steps、CFG 1、Euler／simple／denoise 1、batch 1，關閉擴寫。
- 相同一般穿著成人咖啡館人像 Prompt（prompt.txt），包含 Candid flash photo；兩圖只改 strength_model 0→1 與輸出檔名前綴。
- 強度 0 為 LoRA 零強度基準，強度 1 為測試值，並非作者提供的推薦值。
- 可重用 API 圖：workflow-strength-0.api.json、workflow-strength-1.api.json。不包含金鑰。

## 真實 API 結果

|項目|強度 0|強度 1|
|---|---|---|
|Job ID|ed990c2e-4e6c-44cb-886e-b4901dc93292|ad0e565e-9a8b-45b6-ade7-c2b9d1e618ae|
|狀態|succeeded|succeeded|
|Cloud 執行時間|4.468 秒|4.934 秒|
|Cloud 排隊時間|4.272 秒|2.153 秒|
|提交至輪詢成功（包含輪詢間隔）|12.293 秒|12.489 秒|
|圖片|[strength-0.png](strength-0.png)|[strength-1.png](strength-1.png)|
|圖片尺寸|1024×1024|1024×1024|
|下載 bytes|1095496|1076876|
|餘額下降換算 credits|0.921570|1.057144|

兩次均經 /api/v2/jobs 提交、GET job 查詢成功、GET asset 取得下載連結、匿名下載有效 PNG；PNG header 與 SHA-256 已記錄於兩份 strength JSON。未重送或額外生成。

## 扣額依據與限制

- 帳戶餘額（USD cents）：3461.798564617 → 3461.3618016505 → 3460.860785446。
- 合計下降 1.978714 credits，按 DLL 既有 211 credits/USD 換算；美元差額 $0.00937779。
- 基準任務第一次查詢尚未入帳（差額 0），稍後重查才取得已下降的餘額；不能把第一次 0 當免費。
- 這是 API 回傳的帳戶餘額差額，非每筆任務的獨立發票；若同一帳戶另有並行消費，差額可能含其他任務。任務 metrics 不提供單筆 cost。

## 視覺觀察

未套用圖笑容露齒、臉部輪廓較寬、手臂自然放在桌上；強度 1 圖為閉嘴微笑、臉部輪廓較窄、手伸向杯子。兩張均保持藍色 T-shirt、短黑髮、窗邊咖啡館和穿著人像。可見 LoRA 對成像有影響；不能視為只改皮膚或保留角色身份。此單一 Prompt／Seed 不證明整體品質提升，未測其他強度、尺寸、人物或敏感內容。

本次只有獨立測試資產與紀錄，不變更 DLL 的模型選項與正式工作流。是否整合與預設強度待使用者看圖確認。
