# 手勢英文改寫 v2（第二階段草案）

- 狀態：**已實作**（2026-10-22，§5）。Cooper 決定見 §5。目標（Cooper）：讓手勢盡量符合所有服裝與造型。
- 範圍：手勢欄的舊版放回 17 個（眼鏡手拿著已搬到道具欄）。蹲姿 7、躺姿、一般 8 句已審過，不在本次。
- 資料來源：`webapp/src/lib/engine/gazeGesture.js` 的 `gesture-legacy-*`。

## 1. 寫法原則（建議）

1. **只寫手與動作，不替服裝與髮型下結論**：衣物一律用泛稱（clothing、top、waistband、outerwear），不寫「衣服保持穿在肩上」「外套滑到肩膀下」這類由穿搭欄位負責的狀態。
2. **不用露骨解剖詞**（nipples、underboob）。
3. **不依賴不存在的東西**：不寫瀏海、特定外套、口袋位置；`support surface`、鏡頭、相機用語全部不用。
4. **一句講完**：目標 25 字內，拿掉氣氛形容詞（confident, cool, cute, casual photo pose）。
5. **允許模型自選的細節留給模型**（左右、位置不指定）。

## 2. 逐句問題與建議改寫

| # | 手勢 | 現況問題 | 建議英文 |
| --- | --- | --- | --- |
| 1 | 拉下上身服裝整理 | `upper-body garment` 偏書面 | `one hand gently tugging the front of her clothing downward to adjust how it sits` |
| 2 | 雙手上拉上衣露出胸下緣 | 露骨詞 `underboob`；假設有可掀起下擺的上衣（洋裝、外套、連身褲不成立）；`garment stays worn on her shoulders` 是穿搭的事 | A：`both hands lifting the front hem of her top to the lower ribcage, showing the midriff`（柔化，意圖變成露出腰腹）／B：保留露胸下緣的意圖，改用 `the lower edge of the bust` |
| 3 | 雙手把褲頭往上拉 | `the garment` 指代不明 | `both hands lightly gripping her waistband at both sides and giving it a small upward tug, elbows relaxed outward` |
| 4 | 雙手拉開外套（雙肩滑落） | 約 60 字；`far outward`、`completely below both shoulders`、`arms still inside the sleeves` 過度規定，與外套閉合、披肩式穿法衝突 | `both hands pulling the front edges of her open jacket wide apart, the jacket slipping off both shoulders and resting around her upper arms` |
| 5 | 雙手遮住胸部 | 露骨詞 `nipples`，並暗示裸露 | `both palms resting flat over her chest, fingers relaxed`（**需你決定意圖，見 §3 第 1 題**） |
| 6 | 雙手插外套口袋 | `jacket or coat` 排除背心、開襟衫 | `both hands tucked into the side pockets of her outerwear, elbows relaxed and angled slightly outward` |
| 7 | 雙手比 ROCK 手勢 | 偏長、`clear` 多餘 | `both hands raised beside the shoulders, each making a rock-horns sign with the index and little fingers extended and the other fingers folded under the thumbs` |
| 8 | 雙手比愛心 | `either the left or right`、`casual photo pose` 多餘 | `both hands forming one heart shape beside the lower face near one side of the chin, thumb tips meeting below and curved index fingers meeting above, elbows naturally bent` |
| 9 | 手指愛心 | `Korean`、`held naturally in front of her` 可省 | `one hand making a finger heart, thumb and index finger crossed near their tips, the other hand resting naturally` |
| 10 | 單手向前張開手掌 | 已無鏡頭用語；可再短 | `one arm extended forward with the open palm facing outward, fingers naturally spread` |
| 11 | 單手托下巴 | `support surface` 在站姿無意義 | `one hand lightly supporting the chin with the fingertips under the jaw, the other hand relaxed` |
| 12 | 單手輕咬食指 | 句子長 | `one hand lightly biting the index finger at the first knuckle, the other fingers softly curled and the hand not covering the face` |
| 13 | 單手往後撥瀏海 | **假設有瀏海**；`confident, cool grooming gesture` 是氣氛 | `one hand brushing her hair back from the forehead, fingers combing through` |
| 14 | 雙手抓著整束頭髮與髮尾整理 | 假設頭髮夠長且未盤起；`ponytail-prep` | `both hands gathering her hair together behind and above the head, one hand holding it near the base while the other smooths it toward the ends` |
| 15 | 單手把眼鏡拉下 | 與眼鏡穿戴方式欄位可能衝突 | `one hand pushing the glasses slightly down the nose, the eyes visible above the frames` |
| 16 | 咬著眼鏡腳 | 同上；`both hands stay relaxed` 與動作無關 | `the glasses taken off and one temple held lightly between her teeth, the frames hanging beside the cheek` |
| 17 | 仰躺雙手合掌靠在臉側 | 已簡潔 | 不改 |

