# Phase 4 A2 第二批：40 筆套裝控制語 v1

狀態：2026-10-27，Cooper 已確認本機驗收通過，授權限定提交並 push 本批 40 筆套裝的資料、程式、文件、基準、回歸案例與驗收工具；實際 Git 與 CI 結果另行核對。舊 Markdown 還原、特殊穿搭及 runtime 配色句另批，其他項目與 P5b 未授權。

## 範圍與責任

可信 main 與歷史 ID 基準為 `048a2348869c9348d18f4e0b71d4ceed92c69232`，即已交付的 A2 第一批。正式來源只修改套裝分類中目前含 `controlled by` 的 40 筆。ID、legacyIds、名稱、desc、順序、semantic、圖片及原有 metadata 保持；修改前完整英文追加為最後一個 top-level `legacyPromptAliases`。其餘 18 套裝、全無、24 連身、特殊穿搭、角色卡與其他分類不改。

21 筆通用配色沿用原路徑：主色作用方式、雙色條件、只選對比色時的既有結果保持，不建立新部位目標。19 筆已有 colorMode 的套裝，把原本會被英文解析的主色／對比色 target 移到有序 `meta.colorTextBindings`。每項為 channel（primary／contrast）、target（原有英文目標）與 omitForPrimaryMaterial（既有材質色票路徑是否略過此綁定）；後者由固定 Git 的舊 strip 規則逐筆核對，不是新配色政策。

`colorTextBindings` 描述既有實際輸出對應，與 `colorTargets` 的 fallback／locked 責任分開。只在明確選到有效色票時產生原有 `target set to color` 文字並保留 consumed flags；未選色保持安靜。沒有新欄位的歷史或自訂資料仍走原解析方式。通用材質處理、固定色、完整造型色系、上下身配色、可見範圍及外套投影函式不重寫；runtime 配色句的精簡另批。

固定色仍僅在 primary_contrast_locked 路徑使用。六筆該模式沿用原 locked targets／lockedOptional／fallback；「網狀蕾絲馬甲短裙長靴」雖有 locked targets，但原模式為 primary，本批不擅自啟動固定色。「粉紅哥德兔耳吊帶束身」的 cross decorations 對比色綁定與既有金屬 locked targets 重疊為已存在政策，本批原樣保留並記錄，不藉清除控制語改配色責任。

逐筆責任表見 [決策](../decisions/2026-10-27-a2-outfits-control-language.md)。結構化英文片語僅搬移原有目標；不補材質、圖樣、人物或任何新視覺事實。舊公開文字與已匯入全身人物快照不回寫；重新生成與明確重新匯入才使用新來源。Saved Cards 仍依 ID 重建目前 structured 資料，公開原文另行保持。

## 實作邊界

新增一個套裝配色綁定 helper，在既有 shared outfit builder 接入；只供上述 19 筆新欄位使用。既有字串解析 helper、renderer 壓縮規則、UI、storage schema、選值、RNG、主色／對比色／固定色選項及完整造型 runtime 句保持。schema 與 field_mapping 宣告新欄位，僅套裝分類可用。正式分類 JSON 經 sync 產生 Markdown 與 database，不能手改生成物。

特殊穿搭那 1 筆、runtime 配色句、其他 Phase 4、P5b 皆排除。

## 驗收方式

修改前保存 Git 基準、逐筆原件、同 seed/count audit 與其他工作區雜湊；先建立會失敗的聚焦回歸再改產品。

獨立 expected engine 從固定 Git 載入。只套核准 source/generated 差異；19 筆在舊 builder 還原原文、用原解析器處理已選顏色，僅移除仍未解析的已審查控制句；材質色票下原 strip 規則命中的控制子句整句移除，避免保留其無意義殘片。雙人以既有 `:a`／`:b` 後綴辨識同一來源；已匯入舊快照直接保留舊解析路徑。21 筆直接使用清理後來源。這個 oracle 不呼叫新配色 helper。比較六輸出全文、structured、summary、selection 與 RNG；特別保護已解析的主色、對比色、固定色、材質色與舊語意重疊。

矩陣涵蓋全 40 筆／全景別／無色／主色／對比色／雙色／全部有效色票與材質色票／固定色／完整造型與上下配色、雙人 A/B、固定車廂、外套開合、40 份舊 JSON／Markdown、舊快照重抽與新匯入、其他套裝及特殊穿搭保護案例。

A～E、A5、A1 與 A2 第一批封存不重錄。新 inverse 在隔離副本精確還原 40 筆、engine 接線及管理 schema，再接原歷史回放；本批 40 筆的額外文字、metadata、順序、缺 ID、重複 ID、混合來源及未審查程式差異一律拒絕。歷史原工具保持，正式產品另測新行為。

依 AGENTS 執行 sync／schema／歷史 ID／strict／Python 與目錄工具、前端完整測試、Prompt Quality、lint、build、200 / prompt-quality-baseline strict audit。診斷逐項比對，不為減少數字修改其他項目。桌面 1440×1000、手機 390×900 檢查六工作區、顏色、六輸出、剪貼簿、收藏、抓拍匯入與還原，阻擋付費服務請求。其他工作區與原封存檔比對保護雜湊。

## 舊 Markdown 的已知推測邊界

JSON 收藏保存完整選值；本批要求其選值、原輸出與舊抓拍快照保持。一般 Markdown 只保存公開文字與部分可選空值，沒有完整 lock 快照，現有解析器會從文字推測款式／顏色，不能視為 JSON 的等價保存格式。

固定 Git 的 40 份無色樣本中，原先 21 筆通用套裝無法由渲染後文字辨識，清理來源後可重新辨識同一已發行套裝 ID；A/B 鏡像欄位沿用現有解析行為。其中 8 筆原先已誤推測 red（例如 `tailored`／`layered` 含 red 子字串），現在這個誤推測值會從獨立上下身欄位轉到已辨識的套裝配色欄位。這是本批來源變動下既有啟發式問題的可見影響，不能稱為「Markdown 選值完全不變」或新的正確配色。

逐筆差異封存於 `scripts/lib/a2OutfitMarkdownRecoveryReview.json`；驗收要求公開原文保持、只允許這份精確差異，並與不含新 helper 的固定 Git oracle 一致。本批不修改 Markdown 解析器，也不藉測試把它宣稱為已修復；若需精確還原配色，使用 JSON。後續可另行核准文字色票比對／Markdown 完整選值保存，不併入本次 runtime 配色句工作。

[驗收紀錄](../reports/wardrobe-control-a2-outfits-2026-10-27/README.md)
