# 測試效率第二批與室內坐姿並行試點

日期：2026-11-17。基準：`2b43c52f8315232b316cc5fc99383ed10e6a64b5`。

## 授權與界線

使用者核准第一階段執行效率改善、第二階段室內坐姿試點；所有原案例與斷言保留，新舊並行。不刪減案例、不調整 CI 門檻、不修改產品 Prompt、目錄、UI 或儲存行為。初次實作階段不 commit、push 或部署；使用者完成驗收後，已於同日授權只提交本批修改、推送 main 並確認 CI 與部署。

承接 [v1](test-execution-efficiency-v1.md)，不更動既有 GPT scene／camera／worm-eye 聚合機制。完整測試與 Prompt Quality 仍各自執行完整原清單；後者只增加室內坐姿試點。

## 第一階段

### 一次執行內共用 pre-Lawson 快照

`indoorLeanBaseline`、`outdoorSeatBaseline`、`outdoorLeanBaseline`、`indoorKneelBaseline` 原本各呼叫相同的 `dump_pre_lawson_outputs.mjs`。現在同次 runner 內只產生一次完整 1,686 列，各原測試仍逐列執行原 hash／key／數量斷言。

runner 建立專用系統暫存目錄，以隨機 token、實際 repo 路徑及來源內容 fingerprint 限制使用範圍。使用排他鎖及原子發布，結果另以 SHA256 檢查；每個消費者獨立解析結果。失敗不發布結果，等候逾時直接失敗。歷史複製 checkout、不同來源、不同次執行不共用；單獨使用原生 `node --test` 時仍直接產生快照。runner 正常結束或轉送中斷後清除暫存。

這是 v1 的窄幅補充：允許**單次 runner 的暫存 JSON** 協調不同原生程序，不是跨次執行的磁碟結果快取。強制終止程序可能留下系統暫存檔，但後續執行必定建立新 token／目錄，不會讀取舊結果。

### 跪姿與戶外倚靠共用重疊生成

只有同時選取三份原測試時，runner 才改用 `scripts/test-groups/seatingMatrices.mjs`：

- `indoorKneelBaseline.test.js`
- `indoorKneelPrompt.test.js`
- `outdoorLeanPrompt.test.js`

聚合入口匯入原檔案，保留每個測試與斷言。單檔、部分檔案及原生篩選參數保留其原有範圍。一般測試仍使用原生程序隔離。

固定四個大迴圈原本共 42,260 次生成，其中 30,180 個唯一輸入，重疊 12,080 次。規劃表只暫存確定後續會使用的輸入，key 包含場景、動作、景別與完整 overrides，seed 沿用原 fixture。結果以 V8 序列化、壓縮後保留，讀取時還原獨立物件，最後一次消費後即釋放。失敗不快取；沒有列入計畫或生命週期外的請求照常重新生成。其他小型原測試也會執行，總生成／命中數由測試實際回報。

此機制只存在於測試 helper，沒有正式 runtime cache 或可編輯 custom library 行為變更。輸出等價比較排除既有 runtime ID／日期，保留所有穩定文字、selection、locks、RNG 與 cards。

### 即時進度

大矩陣依真正完成的案例定期回報完成數／總數、經過秒數與該程序 RSS。聚合生成另外顯示實際生成／重用數。外層 runner 讀取單次 JSONL 並輸出到 stderr，避開原生 TAP 在同步長測試內的緩衝。

進度以工作推進為條件，約五秒更新，不以假心跳宣稱完成；斷言失敗仍由原生 runner 回傳失敗碼。進度中的 RSS 是單一程序即時用量，不能相加當成整套測試的同時峰值。

## 第二階段：室內坐姿並行試點

新增 `indoorSeatRulePilot.test.js`，不取代原 `outdoorSeatBaseline` 的 18,480 組歷史矩陣：

1. 以已審核文件表格及獨立字面對照建立預期，檢查目前 84 場景 × 15 坐姿，共 1,260 組規則。檢查全部合法座位、順序、未選／無效值、固定地面、榻榻米及床上語意；後增 Lawson 與可調角度貓群坐姿有明確對照。
2. 16 組物理關係 × 原有十種景別，保留所有 14 類座位／支撐，驗證完整接觸文字、七輸出之間的允許差異、selection 與 RNG。
3. 床邊／床上經 Saved Card 序列化、還原、實際重新生成後保持一致。

預期規則不從待驗證 runtime 的座位對照表產生。文檔與實作同改仍須審核；這是補強獨立規則與關係驗證的試點，尚不據此退休任何歷史 hash 或組合。

## 歷史保護與驗收

原有 baseline JSON、fixture 清單與舊 inverse manifest 不改寫。新 `testEfficiencyHistory.json` 封存這次既有測試／工具檔案的精確反向差異，僅對符合新 SHA256 的內容還原至基準，再進入既有歷史 replay；未知改動不套用。丹寧歷史驗證只增加此層前置還原，原斷言保留。

需通過：共用資料隔離與錯誤路徑、原 runner 回歸、歷史精確逆向、新試點、原完整矩陣、完整 frontend、Prompt Quality、lint、build、原測試名稱／斷言保留比對及工作區保護檢查。同 Node 22、同完整測試命令／concurrency，前後分開計時，禁止同時跑另一份完整 gate 干擾比較。

本批是測試工具變更，沒有使用者可見變化，不啟動本機預覽或付費生圖。效能量測與限制記錄於 [本次驗證報告](../reports/test-efficiency-2026-11-17/README.md)。
