# 資料庫分析主張獨立複核（C1–C11）

- 複核基準：HEAD `60b6489`（主要），並以 `git archive 0d5c990 webapp/src` 解到 `verify/old/` 對照重跑。
- 方法：只讀 repo；所有腳本在本資料夾（`c*.mjs` 跑 HEAD，`oldrun/c*.mjs` 跑 0d5c990）；全部用 `createSeededRandom(seed)` 經 `generatePrompts(..., { random })` 重現。
- 0d5c990 → 60b6489 差異：只新增 `nanoBananaPrompt` 輸出（engine.js +119 行，頂端 import 多 2 行，行號小幅位移）。`database.json`、`knowledge_base/`、`characterProfiles.js`、`duoOptions.js`、`page3WorldScene.js` 沒有變動（`git diff --stat` 為空）。兩個 commit 在 C1–C11 的既有輸出逐字相同（新舊輸出 diff 為 identical）。差別只在新的 `nanoBananaPrompt`，下面逐條另外註明。
- 行號一律以 HEAD 為準。

## 總表

| # | 判定 | 重點 |
|---|---|---|
| C1 | CONFIRMED | 卡片 GPT／GPT 胸上／全身照沒有年齡或成年字樣（0/99）；Z、MJ 為 99/99 |
| C2 | CONFIRMED（另有補充） | Natsuki 和 Miku 的 skinSignature 逐字相同；Rika 和 Yuri 也逐字相同 |
| C3 | PARTIAL | 66 條數字正確；GPT 確實外洩，Z 只有 6 個套裝外洩，連身在 Z 為 0 |
| C4 | CONFIRMED | 實跑得到 `light blue burgundy lace-up cropped cardigan`（GPT/Z/NB） |
| C5 | CONFIRMED | 倫敦排屋被標成 subterranean，環境光只剩 4 種；small 命中 mall 誤標 17 個場景 |
| C6 | CONFIRMED | 純白幕隨機抽到日光／窗光類 75/200；漸層、多色塊不在棚光清單 |
| C7 | PARTIAL | 只在手動鎖定兩種「攝影棚」環境光時出現；隨機 0/280 |
| C8 | CONFIRMED（路徑修正） | 實際路徑為 `webapp/src/lib/page3WorldScene.js:355-356`；胸上輸出 30/30 |
| C9 | PARTIAL（措辭） | engine.js:3393 有載入並建成 `flatCatalog.negative`，但沒有任何使用者；輸出 0/100 |
| C10 | CONFIRMED | 1050 條中 37 條有 stableId；不存在的 ID 會靜默變成「全無」，不發警告 |
| C11 | CONFIRMED | duoPoseId=`shoulder-lean` 遷移到時尚雜誌；duoInteractionId 路徑則遷移到好朋友自拍 |

## C1 角色卡缺少成年身份句 — CONFIRMED
- 腳本：`c1b.mjs`（33 張卡 × 3 seeds，n=99）、`c1c.mjs`（一般單人 n=60）、`c1d.mjs`（Nano Banana）。
- 角色卡結果（命中 adult / woman / year-old）：

| 輸出 | adult | woman | year-old |
|---|---|---|---|
| gpt | 0 | 0 | 0 |
| chest-up-portrait | 0 | 0 | 0 |
| full-body-character | 0 | 0 | 0 |
| z | 99 | 99 | 99 |
| mj | 99 | 99 | 99 |
| chest-up-mj-portrait | 0 | 99 | 99 |
| nanoBananaPrompt（僅 HEAD） | 99 | — | — |

- 第一次用寬鬆 regex 時，`aged wooden`、`cozy-girl proportions` 也被命中，屬於誤報，已經排除。
- Z 開頭範例：「A 20-year-old adult East Asian woman, ...」。
- 原因：
  - engine.js:11917-11926（另一處在 11949）的 GPT 角色卡區塊只輸出結構化欄位。
  - compact 路徑在 engine.js:5048 以 `^a\s+20-year-old\s+adult…woman` 保留成年開頭；11298 有同類寫法。
  - HEAD 新增的 Nano Banana 也自行抽取了 adultIdentity。
- 對照組：一般單人 GPT 60/60 含「one 20-year-old Japanese or Korean female portrait subject」（engine.js:153），但沒有字面上的「adult」（0/60）。

## C2 Natsuki 和 Miku 的 skinSignature — CONFIRMED，另有補充
- `engine/characterProfiles.js:775` 與 `:855` 都是 `fair neutral skin with a clean luminous finish`。
- facialGeometry 高度相似，但並非逐字相同：
  - `:772`：「soft compact oval face, gently rounded cheeks, a smooth tapered jaw and a neat rounded chin」
  - `:852`：「compact soft oval face, gently rounded cheeks, a narrow smooth jaw and a neat rounded chin」
