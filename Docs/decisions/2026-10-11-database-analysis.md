# 2026-10-11 資料庫完整分析：範圍與方法決策

- 任務：Cooper 要求針對整個資料庫的內容做完整分析，並產出優缺點與優化方向報告。
- 產出：[Docs/reports/database-analysis-2026-10-11/README.md](../reports/database-analysis-2026-10-11/README.md)
- 基準：`main` @ `0d5c990`

## 採用的決策

1. **「資料庫」的範圍**
   - 不只包含 `database.json`，也包含：
     - 它的 Markdown 來源
     - 外掛 metadata 與 manifest
     - 內嵌在程式中的目錄模組（角色卡、Pose Composer、雙人、固定構圖、環境光 overlay、MJ 名稱表）
     - PAGE3、動作姿勢與 Observation 的資料
     - engine 執行期推論出的 tags
   - 理由：後三者實際決定可選項與相容性。只看 JSON 會漏掉一半的資料語意。
2. **分區方式**
   - 分成四區並行做唯讀分析：穿搭、人物姿勢、場景光線、跨分區結構。
   - 理由：總量超過派工門檻。各分區之間的耦合點，由「結構」分區統一負責。
3. **只分析，不修正**
   - 報告中所有問題都沒有在本次修改。
   - 理由：AGENTS.md 規定「For analysis or diagnosis, inspect and report; do not silently implement a fix」，而且多數修正屬於 Prompt 契約變更，需要 Cooper 逐項核准。
4. **證據標準**
   - 數字一律由腳本實算。
   - 涉及輸出的主張以固定 seed 實跑 `generatePrompts()`。
   - 最高風險的 11 項主張，再由未參與分析的 agent 獨立複核。
5. **落檔位置**
   - 報告、分區細節與分析腳本放在 `Docs/reports/database-analysis-2026-10-11/`。
   - 理由：scratchpad 只在單一 session 有效。放進 repo 後，其他 session 或較弱的模型可以直接重跑。
   - 這些腳本是分析工具，沒有接進 CI 或 npm scripts，不影響既有測試。

## 放棄的方案

- **只分析 `database.json`**：會漏掉角色卡、姿勢、tag 推論，而這些正是主要風險所在。
- **把完整性腳本直接放進 `scripts/` 並接進 CI**：這屬於流程變更，留給報告的 Phase 0 建議，由 Cooper 決定。
- **順手修正明顯問題**（例如控制語外洩、tag 子字串比對）：違反「分析不實作」原則，而且會牽動 Prompt 契約。
