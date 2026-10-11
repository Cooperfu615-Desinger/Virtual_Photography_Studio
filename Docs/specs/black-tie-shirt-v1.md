# 領帶襯衫固定黑領帶 v1

日期：2026-10-11。Public output contract：`1.51.0`。

## 範圍與成功條件

只修改既有獨立上身「領帶襯衫」：領帶固定黑色，上身配色只修飾襯衫布料。保留選項名稱、ID、順序、隨機資格、版型／穿法、單人與 A/B、Saved Cards 和匯入資料結構。其他單品不改；不增加領帶配色欄位。

## 來源與組裝

- `knowledge_base/wardrobe_and_styling.md` 的一般來源與 `item_metadata.json` 的 `topUnderbust.baseEn` 同步指定 `short soft black necktie`，其餘來源不刪減。
- 此件新增 `wearableColorTarget: "shirt fabric"`，同步至資料庫後由既有 catalog builder 帶入 runtime meta。
- 一般及短版上身、GPT 與 MJ 共用的上色入口以同一 helper 產生布料目標片語；無配色不附片語。普通色例如 `shirt fabric in red`；進階色保留既有色票的完整顏色、表面與材質描述，但只作用於襯衫。
- GPT 保留完整有效來源；Z 維持既有精簡；MJ 額外保留已投影且仍可見的布料配色片語。不得從 raw selections 回補被遮蔽或裁切省略的領帶／襯衫。
- 適用的六組輸出使用同一解析來源。閉合不透明外套、完整造型優先權、景別投影及角色卡既有規則不變。

## 相容性

舊完整與精簡英文加入精確 `legacyPromptAliases`。舊收藏文字不改寫；舊 ID／英文重新生成時解析到同一款式，使用新版固定黑領帶。全文回填要優先從 `shirt fabric` 目標恢復上身配色，不能把領帶的黑色誤判為上身色票。

歷史 frozen fixture 不重新生成。若已核准的此件來源改動影響舊輸出 hash，只允許條件限定、精確片語的 test-only inverse；選值、RNG 與非目標款 hash 不變。新的 current-source tests 不套 inverse。

## 驗證

先補 focused regression 並確認舊版紅燈，再修改來源與 renderer。涵蓋無配色、普通色、進階色票、短版、景別、六輸出、A/B、外套遮蔽、完整造型、舊英文回填與收藏還原。修正前另凍結 405 組非目標上身的選值與六輸出 hash，修正後須完全相同。

完成 gates：focused tests、prompt quality、frontend test/lint/build、固定 count 200／seed `prompt-quality-baseline` strict audit、source sync check／Python tests／public assets，以及桌面／手機五工作區與受影響還原流程。實際圖像模型的黑領帶呈現仍需使用者實測，程式驗證不等於圖像驗收。

### 本輪程式驗證結果

- 固定黑領帶 focused：14/14；其他上身 405 案例、2,430 份輸出的選值與字串 hash 完全不變。
- Prompt quality：664/664；完整 frontend：1,507/1,507；lint、build 通過，只有既有大型 chunk 警告。
- 同 count／seed 的 strict audit 修正前後均為 0 blocking、22 diagnostic，沒有新增稽核問題。
- 資料同步／`--check` 通過；Python 2/2；public assets 206 檔通過。
- 歷史 JSON 基線不變；兩個固定白襯衫 MJ fixture 與五個舊無配色上身案例只使用精確、條件限定的 test-only inverse。
- 隔離瀏覽器：1440×1000 與 390×900，29 項功能／還原／版面檢查通過；五工作區無文件溢出、破圖、console/page errors，未送外部 POST。實際選色、六預覽、兩款短版、舊英文與收藏套用均通過；舊收藏在首次載入前植入另一隔離 context，確認原文字不被改寫。截圖與結果位於同一驗證目錄。原生選單沿用已記錄的 DOM change 測試替代方式，不宣稱新增鍵盤操作驗收。

手機既有配色色票彈窗有垂直色塊重疊，選色／關閉操作仍通過；本輪未修改 UI／CSS，不將此既有版面限制記為新增回歸或宣稱已修正。

驗證紀錄位於 `/tmp/vps-black-tie-wP28tO/`。實作驗證階段未 stage、commit、push 或部署；三份既有 dirty 文件及參考圖片保留原狀。
