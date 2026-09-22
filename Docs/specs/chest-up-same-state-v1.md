# 胸上衍生輸出：同一拍攝狀態 v1

Last updated: 2026-09-22

Status: 本次使用者核准的實作契約。範圍為 `chest-up-portrait` 與 `chest-up-mj-portrait`；主 Gpt、Z-Image、MIDJOURNEY、全身角色照、選項解析與儲存 schema 不改。

## 目標

兩組胸上輸出從同一次解析完成的人物、姿勢、服裝、場景、光線與攝影來源重新建立胸上模型，只改變固定 `4:5` 與胸上可見範圍。GPT 胸上採用主 GPT 的有效攝影規則；MJ 胸上採用主 MJ 的有效攝影規則。不同 renderer 既有的表達契約仍然保留。

本契約取代先前「胸上不繼承一般主 GPT 相機／環境光規則」、「MJ 胸上沿用舊組裝並保留主 MJ 已省略的風格／底片」及「MJ 胸上人物與場景取自主景別已裁減模型」的邊界。歷史文件與 baseline 保留作追溯，不代表現行胸上行為。

## 保留與裁切規則

| 層級 | 現行規則 |
| --- | --- |
| 來源解析 | 同一次 resolved selection；不再次抽選、不修改原 locks、不消耗額外 RNG。 |
| 比例與景別 | 兩組文字都固定 `4:5`、`Chest-up portrait`；不要求正面或雙肩同時完整可見，保留原有效 orbit。原主比例與 F 比例仍保存。 |
| 人物 | 從原人物來源投影胸部可見體態；臉、髮型、表情與身份沿用原來源。MJ 不再繼承主景別已省略的體態，也不帶入腰臀全身 anchor。 |
| 服裝 | 沿用原服裝、配色與可見上身細節；省略下身、鞋襪與不可見的下襬穿法，不重新配衣服。 |
| 姿勢 | 兩組共用同一胸上 canonical pose。保留 standing／sitting／kneeling／squatting／lying 狀態、可見頭部／上身／手部動作。腿腳幾何仍依原胸上投影省略；不把蹲姿改成無狀態的一般上身姿勢。 |
| 手動坐姿物件 | 保留九個已明確選定的坐姿物件，作為同一姿勢的環境上下文；不要求整件物體入鏡、不新增材質與承重細節。 |
| 躺姿 | 保留仰躺／側躺／趴臥方向；既有 supine surface-led 表面與濕潤描述契約保持。 |
| 場景 | 一般場景從 resolved source 取得完整身份與線索，不再先取前三片語或繼承主 crop 的刪減。各 renderer 依自己的主輸出規則做方向性投影或壓縮，不新增景深與背景。固定構圖仍保留原場景錨點、去除與胸上衝突的固定距離。 |
| GPT 攝影 | 一般單人胸上沿用主 GPT 的已審查相機幾何、環境光及方向性 Scene／Lighting 規則，使用胸上 bucket；不複製主全身鏡頭的要求。角色卡、專用角色、固定構圖、身份匯入與 supine surface-led 保留各自主輸出的排除規則。 |
| MJ 攝影 | 從胸上模型套用主 MJ 的同模式組裝與鏡頭適配。一般單人場景先行、姿勢先於服裝，省略 style／film prose 並保留光圈與快門；排除模式繼續沿用其主 MJ 政策。 |
| 浴室鏡像 | 一般單人兩組胸上繼承同一人物鏡像描述；全身角色參考照與原排除模式不引入此描述。 |
| F 參數 | live preview 同步更新主 MJ 與 MJ 胸上的 version、Raw、Stylize、Chaos、Weirdness、解析度；胸上比例固定 `--ar 4:5`。只更換尾段，不重抽來源。 |
| Saved Cards | 收藏／Markdown 保留已生成文字與同一 selection。舊收藏不批次改寫；回填重新生成時使用新規則。 |

主 GPT 與主 MJ 之間本來存在完整保留／精簡的差異，本批不改變這些主輸出。全身角色照仍是獨立角色參考照用途。

胸上姿勢的來源限定補充：`both-hands-rock-horns` 保留肩旁雙手的完整原文；`standing-pelvis-back-curve` 只保留原文中的 `upper torso only slightly inclined forward`，不帶入骨盆、下背與腿部幾何。這兩項補充僅套用於胸上衍生輸出，不改主輸出的既有裁切政策。

上身圖案後續修正：MJ 胸上與主 MJ 共用的上衣精簡現在保留已選且在投影來源中的圖案片段；半臉／全臉等主近景也保留明確選定的圖案來源，供兩組胸上輸出使用。詳見 [穿搭撰寫規範 §9.2](wardrobe-section-b-authoring-guide.md#92-圖案)。此後續版本的 public output contract 為 `1.18.0`，MJ description contract 為 `1.9.0`；下方 `1.17.0` 為前一批同狀態修正的歷史版本。

## 實作與回歸

- `fixedFramingDerivedPrompt.js`：胸上 preset、比例與同狀態標記。
- `engine.js`：胸上姿勢／場景投影，以及 GPT／MJ 各自的主輸出政策銜接。
- `features/page1/midjourneyParameterState.js`：同步 MJ extra prompt 的 F 尾段。
- Public output contract `1.17.0`；fixed-framing contract `4`；Z 契約維持 `1.16.0`。
- `chestUpSameState.test.js`：比例、攝影、主 crop 獨立性、九個坐姿物件、蹲跪躺姿與 live F／save restore 回歸，加入 Prompt Quality gate。
- 歷史矩陣仍用原 baseline 驗證四個受保護輸出；新 `chestUpSameStateBaseline.json` 僅作本次胸上修訂的 scoped gate，另釘住所有矩陣的主輸出、selection 與 RNG。
- `scripts/capture_chest_up_same_state_baseline.mjs <pre-change-checkout>` 產生 scoped baseline 時，先要求前後四個受保護輸出、selection、RNG 完全相等。不可僅為消除失敗而重錄。

## 驗證邊界

固定種子只使程式輸出可比較；程式回歸與瀏覽器驗證不等於外部影像模型的實際生圖驗收。外部比較須保留同模型、設定、參考圖與 Prompt 對應，檢查身份、姿勢狀態、環境、光色與成像是否一致，再評估裁切效果。
