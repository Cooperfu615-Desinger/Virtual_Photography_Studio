# Asian Mix LoKr 強度控制驗收（2026-10-20）

- 本機功能分支 `codex/asian-mix-lokr-strength`；入口 `http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1`，使用獨立模擬任務儲存，不呼叫生成服務、不扣額。
- 沿用 DLL 原有核取框、色彩、欄位和響應式配置；新強度控制佔設定網格整列，滑桿自適應＋76px數字輸入，沒有新增斷點或變更整體面板寬度。
- 桌面1440×1000／手機390×900、DPR1，現行五工作區與三快速面板皆完成 render-and-inspect。桌面 document scrollWidth1425／手機375，均不超過 viewport；控件與說明可讀、無重疊，原有文字區內部捲動保留。
- 已檢查開關／1預設／0有效／0.05刻度／空白與1.2錯誤／停用生成、INT8不顯示、MOSS固定0.7、排入後改值不影響任務、歷史沿用／reload、來源帶入、兩張模擬成功與實際強度保存。無新 console warning/error；成果圖片均載入。
- Node22前端1736/1736、Node24 Functions102/102、兩端lint／前端build通過；build有既有大型chunk提醒。Node24前端曾因既有TAP格式斷言不符而失敗，Node22完整重跑通過。
- 證據資料夾：`/Users/cooperfu/.codex/visualizations/2026/09/21/01a0c277-5451-7130-b31f-c16c71e86b2c/asian-dll-qa/`。`final-desktop.jpg`顯示兩張模擬成果與0.4強度，`desktop-prompt.jpg`／`desktop-character.jpg`／`desktop-scene.jpg`是桌面三快速入口；`mobile.jpg`／`mobile-prompt.jpg`／`mobile-character.jpg`／`mobile-scene.jpg`是手機控制。瀏覽器截圖可能扣除捲軸／邊界（桌面1425×990、手機375×865或900），未修改圖片內容。
- 完成的是本機實作及模擬驗證；使用者後續另授權合併main與部署，功能提交`3d9cc30`已進main，四個Functions更新與匿名／CORS健康檢查通過。真實DLL API生圖仍待進行，詳見功能規格部署章節。

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

## 2026-10-13：PAGE1 全域「全部全無」

此節記錄原功能分支 `be820b3` 的驗證；該分支當時含指定動作。下列 1,590／713 與指定動作檢查是該分支的歷史結果，不能視為 2026-10-14 main 移植後的測試結果。

### 核准範圍與結果

使用者確認「一般選項全部全無，保留 MJ 參數與畫面文字」。左側第三顆按鈕由「清空可清除項目」改成「全部全無」，沿用現有外觀，操作後顯示「一般選項已全部設為全無」。單人／雙人的一般選項使用各自既有 none ID；保留人物數量、七個 MJ 參數、四個 Z-Image 精確畫面文字設定及 excluded 舊比例欄位。成品類型回到必要的寫實攝影預設。

清除角色卡／特殊角色、固定構圖與人物位置、指定動作與 snapshot、普通姿態與明確道具、姿態卡與匯入場景接管。自由仰躺的場景還原暫存一併丟棄，清空後再選站姿不恢復舊場景；普通取消仰躺及收藏還原的既有流程保留。分區／人物卡片的清空、清除可選欄位、全部隨機與回填 Prompt 沒有改名或改動。

既有「無額外表情」使用原 ID，明確設為 none，並從已選計數與摘要排除。一般單／雙人及三組車站的 none 景別不套用 placeholder 中景的 aerial 限制；camera caller 使用現成 fixed-scene context，其他固定構圖與非 none 景別、原表情 picker／orbit 限制均保留。沒有改 catalog、renderer 文案、public output fields、storage schema 或 golden fixtures。

### 修改檔案

