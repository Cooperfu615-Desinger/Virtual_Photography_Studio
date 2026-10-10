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

---

# 攝影成像四卡片 UI 驗證

日期：2026-10-10

final result: passed

## 核准目標與變更範圍

依使用者核准的一般場景與固定構圖示意圖，將 E 攝影成像整合為四張同頁卡片：成品類型、構圖與視角、鏡頭與光學、風格與成像。保留原十個 control keys、選項順序與完整名稱、英文複製來源、必要欄位、隨機／全無、固定構圖及自拍管理規則。沒有新增平行 storage 或修改 Prompt renderer。

本次程式檔案：

- `webapp/src/components/Page1Workspace.jsx`：攝影介面整合；原欄位準備流程共用，其他 renderer 沿用原結果。
- `webapp/src/components/PhotographyControls.jsx`：四卡片、快捷選項、摘要、管理提示及場景入口。
- `webapp/src/features/page1/photographyEditor.js`：唯讀介面 model 與各卡片可操作 keys。
- `webapp/src/features/page1/photographyEditor.css`：攝影區專用、日夜 tokens 及響應配置。
- `webapp/src/features/page1/photographyEditor.test.js`：14 個聚焦回歸案例。

## 視覺目標與最終證據

兩張核准的來源圖：

- 一般場景：`/Users/cooperfu/.codex/generated_images/01a0cba8-2f6d-7423-a0d2-fa7e6bc5f563/exec-c279aabf-e6b7-4188-a274-dd08eaa3df70.png`
- 固定構圖：`/Users/cooperfu/.codex/generated_images/01a0cba8-2f6d-7423-a0d2-fa7e6bc5f563/exec-6b785d70-e651-406a-95c7-8b1e4537862f.png`

來源圖為 1422 × 1106 的配置示意。實作使用既有 5175 服務，桌面 viewport 1440 × 1120、手機 390 × 844，DOM 回報 devicePixelRatio=1。全頁脈絡截圖與四卡片內容區均與來源圖同次輸入比較；固定構圖另比較來源圖、完整脈絡及內容區。未將來源圖當作要匯入的產品圖片資產。

最終證據資料夾：

`/Users/cooperfu/.codex/visualizations/2026/09/23/01a0cba8-2f6d-7423-a0d2-fa7e6bc5f563/photography-ui/`

| 證據 | 狀態／範圍 | 實際圖片像素 |
| --- | --- | --- |
| `ordinary-top.jpg` | 桌面一般場景，包含工作台脈絡 | 1425 × 1108 |
| `fixed-top.jpg` | 桌面固定構圖，包含工作台脈絡 | 1425 × 1108 |
| `ordinary-desktop.jpg` | 單人一般場景，完整 E 區 | 776 × 911 |
| `fixed-desktop.jpg` | 海邊坡道平交道，完整 E 區 | 776 × 1051 |
| `ordinary-mobile.jpg` | 手機一般場景，完整 E 區 | 327 × 1857 |
| `fixed-mobile.jpg` | 手機固定構圖，完整 E 區 | 327 × 1972 |
| `fixed-desktop-dark.jpg` | 深色固定構圖，完整 E 區 | 776 × 1051 |
| `fixed-mobile-dark.jpg` | 深色手機固定構圖，完整 E 區 | 327 × 1972 |
| `duo-desktop.jpg` | 雙人共用配置，完整 E 區 | 890 × 911 |
| `duo-mobile.jpg` | 手機雙人共用配置，完整 E 區 | 327 × 1857 |

圖片由瀏覽器直接擷取。內容區依 DOM 矩形裁切，沒有放大、重畫或修改像素。backend 實際回傳 JPEG，證據以正確副檔名保存；完整畫面像素與要求的 viewport 略有差異，以 DOM viewport 與各圖實際尺寸分別記錄。

## 比較結果與迭代

最終沒有未解決的 P0／P1／P2 問題；第二位代理另外唯讀巡查四張 E 圖與其他工作區八張圖，亦未發現阻擋問題。

