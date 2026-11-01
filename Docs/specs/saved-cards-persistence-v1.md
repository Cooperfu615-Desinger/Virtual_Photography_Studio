# Saved Cards 持久化 v1

日期：2026-11-01。版本：1.0（A 階段基準已建立）。程式基準：main 60c46d39ef0524c9b641c771e6319fb5d4b2e091。

狀態：A 的隔離資料、契約與基準已獲使用者驗收，並以 main eef77871 提交推送；CI 與部署已通過。B～D 尚未開始，未切換保存來源或操作既有收藏。原始報告保留驗收當時的狀態。見 [A 階段附件](saved-cards-persistence-a-v1.md)及[驗收證據](../reports/saved-cards-persistence-a-2026-11-01/README.md)。資料庫與 DLL 前輪結案保持，見[結案與使用狀態](../decisions/2026-10-31-dll-usage-status.md)。

## 1. 目的與範圍

目標：收藏加入後有可確認的保存結果；容量不足、斷線或重新開啟時，不靠自動刪減舊收藏掩蓋失敗。保留目前同一瀏覽器共用收藏清單、既有登入方式、ID、Prompt 原文與匯出契約。

v1 採 IndexedDB 為本機正式來源，Firestore 為有權限帳號的同步副本；畫面為投影，下載為獨立備份。沒有收藏同步權限的使用者仍可本機使用。IndexedDB 不是無限容量，也不能抵抗使用者清除網站資料或所有裝置／磁碟故障。

包含：
- 本機保存 repository、啟動載入、舊資料遷移、失敗保護、多分頁協調。
- 與收藏保存直接相關的持久待同步佇列、刪除記錄、帳號綁定、同步狀態。
- 沿用現有視覺的簡潔常駐狀態與必要恢復操作；桌手機操作驗收。

不包含：資料庫內容／Prompt renderer 調整、PAGE2 舊匯入擴充、J12、P5b、DLL 任務、App Check、權限擴充、即時多人協作、收藏分類／搜尋改版、雲端全面備份服務、媒體檔案保存。單張 Markdown／ZIP 與 backup-only 還原能力不擴充。

本文件的狀態列、恢復入口及衝突處置為擬議契約；實作前須隨規格審閱確認，不把文字方案當成已核准的視覺改版。

## 2. 現況與來源

以下為上述 main 的程式分析，不是對私人收藏做過的實測。

| 位置 | 現況 | v1 要解決的問題 |
| --- | --- | --- |
| [localRepository.js](../../webapp/src/features/saved-cards/localRepository.js) | localStorage 的 vps.favorites，2,250,000 UTF-8 bytes 預算；超過時保存前段，QuotaExceeded 再逐筆減少 | 不再以部分清單覆寫完整收藏；122 不是固定筆數上限 |
| [useFavoritesWorkspace.js](../../webapp/src/features/saved-cards/useFavoritesWorkspace.js) | 先更新畫面，延後本機保存；雲端佇列只在記憶體；頁面離開再嘗試本機寫入 | 保存完成需有確認；離開事件不能是唯一保障；待同步操作跨重載保留 |
| [favoritesRepository.js](../../webapp/src/lib/favoritesRepository.js) | users/{uid}/favorites 每卡一文件，登入後 getDocs 合併，批次寫入 | 不用筆數推定內容一致；明確處理部分成功及帳號切換 |
| [cardCodec.js](../../webapp/src/features/saved-cards/cardCodec.js) | 現行寫入版本3，可讀2／3／4；有舊原始物件及 ID-only 路徑 | 保留可讀格式與原文，儲存容器升版不等於卡片升版 |
| [savedCardsMigration.js](../../webapp/src/lib/savedCardsMigration.js) | 舊 vps.prompts／vps.viewMode 於舊遷移成功後清除 | 新流程不得在保存／比對完成前呼叫舊清除邏輯 |
| [App.jsx](../../webapp/src/App.jsx)、[SavedCardsWorkspace.jsx](../../webapp/src/components/SavedCardsWorkspace.jsx) | 加入即顯示提示；toast 約1.8秒；Library 只顯示畫面／篩選筆數，雲端狀態在設定選單 | 短暫通知不取代可持續查看的保存狀態 |
| [firebase.js](../../webapp/src/lib/firebase.js)、[Firestore rules](../../firestore.rules) | 登入與收藏授權分開；收藏有 UID／email 限制 | 不把 DLL 登入成功視為收藏可同步，也不改部署中的權限規則 |

