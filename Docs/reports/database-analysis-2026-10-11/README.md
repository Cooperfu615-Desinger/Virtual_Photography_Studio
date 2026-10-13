# 資料庫完整分析報告

- 日期：2026-10-11
- 基準版本：分析在 `main` @ `0d5c990` 進行；獨立複核在 `60b6489` 重跑，既有輸出逐字相同（見 §1.3）。工作區只有 `Docs/` 下的修改，以及未追蹤的參考資料夾。
- 性質：唯讀分析。除了本報告資料夾與 decisions 紀錄，沒有修改 repo 的任何資料或程式。
- 分區細節：見 [partitions/](partitions/)。重現腳本：見 [tools/](tools/)。

> 判定標記
>
> - **【確定】**：有資料或實跑證據，且違反現行規格、AGENTS.md 契約或內部一致性。
> - **【待判斷】**：屬於品味、產品方向或商業取捨，只列選項，由 Cooper 決定。
> - **【複核：…】**：第 1 節的獨立複核結果。
> - 查不到的事實標 `not_stated`。

---

## 0. 一頁結論

**整體評價：輸入管線紀律好，內容量厚。主要風險有兩類：一是「公開 Prompt 正確性」的漏洞，二是「資料語意寫死在程式裡」的結構負債。**

1. **優點。**
   - Markdown → JSON 的轉換是確定性的，CI 有 `--check`。
   - manifest 依名稱比對，缺漏時直接失敗。
   - 硬寫參照目前 0 懸空。
   - 1,050 條基礎目錄的 zh、en、desc 覆蓋率 100%。
   - 33 張角色卡的結構化欄位全數填滿。
   - 多數子類符合撰寫指南的字數與責任邊界。
2. **最急的問題：會直接進入公開 Prompt、影響出圖。**
   - 角色卡在 GPT 系三組輸出缺少成年身份句。
   - 套裝和連身的 `controlled by …` 控制語外洩。
   - 運輸類固定構圖、PAGE3 匯入時的控制語外洩。
   - 固定色套裝被疊上主色。
   - 場景 tag 以子字串誤判，導致可選光線被錯誤限縮。
   - 攝影棚、地下場景可以搭配窗光或日光，違反 C 規範 §8。
3. **最大的結構負債。**
   - 96.5% 的條目 ID 由「中文標籤＋列序」組成，改名或重排就會讓存檔失效，而且失效時靜默退回「全無」。
   - 2,291 個相容 tags 全部由程式從文字推論，資料裡沒有任何顯式 tag。
   - 相同資料散落多處，例如角色卡資料存在 4 個地方。
4. **建議順序。**
   - Phase 0：先補「不改輸出」的檢查網，包括完整性腳本進 CI、tags 快照、文件校正。
   - Phase 1：修正公開 Prompt 的確定問題。每項都是 Prompt 契約變更，需要你逐項核准。
   - Phase 2：償還結構負債，包括凍結 stableId、把 tag 資料化、集中 legacy 對照。
   - Phase 3：依你的取捨擴充內容覆蓋。

---

## 1. 範圍與方法

### 1.1 「資料庫」的範圍

| 類型 | 位置 | 規模 |
| --- | --- | --- |
| 基礎目錄（canonical） | `knowledge_base/*.md`，經 `scripts/sync_to_json.py` 產生 `webapp/src/data/database.json` | 6 個分區、56 個分類、1,050 條；Wardrobe 539、CameraLighting 172、Locations 155、Character 139、Regional 26、Negative 19 |
| 外掛 metadata 與 manifest | `knowledge_base/item_metadata.json`、`outfit_preset_metadata.json`、`wardrobe_reference_manifest.json`、`character_reference_manifest.json` | 單品 metadata 132 條、套裝 59 條、服裝參考圖 173 張、角色卡 33 張 |
| 內嵌在程式的目錄 | `webapp/src/lib/engine/` 下的 `characterProfiles.js`、`poseComposerOptions.js`、`duoOptions.js`、`fixedCompositionOptions.js`、`ambientLightDescriptions.js`、`midjourneyItemNames.js` 等 11 檔 | 5,304 行、926 個匯出條目 |
| 其他工作區資料 | `webapp/src/data/page3WorldScenes.js`、`actionPoseCards.js`、`observationCapturePromptOptions.js` | PAGE3 共 57 個地點，動作姿勢卡 3 張 |
| 執行期推論 | `engine.js` 的 `infer*Meta`，約 900 行 | 785 個選項、2,291 個 tags |

