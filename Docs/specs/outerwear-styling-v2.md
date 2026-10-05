# 外套穿法 v2

日期：2026-10-05。使用者核准四種新穿法、單選架構、相容規則及六組有效英文來源原文保留；實作及文字／瀏覽器驗證完成；使用者已授權 commit/push，交付狀態以 Git 遠端核對為準。

## 來源與組裝

在既有四項外套穿法尾端附加以下四列，只供手動選用，不改舊 ID、順序、隨機池、storage schema 或 public output fields。單人及雙人 A/B 沿用原外套穿法欄位。

| 名稱 | 正式英文來源 | 空白分隔詞數 |
| --- | --- | ---: |
| 衣襬遮住部分下身 | `its hem draping naturally over the waistband and upper portion of the lower garment, partially concealing it` | 17 |
| 披在雙肩（不穿袖） | `draped over both shoulders, both arms outside the sleeves, with the empty sleeves hanging naturally` | 15 |
| 披在單肩（不穿袖） | `draped over one shoulder, both arms outside the sleeves, with the garment and empty sleeves hanging to that side` | 19 |
| 袖口捲至前臂 | `sleeves rolled up to mid-forearm, with visible folded cuffs` | 9 |

資料庫為 `knowledge_base/wardrobe_and_styling.md`；`item_metadata.json` 固定新列 ID、manual-only、kind、可捲袖款式與透明材質衣襬來源。`database.json` 由同步產生。新列 ID 為 `wardrobe:外套穿法-outerwear-styling:<名稱>:4` 至 `:7`，包含完整名稱及括號；雙人來源複製僅添加原有 `:a`／`:b`。

外套單品與已解析版型／配色 → 圖案 → 開合 → 穿法 → 內搭。所有輸出從同一有效來源組裝；可見且相容時，整段英文保留一次，不替 GPT、Z、AI 另造短版或補充語句。`its` 緊接所屬外套段落，不借用內搭上衣作指涉。

## 相容規則

| 新穿法 | 敞開、正常或全無開合 | 半扣／半拉鏈 | 完全閉合 |
| --- | --- | --- | --- |
| 衣襬遮住部分下身 | 可用 | 可用 | 可用 |
| 披在雙肩（不穿袖） | 可用 | 不適用 | 不適用 |
| 披在單肩（不穿袖） | 可用 | 不適用 | 不適用 |
| 袖口捲至前臂 | 可用 | 可用 | 可用 |

- 衣襬關係需要同一人物有效外套及獨立褲／裙，不要求一般內搭上衣。依有效版型與衣長排除 cropped／underbust-cropped，不強行拉長外套、縮短下身或補下身；連身／套裝／特殊穿搭接管沿用原規則。
- 薄紗輕薄披衣外套與蕾絲罩衫使用已標記的透視來源：`its hem overlapping the waistband and upper portion of the lower garment, which remains visible through the fabric`（18 詞）。先在共用來源解析，所有適用輸出及選項複製沿用同一句，不新增不同 renderer 的變體。
- 不承諾下身必須從衣襬下方露出；敞開長外套可從前襟開口露出。原下身衣長、配色、材質、腰線及完整 Body Type 來源不變。有效外套遮擋不另疊加通用低腰上衣衣長銜接句。
- 可捲袖首批七款：西裝外套、丹寧外套、連帽外套、連帽外套（戴帽）、針織開襟外套、長版襯衫、風衣。由 `outerwear.rollableSleeves` 標記，不依 renderer 推測。內搭袖子不變，不保證前臂皮膚露出。
- 兩種不穿袖披肩與「雙手拉開外套（雙肩滑落）」互斥。明確手部動作與明確開合優先；不相容匯入組合保留原 canonical 手部來源，新披肩穿法暫不生效。原完全閉合與拉開外套的閉合優先規則不變。披肩已明確指定、開合隨機時，只抽相容開合。
- 上身衣襬關係與外套衣襬關係各自接在所屬衣物後；這個新組合的兩段原文在去重時以各自完整來源保護，避免把不同衣物的相同片語刪掉，舊路徑去重不變。全閉合不透明外套依原規則省略內搭及其修飾，透明外套保留透視內搭。
- UI 逐項停用不相容穿法，暫顯全無及保留提示，不清除來源 lock；切回有效條件即恢復。全閉合時可手動選有效衣襬關係／捲袖，既有露肩仍不生效。生成摘要與工作台摘要使用有效規則。

