# DLL_VIDEO Pro 單支參考影片 v1

日期：2026-11-17。使用者已授權實作，並於同日授權 commit／push 到 main 及部署 comfyCloudVideo；付費生成尚未授權。

## 範圍與介面

- Seedance 2.5、MiniMax H3 在運鏡描述下方提供一支選填參考影片。可上傳、更換、播放預覽與移除；來源圖片仍必填。
- 第一版限制為一般 MP4／H.264、2～15 秒、20 MiB 以內，寬高 256～4096、比例 2:5～5:2。Seedance 需至少 409,600 像素。這是 DLL 的共同首版限制，不是 Seedance 官方影片數量／時長上限。
- 影片只在本機讀取、預覽與保存草稿；按「生成影片」才上傳到 Cloud。上傳本身不是生成作業。未上傳時保留原始單圖工作流、參數與費率估算。
- 選到 Wan／Pika 時清除目前參考選擇，不會隱藏後仍送出素材。兩個支援模型互切保留影片，但重新驗證模型尺寸要求。
- 圖片與影片共同作為參考，圖片不保證是第一幀；使用者透過既有文字指定動作／運鏡目的，不自動改寫 Prompt，不保證逐幀運鏡轉移。

## 工作流與後端

- 共用 `comfyCloudVideo` 新增 `prepareReference` 操作；來源圖原本的 `prepare` 操作不變。不新增 Function／Secret。
- MP4 bytes 由前後端共用 `functions/shared/videoReference.mjs` 結構檢查：大小、一般 MP4、單影片軌、H.264 sample entry、軌道尺寸及 movie/video-track 時長；後端從檔案解析 metadata，不信任呼叫端時長。這不是完整媒體解碼驗證，損壞碼流仍可能在播放器或供應商失敗。
- 分開上傳圖片與影片。20 MiB 的 base64 約 26.7 MiB，保持在 callable 的 32 MiB 請求上限以下。
- multipart metadata 先於檔案；保存帳號所屬的 `referenceVideo` record，只有已確認 assetId 能送出。提交時再次核對類型、帳號範圍、模型與時長／尺寸；不接受外部影片 URL。
- `LoadVideo.file` 使用 Cloud core/ASSET。接入 `model.reference_videos.video_1`；原圖片接 `model.reference_images.image_1`。
- Seedance 使用既有 `ByteDance2ReferenceNodeV2` 的 reference 模式，保留 auto_downscale=true、auto_upscale=false。
- MiniMax 有影片時改用 `MinimaxHailuo03ReferenceNode`，ratio=adaptive；無影片仍使用 `MinimaxHailuo03FirstLastFrameNode`。
- 播放、下載、輪詢、防重送及 pending marker 沿用現有流程。上傳失敗／未確認不能提交付費 job。

## 儲存與相容

原 IndexedDB 名稱／版本與 pending key 不變。每帳號只保存目前一份參考 Blob；預覽使用可回收 object URL，歷史紀錄只保存設定 metadata，不複製影片到每筆歷史。更換／移除後，舊歷史的參考影片不保證保留；沿用該歷史時顯示必須重新上傳或明確移除參考，不能靜默降為無參考生成。重新載入可恢復目前草稿 Blob，切換帳號隔離素材。

## 費用估算

查核日期 2026-11-17，依官方 pricing 與 Cloud object_info；實際扣額待付費驗收。

- MiniMax H3：`(生成秒數 + 參考秒數) × 每秒費率`。768P 27.16、2K 39.22 Credits／秒。只有一張圖片，不觸發超過五張的圖片加價。
- Seedance 2.5 有影片：`floor(每幀 tokens × (24 × (生成秒數 + 參考秒數) + 1)) / 1000 × 有影片費率`。480p／720p 1.931、1080p 2.112 Credits／千 tokens；adaptive 延用最大像素面積保守估算。
- 例如 5 秒輸出＋5 秒參考：H3 768P 約 271.60 Credits；Seedance 720p、16:9 約 418.83 Credits。
- 移除影片恢復既有無影片公式與原費率日期；沒有藉此變更所有模型費率。現有 Seedance 無影片估算仍使用 24fps、不含額外一幀的既有公式。
- 前端費用以本機結構解析的 metadata 估算；後端生成以重新解析並保存的 metadata 為準。

官方來源：
- https://docs.comfy.org/tutorials/partner-nodes/minimax/minimax-h3
- https://docs.comfy.org/tutorials/partner-nodes/bytedance/seedance-2-5
- https://docs.comfy.org/tutorials/partner-nodes/pricing
- https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_api_nodes/nodes_minimax.py
- https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_api_nodes/nodes_bytedance.py

## 歷史基準

影片 UI、controller、controller 測試與 CSS 原本也受 Prompt 歷史回放檢查保護。本批新增 `videoReferenceReplay` 精確 inverse，以 `f50682e03c0f2b1d1136014b98118248fac26540` 的四份原始檔案為基準，串入最新 replay chain 與 Pika 單檔 replay。舊 seals／fixtures 不改；未知修改不會被 inverse 掩蓋。這只供測試使用，不是產品資料遷移。
