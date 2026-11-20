# MiniMax H3 Image 接入 DLL v1

日期：2026-11-14。狀態：本機實作與驗收完成；使用者已授權 commit／push 到 main 並部署四個相關 Functions，交付結果以 Git／Firebase 回讀為準。

## 2026-11-21 比例與 4／8／16 MP（本機，後續核准）

本節覆蓋下方歷史版本的固定方形限制；其他官方核心設定不變。

- 八種比例：1:1、4:3、3:4、3:2、2:3、16:9、9:16、21:9。預設 1:1／4 MP／1 張，可選 2 張逐張生成。
- 解析度介面顯示 4 MP、8 MP、16 MP；內部值為 `2k`、`8mp`、`16mp`。保留舊 `2k` 的 4 MP 意義，歷史紀錄與草稿仍可還原。
- `functions/shared/minimaxH3ImageSizes.json` 是前後端共用的 24 組尺寸表。依官方 ResolutionSelector：MP × 1024²，按比例計算寬高，各自四捨五入到 32 的倍數。例如方形為 2048²、2912²、4096²；16 MP／9:16 為 3072×5472。
- 選單旁顯示實際輸出像素；後端驗證比例／解析度並傳給 conditioning。費用估算沿完整工作流尺寸匹配，不能拿 4 MP 樣本推算 16 MP。
- Prompt 原文、擴寫關閉、無參考圖保持不變。來源鎖定不支援的比例（如 4:5）仍禁止提交，不靜默改比例。
- C2 歷史回放新增本次精確逆向層，先還原本次三個前端來源，再套用既有 Seedream 5.5 逆向層；不改舊基準或歷史 manifest。
- 驗收紀錄：[尺寸選項本機驗收](../reports/minimax-h3-sizes-2026-11-21/README.md)。尚未發布，沒有付費生圖；8／16 MP 的真實耗時、扣額與效果待另行授權測試。

尺寸公式來源：[ComfyUI ResolutionSelector](https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_extras/nodes_resolution.py)。

## 2026-11-21 官方文生圖預設對齊（本機）

使用者要求直接替換現有版本，不新增模型選項。對齊當日官方 `image_minimax_h3_image_t2i.json` 的編碼器與核心採樣路徑：

- 主模型與 VAE 不變；文字編碼器改 `qwen3vl_32b_minimax_h3_int8_convrot.safetensors`。
- 用 `KSampler`／Euler／simple／6 steps／CFG 1／denoise 1 取代舊 LCM 自訂採樣鏈。DLL Prompt 直接接 conditioning；使用者另行確認關閉擴寫，該分支不提交。官方教學寫預設關閉，但本次實際下載 JSON 的 subgraph switch 為 true；此處依使用者選擇保留 DLL Prompt 原文，不宣稱與範本所有開關完全一致。
- 保留 2048×2048、無參考圖、1／2 張逐張生成及既有 modelKey；本次沒有新增官方範本的尺寸選擇、擴寫開關或圖片編輯介面，不稱為完整範本介面移植。
- API 圖精簡為 8 節點，seed 映射改 node 39 的 `seed`。保留輸出 node 34，舊任務仍可取回；舊工作流測試 fixture 原樣保留。
- 額度估算沿原本完整工作流比對：舊 LCM／NVFP4 樣本不符合新圖，不能沿用為新版估價。新版累積足夠相符成功樣本後才有估計張數。
- 下方 2026-11-14 設定及驗收保留為歷史。新設定尚未部署或付費實測，不以舊模型出圖結果代表新版效果。

官方來源：[文生圖範本](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/image_minimax_h3_image_t2i.json)、[官方教學](https://docs.comfy.org/tutorials/image/minimax/minimax-h3-image)。

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
