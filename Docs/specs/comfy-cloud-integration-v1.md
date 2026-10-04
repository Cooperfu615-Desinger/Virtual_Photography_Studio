# Comfy Cloud 接入 DLL_PIC Pro v1

日期：2026-10-04。狀態：本地實作；尚未部署或以使用者帳號實際出圖。

## 功能範圍

現有 DLL 模型清單新增 `Comfy Cloud · Z-Image-Turbo` 與 `Comfy Cloud · Qwen-Image-2.1`。沿用各工作區現有 Prompt 來源、預覽、放大與下載流程，不更動 prompt engine、Saved Cards 或歷史 public mappings。每次一張；1K / 2K 分別以約 1 / 4 百萬像素計算，寬高為 8 的倍數並維持精確比例；支援 1:1、4:3、3:4、16:9、9:16、4:5。這是工作流尺寸支援，尚不代表雲端各尺寸出圖已驗收。

Prompt 僅沿用既有外圍 trim；不移除 MJ 參數、不插入指令、不改寫內容。選擇 MJ 來源時其參數尾巴也會成為模型輸入，建議先以 Z-Image 或 Gpt 來源實測。

## 工作流來源與差異

伺服端模板位於 `functions/src/comfyWorkflows/`，來自使用者提供的 `image_z_image_turbo.json` 與 `image_qwen_image_2_1_t2i.json`；Downloads 原檔未修改。

- Z：移除未接線的 `62` LoRA 節點，保留模型、CLIP、VAE、AuraFlow shift、steps=8、cfg=1、res_multistep/simple 與最終 `9` SaveImage。
- Qwen：將 Prompt 直接填入 `459:452` TextEncodeQwenImage21；移除未啟用的 TextGenerate/CLIP/系統 Prompt、Switch、PreviewAny 分支。以伺服端計算寬高取代 ResolutionSelector，保留文字編碼 resolution=1024、QwenImage21Cache、steps=25、cfg=1、euler/simple 與最終 `461` SaveImageAdvanced。
- 每次生成使用安全整數隨機 seed，回傳 model、ratio、resolution、width、height、seed、jobId、assetId 與網址到期資訊。不開放使用者傳任意節點圖、LoRA、steps 或 cfg。

## 資料流與失敗處理

`DllPicProPanel` → `dllPicProClient` → `comfyCloudProxyClient` → Firebase callable `comfyCloudSubmit` / `comfyCloudStatus` → Comfy HTTP v2 API。

Firebase 登入及既有 email allowlist 同時適用提交與查詢。API key 僅由 `COMFY_CLOUD_API_KEY` Secret 提供，不進入瀏覽器。Firestore Admin 使用 `comfyCloudJobs/{uid}/requests/{requestId}` 原子認領；記錄狀態、provider job ID、self link 與生成 metadata，不記錄 Prompt。現有 Firestore rules 未開放此集合給客戶端，查詢只能走 callable，並綁定登入 uid。

提交使用 `POST https://cloud.comfy.org/api/v2/jobs`、Bearer token、`Idempotency-Key`，body 僅含 `{ workflow }`。同 request ID 不會再次 POST；查詢遵循服務回傳的 self link，限制 HTTPS cloud.comfy.org 的 jobs 路徑並拒絕 redirects，避免 token 轉送。

瀏覽器提交前保存 `{requestId, uid, modelKey, createdAt}` 至新的 `dll_pic_pro_comfy_pending_v1`。完成、拒絕、失敗、取消或到期後清除；網路錯誤、等待逾時（約 30 分鐘）保留，可按「查詢上次任務」。重新整理或切工作區後亦可續查。另一帳號不能直接接管追蹤。

Comfy v2 的 Idempotency-Key 是單次認領而非結果重播。若提交成功卻遺失回應、或服務／資料庫中斷使 job ID 未成功保存，後端保留 uncertain；不會自動重送。此時請在 Comfy Cloud 作業佇列確認。按「結束追蹤」只清除本機追蹤，需明確確認；不取消雲端任務、不退額度，也不刪除伺服端認領。

僅取最終輸出節點的 image 類型，沿用 `{images, errors, meta}` 回應。網址具有期限，成功後應下載保存。瀏覽器下載遇到 CORS 時沿用既有受登入及遠端位址限制保護的下載 proxy；真實網址的 CORS 與下載仍待雲端驗收。任務記錄目前不自動清除，日後可另行規劃保留政策；不可過早移除認領，以免舊請求重新扣費。

## 待執行的啟用步驟

以下操作會更動遠端環境，需另外授權；本次未執行。

1. 在 Comfy Cloud 建立 API key，透過本機終端設定 Secret，勿貼在對話、前端或版本庫：`firebase functions:secrets:set COMFY_CLOUD_API_KEY`。
2. 確認既有 Firebase project、Firestore、Functions 計費與執行 service account 的資料庫權限；email allowlist 沿用現有規則。無需更新 Firestore 客戶端 rules 或新增 index。
3. 部署 `firebase deploy --only functions:comfyCloudSubmit,functions:comfyCloudStatus`；再依專案既有流程發布前端。
4. 登入 DLL 使用帳號；Z / Qwen 各以短 Prompt、1K、一張測試，驗證排隊→完成、真正圖片預覽與下載、seed／尺寸、額度消耗，再測 9:16、4:5、2K。
5. 驗證模型檔案與節點在帳號的 Cloud API 上可用，且與 GUI 效果一致；GUI 能執行不等同 API 已驗收。再測重新整理續查、額度不足、無效 key、失敗、到期，以及時間不明的提交回應。若需修改模板，先依原圖控種子比較，不啟用 Prompt Rewriter 或 LoRA。

## 驗證與官方依據

Functions：`npm test`、`npm run lint`。前端：專項 provider／DLL／續查測試、`npm test`、`npm run lint`、`npm run build`。瀏覽器依 `frontend-visual-validation.md` 驗證 1440×1000、390×900 的六工作區，以及登入錯誤、模擬排隊／完成／失敗、4:5 固定來源與續查狀態。模擬流程不消耗 Comfy 額度，不能代替真實帳號出圖驗收。

採用 HTTP API，未新增 SDK 相依套件。依據：[v2 Overview](https://docs.comfy.org/api-reference/v2/overview)、[官方 OpenAPI v2](https://github.com/Comfy-Org/docs/blob/main/openapi-v2.yaml)、[API workflow 格式](https://docs.comfy.org/development/api-development/workflow-api-format)、[SDK 文件](https://docs.comfy.org/development/api-development/sdks)。API 與節點可用性可能更新，部署前應再次核對。