雲端合併同 ID 時目前以本機／畫面版本優先；v1 保留顯示優先，對雲端覆寫增加衝突保護。現行離線刪除、同筆數異內容、多分頁覆寫等是程式路徑風險，不宣稱使用者已發生資料遺失。

## 3. 不可違反的契約

1. 不裁切卡片、不截斷文字、不重新生成 Prompt、不換 ID／日期／來源／lineage，不以 catalog 正規化來完成儲存遷移。
2. 既有資料在讀取、解碼、遷移或寫入失敗時保持；失敗與合法空清單是不同狀態，不可把失敗當空資料寫回。
3. 本機寫入與相關同步意圖必須在同一交易提交。未提交時不得送出雲端操作，也不得顯示已保存。
4. 不以畫面筆數、請求已送出、SDK 本地快取或任一批成功代表全部同步完成。
5. 本機收藏仍是同 origin 的共用清單，不改為每帳號獨立資料庫。同步工作與雲端基準必須按 UID 隔離。
6. 載入、遷移或版本不相容期間，不執行舊的初始空清單自動保存或雲端合併寫回。
7. 任何未知來源、版本、欄位或衝突資料保留原始副本；不能用 filter(Boolean) 靜默丟棄後宣稱遷移完整。
8. 不能保證寫入失敗時的記憶體草稿跨關頁存活。失敗時明確提示「尚未保存，請先下載備份」，保留原持久資料，允許重試／下載；不得承諾已落盤。

## 4. 本機資料契約

使用新的 IndexedDB：vps_saved_cards，資料庫版本1。與 DLL 的圖片／影片資料庫分開；不共用名稱或修改其 schema。

| Object store／key | 必要資料 | 責任 |
| --- | --- | --- |
| cards／[generation,cardId] | 原始卡片 payload、payloadHash、localRevision、orderKey | 每張正式收藏；原有 ID 不變，維持既有新增／匯入顯示順序 |
| syncOutbox／opId | generation、targetUid 或 unbound、cardId、upsert/delete、payload 快照、revision、expectedRemoteHash、state、attempt、retryAt | 持久同步意圖；不從送出當下的畫面重新組裝 payload |
| syncBaselines／[generation,uid,cardId] | 最後確認的遠端內容 hash、存在狀態、已確認 revision | 同 ID 差異與回應遺失判定；不同 UID 不混用 |
| tombstones／[generation,cardId] | deleteRevision、原 payload／hash、刪除意圖與目標帳號 | 防止未完成刪除被雲端載入自動帶回；使用者明確重新加入同 ID 才建立較新版本 |
| snapshots／snapshotId | 舊 key 原始字串、UTF-8 SHA-256、來源／時間、衝突或無法解碼資料 | 不可變恢復來源；無效 JSON 也能原樣保存或下載 |
| meta／key | schemaVersion、activeGeneration、migration 狀態、來源 hashes、各 generation 的 revision、清單摘要、協調租約 | 啟動／遷移／多分頁一致性；不得與卡片 schema version 混淆 |

generation 是儲存容器世代，不是卡片 ID 或卡片版本。正式讀寫只使用 meta.activeGeneration；staging 世代保持隔離，未 ready 不得建立可送出的工作。outbox、基準與刪除記錄必須與其世代一致；跨世代切換只由遷移／恢復流程執行。

