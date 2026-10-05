# B 穿搭設定新增與維護規格

Last updated: 2026-10-05

這份文件定義 PAGE1 `B. 穿搭設定` 的新增、修改、合併與測試規則。後續新增上身、下身、套裝、連身、鞋襪、外套、配件、顏色或圖案時，請先依照本規格檢查責任邊界、prompt 寫法、組合順序與舊資料相容性。

單人模式的 Gpt / Grok/Z-Image / AI 輸出規則請同時參考 `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/page1-single-prompt-compression-guide.md`。目前 Gpt 版採完整保留型 Prompt，一般上下身、鞋襪與外層、套裝、連身、特殊穿搭與配件中的有效英文描述應完整保留；Grok/Z-Image 與 AI 才依各自模型需求壓縮。MJ 新版規範則要求保留所有已解析的服裝角色與配件，以短片語移除重複語意，不得因長度刪除配件。新增資料時仍需確認正常穿著狀態說明、泛用 styling 尾句、內部控制語言與同義詞堆疊是否真的有助於生成穩定或造型鎖定。

## Optional silence follow-up (2026-09-26)

外套開合、眼鏡配戴方式以 append-only 方式增加「全無」，同時供單人與雙人 A/B 使用。保留外套／眼鏡款式與配色，只省略獨立的開合／配戴位置，不補回正常開合或戴在臉上；新增 none 不參與隨機抽樣。舊款式 ID 遷移不得覆寫使用者明確選取的 none。完整造型與款式自身內建的穿法仍屬於有效來源，不因獨立 none 被刪除。


## 1. 核心原則

B 區只負責「人物穿什麼、怎麼穿、服裝表面與配件細節」。它不應該偷渡人物長相、體態、神情、姿勢、場景、環境光、鏡頭焦段或攝影風格。

整體穿搭主線維持：

- 日系或韓系女性寫真人像可用的真實服裝語言。
- 服裝結構、材質、版型、層次與配件要能被畫面辨識。
- 顏色盡量由配色欄位控制，不寫死在一般單品 prompt 裡。
- 選項要能彼此組合，除非它本身就是 `特殊穿搭` 或完整 `套裝/連身`。

Prompt 應使用短而準的英文片語。中文描述用來幫助維護者理解服裝方向，英文 prompt 用來控制生成結果。

## 2. 資料來源

| 控制項 | 主要來源 | 備註 |
| --- | --- | --- |
| 特殊穿搭、套裝、連身、上身、下身、鞋襪、外套、配件 | `knowledge_base/wardrobe_and_styling.md` | 編輯後需同步到 `webapp/src/data/database.json`。 |
| 上身/下身/外套/鞋襪/配件組合邏輯 | `webapp/src/lib/engine.js` | 控制 prompt 組裝順序、角色 A/B 分流、特殊穿搭優先權與 legacy mapping。 |
| 胸下短版上身版型與服裝變體 | `webapp/src/lib/engine.js` 的 `TOP_FIT_OPTIONS`、`knowledge_base/item_metadata.json` 的 `topUnderbust` | 兩項新版型只手動選用；有效衣長／穿法先共用解析，未選用維持原單品來源。 |
| B 區 UI 顯示、分隔線與控制項摘要 | `webapp/src/components/Page1Workspace.jsx`、`webapp/src/index.css` | 新增控制鍵時需同步 UI 分組與摘要。 |
| 相容舊選項 | `webapp/src/lib/engine.js` | 合併、改名、移除時需加 legacy mapping 或 migration。 |
| 測試 | `webapp/src/lib/*Wardrobe*.test.js`、`engineSpecialOutfitCleanup.test.js`、`engineAccessoryEyewearCleanup.test.js` | 依修改範圍更新。 |

Markdown 資料同步流程：

```bash
python3 scripts/sync_to_json.py
```

同步後需確認 `webapp/src/data/database.json` 只有預期分類改動。

## 3. Prompt 寫法總則

一般單品英文 prompt 建議格式：

```text
garment type, 1-3 concrete structure/material traits, silhouette or styling cue
```

完整造型英文 prompt 建議格式：

```text
complete outfit: style direction. key garment 1, key garment 2, footwear or accessory anchors, coordinated styling cue.
```

描述應該：

- 使用正向、可視覺化的服裝語言，例如 `structured`, `ribbed knit`, `wide-leg`, `sheer mesh`, `zipper hardware`。
- 明確說出單品類型、材質、版型或穿法。
- 把顏色交給配色欄位，除非該選項是完整特殊穿搭或品牌款式本身必須有固定色。
- 讓每個欄位只負責自己的層級。
- 優先使用真實服裝、街拍、時裝、寫真語氣。

描述應避免：

