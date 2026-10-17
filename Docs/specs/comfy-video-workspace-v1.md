# Comfy Cloud 圖生影片工作區 v1

狀態：2026-10-17 已提交、推送並部署兩個新 Functions；本機／模擬驗證完成，真實付費影片仍待驗收。

## 核准範圍與操作

使用者核准 Wan 3.0、MiniMax H3 圖生影片與大面積彈出工作區。依已確認示意圖保留既有淺色、圓角及藍色主操作：左側來源圖片／影片結果與同來源結果列表，右側模型、動作、運鏡、秒數、解析度、額度與生成。

1. DLL 生成圖卡或圖片放大視窗按「製作影片」。
2. 填寫必填動作、選填運鏡；運鏡捷徑會替換運鏡欄位，仍可自行編輯。
3. 選模型、秒數、解析度；模型切換保留文字，調整不相容設定並提示。
4. 一次一支影片。準備／提交／生成時鎖定設定；關閉視窗不取消雲端作業，任何工作區都能從浮動入口返回。
5. 完成後播放、下載 MP4、重新取得過期連結。同張來源再次生成保留先前結果可比較；換來源會開啟新的結果集合，非跨圖片影片資料庫。
6. 瀏覽器重新整理後登入原 Firebase 帳號，從本機追蹤資料續查。未知提交結果只能查詢，不自動重送；來源及草稿儲存失敗時不送付費請求。

桌面最大寬 1120px、最高 92dvh，約 60/40 雙欄並允許內部捲動。820px 以下採全螢幕單欄，預覽→結果→設定，生成按鈕固定底部並保留內容空間。具有背景 inert、Esc 關閉及焦點返回；沿用 lucide 圖示。

## 模型契約

以核對當日官方 ComfyUI API node schema 為準，沒有將示意數字當成真實模型規格。

| 模型 | 節點 | 秒數 | 解析度 | 音訊 |
| --- | --- | --- | --- | --- |
| Wan 3.0 | `Wan3ImageToVideoApi` / `wan3.0-video` | 2–30，預設 5 | 480P、720P、1080P；預設 720P | 預設關閉，可於更多設定開啟 |
| MiniMax H3 | `MinimaxHailuo03FirstLastFrameNode` / `MiniMax H3` | 4–15，預設 5 | 768P、2K；預設 768P | 節點固定生成音訊，沒有關閉開關 |

- 本版只有 first-frame image-to-video，不提供文字生影片、尾幀、影片編輯或其他模型變體。
- 動作與運鏡原文以換行合併，不額外改寫 prompt。Wan 的 `model.prompt_extend=false`，比例 `adaptive`。
- 原圖轉 PNG，不 resize／crop。至少 256×256、最大邊 8192、最多 32 Mi pixels、比例 0.4–2.5；PNG 上限 8 MiB。來源讀取上限 25 MiB。
- 輸出固定 SaveVideo → MP4 / H.264。DynamicCombo 欄位是 `format.codec`、`format.codec.encoding`。
- 共用契約位於 `functions/src/videoModels.json`；模型表與費率由前後端共用。

## 額度

顯示剩餘 Credits、本次預估、估計可生成支數、重新整理及更新時間。查詢失敗保留同設定上次數值並顯示錯誤；未知額度不是零。

2026-10-17 公開標準費率：Wan 480P/720P/1080P 每秒 15.09/30.17/60.35 Credits；H3 768P/2K 每秒 27.16/39.22 Credits。`floor(max(0, balance) / (seconds × rate))` 為估計支數，不套用已結束活動折扣。介面說明可能另有工作流執行費，實際扣額另驗收。生成完成後自動重新查詢，也可手動更新。

## 程式與資料流

