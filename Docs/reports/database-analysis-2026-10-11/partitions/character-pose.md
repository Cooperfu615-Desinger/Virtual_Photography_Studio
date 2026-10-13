# 資料庫分析：人物、角色卡、姿勢動作分區

- 分析日期：2026-10-11；分析者：唯讀資料品質分析 subagent
- 範圍：`database.json` 的 `Character`（及其 Markdown 來源 `knowledge_base/character_design.md`）、`characterProfiles.js`（33 張角色卡）、`character_reference_manifest.json`、`characterCardLab.js`、`poseComposerOptions.js`、`poseComposerCompatibility.js`、`duoOptions.js`、`actionPoseCards.js`；`engine.js` 只用 grep 抽查。
- 評估標準：`Docs/specs/character-section-a-authoring-guide.md`（下稱「A 區指南」）、`Docs/specs/character-card-facial-identity.md`（下稱「臉部身份規格」）、`body-type-catalog-v2.md`、根目錄 `AGENTS.md`。
- 方法：所有數字都由本資料夾的腳本算出（清單見附錄 A）；實際組 Prompt 的檢查直接呼叫 `generatePrompts()`，不寫入 repo。`python3 scripts/sync_to_json.py --check` 通過（Markdown 與 database.json 已同步）。分析前後 `git status` 相同，repo 沒有任何改動。
- 分類方式：**【確定】** 表示有資料或實跑證據，且違反現行規格或內部一致性；**【待判斷】** 表示涉及品味、風格或產品取捨，需 Cooper 決定；**not_stated** 表示查不到。

---

## 0. 關鍵數字

| 指標 | 數值 | 來源 |
|---|---|---|
| Character 分區條目（不含 none） | 130（9 個子類）；其中 legacy 的「姿勢與肢體語言」27 筆加「特殊動作」23 筆，共 50 筆（38%） | `out_db_character.md` |
| 角色卡 | 33 張；8 個結構化欄位全數填寫（33/33）；`distinctiveFeatures` 都正好 4 個錨點 | `out_character_cards.md` |
| 角色卡五官相似度 | 528 對的 TF-IDF cosine 平均 0.287；最高一對 **18_Natsuki↔36_Miku = 0.757**，第二名只有 0.579 | 同上 |
| 角色卡在 GPT 系輸出的成年身份 | GPT 主輸出、GPT 胸上、全身角色照的 **66/66 個樣本都不含年齡、adult 或 woman 字樣**；Z、AI 為 66/66 都有 | `out_adult_presence.md` |
| Pose Composer 選項 | 7 層共 271 個實際選項；其中 uiHidden 114 個（42%）；接觸／支撐層有 58/78（74%）在任何基底下都不可見 | `out_pose.md`、`out_dead_options.txt` |

---

## 1. 覆蓋度與分佈

### 1.1 Character 分區（database.json）

| 子類 | 非 none | en 字數（最少／中位／最多） | A 區指南目標 | 超出目標的條目 |
|---|---|---|---|---|
| 五官特徵 | 6 | 16/17/18 | 10–20 | — |
| 膚質特徵 | 5 | 9/10/12 | 6–14 | — |
| 體態 | 6 | 22/32/40 | 8–18（已被 v2 取代，見 §3.1） | 6/6 |
| 髮型 | 31 | 9/12/18 | 8–18 | — |
| 髮絲整理狀態 | 4 | 12/14.5/26 | 未定 | — |
| 髮色 | 13 | 7/9/14 | 6–14 | — |
| 表情 | 15 | 11/14/19 | 8–18 | 龐克挑釁吐舌（19） |
| 姿勢與肢體語言（legacy） | 27 | 9/12/35 | 8–24 | 半躺低姿態｜正面仰躺（35） |
| 特殊動作（legacy） | 23 | 18/22/26 | ≤55 字、≤360 字元 | — |

分佈（`hair_distribution.py`）：
- **髮型（31）**：短髮／鮑伯 6、中長 10、長髮 8、綁髮／盤髮 7，四類大致均衡。
- **髮色（13）**：黑 2、棕系 6、淺色／漂色 2、鮮豔特殊色 3，以自然色為主，符合指南「不要變成顏色百科」。
- **表情（15）**：正向 4、中性／平靜 6、負向／激動 5，涵蓋喜怒哀樂。
- **legacy 姿勢家族（27）**：站 4、坐 8、半躺 6、蹲 3、動態 6。這個子類只用於舊資料遷移。

