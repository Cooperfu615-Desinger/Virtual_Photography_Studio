# Saved Cards 持久化 v1：A 階段驗收

日期：2026-11-01。結果：A 階段本機驗收通過，待使用者驗收；未提交、推送或部署。B～D 未開始。

## 基準與範圍

- main／遠端 refs/heads/main 均為 `60c46d39ef0524c9b641c771e6319fb5d4b2e091`；唯讀查詢遠端，沒有 fetch／merge。
- 延續前輪三份未提交文件；新增隔離合成資料、契約、量測／比對工具、測試及本報告。產品程式、資料、依賴、CI 設定與歷史基準不變。
- [主規格](../../specs/saved-cards-persistence-v1.md)；[A 相容契約、容量結果及限制](../../specs/saved-cards-persistence-a-v1.md)。
- 12 筆格式 fixtures、14 組儲存來源、4 個容量配方、15 組後續情境；均為 synthetic-only，未讀取私人收藏或登入 Firebase。

## 驗收證據

| 檢查 | 結果／證據 |
| --- | --- |
| 新增工具與現況測試 | 19／19，Node 22.23.3；[最終測試紀錄](a-tests-node22.tap) |
| 既有相容測試 | 76／76，涵蓋 repository、codec、Markdown、archive、backup、下載歷史回放、feed migration、auth；[紀錄](existing-tests.tap) |
| 唯讀 CLI | 基準相符、15 組後續案例尚未執行；[結果](check.json) |
| 核心確定性 | Node 25.8.2 兩次 --measure 逐 bytes 一致；Node 22.23.3 重跑與同基準一致 |
| 原文保護負例 | 漏卡、重排、改 ID、CRLF 改寫、刪未知欄位、刪舊輸出、改 lineage／選值皆被拒絕 |
| 隔離護欄 | 未標記 storage、任意 --input／--output／--update／--browser 皆拒絕；來源漂移失敗，不重錄舊基準 |
| 原始檔保護／文件 | [保護與文件檢查](validation.json)，既有報告與其他工作目錄未提交內容保持 |

核心封存：[baseline.json](baseline.json)。下載獨立現況：[archive-baseline.json](archive-baseline.json)。合成配方與檔案 hashes 由 [evidence-manifest.json](evidence-manifest.json) 固定；不記錄私人資料。

## 發現及修正過程

首次測試在 Node 25 執行時有兩個失敗，保留[首次紀錄](initial-tests-node25.log)：
1. 測試用 trim 處理本來沒有首尾空白的 GPT 字串，未真正製造變更；改為 CRLF→LF 的有效負例，未修改產品。
2. 大型 ZIP 原始備份內容確實有一個 emoji 被替換。後續以 Node 22、Node 25 及 Python 標準 ZIP 解碼確認，詳見[獨立診斷](unicode-diagnostic.json)。改為明確封存現行缺口，未把它改寫成產品保存通過。

A 通過的意思是基準、工具與相容契約可用，不代表舊裁切、讀取失敗或 ZIP Unicode 缺口已修復。最後的十九項測試包含「已知現況缺口仍可準確重現」；不是把十九項全數當作新方案已通過。

## 未執行及後續閘門

- 沒有新增產品 runtime 行為，因此未啟動服務、未進入私人瀏覽器、未跑新 UI／真實關頁保存驗收；原有瀏覽器限制保持。
- 未實作 IndexedDB／outbox，未跑 Emulator／帳號切換／真實雲端交易；SC-P01～15 全部保留 prepared-not-executed。事件 fixtures 是驗收輸入，非已運作的狀態機。
- 本批沒有前端邏輯、renderer、目錄或 Functions 修改；執行聚焦工具及相容測試，不把未重跑的全前端、lint／build、strict audit 或完整歷史鏈冒充通過。B／C 改動產品後須按主規格完整驗收。
- 後續需另獲授權才開始 B。正式發布前必須處理本次 ZIP Unicode 缺口，並通過原文／恢復包驗收；A 不自動授權此修復。
- 保留既有收藏、其他未提交內容、全部歷史基準；未 stage、commit、push。PAGE2 舊匯入、J12、P5b 不併入。
