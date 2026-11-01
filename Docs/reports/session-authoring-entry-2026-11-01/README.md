# 新 session 入口與新增內容指南：文件驗收

日期：2026-11-01。基準：main `eef77871e840459efce50b51e198c90108bcfad4`；本輪已唯讀核對遠端 main 同一提交。實際目錄為 `/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`。

狀態：本機文件驗收通過；待使用者驗收。未 stage、commit、push 或部署。

## 本批成果

- 新增 [session 導引](../../session_onboarding.md)：核對目錄／分支、必讀順序、單品／指定動作／場景等來源表、ID／alias／生成物及驗收邊界。
- 更新根 AGENTS／README／current state／catalog 操作；四份編寫指南補現行入口、過期路徑與日期效力。
- 人物指南修正指定動作、頭部／手勢、角色身份／共用穿搭來源，並區分引擎相容解析與 PAGE1 清除退役選值的流程。
- 舊 Pose Composer 矩陣及 specified-actions v1／v2 加歷史標示；共用瀏覽器清單補現行 DLL_VIDEO，六工作區與 App 導航一致。
- [決策紀錄](../../decisions/2026-11-01-session-authoring-entry.md)記錄來源責任與排除範圍。

## 驗收結果

精確計數、文件清單及保護摘要見 [validation.json](validation.json)。

1. 所有本批文件的本機 Markdown 連結／目標路徑存在；來源責任對照現行模組、App 導航及 PAGE1 退役鎖流程。
2. 過期維護指示、七份生成物、五工作區及桌面絕對連結完成針對性校對。歷史批次中的舊數字／用語保留其歷史效力。
3. `git diff --check` 通過；新增文件亦無行尾空白。變更僅限本批 11 份既有文件、2 份新文件及本目錄 2 份證據，無暫存內容。
4. 修改前 5,071 份追蹤檔中，除本批 11 份文件外，其餘全部雜湊保持；既有 reports 與歷史基準未改。current state 原有段落逐位元保留；specified-actions v1／v2 原文只在標題後新增歷史導引。
5. 其他 20 個 worktree 的 Git 狀態與 140 份既有未提交檔雜湊保持；較舊的原專案目錄未切換、未清理或同步覆寫。

## 驗收界線

這次只對齊文件與現有行為，沒有執行產品測試、sync、build、瀏覽器、付費生成、歷史重播或 CI／部署；依 AGENTS 的文件驗收列處理。文件檢查不宣稱新模型效果、真實帳號流程或既有瀏覽器限制已重新驗證。

新 session 要讀到這批尚未提交的文件，需開啟上述 main 工作目錄；其他分支不會自動同步。實際路徑應每次核對，不能把本次快照當成永久設定。

Saved Cards B、PAGE2 舊匯入、J12、P5b 均未進入；既有收藏、程式、正式資料、抽樣與保留決策不變。
