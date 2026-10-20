
## 5. 補充實跑（scratchpad/p5b/worm_check.mjs、cam_check.mjs）

- 近距離蟲眼（CLOSE_WORM_CASES 中 expectedKind=medium/cowboy 的 6 列）：原輸入 6/6 含近距離措辭；清空舊欄位 0/6；改 specifiedActionId=any 0/6；改 `specified-bratty-frustration-mock-kick`（唯一 baseId=standing 的動作，屬舊動作卡、會接管表情）6/6。原因：`closeWormEye.js:10` 只對 poseBaseId==='standing' 輸出近距離措辭。
- FULL_CAMERA_MATRIX 的 GPT Composition 段（各 11 角度）：standing→清空 10 同 1 異；standing→mock-kick 11 同；sitting→`specified-sitting-side-fold-back-support` 11 同；kneeling→`specified-kneeling-wide-hands-front` 11 同；squatting→清空 11 同；lying-side→`specified-lying-left-side-forearm` 0 同 11 異（躺姿動作啟用躺姿相機）。
- 6 個 station/carriage-position 的 A 列：只刪舊欄位、不加 captureStyle 時 6 輸出與 selection 都相同；若映射成 captureStyleId=mirror，selection 會多出 captureStyleId（輸出仍相同）。

## 6. AGENTS.md 受影響條文

| 位置 | 條文關鍵詞 | 相關 fixture | 刪除後狀況 |
|---|---|---|---|
| AGENTS.md:42 | "When Pose Composer is active, preserve the shared canonical pose" | pose-composer-canonical（C）、aiPromptLength canonical-pose-pressure（B）、nano/facial canonical-pose 類（B/C） | 舊組合的 canonical 句型不再存在；指定動作仍走 buildPoseComposerItem（tag pose_composer），條文需改寫成「指定動作的 canonical 文字」 |
| AGENTS.md:42 | "retain explicitly source-marked manual sitting objects" | zImageOnLocation bedroom-*／park-*／no-scene／no-lights／subject-light-only（B）、park-bed-not-replaced（C）、pose-composer-canonical（絲絨扶手椅）、chestUpSameState.test.js 內嵌「nine manual sitting objects」 | 手動坐具（poseAnchorId 坐在…）沒有新功能對應，此子句失去對象 |
| AGENTS.md:42 | "relocate visible selfie-action text into capture context" | R01/R02/R06/R07/R08、restored-companion-selfie | 仍有效（拍攝方式＝自拍手／鏡子）；但自拍與指定動作互斥 |
| AGENTS.md:42 | "supine surface-led paths retain the exact canonical-pose contract" | R17 六列及其在各矩陣的排除副本（C）、supine-medium-water-overhead-arms（C）、nano supine:*（B/C）、engineMirror lying-*（C） | P5b 刪水域／錨點／躺姿片語後此路徑不存在；新仰躺動作 `supineGroundOnly` 只限地面 |
| AGENTS.md:44 | "existing visible selfie capture source ... canonical source text, support objects or excluded paths" | zImageOnLocation 全部 | "support objects"（坐具、牆面支撐）失去對象；excluded paths 中的 surface-led 消失 |
| AGENTS.md:45 | "retain posture identity and selected manual seats" | chestUpSameState.test.js 內嵌坐具測試、fixedFramingDerived chest-up-normal-separates-pose-scene-imaging | "selected manual seats" 失去對象 |
| AGENTS.md:38 | "mediumWaist and cowboyKnee worm-eye use near-contact camera wording" | CLOSE_WORM_CASES 站姿 6 列（B） | 新介面只剩 mock-kick 動作能觸發；清空或 any 都不會（見 §5） |
| AGENTS.md:37 | "Preserve ratio, orbit, hand composition modifiers, pose" | gptCameraSpatial 矩陣 | "hand composition modifiers" 若指舊手部，僅剩自拍；not_stated（條文未定義） |
| AGENTS.md:35 | "Preserve adult identity, canonical pose" | gpt-standalone-body-omission（斷言含 'standing'） | 清空站姿後該斷言要改 |
| AGENTS.md:18 | "Do not reintroduce ... Pose Composer scene filtering" | — | 禁止條款，仍有效 |

## 7. 其他測試檔內嵌舊欄位（檔案層級，逐案分類 not_stated）

舊欄位關鍵字出現次數（grep `pose(Base|Orientation|Arrangement|Hand|Prop|Head|Anchor)Id|specialActionId|poseId`）：enginePoseComposer.test 423、enginePosePropAndAnchorRedesign.test 112、engineMirrorSelfieProp.test 69、enginePromptPipeline.test 58、engineSpecialActionCleanup.test 53、engineExpressionPoseCleanup.test 49、engineSpecialSubjects.test 44、specifiedActionTransitions.test 29、kneelingCatalog.test 23、engineZImageTurboPrompt.test 19、cardCodec.test 19、engineWardrobeControls.test 14、page1SectionRandom.test 13、specifiedActions.test 13、specifiedActionIntegration.test 13、lockTransitions.test 12、squattingCatalog.test 11、specifiedActionUnified.test 11、carriageFixedComposition.test 11、enginePromptCompatibility.test 10、sceneIntegratedAssemblyTestSupport 10、engineHeartGestures.test 9、headDominantFraming.test 9、chestUpSameState.test 9、stationFixedComposition.test 8、standingCatalog.test 8、characterCardLab.test 8、gazeGesture.test 7、squattingHands.test 6、sceneIntegratedAssemblyBaseline.test 6，其餘 40 檔各 1–5 次。整檔刪除／改寫的範圍以 Docs/specs/expression-pose-v2-p5-cleanup-scope.md §3 為準；本清單未逐案拆解。

## 8. 已知限制

- D 列「輸出不變」的前提是 P5b 不改變亂數消耗順序；若刪碼改變 random() 次數，D 列也會變。實作後需對 D 樣本做零差異驗證。
- B/C 為依 fixture 名稱、title、coverage 與所屬測試推斷；建議的指定動作（尤其坐姿預設選 `specified-sitting-side-fold-back-support`）是可替換的選擇，非唯一答案。
- 矩陣中的 C 列全是 R17（仰躺 surface-led 排除）在各矩陣的副本；刪 R17 會連帶讓各整批基準的 count 減少。
