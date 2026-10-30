# C2 五筆腰鍊英文微調與保留 v1

2026-10-30；可信 main `2b60e6f605792b0e8c82a8573358105ce51e87e2`。本批兩筆微調、三筆保留；不改 renderer、ID、排序、中文、圖片、semantic、收藏儲存契約或歷史基準。其他 C 類、PAGE2 舊匯入、J12、P5b 排除。

## 核准來源

正式來源為 `knowledge_base/catalog/Wardrobe/腰部配件-waist-accessories.json`；Markdown 與 database 由 sync 產生。完整修改前後文字、永久 ID、原始記錄及保留理由列於 `scripts/lib/c2WaistReview.json`，修改前來源可由上述完整 Git SHA 追溯。

| 名稱 | 前→後詞數 | 決策與不可刪事實 |
| --- | --- | --- |
| 雙層銀鏈水晶腰鍊 | 29→27 | 刪除重複泛稱 layered jewelry，腰部／上髖落點移接 waist chain；保留銀色、雙層細鏈、不同高度、單股上的不規則淡藍半透明石頭 |
| 金色細鏈鑽石腰鍊 | 25→22 | fine linked chain 改 fine links；尾句改 subtly sparkling around…；保留金色、纖細、等距細小透明類鑽石、細微閃光與腰臀落點 |
| 雙層銀鏈愛心腰鍊 | 30→30 | 保留雙平行鏈、珠飾、前方愛心、纖細及腰臀落點；僅省一詞不足以抵銷措辭變動風險 |
| 愛心垂墜銀腰鍊 | 36→36 | 中央愛心→短鏈→較小愛心的連接層次不可縮成泛稱 pendant |
| 銀色水鑽蝴蝶腰鍊 | 32→32 | 保留雙股不同高度、低腰／上髖及位於低腰下裝之上的關係；worn above 是位置資訊。ID 仍保留歷史「腰鏈」拼字 |

兩筆新英文：

- `two-layer silver waist chain around the waist and upper hips, two delicate fine-link strands at slightly different heights, irregular pale blue translucent stone accents along one strand`
- `delicate gold waist chain, fine links with evenly spaced tiny clear diamond-like gemstone accents, subtly sparkling around the waist and upper hips`

本次重寫不授權推測新的材質、數量、顏色或裝飾關係。GPT 沿用有效完整來源，其他輸出維持既有投影／壓縮／遮蔽；不因新文字重新分配配色或改變裁切。三筆保留者整筆記錄不變。

## 相容

兩筆完整舊英文依序放入 record.legacyPromptAliases，延用既有編譯到 meta.legacyPromptAliases 的機制。只新增腰部配件分類的 schema 與欄位映射支援，不新增解析分支。舊英文貼回與 Markdown 可還原相同 ID；結構化選值、A／B 既有隔離及 first-match 規則保持。無法從純文字判定的既有角色歸屬限制不在本批擴充。

舊收藏公開原文、日期、ID、快照不批次重寫。重載顯示保存原文；使用相同選值重新生成才使用現行來源。Markdown／ZIP 共用解析的既有優先權保持，不處理 PAGE2 舊匯入。

## 長度政策

腰部配件專屬 6–16 詞優先於一般配件 4–16；對齊穿搭編寫指南 §11.4。只改腰部下限4→6，上限及其他分類不變。五筆仍 over，不能為壓到16詞繼續刪除必要資訊。三筆保留新增 necessary_structure 審閱記錄，綁定 ID、英文 SHA256、固定 Git 與本規格；原七筆例外保持。修改兩筆的明確審閱記錄在本批 review，不自動擴充全域上限。

## 驗收

1. 固定 Git 對照只允許兩筆 en 與對應舊 alias；三筆及其餘欄位完全相同。schema／sync／歷史 ID 驗證。
2. 修改前封存360組（五筆×單人／A／B×六景別×四組情境 seed），包含外套與另一角色；原 color 名稱在建立時未設到有效色系控制，現已如實命名 default-second-seed，基準不重錄。另以隔離固定來源補60組明確完整造型／上下配色×六代表景別（含牛仔／全身），斷言實際選入配色；再補30組A／B×中景／牛仔／全身可見腰部，合計450組。六輸出只允許完整來源替換及既有句首大寫，選值／RNG／收藏原文保持。
3. 新舊英文、Markdown、結構化舊收藏及 A／B ID；未知反轉來源／正式工作目錄必須拒絕，先完成全檔驗證再寫隔離副本。
4. `c2WaistPatches.json` 保留本批每個既有非文件修改檔的固定 Git 原文及前後 SHA；新工具只在隔離副本反轉本批，再使用原 C3／C4／B3／PAGE2／Phase 4／A2／A1／A5 鏈。原封存檔與舊斷言不改、不重錄。舊全檔保護另遇已上線 GPT Image 2／Pika 背景：`c2WaistHistoryContext.json` 以 main 與 `8fb4272f33f8f008df429306239f73c93e20fbee` 的雙指紋，僅在隔離歷史副本還原七個既有圖片功能檔與一個影片測試檔；VideoWorkspace 沿用既有 Pika inverse。正式 DLL 程式與測試不改，未知來源阻擋。
5. 前端全測試、品質、lint、build、同seed200筆strict audit、Python、目錄／資產與正式打包啟動；正式preview桌手機選值、輸出、儲存還原及各工作區 smoke。瀏覽器操作限制如實保留；文字／流程驗收不宣稱模型影像品質等價。

實際結果及可重跑入口見 [驗收報告](../reports/c2-waist-2026-10-30/README.md)。Cooper已驗收並授權本批限定提交／推送；CI與部署結果於交付時核對。