## 3. 需要 Cooper 決定

1. **#2、#5 的意圖**：這兩句現在暗示裸露或半裸（露胸下緣、遮住胸）。要保留意圖（改成較含蓄的用字），還是改成一般的服裝互動（掀衣角露腰腹、手放胸前）？
2. **前提不成立時怎麼辦**：除了穿搭，還有四個前提目前沒有資料可判斷：#2 需要有下擺的上衣（洋裝／外套不行）、#13 需有瀏海或可撥的前髮、#14 需長髮且未盤起、#15 #16 與眼鏡配戴方式、頭上配件衝突。選項：
   - (a) 只改寫法讓句子盡量通用（如 #13 已改成不依賴瀏海），不加判斷。
   - (b) 再加判斷：目前髮型只有文字描述，沒有長度或瀏海欄位，要靠關鍵字猜，準確度低；穿搭可用「連身／外套是否存在」判斷 #2。
   - 建議 (a)，另外 #2 加「穿搭是洋裝時略過」這一項可靠的判斷。
3. **#2 的 A／B**：見表。
4. 寫法原則 §1 是否照用。

## 4. 驗證計畫

- 改寫只動英文：同 seed 比對 `dump_prompt_outputs.mjs`，只有選了這 17 個手勢的組合會變；其他逐字相同。
- 新增測試：17 句不含 `nipples`、`underboob`、`support surface`、`camera`、`lens`、`bangs`；字數上限。
- 出圖實測延後到神情姿態改版完成後統一進行（Cooper 先前決定）。

## 5. 決定與實作紀錄（2026-10-22）

**決定**（Cooper）：撥瀏海照建議；上拉上衣選 B；遮胸要保留「上身沒穿、遮住乳頭」的意圖，另新增單手臂遮胸；其餘照建議（寫法原則、只改寫法、洋裝時略過上拉上衣、不處理眼鏡配戴方式衝突）。

**實作**
- 17 句依 §2 改寫；`單手往後撥瀏海` 改名 `單手把頭髮往後撥`（id 不變）。
- 遮胸保留意圖但不用露骨詞：`both palms covering her bare chest, one palm over each breast, fingers naturally relaxed`（`bare chest` 表示未穿上衣；若想回到 `nipples` 字眼請告訴我）。
- 新增 `單臂橫擋遮胸`（`gesture-legacy-arm-cover-chest`）：`one arm held across her bare chest, covering both breasts, the other arm relaxed at her side`。我把「單手上臂」理解為單側手臂橫擋在胸前；如果指的是別的姿勢（例如只用上臂），請告訴我。兩句遮胸都只能手動選。
- 上拉上衣 B：`both hands lifting the front hem of her top to the lower ribcage, revealing the lower edge of the bust`；新增穿搭訊號 `topHem`（穿搭是洋裝、或上衣選全無時為缺少），缺少時選單停用並標「（需要非洋裝的上衣）」，生成時略過。
- 手勢欄選項 26 → 27（一般動作）。

**驗證**
- 與 main @ f967a7c 比對 1642 組輸出：只有「全部隨機」51 組改變（抽到被改寫的手勢），其餘逐字相同。
- strict audit 與 main 相同；`npm test` 1783/1783、Prompt Quality 745/745、lint、build、sync、Python、公開資產、diff-check。
- 瀏覽器 1440×1000：手勢欄 27 項，上衣選全無時上拉上衣停用並標示；無橫向溢出、無主控台錯誤。
- 新測試：17 句不含露骨詞／`support surface`／鏡頭／瀏海且 34 字內；兩句遮胸不進隨機；上拉上衣在 `topHem` 缺少時略過、洋裝時不寫入。
