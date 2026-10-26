# A5：倫敦排屋、清澈海灣岩岸與草地樹木

2026-10-26。本批已完成實作與本機驗證，Cooper 已確認驗收通過並授權限定提交／push。實作驗收開始與完成時的本機 HEAD、origin/main 及 GitHub main 都是 `a9dd3616bc6596cdb199420f3189a420c6f1ed17`。沿用既有 main 工作目錄，其他 17 個工作目錄的 140 份未提交檔案逐檔 SHA-256 不變；228 份歷史證據亦保持原雜湊，見 [保護清單](protection.json)。沒有進入其他內容問題或 P5b。

## 結果與範圍

| 場景 | 唯一正式資料改動 | 一般單人全身的環境光候選，含全無 |
| --- | --- | --- |
| 倫敦排屋街道 | 刪除 `meta.semantic.tags` 的 `subterranean` | 5 → 19 |
| 清澈海灣岩岸 | 刪除 `meta.semantic.tags` 的 `commercial` | 19 → 17 |
| 草地與樹木 | 刪除 `meta.semantic.tags` 的 `commercial` | 19 → 17 |

海灣與草地的選單／隨機不再提供「城市夜間混合光」「城市高彩度夜色」。三者的主體光候選在全身條件維持 23 個；其他景別依原規則，66 組前後比較全部有序相等。名稱、英文、中文描述、ID、有序別名、順序、lyingSurface、index／registry、六份 Markdown、legacyMappings 與所有正式引擎／renderer／codec 均不變。正式資料只改兩份分類 JSON，並由同步工具產生 database.json。

