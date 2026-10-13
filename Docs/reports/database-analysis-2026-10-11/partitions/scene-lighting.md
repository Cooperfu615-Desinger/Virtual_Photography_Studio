# 資料品質分析：場景／光線／攝影成像／風格／負面提示

- 分析日期：2026-10-11（唯讀，未修改 repo；`git status` 與分析前相同）
- 範圍：`Locations`（6 子類）、`CameraLighting`（10 子類）、`Regional`（攝影風格）、`Negative`；相關 engine 模組、PAGE3 世界場景、Observation Capture 選項。
- 評估標準：`Docs/specs/scene-section-c-authoring-guide.md`（下稱 C 規範）、`Docs/specs/photography-section-d-authoring-guide.md`（下稱 D 規範）。
- 資料同步狀態：`python3 scripts/sync_to_json.py --check` → `Database check passed`（Markdown 與 `database.json` 一致，Locations 155、CameraLighting 172、Regional 26、Negative 19）。
- 所有數字都由下方第 10 節列出的腳本實際算出。隨機模擬用固定 seed（20261011，另以 seed 7 複核）。

分級說明：
- **確定問題**：與規範、程式意圖或資料本身直接矛盾，可以重現。
- **可能問題／待 Cooper 判斷**：牽涉品味、風格取向、產品取捨，或要看設計意圖才能定性。

---

## 0. 關鍵數字

| 指標 | 數值 | 來源 |
| --- | --- | --- |
| 場景條目（不含全無） | 154；室內 81／戶外 68／其他 5 | stats.mjs |
| 子類最大與最小 | 城市與社群感 57 vs 其他專屬 5、自然與戶外 12 | stats.mjs |
| 隨機模式下各子類抽中比例 | 城市 35.6%、生活室內 25.2%、廢墟 18.1%、棚 9.6%、自然 8.4%、其他 3.0% | catshare.mjs（N=2000） |
| 同一地點拆成多條的「地點家族」 | 19 個家族共 66 條（占 154 的 43%） | similarity.mjs |
| 有明確地域的場景 | 70／154（日本 23、英國 17、香港 7、美國 7、上海 5、義大利 4、法國 3、韓國 2、台灣 1、奧地利 1）；無地域 84 | region.mjs |
| 場景×環境光 合法組合 | 2,505 對；場景×環境光×光線表現 55,868 組 | compat.mjs |
| 環境光／光線表現 zh 標籤寫死在 engine.js | 36/36、31/31 | hardcode.mjs |
| 攝影風格在隨機模式從未被抽中 | 艾爾莎・布萊達（2×2000 次 0 次） | randsim.mjs |
| 黑白攝影風格同時抽到彩色成像 | 333/355（93.8%） | conflictsim.mjs（N=3000） |

---

## 1. 量化總表

### 1.1 數量與 en 字數（不含「全無」）

| 子類 | 條數 | en 字數 min／中位／max | 規範上限 | 超標 |
| --- | --- | --- | --- | --- |
| 攝影棚與背景 | 14 | 18／53／72 | 一般 35、純色棚 55 | CRT 電視牆 54、多色塊撞色 72 |
| 生活感室內 | 39 | 12／23／30 | 35 | 0 |
| 地下與廢墟 | 27 | 19／23／29 | 35 | 0 |
| 城市與社群感 | 57 | 15／21／92 | 35 | 澀谷站前 92、車廂正面 39、車廂坐滿 38、目黑川 36 |
| 自然與戶外 | 12 | 20／22／25 | 35 | 0 |
| 其他專屬 | 5 | 20／26／30 | 30 | 0 |
| 景別構圖 | 10 | 7／9／40 | 18 | 頭部主導近景 40 |
| 相機視角 | 10 | 7／8／10 | 18 | 0 |
| 拍攝方位 | 8 | 7／7／11 | 18 | 0 |
| 鏡頭焦段 | 12 | 19／22／23 | 24 | 0 |
| 光圈／景深 | 5 | 14／16／18 | 22 | 0 |
| 快門／動態殘影 | 6 | 14／16／17 | 24 | 0 |
| 環境光條件 | 36 | 12／16／19 | 24 | 0 |
| 光線表現 | 31 | 12／16／22 | 24 | 0 |
| 底片與相機模擬 | 25 | 15／19／24 | 24 | 0 |
| 光學效果 | 19 | 16／19／27 | 26 | 前景遮擋散景 27 |
| 攝影風格 | 26 | 18／21／25 | 26 | 0 |
| Negative（6 子類） | 19 | 8–15 | — | — |

