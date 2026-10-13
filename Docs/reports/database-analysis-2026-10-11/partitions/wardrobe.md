# 穿搭 Wardrobe 分區：資料品質分析

- 分析日期：2026-10-11；repo HEAD `0d5c990`。`webapp/`、`knowledge_base/`、`scripts/` 沒有未提交改動，只有其他 session 動過 `Docs/`，不影響本分析。
- 性質：唯讀分析。repo 內的檔案一律沒有修改、建立或刪除。
- 評估標準：`Docs/specs/wardrobe-section-b-authoring-guide.md`（以下稱「B 規範」）、`AGENTS.md`、`Docs/current_project_state.md`。
- 文中凡寫「md:N」，都指 `knowledge_base/wardrobe_and_styling.md` 第 N 行。

---

## 0. 方法與可重現性

本報告的數字都由下列腳本實際算出，沒有人工估算。腳本和原始輸出放在本資料夾：

| 腳本 | 用途 | 執行方式 |
| --- | --- | --- |
| `wardrobe_analyze.mjs` | 數量、字數、詞彙掃描、格式、近似重複、中英術語比對、欄位覆蓋、legacy、manifest、啟發式分佈 | `node wardrobe_analyze.mjs wardrobe_metrics.json` |
| `wardrobe_code_coupling.mjs` | 中文名稱在程式碼中的硬寫次數、engine.js 的 regex 改寫行數 | `node wardrobe_code_coupling.mjs` |
| `wardrobe_runtime_family.mjs` | 讀引擎執行期推論出的 `meta.family`／`tags` | 在 `webapp/` 下執行 |
| `wardrobe_mj_coverage.mjs` | 主 MJ 短名表對目錄 ID 的覆蓋率 | 在 `webapp/` 下執行 |
| `wardrobe_control_leak_probe.mjs` | **實跑**：83 個套裝／連身，各跑「全無色」與「淡藍」兩種，檢查 GPT／Z／MJ 三組輸出是否殘留控制語 | 在 `webapp/` 下執行 |
| `wardrobe_control_leak_default_probe.mjs` | **實跑**：只鎖套裝／連身，其餘維持預設，每項 3 個 seed | 在 `webapp/` 下執行 |
| `wardrobe_preset_color_probe.mjs` | **實跑**：固定色套裝遇到套裝主色時的輸出 | 在 `webapp/` 下執行 |
| `wardrobe_tag_usage.sh` | 推論出的 tag 是否在非測試程式碼中被使用 | `bash wardrobe_tag_usage.sh` |

另外執行 `python3 scripts/sync_to_json.py --check`，結果通過；`--check` 模式不寫檔。

**啟發式聲明**：§1.3 的風格、暴露度、季節分佈靠關鍵字比對得出，可多標籤，只能拿來觀察趨勢。資料本身沒有這些欄位。

---

## 1. 量化總覽

### 1.1 覆蓋度：24 子類，539 條，其中 516 條不是「全無」

任務描述估計約 560 條，實際為 539 條。

| 子類 | 條數 | 非全無 | 有全無列 | 有參考圖 | 主 MJ 短名 |
| --- | ---: | ---: | :---: | :---: | :---: |
| 特殊穿搭 | 91 | 90 | ✓ | 90/90 | —（不適用） |
| 套裝 | 59 | 59 | **✗**（由 engine 補 `OUTFIT_PRESET_NONE_OPTION`） | 59/59 | — |
| 上身 | 46 | 45 | ✓ | ✗ | 45/45 |
| 上身圖案 | 26 | 25 | ✓ | ✗ | — |
| 連身 | 25 | 24 | ✓ | 24/24 | 24/24 |
| 褲裝 | 34 | 33 | ✓ | ✗ | 33/33 |
| 裙裝 | 32 | 31 | ✓ | ✗ | 31/31 |
| 下身圖案 | 15 | 14 | ✓ | ✗ | — |
| 襪類 | 12 | 11 | ✓ | ✗ | 11/11 |
| 外套版型／開合／穿法／圖案 | 10/6/8/8 | 9/5/7/7 | ✓ | ✗ | — |
| 外套 | 23 | 22（4 款 retired，只供還原） | ✓ | ✗ | 22/22 |
| 鞋款 | 36 | 35 | ✓ | ✗ | 35/35 |
| 頭部配件 | 19 | 18 | ✓ | ✗ | 18/18 |
| 眼鏡／配色／配戴 | 11/13/3 | 10/12/2 | ✓ | ✗ | 10/10／—／— |
| 耳環／鼻穿孔／唇穿孔 | 10/5/5 | 9/4/4 | ✓ | ✗ | 全覆蓋 |
| 頸部 | 31 | 30 | ✓ | ✗ | 30/30 |
| 腰部配件 | 11 | 10 | ✓ | ✗ | 10/10 |

