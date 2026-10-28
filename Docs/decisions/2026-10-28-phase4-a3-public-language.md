# A3 公開控制語決策

基準 `8bbc60565ee46aeb04b630a2fb471d2ef5f1d74c`，其 CI 40634606533 全數成功。[規格](../specs/phase4-a3-public-language-v1.md)。

原報告寫兩種棚光，現行來源實為三筆：高調純白、柔霧美妝、舞台演出。三筆都只去掉非視覺控制尾句，保留完整光質與既有明確語意；各自完整舊英文追加到既有 legacyPromptAliases，schema 與 field_mapping 只擴充該類別對既有欄位的支援。舊英文三筆皆還原同一 ID。相應 ambientLightDescriptions source 同步，避免精確匹配失效而擴大主要光線輸出差異。

PAGE3 的資料層名稱改成 camera and environment、local spatial character；地方視覺約束仍保留。Hina 與角色層的赤腳狀態只在公開輸出去掉 as the locked footwear state，原角色資料／層設定保持。新匯入使用同一精確片語投影，歷史匯入在重新生成時套用；舊卡複製與下載保持原文。

[固定 Git](../reports/phase4-completion-2026-10-28/a3/acceptance.json) 共 720 案例／1,440 次生成／28 次往返，134 組公開文字有核准變化，其餘完全一致。所有角色卡、固定構圖×環境光及 PAGE3 地點納入，只有五組核准詞組、三光 source／別名有差異；選值與 RNG 不變。完整原文、視覺細節及 ID 均保護。

歷史適配補足兩個原本未複製 knowledge_base／未回到 Phase 4 前資料的入口，精確逆轉後舊基準仍全數通過；不重錄舊 snapshots。兩個舊 Hina 回歸改為要求 bare feet 並禁止內部狀態句，身份／髮型／服裝其他條件保持。
