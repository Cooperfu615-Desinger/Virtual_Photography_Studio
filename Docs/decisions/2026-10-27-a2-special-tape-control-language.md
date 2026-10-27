# A2 膠帶特殊穿搭：兩段控制語限定修正

Cooper 於 2026-10-27 核准本筆修正，不補固定紅色。基準 main `3a18fc2c2529dce38782135638ffd67c38a62187`；[規格](../specs/wardrobe-control-a2-special-tape-v1.md)。

| 原內容 | 決策 | 理由 |
| --- | --- | --- |
| palette-controlled latex-like tape strips stuck directly onto the skin | 只移除 palette-controlled | 保留乳膠般材質、膠帶及皮膚貼附資訊；移除選值操作語 |
| tape color follows complete-look palette selection | 移除完整子句 | 實際色系沿用既有共用組裝，不把 UI 控制關係送入模型 |
| 名稱「紅色亮面膠帶束帶造型」 | 名稱／ID 保留，不補 red | 有效英文未指定紅色；名稱與參考圖不構成本批新增固定色授權 |
| 全部其他服裝文字及 metadata | 原樣保留 | 不是內容改款、風格調整或語意修正 |
| 修改前完整英文 | 尾端追加歷史 alias | 保護舊全文辨識及存檔 ID；歷史公開原文不回寫 |
| complete outfit palette direction 等 runtime 句 | 保留另批 | 避免混入共用配色及還原策略修改 |

精確 before／after 與生成資料見 `scripts/lib/a2SpecialTapeReview.json`；固定 Git oracle 必須獨立核對只刪上述兩段，不能直接信任候選自證。歷史回放與正式行為分開驗收，全部原基準永久保留。完成狀態及限制以本批報告為準。實作階段未提交；Cooper 後續已確認驗收通過並授權只提交／push 本批，runtime 配色句及既有色系套用問題另批處理。

特殊穿搭原 schema 未開放 top-level legacyPromptAliases；本批僅為該分類新增既有 string-array 欄位宣告，field_mapping 三個對應清單追加該分類。無新 runtime 欄位／格式；隔離 inverse 同時精確還原這兩份管理文件，避免影響前批封存檢查。

驗收另發現單人特殊穿搭套用收藏卡時，既有 `transitionPage1Locks` 會把完整造型色系清為全無。固定 main 的九色系對照與桌手機操作均重現；本批保存／匯出原文保持，不修正這項共用狀態行為，留待後續 runtime 配色批次分析。無快照舊正文的既存辨識限制也保持，與完整英文 alias／PAGE1 快照的精確 ID 驗收分開記錄。
