# A2 上下配色抓拍相容：本機驗收報告

2026-10-27。本機驗收完成，待 Cooper 驗收；未 stage／commit／push，沒有本批新 CI。

可信 main 與驗收結束時遠端 main 均為 `58516b20c6631b1a61faa48ee22abfb05ea29384`。本批位於 `/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio` 的 main 工作目錄；原 `/Users/cooperfu/Projects/Virtual_Photography_Studio` 及其他既有工作目錄保持。

## 結果與原因

42 組上下配色原本有方案 ID，但內部上／下色塊沒有 ID。舊匯入驗證要求每個非空配色物件都有 ID，造成合法的一般分件人物也無法建立抓拍來源。本批接受可追溯到同人物、同部位方案的原始色塊，不新增 ID 或改寫配色資料。

唯一產品程式變動是 `webapp/src/lib/observationCaptureImport.js`。既有帶 ID／null 分支、人物與服裝來源驗證、version 1、儲存格式及深拷貝規則保留；新增無 ID 分支限定欄位、非空 zh／en、可選六位 hex，並要求與來源葉節點完全相同。缺來源、錯人物、錯部位、不明欄位及畸形色值整份拒絕。

本批未修改 catalog、engine、renderer、UI／CSS、穿搭互斥、依賴或 CI。新測試已由既有前端測試入口及 Prompt Quality 納入。原選值、公開 Prompt、六份輸出與 RNG 保持；抓拍重抽維持已匯入快照，只有明確重新匯入才替換人物／穿搭。

## 固定基準對照

| 驗收項目 | 結果 |
| --- | --- |
| 普通生成與狀態轉換 | 1,485 組，六輸出／選值／RNG 與固定 Git 保持 |
| 抓拍生成 | 1,431 組；其中 1,364 組原本被錯誤拒絕的來源可用 |
| 既有合法來源 | 112 組保持 |
| 快照還原／抓拍重抽 | 各 357 組通過 |
| 原有抓拍排除路徑 | 45 組保持 |
| 保存案例 | 30 組 JSON／Markdown／來源快照 |
| 固定資料／程式保護 | 327 份逐字保持 |
| 非核准差異 | 0 |

以上計數是各測試迴圈的覆蓋量，不應相加當作獨立案例總數。範圍包含 42 配色 × 褲裝／裙裝／只有上身／只有下身、24 舊連身與套裝引擎相容路徑，以及 random、none、景別、完整色系、雙人／角色卡／固定構圖排除。

普通引擎直接使用固定 Git 版本對照，僅移除頂層 id/date。第二個隔離 oracle 只略過舊 ID-only 驗證的一行，暴露可信生成案例的完整原始快照，並用原引擎產生預期抓拍輸出；不是把本次驗證函式複製到基準。非法輸入另由負向測試驗證，產品沒有略過驗證的選項。

證據：[acceptance.json](acceptance/acceptance.json)、[完整基準與保存案例](acceptance/baseline-and-saved.json.gz)、[差異清單](acceptance/oracle-mismatches.json)。

## 回歸與完整門檻

| 檢查 | 結果 |
| --- | --- |
| 修改前失敗回歸 | 16 項中 6 項因合法上下色塊被拒而失敗，10 項通過 |
| 聚焦匯入／本批與前批歷史安全測試 | 27／27 |
| 前端完整測試 | 1,954／1,954 |
| Prompt Quality | 825／825 |
| lint／build | 通過；build 保留既有大 bundle 警告 |
| 200 同 seed strict audit | 前後逐字一致；0 blocker、18 既有診斷（17 份 Prompt） |
| JSON 來源同步檢查／strict／歷史 ID | 通過 |
| Python／目錄工具 | 43／43、32／32 |
| 公開資產 | 207 項通過 |

新增七個快照回歸與兩個歷史安全回歸。前批特殊穿搭測試只更新本次已解決的抓拍來源預期；原本舊連身還原清配色斷言仍保留。所有門檻以 Node 22 執行，詳見 [gates.json](gates.json)、[同 seed 對照](audit-comparison.json)及 `logs/`。

## 歷史回放

精確 inverse 先核對四份來源／測試的前後 SHA 與本批新增測試 SHA，確認全部屬於同一版本後才寫入隔離副本。缺檔、未知內容、混合版本及真實 Git checkout 都會在寫入前拒絕；重複還原安全。

