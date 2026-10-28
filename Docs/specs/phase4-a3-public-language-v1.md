# Phase 4 A3 公開控制語 v1

基準：8bbc60565ee46aeb04b630a2fb471d2ef5f1d74c。依 [整體授權](phase4-completion-v1.md) 實作。

1. 現行三筆正式環境光（高調純白／柔霧美妝／舞台演出）移除背景未指定、禁止產生場館等內部控制句，所有可視光源／光質保留。ID、有序 aliases、明確語意不改，追加完整舊英文 legacyPromptAliases。同步匹配 ambientLightDescriptions 的精確 source，保持現有主要光線精簡投影。
2. PAGE3 匯入的 `PAGE3 camera and environment layer` 改為 `camera and environment`；`real-place guards adapted for the background` 改為 `local spatial character`。保留相機、地方細節與原視覺約束，不重寫 PAGE3 本身其他輸出或城市資料。新轉接器輸出與歷史匯入重新生成共用同一精確詞組投影。
3. Hina 及自訂角色層的 `bare feet as the locked footwear state` 在六組公開輸出投影為 `bare feet`。保留角色卡、層資料、結構化選值與公開舊存檔原文；不做資料遷移或泛用字詞刪除。

固定 Git 同 seed 覆蓋全部固定構圖×三光、所有 PAGE3 城市／特殊場景及所有角色卡。允許來源文字／legacy aliases／受影響公開輸出之明列差異；ID、選值、RNG、其他視覺事實保持。原 JSON／Markdown／ZIP 公開原文仍可讀，只有重新生成採現行投影。

需聚焦測試先紅後綠、完整 AGENTS 閘門、桌手機實際匯入／複製／Saved Cards 與六工作區；Phase 4 inverse 保護所有既有封存及未提交工作。
