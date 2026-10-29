# C4 第二批驗收紀錄

基準 main `3fd6dd8491d98f817b2090b821ab120c45f32c70`。七筆中文名稱與六個舊映射目標，英文／ID／整理狀態與歷史基準保持。規格見 [C4 第二批](../../specs/c4-catalog-display-labels-v1.md)。

最終狀態：本機自動驗收與記錄範圍內的瀏覽器驗收通過；保留原生選單直接滑鼠操作限制。未 stage／commit／push。下方初輪失敗與授權等待為過程紀錄，以最後驗收表為準。

- 修改前固定 `before.json.gz`：558 組輸出／選值／RNG 與舊卡；1,098 組歷史還原結果。修改後第一輪相同。
- `focused.log` 保留初次回放銜接失敗證據；`focused-current.log` 為獨立新回歸。
- 同 seed audit：200／prompt-quality-baseline，前後記錄獨立保存。
- 共用歷史回放銜接待限定授權，現階段不可宣稱原 E／完整歷史鏈已通過。
- 瀏覽器證據與各門檻結果待完成後補記；不沿用上一批的通過狀態。

## 首輪歷史紀錄：尚未完成完整驗收

已通過：新回歸 4/4（558 組生成、1,098 組舊還原）、catalog 工具 32/32、Python 43/43、sync/check、strict integrity、207 公開資產、lint、build、正式產物初始化。200 同 seed strict audit 前後本文相同，0 blocker。完整前端本輪 1,984 通過／34 失敗；Prompt Quality 818 通過／21 失敗，不能列為通過。這些數量包含因回放初始化失敗而未展開的子案例，不與上一批測試總數直接比較。

失敗分布：舊 Phase 4 回放收到未逆轉的 database；catalog generator seal 收到改名後代表 fixture；catalog snapshot 在舊資料與新映射混用時出現別名差異；澀谷測試的整份資料 hash 尚未接入本批逆轉。負向測試另有拒絕訊息格式已於新工具修正；完整套件未重跑，保留首次失敗紀錄。未修改舊基準或放寬原斷言。

待授權的必要續作：共用回放／封存檢查入口接入本批精確 inverse，僅作用於隔離測試資料，保留原 fixture 與 hash；其後重跑完整前端、品質及歷史鏈。PAGE2 舊匯入產品功能仍不處理。自動審核拒絕過 page2AdultIdentityReplay.mjs 與 phase4Replay.mjs 的銜接修改，兩檔實際未改。

瀏覽器：正式產物 preview、1440×1000／390×900；七筆新名稱、濕髮與強烈風感切換、森林搜尋選取、新收藏與修改前收藏套用通過。六工作區 12 檢查通過，無 console/page error、意外水平溢位。已檢視手機髮型與桌面森林截圖。髮型 select 各一次自動選擇逾時，使用 change event 驗證後續，因此原生選單滑鼠操作仍未直接驗證；森林搜尋為實際按鈕操作。證據見 browser/。測試使用獨立瀏覽器，未操作使用者 Chrome。

產品資料、英文輸出及獨立相容案例完成，不等於整批驗收完成。未 stage／commit／push；其他未提交內容及歷史基準保持。

## 限定授權後最終驗收

Cooper 已明確授權「C4 必要的共用回放銜接」。修改僅限測試驗收：B3 使用後續層已準備的來源，PAGE2 回傳完整下游還原計畫；A／追加 A generator seal 以精確 C4 inverse 還原核准來源後檢查原雜湊。E 與 A snapshot 在隔離 runtime 使用相符的舊資料／舊映射；澀谷既有順序 hash 只反轉同 ID 的核准中文名。PAGE2 產品程式、原基準／manifest／snapshot 均不修改。

| 門檻 | 最終結果 | 證據 |
| --- | --- | --- |
| 本批獨立回歸 | 4/4，558 生成＋1,098 舊還原 | focused-current.log／before.json.gz |
| A／E／Phase 4 聚焦歷史與負向護欄 | 9/9 | history-focused.log |
| A 追加基準與負向 seal | 2/2 | alignment-final.log |
| 完整前端（固定來源最終重跑） | 2,032/2,032 | tests-stable.log |
| Prompt Quality | 853/853 | quality-final.log |
| lint | 通過 | lint-final.log |
| build／正式產物初始化 | 通過；33 角色、無反向 engine 依賴 | build.log／bundle.log |
| catalog strict | 通過 | catalog-final.log |
| 工具／Python／公開資產 | 32/32、43/43、207 assets | catalog-tests.log／python.log／assets.log |
| 同 seed strict audit | 200／prompt-quality-baseline，前後本文相同，0 blocker | audit-before.log／audit-after.log |
| browser | 桌手機七筆名稱、整理狀態、舊新收藏與六工作區通過 | browser/ |

前輪 tests-final.log 的三項失敗為追加 seal 尚未接入及工具修訂期間的隔離副本來源差異；修訂完成後固定全部程式再跑 tests-stable.log，已全數成功。初次失敗檔保留，不宣稱它們通過。

瀏覽器驗收後正式產品資料未再改動；後續只完成測試專用銜接。專用 5175 preview 已停止。原生 select 直接滑鼠操作未驗證的限制維持；change-event fallback 與實際按鈕／搜尋操作已分開記錄。

遠端 main 最後確認仍為 `3fd6dd8491d98f817b2090b821ab120c45f32c70`。保護紀錄見 protection-final.json。未 stage／commit／push，不宣稱 CI／部署已執行。用字統一、其他 C 類、PAGE2 舊匯入、J12、P5b 不併入。

交付補記：Cooper 已驗收通過並授權只提交／推送本批。上方未提交及審核等待為當時紀錄；瀏覽器原生選單直接滑鼠操作限制維持。CI／部署結果於本次交付另行核對。
