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
