# C5 用途清單與文件修正驗收

日期：2026-10-31。基準main `e5f8fd4b30bbf686a5644cebdede16c6b80227aa`。文件檢查及使用者驗收均通過，已授權本批限定commit／push。以下保留提交前文件驗收紀錄，CI與部署於交付時另行核對。

## 範圍

僅修改五份文件：README、[目前狀態](../../current_project_state.md)、[用途清單與規格](../../specs/c5-usage-retention-v1.md)、[決策紀錄](../../decisions/2026-10-31-c5-usage-retention.md)及本報告。保留四項資料／程式現況，不修艾爾莎隨機可達性、不新增Negative或自訂管理UI。

## 本批實際核對

1. Git：本地與遠端main均為上述基準；差異限定五份Markdown文件，暫存區為空，`git diff --check`通過。
2. 來源與文件：核對`styleFitsLocation`、`pickWithLock`、`mergeCustomLibrary`、`buildCatalog`、PAGE1的EMPTY_LIBRARY、PAGE3風格選項，以及catalog架構／runtime契約。README不再宣稱正式UI具自訂library管理與動態Negative來源，JSON主來源與八生成物說明一致。
3. 記憶體唯讀探查（Node 22，未寫入專案檔案）：正式catalog編譯後有26筆風格、154筆非全無場景、Negative 19筆，controls中0筆negative選項。直接取當前原碼的風格predicate對154筆場景窮舉，艾爾莎符合0筆；全無場景可通過此條件。以`random=()=>0.42`明確鎖定艾爾莎生成一筆，selection保留原ID，GPT含Elsa Bleda。這是固定亂數來源的單案例，不冒稱完整隨機分布或生圖驗收。
4. 七類bias：在完整資料庫的記憶體副本，為同一風格逐次指定單一semantic tag，經正式compiler後標記均保留；對154筆場景的符合／不符數依序為studio 14/140、set 14/140、indoor 84/70、urban 59/95、natural 69/85、heritage 32/122、outdoor 82/72。26筆預設風格對七類的生產者數皆0；此探查不改schema或正式tags。
5. 陣列overlay：記憶體追加測試可建立文字選項，但傳入stableId與semantic標記未按原樣保留，與目前只追加zh/en/desc的來源一致。探查前後預設`getKnowledgeBaseSnapshot()`內容完全相同。
6. 呼叫追溯：`getKnowledgeBaseOptions`在程式搜尋僅定義；`getKnowledgeBaseSnapshot`與完整資料庫傳入在現行測試有使用。`catalog_prepare.py`與`validate_catalog_markdown.py`呼叫`prompt_generator.load_dictionary`，不能整份刪除舊工具。沒有據此宣稱知道外部程式的使用情況。
7. 文件相對連結與引用程式路徑核對通過；既有歷史報告不作任何改寫。下列保護數量由修改前後SHA256比較取得。

## 檔案與其他工作區保護

- 除本批README與current_project_state外，4431份原受Git追蹤檔案逐位元一致，包含2780份既有歷史報告檔。catalog、生成物、registry、engine、測試、CI、歷史基準皆保持。
- 其他20個現存工作目錄的Git狀態與140份未提交檔案指紋保持；另1個已登記但不存在的工作目錄未清理。
- 原始分析報告保留當時結論；本規格以新判定銜接，不將舊結論改寫為當時已知。

## 驗收限制與後續

本批只改文件且不變更可執行契約，依AGENTS文件矩陣未執行產品測試套件、完整歷史回放、sync寫入、lint、build、瀏覽器或生圖；沒有新增CI／部署結果。前批C2的CI成功屬前批交付，不能當成本批驗收。

先前[場景／光學驗收](../c2-scene-optics-2026-10-30/README.md)的原生下拉操作限制、程式化change fallback及未做影像品質驗證仍保留。本批來源及記憶體核對不替代瀏覽器互動或模型影像驗收。

艾爾莎隨機選取保持現況；未使用匯出只記錄候選，不刪除。未開始其他C類，PAGE2舊匯入、J12、P5b繼續暫緩。
