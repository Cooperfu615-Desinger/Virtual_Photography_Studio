# 創可貼造型胸貼 v1

初版使用者核准與實作日期：2026-10-05，Public output contract `1.43.0`。尺寸修訂：2026-10-06，Public output contract `1.45.0`。

## 選項與來源

在上身 (Tops) 尾端追加獨立選項「創可貼造型胸貼」，每側一枚、橫向單條。保留 X形胸貼及所有既有單品的 ID、英文與位置；新 ID 為 `wardrobe:上身-tops:創可貼造型胸貼:45`，單人與雙人 A/B 共用。不新增欄位或 storage schema。

正式來源在 `knowledge_base/wardrobe_and_styling.md`：

> two small finger-bandage-sized adhesive strips, each approximately 4 cm long and 1 cm wide, one horizontal strip centered on each breast, two strips total, thin flexible opaque fabric lying flush against the skin, rounded ends, subtle pad and perforation details, slightly varied natural placement angles

每枚約長 4 公分、寬 1 公分，以手指用創可貼作為尺寸錨點；每側一枚橫向單條，總共兩枚。薄而柔軟的不透明布料平貼肌膚，圓角兩端，墊片與細孔退居次要細節。保留自然角度差異，不要求死板對稱；不改成 X 形或交叉雙條。不指定固定顏色、人物體態、姿勢、傷口或醫療用途；沿用上身配色與圖案。必要尺寸、數量及貼合細節沿用已核准的小面積單品字數例外。

## 生成與相容性

- 精確來源判斷加入 `two small finger-bandage-sized adhesive strips`，保留舊來源辨識，不擴大至其他貼片或一般上身。
- 舊完整英文 `two separate bandage-shaped adhesive pasties, one short horizontal rounded-rectangle strip of smooth opaque fabric centered on each breast, with a central pad detail, finely perforated ends, and slightly varied casual placement angles` 保留為 `legacyPromptAliases`。舊 Prompt 回填仍解析到同一選項；歷史收藏原文不改寫，重新生成採新版來源。
- 沿用 X形胸貼的共享可見性投影與來源保留規則；三組主 Prompt、兩組胸上及全身角色照在可見時完整保留同一來源一次。五官特寫省略畫面外上身，衍生輸出重新投影。
- 排除一般上衣衣長／低腰銜接及衣襬遮下身。胸下短版緊身／合身不適用，原選值仍可儲存並於換回相容上身後恢復。
- 完整造型優先權、閉合外套遮擋、配色／圖案、雙人逐人歸屬、Saved Cards 與文字匯入沿用原規則；舊收藏不批次改寫。
- 新款加入既有上身隨機池，不另設手動限定。新增候選可能改變隨機抽取的結果，不代表明確選定的舊款來源有改變。
- 六組輸出的既有格式、GPT 結構、其他模型的組裝順序、姿勢及 Body Type 不另行調整。

## 回歸與驗收

2026-10-06 修訂新增舊完整英文回填、歷史收藏原文保留及重新生成採新版的斷言；沿用原六輸出、裁切、配色與相容案例。以下初版驗收為歷史紀錄，本次修訂驗證另見文件末節。

`bandagePasties.test.js` 覆蓋選項追加／ID、六輸出完整來源與裁切、配色／圖案、短版不適用、雙人、收藏／文字匯入及外套／完整造型優先權。新增代表性 fixture 納入 Prompt Quality gate。

`bandagePastiesBaseline.json` 是修改前凍結的 45 個既有上身選項（含全無）× 5 個景別、共 225 組 selection 及六輸出 SHA-256；不重新生成來接受變更。原 `minimalCoverageWardrobeBaseline.json` 亦保持不變。

完成門檻依 root AGENTS：資料同步與 Python／資產檢查、focused tests、前端全測試／lint／build、同 seed `200 / prompt-quality-baseline` 嚴格稽核，以及桌面／手機受影響操作與五工作區 smoke。程式／瀏覽器驗證只確認選擇、文字與操作，實際貼附角度及生成畫面仍由使用者實測確認；本次未呼叫外部圖像模型。

已通過專項 162/162、完整前端 1317/1317、Prompt Quality 566/566、lint/build、資料同步與 Python 2/2、206 個公開資產及 diff-check。嚴格稽核前後報告逐字相同，blocking 0，既有 25 項服裝／場景與 3 項近似重複診斷未增加；既有 Vite 大型 chunk 提示仍在。舊上身選項清單斷言已加入新款，修改後重新執行的完整套件全部通過。

桌面 1440×1000／手機 390×900 已驗證新選項、六組來源、複製與五工作區載入／版面，所檢查狀態無 console error/warning、破圖或頁面橫向溢出。獨立 5177 本機驗收來源新增 1 張測試卡；文字回填及修改後收藏還原通過，桌面／手機六預覽與儲存前逐字相同。正常 5175 原設定、六預覽及 9 張收藏保留，剪貼簿與 viewport 還原，暫存分頁及兩個測試伺服器已關閉。截圖 `/tmp/vps-bandage-desktop.jpg`、`/tmp/vps-bandage-mobile.jpg`。

驗證狀態：程式、資料與瀏覽器驗證完成，外部圖像效果待使用者實測。使用者已於 2026-10-05 授權本批 commit／push，交付狀態以 Git 遠端核對為準；未手動部署，原未追蹤參考資料夾保留。

## 2026-10-06 尺寸修訂驗收

- 專項 8/8、完整 frontend 1323/1323、Prompt Quality 572/572、lint/build、資料同步／check、Python 2/2、206 個公開資產與 diff-check 通過。225 組舊上身／景別六輸出及 selection 雜湊不變；兩份既有基準檔未改寫。
- `200 / prompt-quality-baseline` strict 前後報告相同：blocking 0、原有服裝／場景診斷 25 項及近似重複 3 項未增加；Vite 大型 chunk 提示仍在。
- 1440×1000／390×900 檢查新選項、六輸出各保留完整來源一次、複製、五工作區載入與版面，無新增 console warning/error、破圖或 document 橫向溢出。獨立 5177 舊測試卡仍保存初版原文，桌面／手機還原及舊英文回填後六組採新版；沒有新增或刪除收藏。
- 正常 5175 原設定／六預覽及 9 張收藏保留，5177 原六預覽亦還原；剪貼簿、viewport 還原，臨時分頁及兩個測試服務關閉。截圖 `/tmp/vps-bandage-small-desktop.png`、`/tmp/vps-bandage-small-mobile.png`。
- 使用者已於 2026-10-06 授權本次修訂 commit／push，交付狀態以 Git 遠端核對為準；未手動部署。未呼叫外部圖像模型；英文尺寸錨點及數量描述不等同影像結果保證，需使用者實測。
