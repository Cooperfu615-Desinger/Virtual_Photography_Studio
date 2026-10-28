# A2 舊連身結構化還原與狀態保留 v1

> 2026-10-28 現行狀態：本批與原先列為「另批」的 A2 相依工作已完成實作與交付；統一追溯見 [Phase 4 結案](../reports/phase4-completion-2026-10-28/README.md)。下方授權／待辦文字保留當時時點，現行行為以結案索引中各後續規格為準。P5b 暫緩。

2026-10-27。可信本機／遠端 main：`0babbebb8c5fabfe9a1fa16d8824e1c5651ffffd`。Cooper 已確認本批實作、必要狀態提示／解除與完整驗收通過，授權只提交並 push 本批程式、文件、基準、回歸案例、歷史回放與驗收工具。實際 Git／CI 結果另行核對；本批報告保留提交前驗收證據。其他未提交內容及歷史基準保持。

## 目標與邊界

已有合法單人 `dressId + topBottomPaletteId` 的結構化選值，在還原、套用、重載、非穿搭更新、收藏與再次匯出後保留同一配色。引擎已能表達上半部與下擺，資料是在工作台互斥清理時被清掉；本批不改生成引擎、任何 renderer、catalog、ID、存檔版本或快照驗證。

純文字同 ID 套裝／連身辨識、單色歸屬、配色句反推與胸上區域投影另批。未保存的配色不猜測復原；舊公開文字與已匯入抓拍來源不改寫。

## 狀態契約

- 合法相容組合：單人、明確有效的連身選項、明確有效且含上下色塊的現有配色方案，沒有生效的套裝或特殊穿搭。配色 random／空值、未知 ID、雙人不取得此例外。
- 結構化套用及工作台初始化明確以 restoringSelection 啟用例外。仍清除原本衝突的上衣／褲裙／修飾與套裝欄位，只保留連身自己的上下配色。
- 後續更新只有原組合、連身款式與連身配色欄位都未變，且未主動啟用分件時才保留。外套／鞋襪／配件、姿勢、場景、鏡頭、景別與完整造型色系不屬於換款。
- 主動換連身款式（包含全無／隨機）、改連身配色或改選分件時解除舊方案。主動選套裝／特殊穿搭沿用接管清理；新選分件配色仍沿用既有分件接管。相同值重新點選連身款式／配色也視為明確操作。
- 「解除連身舊配色」只將 topBottomPaletteId 設為既有全無值；保留連身及其他有效選值，依現存 dressColorId 生成，不創造替代色或恢復已遺失資料。
- 區域隨機／清空、全域隨機／全無沿用既有範圍；不攜帶舊方案到新的隨機穿搭。單／雙人切換不改 A／B 選值，休眠的單人組合在回到單人且未換款時可保留。
- JSON、新版單張／ZIP Markdown、預覽回填、收藏套用與 localStorage 重載使用同一規則。純文字解析仍保持原判定；含既有抓拍 metadata 的結構化部分按其來源處理，不放寬驗證。
- 抓拍人物快照與一般休眠選值分開：重抽／儲存不改已匯入人物，回一般調整後明確重新匯入才更新。雙人 A／B 配色／穿搭流程保持。

## 最小介面

在既有完整造型的連身卡片內顯示「保留的連身配色」、方案名、上半部及下擺色名，提示改款或改連身配色會解除，提供「解除連身舊配色」按鈕。沿用既有文字／次要按鈕樣式；摘要標示同一方案。分件配色選單仍按完整造型互斥停用，不開放新的混搭入口。抓拍接管時提示隨欄位停用，使用者先回一般模式再調整。

## 驗收與歷史

1. 保存固定 main、全追蹤檔 SHA、其他工作目錄 HEAD／狀態／dirty SHA、200 同 seed strict audit。先加入失敗回歸再修改。
2. 固定 Git 的原互斥／transition／引擎作獨立 oracle；只接受本規格的 topBottomPaletteId 保留或解除差異，其他有效欄位及 RNG 維持原規則。24 連身 × 42 配色覆蓋還原、後續更新與換裝；普通單色／無色、真正套裝、特殊穿搭、雙人、隨機、全無、衝突資料為保護案例。
3. 相同原 locks 直接生成完整物件／六輸出／selection／structured／RNG 零差異。修正後的還原 locks 也交給固定 Git 原引擎，確認配色只按既有來源與投影生成，不能以 UI 欄位有值代替輸出驗收。
4. JSON、Markdown／ZIP、歷史卡片、原文、套用→生成→收藏→重載、抓拍人物凍結／重新匯入、壞快照拒絕均驗證。
5. 精確 inverse 先驗證所有來源／新增測試 SHA，未知、混合、缺檔或真實 Git checkout 原子拒絕；只在隔離副本回復本批後執行前批上下配色抓拍與完整 A2／A1／A5 原工具。A～E 與前批基準不重錄。
6. Node 22 聚焦、前端完整測試、Prompt Quality、lint／build、200 同 seed strict audit；sync --check、歷史 ID／strict、Python、目錄工具、assets 與保護清單。
7. 5175 桌面 1440×1000／手機 390×900：真實卡片匯入、套用、提示、鍵盤解除、換款／改色、非穿搭更新、六輸出複製、收藏、單張／ZIP、重載、抓拍、雙人及六工作區。檢查錯誤、溢位、圖片、禁用狀態；不呼叫外部生成 API。

[決策](../decisions/2026-10-27-a2-legacy-dress-restore.md) · [驗收報告](../reports/legacy-dress-restore-a2-2026-10-27/README.md)

## 工具

```sh
node --test webapp/src/features/page1/legacyDressRestore*.test.js
node scripts/legacy_dress_restore_a2_acceptance.mjs /tmp/a2-legacy-dress-acceptance
node scripts/legacy_dress_restore_a2_history.mjs /tmp/a2-legacy-dress-history
node scripts/legacy_dress_restore_a2_browser.mjs /tmp/a2-legacy-dress-browser /tmp/a2-legacy-dress-acceptance/baseline-and-saved.json.gz
```

使用 Node 22；瀏覽器工具需本工作目錄的 5175 服務及 Playwright。輸出只可放本批報告或隔離暫存目錄。保護工具與各項門檻完整命令見報告，不覆寫舊基準。
