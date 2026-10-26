# Phase 4 A5 收尾：西門町 green_space 修正 v1

日期：2026-10-26。狀態：Cooper 已確認本機完整驗收通過，並授權限定提交／push；實際 Git 與 CI 另行核對。可信任基準為遠端與本機 main `5110401f3eee4aaa6cc59ee9175625cc96326d9e`。

## 範圍與成功條件

只從 `locations:城市與社群感-urban-social-snapshots:戶外-台北西門町街頭:28` 移除 `green_space`，保留有序 `urban, outdoor, commercial`。正式來源為 [分類 JSON](../../knowledge_base/catalog/Locations/城市與社群感-urban-social-snapshots.json)，由同步工具生成 database。其餘七份生成物、原文、ID、有序 aliases、列序、schema／registry／index、renderer、推論相容退路均保持。

舊推論以 includes 比對，`scooter parking fragment` 的 parking 包含 park；不是原文描述了公園。正式顯式語意應修正，原始停車細節不刪改。既有戶外前綴與 outdoor tag 已足以維持環境判定及舊姿勢候選，預期現有候選順序、選值、六輸出、summary、RNG、收藏與匯入行為完全相同；只容許目標 ID 的 metadata 少一個 tag。若發現其他差異，先調查而非擴張批准範圍。

11 筆室內／戶外雙標籤逐筆列出來源、完整 ID、理由、建議與待決狀態，但整筆資料保留。包含邊界空間，不能靠名稱或類別批次清除。此批完成後是「已知明確誤標修正收尾；11 筆政策決策待處理」，不可宣稱 A5 所有語意問題已關閉。A1–A4／A6／A7、J12、B3、P5b 不在範圍。

## 修改順序與保護

1. 核對 main／工作區，保存全部 tracked 與其他工作目錄未提交內容雜湊、修改前固定 seed audit。
2. 從固定 Git 原件建立 review fixture、規格與回歸；先證明新斷言能拒絕舊誤標。
3. 只修改分類 JSON，設定上述完整 `REGISTRY_BASE_COMMIT` 後同步。八份生成物受 check，正式資料差異必須只有分類與 database 的同一 tag。
4. 新 test-only inverse 先逐欄核對目標完整紀錄，僅精確還原 green_space；拒絕額外 tag／錯序／文字或 alias 改動／缺 ID／重複 ID，不修改輸入或預設快取。再接未改的 CRT、commercial、三筆 inverse，回播 A～E。
5. 原 CRT 九項及 commercial 七項測試由固定 Git 原檔在 current code＋精確 pre-Ximending 隔離副本執行。新增當前回歸保護全 database、已交付狀態與 11 筆未改資料。舊驗收程式、報告、基準不改寫。
6. 完成全部門檻後更新當前狀態與 A5 總表；各批歷史報告保留原樣。此為原本機驗收邊界；後續 Cooper 已授權只提交／push 本批。

## 驗收

- 獨立 oracle：固定 Git 引擎、原 database 加唯一核准 tag 差異；與當前完整 database、正式分類、runtime 及所有結果比對，不能只用同一逆轉 helper 自證。
- 11 景別、場景全無／戶外、38 環境光狀態共 836 候選組合；全部回傳候選有序 ID 一致。手動／隨機光線、服裝、外套、單／雙人、舊姿勢／仰躺、其他場景、代表模式與原 A corpus 同 seed 比較完整 stable result（只排除 runtime ID／時間）。
- 舊 JSON／Markdown 收藏、UI transition、五種既有匯入來源，以及西門町全身角色→抓拍匯入、三次重抽、換候選與明確重匯入保持。不得重寫舊收藏文字。
- 原三批 A5 工具在隔離還原副本回播；A～E 三套完整歷史測試／seals 不重錄。
- 同步／schema／歷史 ID／strict、Python、三份 catalog 工具測試、Node 22 完整前端／Prompt Quality／lint／build、資產檢查；相同 seed `prompt-quality-baseline`／count 200 的 strict audit 前後一致，既有診斷另列。
- 桌面 1440×1000、手機 390×900：五工作區、目標場景、光線與六輸出、整合姿勢、收藏重載／套用；檢查 console／page errors、溢出與破圖。隔離瀏覽器不提交外部模型請求。
- 最終核對歷史證據、其餘 tracked／dirty 保護雜湊與 index；本機驗收、使用者驗收、Git 交付、CI 各自記錄。

[本批報告](../reports/scene-semantic-a5-ximending-2026-10-26/README.md) · [A5 狀態及雙標籤審查](../decisions/2026-10-26-a5-closure-review.md)
