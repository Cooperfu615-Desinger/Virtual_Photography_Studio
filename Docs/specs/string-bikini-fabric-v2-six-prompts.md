# 小三角細繩比基尼上身：單品來源與六組輸出片段

2026-10-04。使用者確認這件單品的 26 字英文來源並核准修正實作。本文件只記錄此件上身，不列完整人物、場景或其他服裝 Prompt。

## 資料庫內容

- 名稱：小三角細繩比基尼上身
- 分類：上身 (Tops)
- ID：`wardrobe:上身-tops:小三角細繩比基尼上身:44`
- 中文說明：細繩比基尼上身，以極少量布料僅遮住乳頭，其餘大部分胸部外露；平滑泳裝布料，細長掛脖與背部綁繩。
- 英文單字數：26（以空白分詞；ultra-minimal 計一字）。

```text
string bikini top with ultra-minimal fabric covering only the nipples, leaving most of the breasts exposed, smooth swim fabric, and long slender halter and back ties
```

來源：`knowledge_base/wardrobe_and_styling.md`；同步資料：`webapp/src/data/database.json`。名稱、ID、列順序保留；舊英文僅作匯入 alias。

## 六組實際輸出的單品片段

沿用使用者的診間／I–K／正面牛仔中景基準，直接由正式 `generatePrompts` 產生後擷取此件單品文字。六組皆為上方完整原句，各出現一次，沒有刪句或縮寫。

| 輸出 | 單品結果 | 單品字數 |
| --- | --- | ---: |
| Gpt | 完整保留上方原文 | 26 |
| Grok/Z-Image | 完整保留上方原文 | 26 |
| AI | 完整保留上方原文 | 26 |
| 胸上特寫照 | 完整保留上方原文 | 26 |
| MJ 胸上特寫照 | 完整保留上方原文 | 26 |
| 全身角色照 | 完整保留上方原文 | 26 |

`She wears`、`Wearing` 是服裝段落銜接詞；另外選取的上身版型、配色及圖案屬獨立來源，不計入單品的 26 字。英文沿用使用者確認的布料版本，沒有罩杯、下圍或杯緣描述，也沒有新增三角形限制。

## 重現資訊

Public contract：`1.37.0`；seed：`string-bikini-fabric-review-20261004`。適用於單品可見的上述取景狀態；五官特寫仍依原規則省略服裝。各 renderer 的單品片段、單字數、次數與完整 Prompt 雜湊見 [確認 JSON](string-bikini-fabric-v2-six-prompts.json)。
