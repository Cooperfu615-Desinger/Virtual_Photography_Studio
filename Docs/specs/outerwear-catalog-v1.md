# 外套資料與穿法整理 v1

日期：2026-09-27。使用者核准 D 雙肩穿法與本次清單整理；適用單人、雙人及六組共用來源輸出。

2026-10-05 穿法 v2：新增四項手動單選穿法，完全閉合改為逐項相容判斷，可保留有效衣襬關係與捲袖；既有露肩及內搭投影維持原規則。以下完全閉合「所有穿法固定全無」的歷史描述由 [外套穿法 v2](outerwear-styling-v2.md) 取代，其餘款式、ID、隨機與還原契約持續生效。

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

### 全扣上／全拉上（2026-09-29）

- 外套開合新增手動選項 `wardrobe:外套開合-outerwear-opening:fully-closed:5`，附加於既有五項之後；既有 ID、順序及隨機池不變。全部 17 款外套適用。
- 依 `outerwear.fasteners` 解析：zip 使用 `front zipper fully zipped closed`；button 使用 `all front buttons fastened`；棒球外套使用 `all front snap buttons fastened`。未宣告扣件的款式使用 `front fully fastened closed`，不指定新扣件。
- 薄紗輕薄披衣外套與蕾絲罩衫宣告 `outerwear.closedInnerLayerVisibility: through-fabric`。閉合時保留內搭、版型、配色、圖案，並說明 `inner layer visible through the closed translucent fabric`。其餘款式在渲染投影中省略內搭上身及其修飾，連身／套裝只移除被遮住的上身細節，保留下身與配件。特殊穿搭與角色卡的完整預設造型仍依既有接管規則，不新增外套覆寫；角色卡選取分層模式中的有效 PAGE1 外套可使用新開合。
- 六組輸出共用投影規則；衍生景別從原解析來源重新投影。原始衣物、顏色、外套穿法與 Saved Card selection 保留，切回其他開合即可恢復；不修改 storage schema。生成摘要與工作台摘要省略閉合時無效的露肩穿法。
- 閉合時外套穿法顯示停用的全無。UI 禁止與「雙手拉開外套」同時選用；還原資料若同時帶入兩者，以完全閉合優先，手部有效選擇為全無；隨機手部池也排除拉開外套。其餘手部、頭部及身體姿勢維持原規則。
- 不增加衣長或遮腹要求；短版外套仍可露出腹部。獨立褲裙、腰線、鞋襪、配件維持來源選擇與既有景別投影。
- 新開合及實際拉鏈／鈕扣措辭可由標準 Prompt 回填辨識；純文字不能還原未輸出的內搭，完整還原以 Saved Card selection 為準。

焦點測試：`engineOuterwearCatalog.test.js`、`engineOuterwearShoulderWear.test.js`，涵蓋六組輸出、近景、版型覆寫、雙人、歷史還原與新 prose 回填。代表案例沿用 longline-shirt shoulder fixtures。歷史 hash 檔不重建；`outerwearCatalogTestSupport.js` 只把精確已核准措辭映回舊字串，以核對其餘來源不變。

執行 AGENTS Prompt／knowledge-base completion gates，使用 200／`prompt-quality-baseline` 做前後比較，另檢查桌面與手機選取、生成、回填及五個工作區。

D 的外部模型測試由使用者在 `Docs/0927` 提供並核准；文字結構測試不等同保證每個模型每張圖都正確露出雙肩。

2026-09-29 完全閉合驗證：焦點 9/9、frontend 1101/1101、Prompt Quality 377/377、lint/build、同步／check、Python 2/2 與 diff-check 通過。200／`prompt-quality-baseline` 前後稽核紀錄相同：0 blockers、28 既有 diagnostics。1440×1000 與 390×900 檢查五工作區、六組閉合輸出、透明內搭、停用全無、手部互斥及恢復原設定；無 console warnings/errors、破圖或 document overflow。原六組預覽與 viewport 已還原，未新增／刪除 Saved Cards。外部模型生成尚待實測。