倫敦文件舊有 `drainage pipes` 說法已勘誤：固定 pre-D 與 pre-A5 的英文都沒有該詞，成因是中文「地下室窗格」命中「地下」。D 歷史數值與 known-issues.json 原位保留，詳見 [勘誤與追溯](../database-analysis-2026-10-11/frozen-known-issues.md#2026-10-26-成因勘誤與-a5-限定修正)。

## 行為與相容驗證

[獨立對照工具](../../../scripts/scene_semantic_a5_acceptance.mjs)從固定 pre-A5 Git archive 載入舊引擎，另外只移除三個核准標籤作為預期結果。當前正式引擎、舊引擎原資料、舊引擎核准修正資料使用相同種子，排除的動態欄位僅最上層 id／date；逐一比較完整 selection、structured、summary、六輸出與 RNG 次數。

- 共 **1,740 組**：330 組三場景／11 景別／2 屬性／5 光線鎖值、120 組隨機種子、304 組其餘 152 個場景選項／2 景別、986 組既有多模式／代表案例。後者含雙人、角色卡、專用人物／穿搭、所有固定構圖、場景匯入與仰躺。
- **0 個超出核准差異**；452 組完整資料有變，其中 136 組公開文字有變。GPT、Z、MJ、Nano 各 136 組，胸上 135 組；全身角色照 0 組。其餘變動是場景語意或解析選值，不能宣稱全部輸出逐字不變。RNG 次數差異為 0。
- 66 組有序環境光與主體光候選比較；其他 152 個場景選項的候選池與鎖定場景生成逐項不變。整份 1,050 筆 database 與兩份來源 JSON 的差異精確限制為三個標籤移除。
- 6 份修改前 JSON 收藏及相同 Markdown 保留原文／ID；反序列化重建的 structured 場景資料只反映核准 tags。這 6 份 Markdown 都恢復原場景，另有回歸確認投影短句的既有解析限制不變。
- **引擎與 UI 的既有政策分開保留**：直接 codec／buildRestoreLocks 後呼叫引擎，明確舊城市光仍保留；PAGE1 的 transition 於切換場景或套用收藏時會清除不在候選池中的光線鎖值。原收藏本體不回寫。沒有新增 fallback 或修改 renderer。

[完整逐案資料](acceptance.json.gz)含 before／after SHA、差異路徑、六輸出變動欄位、候選 ID、固定舊收藏與 Markdown；[驗收摘要](validation.json)供快速核對。

## A～E 基準保護

沒有重錄或修改舊 baseline、manifest、generator seals、D／E 一次性工具或已交付報告 JSON。歷史 A／snapshot／MJ／澀谷雜湊測試改用 [精確反轉 helper](../../../scripts/lib/a5HistoricalReplay.mjs)，只在測試副本還原三筆已核准 tags；若正式 tags 不等於本批明確 after 值便拒絕。

原 A capture 工具固定讀取預設來源，因此在臨時目錄複製「當前程式＋只還原三筆 tags 的 database」形成獨立模組圖，仍用原工具與原始封存比較。不切換正式來源或污染執行中快取。A 三套 3,251 次歷史重播及 E 1,098 還原由完整前端測試通過；另以本批當前資料回歸和獨立 Git 對照驗證新產品行為。兩種證據不能互相替代。

直接以目前正式資料執行舊 A capture 或 D／E「遷移零差異」一次性命令會顯示預期產品差異；本批不將其改為通過，也不宣稱原命令仍零差異。重演原遷移須使用其固定歷史 checkout。日常操作見 [catalog README](../../../knowledge_base/catalog/README.md#a5-核准產品變更與歷史回播2026-10-26)。

## 本機驗收

| 檢查 | 結果 |
| --- | --- |
| 專用回歸 | 7／7；標籤與候選測試對精確 pre-A5 tags 先出現 2 個預期失敗 |
| 完整前端 | 1,837／1,837 |
| Prompt Quality | 754／754 |
| Python | 41／41 |
| CI 使用的三份 catalog 工具測試 | 32／32 |
| schema／歷史 ID／同步 | 1,050 筆及 8 份生成物通過 |
| strict integrity | 0 blocker／0 stale，僅保留 J12 既有兩項 |
| 相同 seed 200 strict audit | 前後逐位元組相同，0 blockers／18 既有 diagnostics |
| lint／build／公開資產 | 通過；207 檔、3,201,415 bytes；build 保留既有 >500 kB chunk 提醒 |
| 瀏覽器 | 42 項通過、16 張截圖檢視，見下節 |
| 檔案／連結／diff 檢查 | 其他未提交內容與歷史封存不變，連結與 diff-check 通過 |

測試與工具以 Node 25.8.2 執行；本機 Playwright 用環境預裝 Node 22.22.3。既有 CI Node 22 設定未改，本批尚未提交，因此沒有本批遠端 CI 結果。Functions／供應商程式未變，未進行付費出圖。

**擴大檢查有一項已確認的既有失敗**：額外執行所有 `scripts/tests/*.test.mjs` 為 48／49；`prompt_audit.test.mjs:153` 的 duo missing-label fixture 預期 2、實際 0。固定乾淨 pre-A5 main 的同一檔同樣為 16／17，失敗完全相同。該項不在 CI 的三份 catalog 工具門檻中，本批未更改它。證據為 [修改前](logs/preexisting-prompt-audit-before.txt)及 [修改後擴大檢查](logs/extended-tools-after.txt)。這個既有失敗不算本批新增回歸，也未宣稱擴大測試全部通過。

## 瀏覽器證據

本機 `http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1`，獨立 context，1440×1000 與 390×900。全部非 localhost POST 被阻擋，實際 0 次。console／page error、破圖與 document 橫向溢出皆為 0。

- [通用 22 項](browser-general/results.json)：Prompt 工作台、角色建模、場景建模、DLL_PIC Pro、Saved Cards；觀察式抓拍、舊 JSON 與 Markdown ZIP 匯入、六輸出複製、DLL 明確帶入與重載。動作姿勢是 Prompt 的整合模式，沒有重開 P5b。
- [專用 20 項](browser-targeted/results.json)：桌手機三場景選取、候選池、晴朗白日／隨機、六輸出、收藏實際落盤後重載／套用，以及倫敦城市光切換到自然場景時清除不相容值。
- 所有 16 張 full-page 截圖在上述兩個目錄；已檢視整體布局與三個手機場景面板的可讀尺寸。長頁與 Prompt 文字框保留既有捲動。
- 自動化對原生 select 報告選項未啟用，但 DOM 的 select／option 都確認為啟用；專用腳本改以原生 input／change 事件選值並核對 React 狀態。場景對話框、生成、收藏、套用及切換工作區仍透過按鈕操作；等待既有延遲儲存完成後才 reload，沒有改應用程式繞過驗收。

重跑：

```bash
REGISTRY_BASE_COMMIT=a9dd3616bc6596cdb199420f3189a420c6f1ed17 python3 -B scripts/sync_to_json.py --check --report-json
REGISTRY_BASE_COMMIT=a9dd3616bc6596cdb199420f3189a420c6f1ed17 node scripts/check_catalog_integrity.mjs --strict
node --test webapp/src/lib/engine/sceneSemanticA5.test.js
node scripts/scene_semantic_a5_acceptance.mjs /tmp/a5-acceptance.json
# 先啟動 5175 的本機 Vite；PLAYWRIGHT_MODULE 指向已安裝的 Playwright
node scripts/catalog_baseline_browser.mjs 'http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1' /tmp/a5-browser-general
node scripts/scene_semantic_a5_browser.mjs /tmp/a5-browser-targeted
```

## 修改清單與後續

正式變更只有城市／自然兩份 Locations JSON 及生成 database；其餘是 [規格](../../specs/scene-semantic-a5-three-locations-v1.md)、倫敦勘誤、現況／操作文件、新回歸與驗證工具、六份歷史測試的輸入重播接線、此報告與證據。沒有修改 CI、正式 engine／renderer、registry／schema、六 Markdown 或其他資料。

Cooper 已確認本批驗收通過，授權只提交並 push 本批資料、文件、回歸案例與驗收工具。僅依 [57 份交付清單](delivery-allowlist.json)提交；實際提交／推送與該提交 CI 結果另行查核，不以授權視為交付成功。`validation.json`、`protection.json` 與測試紀錄保留本機驗收當時的時間點與狀態。其他 15 筆 small／mall、CRT、J12、B3、其餘內容清單與 P5b 都維持另案。沒有以本批驗收取代外部模型的實際出圖品質驗收。

## 提交前核對

本輪僅更新交付授權文字及新增交付清單；資料、測試程式與工具和已驗收版本的 SHA-256 相同。既有完整驗收證據適用；提交前再核對同步／歷史 ID、strict、7 項專用回歸、文件連結與 diff，以及其他 140 份未提交檔案、228 份歷史證據。遠端 CI 須針對本次實際提交確認。`evidence-sha256.json` 索引驗收證據（不含自己與交付清單），交付清單則固定所有本批檔案雜湊（不含自己），避免循環雜湊。

暫存檢查另外移除五份純文字工具日誌的行尾空白／文末空行；測試結果與錯誤內容不變，原日誌 SHA-256 記於交付清單。程式、正式資料與 A～E 歷史封存未變。