**子類內相近條目**（Jaccard ≥ 0.5，`analyze_db_character.py`）：
- 髮型 `柔波：中分` ↔ `濕潤感長波浪` 0.64
- 髮型 `自然微彎：中分` ↔ `自然微彎：濕感` 0.62
- 髮型 `自然微彎：中分` ↔ `自然微彎：瀏海` 0.60
- 髮型 `柔波：瀏海` ↔ `濕潤感長波浪` 0.60
- 表情 `平靜淡然` ↔ `沉浸平靜` 0.53

### 1.2 Pose Composer（`poseComposerOptions.js`）

| 層 | 實際選項 | uiHidden | randomEligible=false | 有 legacyPromptAliases | 有 projectionByBucket | en 字數（最少／中位／最多） |
|---|---|---|---|---|---|---|
| 姿勢基底 base | 5 | 0 | 0 | 0 | 0 | 2/2/2 |
| 躺姿方向 orientation | 3 | 0 | 0 | 0 | 3 | 5/5/7 |
| 肢體變化 arrangement | 80 | 37 | 37 | 6 | 61 | 3/14/40 |
| 手部 hand | 70 | 22 | 30 | 6 | 5 | 5/17/59 |
| 道具 prop | 11 | 0 | 1 | 2 | 0 | 13/20/42 |
| 頭部 head | 24 | 3 | 3 | 0 | 0 | 3/10/19 |
| 接觸／支撐 anchor | 78 | 52 | 52 | 0 | 15 | 3/6/28 |

各基底實際可選的公開選項數。計算方式仿照 `Page1Workspace.jsx:892-918` 的過濾邏輯，並排除 uiHidden；接觸層沒有扣除場景類型的限制。

| 基底／躺姿方向 | 肢體 | 手部 | 道具 | 頭部 | 接觸 | 理論組合數* | 隨機池（肢體/手/頭） |
|---|---|---|---|---|---|---|---|
| 站姿 | 10 | 26 | 11 | 11 | **0** | 5,016 | 10/18/11 |
| 坐姿 | 11 | 27 | 11 | 11 | 9 | 56,160 | 11/19/11 |
| 跪姿 | 8 | 29 | 11 | 14 | **0** | 5,535 | 8/21/14 |
| 蹲姿 | 8 | 13 | 11 | 14 | **0** | 3,375 | 8/7/14 |
| 躺姿／仰躺 | 9 | 15 | 11 | 3 | 11 | 12,960 | 9/6/3 |
| 躺姿／側躺 | 5 | 14 | 11 | 4 | 10 | 8,580 | 5/5/4 |
| 躺姿／趴臥 | 5 | 14 | 11 | 3 | 10 | 6,864 | 5/5/3 |

\* 組合數算法：(肢體+1) × (手部+道具+1) × (頭部+1) × (接觸+1)。手部與道具互斥，見 A 區指南「有效道具會接管手部層」。總數約 98,490，**坐姿占 57.0%，站 5.1%、跪 5.6%、蹲 3.4%**。家族之間的落差主要來自接觸層：站、跪、蹲在接觸層都沒有公開選項。

各家族的肢體變化數與規格一致（站 9、坐 10、跪 7、蹲 7、躺 9，各家族另加一個「任意」），見 `standing-catalog-v1.md`、`kneeling-catalog-v2.md`。

### 1.3 雙人與動作姿勢卡
- `duoOptions.js`：互動 5 個（控制項 `section: 'hidden'`，`engine.js:1128`）、雙人姿勢基底 8 個、雙人動作情境 11 個、雙人表情 16 個（其中 8 個 uiHidden）。
- `actionPoseCards.js`：3 張，全部是 single；`duo` mode 的 `enabled: false`（`actionPoseCards.js:5`），沒有任何雙人卡。

---

## 2. 角色卡品質

### 2.1 逐欄覆蓋率（`analyze_character_cards.mjs`）

