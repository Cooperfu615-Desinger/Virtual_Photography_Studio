# PAGE1 單人 Prompt 輸出撰寫規範

Last updated: 2026-08-14

這份文件整理 PAGE1 單人模式下 `Gpt` / `Grok/Z-Image` / `AI` 三組輸出的 prompt 撰寫規則。自 2026-07-03 起，`Gpt` 改為完整保留型輸出，不再以壓縮為目標；`Grok/Z-Image` 與 `AI` 仍可依各自模型需求維持自然語言壓縮。新增或修改 A 人物設定、B 神情姿態、C 穿搭設定資料時，請先依照對應 authoring guide 檢查欄位責任，再用本規範確認三組輸出的取向。

Midjourney 專用的比例、裁切與人物姿勢適配規範另見 [PAGE1 Midjourney 比例與人物姿勢適配規範](midjourney-framing-pose-adaptation.md)。目前已接入的 renderer 行為僅限該文件明確標示的 Midjourney derived context；不得把內部派生欄位當成新的 storage schema，也不得把姿勢規範解讀為 AI-only 改寫 canonical pose。

## 1. 三組輸出定位

### Gpt

- Internal field: `grokPrompt`
- Target: ChatGPT Image / GPT Image
- 格式：結構化自然段落。
- 新定位：`GPT Full-Fidelity Prompt` / `GPT 完整保留型 Prompt`。
- 目標：完整保留 PAGE1 工作台中被選到、並經共用構圖可見性投影判定為有效的英文描述，優先保留生成穩定性、造型鎖定與細節完整度。原始選擇必須完整保存，不可用景別裁切覆寫或清空。
- 固定主區塊順序：`Image Type`、`Subject`、`Wardrobe`、`Pose and Composition`、`Scene`、`Lighting`、`Camera Look`、`multi-cut sequence n=2`。
- 不輸出 `Constraints`。
- 結尾必須保留 `multi-cut sequence n=2`。
- 不做語意壓縮：不把長句縮成短片語，不刪除原本有視覺或控制意義的資訊。
- 允許格式整理：清理空白、標點、markdown 符號、空值，並放入正確 section。
- 單人特殊穿搭會把內建人物特徵移入 `Subject` 的 `Hair and body details` 子區塊；`Wardrobe` 則使用 `Full outfit` 與 `Headwear, eyewear, and bag` 子區塊。分類時只搬移內容；只有共用構圖可見性投影可排除畫面外 fragment，各 renderer 不可再自行判斷一次。
- 單人角色卡的 `Subject` 可用子區塊幫助人工微調：`Character Profile Card`、`Identity and body`、`Hair`、`Outfit`、`Accessories`、`Photographic direction`。

### 三組共用的構圖開頭（2026-07-12 已實作）

- 成品類型先輸出一個短句，例如 `Create a photorealistic editorial portrait.`；會依 PAGE1 的成品類型切換為對應的廣告、插畫或油畫描述。
- 三組輸出共用同一條精簡構圖句，格式為：`[景別], [俯仰角度], [環繞角度]`，例如 `Chest-up portrait, eye-level view, front-left three-quarter view`。
- 構圖句位於人物主體句之前，讓模型先讀到畫面範圍、相機高度與人物朝向；未選擇的控制不輸出。
- 構圖英文只保留幾何重點：`chest-up portrait`、`eye-level view`、`front-left three-quarter view` 等，不再重複完整資料庫長句。
- `Gpt` 保留 `Image Type` 區塊；`Grok/Z-Image` 與 `AI` 使用自然空行段落，但三者的構圖句來源與內容一致。
- UI 的環繞角度只顯示 `正面`、`左前`、`左側`、`左後`、`背面`、`右後`、`右側`、`右前`；內部 numeric ID 與舊儲存格式維持不變。

### 共用構圖可見性契約（2026-07-18 第一至第六階段）

第一階段先把構圖可見性定義為機器可讀契約與 deterministic regression fixtures。第二階段已將 PAGE1 景別切換改為非破壞性狀態：近景可停用畫面外控制項，但不得清空 UI locks、`vps.locks`、generated selection 或 Saved Cards restore 需要的來源值；`全身角色照` 直接使用完整 resolved wardrobe。第二階段同時啟用 `faceDetail` 的第一個 runtime 邊界。第三階段將同一份 wardrobe projection 接到 `headShoulders`、`chestUp`、`mediumWaist` 與 `cowboyKnee`，讓 Gpt、Grok/Z-Image、AI 共用相同的服裝角色與區域判斷；一般上下身、連身、套裝、特殊穿搭、角色卡與雙人服裝都先投影，再由各 renderer 排版或壓縮。第四階段啟用 Pose Composer projection：三組主 Prompt 先共用同一段投影後 canonical pose，再由 renderer 處理外層排版。第五階段啟用共用 scene projection：三組主 Prompt 都從同一份投影後場景資料組合輸出；共享資料在近景保留前三個原始場景線索，中景與牛仔景保留前五個，全身與未限制景別恢復完整來源。Grok/Z-Image 與 AI 仍可依各自既有契約對投影後資料再做可追溯刪減，但不得回讀完整來源或新增場景事實；固定構圖集維持原本的專用場景契約。第六階段完成整合收尾：服裝、舊版非 Pose Composer 姿勢與場景 renderer 都直接讀取同一個 canonical composition projection，移除永遠為空的近景服裝／場景橋接與 `Wardrobe Visibility`、`Scene Context` fallback；所有十六組構圖 fixtures 進入 `test:prompt-quality` 的阻擋式整合回歸。固定構圖集、雙人自然構圖與舊版姿勢文字仍保留各自需要的排版或相容處理，但不可再自行判定另一套景別 bucket。

| 公開景別 | 內部 bucket | 穿搭可見性 | 姿勢可見性 | 場景可見性 |
| --- | --- | --- | --- | --- |
| `局部五官特寫`、`臉部特寫` | `faceDetail` | 頭部配件、眼鏡、耳環 | 完全省略 canonical pose | 原場景來源可追溯地壓成一句，不加景深效果 |
| `半臉傾斜特寫`、`特寫鏡頭 (Close-Up)` | `headShoulders` | 上衣／連身服的領口與肩部、外套肩部、頭頸配件 | 完全省略 canonical pose | 原場景來源可追溯地壓成一句，不輸出互動幾何或支撐物 |
| `胸上特寫` | `chestUp` | 上衣、連身服上半部、外套與頭頸配件 | 只保留頭、肩、上半身；手、道具、支撐只在畫面可見時保留 | 原場景來源可追溯地壓成一句，只保留畫面內支撐物 |
| `中景鏡頭 (Medium Shot)` | `mediumWaist` | 上衣、外套、褲裙身分與腰部細節 | 保留上身、手、道具與坐／站基底；支撐只在畫面可見時保留 | 使用原場景的精簡描述與可見空間關係 |
| `牛仔中景 (Cowboy Shot)` | `cowboyKnee` | 上衣、外套、褲裙；大腿襪依實際可見區域保留；鞋子移除 | 保留至膝部的姿勢；支撐與承重只保留可見部分 | 使用原場景的精簡描述與可見支撐物 |
| `全身鏡頭 (Full Body Shot)` | `fullBody` | 完整服裝、鞋襪、包與配件 | 完整 canonical pose | 完整原場景描述 |
| `全無` 或沒有景別 | `unconstrained` | 不做構圖裁切 | 不做構圖裁切 | 不做構圖裁切 |

構圖投影的共同規則：

- 景別只影響公開 Prompt 的有效內容，不得改寫 `locks`、Saved Cards、restore payload 或瀏覽器儲存的原始選擇。切回較寬景別時，先前服裝、姿勢、接觸／支撐、場景、角色卡與身形都必須仍在。
- `Gpt` 的完整保留定義為「完整保留投影後的有效內容」，不是在近景中輸出畫面外的腿部、鞋子、低處支撐或空間幾何。
- Pose Composer 先依景別產生 projected canonical pose。只要姿勢仍有效，三組主 Prompt 必須逐字共用；`faceDetail` 與 `headShoulders` 的 projected canonical pose 為空，因此三組都省略姿勢段落。
- 接觸／支撐物與接觸動作視為同一組語意。若支撐點不在畫面內，物件、接觸位置、承重描述與相關場景幾何必須一起移除，不可留下迫使模型擴大構圖的殘句。
- 連身服、長裙、長外套與完整套裝需分離「服裝身分」和「區域細節」。近景可以保留可見的領口、上衣或裙裝身分，但不可保留 `short hem`、`ankle-length`、鞋襪等畫面外細節。
- 場景壓縮只能刪減或合成原始場景描述，必須保留地點身分與代表性來源 anchor；不可新增 `softly blurred`、`bokeh`、`shallow depth of field`、`faint shapes` 等未選擇的景深或模糊描述。
- 背景是否淺景深由光圈／景深、焦段、光學效果與拍攝距離等攝影控制決定，不屬於場景投影責任。
- `fullBodyCharacterPrompt` 永遠使用完整服裝資料，不得沿用主 Prompt 的 `visibleProjection`；它仍不輸出 Pose、Scene 或 `multi-cut sequence n=2`。

### 體態構圖可見性優化（2026-07-21 第一至四階段）

第一階段建立目標規格與 deterministic regression fixtures。`webapp/src/lib/engine/compositionBodyVisibilityFixtures.js` 固定六種正式 Body Type 在各景別的共享 projected body source；`compositionBodyVisibilityContract.test.js` 驗證來源完整性、區域邊界、單人／雙人／角色卡／特殊穿搭 coverage，以及 raw selection preservation。

第二階段把 `compositionVisibilityContract` 升級為 version 3，並將 shared body projection 接到正常單人的六種正式 Body Type。`compositionBodyProjection.js` 在三個 renderer 排版前，依同一個 composition bucket 產生一次投影後 Body Type；Gpt 完整保留該來源，Grok/Z-Image 與 AI 只能依既有契約做可追溯壓縮。原始 `bodyTypeId`、generated selection、Saved Cards 與 restore 資料不變；`full-body-character` 仍明確使用完整原始 Body Type。第二階段沒有改動服裝、姿勢、場景、攝影控制或 UI，也尚未處理雙人 A/B、角色卡結構化 `body` 與特殊穿搭 person-detail 內的體態片段。

第三階段將相同 projection 接到雙人 A/B Body Type、正式角色卡結構化 `profile.body`，以及特殊穿搭 person-detail 的身體位置刺青。雙人三組輸出都從投影後的角色 Body Type 建立各自的 `Woman 1`／`Woman 2` 區塊；角色卡在 `characterProfiles.js` 為每張正式卡提供 authored `bodyProjection`，近景不再回讀混合式 `identityAndBody`，但該相容欄位、五官結構、四個 permanent identity anchors、髮型與配件仍保留。特殊穿搭內建髮型不受景別影響，胸部／手臂刺青在臉部與頭肩景別省略、從胸上景別恢復。原始選擇與獨立 `full-body-character` 仍使用完整來源；服裝、姿勢、場景、攝影控制、UI 與公開欄位映射不變。

第四階段不再修改 renderer，而是把完成後行為提升為 `compositionBodyPromptIntegration.test.js` 的阻擋式整合契約並接入 `npm run test:prompt-quality`。矩陣涵蓋全部公開景別別名、六種 Body Type、固定構圖的完整來源邊界、雙人 A/B、全部正式 Character Card，以及所有含身體位置刺青的特殊穿搭；逐一確認三組歷史輸出欄位只使用投影後 body source、raw selection 保留、角色 identity anchors 不受影響，且單人 `full-body-character` 還原完整來源。第四階段沒有新增 Prompt 文字、改變壓縮規則或影響服裝、姿勢、場景與 E 攝影成像。

| 公開景別 | 內部 bucket | 目標體態可見性 |
| --- | --- | --- |
| `局部五官特寫`、`臉部特寫` | `faceDetail` | 完全省略 Body Type 與 Character Card `body`；五官、膚質、妝容、髮型、神情與臉部配件不受影響。 |
| `半臉傾斜特寫`、`特寫鏡頭 (Close-Up)` | `headShoulders` | 完全省略 Body Type 與 Character Card `body`；非體態身份資料不受影響。 |
| `胸上特寫` | `chestUp` | 只保留胸部、胸廓與可見上半身體態；移除身高、體重、完整三圍、腰腹、臀腿與腿身比。 |
| `中景鏡頭 (Medium Shot)` | `mediumWaist` | 保留胸部、軀幹、腰線與腹部；移除身高、體重、臀腿、腿身比與完整三圍 anchor。 |
| `牛仔中景 (Cowboy Shot)` | `cowboyKnee` | 保留胸部、軀幹、腰腹與臀部；移除身高、體重、長腿與腿身比壓力。 |
| `全身鏡頭 (Full Body Shot)` | `fullBody` | 完整保留原始體態。 |
| `全無` 或沒有景別 | `unconstrained` | 完整保留原始體態。 |
| 固定構圖場景 | `fixedComposition` | 第一階段維持完整體態，後續由固定構圖自己的距離 metadata 決定，不套用一般 framing 推測。 |

體態投影共同規則：