資料原文保護：
- 遷移先保存舊 key 原始字串及 hash；單卡 payload 保留既有版本與所有未知欄位，不經 serializeFavoritePrompt 重寫整批資料。
- 顯示可沿用既有 codec 產生獨立投影，但不得把投影反寫成遷移來源。新建立／使用者明確修改的卡片才走既有寫入格式，未修改欄位仍需保留。
- Hash 使用明確穩定的 JSON 物件 key 排序，陣列順序、字串空白與換行保持；只在雲端比較時排除已知傳輸欄位 cloudUpdatedAt，不任意忽略未知欄位。原始字串 hash 另存，不用正規化 hash 冒充原始 bytes。
- cardId 比照目前語意區分，不任意大小寫轉換、URL decode 或補發。重複同 ID 同內容只顯示一筆；異內容保存兩份來源快照並標記衝突，無法解碼者進恢復清單，不計為已成功還原。
- 新增／匯入、刪除／清空、順序與 outbox／tombstone 更新使用涵蓋所需 stores 的單一 readwrite 交易。批次匯入要全成或全不成，不以半批成功冒充整批完成。
- 成功依交易 complete，不依單一 request success。先提交再確認畫面結果；可短暫顯示待保存，但計數必須區分。
- DB 開啟失敗／不可用時進入受限模式，不自動退回會裁切的 localStorage 保存。既有可讀資料可檢視／下載；新增內容只可標示未保存，不送往雲端。

不承諾全機斷電時的硬體級持久性。Storage estimate／persist 能力只作輔助；估算不是剩餘筆數保證，持久儲存請求遭拒不能導致資料刪除。

## 5. 遷移、舊分頁與回退

### 5.1 首次載入順序

1. 先取得本 origin 的遷移協調權，啟動態為 loading／migrating；停用會變更收藏的操作，其他工作區可繼續使用。禁止先呼叫會寫入／刪舊 key 的 loadAndMigrateFavoritePrompts。
2. 判斷 localStorage「不存在」「合法空值」「格式損壞」「存取失敗」；讀取 vps.favorites、vps.prompts、vps.viewMode、vps.savedCardsMigration 的原始值，不刪除、不回寫。
3. 在快照交易保存原始值與 hashes。快照失敗就停止遷移，保留舊來源；提供原始 JSON 診斷備份下載，格式標明 backup-only，不作可匯入格式承諾。
4. 以原有相容規則解析到隔離記憶體，保存原 payload。ID-only 需對應舊來源；找不到時記 unresolved，不補猜內容。優先順序沿用 favorites 先於 legacy feed；同 ID 異內容另存衝突，不靜默捨棄。
5. 把候選 cards、順序、對應 metadata 寫入 staging generation；不得發送雲端同步。資料庫內已有 ready generation 時不得重新以舊 localStorage 蓋回。
6. 交易完成後讀回，核對 ID 集合、順序、有效資料 payload hashes、原始快照及 unresolved 數量；再確認 localStorage 來源 hashes 尚未變動。
7. 全部核對通過後，以新交易原子標記 activeGeneration／ready。任何衝突或 unresolved 必須顯示部分恢復／需處理狀態，不能稱完整遷移。其餘已確認卡片可唯讀預覽／下載，正式寫入與自動同步暫停至明確處置。恢復流程可修正解析或由使用者逐項選擇來源，但必須保留所有原始快照並重新讀回驗證；不能用略過未解項來自動判定完整。
8. ready 後由 IndexedDB 提供清單，才啟用編輯及雲端載入；已知帳號同步意圖依 §6 建立，不在遷移時直接上傳整份。
9. localStorage 僅新增一個輔助指標 vps.savedCardsPersistence，含版本、generation、原始來源 hashes；ready 的權威在 DB。指標寫入失敗不能重跑／重複匯入已完成遷移。
10. v1 不自動刪除舊 key 或快照，也不持續雙寫完整收藏。清理需另批決策。中斷重啟讀取 staged／ready 狀態，依原快照比對重跑未完成步驟，不能重送雲端。

只有真正「沒有任何來源」可初始化空庫；已有標記但 DB 遺失、讀取錯誤或來源損壞均為恢復情境，不能自動初始化成空收藏。

### 5.2 舊分頁與多分頁

