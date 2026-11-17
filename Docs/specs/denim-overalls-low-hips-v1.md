# 丹寧吊帶褲低掛與單邊解扣 v1

2026-11-17 使用者核准；只涉及兩款獨立褲裝，保留 She wears。開發基準 main `5e896979331421fe567807067ce490bb16f6b3de`，亦作本批 `REGISTRY_BASE_COMMIT`。不包含 commit、push 或部署。

## 來源與輸出

- `wardrobe:褲裝-pants:丹寧吊帶長褲:25`：`denim overalls worn low on the hips, one strap unfastened`。
- `wardrobe:褲裝-pants:丹寧吊帶短褲:26`：`denim short overalls worn low on the hips, one strap unfastened`。
- 只修改 `knowledge_base/catalog/Wardrobe/褲裝-pants.json` 的這兩筆英文、中文說明及追加舊全文 alias；Markdown/database 由 sync 生成。名稱、ID、順序、圖片與其他單品保持。
- 視覺語意改為低掛與單邊解扣，不再輸出舊版型／氣氛修飾。分類與抽樣語意 `meta.semantic` 保持原有 family、有序 tags；已讀取唯讀推論建議，沒有將簡化文字造成的推論減少自動套回分類。
- 七個 PAGE1 輸出從同一來源讀取。主 MJ 增加僅限這兩款的配色／完整穿法例外；衣物仍依原模式有效選值與可見性投影。獨立版型、圖案、腰線等仍遵守原 MJ 省略規則。
- 下身顏色作用於整件吊帶褲。無配色不補色；深藍色前置為 `dark blue denim ...`。鏡面鉻銀及彩色橫條紋仍依既有色彩語法描述，整段保持附屬於同一單品。雙人各自配色、共用衣物比較及單複數句型保留；`one strap unfastened` 不得被當成獨立配件。
- 例外以永久 ID 與已審核來源全文共同判定。歷史／自訂 library 的舊來源不套用新穿法例外；不重錄歷史 seals。

## 腰線與相容性

兩款的 `high-rise`／`mid-rise` 與固定低掛衝突：UI 停用這兩項，既有選值只暫停有效輸出與摘要，不清除儲存 ID。切換其他相容褲款後恢復。低腰、超低腰及解扣拉鏈微開保留原規則；既有鬆緊腰頭與大腿穿法相容機制不變。雙人按人物分別判定。

Saved Cards 結構化選值與純文字新／舊英文匯入保留；已存原文不批次重寫。其他工作區、配色責任、輸出名稱、storage keys 均不改。

## 驗證

新增 `webapp/src/lib/engine/denimOveralls.test.js`，在行為修改前確認失敗，實作後檢查七輸出、無色／深藍、腰線暫停／恢復、舊 alias、雙人配色及 MJ 單品文法；納入 Prompt Quality。

Catalog sync/check、Python schema/history、strict integrity、E 工具與完整 frontend/Prompt Quality/lint/build；前後相同 seed `prompt-quality-baseline`、200 組 strict audit。其餘褲款以固定 seed 64 組逐字／結構雜湊對照。瀏覽器桌面 1440×1000、手機 390×900 驗證兩款／顏色／腰線與下游，再 smoke 六工作區。外部模型生圖不屬本批驗證。

## 本批交付授權

使用者已驗收本批並授權只提交及推送兩款吊帶褲來源、主 MJ 配色／穿法、腰線相容處理及必要測試文件；其他未提交內容保持原樣。上方未提交／未部署記錄為本機驗證當下狀態，實際 Git 交付與部署結果以本次提交及其 Actions 執行紀錄為準。
