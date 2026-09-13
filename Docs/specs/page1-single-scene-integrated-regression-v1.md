# PAGE1 現場整合組裝 v1：回歸案例與驗收計畫

Last updated: 2026-09-13

狀態：**Z-Image 已提交／推送 `b5ebebd`；MJ 第一階段已接入本機，程式 gates 通過，尚未提交。Browser QA 部分通過，外部影像仍待實測。** 歷史基準保留不變，Z-only 與 MJ-only expected snapshots 分開維護。規則見 [組裝規格](page1-single-scene-integrated-assembly-v1.md)。

## 1. 基準與材料

- 程式基準：`main` / `1db417a42dc081280372d3473f952d78e07066f2`。本次盤點 tracked／staged diff 為空。
- 現有使用者資料夾：`Docs/0822_new/`、`Docs/0912_test/`、`Docs/lie_on_back/` 均為 untracked，未修改、移動或納入提交。
- `Docs/0912_test/` 目前有 31 個圖片檔，含合圖。本地圖片是可選的人工驗收證據，不能成為乾淨 checkout 執行 unit test 的必要依賴，也不能以檔名推定模型、seed 或完整輸入。
- 最新 10 檔的視覺核對及使用者「以結果論可接受」來自本次對話前一輪；本次只確認檔案清單，不把它記為新一輪模型生成。

## 2. 已接受的人工測試基準

### V-01 蹲姿／低位自然自拍

生成摘要來源：

```text
性感曲線身形 / 冷感高級臉 / 柔霧細緻肌 / 柔波：中分 / 微風吹拂 / 淺金髮 / 柔和微笑 /
蹲姿 / 自然蹲姿 / 自然自拍 / 下巴微抬 / 肩背倚靠現有垂直面 /
短版蕾絲背心 / 緊身 / 工裝短褲 / 超低腰 / 寬版皮革腰帶 / 膝上蕾絲吊帶襪 /
戶外 / 戶外：新宿歌舞伎町招牌下 / 黃昏夕陽 / 高調亮光 /
寫實攝影 / 牛仔中景 (Cowboy Shot) / 地面高度鏡頭 /
蓋・布爾丁｜鮮豔敘事時裝 / 跨沖霓虹剪影濾鏡
```

人工測試移除了人物肩背倚靠句，並以低位自拍視角連接人物和入口街景。對話中最後四張對應檔案為 `imagine-9f9d33e9.jpg`、`imagine-c340d4e2.jpg`、`imagine-63f6344d.jpg`、`imagine-3cb37453.jpg`。

- 接受項：人物／場景融合方向；省略人物接觸句後仍可生成可接受畫面。
- 限制：原人工 Prompt 仍有 entrance support 的場景描述，圖片仍可出現柱子。不能把這組結果解讀成「不會再生成柱子」。
- 部分結果姿勢或自拍手臂未完全符合；不宣稱四張均通過蹲姿／自拍幾何。
- 此文件沒有虛構逐字完整舊 Prompt、模型版本或 seed。正式程式 fixture 是同意圖的新可重現測試，不能冒稱重現原圖片。

### V-02 跪姿／高位自然自拍

使用者提供的摘要：

```text
性感曲線身形 / 冷感高級臉 / 柔霧細緻肌 / 柔波：中分 / 微風吹拂 / 淺金髮 / 柔和微笑 /
跪姿 / 任意 / 自然自拍 /
落肩 T 恤 / 緊身 / 皮革長褲 / 超低腰 / 寬版皮革腰帶 / 赤腳 /
戶外 / 戶外：新宿歌舞伎町招牌下 / 藍調傍晚 / 霓虹染色光 /
寫實攝影 / 牛仔中景 (Cowboy Shot) / 高位俯視鏡頭 /
蓋・布爾丁｜鮮豔敘事時裝 / 跨沖霓虹剪影濾鏡
```

