# 神情姿態 v2 P5：清理範圍（Cooper 2026-10-20「照建議」）

- 日期：2026-10-20；基準 main @ 1b8f31a（P4 已合併）
- 調查方式：唯讀 agent 讀碼＋實跑。把舊欄位在生成入口強制清成全無後跑全套測試，以失敗數估計影響。**數字是模擬估算**，實作時以實際 diff 為準。
- 路徑前綴：`webapp/src/`
- 進度：P5a 已完成（2026-10-20，紀錄見[實作計畫 §8](expression-pose-v2-implementation-plan.md)）；P5b 待做。

## 1. 目前的狀況

P4 之後，介面已經不會再設定舊自由組合欄位。以新介面的輸入實跑 1512 組：

- 肢體變化、接觸／支撐、主要躺姿：全部是全無。
- 手部、道具：只剩 3 個自拍選項，來自拍攝方式。
- 頭部：只剩視線借用的 9 個頭部選項。
- 姿勢基底：只出現在固定場景人物位置，以及指定動作自動帶入的值。

所以引擎裡大部分舊組合程式已經不會被新介面走到，只服務舊存檔、舊測試與凍結基準。

## 2. 新功能仍借用的舊東西（不能直接刪）

| 新功能 | 借用的舊東西 | 若要刪，先做什麼 |
| --- | --- | --- |
| 視線 | `poseComposerOptions.js` 的 9 個頭部選項英文、`resolveHead` 組句 | 把 9 筆英文搬進 `gazeGesture.js` |
| 拍攝方式 | 自拍手部／鏡子道具選項與 meta：鎖方位、Z-Image 拍攝情境搬移、景別與環繞的隨機限制、`poseComposerProjection.js` 裁切投影 | 保留，或把自拍改成獨立組句（工作量大，不建議） |
| 指定動作 | 姿勢基底／主要躺姿的值（相機文字、仰躺表面路徑要讀） | 只用字串，不需要選項資料；完整刪除時改放在組句結果的 meta |
| 固定場景人物位置 | 「基底＋頭部」那段組句（會輸出 `…and presents a sitting pose.`） | 保留這段 |
| 觀察式抓拍、特殊角色 | 接管欄位清單、無動作分支 | 保留 |

## 3. 三種刪除深度

| 深度 | 刪什麼 | 規模 | 需重產基準 | Prompt 會變嗎 |
| --- | --- | --- | --- | --- |
| **(a) 最小** | 介面與工作台層殘留：`Page1Workspace.jsx` 約 150 行、`page1Schema.js`、`lockTransitions.js`、`page1Selectors.js`、摘要、區段隨機的舊分支；孤兒檔 | 約 250 行、6 檔；改寫約 21 個 UI 測試 | 0 | 不變 |
| **(b) 中** | 再刪引擎中只服務舊組合的程式：舊遷移鏈、完整組合分支、隨機錨點與相容判斷、水域／錨點／躺姿片語、舊投影、拉開外套手、`poseId`／`specialActionId` 路徑、`poseComposerCompatibility.js`（227 行）、`kneelingSupport.js`（48 行） | 引擎約 900–1000 行；整檔刪 11 個測試檔（169 個測試、4785 行），約 35 個測試檔要改寫 | 約 19 個 JSON | 新介面的輸出不變；只有鎖了舊欄位的舊輸入會變 |
| **(c) 完整** | 再刪 `poseComposerOptions.js`（1631 行，把借用的約 60–80 行搬出）、知識庫兩個舊目錄（52 列）、`database.json` 約 264 行、移除 9 個舊欄位定義 | 模擬失敗 375／1719 | 幾乎所有記錄選擇快照雜湊的基準（確切數 not_stated） | 新介面文字不變；選擇快照與 structured 欄位的形狀會變 |

### (b) 需要重產的基準（啟用舊欄位的 fixture 數／總數）

| 基準 | 啟用／總數 |
| --- | --- |
| sceneIntegratedAssembly（含 sceneDirectionalZImageExpected、sceneIntegratedMidjourneyExpected） | 42／45 |
| zImageOnLocation | 53／57 |
| midjourneyNaturalHistoricalProtected | 63 組 |
| midjourneyNaturalMirrorProtected | 8 |
| midjourneyNaturalProtected＋BodyPreservation | 40／986 |
| nanoBananaProtected | 5／382 |
| nanoBananaFacialFeatures | 35／1078 |
| ambientLight | 727／730 |
| closeWormEye | 44／50 |
| gptCameraSpatial | 6132／6180 |
| gptSceneVisibility | 5611／5614 |
| zImageFullBodyCamera | 386／431 |
| zImageSceneDetailPriority | 2846／2930 |
| zImageUpperScene | 218／230 |
| zImageUpperSceneExtension | 876／930 |
| midjourneyNaturalCatalogProtected | not_stated |

