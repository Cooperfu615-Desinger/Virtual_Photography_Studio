# C4 第三批用字與收尾驗收

基準 `a1cf63ec66b04d74bba514a64937039cdd4e7da5`。本機驗收通過，未 stage／commit／push。

範圍：四中文名稱、兩中文說明、兩映射目標、一個 manifest 名稱與兩個舊 jewelry 還原新名稱鍵。英文／永久 ID／圖片路徑與歷史基準不變。

| 驗收 | 結果與證據 |
| --- | --- |
| 修改前固定基準 | before.json.gz：216 組生成、1,098 組舊還原 |
| 本批與 C4 第二批 | focused-final.log：9/9 |
| A2／E 歷史銜接 | history-focused.log：14/14；原有測試於隔離副本執行 |
| 完整前端 | tests-final.log：2,037/2,037 |
| Prompt 品質 | quality-final.log：853/853 |
| lint／build | lint-final.log、build.log 通過 |
| 同 seed strict audit | audit-before.log、audit-after.log 內容一致、0 blocker；既有診斷保持 |
| 同步／Python／目錄工具 | sync.log、python.log 43/43、catalog-tests.log 32/32 |
| 目錄 strict | catalog-final.log：0 blocking、0 stale；既有 allowlist 保留 |
| 資產／正式打包啟動 | assets.log：207；bundle.log：33 角色、無反向 engine 依賴 |
| 固定來源與歷史保護 | protection.json：前後雜湊核對、既有歷史報告與 registry 未變、index 空白 |
| 瀏覽器 | browser/results.json、workspaces.json；1440／390，六工作區 12 檢查通過 |

新名稱與說明只改核准中文欄位。舊 ID、舊名稱／英文別名還原仍指向原選項；街頭金項鍊 matchedControls.option.zh 的顯示差異以精確 ID 限定反轉比對，不放寬鎖值、英文或 meta。

保留初次 focused.log、tests.log 與 quality.log 的失敗證據：舊名稱顯示差異及 A2／E 精確來源斷言需要本批隔離回放。最終結果以上表 final／history-focused 日誌為準。未改寫舊基準，未修改 A2 原 inverse；C4 回放先依精確雜湊還原本批，再執行原有測試。

瀏覽器實際點擊套裝選擇器，確認新名稱與原圖片檔 `36_垂墜背心腰鏈短裙.avif` 載入；新收藏儲存與修改前收藏還原保留 ID。桌手機無頁面溢出、console／page error。截圖存於 browser/，已目視檢查手機套裝與桌面頸飾畫面。

限制：每個尺寸的「銀色水鑽蝴蝶腰鍊」「多條層疊的金項鍊」使用程式化選值補驗；原生下拉彈出選單直接滑鼠操作仍未驗證，前兩批限制不因此解除。使用隔離瀏覽器，未讀寫使用者真實收藏，未進行外部模型生圖。沒有提交或部署，本次不宣稱 CI／線上驗收完成。

C4 原列管範圍實作收尾，待使用者驗收及授權交付。其他 C 類、PAGE2 舊匯入、J12、P5b 不併入。

[規格](../../specs/c4-jewelry-display-labels-v1.md) · [C4 收尾](../../decisions/2026-10-29-c4-closure.md)