回放上一批特殊穿搭原工具（6,957 次轉換／2,564 次生成），再完整回放 runtime 4,375 案、膠帶、Markdown 快照、顏色還原、40 套裝、24 連身、A1 與四批 A5 的原工具，全部通過。先前限制在還原的歷史版本中依舊成立，不把本批行為倒灌到舊基準。

[回放狀態](history/history.json)、`history/` 各層結果及 [完整回放紀錄](logs/history.log.gz)保留本次證據。A～E 舊封存、舊 patch manifest 與前批報告均未重錄。

## 瀏覽器與畫面

網址 `http://127.0.0.1:5175/Virtual_Photography_Studio/`，隔離 Chromium 儲存空間，桌面 1440×1000／手機 390×900，共 38 項操作與 36 張畫面。

- 實際快速色塊、完整配色選單及鍵盤選取，首次全身角色匯入、回一般模式及明確重新匯入。
- 重抽／人物來源切換保留完整快照；random 只解析一次，原始一般選值仍保留 random；解除配色仍正常。
- 六份輸出實際複製、收藏、單張與 ZIP 下載、兩種檔案實際匯入、套用及重載。
- 無來源時匯入與收藏停用；舊連身的 reload 清配色限制仍存在。
- 目前六工作區：Prompt 工作台、角色建模、場景建模、DLL_PIC Pro、DLL_VIDEO Pro、Saved Cards。

0 console／page error、0 外部 POST，沒有意外頁面水平溢位或破圖。已人工檢視桌手機六工作區、匯入主畫面及手機配色／重新匯入／無來源局部；原有暫時提示及手機按鈕省略樣式保持，未改 UI。這是本機操作與 Prompt 相容驗收，不包含外部圖像／影片生成。

工具撰寫時曾因色塊選單類別、提示文字大小寫、來源選單定位及無來源頁面導航而失敗，已修正工具後整輪通過；未為此擴改產品程式。封存只收最終通過輪次，不把工具除錯截圖當成通過證據。

[操作結果](browser/results.json) · [人工畫面檢視](visual-review.json) · [桌面匯入](browser/1440-paired-import.png) · [手機配色](browser/390-paired-standard-detail.png) · [手機匯入](browser/390-paired-import.png) · [無來源](browser/390-paired-empty-detail.png)。本次專用 5175 驗收服務已停止，確認沒有 listener。

## 保護與延後項目

2,747 份原追蹤檔僅本批七份允許變動，1,337 份歷史檔保持。其他 20 工作目錄的 HEAD／狀態及 140 份既有未提交檔 SHA 全部保持。新增檔只允許本批九份規格／工具／回歸與本報告目錄；index 空白，HEAD 沒有移動。證據見 [修改前快照](protection-before.json)、[最終保護檢查](protection.json)、[交付狀態](delivery-status.json)及 [檔案清單](manifest.json)。

舊連身的結構化／純文字還原另批：`dressId + topBottomPaletteId` 雖可由引擎建立合法抓拍來源，工作台套用／重載仍按既有互斥規則清除上下配色；同 ID 連身／套裝文字辨識與胸上區域投影也保持既有行為。這不是本批抓拍快照修正的失敗，亦未宣告其完成。其他項目與 P5b 未進入。

## 重跑方式

在本報告所屬 main 工作目錄使用 Node 22。完整命令清單在 `gates.json`；聚焦測試為：

```sh
node --test webapp/src/lib/observationCaptureImport.test.js webapp/src/lib/pairedCaptureHistory.test.js webapp/src/features/page1/specialOutfitPalette.test.js webapp/src/features/page1/specialOutfitPaletteHistory.test.js
node scripts/paired_capture_a2_acceptance.mjs /tmp/a2-paired-capture-acceptance
node scripts/paired_capture_a2_history.mjs /tmp/a2-paired-capture-history
python3 scripts/paired_capture_a2_protection.py Docs/reports/paired-capture-a2-2026-10-27/protection-before.json /tmp/a2-paired-capture-protection.json
```

瀏覽器工具需先確認 5175 的服務屬於本工作目錄，並準備 Playwright；可用 `PLAYWRIGHT_MODULE` 指定已安裝模組的絕對路徑，執行 `node scripts/paired_capture_a2_browser.mjs /tmp/a2-paired-capture-browser /tmp/a2-paired-capture-acceptance/baseline-and-saved.json.gz`。保護檢查刻意要求未提交狀態與固定 main；未來交付後不可把此檢查失敗解讀為產品回歸，應另做交付前後證據。

[規格](../../specs/paired-capture-a2-v1.md) · [決策](../../decisions/2026-10-27-a2-paired-capture.md)。