本輪接受的人工 Prompt 留存如下。**它是歷史測試輸入，不是 production 模板或逐句核准的通用規則。**

```text
Photorealistic on-location fashion selfie at the Shinjuku Kabukicho Ichibangai entrance during blue hour.

A high-angle front-camera selfie with a knee-up composition. She holds the phone in her right hand above her face and slightly forward, angling it downward toward herself. The image is the view captured by that phone. Her phone and holding hand remain outside the frame, with part of her selfie arm entering naturally from an upper corner. Her face, torso, hips, and bent knees occupy most of the image; her lower legs and feet fall outside the crop.

An adult Japanese or Korean woman in her twenties with a slender, curvy figure, a defined waist, and rounded hips. She has refined angular facial features and an understated editorial appearance, with soft matte skin and fine natural pores. Her long, light-blonde waves have a center part and a soft golden-beige tone. A few loose strands move gently in the evening breeze. She looks up toward the phone lens with a soft smile, relaxed brows, and gently narrowed eyes.

She kneels comfortably on the pavement near the entrance, with her knees bent beneath her and her torso relaxed. Her free hand rests loosely on her thigh as she takes the photograph.

She wears a fitted T-shirt with dropped shoulder seams and a close-fitting body. The neckline sits normally around her neck, and the fabric follows her torso with small natural folds. She pairs it with ultra-low-rise leather trousers, their waistband sitting low on her hips. The leather creases naturally around her hips and bent knees. A wide leather belt is worn loosely around her hips as a decorative accessory, with its structured buckle slightly off-center.

The downward view includes the pavement around her knees and a nearby edge of the entrance structure. Beyond her, cropped storefronts, illuminated signs, and passing pedestrians establish the surrounding Kabukicho street. The iconic red illuminated 「歌舞伎町一番街」 entrance arch is behind and above her; only a fragment may enter the upper edge of the selfie, while the rest remains outside the frame.

Cool blue evening ambience fills the street. Nearby illuminated signs cast red and cyan light across her hair, skin, and clothing, with related colors appearing on the surrounding entrance surfaces and pavement. The leather trousers catch small reflections of the same signs. Her face remains readable within the mixed evening light, with natural transitions between colored highlights and softer shadows.

Guy Bourdin-inspired bold narrative fashion photography, vivid color blocking, and graphic composition within a recognizable street setting. Neon cross-processed color with saturated reds, cool cyan shadows, and clean pale highlights. Deep blacks remain in shaded doorways and recesses, while skin, clothing, and nearby architecture retain visible midtone detail. The same color treatment and photographic texture continue across the entire frame.
```

來源檔名清單（全部位於 `Docs/0912_test/`）：

- `imagine-5ea63ddd.jpg`、`imagine-19a41aac.jpg`、`imagine-c19bcc31.jpg`、`imagine-63d429e8.jpg`
- `imagine-284d59a9.jpg`、`imagine-0ef6b754.jpg`、`imagine-5d121151.jpg`、`imagine-f486e49f.jpg`
- `ChatGPT Image 2026年9月12日 下午11_47_11.png`（四格合圖）
- `ChatGPT Image 2026年9月12日 下午11_48_25.png`

接受項：整體跪姿／俯視自拍更清楚、人物與街景有連貫色光、T 恤與長褲構成大致穩定。

保留觀察：部分持機手／手機入鏡、落肩剪裁／超低腰／裝飾腰帶不夠明確、招牌與俯視透視仍有模型差異。合圖及部分檔案的配件／衣物不同，不視為全部使用完全相同輸入；不計成功率。

正式 fixture 不直接繼承人工額外描述：自由手放大腿、路人、特定紅青反射、固定招牌裁切、一般化身形、中文招牌 literal、放寬濾鏡黑位。必須分別回到有效來源與既有契約；不以「測試成功」為理由改資料庫或刪衣物。

## 3. 可重現的 fixture 建立方式