- 參考圖只涵蓋 3/24 子類，共 173 張。manifest 與資料名稱完全一致，source 與 preview 檔都存在。其餘 21 子類沒有任何視覺參考。
- 主 MJ 短名表 `midjourneyItemNames.js` 有 286 條，對 14 個單品子類的覆蓋率 100%，沒有孤兒 ID。

### 1.2 英文 Prompt 長度（以詞計）

全體：min 2／中位 16／max 94，共 11,770 詞。有字數規範的 456 條中，**56 條（12.3%）超過上限**，16 條低於下限。

| 子類 | 中位 | min（項目） | max（項目） | B 規範 | 超上限 |
| --- | ---: | --- | --- | --- | ---: |
| 特殊穿搭 | 52 | 38 | 88（白色馬甲黑色七分褲金飾造型 md:95） | 35-85 | 1 |
| **套裝** | 28 | 16 | **94（亮面膠帶束帶套裝 md:154）** | 12-32 | **24/59（40.7%）** |
| 上身 | 13 | 7 | 45（創可貼造型胸貼 md:203） | 6-20 | 8（17.8%） |
| 連身 | 25 | 19 | 54（亮面乳膠拉鏈洋裝 md:254） | 12-32 | 3 |
| 外套 | 8 | **2**（針織開襟外套「knit cardigan」） | 20 | 6-20 | 0（低於下限 7） |
| **外套穿法** | 17 | 9 | 20（雙肩露出 md:390） | 4-14 | **5/7** |
| 頭部配件 | 10 | 7 | 42（有線耳機 md:442） | 4-16 | 3 |
| 唇部穿孔 | 15 | 10 | 34（右側下唇雙珠開口環 md:502） | 4-16 | 2/4 |
| 腰部配件 | 20.5 | 14 | 36（愛心垂墜銀腰鍊 md:542） | 6-16 | 5/10 |
| 眼鏡 | 2.5 | 2 | 23（眼布） | 4-16 | 1（低於下限 8） |
| 圖案三類、眼鏡配色、配戴方式 | — | — | — | **not_stated** | — |

超長最多的前 10 條中，有 9 條是套裝：亮面膠帶束帶 94、粉紅哥德兔耳吊帶束身 90、亮面乳膠束帶 80、米白緞面蕾絲馬甲短裙 80、白色哥德圖示包臀迷你裙 76、網狀蕾絲馬甲短裙長靴 73……另 1 條是頭部配件「有線耳機」42 詞。

### 1.3 啟發式分佈（主要服裝子類）

| 子類 | 暴露度 高／中／低 | 季節 冷／暖／兩者／中性 | 主要風格標籤 |
| --- | --- | --- | --- |
| 特殊穿搭 (90) | 33/35/22 | 8/41/18/23 | 街頭休閒 70、Y2K／復古 25、哥德龐克 21、正式 17 |
| 套裝 (59) | 24/21/14 | 4/23/4/28 | 制服／cosplay 13、街頭 13、正式 12、內衣 11 |
| 連身 (24) | 8/13/3 | 1/10/0/13 | 大多無風格詞 |
| 上身 (45) | 9/10/26 | 4/11/5/25 | — |

地區訊號（zh＋en＋desc）：日系 14、中式 4、**韓系 0**、西方具名（Parisian／Victorian／Y2K／western 等）29。B 規範 §1 第 22 行寫的主線是「日系或韓系」。

### 1.4 詞彙掃描（只看英文 prompt，排除全無列）

