# DLL Seedream 5.5

2026-11-20，使用者核准獨立模型及 Cloud 節點全部可選設定；保留 Seedream 5.0 Pro。

## 模型與選項

- `comfySeedream55` / `seedream55`，固定官方 `ByteDanceSeedreamNodeV3` 的 `seedream 5.5`。基準 API 實測 2048×2048，單張成功，生成 29.255 秒，前後餘額差 USD 0.05005；不是 DLL 部署後驗收。
- 預設 2K、1 張、自動背景、浮水印關閉、隨機 Seed。可選 1／2 張，取得前張圖片後才送下一張。指定 Seed 時第二張 +1，提交前驗證最大 2147483647。
- 官方 1K／1.5K／2K 全部八種比例：1:1、3:4、4:3、16:9、9:16、2:3、3:2、21:9；保留 DLL 4:5，以 Custom 表達。尺寸來源 `functions/shared/seedream55Sizes.json`。
- 自訂寬高為 240～8594 偶數，總像素 921600～4624220，比例 1:16～16:1。來源固定比例時不可切換自訂尺寸。
- 背景 auto／opaque／transparent；PNG 保存。Seed、watermark 可調。Cloud 不提供 5.5 的 thinking、prompt_optimization、negative_prompt、batch 張數、LoRA 欄位，不送 5.0 的無效參數。
- 最多 10 張有序參考圖片，新增、預覽、前移、移除，零張為文生圖。Prompt 原文不加臉部身份前綴。每張圖片沿用 DLL PNG 準備限制：來源 PNG／JPEG／WebP ≤25 MB，256～8192 邊長、≤32 MP，比例 2:5～5:2，轉 PNG 後 ≤8 MB；不自動裁切。這是 DLL 上傳限制，不聲稱為模型本身的全部輸入上限。

## 資料流與安全

設定與參考圖沿用 IndexedDB 任務／草稿保存；清單摘要移除參考圖資料，選取歷史才載入完整任務。參考圖不放入 localStorage 的中斷追蹤標記。圖片逐張以既有 `comfyCloudImageWorkspace` prepare 上傳；`comfyCloudWorkspaceSubmit` 只接受目前帳號 sourceStore 的 IDs，不接受任意 asset URL／工作流。參考圖保持選擇順序綁到 model.images.image_1～10。

前後端共用純設定／計價函式 `functions/shared/seedream55.mjs`。預估 USD：≤2601123 像素 0.0286，以上 0.05005；每張參考圖 +0.01144，每張輸出都計入，Credits 用目前 DLL 211/USD。額度區顯示按目前尺寸／參考圖數估計的可生成張數，非保證扣額。

## 驗證與交付

需 Functions 全測試／lint、前端全測試／lint／build、共享契約及 UI 桌手機驗證。歷史 C2 的 DLL context 以獨立 `seedream55Replay` 精確逆轉至修改前 HEAD；不改原封存、未知內容仍拒絕。

本次實作不含 commit、push、部署或額外付費生圖。待部署 Functions：comfyCloudSubmit、comfyCloudWorkspaceSubmit、comfyCloudStatus、comfyCloudQuota；圖片 prepare 沿用現有服務。正式 DLL 生成、透明背景及多參考圖品質尚待部署後驗收。

官方來源：
- https://blog.comfy.org/p/seedream-55-is-now-available-via
- https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_api_nodes/nodes_bytedance.py
- https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_api_nodes/apis/bytedance.py
