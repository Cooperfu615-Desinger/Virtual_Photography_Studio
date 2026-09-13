# PAGE1 單人 Z-Image／Midjourney 現場整合組裝規則 v1

Last updated: 2026-09-13

後續更新：Z contract `1.7.0` 已在本機接入 [場景／環境光鏡頭方向 v1](z-image-scene-direction-v1.md)。僅 eligible 主 Z 將過濾後場景完整合併至開頭，低機位省略已核對地面細節，俯視省略天空畫面片語；保留光感，不改其他 renderer。下文第 4 節的後置 scene 細節是前一階段紀錄。MJ 階段已於 `7a7569a` 提交；本次方向規則尚未提交。

狀態：**Z-Image 第一階段已於 `b5ebebd` 提交／推送；Midjourney 第一階段已接入本機 renderer，尚未提交。** 舊版可執行基準 `1be19e8` 保留不變。本次僅改一般單人主 MJ 與對應測試／規範；資料庫、UI、選項／儲存 schema、GPT、已完成的 Z-Image 與三組衍生輸出不變。程式驗證、Browser QA 和外部影像驗收分開，紀錄見回歸文件第 9 節。

## 1. 目的與證據邊界

改善一般單人 Prompt 中人物像被放在獨立背景前的觀感：讓拍攝方式、姿勢、地點與既有光線資訊共同描述一次拍攝，而不是另外建立支撐物推導系統。

- 使用者已接受歌舞伎町場景的蹲姿低位自拍，以及跪姿俯視自拍之人工 Prompt 方向。案例與限制見 [回歸案例](page1-single-scene-integrated-regression-v1.md)。
- 這是人工改寫後的實際生成回饋，不是目前 renderer 已改善的證據，也不是同 seed、同模型參數的因果實驗。
- 無法據此保證所有模型、全部姿勢／景別／場景組合都會有正確透視或肢體。MJ 新版規則尚無直接的影像實測驗收。
- 人工範本只用來辨識有效的表達方式；不能把新增道具、自由手動作、改弱的濾鏡或較長的文字整段寫入 production。

## 2. 適用範圍與不變項

第一版目標為 PAGE1 一般單人主輸出，沿用同一組 resolved selections，不重新抽選。

| 輸出／表面 | 第一版規則 |
| --- | --- |
| `Z-Image` → `zImagePrompt` | 調整組裝順序與來源連接；省略獨立接觸／支撐欄位；保留有效攝影風格與成像來源 |
| `AI Prompt` → `midjourneyPrompt` | 使用相同來源與拍攝關係，再獨立精簡；省略攝影風格、相機／底片成像模擬；接觸／支撐維持既有規則 |
| `Gpt` → `grokPrompt` | 完全不變，包括完整保留、段落、Composition、比例描述 |
| 胸上特寫照、MJ 胸上特寫照、全身角色照 | 完全不變；不可經共用 helper 意外套用主輸出新規則 |
| 雙人、固定構圖、特殊角色專用路徑 | 不套用新規則；以既有 fixtures 保護 |
| 角色卡專用 renderer | 第一版保守隔離，維持既有身份／服裝契約；若要納入，須另列案例與範圍確認 |
| 觀察式抓拍、動作姿勢、場景建模等獨立工作區 | 不改其生成器、資料池、輸出或儲存 |
| 資料庫、選項英文來源、鎖定 ID、摘要、UI、Storage、Saved Cards、匯入匯出 schema | 不改；文字輸出省略不代表清空使用者選項 |

使用者已於 2026-09-13 確認：第一版保留角色卡專用 renderer 與下述仰躺 surface-led 模式的既有路徑，不套用本輪新組裝政策。這是已確認的範圍邊界，不代表程式已實作或已授權提交／部署。

不增加模型呼叫、第二套隨機池、攝影器材選項、Moodboard／Personalization UI，也不重啟局部超特寫或 Pose Composer 場景過濾。

## 3. 現行程式確認與契約差異

歷史核對基準：`main`，`1db417a42dc081280372d3473f952d78e07066f2`。以下描述修改前的資料流；Z 的窄例外在第 4、5 節及 `Z_IMAGE_TURBO_PROMPT_CONTRACT_VERSION = 1.6.0`，MJ 的窄例外在第 6 節及 `MIDJOURNEY_DESCRIPTION_CONTRACT_VERSION = 1.8.0`。Git 交付狀態見文件頂端，不等同部署驗收。