| 類別 | 命中條數 | 分佈與代表 |
| --- | ---: | --- |
| **內部控制語**（`controlled by`、`color selection`） | **68** | 套裝 42、連身 24、特殊穿搭 1（`palette-controlled`、`palette selection`，md:98）、頸部 1 |
| 負面詞 | 3 | X形胸貼「no cups」（已核准例外）、有線耳機、白色哥德「non-repeating」 |
| 場景詞 | 76 | 特殊穿搭 61 條，多為 `street` 的風格語氣，屬規範允許；套裝與上身有 `office`、`school`、`resort` 共 7 條 |
| 光線詞／色碼 | 0／0 | — |
| 人物或主觀詞 | sensual 3、cute 11、girl 2 | `sensual`：md:28、md:112、md:307（緞面短裙） |
| 泛化形容詞 | 128 | delicate 42、polished 29、playful 26、bold 17、refined 11 |
| 一般單品寫死顏色 | 24 | 套裝 15、上身 3（領帶襯衫黑領帶、水手服領）、鞋款 5（Dr. Martens 黃色縫線）、裙裝 1 |
| 品牌／IP 名稱 | 19 | 鞋款 9/35（其中 Dr. Martens 5 款）、Spider-Man／Venom／Spider-Gwen、Metallica、Gucci、Marshall、3M |

### 1.5 結構與 metadata

| 指標 | 數值 |
| --- | --- |
| metadata 合併方式 | **3 種**：① `outfit_preset_metadata.json` 合併到 `meta`；② manifest 合併到 `meta`；③ `item_metadata.json` 合併到**頂層**，再由 engine.js:3333-3342 的白名單搬進 `meta` |
| 套裝 metadata | 59 條中 27 條是空物件 `{}`。有 `colorMode` 的 23 條；`embeddedOuterwear` 9 條 |
| 上身 `topUnderbust` | 39/45 |
| 外套 `outerwear` 結構化欄位 | 22/22（baseEn／defaultLength／fasteners） |
| legacy 負擔 | legacyIds 35、legacyLabels 6、legacyPromptAliases 39（4,833 字元，佔 en 總字元 **5.6%**）、stableId 30 |
| 推論 tag 的使用情形 | engine 推出 `revealing` 82、`romantic` 114、`ornate` 110、`casual` 72 等；非測試程式碼只用到 `outdoor_bias`、`accessory_small`、`optional_silence`（見 `wardrobe_tag_usage.sh`）。另有 `streetwear`、`heritage` 兩個同名字串命中，但出現在 family 推論與場景／風格 tag 的程式碼裡，不是讀取 wardrobe tag |

### 1.6 資料與程式耦合

| 指標 | 數值 |
| --- | --- |
| 中文單品名以字串常數出現在非測試程式碼 | **118/516 條**（上身 34、頸部 11、眼鏡配色 9、套裝 16……） |
| engine.js 中以 regex 改寫服裝英文片語 | 73 行（全檔 `.replace(/` 共 689 行） |
| engine.js 專門清除控制語的 regex | 27 行（例如 engine.js:12284-12300） |
| 近兩個月改到 wardrobe md 的 commit | 41 次。其中 **26 次同時改 engine.js**、23 次改 representativePromptFixtures、19 次改 B 規範；每個 commit 中位改動 7 個檔 |

---

## 2. 優點

1. **同步管線有防呆，且目前一致。** `sync_to_json.py --check` 通過。同步會檢查同子類重名、套裝 metadata 名單、manifest 名稱、實體圖檔是否一一對應（scripts/sync_to_json.py:107-230）。173 張參考圖全部對齊，沒有「有圖無條目」或「有條目無圖」。
2. **格式很乾淨。** 英文欄位中雙空格、中文字、色碼、光線詞、完全重複的 en 都是 0；全無列以外沒有空的 desc。90/90 條特殊穿搭都以 `complete outfit:` 開頭並以句號結尾，`complete outfit:` 也沒有出現在其他子類。
3. **分層清楚。** 特殊穿搭 → 套裝／連身 → 一般單品 → modifier（版型、開合、穿法、圖案、配色）的責任邊界，在 B 規範 §4 與資料層都看得到。眼鏡拆成本體、配色、配戴方式，已無混合選項。
4. **新近資料走向結構化。** 外套 22/22 有 `outerwear` 結構欄位（baseEn／defaultLength／fasteners），上身 39/45 有 `topUnderbust.baseEn`，套裝 23 條有 `colorTargets`（primary／contrast／locked）。衣長、扣件、配色目標都已經可以由資料驅動。
5. **相容性紀律好，負擔輕。** 有 30 個 stableId 固定歷史 ID；alias 只佔 en 字元 5.6%。主 MJ 短名表對單品子類 100% 覆蓋、沒有孤兒，而且有測試檢查名稱與 ID 對應（midjourneyNaturalPrompt.test.js:130-140）。
6. **內容量厚。** 90 套有參考圖的特殊穿搭 en 中位 52 詞，以街頭、Y2K、哥德、復古為主，是很強的完整造型庫。