### 1.2 方法

- 分成四個分區，並行做唯讀分析：
  - 穿搭
  - 人物、角色卡、姿勢
  - 場景、光線、攝影、風格、負面提示
  - 跨分區的結構與管線
- 所有數字都由實際執行的腳本算出，共 48 支，見 [tools/](tools/)。
- 涉及輸出的主張，都直接呼叫 `generatePrompts()` 並用固定 seed 實跑。
- 既有檢查的結果：
  - `python3 scripts/sync_to_json.py --check`：通過
  - `python3 scripts/check_public_assets.py`：通過，206 檔、2.9 MB
  - `python3 -m unittest discover -s scripts/tests`：2 tests OK
- 最高風險的 11 項主張，另由一位未參與分析的 agent 獨立實跑複核，結果見 §1.3。

### 1.3 獨立複核結果

複核員重跑時，HEAD 已前進到 `60b6489`（新增 Nano Banana 2.1 prompts），所以它以新 HEAD 實跑，並和 `0d5c990` 對照。兩個版本的既有輸出逐字相同，差別只在新增的 `nanoBananaPrompt`：它承襲了 A2、A4、A7 與 PAGE3 外洩問題，但有成年身份句。完整紀錄見 [verification.md](verification.md)。

| # | 主張 | 判定 | 修正或補充 |
| --- | --- | --- | --- |
| C1 | 角色卡 GPT 系輸出缺成年身份 | CONFIRMED | GPT、GPT 胸上、全身角色照 0/99；Z 與 MJ 99/99。一般單人 GPT 有「20-year-old female」，但沒有 `adult` 字樣 |
| C2 | Natsuki 與 Miku 膚質逐字相同 | CONFIRMED | 另發現 Rika 與 Yuri 的膚質也逐字相同；33 張卡只有 31 種膚質描述 |
| C3 | 套裝與連身控制語外洩 | PARTIAL | 66 條數字正確。GPT 外洩：套裝 34/83 個、連身 24/24 個；Z 外洩：套裝 6 個、連身 0 個；「dominant suit.」屬實 |
| C4 | 固定色套裝疊上主色 | CONFIRMED | 鎖淡藍時至少 4/59 個套裝受影響，GPT 與 Z 都有；隨機配色時也會發生 |
| C5 | 場景 tag 用子字串誤標 | CONFIRMED | `small`→`mall` 誤標的是 **17** 個場景，不是 49 個 |
| C6 | 攝影棚可搭窗光或日光 | CONFIRMED | 純白幕隨機 200 次中 75 次；漸層、多色塊兩棚各 93/200 |
| C7 | 運輸類固定構圖洩漏控制語 | PARTIAL | 隨機 0/280；只有**手動鎖定**兩種「攝影棚」環境光時才出現（6 組 GPT 與胸上都是 5/5）。字串來源是環境光資料本身（`database.json:5203/5208`） |
| C8 | PAGE3 匯入時洩漏控制語 | CONFIRMED | 胸上 GPT 版 30/30、GPT 主輸出 8/30；路徑是 `webapp/src/lib/page3WorldScene.js:355-356` |
| C9 | Negative 沒被讀取 | PARTIAL | 有被載入成 `flatCatalog.negative`，但沒有任何程式讀取，輸出 0/100。結論仍是死資料 |
| C10 | ID 由標籤與列序產生、失配時靜默變全無 | CONFIRMED | 37/1,050 條有 stableId |
| C11 | `shoulder-lean` 遷移歧義 | CONFIRMED | `leaning-shoulders` 也同樣重複 |

---

## 2. 資料庫全貌（關鍵數字）