- `webapp/src/components/Page1Workspace.jsx`：全域按鈕、提示與操作入口。
- `webapp/src/features/page1/page1Selectors.js`：辨識既有語義 none 表情。
- `webapp/src/features/page1/usePromptWorkspace.js`：全域操作明確丟棄自由仰躺場景暫存。
- `webapp/src/lib/page1WorkspaceSummary.js`：語義 none 不計入摘要／已選。
- `webapp/src/lib/engine.js`：限一般／車站 none 景別的 angle predicate。
- `webapp/src/features/page1/page1Selectors.test.js`：五組全域 none／保留範圍回歸。
- `webapp/src/lib/page1WorkspaceSummary.test.js`：三組單／雙人摘要回歸。
- `webapp/src/lib/engine/expressionNoneCamera.test.js`：六組一般／車站／雙人／legacy A/B 與非 none／固定管理邊界。
- `Docs/specs/page1-random-none-control-contract.md`：核准全域操作契約。
- `design-qa.md`：本次驗證紀錄。

### 最終自動驗證

所有程式驗證明確使用專案／CI 的 Node 22.22.3，沒有改動或縮減既有測試與凍結矩陣。

| 檢查 | 結果 |
| --- | --- |
| selectors、lock／指定動作 transitions、分區隨機、summary、none-camera、station、expression 聚焦檢查 | 100／100，exit0，2.317 秒 |
| 完整 `npm test` | 1,590／1,590，fail／skip／cancel 都為 0，exit0，139.434 秒 |
| `npm run test:prompt-quality` | 713／713，fail／skip／cancel 都為 0，exit0，138.040 秒 |
| `npm run lint`、`npm run build` | exit0；保留既有 Vite 大型 chunk 提示 |
| `scripts/validate_prompt_logic.mjs 200 prompt-quality-baseline --strict`，修改前後同 count／seed | 前後皆 exit0、blocking 0、diagnostic 22，沒有新增結構／控制語言／矛盾或覆蓋問題 |
| `git diff --check` | 通過 |

最終 audit 的主 GPT／Z／MJ 與兩組非 MJ 衍生字數統計相同；MJ 胸上平均 224.0 → 224.1，其他統計相同。保留 19 個既有服裝／場景診斷與 3 個 near-duplicate 訊號；沒有為了降低診斷數而修改其他搭配。

最終日誌位於 `/tmp/vps-all-none-qa/`：`focused-delivery.log`、`full-tests-delivery.log`、`prompt-quality-delivery.log`、`lint-delivery.log`、`build-delivery.log`、`prompt-audit-before.log` 與 `prompt-audit-delivery.log`。

### 瀏覽器操作與畫面

使用現有 `http://127.0.0.1:5175/Virtual_Photography_Studio/`，以獨立 Chromium context 驗證，沒有改寫使用者原分頁的設定／收藏。桌面 1440 × 1000、手機 390 × 900，33 項檢查全部通過，console warning／error 與 page error 為空。

- 四顆左側按鈕順序與文字、鍵盤 Enter、成功提示與重複操作。
- 單人全無與表情顯示、B 摘要未設定／計數 0；雙人 A/B 均清空且維持兩人模式。
- 七個 MJ／四個 Z 文字設定與舊比例完整保留；GPT 舊表情來源不再出現，Z 精確文字保留。
- 在隔離環境保存測試收藏、全部隨機、套用收藏與 reload；全無選值及保留參數正確還原。
- 固定構圖、角色卡、指定仰躺 snapshot、自由仰躺暫存皆清空；退出仰躺後舊場景不回復。
- 全無後選擇鳥瞰，選單及生成的 GPT 保留同一角度。
- 單／雙人、日／夜模式，工作台欄位與按鈕沒有新增裁切或重疊。
- Prompt 工作台、角色建模、動作姿勢、場景建模、觀察式抓拍、Saved Cards 均於桌面／手機載入及畫面巡查；document 沒有水平溢位，圖片完整。

共保存 20 張瀏覽器直接擷取的 PNG（八張操作／sidebar 狀態、十二張工作區脈絡）與 `browser-results.json`。工作區截圖等待導覽轉場與 toast 結束；操作截圖保留成功提示作為狀態證據。主代理與第二位代理已分別檢視工作台及其他工作區畫面，沒有新的阻擋問題。證據資料夾：

`/Users/cooperfu/.codex/visualizations/2026/09/23/01a0cba8-2f6d-7423-a0d2-fa7e6bc5f563/all-none-20261013/`

### 迭代與既有測試界線

