# Comfy Cloud 接入 DLL_PIC Pro v1

日期：2026-10-05。狀態：新帳號後端權限已部署，兩模型各一張 1K 真實驗收通過；使用者已授權本批 commit／push 及既有流程前端發布，交付狀態以 Git／Actions 核對為準。

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

Firebase 登入及 email allowlist 同時適用提交與查詢。2026-10-05 使用者授權加入 `nailai7981.ai@gmail.com`，預設保留 `cooperfu.615@gmail.com`；明確設定的 `ALLOWED_FIREBASE_EMAILS` 仍優先。相同限制適用下載 fallback。前端收藏權限不再自動登出共用 Firebase session；未獲收藏同步權限的帳號保持登入、Favorites 僅存本機，Firestore 收藏規則不變。API key 僅由 `COMFY_CLOUD_API_KEY` Secret 提供，不進入瀏覽器。Firestore Admin 確認 default app 已初始化（token 驗證的 named app 不代替 default），使用 `comfyCloudJobs/{uid}/requests/{requestId}` 原子認領；記錄狀態、provider job ID、self link 與生成 metadata，不記錄 Prompt。現有 Firestore rules 未開放此集合給客戶端，查詢只能走 callable，並綁定登入 uid。

提交使用 `POST https://cloud.comfy.org/api/v2/jobs`、Bearer token、`Idempotency-Key`，body 僅含 `{ workflow }`。同 request ID 不會再次 POST；查詢遵循服務回傳的 self link，限制 HTTPS cloud.comfy.org 的 jobs 路徑並拒絕 redirects，避免 token 轉送。

瀏覽器提交前保存 `{requestId, uid, modelKey, createdAt}` 至新的 `dll_pic_pro_comfy_pending_v1`。成功取得圖片、拒絕、失敗、取消或到期後清除；已完成卻缺少最終圖片、網路錯誤、等待逾時（約 30 分鐘）保留，可按「查詢上次任務」。重新整理或切工作區後亦可續查。另一帳號不能直接接管追蹤。

Comfy v2 的 Idempotency-Key 是單次認領而非結果重播。若提交成功卻遺失回應、或服務／資料庫中斷使 job ID 未成功保存，後端保留 uncertain；不會自動重送。此時請在 Comfy Cloud 作業佇列確認。按「結束追蹤」只清除本機追蹤，需明確確認；不取消雲端任務、不退額度，也不刪除伺服端認領。

僅取最終輸出節點的 image 類型，沿用 `{images, errors, meta}` 回應。實測 Job Output 及 Asset 的 `content_type` 可能是空字串；僅對最終節點的 image 資產，按匹配 Asset 的 `.png` 檔案路徑推定 `image/png`，拒絕明確非圖片 MIME 或無法辨識的檔案。Job Output 的 `url` 是需 Bearer 金鑰的 content route，不能直接當瀏覽器圖片網址；成功後由伺服端以 asset ID 查詢 `GET /api/v2/assets/{id}`，取 Asset 的簽名 `url` 及其 `url_expires_at` 回傳。Job Output 的到期欄位是任務保存期限，不能當作簽名網址期限。Asset 查詢失敗保留任務供續查，不重新生成。網址具有期限，成功後應下載保存。瀏覽器下載遇到 CORS 時沿用既有受登入及遠端位址限制保護的下載 proxy；兩模型 1K 原圖均已透過實際 UI 下載驗證，未另行繞過下載流程。任務記錄目前不自動清除，日後可另行規劃保留政策；不可過早移除認領，以免舊請求重新扣費。

## 啟用與驗收狀態

使用者於 2026-10-04 授權繼續 Secret 設定、兩個 Functions 部署與各模型一張 1K 驗收。使用者已回報本機 Secret 設定成功；僅部署上述兩個 Functions，Firebase 回報成功，遠端清單確認均為 ACTIVE，位於 `us-central1`，綁定 Secret version 1。未讀取 Secret 值。正式前端已可選兩個模型。

