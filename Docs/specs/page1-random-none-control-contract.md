# PAGE1 隨機與清空控制契約

Last updated: 2026-08-01

這份規範定義 PAGE1 全域與分區「全部隨機」及「清空可清除項目」的行為。按鈕文字、lock state、相容性清理與最終 Prompt 必須遵守同一套能力分級，避免使用者看到「隨機」但實際仍是「全無」，或看到「全無」但必要欄位偷偷回到隨機。

## 1. 控制能力分級

每個 lock control 在批次操作中屬於以下其中一類：

- random：清空 lock，讓 engine 在生成時依相容性規則隨機解析。
- reset：回到明確的「全無」或 defaultValue；不自動啟用特殊角色、角色卡、固定構圖或色系接管。
- preserve：保留目前值。人物數量是必要欄位；獨立 `posePropId` 也不由姿勢批次隨機覆蓋。

能力判斷集中在 webapp/src/lib/page1SectionRandom.js 的 getPage1ControlActionMode()。不要在 UI component 內自行以欄位名稱推測行為。

## 2. 全域操作

### 全部隨機

全域「全部隨機」只會對 random 控制清除 lock。必要欄位與接管型欄位保留預設或目前狀態：

- subjectCount 保留目前人物數量。
- specialSubjectId、characterProfileId 回到 none，不會隨機套用特殊角色或角色卡。
- fixedCompositionSetId 及其 dependent controls 回到固定場景未啟用的預設。
- imageTypePresetId 保留寫實攝影預設。
- posePropId 保留目前明確道具或 `全無`；使用者需在道具欄位自行選擇其 `隨機`。
- hidden migration、import 與接管狀態回到各自 defaultValue，避免批次隨機留下與新選擇衝突的舊狀態。

### 清空可清除項目

全域按鈕名稱使用「清空可清除項目」，只清除有明確「全無」的欄位。沒有「全無」的必要欄位會保留 defaultValue，不會以空字串讓 UI 或 engine 隱式回到隨機。

## 3. 分區操作

分區按鈕使用目前子面板的 keys，不可影響其他 PAGE1 區段。getPage1SectionActionLabels() 依子面板能力產生按鈕文字：

- 含有可隨機欄位時，顯示「全部隨機」或更精確的「隨機可用配色」。
- 只有 reset 欄位時，顯示子面板指定的「重設為未指定」「重設固定場景」或「重設為預設」。
- 清空按鈕統一顯示「清空可清除項目」，必要欄位仍保留預設值。

目前特別指定：

- 特殊角色、角色卡：重設為未指定。
- 固定構圖場景：重設固定場景。
- 成品類型：重設為預設。
- 造型配色：隨機可用配色；完整造型色系與特殊上下身配色不會被自動啟用。

## 4. Pose Composer

單人 Pose Composer 的 poseBaseId、poseArrangementId、poseHandId、poseHeadId、poseAnchorId 在「全部隨機」時全部回到隨機 lock，而不是各自回到「全無」。engine 的 buildPoseComposerItem() 會依序抽取：

1. 姿勢基底
2. 與基底相容的肢體變化
3. 手部動作
4. 頭部方向
5. 與基底、場景相容的接觸／支撐

`posePropId` 是獨立的第六個控制，不加入上述五層批次取樣，也不增加該流程的 RNG 呼叫。姿勢「全部隨機」會保留其目前值；若明確道具有效，V1 由道具接管手部層，因此 normalize 會把 `poseHandId` 清為 `全無`，其餘基底、肢體、頭部與接觸層照常隨機。道具自己的 `隨機` 只在使用者明確選擇時解析。

### 隨機姿勢相容性

`buildPoseComposerItem()` 在解析單人姿勢時，使用 `webapp/src/lib/engine/poseComposerCompatibility.js` 的共用規範（version 1）過濾隨機候選；這個規範位於 renderer 之前，因此 Gpt、Grok/Z-Image、AI 與其他共用 canonical pose 的輸出不會各自採用不同的姿勢安全邏輯：

1. `胸上特寫`、`中景鏡頭` 等上半身裁切只從站姿／坐姿基底隨機；`牛仔中景` 排除躺姿，避免裁切語意和低位姿勢不一致。
2. 正面方位的隨機肢體不選側身或背向變體；背面／後三分之四方位不選明確正面下半身變體。
3. 隨機頭部方向會避開側／背向肢體搭配「頭部自然朝向鏡頭」，也會避開鳥瞰／正上方俯視搭配需要正面臉孔可見的頭部選項。
4. 上半身裁切不抽取只在大腿、膝蓋、腳踝或地面支撐成立的手部選項；背面視角不抽取臉部接觸型道具。
5. 這些規則只過濾 `隨機` 候選，不改寫明確 lock。使用者明確選擇的衝突組合仍會保留，讓 lock 具備可預期的優先權。

這是姿勢／鏡頭／裁切的相容性，不是場景物件相容性；`poseAnchorId` 仍依姿勢基底與場景水域規則處理，完整的場景幾何判斷維持暫停。

接觸／支撐的隨機是唯一可自然解析為 `全無` 的 Pose Composer 隨機層，避免每張圖都被強制加入支撐物；解析為具體項目時，仍只能從相容且 `randomEligible !== false` 的公開候選抽取。其餘四層中的基底、肢體、手部與頭部隨機仍需解析為具體選項，且都不得解析為 `任意`。

欄位仍可由使用者個別選擇「全無」，但批次隨機不得產生「只有神情隨機、姿勢全部全無」的假隨機狀態。雙人模式仍使用 duoPoseId、duoPoseBaseId、duoExpressionId，不套用單人 Pose Composer。

## 5. UI 與 Prompt 契約

- SelectControlField 的「隨機」選項只出現在該 control 允許隨機時。
- 按鈕狀態改變後，頁面摘要、selection snapshot、Gpt、Grok/Z-Image、AI 與 full-body 輸出必須使用同一份 normalized locks。
- 必要預設不應被摘要顯示成「隨機」；接管型欄位不應因批次隨機偷偷啟用。
- tooltip 必須說明：批次操作只作用於可隨機／可清除欄位，必要欄位會保留預設。

## 6. 測試契約

至少維持以下回歸覆蓋：

- randomizeLockKeys() 只修改指定 keys，並遵守 random／reset／preserve 分級。
- setLockKeysToNone() 與 buildAllNoneLocks() 對沒有「全無」的欄位保留 defaultValue。
- 每個 PAGE1 子面板的 action label 與能力一致。
- `posePropId` 為 preserve；明確道具在姿勢批次隨機後仍保留並接管手部，`全無` 也維持 `全無`。
- 無明確道具時，單人 Pose Composer 的批次隨機會讓五個 Composer lock 都進入隨機狀態；接觸可解析為 `全無`，其餘層產出具體相容組合。
- 隨機 Pose Composer 在上半身裁切、正面／背面方位、鳥瞰角度下遵守共用相容性規範；明確衝突 lock 仍保留。
- 特殊角色、角色卡、固定構圖與成品類型批次操作不會自動接管。
- 全域批次操作不會改變 subjectCount。

主要測試位置：

- webapp/src/lib/page1SectionRandom.test.js
- webapp/src/features/page1/page1Schema.test.js
- webapp/src/features/page1/lockTransitions.test.js
- webapp/src/lib/enginePoseComposer.test.js
- webapp/src/lib/engine/poseComposerCompatibility.test.js
- webapp/src/lib/enginePreviewRerollExclusion.test.js
