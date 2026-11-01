# Saved Cards 持久化 v1：A 階段相容契約與基準

2026-11-01。程式／遠端 main 基準：`60c46d39ef0524c9b641c771e6319fb5d4b2e091`。使用者已授權 A；B～D 未開始。本文件是 [v1 規格](saved-cards-persistence-v1.md) 的 A 階段附件。

## 1. 本批完成界線

建立可重跑的合成輸入、唯讀原始快照／payload 比對、現行程式行為基準及後續驗收情境。測試工具放在 scripts，不被 webapp 匯入；沒有 IndexedDB repository、資料遷移器、outbox、雲端交易或 UI 實作。

「現況基準一致」只表示捕捉到相同舊行為，不代表現行問題已修復。SC-P01～SC-P15 的產品驗收均為 prepared-not-executed；本批通過的是資料／工具／現況重現驗收。

## 2. 合成資料與來源責任

[fixture JSON](../../scripts/fixtures/saved-cards-persistence-v1.json) 的 provenance 為 synthetic-only，固定日期、ID 與文字，不來自私人瀏覽器／Firestore／使用者 ZIP。容量案例以固定配方展開，避免存入數 MB 的重複文字；配方、完整展開 payload hash 與序列化 bytes 一起封存。

| 類別 | 數量 | 內容 |
| --- | --- | --- |
| 原始卡片 | 12 | raw PAGE1、compact v2／v3／v4、PAGE2、PAGE3、actionPose、未知來源、Unicode ID、無 Nano、未知版本、缺 ID |
| 原始儲存情境 | 14 | 不存在、[]、空字串、壞 JSON、null、錯誤外層形狀、混合卡片、ID-only、ID／feed 不同順序、相同重複、衝突重複、legacy 合併衝突、已遷移標記、讀取拒絕 |
| 容量配方 | 4 | 131、500、1,000 筆與超大單卡；全數超過舊 2,250,000 bytes 預算 |
| 未來驗收情境 | 15 | SC-P01～SC-P15，含輸入、事件／故障順序、預期結果、負責階段；未連接產品執行器 |

原始卡片包含 Gpt／Z／AI／Nano、胸上／全身／歷史已移除衍生輸出、選值、角色 identityAndBody、profile、lineage、remixMeta、來源與未知欄位。這是儲存格式覆蓋，不宣稱已逐一覆蓋所有目錄組合或每種 Prompt 模式；既有相容測試補充正常快照與匯出路徑。

## 3. A 階段固定相容契約

| 表面 | 現況證據 | B／C 必須維持或改善的契約 |
| --- | --- | --- |
| 卡片格式 | 現行寫 v3，讀 v2／v3／v4 與 raw | 儲存容器升版不把所有舊卡重寫 v3；opaque payload 與顯示投影分開 |
| 原文 | codec 保留公開文字，但會丟未知欄位／v4 ld、lt | 原 payload 全部保留；不把 ld／lt 等退休欄位重新啟用於 UI／Prompt |
| ID | 字串含斜線、%2F、中文及 emoji 可存在 | 不改大小寫、不 URL decode、不補猜 ID；雲端路徑仍 encodeURIComponent |
| 重複 ID | 舊 feed merge 保留第一筆，其他來源可能仍有重複 | 每個來源／索引均入帳；同內容與異內容分開，衝突不靜默丟掉 |
| ID-only | 舊讀取依 feed 順序篩選，缺引用略過 | 同時保留原 ID 陣列與 feed；顯示順序沿用可還原的既有 feed 順序；缺引用記 unresolved，不造卡 |
| 原始儲存 | vps.favorites、vps.prompts、vps.viewMode、vps.savedCardsMigration | 快照保存 exact string；不存在、空字串、[]、損壞與讀取錯誤不得混同 |
| 匯入順序 | imported-first，同 ID 替換 existing | 不自動按日期排序；遷移不得以排序清理改變現有清單 |
| 本機／雲端 | 本機共用 Library；目前 UID 分開雲端路徑 | 本機範圍保持；C 的 outbox 必須綁 UID，不能把全域清單誤當全數已同步 |
| 下載 | 未知舊 ID 可 backup-only 匯出；正常快照維持可匯入格式 | 保留篩選範圍與舊原文；backup-only 不能冒充可還原快照；本次新發現 Unicode 缺口見 §5 |

A 的 inspectRawRecords 只列出來源索引、種類、hash、重複及衝突，不合併、不決定勝方、不把結果寫回。未知版本、缺 ID、ID-only 不因現行 codec 回傳 null 就消失。

## 4. 工具與封存規則

