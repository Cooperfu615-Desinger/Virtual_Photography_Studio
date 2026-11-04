# 正式站構圖景別部署後驗收 — 2026-11-04

網址：https://cooperfu615-desinger.github.io/Virtual_Photography_Studio/
實際測試網址以 outputs.json 的 url 為準（帳號為 Cooperfu615-Desinger）。

Chrome 獨立無痕、未登入。未操作收藏、未生成圖片、未執行付費請求。

## 通過範圍

桌面 1761×789、手機 390×900。六種景別各測固定套裝與全部全無，共 24 案例、144 個輸出。全部通過。
固定套裝：網狀蕾絲馬甲短裙長靴；其餘可選欄位全無。每次只切換景別。
六種景別：半臉傾斜特寫、全臉傾斜特寫、頭部主導近景、中景、牛仔中景、全身。
六輸出：Gpt、Z-Image、MIDJOURNEY、Nano Banana 2.1、胸上特寫照、全身角色照。
保留 corset/skirt/boots/choker/earrings；全無後無 Wardrobe/She wears 與上述服裝，沒有自動加入 nude/naked/barefoot。
所有輸出非空，胸上 4:5、全身 9:16、MJ v8.2 尾參數保留；未發現 undefined、object Object 或檢查的內部控制字樣。
頁面無水平溢出，所擷取 console warn/error 為空。畫面證據見 desktop.png、mobile.png；完整文字見 outputs.json。

## 尚未補齊

獨立單品下拉選單的 selectOption 與鍵盤操作未能更新值；未判定為產品缺陷，也未算通過。個別單品選擇與逐項全無仍需補驗。
未以本次測試宣稱真實模型畫質、所有目錄項目、收藏還原或所有工作區均通過。

## 保存範圍

只新增此暫存證據資料夾，未修改專案檔案，未 commit/push/deploy。測試分頁已關閉，暫時 viewport 已恢復。