| 指標 | 數值 |
| --- | --- |
| 必備欄位覆蓋（zh、en、desc） | 100%，非「全無」列沒有空值 |
| 有 `stableId` 的條目 | 37 / 1,050（3.5%），其餘 1,013 條依列序產生 ID |
| 硬寫參照懸空數 | 0：目錄 ID 448 個、targetZh 242 個、MJ 名稱或身形 key 325 個 |
| 執行期 tags | 785 個選項帶 2,291 個 tags，database.json 中顯式 tag 為 0 |
| engine.js 內的資料表 | 81 張、2,362 行（佔全檔 14.1%）；其中 legacy 表 21 張、535 行 |
| Pose Composer | 271 個選項中 114 個 uiHidden（42%）；接觸／支撐層 78 個中有 58 個不可見（74%） |
| 穿搭英文字數 | 中位 16、最多 94；有規範的 456 條中 56 條超過上限，套裝佔 24/59 |
| 場景分佈 | 城市 57、生活室內 39、廢墟 27、棚 14、自然 12、其他 5；隨機抽中比例城市 35.6%、自然 8.4% |
| 參考圖覆蓋 | 穿搭 24 個子類中只有 3 個有圖（特殊穿搭、套裝、連身），共 173 張 |
| 資料與程式的耦合 | 近兩個月改穿搭 Markdown 的 41 次 commit 中，26 次也改了 engine.js；118 個中文單品名以字串常數寫在程式裡 |

---

## 3. 優點

1. **管線確定、出錯就擋。**
   - Markdown 是單向來源，`--check` 在 CI 執行（`.github/workflows/deploy.yml:31`）。
   - manifest 依名稱比對，缺漏、重複、多餘都會失敗（`scripts/sync_to_json.py:158-230`）。
2. **目前參照完整。** 硬寫 ID、targetZh、MJ 名稱表、參考圖、角色卡圖片都 0 懸空；MJ 名稱表對單品子類覆蓋 100%。
3. **相容紀律成熟。**
   - 1,457 個 legacyIds，加上專用 migration 函式，都有測試把關。
   - 內嵌 overlay 綁定 ID＋原文，對不上就擋下（例如 `ambientLightDescriptions.test.js:21`）。
4. **格式乾淨，責任邊界大致清楚。**
   - 英文欄位沒有中文、色碼或雙空格。
   - 光線表現 31/31 只描述人物受光；環境光 36/36 不含實體光源。
   - 鏡頭 12/12 以 `shot on` 開頭，攝影風格 26/26 以 `Inspired by` 開頭。
   - 戶外對稱禁用語命中 0。
5. **角色卡結構化完整。**
   - 8 個結構化欄位都是 33/33。
   - 每張卡都正好 4 個永久錨點，且沒有用可替換的造型詞。
   - 實跑時 GPT、Z、AI 對錨點的逐字保留率是 99/99。
6. **文字層級的重複很低。** 場景去掉純色棚模板後，cos≥0.8 的對數是 0；光線、風格、鏡頭的最高相似度都低於 0.4。
7. **內容量厚，而且逐步走向結構化。**
   - 特殊穿搭 90 套都有參考圖。
   - 外套 22/22 有結構欄位，上身 39/45 有 `topUnderbust`，套裝 23 條有 `colorTargets`。
8. **執行期效能有設計。** 預設 runtime 只編譯一次並深度凍結（`runtimeCache.js:58-75`）。

---

## 4. 問題（依影響排序）

### A. 公開 Prompt 正確性：直接影響出圖，最優先

