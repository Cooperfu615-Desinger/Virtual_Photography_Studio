# 雙人人物分區 UI v1

日期：2026-10-09。依使用者確認的第二版左右獨立區塊方向實作。

## 目標與範圍

- PAGE1 雙人模式的身份基底及穿搭設定，固定人物1在左、人物2在右；以藍／紫識別線、人物編號、摘要及各自操作列標示歸屬。
- 對齊同類單品卡片，共用頁面捲動。卡片集中單品、版型、穿法、配色與圖案；既有五個穿搭分頁保留。
- 人物標頭的「本頁設為隨機」與「清空可清除項目」只影響該人物、目前分頁可操作欄位。隨機仍是解除指定值，沿用既有生成流程。
- 單品旁與造型配色分頁使用相同欄位。選色視窗標示人物及單品脈絡；Escape 關閉、Tab 限定於視窗，關閉後焦點返回觸發按鈕。
- 完整造型接管顯示於所屬人物。連身服裝停用同一人物的上下身欄位，保留原值；另一人物繼續獨立編輯。
- 神情姿態、場景環境及攝影成像標示「雙人共用」。單人及專用角色維持原有欄位流程。
- 820px 以下人物區塊改為上下排列，提供人物跳轉及標頭切換按鈕。

## 相容性

沿用既有 A/B lock ID、選項 ID、生成器、Saved Cards、匯入回填及瀏覽器儲存結構。沒有新增整卡鎖定、角色交換、複製穿搭或 Prompt 文案改動。左側人物摘要分開顯示；生成摘要沿用完整既有資料投影，不使用精簡人物摘要取代。

## 程式位置

- `webapp/src/features/page1/duoEditor.js`：明確角色與分組欄位對照、作用範圍及摘要。
- `webapp/src/components/Page1Workspace.jsx`：雙人分區、分人物操作、視窗脈絡與焦點。
- `webapp/src/components/SelectControlField.jsx`：顯示短標籤，無障礙名稱保留人物歸屬。
- `webapp/src/features/page1/page1.css`：限定 PAGE1 雙人版面的樣式及響應式排列。
- `webapp/src/lib/page1WorkspaceSummary.js`：雙人導覽摘要，保留生成摘要契約。

## 驗證紀錄

- 聚焦測試：duoEditor、page1SectionRandom、page1WorkspaceSummary，37/37 通過。
- ESLint、正式建置、diff 空白檢查通過；建置仍有既有大型 chunk 提示。
- 桌面 1440×1000、手機 390×900，以及 1101／1099／821／819px 分欄邊界已實際檢視；雙人欄位無橫向頁面溢出。
- 確認人物1隨機不影響人物2、人物2配色清空不影響人物1、色票兩處編輯連動、人物2連身僅停用自身上下身且解除後恢復、色票視窗 Escape 及焦點返回。
- 檢查淺／深色、手機人物跳轉、單雙人切換、共用區標記及 Saved Cards 保存／回填。五個工作區已檢視桌面與手機，未觀察到新的 console warning/error。
- 使用獨立 `localhost:5175` 測試來源，未更動 `127.0.0.1:5175` 的使用者儲存資料；測試來源保留一張驗證用雙人卡片。
- 畫面證據：`/tmp/vps-duo-desktop-final.jpg`、`/tmp/vps-duo-mobile-final.jpg`、`/tmp/vps-duo-mobile-dark.jpg`。
- 完整前端測試未取得完成結果：Node 25 預設執行、降低並行數及 Node 24.19.0 重跑均停留於既有 Prompt 矩陣測試，已停止測試程序。`ambientLightDescriptions.test.js` 在未含本次修改的 HEAD 獨立副本也於 30 秒上限內未完成；此證據僅確認原始提交同樣慢／未完成，不推定確切根因，也不宣稱完整套件通過。紀錄：`/tmp/vps-duo-tests.log`、`/tmp/vps-duo-tests-node24.log`、`/tmp/vps-duo-tests-timeout.log`；HEAD 副本：`/var/folders/zw/w7pdy73s51gc5ttz314k6b4r0000gn/T/vps-duo-baseline-z662rfuq`。
