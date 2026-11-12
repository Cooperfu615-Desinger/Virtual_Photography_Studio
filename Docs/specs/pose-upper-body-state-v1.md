# 指定動作：中景與胸上基本姿態 v1

日期：2026-11-12。使用者已核准分兩批實作，本次只執行第一批，使用者已授權接續提交與推送至 main。

## 目的與正式來源

PAGE3 場景建模匯入不會停用指定動作。部分坐姿與寬膝低蹲姿原本沒有上身片段，中景／胸上投影會連基本坐／蹲狀態一起省略。本次由 `webapp/src/lib/engine/specifiedActions.js` 補上有來源依據的最小片段，四主輸出與 GPT 胸上衍生共用同一次解析；不由各 renderer 分別推測。

Public output contract：`1.66.0`。這不是 catalog JSON 變更，不修改 registry、生成資料庫或舊名稱／ID。

## 第一批核准文字

| 動作 ID | 名稱 | 中景／胸上片段 |
| --- | --- | --- |
| `specified-sitting-legs-extended` | 雙腿自然伸展 | `She is seated.` |
| `specified-sitting-cross-legged` | 盤腿坐姿 | `She is seated.` |
| `specified-sitting-knees-raised` | 雙腿屈起 | `She is seated.` |
| `specified-sitting-leg-cross` | 翹二郎腿 | `She is seated.` |
| `specified-sitting-one-knee-up` | 單腿屈起坐姿 | `She is seated.` |
| `specified-sitting-legs-to-side` | 雙腿側放坐姿 | `She is seated.` |
| `specified-squatting-wide-knee` | 寬膝低蹲姿 | `She is squatting. Her torso inclines gently forward.` |

六筆 seated 身分來自原動作的 sits／坐姿；蹲姿與軀幹前傾來自原完整子句。省略畫外腿腳，不新增椅子、地面接觸、承重、手勢或相機幾何。

## 投影與排除

- 僅第一批七筆動作實際生效時，主輸出的 `mediumWaist`／明確胸上，以及 `chest-up-portrait` 使用上述片段；胸上衍生仍固定 `4:5`。
- 頭部主導近景雖共用 `chestUp` bucket，七筆以 source metadata `upperBodyOmittedFramings: ['頭部主導近景']` 保留原省略；同一共用投影器處理，既有可見頭部／手勢／道具不受此標記停用。臉部與其他近景沿原規則。
- 全無景別、全身、牛仔與固定構圖的完整 canonical 動作不改。Grok Imagine 保留完整有效動作；全身角色照仍為自然站姿、`9:16`。
- 固定人物位置、觀察式抓拍、雙人及其他接管沿現行優先權；不復活未生效的指定動作。一般場景與 PAGE3 匯入使用同一投影。
- 手勢的中景片段與胸上省略、頭部／視線、手機暫停、手動支撐責任保持既有規則。
- 原始 clauses／完整英文、descriptionZh、ID、順序、驗收狀態與隨機池不改；不新增隨機抽樣或修改 selections、structured resolved sources、storage schema。
- 舊收藏原文不改寫；明確還原選值並重新生成後才得到新投影。

## 歷史與第二批

本次只取代 [坐跪姿 v1](pose-library-sitting-kneeling-v1.md) 中上述六坐姿的省略，以及 [蹲姿 v1](pose-library-squatting-v1.md) 的寬膝 O6(b) 省略。原決策、歷史數量與驗收證據保留。跪姿、五個躺姿及所有非目標動作維持原來源。

第二批規劃為三個已有上身片段的坐姿及三個蹲姿補基本身分；本次未實作。躺姿已有方向與上身來源，列入回歸保護。

## 驗證

先建立 focused fixture 並確認修改前失敗，再比較 main `682c919562c280d9192de94f569023b4e29a0e55` 的 281 組／1,953 份輸出。每案同 seed，比較選值、完整 structured 來源、摘要及 RNG；非目標輸出逐字雜湊保持。第一批新片段須保留一次，且不包含畫外腿腳或未選家具。

執行 focused tests、Prompt Quality、前端完整 tests／lint／build、同 count 200／seed `prompt-quality-baseline` strict audit，並依 [畫面驗證](frontend-visual-validation.md) 在桌面 1440×1000／手機 390×900 檢查七輸出、PAGE3 匯入、合成收藏還原及六工作區。模型實際生圖品質與本機文字／介面驗證分開，不付費生成。

歷史 seals 不重錄；`scripts/lib/poseUpperBodyStateHistory.json` 記錄本批三份 runtime／contract 與品質／相容測試入口的精確差異，由 test-only inverse 在隔離歷史副本中先還原既有來源。未知 bytes 保持 fail-closed，不放寬舊基準。三組仍驗證當前引擎的坐姿／倚靠歷史矩陣，以獨立 `baseline-revision.json.gz` 明列核准的目標動作 before／after 雜湊；舊 baseline 檔案不變，非目標案例仍逐筆與舊值比較。

驗證結果與限制見 [第一批報告](../reports/pose-upper-body-state-batch1-2026-11-12/README.md)。
