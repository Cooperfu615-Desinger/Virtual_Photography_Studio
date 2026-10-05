# 創可貼造型胸貼 v1

使用者核准與實作日期：2026-10-05。Public output contract `1.43.0`。

## 選項與來源

在上身 (Tops) 尾端追加獨立選項「創可貼造型胸貼」，每側一枚、橫向單條。保留 X形胸貼及所有既有單品的 ID、英文與位置；新 ID 為 `wardrobe:上身-tops:創可貼造型胸貼:45`，單人與雙人 A/B 共用。不新增欄位或 storage schema。

正式來源在 `knowledge_base/wardrobe_and_styling.md`：

> two separate bandage-shaped adhesive pasties, one short horizontal rounded-rectangle strip of smooth opaque fabric centered on each breast, with a central pad detail, finely perforated ends, and slightly varied casual placement angles

兩枚短圓角長方形不透明布料貼片，中央墊片及兩端細小孔洞提供創可貼造型辨識。大致橫向、位置在各自胸部中央，角度略有差異，不要求死板對稱；不改成 X 形、交叉雙條或多枚貼片。不指定固定顏色、人物體態、姿勢、傷口或醫療用途；沿用上身配色與圖案。正式英文共 32 個空白分隔詞，必要款式細節採既有小面積單品的字數例外。

## 生成與相容性

- 精確來源判斷僅加入 `two separate bandage-shaped adhesive pasties`，不擴大至其他貼片或一般上身。
- 沿用 X形胸貼的共享可見性投影與來源保留規則；三組主 Prompt、兩組胸上及全身角色照在可見時完整保留同一來源一次。五官特寫省略畫面外上身，衍生輸出重新投影。
- 排除一般上衣衣長／低腰銜接及衣襬遮下身。胸下短版緊身／合身不適用，原選值仍可儲存並於換回相容上身後恢復。
- 完整造型優先權、閉合外套遮擋、配色／圖案、雙人逐人歸屬、Saved Cards 與文字匯入沿用原規則；舊收藏不批次改寫。
- 新款加入既有上身隨機池，不另設手動限定。新增候選可能改變隨機抽取的結果，不代表明確選定的舊款來源有改變。
- 六組輸出的既有格式、GPT 結構、其他模型的組裝順序、姿勢及 Body Type 不另行調整。

## 回歸與驗收

`bandagePasties.test.js` 覆蓋選項追加／ID、六輸出完整來源與裁切、配色／圖案、短版不適用、雙人、收藏／文字匯入及外套／完整造型優先權。新增代表性 fixture 納入 Prompt Quality gate。

`bandagePastiesBaseline.json` 是修改前凍結的 45 個既有上身選項（含全無）× 5 個景別、共 225 組 selection 及六輸出 SHA-256；不重新生成來接受變更。原 `minimalCoverageWardrobeBaseline.json` 亦保持不變。

完成門檻依 root AGENTS：資料同步與 Python／資產檢查、focused tests、前端全測試／lint／build、同 seed `200 / prompt-quality-baseline` 嚴格稽核，以及桌面／手機受影響操作與五工作區 smoke。程式／瀏覽器驗證只確認選擇、文字與操作，實際貼附角度及生成畫面仍由使用者實測確認；本次未呼叫外部圖像模型。

已通過專項 162/162、完整前端 1317/1317、Prompt Quality 566/566、lint/build、資料同步與 Python 2/2、206 個公開資產及 diff-check。嚴格稽核前後報告逐字相同，blocking 0，既有 25 項服裝／場景與 3 項近似重複診斷未增加；既有 Vite 大型 chunk 提示仍在。舊上身選項清單斷言已加入新款，修改後重新執行的完整套件全部通過。

桌面 1440×1000／手機 390×900 已驗證新選項、六組來源、複製與五工作區載入／版面，所檢查狀態無 console error/warning、破圖或頁面橫向溢出。獨立 5177 本機驗收來源新增 1 張測試卡；文字回填及修改後收藏還原通過，桌面／手機六預覽與儲存前逐字相同。正常 5175 原設定、六預覽及 9 張收藏保留，剪貼簿與 viewport 還原，暫存分頁及兩個測試伺服器已關閉。截圖 `/tmp/vps-bandage-desktop.jpg`、`/tmp/vps-bandage-mobile.jpg`。

驗證狀態：程式、資料與瀏覽器驗證完成，外部圖像效果待使用者實測。使用者已於 2026-10-05 授權本批 commit／push，交付狀態以 Git 遠端核對為準；未手動部署，原未追蹤參考資料夾保留。