| 表面 | 比較與處理 |
| --- | --- |
| 結構與順序 | 四張卡片順序與核准設計一致；成品與景別直接選取，pitch／orbit 在景別下方，四項鏡頭欄位為雙欄，風格與成像保留獨立控制。 |
| 桌面密度 | 初版成品 3 × 2 與較大內距讓卡片偏高。容器 ≥600px 的成品改一排六項；桌面內距、操作列與欄位間距縮減。最終一般卡片高度為 122／302.5／243／149.5px，保留可讀字級與現有完整選項名稱。 |
| 字體與階層 | 沿用系統字型；E 標題桌面20px、卡片標題18px、欄位與摘要12px、選項13px。長景別英文及風格摘要可換行；手機原生選單的可見寬度有限，完整選中名稱仍由摘要與原生選項提供。 |
| 色彩與圖示 | 沿用既有 surface／text／border／accent tokens，淺色與深色皆可讀；選中藍色、勾選、Copy 與鎖頭使用 Lucide。沒有插畫或攝影資產，沒有自繪圖片替代物。 |
| 固定管理 | 每個受管理欄位顯示值、場景／自拍管理與原因；入口連回 D 的固定場景設定。實作顯示真正限制，沒有為 generic fixed 場景虛構焦段、景別或方向。 |
| 手機與鍵盤 | ≤700px 欄位單欄、快捷選項兩欄；可操作按鈕 ≥44px高，選項48px。原生選單可操作，focus-visible 邊框可辨識；中文長摘要與場景入口正常分行。 |

另外補強固定場景允許 orbit、但自拍手部鎖住 orbit 的提示 fallback；場景本身管理時仍保留場景優先。摘要使用 prepared effective value，頭部主導近景不會顯示隱藏的無效角度。

## 操作與狀態驗證

互動使用獨立 origin `http://photography-ui-20261010.localhost:5175/Virtual_Photography_Studio/`，避免改寫使用者 127.0.0.1 與既有 localhost 的設定／收藏。原 127.0.0.1 分頁已顯示 HMR 後的 E 區；各狀態則在同一服務的獨立 origin 操作。

- 一般場景十欄、六種成品與景別、選中標記、英文 Copy 成功提示、成品重設預設。
- 構圖與鏡頭的隨機／清空只改各組可操作 keys；風格、成像與其他組設定保留。
- 頭部主導近景：蟲眼角度投影為全無、七個不相容角度停用；切回全身恢復原蟲眼角度。
- 海邊坡道平交道與海邊階梯小巷：景別、俯仰、環繞、焦段、光學五欄管理，光圈／快門／風格／成像可調。
- 紐約地鐵月台：景別及光學管理，保留 pitch／lens 與原「人物面向（場景取景方向固定）」選項。
- 正面長椅車廂：orbit／光學管理；側面走道保留四方向，不提供全無／隨機；擁擠車廂保留八方向及全無／隨機。其餘原可調項目保留。
- 普通場景與清水模沙發場景的自然自拍：orbit 顯示自拍管理原因，不誤標為場景管理。
- 查看場景設定入口到 D 固定區、返回 E；單人／雙人切換後顯示雙人共用，單人固定場景的保留值不接管雙人。
- 在獨立 origin 保存一張測試收藏，改成水彩後套用該卡：寫實攝影、海邊固定來源及光圈／快門／風格／成像成功還原。
- 五個工作區在桌面及手機完成載入與畫面巡查；角色圖片正常，沒有新增破圖、重疊或裁切。
- 最終版本在360／390／700／701／820／821／1100／1101／1440px檢查欄位與 document 寬度，全數沒有意外橫向溢出。長頁的垂直捲動為刻意保留。
- 淺色與深色、單人與雙人、一般及受限狀態截圖已保存。瀏覽器 error／warn 查詢為空，未觀察到新執行錯誤。

細部 DOM 記錄：`browser-evidence.json`。其他四工作區桌面／手機脈絡截圖在 `/tmp/vps-photography-ui-qa/` 的 `workspace-*`／`mobile-workspace-*`；它們是可見範圍巡查，不宣稱每個其他工作區的所有折線以下狀態都重新驗收。

## 自動驗證、既有環境差異與交付界線

- 攝影、場景、selectors、camera labels、random、head-dominant、station及carriage聚焦檢查：72／72通過。
- 完整 `npm test`，明確使用專案／CI 的 Node22.22.3：1,436／1,436通過，fail／skip／cancel皆0，215.397秒。
- 最終 `npm run lint`、`npm run build`：exit0。既有Vite大型chunk提示保留。
- `git diff --check`：通過。
- 初次完整套件被登入shell選到Homebrew Node25.8.2；兩項既有runner自測只因spec reporter輸出與TAP文字斷言不符而失敗。HEAD `0d4ba7e` 在獨立暫存來源重現同樣問題；Node22以及Node25明確TAP都通過。沒有修改runner或縮減測試範圍，改用正確runtime重跑完整套件。
- 日誌：`/tmp/vps-photography-ui-qa/full-tests-node22.log`、`lint-final.log`、`build-final.log`。

現有 current-state／provider文件、服裝來源／metadata／generated database／測試及未追蹤參考資料保持原狀。本次沒有 stage、commit、push、部署或付費生圖。獨立測試分頁已結束、viewport override已重設，原5175服務及使用者分頁保留。

限制：此驗證涵蓋本機 IAB、列出的 viewport 與流程；不是其他瀏覽器、遠端部署或生成影像的驗收。
