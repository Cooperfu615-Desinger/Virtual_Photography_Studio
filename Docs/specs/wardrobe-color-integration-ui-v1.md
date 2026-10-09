# 服裝與配色整合 UI v1

日期：2026-10-09。依使用者核准的介面示意方向，將配色放回對應服裝卡片，沿用 Apple 風格與既有單／雙人分區。

## 範圍與配置

- 穿搭設定四個分頁：完整造型、上下身單件、鞋襪與外層、配件細節。原造型配色分頁的欄位全部移入前兩頁。
- 完整造型：特殊穿搭、套裝、連身三張卡片；套裝依既有可用條件顯示主色、對比色、鎖定色方案。連身保留連身配色。
- 完整造型色系仍是每人一個既有欄位，唯一入口隨目前生效的特殊穿搭／套裝／連身移動，不新增三份設定。
- 上身卡片：單品、版型、穿法、配色、圖案。下身卡片：褲裝、裙裝、版型、腰線、配色、圖案。
- 特殊上下身配色置於兩張單件卡片下方；八組快捷預覽、解除配色及完整選色彈窗。預覽色塊保留間距、圓角、微漸層，上下分色而不在色塊內放文字。名稱供標題與輔助辨識使用。
- 單人桌面兩欄；手機與中央可用寬度不足時換行。雙人延續固定人物欄、角色專屬操作、手機人物跳轉。
- 配色彈窗顯示人物／對應單品脈絡。

## 相容性與操作

- 保留既有 lock IDs、選項、儲存資料、Saved Cards 回填與 Prompt renderer；沒有資料遷移或提示詞修改。
- 單人前兩頁的隨機／清空包含移入的配色欄位，僅作用於單人欄位。雙人操作僅作用於該人物可用欄位。
- 沿用既有完整造型接管與配色互斥。特殊上下身配色套用時，既有 lock transition 會清除個別上下身配色；解除後恢復個別欄位可操作性，不會還原先前個別色值。
- 保留套裝的條件式配色規則；不將所有套裝強制改成任意配色。
- 專用角色維持既有欄位呈現／停用規則，鞋襪與配件不在本次改版範圍。

## 變更位置

- `webapp/src/features/page1/wardrobeEditor.js`：共用卡片／欄位映射與完整造型色系歸屬。
- `webapp/src/features/page1/wardrobeEditor.test.js`：欄位完整性、歸屬、單雙人操作範圍。
- `webapp/src/features/page1/duoEditor.js`：雙人前兩頁共用相同分組。
- `webapp/src/features/page1/page1Schema.js`：四分頁與欄位配置。
- `webapp/src/components/Page1Workspace.jsx`：卡片、配色快捷入口、單品脈絡與作用範圍。
- `webapp/src/features/page1/page1.css`：限定於服裝卡片的樣式及可用寬度調整。

## 驗證紀錄

- 聚焦測試 38/38 通過：wardrobeEditor、duoEditor、page1Schema、page1Selectors、lockTransitions、page1SectionRandom。
- ESLint 與 production build 通過；build 保留既有大型 chunk 提示。`git diff --check` 通過。
- 完整套件使用 Node 24.19.0 執行原有測試清單，120 秒未結束，已停止本次程序群組；紀錄 `/tmp/vps-wardrobe-integrated-full.log`。本次不宣稱全套通過，前批對照限制見 `duo-workspace-ui-v1.md`。
- 瀏覽器使用 localhost:5175 測試來源，避免改動使用者 127.0.0.1 的儲存設定。檢視 1440×1000、390×900，以及 819／821／1099／1101×900。未見文件橫向溢出；1101px 單人中央卡片改為一欄，雙人卡內欄位改為一欄。
- 已操作：單品選擇、個別配色彈窗、特殊上下身配色套用／解除、完整造型切換與色系歸屬、套裝條件配色、角色專屬隨機、另一角色保持、手機角色跳轉、淺／深色、重新載入保留選值。
- 既有 Saved Cards 雙人卡片回填後，人物 1 的襯衫／合身／半紮／白色及下身薄荷綠、人物 2 的短袖上衣／下擺打結／工裝短褲均出現在對應卡片。
- 五個工作區完成桌面／手機導覽與畫面檢視，未見新增 console warning/error。未使用外部圖片生成服務。
- 實作截圖：`/Users/cooperfu/.codex/visualizations/2026/09/23/01a0cba8-2f6d-7423-a0d2-fa7e6bc5f563/wardrobe-integrated-desktop.jpg`；補充手機與雙人圖在 `/tmp/vps-wardrobe-single-mobile.jpg`、`/tmp/vps-wardrobe-single-dark-mobile.jpg`、`/tmp/vps-wardrobe-duo-restored.jpg`。
- 尚未 commit、push 或部署；既有其他未提交修改保留。