- 「省略」只影響三組主 Prompt，不得清除 `bodyTypeId`、`bodyTypeAId`、`bodyTypeBId`、Character Card、Saved Cards、restore payload、generated selection 或瀏覽器儲存值。
- 三組主輸出必須先共用同一份 projected body source。Gpt 完整保留投影後有效內容；Grok/Z-Image 與 AI 只能從該來源做可追溯壓縮，不得回讀完整 Body Type。
- `fullBodyCharacterPrompt` 使用完整 body source，不繼承主 Prompt 的近景體態投影。
- 正式角色卡優先投影結構化 `profile.body`；`identityAndBody` 繼續作為相容欄位，四個 permanent identity anchors 與五官、膚質、妝容、髮型不得隨 body 一起移除。
- 胸上與中景不得直接保留混合胸腰臀的三數值 anchor。牛仔景已能看到臀部，可保留胸腰臀比例，但仍不得帶入身高、視覺體重、長腿或腿身比。
- 體態資料是混合全身句，runtime 不應用 renderer-specific 正規表示式即時猜測；應使用已編寫、可追溯的區域 body source。

主要程式與 regression 基準位於：

- `webapp/src/lib/engine/compositionVisibilityContract.js`
- `webapp/src/lib/engine/compositionBodyProjection.js`
- `webapp/src/lib/engine/compositionBodyVisibilityFixtures.js`
- `webapp/src/lib/engine/compositionBodyVisibilityContract.test.js`
- `webapp/src/lib/engine/compositionBodyVisibilityIntegration.test.js`
- `webapp/src/lib/engine/compositionBodyPromptIntegration.test.js`

體態構圖可見性第一階段基準另位於：

- `webapp/src/lib/engine/compositionBodyVisibilityFixtures.js`
- `webapp/src/lib/engine/compositionBodyVisibilityContract.test.js`

第二階段回歸基準另位於：

- `webapp/src/lib/engine/compositionVisibilityState.test.js`
- `webapp/src/features/page1/lockTransitions.test.js`

第三階段回歸基準另位於：

- `webapp/src/lib/engine/compositionVisibilityWardrobe.test.js`
- `webapp/src/lib/engineCharacterCardVariant.test.js`

第四階段回歸基準另位於：

- `webapp/src/lib/engine/compositionVisibilityPose.test.js`
- `webapp/src/lib/enginePoseComposer.test.js`
- `webapp/src/lib/enginePromptPipeline.test.js`

第五階段回歸基準另位於：

- `webapp/src/lib/engine/compositionVisibilityScene.test.js`
- `webapp/src/lib/engineGrokScenePriority.test.js`
- `webapp/src/lib/engine/promptOutputContracts.test.js`

第六階段整合回歸基準另位於：

- `webapp/src/lib/engine/compositionVisibilityIntegration.test.js`
- `webapp/package.json` 的 `test:prompt-quality`

### 固定景別派生 Prompt（2026-07-23 第一至六階段）

「固定景別派生 Prompt」和「固定構圖場景」是兩套不同功能。固定景別輸出從同一個 PAGE1 生成結果取得已解析人物、服裝、配色、姿勢、場景、光線與攝影成像，只替換輸出用途所指定的景別投影；不可重新解析或隨機抽選來源資料。第一階段建立 frozen target contract、deterministic fixtures 與結構測試；第二階段新增共用 preset／derived context 核心，並只把既有 `full-body-character` 接入，以逐 byte 回歸保證輸出不變；第三階段已把五官與胸上輸出接上 runtime 與公開 output contract；第四階段把三組固定景別輸出接到 PAGE1 即時 Prompt 卡與 DLL PIC Pro；第五階段收斂主景別 UI、隨機池與半臉構圖 runtime；第六階段以跨輸出整合矩陣完成相容性收尾。

已新增兩組只支援單人的 `extraPrompts`：

- `facial-closeup-portrait`／`五官特寫照`：固定 `1:1`。人物採 `faceDetail`，省略 Body Type 與姿勢，但必須保留完整五官、膚質、妝容、髮型、永久身份錨點、頭部／臉部／頸部配件，以及所選上衣、洋裝、套裝、特殊穿搭、外套或 Character Card 的肩部與領口。若所有來源都沒有有效上身服裝，使用正向 fallback `a simple opaque crew-neck top`，不輸出裸體防護或其他負面 guard。保留來源可追溯的精簡場景、光線及攝影成像；後方 orbit 只在派生輸出內改用正面，raw selection 不變。
- `chest-up-portrait`／`胸上特寫照`：固定 `4:5`。採既有 `chestUp` 投影，保留胸部可見體態、上身服裝、頭部與上半身動作、可見手部／道具、高位支撐和接觸，以及精簡原始場景、光線、攝影風格、鏡頭、光學效果與成像模擬。canonical pose 必須先投影再輸出，不得把畫面外下半身動作重新加入。

目前 active runtime 已移除五官特寫的生成與 consumer 展示；上面的 `facial-closeup-portrait` 定義只作為歷史契約與舊資料語意參照。新增 `chest-up-mj-portrait`／`MJ 胸上特寫照`：固定 `4:5`，使用胸上 body／visible-wardrobe／projected-pose projection；正常單人 subject、scene／lighting／imaging 沿用主 `AI Prompt` 的語意來源，特殊角色則保留既有 crop-aware `mjPromptByBucket` subject anchor。它使用原生 MJ 單行順序（image type、composition、subject、wardrobe、projected canonical pose、scene／lighting、imaging），移除胸上畫面不可見的下身與上身下緣穿法描述，最後附加 F 參數尾段並強制 `--ar 4:5`。F 的 version、Raw、Stylize、Chaos、Weirdness、SD／HD 仍由同一份 selection 繼承；一般結構化胸上與全身輸出不附加 MJ 尾段。舊 Saved Cards 中的五官 extra prompt 仍由通用 codec 保留，不做刪除或改寫。

兩組派生輸出遇到固定構圖場景時，保留固定場景身份與來源 anchor，但移除和指定五官／胸上景別衝突的固定鏡頭距離敘述；這不會修改 `fixedCompositionSetId` 或其他儲存值。既有 `full-body-character` 已在第二階段接入共用架構，並維持原文字、單人限制、完整體態與服裝來源，以及固定 `9:16`。

第二階段的共用核心由 `webapp/src/lib/engine/fixedFramingDerivedPrompt.js` 負責：preset 定義輸出 ID、UI 名稱、比例、支援模式、固定構圖處理與派生 framing；context builder 只替換 framing、composition visibility 與該 preset 明定的固定構圖狀態，其餘已解析資料沿用父結果。`engine.js` 再以相同人物、服裝、配色、光線與底片來源重建結構化 sections，不得呼叫任何 selection resolver。`fixedFramingDerivedPromptInfrastructure.test.js` 固定四種來源案例的全文長度與 SHA-256，第三階段加入新 extras 後仍要求 `full-body-character` 本文完全相同。

第三階段讓單人結果的 `extraPrompts` 依序包含 `facial-closeup-portrait`、`chest-up-portrait`、`full-body-character`。五官 preset 保持 `faceDetail` 的 Body Type／pose 省略邊界，但以明確 wardrobe override 保留上衣、洋裝上身、外套領肩與頭頸配件；角色卡的 Outfit 會移到 Wardrobe，不與 Subject 重複。胸上 preset 重新投影同一份 canonical pose。兩者都使用完整保留型 section renderer，不使用 `multi-cut sequence n=2`。固定構圖來源先轉為精簡場景身份與錨點，不能輸出原本 2.5–5 公尺的固定鏡頭距離、internal fixed-set label 或 integrity guard。後方 orbit 只在五官衍生 context 變為 front view，原始 `orbitId` 不變。

第四階段新增 `page1PromptOutputs.js` 作為 PAGE1 共用 consumer projection。單人 Generation Outputs 與 DLL PIC Pro 的順序統一為 Gpt、Grok/Z-Image、AI、五官特寫照、胸上特寫照、全身角色照；DLL PIC Pro 對後三者分別鎖定 `1:1`、`4:5`、`9:16`。`4:5` 已加入 DLL 比例選項，但目前只將直接 Google Gemini 路徑列為已驗證支援；若胸上來源搭配其他模型，生成按鈕維持停用並顯示相容性提示，不可靜默改成 `3:4` 或 `9:16`。雙人因沒有 `extraPrompts`，兩個介面都只顯示三組主 Prompt。consumer 必須直接使用 engine 已生成的 text，不得重新組裝、刪減或改寫派生 Prompt。Saved Cards 仍沿用第三階段既有的 generic `extraPrompts` 流程。

第五階段後，主 Prompt 的新選單與隨機池只使用 `半臉傾斜特寫`、`中景鏡頭 (Medium Shot)`、`牛仔中景 (Cowboy Shot)`、`全身鏡頭 (Full Body Shot)`，並保留可明確選取的 `全無`。`局部五官特寫`、`臉部特寫`、`特寫鏡頭 (Close-Up)`、`胸上特寫` 的既有 option ID 不刪除或改名；舊 Saved Cards、瀏覽器儲存與 restore payload 仍可解析並保存原值。還原舊值時，PAGE1 暫時顯示該值為 disabled restore-only option，使用者改選新版景別後即不再出現在選單，新隨機結果也不會抽中舊值。

第五階段讓半臉斜構圖不再只輸出 `off-center crop`。每個生成結果以同一 seed 明確解析左或右其中一側，Gpt、Grok/Z-Image、AI 共用同一段構圖開頭：人物貼近該側畫面邊緣、該側垂直邊界裁切臉部外半側、對側保留大面積負空間，且頸部、肩膀與上半身仍可見。不得輸出含糊的 `left or right`，也不得讓三個 renderer 各自抽選不同側。因為構圖明確包含肩膀與上半身，半臉使用 `headShoulders` 投影，保留所選上衣／連身服領肩、外套肩部與頭頸配件，但仍省略 Body Type 與 canonical pose；它不再觸發只適用五官／純臉部特寫的 UI 控制收斂。

第六階段不再改寫 renderer，而是新增 `fixedFramingPromptIntegration.test.js` 作為阻擋式完成閘門。四個現行主景別分別搭配上下身、特殊穿搭、套裝與連身服，從同一 resolved selection 驗證三組主 Prompt、五官特寫照、胸上特寫照、全身角色照與 PAGE1／DLL consumer；四個舊景別逐一驗證 restore-only UI、原 ID 生成能力與六輸出契約。未鎖定的單人、Character Card 與雙人結果都不得重新抽中舊景別；固定構圖場景與雙人模式仍維持各自既有的 `全無`／三主輸出邊界。此階段只增加 fixture、契約資料、品質閘門與文件，不修改 production Prompt 文字。

第一階段基準位於：

- `webapp/src/lib/engine/fixedFramingDerivedPromptContract.js`
- `webapp/src/lib/engine/fixedFramingDerivedPromptFixtures.js`
- `webapp/src/lib/engine/fixedFramingDerivedPromptContract.test.js`
- `webapp/package.json` 的 `test:prompt-quality`

第五階段主景別與半臉 runtime 回歸基準位於：

- `webapp/src/lib/engine/fixedFramingMainPrompt.js`
- `webapp/src/lib/engine/fixedFramingMainPrompt.test.js`
- `webapp/src/features/page1/page1Selectors.js`

第六階段整合回歸基準位於：

- `webapp/src/lib/engine/fixedFramingPromptIntegrationFixtures.js`
- `webapp/src/lib/engine/fixedFramingPromptIntegration.test.js`
- `webapp/package.json` 的 `test:prompt-quality`

### 固定構圖場景可見性優化（2026-07-19 第一至第五階段）

固定構圖場景的產品目的，是在固定鏡頭距離與固定場景架構中，讓人物以不同姿勢、動態與支撐關係和場景互動。啟用固定構圖場景時，一般 `framingId` 控制維持停用，不開放使用者另行調整；後續 runtime 必須由固定構圖場景自己的有效 composition context 決定服裝、姿勢與場景內容，不可把 UI 的 `全無` 直接等同一般 `unconstrained` 景別。

第一階段只建立不改變 runtime 的 deterministic regression baseline：固定構圖搭配上下身、特殊穿搭、套裝與連身四種服裝模式時，`Gpt`、`Grok/Z-Image`、`AI` 三種主 Prompt 都必須保留可辨識的服裝核心與固定場景錨點。基準位於 `webapp/src/lib/engine/representativePromptFixtures.js`，並由 `npm run test:prompt-quality` 執行。固定構圖專用 composition context、共用結構化投影與 renderer 順序調整仍屬後續階段；第一階段不可把目前 Grok/Z-Image 的場景優先順序固化為目標規格。

第二階段已將 `compositionVisibilityContract` 升級為 version 2，新增獨立的 `fixedComposition` bucket。這個 bucket 明確標示 composition source 為固定構圖場景、一般景別不可手動調整、鏡頭距離由固定 set 定義；服裝使用完整角色集合、姿勢使用完整 canonical pose、場景使用 `fixedSetContract` 專用語意。引擎在人物與服裝解析前建立這份 context，後續 projection 與 renderer fallback 都重用同一物件。第二階段不修改公開 Prompt 排版與文字，也不改變固定場景 ID、一般景別選項或 Saved Cards 映射；共用內容投影與 Grok/Z-Image 段落順序仍留在後續階段。

第三階段新增 `fixedCompositionPromptProjection`，在服裝、配色與 canonical pose 都解析完成後，集中保存固定構圖的 composition metadata、resolved wardrobe items／colors、canonical pose text，以及固定場景、人物位置、背景狀態、拍攝型態、演出狀態、角度與環繞角度等 resolved scene selections。`buildPrompts()` 讓 Gpt、Grok/Z-Image、AI 三者都從這一份 projection 建立 renderer context；`全身角色照` 則明確回到未裁切的完整 wardrobe source。第三階段只統一資料來源，不修改公開 Prompt 文字與段落順序，因此 Grok/Z-Image 現有的固定場景先於人物／服裝的暫時順序仍留給下一階段修正。