初次全域 none 修正揭露既有「無額外表情」會觸發中景相容性 fallback，造成全無景別的鳥瞰被替換。新增四組測試先重現 FAIL；隔離 HEAD 只明確指定既有 none 表情 ID 即可重現，不是未固定 seed。曾嘗試全面排除 none 表情，再嘗試對所有 none 景別解除限制；兩者都使歷史固定場景的輸出／selection／RNG 凍結矩陣漂移，已撤回。最終只調整一般／車站路徑；原 6,370／6,320／431 案例凍結矩陣與所有 golden 完整通過。歷史 memo 僅當次 process 使用，沒有跨執行快取或清理快取來掩蓋差異。

一次中間完整執行另遇 `enginePromptPipeline.test.js:934` 的既有未設 seed 測試偶發失敗：它只鎖人物 B 的眼鏡，卻要求人物 A 必有 `Has`。以 Node 22、seed `role-card-has-6` 的暫存 Math.random hook，隔離 HEAD `e86703e` 原測試在第 952 行可重現；相同 locks／seed 下 HEAD 與本批 GPT／selection 完全相同（GPT SHA-256 `d4a64b467a9a72685eb211f3ef33fdeb6bd50b31076855bac2c136777a5a0afd`）。最終完整執行通過；沒有擴修此不相關測試或 renderer。隔離證據已與截圖保存在同一資料夾。

原有 current-state／provider dirty 文件及未追蹤參考資料保留。沒有 stage、commit、push、部署或外部生圖；隔離瀏覽器已關閉，原 5175 服務保留。此批驗收限本機 Chromium 與列出流程，不宣稱遠端部署、其他瀏覽器或影像模型驗收。


## 2026-10-14：將全域「全部全無」單獨移入 main

使用者授權將全域「全部全無」合併到 main。以遠端 `468edac` 為基底，只套用 `be820b3` 的差異，保留 main 原有資料庫報告／架構文件；`e86703e` 指定動作不在本次合併範圍。於獨立臨時 Git worktree 操作，原工作區的三份 dirty 文件與未追蹤參考資料保留。

五個正式程式檔的修改維持原功能提交的內容，不帶入指定動作 UI、catalog、renderer 或 storage schema。移植後的 selector 測試仍檢查全部既有 controls 與 owners，只排除 main 不存在的指定動作／snapshot 欄位；規格同步 main 的實際功能。原功能分支的完整測試及瀏覽器證據保留在上一節，沒有宣稱它們已於此 main 組合再次執行。

合併檢查涵蓋精確檔案範圍、正式程式差異、保留 main 文件與排除指定動作、暫存差異格式，以及本機／遠端 SHA。main push 依既有 GitHub Actions 執行資料／資產檢查、前端與 Functions 測試／lint、build 及 Pages deploy；實際結果以該次 Actions run 為準。本次沒有額外改動 workflow、Functions 或手動部署。

## 2026-10-14 — 單人參考圖人物與穿搭

- 基底：遠端 main `9629c4b`；獨立分支 `codex/reference-person-preview`，工作區 `.worktrees/reference-person-preview`。原工作區三份未提交文件及未追蹤參考資料保持原狀；未 stage、commit 或 push。
- 範圍：現行六輸出預覽／複製、獨立參考圖開關＋四種模板；同 resolved source，外觀／穿搭來源省略，保留表情、姿勢、場景及各 renderer 的構圖與成像政策。收藏／DLL 仍為原文，不增加上傳或 provider 請求。
- 自動檢查：聚焦 9/9；完整前端最終 1594/1594（67.97 秒）、Prompt Quality 698/698、lint／build／diff-check 通過。同 seed `200 / prompt-quality-baseline --strict` 前後完整報告逐字一致，blocking 0，既有 finding prompts 20；Vite 既有大型 chunk 提示保留。
- Visual QA: PASS。URL `http://127.0.0.1:5175/Virtual_Photography_Studio/`，桌面 1440×1000、手機 390×900，Chromium 隔離儲存。
- 檢查：六組非空白參考輸出、鍵盤 Enter 開啟、關閉逐字恢復、四張多機位組合、清除模板但保留參考模式、Gpt 複製與實際 clipboard read-back 相同、收藏儲存仍無參考指令、重新生成／離開工作區重設。雙人與角色卡手機停用狀態通過；自訂身份、特殊主體、空值由自動測試覆蓋。
- 導覽：Prompt 工作台、角色建模、動作姿勢、場景建模、觀察式抓拍、Saved Cards 於兩尺寸載入；document 無水平溢出，console error／page error 為 0。新按鈕、狀態文字與說明無遮擋；沿用既有手機「套用目前預覽」截字。未改圖片資產。
- 證據：`/tmp/vps-reference-1440.png`、`/tmp/vps-reference-390.png`；結果 `/tmp/vps-reference-browser-results.json`。自動 logs `/tmp/vps-reference-{focused,full-final,quality,lint-final,build-final,audit-before,audit-after}.log`。
- 未驗證：外部圖片模型的實際參考一致性、多張生成及原生圖片參數；此功能是提供外部附圖使用的文字投影。未進行付費生成。保留 5175 本機預覽供使用者確認。

