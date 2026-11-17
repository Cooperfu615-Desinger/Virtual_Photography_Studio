# DLL_VIDEO Pro 單支參考影片本機驗證

基準：main `f50682e03c0f2b1d1136014b98118248fac26540`。範圍見 [規格](../../specs/dll-video-reference-v1.md)。

## 功能與瀏覽器

- 本專案 127.0.0.1:5175；1440×1000、390×900。獨立瀏覽器，不動真實草稿／收藏／任務。所有外部 POST 均攔阻，沒有提交付費生成。
- 六工作區導覽無頁面橫向溢位；兩尺寸的 Seedance／MiniMax 上傳、播放器播放、移除、不合法檔案提示、切換不支援模型清除影片皆通過；零 page／console error。
- 實際測試檔是 ffmpeg 合成的 5 秒、1280×720、24fps、H.264 藍色靜態 MP4，不是模型生成結果。
- 獨立元件 fixture 使用真實 IndexedDB（測試 UID），模擬 session／Cloud 回應；驗證 Blob 重新載入、額度更新、上傳中停用控制、影片上傳完成前無 submit、submit 綁定 reference ID、完成狀態、歷史沿用缺檔時阻止再次生成。
- `desktop-reference-panel.png`／`mobile-reference.png` 為實際新版介面；`browser-results.json`／`mock-flow.json` 記錄結果。桌面設定欄維持原有獨立捲動，不是頁面溢位。

## 自動驗證

- Functions 全套 147/147 通過，lint 通過；後續只移除一個重複 guard，再重跑參考影片 5/5 通過。
- 前端 focused controller 15/15；歷史 C2＋ambient＋Pika 專項檢查通過。新精確 inverse 測試核對原始 Git bytes，未知修改不被還原。
- 前端 lint、production build 通過；build 保留既有大型 chunk 提示。
- 完整前端測試以 Node 22.22.3 執行 `scripts/run_webapp_tests.mjs --test-concurrency=2`（與 npm test 相同檔案集），2,311/2,311 通過，零失敗／略過，耗時約 706 秒。初輪偵測到新增影片檔案不符合舊精確 inverse；已新增獨立 forward inverse，未改舊 baseline。一般 npm 入口在此環境選到 Node 25，造成既有 runner 的 TAP 格式斷言失敗；已直接使用 Node 22 重跑並通過完整同一測試集，未修改執行器斷言。

## 交付界線

以上為提交前的本機驗證。使用者於同日授權 commit／push 到 main，再部署 `comfyCloudVideo`，不用新增 Function／Secret；`comfyCloudVideoDownload` 的邏輯未改。沒有實際 Cloud 影片生成、模型效果或扣額驗收。Cloud object_info 與官方費率／節點內容僅唯讀查核。

保留原先 dirty 的 Docs/current_project_state.md、Docs/session_onboarding.md 及未追蹤研究檔，未納入本批變更。
