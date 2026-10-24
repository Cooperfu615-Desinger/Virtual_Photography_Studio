# DLL_PIC Pro 完整版版面調整 v1

日期：2026-10-20。狀態：本機實作、驗證與使用者驗收完成；使用者已授權 commit 並 push 到 main。

## 核准目標

依使用者核准示意，讓完整版左右等寬，生成操作提到設定上方，瀏覽下方內容時仍可直接生成。沿用現有外觀、來源／草稿與任務契約，保留三個現用快速面板。

## 介面與操作

- 桌面兩欄各占可用寬度一半；左設定、右成果與任務。820px 以下保留設定／成果切換；1100px 以下成果圖改單欄。
- 左欄上方固定「生成圖像」「加入待生成」，顯示模型、比例、解析度、張數、來源、Seed 與已啟用的 LoRA。下捲歷史時仍可操作；缺少 Prompt／金鑰、模型不相容或 LoKr 無效有提示與停用保護。
- 模型獨占一列；比例、解析度、張數並排。六個 Prompt 來源及帶入入口置於其下；短預覽可展開或編輯，編輯時自動展開，保留還原來源文字。
- Seed 留空隨機，指定值與第二張 Seed+1 契約不變，提供「改用隨機」。模型支援的 Asian Mix LoKr／MOSS LoRA 收入進階設定，套用狀態仍顯示於上方摘要。
- 額度改為生成列內的精簡顯示，沿用實際數據、載入／失敗／未登入／合作夥伴計價提示；快速面板保留原額度卡。
- 只縮減 DLL 頁面標題與導覽占高；其他工作區、Prompt 輸出、儲存鍵、任務執行與後端維持既有契約。

## 修改表面

`webapp/src/App.jsx`、`webapp/src/components/DllPicWorkspace.jsx`、`webapp/src/components/DllPicProPanel.jsx`、`webapp/src/components/ComfyQuotaPanel.jsx`、`webapp/src/styles/dllWorkspace.css`。

依最新 AGENTS 直接在 main 工作目錄 `/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio` 實作。基準 e68782a；原專案 detached 目錄與未追蹤文件未修改。

## 驗證與證據

- Node22：既有相關測試40/40、完整前端1736/1736、lint、build、diff-check通過。建置既有大型chunk提示保留。
- 1440×1000、1536×1024桌面與390×900手機；819／821、1099／1101斷點。無文件水平溢出、控制項重疊或破圖。1440桌面兩欄657px；821兩欄370px、1099兩欄509px、1101兩欄510px。
- 模擬生成兩張、loading／完成、加入與移除待生成、空白Prompt停用、來源切換、胸上比例固定、編輯／收合／還原、Seed0及清空、LoKr無效強度與正常值、草稿reload均通過。
- 長歷史頁捲動5072px後生成列仍在頂部8px；手機設定／成果、檢視大圖與桌面雙圖比較正常，Escape後回到比較按鈕。
- 現行五工作區（Prompt工作台、角色建模、場景建模、DLL、Saved Cards）桌面／手機檢查；三快速面板保留原來源選單與生成鈕。既有11張Saved Cards只讀。
- 最終瀏覽器console warning/error為空。一般模式未登入額度與空成果已檢查。新main工作目錄無本機Firebase設定，真實登入額度／付費生成未操作；模擬圖片不代表模型品質。未改Functions，不需本次部署。
- 截圖與檢查紀錄：`Docs/reports/dll-workspace-layout-2026-10-20/`。示意比對與差異說明見根目錄 `design-qa.md`。

## 本機驗收

入口：`http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1`。此模式不呼叫生成服務、不扣額、使用獨立資料。

優先確認桌面兩欄比例、生成鈕位置與下捲後可見性，再確認常用模型／來源／Seed與Prompt編輯順序。真實雲端驗收與發布需另外明確授權。

## 使用者驗收與 Git 交付授權

2026-10-20 使用者確認「本機驗收沒問題，可以幫我 commit 並 push 到 main。」本批提交範圍為上述五個前端檔案、規格、目前狀態、design-qa 與驗收證據。沿用已通過的1736項測試及瀏覽器驗證；驗收後沒有再修改程式。main 推送會觸發既有 GitHub Pages 工作流程，其實際結果以 Actions 為準；本批不需重新部署 Firebase Functions。
