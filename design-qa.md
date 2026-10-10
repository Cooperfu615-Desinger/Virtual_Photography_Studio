# 場景環境卡片 UI 驗證

日期：2026-10-10

final result: passed

## 比較目標與證據

Source visual truth：

`/Users/cooperfu/.codex/generated_images/01a0cba8-2f6d-7423-a0d2-fa7e6bc5f563/exec-c271a3b9-08d8-48da-bb87-6f33f01d067e.png`

來源為 `1586 × 992` 的雙狀態配置草案，包含一般場景與固定構圖展開後。它不是指定 CSS viewport 的瀏覽器擷取，沒有可採用的 device density。以兩張場景內容卡片的結構、欄位比例及資訊階層比較；既有工作台 shell、字級與 Copy 控制保留。沒有宣稱整張設計板和完整工作台像素一致。

Implementation：既有 `http://127.0.0.1:5175/Virtual_Photography_Studio/` 開發服務。互動驗證使用同一服務的 `http://localhost:5175/Virtual_Photography_Studio/` 儲存 origin，以保留正常 127.0.0.1 的設定及收藏。

所有擷取在以下本機資料夾：

`/Users/cooperfu/.codex/visualizations/2026/09/23/01a0cba8-2f6d-7423-a0d2-fa7e6bc5f563/scene-ui/`

| 證據 | viewport／內容範圍 | 圖片像素 |
| --- | --- | --- |
| `desktop-general.jpg` | 1440 × 1000，完整工作台脈絡 | 1425 × 990 |
| `desktop-general-panel.jpg` | 同桌面，D 內容區裁切 | 776 × 747 |
| `desktop-fixed-panel.jpg` | 同桌面，固定構圖 D 內容區裁切 | 776 × 1008 |
| `mobile-general-panel.jpg` | 390 × 900，D 內容区裁切 | 327 × 1021 |
| `mobile-fixed-panel.jpg` | 390 × 900，固定構圖 D 內容區裁切 | 327 × 1432 |

瀏覽器回報 `devicePixelRatio = 1`。內容裁切依 DOM 矩形擷取，沒有另行放大或修改圖片。完整 viewport 擷取由 browser backend 輸出，像素尺寸與 requested viewport 的差異包含捲軸／backend 擷取範圍；內容裁切以各自記錄的矩形比對。來源設計板不按未知 density 強制縮放成瀏覽器畫面。

同一次圖片比較輸入已放入來源圖、最終一般／固定桌面內容區，以及兩個手機內容區。先前也以來源圖與含 shell 的桌面畫面同時比較。內容區的字體、欄位、按鈕及摘要足夠清晰，已作為 focused region 比較證據。

## 比較結果

最終沒有尚待處理的 P0／P1／P2 差異。

| 表面 | 結果與處理 |
| --- | --- |
| 字體與文字 | 沿用專案系統字型與現有字級，控制項標題及狀態層級清楚。來源為放大的配置示意圖，實作以工作台既有字體尺度呈現；中文長名在手機正常換行或有意截斷。完整 aria 名稱保留。 |
| 間距與版面 | 三個來源入口、來源卡片、雙光線卡片、參考入口、文字收合順序相符。一般地點比屬性欄寬；固定主欄全寬，適用細項並排。700px 以下改單欄，操作列換行。圓角與卡片留白沿用系統風格。 |
| 色彩與狀態 | 使用既有 surface、text、border、accent tokens；藍色表示目前查看入口，頂部另顯示有效來源。light／dark 都可讀，焦點及 disabled 狀態可辨識。 |
| 資產與圖示 | 設計沒有攝影／插畫資產；圖示使用既有 Lucide 系列的 Search、Copy、Lock、Sun、Chevron 等，沒有用自繪圖案取代資產。未加入新的字型或圖片下載。 |
| 文案與內容 | 保留來源全名、Copy 入口及既有按鈕名稱。相機摘要比草案更完整，反映不同固定場景的真正接管條件。單人 badge 的位置配合既有標題列，而不新增第二個 D 標題。 |

## 比較與修正歷程

1. **P2：內層網格被共用 CSS 覆蓋。** 初版一般場景為兩個等寬欄位，光線卡片中的單一選單只佔半欄，浪費卡片寬度。證據 `desktop-general-before-css.jpg` 與 DOM columns 記錄。專用網格增加 `.scene-editor` scope，避免後載入共用規則覆蓋。最終 `desktop-general-panel.jpg` 顯示較寬地點欄與滿寬光線選單，手機及 699／701 兩側也符合預期。
2. **P1：固定構圖下的一般入口沒有可完成的切換動作。** 原提示宣稱可選普通場景，但兩欄按既有固定規則停用。補上原因說明與「解除固定場景」，沿用原固定場景選回全無 callback。瀏覽器確認解除後有效來源為一般場景、兩欄可用。開發時一次 HMR 舊狀態未帶入新 callback，重新載入後完成確認；最終載入與流程均正常。
3. **操作與摘要回歸補強。** 固定组動作補回原人物位置管理 filter；隨機／全無摘要分開；被固定來源遮蔽的匯入 badge 不宣稱已套用。回歸 fixture 及第二次唯讀檢查通過，未變更 storage 或 renderer。