| 欄位 | 覆蓋 | 字數（最少／中位／最多） | 最短卡 | 最長卡 |
|---|---|---|---|---|
| facialGeometry | 33/33 | 13/15/17 | 09_Amy | 48_G |
| eyeSignature | 33/33 | 13/15/19 | 09_Amy | 36_Miku |
| noseSignature | 33/33 | 8/13/14 | 14_Nana | 00_Mei |
| mouthSignature | 33/33 | 13/14/17 | 38_Rin | 12_Sakura |
| skinSignature | 33/33 | 8/9/13 | 48_G | 03_Sui |
| makeup | 33/33 | 7/13/16 | 07_Lily | 34_Seulgi |
| body | 33/33 | **4**/13/19 | 12_Sakura | 25_Grace |
| distinctiveFeatures | 33/33 | 20/26/35 | 22_Olivia | 10_Ji-Yoo |
| identityAndBody（＝legacy） | 33/33 | 40/93/153 | 29_Philippa | 41_Eleanor |
| hair | 33/33 | 14/23/83 | 48_G | 08_Jiwoo |
| outfit | 33/33 | 11/30/64 | 19_Minji | 12_Sakura |
| accessories | 19/33 | 4/8/26 | — | — |
| photographicDirection | 33/33 | 13/18/27 | — | — |
| bodyProjection | 33/33（其中 6 張的 `chestUp` 是空字串） | — | — | — |
| meta.referenceImage | 33/33（public AVIF 全部存在） | — | — | — |
| referenceImages（多視角 metadata） | **0/33** | — | — | — |
| option.en | 33/33 | 123/163/237 | 09_Amy | 08_Jiwoo |

- `identityAndBody === legacyIdentityAndBody`：33/33，符合臉部身份規格。
- manifest 有 33 項，與卡片 ID 一一對應，原圖全部存在。source-assets 每張卡的原圖數量在 1–4 張之間；48g、philippa、sakura、rika、rin、lily 這 6 張只有 1 張原圖。

### 2.2 四個永久辨識錨點
- 每張卡都正好 4 個錨點，沒有任何錨點使用髮型、妝容、服裝或眼鏡等可替換造型詞。
- 只有 3/33 張卡的錨點含有「非幾何」標記：Rika 的痣、Sui 的雀斑、Eleanor 的角與紋。其餘 30 張的錨點，都是把臉／眼／鼻／唇幾何再寫一次（例如 48_G 的錨點，與它的 facialGeometry 開頭同為 `small rounded oval face`）。腳本初版回報 2/33，逐卡複核後修正為 3/33。
- 規格要求錨點涵蓋「臉、眼、鼻／唇，以及一個獨特標記或最強幾何對比」。多數卡用幾何對比來滿足最後一項，形式上符合規格。

### 2.3 相似角色的區分度（TF-IDF cosine；計算五官 5 欄）

| 排名 | A | B | 整體 | 臉型/眼/鼻/嘴/膚 |
|---|---|---|---|---|
| 1 | 18_Natsuki | 36_Miku | **0.757** | 0.94 / 0.84 / 0.55 / 0.45 / **1.00** |
| 2 | 09_Amy | 18_Natsuki | 0.579 | 0.49 / 0.56 / 0.80 / 0.09 / 0.48 |
| 3 | 48_G | 13_Yui | 0.544 | **0.92** / 0.23 / 0.63 / 0.47 / 0.03 |
| 4 | 15_Emily | 33_Bora | 0.519 | 0.54 / 0.17 / 0.86 / 0.18 / 0.61 |
| 5 | 48_G | 36_Miku | 0.512 | 0.59 / 0.46 / 0.27 / 0.48 / 0.13 |

- **【確定】Natsuki 與 Miku 幾乎是同一張臉**：
  - 臉型：Natsuki 是「soft compact oval face…」（`characterProfiles.js:772`），Miku 是「compact soft oval face…」（`:852`），只差語序加下顎一詞。
  - 膚質：兩張卡逐字相同（`:776` 與 `:856`，都是 "clean luminous finish"）。
  - 眼與鼻：都是 `large dark brown round-almond`、`low gentle bridge`。
  - 規格的必測對比清單（`character-card-facial-identity.md:162`）與測試（`characterCardLab.test.js:152-181`）都沒有 Natsuki/Miku 這一組，只有 Natsuki/Minji 與 Miku/Nana。
  - 該測試只用 `assert.notEqual` 比對字串，換一個字就能通過，量不到實際的相似程度。
- 規格矩陣列出的「Most confusable with」都是人工判斷。48_G↔Yui、Emily↔Bora 這兩組量化排名前 5，但沒有出現在必測清單。
- 屬性分佈：
  - 臉型：oval 16、heart-oval 8、oval-heart 8、near-round 1。
  - 眼色：brown 13、gray 8、hazel 6、其他 6。
  - 下巴：pointed 21、rounded 12。
  - 膚色：porcelain／fair 24/33。
  - 族裔：East Asian 32、demonic 1。
  - 整體來說，身份空間集中在「白皙、橢圓或心形、杏眼、尖下巴」這一區。