沿用 [representative fixtures](../../webapp/src/lib/engine/representativePromptFixtures.js) 與 [現有測試 materializer](../../webapp/src/lib/engine/promptOutputContracts.test.js)：

1. 建立 all-none baseline（有全無選項才設為全無），再覆寫案例必要 locks。避免未列欄位全部隨機造成無法歸因。
2. 資料庫選項使用 `{ byZh: '...' }` 精確解析；code-defined 姿勢用已確認的 stable ID。找不到或不唯一即失敗，不能 silently fallback。
3. `任意` 必須使用 `model-natural-body-arrangement`，不是空值或隨機；需測試隨機者另列案例。
4. 每個案例固定 seed：`scene-integrated-v1-<case-id>`。此為未來工程 seed，不是歷史影像 seed。
5. baseline 與新版保存全部 resolved selections、三個主輸出及三個 derived text；去除 runtime ID／時間，不去除真正文字差異。檢查兩次同 seed 完全一致。
6. 先保存修改前 hashes／文字，再改 renderer；不得在修改後才生成「舊版」基準，也不得整批接受 golden 更新。

兩個核心案例的已核對 selector：

| 欄位 | V-01 fixture | V-02 fixture |
| --- | --- | --- |
| `subjectCount` | `1` | `1` |
| `poseBaseId` | `squatting` | `kneeling` |
| `poseArrangementId` | `squatting-natural` | `model-natural-body-arrangement` |
| `poseHandId` | `selfie-natural-right-arm` | `selfie-natural-right-arm` |
| `poseHeadId` | `chin-slightly-raised` | `none`（摘要未指定，不自行加入） |
| `poseAnchorId` | `shared-vertical-surface-support` | `none` |
| `framingId` | `牛仔中景 (Cowboy Shot)` | 同左 |
| `angleId` | `地面高度鏡頭` | `高位俯視鏡頭` |
| `locationId` | `戶外：新宿歌舞伎町招牌下` | 同左 |
| `lightingId` | `黃昏夕陽` | `藍調傍晚` |
| `lightDirectionId` | `高調亮光` | `霓虹染色光` |
| `topId`／`topFitId` | `短版蕾絲背心`／`tight` | `落肩 T 恤`／`tight` |
| `pantsId`／`bottomRiseId` | `工裝短褲`／`超低腰` | `皮革長褲`／`超低腰` |
| `waistAccessoryId` | `寬版皮革腰帶` | 同左 |
| `legwearId`／`shoesId` | `膝上蕾絲吊帶襪`／`全無` | `全無`／`赤腳` |
| `styleId` | `蓋・布爾丁｜鮮豔敘事時裝` | 同左 |
| `filmId` | `跨沖霓虹剪影濾鏡` | 同左 |

其他人物、場景屬性、成品類型依摘要明確固定；摘要未指定的服裝顏色、比例、鏡頭不從照片猜回。表中中文值（包含鞋襪的 `全無`）實作成 `byZh`，`none`／`tight` 與姿勢值為 raw ID；不能把資料庫鞋襪的全無 ID 寫成 raw `none`。`orbitId` 保持自拍現有 normalization，不另加互相矛盾的 orbit。

## 4. 最低回歸矩陣

以下是 **19 組 case families**，已展開為 45 組固定輸入。歷史 baseline 保留，Z 與 MJ 各自以獨立 expected snapshot 核對新規則；其餘輸出／排除路徑仍對比歷史 bytes。表內程式斷言已接入；高風險影像案例仍需外部模型驗收。