沒有為重現舊 UI 重設共用工作區。初版截图是本次迭代證據，核准設計板是主要視覺基準。

## 瀏覽器流程

已檢查 `1440 × 1000`、`390 × 900`、`699 × 1000`、`701 × 1000`。

- 三個來源入口切換後，六個 Prompt textarea 值保持相同。
- 中文／英文搜尋、選中狀態、空結果；Escape 關閉與原 trigger 焦點恢復；方向鍵移動及 Tab／Shift+Tab 焦點循環。
- 海邊坡道固定場景五欄、車站／車廂位置接管、車廂背景、飯店不顯示空背景欄位。
- coastal、station、carriage 的攝影入口及各自停用條件；光線手動選項仍由原邏輯準備。
- 光線隨機／清空不清除場景或精確文字；場景清空不直接操作光線 keys，既有相容性處理仍生效。
- 精確文字展開、啟用、輸入、收合，光線操作後內容保留。
- PAGE3 澀谷來源套用、清除，套用前後 PAGE1 光線 locks 相同；明確選取普通地點後匯入來源移除。
- Saved Cards 還原一般、匯入、固定、雙人；固定還原後五個固定選項與有效來源一致。
- 雙人共用來源與光線，固定入口顯示單人限定；仰躺提示支撐表面接管，光線可用，文字暫不適用。
- 桌面／手機、淺色／深色及新 700px 斷點兩側的欄位、狀態、按鈕。
- 五個工作區在桌面與手機完成載入，DOM 横向溢出檢查及實際畫面巡查通過；沒有破圖。
- 瀏覽器 console warning/error 查詢回傳空清單，沒有觀察到新的執行錯誤。

細部量測記錄：`browser-checks.json`。其他狀態擷取包含 `desktop-fixed-station.jpg`、`desktop-imported.jpg`、`desktop-duo.jpg`、`desktop-supine.jpg`、`desktop-dark-general.jpg`、`desktop-dark-fixed.jpg`、`desktop-dark-search.jpg`、`mobile-dark-fixed.jpg`、`mobile-search-empty.jpg` 及五工作區桌面／手機圖片。

## 自動檢查與範圍

- 全 frontend 測試清單以 `node --test --test-concurrency=4 src/lib/*.test.js src/lib/engine/*.test.js src/features/*/*.test.js` 執行（與 `npm test` 相同清單，限制併行）：1,396／1,396，exit 0。
- 完整套件執行期間補強的最後 UI helper fixture，另重新執行場景相關九份檔案：92／92，exit 0。最後使用實際有效 latent IDs 的兩份新 helper 測試：11／11，exit 0。
- `npm run lint`：exit 0。
- `npm run build`：exit 0。Vite 既有 >500KB chunk 提示仍在，未擴大重構。
- `git diff --check`：通過。
- 沒有改 Prompt renderer、來源資料或 storage schema，因此沒有另外跑同 seed prompt audit 或資料同步。

程式變更限於 Page1Workspace 的場景入口、兩個場景元件、專用 CSS、兩個 helper 與測試；新增本規格及驗證報告。現有 current state、provider 文件、服裝資料與測試等其他 session 變更保持原狀。上述驗證階段沒有 stage、commit、push、部署或付費生圖。

驗證使用 localhost 獨立 origin，新增兩張本機測試收藏且未刪除原三張測試收藏。正常 127.0.0.1 的設定／收藏未因互動驗證改寫。臨時 5176 服務已結束，原 5175 開發服務保留，viewport 已重設。

## 實作檢查清單

- [x] 一般／固定／匯入卡片與光線同頁配置。
- [x] 原鎖定、隨機、全無及來源優先序保留。
- [x] 搜尋、鍵盤與焦點可用。
- [x] 匯入、Saved Cards、雙人及仰躺流程。
- [x] 桌面、手機、斷點、日夜主題及五工作區巡查。
- [x] 來源圖與最終內容区同一輸入比較，無未解決 P0／P1／P2。

限制：驗證針對本機 IAB 與已檢查狀態；不是遠端部署、其他瀏覽器或真實生成影像的驗收。