- 新版本用同一 IndexedDB 的 revision／交易協調寫入；BroadcastChannel 通知其他分頁重新讀取提交結果，不能傳整份舊陣列覆蓋。無 BroadcastChannel 時在重新取得焦點／visibility 恢復時讀最新 revision。
- migration／versionchange／blocked 需有可見提示。更新 schema 時舊連線收到 versionchange 後關閉，等待未完成交易安全結束；不能清除 DB 來解鎖。
- Web Locks 可用時協調遷移與同步；不可用時以 IndexedDB 租約／owner／期限及 fencing token 協調。失效 owner 的回應不得確認較新的工作。
- 已載入的舊版程式不會遵守新鎖或標記。切換前要確認既有使用分頁已完成保存／備份，再關閉舊版寫入入口；不能要求未保存原分頁直接 reload。
- ready 後偵測舊 key hashes 改變，進入 legacy-diverged：保留差異快照，暫停該 Library 的自動合併／雲端送出，提示關閉舊版分頁並檢視差異；不自動覆蓋 IndexedDB，也不忽略新出現的舊來源資料。
- 新機制不能阻止其他裝置的未知舊版直接改寫雲端。只承諾受控的新客戶端協調；此限制必須出現在交付紀錄。

### 5.3 回退與恢復

- 遷移尚未 ready：舊資料未改，可停止切換；若快照存在仍保留。
- 已 ready 且有新寫入：禁止直接以舊程式讀取未更新的 vps.favorites 作回退，否則新資料不可見且可能錯誤同步。
- 回退版本必須能讀 v1 DB，或在受控維護流程輸出「完整當前收藏＋待同步操作＋刪除／衝突記錄」後逐項核對；不得以截斷的 localStorage 作完整回退來源。
- 輸出恢復包不是增加產品 Import 功能；實際還原工具、責任人與回退演練須在正式切換前具體完成。不可把「已有 backup」等同「已可回退」。
- 舊備份的存在／保留不代表雲端資料會自動回復。取消部署、回退程式與回退資料分開處理；不自動重放舊 outbox。

## 6. 雲端同步契約

### 6.1 本機範圍與帳號

- 維持本機共用 Library。Firestore 路徑 users/{uid}/favorites/{encodeURIComponent(id)}、現有卡片 payload 與權限不改；不藉本批擴大允許帳號。
- 記錄有收藏授權的登入 UID 及 authEpoch。每個送出工作捕捉 targetUid／epoch；帳號改變立即停止新送出，舊回應不得改新帳號狀態。已送往 A 的請求可能仍完成於 A；不承諾登出能取消伺服器交易，其結果只可確認 A 的對應操作，不可標記 B 已同步。
- 登出不清空本機收藏、不丟棄已綁定 UID 的 outbox。原帳號登入後才恢復；不能把 A 的操作改綁 B。
- 未登入建立的操作標為 unbound。首次有收藏授權帳號載入成功後，沿用既有本機／雲端合併意圖，才將尚未綁定的新資料綁定該 UID；無權限登入不綁定。
- 已從某 UID 載入／確認過的卡片與其待同步操作，不因換帳號自動複製到另一 UID；保留本機可見性。跨帳號搬移不屬 v1。目前僅一個收藏授權帳號的既有使用不因此增加操作步驟。
- 登出後刪除曾與 A 同步的卡片，保留指向 A 的刪除意圖；刪除從未同步的本機卡片不產生對任意未來帳號的雲端刪除。

### 6.2 送出與確認