## 景別與還原

- 新描述作為原子來源，完整保留或整段省略，不逐 renderer 改寫。
- 衣襬關係與捲袖在具 waist 可見區域的中景、牛仔中景、全身及完整構圖保留；胸上／臉部近景省略，避免回補畫面外部位。披肩保留可見外套穿法。
- 兩組胸上及全身角色照從同一解析來源重新投影；全身角色照保留完整有效穿法及原 `9:16`，兩組胸上維持原 `4:5`。雙人依各自外套與下身判斷，維持既有三組主輸出範圍。
- Saved Cards 保留選項，即使外套為全無或當前穿法不相容；還原重新生成依有效條件決定是否輸出。可見原文／透明變體可回填對應外套穿法；純文字不推定被省略的穿法。
- 文字回填在辨識外套穿法前，先排除完整的既有上衣衣襬來源；上衣原文包含較短的外套衣襬片語，不能據此推定也選了外套穿法。兩層都明確輸出時，獨立的外套來源仍可辨識，上衣來源與其還原規則不變。
- Public prompt contract `1.41.0`。既有歷史輸出快照不重建；另凍結 204 組舊外套／穿法／景別的 selection 與六輸出，確保本次隔離。

## 驗證範圍

`outerwearStyling.test.js` 及四個既有外套／衣襬測試涵蓋來源保留、透明、版型、袖型、閉合、手部、胸上／全身、雙人、隨機池、Saved Cards 與文字回填。代表案例四組加入 Prompt Quality gate。依 AGENTS 執行完整前端、同步／Python、同 seed 200／`prompt-quality-baseline` 嚴格稽核及桌面／手機五工作區 smoke。

2026-10-05 最終驗證結果：包含收藏相容性的專項 73/73、完整前端 1293/1293、Prompt Quality 542/542、lint、build、資料同步檢查、Python 2/2、206 個公開資產及 diff-check 通過。204 組既有外套快照完全相同；前後同 seed 嚴格稽核逐字相同，blocking 0，既有服裝／場景診斷 25 項與近似重複 3 項維持不變。既有 Vite 大型 chunk 提示仍在。

瀏覽器 1440×1000／390×900：四種手動穿法、單選、六組原文／裁切保留、透明變體複製、完全閉合、短版停用與切回恢復、披肩開合及手部互斥、雙人 A/B 各自披肩通過；五工作區載入、版面及圖片檢查無新增 console warning/error、破圖或頁面橫向溢出。Saved Cards 9 張保留，僅測試來源篩選的空／有資料狀態；Saved Card 序列化／還原與文字匯入由自動測試驗證。工作台原設定、六組預覽及剪貼簿已還原，viewport 重設、驗證分頁及本次測試伺服器已關閉。主要截圖 `/tmp/vps-outerwear-{desktop,mobile}.jpg`，紀錄 `/tmp/vps-outerwear-browser-checks.json`。

回填歧義補強後，在獨立的 `127.0.0.1:5176` 驗收來源實際套用「只有上衣衣襬」與「上衣／外套各自衣襬」兩組文字，前者維持正常外套穿法，後者分別保留兩段完整來源。在原本 0 張卡片的該來源新增 1 張本機測試卡，修改穿法後從 Saved Cards 套用還原；桌面與手機都恢復新穿法及各層有效來源。還原沿用既有重新生成機制，未指定欄位仍可能隨機變化，因此此項驗收核對選項與來源，不要求未指定場景／姿勢逐字相同。測試卡保留在獨立驗收來源，正常 `5175` 的 9 張收藏未變。驗收分頁與伺服器已關閉；console 無 warning/error。

實際外部圖像模型的披肩、遮擋與捲袖穩定度需由使用者實測確認；文字及瀏覽器驗證不等同圖像驗收。