- 補充：33 張卡的 skinSignature 只有 31 種，**Rika 和 Yuri** 也逐字相同（`luminous fair skin with a smooth natural finish`）。facial、eye、nose、mouth 四個欄位沒有逐字重複。

## C3 `controlled by` 控制語外洩 — PARTIAL
- 數字（python 讀 database.json）：套裝 42 條加連身 24 條，**共 66 條**，主張正確。整個 database 共出現 80 次。
- 實跑 `c3.mjs` / `c3b.mjs`：逐一鎖定選項，各跑 3 seeds × 2 種構圖（預設、全身）。

| 鎖定項目 | 有外洩的選項數 |
|---|---|
| 套裝（UI 83 項）× GPT | 34 |
| 套裝 × Z | 6（內衣寫真、女僕、女僕風荷葉比基尼、粉紅哥德兔耳吊帶束身、米白緞面蕾絲馬甲短裙、哥德圖示包臀迷你裙） |
| 套裝 × MJ | 0 |
| 連身 24 項 × GPT（及胸上、全身照） | 24/24（144/144 runs） |
| 連身 × Z | 0 |
| 連身 × MJ | 0 |

- 範例：「main fabric color controlled by dress color selection」、「trim controlled by outfit contrast color」。
- 截斷殘片 `dominant suit.` 確實存在：西裝長褲與秘書短裙兩個套裝會出現在 GPT、Z 與胸上輸出。
  - 來源：md:104-105 的 `dominant suit color controlled by…`。
  - engine.js:12297 的白名單只涵蓋 fabric/uniform/textile/leather，其他泛用規則（例如 :12410）只刪掉「color controlled by…」，留下「dominant suit」。
- HEAD 的 nanoBananaPrompt 同樣有外洩：套裝 34 項、連身 24 項；`dominant suit.` 出現 5 runs。
- 主張中「Z 也外洩」的部分過度概括：只有 6 個套裝會外洩，連身在 Z 不會。

## C4 寫死顏色的套裝與主色矛盾 — CONFIRMED
- `c4.mjs`：鎖定套裝「綁帶針織寬牛仔」（md:144），套裝配色或主色選「淡藍色」。GPT 與 Z 都出現「She wears light blue burgundy lace-up cropped cardigan」。
- Spider-Man（md:155）出現「light blue Spider-Man cosplay bodysuit … vivid red-and-blue color blocking」。
- MJ 會把顏色字剝掉，所以沒有矛盾。HEAD 的 nanoBananaPrompt 也出現「light blue burgundy」。
- 掃描（`c4b.mjs`，套裝 59 項，鎖淡藍色）：至少 4 個套裝出現「淡藍 + 寫死色」相鄰，包含白蕾絲泡袖七分褲、西裝外套蕾絲迷你洋裝、綁帶針織寬牛仔、運動外套荷葉七分褲。這個 regex 只抓相鄰顏色字，是下限。
- 不鎖定、預設隨機配色時也會發生，例如「dark grey white lace puff-sleeve…」。

## C5 子字串比對造成誤標 — CONFIRMED
- `hasAny` 用 `includes` 比對：engine.js:1583（主張寫 1581，位移 2 行）。
- 「戶外：倫敦排屋街道」的 desc 含「地下室窗格」，命中 engine.js:1770 的 `'地下'`，tags 變成 `urban,outdoor,heritage,subterranean`。
  - 可選環境光只剩 **4 種**：清晨薄霧、雨天陰濕、雨後反光、雪地冷光。這是全部場景中的最小值，其他多數場景有 15 種以上。
- engine.js:1738 的 `'mall'` 命中英文「small」：**17 個場景**僅因 small 被標成 commercial（沒有 mall 這個字，也沒有其他商業關鍵字），例如臥室窗邊、更衣室、清澈海灣岩岸、草地與樹木。
- 腳本：`c5.mjs`、`c5b.mjs`。

## C6 攝影棚搭配窗光／日光，兩個棚不在清單 — CONFIRMED
- `c6.mjs`：所有攝影棚的可選環境光都包含「室內窗邊日光」「室內午後柔亮日光」等室內日光類。
- 「漸層打光背景」與「多色塊撞色背景」沒有 `solid_color_studio` / `studio_lighting_scene` tag，可選 15 種，少了「高調純白攝影棚」「柔霧美妝攝影棚」「舞台演出燈光」。
  - 清單位於 engine.js:1775-1797，兩者不在其中。