- 負面堆疊：`not...`、`avoid...`、`without...`。
- 場景詞：street、room、studio、beach、hotel、school、office，除非是特殊穿搭的風格語氣而非指定場景。
- 光線詞：sunset、neon light、softbox、blue sky。
- 攝影詞：35mm、film grain、cinematic、close-up。
- 人物詞：beautiful face、slim body、seductive gaze、young idol。
- 色碼或技術色值，例如 `#ffffff`、`rgb(...)`。

長度建議：

- 一般上身、下身、外套、鞋襪：6-20 English words。
- 複雜材質或特殊剪裁：可到 24 English words。
- 配件：4-16 English words。
- 套裝/連身：12-32 English words。
- 特殊穿搭：必須以 `complete outfit:` 開頭，目標 35-85 English words，避免爆量堆疊。

## 4. 穿搭優先權

B 區不是平面清單，而是有層級的服裝組裝系統。

主要優先權：

- `特殊角色` 來自 A 區。特殊角色啟用時，通常會 suppress normal wardrobe output。
- `特殊穿搭` 是完整造型包，選中時優先輸出完整穿搭。
- `套裝/連身` 是明確風格方向或 one-piece 主體，可再搭配外套、鞋襪與配件；但套裝本身已包含明確外層時，隨機流程不得再加第二件外套。
- 一般上下身由上身、下身、版型、穿法、配色、圖案共同組裝。
- 外套是外層，應在 outfit 或 top 之前成為清楚的 outer layer。
- 鞋襪與配件是補充層，不應覆蓋主要服裝。

維護規則：

- 新選項要先判斷它是完整造型、套裝、連身、一般單品、修飾欄位還是配件。
- 不要把一套完整造型拆進一般上身或下身。
- 不要把單品 prompt 寫成完整穿搭。
- 若新增會影響優先權的欄位，必須更新 `buildWardrobe`、`buildWardrobeSlots`、selection output 與測試。

## 5. 特殊穿搭

責任：完整造型包。它可以包含上衣、下身、外套、鞋、包、帽子、眼鏡、首飾與整體 styling，因為它本身就是一套完整參考造型。

目前規則：

- 保留目前核准的非空特殊穿搭清單；數量以 `engineSpecialOutfitCleanup.test.js` 的 expectation 為準。
- 每個 prompt 必須以 `complete outfit:` 開頭。
- 選中時應優先輸出完整造型，而不是被一般上身、下身或鞋款拆散。
- 可以帶固定顏色，因為特殊穿搭是完整造型包。
- 單人 Gpt 輸出會把特殊穿搭整理成 `Hair and body details`、`Full outfit`、`Headwear, eyewear, and bag` 三組；資料庫 prompt 仍維持完整自然句，不需要手動加入這些輸出子標籤。

新增規則：

- 新增前先確認是否真的需要完整造型包，而不是套裝或一般上下身可組合完成。
- 英文 prompt 以 35-85 words 為目標。
- 至少包含主風格、核心上身/下身或連身、鞋款或配件 anchor、整體 styling。
- 不指定場景、光線、鏡頭、人物表情或姿勢。
- 避免品牌名稱過多，除非該款式是視覺辨識核心。
- 避免使用負面詞穩定造型。

範例語氣：

```text
complete outfit: relaxed vintage band streetwear. faded oversized graphic T-shirt, wide denim knee-length shorts, bandana detail, mid-calf socks, leather slip-on shoes, small casual accessories, coordinated thrifted downtown styling.
```

## 6. 套裝與連身

這一層分成兩個責任：

- `套裝 (Outfit Presets)`: 有明確風格方向的服裝組合，可以是制服、工作服、內衣套裝、和服、女僕、兔女郎、蘿莉塔等。
- `連身 (Dresses)`: 不屬於上下身拆分的 one-piece 服裝，以短版或長版輪廓為主。

### 6.1 套裝

責任：定義一個可被配色控制的完整服裝方向，但不一定包含鞋襪、外套或配件。

隨機外套規則：

- 套裝若已包含 blazer、jacket、coat、cardigan、robe 或其他明確外層，必須在 `knowledge_base/outfit_preset_metadata.json` 為該名稱設為 `"embeddedOuterwear": true`。
- 這個 metadata 只阻止未鎖定狀態的額外外套抽選；使用者明確選擇外套或任何外套 modifier 時，保留作為有意識的外層覆寫。
- 不得在 renderer 或 engine 以英文關鍵字推測套裝是否含外套；新增或修改套裝時應依資料與參考圖做明確標記。

命名規則：