| ID | 輸入／變體 | 新版主要斷言 |
| --- | --- | --- |
| R01 | V-01 蹲姿低位自拍 | Z 保留蹲姿、自拍、angle、有效服裝；省略人物肩背倚靠句，不刪場景原有支柱；GPT／MJ 保留原 anchor |
| R02 | V-02 跪姿俯視自拍 | 保留 kneeling 基底及任意肢體語意，不新增雙膝／單膝指定或自由手姿勢；高位俯視不變成仰拍 |
| R03 | R01 anchor 切成全無，其他固定 | 目標 Z 的姿勢／scene 文字應與有 anchor 時等效且不回填；selection 可追溯兩組差異 |
| R04 | 站姿一般手勢、坐姿一般手勢 | 場景脈絡先行但不自動改 selfie／candid，也不產生未選手機或拍攝者 |
| R05 | 蹲姿雙手向前伸展＋獨立 anchor | 只刪 anchor；手肘倚膝、前臂與手腕關係保留，不能 regex 刪掉 support 字眼 |
| R06 | 鏡子自拍＋高位俯視＋歌舞伎町 | 保留鏡面／可見手機與 angle，不套用畫面外手機；不為合理化新增室內或改場景；標為高風險影像案例 |
| R07 | 男友／閨蜜自拍 | 保留同伴手持視角，不改成角色自己右手持機，不新增第二個可見人物 |
| R08 | 全身／cowboy／medium／chest-up／head-shoulders／face-detail | 仍沿用現有 body／wardrobe／pose／scene 可見性；畫面外赤腳與襪不回灌，也不改全身角色照 |
| R09 | 正面／左右側／後方、半臉構圖 | 有效 orbit 與既有嚴格側身／半臉句保留；姿勢省略不能把軀幹轉回正面 |
| R10 | 遮鏡手掌 | 原構圖主導權、五指與遮擋語意保留；新增場景先行不得要求完整人物／背景 |
| R11 | 落肩 T、露肩外套、連身服、完整套裝、彩色腰鏈 | 既有 wardrobe projection／覆蓋／配色／穿法及每項有效選色保留；不把落肩改露肩或連身拆兩件 |
| R12 | 室內、戶外、純色棚、全無場景 | 使用各自來源；不硬塞招牌、街道、柱子、天空、濕地；純色棚不憑空新增外景 |
| R13 | 光圈淺景深／柔焦／強烈壓黑／霓虹光 | Z 不自動減弱風格／成像；不把光學分離當作必須消除的錯誤；無來源時不補紅青色光 |
| R14 | 主 MJ 有 style＋film＋lens＋光圈＋快門＋Bloom | style／film prose 缺席，其餘有效攝影來源與 canonical pose 保留；Z／GPT 仍有有效 style／film；參數尾段不變 |
| R15 | MJ 胸上＋GPT 胸上＋全身角色照 | 全部文字與既有 baseline 完全一致；不被主 MJ imaging helper 污染 |
| R16 | 雙人、固定構圖、特殊角色、角色卡 | 第一版明確排除，全部輸出與 baseline 一致；角色卡四個永久身份與相容欄位不變 |
| R17 | 仰躺床／水中／海面，含特寫 | 已確認保留既有 surface-led 路徑；原三版完整 surface／濕潤感與 scene 全無行為逐字不變 |
| R18 | Exact Visible Text 開／關、舊 Saved Cards／Markdown restore | 只有原選定 literal 例外；不自動加入中文招牌；選項與既存 prompt 原文可讀，不擴大文字 restore 猜測 |
| R19 | 相同 seed 重跑、生成呼叫順序、獨立工作區 | 無額外 random draws、無共享模型就地修改；觀察式抓拍同 seed 輸出不變，其他工作區不繼承主 renderer policy |

斷言避免僅檢查某個英文詞是否在全文存在：R03／R05 必須驗證來源角色及句子歸屬；R14 刪的是 style／film producer，不是刪掉任何包含 `style`、`film`、`camera` 的詞。

## 5. 對應現有測試與後續驗證命令

