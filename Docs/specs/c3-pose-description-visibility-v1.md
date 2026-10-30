# C3 現行姿勢說明護欄與六筆隱藏狀態 v1

2026-10-30；基準 main `3127c66d2f64dacc3d3fe9bcaa1015435c0670fa`。只整理現行說明契約與六筆相容選項的隱藏狀態，Cooper 已驗收通過並授權限定 commit／push；CI 與部署於交付時確認。

## 範圍與來源責任

- 現行指定動作由 specifiedActions.js 提供 54 筆具體動作的 descriptionZh；隨機／任意有各自說明；全無由 SpecifiedActionPicker.jsx 提供「不寫任何姿勢。」。測試須阻擋空白說明與重複 ID，並確認元件讀取說明。
- 手勢／頭部／視線依 pose-ui-v2 保持名稱與現有停用提示，不增添 desc、tooltip 或恢復已移除的備注。
- 舊 Pose Composer 七欄位已退出 PAGE1，部分文字仍供現行視線、頭部及拍攝方式借用。未標 uiHidden 不代表現行公開。
- 固定六筆：shared-natural-support、shared-vertical-surface-support、standing-edge-hip-support、shared-ground-support、shared-soft-surface-support、shared-bathtub。只在 meta 增加 uiHidden:true；不加 deprecated，不改 randomEligibleForBases／hiddenForBases、ID、順序、英文、中文、支撐句或 resolver。

## 相容契約

舊 engine 明確鎖值保留原解析與輸出；PAGE1 的 retirePage1PoseComposerLocks 保持既有清除政策及自拍映射。舊收藏公開原文、歷史快照與基準不改寫。隱藏標記不代表刪除或重新分類姿勢驗收狀態。

624 組修改前固定案例涵蓋全部具體動作、六 anchor 各適用 base、頭部×視線、拍攝方式及各 base 隨機 anchor，搭配六景別；比較六輸出、selection、RNG 呼叫數、normalizeLocks、收藏 roundtrip 及公開原文。before.json.gz 只能排他建立，不得重新錄製掩蓋差異。

歷史鏈只在無 .git 的隔離副本將本批來源按前後 SHA 精確還原；未知來源／正式工作目錄必須拒絕。C4 回放入口先處理 C3，再維持原 C4／B3／PAGE2／Phase 4／A2／A1／A5 斷言，不修改舊封存。

## 驗收

先跑 c3PoseGuards、C4 相鄰歷史與 test runner 聚焦測試，再跑完整前端、Prompt Quality、lint／build、同 seed 200 prompt-quality-baseline strict、目錄 sync/check 與 strict、正式 bundle 啟動。桌手機檢查姿勢分類說明、全無／隨機／任意、選取／停用狀態、舊欄位未重現，再檢查現行六工作區；不操作真實收藏或外部付費生成。

## 排除

舊未標 uiHidden 選項缺 desc 的基準清點為 95 筆（肢體32／手部27／頭部20／接觸16），不是現行公開缺漏；本批不全面補寫。六筆加標後此統計自然減少五筆，不能宣稱補完五筆說明。其餘 C 類、PAGE2 舊匯入、J12、P5b、自由支撐功能、legacy 模組搬移及出圖驗收均排除。