- 交付授權：使用者已確認本機操作，並授權本批 commit／push 與合併 main；遠端 main 合併前仍為 `9629c4b`，無新增上游差異。


## 2026-10-16 — 指定動作分支整合 main

- 使用者授權合併 `codex/specified-actions-v1` 並確認 CI／Pages；以 main `a5a3126` 在獨立 managed worktree 整合 `be820b3`，保留原工作區 27 個未提交／未追蹤檔案的逐檔 SHA-256。
- 解決 current-state、全無契約／測試與歷史 QA 文件衝突。保留 main 的參考圖預覽、標點／族裔／比例政策與六輸出；指定動作契約與整合測試改為 GPT 胸上一種衍生，沒有帶回已移除的 MJ 胸上。全域全無不重複移植。
- 聚焦 41/41、完整前端 1624/1624、Prompt Quality 711/711、lint、build、sync check、Python 2/2、公開資產 207 檔及 diff-check 通過。本機 Node 25.8.2；遠端 CI 使用 workflow 的 Node 22，Functions Node 24。build 首次因隔離目錄寫入權限失敗，授權重跑通過；保留既有大型 chunk 提示。
- 同 seed `200 / prompt-quality-baseline --strict` 與以 `git archive a5a3126` 取得的 main 基準報告逐字相同，無新增 blocking 或診斷。
- Visual QA: PASS。為保留原 5175 預覽，隔離版使用 `http://127.0.0.1:5176/Virtual_Photography_Studio/`。1440×1000、390×900、390×640 及 639／641 斷點共 38 項指定動作檢查通過，涵蓋八動作圖片、有效輸出、獨立表情／頭部、取消、仰躺場景／重載／收藏還原、較高優先接管者、鍵盤及剪貼簿；六工作區桌面／手機巡覽無錯誤、破圖或 document 橫向溢位。
- 額外重跑 main 參考圖預覽桌面／手機流程通過，錯誤清單為空。證據 `/tmp/vps-merge-browser/{results,extra-results}.json`、`/tmp/vps-merge-reference-browser-results.json` 與同目錄截圖；自動 logs `/tmp/vps-merge-{focused,full,quality,lint,build,audit,baseline-audit}.log`。
- 原分支歷史記錄保留；本次 CI／Pages 發布結果以整合提交對應 GitHub Actions 為準。沒有 Functions 部署、外部模型生圖或修改原工作區文件。


## 2026-10-17 — 單手向鏡頭張開手掌：前景透視文字

- Scope: 保留名稱、ID、鏡頭／角度／服裝／頭部／表情與選項規則；僅修改手部動作及既有 composition modifier，舊英文作還原 alias。
- Validation: Node 22 完整測試 1636/1636、Prompt Quality 721/721、lint、build、sync check、Python 2/2、diff-check 通過。同 seed 200 strict audit 前後一致，0 blockers／22 既有 diagnostics。137 案例確認所有規則／選值不變，輸出差異限核准文案。
- URL: http://127.0.0.1:5175/Virtual_Photography_Studio/
- Viewports: 1440×1000、390×900；兩尺寸完成既有手勢切換至張掌、六輸出、複製、清除、收藏還原、reload、蹲姿隱藏規則與五工作區 smoke。
- Render inspection: 無 console/page error、水平溢出或破圖；手機角色圖卡捲動後全部載入，既有 textarea 內部捲動維持。
- Evidence: `/tmp/palm-qa/results.json`、`/tmp/palm-qa/{1440,390}-selection.png`、`/tmp/palm-qa/{1440,390}-output.png` 及兩尺寸五工作區截圖。
- Harness boundary: 初始全無的 Playwright selectOption 停用判定未解除，選取驗證從既有有效手勢開始；清為全無與收藏還原通過。未修改 UI 或選項規則來配合工具。
- 原不相關修改保留。使用者於本機驗證後授權 commit／push，本批以 `codex/open-palm-foreground-v2` 分支交付，不合併 main 或觸發 Pages 部署。完整核准文字、測試及外部出圖驗收邊界見 [規格](Docs/specs/open-palm-foreground-v2.md)。