- `DllPicProPanel.jsx`：兩個圖片入口；既有圖片輸出契約不變。
- `VideoWorkspace.jsx`、`styles/videoWorkspace.css`：全域工作區、播放、表單、額度及手機版。
- `videoWorkspaceController.js`：單作業、狀態輪詢、帳號隔離、重載恢復、跨分頁 Web Locks。
- `videoWorkspaceStorage.js`：每 uid 的 IndexedDB `dll_video_workspace_v1`；同步 localStorage marker `dll_video_pending_v1:${uid}` 只有追蹤 ID、來源 ID、uid、時間，不含 prompt、圖片或連結。新命名空間不改既有 Saved Cards。
- `comfyVideoClient.js`：PNG 準備、Firebase callable、已驗證分段下載與 MP4 合併。
- `functions/src/comfyVideo.js`、`comfyVideoFunctions.js`：固定圖、帳號來源與作業歸屬、上傳／提交／查詢／額度／下載。

圖片 → PNG → Firebase `prepare` → Comfy v2 `/assets` → 帳號來源記錄 → Firebase `submit` → `LoadImage(core/ASSET) → 模型 → SaveVideo` → `/jobs` → `/jobs/{id}` → final node 3 video asset → `/assets/{id}` 新鮮簽名連結。

新增 Functions（沿用 Node 24、us-central1、現有 allowlist 及 `COMFY_CLOUD_API_KEY`）：

- `comfyCloudVideo`：callable，`prepare / submit / status / quota` 四種操作。
- `comfyCloudVideoDownload`：POST，驗證 Firebase bearer ID token、allowlist、expectedUid 及帳號所屬的完成作業。

Firestore 新集合 `comfyCloudVideoJobs/{uid}/requests/{id}`，由 Admin 寫入；不增用戶端 Firestore 權限，不改原生圖集合。先以交易 claim 作業再付費提交；相同 requestId 後續僅查詢。409、逾時、網路中斷與 5xx 保留 uncertain。只有明確拒絕／失敗／取消／過期／成功才清除待查詢標記。Provider 錯誤不回傳可能含 prompt 或 Secret 的原始內容。

下載每次最多 6 MiB、總上限 250 MiB：伺服器重新取得 owned asset URL，驗證公開 DNS，無憑證取得 Range，檢查 Content-Range／大小／完整 bytes；瀏覽器確認所有分段來自同一 asset 才建立 MP4。避開 Functions streaming 10 MB／非 streaming 32 MB 單次回應限制。若 CDN 不接受 Range、影片過大或已過期，提示到 Cloud 確認，不提供任意 URL 代理。

## 本機驗證

- 前端 Node 22.22.3：完整 `npm test` **1644/1644**；lint、build 通過。最初 PATH 誤用 Node 25 造成兩個報表 TAP 字樣斷言失敗；未改測試，在指定 Node 22 重跑全過。原 HEAD 的獨立 runner 10/10 亦通過。
- Functions Node 24：完整測試 **82/82**、lint 通過。新測試覆蓋固定圖、參數、來源上傳、帳號歸屬、重複提交、未知回應、影片輸出、費率、下載分段完整性及匿名／非允許帳號／UID 不符阻擋。
- 前端新專項 **7/7**：草稿切換、同圖多結果、斷線重載只查詢、儲存／跨頁鎖阻擋、帳號切換、背景續跑、下載合併。
- 真實本機 app：1513×1039 示意圖比對、1440×1000、390×900、819/821×1000 斷點；圖卡與 lightbox 入口、模型切換、匿名停用、文字、Esc／焦點、跨工作區返回；五工作區 desktop/mobile smoke 無頁面水平溢出或破圖。
- 獨立暫時 harness 使用真實 controller/view 與本機 mock，不呼叫外部生成：排隊→完成、關閉續跑、兩模型結果比較、原生播放、MP4 下載、斷線重載、失敗保留設定、額度失敗保留上次數值。下載檔 SHA-256 與 fixture 一致。Harness 與測試影片已移除，不打包到正式頁面。
- 模擬影片僅 2 秒靜態 fixture；UI 的 5 秒是送出設定，不代表測得供應商真的產生 5 秒。模擬額度 4000 只存在測試頁。
- 保留既有 Vite 大型 chunk／Firebase 靜動態載入提示；不擴修依賴或 prompt。
- 截圖見 [驗證資料夾](../reports/comfy-video-workspace-2026-10-17/)，視覺比對見根目錄 `design-qa.md` 本批附錄。

