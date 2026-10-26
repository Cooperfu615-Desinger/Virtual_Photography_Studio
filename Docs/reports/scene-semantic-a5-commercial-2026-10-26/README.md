# A5：11 筆 commercial 修正與 4 筆保留（2026-10-26）

Cooper 已確認本批驗收通過，授權只提交並 push 本次資料、文件、回歸案例與驗收工具。實際提交、推送與該提交 CI 結果另行核對，不將授權當成已成功交付。以下驗收數值與未暫存／未提交描述保留本機驗收當時狀態。基準為已核對 GitHub main 的 `22d1103e2f88984af7ed33249b08b4e2729ba466`。工作目錄為既有 main 的 `/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`，未切換或改動原專案目錄的其他分支。

## 核准結果與資料範圍

依[規格](../../specs/scene-semantic-a5-commercial-v1.md)及[逐筆決策](../../decisions/2026-10-26-a5-commercial-review.md)，只移除 11 筆 `meta.semantic.tags` 的 commercial：榻榻米房間、廢棄校舍保健室、無人月台長椅區、電車正面長椅、擁擠電車、目黑川櫻花隧道、臥室窗邊、英式小旅館房間、黑膠聆聽角、女高生房間、狹小都會旅館房間。

試衣間、酒吧二樓包廂、八公商業立面、歌舞伎町販賣機四筆保留 commercial。CRT outdoor 保持原狀、另批處理。small 命中 mall 只說明歷史來源，實際商業語意以原文與核准判準逐筆決策；旅館客房保留 hospitality。

正式資料只變動四份 Locations JSON（其他專屬、地下廢墟、城市、生活感室內）與生成 database。原文、ID、有序 aliases、列序、其他 tags、lyingSurface、registry／index／schema、六份 Markdown、legacyMappings、圖片及 production engine／renderer／codec／UI 均保持。未進入其他內容項目或 P5b。

## 獨立版本對照

[驗收工具](../../../scripts/scene_semantic_a5_commercial_acceptance.mjs)從固定 Git archive 載入前版引擎，另外只對其記憶體資料做 11 個核准移除作為 oracle；當前完整 stable prompt 必須等於該 oracle，並再對照原版只允許精確核准 metadata 差異。僅排除最上層動態 id／date，不遮蔽其他欄位。

- **12,540 組有序候選**：15 場景 × 11 景別 × 全無／有效屬性 × 38 環境光狀態；場景、環境光、主體光及支撐物候選 ID／順序完全一致。
- **3,804 組生成對照**：一般單人、雙人、額外隨機種子、全部其他場景、986 既有多模式案例及 170 匯入案例。1,599 組完整資料只有核准場景 metadata 差異；公開六輸出狀態與文字、selection、summary、RNG 均 0 差異，oracle mismatch 為 0。包含不適用輸出的既有空值狀態。
- **144 個未修改場景選項**逐筆保護，包括四筆保留項目、CRT、前批三場景與全無選項。
- **45 份前版 JSON／Markdown 收藏**：原文字及 ID 保留；codec 的預設值正規化以前版 codec 為對照，重新解析的 structured 只接受核准 metadata 差異。Markdown 沿用原解析限制，不把所有投影短句宣稱可無損逆推。
- **150 組 UI transition**：切換場景與套用收藏、隨機／全無／有效／不相容光線，前後結果相同。直接引擎明確鎖值與 UI 可用性清除政策各自保持。
- **5 組真實匯入 API 來源流程**：全身角色來源、重抽、明確重新匯入、來源切換、重載與拒絕無效資料，與前版相符。

[逐案證據](acceptance.json.gz)保存前後 SHA、差異路徑、候選 SHA／數量與舊收藏；[驗收摘要](validation.json)彙整結果。[固定案例](../../../scripts/lib/a5CommercialReview.json)保留每筆永久 ID、原文、判斷理由及 before／after tags。

## 歷史與其他工作保護

A～E 原始 baseline、manifest、generator seals 及前批 A5 規格／工具／報告證據不回寫。新增 [commercial inverse](../../../scripts/lib/a5CommercialHistoricalReplay.mjs)，先還原本批 11 筆，再交給未修改的前批三筆 inverse。缺 ID、重複 ID、額外 tag、四筆保留資料異動均拒絕；不修改正式 runtime cache。六份既有歷史測試只換輸入 helper，舊預期值保持。

完整前端包含 A 三套 **3,251 次回播**與 E **1,098 次還原**。另以[隔離歷史工具](../../../scripts/scene_semantic_a5_commercial_history.mjs)還原本批 database／四份 JSON，在當前程式上重跑未修改的前批 A5 驗收：**1,740 組，0 oracle mismatch**，仍得到該批原有 452 組資料差異與 0 RNG 差異。[本次重演證據](previous-a5-replay.json.gz)另存，不覆寫前批產物。

[保護報告](protection.json)：比對原有 1,812 份 tracked 檔案，只出現 15 份核准 tracked 變更；另保護 20 個其他既有工作樹，其中 17 個含未提交內容，共 **140 份檔案 SHA 不變**。**294 份歷史檔案 SHA 不變**。Git index 為空，未暫存。