---

## 3. 缺點與風險

### 3A. 確定問題（有規則依據，並有實跑或資料證據）

#### P1：控制語寫在資料裡，而且確實出現在公開 prompt【嚴重度：高】

- **規則**：B 規範第 159 行寫明「不要把 `controlled by the outfit color selection` 這類內部控制語寫進公開 prompt」。`current_project_state.md:993` 規定「未選色時不得注入 `dominant fabric color controlled by the outfit color selection`」。`AGENTS.md` 也禁止 selection-control 語言外洩。
- **資料證據**：66 條套裝與連身的 en 含有 `controlled by`。例如 md:100 鏈條緞面內衣套裝結尾是「dominant satin color controlled by the outfit color selection」；md:236 一字領哥德迷你洋裝含「contrast trim controlled by contrast palette」。
- **程式現況**：engine 靠 27 行逐字 regex 事後替換這些片語（engine.js:11434、12061-12063、12284-12300）。白名單只認 `fabric|uniform|textile|leather` 等少數字，沒認到的就漏掉或截斷。
- **實跑證據**：
  - `wardrobe_control_leak_default_probe.out.json`：只鎖套裝或連身、其餘預設，跑 249 次，**GPT 有 108 次、Z-Image 有 24 次殘留**，83 項中有 36 項受影響。
  - `wardrobe_control_leak_probe.out.json`（全身景別，全無色）：維多利亞古典套裝的 GPT 輸出仍含「dominant fabric color controlled by the outfit color selection」。
  - 截斷殘片：西裝長褲與秘書短裙兩套在 GPT 與 Z 中都輸出「…office suiting silhouette, **dominant suit.**」。
  - 連身全部 24 款的 GPT 輸出都含「main fabric color controlled by dress color selection」。
- **補充**：測試 `engineOutfitPresetDressCleanup.test.js:155` 反過來**要求**資料必須含有這個控制語，等於把違規鎖成了契約。

#### P2：固定色套裝與配色系統互相衝突【嚴重度：高】

- 12 條套裝的 en 寫死了多個顏色，卻沒有 `colorMode`，也沒有固定色標記：
  - 9 條時尚套裝 md:138-146，例如酒紅綁帶針織寬牛仔 md:144 寫了 burgundy、white、black、red。
  - 3 條 cosplay md:155-157。
- engine 遇到沒有 `colorMode` 的套裝，會把主色前置到整段文字（engine.js:9026-9040）。
- **實跑證據**（`wardrobe_preset_color_probe.out.json`）：
  - 酒紅綁帶套裝選淡藍主色，輸出「light blue burgundy lace-up cropped cardigan」；不指定色時也輸出「purple burgundy …」。
  - Spider-Man 套裝輸出「neon green Spider-Man cosplay bodysuit … vivid red-and-blue color blocking」。
- 這違反 B 規範 §6.1 第 159 行「套裝不寫死主色」。

#### P3：選項 ID、顯示名、分類都依賴字串與列序，規則寫死在 engine.js【嚴重度：中高】

