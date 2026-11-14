# MiniMax H3 Image 接入 DLL v1

日期：2026-11-14。狀態：本機實作與驗收完成；使用者已授權 commit／push 到 main 並部署四個相關 Functions，交付結果以 Git／Firebase 回讀為準。

## 使用者核准範圍

- 新增獨立選項 `Comfy Cloud · MiniMax H3 Image`；前端 `comfyMinimaxH3Image`、後端 `minimaxH3Image`。
- 沿用[單張真實 API 測試](../reports/minimax-h3-image-4mp-2026-11-14/README.md)的固定 2048 × 2048（約 4 MP）。只提供 1:1，沒有擴充其他比例或 16 MP。
- 內部沿用 `2k` 儲存／API 值（方形 2048 邊長），此模型介面專屬標示「4 MP（2048 × 2048）」，不改其他模型解析度名稱。
- 6 steps、CFG 1、LCM s_noise 1.1 → 0.9、noise_clip_std 0、simple／denoise 1；無 LoRA、無擴寫、無參考圖節點。直接傳入 DLL Prompt，僅沿既有 trim。
- 預設 1 張、可選 2 張；每筆 Cloud job 固定一張，先取得並交付第一張圖片才提交第二張。指定 Seed 時第二張 +1，其他原有隨機／續查機制不變。
- H3 選取期間有效比例固定 1:1，切回其他模型保留原比例選值。既有已選臉部參考圖不傳給 H3。
- 沿用預覽、下載、歷史、設定還原與 Comfy 額度。未新增金鑰、Function 或帳號設定。

## 維護來源

- `functions/shared/imageProviderContract.json`：模型契約與顯示名稱。
- `functions/src/comfyWorkflows/minimaxH3Image.json`：12 節點固定 API 模板，測試 Prompt／Seed 已移除。
- `functions/src/comfyModels.js`：Prompt、尺寸、noise_seed、輸出 node 34 的映射。
- `functions/src/comfyCloud.js`：缺省比例為 1:1；明確傳入不支援比例／解析度仍拒絕。
- `webapp/src/lib/dllPicProClient.js`、`dllPicGenerationPresentation.js`、`components/DllPicProPanel.jsx`：共用選單、4 MP 標示與固定比例。

## 驗證

- Functions 全部 142/142 與 lint 通過；專項覆蓋模型、編碼器、VAE、尺寸、採樣、無參考／擴寫、非法參數拒絕及最終圖片節點過濾。
- 前端完整測試 2307 項：初跑 2305 通過、2 失敗，分別為新增模型的選單預期及 C2 歷史來源精確指紋。已修正並分別通過聚焦重測；未將初跑寫成全綠。
- 選單測試對 H3 使用固定方形／2k 契約；全模型序列測試改從各模型契約取得合法測試尺寸，不再假設每個模型支援 1k／4:5。
- C2 只追加本次三個已檢閱檔案（DllPicProPanel.jsx、dllPicProClient.js、dllPicProClient.test.js）的 SHA-256；保留原 before／after、歷史 commit 與斷言。歷史聚焦案例 1/1 通過，不重錄舊基準。
- 前端 lint／build 通過；保留原有 >500 kB chunk 警告。
- 127.0.0.1:5175 的 `?dllAcceptance=1`：1440×1000 與 390×900 檢查 H3 選單、固定 4 MP／1:1、預設一張、兩張模擬排隊／完成、Seed 20261114／20261115、圖片切換、reload 與沿用設定。
- 六工作區桌手機導航／渲染檢查，無新 console error 或頁面橫向溢位。Prompt 工作台快速面板亦確認 H3 可選。
- [桌面截圖](../reports/minimax-h3-image-4mp-2026-11-14/dll-desktop.jpg)、[手機截圖](../reports/minimax-h3-image-4mp-2026-11-14/dll-mobile.jpg)。圖片為既有模擬 fixture，並非本模型新生成成果；本輪整合驗收沒有付費請求。

## 發布與未驗收範圍

發布需同步前端與四個既有 Functions：`comfyCloudSubmit`、`comfyCloudWorkspaceSubmit`、`comfyCloudStatus`、`comfyCloudQuota`。目前尚未部署；前輪獨立 API 單張成功不等於正式 DLL 兩張端到端已通過。正式版提交、下載、扣額與保存待發布後另行授權實測。
