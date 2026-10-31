# DLL：Qwen 2.1 v1.3b LoRA 開關與強度 v1

> 2026-10-31 現行狀態：使用者確認 DLL 日常使用大致正常，決定更新紀錄、不因舊文件缺少逐項證據而全面重新驗收。交付核對與少數未確認事項見[使用狀態紀錄](../decisions/2026-10-31-dll-usage-status.md)。以下正文保留當時的實作／驗收狀態；「未部署」「未實測」「待驗收」等歷史文字不作目前自動待辦。此回饋不等於每個模型、尺寸、費用或異常情境均已逐項通過，既有驗收限制保持。

日期：2026-10-21。直接在既有 main 工作目錄實作，基準 e86c682；本機驗證完成後，使用者授權先 commit／push 到 main，再部署四項相關 Firebase Functions。以下本機驗收與雲端驗證分開記錄。

## 操作與保存契約

- 在既有 Qwen-Image-2.1 選項下新增「套用 v1.3b LoRA」；選模型時預設關閉。開啟後強度預設 0.7，可用滑桿／數字調整 0–1、間距 0.05；0 有效，空白、非數值、超界或非刻度值阻止加入／生成。
- 三個快速面板直接顯示開關；完整版放在既有進階設定。沿用現有視覺與響應式樣式，未修改 CSS 或版面斷點。
- 快速設定新 key 為 `dll_pic_pro_qwen_v13b_strength`，與 Asian Mix 的既有 key 分開。切換模型只讀取該模型保存的強度，不再將另一模型的強度寫入 Asian Mix。無保存值時 Qwen 為 0.7、Asian Mix 為 1；MOSS 仍固定 0.7，Z-Image INT8 無 LoRA 控制。
- 草稿、待生成快照、歷史設定／Seed 沿用、兩張依序生成及結果 metadata 保留實際 modelKey／強度。排入後修改草稿不影響原任務。關閉時省略強度並回到原工作流。
- Prompt、負向 Prompt、Saved Cards、原模型模板與其他來源輸出不變；沒有自動添加觸發詞或擴寫。

## 固定工作流

- base：`qwenImage21`；hidden variant：`qwenImage21Lora`，前端 `comfyQwenImage21Lora`。模型選單只顯示一個 Qwen 選項，隱藏 variant 可以合法還原。
- LoRA 檔名：`qwen2_1-femaledVaginus-nsfw-v1_3-fine_L22-31.safetensors`。來源版本 Civitai 3388157，fileId 3277181；此規格固定已匯入檔案，不代表日後作者最新版。
- 從未更動的 Qwen INT8 模板複製，只加入節點 600 `LoraLoaderModelOnly`，UNET `459:451` → LoRA → Cache `459:480`。保留 SaveImage `461`，25 steps／CFG 1／Euler／simple，原文字編碼器／VAE。
- 保留 1K／2K、六比例、預設一張／可選兩張。每個雲端 job 固定一張，前一張成功取得並保存後才送下一張。
- 伺服端只接收經驗證的數值強度，不接受客戶端任意 LoRA 檔名或 workflow 覆寫。前後端同一共享模型契約；重複 requestId 不重送。
- 額度樣本、快取與上游工作流比對依 base／variant／強度分開，避免不同強度共用估算。

## 修改位置

- `functions/shared/imageProviderContract.json`：variant、尺寸／張數／強度契約。
- `functions/src/comfyModels.js`：固定 LoRA graph；兩端 `providerContract.js` 的錯誤訊息涵蓋 LoRA／LoKr。
- `webapp/src/lib/dllPicProClient.js`：開關映射、hidden variant 還原、分模型強度保存。
- `DllPicProPanel.jsx`／`DllPicWorkspace.jsx`／`dllPicGenerationPresentation.js`：控制項、摘要與歷史名稱。
- `functions/test/comfyQwenLora.test.js`、`webapp/src/lib/qwenLoraIntegration.test.js`：新增 9 項專項回歸。

## 本機驗證