| # | 問題 | 證據 | 分區 |
| --- | --- | --- | --- |
| A1 | **【確定】角色卡在 GPT 主輸出、GPT 胸上、全身角色照中沒有年齡、adult 或 woman 字樣。** 同條件下 Z 與 MJ 都有；一般單人的 GPT 有「20-year-old female」。原因是 GPT 角色卡區塊只輸出結構化欄位，而 8 個結構化欄位都不含年齡。這與 AGENTS.md「保留成年身份」的要求不一致。 | 複核實跑 0/99；`engine.js:11912-11924` 對照 `:5048` | 人物 |
| A2 | **【確定】`controlled by …` 控制語寫在資料裡，並外洩到公開 prompt。** 66 條套裝或連身的 en 含這段文字，engine 再用 27 行 regex 事後清除，但清不乾淨。複核結果：GPT 有 34/83 個套裝外洩，Z 有 6 個套裝外洩，還有「dominant suit.」這種截斷殘片。連身 24 款的 GPT 全都含「main fabric color controlled by dress color selection」。另外，測試 `engineOutfitPresetDressCleanup.test.js:155` 反過來要求資料必須含這段控制語。 | md:100、:104、:236；`engine.js:12284-12300` | 穿搭 |
| A3 | **【確定】其他控制語外洩。** 運輸類固定構圖在**手動鎖定**兩種攝影棚環境光時，GPT 與胸上輸出含「no background structure specified」「without generating a stage venue」（隨機時不會發生）。PAGE3 匯入時，「PAGE3 camera and environment layer」「real-place guards」等字樣進入胸上 GPT 輸出（30/30）與 GPT 主輸出（8/30）。角色卡的「bare feet as the locked footwear state」進入 GPT 與 Z。 | `database.json:5203/5208`、`engine.js:4736`；`webapp/src/lib/page3WorldScene.js:355-356`；`characterProfiles.js:157` | 場景、人物 |
| A4 | **【確定】寫死顏色的套裝被疊上主色。** 12 條套裝寫死了多個顏色，卻沒有 `colorMode`。實跑輸出「light blue burgundy lace-up cropped cardigan」，Spider-Man 套裝也變成「neon green … bodysuit」。這違反 B 規範「套裝不寫死主色」。 | md:138-146、:155-157；`engine.js:9026-9040` | 穿搭 |
| A5 | **【確定】場景 tag 用子字串比對，造成誤標。** `hasAny` 用的是 `includes`。實例：「倫敦排屋街道」因 desc 的「地下室」被標成地下，只剩 4 種環境光，晴天、黃昏、夜景全被排除；英文 `small` 命中 `mall`，17 個場景被誤標成商業類（複核數字）；「VCR decks」命中 `deck`，被標成戶外。 | `engine.js:1581`、`:1733`、`:1736`、`:1768` | 場景 |
| A6 | **【確定】相容規則有漏洞，違反 C 規範 §8。** 全部 14 個攝影棚都可以搭 7 種窗光或日光，隨機模擬中佔 42.6%；地下場景可以搭窗光或黃昏光，佔 35%；漸層、多色塊兩個棚沒有列進棚光清單。另外，非運輸類固定構圖的 UI 列出 36 種環境光，但其中 21 種鎖定後會被默默換掉。 | `engine.js:4474-4537`、`:1772-1795` | 場景 |
| A7 | **【確定】角色卡的攝影方向混入場景。** 17/33 張卡的 photographicDirection 寫了場景或光線，例如 Nana 的 `school-corridor`、Seulgi 的 `neon nightclub`。使用者選海灘時，GPT 輸出兩者並存；Z 與 AI 已經會移除這段。 | `characterProfiles.js:348`、`:501` | 人物 |

### B. 資料架構：結構負債

| # | 問題 | 證據 |
| --- | --- | --- |
| B1 | **【確定】ID 綁定中文標籤與列序。** ID 格式是 `${group}:${slug(category)}:${slug(zh)}:${rowIndex}`。改名、插入、重排都會改變 ID，而 ID 會存進 Saved Cards 與 lock。未知 ID 會靜默變成「全無」，不會報錯。撰寫指引只能要求「優先 append」來避開。 | `engine.js:3294`、`:3897`；重排證據 `engine.js:2685` |
| B2 | **【確定】語意 tags 是隱藏 schema。** 室內／戶外、夜景、family、商業等相容判斷，全由程式從 zh、en、desc 文字推論。desc 在 UI 上看不到，卻是推論的輸入，改一句中文備註就可能靜默改變相容矩陣。新增一個光線表現若不改 engine，可用場景數是 0。 | `engine.js:1579`、`:1680-2600` |
| B3 | **【確定】單一真相來源分散。** 11 個模組、5,304 行內嵌目錄。角色卡資料存在 4 處，wardrobeLayers 134 段中有 122 段逐字重複、12 段不一致。MJ 投影資料存在 3 處。圖案在上身、下身、外套三個子類各存一份。PAGE1 與 PAGE3 約 13 個地點各自維護。 | 見 [structure.md](partitions/structure.md) §2 |
| B4 | **【確定】legacy 對照分散，而且失敗時靜默。** 舊對照分散在 KB JSON 與 engine.js 的 21 張表；7 處找不到目標時直接 `return`，沒有測試逐條檢查。舊值 `shoulder-lean` 同時屬於兩個雙人選項，兩條遷移路徑的結論互相矛盾。 | `engine.js:3195-3270`；`duoOptions.js:61/81` 對照 `engine.js:3519` |
| B5 | **【確定】資料語意寫死在程式裡。** 環境光、光線表現、攝影風格的 zh 標籤 100% 以字面值寫在 engine.js；穿搭 family 用關鍵字推論、先命中者勝出，因此出現「女僕風荷葉比基尼」被判成 lingerie 這類錯判。新增 metadata 欄位也必須同時改 engine.js 的白名單。 | `engine.js:1655`、`:3333-3342` |

