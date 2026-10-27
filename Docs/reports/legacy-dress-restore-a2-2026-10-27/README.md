# A2 舊連身結構化還原與狀態保留驗收

2026-10-27。基準及最後確認的本機／遠端 main：`0babbebb8c5fabfe9a1fa16d8824e1c5651ffffd`。

狀態：本機完整驗收通過，待 Cooper 驗收。未 stage／commit／push；本批尚無遠端 CI 結果。

## 產品結果

- 單人合法 `dressId + topBottomPaletteId` 在 JSON、新版 Markdown／ZIP、預覽回填、收藏套用及工作台重載時保留原配色；衝突的分件／套裝欄位仍按原規則清理。
- 原組合未變時，姿勢、場景、景別、外層／鞋襪／配件與完整造型色系更新不再清掉配色。主動換款／改連身色／改選分件或清空完整造型會解除舊方案；同一款／同一色再次點選也視為明確替換。
- 既有連身卡片及摘要顯示保留的方案，上半部／下擺名稱沿用原資料。新增「解除連身舊配色」次要按鈕；分件配色選單仍停用，沒有新增混搭入口。
- 抓拍接管時按鈕與既有穿搭欄位一起停用；重抽保持已匯入人物，回一般調整後只有明確重新匯入才換來源。雙人 A／B 仍隔離。
- 正式 catalog、ID、schema、生成引擎、renderer、公開欄位與存檔版本不改。純文字與胸上投影另批。

## 固定 Git 與案例

[完整結果](acceptance/acceptance.json) · [基準與卡片](acceptance/baseline-and-saved.json.gz) · [核准外差異](acceptance/oracle-mismatches.json)

| 類型 | 結果 |
| --- | --- |
| 24 款連身 × 42 組方案 | 1,008 組，全部保留有效方案與上下區域色 |
| 狀態轉換 | 18,238 次，0 核准外差異 |
| 固定 Git 生成比較 | 4,439 次，全物件／六輸出／selection／structured／RNG 保持 |
| JSON 與 Markdown 往返 | 2,016 次；原文逐字保持，套用／生成／再保存保留方案 |
| 純文字保護 | 1,032 例，保持既有判定 |
| 抓拍生成／重抽 | 96 次，人物快照與原全身來源保持 |
| 前批封存舊卡片 | 24 筆 JSON／舊 Markdown 保持 |
| 核准外正式資料／程式 | 322 份逐字與固定 main 相同 |

Oracle 使用固定 Git 的舊清理與 transition，只對核准情境恢復方案，或在明確換裝時先解除方案再依原規則處理。生成以同一輸入交給固定 Git 原引擎，不用新程式的輸出作為自己的 expected。volatile id/date 不參與生成比較；保存案例另用固定識別與日期。

初始化、一般更新、換款、全無／隨機、主動改色、分件接管、真正套裝、特殊穿搭、區域／全域操作與雙人均覆蓋。不能只用欄位有值代替實際生成驗收。

## 程式與驗證工具

產品修改限定六份：

- `page1WardrobeExclusivity.js`：共用合法組合辨識、還原保留及明確換裝解除。
- `lockTransitions.js`：傳遞既有 restoringSelection 意圖。
- `usePromptWorkspace.js`：工作台初始化標示結構化還原。
- `cardCodec.js`：結構化套用意圖；舊純文字路徑維持原清理，既有抓拍 metadata 仍按結構化處理。
- `Page1Workspace.jsx`：原卡片提示、解除及相同值重新點選。
- `page1WorkspaceSummary.js`：顯示同一保留方案。

新增 `legacyDressRestore.test.js`、`legacyDressRestoreHistory.test.js`；前批限制斷言改為現行核准契約，歷史測試僅增加精確來源轉接。15 份來源／測試／回放入口以 `a2LegacyDressPatches.json` 封印；新增兩份測試亦檢查 SHA。inverse 對缺檔、未知、混合與 Git checkout 原子拒絕，只寫隔離副本。

## 完整門檻

[命令與 exit code](gates.json)

