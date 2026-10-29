# C4 第二批：髮型與森林步道中文名稱 v1

2026-10-29。基準 main `3fd6dd8491d98f817b2090b821ab120c45f32c70`。已授權實作及本機驗收，未授權 stage／commit／push。驗收實際狀態見 [本批報告](../reports/c4-catalog-labels-2026-10-29/README.md)。

## 範圍與名稱

| 原中文 | 新中文 |
| --- | --- |
| 帥氣濕亮油頭 | 帥氣後梳短髮 |
| 不對稱濕感短鮑伯 | 不對稱短鮑伯 |
| 半濕感中長髮 | 自然中長髮 |
| 直髮：濕感 | 中長直髮 |
| 自然微彎：濕感 | 自然微彎中長髮 |
| 濕潤感長波浪 | 柔波長髮 |
| 戶外：霧感森林步道 | 戶外：森林步道 |

髮型英文及 desc 已只負責輪廓；濕感由獨立整理狀態承接。森林原文沒有霧。本批只校正中文，不補濕感或霧，不更動英文／desc／semantic／ID／legacyIds／順序／選值／RNG／整理狀態規則。新名稱在各自分類內不得重複。

正式來源為 `knowledge_base/catalog/Character/髮型-hairstyle.json` 及 `Locations/自然與戶外-nature-outdoors.json`。同步產物為 character_design.md、locations_and_sets.md、database.json。

`legacy_mappings.json` 的 CHARACTER_IDENTITY_LEGACY_OPTION_MAP 僅六個 targetZh 改為新名稱；舊 legacy tuples、舊名稱、索引、順序與 LEGACY_HAIR_STYLING_STATE_MIGRATIONS 原樣保留。生成 legacyMappings.json 同步更新。首次命中、載入時計算、明確整理狀態優先及雙人隔離不變。舊 ID 中的中文是永久識別的一部分，禁止改名 ID。

## 相容與驗收契約

- 舊名稱對應的歷史 ID／舊索引可解析為同一現行 ID；六筆舊髮型的濕感遷移與明確指定整理狀態的優先權不變。
- 新中文僅作用於新選單、摘要或重建顯示。舊收藏公開原文不重寫；原有反序列化補預設欄位行為對照修改前結果，不誤稱存取物件完全無正規化。
- 固定修改前 558 組：六筆髮型 × 五種整理選項 × 單人／雙人 A／B × 六景別，加森林 × 三角色模式 × 六景別。逐案比較英文六輸出、selection、RNG 呼叫與舊收藏存取結果。
- 固定 1,098 組歷史 normalize／純文字還原輸入對照當次 main 結果，不能取代 E 原始封存；E 原始 snapshot 與案例仍須隔離回放。
- `scripts/c4_catalog_labels_acceptance.mjs` 預設唯讀比較；`--record` 僅修改前首次建立新檔，既有檔拒絕覆寫。基準不得重錄。
- `scripts/lib/c4CatalogLabelsReplay.mjs` 僅接受隔離副本與精確核准前後雜湊；拒絕正式 checkout。原 A～E／A2／Phase 4 基準及先前報告不修改。
- 顯示名稱 fixture 更新只替換查找名稱，不改預期英文。新回歸由既有 npm test 收入。

完整門檻：同步 check、schema／歷史 ID／strict、Python／公開資產、相關回歸、前端全套／prompt-quality／lint／build、200／prompt-quality-baseline strict 前後比對、正式產物初始化與六工作區桌手機 smoke。受影響 A／C 區實際選值、整理狀態、Saved Cards 套用與無錯誤／無溢位需驗證。原生選單操作若未完成，必須分開記錄，不以注入 change 事件宣稱直接操作通過。

用字統一、其他 C 類、PAGE2 舊匯入、J12、P5b 排除。Cooper 已追加授權 C4 必要的共用回放銜接。只在隔離副本準備／傳遞精確還原來源，原封存雜湊與失敗條件保持；完整通過前不宣稱驗收完成。

交付補記：Cooper 已驗收通過並授權只提交／推送本批。上方未提交及審核等待為當時紀錄；瀏覽器原生選單直接滑鼠操作限制維持。CI／部署結果於本次交付另行核對。