- UI label 使用 `套裝：名稱`。
- 名稱要指向明確服裝類型，例如 `套裝：西裝長褲`、`套裝：護士`、`套裝：兔女郎`。
- 不使用抽象生活風格名稱，例如極簡高級、文青生活、旅行度假。

Prompt 規則：

- 不寫死主色，也不要把 `controlled by the outfit color selection` 這類內部控制語寫進公開 prompt。資料只描述服裝本體；runtime 會依已選色票輸出實際色彩，未選色時不補控制語。
- 若套裝的預設表面圖樣會被任何有效主色完整取代，可在 metadata 使用 `primaryColorBehavior: "replace_caution_tape_surface"`。目前此行為只服務「亮面膠帶束帶套裝」：主色為 `全無` 時保留資料中的黃黑警戒線，指定或隨機解析出主色時改為該主色的純色亮面膠帶，不得同時殘留 `CAUTION` 字樣或黑色色塊。
- 可以描述輪廓、材質、職業制服元素、帽子或核心識別物。
- 工作套裝可以包含對應帽子、領口、裙褲形式或制服結構。
- 不自帶人物身份、場景、工作場所或職業行為。

### 6.2 連身

責任：one-piece 服裝本體。它不屬於上身加下身，不應再拆成 top/bottom。

命名規則：

- UI label 使用 `連身：短版｜名稱` 或 `連身：長版｜名稱`。
- 短版和長版要從 label 就能辨識。

Prompt 規則：

- 描述 one-piece silhouette、neckline、hem length、fabric texture。
- 主色交由連身配色控制。
- 不加入鞋襪、外套、包、配件。
- 若是移到套裝的完整主題，不應留在連身。

## 7. 上身與下身

2026-10-04 新增四款小面積蕾絲／細繩泳裝單品與服裝自身貼合效果，見 [小面積單品 v1](minimal-coverage-wardrobe-v1.md)。既有四款原文、ID 與列順序保留；新款不改人物體態，AI 保留有效杯緣與繫繩來源，新下身不擴充自動吊襪帶白名單。

同日使用者核准「小三角細繩比基尼上身」改採布料描述，移除該款罩杯與杯緣文字，保留精確正式來源及舊英文匯入 alias；其他三款不變。詳見上述規格的「比基尼布料描述正式更新」及 [六輸出確認文件](string-bikini-fabric-v2-six-prompts.md)。

同日後續授權「窄前片細繩比基尼下身」採相同布料描述架構：極少量平滑泳裝布料、小型低腰三角前片，保留高腿口、丁字後片及既有繫繩張力／淺壓痕；英文 36 字，沿用小面積單品的字數例外。舊英文作匯入 alias，名稱／ID 不變。下身可見時完整保留，兩組胸上仍依共享投影省略，詳見 [下身六輸出確認文件](string-bikini-bottom-fabric-v2-six-prompts.md)。

同日使用者核准將「小罩杯細帶蕾絲胸罩」原位替換並改名為「X形胸貼」，兩枚貼附式 X 形貼片由平滑不透明布帶構成；保留原 ID、位置、舊名稱與完整英文 alias。英文 27 字沿用此批單品的字數例外，`no cups, shoulder straps, or underband` 是使用者確認的款式結構描述，僅此件保留，不放寬其他單品的負面堆疊規範。六組在可見時保留同一來源；不輸出衣長銜接或衣襬遮下身關係，詳見 [胸貼六輸出確認文件](x-shaped-pasties-v2-six-prompts.md)。

2026-10-05 上身尾端追加「創可貼造型胸貼」：每側一枚橫向單條，平滑不透明圓角長方形布料、中央墊片及兩端細孔，貼附角度略有自然差異。沿用 X形胸貼的六輸出可見來源保留、衣襬排除與短版不適用規則；既有 ID／位置不變，新款沿用配色、圖案、隨機及匯入／收藏架構。見 [創可貼造型胸貼 v1](bandage-pasties-v1.md)。

一般上下身是 B 區最常用的組合層。上身與下身必須保持清楚區隔，UI 中用分隔線協助閱讀，但資料本身仍由各自 category 管理。

### 7.1 上身

責任：上半身主單品本體，例如襯衫、T 恤、背心、針織、胸衣、比基尼上身等。

新增規則：

- 英文 prompt 以 6-20 words 為目標。
- 只描述 garment type、neckline、fabric、cut、hem 或 texture。
- 不寫下身、鞋、外套或配件。
- 不寫顏色，除非是不可拆的材質名稱或特殊款式必需。
- 相近輪廓優先合併，不為微小袖長、領口或鬆緊差異新增選項。
- 長版上身要能和 layering guard 共存，避免被錯誤紮進短褲。

範例語氣：

```text
lace bra top, delicate lace cups, intimate lingerie structure, slim strap detail
```

