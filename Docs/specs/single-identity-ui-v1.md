# 單人人物設定卡片 UI v1

日期：2026-10-09。延續已核准的雙人分區視覺，第一步僅套用普通單人 A 人物設定的「身份基底」。服裝留待後續討論。

## 配置與契約

- 人物數量在卡片上方；外貌卡片包含體態、五官、膚質，頭髮卡片包含髮型輪廓、整理狀態、髮色。
- 桌面兩卡並排，820px 以下上下排列。各卡片顯示目前指定值摘要，未指定時顯示空狀態。
- 手機標題與操作列分行，避免說明文字被按鈕擠窄。
- 沿用原有選項、欄位 ID、隨機／清空處理、複製、儲存及輸出流程；不新增人物編號。雙人、特殊角色、角色卡及服裝配置維持上一版。

## 程式與驗證

- `webapp/src/features/page1/page1Schema.js`：六欄位的兩組配置。
- `webapp/src/components/Page1Workspace.jsx`：單人身份卡片及選值摘要。
- `webapp/src/features/page1/page1.css`：僅作用於單人身份卡片及其手機標題的樣式。
- `webapp/src/lib/page1WorkspacePanels.test.js`：六欄位不遺漏、不重複、人數維持卡片之外。
- 聚焦測試 18/18 通過（含分頁、section random、雙人欄位）；lint/build 通過，保留既有大型 chunk 提示。
- localhost:5175 獨立測試來源：1440×1000、390×900、821×900、819×900；摘要更新、隨機、清空、單雙人切換、重新載入保存及專用角色分頁均已操作。手機淺／深色已檢視，無新增 console warning/error 或文件橫向溢出。
- 截圖：`/tmp/vps-single-identity-desktop.jpg`、`/tmp/vps-single-identity-mobile.jpg`。
- 完整測試以 Node 24.19.0 重跑原有全檔案清單，120 秒仍未完成，已終止本次程序群組；紀錄 `/tmp/vps-single-identity-full.log`。前批雙人 UI 的原始提交對照也未完成同類矩陣測試，見 `duo-workspace-ui-v1.md`；本批不宣稱完整套件通過、不擴修 Prompt。正式建置與聚焦測試均正常完成。
