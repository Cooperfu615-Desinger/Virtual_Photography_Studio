# PAGE1 隨機與清空控制契約

Last updated: 2026-07-12

這份規範定義 PAGE1 全域與分區「全部隨機」及「清空可清除項目」的行為。按鈕文字、lock state、相容性清理與最終 Prompt 必須遵守同一套能力分級，避免使用者看到「隨機」但實際仍是「全無」，或看到「全無」但必要欄位偷偷回到隨機。

## 1. 控制能力分級

每個 lock control 在批次操作中屬於以下其中一類：

- random：清空 lock，讓 engine 在生成時依相容性規則隨機解析。
- reset：回到明確的「全無」或 defaultValue；不自動啟用特殊角色、角色卡、固定構圖或色系接管。
- preserve：保留目前值。人物數量是必要欄位，不由批次隨機或清空操作改變。

能力判斷集中在 webapp/src/lib/page1SectionRandom.js 的 getPage1ControlActionMode()。不要在 UI component 內自行以欄位名稱推測行為。

## 2. 全域操作

### 全部隨機

全域「全部隨機」只會對 random 控制清除 lock。必要欄位與接管型欄位保留預設或目前狀態：

- subjectCount 保留目前人物數量。
- specialSubjectId、characterProfileId 回到 none，不會隨機套用特殊角色或角色卡。
- fixedCompositionSetId 及其 dependent controls 回到固定場景未啟用的預設。
- imageTypePresetId 保留寫實攝影預設。
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
3. 手部／道具動作
4. 頭部方向
5. 與基底、場景相容的接觸／支撐

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
- 單人 Pose Composer 的批次隨機會讓五個 Composer lock 都進入隨機狀態，且 engine 產出完整相容組合。
- 特殊角色、角色卡、固定構圖與成品類型批次操作不會自動接管。
- 全域批次操作不會改變 subjectCount。

主要測試位置：

- webapp/src/lib/page1SectionRandom.test.js
- webapp/src/features/page1/page1Schema.test.js
- webapp/src/features/page1/lockTransitions.test.js
- webapp/src/lib/enginePoseComposer.test.js
- webapp/src/lib/enginePreviewRerollExclusion.test.js
