# Phase 4 A2：舊文字穿搭配色還原 v1

狀態：2026-10-27，Cooper 驗收通過並授權限定提交／推送；實際 Git 與該提交 CI 結果另行核對。

基準：`471115c08e4415643b8acbb87b7c2709f98e117c`。只修正舊 Markdown、ZIP 及貼上 Prompt 的穿搭配色與必要人物歸屬。生成引擎、目錄、公開文字、JSON 選值、抓拍完整快照、UI 與儲存版本不改。完整 Markdown 選值快照、特殊穿搭來源、runtime 配色句、其他 Phase 4 及 P5b 排除。

## 還原契約

- 服裝色票不得用全段 includes 推測。完整詞／最長色票只是必要條件；還需衣物、部位或明確配色句證據。
- 優先使用完整 GPT 的 Wardrobe／Woman 1／Woman 2 區塊；沒有角色標記的雙人短文字不猜歸屬。Markdown 拼接的 Z／MJ 不得污染已有完整 GPT 證據。
- 明確主色、對比色、固定色與完整色系各自判定；source 已固定的黑領帶／白圍裙／金屬色不是所有衣物的共用色票。無法區分預設與手動選擇時不宣稱精確 round-trip。
- 雙人衣物辨識只在同一角色區塊中進行，包含一般選項及 resolved outerwear 的後續辨識，作為配色歸屬必要前提；其餘非穿搭解析保持。
- 無證據或互相矛盾時不補色。raw parser 保留空字串，交由 buildRestoreLocks 轉成全無；既有固定黑領帶規則已明確判定的全無則原樣保留。真正的單色、雙色、材質／圖樣色票保留可辨識證據，不把所有顏色清空。
- 匯入保持原公開字串；只有使用者套用並重新生成才以還原選值產生文字。JSON 及 Observation Capture metadata 優先於文字推測。

## 驗收與歷史

先加入失敗回歸，再修改解析器。40 份前批封存無色案例逐筆驗證：18 假紅色與 2 固定白色污染不得再進入主色／對比色。正向色票矩陣、雙人角色、固定部位、材質、重複與衝突證據、舊句型／別名與截短文字另測。

以固定 Git 基準比對直接生成六輸出、structured、selection 與 RNG；還原只允許本規格列出的穿搭欄位差異，原文字及非穿搭欄位保持。新精確 inverse 在隔離副本先恢復本批，再接 A2 第二批／第一批及 A1／A5 原工具；封存 A～E 和前批證據不重錄。

執行聚焦測試、前端完整測試、Prompt Quality、lint／build、200 同 seed strict audit、catalog sync／ID／strict／Python／工具檢查。桌面 1440×1000、手機 390×900 覆蓋貼上回填、ZIP、收藏套用／重載、JSON／抓拍保護與六工作區；不呼叫外部付費服務。

## 保留限制與操作邊界

- 舊文字沒有完整選值時，不能重建原始的「隨機／全無／預設／明確選取」差異。兩個顏色詞不足以證明一組上下身配色方案；缺少完整配色句時不建立 palette。
- 裁切後看不到的衣物、未標角色的雙人短句、同部位互相衝突的顏色，都保留未知。完整選值快照仍另批。
- 既有還原會把同 ID 的連身款辨識為整合套裝，並將有效連身色移到套裝主色；本批維持此正規化規則。
- 獨立鞋襪與整套造型內建固定細節分開處理；特殊穿搭來源、生成配色句及優先權不改。
- 已保存的 JSON／抓拍 metadata 仍優先，不以新文字推測覆寫結構化選值。正式目錄、ID、aliases、schema 與八份生成物不改。

## 重現方式

使用專案 Node 22 與既有依賴；在根目錄執行下列工具，輸出位置須為本批新報告或暫存目錄，不得覆蓋 A～E 與前批封存：

```sh
node --test webapp/src/features/saved-cards/wardrobeColorRecovery.test.js webapp/src/features/saved-cards/wardrobeColorRecoveryHistory.test.js
node scripts/wardrobe_color_recovery_a2_acceptance.mjs /tmp/a2-color-recovery-acceptance
node scripts/wardrobe_color_recovery_a2_history.mjs /tmp/a2-color-recovery-history
node scripts/wardrobe_color_recovery_a2_browser.mjs /tmp/a2-color-recovery-browser
```

瀏覽器工具需先啟用正確工作目錄的 5175 服務，以及可用的 Playwright；必要時以 `PLAYWRIGHT_MODULE` 指向已安裝的模組。新 helper 及 codec/package 的精確還原由 `scripts/lib/a2WardrobeColorRecoveryPatches.json` 鎖定：來源未知、混合版本或 helper 不符時，必須在任何寫入前拒絕；只允許隔離副本。E 的舊文字案例以舊 codec 回放，現行解析另由本批回歸檢查，不能改寫 E 的 expectedHash 來通過。

完整結果與診斷見 [本批驗收報告](../reports/wardrobe-color-recovery-a2-2026-10-27/README.md)。
