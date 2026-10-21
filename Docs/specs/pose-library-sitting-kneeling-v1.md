# 動作庫：坐姿與跪姿 v1

- 狀態：**已實作**（2026-10-21，§6）。Cooper 2026-10-21：用和站姿相同的模式，把原本資料庫的坐姿與跪姿轉成指定動作。
- 來源：舊自由組合的公開肢體變化（坐姿 10、跪姿 7），英文與裁切片段來自 `poseComposerOptions.js`。
- 做法比照 [站姿 v1](pose-library-standing-v1.md) 第一批與 [蹲姿 v1](pose-library-squatting-v1.md)。

## 1. 結構建議（比照站姿）

| 項目 | 建議 |
| --- | --- |
| 動作 | 英文沿用，只補成 `She sits …`／`She kneels …` 完整句、切 core／lower／upper；拿掉內部用語 `arrangement` |
| 驗收 | 視為 `accepted`，加入「隨機」；實測延後到改版完成後統一進行 |
| 手部 | 手空著，可搭配通用 8 句手勢（新 4 句不進隨機，同站姿） |
| 裁切 | 沿用已核准的片段：有上身片段的用片段；原本中景與胸上省略的，用蹲姿 O6 (b) 的機制省略 |
| 坐具 | 本批**不指定坐在哪裡**（同舊自由組合未選坐具時）；坐具另案處理，見 §5 第 3 題 |

## 2. 坐姿（10 個）

`中景／胸上` 欄是已核准的投影片段改寫成句子；「省略」表示中景與胸上不寫動作句。

| # | 中文 | 原英文 | 新版子句（core ／ lower ／ upper） | 中景／胸上 |
| --- | --- | --- | --- | --- |
| S1 | 自然坐姿 | natural seated arrangement | core `She sits in a relaxed, natural posture` | `Her upper body rests in a relaxed seated posture.` |
| S2 | 微微前傾 | slightly forward-leaning seated arrangement | core `She sits leaning slightly forward` | `Her upper body leans slightly forward.` |
| S3 | 雙腿自然伸展 | seated pose with both legs naturally extended | core `She sits` ／ lower ` with ` `both legs naturally extended` | 省略 |
| S4 | 盤腿坐姿 | cross-legged seated arrangement | core `She sits cross-legged` | 省略 |
| S5 | 雙腿屈起 | seated pose with both legs bent and knees raised, feet resting naturally | core `She sits` ／ lower ` with ` `both legs bent and her knees raised, her feet resting naturally` | 省略 |
| S6 | 隨性癱坐 | casually slumped seated posture with a loose, heavy body, dropped shoulders, and the torso settling naturally into the seat | core `She sits casually slumped with a loose, heavy body` ／ upper `, ` `her shoulders dropped and her torso settling naturally into the seat` | `Her upper body slouches loosely and heavily with dropped shoulders and a relaxed torso.` |
| S7 | 翹二郎腿 | leg-cross seated arrangement | core `She sits` ／ lower ` with ` `one leg crossed over the other` | 省略 |
| S8 | 單腿屈起坐姿 | seated arrangement with one knee drawn up, the other leg relaxed | core `She sits` ／ lower ` with ` `one knee drawn up and the other leg relaxed` | 省略 |
| S9 | 雙腿側放坐姿 | seated arrangement with both legs angled to one side, soft asymmetrical lower-body line | core `She sits` ／ lower ` with ` `both legs angled to one side in a soft asymmetrical line` | 省略 |
| S10 | 開闊自信坐姿 | open, grounded seated posture with the knees comfortably apart, weight settled through the hips, and the torso relaxed and upright | core `She sits in an open, grounded posture with her weight settled through her hips` ／ lower `, ` `her knees comfortably apart` ／ upper `. ` `Her torso is relaxed and upright` | `Her upper body is open and relaxed, her torso upright and her shoulders at ease.` |

注意：
- S1、S2、S4、S7 的原英文只有一句很短的描述（`natural seated arrangement` 等）。新版只換成自然的句子，**不補新的細節**；如果你想讓它們更具體，屬於之後修 Prompt 的範圍。
- S7「翹二郎腿」原文 `leg-cross` 改寫成 `one leg crossed over the other`，是同一件事的白話說法。
- 和既有指定動作的關係：S8 與「單腿屈起・單掌後撐」、S5 與「低坐抱膝」姿勢相近，但既有的是手部固定的參考圖動作，新版是手空著的版本，兩者並存。

## 3. 跪姿（6 個，建議不轉四足跪姿）

