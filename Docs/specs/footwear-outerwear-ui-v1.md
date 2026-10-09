# 鞋襪與外層卡片 UI v1

日期：2026-10-09。使用者核准先實作鞋襪與外層；配件細節留待後續討論。

## 配置與行為

- 普通單人：外套佔上方整列；襪類、鞋款在下方各一張卡片。
- 外套排列：款式整列 → 版型／開合／穿法 → 配色／圖案。手機或中央可用寬度不足時改為單欄。
- 襪類與鞋款各自整合款式及既有共用色票入口，標題附選中單品摘要。
- 雙人保留左右人物區，每人依序外套、襪類、鞋款；外套穿法獨立一列，避免長文字被配色擠窄。手機保留人物跳轉。
- 配色彈窗顯示所屬單品，雙人另標示人物。保留複製、回到隨機、選色與清空操作。
- 本頁隨機／清空在單人時僅處理十個單人鞋襪外層欄位；雙人時僅處理該人物可用欄位，其他分頁與另一人物保留。
- 原有外套相容規則不變。選中穿法不相容時，UI 使用既有 policy 的具體原因，加上原設定保留與恢復提示；不修改選值、生成來源或 renderer。
- 保留既有 lock IDs、選項、storage、Saved Cards 及專用角色的條件顯示。此批沒有資料或提示詞變更。

## 變更位置

- `webapp/src/features/page1/wardrobeEditor.js`：鞋襪外套共用分組，以及沿用既有 policy 的 UI 提示。
- `webapp/src/features/page1/wardrobeEditor.test.js`：欄位順序與完整性、各人物作用範圍、相容提示不改來源。
- `webapp/src/features/page1/duoEditor.js`：鞋襪外套改用相同分組。
- `webapp/src/features/page1/page1Schema.js`：分頁欄位清單與操作標示。
- `webapp/src/components/Page1Workspace.jsx`：整合卡片、單人操作範圍及配色彈窗脈絡。
- `webapp/src/features/page1/page1.css`：外套大卡片、鞋襪小卡片與響應式排版。

## 驗證紀錄

- 聚焦 61/61：wardrobeEditor、duoEditor、page1Schema、page1Selectors、lockTransitions、page1SectionRandom、outerwearClosure、outerwearStyling。
- ESLint、production build、`git diff --check` 通過。保留既有大型 chunk 提示。
- `npm test`（Node 22.22.3）執行 120 秒未完成，停止本次程序群組；`/tmp/vps-layers-full.log`。不宣稱完整套件通過。
- localhost:5175 獨立測試來源；正常 127.0.0.1 收藏／設定未操作。測試來源新增一張單人鞋襪外套收藏並保留，用於清空後回填：西裝外套／深藍色／敞開／雙肩露出、短襪／白色、低筒球鞋／黑色均恢復。
- 檢查 1440×1000、390×900、819／821／1099／1101×900。單雙人、淺深色、手機角色跳轉、三個選色入口、單人清空、雙人隨機僅改人物 1、人物 2 外套／配色保留均正常。
- 全閉合時露肩穿法顯示停用原因；改回敞開後恢復雙肩露出。其他外套衝突由上述既有 policy tests 覆蓋。
- 五個工作區完成桌面／手機導覽與截圖檢視，無新增 console warning/error 或文件橫向溢出。
- Before：`/tmp/vps-layers-before.jpg`。補充：`/tmp/vps-layers-mobile-dark.jpg`、`/tmp/vps-layers-duo-desktop.jpg`、`/tmp/vps-layers-duo-mobile.jpg`。
- 最終圖：`/Users/cooperfu/.codex/visualizations/2026/09/23/01a0cba8-2f6d-7423-a0d2-fa7e6bc5f563/footwear-outerwear-desktop.jpg`。
- 本批未 commit／push／部署，未使用付費生圖；其他文件與參考資料修改保留。
