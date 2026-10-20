# DLL：Asian Mix LoKr 開關與強度 v1

日期：2026-10-20。使用者先核准本機實作及 commit／push，再另授權合併 main、部署相關 Functions，並要求後續直接在 main 開發；本批未執行新的付費生成。

## 核准範圍

- 只在既有 Z-Image-Turbo BF16 選項提供「套用 Asian Mix LoKr」，預設關閉。INT8 不提供，MOSS 固定 0.7 控制不變。
- 開啟時顯示滑桿與數字輸入，範圍 0–1、間距 0.05、預設 1。0 是有效值；關閉則回到原基底工作流。
- 不改 Prompt、不自動添加觸發詞；提示作者觸發詞 `asian woman`，由使用者決定是否加入。
- 快速面板、完整版、草稿、待生成任務、歷史沿用與 Seed 沿用保留同一強度。已排入任務不受後續編輯影響。無效或空白強度阻止加入／生成。
- 保留原六比例、1K／2K、1／2 張序列、採樣器與既有儲存；新增專用快速設定 key，不遷移歷史資料。

## 模型與請求

- 基底 `zImageTurbo` 不變；新增 hidden variant `zImageTurboAsianMix`（前端 `comfyZImageTurboAsianMix`），仍以原基底顯示在模型選單。
- 使用固定 `LoraLoaderModelOnly`，檔名 `hina_zImageTurbo_asianMix_v7.0-R-rev1_fp32.safetensors`；接在 UNET 與 AuraFlow 之間。只允許數值 `loraStrength`，伺服端驗證 0–1 且為 0.05 刻度，不允許任意模型檔名或 graph 覆寫。
- 缺省強度為 1；meta、Firestore 任務、前端快照及恢復均保留強度。其他模型不接受此參數，避免靜默忽略。
- 額度查詢、快取、候選紀錄與工作流驗證依實際強度隔離，關閉／不同強度不互借估算樣本。
- 後續正式發布需更新 Submit、WorkspaceSubmit、Status、Quota 四項 Functions。新 variant 在舊後端會先拒絕，不會悄悄生成基底。

## 已知證據與限制

Cloud 模型庫確認版本 v7.0-R-rev1 FP32，標示 ZImageTurbo、觸發詞 `asian woman`。作者網站因瀏覽器政策無法讀取，不能宣稱已核實全站最新版本或作者建議強度。

使用者手動送出一組 GUI 對照：BF16、相同成人著衣咖啡館 prompt／Seed 42／1024²／8 steps／CFG 1；基底 11.09 秒、LoKr 1.0 為 8.99 秒，都成功且有可見變化。只證明這組 GUI 執行與效果；DLL API 的模型可見性、扣額、原圖下載、其他尺寸與強度尚未付費驗收。

## 驗證計畫

Functions：工作流差異、強度邊界／刻度、模板不可變、claim 前驗證、重複 ID 不重送、metadata、額度分桶與快取。前端：選單／開關、參數傳遞、兩張序列、草稿與快照保存、歷史還原；執行兩端全測試、lint、前端 build。

桌面 1440×1000、手機 390×900，以 DEV 模擬入口檢查目前五工作區、三快速面板與完整版、開關／滑桿／數字／錯誤／排入後修改／兩張／歷史沿用／reload，記錄 console 與 overflow。模擬驗收不呼叫付費生成。

## 本機驗收結果

2026-10-20，分支 `codex/asian-mix-lokr-strength`，基於 `316cb64`，使用既有隔離工作目錄；原 checkout 的未追蹤文件保持不變。

- Functions：Node24 全部 102 項通過、lint 通過；包含非法參數在 claim／付費請求前拒絕、同 ID 不重送、強度分桶與 upstream graph 核對。
- 前端：Node22 全部 1736 項通過、lint／build 通過；build 保留既有大型 chunk 提示。首次 Node24 前端執行遇到既有測試要求 TAP `# pass`、Node24 輸出 `ℹ pass` 的格式差異；使用 Node22 重跑通過，未為此改動測試。
- Browser：Chrome，1440×1000 與390×900；現行 Prompt 工作台／角色建模／場景建模／DLL_PIC Pro／Saved Cards 均檢查，三快速面板與完整版控制正常，無頁面橫向溢出／控件重疊／新 console warning 或 error。
- 開關、預設 1、0 有效、滑桿 ArrowRight 增量0.05、空白與1.2阻擋；INT8 無控制、MOSS固定0.7。任務以0.55排入後將草稿改為0.05，任務仍0.55；模擬完成後「沿用設定」及 reload 恢復0.55。
- 快速面板0.4帶入完整版，循既有「帶入來源」流程覆蓋舊草稿，成功保留0.4；兩張模擬結果均完成（測試圖片／Seed1234、1235），實際生成設定顯示0.4，兩張圖片載入成功。
- 截圖位置與驗收詳情見根目錄 `design-qa.md` 的 Asian Mix 章節。上述為本機模擬，未證明真實 DLL API 生圖／扣額／下載。

## main 合併與後端部署

- `3d9cc30ccff083d90c17f87f377bb28ad7040de2` 已由功能分支快轉合併並推送 main。後續開發直接使用 main，不建立新功能分支；提交／推送／部署仍按各次授權執行。
- main 使用本次乾淨的既有工作目錄 `/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`。原專案目錄保留在 detached `e9e7745`，避開四份未追蹤同名文件與遠端不同的覆寫風險；其66個未追蹤檔案前後SHA256一致。
- Firebase CLI 部署成功；`comfyCloudSubmit`、`comfyCloudWorkspaceSubmit`、`comfyCloudStatus`、`comfyCloudQuota` 均 ACTIVE、Node24、us-central1。四者僅source／hash／labels改變，Secret與環境／資源配置保留，其餘七項服務完整metadata不變。[部署摘要](../reports/comfy-asian-mix-2026-10-20/functions-deployment.json)。
- 四項服務匿名POST均401，正式站Origin的OPTIONS均204且allow-origin正確；未登入請求未觸及Comfy生成。[健康檢查](../reports/comfy-asian-mix-2026-10-20/functions-smoke.json)。
- main推送觸發[正式網站發布流程](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/workflows/deploy.yml)。CI與Pages完成狀態依該次執行紀錄確認，不以push成功取代發布驗證。
- CLI仍提示firebase-functions可升級，未在本次部署擴大範圍升級。真實帳號的DLL API出圖、扣額、下載及不同強度品質仍待付費驗收。