- 聚焦狀態／還原／純文字保護 42／42；新增與歷史工具聚焦 29／29。
- 前端 1,965／1,965；Prompt Quality 825／825；lint、build 通過。
- 200 組 `prompt-quality-baseline --strict` 前後逐字相同；0 blocker、18 既有 diagnostics。前後 SHA256 均為 `52c71978ee44dbf1616b152dab2972d0a2505d12b37e138ebd97e9343f5a4a31`。
- Python 43／43、目錄工具 32／32、sync --check、歷史 ID／strict integrity、207 assets 通過。
- build 保留既有大 chunk 提示，未藉本批調整打包或依賴。
- 最初新增回歸為 7 fail／2 pass，見 [修正前證據](regression-before.log)。全套曾指出兩個歷史測試讀取現行來源而不是封存來源；補齊精確轉接後全套通過，未放寬舊斷言／封印。

## 瀏覽器

[50 項操作與 36 張原始畫面](browser/results.json) · [人工檢視紀錄](visual-review.json)

URL 為正式驗收 5175 路徑；桌面 1440×1000、手機 390×900。每次使用獨立 browser context，實際讀取前批封存 JSON、套用卡片、開選單改色／換款、鍵盤解除、同值重選、預覽回填、重載、六輸出複製、收藏、單張／ZIP 下載及上傳、雙人操作、抓拍凍結與明確重新匯入。

六工作區均已開啟並確認圖片、console／page error 與橫向溢位。0 error、0 外部 POST，沒有呼叫付費生成。已有的使用者儲存空間未改；專用服務已停止，5175 已釋放。

- [桌面連身提示](browser/1440-reloaded-detail.png)
- [手機連身提示](browser/390-retained-detail.png)
- [解除後](browser/1440-released-detail.png)
- [抓拍接管停用](browser/390-capture-disabled-detail.png)

## 歷史與保護

[完整歷史鏈](history/history.json)已通過：上一批上下配色抓拍、特殊穿搭色系、runtime、膠帶、Markdown 快照、舊文字還原、40 套裝、24 連身、A1 與四批 A5 原工具均在隔離副本執行。舊工具驗證當時的行為（包含舊連身清色限制），現行行為由本批回歸另驗證；原封存不改寫。

[回放輸入證明](history-input-proof.json) 驗證最終 15 份 inverse 的 beforeSource 均與正在執行原工具的固定 main 來源逐字相同。回放期間新增的兩個歷史單元測試轉接不改該輸入；最終完整 inverse 另通過全部未知／缺檔／混合／禁止工作區案例。

保護基準涵蓋 2,846 份原追蹤檔、1,427 份歷史檔，以及其他 20 工作目錄／140 份未提交檔。最終核對只允許本批清單，staged 必須為空；結果見 `protection-after.json`。A～E 與前批基準不重錄。

## 保留限制

- 純文字同 ID 套裝／連身分類、單色欄位歸屬及新舊配色句反推未修。舊文字沒有充分資訊時仍不能重建完整選值。
- 連身上下區域的胸上投影保持既有政策，未增加被裁切隱藏的片段。
- 已被舊版丟失、且沒有完整來源的配色不能憑空復原。
- 本報告是本機驗收；待 Cooper 驗收，尚未 commit／push，未執行本批遠端 CI。

## 重現

使用專案 Node 22 與現有依賴，根目錄：

```sh
node --test webapp/src/features/page1/legacyDressRestore*.test.js
node scripts/legacy_dress_restore_a2_acceptance.mjs /tmp/a2-legacy-dress-acceptance
node scripts/legacy_dress_restore_a2_history.mjs /tmp/a2-legacy-dress-history
node scripts/legacy_dress_restore_a2_browser.mjs /tmp/a2-legacy-dress-browser /tmp/a2-legacy-dress-acceptance/baseline-and-saved.json.gz
python3 scripts/legacy_dress_restore_a2_protection.py Docs/reports/legacy-dress-restore-a2-2026-10-27/protection-before.json /tmp/a2-legacy-dress-protection.json
```

瀏覽器工具需本工作目錄的 5175 服務及 Playwright；必要時用 PLAYWRIGHT_MODULE 指定已安裝模組。資料檢查使用上述完整 REGISTRY_BASE_COMMIT。CI 透過既有 npm test glob 包含新增回歸，未修改 workflow。保護工具刻意核對本批未提交狀態；未來交付後需另建交付證據。