2026-10-05 使用者授權加入新帳號的生圖／下載權限並保留原帳號，已部署兩個 Comfy callable 與 `magnificDownloadImage`。新帳號透過 localhost 的實際 Firebase 登入驗收；收藏仍僅存本機，不讀寫原帳號雲端卡片。default Admin app 初始化、真實空 MIME 回應及缺圖片續查修正均已驗證。

同一中性紅色馬克杯 Prompt，每模型僅提交一次，無 LoRA、無改寫、1K／1:1／一張：

| 模型 | Job ID | Seed | 結果 |
| --- | --- | --- | --- |
| Z-Image-Turbo | `8c284fb5-97ee-4b87-a368-d72e4aef91c3` | `44094747575631` | 1024×1024 PNG，預覽／放大／下載通過；修正後只續查同一 job |
| Qwen-Image-2.1 | `f634b450-8cf8-420b-bf7f-16993d136b2c` | `117363328541623` | 1024×1024 PNG，預覽／放大／下載通過；完整 App 桌面及手機續查通過 |

下載檔：`/Users/cooperfu/Downloads/dll_pic_pro_1791132052123_1.png`（Z）、`/Users/cooperfu/Downloads/dll_pic_pro_1791132179660_1.png`（Qwen）。未量測扣額度數字、其他比例／2K 或 GUI 同 seed 效果一致性。Functions 45/45、前端 1270/1270、雙端 lint、前端 build 通過。1440×1000／390×900 五工作區與新帳號登入顯示檢查正常，完整 App 沒有 console error；127.0.0.1 未列在既有 Firebase Auth 授權網域，實際登入採 localhost，未更動遠端網域。使用者已於 2026-10-05 授權本批 commit／push；前端登入／追蹤補正採既有 GitHub Pages 流程發布，交付以實際 Git／Actions 核對為準。部署提示 Node.js 20 將於 2026-10-30 停止部署支援，升級另行安排。

以下為可重用的啟用流程；Secret、後端及兩張 1K 驗收已完成，前端發布及額外測試依下列範圍另行安排。

1. 用付費 Comfy Cloud 帳號至 `https://platform.comfy.org/profile/api-keys` 建立 API key，透過本機終端設定 Secret，勿貼在對話、前端或版本庫：`firebase functions:secrets:set COMFY_CLOUD_API_KEY --project virtualphotographystudio`。
2. 確認既有 Firebase project、Firestore、Functions 計費與執行 service account 的資料庫權限；email allowlist 沿用現有規則。無需更新 Firestore 客戶端 rules 或新增 index。
3. 部署 `firebase deploy --only functions:comfyCloudSubmit,functions:comfyCloudStatus --project virtualphotographystudio`；再依專案既有流程發布前端。
4. 登入 DLL 使用帳號；Z / Qwen 各以 1K、一張測試，驗證排隊→完成、真正圖片預覽與下載、seed／尺寸、額度消耗。其他比例與 2K 的額外付費測試須另行授權。
5. 驗證模型檔案與節點在帳號的 Cloud API 上可用，且與 GUI 效果一致；GUI 能執行不等同 API 已驗收。再測重新整理續查、額度不足、無效 key、失敗、到期，以及時間不明的提交回應。若需修改模板，先依原圖控種子比較，不啟用 Prompt Rewriter 或 LoRA。

## 驗證與官方依據

Functions：`npm test`、`npm run lint`。前端：專項 provider／DLL／續查測試、`npm test`、`npm run lint`、`npm run build`。瀏覽器依 `frontend-visual-validation.md` 驗證 1440×1000、390×900 的六工作區，以及登入錯誤、模擬排隊／完成／失敗、4:5 固定來源與續查狀態。模擬流程不消耗 Comfy 額度，不能代替真實帳號出圖驗收。

採用 HTTP API，未新增 SDK 相依套件。依據：[v2 Overview](https://docs.comfy.org/api-reference/v2/overview)、[官方 OpenAPI v2](https://github.com/Comfy-Org/docs/blob/main/openapi-v2.yaml)、[API workflow 格式](https://docs.comfy.org/development/api-development/workflow-api-format)、[SDK 文件](https://docs.comfy.org/development/api-development/sdks)。API 與節點可用性可能更新，部署前應再次核對。
