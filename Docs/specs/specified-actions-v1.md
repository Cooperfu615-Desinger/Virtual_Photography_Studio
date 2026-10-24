# 指定動作 v1

Last updated: 2026-10-16

Status: 2026-10-16 使用者已授權合併 main 與 Pages 發布；整合遵循 main 已移除 MJ 胸上的六輸出契約。以下為原分支驗收狀態：本機實作及桌面／手機驗證完成，使用者已驗收並授權 commit／push；交付分支 `codex/specified-actions-v1`，遠端 SHA 以 Git 核對為準，未合併 main 或部署。實際圖像模型的姿勢精準度另行驗收。

## 目的與範圍

PAGE1 單人姿勢增加手動選取的「指定動作」。每個動作是一份完整的身體、雙手、承重與地面接觸描述，接管肢體變化、手部動作、道具動作、接觸／支撐四組來源。表情與頭部方向保持獨立，不寫入動作資料。第一批共三個坐姿、三個跪姿及兩個躺姿，全數以地面為接觸面，不帶入家具、道具、室內／室外限定或相機方向。

沒有指定動作時沿用現有自由組合。選取指定動作後，四組控制停用但保留原始選值；有效輸出只讀指定動作，不將這些暫存值再次加入姿勢。躺姿的側躺／仰躺方向由動作本身接管，原本主要躺姿選值保留。所有資料保存與有效投影必須區分，避免既有四足綁定、道具互斥或自拍方位規則作用於停用來源。

四組主輸出（GPT、Z-Image、主 Midjourney、Nano Banana 2.1）與 GPT 胸上輸出共用同一次解析的動作來源，再依各自既有契約組裝。全身角色參考照保持單人、自然站姿、完整穿搭與 `9:16` 用途，不繼承指定坐／跪／躺動作。其他工作區及歷史公開欄位映射不改。

## 已核准目錄

動作資料由 `webapp/src/lib/engine/specifiedActions.js` 單一維護，不以知識庫 Markdown 再建立另一份 runtime 資料。中文全文是動作幾何定稿，英文是同一來源的翻譯與上身投影。ID 與左右側是穩定契約，不以畫面左右或相機方向解釋。

| 編號 | 名稱／穩定 ID | 基底／主要躺姿 | 參考圖編號 |
| --- | --- | --- | --- |
| 1 | 折腿低坐・雙掌後撐 `specified-sitting-side-fold-back-support` | sitting／none | 25 |
| 2 | 單腿屈起・單掌後撐 `specified-sitting-raised-right-knee` | sitting／none | 10 |
| 3 | 低坐抱膝 `specified-sitting-hug-knees` | sitting／none | 20 |
| 4 | 分腿跪坐・雙掌前置 `specified-kneeling-wide-hands-front` | kneeling／none | 23 |
| 5 | 四足跪姿・雙掌撐地 `specified-kneeling-all-fours-palms` | kneeling／none | 8 |
| 6 | 四足跪姿・雙前臂撐地 `specified-kneeling-all-fours-forearms` | kneeling／none | 19 |
| 7 | 側躺・單前臂撐起上身 `specified-lying-left-side-forearm` | lying／lying-side | 6 |
| 8 | 仰躺屈腿交疊・雙臂沿身側 `specified-lying-supine-raised-crossed-legs` | lying／lying-supine | 24 |

參考圖：[25 組姿勢](../../webapp/public/reference/specified-actions/pose-reference-sheet.jpeg)，原始檔案為 `Docs/參考/HTdl7jgasAA2pZp.jpeg`。這些編號是內容來源的對照；被遮擋的臀部落點、左右側及手部細節依使用者定稿，不宣稱每一個細節均可從該視角直接辨認，也不將繪圖視角固定到攝影設定。尤其 25 與 23 只作姿勢示意，使用者定稿的同側折腿／分腿跪坐幾何及臀部落地關係才是正式來源。

### 1. 折腿低坐・雙掌後撐

臀部直接坐在地面，雙膝彎曲，兩條小腿折向人物左側，雙腳靠近左臀，折疊腿部與腳側貼地。上身略向後傾，雙掌分別放在左右臀部偏後的地面，手指分開，手肘微彎。臀部與折疊雙腿承托下半身，雙掌分攤上身重量。