超標項目中，有些已有獨立規格核准：澀谷（`shibuya-station-crowds-v1.md`）、車廂（`japanese-carriage-fixed-composition-v1.md`）、頭部主導近景（`head-dominant-framing-v1.md`）。查不到專屬規格的超標：CRT 電視牆（54 字，`locations_and_sets.md:21`）、多色塊撞色背景（72 字，`:22`）、目黑川（36 字，`:103`）、前景遮擋散景（27 字）。

### 1.2 室內／戶外與子類交錯（stats.mjs `locPrefix`）

| 子類 | 室內 | 戶外 | 其他 |
| --- | --- | --- | --- |
| 生活感室內 | 34 | **5** | 0 |
| 地下與廢墟 | 21 | **6** | 0 |
| 城市與社群感 | **12** | 45 | 0 |
| 自然與戶外 | 0 | 12 | 0 |

子類名稱跟實際的室內外屬性不一致。例如「生活感室內」裡有 `戶外：日本住宅陽台曬衣架旁`、`戶外：日式旅館緣側木廊`；「城市」裡有 `戶外：奧地利 Hallstatt 湖畔山村觀景欄杆`、`戶外：飯店度假村泳池露台`。

### 1.3 環境光與光線表現覆蓋

- 環境光 36 條：戶外 18、室內 15、棚／舞台 3。
- 時段：清晨 2、白天 9、黃昏／藍調 2、夜 3（城市夜間、月光、城市高彩度）。
- 天氣：雨相關 3、雨前 2、霧 1、雪 1、陰 2。
- 季節：夏 2（夏日積雲、正午）、冬 2（雪地、冬季灰冷）。**春、秋 0。**
- 光線表現 31 條：方向／硬度 8、反差 4、色溫 6、投影／反射／局部 7、經典主光 6。

### 1.4 場景類型缺口（關鍵字掃描 154 條，命中 0）

便利商店、機場、美術館／博物館、神社／寺廟（「廟街」是街名，不算）、瀑布、雪地場景、秋景／楓葉、稻田、KTV、電影院、夜市。

- C 規範 §5 表格寫生活感室內包含「便利空間」，但資料裡沒有。
- `inferLocationMeta` 的關鍵字清單有 `'night market', '夜市'`（`engine.js:1736`），資料裡沒有對應條目。
- 環境光有 `雪地冷光`，但沒有任何雪景場景。

### 1.5 相容矩陣（compat.mjs，以 engine 匯出的 `getSceneDependentOptions` 實測）

- 每個場景可用的環境光數：多數室內 15、多數戶外 16–18。極端值是 `戶外：倫敦排屋街道` 只有 **4**（見 C1）。
- 棚光 3 條（高調純白、柔霧美妝、舞台）只能搭 12 個場景。
- 光線表現在 55,868 組三元組中的使用量：最少是 `硬質晴光`、`斑駁樹影光`（各 421），最多是 6 款經典主光（各 2,505，全開）。

### 1.6 近似重複（similarity.mjs；以 TF-IDF cosine 計算 en 相似度）

- 場景（排除 12 條純色棚模板，142 條、10,011 對）：cos≥0.8 有 0 對，0.6–0.8 有 3 對。
  - 0.677 `戶外：金色海灘與浪線` ↔ `其他：沙灘海岸線`
  - 0.666 `高樓建築骨架裸露混凝土地板` ↔ `高樓建築骨架開放樓層邊緣`
  - 0.611 `電車車廂側面走道視角` ↔ `電車車廂坐滿與站滿乘客`
  - 0.52 `興記煲仔飯店內桌椅區` ↔ `興記煲仔飯店門口騎樓區`
  - 0.49 `新宿歌舞伎町濕地反光角落` ↔ `蘇荷區濕地反光街角`
  - 0.408 `日式和室` ↔ `其他：生活感日式榻榻米房間`
