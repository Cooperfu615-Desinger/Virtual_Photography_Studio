# 七項手勢、表情與視線：本機實作與驗證

**2026-11-17 接手更新：** 本 session 保持原產品來源及歷史證據不變，已重新核對完整測試紀錄與來源雜湊、重跑聚焦／目錄／相同 seed 驗證，並補完桌面 1440×1000、手機 390×900 的七項新增、七組輸出、收藏與 DLL 帶入及六工作區驗收。這次先前的瀏覽器阻擋已在授權的本機 HTTP 預覽中解除；不代表修改了全域權限。詳見[接手驗證報告](takeover-2026-11-17/README.md)。以下原始狀態與 `verification.json` 的 `BLOCKED` 保留當時歷史，不再代表本次最終驗收結果。

日期：2026-11-17。來源基準／registry 歷史基準為 `fd3f3bb14e15ec556021791bdda71b8fe8d8731f`，分支 `main`。期間另一 session 提交室內坐姿驗證 `595085d5be21aa5a712ca4ec2bb29a24e7477c37`，只涉及其測試與文件；本批保留該提交並在其上完成驗證。這一輪沒有 stage、commit、push、部署或操作私人收藏。

**狀態：七項功能與自動驗證已完成；瀏覽器畫面驗收受環境限制，尚未完成最終視覺驗收。**

使用者於同日後續明確授權：將本批七項新增直接 commit／push 到 `main`，由使用者實測。本文與 `verification.json` 保留實作驗證當時的未提交快照；後續提交授權不代表瀏覽器驗收已完成，也不新增手動部署授權。

## 實作結果

| 選項 | 有效內容 |
| --- | --- |
| 單手比中指 | 一手在肩胸附近伸出中指，其餘手指收起、拇指覆住，另一手放鬆 |
| 雙手比中指 | 雙手在肩胸附近各自伸出中指；不附帶表情、前傾、貼近鏡頭或模糊 |
| 閉眼享受 | 雙眼輕閉、眉間放鬆、嘴唇微張、舒服滿足 |
| wink微笑 | 一眼閉合、另一眼睜開，自然露出上排牙齒微笑 |
| 瞇眼微笑 | 雙眼瞇起但保留眼縫、臉頰上提，自然露出上排牙齒微笑 |
| 斜眼看鏡頭 | 頭稍轉一側，眼睛側瞥回鏡頭 |
| 低頭抬眼看鏡頭 | 下巴收低、眼睛抬起看鏡頭，攝影機俯仰角度保持獨立 |

七項先供手動選取，不加入原隨機池。新手勢使用既有一般手勢 scope，適用手部空閒的站／坐／跪姿；蹲姿與躺姿不新增未審閱變體。固定手部、手機自拍、固定場景、觀察式抓拍、雙人及指定動作接管沿用原邊界。原「頂鏡頭挑釁手勢」保持。

「閉眼享受」生效時暫停視線，保留原選值，切回其他表情後恢復；動作接管表情時，不讓暫存的閉眼選值干擾有效視線。低頭抬眼沿現有低頭規則，與下巴微抬／頭部後仰互斥。

新視線的英文由現行 gaze 來源維護，不加入退役 Pose Composer 頭部清單。主輸出與胸上使用同一解析來源與既有裁切規則；全身角色照保持自然站姿參考、9:16，只沿原契約保留表情。主 MJ 只對這三筆新表情保留完整短描述，確保眼睛狀態及微張嘴／露齒不被第一片語精簡移除。

詳見[核准規格](../../specs/gesture-expression-gaze-additions-v1.md)、[七組實際 Prompt](actual-prompts.md)及[驗證資料](verification.json)。

## 驗證

前端與 Node 工具使用 Node `v22.23.3`；歷史來源皆從本機完整 Git 物件讀取。完整前端與 Prompt Quality 依序執行，沒有同時跑兩份完整 gate。

| 檢查 | 最終結果 |
| --- | --- |
| 新功能與相鄰手勢／視線／狀態測試 | 69／69 通過 |
| 歷史回放、目錄快照與相鄰來源回歸 | 43／43 通過；最終測試檔的 Buffer 明確匯入另以單檔回歸通過 |
| 完整 `npm test -- --test-concurrency=4` | 2,371／2,371 通過，零失敗、零略過 |
| `npm run test:prompt-quality -- --test-concurrency=4` | 972／972 通過，零失敗、零略過 |
| `npm run lint` | 通過 |
| `npm run build` | 通過，保留既有大於 500 kB 分包提醒 |
| Catalog sync／read-only check | 1,057 筆、56 分類、八份產物同步；保留原 1,054 筆歷史 ID，新增三個 active ID |
| Python schema／registry／來源測試 | 60／60 通過 |
| Catalog integrity／semantic／legacy 工具測試 | 33／33 通過 |
| Strict catalog integrity | 0 blocking、0 stale；原兩個精確 legacy 例外保持 |
| 修改前固定案例比對 | 1,240 組舊輸出、選值、結構化來源及 RNG 呼叫數相同；只排除 root runtime id／date |
| 同 seed strict audit | count 200、seed `prompt-quality-baseline`；修改前後報告逐位元相同，0 blocking、24 個既有 diagnostic |
| `git diff --check` | 通過 |