### 2. 單腿屈起・單掌後撐

臀部坐在地面，右膝高起，右腳掌平放在身前地面。左膝向人物左側放低，左小腿折向身前，左腳靠近右腿內側，左腿外側貼地。上身略向後傾，右手放在右膝上方的大腿，左掌放在左臀偏後的地面。臀部、左腿、右腳與左掌共同形成支撐。

### 3. 低坐抱膝

臀部坐在地面，雙腿在身前彎曲，雙膝靠近並收向胸前，雙腳掌平放地面。上身從髖部略向前傾、靠近雙腿；雙臂由兩側環抱小腿，前臂位於小腿前方，雙手各握住另一側前臂。臀部與雙腳承重，雙臂收攏雙腿。

### 4. 分腿跪坐・雙掌前置

雙膝向外分開著地，小腿向後折在臀部兩側，腳背貼地，臀部落在兩腿之間的地面。上身略向前傾，雙臂向前下方伸出，雙掌並列放在兩膝之間偏前方的地面，手肘微彎。臀部與折疊雙腿承托身體，雙掌協助穩定。

### 5. 四足跪姿・雙掌撐地

雙膝分開著地、位於髖部下方，小腿向後延伸，腳背貼地。雙掌分開放在肩膀下方的地面，手指張開，手臂伸展，手肘保留自然彈性。臀部在膝蓋上方抬起，肩胸保持較高，軀幹大致平行地面，腹部離地。雙膝與雙掌承重，小腿前側與腳背接地。

### 6. 四足跪姿・雙前臂撐地

雙膝分開著地、位於髖部下方，小腿向後延伸，腳背貼地。雙肘位於肩膀下方，雙前臂向前平貼地面，雙手分開、掌心向下。臀部保持抬高，肩胸降低，軀幹從髖部向前下方傾斜，胸口低於臀部，腹部離地。雙膝、雙肘與前臂承重。

### 7. 側躺・單前臂撐起上身

身體左側躺臥，左髖與左腿外側貼地，雙腿沿身體長軸微彎，右腿疊放在左腿上。左肘位於左肩下方，左前臂向身前平放地面，左掌接地，撐起左側腰胸使其離地，軀幹斜向上抬起。右手放在右大腿外側；髖部與雙腿維持側躺，左髖腿與左前臂共同支撐身體。

### 8. 仰躺屈腿交疊・雙臂沿身側

背部與骨盆貼住地面，雙腿從髖部抬起，大腿收近腹部，雙膝彎曲。右大腿斜跨左大腿，在大腿至膝蓋上方交疊；小腿隨彎曲自然延伸，雙腳保持離地。雙臂沿身側略向外展，手肘微彎，雙掌接地。背部與骨盆承重，雙臂與手掌協助穩定。

## 選取介面

PAGE1 的「指定動作」使用按圖選取介面。先明確選定坐姿、跪姿或躺姿基底，再開啟對應基底的動作清單；每個項目提供參考圖、動作名稱與完整中文描述，並標示目前選取項目。「全無」回到原本的姿勢設定。站姿、蹲姿或未明確選定的基底顯示原因，不開啟第一批動作清單。

參考縮圖取自上述 25 組姿勢圖，僅作選取時的示意；人物左右側、手部與地面接觸關係仍以已核准描述為準。圖中表情、頭部與視角不會直接套入設定。

指定動作生效時，肢體變化、手部動作、道具動作、接觸／支撐四組欄位停用，標題標示「指定動作接管」。肢體與手部顯示「由指定動作決定」，道具顯示「不使用道具」，支撐顯示「地面」；主要躺姿顯示動作的側躺／仰躺方向並停用。這些顯示值不覆寫原始選值。表情與頭部方向仍可獨立選擇，區塊提供「取消指定動作」恢復自由組合。

## 接管與保存契約

