# C5 用途清單與文件修正 v1

> 2026-10-31 整體收尾核對：C5 本輪核准範圍已交付，最後一批 `0cf5d765` 的 [CI／部署](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/41143341288) 四作業成功。現行處置、保留理由與驗收限制見 [C 類結案總表](c-class-closeout-v1.md)。下文保留該批原規格及當時狀態；「未提交／未開始」等歷史文字由總表接續，不改原契約或驗收證據。

日期：2026-10-31。基準為本地及遠端 main `e5f8fd4b30bbf686a5644cebdede16c6b80227aa`。本批為文件整理，使用者已驗收通過並授權限定commit／push；CI與部署於交付時核對。

## 授權與完成界線

使用者授權整理四項用途及保留理由、修正README過期描述，明確要求「艾爾莎隨機選取先維持現況」。本批完成用途文件，不宣稱已修復隨機可達性、完成全儲存庫死碼清理或驗證所有外部使用者。

資料、程式、公開Prompt、ID、alias、metadata、順序、隨機權重、UI、收藏與歷史基準全部保持。沒有新增Negative功能、自訂library管理UI、遷移或刪除。PAGE2舊匯入、J12、P5b繼續暫緩，其他C類不併入。

## 四項用途與處置清單

| 項目 | 現行用途／可達性 | 保留理由 | 本批處置 |
| --- | --- | --- | --- |
| 艾爾莎・布萊達攝影風格 | 一般PAGE1隨機風格篩選對154筆非全無場景皆不符；全無場景不被此條件排除；手動鎖值仍有效，場景建模亦提供風格選項 | 仍有手動與其他入口的用途；更動隨機條件會改變組合行為 | 保留原ID、文字、標記與篩選；不修正、不移除、不調權重 |
| 七類舊bias條件 | 預設26筆風格無對應標記；自訂完整資料庫傳入標記時，條件可實際影響篩選 | 預設資料未使用不等於所有介面不可達 | 保留條件並說明適用範圍，不增加正式風格標記 |
| Negative分區19筆 | webapp有編譯，無對應control或renderer消費者；舊Python生成器另有讀取流程 | 受ID及歷史快照保護，也有舊工具用途 | 保留來源及編譯行為，不宣稱正式UI具動態Negative功能 |
| 自訂library及相關介面 | 正式PAGE1固定空清單；資料庫物件／快照／編譯介面供工具及測試使用，陣列追加路徑也仍能運作 | 工具及歷史回放相容責任存在，不能因UI無入口整段刪除 | 保留底層介面與快取契約，修正README的管理UI及localStorage宣稱 |

## 1. 艾爾莎風格：記錄限制，維持現況

永久ID：`regional:攝影風格:艾爾莎-布萊達-霓虹低光孤寂:25`。有效tags為`neon`、`artificial_light`、`night_bias`、`moody`。

[engine.js](../../webapp/src/lib/engine.js) 的 `styleFitsLocation` 對 `night_bias` 要求場景具有 `night`／`underground`／`club` 至少一項；現行非全無場景沒有這些標記。一般PAGE1先挑場景再挑風格，而 `pickWithLock` 隨機優先非全無，因此不能將「手動可用」推論成「一般隨機可達」。明確鎖定style會先返回指定項目，不受同一路隨機predicate排除；全無場景則直接放行。以固定random=0.42在記憶體生成，selection保留原ID且GPT包含Elsa Bleda。

[page3WorldScene.js](../../webapp/src/lib/page3WorldScene.js) 的 `PHOTOGRAPHER_STYLE_OPTIONS` 讀取 `getPhotographyStyleOptions()`。本項限制只描述一般PAGE1隨機場景／風格配對，不擴大為所有工作區或所有模式都不可用。

使用者決定本批保持現況。若未來要調整，另行決定夜景資格由場景、環境光或兩者共同判定；需獨立規格與固定seed回歸，不能在文件整理時移除條件或補場景tags。

## 2. 七類bias：保留自訂資料庫篩選語意

現行26筆預設風格均沒有下表標記。下表以記憶體完整資料庫副本，在同一風格的 `meta.semantic.tags` 放入單一標記，經正式 `getCompiledCatalogForTesting` 編譯，再執行從目前原碼讀取的 `styleFitsLocation`；不是宣告正式目錄新增這些tags，也不是已知外部使用量統計。

| 標記 | 自訂標記保留 | 154筆非全無場景符合／不符 |
| --- | --- | --- |
| studio_bias | 是 | 14／140 |
| set_bias | 是 | 14／140 |
| indoor_bias | 是 | 84／70 |
| urban_bias | 是 | 59／95 |
| natural_bias | 是 | 69／85 |
| heritage_bias | 是 | 32／122 |
| outdoor_bias | 是 | 82／72 |