- Node22 前端 1766/1766、lint、build 通過；Node24 Functions 106/106、lint 通過。相關前端 18/18、Functions 15/15，含既有 Asian Mix／MOSS 回歸；diff-check 通過。
- 建置保留既有大型 chunk、靜態／動態 import 重疊提示。首次 build／dev 因沙箱不能寫 main worktree 的 dist／監聽本機連接埠失敗，經既定權限流程重跑成功；沒有更動依賴或安全設定。
- URL：`http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1`。Chrome 1440×1000／390×900，現行五工作區（Prompt 工作台、角色建模、場景建模、DLL、Saved Cards）與三快速面板通過；動作姿勢獨立分頁已由主線退休，未重新啟用。
- 驗證預設關閉／0.7、方向鍵 0.05 刻度、0 有效、空白／1.2 停用、INT8 隱藏、MOSS 固定強度。Qwen 0.65 和 Asian Mix 0.4 切換後各自保留。
- 以普通杯子文字建立 0.55／Seed42／兩張的模擬任務，草稿改為 0.7，已排入任務仍 0.55；觀察 loading → 成功兩張（Seed42、43）。歷史沿用及 reload 恢復 0.55；快速面板帶入完整版保留 Qwen LoRA 設定。
- 各工作區無頁面水平溢出或破圖，最後 console warning/error 空；手機控制可操作，無可見重疊。證據：[桌面](../reports/comfy-qwen-lora-2026-10-21/desktop.png)、[手機](../reports/comfy-qwen-lora-2026-10-21/mobile.png)、[快速面板](../reports/comfy-qwen-lora-2026-10-21/mobile-quick.png)、[檢查紀錄](../reports/comfy-qwen-lora-2026-10-21/checks.json)。
- 模擬圖片是既有測試素材，並非杯子 Prompt 或此次 LoRA 的實際輸出。未新增付費生成。

## 雲端驗證與交付界線

先前 Cloud GUI 的相同成人著衣 Prompt／Seed42／1024² 對照已成功，LoRA 強度 0.7；本次僅承接該固定檔案及接線，不把 GUI 成功等同 DLL API 驗收。詳細權重載入日誌、不同尺寸／強度效果及實際扣額不在已驗證範圍。

正式交付後需更新四項 Functions：`comfyCloudSubmit`、`comfyCloudWorkspaceSubmit`、`comfyCloudStatus`、`comfyCloudQuota`。尚未部署時舊後端會拒絕新 variant，不能直接用正式站驗收。發布及真實 DLL API 私有模型可見性、生成、扣額、圖片下載另待授權與驗證；本次不包含 Turbo／Viggle。

## 交付授權

使用者於本機整合回報後確認「可以，請先幫我 commit/push 到 main，再部署這四個 Firebase Functions」。提交範圍為本規格列出的 Qwen LoRA 程式、專項測試、狀態／QA 文件與四份瀏覽器驗收證據。沿用本批已通過的完整驗證；未再更動程式。main 推送會觸發既有 Pages 流程，部署與線上檢查結果另補記；本次不新增付費生成。

## 後端部署結果

2026-10-21 16:56（台北）核對完成。功能提交 `fe28d86d1437865a766ae160ea3d3d8d9c504abf` 已推送 origin/main，隨後 Firebase CLI 回報四項 update operation 成功及 Deploy complete。

- `comfyCloudSubmit`、`comfyCloudWorkspaceSubmit`、`comfyCloudStatus`、`comfyCloudQuota` 均為 ACTIVE、nodejs24、us-central1。部署雜湊更新為 `40c6e241d0738059d08ee0187c6a516c5e0b958b`；僅 source／hash／labels 改變。
- 四項 Secret 綁定、應用環境、CPU／記憶體／timeout／instances／concurrency／service account／ingress 保留；其他七項 Functions 完整 metadata 與部署前一致。[部署摘要](../reports/comfy-qwen-lora-2026-10-21/functions-deployment.json)。
- 四項匿名 POST 均回401／UNAUTHENTICATED；正式站 Origin 的 OPTIONS 均回204及正確 allow-origin，共8項通過。[健康檢查](../reports/comfy-qwen-lora-2026-10-21/functions-smoke.json)。未送出圖片生成或耗用 Comfy 額度。
- CLI 提示 firebase-functions 套件有新版，未擴大本批範圍升級依賴。main 推送會執行[CI 與 Pages 發布](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/workflows/deploy.yml)，其成功與否需另以對應 run 確認。
- 以上證明後端部署、配置保留及公開端點保護；登入後使用私人 LoRA 的實際 API 出圖、扣額、下載仍待獨立驗收。
