# B 穿搭設定新增與維護規格

Last updated: 2026-06-27

這份文件定義 PAGE1 `B. 穿搭設定` 的新增、修改、合併與測試規則。後續新增上身、下身、套裝、連身、鞋襪、外套、配件、顏色或圖案時，請先依照本規格檢查責任邊界、prompt 寫法、組合順序與舊資料相容性。

單人模式的 Gpt / Grok/Z-Image / AI 壓縮規則請同時參考 `/Users/cooperfu/Desktop/Virtual_Photography_Studio/Docs/specs/page1-single-prompt-compression-guide.md`。尤其是一般上下身、鞋襪與外層、套裝、連身、特殊穿搭與配件，新增資料時應避免正常穿著狀態說明、泛用 styling 尾句、內部控制語言與不必要的同義詞堆疊。

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
- `套裝/連身` 是明確風格方向或 one-piece 主體，可再搭配外套、鞋襪與配件。
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

命名規則：

- UI label 使用 `套裝：名稱`。
- 名稱要指向明確服裝類型，例如 `套裝：西裝長褲`、`套裝：護士`、`套裝：兔女郎`。
- 不使用抽象生活風格名稱，例如極簡高級、文青生活、旅行度假。

Prompt 規則：

- 不寫死主色，使用 `dominant fabric color controlled by the outfit color selection` 或相近語氣。
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

## 8. 版型、穿法與腰線

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

## 10. 外套、襪類與鞋款

### 10.1 外套

責任：外層服裝。外套應清楚覆蓋或疊在上身、套裝、連身之上。

新增規則：

- 英文 prompt 以 6-20 words 為目標。
- 描述 outerwear type、fabric、lapels、zipper、hood、length、shoulder line。
- 不描述內搭、下身或鞋款。
- 外套圖案與外套配色分開控制。
- 若外套和連身細肩帶共存，要維持外套是外層，不把外套誤生成細肩帶。

### 10.2 襪類

責任：腿部或腳踝的 secondary styling。

新增規則：

- 英文 prompt 以 4-16 words 為目標。
- 描述 hosiery type、length、texture、band、garter 或 ribbed structure。
- 長褲或長裙存在時，襪類應保持 secondary，不應覆蓋長下身。

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

### 11.1 頭部配件

責任：帽子、耳機或頭部附近的可見小物。

維護規則：

- 耳罩式耳機目前只保留黑色 Marshall Major V 方向。
- 耳機位置拆成 `戴在頭上` 與 `掛在脖子上`，不要再新增銀色 AirPods Max 類型。
- 有線耳機應描述 cable visibility，不要變成手機或自拍動作。

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