1. 每個本機 mutation 取得單調 revision 及 opId；卡片、刪除記錄與 outbox 同交易完成。新意圖在前一筆已送出時不可取代其回應識別。
2. 同 UID 由單一 sender 依順序送出，離線／權限不足時停留待同步；已有 UID 的資料不得因登出丟掉。啟動、恢復連線、取得焦點及使用者重試可排程。
3. 短暫網路錯誤採有上限退避（例如1、2、4、8、16、30秒，每輪最多6次），到上限顯示可重試，不無限循環。權限、格式、單筆尺寸或內容衝突停止該項並保留原因，不靠縮短卡片解決。
4. 僅對目標卡片使用 Firestore transaction 比較遠端內容與 expectedRemoteHash，再寫入／刪除。離線不能執行交易時留在本機待同步，不繞過比較。大批拆分，逐操作確認，不假稱整批原子雲端提交。
5. 同 ID 遠端已等於欲寫入 payload，或欲刪除者已不存在，可視為重試已達成；回應遺失後先讀回確認，不盲目覆寫。比較忽略已知 cloudUpdatedAt，但保留其他欄位；同一操作使用固定寫入內容／時間。
6. 遠端異於已知基準且異於目標內容時，保存遠端與本機版本、標記 conflict；停止該 ID 自動覆寫，其餘無衝突項可繼續。不用筆數或客戶端時間判勝負。
7. 新卡無遠端基準時讀到遠端不存在才建立；同 ID 異內容轉 conflict。歷史初次合併相同內容只更新基準，不重寫全庫；本機優先顯示不等於授權覆寫不同雲端內容。
8. 遠端確認後，將該 op 的 ack、syncBaseline 與 outbox 狀態原子更新。較舊 op 成功只確認自己，不清除較新 mutation；本機 ack 失敗時下次用內容比對恢復。
9. 只有當目前 UID 的待送／在途／衝突皆為零、initial load 完成且該 UID 所有應同步的 revision 已確認時，才顯示雲端同步完成。unbound 或其他 UID 的操作另計，不把它們算入目前帳號的已同步內容。這只表示截至該次同步、屬於目前 UID 的本機操作已確認，不宣稱其他裝置即時一致。

若本機有 conflict，保留兩份內容，擬提供「保留本機版本／使用雲端版本」的明確處置；確認時需帶入使用者看到的 revision／遠端 hash，再查一次，若已變動則重新提示。未確認前不選邊、不刪原文；保留本機版本也需建立新的明確操作。此最小衝突處置與常駐提示須於實作前一併審閱。

### 6.3 刪除、清空與載入競爭

- 刪除先寫 tombstone 與 outbox，同交易移除可見卡片；舊雲端載入不能覆蓋 tombstone。刪除送達後仍保留足以識別舊載入結果的 revision／基準，不能立即丟掉防重現資訊。
- Clear Favorites 沿用確認操作，但雲端刪除集合固定為使用者確認時本機清單內、屬於目前授權 UID 的卡片 ID／基準。未載入完成時停用清空；不再在延後重試時重新列出雲端所有卡片一起刪。
- 清空與其後新加入分成不同 revision，後加入的卡不在舊清空集合；分批雲端失敗保留未完成刪除，不把「部分清空」顯示成全部已同步。
- 雲端載入捕捉 loadEpoch／authEpoch，回來後以當下最新本機交易狀態合併，不覆蓋請求期間的新增、刪除、清空或修改。舊 epoch 回應丟棄其投影，不能初始化其他帳號。
- 不以 merged.length > cloud.length 判斷是否同步。遠端缺少曾確認卡片時不自動復活雲端資料；保留本機副本並標記需確認。v1 不提供完整跨裝置刪除傳播或歷史衝突自動解決。

## 7. 狀態與操作提示

沿用現有版型；在 Library 的既有統計／工具列附近增加簡短狀態，不改導航、主操作排序或卡片版面。具體排版在實作前確認。

| 狀態 | 使用者文字方向 | 行為 |
| --- | --- | --- |
| loading／migrating | 正在讀取／轉移收藏，請稍候 | 保護變更操作；不顯示零筆已保存 |
| ready，無待保存 | 本機已保存 N 筆 | N 只計可見且交易已完成的卡片 |
| local saving | 正在保存；尚有 N 筆變更 | 待完成前不說已保存 |
| local error | 尚有變更未保存，請先下載備份或重試 | 常駐，保留上次完整資料與本次記憶體內容 |
| cloud pending／offline | 本機已保存，待同步 N 項操作 | 操作數不同於卡片數，避免誤導 |
| cloud syncing | 正在同步 | 本機狀態仍獨立可見 |
| cloud synced | 雲端同步完成：目前帳號 | 依 §6.2 條件，不能只因登入或讀取成功就顯示 |
| cloud error／conflict | 本機已保存，部分同步待處理 | 僅在本機確實成功時使用「已保存」；提供重試／檢視差異 |
| unavailable／legacy-diverged | 收藏保存暫停，請保留此頁並檢視備份／舊分頁 | 不降級成裁切寫入，不誤報空庫 |

