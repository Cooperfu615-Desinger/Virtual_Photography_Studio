# 2026-10-28 A2 胸上連身區域配色決策

- 使用者核准：單人胸上特寫照保留可見上區配色並遵守外套遮蔽；另外五組輸出、公開原文、未提交內容及歷史基準保持。主工作台近景另批，禁止本批 commit／push，其他項目與 P5b 不進入。
- 固定對照 main：`9a0c4f2df7790d2728701e384b9dfc635d428a73`。實際 main 工作目錄為 `~/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`，專案原路徑是另一分支且有既有修改，本批不碰該目錄。
- 成因：共用 fragment classifier 先辨識 bottom，令 `top to bottom` 的上區色句被整段移除；衣名色前綴仍存在。不是顏色選值遺失，也不是上一批 prose parser 引入。
- 採用：限定胸上衍生 context，以已解析的連身／上下色塊重新投影原衣物細節，保留唯一上區色句。原衣名不再被 runtime 上區色整件染色；固定作者色仍保留。
- 不採用：調整共用分類順序、對全套 Prompt 事後 regex 補色、刪下區選值、從舊公開文字猜色。這些方式會擴大到主工作台、其他輸出或存檔資料。
- 遮蔽優先：已標記不透明全扣內搭投影時，保持原輸出，不回填上區色；透膚可見內搭沿用既有規則。現有閉合外套的 lower portion 措辭不是本批要修的問題。
- 歷史處理：新增本批單獨基準與 exact inverse，先固定 hash 驗證再在隔離副本回到上一版。歷史入口新增本批逆轉步驟；舊 expectedHash／封存／原驗收工具不改寫。
- [實作契約](../specs/chest-dress-region-a2-v1.md)、[驗收與證據](../reports/chest-dress-region-a2-2026-10-28/README.md)。本機驗收不代表使用者驗收、Git 交付、CI 或外部生圖驗收。
