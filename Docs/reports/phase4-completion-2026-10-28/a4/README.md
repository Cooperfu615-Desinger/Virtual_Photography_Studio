# A4 十二筆固定配色驗收

基準 37f24aa8fb87633fd87e7fff44258291f862f5c8，上一批 CI 成功證據見 previous-a3-ci.json。

- [固定 Git](acceptance.json)：2,077 案例、6,232 生成、1,902 組核准公開差異、48 次新舊抓拍／重抽、8 次存檔往返。所有主色、完整色系、景別、雙人 A／B、外套及其餘套裝；無色固定 Git oracle 逐字相同，selection／RNG 保持。
- [全閘門](gates-latest.json)：1,995 前端、837 品質、43 Python、32 目錄，lint／build／sync／歷史 ID／strict／207 assets 通過。稽核 0 blocker／18 既有診斷不變，字數因核准刪除配色文字改變，見 audit-diff.txt.gz。
- [瀏覽器](browser/results.json)：1440×1000／390×900，28 項操作、20 畫面。原卡複製、套用／六組輸出、Markdown／ZIP、重載、固定色提示、實際選款恢復可配色控制、雙人隔離與六工作區通過。0 errors／外部 POST／溢位，已檢視桌面固定提示及手機雙人畫面。
- [保護](protection.json)：既有歷史與已交付 Phase 4 報告不改，其他 20 工作目錄／140 未提交檔保持。

初次套件只有舊雙人丹寧覆寫預期失敗，依本批決策更新後完整套件通過。獨立 oracle 工具補齊 fixed metadata 及角色 suffix 的核准欄位，沒有以工具錯誤修改 production。歷史回放沿整體精確 inverse，最後完整鏈於 Phase 4 收尾執行。