原 Favorites／Current View 筆數保留原意；新增狀態不把它們改成雲端筆數。Toast 只補充通知。加入提示在本機交易完成後才用「已保存」；失敗的樂觀顯示需清楚標記。登出／不具收藏權限時顯示僅本機，不影響 DLL 登入狀態。

Download 保留當前篩選語意與既有 Markdown／ZIP 行為；未保存內容仍可下載。原始診斷備份另外命名、明示不能直接匯入，不冒充正常卡片匯出，也不重新生成 Prompt。

## 8. 分階段實作與切換順序

| 階段 | 範圍 | 完成條件 |
| --- | --- | --- |
| A 契約與隔離基準 | 建立本文案例／舊格式 fixtures、唯讀快照與 payload 比對工具 | 現行問題有可重現的合成案例；歷史基準不重錄 |
| B 本機 repository 與遷移 | IndexedDB、交易、載入／失敗、多分頁、恢復包與遷移演練 | 隔離資料完整往返；中斷／容量失敗保留原來源；尚不正式切換 |
| C 同步與狀態整合 | durable outbox、UID／epoch、刪除／清空、衝突、狀態列 | Emulator／故障注入與桌手機驗收通過 |
| D 完整驗收與受控發布 | 相容／歷史回放、原文比對、舊端停止寫入與回退演練 | 獲實作驗收及發布授權後才切換正式版本；私人資料操作另須明確範圍 |

階段可分批審閱，但 B 未整合 C 前不對正式使用者啟用新來源。不可先在正式站刪舊 key，再補遷移。2026-11-01 後續授權僅涵蓋 A 的隔離測試資料、相容契約與基準；B～D 程式實作及正式資料遷移仍未授權。

## 9. 驗收案例與證據

全部使用合成／去識別 fixtures、隔離瀏覽器 profile、測試 origin 與 Firebase Emulator。不得清除、匯入、刪除或改寫使用者實際收藏；不呼叫生成服務。真實登入／雲端私人資料的驗收須另定範圍，不能以本機模擬冒充。

| ID | 情境 | 必須證明 |
| --- | --- | --- |
| SC-P01 | 131張且序列化超過2,250,000 bytes；另500／1,000張與特大單卡 | 全部持久保存後重開內容／ID／順序一致；無截斷。1,000僅測試規模，不是產品筆數上限 |
| SC-P02 | 中文、換行、特殊字元、所有現行來源與歷史衍生輸出、版本2／3／4、未知欄位 | 原 payload／Prompt 逐欄 hash 一致；不因目前 renderer 改寫舊原文 |
| SC-P03 | ID-only＋legacy feed、重複ID、異內容、壞JSON、未知版本／缺欄位 | 原字串快照完整；有效與未解項可對帳；未解不冒充遷移成功 |
| SC-P04 | 快照／staging／讀回／ready／輔助指標各步中斷後重跑 | 不重複、不漏卡；舊 key 不刪；不送雲端；ready權威唯一 |
| SC-P05 | 容量不足、IDB denied／abort／blocked、讀取失敗、persist拒絕 | 失敗不寫空、不刪舊卡、不假稱已保存；原始備份與重試可用 |
| SC-P06 | 新增後立即關閉；大量匯入交易中斷 | 已確認成功者重開存在；未完成者不曾顯示成功；批次全成或全不成 |
| SC-P07 | 離線新增／刪除／清空，重開再連線 | outbox／tombstone仍在；刪除不被舊載入帶回；清空不刪之後新增 |
| SC-P08 | 送出成功但回應／本機ack遺失、部分批次成功、超大雲端單卡拒絕 | 逐項重試可收斂；不重送較新內容、不清除未完成操作；本機原文保留 |
| SC-P09 | 同ID同筆數異內容、遠端已改／已刪、初次合併衝突 | 不以筆數判一致；保存雙方，明確處置且防二次競爭 |
| SC-P10 | 雲端載入中新增／刪除／清空，慢回應到達 | 新操作不被覆蓋；載入不能清空outbox或錯報同步完成 |
| SC-P11 | 登出／無權限／A切B／A重新登入／舊epoch回應 | A工作不送B；unbound綁定正確；本機清單保持；不擴權 |
| SC-P12 | 兩個新版分頁新增／刪除／租約逾期，舊版改localStorage | 新分頁不互蓋；stale ack無效；舊來源差異觸發保護，記錄跨舊端限制 |
| SC-P13 | 既有單張／ZIP、131筆混合未知ID備份、篩選下載 | 沿用既有匯出契約，備份不當成可匯入快照；不擴充PAGE2舊匯入 |
| SC-P14 | 切換前後回退演練，含新卡、待刪、待同步及衝突 | 回退可讀完整新來源；不以舊localStorage復活或遺漏資料；不自動重放任務 |
| SC-P15 | 桌面1440×1000、手機390×900、保存／錯誤／同步／衝突狀態 | 訊息與實際持久資料一致；無裁切／橫向溢出／新console錯誤；既有操作維持 |