- 新欄位 `specifiedActionId` 預設 `none`。目錄提供全無與八個手動動作，不提供 random 或 any。（2026-10-19 起由 [神情姿態 v2](expression-pose-v2.md) §3.1 取代：選單增加「隨機」`random` 與「任意」`any`。）只有單人、明確且相符的坐／跪／躺基底才啟用；基底未指定、隨機或不符時不解析指定動作。
- 使用者切換姿勢基底或切換到雙人模式時，清除指定動作。重新選定坐／跪／躺基底後須再手動選取動作，不沿用上一個基底的動作。
- 有效的固定場景人物位置與現存姿勢卡優先接管姿勢，其啟用時指定動作暫停；不以無法解析的舊卡 ID 接管姿勢。暫停時保留動作 ID 與原始自由組合選值，介面顯示接管原因；移除接管者後，基底仍相符的指定動作恢復。後續取消指定動作不能重新啟用使用者已明確清除的固定場景或人物位置。
- `poseArrangementId`、`poseHandId`、`posePropId`、`poseAnchorId` 的原值留在 raw locks／storage／結構化保存資料中，有效生成輸入投影成 none。`poseHeadId` 與 `expressionId` 不被指定動作改寫。
- 主要躺姿用動作的 `orientationId` 作有效值；坐／跪動作為 none。側躺與仰躺不依原 latent 方向判斷場景政策。
- 取消指定動作恢復原本四組選值與主要躺姿方向；自由組合重新依既有道具互斥、自拍方位與支撐規則產生有效輸出。停用期間選值保存，不表示取消後能略過自由組合的既有規則。
- 第 8 動作的地面幾何由此目錄提供，標記 `meta.supineGroundOnly`。沿用仰躺進出場景暫停／還原的範圍，地面來源不引用既有地板 anchor 的室內限定、毯子或飲料環境句，不擴及其他仰躺表面。`specifiedActionSceneRestore` 保存進入前的場景欄位，環境光與人物受光維持原設定；取消、切換第 7 或被較高優先權姿勢接管時還原場景，明確變更的場景值優先。第 7 維持一般場景，不因原始主要躺姿是仰躺而暫停場景。
- 不批次改寫舊收藏 Prompt。缺少新欄位的舊資料維持自由組合；新結構化保存／還原包含指定動作、latent 四組選值及第 8 的場景還原 snapshot，因此重新載入或還原 Saved Card 後再取消，仍能恢復原場景。snapshot 僅接受已定義的場景欄位與相符值型別。純文字回填只恢復可辨識的來源，不捏造文字中未保存的原始選值與場景 snapshot。
- 預覽重抽保留指定動作，表情、頭部及其他未鎖定來源遵循既有重抽範圍。姿勢區或全域「全部隨機」將 `specifiedActionId` 清為 none，不會隨機選到指定動作（2026-10-19 起改為設成「隨機」並從動作庫抽，見神情姿態 v2 P2）；`posePropId` 依既有批次隨機契約保留目前值。其他分區的隨機不清除指定動作。姿勢區或全域清空則清除指定動作，原有姿勢／道具欄位依各自清空範圍處理；全域清空同時清除場景 snapshot，不從 snapshot 回復已清掉的場景。

## 共用來源與裁切

每個 concrete option 提供 `en` 完整來源、`upperBodyEn` 上身來源、`descriptionZh` 中文幾何、`baseId`、`orientationId` 及 `referenceNumber`。所有英文只描述可見身體與接觸，不包含表情、頭部方向、家具、鏡頭或內部控制語。

`unconstrained`、`fixedComposition`、`fullBody` 與 `cowboyKnee` 的動作投影保留完整來源；`chestUp`、`mediumWaist` 採同一上身來源，省略腿、腳、臀底及具體地面接觸幾何，仍保留前後傾、胸肩高度、手臂方向和側躺／仰躺姿態。第 8 依仰躺 surface-led 契約，在胸上與中景額外保留最短的地面表面身份（`She lies on her back on the ground`）；不回補背部／骨盆貼地、雙掌接地、交疊雙腿或承重細節。

`headShoulders` 與 `faceDetail` 沿用省略動作幾何的範圍；第 8 同樣只保留仰躺於地面的姿態與表面身份，不回補交疊雙腿、雙手或承重細節。裁切不重新抽選、轉換或補造另一個動作。全身角色參考照使用其既有獨立用途，不直接套用動作的 fullBody metadata。