### C. 內容品質與覆蓋

| # | 問題 | 證據 |
| --- | --- | --- |
| C1 | **【確定】Natsuki 與 Miku 幾乎是同一張臉。** 五官整體 cosine 0.757（第二名只有 0.579），其中臉型 0.94、膚質逐字相同。複核另外發現 Rika 與 Yuri 的膚質也逐字相同。這一組不在必測對比清單，現有測試只用 `notEqual` 比字串。 | `characterProfiles.js:772/852`、`:776/856`；`characterCardLab.test.js:152` |
| C2 | **【確定】字數超過規範。** 套裝 40.7% 超過 32 詞上限，最長 94 詞；外套穿法 5/7 超標；腰部配件 5/10 超標。另有 4 個場景超標且查不到專屬規格。 | [wardrobe.md](partitions/wardrobe.md) §1.2；[scene-lighting.md](partitions/scene-lighting.md) §1.1 |
| C3 | **【確定】姿勢說明缺漏，且有死選項。** 公開姿勢選項中有 101 筆沒有 desc；接觸層有 6 個選項沒標 uiHidden，卻在所有基底都被隱藏；站、跪、蹲完全沒有公開的接觸選項。 | `poseComposerOptions.js:1199`、`:1236` |
| C4 | **【確定】名實不符。** 6 種髮型名稱帶「濕」，en 卻沒有濕感；「霧感森林步道」的內容沒有霧；X100V 被標成「單眼」；`單手托下巴` 對應兩個 ID；用字不一，例如項鍊／項鏈、腰鍊／腰鏈。 | `character_design.md:41/46/49`；`poseComposerOptions.js:1081` |
| C5 | **【確定】有不可達或沒有作用的資料。** 艾爾莎・布萊達風格在隨機模式中永遠抽不到；7 個 `*_bias` 分支永遠不會觸發；Negative 19 條在 webapp 有被載入，但沒有任何程式讀取，自 3 月建立後沒改過；自訂 library overlay 在正式 UI 走不到。 | `engine.js:4761-4769`、`:3391` |
| C6 | **【待判斷】分佈失衡。** 理論姿勢組合中坐姿佔 57%；自然場景 12 條，隨機只抽中 8.4%；19 個地點家族佔場景的 43%；沒有春秋光線，也沒有雪景、神社、便利商店、機場等場景；地域集中在日本與英國；穿搭沒有韓系訊號，冷季服裝少，沒有包包或手部配件子類；角色身份集中在白皙、橢圓或心形臉，32/33 為東亞。 | 各分區報告 |
| C7 | **【待判斷】跨欄位語意衝突沒有規則。** 黑白風格配到彩色成像的比例是 93.8%；季節不符，例如雪地冷光配向日葵花田；場景內建時段與環境光衝突，例如夜間派對配日光；攝影風格的 en 混入光線與快門字詞（16/26），且 `STYLE_PROMPT_INTROS` 與 en 串接後產生重複字句。 | [scene-lighting.md](partitions/scene-lighting.md) §4 |

### D. 文件與檢查落後

- **【確定】撰寫規範與實際資料脫節。**
  - B 規範：列出不存在的常數名、引用已失效的 Desktop 路徑、字數區間與 outerwear-catalog-v1 矛盾，而且逐漸變成變更日誌。
  - A 規範：只列 10 張角色卡（實際 33 張），髮型、表情清單也過期。
  - 臉部身份規格的「新增卡片」流程，漏了 `engine.js` 的 `CHARACTER_PROFILE_CONTROL_ORDER`。沒加進這張排序表的新卡，會被靜默過濾、不出現。
  - C 規範寫「143 個場景」，實際是 154。
  - D 規範對 `filmId` 的描述與現況不符。
  - engine-architecture 的 bundling 說明已過期。
- **【確定】資料層測試薄弱。**
  - Python 端只有 2 個測試。
  - 沒有通用的 legacy target 存在性測試、legacyId 歧義測試、tags 快照或角色卡多檔一致性測試。
  - `scripts/tests/prompt_audit.test.mjs` 沒有任何執行入口。

---

## 5. 優化方向（建議路線）