- 純色棚模板 12 條：66 對中 57 對落在 0.4–0.6，屬刻意共用模板。
- 環境光最高 0.519（`城市夜間混合光` ↔ `城市高彩度夜色`）；光線表現最高 0.343；底片最高 0.565（`高階黑白灰階` ↔ `Leica 風格鹽粒黑白`）；攝影風格最高 0.394（南・戈爾丁 ↔ 荒木經惟）。
- 結論：**文字層級的重複很低**。真正的「重複」在於地點家族：法租界 5 條；木造圖書館、洗衣店、廢棄水泥工廠、廢棄醫療、廢棄校舍、廢棄商場、高樓骨架、九龍城寨、歌舞伎町、蘇荷區、羅馬老城各 4 條。

---

## 2. 優點（附證據）

1. **規範遵循度高。** guiderules.mjs 逐條檢核的結果：
   - 光線表現 31/31 都落在人物受光字詞上，沒有混入天空或場景字詞。
   - 鏡頭 12/12 以 `shot on` 開頭。
   - 攝影風格 26/26 以 `Inspired by` 開頭，字數都在 14–26。
   - 構圖、視角、方位 28 條中，情緒詞 0。
   - 其他專屬 5/5 含 `ground plane/surface/scene base`，且不超過 30 字。
   - 戶外 68 條的對稱禁用語（`tree-lined`、`both sides` 等）命中 0。
   - 環境光 36 條中，人物受光字詞 0、實體光源字詞 0（stats.mjs `ambSubject`=0）。
2. **Markdown 是單一來源，同步工具有檢查機制。** `sync_to_json.py --check` 會驗證 JSON 不是過期產物，目前通過。
3. **文字層級幾乎沒有近似重複**（見 1.6）。光線表現、攝影風格、光學效果、鏡頭的最高 cos 都低於 0.4。
4. **作者 overlay 有 source pin，失效時會擋下（fail closed）。**
   - `ambientLightDescriptions.js` 的 36 條和 `zImageSceneDetailPriority.js` 的 45 條都綁定 ID 加原文。
   - 測試 `ambientLightDescriptions.test.js:21`、`zImageSceneDetailPriority.test.js:29` 會驗證數量與原文一致；catalog 被改動時測試會失敗，不會把錯的 overlay 默默套上去。
5. **一般單人主輸出沒有洩漏棚光的控制語。** leak.mjs 實測：`高調純白攝影棚`、`舞台演出燈光` 搭純色棚時，GPT／Z／MJ 都沒有出現 `no background structure specified`（被 overlay 改寫掉了）。
6. **中英欄位完整。** 所有分區 en 都不含 CJK、desc 沒有空值；場景的 zh、en 都沒有完全重複（stats.mjs `cjkInEn`/`emptyDesc`/`dupLoc*` 都是 0）。
7. **場景×光線組合空間大，攝影器材層次完整。**
   - 合法組合 2,505 對、55,868 三元組。
   - 鏡頭從 20mm 到 135mm，另有 Macro、Fisheye、Tilt-Shift、Anamorphic；光圈 5 段、快門 6 種；光學效果 19 種，分類清楚。

---

## 3. 確定問題

### C1. 場景 tag 用子字串推斷，產生錯誤標籤，直接限制可選光線

`hasAny` 用的是 `text.includes(keyword)`（`engine.js:1581`）。`inferLocationMeta` 拿 zh、en、desc 整段做關鍵字比對（`engine.js:1714-1800`），所以會誤命中。tagfp.mjs 掃到的實例：

