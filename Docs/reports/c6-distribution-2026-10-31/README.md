# C6 盤點文件、保留理由與唯讀量測工具驗收

日期：2026-10-31。基準 `bfa5311d13d738bfb42051f69dc656880d08b6e9`；本機驗收通過，使用者已授權限定提交／推送；CI 與部署於交付時另行核對。

本批建立三層盤點：正式目錄筆數、由介面來源推導的可選內容、固定情境下的實際抽樣。資料、Prompt、ID、選值、收藏、UI 與抽樣規則完全保留。工具不被產品載入，不使用網路或生成模型，不內建寫檔入口。

## 量測結果

| 主題 | 正式／現行內容 | 觀察與決定 |
| --- | --- | --- |
| 姿勢 | 指定動作54；42 accepted、12 pending | 一般隨機池38，另外4筆躺姿需鎖定相容場景；保持現況 |
| 地點 | 155列含1全無；154內容；自然類12 | 三組各1,000次均覆蓋154地點，自然類合計244/3,000；不改權重 |
| 季節 | 36環境光；英文季節詞命中4 | 普通地點詞命中1；兩個季節固定構圖另計，不以關鍵字少判定缺陷 |
| 穿搭 | 539列／516非全無／23全無 | 59套裝與24連身分開；特殊90、上衣45、褲33、裙31；外套22保留、UI18 |
| 角色 | 33卡；32明文成年東亞女性、1幻想角色 | 既有身份保持；膚質關鍵字分組可重疊，不作生圖或族群推斷 |

每筆 ID 與逐類細項在 [measurement.json.gz](measurement.json.gz)；解壓後為標準 JSON，無需重跑即可查閱。完整口徑與候選後續見[規格](../../specs/c6-distribution-inventory-v1.md)，保留決策見[決策文件](../../decisions/2026-10-31-c6-retention.md)及 [retention-decisions.json](retention-decisions.json)。

### 抽樣情境

| 情境 | 次數 | 核對結果 |
| --- | ---: | --- |
| full-random-a／b／c | 各1,000 | 各覆蓋154地點、36環境光、38個一般動作；全身＋指定動作隨機＋套裝隨機，並非UI全部隨機 |
| default | 1,000 | 保留原始createEmptyLocks；無指定動作或角色卡，套裝496／連身198／其餘306，最後一組不等於沒有穿搭單品 |
| special-outfit | 1,000 | 覆蓋90特殊穿搭；仍由原引擎決定其他選值 |
| indoor／outdoor | 各500 | 覆蓋各83／71地點、各18環境光；不以tag筆數代替選單筆數 |
| locked-bed | 500 | 42動作，含40次躺姿／四種躺姿；13次仰躺surface-only保留locationId none，不算床鋪失效 |
| 每輪合計 | 6,500 | 八個情境分開分析，不合併宣稱真實使用率 |

相同八情境與種子重跑兩次，兩份 JSON 共 510,985 bytes，逐位元一致；SHA-256 `7827efe23080d7d06735aeb1e3eaca201a65f420f5099705c55155a37922f344`。每輪皆核對581份已追蹤產品／知識庫檔案雜湊，前後相同。`repeatability.json`記錄個別情境的 count、seed、RNG 呼叫次數及完整輸出去除id／date後的雜湊。

有限抽樣中的未命中ID保留於unseen，不表示不可達。unique包含none／unset；有無具體動作、上身互動及舊poseBaseId分開。連身解析後可能移入dressId，工具保留兩個原欄位且另作套裝／連身合計。

## 驗收

| 檢查 | 結果 | 證據 |
| --- | --- | --- |
| C6聚焦測試 | 7/7通過 | tests-final.log.gz |
| 完整重跑 | 6,500×2次，JSON逐位元一致 | measurement.json.gz、repeatability.json |
| 正式來源與歷史ID | 唯讀sync通過，1,050 ID及8生成物一致 | sync.log.gz |
| 既有目錄工具 | 32/32通過 | catalog-tests-final.log.gz |
| 目錄strict | 0 blocking、0 stale；2既有允許例外保留 | catalog-strict.log.gz |
| 語法／文件／保護 | 見最終檢查結果 | final-check.json、protection.json |

