# 目錄資料架構 C：JSON 正式來源切換（2026-10-25）

本機實作與 I1–I9 驗收通過，Cooper 已確認驗收並授權僅提交／推送本批 C。實際提交、推送與 CI 結果另行核對；D、E、P5b 未開始。下方未提交／未推送文字與證據保留為本機驗收當時狀態。

## 基準與授權

- 使用者已確認 Claude Code 與其他工作階段暫停共用範圍修改，只由本次 C 工作進行。
- 現有 main 工作目錄：`/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`。開始時乾淨，HEAD 與遠端 main 均為 `64870460e8a153a07baf953df0d6cf784ce2aca4`；保留原專案目錄及其他工作目錄。
- A 原封存 `0746b280cc9f5c00daec7dadc73329779ac658e9`、對齊 revision `2f56438804e751de4556060b293231966d6ea3b3` 均未改寫。
- 先以 B 工具在 repo 外重演，驗證 1,050 條／56 分類與 12 組 parser round-trip，然後使用該結果切換。舊引擎、來源與 metadata 可從固定 pre-C Git 取回；操作文件另保存[逐位元組原稿與 SHA](../../archive/2026-10-25-catalog-c/manifest.json)。

## 變更範圍

1. 正式來源改為 `knowledge_base/catalog/index.json` 順序指定的 56 份分類 JSON，加上 1,050 筆 frozen `id_registry.json`。Regional 的 inspiration 分開保存，生成時原樣組回 desc。manifest 圖片仍是衍生欄位。
2. schema、歷史登記、未知檔案、路徑、同分類名稱、manifest／圖片與 layout 覆蓋檢查全部先通過，才準備 database 與六份唯讀 Markdown。一般寫入錯誤會回復已替換檔；`--check` 完全唯讀並驗證七份輸出。測試覆蓋最後一筆來源無效、途中替換失敗、總覽漏列／重列／錯序及七份過期輸出。
3. 來源既有顯式 metadata 完整併入紀錄，刪除舊 item_metadata／outfit_preset_metadata。buildEntries 只有在 stableId 與 legacyIds 陣列同時存在時直接採用別名；舊 fixtures 的 fallback 保留。沒有移動推論函式、legacy 表或改寫 Prompt。
4. `catalog_history.py` 要求完整受信任基準 SHA。初次 C 只允許固定 pre-C 的直接引入，使用固定雜湊的 A inventory，並向 Git 中封存 A snapshot 核對。一般批次讀歷史 registry，不得因缺失退回 bootstrap。歷史／條目同刪、封印改動、非祖先、缺 Git object、自我基準及後續重用 bootstrap 均有失敗驗證。
5. CI 改用事件基準（push before／PR base，manual HEAD^）與明確 candidate，保留完整 Git 歷史；正式 schema/history/check 取代現行 HEAD 上的舊 Markdown rehearsal。本次未 push，因此沒有新的 C 遠端 CI 結果。
6. 更新 root AGENTS／README、Architect、套裝歷史計畫、四份撰寫指引、current state、engine architecture、五工作區驗證文件與姿勢 E8b 歷史來源。舊操作文件 14 份完整備份；A／B 歷史證據不覆寫。

## I1–I9 驗收

| 項目 | 結果與證據 |
| --- | --- |
| I1 控制項 | 219 controls／4,771 options，ID 與順序零差異；A 快照及 [切換比對](cutover.json) 通過 |
| I2 ID／別名 | 1,050 筆來源逐筆 ID、有序 legacyIds 與舊引擎 entries 相同；包含 19 筆 Negative；既有 37 stableId 與 36 legacyIds 來源未遺失 |
| I3 語意 | entries／catalog／controls 包含 inferredMeta／meta 以保留鍵順序的 JSON 序列化比較，零差異；`lyingSurface` 47 筆及所有資料欄位保留 |
| I4 完整輸出 | [前端全套](full-tests.txt) 含原 A、coverage 與 alignment 三套重播，3,251 次／2,851 個不同案例零差異；[Prompt Quality](prompt-quality.txt) 754/754 |
| I5 亂數／audit | count 200、seed `prompt-quality-baseline`；[前](audit-before.txt)／[後](audit-after.txt) 位元組相同，0 blockers／18 既有 diagnostics；完整 A 保存 selection 與 RNG 次數 |
| I6 還原 | 舊 locks、JSON／Markdown、收藏 reload／重新生成及全身角色匯入固定案例通過；不寫入真實收藏 |
| I7 前端 | [test](full-tests.txt) 1,823/1,823、[lint](lint.txt)、[build](build.txt) 通過；僅既有 >500 kB chunk 提示 |
| I8 資料／歷史 | [Python](python-tests.txt) 33/33、[Node 工具](tool-tests.txt) 10/10、[strict](integrity.json) 0 新 blocker／0 過期例外、J12 精確兩項保留；[七份產生物](data-check.json)、[公開資產](assets.txt)、[A seals](a-seal.txt) 通過 |
| I9 瀏覽器 | 1440×1000／390×900、五工作區、舊流程 [22 項](browser-regression/results.json)＋全身匯入 [22 項](browser-import/results.json)；16 張截圖已檢視，0 console/page errors、0 external POST、無溢出／破圖 |