## 2026-10-17 — Comfy Cloud 圖生影片工作區

### Source / implementation / scope

- Source visual truth: `/Users/cooperfu/.codex/generated_images/01a0c277-5451-7130-b31f-c16c71e86b2c/exec-e28f82ac-9f16-48e5-8c27-d15770d6adc7.png`，使用者已核准。
- Implementation: `http://127.0.0.1:5175/Virtual_Photography_Studio/`；既有 DEV `dllPicDemoImage` 用公開衣服參考圖展示入口，未真實生圖。
- Final screenshots: [桌面](Docs/reports/comfy-video-workspace-2026-10-17/desktop.png)、[手機](Docs/reports/comfy-video-workspace-2026-10-17/mobile.png)、[手機設定 mock](Docs/reports/comfy-video-workspace-2026-10-17/mobile-settings-mock.png)、[結果 mock](Docs/reports/comfy-video-workspace-2026-10-17/success-mock.png)。
- Source and final desktop capture: 1513×1039 pixels / 1513×1039 CSS pixels；1:1 density，沒有圖片縮放或裁切以掩蓋差異。另驗 1440×1000、390×900、819×1000、821×1000。
- State comparison: 來源圖片、Wan、5 秒、720p、動作及運鏡文字。示意圖的咖啡廳人物為動態使用者來源示範；實作使用既有綠裙參考圖，不視為品牌／裝飾素材替代。Mock 已登入且金額虛構；正式截圖未登入，因此金額未知且生成停用是必要差異。
- 同一 CUA comparison input 同時呈現原示意圖及最終截圖，比對整體、右側表單、額度、結果容器。原尺寸字樣可讀，未另裁切局部。此批僅檢查影片及新增入口，不重設現有 prompt／Saved Cards。

### Findings / iterations

- [P2, fixed] 初稿 modal 最大 1240px，比示意圖過寬；改成 1120px。1513×1039 重拍，左右約60/40、預覽與右表單閱讀順序一致。內部捲動用於短螢幕及展開設定，不造成頁面橫向溢出。
- [P2, fixed] DLL 小圖卡增加按鈕後文字被壓成直排；figcaption 允許換行、按鈕不縮小，lightbox 標題列可換行。手機 lightbox 實查三操作均可用。
- [P2, fixed] 手機停用固定生成按鈕的 opacity 讓背後文字透出；改為不透明淡藍色。最新 mobile.png 可見白色底部遮罩與完整按鈕，底部內容可捲至按鈕上方。
- [P2, fixed] 關閉後浮動入口重新掛載導致原 focus 失效；加入回到浮動入口的 fallback。焦點迴圈排除折疊 details 內的 input 及非控制項影片縮圖；原生 Shift+Tab 從關閉到更多設定、Tab 返回關閉已驗證，Esc 後返回「開啟影片工作區」。
- No remaining actionable P0/P1/P2 visual findings in checked states. 不把未部署／外部影片驗收當成視覺 QA 通過的範圍。

### Required fidelity surfaces

- Fonts / typography: 沿用專案字型、24px modal heading、12–15px controls、手機輸入16px。無長中文斷字壓縮；模型名及錯誤可讀。產生式示意圖的微小字型差異未另外引入字型依賴。
- Spacing / rhythm: 圓角白色大 modal、左預覽與結果、右表單／額度／CTA。1120px 上限、92dvh；820px 以下全螢幕，兩側16px。所有控制項可由內部捲動到達；沒有文件水平捲動。
- Colors / tokens: 重用 panel/control/subtle/selected/accent/text/border tokens，主按鈕藍色、輔助灰色，選取模型藍框。停用與失敗有清楚狀態。
- Images / icons: 真正來源 img、真 MP4 video controls、object-fit contain 不裁切；使用 lucide 的 Film/Play/Download/Refresh/X。來源示範不同為內容差異。模擬播放fixture只2秒，不能當成真實模型5秒成果。
- Copy / content: 保留「製作影片」「來源圖片」「影片結果」「本張圖片的影片」「生成影片」；成功後「再生成一支」。真實限制、費率時間、未登入、估價不含工作流執行費取代示意數值；模型切換不相容設定有提示。