第四階段將固定構圖的 Grok/Z-Image 單人輸出順序統一為：成品類型、可用的構圖開頭、人物、服裝、projected canonical pose（若有）、固定場景、攝影風格、成像模擬。這次只重排原有 paragraph producer，不增刪或改寫固定場景、服裝、姿勢、光線、角度與成像內容。上下身、特殊穿搭、套裝與連身四種 deterministic fixtures 都必須確認人物先於服裝、服裝先於姿勢／場景；沙發、飯店與浴室固定場景測試也不得再保留舊版場景優先順序。Gpt 與 AI 原本已是人物／服裝先行，因此第四階段不改其文字或排序。

第五階段新增 `fixedCompositionPromptIntegration.test.js` 作為跨輸出阻擋式整合契約，並接入 `npm run test:prompt-quality`。上下身、特殊穿搭、套裝與連身四個案例都從固定場景與全無基底建立，逐一驗證 Gpt、Grok/Z-Image、AI 保留相同已選服裝、逐字共用 Gpt 的 canonical pose、包含相同固定場景 anchor，且遵守人物 → 服裝 → 姿勢 → 場景順序；同時確認固定場景與服裝 selection ID 不會失效，而一般 `framingId` 仍維持固定構圖模式的 `全無`。第五階段只增加測試與品質閘門，不修改 production renderer 或公開 Prompt。

固定構圖第五階段回歸基準位於：

- `webapp/src/lib/engine/fixedCompositionPromptIntegration.test.js`
- `webapp/package.json` 的 `test:prompt-quality`

### Z-Image（歷史欄位 `zImagePrompt`）

- Internal field: `zImagePrompt`
- UI label: `Z-Image`
- Target profile: Magnific AI 中的 Z-Image Turbo
- 相容性：`zImagePrompt`、既有 Saved Cards／restore payload 與舊 `Grok/Z-Image` Markdown 標題保持可讀；不得因 UI 改名而改欄位。
- 格式：自然語言空行段落。
- 使用直接視覺身份開頭，例如 `Photorealistic editorial portrait.`，不使用 `Create a／an` 命令式開頭。
- 不使用 GPT／舊 Grok 式英文段落標籤；場景直接使用 `The scene is ...`，不可輸出 `Scene:`、`Scene Priority:`、`Fixed Set Integrity:` 或其他 renderer 內部控制標籤。
- 不加入 `multi-cut sequence n=2`。
- 可以比 `AI` 更完整，但只針對 Z-Image Turbo 的理解方式做來源可追溯壓縮與重排；不再維持 Grok Imagine／Aurora 的格式假設。
- 固定順序為：成品類型、構圖、人物、服裝、姿勢、場景、光線、攝影風格、鏡頭、成像。人物／服裝／姿勢／場景／光線是主要內容，風格／鏡頭／成像為次要內容。
- `zImageTurboPromptContract.js` 記錄 section priority 與估算長度診斷。估算以 512 sequence limit 作風險基準，400 estimated tokens 為目標、480 為 soft max；它不是官方 tokenizer 的精確計數，且不得用硬截字、硬截詞或殘句達標。

#### 已實作：英文公開輸出邊界（Z-Image 優化第八項第一階段）

- `zImagePrompt` 的一般公開描述維持英文。資料選項的 `zh` 與 `desc` 只服務 UI、摘要與維護，不得由 renderer 串入 Prompt。
- 不把同一視覺事實同時輸出為中英文，不自動翻譯 UI 中文，也不在最終 renderer 以刪除 Unicode 字元的方式掩蓋來源錯誤；公開文字仍必須直接來自既有英文來源與明確組裝規則。
- 精確畫面文字屬於後續獨立能力，本階段不新增輸入欄位、lock、Storage、Saved Cards 或匯入匯出格式。沒有明確文字來源時，renderer 不得自行發明招牌、標語或文案。
- `zImageTurboPromptContract.js` 將這個邊界記為機器可讀語言政策；共用 `promptOutputContracts.js` 仍以 `language-range` 阻擋 CJK 滲入 `zImagePrompt`，代表性 fixtures 與 Z-Image 聚焦測試必須通過同一條契約。

#### 已實作：精確畫面文字（Z-Image 優化第八項第二階段）

第二階段新增可選的 `Z-Image Exact Visible Text`，只處理使用者明確要求畫面中可讀字樣的案例。能力預設關閉且內容為空；沒有明確來源文字時，公開 Prompt 必須和第一階段逐 byte 相同，renderer 仍不得自行發明招牌、標語或文案。

- 四個 lock 為 `zImageVisibleTextEnabled`、`zImageVisibleTextContent`、`zImageVisibleTextLanguage`、`zImageVisibleTextPlacement`。UI 位於 D 場景環境的「精確畫面文字」子面板；內容正規化控制字元與多餘空白，並限制為 48 個 Unicode code points。
- 支援的來源語言為繁體中文與英文；承載位置只提供背景店面招牌、場景牆面海報、背景數位顯示器。renderer 以固定英文空間句包住使用者原文，例如 `A wall poster within the scene clearly displays the exact Traditional Chinese text "美華冰室".`，不得翻譯、改寫、補字或重複來源 literal。
- 句子只加入一般單人、固定構圖與雙人的 `zImagePrompt` 場景段落。Gpt、AI、胸上特寫照、MJ 胸上特寫照與全身角色照不得繼承這段；生成摘要可顯示原文供確認，但不可把它當成其他 renderer 的資料來源。
- 這四個 lock 會隨既有 `vps.locks` Storage、Saved Cards、restore payload 與 Markdown Z-Image 成品匯入／匯出往返。舊資料由 normalization 套用關閉／空白／預設語言／預設位置，不需要 migration；歷史欄位 `zImagePrompt` 與舊 `Grok/Z-Image` Markdown 標題保持不變。
- 精確文字是明確輸入，不參與「全部隨機」、section random、全無或清除可選欄位。固定構圖不得清除它；清空動作也不得把使用者輸入誤當隨機內容重設。
- Markdown／標準 Prompt restore 只解析完整符合固定英文 wrapper、已知語言與已知位置的句子；任意場景文字或近似句不得猜測成 lock。字串 literal 使用 JSON quoting，使雙引號與反斜線可逆。
- `promptOutputContracts.js` 的一般 CJK 阻擋仍有效。只有 `selection.zImageVisibleTextContent` 的精確 literal 可作為 `zImagePrompt` 的 scoped language exception；validator 先移除一次完全相同的核准 literal 再檢查剩餘內容，因此重複 literal、額外中文或 UI `zh／desc` 洩漏仍是 `language-range` 失敗。

機器可讀契約版本為 `zImageTurboPromptContract` `1.5.0` 與共用 `promptOutputContracts` `1.7.0`。第二階段驗證通過 67 項聚焦測試、145 項 Prompt 品質測試、704 項 frontend tests、lint 與 build；明確執行 `node ../scripts/validate_prompt_logic.mjs 200 z-image-turbo-v1 --strict` 的結果沒有 blocking、required-output、duplicate、near-duplicate、control-language 或 contradiction 訊號。預設關閉 fixture 的 Z-Image avg／median／p95／max 維持 237.4／234／293／342 words，18 個既有 wardrobe／scene diagnostic-only findings 仍分布於 17 筆。Browser QA 在 1440×1000 與 390×844 走查五個工作區；Z-Image 只出現一次核准原文，Gpt／AI／三組派生輸出均無洩漏，重載可還原，且沒有 document-level 橫向溢位、clipped control、破圖、console warning 或 error。

#### 已實作：來源可追溯的刪減式重組

Z-Image 必須是同一組 PAGE1 selections 的自然語言精簡版，而不是另一套獨立的 prompt 組裝結果。它應從和 Gpt 相同的完整語意模型／已解析選項取得內容；不得反向解析 Gpt 的 Markdown 成品，也不得自行補寫新的畫面資訊。

壓縮只允許三種操作：

- 刪除不會改變畫面的重複形容、一般正常狀態、內部控制語與純氣氛填充語。
- 在同一責任區塊中重新排序既有片段，讓自然句先出現主體、物件與結構。
- 以最小、無視覺意義的語法連接既有內容，例如 `with`、`and`、`She wears`、逗號與句號。

不得由 renderer 新增未被選擇資料或既有組裝規則支持的視覺描述、關係或氣氛詞。`layered over`、`paired with`、`styled with`、`natural`、`candid`、`editorial` 等詞，只有在選擇資料或明確組裝規則本來就提供時才可輸出。

套裝配色若原始資料使用 `controlled by ... selection`，renderer 應把它實體化為實際選色，例如 `main fabric color set to red`，不可在 Z-Image 或 AI 成品中保留 selection-control 語言。`signature outfit locked as`、`model-decided`、`Keep／Vary only` 與 `allow ...` 等 guard／指令語必須改成具體可見內容，而不是送到公開 Prompt。完全相同的配件描述片段只保留一次；近似描述只有在較完整片段已包含全部視覺資訊時才可刪減。

保留與刪減規則：

| 區塊 | 必須保留 | 可刪減 |
| --- | --- | --- |
| 人物 | 主體、已選配件、完整身材數值／比例 anchor、五官方向、髮型、髮色、膚質、表情、角色卡永久身分錨點 | 重複美感詞、重複 silhouette 詞、無新結構資訊的髮絲或氣質形容 |
| 穿搭 | 已選衣物、配色、材質、剪裁、可見層次、鞋襪與重要配件 | 正常穿著說明、重複衣領／門襟／比例描述、`coordinated styling` 等泛用結尾 |
| 動作 | 構圖投影後仍可見的姿勢基底、肢體關係、手部接觸、道具、支撐點、頭部方向 | 畫面外姿勢 fragment，以及未增加動作資訊的 moment、mood 或 body-language 填充語 |
| 場景／光線 | 原場景的地點、構圖投影後需要的實體 anchor、時段／天氣、人物光線方向、主色溫、必要投影或反射 | 畫面外互動幾何、重複空間／亮度語句，以及未由攝影控制提供的景深效果 |
| 攝影 | 已選攝影風格、構圖、視角、鏡頭、主要光學效果、成像結果 | 同義的 editorial／cinematic／photographic 修飾與重複技術結果 |

人物身材的數值與比例 anchor 屬於不可刪除內容。壓縮可移除例如 `smooth natural silhouette`、`calm high-fashion presence` 等不增加結構資訊的片段，但不可刪除 `about 160-165 cm visual height`、`83-62-88 body proportion anchor`、比例、腰臀／胸部或其他已選身形關鍵資訊。

特殊穿搭內建的髮型、髮色、刺青與身體記憶點在 Z-Image 中也屬於人物資訊，應進入人物句，而非 `She wears complete special outfit` 句。雙人模式使用直接句 `Woman 1 has ... She wears ...`／`Woman 2 has ... She wears ...` 保持歸屬，不使用 `Woman 1:` 等段落標籤。角色卡四個永久身分錨點各保留一次，預設服裝另成 `She wears ...`，不可混入 lock label。

驗收時必須確認 Gpt 與 Z-Image 的 selections 一致，且 Z-Image 沒有遺失構圖投影後仍有效的身材 anchor、服裝與顏色、動作核心、場景 anchor、光線方向或主要攝影設定。Pose Composer 啟用時仍逐字重用共用 canonical pose；固定構圖需改寫為具體空間與拍攝描述，不輸出 renderer guard。

#### 已實作：八方向相機—人物幾何（Z-Image 優化第六項）

Z-Image 的構圖段落在共用景別、鏡頭高度與拍攝方位短句之後，加入一段只屬於 `zImagePrompt` 的具體相機—人物幾何。它不是新的使用者選項，也不改寫 resolved selections；規則只把既有 `orbitId` 與共用 composition visibility bucket 實體化為模型較容易遵循的空間關係。Gpt 與 AI 不加入這段 Z-Image 專屬文字。

- 八個正式方位為正面、左前、左側、左後、背面、右後、右側、右前。每個方向都明確指出離鏡頭較近的臉側、肩膀、肩胛、腰或髖，以及正面、背面、三分之四或側面的身體輪廓。
- 幾何 anchor 必須服從共用景別投影：五官特寫只描述臉部；頭肩／胸上只描述肩膀與上半身；中景可描述腰；牛仔景可描述髖與大腿；全身才可描述腿與腳。不得為了強化角度而加入畫面外身體部位。
- 一般單人與 Character Card 使用 `woman／her` 語言；黑白骷髏、武士、騎士、女性仿生人等 dedicated special subject 使用中性的 `subject` 語言，避免改寫角色種類。雙人維持既有構圖規則，不套用單人幾何句。
- 身體方位與頭部方向分工：相機方位句固定軀幹／骨盆相對鏡頭的位置；Pose Composer 的 canonical pose 仍負責頭、手、腿與支撐關係。即使選擇「頭部自然朝向鏡頭」，右側拍攝仍必須保持右肩、右髖靠近鏡頭的側身軀幹，不得把整個人轉回正面。
- Pose Composer 的 projected canonical pose 在 Gpt、Z-Image、AI 三組輸出間仍須逐字相同；不得把方位幾何塞入或改寫 canonical pose。Storage、Saved Cards、匯入匯出、lock ID 與歷史欄位 `zImagePrompt` 均不變。

