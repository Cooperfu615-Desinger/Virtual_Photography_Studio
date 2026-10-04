# X形胸貼：單品來源與六組輸出片段

2026-10-04。使用者接受平滑、不透明布料的 X 形胸貼實測，核准原位替換「小罩杯細帶蕾絲胸罩」並修正名稱。本文件只記錄這件上身，不列完整人物、場景或其他服裝 Prompt。

## 資料庫內容

- 名稱：X形胸貼
- 分類：上身 (Tops)
- ID：`wardrobe:上身-tops:小罩杯細帶蕾絲胸罩:43`（沿用原胸罩 ID）
- 中文說明：兩枚獨立的 X 形貼附式胸貼，左右胸部各一枚；每枚由兩條短布帶交叉構成，使用平滑、不透明布料；無罩杯、肩帶或下圍。
- 英文單字數：27（以空白分詞；X-shaped 計一字）。

```text
two separate X-shaped adhesive pasties, one centered on each breast, each formed from two short crossed strips of smooth opaque fabric, no cups, shoulder straps, or underband
```

來源：`knowledge_base/wardrobe_and_styling.md`；同步資料：`webapp/src/data/database.json`。只改名稱、英文及說明，原 ID、列順序與 storage schema 保留；舊名稱及完整英文在 metadata 保留為相容 alias。舊 Saved Cards 原文不批次改寫，還原後重新生成採新來源。

## 六組實際輸出的單品片段

沿用比基尼上身確認文件的診間／I–K／正面牛仔中景基準與 seed，只將上身改選本款；直接由正式 `generatePrompts` 產生後擷取這件單品文字。

| 輸出 | 單品結果 | 單品字數 | 次數 |
| --- | --- | ---: | ---: |
| Gpt | 完整保留上方原文 | 27 | 1 |
| Grok/Z-Image | 完整保留上方原文 | 27 | 1 |
| AI | 完整保留上方原文 | 27 | 1 |
| 胸上特寫照 | 完整保留上方原文 | 27 | 1 |
| MJ 胸上特寫照 | 完整保留上方原文 | 27 | 1 |
| 全身角色照 | 完整保留上方原文 | 27 | 1 |

`She wears`、`Wearing` 是服裝段落銜接詞；另外選取的上身版型、配色與圖案屬獨立來源，不計入單品的 27 字。`no cups, shoulder straps, or underband` 是使用者確認的服裝結構描述，不是內部控制文字；不再輸出原款的蕾絲、罩杯承托或杯緣貼合效果。胸貼沒有衣襬，因此沿用小面積單品排除衣長銜接，且不輸出「衣襬遮住部分下身」的關係。

## 重現資訊

Public contract：`1.39.0`；seed：`string-bikini-fabric-review-20261004`。六組在上述可見取景狀態保留相同來源；局部五官特寫依既有規則省略服裝，原單人選擇 ID 保留。各單品片段、單字數、次數與完整 Prompt 雜湊見 [確認 JSON](x-shaped-pasties-v2-six-prompts.json)。

變更前後核對：220 組其他上身／景別的 selection 及六輸出雜湊一致；既有比基尼上下身確認文件的 12 組完整 Prompt 雜湊一致；資料庫僅替換上述一列。程式與瀏覽器驗證確認正式文字及操作，未另送正式六輸出至外部圖像模型生成圖片。
