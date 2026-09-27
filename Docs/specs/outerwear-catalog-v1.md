# 外套資料與穿法整理 v1

日期：2026-09-27。使用者核准 D 雙肩穿法與本次清單整理；適用單人、雙人及六組共用來源輸出。

## 清單與相容性

- 新選項為 17 款＋全無。西裝外套統一由版型控制剪裁。
- 寬鬆西裝外套、合身西裝外套、短版合身西裝外套及短版粗花呢外套保留原 ID 與歷史列，只供還原，不進入新選單或隨機池。已還原的舊款可顯示為停用選項，生成仍有效。
- 龐克皮衣改名龐克風皮衣；短版皮外套改名騎士風皮衣；長版外套改名毛呢大衣；戴帽連帽外套使用清楚的顯示名稱。舊 ID、來源 alias 與既有 Saved Cards 結構保留。
- 特殊穿搭、套裝及上身分類不變；風衣原始英文保持原設定。

## 來源責任

單品只保留款式、材質與必要辨識特徵，例如龐克皮衣的鉚釘、騎士皮衣的不對稱拉鍊、棒球外套的撞色袖與按扣。不逐項強調衣領、袖口、肩線或衣襬。飛行夾克以 nylon bomber jacket 表達。

`item_metadata.json` 的 `outerwear` 提供 `baseEn`、`defaultLength`、`defaultFit`、`fasteners`，以及必要的 `retired`／`canonicalLegacy`／`colorTargetsBody`。`stableId` 固定歷史 ID；英文更動保留 `legacyPromptAliases`。同步後 engine 將欄位放入 runtime `meta`，不新增使用者 storage 欄位。

- 版型全無：保留單品預設比例。三個歷史西裝變體以同一西裝本體加原有剪裁生成。
- 單純合身／緊身／Oversize：只覆寫剪裁，保留單品衣長。
- 長／短版複合版型：覆寫衣長及剪裁；長版約及臀，短版約胸下。歷史短版合身西裝在未指定新版版型時仍為一般 cropped，不推定胸下長度。
- 同一形容只組合一次，六組輸出共用已解析衣長及版型。
- 棒球外套配色控制衣身，袖子保持撞色，由生成模型選擇；其他外套沿用原配色流程。
- 圖案保留種類、位置與大小，刪除多餘解說；配色與圖案仍是獨立控制。

## D 穿法與開合

雙肩露出：`halfway taken off, hanging around both upper arms with both shoulders fully uncovered and both arms still in the sleeves`。

- 單肩穿法不變。
- 露肩不自動指定前襟開合；敞開穿為 `worn open at the front`。
- 正常為 `front panels resting naturally`；半扣為 `partially buttoned at the front`；半拉鍊為 `zipped halfway up, open above the zipper`。
- 全無省略對應修飾。隨機開合依 metadata fastener 相容性抽選；使用者明確指定仍保持既有覆寫行為。
- GPT 保留有效來源；Z 依既有投影精簡；MJ 保留投影中可見的單品、版型、圖案、開合、穿法，不能只在露肩時保留開合。近景不補回已裁掉的圖案。

## 驗證

焦點測試：`engineOuterwearCatalog.test.js`、`engineOuterwearShoulderWear.test.js`，涵蓋六組輸出、近景、版型覆寫、雙人、歷史還原與新 prose 回填。代表案例沿用 longline-shirt shoulder fixtures。歷史 hash 檔不重建；`outerwearCatalogTestSupport.js` 只把精確已核准措辭映回舊字串，以核對其餘來源不變。

執行 AGENTS Prompt／knowledge-base completion gates，使用 200／`prompt-quality-baseline` 做前後比較，另檢查桌面與手機選取、生成、回填及五個工作區。

D 的外部模型測試由使用者在 `Docs/0927` 提供並核准；文字結構測試不等同保證每個模型每張圖都正確露出雙肩。
