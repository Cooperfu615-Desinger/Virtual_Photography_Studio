# A2 舊連身純文字還原驗收報告

2026-10-28。固定本機／遠端 main：`2caa6fdcd2ab63931339ee3018ca52025d3cef3f`。本批範圍由 Cooper 授權：舊連身純文字辨識、顏色／部位與必要 A／B 歸屬、貼回／Markdown／ZIP 共用。未 stage、commit、push；使用者驗收與 Git／CI 不在本次本機結果中。胸上區域投影、其他項目與 P5b 未進入。

## 結果與實作邊界

- 正式連身完整來源或歷史 alias 在文字內命中時，清除同 ID 的套裝重複歸屬，回到 `dress*Id`／`dress*ColorId`。真正套裝與特殊穿搭維持原接管規則。
- 新 `dress palette from top to bottom` 與舊 `coordinated top-to-bottom palette` 依完整上／下區域色名，唯一對回既有 42 方案；缺半句、未知色、衝突或無角色證據不猜，不退化成較短的一般色票。無 ID 色塊原結構保持。
- 單人、明確雙人 A／B 分開處理；共用及休眠連身命中不再覆寫角色。Markdown 以完整 GPT 作本批來源，壓縮 Z／MJ 不拼湊或覆寫連身證據。
- JSON、新版 PAGE1 快照與抓拍 metadata 優先；舊卡公開正文原樣保留。只有已確認合法單人連身配色接到前批的 `restoringSelection` 保留契約。
- 正式程式只變更 `cardCodec.js` 並新增 `legacyDressProseRecovery.js`。引擎、renderer、catalog、ID、快照格式、儲存版本與 UI 不改。其他變更為回歸、歷史適配、驗收工具及文件。

[規格](../../specs/legacy-dress-prose-a2-v1.md) · [決策](../../decisions/2026-10-28-a2-legacy-dress-prose.md)

## 固定 Git 與回歸

[完整結果](acceptance/acceptance.json)／[新基準與卡片](acceptance/baseline-and-saved.json.gz)／[差異清單](acceptance/oracle-mismatches.json)。獨立 oracle 在暫存副本讀取固定 Git，依案例的已知來源建立預期選值，不拿候選 parser 的輸出當預期。非本批欄位使用原固定版 parser／Markdown 還原結果，包括 Optional Silence metadata。

| 驗證 | 結果 |
| --- | --- |
| 24 款連身 × 40 色票 | 960 組 |
| 24 款 × 42 方案 × 新舊句型 | 2,016 組 |
| 雙人不同款／方案、A/B 對調 | 84 組 |
| 貼回與舊 Markdown 還原／套用 | 6,120 次 |
| 固定 Git 引擎對照完整輸出與 RNG | 8,172 次 |
| JSON／新版 Markdown 結構化往返 | 67 組 |
| 舊 ZIP 共用解析、原文保護 | 67 張 |
| 真實封存舊 Markdown | 24 張 |
| 其他正式程式／資料逐字保持 | 327 份 |
| 核准範圍外差異 | 0 |

新增 12 項文字回歸；固定 Git `2caa6fdc` 上為 9 fail／3 pass，證明問題可重現，見 [固定 main 回歸](acceptance/regression-fixed-main.log)。本機全部通過；反例涵蓋同款異色 A／B、同一段多款衝突、無角色標記、不完整／未知色、衝突區域句、真正套裝、特殊穿搭、GPT 與壓縮輸出矛盾、結構化優先。

[來源封印核對](source-seal-check.json)保證 9 份修改檔的 before 是固定 Git，after 是目前來源；3 份新增程式／測試雜湊吻合。exact inverse 先核對全部檔案，未知／混合／缺檔／Git checkout 原子拒絕，隔離副本冪等，見 [inverse 聚焦](inverse-focused.log)。四個較早歷史入口先撤回本批，再進原歷史程序，不放鬆舊雜湊。

## 完整驗證

[完整 gate 狀態](gates.json)：前端 **1,979／1,979**、Prompt Quality **825／825**、Python **43／43**、目錄工具 **32／32**；lint、build、sync `--check`、catalog strict／歷史 ID、207 public assets 全部通過。正式來源仍是 JSON，本批無資料變更，未重錄 sync 產物。

[同 seed audit 比較](audit-comparison.json)：200 筆、`prompt-quality-baseline`、strict 前後逐字一致；0 blocking、18 既有診斷（17 筆 prompt 有診斷），沒有為降低診斷數而擴大修正。

