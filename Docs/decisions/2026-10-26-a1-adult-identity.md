# 2026-10-26：A1 成年身份補回決策

Cooper 已授權先交付 A5 收尾，再處理順序 2 A1。A5 `ffb2e91e` 已推送且 CI 成功；Cooper 後續已授權只提交／推送本決策的 A1 修正；交付結果依該提交與 CI 核對。

## 採用方式

使用角色卡現有 `profile.identityAndBody` 的成年身份開頭，接回 PAGE1 主 GPT、胸上及全身角色照的結構化區塊。32 卡為 East Asian、Eleanor 為 demonic；沿用既有句首大寫及句點格式。直接補來源，不新增 adult／age schema，不複製整段 legacy identity，不改八個結構化欄位。

原缺口由結構化分支省略 legacy 開頭造成；不是資料庫缺少年齡，也不是獨立 Body Type 省略政策的結果。正式角色卡定義及 `legacyIdentityAndBody` 不改。

## 保留的邊界

- 舊 fallback、四個永久錨點、既有胸上 body 投影與完整全身 body 保持。
- 一般人物的全身匯入與角色卡抓拍是不同來源。角色卡仍不提供一般全身匯入 snapshot，不能藉 A1 擴張匯入資格。
- JSON 收藏保留既存六輸出；Markdown 沿用原解析契約（不新加 extras 儲存格式）。舊文可讀，回填重生適用新 renderer。
- PAGE2 自有 GPT／Z 未包含同一成年開頭的現況另列待評估；本批只覆蓋原 A1 所列 PAGE1 三種 GPT 輸出，其他四種 PAGE2 輸出也不改。
- 原歷史測試比較的是當時全文。測試端在隔離副本精確撤回本批兩處插入，其他現行程式保留；三個合併場景矩陣繼續在同一副本保護原 6,370 個唯一案例／11,934 次重用門檻。A1 現行行為另由完整固定 Git 差異驗證，不能只靠歷史回放宣稱新行為正確。

規格與可重跑方式：[A1 v1](../specs/character-adult-identity-a1-v1.md)、[報告](../reports/character-adult-identity-a1-2026-10-26/README.md)。其他 A 項、A5 尚待決雙標籤及 P5b 都未啟動。
