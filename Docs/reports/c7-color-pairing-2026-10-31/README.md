# C7 第二批：PAGE1 單人黑白／彩色隨機配對驗收

日期：2026-10-31。可信 main 與本輪再次確認的遠端 main：`591cc0575ab87582540662236b4230fadfea16bf`。本機驗收通過，瀏覽器限制如下保留；待使用者驗收。未 stage、commit、push 或部署。

## 實作結果

一般 PAGE1 單人、預設目錄的隨機風格／成像避免明確黑白與彩色相反配對。一欄手選就約束另一隨機欄；兩欄手選保留原值，即使刻意衝突；雙隨機維持先風格、再成像。全無及沒有明確黑白／彩色要求的來源不增加限制。

依完整英文與永久 ID 精確辨識26筆風格（2黑白、13彩色、11開放）與26筆成像（2黑白、23彩色、1全無）。原成像的88%／12%一般／低頻抽樣節奏保持；不因黑白候選沒有VHS而少消耗亂數。原頻率組無相容項時，用同一索引亂數從全部相容項選取，不額外重抽。人物、穿搭、場景、姿勢及全身角色照保持。

產品變更限於 `engine.js` 的兩個隨機 picker 接點與適用範圍，以及新 `imagingColorCompatibility.js`／`imagingColorSources.json`。沒有改正式 catalog、semantic、ID、alias、renderer 文字、UI、選單順序或儲存格式。艾爾莎的場所／隨機可達性政策保持；其他模式、C7季節及光線／快門衝突另批處理。

規格：[c7-color-pairing-v1](../../specs/c7-color-pairing-v1.md)。決策：[2026-10-31-c7-color-pairing](../../decisions/2026-10-31-c7-color-pairing.md)。重跑入口及原始證據見下方與 [acceptance-summary.json](acceptance-summary.json)。

## 驗收結果

| 檢查 | 結果 | 證據 |
| --- | --- | --- |
| 修改前問題可重現 | 新回歸在原引擎失敗，黑白風格抽中彩色成像 | regression-before.tap.gz |
| 固定基準 | 2,482組全數符合獨立預期；2,241組適用、593組改選；原277組適用隨機衝突降為0；702組完整手動矩陣保持 | before.json.gz、oracle-transform.json、record.log.gz、acceptance.log.gz |
| 選值與輸出保護 | 每組比較 selection、structured、摘要、六輸出與亂數次數；只允許style／film及原光學相容連動，所有全身角色照不變 | acceptance.log.gz |
| 補充模式 | 112組：16躺姿、80隨機動作含5次躺姿、16舊相機profile優先權；ZIP舊公開四主＋兩衍生原文保持 | modes.log.gz |
| 聚焦及歷史接點 | 13/13 | focused-history-final.log.gz |
| 前端完整測試 | 2,077/2,077 | gates/tests-final.log.gz |
| Prompt品質 | 853/853 | gates/quality.log.gz |
| Python與目錄工具 | 59/59與32/32 | gates/python.log.gz、gates/tools.log.gz |
| lint／build／正式bundle | 通過，既有大chunk提示保留 | gates/lint-final.log.gz、gates/build.log.gz、gates/bundle.log.gz |
| 同種子strict | 200筆、0 blocker；17份Prompt的18個既有診斷保持；只有GPT與Z平均詞數各減少0.1 | audit-before.log.gz、gates/audit-after.log.gz |
| 正式資料護欄 | 唯讀sync、schema、1,050個歷史ID、8生成物及catalog strict通過 | gates/sync.log.gz、gates/catalog.log.gz |
| 資產 | 207檔通過 | gates/assets.log.gz |
| 完整歷史鏈 | C7第一批及C2／C3／C4／B3／PAGE2／Phase4／A2／A1／A5原鏈通過 | history.log.gz、history/ |
| 受影響瀏覽器流程 | 1440×1000與390×900各40次隨機配對、手動衝突、全無、收藏／還原／43卡ZIP下載通過 | browser/results.json、browser/截圖與ZIP |
| 工作區導覽 | 1440×1000與390×1000各六個現行工作區，共12項通過；無console／page error、壞圖或意外水平溢位 | workspaces/results.json、workspaces/截圖 |

before.json.gz 於修改引擎前產生且不可覆寫。獨立預期先執行可信原 picker、記錄原亂數，再以審閱表將最後索引投射到相容候選；沒有讀新產品 helper，也沒有用修改後引擎重錄基準。593組改選包含縮小候選池後重新索引的相容組合，不等同593組原始矛盾；style改選260組、film改選333組，另6組依原規則連動光學，見[impact.json](impact.json)。所有手選組合維持六輸出；其他改選案例僅在已核准來源與相應光學規則範圍內改變輸出。

