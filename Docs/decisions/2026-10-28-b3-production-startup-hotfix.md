# B3 正式版啟動白屏修復

2026-10-28，Cooper 回報線上白屏並授權立即修復。問題版本 `02c12b37`。

## 成因與處置

線上 HTTP 200，但頁面沒有內容，瀏覽器拋出 `ReferenceError: Cannot access Cl before initialization`。打包後 prompt-catalog 呼叫 prompt-engine 的穿搭 getter，而 prompt-engine 同時依賴 prompt-catalog；共用來源尚未初始化就被角色資料讀取。

將 characterWardrobeSources.js 與 characterProfiles.js 一起放入 prompt-catalog，消除資料區塊對引擎的反向依賴。不改角色資料、Prompt 文字、圖層、ID、收藏或歷史基準。

新增 scripts/check_prompt_bundle.mjs，在正式 build 完成後、上傳部署前檢查：禁止 catalog 反向依賴 engine，實際載入建置後 catalog，確認 33 個角色的穿搭已初始化。原錯誤產物可被此檢查阻擋。

## 驗收要求

前端全套、lint、build、新產物檢查；使用 vite preview 而非 dev 執行專用桌手機六工作區啟動驗收，核對 PAGE1 六輸出與 PAGE2 六種複製。推送後確認該提交全部 CI，再開啟線上版確認有內容且無啟動錯誤。

先前 B3 報告記錄的程式測試、開發服務瀏覽器驗收與 CI 成功均屬實，但不足以證明正式產物能在瀏覽器啟動；本事故補上此驗證缺口，不改寫原驗收證據。本批不進入剩餘 B3 整理、PAGE2 舊匯入、J12 或 P5b。

本機前端 2,014 項、lint、build 與產物初始化檢查通過。既有 B3 完整瀏覽器工具在正式 preview 的舊 ZIP 錯誤訊息等待超時，未宣稱該 54 項全數通過，也未修改已暫緩的 ZIP 匯入；本次啟動驗收另由 `scripts/check_production_browser.mjs` 覆蓋桌手機六工作區。

最終本機正式 preview：1440×1000、390×1000，12 個工作區檢查全部通過，PAGE1 六輸出／PAGE2 六種複製通過，圖片載入正常，無 console/page error 或意外水平溢位。專用工具可對部署 URL 重跑；正式部署結果以本次提交的 CI 與線上實測為準。