- 主要契約與代表案例：[promptOutputContracts.test.js](../../webapp/src/lib/engine/promptOutputContracts.test.js)、[enginePromptPipeline.test.js](../../webapp/src/lib/enginePromptPipeline.test.js)、[engineZImageTurboPrompt.test.js](../../webapp/src/lib/engineZImageTurboPrompt.test.js)。
- 姿勢／景別：[enginePoseComposer.test.js](../../webapp/src/lib/enginePoseComposer.test.js)、[compositionVisibilityPose.test.js](../../webapp/src/lib/engine/compositionVisibilityPose.test.js)、[compositionVisibilityIntegration.test.js](../../webapp/src/lib/engine/compositionVisibilityIntegration.test.js)。
- MJ 隔離：[midjourneySceneImaging.test.js](../../webapp/src/lib/engine/midjourneySceneImaging.test.js)、[midjourneyParameterTail.test.js](../../webapp/src/lib/engine/midjourneyParameterTail.test.js)、[fixedFramingPromptIntegration.test.js](../../webapp/src/lib/engine/fixedFramingPromptIntegration.test.js)。
- 下游相容性：[savedCardsMigration.test.js](../../webapp/src/lib/savedCardsMigration.test.js)、[observationCaptureLab.test.js](../../webapp/src/lib/observationCaptureLab.test.js)，以及現有 standard import／restore 測試。

未來實作前後都從 repo root 使用同一條 audit 命令，獨立保存各自結果：

```bash
node scripts/validate_prompt_logic.mjs 200 prompt-quality-baseline --strict
```

實作後從 `webapp/` 執行 focused cases，再執行：

```bash
npm run test:prompt-quality
npm test
npm run lint
npm run build
npm run audit:prompts:strict
```

記錄字數／估算 tokens 的 avg、p95、max 及前後差異。人工長 Prompt 的成功不能當作符合 Z-Image Turbo 長度診斷的證據；不可為達標硬截字或放寬原有品質閘門。既有 heuristic findings 與本輪新增回歸分開記錄。

依 [Browser validation](frontend-visual-validation.md) 在指定本機 URL、desktop 1440×1000／mobile 390×844 檢視：同一組 selections 的六輸出、複製／匯出／restore、五工作區導航及觀察式抓拍入口，確認無 overflow、console／page errors。不要以 unit test 取代 browser completion。

## 6. 外部生成驗收

- 用**實際新版 renderer 輸出**重新測 V-01／V-02，另至少涵蓋一般非自拍、室內或棚景、鏡子自拍風險案例；MJ 使用自己的新輸出另測，不沿用 Z 的通過結論。
- 每份樣本記錄 case ID、完整 Prompt、resolved selection、模型／平台與可得版本、尺寸、可得 seed 和參考圖。MJ 記錄 Personalization／Moodboard 是否開啟與使用的設定；不可推定從未提供的值。
- 同一案例一次只比較一組規則；其他可控參數固定。無法固定 seed 時明記限制，不聲稱同 seed A/B。
- 分開評估：人物／場景融合、自拍視角、姿勢／肢體、服裝保留、景別、風格。招牌文字是否準確不是未啟用精確文字時的必要成功條件。
- 嚴重多手／斷臂、姿勢被換掉、服裝拆錯或場景丟失須單獨記錄，不因「融合看起來好」而自動通過。
- 程式 gates 通過表示內容與隔離契約成立；外部模型品質仍需使用者接受，不保證每張圖無瑕疵。

## 7. 歷史基準階段紀錄

2026-09-13 已依使用者要求先提交四份規格文件，commit `f187bbfa6856220de55903407d5eab01f3e278f2` 已推送至 `origin/main`；其 runtime 仍是 `1db417a42dc081280372d3473f952d78e07066f2`。隨後完成以下 behavior-neutral 測試基礎，後續已於 `1be19e8` 提交／推送：

