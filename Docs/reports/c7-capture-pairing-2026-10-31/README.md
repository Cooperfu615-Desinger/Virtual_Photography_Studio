# C7 季節與風格光線／快門配對：整合驗收

日期：2026-10-31。狀態：本機功能、完整前端、瀏覽器及完整歷史鏈驗收全部通過，使用者已驗收並授權限定提交／推送；新CI與部署於交付時核對。

## 已交付與本批界線

前批 C7 黑白／彩色配對已推送 `b5f035003a48f9dae848b91b27eeccb296a37b3e`，遠端 main 讀回相符。[CI 41164989213](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/41164989213) 的 functions-quality、webapp-quality、build、deploy 全部 completed／success；正式站桌手機六工作區共12項檢查通過。這是第二批交付證據，本批季節／風格改動的部署須另核對新提交。

本批以該 SHA 建立新基準，限一般 PAGE1 單人與預設目錄。盛開向日葵避免隨機搭雪地／乾凍寒冬；風格明示日夜、高低調人物光與慢門時，隨機的另一欄避開相反條件。手選優先，舊卡公開原文、正式 catalog、ID／alias／semantic、renderer、UI選項及艾爾莎隨機可達性政策保持。

## 驗收結果

| 門檻 | 結果 | 證據 |
| --- | --- | --- |
| 修改前基準 | 3,936組，封存季節與整合獨立預期；不允許覆寫 | before.json.gz、oracle-transform.json |
| 季節階段 | 170組預期改選，完整對照通過 | season-final.log.gz |
| 整合階段 | 320組預期改選，含96組地點改選；2,200手動與276排除案例保持 | acceptance.log.gz |
| 明確衝突 | 適用隨機案例36組降為0；320是重新索引造成的變化數，不是320個原始錯誤 | integration-final.log.gz |
| 選值差異 | 地點96、風格86、環境光129、人物光18（同一案例可能多欄）；其他選值保持 | integration-final.log.gz |
| 隨機／衍生保護 | 本基準全部RNG次數及全身角色照保持；固定地點情境是持續契約，任意場景改選仍可能觸發原有依賴 | before.json.gz、acceptance.log.gz |
| 三批整合補驗 | 1,160組整合抽樣、12組自訂快取往返通過 | integration-final.log.gz |
| 聚焦回歸 | 三批17/17通過，包含精確來源、合理例外、未知值與回放安全 | focused-complete.log.gz |
| 前端／Prompt品質 | 2,083/2,083；853/853通過 | gates/tests-final.log.gz、gates/quality.log.gz |
| Python／目錄工具 | 59/59；32/32通過 | gates/python.log.gz、gates/tools.log.gz |
| lint／build／正式bundle | 通過；既有大chunk提醒保持 | gates/lint-final.log.gz、gates/build.log.gz、gates/bundle.log.gz |
| 同seed strict | 200筆，0 blocker；17份Prompt的18個既有診斷保持，前後稽核報告逐位元一致 | audit-before.log.gz、gates/audit-after.log.gz |
| 正式資料 | sync唯讀檢查、schema、1,050歷史ID、8生成物、catalog strict與207資產通過 | gates/sync.log.gz、gates/catalog.log.gz、gates/assets.log.gz |
| 完整歷史鏈 | 全部通過 | history.log.gz、history/ |
| 桌手機 | 各36次生成、40張卡ZIP、手動／全無、舊原文與舊選值還原通過 | browser/results.json、browser/ |
| 六工作區 | 桌面1440×1000、手機390×1000，共12項通過 | workspaces/results.json、workspaces/ |

## 來源與相容責任

產品改動只在 `engine.js` 的候選 predicate、範圍判斷，及新 `captureCompatibility.js`／`captureCompatibilitySources.json`。審閱表封存27風格、155地點、37環境光、32人物光、7快門的完整來源與理由（均含全無）；ID加完整英文吻合才套用政策，不從姓名、中文名稱或tag猜測。

未知原始ID會在舊流程正規化為空值，因此本批在正規化前後皆設保護。空快門與原始random目前都回到全無，本批沒有新增快門隨機功能；實際快門改善是手選1/1000s時，隨機風格排除明示慢門的保羅風格。1/250s、柔焦、濕版與一般銳利不因此被概括排除。