影響與工作量是分析員的估計。凡是改變公開 Prompt 的項目，依 AGENTS.md 都要走以下流程：先補 fixture，同 seed 前後比對，跑 strict audit，最後做瀏覽器驗收。

### Phase 0：建立檢查網，不改變任何輸出（建議先做）

| # | 項目 | 影響 / 工作量 | 解決 |
| --- | --- | --- | --- |
| P0-1 | 把 `tools/analyze_database_catalog.mjs` 收進 `scripts/`，並在 CI 以 `--strict` 執行；匯出 legacy 表，讓測試檢查 target 是否存在 | 高 / 小 | B1、B4 的防護網 |
| P0-2 | tags 快照測試：把每個 ID 編譯後的 tags 存成 baseline，改 en 或 desc 造成 tag 變動時測試會明確失敗 | 高 / 小 | B2 的防護網，也是 A5 修正前的基準 |
| P0-3 | 穿搭資料 lint：檢查字數區間、控制語與禁用詞、用字統一、新 ID 必須有 MJ 短名、套裝必須有 colorMode | 中 / 小 | A2、A4、C2 的防再犯 |
| P0-4 | 校正 A、B、C、D 規範、臉部身份規格與 engine-architecture（修改 `Docs/` 既有檔案前先建 `.bak`） | 中 / 小 | D |

### Phase 1：修正公開 Prompt 的確定問題（每項都需你核准）

| # | 項目 | 影響 / 工作量 | 解決 |
| --- | --- | --- | --- |
| P1-1 | 在角色卡 GPT 區塊補回成年身份開頭句，重用 `engine.js:5045` 現成的抽取邏輯 | 高 / 小 | A1 |
| P1-2 | 把套裝、連身的控制語移出 en，改由 metadata `colorTargets` 表達，再讓 27 行清除用的 regex 逐步退場，同時改掉反向契約測試 | 高 / 中 | A2 |
| P1-3 | 清除運輸類固定構圖、PAGE3 匯入、`locked footwear state` 的控制語 | 高 / 中 | A3 |
| P1-4 | tag 推論改成字詞邊界比對，`地下` 排除 `地下室`；先補倫敦排屋、榻榻米、CRT 的 fixture | 高 / 小 | A5 |
| P1-5 | 補相容規則：攝影棚擋窗光與日光、地下擋窗光、漸層與多色塊兩棚加入棚光清單；固定構圖的 UI 只列實際生效的環境光 | 高 / 中 | A6 |
| P1-6 | 固定色套裝的色彩策略（三選一，見 §6） | 高 / 小 | A4 |
| P1-7 | 角色卡攝影方向中的場景字詞：GPT 比照 Z 與 AI 移除，或改放到「建議場景」metadata | 中 / 小 | A7 |

### Phase 2：償還結構負債

| # | 項目 | 影響 / 工作量 | 解決 |
| --- | --- | --- | --- |
| P2-1 | 把現行 1,013 個位置 ID 原樣凍結成 stableId。存檔 ID 不會有任何變動，之後就能安全改名與重排。此項碰到相容面，需要你核准 | 高 / 中 | B1 |
| P2-2 | 把相容 tags（室內外、時段、天氣、季節、family、暴露度）改成資料欄位，用 P0-2 的快照保證遷移前後結果一致 | 高 / 大 | B2、B5、C6 的量測基礎 |
| P2-3 | 把 21 張 legacy 表集中到一個資料檔，並決定 `shoulder-lean` 的正確去向 | 中 / 中 | B4 |
| P2-4 | 角色卡改為單一來源：wardrobeLayers 與 MJ 卡名由 profile 衍生，或加一致性測試；Natsuki/Miku 等相似組改用相似度門檻測試 | 中 / 中 | B3、C1 |
| P2-5 | 清理退役選項：uiHidden 和已退役的選項移到獨立的 legacy 陣列，resolver 保留；6 個死選項補標記 | 低-中 / 小 | C3 |

### Phase 3：內容擴充與品味調整（依你的方向）

內容方面的建議：

- 補覆蓋缺口：春秋光線、雪景、神社、自然類、韓系穿搭、冷季穿搭、包包或手部配件子類。
- 補 101 筆姿勢 desc。
- 重寫 Natsuki 與 Miku 的差異描述，需要對照參考圖。
- 收斂攝影風格的跨欄字詞，並去掉 `STYLE_PROMPT_INTROS` 造成的重複。
- 設計黑白、季節、時段的軟性相容規則：只影響隨機，手動鎖定照舊。

