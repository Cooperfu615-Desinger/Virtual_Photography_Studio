# A2 單人胸上連身區域配色投影 v1

> 2026-10-28 現行狀態：本批與原先列為「另批」的 A2 相依工作已完成實作與交付；統一追溯見 [Phase 4 結案](../reports/phase4-completion-2026-10-28/README.md)。下方授權／待辦文字保留當時時點，現行行為以結案索引中各後續規格為準。P5b 暫緩。

日期：2026-10-28。狀態：使用者核准實作，本機完整驗收完成，待使用者驗收；尚未授權 commit／push。

## 來源與範圍

固定 main 基準：`9a0c4f2df7790d2728701e384b9dfc635d428a73`（上一批舊連身純文字還原交付）。本批延續 [同拍攝狀態胸上規格](chest-up-same-state-v1.md) 及 [runtime 配色規格](wardrobe-runtime-color-a2-v1.md)，只調整單人 `chest-up-portrait` 的連身上下區域配色投影。主 GPT／Z-Image／MJ／Nano Banana／全身角色照五組輸出、選值、RNG、原始來源、公開存檔原文與歷史基準保持。

舊行為的 `dress palette from top to bottom` 被共用裁切規則視為 bottom，與 lower hem 子句一起省略。上色後的衣名仍有上區色名，但缺少區域歸屬，容易讀成整件同色。這是既有 runtime 分類限制，不是上一批純文字還原造成。

## 輸出契約

1. 僅內部衍生景別 `chest-up-portrait-reference`、單人、實際有效的正式連身 slot 適用。依 resolved `topBottomPalette` 的上／下色塊，不解析公開 Prompt，不新增 ID；無 ID 的合法配色子色塊仍可用。
2. 上區顏色須與有效 `dressColor` 一致，且兩個區域都有有效顏色。證據不完整／不符時沿用既有投影，不猜顏色。不新增配色 UI，也不改穿搭接管或互斥。
3. 胸上衣物細節從原連身英文重新投影。移除將上區色套到整件衣名的 runtime 前綴，保留作者原有固定色、材質、可見輪廓、細節及既有完整造型色系。只追加一次 `upper/main dress area in <上區顏色>`。下襬／裙身區域配色不進胸上。
4. 例：原 `cherry blossom pink sleeveless dress, …` 改成 `sleeveless dress, …, upper/main dress area in cherry blossom pink`。全身輸出仍有 `lower hem or skirt area in cream yellow`，胸上不帶入奶油黃。
5. 先服從既有外套可見性。不透明全扣外套的 `closedOuterwearProjection` 保持原投影，不重新加回被遮住的上區色；透膚且既有規則判定內搭可見時保留上區色。原本閉合外套可能留下的「Lower portion of the dress」文字不在本批修正。
6. 一般、固定構圖或匯入全身人物的抓拍，只要實際走同一單人有效連身胸上路徑，都依相同可見性處理。主景別不改變胸上投影。抓拍來源與 frozen full-body prompt 不變，不重抽人物。角色卡／專用角色／套裝／特殊穿搭的既有接管分支不新增此句。雙人不新增胸上輸出，A／B 保持隔離。
7. JSON、帶快照 Markdown、ZIP 保留已儲存六輸出原文。舊卡套用後重新生成的胸上才使用新投影；收藏原文不得被當作需要升級的資料而批次改寫。現行 UI 的 Import 仍只有 ZIP，單張 Markdown 驗證既有下載及共用 codec。

## 實作與遷移順序

先記錄 HEAD、工作區、全部歷史檔與其他工作目錄 hash，建立同 seed audit 與修正前失敗案例。只在建立胸上 structured model 的有效連身分支呼叫限定 helper；不修改共用 bottom／dress classifier、配色解析、資料庫或 storage schema。先聚焦回歸，再獨立固定 Git oracle、完整 gates、瀏覽器、隔離歷史鏈與保護檢查。

不需要資料遷移。任何外套遮蔽與額外輸出的差異都視為拒收，不以重錄歷史 baseline 解決。

## 驗收方式

- 24 連身 × 42 配色共 1,008 組，固定 seed／固定 Git。比對除胸上文字外整個 Prompt 物件及 RNG 次數；胸上非 Wardrobe 章節也逐字相等。
- 獨立衣物 oracle：固定 Git 引擎對同款無區域配色的可見來源輸出，須等於新胸上移除唯一核准上區子句後的文字。避免由新 helper 自己產生 expected 值。
- 主景別、外套開合、單色、套裝、特殊穿搭、角色卡／專用角色、固定構圖、雙人 A／B、抓拍及重抽邊界；既有固定胸上 fixtures 繼續保護。
- 舊／新 JSON、Markdown 快照與 ZIP 的六輸出原文、配色選值、已匯入全身來源均保持。瀏覽器實際套用／生成／複製／收藏／下載／ZIP 匯入及重載；桌面 1440×1000、手機 390×900，並巡覽目前六工作區。
- 聚焦測試、前端全測試、Prompt Quality、lint、build、200 個 `prompt-quality-baseline` strict audit、目錄 sync／歷史 ID／Python／strict／工具／assets。
- 本批 exact inverse 只在隔離副本生效，所有來源先檢查 before／after hash、一致狀態與新增測試，再原子還原；真實工作區、Git checkout、未知／缺失／混合內容拒絕。先精確還原到固定 main，執行上一批原工具及完整 A2／A1／A5 歷史鏈。A～E 與所有既有歷史檔不重錄。

執行入口：`scripts/chest_dress_region_a2_acceptance.mjs`、`scripts/chest_dress_region_a2_history.mjs`、`scripts/chest_dress_region_a2_browser.mjs`、`scripts/chest_dress_region_a2_protection.py`。各工具輸出限定本批報告或隔離暫存目錄。

## 保留待辦

主工作台近景／腰部區域投影另批處理；不調整共用分類順序，不擴展其他 Phase 4 項目，不進入 P5b。外部模型實際生圖效果與本次文字、狀態及瀏覽器驗收分開，不宣稱已驗證模型一定遵守配色。
