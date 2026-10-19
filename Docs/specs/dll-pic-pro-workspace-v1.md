# DLL_PIC Pro 完整版第一版

Status: 使用者本機驗收通過，已授權 commit／push；交付功能分支，暫不部署。
Date: 2026-10-19

## 目的與範圍

依使用者核准的介面示意，新增獨立 DLL_PIC Pro 分頁，保留 Prompt 工作台、角色建模、動作姿勢、場景建模的原快速面板。桌面左側設定、右側成果、成果下方任務清單；手機以設定／成果切換，任務清單保留。

- 帶入 Prompt 工作台現行六組輸出；其他工作區帶入各自實際來源。
- 可編輯本次 Prompt、貼上自訂文字、還原來源；不回寫 Prompt engine 或原工作區選值。
- 模型、比例、解析度、1／2 張；Comfy 模型可指定 Seed，第二張使用 Seed + 1，仍受模型原有限制。
- 立即生成、加入待生成、依序執行、暫停下一筆、取消待執行、已提交作業請求取消、查詢不確定作業。
- 本次／歷史成果、生成快照、沿用設定／單張 Seed、圖片下載、大圖與雙圖比較。
- SeedVR2 提升解析度：2／4 倍、保留原圖及父子關係，8192 邊長與約 32 MP 上限；費用未估算。
- 既有圖生影片入口沿用，不改影片工作流。
- 不含任意工作流編輯、LoRA 編輯、參考圖生成、平行大量生成或雲端歷史匯入。

## 操作流程

1. 直接開啟 DLL 分頁，或從快速面板按「開啟完整版」。已有草稿時不自動覆蓋；按「帶入來源」才更新，自訂文字被取代前確認。
2. 選來源或編輯本次文字，設定模型、比例、解析度、張數與 Seed。胸上／全身等來源維持固定比例；不相容模型阻止提交。
3. 立即生成，或將多筆不同設定加入清單後開始。每筆快照不受之後修改影響。暫停讓當筆結束，停止下一筆；失敗、部分完成、不確定狀態也停止後續。
4. 選圖查看、比較、下載；或沿用快照／Seed 建立新的生成設定。
5. 提升解析度另建任務，不覆蓋原圖。完成後可比較原圖與放大版本。

## 程式與儲存

- `webapp/src/components/DllPicWorkspace.jsx`：主工作區、成果、清單、放大操作。
- `DllPicProPanel.jsx`：快速／完整共用輸入，保留原按鈕與 API Key 儲存。
- `DllImageViewer.jsx`、`DllDialog.jsx`：大圖、比較、焦點圈限、Escape、縮放、拖曳、雙指縮放處理。
- `webapp/src/lib/dllWorkspaceController.js`：可注入依賴的狀態機；`dllWorkspaceRuntime.js`：既有 provider 與新雲端服務接線。
- `dllWorkspaceStorage.js`：IndexedDB `dll_pic_workspace_v1`，`tasks` 以 `[owner,id]` 為鍵、`drafts` 依 owner 保存。owner 為 Firebase UID 或 anonymous。
- 圖片保存實際 data URL、尺寸與 immutable 生成快照；不依賴短效雲端 URL。單圖 40 MiB 保護。保存在目前瀏覽器，沒有跨裝置同步或自動永久備份；重要成果仍需下載。
- 不把 API Key 寫入任務／草稿。既有 API Key、Comfy pending key、Saved Cards schema 與六輸出欄位不改。
- `dll_pic_workspace_execution_v1` Web Lock 序列化生成及閒置時的取消待執行／刪除／結束追蹤。執行前重讀資料，防止舊分頁重送已開始的工作。另一分頁更新後需重新載入取得最新清單。
- 先持久化任務才提交；先保存第一張實體圖片再送第二張。已提交狀態重開後只查詢，未提交清單需手動開始。恢復查詢不丟棄已保存但雲端連結過期的原圖。
- 不確定作業不自動重送。Google／xAI 沒有本批實作的查詢 API，需先到供應商核對；明確確認後可結束本機追蹤，再手動新建任務。

## 雲端契約與待部署項目