### 2.4 identityAndBody 與結構化欄位的一致性
- 自動比對了眼色、heart 臉型、雀斑、痣四項，**沒有偵測到矛盾**。
- **【確定】眉形資訊只存在於 legacy 字串**：identityAndBody 有 30/33 張提到眉毛，8 個結構化欄位只有 25/33 張提到。Philippa、Sakura、Eleanor、Jiwoo、Koto 這 5 張的眉形只寫在 legacy 字串。GPT 只輸出結構化欄位（`engine.js:11912-11921`），所以這 5 張卡在 GPT 輸出裡沒有眉形。
- legacy 的 `option.en` 含表情或視線詞，共 16 張（例如 Philippa 的 "cool glassy gaze"、Kaori 的 "narrow gaze structure"）。這是相容欄位，結構化欄位沒有這類詞。

---

## 3. 描述品質

### 3.1 文件與資料不同步【確定】
| 文件位置 | 文件寫法 | 實際資料 |
|---|---|---|
| A 區指南 :40、:685 | 角色卡來源在 `engine.js` 的 `CHARACTER_PROFILE_OPTIONS` | 來源在 `engine/characterProfiles.js`；engine.js 只保留排序（`engine.js:338-372`） |
| A 區指南 :569-581 | 列出 10 張角色卡 | 33 張 |
| A 區指南 :109、:119、:124 | 列出「一般基本體型」，目標 8–18 words，canonical 是 `I-cup bust` | v2 已合併該體型；實際 22–40 字；`I–K cup bust` 並加了衣料效果（`character_design.md:27`） |
| A 區指南 §5.4 | 列出 27 種髮型 | 31 種（新增輕透齊瀏海內彎鮑伯、韓系蓬鬆鎖骨柔波髮、輕透瀏海自然微彎長髮、雙包子頭） |
| A 區指南 §6.1 | 列出 15 種表情 | 16 種（多了 `龐克挑釁吐舌`，`character_design.md:94`） |
| A 區指南（2 處） | 路徑寫成 `/Users/cooperfu/Desktop/Virtual_Photography_Studio/...` | 該路徑不存在 |
| 臉部身份規格 :139 | 新增卡片時「only in characterProfiles.js」 | 至少還要改 `engine.js` 的 `CHARACTER_PROFILE_CONTROL_ORDER`。沒加的卡會被過濾掉，因為選項是用 `.filter(Boolean)` 由排序表產生（`engine.js:373-378`）。另外也要改 `midjourneyCardItemNames.js` |

### 3.2 主觀或非視覺字詞（regex 診斷，不等於錯誤）
- 五官 6/6 都含主觀美感詞（例如 `成熟性感臉` 的 "seductive alluring"，`character_design.md:13`）。這是指南允許的「臉部氣質」寫法；但冷感高級臉含 "gaze-ready"（`:12`），而指南規定五官不寫視線，所以這一筆屬於**【確定】輕微越界**。
- 髮型有 10/31 含 polished、elegant、romantic 等語氣詞；`高位雙馬尾` 含 "youthful twin-tail"（`:50`）。
- 角色卡規格點名要避免 "doll-like"。structured 欄位已經沒有這個詞，但 legacy `option.en` 與 `identityAndBody` 仍有 10/33 張含 doll-like、kawaii 或 girl（例如 Sakura 的 "doll-like kawaii"）。
- **【確定】Sakura 的 body 只有 4 個字，而且不是視覺描述**：`slim petite cozy-girl proportions`（`characterProfiles.js:558`）。

### 3.3 內部控制語出現在公開輸出（實跑：`card_output_leak_check.mjs`，33 卡 × 3 seeds）
- **【確定】`bare feet as the locked footwear state`**：寫在 Hina 的 outfit（`characterProfiles.js:157`）與三張卡的 cardLab 鞋子層（`characterCardLab.js:138/238/304`）。實跑確認 GPT 與 Z 都輸出了這句；測試甚至要求它必須出現（`engineSpecialSubjects.test.js:668`）。AGENTS.md 禁止「selection-control language」出現在公開 Prompt，這句的 "locked" 屬於這類用語，但目前被測試鎖定，要不要改需 Cooper 確認。
- **【待判斷】** GPT 輸出 99/99 含 `Permanent identity anchors:` 段標題（這是規格指定的寫法），另有 96/99 含 photographicDirection 裡的 `coherent facial identity`，這兩個比較像指令而不是畫面描述。GPT 輸出另含 `Character Profile Card: 37_Hina.`，把內部卡名交給了生圖模型。
- legacy `option.en` 的 33/33 都含 `signature outfit locked as`。engine 只在部分路徑用 regex 把它移除（`engine.js:11353`），實跑時 Z 與 AI 沒有輸出這句。
- 肢體變化資料用 "arrangement" 這個字（例如 `natural seated arrangement`，`poseComposerOptions.js:543`），由 renderer 再用 regex 換掉（`engine.js:5399-5401`）。實跑時沒有外洩，但等於資料必須依賴程式來清理。