### Browser validation

- 主 app：圖卡→modal、lightbox→modal（僅一個dialog）、關閉／返回、模型能力、文字與捷徑、匿名disabled、背景 inert、鍵盤迴圈、手機固定CTA、819/821斷點。
- 五工作區 desktop/mobile smoke：Prompt、角色、動作、場景、Saved Cards；各頁標題與內容正常，document scrollWidth 不超過 clientWidth，破圖0。只讀原本9張收藏，沒有套用／新增／刪除。
- 暫時獨立 harness（已移除）：排隊／生成鎖定、關閉續跑、完成、兩模型兩結果、原生影片播放、下載、失敗保留草稿、遺失提交回應後重載續查、額度更新失敗保留既有數值。
- 模擬 MP4 下載 SHA256 `7757066a839414310d6208d01b7e5d53914887bc3f946c67f6a4e5e54884ef16` 與本機 fixture 一致。真實下載分段另由 unit tests 驗證，真 Cloud CDN 仍待部署後確認。
- 初次熱更新時，修改 effect dependencies 出現一次 React HMR 警告；完整 reload 後及最新互動無新增 console error/warning，mock頁無console錯誤。未忽略持續的執行錯誤。
- 全部自動化結果與尚未部署的界線見 [實作規格](Docs/specs/comfy-video-workspace-v1.md)。無付費作業、無 Secret 讀取。

### Implementation checklist

- [x] 維持已核准 modal 主要配置、既有視覺語言與獨立影片契約。
- [x] 修正初稿寬度、入口換行、手機按鈕及鍵盤迴圈，再次檢查。
- [x] 桌面／手機／斷點及狀態操作完成，暫時 harness 移除。
- [x] 使用者另行授權後，兩個新 Functions 已部署並驗證 ACTIVE／匿名拒絕；原七項服務 metadata 不變。
- [ ] Wan/H3 真實付費影片、扣額、播放與 CDN 下載驗收。

final result: passed

## 2026-10-19 — DLL_PIC Pro 完整版第一版（本機驗收）

### Scope and visual reference

- 使用者核准獨立分頁示意並授權實作；保留四個快速面板，未授權 Git 提交或部署。
- 來源示意：`/Users/cooperfu/.codex/generated_images/01a151ae-96a5-7132-9699-ea8d4e95fc62/exec-1b9bc2ea-5461-4a54-91e8-3b9ca992968f.png`。
- 與實際 `Docs/reports/dll-workspace-v1-2026-10-19/workspace-desktop.png` 在同一次影像檢視中比對：保留左設定／右成果／右下任務、六來源、雙圖及提升解析度操作。實作採原站字型、圓角、配色與較寬鬆間距；圖中的流程編號／連線說明沒有放入正式操作介面。
- 示意咖啡店人物與實際本機測試角色圖不同；模擬橫幅清楚標示非真實出圖與放大，沒有以測試圖片宣稱畫質驗收。

### Render and interaction evidence

- 1440×1000、390×900 七工作區導航與畫面檢查，document overflow 0、broken image 0；819／821 與1099／1101兩側排版檢查通過。
- 四個快速入口帶入各自實際來源；原草稿不默默覆蓋。快速生成切到完整版仍繼續，成功結果共用。六來源、胸上固定4:5、xAI不相容禁止提交通過。
- 本機模擬：兩張生成、reload保留圖片／草稿、沿用單圖Seed1235、歷史切換、雙圖與原圖／放大比較、100%／縮放控制、手機設定／成果切換、加入放大任務後執行通過。
- 清單：兩筆排隊後暫停，當筆完成、下一筆仍待執行；再取消待執行。`[offline]`模擬中斷後呈待確認，重載只查詢後恢復兩張成果。
- 鍵盤焦點圈限／Escape 與背景inert已實作；實體雙指手勢未操作驗收。圖片下載按鈕無頁面錯誤，但IAB沒有回傳下載事件與檔案路徑，下載落盤待一般瀏覽器人工驗收。
- 一般模式空白歷史、Comfy未登入提示、與模擬資料分離通過。未送付費生成、未更改Saved Cards的9張資料。最後模擬／一般頁console errors/warnings皆空。
- 截圖：`workspace-desktop.png`、`normal-empty-desktop.png`、`settings-mobile.png`、`results-mobile.png`、`compare-desktop.png`、`compare-mobile.png`、`recovery-pending.png`與各工作區／斷點截圖，均在 `Docs/reports/dll-workspace-v1-2026-10-19/`。