新增 `comfyCloudWorkspaceSubmit`，讓指定 Seed 呼叫與舊部署 handler 分開，避免舊 handler 靜默忽略 Seed。隨機 Seed 沿用 `comfyCloudSubmit`，狀態沿用 `comfyCloudStatus`。

新增 `comfyCloudImageWorkspace`，接受 prepare／submit／status／cancel。放大使用 per-user `comfyCloudUpscaleJobs`；一般圖片取消以原圖片 store 查找擁有者作業。沿用 allowlist、expectedUid、Secret；固定工作流，不接受客戶端任意節點。Firestore claim 在付費提交前建立，相同 request ID 重試只查詢，HTTP 409 仍屬待確認。

`functions/src/comfyImageWorkspace.js` 使用官方 [SeedVR2 7B INT8 模板](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/utility_seedvr2_7b_int8_upscale_image.json)，並核對官方 ComfyUI 的 ResizeImageMaskNode 與 SeedVR2 節點輸入。官方模板提醒 Cloud 穩定版可能落後 nightly；**目前帳號的節點／模型可用性、付費出圖、時間、扣額、畫質與取消最後狀態尚未實測**。

本批未部署任何 Functions，因此一般本機網址中的新 Seed／放大／取消功能尚不具備正式雲端服務。不要把模擬成功視為雲端驗收。既有一般生成仍連既有服務，會依原方式使用 API 額度。

## 本機驗收入口

- 一般：http://127.0.0.1:5175/Virtual_Photography_Studio/
- 不扣生成額度的模擬：http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1

模擬模式限 Vite DEV，動態載入 `dllWorkspaceAcceptance.js`，使用獨立 `dll_pic_acceptance_v1`。生圖與放大只回傳既有本機角色圖片，不產生真實放大像素；影片按鈕停用。Production build 不包含此模擬程式。Prompt 加上 `[offline]` 可測試中斷，重新開啟以模擬查詢恢復。

## 驗證紀錄

- 前端 Node 22.22.3：完整 1677/1677、lint、build 通過；包含 controller 16 項、Comfy client 18 項。直接以此 Node 執行 package scripts 的相同入口，避免環境 npm 選到其他 Node。
- Functions Node 24.19.0：91/91、lint 通過。新測試含倍率上限、Seed、來源擁有者 store、先 claim、遺失回應不重送、取消、成果 asset 與相同 request ID 查詢。
- 最初未鎖定 runtime 的一次前端執行有 2 項既有 TAP 報表字樣斷言失敗；指定 Node 22 後全過，未改測試斷言。Build 保留既有大型 chunk 提示。
- 桌面 1440×1000、手機 390×900，及 819／821、1099／1101 斷點檢查：七工作區導航；DLL 設定／成果、雙圖／父子圖、縮放按鈕、重載保存、四個快速入口帶入、固定比例及不相容禁止、沿用 Seed、清單暫停／取消待執行、中斷查詢恢復通過。無 document 水平溢出、破圖或最後紀錄的 console error/warning。
- 大圖支援雙指縮放處理，但本次自動化只驗證滑鼠／鍵盤與手機尺寸，實體觸控手勢待使用者驗收。
- 下載按鈕觸發無頁面錯誤；內建瀏覽器未回傳 download event／實體檔案路徑，**尚未確認此次下載落盤**，請使用者在一般瀏覽器驗收。沿用既有有測試覆蓋的下載 helper，未以 UI 無錯誤冒充實檔成功。
- Saved Cards 僅查看原 9 張，未新增、套用、刪除；原工作區選值未為測試調整。模擬任務保留供驗收。
- 截圖見 [驗收證據目錄](../reports/dll-workspace-v1-2026-10-19/)，視覺對照結論見根目錄 `design-qa.md` 本批附錄。

## 使用者驗收與 Git 交付

2026-10-19，使用者回覆「實際測試沒問題，可以 commit/push」，確認本機版本並授權提交／推送。上方下載／觸控項目保留為代理自動化證據的限制，不推定使用者逐項回報的測試細節。

本批交付 `origin/codex/dll-pic-pro-workspace-v1`，不合併 main，避免觸發 main 的 GitHub Pages 自動部署；不推送第二個 remote。新增 Functions、真實付費 Cloud 功能與圖像品質仍需另行授權／驗收。Git 交付結果以提交與遠端 SHA 為準。