- [固定輸入](../../webapp/src/lib/engine/sceneIntegratedAssemblyFixtures.js)：45 組，涵蓋 19 組案例類別，含 10 組明確排除的新政策路徑；R03 沿用 R01 的 seed，以確保只有 anchor 一個變數。
- [Node-only 測試工具](../../webapp/src/lib/engine/sceneIntegratedAssemblyTestSupport.js)：精確 selector 解析、同 seed 生成、完整選項快照、輸出擷取及 random draw 計數；不被 runtime 匯入。
- [舊版基準](../../webapp/src/lib/engine/sceneIntegratedAssemblyBaseline.json)：固定來源 SHA／hash、六種輸出 hash、可完整還原的 selection base／delta／removed keys，以及 R01／R02 六輸出的可讀全文。缺席的 derived 欄位記為空字串，仍依模式契約驗證。不得在未來改 renderer 後整批重建此歷史基準來消除失敗。
- [可執行測試](../../webapp/src/lib/engine/sceneIntegratedAssemblyBaseline.test.js)：52 個測試；同 seed 重跑、反向呼叫順序、現行 canonical pose、床／水／海面、六輸出、精確文字、Saved Cards codec／Markdown 主文字還原及觀察式抓拍隔離。Saved Cards 依既有規則補預設值，測試有效選項值保留及還原正規化，不要求原始欄位集合完全相同；不擴張為完整 ZIP round-trip。
- 已加入 `webapp/package.json` 的 `test:prompt-quality`；完整 `npm test` 原有 glob 也會執行此測試。沒有修改依賴、資料庫、renderer、UI、storage 或公開輸出契約。

驗證結果：focused **52/52**、Prompt Quality **221/221**、完整前端 **889/889**、lint、build 均通過。Build 只有既有大 chunk 建議。固定的七個來源 hash 核對一致；路徑／連結與 whitespace 檢查通過。

前後 strict audit 均使用 `200 / prompt-quality-baseline / --strict`：一般單人 20、雙人 20、固定構圖 160；阻擋、輸出完整性、exact duplicate、控制語、矛盾、coverage 均為 0。既有診斷維持 23（19 項衣物／場景 heuristic、4 項 near duplicate），不順帶修正。

| 輸出 | 前後平均字數 | 前後 p95 | 前後最大字數 |
| --- | ---: | ---: | ---: |
| Gpt | 578.0 | 724 | 778 |
| Z-Image | 316.9 | 405 | 438 |
| AI | 161.2 | 207 | 251 |
| 胸上特寫照 | 276.8 | 339 | 393 |
| MJ 胸上特寫照 | 172.9 | 208 | 234 |
| 全身角色照 | 256.1 | 330 | 397 |

本階段沒有 user-visible 行為變更，未啟動服務或執行 Browser QA／外部模型生成；不將測試基準通過宣稱為新人景融合驗收。下一步為 Z-Image 目標路徑的正式組裝及來源投影，同步調整窄範圍契約，再依第 5、6 節執行 browser 與外部影像驗收。角色卡與仰躺 surface-led 仍保留既有路徑，不重問範圍決策。

## 8. Z-Image 正式實作批次（2026-09-13）

