# A2 舊 Markdown 穿搭配色還原驗收

2026-10-27。本機驗收完成，待使用者確認；未 stage、commit 或 push，沒有本批新提交 CI。

## 結果與範圍

基準／最後核對遠端 main：`471115c08e4415643b8acbb87b7c2709f98e117c`。實作目錄為 `/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`，分支 `main`。原 Projects 目錄及其餘工作目錄只做保護核對。

40 份封存的無主色／無對比色套裝中，原還原有 20 份誤推色（18 red、2 white）；本批全部恢復為未指定，同時保留真正有部位證據的顏色。`tailored`／`layered`／`embroidered` 等子字串不再構成 red 證據，固定白圍裙／金屬細節、人物及場景顏色也不會染到其他衣物。

- 新增專用 `wardrobeColorRecovery.js`，由 `cardCodec.js` 的文字解析路徑接入。優先完整 GPT 的 Wardrobe、Woman 1／Woman 2，再依同衣物、主色／對比色／固定色、完整色票／材質句判定。雙人衣物及 resolved outerwear 後續辨識使用同一角色範圍。
- 原 JSON／Observation Capture metadata 仍具優先權。舊卡片公開文字保留，套用並重新生成時才使用修正後的選值。無證據／衝突值維持未知，不把所有真實顏色清空。
- 正式 catalog、ID、aliases、生成資料、engine／renderer、UI、依賴、儲存版本不改。一般未知顏色維持 raw 空字串；已由固定黑領帶規則明確判定的全無原樣保留。
- 完整 Markdown 選值快照、特殊穿搭來源及 runtime 配色句另批；其他 Phase 4、P5b 均未進入。

[規格](../../specs/wardrobe-color-recovery-a2-v1.md)／[決策](../../decisions/2026-10-27-a2-wardrobe-color-recovery.md)。完整檔案及雜湊見 `delivery-manifest.json`；只作審查清單，本批未執行暫存或提交。

## 自動驗收

| 檢查 | 結果與證據 |
| --- | --- |
| 新回歸先紅後綠 | 首輪 6/6 重現；最終新行為 18 項、回放反例 4 項通過。聚焦相容性組 108/108，涵蓋全部 40 套、所有可用色票／材質、上下身／鞋襪、雙人外套、衝突與固定細節。 |
| 固定 Git 生成對照 | 338 組六輸出／structured／selection／RNG 完全保持。 |
| 文字還原 | 378 份匯入只有核准的穿搭配色與必要角色衣物歸屬差異，0 範圍外差異；40 份舊 Markdown 的原公開文字保持。 |
| JSON 與抓拍 | 40 份舊 JSON、80 組舊／新抓拍快照精確保持，抓拍 Markdown metadata 仍優先。 |
| 前端完整測試 | 1,889/1,889。包含 A 封存回放及 E 1,098 舊映射還原案例。 |
| Prompt Quality | 789/789；新還原回歸加入既有品質命令，沿用 CI 接線。 |
| 同 seed strict audit | 200 組，`prompt-quality-baseline`；只排除 runtime promptId，前後逐項相同。0 blocker、18 既有診斷。 |
| 資料與工具 | Python 43/43、目錄工具 32/32，sync／歷史 ID／strict／public assets 通過。 |
| lint／build | 通過；建置保留既有大 chunk 提示。 |

固定 Git 對照與逐項變化：`acceptance/acceptance.json`、`acceptance/baseline-and-results.json.gz`。全套原始 log 見 `logs/`；大型 log 採無損 gzip。

## 歷史回放

新 inverse 只在隔離目錄還原 codec／package 與移除本批 helper，檢查全部來源及雜湊後才寫入；拒絕混合狀態、未知修改與 helper 污染，且可重複執行。新回歸檢查精確恢復同一個 `471115c` 基準；後續鏈接 A2 第二批／第一批及 A1／A5 原工具。

- A2 第二批原工具：8,611 案、0 oracle mismatch。
- A2 第一批原工具：3,545 案、0 oracle mismatch。
- A1 原工具：1,273 案，99/99 成年身份，66 份舊 JSON／Markdown 保護通過。
- 四批 A5：西門町 3,834、CRT 3,834、commercial 3,804、首批 1,740，原工具與核准差異均通過；保留每批原本允許的差異，不將 CRT 輸出變化誤稱為零差異。

E 的 historical prose expectedHash 仍代表舊 parser 行為，因此該測試透過隔離 codec 回放；E 的映射快照、case、hash 未修改。現行解析的正確性由本批新回歸及固定 Git 比對確認。`history/` 是本次執行結果，原 A～E、A5、A1、A2 歷史證據皆未重錄。

## 瀏覽器證據

URL：`http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1`。使用既有正確工作目錄服務、獨立儲存環境；不停止其他服務，不呼叫外部付費模型。

桌面 1440×1000、手機 390×900，共 28 項檢查與 26 張畫面：

- 舊 JSON 原文複製、ZIP 三卡匯入、單人無色與雙人四配色的套用／生成／收藏／重載；色票畫面呈現人物 1 淡藍／白與人物 2 紅色。
- 抓拍 Markdown metadata 精確保持、貼上雙人 GPT、空輸入停用、無法辨識輸入不套用。
- Prompt、角色、場景、DLL_PIC Pro、DLL_VIDEO Pro、Saved Cards 六工作區巡覽。0 console/page error、0 外部 POST、0 破圖／意外頁面水平溢位。

機器紀錄：`browser/results.json`；人工檢視紀錄：`browser/visual-review.json`。保留既有窄螢幕長頁面與內部文字預覽捲動；未改版面。

## 診斷與限制

驗收期間曾發現未知值直接寫 none 會影響既有 parser 消費者；回到 raw 空字串後，固定黑領帶已明確判定的 none 需另外保留。兩者均以既有測試及新回歸驗證。雙人外套後續 matcher 的跨角色覆蓋也已修正。歷史工具的封存檔複製接線及驗收環境的可信 ID 基準已補齊。瀏覽器補拍工具最初未涵蓋雙人控制項的人物前綴，調整 selector 後完成；這不是產品 UI 故障。初次診斷 logs 保留，不冒充通過紀錄。

舊純文字仍不能重建未輸出的衣物、沒有角色標記的歸屬，或原先隨機／全無／預設與明確選取的差異；不足以確認的上下身 palette 不猜測。既有連身同 ID 轉整合套裝及有效色轉套裝主色的規則保持。這次修正不是完整 selection snapshot 格式升級，也未進行外部模型出圖品質驗收。

## 保護與交付狀態

`final-protection.json` 核對 2,318 份原追蹤檔；其中 971 份歷史報告／baseline／seal 不變。其他 20 個工作目錄的 HEAD、Git 狀態、140 份既有未提交檔案雜湊保持。最後本機與遠端 main 仍為 `471115c`，index 為空。

本機程式與工具驗收完成，待 Cooper 確認。本批沒有 stage／commit／push／部署；新 CI 狀態須待日後另行授權提交後核對。
