# 神情姿態 v2：以指定動作為主體

- 狀態：**草案**；P1（動作資料 v2）、P2（姿勢選單機制）已實作（2026-10-19）。方向由 Cooper 於 2026-10-17 確認；句型與手部預設已依 [手部寫法實驗結果](../reports/pose-hand-experiment-2026-10-17/results.md) 定案（2026-10-17）。尚未實作。
- 取代對象：PAGE1「B 神情姿態」的自由組合（Pose Composer 五層）作為主要入口；現行 [指定動作 v1](specified-actions-v1.md) 升級為本規格的主體。
- 決策紀錄：[2026-10-17 神情姿態方向](../decisions/2026-10-17-expression-pose-direction.md)

---

## 1. 目標

Prompt 中的神情姿態要**精簡、完整、自然**，不再出現片段拼接造成的怪語法，也不再組出物理上不合理的姿勢。

## 2. 現況問題（2026-10-17 量測）

- 自由組合有五層（肢體 40、手部 49、道具 11、頭部 21、接觸 26 個公開選項），理論組合約 9.8 萬種，絕大多數沒有審核過。
- 手部層 49 項中，10 項依賴腿部狀態（例如雙肘靠膝要求膝蓋彎起），只有 4 項宣告能搭配哪些肢體；11 項碰到臉或頭，可能和頭部層衝突。
- 相容規則只在隨機時生效，手動組合完全不檢查。
- 各層的英文片段直接拼接，例如 `She has one hand on the waist … surface, and presents a relaxed neutral standing posture.`：先寫手、再補姿勢，語意零碎。

## 3. 架構

| 區塊 | 性質 | 設計 |
| --- | --- | --- |
| **神情**：表情＋視線 | 幾乎不會和身體衝突 | 少量選項，自由搭配 |
| **姿態**：指定動作 | 手、腳、支撐、鏡頭彼此牽動 | 審核過的整套動作，是主要入口與隨機來源 |
| **自由組合** | 保留給需要細部調整的情況 | 簡化並加上部位相容檢查（§8，細節另訂） |

### 3.1 姿勢選單（2026-10-18 Cooper 定案）

自由組合五層全部移除，B 神情姿態的姿勢選單只剩：

| 選項 | 輸出 |
| --- | --- |
| 隨機（沿用各選單既有的「隨機」） | 程式從動作庫抽一個 `validation.status: accepted` 的動作，依場景支撐物與機位篩選（§10） |
| 任意（交給模型） | `She is caught in a candid, natural mid-movement pose, her weight shifted onto one leg and both hands engaged.`（第三輪實驗定案） |
| 全無 | 不寫任何姿勢 |
| 各指定動作 | 該動作的子句（§4、§5） |

舊 Saved Cards 不需還原回工作台；自由組合與被重寫動作的舊資料可以移除（2026-10-18 Cooper 決定）。卡片內已存的 Prompt 文字仍可查看、複製，套用時略過找不到的選項。

本節取代 §3 表格中「自由組合」一列與 §8、§11 中保留舊選項的做法。

## 4. 指定動作資料格式 v2

每個指定動作是一筆紀錄。和 v1 相比，主要差別有兩點：英文改為「標記子句」，並新增手部模式、場景需求、鏡頭相容、隨機標籤與驗收狀態。

```js
{
  id: 'specified-sitting-raised-right-knee',       // 穩定 ID，沿用 v1
  zh: '單腿屈起・單掌後撐',
  family: 'sitting',                                // standing | sitting | kneeling | squatting | lying
  orientationId: 'none',                            // 躺姿用：lying-side | lying-supine | lying-prone
  referenceImage: 'reference/specified-actions/10.avif',
  descriptionZh: '…',                               // 中文幾何定稿
  clauses: [                                        // 英文：v1 原文逐字切分，依部位標記；join 為子句前的連接符
    { region: 'core',    join: '',   en: 'She sits with her hips on the ground' },
    { region: 'lower',   join: ', ', en: 'her right knee raised and her right foot flat on the ground in front of her' },
    { region: 'lower',   join: '. ', en: 'Her left knee opens low toward her left side, the left lower leg folds across the space in front of her with its foot near the inside of her right leg, and the outside of her left leg rests on the ground' },
    { region: 'core',    join: '. ', en: 'Her torso leans slightly backward' },
    { region: 'upper',   join: ', ', en: 'her right hand resting on her right thigh just above the knee and her left palm planted behind her left hip' },
    { region: 'support', join: '; ', en: 'her hips, left leg, right foot and left palm support her body' },
  ],
  faceCropSummary: 'seated, leaning slightly back',  // 臉部特寫用的最短姿態感
  hands: { mode: 'fixed' },                         // fixed | free（§6）；free 時需宣告 freeHands: true
  scene: { support: 'ground' },                     // ground | seat | wall | bed | none
  camera: { orbits: 'any', angles: 'any', framings: 'any' },
  random: { eligible: false, moods: ['casual'] },   // 驗收通過前 eligible 一律 false
  validation: { status: 'pending', evidence: '' },  // pending | accepted | rejected
}
```