[歷史鏈結果](history/history.json)：隔離 inverse 後執行未改寫的前批 `legacy_dress_restore_a2_acceptance.mjs` 及 `legacy_dress_restore_a2_history.mjs`，包含更早 A2／A1／A5。前批結構化連身 1,008 組、18,238 次轉換、4,439 次生成、2,016 往返、96 抓拍、24 歷史卡保持原通過條件。A～E、A5 與所有前批基準／expectedHash 未改。`history-initial/` 留存較早一次成功回放；最終 `history/` 額外記錄九份精確還原來源與固定 Git 一致。

## 瀏覽器與畫面

[操作結果](browser/results.json)、[畫面檢視](browser/visual-review.json)。5175，桌面 1440×1000／手機 390×900，**68 項操作、44 張畫面**。驗證單色、新舊區域句、雙人實際貼回；未知色不猜；舊 ZIP 原文複製與套用；收藏、重載、單張下載解析、ZIP 下載／重新匯入；六輸出複製；換款／改色／解除；上下單件互斥；雙人隔離；抓拍保留來源與明確重新匯入；六工作區 smoke。

- 0 console／page error、0 外部 POST、0 意外水平溢位，無新破圖／控制重疊；保留小螢幕垂直排列與文字框內部捲動。
- 人工檢視還原提示、解除、A/B、抓拍停用／重新匯入及六工作區桌手機畫面。例：[桌面保留配色](browser/1440-paste-pair-new-detail.png)、[手機保留配色](browser/390-paste-pair-new-detail.png)、[手機 Saved Cards](browser/390-workspace-5.png)。
- 瀏覽器採獨立暫存 context 與本機假資料，不接觸使用者瀏覽器儲存，不呼叫付費生成。專用服務已停止、5175 已釋放，見 [服務狀態](service-status.json)。

## 保護、限制與診斷紀錄

[修改前快照](protection-before.json)／[最終保護結果](protection-after.json)：2,948 份原追蹤檔、1,519 份歷史檔、其他 20 工作目錄與 140 份既有未提交檔保持。另有既存失效 worktree 登記，原樣保留且未清理。[最後遠端 main 核對](remote-main-check.json)仍為固定基準，沒有 Git 提交或 CI 新執行。

現行 Saved Cards Import **只接受 ZIP**。單張 Markdown 由相同 parser 驗證並能下載，沒有新增單張 `.md` 選擇入口。舊卡的公開原文保存在卡片中；「套用目前預覽」沿用重新生成，因此不能把整份新預覽等於舊原文當作還原標準。本批也不補回缺少的景別／表情等非穿搭資訊；抓拍案例先設定既有合法全身景別。相同無色來源無法判定原使用者從套裝或連身選單點選，採正式連身欄位標準化。胸上區域投影另批。

原始診斷檔保留：早期新測試的 none ID／樣本修正；歷史入口缺少本批 inverse 的初始 gate 失敗；驗收 oracle 漏帶舊 Optional Silence metadata、Git 中文路徑 quoting；瀏覽器工具對僅 ZIP 入口、重新生成預覽、卡片定位、lazy 載入與合法抓拍景別的前提修正。上述工具修正均保留原記錄；最終結果以 `gates.json`、`acceptance/acceptance.json`、`history/history.json` 與 `browser/results.json` 為準，未以放寬產品斷言或修改其他功能規避失敗。

## 重跑入口

使用 Node 22；於專案根目錄執行以下命令。輸出至 `/tmp` 可避免改寫本次封存證據。瀏覽器需先啟動專用 5175 服務，`PLAYWRIGHT_MODULE` 指向可用 Playwright module。

```sh
node scripts/legacy_dress_prose_a2_acceptance.mjs /tmp/a2-legacy-dress-prose-acceptance
node scripts/legacy_dress_prose_a2_history.mjs /tmp/a2-legacy-dress-prose-history
node scripts/legacy_dress_prose_a2_browser.mjs /tmp/a2-legacy-dress-prose-browser /tmp/a2-legacy-dress-prose-acceptance/baseline-and-saved.json.gz
python3 scripts/legacy_dress_prose_a2_protection.py Docs/reports/legacy-dress-prose-a2-2026-10-28/protection-before.json
```

保護工具是本次交付前檢查：要求 HEAD 仍為固定基準且沒有暫存內容。使用者日後授權提交後，不應拿其 HEAD 條件誤判為產品退步。