新增工具測試覆蓋sentinel、重複ID、套裝／連身分組、文字選項、退役外套、關鍵字可追溯、UI來源漂移拒絕、非法CLI輸入、沒有寫檔旗標、輸入與產品不變，以及指定動作／連身相容欄位。這些測試檢查量測方法，不要求抽樣平均，也沒有改動正式內容使數字符合期望。

### 初次發現與修正

- 首次新測試將先前人工分析的穿搭數518當作預期，逐類加總得到516而失敗；正式資料為539列、23全無。已修正本批測試與文件，保留 `tests-initial.log.gz`，不猜測差額來源。
- 初次診斷欄位直接讀poseBaseId與outfitPresetId，會分別漏算已解析動作及連身。內部核對後改讀specifiedActionId所屬base，並合併dressId；補測試。有效兩輪量測均使用修正後工具。此錯誤未進產品、未成為正式基準；初次觀察摘要另存 `collector-correction.json`。
- 第一次目錄工具測試31/32：少設定既有流程要求的REGISTRY_BASE_COMMIT，strict子程序拒絕執行。補上本批審閱的完整main SHA後32/32通過，沒有改動舊測試或產品。原log保留 `catalog-tests-initial.log.gz`。

## 保護與限制

原5,023份追蹤檔，僅current_project_state.md新增本批進度，其餘5,022份保持；包含3,319份既有歷史報告。全部581份webapp/src／knowledge_base位元保持。其他20個存在的工作目錄、143份未提交檔及Git狀態保持；另1個登記但不存在的工作目錄未清理。完整原追蹤檔SHA保存在 `source-manifest.json.gz`，比對結果見 `protection.json`。

本批沿用承接main的moss-optional-lora工作目錄，使用者原路徑的其他分支內容未移動、清理或覆寫。使用者已授權限定stage／commit／push，CI與部署於交付時另行確認。

本批為離線診斷與文件，沒有產品或UI變更，未重跑前端全套、build、瀏覽器或完整歷史Prompt回放。既有原生下拉popup操作限制與C1未生圖限制完整保留；來源推導的介面可選數，不是新的瀏覽器或模型品質驗收。

艾爾莎隨機選取保持，PAGE2舊匯入、J12、P5b暫緩。後續內容擴充需另定需求、來源、ID與驗收；本批不建立自動擴充／刪除或平均配額。

## 重跑

使用既有Node22與依賴，從repository根目錄執行；工具本身只輸出stdout。可由呼叫端將結果導向新的/tmp路徑，勿覆寫本報告或任何歷史基準。

```sh
node --test scripts/tests/c6-distribution.test.mjs
node scripts/c6_distribution.mjs --inventory-only
node scripts/c6_distribution.mjs > /tmp/c6-run-a.json
node scripts/c6_distribution.mjs > /tmp/c6-run-b.json
cmp /tmp/c6-run-a.json /tmp/c6-run-b.json
export REGISTRY_BASE_COMMIT=bfa5311d13d738bfb42051f69dc656880d08b6e9
python3 scripts/sync_to_json.py --check
node scripts/check_catalog_integrity.mjs --strict
node --test scripts/tests/catalog-integrity.test.mjs scripts/tests/catalog-semantics.test.mjs scripts/tests/catalog-legacy.test.mjs
git diff --check
```

`--count N`可減少開發期抽樣；完整驗收使用預設6,500。未來Git HEAD改變會反映在輸出head；未來內容或UI改變應另建審閱與新證據，不要求不同版本的整份JSON相同。四份UI來源SHA不符時會拒絕量測，不應單為消除錯誤而更新SHA。

## 交付狀態與原始證據

使用者於本機驗收回報後授權限定提交／推送。本次只更新本報告、規格、決策及current-state四份文件的交付狀態；工具、政策、測試及全部封存證據保持。final-check.json、protection.json、source-manifest.json.gz與測量快照是原始本機驗收時間點的證據，不追寫授權或部署結果；其中文件SHA對應交付狀態更新前的原文。
