# Saved Cards ZIP Unicode 原文保護 v1

2026-11-01，基準 main 70129ef836d46a7cadd1be3d511c5476c2ecd909。本批修復已獲使用者驗收並授權限定提交／推送；CI 與部署於交付後確認。不進入 Saved Cards 持久化 B。

## 問題與範圍

A 階段合成案例顯示，大型 backup-only ZIP 的 saved-cards-backup.json 可能把分段邊界上的補充平面字元寫成替代字元。JSZip 以 UTF-16 code unit 分段後逐段編碼，可能拆開 surrogate pair。原始收藏未被本批操作；A 的舊現象與證據保留。

本批先以 TextEncoder 將完整文字編成 UTF-8 bytes，再交給 ZIP：每張 Markdown、manifest.json 與有 backup-only 項目時的 saved-cards-backup.json 均適用。檔名、manifest 與備份格式、篩選範圍、匯入規則、單張 Markdown、收藏和 Prompt 原文不改；backup-only 仍不代表可直接匯入。未修改 JSZip、持久化或雲端。

## 驗收與相容

- 合成 131 筆 backup-only 案例解壓後逐張 Markdown 與備份 payload 完整比對；加入長文字、emoji、長 manifest source ID 與分段邊界案例，輸入 hash 不變。
- 既有下載歷史回放增加精確來源 hash 的隔離反向銜接，未知變更拒絕；A 基準以 70129ef8 原版程式在無 .git 的臨時副本回放，不能重錄舊基準。
- 依 AGENTS 執行受影響回歸、完整前端、lint、build、Prompt Quality、同 seed strict audit 及隔離瀏覽器驗收；實際結果與限制見 [報告](../reports/saved-cards-zip-unicode-2026-11-01/README.md)。
- 不以本批 ZIP 修復宣稱 IndexedDB、容量保存、恢復包或 SC-P13／P14 的整體驗收完成。Saved Cards B～D、私人收藏、PAGE2 舊匯入、J12、P5b 均未併入。