基準的獨立預期是在修改產品helper前，以原Git引擎、原picker及審閱關係插入候選判斷建立。未使用修改後結果重錄預期。JSON省略undefined屬既有序列化契約，驗收比較已採相同JSON往返規則。

## 歷史回放及初次檢查紀錄

新增精確外層回到可信b5f03500，再串接第二批、第一批、C2／C3／C4／B3／PAGE2／Phase4／A2／A1／A5。回放只允許隔離副本，拒絕正式checkout、symlink、未知或混合來源，並驗證Git原文SHA與重複執行。既有基準、patch與斷言正文均保留；第一批矩陣中向日葵的舊抽樣改為在可信歷史版本執行，現行結果由本批新基準驗證。

初次基準建構修正了一個將隨機案例誤命名為manual的分類；完成封存後未重錄。初次完整測試在歷史接點補齊期間啟動，有4項歷史接點失敗；接點定稿後重跑完整2,083項全通過。完整歷史鏈使用相同產品Git前像，後加的測試包裝接點另外以17項聚焦及完整前端驗證。初次紀錄一併封存，不冒稱從未失敗。

瀏覽器工具初次誤以全目錄比對原場景過濾選單，已改核對原有場景選單及冬季手選仍可見；舊卡還原改用全新隔離環境並等待Saved Cards延遲載入完成，避免測試自行縮減收藏後仍選到其他測試卡。單獨還原與完整桌手機流程均已通過，沒有修改收藏程式。

## 瀏覽器限制

本批功能桌面1440×1000、手機390×900；每個尺寸36次隨機、2組手選矛盾與全無、40卡下載，舊原文經Markdown／ZIP保留，另在乾淨環境套回舊卡選值。六個有效輸出存在，無新增console／page error、破圖或非預期頁面溢出。已人工檢視桌手機生成、舊卡還原與收藏截圖。

本批場景下拉的selectOption完成，未使用change fallback；這仍不等於原生下拉popup滑鼠互動已驗收，也不能將前兩批的fallback限制補記為通過。沒有生成模型圖片，不能宣稱最終成像品質或所有手選衝突已驗證。手機既有按鈕縮略及輸出框內捲動保持。

## 保護與交付

原4,695份追蹤檔中只修改6個必要既有檔，其餘4,689份保持；包含3,016份舊報告。其他20個工作目錄的140份未提交檔、狀態與SHA保持；另1個登記但不存在的目錄未清理。歷史基準、正式catalog與使用者收藏未變動。見protection.json；封存索引見raw-artifacts.json。

使用者已授權本批限定提交／推送，交付時核對新提交的CI／部署。`acceptance-summary.json`、`source-manifest.json`、`final-check.json`及保護清單是提交前的驗收快照，保留當時狀態及雜湊；本輪只更新五份文件的使用者驗收／交付狀態，未改程式、基準或驗收結果。前批授權交付已完成。PAGE2舊匯入、J12、P5b暫緩，C1／C6與其他C類未開工。

完整範圍見[規格](../../specs/c7-capture-pairing-v1.md)、[決策](../../decisions/2026-10-31-c7-capture-pairing.md)及[C7盤點](../../specs/c7-status-inventory-2026-10-31.md)。下一個內容項目為C1角色辨識差異，再是C6內容多樣性；保留例外與排除模式不自動轉成待實作授權。

## 重跑方式

使用既有Node22與依賴；根目錄設定 `REGISTRY_BASE_COMMIT=b5f035003a48f9dae848b91b27eeccb296a37b3e`。

- `node scripts/c7_capture_pairing_acceptance.mjs`；`--record`只限原Git且不存在基準時，現在會拒絕。
- `node scripts/c7_capture_pairing_integration.mjs`。
- `node scripts/c7_capture_pairing_history.mjs /tmp/c7-capture-history-rerun`。
- webapp：`npm test`、`npm run test:prompt-quality`、`npm run lint`、`npm run build`。
- 同seed strict、唯讀sync、Python、catalog strict、目錄工具、assets與正式bundle的完整命令記錄於gates/results.json。
- 本機正式build預覽5175；`PLAYWRIGHT_MODULE`指向既有Playwright後執行`c7_capture_pairing_browser.mjs`及`check_production_browser.mjs`。瀏覽器使用隔離儲存，不碰使用者Chrome。
