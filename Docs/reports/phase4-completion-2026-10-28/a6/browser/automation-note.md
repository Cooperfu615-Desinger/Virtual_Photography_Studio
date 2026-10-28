# 原生 select 驗收工具差異

初次 selectOption 回報 optionnotenabled；DOM select.disabled、option.disabled、:disabled 均 false。內建瀏覽器原生座標點擊／Down／Return 已成功從隨機改為晴朗白日，畫面、摘要及輸出同步更新。其後恢復隨機、觀察式抓拍及原影片工作區並關閉臨時分頁。

label 同時包含 Copy button；全無／隨機時該按鈕 disabled，工具 OPTION 重定位受到它影響。非空選值時 Copy 可用，標準 selectOption 成功。最終自動化案例先以有效非空光線建立測試狀態，再透過標準原生 selectOption 改選另一款，核對畫面及生成後值；完整候選及全無狀態仍由前置畫面與 engine 矩陣保護。不使用 force、不修改產品元件。初次失敗畫面保留。
