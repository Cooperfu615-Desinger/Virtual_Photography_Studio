# 2026-10-13 目錄資料架構決策

- 產出規格：[catalog-data-architecture-v1.md](../specs/catalog-data-architecture-v1.md)
- 前置分析：[資料庫完整分析報告](../reports/database-analysis-2026-10-11/README.md)
- 參照版本：`codex/specified-actions-v1` @ `e86703e`（尚未合併；`main` 為 `60b6489`）。實作基準是開始 1a 時的 `main`，見規格開頭的說明。

## Cooper 確認的四項前提（2026-10-13）

1. canonical 資料格式改為「每個分類一個 JSON」，並在 Phase 1 與 ID 凍結一併遷移。
2. 保留由同步腳本自動產生的唯讀 Markdown 總覽，供閱讀使用。
3. 已知的資料錯誤在 Phase 1–3 原樣凍結，留到 Phase 4 另立規格修正。
4. 格式遷移（1c）期間，暫停其他 session 新增或修改目錄資料。

## 技術路線決策（可逆，限本專案）

| 決策 | 理由 | 放棄的方案 |
| --- | --- | --- |
| 用 JSON，不用 YAML | 資料由 Codex 編輯；JSON 較嚴格，不會出現縮排或型別自動轉換的錯誤；不需新增解析依賴 | YAML：人類閱讀較友善，但目前不是由人直接編輯 |
| 每個分類一個檔，不是每個分區一個檔 | 檔案較小，並行修改較不易衝突；檔名與 ID 前綴一致 | 每個分區一個檔：穿搭單檔仍會非常大 |
| 現有 ID 原樣凍結，包括 engine 自動產生的列序別名 | 存檔不會有任何變動；重排後舊別名仍可解析 | 重新設計所有 ID：必須遷移使用者存檔，風險高 |
| 新 ID 用英文 kebab 短名，不含列序 | 與名稱、順序脫鉤；字元集穩定 | 繼續用中文 slug：改名時容易誤改 ID |
| 參考圖 manifest 不併入紀錄 | 屬於圖片資產；兩支圖片腳本直接讀取，且已有依名稱的檢查 | 一併合併：會擴大 1c 範圍，沒有額外收益 |
| schema 用 JSON Schema 子集，sync 內建最小驗證器 | 不新增 Python 依賴，CI 環境不需變動 | 引入 `jsonschema` 套件 |
| JS 內嵌目錄（角色卡、Pose Composer 等）本次只驗證、不搬家 | 搬家會牽動大量 engine 匯入與測試；只做驗證即可擋住主要風險 | 一併改成 JSON：範圍過大 |
| 推論 meta 寫入 `meta.semantic`，`infer*Meta` 保留 | 以快照保證結果一致；推論函式留給自訂 library 與 Phase 4 比對 | 直接刪除推論函式：失去 Phase 4 的比對基準 |
| 已知問題放進完整性檢查的允許清單，且清單過期會報錯 | CI 能立即啟用，同時避免允許清單長期累積 | 先修完所有問題再接 CI：會被待決策事項卡住 |

## 反向重述審查後的修訂（2026-10-13）

fresh-context 審查員反向重述規格，並對照程式碼，找出 14 處問題。修訂後的規格已改用以下決策：

| 決策 | 理由 | 放棄的方案 |
| --- | --- | --- |
| 參照版本改為 `codex/specified-actions-v1` @ `e86703e`，實作基準定為開始 1a 時的 `main` | 審查期間工作區切到這個尚未合併的分支；把數字寫死在某個版本，都會和實作當時不符 | 寫死 `main` @ `60b6489` 或 `e86703e`：兩者都可能不是實作當時的版本 |
| 快照以 `controlKey + id` 為鍵，並另做目錄層快照 | `none`、`random`、`3:4` 等 ID 跨 control 重複，且各自的 meta 不同；Negative 19 條不在任何 control 裡 | 只以選項 ID 為鍵：會互相覆蓋而漏檢 |
| 在 engine 新增測試專用 export `getCompiledCatalogForTesting()` | 不加這個 export，就無法快照 Negative，也無法取得推論函式 | 不改 engine：1a 與 3a 都做不到 |
| ID 登記改用只增不減的 `id_registry.json` | 快照可以被更新，用快照判斷新舊 ID 或偵測刪除都會被繞過 | 用快照判斷：之後無法保證「ID 永不重用」 |
| `meta.semantic` 取代 inferredMeta 的位置，並從 sourceMeta 剝除 | 否則 semantic 鍵會漏進編譯後的 meta，I3 必定失敗 | 只把 semantic 放進 meta：會改變編譯結果 |
| 紀錄不含 manifest 衍生的參考圖鍵 | 避免同一份資料有兩個來源 | 照抄 database.json 形狀：manifest 鍵會變成兩處維護 |
| Regional 的 inspiration 拆成獨立的來源欄位 | Markdown 總覽要拆回兩欄；26 條都恰好含一個分隔符 | 從 desc 字串硬拆：較脆弱 |
| 完整性檢查分 confirmed／possible 兩級，允許清單以「代碼＋項目」比對 | 「清單過期」才有可判斷的粒度 | 只以問題代碼比對：無法判斷個別項目是否已修好 |
| CI 檢查放在 `npm ci` 之後 | 腳本需要 Node 22 與 espree | 和 Python 檢查放在一起：那一段還沒安裝 Node |
| legacy 表依 `targetKind` 分三類驗證 | 有些表的目標是屬性值或 JS 內嵌 ID，Python 驗不到 | 一律轉成目錄 id：做不到 |

### 第二輪複審後的修訂

| 決策 | 理由 | 放棄的方案 |
| --- | --- | --- |
| 測試專用 export 在 buildEntries 階段取 `entries` 與 `inferredMeta` 的副本 | 最終 catalog 已把頭部配件拆到合成分類，索引對不上；legacy 表追加的 ID 也已混入，無法回推 | 從最終 catalog 回推：會錯位，也分不出 legacyIds 的來源 |
| 3a 直接使用 buildEntries 保存的 `inferredMeta`，不另外重算 | 推論的輸入要經過 `formatWardrobeOptionDisplayName`，外部腳本無法重現 | 由腳本重算：結果可能和 engine 不同 |
| **3b 只搬遷資料並加驗證，不把 zh 轉成 id**，並先做清點、停下確認 | 轉成 id 必定要改比對邏輯，違反「不改行為」；第一版的 21 張表界定與分類有誤 | 一次轉成 id：屬於行為變更，應留到後續規格 |
| 停止產生別名的條件改為「同時有 stableId 與 legacyIds」 | 只有 stableId 的測試 fixture 行為不受影響 | 只看 stableId：會影響測試 fixture |
| 只清除「新複製出來的條目」上的 stableId | 整份 snapshot 當成 library 時，若刪除 stableId，會讓 15 條 ID 改變 | 刪除所有 stableId：會破壞歷史基準 |
| 登記簿增加反向檢查 | 否則直接刪除紀錄不會被偵測到 | 只做正向檢查 |
| 一次性遷移腳本保留在 `scripts/migrations/`，不接 CI | 作為稽核紀錄，同時避免被重跑 | 執行後刪除：失去重現依據 |

## 實作前新發現

engine 每次建置時，會依列序替每條自動產生一個 rawZh 別名 ID（`engine.js:3296`）。舊存檔可能存著這種 ID。所以凍結範圍必須包含完整的編譯後 legacyIds 集合，不能只凍結主 ID。這點已寫入規格 §4.3.2 與不變量 I2。