## 5. 標記子句與裁切

### 5.1 部位

| region | 內容 |
| --- | --- |
| `core` | 姿勢身份：坐／站／跪／蹲／躺、軀幹前後傾或轉向 |
| `upper` | 肩、手臂、手 |
| `lower` | 臀、腿、腳 |
| `support` | 承重說明，例如「臀部與雙掌分攤體重」 |

### 5.2 景別對應

| 景別區塊 | 使用的子句 |
| --- | --- |
| 全身、牛仔中景、未選景別、固定構圖 | `core` + `upper` + `lower`（`support` 依 §5.4） |
| 中景、胸上 | `core` + `upper` |
| 頭肩、臉部特寫 | 只用 `faceCropSummary` |

### 5.3 撰寫規則

1. 動作只寫一次，裁切由程式取用子句，**不另寫多段版本**。
2. 子句可以是完整句子或逗號片段，各自記錄前面的連接符（`join`）。程式只串接保留下來的子句，再交給 `publicPromptPolish` 處理句首大寫與結尾句號。撰寫時要確認：任何部位被省略後，剩下的子句仍然通順。
3. 子句只描述看得見的身體與接觸，不寫表情、頭部方向、視線、家具、鏡頭或內部控制語。
4. 現有 8 個動作的英文**只切分、不改寫**；v1 的 `upperBodyEn` 保留為歷史相容來源。

### 5.4 待定：承重說明的去留

現有動作平均 91 個英文字，其中承重說明約佔一成。要在哪些輸出省略 `support` 子句（例如只在 MJ 省略，或全部省略），由實驗結果與 Cooper 決定。

## 6. 手部

| 模式 | 輸出 | 條件 |
| --- | --- | --- |
| `fixed` | 動作本身寫好的手部子句 | 動作的手部有承重或被佔用時一律使用 |
| `free`／交給模型 | `She is caught in a candid, natural mid-movement pose, her weight shifted onto one leg and both hands engaged.`（2026-10-18 第三輪定案，取代原 `relaxed, unforced` 寫法） | 動作需宣告 `freeHands: true`（手沒有承重或被佔用） |
| `free`／程式抽選 | 從通用手勢池隨機抽一句 | 同上，且該手勢的條件成立 |

**通用手勢池（10–15 句，文案待 Cooper 審核）**：每句宣告需要的條件，例如 `needsFreeHands`、`needsFaceVisible`（背面時不可用）、`needsPockets`（穿搭要有口袋）。候選例：撥頭髮到耳後、雙手輕握於髖前、一手放鎖骨、雙拇指勾口袋。

**交給模型的寫法（2026-10-18 第三輪）**：比較「明確指令」與「描述畫面特徵」，Cooper 選定描述式（B）。Z-Image 上 B 出現 3 種腿部變化、A 四張都是立正；但 B 的雙手大多仍垂放，GPT 兩種寫法都只畫出同一個模板。詳見[實驗結果 §6](../reports/pose-hand-experiment-2026-10-17/results.md)。

**定案（2026-10-17 實驗）**：自由模式的預設為**程式抽選**。「交給模型」在 Z-Image 與 Midjourney 只產生雙手垂放（Z 近乎立正），沒有變化；只有 Nano 出現不同手勢。「交給模型」保留為可選模式。

**手勢池第一批（實驗結果）**：

| 手勢 | 英文 | 狀態 |
| --- | --- | --- |
| 雙手輕握於髖前 | `both hands loosely clasped in front of her hips` | 入池 |
| 一手放鎖骨 | `one hand resting on her collarbone and the other relaxed at her side` | 入池 |
| 撥頭髮到耳後 | `one hand lightly tucking a strand of hair behind her ear` | 入池；標記 Z-Image 全身景別可能被拉近，待補圖 |
| 雙手插前口袋 | `both hands slipped into her front pockets`（原「雙拇指勾口袋」0／3 正確，已改寫） | 入池（第二輪 14／14 正確，2026-10-18）；需穿搭有口袋（`needsPockets`） |

## 7. 神情