- 第 7 節測試基準已提交／推送為 `1be19e8`，本節 Z runtime 工作後續已於 `b5ebebd` 提交／推送。以下驗證數字保留當時紀錄。
- 舊版 baseline JSON 與固定輸入均不改。新增 [Z-only expected](../../webapp/src/lib/engine/sceneIntegratedZImageExpected.json)，只指定 35 組 eligible inputs 的 Z hash，以及 R01／R02 可讀全文。其餘五種輸出、10 組排除路徑的六輸出、全部 selections 與 RNG draws 仍核對原基準。
- 新姿勢斷言使用未修改的 GPT 投影作為獨立 oracle：同一 resolved selection 僅將 anchor 設全無，可見自拍另移除 hand 後核對 Z 姿勢；另外確認自拍原文恰好出現一次且位於人物之前。不從已完成 Prompt 用 regex 刪除支撐字眼，也不以新 Z renderer 自己生成 expected pose。
- 核心案例逐段比較舊版人物、服裝、光線、風格、光學、成像 bytes；地點身份僅一次、其餘場景 clauses 保留。另驗證全無場景不補模板、近景不回灌自拍、手肘倚膝仍在、明確道具不與自拍重複。機器區塊順序只在 opt-in 路徑改變。
- 最終 focused assembly **55/55**、Prompt Quality **225/225**、完整前端 **893/893**、lint、build、`git diff --check` 通過。Build 保留既有大 chunk 建議。200／`prompt-quality-baseline` strict audit 的 avg／p95／max 與第 7 節表格相同；零 blocking、23 diagnostic-only。此 audit 多數為排除路徑，不能用平均字數不變推論新 Z bytes 沒變；35 組 Z snapshots 才是本輪精確差異證據。
- 既有未固定 seed 的 `locked expression remains independent from the previous orbit` 曾失敗一次：以 `expression-flake-proof-18` 在 HEAD 舊 renderer 與新版重現，GPT bytes 相同，命中五官來源的 `calm distant gaze-ready features`，不是表情新添視線。單獨及最終全套重跑通過；本輪不改這個非目標測試或五官資料。

Browser QA：**PARTIAL**。URL `http://127.0.0.1:5175/Virtual_Photography_Studio/`，1440×1000／390×900。五工作區與觀察式抓拍入口完成載入、DOM 尺寸與畫面檢查，無觀察到的 console errors、破圖或 document overflow；截圖直接保留於本次工具紀錄，未加入 repo 資產。核心狀態為自然蹲姿＋自然自拍＋肩背支撐＋歌舞伎町／cowboy：Z 的 anchor 缺席，GPT／MJ 仍有，六輸出完整。新卡片儲存後 Z 文字及回填六輸出均與儲存前逐字相同。

尚未通過的瀏覽器驗證：Copy 按鈕點擊後，內建瀏覽器 clipboard API 回傳空值；Download Markdown 沒有可攔截的 download event，等待逾時，但 console 無錯誤。不能將此宣稱為功能已壞或已通過，須以支援的瀏覽器補驗。Codec／Markdown 自動測試通過不取代此端到端邊界。原有五張 Saved Cards 未刪改，一張新增本機 QA 卡片 `#1KNL0X` 保留；測試後已還原 B 選項、環繞與髮型整理偏好，viewport override 已重設。

該驗證批次未進行外部模型生成、MJ runtime 調整或部署；Z runtime 後續依授權已提交／推送。下一個完成閘門為 copy/download 補驗及使用者用實際 Z renderer 輸出實測；MJ 後續批次見下節。

## 9. Midjourney 正式實作批次（2026-09-13）

起點 `main` / `b5ebebd`。僅一般單人主 `midjourneyPrompt` 接入新組裝；未 stage、commit、push 或部署。

- 新增 [MJ-only expected](../../webapp/src/lib/engine/sceneIntegratedMidjourneyExpected.json)：35 組主 MJ hash、R01／R02 可讀全文。歷史 baseline、Z expected 及 45 組固定輸入不改；全部 selection / RNG draws 一致，10 組排除輸入的六輸出逐字不變。GPT、Z、胸上、MJ 胸上、全身角色照的既有快照不更新。
- [MJ description contract 1.8.0](../../webapp/src/lib/engine/midjourneyDescriptionContract.js) 明訂 main opt-in、區塊順序、style/film 省略及 optics 保留。舊 phase-5 description hashes 留存，新欄位 `sceneIntegratedDescriptionHash` 僅套用 eligible main；其他當前主 MJ fixture hashes 逐組更新，不放寬參數尾段或身份斷言。
- 專用斷言檢查：地點身份僅一次且在人物之前；完整 canonical pose 在服裝之前且僅一次；自拍／鏡子／同伴語意不互换，近景不回灌手勢；原 wardrobe bytes 不變；F 尾段逐字相同。對整個 style/film catalog 逐項切換，主 MJ 與全無版本文字完全一致，而 locks 保存真實選值；50mm、f/2.8、1/1000s、Bloom 仍在。
- 舊 imaging producer 未讀取 aperture / shutter，本次只在 main opt-in 補入各自首個來源片段。MJ 胸上仍使用原 producer 預設值，沒有借機補入這兩項。測試的場景句擷取改為認識新位置，不以修改 production 來源來遷就舊順序斷言。