`getSpecifiedAction(locks, { ignoreOwners = false })` 解析具體且相符的單人動作；`ignoreOwners` 僅供已知擁有者處理流程略過 owner 檢查，不能略過人物數量或基底。`getSpecifiedActionEffectiveLocks()` 回傳有效副本，不正規化或修改傳入的原始 locks；沒有有效動作時傳回原物件。共用生成器負責將一份動作來源組裝到現有 canonical pose 與各輸出。

## 驗證範圍

Focused regression 先建立，再實作來源及 helper。覆蓋八個 stable IDs／參考編號／基底方向、三坐三跪兩躺、單人與明確基底限制、姿勢擁有者暫停、四組 latent 值保存、頭部／表情／相機獨立、上身投影與第 8 地面限定。

整合後還需驗證四主輸出與 GPT 胸上共用動作、全身角色用途、進出與基底切換、pose card／固定場景／雙人模式、批次隨機／清空／重抽、收藏／還原／匯入／回填及重新載入；完成前端全套、Prompt Quality、同 seed strict audit、桌面與手機的受影響流程及工作區瀏覽器檢查。遵循 [跪姿目錄 v2](kneeling-catalog-v2.md)、[隨機與清空契約](page1-random-none-control-contract.md)、[胸上同一拍攝狀態](chest-up-same-state-v1.md) 與 [視覺驗證程序](frontend-visual-validation.md)。程式通過不代表圖像模型已通過姿勢驗收。

## 本機完成紀錄 (2026-10-13)

- 新增動作專項 30/30、完整前端 1576/1576、Prompt Quality 713/713，Node 22.22.3。完整測試使用 TAP reporter，以符合既有測試 runner 的 stdout 契約，不改 production 或測試斷言。
- lint／production build、知識庫 sync check、Python 2/2、公開資產 207 檔／3,201,415 bytes 與 diff-check 通過。未改知識庫 authored Markdown，因此不重新生成資料庫。既有 Vite 大型 chunk 提示維持不變。
- 固定種子比對 104 組既有代表案例，四主輸出與衍生輸出全文相同。`200 / prompt-quality-baseline` strict audit 前後報告逐字相同，0 blocking signals、22 diagnostic-only signals；不改寫既有服裝診斷。
- Chromium 隔離 context，桌面 1440×1000、手機 390×900。八動作各自生成四主輸出且接管欄位停用；表情／頭部保持可選；取消恢復手部／道具，仰躺重新載入與 Saved Card 還原後取消恢復場景。另驗證未支援基底空狀態、重抽保留、批次隨機退出，以及 Prompt 工作台、角色建模、動作姿勢、場景建模、觀察式抓拍及 Saved Cards 六現用工作區。
- 三類手機圖卡均確認圖片 104×104；390×640 可捲動並操作最後一項，639／641 斷點圖像保持正方形且無 document 溢位。Tab／Shift+Tab 焦點循環、Enter 選取、Escape 返回、指定動作英文複製逐字比對，以及固定場景接管→解除→指定動作恢復→取消均通過。38 項瀏覽器檢查無 console error／page error、破圖或頁面橫向溢位。手機 grid stretch 的圖片比例問題已原位修正。
- 圖片使用者參考原檔保持不變；部署用副本在 `webapp/public/reference/specified-actions/pose-reference-sheet.jpeg`，按格座標顯示八個候選，不固定拍攝視角。比對來源與副本 bytes 相同。
- 測試及稽核證據：`/tmp/vps-specified-new-final.log`、`/tmp/vps-specified-full-pass.log`、`/tmp/vps-specified-quality-pass.log`、`/tmp/vps-specified-{before,after}-audit.log`；瀏覽器 `/tmp/vps-specified-browser/results.json`、`extra-results.json`，截圖 `desktop-picker.png`、`desktop-supine.png`、`mobile-picker-{sitting,kneeling,lying}.png`、`mobile-selected.png`、`picker-breakpoint-{639,641}.png` 及各工作區桌面／手機截圖。
- 使用者於 2026-10-13 驗收本機操作並授權 commit／push。本批提交推送至 `codex/specified-actions-v1`，遠端 SHA 以 Git 核對為準；`main` 推送會自動發布 Pages，因此本批不合併 main、不部署。未呼叫外部圖像模型；使用者原有文件變更與未追蹤資料保留。此紀錄驗收程式、選值／輸出契約及介面操作，實際生成圖片仍需模型驗收。