上面這些基準的 fixture 輸入來自兩個模組：representativePromptFixtures（40／104 個啟用舊欄位）、compositionVisibilityFixtures（6／16）。

不受影響的基準：bandagePasties、minimalCoverage（含 MinimalProtected）、gptSceneVisibilityLegacyScenes、specifiedActionsV1Sources。

### 整檔可刪的測試（(b)）

| 測試檔 | 測試數 |
| --- | --- |
| enginePoseComposer | 75 |
| enginePosePropAndAnchorRedesign | 17 |
| poseComposerCompatibility | 15 |
| poseComposerProjection | 14 |
| engineSpecialActionCleanup | 12 |
| kneelingCatalog | 11 |
| compositionVisibilityPose | 7 |
| squattingCatalog | 5 |
| squattingHands | 5 |
| standingCatalog | 5 |
| engineHeartGestures | 3 |

另外 squattingCatalogTestSupport、openPalmTestSupport 這兩個測試輔助檔也一起刪。

### 混合、需要改寫的測試（失敗數／總數）

| 測試檔 | 失敗／總數 |
| --- | --- |
| zImageOnLocationCapture | 55／63 |
| sceneIntegratedAssemblyBaseline | 51／59 |
| promptOutputContracts | 22／107 |
| enginePromptPipeline | 9／52 |
| engineMirrorSelfieProp | 7／19 |
| engineSpecialSubjects | 5／33 |
| engineZImageTurboPrompt | 5／14 |
| chestUpSameState | 4／8 |
| fixedCompositionPromptIntegration | 4／4 |
| specifiedActionIntegration | 4／8 |
| midjourneyNativeStructure | 3／3 |

其餘約 25 檔各有 1–3 個失敗。

## 4. 孤兒檔（沒有任何地方讀取，實作前再確認一次）

- `components/ActionPoseWorkspace.jsx`（163 行，沒有被 import）
- `bodyTypeIsolationBaseline.json`、`sceneIntegratedZImageExpected.json`：沒有測試讀取
- `chestUpSameStateBaseline.json`：只有 `scripts/capture_chest_up_same_state_baseline.mjs` 寫入，沒有測試讀取

## 5. 需要 Cooper 決定的問題（附建議）

| # | 問題 | 建議 | 理由 |
| --- | --- | --- | --- |
| 1 | 刪多深 | **分兩個 PR：P5a＝(a)＋孤兒檔；P5b＝(b)。(c) 不做** | (a) 零風險、Prompt 不變；(b) 會重產 19 個基準，分開審比較容易；(c) 會動選擇快照形狀與所有雜湊基準，收益小 |
| 2 | 舊 Saved Card 的文字匯入，是否繼續辨識舊組合／舊姿勢英文 | 只保留「舊自拍→拍攝方式」，其餘不辨識 | 其餘解析出來後本來就會被清掉 |
| 3 | 舊卡與 localStorage 的自拍轉換是否保留 | 保留 | 成本小（3 個遷移函式），避免舊卡的自拍消失 |
| 4 | 「姿勢與肢體語言」（28 列）、「特殊動作」（24 列）兩個舊目錄是否刪除 | P5 先保留資料、只刪引擎讀取路徑；真要刪留到 (c) | 刪資料會讓選擇快照裡全無的 id 改變，38 個測試失敗 |
| 5 | 選擇快照是否保留 9 個舊欄位（固定填全無） | 保留 | 不然所有選擇快照雜湊基準都要重產 |
| 6 | 鎖了舊組合的 fixtures 怎麼處理 | 測試主題仍有效的（場景組裝、相機、裁切）改寫成指定動作／視線／拍攝方式的等價輸入；只測舊組合的刪除；然後只重產有變的基準，並先對不變的樣本做零差異驗證 | 保住測試覆蓋，重產範圍可控 |
| 7 | 孤兒檔是否順便刪 | 刪（P5a） | 沒人讀取，實作前再 grep 一次確認 |