- `c6b.mjs`：鎖定場景、環境光隨機，各 200 次，抽到日光／天光／窗光／餘光／滲入類的次數：

| 場景 | 次數（/200） |
|---|---|
| 純潔白幕 | 75 |
| 漸層 | 93 |
| 多色塊 | 93 |
| 鏡面地板 | 81 |

## C7 車站／車廂固定組含 `no background structure specified` — PARTIAL
- 字串來源是環境光資料，不是 engine.js:4736：database.json:5203 / :5208（camera_and_lighting.md:99-100），也就是「高調純白攝影棚」「柔霧美妝攝影棚」。
- engine.js:4736 的 `transitManualLighting` 讓車站／車廂可選全部環境光，因此可以手動選到這兩種。
- `c7.mjs`：14 個固定組 × 20 seeds 隨機，**0/280** 命中。
- `c7b.mjs`：手動鎖定上述兩種光時，6 個車站／車廂組在 GPT 主輸出與 chest-up-portrait 中為 5/5（HEAD 的 nanoBananaPrompt 也是 5/5）；Z / MJ 為 0。其他 8 個固定組為 0。
- 結論：條件式成立，必須手動鎖定這兩種攝影棚光才會出現。

## C8 PAGE3 匯入控制語進入胸上輸出 — CONFIRMED，路徑修正
- 實際檔案是 `webapp/src/lib/page3WorldScene.js:355-356`，不是 features/page3。匯入流程在 `App.jsx:229-247`。
- `c8b.mjs`：設定相機／拍攝／焦段／成像／環境光後匯入，跑 30 seeds：

| 輸出 | PAGE3 camera and environment layer | real-place guards |
|---|---|---|
| chest-up-portrait | 30/30 | 30/30 |
| GPT 主輸出 | 8/30 | 8/30 |
| nanoBanana（僅 HEAD） | 8/30 | 8/30 |
| Z | — | 8/30 |
| MJ | — | 8/30 |
| chest-up-mj | — | 30/30 |

- `c8.mjs`（10 個地點，相機欄位選到無 en 的選項）：guards 在 chest-up-portrait 為 20/20，camera layer 為 0，因為沒有 cameraCues。

## C9 Negative 分類未被使用 — PARTIAL（措辭）
- engine.js:3393 有 `negative: buildEntries('negative', mergedDatabase.Negative …)`，資料確實有被載入。
- 但 repo 內沒有任何程式讀取 `flatCatalog.negative`。`CUSTOM_GROUP_OPTIONS`（engine.js:1462）也不含 Negative。
- `c9.mjs`：100 個隨機 prompt 中，Negative 的 19 條 en 從未逐字出現（0/100）。
- Python 端使用者：`scripts/prompt_generator.py:51`、`scripts/sync_to_json.py:29`。
- 結論：實質上是死資料，但說「完全沒有被讀取」不精確。

## C10 ID 由標籤與列序產生，失配時靜默變成「全無」 — CONFIRMED
- engine.js:3296：`id: item.stableId || \`${group}:${slug(category)}:${slug(displayZh)}:${index}\``。
- database.json 共 1050 條，**37 條**有 stableId（來源 knowledge_base/item_metadata.json 的 37 條）。
- engine.js:3893-3903：先比對 legacyIds，找不到就改成 `全無`，沒有任何警告。
- `c10.mjs` 實測：
  - 列序位移的 location ID 變成 `…:全無:0`，`console.warn` 沒有被呼叫。
  - 標籤改名、列序相同的 topId 也變成「全無」。

## C11 `shoulder-lean` 雙重歸屬 — CONFIRMED
- `engine/duoOptions.js:61`（fashion-editorial-models）與 `:81`（best-friends-selfie）都把 `shoulder-lean` 列為 legacyId；`leaning-shoulders` 也在 :62 / :82 重複。
- `c11.mjs`：
  - `normalizeLocks({duoPoseId:'shoulder-lean'})` 得到 `fashion-editorial-models`，因為 find 取第一個。
  - `duoInteractionId:'shoulder-lean'` 經 engine.js:3521 得到 `best-friends-selfie`。
  - 兩條路徑結論不一致。`leaning-shoulders` 也一樣，會落到 fashion-editorial-models。

## 新舊 commit 對照
`c1b`、`c1c`、`c3b`、`c4`、`c5b`、`c6b`、`c9`、`c10`、`c11` 在 0d5c990 與 60b6489 的輸出完全相同。`c7b` 與 `c8b` 只多了 nanoBananaPrompt 的命中（見 C7、C8）。60b6489 新增的 `nanoBananaPrompt` 會繼承 C3、C4、C7、C8 的問題，但不受 C1 影響：它有成年身份句。