| # | 中文 | 原英文 | 新版子句 | 中景／胸上 |
| --- | --- | --- | --- | --- |
| K1 | 跪坐 | seiza-style kneeling posture with the hips resting on the heels, knees together, and the torso upright | core `She kneels in a seiza posture with her hips resting on her heels` ／ lower `, ` `her knees together` ／ upper `, ` `her torso upright` | 省略 |
| K2 | 分腿跪坐 | wide-knee kneeling posture with both knees grounded and naturally apart, lower legs folded back on either side, hips resting on the ground between the legs, and the torso upright | core `She kneels with both knees grounded and naturally apart, her hips resting on the ground between her legs` ／ lower `, ` `her lower legs folded back on either side` ／ upper `, ` `her torso upright` | 省略 |
| K3 | 前傾跪姿 | forward-leaning high kneeling posture with both knees grounded, hips lifted clear of the heels, and the upper body inclined forward from the hips | core `She kneels high with both knees grounded and her hips lifted clear of her heels` ／ upper `, ` `her upper body inclined forward from the hips` | `Her torso leans forward from the hips.` |
| K4 | 直立端正跪姿 | upright high kneeling posture with both knees grounded, thighs nearly vertical, hips lifted clear of the heels and positioned above the knees, and the torso tall with relaxed shoulders | core `She kneels upright with both knees grounded, her thighs nearly vertical and her hips lifted clear of her heels above her knees` ／ upper `, ` `her torso tall with relaxed shoulders` | `Her upper body is tall and relaxed.` |
| K5 | 側坐跪姿 | side-sitting kneeling posture with the hips lowered beside the folded legs and the torso relaxed upright | core `She kneels in a side-sitting posture with her hips lowered beside her folded legs` ／ upper `, ` `her torso relaxed and upright` | 省略 |
| K6 | 單膝前跨跪姿 | half-kneeling posture with one knee grounded, the other leg stepped forward, and the front knee bent | core `She half-kneels with one knee grounded` ／ lower `, ` `the other leg stepped forward with the front knee bent` | 省略 |

**不轉：四足跪姿**（`all-fours kneeling posture with both knees grounded and the torso held low, roughly parallel to the ground`）。四足跪姿的雙手必須撐地，舊自由組合也會強制綁定「雙掌撐地／雙前臂撐地」；這兩種已經是現有的指定動作（四足跪姿・雙掌撐地、四足跪姿・雙前臂撐地），做成手空著的版本會和撐地矛盾。

## 4. 數量與影響

- 新增 16 個指定動作（坐姿 10、跪姿 6），選擇器 38 → 54 組；隨機池 22 → 38。
- 裁切沿用已核准片段，既有輸出不變；「全部隨機」只會因為抽到不同動作而改變。

## 5. 待決（Cooper）

1. §1 結構照站姿模式（accepted、加入隨機、手空著配通用手勢、實測延後）。
2. §2、§3 的新版句子；S1、S2、S4、S7 只換句型、不補細節。
3. **坐具**：舊自由組合有 9 種坐具（一般椅子、雕花絨布扶手椅、沙發、長椅、台階、床、地面、浴缸內、洗手台檯面），P4 隨自由組合移除。建議本批不做，之後比照躺姿表面由場景提供「可坐的地方」（同倚靠類的做法）。
4. 四足跪姿不轉（§3）。

## 6. 決定與實作紀錄（2026-10-21）

**決定**（Cooper「照建議」）：§5 四題都照建議——站姿模式、§2 §3 的句子（4 句短描述只換句型）、坐具另案（比照躺姿表面由場景提供）、四足跪姿不轉。

**程式**
- `specifiedActions.js`：新增 16 個（`specified-sitting-*` 10、`specified-kneeling-*` 6），accepted、手空著，可搭配通用 8 句手勢。有已核准上身片段的 6 個用片段；其餘 10 個帶 `upperBodyOmitted`，中景與胸上不寫動作句（同蹲姿 O6 (b) 機制）。
- 選擇器 38 → 54 組；隨機池 22 → 38。
- 測試：`gazeGesture.test.js` 新增 2 項（16 個動作的狀態、手勢、不含 `arrangement`、不轉四足；裁切片段與省略）。`page1SectionRandom.test.js`、`poseMenuV2.test.js` 原本用「動作英文前 40 字」比對，抽到短句動作再加上隨機手勢時會誤判，改為比對動作第一個子句。

**驗證**（與 main @ 3681356 比對，`scripts/dump_prompt_outputs.mjs`）
- 代表性、預設隨機、既有動作×景別：逐字相同。
- 全部隨機 150 組：142 組改變，全部是抽到不同動作（77 組抽到新坐姿或跪姿）。
- 同 seed strict audit 與 main 相同；`npm test` 1754/1754（連跑 2 次）、Prompt Quality 745/745、lint、build、sync、Python、公開資產、diff-check。
- 瀏覽器 1440×1000／390×900：選擇器 54 組，坐姿分類 14 個、跪姿分類 9 個；跪坐全身輸出正確；五個工作區無溢出、無破圖、無主控台錯誤。

