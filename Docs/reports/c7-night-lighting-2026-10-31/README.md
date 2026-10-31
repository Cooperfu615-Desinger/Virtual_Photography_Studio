# C7 夜間家庭派對隨機環境光：本機驗收

日期：2026-10-31。基準及再次核對的遠端main為`0cf5d7650ffe8be606c9ddb165809c6b826d2669`。本機及使用者驗收均通過，已授權本批限定commit／push。以下保留提交前驗收紀錄；本批CI與部署結果於交付時另行核對。

## 結果與變更範圍

一般PAGE1單人選到夜間家庭派對、環境光未鎖定時，隨機排除六款明確日光／餘光，保留九款其餘非全無光線。手動選單16項、六款明確日光、全無、舊收藏原文與選值維持；其他場景與規格排除模式保持。所有輸出仍共用解析選值，不修改renderer文字。Catalog、ID、alias、semantic、生成資料、樣式、UI及艾爾莎隨機規則未改。

產品修改為engine的一處候選predicate及新增nightPartyLighting精確ID規則。新增C7測試、基準／補驗／瀏覽器／歷史工具、反轉metadata與helper；既有分類回放入口只有必要銜接。文件為current_project_state、[規格](../../specs/c7-night-party-lighting-v1.md)、[決策](../../decisions/2026-10-31-c7-night-lighting.md)及本報告。

## 驗收證據

| 項目 | 結果與證據 |
| --- | --- |
| 修改前問題 | regression-before.tap.gz：新回歸在未修改引擎時失敗，確實抽中日光 |
| 固定基準 | before.json.gz／baseline.json／acceptance.log.gz：886組；222組目標隨機輸入，99組改選，其餘787組保持，全部符合修改前獨立資料副本的預期 |
| 補充模式 | modes.json：90組，含23種人物光解析結果及10組手動艾爾莎，輸出／選值／結構／RNG與獨立參考一致 |
| 聚焦回歸 | focused-final.tap.gz：9/9；另focused.tap.gz包含A6原規則保護 |
| 前端全套 | tests-final.log.gz：2071/2071；最後僅補測試process匯入，聚焦重跑通過 |
| Prompt品質 | quality.log.gz：853/853 |
| Python／來源 | python.log.gz：59/59；sync-check.log.gz：1050歷史ID、8生成物；catalog.log.gz strict通過 |
| lint／建置 | lint-final.log.gz、build.log.gz、bundle.log.gz通過；既有大chunk提示保留 |
| 同seed診斷 | audit-before.log.gz與audit-after.log.gz逐位元一致；200筆prompt-quality-baseline、0 blocker、17筆既有診斷 |
| 資產 | assets.log.gz：207檔通過 |
| 歷史鏈 | history.log.gz與history/：C2場景644組＋90模式、套裝1440組、腰鍊／C3／C4／B3／PAGE2／Phase4／A2／A1／A5原鏈通過 |
| 桌手機功能 | browser/results.json：1440×1000與390×900；各六款日光、全無、10次隨機、舊卡還原、六輸出與公開原文保護通過 |
| 工作區 | workspaces/results.json：1440×1000與390×1000，六個現行工作區共12項；無console／page error、壞圖或意外document溢位 |

修改前基準包含控制項與候選順序、四主輸出與兩衍生輸出、selection、structured、摘要與RNG呼叫數。測試先用原引擎和只移除六筆來源的完整資料庫副本產生期望，沒有用修改後輸出重錄基準。收藏codec補入既有預設欄位與JSON省略undefined是原契約，沒有強制改成逐鍵相同或修改產品。

## 歷史反轉與中間失敗

第一次完整測試因舊回放要求engine全檔SHA而失敗43項；新增C7精確反轉銜接後，全套2071項通過。反轉只接受釘選的afterHash與兩段唯一差異，重建結果必須等於可信Git的beforeHash；正式checkout、符號連結、未知C7內容拒絕。既有測試正文、patch來源與歷史封存不變。

聚焦固定矩陣也發現舊poseBaseId=lying不等於仰躺表面模式，已明確排除，不重錄基準吸收差異。首次lint發現新增測試缺少Node process匯入，補上後lint及聚焦9項通過。tests.log.gz、lint.log.gz、gates.json保留首次結果；最後結果以tests-final.log.gz、lint-final.log.gz、focused-final.tap.gz及acceptance-summary.json為準。

歷史證據另存history/；log無損gzip，來源與封存SHA見history/artifact-index.json。沒有將歷史反轉套用到正式工作目錄。

## 保護與瀏覽器限制

除engine、必要回放入口及current_project_state三個既有檔案外，原4433份受追蹤檔逐位元保持，包含2781份歷史報告；其他20個工作目錄／140份未提交檔的狀態與SHA一致，另1個登記但不存在的工作目錄未清理。見protection.json。

瀏覽器使用隔離Chromium、本機正式build與模擬收藏，沒有操作使用者Chrome資料、付費模型或線上部署。已目視檢查本批光線設定及六工作區桌手機截圖；內容可讀，沒有本批新增裁切或溢位。六工作區工具沿用390×1000，受影響流程另以規格要求的390×900驗證。

兩尺寸的「室內窗邊日光」與「隨機」選值均在selectOption逾時後用程式化change fallback驗證下游；其他五日光及全無由selectOption完成。沒有驗證原生popup滑鼠選取，先前限制保持。未生成圖片，不宣稱影像品質等價。手動允許夜間場景搭日光是刻意保留的控制權，不代表全產品的時段衝突已消除。本次5175預覽服務已停止。

## 重跑與後續

使用Node22及既有node_modules，根目錄設`REGISTRY_BASE_COMMIT=0cf5d7650ffe8be606c9ddb165809c6b826d2669`。

- `node --test webapp/src/lib/engine/c7NightLighting.test.js webapp/src/lib/engine/c2RenderingClassification.test.js webapp/src/lib/engine/phase4History.test.js`
- `node scripts/c7_night_lighting_acceptance.mjs`（不可再次--record）；`node scripts/c7_night_lighting_modes.mjs`
- `node scripts/c7_night_lighting_history.mjs /tmp/c7-night-history-new`
- webapp：test、test:prompt-quality、lint、build；根目錄同seedstrict、唯讀sync、Python、catalog strict、assets與check_prompt_bundle。
- 啟動5175本機preview，PLAYWRIGHT_MODULE指定Playwright；執行c7_night_lighting_browser及check_production_browser，輸出至新的暫存證據目錄。

C7本批完成窄範圍夜間隨機相容；黑白／彩色、季節與攝影風格責任仍另批決策。其他C類、PAGE2舊匯入、J12、P5b未併入；艾爾莎隨機選取維持現況。

本批原始文字log／TAP採無損gzip封存，避免改寫工具原始空白及減少重複證據體積。來源與封存SHA見raw-artifacts.json；表中.gz可解壓取得完整原文。

## 使用者驗收與交付授權

Cooper已確認本批驗收通過，授權只提交並推送本批程式、文件、基準、回歸案例、歷史回放銜接與驗收證據。acceptance-summary.json與protection.json中的pending／未提交欄位為原本機驗收時的快照，保留原文；本段記錄後續授權，不改寫基準或證據。

環境光原生popup滑鼠操作及未生圖限制仍保持；其他C7項目另批，艾爾莎隨機選取維持現況，PAGE2舊匯入、J12與P5b繼續暫緩。CI及部署須以本次提交的實際結果確認。