- **ID 依列序和顯示名產生**：`id = stableId || slug(displayZh):rowIndex`（engine.js:3294）。顯示名由 `stripLeadingColorWords` 的硬寫 regex 決定（engine.js:2603），所以 md 中文名、UI 顯示名、ID 三者可能不同。例如 md「酒紅綁帶針織寬牛仔」在 UI 顯示為「套裝：綁帶針織寬牛仔」，但「白蕾絲泡袖七分褲」「粉紅哥德兔耳吊帶束身」的顏色前綴沒有被去掉。只要改這個 regex 或插入一列，ID 就會變。
- **family 靠關鍵字、先中先贏**（engine.js:1655），並且影響場景過濾（engine.js:4776）。目前出現不一致：
  - 「女僕風荷葉比基尼」被判成 lingerie 而不是 swimwear；
  - 「棉質低腰三角褲」是 lingerie，「蕾絲丁字褲」卻是 neutral；
  - 「皮革馬甲束腰」套裝被判成 lingerie。
  - 證據見 `wardrobe_runtime_family.out.json`。
- **新增 metadata 欄位要改 engine**：每種新欄位都得加進 engine.js:3333-3342 的白名單。
- **名稱硬寫**：118 條中文名以字串常數寫在程式碼裡，例如「街頭風格金項鏈」在 engine.js 出現 4 次。

#### P4：撰寫規範與實際資料、較新規格互相矛盾【嚴重度：中】

- 外套長度：B 規範 §10.1 第 329 行要求 6-20 詞，但 `outerwear-catalog-v1.md` 已改為只保留款式（例如「knit cardigan」2 詞），結果 7 條外套低於下限。
- 套裝：上限 32 詞，實際 40.7% 超過，中位 28、最高 94。
- 外套穿法：上限 14 詞，實際 5/7 超過。
- B 規範第 9 行引用 `/Users/cooperfu/Desktop/Virtual_Photography_Studio/...` 的絕對路徑，**該檔不存在**，repo 現在位於 ~/Projects。
- 標頭寫「Last updated: 2026-10-06」，但第 3 行已有 10-11 的內容；§5–§9 還夾著大量逐日修訂與驗證紀錄（例如第 169-173 行），規範逐漸變成變更日誌。

#### P5：Schema 不一致【嚴重度：中】

- metadata 有 3 種合併路徑，有的進 `meta`、有的進頂層（sync_to_json.py:120 對比 :233）。
- 套裝是唯一沒有「全無」列的子類。
- 套裝 metadata 有 27/59 是空物件。
- engine 推論出的 wardrobe tag，光 8 個主要服裝控制項就有 748 個；非測試程式碼只用到 3 種，其餘是死資料。
- `DEPRECATED_GPT_SINGLE_WARDROBE_COMPACTOR`（engine.js:12261）全檔只出現在定義處，沒有被呼叫。這屬於 engine 範圍，順帶記錄。

#### P6：命名不一致與錯字【嚴重度：低】

- 「項鍊」16 條對「項鏈」2 條（「多條層疊的金項鏈」md:508、「街頭風格金項鏈」md:522）；「腰鍊」4 條對「腰鏈」2 條（「銀色水鑽蝴蝶腰鏈」md:543、「垂墜背心腰鏈短裙」md:134）。同一子類用字不一。
- 「丹寧」5 條對「牛仔」31 條。
- 中文欄混用英文：「leggings」（md:268，整個中文名是英文）、「球衣 / 運動 jersey」（md:181）。
- 11 條套裝名稱以顏色開頭（例如白色哥德圖示包臀迷你裙），違反 B 規範 §6.1 第 154 行「名稱指向服裝類型」，而且和 colorMode 主色控制語意衝突。
- 特殊穿搭 87/90 以「造型」結尾，另有 2 條以「套裝」、1 條以「裙裝」結尾。

### 3B. 可能問題或待 Cooper 判斷（涉及品味、風格取向、商業取捨）

#### Q1：近似重複

- 「柔和過膝絲襪」對「俐落過膝絲襪」（md:342-343）：英文只差 `smooth` 與 `sleek`，生成時幾乎無法區分。
- Dr. Martens 5 款（md:408-412）：B 規範 §10.3 要求「不為同一鞋型新增過多近似款」。
- 「皮質扣環頸鏈」對「皮革 O 環頸圈」：desc 自己寫了「和既有扣環頸鏈區隔」。
- 圖案：17 個名稱在上身、下身、外套三個圖案子類重複出現 2 到 3 次（例如「滿版龐克塗鴉印花」），英文只有目標片語不同。這是刻意的分目標設計，但改一個圖案要改 2 到 3 處。

#### Q2：人物、身體或主觀描述混進穿搭