### 3.4 zh / en / desc 不一致
- **【確定】髮型有 6 筆 zh 名稱帶「濕」，en 卻沒有任何濕感字樣**：帥氣濕亮油頭、不對稱濕感短鮑伯、半濕感中長髮、直髮：濕感、自然微彎：濕感、濕潤感長波浪。這是指南刻意保留的相容名稱（濕感已移到「整理狀態」），但使用者看名稱會以為選了濕髮。其中 `直髮：濕感` 的 en 是 "medium-to-long"，與同家族其他「直髮」條目的 "long" 不同。
- **【確定】** 道具 `手持單眼 FUJI X-100V 相機`（`poseComposerOptions.js:1081`）：X100V 是定焦機，不是「單眼」；型號寫法也與 en 的 `X100V` 不一致。
- **【確定】** 手部 zh `單手托下巴` 重複出現，對應兩個 ID：`one-hand-chin-other-down`（:701，隱藏）與 `one-hand-support-chin`（:946）。
- **【確定】公開選項缺少 desc**：肢體 39/42、手部 26/48、頭部 20/21、接觸 16/26。base、orientation、prop 都有 desc。
- 道具 `hand-hold-round-lollipop-mouth` 與 fuji 在 en 裡寫死右手。A 區指南建議不綁死左右，但有寫明這是「使用者核准的指定」，屬**【待判斷】**。

---

## 4. 相容性規則

規則散在 5 個地方：
1. **資料 meta**（`poseComposerOptions.js`）：包括 `hiddenForBases`、`hiddenForOrientations`、`randomEligibleFor*`、`visibleBuckets`、`requiresFaceVisibility`、`requiresWardrobeRole`、`projectionByBucket` 等 17 種以上的 meta 鍵。
2. **程式內硬編碼 ID 集合**（`poseComposerCompatibility.js:22-58`）：共 24 個 ID，全部存在，但其中 11 個指向已 uiHidden 的選項。
3. **獨立模組**：`kneelingSupport.js`（四足跪姿的手部綁定）。
4. **UI 元件**（`Page1Workspace.jsx:892-918`、`:941-966`）：處理特寫、仰躺表面、固定場景與 legacy pose 的停用。
5. **`engine.js`**：
   - `poseComposerAnchorAllowedByScene`（`:4680`）。
   - 以字串常數直接引用 78/263 個姿勢 ID，共 110 次。
   - 689 個 `.replace(/…/)`，其中 29 個針對姿勢文字、99 個針對五官、髮型或服裝文字。

主要發現：
- **【確定】相容規則只套用在隨機池**（`poseComposerCompatibility.js:6-7`）。有 98 個公開選項帶「只在隨機時生效」的 meta（接觸 26、肢體 9、手部 43、頭部 20），手動選擇時不檢查。例如 `requiresFaceVisibility` 的手勢可以手動搭配背面視角。這是刻意設計（尊重使用者意圖），但 UI 沒有任何衝突提示。是否補提示屬**【待判斷】**。
- **【確定】接觸層有 6 個「實質死選項」**：沒有標 uiHidden，卻對所有適用基底都設了 `hiddenForBases`，例如 `shared-natural-support`（`poseComposerOptions.js:1199`，第 9 行起列出全部 5 種基底）與 `standing-edge-hip-support`（`:1236`）。加上 52 個 uiHidden，接觸層 78 個選項中有 58 個（74%）不可見。
- 用 regex 掃描公開的手部、頭部、道具文字與基底語意（例如站姿配上 ground 或 kneel），**沒有找到文字層級的不可能組合**（`out_manual_conflicts.txt`）。
- **【確定】角色卡 photographicDirection 與使用者選的場景互相衝突**：17/33 張卡的 photographicDirection 寫了場景、地點或光線，例如 Nana 的 `school-corridor`（`characterProfiles.js:348`）、Seulgi 的 `neon nightclub`（`:501`）。實跑時選擇「金色海灘」場景，GPT 主輸出同時出現 beach 與 neon nightclub、school-corridor、neon city street；Z 與 AI 已移除這段（`out_conflict_demo.txt`）。這也違反 A 區指南 §9「角色卡不要包含固定場景」。

---

## 5. 可維護性

