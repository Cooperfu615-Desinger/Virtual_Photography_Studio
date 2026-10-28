# Phase 4 A2 第一批：24 筆連身控制語 v1

> 2026-10-28 現行狀態：本批與原先列為「另批」的 A2 相依工作已完成實作與交付；統一追溯見 [Phase 4 結案](../reports/phase4-completion-2026-10-28/README.md)。下方授權／待辦文字保留當時時點，現行行為以結案索引中各後續規格為準。P5b 暫緩。

狀態：2026-10-26，依 Cooper 核准完成本機修正與驗收；不提交、推送或進入其他批次。

## 範圍與成功條件

基準 main `4e35912f82280c058d0c86b6de3f44fcb019f9df`。只修正正式連身分類 24 筆非全無紀錄的英文：移除 `main … color controlled by dress color selection`；一字領哥德迷你洋裝另移除 `contrast trim controlled by contrast palette`，保留原本的 `ruffle trim`。不新增配色目標、對比色能力或外觀資訊。

既有 dressColorId、完整造型色系、上下身配色、衣物／材質／輪廓／領口／飾邊／拉鏈來源及可見範圍沿用。不改 engine、renderer、UI、storage schema、ID／legacyIds／順序／中文／desc／semantic／圖片。原有 legacyPromptAliases 順序完整保留，尾端追加本次修改前全文；generated database 與 Markdown 由同步工具更新。

40 筆套裝及 1 筆特殊穿搭控制語屬 A2 後批；A3、A4、其他 Phase 4 及 P5b 不在本批範圍。影片分頁由「APIKEY分析」處理，本批不修改導覽、影片或共用 UI。每次編輯／驗收前確認共用工作區及 5175 服務，其他 session 新改動另列，不覆寫。

## 保存與匯入

新生成與重新依 ID 生成採新來源（含「套用目前預覽」立即重生成）。既有收藏顯示文字、JSON／Markdown 和已匯入人物快照維持原件，包含歷史控制語；不藉此批遷移或清洗舊資料。收藏解析時沿用既有 ID 重建 structured 資料行為，其來源會反映目前目錄；儲存的公開 Prompt 原文另行保持。抓拍重抽維持已匯入全身 reference；明確重新匯入新生成來源後使用乾淨來源。角色卡與一般人物來源資格不變。

## 驗收

先建立固定 Git 基準與會失敗的回歸，再改資料。24 筆逐一比較來源與順序；完整舊全文 alias 以及舊 ID 還原成功。六種現行輸出在有效衣物可見時不含這批控制句，原本裁切隱藏的衣物不回補。不同景別／色票／材質色票／上下配色／完整造型色系、雙人、固定車廂、外套、一般抓拍匯入與重抽／重新匯入納入。

獨立 oracle 使用固定 Git 引擎，只施加規格核准的 24 筆資料差異；與目前程式比較全文、structured、selection、summary 及 RNG。未涉及連身的保護案例逐位元組不變。A1、四批 A5 與 A–E 原始工具／基準不重錄；精確逆轉本次資料差異後回放歷史，錯誤／混合來源必須拒絕。

依 AGENTS 執行來源同步／歷史 ID／schema／完整性與工具測試、聚焦回歸、前端全套、Prompt Quality、lint、build、相同 200 / prompt-quality-baseline strict audit。診斷差異逐項判讀，不能修改其他內容減少數量。瀏覽器 1440×1000 與 390×900，包含六輸出、舊卡顯示／還原／重新生成、抓拍匯入及五工作區；無付費生成。

驗收與限制記錄於 [本批報告](../reports/wardrobe-control-a2-dresses-2026-10-26/README.md)。

## 2026-10-27 交付對齊補記

使用者已授權在確認影片提交後限定交付本批。原始 oracle 與 2026-10-26 證據保持；整合保護基準採 `e9983769e326ead175b381834c6e2df4fd02e28d`。A1／A5 歷史回放僅於隔離副本將六個已審查影片前端檔精確還原至原 baseline，要求全檔 before／after 一致，額外修改／缺檔／混合版本拒絕。正式影片功能仍驗收最新版本。

新增 DLL_VIDEO Pro 桌手機往返及全六工作區檢查。原五工作區工具保持，在乾淨副本服務執行；既有服務的熱更新 runtime 與固定網址驗收 import 不一致列為工具環境診斷。完整結果見 [最新整合驗收](../reports/wardrobe-control-a2-dresses-2026-10-26/integration-2026-10-27/README.md)。此補記不改本批 24 筆資料範圍，也不開始後批或 P5b。
