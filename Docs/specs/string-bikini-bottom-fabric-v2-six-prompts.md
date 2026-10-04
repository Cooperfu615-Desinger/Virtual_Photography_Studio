# 窄前片細繩比基尼下身：單品來源與六組輸出片段

2026-10-04。依使用者授權沿用比基尼上身的布料描述架構，原位更新此款下身。本文件只記錄這件單品，不列完整人物、場景或其他服裝 Prompt。

## 資料庫內容

- 名稱：窄前片細繩比基尼下身
- 分類：褲裝 (Pants)
- ID：`wardrobe:褲裝-pants:窄前片細繩比基尼下身:32`
- 中文說明：窄前片細繩比基尼下身，極少量平滑泳裝布料形成小型低腰三角前片，搭配高腿口與丁字後片；細側繫繩拉緊貼合髖部，接觸處有可見淺壓痕。
- 英文單字數：36（以空白分詞；narrow-front、ultra-minimal、low-rise、high-cut 各計一字）。

```text
narrow-front string thong bikini bottoms, ultra-minimal smooth swim fabric forming a tiny low-rise triangular front panel, high-cut leg openings, thong back, taut slender side ties fitted tightly around the hips, visible shallow indentations beneath the ties
```

來源：`knowledge_base/wardrobe_and_styling.md`；同步資料：`webapp/src/data/database.json`。名稱、ID、列順序保留；舊英文僅作匯入 alias。

## 六組實際輸出的單品片段

沿用上身確認文件的診間／I–K／正面牛仔中景與 seed，只將下身改選本款；直接由正式 `generatePrompts` 產生後擷取這件單品文字。

| 輸出 | 單品結果 | 單品字數 | 次數 |
| --- | --- | ---: | ---: |
| Gpt | 完整保留上方原文 | 36 | 1 |
| Grok/Z-Image | 完整保留上方原文 | 36 | 1 |
| AI | 完整保留上方原文 | 36 | 1 |
| 胸上特寫照 | 依胸上取景省略下身 | 0 | 0 |
| MJ 胸上特寫照 | 依胸上取景省略下身 | 0 | 0 |
| 全身角色照 | 完整保留上方原文 | 36 | 1 |

`She wears`、`Wearing` 是服裝段落銜接詞；另外選取的下身版型、腰線、配色及圖案屬獨立來源，不計入單品的 36 字。兩組胸上省略下身與繫繩壓痕，全身角色照保留完整來源；畫面外服裝的選擇 ID 仍保留。

## 重現資訊

Public contract：`1.38.0`；seed：`string-bikini-fabric-review-20261004`。適用於上述下身可見的取景狀態；主 Prompt 若改為胸上或五官特寫，仍依既有規則省略下身。各單品片段、單字數、次數與完整 Prompt 雜湊見 [確認 JSON](string-bikini-bottom-fabric-v2-six-prompts.json)。原上身確認文件的六組完整 Prompt 雜湊另經逐字核對，未因這次下身更新改變。