### 7.2 下身

責任：褲裝或裙裝本體。褲裝和裙裝可以各自為空，但組合時要避免同時輸出互相衝突的主要下身。

新增規則：

- 褲裝描述 pants/shorts/leggings/overalls 的長度、材質、口袋、褲管或腰部結構。
- 裙裝描述 skirt length、hem、drape、pleats、ruffles、wrap 或 fabric。
- 不寫上身、鞋、外套、配件。
- 不把顏色寫死在 prompt。
- 特殊材質如 leather、latex、satin、mesh 可以保留，因為它們是材質不是配色。

2026-09-29 「蕾絲內褲」原位替換為「棉質低腰三角褲」，來源為 `low-rise cotton briefs, soft cotton fabric, triangular front panel, full-coverage back`。保留原 ID `wardrobe:褲裝-pants:蕾絲內褲:7` 與清單順序，單人／雙人控制沿用；舊英文來源及舊名稱作相容 metadata，不輸出為新 Prompt。下身顏色、版型、腰線與同人物吊襪帶搭配沿用既有規則。

2026-09-25 水手服單品例外：`短袖水手服`、`長袖水手服` 是獨立上身，常態為不勾勒胸腰的寬鬆直筒制服衣身，覆到裙腰。上身配色只作用於衣身／袖身；水手領固定近黑深藍配白色平行線，領巾同為深藍，長袖袖口保留深藍白線。選 `上身版型＝緊身` 時，共用 resolved wardrobe 將衣身改為尺寸偏小、貼身且衣襬上移露腹；若同時選紮入、半紮或自然放出，改以衣襬在腰頭上方的可見狀態描述，避免矛盾。`水手服短裙` 是膝上百褶裙；`水手服長裙` 為近地長百褶裙，可搭配女暴走族風格。兩者保留制服腰頭與寬褶；下身版型只改腰頭或褶量，不把裙子變成褲管或壓平裙褶。既有兩套完整水手服維持獨立選項。

## 8. 版型、穿法與腰線

2026-10-05 胸下短版上身：新增「短版緊身」「短版合身」，39 款一般上身（含現有短版）在明確選用時統一到胸下衣襬；逐款 metadata 保留材質、領口、袖型與裝飾，覆寫衣長及衣身鬆緊。五款胸罩／泳裝／胸貼不適用；紮入、半紮、腰下打結、上身衣襬遮擋暫停，自然放出改用胸下來源。單人與雙人 A/B 共用；舊來源、ID、隨機池、完整造型優先權及 storage 不變。詳見 [胸下短版上身版型 v1](underbust-top-fit-v1.md)。下方水手服舊緊身例外繼續生效，新短版另依共用規則解析。之後新增一般上身時，須同步審核 `topUnderbust.baseEn`；未提供來源的款式不啟用新短版。

### 衣襬遮住部分下身（2026-09-27）

2026-10-05 外套另增同名手動選項，沿用外套穿法單選欄位；描述接在外套後，透明變體與衣長／開合／袖型／手部相容先共用解析，六組可見英文保留原文。上身原選項不變。詳見 [外套穿法 v2](outerwear-styling-v2.md)。下方歷史衣襬體態刪除規則已由 [體態目錄 v2](body-type-catalog-v2.md) 取代，獨立體態來源維持完整。

- 新增 `topStylingId=hem-overlap`，單人與雙人 A/B 共用；保留 `untucked`「自然放出」。第一版僅手動選取，不加入既有隨機池。
- 共用英文來源為 `worn untucked, its hem draping naturally over the waistband and upper portion of the lower garment, partially concealing it while leaving the remaining fabric visible below`。承接單品後輸出，保留實測的遮擋關係，不指定比例、額外衣長或寬鬆版型。
- 同一人物必須有獨立上身及褲裝／裙裝。明確短版、比基尼、胸罩、運動內衣及緊身後露腹的水手服不輸出這段；保留已選 ID，不替換單品或強行拉長衣服。完整造型仍依既有優先權接管。
- 下身原始長度、剪裁、配色與材質不變。選用這個穿法時，不再疊加泛用低腰衣襬相容句。
- 當這段衣襬覆蓋關係有效時，該人物的普通體態描述同步移除腰部、腰臀比例、腹部線條與相關量測錨點，避免體態來源重新強調被衣襬遮住的區域。`性感曲線身形` 以測試接受的整體曲線描述保留身形、胸型與臀型。雙人依各自穿法分別投影；未觸發的穿法、其他人物及 Character Card 永久身份文字維持原來源。這只改公開 Prompt 的 resolved body text，不改選項 ID、原始體態資料或 Saved Card。
- 共用構圖投影只在腰部可見時保留。胸上與臉部裁切省略；全身角色照從原始 resolved wardrobe 重新投影。MJ 保留可見的選定穿法，不將它當成普通衣襬結構細節丟掉。
- `Docs/0927` 的真理褲、牛仔長褲、百褶裙與棉質／絲質上衣測試由使用者接受；絲質衣長與偶發半紮仍是外部生成變化，未宣稱所有組合完全穩定。