- `戶外：倫敦排屋街道`：desc 的「地下室窗格」命中 `'地下'`（`engine.js:1768`），被加上 `subterranean`。結果只剩 4 種環境光可選（`清晨薄霧／雨天陰濕／雨後反光／雪地冷光`），**所有晴天、黃昏、夜間都被排除**。（`locations_and_sets.md:130`）
- 英文的 `small` 命中 `'mall'`（`engine.js:1736`），讓 49 個場景被標成 `commercial`。其中至少這些是誤標：`室內：臥室窗邊`、`室內：女高生房間`、`戶外：清澈海灣岩岸`、`戶外：草地與樹木`、`其他：生活感日式榻榻米房間`。
- `室內：CRT 電視牆攝影棚` 的「VCR decks」命中 `'deck'`（`engine.js:1733`），被標成 `outdoor`。
- `戶外：台北西門町街頭` 的「parking」命中 `'park'`，被加上 `green_space`。
- 有 9 個 `戶外：` 場景同時帶 `indoor` tag，3 個 `室內：` 場景同時帶 `outdoor` tag。目前靠 zh 前綴保護室內外判斷，但 `locationSupportsLighting` 的支援表和 `styleFitsLocation` 都直接讀 tags。

### C2. 艾爾莎・布萊達風格在隨機模式不可達

- 這個風格的 tag 是 `night_bias`（`engine.js:1709`）。
- `styleFitsLocation` 要求場景必須帶 `night`、`underground` 或 `club`（`engine.js:4768`），但 `inferLocationMeta` 從來不產生這三個 tag（compat.json 統計的全部場景 tag 集合裡沒有）。
- 隨機模式又不會抽到「全無」場景，所以 2 個 seed 各 2,000 次都是 0 次（randsim.mjs）。
- 同樣的死分支：`studio_bias`、`set_bias`、`indoor_bias`、`urban_bias`、`natural_bias`、`heritage_bias`、`outdoor_bias`（`engine.js:4761-4769`），`inferStyleMeta` 沒有任何風格產生這些 tag。

### C3. 純色棚的 studio tag 清單漏了 2 個新棚

- `室內：漸層打光背景`、`室內：多色塊撞色背景` 沒有列進 `solid_color_studio/studio_lighting_scene` 的硬寫清單（`engine.js:1772-1795`）。清單裡反而還留著已不存在的舊 en `'infinite white background'` 等。
- 結果是這 2 個棚不能選 3 種棚光，卻可以選 `室內窗邊日光`（compat.json）。

### C4. 攝影棚可以搭窗光或日光，違反 C 規範 §8

- C 規範 §8 寫明「攝影棚環境不應搭配自然窗光」。
- 實際上全部 14 個棚場景都允許 `室內窗邊日光`、`室內陰雨昏暗天光`、`室內黃昏微暖餘光` 等 7 種日光、窗光類環境光（compat.json）。
- 隨機模擬中，棚場景有 123/289（42.6%）配到這類環境光，例如 `純綠背景 × 室內午後柔亮日光`（conflictsim.mjs）。
- 根因：`locationSupportsLighting` 只擋 studio_light 進廢墟，沒有反向擋窗光進棚（`engine.js:4474-4537`）。

### C5. 地下場景可以搭日光、窗光類環境光

- C 規範 §8 寫明地下場景「不應搭配乾淨天空、純日間」。
- 實際上 `室內：地下狂歡俱樂部 / 金庫`、`地下排洪道` 3 條、`地下月台` 都可選 `室內窗邊日光`、`室內黃昏微暖餘光`。
- 隨機模擬中有 39/111（35%），例如 `地下排洪道積水牆角 × 室內黃昏微暖餘光`。
- 根因：地下限制只擋 `!lightTags.has('indoor')` 的日光（`engine.js:4499` 附近），室內窗光被放行。

### C6. 固定構圖的環境光 UI 與輸出不一致；車站／車廂組會洩漏控制語

- **非運輸類 8 組**（例如 `高級飯店落地窗都市夜景`）：UI 列出 36 種環境光，但鎖定其中 21 種（戶外或棚）後，輸出會被默默換成同一個值（seed 9 時都變成 `室內陰雨昏暗天光`，fixedsets3.mjs）。使用者以為選了 `正午烈日`，實際沒有生效。
- **運輸類 6 組**：`transitManualLighting` 讓所有環境光直接放行（`engine.js:4734,4743`），而且不走 overlay。
  - `紐約地鐵無人長椅月台 × 高調純白攝影棚` 的 GPT 主輸出含「no background structure specified」。
  - `電車車廂正面長椅視角 × 舞台演出燈光` 的 GPT 主輸出含「without generating a stage venue」。
  - 兩者都違反 AGENTS.md「不得把內部控制語洩漏到公開 prompt」（fixedsets2.mjs）。
  - 這兩段原文在 `camera_and_lighting.md:99-101`。

