# Comfy Cloud 影片實測（2026-10-17 至 2026-10-18）

使用者授權 Wan 3.0 與 MiniMax H3 各一支 5 秒影片。兩筆均由本機 DLL UI 提交，使用同一張既有參考圖 `webapp/public/reference/wardrobe/dresses/37_針織長洋裝.avif`（640×1120），動作「人物緩慢轉頭看向鏡頭，露出自然微笑。」、運鏡「緩慢推近」。沒有額外付費重送。

| 項目 | Wan 3.0 | MiniMax H3 |
| --- | --- | --- |
| 請求 | 5 秒／720P／無音訊 | 5 秒／768P／原生音訊 |
| 結果 | 成功 | 成功 |
| 實測 MP4 | 5.000 秒、724×1268、H.264 | 5.167 秒、768×1344、H.264 + AAC |
| 檔案大小 | 4,958,650 bytes | 993,053 bytes |
| DLL 播放 | `ended=true`、time=5、error=null | `ended=true`、time=5.167、error=null |
| DLL 下載 | 成功，完整解碼無錯誤 | 成功，完整解碼無錯誤 |
| 生成前額度 | 2,803.25 Credits | 2,652.39 Credits |
| 生成後額度 | 2,652.39 Credits | 2,516.61 Credits |
| 觀察差額 | 150.86 Credits | 135.78 Credits |
| UI 預估 | 150.85 Credits | 135.8 Credits |

總觀察差額為 286.64 Credits。這是帳號前後餘額差，非逐筆帳單拆項；H3 結果於隔日續查，不能僅由餘額差排除期間其他帳號活動。2026-10-18 05:39（台北）手動重新整理仍顯示 2,516.61 Credits。H3 的 5 秒是請求設定，供應商實際輸出多約 0.167 秒；本版不裁切成片。音軌存在且可解碼，未作主觀音質驗收。

## 下載檔案

- Wan：`/Users/cooperfu/Downloads/dll_video_60691da4-9ce1-4148-b15a-80fdb1766717.mp4`
  - SHA-256：`318fe984288d21fa90e108ab1e9dc742da38ada1b27406fd5aca1b14019798ea`
- H3：`/Users/cooperfu/Downloads/dll_video_342d58e8-9fcd-4acb-b47e-c5359d85be70.mp4`
  - SHA-256：`a747ee63e99f1e47a74a04b30a7f3a75e4b0c269e265c07e6a208a8a1e13bc6f`

兩支都小於 6 MiB，真實驗收覆蓋單段 Range 下載；多段合併由既有自動測試覆蓋，未另花額度生成大檔。影片保存在 Downloads，不加入 Git。

## 實測發現與修正

1. 初次圖片上傳 HTTP422：官方實際回覆 `invalid_body`，`content_type is required and must be sent before the file field`。multipart 改為 content_type → file_path → file，診斷上傳回 HTTP201。失敗發生於 prepare，尚未送付費 job，當時餘額不變。
2. Wan job 已成功但 UI 未取得影片：實際 final node `3` output 為 `type=image`、`content_type=video/mp4`。加入此窄相容分支，保留 final node、MP4 與 asset 驗證。僅重新查詢原 job，沒有重新生成或重複扣額。
3. 隔日重新開啟時本機 Vite 已停止；重啟並 reload 後恢復兩筆結果。H3 舊簽名連結無法播放，按「重新取得影片連結」後正常播放及下載。未修改 Firebase 授權網域；登入測試使用 localhost，127.0.0.1 的 OAuth 不被允許。

僅修改 `functions/src/comfyVideo.js` 與對應測試。兩個回歸斷言皆先確認舊碼失敗，再修正。已限定部署 `comfyCloudVideo`；最新驗證 revision `comfycloudvideo-00003-pig`，ACTIVE／nodejs24／最新流量，2026-10-17T15:18:48Z。下載 Function 維持 `comfycloudvideodownload-00001-piz`。使用者已於 2026-10-18 授權將本批修正與驗收紀錄 commit／push；實際交付以 Git 遠端為準。

## 驗證與範圍

- Functions 82/82、lint；前端完整 1644/1644、影片 controller 7/7、lint、build、diff-check 通過。既有 build 大 chunk 提示保留。
- 本機 DLL 完整上傳→提交→完成→播放→下載；Wan 關閉後返回追蹤；重啟瀏覽器頁面後兩筆結果仍可恢復；額度手動更新；過期連結重新取得。
- 桌面 1440×1000、手機 390×900 結果列表／播放器檢視，手機 document scrollWidth=clientWidth=390；內部捲動保留。證據：[桌面](live-desktop.png)、[手機](live-mobile.png)。未改 UI／CSS，本次不重做其他工作區的版面檢查。
- 續跑初期主控台有本機服務停止造成的 Vite／動態載入錯誤；重啟 reload 後無新記錄。更新 H3 連結後播放器 error=null。
- 未進入 Comfy Cloud 網頁核對媒體庫可見性；兩模型影像美感仍由使用者評估。
