# Z-Image Turbo NSFW v2 BF16 接入 DLL

日期：2026-11-14。狀態：本機實作與介面驗收完成；使用者已授權 commit／push 到 main 與部署四個既有 Functions，交付結果以 Git 與 Firebase 回讀為準。

## 範圍

新增獨立可選模型 `Comfy Cloud · Z-Image Turbo NSFW v2 BF16`：前端 key `comfyZImageTurboNsfwV2Bf16`、後端 key `zImageTurboNsfwV2Bf16`。既有 Z-Image-Turbo、INT8、Asian Mix 與 Radiance 行為不變；本版本不提供 LoRA 開關。

模板採本次[已成功的 Cloud API 測試](../reports/z-image-bf16-v2-2026-11-14/README.md)，使用帳號已匯入檔名 `tewea__z_image_turbo_bf16_nsfw__z_image_turbo_bf16_nsfw_v2.safetensors`。保留 qwen_3_4b.safetensors、ae.safetensors、8 steps、CFG 1、res_multistep/simple、AuraFlow shift 3、denoise 1。Prompt 原樣經既有 trim 傳入，不加入 LoRA 或自動擴寫。

新設定預設 1 張，可選 1／2 張，後端每個 job 固定 batch_size 1；沿用既有逐張流程，第一張取得後才提交第二張。沿用 Seed 控制（留空隨機，指定值時第二張 +1）、預覽、下載、歷史保存／沿用設定、任務續查與額度顯示。

採樣設定沿用實測，但不把實測的 seed 20261114 或 832 × 1216 鎖為使用者設定。尺寸沿用 DLL 六比例和 1K／2K 像素計算，預設解析度 1K；各尺寸契約測試通過不代表每個尺寸均已付費實測。實測僅涵蓋前述 832 × 1216 一張。

## 維護位置

- `functions/shared/imageProviderContract.json`：模型名稱、比例、解析度與張數契約；前端直接衍生模型選單。
- `functions/src/comfyModels.js` 與 `functions/src/comfyWorkflows/zImageTurboNsfwV2Bf16.json`：工作流模板與欄位映射。
- `functions/test/comfyZImageNsfwV2.test.js`、`webapp/src/lib/zImageNsfwV2.test.js`、`webapp/src/lib/comfyModelExpansion.test.js`：模型隔離、採樣設定、張數、序列、設定快照與路由驗證。

發布時需更新前端，以及 `comfyCloudSubmit`、`comfyCloudWorkspaceSubmit`、`comfyCloudStatus`、`comfyCloudQuota` 四個既有 Functions；不新增 Secret 或 Function。私人模型需存在於現有 Secret 對應的 Cloud 帳號（已 API 實測確認）。本次已獲授權部署；正式版付費生成驗收未包含在本輪交付。

## 本機驗收

- Functions 完整測試 141/141、lint 通過。
- 專項前端測試涵蓋可選模型、預設一張、兩張序列、獨立 Seed 與設定快照。
- 1440 × 1000、390 × 900：DLL 選單可選新模型、1／2 張選項正常、模擬 loading／成功／待確認阻擋、兩張切換、歷史與沿用設定正常；無頁面水平溢出、console error。Prompt 工作台共用模型選單亦確認存在新選項。
- 使用 `?dllAcceptance=1` 獨立模擬資料，不呼叫付費生成服務。畫面人物為既有 fixture，不是本模型本輪生成品質證據。
- 桌面／手機截圖保存於上述 reports 目錄 `dll-desktop.jpg`、`dll-mobile.jpg`。
- 前端完整 `npm test`：2303 項，2300 通過／3 失敗。模型選單預期值缺少新增模型已補上，`dllPicProClient.test.js` 重測 22/22；新增 `zImageNsfwV2.test.js` 另測 2/2。
- 另外兩項是未修改的 `webappTestRunner.test.js` 對 TAP 輸出字串 `# pass` 的假設，完整執行的子程序回報 spec 格式 `ℹ pass`。用本機 Node v22.22.3 直接重跑該檔 10/10 通過；未改測試工具，不宣稱完整 npm 命令已全綠。
- 前端 lint、build 與 `git diff --check` 通過。build 保留既有 >500 kB chunk 警告。

## 交付前補充驗證

2026-11-14 明確使用 `/Users/cooperfu/.local/bin/node` v22.22.3 執行與 npm test 相同的完整選檔，共 2305 項，2304 通過；唯一失敗為 C2 隔離歷史上下文拒絕新版 `dllPicProClient.test.js` 指紋。已檢閱其差異僅新增本模型的選單預期值，於 `scripts/lib/c2WaistHistoryContext.json` append 該檔精確 SHA-256；原 before/after hash、歷史 commit 與斷言皆不變。針對失敗的歷史案例重測 1/1 通過；沒有再次重跑其餘 2304 項。先前兩項測試工具輸出格式問題在 Node 22 完整執行中均通過。Functions 再驗 141/141 與 lint 通過。

## 正式版後續驗收（2026-11-14）

版本 `8f5d261099c37d0478ab9e85bc15fe177b3d989a` 已完成正式版 9:16／1K 兩張付費測試：逐張提交、792 × 1408 圖片預覽、重新載入後歷史保存正常，使用者確認兩張均能下載。詳細證據、額度顯示限制與驗收分工見[正式版兩張驗收紀錄](../reports/z-image-bf16-v2-2026-11-14/production-acceptance.md)。上述本機／獨立 API 階段記載保留為歷史。