### C7. PAGE3 匯入 PAGE1 時，把控制語帶進公開 prompt

`buildPage1WorldSceneArchitecture` 組出的文字（`page3WorldScene.js:351-358`）含以下片語：

- `PAGE3 camera and environment layer:`
- `real-place guards adapted for the background:`
- `do not let the world scene cancel the person…`
- 開頭的 `world-scene architecture for the portrait:`、`the portrait subject remains the main subject…`

實測（page3leak.mjs，西門町）：

- GPT、Z、MJ 主輸出都含開頭那兩句 meta 語句。
- `chest-up-portrait` 含上面列出的全部 7 組控制語。

### C8. 規範文件與現況不一致

- C 規範 `:328` 寫「現有 143 個場景」，實際是 154。
- C 規範 `:125`、`:147` 說其他專屬包含「沙發、水面、雪地」，實際是 草地／白色床鋪／榻榻米／樹下草地／沙灘海岸線。
- D 規範 `:43-44`、`:192`、`:324-334` 說相機 profile 合併在 `filmId`，UI 名稱是「相機 / 底片」。實際上 `filmId` 的 label 是「成像模擬 / 調色」，26 個選項中相機 profile 0 個；`cameraSystemId` 已是 hidden 的舊控制（`engine.js:1085`、`:8220-8225`）。
- D 規範 §9 列的成像 rendering 只有 13 種，資料有 25 種（例如 `Y2K CCD`、6 種「日系…濾鏡」、`跨沖霓虹剪影濾鏡` 未列）。
- D 規範 §9 寫「不用相機品牌做 label 核心」，但有 `Leica 風格鹽粒黑白`（`camera_and_lighting.md:141`）。

### C9. Negative 分區在 webapp 是死資料

- 19 條會被 `buildEntries('negative', …)` 建成 catalog（`engine.js:3391`），也有 `inferNegativeMeta`（`:2574`）。但 `webapp/src` 沒有任何地方讀 `catalog.negative`。
- `CUSTOM_GROUP_OPTIONS` 不含 Negative（`engine.js:1460-1466`）；MJ 參數尾端沒有 `--no`。
- 唯一使用者是舊 Python 腳本 `scripts/prompt_generator.py:180-265`。
- `negative_prompts.md` 最後一次變更是 2026-03-08 初始 commit。

---

## 4. 可能問題／待 Cooper 判斷

- **P1. 子類失衡與地點家族（品味與產品取捨）。**
  - 自然 12 條、其他 5 條，在隨機模式只占 8.4% 和 3.0%；城市占 35.6%。
  - 43% 的場景是同一地點的細分（例如洗衣店 4 條、法租界 5 條），隨機時會讓這些地點的出現權重變高。
  - 是否改成「先抽家族、再抽細分」或調整權重，需要 Cooper 決定。
- **P2. 場景名稱或 en 內建時段、天氣，與可選環境光衝突。**
  - `室內：夜間家庭派對` 的 en 以 `nighttime` 開頭（`locations_and_sets.md:25`），卻允許 `室內窗邊日光`、`室內清晨冷白日光`。
  - `戶外：蘇荷區招牌下` 的 en 含 `neon sign structure`，可搭 `正午烈日`。
  - `戶外：雨後 mews 巷弄` 的名稱寫雨後，也可搭晴天。
  - 隨機模擬中，夜間場景配到日光類的比例是 16/40。
  - `戶外：霧感森林步道` 名稱有「霧感」，但 en 和 desc 都沒有霧，名稱與內容不符（`:152`）。
- **P3. 季節衝突。**
  - `雪地冷光`、`冬季灰冷` 可以搭 `向日葵花田`、`金色海灘`、`泳池露台`、`目黑川櫻花`，隨機模擬中 10/93。
  - 依現行規則這些組合都合法，是否要加季節 tag 待定。
