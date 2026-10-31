# C7 夜間家庭派對：隨機環境光相容 v1

日期：2026-10-31。基準main `0cf5d7650ffe8be606c9ddb165809c6b826d2669`。本批是C7第一批；使用者已驗收通過並授權限定commit／push，CI與部署於交付時核對。

## 目的與範圍

使用者同意依分析建議開始第一批。一般PAGE1單人採用預設目錄、解析為「室內：夜間家庭派對」，且環境光未鎖定（空值或random）時，隨機候選排除下表六款明確日光／黃昏餘光。場景無論手動選取或隨機解析到此筆，規則相同；不靠中文關鍵字推測其他場景。

場景ID：`locations:生活感室內-indoor-lifestyle:室內-夜間家庭派對:2`。英文以`nighttime American house-party home interior`明確限定夜間；其現有indoor／residential語意只負責室內場所相容，尚未處理這項時段衝突。

| 環境光名稱 | 永久ID尾段（共同前綴camera:環境光條件-ambient-light-conditions:） | 排除依據 |
| --- | --- | --- |
| 室內窗邊日光 | 室內窗邊日光:19 | window-daylight、daytime exterior sky |
| 室內清晨冷白日光 | 室內清晨冷白日光:20 | early-morning daylight |
| 室內午後柔亮日光 | 室內午後柔亮日光:21 | late-afternoon daylight |
| 室內陰影日光 | 室內陰影日光:22 | shaded daylight、daylight falling deeper |
| 室內陰雨昏暗天光 | 室內陰雨昏暗天光:23 | rainy-day daylight |
| 室內黃昏微暖餘光 | 室內黃昏微暖餘光:24 | dusk afterglow、residual daylight |

不得用natural_light／window_light一概排除：深夜冷暗微光和外光滲入微暗空間仍保留。冷白人造光、高亮室內日常並未宣告白天，仍保留；主體光「冷白日光色溫」是色溫，並非時段，本批不改主體光規則。

## 解析責任與相容

- 規則只追加於[engine.js](../../webapp/src/lib/engine.js)生成時ambient候選predicate，由[精確ID規則](../../webapp/src/lib/engine/nightPartyLighting.js)負責六筆辨識。先遵守既有場所限制，再追加本批限制；候選相對順序不變，不增加隨機抽樣。
- 不改`getSceneDependentOptions`及UI transition；選單仍為16項（全無加15款），一般隨機非全無池為9款。使用者手動選日光或全無均維持原值；明確未知ID的既有fallback也保持，沒有藉機遷移。
- 排除雙人、角色卡、特殊主體、固定構圖、Observation Capture、匯入場景、躺姿／仰躺表面模式及自訂library。這些有獨立場景／接管規則，另批決策，不因同名來源受影響。
- 同一組解析選值仍共用於全部輸出。環境光改選後，依既有renderer影響適用輸出；本批不新增文字、不改六輸出組裝與投影。舊收藏公開原文及快照保持，重新生成才使用目前的隨機政策；明確還原的光線仍優先。
- Catalog JSON、生成Markdown／database、ID、alias、semantic、排序、styleFitsLocation和艾爾莎隨機選取均不改。黑白／彩色、季節、攝影風格與其他C類未併入；PAGE2舊匯入、J12、P5b繼續暫緩。

## 固定基準與驗收

[基準工具](../../scripts/c7_night_lighting_acceptance.mjs)在產品修改前封存886組：155筆場景各兩seed、11景別各16手動選項、11景別各兩種隨機鎖態各10seed、56組排除配置各3seed、自訂library10組及兩種舊鎖值。原始來源、控制項與有序候選、六輸出、structured、selection、摘要與RNG呼叫數均封存。

222組為目標場景的隨機輸入案例。預期結果不是用修改後引擎重錄：修改前先在獨立完整資料庫副本移除精確六筆來源，產生新候選池的預期結果。固定seed比較99組有變化，其他787組保持。基準檔只允許首次建立；既有A～E／Phase4／C類基準不覆寫。

聚焦回歸要求：200個seed無六款日光並覆蓋全部9款保留光線；16項UI及手動／全無、場景切換、主體光色溫保持；自訂runtime不污染預設快取；886組與獨立預期完全相同。收藏與Markdown公開原文及既有選值不變，codec原本補入預設欄位的行為不改。

完整門檻：前端test、prompt-quality、lint、build與正式bundle初始化、同seed200筆strict稽核、唯讀sync／schema／歷史ID、必要歷史回放；桌面1440×1000、手機390×900操作本批選值、隨機、全無、舊卡套用，再檢查六個現行工作區。原生下拉與未生圖限制如實記錄，不以自動化選值聲稱模型影像品質等價。

完整結果見[驗收報告](../reports/c7-night-lighting-2026-10-31/README.md)，授權與取捨見[決策](../decisions/2026-10-31-c7-night-lighting.md)。本批驗收不代表C7整體結案。

## 本機驗收補充

最終前端2071／品質853／聚焦9／Python59通過。另以[90組補驗](../../scripts/c7_night_lighting_modes.mjs)覆蓋人物光同時隨機及手動艾爾莎，預期由保留既有行為的自訂資料庫路徑產生。歷史回放入口為[本批歷史工具](../../scripts/c7_night_lighting_history.mjs)，精確反轉只在隔離副本執行；共用分類回放入口增加必要銜接，既有斷言與封存不修改。

瀏覽器功能與六工作區檢查通過；環境光「室內窗邊日光」與「隨機」兩尺寸均使用程式化change fallback，原生popup滑鼠操作尚未驗證。未生圖，不宣稱模型影像品質等價。完整結果與保護數量見本批報告。上述為提交前本機驗收紀錄；Cooper已驗收通過並授權限定交付，瀏覽器與未生圖限制保持。