實作完成閘門：
- 聚焦 repository、migration、outbox、帳號／合併競爭、codec、archive 測試，新增 hook／整合案例覆蓋實際呼叫順序；不能只測純函式。
- 前端 npm test、lint、build；因涉及保存／還原相容，執行 test:prompt-quality、相同count／seed的 audit:prompts:strict 及受影響歷史回放。輸出／選值沒有授權變更，前後應一致。
- 依[前端驗收規範](frontend-visual-validation.md)檢查現行六工作區：Prompt、角色、場景、DLL_PIC、DLL_VIDEO、Saved Cards；使用模擬與隔離資料，不付費生成。
- Firebase Emulator 驗證既有規則及上述交易語意；不部署 rules、不更改正式帳號權限。若需改 Functions／規則才能達成，先提出必要差異，不擅自併入。
- 報告記錄基準 SHA、fixture hashes、逐例結果、遷移／回退證據、瀏覽器視窗及限制；不覆寫 A～E、Phase 4、C 類或既有下載歷史基準。

## 10. 規格制定批次與後續實作檔案範圍

最初規格制定批次只新增本規格及[決策](../decisions/2026-11-01-saved-cards-persistence-v1.md)，在[專案狀態](../current_project_state.md)加入「規格已制定、尚未實作」入口；不改現行可執行契約或既有驗收報告。

未來預期涉及 saved-cards 的 localRepository／useFavoritesWorkspace、新增 IndexedDB／outbox／migration 模組、favoritesRepository、App 的保存回呼及 SavedCardsWorkspace 的狀態區。cardCodec 僅作相容檢查，非藉此改寫內容；具體 allowlist 在實作前以最新 main 重列。測試若需要輔助套件需限定範圍，不順便升級依賴。

文件驗收：來源／相容契約對照、所有相對連結、階段與案例完整性、git diff --check、範圍及原文件 bytes 保護。文件通過不等於 SC-P01～15 的產品驗收通過。

## 11. 技術依據

- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)：支援結構化資料與交易式存取；本規格選用本機逐筆保存。
- [MDN 儲存容量與清理](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)：容量、拒絕與清理政策取決於瀏覽器，持久性不是無限容量保證。
- [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)：讀後寫可在競爭時重試，離線交易失敗；本規格把離線意圖留在本機，交易函式內不執行外部副作用。

以上是技術選型依據；具體資料結構、狀態、遷移與衝突規則是本專案 v1 提案，不宣稱由外部文件自動決定。

## 12. A 階段承接（2026-11-01）

A 已建立 12 筆格式、14 組儲存情境、4 個容量配方、15 組後續驗收輸入及固定現況基準；十九項工具測試、七十六項既有相容測試通過。相容細節、重跑方式與限制見 [A 附件](saved-cards-persistence-a-v1.md)。SC-P01～15 的產品驗收尚未執行，不能以 A 通過代替新保存流程驗收。

新基準另捕捉大型 ZIP 的 Unicode 分段缺口；A 僅保留現況證據，未修復產品。正式切換前必須在另行授權範圍消除此缺口，再通過 SC-P13／SC-P14。B、C、D 尚未開始；沒有新增 UI 或修改正式資料。
