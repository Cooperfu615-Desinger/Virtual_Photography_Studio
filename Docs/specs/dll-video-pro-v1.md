# DLL_VIDEO Pro 獨立分頁與 Seedance 2.5

日期：2026-10-27。狀態：本機實作／驗收完成，未提交、未發布、未進行真實付費生成。

## 產品範圍

依使用者核准的示意圖，將影片彈出工作區改為導覽列的 `DLL_VIDEO Pro`，與 `DLL_PIC Pro` 並列。沿用 [原影片整合](comfy-video-workspace-v1.md) 的認證、Cloud v2 作業、來源圖片上傳、下載與防重送契約。

- 桌面：左側跨圖片影片紀錄／狀態篩選、中間預覽與播放／下載、右側來源及生成設定。右側設定可獨立捲動，額度與送出區固定可見。
- 1100px 以下：預覽及設定兩欄、紀錄移至下方。820px 以下：預覽優先，生成設定／影片紀錄切換。斷點配合既有介面，不綁定示意圖單一尺寸。
- 選圖：既有圖片卡或大圖的「製作影片」帶入來源並切換分頁；工作區可返回 DLL_PIC 選圖，也可讀取本機圖片。
- 操作：選圖 → 選模型 → 填動作／運鏡 → 秒數／解析度／音訊 → 查看額度 → 明確按「生成影片」 → 播放／下載。
- 「沿用設定」回填該紀錄的來源與設定；「同圖再生成」只切回該來源、保留目前表單設定。兩者均不自動提交付費任務。
- 生成期間切換其他工作區不卸載控制器。重新開啟／重新整理頁面時，以原 requestId 查詢 pending 任務；不自動重送。
- 紀錄保留成功、失敗、待確認與生成中狀態，並保存不可變的設定快照及對應來源。瀏覽器 IndexedDB 依 Firebase UID 隔離；原 storage keys 不變，舊單來源紀錄可繼續載入。
- 影片仍是限時雲端連結，下載為 MP4；本功能不提供跨裝置歷史同步或影片永久保存。

## Seedance 單圖 R2V 契約

共享模型鍵 `seedance25`，顯示 `Seedance 2.5`。第一版只做單張參考圖；不加入文生影片、多圖／影音參考、Draft 或延伸剪輯。

| 項目 | 設定 |
| --- | --- |
| 節點 | `ByteDance2ReferenceNodeV2` |
| workflow | `LoadImage → ByteDance2ReferenceNodeV2 → SaveVideo` |
| 模型／任務 | `Seedance 2.5`／`reference` |
| 來源欄位 | `model.reference_images.image_1`，不使用 `first_frame` |
| 秒數 | 4–30 整數秒；初始工作區保留既有 5 秒預設 |
| 解析度 | 480p、720p、1080p；可沿用目前有效解析度 |
| 音訊 | `model.generate_audio` 可開關；切換至此模型預設關閉 |
| 輸出 | MP4、SaveVideo H.264，關閉 watermark、auto_upscale |
| 圖片 | 至少 300×300，比例 2:5–5:2；延用輸入 8 MB PNG 等既有上限 |
| 比例 | 來源符合支援比例（誤差小於 1%）則使用該比例，否則 adaptive；不另加裁切控制 |

`model.prompt` 為動作與運鏡文字以換行連接，不增加提示詞擴寫。`model.auto_downscale=true` 允許節點處理超大參考圖。參考圖片不是保證的第一幀，介面明確提示「影片開頭可能與原圖不同」。

Wan 3.0 與 MiniMax H3 的節點與參數保持。預設模型仍是 Wan 3.0；不改變既有使用者的預設生成行為。

## 費用估算

Seedance 使用官方無影片參考費率，480p／720p 每千 tokens 3.229 Credits，1080p 3.530 Credits；tokens 依對應解析度／比例的像素面積 ÷ 1024 × 24 fps × 秒數估算。adaptive 採該解析度最大支援面積保守估算。單圖參考不使用「有參考影片」的費率。

5 秒、16:9 約 155.11／348.73／857.79 Credits（480p／720p／1080p）。官方摘要表的 720p 348.8 與公開四捨五入費率計算的 348.73 有小差異，故 UI 全部標為「約」；實際扣額及工作流費用須以帳戶為準。不把節點 badge 的額外一幀預估與文件的 24 fps 公式混用。音訊開關不改變此公開估算。

費率查核日期按模型保存：Seedance 2026-10-26；Wan／MiniMax 沿用既有 2026-10-17，不宣稱本次重新確認。

官方來源（2026-10-26 查核）：

- [工作流模板](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/api_seedance2_5_r2v.json)
- [ByteDance 節點定義](https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_api_nodes/nodes_bytedance.py)
- [Seedance 2.5 費率](https://docs.comfy.org/tutorials/partner-nodes/pricing#video-seedance-25)

## 實作與後續交付

前端入口為 `webapp/src/App.jsx`、`components/VideoWorkspace.jsx`、`styles/videoWorkspace.css`；控制器與共享契約為 `lib/videoWorkspaceController.js`、`lib/comfyVideoClient.js`、`functions/src/videoModels.json`；工作流與估算在 `functions/src/comfyVideo.js`。

本次不新增 Function 名稱。發布時至少需更新 `comfyCloudVideo`；`comfyCloudVideoDownload` 保留既有下載邏輯，可於影片服務一併部署。沿用 `COMFY_CLOUD_API_KEY`，無新增 Secret。

本機測試不能證明 Cloud 帳號具備此節點權限，亦不能證明實際扣額與影片品質。後續須另授權提交／推送、部署及付費生成，先以單圖、5 秒、720p 做端到端驗收，再確認餘額變動、播放、下載與 Cloud 作業。見 [本機驗收紀錄](../reports/dll-video-pro-2026-10-27/README.md)。