- **P4. 黑白與彩色的跨欄衝突沒有任何相容規則。**
  - 黑白攝影風格（森山大道、細江英公、莎莉・曼）配到彩色成像：333/355（93.8%）。例如 `細江英公 × 日系雜誌高彩銳利`。
  - 黑白成像配到色溫或色光類光線：47/224（21%）。例如 `Leica 風格鹽粒黑白 × 混合色溫光`。
  - 程式裡只有 `opticalEffectSupportsFilm`，沒有 style↔film 或 film↔light 的規則。
- **P5. 攝影風格的責任混雜。**
  - 16/26 條風格的 en 含光線字詞，2 條含快門字詞（regional.mjs）。例如保羅・羅韋爾西含「dim romantic light…slow-shutter delicacy」，會跟 `高調亮光`、`1/1000s` 同時出現。
  - 另有 `STYLE_PROMPT_INTROS`（`engine.js:8232-8259`）以 zh 標籤為 key，存了第二份風格描述，並且跟 en 串接。實際輸出會出現「soft haze editorial image language. soft haze couture portraiture」這種前後重複（leak2.mjs）。
  - 10 條風格含主觀詞（cinematic、romantic、intimate、moody…）。D 規範允許描述 image language，是否收斂待定。
- **P6. 成像 rendering 越界到其他欄位。**
  - `Y2K CCD 低清快照` 含「on-camera flash glare」（光線）。
  - `復古 CCD 晃動快照` 含「heavy motion smear」（快門）。
  - `VHS` 含「chromatic aberration」（光學效果）。
  - 位置在 `camera_and_lighting.md:151-152`。
- **P7. 場景 en 含否定句或守門語。**
  - 21 個場景含 `no wall corner…`、`as a physical object`、`isolated subject` 等。在 GPT 主輸出與 chest-up GPT 中 21/21 會出現，在 MJ 中約 16 條（guardphrases.mjs）。
  - C 規範 §5.2 明文要求純色棚寫這些排除語，所以目前屬合規；但它和「保持正向描述」的總則有張力。
  - `城市夜間混合光` 的 `if visible` 會進到 MJ 與 chest-up MJ（mjleak.mjs，36 條環境光中只有這 1 條）。
- **P8. 地域偏重。** 有地域的 70 條中，日本與英國合計 40 條（57%）；台灣 1、韓國 2；東南亞、中東、拉美、非洲、北歐都是 0。是否擴充屬產品方向。

---

## 5. Negative prompts

- **是否使用**：webapp 不使用（C9）。PAGE1 的 GPT／Z／MJ 三個輸出都沒有 negative 欄位，MJ 也沒有 `--no`。
- **是否過時**：
  - 自建立後未改。
  - 內容是 SD 時代的寫法（`worst quality, lowres, ugly, disgusting`）。
  - 部分與現行選項衝突：`過度修圖防護` 含 `artificial lighting`，`自然派防護` 含 `flash`、`studio light`，會跟光線表現的 `機頂直閃`、棚光互相打架；`2D 插畫防護` 含 `monochrome painting`。
- 另外，`actionPoseCards.js` 的 `negativePoseGuard` 是另一套「否定語」機制，與本分區無關。

---

## 6. 平行資料：PAGE1 Locations、PAGE3、Observation、固定構圖

| 資料集 | 位置 | 規模 | 與 PAGE1 共用 |
| --- | --- | --- | --- |
| PAGE1 Locations | database.json | 154 | — |
| PAGE3 世界地點 | `page3WorldScenes.js` | 50（10 城 × 5）＋特殊 7 | 只共用攝影師風格（`page3WorldScene.js:154-157`） |
| PAGE3 環境光／相機／焦段／成像 | `page3WorldScene.js:48-112` | 10／8／8／8 | 不共用；相機 8 款與 PAGE1 已隱藏的 `CAMERA_SYSTEM_OPTIONS` 幾乎同名 |
| Observation Capture | `observationCapturePromptOptions.js` | 場景 8、光線 6、鏡頭 4… | 不共用；光線直接寫實體光源（fluorescent、街燈），C 規範禁止這種寫法 |
| 固定構圖 | `fixedCompositionOptions.js`、carriage／station | 8＋3＋3 | 場景、光線、守門語寫在程式碼裡 |