- [engine.js](../../webapp/src/lib/engine.js) 的 `buildPrompts()` 先建立共用構圖投影、`projectedCanonicalPoseText`、`projectedScene` 與結構化模型，再呼叫各 renderer。
- `renderZImagePrompt()` 目前透過 [Z-Image contract](../../webapp/src/lib/engine/zImageTurboPromptContract.js) 固定輸出成品類型、構圖、人物、服裝、姿勢、場景、光線、風格、鏡頭、成像。`buildSinglePoseText()` 直接取共用 canonical pose，必要時追加既有側身手部深度句。
- `renderAiPrompt()` 的資料 producer 可被覆寫；`renderMidjourneyFixedFramingPrompt()` 也呼叫它，並從主模型取得 scene／imaging。因此不能直接在共用 imaging producer 無條件刪除 style／film。
- [Pose Composer options](../../webapp/src/lib/engine/poseComposerOptions.js) 的自然自拍目前明確指定右臂、前鏡頭與畫面外手機；鏡子自拍明確指定鏡面及可見手機；男友／閨蜜自拍是近距離同伴視角。三者皆 manual-only 並有 `locks_orbit`。本輪不改這些資料或相容性。
- `projectPoseComposerAnchor()` 對 `supineSurfaceLed` 有 `fullSource` 例外。仰躺時一般場景已被設為全無，床／海面等位置由 anchor 提供。
- [觀察式抓拍](../../webapp/src/lib/observationCaptureLab.js) 使用獨立場景、相機位置、前景、動作、光線與質感資料池。可借鑑其把拍攝條件說清楚的方式，不能把其隨機前景、道具或固定抓拍語氣搬入 PAGE1。

既有規範與分階段例外：前兩列已隨 Z 實作同步更新 root AGENTS、主撰寫規範、Z 機器契約與斷言；第三列本次隨 MJ 契約 1.8.0 接入。MJ 本身仍逐字保留 canonical pose，不擴大 Z 的姿勢例外。

| 歷史契約 | 已接入的窄例外 |
| --- | --- |
| 根目錄 AGENTS、主撰寫規範與 Z-Image contract 要求三版逐字共用 canonical pose | 只允許目標 Z-Image 從同一投影後姿勢來源產生無 anchor 的輸出版本；GPT／MJ 與共用 canonical 保持原樣 |
| Z-Image 固定十區塊順序 | 目標單人路徑使用第 4 節順序；其他模式維持原順序 |
| MJ 規範保留攝影師與 film 身份 | 只在主輸出的目標模式省略；其他模式與 MJ 胸上特寫維持既有規則 |

實作批次必須同步更新相關規範、機器契約與斷言，不能只放寬「三版相同」測試，或讓本文件默默覆蓋現行 root AGENTS。

## 4. Z-Image 第一版組裝順序

保持英文自然段落、空行分隔、無公開 section labels。以下為邏輯責任，不是新增 UI 區塊。

1. **成品類型**：保留現有 image-type opening，不把所有類型改成 selfie／candid／on-location photograph。
2. **拍攝情境與構圖**：先用已投影的地點身份建立簡短位置脈絡，再交代景別、角度、有效 orbit 與自拍類型；同一地點不在後文重複完整命名。
3. **人物**：沿用既有身份、可見身形、臉、髮型／髮色、膚質、表情與配件來源。不得用人工範本的泛化身形取代有效 body anchors。
4. **姿勢**：保留投影後有效的基底／朝向、肢體變化、手部／道具、頭部方向。省略獨立 anchor，詳見第 5 節。
5. **服裝**：保留現有投影後衣物、顏色、材質、版型、穿法、腰線、配件和可見鞋襪。只去重並使用必要連接詞。
6. **場景細節與光線**：補充第 2 步未使用的可見場景來源；環境光與人物受光相鄰組裝，但不混淆來源責任。
7. **攝影／成像**：保留已選風格、鏡頭、光圈、快門、光學效果與 film 的既有有效語意，精簡重複而非改選或減弱效果。