## 中間失敗與歷史回放

首次固定矩陣比較因JSON省略undefined控制項欄位而失敗；比較改為既有JSON序列化語意，基準和產品不改。原始失敗保留在acceptance-initial.log.gz。

首次完整測試2076通過、1失敗：舊西門町測試要求預設目錄與自訂library的隨機輸出完全相同。本批只對預設目錄啟用配對，這項等價關係不再適用於現行生成。保留原測試正文，把此項接到可信591cc057的隔離歷史回放；現行預設／自訂行為則由新固定矩陣及快取隔離測試保護。沒有刪斷言或放寬預期。

補接此項後，第一次聚焦發現3項舊Phase4回放仍看見新測試接點，精確SHA拒絕。已讓既有C7回放的prepare鏈傳遞新層全部來源，13項聚焦與完整2077項再驗皆通過。gates/tests.log.gz及focused-history-initial.log.gz保留中間結果；最終結果以final檔為準。

本批外層精確還原四個既有檔：engine、第一批C7測試、第一批C7回放helper、西門町測試。beforeSource及SHA逐檔與可信Git核對，未知本批修改、正式checkout及symlink拒絕；僅在隔離副本使用。舊patch、舊基準與舊斷言正文不改。完整歷史鏈從還原後的原第一批C7來源執行；其後新增的西門町銜接也由最終聚焦及完整測試驗證。

## 保護及瀏覽器限制

原4,558份受追蹤檔中，除本批6個既有檔外，4,552份逐位元保持，包括2,892份歷史報告。其他20個工作目錄的140份未提交檔案、Git狀態與SHA保持；另1個登記但不存在的工作目錄未清理。正式catalog、registry、生成資料及舊收藏格式不變。見 [protection.json](protection.json)。

瀏覽器用隔離Chromium及本機正式build，未操作使用者Chrome收藏或付費模型。已目視檢查桌手機受影響流程與六工作區截圖；本批沒有新增版面溢位或內容遺失。手機既有按鈕省略文字保持。Saved Cards的空態、43張卡下載與舊衝突卡還原均有證據。

兩尺寸各有6次下拉選值在selectOption逾時後，以程式化change事件驗證：高階黑白成像、蜷川實花、Provia、風格隨機及兩欄全無。沒有完成原生popup滑鼠選取驗收；逐項fallback見browser/results.json。先前窗邊日光等限制紀錄仍保留，沒有補記通過。未生成圖片，不宣稱模型成像品質已驗證。

所有新增原始log／TAP採無損gzip封存；大型歷史JSON亦只壓縮，不修改內容。原始與封存SHA見 [raw-artifacts.json](raw-artifacts.json)。既有歷史報告均保持原bytes。

## 重跑及下一步

使用Node22與既有依賴，根目錄`REGISTRY_BASE_COMMIT=591cc0575ab87582540662236b4230fadfea16bf`。

- `node --test webapp/src/lib/engine/c7ColorPairing.test.js webapp/src/lib/engine/sceneSemanticA5Ximending.test.js`
- `node scripts/c7_color_pairing_acceptance.mjs`（不可再次使用--record）及`node scripts/c7_color_pairing_modes.mjs`
- `node scripts/c7_color_pairing_history.mjs /tmp/c7-color-history-new`
- webapp的test、test:prompt-quality、lint、build；根目錄200筆同seed strict、唯讀sync、Python、catalog strict、目錄工具、assets與check_prompt_bundle。
- 啟動5175本機preview，以PLAYWRIGHT_MODULE指定Playwright，執行c7_color_pairing_browser與check_production_browser，證據輸出到新的暫存目錄。

本次預覽服務已停止。未stage／commit／push，本批CI及部署未執行。其他模式與C7項目另批，艾爾莎隨機政策維持；PAGE2舊匯入、J12、P5b繼續暫緩。

## 使用者驗收與交付授權

Cooper已確認本批交付，授權限定提交並推送C7第二批，完成後確認CI及部署，再進行整合驗收與C7盤點。以上本機驗收紀錄，以及acceptance-summary、source-manifest、protection和final-check中的pending／未提交欄位，均為原驗收時的歷史快照，保留不改寫。

原生popup滑鼠操作及未生圖限制仍保持。季節、攝影風格內建光線／快門尚未由本批實作，不因本次交付自動結案；其他模式、PAGE2舊匯入、J12及P5b未併入。CI及部署須以本次提交的實際結果確認。