**同一地點在兩邊各維護一份（page3.mjs）**：西門町、歌舞伎町、道頓堀、弘大、聖水洞、廟街、Soho、Shoreditch、Camden、孚日廣場、瑪黑區、羅馬老城咖啡館、Sunset Boulevard，約 13 處。PAGE1 的上海法租界 5 條、Hallstatt 1 條在 PAGE3 沒有對應；PAGE3 的台北 101、表參道、Times Square 等在 PAGE1 沒有對應。

**能否共用（選項，不定案）：**

- (a) 共用「地點識別層」（city、district、landmark cues），兩頁各自保留不同粒度的取景。
- (b) 只共用環境光詞彙表，讓 PAGE3 的 10 款改成映射到 PAGE1 的 36 款。
- (c) 維持分離，但把重疊地點列成對照表。

（a）、（b）都會動到儲存相容面（PAGE3 ID、Saved Cards），需要另外寫規格。

---

## 7. 可維護性：新增一條要改幾處

| 動作 | 最少要改 | 只改資料不改程式的結果（newentry.mjs 實測） |
| --- | --- | --- |
| 新增場景 | md → sync → 檢查 `inferLocationMeta` 關鍵字 → 測試；若要 Z 低機位或上方場景，另加 ID overlay（`zImageSceneDetailPriority.js` 45 條、`zImageUpperScene.js` 18 條） | 可用。測試用「京都神社參道」拿到 `outdoor, natural`，可用環境光 15 種 |
| 新增環境光 | md → sync → `inferLightingMeta` 加一個硬寫區塊（`engine.js:1939-2060`）→ 視情況補 `lightDirectionSupportsAmbientLight` → 決定要不要寫 overlay（綁 ID＋原文）→ 2 支測試 | 部分可用。只有前綴推得出的 `ambient_outdoor`/`ambient_indoor`；新戶外光可用於 69 個場景，但沒有天氣或時段 tag，衝突規則不會生效 |
| 新增光線表現 | md → sync → `inferLightingMeta` 光線區塊 → 相容規則 → 測試 | **完全不可用。** tags 是空的，可用場景數 0，室內和戶外屬性下都看不到 |
| 新增攝影風格 | md → sync → `inferStyleMeta` → `STYLE_PROMPT_INTROS`（漏加時退回成「editorial photography mood」）→ 測試 | 可選，但開頭固定成通用句 |
| 插入或改名既有條目 | ID 由「類別＋zh＋列索引」組成（`engine.js:3289-3294`）。插在中間會讓後面所有 ID 位移，overlay 測試會失敗；改名要補舊資料遷移 | — |

另外，環境光 36/36、光線表現 31/31、攝影風格 26/26 的 zh 標籤都以字面值寫在 engine.js 裡。底片則是 17/25（hardcode.mjs）。改任何一個 zh 標籤，都要同步改程式。

---

## 8. 建議（給選項，不定案；影響／工作量）