不得透過「把場景移到開頭」把所有場景長文複製兩次。需要場景先行的是地點脈絡，不是另一段完整背景清單。全無區塊直接省略，不產生 `none`、`全無`、占位句或泛用背景。

可採用語法示意：`At [existing location identity], [existing capture type and composition].` 其中括號不是公開文字；不存在的 capture type 不可補成自拍。正式英文必須符合當前來源的語法，不是直接串接任意 option.en。

### 4.1 拍攝方式與裁切

- 自然自拍可將已有「前鏡頭 self-shot」表達成由該手機拍下的畫面；鏡子自拍則維持鏡面反射及可見手機，不能套用畫面外手機模板。
- 相機高低、俯仰只能來自已選 angle 及既有解析規則。自拍不是自動低角度；高位俯視也不能為了招牌改成仰拍。
- 不新增第二台相機、自拍棒、拉長手臂、另一個攝影者；同伴自拍已有的拍攝者視角不等於新增一名可見人物。
- 既有自然自拍來源指定右臂，本輪保留。不能把手寫範本中的 `free hand rests on her thigh` 自動加入每組自拍。
- 身體／服裝仍依既有 crop projection，不能為人景融合刪掉有效衣物，也不能為顯示鞋襪、招牌或全身改寬景別。
- 可用自然語言說明已有畫面邊界，保留局部進出畫面的可能性；不固定額外的手掌位置、手臂長度或地標完整可見程度。
- 八方向、半臉、遮鏡手掌等既有專用構圖規則不能被通用自拍句覆寫。矛盾明確鎖定仍可存在；只記錄診斷，不新增 UI 阻擋或偷偷改選。

### 4.2 光線與場景連接

- 既有光線若明確描述在皮膚、髮絲、服裝上的色光，可與原場景敘述相鄰呈現；共享來源足以支持時才作最小語法連接。
- 不因場景有霓虹就新增特定紅／青光，不因皮革有光澤就新增招牌反射，也不自動補濕地、雨、路人、柱子或物件距離。
- 光圈造成的淺景深與輪廓光造成的分離並非錯誤；不能為「融合」將 f/2.8 改為深景深、刪掉柔焦或把強烈壓黑改成柔和階調。
- 成像是整張影像的設定，不另加一套只針對人物的修圖風格。人工範本的「全畫面相同質感」可作驗收觀察，不能當成新增一段無來源的萬用保證語。
- 地標以既有英文身份描述為主；不自動從 UI 中文生成招牌文字。精確文字仍僅走原有 opt-in literal 契約。

## 5. Z-Image 接觸／支撐邊界

使用者確認的是：**不輸出獨立的接觸／支撐選項，不是移除所有提及接觸的姿勢動作。**

- 省略 `poseAnchorId` 所擁有的姿勢片段，不清空該 lock、selection、摘要或 Saved Cards 記錄。
- 不把已省略的「肩背靠牆、髖靠邊緣」換句話塞入拍攝情境／場景段，也不推導它需要什麼柱子或欄杆。
- 蹲姿的腳掌接地、跪姿的膝蓋落地，以及手部選項的手肘倚膝、手托腮，仍屬於原姿勢／手部來源，依現有可見性保留。
- 原場景若本來有柱子、牆面、床或欄杆，可保留其場景身份。不能以「移除支撐」為理由對公開文字做關鍵字全域刪除。
- 從投影後的結構化來源組裝，不對完成的 canonical 字串用 `leaning`、`against`、`support` regex 猜測分段；共用 canonical 不可被就地改動。
- 空 anchor 時仍保留相同姿勢語意；頭部、道具優先權、`任意` 的現有回落及後方／近景可見性不得改變。

### 5.1 已確認保留既有路徑：仰躺表面

`supineSurfaceLed` 的床、水中、海面等與一般「靠在哪裡」不同，它們擁有整個仰躺場景。直接省略會重現使用者曾要求修復的表面遺失。

**已確認：第一版讓此模式留在既有路徑，完整保留表面身份與環境句，不新增移轉到場景欄位的資料遷移。** 一般站、坐、蹲、跪及非 surface-led 躺姿可依第一版範圍處理，不必先寫複雜支撐推導。仰躺 surface-led 模式不啟用本輪新組裝政策，未來若要納入須另行確認。