### Validation and limits

- 前端Node22：1677/1677、lint、build通過。Functions Node24：91/91、lint通過。Production bundle未包含模擬執行程式。
- 原有Vite大型chunk提示保留；未改Prompt renderer，沒有執行無關資料同步／Prompt strict audit。
- 新 `comfyCloudWorkspaceSubmit` 與 `comfyCloudImageWorkspace` 未部署。指定Seed／放大／取消的實際Cloud功能、SeedVR2可用性、扣額與畫質待另外驗收。
- 本批未stage、commit、push、deploy；保留其他未追蹤文件。詳見 [完整版規格](Docs/specs/dll-pic-pro-workspace-v1.md)。

Result: local UI and automated checks passed; user acceptance, download-to-disk, physical touch and live Cloud acceptance pending.

### 2026-10-19 使用者驗收補記

使用者確認「實際測試沒問題，可以 commit/push」，本機版本驗收通過。授權本批 Git 提交／推送；交付 `codex/dll-pic-pro-workspace-v1`，保留暫不部署限制，不合併會觸發 Pages 的 main。上方自動化證據與真實 Cloud 尚未驗證範圍維持原紀錄；未把一般本機驗收推定成雲端付費出圖驗收。

## 2026-10-20：MOSS 與固定 LoRA 開關

Visual QA: PASS（本機模擬與未登入 UI）；真實 API、扣額、下載待部署後驗收。

- URL：`http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1`；一般入口僅查看未登入額度保護。
- Viewports：1440×1000、390×900；沒有新增斷點。現用五工作區與三個快速面板均已檢查；動作姿勢導覽沿用最新主線退休狀態。
- 新增單一 MOSS 模型選項與「套用 MOSS LoRA」checkbox，強度固定0.7。跨滿原有格線並保留原生鍵盤焦點／Space，完整版一般input樣式不再拉寬此checkbox；其他模型與既有視覺語言不變。
- 驗證 base一張、LoRA兩張、Seed42/43、immutable排程、歷史沿用／單張Seed、草稿reload、快速→完整版明確帶入、模擬loading／中斷／手動查詢恢復。只用獨立模擬資料庫，新增三筆測試任務，既有11張收藏只讀；不是實際MOSS畫質測試。
- Console/page errors：沒有新的console warning/error。水平溢出／破圖：沒有；clientWidth等於scrollWidth，桌面1425／手機375。正常模式未登入時額度刷新停用。
- 自動檢查：Node22前端1735/1735、lint/build；Node24 Functions98/98、lint；diff-check通過。建置保留大型chunk及混用import提示。
- [桌面](Docs/reports/comfy-moss-lora-2026-10-20/desktop-final.png)、[手機](Docs/reports/comfy-moss-lora-2026-10-20/mobile.png)、[完整檢查紀錄](Docs/reports/comfy-moss-lora-2026-10-20/visual-qa.json)。詳見 [MOSS／LoRA規格](Docs/specs/comfy-moss-lora-v1.md)。
- 獨立分支 `codex/moss-optional-lora`；尚未 stage／commit／push／部署。本機新工作目錄未複製Firebase環境設定；私有LoRA的正式API可見性、真實執行／扣額／下載未驗收，不以既有GUI成功替代。

2026-10-20 使用者確認整合並授權 commit／push、合併 main 發布正式 DLL，及部署四項 Functions；上列「尚未」為完成本機驗收當下狀態。Git／Pages／Functions 的實際結果另記於 MOSS 規格。