這些欄位是 modifier，不是單品。

| 欄位 | 責任 | 組裝位置 |
| --- | --- | --- |
| 上身版型 | 上衣鬆緊、貼身、寬鬆、短版等比例 | 上身單品之前 |
| 上身穿法 | 紮衣、打結、滑肩、半脫等穿著方式 | 上身單品之前 |
| 下身版型 | 下身鬆緊、寬版、合身等輪廓 | 下身單品之前 |
| 下身腰線 | 高腰、低腰、扣子微開等腰部狀態 | 下身單品之前 |
| 外套穿法 | 外套正常穿著、滑落肩線等 | 外套單品之前 |

維護規則：

- 英文 prompt 以 4-14 words 為目標。
- 不新增會變成單品的 modifier。
- `扣子解開拉鏈微開` 這類腰線只應套用在褲裝，不應套用到裙裝。
- 穿法要描述衣物狀態，不描述人物表情或姿勢。

### 外層露肩穿法（2026-09-09）

- `單肩露出` 描述衣服滑至單側上臂、領口同側降低，另一側肩膀仍被覆蓋；不指定左右手／左右肩。
- `雙肩露出` 採核准 D：衣服半脫掛在雙側上臂，雙肩完全露出，雙臂仍在袖內。重點是完整衣服的位置改變，不是挖肩剪裁或保留在肩上的布條。
- 穿法片語不另引入 `jacket`／`outerwear` 服裝名稱，也不加入背面／三分之四視角的條件句；服裝本體由外套選項負責。
- 開合仍由 `outerwearOpeningId` 獨立控制。`敞開穿` 使用 `worn open at the front`；選擇露肩不自動改成敞開。
- AI 壓縮必須保留有效的單肩／雙肩穿法與其開合來源，不得讓下襬或其他結構細節取代穿法；版型修飾亦不得取代服裝本體。
- 2026-09-27 進一步簡化「外套」分類長版襯衫為 `longline cotton-poplin button-up shirt`；「上身」分類中的長版襯衫維持原文。名稱、ID、列順序不變，舊英文保留為 Prompt 回填 alias。
- 回歸入口：`webapp/src/lib/engineOuterwearShoulderWear.test.js` 與 `webapp/src/lib/engine/representativePromptFixtures.js` 的兩組 `longline-shirt-*-shoulder` 案例。

## 9. 配色與圖案

配色與圖案是表面修飾層，必須依目標單品分開。

### 9.1 配色

目前主要配色欄位：

- 套裝/連身配色、主色、對比色、鎖定色方案。
- 上身配色、下身配色、連身配色。
- 外套配色、鞋款配色、襪類配色。
- 特殊上下身配色。

維護規則：

- 配色 prompt 不使用色碼。
- 一般單品 prompt 不寫死顏色，讓配色欄位可控。
- 特殊上下身配色可以同時指定 top/bottom 的搭配關係，但不要輸出技術色值。
- 品牌鞋或固定材質可保留視覺必要的 signature detail，但不要和鞋款配色衝突。

### 9.2 圖案

目前主要圖案欄位：

- 上身圖案。
- 下身圖案。
- 外套圖案。

維護規則：

- 圖案必須明確作用在目標單品上，例如 `across the top garment`、`across the lower garment`、`across the outerwear`。
- 不讓圖案變成全身刺青、背景牆、場景塗鴉或道具。
- 同類圖案可用不同密度、主題或位置區分；如果只是名稱不同但畫面結果接近，優先合併。
- 圖案可帶顏色語意，但不要用色碼。
- 上身圖案保留修正（2026-09-22）：主 MJ 與 MJ 胸上的一般上衣壓縮，必須在上衣片語內保留已解析 `topPatternId` 且仍存在於共用投影 `Top` 的來源片段，各片段只出現一次。不可只保留衣物名稱／領口／下襬而刪除圖案，也不可從原始來源補回投影已刪除的內容。沒有上衣、選擇全無、或被連身／套裝／特殊穿搭取代時不新增圖案；下身、外套與雙人各角色的圖案壓縮不屬於這次修正。
- 近景來源修正：一般單人主景別為半臉／全臉等近景時，仍須解析明確選定的一般上衣圖案，讓胸上／全身衍生輸出取得相同來源。空值、隨機與未知 ID 不額外抽選；投影仍可隱藏主臉部特寫的服裝。Saved Cards 使用原 `topPatternId`，不新增 schema 或批次改寫舊文字。

