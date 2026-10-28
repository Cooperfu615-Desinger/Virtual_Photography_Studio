# A2 舊連身純文字還原 v1

2026-10-28。固定本機／遠端 main：`2caa6fdcd2ab63931339ee3018ca52025d3cef3f`。Cooper 授權本批實作與完整驗收；不 stage／commit／push。

## 範圍

只修正無完整選值快照的 PAGE1 舊文字：連身辨識、單色與上下區域配色、必要的 A／B 歸屬、貼回／Markdown／ZIP 套用。保持公開原文、結構化優先權、現行引擎／投影、catalog／ID／schema／儲存版本／UI。胸上區域投影、其他 Phase 4 與 P5b 另批。

## 契約

1. 以相同人物區塊內完整現行來源或歷史 alias 確認正式連身。套裝與連身命中同一連身 ID 時，文字還原統一使用連身欄位；真正套裝／特殊穿搭的接管不變。不同連身來源或互相衝突的證據不按長度或陣列次序猜測。標準化不代表能辨識原使用者從哪個選單選取。
2. 單人只建立單人連身，明確雙人只建立其 A／B 連身；連身的共用／休眠重複命中不得覆蓋其他角色。無角色標記的雙人文字不猜 A／B。不擴充其他穿搭或人物解析。
3. 單色、材質與圖樣沿用既有完整衣物歸屬規則，回到 dressColor 欄位。無證據保持未知，不把固定細節或場景顏色當衣物色。
4. 接受完整的新 `dress palette from top to bottom` 與舊 `coordinated top-to-bottom palette`，依 upper/main dress area 與 lower hem or skirt area 的有序完整色名唯一對回既有方案。兩個裸顏色詞不足；缺半句、矛盾、重複 ID 對應、不支持色名都不猜。完整區域句不退化成 pink／blue 等一般色票，方案內無 ID 色塊保持原結構。既有選項完整配色句仍可用。
5. 同人物／同衣物證據優先。舊 Markdown 的完整 GPT 作連身還原依據；Z／MJ 不覆寫或拼湊該證據。其他解析延續原規則。
6. 貼回、舊 Markdown、ZIP 使用同一文字解析。只有確認合法連身上下配色時，舊 Markdown 銜接前批 restoringSelection 保留契約；不能全面放寬互斥。套用、生成、收藏、重載與再匯出保留有效來源，明確換裝／解除沿用前批。
7. 新版 PAGE1 快照、JSON 與抓拍 metadata 優先，未知／壞新版快照仍拒絕而不降級。舊卡公開主／衍生原文不重寫。未存資料、隨機與全無來源差異無法憑文字精確重建。

## 驗收

先建立失敗回歸。24 連身 × 40 色票、24 × 42 配色 × 新舊句型；貼回、Markdown／ZIP、A／B 對調／同款異色／不同款／混合真正套裝、未知與衝突證據。固定 Git 對比僅允許本批還原欄位差異，非穿搭與原公開輸出保持。相同原選值直接生成的完整物件／六輸出／RNG 零差異；還原後的生成用固定 Git 引擎和獨立預期選值驗證，不只驗欄位。

精確 inverse 在隔離副本回復本批後，執行前批 legacy-dress-restore 驗收及完整 A2／A1／A5 回放；未知、混合、缺檔與真實 checkout 原子拒絕。A～E 與前批封存不重錄。Node 22 聚焦、前端完整測試、Prompt Quality、lint／build、200 同 seed strict audit、sync／歷史 ID／strict／Python／目錄工具／assets。5175 桌面 1440×1000／手機 390×900 實際貼回、舊 ZIP、收藏套用與重載、抓拍、六工作區；零新 console／page error／外部 POST／意外水平溢位。

[決策](../decisions/2026-10-28-a2-legacy-dress-prose.md) · [報告](../reports/legacy-dress-prose-a2-2026-10-28/README.md)

## 操作路徑與限制

Saved Cards 現行 Import 選擇器只開放 ZIP；本批不新增單張 `.md` 的選擇介面。單張 Markdown 經共用 `parseExportedMarkdownPrompt` 驗證，ZIP 逐檔呼叫同一解析；瀏覽器驗證單張下載解析、ZIP 實際匯入及重新匯出。舊卡複製／下載的公開原文逐字保持；「套用目前預覽」沿用既有重新生成流程，因此不以整份預覽等於舊原文作驗收。非本批可還原欄位的既有文字辨識限制仍保留。

實作順序：先固定 main 與其他工作檔雜湊、建立失敗回歸；再修正 scoped 連身歸屬／配色；接到共用 parser 與合法配色的 restoringSelection；最後建立精確 inverse、固定 Git oracle、歷史鏈、完整測試及瀏覽器驗收。歷史 expectedHash／catalog／ID／engine 均不改。

工具：`scripts/legacy_dress_prose_a2_acceptance.mjs`、`scripts/legacy_dress_prose_a2_history.mjs`、`scripts/legacy_dress_prose_a2_browser.mjs`、`scripts/legacy_dress_prose_a2_protection.py`。聚焦測試位於 `webapp/src/features/saved-cards/legacyDressProseRecovery.test.js` 與 `legacyDressProseHistory.test.js`。

本機驗收狀態：固定 Git 6,120 次還原／8,172 次生成、1,979 前端、825 Prompt Quality、完整隔離歷史鏈及桌手機 68 項操作通過。使用者驗收、Git 交付與 CI 尚未進行；詳見本批報告。
