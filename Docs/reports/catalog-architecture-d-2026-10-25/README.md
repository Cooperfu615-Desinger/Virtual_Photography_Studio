# Catalog D：語意原樣搬移驗收（2026-10-25）

狀態：Cooper 已確認 D 驗收通過，授權只提交並推送本批 D，完成後核對對應 CI。下方保留本機驗收時的證據；授權不代表 Git／CI 已成功。E 與 P5b 未開始，仍遵守 D 共用範圍凍結。正式來源維持 C 的分類 JSON，六份 Markdown 是唯讀生成總覽。

## 基準與授權範圍

D 開始及收尾唯讀確認 `main`、HEAD、origin/main 與遠端 refs/heads/main 均為 `17074fbe3850e2e9fea300b36697643913f707a1`。C 已交付，該提交的 [CI 40160077808](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40160077808)成功。Cooper 本輪確認 Claude Code／其他 session 暫停 D 共用路徑，僅本次修改。實際工作目錄為既有 main checkout `/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`；原專案與其他工作樹的 140 份未提交內容不動。

依 [v1.1 §6.1、§7](../../specs/catalog-data-architecture-v1.md)，先封存十份操作文件與逐位元組來源雜湊，再用固定 Git object 的原引擎取得實際 entries.inferredMeta。隔離候選全數通過 D schema 後才覆入 56 分類／1,050 筆，同步更新生成 database 與 runtime 後驗收。不是從 final meta 倒推，也沒有另寫一套推論規則。

## 實作結果

- 分類紀錄新增 `meta.semantic`，保存原有 keys、array/tag 順序、null、空陣列；原有 source meta、專用欄位、文字、ID、別名與列序不變。Negative 的 19 筆保留 conflictTags/useTags，沒有添加 tags。
- engine 僅更改 buildEntries 的語意底層來源，明確 semantic 優先，剝除容器後依原順序合併 source meta／專用欄位／有序 tags。缺少 semantic 的自訂與舊 library 保持 infer*Meta；不合法型別拒絕，明確空物件不推論。
- schema 為各分類封閉列舉語意欄位，各分區 enum 約束 tags；field_mapping 宣告新增路徑。完整性工具驗證語意底層、消費後欄位與 tag 次序，CI 加入 D 工具測試。
- 一次性工具只產生全新 repo 外候選，限制來源 SHA、來源雜湊、既有輸出與 semantic；常駐建議工具只比較副本，不寫檔或更動預設快取。固定 pre-D 零差異工具屬本次遷移驗收，不鎖死未來獲准產品變更的 CI。
- 操作流程、四份 authoring guide、架構、AGENTS、狀態與規格同步更新。姿勢去向文件只追加 D 追溯補註，原全文保持為 byte prefix；沒有姿勢狀態或內容調整。
- [18 筆凍結問題](../database-analysis-2026-10-11/frozen-known-issues.md)含倫敦 subterranean 與重新確認的 17 筆 small→mall commercial；保留原值。沒有新增 strict 允許項目。

## I1–I9 驗收

| 不變量 | 證據與結果 |
| --- | --- |
| I1–I3：ID／別名／順序／語意 | [semantic-validation.json](semantic-validation.json)：56 分類、1,050 筆 source、generated fields、compiled entries/catalog/inferredMeta、controls 均零差異；registry/index/兩份 manifest/六份 Markdown 共10檔 hash 不變。 |
| I4：完整輸出 | 前端完整 suite 執行既有三套 A 重播，3,251 次／2,851 不同案例零差異（含六輸出、selection、structured、摘要）；[Prompt Quality](prompt-quality.txt) 754/754。 |
| I5：亂數與 audit | A 重播比對 RNG 呼叫次數；[before](audit-before.txt)與[after](audit-after.txt)的 200／prompt-quality-baseline strict audit 逐位元組相同，0 blockers／18 既有 diagnostics。 |
| I6：還原與 import | 舊 library 聚焦20/20，A payload／JSON／Markdown round-trip 全過；瀏覽器舊卡還原、全身角色匯入、重抽不換人、重新匯入、reload、六輸出與 DLL 傳遞皆過。 |
| I7：前端 | [完整測試](frontend-tests-final.txt) 1,828/1,828；[lint](lint-final.txt)及[build](build.txt)通過。build 保留既有 >500 kB chunk 警告。 |
| I8：資料與護欄 | [Python](python-tests.txt)36/36、[Node工具](tool-tests.txt)15/15；[sync歷史驗證](sync-check.json)用 C 正式 registry 檢查1,050歷史ID與7輸出；[strict](integrity.json)0 blockers／0 stale，保留2項J12，4類既有possible。207公開資產通過。 |
| I9：瀏覽器 | 1440×1000、390×900；[舊流程22項](browser-regression/results.json)＋[全身匯入22項](browser-import/results.json)，16張畫面檢視。五工作區及下游無新溢出／遮擋／破圖，errors與externalPosts均0。 |

A 原始及 alignment seal 通過，A/B/C 封存內容與所有非本次 allowlist 的追蹤檔案維持雜湊。見 [保護檢查](preservation.json)、[D 前文件歸檔](../../archive/2026-10-25-catalog-d/ARCHIVE_INDEX.md)及[搬移來源／候選雜湊](materialization-manifest.json)。兩份舊 library 測試只在副本移除 semantic 以保留真實歷史推論路徑，沒有更改預期輸出或封存案例。

## 重現與限制

依 [catalog 操作流程](../../../knowledge_base/catalog/README.md)設定 REGISTRY_BASE_COMMIT 為上列完整 pre-D SHA，再執行 sync --check、Python／Node工具、strict、前端 test／prompt-quality／lint／build 及 audit。Node25 本機完整 suite 使用 `NODE_OPTIONS=--test-reporter=tap npm test`，與 C 同環境；CI 仍使用 Node22。D 比對命令：

```bash
node scripts/validate_catalog_semantics.mjs --source-sha 17074fbe3850e2e9fea300b36697643913f707a1
node scripts/suggest_catalog_semantics.mjs 'locations:城市與社群感-urban-social-snapshots:戶外-倫敦排屋街道:41'
node Docs/reports/catalog-architecture-d-2026-10-25/measure-known-issues.mjs /private/tmp/new-catalog-known-issues.json
```

最後一項只用記憶體副本診斷、寫入全新 repo 外輸出；[量測結果](known-issues.json)保留完整候選 ID。已知問題只測一般單人全身景別的相容場景屬性，不宣稱涵蓋所有鎖值與模式；後續修正需獨立規格、候選／輸出差異與驗收。本次無付費模型出圖，亦不涉及外部模型的影像品質驗收。

本次 CI 設定已完成本機對應檢查，尚未提交／推送，因此沒有 D 遠端 CI run；C 的已成功 CI 不等同 D CI。交付檔案及非本次內容保護見 [allowlist.json](allowlist.json)。

## 交付授權補註

2026-10-25：Cooper 已驗收並授權提交／推送本批 D。提交前核對原 134 份 allowlist 雜湊與其他 140 份未提交內容，遠端 main 仍為 pre-D `17074fb`。本輪只補目前狀態、規格與本報告的驗收授權文字，更新交付清單雜湊；程式、資料、驗收工具、CI、封存基準與既有測試證據不再修改。最終提交 SHA 與 CI 連結在交付回報中核對，不為把自身 SHA 寫回文件而追加循環提交。

交付檢查移除 build／lint 日誌及 semantic-validation JSON 的行尾空白或多餘結尾空行；檢查結果與資料值不變，原始執行輸出仍保留於本機驗收暫存。