## 6. Midjourney 共用與差異

- 共用的是已解析 selections、可見性投影及拍攝情境的來源，不是先生成 Z-Image 成品再刪字。
- 保留成品類型、構圖、有效身份／身形、臉部與表情錨點、服裝、姿勢、場景及光線；維持現行 native 單行與 F 參數尾段。
- 主輸出省略 `styleId` 的攝影風格與 `filmId` 的相機／底片成像模擬 prose，包含其來源同義片段；不得把省略的風格搬入開頭。
- `lensId`、`apertureId`、`shutterId`、`opticalEffectId` 保留來源式精簡。實作核對發現舊主 MJ 的 imaging producer 未輸出光圈／快門；為符合本版保留規格，本次只在 eligible main 補上各自首個有效來源片段。鏡頭及適配、光學效果保持原有縮寫規則；MJ 胸上及其他排除路徑不補入或移除任何文字。Bloom、散景等不因 UI 也稱「風格」就誤刪。
- 本輪不改 `--ar`、Raw、Stylize、Chaos 等既有尾段，不自動產生 `--p` 或替使用者選 Moodboard。
- 使用者選擇在 MJ 端管理美學；省略 style／film 是產品決策，不宣稱 MJ 官方要求刪除文字或能精確替代每個底片模擬。
- 接觸／支撐維持原本投影後 canonical pose；不能連帶套用 Z-Image 的省略政策。姿勢本體也不額外簡寫成另一種動作。

### 6.1 已實作的主 MJ 順序與隔離

單行順序：成品類型 → `The setting is [既有投影後地點身份].`＋原構圖／modifier → 人物 → **完整 projected canonical pose** → 原精簡服裝 → 剩餘場景片段與既有光線 → 光學 → F 參數尾段。地點首片段只移動一次，其餘場景 clauses 仍由既有 MJ producer 選出；全無場景不新增占位句。

自拍留在 canonical pose 裡，隨整段姿勢移至服裝前，**不仿照 Z 把自拍拆到人物前**，不改接觸／支撐及內在承重關係。構圖本身的遮鏡手掌等 modifier 仍保留原優先位置。

`renderAiPrompt` 使用 `integrateMainScene` 明確 opt-in，section model 與 imaging producer 使用局部 `sceneIntegrated` 旗標；不改共享 context 或 producer 預設值。除了角色卡專用路徑，`characterProfilePrompt` 身份匯入也保持隔離。MJ 胸上雖共用函式，沒有 main opt-in，仍保留原攝影風格／成像與區塊順序。

## 7. 回歸策略與實作順序

詳見 [回歸案例與驗收計畫](page1-single-scene-integrated-regression-v1.md)。建議順序：

1. 已建立 deterministic fixtures 與舊版穩定輸出基準：19 組案例類別展開為 45 組輸入、52 個測試；六輸出、完整 resolved selections 與隨機抽取次數均固定。這一步不更新 production 契約；驗證紀錄見回歸文件第 7 節。
2. 實作 Z-Image 目標路徑的來源重排與 anchor 省略；先比對同 seeds 的輸出與 selections。外部實測以新版實際 renderer 成品驗證，不能只測手寫範本。
3. 獨立實作主 MJ 的 style／film 省略與來源式精簡；驗證 MJ 胸上、GPT 與其他排除路徑完全不變。
4. 執行相關 tests、Prompt Quality、完整 test／lint／build、同 seed strict audit、desktop／mobile 五工作區與下游 smoke；另核對觀察式抓拍入口未受影響。
5. 回報程式驗證與外部影像實測各自結果。提交／推送仍需使用者另行授權。

文件備份 `f187bbf`、舊版測試基準 `1be19e8` 及 Z runtime `b5ebebd` 均已推送至 `origin/main`。第 2、3 步均已接入本機；MJ-only expected snapshot 與 Z expected、歷史 baseline 分開維護。第 4 步程式 gates 通過，瀏覽器 copy/download 尚受工具限制；第 5 步實際 renderer 的人景融合仍須外部實測。不得把文字快照／程式測試當作生圖品質驗收。
