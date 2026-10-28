# Phase 4 A7 角色卡攝影方向 v1

2026-10-28。依 Phase 4 整體授權處理角色卡 photographicDirection 與使用者場景／光線衝突。固定 Git 與 33 張逐筆原件、刪除詞及結果見 [review](../reports/phase4-completion-2026-10-28/a7/review.json)。

## 逐筆責任

審查全部 33 張：21 張只投影掉具體地點、日夜或指定光源，12 張保留原有 photographic style。原掃描 17 張中 48_G／Yuna 的 street-fashion 只是服裝風格，保留；另六張明確來源（Mei nocturnal、Rei convenience-store、Manami library、Soyeon lantern-lit、Bora nightclub、Miku commuter-train）原 regex 漏列，一併按同一責任修正。Olivia 移除 Tokyo 地理位置，保留 street-fashion；其餘具體詞見 review，不用寬鬆全域正則。

保留 warm／bright／cool 等既有影像色調及 soft／gritty／candid／couture 表現；它們不新增燈具、時段、場地。材質、寫實細節、四永久身份錨點、成年身份、髮色位置等內容不改。`characterProfiles.js` 原資料（含 legacy en、profile、identityAndBody）逐字保持。

## 實作與輸出

`characterPhotographicDirection.js` 綁定 ID＋完整原句，僅在 `buildCharacterCardProfileGroups` 建立公開副本時轉換。未知 ID 或來源已變更時保留原文，不能憑相似片語套用。

主 GPT／胸上／Nano 等實際使用該分組的輸出採新公開句；Z、MJ、全身角色照已省略該段的契約保持，不補新段。抓拍原本省略攝影方向仍省略；既有凍結全身來源與舊 Saved Card 公開原文不改寫。角色卡來源不被改成其他角色，不調整 PAGE2 自有模型。選值、structured 原件、摘要、RNG 及非角色路徑保持。

## 驗收

固定 Git 33 卡×各景別×場景、固定構圖、穿搭匯入／外套及抓拍；舊 engine 只替換經審查 photographicDirection 的隔離副本作獨立六輸出 oracle。目前 selection、完整 structured 原件及 RNG 與舊版精確相同；未知／edited-source 不投影。JSON／Markdown／ZIP 保留舊原文，套用採新公開投影。所有角色 source 檔與非目標產品來源雜湊保持。

完整 AGENTS 閘門、同 seed 200 audit、桌手機六工作區與消費者、原歷史鏈及其他工作目錄保護；不以文字驗收宣稱生圖外觀已評估。交付後進入 Phase 4 整體收尾，P5b 暫緩。
