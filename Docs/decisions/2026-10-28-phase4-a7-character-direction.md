# A7 角色攝影方向責任決策

2026-10-28，依 Phase 4 整體授權。逐筆清單見 [review](../reports/phase4-completion-2026-10-28/a7/review.json)，契約見 [規格](../specs/phase4-a7-character-direction-v1.md)。

角色的身份、服裝及攝影表現保留；實際地點、日夜及光源由當前解析場景／光線承擔。對全部 33 張作語意審查，21 張僅刪除具體場地／時段／光源詞，12 張原樣保留。原報告的 17 張是 regex 掃描：48_G／Yuna 的 street-fashion 不屬地點，另六張漏列，見 review 的個別理由。warm／bright／cool 作既有色調表現保留，不將其推論成額外燈具。

採 ID＋完整來源限定的公開投影，而不是更新角色卡原件。這使原 en／profile／永久身份、舊 Saved Card、凍結全身匯入不被追溯改寫，未知或作者新編輯的來源亦不會被寬鬆 regex 清除。代價是未來修改 photographicDirection 時須重新審查對應 entry，不能假設此表涵蓋新角色。

主 GPT、胸上與 Nano 共用公開分組；Z、MJ、全身原本省略該段的路徑保持。抓拍沿用既有省略，PAGE2 自有模型不在此批範圍。舊卡複製／匯出仍是原文，重新生成才使用新投影；不得把兩種行為混稱為資料遷移。

固定 Git 舊引擎只替換經審查的攝影方向作獨立 oracle，比對六輸出；同時以未變更的舊引擎驗證全部結構化來源、選值、摘要和 RNG。歷史基準保持，另有 JSON／Markdown／ZIP 與桌手機消費者驗收。整體歷史回放及最終交付狀態集中於 Phase 4 收尾報告。
