# 指定動作中景與胸上基本姿態第二批

2026-11-12 使用者核准接續實作。基準為 main `28200431b85cc49c18900489938f8ae0e8c4e0be`。本批在六個既有上身片段之前補上基本坐／蹲身分，原片段逐字保留。來源為 `webapp/src/lib/engine/specifiedActions.js`，七組輸出使用同一次 resolved 選擇。

| 動作 ID | 動作 | 補齊後的中景／胸上片段 |
|---|---|---|
| `specified-sitting-forward-lean` | 微微前傾 | `She is seated. Her upper body leans slightly forward.` |
| `specified-sitting-slouched` | 隨性癱坐 | `She is seated. Her upper body slouches loosely and heavily with dropped shoulders and a relaxed torso.` |
| `specified-sitting-open-confident` | 開闊自信坐姿 | `She is seated. Her upper body is open and relaxed, her torso upright and her shoulders at ease.` |
| `specified-squatting-natural` | 自然蹲姿 | `She is squatting. Her upper body leans gently forward with relaxed shoulders.` |
| `specified-squatting-compact` | 收攏低蹲姿 | `She is squatting. Her upper body is softly gathered with a gentle forward lean and relaxed shoulders.` |
| `specified-squatting-forward-lean` | 身體前傾蹲姿 | `She is squatting. Her upper body leans gently forward from the hips with relaxed shoulders and neck.` |

## 適用與保護

四個主輸出的中景與明確胸上，以及 GPT 胸上衍生輸出套用上述完整片段。頭部主導近景仍使用原先的上身片段，透過來源欄位 `upperBodyEnByFraming` 表達。全身、牛仔與無景別沿用完整 canonical 動作。Grok Imagine 保留完整姿勢，全身角色照沿用自然站姿與 9:16，胸上衍生維持 4:5。

既有手勢、道具、頭部與視線先依其有效條件解析，再使用相同的上身投影。蹲姿手勢的中景片段與胸上省略沿用現行規則。雙人、固定人物位置、觀察式抓拍、角色與其他接管沿用既有優先權。

原動作 clauses、完整英文、ID、名稱、說明、順序、驗收狀態及隨機資格沿用現行來源。第一批七個動作、五個躺姿及其他動作列入不變案例。舊收藏保留保存的公開原文，明確還原選值並重新生成才採用新的片段。

## 比較與驗證

實作前固定 269 組案例、1,871 份七輸出證據，涵蓋六個目標、所有景別、一般場景及巴黎 PAGE3 匯入、手勢／頭部／視線、雙人／固定位置／觀察模式，以及非目標動作。原始記錄為[修改前證據](../reports/pose-upper-body-state-batch2-2026-11-12/before.json.gz)。使用相同 seed，僅排除執行期 ID 與日期，比較選值、structured 來源、摘要、RNG 及各輸出。

新增本批固定案例與精確歷史 inverse。舊 baseline、第一批修改前證據與 seals 保留。本批核准的既有歷史矩陣差異另記錄 revision，逐列對照原始值與核准動作。驗證 JSON／Markdown／ZIP 保存還原與重新生成，以及桌面 1440×1000／手機 390×900 的六工作區、七輸出與合成收藏。

完成 gates 為聚焦測試、前端完整測試、Prompt Quality、lint／build、200 筆相同 `prompt-quality-baseline` seed 的 strict audit，以及桌手機操作與畫面檢查。各步通過後依使用者授權 commit／push 至 main，沿用本次交付的 `[skip ci]` 方式。外部圖像模型效果另行實測。