**新增一張角色卡**，目前約要動 10 個檔案、12 處以上：
1. `characterProfiles.js` 的 3 處：LEGACY option、`FACIAL_IDENTITY_PROFILES`、`CHARACTER_BODY_PROJECTIONS`。
2. `engine.js` 的 `CHARACTER_PROFILE_CONTROL_ORDER`。
3. `characterCardLab.js` 的 `CHARACTER_CARD_EXTENSIONS`（hairTags 與 wardrobeLayers）。
4. `midjourneyCardItemNames.js`。
5. `character_reference_manifest.json`。
6. `source-assets/…` 與 `webapp/public/character-cards/…/*.avif`。
7. 臉部身份規格的矩陣列。
8. 兩支測試，以及兩份 MJ baseline JSON（以 `character-miku` 實際 grep 得到 10 個檔案）。

**【確定】同一套服裝寫了三份**：`profile.outfit/accessories`、cardLab 的 `wardrobeLayers`、MJ 名稱表。cardLab 圖層中有 16 筆不是 profile 文字的子字串（`out_card_lab.md`），例如 Kaori 的 outerwear、Amy 的 shoes。其中部分是刻意拆層或改寫，但沒有測試檢查兩份來源是否一致。

**新增一個姿勢**相對集中：例如 `standing-bent-leg-lift` 只出現在 4 個檔案（資料、2 支測試、spec），`squatting-gangster-wide-knee` 3 個。只有需要方位相容時，才要改 `poseComposerCompatibility.js`。

**legacy 累積**：
- Pose Composer 有 114/271 個選項是 uiHidden。
- Character 分區有 50 筆 legacy 條目（姿勢 27、特殊動作 23）。
- 表情、雙人表情有 8/16 個 uiHidden。
- 這些舊選項都留在主要資料陣列裡，跟現役選項混在一起。

---

## 6. 成人身份與安全相關描述（只陳述資料事實）

- 33/33 張卡的 `option.en` 與 `identityAndBody` 都含 `20-year-old adult`；年齡值只有 20 一種。8 個結構化欄位都沒有年齡或 adult（0/33）。
- **【確定】實跑（`adult_presence_check.mjs`，66 個樣本）**：

| 情境 | 輸出 | 含年齡、adult 或 woman |
|---|---|---|
| 角色卡 | `grokPrompt`（GPT 主輸出）、`chest-up-portrait`、`full-body-character` | **0/66**，三種字樣全無 |
| 角色卡 | Z、AI | 66/66 都有 "adult" |
| 角色卡 | MJ 胸上 | 66/66 都有 "20-year-old" |
| 一般單人隨機 | GPT 系輸出 | 60/60 都有 `NN-year-old` 與 woman |

  原因是 GPT 的角色卡區塊在有結構化欄位時，只輸出結構化欄位，不輸出 identityAndBody（`engine.js:11912-11924`）。compact 路徑則會用 regex 把 `a 20-year-old adult … woman` 這段開頭保留下來（`engine.js:5045-5048`）。AGENTS.md 多處寫明要保留成年身份。
- 雙人模式（4 種情境 × 5 個 seed）：GPT、Z、AI 都是 20/20 含 `20-year-old`。
- 雙人動作情境的 11 個中有 3 個屬性感或情慾類（慵懶性感寫真、親密性感互動、充滿情慾的時尚寫真，`duoOptions.js:137`）。
- 學院風相關資料：
  - Miku 的服裝有百褶迷你裙、領結、`school backpack`（`midjourneyCardItemNames.js:36`）。
  - Nana 的 photographicDirection 是 `school-corridor`。
  - 道具 `含著圓形棒棒糖` 的 en 含 "cute playful"，desc 寫「帶有童趣」。
  - 髮型 `高位雙馬尾` 含 "youthful"。
  - 這些都與成年身份並存。是否調整屬**【待判斷】**；A 區指南要求「可愛但不幼態」。
- 「手部」與「特殊動作」中有裸露相關的手勢，例如 `hands-lift-top-underbust`（57 字）、`hands-cover-breasts`。這些在指南中已逐一記錄為使用者核准的手動選項，此處只記錄存在。

---

## 7. 優點

1. **角色卡結構化欄位完整**：8 個欄位都是 33/33，四錨點都是 4 個，而且沒有用造型詞當錨點。實跑時 Z、AI、GPT 對四錨點的逐字保留率都是 99/99。
2. **相容性保護到位**：`identityAndBody === legacy` 是 33/33；體態、髮型、道具都保留 `legacyIds` 或 `legacyPromptAliases`；Markdown 與 JSON 同步檢查通過；manifest、AVIF 與原圖三方一致。
3. **Character 子類多數符合指南長度**：五官、膚質、髮型、髮色、表情幾乎全落在目標字數內；髮型四類均衡；表情涵蓋正、中、負向；同一子類內沒有完全重複的 en。
4. **Pose Composer 投影設計完整**：公開肢體變化 42/42 具 `projectionByBucket`，公開手部 47/48 具 `visibleBuckets`；各姿勢家族的公開數量與 spec 一致；compat 檔內的硬編碼 ID 24/24 都存在。
5. **新增姿勢的影響範圍小**：一個新姿勢約 3–4 個檔案。退役選項用 uiHidden 保留，舊存檔仍可還原。

