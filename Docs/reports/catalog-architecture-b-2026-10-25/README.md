# 目錄資料架構 v1.1：B 階段驗收報告

2026-10-25（Asia/Taipei）。**B 的完整性檢查、schema／欄位映射、歷史 ID 驗證器與隔離遷移演練已完成，本機驗收通過，待 Cooper 審閱。正式資料來源仍是 Markdown；未 stage、commit、push、部署，未進入 C 或 P5b。**

本輪以最新 `main` `548a5c402b025e243bda16c873527dca6c95b75d` 為來源，完成時再次唯讀核對 GitHub main 相同。工作目錄為現有 main worktree；原專案及其他工作目錄的 140 份未提交檔案／備份逐檔 SHA-256 未變。原 A、躺姿補充、全身匯入 revision 與三份目錄快照完整保留，沒有重錄預期值。詳見 [保護證據](preservation.json) 與 [機器驗收摘要](validation.json)。

## 已完成內容

| 範圍 | 交付與效果 |
| --- | --- |
| 完整性檢查 | 正式 `scripts/check_catalog_integrity.mjs` 延伸原分析器；歷史分析器原位保留。未豁免 confirmed、過期例外、解析失敗皆會非零退出；possible 仍為診斷。實際 control 檢查跨分類別名及主 ID 遮蔽，不改舊命中順序。 |
| 內嵌目錄 | 五方角色 ID 各 33 筆一致；必填結構及四個身份錨點、Pose Composer／指定動作／雙人／固定場景命名空間、子句、頭部／視線、支撐、群組、裁切及巢狀引用、overlay key／原文 pin 都納入檢查。 |
| Schema／映射 | `knowledge_base/catalog/schema.json` 涵蓋 6 分區、56 分類；Python validator 支援規格指定的 8 個關鍵字，無新增依賴。`field_mapping.json` 保存 22 頂層欄位及 67 個含巢狀路徑的責任、分類、覆蓋順序與條件；驗證實際 runtime 保留值，含全部 47 筆 lyingSurface。 |
| 歷史 ID | Python 驗證器要求 A 初始集合或外部選定的歷史 Git object；攔截資料與登記一起刪除、歷史 ID 重用／別名占用、不可變來源改寫、非法狀態、復活、替代循環／懸空與不可取得基準。歷史讀取測試在自動清除的暫存測試倉庫建立 Git fixtures，沒有提交專案。 |
| 隔離演練 | 明確指定來源完整 SHA 與 repo 外新目錄。全部成功才發布輸出；中途失敗清理自己的 staging，既有或競爭出現的目錄不覆寫。schema、索引、分類檔與雙 parser 測試均已覆蓋。 |
| CI 接線 | webapp-quality 取得完整歷史；`npm ci` 後、既有 frontend test 前加入 strict gate、工具測試及 `$RUNNER_TEMP` 演練；Python discovery 自動納入新增測試。本批未推送，遠端 CI 尚未執行。 |

操作與邊界見 [catalog README](../../../knowledge_base/catalog/README.md)。修改範圍見 [檔案允許清單](delivery-allowlist.json)；不代表本輪已授權 Git 交付。

## 演練結果

[演練證據](rehearsal.json) 保存來源 commit、原始 A commit、受保護來源雜湊及輸出位置。初始 frozen 清單來自 A 的 Git object `0746b280cc9f5c00daec7dadc73329779ac658e9`，並核對 sealed A catalog，沒有用同批轉換結果自行聲稱為歷史。

- 1,050 筆完整轉換，56 個分類；初始 registry 1,050 筆，全為既有 frozen ID。
- Regional 26 筆拆出 inspiration 再組回，順序、文字及分隔保持；圖片欄位仍由 manifest 衍生。
- 只剝除 `stableId`／`legacyIds` 後，生成 database 與正式 database 逐位元組一致。另獨立比較完整 compiled entries／catalog 及 final controls，ID、別名、meta、順序零差異。
- 六份 Markdown 在 repo 外重建，兩個現用 parser 共 12 組 round-trip 全相同。正式六份 Markdown、metadata、database.json 及 runtime 檔案雜湊未變。
- 分類 JSON、index、id_registry、生成 Markdown 全部只存在於 repo 外演練目錄。正式 sync 未切換，未刪 metadata，未建立正式 registry。

## I1–I9 驗收

