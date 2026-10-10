# PAGE1 場景環境卡片介面 v1

狀態：已依使用者核准的示意圖完成本機實作與驗證。

日期：2026-10-10

## 目的與範圍

將 Prompt 工作台「D 場景環境」整理成同頁卡片配置，讓場景、環境光與人物光線可一起確認。沿用目前 Apple 系統風格、日夜主題與既有控制項；此批不變更 Prompt 來源文字、renderer、資料目錄或儲存 schema。

核准的配置草案為一般場景與固定構圖展開後的雙狀態示意圖：

`/Users/cooperfu/.codex/generated_images/01a0cba8-2f6d-7423-a0d2-fa7e6bc5f563/exec-c271a3b9-08d8-48da-bb87-6f33f01d067e.png`

## 配置與狀態

依序呈現：

1. 目前生效的場景來源、名稱，以及單人／雙人共用狀態。
2. 一般場景、固定構圖、場景建模匯入三個編輯入口。
3. 目前查看來源的設定卡片。
4. 環境光與人物光線卡片，以及光線定位對照入口。
5. 可收合的精確畫面文字設定。

桌面一般場景卡片採較窄屬性欄、較寬地點欄；光線並排。固定主場景佔滿一列，下方適用欄位並排。在 `700px` 以下，場景欄位及光線改為單欄，操作列可以換行。

來源入口僅切換查看內容，不修改 locks 或重新產生預覽。離開 D 再返回時，預設查看當前有效來源。摘要區分隨機與全無，並依既有來源優先序顯示支撐表面、有效單人固定構圖、有效匯入、一般場景。

## 一般場景與搜尋

- 場景屬性沿用原選單。
- 地點使用搜尋選擇器，支援中文名稱及英文來源關鍵字；搜尋只過濾顯示清單。
- 保留已準備選項的 IDs、順序、停用 metadata、全無及隨機空值。Copy 仍使用完整原英文。
- 搜尋窗有空結果狀態、Escape 關閉、方向鍵移動、Tab 焦點循環；關閉後回到原地點按鈕。
- 固定構圖啟用時，普通場景兩欄維持原停用規則，提供「解除固定場景」。解除沿用固定場景選回全無的既有 `applyControlValue` 動作。
- 匯入啟用時，可明確選取地點切回一般場景；修改屬性本身仍依原規則處理。

## 固定構圖展開

有效固定場景選取後，同卡展開人物位置、背景狀態、拍攝型態及演出狀態。

- 人物位置及背景狀態僅在該場景有非全無適用選項時顯示；依原 `setId`、`setIds`、`setGroupId` 篩選。
- 月台／車廂的具體人物位置接管姿勢、拍攝型態與演出狀態時，隱藏後兩欄並顯示接管說明；潛在選值仍保留。
- 攝影接管摘要依原各場景能力顯示，不一律宣稱所有固定場景鎖定環繞、景別或焦段。
- 「查看攝影設定」前往 E 的構圖視角頁面，沿用原停用條件。
- 卡片簡化欄位標題只影響顯示；原 control key、完整可及性名稱、來源與 Copy 不變。

## 操作範圍

沿用原三組隨機／清空範圍及按鈕名稱：

| 組別 | keys |
| --- | --- |
| 一般場景 | `sceneAttributeId`, `locationId` |
| 固定構圖 | `fixedCompositionSetId`, `fixedSetPositionId`, `fixedSetBackgroundStateId`, `fixedSetCaptureModeId`, `fixedSetPerformanceStateId` |
| 光線 | `lightingId`, `lightDirectionId` |

所有更新仍經既有 `updateLocks` 與相容性處理。必要欄位、預設、排除隨機及人物位置接管過濾不變。固定人物位置接管時，固定組操作排除被接管的拍攝型態／演出狀態，以免覆寫潛在值。

環境光與人物光維持不同責任。月台／車廂保留完整手動光線選項；其他場景沿用原選項篩選。沒有新增獨立天氣或時段欄位。

## 匯入與特殊模式

- 匯入卡片集中名稱、套用及清除入口，沿用既有 PAGE3 callback。
- 匯入包含場景與拍攝資訊；PAGE1 環境光與人物光仍可調整。
- 匯入資料存在但被固定構圖優先序遮蔽時，顯示「已匯入・目前未使用」。
- 雙人共用場景及光線，固定構圖維持單人限定並提供原因說明。
- 仰躺支撐面模式顯示支撐表面提示，普通場景、固定構圖、匯入及精確文字不可操作，光線保留；離開仰躺的還原沿用原機制。
- 精確文字維持 Z-Image 專用、opt-in、不參與隨機／清空，只改為收合配置。

## 實作與驗證

- 入口：`webapp/src/components/Page1Workspace.jsx`。
- 版面：`SceneEnvironmentControls.jsx` 與 `features/page1/sceneEnvironment.css`。
- 地點選擇器：`SceneLocationField.jsx`、`sceneLocationField.css`。
- 純函式及回歸：`features/page1/sceneEditor.js`、`sceneLocationOptions.js` 及同名測試。
- 保留既有 locks、公開映射、選項 IDs、storage keys、Saved Cards 與匯入／還原資料。

驗證包含 frontend 完整套件、場景專項、lint/build，以及 `Docs/specs/frontend-visual-validation.md` 的桌面／手機、斷點、主題、來源切換、Saved Cards、雙人／仰躺及鍵盤流程。詳見根目錄 [design-qa.md](../../design-qa.md)。這是介面驗證，並非外部影像模型的成像驗收。
