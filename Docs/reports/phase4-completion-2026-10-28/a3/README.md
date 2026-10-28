# A3 公開控制語驗收

固定基準 8bbc60565ee46aeb04b630a2fb471d2ef5f1d74c，上一批 CI 全數成功，見 previous-a2-ci.json。

- [固定 Git](acceptance.json)：720 案例、1,440 次生成、28 次 JSON／Markdown 往返；134 組核准輸出變化，0 額外差異，selection／RNG 保持，三份舊英文仍還原原 ID。
- [完整閘門](gates-latest.json)：1,993 前端、835 品質、43 Python、32 目錄工具、lint／build／sync／歷史 ID／strict／207 assets 通過。200 同 seed audit 與前批逐字相同，0 blocker／18 既有診斷。
- [瀏覽器](browser/results.json)：1440×1000／390×900，32 項操作與 16 張畫面，六工作區、原卡原文、重新生成、六組複製、Markdown、ZIP、reload、歷史匯入與實際 PAGE3 匯入通過；0 errors／外部 POST／溢位。已檢視桌面匯入與手機 Hina 畫面。
- [保護](protection.json)：1,789 原歷史檔及已交付 Phase 4 報告保持，其他 20 工作目錄／140 未提交檔保持。12 項聚焦歷史逆轉測試通過，完整歷史鏈於整體收尾回放。

初次完整測試指出舊測試需套用逆轉及更新核准赤腳文字；修正後全通過。瀏覽器初次使用錯誤 GPT 大小寫，已改用現行 Gpt 按鈕，不修改產品標籤。初次證據保留。沒有外部模型生成或付費操作。