- md:154 亮面膠帶束帶套裝含「compressed skin with soft flesh bulges and slight spillover」（身體描述）。這句被測試鎖定，應是已核准的。
- md:307 緞面短裙含 `sensual`。
- 26 條特殊穿搭寫了髮型、髮色或刺青。依 current_project_state.md:773/781，這是核准設計，會被移到人物句，但做法是 engine 切字串。
- 泛化形容詞 128 處，其中 delicate 42、polished 29。

#### Q3：分佈失衡（啟發式結果）

- 韓系明確訊號為 0，但 B 規範主線是日韓。
- 冷季服裝少：特殊穿搭冷 8 對暖 41；沒有 puffer、raincoat、gown、jumpsuit、hanbok。
- 高暴露比例：特殊穿搭 33/90、套裝 24/59。
- 沒有包包、手部飾品、手錶等可組合子類：包包只出現在 43 條特殊穿搭與 12 條套裝的完整造型裡；手鍊、戒指只在特殊穿搭與套裝中出現。
- 以上是否要補，屬於商業與品味決策。

#### Q4：IP 與品牌名稱

- Spider-Man、Venom、Spider-Gwen 三款 cosplay（md:155-157）、Metallica、Gucci，以及 9 款品牌型號鞋。B 規範 §5 第 125 行寫「避免品牌名稱過多」，是否符合要由 Cooper 判斷。

#### Q5：主 MJ 短名表沒有強制覆蓋

- 測試只檢查表內 ID 存在（midjourneyNaturalPrompt.test.js:131），不檢查新條目必須有短名。缺名稱時會悄悄改用自動抽取（midjourneyNaturalPrompt.js:65）。
- 另外，「馬甲束腰」的 MJ 名稱寫死 `black`（midjourneyItemNames.js:288）。

#### Q6：歷史負擔

- 4 款 retired 外套佔外套列的 18%。
- 特殊穿搭 61/90 以「coordinated … styling」泛用尾句結束，B 規範第 9 行要求檢討這類尾句是否有效。

---

## 4. 可維護性：新增一條穿搭要改幾處

依 B 規範 §15、sync 腳本的強制檢查、git 共變紀錄整理：

| 新增類型 | 必改（不改會被 sync 或測試擋下） | 應改（不改會悄悄劣化） |
| --- | --- | --- |
| 一般單品（上身、褲、裙、鞋、配件） | ① md 尾端追加列（插在中間會讓後續 ID 位移）② 執行 sync 產生 database.json | ③ midjourneyItemNames.js 短名（缺了就 fallback）④ 上身要審 `topUnderbust.baseEn`（item_metadata.json）⑤ 外套要補 `outerwear` 結構與 stableId ⑥ family／location 相容靠關鍵字，可能要改 engine.js:1655 ⑦ 頭部配件分類在 `engine/accessoryPolicy.js` ⑧ 測試與 fixtures |
| 套裝 | ① md ② **outfit_preset_metadata.json**（即使是 `{}`）③ **manifest＋source PNG＋preview AVIF** ④ sync | ⑤ colorMode／colorTargets（否則觸發 P2）⑥ embeddedOuterwear ⑦ engine 的 control regex（若沿用控制語寫法）⑧ fixtures 與 baseline JSON（baseline 內含 ID） |
| 特殊穿搭 | ① md ② manifest＋兩份圖 ③ sync ④ `engineSpecialOutfitCleanup.test.js` 數量期待 | ⑤ 髮型、刺青片語能否被 engine 正確切到人物句 |
| 改名或合併 | 上述全部，加上 `stableId`／`legacyIds`／`legacyPromptAliases`／`legacyLabels`，以及 engine.js legacy map | Saved Cards 回填測試 |

最小路徑也要動 2 個檔（md、database.json）；套裝或特殊穿搭至少 5 到 6 個；實務上中位數是 7 個檔，且 63% 的資料 commit 需要同時改 engine.js。

---

## 5. 建議（只列選項，不做定案）