固定案例來自修改前的 104 個代表案例、200 個固定 seed 抽樣及 936 個既有手勢／視線／景別組合。原始[比較資料](before.json.gz)僅含合成生成結果，可執行：

```sh
node scripts/gesture_expression_gaze_acceptance.mjs compare Docs/reports/gesture-expression-gaze-2026-11-17/before.json.gz
```

`capture` 使用排他寫入，不覆寫既有封存。原 A–E、各歷史 baseline／seal／inverse manifest 都沒有重錄。本批新增獨立精確 SHA256 逆向層；每個來源只有符合本批 after hash 才能還原，未知修改保持原樣交給舊檢查拒絕。歷史建樹會將 Docs 連結至唯讀原件，因此本批逆向只列 runtime／工具檔案，不寫入或放寬 Docs 連結保護。直接呼叫早期 inverse 的測試只增加本批前置還原，原斷言保持。

## 畫面驗收限制

Visual QA: BLOCKED。

- 指定網址：`http://127.0.0.1:5175/Virtual_Photography_Studio/`。
- 開發伺服器在目前執行權限下回傳 `listen EPERM 127.0.0.1:5175`，未能啟動。
- 曾準備同源程式的離線 bundle 與獨立測試儲存 prefix 作為安全替代，但瀏覽器 URL 安全政策拒絕 `file://`，僅允許 HTTP／HTTPS。沒有繞過政策，也未以原生 App 或其他瀏覽器取代。
- 1440×1000／390×900 的實際畫面、七選項操作、停用／恢復、瀏覽器內收藏還原、六工作區導覽、console／page errors、橫向溢位及截圖都尚未驗收。暫時 viewport 已復原，臨時分頁已關閉。
- Node 中的收藏／Markdown／ZIP roundtrip 已通過，不能視為上述瀏覽器操作驗收。
- 未呼叫應用內付費生成、未登入真實帳號、未讀寫私人收藏。對話中的示意圖確認亦不等於新應用 Prompt 在各外部模型逐組出圖驗收。

本機伺服器可啟動後，仍需依[畫面驗收程序](../../specs/frontend-visual-validation.md)補完桌手機及六工作區檢查。啟動命令：

```sh
npm --prefix /Users/cooperfu/Projects/Virtual_Photography_Studio/webapp run dev -- --host 127.0.0.1 --port 5175
```

## 修改檔案與保護

- 正式資料：`knowledge_base/catalog/Character/表情-facial-expression.json`、`id_registry.json`、`index.json`；同步生成 `knowledge_base/character_design.md`、`webapp/src/data/database.json`。
- 行為：`webapp/src/lib/engine/gazeGesture.js`、`headPosture.js`、`webapp/src/lib/engine.js`、`webapp/src/features/page1/lockTransitions.js`、`webapp/src/components/Page1Workspace.jsx`。
- 新回歸與案例：`gestureExpressionGaze.test.js`、`gestureExpressionGazeFixtures.js`、`features/qa/gestureExpressionGazeHistory.test.js`；`scripts/gesture_expression_gaze_acceptance.mjs`。
- 既有測試依核准新增更新當前選項／筆數：`gazeGesture.test.js`、`engineExpressionPoseCleanup.test.js`、`catalogSemanticSource.test.js`、`catalogSnapshot.test.js`、`scripts/tests/test_catalog_cutover.py`；原 1,050 筆歷史數量斷言仍保留，三個新增 ID 另行明確驗證。
- 歷史工具：新增 `scripts/lib/gestureExpressionGazeHistoricalReplay.mjs`、`gestureExpressionGazeHistory.json`，在 `videoReferenceReplay.mjs` 接入；`testEfficiencyRunner.test.js`／`denimOveralls.test.js` 增加前置還原。
- 完整性工具：`scripts/lib/catalogIntegrity.mjs` 與 `scripts/tests/catalog-integrity.test.mjs` 驗證新的 authored gaze owner；原 legacy head 仍要求有效引用，沒有新增 allowlist。
- Gate 與文件：`webapp/package.json` 只將新測試追加到既有 Prompt Quality 清單；新增專屬規格、本文與證據，人物編寫指南加現行入口。

既有 `Docs/current_project_state.md`、`Docs/session_onboarding.md` 未由本批編輯，其原未提交差異保留。另一 session 的室內坐姿驗證及既有研究／圖片／腳本保留；不整理無關檔案、不建立分支或 worktree。