最終程式 gates：`npm test` **897/897**、`npm run test:prompt-quality` **229/229**、lint、build 通過；build 只有既有大 chunk 建議。前後同樣使用 `200 / prompt-quality-baseline / --strict`：零 blocking、integrity、exact duplicate、control leakage、contradiction、coverage issues；既有 23 diagnostic-only（19 wardrobe/scene、4 near duplicate）不變。

| 輸出 | 平均字數（前 → 後） | p95（前 → 後） | 最大字數（前 → 後） |
| --- | ---: | ---: | ---: |
| Gpt | 578.0 → 578.0 | 724 → 724 | 778 → 778 |
| Z-Image | 316.9 → 316.9 | 405 → 405 | 438 → 438 |
| AI | 161.2 → 160.3 | 207 → 205 | 251 → 251 |
| 胸上特寫照 | 276.8 → 276.8 | 339 → 339 | 393 → 393 |
| MJ 胸上特寫照 | 172.9 → 172.9 | 208 → 208 | 234 → 234 |
| 全身角色照 | 256.1 → 256.1 | 330 → 330 | 397 → 397 |

Browser QA：**PARTIAL**。沿用已在執行的指定 localhost，1440×1000／390×900；五工作區與觀察式抓拍導航、載入、畫面及 DOM 檢查完成，未觀察到 console error/warning、破圖或 document horizontal overflow。手機主輸出沿用原有三欄窄文字區及按鈕省略號，沒有本輪 CSS 改動，也不宣稱已重新設計手機閱讀體驗。截圖留在工具紀錄，不納入 repo 資產。

- 在 PAGE1 選 Guy Bourdin、跨沖霓虹、50mm、f/2.8、1/1000s、Bloom，主 MJ 沒有 style/film 而四項 optics 仍在；GPT／Z／MJ 胸上保持各自原有風格規則。自然自拍＋肩背支撐在主 MJ 完整且僅一次，Z 仍省略 anchor。參數主 MJ 21:9、MJ 胸上 4:5 及其餘尾段保持原值。
- 六張原有 Saved Cards 保留，沒有新增／刪除。舊 QA 卡 `#1KNL0X` 的 MJ 詳細文字仍是旧順序，未自動改寫。按「套用目前預覽」後工作台依其 selections 重新顯示新 runtime 文字；不能將這一步說成「旧 MJ 原文逐字回到預覽」。Saved Cards codec／Markdown 原文保存另有自動測試。
- Copy 有 `AI copied` 提示，但 clipboard read 回傳空字串，原生貼上亦回報虛擬剪貼簿沒有資料；Download Markdown 點擊後 6 秒未得到 download event。沒有 page error；這兩項仍需支援瀏覽器補驗，不判定功能已壞或已通過。
- 已恢復有效單人站姿、手部／支撐全無、原環繞、风格／成像／光學全無及髮型偏好；viewport 已 reset。為還原回填帶入的雙人髮型 defaults 而切換人物數量時，既有 UI 補入 inactive duo expression `same-direction-away`，選全無／隨機仍正規化回該值，B 摘要多顯示「兩人同向離鏡｜沉浸感」。此非作用中 QA 狀態不影響單人輸出，未繞過 UI 寫 storage、未順帶修改既有行為。

外部 Midjourney 尚未生圖；下一步是 copy/download 補驗及實際新版 Prompt 的外部模型驗收，而不是直接宣稱人物／場景融合全部通過。