## 10. 外套、襪類與鞋款

### 10.1 外套

責任：外層服裝。外套應清楚覆蓋或疊在上身、套裝、連身之上。

新增規則：

- 英文 prompt 以 6-20 words 為目標。
- 只保留款式、材質與必要辨識特徵，避免重複列舉衣領、袖口、肩線與衣襬。版型、衣長、開合、穿法依 [外套整理 v1](outerwear-catalog-v1.md) 各自組合，MJ 保留可見圖案與開合。
- 不描述內搭、下身或鞋款。
- 外套圖案與外套配色分開控制。
- 若外套和連身細肩帶共存，要維持外套是外層，不把外套誤生成細肩帶。

### 10.2 襪類

責任：腿部或腳踝的 secondary styling。

新增規則：

- 英文 prompt 以 4-16 words 為目標。
- 描述 hosiery type、length、texture、band、garter 或 ribbed structure。
- 長褲或長裙存在時，襪類應保持 secondary，不應覆蓋長下身。
- 條件式加層：只有獨立下身選擇「棉質低腰三角褲」（原「蕾絲內褲」）、「蕾絲丁字褲」或「比基尼下身」，且同一人物的襪類選擇「膝上蕾絲吊帶襪」時，runtime 才在襪類的共用來源補上「蕾絲吊襪帶腰封穿在下身之外、吊帶連接至襪口」的描述。這是襪類與獨立下身的條件式搭配，不是新的腰部配件選項；完整套裝、連身服、其他下身與跨人物 A/B 配對均不觸發。
- 條件式來源保留原選項 ID／英文字串於 catalog 不變，單人與雙人 A/B 依相同人物層級配對；各 renderer 繼續套用原有構圖可見性與壓縮規則。Generation Summary 顯示「蕾絲吊襪帶腰封（自動搭配）」以便追溯，selection／Saved Cards 不建立新的配件欄位。

### 10.3 鞋款

責任：鞋型、鞋底、鞋面與可辨識款式。

新增規則：

- 一般鞋款以 5-18 words 為目標。
- 品牌或型號鞋款可保留 signature details，例如 side stripe、welt stitching、platform sole。
- 不為同一鞋型新增過多近似款，除非輪廓或 signature detail 明顯不同。
- 鞋款 prompt 不寫死顏色，讓鞋款配色控制；例外是款式本身不可拆的 signature accent。

## 11. 配件

配件是低干擾點綴層，除非是特殊穿搭完整造型包的一部分，不應成為畫面主體。

目前主要配件欄位：

- 頭部配件。
- 眼鏡本體。
- 眼鏡配色。
- 眼鏡配戴方式。
- 耳環。
- 頸部配件。
- 腰部配件。

### 11.1 頭部配件

責任：帽子、髮夾、髮箍、皇冠等頭上單品。頭部配色共用服裝色票；耳機與口鼻遮擋使用獨立欄位。

維護規則：

- 耳罩式耳機目前只保留黑色 Marshall Major V 方向。
- 耳機位置拆成 `戴在頭上` 與 `掛在脖子上`，不要再新增銀色 AirPods Max 類型。
- 有線耳機描述連續線材沿軀幹收到側腰／臀側衣物下，末端隱藏、不得懸空；不憑空加入褲子、口袋、手機。近景保留可見線材延伸出下方畫框，不要求畫出腰臀。
- 頭戴耳機與帽子、頭巾、皇冠、兔耳髮箍、女僕頭飾互斥；小髮夾可共存。掛頸耳機、有線耳機不受這項限制。
- 口罩／防毒面具與鼻部、唇部穿孔雙向互斥；鼻部和唇部穿孔可共存，仍維持手動限定。
- 新欄位預設全無；使用者設為隨機時，耳機與口鼻遮擋分別採 16%／8% 出現率，先尊重已鎖定項目再過濾衝突候選。
- 新欄位與雙人 A/B 欄位保留原本配件 ID。Markdown 頭部配件來源列暫留原順序以維持索引 ID；runtime 透過 `engine/accessoryPolicy.js` 分類。不要移動來源列來變更 UI。
- 舊頭部配色隨遷移單品保存在相容欄位；UI 改選耳機／遮擋時回到原配色。舊遮擋＋穿孔資料回填時保留遮擋並顯示通知，原收藏 prompt 不改寫。

### 11.2 眼鏡

責任拆分：

- `眼鏡 (Eyewear)`: 鏡框本體與鏡片類型。
- `眼鏡配色 (Eyewear Color)`: 鏡框顏色或材質。
- `眼鏡配戴方式 (Eyewear Placement)`: 正常戴在臉上或戴在頭頂。