剝除新舊資料的 stableId／legacyIds 後，JSON.stringify 保留鍵順序的位元組完全相同；六份 Markdown 分別經 sync parser 與 prompt_generator 共 12 次比較一致。generated Markdown 僅增加固定唯讀警語。

## 可重跑的正式路徑

先設定本次尚未提交 C 的受信任基準：

```bash
export REGISTRY_BASE_COMMIT=64870460e8a153a07baf953df0d6cf784ce2aca4
python3 scripts/sync_to_json.py --check --report-json
python3 -m unittest discover -s scripts/tests
node scripts/check_catalog_integrity.mjs --strict
node --test scripts/tests/catalog-integrity.test.mjs
node scripts/validate_catalog_cutover.mjs --source-sha 64870460e8a153a07baf953df0d6cf784ce2aca4
```

切換比對工具將固定 pre-C 的原引擎與資料讀至暫存目錄，使用舊引擎編譯舊資料，避免新規則影響參考端（舊來源已有一筆同時具兩欄，但當時仍補 rawZh 別名）。測試不重錄 A，不改產品資料。C 提交後本機必須選擇已包含 registry 的歷史提交；上面的 bootstrap 不可持續沿用。其他全套命令依 root AGENTS 與 [catalog 操作流程](../../../knowledge_base/catalog/README.md)。

## 自訂 library 清點

搜尋所有 getKnowledgeBaseSnapshot 與複製後加入分類的使用點：只需在 `engineSubjectKeyLightCompatibility.test.js` 新複製的 unknown 條目刪除 stableId／legacyIds；原 sourceRow 不刪。`shibuyaCrowdScene.test.js` 修改既有 en、`sceneIntegratedAssemblyTestSupport.js` 與 `shirtBlackBottomTestSupport.js` 的既有替換資料、catalogCorpus 與 A snapshot 測試都保留。新增兩項 engine 回歸測試涵蓋改名／重排不發新別名、明確空別名及 stableId-only／舊資料 fallback。

## 保護與限制

- 其他工作目錄 140 份未提交檔案雜湊不變；main 變更僅在本次檔案清單。見 [保護檢查](preservation.json)、[交付檔案清單](delivery-allowlist.json)。沒有 stage、commit 或 push。
- sync 的回復保護針對一般驗證與 I/O 失敗；七檔替換不是斷電原子交易。程序或電源中斷後重新 sync/check，不提交部分輸出。
- ID 登記可擋 ID 刪除、重用、非法狀態與初始來源改動，無法判定同一 ID 是否被人改作不同語意；仍須 diff 審查。
- 本機自動與瀏覽器驗收不代替使用者驗收或遠端 CI。沒有付費出圖、provider 呼叫、部署或使用者資料遷移。

## 使用者驗收與交付授權（2026-10-25）

Cooper 已確認 C 驗收通過，授權只提交並 push 本報告清單內的 C 資料、程式、文件、驗收工具與 CI 設定，並確認該提交 CI。其他未提交內容保留。交付前核對 main 與 origin/main 均為 `64870460e8a153a07baf953df0d6cf784ce2aca4`，重跑正式來源及 strict 檢查；不重錄 A、不進入 D、E、P5b。`delivery-allowlist.json` 的 notStaged 與 preservation 的 stagedFiles 是本機驗收時點紀錄；Git 交付依實際提交核對。
