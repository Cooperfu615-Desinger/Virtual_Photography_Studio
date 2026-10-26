# Phase 4 A1：角色卡成年身份 v1

日期：2026-10-26。狀態：本機實作與驗收完成，使用者已授權本批提交／push；實際 Git 與 CI 結果另行核對。

## 問題與範圍

以已推送 main `ffb2e91e61787159d7dbc724dc0129e87537dfcb` 為基準。原 [A1 盤點](../reports/database-analysis-2026-10-11/README.md)指出 PAGE1 角色卡主 GPT、GPT 胸上與全身角色照省略成年身份。33 張正式卡的 `profile.identityAndBody` 都有既存開頭：32 張為 `a 20-year-old adult East Asian woman`，Eleanor 為 `a 20-year-old adult demonic woman`；八個結構化欄位本身沒有該身份。

只在 PAGE1 兩個 GPT 角色卡 Subject builder 的「有結構化身份」分支，於 Character Profile Card 名稱後、Facial geometry 前加入該來源開頭及句點。沿用現有來源抽取格式；不加入預設年齡／族裔、不重複完整 legacy 段落，不新增資料欄位或公開段落標籤。

## 相容邊界

- 主 GPT、`chest-up-portrait`、新產生的 `full-body-character` 適用；一般／固定構圖／抓拍只要使用同一角色卡 builder，均保留相同身份來源。
- 無結構化欄位時維持原 `Identity and body` fallback；未提供可辨識來源時不捏造成年身份。
- 臉部四錨點、body、makeup、髮型、穿搭、姿勢、場景、成像、所有既有段落及順序保持。Eleanor 保留 demonic，不轉成 East Asian。
- Z／MJ／Nano、一般人物／雙人／專用主體、PAGE2 六種複製輸出、資料目錄、ID、有序 aliases、選值、RNG、storage schema 不改。PAGE2 自己的 GPT／Z 成年身份覆蓋另列待評估，不以本批 PAGE1 結果宣稱全站結案。
- 舊 JSON／Markdown 收藏的儲存文字不改；回填重生用新 PAGE1 renderer。一般人物抓拍匯入的 `fullBodyPrompt` 原樣保存，重抽不得換人或改寫備份。角色卡走既有 card 抓拍來源，原本不提供一般全身匯入 snapshot，本批不擴充匯入資格。
- A～E／四批 A5 歷史基準、規格原始報告、生成工具不重錄。只新增測試端精確 inverse，在隔離副本移除本批兩處插入以回放原歷史工具；仍須保留其餘現行程式變更，以免掩蓋回歸。
- 本批修復既有「保留成年身份」契約；封存的 `promptOutputContracts.js` 與 representative fixtures 不改。新增獨立 A1 測試納入 Prompt Quality gate。

## 驗收

1. 修正前固定 main 複現 33 卡 × 3 GPT 輸出缺口；先新增失敗回歸再改 renderer。
2. 33 卡、兩種衣著模式、全部景別與一般／固定／抓拍情境，同 seed 對照固定 Git 引擎。只允許上述三個 GPT 輸出在確定位置增加一次原身份句，其他全部 prompt 欄位與 RNG 相等。
3. 舊收藏 JSON／Markdown、一般人物全身匯入、角色卡抓拍及重抽／明確重新匯入，分開驗證儲存原文與新生成行為。PAGE2 輸出逐字對照。
4. 精確 inverse 缺失／重複／竄改必須拒絕；歷史 A／A5 工具在隔離副本通過，封存 SHA 不變。
5. 聚焦測試、完整前端、Prompt Quality、lint、build、同 seed 200 strict audit；診斷與 blocker 分開記錄。
6. 1440×1000／390×900 實際瀏覽器：角色卡三種 GPT 複製、收藏／回填、全身匯入／重抽，並巡覽五工作區，檢查錯誤、溢出與圖片。無付費出圖。

## 驗收紀錄

見 [本批報告](../reports/character-adult-identity-a1-2026-10-26/README.md)。A5 收尾提交及 CI 證據另記於本批，既有 A5 證據不回寫。使用者已授權僅交付本批 A1；其他項目及 P5b 不開始。
