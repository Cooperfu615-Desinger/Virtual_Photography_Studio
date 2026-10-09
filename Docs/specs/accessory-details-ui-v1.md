# PAGE1 配件細節卡片 v1

## 範圍與目標

延續已確認的完整造型、上下身單件、鞋襪與外層卡片，將配件與對應配色／配戴方式放在同一卡片。單人可依部位尋找；雙人維持人物 1、人物 2 各自獨立編輯。

## 配置

| 卡片 | 既有欄位 |
| --- | --- |
| 頭部配件 | 單品、頭部配件配色 |
| 耳機 | 耳機、耳機配色 |
| 眼鏡 | 本體、獨立眼鏡配色、配戴方式 |
| 口鼻配件 | 口鼻遮擋、遮擋配色；單人另含鼻部與唇部穿孔 |
| 飾品 | 耳環、頸部、腰部 |

- 單人桌面：頭部／耳機一排，眼鏡／口鼻一排，飾品跨整排，三個飾品欄位並列。
- 雙人桌面：兩個人物區各自依上述順序排列，保持同類卡片左右對齊。
- 手機及窄中央欄：卡片、飾品欄位改為直列，沿用雙人人物跳轉。
- 保留頁級與人物級隨機／清空，不另增卡片級操作。單人操作僅處理單人配件欄位。

## 相容邊界

- 沿用 `accessoryPolicy.js` 原有選項與互斥說明：帽子／硬式頭飾與頭戴式耳機、口鼻遮擋與鼻唇穿孔。
- 眼鏡保留原配色選單；其他三類配件配色沿用共用色票。
- 雙人原本沒有鼻唇穿孔欄位，本次不新增。隱藏的腕飾／戒指不重新引入。
- 不改 lock ID、選項、資料來源、Saved Cards、storage schema、Prompt 文字及引擎規則。
- 保留專屬主體原有控制項路徑；新增卡片僅適用一般單人／雙人。

## 實作位置

- `webapp/src/features/page1/wardrobeEditor.js`：共用五組卡片，單人穿孔欄位。
- `webapp/src/features/page1/duoEditor.js`：沿用共用分組與人物 ownership。
- `webapp/src/components/Page1Workspace.jsx`：卡片渲染、頁級操作範圍、配色視窗上下文。
- `webapp/src/features/page1/page1Schema.js`：配件子頁說明與隨機操作文案。
- `webapp/src/features/page1/page1.css`：限定配件卡片的桌面／手機配置。
- `webapp/src/features/page1/wardrobeEditor.test.js`：欄位完整性、唯一性、單雙人邊界與操作隔離。

## 2026-10-09 驗證紀錄

- 配件／分組／頁級操作相關 55 項測試通過；Lint、正式建置通過（既有大 chunk 提示）。
- 瀏覽器：1440×1000、390×900（最終完整卡片截圖為 1440×1100）；另檢查 819、821、1099、1101 寬度，未見非預期水平頁面溢出。
- 單人：五卡片、眼鏡獨立配色、三組共用色票、帽子耳機雙向互斥、遮擋穿孔雙向互斥、清除後恢復可選、頁級隨機／清空、重新載入保留、Saved Cards 儲存與回填。
- 雙人：五卡片各自顯示、人物配色視窗標題、人物 1 隨機／清空不改人物 2、手機人物跳轉；無新增穿孔欄位。
- 淺／深色與五個工作區桌面／手機巡檢；瀏覽器 error／warn 記錄為空。
- 互動驗證使用同一服務的 localhost 隔離儲存；另外唯讀確認 `http://127.0.0.1:5175/Virtual_Photography_Studio/` 原本分頁已呈現五組配件卡片，未修改使用者的選項。
- 截圖：`/tmp/vps-accessories-before.jpg`、`/tmp/vps-accessories-duo-desktop.jpg`、`/tmp/vps-accessories-duo-mobile-dark.jpg`、`/tmp/vps-accessories-single-mobile-dark.jpg`。單人桌面最終畫面另存於本 session visualization 目錄的 `accessories-desktop.jpg`。
- 完整測試預設並行在 120 秒內未結束；降低同時執行數後，以 `node --test --test-concurrency=4` 執行 `npm test` 的相同三組測試檔案，1,385 項全部通過，耗時 541 秒。完整紀錄：`/tmp/vps-accessories-full-bounded.log`。