---

## 6. 待 Cooper 判斷清單

| # | 決策 | 選項 |
| --- | --- | --- |
| J1 | 固定色套裝（12 條）的處理 | (a) 新增 `colorMode: "fixed"`，略過主色注入；(b) 去色，改回可配色的寫法；(c) 只允許 contrast 色或鎖定色 |
| J2 | 角色卡攝影方向中的場景字詞 | (a) GPT 有選場景時移除；(b) 改放到「建議場景」欄位；(c) 維持現狀 |
| J3 | Negative 分區（19 條） | (a) 從 webapp catalog 移除；(b) 標註只供 Python 舊腳本使用；(c) 重寫並接到 MJ `--no`（屬新功能） |
| J4 | 艾爾莎・布萊達風格在隨機模式不可達 | (a) 讓它可達；(b) 移除 7 個死 bias 分支；(c) 維持現狀 |
| J5 | 相容規則只在隨機時生效（98 個選項） | (a) 手動組合時給非阻擋提示；(b) 改成硬性停用；(c) 維持現狀 |
| J6 | 隨機分佈 | 改成「先抽地點家族，再抽細分」，或調整子類權重；坐姿在理論組合佔 57%，是否要平衡 |
| J7 | 覆蓋擴充的方向與數量 | 地域、季節、韓系、身份多樣性、包包與手部配件 |
| J8 | 名實不符的相容名稱 | 6 種帶「濕」的髮型：改名並補 legacy 對照、隱藏，或維持現狀 |
| J9 | 學院風、童趣、youthful 類描述與成年身份並存 | 保留，或依 A 規範「可愛但不幼態」改寫 |
| J10 | 品牌與 IP 名稱 | Spider-Man、Venom、Metallica、Gucci、9 款品牌鞋：保留或泛化 |
| J11 | GPT 中的 `Permanent identity anchors:`、`Character Profile Card: 37_Hina` 標籤 | 是否視為控制語外洩 |
| J12 | 雙人 `shoulder-lean` 舊值的正確去向 | 導向「時尚雜誌雙人」，或導向「好朋友之間的親密自拍」 |
| J13 | 首屏載入引擎與目錄約 359 KB（gzip） | 是否改成非 PAGE1 工作區延遲載入 |

---

## 7. 限制與 not_stated

- 沒有呼叫任何外部生圖模型。各項問題對實際出圖的影響程度：not_stated。
- 33 張角色卡的文字是否忠實對應參考圖：沒有比對影像，not_stated。
- 舊 ID 在使用者 Firestore 或 localStorage 中的實際分佈：無法唯讀取得，not_stated。
- 季節、場合、暴露度、地域的分佈是用關鍵字啟發式估計，資料本身沒有這些欄位，只能當趨勢參考。
- 隨機比例來自固定 seed 的抽樣（2,000–4,000 次）；相容矩陣則是全空間實測。
- 部分固定色套裝、固定構圖換值行為是刻意設計還是遺漏：查不到決策紀錄，not_stated。

---

## 8. 附件索引

- [partitions/structure.md](partitions/structure.md)：結構、ID、SSOT、legacy、管線、執行期
- [partitions/wardrobe.md](partitions/wardrobe.md)：穿搭 24 個子類
- [partitions/character-pose.md](partitions/character-pose.md)：人物、角色卡、Pose Composer、雙人
- [partitions/scene-lighting.md](partitions/scene-lighting.md)：場景、光線、攝影成像、風格、Negative、PAGE3
- `partitions/out_*.md`：人物分區的中間輸出
- [tools/](tools/)：48 支唯讀分析腳本，各腳本的用法見檔頭註解，或各分區報告的「重現」段落。
  - 腳本內寫死 repo 絕對路徑 `/Users/cooperfu/Projects/Virtual_Photography_Studio`。
  - 原本的輸出位置在 session scratchpad；重跑時請以參數或重新導向，指定 repo 外的輸出路徑。
  - `wardrobe_*.mjs` 需要在 `webapp/` 目錄下執行。
  - `analyze_database_catalog.mjs` 需要先在 `webapp/` 執行過 `npm ci`。
- 獨立複核紀錄：[verification.md](verification.md)；複核腳本在 `tools/verify/`，其中 `oldrun/` 為 `0d5c990` 版