| # | 建議 | 影響 | 工作量 | 說明與選項 |
| --- | --- | --- | --- | --- |
| R1 | **把套裝與連身的控制語移出 en，改用 metadata `colorTargets` 表達** | 高 | 中 | 解決 P1。66 條要改字，engine 27 行 regex 可逐步退場。依 AGENTS.md 屬 prompt 行為變更，需走「先補 fixture → 同 seed 前後比對 → strict audit」。也要改掉 `engineOutfitPresetDressCleanup.test.js:155` 這個反向契約。可先用本資料夾的 leak probe 做回歸。 |
| R2 | **為固定色套裝明確標記色彩策略** | 高 | 小 | 解決 P2，有三個選項待 Cooper 決定：(a) 新增 `colorMode: "fixed"`，略過主色注入；(b) 去色，回歸可配色的寫法；(c) 只允許 contrast 或 locked 色。涉及 12 條（md:138-146、155-157）。 |
| R3 | **新增穿搭資料 lint 腳本**（例如 `scripts/check_wardrobe_catalog.mjs`，接進 test） | 中 | 小 | 檢查項：各子類字數區間、控制語與禁用詞、命名用字（鍊／鏈）、新 ID 必須有 MJ 短名、套裝必須有 colorMode 或 fixed、metadata 欄位必須在白名單內。可直接以本資料夾的 `wardrobe_analyze.mjs` 為基礎。 |
| R4 | **改用資料驅動分類**：在 metadata 明確標 family、exposure、season、occasion，取代 engine 的關鍵字推論，並刪除沒人用的推論 tag | 高 | 大 | 解決 P3、P5，並讓 Q3 的分佈可以量測。要分階段做，並保留現有輸出不變的 fixture。 |
| R5 | **修訂 B 規範** | 中 | 小 | 改正外套與套裝字數區間，使其與 outerwear-catalog-v1 及實際資料一致；修正第 9 行的失效路徑；把逐日修訂移到 decisions 或 changelog；補上圖案、眼鏡配色的字數規範（目前 not_stated）。 |
| R6 | 統一命名用字（鍊／鏈、丹寧／牛仔、英文中文名） | 低 | 小 | **注意**：ID 由顯示名產生，改名前必須先加 `stableId` 與 `legacyLabels`，否則會讓收藏失效。 |
| R7 | 圖案改成單一來源，再加目標片語 | 中 | 中 | 解決 Q1 的三份重複；需要遷移 3 個子類的 ID。 |
| R8 | 覆蓋度補強選項（韓系、冷季、包包或手部配件子類、合併近似款） | 中 | 中 | 屬品味與商業決策，**由 Cooper 決定**是否要做。可先跑 §1.3 的啟發式分佈當基準。 |

---

## 6. 查不到（not_stated）

- B 規範沒有定義圖案三類、眼鏡配色、眼鏡配戴方式的英文字數區間：not_stated。
- 套裝為何不設「全無」列：資料與規範都沒寫原因（engine 以 `OUTFIT_PRESET_NONE_OPTION` 補上），not_stated。
- 9 條時尚套裝（md:138-146）寫死顏色、沒有 colorMode，是刻意設計還是遺漏：查不到決策紀錄，not_stated。
- 季節、場合、性感程度：資料沒有這些欄位，只能用啟發式估計，正式分佈為 not_stated。
- 主 MJ 對特殊穿搭與套裝如何命名：不在 `midjourneyItemNames.js`，本次未追到對應規則，not_stated。

## 7. 證據索引（簡）

- 控制語：md:100、md:104、md:236；engine.js:11434、12061-12063、12284-12300；B 規範:159；current_project_state.md:993；`wardrobe_control_leak_*.out.json`
- 固定色衝突：md:144、md:155；engine.js:9026-9040；`wardrobe_preset_color_probe.out.json`
- ID 與顯示名：engine.js:2603、3294；metadata 白名單 engine.js:3333-3342
- family：engine.js:1655、4776；`wardrobe_runtime_family.out.json`
- 未使用的推論 tag：engine.js:2240-2272；`wardrobe_tag_usage.sh`
- sync 合併差異：scripts/sync_to_json.py:120、158、233
- MJ：midjourneyItemNames.js:288；midjourneyNaturalPrompt.js:65；midjourneyNaturalPrompt.test.js:131
- 規範矛盾：B 規範:9、:79-85、:329；Docs/specs/outerwear-catalog-v1.md「來源責任」段