機器可讀規則位於 `webapp/src/lib/engine/zImageTurboCameraGeometry.js` 與 `zImageTurboPromptContract.js`；八方向、景別可見性、特殊人物中性語言，以及「右側身體＋頭轉鏡頭」整合案例都屬於 `npm run test:prompt-quality` 的阻擋式回歸。

第六項在 2026-08-13 完成驗證：14 項聚焦測試、139 項 Prompt 品質測試與 689 項 frontend tests 全數通過，lint、build 與相同 `z-image-turbo-v1` seed 的 200 筆 strict audit 亦通過。Strict audit 沒有 required-output、duplicate、control-language、contradiction 或 blocking 訊號；Z-Image 平均字數由 197.7 增至 222.1，p95 由 258 增至 284，屬於核准的主要構圖資訊而非冗詞。Browser 驗證在 1440×1000 與 390×900 覆蓋五個工作區，實際產生的全身右側案例包含 right shoulder／right hip 靠近鏡頭與 side-on silhouette，且無 overflow、破圖或 console error。

2026-08-13 實圖回饋顯示，單純使用 `nearer／nearest the lens` 與 `side-on silhouette` 仍可能被 Z-Image 的正面時尚人像傾向壓過；同時發現 `牛仔中景 (Cowboy Shot)` 因字串判斷先命中一般「中景」，公開構圖開頭誤寫為 `Waist-up portrait`，但可見性 projection 正確使用 cowboy bucket，因而造成 waist-up 標籤與 hip／thigh anchor 表面矛盾。後續修正依下列契約處理：

- 共用構圖 descriptor 必須先判斷 cowboy 再判斷一般 medium，使 Gpt、Z-Image、AI 都輸出 `Knee-up cowboy shot`；不改 framing ID、bucket 或儲存資料。
- 左右 90° 側面不再只描述近側部位，而以鏡像的近遠重疊建立不可混淆的幾何：近肩遮住遠肩，cowboy／full-body／unconstrained 再加入近髖遮住遠髖，身體以 `seen edge-on in a strict 90-degree ... profile` 收束。
- face crop 使用 nose／lips／chin 的單一側面輪廓；upper crop 只使用肩膀與上半身；medium crop 只使用肩膀、ribcage 與 waist；只有 cowboy 以上才加入 pelvis／thighs，只有 full-body 才加入 legs／feet。
- 上述加強只改左右 90° 模板；正面與六種三分之四／背面方位保持既有文字。頭部方向仍由三組逐字共用的 canonical pose 負責。

修正後契約版本為 `1.2.0`。聚焦測試 19 項、Prompt 品質測試 140 項與 frontend tests 691 項全數通過，lint 與 build 通過；相同 `z-image-turbo-v1` seed 的 200 筆 strict audit 沒有 blocking、required-output、duplicate、control-language 或 contradiction 訊號。Z-Image avg／median／p95／max 為 226.5／220／290／322 words；仍保留 18 個既有 wardrobe／scene diagnostic-only findings。Browser QA 在 1440×1000 與 390×900 走查五個工作區，沒有 document-level 橫向溢位、破圖、console warning 或 error；live PAGE1 Z-Image 輸出確認 cowboy descriptor、左右重疊幾何與 strict 90-degree 結尾同時存在。

2026-08-14 的第二輪 Magnific 實圖顯示，上一版 `near ... visually overlaps ...` 即使加入 strict 90-degree 結尾，四張結果仍全部回到正面或近正面。改用直接描述可觀察結果的手寫版本後，四張中三張形成明確側身，一張為仍可接受的部分側身，因此 `1.3.0` 依這組已驗證語法取代左右側模板與特殊俯仰角度：

- 左右側身必須先說人物面向哪一側畫面邊緣，再說相機只看到人物哪一側；近肩必須 `fully hides` 遠肩，可見髖部的景別同樣要求近髖完全遮住遠髖，最後以單一狹窄輪廓與 `strict 90-degree lateral body view` 收束。不得再使用可能被理解為輕微透視重疊的 `nearest／nearer` 或 `visually overlaps` 作為主要側面約束。
- 文案依姿勢基底使用 `stands／sits／kneels／squats／lies completely sideways`；dedicated special subject 維持中性 `subject`。所有肩、髖、腿與腳 anchor 仍服從 composition visibility bucket，不能把畫面外部位寫回 Prompt。
- 高位、地面、蟲眼、鳥瞰與正上方俯視不再只輸出 `high angle, looking down` 等標籤。Z-Image 需直接描述相機相對人物的位置、向上或向下傾斜方向，以及目前景別可見的肩線、腰頭、腿部或頭頂平面；平視、肩部、腰部與膝蓋高度等一般高度仍沿用共用短 descriptor。
- Pose Composer canonical pose 必須繼續逐字存在於 Gpt、Z-Image、AI。只有已實測的 `hands-grip-waistband` 在左右側身時，Z-Image 可於 canonical pose 後追加獨立深度句，說明雙手在前腰頭從側面前後重疊、兩側手肘一近一遠；不得改寫 canonical pose，也不得把此規則推廣到尚未實測的手勢。
- 上述修正只取代左右 90° 模板與五種特殊俯仰角度；正面及六種三分之四／背面 orbit 文字不變。Gpt、AI、resolved selections、Storage、Saved Cards、匯入匯出、lock ID 與歷史 `zImagePrompt` 欄位均不變。

`1.3.0` 驗證結果：50 項聚焦測試、143 項 Prompt 品質測試與 694 項 frontend tests 全數通過，lint 與 build 通過；相同 `z-image-turbo-v1` seed 的 200 筆 strict audit 沒有 blocking、required-output、duplicate、control-language 或 contradiction 訊號。Z-Image avg／median／p95／max 為 237.4／234／293／342 words；18 個既有 wardrobe／scene diagnostic-only findings 分布於 17 筆，仍非本次新增回歸。Browser QA 在 1440×1000 與 390×844 走查五個工作區，沒有 document-level 橫向溢位、clipped control、破圖或 console error；live cowboy／高位／右側／雙手腰頭案例同時命中明確高機位、完全遮蔽側身與手勢深度句，Gpt 與 AI 保持原 compact composition。

### AI

- Internal field: `midjourneyPrompt`
- Target: AI compact natural prompt
- 格式：極簡自然英文段落。
- 像早期手寫 prompt，短而直接。
- 不出現中文。
- 不加入「模型自然決定」類說明句。

#### 已實作：AI 自由導向的來源可追溯極簡版

本規則適用於 PAGE1 單人與雙人模式。AI 必須使用和 Gpt／Grok-Z 相同的 resolved selections，但它的目的不是保留所有控制，而是在大方向不變下保留更多模型自由度。雙人使用 `First woman`／`Second woman` 直接句維持角色歸屬，不使用區塊標籤。

AI renderer 只可刪除、重排與使用最小語法連接既有內容；不得以關鍵字映射、風格 shorthand、攝影 mood tail、負面 guard 或預設 fallback 補寫新語意。不得以「取前 N 個 fragment」任意截斷選項內容；應按欄位責任挑選需要保留的核心。

一般單人模式保留四個核心內容句，並在構圖投影仍有有效姿勢時加入一個 projected canonical pose 句；前面可先加成品類型與構圖開頭：

1. **人物句**：主體、模型專用身形 anchor、髮型／髮色、已選眼鏡與耳機；Grok/Z-Image 保留完整身材數值／比例，AI/MJ 使用短正向身形 anchor。
2. **穿搭句**：已選服裝、配色、外套、鞋襪與必要配件的極簡說明。
3. **場景句**：使用原場景描述的地點、代表性實體 anchor、必要時段或天氣；近景可精簡成一句，但不得自行加入模糊或景深效果。
4. **成像句**：已選攝影風格、主要鏡頭／光學效果、底片或成像模擬。

前置句依序為成品類型、共用構圖句；構圖控制皆為 `全無` 時，構圖句可省略。

一般單人模式的 AI 不再把已選五官與表情一律視為非核心：至少保留一個五官主錨點，以及已選表情的最短正向片語；膚質與次要光線細節仍可省略。表情不指定視線方向，頭部方向由 Pose Composer 控制。Character Card 使用既有永久身份錨點，不重複追加一般五官句；雙人與特殊角色沿用各自 renderer contract。半臉構圖句維持既有 canonical text，不在此規範中改寫。PAGE1 使用 Pose Composer 時，先依共用構圖契約產生 projected canonical pose；若結果非空，AI 不得省略或自行改寫，若景別為 `faceDetail` 或 `headShoulders`，三組輸出都省略姿勢。

角色卡單人模式採「身份穩定、畫面自由」規則：人物句完整保留角色卡的結構化五官、膚質、永久特徵、身形、髮型與髮色，以及有效的眼鏡／耳機；穿搭句仍採極簡化。角色身份須從角色卡的結構化 profile fields 組裝，不可重複舊版完整 `identityAndBody` 段落，也不可將角色卡原始服裝與目前 PAGE1 選擇的服裝重複輸出。

特殊穿搭、套裝與連身服也採極簡化：只保留主服裝或主風格、關鍵上／下身或連身結構、外套、鞋襪與一項必要辨識配件；移除正常穿著、控制語、重複材質／剪裁與搭配解釋。特殊穿搭內建的髮型、髮色、刺青與身體記憶點屬於人物句，而非穿搭句。

AI 驗收重點：四句內仍可辨識人物／角色身份、服裝、場景與成像；不得出現未選擇資料衍生的 `Y2K ... look`、`captured as ... film still`、`not ...` guard 或其他 renderer 自行補寫的描述。

#### AI Prompt 長度優化（第一階段契約）

第一階段只建立機器可讀長度契約、deterministic 最壞案例 fixtures 與基準測試，不修改公開 Prompt。後續 Midjourney 描述優化第五階段已將雙人 AI 納入獨立字數政策。

- 一般單人目標 110 words，soft max 130。
- 套裝、特殊穿搭與連身服目標 115 words，soft max 130。
- Character Card 目標 150 words，soft max 170。
- 雙人目標 160 words，soft max 180。
- 成品類型、共用構圖句與 projected canonical pose 是不可壓縮區塊；Pose Composer 文字必須繼續和 Gpt／Grok-Z 完全一致。
- 不可用字元截斷、單純取前 N words 或留下殘句。後續只能按完整語意片段進行來源可追溯的刪減。
- Character Card 的結構化五官、身形、髮型、有效眼鏡／耳機與四個永久身份錨點仍是必要內容；字數預算不能取代身份穩定契約。
- 後續壓縮順序固定為：次要成像細節、次要場景 anchor、服裝次要結構細節、一般人物修飾詞。每一階段需先更新 fixture，再改 runtime。

機器可讀來源為 `webapp/src/lib/engine/aiPromptLengthContract.js`；壓力案例位於 `webapp/src/lib/engine/aiPromptLengthFixtures.js`。

第二階段建立 `aiPromptBudget.js` 的 section-aware 組裝邊界。單人 AI 的七個 producer 固定映射為 `imageType`、`composition`、`subject`、`wardrobe`、`projectedCanonicalPose`、`scene`、`imaging`，每段各自記錄 words、是否不可壓縮及整體超出 target／soft max 的診斷量。一般、完整造型與 Character Card 由 resolved structured model 選擇對應 policy；雙人仍走原 renderer。本階段只以同樣的空行規則重新組合原文字，九組基準 Prompt 的 SHA-256 必須逐字維持第一階段結果。

第三階段啟用一般人物與服裝的來源可追溯壓縮。一般 Body Type 移除不增加身材結構的 `smooth natural silhouette`、`clean editorial silhouette` 等結尾；Grok/Z-Image 保留體型名稱、數值／比例及腰、胸、臀等核心 anchor，AI/MJ 的短正向 Body Type anchor 則由後續專屬規則負責。髮型可保留至三個原始片段，髮色只保留主要色名，省略重複 salon／texture 解釋。

完整造型按可見 role 重組：保留造型身分、上身／連身／下身／外套、襪、鞋及至多一項必要配件；每個主要服裝 role 最多保留兩個含實際衣物身分的來源片段，襪、鞋與配件各一個。超長單一衣物描述保留主件名與必要辨識結構，例如乳膠連身衣保留 `mirror-polished latex full-body catsuit`、`sharp mirror reflections`、`vacuum-tight second-skin fit` 與 `full-length legs`，不再保留同義的表面、覆蓋與輪廓解釋。Character Card、場景、成像、雙人及 projected canonical pose 在第三階段不得改寫。

第四階段只啟用 Character Card 壓縮。AI 必須完整保留四個 `distinctiveFeatures` 永久身份錨點，並以它們作為五官的 canonical 精簡表示，不再重複輸出同義的 `facialGeometry`、`eyeSignature`、`noseSignature` 與 `mouthSignature` 長版。另保留膚色／膚質主錨點、一項妝容錨點、構圖投影後身形、主要髮型與 signature 色彩處理、有效眼鏡／耳機，以及使用者選擇的髮型變體與 prompt override。預設服裝每個可見 wardrobe role 保留一件具名主衣物，選用角色卡配件仍完整保留來源描述。此階段不得改寫一般人物、一般完整造型、場景、成像、雙人或 canonical pose。