| 不變量 | 本輪結果與證據 |
| --- | --- |
| I1–I3：control／ID／alias／meta | 219 controls／4,771 options，三份快照零差異；A 封印有效：[seals](a-seal.txt)、[完整測試](full-tests.txt)。 |
| I4：完整輸出 | 完整測試自動重播原核心 2,540、躺姿補充 341、匯入補充 370，共 3,251 筆／2,851 個不同案例，輸出、selection、summary、structured 與下游資料零差異；[Prompt Quality](prompt-quality.txt) 754/754。 |
| I5：隨機與 audit | 固定案例 RNG 相同；count=200、seed=`prompt-quality-baseline`，[before](audit-before.txt)／[after](audit-after.txt) 逐位元組相同，0 blockers／18 既有 diagnostics。 |
| I6：收藏／還原 | 原／新增固定 JSON／Markdown payload、舊 lock、歷史胸上 MJ、來源匯入 API 全通過；瀏覽器實際還原與六輸出一致。 |
| I7：前端 | [完整測試](full-tests.txt) 1,821/1,821，[lint](lint.txt)、[build](build.txt) 通過。 |
| I8：資料與保護 | [Python](python-tests.txt) 21/21（原 2＋B 新增 19）、[Node 工具](tool-tests.txt) 10/10、[sync --check](data-check.txt)、[資產檢查](assets.txt) 207 檔通過。[strict](integrity.json) 0 blockers、0 stale；schema 1,050 筆及隔離演練通過。C 的正式歷史 registry CI 尚未啟用，B 以 fixtures／初始演練驗證。 |
| I9：瀏覽器 | [舊流程](browser-regression/results.json) 22 項＋[全身匯入](browser-import/results.json) 22 項，桌面 1440×1000／手機 390×900，無 console/page errors，外部 POST 為 0。 |

本輪使用本機 Node v25.8.2，frontend full test 沿用 `NODE_OPTIONS=--test-reporter=tap npm test`；CI 設定維持 Node 22，尚不能宣稱遠端環境已通過。build 的既有 >500 kB chunk 提示仍在。沒有修改知識庫 Markdown，所以只執行 sync `--check`，沒有重寫正式 database。報告文字 log 副本移除 ANSI 顏色及行尾空白，原始 log 留在 `/private/tmp/catalog-b-20261025`；Prompt 基準不做任何清洗。

## 瀏覽器與診斷說明

以既有本機 main 服務 `http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1`，使用全新 browser contexts。檢查現行五工作區：Prompt 工作台、角色建模、場景建模、DLL_PIC Pro、Saved Cards；動作及觀察式抓拍仍在工作台內，沒有恢復歷史獨立頁。

實際操作包括舊收藏還原、Markdown ZIP 匯入、角色／場景帶回 PAGE1、六輸出複製與 DLL 明確帶入／隔離草稿重載，以及全身人物匯入後三次重抽、角色卡來回、鍵盤重新匯入、收藏／reload、六輸出固定還原與缺來源停用。已檢視桌手機五工作區、人物摘要、還原及缺來源畫面；無破圖、頁面橫向溢位、控制項重疊或非預期截斷，保留既有面板與長頁捲動。

16 張最終截圖保存在 `browser-regression/`（10）與 `browser-import/`（6）；例如 [手機匯入](browser-import/390-capture-import.png)、[手機還原](browser-import/390-markdown-restored.png)、[手機缺來源](browser-import/390-missing-source.png)。第一輪與完整測試並行時，22 項操作已通過，但最後手機 Saved Cards 截圖超過 10 秒；[首次紀錄](browser-first-attempt.json) 沒有 console/page error。未改 UI、未提高門檻；待運算負載結束後原工具獨立重跑，22 項及所有截圖通過。工具開發時也修正了 macOS `/var` 實際路徑斷言，並依現有 projection 契約允許沒有獨立英文的模式資料；這些均為檢查器修正，沒有修改產品資料。

完整性 gate 的兩個既有例外只限 `LEGACY_ID_AMBIGUOUS + duoPoseId:shoulder-lean`／`duoPoseId:leaning-shoulders`，保留 J12 原順序。5 類 possible（文字推論 tags、測試 ID、zh literal、分類 literal、角色資料分層重複）持續列入報告；不是新阻擋，不在 B 修改內容來壓低數字。

## 階段限制與下一步

B 驗證的是切換準備。正式 registry 與受信任基準的 CI 連接、JSON 主來源啟用、Markdown 改為正式生成文件及 metadata 移除均屬 C，尚未進行。`allow_retirement` 僅供圖結構 fixtures，不能代替實際 control／舊 payload／再生成驗收；A–E 預設禁止退役。既有 retired 歷史目前也不允許改寫，未來多次替代需另立規格與測試。沒有新增 runtime fallback。

建議先審閱並驗收 B；若之後授權提交，僅使用本報告允許清單，另行確認該提交的遠端 CI。開始 C 前重新核對最新 main 與 A 基準、清點 Markdown 消費者，安排獨立切換與回復驗收。P5b 仍延後。


## 後續驗收與交付授權（2026-10-25）

Cooper 已確認本輪 B 驗收通過，授權只提交並 push [允許清單](delivery-allowlist.json) 的 52 份檔案，保留其他未提交內容，之後確認該提交 CI。前文與 `validation.json` 保留為本機驗收當時的證據，不把歷史結果改寫成遠端 CI 結果。正式來源維持 Markdown，C／P5b 未授權；Git／CI 實際結果在交付回報中另列。