| # | 建議 | 影響 | 工作量 | 備註 |
| --- | --- | --- | --- | --- |
| R1 | 修正 tag 推斷的子字串誤判：英文改成字詞邊界比對，`地下` 排除 `地下室`；先為倫敦排屋、榻榻米、CRT 寫回歸 fixture | 高 | 小 | 會改變相容矩陣，屬行為變更；需同 seed 跑 audit 前後比對 |
| R2 | 補相容規則：棚擋窗光／日光、地下擋窗光、把漸層與多色塊棚加入 studio 清單；固定構圖讓 UI 只列實際生效的環境光，或在換值時提示 | 高 | 中 | 規則仍放程式，或改成 R4 的資料驅動 |
| R3 | 清掉控制語：運輸類固定組改走 overlay 或清洗棚光原文；PAGE3 匯入文字移除「PAGE3…layer／real-place guards／do not let…」等 meta 語 | 高 | 中 | 涉及 prompt 契約，需逐輸出比對 |
| R4 | 相容 tag 改成資料欄位：md 加 `tags` 欄（或 JSON metadata），取代 engine 依 zh 硬寫；新增光線表現不用再改程式 | 高 | 大 | 一次性遷移，需 fixture 保證 tag 結果與現況一致 |
| R5 | 修死碼：決定艾爾莎・布萊達要不要在隨機模式可達（例如讓 night_bias 對應 `urban`＋夜景環境光），或移除 7 個不會觸發的 *_bias 分支 | 中 | 小 | 品味取捨，需 Cooper 定 |
| R6 | 加黑白↔彩色、季節、場景內建時段的軟性相容（只影響隨機，明確鎖定照舊） | 中 | 中 | 規則強弱需 Cooper 判斷 |
| R7 | 處理 Negative：選項為 (a) 從 webapp catalog 移除、(b) 標註僅供 Python 舊腳本使用、(c) 重寫並接到 MJ `--no` | 低 | 小 | (c) 屬新功能，需規格 |
| R8 | 補覆蓋缺口：春秋環境光；雪景、楓葉、神社、便利商店、機場、美術館等場景；擴充自然類 | 中 | 中 | 數量與方向需 Cooper 定 |
| R9 | 同步 C／D 規範的過期段落（143→154、其他專屬範例、filmId 現況、rendering 清單、Leica 命名） | 中 | 小 | 改 docs/ 前要先建 .bak |
| R10 | 收斂攝影風格與成像的跨欄字詞，並去掉 `STYLE_PROMPT_INTROS` 與 en 的重複 | 中 | 中 | 會改 prompt 措辭，需逐條審 |

---

## 9. not_stated 與限制

- 生成影像的實際品質（例如否定句是否真的造成反效果）：not_stated，本分析沒有跑圖像模型。
- 子類失衡是否「合理」：規範沒有定義目標分佈，屬 not_stated，交給 Cooper 判斷。
- 固定構圖的環境光被默默替換，是否為刻意設計：規格中查不到說明，屬 not_stated。
- 地域分類用關鍵字判定（region.mjs）。例如 `黑膠唱片聆聽角`、`老式鋼琴房` 是依 en 裡的 British 歸到英國，可能有少量誤差。
- 隨機比例是兩個 seed 各 2,000 到 3,000 次的抽樣，不是全空間精算；相容矩陣則是全空間實測。

---

## 10. 重現方式（腳本都在本資料夾，全部唯讀）

```bash
cd /private/tmp/claude-501/-Users-cooperfu-Projects-Virtual-Photography-Studio/80d8f708-6d6d-4e28-951d-26f07f8bdfff/scratchpad/db-analysis
node stats.mjs            # 數量、字數、規範上限、責任混雜字詞 → stats.json
node region.mjs           # 地域分類 → region.json
node compat.mjs           # 場景×環境光×光線表現 相容矩陣 → compat.json
node tagfp.mjs            # tag 子字串誤判 → tagfp.json
node randsim.mjs 2000 20261011 ; node randsim.mjs 2000 7   # 隨機分佈、不可達選項
node catshare.mjs         # 子類抽中比例
node conflictsim.mjs 3000 20261011   # 跨欄語意衝突比例
node similarity.mjs       # TF-IDF / Jaccard 近似重複、地點家族 → similarity.json, families.json
node guiderules.mjs       # C/D 規範逐條檢核 → guiderules.json
node regional.mjs         # 風格責任混雜 → regional.json
node leak.mjs ; node leak2.mjs '室內：純潔白幕' '高調純白攝影棚' ; node mjleak.mjs ; node guardphrases.mjs   # 控制語洩漏
node fixedsets.mjs ; node fixedsets2.mjs '紐約地鐵無人長椅月台' '高調純白攝影棚' ; node fixedsets3.mjs  # 固定構圖
node page3.mjs ; node page3leak.mjs     # PAGE3 平行資料與匯入洩漏
node newentry.mjs         # 只加資料不改 engine 的可用性模擬
node hardcode.mjs         # zh 標籤硬寫統計 → hardcode.json
```

（同資料夾裡的其他檔案屬於其他分析員，與本報告無關。）
