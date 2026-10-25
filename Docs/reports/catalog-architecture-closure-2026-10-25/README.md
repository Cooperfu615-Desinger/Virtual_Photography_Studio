# 目錄資料架構 v1.1：驗證護欄與交付文件收尾

2026-10-25，本機驗收通過；Cooper 已授權完成本批驗收與交付，僅提交／push 本批護欄、測試及文件。最終 Git 與 CI 結果於交付回報另行核對，不以授權代表交付成功。範圍由使用者「實作後續順序第一點」授權，止於兩項護欄、反例測試及交付文件。

## 基準與已交付狀態

本機 main／origin/main／GitHub main 同為 `2bd28c5a26ddcc748ed2af7c347a3874a192a4a0`。開始時 main 乾淨；沿用既有 main checkout，不切換原專案分支。對照 root AGENTS、current state 與 v1.1；本次不是 C／D／E 來源搬移，不改來源、引擎、fixtures 或同步輸出。修改限於 scripts 與下列文件；其他工作樹 140 份未提交檔案另取 hash 保護。

| 階段 | 已交付提交 | 對應 CI |
| --- | --- | --- |
| A | `8854670bb55a2be54c053a5c21a9a22a973819db` | [成功：40101509806](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40101509806) |
| B | `64870460e8a153a07baf953df0d6cf784ce2aca4` | [成功：40136849217](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40136849217) |
| C | `17074fbe3850e2e9fea300b36697643913f707a1` | [成功：40160077808](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40160077808) |
| D | `5e7ed02952ceea4a2f76b81583c5f783748ff308` | [成功：40185121595](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40185121595) |
| E | `2bd28c5a26ddcc748ed2af7c347a3874a192a4a0` | [成功：40192867913](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40192867913) |

CI 狀態本輪從 GitHub API 逐提交核對為 completed／success；E 最終品質、建置與 Pages 部署成功。原 A–E 報告中的待提交文字保留為歷史，不代表目前仍未交付。

## 兩項補齊

1. `scripts/lib/catalogTestExports.mjs` 以 espree AST 掃描正式 JS／JSX：阻擋兩個測試匯出的 named import／改名、re-export、engine namespace／wildcard、靜態路徑 dynamic import／require、成員存取，以及借道測試模組。掃描 196 份正式檔案，helper／fixture 命名不豁免；解析失敗為 confirmed。此為靜態架構邊界，不能宣稱分析任意動態計算的模組路徑。
2. `scripts/lib/catalogLegacyCollisions.mjs` 補獨立遷移表的來源 control 與 ID 所有權檢查，使用真正 runtime snapshot 的衍生值，不複製 slugify 或改動計算時機。9 張 option map、11 張 ID／label migration、2 張不產生 ID 的 Prompt aliases 均列出明確策略。204 次遷移輸入 ID 查核；原 9 個 option 自身 alias、27 個含角色欄位的歷史所有權配對合法。

合法跨欄位配對同時要求 pre-E 完整映射列、該列真正歷史輸入 ID 與 A 的來源控制項主 ID；兩份封存均固定 SHA。候選資料不能自行宣告豁免。新增現行 ID 占用舊鍵、替換已知配對目標、computed/source 漂移會阻擋。J12 allowlist 不變；同 ID 的內容是否改作他用仍須人工審查。

反例涵蓋原 `lying-supine-hands-by-sides` 手部衝突、各類 raw/computed ID、角色 A/B、label／substring 路徑、來源缺失、未知表與來源漂移；正例保護自身 ID、合法跨欄位與不同 control 的同字串。最初四項反例直接修改凍結 controls 而失敗，已改為 `structuredClone` 的記憶體副本，未放寬正式資料保護。

既有 CI 已執行 strict 及三份工具測試，因此本次不改 workflow。原 fixture 與 allowlist 不重錄。

## 驗證

本機 Node 25.8.2；完整前端以既有 TAP reporter 相容設定執行，CI 維持 Node 22。歷史 ID 基準固定為已交付 E 的完整 SHA。

| 驗證 | 結果 |
| --- | --- |
| 三份 catalog 工具測試 | 32/32 通過 |
| Python discovery | 41/41 通過 |
| sync `--check --report-json` | 1,050 歷史 ID 與八份生成物通過 |
| strict integrity | 196 正式檔／22 表；2 原 J12 allowed、0 blocking、0 stale、4 類原 possible |
| 完整前端 `npm test` | 1,830/1,830；含 A 3,251 次重播與 E 1,098 還原 |
| lint／build | 通過；保留既有 >500 kB chunk 警告 |
| 固定 pre-E 等價驗證 | source／computed／restore／compiled／controls／engine logic 全零差異，72 份原資料檔保持 |
| 同 seed 200 strict audit | 與 E audit-after.txt 逐位元組相同；0 blockers／18 既有診斷 |

執行：

```bash
export REGISTRY_BASE_COMMIT=2bd28c5a26ddcc748ed2af7c347a3874a192a4a0
node --test scripts/tests/catalog-integrity.test.mjs scripts/tests/catalog-semantics.test.mjs scripts/tests/catalog-legacy.test.mjs
python3 -B -m unittest discover -s scripts/tests
python3 -B scripts/sync_to_json.py --check --report-json
node scripts/check_catalog_integrity.mjs --strict --json
node scripts/validate_legacy_mappings.mjs --source-sha 5e7ed02952ceea4a2f76b81583c5f783748ff308
node scripts/validate_prompt_logic.mjs 200 prompt-quality-baseline --strict
# 在 webapp/ 執行
NODE_OPTIONS=--test-reporter=tap npm test
npm run lint
npm run build
```

機器可讀摘要與保護查核見 [validation.json](validation.json)。本次沒有使用者可見變更，未另跑瀏覽器、付費生成或部署；E 原有的瀏覽器驗收保持為其交付證據。

## 變更與邊界

- 工具：`scripts/check_catalog_integrity.mjs`、`scripts/lib/catalogLegacy.mjs`、新增兩個 guard 模組。
- 測試：`scripts/tests/catalog-integrity.test.mjs`、`scripts/tests/catalog-legacy.test.mjs`。
- 文件：current state、v1.1 規格、catalog README、E 報告狀態與本報告；日常 registry 基準更新，固定 pre-D／pre-E 歷史重播 SHA 保留。
- 正式目錄資料、八份生成物、引擎／renderer、schema／registry、封存與其他工作樹未提交內容不變。未修改姿勢去向文件的內容或狀態；18 筆語意問題、J12 決策、B3 與 Phase 4 仍另案，P5b 未開始。

## 交付授權與提交前驗收

Cooper 授權「先完成本批護欄的驗收與交付」。重新核對遠端 main 仍為 `2bd28c5a`，工作區只有本批內容；工具測試 32/32、同步與歷史 ID、strict 再次通過，196 正式檔／22 表，仍為 2 J12 allowed、0 blocking／stale。其他工作樹 140 份未提交內容逐檔 hash 不變，正式資料／引擎／封存不變。

本輪只更新交付狀態及加入 [13 份交付清單](delivery-allowlist.json)，程式與測試未再修改。既有完整前端／Python／lint／build／等價／audit 的本機驗收證據適用；遠端 CI 將對實際提交重新執行。交付清單保存其餘 12 份檔案的 SHA-256，不包含自身 hash。只提交清單列出的路徑，保留其他未提交內容；P5b 暫緩，Phase 4 未開始。

本節為提交前紀錄。最終提交 SHA、推送與 CI 結果在交付回報確認，不為把自身 SHA 寫回同一提交而追加循環提交。
