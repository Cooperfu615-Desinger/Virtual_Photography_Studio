# Phase 4 A5 西門町與狀態收尾驗收

日期：2026-10-26。狀態：**本機完整驗收通過，Cooper 已確認並授權限定提交／push；實際 Git 與本批 CI 結果另行核對**。工作位置為既有 main 工作目錄 `/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`；基準與最後核對的 GitHub main 均為 `5110401f3eee4aaa6cc59ee9175625cc96326d9e`。

## 完成內容

- 只移除「戶外：台北西門町街頭」的 green_space，保留有序 urban／outdoor／commercial。唯一正式資料差異為 [分類來源](../../../knowledge_base/catalog/Locations/城市與社群感-urban-social-snapshots.json) 與 [生成 database](../../../webapp/src/data/database.json) 各少一個 tag；其餘七份生成物不變。parking 原文、ID／aliases／順序、其他資料、engine／renderer／推論退路皆保留。
- 補齊 [規格](../../specs/scene-semantic-a5-ximending-v1.md)、[A5 完整狀態與雙標籤審查](../../decisions/2026-10-26-a5-closure-review.md)，修正架構頂部「Phase 4 未啟動」等現況文字，以新段落承接歷史。前批原始規格／報告／工具不回寫。
- 31 筆列管中，15 筆已交付修正、4 筆核准保留、1 筆本批本機修正，11 筆雙標籤待決。11 筆完整紀錄逐一與固定 Git 核對，全部原值不變；建議先處理 7 筆明確戶外與 2 筆明確室內的影響分析，再決定騎樓／緣側兩筆邊界空間政策。這不是已授權改值，也不是 A5 全面結案。

## 驗收結果

| 門檻 | 結果 | 證據 |
| --- | --- | --- |
| 新回歸先失敗 | 修改前 6 fail／1 pass，確實拒絕舊 tag；修正後 9/9（含歷史入口） | [修改前](logs/red.txt.gz)、[修正後](logs/focused.txt.gz) |
| 獨立產品 oracle | 固定 Git engine＋唯一 tag 差異；3,834 生成案例、836 有序候選組合，0 超出核准差異；公開六輸出／selection／RNG 全相同 | [完整對照](acceptance.json.gz)、[摘要](logs/acceptance.txt.gz) |
| 其他場景、收藏與 transition | 154 個其他場景選項、12 舊 JSON／Markdown 收藏、24 transition、5 既有匯入來源通過 | 同上 |
| 西門町全身角色匯入 | 2 案例，三次重抽、換候選保持原人物、明確重新匯入、JSON／Markdown 回存通過 | [匯入結果](imports.json.gz) |
| 三批 A5 原工具回放 | CRT 3,834＋2 匯入、commercial 3,804、首批 1,740，0 oracle mismatch；原工具及預期未改 | [CRT](history/crt.json.gz)、[CRT 匯入](history/crt-imports.json.gz)、[commercial](history/previous/commercial.json.gz)、[首批](history/previous/first-a5.json)、[日誌](logs/history.txt.gz) |
| 同步／schema／歷史 ID | 1,050 records／1,050 歷史 IDs、八份生成物一致 | [同步](logs/sync-check.txt.gz) |
| Python／catalog 工具 | 41/41、32/32 | [Python](logs/python.txt.gz)、[工具](logs/catalog-tools.txt.gz) |
| 完整前端（Node 22.22.3） | 1,846/1,846；含三套 A 封存回放與 E 1,098 還原 | [前端](logs/frontend.txt.gz) |
| Prompt Quality | 754/754 | [品質](logs/prompt-quality.txt.gz) |
| strict／lint／build／資產 | 全部通過；strict 保留既有 J12 兩項精確例外，沒有新豁免 | [strict](logs/strict.txt.gz)、[lint](logs/lint.txt.gz)、[build](logs/build.txt.gz)、[資產](logs/assets.txt.gz) |
| 同 seed audit | count 200、prompt-quality-baseline；僅排除 runtime promptId 後完全相同；0 blocker／18 既有診斷 | [前](audit-before.json)、[後](audit-after.json)、[比較](audit-comparison.json) |
| 桌面／手機 | 1440×1000、390×900，共 50 項（目標 28＋一般 22）、14 張畫面；0 console／page error、0 外部 POST、無破圖或頁面橫向溢出 | [目標](browser-targeted/results.json)、[五工作區](browser-general/results.json)、[畫面檢視](browser-review.json) |

完整命令與時間見 [validation.json](validation.json)。前端總數與上一批不同，是 CRT 原九項移入固定 Git 隔離子測試，外層改為一個入口，加上七項新回歸；原九項與 commercial 原七項斷言都仍執行並通過，不是刪除歷史檢查。

## 來源、相容性與歷史保護

新 [review fixture](../../../scripts/lib/a5XimendingReview.json) 固定 pre-Ximending 完整來源與 generated 紀錄，並封存 11 筆待決來源。新 [inverse](../../../scripts/lib/a5XimendingHistoricalReplay.mjs) 核對完整目標紀錄後才精確還原 green_space，拒絕額外 tag、錯序、文字／alias 改動、missing／duplicate ID，保持傳入資料與預設 runtime cache。反例及與固定 Git 全庫相等均有回歸。

A～E 三套歷史入口先回復本批，再接原 CRT、commercial、三筆 inverse；正式資料不回退。CRT／commercial 測試取固定 `5110401f` 原檔在 current code＋pre-Ximending 副本執行；新產品 oracle 另外使用固定 Git 引擎，不依逆轉 helper 自證。新測試已由既有 npm test glob／CI 收入，Node 22 與 fetch-depth 0 沿用，無需修改 workflow。

[保護檢查](protection.json)：修改前 1,938 份 tracked 中 1,924 份不變，14 份既有檔只在本批 allowlist 內；461 份歷史檔案逐位元組保持，包括 A～E、前三批 A5 基準、原工具、報告與原規格。其他 20 個工作目錄的 140 份未提交檔案，以及其 HEAD／Git 狀態全部不變。index 為空，沒有 commit／push。完整新增與修改清單及雜湊見 [change-inventory.json](change-inventory.json)。

## 瀏覽器與邊界

URL：`http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1`。西門町在三景別驗證搜尋／選取、有序光線候選、隨機光線、六輸出、保存／reload／套用；整合自然站姿與全身角色→抓拍匯入、三次重抽、換候選／明確重匯入均通過。一般驗收另含角色卡／PAGE3 匯入、歷史 Markdown ZIP、舊已退役輸出保留、六輸出剪貼簿一致、DLL 明確帶入／草稿 reload，以及五工作區桌手機導航。

兩次腳本診斷已保留：[胸上景別不允許抓拍](logs/browser-targeted-diagnostic.txt.gz)、[景別為按鈕而非下拉](logs/browser-control-diagnostic.txt.gz)。修正的是驗收前置狀態與操作方式；正式功能未改。最終腳本明確確認胸上按鈕 disabled、選全身後 enabled，再完成抓拍流程。所有最終畫面已檢視，無新增裁切／控制重疊；本機服務已停止，5175 已釋放。

既有 audit 18 項診斷、strict 歷史告警與 build chunk 警告保留。缺 semantic 的舊／自訂 library 仍可能由 parking 推論得到 green_space，這是保留的相容退路；正式西門町以修正後 explicit semantic 為準。未執行外部模型出圖或遠端 CI。本批已獲使用者確認與限定交付授權；後續 A1 為獨立批次，P5b 未進入。前三批已交付 CI 的本次核對另存 [delivered-ci.json](delivered-ci.json)，不作本批成功 CI。