---

## 8. 缺點與風險

### 確定問題
| # | 問題 | 證據 |
|---|---|---|
| D1 | 角色卡的 GPT 主輸出、GPT 胸上、全身角色照完全沒有年齡、成年或女性身份 | 實跑 0/66；`engine.js:11912-11924` |
| D2 | Natsuki 與 Miku 五官相似度 0.757（臉型 0.94、膚質 1.00），且不在必測對比清單；測試只用 notEqual 比字串 | `characterProfiles.js:772/852`、`:776/856`；`characterCardLab.test.js:152-181` |
| D3 | 17/33 張卡的 photographicDirection 含場景或光線，在 GPT 輸出中與使用者選的場景並存 | `:348` "school-corridor"、`:501` "neon nightclub"；`out_conflict_demo.txt` |
| D4 | A 區指南與臉部身份規格的「新增卡片流程」與資料不同步（7 處） | §3.1 表 |
| D5 | 服裝三份來源，16 筆圖層文字與 profile 有差異，沒有一致性測試 | `out_card_lab.md` |
| D6 | 公開選項缺 desc：肢體 39/42、手部 26/48、頭部 20/21、接觸 16/26 | `out_zh_en.txt` |
| D7 | 接觸層 6 個實質死選項，加上 52 個隱藏，74% 不可見；站、跪、蹲沒有公開的接觸選項 | `poseComposerOptions.js:1199/1236` |
| D8 | 眉形只存在於 legacy，5 張卡的 GPT 輸出因此沒有眉形 | `brows_body.mjs` |
| D9 | "locked footwear state" 這句控制語出現在 GPT 與 Z 輸出 | `characterProfiles.js:157` |
| D10 | 小問題：Sakura 的 body 只有 4 字且含 "cozy-girl"；6 張卡的 `chestUp` 投影是空字串；`冷感高級臉` 含 "gaze-ready"；X100V 被標成「單眼」；zh `單手托下巴` 重複 | `:558`、`:884`；`character_design.md:12`；`poseComposerOptions.js:1081/701/946` |

### 待 Cooper 判斷
| # | 項目 | 證據 |
|---|---|---|
| J1 | 6 筆名稱含「濕」的髮型，en 是無濕感版本，且與兄弟條目高度相近（0.60–0.64）。可選擇改名、隱藏並做 legacy 對應，或維持現狀 | `character_design.md:41/46/49` |
| J2 | 相容規則只管隨機池，手動組合不檢查。可選擇補 UI 警示、改成硬性停用，或維持現狀 | `poseComposerCompatibility.js:6` |
| J3 | 身份空間集中在 porcelain／fair、橢圓或心形、尖下巴；族裔 32/33 為 East Asian。是否擴充屬產品方向 | §2.3 分佈 |
| J4 | 學院風、童趣、youthful 類描述與成年身份並存，可選擇保留或改寫 | §6 |
| J5 | GPT 中的 `Permanent identity anchors:`、`coherent facial identity`、`Character Profile Card: 37_Hina` 標籤是否算控制語外洩 | 實跑 99/99、96/99 |
| J6 | 坐姿占理論組合 57%。要平衡可擴充站、跪、蹲的支撐選項，或不需要平衡 | §1.2 |
| J7 | 雙人動作姿勢卡是 0 張，`duo` mode 是停用狀態 | `actionPoseCards.js:5` |

### not_stated
- 「姿勢與肢體語言」「特殊動作」在目前 UI 是否完全不顯示：只確認了 Pose Composer 啟用時會停用（`Page1Workspace.jsx:965`），沒有做瀏覽器實測。
- 33 張卡的結構化描述是否忠實對應參考圖：本次沒有比對影像。
- 各輸出在生圖模型上的實際效果：本次沒有呼叫外部模型。

---

## 9. 建議（只提供選項；影響、工作量為估計）

