# Phase 4 A6 光線相容 v1

2026-10-28。接續已驗收 A5，可信 Git 見 [review](../reports/phase4-completion-2026-10-28/a6/review.json)。範圍為原報告 C3–C6 的規則缺口，不擴充新場景／新光線或修改光線文字。

## 相容責任

14 筆真實室內棚景與 6 筆地下場景，在一般候選／隨機生成時先排除自然、窗、日光環境；subject light 同步排除自然／窗／日光。棚景再排除戶外、濕地反射與斑駁樹影。保留六筆 source-pinned independent key 的既有豁免及原 indoor/outdoor／景別限制。

不能只看到 studio 就套用新限制：全無位置帶有歷史 studio metadata，Hallstatt 戶外也有 studio 標籤。本批限定非全無、室內且非戶外的棚景，不因此誤擋戶外自然光；不順手改 Hallstatt 語意。地下用 subterranean／underground 精確標籤。

漸層／多色塊兩筆只追加 `studio_lighting_scene`，保留原文與所有其他欄位，使三款棚光可選；不標為 solid_color_studio，不把漸層聲稱為單色。

固定構圖（單人）UI 與 resolver 共用實際固定場景作光線相容依據，忽略被接管的普通場景／屬性。固定景別時採同一個全無 framing metadata；允許景別變化的構圖沿用已選景別。非運輸八組介面只列出可實際解析的光線；車站／車廂六組仍保留所有手動光線選項與 explicit lock 優先，隨機採實際場景相容。雙人不啟用固定構圖。

## 舊值與輸出

一般 engine 明確光線鎖值仍優先，不以新候選規則強制改寫歷史輸入。UI 的既有 transition 會清掉不可用選值，套用後重新生成依目前規則；不宣稱不相容舊鎖值無損遷移。存檔公開原文／完整快照原件不重寫。抓拍已凍結來源維持既有契約。

改動候選可改變 RNG 與後續選值；不更改 renderer 文句、角色、配色、身分或 ID。有效手動光線不被換值、非目標場景／雙人固定控制／運輸手動輸出與歷史來源相同，除明列新候選的隨機影響。

## 驗收

固定 Git 前後矩陣記錄全部場景與固定構圖的 ambient／subject 候選有序 ID；驗證排除集合、兩棚新增集合、六獨立主光保留、全無／Hallstatt 保護。每個固定構圖 UI 可選光線直接生成不得改選；一般明確舊鎖值及運輸手動例外保持。新候選隨機生成不得選出禁止來源；舊卡 JSON／Markdown／ZIP 原文與 snapshot 保持。

完整前端／品質／lint／build／sync／schema／歷史 ID／目錄工具／同 seed audit、桌手機六工作區及實際光線選單，原歷史精確回放與其他工作目錄保護。最終 Phase 4 再跑整條歷史鏈。