## 後續部署與真實驗收

使用者另行授權後已完成 commit／push 及兩個新 Functions 部署，詳見下節。未讀取 Secret 值、沒有雲端圖片上傳或付費影片作業。後續各選一張圖片，以模型預設 5 秒與預設解析度各驗一支，確認權限、節點可用性、v2 asset 上傳、實際影片內容／音訊／長度、額度差、Cloud 作業可見性、關閉續查、播放及真實 CDN Range 下載。

尚未確認的提交結果會持續保留追蹤並阻止新付費提交；若未取得 jobId，需先至 Comfy Cloud 核實再處理，不提供一鍵重送。來源與結果集合只保留在此瀏覽器，不是跨裝置雲端影片庫；簽名連結和 Cloud 作業有保存期限，請下載保存。

## 官方依據

- [Wan 3.0](https://docs.comfy.org/tutorials/partner-nodes/wan/wan3-0)、[MiniMax H3](https://docs.comfy.org/tutorials/partner-nodes/minimax/minimax-h3)、[Partner node pricing](https://docs.comfy.org/tutorials/partner-nodes/pricing)
- [Comfy API v2](https://docs.comfy.org/api-reference/v2/overview)、[OpenAPI v2 schema](https://github.com/Comfy-Org/docs/blob/main/openapi-v2.yaml)
- [Wan schema](https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_api_nodes/nodes_wan.py)、[MiniMax schema](https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_api_nodes/nodes_minimax.py)、[SaveVideo schema](https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_extras/nodes_video.py)
- [Cloud Run functions quotas](https://docs.cloud.google.com/functions/quotas)


## 正式部署紀錄（2026-10-17）

- 功能提交：[`c18f7ba`](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/commit/c18f7badf4ef4f6ba64fc057285b71f13d9906df)，已先推送 `origin/main` 再部署。只提交本批24個程式／規格／截圖檔，其他未追蹤資料保留。
- 明確指定 `virtualphotographystudio` 與 `--only functions:comfyCloudVideo,functions:comfyCloudVideoDownload`，Firebase CLI 15.17.0、Node 24 執行部署；兩項 Successful create，CLI exit 0。完成時間約台北 22:57。

| Function | revision | 驗證結果 |
| --- | --- | --- |
| `comfyCloudVideo` | `comfycloudvideo-00001-qil` | Node24 / GEN_2 / ACTIVE / 最新 revision 全量流量 |
| `comfyCloudVideoDownload` | `comfycloudvideodownload-00001-piz` | Node24 / GEN_2 / ACTIVE / 最新 revision 全量流量 |

- 兩項均 512Mi、120秒、maxInstances 2、`COMFY_CLOUD_API_KEY` version 1。共用 Cloud Build `1b099d94-bc72-4e2d-afa6-5051dc7cd670`。未存取 Secret 值。
- 部署前後清單由7項增至9項；原七項的所有清單 metadata 深度比較完全相同，沒有重新部署或設定變動。未部署 Firestore rules、indexes 或其他 Functions。
- 正式網址匿名空資料 POST：兩項皆 HTTP401，callable 回 UNAUTHENTICATED，download 回「請先登入」；兩項均有正式 Pages origin CORS。確認容器載入、handler 與匿名保護，不代表登入後的 Comfy API／Firestore／扣額／影片下載已驗收。
- 部署前 Functions 82/82、lint 與 staged diff-check 通過；沿用上一節已完成的前端／視覺驗證。CLI 提示 firebase-functions 有新版，本批未升級依賴。
- 永久證據：[部署 metadata](../reports/comfy-video-workspace-2026-10-17/deployment.json)、[匿名 smoke](../reports/comfy-video-workspace-2026-10-17/deployment-smoke.json)、[既有服務比較](../reports/comfy-video-workspace-2026-10-17/deployment-comparison.json)。
- 後續驗收仍為：兩模型各一支，確認節點權限、圖片上傳、真實影片、扣額、Cloud 可見性、播放與 CDN 分段下載；部署不會自動送出付費作業。