## 本機驗收

| 檢查 | 結果 |
| --- | --- |
| 新增專用回歸 | 7／7；修改前 1 通過、6 因尚未修正 tags 而預期失敗 |
| 完整前端（CI 同版 Node 22.22.3） | 1,844／1,844 |
| Prompt Quality | 754／754 |
| Python | 41／41 |
| CI 三份 catalog 工具測試 | 32／32 |
| schema／同步／歷史 ID | 1,050 筆、8 份生成物通過 |
| strict integrity | 0 blocker／0 stale，原 J12 兩項例外保持 |
| 同 seed 200 strict audit | 0 blockers／18 既有診斷；只排除 findings[*].promptId 後前後完全相同 |
| lint／build／公開資產 | 通過；build 保留既有 >500 kB chunk 提醒 |
| 瀏覽器 | 116 項通過、20 張截圖檢視 |
| 檔案保護／文件連結／diff | 通過；未提交、未推送 |

測試紀錄見 [logs](logs/)。初次用 Node 25 執行全套時，兩個既有 test runner 格式斷言期待 TAP 的 `# pass`，但該版本預設輸出不同；[該次失敗紀錄](logs/frontend-node25-diagnostic.txt)保留，不當作通過證據。最終以 CI 相同的 Node 22 執行，[完整紀錄](logs/frontend-node22-final.txt)為 1,844／1,844，沒有修改 runner 或依賴。其他本機資料／prompt／工具檢查使用 Node 25.8.2，瀏覽器通用／15 場景腳本使用環境 Node 24.19.0，姿勢補驗使用 Node 22。這不宣稱所有 Node 版本皆通過。

[audit 原始前版](audit-before.json)、[原始後版](audit-after.json)保留動態 ID；[正規化比較](audit-comparison.json)明列唯一排除路徑，不能宣稱原始 JSON 逐位元組相同。前批報告中的擴大 scripts audit fixture 既有問題不在此次 CI 三份 catalog 工具範圍，本批未擴大修復或重跑該非必要套件。

## 瀏覽器與畫面

URL：`http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1`；桌面 **1440×1000**、手機 **390×900**，獨立 browser context。沒有登入、付費出圖或外部 POST；console／page error、破圖、document 水平溢出皆為 0。

- [15 場景專用驗收](browser-targeted/results.json)：90 項，逐筆選取、與修改前有序候選比較、全無／隨機生成六輸出、實際收藏落盤、重載與套用；8 張截圖。
- [通用工作區驗收](browser-general/results.json)：22 項，五工作區、角色／場景匯入、抓拍、舊 JSON 與 Markdown ZIP、六輸出複製、DLL 明確帶入與草稿重載；10 張截圖。通用匯入互動於桌面執行，五工作區／六輸出及 DLL 另覆蓋手機；不宣稱每種通用互動都在兩尺寸重跑。
- [整合姿勢補驗](browser-pose/results.json)：4 項，桌手機在已修正的臥室場景選自然站姿、生成及收藏重載／套用；2 張截圖。沿用現有整合模式，沒有重啟 P5b。
- 原生選單沿用前批驗收方式：先確認 enabled，再發 input／change 並驗證 React 值；場景對話框、生成、收藏與工作區切換用真實按鈕操作。只在隔離 context 設定初始鎖值，不改應用程式以繞過檢查。長頁和輸出框內捲動維持原設計。

本批只有語意標籤變更，沒有視覺設計變更或外部模型出圖品質驗收。

## 重跑與後續

```bash
export REGISTRY_BASE_COMMIT=22d1103e2f88984af7ed33249b08b4e2729ba466
python3 -B scripts/sync_to_json.py --check --report-json
node scripts/check_catalog_integrity.mjs --strict
node --test webapp/src/lib/engine/sceneSemanticA5Commercial.test.js
node scripts/scene_semantic_a5_commercial_acceptance.mjs /tmp/commercial-acceptance.json.gz
node scripts/scene_semantic_a5_commercial_history.mjs /tmp/previous-a5.json
# webapp/ 下使用 Node 22 執行 npm test；其他全套依 root AGENTS。
# 啟動 5175，PLAYWRIGHT_MODULE 指向已安裝 Playwright：
node scripts/catalog_baseline_browser.mjs 'http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1' /tmp/commercial-general
node scripts/scene_semantic_a5_commercial_browser.mjs /tmp/commercial-scenes
node scripts/scene_semantic_a5_commercial_pose_browser.mjs /tmp/commercial-pose
```

本次依 [交付清單](delivery-allowlist.json)限定提交；[提交前檢查](delivery-checks.json)記錄與已驗收版本的雜湊比對及文件狀態更新。原始 change-inventory.json 保留本機驗收版本，資料／程式／測試與驗收證據不重新產生。CRT 必須另批明列光線／服裝／支撐物與歷史鎖值契約；其他內容問題及 P5b 維持暫緩。