這是七類標記，不是宣稱恰好七條if敘述；studio／set另有共用排除條件。`night_bias`為艾爾莎實際使用的標記，不包含在這七類中。原歷史報告的「永遠不觸發」不能作為目前刪除依據，正式資料及自訂介面必須分開判定。

## 3. Negative：保留資料與工具相容

[目錄架構v1.1](catalog-data-architecture-v1.md) 的I2及目錄快照包含Negative 19筆，即使沒有control也需保護ID；[目錄流程](../../knowledge_base/catalog/README.md)要求保留`conflictTags`／`useTags`語意。

`buildCatalog`仍建立`catalog.negative`；現行control含0筆`negative:`選項，正式webapp renderer未找到讀取此分區的呼叫。`actionPoseLab.js`的Negative Guard文字與此分區不同，不應因名稱相似誤判它已接入。

[prompt_generator.py](../../scripts/prompt_generator.py)的`build_prompt`會讀取`negative_prompts.md`；這是獨立舊Python流程，不能當作現行webapp功能，也不推定使用者目前仍在執行。其`load_dictionary`解析器被[目錄準備](../../scripts/catalog_prepare.py)及[歷史Markdown驗證](../../scripts/validate_catalog_markdown.py)使用；[切換驗證入口](../../scripts/validate_catalog_cutover.mjs)仍引用後者。整份舊工具不能概括為無消費者。

本批不移除分類、停止編譯、退役ID或接入MJ負向參數；若未來有退役／新功能需求，需另行授權與相容計畫。

## 4. 自訂library：UI、工具與兩種輸入分開

[usePromptWorkspace.js](../../webapp/src/features/page1/usePromptWorkspace.js)固定`activeLibrary = EMPTY_LIBRARY`，沒有正式PAGE1自訂library編輯與儲存入口。本批不刪除任何瀏覽器儲存鍵或歷史使用者資料。

| 介面 | 現行責任／限制 | 處置 |
| --- | --- | --- |
| 非空陣列overlay | 複製預設資料後追加，只取group/category及zh/en/desc；傳入stableId與完整meta不會照原樣保存 | 保留舊行為，不作正式catalog作者入口 |
| 完整database物件 | 複製傳入資料庫，供工具／測試使用其結構；不要與陣列追加混稱 | 保留 |
| getKnowledgeBaseSnapshot | 提供資料庫快照，現行測試／驗收工具有消費者 | 保留 |
| getCompiledCatalogForTesting | 明確測試／工具匯出，直接編譯並繞過共用快取 | 保留 |
| getKnowledgeBaseOptions | 本輪儲存庫呼叫搜尋只有定義，未見呼叫者；不代表已查明所有外部呼叫 | 列為未使用匯出候選，本批不刪除 |

快取維持[架構契約](engine-architecture.md)：預設深度凍結runtime共用；一般非空自訂陣列／物件每次編譯；明確登記的immutable歷史library才使用專用快取。現有[主體光源相容測試](../../webapp/src/lib/engineSubjectKeyLightCompatibility.test.js)使用資料庫副本檢查未核准來源不被放行；歷史helper亦有用途。本批不把「缺少正式UI」誤寫成「整套介面無作用」。

## README修正與歷史追溯

- 移除現行UI具自訂library管理／localStorage儲存流程，以及從Negative目錄動態輸出的宣稱，補工具相容說明。
- 對齊正式來源為catalog JSON；六份Markdown、database.json及legacyMappings.json為八份生成物，sync前須選定可信完整REGISTRY_BASE_COMMIT。
- 將自訂runtime說明對齊既有快取契約，不新增功能或修改操作命令的行為。
- [原始分析報告](../reports/database-analysis-2026-10-11/README.md)及所有歷史報告保持原文；本規格是基於目前main的後續判定，不覆寫歷史證據。
- C3既有隱藏姿勢、退役外套、舊ID與其他相容項目不因C5名稱而列為可刪；相關工作範圍維持。

## 驗收與後續

文件驗收核對四項來源、數量及使用者決策；檢查新文件與README連結、相對路徑、Git差異與所有原檔案指紋。唯一修改範圍為README、current_project_state、本規格、決策與本批驗收報告。

沒有產品或可執行契約變更，依AGENTS文件矩陣不跑產品測試套件、sync寫入、build、瀏覽器或生圖。記憶體探查不是完整產品驗收；先前瀏覽器原生下拉及影像品質限制保留。上述為提交前文件驗收，CI與部署結果於授權交付後另行核對。

本批完成四項用途與保留文件；艾爾莎保持現況，未使用匯出只記錄候選，沒有待執行的刪除或隨機修正。是否另開C5行為批次須新授權。PAGE2舊匯入、J12與P5b繼續暫緩。

[決策紀錄](../decisions/2026-10-31-c5-usage-retention.md) · [文件驗收](../reports/c5-usage-retention-2026-10-31/README.md)
