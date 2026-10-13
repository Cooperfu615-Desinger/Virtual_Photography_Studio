## 實跑角色卡輸出檢查 (33 卡 × 3 seeds = 99 次 generatePrompts，locks 只設 characterProfileId)
| 輸出 | 樣本 | 空值 | 含 adult | 四錨點逐字全保留 | 含控制語 |
|---|---|---|---|---|---|
| gpt (grokPrompt) | 99 | 0 | 0 | 99 | 99 |
| z (zImagePrompt) | 99 | 0 | 99 | 99 | 1 |
| ai (midjourneyPrompt) | 99 | 0 | 99 | 99 | 0 |
| chestGpt (chestUpPortraitPrompt) | 99 | 99 | 0 | 0 | 0 |
| chestMj (chestUpMjPortraitPrompt) | 99 | 99 | 0 | 0 | 0 |
| fullBody (fullBodyCharacterPrompt) | 99 | 99 | 0 | 0 | 0 |

控制語命中 (輸出:詞 → 卡數):
- gpt:permanent identity anchors → 33 卡 (99 次)
- gpt:coherent facial identity → 32 卡 (96 次)
- gpt:locked footwear state → 1 卡 (1 次)
- z:locked footwear state → 1 卡 (1 次)