| # | 建議 | 對應問題 | 影響 | 工作量 |
|---|---|---|---|---|
| R1 | 在角色卡 GPT 區塊開頭加入 identityAndBody 的成年身份開頭句（重用 `engine.js:5045` 的 identityLead 抽取）；或在結構化 schema 新增 `identityLead` 欄位。屬 Prompt 契約變更，需 Cooper 核准，並附 fixture 與同 seed audit | D1 | 高 | 小 |
| R2 | 依參考圖重寫 Natsuki 與 Miku 的差異欄位（下顎、眼距、唇色或唇形、膚質）。把它與 48_G/Yui、Emily/Bora 一起加入必測對比；測試改用相似度門檻（例如 cosine < 0.6）取代 `notEqual`，並把本次的 `analyze_character_cards.mjs` 納入 CI | D2 | 高 | 中 |
| R3 | 拆出 photographicDirection 的場景字詞，改放到 card 的「建議場景」metadata；或在 GPT 有選場景時移除這段（比照 Z/AI 現有行為）。方案取捨由 Cooper 決定 | D3 | 中 | 小 |
| R4 | 統一文件：修正 A 區指南 §2、§5.1、§5.4、§6.1、§7 與 Desktop 路徑；臉部身份規格的「Add a formal card」補上 engine 排序表與 MJ 名稱表，或改成由 characterProfiles 自動排序 | D4 | 中 | 小 |
| R5 | 服裝單一來源：讓 cardLab 的 wardrobeLayers 與 MJ 名稱表從 profile 衍生，或至少加一致性測試，確認圖層文字是 profile 的子集，或是明確列出的允許差異 | D5 | 中 | 中 |
| R6 | 補齊公開姿勢選項的 desc（101 筆）。屬純內容工作，不影響 Prompt | D6 | 中 | 中 |
| R7 | 整理 legacy：把 6 個死選項補標 uiHidden，或在測試中禁止「公開但所有基底都被隱藏」；並把 uiHidden 與退役選項移到獨立的 legacy 陣列或模組，保留 resolver | D7 | 低–中 | 小 |
| R8 | 結構化 schema 加入 `browSignature`，或把眉形併入 eyeSignature，補回 5 張卡的眉形 | D8 | 低–中 | 小 |
| R9 | 把 "locked footwear state" 改寫成單純的 "barefoot"。需同步改測試，並保留 alias 以相容舊文字 | D9 | 低 | 小 |
| R10 | 手動組合衝突提示（例如背面視角搭配臉部手勢），可做成非阻擋提示 | J2 | 中 | 大 |

---

## 附錄 A：腳本與輸出（皆位於本資料夾）
| 腳本 | 用途 | 輸出 |
|---|---|---|
| `analyze_db_character.py` | Character 子類數量、字數、旗標、相似度、zh/en | `out_db_character.md` |
| `hair_distribution.py` | 髮型、髮色、表情、legacy 姿勢分佈 | `out_hair_distribution.txt` |
| `analyze_character_cards.mjs` | 角色卡覆蓋率、錨點、TF-IDF 相似度、manifest、成年字串 | `out_character_cards.md` |
| `peek_cards.mjs` | 個別卡欄位檢視 | stdout |
| `brows_body.mjs` | 眉形保留、body 分佈、chestUp 空值 | stdout（數字已寫進 §2.4） |
| `analyze_card_lab.mjs` | cardLab 與 profile 的雙來源漂移、髮型變體 | `out_card_lab.md` |
| `internal_lang_scan.mjs` | 資料層控制語掃描 | `out_internal_lang.txt` |
| `card_output_leak_check.mjs` | 實跑 33 卡 × 3 seed：錨點、控制語 | `out_card_outputs.md` |
| `adult_presence_check.mjs` | 實跑：成年、年齡、女性字樣出現率 | `out_adult_presence.md` |
| `duo_adult_check.mjs` | 實跑雙人成年字樣 | `out_duo_adult.txt` |
| `conflict_demo.mjs` | 實跑：卡片場景字詞與選定場景衝突 | `out_conflict_demo.txt` |
| `analyze_pose.mjs` | Pose 各層數量、各基底可選數、組合數、硬編碼 ID | `out_pose.md` |
| `dead_options.mjs` | 公開但全基底隱藏的選項 | `out_dead_options.txt` |
| `manual_conflicts.mjs` | 手動組合語意衝突、只在隨機時生效的 meta | `out_manual_conflicts.txt` |
| `zh_en_consistency.mjs` | 單／雙手、左右、缺 desc | `out_zh_en.txt` |
| `photo_direction_scene.mjs` | photographicDirection 場景字詞 | `out_photo_direction.txt` |

重跑方式：`node <script>.mjs <out>`、`python3 <script>.py <out>`。全部只讀 repo，需要 Node 22 以上。