- [Fixtures／快照／比對工具](../../scripts/lib/savedCardsPersistenceFixtures.mjs)：原始快照只接受工具建立的記憶體替身；未標記的 getItem 物件也拒絕。工具沒有真實 localStorage、IndexedDB 或 Firebase 入口。
- [現況量測](../../scripts/lib/savedCardsPersistenceBaseline.mjs)：呼叫現行 codec／localRepository，但所有寫入與舊遷移只發生在拋棄式記憶體替身；不模擬成新方案已完成。
- [ZIP 量測](../../scripts/lib/savedCardsPersistenceArchiveBaseline.mjs)：呼叫現行 archive，輸出留在記憶體，檢查 ZIP 解開後的內容；不呼叫下載按鈕或產品 Import。
- [唯讀 CLI](../../scripts/check_saved_cards_persistence_a.mjs)：預設／--check 比對固定基準；--measure 只將核心現況輸出 stdout。拒絕 --update、--output、--input、--browser，不提供任意私人檔案載入或重錄基準入口。
- [測試](../../scripts/tests/saved-cards-persistence-a.test.mjs)：包含資料喪失／改字／重排的負例、來源漂移拒絕、容量／錯誤重現與匯出限制。

payload 比對採 JSON key 排序；陣列順序、Unicode、空白、換行、來源／ID、未知欄位皆有意義。雲端比較僅可排除頂層 cloudUpdatedAt，巢狀同名欄位仍是使用者內容。原始字串另存 exact string 與 UTF-8 SHA-256；不能用正規化 hash 代替原字串。非 JSON 值明確拒絕。

[baseline.json](../reports/saved-cards-persistence-a-2026-11-01/baseline.json) 記錄 15 個來源／鎖檔 SHA-256、fixture hash、完整現況解碼投影、保存結果及遷移呼叫。來源漂移會失敗，不能只用新的預期覆蓋舊基準。B 修改來源後應在隔離的 60c46d39 程式副本回放本基準，另建新行為驗收；A～E、Phase 4、C 類及下載舊報告不變。

## 5. 已確認的現況限制

| 合成案例 | 序列化 bytes | 現行保存筆數 | 定位 |
| --- | ---: | ---: | --- |
| 131 筆 | 2,850,079 | 103 | 舊容量裁切重現；不代表私人 131 筆會裁到相同數量 |
| 500 筆 | 3,588,781 | 313 | 配方擴大量測，非產品上限 |
| 1,000 筆 | 5,017,781 | 448 | 配方擴大量測，非產品上限 |
| 超大單卡 | 2,702,855 | 0 | 第一筆過大就停止，仍可能回報 failed:false |

- 模擬 QuotaExceeded 且只容得下 [] 時，現行程式會用空清單覆寫舊值；非 quota 的寫入失敗則保留舊值並 failed:true。
- 壞 JSON／錯誤形狀／讀取拒絕會被既有讀取當成空清單；若後續寫入仍可用，舊初始化遷移會寫回 []。新方案必須將失敗與空資料分開。
- 同 ID、相同筆數但不同原文合併時，現行函式顯示本機版本，筆數條件不會偵測內容差異。此處量測純合併函式；沒有宣稱完成實際 hook／登入競爭或 Firestore 驗收。
- hook／Firestore 目前以來源 hash 固定；離線 outbox、UID／epoch、部分成功與重試的執行驗收仍屬 C。

**新發現的 ZIP Unicode 缺口：**131 筆合成大文字的 ZIP 保留 131 份 Markdown 與 manifest；逐張 Markdown 文字相符，但 saved-cards-backup.json 中第 111 張卡片的一個 🧪 變成兩個 U+FFFD。原輸入未變。Node 22 與 Node 25 觀測一致，另以 Python 標準 ZIP／UTF-8 解碼確認不是單一讀取器誤差。已安裝 JSZip 3.10.1 的 DataWorker 將字串按 16,384 UTF-16 code units 分段，Utf8EncodeWorker 各段編碼；該 surrogate pair 恰跨分段。這是現行匯出缺口，不是本批工具改動產品造成。

[archive-baseline.json](../reports/saved-cards-persistence-a-2026-11-01/archive-baseline.json) 封存錯誤位置、預期／實際 hash，狀態為 known-current-defect-not-v1-pass。A 僅建立證據；不得宣稱全部 ZIP 原文驗收通過，也不自動擴大本批修復。正式切換前，須在另行授權的下載／恢復包處理中消除此缺口，才可通過 SC-P13／SC-P14；不影響本批 A 的現況盤點驗收。

## 6. 驗收與重跑

在專案根目錄使用 Node 22：

```sh
node --test scripts/tests/saved-cards-persistence-a.test.mjs
node scripts/check_saved_cards_persistence_a.mjs --check
node --test webapp/src/features/saved-cards/localRepository.test.js webapp/src/features/saved-cards/cardCodec.test.js webapp/src/features/saved-cards/savedCardBackup.test.js webapp/src/features/saved-cards/savedCardArchive.test.js webapp/src/features/saved-cards/page1MarkdownSnapshot.test.js webapp/src/features/saved-cards/savedCardsDownloadHistory.test.js webapp/src/lib/savedCardsMigration.test.js webapp/src/lib/favoriteAuthState.test.js
```

本批結果與執行環境見[驗收報告](../reports/saved-cards-persistence-a-2026-11-01/README.md)。十九項工具／現況測試與七十六項既有相容測試通過；未修改產品程式，未進行正式遷移、瀏覽器、Firestore Emulator 或付費生成。瀏覽器／交易／離線等 SC-P 驗收留在其負責階段，不以合成資料測試冒充真實持久化完成。