維護規則：

- 不再新增 `黑框眼鏡`、`白色鏡框眼鏡` 這種本體加顏色混合選項。
- 不再新增 `眼鏡戴在頭頂` 這種本體加位置混合選項。
- 新增鏡框時只描述 shape，例如 thick-frame、thin-frame、round-frame、oval。
- 新增配色時只描述 frame color/material。
- 新增位置時只描述 placement，不描述表情、髮型或鏡頭。

### 11.3 耳環與頸部配件

責任：臉側、耳側、頸部與鎖骨附近的小型飾品。

維護規則：

- 英文 prompt 以 4-16 words 為目標。
- 優先使用 `detail`、`subtle`、`understated` 控制存在感。
- 不讓耳環或項鍊變成主要服裝。
- 避免過大的 statement jewelry，除非是特殊穿搭完整造型包。
- MJ 輸出時每個項目原則上壓縮為一個短片語，保留本體、主要顏色／材質與必要的特殊造型；移除 `details`、重複穿戴位置與多餘的動作描述，不刪除已選的耳環或頸部配件。

### 11.4 腰部配件

責任：腰線、腰部或髖部附近的可見服裝飾品，例如腰帶、腰鍊、鏈條與腰封。

維護規則：

- 英文 prompt 以 6-16 words 為目標。
- 明確描述配件位於 waist 或 hips，避免被誤解成頸部項鍊或一般服裝結構。
- 腰帶應描述帶體、扣具或鉚釘；腰鍊應描述鏈節、垂掛或層數。
- 保持可與上身、下身、外套和鞋襪組合的中性語氣，不寫入特定完整造型。
- 腰部配件只在中景、全身或更寬畫面中投影；臉部與胸上特寫不應硬塞腰部描述。
- MJ 輸出時保留每個已選腰部配件，優先寫成一個包含本體、主要材質／造型與必要 `waist`／`hips` 位置的短片語；不得以固定字數為由只留下其中一條腰鏈、腰帶或鏈條。

## 12. 雙人物角色 A/B

多數 B 區欄位都有單人鍵與雙人物角色鍵。

命名規則：

- 單人：`topId`、`eyewearId`、`shoesId`。
- 人物 1：`topAId`、`eyewearAId`、`shoesAId`。
- 人物 2：`topBId`、`eyewearBId`、`shoesBId`。

維護規則：

- 新增控制鍵時要同時評估是否需要 A/B 版本。
- A/B 版本要能分別出現在各自 subject description 或 wardrobe text 中。
- 配件尤其要綁在人身上，避免 duo prompt 裡眼鏡、耳環、項鍊混到另一位人物。
- selection output 必須回傳單人與 A/B 對應 id，方便 UI 與 favorite 保存。

## 13. 層次保護規則

部分服裝組合需要額外 guard，避免生成模型誤解層次。

目前重要 guard：

- 長版上身搭短褲時，上衣應自然外放，不要被塞進短褲。
- 外套搭細肩帶連身時，外套是完整外層，細肩帶屬於內層連身。
- 長褲或長裙存在時，襪類是 secondary，不應蓋過長下身。
- 外套搭套裝時，外套先作為外層，再說明 layered over outfit preset。

維護規則：

- 新增容易衝突的衣長、外層或襪類時，需評估是否要擴充 `buildWardrobeLayeringLogicPrompt`。
- Guard 應短而直接，聚焦衣物層次，不加入負面詞堆疊。
- 新 guard 必須有測試保護。

## 14. 改名、合併與舊資料相容

多數 wardrobe option id 會由 category、中文標籤與 row index 產生。因此改名、合併、調整排序都可能讓舊 favorite 或 saved lock 找不到選項。

維護規則：

- 優先 append 新選項，不任意插入中間。
- 改名、合併、移除時必須加入 legacy mapping。
- 舊選項應 map 到最接近的新選項；只有真的被淘汰且無替代時才 map 到 `全無`。
- 拆分維度時，要把舊 lock 遷移到多個新欄位。例如舊 `白色鏡框眼鏡` 應遷移成眼鏡本體加眼鏡配色。

目前相關 mapping 區域：

- `WARDROBE_LEGACY_OPTION_MAP`
- `LEGACY_WARDROBE_OPTION_IDS`
- `LEGACY_OUTFIT_DRESS_LOCK_MIGRATIONS`
- `LEGACY_EYEWEAR_LOCK_MIGRATIONS`
- `normalizeLocks`

## 15. 新增選項流程

新增一般 B 區選項：

