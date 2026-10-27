# A2 PAGE1 Markdown 完整選值快照決策

基準 main：`943ab65fa153fbc5050ee2c9690e429c326296f2`。使用者已確認本批驗收通過，授權限定提交／push 本批程式、文件、基準、回歸案例、歷史回放與驗收工具；其他未提交內容與歷史基準保持，實際 Git／CI 結果另行核對。

1. 只新增 PAGE1 Markdown 保存契約，不修改生成器或正式目錄。原先單張與 ZIP 的正文排序不同，因此共用 metadata encoder，保留各自既有正文，不藉統一匯出器重排公開內容。
2. v1 metadata 保存完整正規化 selection 與輸出原字串。輸出另存一份於 metadata 是為保留前後空白、CRLF、任意既有衍生 ID／標籤；匯入必須與可讀區塊一致，修改或遺失區塊時拒絕，不能暗用 stale metadata。檔案會比舊格式大，但無須依句型還原選值。
3. 新快照在文字 parser 前處理。無快照沿用舊路徑；有快照但損壞／不支援／衝突則拒絕。沒有 selection、非 PAGE1 卡片維持舊匯出。沒有新增 .md 上傳入口，單張檔仍可由既有 ZIP 路徑匯入。
4. 完整 selection 以 sanitizeStoredPrompt 的已保存卡片正規化結果為準。實測既有 compact JSON 會省略部分空值並於讀回補預設，故另比較兩者套用結果；不藉本批改 JSON 格式，也不把休眠空值改成全無來讓比較通過。抓拍已匯入人物與 rawSelection 保留。
5. 既有 Markdown 測試中，五項舊限制會被新快照改善：隱藏場景、衍生輸出、休眠欄位、MJ page1 比例與歷史標頭推測。這些舊契約仍以移除新 metadata 的舊檔路徑測試，原斷言保留；新契約另有回歸與固定 Git 對照。
6. 舊 parser 不重寫，前批 40 無色案例與貼上文字解析保持。structured 仍依 ID 重建；原輸出／抓拍完整來源則保存原文字。原已移除衍生輸出只保留歷史卡片內容，不重新生成。
7. 新 inverse 封存本批已修改原檔與新 helper 的 hash；只在隔離目錄先核對所有輸入，再回復至本批 Git 基準。E 的既有回放入口增加本批前置還原；舊工具與所有歷史 baseline／seal／expectedHash 不改寫。

規格：[PAGE1 Markdown 快照 v1](../specs/page1-markdown-snapshot-a2-v1.md)。特殊穿搭 1 筆、runtime 配色句、其他 Phase 4 與 P5b 均維持另批。