- **表情**：情緒加強度，沿用現有表情目錄，另增「自然隨性的表情」選項（交給模型）。
- **視線**：看鏡頭、看向遠方、低頭、回眸。唯一的相容規則是視線和鏡頭方位不能矛盾（例如背面時只能回眸）。
- 頭部方向併入視線，不再獨立成一層。
- P4 實作（2026-10-20）：視線選項為全無／隨機／看鏡頭／看向遠方／低頭／回眸，英文沿用既有頭部選項；表情目錄不變，「自然隨性的表情」尚未加入。細節見[實作計畫 §7](expression-pose-v2-implementation-plan.md)。

## 8. 自由組合的簡化（另訂細節）

方向已確認：保留自由組合給需要細部調整的情況，但要簡化。實作前另行規劃，候選做法：
- 道具併入手部（道具本來就佔用雙手）。
- 加入部位佔用檢查，手動選擇也生效：不相容的選項變灰或顯示警示。
- 退出隨機池：隨機只從指定動作抽。

## 9. 組合句型（2026-10-17 定案）

所有主要輸出使用同一個句型，不再拼接片段：

> {姿勢子句，依景別取用}, with {手部片語}. {視線片語}, {表情片語}.

範例（實驗條件 A）：`She presents a relaxed neutral standing posture, with one hand resting on her waist and the other hand relaxed at her side.`

實驗中，GPT 對舊句型（先寫手、手部描述含糊）畫成插口袋，對新句型則準確畫出扶腰；MJ、Nano 同分；Z-Image 本身不太照做扶腰，與句型無關。因此採用「先姿勢、後 `with` 手部」。手部描述要具體，避免「腰或髖部附近，或靠著支撐面」這類含糊寫法。

MJ 使用同一組子句，精簡方式只靠子句取捨，不再用正規式壓縮。

## 10. 隨機

1. 依場景能提供的支撐物（地面、椅子、牆、床）與鏡頭設定，篩選相容的指定動作。
2. 只從 `validation.status: accepted` 的動作抽，依氛圍標籤加權。
3. 手部為 `free` 時，依 §6 處理；表情從與動作氛圍相符的表情中抽。

這會改變現行「批次隨機會清除指定動作」的行為（指定動作 v1 §接管與保存契約），需要在實作規格中更新。

**P2 實作（2026-10-19）**：
- 「隨機」在生成一開始解析成一個具體動作（`resolveRandomSpecifiedAction`，用一次 random），結果、選擇快照與 Saved Cards 都記錄該動作，還原時是同一個動作。
- 抽選池：`validation.status: accepted` 且家族不是躺姿（躺姿等 P3 場景表面完成後加入）；鎖定的機位與動作注視方向衝突時排除；雙人或固定場景人物位置時解析為全無。氛圍加權與場景支撐物篩選尚未實作。
- 姿勢區或全域「全部隨機」：`specifiedActionId` 設為 `random`；自由組合的基底、方向、肢體、手部、接觸設為全無；頭部仍隨機（P4 改為視線）；道具維持原值。
- 「全無」與未選（預設，Cooper 決定）不寫姿勢，不再從舊「姿勢與肢體語言」目錄抽；明確鎖定的舊姿勢仍可還原。

## 11. 相容

- `specifiedActionId` 與 v1 的 8 個 ID 不變；舊 Saved Cards 照常還原。
- 自由組合的舊選項保留 ID，退出公開清單或隨機池時，依現行 uiHidden 慣例保留還原能力。
- 指定動作英文改為子句後，舊的完整英文加入 `legacyPromptAliases`，舊卡片文字仍可匯入。
- 資料格式之後可直接併入 [目錄資料架構 v1](catalog-data-architecture-v1.md) 的正式 schema。

## 12. 推進順序

| 階段 | 內容 | 前置條件 |
| --- | --- | --- |
| P0 | 手部寫法實驗 | 無（[實驗包](../reports/pose-hand-experiment-2026-10-17/README.md)已備妥） |
| P1 | 資料格式 v2：現有 8 個動作切成子句、加上新欄位；裁切改用子句 | P0 確認句型 |
| P2 | 手部自由模式＋通用手勢池 | P0、手勢池文案核准 |
| P3 | 補站姿、蹲姿的指定動作 | P1；動作內容由 Cooper 定稿 |
| P4 | 隨機改從指定動作抽 | P3；動作完成驗收 |
| P5 | 自由組合簡化 | 另訂規格 |
| P6 | 雙人指定動作 | 另訂規格 |

每個階段都會改變公開 Prompt，依 AGENTS.md 先補 fixture、同 seed 比對、strict audit 與瀏覽器驗收。

## 13. 待決事項

1. 承重說明子句的去留（§5.4）。
2. 通用手勢池其餘文案（§6）；第一批 4 句已依實驗結果處理，口袋手勢第二輪已通過。
3. 自由組合簡化的細節（§8）。
4. 站姿、蹲姿第一批動作的內容（P3）。