1. 確認它屬於特殊穿搭、套裝、連身、上身、下身、modifier、配色、圖案、鞋襪、外套或配件。
2. 檢查現有選項是否已能覆蓋，能合併就不要新增。
3. 在 `knowledge_base/wardrobe_and_styling.md` 新增或修改 row。
4. 跑 `python3 scripts/sync_to_json.py`。
5. 如果有改名、合併、刪除或維度拆分，更新 `engine.js` legacy mapping 或 migration。
6. 若新增控制鍵，更新 `LOCK_DEFINITIONS`、`getLockControls`、`EFFECTIVE_WARDROBE_LOCK_KEYS`、`buildWardrobeSlots`、selection output、Page1 UI summary。
7. 更新或新增對應測試。
8. 跑完整驗證。

新增特殊穿搭：

1. 確認它是完整造型包，不是一般套裝或上下身可組合完成。
2. Prompt 必須以 `complete outfit:` 開頭。
3. 保持完整但不要爆量，優先列核心視覺 anchor。
4. 更新特殊穿搭數量與完整造型優先權測試。
5. 確認選中特殊穿搭時仍優先輸出完整造型。

新增眼鏡或配件拆分維度：

1. 先決定是本體、顏色、位置還是配件類型。
2. 不混寫 frame、color、placement。
3. 為舊混合選項加 migration。
4. 測試 prompt 是否能把本體、配色與位置自然組合。

## 16. 測試與驗證

依修改範圍更新或新增測試：

| 修改範圍 | 主要測試 |
| --- | --- |
| 上身清理、合併、legacy | `webapp/src/lib/engineWardrobeTopCleanup.test.js` |
| 套裝、連身、顏色拆分 | `webapp/src/lib/engineOutfitPresetDressCleanup.test.js` |
| 特殊穿搭完整造型包 | `webapp/src/lib/engineSpecialOutfitCleanup.test.js` |
| 鞋襪、外套、層次、配件基本組合 | `webapp/src/lib/engineWardrobeControls.test.js` |
| 眼鏡與耳機配件拆分 | `webapp/src/lib/engineAccessoryEyewearCleanup.test.js` |
| Z-Image 穿搭自然語言 | `webapp/src/lib/engineZImageWardrobeLanguage.test.js` |

完整驗證命令：

```bash
cd webapp
node --test src/lib/engineWardrobeTopCleanup.test.js
node --test src/lib/engineOutfitPresetDressCleanup.test.js
node --test src/lib/engineSpecialOutfitCleanup.test.js
node --test src/lib/engineWardrobeControls.test.js
node --test src/lib/engineAccessoryEyewearCleanup.test.js
node --test src/lib/engineZImageWardrobeLanguage.test.js
npm test
npm run lint
npm run build
git diff --check
```

允許既有 Vite chunk-size warning；其他錯誤需修正。

## 17. Review Checklist

送出前請確認：

- 選項是否真的屬於 B 區，而不是 A 人物、C 場景光線或 D 攝影。
- 英文 prompt 是否短、清楚、正向。
- 一般單品是否沒有偷渡顏色、下身、鞋、外套、配件或完整造型。
- 套裝與連身是否不帶固定顏色，主色是否由配色欄位控制。
- 特殊穿搭是否以 `complete outfit:` 開頭，且仍是完整造型包。
- 眼鏡是否維持本體、配色、配戴方式拆分。
- 配件是否保持低干擾，不搶主服裝。
- 外套、長上身、襪類是否有必要的層次保護。
- Duo A/B 控制是否能分別作用於人物 1 和人物 2。
- 改名、合併、移除是否保留舊 saved lock 相容性。
- 測試是否覆蓋新行為、prompt 組合與舊資料遷移。

## 外套完全閉合（2026-09-29）

2026-10-05 新穿法 v2 將完全閉合的穿法限制改為逐項判斷；有效衣襬關係與捲袖可保留，既有露肩與不穿袖披肩不生效。其餘閉合及內搭來源規則不變，見 [外套穿法 v2](outerwear-styling-v2.md)。

外套開合新增「全扣上／全拉上」，手動選用且不進入原隨機池。扣件措辭由既有 `outerwear.fasteners` 決定；未宣告扣件時使用通用完全閉合描述。薄紗與蕾絲以 `closedInnerLayerVisibility: through-fabric` 明確保留透過布料可見的內搭；其他款式在共用渲染投影中移除上身內搭及其修飾。不可刪除原選項、改變衣長或清空下身／配件。完全閉合的外套穿法有效值為全無；與拉開外套的手部動作互斥。完整規則、角色卡／特殊穿搭接管邊界及 Saved Cards 保留方式見 [外套資料與穿法整理 v1](outerwear-catalog-v1.md#全扣上全拉上2026-09-29)。