第五階段啟用 section-aware soft-max arbitration。只有完整組裝後超過對應 soft max 的單人 AI Prompt 才進行跨段落刪減，已合規輸出必須逐 byte 不變。順序固定先刪成像的次要說明，再刪 eligible cropped scene 的次要來源 anchor；成像仍須保留攝影風格／攝影者、鏡頭身份、所選光學效果與 film／rendering 身份，場景仍須保留原始地點身份與至少一個代表性 anchor。全身、未限制與固定構圖的完整 projected scene 不可參與場景刪減。成品類型、共用構圖句與 projected canonical pose 永遠不可壓縮；不得使用字元截斷、word truncation 或不完整句尾。

第六階段不再修改 renderer，而是將十組 deterministic fixtures 升級為 `aiPromptLengthIntegration.test.js` 阻擋式完成閘門。每組必須同時通過三個歷史主輸出欄位契約、resolved selection、必要 AI anchors 與對應 soft max；Pose Composer fixture 另驗證三種 Prompt 逐字共用 canonical pose，雙人 fixture 驗證不進入單人字數政策。此 gate 納入 `npm run test:prompt-quality`，後續改動若影響欄位映射、角色身份、服裝、場景、成像、構圖、姿勢或雙人邊界，必須明確更新 fixture 與契約，不得以放寬字數測試掩蓋回歸。

#### 已核准並已實作：AI Prompt 構圖與來源保留規範

本節是 AI／Midjourney 描述優化的產品規範，作用範圍只限歷史公開欄位 `AI` → `midjourneyPrompt`。目前 production renderer 已依本節實作；聚焦 regression fixture 為 `normal-single-ai-compression-source-retention`。

