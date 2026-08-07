# PAGE1 Midjourney 比例與人物姿勢適配規範

Last updated: 2026-08-07

Status: Active implementation. 本文件的比例／鏡頭 derived context 已接入 production renderer；姿勢 canonical text 仍依既有 shared contract 逐字重用。

## 1. 目的與範圍

本規範處理 PAGE1 歷史公開欄位 `AI` → `midjourneyPrompt` 的 Midjourney-native 描述優化，目標是降低畫布比例、人物取景、姿勢關係與變形鏡頭同時存在時的人體扭曲。

本規範只負責：

- 依已解析的構圖與比例，決定 Midjourney Prompt 應採全身、自然裁切或上半身語意。
- 將已存在的姿勢描述整理成可視覺化、互不矛盾的自然英文句子。
- 分離「資料中選到的服裝／姿勢」與「在目前畫面中必須看見的部位」。
- 保留既有成像、鏡頭、場景、光線與參數尾段契約。

本規範不負責：

- 改寫 Gpt（`grokPrompt`）或 Grok/Z-Image（`zImagePrompt`）。
- 取代既有 `compositionVisibilityContract`、Pose Composer canonical pose 或 Body Type projection。
- 修改 `locks`、Saved Cards、匯入／匯出 payload、Storage key、公開 option ID 或 renderer output field。
- 自動新增 Pose Modifier、隱藏姿勢控制或新的 Pose Composer 選項。
- 保證 Midjourney 精確重現關節角度、手指、臉部朝向或參考圖姿勢。

實作時應先讀：

- [PAGE1 單人 Prompt 輸出撰寫規範](page1-single-prompt-compression-guide.md)
- [Photography Section D authoring guide](photography-section-d-authoring-guide.md)
- `webapp/src/lib/engine/promptOutputContracts.js`
- `webapp/src/lib/engine/representativePromptFixtures.js`
- `webapp/src/lib/engine/compositionVisibilityContract.js`
- `webapp/src/lib/engine/poseComposerCompatibility.js`

## 2. 官方依據與專案推導的區分

### 官方明確定義

Midjourney 官方文件提供的是一般 Prompt 與構圖原則，不是正式的人體姿勢語法：

