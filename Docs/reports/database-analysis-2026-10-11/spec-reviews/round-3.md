# 規格第三輪複審：catalog-data-architecture-v1.md（495 行）

**結論：第二輪的問題全部已解決。這次修訂新增 3 項問題，其中 1 項是錯誤。**

## 第二輪問題的狀態

| 編號 | 狀態 | 依據 |
| --- | --- | --- |
| N1 | 已解決 | L70、L75-76、L193 改用 `entries`（buildEntries 輸出的 structuredClone），並逐條斷言 en |
| N2 | 已解決 | L70、L196-203 |
| N3 | 已解決 | L227-232：只處理新複本；另外兩支測試不調整，並寫明理由 |
| N4 | 已解決 | §6.2.1-6.2.3 改為不限行數、排除函式陣列、修正 :2740 的歸類、新增 fieldKind，並明定比對邏輯不變 |
| N5 | 已解決 | L296 規則 8 |
| N6 | 已解決 | L184、L324-328 |
| N7 | 已解決 | L77-78、L369 |
| N8 | 已解決 | L216、L247 |
| N9 | 已解決 | L53 |
| N10 | 已解決 | L220-222 |
| A4 | 已解決 | L338-341：路徑完整、定義了 pin；`ambientLightDescriptions.js` 確實有 `"source"` 鍵 |
| A5 | 已解決 | L103；「27 個」「21 張」的字樣已移除 |
| A6 | 已解決 | L475 |
| A7 | 已解決 | L52 |
| S3 | 已解決 | L21 改為 `1585-1587`，HEAD 上 toHaystack 在 1585、hasAny 在 1587 |
| E9 | 已解決 | L359 |

## 新增問題

1. **錯誤｜L435｜legacy-key 的規則會被現有資料擋下**
   - 規則寫「legacy-key 不得與現行 ID 衝突」。
   - `CAMERA_FILM_LEGACY_OPTION_MAP`（`engine.js:2725`）有一筆 legacy `['復古微對比銳利感', 8]`。它推出來的 ID，正好等於目標條目自己的現行 ID：該條在 database.json 底片與相機模擬分類中的索引就是 8。
   - 結果是資料完全沒改，3b 的驗證也會失敗。
   - 修正：改為「不得與**其他**條目的現行 ID 衝突」。分析工具的 LEGACY_ID_SHADOWED 也是用這個定義，目前沒有命中。

2. **模糊｜L66 與 L406｜export 沒有參數，suggest 腳本卻需要傳入修改過的資料**
   - L66 的 export 用預設 runtime 編譯，不接受參數。
   - L406 的 suggest 腳本卻要先把條目的 semantic 去掉，再拿去編譯。
   - 修正：export 需要接受 customLibrary 參數。另外 3a 之後 schema 要求每條都有 semantic，新條目無法先通過 sync，所以要寫明 suggest 腳本直接在記憶體中組 library，不經過 sync。

3. **模糊｜L454｜等價測試比對完就失去比對對象**
   - 測試要比對「搬遷前的內嵌版本」，但驗證通過後內嵌版本會被刪除，之後這個測試就沒有東西可比。
   - 修正：把搬遷前算出的結果存成凍結的 fixture JSON。

4. **建議｜L193、L220｜遷移腳本要在 buildEntries 修改前執行**
   - 目前 database.json 已有 1 條同時有 stableId 與 legacyIds。如果先改 buildEntries 再跑遷移，這一條的 rawZh 別名不會出現在 `entries`，遷移會把它漏掉。
   - I2 的目錄快照會擋下這個錯誤，但建議在規格中寫明執行順序。

## 抽查確認正確的部分

- L21 的行號正確。
- 在 HEAD 上，`CAMERA_PROFILE_RENDERING_MIGRATIONS` 確實在 `:3836` 依 profileId 取出 targetZh。
- 在 HEAD 上，`:2915-2918` 確實是 `.map()` 搭配 slugify 計算 legacyId。
- `ambientLightDescriptions.js` 確實有 `source` 欄位。
- database.json 的 en 與 buildEntries 經 stripMarkdown 後的 en 一致，所以 L193 依 en 做的斷言可行。