- **共用構圖開頭不可泛化或遺失。** AI 必須直接使用同一份 resolved composition source。以中景、高位俯視、右後為例，公開描述應保留 `Waist-up portrait, high angle, looking down, rear-right three-quarter view.`，不可改寫成泛化的 `medium shot`、`high right-rear angle`，也不可刪除 `looking down` 或 `three-quarter view`。構圖句仍位於人物句之前；半臉構圖句維持既有文字與左右側解析規則，不在本規範中重寫。
- **一般單人 Subject 必須保留身份與身形 anchor。** 主 MJ 與 MJ 胸上特寫固定使用 `A 20s seductive stunning Japanese woman.`；其後保留共用 projected body source 的有效片段，例如 `full bust, narrow defined waist, rounded hips`。AI 可以移除重複美感詞，但不得用 `curvy adult woman` 這類泛化片語取代 resolved identity 或 projected body anchor。此固定句只適用一般單人 MJ；Character Card、特殊角色與雙人模式沿用各自身份契約。
- **一般單人 AI 新增五官與表情的短版來源投影。** 五官至少保留一個臉型／五官主錨點；表情至少保留一個可見表情／嘴型片語。兩者都必須來自同一份 resolved character selection，不得在 renderer 重新抽選、補寫或改變選項語意。表情不指定視線方向；頭部方向由姿勢來源控制。
- **場景採取來源片段覆蓋，不採任意前 N 截斷。** 優先保留地點身份、代表性實體 anchor，以及必要的時段／天氣／光線條件；可刪除重複空間修飾與內部控制語。不得新增未選擇的景深、模糊、散景或場景物件。
- **成像採取固定優先級。** 優先保留攝影師／攝影風格身份、鏡頭身份與所選光學效果；`Camera / Film` 的次要解釋最後刪減，但其獨立的 film／rendering identity 若仍是來源 anchor 必須保留。攝影師、鏡頭與光學三者不可因字數壓力被整段移除。
- **髮型與服裝採欄位歸屬去重。** Subject 擁有髮型與髮色；Wardrobe 擁有服裝、材質、版型、配色、鞋襪與必要配件。跨來源出現相同髮型或服裝時做語意去重，不只比對完全相同字串；特殊穿搭若明確內含指定髮型，可保留一次作為例外。不得刪除服裝主體、材質或主要輪廓，只移除 `complete outfit`、`locked`、`controlled by`、重複的 `look／styling` 與其他內部控制語。
- **三組相容性不變。** Gpt (`grokPrompt`) 與 Grok/Z-Image (`zImagePrompt`) 不套用這次 AI 專用壓縮；三者仍共用同一份 resolved selection、結構化資料、projected body／wardrobe／scene 與 canonical pose。Saved Cards、Standard Prompt import／restore、歷史欄位映射與 consumer 不得被 AI 文字改寫帶動。
- **1000 字不是 Midjourney 官方限制。** 目前 [Midjourney Prompt Basics](https://docs.midjourney.com/docs/prompts) 與 [Parameter List](https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List) 沒有規定 1000 字、1000 words、1000 characters 或 1000 tokens 的 Prompt 上限；專案可把 1000 個英文字符與歷史 words 數值作為內部診斷／目標，但不能宣稱是 MJ 合規門檻。MJ runtime 不以這些數字刪除已解析的視覺項目；Gpt 與 Grok/Z-Image 仍依各自契約輸出。

建議的完整單人 AI 形態如下；這是來源保留範例，不是固定字串或新的 fallback：

```text
Photorealistic editorial portrait. Waist-up portrait, high angle, looking down, rear-right three-quarter view. A 20s seductive stunning Japanese woman. full bust, narrow defined waist, rounded hips, mature sensual face, straight hair with Japanese bangs, soft matte black-tea hair, pursed lips holding back a playful laugh, seated in an open confident pose with her head naturally facing the camera, wearing a structured leather waist-cinching corset outfit, inside an abandoned school infirmary with shadowed indoor daylight and venetian-blind striped projection light, Yoshihiko Ueda-inspired quiet natural dark-toned photography, macro lens, foreground occlusion bokeh, cross-processed neon silhouette filter.
```

#### 已實作：Midjourney 高密度 Prompt 壓縮原則（全選項保留）

本節是新版 Midjourney 描述壓縮規範，適用於歷史公開欄位 `AI` → `midjourneyPrompt` 與 `MJ 胸上特寫照` 的描述內容。這是根據雙人高密度 Prompt 實測確認並已落地到 MJ renderer 的規則；`aiPromptLengthContract.js` 的 words 數值現在只作診斷與比較，不再作為刪除視覺項目的 runtime gate。本節不改變 Gpt (`grokPrompt`)、Grok/Z-Image (`zImagePrompt`)、結構化胸上輸出、全身角色輸出或任何儲存／匯入匯出契約。

這個版本的核心不是把 Prompt 無限制地拉長，也不是把所有文字原封不動搬入 MJ，而是「保留每個已選視覺項目，壓縮每個項目的說明」。

- **取消固定字數刪除門檻。** 1000 characters、既有 AI words target／soft max 與其他內部長度數字，都不得再作為 MJ 描述刪除配件或服裝項目的理由。字元數與英文詞數可以繼續作為診斷與實測記錄，但不是 MJ 的 blocking 上限。
- **所有已解析的服裝角色與配件都必須保留。** 上身、下身、連身服、外套、鞋襪、頭部配件、眼鏡、耳環、頸部配件、腰部配件、包袋與其他有效選項，不得因 Prompt 變長而任意移除、只取前 N 個、只保留一件，或以「必要配件」取代完整選擇。
- **保留的是視覺項目，不是每個原始句子。** 同一件衣物或配件可以從多個來源片段壓縮成一個短片語；允許刪除重複形容、穿戴動作、正常狀態、泛用 styling 尾句、內部控制語與不增加辨識度的氣氛詞，但不能刪除項目本身。
- **每件配件以一個短片語為基本單位。** 優先保留配件名稱，再保留最重要的顏色／材質／鏈型／主題造型；只有在容易誤解、需要綁定人物、或受到景別影響時，才補充一個必要位置詞，例如 `at the upper hips`、`around the neck` 或 `worn on her head`。
- **服裝也採同樣的物件化壓縮。** 每個服裝 role 保留衣物名稱與一至數個最具辨識性的材質、顏色、剪裁或結構特徵；移除 `worn`、`styled with`、`coordinated look` 等不增加畫面資訊的連接語與重複解釋。
- **雙人輸出必須維持角色歸屬。** 每位人物的服裝、髮型、頭部配件、耳環、項鍊、腰部配件與其他配件，都要留在自己的角色句中，不得為了縮短文字而合併成沒有人物歸屬的共用清單。
- **長度壓力的處理順序固定。** 先合併同一項目的重複片語，再刪除次要形容與冗餘語法，最後才壓縮攝影／環境的次要解釋；不可先刪除已選服裝、配件、角色身份、構圖、姿勢或主要場景 anchor。
- **不得新增模型控制語。** 壓縮後仍只能使用 resolved selections 與既有組裝規則提供的視覺事實，不得加入 `model decides`、`keep all accessories`、`do not omit`、負面清單或其他內部 guard 來補救保留規則。
- **MJ 參數尾段維持獨立。** 描述內容完成後，才附加既有 canonical Midjourney parameter tail；參數尾段不參與服裝／配件片語的壓縮，也不能用參數文字取代描述內容。

配件短片語的建議結構如下：

```text
配件名稱 + 最重要的顏色／材質 + 特殊造型 + 必要位置
```

例如，原始句：

```text
She also wears small sculptural hoop earring details, a short gold curb-link necklace worn around the base of the neck at collarbone level, and a silver rhinestone butterfly waist chain with multiple small rhinestone butterfly charms spaced across the low waist and upper hips.
```

新版應優先壓縮為：

```text
She wears sculptural hoop earrings, a short gold curb-link necklace, and a silver butterfly waist chain with spaced rhinestone butterfly charms.
```

若腰部位置對辨識度或景別很重要，才使用：

```text
She wears sculptural hoop earrings, a short gold curb-link necklace, and a silver butterfly waist chain with small rhinestone butterfly charms across the upper hips.
```

驗收重點由「是否低於固定字數」改為：

1. 所有已選服裝與配件是否仍出現在 MJ 描述中。
2. 每件項目是否仍保留足以辨識的名稱與核心特徵。
3. 雙人模式是否維持正確的人物歸屬。
4. 是否移除了重複語意，而不是移除視覺項目。
5. 是否仍保留必要的身份、構圖、姿勢、場景與成像 anchor。
6. 是否沒有輸出內部控制語、負面 guard 或殘句。

目前已新增全配件保留與雙人高密度 deterministic coverage，再由 MJ 專屬 renderer 套用短片語壓縮；Gpt、Grok/Z-Image 與其他輸出未因這項 MJ 壓縮規則同步改寫。

#### Midjourney V8 專屬參數改造（第一階段契約）

第一階段只建立未來 PAGE1 `F｜MJ 參數設定` 的機器可讀契約、deterministic fixtures 與逐 byte 基準，不註冊新控制、不修改 UI、不附加參數，也不重寫目前 AI Prompt。歷史公開映射仍為 `AI` → `midjourneyPrompt`；Gpt、Grok/Z-Image、五官特寫照、胸上特寫照與全身角色照都在 F 影響範圍之外。

F 第一版預定提供 Midjourney V8.2／V8.1、Standard／Raw、Stylize 0–1000、Variety／Chaos 0–100、Weirdness 0–3000、SD／HD，以及精準寫實、平衡與創意三組快速預設。這些值不參與 PAGE1 一般隨機。第七階段新增獨立 `mjAspectRatio`，以 `跟隨 PAGE1` 保留既有 resolved `selection.aspectRatio` fallback，並提供常用 MJ `--ar` 比例直接選擇（包含 `21:9` 超寬與 `1:2` 超高）；明確選取的 F 比例只作用於 `midjourneyPrompt`，不改動 PAGE1 構圖比例。參數尾段固定在所有描述文字之後，依 version、aspect ratio、Raw、Stylize、Chaos、Weirdness、resolution 排序，且不計入 AI 文字字數預算。

本輪明確凍結現有人物與 Body Type 描述；Midjourney 專屬參數先用於實測，不得順帶重寫 `slim`、`lean`、`petite`、身材數值或其他既有來源。Pose Composer 的 projected canonical pose 仍須和 Gpt、Grok/Z-Image 逐字一致。V8 不支援或不納入第一版的 `--q`／`--quality`、`--draft`、`--oref`／`--ow` 與 `--turbo` 不得由未來 assembler 輸出。

機器可讀來源為 `webapp/src/lib/engine/midjourneyParameterContract.js`；七組基準位於 `webapp/src/lib/engine/midjourneyParameterFixtures.js`，涵蓋一般單人、Body Type、完整套裝、canonical pose、Character Card、雙人、固定構圖、特殊穿搭、連身服、V8.1 相容值與 SD／HD。第一階段以 SHA-256 驗證三個歷史主輸出逐 byte 不變，並明確確認目前 `midjourneyPrompt` 尚未出現任何 MJ 參數尾段。

第二階段新增 PAGE1 `F MJ 參數設定` 工作區與 contract-backed draft model。介面提供模型版本、Standard／Raw、SD／HD、Stylize／Chaos／Weirdness slider 與數值輸入，以及精準寫實、平衡、創意三組預設；數值必須依契約取整並限制在合法範圍，預設不得覆寫模型版本或解析度。F 不得出現一般區塊的隨機／全無操作，也不得被全域「全部隨機」、「清除可選欄位」或「清空可清除項目」改動。

本階段的 F 值只存在目前 PAGE1 component draft；重新載入頁面後回到契約預設。它尚未註冊為 engine lock、尚未進入 `vps.locks`／Saved Cards／匯入還原，也尚未附加到 `midjourneyPrompt`。因此切換任何 F 控制後，Gpt、Grok/Z-Image、AI 與三組固定構圖 Prompt 必須逐字不變；第三階段才處理 selection、儲存與還原相容性，第四階段才允許輸出參數尾段。

第三階段以既有欄位名稱把六個 F 值註冊到 engine Lock schema 的獨立 `midjourney` section。這些 Lock 使用契約預設與正規化規則：enum 非法值退回預設，數值轉成整數並限制在合法範圍，缺少、空字串、`null` 或非數字資料退回預設。舊版 `vps.locks`、舊 Favorites v2／v3 selection 與匯入收藏不需升版 migration；缺少 F 欄位時由 `normalizeLocks()` 自動補齊。

F 值現在必須進入 `vps.locks`、每次生成的 resolved selection、Favorites 本機／Firebase compact payload，以及預覽與 Saved Cards 回填。一般「全部隨機」、「清除可選欄位」與「清空可清除項目」均須保留目前 F 值。由於第三階段仍禁止參數尾段，F-only 更新不得觸發 live Prompt reroll：preview generation signature 必須排除六個 F key，完成生成後只把正規化設定合併回 selection。標準 Prompt 文字在第四階段前尚無可解析參數，因此文字回填應保留使用者當前 F 值；Saved Cards selection 則以卡片內保存值為準完整還原。

第三階段仍不得改動 `midjourneyPrompt` 或其他五組 Prompt 文字。所有公開輸出、AI 字數預算、canonical pose 與歷史欄位映射必須保持第二階段基準；第四階段才可把 selection 中的 F 值組裝成 AI 專屬參數尾段。

第四階段由 `webapp/src/lib/engine/midjourneyParameterTail.js` 啟用單一 canonical assembler。`midjourneyPrompt` 的 descriptive content 必須先完成既有 section budget 與壓縮，再於最後一個描述句之後加入一個空格和參數尾段；尾段順序固定為 `--v`、可用時的 `--ar`、選用的 `--raw`、`--s`、`--c`、`--w`、`--sd`／`--hd`，參數之後不得再有標點或描述文字。第四階段的 `--ar` 仍由 resolved `selection.aspectRatio` 投影；第七階段改由 `selection.mjAspectRatio` 優先，選擇 `page1` 時才 fallback 到既有 PAGE1 比例。空值、`none`、`random` 或非比例格式不得輸出。

參數尾段只允許出現在歷史公開欄位 `AI` → `midjourneyPrompt`，單人與雙人模式使用相同 assembler。Gpt、Grok/Z-Image、五官特寫照、胸上特寫照與全身角色照都不得繼承任何 MJ 參數。現有 Body Type、人物、服裝、場景、成像與 projected canonical pose 描述保持原文；七組 phase-1 baseline hash 在移除尾段後必須逐 byte 相同。AI 字數預算和 same-seed audit 的統計、重複與控制語檢查只評估 descriptive content，不計算已驗證的參數尾段。

PAGE1 live preview 保留第三階段的 generation signature 隔離：F-only 變更不得重跑 renderer，而是移除舊尾段後以同一段 description 和 `mjAspectRatio`（`page1` 時 fallback 到 resolved PAGE1 比例）重建新尾段。標準 Prompt 回填與 Saved Cards Markdown 匯入只接受位於 AI 文字最後的完整 canonical tail；成功解析時回填新的 `mjAspectRatio` 與歷史 `aspectRatio` 相容欄位，沒有合法尾段時維持目前 F 設定。`--q`／`--quality`、`--draft`、`--oref`／`--ow` 與 `--turbo` 仍屬禁止輸出範圍。第五階段才可討論 Midjourney-native descriptive structure，不得在第四階段順帶改寫 Body Type 或現有 AI 內容。

第五階段由 `webapp/src/lib/engine/midjourneyNativeStructure.js` 將既有 AI section 組裝結果投影為一個 Midjourney-native text-prompt block，再交給第四階段 assembler 附加 canonical tail。投影只把 section 間空白正規化為單一空格；所有已撰寫句子、詞彙、標點、資訊順序及字數保持不變。不得藉此移除 `Create a ...`、改寫 Body Type、改寫服裝／場景／成像內容、重排 section，或變更 projected canonical pose。單人與雙人都使用相同單區塊規則；雙人的 `Woman 1`、`Woman 2`、`Pose` 等既有標示仍保留在原位置。

Gpt、Grok/Z-Image 與三組固定景別輸出不得經過此 whitespace projection。第五階段 fixtures 以七組 phase-4 代表案例凍結單區塊 description hash、原字數與既有參數尾段，同時驗證非 AI baseline、Body Type 與 canonical pose；此 gate 納入 `npm run test:prompt-quality`。目前仍不進行任何 Midjourney 專屬描述詞重寫，Body Type 與人物體型語意繼續等待使用者實測後另行討論。

第六階段不再修改 production renderer 或公開 Prompt，而是以 `midjourneyCompletionGate.test.js` 建立跨消費端阻擋式完成閘門。七組 deterministic fixtures 必須從同一份 resolved selection 通過引擎三個歷史主欄位、六種公開輸出契約、PAGE1 六張 Prompt 卡、DLL Prompt sources、Standard Prompt 回填、Favorites v3 codec 與 Saved Cards Markdown 匯入。閘門同時凍結 Gpt／Grok-Z baseline、第五階段單區塊 AI description hash、canonical parameter tail、F／aspect ratio 還原、固定景別輸出不含 MJ 參數，以及 Pose Composer 三組主 Prompt 逐字共用 canonical pose。此測試納入 `npm run test:prompt-quality`；UI、renderer、storage ID 與歷史公開映射保持第五階段結果。

第七階段新增 F 專屬 `mjAspectRatio` enum。選項直接以 Midjourney `--ar` 常用整數比例呈現，另保留 `page1` 相容選項；它只改變 AI 尾段，不加入描述壓縮器、不影響 Gpt／Grok-Z／固定景別輸出，也不參與 PAGE1 一般隨機／清除或 generation signature。舊版只有 `aspectRatio` 的 selection 與尾段仍可還原，已知比例會同時回填 F 值與歷史 PAGE1 欄位，未知自訂比例則以 `page1` F fallback 搭配歷史欄位保留原值。

目前 F 介面將 `--ar` 以離散滑桿呈現，滑桿每一格對應一個既有比例選項，包含 `跟隨 PAGE1`、`21:9` 與 `1:2`，不接受任意文字比例輸入；如此可維持既有 option ID、正規化、儲存與尾段還原相容性。`參數尾段`下方的逐項說明由同一份 contract-owned `parameterHelp` 提供，解釋 `--v`、`--ar`、`--raw`、`--s`、`--c`、`--w`、`--sd` 與 `--hd` 的作用及數值大小方向；說明只屬 UI 輔助文字，不會寫入任何 Prompt 或改變 assembler 輸出。

#### Midjourney 描述結構優化（新版第一階段契約）

使用者已解除「不得重寫既有 AI 描述」限制；新的六階段工作只作用於歷史公開欄位 `AI` → `midjourneyPrompt`。第一階段先由 `midjourneyDescriptionContract.js` 定義單行、多語意句的固定順序：成品類型、構圖、人物、服裝、projected canonical pose、場景／光線、攝影成像，最後才由既有 assembler 附加 MJ 參數。語意區塊以完整句界分隔，區塊內來源細節使用逗號；不得把不同語意直接黏成 `front view A 20s...`。

第二階段起，AI 成品類型不得再使用 `Create a／an` 命令式開頭，六種成品類型分別使用直接視覺身份，例如 `Photorealistic editorial portrait.`、`Premium fashion advertising image.` 與 `Watercolor portrait illustration.`。第一階段只建立契約、六種成品類型 target 和七組 deterministic baseline；現有 Prompt bytes、renderer、參數尾段、Body Type、canonical pose、Gpt、Grok/Z-Image 與三組固定景別輸出均不變。

第二階段已啟用上述直接開頭。AI 的 image type 由 contract-owned mapping 輸出，不再回讀共用 `Create a...` 句子；構圖區塊固定以完整句點結束後才接人物，因此 `front view A 20s...` 類黏接不可再出現。單人與雙人共用此規則。Gpt、Grok/Z-Image 與三組固定景別輸出仍使用原本格式，strict audit 會把三組不同長度的成品類型描述正規化成同一個 resolved image identity 再檢查 drift。

第三階段將一般單人的 AI 人物開頭改為直接視覺身份 `20s Japanese or Korean woman, seductive editorial presence`，不再沿用 Grok/Z-Image 的 `A 20s seductive stunning...` 跨模型固定句。Grok/Z-Image 保留 Body Type 的完整數值與區域錨點；AI/MJ 改由後續 Body Type anchor 規則輸出短正向身形片語。髮型、髮色、眼鏡及耳機仍依同一 resolved selection 保留；Gpt 與 Grok/Z-Image 的人物文字不變。服裝繼續沿用共用構圖可見性投影，但同一服裝句中的 `at the lower crop edge` 只能出現一次，避免可見邊界重複搶權重。角色卡、雙人及特殊模式的專屬壓縮規則留在第五階段處理。

第四階段保持 projected canonical pose 逐字不變，並把 AI 的場景、光線與成像改為直接視覺描述。場景句不再加 `In`，場景與光線分成相鄰完整句，避免 `In ..., lit by ...` 長鏈；攝影風格使用 `<photographer>-inspired <image language>`，鏡頭移除 `shot on` 後直接輸出焦段／鏡頭身份。所有文字仍須可追溯到原 resolved selection，不得新增景深或其他未選視覺事實；Gpt、Grok/Z-Image 與固定景別輸出維持原本連接語法。

第五階段將相同直接式結構套用到 Character Card、套裝／特殊穿搭／連身服、雙人與固定構圖。Character Card 以 `20-year-old East Asian woman` 作為直接主體，完整保留四個 permanent identity anchors、投影後身形、髮型與有效配件；髮型變體移除 `keep／add／without changing` 等內部操作句，只輸出實際可見變化。完整造型只移除片語末端多餘的類別字 `outfit`，不得刪除具名服裝或穿著結構。

雙人 AI 不再使用 `Woman 1:`、`Woman 2:`、`Pose:`、`Scene:`、`Lighting:` 或 `Camera Look:` 標籤，固定改為 `Two 20-year-old Japanese or Korean women.`、`First woman, ...`、`Second woman, ...` 與後續直接句。角色與服裝仍必須一一綁定，Gpt 與 Grok/Z-Image 的既有雙人標籤不變。AI 長度契約新增雙人目標 160 words／soft max 180 words；一般、完整造型與 Character Card 預算不變。固定構圖仍按人物、服裝、姿勢、場景與成像順序輸出，且不得洩漏 fixed-set 控制語。

第六階段不再改寫 renderer。`midjourneyCompletionGate.test.js` 將七組 deterministic 描述 target 升級為阻擋式完成閘門，逐一驗證直接成品身份、單一文字區塊、禁止 AI section labels、對應長度政策、歷史三欄位映射、六組公開輸出契約、PAGE1 Generation Cards、DLL Prompt Sources、Standard Prompt 匯入、Favorites v3 與 Saved Cards Markdown。Pose Composer 仍逐字共用 canonical pose，三組固定景別輸出仍不附加 MJ 參數。

#### 已啟用：AI/MJ Body Type 短正向 anchor

這組規則只作用於歷史公開欄位 `AI` → `midjourneyPrompt`，包含一般單人與雙人角色的 Body Type 片語。它使用同一份 resolved Body Type source 做來源衍生，但移除身高、體重、三圍、胸杯級距與 torso-to-leg ratio 等測量字串，改成短而可視化的正向 anchor：

- `高挑時裝模特` → `Tall fashion-model silhouette, long legs, high waistline.`
- `一般基本體型` → `Natural balanced silhouette, gentle waist curve, natural bust and hips.`
- `柔和沙漏身形` → `Soft hourglass silhouette, fuller bust, wider hips.`
- `性感曲線身形` → `Curvy hourglass silhouette, fuller bust, defined waist, rounded hips.`
- `運動緊實身形` → `Fit athletic silhouette, firm build, subtle muscle definition.`
- `小隻精緻身形` → `Petite refined silhouette, compact frame, delicate proportions.`

`Gpt`（`grokPrompt`）、`Grok/Z-Image`（`zImagePrompt`）、資料庫原始英文描述、resolved selection、Character Card 結構化身份與 canonical pose 不受這組壓縮影響；MJ 參數尾段也維持原有 assembler 與字數計算邊界。契約版本為 `MIDJOURNEY_DESCRIPTION_CONTRACT_VERSION = 1.7.0`。

#### 已啟用：MJ 五官結構變體

六組公開五官選項在共用 `en` 原始描述之外，可透過 `knowledge_base/item_metadata.json` 的同選項 `mj.face` 欄位提供 Midjourney 專用表達。`mj.face` 只服務歷史公開欄位 `AI` → `midjourneyPrompt` 與 `MJ 胸上特寫照`，同一份 resolved selection 仍同時供三個主 renderer 使用；它不改選項 ID、`en`、Gpt、Grok/Z-Image、Character Card、Saved Cards 或匯入／匯出資料。

MJ 五官短描述固定依「臉型輪廓 → 眼型／眉型 → 鼻子／嘴唇」組織，保留可見結構而不加入表情、妝容、髮型、鏡頭、光線或姿勢。若資料列沒有 `mj.face`，MJ renderer 只回退到既有 `en` 的最短五官主錨點；不得在 renderer 內自行發明另一套臉部語意。

六組 `mj.face` 的已確認結構如下：

- `韓系偶像臉`：`small refined oval face` + `clear almond eyes with straight brows` + `slender nose bridge and softly shaped lips`
- `日系清透臉`：`soft natural oval face` + `gentle almond eyes with natural brows` + `small nose and softly defined lips`
- `甜美可愛臉`：沿用日系清透臉的 `soft natural oval face`，搭配 `bright round eyes with curved brows` 與 `small rounded nose and softly shaped lips`；不得使用 `soft rounded face`、`full cheeks`、`rounded chin`。
- `冷感高級臉`：`refined elongated oval face` + `upturned eyes with straight brows` + `defined nose bridge and sculpted lips`
- `成熟性感臉`：`softly defined oval face` + `upturned eyes with arched brows` + `clear nose bridge and full shaped lips`
- `混血立體臉`：`dimensional elongated oval face` + `deep-set round eyes with defined brows` + `high nose bridge and sculpted lips`；`deep-set` 只表示眼窩深度，不取代 `round eyes` 的眼型。

這六組固定使用三段結構，不依景別增減描述量。眼型名稱的語意也固定：`almond eyes` 為杏仁眼、`round eyes` 為圓眼、`upturned eyes` 為上挑眼；`straight／natural／curved／arched／defined brows` 分別表示直眉／自然眉型／彎眉／拱眉／明確眉型。這些結構只作用於 `mj.face`，不改寫共用 `en`、Gpt、Grok/Z-Image、Character Card 或儲存相容欄位。

#### 已啟用：Midjourney 比例與鏡頭行為適配

主 `AI` → `midjourneyPrompt` 會在既有 composition visibility projection 之後建立非持久化 derived context，依有效 MJ 畫面比例、framing bucket 與選定鏡頭的光學行為補充自然裁切、中央構圖、長焦視野或移軸垂直線等來源語意。這層不改 `Gpt`、`Grok/Z-Image`、固定景別輸出、原始 `lensId`、Pose Composer canonical pose、Saved Cards 或匯入／匯出資料；未選擇姿勢時也不會因比例自行發明坐姿、站姿、手部或腿部關係。

#### 已啟用：MJ 低自由度預設

`F｜MJ 參數設定` 的契約預設現在採用現有「精準寫實」preset 的低自由度組合：`V8.2`、`跟隨 PAGE1`、`Raw`、`--s 25`、`--c 0`、`--w 0`、`SD`。這會讓新建 PAGE1、缺少 MJ 欄位的舊鎖與舊收藏，在未明確指定時使用較貼近描述、較少風格偏移的 AI 尾段。

這組變更只改「缺少值時的契約 fallback」；已保存且明確指定 `Standard`、Stylize、Chaos、Weirdness 或 HD 的資料必須原值還原。F 仍排除 PAGE1 一般隨機、清除與生成 reroll，現在作用於 `AI` → `midjourneyPrompt` 與 `MJ 胸上特寫照` 的 MJ 尾段；Gpt、Grok/Z-Image、一般結構化胸上、全身輸出、PAGE1 構圖比例與既有 storage ID 不受影響。契約版本為 `MIDJOURNEY_PARAMETER_CONTRACT_VERSION = 1.6.0`。

專案把 `--raw` 與低 `--s` 視為低自由度控制；Midjourney 官方說明亦將 Raw 描述為減少自動創意介入，低 Stylize 描述為更貼近 Prompt。此處的 `--s 25` 是本專案比官方設定面板 `Stylize Low = 50` 更保守的實測起點，不宣稱是 MJ 官方 preset 名稱。

#### 已啟用：MJ 胸上特寫與五官特寫退役

PAGE1 單人輸出固定為 `Gpt`、`Grok/Z-Image`、`AI Prompt`、`胸上特寫照`、`MJ 胸上特寫照`、`全身角色照`。`facial-closeup-portrait`／`五官特寫照` 不再進入新生成結果、Generation Cards 或 DLL Prompt Sources；它的 preset 與相容性 metadata 仍保留，Saved Cards 舊資料中的 extra prompt 仍可讀取、序列化與匯出。

`chest-up-mj-portrait` 是獨立的 native MJ extra output，不會把 MJ labels 或 `multi-cut sequence n=2` 帶入文字。它與一般胸上輸出共享同一 resolved selection、胸上構圖、可見上身服裝與 projected canonical pose；正常單人的人物身份、場景、光線與成像沿用主 `AI` 語意來源，特殊角色保留裁切相容的 MJ subject anchor。只有外層格式改為單行，並在尾端使用固定 `--ar 4:5`。F 的其他設定由同一份 contract assembler 繼承，因此可與主 `AI` 輸出同步測試，但不會改變 PAGE1 的構圖比例。

## 2. GPT 完整保留與壓縮分流原則

### GPT 完整保留型原則

`Gpt` 版現在以「完整保留」為主，不再以字數壓縮為目標。實作與資料維護時，應先問三件事：

1. 這個詞是否帶來新的可視覺化資訊？
2. 這個詞是否屬於目前欄位的責任？
3. 這個詞是否有助於生成穩定、造型鎖定或動作/場景可控？

如果答案是肯定的，`Gpt` 版應保留，不應為了縮短 prompt 而刪除。

`Gpt` 版應保留：

- 可被目前構圖辨識的結構、材質、版型、長度、穿法、位置。
- 影響生成結果的 anchor，例如 `low-rise`, `thigh-high stockings`, `side-part`, `direct eye contact`。
- 特殊穿搭、套裝、連身的造型核心與層次關係。
- 構圖投影後仍有效的 Pose Composer 身體結構、支撐點、手部位置、頭部方向。
- 人物體態、五官、膚質、髮型、髮色、表情中原始資料提供的有效細節。
- 場景、燈光、鏡頭、成像模擬中的有效環境與攝影控制資訊。

`Gpt` 版允許的清理範圍：

- 移除 markdown 符號。
- 清理重複空白與壞標點，例如 `.,`、`,.`。
- 不輸出空值、`全無`、`none`、`random`。
- 避免同一段完全重複出現兩次。
- 加上必要 section lead，例如 `The subject is...`、`She wears...`。
- 依 section 責任移動內容，例如特殊穿搭配件移到 `Headwear, eyewear, and bag`。

`Gpt` 版不應做：

- 把長描述縮成短片語。
- 在構圖投影仍判定有效時刪除數值、比例、支撐點、材質、層次、guard 或造型鎖定資訊。
- 因為文字看似冗長就移除 `body proportion anchor`、`worn normally on the face`、palette、`controlled by selection` 等原始控制語。這些是否保留應由資料庫 authoring 或後續專案決策處理，不在 Gpt 最終輸出層任意刪除或自然化改寫。
- 把多個選項的內容合併時遺失原始描述。

### Grok/Z-Image 與 AI 壓縮原則

`Grok/Z-Image` 與 `AI` 可以繼續壓縮，但只能在不破壞核心資訊的前提下進行。Grok/Z-Image 必須遵守前節的來源可追溯規則；AI 可使用更激進的極簡化策略。

可刪減：

- 同義詞堆疊，例如同時寫多個 `beautiful / polished / refined / elegant`。
- 泛用結尾，例如 `coordinated styling`, `balanced look`, `fashionable presence`，除非它是唯一的風格 anchor。
- 正常狀態說明，例如眼鏡正常戴在臉上時不需要 `worn normally on the face`。
- 內部控制語言，例如 `controlled by selection`, `preserve selected wardrobe identity`。`body proportion anchor` 與完整身材數值／比例不可由 Grok/Z-Image 刪除。
- 過長解釋句，例如「模型自然決定姿勢」或「服裝按正常穿著順序」這類操作說明。

避免：

- 壓縮後遺失構圖投影仍保留的服裝、髮型、體態、姿勢支撐點或場景 anchor。
- 負面堆疊：`not...`, `avoid...`, `without...`。
- 把場景、光線、鏡頭、人物表情塞進服裝欄位。
- 把完整穿搭塞進一般上身或下身單品。
- 把顏色寫死在一般單品 prompt；顏色應交給配色欄位。

## 3. A 人物設定輸出規則

`Gpt` 版應完整保留被選到的體態、五官、膚質、髮型、髮色、神情與配件描述。不要在最終輸出層把長描述壓成短片語。

`Grok/Z-Image` 與 `AI` 可依模型需求壓縮，壓縮時仍須保留核心人物識別與造型特徵。

資料庫 authoring 建議長度仍可作為新增資料時的品質參考：

- 體態：8-16 words。
- 五官：8-16 words。
- 膚質：4-12 words。
- 髮型：8-16 words。
- 髮色：4-12 words。

建議寫法：

```text
core category, 1-3 concrete visible traits
```

`Gpt` 版應完整保留，`Grok/Z-Image` / `AI` 壓縮時至少保留：

- `long legs`, `narrow waist`, `rounded hips`
- `small refined face`, `clear bright eyes`
- `dewy glass skin`, `natural freckles`
- `silver-gray white deep side-parted long soft waves, realistic dyed texture`
- `natural black wet-look long wavy hair`

`AI` 壓縮時可刪減；Grok/Z-Image 不可刪除完整身材數值與比例 anchor：

- 數值比例、身高體重、測量式 anchor。
- `hair color applies only to scalp hair` 這類操作說明。
- `eyebrows remain natural` 可壓成 `natural eyebrows`，只有特殊髮色需要時才保留。
- 壓縮版中不要讓髮色獨立成無意義短句，例如 `wet-look long wavy hair. natural black hair.`；可合併為 `natural black wet-look long wavy hair`。
- 臉部美感同義詞堆疊。

## 4. B 神情姿態輸出規則

`Gpt`、`Grok/Z-Image`、`AI` 在 Pose Composer 啟用時先共用同一個 resolved pose，再依共用構圖契約產生 projected canonical pose。只要投影結果非空，三組必須逐字共用，完整保留投影後仍可見的身體安排、重心、支撐、手部位置、道具接觸與頭部方向；只允許外層段落標題或排版不同，不得在 renderer 層再次壓縮、刪減或改寫。`faceDetail` 與 `headShoulders` 的結果為空，三組都不輸出姿勢段落。

表情只寫臉部可見反應、嘴型、眉毛、眼瞼狀態與情緒強度，不指定眼神方向。姿態只寫身體安排、重心、支撐與動作狀態，並可保留 Pose Composer 的 canonical head direction；但 `head naturally facing the camera`、`turning back`、`over-the-shoulder` 等頭部／身體方向不得由姿態文字偷渡進表情資料。

表情是三組 renderer 共用的 canonical 語意來源，不是只供 Midjourney 使用的補充欄位：

- `Gpt`（內部欄位 `grokPrompt`）完整保留被選資料列中所有有效的表情、嘴型與眼周描述，只做格式整理、移除空值與完全重複。
- `Grok/Z-Image` 保持 source-traceable reduction。可以刪除重複連接語與內部控制語，但不得刪掉獨立的嘴型、眼瞼／眉毛線索或情緒強度，也不得自行補充未選取的情緒。
- `AI`（內部欄位 `midjourneyPrompt`）可以整理成單段、短句與既有 MJ 輸出格式，但在描述已經短而具體時不應再刪減。主 MJ 與 `MJ 胸上特寫照` 使用同一份 resolved expression 語意；不預設建立 `mj.expression` 覆寫。
- 三組可以因段落標題、連接語與標點不同而有不同表面格式，但「柔和微笑」等獨立表情語意必須完整存在於三組；不需要為 Gpt 或 Grok/Z-Image 另加一套情緒形容詞。
- 目前仍沿用公開 `expressionId` 與歷史 option ID；若未來把視線拆成獨立控制，必須先設計 legacy mapping，不得以語意清理直接改名、刪除或重建 saved-card／restore 可讀的鎖定值。

共用資料應採不重複的組合方式，例如：

```text
Expression: soft natural smile, relaxed cheeks, gently lifted mouth corners
```

合併到公開 Prompt 後可以是：

```text
soft natural smile, relaxed cheeks, gently lifted mouth corners
```

不得從表情資料中加入 `looking directly at the camera`、`direct eye contact` 或其他視線方向，也不得因去重而把表情、嘴型或眼周線索整體刪除。

目前可接受的純表情例子包括喜悅、平靜、悲傷、克制憤怒、輕微驚訝、緊張、害羞，以及低強度的 `playful pout, lightly furrowed brows, teasing mock annoyance, affectionate expression`。`撒嬌生氣` 必須保持俏皮、低強度與非攻擊性，不能與 `restrained anger` 混成真正的憤怒。

`Grok/Z-Image` / `AI` 壓縮時可刪減：

- 不提供新視覺資訊的泛用語尾。
- 內部控制、fallback、selection 或完整性說明。

`Grok/Z-Image` / `AI` 壓縮時不可刪減：

- 唯一的表情／嘴型／眼周線索，例如 `soft natural smile`、`playful pout`、`lightly furrowed brows`。
- 使情緒強度成立的可視化詞，例如 `restrained`、`gentle`、`teasing mock annoyance`。

姿勢部分仍依原 canonical pose 規則處理：

- `standing pose with loosely crossed arms`
- `one hand brushing hair back`
- `visible hand-to-mouth contact`

`Grok/Z-Image` / `AI` 壓縮時可刪減：

- `body language` 可壓成 `posture`。
- `portrait moment`, `portrait interaction`, `beauty touch-up portrait moment` 這類泛用尾巴。
- `relaxed everyday...`, `polished...`, `controlled cinematic...` 若不影響畫面可刪。
- Pose Composer `手部動作` 保留手部位置與接觸點；獨立 `道具動作` 保留物件、持握方式與必要接觸狀態。Legacy `特殊動作` 只作 restore 遷移參考，不作新增主路徑。

Pose Composer 相關描述在構圖可見時應保留實際身體結構，例如 base arrangement、hand / prop placement、support anchor、head direction。三組輸出都直接使用同一段 projected canonical pose prompt。不要新增 Pose Modifier，除非使用者明確要求。

### Pose Composer「任意」與 canonical pose 規則

`poseArrangementId`、`poseHandId`、`poseHeadId` 的顯示名稱統一為 `任意`；既有 option ID 不變。`任意` 不是隨機抽選，而是不輸出該組固定描述，讓模型依姿勢基底、服裝、鏡頭與場景自由產生隨意、放鬆且自然的結果。

- 具體選項輸出具體英文描述；`全無` 完全不輸出該組內容。
- `隨機` 永遠不解析為 `任意`；姿勢基底、肢體、手部、道具與頭部會解析為具體選項，只有接觸／支撐的隨機允許自然解析為 `全無`。
- canonical 順序固定為：`She` + 具體頭部描述 + 有效道具描述（否則為具體手部描述）+ 姿勢結果。V1 有效道具接管手部層，不同時輸出兩者。
- 三組中任一組為 `任意` 時，在姿勢結果前加入一次 `a casual, relaxed, and natural`；三組同時為任意也只能出現一次。
- 肢體具體選項使用具體姿勢名稱；肢體為任意時退回姿勢基底名稱。
- `poseAnchorId` 的接觸／支撐屬於姿勢結果，例如 `... presents a wide-knee kneeling pose leaning against a high-back chair.`
- 啟用 Pose Composer 時，GPT、Grok/Z-Image、AI 三者必須逐字共用同一段 projected canonical pose prompt，只能不同外層標題或排版；近景契約若投影為空，三者必須一致省略。

### 隨機姿勢相容性（共用解析規範）

隨機姿勢的安全性在 renderer 前的 `buildPoseComposerItem()` 統一處理，規範實作於 `webapp/src/lib/engine/poseComposerCompatibility.js`。三種主要輸出以及未來共用 canonical pose 的 renderer 都接收同一組 resolved pose，不得在各自輸出層另加互相不一致的姿勢修正。

- 上半身裁切優先使用站姿／坐姿基底；牛仔中景排除躺姿，讓可見裁切和姿勢重心一致。
- 正面方位的隨機肢體排除側身／背向變體；隨機頭部會避免與側／背向身體同時使用「頭部自然朝向鏡頭」。
- 鳥瞰／正上方俯視時，隨機頭部排除需要正面臉孔可見的方向；上半身裁切排除只依賴腿部或地面接觸的手部動作。
- 背面視角的隨機道具排除臉部接觸型道具；自拍手勢仍沿用既有的方位接管規則。
- 相容性只限制 `隨機` 候選，不替換明確 lock。若使用者刻意選擇衝突方向，resolved pose 與三組 canonical prompt 仍照實保留。

這套規範只處理鏡頭裁切、角度、方位與姿勢層的可組合性；場景物件是否真的能提供支撐，仍由既有 anchor／水域規則處理，完整場景幾何相容性不在本階段範圍。

## 5. C 穿搭設定輸出規則

### 一般上下身與配色

`Gpt` 版應完整保留被選到的一般單品、配色、版型、穿法、圖案、外層、鞋襪與 layering guard。一般單品仍只描述本身，不描述完整穿搭；但若組合器產生了必要 layering 或 waistline coordination 語句，`Gpt` 版不應因壓縮而刪除。

`Grok/Z-Image` / `AI` 可依模型需求壓縮一般單品。

資料庫 authoring 建議格式：

```text
fit or rise, color from palette if already composed, garment type, 1-2 concrete traits
```

範例方向：

- `tight white ribbed cotton camisole with slim straps`
- `high-rise fitted indigo straight-leg jeans`
- `washed denim jacket with chest pockets and metal buttons`

`Grok/Z-Image` / `AI` 壓縮時可刪減：

- `clean compact upper-body line`
- `balanced leg line`
- `classic five-pocket construction`
- `properly worn on both shoulders`
- `realistic outer-to-inner dressing order` 的長句；如需要只保留短 guard。

### 鞋襪與外層

`Gpt` 版應完整保留鞋襪與外層的款式辨識點、穿法、版型、開合、肩線、材質與必要正常穿著 guard。鞋襪與外套要保留款式辨識點，但避免在資料庫 authoring 時把正常穿著狀態寫得像特殊指令。

保留：

- 鞋型、鞋底、鞋面、signature accent。
- 襪長、材質、蕾絲、garter、ribbed texture。
- 外套種類、長度、材質、開合、肩線或 hood。

`Grok/Z-Image` / `AI` 壓縮時可刪減：

- 正常穿著、自然可見、完整覆蓋這類預設狀態。
- 過長的外層穿搭順序說明，除非該組合容易生成錯層。

### 套裝與連身

套裝與連身的主要用途是鎖定服裝造型與穿搭方式。`Gpt` 版應完整保留套裝/連身描述與配色控制資訊；`Grok/Z-Image` / `AI` 若壓縮，不能改變服裝設計方向。

`Gpt` 版應完整保留，`Grok/Z-Image` / `AI` 壓縮時至少保留：

- 主服裝類型。
- one-piece 或 set 的核心輪廓。
- neckline、hem、fabric、trim、主要結構。
- 套裝必要識別物，例如制服帽、apron、bunny-ear headband。
- 配色控制所需的目標區域，但語氣要短。
- 完整造型色系在 Gpt 中應融入服裝片語，例如 `black-and-red street solid satin cheongsam mini outfit`，不要保留 palette direction 操作句。
- 特殊上下配色用短片語保留上下區域，例如 `lime whisper lower hem or skirt accent`，不要輸出 `coordinated top-to-bottom palette`。

`Grok/Z-Image` / `AI` 壓縮時可刪減：

- `one-piece silhouette` 重複出現時可刪。
- `main fabric color controlled by...` 可壓成 `selected main fabric color`。
- `selected main fabric color`、`selected uniform color`、`controlled by...`、`complete outfit palette direction...` 可移除或融入服裝，不作為獨立控制語。
- `metal hardware kept in fixed metallic tones` 可壓成 `metal hardware in fixed metallic tones`。
- 泛用的 `complete styling`, `polished outfit`, `balanced silhouette`。

### 特殊穿搭

特殊穿搭是完整造型包，不能因壓縮而拆壞原始搭配。資料庫英文 prompt 仍必須以 `complete outfit:` 開頭。`Gpt` 版可維持人工易讀的分組，但新原則是「只分類，不刪除」。

資料庫建議格式：

```text
complete outfit: style direction. core top or one-piece, core bottom, outer layer if any, socks or footwear, key accessories, fixed visual anchors.
```

Gpt 單人輸出會將特殊穿搭整理成：

```text
Subject:
The subject is ...

Hair and body details:
...

Wardrobe:
Full outfit:
...

Headwear, eyewear, and bag:
...
```

Gpt 分類規則：

- `Hair and body details`: 放在 `Subject`，收納特殊穿搭內含的髮型、瀏海、髮色、刺青、身體小記憶點。
- `Full outfit`: 上衣、下身、連身、外套、襪類、鞋款、皮帶、首飾、手套、耳機、穿搭層次。
- `Headwear, eyewear, and bag`: 帽子、頭巾、髮夾、眼鏡、墨鏡、包包。

`Gpt` 版應完整保留，`Grok/Z-Image` / `AI` 壓縮時至少保留：

- 固定造型的主風格短句，例如 `Y2K schoolgirl-inspired styling`。
- 所有核心衣物層次。
- 鞋襪、包包、帽子、眼鏡等可人工刪改的 accessory anchor。
- image-reference outfits 的 hair、bags、accessories、footwear，除非該批資料明確要求 omit bags and hairstyles。

`Grok/Z-Image` / `AI` 壓縮時可刪減：

- 尾端純泛用 `coordinated ... styling`。
- `complete special outfit` 這種輸出層重複前綴；資料庫仍保留 `complete outfit:`。
- 不承載新資訊的 `look`, `styling`, `visible`, `delicate`, `small`；若該詞是唯一辨識重點則可保留。

## 6. 欄位責任邊界

### 角色卡 GPT 分組

角色卡的 GPT 版以「同一人物穩定性」為優先目標，因此 `Subject` 內使用固定分組。新增或修改角色卡時，應優先補 `profile` 分組資料，不要只依賴自動拆分 fallback。

Gpt 角色卡輸出格式：

```text
Subject:
Character Profile Card:
角色卡名稱

Identity and body:
...

Hair:
...

Outfit:
...

Accessories:
...

Photographic direction:
...
```

分組責任：

- `Identity and body`: 五官、臉型、眼睛、眉毛、鼻子、嘴唇、膚質、妝容、體態比例。這組是角色穩定性的核心，可以比一般 A 人物設定更完整，但仍要避免空泛美感詞堆疊。
- `Hair`: 髮色、髮型、瀏海、分線、髮尾、捲度、染髮層次。獨立出來方便後續衍生變化。
- `Outfit`: 上身、下身、連身、外套、鞋襪、固定穿搭層次。完整保留角色卡的 signature outfit，不因壓縮改變造型方向。
- `Accessories`: 眼鏡、耳環、項鍊、choker、戒指、手環、耳機、包包、鑰匙圈、腰帶等可被人工快速刪改的配件。
- `Photographic direction`: 角色卡整體攝影質感與穩定性要求，例如 `photorealistic editorial portrait`、`coherent facial identity`、`realistic fabric construction`。

角色卡 GPT 分組規則：

- Identity 不寫表情、眼神狀態或情緒控制，例如 `calm gaze`、`seductive expression`、`melancholic expression`。神情應交給 B 神情姿態控制。
- 眼鏡類角色要把眼睛描述保留在 Identity，例如 `clear dark brown eyes`；眼鏡本體放進 Accessories。
- 唇形可以保留可視覺化形狀，例如 `fuller lower lip`、`softly parted shape`；不要把情緒塞進嘴型，例如 `melancholic pout`。
- Hair 不混入服裝或配件。若帽子或 hood 是服裝本體的一部分，可留在 Outfit；若是可拆配件，放 Accessories。
- Outfit 不混入眼鏡、耳環、項鍊、包包等配件；但必須保留服裝設計核心、穿法、材質與鞋款。
- Accessories 沒有內容時不要輸出空區塊。
- `en` 原始描述可保留給 Grok/Z-Image 與 AI；GPT 角色卡輸出以 `profile` 分組為準，`profile` 內容應完整保留角色穩定所需細節。

新增資料時先確認責任歸屬：

- A 人物設定：體態、五官、膚質、髮型、髮色、神情、姿勢、特殊動作；角色卡需額外拆成 `Identity and body`、`Hair`、`Outfit`、`Accessories`。
- C 穿搭設定：服裝、鞋襪、外套、配件、顏色、圖案、完整造型。
- 場景設定：地點、場景物件、環境氛圍。
- 攝影設定：構圖、鏡頭、光圈、快門、風格、成像。

不要讓一個欄位偷渡另一個欄位的責任。若一個描述必須跨多個欄位才能成立，優先拆成對應欄位，而不是新增一個過長 prompt。

## 7. 資料庫新增前檢查清單

送出新資料前確認：

- 已閱讀對應 authoring guide。
- 英文 prompt 每個片語都能回答「畫面上看得到什麼」。
- Gpt 版會完整保留有效英文描述；新增資料時若使用數值 anchor、正常狀態說明、內部控制語或長 guard 句，需確認它們確實有助於生成穩定或造型鎖定。
- Grok/Z-Image 與 AI 壓縮後不得漏掉核心人物、服裝、姿勢、場景、燈光與 camera look。
- 一般單品沒有固定顏色，除非是不可拆的 signature detail。
- 套裝/連身在 Gpt 版完整保留，在 Grok/Z-Image / AI 壓縮後仍保留原設計方向。
- 特殊穿搭仍是完整造型包，且以 `complete outfit:` 開頭。
- 特殊穿搭在 Gpt 版可分組，但只分類不刪除。
- 角色卡已補 `profile` 分組，Identity 不含表情/眼神狀態，眼鏡與首飾等配件放在 Accessories。
- AI 版可從資料壓縮成短 prompt，但不會漏掉核心服裝與姿勢。
- Grok/Z-Image 可維持自然語言段落，不被 GPT 標籤化。
- 修改 prompt 生成邏輯時先補測試，確認紅燈，再改程式。

## 8. 相關測試

依修改範圍優先跑 targeted tests：

```bash
cd webapp
node --test src/lib/enginePromptPipeline.test.js
node --test src/lib/engineSpecialSubjects.test.js
node --test src/lib/engineSpecialOutfitCleanup.test.js
node --test src/lib/engineOutfitPresetDressCleanup.test.js
node --test src/lib/engineWardrobeControls.test.js
node --test src/lib/engineZImageWardrobeLanguage.test.js
node --test src/lib/engineExpressionPoseCleanup.test.js
node --test src/lib/enginePoseComposer.test.js
npm test
npm run lint
npm run build
git diff --check
```

允許既有 Vite chunk-size warning；其他錯誤需修正。