- [Prompt Basics](https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics) 建議使用簡短、清楚、具體的視覺描述，描述想看到的內容，避免長篇操作指令與互相混淆的清單。
- [Aspect Ratio](https://docs.midjourney.com/hc/en-us/articles/31894244298125-Aspect-Ratio) 將比例定義為寬幅或直幅的構圖設定；16:9 是寬幅，9:16 是直幅，極端比例可能產生不可預期結果。
- [Image Prompts](https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts) 說明參考圖會影響內容與構圖，並建議參考圖接近最終比例；參考圖是引導，不是精確複製。
- [Character Reference](https://docs.midjourney.com/hc/en-us/articles/32162917505293-Character-Reference) 的範例以 `sitting in a cafe` 等自然可見動作描述人物，而不是使用「把這個人放到某處」的操作語句。
- [Omni Reference](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference) 要求參考圖搭配清楚的文字 Prompt，並說明文字仍負責傳達參考圖之外的場景與細節。

### 本專案的實作推導

以下規則是根據官方原則、目前專案構圖投影契約與實測結果整理出的實作規範，不宣稱是 Midjourney 官方語法或官方保證：

- 16:9、4:3 等寬幅比例不應自動要求人物 `full-body` 或 `head-to-toe`。
- 自然裁切是合法的構圖結果；應優先保護姿勢可辨識的部位與可見關節，而不是強迫人物完整塞入畫面。
- `full-body`、`waist-up`、`close-up` 等 framing 詞不是同義詞，同一個 Prompt 只使用一個主要 framing 意圖。
- 姿勢應描述最終畫面中可看見的身體關係；不能用內部控制語、未決定選項或否定指令代替姿勢描述。

## 3. 與既有構圖可見性契約的關係

本規範的派生適配層位於既有 `compositionVisibilityContract` 之後、`midjourneyPrompt` 最終文字組裝之前。它不取代現有 bucket，也不改寫原始 selection。

既有 bucket 仍是來源真相：

| 既有 bucket | Midjourney 適配方向 |
| --- | --- |
| `faceDetail`、`headShoulders` | 省略姿勢；不新增身體動作或畫面外肢體。 |
| `chestUp` | 聚焦頭、肩、上半身與畫面內手部；不要求腳或鞋子出現。 |
| `mediumWaist` | 保留上身、手、道具與坐／站基底；可採腰部或大腿上緣自然裁切。 |
| `cowboyKnee` | 保留至膝部的姿勢與承重關係；不要求鞋子完整出現。 |
| `fullBody` | 沿用完整全身契約；單人全身角色照仍固定 `9:16` 並完整到鞋子／配件。 |
| `unconstrained` | 不額外推測裁切；沿用來源構圖與已解析姿勢。 |

重要區分：

- 原始服裝、姿勢、角色卡與場景選擇永遠保留在 resolved selection、Saved Cards 與 restore 資料中。
- Prompt 是否要求某個部位「可見」由當前 framing 決定；服裝資料存在，不代表鞋子、裙襬或腿部必須在中景中出現。
- `fullBodyCharacterPrompt` 不使用本規範的自然裁切策略，仍然使用完整服裝、完整身形與固定 `9:16`。

## 4. Framing 與比例適配規則

### 4.1 主要 framing 只能有一個

每個 Midjourney Prompt 必須先選擇一個主要 framing 意圖：

```text
full-body composition
natural-crop portrait
upper-body portrait
environmental portrait
```

不得在同一個 Prompt 同時輸出互斥詞組，例如：

```text
full-body portrait, waist-up portrait, close-up
```

### 4.2 自然裁切必須指定裁切錨點

`natural crop` 不能單獨作為模糊控制語。應選擇一個可視化裁切錨點：

```text
waist-up portrait
framed from mid-thigh upward
framed from head to below the knees
lower legs naturally cropped by the frame
```

裁切錨點的目的不是保證像素級裁切，而是告訴模型哪些部位屬於畫面主要內容、哪些部位可以自然出框。

### 4.3 比例預設方向

- `9:16`：若來源 framing 是 `fullBody`，可以保留完整全身；若來源是中景或上半身，不得為了直幅比例強行加入全身。
- `4:3`：坐姿、魚眼或大幅肢體動作預設採 `three-quarter seated portrait`、`medium-full portrait` 或明確的膝部裁切，不自動加入 `head-to-toe`。
- `16:9`：預設採 `medium shot`、`three-quarter portrait` 或 `environmental portrait`，允許腿部、手臂或下緣自然出框；只有來源明確要求全身時才使用完整全身語意。
- 若來源明確要求全身，不能為了比例適配偷偷改成半身；應保留全身要求並透過較穩定的站姿、中央構圖與合理留白處理。

## 5. 姿勢正規化規則

姿勢由以下五個欄位組成，順序固定為：

```text
posture
torso and hip direction
head and gaze direction
hand anchors
leg arrangement
```

### 5.1 姿勢必須是可見的最終畫面描述

建議：

```text
seated beside the cart, torso angled away from the camera,
head turned gently back toward the camera,
right hand resting on the cart frame,
left hand resting on the upper thigh
```

禁止把姿勢寫成：

```text
make the character pose naturally
preserve the selected pose
controlled by pose selection
```

這些屬於內部操作或控制語，不應進入公開 Prompt。

### 5.2 不保留未決定的替代方案

姿勢輸出不得留下：

```text
both hands along the body or on a nearby support surface
```

應在 resolved pose 階段決定一個具體支點，例如：

```text
right hand resting on the cart frame, left hand resting on the upper thigh
```

不得由 renderer 自行在不同輸出中隨機選擇另一個動作。

### 5.3 回頭與三分之四角度

當來源同時包含「背向／後右三分之四」與「看向鏡頭」時，改寫為身體與頭部的兩層關係：

```text
torso and hips angled away from the camera, head and shoulders gently turned back over the right shoulder toward the camera
```

不可同時堆疊模糊的 `rear-right three-quarter view, facing camera`，除非來源本身已提供明確的回頭 canonical pose。

### 5.4 坐姿與腿部

`seated` 與 `both legs extended` 必須補足腿部排列，避免模型自行合併或交叉：

```text
both legs extending forward in parallel, knees softly bent,
one leg slightly ahead of the other, ankles naturally separated
```

若 framing 不包含膝部或小腿，不得額外要求腳、腳踝或完整腿部可見。

### 5.5 沒有姿勢來源時不得發明複雜姿勢

比例適配層不能僅因為 `16:9` 或 `4:3` 就新增站姿、坐姿、手部位置或腿部排列。若來源沒有有效姿勢：

- Pose Composer 啟用時，使用既有 projected canonical pose；
- Pose Composer 未啟用時，沿用目前 renderer 的省略或既有 authored neutral description；
- 不得為了填滿 Prompt 而新增未經選擇的動作事實。

## 6. 鏡頭、風格與姿勢的衝突處理

### 6.1 變形鏡頭

魚眼、廣角或其他變形鏡頭可以保留，但不能讓鏡頭描述與畫面邊緣的肢體安排互相放大衝突。

優先使用可視化構圖描述：

```text
fisheye perspective, subject kept near the center of the frame
```

不得在沒有來源依據時把 `fisheye` 靜默改成普通鏡頭、刪除鏡頭身份，或加入內部語句 `avoid distortion`。`moderate fisheye` 只有在來源或專案契約明確提供強度語意時才能使用。

### 6.2 單色語意與彩色燈光

若來源同時選到單色影像語意與暖色／霓虹色彩，應將它們整理成一個可共存的視覺句，而非任意刪除其中一方，例如：

```text
high-contrast monochrome-influenced shadows with warm color rendering and restrained neon cross-processed highlights
```

這種改寫只調整語法關係，不得新增未選擇的景深、散景、模糊或電影化效果。

### 6.3 風格與姿勢的優先順序

當姿勢結構與相機幾何／風格效果衝突時，優先順序為：

1. 已解析的人物身份與服裝來源。
2. 已解析的 canonical pose 與可見身體關係。
3. framing 與裁切錨點。
4. 相機幾何：camera angle、orbit 與 focal-length behavior。
5. 場景、光線與承重／接觸關係。
6. 鏡頭變形、散景、色彩與其他風格效果。

這個順序不是要刪除低順位來源，而是要求低順位效果不得迫使高順位的人物結構失去可辨識性。

### 6.4 各焦段與特殊鏡頭的結構風險

焦段本身不是單獨的人體變形開關；實際風險通常來自焦段所暗示的工作距離、人物與鏡頭的近遠關係、畫面邊緣位置，以及 camera angle／framing 的組合。Renderer 不得因為焦段風險而靜默刪除或替換已選的 `lensId`，只能加入與來源一致的構圖語意。

專案目前鏡頭選項應依光學行為分組處理：

| 光學行為 | 現有選項 | 人體／構圖風險 | Midjourney 適配規則 |
| --- | --- | --- | --- |
| `wide_expansion` | 20mm、24mm | 近處臉、手、腳或腿部被放大；畫面邊緣容易拉伸。 | 人物與重要肢體優先位於中央構圖；保留空間透視，但不要同時把多個關節推向鏡頭或邊緣。 |
| `natural_wide` | 28mm、35mm | 輕度透視延展，人物比例通常較穩定。 | 適合環境人像與中景；使用 balanced subject-environment relationship，不需額外加入強烈變形防護語。 |
| `neutral_perspective` | 50mm | 幾何變形低，是姿勢與人體結構的比較基準。 | 保留 neutral perspective、natural subject proportions；不得額外加入 compression、edge stretching 或 fisheye 語意。 |
| `telephoto_compression` | 85mm、105mm、135mm | 空間層次被壓縮，前後肢體距離感變弱；與近距離伸手入鏡等描述互相衝突。 | 保留 distant working distance、narrow field of view、compressed spatial layers；不要同時描述 limbs reaching close to the lens 或近距離廣角式透視。 |
| `close_focus_detail` | Macro | 近距離放大與極薄焦平面容易把局部身體細節放大；與完整全身姿勢衝突。 | 聚焦已可見的臉、手、材質或局部身體細節；若來源 framing 是全身，不得偷偷改成近拍，只能把衝突記為 fixture／診斷。 |
| `barrel_distortion` | Fisheye | 桶狀變形、邊緣彎曲、近處物體誇張放大。 | 人物放在中央；重要肢體與關節不要同時位於極端邊緣；只有來源明確要求時，才描述手腳接近鏡頭。 |
| `plane_control` | Tilt-Shift | 主要影響垂直線與焦平面，不是人體幾何變形；選擇性焦平面可能讓人物局部失去完整可讀性。 | 保留 corrected vertical lines、controlled focus plane、selective plane-of-focus；不得把 Tilt-Shift 自動轉成廣角、魚眼或人體變形語意。 |
| `anamorphic_optics` | Anamorphic | 水平壓縮、寬幅邊緣特性與 flare／橢圓散景可能搶走邊緣肢體注意力。 | 16:9 可與 Anamorphic 共存；人物主要結構優先保持在中央，並對 `anamorphic lens` 與 `anamorphic flare` 做語意去重。 |

鏡頭原始英文身份必須保留。上述適配句是 framing／空間關係的補充，不是用 `moderate`、`natural` 或其他新形容詞擅自改寫使用者選到的鏡頭。

### 6.5 鏡頭 × framing × camera angle 的高風險組合

以下組合屬於品質風險分類，不是自動清除或禁止使用的 UI 相容規則：

| 組合 | 風險 | 處理方向 |
| --- | --- | --- |
| 20／24mm + `16:9` + `fullBody` + 動態伸展 | 近處肢體放大、邊緣拉伸與畫布高度不足同時發生。 | 保留全身要求，但優先使用中央穩定姿勢與較少向鏡頭伸展的肢體；不得把 full body 靜默改成半身。 |
| 20／24mm + 地面高度／蟲眼 + 手腳靠近鏡頭 | 透視延展與低角度放大效果疊加。 | 只有來源明確指定近鏡頭動作時才保留；否則保持重要關節在中央構圖。既有蟲眼相容規則優先。 |
| Fisheye + rear／three-quarter seated pose + 延伸雙腿 | 身體扭轉、腿部深度與桶狀邊緣變形容易同時失控。 | 明確分離 torso direction、head direction、hand anchors、leg arrangement；採膝部附近自然裁切時，不強迫鞋子可見。 |
| 85／105／135mm + `close foreground action` | 長焦壓縮與近距離動作語意互相矛盾。 | 保留長焦身份與 distant working distance；將動作改寫為畫面內可見的手部或上半身關係，不新增伸入鏡頭的肢體。 |
| Macro + `fullBody` 或大幅環境構圖 | 近拍放大與完整人物／環境比例互相衝突。 | 保留來源選項並標記為高風險 fixture；不得用 Macro 自動替換 lens 或 framing。 |
| Tilt-Shift + 人物主體位於畫面邊緣 | 焦平面控制與透視修正可能讓人物局部失去可讀性。 | 保留垂直線修正與焦平面描述；人物重要身體結構優先放在清晰焦平面內。 |
| Anamorphic + `16:9` + Anamorphic Flare | 寬幅、邊緣 character、水平 flare 可能重複搶取構圖權重。 | 保留 lens 與 optical effect 身份，但合併重複的 oval bokeh／horizontal flare 描述。 |

高風險分類只用來決定 derived context 與 regression coverage，不得直接改動 raw selection、lock、Saved Card 或 Prompt 公開欄位。

## 7. Midjourney Prompt 輸出契約

Midjourney 描述區塊仍採現有順序：

```text
image type → composition/framing → subject → wardrobe → projected canonical pose → scene/lighting → imaging
```

規則：

- 只輸出一個 Midjourney-native 描述區塊。
- 先完成 framing、姿勢與可見性適配，再做既有 AI 字數與語意壓縮。
- 不輸出 `Pose:`、`Scene:`、`Lighting:` 等內部 section label。
- 不輸出 `make sure`、`preserve`、`avoid distortion`、`controlled by selection` 等內部控制語。
- 不為了自然裁切加入未選擇的 `bokeh`、`shallow depth of field`、`softly blurred background` 或其他新視覺事實。
- 參數尾段仍由既有 canonical assembler 負責，必須位於最終描述之後；描述文字不可出現在參數後方。

## 8. 實作資料邊界

第一階段只允許在 renderer 前建立非持久化的 Midjourney derived context，例如：

```js
{
  framingIntent: 'natural_crop',
  cropAnchor: 'head_to_below_knees',
  posture: 'seated',
  torsoDirection: 'rear_right_three_quarter',
  gazeDirection: 'back_toward_camera',
  handAnchors: ['support_surface', 'upper_thigh'],
  legArrangement: 'forward_parallel_soft_bend',
  lensBehavior: 'barrel_distortion'
}
```

`lensBehavior` 只表示光學行為分類，不取代 `lensId`，也不表示 renderer 可以改寫原始鏡頭英文。這些欄位是 renderer 內部的派生資訊，不得直接成為新的 Storage schema 或取代既有選項。若未來需要讓使用者編輯或保存，必須另開相容性設計與 migration 評估。

## 9. Regression fixtures 與驗證

實作與回歸驗證至少涵蓋以下 deterministic fixtures：

1. `16:9` 寬幅站姿：允許自然下緣裁切，不強制 `full-body`。
2. `4:3` 坐姿魚眼：後右三分之四、回頭看鏡頭、明確手部支點、雙腿向前延伸。
3. `9:16` 全身角色：確認既有完整頭部到鞋子／配件契約不被自然裁切規則改寫。
4. `mediumWaist`：確認鞋子與低處支撐保留於來源，但不被要求在畫面中可見。
5. 無姿勢來源：確認 framing 適配不會發明複雜姿勢。
6. Pose Composer：確認三個主 renderer 逐字共用 projected canonical pose。
7. 魚眼與暖色／單色風格衝突：確認鏡頭身份與色彩來源都保留，且不新增景深效果。
8. 20／24mm 寬角與 50mm 標準鏡：確認 wide expansion、neutral perspective 分類與構圖補充不會互換鏡頭身份。
9. 85／105／135mm 長焦：確認 compression 語意不會新增近鏡頭肢體，也不會刪除長焦來源。
10. Macro、Tilt-Shift、Anamorphic：確認特殊鏡頭各自保留 close-focus、plane-control、anamorphic 語意，且不共用魚眼防護句。
11. 高風險組合矩陣：確認 20／24mm、Fisheye、長焦、Macro 與 framing／angle 的組合只產生診斷與 derived context，不清除任何 raw selection。

驗證順序：

- 先跑相關 prompt／composition／pose focused tests。
- 使用固定 seed 與相同生成數量執行 `scripts/validate_prompt_logic.mjs` 前後比較。
- 執行 `npm run test:prompt-quality`，確認四輸出契約、representative fixtures、參數尾段與控制語檢查。
- 必要時執行 `npm run audit:prompts:strict`，將新增發現與既有 heuristic wardrobe findings 分開判讀。
- 若 production renderer、Prompt UI 或下游 consumer 有變更，再依 `AGENTS.md` 執行 frontend full gates 與 browser validation。

文件本身的新增階段只需要做 Markdown link/path review 與 `git diff --check`；不能以文件檢查結果宣稱 renderer 已完成實作。

## 10. 實測基準 Prompt 的定位

本規範採用的兩組人工實測方向是：

- `16:9` 寬幅人物：使用中景／三分之四構圖，允許下半身自然出框，保護頭肩與手部輪廓。
- `4:3` 坐姿魚眼人物：使用膝部附近自然裁切，明確描述軀幹、回頭方向、雙手支點與腿部排列。

這些 Prompt 是 regression fixture 的語意基準，不是新的資料庫 option、Pose Composer 選項或固定 fallback 文案。正式 renderer 實作時，仍必須從同一份 resolved selection 與既有 shared structured model 產生，不得把人工測試 Prompt 直接硬編碼成所有人物的公共描述。
